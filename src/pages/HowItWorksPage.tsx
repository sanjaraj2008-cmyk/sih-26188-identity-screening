import React from 'react';
import { ActivePage } from '../components/Navbar';

interface HowItWorksPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-20 relative">
      {/* Background glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            From document image to <span className="text-purple-400">trust decision.</span>
          </h1>
          <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            Explore the internal pipeline of DocuGuard Edge. A six-stage process that runs entirely inside your browser.
          </p>
        </div>

        {/* 3 Pipeline Deep Dive Stages */}
        <div className="space-y-16 max-w-4xl mx-auto">
          {/* Stage 01 & 02 */}
          <div className="glass p-8 md:p-10 rounded-3xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                STAGE 01 &amp; 02
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Ingestion &amp; OCR Engine
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Capture &amp; OCR Understanding
            </h3>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-light">
              Documents are loaded securely into browser memory as Blobs. WebAssembly-powered Tesseract OCR scans the image locally to extract critical text, dates, and identification numbers without any network latency.
            </p>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Extracted Entities &amp; Structure:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Name & Date of Birth', 'Document Identification Number', 'Expiry & Issue Dates', 'Address Information', 'OCR Confidence Baseline'].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-md bg-purple-900/30 text-purple-300 border border-purple-700/40 font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stage 03 & 04 */}
          <div className="glass p-8 md:p-10 rounded-3xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                STAGE 03 &amp; 04
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Forensics &amp; Texture Detection
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Visual Intelligence &amp; Forensics
            </h3>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-light">
              The system goes beyond reading text. It analyzes the document&apos;s physical characteristics, looking for digital tampering, layout anomalies, and inconsistent image artifacts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">Moiré &amp; Texture Analysis</span>
                <span className="text-slate-400">Detects screen re-photography patterns when an ID is photographed off a computer display.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-purple-400 font-bold block mb-1">Compression Anomalies</span>
                <span className="text-slate-400">Error Level Analysis checks for secondary quantization tables where text or photos were spliced.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">EXIF Metadata Scanner</span>
                <span className="text-slate-400">Examines binary tags for digital editors (Photoshop, GIMP) and missing camera sensors.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">Layout &amp; Font Geometry</span>
                <span className="text-slate-400">Measures font kerning and structural bounding ratios against government standards.</span>
              </div>
            </div>
          </div>

          {/* Stage 05 & 06 */}
          <div className="glass p-8 md:p-10 rounded-3xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                STAGE 05 &amp; 06
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Risk Engine &amp; Reporting
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Risk Engine &amp; Decision Synthesis
            </h3>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-light">
              All extracted signals are fed into a deterministic risk engine. Using a weighted scoring system, it calculates a final Trust Score. A single anomaly flags a warning; converging independent anomalies trigger a strict failure.
            </p>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-950 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 text-xs font-mono font-bold block">EXPERIENCE VERIFICATION</span>
                <span className="text-white text-base font-bold">Try the Interactive Demo</span>
              </div>

              <button
                onClick={() => onNavigate('verify')}
                className="btn-primary text-xs py-2 px-5 cursor-pointer"
              >
                Launch Console
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
