// ============================================================================
// app.ts — the wiring, and the only place that knows both halves exist.
//
// Above this line: a Ranger model that cannot perform I/O.
// Below it: a host runtime that can, for exactly the capabilities it is handed.
//
// Swapping DuckDB for a fake, or a real clock for a stepped one, is a change to
// this file and to nothing else. The model does not have a build flag for tests.
// ============================================================================

import {
  EffectQueue,
  EffectResult,
  NotesPage,
  NotesPage__Registry,
  NotesViewModelBuilder,
  ProcessRuntime,
  type NotesViewModel,
  type RangerProcessBase,
} from "./generated/notes_model.js";

import {
  EffectRuntime,
  type EffectRuntimeOptions,
  type RgEffectQueue,
  type RgEffectResult,
  type RuntimeBridge,
} from "./runtime/effectRuntime.js";

import {
  CapabilityTable,
  type ClockCapability,
  type DatabaseCapability,
} from "./runtime/capabilities.js";

import { SystemClock } from "./adapters/systemClock.js";

export interface NotesAppOptions {
  db: DatabaseCapability;
  clock?: ClockCapability;
  /**
   * Capability names the host is willing to hand over. Defaults to what the
   * model asks for; pass a shorter list to watch it be refused.
   */
  grants?: string[];
  runtime?: EffectRuntimeOptions;
}

export interface NotesApp {
  readonly page: NotesPage;
  readonly runtime: EffectRuntime;
  /** Deliver one event to the model, then run whatever it asked for. */
  send(event: (page: NotesPage) => void): void;
  /** Pure projection of current state. */
  view(): NotesViewModel;
  render(): string;
  idle(): Promise<void>;
  /** Stop the process: its scope dies and in-flight work is abandoned. */
  stop(): void;
  dispose(): Promise<void>;
}

export function createNotesApp(options: NotesAppOptions): NotesApp {
  // The generated singletons — the queue, the id registry, the @name registry —
  // live for as long as the module does, so a second app in the same process
  // would inherit the first one's queued requests and collide on "app.notes".
  // A single-page demo app owns them outright: retire whatever is still live.
  NotesPage__Registry.__singleton().stopAllInstances();
  const queue = EffectQueue.__singleton();
  queue.reset();

  const bridge: RuntimeBridge = {
    queue: queue as unknown as RgEffectQueue,
    newResult: () => new EffectResult() as unknown as RgEffectResult,
    beginTurn: (root) => ProcessRuntime.beginDispatchTurn(root as RangerProcessBase),
    endTurn: (root) => ProcessRuntime.endDispatchTurn(root as RangerProcessBase),
  };

  const capabilities = new CapabilityTable();
  const clock = options.clock ?? new SystemClock();
  const granted = options.grants ?? ["db", "clock"];
  if (granted.includes("db")) capabilities.grant("db", options.db);
  if (granted.includes("clock")) capabilities.grant("clock", clock);

  const page = new NotesPage();
  if (page.__rangerId === 0) {
    // Ranger's own `new` registers the root; a plain TS `new` has to say so.
    page.__rangerRegisterRoot();
  }
  ProcessRuntime.startInstance(page);

  const runtime = new EffectRuntime(bridge, capabilities, options.runtime);
  // The manifest is the model's own declaration of what it needs. Attaching
  // fails loudly if the host cannot satisfy it.
  runtime.attach(page.__rangerPath, page, page.capabilities().names);

  let stopped = false;

  return {
    page,
    runtime,

    send(event) {
      if (stopped) return;
      runtime.dispatch(page.__rangerPath, () => event(page));
    },

    view() {
      return NotesViewModelBuilder.build(page);
    },

    render() {
      return NotesViewModelBuilder.renderText(NotesViewModelBuilder.build(page));
    },

    idle() {
      return runtime.idle();
    },

    stop() {
      if (stopped) return;
      stopped = true;
      runtime.detach(page.__rangerPath, "owner_stopped");
      ProcessRuntime.stopInstance(page);
    },

    async dispose() {
      this.stop();
      await runtime.shutdown();
    },
  };
}
