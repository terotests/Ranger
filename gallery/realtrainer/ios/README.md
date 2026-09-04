# gallery/realtrainer/ios — RealTrainer on iPad and iPhone

The same Ranger. `ranger/rt_ios.rgr` imports
`gallery/realtrainer/src/RealTrainerDemo.rgr` unchanged and is compiled to
Swift — around 19 000 lines holding the EVG controllers, the stylesheet
cascade, the layout engine, the display list and the demo itself. Nothing about
the app is written twice for Apple.

```bash
npm run rt:ios:verify     # every rule this port adds, driven on Node   (no Mac)
npm run rt:ios:plan       # the exact commands a build would run        (no Mac)
npm run rt:ios:check      # what this machine can build
npm run rt:ios:run        # build and launch on a simulator
npm run rt:ios:device     # build, sign and launch on the iPad on the cable
npm run rt:ios:swift      # write the generated Swift and stop
```

## What is here, and why so little

| | |
| --- | --- |
| `ranger/rt_ios.rgr` | the viewport: contain fit, safe area, window point → page point, pinch, pan, the clock |
| `ranger/check_rt_ios.rgr` | all of the above, driven on Node — 55 checks |
| `ios/RealTrainerView.swift` | the only file that needs a device: `UITouch`, `CADisplayLink`, `CGContext` |
| `ios/AppDelegate.swift`, `ios/main.swift` | a window, in code — there is no Xcode project |

The painter is not here. `gallery/evg/apple` draws this and the dashboard both,
and the build driver is `gallery/ui/ios/ranger/build_ios.rgr` — one driver for
every Apple port in the gallery, told `--app=realtrainer`.

## The one thing this port does differently

The dashboard is a **document**: a fixed width that scrolls, so it is scaled by
a ratio of widths. RealTrainer is now a **responsive page**: one tree, and the
stylesheet's `@media` blocks fold the rail or the bottom bar at 768px — the
same page is the phone app on a phone and the desktop app on a desktop, as the
browser shows it at `?page=fit`. So there is no fit, no letterbox and no pinch
here: the page is laid out at the window's size less the safe area, and again
whenever that changes — a rotation, Split View, the keyboard — and the host
paints the display list at the safe area's corner, scale one.

What the facade adds on top of the demo is the finger and the keyboard: a
touch down marks the control under it and a touch up activates it; a drag
scrolls the document as the browser's pointer drag does, and past a few points
of travel drops the press it started on; a tap on a field takes the focus and
the view becomes the first responder, so the keyboard rises, and what it types
lands in the field through the same `typeText` and `keyWith` the browser's
text-input bridge uses. The page draws its own field and caret.

The five texts the browser bundle embeds — the stylesheet, the session's
COMPACT, the two state machines and the reference seed — travel as resources,
listed in `build_ios.rgr` beside the stylesheet, and `AppDelegate` hands them
to the page at start. A missing one comes back empty and the page still opens.

## What the checks prove without a Mac

`npm run rt:ios:verify` drives `RtIos` on Node from the same five texts —
42 checks: the page is the usable window on an iPhone 15 Pro, an iPad Pro and
an iPhone SE, and again after a rotation; the phone gets the bottom bar and the
tablet the rail; a press under the clock or the home indicator reaches
nothing, and a press at a window point reaches the control drawn there; a
finger down marks, a finger up activates, a drag scrolls the diary feed (one
word followed from before to after) and drops the mark; a tap on the chat
field takes the focus, the keyboard's text lands in it and reads back, a
Backspace is a key, and the clock runs.

What they cannot prove is the platform delegation — `CoreGraphicsEvgSurface`
calling `CGContext`, and `RealTrainerView` unpacking a `UITouch`. Those need a
Mac, and `npm run rt:ios` is what builds them.
