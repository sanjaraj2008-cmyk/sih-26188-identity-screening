import { WatermarkConfig } from '../types/document';

/**
 * Draws dynamic security watermarks and cryptographic seals onto a canvas
 */
export function applyWatermarkToCanvas(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  sha256Hash: string = '',
  scaleFactor: number = 1
): void {
  if (!config.enabled) return;

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, config.opacity));
  ctx.fillStyle = config.color || '#ef4444';
  ctx.strokeStyle = config.color || '#ef4444';

  const baseFontSize = (config.fontSize || 36) * scaleFactor;
  ctx.font = `800 ${baseFontSize}px 'Plus Jakarta Sans', sans-serif`;

  const textToDraw = config.text.trim() || 'CONFIDENTIAL';

  if (config.layout === 'center') {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textToDraw, 0, 0);

    if (config.includeTimestamp || config.includeSha256Hash) {
      ctx.font = `600 ${baseFontSize * 0.35}px 'JetBrains Mono', monospace`;
      const metaText = [
        config.includeTimestamp ? new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '',
        config.includeSha256Hash && sha256Hash ? `SHA256: ${sha256Hash.slice(0, 16)}...` : ''
      ].filter(Boolean).join(' | ');
      ctx.fillText(metaText, 0, baseFontSize * 0.7);
    }
    ctx.restore();
  } else if (config.layout === 'diagonal') {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-35 * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${baseFontSize * 1.4}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(textToDraw, 0, 0);

    if (config.includeTimestamp || config.includeSha256Hash) {
      ctx.font = `600 ${baseFontSize * 0.4}px 'JetBrains Mono', monospace`;
      const sub = [
        config.includeTimestamp ? new Date().toLocaleDateString() : '',
        config.includeSha256Hash && sha256Hash ? `HASH: ${sha256Hash.slice(0, 20)}` : ''
      ].filter(Boolean).join(' • ');
      ctx.fillText(sub, 0, baseFontSize * 0.9);
    }
    ctx.restore();
  } else if (config.layout === 'grid') {
    ctx.save();
    const stepX = Math.max(180 * scaleFactor, baseFontSize * 6);
    const stepY = Math.max(120 * scaleFactor, baseFontSize * 4);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${baseFontSize * 0.7}px 'Plus Jakarta Sans', sans-serif`;

    for (let y = 50 * scaleFactor; y < height + 100; y += stepY) {
      for (let x = 50 * scaleFactor; x < width + 100; x += stepX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((config.rotation * Math.PI) / 180);
        ctx.fillText(textToDraw, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  } else if (config.layout === 'bottom-right') {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.font = `700 ${baseFontSize * 0.8}px 'Plus Jakarta Sans', sans-serif`;
    const pad = 30 * scaleFactor;
    ctx.fillText(textToDraw, width - pad, height - pad - (config.includeSha256Hash ? 24 : 0));

    if (config.includeSha256Hash && sha256Hash) {
      ctx.font = `500 ${baseFontSize * 0.35}px 'JetBrains Mono', monospace`;
      ctx.fillText(`SHA256: ${sha256Hash.slice(0, 24)}...`, width - pad, height - pad);
    }
    ctx.restore();
  }

  // Draw custom cryptographic official seal if selected
  if (config.customStamp !== 'none') {
    drawOfficialSecurityStamp(ctx, config.customStamp, width, height, sha256Hash, scaleFactor);
  }

  ctx.restore();
}

/**
 * Draws high-assurance cryptographic seal / security verification badge
 */
function drawOfficialSecurityStamp(
  ctx: CanvasRenderingContext2D,
  stampType: WatermarkConfig['customStamp'],
  width: number,
  height: number,
  hash: string,
  scale: number
): void {
  const stampWidth = 240 * scale;
  const stampHeight = 110 * scale;
  const margin = 24 * scale;
  const posX = width - stampWidth - margin;
  const posY = height - stampHeight - margin;

  ctx.save();
  ctx.globalAlpha = 0.95;

  // Background plate
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(posX, posY, stampWidth, stampHeight, 10 * scale);
  ctx.fill();

  // Outer border with accent
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = stampType === 'verified_badge' ? '#10b981' : stampType === 'confidential_seal' ? '#f59e0b' : '#6366f1';
  ctx.stroke();

  // Inner dotted border
  ctx.setLineDash([4 * scale, 3 * scale]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeRect(posX + 4 * scale, posY + 4 * scale, stampWidth - 8 * scale, stampHeight - 8 * scale);
  ctx.setLineDash([]);

  // Title badge
  ctx.fillStyle = stampType === 'verified_badge' ? '#10b981' : stampType === 'confidential_seal' ? '#f59e0b' : '#6366f1';
  ctx.font = `800 ${11 * scale}px 'Plus Jakarta Sans', sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(
    stampType === 'verified_badge'
      ? '★ DOCUGUARD VERIFIED INTEGRITY'
      : stampType === 'confidential_seal'
      ? '🔒 RESTRICTED CONFIDENTIAL SEAL'
      : '🛡️ TAMPER-RESISTANT FORENSIC AUDIT',
    posX + 12 * scale,
    posY + 22 * scale
  );

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${9 * scale}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText('Cryptographic Hash Fingerprint:', posX + 12 * scale, posY + 42 * scale);

  // Monospace SHA-256 display
  ctx.fillStyle = '#f8fafc';
  ctx.font = `600 ${8.5 * scale}px 'JetBrains Mono', monospace`;
  const displayHash = hash ? `${hash.slice(0, 16)}...${hash.slice(-8)}` : 'e3b0c44298fc1c14...';
  ctx.fillText(displayHash, posX + 12 * scale, posY + 58 * scale);

  // Timestamp & ID
  ctx.fillStyle = '#64748b';
  ctx.font = `500 ${8 * scale}px 'JetBrains Mono', monospace`;
  const timeStr = new Date().toISOString().slice(0, 10);
  ctx.fillText(`DATE: ${timeStr} | SIG: DG-${(hash || 'A8F9').slice(0, 6).toUpperCase()}`, posX + 12 * scale, posY + 78 * scale);

  // Status check indicator
  ctx.fillStyle = stampType === 'verified_badge' ? '#059669' : '#d97706';
  ctx.beginPath();
  ctx.arc(posX + stampWidth - 18 * scale, posY + 22 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
