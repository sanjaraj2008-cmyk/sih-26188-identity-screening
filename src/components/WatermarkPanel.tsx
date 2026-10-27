import React from 'react';
import { 
  Layers, 
  RotateCw, 
  Hash, 
  Clock, 
  Award, 
  Palette,
  LayoutGrid
} from 'lucide-react';
import { WatermarkConfig, WatermarkLayout } from '../types/document';

interface WatermarkPanelProps {
  watermark: WatermarkConfig;
  setWatermark: React.Dispatch<React.SetStateAction<WatermarkConfig>>;
  sha256Hash: string;
}

const WATERMARK_PRESETS = [
  'CONFIDENTIAL',
  'VERIFIED AUTHENTIC',
  'DO NOT DUPLICATE',
  'FOR REVIEW ONLY',
  'RESTRICTED LEGAL DRAFT',
  'OFFICIALLY CERTIFIED'
];

const COLOR_SWATCHES = [
  { name: 'Ruby Red', color: '#ef4444' },
  { name: 'Amber Gold', color: '#f59e0b' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Cyan Blue', color: '#06b6d4' },
  { name: 'Slate Grey', color: '#64748b' },
  { name: 'Deep Indigo', color: '#6366f1' },
];

export const WatermarkPanel: React.FC<WatermarkPanelProps> = ({
  watermark,
  setWatermark,
  sha256Hash
}) => {
  const updateConfig = (updates: Partial<WatermarkConfig>) => {
    setWatermark(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-5 bg-slate-900/60 border-l border-slate-800">
      {/* Enable Watermark Master Switch */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dynamic Watermark</h3>
              <p className="text-xs text-slate-400">Anti-tamper provenance stamping</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={watermark.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Embed custom security watermarks, cryptographic fingerprints, and anti-leak identifiers into protected document exports.
        </p>
      </div>

      {/* Watermark Text & Presets */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 block">
          Watermark Copy / Text
        </label>
        <input
          type="text"
          value={watermark.text}
          onChange={(e) => updateConfig({ text: e.target.value })}
          placeholder="e.g. CONFIDENTIAL"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
        />

        {/* Quick presets pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {WATERMARK_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => updateConfig({ text: preset, enabled: true })}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-all ${
                watermark.text === preset
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          <span>Watermark Distribution</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: 'diagonal', label: 'Diagonal 45°', desc: 'Corner-to-corner banner' },
            { id: 'grid', label: 'Repeating Grid', desc: 'All-over tiled security' },
            { id: 'center', label: 'Center Focal', desc: 'Prominent middle stamp' },
            { id: 'bottom-right', label: 'Bottom Right', desc: 'Subtle archival badge' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => updateConfig({ layout: l.id as WatermarkLayout })}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                watermark.layout === l.id
                  ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-950/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-200">{l.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{l.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Sliders: Opacity, Font Size, Rotation */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Opacity Intensity</span>
            <span className="font-mono text-indigo-300 font-bold">{Math.round(watermark.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.80}
            step={0.05}
            value={watermark.opacity}
            onChange={(e) => updateConfig({ opacity: Number(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Font Size</span>
            <span className="font-mono text-indigo-300 font-bold">{watermark.fontSize} px</span>
          </div>
          <input
            type="range"
            min={20}
            max={90}
            step={2}
            value={watermark.fontSize}
            onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {watermark.layout !== 'diagonal' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                Rotation Angle
              </span>
              <span className="font-mono text-indigo-300 font-bold">{watermark.rotation}°</span>
            </div>
            <input
              type="range"
              min={-90}
              max={90}
              step={5}
              value={watermark.rotation}
              onChange={(e) => updateConfig({ rotation: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Color Palette */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-indigo-400" />
              Watermark Tint:
            </span>
          </div>
          <div className="flex items-center gap-2">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.color}
                onClick={() => updateConfig({ color: swatch.color })}
                style={{ backgroundColor: swatch.color }}
                className={`w-6 h-6 rounded-full transition-transform border-2 ${
                  watermark.color === swatch.color ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                }`}
                title={swatch.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Metadata Stamp Toggles */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <span className="text-xs font-bold text-slate-200 block">
          Tamper-Resistant Metadata Stamping
        </span>

        <label className="flex items-center justify-between p-2 rounded-lg bg-slate-850 hover:bg-slate-800/80 cursor-pointer">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stamp UTC Date & Timestamp</span>
          </div>
          <input
            type="checkbox"
            checked={watermark.includeTimestamp}
            onChange={(e) => updateConfig({ includeTimestamp: e.target.checked })}
            className="accent-indigo-500 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-lg bg-slate-850 hover:bg-slate-800/80 cursor-pointer">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stamp SHA-256 Digest Fingerprint</span>
          </div>
          <input
            type="checkbox"
            checked={watermark.includeSha256Hash}
            onChange={(e) => updateConfig({ includeSha256Hash: e.target.checked })}
            className="accent-indigo-500 rounded"
          />
        </label>
      </div>

      {/* Official Cryptographic Verification Stamp Seal */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Official Cryptographic Seal Stamp</span>
        </div>

        <div className="space-y-1.5">
          {[
            { id: 'none', label: 'None', desc: 'No corner badge' },
            { id: 'verified_badge', label: '★ DocuGuard Verified Integrity Badge', desc: 'Green certified verification badge with hash' },
            { id: 'confidential_seal', label: '🔒 Restricted Confidential Seal', desc: 'Amber strict privacy certificate' },
            { id: 'tamper_resistant_audit', label: '🛡️ Tamper-Resistant Audit Stamp', desc: 'Indigo cryptographic evidentiary stamp' }
          ].map((stamp) => (
            <label
              key={stamp.id}
              className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                watermark.customStamp === stamp.id
                  ? 'bg-indigo-950/40 border-indigo-500 text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="customStamp"
                checked={watermark.customStamp === stamp.id}
                onChange={() => updateConfig({ customStamp: stamp.id as WatermarkConfig['customStamp'] })}
                className="mt-0.5 accent-indigo-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">{stamp.label}</span>
                <span className="text-[10px] text-slate-500">{stamp.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
