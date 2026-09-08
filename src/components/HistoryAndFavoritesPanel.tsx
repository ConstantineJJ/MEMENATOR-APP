import React, { useState, useEffect, useCallback } from 'react';
import {
  SavedMemeState,
  WebMemeItem,
  MemeProvider,
} from '../types';
import {
  getMemeHistory,
  deleteMemeFromHistory,
  clearMemeHistory,
  getFavorites,
  toggleFavoriteHistoryItem,
  removeFavoriteById,
  UniversalFavoriteItem,
} from '../utils/memeStorage';
import { drawMemeOnCanvas } from '../utils/canvasHelper';
import {
  Clock,
  Star,
  Trash2,
  Download,
  RotateCcw,
} from 'lucide-react';

interface HistoryAndFavoritesPanelProps {
  onRestoreMeme: (state: SavedMemeState) => void;
  onSelectWebTemplate: (item: WebMemeItem) => void;
  onShowToast: (msg: string) => void;
  historyRefreshTrigger?: number;
}

type SubTab = 'history' | 'favorites';

export const HistoryAndFavoritesPanel: React.FC<HistoryAndFavoritesPanelProps> = ({
  onRestoreMeme,
  onSelectWebTemplate,
  onShowToast,
  historyRefreshTrigger = 0,
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('history');
  const [historyItems, setHistoryItems] = useState<SavedMemeState[]>([]);
  const [favorites, setFavorites] = useState<UniversalFavoriteItem[]>([]);

  const reloadData = useCallback(() => {
    setHistoryItems(getMemeHistory());
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData, historyRefreshTrigger]);

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

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMemeFromHistory(id);
    reloadData();
    onShowToast('Мем удален из истории');
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Очистить всю историю мемов?')) {
      clearMemeHistory();
      reloadData();
      onShowToast('История мемов очищена');
    }
  };

  const handleToggleFavHistory = (e: React.MouseEvent, item: SavedMemeState) => {
    e.stopPropagation();
    const isNowFav = toggleFavoriteHistoryItem(item);
    reloadData();
    onShowToast(isNowFav ? '⭐ Добавлено в избранное' : 'Удалено из избранного');
  };

  const handleRemoveFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavoriteById(id);
    reloadData();
    onShowToast('Удалено из избранного');
  };

  const handleDownloadSavedMeme = async (e: React.MouseEvent, meme: SavedMemeState) => {
    e.stopPropagation();
    try {
      onShowToast('Подготовка к скачиванию...');
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
          onShowToast('Мем скачан!');
        } catch (_err) {
          const fallback = document.createElement('a');
          fallback.download = `${meme.title || 'meme'}.jpg`;
          fallback.href = meme.thumbnailUrl || meme.imageSrc;
          fallback.click();
        }
      };
      img.onerror = () => {
        const fallback = document.createElement('a');
        fallback.download = `${meme.title || 'meme'}.jpg`;
        fallback.href = meme.thumbnailUrl || meme.imageSrc;
        fallback.click();
      };
      img.src = meme.imageSrc;
    } catch (_err) {
      onShowToast('Ошибка при скачивании');
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/30 rounded-2xl p-2.5 sm:p-3 backdrop-blur shadow-md w-full h-full flex flex-col justify-between overflow-hidden min-h-0">
      {/* Top Header with Tab Switcher & Clear button */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 mb-1.5">
        <div className="flex items-center gap-1 p-0.5 bg-neutral-950/90 rounded-xl border border-neutral-800/90 flex-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1 px-2 text-[10.5px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>История</span>
            {historyItems.length > 0 && (
              <span className={`text-[8.5px] px-1 py-0.1 rounded-full font-mono font-bold ${
                activeTab === 'history' ? 'bg-neutral-950 text-emerald-300' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {historyItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-1 px-2 text-[10.5px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'bg-amber-400 text-neutral-950 shadow-sm shadow-amber-400/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>Избранное</span>
            {favorites.length > 0 && (
              <span className={`text-[8.5px] px-1 py-0.1 rounded-full font-mono font-bold ${
                activeTab === 'favorites' ? 'bg-neutral-950 text-amber-300' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'history' && historyItems.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer shrink-0"
            title="Очистить историю"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar">
        {/* ================= TAB: ИСТОРИЯ ================= */}
        {activeTab === 'history' && (
          <>
            {historyItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-2 rounded-xl border border-neutral-800/60 bg-neutral-950/40">
                <Clock className="w-4 h-4 text-neutral-600 mb-0.5" />
                <p className="text-[10px] font-semibold text-neutral-300">История пуста</p>
                <p className="text-[8.5px] text-neutral-500">
                  Создавайте мемы — они сохранятся здесь!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 h-full items-stretch">
                {historyItems.slice(0, 3).map((item) => {
                  const isFav = item.isFavorite || favorites.some((f) => f.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onRestoreMeme(item);
                        onShowToast(`Мем «${item.title}» восстановлен!`);
                      }}
                      className="group relative flex flex-col justify-between rounded-xl overflow-hidden border border-neutral-800/90 hover:border-emerald-500/70 bg-neutral-950/90 hover:bg-neutral-900 p-1 transition-all cursor-pointer shadow-sm"
                      title="Нажмите, чтобы восстановить мем"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 mb-0.5 border border-neutral-800/80 shrink-0">
                        <img
                          src={item.thumbnailUrl || item.imageSrc}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-0.5 left-1 bg-black/85 text-[7px] text-neutral-300 px-1 py-0.2 rounded font-mono">
                          {formatTimeAgo(item.timestamp)}
                        </div>
                        {isFav && (
                          <div className="absolute top-1 left-1 bg-amber-400 text-neutral-950 p-0.5 rounded-full shadow">
                            <Star className="w-2 h-2 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-[9px] font-bold text-neutral-200 group-hover:text-emerald-300 transition line-clamp-1 mb-0.5 leading-tight">
                        {item.title}
                      </h4>

                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-0.5 border-t border-neutral-800/60 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreMeme(item);
                            onShowToast(`Мем «${item.title}» восстановлен!`);
                          }}
                          className="flex-1 py-0.5 text-[8px] font-bold rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-white transition cursor-pointer text-center"
                          title="Восстановить мем"
                        >
                          Открыть
                        </button>

                        <button
                          onClick={(e) => handleToggleFavHistory(e, item)}
                          className={`p-0.5 rounded transition cursor-pointer ${
                            isFav
                              ? 'text-amber-400 bg-amber-400/20'
                              : 'text-neutral-500 hover:text-amber-300 hover:bg-neutral-800'
                          }`}
                          title={isFav ? 'Удалить из избранного' : 'В избранное'}
                        >
                          <Star className={`w-2.5 h-2.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => handleDownloadSavedMeme(e, item)}
                          className="p-0.5 rounded text-neutral-500 hover:text-emerald-400 hover:bg-neutral-800 transition cursor-pointer"
                          title="Скачать"
                        >
                          <Download className="w-2.5 h-2.5" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteHistory(e, item.id)}
                          className="p-0.5 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= TAB: ИЗБРАННОЕ ================= */}
        {activeTab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-2 rounded-xl border border-neutral-800/60 bg-neutral-950/40">
                <Star className="w-4 h-4 text-neutral-600 mb-0.5" />
                <p className="text-[10px] font-semibold text-neutral-300">В избранном пусто</p>
                <p className="text-[8.5px] text-neutral-500">
                  Нажимайте ⭐ на мемах из истории или случайных мемах!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 h-full items-stretch">
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
                            title: fav.webTemplate.title,
                            imageUrl: fav.webTemplate.imageUrl,
                            thumbnailUrl: fav.webTemplate.thumbnailUrl,
                            provider: fav.webTemplate.provider as MemeProvider,
                          });
                          onShowToast(`Мем «${fav.title}» загружен!`);
                        }
                      }}
                      className="group relative flex flex-col justify-between rounded-xl overflow-hidden border border-neutral-800/90 hover:border-amber-400/70 bg-neutral-950/90 hover:bg-neutral-900 p-1 transition-all cursor-pointer shadow-sm"
                      title="Открыть мем"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 mb-0.5 border border-neutral-800/80 shrink-0">
                        <img
                          src={fav.thumbnailUrl || fav.imageUrl}
                          alt={fav.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-0.5 left-1 bg-black/85 text-[7px] text-amber-300 px-1 py-0.2 rounded font-mono uppercase">
                          {fav.type === 'custom' ? 'МОЙ' : 'ШАБЛОН'}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-[9px] font-bold text-neutral-100 group-hover:text-amber-300 transition line-clamp-1 mb-0.5 leading-tight">
                        {fav.title}
                      </h4>

                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-0.5 border-t border-neutral-800/60 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (fav.type === 'custom' && fav.savedState) {
                              onRestoreMeme(fav.savedState);
                              onShowToast(`Мем «${fav.title}» восстановлен!`);
                            } else if (fav.webTemplate) {
                              onSelectWebTemplate({
                                id: fav.webTemplate.id,
                                title: fav.webTemplate.title,
                                imageUrl: fav.webTemplate.imageUrl,
                                thumbnailUrl: fav.webTemplate.thumbnailUrl,
                                provider: fav.webTemplate.provider as MemeProvider,
                              });
                              onShowToast(`Мем «${fav.title}» загружен!`);
                            }
                          }}
                          className="flex-1 text-[8px] font-bold py-0.5 rounded bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-neutral-950 transition cursor-pointer"
                        >
                          Открыть
                        </button>

                        <button
                          onClick={(e) => handleRemoveFav(e, fav.id)}
                          className="p-0.5 rounded text-amber-400 hover:text-rose-400 hover:bg-neutral-800 transition cursor-pointer"
                          title="Удалить из избранного"
                        >
                          <Star className="w-2.5 h-2.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
