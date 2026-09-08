import { MemeSticker } from '../types';

function withRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function setSoftStickerShadow(ctx: CanvasRenderingContext2D, scale: number, strength = 0.42) {
  ctx.shadowColor = `rgba(0, 0, 0, ${strength})`;
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 4 * scale;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

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
  setSoftStickerShadow(ctx, scale);

  const sId = sticker.stickerId || sticker.type;

  if (sId === 'watermelon-boss' || (sticker.type === 'sticker-art' && sticker.emoji === '🍉')) {
    drawWatermelonMascot(ctx, scale);
  } else if (sticker.type === 'sunglasses' || sId === 'thug-sunglasses') {
    drawThugSunglasses(ctx, scale);
  } else if (sticker.type === 'laser-eyes' || sId.startsWith('laser-eyes')) {
    const isCyan = sId.includes('cyan') || sticker.emoji === '⚡';
    drawLaserEyes(ctx, scale, isCyan ? '#22d3ee' : '#fb3b4a');
  } else if (sId === 'gold-chain' || sticker.emoji === '💰') {
    drawGoldChain(ctx, scale);
  } else if (sId === 'king-crown' || sticker.emoji === '👑') {
    drawCrown(ctx, scale);
  } else if (sId === 'thug-joint' || sticker.emoji === '🚬') {
    drawJoint(ctx, scale);
  } else if (
    sticker.type === 'stamp' ||
    sId.startsWith('badge-approved') ||
    sId.startsWith('badge-top-secret') ||
    sId.startsWith('badge-100') ||
    sId.startsWith('badge-w')
  ) {
    drawStamp(ctx, scale, sticker.label || 'APPROVED', sId);
  } else if (sticker.type === 'badge' || sId.startsWith('badge-')) {
    drawBadgePlate(ctx, scale, sticker.label || 'BRUH', sId);
  } else if (sticker.type === 'sticker-art' && sticker.emoji) {
    drawCharacterStickerArt(ctx, scale, sticker.emoji);
  } else {
    drawEmojiSticker(ctx, scale, sticker.emoji || '🔥');
  }

  ctx.restore();
}

