import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const seo = JSON.parse(read("seo-pages.json"));
const content = JSON.parse(read("content.json"));
const generated = seo.themes.filter((t) => t.status !== "draft");

describe("seo pages contract", () => {
  it("has a generated page for every ready/live theme, with canonical and CTA tagged wt-source=seo", () => {
    for (const t of generated) {
      const html = read(`quiz/${t.slug}/index.html`);
      expect(html).toContain(
        `<link rel="canonical" href="${seo.defaults.baseUrl}/quiz/${t.slug}/">`
      );
      expect(html).toContain(`wt-source=seo&wt-topic=${t.slug}`);
      expect(html).toContain("GENERATED FILE");
    }
  });

  it("lists every matching content.json pair, verbatim, on its page", () => {
    for (const t of generated) {
      const html = read(`quiz/${t.slug}/index.html`);
      const pairs = content.items.filter(
        (i) => i.tag === t.filter.tag && i.category === t.filter.category
      );
      expect(pairs.length).toBeGreaterThan(0);
      for (const p of pairs) expect(html).toContain(`id="pair-${p.id}"`);
    }
  });

  it("keeps only live themes in sitemap.xml and every ready page out of it", () => {
    const sitemap = read("sitemap.xml");
    for (const t of seo.themes) {
      const loc = `<loc>${seo.defaults.baseUrl}/quiz/${t.slug}/</loc>`;
      expect(sitemap.includes(loc)).toBe(t.status === "live");
    }
  });

  it("only links to related pages that exist", () => {
    for (const t of generated) {
      const html = read(`quiz/${t.slug}/index.html`);
      for (const m of html.matchAll(/href="(\/quiz\/[^"]+\/)"/g)) {
        expect(fs.existsSync(path.join(root, m[1], "index.html"))).toBe(true);
      }
    }
  });
});
