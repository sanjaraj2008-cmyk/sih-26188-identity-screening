export type DocumentType = 'image/png' | 'image/jpeg' | 'image/webp' | 'application/pdf';

export interface DocumentMetadata {
  name: string;
  size: number;
  type: DocumentType;
  dimensions: { width: number; height: number };
  sha256Hash: string;
  uploadedAt: string;
  exifSoftware?: string;
  exifModifyDate?: string;
  exifCamera?: string;
  hasSuspiciousExif: boolean;
  exifWarnings: string[];
}

export interface AnomalyRegion {
  id: string;
  x: number; // percentage or pixels
  y: number;
  width: number;
  height: number;
  type: 'compression_mismatch' | 'edge_discontinuity' | 'cloned_content' | 'metadata_conflict' | 'font_inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  recommendation: string;
}

export interface ForensicAnalysisResult {
  tamperScore: number; // 0 (Clean) to 100 (Heavily Tampered)
  riskLevel: 'AUTHENTIC' | 'LOW SUSPICION' | 'ELEVATED RISK' | 'SEVERE FORGERY DETECTED';
  elaImageDataUrl: string;
  noiseGradientDataUrl: string;
  edgeDiscontinuityDataUrl: string;
  anomalies: AnomalyRegion[];
  cloneDetectionsCount: number;
  compressionInconsistencyPercent: number;
  analyzedAt: string;
  summary: string;
  technicalDetails: {
    averageLuminanceDifference: number;
    peakDelta: number;
    peakErrorDelta: number;
    noiseVariance: number;
    blockArtifactCount: number;
  };
  aiReport?: {
    findings: string[];
    riskAssessment: string;
    legalRiskNotes: string;
  };
}

export type RedactionType = 'ssn' | 'credit_card' | 'email' | 'phone' | 'financial' | 'name' | 'custom';
export type RedactionStyle = 'blackout' | 'blur' | 'pixelate';

export interface RedactionItem {
  id: string;
  x: number; // in pixels relative to natural document size
  y: number;
  width: number;
  height: number;
  type: RedactionType;
  detectedText?: string;
  label: string;
  isActive: boolean;
  style: RedactionStyle;
}

export type WatermarkLayout = 'diagonal' | 'grid' | 'bottom-right' | 'center' | 'header-footer';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number; // 0 to 1
  rotation: number; // in degrees
  fontSize: number; // in px
  color: string;
  layout: WatermarkLayout;
  includeTimestamp: boolean;
  includeSha256Hash: boolean;
  customStamp: 'none' | 'verified_badge' | 'confidential_seal' | 'tamper_resistant_audit';
}

export interface VerificationCheck {
  hashMatched: boolean;
  originalHash: string;
  uploadedHash: string;
  verifiedAt: string;
  fileName: string;
  status: 'VERIFIED_AUTHENTIC' | 'INTEGRITY_COMPROMISED' | 'UNKNOWN_FINGERPRINT';
}
