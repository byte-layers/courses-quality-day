import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, normalizePhone } from '../src/utils.js';

test('isValidEmail accepte une adresse simple', () => {
  assert.equal(isValidEmail('camille@example.com'), true);
});

test('isValidEmail refuse un texte sans @', () => {
  assert.equal(isValidEmail('camille.example.com'), false);
});

test('normalizePhone retire les espaces', () => {
  assert.equal(normalizePhone('06 12 34 56 78'), '0612345678');
});
