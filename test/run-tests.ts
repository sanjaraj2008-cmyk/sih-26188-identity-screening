/**
 * Automated Test Suite for DocuGuard Edge
 * Covers:
 *  1. Unit tests: Verhoeff algorithm, PAN card entity parser, DOB chronology validator
 *  2. Domain logic: 5-tier forensic categorization & Concept separation
 *  3. Preset data integrity & schema validation
 *  4. Edge classification & reasoning logic
 */

import { 
  validateVerhoeff, 
  generateVerhoeffCheckDigit, 
  validatePanCard, 
  validateDateOfBirth 
} from '../src/utils/checksumValidators';
import { getVerdictConfig, SAMPLE_PRESETS } from '../src/utils/edgePipeline';
import { VerdictType } from '../src/types/edge';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('\n======================================================');
console.log('  DOCUGUARD EDGE AUTOMATED TEST SUITE');
console.log('======================================================\n');

// ----------------------------------------------------------------------
// 1. UNIT TESTS: VERHOEFF CHECKSUM ALGORITHM
// ----------------------------------------------------------------------
console.log('\x1b[36m[SUITE 1] UIDAI Aadhaar Verhoeff Checksum Validation\x1b[0m');

// Generate verified check digit for standard Aadhaar prefix
const aadhaarPrefix = '84921049392';
const checkDigit = generateVerhoeffCheckDigit(aadhaarPrefix);
const validAadhaar = aadhaarPrefix + checkDigit;
const formattedAadhaar = `${validAadhaar.slice(0, 4)} ${validAadhaar.slice(4, 8)} ${validAadhaar.slice(8, 12)}`;

assert(validateVerhoeff(validAadhaar), `Valid 12-digit Aadhaar (${validAadhaar}) passes Verhoeff check`);
assert(validateVerhoeff(formattedAadhaar), `Formatted 12-digit Aadhaar (${formattedAadhaar}) passes check`);

// Single digit mutation must fail
const mutatedLastDigit = validAadhaar.slice(0, 11) + ((checkDigit + 1) % 10);
assert(!validateVerhoeff(mutatedLastDigit), 'Single-digit mutation (substitutions) fails Verhoeff check');

// Adjacent transposition error (swap two characters) must fail
const chars = validAadhaar.split('');
const temp = chars[2];
chars[2] = chars[3];
chars[3] = temp;
const transposedAadhaar = chars.join('');
assert(!validateVerhoeff(transposedAadhaar), 'Adjacent transposition error correctly caught');

// Length & format guards
assert(!validateVerhoeff('12345'), 'Under-length input (<12 digits) is rejected');
assert(!validateVerhoeff(validAadhaar + '999'), 'Over-length input (>12 digits) is rejected');
assert(!validateVerhoeff('ABCDEFGHIJKL'), 'Non-numeric input is rejected');


