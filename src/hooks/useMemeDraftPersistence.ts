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
 * Restoration is a startup-only operation. Callback identities are kept in
 * refs so normal editor renders cannot retrigger IndexedDB recovery and
 * overwrite the user's current edits. A generation token keeps the async
 * recovery safe under React StrictMode's development effect replay.
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
  const restorationGenerationRef = useRef(0);

  currentDraftRef.current = currentDraft;
  applyDraftRef.current = applyDraft;
  onRestoredRef.current = onRestored;

  useEffect(() => {
    const generation = ++restorationGenerationRef.current;

    void (async () => {
      try {
        const parsed = await readPersistedDraft();
        if (restorationGenerationRef.current !== generation) return;

        if (parsed) {
          applyDraftRef.current(parsed);
          setIsDraftSaved(true);
          onRestoredRef.current?.();
        }
      } catch (err) {
        console.warn('Draft recovery failed:', err);
      } finally {
        if (restorationGenerationRef.current === generation) {
          setRestorationComplete(true);
        }
      }
    })();

    return () => {
      if (restorationGenerationRef.current === generation) {
        restorationGenerationRef.current += 1;
      }
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
