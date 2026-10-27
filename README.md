# DocuGuard Edge — AI Document Forensics

> Privacy-first, zero-knowledge AI identity document screening and forensic verification suite running 100% inside your browser. Built for Smart India Hackathon (SIH-26188).

Live reference: [https://sih-26188-identity-screening.vercel.app](https://sih-26188-identity-screening.vercel.app)

---

## 🚀 Ready for Vercel Deployment

This project is fully configured and ready for 1-click deployment on **Vercel**.

### Configuration Summary:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Routing:** SPA catch-all rewrites configured in `vercel.json` so direct routes (`/verify`, `/how-it-works`, `/security`, `/insights`, `/settings`) resolve without 404s.
- **Caching:** Long-term caching headers configured for `/assets/*`.

---

## 🛠️ How to Deploy to Vercel

### Option 1: Deploy with Git (Recommended)

1. Push your repository to GitHub, GitLab, or Bitbucket:
   ```bash
   git init
   git add .
   git commit -m "feat: DocuGuard Edge forensic screening suite ready for Vercel"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new) and select **Import Git Repository**.
3. Vercel automatically detects the settings from `vercel.json`:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. Your live site will be ready in under 60 seconds!

---

### Option 2: Deploy with Vercel CLI

1. Install the Vercel CLI globally (if not installed):
   ```bash
   npm i -g vercel
   ```

2. Run in your project root:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

---

## 🧪 Local Development & Verification

```bash
# Install dependencies
npm install

# Start local development server (runs on port 3000)
npm run dev

# Test production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🛡️ Core Capabilities
- **Zero-Knowledge Architecture:** 100% client-side memory execution — 0 bytes sent to external servers.
- **6-Stage Forensic Pipeline:**
  1. Local Ingestion
  2. OCR Text & Geometry Extraction
  3. Moiré Screen Re-photography Screening
  4. JPEG Quantization & Tamper Scan (Error Level Analysis)
  5. Deterministic Risk Synthesis
  6. Cryptographic PDF Dossier Generation
- **Interactive Multi-Mode Viewer:** Standard, OCR Heatmap Mesh, Forensic Anomaly Zones, Boundary Grid.
- **Instant Preloaded Test Presets:** Clean ID, Suspicious ID, and Forged ID.
