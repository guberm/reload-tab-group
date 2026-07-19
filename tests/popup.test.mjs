import assert from "node:assert/strict";
import test from "node:test";

import { copyGroupUrls, exportGroupUrls, reloadGroup, setupPopup } from "../popup.js";

function chromeWithGroup(groupTabs) {
  return {
    tabs: {
      async query(query) {
        if (query.active) return [{ id: 11, groupId: 7 }];
        return groupTabs;
      }
    }
  };
}

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
