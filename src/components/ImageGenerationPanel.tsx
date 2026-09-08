import React, { useState, useMemo } from 'react';
import {
  ImagePlus,
  Sparkles,
  Wand2,
  RefreshCw,
  Download,
  Check,
  Layers,
  Dice5,
  Maximize2,
  Trash2,
  Flame,
  Coffee,
  Briefcase,
  Target,
  Laugh,
  type LucideIcon,
} from 'lucide-react';
import { CaptionSuggestion, GeneratedMemeImage, TextBox } from '../types';
import { getAiStyle } from '../data/aiStyles';

interface ImageGenerationPanelProps {
  onApplyImageToCanvas: (imageUrl: string, promptText?: string) => void;
  activeImageSrc: string;
  textBoxes: TextBox[];
  captions: CaptionSuggestion[];
  selectedStyle: string;
  onShowToast: (msg: string) => void;
  onOpenModal?: () => void;
  generateImage: (params: {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
    sourceImageBase64?: string;
    mode?: 'create' | 'edit';
  }) => Promise<GeneratedMemeImage | null>;
  isGenerating: boolean;
  history: GeneratedMemeImage[];
  onDeleteHistoryItem?: (id: string) => void;
}

const STYLE_PROMPT_PRESETS: Record<string, { label: string; prompt: string }[]> = {
  trending: [
    { label: 'Кот в шоке', prompt: 'Пушистый кот смотрит в камеру с широко раскрытыми глазами от шока' },
    { label: 'Капибара дзен', prompt: 'Спокойная капибара сидит в теплой воде с апельсином на голове' },
    { label: 'Драматичный хомяк', prompt: 'Хомяк в деловом костюме с драматичным освещением в стиле нуар' },
  ],
  roast: [
    { label: 'Саркастичный взгляд', prompt: 'Человек с легкой ухмылкой и скептическим взглядом смотрит поверх очков' },
    { label: 'Кот-судья', prompt: 'Кот сидит на возвышении и надменно оценивает окружающих' },
    { label: 'Фейспалм века', prompt: 'Выразительный кинематографичный жест рукалицо на фоне неонового офиса' },
  ],
  relatable: [
    { label: 'Холодильник в 3:00', prompt: 'Сонный человек в пижаме стоит перед открытым светящимся холодильником ночью' },
    { label: 'Утренний кофе', prompt: 'Человек держит гигантскую кружку кофе с пустым взглядом перед будильником' },
    { label: 'Ожидание зарплаты', prompt: 'Грустная копилка-свинка смотрит на пустой кошелек' },
  ],
  work: [
    { label: 'Горящий дедлайн', prompt: 'Офисный работник печатает на клавиатуре, пока вокруг летают стикеры с задачами' },
    { label: 'Созвон без камеры', prompt: 'Кот в наушниках сидит за ноутбуком с чашкой чая' },
    { label: 'Баг на проде', prompt: 'Программист в ужасе смотрит на красный экран монитора с падающими графиками' },
  ],
  absurd: [
    { label: 'Пингвин в скафандре', prompt: 'Серьезный пингвин в космическом скафандре держит банан на Луне' },
    { label: 'Голубь-босс', prompt: 'Огромный упитанный голубь сидит за столом переговоров в небоскребе' },
    { label: 'Тостер-философ', prompt: 'Тостер с глазами смотрит в ночное звездное небо' },
  ],
  philosophy: [
    { label: 'Мыслитель в пледе', prompt: 'Человек задумчиво смотрит в окно с дождем, завернувшись в теплый плед' },
    { label: 'Собака познала мир', prompt: 'Собака сидит на вершине холма на закате и философски смотрит вдаль' },
    { label: 'Чашка чая', prompt: 'Пар от горячего чая складывается в знак вопроса над книгой' },
  ],
  irony: [
    { label: 'Все под контролем', prompt: 'Пес в шляпе сидит за чашкой кофе, пока вокруг легкий хаос' },
    { label: 'Успешный успех', prompt: 'Мультяшный персонаж гордо стоит на детском велосипеде в смокинге' },
    { label: 'План был надежен', prompt: 'Инженер смотрит на сломанную шестеренку со схемой в руках' },
  ],
};

