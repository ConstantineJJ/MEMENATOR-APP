import React, { useState, useRef, useEffect } from 'react';
import { Crop, ZoomIn, ZoomOut, RotateCcw, Check, X, Maximize2, Move } from 'lucide-react';

interface CropZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  originalImageSrc: string | null;
  onApplyCrop: (croppedDataUrl: string) => void;
  onResetOriginal: () => void;
}

type AspectRatioOption = 'free' | '1:1' | '4:3' | '16:9' | '9:16';

export const CropZoomModal: React.FC<CropZoomModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  originalImageSrc,
  onApplyCrop,
  onResetOriginal,
}) => {
  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('free');

  // Crop box in percentages (0 - 100)
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isResizingCorner, setIsResizingCorner] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, boxX: 10, boxY: 10, boxW: 80, boxH: 80 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset or initialize state when opening
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
      setAspectRatio('free');
    }
  }, [isOpen, imageSrc]);

  // Adjust crop box when aspect ratio preset is selected
  const handleSelectAspectRatio = (ratio: AspectRatioOption) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1;
    if (ratio === '1:1') targetRatio = 1;
    if (ratio === '4:3') targetRatio = 4 / 3;
    if (ratio === '16:9') targetRatio = 16 / 9;
    if (ratio === '9:16') targetRatio = 9 / 16;

    setCropBox((prev) => {
      let newW = prev.width;
      let newH = newW / targetRatio;
      if (newH > 90) {
        newH = 80;
        newW = newH * targetRatio;
      }
      if (newW > 90) {
        newW = 90;
        newH = newW / targetRatio;
      }
      const newX = Math.max(5, Math.min(95 - newW, prev.x));
      const newY = Math.max(5, Math.min(95 - newH, prev.y));
      return { x: newX, y: newY, width: newW, height: newH };
    });
  };

  // Dragging the crop region box
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingBox(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.width,
      boxH: cropBox.height,
    });
  };

  // Corner resize handler
  const handleCornerMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    setIsResizingCorner(corner);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.width,
      boxH: cropBox.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

      if (isDraggingBox) {
        const newX = Math.max(0, Math.min(100 - cropBox.width, dragStart.boxX + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - cropBox.height, dragStart.boxY + deltaYPercent));
        setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizingCorner === 'br') {
        const newW = Math.max(15, Math.min(100 - dragStart.boxX, dragStart.boxW + deltaXPercent));
        const newH = Math.max(15, Math.min(100 - dragStart.boxY, dragStart.boxH + deltaYPercent));
        setCropBox((prev) => ({ ...prev, width: newW, height: newH }));
      } else if (isResizingCorner === 'tl') {
        const newX = Math.max(0, Math.min(dragStart.boxX + dragStart.boxW - 15, dragStart.boxX + deltaXPercent));
        const newY = Math.max(0, Math.min(dragStart.boxY + dragStart.boxH - 15, dragStart.boxY + deltaYPercent));
        const newW = dragStart.boxW - (newX - dragStart.boxX);
        const newH = dragStart.boxH - (newY - dragStart.boxY);
        setCropBox({ x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingBox(false);
      setIsResizingCorner(null);
    };

    if (isDraggingBox || isResizingCorner) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBox, isResizingCorner, dragStart, cropBox.width, cropBox.height]);

  // Apply Crop: Renders sub-rectangle into clean high-res canvas
  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;

    const naturalWidth = img.naturalWidth || 800;
    const naturalHeight = img.naturalHeight || 800;

    // Calculate crop source bounds
    const sourceX = (cropBox.x / 100) * naturalWidth;
    const sourceY = (cropBox.y / 100) * naturalHeight;
    const sourceW = (cropBox.width / 100) * naturalWidth;
    const sourceH = (cropBox.height / 100) * naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(200, Math.round(sourceW));
    canvas.height = Math.max(200, Math.round(sourceH));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onApplyCrop(croppedDataUrl);
    onClose();
  };

  // Preset zoom helper: zooms into a region
  const handleQuickZoom = (targetZoom: number) => {
    setZoom(targetZoom);
    if (targetZoom > 1) {
      // Scale cropBox down centered to zoom in
      const sizePercent = Math.round(80 / targetZoom);
      const newX = Math.round((100 - sizePercent) / 2);
      const newY = Math.round((100 - sizePercent) / 2);
      setCropBox({
        x: newX,
        y: newY,
        width: sizePercent,
        height: sizePercent,
      });
    } else {
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Обрезка и зум фрагмента
              </h3>
              <p className="text-xs text-neutral-400">
                Вырежьте смешное лицо, увеличьте деталь или измените пропорции
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Ratios & Zoom Presets Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800">
            {/* Aspect Ratio Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs text-neutral-400 font-semibold mr-1">Пропорции:</span>
              {(['free', '1:1', '4:3', '16:9', '9:16'] as AspectRatioOption[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleSelectAspectRatio(r)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                    aspectRatio === r
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {r === 'free' ? 'Свободно' : r}
                </button>
              ))}
            </div>

            {/* Quick Zoom Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 font-semibold mr-1">Зум детали:</span>
              <button
                onClick={() => handleQuickZoom(1)}
                className="px-2 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition cursor-pointer"
                title="Оригинал 100%"
              >
                100%
              </button>
              <button
                onClick={() => handleQuickZoom(1.5)}
                className="px-2 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition cursor-pointer"
                title="Приблизить 150%"
              >
                1.5x
              </button>
              <button
                onClick={() => handleQuickZoom(2)}
                className="px-2 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-medium transition cursor-pointer"
                title="Крупный план 200%"
              >
                2.0x 🔍
              </button>
              <button
                onClick={() => handleQuickZoom(2.8)}
                className="px-2 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold transition cursor-pointer"
                title="Максимальный фокус"
              >
                2.8x 🔥
              </button>
            </div>
          </div>

          {/* Interactive Crop Stage */}
          <div className="flex items-center justify-center bg-neutral-950/80 rounded-2xl border border-neutral-800 p-2 sm:p-4 min-h-[340px] max-h-[50vh] overflow-hidden">
            <div ref={containerRef} className="relative inline-block select-none max-h-[46vh]">
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop Target"
                crossOrigin="anonymous"
                className="max-h-[46vh] w-auto block rounded-lg pointer-events-none"
              />

              {/* Darkened overlay outside the crop box */}
              <div
                className="absolute inset-0 bg-black/60 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                    ${cropBox.x}% ${cropBox.y}%,
                    ${cropBox.x + cropBox.width}% ${cropBox.y}%,
                    ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%,
                    ${cropBox.x}% ${cropBox.y + cropBox.height}%,
                    ${cropBox.x}% ${cropBox.y}%
                  )`,
                }}
              />

              {/* The Draggable / Resizable Crop Box */}
              <div
                onMouseDown={handleBoxMouseDown}
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                }}
                className="absolute border-2 border-amber-400 shadow-xl cursor-move bg-amber-400/5 group"
              >
                {/* Center Move Indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-neutral-950/80 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                    <Move className="w-2.5 h-2.5" />
                    <span>Переместить область</span>
                  </div>
                </div>

                {/* Top-Left Corner Resize Handle */}
                <div
                  onMouseDown={(e) => handleCornerMouseDown(e, 'tl')}
                  className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-amber-400 rounded-sm border-2 border-neutral-900 cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* Bottom-Right Corner Resize Handle */}
                <div
                  onMouseDown={(e) => handleCornerMouseDown(e, 'br')}
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-sm border-2 border-neutral-900 cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* Grid Overlay inside crop box (Rule of Thirds) */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/20">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 text-center">
            💡 Перетаскивайте рамку за центр или тяните за угловые маркеры, чтобы выбрать нужный фрагмент (лицо, реакцию или деталь).
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-neutral-800 bg-neutral-950/40">
          <div>
            {originalImageSrc && originalImageSrc !== imageSrc && (
              <button
                onClick={() => {
                  onResetOriginal();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Вернуть исходное фото</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleApply}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Применить обрезку</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
