import React from 'react';
import { ActivePage } from '../components/Navbar';

interface HomePageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <main className="relative overflow-hidden flex-1 flex flex-col">
      {/* Background Cyber Glow Gradients */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.16) 0%, rgba(34, 211, 238, 0.05) 45%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center w-full">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8 glass">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
          <span style={{ color: '#22d3ee' }}>AI Document Forensics · Zero-Knowledge · Local Processing</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
          Verify What <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-purple-400">
            Looks Real.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light" style={{ color: '#94a3b8' }}>
          DocuGuard Edge performs complete AI-powered identity document forensics{' '}
          <span className="text-slate-200 font-medium">entirely inside your browser</span>. No uploads. No cloud. No exposure.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => onNavigate('verify')}
            className="btn-primary text-base cursor-pointer"
          >
            <span>Start Forensic Scan</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button 
            onClick={() => onNavigate('how-it-works')}
            className="btn-secondary text-base cursor-pointer"
          >
            How It Works
          </button>
        </div>

        {/* Hero Stats */}
        <div className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16 pt-10 border-t border-slate-800/60 max-w-3xl mx-auto">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold text-white font-mono">5</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Layers of forensic analysis</span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold text-white font-mono">0</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Bytes uploaded to any server</span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">100%</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Local processing in-browser</span>
          </div>
        </div>
      </section>

      {/* Investigation Workflow Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2 font-mono">
            OPERATIONAL PROTOCOL
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Investigation Workflow
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From upload to verdict in seconds. Every step runs locally. The pipeline is transparent, explainable, and deterministic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Upload',
              desc: 'Drop your identity document — it never leaves your device memory.',
              color: '#22d3ee'
            },
            {
              step: '02',
              title: 'Scan',
              desc: 'Local OCR extracts every text field, font metrics, and layout signal.',
              color: '#3b82f6'
            },
            {
              step: '03',
              title: 'Investigate',
              desc: 'Image forensics detect compression anomalies and texture irregularities.',
              color: '#a855f7'
            },
            {
              step: '04',
              title: 'Compare',
              desc: 'Forensic signals are cross-referenced against structural templates.',
              color: '#e879f9'
            },
            {
              step: '05',
              title: 'Assess Risk',
              desc: 'Independent signals converge into an explainable, deterministic trust score.',
              color: '#f59e0b'
            },
            {
              step: '06',
              title: 'Report',
              desc: 'Download a full cryptographic forensic PDF or print the investigation dossier.',
              color: '#10b981'
            }
          ].map((item) => (
            <div 
              key={item.step}
              className="glass p-6 rounded-2xl relative group hover:border-slate-600 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono" style={{ color: item.color }}>
                  {item.step}
                </span>
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} 
                />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Forensic Intelligence Engine Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block mb-2 font-mono">
            CORE DETECTION SUITE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Forensic Intelligence Engine
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Three engines. Five signals. One explainable verdict.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-bright p-8 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">OCR Intelligence</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Extract and validate text fields, font metrics, and layout geometry against official identity templates (Aadhaar, Passport, PAN).
            </p>
          </div>

          <div className="glass-bright p-8 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Image Forensics</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Detect moiré screen patterns, JPEG block inconsistencies, pixel-level anomalies, and compression artifacts in photo and stamp zones.
            </p>
          </div>

          <div className="glass-bright p-8 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Risk Assessment</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Independent forensic signals converge into a deterministic, explainable trust score. No black-box ML; full auditable breakdown.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Architecture Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2 font-mono">
            SECURITY PARADIGM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Privacy Architecture
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Your document stays on your device. Every forensic analysis runs in your browser&apos;s secure sandbox. Nothing is ever transmitted to any server, ever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl border-slate-800">
            <div className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold mb-2">01 · STORAGE</div>
            <h4 className="text-base font-bold text-white mb-2">Your Device</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The document image never leaves browser RAM. No cookies, no telemetry, no temporary cloud buckets.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border-slate-800">
            <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-2">02 · EXECUTION</div>
            <h4 className="text-base font-bold text-white mb-2">Local AI Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              WASM, Canvas 2D, and browser APIs execute neural feature extraction directly in the client context.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border-slate-800">
            <div className="text-purple-400 font-mono text-xs uppercase tracking-widest font-bold mb-2">03 · OUTPUT</div>
            <h4 className="text-base font-bold text-white mb-2">Secure Report</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Forensic dossier generated into a local PDF blob. Complete privacy for immigration, customs, and banking.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
        <div 
          className="p-10 md:p-14 rounded-3xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(34, 211, 238, 0.08) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to investigate?
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mb-8 font-light">
            Run your first forensic scan now. No account required. No data stored. Instant results.
          </p>
          <button 
            onClick={() => onNavigate('verify')}
            className="btn-primary text-base cursor-pointer"
          >
            <span>Open Forensic Lab</span>
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
};
