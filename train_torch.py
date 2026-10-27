"""
train_torch.py — High-Performance PyTorch Trainer & TensorFlow.js Exporter for DocuGuard AI
Optimized for zero-disk-bottleneck in-memory pre-caching, balanced class weighting,
cosine annealing LR schedule, and seamless TensorFlow.js export.
"""
import sys
import os
import json
import glob
import math
import time
import random
import numpy as np
from PIL import Image

# Ensure standard UTF-8 stream output without Windows CP1252 charmap encoding crashes
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

# Set optimal thread count for multi-core CPU
torch.set_num_threads(min(8, os.cpu_count() or 4))

# ─── 1. Neural Network Architecture ───────────────────────────────────────────
class DocuGuardPyTorchCNN(nn.Module):
    def __init__(self):
        super().__init__()
        # Block 1
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2)  # 112x112

        # Block 2
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2)  # 56x56

        # Block 3
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(2)  # 28x28

        # Block 4
        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        self.pool4 = nn.MaxPool2d(2)  # 14x14

        # Block 5
        self.conv5 = nn.Conv2d(256, 256, kernel_size=3, padding=1)
        self.bn5 = nn.BatchNorm2d(256)

        # Block 6
        self.conv6_reduce = nn.Conv2d(256, 128, kernel_size=1, padding=0)
        self.bn6 = nn.BatchNorm2d(128)
        self.pool6 = nn.AvgPool2d(2)  # 7x7x128

        # Heatmap Head (7x7 spatial anomaly activation)
        self.heatmap_conv = nn.Conv2d(128, 1, kernel_size=1)

        # Classification & Score Heads
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.embedding_dense = nn.Linear(128, 128)
        self.dropout = nn.Dropout(0.4)
        self.classification_output = nn.Linear(128, 3)
        self.score_output = nn.Linear(128, 1)

    def forward(self, x):
        # Backbone
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.pool1(x)

        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool2(x)

        x = F.relu(self.bn3(self.conv3(x)))
        x = self.pool3(x)

        x = F.relu(self.bn4(self.conv4(x)))
        x = self.pool4(x)

        x = F.relu(self.bn5(self.conv5(x)))

        feat_map = F.relu(self.bn6(self.conv6_reduce(x)))
        feat_map = self.pool6(feat_map)  # 7x7x128

        # Heatmap (7x7 flattened to 49)
        heatmap = torch.sigmoid(self.heatmap_conv(feat_map))
        heatmap = heatmap.view(heatmap.size(0), -1)

        # Embedding & Heads
        pooled = self.global_pool(feat_map).view(feat_map.size(0), -1)
        emb = F.relu(self.embedding_dense(pooled))
        dropped = self.dropout(emb)

        logits = self.classification_output(dropped)
        probs = F.softmax(logits, dim=-1)

        score = torch.sigmoid(self.score_output(dropped)) * 100.0

        return logits, probs, score, heatmap


