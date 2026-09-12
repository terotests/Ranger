#!/usr/bin/env bash
# Every visual editor's own suite, in one command.
#
# Why a script rather than `npm run a && npm run b && …`: the compiler prints
# `[FAIL]` and still exits 0. A chain of npm scripts therefore runs the STALE
# build from the previous compile and reports a pass — which is the one way a
# CI job can be worse than no CI job. Each suite here fails on `[FAIL]` in the
# output, on a missing pass marker, and on a non-zero exit.
#
#   npm run gallery:editors:test
#
# Sequentially these take about forty minutes, against thirty seconds for
# every other job in the workflow, so CI runs them as SHARDS:
#
#   npm run gallery:editors:test -- --shard=2/6
#
# Shard i of n takes every n'th suite starting at i — round-robin rather than
# a contiguous block, because the suites are nothing like equal in length and
# a block would put the slow ones next to each other. Without the flag the
# whole list runs, which is what it does on a developer's machine.
set -uo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"

SHARD=""
SHARDS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --shard=*) spec="${1#--shard=}" ;;
    --shard)   shift; spec="${1:-}" ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  case "$spec" in
    [0-9]*/[0-9]*) SHARD="${spec%%/*}"; SHARDS="${spec##*/}" ;;
    *) echo "--shard wants i/n, got: $spec" >&2; exit 2 ;;
  esac
  shift
done
if [ -n "$SHARD" ] && { [ "$SHARD" -lt 1 ] || [ "$SHARDS" -lt 1 ] || [ "$SHARD" -gt "$SHARDS" ]; }; then
  echo "--shard $SHARD/$SHARDS is out of range" >&2
  exit 2
fi

