"use strict";

const {
  createWindowLike,
  loadBrowserScript
} = require("./helpers/browser-loader");

function load() {
  const windowLike = createWindowLike({});
  loadBrowserScript("score-card.js", { window: windowLike });
  return windowLike.WT_ScoreCard;
}

function recorder() {
  const texts = [];
  const ctx = new Proxy(
    { fillText: (t) => texts.push(String(t)) },
    { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true }
  );
  return { ctx, texts };
}

describe("score card", () => {
  test("draws the score, the answers line and the site address", () => {
    const SC = load();
    const { ctx, texts } = recorder();
    SC.draw(ctx, { score: 7, correct: 6, total: 8 });
    expect(texts).toContain("7");
    expect(texts).toContain("6/8 correct answers");
    expect(texts).toContain("wordtraps.com");
  });

  test("skips the answers line when counts are missing or inconsistent", () => {
    const SC = load();
    const { ctx, texts } = recorder();
    SC.draw(ctx, { score: 3, correct: 9, total: 8 });
    expect(texts.some((t) => t.includes("correct answers"))).toBe(false);
  });

  test("names the file after the score", () => {
    expect(load().fileName(12)).toBe("word-traps-score-12.png");
  });
});
