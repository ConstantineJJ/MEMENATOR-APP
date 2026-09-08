import test from 'node:test';
import assert from 'node:assert/strict';
import { computeImageSignature, normalizeTitle } from '../server/memeAggregator';

test('normalizeTitle lowercases, removes punctuation and collapses whitespace', () => {
  assert.equal(
    normalizeTitle('  This!!!   Is — Fine?!  '),
    'this is fine'
  );
});

test('normalizeTitle preserves Unicode letters and digits', () => {
  assert.equal(
    normalizeTitle('Мем №42: КОТ + Пёс'),
    'мем 42 кот пёс'
  );
});

test('computeImageSignature ignores URL query parameters', () => {
  const first = computeImageSignature(
    'Distracted Boyfriend',
    'https://example.com/meme.jpg?width=500&token=abc'
  );
  const second = computeImageSignature(
    'Distracted Boyfriend',
    'https://example.com/meme.jpg?width=1200&token=xyz'
  );

  assert.equal(first, second);
});

test('computeImageSignature changes when the normalized title or filename changes', () => {
  const base = computeImageSignature('Cat reaction', 'https://example.com/cat.jpg');
  const differentTitle = computeImageSignature('Dog reaction', 'https://example.com/cat.jpg');
  const differentFile = computeImageSignature('Cat reaction', 'https://example.com/cat-2.jpg');

  assert.notEqual(base, differentTitle);
  assert.notEqual(base, differentFile);
});
