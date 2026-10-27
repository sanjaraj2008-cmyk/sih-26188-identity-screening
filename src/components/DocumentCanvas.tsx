import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Sliders, 
  Eye, 
  AlertTriangle,
  Move,
  Scissors
} from 'lucide-react';
import { AnomalyRegion, RedactionItem, WatermarkConfig } from '../types/document';
import { applyRedactionsToCanvas } from '../utils/piiDetector';
import { applyWatermarkToCanvas } from '../utils/watermark';

export type CanvasViewMode = 'original' | 'ela' | 'noise' | 'edge' | 'split';

interface DocumentCanvasProps {
  sourceImage: HTMLImageElement | null;
  elaDataUrl: string;
  noiseDataUrl: string;
  edgeDataUrl: string;
  anomalies: AnomalyRegion[];
  redactions: RedactionItem[];
  watermark: WatermarkConfig;
  sha256Hash: string;
  activeTab: 'forensics' | 'redaction' | 'watermark';
  viewMode: CanvasViewMode;
  setViewMode: (mode: CanvasViewMode) => void;
  onAddRedaction: (box: { x: number; y: number; width: number; height: number }) => void;
  onSelectRedaction?: (id: string) => void;
  selectedAnomalyId?: string | null;
  onSelectAnomaly?: (id: string | null) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  sourceImage,
  elaDataUrl,
  noiseDataUrl,
  edgeDataUrl,
  anomalies,
  redactions,
  watermark,
  sha256Hash,
  activeTab,
  viewMode,
  setViewMode,
  onAddRedaction,
  selectedAnomalyId,
  onSelectAnomaly
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Split-screen comparison slider position (0 to 1)
  const [splitPos, setSplitPos] = useState<number>(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // Box drawing for manual redaction
  const [isDrawingBox, setIsDrawingBox] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Secondary images for ELA/Noise/Edge
  const [elaImg, setElaImg] = useState<HTMLImageElement | null>(null);
  const [noiseImg, setNoiseImg] = useState<HTMLImageElement | null>(null);
  const [edgeImg, setEdgeImg] = useState<HTMLImageElement | null>(null);

  // Load secondary images
  useEffect(() => {
    if (elaDataUrl) {
      const img = new Image();
      img.onload = () => setElaImg(img);
      img.src = elaDataUrl;
    }
  }, [elaDataUrl]);

  useEffect(() => {
    if (noiseDataUrl) {
      const img = new Image();
      img.onload = () => setNoiseImg(img);
      img.src = noiseDataUrl;
    }
  }, [noiseDataUrl]);

  useEffect(() => {
    if (edgeDataUrl) {
      const img = new Image();
      img.onload = () => setEdgeImg(img);
      img.src = edgeDataUrl;
    }
  }, [edgeDataUrl]);

  // Fit to screen on initial load
  const handleFitToScreen = useCallback(() => {
    if (!sourceImage || !containerRef.current) return;
    const contW = containerRef.current.clientWidth - 40;
    const contH = containerRef.current.clientHeight - 40;
    const imgW = sourceImage.naturalWidth || sourceImage.width;
    const imgH = sourceImage.naturalHeight || sourceImage.height;

    const scale = Math.min(contW / imgW, contH / imgH, 1);
    setZoom(Math.max(0.2, scale));
    setPan({ x: 0, y: 0 });
  }, [sourceImage]);

  useEffect(() => {
    handleFitToScreen();
  }, [sourceImage, handleFitToScreen]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const natW = sourceImage.naturalWidth || sourceImage.width;
    const natH = sourceImage.naturalHeight || sourceImage.height;

    canvas.width = natW;
    canvas.height = natH;

    ctx.clearRect(0, 0, natW, natH);

    // Render Base View based on mode
    if (viewMode === 'original') {
      ctx.drawImage(sourceImage, 0, 0);
    } else if (viewMode === 'ela' && elaImg) {
      ctx.drawImage(elaImg, 0, 0);
    } else if (viewMode === 'noise' && noiseImg) {
      ctx.drawImage(noiseImg, 0, 0);
    } else if (viewMode === 'edge' && edgeImg) {
      ctx.drawImage(edgeImg, 0, 0);
    } else if (viewMode === 'split' && elaImg) {
      // Split view: Left side original, Right side ELA
      const splitX = Math.round(natW * splitPos);

      // Draw original on left
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, natH);
      ctx.clip();
      ctx.drawImage(sourceImage, 0, 0);
      ctx.restore();

      // Draw ELA on right
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, natW - splitX, natH);
      ctx.clip();
      ctx.drawImage(elaImg, 0, 0);
      ctx.restore();

      // Draw vertical divider bar
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, natH);
      ctx.stroke();
    } else {
      ctx.drawImage(sourceImage, 0, 0);
    }

    // Overlay Redactions (when in original or redaction or watermark mode)
    if (viewMode === 'original' || activeTab === 'redaction' || activeTab === 'watermark') {
      applyRedactionsToCanvas(ctx, redactions, 1);
    }

    // Overlay Watermark
    if (watermark.enabled) {
      applyWatermarkToCanvas(ctx, watermark, sha256Hash, 1);
    }

    // Overlay Anomaly Highlights if in Forensics tab and not in pure watermark/redact
    if (activeTab === 'forensics' && (viewMode === 'original' || viewMode === 'ela' || viewMode === 'split')) {
      anomalies.forEach((anom) => {
        const isSelected = anom.id === selectedAnomalyId;
        ctx.save();
        ctx.strokeStyle = isSelected ? '#f43f5e' : '#f59e0b';
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.setLineDash(isSelected ? [] : [6, 4]);
        ctx.strokeRect(anom.x, anom.y, anom.width, anom.height);

        // Semi-transparent wash
        ctx.fillStyle = isSelected ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.12)';
        ctx.fillRect(anom.x, anom.y, anom.width, anom.height);

        // Badge indicator
        ctx.fillStyle = isSelected ? '#f43f5e' : '#f59e0b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`! ${anom.severity.toUpperCase()}`, anom.x + 4, Math.max(16, anom.y - 6));
        ctx.restore();
      });
    }

    // Overlay Active Drawing Box
    if (currentBox) {
      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.fillRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      ctx.restore();
    }
  }, [
    sourceImage, 
    elaImg, 
    noiseImg, 
    edgeImg, 
    viewMode, 
    splitPos, 
    redactions, 
    watermark, 
    sha256Hash, 
    anomalies, 
    selectedAnomalyId, 
    activeTab, 
    currentBox
  ]);

  // Coordinate conversion helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY)
    };
  };

  // Mouse Handlers for Pan, Split, and Draw
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If Shift key or in Redaction tab, start box drawing
    if (activeTab === 'redaction' && !e.altKey && e.button === 0) {
      const coords = getCanvasCoords(e);
      if (coords) {
        setIsDrawingBox(true);
        setDrawStart(coords);
        setCurrentBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
        return;
      }
    }

    // Split drag handling
    if (viewMode === 'split' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      if (Math.abs(clickRatio - splitPos) < 0.08) {
        setIsDraggingSplit(true);
        return;
      }
    }

    // Default: Pan navigation
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawingBox && drawStart) {
      const coords = getCanvasCoords(e);
      if (coords) {
        const x = Math.min(drawStart.x, coords.x);
        const y = Math.min(drawStart.y, coords.y);
        const width = Math.abs(coords.x - drawStart.x);
        const height = Math.abs(coords.y - drawStart.y);
        setCurrentBox({ x, y, width, height });
      }
      return;
    }

    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newPos = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      setSplitPos(newPos);
      return;
    }

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    if (isDrawingBox && currentBox) {
      if (currentBox.width > 12 && currentBox.height > 12) {
        onAddRedaction(currentBox);
      }
      setIsDrawingBox(false);
      setDrawStart(null);
      setCurrentBox(null);
    }
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Top Controls Overlay Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: View Mode Pills */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl pointer-events-auto">
          <button
            onClick={() => setViewMode('original')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'original'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original</span>
          </button>

          <button
            onClick={() => setViewMode('ela')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'ela'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Error Level Analysis: highlights compression artifacts & digital splices"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ELA Forensics</span>
          </button>

          <button
            onClick={() => setViewMode('noise')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'noise'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Noise Distribution Heatmap: verifies sensor consistency"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Noise Heatmap</span>
          </button>

          <button
            onClick={() => setViewMode('edge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'edge'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="High-Pass Edge Discontinuity: checks for pasted font edges"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Edge Discontinuity</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'split'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Side-by-side interactive split slider"
          >
            <span>Split Comparison</span>
          </button>
        </div>

        {/* Right: Zoom & Navigation Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl pointer-events-auto">
          <button
            onClick={() => setZoom(prev => Math.max(0.15, prev - 0.15))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-semibold text-slate-300 px-2 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom(prev => Math.min(3.5, prev + 0.15))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleFitToScreen}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            title="Reset 100% Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Helper Banner when in Redaction mode */}
      {activeTab === 'redaction' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-cyan-950/90 border border-cyan-700/60 text-cyan-200 text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click and drag on any text or region to create a custom redaction box</span>
          </div>
        </div>
      )}

      {/* Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 w-full h-full overflow-hidden flex items-center justify-center p-6 ${
          activeTab === 'redaction' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(51, 65, 85, 0.25) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning || isDrawingBox ? 'none' : 'transform 0.05s ease-out',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
          }}
          className="relative inline-block rounded-sm bg-slate-900 overflow-hidden"
        >
          <canvas ref={canvasRef} className="block max-w-none" />

          {/* Split Mode Slider Handle Indicator */}
          {viewMode === 'split' && (
            <div 
              style={{ left: `${splitPos * 100}%` }}
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 -translate-x-1/2 flex items-center justify-center pointer-events-none"
            >
              <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 shadow-xl flex items-center justify-center pointer-events-auto cursor-ew-resize">
                <Move className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Forensic Anomaly Pill Tray */}
      {anomalies.length > 0 && activeTab === 'forensics' && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl shadow-2xl flex items-center gap-2 max-w-2xl overflow-x-auto pointer-events-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 px-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{anomalies.length} Flagged Area(s):</span>
            </div>

            {anomalies.map((anom, idx) => (
              <button
                key={anom.id}
                onClick={() => onSelectAnomaly && onSelectAnomaly(anom.id === selectedAnomalyId ? null : anom.id)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all shrink-0 border ${
                  anom.id === selectedAnomalyId
                    ? 'bg-rose-500 text-white border-rose-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                #{idx + 1} {anom.severity.toUpperCase()} ({anom.confidence}%)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
