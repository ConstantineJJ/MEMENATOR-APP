import React, { useMemo, useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  Layers,
  Smile,
  Glasses,
  Stamp,
  MessageSquare,
  Flame,
  Plus,
} from 'lucide-react';
import { STICKER_COLLECTION, StickerCategory, StickerDefinition } from '../data/stickers';
import { StickerSvg } from '../utils/stickerSvgs';

interface StickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSticker: (definition: StickerDefinition) => void;
  onShowToast: (message: string) => void;
}

const CATEGORY_ITEMS: { id: StickerCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Все стикеры', icon: <Layers className="w-4 h-4" /> },
  { id: 'heroes', label: 'Герои мемов', icon: <Smile className="w-4 h-4 text-amber-400" /> },
  { id: 'accessories', label: 'Аксессуары', icon: <Glasses className="w-4 h-4 text-sky-400" /> },
  { id: 'badges', label: 'Штампы & База', icon: <Stamp className="w-4 h-4 text-emerald-400" /> },
  { id: 'bubbles', label: 'Реплики', icon: <MessageSquare className="w-4 h-4 text-violet-400" /> },
  { id: 'reactions', label: 'Реакции', icon: <Flame className="w-4 h-4 text-rose-400" /> },
];

export const StickerModal: React.FC<StickerModalProps> = ({
  isOpen,
  onClose,
  onAddSticker,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StickerCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStickers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return STICKER_COLLECTION.filter((sticker) => {
      if (selectedCategory !== 'all' && sticker.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      const matchLabel = sticker.label.toLowerCase().includes(query);
      const matchTags = sticker.tags.some((t) => t.toLowerCase().includes(query));
      const matchBadge = sticker.badgeText?.toLowerCase().includes(query) ?? false;
      return matchLabel || matchTags || matchBadge;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between gap-3 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-neutral-950 font-black shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                Каталог мемных стикеров
              </h2>
              <p className="text-xs text-neutral-400">
                100% прозрачные без белого фона • Популярные герои и атрибуты
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Categories */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/30 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск стикеров (Пепе, Доге, Гигачад, Wasted, очки, база...)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_ITEMS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800/80'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stickers Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {filteredStickers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-center">
              <Smile className="w-12 h-12 stroke-[1.5] mb-2 opacity-30" />
              <p className="text-sm">Ничего не найдено по запросу «{searchQuery}»</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-xs text-amber-400 hover:underline"
              >
                Сбросить поиск
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredStickers.map((def) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => {
                    onAddSticker(def);
                    onShowToast(`Стикер «${def.label}» добавлен на мем!`);
                  }}
                  className="group p-3 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800/90 border border-neutral-800/90 hover:border-amber-400/70 transition-all flex flex-col items-center justify-between text-center cursor-pointer shadow-sm hover:scale-[1.03]"
                >
                  {/* Transparent checkered tile */}
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition group-hover:scale-110 mb-2"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, rgba(255,255,255,0.035) 25%, transparent 25%), 
                        linear-gradient(-45deg, rgba(255,255,255,0.035) 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.035) 75%), 
                        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.035) 75%)
                      `,
                      backgroundSize: '14px 14px',
                      backgroundPosition: '0 0, 0 7px, 7px -7px, -7px 0px',
                    }}
                  >
                    {def.emoji && def.type === 'emoji' ? (
                      <span className="text-3xl select-none">{def.emoji}</span>
                    ) : (
                      <StickerSvg stickerId={def.id} className="w-12 h-12" badgeText={def.badgeText} />
                    )}
                  </div>

                  <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-400 truncate w-full mb-1">
                    {def.label}
                  </span>

                  <span className="text-[10px] font-medium text-neutral-500 group-hover:text-neutral-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Добавить
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Стикер можно масштабировать и вращать прямо на холсте</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
