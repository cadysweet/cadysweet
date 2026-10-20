import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  await readFile(new URL("./copy-sound.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } },
);
let imports = 0;
const load = () => import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}#${imports++}`);

const parameter = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {} });

test("unlocks audio within the click, waits for success, and reuses one context", async () => {
  let instances = 0;
  let resumes = 0;
  const notes = [];
  let unlock;
  class FakeAudio {
    state = "suspended";
    currentTime = 1;
    destination = {};
    constructor() { instances++; }
    resume() {
      resumes++;
      return new Promise(resolve => { unlock = () => { this.state = "running"; resolve(); }; });
    }
    createOscillator() {
      const note = { frequency: parameter(), connect() {}, disconnect() {}, start(time) { notes.push(time); }, stop() {} };
      return note;
    }
    createGain() { return { gain: parameter(), connect() {}, disconnect() {} }; }
  }
  globalThis.window = { AudioContext: FakeAudio };
  try {
    const { prepareCopyTone } = await load();
    const successSound = prepareCopyTone();
    assert.equal(resumes, 1, "resume happens synchronously before clipboard await");
    assert.equal(notes.length, 0, "no sound before successful copy");
    successSound();
    await Promise.resolve();
    assert.equal(notes.length, 0, "waits for audio to unlock");
    unlock();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(notes, [1, 1.085]);
    prepareCopyTone()();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(instances, 1);
    assert.equal(notes.length, 4);
  } finally { delete globalThis.window; }
});

test("unsupported and blocked audio stay silent without rejecting", async () => {
  try {
    globalThis.window = {};
    (await load()).prepareCopyTone()();
    globalThis.window = { AudioContext: class {
      state = "suspended";
      resume() { return Promise.reject(new Error("audio blocked")); }
      createOscillator() { throw new Error("must not play"); }
    } };
    (await load()).prepareCopyTone()();
    await new Promise(resolve => setImmediate(resolve));
  } finally { delete globalThis.window; }
});