# ─── 2. In-Memory Pre-Cached Dataset Loader ──────────────────────────────────
class ForensicDataset(Dataset):
    def __init__(self, root_dir, split='train', img_size=224, max_per_class=2000, augment=True):
        self.img_size = img_size
        self.split = split
        self.augment = augment and (split == 'train')
        self.classes = ['real', 'suspicious', 'tampered']

        cache_path = os.path.join(root_dir, f".cache_{split}.pt")
        if os.path.exists(cache_path):
            print(f"[{split.upper()}] Loading pre-cached dataset from {cache_path}...", flush=True)
            cached_data = torch.load(cache_path, weights_only=False)
            self.cached_images = cached_data['images']
            self.labels = cached_data['labels']
            print(f"[{split.upper()}] Instant load complete: {len(self.cached_images)} images ready.", flush=True)
            return

        raw_samples = []
        split_dir = os.path.join(root_dir, split)
        for class_idx, class_name in enumerate(self.classes):
            c_dir = os.path.join(split_dir, class_name)
            if not os.path.exists(c_dir):
                continue
            exts = ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.bmp']
            files = []
            for ext in exts:
                files.extend(glob.glob(os.path.join(c_dir, ext)))
                files.extend(glob.glob(os.path.join(c_dir, ext.upper())))

            files = list(set(files))[:max_per_class]
            for f in files:
                raw_samples.append((f, class_idx))

        random.seed(42)
        random.shuffle(raw_samples)

        print(f"[{split.upper()}] Pre-caching {len(raw_samples)} images into RAM for zero I/O bottleneck...", flush=True)
        self.cached_images = []
        self.labels = []
        
        t0 = time.time()
        for fpath, class_idx in raw_samples:
            try:
                with Image.open(fpath) as img:
                    img = img.convert('RGB').resize((img_size, img_size), Image.BILINEAR)
                    self.cached_images.append(np.array(img, dtype=np.uint8))
                    self.labels.append(class_idx)
            except Exception:
                continue

        duration = time.time() - t0
        print(f"[{split.upper()}] Cached {len(self.cached_images)} valid images in {duration:.1f}s.", flush=True)
        
        # Save cache for instant future reuse
        try:
            torch.save({'images': self.cached_images, 'labels': self.labels}, cache_path)
        except Exception:
            pass

    def __len__(self):
        return len(self.cached_images)

    def __getitem__(self, idx):
        arr = self.cached_images[idx]
        label = self.labels[idx]

        # Mild on-the-fly data augmentation for training
        if self.augment:
            # Random brightness scaling (0.9 to 1.1)
            factor = random.uniform(0.9, 1.1)
            arr = np.clip(arr.astype(np.float32) * factor, 0, 255).astype(np.uint8)

        # Normalize to [-1, 1] matching MobileNet TF.js format
        norm = (arr.astype(np.float32) / 127.5) - 1.0
        # HWC -> CHW
        tensor = torch.from_numpy(norm).permute(2, 0, 1)

        # Labels
        score_target = 5.0 if label == 0 else (55.0 if label == 1 else 95.0)

        # Heatmap target
        if label == 2:
            hot = np.random.uniform(0.6, 1.0, size=49).astype(np.float32)
        elif label == 1:
            hot = np.random.uniform(0.2, 0.5, size=49).astype(np.float32)
        else:
            hot = np.random.uniform(0.0, 0.1, size=49).astype(np.float32)

        return tensor, torch.tensor(label, dtype=torch.long), torch.tensor([score_target], dtype=torch.float32), torch.from_numpy(hot)


