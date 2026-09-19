// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, "../../web/standalone");
const html = fs.readFileSync(path.join(PAGE, "index.html"), "utf8");
const js = fs.readFileSync(path.join(PAGE, "standalone.mjs"), "utf8");

describe("Copy for Confluence on the RangerFlow page", () => {
  it("is a header button that copies the embed link", () => {
    assert.match(html, /id="confluence"/);
    assert.match(html, />Copy for Confluence</);
    assert.match(html, /id="shareconfluence"/);
    assert.match(js, /copyForConfluence/);
    assert.match(js, /clipboard\.writeText\(embed\)/);
    assert.match(js, /\?embed=1#\$\{DOC_KEY\}=/);
  });

  it("still opens a document that arrived as ?rf= when a host stripped the hash", () => {
    assert.match(js, /function packedFromLocation/);
    assert.match(js, /location\.search\)\.get\(DOC_KEY\)/);
  });

  it("names the Smart Link failure and offers a PNG paste that does not need the app", () => {
    assert.match(html, /can't display content from this type of terotests\.github\.io link/);
    assert.match(html, /id="sharepng"/);
    assert.match(html, />Copy picture</);
    assert.match(js, /pngBlobFromSvg/);
    assert.match(js, /image\/png/);
  });

  it("tells a parent Forge macro how tall the embed wants to be", () => {
    assert.match(js, /rangerflow:embed-size/);
    assert.match(js, /function reportEmbedSize/);
  });
});
