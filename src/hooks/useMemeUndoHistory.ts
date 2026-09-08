import { useCallback, useEffect, useRef, useState } from 'react';
import { MemeFilter, MemeSticker, TextBox } from '../types';

export interface MemeHistorySnapshot {
  textBoxes: TextBox[];
  stickers: MemeSticker[];
  filter: MemeFilter;
  filterIntensity?: number;
  watermark: boolean;
  activeImageSrc: string;
}

interface UseMemeUndoHistoryOptions {
  currentSnapshot: MemeHistorySnapshot;
  applySnapshot: (snapshot: MemeHistorySnapshot) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  debounceMs?: number;
  maxEntries?: number;
}

export function useMemeUndoHistory({
  currentSnapshot,
  applySnapshot,
  onUndo,
  onRedo,
  debounceMs = 450,
  maxEntries = 25,
}: UseMemeUndoHistoryOptions) {
  const initialSnapshotRef = useRef(currentSnapshot);
  const [history, setHistory] = useState<MemeHistorySnapshot[]>(() => [initialSnapshotRef.current]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const currentSnapshotRef = useRef(currentSnapshot);
  const skipNextAutomaticRecordRef = useRef(false);
  const lastSerializedRef = useRef(JSON.stringify(initialSnapshotRef.current));

  historyRef.current = history;
  historyIndexRef.current = historyIndex;
  currentSnapshotRef.current = currentSnapshot;

  const recordSnapshot = useCallback(
    (snapshot: MemeHistorySnapshot) => {
      const serialized = JSON.stringify(snapshot);
      lastSerializedRef.current = serialized;

      setHistory((previous) => {
        const activeIndex = historyIndexRef.current;
        let next = previous.slice(0, activeIndex + 1);

        if (next.length >= maxEntries) {
          next = next.slice(next.length - (maxEntries - 1));
        }

        const updated = [...next, snapshot];
        const nextIndex = updated.length - 1;
        historyRef.current = updated;
        historyIndexRef.current = nextIndex;
        setHistoryIndex(nextIndex);
        return updated;
      });
    },
    [maxEntries]
  );

  const serializedCurrentSnapshot = JSON.stringify(currentSnapshot);

  useEffect(() => {
    if (skipNextAutomaticRecordRef.current) {
      skipNextAutomaticRecordRef.current = false;
      lastSerializedRef.current = serializedCurrentSnapshot;
      return;
    }

    if (serializedCurrentSnapshot === lastSerializedRef.current) return;

    const timer = window.setTimeout(() => {
      const snapshot = currentSnapshotRef.current;
      const serialized = JSON.stringify(snapshot);
      if (serialized === lastSerializedRef.current) return;
      recordSnapshot(snapshot);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [serializedCurrentSnapshot, debounceMs, recordSnapshot]);

  const jumpTo = useCallback(
    (nextIndex: number, action: 'undo' | 'redo') => {
      const target = historyRef.current[nextIndex];
      if (!target) return;

      skipNextAutomaticRecordRef.current = true;
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      lastSerializedRef.current = JSON.stringify(target);
      applySnapshot(target);

      if (action === 'undo') onUndo?.();
      else onRedo?.();
    },
    [applySnapshot, onRedo, onUndo]
  );

  const undo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index > 0) jumpTo(index - 1, 'undo');
  }, [jumpTo]);

  const redo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index < historyRef.current.length - 1) jumpTo(index + 1, 'redo');
  }, [jumpTo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();

      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);

  return {
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    recordSnapshot,
    undo,
    redo,
  };
}
