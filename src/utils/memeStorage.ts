import { SavedMemeState, FavoriteWebTemplate, WebMemeItem } from '../types';

const HISTORY_KEY = 'memenator_meme_history_v1';
const FAVORITES_KEY = 'memenator_meme_favorites_v1';
const SHOWN_WEB_MEMES_KEY = 'memenator_shown_web_memes_v1';
const MAX_HISTORY_ITEMS = 30;
const MAX_EXCLUDE_ITEMS = 150;

// ================= HISTORY =================
export function getMemeHistory(): SavedMemeState[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load meme history from localStorage:', err);
    return [];
  }
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

    let updated: SavedMemeState[];
    if (existingIndex >= 0) {
      // Keep favorite status if already favorited
      savedItem.isFavorite = history[existingIndex].isFavorite ?? savedItem.isFavorite;
      updated = [savedItem, ...history.filter((_, idx) => idx !== existingIndex)];
    } else {
      updated = [savedItem, ...history];
    }

    // Limit to max items
    const trimmed = updated.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete meme from history:', err);
  }
}

export function clearMemeHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
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

export function getFavorites(): UniversalFavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
      // Remove from favorites
      const updatedFavs = favorites.filter((_, idx) => idx !== existingIndex);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));

      // Update history flag
      const updatedHistory = history.map((h) =>
        h.id === savedMeme.id ? { ...h, isFavorite: false } : h
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return false;
    } else {
      // Add to favorites
      const newFav: UniversalFavoriteItem = {
        type: 'custom',
        id: savedMeme.id,
        title: savedMeme.title,
        imageUrl: savedMeme.imageSrc,
        thumbnailUrl: savedMeme.thumbnailUrl,
        source: 'Свой мем',
        savedState: savedMeme,
        timestamp: Date.now(),
      };
      const updatedFavs = [newFav, ...favorites];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));

      // Update history flag
      const updatedHistory = history.map((h) =>
        h.id === savedMeme.id ? { ...h, isFavorite: true } : h
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return true;
    }
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
    } else {
      const newFav: UniversalFavoriteItem = {
        type: 'web',
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl || item.imageUrl,
        source: item.provider.toUpperCase(),
        webTemplate: {
          id: item.id,
          name: item.title,
          url: item.imageUrl,
          thumbnailUrl: item.thumbnailUrl || item.imageUrl,
          source: item.provider,
          provider: item.provider,
          defaultTopText: item.defaultTopText,
          defaultBottomText: item.defaultBottomText,
          addedAt: Date.now(),
        },
        timestamp: Date.now(),
      };
      const updatedFavs = [newFav, ...favorites];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));
      return true;
    }
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

    // Also update history if present
    const history = getMemeHistory();
    const updatedHistory = history.map((h) => (h.id === id ? { ...h, isFavorite: false } : h));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.warn('Failed to remove favorite:', err);
  }
}

// ================= SHOWN WEB MEMES DEDUPLICATION =================
interface ShownWebMemesStore {
  ids: string[];
  hashes: string[];
}

export function getShownWebMemeExcludes(): { excludeIds: string[]; excludeHashes: string[] } {
  try {
    const raw = localStorage.getItem(SHOWN_WEB_MEMES_KEY);
    if (!raw) return { excludeIds: [], excludeHashes: [] };
    const parsed: ShownWebMemesStore = JSON.parse(raw);
    return {
      excludeIds: Array.isArray(parsed.ids) ? parsed.ids.slice(-MAX_EXCLUDE_ITEMS) : [],
      excludeHashes: Array.isArray(parsed.hashes) ? parsed.hashes.slice(-MAX_EXCLUDE_ITEMS) : [],
    };
  } catch {
    return { excludeIds: [], excludeHashes: [] };
  }
}

export function recordShownWebMemes(items: WebMemeItem[]): void {
  try {
    const current = getShownWebMemeExcludes();
    const newIds = new Set([...current.excludeIds, ...items.map((i) => i.id)]);
    const newHashes = new Set([...current.excludeHashes, ...items.map((i) => i.hash)]);

    const stored: ShownWebMemesStore = {
      ids: Array.from(newIds).slice(-MAX_EXCLUDE_ITEMS),
      hashes: Array.from(newHashes).slice(-MAX_EXCLUDE_ITEMS),
    };
    localStorage.setItem(SHOWN_WEB_MEMES_KEY, JSON.stringify(stored));
  } catch (err) {
    console.warn('Failed to record shown web memes:', err);
  }
}
