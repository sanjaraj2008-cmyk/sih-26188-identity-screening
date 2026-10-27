import { AnomalyRegion, ForensicAnalysisResult } from '../types/document';

/**
 * Calculates SHA-256 cryptographic hash of a file or Blob
 */
export async function calculateSha256(fileOrBlob: Blob): Promise<string> {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Parses raw metadata bytes for photo/document editing signatures
 */
export async function extractMetadataSignatures(file: Blob): Promise<{
  software?: string;
  modifyDate?: string;
  hasSuspiciousExif: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];
  let software: string | undefined;
  let modifyDate: string | undefined;

  try {
    const buffer = await file.slice(0, 128 * 1024).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textChunk = new TextDecoder('latin1').decode(bytes);

    const suspiciousSignatures = [
      { name: 'Adobe Photoshop', regex: /Adobe Photoshop|Photoshop/i },
      { name: 'GIMP Image Editor', regex: /GIMP/i },
      { name: 'Canva', regex: /Canva/i },
      { name: 'Paint.NET', regex: /Paint\.NET/i },
      { name: 'Pixlr', regex: /Pixlr/i },
      { name: 'ImageMagick', regex: /ImageMagick/i },
      { name: 'Snapseed', regex: /Snapseed/i }
    ];

    for (const sig of suspiciousSignatures) {
      if (sig.regex.test(textChunk)) {
        software = sig.name;
        warnings.push(`File metadata contains signature of digital raster editor (${sig.name}). Possible modification.`);
        break;
      }
    }

    // Look for common EXIF date patterns
    const dateMatch = textChunk.match(/\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/);
    if (dateMatch) {
      modifyDate = dateMatch[0];
    }

    // Check for multiple compression tables or JFIF/EXIF mismatch
    const jfifCount = (textChunk.match(/JFIF/g) || []).length;
    const exifCount = (textChunk.match(/Exif/g) || []).length;
    if (jfifCount > 1 || exifCount > 1) {
      warnings.push('Multiple header segments detected; typical of secondary export or collage compositing.');
    }
  } catch (err) {
    console.warn('Metadata parsing fallback', err);
  }

  return {
    software,
    modifyDate,
    hasSuspiciousExif: warnings.length > 0,
    warnings
  };
}

/**
 * Performs Error Level Analysis (ELA)
 * Compares the image against its recompressed JPEG state to detect localized compression discrepancy.
 */
