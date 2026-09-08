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
  watermark: boolean = false
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Base canvas size on original image aspect ratio
  const originalWidth = image.naturalWidth || image.width || 800;
  const originalHeight = image.naturalHeight || image.height || 600;

  // Render at crisp resolution (e.g. max 1200px width for sharp exports)
  const maxDimension = 1200;
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // Apply curated filters
  ctx.save();
  if (filter === 'deepfry') {
    ctx.filter = 'contrast(170%) saturate(220%) brightness(108%)';
  } else if (filter === 'vhs') {
    ctx.filter = 'sepia(35%) saturate(140%) contrast(125%) hue-rotate(345deg)';
  } else if (filter === 'grayscale') {
    ctx.filter = 'grayscale(100%) contrast(130%) brightness(95%)';
  } else if (filter === 'vintage') {
    ctx.filter = 'sepia(65%) contrast(115%) brightness(92%)';
  } else if (filter === 'contrast') {
    ctx.filter = 'contrast(150%) brightness(105%)';
  } else if (filter === 'warm') {
    ctx.filter = 'sepia(25%) saturate(150%) brightness(103%)';
  } else if (filter === 'dramatic') {
    ctx.filter = 'contrast(165%) saturate(75%) brightness(90%) hue-rotate(190deg)';
  } else if (filter === 'cyberpunk') {
    ctx.filter = 'contrast(150%) saturate(190%) hue-rotate(280deg)';
  } else if (filter === 'vivid') {
    ctx.filter = 'saturate(200%) contrast(125%) brightness(104%)';
  } else if (filter === 'toxic') {
    ctx.filter = 'contrast(180%) saturate(200%) hue-rotate(90deg) brightness(110%)';
  } else if (filter === 'vignette') {
    ctx.filter = 'contrast(125%) brightness(95%)';
  } else {
    ctx.filter = 'none';
  }

  // Draw background image
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // Draw Vignette overlay if active
  if (filter === 'vignette') {
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
    vigGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.45)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
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