const RANDOM_MEME_PROMPTS = [
  'Кот в солнечных очках сидит за рулем детской машинки с важным видом',
  'Панда пытается заниматься йогой, но заснула в нелепой позе',
  'Офисный клерк с тремя чашками кофе пытается поймать улетающий лист бумаги',
  'Капибара в деловом галстуке проводит совещание среди уток',
  'Человек удивленно сравнивает ожидание и реальность онлайн-покупки',
  'Енот пытается украсть арбуз, пойманный с поличным врасплох',
  'Робот с грустным смайликом на экране пытается понять шутку человека',
  'Кот на задних лапах удивленно смотрит в микроволновку',
];

const STYLE_ICONS: Record<string, LucideIcon> = {
  trending: Flame,
  roast: Target,
  relatable: Coffee,
  work: Briefcase,
  absurd: Wand2,
  irony: Laugh,
};

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
  onApplyImageToCanvas,
  activeImageSrc,
  textBoxes,
  captions,
  selectedStyle,
  onShowToast,
  onOpenModal,
  generateImage,
  isGenerating,
  history,
  onDeleteHistoryItem,
}) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [activeTab, setActiveTab] = useState<'prompt' | 'phrases' | 'history'>('prompt');
  const [justAppliedId, setJustAppliedId] = useState<string | null>(null);

  const currentStyleDef = useMemo(() => getAiStyle(selectedStyle), [selectedStyle]);
  const stylePresets = useMemo(() => {
    return STYLE_PROMPT_PRESETS[selectedStyle] ?? STYLE_PROMPT_PRESETS.trending ?? [];
  }, [selectedStyle]);

  const StyleIcon = STYLE_ICONS[selectedStyle] || Wand2;

  // Handle generation
  const handleGenerate = async (overridePrompt?: string) => {
    const finalPrompt = (overridePrompt || prompt).trim();
    if (!finalPrompt) {
      onShowToast('Введите описание или выберите готовую фразу');
      return;
    }

    if (overridePrompt) {
      setPrompt(overridePrompt);
    }

    const result = await generateImage({
      prompt: finalPrompt,
      aspectRatio,
      mode,
      sourceImageBase64: mode === 'edit' ? activeImageSrc : undefined,
    });

    if (result) {
      onShowToast(
        result.isFallback
          ? 'Шаблон создан (локальный fallback)'
          : 'Мем-картинка успешно сгенерирована через Gemini 3.1!'
      );
    }
  };

  const handleApplyToCanvas = (img: GeneratedMemeImage) => {
    setJustAppliedId(img.id);
    onApplyImageToCanvas(img.imageUrl, img.prompt);
    onShowToast('Картинка перенесена на холст!');
    setTimeout(() => setJustAppliedId(null), 1500);
  };

  const handleDownload = (img: GeneratedMemeImage) => {
    try {
      const a = document.createElement('a');
      a.href = img.imageUrl;
      a.download = `memenator-ai-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onShowToast('Картинка скачивается');
    } catch {
      onShowToast('Не удалось скачать изображение');
    }
  };

  const handleRandomPrompt = () => {
    const rand = RANDOM_MEME_PROMPTS[Math.floor(Math.random() * RANDOM_MEME_PROMPTS.length)];
    if (rand) setPrompt(rand);
  };

  // Phrases from canvas
  const canvasPhrase = useMemo(() => {
    const top = textBoxes[0]?.text?.trim();
    const bottom = textBoxes[1]?.text?.trim();
    if (top && bottom) return `${top} — ${bottom}`;
    return top || bottom || '';
  }, [textBoxes]);

  const latestImage = history[0] || null;

  return (
    <div className="bg-neutral-900/90 border border-rose-500/30 rounded-3xl p-3.5 backdrop-blur shadow-xl w-full h-full flex flex-col min-h-0 gap-2.5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0">
            <ImagePlus className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Сгенерировать мем
            </h3>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
              Gemini 3.1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onOpenModal && (
            <button
              onClick={onOpenModal}
              type="button"
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Развернуть на весь экран"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 p-0.5 bg-neutral-950/80 rounded-xl border border-neutral-800 shrink-0 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`py-1 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'create'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Новая картинка</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`py-1 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'edit'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Wand2 className="w-3 h-3" />
          <span>Изменить текущую</span>
        </button>
      </div>

      {/* Navigation sub-tabs: Prompt vs Ready Phrases vs History */}
      <div className="flex items-center gap-1 text-[10px] font-semibold border-b border-neutral-800/80 pb-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
            activeTab === 'prompt'
              ? 'bg-neutral-800 text-white font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Описание
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('phrases')}
          className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
            activeTab === 'phrases'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>Готовые фразы ИИ</span>
          {captions.length > 0 && (
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[9px] flex items-center justify-center">
              {captions.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ml-auto ${
            activeTab === 'history'
              ? 'bg-neutral-800 text-white font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Галерея ({history.length})</span>
        </button>
      </div>

      {/* Content based on sub-tab */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto pr-0.5 custom-scrollbar">
        {/* SUBTAB 1: PROMPT INPUT */}
        {activeTab === 'prompt' && (
          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <div className="relative flex-1 flex flex-col min-h-[70px]">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'create'
                    ? 'Опишите мем-картинку (например: удивленный кот перед монитором в стиле офисной комедии)...'
                    : 'Опишите изменения для текущего фото (например: добавь солнечные очки и неоновые лучи)...'
                }
                rows={2}
                className="w-full flex-1 bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500/70 transition resize-none custom-scrollbar"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt('')}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300 px-1 py-0.5 rounded bg-neutral-900/80 border border-neutral-800"
                    title="Очистить"
                  >
                    Очистить
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRandomPrompt}
                  className="p-1 text-neutral-400 hover:text-rose-400 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded transition cursor-pointer"
                  title="Случайная идея"
                >
                  <Dice5 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="flex items-center justify-between text-[10px] shrink-0 pt-0.5">
              <span className="text-neutral-400 font-semibold uppercase tracking-wider">Формат:</span>
              <div className="flex items-center gap-1">
                {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick action bar */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white hover:brightness-110 active:scale-98 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Генерация через Gemini 3.1...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {mode === 'create' ? 'Сгенерировать картинку' : 'Применить изменения к фото'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* SUBTAB 2: READY PHRASES FROM HUMOR STYLES & AI CAPTIONS */}
        {activeTab === 'phrases' && (
          <div className="space-y-2.5 text-xs">
            {/* Phrases from SuggestedMemesPanel (Замемить с ИИ) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>⚡ Из «Замемить с ИИ»</span>
                </span>
                <span className="text-neutral-500">Клик для генерации</span>
              </div>

              {captions.length === 0 ? (
                <div className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/50 text-center text-neutral-400 text-[11px]">
                  В секции «Замемить с ИИ» пока нет вариантов. Нажмите «Еще 3 варианта» справа или выберите готовый стиль ниже.
                </div>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5 custom-scrollbar">
                  {captions.map((cap, idx) => {
                    const fullText = [cap.topText, cap.bottomText].filter(Boolean).join(' — ');
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const visualPrompt = `Комедийная мем-сцена выражающая смысл: "${fullText}". Стиль: ${currentStyleDef?.label || 'интернет-юмор'}, выразительная мимика, читаемая композиция`;
                          setPrompt(visualPrompt);
                          setActiveTab('prompt');
                          void handleGenerate(visualPrompt);
                        }}
                        className="w-full p-2 rounded-xl border border-neutral-800 hover:border-amber-400/80 bg-neutral-950/70 hover:bg-neutral-950 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-amber-400">#{idx + 1} {cap.headline}</span>
                          <span className="text-neutral-400 group-hover:text-white flex items-center gap-1">
                            <span>Сгенерировать</span>
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-200 line-clamp-2 leading-tight">
                          "{fullText}"
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Phrases from Canvas */}
            {canvasPhrase && (
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                  💬 Текст с вашего холста:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const visualPrompt = `Выразительный мем-визуал для текста: "${canvasPhrase}". Ироничная кинематографичная сцена с персонажами`;
                    setPrompt(visualPrompt);
                    setActiveTab('prompt');
                    void handleGenerate(visualPrompt);
                  }}
                  className="w-full p-2 rounded-xl border border-neutral-800 hover:border-rose-500/80 bg-neutral-950/70 hover:bg-neutral-950 text-left transition cursor-pointer flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] text-neutral-200 font-medium truncate">
                    "{canvasPhrase}"
                  </span>
                  <span className="text-[10px] font-bold text-rose-400 shrink-0">Создать визуал</span>
                </button>
              </div>
            )}

            {/* Phrases from Humor Style */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <StyleIcon className="w-3 h-3 text-rose-400" />
                  <span>Идеи в стиле: {currentStyleDef?.compactLabel || 'Тренды'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {stylePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.prompt);
                      setActiveTab('prompt');
                      void handleGenerate(preset.prompt);
                    }}
                    className="p-2 rounded-xl border border-neutral-800 hover:border-rose-400/80 bg-neutral-950/60 hover:bg-neutral-950 text-left transition cursor-pointer flex items-center justify-between gap-1.5 group"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[11px] text-white block">
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate block">
                        {preset.prompt}
                      </span>
                    </div>
                    <Sparkles className="w-3 h-3 text-neutral-500 group-hover:text-rose-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: GALLERY & HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span>Сохраненные генерации ({history.length}):</span>
              {history.length > 0 && onDeleteHistoryItem && (
                <button
                  type="button"
                  onClick={() => {
                    history.forEach((h) => onDeleteHistoryItem(h.id));
                    onShowToast('Галерея очищена');
                  }}
                  className="text-rose-400 hover:underline"
                >
                  Очистить
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-neutral-800 text-center text-neutral-400 text-xs">
                Пока нет сгенерированных изображений. Сгенерируйте первую картинку во вкладке «Описание»!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
                {history.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex flex-col"
                  >
                    <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden">
                      <img
                        src={img.imageUrl}
                        alt={img.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {img.isFallback && (
                        <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-amber-500/90 text-neutral-950 font-black text-[8px] uppercase">
                          SVG
                        </span>
                      )}
                    </div>
                    <div className="p-1.5 flex flex-col gap-1">
                      <p className="text-[10px] text-neutral-300 truncate" title={img.prompt}>
                        {img.prompt}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleApplyToCanvas(img)}
                          className="flex-1 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          {justAppliedId === img.id ? (
                            <><Check className="w-2.5 h-2.5" /><span>На холсте!</span></>
                          ) : (
                            <span>На холст</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(img)}
                          className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
                          title="Скачать"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        {onDeleteHistoryItem && (
                          <button
                            type="button"
                            onClick={() => onDeleteHistoryItem(img.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Latest Result Banner (if we have one and not in history tab) */}
      {latestImage && activeTab !== 'history' && (
        <div className="p-2 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex items-center gap-2.5 shrink-0">
          <img
            src={latestImage.imageUrl}
            alt="Последняя генерация"
            className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">
              Готово к использованию
            </span>
            <p className="text-[11px] text-neutral-200 truncate font-medium">
              {latestImage.prompt}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleApplyToCanvas(latestImage)}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500 hover:bg-rose-400 text-white transition shadow-sm cursor-pointer shrink-0 flex items-center gap-1"
          >
            {justAppliedId === latestImage.id ? (
              <><Check className="w-3 h-3" /><span>Наложено</span></>
            ) : (
              <span>На холст</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};