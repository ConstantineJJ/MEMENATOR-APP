import { MemeSticker } from '../types';

export function renderStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: MemeSticker,
  targetWidth: number,
  targetHeight: number
) {
  ctx.save();
  const xPos = (sticker.x / 100) * targetWidth;
  const yPos = (sticker.y / 100) * targetHeight;

  ctx.translate(xPos, yPos);
  ctx.rotate(((sticker.rotation || 0) * Math.PI) / 180);
  const scale = (sticker.scale || 1) * (targetWidth / 600);

  // Apply subtle realistic sticker drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 4 * scale;

  const sId = sticker.stickerId || sticker.type;

  if (sId === 'watermelon-boss' || (sticker.type === 'sticker-art' && sticker.emoji === '🍉')) {
    drawWatermelonMascot(ctx, scale);
  } else if (sticker.type === 'sunglasses' || sId === 'thug-sunglasses') {
    drawThugSunglasses(ctx, scale);
  } else if (sticker.type === 'laser-eyes' || sId.startsWith('laser-eyes')) {
    const isCyan = sId.includes('cyan') || sticker.emoji === '⚡';
    drawLaserEyes(ctx, scale, isCyan ? '#06b6d4' : '#ef4444');
  } else if (sId === 'gold-chain' || sticker.emoji === '💰') {
    drawGoldChain(ctx, scale);
  } else if (sId === 'king-crown' || sticker.emoji === '👑') {
    drawCrown(ctx, scale);
  } else if (sId === 'thug-joint' || sticker.emoji === '🚬') {
    drawJoint(ctx, scale);
  } else if (sticker.type === 'stamp' || sId.startsWith('badge-approved') || sId.startsWith('badge-top-secret') || sId.startsWith('badge-100') || sId.startsWith('badge-w')) {
    drawStamp(ctx, scale, sticker.label || 'APPROVED', sId);
  } else if (sticker.type === 'badge' || sId.startsWith('badge-')) {
    drawBadgePlate(ctx, scale, sticker.label || 'BRUH', sId);
  } else if (sticker.type === 'sticker-art' && sticker.emoji) {
    drawCharacterStickerArt(ctx, scale, sticker.emoji, sticker.label);
  } else {
    // Standard Emoji drawn as a real Die-Cut Vinyl Sticker with White Contour!
    drawEmojiDieCut(ctx, scale, sticker.emoji || '🔥');
  }

  ctx.restore();
}

/**
 * 🍉 Watermelon Boss Mascot (Die-Cut Sticker from ava.png)
 */
