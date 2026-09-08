import React, { useState } from 'react';
import { CaptionSuggestion } from '../types';
import {
  Sparkles,
  Check,
  RefreshCw,
  X,
  Laugh,
  MessageSquareQuote,
  Flame,
  Briefcase,
  Zap,
  Heart,
  Terminal,
  Coffee,
  Brain,
  Gamepad2,
  HeartHandshake,
  Film,
  Dices,
  Target,
  Radio,
} from 'lucide-react';

interface MagicCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  captions: CaptionSuggestion[];
  isLoading: boolean;
  error: string | null;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  customContext: string;
  onCustomContextChange: (ctx: string) => void;
  onGenerate: () => void;
  onApplyCaption: (caption: CaptionSuggestion) => void;
}

const STYLES = [
  { id: 'trending', label: 'Тренды / Вирусный', icon: Flame, desc: 'Острый интернет-юмор и актуальные ситуации' },
  { id: 'roast', label: 'Подкол / Прожарка', icon: Target, desc: 'Язвительный, резкий юмор, высмеивающий суть изображения' },
  { id: 'relatable', label: 'Жиза / Бытовуха', icon: Coffee, desc: 'То, что всех достало: пакет с пакетами, перфоратор в субботу, быт' },
  { id: 'work', label: 'Work (Офис и IT)', icon: Briefcase, desc: 'Дедлайны, упавший прод, созвоны в Zoom, баги и Jira' },
  { id: 'millennials', label: 'Миллениалы (Дети 90-х)', icon: Radio, desc: 'Карбид, еШки, заброшки, огород, картонка на горке, фишки и кассеты' },
  { id: 'genz', label: 'Зумеры / Пост-ирония', icon: Laugh, desc: 'Абсурд, экзистенциальный кризис и тренды' },
  { id: 'sarcastic', label: 'Сарказм / Ирония', icon: Zap, desc: 'Едкая ирония и беспощадная правда' },
  { id: 'wholesome', label: 'Добро и милота', icon: Heart, desc: 'Поддерживающий, теплый и милый юмор' },
  { id: 'philosophy', label: 'Ночные мысли', icon: Brain, desc: 'Экзистенциальные думы в 3 часа ночи' },
  { id: 'gaming', label: 'Игры и гейминг', icon: Gamepad2, desc: 'Слитый рейтинг, сайд-квесты, лаги и тиммейты' },
  { id: 'dating', label: 'Отношения', icon: HeartHandshake, desc: 'Ред флаги, переписки, намеки и неловкость' },
  { id: 'cinema', label: 'Кино и драма', icon: Film, desc: 'Кинематографичный пафос и эпичные повороты' },
  { id: 'absurd', label: 'Абсурд / Шитпостинг', icon: Dices, desc: 'Сюрреалистичный юмор и непредсказуемый панч' },
];

const LOADING_MESSAGES = [
  'Анализ выражений лиц и позы на изображении...',
  'Сканирование картинки на уровень комической иронии...',
  'Совет мемологов ИИ подбирает лучшие панчи...',
  'Расчет тайминга шутки и остроумия...',
  'Полировка 5 отборных вариантов подписи...',
];

