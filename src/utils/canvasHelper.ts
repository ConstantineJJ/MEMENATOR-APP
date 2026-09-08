import { TextBox, MemeSticker, MemeFilter } from '../types';

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

  // Apply filters
  ctx.save();
  if (filter === 'deepfry') {
    ctx.filter = 'contrast(155%) saturate(180%) brightness(105%)';
  } else if (filter === 'grayscale') {
    ctx.filter = 'grayscale(100%) contrast(120%)';
  } else if (filter === 'vintage') {
    ctx.filter = 'sepia(60%) contrast(115%) brightness(95%)';
  } else if (filter === 'contrast') {
    ctx.filter = 'contrast(150%) brightness(105%)';
  } else if (filter === 'warm') {
    ctx.filter = 'sepia(25%) saturate(140%)';
  } else if (filter === 'dramatic') {
    ctx.filter = 'contrast(160%) saturate(60%) brightness(90%) hue-rotate(200deg)';
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

  // Draw Stickers
  stickers.forEach((sticker) => {
    ctx.save();
    const xPos = (sticker.x / 100) * targetWidth;
    const yPos = (sticker.y / 100) * targetHeight;

    ctx.translate(xPos, yPos);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    const stickerScale = (sticker.scale || 1) * (targetWidth / 600);

    if (sticker.type === 'emoji' && sticker.emoji) {
      const emojiSize = Math.round(52 * stickerScale);
      ctx.font = `${emojiSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.emoji, 0, 0);
    } else if (sticker.type === 'sunglasses') {
      // Draw pixelated thug sunglasses
      const w = 120 * stickerScale;
      const h = 32 * stickerScale;
      ctx.fillStyle = '#000000';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      // Lens reflection highlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w / 2 + 10 * stickerScale, -h / 2 + 4 * stickerScale, 16 * stickerScale, 8 * stickerScale);
      ctx.fillRect(10 * stickerScale, -h / 2 + 4 * stickerScale, 16 * stickerScale, 8 * stickerScale);
      // Bridge & side arm
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-w / 2 - 12 * stickerScale, -h / 2 - 4 * stickerScale, 14 * stickerScale, 6 * stickerScale);
      ctx.fillRect(w / 2, -h / 2 - 4 * stickerScale, 14 * stickerScale, 6 * stickerScale);
    } else if (sticker.type === 'laser-eyes') {
      // Glowing red laser eye effect
      const radius = 24 * stickerScale;
      const grad = ctx.createRadialGradient(0, 0, 2 * stickerScale, 0, 0, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ff0033');
      grad.addColorStop(0.7, 'rgba(255, 0, 0, 0.6)');
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Laser beam flare lines
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.lineWidth = 3 * stickerScale;
      ctx.beginPath();
      ctx.moveTo(-radius * 1.8, 0);
      ctx.lineTo(radius * 1.8, 0);
      ctx.moveTo(0, -radius * 1.8);
      ctx.lineTo(0, radius * 1.8);
      ctx.stroke();
    } else if (sticker.type === 'badge') {
      const text = sticker.label || 'BRUH';
      const fontSize = Math.round(24 * stickerScale);
      ctx.font = `900 ${fontSize}px "Anton", Impact, sans-serif`;
      const textWidth = ctx.measureText(text).width;
      const padX = 12 * stickerScale;
      const padY = 5 * stickerScale;
      const bw = textWidth + padX * 2;
      const bh = fontSize + padY * 2;

      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 * stickerScale;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 6 * stickerScale;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(-bw / 2, -bh / 2, bw, bh, 6 * stickerScale);
      } else {
        ctx.rect(-bw / 2, -bh / 2, bw, bh);
      }
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 1);
    }
    ctx.restore();
  });

  // Draw Text Boxes
  const canvasScale = targetWidth / 600; // Normalizes font size relative to standard 600px width

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
    const maxTextWidth = targetWidth - padding * 2;
    const lines = wrapText(ctx, renderText, maxTextWidth);
    const lineHeight = computedFontSize * 1.18;
    const totalBlockHeight = lines.length * lineHeight;

    let posX = (box.x / 100) * targetWidth;
    let posY = (box.y / 100) * targetHeight;

    // Draw background banner if enabled (e.g. Modern Twitter/TikTok meme style)
    if (box.hasBackground) {
      ctx.fillStyle = box.bgColor || 'rgba(0, 0, 0, 0.75)';
      const bgPaddingY = 12 * canvasScale;
      const bgPaddingX = 16 * canvasScale;

      let bgX = 0;
      let bgWidth = targetWidth;

      // Banner stretches across the canvas
      ctx.fillRect(
        bgX,
        posY - totalBlockHeight / 2 - bgPaddingY,
        bgWidth,
        totalBlockHeight + bgPaddingY * 2
      );
    }

    lines.forEach((line, index) => {
      const lineY = posY - totalBlockHeight / 2 + index * lineHeight + lineHeight / 2;

      // Drop shadow / Colored shadow
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

      // Optional subtle stroke / outline (only if strokeWidth > 0)
      if (box.strokeWidth > 0 && !box.hasBackground) {
        // Draw crisp stroke without polluting the shadow
        const originalShadowColor = ctx.shadowColor;
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = box.strokeColor || '#000000';
        ctx.lineWidth = Math.max(1.5, Math.round(box.strokeWidth * canvasScale * (computedFontSize / 36)));
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, posX, lineY);
        ctx.shadowColor = originalShadowColor;
      }

      // Text Fill with vibrant color and rich shadow
      ctx.fillStyle = box.color || '#ffffff';
      ctx.fillText(line, posX, lineY);
    });

    ctx.restore();
  });

  // Optional subtle watermark
  if (watermark) {
    ctx.save();
    ctx.font = `600 ${Math.round(13 * canvasScale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'right';
    ctx.fillText('⚡ Memenator', targetWidth - 14 * canvasScale, targetHeight - 12 * canvasScale);
    ctx.restore();
  }
}
