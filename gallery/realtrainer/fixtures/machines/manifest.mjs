// SPDX-License-Identifier: AGPL-3.0-or-later
//
// RealTrainer's ported machines, for `gallery/statechart/tests/xstate-parity.mjs`.
//
//   npm run rt:machine:live
//
// The harness is the module's; what is RealTrainer's is here: which machines,
// one path to each state they can rest in, the payload each event carries, and
// the two things that come from the HOST rather than from a machine —
//
//   a clock          `planDialogMachine` computes a default week with
//                    `new Date()` in its own reducer. A clock belongs outside
//                    a state machine, so the host holds it and hands the same
//                    one to both sides.
//   named actions    CONFIRM_WEEK_SELECTION reduces fetched entries to a day
//                    map by asking each date what weekday it is; chat appends
//                    a chunk and marks actions accepted. That is computation,
//                    not data, so the machine NAMES it and the host provides
//                    it — which is XState's own `setup({ actions })`.

export const dir = ".";

const TODAY = "2026-02-09";

export const context = {
  defaultWeekStart: TODAY,
  targetWeekStart: TODAY,
};

export const actions = {
  /**
   * `selectFetchedDaysForReplacement`: every fetched entry's weekday, selected.
   * Both sides run THIS function, so what is compared is the machine and not
   * two readings of a date.
   */
  selectFetchedDaysForReplacement: (context) => {
    const out = {};
    for (const entry of context.fetchedEntriesInWeek ?? []) {
      out[new Date(entry.date).getDay()] = true;
    }
    return { replaceSelectedByDay: out };
  },

  // `crypto.randomUUID()` in the original. A test cannot compare randomness,
  // so the host hands over a fixed one — and a request id is the host's to
  // mint in any case.
  newRequestId: () => ({ requestId: "req-1" }),
  appendChunk: (context, event) => ({
    streamingContent: (context.streamingContent ?? "") + (event.chunk ?? ""),
  }),
  takeResponse: (_context, event) => ({
    result: event.response ?? null,
    pendingActions: (event.response?.actions ?? []).map((a) => ({ ...a, processed: false })),
  }),
  acceptAll: (context) => ({
    pendingActions: (context.pendingActions ?? []).map((a) => ({
      ...a,
      processed: true,
      processedAs: "accepted",
    })),
  }),
  acceptAt: (context, event) => ({
    pendingActions: (context.pendingActions ?? []).map((a, i) =>
      i === event.index ? { ...a, processed: true, processedAs: "accepted" } : a,
    ),
  }),
  rejectAt: (context, event) => ({
    pendingActions: (context.pendingActions ?? []).map((a, i) =>
      i === event.index ? { ...a, processed: true, processedAs: "rejected" } : a,
    ),
  }),
};

export const machines = [
  {
    file: "planDialog.machine.json",
    // One path to each state, so every cell starts somewhere real.
    seeds: {
      closed: [],
      weekSelection: [["OPEN_WEEK_SELECTION", { weekStart: "2026-03-02", weekType: "light" }]],
      confirmation: [
        ["OPEN_WEEK_SELECTION", { weekStart: "2026-03-02" }],
        ["CONFIRM_WEEK_SELECTION", { fetchedEntries: [{ id: "a", date: "2026-03-03" }] }],
      ],
      editInstructions: [["OPEN_EDIT_INSTRUCTIONS", {}]],
      regenerating: [["OPEN_EDIT_INSTRUCTIONS", {}], ["START_REGENERATING", {}]],
      creating: [
        ["OPEN_WEEK_SELECTION", { weekStart: "2026-03-02" }],
        ["CONFIRM_WEEK_SELECTION", { fetchedEntries: [{ id: "a", date: "2026-03-03" }] }],
        ["CONFIRM_REPLACEMENT", {}],
      ],
    },
    // The payload each event carries, from the machine's own event union.
    payloads: {
      OPEN_WEEK_SELECTION: { weekStart: "2026-04-06", weekType: "light", showInstructions: true, targetCalendarId: "cal-9" },
      SET_WEEK_START: { weekStart: "2026-05-04" },
      SET_WEEK_TYPE: { weekType: "light" },
      SET_CREATE_INSTRUCTIONS: { instructions: "kevyt viikko" },
      SET_EDIT_GENERAL_FEEDBACK: { feedback: "enemmän vetoja" },
      SET_EDIT_DAY_INSTRUCTIONS: { dayIndex: 2, instructions: "pitkä juoksu" },
      SET_KEEP_SAME_BY_DAY: { day: 3, keep: true },
      SET_SHOW_PREVIOUS_BY_DAY: { day: 4, show: true },
      SET_REPLACE_SELECTED_BY_DAY: { day: 5, selected: false },
      REORDER_DAYS: { newOrder: [6, 5, 4, 3, 2, 1, 0] },
      CONFIRM_WEEK_SELECTION: { fetchedEntries: [{ id: "b", date: "2026-03-05" }] },
      ERROR: { error: "boom" },
    },
  },
  {
    file: "chat.machine.json",
    // Nested, so a seed lands on a leaf path. `reviewing.deciding` and
    // `processing.done` are not seeded because they cannot be stood in: the
    // first is an `always` fork and the second a final child whose `onDone`
    // leaves immediately. The harness FAILS if any other leaf has no seed.
    seeds: {
      idle: [],
      "sending.streaming": [["SET_INPUT", { text: "montako vetoa" }], ["SEND", {}]],
      "reviewing.singleAction": [
        ["SET_INPUT", { text: "montako vetoa" }],
        ["SEND", {}],
        ["STREAM_COMPLETE", { response: { text: "yksi", actions: [{ kind: "addWorkout", id: "w1" }] } }],
      ],
      "reviewing.multiAction": [
        ["SET_INPUT", { text: "montako vetoa" }],
        ["SEND", {}],
        ["STREAM_COMPLETE", {
          response: {
            text: "kaksi",
            actions: [{ kind: "addWorkout", id: "w1" }, { kind: "addWorkout", id: "w2" }],
          },
        }],
      ],
      "processing.saving": [
        ["SET_INPUT", { text: "montako vetoa" }],
        ["SEND", {}],
        ["STREAM_COMPLETE", { response: { text: "yksi", actions: [{ kind: "addWorkout", id: "w1" }] } }],
        ["ACCEPT_ACTION", { index: 0 }],
      ],
      error: [
        ["SET_INPUT", { text: "montako vetoa" }],
        ["SEND", {}],
        ["STREAM_ERROR", { error: "verkko katkesi" }],
      ],
    },
    payloads: {
      // Whitespace only and empty, so the fuzz crosses `hasContent` on both
      // sides of its threshold. (That the guard TRIMS is a transcription
      // question, not a runner one — `rt:machine:config` is what asks it.)
      SET_INPUT: [{ text: "entä palautus" }, { text: "   " }, { text: "" }],
      SET_IMAGE: { image: "kuva.png" },
      STREAM_CHUNK: { chunk: "osa " },
      // Three shapes, because the number of actions is what `reviewing` forks
      // on: two land in `multiAction`, one in `singleAction`, none in `idle`.
      STREAM_COMPLETE: [
        { response: { text: "valmis", actions: [{ kind: "addWorkout", id: "x1" }, { kind: "addWorkout", id: "x2" }] } },
        { response: { text: "yksi", actions: [{ kind: "addWorkout", id: "x1" }] } },
        { response: { text: "ei mitään", actions: [] } },
      ],
      STREAM_ERROR: { error: "verkko katkesi" },
      ACCEPT_ACTION: { index: 1 },
      REJECT_ACTION: { index: 0 },
    },
  },
];
