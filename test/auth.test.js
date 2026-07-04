'use strict';

process.env.TOKEN_SECRET = 'ci-test-secret-1234';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { hashPassword, verifyPassword, createToken, verifyToken, extractUserIdFromHeader } = require('../dist/lib/auth');

test('hashPassword produit un hash different du mot de passe', async () => {
  const hash = await hashPassword('motdepasse123');
  assert.notEqual(hash, 'motdepasse123');
  assert.ok(hash.includes(':'), 'le hash doit contenir un sel');
});

test('verifyPassword accepte le bon mot de passe', async () => {
  const hash = await hashPassword('correct');
  assert.equal(await verifyPassword(hash, 'correct'), true);
});

test('verifyPassword rejette un mauvais mot de passe', async () => {
  const hash = await hashPassword('correct');
  assert.equal(await verifyPassword(hash, 'wrong'), false);
});

test('deux hash du meme mot de passe sont differents (sel aleatoire)', async () => {
  const h1 = await hashPassword('same');
  const h2 = await hashPassword('same');
  assert.notEqual(h1, h2);
});

test('createToken retourne un token non-vide', () => {
  const token = createToken(42);
  assert.ok(typeof token === 'string' && token.length > 10);
});

test('verifyToken retrouve le bon userId', () => {
  const token  = createToken(99);
  const userId = verifyToken(token);
  assert.equal(userId, 99);
});

test('verifyToken rejette un token falsifie', () => {
  const token    = createToken(1);
  const tampered = token.slice(0, -4) + 'xxxx';
  assert.equal(verifyToken(tampered), null);
});

test('verifyToken rejette null / chaine vide / garbage', () => {
  assert.equal(verifyToken(null), null);
  assert.equal(verifyToken(''), null);
  assert.equal(verifyToken('garbage'), null);
});

test('extractUserIdFromHeader lit le token depuis Authorization: Bearer', () => {
  const token  = createToken(7);
  const header = 'Bearer ' + token;
  assert.equal(header.slice(7), token, 'slice doit etre le token');
  assert.equal(verifyToken(header.slice(7)), 7, 'verifyToken(slice) doit retourner 7');
  assert.equal(extractUserIdFromHeader(header), 7);
});

test('extractUserIdFromHeader retourne null sans header', () => {
  assert.equal(extractUserIdFromHeader(undefined), null);
  assert.equal(extractUserIdFromHeader(''), null);
});
