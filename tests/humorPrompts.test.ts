import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMagicCaptionPrompt, getHumorProfile } from '../server/humorPrompts';

test('magic caption prompt asks for exactly three finalists after internal ideation', () => {
  const prompt = buildMagicCaptionPrompt({ styleId: 'trending' });
  assert.match(prompt, /РОВНО 3/i);
  assert.match(prompt, /минимум 9 разных углов/i);
  assert.match(prompt, /три финальных варианта/i);
});

test('millennial profile is broad and treats exhausted references as anti-cliches', () => {
  const profile = getHumorProfile('millennials');
  const domains = profile.domains.join(' ').toLowerCase();
  const avoid = profile.avoid.join(' ').toLowerCase();

  assert.match(domains, /пленк|фотоаппарат/);
  assert.match(domains, /dial-up|icq|windows/);
  assert.match(domains, /гараж|стройк|велосипед/);
  assert.match(domains, /диск|компьютерн/);
  assert.match(avoid, /подорожник/);
  assert.match(avoid, /кассет.*карандаш/);
  assert.match(avoid, /колорад/);
  assert.match(avoid, /колен/);
});

test('recent caption ideas are explicitly fed back as repetition exclusions', () => {
  const prompt = buildMagicCaptionPrompt({
    styleId: 'millennials',
    recentCaptions: [
      {
        headline: 'Старая идея',
        topText: 'ПЕРЕМАТЫВАЮ КАССЕТУ КАРАНДАШОМ',
        bottomText: 'БЕРЕГУ БАТАРЕЙКИ',
      },
    ],
  });

  assert.match(prompt, /НЕ повторяй/i);
  assert.match(prompt, /ПЕРЕМАТЫВАЮ КАССЕТУ КАРАНДАШОМ/);
  assert.match(prompt, /разные культурные домена/i);
});
