import React from 'react';

export type ActivePage = 'home' | 'verify' | 'how-it-works' | 'security' | 'insights' | 'settings';

interface NavbarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav 
      className="sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 transition-all"
      style={{
        borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
        background: 'rgba(2, 4, 18, 0.85)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
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

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          <button
            onClick={() => onNavigate('home')}
            className="text-sm font-medium transition-colors cursor-pointer"
            style={{ color: currentPage === 'home' ? '#f8fafc' : '#94a3b8' }}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('how-it-works')}
            className="text-sm font-medium transition-colors cursor-pointer"
            style={{ color: currentPage === 'how-it-works' ? '#f8fafc' : '#94a3b8' }}
          >
            How It Works
          </button>
          <button
            onClick={() => onNavigate('verify')}
            className="text-sm font-medium transition-colors cursor-pointer"
            style={{ color: currentPage === 'verify' ? '#22d3ee' : '#94a3b8' }}
          >
            Verification
          </button>
          <button
            onClick={() => onNavigate('security')}
            className="text-sm font-medium transition-colors cursor-pointer"
            style={{ color: currentPage === 'security' ? '#f8fafc' : '#94a3b8' }}
          >
            Security
          </button>
          <button
            onClick={() => onNavigate('insights')}
            className="text-sm font-medium transition-colors cursor-pointer"
            style={{ color: currentPage === 'insights' ? '#f8fafc' : '#94a3b8' }}
          >
            Risk Insights
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="text-sm font-medium transition-colors cursor-pointer"
            style={{ color: currentPage === 'settings' ? '#f8fafc' : '#94a3b8' }}
          >
            Privacy
          </button>
        </div>

        {/* Engine Status & CTA */}
        <div className="flex items-center gap-4">
          <div 
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10b981' }}>
              Local Engine Active
            </span>
          </div>

          <button
            onClick={() => onNavigate('verify')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-100 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.35)'
            }}
          >
            Start Verification
          </button>
        </div>
      </div>
    </nav>
  );
};
