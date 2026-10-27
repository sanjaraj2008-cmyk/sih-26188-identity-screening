import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType = 'image/png', fileName = 'document.png' } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      fallback: true,
      message: 'GEMINI_API_KEY not configured on server, using local mathematical edge forensics.'
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are a Principal Digital Forensics and Document Identity Verification Expert for law enforcement and border customs (Smart India Hackathon SIH-26188).
Examine this identity document (${fileName}) with extreme rigor:

1. Look for photo substitution / replacement (edge sharpness differences, drop shadows around portrait, head size mismatch).
2. Look for digital text alteration (kerning discrepancy, blurry noise halo around dates or ID numbers, inconsistent font typeface, baseline misalignment).
3. Look for screen re-photography (Moiré interference stripes, LCD/OLED pixel grid, display glare).
4. Verify document structure against official standard templates (such as Indian Aadhaar, PAN card, Passport, or National ID).
5. Extract key identity fields (Full Name, Document ID, Date of Birth, Gender, Address, Expiry/Issue dates).

Return a valid JSON object strictly matching this schema:
{
  "score": number (0 to 100, where 90+ is highly authentic, 50-75 is suspicious, <50 is tampered/forged),
  "verdict": "Real" | "Suspicious" | "Tampered",
  "summary": string,
  "boundaryConfidence": number (0.0 to 1.0),
  "ocrConfidence": number (0.0 to 1.0),
  "fields": {
    "fullName": string,
    "documentId": string,
    "dateOfBirth": string,
    "gender": string,
    "address": string,
    "documentType": string
  },
  "rawText": string,
  "evidence": [
    {
      "category": "texture" | "compression" | "metadata" | "layout" | "ocr",
      "weight": number,
      "observation": string,
      "explanation": string,
      "severity": "pass" | "warn" | "fail",
      "confidence": number (0.0 to 1.0)
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.status(200).json({ success: true, ...parsed });
    }

    return res.status(500).json({ error: 'Empty response from model' });
  } catch (err: any) {
    console.error('Gemini vision analysis error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}
