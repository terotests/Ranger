# The dashboard demo on iPhone, iPad and Apple Watch — built without Xcode

[`gallery/ui/demo`](../demo)'s **dashboard** — shadcn's `dashboard-01`, with a
navigation sidebar, four figure cards, a Vega chart that is really computed, a
virtualised data table and a scrolling page — as an Apple app. Not a rewrite and
not a WebView: the same `DashboardDemo.rgr` the browser page, the gates and the
[Android port](../android/README.md) run, compiled to **Swift** and painted with
**CoreGraphics**.

And built by a **Ranger program calling command line tools**. There is no Xcode
project in this directory, nothing here opens Xcode, and the build is not a
shell script — it is `ranger/build_ios.rgr`, which drives the Ranger compiler,
`xcrun`, `swiftc`, `plutil`, `codesign` and `simctl` through
[`lib/Shell.rgr`](../../../lib/Shell.rgr).

```text
gallery/ui/demo/DashboardDemo.rgr   the page: controllers, tree literals,
gallery/ui/src/*.rgr                cascade, layout, table, sortable
gallery/evg/*.rgr                   EVG: units, flex, clip, display list
gallery/vela/*.rgr                  the chart's runtime — all Ranger
      │
      │  node bin/output.js -l=swift6        (from inside build_ios.rgr)
      ▼
generated/ui_ios.swift              ~46k lines, one file
      │
      │  UiIos.frame() : EVGDisplayList
      ▼
gallery/evg/apple                   the painter and the CoreGraphics surface
      │
      ├── DashboardView (UIKit)     iPhone, iPad
      └── DashboardWatchView        Apple Watch, SwiftUI Canvas + the crown
```

## Build and run

```bash
npm run ui:ios:check    # what this machine can build — safe anywhere
npm run ui:ios:plan     # the whole plan, printed, nothing run — safe anywhere
npm run ui:ios:verify   # the port's own logic, checked — safe anywhere
npm run ui:ios:smoke    # the driver itself, run for real — safe anywhere

npm run ui:ios          # build the .app                    (needs a Mac)
npm run ui:ios:run      # ...and put it on a simulator       (needs a Mac)
npm run ui:ios:watch    # the same page on an Apple Watch    (needs a Mac)
npm run ui:ios:device   # ...and onto the iPhone or iPad on the cable
```

The first four need nothing but Node. The rest need **Xcode** — not the Command
Line Tools, which carry clang and git and no platform SDK, no simulator runtime
and no `devicectl`. They need no Xcode *project* and no developer account
though: a simulator bundle is signed ad hoc.

**Start with `npm run ui:ios:check`.** A Mac can be in four states that all
look alike from the outside, and it names which one this is: only the Command
Line Tools installed; Xcode installed but not the selected one
(`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`); Xcode
selected but its licence not accepted or its first launch never finished
(`sudo xcodebuild -license accept`, `sudo xcodebuild -runFirstLaunch`); or the
iOS platform never downloaded, which Xcode 15 and later leave out of the
initial install (`xcodebuild -downloadPlatform iOS`). It prints what `xcrun`
itself said, which is the sentence that distinguishes them.

### One command onto a test device

```bash
npm run ui:ios:device                       # build, sign, install, launch
npm run ui:ios:device:console               # ...and keep its output here
npm run ui:ios:device -- --device="Tero"    # when more than one is plugged in
```

That is one command because the three things a device build needs are all
**found** rather than typed:

| | |
| --- | --- |
| the device | `xcrun devicectl list devices`, first **connected** one — a paired-but-absent device is listed and is not a candidate |
| the identity | `security find-identity -v -p codesigning`, preferring an **Apple Development** certificate, because this is testing on a cable and a distribution one cannot be |
| the profile | the `.mobileprovision` files Xcode leaves on the machine, matched on the bundle id **and** on this device being in it; an exact bundle id beats a wildcard |

`--identity=` and `--profile=` still win when given. The entitlements are read
out of the profile that was chosen — a bundle signed with entitlements its
profile does not grant installs and then refuses to launch, with no message
anyone can act on.

Then two commands, where a simulator needs five:

