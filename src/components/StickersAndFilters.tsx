import React, { useState } from 'react';
import { MemeSticker, MemeFilter } from '../types';
import { Smile, SlidersHorizontal, Sparkles, Trash2, Check, ShieldCheck } from 'lucide-react';

interface StickersAndFiltersProps {
  filter: MemeFilter;
  onSelectFilter: (filter: MemeFilter) => void;
  stickers: MemeSticker[];
  onAddSticker: (type: 'emoji' | 'sunglasses' | 'laser-eyes' | 'badge', label: string, emoji?: string) => void;
  onClearStickers: () => void;
  watermark: boolean;
  onToggleWatermark: (val: boolean) => void;
}

const FILTERS: { id: MemeFilter; label: string; icon: string }[] = [
  { id: 'none', label: 'Оригинал', icon: '✨' },
  { id: 'deepfry', label: 'Прожарка', icon: '🔥' },
  { id: 'vignette', label: 'Виньетка', icon: '🎬' },
  { id: 'dramatic', label: 'Холод нуар', icon: '❄️' },
  { id: 'contrast', label: 'Контраст', icon: '⚡' },
  { id: 'grayscale', label: 'Ч/Б', icon: '🖤' },
  { id: 'vintage', label: 'Сепия', icon: '📜' },
  { id: 'warm', label: 'Теплый', icon: '☀️' },
];

type StickerCategory = 'all' | 'effects' | 'badges' | 'reactions';

const STICKER_PRESETS: {
  type: 'emoji' | 'sunglasses' | 'laser-eyes' | 'badge';
  label: string;
  emoji?: string;
  category: 'effects' | 'reactions' | 'badges';
}[] = [
  // Effects
  { type: 'sunglasses', label: 'Очки Thug', emoji: '🕶️', category: 'effects' },
  { type: 'laser-eyes', label: 'Лазер-глаза', emoji: '🔴', category: 'effects' },
  { type: 'emoji', label: 'Корона', emoji: '👑', category: 'effects' },
  { type: 'emoji', label: 'Шляпа', emoji: '🕵️', category: 'effects' },
  { type: 'emoji', label: 'Цепь', emoji: '⛓️', category: 'effects' },
  { type: 'emoji', label: 'Нимб', emoji: '😇', category: 'effects' },
  { type: 'emoji', label: 'Рога', emoji: '😈', category: 'effects' },

  // Badges & Stamps
  { type: 'badge', label: 'BRUH', emoji: '🛑', category: 'badges' },
  { type: 'badge', label: 'БАЗА', emoji: '💎', category: 'badges' },
  { type: 'badge', label: 'КРИНЖ', emoji: '😬', category: 'badges' },
  { type: 'badge', label: 'WTF?!', emoji: '❓', category: 'badges' },
  { type: 'badge', label: 'FAIL', emoji: '❌', category: 'badges' },
  { type: 'badge', label: 'APPROVED', emoji: '✅', category: 'badges' },
  { type: 'badge', label: 'СКАМ', emoji: '⚠️', category: 'badges' },
  { type: 'badge', label: 'W', emoji: '🏆', category: 'badges' },
  { type: 'badge', label: 'L', emoji: '📉', category: 'badges' },

  // Reactions
  { type: 'emoji', label: 'Череп', emoji: '💀', category: 'reactions' },
  { type: 'emoji', label: 'Огонь', emoji: '🔥', category: 'reactions' },
  { type: 'emoji', label: 'Клоун', emoji: '🤡', category: 'reactions' },
  { type: 'emoji', label: 'Сигма', emoji: '🗿', category: 'reactions' },
  { type: 'emoji', label: 'До слез', emoji: '😂', category: 'reactions' },
  { type: 'emoji', label: '100%', emoji: '💯', category: 'reactions' },
  { type: 'emoji', label: 'Взрыв', emoji: '🤯', category: 'reactions' },
  { type: 'emoji', label: 'Думает', emoji: '🤔', category: 'reactions' },
  { type: 'emoji', label: 'Фейспалм', emoji: '🤦', category: 'reactions' },
  { type: 'emoji', label: 'Взгляд', emoji: '👀', category: 'reactions' },
  { type: 'emoji', label: 'Рыдает', emoji: '😭', category: 'reactions' },
  { type: 'emoji', label: 'Пот', emoji: '😰', category: 'reactions' },
  { type: 'emoji', label: 'Шок', emoji: '😱', category: 'reactions' },
  { type: 'emoji', label: 'Деньги', emoji: '💸', category: 'reactions' },
];

