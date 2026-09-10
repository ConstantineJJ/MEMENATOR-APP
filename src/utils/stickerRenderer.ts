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

function setSoftStickerShadow(ctx: CanvasRenderingContext2D, scale: number, strength = 0.45) {
  ctx.shadowColor = `rgba(0, 0, 0, ${strength})`;
  ctx.shadowBlur = 9 * scale;
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

  // ================= DISPATCHER (Transparent, No White Background!) =================
  if (sId.startsWith('pepe-')) {
    const variant = sId.replace('pepe-', '') as 'smug' | 'happy' | 'sad' | 'monkas';
    drawPepeMeme(ctx, scale, variant);
  } else if (sId.startsWith('doge-')) {
    const variant = sId.replace('doge-', '') as 'classic' | 'cheems';
    drawDogeMeme(ctx, scale, variant);
  } else if (sId === 'char-gigachad') {
    drawGigachadMeme(ctx, scale);
  } else if (sId === 'char-trollface') {
    drawTrollfaceMeme(ctx, scale);
  } else if (sId.startsWith('wojak-')) {
    const variant = sId.replace('wojak-', '') as 'classic' | 'crying' | 'chad';
    drawWojakMeme(ctx, scale, variant);
  } else if (sId === 'char-popcat') {
    drawPopCatMeme(ctx, scale);
  } else if (sId === 'char-this-is-fine') {
    drawThisIsFineDog(ctx, scale);
  } else if (sId === 'char-cat-smudge') {
    drawCatSmudge(ctx, scale);
  } else if (sId === 'char-stonks') {
    drawStonksMeme(ctx, scale);
  } else if (sId === 'watermelon-boss' || (sticker.type === 'sticker-art' && sticker.emoji === '🍉')) {
    drawWatermelonMascot(ctx, scale);
  } else if (sticker.type === 'sunglasses' || sId === 'thug-sunglasses') {
    drawThugSunglasses(ctx, scale);
  } else if (sticker.type === 'laser-eyes' || sId.startsWith('laser-eyes')) {
    const isCyan = sId.includes('cyan') || sticker.emoji === '⚡';
    drawLaserEyes(ctx, scale, isCyan ? '#22d3ee' : '#ef4444');
  } else if (sId === 'gold-chain' || sticker.emoji === '💰') {
    drawGoldChain(ctx, scale);
  } else if (sId === 'king-crown' || sticker.emoji === '👑') {
    drawCrown(ctx, scale);
  } else if (sId === 'clown-nose-wig') {
    drawClownSet(ctx, scale);
  } else if (sId === 'devil-horns') {
    drawDevilHorns(ctx, scale);
  } else if (sId === 'angel-halo') {
    drawAngelHalo(ctx, scale);
  } else if (sId === 'stamp-wasted') {
    drawWastedStamp(ctx, scale);
  } else if (sId.startsWith('stamp-') || sticker.type === 'stamp') {
    drawStamp(ctx, scale, sticker.label || 'APPROVED', sId);
  } else if (sId.startsWith('badge-') || sticker.type === 'badge') {
    drawBadgePlate(ctx, scale, sticker.label || 'БАЗА', sId);
  } else if (sId.startsWith('bubble-')) {
    drawSpeechBubble(ctx, scale, sId);
  } else {
    // Pure emoji sticker - transparent background without white circle!
    drawEmojiSticker(ctx, scale, sticker.emoji || '🔥');
  }

  ctx.restore();
}