```
xcrun devicectl device install app --device <id> …/RangerDashboard.app
xcrun devicectl device process launch --device <id> --terminate-existing fi.ranger.dashboard
```

`--console` swaps `--terminate-existing` for `--console` and keeps the process
attached, which is the whole point of a test build on a cable: a device has no
console you can otherwise see.

**What this cannot do is CREATE a provisioning profile.** That is a
conversation with Apple's developer portal, and the only command line tool that
has it is `xcodebuild -allowProvisioningUpdates` — the thing this driver exists
to avoid. If no profile matches, the error says exactly this: open Xcode once,
make any project with the bundle id, pick your team and build to the device
once. After that the profile is on the machine and this finds it. `--bundle-id`
is the other way out, if you already have a wildcard profile.

Needs Xcode 15 or later for `devicectl`; older toolchains need a third-party
installer, which this does not wrap, and the error says so.

Arguments go through after a `--`:

```bash
npm run ui:ios:run -- --device="iPad Pro"      # which simulator to launch on
npm run ui:ios:run -- --device="iPhone 15"
npm run ui:ios -- --pad                        # what the app CLAIMS to run on
npm run ui:ios -- --release                    # swiftc -O
npm run ui:ios:run -- --no-build               # reinstall what is already built
npm run ui:ios -- --target=ios-device \
  --identity="Apple Development: You (ABC123)" \
  --profile=signing/dev.mobileprovision        # build+sign for a real iPhone
```

**`--device` and `--pad` are not the same question.** `--device` chooses the
machine the app lands on. `--pad` and `--phone` set `UIDeviceFamily` in
Info.plist — what the bundle *claims* to run on, which is the only difference
between "an iPhone app" and "an iPad app" once the binary exists. Building
`--pad` and launching on an iPhone simulator is a thing you can ask for, and it
will not install.

`--no-build` reuses the `.app` that is already there — `--no-ranger` skips only
the Ranger→Swift compile, this skips `swiftc` too, which is the 46 000 lines
that make a re-run slow when nothing but the device changed.

### What `--run` actually does

`--run` is what turns the build into a launch. Without it you get a `.app` on
disk and nothing else. With it:

```
xcrun simctl boot <udid>
open -a Simulator
xcrun simctl bootstatus <udid>
xcrun simctl install <udid> tmp/ui-ios/build/ios-simulator/RangerDashboard.app
xcrun simctl launch --terminate-running-process <udid> fi.ranger.dashboard
```

`open -a Simulator` is not decoration: `simctl boot` starts the *device*, not
the application that shows it, and without this the app is running with no
window — which looks exactly like a build that did nothing. `bootstatus` is
there because installing into a device that is still starting fails
intermittently, and `--terminate-running-process` so that a second run replaces
the first.

With no `--device`, a simulator that is **already booted** is preferred over
starting another one. With a `--device`, the named one wins even over a booted
one. A name that matches nothing is an error that names it and points at
`xcrun simctl list devices available`, rather than a quiet fallback to some
other device.

This directory is also a package of its own, so `npm run run` works from in
here, and the repository-root names are aliases in the same file.

| From `gallery/ui/ios` | From the repository root |
| --- | --- |
| `npm run run` / `npm start` | `npm run ui:ios:run` |
| `npm run device` | `npm run ui:ios:device` |
| `npm run build` | `npm run ui:ios` |
| `npm run watch` | `npm run ui:ios:watch` |
| `npm run verify` | `npm run ui:ios:verify` |
| `npm run smoke` | `npm run ui:ios:smoke` |
| `npm run check` | `npm run ui:ios:check` |
| `npm run plan` | `npm run ui:ios:plan` |

## What is here

