import React from 'react';
import { ActivePage } from '../components/Navbar';

interface InsightsPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  return (
    <main className="min-h-screen pb-20 relative">
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(34, 211, 238, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase mb-3 glass">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22d3ee' }} />
            <span style={{ color: '#22d3ee' }}>TELEMETRY &amp; FRAUD INTELLIGENCE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Risk Intelligence Dashboard
          </h1>
          <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            Aggregate view of document verification trends and threat categories (Demo Data).
          </p>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="glass p-6 rounded-2xl text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2 font-mono">
              TOTAL VERIFIED
            </span>
            <span className="text-4xl font-extrabold text-white font-mono">1,248</span>
            <span className="text-xs text-emerald-400 block mt-2">↑ 18% this week</span>
          </div>

          <div className="glass p-6 rounded-2xl text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2 font-mono">
              AVG. TRUST SCORE
            </span>
            <span className="text-4xl font-extrabold text-cyan-400 font-mono">82 <span className="text-lg text-slate-500 font-normal">/ 100</span></span>
            <span className="text-xs text-slate-400 block mt-2">Baseline integrity</span>
          </div>

          <div className="glass p-6 rounded-2xl text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2 font-mono">
              THREATS DETECTED
            </span>
            <span className="text-4xl font-extrabold text-rose-400 font-mono">142</span>
            <span className="text-xs text-rose-400/80 block mt-2">11.3% threat rate</span>
          </div>
        </div>

        {/* Threat Categories Breakdown */}
        <div className="glass p-8 rounded-3xl max-w-4xl mx-auto mb-12">
          <h2 className="text-lg font-bold text-white mb-6">Threat Categories Distribution</h2>

          <div className="space-y-4">
            {[
              { label: 'Compression Anomalies', pct: 45, color: '#f43f5e' },
              { label: 'Metadata Stripped or Suspicious', pct: 30, color: '#f59e0b' },
              { label: 'Layout Tampering', pct: 15, color: '#a855f7' },
              { label: 'Low OCR Plausibility', pct: 10, color: '#06b6d4' }
            ].map((cat) => (
              <div key={cat.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{cat.label}</span>
                  <span className="font-mono font-bold" style={{ color: cat.color }}>{cat.pct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.pct}%`, background: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Trends Note & Action */}
        <div className="p-6 rounded-2xl glass text-center max-w-4xl mx-auto">
          <p className="text-sm text-slate-400 font-light mb-4">
            Detailed time-series analytics and advanced threat intelligence charts will be available in the next product iteration.
          </p>
          <button
            onClick={() => onNavigate('verify')}
            className="btn-primary text-xs py-2.5 px-6 cursor-pointer"
          >
            Launch Command Center
          </button>
        </div>
      </div>
    </main>
  );
};