export const MagicCaptionModal: React.FC<MagicCaptionModalProps> = ({
  isOpen,
  onClose,
  captions,
  isLoading,
  error,
  selectedStyle,
  onSelectStyle,
  customContext,
  onCustomContextChange,
  onGenerate,
  onApplyCaption,
}) => {
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Rotate loading message
  React.useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isOpen) return null;

  const handleApply = (caption: CaptionSuggestion, index: number) => {
    setAppliedIndex(index);
    onApplyCaption(caption);
    setTimeout(() => {
      setAppliedIndex(null);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-neutral-950 shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Замемить с ИИ
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Gemini
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                ИИ анализирует изображение и генерирует вирусные панчи • Кликните для применения
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Humor Style Selector */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-2">
              Выберите стиль юмора
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {STYLES.map((style) => {
                const Icon = style.icon;
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => onSelectStyle(style.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white shadow-sm'
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <div>
                      <div className="text-xs font-bold">{style.label}</div>
                      <div className="text-[10px] text-neutral-400 line-clamp-1">{style.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Prompt Guidance */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customContext}
              onChange={(e) => onCustomContextChange(e.target.value)}
              placeholder="По желанию: укажите тему (например, 'утро понедельника', 'сессия', 'крипта')..."
              className="flex-1 bg-neutral-950/60 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/80 transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onGenerate();
              }}
            />
            <button
              onClick={() => onGenerate()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-950 hover:brightness-110 active:scale-95 transition disabled:opacity-50 cursor-pointer shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{captions.length > 0 ? 'Еще 5 вариантов' : 'Замемить!'}</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Анализ изображения...</p>
                <p className="text-xs text-amber-300/80 mt-1 transition-all duration-300">
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </p>
              </div>
            </div>
          )}

          {/* 5 Suggested Captions List */}
          {!isLoading && captions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  5 вариантов подписей от ИИ (нажмите, чтобы применить)
                </span>
                <span className="text-[11px] text-amber-400 font-medium">
                  {captions.length} предложений
                </span>
              </div>

              <div className="grid gap-2.5">
                {captions.map((caption, idx) => {
                  const isJustApplied = appliedIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleApply(caption, idx)}
                      className={`group relative p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isJustApplied
                          ? 'border-emerald-500 bg-emerald-950/30 scale-[0.99]'
                          : 'border-neutral-800/90 bg-neutral-950/60 hover:border-amber-400/60 hover:bg-neutral-800/60 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-800 text-amber-300 uppercase tracking-wider">
                              Вариант #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-neutral-300">
                              {caption.headline}
                            </span>
                          </div>

                          {/* Caption Preview Boxes */}
                          <div className="pt-2 pb-1 space-y-1">
                            {caption.topText && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-[10px] font-semibold text-neutral-400 uppercase shrink-0">ВЕРХ:</span>
                                <span className="text-xs font-bold text-white font-mono tracking-tight bg-neutral-900/90 px-2 py-1 rounded border border-neutral-800">
                                  "{caption.topText}"
                                </span>
                              </div>
                            )}
                            <div className="flex items-baseline gap-2">
                              <span className="text-[10px] font-semibold text-neutral-400 uppercase shrink-0">НИЗ:</span>
                              <span className="text-xs font-bold text-amber-300 font-mono tracking-tight bg-neutral-900/90 px-2 py-1 rounded border border-neutral-800">
                                "{caption.bottomText}"
                              </span>
                            </div>
                          </div>

                          {/* AI Visual Perception Badges (Mechanic, Contradiction, Detail, Mood) */}
                          {(caption.humorMechanic || caption.visualContradiction || caption.spottedDetail || caption.detectedMood) && (
                            <div className="pt-1 pb-1 flex flex-wrap gap-1.5 text-[10px]">
                              {caption.humorMechanic && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-1 font-semibold">
                                  <span>🎯 Механика:</span>
                                  <span className="text-white font-medium">{caption.humorMechanic}</span>
                                </span>
                              )}
                              {caption.visualContradiction && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/25 flex items-center gap-1">
                                  <span>⚡ Противоречие:</span>
                                  <span className="text-white font-medium">{caption.visualContradiction}</span>
                                </span>
                              )}
                              {caption.spottedDetail && (
                                <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/25 flex items-center gap-1">
                                  <span>🔍 Деталь:</span>
                                  <span className="text-white font-medium">{caption.spottedDetail}</span>
                                </span>
                              )}
                              {caption.detectedMood && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                                  <span>🎭 Настроение:</span>
                                  <span className="text-white font-medium">{caption.detectedMood}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {caption.imageConnection && (
                            <p className="text-[10px] text-amber-200/80 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                              📷 <span className="font-semibold">Привязка к кадру:</span> {caption.imageConnection}
                            </p>
                          )}

                          {/* Reason/Humor context */}
                          <p className="text-[11px] text-neutral-400 italic pt-1">
                            💡 {caption.explanation}
                          </p>
                        </div>

                        {/* Apply Action */}
                        <div className="shrink-0 flex items-center pt-2">
                          <button
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              isJustApplied
                                ? 'bg-emerald-500 text-neutral-950'
                                : 'bg-neutral-800 text-neutral-200 group-hover:bg-amber-400 group-hover:text-neutral-950'
                            }`}
                          >
                            {isJustApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Применено!</span>
                              </>
                            ) : (
                              <>
                                <MessageSquareQuote className="w-3.5 h-3.5" />
                                <span>Выбрать</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State before first generation */}
          {!isLoading && captions.length === 0 && !error && (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Готово к созданию мема</p>
                <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                  Нажмите кнопку ниже, чтобы Gemini проанализировал визуальные детали этого изображения и предложил 5 остроумных подписей.
                </p>
              </div>
              <button
                onClick={onGenerate}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-950 hover:brightness-110 active:scale-95 transition shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                ✨ Анализировать фото и создать 5 подписей
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <span>Нажатие на подпись сразу накладывает ее на мем.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