SUITES=(
  book:test
  book:editor:test
  book:slides:test
  pptx:test
  pptx:editor:test
  pptx:text:test
  pptx:scene:check
  # The editor's shell and the strip that sits on top of it. These five ran
  # only when somebody remembered to run them, which meant the 84 assertions
  # holding the chrome's layout to the arithmetic it replaced were never a
  # gate at all — and `pptx:chrome:test` was added by the same work it was
  # meant to protect. Wired in here rather than anywhere else precisely
  # because of the note at the top of this file: run by hand through npm, a
  # `[FAIL]` from the compiler exits 0 and the stale build passes. That is not
  # hypothetical either; it happened while the icons were being converted, and
  # a suite reported ALL PASS against a build that had not compiled.
  pptx:chrome:test
  # A shape and its own outline must touch. The rasteriser used to put a
  # rectangle on the grid by truncating its position and its size separately,
  # which loses up to two pixels off the right and the bottom and none off the
  # left — a hairline of desk between a box and its border.
  pptx:seam:test
  pptx:seam:scan
  pptx:frame:test
  pptx:css:test
  pptx:a11y:test
  pptx:editor:host:test
  docx_viewer:test
  docx_viewer:app:test
  # Markdown, which is about to stop being only a viewer. It appeared NOWHERE
  # in this file or in ci.yml, so a change in gallery/office or gallery/evg
  # could break it and nothing would say so — and it is about to start
  # importing from both. Wired in BEFORE the first such import rather than
  # after, which is the whole point of gallery/PLAN_EDITOR_KERNEL.md §5.
  #
  # `markdown:spec` is a ratchet rather than a suite: it scores the parser
  # against CommonMark's own 652 examples and fails when a SECTION drops below
  # what it passed last. Its pass marker says the floor held, not that every
  # example passes — 651/652 is the score and the file it writes states it.
  markdown:test
  markdown:spec
  markdown:srcmap:test
  markdown:attrs:test
  markdown:css:test
  markdown:slides:test
  markdown:pptx:test
  markdown:edit:test
  markdown:semantic:test
  # …and the same three properties over the specification's own 652 examples,
  # ratcheted. A fixture file holds the cases the person who wrote the
  # stamping thought of; the corpus holds one of everything that moves an
  # offset.
  markdown:srcmap:spec
  markdown:web:test
  datagrid:test
  datagrid:edit:test
  office:history:test
  # …and that the five editors actually reach those rules. Four instantiations
  # prove the type-checker is happy; they do not prove one action is one undo
  # in each, which is the item PLAN_EDITOR_KERNEL Stage C left open. It caught
  # `pasteLines` on its first run.
  office:history:editors:test
  office:text:test
  office:metrics:test
  # …and that the shared metrics are still only arithmetic. Adding a renderer
  # import back into gallery/office/text compiles and passes every suite
  # above; this is the only thing that would notice.
  office:metrics:closure
  # …and that a width is the width of the face that will be PAINTED, on every
  # target and whichever order the host loaded its fonts in. The renderer
  # replaces its measurer each time a face arrives, so a caller that captured
  # one measures with the estimate tables for the life of the document — and
  # says it has fonts while doing it. Only the .pptx WebAssembly parity check
  # saw that, and only because its two engines attach at different moments.
  office:measure:targets
  office:font:test
  office:style:test
  office:bidi:test
  office:geom:test
  office:shapes:test
  office:shapes:native
  office:color:test
  office:asset:test
  office:rtl:editors:test
  # The caret, on the same terms: one grapheme rule and one word rule, driven
  # through the real call site in four editors. The .docx one stepped by a
  # UTF-16 unit and landed inside surrogate pairs until this existed.
  office:caret:editors:test
  ui:test
  evg:trace:test
  # The toolbar's model, its metrics, and every outline in the icon catalogue.
  # The catalogue check is the one that earns its place: it walks all four
  # layers of all eighty icons and asserts each parses and stays on the
  # 24-grid, and it failed the first time it was run.
  evg:toolbar:test
  evg:overlay:test
  evg:fixed:test
  evg:style:test
  # `@vars` and `var()`: the palette a theme replaces instead of ninety rules.
  # Two of its checks are not about colour — that a name nobody defined is
  # REPORTED rather than painted, and that resolution happens once per plan and
  # not once per element, which is the whole reason the feature is free.
  evg:stylevar:test
  evg:timing:test
  evg:box:test
  # Does a command survive being written down? Every picture test reads the
  # command objects, so a field the serializer forgot was invisible: the
  # pictures came out right and the browser drew something else. Never wired
  # into CI until `letter-spacing` was added to the same two bridges.
  evg:json:test
  evg:viewport:test
  evg:reconcile:test
  evg:component:test
  evg:stylecache:test
  evg:invalidate:test
  evg:adopt:check
  # Pan, pinch and the wheel, against a canvas that is not one: the two-finger
  # pinch is the gesture no headless driver will send, and the anchor — the
  # point under the fingers staying put — is the whole of what it feels like.
  evg:gestures:check
  # A thick polyline used to come apart at every corner — two quads meeting
  # at an angle cover the inside of the turn twice and the outside not at
  # all. The corners and the ends are measured here by area, because that is
  # the kind of wrong that is invisible to a test that counts commands.
  evg:stroke:check
  # The camera against the coordinates it replaces: the same picture drawn
  # once with the view multiplied into the list and once with it on the
  # shader, read back as pixels. A radius that did not scale, a border that
  # stayed one pixel, a scissor left where the camera moved away from — each
  # is a plausible drawing that is wrong and none changes a command count.
  evg:view:check
  # And the arithmetic in front of it: keep the frame in hand or walk the
  # board again. No browser and no GPU — a policy that keeps a frame it
  # should have rebuilt shows stale pixels, which is the failure nobody
  # notices in a profile.
  evg:view:policy
  # A scroll moves the painter's kept frame with a uniform rather than
  # rebuilding it, so a draw that forgets the uniform paints where the frame
  # was BUILT. Needs a GPU to see and there is no oracle for it; this reads
  # the painter as text.
  evg:shift:check
  evg:scroll:check
  evg:tags:check
  evg:textbox:check
  evg:radius:check
  # How far a flex item may be shrunk: `min-width: auto` on a flex item is its
  # min-content size, not zero — and `overflow` puts it back to zero.
  evg:flexmin:check
  # The colour maths, against what the browser makes of hex and hsl().
  evg:color:check
  # How wide text is, which is where a caret gets drawn.
  evg:advance:check
  # The keyboard as an EVG feature rather than an app's: Tab in tree order,
  # the arrows by the boxes, what cannot be focused, a dialog the walk cannot
  # leave, and the rule that the pointer moves the focus without drawing a
  # ring round it. Every drawn UI needs this and none of them has tab stops
  # of its own.
  evg:focus:test
  # The accessibility tree the mirror is built from — roles, names, states,
  # the lint that refuses a focusable with no name — and, beside it, the
  # fourteen ways the mirror's own DOM must not paint or make a phone zoom.
  evg:a11y:test
  evg:a11y:paint
  ui:sortable:motion
  ui:table:check
  ui:virtual:check
  ui:tree:dnd:check
  ui:tree:checkbox
  ui:timeline:check
  ui:resize:check
  # The calendar, against react-day-picker: the arithmetic and the keyboard
  # offline, then the same behaviours against the library's own recorded
  # answers. Home and End are week-relative and the Page keys clamp the day
  # number — both would have been written the obvious wrong way round.
  ui:calendar:test
  ui:calendar:check
  # And the drawn half: seven columns that line up, a chosen day whose number
  # is legible against its fill, and cells the pointer can actually reach.
  ui:calendar:demo
  # The pointer half of the text field, which had no gate at all — which is
  # why it was the half that got written and never wired. The word rules are
  # measured against a real <input>: Ctrl+Arrow stops at punctuation and a
  # double-click takes the run of one character class.
  ui:pointer:check
  ui:form:check
  ui:profile:check
  ui:dashboard:check
  # What a reader is TOLD about a form field, on the element path — the one
  # every demo uses. required, invalid and readonly in the DOM's own three
  # states, and a password toggle that reports pressed rather than spelling
  # its state into its name.
  # Switch against Base UI — a SECOND headless reference beside Radix, which
  # is what shadcn's base/ registry ships. Ten behaviours agree; three things
  # are recorded as having no equivalent rather than scored.
  ui:switch:check
  # The chat transcript. Specified from a screenshot rather than measured —
  # no library has a message or a bubble — but three of its assertions come
  # from real bugs: a transcript missing from the accessible tree entirely, a
  # bubble sized to a floating-point tie, and an emoji measured as two halves.
  ui:message:check
  # The scroller's policy: pinned to the bottom while streaming, but only
  # while the reader is already there. The POLICY is shadcn's; the ground it
  # stands on was measured — a browser's scrollTop is integer-clamped, and a
  # container that gains content does NOT keep its bottom.
  ui:scroller:check
  # The questionnaire's FLOW. Base UI has no questionnaire primitive — it is a
  # composite over field, radio-group, checkbox-group, input and progress — so
  # the parts have oracles and the flow does not. Specified from the component
  # source, and three of its rules are mutation-proved.
  ui:quest:check
  # The filter bar. Its PREDICATES are TanStack's and were measured — including
  # the two things that route through code a reimplementation never sees: an
  # empty chip is dropped rather than matched, and that dropping happens in
  # `setColumnFilters` and nowhere else, so a component holding its own rule
  # tree has to do it itself. The tree, the operators and the chips are
  # specified: `columnFilters` is a flat AND and cannot hold a combinator at
  # all.
  ui:filters:check
  # And the filter bar DRAWN, which is a separate gate for a separate failure:
  # a controller nobody can click is indistinguishable from a broken one. Every
  # interaction goes through hitId at a real coordinate, and the assertion that
  # matters is that the list of matching rows CHANGES.
  ui:filters:demo
  # The event calendar's LAYOUT. reui.io is blocked by the proxy exactly as
  # ui.shadcn.com is, so ReUI's surface was never read and none of this claims
  # it — what is measured is where a real calendar puts overlapping events,
  # and the answer is not the obvious one: three overlapping events are 100%,
  # 66.67% and 33.33% wide, overlaid, not a third each.
  ui:eventcal:check
  # The event calendar drawn. The overlap rule is invisible until it is: three
  # boxes that all end at the same right edge, each narrower than the last, is
  # the thing an even split would not produce.
  ui:eventcal:demo
  # And the three newest controls, drawn together on one panel. The assertion
  # that matters is the CHAIN: filling the number field completes the step,
  # which moves the progress bar by exactly a quarter of its track. No
  # single-component gate can see that.
  ui:controls:demo
  # The segmented date field, against Chromium's own <input type="date">: the
  # two-digit buffer's three exits, wrapping arrows, the empty year stepping to
  # this year, and Backspace emptying a segment without moving.
  ui:datefield:check
  # The one-time code, against input-otp (shadcn's Input OTP): the selection is
  # never a bare caret inside the value, so typing in the middle replaces, and
  # a letter into a digits field is refused whole.
  ui:otp:check
  # And the code drawn: slots, the dash, the caret in the first empty slot, and
  # Verify lighting when the sixth digit lands.
  ui:otp:demo
  # The progress bar, against BOTH shadcn references at once. They disagree in
  # fourteen places and the big one is not small: Radix refuses to report an
  # out-of-range value and goes indeterminate, Base UI clamps. This follows
  # Base UI and says so. Measuring also found the existing controller neither
  # clamping nor rounding — 3 of 8 read 37%, and both references say 38%.
  ui:progress:check
  # The number field, against Base UI — the only reference there is, since
  # Radix has none. It is NOT a spinbutton, the large step is on Shift and not
  # PageUp, and its default is 10 absolute rather than ten steps.
  ui:number:check
  # The stepper, which has NO reference anywhere: no registry ships one and
  # ARIA has no stepper role. So the flow is specified — what was measured is
  # the DECISION, a Radix tablist beside an ordered list with
  # aria-current="step". The tablist activates as it moves and wraps from the
  # last step to the first, which is not something that can happen to a person
  # filling in a form.
  ui:stepper:check
  # The slider's ReUI presentation layer — ticks with a skip interval, a value
  # bubble, reference labels, and a rating whose value is a WORD. That last one
  # is an accessibility fix and not decoration: a thumb at 3 announces "3",
  # and the screen says "Okay".
  ui:slider:check
  ui:semantics:check
  # What a string index MEANS, compiled to both backends and diffed. JS counts
  # UTF-16 code units and C++ counts UTF-8 bytes — an old comment in InputCtl
  # said so and had never been checked. It is true, and now it is pinned.
  ui:offset:check
  # THE PAGE ITSELF, in a real browser. This was missing, and its absence is
  # exactly why three wiring defects survived: click-to-caret worked in the
  # controller and in the demo's API while `main.js` dropped the coordinate,
  # and no gate ran the path a person actually uses. It also carries the
  # platform text session — paste, undo, IME and a Backspace over a ZWJ
  # family — which cannot be shown anywhere but in a browser.
  ui:demo:page
  # EVERY TEXT FIELD ON EVERY PAGE, against the browser's own <input>. The
  # page gate above clicks one field on one form; this one finds the sixteen
  # fields on five pages from their accessibility trees and runs twenty
  # scenarios on each — click-to-caret, drag, word motion, clipboard, undo,
  # IME, Tab, the mirror — with a native input given the same gesture as the
  # oracle, and scores the matrix against a checked-in baseline. It exists
  # because the fields on these pages were reported as not behaving like the
  # fields on a shadcn page while every suite was green: the controller is
  # measured, the pages that wire it were not.
  ui:input:bench
  # ISSUES.md #76, and it is a COMPILER check sitting in the gallery runner on
  # purpose. `tests/compiler-issue-76.test.ts` covers the same three fixtures,
  # but no CI job on a pull request runs the full vitest suite — `test:es6`
  # runs compiler.test.ts alone and `test:publish` only fires on a release. An
  # unrun test is not a gate, and `recv.call(a).field = value` is exactly the
  # bug that fails in silence: it compiled clean and dropped the store. Two of
  # its fixtures assert a FAILED compile, so widening the parser's lookahead
  # later cannot quietly start storing into an unrelated statement's return
  # value. The check swallows the compiler's own output, because the loop
  # below fails a suite on the string `[FAIL]` appearing anywhere in it.
  compiler:issue76:check
  # Does anything sit on top of anything else? Ten layout defects were
  # reported from LOOKING at the pages while all 81 suites were green. The
  # only containment rule that existed compared right edges, in one demo out
  # of eighteen, and every defect reported was vertical. This is the other
  # half over all of them, and it needs no oracle: an in-flow child ends
  # inside its parent and two in-flow siblings do not share pixels.
  #
  # It runs against a recorded baseline rather than zero, because the debt is
  # real and shipping it as one red suite would just get the suite muted.
  # Lower a number when you fix something; the check fails if you do not.
  ui:layout:check
  # `flex-grow` against Chromium's own answer. It was not a property EVG
  # parsed at all — the shorthand and the other two longhands were, so a sheet
  # using `flex-grow: 1` was ignored without a word, and the stepper's rails
  # each took the parent's full width and pushed the steps down the page on
  # top of each other. Six cases, and the ones that matter are the ones an
  # implementation gets wrong: weighted factors, `flex-basis` sharing only the
  # remainder, and a grower with no free space left to take.
  evg:flexgrow:check
  # A percentage width inside an item whose width comes from `flex`, against
  # Chromium. Every chart on the showcase's generated chart pages hung off the
  # left edge of the paper: `.chartBox { width: 100% }` in a `flex: 1` cell
  # came out zero wide, because the automatic-minimum-size pass asks the cell
  # for its min-content width while the cell's own width is undecided, and the
  # walk that answers resolved — and LATCHED — the percentage against that
  # zero. Seven cases, including the control that always worked, the one
  # where the automatic minimum is what decides the cell, and the
  # `min-width: 0` shape the showcase's chart columns actually ask for.
  evg:pctflex:check
  # The RealTrainer app, which had no CI gate at all — which is how it came to
  # be red on main: `ProgressCtl.value` is a double and the demo assigned int
  # literals to it, so `rt:build` failed twelve times over and nothing said so.
  rt:check
  # Its COMPACT layer, with no app around it: text in, rows out, and the spec
  # line each row draws. The spec line is checked as PARTS — `3x5` and `x90kg`
  # are two runs with two tones — because that is the structure the TypeScript
  # library this is ported from produces, and a builder that returned one
  # string would pass a text assertion while losing what the theme draws.
  rt:compact
  # And the same rows against the TypeScript library this is a port OF. Every
  # case in the corpus goes through both sides and the PARTS are diffed —
  # `3x5` and `x80kg` print as one string either way, so comparing the string
  # would pass a port that had lost the distinction the theme draws. The
  # recording is committed, which is what lets this run here at all.
  rt:l0
  # And the report that says what this demo does with each COMPACT family. It
  # is generated, so it is checked: a coverage table nobody regenerates is a
  # coverage table that says what was true once.
  rt:coverage:check
  # The ported XState machine against the machine it was ported from: every
  # state crossed with every event, and the thirteen cells of twenty-one that
  # are IGNORES — the half a hand-port gets wrong while its happy path passes.
  rt:machine
  # Ranger has no clock: the app takes today as a value and the host hands it
  # in. This is the arithmetic against dates worked out independently, and the
  # wiring that lets a host say when now is.
  rt:clock
  # THE KEYBOARD, on a screen that is a picture. A canvas is one element, so
  # the browser has no tab stops to offer and nothing in the app is reachable
  # by key unless `EVGFocus` makes it so: Tab in tree order, the arrows by the
  # boxes, a dialog the keys cannot walk out of, Escape out of it and out of a
  # field, and the ring the pointer moves without drawing. None of it had a
  # gate here, which is how the composer shipped with a Tab that could not
  # reach the send button beside it.
  rt:keys
  # The scroll: sixty frames of the kept display list held against a full
  # re-layout of the same tree, plus the culling, the kept cards and the
  # charts painted where their cards are. The two bugs it has caught since —
  # a chart that did not move with its layer, a focus ring that did not — were
  # both invisible in a screenshot and both obvious here.
  rt:scroll
  # The quick entry end to end: text in, a proposal, a review, and a diary
  # entry only for what was agreed to.
  rt:add
  # And that a palette is a palette: the same frame, the same commands in the
  # same places, in every theme the settings page offers.
  rt:theme
  # The statechart runtime on its own account: its own two machines against
  # xstate — one that is the smallest thing still a machine, one that uses
  # everything the runner has — and the drawing it makes of them. Conformance
  # used to live only in gallery/realtrainer, which meant the module could not
  # be checked without that app's fixtures.
  statechart:test
  # And the machines too big to transcribe: planDialog's six states and
  # eighteen events, chat's six-it-can-rest-in and sixteen, run cell by cell
  # and then fuzzed against xstate itself. It found the one thing reading could
  # not — that `a || b` yields its last operand when everything is falsy, so a
  # context held null where the machine holds false — and, on the run that
  # added chat, that the fuzz had never been random: `seed * 1103515245` runs
  # past 2^53 and every "random sequence" was one event repeated.
  rt:machine:live
  # The Firebase simulator: the store, the query engine and its refusals, the
  # rules language, the accounts, the wait, and the model that streams. It is
  # the backend gallery/realtrainer never had, and the check below is the one
  # that makes it a claim rather than a hope.
  firesim:test
  # …and the twelve targets it compiles for, which is what the "run it on a
  # phone, and maybe on a watch" claim rests on. The client build is compiled
  # separately from the whole simulator, because they are different sizes for
  # a reason.
  firesim:targets
  # The workbench: a database browser over the simulator, drawn by EVG and
  # controlled by gallery/ui's own controllers — collections, documents, a
  # document's fields with their Firestore types, a query builder whose
  # interesting answers are the refusals, and the permission grid for whatever
  # path is selected. Driven here with a made-up clock; the page's own browser
  # gate is firesim:demo:frame, which needs a Chromium and skips loudly
  # without one.
  firesim:demo
  # And the demo drawing from the simulator instead of from its fixture file:
  # the seed goes in over REST, comes back through a query as a signed-in
  # user, and the app has to draw the SAME accessibility tree it draws from
  # the file. A field lost on the wire, a collection mis-sorted or a row the
  # rules hid moves the tree and fails here.
  firesim:realtrainer
  # And the machine wired to a view: the scenario replayed on the Ranger side,
  # against the trace recorded from it. The other half of that benchmark — the
  # same scenario against the React app on the Firebase emulators — is
  # scripts/record-reference-trace.mjs, which cannot run here and says so.
  rt:trace
  # …and that trace against the REFERENCE one: the app being ported, recorded
  # from the real frontend on the emulators. Frame by frame, the sequence of
  # stops a reader would tab through, scored by longest common subsequence
  # over the reference's own length. The floor only ever goes up — it is the
  # port's parity, and a number that can fall is a number nobody reads.
  rt:trace:diff
)

