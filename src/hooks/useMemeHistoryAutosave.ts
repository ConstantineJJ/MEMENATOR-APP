import { useCallback, useEffect, useRef, useState } from 'react';
import { MemeFilter, MemeSticker, TextBox } from '../types';
import {
  deleteMemeFromHistory,
  getMemeHistory,
  saveMemeToHistory,
} from '../utils/memeStorage';
import { generateMemeThumbnail } from '../utils/thumbnailGenerator';

export interface MemeHistoryAutosaveSnapshot {
  activeImageSrc: string;
  textBoxes: TextBox[];
  stickers: MemeSticker[];
  filter: MemeFilter;
  filterIntensity: number;
  watermark: boolean;
  selectedTemplateId: string | null;
}

interface UseMemeHistoryAutosaveOptions {
  currentSnapshot: MemeHistoryAutosaveSnapshot;
  debounceMs?: number;
}

const MAX_EDITABLE_HISTORY_STATES = 10;

function trimHistoryToLimit() {
  const history = getMemeHistory();
  history.slice(MAX_EDITABLE_HISTORY_STATES).forEach((item) => {
    deleteMemeFromHistory(item.id);
  });
}

/**
 * Persists the currently edited meme into the History panel without making App
 * own storage IDs, thumbnail generation or the debounce timer.
 */
export function useMemeHistoryAutosave({
  currentSnapshot,
  debounceMs = 1200,
}: UseMemeHistoryAutosaveOptions) {
  const activeMemeIdRef = useRef<string | undefined>(undefined);
  const currentSnapshotRef = useRef(currentSnapshot);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  currentSnapshotRef.current = currentSnapshot;

  const setActiveMemeId = useCallback((id: string | undefined) => {
    activeMemeIdRef.current = id;
  }, []);

  const startNewMeme = useCallback(() => {
    activeMemeIdRef.current = undefined;
  }, []);

  const serializedSnapshot = JSON.stringify(currentSnapshot);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const snapshot = currentSnapshotRef.current;
        if (!snapshot.activeImageSrc) return;

        const mainText =
          snapshot.textBoxes.find((box) => box.text.trim())?.text.trim() || 'Мем без названия';

        const thumbnail = await generateMemeThumbnail(
          snapshot.activeImageSrc,
          snapshot.textBoxes,
          snapshot.stickers,
          snapshot.filter,
          snapshot.watermark,
          snapshot.filterIntensity
        );

        const saved = saveMemeToHistory({
          id: activeMemeIdRef.current,
          title: mainText,
          thumbnailUrl: thumbnail,
          imageSrc: snapshot.activeImageSrc,
          textBoxes: snapshot.textBoxes,
          stickers: snapshot.stickers,
          filter: snapshot.filter,
          filterIntensity: snapshot.filterIntensity,
          watermark: snapshot.watermark,
          templateId: snapshot.selectedTemplateId,
        });

        if (!activeMemeIdRef.current) activeMemeIdRef.current = saved.id;
        trimHistoryToLimit();
        setHistoryRefreshTrigger((previous) => previous + 1);
      } catch (err) {
        console.warn('History autosave error:', err);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [serializedSnapshot, debounceMs]);

  return {
    historyRefreshTrigger,
    setActiveMemeId,
    startNewMeme,
  };
}
