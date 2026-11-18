"use strict";

const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

describe("static app contracts", () => {
  test("keeps the Kit embed config key aligned", () => {
    const config = read("config.js");
    const success = read("success.html");

    expect(config).toContain("convertKitScriptSrc");
    expect(success).toContain("convertKitScriptSrc");
    expect(success).not.toContain("convertKitEmbedScriptSrc");
  });

  test("discloses GoatCounter when analytics is loaded", () => {
    const index = read("index.html");
    const privacy = read("privacy.html");
    const press = read("press.html");

    expect(index).toContain("data-goatcounter");
    expect(privacy).toContain("GoatCounter");
    expect(privacy).not.toContain(
      "does not use cookies, third-party analytics"
    );
    expect(press).not.toContain("no tracking");
  });

  test("discloses active leaderboard answer submissions", () => {
    const config = read("config.js");
    const privacy = read("privacy.html");

    expect(config).toContain("submitScores: true");
    expect(privacy).toContain("per-card answers and response times");
    expect(privacy).not.toContain(
      "Score submission to the public leaderboard is not yet active"
    );
  });

  test("gives modal dialogs an accessible name", () => {
    const ui = read("ui.js");
    expect(ui).toContain(
      'this.modalEl.setAttribute("aria-labelledby", "wt-modal-title");'
    );
  });

  test("uses a build-specific SW cache and does not auto-activate installs", () => {
    const sw = read("sw.js");
    const installBlock = sw.split(
      "// Allow app shell to activate an already-installed update on user intent."
    )[0];

    expect(sw).toMatch(/const BUILD_HASH = "(?:dev|[a-f0-9]{7,40})";/);
    expect(sw).toContain("${CACHE_PREFIX}-cache-${SW_VERSION}-${BUILD_HASH}");
    expect(installBlock).not.toContain("self.skipWaiting()");
    expect(sw).toContain('path === "/logic/leaderboard-logic.js"');
    expect(sw).toContain('path === "/ui-leaderboard.js"');
  });

  test("opens the installed app at the canonical root", () => {
    const manifest = JSON.parse(read("manifest.json"));
    expect(manifest.start_url).toBe("./");
  });

  test("keeps public document pages self-canonical", () => {
    expect(read("privacy.html")).toContain(
      'rel="canonical" href="https://wordtraps.com/privacy.html"'
    );
    expect(read("terms.html")).toContain(
      'rel="canonical" href="https://wordtraps.com/terms.html"'
    );
    expect(read("press.html")).toContain(
      'rel="canonical" href="https://wordtraps.com/press.html"'
    );
  });

  test("wires the end-screen flourish (pips, count-up, optional sound)", () => {
    expect(read("index.html")).toContain('src="./end-fx.js"');
    expect(read("index.html")).toContain('src="./sfx.js"');
    expect(read("sw.js")).toContain('path === "/end-fx.js"');
    expect(read("sw.js")).toContain('path === "/sfx.js"');
    const ui = read("ui.js");
    expect(ui).toContain(
      "this._runtime.runOutcomes.push(res.isCorrect === true)"
    );
    expect(ui).toContain("wt-end-pips");
    expect(read("style.css")).toContain("prefers-reduced-motion");
  });

  test("wires the newsletter modules (off until a Kit form URL is configured)", () => {
    const index = read("index.html");
    const sw = read("sw.js");
    const config = read("config.js");
    expect(index).toContain('src="./newsletter.js"');
    expect(index).toContain('src="./ui-newsletter.js"');
    expect(sw).toContain('"./newsletter.js"');
    expect(sw).toContain('path === "/ui-newsletter.js"');
    expect(config).toMatch(/newsletter: \{\s*formAction: \{ en: "" \}/);
    expect(read("ui.js")).toContain('case "confirm-newsletter"');
  });

  test("keeps the first-visit landing light (leaderboard card and second muted line wait for a first run)", () => {
    const ui = read("ui.js");
    expect(ui).toContain("const isFirstVisit =");
    expect(ui).toMatch(/!isFirstVisit && window\.WT_UI_Leaderboard/);
    expect(ui).toMatch(/!isFirstVisit && microTrust/);
  });
});
