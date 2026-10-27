import { RedactionItem, RedactionStyle, RedactionType } from '../types/document';

export interface DetectedPIIResult {
  text: string;
  type: RedactionType;
  label: string;
  suggestedX: number;
  suggestedY: number;
  suggestedWidth: number;
  suggestedHeight: number;
}

/**
 * Common regex patterns for Personally Identifiable Information
 */
export const PII_PATTERNS = [
  {
    type: 'ssn' as RedactionType,
    label: 'Social Security Number (SSN)',
    regex: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g,
  },
  {
    type: 'credit_card' as RedactionType,
    label: 'Credit / Debit Card Number',
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  },
  {
    type: 'email' as RedactionType,
    label: 'Email Address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    type: 'phone' as RedactionType,
    label: 'Phone Number',
    regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  {
    type: 'financial' as RedactionType,
    label: 'Financial Balance / Salary',
    regex: /\$(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?\b/g,
  },
];

/**
 * Simulates intelligent OCR text extraction with spatial bounding boxes for sample documents or text streams
 */
export function scanDocumentTextForPII(
  rawText: string,
  imageWidth: number,
  imageHeight: number
): RedactionItem[] {
  const items: RedactionItem[] = [];

  PII_PATTERNS.forEach((pattern, pIdx) => {
    let match: RegExpExecArray | null;
    const regexCopy = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regexCopy.exec(rawText)) !== null) {
      const detectedText = match[0];
      // Estimate spatial coordinates based on text flow position
      const textPositionRatio = match.index / Math.max(1, rawText.length);
      const estY = Math.round(imageHeight * (0.2 + textPositionRatio * 0.65));
      const estX = Math.round(imageWidth * 0.35);
      const estW = Math.min(imageWidth * 0.45, Math.max(120, detectedText.length * 14));
      const estH = 34;

      items.push({
        id: `pii-${pIdx}-${match.index}-${Date.now().toString(36)}`,
        x: estX,
        y: estY,
        width: estW,
        height: estH,
        type: pattern.type,
        detectedText,
        label: `${pattern.label}: ${detectedText}`,
        isActive: true,
        style: 'blackout'
      });
    }
  });

  return items;
}

/**
 * Applies permanent irreversible redaction onto an HTML Canvas 2D context
 */
export function applyRedactionsToCanvas(
  ctx: CanvasRenderingContext2D,
  redactions: RedactionItem[],
  scaleFactor: number = 1
): void {
  for (const item of redactions) {
    if (!item.isActive) continue;

    const rx = item.x * scaleFactor;
    const ry = item.y * scaleFactor;
    const rw = item.width * scaleFactor;
    const rh = item.height * scaleFactor;

    if (rw <= 0 || rh <= 0) continue;

    ctx.save();

    if (item.style === 'blackout') {
      ctx.fillStyle = '#09090b'; // Rich solid black
      ctx.fillRect(rx, ry, rw, rh);

      // Subtle security tape border pattern
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx, ry, rw, rh);

      // Security Redacted tag
      if (rw > 70 && rh > 22) {
        ctx.fillStyle = '#71717a';
        ctx.font = `bold ${Math.max(9, Math.min(13, rh * 0.45))}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('REDACTED', rx + rw / 2, ry + rh / 2);
      }
    } else if (item.style === 'pixelate') {
      // Pixelate effect: sample low-res blocks and fill
      const pixelSize = Math.max(8, Math.round(rw / 12));
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const data = imgData.data;

      for (let py = 0; py < rh; py += pixelSize) {
        for (let px = 0; px < rw; px += pixelSize) {
          const sampleIdx = (py * rw + px) * 4;
          const r = data[sampleIdx] || 128;
          const g = data[sampleIdx + 1] || 128;
          const b = data[sampleIdx + 2] || 128;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(
            rx + px,
            ry + py,
            Math.min(pixelSize, rw - px),
            Math.min(pixelSize, rh - py)
          );
        }
      }
    } else if (item.style === 'blur') {
      // Gaussian-like blur by downsampling & upsampling
      const tempCanvas = document.createElement('canvas');
      const downscale = 0.1;
      tempCanvas.width = Math.max(2, Math.round(rw * downscale));
      tempCanvas.height = Math.max(2, Math.round(rh * downscale));
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, tempCanvas.width, tempCanvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, rx, ry, rw, rh);
      } else {
        // Fallback to frosted overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(rx, ry, rw, rh);
      }
    }

    ctx.restore();
  }
}
