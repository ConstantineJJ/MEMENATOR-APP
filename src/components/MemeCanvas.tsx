import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TextBox, MemeSticker, MemeFilter, CompositionAnalysis, CompositionGuideType } from '../types';
import { drawMemeOnCanvas, measureTextBoxBounds } from '../utils/canvasHelper';
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Move,
  Trash2,
  Crop,
  Plus,
  Minus,
  Undo2,
  Redo2,
  AlignCenter,
  Maximize2,
  Target,
  Grid,
} from 'lucide-react';

interface MemeCanvasProps {
  imageSrc: string;
  textBoxes: TextBox[];
  stickers: MemeSticker[];
  filter: MemeFilter;
  filterIntensity?: number;
  watermark: boolean;
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
  onUpdateBoxPosition: (id: string, x: number, y: number) => void;
  onUpdateBoxFontSize?: (id: string, newSize: number) => void;
  onDeleteBox?: (id: string) => void;
  onUpdateStickerPosition: (id: string, x: number, y: number) => void;
  onUpdateStickerScale: (id: string, newScale: number) => void;
  onDeleteSticker: (id: string) => void;
  onOpenMagicCaptions: () => void;
  onOpenCrop: () => void;
  isGeneratingCaptions: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  isDraftSaved?: boolean;
  compositionAnalysis?: CompositionAnalysis | null;
  guideType?: CompositionGuideType;
  onSetGuideType?: (type: CompositionGuideType) => void;
  onOpenCompositionAnalysis?: () => void;
  isAnalyzingComposition?: boolean;
}