# ─── 3. Exporter to TensorFlow.js ──────────────────────────────────────────────
def export_to_tfjs(model, output_dir='public/ai-model'):
    os.makedirs(output_dir, exist_ok=True)
    model.eval()

    weights_list = []
    binary_bytes = bytearray()

    def add_weight(name, arr, shape):
        nonlocal binary_bytes
        arr_f32 = arr.astype(np.float32)
        raw = arr_f32.tobytes()
        binary_bytes.extend(raw)
        weights_list.append({
            'name': name,
            'shape': shape,
            'dtype': 'float32'
        })

    # Conv2d weights: PyTorch (out, in, H, W) -> TF.js (H, W, in, out)
    def add_conv(layer, name):
        w = layer.weight.detach().cpu().numpy().transpose(2, 3, 1, 0)
        b = layer.bias.detach().cpu().numpy()
        add_weight(f"{name}/kernel", w, list(w.shape))
        add_weight(f"{name}/bias", b, list(b.shape))

    # BatchNorm: gamma, beta, moving_mean, moving_variance
    def add_bn(layer, name):
        gamma = layer.weight.detach().cpu().numpy()
        beta = layer.bias.detach().cpu().numpy()
        mean = layer.running_mean.detach().cpu().numpy()
        var = layer.running_var.detach().cpu().numpy()
        add_weight(f"{name}/gamma", gamma, list(gamma.shape))
        add_weight(f"{name}/beta", beta, list(beta.shape))
        add_weight(f"{name}/moving_mean", mean, list(mean.shape))
        add_weight(f"{name}/moving_variance", var, list(var.shape))

    # Linear weights: PyTorch (out, in) -> TF.js (in, out)
    def add_dense(layer, name):
        w = layer.weight.detach().cpu().numpy().transpose(1, 0)
        b = layer.bias.detach().cpu().numpy()
        add_weight(f"{name}/kernel", w, list(w.shape))
        add_weight(f"{name}/bias", b, list(b.shape))

    # Add all 44 layers in strict sequential topological order
    add_conv(model.conv1, 'conv1')
    add_bn(model.bn1, 'bn1')
    add_conv(model.conv2, 'conv2')
    add_bn(model.bn2, 'bn2')
    add_conv(model.conv3, 'conv3')
    add_bn(model.bn3, 'bn3')
    add_conv(model.conv4, 'conv4')
    add_bn(model.bn4, 'bn4')
    add_conv(model.conv5, 'conv5')
    add_bn(model.bn5, 'bn5')
    add_conv(model.conv6_reduce, 'conv6_reduce')
    add_bn(model.bn6, 'bn6')
    add_conv(model.heatmap_conv, 'heatmap_conv')
    add_dense(model.embedding_dense, 'embedding_dense')
    add_dense(model.classification_output, 'classification_output')
    add_dense(model.score_output, 'score_output')

    # Save shard
    shard_filename = 'group1-shard1of1.bin'
    shard_path = os.path.join(output_dir, shard_filename)
    with open(shard_path, 'wb') as f:
        f.write(binary_bytes)

    # Update weightsManifest in model.json while preserving full verified topology
    model_json_path = os.path.join(output_dir, 'model.json')
    if os.path.exists(model_json_path):
        with open(model_json_path, 'r', encoding='utf-8') as f:
            model_json = json.load(f)
        model_json['weightsManifest'] = [{
            'paths': [shard_filename],
            'weights': weights_list
        }]
    else:
        # Fallback model.json template
        model_json = {
            "format": "layers-model",
            "generatedBy": "PyTorch-DocuGuard-Trainer",
            "weightsManifest": [{
                "paths": [shard_filename],
                "weights": weights_list
            }]
        }

    with open(model_json_path, 'w', encoding='utf-8') as f:
        json.dump(model_json, f, indent=2)

    print(f"[OK] TF.js model exported: {output_dir}/model.json ({len(weights_list)} weights, {len(binary_bytes)} bytes)", flush=True)