# Almost every suite here compiles what it runs, which is what makes them
# safe to split. These do not: they READ what the suite before them wrote, so
# they must land in the same shard as it, and the sharder treats each such run
# as one indivisible unit.
KEEP_WITH_PREVIOUS=(
  # `rt:trace` re-records gallery/realtrainer/web/traces/ and `rt:trace:diff`
  # scores those recordings against the reference. The recordings are
  # COMMITTED files, so a diff that runs without the recording before it reads
  # the last commit's traces instead of this commit's — green on exactly the
  # drift it exists to catch, and silently, because nothing is missing.
  rt:trace:diff
)

# A shard is a slice of the list above, not a list of its own: a suite added
# to SUITES is picked up by whichever shard it falls into, and no shard file
# can go stale against it.
if [ -n "$SHARD" ]; then
  # Group first, then deal round-robin over the GROUPS, so an attached suite
  # never gets separated from the one it reads.
  units=()
  for suite in "${SUITES[@]}"; do
    attach=0
    for pinned in "${KEEP_WITH_PREVIOUS[@]}"; do
      if [ "$pinned" = "$suite" ] && [ ${#units[@]} -gt 0 ]; then attach=1; fi
    done
    if [ "$attach" -eq 1 ]; then
      last=$(( ${#units[@]} - 1 ))
      units[$last]="${units[$last]}"$'\n'"$suite"
    else
      units+=("$suite")
    fi
  done

  picked=()
  u=0
  for unit in "${units[@]}"; do
    if [ $(( u % SHARDS )) -eq $(( SHARD - 1 )) ]; then
      while IFS= read -r suite; do picked+=("$suite"); done <<<"$unit"
    fi
    u=$(( u + 1 ))
  done
  SUITES=("${picked[@]+"${picked[@]}"}")
  printf 'shard %s/%s: %s suites\n\n' "$SHARD" "$SHARDS" "${#SUITES[@]}"
  if [ "${#SUITES[@]}" -eq 0 ]; then
    echo "nothing in this shard"
    exit 0
  fi
fi

failed=()
for suite in "${SUITES[@]}"; do
  printf '==> %s\n' "$suite"
  out="$(npm run --silent "$suite" 2>&1)"
  status=$?
  bad=""
  if [ $status -ne 0 ]; then
    bad="exit $status"
  elif grep -q '\[FAIL\]' <<<"$out"; then
    bad="compiler reported [FAIL]"
  elif ! grep -qE 'ALL PASS|failed=0' <<<"$out"; then
    bad="no pass marker in output"
  fi
  if [ -n "$bad" ]; then
    failed+=("$suite ($bad)")
    printf '%s\n' "$out" | tail -30
    printf '    %s FAILED — %s\n' "$suite" "$bad"
  else
    printf '    %s ok\n' "$suite"
  fi
done

echo
if [ ${#failed[@]} -ne 0 ]; then
  echo "FAILED suites:"
  for f in "${failed[@]}"; do
    echo "  - $f"
  done
  exit 1
fi
if [ -n "$SHARD" ]; then
  echo "all ${#SUITES[@]} gallery editor suites in shard $SHARD/$SHARDS passed"
else
  echo "all ${#SUITES[@]} gallery editor suites passed"
fi
