/**
 * Turn `bench/corpus/*.json` into `bench/CorpusData.rgr`.
 *
 * The conformance run has no inputs but its own source: a program that read a
 * file would need a host contract on five targets, and a divergence could then
 * be about the file system rather than about the engine.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BENCH = path.join(HERE, "..", "gallery", "rangerforms", "bench");
const CORPUS = path.join(BENCH, "corpus");
const OUT = path.join(BENCH, "CorpusData.rgr");

const files = fs.readdirSync(CORPUS).filter((f) => f.endsWith(".json")).sort();
const cases = files.map((f) => {
  const spec = JSON.parse(fs.readFileSync(path.join(CORPUS, f), "utf8"));
  // Only what the engine reads. `knownDifferences` and `note` are for the
  // SurveyJS comparison and would be dead weight in five compiled binaries.
  return { name: spec.name, body: JSON.stringify({ name: spec.name, survey: spec.survey, script: spec.script || [] }) };
});

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

let out = `; SPDX-License-Identifier: AGPL-3.0-or-later

; ============================================================================
; CorpusData.rgr — GENERATED. Do not edit.
; ============================================================================
;
;     npm run rangerforms:corpus
;
; The SurveyJS comparison corpus, compiled in, so the cross-target conformance
; run has no inputs but its own source. See \`Conformance.rgr\`.
; ============================================================================

class CorpusData {
    sfn names:[string] () {
        def out:[string]
`;
for (const c of cases) out += `        push out "${esc(c.name)}"\n`;
out += `        return out
    }

    sfn cases:[string] () {
        def out:[string]
`;
for (const c of cases) out += `        push out "${esc(c.body)}"\n`;
out += `        return out
    }
}
`;
fs.writeFileSync(OUT, out);
console.log(`wrote ${path.relative(process.cwd(), OUT)} — ${cases.length} cases`);
