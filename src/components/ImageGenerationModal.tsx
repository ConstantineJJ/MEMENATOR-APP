import React, { useState, useMemo } from 'react';
import {
  X,
  ImagePlus,
  Sparkles,
  Wand2,
  RefreshCw,
  Download,
  Check,
  Layers,
  Dice5,
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

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImageToCanvas: (imageUrl: string, promptText?: string) => void;
  activeImageSrc: string;
  textBoxes: TextBox[];
  captions: CaptionSuggestion[];
  selectedStyle: string;
  onShowToast: (msg: string) => void;
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

export const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  onClose,
  onApplyImageToCanvas,
  activeImageSrc,
  textBoxes,
  captions,
  selectedStyle,
  onShowToast,
  generateImage,
  isGenerating,
  history,
  onDeleteHistoryItem,
}) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [selectedPreview, setSelectedPreview] = useState<GeneratedMemeImage | null>(history[0] || null);

  const currentStyleDef = useMemo(() => getAiStyle(selectedStyle), [selectedStyle]);
  const stylePresets = useMemo(() => {
    return STYLE_PROMPT_PRESETS[selectedStyle] || STYLE_PROMPT_PRESETS.trending;
  }, [selectedStyle]);

  const StyleIcon = STYLE_ICONS[selectedStyle] || Wand2;

  const canvasPhrase = useMemo(() => {
    const top = textBoxes[0]?.text?.trim();
    const bottom = textBoxes[1]?.text?.trim();
    if (top && bottom) return `${top} — ${bottom}`;
    return top || bottom || '';
  }, [textBoxes]);

  if (!isOpen) return null;

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
      setSelectedPreview(result);
      onShowToast(
        result.isFallback
          ? 'Шаблон создан (локальный fallback)'
          : 'Мем-картинка успешно сгенерирована через Gemini 3.1!'
      );
    }
  };

  const activeImageToDisplay = selectedPreview || history[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-neutral-900 border border-rose-500/30 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-md">
              <ImagePlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Генератор мем-картинок
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Создавайте визуальные шаблоны по текстовому описанию или готовым фразам из ИИ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 p-4 sm:p-6 overflow-hidden">
          {/* Left Column: Controls & Prompt */}
          <div className="col-span-12 lg:col-span-7 h-full min-h-0 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
            {/* Mode selection */}
            <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'create'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Создать новую картинку</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'edit'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>Изменить текущее фото</span>
              </button>
            </div>

            {/* Prompt textarea */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <label className="text-neutral-300 font-bold uppercase tracking-wider">
                  {mode === 'create' ? 'Описание для визуала:' : 'Инструкция для редактирования:'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const rand = RANDOM_MEME_PROMPTS[Math.floor(Math.random() * RANDOM_MEME_PROMPTS.length)];
                    setPrompt(rand);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                >
                  <Dice5 className="w-3.5 h-3.5" />
                  <span>Случайная идея</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === 'create'
                      ? 'Опишите сцену мема: персонажи, выражение лица, окружение и комичность...'
                      : 'Опишите что добавить или изменить на текущей картинке...'
                  }
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition resize-none"
                />
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt('')}
                    className="absolute right-3 bottom-3 text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1 rounded bg-neutral-900 border border-neutral-800"
                  >
                    Очистить
                  </button>
                )}
              </div>
            </div>

            {/* Ready phrases from Humor Style & Captions */}
            <div className="space-y-2 shrink-0">
              <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider">
                Быстрые фразы для генерации:
              </span>

              {/* Captions from AI */}
              {captions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <span>⚡ Из «Замемить с ИИ»:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {captions.map((cap, idx) => {
                      const full = [cap.topText, cap.bottomText].filter(Boolean).join(' — ');
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const visualPrompt = `Комедийная мем-сцена выражающая смысл: "${full}". Стиль: ${currentStyleDef?.label || 'интернет-юмор'}, выразительная мимика`;
                            setPrompt(visualPrompt);
                            void handleGenerate(visualPrompt);
                          }}
                          className="p-2 rounded-xl border border-neutral-800 hover:border-amber-400 bg-neutral-950/70 hover:bg-neutral-950 text-left transition text-xs group"
                        >
                          <span className="font-bold text-amber-400 block text-[11px] truncate">
                            #{idx + 1} {cap.headline}
                          </span>
                          <span className="text-neutral-300 text-[11px] line-clamp-1">
                            "{full}"
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Canvas text */}
              {canvasPhrase && (
                <button
                  type="button"
                  onClick={() => {
                    const visualPrompt = `Мем-визуал для текста: "${canvasPhrase}". Ироничная кинематографичная сцена`;
                    setPrompt(visualPrompt);
                    void handleGenerate(visualPrompt);
                  }}
                  className="w-full p-2.5 rounded-xl border border-neutral-800 hover:border-rose-500 bg-neutral-950/70 hover:bg-neutral-950 text-left transition flex items-center justify-between text-xs"
                >
                  <div className="truncate">
                    <span className="text-neutral-400 font-bold mr-1.5">💬 Текст с холста:</span>
                    <span className="text-neutral-200 font-medium">"{canvasPhrase}"</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-400 shrink-0 ml-2">Сгенерировать</span>
                </button>
              )}

              {/* Humor style presets */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-300 font-semibold flex items-center gap-1">
                  <StyleIcon className="w-3.5 h-3.5 text-rose-400" />
                  <span>В стиле «{currentStyleDef?.compactLabel || 'Тренды'}»:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {stylePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(preset.prompt);
                        void handleGenerate(preset.prompt);
                      }}
                      className="p-2 rounded-xl border border-neutral-800 hover:border-rose-400 bg-neutral-950/70 hover:bg-neutral-950 text-left transition text-xs"
                    >
                      <span className="font-bold text-white block text-[11px] truncate">
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-neutral-400 line-clamp-1">
                        {preset.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aspect Ratio & Generate button */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-bold uppercase tracking-wider">Формат кадра:</span>
                <div className="flex items-center gap-1.5">
                  {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 px-4 rounded-2xl text-sm font-black bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white hover:brightness-110 active:scale-98 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Генерируем через Gemini 3.1 Flash Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{mode === 'create' ? 'Сгенерировать мем-картинку' : 'Применить изменения к фото'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Preview & History Gallery */}
          <div className="col-span-12 lg:col-span-5 h-full min-h-0 flex flex-col gap-3 overflow-hidden border-t lg:border-t-0 lg:border-l border-neutral-800 pl-0 lg:pl-4">
            {/* Active Preview */}
            <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
              {activeImageToDisplay ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 relative flex items-center justify-center p-3 bg-neutral-950/80 overflow-hidden">
                    <img
                      src={activeImageToDisplay.imageUrl}
                      alt={activeImageToDisplay.prompt}
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-4 left-4 px-2 py-0.5 rounded-lg bg-neutral-900/90 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                      {activeImageToDisplay.aspectRatio} • {activeImageToDisplay.modelUsed || 'Gemini 3.1'}
                    </span>
                  </div>

                  <div className="p-3 border-t border-neutral-800 bg-neutral-900/60 space-y-2 shrink-0">
                    <p className="text-xs text-neutral-300 font-medium line-clamp-2">
                      {activeImageToDisplay.prompt}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyImageToCanvas(activeImageToDisplay.imageUrl, activeImageToDisplay.prompt);
                          onShowToast('Картинка перенесена на холст!');
                          onClose();
                        }}
                        className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>Поместить на холст</span>
                      </button>

                      <a
                        href={activeImageToDisplay.imageUrl}
                        download={`memenator-${Date.now()}.png`}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition cursor-pointer"
                        title="Скачать изображение"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500 space-y-2">
                  <ImagePlus className="w-10 h-10 stroke-1 text-neutral-600" />
                  <p className="text-xs font-semibold">Здесь появится сгенерированная картинка</p>
                  <p className="text-[11px] text-neutral-600 max-w-xs">
                    Опишите сцену слева или нажмите на любую готовую фразу из ИИ для старта
                  </p>
                </div>
              )}
            </div>

            {/* Mini Gallery of recent generations */}
            {history.length > 0 && (
              <div className="h-28 shrink-0 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-semibold">История генераций ({history.length}):</span>
                  {onDeleteHistoryItem && (
                    <button
                      type="button"
                      onClick={() => history.forEach((h) => onDeleteHistoryItem(h.id))}
                      className="text-rose-400 hover:underline text-[10px]"
                    >
                      Очистить все
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPreview(item)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                        selectedPreview?.id === item.id
                          ? 'border-rose-500 ring-2 ring-rose-500/30'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
