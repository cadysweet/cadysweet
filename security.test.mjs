import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  await readFile(new URL("./browser-safety.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } },
);
const safety = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("denied storage access returns an optional preference instead of crashing", () => {
  globalThis.window = { get localStorage() { throw new Error("SecurityError"); } };
  try {
    assert.equal(safety.readAccountPreference(), null);
    assert.doesNotThrow(() => safety.saveAccountPreference("nuran"));
  } finally { delete globalThis.window; }
});

test("storage method errors and quota failures are contained", () => {
  globalThis.window = { localStorage: {
    getItem() { throw new Error("SecurityError"); },
    setItem() { throw new Error("QuotaExceededError"); },
  } };
  try {
    assert.equal(safety.readAccountPreference(), null);
    assert.doesNotThrow(() => safety.saveAccountPreference("north-africa"));
  } finally { delete globalThis.window; }
});

test("available storage still preserves the user's chosen account", () => {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  } };
  try {
    safety.saveAccountPreference("andalus-company");
    assert.equal(safety.readAccountPreference(), "andalus-company");
  } finally { delete globalThis.window; }
});

test("shared URLs discard forged account, IBAN, redirect, and unknown fragments", () => {
  const original = "https://cadysweet.github.io/cadysweet/?bank=__proto__&account=999&iban=fake&redirect=https://example.invalid#%3Csvg%3E";
  const url = safety.accountUrl(original, "nuran", true);
  assert.equal(url.href, "https://cadysweet.github.io/cadysweet/?bank=nuran#account");
  assert.equal(safety.accountUrl(original, "jumhouria").hash, "");
  assert.equal(safety.accountUrl("https://cadysweet.github.io/cadysweet/?x=1#accounts", "yaqeen").hash, "#accounts");
});

test("account UI is permitted only in a top-level window and fails closed", () => {
  const top = {};
  assert.equal(safety.isTopLevel({ top, self: top }), true);
  assert.equal(safety.isTopLevel({ top, self: {} }), false);
  assert.equal(safety.isTopLevel({ get top() { throw new Error("blocked"); }, self: {} }), false);
});
