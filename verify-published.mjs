import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
for (const name of await readdir(dist)) {
  const generated = await readFile(path.join(dist, name));
  const committed = await readFile(path.join(root, name));
  assert.ok(generated.equals(committed), `Published file does not match source build: ${name}`);
}
const html = await readFile(path.join(dist, "index.html"), "utf8");
assert.match(html, /http-equiv="Content-Security-Policy"/);
assert.match(html, /script-src 'self';/);
assert.doesNotMatch(html, /unsafe-eval|<script[^>]+src="https?:/);
assert.match(html, /name="referrer" content="no-referrer"/);
assert.match(html, /المطور: معتز بن زاهية/);
console.log("Published assets match the source build and security metadata.");
