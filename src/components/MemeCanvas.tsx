import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlignCenter, Maximize2, Minus, Plus, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { CanvasGuides, SnappingGuideState } from './CanvasGuides';
import { MemeCanvasToolbar } from './MemeCanvasToolbar';
import { useCanvasExport } from '../hooks/useCanvasExport';
import {
  CompositionAnalysis,
  CompositionGuideType,
  MemeFilter,
  MemeSticker,
  TextBox,
} from '../types';
import { drawMemeOnCanvas, measureTextBoxBounds } from '../utils/canvasHelper';

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
  onUpdateStickerRotation?: (id: string, newRotation: number) => void;
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

type DraggingItem = {
  type: 'box' | 'sticker' | 'sticker-scale' | 'box-scale' | 'sticker-rotate';
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialScale?: number;
  initialFontSize?: number;
  initialRotation?: number;
  centerX?: number;
  centerY?: number;
};

const EMPTY_GUIDES: SnappingGuideState = {
  vertical: false,
  horizontal: false,
  top: false,
  bottom: false,
};

function isPrimaryPointer(event: React.PointerEvent) {
  return event.isPrimary && (event.pointerType !== 'mouse' || event.button === 0);
}

/**
 * Interactive meme viewport. Toolbar/export and guide rendering live in small
 * dedicated modules; this component now focuses on image loading, proportional
 * viewport fitting and pointer interactions.
 */
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
  onUpdateStickerRotation,
  onDeleteSticker,
  onOpenCrop,
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
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [activeGuides, setActiveGuides] = useState<SnappingGuideState>(EMPTY_GUIDES);
  const [draggingItem, setDraggingItem] = useState<DraggingItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const element = containerRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setContainerSize({
        width: Math.max(120, Math.floor(rect.width - 24)),
        height: Math.max(120, Math.floor(rect.height - 24)),
      });
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

  useEffect(() => {
    setImageError(null);
    setLoadedImage(null);

    const image = new Image();
    image.crossOrigin = 'anonymous';

    let effectiveUrl = imageSrc;
    if (imageSrc.startsWith('http') && !imageSrc.includes(window.location.host)) {
      effectiveUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
    }

    image.onload = () => setLoadedImage(image);
    image.onerror = () => {
      if (effectiveUrl !== imageSrc) {
        const fallbackImage = new Image();
        fallbackImage.onload = () => setLoadedImage(fallbackImage);
        fallbackImage.onerror = () => {
          setImageError('Не удалось загрузить изображение. Попробуйте выбрать другой шаблон или фото.');
        };
        fallbackImage.src = imageSrc;
        return;
      }
      setImageError('Не удалось загрузить изображение. Попробуйте выбрать другой шаблон или фото.');
    };

    image.src = effectiveUrl;
  }, [imageSrc]);

  useEffect(() => {
    if (!canvasRef.current || !loadedImage) return;
    drawMemeOnCanvas(
      canvasRef.current,
      loadedImage,
      textBoxes,
      stickers,
      filter,
      watermark,
      filterIntensity
    );
  }, [filter, filterIntensity, loadedImage, stickers, textBoxes, watermark]);

  const {
    copied,
    downloadFormat,
    setDownloadFormat,
    handleDownload,
    handleCopyClipboard,
  } = useCanvasExport({
    canvasRef,
    loadedImage,
    textBoxes,
    stickers,
    filter,
    filterIntensity,
    watermark,
  });

  const startDrag = useCallback((
    event: React.PointerEvent<HTMLElement>,
    type: 'box' | 'sticker',
    id: string,
    currentX: number,
    currentY: number
  ) => {
    if (!isPrimaryPointer(event)) return;
    event.stopPropagation();
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
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
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: currentX,
      initialY: currentY,
    });
  }, [onSelectBox]);

  const handleScalePointerDown = useCallback((
    event: React.PointerEvent<HTMLDivElement>,
    id: string,
    currentScale: number
  ) => {
    if (!isPrimaryPointer(event)) return;
    event.stopPropagation();
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    setSelectedStickerId(id);
    onSelectBox(null);
    setDraggingItem({
      type: 'sticker-scale',
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: 0,
      initialY: 0,
      initialScale: currentScale,
    });
  }, [onSelectBox]);

  const handleRotatePointerDown = useCallback((
    event: React.PointerEvent<HTMLDivElement>,
    id: string,
    currentRotation: number,
    stickerXPercent: number,
    stickerYPercent: number
  ) => {
    if (!isPrimaryPointer(event)) return;
    event.stopPropagation();
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    const wrapper = canvasWrapperRef.current;
    const container = containerRef.current;
    const rect = (wrapper ?? container)?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
    const centerX = rect.left + (stickerXPercent / 100) * rect.width;
    const centerY = rect.top + (stickerYPercent / 100) * rect.height;

    setSelectedStickerId(id);
    onSelectBox(null);
    setDraggingItem({
      type: 'sticker-rotate',
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: 0,
      initialY: 0,
      initialRotation: currentRotation,
      centerX,
      centerY,
    });
  }, [onSelectBox]);

  const handleBoxScalePointerDown = useCallback((
    event: React.PointerEvent<HTMLDivElement>,
    id: string,
    currentFontSize: number
  ) => {
    if (!isPrimaryPointer(event)) return;
    event.stopPropagation();
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    onSelectBox(id);
    setSelectedStickerId(null);
    setDraggingItem({
      type: 'box-scale',
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: 0,
      initialY: 0,
      initialFontSize: currentFontSize,
    });
  }, [onSelectBox]);

  useEffect(() => {
    if (!draggingItem) return;

    const handleMove = (clientX: number, clientY: number) => {
      const wrapper = canvasWrapperRef.current;
      const container = containerRef.current;
      if (!wrapper && !container) return;

      const rect = (wrapper ?? container)!.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      if (draggingItem.type === 'sticker-scale') {
        const delta = (clientX - draggingItem.startX + clientY - draggingItem.startY) / 80;
        const scale = Math.max(0.35, Math.min(3.5, (draggingItem.initialScale ?? 1) + delta));
        onUpdateStickerScale(draggingItem.id, Math.round(scale * 100) / 100);
        return;
      }

      if (draggingItem.type === 'sticker-rotate' && onUpdateStickerRotation) {
        const cX = draggingItem.centerX ?? draggingItem.startX;
        const cY = draggingItem.centerY ?? draggingItem.startY;
        const rad = Math.atan2(clientY - cY, clientX - cX);
        let deg = Math.round((rad * 180) / Math.PI) + 90;
        deg = ((deg % 360) + 360) % 360;
        if (deg > 180) deg -= 360;

        const snapAngles = [0, 45, 90, 135, 180, -45, -90, -135, -180];
        for (const snap of snapAngles) {
          if (Math.abs(deg - snap) < 4) {
            deg = snap === -180 ? 180 : snap;
            break;
          }
        }

        onUpdateStickerRotation(draggingItem.id, deg);
        return;
      }

      if (draggingItem.type === 'box-scale' && onUpdateBoxFontSize) {
        const delta = (clientX - draggingItem.startX) / 4;
        const fontSize = Math.max(
          16,
          Math.min(80, Math.round((draggingItem.initialFontSize ?? 32) + delta))
        );
        onUpdateBoxFontSize(draggingItem.id, fontSize);
        return;
      }

      const deltaXPercent = ((clientX - draggingItem.startX) / rect.width) * 100;
      const deltaYPercent = ((clientY - draggingItem.startY) / rect.height) * 100;
      const rawX = Math.max(6, Math.min(94, draggingItem.initialX + deltaXPercent));
      const rawY = Math.max(6, Math.min(94, draggingItem.initialY + deltaYPercent));

      let snappedX = rawX;
      let snappedY = rawY;
      const guides: SnappingGuideState = { ...EMPTY_GUIDES };

      if (Math.abs(rawX - 50) < 3.2) {
        snappedX = 50;
        guides.vertical = true;
      }
      if (Math.abs(rawY - 50) < 2.8) {
        snappedY = 50;
        guides.horizontal = true;
      }
      if (draggingItem.type === 'box') {
        if (Math.abs(rawY - 12) < 2.6) {
          snappedY = 12;
          guides.top = true;
        } else if (Math.abs(rawY - 88) < 2.6) {
          snappedY = 88;
          guides.bottom = true;
        }
      }

      setActiveGuides(guides);
      if (draggingItem.type === 'box') {
        onUpdateBoxPosition(draggingItem.id, Math.round(snappedX), Math.round(snappedY));
      } else if (draggingItem.type === 'sticker') {
        onUpdateStickerPosition(draggingItem.id, Math.round(snappedX), Math.round(snappedY));
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== draggingItem.pointerId) return;
      handleMove(event.clientX, event.clientY);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== draggingItem.pointerId) return;
      setDraggingItem(null);
      setActiveGuides(EMPTY_GUIDES);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [
    draggingItem,
    onUpdateBoxFontSize,
    onUpdateBoxPosition,
    onUpdateStickerPosition,
    onUpdateStickerRotation,
    onUpdateStickerScale,
  ]);

  const imageNaturalWidth = loadedImage?.naturalWidth || 800;
  const imageNaturalHeight = loadedImage?.naturalHeight || 600;
  const imageAspect = imageNaturalWidth / imageNaturalHeight;
  const availableWidth = containerSize.width > 0 ? containerSize.width : 600;
  const availableHeight = containerSize.height > 0 ? containerSize.height : 450;
  const containerAspect = availableWidth / availableHeight;

  // Proportional Fit is the only viewport mode. The former Fill option
  // stretched the preview while export kept the source aspect ratio.
  const displayWidth = imageAspect > containerAspect
    ? availableWidth
    : Math.round(availableHeight * imageAspect);
  const displayHeight = imageAspect > containerAspect
    ? Math.round(availableWidth / imageAspect)
    : availableHeight;

  return (
    <div className="flex flex-col items-center w-full h-full min-h-0 justify-between">
      <MemeCanvasToolbar
        onOpenCrop={onOpenCrop}
        compositionAnalysis={compositionAnalysis}
        isAnalyzingComposition={isAnalyzingComposition}
        onOpenCompositionAnalysis={onOpenCompositionAnalysis}
        guideType={guideType}
        onSetGuideType={onSetGuideType}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        copied={copied}
        onCopy={() => void handleCopyClipboard()}
        downloadFormat={downloadFormat}
        onDownloadFormatChange={setDownloadFormat}
        onDownload={() => void handleDownload()}
      />

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
        ) : (
          <div
            ref={canvasWrapperRef}
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            className="relative flex items-center justify-center rounded-2xl shadow-2xl border border-neutral-800/80 overflow-hidden select-none bg-neutral-950 transition-[width,height] duration-150"
          >
            <canvas ref={canvasRef} className="w-full h-full block select-none object-contain" />

            <CanvasGuides
              guideType={guideType}
              compositionAnalysis={compositionAnalysis}
              activeGuides={activeGuides}
            />

            {textBoxes.map((box) => {
              const isSelected = selectedBoxId === box.id;
              const canvasDomWidth = canvasRef.current?.clientWidth || 600;
              const canvasDomHeight = canvasRef.current?.clientHeight || 450;
              const canvasInternalWidth = canvasRef.current?.width || 800;
              const canvasInternalHeight = canvasRef.current?.height || 600;
              const scaleX = canvasDomWidth / canvasInternalWidth;
              const scaleY = canvasDomHeight / canvasInternalHeight;
              const metrics = measureTextBoxBounds(box, canvasInternalWidth, canvasInternalHeight);
              const boxWidthPx = Math.max(80, Math.round(metrics.maxLineWidth * scaleX) + 24);
              const boxHeightPx = Math.max(32, Math.round(metrics.totalBlockHeight * scaleY) + 16);

              let transform = 'translate(-50%, -50%)';
              if (box.textAlign === 'left') transform = 'translate(-12px, -50%)';
              if (box.textAlign === 'right') transform = 'translate(calc(-100% + 12px), -50%)';

              return (
                <div
                  key={box.id}
                  onPointerDown={(event) => startDrag(event, 'box', box.id, box.x, box.y)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectBox(box.id);
                    setSelectedStickerId(null);
                  }}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${boxWidthPx}px`,
                    height: `${boxHeightPx}px`,
                    transform,
                    touchAction: 'none',
                  }}
                  className={`absolute group cursor-grab active:cursor-grabbing select-none rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 z-30'
                      : 'border-transparent hover:border-amber-400/50 hover:bg-amber-400/5 z-20'
                  }`}
                  title="Кликните для выбора, перетащите для перемещения"
                >
                  {isSelected && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-neutral-950 rounded-sm shadow-sm pointer-events-none" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 border border-neutral-950 rounded-sm shadow-sm pointer-events-none" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-neutral-950 rounded-sm shadow-sm pointer-events-none" />
                    </>
                  )}

                  {isSelected && (
                    <div
                      className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-950/95 border border-neutral-700/90 rounded-full px-2 py-0.5 shadow-2xl z-40 whitespace-nowrap"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        onClick={() => onUpdateBoxPosition(box.id, 50, box.y)}
                        className="text-neutral-300 hover:text-amber-400 p-1 rounded-full cursor-pointer"
                        title="Выровнять по центру холста"
                      >
                        <AlignCenter className="w-3 h-3" />
                      </button>

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

                  {isSelected && onUpdateBoxFontSize && (
                    <div
                      onPointerDown={(event) => handleBoxScalePointerDown(event, box.id, box.fontSize)}
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

            {stickers.map((sticker) => {
              const isSelected = selectedStickerId === sticker.id;
              const currentScale = sticker.scale || 1;
              const currentRotation = sticker.rotation || 0;
              const boxSize = Math.max(54, Math.round(60 * currentScale));

              return (
                <div
                  key={sticker.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedStickerId(sticker.id);
                    onSelectBox(null);
                  }}
                  onPointerDown={(event) => startDrag(event, 'sticker', sticker.id, sticker.x, sticker.y)}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    width: `${boxSize}px`,
                    height: `${boxSize}px`,
                    transform: `translate(-50%, -50%) rotate(${currentRotation}deg)`,
                    touchAction: 'none',
                  }}
                  className={`absolute group cursor-grab active:cursor-grabbing select-none rounded-2xl border-2 transition-all flex items-center justify-center ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40 z-30'
                      : 'border-transparent hover:border-amber-400/50 hover:bg-white/5 z-20'
                  }`}
                  title="Кликните для выбора, перетащите по холсту"
                >
                  {/* Delete button */}
                  <button
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSticker(sticker.id);
                    }}
                    className={`absolute -top-4 -right-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg transition-transform hover:scale-115 active:scale-90 cursor-pointer z-40 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Удалить этот стикер"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Top rotation handle */}
                  {isSelected && onUpdateStickerRotation && (
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 pointer-events-auto"
                      onPointerDown={(event) =>
                        handleRotatePointerDown(
                          event,
                          sticker.id,
                          currentRotation,
                          sticker.x,
                          sticker.y
                        )
                      }
                      style={{ touchAction: 'none' }}
                      title="Потяните для свободного вращения стикера"
                    >
                      <div className="w-5 h-5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-115 active:scale-95 transition-transform border border-neutral-950">
                        <RotateCw className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                      <div className="w-0.5 h-2 bg-amber-400/90" />
                    </div>
                  )}

                  {/* Scale handle */}
                  <div
                    onPointerDown={(event) => handleScalePointerDown(event, sticker.id, currentScale)}
                    style={{ touchAction: 'none' }}
                    className={`absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full flex items-center justify-center shadow cursor-nwse-resize hover:scale-115 active:scale-95 transition-transform z-40 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Потяните для изменения масштаба"
                  >
                    <span className="text-[10px] font-black">↔</span>
                  </div>

                  {/* Bottom toolbar */}
                  <div
                    className={`absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-950/95 border border-neutral-700 rounded-full px-2 py-0.5 shadow-2xl pointer-events-auto z-40 transition-opacity whitespace-nowrap ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      onClick={() => onUpdateStickerScale(sticker.id, Math.max(0.35, currentScale - 0.2))}
                      className="text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 p-0.5 rounded-full cursor-pointer"
                      title="Уменьшить"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] font-bold text-amber-400 font-mono px-0.5">
                      {Math.round(currentScale * 100)}%
                    </span>
                    <button
                      onClick={() => onUpdateStickerScale(sticker.id, Math.min(3.5, currentScale + 0.2))}
                      className="text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 p-0.5 rounded-full cursor-pointer"
                      title="Увеличить"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>

                    {onUpdateStickerRotation && (
                      <>
                        <span className="w-px h-3 bg-neutral-700 mx-0.5" />
                        <button
                          type="button"
                          onClick={() => {
                            let next = currentRotation - 15;
                            if (next < -180) next += 360;
                            onUpdateStickerRotation(sticker.id, next);
                          }}
                          className="text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 p-0.5 rounded-full cursor-pointer"
                          title="Повернуть против часовой стрелки (-15°)"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                        <span
                          className={`text-[10px] font-bold font-mono px-0.5 cursor-pointer hover:underline ${
                            currentRotation !== 0 ? 'text-amber-400' : 'text-neutral-400'
                          }`}
                          onClick={() => onUpdateStickerRotation(sticker.id, 0)}
                          title="Кликните для сброса на 0°"
                        >
                          {currentRotation}°
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            let next = currentRotation + 15;
                            if (next > 180) next -= 360;
                            onUpdateStickerRotation(sticker.id, next);
                          }}
                          className="text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 p-0.5 rounded-full cursor-pointer"
                          title="Повернуть по часовой стрелке (+15°)"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
