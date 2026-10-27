/**
 * DocuGuard AI — In-Browser TensorFlow.js Document Forensics Neural Network
 * 
 * Architecture: Lightweight CNN (MobileNet-inspired) for document forgery detection.
 * Runs 100% inside the browser via TensorFlow.js (WebGL/WASM backend).
 * 
 * The model accepts a 224×224×3 image tensor and outputs:
 *   - Classification: [Real, Suspicious, Tampered] (softmax probabilities)
 *   - Forgery Score: 0–100 (regression head)
 *   - Feature Heatmap: 7×7 spatial activation map for anomaly localization
 * 
 * Training is done offline via the companion training script (train_model.py).
 * The trained model is exported as TensorFlow.js LayersModel and loaded at runtime.
 */

import * as tf from '@tensorflow/tfjs';

// ─── Constants ────────────────────────────────────────────────────────────────
export const MODEL_INPUT_SIZE = 224;
export const CLASS_LABELS = ['Real', 'Suspicious', 'Tampered'] as const;
export type AIClassLabel = typeof CLASS_LABELS[number];

export interface AIModelPrediction {
  /** Top predicted class */
  verdict: AIClassLabel;
  /** Confidence for each class [Real, Suspicious, Tampered] */
  probabilities: [number, number, number];
  /** Overall forgery score 0 (authentic) to 100 (heavily tampered) */
  forgeryScore: number;
  /** 7×7 spatial anomaly heatmap (flattened to 49 values, each 0–1) */
  anomalyHeatmap: number[];
  /** Whether the AI model was used (true) or fallback heuristic (false) */
  modelLoaded: boolean;
  /** Inference time in milliseconds */
  inferenceTimeMs: number;
}

export interface AIFeatureVector {
  /** Raw feature embedding from the penultimate layer (128-d) */
  embedding: Float32Array;
}

// ─── Singleton Model Manager ──────────────────────────────────────────────────

class DocuGuardAIModel {
  private model: tf.LayersModel | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private _isReady = false;

  /** Path to the TensorFlow.js model files (model.json + weight shards) */
  private modelPath = '/ai-model/model.json';

  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Load the trained model. Safe to call multiple times — only loads once.
   * Returns true if model loaded successfully, false if unavailable.
   */
  async load(customPath?: string): Promise<boolean> {
    if (this._isReady && this.model) return true;
    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return this._isReady;
    }

    this.isLoading = true;
    const path = customPath || this.modelPath;

    this.loadPromise = (async () => {
      try {
        // Ensure TF.js backend is initialized
        await tf.ready();
        console.log(`[DocuGuard AI] TF.js backend: ${tf.getBackend()}`);
        console.log(`[DocuGuard AI] Loading model from: ${path}`);

        try {
          this.model = await tf.loadLayersModel(path);
        } catch (initialErr) {
          console.warn('[DocuGuard AI] Initial load failed on active backend, attempting CPU fallback:', initialErr);
          await tf.setBackend('cpu');
          await tf.ready();
          this.model = await tf.loadLayersModel(path);
        }

        this._isReady = true;
        console.log('[DocuGuard AI] Model loaded successfully');
        
        // Warm up with a dummy inference
        tf.tidy(() => {
          const dummy = tf.zeros([1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3]);
          const warmup = this.model?.predict(dummy);
          if (Array.isArray(warmup)) {
            warmup.forEach(t => t.dispose());
          } else if (warmup) {
            (warmup as tf.Tensor).dispose();
          }
        });
        console.log('[DocuGuard AI] Warmup inference complete');

      } catch (err) {
        console.warn('[DocuGuard AI] Model could not be initialized — using pixel and metadata heuristics:', err);
        this._isReady = false;
        this.model = null;
      } finally {
        this.isLoading = false;
      }
    })();

