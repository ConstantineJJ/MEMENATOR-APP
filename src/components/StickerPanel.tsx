import React, { useMemo, useState } from 'react';
import {
  Layers,
  Search,
  Trash2,
  Maximize2,
  Sparkles,
  Glasses,
  Smile,
  Stamp,
  MessageSquare,
  Flame,
  RotateCcw,
  RotateCw,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import { STICKER_COLLECTION, StickerCategory, StickerDefinition } from '../data/stickers';
import { MemeSticker } from '../types';
import { StickerSvg } from '../utils/stickerSvgs';

interface StickerPanelProps {
  stickers: MemeSticker[];
  onAddSticker: (definition: StickerDefinition) => void;
  onClearStickers: () => void;
  onUpdateStickerScale: (id: string, scale: number) => void;
  onUpdateStickerRotation: (id: string, rotation: number) => void;
  onDeleteSticker: (id: string) => void;
  onShowToast: (message: string) => void;
  onOpenModal?: () => void;
}

const CATEGORY_ITEMS: { id: StickerCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Все', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'heroes', label: 'Герои мемов', icon: <Smile className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'accessories', label: 'Аксессуары', icon: <Glasses className="w-3.5 h-3.5 text-sky-400" /> },
  { id: 'badges', label: 'Штампы & База', icon: <Stamp className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: 'bubbles', label: 'Реплики', icon: <MessageSquare className="w-3.5 h-3.5 text-violet-400" /> },
  { id: 'reactions', label: 'Реакции', icon: <Flame className="w-3.5 h-3.5 text-rose-400" /> },
];

export const StickerPanel: React.FC<StickerPanelProps> = ({
  stickers,
  onAddSticker,
  onClearStickers,
  onUpdateStickerScale,
  onUpdateStickerRotation,
  onDeleteSticker,
  onShowToast,
  onOpenModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StickerCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'active'>('catalog');

  const filteredStickers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return STICKER_COLLECTION.filter((sticker) => {
      // Category check
      if (selectedCategory !== 'all' && sticker.category !== selectedCategory) {
        return false;
      }
      // Search query check
      if (!query) return true;
      const matchLabel = sticker.label.toLowerCase().includes(query);
      const matchTags = sticker.tags.some((t) => t.toLowerCase().includes(query));
      const matchBadge = sticker.badgeText?.toLowerCase().includes(query) ?? false;
      return matchLabel || matchTags || matchBadge;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="h-full min-h-0 flex flex-col bg-neutral-900/80 border border-neutral-800/80 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      {/* Panel Header */}
      <header className="p-2.5 sm:p-3 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-neutral-950 shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5 font-black" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-200 truncate">
              Стикеры и герои
            </h2>
            <p className="text-[10px] text-neutral-400 truncate">
              Прозрачные без фона • Герои мемов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {stickers.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'active' ? 'catalog' : 'active')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                activeTab === 'active'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-amber-400 hover:bg-neutral-700'
              }`}
              title="Показать активные стикеры на холсте"
            >
              <span>На холсте: {stickers.length}</span>
            </button>
          )}

          {stickers.length > 0 && (
            <button
              type="button"
              onClick={onClearStickers}
              className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition"
              title="Очистить все стикеры с холста"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
              title="Развернуть каталог стикеров"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Mode / Tabs if stickers are active */}
      {stickers.length > 0 && (
        <div className="px-2.5 pt-2 flex items-center gap-1 bg-neutral-950/40 border-b border-neutral-800/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-t transition border-b-2 ${
              activeTab === 'catalog'
                ? 'border-amber-400 text-amber-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Каталог ({STICKER_COLLECTION.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-t transition border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'active'
                ? 'border-amber-400 text-amber-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>На холсте</span>
            <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[10px] flex items-center justify-center">
              {stickers.length}
            </span>
          </button>
        </div>
      )}

      {/* MAIN VIEW: Catalog or Active list */}
      {activeTab === 'active' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2">
          <div className="text-[11px] text-neutral-400 flex items-center justify-between pb-1 border-b border-neutral-800/60">
            <span>Размещенные стикеры</span>
            <span className="text-[10px] text-neutral-500">Перетаскивайте на холсте</span>
          </div>

          <div className="space-y-2">
            {stickers.map((st) => (
              <div
                key={st.id}
                className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex flex-col gap-2"
              >
                {/* Main row: Thumbnail, label, scale and delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-800 overflow-hidden">
                      <div
                        style={{
                          transform: `rotate(${st.rotation || 0}deg)`,
                          transition: 'transform 0.1s ease-out',
                        }}
                        className="flex items-center justify-center"
                      >
                        {st.emoji && st.type === 'emoji' ? (
                          <span className="text-xl select-none">{st.emoji}</span>
                        ) : (
                          <StickerSvg stickerId={st.stickerId || st.type} className="w-7 h-7" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-200 truncate">
                        {st.label}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {Math.round((st.scale || 1) * 100)}% • {st.rotation || 0}°
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateStickerScale(st.id, Math.max(0.4, (st.scale || 1) - 0.15))}
                      className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center text-xs transition"
                      title="Уменьшить масштаб"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStickerScale(st.id, Math.min(3.0, (st.scale || 1) + 0.15))}
                      className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center text-xs transition"
                      title="Увеличить масштаб"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSticker(st.id)}
                      className="w-6 h-6 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition ml-1"
                      title="Удалить с холста"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Rotation controls row */}
                <div className="pt-1.5 border-t border-neutral-800/60 flex items-center justify-between gap-1.5 text-neutral-400">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        let next = (st.rotation || 0) - 15;
                        if (next < -180) next += 360;
                        onUpdateStickerRotation(st.id, next);
                      }}
                      className="w-5 h-5 rounded bg-neutral-800/80 hover:bg-neutral-700 hover:text-amber-400 flex items-center justify-center transition"
                      title="Повернуть против часовой стрелки (-15°)"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        let next = (st.rotation || 0) + 15;
                        if (next > 180) next -= 360;
                        onUpdateStickerRotation(st.id, next);
                      }}
                      className="w-5 h-5 rounded bg-neutral-800/80 hover:bg-neutral-700 hover:text-amber-400 flex items-center justify-center transition"
                      title="Повернуть по часовой стрелке (+15°)"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Range Slider for Angle */}
                  <div className="flex-1 flex items-center gap-1.5 min-w-0 px-1">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="5"
                      value={st.rotation || 0}
                      onChange={(e) => onUpdateStickerRotation(st.id, Number(e.target.value))}
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
                      title="Угол наклона (-180° до +180°)"
                    />
                  </div>

                  {/* Angle value & quick reset */}
                  <button
                    type="button"
                    onClick={() => onUpdateStickerRotation(st.id, 0)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition shrink-0 ${
                      (st.rotation || 0) !== 0
                        ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="Сбросить угол на 0°"
                  >
                    {st.rotation || 0}°
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition mt-3"
          >
            + Добавить еще стикер
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-2 pb-1.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск: Пепе, Доге, Гигачад, Wasted..."
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/80 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="px-2 pb-2 shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CATEGORY_ITEMS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition flex items-center gap-1 shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 border border-neutral-800/60'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Stickers Grid with Transparent Checkered Background Pattern */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
            {filteredStickers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center text-neutral-500">
                <Smile className="w-8 h-8 stroke-[1.5] mb-2 opacity-40" />
                <p className="text-xs">Стикеры не найдены</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 text-[11px] text-amber-400 hover:underline"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {filteredStickers.map((def) => {
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => {
                        onAddSticker(def);
                        onShowToast(`Стикер «${def.label}» добавлен!`);
                      }}
                      className="group relative p-2 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/90 border border-neutral-800/80 hover:border-amber-400/60 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer overflow-hidden shadow-sm hover:scale-[1.03]"
                      title={`Добавить ${def.label} на мем`}
                    >
                      {/* Checkered pattern box to showcase true transparency */}
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center relative overflow-hidden transition group-hover:scale-110"
                        style={{
                          backgroundImage: `
                            linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), 
                            linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%), 
                            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)
                          `,
                          backgroundSize: '12px 12px',
                          backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                        }}
                      >
                        {def.emoji && def.type === 'emoji' ? (
                          <span className="text-2xl select-none transition-transform group-hover:scale-115">
                            {def.emoji}
                          </span>
                        ) : (
                          <StickerSvg
                            stickerId={def.id}
                            className="w-10 h-10 transition-transform group-hover:scale-115"
                            badgeText={def.badgeText}
                          />
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-neutral-300 group-hover:text-amber-400 leading-tight truncate w-full">
                        {def.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info / Tip */}
      <footer className="px-3 py-1.5 border-t border-neutral-800/60 bg-neutral-950/40 shrink-0 flex items-center justify-between text-[10px] text-neutral-500">
        <span>Клик — добавить на холст</span>
        <span className="text-neutral-400 font-medium">Без белого фона</span>
      </footer>
    </section>
  );
};
