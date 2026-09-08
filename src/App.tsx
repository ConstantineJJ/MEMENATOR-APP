import React, { useCallback, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { CompositionAnalysisModal } from './components/CompositionAnalysisModal';
import { CropZoomModal } from './components/CropZoomModal';
import { HistoryAndFavoritesPanel } from './components/HistoryAndFavoritesPanel';
import { ImageGenerationModal } from './components/ImageGenerationModal';
import { ImageGenerationPanel } from './components/ImageGenerationPanel';
import { ImageUploadBar } from './components/ImageUploadBar';
import { MagicCaptionModal } from './components/MagicCaptionModal';
import { MemeCanvas } from './components/MemeCanvas';
import { MemeTextInputBar } from './components/MemeTextInputBar';
import { MemeTextStyleBar } from './components/MemeTextStyleBar';
import { RandomMemesPanel } from './components/RandomMemesPanel';
import { SuggestedMemesPanel } from './components/SuggestedMemesPanel';
import { WatermelonLogo } from './components/WatermelonLogo';
import { AI_STYLES, getAiStyle } from './data/aiStyles';
import { TRENDING_TEMPLATES } from './data/templates';
import { useCompositionAnalysis } from './hooks/useCompositionAnalysis';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useMagicCaptions } from './hooks/useMagicCaptions';
import {
  MemeDraftSnapshot,
  MemeDraftState,
  useMemeDraftPersistence,
} from './hooks/useMemeDraftPersistence';
import {
  MemeHistoryAutosaveSnapshot,
  useMemeHistoryAutosave,
} from './hooks/useMemeHistoryAutosave';
import { MemeHistorySnapshot, useMemeUndoHistory } from './hooks/useMemeUndoHistory';
import {
  CaptionSuggestion,
  CompositionGuideType,
  MemeFilter,
  MemeSticker,
  SavedMemeState,
  TextBox,
  WebMemeItem,
} from './types';

const INITIAL_TEXT_BOXES: TextBox[] = [
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
];