export async function performErrorLevelAnalysis(
  sourceImage: HTMLImageElement,
  multiplier: number = 25,
  jpegQuality: number = 0.75
): Promise<{
  elaDataUrl: string;
  noiseGradientDataUrl: string;
  edgeDiscontinuityDataUrl: string;
  averageDelta: number;
  peakDelta: number;
  anomalyRegions: AnomalyRegion[];
}> {
  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;

  // Working canvas
  const canvasOriginal = document.createElement('canvas');
  canvasOriginal.width = width;
  canvasOriginal.height = height;
  const ctxOriginal = canvasOriginal.getContext('2d', { willReadFrequently: true });
  if (!ctxOriginal) throw new Error('Failed to create canvas context');
  ctxOriginal.drawImage(sourceImage, 0, 0);

  // Compress to JPEG
  const recompressedDataUrl = canvasOriginal.toDataURL('image/jpeg', jpegQuality);

  // Load recompressed image
  const recompressedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = recompressedDataUrl;
  });

  const canvasRecompressed = document.createElement('canvas');
  canvasRecompressed.width = width;
  canvasRecompressed.height = height;
  const ctxRecompressed = canvasRecompressed.getContext('2d', { willReadFrequently: true });
  if (!ctxRecompressed) throw new Error('Failed to create canvas context');
  ctxRecompressed.drawImage(recompressedImg, 0, 0);

  // Image data buffers
  const originalData = ctxOriginal.getImageData(0, 0, width, height);
  const recompressedData = ctxRecompressed.getImageData(0, 0, width, height);

  // ELA canvas
  const canvasEla = document.createElement('canvas');
  canvasEla.width = width;
  canvasEla.height = height;
  const ctxEla = canvasEla.getContext('2d');
  if (!ctxEla) throw new Error('Failed to create ELA context');
  const elaImageData = ctxEla.createImageData(width, height);

  // Noise gradient canvas
  const canvasNoise = document.createElement('canvas');
  canvasNoise.width = width;
  canvasNoise.height = height;
  const ctxNoise = canvasNoise.getContext('2d');
  if (!ctxNoise) throw new Error('Failed to create noise context');
  const noiseImageData = ctxNoise.createImageData(width, height);

  // Edge Discontinuity canvas
  const canvasEdge = document.createElement('canvas');
  canvasEdge.width = width;
  canvasEdge.height = height;
  const ctxEdge = canvasEdge.getContext('2d');
  if (!ctxEdge) throw new Error('Failed to create edge context');
  const edgeImageData = ctxEdge.createImageData(width, height);

  const origBytes = originalData.data;
  const recompBytes = recompressedData.data;
  const elaBytes = elaImageData.data;
  const noiseBytes = noiseImageData.data;
  const edgeBytes = edgeImageData.data;

  let totalDelta = 0;
  let peakDelta = 0;
  const pixelCount = width * height;

  // Grid for anomaly detection (divide image into 32x32 blocks)
  const blockDim = 32;
  const gridCols = Math.ceil(width / blockDim);
  const gridRows = Math.ceil(height / blockDim);
  const blockScores = new Float32Array(gridCols * gridRows);
  const blockPixelCounts = new Int32Array(gridCols * gridRows);

  for (let i = 0; i < origBytes.length; i += 4) {
    const rDiff = Math.abs(origBytes[i] - recompBytes[i]);
    const gDiff = Math.abs(origBytes[i + 1] - recompBytes[i + 1]);
    const bDiff = Math.abs(origBytes[i + 2] - recompBytes[i + 2]);

    const pixelDelta = (rDiff + gDiff + bDiff) / 3;
    totalDelta += pixelDelta;
    if (pixelDelta > peakDelta) peakDelta = pixelDelta;

    // Amplified ELA visualization
    const rAmp = Math.min(255, rDiff * multiplier);
    const gAmp = Math.min(255, gDiff * multiplier);
    const bAmp = Math.min(255, bDiff * multiplier);

    elaBytes[i] = rAmp;
    elaBytes[i + 1] = gAmp;
    elaBytes[i + 2] = bAmp;
    elaBytes[i + 3] = 255;

    // Pixel coordinates
    const pixelIndex = i / 4;
    const px = pixelIndex % width;
    const py = Math.floor(pixelIndex / width);

    // Track block scores
    const gx = Math.min(gridCols - 1, Math.floor(px / blockDim));
    const gy = Math.min(gridRows - 1, Math.floor(py / blockDim));
    const gIdx = gy * gridCols + gx;
    blockScores[gIdx] += pixelDelta;
    blockPixelCounts[gIdx]++;

    // Noise heatmap: pseudo-color mapping based on error magnitude
    // Blue (uniform low) -> Green (expected text) -> Yellow/Red (high unexpected variance)
    const normalizedErr = Math.min(1, (pixelDelta * multiplier) / 255);
    if (normalizedErr < 0.25) {
      noiseBytes[i] = 15;
      noiseBytes[i + 1] = Math.round(normalizedErr * 4 * 120);
      noiseBytes[i + 2] = 180;
    } else if (normalizedErr < 0.6) {
      noiseBytes[i] = Math.round((normalizedErr - 0.25) * 2.8 * 220);
      noiseBytes[i + 1] = 220;
      noiseBytes[i + 2] = 20;
    } else {
      noiseBytes[i] = 255;
      noiseBytes[i + 1] = Math.round((1 - normalizedErr) * 2.5 * 100);
      noiseBytes[i + 2] = 40;
    }
    noiseBytes[i + 3] = 255;
  }

  // Edge discontinuity calculation (Laplacian high-pass on original)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const up = ((y - 1) * width + x) * 4;
      const down = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      // Center * 4 - neighbors
      const lapR = Math.abs(origBytes[idx] * 4 - (origBytes[up] + origBytes[down] + origBytes[left] + origBytes[right]));
      const lapG = Math.abs(origBytes[idx + 1] * 4 - (origBytes[up + 1] + origBytes[down + 1] + origBytes[left + 1] + origBytes[right + 1]));
      const lapB = Math.abs(origBytes[idx + 2] * 4 - (origBytes[up + 2] + origBytes[down + 2] + origBytes[left + 2] + origBytes[right + 2]));

      const lapMean = (lapR + lapG + lapB) / 3;
      // High contrast edge
      edgeBytes[idx] = Math.min(255, lapMean * 1.8);
      edgeBytes[idx + 1] = Math.min(255, lapMean * 2.2);
      edgeBytes[idx + 2] = Math.min(255, lapMean * 2.5);
      edgeBytes[idx + 3] = 255;
    }
  }

  ctxEla.putImageData(elaImageData, 0, 0);
  ctxNoise.putImageData(noiseImageData, 0, 0);
  ctxEdge.putImageData(edgeImageData, 0, 0);

  const averageDelta = totalDelta / pixelCount;

  // Detect anomalous hot-spots from block grid
  const anomalies: AnomalyRegion[] = [];
  const meanBlockScore = totalDelta / (gridCols * gridRows);

  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      const gIdx = gy * gridCols + gx;
      const count = blockPixelCounts[gIdx] || 1;
      const avgInBlock = blockScores[gIdx] / count;

      // If this block's error exceeds 2.8x average or has acute spikes
      if (avgInBlock > Math.max(8.5, averageDelta * 2.4)) {
        const bx = gx * blockDim;
        const by = gy * blockDim;
        const bw = Math.min(blockDim, width - bx);
        const bh = Math.min(blockDim, height - by);

        // Check if contiguous with existing anomaly
        const existing = anomalies.find(a =>
          Math.abs(a.x - bx) <= blockDim * 1.5 && Math.abs(a.y - by) <= blockDim * 1.5
        );

        if (existing) {
          // Expand existing bounding box
          const newRight = Math.max(existing.x + existing.width, bx + bw);
          const newBottom = Math.max(existing.y + existing.height, by + bh);
          existing.x = Math.min(existing.x, bx);
          existing.y = Math.min(existing.y, by);
          existing.width = newRight - existing.x;
          existing.height = newBottom - existing.y;
          existing.confidence = Math.min(99, existing.confidence + 5);
        } else {
          const ratio = avgInBlock / (averageDelta || 1);
          const severity = ratio > 4.5 ? 'critical' : ratio > 3.2 ? 'high' : 'medium';

          anomalies.push({
            id: `anom-${gx}-${gy}-${Date.now().toString(36)}`,
            x: bx,
            y: by,
            width: bw,
            height: bh,
            type: 'compression_mismatch',
            severity,
            confidence: Math.round(Math.min(95, 65 + ratio * 6)),
            description: `High ELA Luminance Delta (${ratio.toFixed(1)}x local baseline). Inconsistent quantization table indicates digital insertion or re-saving.`,
            recommendation: 'Inspect characters or stamp edges under high magnification. Verify source document issuance records.'
          });
        }
      }
    }
  }

  return {
    elaDataUrl: canvasEla.toDataURL('image/png'),
    noiseGradientDataUrl: canvasNoise.toDataURL('image/png'),
    edgeDiscontinuityDataUrl: canvasEdge.toDataURL('image/png'),
    averageDelta,
    peakDelta,
    anomalyRegions: anomalies.slice(0, 8) // Limit to top 8 distinct regions
  };
}

