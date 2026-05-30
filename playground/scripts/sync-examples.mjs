#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangerRoot = path.resolve(__dirname, "../..");
const fixtures = path.join(rangerRoot, "tests/fixtures");
const outDir = path.join(rangerRoot, "playground/public/examples");

/** @type {{ id: string, title: string, file: string, description: string, needsProcess?: boolean }[]} */
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
    id: "process-tick",
    title: "Process tick child",
    file: "process_tick_child.rgr",
    description: "@process child spawn; proc_send to typed handler methods.",
    needsProcess: true,
  },
  {
    id: "process-lifecycle",
    title: "Page lifecycle",
    file: "process_page_lifecycle.rgr",
    description: "Screen/page/timer process tree and STOP order.",
    needsProcess: true,
  },
  {
    id: "process-named",
    title: "Named process paths",
    file: "process_named_paths.rgr",
    description: "@name paths and find_process.",
    needsProcess: true,
  },
  {
    id: "process-send",
    title: "proc_send",
    file: "process_proc_send.rgr",
    description: "proc_send by path and reference; inbox logging on both pages.",
    needsProcess: true,
  },
  {
    id: "process-nesting",
    title: "Process nesting",
    file: "process_nesting.rgr",
    description: "parentIdOf and registry introspection.",
    needsProcess: true,
  },
];

const EXTRA = {
  "process_tick_child.rgr": `Import "RangerProcess.rgr"

class AppRoot @process(true) @name("app.root") @singleton(true) extends RangerProcessBase {
  fn startTimer:TimerProcess () {
    def timer:TimerProcess (new TimerProcess)
    proc_start timer
    return timer
  }
}

class TimerProcess @process(true) extends RangerProcessBase {
  fn spawnTick:TickChild () {
    def tickChild (new TickChild)
    proc_start tickChild
    return tickChild
  }
}

class TickChild @process(true) extends RangerProcessBase {
  def tick:int 0

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
    EXAMPLES.map(({ id, title, file, description, needsProcess }) => ({
      id,
      title,
      file,
      description,
      needsProcess: !!needsProcess,
    })),
    null,
    2,
  ),
);

console.log("Synced", EXAMPLES.length, "examples to", outDir);
