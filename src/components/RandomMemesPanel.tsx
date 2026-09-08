import React, { useState, useEffect } from 'react';
import { WebMemeItem } from '../types';
import {
  getShownWebMemeExcludes,
  recordShownWebMemes,
  toggleFavoriteWebTemplate,
  getFavorites,
} from '../utils/memeStorage';
import { Dices, Search, Check, Star, X } from 'lucide-react';

interface RandomMemesPanelProps {
  onSelectWebTemplate: (item: WebMemeItem) => void;
  selectedUrl: string;
  onShowToast: (msg: string) => void;
  historyRefreshTrigger?: number;
}

export const RandomMemesPanel: React.FC<RandomMemesPanelProps> = ({
  onSelectWebTemplate,
  selectedUrl,
  onShowToast,
  historyRefreshTrigger = 0,
}) => {
  const [webItems, setWebItems] = useState<WebMemeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesIds, setFavoritesIds] = useState<string[]>([]);

  // Update favorite IDs
  const refreshFavs = () => {
    const favs = getFavorites();
    setFavoritesIds(favs.map((f) => f.id));
  };

  useEffect(() => {
    refreshFavs();
  }, [historyRefreshTrigger]);

  // Fetch memes from multi-source aggregator
  const fetchRandomMemes = async (query = '', isManualDice = false) => {
    setIsLoading(true);
    if (isManualDice) setIsRollingDice(true);
    setError(null);

    try {
      const excludes = getShownWebMemeExcludes();
      const params = new URLSearchParams();
      params.set('limit', '6');
      if (query.trim()) params.set('query', query.trim());

      if (excludes.excludeIds.length > 0) {
        params.set('excludeIds', excludes.excludeIds.slice(-60).join(','));
      }
      if (excludes.excludeHashes.length > 0) {
        params.set('excludeHashes', excludes.excludeHashes.slice(-60).join(','));
      }

      const res = await fetch(`/api/feed/web-memes?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Не удалось загрузить мемы');
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setWebItems(data.items);
        recordShownWebMemes(data.items);
        if (isManualDice) {
          onShowToast('🎲 Новая случайная подборка загружена!');
        }
      } else {
        setWebItems([]);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки мемов');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsRollingDice(false), 500);
    }
  };

  useEffect(() => {
    fetchRandomMemes();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRandomMemes(searchQuery, true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchRandomMemes('', true);
  };

  const handleToggleFav = (e: React.MouseEvent, item: WebMemeItem) => {
    e.stopPropagation();
    const isFav = toggleFavoriteWebTemplate(item);
    refreshFavs();
    onShowToast(isFav ? '⭐ Шаблон добавлен в избранное' : 'Удалено из избранного');
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 hover:border-rose-500/30 rounded-2xl p-2.5 sm:p-3 backdrop-blur shadow-md w-full h-full flex flex-col justify-between overflow-hidden min-h-0">
      {/* Header: Title & Dice Button */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black tracking-wide text-white uppercase font-['Anton',sans-serif]">
            СЛУЧАЙНЫЕ МЕМЫ
          </span>
          <span className="px-1.5 py-0.2 rounded-md text-[8.5px] font-black bg-rose-500 text-white uppercase shadow-sm">
            LIVE
          </span>
        </div>

        {/* Dice Button (Игральная кость) */}
        <button
          onClick={() => fetchRandomMemes(searchQuery, true)}
          disabled={isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-neutral-950 shadow-md shadow-rose-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
          title="Бросить кости: получить новую подборку"
        >
          <Dices
            className={`w-3.5 h-3.5 transition-transform duration-500 ${
              isRollingDice || isLoading ? 'animate-spin rotate-180' : ''
            }`}
          />
          <span>{isLoading ? 'Бросок...' : 'Случайные'}</span>
        </button>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative shrink-0 mb-1.5">
        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск мемов по названию..."
          className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-xl pl-7 pr-14 py-1 text-[11px] text-neutral-200 placeholder:text-neutral-500 focus:outline-none transition shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-11 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5 cursor-pointer"
            title="Очистить"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[9px] font-bold bg-neutral-800 hover:bg-rose-500 hover:text-white text-neutral-200 rounded-lg transition cursor-pointer"
        >
          Найти
        </button>
      </form>

      {/* Memes List / Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar">
        {error ? (
          <div className="text-center py-2 text-[10px] text-rose-400 bg-rose-950/20 rounded-xl border border-rose-900/40 p-2">
            <span>{error}</span>
            <button
              onClick={() => fetchRandomMemes(searchQuery, true)}
              className="block mx-auto mt-1 text-rose-300 underline cursor-pointer font-bold"
            >
              🎲 Бросить кости снова
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 h-full items-stretch">
            {webItems.map((item) => {
              const isSelected = selectedUrl === item.imageUrl;
              const isFav = favoritesIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectWebTemplate(item);
                    onShowToast(`Мем «${item.title}» загружен!`);
                  }}
                  className={`group relative flex flex-col justify-between rounded-xl overflow-hidden border transition-all cursor-pointer bg-neutral-950/90 p-1.5 ${
                    isSelected
                      ? 'border-rose-500 ring-1 ring-rose-500/50 bg-neutral-900'
                      : 'border-neutral-800/90 hover:border-rose-500/60 hover:bg-neutral-900'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 mb-1 border border-neutral-800/80 shrink-0">
                    <img
                      src={item.thumbnailUrl || item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0.5 left-1 bg-black/85 text-[7px] text-rose-300 px-1 py-0.2 rounded font-mono uppercase">
                      {item.provider}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-[9.5px] font-bold text-neutral-100 group-hover:text-rose-300 transition line-clamp-1 mb-1 leading-tight">
                    {item.title}
                  </h4>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-0.5 border-t border-neutral-800/60 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWebTemplate(item);
                        onShowToast(`Мем «${item.title}» загружен!`);
                      }}
                      className={`flex-1 text-[8px] font-bold py-0.5 rounded transition cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white'
                          : 'bg-neutral-800 text-neutral-300 group-hover:bg-rose-500 group-hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Выбран ✓' : 'Выбрать'}
                    </button>

                    <button
                      onClick={(e) => handleToggleFav(e, item)}
                      className={`p-1 rounded transition cursor-pointer ${
                        isFav
                          ? 'text-amber-400 bg-amber-400/20'
                          : 'text-neutral-500 hover:text-amber-300 hover:bg-neutral-800'
                      }`}
                      title={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      <Star className={`w-2.5 h-2.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
