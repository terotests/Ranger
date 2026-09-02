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
set -uo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"

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
  datagrid:test
  datagrid:edit:test
  office:history:test
  office:text:test
  office:metrics:test
  office:font:test
  office:style:test
  office:bidi:test
  office:geom:test
  office:shapes:test
  office:shapes:native
  office:color:test
  office:asset:test
  office:rtl:editors:test
  ui:test
  evg:trace:test
  # The toolbar's model, its metrics, and every outline in the icon catalogue.
  # The catalogue check is the one that earns its place: it walks all four
  # layers of all eighty icons and asserts each parses and stays on the
  # 24-grid, and it failed the first time it was run.
  evg:toolbar:test
  evg:overlay:test
  evg:style:test
  evg:timing:test
  evg:box:test
  evg:viewport:test
  evg:reconcile:test
  evg:component:test
  evg:stylecache:test
  evg:invalidate:test
  evg:adopt:check
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
)

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
echo "all ${#SUITES[@]} gallery editor suites passed"