| Path | What it is |
| --- | --- |
| `ranger/ui_ios.rgr` | The facade — the only page-facing Ranger written for Apple, and it is a *viewport* |
| `ranger/build_ios.rgr` | **The build**, as a Ranger program: compiler, SDK, plist, swiftc, codesign, simctl |
| `ranger/check_ios.rgr` | The port, driven off-device. 82 checks, no Mac |
| `ios/DashboardView.swift` | The `UIView`: touches, the pinch, the fling, the key table |
| `ios/AppDelegate.swift` | One asset in, one view on screen. No storyboard |
| `ios/main.swift` | `UIApplicationMain`, written out rather than left to `@main` |
| `watch/WatchApp.swift` | SwiftUI `Canvas`, the digital crown, and the readable fit |
| `scripts/` | Thin wrappers: compile the driver, then run it |
| `scripts/smoke.sh` | The driver run for real against a stand-in toolchain, on any machine |

The painter, the surface protocol and the CoreGraphics backend are **not** here:
they are [`gallery/evg/apple`](../../evg/apple/README.md), shared with whatever
comes through them next.

## The build is a program, not a script

This is the part worth reading even if you have no Mac.

`gallery/ui/android/scripts/build-app.sh` is a shell script that runs Gradle.
The equivalent here is `ranger/build_ios.rgr` — Ranger source, compiled to
JavaScript, run on Node. It exists because Ranger can now **call command line
programs**: [`run_process_result`](../../../compiler/Lang.rgr) is one compiler
primitive answering `[exit code, stdout, stderr]`, and
[`lib/Shell.rgr`](../../../lib/Shell.rgr) is the API over it.

The pay-off is `--dry-run`. Every step goes through a `Shell`, and a `Shell` in
dry mode records instead of executing, so the whole plan is a list of strings on
any machine:

```console
$ npm run ui:ios:plan
RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node --max-old-space-size=8192 \
  bin/output.js -l=swift6 gallery/ui/ios/ranger/ui_ios.rgr -nodecli \
  -d=gallery/ui/ios/generated -o=ui_ios.swift
plutil -lint tmp/ui-ios/build/ios-simulator/RangerDashboard.app/Info.plist
xcrun --sdk iphonesimulator swiftc -sdk <…> -target arm64-apple-ios15.0-simulator \
  -emit-executable -wmo -o …/RangerDashboard.app/RangerDashboard \
  gallery/ui/ios/generated/ui_ios.swift gallery/evg/apple/Sources/*.swift \
  gallery/ui/ios/ios/*.swift
cp -R gallery/ui/demo/dashboard.css …/RangerDashboard.app
codesign --force --sign - --timestamp=none …/RangerDashboard.app
xcrun simctl boot <udid>
open -a Simulator
xcrun simctl bootstatus <udid>
xcrun simctl install <udid> …/RangerDashboard.app
xcrun simctl launch --terminate-running-process <udid> fi.ranger.dashboard
```

That is the entire iOS build. Ten commands, no project file, and
[`lib/apple/apple_test.rgr`](../../../lib/apple/README.md) asserts 151 things
about it — including that the plist is linted **before** an hour of compiling
and that signing happens **after** the binary is in the bundle — on a machine
with no Xcode on it.

## Checking the port without a Mac

```bash
npm run ui:ios:verify
```

82 checks, on Node, in the same `UiIos` the app runs. What it asks:

**Does the page build, and does it reach every command the surface implements?**
The frame is 352 commands on an iPad: 186 text runs, 54 filled boxes, 54
borders, 51 stroked paths, one filled path and three clip pairs. Every clip that
is pushed is popped — the one invariant whose failure on CoreGraphics is a page
with most of it missing. What no part of the page reaches is **printed** rather
than left silent: today that is images.

**Does the viewport arithmetic hold, insets and all?** This is what the port
adds. The fit scale, the page height a screen is worth, a pinch that has to
leave the point under the fingers where it was, a pan that stops at the edge —
and the safe area, which Android has no equivalent of: a phone held sideways
gives up 118 points to the notch and the home indicator, and the page is laid
into what is left. A host that handed the hit test window coordinates instead
would be wrong by the height of the status bar everywhere on the page.

**Does a finger land?** Window coordinates in, a test id out, and the page
changes: a tap on a sidebar link moves the page you are on, a tap on a range
button rebuilds the chart, a drag scrolls and stops at the bottom rather than
past it, and PageDown / Home / End do what the browser's do. The presses are
found by hit-testing the screen the way the app does, not by calling
`press(id)` — the coordinate conversion is exactly what this port adds.

