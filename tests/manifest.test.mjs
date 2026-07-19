import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));

test("manifest is a permission-free Manifest V3 extension", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background.service_worker, "background.js");
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
});

test("every declared icon exists", async () => {
  for (const icon of new Set(Object.values(manifest.icons))) {
    await access(new URL(icon, root));
  }
});
