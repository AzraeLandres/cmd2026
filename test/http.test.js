"use strict";

process.env.TOKEN_SECRET = "ci-test-secret-1234";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isValidId, readBody } = require("../dist/lib/http");

test("isValidId accepte les entiers positifs", () => {
  assert.equal(isValidId("1"), true);
  assert.equal(isValidId("9999"), true);
  assert.equal(isValidId(42), true);
});

test("isValidId rejette les valeurs invalides", () => {
  assert.equal(isValidId("0"), false);
  assert.equal(isValidId("-1"), false);
  assert.equal(isValidId("abc"), false);
  assert.equal(isValidId(""), false);
  assert.equal(isValidId(null), false);
});

test("readBody lit un body JSON correctement", async () => {
  const payload = JSON.stringify({ matchId: "123", homeScore: 2 });

  const req = {
    [Symbol.asyncIterator]: async function* () {
      yield Buffer.from(payload);
    },
  };
  const body = await readBody(req);
  assert.equal(body, payload);
});

test("readBody retourne une chaîne vide sur stream vide", async () => {
  const req = { [Symbol.asyncIterator]: async function* () {} };
  const body = await readBody(req);
  assert.equal(body, "");
});