**Does the watch fit make sense?** See below.

**Does the ripple's clock get stuck?** It cannot: `tick` clamps a late frame
rather than skipping it, and the checks drive it with a clock that jumps nine
seconds at a time and one that reports nothing at all. Both have to end.

### And the driver, run for real

```bash
npm run ui:ios:smoke
```

`--dry-run` checks the **plan**: which program, with which arguments, in which
order. It cannot check the code that *runs* — the directories the driver makes,
the Info.plist it writes, the profile it decodes, the order the answers come
back in. That code went untested until someone ran the real thing on a Mac and
it died on `mkdir` for a directory that already existed.

So `scripts/faketoolchain/` is a stand-in `xcrun`, `security`, `plutil`,
`codesign`, `open` and `xcode-select` on `PATH`. It is not a simulation of
Xcode — its `swiftc` writes five bytes and calls it a Mach-O — it is a stand-in
for every tool the driver shells out to, so that everything *around* those
tools is exercised: a device found and a paired-but-absent one skipped, an
identity and a profile discovered, a bundle with all five files in it, the
plist's contents, `--no-build` not compiling, a missing phone said **before**
`swiftc` rather than after, and the whole thing **run twice**, because the
second run over its own output is where the interesting bugs are.

What this does NOT prove is the platform delegation:
`CoreGraphicsEvgSurface` calling `CGContext`, and `DashboardView` unpacking a
`UITouch`. Those need a Mac.

## The design, and why it is shaped like this

### The page is a document, and the window is a viewport

The demo is **1336 pixels wide and that number is load-bearing**: the chart's
994 and every axis label measured against it are derived from it. So a phone
does not get a narrower dashboard, it gets the same one at a smaller scale —
`fitScale = usableWidth / 1336`, and the context is scaled by it.

### The safe area is not the window

An Android surface is the screen. An iPhone's is not: a notch, a status bar and
a home indicator all sit **on** the window. The host reports the insets it is
given, the page is fitted into `window − insets`, and `toPageX`/`toPageY` take
the inset off before the scale. That conversion is in Ranger, not in the view,
so `check_ios.rgr` can drive it.

### A watch is not a small phone

198 points across a 45mm watch. Fitting 1336 page pixels into that is a scale of
0.148 — a photograph of a dashboard rather than a dashboard. So the watch uses a
**readable floor**: `max(fitWidth, 0.5)`, and the reader moves around the page.
Two thirds of the width is off the side and panning is how you reach it, which
is an honest answer for a desktop page on a watch and a better one than a
picture of it.

The floor only ever raises the scale. Hand the same mode a tablet-sized window
and it fits the width like everything else.

### The crown is not a finger

A finger reports a distance on a screen, so a drag goes through the scale: a
zoomed-in page scrolls by less document than the finger travelled, which is what
zoom means. The digital crown reports a **rotation**, and a rotation has no
length. One turn moves the page by a fixed number of page pixels whatever the
page is scaled to — which is what makes the crown feel the same on a 40mm watch
and a 49mm one. A host that divided it by the scale would scroll twice as far on
a page zoomed out by half.

### The watch runs the engine off the main thread

Of the three Apple hosts the watch is where a layout on the main thread shows
first: the S9's cores are a third of an iPhone's, and a crown turn is a
layout per frame. So `WatchPageModel` reaches `UiIos` only through
`EvgEngineQueue` (`gallery/evg/apple`): the crown, a drag and a tap are posts,
a post that changed the page builds a frame on the queue — the list, the
scale and the pan — and the frame's arrival on the main thread is what bumps
`generation` and makes the `Canvas` draw. `paint` reads the app for nothing.
CoreText measures the text (`CoreTextMeasurer`), installed above the app so
the first layout already has it. See PLAN_NATIVE_HOSTS.md, the section on
watches.

### No JSON in the middle

The browser demo serialises the display list, because a page has to parse
something anyway. Swift has no such boundary: `UiIos.frame()` returns the
`EVGDisplayList` itself. Nothing is allocated per frame beyond the list the page
already built, and the gradients and shadows `toJson` does not carry survive to
the painter.

