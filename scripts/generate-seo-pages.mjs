#!/usr/bin/env node
/**
 * generate-seo-pages.mjs
 * Generates /quiz/<slug>/index.html from seo-pages.json + content.json.
 * Page bodies come ONLY from content.json: nothing is written from memory.
 * Folders are created automatically: never create them by hand.
 *
 * Usage: node scripts/generate-seo-pages.mjs
 * Pages with status "ready" or "live" are generated; "draft" is skipped.
 * Fails loudly (exit 1) if a page has fewer than defaults.minWordCount
 * visible words or no matching pairs (anti thin content).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const seo = JSON.parse(fs.readFileSync(path.join(ROOT, "seo-pages.json"), "utf8"));
const content = JSON.parse(fs.readFileSync(path.join(ROOT, "content.json"), "utf8"));
const BASE = String(seo.defaults.baseUrl).replace(/\/+$/, "");
const MIN_WORDS = Number(seo.defaults.minWordCount) || 450;
const pattern = seo.defaults.urlPatterns.theme;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wordCount = (s) => String(s).split(/\s+/).filter(Boolean).length;
const themeUrl = (slug) => pattern.replace("{slug}", slug);

function pairsFor(theme) {
  const { tag, category } = theme.filter || {};
  return (content.items || []).filter(
    (i) => (!tag || i.tag === tag) && (!category || i.category === category)
  );
}

function renderPair(item) {
  const sign = item.correctAnswer ? "=" : "≠";
  const lines = String(item.explanationShort)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${esc(l)}</p>`)
    .join("\n          ");
  return `        <section class="wt-seo-pair" id="pair-${item.id}">
          <h3 class="wt-h2">${esc(item.termFr)} ${sign} ${esc(item.termEn)} <span class="wt-muted">(${esc(item.level)})</span></h3>
          ${lines}
        </section>`;
}

function render(theme, pairs, siblings) {
  const url = `${BASE}${themeUrl(theme.slug)}`;
  const cta = `/?wt-source=seo&wt-topic=${encodeURIComponent(theme.slug)}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Word Traps", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: theme.h1, item: url }
        ]
      },
      { "@type": "WebPage", name: theme.h1, url, description: theme.metaDescription, inLanguage: "en" }
    ]
  };
  const related = siblings
    .map((s) => `<li><a href="${themeUrl(s.slug)}">${esc(s.h1)}</a></li>`)
    .join("\n            ");
  return `<!DOCTYPE html>
<!-- GENERATED FILE: do not hand-edit. Run: npm run publish:seo -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(theme.title)}</title>
  <meta name="description" content="${esc(theme.metaDescription)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(theme.h1)}">
  <meta property="og:description" content="${esc(theme.metaDescription)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}/icons/og-image.png">
  <meta property="og:site_name" content="Test Your French">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
  <link rel="shortcut icon" href="/icons/favicon.ico">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="wt-page--doc">
  <div class="wt-app">
    <main class="wt-main">
      <div class="wt-container wt-container--doc">
        <div class="wt-card">
          <nav class="wt-doc-nav"><a href="/" class="wt-btn wt-btn--ghost">Home</a></nav>
          <h1 class="wt-h1">${esc(theme.h1)}</h1>
          <p class="wt-press-lead">${esc(theme.lead)}</p>
          <p class="wt-muted">${pairs.length} word pairs.</p>
          <div class="wt-divider"></div>
${pairs.map(renderPair).join("\n")}
          <div class="wt-divider"></div>
          <p><a href="${cta}" class="wt-btn wt-btn--primary">Play Word Traps</a></p>
          <h2 class="wt-h2">More word lists</h2>
          <ul>
            ${related}
          </ul>
        </div>
      </div>
    </main>
  </div>
</body>
</html>
`;
}

const active = seo.themes.filter((t) => t.status === "ready" || t.status === "live");
let failed = false;
for (const theme of active) {
  const pairs = pairsFor(theme);
  const html = render(theme, pairs, active.filter((t) => t.slug !== theme.slug));
  const words = wordCount(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " "));
  if (!pairs.length || words < MIN_WORDS) {
    console.error(`FAIL ${theme.slug}: ${pairs.length} pairs, ${words} words (min ${MIN_WORDS}).`);
    failed = true;
    continue;
  }
  const dir = path.join(ROOT, themeUrl(theme.slug).replace(/^\/|\/$/g, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  console.log(`${theme.slug}: ${pairs.length} pairs, ${words} words [${theme.status}]`);
}
for (const t of seo.themes.filter((t) => t.status === "draft")) console.log(`skipped (draft): ${t.slug}`);
if (failed) process.exit(1);
