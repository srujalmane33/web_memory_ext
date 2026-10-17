import { test } from 'node:test';
import assert from 'node:assert';
import { isValidHttpUrl, extractDomain, normalizeTags, sanitizeText, MEMORY_TYPES } from './index.js';

test('isValidHttpUrl rejects invalid schemes and accepts valid ones', () => {
  assert.strictEqual(isValidHttpUrl('https://example.com/path?arg=1'), true);
  assert.strictEqual(isValidHttpUrl('http://localhost:3000'), true);
  assert.strictEqual(isValidHttpUrl('javascript:alert(1)'), false);
  assert.strictEqual(isValidHttpUrl('chrome://extensions'), false);
  assert.strictEqual(isValidHttpUrl('data:text/html,test'), false);
  assert.strictEqual(isValidHttpUrl(''), false);
  assert.strictEqual(isValidHttpUrl(null), false);
});

test('extractDomain extracts domain without www', () => {
  assert.strictEqual(extractDomain('https://www.github.com/test'), 'github.com');
  assert.strictEqual(extractDomain('http://docs.google.com/doc'), 'docs.google.com');
  assert.strictEqual(extractDomain('invalid'), '');
});

test('normalizeTags handles array and strings and deduplicates', () => {
  assert.deepStrictEqual(normalizeTags(['React', 'react', ' node.js ']), ['react', 'node.js']);
  assert.deepStrictEqual(normalizeTags('React, javascript, REACT, CSS'), ['react', 'javascript', 'css']);
});

test('sanitizeText trims and limits length', () => {
  assert.strictEqual(sanitizeText('  hello world  ', 5), 'hello');
  assert.strictEqual(sanitizeText(null, 10), '');
});
