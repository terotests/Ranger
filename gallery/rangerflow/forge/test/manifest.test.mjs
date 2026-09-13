// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { AUTO_CONVERT_PATTERNS } from "../src/share-url.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const yaml = fs.readFileSync(path.join(ROOT, "manifest.yml"), "utf8");

describe("manifest", () => {
  it("is a Custom UI macro with autoconvert and no backend", () => {
    assert.match(yaml, /key:\s*rangerflow/);
    assert.match(yaml, /resource:\s*rangerflow-macro/);
    assert.match(yaml, /title:\s*RangerFlow/);
    assert.match(yaml, /category:\s*embed/);
    assert.match(yaml, /layout:\s*block/);
    assert.match(yaml, /emitsReadyEvent:\s*true/);
    assert.match(yaml, /path:\s*static\/rangerflow/);
    assert.match(yaml, /scopes:\s*\[\]/);
    assert.doesNotMatch(yaml, /^\s*function:/m);
    assert.doesNotMatch(yaml, /resolver:/);
    assert.doesNotMatch(yaml, /storage:/);
  });

  it("allows GitHub Pages as an iframe source and as a client fetch", () => {
    assert.match(yaml, /frames:[\s\S]*https:\/\/terotests\.github\.io/);
    assert.match(yaml, /fetch:[\s\S]*client:[\s\S]*https:\/\/terotests\.github\.io/);
  });

  it("registers every matcher the share-url module advertises", () => {
    for (const pattern of AUTO_CONVERT_PATTERNS) {
      const needle = `pattern: "${pattern}"`;
      assert.equal(yaml.includes(needle), true, pattern);
    }
  });

  it("does not ship a resolver or a graph store", () => {
    const src = fs.readdirSync(path.join(ROOT, "src"));
    assert.deepEqual(src.sort(), ["frontend.js", "share-url.mjs"]);
  });

  it("documents the Smart Link github.io refusal the paste currently hits", () => {
    const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
    assert.match(readme, /can't display content from this type of terotests\.github\.io link/);
  });

  it("gitignores the Custom UI bundle and node_modules so they are built locally", () => {
    const ignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
    assert.match(ignore, /^node_modules\/$/m);
    assert.match(ignore, /^static\/rangerflow\/macro\.js$/m);
    assert.match(ignore, /^\.forge\/$/m);
  });

  it("refuses to deploy the placeholder app.id", async () => {
    const { appIdFromManifest, PLACEHOLDER_APP_ID } =
      await import("../scripts/check-ready.mjs");
    assert.equal(appIdFromManifest(yaml), PLACEHOLDER_APP_ID);
    assert.equal(
      appIdFromManifest("app:\n  id: ari:cloud:ecosystem::app/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee\n"),
      "ari:cloud:ecosystem::app/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
    );
  });
});