function drawWatermelonMascot(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Compact dark outline instead of a giant white die-cut silhouette.
  ctx.strokeStyle = 'rgba(9, 9, 11, 0.88)';
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(0, -44 * s);
  ctx.lineTo(43 * s, 31 * s);
  ctx.quadraticCurveTo(0, 47 * s, -43 * s, 31 * s);
  ctx.closePath();
  ctx.stroke();

  const pulp = ctx.createLinearGradient(0, -42 * s, 0, 32 * s);
  pulp.addColorStop(0, '#ff607a');
  pulp.addColorStop(0.62, '#ef2951');
  pulp.addColorStop(1, '#be123c');
  ctx.fillStyle = pulp;
  ctx.beginPath();
  ctx.moveTo(0, -42 * s);
  ctx.lineTo(39 * s, 27 * s);
  ctx.quadraticCurveTo(0, 39 * s, -39 * s, 27 * s);
  ctx.closePath();
  ctx.fill();

  clearShadow(ctx);

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(-40 * s, 27 * s);
  ctx.quadraticCurveTo(0, 40 * s, 40 * s, 27 * s);
  ctx.lineTo(42 * s, 32 * s);
  ctx.quadraticCurveTo(0, 44 * s, -42 * s, 32 * s);
  ctx.closePath();
  ctx.fill();

  const rind = ctx.createLinearGradient(0, 30 * s, 0, 48 * s);
  rind.addColorStop(0, '#22c55e');
  rind.addColorStop(1, '#15803d');
  ctx.fillStyle = rind;
  ctx.beginPath();
  ctx.moveTo(-42 * s, 31 * s);
  ctx.quadraticCurveTo(0, 45 * s, 42 * s, 31 * s);
  ctx.lineTo(45 * s, 37 * s);
  ctx.quadraticCurveTo(0, 51 * s, -45 * s, 37 * s);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#18181b';
  const seeds: Array<[number, number, number]> = [
    [-2, -19, 2.2],
    [-16, 10, 2.4],
    [18, 10, 2.4],
    [-7, 20, 2.1],
    [8, 20, 2.1],
  ];
  seeds.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, r * s, r * 1.45 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Sunglasses.
  ctx.fillStyle = '#050505';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(-24 * s, -3 * s);
  ctx.lineTo(-4 * s, -4 * s);
  ctx.lineTo(-6 * s, 8 * s);
  ctx.lineTo(-22 * s, 7 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(4 * s, -4 * s);
  ctx.lineTo(24 * s, -3 * s);
  ctx.lineTo(22 * s, 7 * s);
  ctx.lineTo(6 * s, 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = 3 * s;
  ctx.strokeStyle = '#050505';
  ctx.beginPath();
  ctx.moveTo(-5 * s, -2 * s);
  ctx.lineTo(5 * s, -2 * s);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(-20 * s, 0);
  ctx.lineTo(-12 * s, -1 * s);
  ctx.moveTo(9 * s, -1 * s);
  ctx.lineTo(17 * s, 0);
  ctx.stroke();

  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 2.6 * s;
  ctx.beginPath();
  ctx.moveTo(-8 * s, 16 * s);
  ctx.quadraticCurveTo(0, 22 * s, 12 * s, 15 * s);
  ctx.stroke();

  // Tiny arms/legs retain the mascot feel without turning into a white blob.
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(-21 * s, 41 * s);
  ctx.lineTo(-28 * s, 53 * s);
  ctx.lineTo(-37 * s, 51 * s);
  ctx.moveTo(21 * s, 41 * s);
  ctx.lineTo(28 * s, 53 * s);
  ctx.lineTo(37 * s, 51 * s);
  ctx.moveTo(-36 * s, 29 * s);
  ctx.lineTo(-46 * s, 44 * s);
  ctx.moveTo(36 * s, 29 * s);
  ctx.lineTo(46 * s, 44 * s);
  ctx.stroke();

  ctx.restore();
}

function drawThugSunglasses(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale;
  const w = 130 * s;
  const h = 34 * s;

  // Pixel glasses should look like an accessory, not a white rectangle sticker.
  const lens = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  lens.addColorStop(0, '#18181b');
  lens.addColorStop(1, '#020202');
  ctx.fillStyle = lens;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5 * s;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  clearShadow(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(-w / 2 + 10 * s, -h / 2 + 4 * s, 16 * s, 7 * s);
  ctx.fillRect(10 * s, -h / 2 + 4 * s, 16 * s, 7 * s);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-w / 2 - 14 * s, -h / 2 - 3 * s, 16 * s, 7 * s);
  ctx.fillRect(w / 2 - 2 * s, -h / 2 - 3 * s, 16 * s, 7 * s);

  ctx.restore();
}

function drawLaserEyes(ctx: CanvasRenderingContext2D, scale: number, colorHex: string) {
  ctx.save();
  const radius = 30 * scale;

  clearShadow(ctx);
  const glow = ctx.createRadialGradient(0, 0, 2 * scale, 0, 0, radius);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(0.16, colorHex);
  glow.addColorStop(0.48, `${colorHex}bb`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4 * scale;
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 12 * scale;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.8, 0);
  ctx.lineTo(radius * 1.8, 0);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.3 * scale;
  ctx.shadowBlur = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.65, 0);
  ctx.lineTo(radius * 1.65, 0);
  ctx.stroke();

  ctx.restore();
}

function drawGoldChain(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.92;

  // Chain with a dark under-stroke gives separation on any photo without a white halo.
  ctx.strokeStyle = 'rgba(69, 26, 3, 0.72)';
  ctx.lineWidth = 8 * s;
  ctx.beginPath();
  ctx.arc(0, -10 * s, 33 * s, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  const goldStroke = ctx.createLinearGradient(-30 * s, -20 * s, 30 * s, 20 * s);
  goldStroke.addColorStop(0, '#f59e0b');
  goldStroke.addColorStop(0.45, '#fde047');
  goldStroke.addColorStop(1, '#d97706');
  ctx.strokeStyle = goldStroke;
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.arc(0, -10 * s, 33 * s, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  clearShadow(ctx);
  const medallion = ctx.createRadialGradient(-6 * s, 23 * s, 2 * s, 0, 30 * s, 22 * s);
  medallion.addColorStop(0, '#fff7a8');
  medallion.addColorStop(0.35, '#facc15');
  medallion.addColorStop(1, '#d97706');
  ctx.fillStyle = medallion;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.arc(0, 30 * s, 20 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.arc(-3 * s, 27 * s, 13 * s, Math.PI * 1.08, Math.PI * 1.72);
  ctx.stroke();

  ctx.fillStyle = '#713f12';
  ctx.font = `900 ${22 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 31 * s);

  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.92;

  ctx.strokeStyle = 'rgba(69, 26, 3, 0.82)';
  ctx.lineWidth = 4 * s;
  const crownPath = () => {
    ctx.beginPath();
    ctx.moveTo(-31 * s, 19 * s);
    ctx.lineTo(-39 * s, -13 * s);
    ctx.lineTo(-17 * s, 0);
    ctx.lineTo(0, -22 * s);
    ctx.lineTo(17 * s, 0);
    ctx.lineTo(39 * s, -13 * s);
    ctx.lineTo(31 * s, 19 * s);
    ctx.closePath();
  };
  crownPath();
  ctx.stroke();

  const gold = ctx.createLinearGradient(0, -22 * s, 0, 21 * s);
  gold.addColorStop(0, '#fff176');
  gold.addColorStop(0.45, '#fbbf24');
  gold.addColorStop(1, '#d97706');
  ctx.fillStyle = gold;
  crownPath();
  ctx.fill();

  clearShadow(ctx);
  const jewels = [
    { x: -37, y: -11, color: '#fb7185' },
    { x: 0, y: -20, color: '#60a5fa' },
    { x: 37, y: -11, color: '#34d399' },
  ];
  jewels.forEach(({ x, y, color }) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x * s, y * s, 3.7 * s, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawJoint(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.86;

  const paper = ctx.createLinearGradient(-22 * s, 0, 22 * s, 0);
  paper.addColorStop(0, '#f8fafc');
  paper.addColorStop(0.7, '#e2e8f0');
  paper.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = paper;
  ctx.strokeStyle = 'rgba(51,65,85,0.8)';
  ctx.lineWidth = 1.5 * s;
  withRoundedRect(ctx, -24 * s, -5 * s, 48 * s, 10 * s, 4 * s);
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = '#7c2d12';
  withRoundedRect(ctx, 18 * s, -5 * s, 7 * s, 10 * s, 2 * s);
  ctx.fill();
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(25 * s, 0, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(226,232,240,0.55)';
  ctx.beginPath();
  ctx.arc(34 * s, -10 * s, 7 * s, 0, Math.PI * 2);
  ctx.arc(42 * s, -17 * s, 9 * s, 0, Math.PI * 2);
  ctx.arc(51 * s, -24 * s, 7 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStamp(ctx: CanvasRenderingContext2D, scale: number, text: string, id: string) {
  ctx.save();
  const s = scale * 0.9;
  const isApproved = id.includes('approved') || id.includes('w');
  const color = isApproved ? '#10b981' : '#ef4444';

  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 6 * s;
  withRoundedRect(ctx, -56 * s, -22 * s, 112 * s, 44 * s, 8 * s);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5 * s;
  withRoundedRect(ctx, -54 * s, -20 * s, 108 * s, 40 * s, 7 * s);
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = `${color}22`;
  withRoundedRect(ctx, -53 * s, -19 * s, 106 * s, 38 * s, 6 * s);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.font = `900 ${16 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, 1 * s);

  ctx.restore();
}

function drawBadgePlate(ctx: CanvasRenderingContext2D, scale: number, text: string, id: string) {
  ctx.save();
  const s = scale * 0.9;

  let bgColor = '#e11d48';
  if (id.includes('base')) bgColor = '#059669';
  if (id.includes('cringe')) bgColor = '#9333ea';
  if (id.includes('censored')) bgColor = '#09090b';
  if (id.includes('scam')) bgColor = '#d97706';
  if (id.includes('press-f')) bgColor = '#2563eb';

  const fontSize = Math.round(20 * s);
  ctx.font = `900 ${fontSize}px "Anton", Impact, "Arial Black", sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const bw = Math.max(70 * s, textWidth + 28 * s);
  const bh = 34 * s;

  const plate = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
  plate.addColorStop(0, bgColor);
  plate.addColorStop(1, `${bgColor}cc`);
  ctx.fillStyle = plate;
  ctx.strokeStyle = 'rgba(0,0,0,0.58)';
  ctx.lineWidth = 2.5 * s;
  withRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 8 * s);
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.17)';
  withRoundedRect(ctx, -bw / 2 + 4 * s, -bh / 2 + 3 * s, bw - 8 * s, 7 * s, 4 * s);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1 * s);

  ctx.restore();
}

function drawCharacterStickerArt(ctx: CanvasRenderingContext2D, scale: number, emoji: string) {
  drawEmojiSticker(ctx, scale * 1.08, emoji);
}

function drawEmojiSticker(ctx: CanvasRenderingContext2D, scale: number, emoji: string) {
  ctx.save();
  const s = scale * 0.98;
  const emojiSize = Math.round(52 * s);

  // The previous renderer put every emoji inside a white vinyl disc. That made
  // stickers look like UI buttons pasted onto the meme. Render the native color
  // glyph directly and use only a soft photographic shadow for separation.
  ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.58)';
  ctx.shadowBlur = 7 * s;
  ctx.shadowOffsetX = 2 * s;
  ctx.shadowOffsetY = 4 * s;
  ctx.fillText(emoji, 0, 2 * s);

  // A tiny crisp second pass keeps color emojis from looking muddy after shadowing.
  clearShadow(ctx);
  ctx.globalAlpha = 0.98;
  ctx.fillText(emoji, 0, 2 * s);

  ctx.restore();
}
