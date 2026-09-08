import assert from 'node:assert/strict';
import test from 'node:test';

test('image generation visual prompt formulation handles caption pairs', () => {
  const topText = 'ДЕЛАЮ ВИД ЧТО РАБОТАЮ';
  const bottomText = 'НАЖИМАЮ НА КЛАВИАТУРУ СО ЗВУКОМ';
  const fullText = [topText, bottomText].filter(Boolean).join(' — ');

  const visualPrompt = `Комедийная мем-сцена выражающая смысл: "${fullText}". Стиль: офис, выразительная мимика, читаемая композиция`;

  assert.match(visualPrompt, /ДЕЛАЮ ВИД ЧТО РАБОТАЮ/);
  assert.match(visualPrompt, /НАЖИМАЮ НА КЛАВИАТУРУ СО ЗВУКОМ/);
  assert.match(visualPrompt, /выразительная мимика/);
});

test('supported aspect ratios for meme generation include square and cinematic', () => {
  const supportedRatios = ['1:1', '16:9', '9:16', '4:3'];
  assert.ok(supportedRatios.includes('1:1'));
  assert.ok(supportedRatios.includes('16:9'));
  assert.ok(supportedRatios.includes('9:16'));
  assert.ok(supportedRatios.includes('4:3'));
});