export default function App() {
  const [activeImageSrc, setActiveImageSrc] = useState(TRENDING_TEMPLATES[0].url);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(TRENDING_TEMPLATES[0].url);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(TRENDING_TEMPLATES[0].id);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>(INITIAL_TEXT_BOXES);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>('top-1');

  // Filters/stickers remain part of the editable project format for backward
  // compatibility with saved memes, but their dedicated sidebar block is hidden.
  const [stickers, setStickers] = useState<MemeSticker[]>([]);
  const [filter, setFilter] = useState<MemeFilter>('none');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [watermark, setWatermark] = useState(false);

  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);
  const [isImageGenModalOpen, setIsImageGenModalOpen] = useState(false);
  const [guideType, setGuideType] = useState<CompositionGuideType>('none');
  const [notification, setNotification] = useState<string | null>(null);

  const {
    isGenerating: isGeneratingImage,
    history: generatedImagesHistory,
    generateImage,
    deleteGeneratedImage,
  } = useImageGeneration();

  const showToast = useCallback((message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 2800);
  }, []);

  const {
    compositionAnalysis,
    isAnalyzingComposition,
    runCompositionAnalysis,
  } = useCompositionAnalysis(activeImageSrc);

  const handleCaptionsGenerated = useCallback(() => {
    showToast('Готово! Варианты мема предложены');
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

  const applyHistorySnapshot = useCallback((snapshot: MemeHistorySnapshot) => {
    setTextBoxes(snapshot.textBoxes);
    setStickers(snapshot.stickers);
    setFilter(snapshot.filter);
    setFilterIntensity(snapshot.filterIntensity ?? 100);
    setWatermark(snapshot.watermark);
    setActiveImageSrc(snapshot.activeImageSrc);
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

  const applyDraft = useCallback((draft: MemeDraftState) => {
    setTextBoxes(draft.textBoxes);
    if (Array.isArray(draft.stickers)) setStickers(draft.stickers);
    if (draft.filter) setFilter(draft.filter);
    if (typeof draft.filterIntensity === 'number') setFilterIntensity(draft.filterIntensity);
    if (draft.watermark !== undefined) setWatermark(draft.watermark);
    setActiveImageSrc(draft.activeImageSrc);
    if (draft.originalImageSrc) setOriginalImageSrc(draft.originalImageSrc);
    if (draft.selectedTemplateId !== undefined) setSelectedTemplateId(draft.selectedTemplateId);
  }, []);

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
    onRestored: () => showToast('Черновик успешно восстановлен из памяти'),
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
  } = useMemeHistoryAutosave({ currentSnapshot: currentHistoryAutosaveSnapshot });

  const handleRestoreMeme = useCallback((saved: SavedMemeState) => {
    setActiveMemeId(saved.id);
    setActiveImageSrc(saved.imageSrc);
    setOriginalImageSrc(saved.imageSrc);
    setTextBoxes(saved.textBoxes);
    setStickers(saved.stickers);
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

  const handleSelectWebTemplate = useCallback((item: WebMemeItem) => {
    startNewMeme();
    setSelectedTemplateId(item.id);
    setActiveImageSrc(item.imageUrl);
    setOriginalImageSrc(item.imageUrl);
    clearCaptions();

    const nextTextBoxes = [
      { ...textBoxes[0], text: item.defaultTopText || '' },
      { ...textBoxes[1], text: item.defaultBottomText || '' },
      ...textBoxes.slice(2),
    ];
    setTextBoxes(nextTextBoxes);

    pushToHistory({
      textBoxes: nextTextBoxes,
      stickers,
      filter,
      filterIntensity,
      watermark,
      activeImageSrc: item.imageUrl,
    });
  }, [clearCaptions, filter, filterIntensity, pushToHistory, startNewMeme, stickers, textBoxes, watermark]);

  const handleUploadImage = useCallback((file: File) => {
    startNewMeme();
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const resultUrl = event.target.result as string;
      setActiveImageSrc(resultUrl);
      setOriginalImageSrc(resultUrl);
      setSelectedTemplateId(null);
      clearCaptions();
      showToast('Фото загружено! Нажмите «Замемить» для создания мема.');
    };
    reader.readAsDataURL(file);
  }, [clearCaptions, showToast, startNewMeme]);

  const handleApplyCrop = useCallback((croppedDataUrl: string) => {
    setActiveImageSrc(croppedDataUrl);
    showToast('Кадрирование успешно применено!');
  }, [showToast]);

  const handleResetOriginalImage = useCallback(() => {
    if (!originalImageSrc) return;
    setActiveImageSrc(originalImageSrc);
    showToast('Исходное фото восстановлено!');
  }, [originalImageSrc, showToast]);

  const handleApplyGeneratedImage = useCallback(
    (imageUrl: string, promptText?: string) => {
      startNewMeme();
      setActiveImageSrc(imageUrl);
      setOriginalImageSrc(imageUrl);
      setSelectedTemplateId(null);
      clearCaptions();

      pushToHistory({
        textBoxes,
        stickers,
        filter,
        filterIntensity,
        watermark,
        activeImageSrc: imageUrl,
      });

      showToast(
        promptText
          ? `Сгенерированный визуал на холсте: "${promptText.slice(0, 32)}..."`
          : 'Сгенерированный визуал на холсте!'
      );
    },
    [clearCaptions, filter, filterIntensity, pushToHistory, showToast, startNewMeme, stickers, textBoxes, watermark]
  );

  const handleGenerateImageFromCaption = useCallback(
    async (caption: CaptionSuggestion) => {
      const fullText = [caption.topText, caption.bottomText].filter(Boolean).join(' — ');
      const styleName = getAiStyle(selectedStyle)?.label || 'интернет-юмор';
      const promptText = `Комедийная мем-сцена выражающая смысл: "${fullText}". Стиль: ${styleName}, выразительная мимика, читаемая композиция`;
      showToast('Запущена генерация мем-картинки по выбранной фразе...');
      const result = await generateImage({ prompt: promptText, aspectRatio: '1:1' });
      if (result) {
        showToast('Мем-картинка готова! Она доступна в галерее генератора слева.');
      }
    },
    [generateImage, selectedStyle, showToast]
  );

  const handleGenerateImageFromStyle = useCallback(
    async (styleId: string) => {
      const styleName = getAiStyle(styleId)?.label || 'трендовый юмор';
      const promptText = `Вирусная мем-сцена в стиле юмора "${styleName}", выразительный персонаж в комичной ситуации, высокое качество`;
      showToast(`Генерация мем-картинки в стиле «${getAiStyle(styleId)?.compactLabel || 'Тренды'}»...`);
      const result = await generateImage({ prompt: promptText, aspectRatio: '1:1' });
      if (result) {
        showToast('Мем-картинка готова! Она доступна в галерее генератора слева.');
      }
    },
    [generateImage, showToast]
  );

  const handleApplyCompositionOptimization = useCallback(() => {
    if (!compositionAnalysis?.suggestedTextPlacements) return;
    const { topTextY, bottomTextY, align, suggestedFontSize } = compositionAnalysis.suggestedTextPlacements;

    setTextBoxes((previous) => previous.map((box, index) => {
      if (index > 1) return box;
      return {
        ...box,
        y: index === 0 ? (topTextY ?? 10) : (bottomTextY ?? 90),
        textAlign: (align as TextBox['textAlign']) || box.textAlign,
        fontSize: suggestedFontSize
          ? Math.max(26, Math.min(suggestedFontSize, 42))
          : box.fontSize,
      };
    }));

    setGuideType('zones');
    showToast('Текст оптимизирован под композицию кадра!');
  }, [compositionAnalysis, showToast]);

  const handleOpenMagicCaptions = useCallback(() => {
    if (captions.length === 0 && !isGeneratingCaptions) {
      void generateMagicCaptions();
    }
  }, [captions.length, generateMagicCaptions, isGeneratingCaptions]);

  const handleApplyCaption = useCallback((caption: CaptionSuggestion) => {
    setTextBoxes((previous) => previous.map((box, index) => {
      if (index === 0) return { ...box, text: caption.topText || '' };
      if (index === 1) return { ...box, text: caption.bottomText || '' };
      return box;
    }));
    showToast(`Применен мем: "${caption.headline}"`);
  }, [showToast]);

  const handleUpdateTextBox = useCallback((id: string, updates: Partial<TextBox>) => {
    setTextBoxes((previous) => previous.map((box) => (box.id === id ? { ...box, ...updates } : box)));
  }, []);

  const handleUpdateBoxPosition = useCallback((id: string, x: number, y: number) => {
    setTextBoxes((previous) => previous.map((box) => (box.id === id ? { ...box, x, y } : box)));
  }, []);

  const handleUpdateBoxFontSize = useCallback((id: string, fontSize: number) => {
    setTextBoxes((previous) => previous.map((box) => (box.id === id ? { ...box, fontSize } : box)));
  }, []);

  const handleAddTextBox = useCallback(() => {
    const id = `box-${Date.now()}`;
    const newBox: TextBox = {
      ...INITIAL_TEXT_BOXES[0],
      id,
      text: 'НОВЫЙ ТЕКСТ',
      x: 50,
      y: 50,
      fontSize: 32,
    };
    setTextBoxes((previous) => [...previous, newBox]);
    setSelectedBoxId(id);
    showToast('Добавлен новый текстовый блок');
  }, [showToast]);

  const handleRemoveTextBox = useCallback((id: string) => {
    setTextBoxes((previous) => {
      if (previous.length <= 1) return previous;
      const next = previous.filter((box) => box.id !== id);
      setSelectedBoxId((selected) => selected === id ? (next[0]?.id ?? null) : selected);
      return next;
    });
  }, []);

  const handleResetPositions = useCallback(() => {
    setTextBoxes((previous) => previous.map((box, index) => ({
      ...box,
      x: 50,
      y: index === 0 ? 12 : index === 1 ? 88 : 50,
    })));
    showToast('Позиции текста сброшены (верх и низ)');
  }, [showToast]);

  const handleUpdateStickerPosition = useCallback((id: string, x: number, y: number) => {
    setStickers((previous) => previous.map((sticker) => sticker.id === id ? { ...sticker, x, y } : sticker));
  }, []);

  const handleUpdateStickerScale = useCallback((id: string, scale: number) => {
    setStickers((previous) => previous.map((sticker) => sticker.id === id ? { ...sticker, scale } : sticker));
  }, []);

  const handleDeleteSticker = useCallback((id: string) => {
    setStickers((previous) => previous.filter((sticker) => sticker.id !== id));
  }, []);

  return (
    <div className="h-screen max-h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden antialiased selection:bg-rose-500 selection:text-white">
      {notification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-neutral-900/95 border border-rose-500/40 text-neutral-100 text-xs font-semibold px-4 py-1.5 rounded-full shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      <header className="h-14 sm:h-16 border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur px-3 sm:px-5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <WatermelonLogo size={42} />
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

        <span className="hidden lg:inline text-neutral-500 text-[11px] font-semibold">
          Холст в центре • ИИ справа
        </span>
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

          {/* Image generation section */}
          <div className="h-[40%] min-h-0 flex-1 flex flex-col overflow-hidden">
            <ImageGenerationPanel
              onApplyImageToCanvas={handleApplyGeneratedImage}
              activeImageSrc={activeImageSrc}
              textBoxes={textBoxes}
              captions={captions}
              selectedStyle={selectedStyle}
              onShowToast={showToast}
              onOpenModal={() => setIsImageGenModalOpen(true)}
              generateImage={generateImage}
              isGenerating={isGeneratingImage}
              history={generatedImagesHistory}
              onDeleteHistoryItem={deleteGeneratedImage}
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
            onGenerate={(style) => generateMagicCaptions(style)}
            onApplyCaption={handleApplyCaption}
            selectedStyle={selectedStyle}
            onSelectStyle={(style) => {
              setSelectedStyle(style);
              void generateMagicCaptions(style);
            }}
            customContext={customContext}
            onCustomContextChange={setCustomContext}
            onOpenFullModal={() => setIsMagicModalOpen(true)}
            onGenerateImageFromCaption={handleGenerateImageFromCaption}
            onGenerateImageFromStyle={handleGenerateImageFromStyle}
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

      <ImageGenerationModal
        isOpen={isImageGenModalOpen}
        onClose={() => setIsImageGenModalOpen(false)}
        onApplyImageToCanvas={handleApplyGeneratedImage}
        activeImageSrc={activeImageSrc}
        textBoxes={textBoxes}
        captions={captions}
        selectedStyle={selectedStyle}
        onShowToast={showToast}
        generateImage={generateImage}
        isGenerating={isGeneratingImage}
        history={generatedImagesHistory}
        onDeleteHistoryItem={deleteGeneratedImage}
      />
    </div>
  );
}