export const MemeCanvas: React.FC<MemeCanvasProps> = ({
  imageSrc,
  textBoxes,
  stickers,
  filter,
  filterIntensity = 100,
  watermark,
  selectedBoxId,
  onSelectBox,
  onUpdateBoxPosition,
  onUpdateBoxFontSize,
  onDeleteBox,
  onUpdateStickerPosition,
  onUpdateStickerScale,
  onDeleteSticker,
  onOpenMagicCaptions,
  onOpenCrop,
  isGeneratingCaptions,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isDraftSaved = false,
  compositionAnalysis = null,
  guideType = 'none',
  onSetGuideType,
  onOpenCompositionAnalysis,
  isAnalyzingComposition = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg'>('png');
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<'fit' | 'fill'>('fit');
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Measure container dimensions for responsive image fitting
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(120, Math.floor(rect.width - 24)),
          height: Math.max(120, Math.floor(rect.height - 24)),
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Snapping & Guidelines state
  const [activeGuides, setActiveGuides] = useState<{
    vertical: boolean;
    horizontal: boolean;
    top: boolean;
    bottom: boolean;
  }>({ vertical: false, horizontal: false, top: false, bottom: false });

  const [draggingItem, setDraggingItem] = useState<{
    type: 'box' | 'sticker' | 'sticker-scale' | 'box-scale';
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialScale?: number;
    initialFontSize?: number;
  } | null>(null);

  // Load the active image safely
  useEffect(() => {
    setImageError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let effectiveUrl = imageSrc;
    if (imageSrc.startsWith('http') && !imageSrc.includes(window.location.host)) {
      effectiveUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
    }

    img.onload = () => {
      setLoadedImage(img);
    };

    img.onerror = () => {
      if (effectiveUrl !== imageSrc) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => setLoadedImage(fallbackImg);
        fallbackImg.onerror = () =>
          setImageError('Не удалось загрузить изображение. Попробуйте выбрать другой шаблон или фото.');
        fallbackImg.src = imageSrc;
      } else {
        setImageError('Не удалось загрузить изображение. Попробуйте выбрать другой шаблон или фото.');
      }
    };

    img.src = effectiveUrl;
  }, [imageSrc]);

  // Redraw canvas whenever parameters change
  useEffect(() => {
    if (canvasRef.current && loadedImage) {
      drawMemeOnCanvas(canvasRef.current, loadedImage, textBoxes, stickers, filter, watermark, filterIntensity);
    }
  }, [loadedImage, textBoxes, stickers, filter, watermark, filterIntensity]);

  const canStartPointerInteraction = (e: React.PointerEvent) =>
    e.isPrimary && (e.pointerType !== 'mouse' || e.button === 0);

  // One Pointer Events path handles mouse, touch and stylus for canvas objects.
  const startDrag = useCallback(
    (
      e: React.PointerEvent<HTMLElement>,
      type: 'box' | 'sticker',
      id: string,
      curX: number,
      curY: number
    ) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.stopPropagation();
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}

      if (type === 'box') {
        onSelectBox(id);
        setSelectedStickerId(null);
      } else {
        setSelectedStickerId(id);
        onSelectBox(null);
      }
      setDraggingItem({
        type,
        id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        initialX: curX,
        initialY: curY,
      });
    },
    [onSelectBox]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, type: 'box' | 'sticker', id: string, curX: number, curY: number) => {
      startDrag(e, type, id, curX, curY);
    },
    [startDrag]
  );

  // Scale drag handle for stickers
  const handleScalePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string, currentScale: number) => {
    if (!canStartPointerInteraction(e)) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setSelectedStickerId(id);
    onSelectBox(null);
    setDraggingItem({
      type: 'sticker-scale',
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: 0,
      initialY: 0,
      initialScale: currentScale,
    });
  };

  // Scale drag handle for text boxes
  const handleBoxScalePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string, currentFontSize: number) => {
    if (!canStartPointerInteraction(e)) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    onSelectBox(id);
    setSelectedStickerId(null);
    setDraggingItem({
      type: 'box-scale',
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: 0,
      initialY: 0,
      initialFontSize: currentFontSize,
    });
  };

  // Global pointer move & release listeners with snapping calculation
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!draggingItem || !containerRef.current) return;
      const rect = canvasWrapperRef.current?.getBoundingClientRect() || containerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Sticker Scale mode
      if (draggingItem.type === 'sticker-scale') {
        const delta = (clientX - draggingItem.startX + (clientY - draggingItem.startY)) / 80;
        const newScale = Math.max(0.35, Math.min(3.5, (draggingItem.initialScale || 1) + delta));
        onUpdateStickerScale(draggingItem.id, Math.round(newScale * 100) / 100);
        return;
      }

      // Box Scale mode
      if (draggingItem.type === 'box-scale' && onUpdateBoxFontSize) {
        const delta = (clientX - draggingItem.startX) / 4;
        const newFontSize = Math.max(16, Math.min(80, Math.round((draggingItem.initialFontSize || 32) + delta)));
        onUpdateBoxFontSize(draggingItem.id, newFontSize);
        return;
      }

      // Position Drag with Snapping logic
      const deltaXPercent = ((clientX - draggingItem.startX) / rect.width) * 100;
      const deltaYPercent = ((clientY - draggingItem.startY) / rect.height) * 100;

      const rawX = Math.max(6, Math.min(94, draggingItem.initialX + deltaXPercent));
      const rawY = Math.max(6, Math.min(94, draggingItem.initialY + deltaYPercent));

      let snappedX = rawX;
      let snappedY = rawY;
      let guideV = false;
      let guideH = false;
      let guideTop = false;
      let guideBottom = false;

      // Center X Snap (threshold: 3%)
      if (Math.abs(rawX - 50) < 3.2) {
        snappedX = 50;
        guideV = true;
      }

      // Center Y Snap (threshold: 2.5%)
      if (Math.abs(rawY - 50) < 2.8) {
        snappedY = 50;
        guideH = true;
      }

      // Specific snaps for text boxes
      if (draggingItem.type === 'box') {
        if (Math.abs(rawY - 12) < 2.6) {
          snappedY = 12;
          guideTop = true;
        } else if (Math.abs(rawY - 88) < 2.6) {
          snappedY = 88;
          guideBottom = true;
        }
      }

      setActiveGuides({
        vertical: guideV,
        horizontal: guideH,
        top: guideTop,
        bottom: guideBottom,
      });

      if (draggingItem.type === 'box') {
        onUpdateBoxPosition(draggingItem.id, Math.round(snappedX), Math.round(snappedY));
      } else if (draggingItem.type === 'sticker') {
        onUpdateStickerPosition(draggingItem.id, Math.round(snappedX), Math.round(snappedY));
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingItem || e.pointerId !== draggingItem.pointerId) return;
      handleMove(e.clientX, e.clientY);
    };

    const handlePointerEnd = (e: PointerEvent) => {
      if (!draggingItem || e.pointerId !== draggingItem.pointerId) return;
      setDraggingItem(null);
      setActiveGuides({ vertical: false, horizontal: false, top: false, bottom: false });
    };

    if (draggingItem) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerEnd);
      window.addEventListener('pointercancel', handlePointerEnd);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [draggingItem, onUpdateBoxPosition, onUpdateStickerPosition, onUpdateStickerScale, onUpdateBoxFontSize]);

  // Download high-resolution meme with font synchronization
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;

    if ('fonts' in document) {
      try {
        await (document as any).fonts.ready;
      } catch (err) {
        console.warn('Fonts ready wait warning:', err);
      }
    }

    // Force pristine re-render before export
    drawMemeOnCanvas(canvas, loadedImage, textBoxes, stickers, filter, watermark, filterIntensity);

    const mime = downloadFormat === 'png' ? 'image/png' : 'image/jpeg';
    const quality = downloadFormat === 'jpeg' ? 0.95 : undefined;
    const dataUrl = canvas.toDataURL(mime, quality);

    const link = document.createElement('a');
    link.download = `memenator-${Date.now()}.${downloadFormat}`;
    link.href = dataUrl;
    link.click();
  };

  // Copy high-resolution meme directly to system clipboard
  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;

    if ('fonts' in document) {
      try {
        await (document as any).fonts.ready;
      } catch {}
    }

    drawMemeOnCanvas(canvas, loadedImage, textBoxes, stickers, filter, watermark, filterIntensity);

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2400);
        } catch (clipErr) {
          console.warn('Clipboard write failed, falling back to data URL:', clipErr);
          await navigator.clipboard.writeText(canvas.toDataURL('image/png'));
          setCopied(true);
          setTimeout(() => setCopied(false), 2400);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full min-h-0 justify-between">
      {/* Top Quick Actions & Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-1.5 bg-neutral-900/90 p-2 sm:p-2.5 rounded-2xl border border-neutral-800 shadow-sm backdrop-blur shrink-0">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Crop and Zoom Tool button */}
          <button
            id="crop-zoom-btn"
            onClick={onOpenCrop}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 hover:border-amber-400/40 transition active:scale-95 cursor-pointer"
            title="Обрезать или увеличить фрагмент"
          >
            <Crop className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Зум / Обрезка</span>
          </button>

          {/* Intelligent Composition Analysis button */}
          {onOpenCompositionAnalysis && (
            <button
              id="composition-analysis-btn"
              onClick={onOpenCompositionAnalysis}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                compositionAnalysis
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border-neutral-700 hover:border-cyan-400/50'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
              title="Интеллектуальный анализ композиции и безопасных зон"
            >
              <Target className={`w-3.5 h-3.5 text-cyan-400 ${isAnalyzingComposition ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Композиция</span>
              {compositionAnalysis ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/10 text-cyan-300 font-black border border-cyan-400/20">
                  {compositionAnalysis.overallScore}
                </span>
              ) : isAnalyzingComposition ? (
                <span className="text-[10px] text-cyan-300">...</span>
              ) : null}
            </button>
          )}

          {/* Quick Guide Switcher */}
          {onSetGuideType && (
            <button
              onClick={() => {
                const guideCycle: Record<CompositionGuideType, CompositionGuideType> = {
                  none: 'thirds',
                  thirds: 'golden',
                  golden: 'focal',
                  focal: 'zones',
                  zones: 'none',
                };
                onSetGuideType(guideCycle[guideType || 'none']);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                guideType && guideType !== 'none'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border-neutral-700'
              }`}
              title="Сетка композиции (Трети, Золотое сечение, Объекты, Зоны)"
            >
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline text-[11px]">
                {guideType === 'thirds'
                  ? 'Трети'
                  : guideType === 'golden'
                  ? 'Спираль'
                  : guideType === 'focal'
                  ? 'Объекты'
                  : guideType === 'zones'
                  ? 'Зоны'
                  : 'Сетка'}
              </span>
            </button>
          )}

          {/* Undo / Redo buttons */}
          <div className="flex items-center bg-neutral-950/80 rounded-xl border border-neutral-800 p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Отменить (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Повторить (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit Mode Switcher (Fit / Fill) */}
          <div className="flex items-center rounded-xl bg-neutral-950/90 border border-neutral-800 p-0.5" title="Масштабирование картинки под холст">
            <button
              onClick={() => setFitMode('fit')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                fitMode === 'fit'
                  ? 'bg-rose-500 text-white font-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Авто-Fit: пропорционально растягивает или уменьшает картинку под всю площадь холста"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Fit</span>
            </button>
            <button
              onClick={() => setFitMode('fill')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                fitMode === 'fill'
                  ? 'bg-rose-500 text-white font-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Fill: растянуть картинку на 100% площади холста"
            >
              <span className="hidden sm:inline">Fill</span>
            </button>
          </div>
        </div>

        {/* Right Export Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyClipboard}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
            title="Скопировать картинку в буфер обмена"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
            <span className="hidden sm:inline">{copied ? 'Скопировано!' : 'Копировать'}</span>
          </button>

          {/* Format selector */}
          <div className="flex items-center rounded-xl bg-neutral-950 border border-neutral-800 p-0.5">
            <button
              onClick={() => setDownloadFormat('png')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                downloadFormat === 'png' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setDownloadFormat('jpeg')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                downloadFormat === 'jpeg' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              JPG
            </button>
          </div>

          {/* Download Button */}
          <button
            id="download-meme-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 transition active:scale-95 shadow cursor-pointer"
            title="Скачать готовый мем в высоком качестве"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport with Snapping Guidelines and Object Overlays */}
      <div
        ref={containerRef}
        onClick={() => {
          setSelectedStickerId(null);
          onSelectBox(null);
        }}
        className="relative flex-1 min-h-0 flex items-center justify-center w-full bg-neutral-900/60 rounded-3xl border border-neutral-800/90 p-2 overflow-hidden shadow-2xl"
      >
        {imageError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-rose-400">
            <p className="text-sm font-medium mb-2">{imageError}</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Обновить холст</span>
            </button>
          </div>
        ) : (() => {
          // Dynamic Fit calculation: automatically scales up or down to fill canvas area
          const imageNaturalW = loadedImage?.naturalWidth || 800;
          const imageNaturalH = loadedImage?.naturalHeight || 600;
          const imageAspect = imageNaturalW / imageNaturalH;

          const availW = containerSize.width > 0 ? containerSize.width : 600;
          const availH = containerSize.height > 0 ? containerSize.height : 450;
          const containerAspect = availW / availH;

          let displayW = availW;
          let displayH = availH;

          if (fitMode === 'fill') {
            displayW = availW;
            displayH = availH;
          } else {
            // Proportional Fit: maximize image in available viewport box
            if (imageAspect > containerAspect) {
              displayW = availW;
              displayH = Math.round(availW / imageAspect);
            } else {
              displayH = availH;
              displayW = Math.round(availH * imageAspect);
            }
          }

          return (
            <div
              ref={canvasWrapperRef}
              style={{
                width: `${displayW}px`,
                height: `${displayH}px`,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              className="relative flex items-center justify-center rounded-2xl shadow-2xl border border-neutral-800/80 overflow-hidden select-none bg-neutral-950 transition-[width,height] duration-150"
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full block select-none object-contain"
              />

            {/* COMPOSITION GUIDES OVERLAYS */}
            {/* 1. Rule of Thirds (Трети 3x3) */}
            {guideType === 'thirds' && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
                {/* Vertical 1/3 and 2/3 */}
                <div className="absolute inset-y-0 left-[33.333%] w-px border-l-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                <div className="absolute inset-y-0 left-[66.667%] w-px border-l-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                {/* Horizontal 1/3 and 2/3 */}
                <div className="absolute inset-x-0 top-[33.333%] h-px border-t-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                <div className="absolute inset-x-0 top-[66.667%] h-px border-t-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />

                {/* 4 Golden Focal Power Points */}
                <div className="absolute left-[33.333%] top-[33.333%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-200 bg-cyan-400/40 ring-4 ring-cyan-400/30 animate-pulse shadow-md" />
                <div className="absolute left-[66.667%] top-[33.333%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-200 bg-cyan-400/40 ring-4 ring-cyan-400/30 animate-pulse shadow-md" />
                <div className="absolute left-[33.333%] top-[66.667%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-200 bg-cyan-400/40 ring-4 ring-cyan-400/30 animate-pulse shadow-md" />
                <div className="absolute left-[66.667%] top-[66.667%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-200 bg-cyan-400/40 ring-4 ring-cyan-400/30 animate-pulse shadow-md" />

                <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-cyan-500/40 shadow-lg">
                  📐 Правило третей (3×3)
                </div>
              </div>
            )}

            {/* 2. Golden Ratio (Золотое сечение & Fibonacci Spiral) */}
            {guideType === 'golden' && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
                {/* Phi Lines 38.2% and 61.8% */}
                <div className="absolute inset-y-0 left-[38.2%] w-px border-l-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                <div className="absolute inset-y-0 left-[61.8%] w-px border-l-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                <div className="absolute inset-x-0 top-[38.2%] h-px border-t-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                <div className="absolute inset-x-0 top-[61.8%] h-px border-t-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />

                {/* Fibonacci Spiral SVG overlay */}
                <svg
                  className="absolute inset-0 w-full h-full text-amber-400/80"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0,100 A 100,100 0 0,1 100,0 A 61.8,61.8 0 0,1 100,61.8 A 38.2,38.2 0 0,1 61.8,61.8 A 23.6,23.6 0 0,1 61.8,38.2 A 14.6,14.6 0 0,1 76.4,38.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeDasharray="3,3"
                  />
                </svg>

                <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/40 shadow-lg">
                  🌀 Золотое сечение (φ = 1.618)
                </div>
              </div>
            )}

            {/* 3. Focal Subjects (Обнаруженные ключевые фигуры) */}
            {guideType === 'focal' && compositionAnalysis?.focalSubjects && (
              <div className="absolute inset-0 pointer-events-none z-30 rounded-2xl">
                {compositionAnalysis.focalSubjects.map((subj, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${subj.box.x}%`,
                      top: `${subj.box.y}%`,
                      width: `${subj.box.width}%`,
                      height: `${subj.box.height}%`,
                    }}
                    className="absolute border-2 border-dashed border-rose-400 bg-rose-500/15 rounded-xl shadow-lg shadow-rose-500/30 p-1 flex flex-col justify-between"
                  >
                    <span className="bg-rose-500 text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow self-start">
                      🎯 {subj.name}
                    </span>
                    <span className="text-[9px] bg-neutral-950/90 text-rose-300 font-medium px-1.5 py-0.5 rounded self-start">
                      Не перекрывать текстом
                    </span>
                  </div>
                ))}
                <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-rose-500/40 shadow-lg">
                  🎯 Ключевые фокусные фигуры
                </div>
              </div>
            )}

            {/* 4. Safe Text Zones (Безопасные зоны для текста) */}
            {guideType === 'zones' && compositionAnalysis?.safeZones && (
              <div className="absolute inset-0 pointer-events-none z-30 rounded-2xl">
                {compositionAnalysis.safeZones.map((zone, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${zone.box.x}%`,
                      top: `${zone.box.y}%`,
                      width: `${zone.box.width}%`,
                      height: `${zone.box.height}%`,
                    }}
                    className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/20 rounded-xl shadow-lg shadow-emerald-500/30 p-1.5 flex items-center justify-between"
                  >
                    <span className="bg-emerald-400 text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                      🟩 {zone.area === 'top' ? 'Зона завязки (Сетап)' : 'Зона панчлайна'}
                    </span>
                    <span className="text-[9px] text-emerald-300 font-black bg-neutral-950/90 px-1.5 py-0.5 rounded">
                      Контраст: {zone.contrastQuality === 'excellent' ? '100%' : '80%'}
                    </span>
                  </div>
                ))}
                <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/40 shadow-lg">
                  🟩 Безопасные зоны для текста
                </div>
              </div>
            )}

            {/* SNAPPING GUIDELINES OVERLAY */}
            {/* Center Vertical Guideline (X = 50%) */}
            {activeGuides.vertical && (
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] pointer-events-none z-40"
              >
                <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-cyan-400 text-neutral-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  Центр 50%
                </span>
              </div>
            )}

            {/* Center Horizontal Guideline (Y = 50%) */}
            {activeGuides.horizontal && (
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] pointer-events-none z-40"
              >
                <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-cyan-400 text-neutral-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  Центр Y 50%
                </span>
              </div>
            )}

            {/* Top Baseline Guideline (Y = 12%) */}
            {activeGuides.top && (
              <div
                className="absolute inset-x-0 top-[12%] -translate-y-1/2 h-0.5 border-t-2 border-dashed border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] pointer-events-none z-40"
              >
                <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-400 text-neutral-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  Верхний текст
                </span>
              </div>
            )}

            {/* Bottom Baseline Guideline (Y = 88%) */}
            {activeGuides.bottom && (
              <div
                className="absolute inset-x-0 top-[88%] -translate-y-1/2 h-0.5 border-t-2 border-dashed border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] pointer-events-none z-40"
              >
                <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-400 text-neutral-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  Нижний текст
                </span>
              </div>
            )}

            {/* INTERACTIVE DRAGGABLE OBJECTS: TEXT BOXES */}
            {textBoxes.map((box) => {
              const isSelected = selectedBoxId === box.id;

              // Calculate precise bounding dimensions for multi-line text box
              const canvasDomWidth = canvasRef.current?.clientWidth || 600;
              const canvasDomHeight = canvasRef.current?.clientHeight || 450;
              const canvasInternalWidth = canvasRef.current?.width || 800;
              const canvasInternalHeight = canvasRef.current?.height || 600;

              const scaleX = canvasDomWidth / canvasInternalWidth;
              const scaleY = canvasDomHeight / canvasInternalHeight;

              const metrics = measureTextBoxBounds(box, canvasInternalWidth, canvasInternalHeight);
              const boxWidthPx = Math.max(80, Math.round(metrics.maxLineWidth * scaleX) + 24);
              const boxHeightPx = Math.max(32, Math.round(metrics.totalBlockHeight * scaleY) + 16);

              let transformStyle = 'translate(-50%, -50%)';
              if (box.textAlign === 'left') {
                transformStyle = 'translate(-12px, -50%)';
              } else if (box.textAlign === 'right') {
                transformStyle = 'translate(calc(-100% + 12px), -50%)';
              }

              return (
                <div
                  key={box.id}
                  onPointerDown={(e) => handlePointerDown(e, 'box', box.id, box.x, box.y)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBox(box.id);
                    setSelectedStickerId(null);
                  }}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${boxWidthPx}px`,
                    height: `${boxHeightPx}px`,
                    transform: transformStyle,
                    touchAction: 'none',
                  }}
                  className={`absolute group cursor-grab active:cursor-grabbing select-none rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 z-30'
                      : 'border-transparent hover:border-amber-400/50 hover:bg-amber-400/5 z-20'
                  }`}
                  title="Кликните для выбора, перетащите для перемещения"
                >
                  {/* Contour Corner Anchor Markers when Selected */}
                  {isSelected && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-neutral-950 rounded-sm shadow-sm pointer-events-none" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 border border-neutral-950 rounded-sm shadow-sm pointer-events-none" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-neutral-950 rounded-sm shadow-sm pointer-events-none" />
                    </>
                  )}

                  {/* Contextual Floating Controller when Selected */}
                  {isSelected && (
                    <div
                      className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-950/95 border border-neutral-700/90 rounded-full px-2 py-0.5 shadow-2xl z-40 whitespace-nowrap"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Snap to Center X */}
                      <button
                        onClick={() => onUpdateBoxPosition(box.id, 50, box.y)}
                        className="text-neutral-300 hover:text-amber-400 p-1 rounded-full cursor-pointer"
                        title="Выровнять по центру холста"
                      >
                        <AlignCenter className="w-3 h-3" />
                      </button>

                      {/* Font size stepper */}
                      {onUpdateBoxFontSize && (
                        <>
                          <button
                            onClick={() => onUpdateBoxFontSize(box.id, Math.max(16, box.fontSize - 4))}
                            className="text-neutral-300 hover:text-amber-400 p-1 rounded-full cursor-pointer"
                            title="Уменьшить кегль"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[10px] font-bold text-amber-400 font-mono px-0.5">
                            {box.fontSize}px
                          </span>
                          <button
                            onClick={() => onUpdateBoxFontSize(box.id, Math.min(80, box.fontSize + 4))}
                            className="text-neutral-300 hover:text-amber-400 p-1 rounded-full cursor-pointer"
                            title="Увеличить кегль"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </>
                      )}

                      {/* Delete text box if > 1 */}
                      {textBoxes.length > 1 && onDeleteBox && (
                        <button
                          onClick={() => onDeleteBox(box.id)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-neutral-800 p-1 rounded-full cursor-pointer ml-1"
                          title="Удалить этот текст"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Corner Resize Handle for Text */}
                  {isSelected && onUpdateBoxFontSize && (
                    <div
                      onPointerDown={(e) => handleBoxScalePointerDown(e, box.id, box.fontSize)}
                      style={{ touchAction: 'none' }}
                      className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full flex items-center justify-center shadow-lg cursor-nwse-resize hover:scale-115 active:scale-95 transition-transform z-40 border border-neutral-950"
                      title="Потяните для изменения размера текста"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* INTERACTIVE DRAGGABLE OBJECTS: STICKERS */}
            {stickers.map((stk) => {
              const isSelected = selectedStickerId === stk.id;
              const currentScale = stk.scale || 1;
              const boxSize = Math.max(54, Math.round(60 * currentScale));

              return (
                <div
                  key={stk.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStickerId(stk.id);
                    onSelectBox(null);
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'sticker', stk.id, stk.x, stk.y)}
                  style={{
                    left: `${stk.x}%`,
                    top: `${stk.y}%`,
                    width: `${boxSize}px`,
                    height: `${boxSize}px`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                  }}
                  className={`absolute group cursor-grab active:cursor-grabbing select-none rounded-2xl border-2 transition-all flex items-center justify-center ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40 z-30'
                      : 'border-transparent hover:border-amber-400/50 hover:bg-white/5 z-20'
                  }`}
                  title="Кликните для выбора, перетащите по холсту"
                >
                  {/* Delete Button */}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSticker(stk.id);
                    }}
                    className={`absolute -top-4 -right-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg transition-transform hover:scale-115 active:scale-90 cursor-pointer z-40 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Удалить этот стикер"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Corner Resize Handle */}
                  <div
                    onPointerDown={(e) => handleScalePointerDown(e, stk.id, currentScale)}
                    style={{ touchAction: 'none' }}
                    className={`absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full flex items-center justify-center shadow cursor-nwse-resize hover:scale-115 active:scale-95 transition-transform z-40 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Потяните для изменения масштаба"
                  >
                    <span className="text-[10px] font-black">↔</span>
                  </div>

                  {/* Direct on-canvas Scale Controller pill below sticker */}
                  <div
                    className={`absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-950/95 border border-neutral-700 rounded-full px-2 py-0.5 shadow-2xl pointer-events-auto z-40 transition-opacity whitespace-nowrap ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onUpdateStickerScale(stk.id, Math.max(0.35, currentScale - 0.2))}
                      className="text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 p-0.5 rounded-full cursor-pointer"
                      title="Уменьшить"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] font-bold text-amber-400 font-mono px-0.5">
                      {Math.round(currentScale * 100)}%
                    </span>
                    <button
                      onClick={() => onUpdateStickerScale(stk.id, Math.min(3.5, currentScale + 0.2))}
                      className="text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 p-0.5 rounded-full cursor-pointer"
                      title="Увеличить"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      </div>

      <div className="w-full flex items-center justify-between text-[11px] text-neutral-400 mt-2 px-1">
        <span>
          💡 Нажмите на текст или стикер для изменения размера и позиции • Привязка к центру работает автоматически
        </span>
        {isDraftSaved && (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Черновик сохранен</span>
          </span>
        )}
      </div>
    </div>
  );
};
