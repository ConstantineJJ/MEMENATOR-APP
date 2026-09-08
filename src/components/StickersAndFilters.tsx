import React, { useState } from 'react';
import { MemeSticker, MemeFilter, MemeStickerType } from '../types';
import { STICKER_COLLECTION, StickerDefinition } from '../data/stickers';
import { Smile, SlidersHorizontal, Trash2 } from 'lucide-react';

interface StickersAndFiltersProps {
  filter: MemeFilter;
  filterIntensity?: number;
  onSelectFilter: (filter: MemeFilter) => void;
  onChangeFilterIntensity?: (val: number) => void;
  stickers: MemeSticker[];
  onAddSticker: (
    type: MemeStickerType,
    label: string,
    emoji?: string,
    stickerId?: string
  ) => void;
  onClearStickers: () => void;
  watermark: boolean;
  onToggleWatermark: (val: boolean) => void;
}

const FILTERS: { id: MemeFilter; label: string; icon: string; desc: string }[] = [
  { id: 'none', label: 'Оригинал', icon: '✨', desc: 'Без коррекции' },
  { id: 'deepfry', label: 'Deep Fry', icon: '🔥', desc: 'Ультра-сочность' },
  { id: 'vhs', label: 'VHS 90s', icon: '📼', desc: 'Теплый ретро' },
  { id: 'vintage', label: 'Винтаж', icon: '📜', desc: 'Сепия 35мм' },
  { id: 'grayscale', label: 'Ч/Б Нуар', icon: '🖤', desc: 'Монохром' },
  { id: 'contrast', label: 'Контраст', icon: '⚡', desc: 'Четкие тени' },
  { id: 'warm', label: 'Теплый', icon: '🌅', desc: 'Золотой час' },
  { id: 'dramatic', label: 'Драма', icon: '🎬', desc: 'Кино' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌌', desc: 'Неон и фиолет' },
  { id: 'vivid', label: 'Vivid Pop', icon: '🌈', desc: 'Яркие цвета' },
  { id: 'toxic', label: 'Toxic', icon: '☣️', desc: 'Кислота' },
  { id: 'vignette', label: 'Виньетка', icon: '🌑', desc: 'Затемнение' },
];

type StickerCategory = 'all' | 'mascot' | 'accessories' | 'badges' | 'characters' | 'reactions';

export const StickersAndFilters: React.FC<StickersAndFiltersProps> = ({
  filter,
  filterIntensity = 100,
  onSelectFilter,
  onChangeFilterIntensity,
  stickers,
  onAddSticker,
  onClearStickers,
  watermark,
  onToggleWatermark,
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'stickers'>('filters');
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('all');
  const [intensities, setIntensities] = useState<Record<MemeFilter, number>>({
    none: 100,
    deepfry: 100,
    vhs: 100,
    vintage: 100,
    grayscale: 100,
    contrast: 100,
    warm: 100,
    dramatic: 100,
    cyberpunk: 100,
    vivid: 100,
    toxic: 100,
    vignette: 100,
  });

  const handleIntensityChange = (filterId: MemeFilter, val: number, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIntensities((prev) => ({ ...prev, [filterId]: val }));
    if (filter !== filterId) {
      onSelectFilter(filterId);
    }
    onChangeFilterIntensity?.(val);
  };

  const handleFilterClick = (filterId: MemeFilter) => {
    onSelectFilter(filterId);
    const currentVal = intensities[filterId] ?? 100;
    onChangeFilterIntensity?.(currentVal);
  };

  const filteredStickers =
    activeCategory === 'all'
      ? STICKER_COLLECTION
      : STICKER_COLLECTION.filter((s) => s.category === activeCategory);

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/30 rounded-2xl p-2.5 sm:p-3 backdrop-blur shadow-md w-full h-full flex flex-col justify-between overflow-hidden min-h-0">
      {/* Top Segmented Control: Filters vs Stickers + Watermark */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 mb-1.5">
        <div className="flex items-center gap-1 p-0.5 bg-neutral-950/90 rounded-xl border border-neutral-800 flex-1">
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'filters'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Фильтры</span>
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer relative ${
              activeTab === 'stickers'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smile className="w-3 h-3" />
            <span>Наклейки</span>
            {stickers.length > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
                {stickers.length}
              </span>
            )}
          </button>
        </div>

        {/* Watermark toggle */}
        <label
          htmlFor="watermark-toggle-compact"
          className="flex items-center gap-1 cursor-pointer select-none text-[9.5px] text-neutral-400 hover:text-neutral-200 shrink-0 px-2 py-1 bg-neutral-950/60 rounded-xl border border-neutral-800/80"
          title="Включить водяной знак на готовом меме"
        >
          <input
            id="watermark-toggle-compact"
            type="checkbox"
            checked={watermark}
            onChange={(e) => onToggleWatermark(e.target.checked)}
            className="w-3 h-3 rounded border-neutral-700 bg-neutral-900 text-rose-500 focus:ring-0 cursor-pointer"
          />
          <span>🍉 Водяной знак</span>
        </label>
      </div>

      {/* ================= TAB 1: FILTERS ================= */}
      {activeTab === 'filters' && (
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar items-stretch content-start">
            {FILTERS.map((f) => {
              const isSelected = filter === f.id;
              const intensityVal = isSelected ? (filterIntensity ?? intensities[f.id] ?? 100) : (intensities[f.id] ?? 100);
              return (
                <div
                  key={f.id}
                  onClick={() => handleFilterClick(f.id)}
                  className={`p-2 rounded-xl text-[10px] font-semibold border transition cursor-pointer flex flex-col justify-between gap-1.5 relative select-none ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40 shadow-sm shadow-rose-500/10'
                      : 'border-neutral-800 bg-neutral-950/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/60'
                  }`}
                  title={`${f.label} — ${f.desc}`}
                >
                  {/* Top: Large Icon + Title & Desc */}
                  <div className="flex items-center gap-2">
                    {/* Enlarged Filter Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-2xl transition-transform ${
                      isSelected
                        ? 'bg-rose-500/25 border border-rose-500/50 scale-105 shadow-inner'
                        : 'bg-neutral-900/90 border border-neutral-800 group-hover:scale-105'
                    }`}>
                      <span className="drop-shadow-sm">{f.icon}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate font-bold text-[11px] leading-tight text-white">{f.label}</p>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)] shrink-0" />
                        )}
                      </div>
                      <p className="text-[8.5px] text-neutral-400 truncate">{f.desc}</p>
                    </div>
                  </div>

                  {/* Bottom: Intensity Bar (Полоска интенсивности) */}
                  <div
                    className="w-full bg-neutral-900/90 border border-neutral-800/80 rounded-lg p-1 px-1.5 flex flex-col gap-0.5 mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between text-[8px] font-bold text-neutral-400">
                      <span>Интенсивность</span>
                      <span className={`font-mono text-[8.5px] ${isSelected ? 'text-rose-400 font-black' : 'text-neutral-400'}`}>
                        {f.id === 'none' ? '—' : `${intensityVal}%`}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      disabled={f.id === 'none'}
                      value={f.id === 'none' ? 100 : intensityVal}
                      onChange={(e) => handleIntensityChange(f.id, parseInt(e.target.value, 10), e)}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition ${
                        f.id === 'none'
                          ? 'bg-neutral-800 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'accent-rose-500 bg-rose-950/60'
                          : 'accent-neutral-400 bg-neutral-800 hover:accent-rose-400'
                      }`}
                      title={`Интенсивность фильтра «${f.label}»: ${intensityVal}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: STICKERS ================= */}
      {activeTab === 'stickers' && (
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          {/* Categories bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[9.5px] shrink-0 mb-1">
            {[
              { id: 'all', label: 'Все' },
              { id: 'mascot', label: '🍉 Маскот' },
              { id: 'accessories', label: '🕶️ Арт & Акс' },
              { id: 'badges', label: '🏷️ Штампы' },
              { id: 'characters', label: '🐸 Герои' },
              { id: 'reactions', label: '🔥 Эмодзи' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as StickerCategory)}
                className={`px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-white font-bold shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar items-center">
            {filteredStickers.map((stk: StickerDefinition) => (
              <button
                key={stk.id}
                onClick={() => onAddSticker(stk.type, stk.label, stk.emoji, stk.id)}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-emerald-400 hover:bg-emerald-500/10 transition group cursor-pointer active:scale-90"
                title={`Добавить наклейку «${stk.label}»`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {stk.id === 'watermelon-boss' ? (
                    <span className="text-lg">🍉</span>
                  ) : stk.type === 'stamp' ? (
                    <span className="text-[7.5px] font-black font-mono border border-emerald-400 text-emerald-400 px-1 rounded bg-black/40">
                      {stk.badgeText?.slice(0, 5) || 'OK'}
                    </span>
                  ) : (
                    <span className="text-base group-hover:scale-115 transition-transform">
                      {stk.emoji || '📌'}
                    </span>
                  )}
                </div>
                <span className="text-[8px] text-neutral-400 group-hover:text-emerald-300 truncate w-full text-center mt-0.5 font-medium">
                  {stk.label}
                </span>
              </button>
            ))}
          </div>

          {stickers.length > 0 && (
            <div className="pt-1 flex items-center justify-between text-[9px] shrink-0 border-t border-neutral-800/60 mt-1">
              <span className="text-neutral-400">На холсте: {stickers.length}</span>
              <button
                onClick={onClearStickers}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold cursor-pointer"
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
