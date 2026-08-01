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
import { CATEGORIES, CATEGORY_BY_ID } from "./lib/model.mjs";
import { operatorFileName } from "./lib/opid.mjs";
import { CONTENT, DATA, DESCRIPTIONS, ROOT, readJson } from "./lib/paths.mjs";

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
  body.push('import model from "../../../../data/operators.json";');
  body.push('import exampleData from "../../../../data/examples.json";');
  body.push("");
  if (intro) {
    body.push(intro, "");
  }
  body.push(summaryTable(operators));
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

  // One page per library.
  const libraries = model.sources.filter((s) => s.id !== "core" && s.id !== "stdops");
  libraries.forEach((library, index) => {
    const operators = model.operators
      .filter((o) => o.source === library.id)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    if (operators.length === 0) {
      return;
    }
    const file = path.join(referenceDir, "libraries", `${library.id}.mdx`);
    const intro = [
      library.summary,
      "",
      library.import
        ? `To use these operators, add the import to the program:\n\n\`\`\`lisp\nImport "${library.import}"\n\`\`\``
        : "The compiler loads this file with the core library.",
      "",
      `Source: [${library.file}](${REPOSITORY}/blob/master/${library.file}).`,
    ].join("\n");
    writePage(
      file,
      page({
        title: library.title,
        description: `${library.summary} ${operators.length} operators.`,
        order: index + 1,
        operators,
        examples,
        intro,
      }),
    );
    written += 1;
  });

  // The type methods: the second operator mechanism of the language.
  fs.rmSync(path.join(referenceDir, "methods"), { recursive: true, force: true });
  const methodSources = model.sources.filter((source) =>
    model.methods.some((m) => m.source === source.id),
  );
  methodSources.forEach((source, index) => {
    const methods = model.methods
      .filter((m) => m.source === source.id)
      .sort(
        (a, b) =>
          a.receiver.localeCompare(b.receiver) ||
          a.name.localeCompare(b.name) ||
          a.id.localeCompare(b.id),
      );
    writePage(
      path.join(referenceDir, "methods", `${source.id}.mdx`),
      methodPage(source, methods, examples),
    );
    written += 1;
  });

  // The macros of lib/stdops.rgr.
  const macroBody = [
    frontMatter({
      title: "Macros",
      description: "The defn macros that the standard operator file declares.",
      sidebarOrder: 1,
    }),
    "A macro is not an operator. The compiler replaces the call with the body of",
    "the macro before it writes the target code. The macros below are in",
    `[lib/stdops.rgr](${REPOSITORY}/blob/master/lib/stdops.rgr).`,
    "",
  ];
  for (const macro of model.macros) {
    macroBody.push(`## \`${macro.name}\` (${macro.params.length} parameters)`);
    macroBody.push("");
    if (macro.comment) {
      macroBody.push(macro.comment, "");
    }
    macroBody.push("```lisp");
    macroBody.push(macro.definition);
    macroBody.push("```", "");
  }
  writePage(path.join(referenceDir, "macros.mdx"), macroBody.join("\n"));
  written += 1;

  // The coverage page.
  writePage(path.join(referenceDir, "coverage.mdx"), coveragePage(model, examples, targets));
  written += 1;

  process.stderr.write(`docs: ${written} reference pages written\n`);
}

/**
 * A page of type methods.
 *
 * A type method is an operator of the second mechanism: ordinary Ranger code in
 * an `operator type:<T>` block. The call is `receiver.name(…)`, and the
 * compiler compiles the body like any other Ranger source. The body therefore
 * works for every target that compiles the library, and the page states the
 * target scope of the block instead of a template list.
 */
function methodPage(source, methods, examples) {
  const byReceiver = new Map();
  for (const method of methods) {
    if (!byReceiver.has(method.receiver)) {
      byReceiver.set(method.receiver, []);
    }
    byReceiver.get(method.receiver).push(method);
  }

  const body = [];
  body.push(
    frontMatter({
      title: `${source.title} methods`,
      description: `The type methods that ${source.file} declares. ${methods.length} methods.`,
      tableOfContents: false,
    }),
  );
  body.push('import MethodEntry from "../../../../components/MethodEntry.astro";');
  body.push('import model from "../../../../data/operators.json";');
  body.push('import exampleData from "../../../../data/examples.json";');
  body.push("");
  body.push(
    "A type method is an operator of the receiver type. The call is",
    "`receiver.name(…)`. The body is Ranger code, so the compiler writes it for",
    "every target that compiles the library.",
    "",
  );
  if (source.import) {
    body.push("```lisp", `Import "${source.import}"`, "```", "");
  }
  body.push(`Source: [${source.file}](${REPOSITORY}/blob/master/${source.file}).`, "");

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
  const rows = model.sources.map((source) => {
    const operators = model.operators.filter((o) => o.source === source.id);
    const methods = (model.methods || []).filter((m) => m.source === source.id);
    const withExample = [...operators, ...methods].filter((o) => documented.has(o.id)).length;
    return (
      `| ${source.title} | \`${source.file}\` | ${operators.length} | ${methods.length} | ${withExample} |`
    );
  });

  const perTarget = targets.map((target) => {
    const counts = { template: 0, fallback: 0, none: 0 };
    for (const operator of model.operators) {
      counts[operator.support[target.id] || "none"] += 1;
    }
    return `| ${target.title} | ${counts.template} | ${counts.fallback} | ${counts.none} |`;
  });

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
    model.problems.length > 0 ? "## Problems\n" : "",
    ...model.problems.map((p) => `- \`${p.kind}\`: ${p.file || p.source} ${p.detail || ""}`),
    "",
  ].join("\n");
}

main();
