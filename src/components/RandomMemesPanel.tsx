import React, { useState, useEffect } from 'react';
import { WebMemeItem } from '../types';
import {
  getShownWebMemeExcludes,
  recordShownWebMemes,
  toggleFavoriteWebTemplate,
  getFavorites,
} from '../utils/memeStorage';
import {
  arePerceptuallySimilar,
  computePerceptualHashForUrl,
  isPerceptualHash,
  PERCEPTUAL_HASH_PREFIX,
} from '../utils/perceptualHash';
import { Dices, Search, Check, Star, X } from 'lucide-react';

interface RandomMemesPanelProps {
  onSelectWebTemplate: (item: WebMemeItem) => void;
  selectedUrl: string;
  onShowToast: (msg: string) => void;
  historyRefreshTrigger?: number;
}

const DISPLAY_LIMIT = 6;
const FETCH_CANDIDATE_LIMIT = 12;
const HASH_CONCURRENCY = 4;
const RECENT_EXCLUDE_LIMIT = 18;
const RECENT_PERCEPTUAL_LIMIT = 12;
const PERCEPTUAL_DISTANCE_THRESHOLD = 4;

type HashedCandidate = {
  item: WebMemeItem;
  perceptualHash: string | null;
};

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const entries = items.entries();

  const worker = async () => {
    while (true) {
      const next = entries.next();
      if (next.done) break;
      const [index, item] = next.value;
      results[index] = await mapper(item);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

function isSimilarToAny(hash: string, knownHashes: string[]): boolean {
  return knownHashes.some((knownHash) =>
    arePerceptuallySimilar(hash, knownHash, PERCEPTUAL_DISTANCE_THRESHOLD)
  );
}

async function dedupeCandidatesByPixels(
  items: WebMemeItem[],
  previousHashes: string[]
): Promise<WebMemeItem[]> {
  // Only the most recent few pixel hashes are treated as a hard novelty window.
  // Older memes are allowed to reappear occasionally instead of exhausting the feed.
  const recentPerceptualHashes = previousHashes
    .filter(isPerceptualHash)
    .slice(-RECENT_PERCEPTUAL_LIMIT);

  const hashed = await mapWithConcurrency<WebMemeItem, HashedCandidate>(
    items,
    HASH_CONCURRENCY,
    async (item) => {
      try {
        const rawHash = await computePerceptualHashForUrl(item.thumbnailUrl || item.imageUrl);
        return {
          item,
          perceptualHash: `${PERCEPTUAL_HASH_PREFIX}${rawHash}`,
        };
      } catch (err) {
        // Metadata/URL dedupe still protects this item if pixel hashing is unavailable.
        console.debug('Perceptual hash unavailable for meme:', item.id, err);
        return { item, perceptualHash: null };
      }
    }
  );

  const selected: WebMemeItem[] = [];
  const selectedIds = new Set<string>();
  const batchPerceptualHashes: string[] = [];

  // Pass 1: prefer genuinely fresh images.
  for (const candidate of hashed) {
    if (candidate.perceptualHash) {
      const alreadySeenRecently = isSimilarToAny(candidate.perceptualHash, recentPerceptualHashes);
      const duplicateInBatch = isSimilarToAny(candidate.perceptualHash, batchPerceptualHashes);
      if (alreadySeenRecently || duplicateInBatch) continue;

      batchPerceptualHashes.push(candidate.perceptualHash);
      selected.push({ ...candidate.item, hash: candidate.perceptualHash });
    } else {
      selected.push(candidate.item);
    }

    selectedIds.add(candidate.item.id);
    if (selected.length >= DISPLAY_LIMIT) return selected;
  }

  // Pass 2: if the novelty filter became too strict, allow older repeats while
  // still preventing duplicates inside the same visible six-card batch.
  for (const candidate of hashed) {
    if (selectedIds.has(candidate.item.id)) continue;

    if (candidate.perceptualHash && isSimilarToAny(candidate.perceptualHash, batchPerceptualHashes)) {
      continue;
    }

    if (candidate.perceptualHash) {
      batchPerceptualHashes.push(candidate.perceptualHash);
      selected.push({ ...candidate.item, hash: candidate.perceptualHash });
    } else {
      selected.push(candidate.item);
    }
    selectedIds.add(candidate.item.id);

    if (selected.length >= DISPLAY_LIMIT) break;
  }

  return selected;
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

  const refreshFavs = () => {
    const favs = getFavorites();
    setFavoritesIds(favs.map((f) => f.id));
  };

  useEffect(() => {
    refreshFavs();
  }, [historyRefreshTrigger]);

  const fetchRandomMemes = async (query = '', isManualDice = false) => {
    setIsLoading(true);
    if (isManualDice) setIsRollingDice(true);
    setError(null);

    try {
      const excludes = getShownWebMemeExcludes();
      const recentIds = excludes.ids.slice(-RECENT_EXCLUDE_LIMIT);
      const recentHashes = excludes.hashes.slice(-RECENT_EXCLUDE_LIMIT);
      const params = new URLSearchParams();
      params.set('limit', String(FETCH_CANDIDATE_LIMIT));
      if (query.trim()) params.set('query', query.trim());

      if (recentIds.length > 0) {
        params.set('excludeIds', recentIds.join(','));
      }
      if (recentHashes.length > 0) {
        params.set('excludeHashes', recentHashes.join(','));
      }

      const res = await fetch(`/api/feed/web-memes?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Не удалось загрузить мемы');
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        const candidates = data.items as WebMemeItem[];
        const deduped = await dedupeCandidatesByPixels(candidates, recentHashes);
        setWebItems(deduped);
        recordShownWebMemes(deduped);
        if (isManualDice) {
          onShowToast(
            deduped.length >= DISPLAY_LIMIT
              ? '🎲 Новая случайная подборка загружена!'
              : `🎲 Загружено ${deduped.length} мемов — повторы иногда разрешены`
          );
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
      <div className="flex items-center justify-between gap-1.5 shrink-0 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black tracking-wide text-white uppercase font-['Anton',sans-serif]">
            СЛУЧАЙНЫЕ МЕМЫ
          </span>
          <span className="px-1.5 py-0.2 rounded-md text-[8.5px] font-black bg-rose-500 text-white uppercase shadow-sm">
            LIVE
          </span>
        </div>

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

                  <h4 className="text-[9.5px] font-bold text-neutral-100 group-hover:text-rose-300 transition line-clamp-1 mb-1 leading-tight">
                    {item.title}
                  </h4>

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
