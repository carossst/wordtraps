"use strict";

const { loadBrowserScript } = require("./helpers/browser-loader");

function createGameApi() {
  const context = loadBrowserScript("game.js", {
    window: {
      WT_ENUMS: {
        GAME_MODES: { RUN: "RUN", PRACTICE: "PRACTICE", BONUS: "BONUS" }
      }
    }
  });
  return context.window.WT_Game;
}

function makeItems(n) {
  // alternating-ish answers so a plain shuffle would still cluster sometimes
  const items = [];
  for (let i = 1; i <= n; i++) {
    items.push({ id: i, correctAnswer: i % 3 === 0 });
  }
  return items;
}

function baseConfig(overrides) {
  return Object.assign(
    {
      game: {
        maxChances: 3,
        poolSize: 400,
        antiRepetitionUntilExhaustion: true
      },
      mistakesOnly: { enabled: true },
      secretBonus: { minDeckSize: 1 },
      curatedFreeRuns: {
        enabled: true,
        runCount: 2,
        cardIdsByRun: { 1: [5, 2, 8, 1], 2: [9, 6, 3, 7] }
      }
    },
    overrides || {}
  );
}

test("curated opening is prepended in configured order for free runs 1 and 2", () => {
  const WT_Game = createGameApi();
  const items = makeItems(60);
  const cfg = baseConfig();

  const run1 = WT_Game.buildDeck({
    items,
    statsByItem: {},
    mistakesOnly: false,
    config: cfg,
    runStartNumber: 1
  });
  const run2 = WT_Game.buildDeck({
    items,
    statsByItem: {},
    mistakesOnly: false,
    config: cfg,
    runStartNumber: 2
  });

  expect(run1.ids.slice(0, 4)).toEqual([5, 2, 8, 1]);
  expect(run2.ids.slice(0, 4)).toEqual([9, 6, 3, 7]);
  // every configured id appears exactly once in the full deck
  expect(run1.ids.filter((id) => id === 5)).toHaveLength(1);
});

test("no curated opening past runCount, or when disabled, or without runStartNumber", () => {
  const WT_Game = createGameApi();
  const items = makeItems(60);

  const run3 = WT_Game.buildDeck({
    items,
    statsByItem: {},
    mistakesOnly: false,
    config: baseConfig(),
    runStartNumber: 3
  });
  expect(run3.ids.slice(0, 4)).not.toEqual([5, 2, 8, 1]);

  const noRunNum = WT_Game.buildDeck({
    items,
    statsByItem: {},
    mistakesOnly: false,
    config: baseConfig()
  });
  expect(noRunNum.ids.slice(0, 4)).not.toEqual([5, 2, 8, 1]);

  const disabled = WT_Game.buildDeck({
    items,
    statsByItem: {},
    mistakesOnly: false,
    config: baseConfig({ curatedFreeRuns: { enabled: false } }),
    runStartNumber: 1
  });
  expect(disabled.ids.slice(0, 4)).not.toEqual([5, 2, 8, 1]);
});

test("curated cards already seen by the player are dropped from the opening", () => {
  const WT_Game = createGameApi();
  const items = makeItems(60);
  const run = WT_Game.buildDeck({
    items,
    statsByItem: { 2: { seenCount: 1 }, 8: { seenCount: 3 } },
    mistakesOnly: false,
    config: baseConfig(),
    runStartNumber: 1
  });
  expect(run.ids.slice(0, 2)).toEqual([5, 1]);
});

test("deck never has more than 3 consecutive same-answer questions", () => {
  const WT_Game = createGameApi();
  // heavily imbalanced answers to stress the de-clusterer
  const items = [];
  for (let i = 1; i <= 120; i++) items.push({ id: i, correctAnswer: i > 100 });
  let worstFirst30 = 0;
  for (let t = 0; t < 40; t++) {
    const deck = WT_Game.buildDeck({
      items,
      statsByItem: {},
      mistakesOnly: false,
      config: baseConfig({ curatedFreeRuns: { enabled: false } }),
      runStartNumber: null
    });
    const seq = deck.ids
      .slice(0, 30)
      .map((id) => (id > 100 ? "V" : "F"))
      .join("");
    let mx = 1;
    let cur = 1;
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] === seq[i - 1]) {
        cur += 1;
        mx = Math.max(mx, cur);
      } else cur = 1;
    }
    worstFirst30 = Math.max(worstFirst30, mx);
  }
  expect(worstFirst30).toBeLessThanOrEqual(3);
});
