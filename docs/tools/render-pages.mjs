#!/usr/bin/env node
/**
 * Stage C — write the reference pages.
 *
 * Input:  docs/site/src/data/operators.json, docs/site/src/data/examples.json,
 *         docs/descriptions/**.md
 * Output: docs/site/src/content/docs/reference/**.mdx
 *
 * The pages are build output. They are not in the repository, because a
 * generated file in git makes every release a large and unreadable change.
 */
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES, CATEGORY_BY_ID, defaultTemplateIsJavaScript } from "./lib/model.mjs";
import { operatorFileName } from "./lib/opid.mjs";
import { CONTENT, DATA, DESCRIPTIONS, readJson } from "./lib/paths.mjs";
import { blobUrl } from "./lib/source-url.mjs";

const REPOSITORY = "https://github.com/terotests/Ranger";

function escapeYaml(text) {
  return String(text).replace(/"/g, '\\"');
}

function frontMatter({ title, description, sidebarOrder, tableOfContents }) {
  const lines = ["---", `title: "${escapeYaml(title)}"`];
  if (description) {
    lines.push(`description: "${escapeYaml(description)}"`);
  }
  if (sidebarOrder !== undefined) {
    lines.push("sidebar:", `  order: ${sidebarOrder}`);
  }
  if (tableOfContents === false) {
    // The operator headings come from a component, so Starlight cannot collect
    // them. The summary table at the head of the page is the index instead.
    lines.push("tableOfContents: false");
  }
  lines.push("---", "");
  return lines.join("\n");
}

/**
 * The description of one operator, as HTML.
 *
 * A description is a short Markdown file with paragraphs, inline code, links
 * and bold text. The component prints it with `set:html`, so the text is
 * converted here. The conversion escapes the text first, which keeps HTML out
 * of the description files.
 */
function markdownToHtml(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .trim()
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, " "),
    )
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}

function readDescription(id) {
  const file = path.join(DESCRIPTIONS, `${operatorFileName(id)}.md`);
  if (!fs.existsSync(file)) {
    return "";
  }
  return markdownToHtml(fs.readFileSync(file, "utf8").trim());
}

