import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arePerceptuallySimilar,
  computeDHashFromGrayscale,
  hammingDistanceHex,
  PERCEPTUAL_HASH_PREFIX,
} from '../src/utils/perceptualHash';

function makeRows(direction: 'ascending' | 'descending'): number[] {
  const row = direction === 'ascending'
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8]
    : [8, 7, 6, 5, 4, 3, 2, 1, 0];
  return Array.from({ length: 8 }, () => row).flat();
}

test('dHash produces a stable 64-bit hex signature', () => {
  const hash = computeDHashFromGrayscale(makeRows('ascending'));
  assert.equal(hash.length, 16);
  assert.equal(hash, '0000000000000000');
});

test('opposite horizontal edge patterns are maximally different', () => {
  const ascending = computeDHashFromGrayscale(makeRows('ascending'));
  const descending = computeDHashFromGrayscale(makeRows('descending'));
  assert.equal(descending, 'ffffffffffffffff');
  assert.equal(hammingDistanceHex(ascending, descending), 64);
});

test('prefixed hashes can be compared for near-duplicate detection', () => {
  const hash = computeDHashFromGrayscale(makeRows('descending'));
  const changedByOneBit = 'fffffffffffffffe';
  assert.equal(
    hammingDistanceHex(`${PERCEPTUAL_HASH_PREFIX}${hash}`, `${PERCEPTUAL_HASH_PREFIX}${changedByOneBit}`),
    1
  );
  assert.equal(
    arePerceptuallySimilar(
      `${PERCEPTUAL_HASH_PREFIX}${hash}`,
      `${PERCEPTUAL_HASH_PREFIX}${changedByOneBit}`,
      6
    ),
    true
  );
});
