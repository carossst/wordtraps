#!/usr/bin/env node
/**
 * build-tracked-links.mjs
 * Prints one link per channel listed in tracking-links.json, tagged ?wt-source=<channel>.
 * Usage: npm run links   (optional: npm run links -- <path-or-page>, e.g. quiz/french-false-friends-business/)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "tracking-links.json"), "utf8"));
const target = String(process.argv[2] || "").replace(/^\/+/, "");
const base = new URL(target, cfg.baseUrl);

for (const channel of cfg.channels) {
  const slug = String(channel).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) continue;
  const url = new URL(base);
  url.searchParams.set("wt-source", slug);
  console.log(`${slug.padEnd(16)} ${url.toString()}`);
}
