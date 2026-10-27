import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers for JSON and large image data payloads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health and readiness probe
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DocuGuard Edge Forensic Engine',
    version: '2.6.0',
    timestamp: new Date().toISOString(),
    aiVisionAvailable: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Primary Forensic Analysis API Route
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', fileName = 'document.png' } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required for analysis' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        message: 'GEMINI_API_KEY not configured on server, using local mathematical edge forensics.'
      });
    }

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
Examine this identity document (${fileName}) with extreme forensic rigor:

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
    console.error('Server-side forensic vision error:', err);
    return res.status(500).json({ error: err.message || 'Forensic analysis failed' });
  }
});

// Setup dev server with Vite middlewares, or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production build from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Dev mode with Vite middlewares mounted
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        port: 3000,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[DocuGuard Edge] Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
