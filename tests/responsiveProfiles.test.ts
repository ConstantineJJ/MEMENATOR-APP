import assert from 'node:assert/strict';
import test from 'node:test';
import { detectLayoutProfile } from '../src/responsiveProfiles';

test('detects phone portrait profile', () => {
  assert.equal(detectLayoutProfile({ width: 390, height: 844 }), 'phone-portrait');
});

test('detects phone landscape profile', () => {
  assert.equal(detectLayoutProfile({ width: 844, height: 390 }), 'phone-landscape');
});

test('detects tablet portrait profile', () => {
  assert.equal(detectLayoutProfile({ width: 768, height: 1024 }), 'tablet-portrait');
});

test('detects tablet landscape profile', () => {
  assert.equal(detectLayoutProfile({ width: 1024, height: 768 }), 'tablet-landscape');
});

test('desktop wins at 1200px and above', () => {
  assert.equal(detectLayoutProfile({ width: 1200, height: 800 }), 'desktop');
  assert.equal(detectLayoutProfile({ width: 1440, height: 2560, orientation: 'portrait' }), 'desktop');
});
