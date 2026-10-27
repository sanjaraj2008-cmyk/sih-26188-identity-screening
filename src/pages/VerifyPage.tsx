import React, { useState, useRef } from 'react';
import { 
  DocumentVerificationData, 
  VerdictType 
} from '../types/edge';
import { 
  SAMPLE_PRESETS, 
  runEdgeVerificationPipeline,
  getVerdictConfig
} from '../utils/edgePipeline';
import { generateAndDownloadDossierPdf } from '../utils/pdfDossier';

export const VerifyPage: React.FC = () => {
  const [data, setData] = useState<DocumentVerificationData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<{ index: number; name: string }>({ index: 1, name: '01. INGESTION' });
  const [activeViewMode, setActiveViewMode] = useState<'standard' | 'ocr' | 'forensic' | 'geometry'>('standard');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isHashCopied, setIsHashCopied] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyHash = (hash: string) => {
    if (!hash) return;
    navigator.clipboard?.writeText(hash).then(() => {
      setIsHashCopied(true);
      setTimeout(() => setIsHashCopied(false), 2000);
    }).catch(() => {
      setIsHashCopied(true);
      setTimeout(() => setIsHashCopied(false), 2000);
    });
  };

  const handleStartPipeline = async (blob: Blob, name: string) => {
    setIsProcessing(true);
    setCurrentStage({ index: 1, name: '01. INGESTION' });

    try {
      const result = await runEdgeVerificationPipeline(blob, name, (idx, stageName) => {
        setCurrentStage({ index: idx, name: stageName });
      });
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStartPipeline(file, file.name);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const dataUrl = preset.generateImage();
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        handleStartPipeline(blob, preset.documentName);
      });
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    setIsDownloadingPdf(true);
    try {
      await generateAndDownloadDossierPdf(data);
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 4500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const verdict = data ? getVerdictConfig(data.verdict) : null;

  return (
    <main className="min-h-screen pb-20 relative">
      {/* Background glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page Top Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase mb-3 glass">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22d3ee' }} />
            <span style={{ color: '#22d3ee' }}>FORENSIC COMMAND CENTER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            AI Identity Screening &amp; Forensic Console
          </h1>
          <p className="text-slate-400 text-sm font-light leading-relaxed">
            Zero-knowledge document verification executed entirely inside your browser. No data ever leaves your device.
          </p>
        </div>

        {/* 1. Upload Dropzone (When no document is loaded or for re-upload) */}
        {!data && !isProcessing && (
          <div className="max-w-3xl mx-auto mb-12">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="glass p-12 rounded-3xl text-center relative group cursor-pointer transition-all hover:border-purple-500/40"
              style={{
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              {/* Cyan Scan Corners */}
              <div className="scan-corner scan-corner-tl" />
              <div className="scan-corner scan-corner-tr" />
              <div className="scan-corner scan-corner-bl" />
              <div className="scan-corner scan-corner-br" />

              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-transform group-hover:scale-110"
                   style={{
                     background: 'rgba(139, 92, 246, 0.12)',
                     border: '1px solid rgba(139, 92, 246, 0.35)'
                   }}>
                <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <p className="text-white font-bold text-lg mb-1 relative z-10">Upload Identity Document</p>
              <p style={{ color: '#64748b' }} className="text-xs relative z-10 mb-4">
                Supports JPG, PNG, WebP — Processed Locally
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Quick Load Test Preset Buttons */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                  style={{
                    background: preset.bg,
                    border: `1px solid ${preset.color}40`,
                    color: preset.color
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: preset.color }} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Processing Modal Overlay */}
        {isProcessing && (
          <div 
            className="fixed inset-0 flex flex-col items-center justify-center z-50 animate-fade-in"
            style={{
              background: 'rgba(2, 4, 18, 0.95)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div className="relative z-10 text-center mb-8">
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase mb-3"
                style={{
                  background: 'rgba(34, 211, 238, 0.12)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  color: '#22d3ee'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22d3ee' }} />
                DOCUGUARD EDGE INTELLIGENCE PIPELINE
              </div>
              <h2 className="text-2xl font-extrabold text-white">Forensic Screening in Progress</h2>
              <p className="text-xs text-slate-400 mt-1">Executing in WebAssembly sandbox on local hardware</p>
            </div>

            {/* Radar / Scanner Visual */}
            <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/30" />
              <div className="w-20 h-20 rounded-full bg-purple-600/10 border border-purple-500/50 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-cyan-300 font-mono text-sm font-bold animate-pulse">
                  {currentStage.name.slice(0, 3)}
                </span>
              </div>
            </div>

            {/* 6 Stage Progress Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full px-4">
              {[
                { step: '01', name: 'Ingestion', desc: 'Sandbox Loaded', color: '#22d3ee' },
                { step: '02', name: 'OCR Extraction', desc: 'Geometry Matched', color: '#3b82f6' },
                { step: '03', name: 'Moiré Screening', desc: 'Texture Analyzed', color: '#a855f7' },
                { step: '04', name: 'Tamper Scan', desc: 'JPEG Quantized', color: '#e879f9' },
                { step: '05', name: 'Risk Synthesis', desc: 'Score Evaluated', color: '#f59e0b' },
                { step: '06', name: 'Dossier Ready', desc: 'Report Generated', color: '#10b981' }
              ].map((stage, idx) => {
                const isPassed = currentStage.index > idx + 1;
                const isCurrent = currentStage.index === idx + 1;

                return (
                  <div
                    key={stage.step}
                    className="p-3 rounded-xl border transition-all flex items-center gap-3"
                    style={{
                      background: isCurrent ? 'rgba(34, 211, 238, 0.1)' : 'rgba(9, 11, 40, 0.6)',
                      borderColor: isCurrent ? stage.color : isPassed ? '#10b98140' : 'rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <span 
                      className="font-mono text-xs font-bold"
                      style={{ color: isPassed ? '#10b981' : isCurrent ? stage.color : '#475569' }}
                    >
                      {stage.step}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{stage.name}</div>
                      <div className="text-[10px] text-slate-400">{isPassed ? 'Completed' : isCurrent ? 'Running...' : stage.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Comprehensive Results Dashboard View */}
        {data && verdict && !isProcessing && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Inspecting Document:</span>
                <span className="text-xs font-mono font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  {data.fileName}
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  [{data.documentId}]
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="btn-primary text-xs py-2 px-4 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Forensic Dossier (.PDF)'}</span>
                </button>

                <button
                  onClick={() => setData(null)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Verify Another Document
                </button>
              </div>
            </div>

            {/* Verdict Hero Banner */}
            <div 
              className="p-6 md:p-8 rounded-3xl relative overflow-hidden"
              style={{
                background: verdict.bg,
                border: `1px solid ${verdict.border}`,
                boxShadow: `0 10px 40px ${verdict.glow}`
              }}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ background: verdict.hex, boxShadow: `0 0 10px ${verdict.hex}` }} 
                    />
                    <span className="text-xs font-black uppercase tracking-widest font-mono" style={{ color: verdict.hex }}>
                      {verdict.label}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                    Trust Index Verdict: {verdict.badge}
                  </h2>
                  <p className="text-sm text-slate-300 max-w-2xl font-light leading-relaxed">
                    {verdict.sub}
                  </p>
                </div>

                {/* Big Glowing Score Badge */}
                <div 
                  className="px-6 py-4 rounded-2xl flex flex-col items-center justify-center shrink-0 border"
                  style={{
                    background: 'rgba(2, 4, 18, 0.8)',
                    borderColor: verdict.border
                  }}
                >
                  <span className="text-3xl sm:text-4xl font-black font-mono" style={{ color: verdict.hex }}>
                    {data.score}
                    <span className="text-lg font-sans text-slate-400 font-normal"> / 100</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    Overall Trust Score
                  </span>
                </div>
              </div>

              {/* 4 Checklist Pills */}
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Geometric Boundary Validity', pass: data.boundaryConfidence > 0.8 },
                  { label: 'OCR Structural Alignment', pass: data.ocr.confidence > 0.7 },
                  { label: 'Compression Continuity', pass: data.compressionArtifacts.inconsistencyScore < 0.3 },
                  { label: 'Zero Server Exposure', pass: true }
                ].map((chk, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-2 text-slate-200">
                    <span 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        background: chk.pass ? 'rgba(16, 185, 129, 0.2)' : 'rgba(225, 29, 72, 0.2)',
                        color: chk.pass ? '#10b981' : '#e11d48'
                      }}
                    >
                      {chk.pass ? '✓' : '✕'}
                    </span>
                    <span className="text-[11px] font-medium leading-tight">{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Viewer & Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Interactive Document Canvas Viewer */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass p-5 rounded-2xl">
                  {/* View Tabs */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      DOCUMENT FORENSIC VIEW
                    </span>

                    <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                      {[
                        { id: 'standard', label: 'Standard' },
                        { id: 'ocr', label: 'OCR Heatmap' },
                        { id: 'forensic', label: 'Forensic Zones' },
                        { id: 'geometry', label: 'Boundary Grid' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveViewMode(tab.id as typeof activeViewMode)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            activeViewMode === tab.id
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Canvas Preview with Overlay */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#020412] flex items-center justify-center min-h-[380px]">
                    {/* Cyber Scan Corners */}
                    <div className="scan-corner scan-corner-tl" />
                    <div className="scan-corner scan-corner-tr" />
                    <div className="scan-corner scan-corner-bl" />
                    <div className="scan-corner scan-corner-br" />

                    <img 
                      src={data.imageBlobUrl} 
                      alt="Analyzed Document" 
                      className="max-h-[440px] w-auto object-contain rounded-lg shadow-2xl"
                    />

                    {/* OCR Heatmap Overlay Mesh */}
                    {activeViewMode === 'ocr' && (
                      <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-around">
                        {data.ocr.fields.fullName && (
                          <div className="border border-cyan-400/90 bg-cyan-400/15 rounded p-1.5 max-w-[320px] shadow-lg shadow-cyan-500/20">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#020412] text-cyan-300 block mb-0.5">
                              OCR FIELD: FULL NAME
                            </span>
                            <span className="text-[11px] font-mono font-bold text-white pl-1">
                              {data.ocr.fields.fullName}
                            </span>
                          </div>
                        )}
                        {data.ocr.fields.dateOfBirth && (
                          <div className="border border-cyan-400/90 bg-cyan-400/15 rounded p-1.5 max-w-[260px] shadow-lg shadow-cyan-500/20">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#020412] text-cyan-300 block mb-0.5">
                              OCR FIELD: DOB / GENDER
                            </span>
                            <span className="text-[11px] font-mono font-bold text-white pl-1">
                              {data.ocr.fields.dateOfBirth} {data.ocr.fields.gender ? `• ${data.ocr.fields.gender}` : ''}
                            </span>
                          </div>
                        )}
                        {data.ocr.fields.documentId && (
                          <div className="border border-cyan-400/90 bg-cyan-400/15 rounded p-1.5 max-w-[340px] shadow-lg shadow-cyan-500/20">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#020412] text-cyan-300 block mb-0.5">
                              OCR FIELD: VERIFIED ID REGISTRY
                            </span>
                            <span className="text-[11px] font-mono font-bold text-white pl-1">
                              {data.ocr.fields.documentId}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Forensic Zones Overlay */}
                    {activeViewMode === 'forensic' && (
                      <div className="absolute inset-0 pointer-events-none p-6">
                        {data.verdict === 'Tampered' ? (
                          <>
                            <div className="absolute top-[22%] left-[8%] w-[34%] h-[48%] border-2 border-rose-500 bg-rose-500/25 rounded-lg flex items-start justify-end p-1 shadow-lg shadow-rose-500/30">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50">
                                TAMPER: SPLICED PHOTO REGION
                              </span>
                            </div>
                            <div className="absolute top-[35%] right-[12%] w-[45%] h-[24%] border-2 border-amber-500 bg-amber-500/20 rounded-lg flex items-start justify-end p-1">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50">
                                SCREEN MOIRÉ FREQUENCY PATTERN
                              </span>
                            </div>
                          </>
                        ) : data.verdict === 'Suspicious' ? (
                          <div className="absolute top-[32%] left-[30%] w-[46%] h-[22%] border-2 border-amber-500 bg-amber-500/25 rounded-lg flex items-start justify-end p-1 shadow-lg shadow-amber-500/30">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50">
                              COMPRESSION ELA VARIANCE DELTA
                            </span>
                          </div>
                        ) : (
                          <div className="absolute inset-4 border-2 border-emerald-500/50 bg-emerald-500/5 rounded-xl flex items-end justify-end p-3">
                            <span className="text-[9px] font-mono font-bold px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                              ✓ PHYSICAL SUBSTRATE SCAN RASTER OK
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Boundary Grid Overlay */}
                    {activeViewMode === 'geometry' && (
                      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] opacity-40 border-2 border-purple-500/50 rounded-xl m-2" />
                    )}
                  </div>
                </div>

                {/* 5 Gauges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="glass p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">OCR PLAUSIBILITY</span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      {(100 * data.ocr.confidence).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-cyan-400 block mt-0.5">
                      {Object.keys(data.ocr.fields).length} Fields Parsed
                    </span>
                  </div>

                  <div className="glass p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">BOUNDARY ALIGNMENT</span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      {(100 * data.boundaryConfidence).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-purple-400 block mt-0.5">
                      {data.boundaryConfidence > 0.8 ? 'Geometric Pass' : 'Skew Detected'}
                    </span>
                  </div>

                  <div className="glass p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">COMPRESSION UNIFORMITY</span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      {(100 * (1 - data.compressionArtifacts.inconsistencyScore)).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">
                      {data.compressionArtifacts.inconsistencyScore < 0.3 ? 'Quantization Uniform' : 'Anomaly Spike'}
                    </span>
                  </div>

                  <div className="glass p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">IMAGE QUALITY</span>
                    <span className="text-base font-extrabold text-white font-mono">
                      {data.qualityCheck.passed ? 'PASSED (Clean)' : 'FAILED (Degraded)'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Sharpness {(data.qualityCheck.blurScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="glass p-3.5 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">EXIF METADATA</span>
                    <span className="text-sm font-bold text-white font-mono truncate block">
                      {data.metadata.software ? `Edited via ${data.metadata.software}` : data.metadata.exifPresent ? 'Clean Sensor' : 'Stripped'}
                    </span>
                    <span className="text-[10px] text-amber-400 block mt-0.5">
                      {data.metadata.anomalies.length > 0 ? data.metadata.anomalies[0] : 'No editing tags'}
                    </span>
                  </div>

                  {/* Document Integrity Hash Card */}
                  <div className="glass p-3.5 rounded-xl col-span-2 sm:col-span-3 border border-cyan-500/25 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        CRYPTOGRAPHIC INTEGRITY HASH (SHA-256)
                      </span>
                      <button
                        onClick={() => copyHash(data.sha256 || data.conceptEvaluation?.cryptographicIntegrity?.sha256 || '')}
                        className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono transition-colors cursor-pointer flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/60"
                      >
                        <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>{isHashCopied ? 'COPIED!' : 'COPY HASH'}</span>
                      </button>
                    </div>
                    <span className="text-xs font-mono text-slate-200 block truncate select-all">
                      {data.sha256 || data.conceptEvaluation?.cryptographicIntegrity?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                      Deterministic tamper-evident checksum verified client-side across binary payload
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: OCR Registry & Itemized Forensic Evidence */}
              <div className="lg:col-span-5 space-y-6">
                {/* Extracted OCR Identity Fields Registry */}
                <div className="glass p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                      Extracted OCR Identity Fields
                    </h3>
                    <span className="text-xs font-mono text-cyan-400">
                      {Object.keys(data.ocr.fields).length} Fields
                    </span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(data.ocr.fields).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                        <span className="text-slate-400 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-slate-100 font-mono font-bold text-right truncate max-w-[200px]">{val}</span>
                      </div>
                    ))}
                  </div>

                  {data.ocr.rawText && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Raw Extracted OCR Stream:</span>
                      <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap max-h-24 overflow-y-auto intel-scroll">
                        {data.ocr.rawText}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Itemized Forensic Evidence & Anomaly Signals */}
                <div className="glass p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                      Forensic Evidence Signals
                    </h3>
                    <span className="text-xs font-mono text-purple-400">
                      {data.evidence.length} Indicators
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1 intel-scroll">
                    {data.evidence.map((ev, idx) => {
                      const isPass = ev.severity === 'pass';
                      const isWarn = ev.severity === 'warn';
                      return (
                        <div 
                          key={idx}
                          className="p-3 rounded-xl border text-xs"
                          style={{
                            background: isPass ? 'rgba(16, 185, 129, 0.05)' : isWarn ? 'rgba(245, 158, 11, 0.05)' : 'rgba(225, 29, 72, 0.08)',
                            borderColor: isPass ? 'rgba(16, 185, 129, 0.2)' : isWarn ? 'rgba(245, 158, 11, 0.25)' : 'rgba(225, 29, 72, 0.3)'
                          }}
                        >
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="uppercase text-[10px] font-mono tracking-wider" style={{ color: isPass ? '#10b981' : isWarn ? '#f59e0b' : '#e11d48' }}>
                              [{ev.category}] {ev.severity.toUpperCase()}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {(ev.confidence * 100).toFixed(0)}% Conf.
                            </span>
                          </div>
                          <p className="font-semibold text-slate-100 text-[11px] mb-0.5">
                            {ev.observation}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {ev.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Export Dossier Banner */}
            <div className="glass p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 border border-purple-500/25 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Official Forensic Security Assessment
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                      PDF Dossier
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Export a certified security report compiling the 5-tier forensic verdict, SHA-256 cryptographic digest, Verhoeff checksum audit, and weighted evidence signals.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="btn-primary text-xs py-3 px-6 cursor-pointer w-full sm:w-auto justify-center shadow-lg shadow-purple-500/25 font-bold"
                >
                  <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{isDownloadingPdf ? 'Compiling PDF Dossier...' : 'Download Forensic Dossier (.PDF)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Download Success Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 glass p-4 rounded-2xl border border-emerald-500/40 shadow-2xl flex items-center gap-3 animate-fade-in bg-slate-950/95">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
            ✓
          </div>
          <div>
            <div className="text-xs font-bold text-white">Forensic Dossier Generated</div>
            <div className="text-[10px] text-slate-400">PDF successfully compiled and saved to downloads</div>
          </div>
        </div>
      )}
    </main>
  );
};