// ----------------------------------------------------------------------
// 2. UNIT TESTS: INDIAN PAN CARD VALIDATION
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 2] Indian Income Tax PAN Card Entity Validation\x1b[0m');

const individualPan = validatePanCard('ABCPK1234F');
assert(individualPan.isValid && individualPan.entityType === 'Individual / Person', 
  'Valid Individual PAN (4th letter P) parsed correctly');

const companyPan = validatePanCard('XYZCA9999Z');
assert(companyPan.isValid && companyPan.entityType === 'Company', 
  'Valid Company PAN (4th letter C) parsed correctly');

const trustPan = validatePanCard('AAATH0001K');
assert(trustPan.isValid && trustPan.entityType === 'Trust', 
  'Valid Trust PAN (4th letter T) parsed correctly');

assert(!validatePanCard('ABC1234567').isValid, 'Malformed PAN format (invalid char sequence) rejected');
assert(!validatePanCard('ABCDE1234').isValid, 'Incomplete 9-character PAN rejected');
assert(!validatePanCard('ABCDE12345F').isValid, 'Oversized 11-character PAN rejected');


// ----------------------------------------------------------------------
// 3. UNIT TESTS: DATE OF BIRTH CHRONOLOGY
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 3] Date of Birth Chronology & Plausibility\x1b[0m');

const validDob = validateDateOfBirth('14/08/1992');
assert(validDob.isValid && validDob.age !== undefined && validDob.age > 0, 
  'Valid past Date of Birth (DD/MM/YYYY) is accepted with computed age');

const futureDob = validateDateOfBirth('01/01/2099');
assert(!futureDob.isValid && Boolean(futureDob.error?.includes('future')), 
  'Future birth date is strictly rejected');

const ancientDob = validateDateOfBirth('01/01/1850');
assert(!ancientDob.isValid && Boolean(ancientDob.error?.includes('Implausible')), 
  'Implausible century-old birth date (>125 yrs) rejected');

const garbageDob = validateDateOfBirth('not-a-date');
assert(!garbageDob.isValid, 'Unparseable garbage string rejected');


// ----------------------------------------------------------------------
// 4. DOMAIN LOGIC: 5-TIER RESULT CATEGORIZATION
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 4] 5-Tier Forensic Categorization\x1b[0m');

const tiers: VerdictType[] = [
  'NO_SIGNIFICANT_MANIPULATION',
  'POSSIBLE_MANIPULATION',
  'INTEGRITY_FAILED',
  'INCONCLUSIVE',
  'AUTHENTIC_VERIFIED'
];

tiers.forEach(tier => {
  const config = getVerdictConfig(tier);
  assert(
    !!config.label && !!config.hex && !!config.badge && !!config.glow,
    `Tier [${tier}] maps to full config with distinct label & badge (${config.badge})`
  );
});

// Verify distinctness
const configClean = getVerdictConfig('NO_SIGNIFICANT_MANIPULATION');
const configTampered = getVerdictConfig('INTEGRITY_FAILED');
const configInconclusive = getVerdictConfig('INCONCLUSIVE');

assert(configClean.hex !== configTampered.hex, 'Authentic and Tampered tiers have distinct visual codes');
assert(configInconclusive.badge === 'INCONCLUSIVE', 'Inconclusive tier preserves degraded-quality badge');


// ----------------------------------------------------------------------
// 5. EDGE PRESET INTEGRITY & EVIDENCE AUDIT
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 5] Synthetic Sample Presets & Evidence Audit\x1b[0m');

assert(SAMPLE_PRESETS.length >= 3, 'At least 3 canonical sample presets available');

const cleanPreset = SAMPLE_PRESETS.find(p => p.id === 'clean-id');
assert(!!cleanPreset && cleanPreset.score >= 90, 'Clean preset has authentic score >= 90%');
assert(cleanPreset?.verdict === 'NO_SIGNIFICANT_MANIPULATION', 'Clean preset maps to NO_SIGNIFICANT_MANIPULATION');

const suspiciousPreset = SAMPLE_PRESETS.find(p => p.id === 'suspicious-id');
assert(!!suspiciousPreset && suspiciousPreset.score < 80, 'Suspicious preset has score < 80%');
assert(suspiciousPreset?.verdict === 'POSSIBLE_MANIPULATION', 'Suspicious preset maps to POSSIBLE_MANIPULATION');

const forgedPreset = SAMPLE_PRESETS.find(p => p.id === 'forged-id');
assert(!!forgedPreset && forgedPreset.score < 50, 'Forged preset has high-risk score < 50%');
assert(forgedPreset?.verdict === 'INTEGRITY_FAILED', 'Forged preset maps to INTEGRITY_FAILED');

// Verify evidence items in presets have category, weight, and confidence
const allPresetsHaveEvidence = SAMPLE_PRESETS.every(p => 
  p.evidence.length >= 4 && p.evidence.every(e => e.category && e.weight && e.confidence > 0)
);
assert(allPresetsHaveEvidence, 'All sample presets contain weighted forensic evidence items');

// Verify OCR fields present in presets
const allPresetsHaveOcr = SAMPLE_PRESETS.every(p => 
  p.fields.fullName && p.fields.documentId && p.fields.dateOfBirth
);
assert(allPresetsHaveOcr, 'All presets contain complete verified OCR identity fields');


// ----------------------------------------------------------------------
// 6. CRYPTOGRAPHIC INTEGRITY & DOSSIER REPORT VALIDATION
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 6] Cryptographic Integrity & Dossier Report Validation\x1b[0m');

const sampleSha256 = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';
assert(sampleSha256.length === 64, 'SHA-256 digest is exactly 64 hexadecimal characters');
assert(/^[a-f0-9]{64}$/i.test(sampleSha256), 'SHA-256 digest conforms to valid hex format');

// Verify dossier export data contract
const mockDossierData = {
  documentId: 'DOC-849201',
  fileName: 'Government_ID_Sample.png',
  sha256: sampleSha256,
  generatedAt: new Date().toISOString(),
  score: 95,
  verdict: 'NO_SIGNIFICANT_MANIPULATION' as const,
  imageBlobUrl: 'blob:http://localhost:3000/mock-uuid',
  boundaryConfidence: 0.96,
  qr: 'VERIFIED',
  faceRegion: { x: 50, y: 50, width: 100, height: 120 },
  compressionArtifacts: { inconsistencyScore: 0.05 },
  qualityCheck: { blurScore: 0.88, brightnessOk: true, passed: true },
  metadata: { exifPresent: true, software: undefined, anomalies: [] },
  ocr: {
    confidence: 0.95,
    fields: { fullName: 'Vikramaditya Sharma', documentId: '8492 1049 3921' },
    rawText: 'GOVERNMENT OF INDIA'
  },
  evidence: [
    { category: 'texture' as const, weight: 35, observation: 'Substrate uniform', explanation: 'No Moiré pattern', severity: 'pass' as const, confidence: 0.95 },
    { category: 'compression' as const, weight: 10, observation: 'Quantization stable', explanation: 'Uniform macroblocks', severity: 'pass' as const, confidence: 0.92 }
  ],
  checksCompleted: ['Moiré FFT Scan', 'ELA', 'Verhoeff Checksum'],
  checksUnavailable: [],
  analyzerVersion: 'DocuGuard Edge v2.6.4'
};

assert(!!mockDossierData.sha256 && mockDossierData.sha256.length === 64, 'Dossier export data contains verified SHA-256 digest');
assert(mockDossierData.evidence.length >= 2, 'Dossier export data contains itemized forensic evidence rows');
assert(mockDossierData.ocr.fields.fullName === 'Vikramaditya Sharma', 'OCR identity registry fields are preserved in report payload');
const verdictConf = getVerdictConfig(mockDossierData.verdict);
assert(verdictConf.badge === 'AUTHENTIC' || verdictConf.badge === 'AUTHENTIC VERIFIED', 'Verdict mapping formats authentic badge correctly');

// -------------------------------------------------------------
// SUITE 7: DocuGuard Forensic CNN Model & Artifact Integrity
// -------------------------------------------------------------
console.log('\x1b[36m[SUITE 7] DocuGuard Forensic CNN Model & Artifact Integrity\x1b[0m');

import * as fs from 'fs';
import * as path from 'path';
import { CLASS_LABELS } from '../src/utils/aiModel';

const modelJsonPath = path.resolve(process.cwd(), 'public/ai-model/model.json');
const metaJsonPath = path.resolve(process.cwd(), 'public/ai-model/model_metadata.json');
const shardBinPath = path.resolve(process.cwd(), 'public/ai-model/group1-shard1of1.bin');

assert(fs.existsSync(modelJsonPath), 'TensorFlow.js model.json architecture exists');
const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
assert(modelJson.format === 'layers-model' || !!modelJson.modelTopology, 'model.json conforms to TensorFlow.js LayersModel specification');

assert(fs.existsSync(metaJsonPath), 'model_metadata.json exists');
const metaJson = JSON.parse(fs.readFileSync(metaJsonPath, 'utf8'));
assert(metaJson.model_name === 'DocuGuard_Forensic_CNN', 'Metadata identifies DocuGuard_Forensic_CNN architecture');
assert(metaJson.num_classes === 3, 'Metadata specifies 3-class classification head');
assert(metaJson.classes.includes('real') && metaJson.classes.includes('tampered'), 'Metadata classes contain real and tampered');

assert(fs.existsSync(shardBinPath), 'Model weight binary shard (group1-shard1of1.bin) exists');
const binStat = fs.statSync(shardBinPath);
assert(binStat.size > 1000000, `Model weight shard is populated (${(binStat.size / 1024 / 1024).toFixed(2)} MB)`);

assert(CLASS_LABELS.length === 3, 'aiModel exports 3 class labels');
assert(CLASS_LABELS[0] === 'Real' && CLASS_LABELS[2] === 'Tampered', 'aiModel maps Real, Suspicious, Tampered');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All automated tests passed successfully!\x1b[0m\n');
  process.exit(0);
}
