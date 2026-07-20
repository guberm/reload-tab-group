import assert from "node:assert/strict";
import test from "node:test";

import { copyGroupUrls, exportGroupUrls, getGroupTabs, reloadGroup, setupPopup } from "../popup.js";

function chromeWithGroup(groupTabs) {
  return {
    tabs: {
      async query() {
        return groupTabs.map((tab, index) => ({
          ...tab,
          active: index === 0,
          groupId: 7
        }));
      }
    }
  };
}

test("group lookup uses one current-window query", async () => {
  const queries = [];
  const chromeApi = {
    tabs: {
      async query(query) {
        queries.push(query);
        return [
          { id: 11, active: true, groupId: 7 },
          { id: 12, active: false, groupId: 7 },
          { id: 13, active: false, groupId: 9 }
        ];
      }
    }
  };

  const tabs = await getGroupTabs(chromeApi);

  assert.deepEqual(queries, [{ currentWindow: true }]);
  assert.deepEqual(tabs.map((tab) => tab.id), [11, 12]);
});

test("popup actions are wired before group lookup finishes", () => {
  const elements = Object.fromEntries(
    ["reload", "copy", "export", "status"].map((id) => [id, {
      addEventListener(type, listener) { this[type] = listener; },
      disabled: false,
      textContent: ""
    }])
  );
  const documentApi = { getElementById(id) { return elements[id]; } };
  const chromeApi = { tabs: { query: () => new Promise(() => {}) } };

  setupPopup({ chromeApi, documentApi });

  assert.equal(typeof elements.reload.click, "function");
  assert.equal(typeof elements.copy.click, "function");
  assert.equal(typeof elements.export.click, "function");
});

test("late group lookup does not overwrite action feedback", async () => {
  const elements = Object.fromEntries(
    ["reload", "copy", "export", "status"].map((id) => [id, {
      addEventListener(type, listener) { this[type] = listener; },
      disabled: false,
      textContent: ""
    }])
  );
  const documentApi = { getElementById(id) { return elements[id]; } };
  let resolveInitialQuery;
  let queryCount = 0;
  const groupedTabs = [{ id: 11, active: true, groupId: 7, url: "https://example.com" }];
  const chromeApi = {
    tabs: {
      query() {
        queryCount += 1;
        if (queryCount === 1) {
          return new Promise((resolve) => { resolveInitialQuery = resolve; });
        }
        return Promise.resolve(groupedTabs);
      }
    }
  };
  let copiedText;
  const clipboard = { async writeText(text) { copiedText = text; } };

  const setup = setupPopup({ chromeApi, clipboard, documentApi });
  await elements.copy.click();
  assert.equal(copiedText, "https://example.com");
  assert.equal(elements.status.textContent, "Copied 1 URLs");

  resolveInitialQuery(groupedTabs);
  await setup;

  assert.equal(elements.status.textContent, "Copied 1 URLs");
});

test("copy all URLs writes every grouped tab URL to the clipboard", async () => {
  let copiedText;
  const chromeApi = chromeWithGroup([
    { id: 11, url: "https://example.com/one" },
    { id: 12, url: "https://example.com/two" }
  ]);
  const clipboard = { async writeText(text) { copiedText = text; } };

  const count = await copyGroupUrls(chromeApi, clipboard);

  assert.equal(count, 2);
  assert.equal(copiedText, "https://example.com/one\nhttps://example.com/two");
});

test("copy includes the pending URL of a loading grouped tab", async () => {
  let copiedText;
  const chromeApi = chromeWithGroup([
    { id: 11, url: "https://example.com/one" },
    { id: 12, url: "", pendingUrl: "https://example.com/loading" }
  ]);
  const clipboard = { async writeText(text) { copiedText = text; } };

  const count = await copyGroupUrls(chromeApi, clipboard);

  assert.equal(count, 2);
  assert.equal(copiedText, "https://example.com/one\nhttps://example.com/loading");
});

test("export all URLs downloads every grouped tab URL as text", async () => {
  let anchor;
  const chromeApi = chromeWithGroup([
    { id: 11, url: "https://example.com/one" },
    { id: 12, url: "https://example.com/two" }
  ]);
  const documentApi = {
    createElement() {
      anchor = { click() { this.clicked = true; } };
      return anchor;
    }
  };

  const count = await exportGroupUrls(chromeApi, documentApi);

  assert.equal(count, 2);
  assert.equal(anchor.download, "tab-group-urls.txt");
  assert.equal(anchor.clicked, true);
  assert.equal(
    decodeURIComponent(anchor.href.split(",")[1]),
    "https://example.com/one\nhttps://example.com/two\n"
  );
});

test("reload reloads every tab in the active group", async () => {
  const reloaded = [];
  const chromeApi = chromeWithGroup([{ id: 11 }, { id: 12 }, { id: 13 }]);
  chromeApi.tabs.reload = async (tabId) => { reloaded.push(tabId); };

  const count = await reloadGroup(chromeApi);

  assert.equal(count, 3);
  assert.deepEqual(reloaded, [11, 12, 13]);
});

test("popup copy button copies URLs and shows confirmation", async () => {
  const elements = Object.fromEntries(
    ["reload", "copy", "export", "status"].map((id) => [id, {
      addEventListener(type, listener) { this[type] = listener; },
      disabled: false,
      textContent: ""
    }])
  );
  const documentApi = { getElementById(id) { return elements[id]; } };
  const chromeApi = chromeWithGroup([
    { id: 11, url: "https://example.com/one" },
    { id: 12, url: "https://example.com/two" }
  ]);
  let copiedText;
  const clipboard = { async writeText(text) { copiedText = text; } };

  await setupPopup({ chromeApi, clipboard, documentApi });
  await elements.copy.click();

  assert.equal(copiedText, "https://example.com/one\nhttps://example.com/two");
  assert.equal(elements.status.textContent, "Copied 2 URLs");
});

test("popup reports a clipboard failure", async () => {
  const elements = Object.fromEntries(
    ["reload", "copy", "export", "status"].map((id) => [id, {
      addEventListener(type, listener) { this[type] = listener; },
      disabled: false,
      textContent: ""
    }])
  );
  const documentApi = { getElementById(id) { return elements[id]; } };
  const chromeApi = chromeWithGroup([{ id: 11, url: "https://example.com/one" }]);
  const clipboard = { async writeText() { throw new Error("denied"); } };

  await setupPopup({ chromeApi, clipboard, documentApi });
  await elements.copy.click();

  assert.equal(elements.status.textContent, "Copy failed");
});
