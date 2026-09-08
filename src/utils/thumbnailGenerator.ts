import { TextBox, MemeSticker, MemeFilter } from '../types';
import { drawMemeOnCanvas } from './canvasHelper';

/**
 * Generates a genuinely compact dataURL thumbnail from the current meme state.
 * drawMemeOnCanvas intentionally renders at export quality, so we render to a
 * temporary full-quality canvas first and then downscale into a small thumbnail.
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
    let settled = false;

    const finish = (value: string) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeoutId = setTimeout(() => {
        finish(imageSrc);
      }, 2500);

      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          // Render the meme exactly as the main canvas/export renderer does.
          const renderCanvas = document.createElement('canvas');
          drawMemeOnCanvas(
            renderCanvas,
            img,
            textBoxes,
            stickers,
            filter,
            watermark,
            filterIntensity
          );

          // Then downscale the completed render. This avoids drawMemeOnCanvas
          // overwriting thumbnail dimensions with its 900-1400px render size.
          const maxDim = 240;
          const renderW = renderCanvas.width || 600;
          const renderH = renderCanvas.height || 600;
          const scale = Math.min(maxDim / renderW, maxDim / renderH, 1);

          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = Math.max(1, Math.round(renderW * scale));
          thumbCanvas.height = Math.max(1, Math.round(renderH * scale));

          const thumbCtx = thumbCanvas.getContext('2d');
          if (!thumbCtx) {
            finish(imageSrc);
            return;
          }

          thumbCtx.imageSmoothingEnabled = true;
          thumbCtx.imageSmoothingQuality = 'high';
          thumbCtx.drawImage(renderCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

          finish(thumbCanvas.toDataURL('image/jpeg', 0.76));
        } catch (_canvasErr) {
          // If canvas security/CORS blocks rendering, keep a usable image reference.
          finish(imageSrc);
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        finish(imageSrc);
      };

      img.src = imageSrc;
    } catch (_err) {
      finish(imageSrc);
    }
  });
}
