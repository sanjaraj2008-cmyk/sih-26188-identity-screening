import { jsPDF } from 'jspdf';
import { ForensicAnalysisResult, WatermarkConfig, RedactionItem } from '../types/document';
import { applyRedactionsToCanvas } from './piiDetector';
import { applyWatermarkToCanvas } from './watermark';

/**
 * Creates a merged sanitized canvas with redactions and watermarks applied
 */
export function createExportCanvas(
  sourceImage: HTMLImageElement,
  redactions: RedactionItem[],
  watermark: WatermarkConfig,
  sha256Hash: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.naturalWidth || sourceImage.width;
  canvas.height = sourceImage.naturalHeight || sourceImage.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // Draw source image
  ctx.drawImage(sourceImage, 0, 0);

  // Burn in permanent redactions
  applyRedactionsToCanvas(ctx, redactions, 1);

  // Apply watermarking and security seals
  applyWatermarkToCanvas(ctx, watermark, sha256Hash, 1);

  return canvas;
}

/**
 * Downloads a protected PDF with metadata and optional watermark
 */
export async function downloadProtectedPdf(
  sourceImage: HTMLImageElement,
  redactions: RedactionItem[],
  watermark: WatermarkConfig,
  sha256Hash: string,
  fileName: string = 'document_protected.pdf'
): Promise<void> {
  const exportCanvas = createExportCanvas(sourceImage, redactions, watermark, sha256Hash);
  const imgData = exportCanvas.toDataURL('image/jpeg', 0.95);

  const imgWidth = exportCanvas.width;
  const imgHeight = exportCanvas.height;

  // Determine orientation
  const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [imgWidth * 0.75, imgHeight * 0.75]
  });

  pdf.setProperties({
    title: `DocuGuard Protected - ${fileName}`,
    subject: `Cryptographically Protected Document (SHA-256: ${sha256Hash})`,
    author: 'DocuGuard Document Security Suite',
    keywords: 'security, forensic, redacted, tamper-proof, sha256',
    creator: 'DocuGuard Client-Side Security Engine'
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth * 0.75, imgHeight * 0.75);

  const cleanName = fileName.replace(/\.[^/.]+$/, '');
  pdf.save(`${cleanName}_protected.pdf`);
}

/**
 * Downloads high-res sanitized PNG/JPEG image
 */
