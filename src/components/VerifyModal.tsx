import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileCheck2, 
  ShieldAlert, 
  ShieldCheck, 
  Hash, 
  Copy, 
  Check, 
  RefreshCw
} from 'lucide-react';
import { calculateSha256 } from '../utils/forensics';

interface VerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocHash: string;
  currentDocName: string;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  isOpen,
  onClose,
  currentDocHash,
  currentDocName
}) => {
  const [targetHashInput, setTargetHashInput] = useState<string>('');
  const [uploadedFileHash, setUploadedFileHash] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsHashing(true);
    setUploadedFileName(file.name);
    try {
      const hash = await calculateSha256(file);
      setUploadedFileHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleCopyCurrentHash = () => {
    navigator.clipboard.writeText(currentDocHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine comparison verdict
  const compareHash = uploadedFileHash || targetHashInput.trim();
  const hasComparison = Boolean(compareHash);
  const isMatch = hasComparison && compareHash.toLowerCase() === currentDocHash.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cryptographic Integrity Verification</h3>
              <p className="text-xs text-slate-400">Compare SHA-256 fingerprint against secondary or historical copies</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Document Hash Fingerprint */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Current Document In-Memory Fingerprint</span>
            <span className="text-slate-500 truncate max-w-[200px]">{currentDocName}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-400 select-all break-all">
              {currentDocHash || 'Computing hash digest...'}
            </div>
            <button
              onClick={handleCopyCurrentHash}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Copy Hash to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Method 1: Upload a file to test match */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-200 block">
            Option A: Upload a secondary file to test match
          </span>

          <label className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/40 transition-colors group">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
            {isHashing ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing SHA-256 Checksum...</span>
              </div>
            ) : uploadedFileHash ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">{uploadedFileName}</p>
                <p className="text-[11px] font-mono text-slate-400 truncate max-w-sm">{uploadedFileHash}</p>
                <span className="text-[10px] text-cyan-400 underline block mt-1">Click to select different file</span>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
                <p className="text-xs text-slate-300 font-medium">Click to select a suspect or reference document</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculates checksum on client side</p>
              </>
            )}
          </label>
        </div>

        {/* Method 2: Paste a known SHA-256 hash */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-200 block">
            Option B: Or paste expected SHA-256 fingerprint string
          </span>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={targetHashInput}
              onChange={(e) => {
                setTargetHashInput(e.target.value);
                setUploadedFileHash(null);
              }}
              placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Verdict Box */}
        {hasComparison && (
          <div className={`p-4 rounded-xl border text-xs space-y-1 ${
            isMatch
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {isMatch ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>INTEGRITY VERIFIED: 100% BYTE-FOR-BYTE IDENTICAL</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>CHECKSUM MISMATCH: TAMPERING OR MODIFICATION DETECTED</span>
                </>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-slate-300">
              {isMatch
                ? 'The compared document matches the exact cryptographic hash digest. No pixels, text characters, or byte streams have been altered.'
                : 'The cryptographic fingerprint diverges completely. Even a single modified character, cropped margin, or re-saved compression artifact causes hash divergence.'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
