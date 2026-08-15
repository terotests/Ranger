#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../..");
const fixtures = path.join(rangerRoot, "tests/fixtures");
const outDir = path.join(rangerRoot, "playground/public/examples");

/**
 * `unsupported` lists targets the compiler cannot build this example for, with
 * the reason shown in the UI. The playground disables those targets instead of
 * dropping a wall of compiler errors into the output pane.
 *
 * @type {{ id: string, title: string, file: string, description: string,
 *          needsProcess?: boolean, unsupported?: Record<string, string> }[]}
 */
const NO_SCALA_PROCESS = {
  scala: "Scala output cannot compile RangerProcess.rgr (for-loop with continue)",
};

export const EXAMPLES = [
  {
    id: "hello",
    title: "Hello World",
    file: "hello.rgr",
    description: "Minimal main and print.",
  },
  {
    id: "infix",
    title: "Infix method call",
    file: "infix_method_call.rgr",
    description: "Dot-call followed by infix comparison.",
  },
  {
    id: "optional",
    title: "Optional values",
    file: "optional_values.rgr",
    description: "Optionals and unwrap patterns.",
  },
  {
    id: "shape-value",
    title: "Shape: closed variant family",
    file: "shape_value.rgr",
    description:
      "shape / case / group: one type, four variants, each carrying only its own fields. Every target picks its own representation — a tagged object on JS and Python, a native enum on Rust and Swift, an interface on Kotlin and C#, a variant on C++.",
  },
  {
    id: "shape-match",
    title: "Shape: exhaustive match",
    file: "shape_match.rgr",
    description:
      "match over a closed family with the compiler checking that every case is handled exactly once. Delete an arm and it names the case you dropped.",
  },
  {
    id: "shape-methods",
    title: "Shape: methods on a family",
    file: "shape_methods.rgr",
    description:
      "Methods declared on the shape itself lower to a generated ops class — `self` is the value the method acts on, and no target needs dispatch through the union.",
  },
  {
    id: "shape-group-methods",
    title: "Shape: group capabilities",
    file: "shape_group_methods.rgr",
    description:
      "A bodyless group method is a required capability each member case implements. Calls are statically qualified and dispatch exhaustively — no wrappers, no vtables.",
  },
  {
    id: "process-tick",
    title: "Process tick child",
    file: "process_tick_child.rgr",
    description: "@process child spawn; proc_send to typed handler methods.",
    needsProcess: true,
    unsupported: NO_SCALA_PROCESS,
  },
  {
    id: "process-lifecycle",
    title: "Page lifecycle",
    file: "process_page_lifecycle.rgr",
    description: "Screen/page/timer process tree and STOP order.",
    needsProcess: true,
    unsupported: NO_SCALA_PROCESS,
  },
  {
    id: "process-named",
    title: "Named process paths",
    file: "process_named_paths.rgr",
    description: "@name paths and find_process.",
    needsProcess: true,
    unsupported: NO_SCALA_PROCESS,
  },
  {
    id: "process-send",
    title: "proc_send",
    file: "process_proc_send.rgr",
    description: "proc_send by path and reference; inbox logging on both pages.",
    needsProcess: true,
    unsupported: NO_SCALA_PROCESS,
  },
  {
    id: "process-nesting",
    title: "Process nesting",
    file: "process_nesting.rgr",
    description: "parentIdOf and registry introspection.",
    needsProcess: true,
    unsupported: NO_SCALA_PROCESS,
  },
];

const EXTRA = {
  "process_tick_child.rgr": `Import "RangerProcess.rgr"

class AppRoot @process(true) @name("app.root") @singleton(true) extends RangerProcessBase {
  fn start:void () {
  }

  fn startTimer:TimerProcess () {
    def timer:TimerProcess (new TimerProcess)
    proc_start timer
    return timer
  }
}

class TimerProcess @process(true) extends RangerProcessBase {
  fn start:void () {
  }

  fn spawnTick:TickChild () {
    def tickChild (new TickChild)
    proc_start tickChild
    return tickChild
  }
}

class TickChild @process(true) extends RangerProcessBase {
  def tick:int 0

  fn start:void () {
  }

  fn onTick:void (n:int) {
    tick = tick + n
    print ("TickChild onTick n=" + (to_string n) + " tick=" + (to_string tick))
    this.markStateDirty()
  }

  fn onStop:void () {
    print ("STOP TickChild tick=" + (to_string tick))
  }
}

class TickDemo {
  sfn m@(main):void () {
    def root:AppRoot (new AppRoot)
    proc_start root
    def timer:TimerProcess (root.startTimer())
    def tickChild:TickChild (timer.spawnTick())
    proc_send tickChild onTick 1
    proc_stop tickChild
    proc_stop timer
    print "OK tick child demo"
  }
}
`,
};

fs.mkdirSync(outDir, { recursive: true });

for (const ex of EXAMPLES) {
  const src = path.join(fixtures, ex.file);
  const dest = path.join(outDir, ex.file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else if (EXTRA[ex.file]) {
    fs.writeFileSync(dest, EXTRA[ex.file]);
  } else {
    console.warn("Skip missing example:", ex.file);
  }
}

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify(
    EXAMPLES.map(({ id, title, file, description, needsProcess, unsupported }) => ({
      id,
      title,
      file,
      description,
      needsProcess: !!needsProcess,
      unsupported: unsupported ?? {},
    })),
    null,
    2,
  ),
);

console.log("Synced", EXAMPLES.length, "examples to", outDir);