function writePage(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

/** The examples that document the operator, in file order. */
function examplesFor(examples, id) {
  return examples.filter((example) => example.ids.includes(id));
}

function operatorSection(operator, examples, description) {
  const call =
    operator.args.length > 0
      ? `(${operator.name} ${operator.args.map((a) => a.name).join(" ")})`
      : `(${operator.name})`;
  const parts = [];
  parts.push(`<OperatorEntry`);
  parts.push(`  operator={model.operators.find((o) => o.id === ${JSON.stringify(operator.id)})}`);
  parts.push(`  examples={exampleData.examples.filter((e) => e.ids.includes(${JSON.stringify(operator.id)}))}`);
  parts.push(`  targets={model.generated.targets}`);
  parts.push(`  description={${JSON.stringify(description)}}`);
  parts.push(`  repository={${JSON.stringify(REPOSITORY)}}`);
  parts.push(`/>`);
  parts.push("");
  return { text: parts.join("\n"), call, exampleCount: examples.length };
}

function summaryTable(operators) {
  const rows = operators.map((operator) => {
    const args = operator.args
      .map((a) => `${a.name}: ${a.optional ? "&lt;optional&gt;" : ""}${a.type.replace(/\|/g, "\\|")}`)
      .join(", ");
    const name = operator.name.replace(/\|/g, "&#124;");
    const returns = `${operator.returnsOptional ? "&lt;optional&gt;" : ""}${operator.returns}`;
    return `| [\`${name}\`](#${operator.anchor}) | ${args || "—"} | \`${returns}\` |`;
  });
  return ["| Operator | Arguments | Gives |", "| --- | --- | --- |", ...rows, ""].join("\n");
}

function page({ title, description, order, operators, examples, intro }) {
  const body = [];
  body.push(frontMatter({ title, description, sidebarOrder: order, tableOfContents: false }));
  body.push('import OperatorEntry from "../../../../components/OperatorEntry.astro";');
  body.push('import TargetSupportLegend from "../../../../components/TargetSupportLegend.astro";');
  body.push('import model from "../../../../data/operators.json";');
  body.push('import exampleData from "../../../../data/examples.json";');
  body.push("");
  if (intro) {
    body.push(intro, "");
  }
  body.push(summaryTable(operators));
  // The legend explains the marks once, above the operators of the page.
  body.push("<TargetSupportLegend />", "");
  for (const operator of operators) {
    const withExamples = examplesFor(examples, operator.id);
    body.push(operatorSection(operator, withExamples, readDescription(operator.id)).text);
  }
  return body.join("\n");
}

function main() {
  const model = readJson(path.join(DATA, "operators.json"));
  const exampleData = readJson(path.join(DATA, "examples.json"));
  const examples = exampleData.examples;
  const targets = model.generated.targets;

  const referenceDir = path.join(CONTENT, "reference");
  fs.rmSync(path.join(referenceDir, "operators"), { recursive: true, force: true });
  fs.rmSync(path.join(referenceDir, "methods"), { recursive: true, force: true });
  fs.rmSync(path.join(referenceDir, "libraries"), { recursive: true, force: true });

  const core = model.operators.filter((o) => o.source === "core" || o.source === "stdops");
  let written = 0;

  // One page per category, for the operators that every program can use.
  CATEGORIES.forEach((category, index) => {
    const operators = core
      .filter((o) => o.category === category.id)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    if (operators.length === 0) {
      return;
    }
    const file = path.join(referenceDir, "operators", `${category.id}.mdx`);
    writePage(
      file,
      page({
        title: category.title,
        description: `${category.summary} ${operators.length} operators.`,
        order: index + 1,
        operators,
        examples,
        intro: `${category.summary}\n\nEvery program can use these operators. No import is necessary.`,
      }),
    );
    written += 1;
  });

  // One page per library that the documentation covers. A legacy source has
  // no page: no maintained program imports it. Type methods of the same file
  // go on this page, not on a second page with the same library name.
  const libraries = model.sources.filter(
    (s) => s.id !== "core" && s.id !== "stdops" && s.status !== "legacy",
  );
  libraries.forEach((library, index) => {
    const operators = model.operators
      .filter((o) => o.source === library.id)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const methods = (model.methods || [])
      .filter((m) => m.source === library.id)
      .sort(
        (a, b) =>
          a.receiver.localeCompare(b.receiver) ||
          a.name.localeCompare(b.name) ||
          a.id.localeCompare(b.id),
      );
    if (operators.length === 0 && methods.length === 0) {
      return;
    }
    writePage(
      path.join(referenceDir, "libraries", `${library.id}.mdx`),
      libraryPage({ library, operators, methods, examples, order: index + 1 }),
    );
    written += 1;
  });

  // The macros of lib/stdops.rgr.
  //
  // A `defn` macro has no type annotation, so several macros hold the same name
  // and the same number of parameters. The heading therefore carries the
  // parameter names and the source line, and the entry states which collection
  // operators the body calls, which is what separates one from the other.
  // Two counts: the name alone, and the name with the kind of collection that
  // the body reads. The heading carries the kind when the name repeats, and the
  // source line only when the kind does not separate them either.
  const macroSignature = (macro) => `${macro.name} (${macro.params.join(" ")})`;
  const macroNames = new Map();
  const macroKinds = new Map();
  for (const macro of model.macros) {
    const signature = macroSignature(macro);
    macroNames.set(signature, (macroNames.get(signature) || 0) + 1);
    const key = `${signature}|${macro.readsKind}`;
    macroKinds.set(key, (macroKinds.get(key) || 0) + 1);
  }
  const macroBody = [
    frontMatter({
      title: "Macros",
      description: "The defn macros that the standard operator file declares.",
      sidebarOrder: 1,
    }),
    "A macro is not an operator. The compiler replaces the call with the body of",
    "the macro before it writes the target code. The macros below are in",
    `[lib/stdops.rgr](${blobUrl(REPOSITORY, "lib/stdops.rgr")}).`,
    "",
    "## How the compiler selects a macro",
    "",
    "A `defn` declaration gives no type to its parameters. The name and the",
    "number of parameters is all that the declaration states, so several macros",
    "can hold the same name and the same number of parameters. This file holds",
    "four such names.",
    "",
    "The compiler selects one of them at the call site, and it selects by trial.",
    "These are the steps, from `TransformOpFn` in",
    `[compiler/RangerFlowParser.rgr](${blobUrl(REPOSITORY, "compiler/RangerFlowParser.rgr")}):`,
    "",
    "1. The compiler collects every macro with that name.",
    "2. A macro with a `?` in a type becomes one candidate per type: `string`,",
    "   `int`, `double`, `boolean` and each class of the program. A class whose",
    "   name is in the text of the call comes first.",
    "3. The compiler removes the candidates that take a different number of",
    "   arguments. This is the only test before the trial.",
    "4. The compiler expands the body of the first candidate into the call site",
    "   and compiles it. The compilation is a test: the compiler counts the new",
    "   errors.",
    "5. A candidate that makes no new error is the result, and the expansion",
    "   stays. The compiler does not try the candidates after it.",
    "6. A candidate that makes an error is removed together with its errors, and",
    "   the compiler tries the next candidate. It keeps the errors of the",
    "   candidate with the fewest of them.",
    "7. When no candidate fits, the compiler reports the errors of that",
    "   candidate, and then `Could not find suitable match for the operator",
    "   node`.",
    "",
    "A macro that expands into itself stops at depth 20 with",
    "`Error: max recursiion depth of > 20 for inline operators detected`.",
    "",
    "### What this means for a program",
    "",
    "**A macro states its requirements only in its body.** Nothing in",
    "`defn ForEach (list f)` says that `list` is an array or a hash map. The body",
    "of one of them calls `keys` and `get`, which a hash map accepts and an array",
    "does not, and the body of the other calls `size` and `at`. The compiler finds",
    "this out when it compiles the expansion, not before.",
    "",
    "**The order of the declarations decides.** Two macros can both fit one call.",
    "The first one that fits is the result.",
    "",
    "**An error message can name a macro that you did not intend.** The reported",
    "errors come from the candidate with the fewest errors, and that candidate is",
    "not always the one that you had in mind. Read the errors together with the",
    "bodies below, and start from the argument types of your call.",
    "",
    "Each entry below states which collection operators its body calls, and each",
    "heading carries the source line, so two entries with one name stay apart.",
    "",
    "## The macros",
    "",
  ];
  for (const macro of model.macros) {
    const signature = macroSignature(macro);
    const repeated = (macroNames.get(signature) || 0) > 1;
    const kindRepeated = (macroKinds.get(`${signature}|${macro.readsKind}`) || 0) > 1;
    const suffix = [];
    if (repeated && macro.readsKind) {
      suffix.push(`reads ${macro.readsKind}`);
    }
    if (repeated && (kindRepeated || !macro.readsKind)) {
      suffix.push(`line ${macro.line}`);
    }
    macroBody.push(
      `### \`${signature}\`` +
        (suffix.length > 0 ? ` — ${suffix.join(", ")}` : ""),
    );
    macroBody.push("");
    if (macro.comment) {
      macroBody.push(macro.comment, "");
    }
    if (macro.reads && macro.reads.length > 0) {
      macroBody.push(
        `The body reads the argument with ${macro.reads.map((r) => `\`${r}\``).join(", ")}.`,
        "",
      );
    }
    macroBody.push("```lisp");
    macroBody.push(macro.definition);
    macroBody.push("```", "");
    macroBody.push(
      `Definition: [${macro.file}, line ${macro.line}]` +
        `(${blobUrl(REPOSITORY, macro.file, macro.line)}).`,
      "",
    );
  }
  writePage(path.join(referenceDir, "macros.mdx"), macroBody.join("\n"));
  written += 1;

  // The coverage page.
  writePage(path.join(referenceDir, "coverage.mdx"), coveragePage(model, examples, targets));
  written += 1;

  fs.rmSync(path.join(referenceDir, "not-covered.mdx"), { force: true });

  process.stderr.write(`docs: ${written} reference pages written\n`);
}

const TYPE_METHOD_INTRO = [
  "A type method is an operator of the receiver type. The call is",
  "`receiver.name(…)`. The body is Ranger code, so the compiler writes it for",
  "every target that compiles the library.",
].join("\n");

/**
 * One library page: template operators and type methods of the same source.
 *
 * A type method is an operator of the second mechanism: ordinary Ranger code in
 * an `operator type:<T>` block. The call is `receiver.name(…)`, and the
 * compiler compiles the body like any other Ranger source. The body therefore
 * works for every target that compiles the library. The page states the target
 * scope of the block instead of a template list.
 */
function libraryPage({ library, operators, methods, examples, order }) {
  const hasOperators = operators.length > 0;
  const hasMethods = methods.length > 0;
  const count = operators.length + methods.length;
  const intro = [
    library.summary,
    "",
    library.import
      ? `To use these operators, add the import to the program:\n\n\`\`\`lisp\nImport "${library.import}"\n\`\`\``
      : "The compiler loads this file with the core library.",
    "",
    `Source: [${library.file}](${blobUrl(REPOSITORY, library.file)}).`,
  ];
  if (hasOperators && hasMethods) {
    intro.push(
      "",
      "This file holds two operator mechanisms. The template operators write",
      "target code from a string per language. The type methods are Ranger",
      "code. The compiler compiles them for every target that loads the library.",
    );
  } else if (hasMethods) {
    intro.push("", TYPE_METHOD_INTRO);
  }

  const body = [];
  body.push(
    frontMatter({
      title: library.title,
      description: `${library.summary} ${count} operators.`,
      sidebarOrder: order,
      tableOfContents: hasMethods,
    }),
  );
  if (hasOperators) {
    body.push('import OperatorEntry from "../../../../components/OperatorEntry.astro";');
    body.push('import TargetSupportLegend from "../../../../components/TargetSupportLegend.astro";');
  }
  if (hasMethods) {
    body.push('import MethodEntry from "../../../../components/MethodEntry.astro";');
  }
  body.push('import model from "../../../../data/operators.json";');
  body.push('import exampleData from "../../../../data/examples.json";');
  body.push("");
  body.push(intro.join("\n"), "");

  if (hasOperators) {
    if (hasMethods) {
      body.push("## Template operators", "");
    }
    body.push(summaryTable(operators));
    body.push("<TargetSupportLegend />", "");
    for (const operator of operators) {
      const withExamples = examplesFor(examples, operator.id);
      body.push(operatorSection(operator, withExamples, readDescription(operator.id)).text);
    }
  }

  if (hasMethods) {
    if (hasOperators) {
      body.push("## Type methods", "", TYPE_METHOD_INTRO, "");
    }
    body.push(methodSections(methods));
  }

  return body.join("\n");
}

function methodSections(methods) {
  const byReceiver = new Map();
  for (const method of methods) {
    if (!byReceiver.has(method.receiver)) {
      byReceiver.set(method.receiver, []);
    }
    byReceiver.get(method.receiver).push(method);
  }

  const body = [];
  for (const [receiver, list] of byReceiver) {
    body.push(`## \`${receiver}\``, "");
    const rows = list.map((method) => {
      const args = method.args
        .map((a) => `${a.name}: ${(a.type || "?").replace(/\|/g, "\\|")}`)
        .join(", ");
      return `| [\`${method.name}\`](#${method.anchor}) | ${args || "—"} | \`${method.returns}\` | ${
        method.scope === "all" ? "every target" : method.scope
      } |`;
    });
    body.push("| Method | Arguments | Gives | Targets |", "| --- | --- | --- | --- |", ...rows, "");
    for (const method of list) {
      body.push(
        [
          "<MethodEntry",
          `  method={model.methods.find((m) => m.id === ${JSON.stringify(method.id)})}`,
          `  examples={exampleData.examples.filter((e) => e.ids.includes(${JSON.stringify(method.id)}))}`,
          "  targets={model.generated.targets}",
          `  description={${JSON.stringify(readDescription(method.id))}}`,
          `  repository={${JSON.stringify(REPOSITORY)}}`,
          "/>",
          "",
        ].join("\n"),
      );
    }
  }
  return body.join("\n");
}

function coveragePage(model, examples, targets) {
  const documented = new Set(examples.flatMap((e) => e.ids));
  const rows = model.sources
    .filter((source) => source.status !== "legacy")
    .map((source) => {
      const operators = model.operators.filter((o) => o.source === source.id);
      const methods = (model.methods || []).filter((m) => m.source === source.id);
      const withExample = [...operators, ...methods].filter((o) => documented.has(o.id)).length;
      return (
        `| ${source.title} | \`${source.file}\` | ${operators.length} | ${methods.length} | ${withExample} |`
      );
    });
  const legacyCount = model.sources.filter((s) => s.status === "legacy").length;

  const documentedSources = new Set(
    model.sources.filter((s) => s.status !== "legacy").map((s) => s.id),
  );
  const documentedOperators = model.operators.filter((o) => documentedSources.has(o.source));
  const perTarget = targets.map((target) => {
    const counts = { template: 0, fallback: 0, none: 0 };
    for (const operator of documentedOperators) {
      counts[operator.support[target.id] || "none"] += 1;
    }
    return `| ${target.title} | ${counts.template} | ${counts.fallback} | ${counts.none} |`;
  });

  // A target that falls back to a JavaScript default template receives
  // JavaScript in its output file, and the compilation still reports success.
  const jsFallback = targets
    .map((target) => {
      const names = documentedOperators
        .filter((o) => o.support[target.id] === "fallback" && defaultTemplateIsJavaScript(o))
        .map((o) => o.name);
      return { target, names: [...new Set(names)].sort() };
    })
    .filter((row) => row.names.length > 0 && row.target.id !== "es6" && row.target.id !== "ts");

  return [
    frontMatter({
      title: "Coverage",
      description: "How much of the operator set the reference documents, and which targets each operator writes code for.",
      sidebarOrder: 2,
    }),
    "This page is generated with the reference. It states what the documentation",
    "does not cover, so a reader does not have to find the gap by a compilation.",
    "",
    "## Operators per source",
    "",
    "Ranger has two operator mechanisms. A **template operator** holds one",
    "emission string per target language. A **type method** is Ranger code in an",
    "`operator type:<T>` block, and the compiler compiles it for the target like",
    "any other source, so it works wherever the library compiles.",
    "",
    "| Source | File | Template operators | Type methods | With an example |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
    `${legacyCount} more operator sources stay in \`lib/\` and have no page.`,
    "No maintained program imports them. The generator skips them so a page",
    "does not present them as part of the maintained language.",
    "",
    "## Templates per target",
    "",
    "A template is an implementation of the operator for that target language. An",
    "operator with the default template (`*`) writes the same code for every",
    "target that has no template of its own.",
    "",
    "| Target | Own template | Default template | No template |",
    "| --- | --- | --- | --- |",
    ...perTarget,
    "",
    "## A default template that holds JavaScript",
    "",
    "The `*` template is also the JavaScript template of many operators. A",
    "target that has no template of its own then receives JavaScript in its",
    "output file, and the compilation reports success.",
    "",
    "This is a scan of the template text for a construct that only JavaScript",
    "accepts, such as `Math.` or `parseFloat(`. It finds the common ones and not",
    "each one, so a count here is a lower limit.",
    "",
    ...(jsFallback.length > 0
      ? [
          "| Target | Operators | Names |",
          "| --- | --- | --- |",
          ...jsFallback.map(
            (row) =>
              `| ${row.target.title} | ${row.names.length} | ${row.names
                .map((n) => `\`${n}\``)
                .join(", ")} |`,
          ),
        ]
      : ["No operator of the table above is in this state. Each target that has no", "template of its own for an operator takes a default template that the", "target language accepts."]),
    "",
    model.problems.length > 0 ? "## Problems\n" : "",
    ...model.problems.map((p) => `- \`${p.kind}\`: ${p.file || p.source} ${p.detail || ""}`),
    "",
  ].join("\n");
}

main();
