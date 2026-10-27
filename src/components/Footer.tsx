import React from 'react';
import { ActivePage } from './Navbar';

interface FooterProps {
  onNavigate: (page: ActivePage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer 
      className="relative pt-16 pb-10"
      style={{
        borderTop: '1px solid rgba(139, 92, 246, 0.12)',
        background: 'rgba(2, 4, 18, 0.8)',
        zIndex: 10
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          {/* Left info */}
          <div className="max-w-sm">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 mb-5 cursor-pointer text-left"
            >
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.4)'
                }}
              >
                <svg 
                  className="w-5 h-5" 
                  style={{ color: '#e879f9' }} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                  />
                </svg>
              </div>
              <span className="text-lg font-bold" style={{ color: '#f8fafc' }}>
                DocuGuard <span style={{ color: '#e879f9', fontWeight: 300 }}>Edge</span>
              </span>
            </button>

            <p className="text-sm leading-relaxed mb-6 font-light" style={{ color: '#64748b' }}>
              AI-powered document verification that detects manipulation, inconsistencies, and suspicious identity documents — directly on your device.
            </p>

            <div className="flex items-center gap-3">
              <span 
                className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981'
                }}
              >
                Local Processing
              </span>
              <span 
                className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6'
                }}
              >
                Zero-Knowledge
              </span>
            </div>
          </div>

          {/* Links columns */}
          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white mb-1">Product</h4>
              <button 
                onClick={() => onNavigate('how-it-works')} 
                className="text-sm font-light text-left transition-colors hover:text-white cursor-pointer"
                style={{ color: '#64748b' }}
              >
                How It Works
              </button>
              <button 
                onClick={() => onNavigate('security')} 
                className="text-sm font-light text-left transition-colors hover:text-white cursor-pointer"
                style={{ color: '#64748b' }}
              >
                Security Architecture
              </button>
              <button 
                onClick={() => onNavigate('insights')} 
                className="text-sm font-light text-left transition-colors hover:text-white cursor-pointer"
                style={{ color: '#64748b' }}
              >
                Risk Insights
              </button>
              <button 
                onClick={() => onNavigate('verify')} 
                className="text-sm font-medium text-left transition-colors hover:underline cursor-pointer"
                style={{ color: '#22d3ee' }}
              >
                Interactive Demo
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white mb-1">Legal</h4>
              <span className="text-sm font-light cursor-not-allowed" style={{ color: '#475569' }}>
                Privacy Policy
              </span>
              <span className="text-sm font-light cursor-not-allowed" style={{ color: '#475569' }}>
                Terms of Service
              </span>
              <button 
                onClick={() => onNavigate('settings')}
                className="text-sm font-light text-left transition-colors hover:text-white cursor-pointer"
                style={{ color: '#64748b' }}
              >
                Sandbox Status
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div 
          className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}
        >
          <p className="text-xs font-light" style={{ color: '#475569' }}>
            Prototype interface — Verification intelligence running locally.
          </p>
          <p className="text-xs font-mono" style={{ color: '#334155' }}>
            © 2026 DocuGuard Edge Prototype.
          </p>
        </div>
      </div>
    </footer>
  );
};
