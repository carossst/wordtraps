#!/usr/bin/env node
/**
 * generate-sitemap.mjs
 * Generates sitemap.xml from seo-pages.json (fixed pages + "live" themes).
 * Never hand-edit sitemap.xml. Usage: node scripts/generate-sitemap.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const seo = JSON.parse(fs.readFileSync(path.join(ROOT, "seo-pages.json"), "utf8"));
const BASE = String(seo.defaults.baseUrl).replace(/\/+$/, "");
const today = new Date().toISOString().slice(0, 10);
const fixed = seo.defaults.fixedPageLastmod || {};
const pattern = seo.defaults.urlPatterns.theme;

const entry = (loc, lastmod) =>
  `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod || today}</lastmod>\n  </url>`;

const entries = ["/", "/privacy.html", "/terms.html", "/press.html"].map((p) =>
  entry(`${BASE}${p}`, fixed[p])
);
for (const t of seo.themes) {
  if (t.status === "live") entries.push(entry(`${BASE}${pattern.replace("{slug}", t.slug)}`, t.lastmod));
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- GENERATED FILE: do not hand-edit. Run: npm run generate:sitemap -->

${entries.join("\n\n")}

</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
console.log(`sitemap.xml written: ${entries.length} URLs (live pages only).`);