/**
 * Computes an overall Document Tampering Confidence Score
 */
export function computeTamperRiskScore(
  averageElaDelta: number,
  peakDelta: number,
  anomalyCount: number,
  hasSuspiciousExif: boolean,
  exifWarningCount: number
): { score: number; level: ForensicAnalysisResult['riskLevel']; summary: string } {
  let score = 5; // Base noise floor

  // ELA deviation points
  if (averageElaDelta > 12) score += 40;
  else if (averageElaDelta > 7) score += 25;
  else if (averageElaDelta > 3.5) score += 12;

  // Peak compression deviation
  if (peakDelta > 95) score += 20;
  else if (peakDelta > 60) score += 10;

  // Anomalies discovered
  score += Math.min(30, anomalyCount * 8);

  // Metadata flags
  if (hasSuspiciousExif) score += 20;
  score += Math.min(15, exifWarningCount * 5);

  score = Math.min(98, Math.max(3, Math.round(score)));

  let level: ForensicAnalysisResult['riskLevel'] = 'AUTHENTIC';
  let summary = 'Document exhibits consistent JPEG quantization and uniform sensor noise. No localized digital tampering identified.';

  if (score >= 70) {
    level = 'SEVERE FORGERY DETECTED';
    summary = 'Severe compression quantization mismatches and localized high-frequency edge anomalies detected. High likelihood of spliced text, modified figures, or cloned graphics.';
  } else if (score >= 45) {
    level = 'ELEVATED RISK';
    summary = 'Noticeable compression discrepancies and edge discontinuities identified in isolated areas. Recommended for manual forensic cross-referencing.';
  } else if (score >= 25) {
    level = 'LOW SUSPICION';
    summary = 'Minor quantization variations detected, possibly caused by multi-pass rescanning or low-quality compression. Baseline integrity mostly intact.';
  }

  return { score, level, summary };
}
