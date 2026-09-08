import React, { useState } from 'react';
import { CaptionSuggestion } from '../types';
import {
  Sparkles,
  Check,
  Flame,
  Target,
  Coffee,
  Briefcase,
  Radio,
  Laugh,
  Zap,
  Heart,
  Brain,
  Gamepad2,
  HeartHandshake,
  Film,
  Dices,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface SuggestedMemesPanelProps {
  captions: CaptionSuggestion[];
  isLoading: boolean;
  onGenerate: (overrideStyle?: string) => void;
  onApplyCaption: (caption: CaptionSuggestion) => void;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  customContext?: string;
  onCustomContextChange?: (ctx: string) => void;
  onOpenFullModal?: () => void;
}

const AI_STYLES = [
  { id: 'trending', label: 'Тренды', icon: Flame, desc: 'Вирусный интернет-юмор' },
  { id: 'roast', label: 'Подкол / Прожарка', icon: Target, desc: 'Острый, язвительный юмор' },
  { id: 'relatable', label: 'Жиза / Бытовуха', icon: Coffee, desc: 'То, что всех достало' },
  { id: 'work', label: 'Work (Офис/IT)', icon: Briefcase, desc: 'Дедлайны, созвоны, баги' },
  { id: 'millennials', label: 'Миллениалы', icon: Radio, desc: 'Дети 90-х, фишки, ностальгия' },
  { id: 'genz', label: 'Зумеры', icon: Laugh, desc: 'Постирония и абсурд' },
  { id: 'sarcastic', label: 'Сарказм', icon: Zap, desc: 'Едкая ирония' },
  { id: 'wholesome', label: 'Добро и милота', icon: Heart, desc: 'Теплый, поддерживающий юмор' },
  { id: 'philosophy', label: 'Ночные мысли', icon: Brain, desc: 'Мысли в 3 часа ночи' },
  { id: 'gaming', label: 'Гейминг', icon: Gamepad2, desc: 'Рейтинг, лаги, тиммейты' },
  { id: 'dating', label: 'Отношения', icon: HeartHandshake, desc: 'Ред флаги, свидания' },
  { id: 'cinema', label: 'Кино', icon: Film, desc: 'Кинематографичный пафос' },
  { id: 'absurd', label: 'Шитпост', icon: Dices, desc: 'Сюрреалистичный юмор' },
];

export const SuggestedMemesPanel: React.FC<SuggestedMemesPanelProps> = ({
  captions,
  isLoading,
  onGenerate,
  onApplyCaption,
  selectedStyle,
  onSelectStyle,
  customContext = '',
  onCustomContextChange,
  onOpenFullModal,
}) => {
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  const handleApply = (caption: CaptionSuggestion, index: number) => {
    setAppliedIndex(index);
    onApplyCaption(caption);
    setTimeout(() => {
      setAppliedIndex(null);
    }, 1500);
  };

  const handleStyleClick = (styleId: string) => {
    // App owns the style-change side effect and triggers exactly one generation request.
    // Keeping generation in one place prevents duplicate Gemini calls per click.
    onSelectStyle(styleId);
  };

  return (
    <div className="bg-neutral-900/90 border border-amber-500/30 rounded-3xl p-3.5 sm:p-4 backdrop-blur shadow-xl w-full h-full flex flex-col min-h-0 gap-3">
      {/* Header with Title & Action */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-neutral-950 font-black text-xs shadow-sm">
            ⚡
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Замемить с ИИ</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Gemini
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenFullModal && (
            <button
              onClick={onOpenFullModal}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Открыть во весь экран"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onGenerate()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-neutral-950 hover:brightness-110 active:scale-95 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Анализ...' : 'Еще 5 вариантов'}</span>
          </button>
        </div>
      </div>

      {/* STYLES SELECTOR (SIMPLIFIED COMPACT GRID) */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-neutral-400 font-bold uppercase tracking-wider">
            Стиль юмора:
          </span>
          <span className="text-amber-400 font-medium">
            {AI_STYLES.find((s) => s.id === selectedStyle)?.label || 'Тренды'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 sm:max-h-36 overflow-y-auto pr-0.5 custom-scrollbar text-[11px]">
          {AI_STYLES.map((style) => {
            const Icon = style.icon;
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => handleStyleClick(style.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 text-white font-bold shadow-sm'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
                title={style.desc}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? 'text-amber-400' : 'text-neutral-400'
                  }`}
                />
                <span className="truncate">{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OPTIONAL THEME CONTEXT INPUT */}
      {onCustomContextChange && (
        <div className="relative shrink-0">
          <input
            type="text"
            value={customContext}
            onChange={(e) => onCustomContextChange(e.target.value)}
            placeholder="Укажите тему (например, 'понедельник', 'сессия', 'деплой')..."
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/80 transition"
          />
        </div>
      )}

      {/* MAIN CONTENT AREA: Stretches all the way down */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3 animate-pulse">
            <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-amber-300 font-bold">
              ИИ изучает детали, настроение и противоречия на фото...
            </p>
            <p className="text-[11px] text-neutral-400">
              Подбираем 5 свежих вирусных панчлайнов
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {captions.length === 0 && !isLoading && (
          <div className="flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 text-center">
            <div className="space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/25 shadow-inner">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Генератор мемов Gemini
                </h4>
                <p className="text-[11px] text-neutral-300 max-w-xs mx-auto leading-relaxed">
                  Нажмите <strong className="text-amber-400 font-semibold">«Еще 5 вариантов»</strong>, чтобы Gemini нашел забавные детали на картинке и придумал остроумные подписи.
                </p>
              </div>

              {/* Quick Topic Prompts */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  Быстрые темы:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['Понедельник', 'Сессия', 'Работа / IT', 'Зарплата', 'Отношения', 'Кот'].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        onCustomContextChange?.(topic);
                        onGenerate();
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-300 transition cursor-pointer"
                    >
                      #{topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onGenerate()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-400 text-neutral-950 hover:bg-amber-300 active:scale-98 transition cursor-pointer shadow-md flex items-center justify-center gap-2 mt-2 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Сгенерировать мемы</span>
            </button>
          </div>
        )}

        {/* 5 AI MEME CAPTION CARDS */}
        {captions.length > 0 && !isLoading && (
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 px-0.5 shrink-0">
              <span>5 вариантов подписей от ИИ:</span>
              <span className="text-amber-400 font-bold">Клик для применения</span>
            </div>

            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1 custom-scrollbar">

          {captions.map((caption, idx) => {
            const isApplied = appliedIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => handleApply(caption, idx)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-left space-y-1.5 relative group ${
                  isApplied
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-lg'
                    : 'border-neutral-800 bg-neutral-950/70 hover:border-amber-400/60 hover:bg-neutral-950'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 uppercase tracking-wider">
                      Вариант #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">
                      {caption.headline || 'Панчлайн'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      isApplied
                        ? 'bg-emerald-400 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-200 group-hover:bg-amber-400 group-hover:text-neutral-950'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Наложено!</span>
                      </>
                    ) : (
                      <span>Выбрать</span>
                    )}
                  </button>
                </div>

                {/* Top and Bottom lines preview */}
                <div className="space-y-1 text-xs">
                  {caption.topText && (
                    <div className="flex items-start gap-1 bg-neutral-900/80 px-2 py-1 rounded-lg border border-neutral-800/60">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase shrink-0 pt-0.5">
                        Верх:
                      </span>
                      <span className="font-semibold text-neutral-100 line-clamp-2">
                        "{caption.topText}"
                      </span>
                    </div>
                  )}

                  {caption.bottomText && (
                    <div className="flex items-start gap-1 bg-neutral-900/80 px-2 py-1 rounded-lg border border-neutral-800/60">
                      <span className="text-[9px] font-bold text-amber-400 uppercase shrink-0 pt-0.5">
                        Низ:
                      </span>
                      <span className="font-semibold text-amber-300 line-clamp-2">
                        "{caption.bottomText}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Insight Badges: Mechanic & Visual Details */}
                <div className="flex flex-wrap items-center gap-1 text-[10px] pt-0.5">
                  {caption.humorMechanic && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium shrink-0">
                      🎯 {caption.humorMechanic}
                    </span>
                  )}
                  {caption.spottedDetail && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/25 line-clamp-1">
                      🔍 {caption.spottedDetail}
                    </span>
                  )}
                  {caption.visualContradiction && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 line-clamp-1">
                      ⚡ {caption.visualContradiction}
                    </span>
                  )}
                  {!caption.visualContradiction && caption.detectedMood && (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 line-clamp-1">
                      🎭 {caption.detectedMood}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
