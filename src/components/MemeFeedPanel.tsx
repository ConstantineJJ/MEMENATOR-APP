import React, { useState, useEffect, useCallback } from 'react';
import {
  WebMemeItem,
  SavedMemeState,
  MemeProvider,
  TextBox,
  MemeSticker,
  MemeFilter,
} from '../types';
import {
  getMemeHistory,
  deleteMemeFromHistory,
  clearMemeHistory,
  getFavorites,
  toggleFavoriteHistoryItem,
  toggleFavoriteWebTemplate,
  removeFavoriteById,
  getShownWebMemeExcludes,
  recordShownWebMemes,
  UniversalFavoriteItem,
} from '../utils/memeStorage';
import { drawMemeOnCanvas } from '../utils/canvasHelper';
import {
  Clock,
  Flame,
  Star,
  RefreshCw,
  Trash2,
  Download,
  Search,
  ExternalLink,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react';

interface MemeFeedPanelProps {
  onRestoreMeme: (state: SavedMemeState) => void;
  onSelectWebTemplate: (item: WebMemeItem) => void;
  selectedUrl: string;
  onShowToast: (msg: string) => void;
  // Trigger to reload history/favorites from outside (e.g. after autosave or export)
  historyRefreshTrigger?: number;
}

type FeedTab = 'history' | 'web' | 'favorites';

export const MemeFeedPanel: React.FC<MemeFeedPanelProps> = ({
  onRestoreMeme,
  onSelectWebTemplate,
  selectedUrl,
  onShowToast,
  historyRefreshTrigger = 0,
}) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('history');

  // History state
  const [historyItems, setHistoryItems] = useState<SavedMemeState[]>([]);

  // Web feed state
  const [webItems, setWebItems] = useState<WebMemeItem[]>([]);
  const [isLoadingWeb, setIsLoadingWeb] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [webSources, setWebSources] = useState<MemeProvider[]>([]);

  // Favorites state
  const [favorites, setFavorites] = useState<UniversalFavoriteItem[]>([]);

  // Reload history and favorites
  const reloadLocalData = useCallback(() => {
    setHistoryItems(getMemeHistory());
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    reloadLocalData();
  }, [reloadLocalData, historyRefreshTrigger]);

  // Fetch from Multi-Source Web Aggregator with Deduplication
  const fetchWebFeed = async (query = '', isManualRefresh = false) => {
    setIsLoadingWeb(true);
    setWebError(null);

    try {
      const excludes = getShownWebMemeExcludes();
      const params = new URLSearchParams();
      params.set('limit', '3');
      if (query.trim()) params.set('query', query.trim());

      // Pass excludes to prevent repeated memes
      if (excludes.excludeIds.length > 0) {
        params.set('excludeIds', excludes.excludeIds.slice(-60).join(','));
      }
      if (excludes.excludeHashes.length > 0) {
        params.set('excludeHashes', excludes.excludeHashes.slice(-60).join(','));
      }

      const res = await fetch(`/api/feed/web-memes?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Не удалось загрузить мемы из сети');
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setWebItems(data.items);
        setWebSources(data.sourcesUsed || []);
        // Record shown items in local storage for deduplication (at least 100 preserved)
        recordShownWebMemes(data.items);
      } else {
        setWebItems([]);
      }
    } catch (err: any) {
      setWebError(err.message || 'Ошибка сети при получении мемов');
    } finally {
      setIsLoadingWeb(false);
    }
  };

  // Initial load for web feed when user switches to 'web' tab
  useEffect(() => {
    if (activeTab === 'web' && webItems.length === 0 && !isLoadingWeb) {
      fetchWebFeed(searchQuery);
    }
  }, [activeTab]);

  // Handle Search in Web tab
  const handleWebSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWebFeed(searchQuery, true);
  };

  // Relative time formatter
  const formatTimeAgo = (timestamp: number): string => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Только что';
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч`;
    const days = Math.floor(hours / 24);
    return `${days} д`;
  };

  // Delete an item from History
  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMemeFromHistory(id);
    reloadLocalData();
    onShowToast('Запись удалена из истории');
  };

  // Clear all History
  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Очистить всю историю мемов?')) {
      clearMemeHistory();
      reloadLocalData();
      onShowToast('История мемов очищена');
    }
  };

  // Toggle favorite for a history item
  const handleToggleFavoriteHistory = (e: React.MouseEvent, item: SavedMemeState) => {
    e.stopPropagation();
    const isNowFav = toggleFavoriteHistoryItem(item);
    reloadLocalData();
    onShowToast(isNowFav ? '⭐ Добавлено в избранное' : 'Удалено из избранного');
  };

  // Toggle favorite for a web meme item
  const handleToggleFavoriteWeb = (e: React.MouseEvent, item: WebMemeItem) => {
    e.stopPropagation();
    const isNowFav = toggleFavoriteWebTemplate(item);
    reloadLocalData();
    onShowToast(isNowFav ? '⭐ Шаблон добавлен в избранное' : 'Удалено из избранного');
  };

  // Remove favorite from Favorites tab
  const handleRemoveFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavoriteById(id);
    reloadLocalData();
    onShowToast('Удалено из избранного');
  };

  // Download high-res meme directly from history/favorites card
  const handleDownloadSavedMeme = async (e: React.MouseEvent, meme: SavedMemeState) => {
    e.stopPropagation();
    try {
      onShowToast('Подготовка изображения к скачиванию...');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const offCanvas = document.createElement('canvas');
          drawMemeOnCanvas(
            offCanvas,
            img,
            meme.textBoxes,
            meme.stickers,
            meme.filter,
            meme.watermark
          );
          const link = document.createElement('a');
          link.download = `${meme.title || 'meme'}-${Date.now()}.png`;
          link.href = offCanvas.toDataURL('image/png');
          link.click();
          onShowToast('Мем успешно скачан!');
        } catch (_err) {
          // Fallback to thumbnail or direct image
          const fallbackLink = document.createElement('a');
          fallbackLink.download = `${meme.title || 'meme'}.jpg`;
          fallbackLink.href = meme.thumbnailUrl || meme.imageSrc;
          fallbackLink.click();
        }
      };
      img.onerror = () => {
        const fallbackLink = document.createElement('a');
        fallbackLink.download = `${meme.title || 'meme'}.jpg`;
        fallbackLink.href = meme.thumbnailUrl || meme.imageSrc;
        fallbackLink.click();
      };
      img.src = meme.imageSrc;
    } catch (_err) {
      onShowToast('Не удалось скачать изображение.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-neutral-900/90 to-neutral-900/70 border border-amber-500/30 rounded-3xl p-3 sm:p-3.5 backdrop-blur space-y-2.5 shadow-xl w-full">
      {/* Header with Title and Segmented Tabs */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black tracking-wide text-white font-['Anton',sans-serif] uppercase">
            ЛЕНТА
          </span>
          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-400 text-neutral-950 uppercase">
            {activeTab === 'history' ? 'История' : activeTab === 'web' ? 'Live' : 'Избранное'}
          </span>
        </div>

        {/* Tab-specific action buttons */}
        <div className="flex items-center gap-1">
          {activeTab === 'history' && historyItems.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1"
              title="Очистить историю"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Очистить</span>
            </button>
          )}

          {activeTab === 'web' && (
            <button
              onClick={() => fetchWebFeed(searchQuery, true)}
              disabled={isLoadingWeb}
              className="flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 hover:border-amber-400/50 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Обновить подборку (без повторов)"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isLoadingWeb ? 'animate-spin' : ''}`} />
              <span>{isLoadingWeb ? 'Поиск...' : 'Обновить'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Main Tabs: 🕘 История (Default) | 🔥 Из сети | ⭐ Избранное */}
      <div className="flex items-center gap-1 p-0.5 bg-neutral-950/80 border border-neutral-800 rounded-xl">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1 px-1.5 text-[10.5px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 truncate ${
            activeTab === 'history'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3 h-3 shrink-0" />
          <span>История</span>
          {historyItems.length > 0 && (
            <span
              className={`text-[9px] px-1 py-0.1 rounded-full font-mono font-bold ${
                activeTab === 'history' ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {historyItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('web')}
          className={`flex-1 py-1 px-1.5 text-[10.5px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 truncate ${
            activeTab === 'web'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Flame className="w-3 h-3 shrink-0" />
          <span>Из сети</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-1 px-1.5 text-[10.5px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 truncate ${
            activeTab === 'favorites'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Star className="w-3 h-3 shrink-0" />
          <span>Избранное</span>
          {favorites.length > 0 && (
            <span
              className={`text-[9px] px-1 py-0.1 rounded-full font-mono font-bold ${
                activeTab === 'favorites' ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1: ИСТОРИЯ (DEFAULT) ================= */}
      {activeTab === 'history' && (
        <div className="space-y-1.5">
          {historyItems.length === 0 ? (
            <div className="py-4 px-2 text-center bg-neutral-950/40 border border-neutral-800/80 rounded-2xl">
              <Clock className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
              <p className="text-[11px] font-semibold text-neutral-300">История пока пуста</p>
              <p className="text-[9.5px] text-neutral-500 mt-0.5">
                Редактируйте тексты, добавляйте стикеры или меняйте шаблоны — ваши работы сохранятся здесь автоматически!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {historyItems.slice(0, 3).map((item) => {
                const isFavoriteItem = item.isFavorite || favorites.some((f) => f.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onRestoreMeme(item);
                      onShowToast(`Мем «${item.title}» восстановлен!`);
                    }}
                    className="group relative flex flex-col justify-between rounded-xl overflow-hidden border border-neutral-800/90 hover:border-amber-400/70 bg-neutral-950/80 hover:bg-neutral-900/90 p-1.5 transition-all cursor-pointer shadow-sm hover:shadow-amber-500/10"
                    title="Нажмите, чтобы восстановить мем в редакторе"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 mb-1 border border-neutral-800/80">
                      <img
                        src={item.thumbnailUrl || item.imageSrc}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Time ago badge */}
                      <div className="absolute bottom-0.5 left-1 bg-black/85 text-[7.5px] text-neutral-300 px-1 py-0.2 rounded font-mono">
                        {formatTimeAgo(item.timestamp)}
                      </div>

                      {/* Favorite indicator */}
                      {isFavoriteItem && (
                        <div className="absolute top-1 left-1 bg-amber-500/90 text-neutral-950 p-0.5 rounded-full shadow">
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-[10px] font-bold text-neutral-200 group-hover:text-amber-300 transition line-clamp-1 mb-1">
                      {item.title}
                    </h4>

                    {/* Compact Action Bar */}
                    <div className="flex items-center gap-1 pt-0.5 border-t border-neutral-800/60">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreMeme(item);
                          onShowToast(`Мем «${item.title}» восстановлен!`);
                        }}
                        className="flex-1 py-0.5 text-[8.5px] font-bold rounded bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-neutral-950 transition cursor-pointer text-center"
                        title="Восстановить в редакторе"
                      >
                        Восстановить
                      </button>

                      {/* Favorite button */}
                      <button
                        onClick={(e) => handleToggleFavoriteHistory(e, item)}
                        className={`p-1 rounded transition cursor-pointer ${
                          isFavoriteItem
                            ? 'text-amber-400 bg-amber-400/20'
                            : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-800'
                        }`}
                        title={isFavoriteItem ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        <Star className={`w-2.5 h-2.5 ${isFavoriteItem ? 'fill-current' : ''}`} />
                      </button>

                      {/* Download button */}
                      <button
                        onClick={(e) => handleDownloadSavedMeme(e, item)}
                        className="p-1 rounded text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition cursor-pointer"
                        title="Скачать мем"
                      >
                        <Download className="w-2.5 h-2.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition cursor-pointer"
                        title="Удалить из истории"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ИЗ СЕТИ (MULTI-SOURCE AGGREGATOR) ================= */}
      {activeTab === 'web' && (
        <div className="space-y-1.5">
          {/* Search bar */}
          <form onSubmit={handleWebSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по Reddit, Imgflip, Meme_Api..."
              className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-7 pr-14 py-1 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 transition"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[9.5px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition cursor-pointer"
            >
              Найти
            </button>
          </form>

          {/* Error state */}
          {webError ? (
            <div className="text-center py-2 text-[10.5px] text-rose-400 bg-rose-950/20 rounded-xl border border-rose-900/40 p-2">
              <span>{webError}</span>
              <button
                onClick={() => fetchWebFeed(searchQuery, true)}
                className="block mx-auto mt-1 text-amber-400 underline cursor-pointer"
              >
                Повторить попытку
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {webItems.map((item) => {
                const isSelected = selectedUrl === item.imageUrl;
                const isItemFav = favorites.some((f) => f.id === item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectWebTemplate(item);
                      onShowToast(`Шаблон «${item.title}» загружен!`);
                    }}
                    className={`group relative flex flex-col justify-between rounded-xl overflow-hidden border transition-all cursor-pointer bg-neutral-950/80 p-1.5 ${
                      isSelected
                        ? 'border-amber-400 ring-1 ring-amber-400/40 bg-neutral-900'
                        : 'border-neutral-800/90 hover:border-amber-400/60 hover:bg-neutral-900/90'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 mb-1 border border-neutral-800/80">
                      <img
                        src={item.thumbnailUrl || item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Provider Badge */}
                      <div className="absolute bottom-0.5 left-1 bg-black/85 text-[7.5px] text-amber-300 px-1 py-0.2 rounded font-mono uppercase">
                        {item.provider}
                      </div>

                      {/* Selected check */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-neutral-950 rounded-full p-0.5 shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-[10px] font-bold text-neutral-100 group-hover:text-amber-300 transition line-clamp-1 mb-1">
                      {item.title}
                    </h4>

                    {/* Bottom action row */}
                    <div className="flex items-center gap-1 pt-0.5 border-t border-neutral-800/60">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWebTemplate(item);
                          onShowToast(`Шаблон «${item.title}» загружен!`);
                        }}
                        className={`flex-1 text-[8.5px] font-bold py-0.5 rounded transition ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-300 group-hover:bg-amber-400 group-hover:text-neutral-950'
                        }`}
                      >
                        {isSelected ? 'Выбран ✓' : 'Выбрать'}
                      </button>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => handleToggleFavoriteWeb(e, item)}
                        className={`p-1 rounded transition cursor-pointer ${
                          isItemFav
                            ? 'text-amber-400 bg-amber-400/20'
                            : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-800'
                        }`}
                        title={isItemFav ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        <Star className={`w-2.5 h-2.5 ${isItemFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: ИЗБРАННОЕ ================= */}
      {activeTab === 'favorites' && (
        <div className="space-y-1.5">
          {favorites.length === 0 ? (
            <div className="py-4 px-2 text-center bg-neutral-950/40 border border-neutral-800/80 rounded-2xl">
              <Star className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
              <p className="text-[11px] font-semibold text-neutral-300">В избранном пусто</p>
              <p className="text-[9.5px] text-neutral-500 mt-0.5">
                Нажимайте звёздочку ⭐ на мемах из истории или на вирусных шаблонах из сети, чтобы иметь к ним быстрый доступ!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {favorites.slice(0, 3).map((fav) => {
                return (
                  <div
                    key={fav.id}
                    onClick={() => {
                      if (fav.type === 'custom' && fav.savedState) {
                        onRestoreMeme(fav.savedState);
                        onShowToast(`Мем «${fav.title}» восстановлен!`);
                      } else if (fav.webTemplate) {
                        onSelectWebTemplate({
                          id: fav.webTemplate.id,
                          provider: fav.webTemplate.provider as any,
                          sourceId: fav.webTemplate.id,
                          title: fav.webTemplate.name,
                          imageUrl: fav.webTemplate.url,
                          thumbnailUrl: fav.webTemplate.thumbnailUrl,
                          hash: fav.id,
                          defaultTopText: fav.webTemplate.defaultTopText,
                          defaultBottomText: fav.webTemplate.defaultBottomText,
                        });
                        onShowToast(`Шаблон «${fav.title}» загружен!`);
                      }
                    }}
                    className="group relative flex flex-col justify-between rounded-xl overflow-hidden border border-neutral-800/90 hover:border-amber-400/70 bg-neutral-950/80 hover:bg-neutral-900/90 p-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 mb-1 border border-neutral-800/80">
                      <img
                        src={fav.thumbnailUrl || fav.imageUrl}
                        alt={fav.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Type badge */}
                      <div className="absolute bottom-0.5 left-1 bg-black/85 text-[7.5px] text-amber-300 px-1 py-0.2 rounded font-mono">
                        {fav.source || (fav.type === 'custom' ? 'Свой мем' : 'Web')}
                      </div>

                      <div className="absolute top-1 right-1 bg-amber-500 text-neutral-950 p-0.5 rounded-full shadow">
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-[10px] font-bold text-neutral-200 group-hover:text-amber-300 transition line-clamp-1 mb-1">
                      {fav.title}
                    </h4>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pt-0.5 border-t border-neutral-800/60">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fav.type === 'custom' && fav.savedState) {
                            onRestoreMeme(fav.savedState);
                            onShowToast(`Мем «${fav.title}» восстановлен!`);
                          } else if (fav.webTemplate) {
                            onSelectWebTemplate({
                              id: fav.webTemplate.id,
                              provider: fav.webTemplate.provider as any,
                              sourceId: fav.webTemplate.id,
                              title: fav.webTemplate.name,
                              imageUrl: fav.webTemplate.url,
                              thumbnailUrl: fav.webTemplate.thumbnailUrl,
                              hash: fav.id,
                              defaultTopText: fav.webTemplate.defaultTopText,
                              defaultBottomText: fav.webTemplate.defaultBottomText,
                            });
                            onShowToast(`Шаблон «${fav.title}» загружен!`);
                          }
                        }}
                        className="flex-1 py-0.5 text-[8.5px] font-bold rounded bg-amber-400 text-neutral-950 hover:bg-amber-300 transition cursor-pointer text-center"
                      >
                        Загрузить
                      </button>

                      {/* Unstar button */}
                      <button
                        onClick={(e) => handleRemoveFavorite(e, fav.id)}
                        className="p-1 rounded text-amber-400 hover:text-rose-400 hover:bg-neutral-800 transition cursor-pointer"
                        title="Удалить из избранного"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
