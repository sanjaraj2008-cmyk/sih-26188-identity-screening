import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Sliders, 
  Sparkles, 
  AlertOctagon, 
  CheckCircle2, 
  Info,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { AnomalyRegion, ForensicAnalysisResult, DocumentMetadata } from '../types/document';

interface ForensicsPanelProps {
  analysis: ForensicAnalysisResult | null;
  metadata: DocumentMetadata | null;
  elaMultiplier: number;
  setElaMultiplier: (val: number) => void;
  elaQuality: number;
  setElaQuality: (val: number) => void;
  onRecalculateEla: () => void;
  isAnalyzing: boolean;
  onRunAiAudit: () => void;
  isAiAuditing: boolean;
  selectedAnomalyId?: string | null;
  onSelectAnomaly: (id: string | null) => void;
}

export const ForensicsPanel: React.FC<ForensicsPanelProps> = ({
  analysis,
  metadata,
  elaMultiplier,
  setElaMultiplier,
  elaQuality,
  setElaQuality,
  onRecalculateEla,
  isAnalyzing,
  onRunAiAudit,
  isAiAuditing,
  selectedAnomalyId,
  onSelectAnomaly
}) => {
  if (!analysis) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-medium">Running Error Level Analysis & Forensic Scan...</p>
      </div>
    );
  }

  const score = analysis.tamperScore;
  const isHighRisk = score >= 50;
  const isModerate = score >= 25 && score < 50;

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-5 bg-slate-900/60 border-l border-slate-800">
      {/* 1. Tamper Risk Score Card */}
      <div className={`p-4 rounded-xl border backdrop-blur-sm relative overflow-hidden ${
        isHighRisk 
          ? 'bg-rose-950/30 border-rose-800/60 shadow-lg shadow-rose-950/20' 
          : isModerate 
          ? 'bg-amber-950/30 border-amber-800/60 shadow-lg shadow-amber-950/20' 
          : 'bg-emerald-950/30 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isHighRisk ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span>Tamper Probability Gauge</span>
            </div>
            <h3 className={`text-xl font-extrabold mt-1 tracking-tight ${
              isHighRisk ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {analysis.riskLevel}
            </h3>
          </div>

          <div className={`text-3xl font-black font-mono px-3 py-1 rounded-xl border ${
            isHighRisk 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
              : isModerate 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {score}<span className="text-sm font-sans font-normal opacity-70">%</span>
          </div>
        </div>

        {/* Meter Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
          <div 
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              isHighRisk ? 'bg-gradient-to-r from-amber-500 to-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        </div>

        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* 2. ELA Calibration Controls */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>ELA Forensic Calibration</span>
          </div>
          <button
            onClick={onRecalculateEla}
            disabled={isAnalyzing}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Recalibrate</span>
          </button>
        </div>

        {/* Multiplier Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Error Amplification Multiplier</span>
            <span className="font-mono text-cyan-300 font-bold">{elaMultiplier}x</span>
          </div>
          <input
            type="range"
            min={10}
            max={45}
            step={5}
            value={elaMultiplier}
            onChange={(e) => setElaMultiplier(Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Quality Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Recompression JPEG Quality</span>
            <span className="font-mono text-cyan-300 font-bold">{Math.round(elaQuality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.65}
            max={0.90}
            step={0.05}
            value={elaQuality}
            onChange={(e) => setElaQuality(Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div>
            Peak Delta: <span className="text-slate-200 font-bold">{analysis.technicalDetails.peakDelta.toFixed(1)} px</span>
          </div>
          <div>
            Avg Delta: <span className="text-slate-200 font-bold">{analysis.technicalDetails.averageLuminanceDifference.toFixed(2)} px</span>
          </div>
        </div>
      </div>

      {/* 3. Flagged Suspicious Regions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
          <div className="flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Flagged Anomaly Regions ({analysis.anomalies.length})</span>
          </div>
        </div>

        {analysis.anomalies.length === 0 ? (
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No localized compression hot-spots detected. Uniform noise profile throughout.</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {analysis.anomalies.map((anom, idx) => {
              const isSelected = anom.id === selectedAnomalyId;
              return (
                <div
                  key={anom.id}
                  onClick={() => onSelectAnomaly(isSelected ? null : anom.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 text-slate-100 shadow-md shadow-rose-950/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1 text-rose-400">
                      <span>#{idx + 1}</span>
                      <span className="uppercase text-[11px]">{anom.severity} anomaly</span>
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {anom.confidence}% Conf.
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {anom.description}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>X: {anom.x} • Y: {anom.y}</span>
                    <span className="text-cyan-400 flex items-center gap-0.5 font-medium">
                      <span>Click to focus</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Metadata & EXIF Analysis */}
      {metadata && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Digital Metadata Provenance</span>
          </div>

          <div className="text-xs space-y-1.5">
            {metadata.exifSoftware && (
              <div className="flex items-center justify-between p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span className="font-medium">Editor Detected:</span>
                <span className="font-mono font-bold">{metadata.exifSoftware}</span>
              </div>
            )}

            {metadata.exifModifyDate && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Modification Date:</span>
                <span className="font-mono text-slate-300">{metadata.exifModifyDate}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span>Original Canvas Res:</span>
              <span className="font-mono text-slate-300">
                {metadata.dimensions.width} × {metadata.dimensions.height} px
              </span>
            </div>

            {metadata.exifWarnings.length > 0 ? (
              <div className="mt-2 space-y-1">
                {metadata.exifWarnings.map((w, wIdx) => (
                  <p key={wIdx} className="text-[11px] text-amber-400 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>No secondary raster tool signatures detected in EXIF.</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. AI Deep Forensic Audit Card */}
      <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-800/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Deep Fraud Reasoning</span>
          </div>

          <button
            onClick={onRunAiAudit}
            disabled={isAiAuditing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isAiAuditing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Auditing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{analysis.aiReport ? 'Re-audit' : 'Run AI Audit'}</span>
              </>
            )}
          </button>
        </div>

        {analysis.aiReport ? (
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50">
              <span className="font-semibold text-indigo-300 block mb-1">Risk Assessment:</span>
              <p className="text-slate-200 leading-relaxed text-[11px]">
                {analysis.aiReport.riskAssessment}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-300 block text-[11px]">Key Findings:</span>
              {analysis.aiReport.findings.map((f, fIdx) => (
                <p key={fIdx} className="text-[11px] text-slate-400 flex items-start gap-1">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{f}</span>
                </p>
              ))}
            </div>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300">Evidentiary / Compliance:</span>{' '}
              {analysis.aiReport.legalRiskNotes}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Click Run AI Audit to generate an executive legal & forensic opinion on font consistency, document layout, and fraud risk.
          </p>
        )}
      </div>
    </div>
  );
};