// ================= 1. PEPE DRAWING =================
function drawPepeMeme(ctx: CanvasRenderingContext2D, scale: number, variant: 'smug' | 'happy' | 'sad' | 'monkas') {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const baseColor = variant === 'sad' ? '#689a33' : '#72a838';
  ctx.fillStyle = baseColor;
  ctx.strokeStyle = '#213d11';
  ctx.lineWidth = 3.5 * s;

  // Head contour
  ctx.beginPath();
  ctx.moveTo(-30 * s, 20 * s);
  ctx.bezierCurveTo(-36 * s, 5 * s, -34 * s, -16 * s, -18 * s, -26 * s);
  ctx.bezierCurveTo(-6 * s, -34 * s, 12 * s, -34 * s, 24 * s, -26 * s);
  ctx.bezierCurveTo(36 * s, -18 * s, 38 * s, 2 * s, 32 * s, 18 * s);
  ctx.bezierCurveTo(26 * s, 30 * s, 12 * s, 36 * s, -4 * s, 36 * s);
  ctx.bezierCurveTo(-18 * s, 36 * s, -26 * s, 30 * s, -30 * s, 20 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);

  if (variant === 'monkas') {
    // Huge wide panic eyes
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#213d11';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.arc(-14 * s, -12 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(16 * s, -12 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(-13 * s, -12 * s, 4.5 * s, 0, Math.PI * 2);
    ctx.arc(17 * s, -12 * s, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Blue sweat drops
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(28 * s, -24 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.arc(-28 * s, -22 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Nervous mouth
    ctx.strokeStyle = '#213d11';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(-18 * s, 16 * s);
    ctx.quadraticCurveTo(-8 * s, 20 * s, 2 * s, 16 * s);
    ctx.quadraticCurveTo(12 * s, 20 * s, 22 * s, 16 * s);
    ctx.stroke();
  } else if (variant === 'happy') {
    // Cheerful eyes
    ctx.strokeStyle = '#213d11';
    ctx.lineWidth = 3.5 * s;
    ctx.beginPath();
    ctx.arc(-14 * s, -10 * s, 9 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16 * s, -10 * s, 9 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Big open happy smile
    ctx.fillStyle = '#ea6661';
    ctx.beginPath();
    ctx.moveTo(-22 * s, 6 * s);
    ctx.quadraticCurveTo(0, 32 * s, 26 * s, 6 * s);
    ctx.quadraticCurveTo(0, 16 * s, -22 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (variant === 'sad') {
    // Drooping sad eyes
    ctx.strokeStyle = '#213d11';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(-24 * s, -14 * s);
    ctx.quadraticCurveTo(-14 * s, -8 * s, -2 * s, -16 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4 * s, -16 * s);
    ctx.quadraticCurveTo(16 * s, -8 * s, 26 * s, -14 * s);
    ctx.stroke();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(-13 * s, -9 * s, 4 * s, 0, Math.PI * 2);
    ctx.arc(15 * s, -9 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Blue teardrop
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(22 * s, 2 * s, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Sad downturned mouth
    ctx.fillStyle = '#d95d58';
    ctx.beginPath();
    ctx.moveTo(-20 * s, 18 * s);
    ctx.quadraticCurveTo(0, 6 * s, 22 * s, 18 * s);
    ctx.quadraticCurveTo(0, 12 * s, -20 * s, 18 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Classic Smug Pepe
    // Hooded eyelids
    ctx.fillStyle = '#4d7422';
    ctx.strokeStyle = '#213d11';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(-24 * s, -10 * s);
    ctx.quadraticCurveTo(-12 * s, -18 * s, 0, -10 * s);
    ctx.quadraticCurveTo(-12 * s, -6 * s, -24 * s, -10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4 * s, -12 * s);
    ctx.quadraticCurveTo(16 * s, -20 * s, 28 * s, -12 * s);
    ctx.quadraticCurveTo(16 * s, -8 * s, 4 * s, -12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pupils looking sideways
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(-12 * s, -11 * s, 4 * s, 0, Math.PI * 2);
    ctx.arc(16 * s, -13 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10 * s, -12 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.arc(18 * s, -14 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();

    // Smug curving smirk
    ctx.fillStyle = '#e26661';
    ctx.strokeStyle = '#213d11';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(-22 * s, 8 * s);
    ctx.quadraticCurveTo(0, 12 * s, 24 * s, 2 * s);
    ctx.quadraticCurveTo(0, 24 * s, -22 * s, 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-22 * s, 8 * s);
    ctx.quadraticCurveTo(0, 12 * s, 24 * s, 2 * s);
    ctx.stroke();
  }

  ctx.restore();
}

// ================= 2. DOGE DRAWING =================
function drawDogeMeme(ctx: CanvasRenderingContext2D, scale: number, variant: 'classic' | 'cheems') {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const baseColor = variant === 'cheems' ? '#d99852' : '#dca15c';
  ctx.fillStyle = baseColor;
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 3 * s;

  if (variant === 'cheems') {
    // Round chubby Cheems
    ctx.beginPath();
    ctx.arc(0, 2 * s, 34 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cheems ears
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-28 * s, -24 * s);
    ctx.lineTo(-34 * s, -36 * s);
    ctx.lineTo(-14 * s, -30 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(28 * s, -24 * s);
    ctx.lineTo(34 * s, -36 * s);
    ctx.lineTo(14 * s, -30 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    clearShadow(ctx);
    // Cheeks muzzle
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, 14 * s, 20 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, 8 * s, 5 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Squinty melancholic eyes
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.arc(-10 * s, -6 * s, 6 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10 * s, -6 * s, 6 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    // Classic Doge
    ctx.beginPath();
    ctx.moveTo(-25 * s, -5 * s);
    ctx.lineTo(-32 * s, -36 * s);
    ctx.lineTo(-10 * s, -22 * s);
    ctx.quadraticCurveTo(10 * s, -26 * s, 22 * s, -36 * s);
    ctx.lineTo(34 * s, -14 * s);
    ctx.quadraticCurveTo(40 * s, 10 * s, 26 * s, 28 * s);
    ctx.quadraticCurveTo(0, 40 * s, -26 * s, 24 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    clearShadow(ctx);

    // Muzzle highlight
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(6 * s, 12 * s, 18 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark button nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(6 * s, 4 * s, 6 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curious side-eye
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.ellipse(-6 * s, -10 * s, 7 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(-8 * s, -10 * s, 4.2 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6.5 * s, -12 * s, 1.6 * s, 0, Math.PI * 2);
    ctx.fill();

    // Raised curved eyebrows
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.arc(-10 * s, -22 * s, 7 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(18 * s, -18 * s, 6 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Cute mouth
    ctx.beginPath();
    ctx.moveTo(2 * s, 9 * s);
    ctx.quadraticCurveTo(6 * s, 16 * s, 12 * s, 10 * s);
    ctx.stroke();
  }

  ctx.restore();
}

// ================= 3. GIGACHAD DRAWING =================
function drawGigachadMeme(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Angular chiseled jawline
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 3.5 * s;

  ctx.beginPath();
  ctx.moveTo(-24 * s, -18 * s);
  ctx.quadraticCurveTo(0, -32 * s, 24 * s, -18 * s);
  ctx.lineTo(26 * s, 6 * s);
  ctx.lineTo(18 * s, 24 * s);
  ctx.lineTo(0, 38 * s);
  ctx.lineTo(-18 * s, 24 * s);
  ctx.lineTo(-26 * s, 6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);

  // Masculine sculpted beard & stubble
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(-20 * s, 2 * s);
  ctx.quadraticCurveTo(-14 * s, 20 * s, 0, 36 * s);
  ctx.quadraticCurveTo(14 * s, 20 * s, 20 * s, 2 * s);
  ctx.quadraticCurveTo(14 * s, 12 * s, 0, 14 * s);
  ctx.quadraticCurveTo(-14 * s, 12 * s, -20 * s, 2 * s);
  ctx.closePath();
  ctx.fill();

  // Dark aviator shades
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.rect(-20 * s, -12 * s, 16 * s, 10 * s);
  ctx.rect(4 * s, -12 * s, 16 * s, 10 * s);
  ctx.fill();
  ctx.fillRect(-4 * s, -10 * s, 8 * s, 3 * s);

  // White lens reflection line
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(-16 * s, -10 * s);
  ctx.lineTo(-8 * s, -4 * s);
  ctx.moveTo(8 * s, -10 * s);
  ctx.lineTo(16 * s, -4 * s);
  ctx.stroke();

  // Cheekbone contour
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(-18 * s, -2 * s);
  ctx.lineTo(-10 * s, 6 * s);
  ctx.moveTo(18 * s, -2 * s);
  ctx.lineTo(10 * s, 6 * s);
  ctx.stroke();

  // Confident chin cleft
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8 * s;
  ctx.beginPath();
  ctx.moveTo(-6 * s, 18 * s);
  ctx.quadraticCurveTo(0, 22 * s, 8 * s, 18 * s);
  ctx.stroke();

  ctx.restore();
}

// ================= 4. TROLLFACE DRAWING =================
function drawTrollfaceMeme(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 3.5 * s;

  // Asymmetrical head
  ctx.beginPath();
  ctx.moveTo(-32 * s, 6 * s);
  ctx.bezierCurveTo(-36 * s, -14 * s, -22 * s, -28 * s, -2 * s, -30 * s);
  ctx.bezierCurveTo(20 * s, -32 * s, 34 * s, -22 * s, 38 * s, -6 * s);
  ctx.bezierCurveTo(42 * s, 12 * s, 32 * s, 26 * s, 18 * s, 32 * s);
  ctx.bezierCurveTo(-2 * s, 40 * s, -22 * s, 36 * s, -28 * s, 24 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);

  // Giant grin
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(-24 * s, 0);
  ctx.quadraticCurveTo(0, -4 * s, 34 * s, 6 * s);
  ctx.quadraticCurveTo(24 * s, 26 * s, -22 * s, 18 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Teeth dividers
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.8 * s;
  const teethX = [-14, -4, 6, 16, 26];
  teethX.forEach((tx) => {
    ctx.beginPath();
    ctx.moveTo(tx * s, 2 * s);
    ctx.lineTo(tx * s, 20 * s);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(-24 * s, 9 * s);
  ctx.quadraticCurveTo(5 * s, 8 * s, 32 * s, 13 * s);
  ctx.stroke();

  // Mischievous eyes
  ctx.beginPath();
  ctx.arc(-10 * s, -14 * s, 3 * s, 0, Math.PI * 2);
  ctx.arc(14 * s, -14 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  // Forehead wrinkles
  ctx.beginPath();
  ctx.moveTo(-4 * s, -24 * s);
  ctx.quadraticCurveTo(10 * s, -26 * s, 22 * s, -22 * s);
  ctx.stroke();

  ctx.restore();
}

// ================= 5. WOJAK DRAWING =================
function drawWojakMeme(ctx: CanvasRenderingContext2D, scale: number, variant: 'classic' | 'crying' | 'chad') {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (variant === 'chad') {
    // Nordic / Yes Chad
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2.5 * s;

    // Blond hair
    ctx.beginPath();
    ctx.arc(0, -8 * s, 26 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Angular profile face
    ctx.fillStyle = '#fed7aa';
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -16 * s);
    ctx.lineTo(14 * s, -16 * s);
    ctx.lineTo(14 * s, -4 * s);
    ctx.lineTo(24 * s, 0);
    ctx.lineTo(16 * s, 4 * s);
    ctx.lineTo(20 * s, 12 * s);
    ctx.lineTo(12 * s, 24 * s);
    ctx.lineTo(-2 * s, 26 * s);
    ctx.lineTo(-8 * s, 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    clearShadow(ctx);

    // Full blond beard
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(0, 4 * s);
    ctx.lineTo(18 * s, 12 * s);
    ctx.lineTo(12 * s, 32 * s);
    ctx.lineTo(-2 * s, 32 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Calm determined eye
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(6 * s, -8 * s);
    ctx.lineTo(12 * s, -8 * s);
    ctx.stroke();
  } else {
    // Classic or Crying Wojak
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 3.5 * s;

    // Bald head
    ctx.beginPath();
    ctx.arc(0, 0, 30 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    clearShadow(ctx);

    // Sad eyebrows
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(-16 * s, -14 * s);
    ctx.quadraticCurveTo(-6 * s, -18 * s, -2 * s, -12 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2 * s, -12 * s);
    ctx.quadraticCurveTo(6 * s, -18 * s, 16 * s, -14 * s);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.ellipse(-8 * s, -6 * s, 4.5 * s, 5.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(8 * s, -6 * s, 4.5 * s, 5.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-8 * s, -5 * s, 2.2 * s, 0, Math.PI * 2);
    ctx.arc(8 * s, -5 * s, 2.2 * s, 0, Math.PI * 2);
    ctx.fill();

    if (variant === 'crying') {
      // Blue stream tears
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3.5 * s;
      ctx.beginPath();
      ctx.moveTo(-8 * s, 0);
      ctx.lineTo(-10 * s, 26 * s);
      ctx.moveTo(8 * s, 0);
      ctx.lineTo(10 * s, 26 * s);
      ctx.stroke();
    }

    // Melancholy mouth
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, 16 * s);
    ctx.quadraticCurveTo(0, 12 * s, 10 * s, 16 * s);
    ctx.stroke();
  }

  ctx.restore();
}

// ================= 6. POP CAT =================
function drawPopCatMeme(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 3 * s;

  // Cat head
  ctx.beginPath();
  ctx.arc(0, 2 * s, 34 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pointed ears
  ctx.beginPath();
  ctx.moveTo(-28 * s, -22 * s);
  ctx.lineTo(-16 * s, -38 * s);
  ctx.lineTo(-4 * s, -28 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(28 * s, -22 * s);
  ctx.lineTo(16 * s, -38 * s);
  ctx.lineTo(4 * s, -28 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);

  // Pink inner ears
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(-24 * s, -22 * s);
  ctx.lineTo(-16 * s, -34 * s);
  ctx.lineTo(-8 * s, -26 * s);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(24 * s, -22 * s);
  ctx.lineTo(16 * s, -34 * s);
  ctx.lineTo(8 * s, -26 * s);
  ctx.closePath();
  ctx.fill();

  // Dark round eyes
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(-14 * s, -6 * s, 4.5 * s, 0, Math.PI * 2);
  ctx.arc(14 * s, -6 * s, 4.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // White catchlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-12 * s, -8 * s, 1.6 * s, 0, Math.PI * 2);
  ctx.arc(16 * s, -8 * s, 1.6 * s, 0, Math.PI * 2);
  ctx.fill();

  // Giant open mouth :O
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.arc(0, 14 * s, 15 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tongue
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(0, 21 * s, 7 * s, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

// ================= 7. THIS IS FINE DOG =================
function drawThisIsFineDog(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.fillStyle = '#d97706';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3 * s;

  // Dog head
  ctx.beginPath();
  ctx.arc(0, 2 * s, 26 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Floppy ear
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(-24 * s, 2 * s, 7 * s, 14 * s, Math.PI * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bowler Hat
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.rect(-16 * s, -34 * s, 32 * s, 14 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -20 * s, 22 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Red ribbon
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-16 * s, -24 * s, 32 * s, 4 * s);

  clearShadow(ctx);

  // Peaceful calm eyes
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.8 * s;
  ctx.beginPath();
  ctx.arc(-8 * s, -2 * s, 4 * s, 0, Math.PI * 2);
  ctx.arc(8 * s, -2 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(-7 * s, -2 * s, 2 * s, 0, Math.PI * 2);
  ctx.arc(9 * s, -2 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Little black nose
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.ellipse(0, 7 * s, 4.5 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gentle smile
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(-6 * s, 14 * s);
  ctx.quadraticCurveTo(0, 18 * s, 6 * s, 14 * s);
  ctx.stroke();

  ctx.restore();
}

// ================= 8. TABLE CAT (SMUDGE) =================
function drawCatSmudge(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3 * s;

  // White cat face
  ctx.beginPath();
  ctx.arc(0, 2 * s, 32 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pointed ears
  ctx.beginPath();
  ctx.moveTo(-26 * s, -20 * s);
  ctx.lineTo(-14 * s, -38 * s);
  ctx.lineTo(-2 * s, -26 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(26 * s, -20 * s);
  ctx.lineTo(14 * s, -38 * s);
  ctx.lineTo(2 * s, -26 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);

  // Confused squinty eyes
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(-16 * s, -4 * s);
  ctx.quadraticCurveTo(-10 * s, -9 * s, -4 * s, -4 * s);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(4 * s, -4 * s);
  ctx.quadraticCurveTo(10 * s, -9 * s, 16 * s, -4 * s);
  ctx.stroke();

  // Pink nose
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(0, 5 * s);
  ctx.lineTo(-4 * s, 0);
  ctx.lineTo(4 * s, 0);
  ctx.closePath();
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(-28 * s, 2 * s);
  ctx.lineTo(-10 * s, 4 * s);
  ctx.moveTo(-28 * s, 8 * s);
  ctx.lineTo(-10 * s, 7 * s);
  ctx.moveTo(28 * s, 2 * s);
  ctx.lineTo(10 * s, 4 * s);
  ctx.moveTo(28 * s, 8 * s);
  ctx.lineTo(10 * s, 7 * s);
  ctx.stroke();

  ctx.restore();
}

// ================= 9. STONKS MEME MAN =================
function drawStonksMeme(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Smooth minimalist 3D mannequin head
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3 * s;

  ctx.beginPath();
  ctx.arc(0, 0, 28 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);

  // Nose ridge
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(2 * s, -14 * s);
  ctx.lineTo(6 * s, 2 * s);
  ctx.lineTo(0, 5 * s);
  ctx.stroke();

  // Green arrow ↗
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(14 * s, 14 * s);
  ctx.lineTo(32 * s, -12 * s);
  ctx.lineTo(20 * s, -12 * s);
  ctx.moveTo(32 * s, -12 * s);
  ctx.lineTo(32 * s, 0);
  ctx.stroke();

  // STONKS text
  ctx.fillStyle = '#22c55e';
  ctx.font = `900 ${10 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('STONKS', 0, 22 * s);

  ctx.restore();
}

// ================= 10. MASCOT WATERMELON BOSS =================
function drawWatermelonMascot(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.95;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

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

  // Sunglasses
  ctx.fillStyle = '#050505';
  ctx.fillRect(-24 * s, -6 * s, 20 * s, 12 * s);
  ctx.fillRect(4 * s, -6 * s, 20 * s, 12 * s);
  ctx.fillRect(-4 * s, -4 * s, 8 * s, 4 * s);

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(-20 * s, -2 * s);
  ctx.lineTo(-12 * s, -2 * s);
  ctx.moveTo(8 * s, -2 * s);
  ctx.lineTo(16 * s, -2 * s);
  ctx.stroke();

  ctx.restore();
}

// ================= 11. THUG LIFE SUNGLASSES =================
function drawThugSunglasses(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale;
  const w = 120 * s;
  const h = 28 * s;

  // 8-bit shades with black outline and zero background
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  clearShadow(ctx);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w / 2 + 10 * s, -h / 2 + 4 * s, 14 * s, 6 * s);
  ctx.fillRect(10 * s, -h / 2 + 4 * s, 14 * s, 6 * s);

  ctx.restore();
}

// ================= 12. LASER EYES =================
function drawLaserEyes(ctx: CanvasRenderingContext2D, scale: number, colorHex: string) {
  ctx.save();
  const radius = 28 * scale;

  clearShadow(ctx);
  const glow = ctx.createRadialGradient(0, 0, 2 * scale, 0, 0, radius);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(0.2, colorHex);
  glow.addColorStop(0.6, `${colorHex}88`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.8, 0);
  ctx.lineTo(radius * 1.8, 0);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.4, 0);
  ctx.lineTo(radius * 1.4, 0);
  ctx.stroke();

  ctx.restore();
}

// ================= 13. GOLD CHAIN =================
function drawGoldChain(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.92;

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 8 * s;
  ctx.beginPath();
  ctx.arc(0, -10 * s, 33 * s, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  const goldStroke = ctx.createLinearGradient(-30 * s, -20 * s, 30 * s, 20 * s);
  goldStroke.addColorStop(0, '#f59e0b');
  goldStroke.addColorStop(0.5, '#fde047');
  goldStroke.addColorStop(1, '#d97706');
  ctx.strokeStyle = goldStroke;
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.arc(0, -10 * s, 33 * s, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.arc(0, 28 * s, 18 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#713f12';
  ctx.font = `900 ${20 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 29 * s);

  ctx.restore();
}

// ================= 14. CROWN =================
function drawCrown(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.92;

  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 3.5 * s;
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
    { x: -37, y: -11, color: '#ef4444' },
    { x: 0, y: -20, color: '#3b82f6' },
    { x: 37, y: -11, color: '#10b981' },
  ];
  jewels.forEach(({ x, y, color }) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x * s, y * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ================= 15. CLOWN NOSE & WIG =================
function drawClownSet(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.9;

  // Rainbow afro puffs
  const puffs = [
    { x: -22, y: -12, c: '#ef4444' },
    { x: -10, y: -22, c: '#eab308' },
    { x: 10, y: -22, c: '#22c55e' },
    { x: 22, y: -12, c: '#3b82f6' },
  ];
  puffs.forEach(({ x, y, c }) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x * s, y * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
  });

  // Red clown nose
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.arc(0, 10 * s, 12 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-3 * s, 7 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ================= 16. DEVIL HORNS =================
function drawDevilHorns(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.92;

  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 3 * s;

  // Left horn
  ctx.beginPath();
  ctx.moveTo(-28 * s, 14 * s);
  ctx.quadraticCurveTo(-36 * s, -10 * s, -14 * s, -24 * s);
  ctx.quadraticCurveTo(-20 * s, -2 * s, -16 * s, 14 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right horn
  ctx.beginPath();
  ctx.moveTo(28 * s, 14 * s);
  ctx.quadraticCurveTo(36 * s, -10 * s, 14 * s, -24 * s);
  ctx.quadraticCurveTo(20 * s, -2 * s, 16 * s, 14 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// ================= 17. ANGEL HALO =================
function drawAngelHalo(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale * 0.92;

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.ellipse(0, 0, 36 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.stroke();

  clearShadow(ctx);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.ellipse(0, 0, 36 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// ================= 18. WASTED STAMP =================
function drawWastedStamp(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.save();
  const s = scale;

  ctx.font = `900 ${28 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Dark outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4 * s;
  ctx.strokeText('WASTED', 0, 0);

  clearShadow(ctx);
  ctx.fillStyle = '#dc2626';
  ctx.fillText('WASTED', 0, 0);

  ctx.restore();
}

// ================= 19. STAMP (APPROVED, 100%, TOP SECRET) =================
function drawStamp(ctx: CanvasRenderingContext2D, scale: number, text: string, id: string) {
  ctx.save();
  const s = scale * 0.9;
  const isGreen = id.includes('approved');
  const isGold = id.includes('100');
  const color = isGreen ? '#10b981' : isGold ? '#f59e0b' : '#ef4444';

  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5 * s;
  withRoundedRect(ctx, -56 * s, -20 * s, 112 * s, 40 * s, 6 * s);
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = `${color}22`;
  withRoundedRect(ctx, -54 * s, -18 * s, 108 * s, 36 * s, 5 * s);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.font = `900 ${15 * s}px "Anton", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, 1 * s);

  ctx.restore();
}

// ================= 20. BADGE PLATE (БАЗА, КРИНЖ, CENSORED, BRUH, SKILL ISSUE) =================
function drawBadgePlate(ctx: CanvasRenderingContext2D, scale: number, text: string, id: string) {
  ctx.save();
  const s = scale * 0.9;

  let bgColor = '#e11d48';
  if (id.includes('base')) bgColor = '#059669';
  if (id.includes('cringe')) bgColor = '#9333ea';
  if (id.includes('censored')) bgColor = '#09090b';
  if (id.includes('scam')) bgColor = '#d97706';
  if (id.includes('skill')) bgColor = '#ea580c';

  const fontSize = Math.round(18 * s);
  ctx.font = `900 ${fontSize}px "Anton", Impact, "Arial Black", sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const bw = Math.max(68 * s, textWidth + 26 * s);
  const bh = 32 * s;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2 * s;
  withRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 8 * s);
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1 * s);

  ctx.restore();
}

// ================= 21. SPEECH BUBBLES =================
function drawSpeechBubble(ctx: CanvasRenderingContext2D, scale: number, id: string) {
  ctx.save();
  const s = scale * 0.9;

  const text =
    id === 'bubble-bruh'
      ? 'BRUH.'
      : id === 'bubble-wait-what'
        ? 'ЧТО?!'
        : id === 'bubble-real'
          ? 'REAL 💯'
          : 'NO U';

  ctx.font = `900 ${14 * s}px "Anton", Impact, sans-serif`;
  const tw = ctx.measureText(text).width;
  const w = Math.max(64 * s, tw + 24 * s);
  const h = 34 * s;

  // Speech bubble path with pointer
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 3 * s;

  ctx.beginPath();
  ctx.moveTo(-w / 2 + 8 * s, -h / 2);
  ctx.lineTo(w / 2 - 8 * s, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 8 * s);
  ctx.lineTo(w / 2, h / 2 - 8 * s);
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - 8 * s, h / 2);
  ctx.lineTo(-w / 2 + 24 * s, h / 2);
  ctx.lineTo(-w / 2 + 10 * s, h / 2 + 12 * s);
  ctx.lineTo(-w / 2 + 14 * s, h / 2);
  ctx.lineTo(-w / 2 + 8 * s, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 8 * s);
  ctx.lineTo(-w / 2, -h / 2 + 8 * s);
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 8 * s, -h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  clearShadow(ctx);
  ctx.fillStyle = '#09090b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

// ================= 22. EMOJI STICKERS (NO WHITE CIRCLE!) =================
function drawEmojiSticker(ctx: CanvasRenderingContext2D, scale: number, emoji: string) {
  ctx.save();
  const s = scale * 0.98;
  const emojiSize = Math.round(52 * s);

  // Directly render transparent glyph - absolutely no white circle!
  ctx.font = `${emojiSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 7 * s;
  ctx.shadowOffsetX = 2 * s;
  ctx.shadowOffsetY = 4 * s;
  ctx.fillText(emoji, 0, 2 * s);

  clearShadow(ctx);
  ctx.fillText(emoji, 0, 2 * s);

  ctx.restore();
}
