"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  createWindowLike,
  loadBrowserScript
} = require("./helpers/browser-loader");

function load(search, session) {
  const store = new Map(Object.entries(session || {}));
  const windowLike = createWindowLike({
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v))
    }
  });
  windowLike.location.search = search;
  loadBrowserScript("analytics.js", { window: windowLike });
  return { A: windowLike.WT_Analytics, windowLike };
}

describe("entry source tracking", () => {
  test("reads wt-source, then utm_source, else direct", () => {
    expect(load("?wt-source=Instagram").A.getEntrySource()).toBe("instagram");
    expect(load("?utm_source=news").A.getEntrySource()).toBe("news");
    expect(load("").A.getEntrySource()).toBe("direct");
  });

  test("keeps the channel for the session when the query is gone", () => {
    const { A, windowLike } = load("?wt-source=seo");
    expect(A.getEntrySource()).toBe("seo");
    windowLike.location.search = "";
    expect(A.getEntrySource()).toBe("seo");
  });

  test("tags share and house-ad links", () => {
    const ui = fs.readFileSync(path.join(__dirname, "..", "ui.js"), "utf8");
    expect(ui).toContain(
      'withSource(String(identity.appUrl || "").trim(), "share")'
    );
    expect(ui).toContain('"wordtraps")');
  });
});