function drawWatermelonMascot(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  // 1. Thick White Die-Cut Silhouette Contour
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 10 * s;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, -45 * s);
  ctx.lineTo(44 * s, 32 * s);
  ctx.quadraticCurveTo(0, 48 * s, -44 * s, 32 * s);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Reset shadow for internal details
  ctx.shadowColor = 'transparent';

  // 2. Green Rind Arc
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.moveTo(-42 * s, 31 * s);
  ctx.quadraticCurveTo(0, 45 * s, 42 * s, 31 * s);
  ctx.lineTo(45 * s, 37 * s);
  ctx.quadraticCurveTo(0, 52 * s, -45 * s, 37 * s);
  ctx.closePath();
  ctx.fill();

  // 3. Yellow-White Inner Rind Stripe
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(-40 * s, 28 * s);
  ctx.quadraticCurveTo(0, 41 * s, 40 * s, 28 * s);
  ctx.lineTo(42 * s, 32 * s);
  ctx.quadraticCurveTo(0, 45 * s, -42 * s, 32 * s);
  ctx.closePath();
  ctx.fill();

  // 4. Red Watermelon Pulp with juicy gradient
  const redGrad = ctx.createLinearGradient(0, -40 * s, 0, 30 * s);
  redGrad.addColorStop(0, '#ff4766');
  redGrad.addColorStop(0.7, '#e11d48');
  redGrad.addColorStop(1, '#be123c');
  ctx.fillStyle = redGrad;

  ctx.beginPath();
  ctx.moveTo(0, -42 * s);
  ctx.lineTo(39 * s, 27 * s);
  ctx.quadraticCurveTo(0, 39 * s, -39 * s, 27 * s);
  ctx.closePath();
  ctx.fill();

  // 5. Watermelon Seeds
  ctx.fillStyle = '#18181b';
  const seedPositions = [
    { x: -2, y: -20, r: 2.2 },
    { x: -16, y: 12, r: 2.5 },
    { x: 18, y: 12, r: 2.5 },
    { x: -6, y: 22, r: 2.2 },
    { x: 8, y: 22, r: 2.2 },
  ];
  seedPositions.forEach((sd) => {
    ctx.beginPath();
    ctx.ellipse(sd.x * s, sd.y * s, sd.r * s, sd.r * 1.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. Cool Black Sunglasses
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.5 * s;

  // Left lens
  ctx.beginPath();
  ctx.moveTo(-24 * s, -3 * s);
  ctx.lineTo(-4 * s, -4 * s);
  ctx.lineTo(-6 * s, 8 * s);
  ctx.lineTo(-22 * s, 7 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right lens
  ctx.beginPath();
  ctx.moveTo(4 * s, -4 * s);
  ctx.lineTo(24 * s, -3 * s);
  ctx.lineTo(22 * s, 7 * s);
  ctx.lineTo(6 * s, 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sunglasses Bridge & Arms
  ctx.lineWidth = 3.5 * s;
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(-5 * s, -2 * s);
  ctx.lineTo(5 * s, -2 * s);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-24 * s, 1 * s);
  ctx.lineTo(-33 * s, 4 * s);
  ctx.moveTo(24 * s, 1 * s);
  ctx.lineTo(33 * s, 4 * s);
  ctx.stroke();

  // Lens White Glare Lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8 * s;
  ctx.beginPath();
  ctx.moveTo(-20 * s, 0);
  ctx.lineTo(-11 * s, -1 * s);
  ctx.moveTo(9 * s, -1 * s);
  ctx.lineTo(18 * s, 0);
  ctx.stroke();

  // 7. Smug Smirking Smile
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.8 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8 * s, 16 * s);
  ctx.quadraticCurveTo(0, 22 * s, 12 * s, 15 * s);
  ctx.stroke();

  // 8. Stick Legs & Hands
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3.2 * s;
  // Left Leg
  ctx.beginPath();
  ctx.moveTo(-22 * s, 42 * s);
  ctx.lineTo(-28 * s, 54 * s);
  ctx.lineTo(-38 * s, 52 * s);
  ctx.stroke();

  // Right Leg
  ctx.beginPath();
  ctx.moveTo(22 * s, 42 * s);
  ctx.lineTo(28 * s, 54 * s);
  ctx.lineTo(38 * s, 52 * s);
  ctx.stroke();

  // Left Hand
  ctx.beginPath();
  ctx.moveTo(-36 * s, 30 * s);
  ctx.lineTo(-46 * s, 46 * s);
  ctx.stroke();

  // Right Hand
  ctx.beginPath();
  ctx.moveTo(36 * s, 30 * s);
  ctx.lineTo(46 * s, 46 * s);
  ctx.stroke();

  ctx.restore();
}

/**
 * 🕶️ Thug Life Sunglasses with White Die-Cut Contour
 */
function drawThugSunglasses(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const w = 130 * scale;
  const h = 34 * scale;

  // White Die-cut backing outline
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-w / 2 - 5 * scale, -h / 2 - 5 * scale, w + 10 * scale, h + 10 * scale);

  ctx.shadowColor = 'transparent';
  // Black Frame
  ctx.fillStyle = '#000000';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // White Pixel Highlights
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w / 2 + 10 * scale, -h / 2 + 4 * scale, 16 * scale, 8 * scale);
  ctx.fillRect(10 * scale, -h / 2 + 4 * scale, 16 * scale, 8 * scale);
  ctx.fillRect(-w / 2 + 30 * scale, -h / 2 + 14 * scale, 8 * scale, 8 * scale);
  ctx.fillRect(30 * scale, -h / 2 + 14 * scale, 8 * scale, 8 * scale);

  // Side Arms
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-w / 2 - 14 * scale, -h / 2 - 4 * scale, 16 * scale, 7 * scale);
  ctx.fillRect(w / 2 - 2 * scale, -h / 2 - 4 * scale, 16 * scale, 7 * scale);

  ctx.restore();
}

/**
 * 🔴 Laser Eyes Effect
 */
function drawLaserEyes(ctx: CanvasRenderingContext2D, scale: number, colorHex: string) {
  ctx.save();
  const radius = 28 * scale;

  const grad = ctx.createRadialGradient(0, 0, 3 * scale, 0, 0, radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, colorHex);
  grad.addColorStop(0.7, colorHex + '99');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Cross glare flare
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.6, 0);
  ctx.lineTo(radius * 1.6, 0);
  ctx.moveTo(0, -radius * 1.6);
  ctx.lineTo(0, radius * 1.6);
  ctx.stroke();

  ctx.restore();
}

/**
 * 💰 Gold Chain with $ Pendant
 */
