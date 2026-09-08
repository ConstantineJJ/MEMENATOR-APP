export type LayoutProfile =
  | 'phone-portrait'
  | 'phone-landscape'
  | 'tablet-portrait'
  | 'tablet-landscape'
  | 'desktop';

export interface LayoutViewport {
  width: number;
  height: number;
  orientation?: 'portrait' | 'landscape';
}

export function detectLayoutProfile(viewport: LayoutViewport): LayoutProfile {
  const width = Math.max(0, viewport.width);
  const height = Math.max(0, viewport.height);
  if (width >= 1200) return 'desktop';

  const orientation = viewport.orientation ?? (height >= width ? 'portrait' : 'landscape');

  if (orientation === 'portrait') {
    return width < 600 ? 'phone-portrait' : 'tablet-portrait';
  }

  return width < 900 ? 'phone-landscape' : 'tablet-landscape';
}

let stopCurrentSync: (() => void) | null = null;

function readRuntimeProfile(): LayoutProfile {
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  return detectLayoutProfile({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: portrait ? 'portrait' : 'landscape',
  });
}

/**
 * Keeps a single declarative layout profile on <html>. Components remain shared;
 * CSS changes only their placement/scroll behavior for each device class.
 */
export function startResponsiveProfileSync(): () => void {
  stopCurrentSync?.();

  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const orientation = window.matchMedia('(orientation: portrait)');

  const sync = () => {
    document.documentElement.dataset.layoutProfile = readRuntimeProfile();
    document.documentElement.dataset.coarsePointer = coarsePointer.matches ? 'true' : 'false';
  };

  sync();
  window.addEventListener('resize', sync, { passive: true });
  orientation.addEventListener('change', sync);
  coarsePointer.addEventListener('change', sync);

  const cleanup = () => {
    window.removeEventListener('resize', sync);
    orientation.removeEventListener('change', sync);
    coarsePointer.removeEventListener('change', sync);
    if (stopCurrentSync === cleanup) stopCurrentSync = null;
  };

  stopCurrentSync = cleanup;
  return cleanup;
}
