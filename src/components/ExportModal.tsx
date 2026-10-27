import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  ShieldCheck, 
  Image as ImageIcon, 
  Award, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react';
import { ForensicAnalysisResult, RedactionItem, WatermarkConfig } from '../types/document';
import { downloadProtectedPdf, downloadSanitizedImage, downloadForensicAuditReport } from '../utils/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceImage: HTMLImageElement | null;
  currentDocName: string;
  sha256Hash: string;
  redactions: RedactionItem[];
  watermark: WatermarkConfig;
  analysis: ForensicAnalysisResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sourceImage,
  currentDocName,
  sha256Hash,
  redactions,
  watermark,
  analysis
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'report' | 'png' | 'jpeg'>('pdf');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  if (!isOpen || !sourceImage) return null;

  const activeRedactions = redactions.filter(r => r.isActive).length;

  const handleExecuteExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      if (selectedFormat === 'pdf') {
        await downloadProtectedPdf(sourceImage, redactions, watermark, sha256Hash, currentDocName);
      } else if (selectedFormat === 'report' && analysis) {
        await downloadForensicAuditReport(currentDocName, sha256Hash, analysis, sourceImage);
      } else if (selectedFormat === 'png') {
        downloadSanitizedImage(sourceImage, redactions, watermark, sha256Hash, currentDocName, 'png');
      } else if (selectedFormat === 'jpeg') {
        downloadSanitizedImage(sourceImage, redactions, watermark, sha256Hash, currentDocName, 'jpeg');
      }
      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Protected Document</h3>
              <p className="text-xs text-slate-400">Select export container format and security configuration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 block">Choose Container Type:</span>

          <div className="space-y-2">
            {[
              {
                id: 'pdf',
                title: 'Tamper-Proof Protected PDF (.pdf)',
                desc: 'Full-resolution document with irreversible burned-in redactions, security watermark, and cryptographic SHA-256 metadata.',
                icon: FileText,
                badge: 'Recommended'
              },
              {
                id: 'report',
                title: 'Forensic Audit Certificate Report (.pdf)',
                desc: 'Comprehensive multi-page audit with ELA heatmaps, anomaly inventory, tamper score, and chain of custody signature.',
                icon: Award,
                badge: 'Auditor Grade'
              },
              {
                id: 'png',
                title: 'Sanitized Lossless Image (.png)',
                desc: 'Pixel-perfect lossless raster with all sensitive fields permanently masked.',
                icon: ImageIcon
              },
              {
                id: 'jpeg',
                title: 'High-Efficiency Sanitized JPEG (.jpg)',
                desc: 'Optimized 95% quality JPEG suited for email distribution or mobile viewers.',
                icon: ImageIcon
              }
            ].map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = selectedFormat === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as typeof selectedFormat)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-md shadow-emerald-950/20'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                    isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {fmt.title}
                      </span>
                      {fmt.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {fmt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {fmt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applied Security Features Summary Box */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
          <span className="font-semibold text-slate-300 block">Pre-Export Security Audit Status:</span>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div>• Active Redactions: <span className="text-white font-mono">{activeRedactions}</span></div>
            <div>• Watermark: <span className="text-white font-mono">{watermark.enabled ? 'ACTIVE' : 'DISABLED'}</span></div>
            <div>• Cryptographic Seal: <span className="text-white font-mono">{watermark.customStamp !== 'none' ? 'EMBEDDED' : 'NONE'}</span></div>
            <div>• SHA-256 Digest: <span className="text-emerald-400 font-mono truncate">{sha256Hash.slice(0, 8)}...</span></div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing & Compiling...</span>
              </>
            ) : exportComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Exported Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
