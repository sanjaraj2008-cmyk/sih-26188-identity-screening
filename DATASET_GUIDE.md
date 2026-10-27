# DocuGuard AI — Dataset Preparation Guide

## 📁 Required Folder Structure

Organize your dataset images into this exact folder structure:

```
dataset/
├── train/
│   ├── real/                ← Authentic, unmodified identity documents
│   │   ├── img001.jpg
│   │   ├── img002.png
│   │   └── ...
│   ├── suspicious/          ← Re-photographed, low-quality, or slightly edited
│   │   ├── img001.jpg
│   │   └── ...
│   └── tampered/            ← Digitally forged, text-altered, photo-spliced
│       ├── img001.jpg
│       └── ...
├── val/                     ← Validation set (same subfolder structure)
│   ├── real/
│   ├── suspicious/
│   └── tampered/
└── test/                    ← (Optional) Test set for final evaluation
    ├── real/
    ├── suspicious/
    └── tampered/
```

## 📐 Recommended Dataset Sizes

| Split       | Minimum   | Recommended | Ideal        |
|-------------|-----------|-------------|--------------|
| **Train**   | 300 total | 1,000+      | 5,000+ total |
| **Val**     | 60 total  | 200+        | 1,000+ total |
| **Test**    | 60 total  | 200+        | 1,000+ total |

Aim for roughly balanced classes. If imbalanced, the training script handles
class weighting automatically.

## 🖼️ Image Requirements

- **Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`
- **Resolution**: Any size (auto-resized to 224×224 during training)
- **Orientation**: Documents should be roughly upright
- **Diversity**: Mix of scan types, camera angles, lighting conditions, 
  different document templates (Aadhaar, PAN, Passport, DL, etc.)

## 📋 Class Definitions

### `real/` — Authentic Documents
- Original, unaltered scans or photographs of physical identity documents
- Directly from a scanner, government portal download, or physical camera capture
- No post-processing beyond standard scanner software

### `suspicious/` — Ambiguous / Low-Quality
- Re-photographed from a screen (Moiré patterns)
- Heavily compressed, blurry, or poorly lit captures
- Rescanned multiple times (multi-generation copies)
- Minor post-processing (auto-brightness, auto-crop software)

### `tampered/` — Digitally Forged / Altered
- Photo spliced / replaced (different person's photo pasted)
- Text fields modified (name, date of birth, ID number edited)
- Created entirely from scratch using Photoshop, GIMP, Canva, etc.
- Clone-stamped or inpainted regions
- Date or number fields digitally altered

## 🚀 Training Command

```bash
# Install Python dependencies
pip install tensorflow tensorflowjs Pillow scikit-learn matplotlib

# Train the model (outputs to public/ai-model/ for browser loading)
python train_model.py --data ./dataset --epochs 50 --batch 32

# Train with custom settings
python train_model.py --data ./dataset --epochs 100 --batch 16 --lr 0.0005

# Train and evaluate on test set
python train_model.py --data ./dataset --epochs 50 --evaluate
```

## 📊 After Training

The trained model is automatically exported to `public/ai-model/`:
- `model.json` — Model architecture
- `group1-shard*.bin` — Weight files
- `model_metadata.json` — Training metadata

Start the website with `npm run dev` and the AI model loads automatically!

## 💡 Tips for Better Accuracy

1. **More data = better accuracy** — Aim for 1,000+ images per class
2. **Diverse sources** — Include documents from different scanners, cameras, and quality levels
3. **Realistic forgeries** — Include both amateur and professional forgeries
4. **Augmentation** — The training script already includes rotation, zoom, brightness, and shift augmentation
5. **Class balance** — Try to keep classes roughly balanced (the script auto-weights if imbalanced)
