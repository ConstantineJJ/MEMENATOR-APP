import { SavedMemeState, FavoriteWebTemplate, WebMemeItem } from '../types';
import {
  deleteLargeImage,
  deleteLargeImagesByPrefix,
  getLargeImage,
  putLargeImage,
} from './indexedDbStorage';

const HISTORY_KEY = 'memenator_meme_history_v1';
const FAVORITES_KEY = 'memenator_meme_favorites_v1';
const SHOWN_WEB_MEMES_KEY = 'memenator_shown_web_memes_v1';
const MAX_HISTORY_ITEMS = 10;
const MAX_EXCLUDE_ITEMS = 150;
const HISTORY_IMAGE_KEY_PREFIX = 'history:';
const HISTORY_IMAGE_REF_PREFIX = 'idb://memenator/history/';

const pendingImageWrites = new Map<string, Promise<void>>();

function isQuotaExceededError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

function isInlineImage(src: string | undefined): boolean {
  return typeof src === 'string' && src.startsWith('data:image/');
}

function historyImageKey(id: string): string {
  return `${HISTORY_IMAGE_KEY_PREFIX}${id}`;
}

function historyImageRef(id: string): string {
  return `${HISTORY_IMAGE_REF_PREFIX}${encodeURIComponent(id)}`;
}

function idFromHistoryImageRef(ref: string): string | null {
  if (!ref.startsWith(HISTORY_IMAGE_REF_PREFIX)) return null;
  try {
    return decodeURIComponent(ref.slice(HISTORY_IMAGE_REF_PREFIX.length));
  } catch {
    return null;
  }
}

function writeHistoryArray(items: SavedMemeState[]): SavedMemeState[] {
  let candidate = items.slice(0, MAX_HISTORY_ITEMS);

  if (candidate.length === 0) {
    localStorage.setItem(HISTORY_KEY, '[]');
    return [];
  }

  while (candidate.length > 0) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(candidate));
      return candidate;
    } catch (err) {
      if (!isQuotaExceededError(err)) throw err;
      candidate = candidate.slice(0, -1);
    }
  }

  throw new DOMException('Meme history metadata exceeds localStorage quota.', 'QuotaExceededError');
}

function replacePersistedHistoryImage(id: string, imageSrc: string): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const updated = parsed.map((item: SavedMemeState) =>
      item?.id === id ? { ...item, imageSrc } : item
    );
    writeHistoryArray(updated);
  } catch (err) {
    console.warn('Failed to update persisted history image reference:', err);
  }
}

function scheduleImagePersistence(id: string, dataUrl: string): void {
  if (typeof indexedDB === 'undefined') return;

  const key = historyImageKey(id);
  const existing = pendingImageWrites.get(key);
  if (existing) return;

  const write = putLargeImage(key, dataUrl)
    .catch((err) => {
      console.warn('Failed to persist history image in IndexedDB:', err);
      // Best-effort rollback: if the metadata already points to IndexedDB, put the
      // inline payload back so the user's editable image is not silently lost.
      replacePersistedHistoryImage(id, dataUrl);
    })
    .finally(() => {
      pendingImageWrites.delete(key);
    });

  pendingImageWrites.set(key, write);
}

function prepareHistoryItemForStorage(item: SavedMemeState): SavedMemeState {
  if (!isInlineImage(item.imageSrc) || typeof indexedDB === 'undefined') {
    return item;
  }

  scheduleImagePersistence(item.id, item.imageSrc);
  return { ...item, imageSrc: historyImageRef(item.id) };
}

function migrateLegacyInlineHistory(items: SavedMemeState[]): SavedMemeState[] {
  for (const item of items) {
    if (!item?.id || !isInlineImage(item.imageSrc) || typeof indexedDB === 'undefined') continue;
    const original = item.imageSrc;
    const key = historyImageKey(item.id);
    if (pendingImageWrites.has(key)) continue;

    const write = putLargeImage(key, original)
      .then(() => replacePersistedHistoryImage(item.id, historyImageRef(item.id)))
      .catch((err) => console.warn('Legacy history image migration failed:', err))
      .finally(() => pendingImageWrites.delete(key));
    pendingImageWrites.set(key, write);
  }

  // Keep legacy inline data in the in-memory result until the IndexedDB write has
  // actually completed. This makes migration fail-safe rather than destructive.
  return items;
}

// ================= HISTORY =================
export function getMemeHistory(): SavedMemeState[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items = parsed as SavedMemeState[];
    migrateLegacyInlineHistory(items);
    return items;
  } catch (err) {
    console.warn('Failed to load meme history from localStorage:', err);
    return [];
  }
}

