"use strict";

const { loadBrowserScript } = require("./helpers/browser-loader");

const baseConfig = {
  storageSchemaVersion: "test-v1",
  identity: { appName: "Word Traps" },
  storage: {
    storageKey: "wt-test-storage",
    vanityCodeStorageKey: "wt-test-vanity"
  },
  premiumCodePrefix: "WT",
  premiumCodeRegex: "^WT-[A-Z0-9]{4}-[A-Z0-9]{4}$",
  acceptCodeOncePerDevice: true,
  limits: {
    freeRuns: 2
  },
  mistakesOnly: {
    freeRunsLimit: 2
  }
};

function createStorageManager(configOverrides) {
  const context = loadBrowserScript("storage.js");
  const StorageManager = context.window.WT_StorageManager;
  const cfg = {
    ...baseConfig,
    ...(configOverrides || {}),
    storage: {
      ...baseConfig.storage,
      ...(configOverrides?.storage || {})
    },
    limits: {
      ...baseConfig.limits,
      ...(configOverrides?.limits || {})
    },
    mistakesOnly: {
      ...baseConfig.mistakesOnly,
      ...(configOverrides?.mistakesOnly || {})
    }
  };
  const storage = new StorageManager(cfg);
  storage.init();
  return { context, storage };
}

test("free RUN economy consumes exactly 2 runs then blocks", () => {
  const { storage } = createStorageManager();

  const first = storage.consumeRunOrBlock();
  const second = storage.consumeRunOrBlock();
  const third = storage.consumeRunOrBlock();

  expect(first).toMatchObject({ ok: true, reason: "CONSUMED", balance: 1 });
  expect(second).toMatchObject({ ok: true, reason: "CONSUMED", balance: 0 });
  expect(third).toMatchObject({ ok: false, reason: "NO_RUNS", balance: 0 });
  expect(storage.getRunsUsed()).toBe(2);
});

test("premium RUN economy no longer consumes run balance", () => {
  const { storage } = createStorageManager();

  const unlocked = storage.unlockPremium();
  const first = storage.consumeRunOrBlock();
  const second = storage.consumeRunOrBlock();

  expect(unlocked).toMatchObject({ ok: true, already: false });
  expect(first).toMatchObject({ ok: true, reason: "PREMIUM" });
  expect(second).toMatchObject({ ok: true, reason: "PREMIUM" });
  expect(storage.getRunsBalance()).toBe(2);
  expect(storage.getRunsUsed()).toBe(2);
});

test("practice economy respects the configured free-run limit", () => {
  const { storage } = createStorageManager();

  const first = storage.consumePracticeOrBlock();
  const second = storage.consumePracticeOrBlock();
  const third = storage.consumePracticeOrBlock();

  expect(first).toMatchObject({
    ok: true,
    reason: "CONSUMED",
    used: 1,
    limit: 2
  });
  expect(second).toMatchObject({
    ok: true,
    reason: "CONSUMED",
    used: 2,
    limit: 2
  });
  expect(third).toMatchObject({
    ok: false,
    reason: "NO_RUNS",
    used: 2,
    limit: 2
  });
});

test("tryRedeemPremiumCode rejects empty input", () => {
  const { storage } = createStorageManager();

  const result = storage.tryRedeemPremiumCode("");

  expect(result).toMatchObject({ ok: false, reason: "EMPTY" });
  expect(storage.isPremium()).toBe(false);
});

test("tryRedeemPremiumCode rejects a code that does not match the configured format", () => {
  const { storage } = createStorageManager();

  const result = storage.tryRedeemPremiumCode("not-a-real-code");

  expect(result).toMatchObject({ ok: false, reason: "INVALID" });
  expect(storage.isPremium()).toBe(false);
});

// NOTE: this documents the current, known-insecure behavior (same root cause
// already flagged on the Pickleball/Coffee sibling apps): any string matching
// the WT-####-#### shape unlocks premium, with no server-side link back to an
// actual Stripe payment. Tracked separately as a security gap to close; this
// test exists so a future fix intentionally changes this assertion rather
// than silently regressing coverage.
test("tryRedeemPremiumCode currently accepts any code matching the configured format", () => {
  const { storage } = createStorageManager();

  const result = storage.tryRedeemPremiumCode("WT-AB12-CD34");

  expect(result).toMatchObject({ ok: true });
  expect(storage.isPremium()).toBe(true);
});

test("tryRedeemPremiumCode enforces one redemption per device when configured", () => {
  const { storage } = createStorageManager();

  const first = storage.tryRedeemPremiumCode("WT-1111-2222");
  expect(first).toMatchObject({ ok: true });
  expect(storage.data.codes.redeemedOnce).toBe(true);

  // Simulate a device that already redeemed a code but is no longer premium
  // (e.g. a future downgrade/expiry path) — the per-device flag must still
  // block a second free redemption.
  storage.data.isPremium = false;

  const second = storage.tryRedeemPremiumCode("WT-3333-4444");

  expect(second).toMatchObject({ ok: false, reason: "USED" });
  expect(storage.isPremium()).toBe(false);
});

test("tryRedeemPremiumCode is a no-op once premium is already unlocked", () => {
  const { storage } = createStorageManager();

  storage.unlockPremium();
  const result = storage.tryRedeemPremiumCode("WT-9999-0000");

  expect(result).toMatchObject({ ok: true, reason: "ALREADY" });
});
