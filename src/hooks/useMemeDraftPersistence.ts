import { useEffect, useRef, useState } from 'react';
import { MemeFilter, MemeSticker, TextBox } from '../types';
import { getIndexedValue, putIndexedValue } from '../utils/indexedDbStorage';

export interface MemeDraftState {
  textBoxes: TextBox[];
  stickers: MemeSticker[];
  filter: MemeFilter;
  filterIntensity: number;
  watermark: boolean;
  activeImageSrc: string;
  originalImageSrc: string | null;
  selectedTemplateId: string | null;
  timestamp: number;
}

export type MemeDraftSnapshot = Omit<MemeDraftState, 'timestamp'>;

interface UseMemeDraftPersistenceOptions {
  currentDraft: MemeDraftSnapshot;
  applyDraft: (draft: MemeDraftState) => void;
  onRestored?: () => void;
  debounceMs?: number;
}

const DRAFT_STORAGE_KEY = 'draft:v2';
const LEGACY_DRAFT_STORAGE_KEY = 'memenator_draft_v2';

async function readPersistedDraft(): Promise<MemeDraftState | null> {
  let stored = await getIndexedValue<MemeDraftState>(DRAFT_STORAGE_KEY);
  if (stored?.textBoxes && stored?.activeImageSrc) return stored;

  const legacyDraft = localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);
  if (!legacyDraft) return null;

  try {
    const parsed = JSON.parse(legacyDraft) as MemeDraftState;
    if (!parsed?.textBoxes || !parsed?.activeImageSrc) return null;

    await putIndexedValue(DRAFT_STORAGE_KEY, parsed);
    localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
    stored = parsed;
  } catch (err) {
    console.warn('Legacy draft migration failed:', err);
    return null;
  }

  return stored;
}

/**
 * Restores and autosaves the editable project draft.
 *
 * Restoration is a one-shot startup operation. Callback identities are kept in
 * refs so ordinary editor renders cannot retrigger IndexedDB recovery and
 * overwrite the user's current edits. Autosave remains gated until that single
 * recovery attempt finishes, preventing the default editor state from racing a
 * slow IndexedDB read.
 */
export function useMemeDraftPersistence({
  currentDraft,
  applyDraft,
  onRestored,
  debounceMs = 600,
}: UseMemeDraftPersistenceOptions) {
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [restorationComplete, setRestorationComplete] = useState(false);
  const currentDraftRef = useRef(currentDraft);
  const applyDraftRef = useRef(applyDraft);
  const onRestoredRef = useRef(onRestored);
  const restorationStartedRef = useRef(false);

  currentDraftRef.current = currentDraft;
  applyDraftRef.current = applyDraft;
  onRestoredRef.current = onRestored;

  useEffect(() => {
    // React StrictMode may replay mount effects in development. This guard also
    // protects against any future refactor that accidentally remounts the effect
    // without intending to recover the same draft twice.
    if (restorationStartedRef.current) return;
    restorationStartedRef.current = true;

    let cancelled = false;

    void (async () => {
      try {
        const parsed = await readPersistedDraft();
        if (cancelled || !parsed) return;

        applyDraftRef.current(parsed);
        setIsDraftSaved(true);
        onRestoredRef.current?.();
      } catch (err) {
        console.warn('Draft recovery failed:', err);
      } finally {
        if (!cancelled) setRestorationComplete(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const serializedDraft = JSON.stringify(currentDraft);

  useEffect(() => {
    if (!restorationComplete) return;

    setIsDraftSaved(false);
    const timer = window.setTimeout(() => {
      const draft: MemeDraftState = {
        ...currentDraftRef.current,
        timestamp: Date.now(),
      };

      void putIndexedValue(DRAFT_STORAGE_KEY, draft)
        .then(() => setIsDraftSaved(true))
        .catch((err) => console.warn('Autosave failed:', err));
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [serializedDraft, restorationComplete, debounceMs]);

  return {
    isDraftSaved,
    restorationComplete,
  };
}
