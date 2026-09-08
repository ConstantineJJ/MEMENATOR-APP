import { RefObject, useCallback, useState } from 'react';
import { MemeFilter, MemeSticker, TextBox } from '../types';
import { drawMemeOnCanvas } from '../utils/canvasHelper';

export type MemeDownloadFormat = 'png' | 'jpeg';

interface UseCanvasExportOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  loadedImage: HTMLImageElement | null;
  textBoxes: TextBox[];
  stickers: MemeSticker[];
  filter: MemeFilter;
  filterIntensity: number;
  watermark: boolean;
}

async function waitForFonts() {
  if (!('fonts' in document)) return;
  try {
    await document.fonts.ready;
  } catch (error) {
    console.warn('Fonts ready wait warning:', error);
  }
}

/** Keeps export/copy side effects out of MemeCanvas so the viewport component
 * only owns image loading, interaction and overlays. Both paths force the same
 * pristine renderer used by the preview, preserving preview/export parity.
 */
export function useCanvasExport({
  canvasRef,
  loadedImage,
  textBoxes,
  stickers,
  filter,
  filterIntensity,
  watermark,
}: UseCanvasExportOptions) {
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<MemeDownloadFormat>('png');

  const renderPristine = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return null;
    await waitForFonts();
    drawMemeOnCanvas(
      canvas,
      loadedImage,
      textBoxes,
      stickers,
      filter,
      watermark,
      filterIntensity
    );
    return canvas;
  }, [canvasRef, filter, filterIntensity, loadedImage, stickers, textBoxes, watermark]);

  const handleDownload = useCallback(async () => {
    const canvas = await renderPristine();
    if (!canvas) return;

    const mime = downloadFormat === 'png' ? 'image/png' : 'image/jpeg';
    const quality = downloadFormat === 'jpeg' ? 0.95 : undefined;
    const link = document.createElement('a');
    link.download = `memenator-${Date.now()}.${downloadFormat}`;
    link.href = canvas.toDataURL(mime, quality);
    link.click();
  }, [downloadFormat, renderPristine]);

  const handleCopyClipboard = useCallback(async () => {
    const canvas = await renderPristine();
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch (clipboardError) {
        console.warn('Clipboard image write failed, falling back to data URL:', clipboardError);
        await navigator.clipboard.writeText(canvas.toDataURL('image/png'));
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
    }
  }, [renderPristine]);

  return {
    copied,
    downloadFormat,
    setDownloadFormat,
    handleDownload,
    handleCopyClipboard,
  };
}