    await this.loadPromise;
    return this._isReady;
  }

  /**
   * Preprocess an HTMLImageElement or HTMLCanvasElement into a normalized tensor
   */
  preprocessImage(source: HTMLImageElement | HTMLCanvasElement): tf.Tensor4D {
    const width = 'naturalWidth' in source ? (source.naturalWidth || source.width) : source.width;
    const height = 'naturalHeight' in source ? (source.naturalHeight || source.height) : source.height;

    if (!width || !height) {
      throw new Error('Image source is not ready or has zero dimensions.');
    }

    return tf.tidy(() => {
      // Convert to tensor
      let tensor = tf.browser.fromPixels(source);

      // Resize to model input size using bilinear interpolation
      tensor = tf.image.resizeBilinear(
        tensor as tf.Tensor3D,
        [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]
      );

      // Normalize to [-1, 1] (MobileNet-style normalization)
      const normalized = tensor.toFloat().div(127.5).sub(1.0);

      // Add batch dimension: [1, 224, 224, 3]
      return normalized.expandDims(0) as tf.Tensor4D;
    });
  }

  /**
   * Run inference on a document image.
   * Returns AI predictions if model is loaded, or null if model unavailable.
   */
  async predict(source: HTMLImageElement | HTMLCanvasElement): Promise<AIModelPrediction | null> {
    if (!this._isReady || !this.model) {
      // Attempt on-demand load if not yet initialized
      const ready = await this.load();
      if (!ready || !this.model) {
        return null;
      }
    }

    const startTime = performance.now();
    let inputTensor: tf.Tensor4D | null = null;
    let classTensor: tf.Tensor | null = null;
    let scoreTensor: tf.Tensor | null = null;
    let heatmapTensor: tf.Tensor | null = null;

    try {
      inputTensor = this.preprocessImage(source);

      // Model outputs: [classificationTensor, scoreTensor, heatmapTensor]
      const outputs = this.model.predict(inputTensor);

      let classProbs: Float32Array;
      let forgeryScoreRaw: number;
      let heatmapData: Float32Array;

      if (Array.isArray(outputs)) {
        // Multi-output model: [classification, score, heatmap]
        [classTensor, scoreTensor, heatmapTensor] = outputs;

        classProbs = new Float32Array(await classTensor.data());
        const scoreData = await scoreTensor.data();
        forgeryScoreRaw = scoreData[0];
        heatmapData = new Float32Array(await heatmapTensor.data());
      } else {
        // Single-output model (classification only) — derive score from probs
        classTensor = outputs as tf.Tensor;
        classProbs = new Float32Array(await classTensor.data());
        forgeryScoreRaw = classProbs[0] * 5 + classProbs[1] * 50 + classProbs[2] * 95;
        heatmapData = new Float32Array(49).fill(0);
      }

      const inferenceTimeMs = performance.now() - startTime;

      // Determine verdict from probabilities
      const maxIdx = classProbs.indexOf(Math.max(...classProbs));
      const verdict = CLASS_LABELS[maxIdx] || 'Real';

      // Clamp forgery score
      const forgeryScore = Math.round(Math.max(0, Math.min(100, forgeryScoreRaw)));

      return {
        verdict,
        probabilities: [classProbs[0] || 0, classProbs[1] || 0, classProbs[2] || 0],
        forgeryScore,
        anomalyHeatmap: Array.from(heatmapData),
        modelLoaded: true,
        inferenceTimeMs: Math.round(inferenceTimeMs)
      };
    } catch (err) {
      console.error('[DocuGuard AI] Inference encountered an error:', err);
      return null;
    } finally {
      // Guaranteed tensor disposal to prevent GPU memory leaks
      try {
        inputTensor?.dispose();
        classTensor?.dispose();
        scoreTensor?.dispose();
        heatmapTensor?.dispose();
      } catch {
        // ignore disposal errors
      }
    }
  }

  /**
   * Extract the 128-d feature embedding from the penultimate dense layer.
   * Useful for similarity search and dataset curation.
   */
  async extractFeatures(source: HTMLImageElement | HTMLCanvasElement): Promise<AIFeatureVector | null> {
    if (!this._isReady || !this.model) return null;

    try {
      // Create an intermediate model that outputs the embedding layer
      const embeddingLayerName = 'embedding_dense';
      const embeddingLayer = this.model.getLayer(embeddingLayerName);
      if (!embeddingLayer) {
        console.warn('[DocuGuard AI] Embedding layer not found in model');
        return null;
      }

      const featureModel = tf.model({
        inputs: this.model.input as tf.SymbolicTensor,
        outputs: embeddingLayer.output as tf.SymbolicTensor
      });

      const inputTensor = this.preprocessImage(source);
      const embeddingTensor = featureModel.predict(inputTensor) as tf.Tensor;
      const embedding = new Float32Array(await embeddingTensor.data());

      inputTensor.dispose();
      embeddingTensor.dispose();
      featureModel.dispose();

      return { embedding };
    } catch (err) {
      console.error('[DocuGuard AI] Feature extraction failed:', err);
      return null;
    }
  }

  /**
   * Generate a Grad-CAM-style anomaly overlay from the heatmap output.
   * Returns a data URL of the heatmap overlaid on the original image.
   */
  generateHeatmapOverlay(
    sourceImage: HTMLImageElement,
    heatmap: number[],
    gridSize: number = 7
  ): string {
    const width = sourceImage.naturalWidth || sourceImage.width;
    const height = sourceImage.naturalHeight || sourceImage.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw original image
    ctx.drawImage(sourceImage, 0, 0);

    // Overlay heatmap
    const cellW = width / gridSize;
    const cellH = height / gridSize;

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const val = heatmap[gy * gridSize + gx];
        if (val > 0.15) {
          // Color mapping: green (low) → yellow → red (high)
          const r = val > 0.5 ? 255 : Math.round(val * 2 * 255);
          const g = val < 0.5 ? 255 : Math.round((1 - val) * 2 * 255);
          const alpha = Math.min(0.65, val * 0.8);

          ctx.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`;
          ctx.fillRect(
            Math.floor(gx * cellW),
            Math.floor(gy * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH)
          );
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(width, i * cellH);
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  }

  /** Dispose the model and free GPU/WebGL memory */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this._isReady = false;
    }
  }
}

// ─── Export Singleton ─────────────────────────────────────────────────────────

export const docuGuardAI = new DocuGuardAIModel();

// ─── Utility: Build the CNN Model Architecture (for training scripts) ─────────

/**
 * Creates the DocuGuard forensic CNN architecture in TensorFlow.js.
 * This is used by the training script to define the model.
 * 
 * Architecture summary:
 *   Input: 224×224×3
 *   Conv2D(32, 3×3) → BN → ReLU → MaxPool
 *   Conv2D(64, 3×3) → BN → ReLU → MaxPool
 *   Conv2D(128, 3×3) → BN → ReLU → MaxPool
 *   Conv2D(256, 3×3) → BN → ReLU → MaxPool  (spatial: 14×14)
 *   Conv2D(256, 3×3) → BN → ReLU              (spatial: 14×14)
 *   Conv2D(128, 1×1) → BN → ReLU → AvgPool   (spatial: 7×7)  ← heatmap source
 *   GlobalAvgPool → Dense(128) → Dropout(0.4)
 *   Output heads:
 *     classification: Dense(3, softmax)   → [Real, Suspicious, Tampered]
 *     forgery_score:  Dense(1, sigmoid)*100 → [0–100]
 *     heatmap:        Flatten(7×7)         → [49 values, 0–1]
 */
export function buildDocuGuardCNN(): tf.LayersModel {
  const input = tf.input({ shape: [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3], name: 'image_input' });

  // Block 1
  let x = tf.layers.conv2d({ filters: 32, kernelSize: 3, padding: 'same', activation: 'relu', name: 'conv1' }).apply(input) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'bn1' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: 2, name: 'pool1' }).apply(x) as tf.SymbolicTensor; // 112×112

  // Block 2
  x = tf.layers.conv2d({ filters: 64, kernelSize: 3, padding: 'same', activation: 'relu', name: 'conv2' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'bn2' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: 2, name: 'pool2' }).apply(x) as tf.SymbolicTensor; // 56×56

  // Block 3
  x = tf.layers.conv2d({ filters: 128, kernelSize: 3, padding: 'same', activation: 'relu', name: 'conv3' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'bn3' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: 2, name: 'pool3' }).apply(x) as tf.SymbolicTensor; // 28×28

  // Block 4
  x = tf.layers.conv2d({ filters: 256, kernelSize: 3, padding: 'same', activation: 'relu', name: 'conv4' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'bn4' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: 2, name: 'pool4' }).apply(x) as tf.SymbolicTensor; // 14×14

  // Block 5 (maintain spatial resolution for heatmap)
  x = tf.layers.conv2d({ filters: 256, kernelSize: 3, padding: 'same', activation: 'relu', name: 'conv5' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'bn5' }).apply(x) as tf.SymbolicTensor;

  // Block 6 — Reduce to 7×7 spatial for heatmap
  x = tf.layers.conv2d({ filters: 128, kernelSize: 1, padding: 'same', activation: 'relu', name: 'conv6_reduce' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.batchNormalization({ name: 'bn6' }).apply(x) as tf.SymbolicTensor;
  const featureMap = tf.layers.averagePooling2d({ poolSize: 2, name: 'pool6' }).apply(x) as tf.SymbolicTensor; // 7×7×128

  // ─── Heatmap Head ──────────────────────────────────────────────────
  // Reduce channel dimension to 1, then flatten to 49
  const heatmapConv = tf.layers.conv2d({
    filters: 1, kernelSize: 1, activation: 'sigmoid', name: 'heatmap_conv'
  }).apply(featureMap) as tf.SymbolicTensor; // 7×7×1

  const heatmapOutput = tf.layers.flatten({ name: 'heatmap_output' }).apply(heatmapConv) as tf.SymbolicTensor; // 49

  // ─── Classification + Score Heads ──────────────────────────────────
  const globalPool = tf.layers.globalAveragePooling2d({ name: 'global_pool' }).apply(featureMap) as tf.SymbolicTensor; // 128

  const embedding = tf.layers.dense({ units: 128, activation: 'relu', name: 'embedding_dense' }).apply(globalPool) as tf.SymbolicTensor;
  const dropped = tf.layers.dropout({ rate: 0.4, name: 'dropout' }).apply(embedding) as tf.SymbolicTensor;

  // Classification output: 3 classes
  const classOutput = tf.layers.dense({
    units: 3, activation: 'softmax', name: 'classification_output'
  }).apply(dropped) as tf.SymbolicTensor;

  // Forgery score output: single value 0–1 (scaled to 0–100 in post-processing)
  const scoreOutput = tf.layers.dense({
    units: 1, activation: 'sigmoid', name: 'score_output'
  }).apply(dropped) as tf.SymbolicTensor;

  const model = tf.model({
    inputs: input,
    outputs: [classOutput, scoreOutput, heatmapOutput],
    name: 'DocuGuard_Forensic_CNN'
  });

  return model;
}
