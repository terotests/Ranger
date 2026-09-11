// The examples, read out of the pinned CommonMark specification.
//
// Shared by `markdown-parity.mjs`, which scores the HTML, and
// `markdown-srcmap.mjs`, which scores the source map. It was inside the
// parity script; a second copy in the second reader would have been a second
// opinion about where an example ends, which is the sort of drift that makes
// two harnesses disagree about how many examples there are.
import fs from "node:fs";

/**
 * The examples, read out of the specification the way its own test runner
 * reads them: fenced by 32 backticks, the markdown and the expected HTML
 * separated by a lone `.`, with `→` standing in for a tab.
 */
export function readExamples(SPEC) {
  const text = fs
    .readFileSync(SPEC, "utf8")
    .replace(/\r\n?/g, "\n")
    .replace(/^<!-- END TESTS -->(.|[\n])*/m, "");
  const out = [];
  let section = "";
  const re = /^`{32} example\n([\s\S]*?)^\.\n([\s\S]*?)^`{32}$|^#{1,6} *(.*)$/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[3] !== undefined) {
      section = m[3];
    } else {
      out.push({
        number: out.length + 1,
        section,
        markdown: m[1].replace(/→/g, "\t"),
        html: m[2].replace(/→/g, "\t"),
      });
    }
  }
  return out;
}