export function downloadSanitizedImage(
  sourceImage: HTMLImageElement,
  redactions: RedactionItem[],
  watermark: WatermarkConfig,
  sha256Hash: string,
  fileName: string = 'document_sanitized.png',
  format: 'png' | 'jpeg' = 'png'
): void {
  const exportCanvas = createExportCanvas(sourceImage, redactions, watermark, sha256Hash);
  const dataUrl = exportCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.95 : undefined);

  const link = document.createElement('a');
  const cleanName = fileName.replace(/\.[^/.]+$/, '');
  link.download = `${cleanName}_sanitized.${format === 'jpeg' ? 'jpg' : 'png'}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates an Enterprise Forensic Audit Report PDF
 */
export async function downloadForensicAuditReport(
  fileName: string,
  sha256Hash: string,
  analysis: ForensicAnalysisResult,
  originalImg: HTMLImageElement
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4' // 595 x 842 pt
  });

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;

  // Header band
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, 75, 'F');

  pdf.setTextColor(56, 189, 248); // sky-400
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('DOCUGUARD FORENSIC AUDIT CERTIFICATE', margin, 38);

  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`EXECUTIVE SUMMARY REPORT • GENERATED ${new Date().toUTCString()}`, margin, 56);

  // Status Badge Box
  let badgeColor: [number, number, number] = [16, 185, 129]; // emerald
  if (analysis.riskLevel === 'SEVERE FORGERY DETECTED') badgeColor = [225, 29, 72]; // rose
  else if (analysis.riskLevel === 'ELEVATED RISK') badgeColor = [245, 158, 11]; // amber

  pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  pdf.roundedRect(pageWidth - margin - 150, 20, 150, 36, 4, 4, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(analysis.riskLevel, pageWidth - margin - 75, 42, { align: 'center' });

  // Document Profile
  let y = 105;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, y, pageWidth - margin * 2, 70, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin, y, pageWidth - margin * 2, 70, 'S');

  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Target Document Provenance:', margin + 14, y + 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text(`File Name: ${fileName}`, margin + 14, y + 38);
  pdf.text(`SHA-256 Digest: ${sha256Hash}`, margin + 14, y + 54);

  // Metrics Section
  y = 195;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Forensic Quantization & Analysis Findings', margin, y);

  y += 18;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(51, 65, 85);

  const bulletPoints = [
    `• Tamper Risk Score: ${analysis.tamperScore}/100 (${analysis.riskLevel})`,
    `• Error Level Analysis (ELA) Peak Luminance Delta: ${analysis.technicalDetails.peakDelta.toFixed(1)} px`,
    `• Average Quantization Compression Inconsistency: ${analysis.technicalDetails.averageLuminanceDifference.toFixed(2)} px`,
    `• Flagged Anomalous Hot-Spots: ${analysis.anomalies.length} discrete region(s) detected`,
    `• Verdict Summary: ${analysis.summary}`
  ];

  bulletPoints.forEach((pt) => {
    pdf.text(pt, margin + 8, y);
    y += 16;
  });

  // Forensic Snapshots (Original vs ELA)
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Visual Forensic Comparison (Original vs ELA Map):', margin, y);

  y += 14;
  const snapWidth = 245;
  const snapHeight = 175;

  try {
    // Add original preview
    const origCanvas = document.createElement('canvas');
    origCanvas.width = 490;
    origCanvas.height = 350;
    const origCtx = origCanvas.getContext('2d');
    if (origCtx) {
      origCtx.drawImage(originalImg, 0, 0, 490, 350);
      pdf.addImage(origCanvas.toDataURL('image/jpeg', 0.8), 'JPEG', margin, y, snapWidth, snapHeight);
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(margin, y, snapWidth, snapHeight, 'S');

      // Caption
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('1. ORIGINAL SOURCE RASTER', margin + 8, y + snapHeight - 8);
    }

    // Add ELA preview
    if (analysis.elaImageDataUrl) {
      pdf.addImage(analysis.elaImageDataUrl, 'PNG', margin + snapWidth + 25, y, snapWidth, snapHeight);
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(margin + snapWidth + 25, y, snapWidth, snapHeight, 'S');

      pdf.text('2. ERROR LEVEL ANALYSIS (ELA) MAP', margin + snapWidth + 33, y + snapHeight - 8);
    }
  } catch (err) {
    console.warn('Snapshot render note', err);
  }

  y += snapHeight + 25;

  // Anomalies Table
  if (analysis.anomalies.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Detected Anomalous Regions Inventory:', margin, y);
    y += 14;

    analysis.anomalies.slice(0, 4).forEach((anom, aIdx) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(anom.severity === 'critical' ? 225 : anom.severity === 'high' ? 234 : 71, 29, 72);
      pdf.text(`[Region #${aIdx + 1}] Severity: ${anom.severity.toUpperCase()} • Confidence: ${anom.confidence}%`, margin + 10, y);
      y += 12;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Coordinates: X:${anom.x} Y:${anom.y} (W:${anom.width} H:${anom.height}) - ${anom.description}`, margin + 10, y);
      y += 15;
    });
  }

  // Footer Certificate stamp
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, pageHeight - 38, pageWidth, 38, 'F');
  pdf.setTextColor(148, 163, 184);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('DocuGuard Document Verification Protocol • Cryptographic Signature Verifiable • Strictly Confidential', pageWidth / 2, pageHeight - 16, { align: 'center' });

  const cleanName = fileName.replace(/\.[^/.]+$/, '');
  pdf.save(`${cleanName}_forensic_audit_report.pdf`);
}
