import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const staging = path.join(root, ".github-pages-build");
const output = path.join(root, "dist");
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
try {
  // Relative public URLs work on both username.github.io and /repository/ Pages URLs.
  const page = (await readFile(path.join(root, "page.tsx"), "utf8"))
    .replace(/(["'])\/(?:banks\/)?([^"']+\.(?:png|jpg|svg))\1/g, '$1./$2$1');
  await writeFile(path.join(staging, "page.tsx"), page);
  await copyFile(path.join(root, "copy-sound.ts"), path.join(staging, "copy-sound.ts"));
  await copyFile(path.join(root, "browser-safety.ts"), path.join(staging, "browser-safety.ts"));
  await copyFile(path.join(root, "globals.css"), path.join(staging, "globals.css"));
  await writeFile(path.join(staging, "main.tsx"), `import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import Home from "./page";
import { isTopLevel } from "./browser-safety";
const root = document.getElementById("root")!;
if (isTopLevel()) {
  createRoot(root).render(<Home />);
} else {
  const message = document.createElement("p");
  message.textContent = "لأمانك، افتح موقع كادي مباشرة لعرض الحسابات.";
  const link = document.createElement("a");
  link.href = "./";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "افتح موقع كادي";
  root.className = "frame-notice";
  root.replaceChildren(message, link);
}
`);
  await writeFile(path.join(staging, "index.html"), `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; manifest-src 'self'; media-src 'none'; worker-src 'none'" />
<meta name="referrer" content="no-referrer" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#f6f2ed" />
<meta name="description" content="كل حسابات كادي المصرفية الرسمية في مكان واحد. اختر المصرف وانسخ بيانات الحساب." />
<title>Cady Pay | حسابات كادي الرسمية</title>
<link rel="icon" href="./cady-logo.png" />
<link rel="manifest" href="./site.webmanifest" />
<meta property="og:title" content="Cady Pay | حسابات كادي الرسمية" />
<meta property="og:description" content="اختر مصرفك وانسخ بيانات حساب كادي الرسمي في ثوانٍ." />
</head><body><div id="root"></div><noscript>يرجى تفعيل JavaScript لعرض الحسابات ونسخها.</noscript>
<script type="module" src="./main.tsx"></script></body></html>`);
  await build({
    configFile: false,
    root: staging,
    base: "./",
    publicDir: false,
    plugins: [react()],
    build: { outDir: output, emptyOutDir: true, assetsDir: "." },
  });
  const htmlPath = path.join(output, "index.html");
  const html = await readFile(htmlPath, "utf8");
  await writeFile(htmlPath, html.replace("<head>", "<head>\n<!-- المطور: معتز بن زاهية -->"));
  const publicFiles = ["cady-logo.png", "jumhouria-mark.png", "north-africa-mark.png", "nuran-mark.jpg", "andalus-mark.png", "yaqeen-mark.svg", "favicon.svg", "file.svg", "globe.svg", "window.svg", "og.png", "site.webmanifest"];
  for (const name of publicFiles) await copyFile(path.join(root, name), path.join(output, name));
  const manifest = JSON.parse(await readFile(path.join(output, "site.webmanifest"), "utf8"));
  manifest.start_url = "./";
  manifest.scope = "./";
  manifest.icons = manifest.icons.map(icon => ({ ...icon, src: icon.src.replace(/^\//, "./") }));
  await writeFile(path.join(output, "site.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(path.join(output, ".nojekyll"), "");
  console.log(`GitHub Pages static build ready: ${output}`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
