import { TextBox, MemeSticker, MemeFilter } from '../types';
import { drawMemeOnCanvas } from './canvasHelper';

/**
 * Generates a compact dataURL thumbnail from the current meme canvas state.
 * Gracefully falls back to raw imageSrc if cross-origin canvas security triggers.
 */
export async function generateMemeThumbnail(
  imageSrc: string,
  textBoxes: TextBox[],
  stickers: MemeSticker[],
  filter: MemeFilter,
  watermark: boolean = false,
  filterIntensity: number = 100
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeoutId = setTimeout(() => {
        resolve(imageSrc);
      }, 1200);

      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const offscreenCanvas = document.createElement('canvas');
          const maxDim = 240;
          const origW = img.naturalWidth || 600;
          const origH = img.naturalHeight || 600;
          const scale = Math.min(maxDim / origW, maxDim / origH, 1);

          offscreenCanvas.width = Math.round(origW * scale);
          offscreenCanvas.height = Math.round(origH * scale);

          drawMemeOnCanvas(offscreenCanvas, img, textBoxes, stickers, filter, watermark, filterIntensity);
          const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        } catch (_canvasErr) {
          // If tainted by CORS, return original imageSrc
          resolve(imageSrc);
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(imageSrc);
      };

      img.src = imageSrc;
    } catch (_err) {
      resolve(imageSrc);
    }
  });
}
