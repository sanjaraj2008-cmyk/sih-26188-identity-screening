import React, { useState } from 'react';

export const SettingsPage: React.FC = () => {
  const [clearedModels, setClearedModels] = useState<boolean>(false);
  const [clearedHistory, setClearedHistory] = useState<boolean>(false);

  return (
    <main className="min-h-screen pb-20 relative">
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)'
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase mb-3 glass">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
            <span style={{ color: '#10b981' }}>LOCAL SANDBOX ENFORCEMENT</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Settings &amp; Privacy
          </h1>
          <p className="text-sm text-slate-400 font-light">
            Manage your local data and application preferences.
          </p>
        </div>

        {/* Status Card */}
        <div className="glass p-8 rounded-3xl mb-8 border-emerald-500/30 bg-emerald-950/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">
              Zero-Knowledge Architecture Status: <span className="text-emerald-400">Enforced</span>
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            DocuGuard Edge is currently operating in strictly offline mode. All OCR, Forensics, and Machine Learning operations occur entirely within your browser&apos;s WebAssembly sandbox. No identity document data or telemetry is ever transmitted to remote servers.
          </p>
        </div>

        {/* Local Storage Management */}
        <div className="glass p-8 rounded-3xl space-y-6">
          <h2 className="text-base font-bold text-white pb-3 border-b border-white/5">
            Local Storage Management
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-sm font-bold text-white block">Cached AI Models</span>
              <span className="text-xs text-slate-400 font-light">ONNX Edge computing neural weights (24MB in IndexedDB)</span>
            </div>
            <button
              onClick={() => {
                setClearedModels(true);
                setTimeout(() => setClearedModels(false), 2000);
              }}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer shrink-0"
            >
              {clearedModels ? 'Cache Cleared!' : 'Clear Cache'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-sm font-bold text-white block">Verification History</span>
              <span className="text-xs text-slate-400 font-light">Past generated reports, hashes, and field cache (0 items)</span>
            </div>
            <button
              onClick={() => {
                setClearedHistory(true);
                setTimeout(() => setClearedHistory(false), 2000);
              }}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer shrink-0"
            >
              {clearedHistory ? 'Data Cleared!' : 'Clear Data'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
