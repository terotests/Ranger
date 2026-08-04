/**
 * Cut the interesting part out of a generated file.
 *
 * An example puts the operator code in the main function. The generated file
 * also holds imports, a class and runtime helpers, which are noise on an
 * operator page. The extractor finds the main function of the target and gives
 * its body. When the rule finds nothing, the caller shows the full file: a
 * complete file is better than a wrong excerpt.
 */

/** The head of the main function per target. */
const MAIN_PATTERNS = {
  es6: [/^function\s+__js_main\s*\(/, /^function\s+main\s*\(/],
  ts: [/^function\s+__js_main\s*\(/, /^function\s+main\s*\(/],
  go: [/^func\s+main\s*\(/],
  rust: [/^fn\s+main\s*\(/],
  python: [/^def\s+main\s*\(/],
  java7: [/public\s+static\s+void\s+main\s*\(/],
  kotlin: [/^fun\s+main\s*\(/],
  dart: [/^void\s+main\s*\(/],
  swift6: [/static\s+func\s+main\s*\(/, /^func\s+__swift_main\s*\(/],
  swift3: [/static\s+func\s+main\s*\(/, /^func\s+__swift_main\s*\(/],
  csharp: [/static\s+void\s+Main\s*\(/, /public\s+static\s+void\s+main\s*\(/],
  cpp: [/^int\s+main\s*\(/],
  php: [/^function\s+main\s*\(/, /^\s*main\s*\(\s*\)\s*;/],
  scala: [/object\s+AppMain\s+extends\s+App/, /def\s+main\s*\(/],
};

/**
 * Targets that write the main routine at the top level instead of in a
 * function. The generated file marks the place with a comment, and the excerpt
 * is everything after that comment.
 */
const TAIL_MARKERS = {
  php: /static PHP main routine/,
};

const INDENT_LANGUAGES = new Set(["python"]);

/** Lines that the target writes into every main function and that say nothing. */
const PREAMBLE = {
  cpp: [/^__g_argc\s*=/, /^__g_argv\s*=/],
};

function dropPreamble(lines, targetId) {
  const patterns = PREAMBLE[targetId];
  if (!patterns) {
    return lines;
  }
  let start = 0;
  while (start < lines.length && patterns.some((p) => p.test(lines[start].trim()))) {
    start += 1;
  }
  return lines.slice(start);
}

function dedent(lines) {
  const filled = lines.filter((l) => l.trim().length > 0);
  if (filled.length === 0) {
    return lines;
  }
  const indent = filled.reduce((min, l) => Math.min(min, l.length - l.trimStart().length), Infinity);
  const strip = Number.isFinite(indent) ? indent : 0;
  return lines.map((l) => l.slice(strip));
}

function bodyByBraces(lines, headIndex) {
  let depth = 0;
  let started = false;
  const body = [];
  for (let i = headIndex; i < lines.length; i += 1) {
    const line = lines[i];
    let quote = "";
    let opened = 0;
    let closed = 0;
    for (let c = 0; c < line.length; c += 1) {
      const ch = line[c];
      if (quote) {
        if (ch === "\\") {
          c += 1;
        } else if (ch === quote) {
          quote = "";
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === "{") {
        opened += 1;
      } else if (ch === "}") {
        closed += 1;
      }
    }
    if (!started && opened > 0) {
      started = true;
      depth = opened - closed;
      const after = line.slice(line.indexOf("{") + 1).trim();
      if (after.length > 0 && depth > 0) {
        body.push(after);
      }
      if (depth <= 0) {
        return body;
      }
      continue;
    }
    if (started) {
      depth += opened - closed;
      if (depth <= 0) {
        const before = line.slice(0, line.lastIndexOf("}")).trim();
        if (before.length > 0) {
          body.push(before);
        }
        return body;
      }
      body.push(line);
    }
  }
  return started ? body : null;
}

function bodyByIndent(lines, headIndex) {
  const head = lines[headIndex];
  const headIndent = head.length - head.trimStart().length;
  const body = [];
  for (let i = headIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().length === 0) {
      body.push(line);
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent <= headIndent) {
      break;
    }
    body.push(line);
  }
  while (body.length > 0 && body[body.length - 1].trim().length === 0) {
    body.pop();
  }
  return body.length > 0 ? body : null;
}

/**
 * @param {string} output the generated file
 * @param {string} targetId
 * @returns {{excerpt: string, full: string, found: boolean}}
 */
export function extractRegion(output, targetId) {
  const full = String(output).replace(/\r/g, "").trimEnd();
  const lines = full.split("\n");
  const patterns = MAIN_PATTERNS[targetId] || [];

  const marker = TAIL_MARKERS[targetId];
  if (marker) {
    const index = lines.findIndex((line) => marker.test(line));
    if (index >= 0) {
      const text = dedent(lines.slice(index + 1)).join("\n").trim();
      if (text.length > 0) {
        return { excerpt: text, full, found: true };
      }
    }
  }

  for (const pattern of patterns) {
    const index = lines.findIndex((line) => pattern.test(line.trim()) || pattern.test(line));
    if (index < 0) {
      continue;
    }
    const body = INDENT_LANGUAGES.has(targetId)
      ? bodyByIndent(lines, index)
      : bodyByBraces(lines, index);
    if (body && body.length > 0) {
      const text = dedent(dropPreamble(dedent(body), targetId)).join("\n").trim();
      if (text.length > 0) {
        return { excerpt: text, full, found: true };
      }
    }
  }
  return { excerpt: full, full, found: false };
}
