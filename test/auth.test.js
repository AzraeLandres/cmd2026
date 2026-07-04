"use strict";

process.env.TOKEN_SECRET = "ci-test-secret-1234";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  extractUserIdFromHeader,
} = require("../dist/lib/auth");

test("hashPassword produit un hash différent du mot de passe", async () => {
  const hash = await hashPassword("motdepasse123");
  assert.notEqual(hash, "motdepasse123");
  assert.ok(hash.includes(":"), "le hash doit contenir un sel séparé par :");
});

test("verifyPassword accepte le bon mot de passe", async () => {
  const hash = await hashPassword("correct");
  assert.equal(await verifyPassword(hash, "correct"), true);
});

test("verifyPassword rejette un mauvais mot de passe", async () => {
  const hash = await hashPassword("correct");
  assert.equal(await verifyPassword(hash, "wrong"), false);
});

test("deux hash du même mot de passe sont différents (sel aléatoire)", async () => {
  const h1 = await hashPassword("same");
  const h2 = await hashPassword("same");
  assert.notEqual(h1, h2);
});

test("createToken retourne un token non-vide", () => {
  const token = createToken(42);
  assert.ok(typeof token === "string" && token.length > 10);
});

test("verifyToken retrouve le bon userId", () => {
  const token = createToken(99);
  const userId = verifyToken(token);
  assert.equal(userId, 99);
});

test("verifyToken rejette un token falsifié", () => {
  const token = createToken(1);
  const tampered = token.slice(0, -4) + "xxxx";
  assert.equal(verifyToken(tampered), null);
});

test("verifyToken rejette null / chaîne vide", () => {
  assert.equal(verifyToken(null), null);
  assert.equal(verifyToken(""), null);
  assert.equal(verifyToken("garbage"), null);
});

test("extractUserIdFromHeader lit le token depuis Authorization: Bearer", () => {
  const token = createToken(7);
  const req = { headers: { authorization: "Bearer " + token } };
  assert.equal(extractUserIdFromHeader(req), 7);
});

test("extractUserIdFromHeader retourne null sans header", () => {
  assert.equal(extractUserIdFromHeader({ headers: {} }), null);
});
