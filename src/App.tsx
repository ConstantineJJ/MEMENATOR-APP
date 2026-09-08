import React, { useState, useCallback } from 'react';
import { MemeCanvas } from './components/MemeCanvas';
import { MagicCaptionModal } from './components/MagicCaptionModal';
import { CropZoomModal } from './components/CropZoomModal';
import { RandomMemesPanel } from './components/RandomMemesPanel';
import { HistoryAndFavoritesPanel } from './components/HistoryAndFavoritesPanel';
import { MemeTextInputBar } from './components/MemeTextInputBar';
import { MemeTextStyleBar } from './components/MemeTextStyleBar';
import { StickersAndFilters } from './components/StickersAndFilters';
import { ImageUploadBar } from './components/ImageUploadBar';
import { SuggestedMemesPanel } from './components/SuggestedMemesPanel';
import { CompositionAnalysisModal } from './components/CompositionAnalysisModal';
import { WatermelonLogo } from './components/WatermelonLogo';
import { TRENDING_TEMPLATES } from './data/templates';
import {
  TextBox,
  MemeSticker,
  MemeFilter,
  CaptionSuggestion,
  MemeTemplate,
  TrendingWebMeme,
  CompositionGuideType,
  WebMemeItem,
  SavedMemeState,
} from './types';
import { MemeHistorySnapshot, useMemeUndoHistory } from './hooks/useMemeUndoHistory';
import {
  MemeDraftSnapshot,
  MemeDraftState,
  useMemeDraftPersistence,
} from './hooks/useMemeDraftPersistence';
import {
  MemeHistoryAutosaveSnapshot,
  useMemeHistoryAutosave,
} from './hooks/useMemeHistoryAutosave';
import { useCompositionAnalysis } from './hooks/useCompositionAnalysis';
import { useMagicCaptions } from './hooks/useMagicCaptions';
import { CheckCircle } from 'lucide-react';

