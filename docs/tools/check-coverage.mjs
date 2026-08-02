#!/usr/bin/env node
/**
 * Stage D — the coverage report and the gate.
 *
 * The gate is a ratchet: the number of operators with an example and with a
 * description can go up, and a fall stops the build. The baseline is in
 * docs/baseline/coverage.json. To lower it, a person must edit that file, and
 * the change is then visible in the review.
 *
 * Run with --update to write the current numbers into the baseline.
 */
import fs from "node:fs";
import path from "node:path";
import { operatorFileName } from "./lib/opid.mjs";
import { BASELINE, DATA, DESCRIPTIONS, readJson, writeJson } from "./lib/paths.mjs";

const BASELINE_FILE = path.join(BASELINE, "coverage.json");

function currentNumbers(model, examples) {
  const documented = new Set(examples.flatMap((e) => e.ids));
  const perSource = {};
  for (const source of model.sources) {
    // A type method is an operator of the receiver type, so it counts here.
    const operators = [
      ...model.operators.filter((o) => o.source === source.id),
      ...(model.methods || []).filter((m) => m.source === source.id),
    ];
    perSource[source.id] = {
      operators: operators.length,
      withExample: operators.filter((o) => documented.has(o.id)).length,
      withDescription: operators.filter((o) =>
        fs.existsSync(path.join(DESCRIPTIONS, `${operatorFileName(o.id)}.md`)),
      ).length,
    };
  }
  const total = Object.values(perSource).reduce(
    (sum, s) => ({
      operators: sum.operators + s.operators,
      withExample: sum.withExample + s.withExample,
      withDescription: sum.withDescription + s.withDescription,
    }),
    { operators: 0, withExample: 0, withDescription: 0 },
  );
  return { perSource, total };
}

function main() {
  const update = process.argv.includes("--update");
  const model = readJson(path.join(DATA, "operators.json"));
  const exampleData = readJson(path.join(DATA, "examples.json"));
  const numbers = currentNumbers(model, exampleData.examples);

  const failures = [];
  for (const problem of model.problems) {
    if (problem.kind === "unregistered-source") {
      failures.push(
        `${problem.file} declares ${problem.count} operators and is not in docs/sources.json`,
      );
    }
    if (problem.kind === "parse-error" || problem.kind === "missing-source") {
      failures.push(`${problem.kind}: ${problem.file || problem.source}`);
    }
  }

  // Every example must document an operator that the model holds.
  const ids = new Set([
    ...model.operators.map((o) => o.id),
    ...(model.methods || []).map((m) => m.id),
  ]);
  for (const example of exampleData.examples) {
    // A topic example documents a guide page and names no operator.
    for (const id of example.ids || []) {
      if (!ids.has(id)) {
        failures.push(`${example.file} documents ${id}, which is not an operator`);
      }
    }
  }

  if (update) {
    writeJson(BASELINE_FILE, numbers);
    process.stderr.write("docs: coverage baseline written\n");
  } else if (fs.existsSync(BASELINE_FILE)) {
    const baseline = readJson(BASELINE_FILE);
    for (const key of ["withExample", "withDescription"]) {
      if (numbers.total[key] < baseline.total[key]) {
        failures.push(
          `coverage fell: ${key} is ${numbers.total[key]}, the baseline is ${baseline.total[key]}`,
        );
      }
    }
  }

  const percent = (a, b) => (b === 0 ? "0" : ((a / b) * 100).toFixed(1));
  process.stderr.write(
    `docs: ${numbers.total.operators} operators, ` +
      `${numbers.total.withExample} with an example (${percent(numbers.total.withExample, numbers.total.operators)}%), ` +
      `${numbers.total.withDescription} with a description ` +
      `(${percent(numbers.total.withDescription, numbers.total.operators)}%)\n`,
  );

  if (failures.length > 0) {
    for (const failure of failures) {
      process.stderr.write(`docs: FAIL ${failure}\n`);
    }
    process.exit(1);
  }
}

main();
