"use strict";

const {
  createWindowLike,
  loadBrowserScript
} = require("./helpers/browser-loader");

function load() {
  const windowLike = createWindowLike({});
  loadBrowserScript("newsletter.js", { window: windowLike });
  return windowLike.WT_Newsletter;
}

describe("newsletter module", () => {
  test("is off while no Kit form URL is configured", async () => {
    const NL = load();
    const config = { newsletter: { formAction: { en: "" } } };
    expect(NL.isConfigured(config, "en")).toBe(false);
    expect(NL.shouldOffer(config, "en")).toBe(false);
    expect(await NL.submit(config, "en", { email: "a@b.co" })).toBe("off");
  });

  test("rejects invalid emails and accepts the honeypot silently", async () => {
    const NL = load();
    const config = {
      newsletter: {
        formAction: { en: "https://example.test/forms/1/subscriptions" }
      }
    };
    expect(NL.isConfigured(config, "en")).toBe(true);
    expect(await NL.submit(config, "en", { email: "nope" })).toBe("invalid");
    expect(
      await NL.submit(config, "en", { email: "a@b.co", website: "bot" })
    ).toBe("sent");
  });
});
