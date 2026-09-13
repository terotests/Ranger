// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTO_CONVERT_PATTERNS,
  DEFAULT_HEIGHT_PX,
  clampEmbedHeight,
  isAllowedRangerFlowUrl,
  isTrustedEmbedOrigin,
  matchesAutoConvert,
  packedFromUrl,
  pastedUrlFromContext,
  toEditorUrl,
  toEmbedUrl,
} from "../src/share-url.mjs";

const DOC = "zABCDEF";
const SHARE = `https://terotests.github.io/Ranger/rangerflow/#rf=${DOC}`;
const EMBED = `https://terotests.github.io/Ranger/rangerflow/?embed=1#rf=${DOC}`;
const EDITOR = `https://terotests.github.io/Ranger/rangerflow/#rf=${DOC}`;

describe("allow-list", () => {
  it("accepts the published editor and embed links", () => {
    assert.equal(isAllowedRangerFlowUrl(SHARE), true);
    assert.equal(isAllowedRangerFlowUrl(EMBED), true);
    assert.equal(isAllowedRangerFlowUrl("https://terotests.github.io/Ranger/rangerflow/"), true);
    assert.equal(isAllowedRangerFlowUrl("https://terotests.github.io/Ranger/rangerflow/index.html?embed=1"), true);
  });

  it("accepts a local serve used with forge tunnel", () => {
    assert.equal(isAllowedRangerFlowUrl("http://localhost:8080/#rf=" + DOC), true);
    assert.equal(isAllowedRangerFlowUrl("http://127.0.0.1:8080/?embed=1#rf=" + DOC), true);
  });

  it("rejects anything that is not the RangerFlow page", () => {
    const bad = [
      "https://evil.example/Ranger/rangerflow/#rf=" + DOC,
      "https://terotests.github.io.evil.example/Ranger/rangerflow/",
      "https://terotests.github.io/Ranger/rangerflow/../office/",
      "https://terotests.github.io/Ranger/",
      "https://terotests.github.io/Ranger/rangerflow/extra",
      "javascript:alert(1)",
      "data:text/html,hi",
      "https://user:pass@terotests.github.io/Ranger/rangerflow/",
      "",
      "not a url",
    ];
    for (const u of bad) {
      assert.equal(isAllowedRangerFlowUrl(u), false, u);
    }
  });
});

describe("embed / editor URL", () => {
  it("adds embed=1 and keeps the fragment, which is the diagram", () => {
    assert.equal(toEmbedUrl(SHARE), EMBED);
    assert.equal(toEmbedUrl(EMBED), EMBED);
    assert.equal(packedFromUrl(toEmbedUrl(SHARE)), DOC);
  });

  it("Open in RangerFlow drops embed=1 and keeps the document", () => {
    assert.equal(toEditorUrl(EMBED), EDITOR);
    assert.equal(toEditorUrl(SHARE), EDITOR);
    assert.equal(packedFromUrl(toEditorUrl(EMBED)), DOC);
  });

  it("returns null instead of wrapping a foreign URL", () => {
    assert.equal(toEmbedUrl("https://example.com/"), null);
    assert.equal(toEditorUrl("https://evil.example/?u=" + SHARE), null);
  });

  it("still fits the default frame the macro uses", () => {
    assert.equal(DEFAULT_HEIGHT_PX, 650);
  });
});

describe("pasted context", () => {
  it("reads autoConvertLink from the shapes Forge has used", () => {
    assert.equal(pastedUrlFromContext({ extension: { autoConvertLink: SHARE } }), SHARE);
    assert.equal(pastedUrlFromContext({ extension: { config: { autoConvertLink: EMBED } } }), EMBED);
    assert.equal(pastedUrlFromContext({ extension: { config: { url: SHARE } } }), SHARE);
    assert.equal(pastedUrlFromContext({}), "");
  });

  it("reads the packed document from the query when a host strips the hash", () => {
    const q = `https://terotests.github.io/Ranger/rangerflow/?embed=1&rf=${DOC}`;
    assert.equal(packedFromUrl(q), DOC);
    assert.equal(packedFromUrl(SHARE), DOC);
  });
});

describe("autoConvert patterns", () => {
  it("match the URLs the share panel actually copies", () => {
    const pastes = [
      SHARE,
      EMBED,
      "https://terotests.github.io/Ranger/rangerflow/",
      "https://terotests.github.io/Ranger/rangerflow",
      "https://terotests.github.io/Ranger/rangerflow/index.html",
      "https://terotests.github.io/Ranger/rangerflow/?scenario=erd",
    ];
    for (const u of pastes) {
      assert.equal(matchesAutoConvert(u), true, u);
    }
  });

  it("do not claim foreign URLs", () => {
    assert.equal(matchesAutoConvert("https://figma.com/file/abc"), false);
    assert.equal(matchesAutoConvert("https://terotests.github.io/Ranger/office/"), false);
    assert.equal(AUTO_CONVERT_PATTERNS.length > 0, true);
  });
});

describe("embed host messages", () => {
  it("trusts GitHub Pages and loopback, and nothing else", () => {
    assert.equal(isTrustedEmbedOrigin("https://terotests.github.io"), true);
    assert.equal(isTrustedEmbedOrigin("http://localhost:8080"), true);
    assert.equal(isTrustedEmbedOrigin("https://evil.example"), false);
    assert.equal(isTrustedEmbedOrigin("not an origin"), false);
  });

  it("clamps the iframe height the embed page asks for", () => {
    assert.equal(clampEmbedHeight(650), 650);
    assert.equal(clampEmbedHeight(10), 280);
    assert.equal(clampEmbedHeight(9999), 1400);
    assert.equal(clampEmbedHeight("nope"), DEFAULT_HEIGHT_PX);
  });
});
