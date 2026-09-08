import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOBILE_WORKING_IMAGE_MAX_DIMENSION,
  calculateWorkingImageSize,
} from '../src/utils/imageHelper';

test('keeps already-safe images unchanged', () => {
  assert.deepEqual(calculateWorkingImageSize(1600, 1200, MOBILE_WORKING_IMAGE_MAX_DIMENSION), {
    width: 1600,
    height: 1200,
    resized: false,
  });
});

test('downscales a 12MP landscape camera photo to the mobile long-side limit', () => {
  assert.deepEqual(calculateWorkingImageSize(4032, 3024, MOBILE_WORKING_IMAGE_MAX_DIMENSION), {
    width: 3072,
    height: 2304,
    resized: true,
  });
});

test('preserves portrait aspect ratio while downscaling', () => {
  assert.deepEqual(calculateWorkingImageSize(3024, 4032, MOBILE_WORKING_IMAGE_MAX_DIMENSION), {
    width: 2304,
    height: 3072,
    resized: true,
  });
});