function drawGoldChain(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.9;

  // White Die-cut backing
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 10 * s;
  ctx.beginPath();
  ctx.arc(0, -10 * s, 32 * s, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  // Gold Chain Links
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.arc(0, -10 * s, 32 * s, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Gold Dollar Medallion
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 30 * s, 22 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.arc(0, 30 * s, 18 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Dollar Sign
  ctx.fillStyle = '#78350f';
  ctx.font = `900 ${22 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 31 * s);

  ctx.restore();
}

/**
 * 👑 King Crown
 */
function drawCrown(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.9;

  // White die-cut outline
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8 * s;
  ctx.beginPath();
  ctx.moveTo(-32 * s, 20 * s);
  ctx.lineTo(-40 * s, -14 * s);
  ctx.lineTo(-18 * s, 0);
  ctx.lineTo(0, -22 * s);
  ctx.lineTo(18 * s, 0);
  ctx.lineTo(40 * s, -14 * s);
  ctx.lineTo(32 * s, 20 * s);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  ctx.shadowColor = 'transparent';
  // Gold Crown fill
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(-30 * s, 18 * s);
  ctx.lineTo(-38 * s, -12 * s);
  ctx.lineTo(-16 * s, 0);
  ctx.lineTo(0, -20 * s);
  ctx.lineTo(16 * s, 0);
  ctx.lineTo(38 * s, -12 * s);
  ctx.lineTo(30 * s, 18 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jewels on points
  const jewelColors = ['#ef4444', '#3b82f6', '#10b981'];
  [-38, 0, 38].forEach((x, i) => {
    ctx.fillStyle = jewelColors[i];
    ctx.beginPath();
    ctx.arc(x * s, (i === 1 ? -20 : -12) * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/**
 * 🚬 Thug Lit Joint
 */
function drawJoint(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.85;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-26 * s, -8 * s, 54 * s, 16 * s);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5 * s;
  ctx.fillRect(-22 * s, -5 * s, 44 * s, 10 * s);
  ctx.strokeRect(-22 * s, -5 * s, 44 * s, 10 * s);

  // Lit burning tip
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(22 * s, -5 * s, 6 * s, 10 * s);

  // Smoke Puff
  ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
  ctx.beginPath();
  ctx.arc(36 * s, -10 * s, 8 * s, 0, Math.PI * 2);
  ctx.arc(44 * s, -16 * s, 10 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 🏷️ Stamps (APPROVED, TOP SECRET, 100% REAL)
 */
function drawStamp(ctx: CanvasRenderingContext2D, scale: number, text: string, id: string) {
  ctx.save();
  const s = scale * 0.9;
  const isApproved = id.includes('approved') || id.includes('w');
  const stampColor = isApproved ? '#10b981' : '#ef4444';

  // White Die-cut backing plate
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(-60 * s, -26 * s, 120 * s, 52 * s, 8 * s);
  } else {
    ctx.rect(-60 * s, -26 * s, 120 * s, 52 * s);
  }
  ctx.fill();

  ctx.shadowColor = 'transparent';
  // Stamp Border
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 3.5 * s;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(-54 * s, -20 * s, 108 * s, 40 * s, 6 * s);
  } else {
    ctx.rect(-54 * s, -20 * s, 108 * s, 40 * s);
  }
  ctx.stroke();

  // Stamp Text
  ctx.fillStyle = stampColor;
  ctx.font = `900 ${16 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, 1 * s);

  ctx.restore();
}

/**
 * 🏷️ Badge Plates (BRUH, БАЗА, КРИНЖ, CENSORED)
 */
function drawBadgePlate(ctx: CanvasRenderingContext2D, scale: number, text: string, id: string) {
  ctx.save();
  const s = scale * 0.9;

  let bgColor = '#e11d48';
  if (id.includes('base')) bgColor = '#059669';
  if (id.includes('cringe')) bgColor = '#9333ea';
  if (id.includes('censored')) bgColor = '#000000';
  if (id.includes('scam')) bgColor = '#d97706';
  if (id.includes('press-f')) bgColor = '#2563eb';

  const fontSize = Math.round(20 * s);
  ctx.font = `900 ${fontSize}px "Anton", Impact, "Arial Black", sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const padX = 14 * s;
  const bw = Math.max(70 * s, textWidth + padX * 2);
  const bh = 34 * s;

  // White Die-cut vinyl contour
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(-bw / 2 - 4 * s, -bh / 2 - 4 * s, bw + 8 * s, bh + 8 * s, 10 * s);
  } else {
    ctx.rect(-bw / 2 - 4 * s, -bh / 2 - 4 * s, bw + 8 * s, bh + 8 * s);
  }
  ctx.fill();

  ctx.shadowColor = 'transparent';
  // Badge Fill
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(-bw / 2, -bh / 2, bw, bh, 7 * s);
  } else {
    ctx.rect(-bw / 2, -bh / 2, bw, bh);
  }
  ctx.fill();

  // White Text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1 * s);

  ctx.restore();
}

/**
 * 🐸 Character Meme Stickers (Pepe, Doge, Chad, Shrek, etc.)
 */
function drawCharacterStickerArt(ctx: CanvasRenderingContext2D, scale: number, emoji: string, label: string) {
  drawEmojiDieCut(ctx, scale, emoji);
}

/**
 * ⭐ Authentic Die-Cut Vinyl Sticker with White Contour & Drop Shadow for Emojis
 */
function drawEmojiDieCut(ctx: CanvasRenderingContext2D, scale: number, emoji: string) {
  ctx.save();
  const s = scale * 0.95;
  const badgeRadius = 30 * s;

  // 1. Thick White Die-Cut Circular/Silhouette Vinyl Contour
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Subtle inner glossy border
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.arc(0, 0, badgeRadius - 2 * s, 0, Math.PI * 2);
  ctx.stroke();

  // 2. High-res Crisp Emoji Glyph Centered
  const emojiSize = Math.round(40 * s);
  ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 2 * s);

  ctx.restore();
}
