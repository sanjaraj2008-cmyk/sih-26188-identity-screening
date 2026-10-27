import React from 'react';
import { 
  ShieldCheck, 
  FileCheck2, 
  Download, 
  Upload, 
  FileText, 
  SearchCheck, 
  Layers, 
  Sparkles,
  Lock
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../utils/sampleDocuments';

interface HeaderProps {
  currentDocName: string;
  sha256Hash: string;
  tamperScore?: number;
  riskLevel?: string;
  activeTab: 'forensics' | 'redaction' | 'watermark';
  setActiveTab: (tab: 'forensics' | 'redaction' | 'watermark') => void;
  onUploadClick: () => void;
  onLoadSample: (sampleId: string) => void;
  onOpenVerifyModal: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDocName,
  sha256Hash,
  tamperScore,
  riskLevel,
  activeTab,
  setActiveTab,
  onUploadClick,
  onLoadSample,
  onOpenVerifyModal,
  onOpenExportModal
}) => {
  const [samplesOpen, setSamplesOpen] = React.useState(false);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1920px] mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white font-sans">
                Docu<span className="text-emerald-400">Guard</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.6 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Forensic Tamper Detection & PII Protection Suite
            </p>
          </div>
        </div>

        {/* Center Mode Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('forensics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'forensics'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <SearchCheck className="w-3.5 h-3.5" />
            <span>Forensics & ELA</span>
            {tamperScore !== undefined && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                tamperScore >= 45 ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
              }`}>
                {tamperScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('redaction')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'redaction'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>PII Redactor</span>
          </button>

          <button
            onClick={() => setActiveTab('watermark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'watermark'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Watermark & Seal</span>
          </button>
        </div>

        {/* Right Actions & File info */}
        <div className="flex items-center gap-2">
          {/* Sample Documents Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSamplesOpen(!samplesOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Samples</span>
            </button>

            {samplesOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setSamplesOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-30 space-y-1">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Preloaded Test Documents
                  </div>
                  {SAMPLE_DOCUMENTS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onLoadSample(sample.id);
                        setSamplesOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-all group flex flex-col gap-0.5 border border-transparent hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-emerald-400">
                        <span>{sample.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {sample.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {sample.description}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all"
            title="Upload any image (PNG, JPG, WebP) or document"
          >
            <Upload className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Verify Checksum Button */}
          <button
            onClick={onOpenVerifyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/60 transition-all"
            title="Verify against SHA-256 fingerprint or previous version"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Verify Hash</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-700/25 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Protected</span>
          </button>
        </div>
      </div>

      {/* Secondary Status Sub-header */}
      <div className="max-w-[1920px] mx-auto mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-300 font-medium truncate max-w-xs">{currentDocName}</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-400 truncate hidden md:inline">
            SHA256: {sha256Hash ? `${sha256Hash.slice(0, 16)}...${sha256Hash.slice(-8)}` : 'Computing...'}
          </span>
        </div>

        {riskLevel && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500">Tamper Status:</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
              riskLevel === 'SEVERE FORGERY DETECTED'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : riskLevel === 'ELEVATED RISK'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {riskLevel}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