export async function resolveSavedMemeState(meme: SavedMemeState): Promise<SavedMemeState> {
  const id = idFromHistoryImageRef(meme.imageSrc);
  if (!id) return meme;

  const key = historyImageKey(id);
  const pending = pendingImageWrites.get(key);
  if (pending) await pending;

  try {
    const storedImage = await getLargeImage(key);
    if (storedImage) return { ...meme, imageSrc: storedImage };
  } catch (err) {
    console.warn('Failed to resolve history image from IndexedDB:', err);
  }

  // The thumbnail is intentionally small, but it is still preferable to a broken
  // restore action if browser storage was cleared independently.
  return { ...meme, imageSrc: meme.thumbnailUrl || meme.imageSrc };
}

export function saveMemeToHistory(
  meme: Omit<SavedMemeState, 'id' | 'timestamp'> & { id?: string }
): SavedMemeState {
  try {
    const history = getMemeHistory();
    const existingIndex = meme.id ? history.findIndex((h) => h.id === meme.id) : -1;
    const now = Date.now();

    const title =
      meme.title?.trim() ||
      meme.textBoxes.find((b) => b.text.trim())?.text.trim() ||
      'Мем без названия';

    const savedItem: SavedMemeState = {
      ...meme,
      id: meme.id || `hist-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.slice(0, 45),
      timestamp: now,
    };

    const existingItem = existingIndex >= 0 ? history.at(existingIndex) : undefined;
    if (existingItem) {
      savedItem.isFavorite = existingItem.isFavorite ?? savedItem.isFavorite;
    }

    const persistedItem = prepareHistoryItemForStorage(savedItem);
    const updated = [
      persistedItem,
      ...history.filter((_, idx) => idx !== existingIndex),
    ];
    writeHistoryArray(updated);
    return savedItem;
  } catch (err) {
    console.warn('Failed to save meme to history:', err);
    return {
      ...meme,
      id: meme.id || `hist-${Date.now()}`,
      title: meme.title || 'Мем',
      timestamp: Date.now(),
    };
  }
}

export function deleteMemeFromHistory(id: string): void {
  try {
    const history = getMemeHistory();
    const updated = history.filter((h) => h.id !== id);
    writeHistoryArray(updated);
    void deleteLargeImage(historyImageKey(id)).catch((err) =>
      console.warn('Failed to delete history image from IndexedDB:', err)
    );
  } catch (err) {
    console.warn('Failed to delete meme from history:', err);
  }
}

export function clearMemeHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
    void deleteLargeImagesByPrefix(HISTORY_IMAGE_KEY_PREFIX).catch((err) =>
      console.warn('Failed to clear history images from IndexedDB:', err)
    );
  } catch (err) {
    console.warn('Failed to clear meme history:', err);
  }
}

// ================= FAVORITES =================
export interface UniversalFavoriteItem {
  type: 'custom' | 'web';
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  source?: string;
  savedState?: SavedMemeState;
  webTemplate?: FavoriteWebTemplate;
  timestamp: number;
}

function normalizeFavorite(raw: any): UniversalFavoriteItem | null {
  if (!raw || typeof raw !== 'object' || !raw.id) return null;

  if (raw.type === 'custom') {
    const normalized: UniversalFavoriteItem = { ...raw };
    if (raw.savedState && isInlineImage(raw.savedState.imageSrc) && typeof indexedDB !== 'undefined') {
      const persistedState = prepareHistoryItemForStorage(raw.savedState as SavedMemeState);
      normalized.savedState = persistedState;
      normalized.thumbnailUrl = raw.thumbnailUrl || persistedState.thumbnailUrl;
      normalized.imageUrl = normalized.thumbnailUrl;
    } else if (typeof raw.imageUrl === 'string' && raw.imageUrl.startsWith('data:image/')) {
      normalized.imageUrl = raw.thumbnailUrl || raw.imageUrl;
    }
    return normalized;
  }

  if (raw.type !== 'web' || !raw.webTemplate) {
    return raw as UniversalFavoriteItem;
  }

  const legacy = raw.webTemplate as any;
  const title = legacy.title || legacy.name || raw.title || 'Мем';
  const imageUrl = legacy.imageUrl || legacy.url || raw.imageUrl || '';
  if (!imageUrl) return null;

  const normalizedTemplate: FavoriteWebTemplate = {
    id: legacy.id || raw.id,
    title,
    imageUrl,
    thumbnailUrl: legacy.thumbnailUrl || raw.thumbnailUrl || imageUrl,
    source: legacy.source || raw.source || legacy.provider || 'web',
    provider: legacy.provider || 'curated',
    sourceId: legacy.sourceId,
    hash: legacy.hash,
    defaultTopText: legacy.defaultTopText,
    defaultBottomText: legacy.defaultBottomText,
    addedAt: legacy.addedAt || raw.timestamp || Date.now(),
    name: legacy.name,
    url: legacy.url,
  };

  return {
    ...raw,
    type: 'web',
    title,
    imageUrl,
    thumbnailUrl: normalizedTemplate.thumbnailUrl,
    webTemplate: normalizedTemplate,
  } as UniversalFavoriteItem;
}

export function getFavorites(): UniversalFavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(normalizeFavorite)
      .filter((item): item is UniversalFavoriteItem => Boolean(item));

    if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch (err) {
    console.warn('Failed to load favorites:', err);
    return [];
  }
}

export function isFavorite(id: string): boolean {
  const favorites = getFavorites();
  return favorites.some((f) => f.id === id);
}

export function toggleFavoriteHistoryItem(savedMeme: SavedMemeState): boolean {
  try {
    const favorites = getFavorites();
    const existingIndex = favorites.findIndex((f) => f.id === savedMeme.id);
    const history = getMemeHistory();

    if (existingIndex >= 0) {
      const updatedFavs = favorites.filter((_, idx) => idx !== existingIndex);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));

      const updatedHistory = history.map((h) =>
        h.id === savedMeme.id ? { ...h, isFavorite: false } : h
      );
      writeHistoryArray(updatedHistory);
      return false;
    }

    const persistedState = prepareHistoryItemForStorage(savedMeme);
    const newFav: UniversalFavoriteItem = {
      type: 'custom',
      id: savedMeme.id,
      title: savedMeme.title,
      // Never duplicate the original full-size data URL in localStorage.
      imageUrl: savedMeme.thumbnailUrl,
      thumbnailUrl: savedMeme.thumbnailUrl,
      source: 'Свой мем',
      savedState: persistedState,
      timestamp: Date.now(),
    };
    const updatedFavs = [newFav, ...favorites];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));

    const updatedHistory = history.map((h) =>
      h.id === savedMeme.id ? { ...h, isFavorite: true } : h
    );
    writeHistoryArray(updatedHistory);
    return true;
  } catch (err) {
    console.warn('Failed to toggle favorite:', err);
    return false;
  }
}

export function toggleFavoriteWebTemplate(item: WebMemeItem): boolean {
  try {
    const favorites = getFavorites();
    const existingIndex = favorites.findIndex((f) => f.id === item.id);

    if (existingIndex >= 0) {
      const updatedFavs = favorites.filter((_, idx) => idx !== existingIndex);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));
      return false;
    }

    const newFav: UniversalFavoriteItem = {
      type: 'web',
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      thumbnailUrl: item.thumbnailUrl || item.imageUrl,
      source: item.provider.toUpperCase(),
      webTemplate: {
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl || item.imageUrl,
        source: item.provider,
        provider: item.provider,
        sourceId: item.sourceId,
        hash: item.hash,
        defaultTopText: item.defaultTopText,
        defaultBottomText: item.defaultBottomText,
        addedAt: Date.now(),
      },
      timestamp: Date.now(),
    };
    const updatedFavs = [newFav, ...favorites];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));
    return true;
  } catch (err) {
    console.warn('Failed to toggle favorite web template:', err);
    return false;
  }
}

export function removeFavoriteById(id: string): void {
  try {
    const favorites = getFavorites();
    const updated = favorites.filter((f) => f.id !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

    const history = getMemeHistory();
    const updatedHistory = history.map((h) => (h.id === id ? { ...h, isFavorite: false } : h));
    writeHistoryArray(updatedHistory);
  } catch (err) {
    console.warn('Failed to remove favorite:', err);
  }
}

// ================= WEB MEME ANTI-REPEAT MEMORY =================
interface ShownWebMemesState {
  ids: string[];
  hashes: string[];
}

export function getShownWebMemeExcludes(): ShownWebMemesState {
  try {
    const raw = localStorage.getItem(SHOWN_WEB_MEMES_KEY);
    if (!raw) return { ids: [], hashes: [] };
    const parsed = JSON.parse(raw);
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((id: unknown): id is string => typeof id === 'string') : [],
      hashes: Array.isArray(parsed.hashes) ? parsed.hashes.filter((hash: unknown): hash is string => typeof hash === 'string') : [],
    };
  } catch (err) {
    console.warn('Failed to load shown web meme memory:', err);
    return { ids: [], hashes: [] };
  }
}

export function recordShownWebMemes(items: WebMemeItem[]): void {
  try {
    const current = getShownWebMemeExcludes();
    const ids = [...current.ids];
    const hashes = [...current.hashes];

    for (const item of items) {
      if (item.id) ids.push(item.id);
      if (item.hash) hashes.push(item.hash);
    }

    const uniqueIds = [...new Set(ids)].slice(-MAX_EXCLUDE_ITEMS);
    const uniqueHashes = [...new Set(hashes)].slice(-MAX_EXCLUDE_ITEMS);
    localStorage.setItem(SHOWN_WEB_MEMES_KEY, JSON.stringify({ ids: uniqueIds, hashes: uniqueHashes }));
  } catch (err) {
    console.warn('Failed to record shown web memes:', err);
  }
}
