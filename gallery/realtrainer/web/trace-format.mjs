// SPDX-License-Identifier: AGPL-3.0-or-later
//
// How a trace is written to disk — the one place, so the Ranger recorder and
// the reference recorder cannot drift into two formats the diff has to know
// about.
//
// A NODE IS A LINE. `JSON.stringify(trace, null, 1)` puts every field of every
// node on a line of its own, which for these traces is four lines to say
// `button "Koti"`: a diary's Home is a thousand nodes and eight frames of it
// is thirty-eight thousand lines. One node per line is the same information at
// a fifth of the size, and a better diff besides — a control that changed is
// one changed line instead of a four-line block that has to be read.
//
// Everything around the nodes stays indented, because that part IS read.

const j = (v) => JSON.stringify(v);

/** The trace as text, ending in a newline. */
export function stringifyTrace(trace) {
  const { frames, ...head } = trace;
  const lead = Object.entries(head)
    .map(([k, v]) => ` ${j(k)}: ${j(v)},`)
    .join("\n");
  const body = (frames ?? [])
    .map((f) => {
      const { nodes, ...rest } = f;
      const fields = Object.entries(rest)
        .map(([k, v]) => `   ${j(k)}: ${j(v)},`)
        .join("\n");
      const rows = (nodes ?? []).map((n) => `    ${j(n)}`).join(",\n");
      return `  {\n${fields}\n   "nodes": [\n${rows}\n   ]\n  }`;
    })
    .join(",\n");
  return `{\n${lead}\n "frames": [\n${body}\n ]\n}\n`;
}