export default function App() {
  // Active Meme Image & Original for Cropping Reset
  const [activeImageSrc, setActiveImageSrc] = useState<string>(TRENDING_TEMPLATES[0].url);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(TRENDING_TEMPLATES[0].url);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(TRENDING_TEMPLATES[0].id);

  // Text Boxes State
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([
    {
      id: 'top-1',
      text: TRENDING_TEMPLATES[0].defaultTopText || 'КОГДА СКАЗАЛИ РАСШИРИТЬ БИЗНЕС',
      x: 50,
      y: 12,
      fontSize: 34,
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      isUppercase: true,
      isBold: true,
      textAlign: 'center',
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 14,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      hasBackground: false,
    },
    {
      id: 'bottom-1',
      text: TRENDING_TEMPLATES[0].defaultBottomText || 'И Я ПОНЯЛ ЭТО БУКВАЛЬНО',
      x: 50,
      y: 88,
      fontSize: 34,
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      isUppercase: true,
      isBold: true,
      textAlign: 'center',
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 14,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      hasBackground: false,
    },
  ]);

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>('top-1');

  // Stickers & Filters
  const [stickers, setStickrs] = useState<MemeSticker[]>([]);
  const [filter, setFilter] = useState<MemeFilter>('none');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);
  const [watermark, setWatermark] = useState<boolean>(false);

  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);
  const [guideType, setGuideType] = useState<CompositionGuideType>('none');
  const [notification, setNotification] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'all' | 'text' | 'suggestions'>('all');

  const showToast = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2800);
  }, []);

  const {
    compositionAnalysis,
    isAnalyzingComposition,
    runCompositionAnalysis,
  } = useCompositionAnalysis(activeImageSrc);

  const handleCaptionsGenerated = useCallback(() => {
    showToast('Готово! 5 вариантов мема предложены');
  }, [showToast]);

  const {
    captions,
    isGeneratingCaptions,
    captionError,
    selectedStyle,
    setSelectedStyle,
    customContext,
    setCustomContext,
    generateMagicCaptions,
    clearCaptions,
  } = useMagicCaptions({
    activeImageSrc,
    compositionAnalysis,
    onGenerated: handleCaptionsGenerated,
  });

  const applyHistorySnapshot = useCallback((targetState: MemeHistorySnapshot) => {
    setTextBoxes(targetState.textBoxes);
    setStickrs(targetState.stickers);
    setFilter(targetState.filter);
    setFilterIntensity(targetState.filterIntensity ?? 100);
    setWatermark(targetState.watermark);
    setActiveImageSrc(targetState.activeImageSrc);
  }, []);

  const currentHistorySnapshot: MemeHistorySnapshot = {
    textBoxes,
    stickers,
    filter,
    filterIntensity,
    watermark,
    activeImageSrc,
  };

  const {
    canUndo,
    canRedo,
    recordSnapshot: pushToHistory,
    undo: handleUndo,
    redo: handleRedo,
  } = useMemeUndoHistory({
    currentSnapshot: currentHistorySnapshot,
    applySnapshot: applyHistorySnapshot,
    onUndo: () => showToast('Действие отменено (Undo)'),
    onRedo: () => showToast('Действие повторено (Redo)'),
  });

  const applyDraft = useCallback((parsed: MemeDraftState) => {
    setTextBoxes(parsed.textBoxes);
    if (Array.isArray(parsed.stickers)) setStickrs(parsed.stickers);
    if (parsed.filter) setFilter(parsed.filter);
    if (typeof parsed.filterIntensity === 'number') setFilterIntensity(parsed.filterIntensity);
    if (parsed.watermark !== undefined) setWatermark(parsed.watermark);
    setActiveImageSrc(parsed.activeImageSrc);
    if (parsed.originalImageSrc) setOriginalImageSrc(parsed.originalImageSrc);
    if (parsed.selectedTemplateId !== undefined) setSelectedTemplateId(parsed.selectedTemplateId);
  }, []);

  const handleDraftRestored = useCallback(() => {
    showToast('Черновик успешно восстановлен из памяти');
  }, [showToast]);

  const currentDraft: MemeDraftSnapshot = {
    textBoxes,
    stickers,
    filter,
    filterIntensity,
    watermark,
    activeImageSrc,
    originalImageSrc,
    selectedTemplateId,
  };

  const { isDraftSaved } = useMemeDraftPersistence({
    currentDraft,
    applyDraft,
    onRestored: handleDraftRestored,
  });

  const currentHistoryAutosaveSnapshot: MemeHistoryAutosaveSnapshot = {
    activeImageSrc,
    textBoxes,
    stickers,
    filter,
    filterIntensity,
    watermark,
    selectedTemplateId,
  };

  const {
    historyRefreshTrigger,
    setActiveMemeId,
    startNewMeme,
  } = useMemeHistoryAutosave({
    currentSnapshot: currentHistoryAutosaveSnapshot,
  });

  // Restore Meme from History or Favorites tab
  const handleRestoreMeme = useCallback((saved: SavedMemeState) => {
    setActiveMemeId(saved.id);
    setActiveImageSrc(saved.imageSrc);
    setOriginalImageSrc(saved.imageSrc);
    setTextBoxes(saved.textBoxes);
    setStickrs(saved.stickers);
    setFilter(saved.filter);
    setFilterIntensity(saved.filterIntensity ?? 100);
    setWatermark(saved.watermark);
    setSelectedTemplateId(saved.templateId ?? null);
    clearCaptions();

    pushToHistory({
      textBoxes: saved.textBoxes,
      stickers: saved.stickers,
      filter: saved.filter,
      filterIntensity: saved.filterIntensity ?? 100,
      watermark: saved.watermark,
      activeImageSrc: saved.imageSrc,
    });
  }, [clearCaptions, pushToHistory, setActiveMemeId]);

  // Select Web Template from Multi-Source Aggregator tab
  const handleSelectWebTemplate = useCallback((item: WebMemeItem) => {
    startNewMeme();
    setSelectedTemplateId(item.id);
    setActiveImageSrc(item.imageUrl);
    setOriginalImageSrc(item.imageUrl);
    clearCaptions();

    setTextBoxes((prev) => [
      {
        ...prev[0],
        text: item.defaultTopText || '',
      },
      {
        ...prev[1],
        text: item.defaultBottomText || '',
      },
      ...prev.slice(2),
    ]);

    pushToHistory({
      textBoxes: [
        {
          ...textBoxes[0],
          text: item.defaultTopText || '',
        },
        {
          ...textBoxes[1],
          text: item.defaultBottomText || '',
        },
        ...textBoxes.slice(2),
      ],
      stickers,
      filter,
      filterIntensity,
      watermark,
      activeImageSrc: item.imageUrl,
    });
  }, [clearCaptions, pushToHistory, textBoxes, stickers, filter, filterIntensity, watermark, startNewMeme]);

  // Switch Template from catalog
  const handleSelectTemplate = (template: MemeTemplate) => {
    startNewMeme();
    setSelectedTemplateId(template.id);
    setActiveImageSrc(template.url);
    setOriginalImageSrc(template.url);
    clearCaptions();

    setTextBoxes((prev) => [
      {
        ...prev[0],
        text: template.defaultTopText || '',
      },
      {
        ...prev[1],
        text: template.defaultBottomText || '',
      },
      ...prev.slice(2),
    ]);

    showToast(`Загружен шаблон "${template.name}"`);
  };

  // Switch Template from Live Internet Trending Feed
  const handleSelectTrendingTemplate = (template: TrendingWebMeme) => {
    startNewMeme();
    setSelectedTemplateId(template.id);
    setActiveImageSrc(template.url);
    setOriginalImageSrc(template.url);
    clearCaptions();

    setTextBoxes((prev) => [
      {
        ...prev[0],
        text: template.defaultTopText || '',
      },
      {
        ...prev[1],
        text: template.defaultBottomText || '',
      },
      ...prev.slice(2),
    ]);

    showToast(`Выбран тренд: "${template.name}"`);
  };

  // Upload Custom Image
  const handleUploadImage = (file: File) => {
    startNewMeme();
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const resultUrl = e.target.result as string;
        setActiveImageSrc(resultUrl);
        setOriginalImageSrc(resultUrl);
        setSelectedTemplateId(null);
        clearCaptions();
        showToast('Фото загружено! Нажмите «Замемить» для создания мема.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Crop Handlers
  const handleApplyCrop = (croppedDataUrl: string) => {
    setActiveImageSrc(croppedDataUrl);
    showToast('Кадрирование успешно применено!');
  };

  const handleResetOriginalImage = () => {
    if (originalImageSrc) {
      setActiveImageSrc(originalImageSrc);
      showToast('Исходное фото восстановлено!');
    }
  };

  // Apply suggested text placements from composition analysis
  const handleApplyCompositionOptimization = () => {
    if (!compositionAnalysis?.suggestedTextPlacements) return;
    const { topTextY, bottomTextY, align, suggestedFontSize } = compositionAnalysis.suggestedTextPlacements;

    setTextBoxes((prev) => {
      const updated = [...prev];
      if (updated.length >= 1) {
        updated[0] = {
          ...updated[0],
          y: topTextY ?? 10,
          textAlign: (align as any) || updated[0].textAlign,
          fontSize: suggestedFontSize ? Math.max(26, Math.min(suggestedFontSize, 42)) : updated[0].fontSize,
        };
      }
      if (updated.length >= 2) {
        updated[1] = {
          ...updated[1],
          y: bottomTextY ?? 90,
          textAlign: (align as any) || updated[1].textAlign,
          fontSize: suggestedFontSize ? Math.max(26, Math.min(suggestedFontSize, 42)) : updated[1].fontSize,
        };
      }
      return updated;
    });

    setGuideType('zones');
    showToast('Текст оптимизирован под композицию кадра!');
  };

  // Open AI Suggestions panel & trigger generation
  const handleOpenMagicCaptions = () => {
    setRightTab('suggestions');
    if (captions.length === 0 && !isGeneratingCaptions) {
      void generateMagicCaptions();
    }
  };

  // Apply chosen suggestion to canvas text boxes
  const handleApplyCaption = (caption: CaptionSuggestion) => {
    setTextBoxes((prev) => {
      const updated = [...prev];
      if (updated[0]) {
        updated[0] = {
          ...updated[0],
          text: caption.topText || '',
        };
      }
      if (updated[1]) {
        updated[1] = {
          ...updated[1],
          text: caption.bottomText || '',
        };
      }
      return updated;
    });

    showToast(`Применен мем: "${caption.headline}"`);
  };

  // Text Box CRUD & Position handlers
  const handleUpdateTextBox = (id: string, updates: Partial<TextBox>) => {
    setTextBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, ...updates } : box))
    );
  };

  const handleUpdateBoxPosition = (id: string, x: number, y: number) => {
    setTextBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, x, y } : box))
    );
  };

  const handleUpdateBoxFontSize = (id: string, newSize: number) => {
    setTextBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, fontSize: newSize } : box))
    );
  };

  const handleAddTextBox = () => {
    const newId = `box-${Date.now()}`;
    const newBox: TextBox = {
      id: newId,
      text: 'НОВЫЙ ТЕКСТ',
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      isUppercase: true,
      isBold: true,
      textAlign: 'center',
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 14,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      hasBackground: false,
    };
    setTextBoxes((prev) => [...prev, newBox]);
    setSelectedBoxId(newId);
    showToast('Добавлен новый текстовый блок');
  };

  const handleRemoveTextBox = (id: string) => {
    if (textBoxes.length <= 1) return;
    setTextBoxes((prev) => prev.filter((b) => b.id !== id));
    setSelectedBoxId(textBoxes[0]?.id || null);
  };

  const handleResetPositions = () => {
    setTextBoxes((prev) =>
      prev.map((box, idx) => {
        if (idx === 0) return { ...box, x: 50, y: 12 };
        if (idx === 1) return { ...box, x: 50, y: 88 };
        return { ...box, x: 50, y: 50 };
      })
    );
    showToast('Позиции текста сброшены (верх и низ)');
  };

  // Sticker Management
  const handleAddSticker = (
    type: any,
    label: string,
    emoji?: string,
    stickerId?: string
  ) => {
    const newSticker: MemeSticker = {
      id: `sticker-${Date.now()}`,
      label,
      emoji,
      type,
      stickerId: stickerId || type,
      x: 50,
      y: 45,
      scale: 1,
      rotation: 0,
    };
    setStickrs((prev) => [...prev, newSticker]);
    showToast(`Наклейка добавлена: ${label}`);
  };

  const handleUpdateStickerPosition = (id: string, x: number, y: number) => {
    setStickrs((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  };

  const handleUpdateStickerScale = (id: string, newScale: number) => {
    setStickrs((prev) => prev.map((s) => (s.id === id ? { ...s, scale: newScale } : s)));
  };

  const handleDeleteSticker = (id: string) => {
    setStickrs((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="h-screen max-h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden antialiased selection:bg-rose-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-neutral-900/95 border border-rose-500/40 text-neutral-100 text-xs font-semibold px-4 py-1.5 rounded-full shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Studio Header with MEMENATOR branding & Watermelon Mascot */}
      <header className="h-14 sm:h-16 border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur px-3 sm:px-5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <WatermelonLogo size={42} />
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-emerald-400 to-amber-300 uppercase leading-none font-['Anton',sans-serif]">
              MEMENATOR
            </h1>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-widest hidden sm:inline-block shadow-sm">
              STUDIO
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/60 border border-neutral-800/60 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Автосохранение активно</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="hidden lg:inline text-neutral-500 text-[11px] font-semibold">
            Холст в центре • ИИ справа
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full px-2 sm:px-3 py-2 grid grid-cols-12 gap-2 sm:gap-2.5 items-stretch overflow-hidden">
        <aside className="col-span-12 lg:col-span-3 h-full min-h-0 flex flex-col gap-2 overflow-hidden pr-0.5">
          <div className="h-[40%] min-h-0 flex flex-col shrink-0">
            <RandomMemesPanel
              onSelectWebTemplate={handleSelectWebTemplate}
              selectedUrl={activeImageSrc}
              onShowToast={showToast}
              historyRefreshTrigger={historyRefreshTrigger}
            />
          </div>

          <div className="h-[20%] min-h-0 flex flex-col shrink-0">
            <HistoryAndFavoritesPanel
              onRestoreMeme={handleRestoreMeme}
              onSelectWebTemplate={handleSelectWebTemplate}
              onShowToast={showToast}
              historyRefreshTrigger={historyRefreshTrigger}
            />
          </div>

          <div className="h-[40%] min-h-0 flex flex-col flex-1">
            <StickersAndFilters
              filter={filter}
              filterIntensity={filterIntensity}
              onSelectFilter={setFilter}
              onChangeFilterIntensity={setFilterIntensity}
              stickers={stickers}
              onAddSticker={handleAddSticker}
              onClearStickers={() => setStickrs([])}
              watermark={watermark}
              onToggleWatermark={setWatermark}
            />
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-6 h-full min-h-0 flex flex-col items-center justify-between gap-1.5 overflow-hidden">
          <div className="w-full shrink-0">
            <ImageUploadBar
              onUploadImage={handleUploadImage}
              isCustomUploaded={selectedTemplateId === null}
              onResetOriginal={handleResetOriginalImage}
            />
          </div>

          <div className="w-full shrink-0">
            <MemeTextInputBar
              textBoxes={textBoxes}
              selectedBoxId={selectedBoxId}
              onSelectBox={setSelectedBoxId}
              onUpdateTextBox={handleUpdateTextBox}
              onAddTextBox={handleAddTextBox}
              onRemoveTextBox={handleRemoveTextBox}
              onResetPositions={handleResetPositions}
            />
          </div>

          <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center">
            <MemeCanvas
              imageSrc={activeImageSrc}
              textBoxes={textBoxes}
              stickers={stickers}
              filter={filter}
              filterIntensity={filterIntensity}
              watermark={watermark}
              selectedBoxId={selectedBoxId}
              onSelectBox={setSelectedBoxId}
              onUpdateBoxPosition={handleUpdateBoxPosition}
              onUpdateBoxFontSize={handleUpdateBoxFontSize}
              onDeleteBox={handleRemoveTextBox}
              onUpdateStickerPosition={handleUpdateStickerPosition}
              onUpdateStickerScale={handleUpdateStickerScale}
              onDeleteSticker={handleDeleteSticker}
              onOpenMagicCaptions={handleOpenMagicCaptions}
              onOpenCrop={() => setIsCropOpen(true)}
              isGeneratingCaptions={isGeneratingCaptions}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              isDraftSaved={isDraftSaved}
              compositionAnalysis={compositionAnalysis}
              guideType={guideType}
              onSetGuideType={setGuideType}
              onOpenCompositionAnalysis={() => setIsCompositionModalOpen(true)}
              isAnalyzingComposition={isAnalyzingComposition}
            />
          </div>

          <div className="w-full shrink-0">
            <MemeTextStyleBar
              textBoxes={textBoxes}
              selectedBoxId={selectedBoxId}
              onUpdateTextBox={handleUpdateTextBox}
            />
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-3 h-full min-h-0 flex flex-col pl-0.5">
          <SuggestedMemesPanel
            captions={captions}
            isLoading={isGeneratingCaptions}
            onGenerate={(overrideStyle) => generateMagicCaptions(overrideStyle)}
            onApplyCaption={handleApplyCaption}
            selectedStyle={selectedStyle}
            onSelectStyle={(style) => {
              setSelectedStyle(style);
              void generateMagicCaptions(style);
            }}
            customContext={customContext}
            onCustomContextChange={setCustomContext}
            onOpenFullModal={() => setIsMagicModalOpen(true)}
          />
        </aside>
      </main>

      <MagicCaptionModal
        isOpen={isMagicModalOpen}
        onClose={() => setIsMagicModalOpen(false)}
        captions={captions}
        isLoading={isGeneratingCaptions}
        error={captionError}
        selectedStyle={selectedStyle}
        onSelectStyle={setSelectedStyle}
        customContext={customContext}
        onCustomContextChange={setCustomContext}
        onGenerate={() => generateMagicCaptions()}
        onApplyCaption={handleApplyCaption}
      />

      <CropZoomModal
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        imageSrc={activeImageSrc}
        originalImageSrc={originalImageSrc}
        onApplyCrop={handleApplyCrop}
        onResetOriginal={handleResetOriginalImage}
      />

      <CompositionAnalysisModal
        isOpen={isCompositionModalOpen}
        onClose={() => setIsCompositionModalOpen(false)}
        analysis={compositionAnalysis}
        isLoading={isAnalyzingComposition}
        onReAnalyze={() => runCompositionAnalysis()}
        onApplyOptimization={handleApplyCompositionOptimization}
        guideType={guideType}
        onSetGuideType={setGuideType}
      />
    </div>
  );
}