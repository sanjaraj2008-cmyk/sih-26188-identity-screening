import React from 'react';
import { ActivePage } from '../components/Navbar';

interface SecurityPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-20 relative">
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase mb-3 glass">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
            <span style={{ color: '#10b981' }}>ZERO-KNOWLEDGE VERIFICATION ARCHITECTURE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Your Identity Should <span className="text-emerald-400">Stay Yours.</span>
          </h1>
          <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            DocuGuard Edge is built on a Zero-Knowledge Architecture. We bring the verification intelligence to the data, not the data to the intelligence.
          </p>
        </div>

        {/* 3 Privacy Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          <div className="glass p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Local Processing Only</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Document binaries are parsed entirely client-side using JavaScript File APIs. No network requests are made containing your personal identity data.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Minimal Data Exposure</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Even locally, the AI models only extract the exact features required to compute a Trust Score. We do not persist PII in local storage.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Explainable Risk Signals</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Our models produce transparent, deterministic signals. You always know exactly which anomaly triggered a high-risk score.
            </p>
          </div>
        </div>

        {/* Zero-Knowledge Architecture Workflow */}
        <div className="glass p-10 rounded-3xl max-w-5xl mx-auto mb-20 text-center relative overflow-hidden">
          <h2 className="text-2xl font-bold text-white mb-8">Zero-Knowledge Architecture Workflow</h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="font-mono text-cyan-400 font-bold block mb-1">01. INGESTION</span>
              <span className="font-semibold text-white">User Device (Browser)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="font-mono text-purple-400 font-bold block mb-1">02. EXTRACTION</span>
              <span className="font-semibold text-white">Local OCR &amp; AI (WASM)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="font-mono text-fuchsia-400 font-bold block mb-1">03. AUDIT</span>
              <span className="font-semibold text-white">Forensic Inspection</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-xs bg-emerald-950/20">
              <span className="font-mono text-emerald-400 font-bold block mb-1">04. DECISION</span>
              <span className="font-semibold text-emerald-300">0 Server Uploads</span>
            </div>
          </div>
        </div>

        {/* Threat Intelligence Model (8 Vectors) */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Threat Intelligence Model</h2>
            <p className="text-slate-400 text-sm">DocuGuard Edge is specifically trained to identify multiple vectors of identity fraud.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              'Edited Documents',
              'Synthetic Identities',
              'Image Manipulation',
              'Inconsistent Typography',
              'Suspicious Metadata',
              'Photo Replacement',
              'Layout Tampering',
              'Low-confidence OCR'
            ].map((threat) => (
              <div key={threat} className="glass p-3.5 rounded-xl text-center border-slate-800">
                <span className="font-bold text-slate-200">{threat}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('verify')}
              className="btn-primary cursor-pointer text-sm"
            >
              Experience Secure Verification
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
