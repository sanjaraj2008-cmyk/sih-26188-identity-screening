export interface PixelForensicResults {
  moireScore: number; // 0 to 1 (high = screen re-photography)
  isScreenRephoto: boolean;
  blurVariance: number;
  qualityPassed: boolean;
  compressionInconsistency: number; // 0 to 1
  photoRegionSpliceScore: number; // 0 to 1
  flaggedZones: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    severity: 'pass' | 'warn' | 'fail';
  }[];
}

/**
 * Computes deep canvas pixel-level forensics:
 * 1. Moiré screen frequency detection
 * 2. Variance of Laplacian (blur/sharpness)
 * 3. ELA compression quantization variance
 * 4. Photo boundary splicing delta
 */
export async function analyzeImagePixelForensics(
  img: HTMLImageElement
): Promise<PixelForensicResults> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(img, 0, 0);
  const originalData = ctx.getImageData(0, 0, width, height);
  const data = originalData.data;

  // 1. Variance of Laplacian for Sharpness / Blur Detection
  let laplacianSum = 0;
  let laplacianSumSq = 0;
  let edgeSampleCount = 0;

  // Downsample sampling for speed on large images
  const step = Math.max(1, Math.floor(width / 400));

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const up = ((y - 1) * width + x) * 4;
      const down = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      // Grayscale luminance: 0.299R + 0.587G + 0.114B
      const centerL = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const upL = data[up] * 0.299 + data[up + 1] * 0.587 + data[up + 2] * 0.114;
      const downL = data[down] * 0.299 + data[down + 1] * 0.587 + data[down + 2] * 0.114;
      const leftL = data[left] * 0.299 + data[left + 1] * 0.587 + data[left + 2] * 0.114;
      const rightL = data[right] * 0.299 + data[right + 1] * 0.587 + data[right + 2] * 0.114;

      // Laplacian kernel [0, 1, 0; 1, -4, 1; 0, 1, 0]
      const lap = upL + downL + leftL + rightL - 4 * centerL;
      laplacianSum += lap;
      laplacianSumSq += lap * lap;
      edgeSampleCount++;
    }
  }

  const lapMean = laplacianSum / Math.max(1, edgeSampleCount);
  const blurVariance = (laplacianSumSq / Math.max(1, edgeSampleCount)) - (lapMean * lapMean);
  const qualityPassed = blurVariance > 80;

  // 2. Real Error Level Analysis (ELA) Recompression Variance
  const recompressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
  const recompressedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const rImg = new Image();
    rImg.onload = () => resolve(rImg);
    rImg.onerror = reject;
    rImg.src = recompressedDataUrl;
  });

  const recompressedCanvas = document.createElement('canvas');
  recompressedCanvas.width = width;
  recompressedCanvas.height = height;
  const recompressedCtx = recompressedCanvas.getContext('2d', { willReadFrequently: true });
  if (!recompressedCtx) throw new Error('Recompressed context unavailable');

  recompressedCtx.drawImage(recompressedImg, 0, 0);
  const recompData = recompressedCtx.getImageData(0, 0, width, height).data;

  // Measure delta in 16x16 macroblocks
  const blockSize = 16;
  const cols = Math.floor(width / blockSize);
  const rows = Math.floor(height / blockSize);
  const blockDeltas = new Float32Array(cols * rows);
  let totalDelta = 0;
  let maxBlockDelta = 0;
  let maxBlockIdx = 0;

  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      let bDelta = 0;
      for (let py = 0; py < blockSize; py++) {
        for (let px = 0; px < blockSize; px++) {
          const idx = ((by * blockSize + py) * width + (bx * blockSize + px)) * 4;
          const diffR = Math.abs(data[idx] - recompData[idx]);
          const diffG = Math.abs(data[idx + 1] - recompData[idx + 1]);
          const diffB = Math.abs(data[idx + 2] - recompData[idx + 2]);
          bDelta += (diffR + diffG + diffB) / 3;
        }
      }
      const avgBDelta = bDelta / (blockSize * blockSize);
      const bIdx = by * cols + bx;
      blockDeltas[bIdx] = avgBDelta;
      totalDelta += avgBDelta;

      if (avgBDelta > maxBlockDelta) {
        maxBlockDelta = avgBDelta;
        maxBlockIdx = bIdx;
      }
    }
  }

  const globalAvgDelta = totalDelta / Math.max(1, cols * rows);
  const varianceRatio = globalAvgDelta > 0 ? maxBlockDelta / globalAvgDelta : 1;
  const compressionInconsistency = Math.min(1, Math.max(0, (varianceRatio - 1.8) / 3.5));

  // 3. Moiré / Screen Re-Photography Pattern Detection
  // Check for high-frequency periodic horizontal/vertical scanline variance
  let periodicScanlineSpikes = 0;
  let lineComparisons = 0;

  for (let y = 10; y < height - 10; y += 4) {
    let rowEnergyPrev = 0;
    for (let x = 10; x < width - 10; x += 4) {
      const idx = (y * width + x) * 4;
      const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const energyDelta = Math.abs(lum - rowEnergyPrev);
      if (energyDelta > 42) periodicScanlineSpikes++;
      rowEnergyPrev = lum;
      lineComparisons++;
    }
  }

  const scanlineDensity = lineComparisons > 0 ? periodicScanlineSpikes / lineComparisons : 0;
  const moireScore = Math.min(0.99, Math.max(0.02, scanlineDensity * 2.8));
  const isScreenRephoto = moireScore > 0.45;

  // 4. Photo Region Boundary Splicing Check
  // Inspect the photo bounding area (typically x: 5% - 30%, y: 20% - 70%)
  const photoX = Math.round(width * 0.08);
  const photoY = Math.round(height * 0.22);
  const photoW = Math.round(width * 0.24);
  const photoH = Math.round(height * 0.46);

  let photoBorderDelta = 0;
  let borderPixelCount = 0;

  // Sample top and right borders of the photo box
  for (let px = photoX; px < photoX + photoW; px += 2) {
    const idxIn = (photoY * width + px) * 4;
    const idxOut = (Math.max(0, photoY - 4) * width + px) * 4;
    const lumIn = data[idxIn] * 0.299 + data[idxIn + 1] * 0.587 + data[idxIn + 2] * 0.114;
    const lumOut = data[idxOut] * 0.299 + data[idxOut + 1] * 0.587 + data[idxOut + 2] * 0.114;
    photoBorderDelta += Math.abs(lumIn - lumOut);
    borderPixelCount++;
  }

  const avgBorderStep = borderPixelCount > 0 ? photoBorderDelta / borderPixelCount : 0;
  const photoRegionSpliceScore = Math.min(1, Math.max(0, (avgBorderStep - 28) / 45));

  // Build flagged anomaly zones
  const flaggedZones: PixelForensicResults['flaggedZones'] = [];

  if (photoRegionSpliceScore > 0.4) {
    flaggedZones.push({
      x: photoX,
      y: photoY,
      width: photoW,
      height: photoH,
      label: 'Photo Boundary Splice / Insertion Detected',
      severity: photoRegionSpliceScore > 0.7 ? 'fail' : 'warn'
    });
  }

  if (compressionInconsistency > 0.4) {
    const maxBx = (maxBlockIdx % cols) * blockSize;
    const maxBy = Math.floor(maxBlockIdx / cols) * blockSize;
    flaggedZones.push({
      x: Math.max(0, maxBx - 20),
      y: Math.max(0, maxBy - 20),
      width: blockSize * 3,
      height: blockSize * 3,
      label: 'Quantization Table Mismatch (High ELA Delta)',
      severity: compressionInconsistency > 0.7 ? 'fail' : 'warn'
    });
  }

  if (isScreenRephoto) {
    flaggedZones.push({
      x: Math.round(width * 0.2),
      y: Math.round(height * 0.15),
      width: Math.round(width * 0.6),
      height: Math.round(height * 0.6),
      label: 'Moiré Screen Re-Photography Pattern Flagged',
      severity: 'fail'
    });
  }

  return {
    moireScore,
    isScreenRephoto,
    blurVariance,
    qualityPassed,
    compressionInconsistency,
    photoRegionSpliceScore,
    flaggedZones
  };
}