### Nothing is rasterised at a fixed size

The context is scaled and the display list is left alone, so text and vector
shapes are drawn *through* the scale rather than blitted from a bitmap made at
some other size. That is why a pinch stays sharp — the same trick the WebGL host
plays with `dpr` and the Android port plays with `density`.

### A touch does not re-run the chart

`DashboardDemo.hitId` repaints the whole page before answering, chart included.
That is the right trade for a browser calling it once per click and the wrong
one for a touchscreen, so the facade uses `hitIdCached`, which hit-tests the
layout that is already there. The view caches its frame for the same reason: a
scroll must not pay for the Vela runtime sixty times a second.

### Nothing in the host consumes a touch

`UIPanGestureRecognizer` and `UIPinchGestureRecognizer` both have
`cancelsTouchesInView = false`. A host that let a recogniser swallow
`touchesBegan` has eaten the press: the page never learns a finger arrived, so
nothing responds while it still renders perfectly. This is the single easiest
way to build a canvas view that looks right and does nothing, and every UIKit
example that sets `cancelsTouchesInView` to its default gets it.

## Status

Verified here, without a Mac:

* `ranger/ui_ios.rgr` and the whole `gallery/ui` + `gallery/evg` + `gallery/vela`
  tree behind it **compile to Swift 6** — 46 039 lines, one file.
* The compiled page builds and lays itself out — cascade, flex, scroll
  container, virtualised table, the Vela runtime — and answers with a display
  list of 352 commands on an iPad.
* Every command kind the CoreGraphics surface implements is reached by the page,
  and every clip pushed is popped.
* The viewport arithmetic, the safe area, the presses, the scrolling, the keys,
  the pinch, the watch fit, the crown and the ripple's clock all hold. **82
  checks.**
* The build driver's plan — every program, every argument, in order, for an
  iPhone, an iPad, a watch and a signed device build — is asserted by
  `lib/apple/apple_test.rgr`. **151 checks**, on seven target languages.

**Not verified here: anything that needs a Mac.** The `swiftc` compile of the
generated Swift, the CoreGraphics drawing, the UIKit and SwiftUI hosts, and the
simulator run. Swift for Apple platforms cannot be installed on the environment
this was written in, so the Swift host files (about 1 150 lines across
`gallery/evg/apple` and this directory) have been written but not compiled. Say
so plainly rather than discovering it: **the first person to run
`npm run ui:ios` on a Mac should expect to fix Swift compile errors.** The
Ranger side, which is everything that has decisions in it, is checked.

Known gaps, in rough order of how much they would be missed:

* **No ripple.** `evg-surface-effect: ripple` is a post-process over the
  finished pixels, and CoreGraphics has no such stage — the Android port needed
  `RuntimeShader` (API 33) for it. The Apple equivalent is a Metal pass or a
  `CIFilter`; the facade already tracks the drops, ages them and goes quiet, so
  what is missing is the shader and the layer to run it in.
* **No accessibility mirror.** The browser page mirrors `a11yJson()` into real
  DOM over the canvas, because a canvas hands VoiceOver one empty element. The
  Apple equivalent is `UIAccessibilityContainer` with a virtual element array,
  and the tree to build it from is already compiled into the app.
* **No text input.** The table's filter wants a `UIKeyInput`.
* **No app icon.** `AppleToolchain.compileAssets` wraps `actool` and nothing
  calls it. The app builds and runs without one.
* **One page.** The dashboard only; the other twelve demos in `gallery/ui/demo`
  are a facade each away.

## Related

* [`gallery/ui`](../README.md) — the controllers, and what they are measured against
* [`gallery/ui/demo`](../demo) — the same page in a browser
* [`gallery/ui/android`](../android/README.md) — the same page on Android, and the port this follows
* [`gallery/evg/apple`](../../evg/apple/README.md) — the painter and the CoreGraphics surface
* [`lib/apple`](../../../lib/apple/README.md) — the Apple toolchain driver, and its 151 checks
* [`lib/Shell.rgr`](../../../lib/Shell.rgr) — calling command line programs from Ranger
