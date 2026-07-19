import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));

test("manifest declares only the tabs permission required by URL actions", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.deepEqual(manifest.permissions, ["tabs"]);
  assert.equal(manifest.host_permissions, undefined);
});

test("every declared icon exists", async () => {
  for (const icon of new Set(Object.values(manifest.icons))) {
    await access(new URL(icon, root));
  }
});

test("popup files exist", async () => {
  await access(new URL("popup.html", root));
  await access(new URL("popup.js", root));
});