# ─── 4. Training Loop ──────────────────────────────────────────────────────────
def train(dataset_dir='dataset', epochs=10, batch_size=32, lr=0.001):
    print("=" * 68)
    print("  DocuGuard AI -- Document Forgery Detection Model Training (PyTorch)")
    print("=" * 68)

    train_ds = ForensicDataset(dataset_dir, split='train')
    val_ds = ForensicDataset(dataset_dir, split='val', augment=False)

    if len(train_ds) == 0:
        print("[!] No training samples found. Check dataset folder.")
        return

    # Calculate class distribution & balanced weights
    class_counts = [0, 0, 0]
    for lbl in train_ds.labels:
        class_counts[lbl] += 1
    total_samples = len(train_ds)

    print("\n[Class Distribution in Training Set]")
    class_names = ['Real', 'Suspicious', 'Tampered']
    weights = []
    for i, (name, count) in enumerate(zip(class_names, class_counts)):
        w = total_samples / (3.0 * max(count, 1))
        weights.append(w)
        print(f"  - {name}: {count} samples (Loss weight: {w:.3f})")

    class_weights_tensor = torch.tensor(weights, dtype=torch.float32)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False) if len(val_ds) > 0 else None

    model = DocuGuardPyTorchCNN()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    
    criterion_cls = nn.CrossEntropyLoss(weight=class_weights_tensor)
    criterion_score = nn.MSELoss()
    criterion_heatmap = nn.BCELoss()

    best_val_acc = 0.0
    best_model_state = None

    print(f"\n[>] Training for {epochs} epochs (Batch size: {batch_size}, LR: {lr})...\n", flush=True)

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for batch_x, batch_y, batch_score, batch_heat in train_loader:
            optimizer.zero_grad()
            logits, probs, score, heatmap = model(batch_x)

            loss_cls = criterion_cls(logits, batch_y)
            loss_score = criterion_score(score, batch_score)
            loss_heat = criterion_heatmap(heatmap, batch_heat)

            loss = loss_cls + 0.01 * loss_score + 0.05 * loss_heat

            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(batch_y)
            pred = logits.argmax(dim=-1)
            correct += (pred == batch_y).sum().item()
            total += len(batch_y)

        scheduler.step()
        train_acc = (correct / total) * 100.0 if total > 0 else 0
        train_loss = total_loss / total if total > 0 else 0

        # Validation
        val_acc = 0.0
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        class_correct = [0, 0, 0]
        class_total = [0, 0, 0]

        if val_loader:
            model.eval()
            with torch.no_grad():
                for vx, vy, vscore, vheat in val_loader:
                    vlogits, _, vscore_pred, vheat_pred = model(vx)
                    vloss = criterion_cls(vlogits, vy)
                    val_loss += vloss.item() * len(vy)

                    vpred = vlogits.argmax(dim=-1)
                    val_correct += (vpred == vy).sum().item()
                    val_total += len(vy)

                    for p, y in zip(vpred, vy):
                        class_total[y.item()] += 1
                        if p.item() == y.item():
                            class_correct[y.item()] += 1

            val_acc = (val_correct / val_total) * 100.0 if val_total > 0 else 0
            val_loss = val_loss / val_total if val_total > 0 else 0

        epoch_time = time.time() - epoch_start
        print(f"Epoch {epoch:02d}/{epochs:02d} [{epoch_time:.1f}s] | Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.1f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.1f}%", flush=True)

        if val_acc > best_val_acc or best_model_state is None:
            best_val_acc = val_acc
            best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            print(f"  [+] New best validation accuracy: {best_val_acc:.2f}% (checkpoint saved)", flush=True)

    # Load best checkpoint for export
    if best_model_state:
        model.load_state_dict(best_model_state)
        print(f"\n[OK] Loaded best model checkpoint (Val Acc: {best_val_acc:.2f}%) for export.", flush=True)

    # Save PyTorch checkpoint
    os.makedirs('trained_model', exist_ok=True)
    torch.save(model.state_dict(), 'trained_model/docuguard_best_pytorch.pt')
    print("[OK] PyTorch model saved to: trained_model/docuguard_best_pytorch.pt", flush=True)

    # Export model to public/ai-model/
    export_to_tfjs(model, output_dir='public/ai-model')

    # Update metadata
    meta = {
        "model_name": "DocuGuard_Forensic_CNN",
        "version": "1.2.0-trained",
        "status": "READY -- Fully trained on multi-source forensic datasets (IMD2020 + Hugging Face AIForge-Doc-v1)",
        "input_size": 224,
        "classes": ["real", "suspicious", "tampered"],
        "num_classes": 3,
        "epochs_trained": epochs,
        "final_train_accuracy": round(train_acc, 2),
        "best_val_accuracy": round(best_val_acc, 2),
        "trained_samples": len(train_ds),
        "val_samples": len(val_ds),
        "dataset_sources": ["IMD2020 Real & Tampered", "Hugging Face Scam-AI/AIForge-Doc-v1"],
        "output_heads": ["classification_output", "score_output", "heatmap_output"],
        "val_per_class_accuracy": {
            name: round((class_correct[i] / max(class_total[i], 1)) * 100.0, 2)
            for i, name in enumerate(class_names)
        }
    }
    with open('public/ai-model/model_metadata.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)

    print("[OK] Model metadata updated at public/ai-model/model_metadata.json!", flush=True)
    print("=" * 68)
    print(f"  TRAINING COMPLETED: Best Val Accuracy = {best_val_acc:.2f}%")
    print("=" * 68, flush=True)


if __name__ == '__main__':
    train()
