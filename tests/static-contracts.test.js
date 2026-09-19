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
    expect(privacy).not.toContain("does not use cookies, third-party analytics");
    expect(press).not.toContain("no tracking");
  });

  test("uses a build-specific SW cache and does not auto-activate installs", () => {
    const sw = read("sw.js");
    const installBlock = sw.split(
      "// Allow app shell to activate an already-installed update on user intent."
    )[0];

    expect(sw).toContain('const BUILD_HASH = "dev";');
    expect(sw).toContain("${CACHE_PREFIX}-cache-${SW_VERSION}-${BUILD_HASH}");
    expect(installBlock).not.toContain("self.skipWaiting()");
    expect(sw).toContain('path === "/logic/leaderboard-logic.js"');
    expect(sw).toContain('path === "/ui-leaderboard.js"');
  });

  test("opens the installed app at the canonical root", () => {
    const manifest = JSON.parse(read("manifest.json"));
    expect(manifest.start_url).toBe("./");
  });
});
