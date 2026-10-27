import React from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Lock, 
  CheckSquare, 
  Square,
  Crosshair,
  SlidersHorizontal
} from 'lucide-react';
import { RedactionItem, RedactionStyle, RedactionType } from '../types/document';

interface RedactionPanelProps {
  redactions: RedactionItem[];
  setRedactions: React.Dispatch<React.SetStateAction<RedactionItem[]>>;
  onAutoScanPii: () => void;
  isScanning: boolean;
  globalStyle: RedactionStyle;
  setGlobalStyle: (style: RedactionStyle) => void;
  onClearAll: () => void;
  selectedRedactionId?: string | null;
  onSelectRedaction: (id: string | null) => void;
}

export const RedactionPanel: React.FC<RedactionPanelProps> = ({
  redactions,
  setRedactions,
  onAutoScanPii,
  isScanning,
  globalStyle,
  setGlobalStyle,
  onClearAll,
  selectedRedactionId,
  onSelectRedaction
}) => {
  const activeCount = redactions.filter(r => r.isActive).length;

  const toggleRedaction = (id: string) => {
    setRedactions(prev =>
      prev.map(r => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const deleteRedaction = (id: string) => {
    setRedactions(prev => prev.filter(r => r.id !== id));
    if (selectedRedactionId === id) onSelectRedaction(null);
  };

  const toggleAll = (activate: boolean) => {
    setRedactions(prev => prev.map(r => ({ ...r, isActive: activate })));
  };

  const changeStyle = (id: string, style: RedactionStyle) => {
    setRedactions(prev =>
      prev.map(r => (r.id === id ? { ...r, style } : r))
    );
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-5 bg-slate-900/60 border-l border-slate-800">
      {/* Title & Auto-Detect Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Smart PII Redactor</h3>
              <p className="text-xs text-slate-400">Irreversible client-side pixel burn-in</p>
            </div>
          </div>

          <button
            onClick={onAutoScanPii}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isScanning ? 'Scanning...' : 'Auto-Detect PII'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Automatically flags SSNs, tax numbers, credit cards, emails, phone numbers, and compensation figures.
        </p>

        {/* Global Redaction Style Selector */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Default Mask Style:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(['blackout', 'blur', 'pixelate'] as RedactionStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => {
                  setGlobalStyle(style);
                  // Update all active to this style
                  setRedactions(prev => prev.map(r => ({ ...r, style })));
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-all border ${
                  globalStyle === style
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                {style === 'blackout' ? '■ Blackout' : style === 'blur' ? '≋ Blur' : '▦ Pixelate'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Drag-Box Guide */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
        <Crosshair className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block">Manual Canvas Redaction</span>
          <span className="text-slate-400">
            Click & drag anywhere on the document canvas to blackout or blur custom rectangular areas.
          </span>
        </div>
      </div>

      {/* Inventory of Redactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            Active Redactions ({activeCount}/{redactions.length})
          </span>

          <div className="flex items-center gap-2">
            {redactions.length > 0 && (
              <>
                <button
                  onClick={() => toggleAll(activeCount < redactions.length)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {activeCount < redactions.length ? 'Select All' : 'Deselect All'}
                </button>
                <span className="text-slate-700">•</span>
                <button
                  onClick={onClearAll}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {redactions.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            <Lock className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            <p className="font-medium text-slate-400">No redactions active</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Click &quot;Auto-Detect PII&quot; above or drag a box directly on the document.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {redactions.map((item, idx) => {
              const isSelected = item.id === selectedRedactionId;
              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleRedaction(item.id)}
                      className="flex items-center gap-2 truncate text-left"
                    >
                      {item.isActive ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className={`font-semibold truncate ${item.isActive ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                        {item.label}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Individual style selector */}
                      <select
                        value={item.style}
                        onChange={(e) => changeStyle(item.id, e.target.value as RedactionStyle)}
                        className="bg-slate-800 text-slate-300 text-[10px] rounded px-1.5 py-0.5 border border-slate-700 outline-none"
                      >
                        <option value="blackout">Blackout</option>
                        <option value="blur">Blur</option>
                        <option value="pixelate">Pixelate</option>
                      </select>

                      <button
                        onClick={() => deleteRedaction(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete redaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Pos: {item.x}, {item.y}</span>
                    <span>Dim: {item.width}×{item.height} px</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Guarantee Note */}
      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-[11px] flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          <strong>Zero-Extraction Guarantee:</strong> Redactions are permanently rasterized into the canvas bitmap on export. Underlying characters cannot be recovered by inspecting PDF layers or metadata.
        </span>
      </div>
    </div>
  );
};
