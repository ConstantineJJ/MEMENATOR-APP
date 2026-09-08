import { TextBox, MemeSticker, MemeFilter } from '../types';
import { renderStickerOnCanvas } from './stickerRenderer';

export interface TextBoxBoundsInfo {
  width: number;
  height: number;
  lines: string[];
  lineHeight: number;
  totalBlockHeight: number;
  maxLineWidth: number;
  canvasScale: number;
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const rawLines = text.split('\n');

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      lines.push('');
      continue;
    }

    const words = rawLine.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const width = ctx.measureText(testLine).width;
      if (width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Accurately measures the bounding dimensions of a multi-line text box
 */
export function measureTextBoxBounds(
  box: TextBox,
  targetWidth: number,
  targetHeight: number
): TextBoxBoundsInfo {
  const canvasScale = targetWidth / 600;
  const computedFontSize = Math.max(12, Math.round(box.fontSize * canvasScale));
  const fontWeight = box.isBold ? '900' : '700';

  // Use an offscreen dummy canvas context for measurement
  const offCanvas = document.createElement('canvas');
  const ctx = offCanvas.getContext('2d');
  if (!ctx) {
    return {
      width: 140,
      height: 40,
      lines: [box.text],
      lineHeight: computedFontSize * 1.18,
      totalBlockHeight: computedFontSize * 1.18,
      maxLineWidth: 140,
      canvasScale,
    };
  }

  ctx.font = `${fontWeight} ${computedFontSize}px "${box.fontFamily}", Impact, "Arial Black", sans-serif`;

  const renderText = box.isUppercase ? box.text.toUpperCase() : box.text;
  const padding = 24 * canvasScale;
  const maxTextWidth = Math.max(100, targetWidth - padding * 2);
  const lines = wrapText(ctx, renderText, maxTextWidth);
  const lineHeight = computedFontSize * 1.18;
  const totalBlockHeight = Math.max(lineHeight, lines.length * lineHeight);

  let maxLineWidth = 0;
  lines.forEach((line) => {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  });

  return {
    width: maxLineWidth,
    height: totalBlockHeight,
    lines,
    lineHeight,
    totalBlockHeight,
    maxLineWidth,
    canvasScale,
  };
}

export function drawMemeOnCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  textBoxes: TextBox[],
  stickers: MemeSticker[],
  filter: MemeFilter,
  watermark: boolean = false,
  filterIntensity: number = 100
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Base canvas size on original image aspect ratio
  const originalWidth = image.naturalWidth || image.width || 800;
  const originalHeight = image.naturalHeight || image.height || 600;

  // Render at crisp resolution (normalize so small uploaded images render ultra-crisp and large images don't exceed memory)
  const minDimension = 900;
  const maxDimension = 1400;
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (targetWidth < minDimension && targetHeight < minDimension) {
    const scaleUp = minDimension / Math.max(targetWidth, targetHeight);
    targetWidth = Math.round(targetWidth * scaleUp);
    targetHeight = Math.round(targetHeight * scaleUp);
  } else if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scaleDown = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
    targetWidth = Math.round(targetWidth * scaleDown);
    targetHeight = Math.round(targetHeight * scaleDown);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  const intensity = Math.max(0, Math.min(100, filterIntensity)) / 100;

  // Apply curated filters with intensity scaling
  ctx.save();
  if (filter === 'deepfry') {
    const contrast = 100 + 70 * intensity;
    const saturate = 100 + 120 * intensity;
    const brightness = 100 + 8 * intensity;
    ctx.filter = `contrast(${contrast}%) saturate(${saturate}%) brightness(${brightness}%)`;
  } else if (filter === 'vhs') {
    const sepia = 35 * intensity;
    const saturate = 100 + 40 * intensity;
    const contrast = 100 + 25 * intensity;
    const hue = 345 * intensity;
    ctx.filter = `sepia(${sepia}%) saturate(${saturate}%) contrast(${contrast}%) hue-rotate(${hue}deg)`;
  } else if (filter === 'grayscale') {
    const gray = 100 * intensity;
    const contrast = 100 + 30 * intensity;
    const brightness = 100 - 5 * intensity;
    ctx.filter = `grayscale(${gray}%) contrast(${contrast}%) brightness(${brightness}%)`;
  } else if (filter === 'vintage') {
    const sepia = 65 * intensity;
    const contrast = 100 + 15 * intensity;
    const brightness = 100 - 8 * intensity;
    ctx.filter = `sepia(${sepia}%) contrast(${contrast}%) brightness(${brightness}%)`;
  } else if (filter === 'contrast') {
    const contrast = 100 + 50 * intensity;
    const brightness = 100 + 5 * intensity;
    ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
  } else if (filter === 'warm') {
    const sepia = 25 * intensity;
    const saturate = 100 + 50 * intensity;
    const brightness = 100 + 3 * intensity;
    ctx.filter = `sepia(${sepia}%) saturate(${saturate}%) brightness(${brightness}%)`;
  } else if (filter === 'dramatic') {
    const contrast = 100 + 65 * intensity;
    const saturate = 100 - 25 * intensity;
    const brightness = 100 - 10 * intensity;
    const hue = 190 * intensity;
    ctx.filter = `contrast(${contrast}%) saturate(${saturate}%) brightness(${brightness}%) hue-rotate(${hue}deg)`;
  } else if (filter === 'cyberpunk') {
    const contrast = 100 + 50 * intensity;
    const saturate = 100 + 90 * intensity;
    const hue = 280 * intensity;
    ctx.filter = `contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg)`;
  } else if (filter === 'vivid') {
    const saturate = 100 + 100 * intensity;
    const contrast = 100 + 25 * intensity;
    const brightness = 100 + 4 * intensity;
    ctx.filter = `saturate(${saturate}%) contrast(${contrast}%) brightness(${brightness}%)`;
  } else if (filter === 'toxic') {
    const contrast = 100 + 80 * intensity;
    const saturate = 100 + 100 * intensity;
    const hue = 90 * intensity;
    const brightness = 100 + 10 * intensity;
    ctx.filter = `contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg) brightness(${brightness}%)`;
  } else if (filter === 'vignette') {
    const contrast = 100 + 25 * intensity;
    const brightness = 100 - 5 * intensity;
    ctx.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
  } else {
    ctx.filter = 'none';
  }

  // Draw background image
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // Draw Vignette overlay if active
  if (filter === 'vignette' && intensity > 0) {
    ctx.save();
    const radius = Math.max(targetWidth, targetHeight) * 0.7;
    const vigGrad = ctx.createRadialGradient(
      targetWidth / 2,
      targetHeight / 2,
      radius * 0.35,
      targetWidth / 2,
      targetHeight / 2,
      radius
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.75, `rgba(0, 0, 0, ${0.45 * intensity})`);
    vigGrad.addColorStop(1, `rgba(0, 0, 0, ${0.88 * intensity})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.restore();
  }

  // Draw Stickers using dedicated Die-Cut Sticker Renderer
  stickers.forEach((sticker) => {
    renderStickerOnCanvas(ctx, sticker, targetWidth, targetHeight);
  });

  // Draw Text Boxes with Outer / Inner stroke support
  const canvasScale = targetWidth / 600;

  textBoxes.forEach((box) => {
    if (!box.text.trim()) return;

    ctx.save();
    const renderText = box.isUppercase ? box.text.toUpperCase() : box.text;
    const computedFontSize = Math.max(12, Math.round(box.fontSize * canvasScale));
    const fontWeight = box.isBold ? '900' : '700';

    ctx.font = `${fontWeight} ${computedFontSize}px "${box.fontFamily}", Impact, "Arial Black", sans-serif`;
    ctx.textAlign = box.textAlign;
    ctx.textBaseline = 'middle';

    const padding = 24 * canvasScale;
    const maxTextWidth = Math.max(100, targetWidth - padding * 2);
    const lines = wrapText(ctx, renderText, maxTextWidth);
    const lineHeight = computedFontSize * 1.18;
    const totalBlockHeight = lines.length * lineHeight;

    const posX = (box.x / 100) * targetWidth;
    const posY = (box.y / 100) * targetHeight;

    // Draw background banner if enabled (e.g. Modern Twitter/TikTok meme style)
    if (box.hasBackground) {
      ctx.fillStyle = box.bgColor || 'rgba(0, 0, 0, 0.75)';
      const bgPaddingY = 12 * canvasScale;
      const bgX = 0;
      const bgWidth = targetWidth;

      ctx.fillRect(
        bgX,
        posY - totalBlockHeight / 2 - bgPaddingY,
        bgWidth,
        totalBlockHeight + bgPaddingY * 2
      );
    }

    const strokeType = box.strokeType || 'outer';
    const hasStroke = box.strokeWidth > 0 && !box.hasBackground;

    lines.forEach((line, index) => {
      const lineY = posY - totalBlockHeight / 2 + index * lineHeight + lineHeight / 2;

      // Drop shadow configuration
      const applyShadow = () => {
        if (box.shadow) {
          ctx.shadowColor = box.shadowColor || 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = (box.shadowBlur !== undefined ? box.shadowBlur : 14) * canvasScale;
          ctx.shadowOffsetX = (box.shadowOffsetX !== undefined ? box.shadowOffsetX : 2) * canvasScale;
          ctx.shadowOffsetY = (box.shadowOffsetY !== undefined ? box.shadowOffsetY : 3) * canvasScale;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
      };

      if (hasStroke) {
        if (strokeType === 'outer') {
          // 1. Outer Stroke: Draw thick stroke behind text fill, then fill on top
          applyShadow();
          ctx.strokeStyle = box.strokeColor || '#000000';
          ctx.lineWidth = Math.max(1.5, Math.round(box.strokeWidth * 2.2 * canvasScale * (computedFontSize / 32)));
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(line, posX, lineY);

          // Fill text crisply on top without shadow bleeding
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = box.color || '#ffffff';
          ctx.fillText(line, posX, lineY);
        } else if (strokeType === 'inner') {
          // 2. Inner Stroke: First fill text with shadow, then overlay crisp stroke on top
          applyShadow();
          ctx.fillStyle = box.color || '#ffffff';
          ctx.fillText(line, posX, lineY);

          // Overlay inner stroke
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = box.strokeColor || '#000000';
          ctx.lineWidth = Math.max(1, Math.round(box.strokeWidth * 1.0 * canvasScale * (computedFontSize / 36)));
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(line, posX, lineY);
        } else {
          // None or center
          applyShadow();
          ctx.fillStyle = box.color || '#ffffff';
          ctx.fillText(line, posX, lineY);
        }
      } else {
        // Standard Fill with Shadow
        applyShadow();
        ctx.fillStyle = box.color || '#ffffff';
        ctx.fillText(line, posX, lineY);
      }
    });

    ctx.restore();
  });

  // Watermark
  if (watermark) {
    ctx.save();
    ctx.font = `800 ${Math.round(14 * canvasScale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'right';
    ctx.fillText('🍉 MEMENATOR', targetWidth - 14 * canvasScale, targetHeight - 14 * canvasScale);
    ctx.restore();
  }
}