export const StickersAndFilters: React.FC<StickersAndFiltersProps> = ({
  filter,
  onSelectFilter,
  stickers,
  onAddSticker,
  onClearStickers,
  watermark,
  onToggleWatermark,
}) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'filters'>('filters');
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('all');

  const filteredStickers =
    activeCategory === 'all'
      ? STICKER_PRESETS
      : STICKER_PRESETS.filter((s) => s.category === activeCategory);

  return (
    <div className="bg-neutral-900/85 border border-neutral-800/90 rounded-3xl p-3.5 sm:p-4 backdrop-blur shadow-lg w-full h-full flex flex-col justify-between min-h-0 gap-2.5">
      {/* Top Segmented Control: Filters vs Stickers */}
      <div className="flex items-center justify-between gap-1.5 p-1 bg-neutral-950/80 rounded-2xl border border-neutral-800 shrink-0">
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'filters'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Фильтры</span>
        </button>
        <button
          onClick={() => setActiveTab('stickers')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            activeTab === 'stickers'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Стикеры</span>
          {stickers.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
              {stickers.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: FILTERS */}
      {activeTab === 'filters' && (
        <div className="flex-1 min-h-0 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Цветовой тон мема
            </span>
            {filter !== 'none' && (
              <button
                onClick={() => onSelectFilter('none')}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer font-medium"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1 items-stretch py-0.5">
            {FILTERS.map((f) => {
              const isSelected = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFilter(f.id)}
                  className={`py-2 sm:py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-sm ring-1 ring-amber-400/40'
                      : 'border-neutral-800/80 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <span className="text-base shrink-0">{f.icon}</span>
                  <span className="truncate text-left">{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Watermark toggle */}
          <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-xs shrink-0">
            <label
              htmlFor="watermark-toggle"
              className="flex items-center gap-2 cursor-pointer select-none text-neutral-300"
            >
              <input
                id="watermark-toggle"
                type="checkbox"
                checked={watermark}
                onChange={(e) => onToggleWatermark(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Водяной знак «⚡ Memenator»</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: STICKERS */}
      {activeTab === 'stickers' && (
        <div className="flex-1 min-h-0 flex flex-col space-y-2">
          {/* Categories Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] shrink-0">
            {[
              { id: 'all', label: 'Все' },
              { id: 'effects', label: 'Эффекты' },
              { id: 'badges', label: 'Плашки' },
              { id: 'reactions', label: 'Реакции' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as StickerCategory)}
                className={`px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
            {filteredStickers.map((stk, idx) => (
              <button
                key={idx}
                onClick={() => onAddSticker(stk.type, stk.label, stk.emoji)}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 hover:border-amber-400/80 hover:bg-amber-400/10 transition group cursor-pointer active:scale-90"
                title={`Добавить ${stk.label}`}
              >
                <span className="text-xl group-hover:scale-115 transition-transform">
                  {stk.emoji || '📌'}
                </span>
                <span className="text-[9px] text-neutral-400 group-hover:text-amber-300 truncate w-full text-center mt-0.5">
                  {stk.label}
                </span>
              </button>
            ))}
          </div>

          {/* Active Stickers Counter & Clear */}
          {stickers.length > 0 && (
            <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] shrink-0">
              <span className="text-neutral-400">На холсте: {stickers.length}</span>
              <button
                onClick={onClearStickers}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Очистить все</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
