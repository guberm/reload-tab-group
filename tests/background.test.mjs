import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadWorker(groupTabs = []) {
  let onClicked;
  const calls = { badges: [], queries: [], reloads: [], titles: [] };
  const chrome = {
    action: {
      onClicked: { addListener(listener) { onClicked = listener; } },
      setBadgeBackgroundColor(options) { calls.badges.push(options); },
      setBadgeText(options) { calls.badges.push(options); },
      setTitle(options) { calls.titles.push(options); }
    },
    tabs: {
      query(query, callback) {
        calls.queries.push(query);
        callback(groupTabs);
      },
      reload(tabId) { calls.reloads.push(tabId); }
    }
  };

  const source = await readFile(new URL("../background.js", import.meta.url), "utf8");
  vm.runInNewContext(source, { chrome });
  return { calls, click: onClicked };
}

test("clicking a grouped tab reloads every tab in that group", async () => {
  const { calls, click } = await loadWorker([{ id: 11 }, { id: 12 }, { id: 13 }]);

  click({ id: 11, groupId: 7 });

  assert.equal(calls.queries.length, 1);
  assert.equal(calls.queries[0].groupId, 7);
  assert.deepEqual(calls.reloads, [11, 12, 13]);
});

test("clicking an ungrouped tab does not reload anything", async () => {
  const { calls, click } = await loadWorker([{ id: 11 }]);

  click({ id: 11, groupId: -1 });

  assert.deepEqual(calls.queries, []);
  assert.deepEqual(calls.reloads, []);
  assert.equal(calls.titles.at(-1).title, "This tab is not in a group");
});
