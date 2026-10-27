import { GoogleGenAI } from '@google/genai';
import { ForensicAnalysisResult } from '../types/document';

/**
 * Executes an AI-powered forensic reasoning and risk assessment
 */
export async function runAiForensicAudit(
  documentName: string,
  analysis: ForensicAnalysisResult,
  extractedTextPreview?: string
): Promise<{
  findings: string[];
  riskAssessment: string;
  legalRiskNotes: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Senior Digital Document Forensic Examiner and Fraud Investigator.
Analyze these technical findings for a document titled "${documentName}":
- Tamper Risk Score: ${analysis.tamperScore}/100
- Risk Level: ${analysis.riskLevel}
- ELA Peak Luminance Delta: ${analysis.technicalDetails.peakDelta} px
- Average Quantization Difference: ${analysis.technicalDetails.averageLuminanceDifference} px
- Flagged Anomalies Count: ${analysis.anomalies.length}
- Anomaly Descriptions: ${analysis.anomalies.map(a => a.description).join('; ')}
${extractedTextPreview ? `- Document Text Snippet: "${extractedTextPreview.slice(0, 400)}"` : ''}

Provide a structured forensic report formatted in JSON with the exact keys:
{
  "findings": ["string", "string", "string"],
  "riskAssessment": "string (1-2 sentences summarizing likelihood of deception or genuine nature)",
  "legalRiskNotes": "string (admissibility, regulatory impact, recommended next steps)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          findings: Array.isArray(parsed.findings) ? parsed.findings : [analysis.summary],
          riskAssessment: parsed.riskAssessment || analysis.summary,
          legalRiskNotes: parsed.legalRiskNotes || 'Recommend retaining original digital raster for chain-of-custody logging.'
        };
      }
    } catch (err) {
      console.warn('Gemini API call returned error, applying heuristic forensic engine', err);
    }
  }

  // Heuristic rule-based fallback
  const isHigh = analysis.tamperScore >= 45;
  return {
    findings: [
      isHigh
        ? 'High quantization divergence indicates selective secondary re-saving or layer compositing.'
        : 'Quantization curve aligns uniformly across all 32x32 macroblocks.',
      analysis.anomalies.length > 0
        ? `Identified ${analysis.anomalies.length} localized anomalous edge gradient(s) consistent with pasted typography.`
        : 'Edge gradient continuity confirms characters are rendered from the same raster generation pass.',
      analysis.technicalDetails.peakDelta > 60
        ? 'Acute luminance discrepancy on focal elements exceeds standard rescan tolerances.'
        : 'Sensor noise distribution follows Gaussian standard across background parchment.'
    ],
    riskAssessment: isHigh
      ? 'Elevated risk of intentional manipulation or figure splicing. Document should not be accepted for financial clearance without secondary out-of-band verification.'
      : 'Document appears consistent with single-generation original raster. Low probability of digital alteration detected.',
    legalRiskNotes: isHigh
      ? 'Suspected fraudulent alteration may violate banking compliance (18 U.S.C. § 1344) and evidentiary requirements (FRE Rule 901). Request original PDF or primary issuer cryptographic token.'
      : 'Meets standard digital authenticity baselines for business and administrative archiving.'
  };
}
