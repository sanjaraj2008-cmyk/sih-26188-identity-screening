export type VerdictType = 
  | 'Real' 
  | 'Suspicious' 
  | 'Tampered'
  | 'NO_SIGNIFICANT_MANIPULATION'
  | 'POSSIBLE_MANIPULATION'
  | 'INCONCLUSIVE'
  | 'INTEGRITY_FAILED'
  | 'AUTHENTIC_VERIFIED';

export interface VerdictConfig {
  hex: string;
  glow: string;
  bg: string;
  border: string;
  label: string;
  sub: string;
  badge: string;
}

export interface ForensicEvidenceItem {
  category: 'texture' | 'compression' | 'metadata' | 'layout' | 'ocr' | 'cryptography';
  weight: number;
  observation: string;
  explanation: string;
  severity: 'pass' | 'warn' | 'fail';
  confidence: number;
  affectedRegion?: { x: number; y: number; width: number; height: number };
}

export interface OCRFields {
  fullName?: string;
  documentId?: string;
  dateOfBirth?: string;
  gender?: string;
  expiryDate?: string;
  address?: string;
  documentType?: string;
  [key: string]: string | undefined;
}

export interface ConceptEvaluation {
  manipulationDetection: {
    status: 'pass' | 'warn' | 'fail';
    score: number;
    details: string;
  };
  cryptographicIntegrity: {
    status: 'pass' | 'warn' | 'fail';
    sha256: string;
    signatureFound: boolean;
    details: string;
  };
  issuerVerification: {
    status: 'NOT_PERFORMED' | 'VERIFIED' | 'FAILED';
    provider: string;
    details: string;
  };
  contentConsistency: {
    status: 'pass' | 'warn' | 'fail';
    checksumAlgorithm?: string;
    details: string;
  };
  overallVerdict: {
    category: 'No significant manipulation detected'
      | 'Possible manipulation detected'
      | 'Inconclusive'
      | 'Integrity verification failed'
      | 'Authenticity verified against a trusted source';
    confidence: number;
    recommendation: string;
  };
}

export interface DocumentVerificationData {
  documentId: string;
  fileName: string;
  sha256?: string;
  generatedAt: string;
  score: number; // 0 to 100
  verdict: VerdictType;
  imageBlobUrl: string;
  croppedImage?: Blob;
  boundaryConfidence: number;
  qr: string | null;
  faceRegion: { x: number; y: number; width: number; height: number } | null;
  compressionArtifacts: {
    inconsistencyScore: number;
  };
  qualityCheck: {
    blurScore: number;
    brightnessOk: boolean;
    passed: boolean;
  };
  metadata: {
    exifPresent: boolean;
    software?: string;
    anomalies: string[];
  };
  ocr: {
    fields: OCRFields;
    rawText: string;
    confidence: number;
  };
  evidence: ForensicEvidenceItem[];
  conceptEvaluation?: ConceptEvaluation;
  aiModelPrediction?: {
    verdict: string;
    probabilities: [number, number, number];
    forgeryScore: number;
    inferenceTimeMs: number;
  };
  checksCompleted: string[];
  checksUnavailable: string[];
  analyzerVersion: string;
}

export interface SampleDocPreset {
  id: string;
  label: string;
  color: string;
  bg: string;
  documentName: string;
  score: number;
  verdict: VerdictType;
  fields: OCRFields;
  rawText: string;
  evidence: ForensicEvidenceItem[];
  generateImage: () => string;
}
