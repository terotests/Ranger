# gallery/realtrainer/android — RealTrainer on an Android phone or tablet

The same Ranger. `ranger/rt_android.rgr` imports
`gallery/realtrainer/src/RealTrainerDemo.rgr` unchanged and is compiled to
Kotlin — around 87 000 lines holding the EVG controllers, the stylesheet
cascade, the layout engine, the display list, the COMPACT parser, the state
machines, the Vela runtime that draws the statistics and the demo itself.
Nothing about the app is written twice for Android.

```bash
npm run rt:android:verify     # every rule this port adds, driven on Node   (no SDK)
npm run rt:android:desktop    # the page painted through the shared painter (kotlinc)
npm run rt:android:typecheck  # the two Android-only files, against stubs   (kotlinc)
npm run rt:android            # the APK                                     (SDK + JDK 17)
npm run rt:android:run        # build, put it on an emulator, open it
npm run rt:android:ranger     # write the generated Kotlin and stop
```

## What is here, and why so little

| | |
| --- | --- |
| `ranger/rt_android.rgr` | the viewport: the page is the view in dp, a press, a drag that scrolls and drops the press, the keyboard's text, the clock |
| `ranger/check_rt_android.rgr` | all of the above, driven on Node — 40 checks |
| `app/…/RealTrainerView.kt` | the only file that needs a device: `MotionEvent`, `Canvas`, `InputConnection` |
| `app/…/MainActivity.kt` | five assets in, one view on screen |
| `desktop/…/CheckRealTrainer.kt` | the page painted with Java2D through the same painter the app uses |
| `scripts/` | Ranger→Kotlin, the assets, the APK, the emulator, and the three off-device checks |
| `package.json` | the same scripts under short names, so `npm run run` works from in here |

The painter is not here. [`gallery/evg/android`](../../evg/android/README.md)
draws this, the dashboard and the pptx viewer: `EvgPainter` walks the display
list, `AndroidEvgSurface` is `android.graphics.Canvas` and `AwtEvgSurface` is
the Java2D twin the desktop check paints with.

## The page is the view

There is no fit, no letterbox and no pinch, as there is none in the browser at
`?page=fit`. The demo is responsive — the stylesheet folds the rail into a
bottom bar under 768px — so it is laid out at the view's size in
density-independent pixels, and again whenever that changes: a rotation,
multi-window, the keyboard. A phone gets the phone shell and a tablet the
desktop one, at their own size, the way the original does.

The host divides a `MotionEvent` by the display density before it calls in and
scales the canvas by the density to draw, so text and paths rasterise at the
panel's real resolution. `windowSoftInputMode=adjustResize` makes the keyboard
a shorter view; the facade keeps the page's state through it and the focused
field stays where it was.

## The keyboard

Two keyboards reach a `View`. The soft one arrives through an
`InputConnection`: what it commits goes into the focused field through the
demo's own text bridge — the same `typeText` the browser and the iOS port use —
and a delete is a `Backspace`. A hardware one, the emulator's or a tablet's
case, arrives as key events and is named the way the browser names keys. The
facade decides on every release whether a field has the focus; the host shows
or hides the keyboard for it.

## Build and run

```bash
bash gallery/realtrainer/android/scripts/build-ranger.sh     # 1. Ranger → Kotlin
bash gallery/realtrainer/android/scripts/prepare-assets.sh   # 2. the five texts into app/src/main/assets
bash gallery/realtrainer/android/scripts/build-app.sh debug  # 3. the APK
```

…or all three at once: `npm run rt:android`. `npm run rt:android:run` does
that and then finds the SDK through `ANDROID_HOME` / `ANDROID_SDK_ROOT` (or the
usual Android Studio places), uses a device that is already online in
preference to booting one, installs the APK and opens it:

```bash
npm run rt:android:run
npm run rt:android:run -- --avd Pixel_Tablet_API_34   # pick the image
npm run rt:android:run -- --logcat                    # …and tail the app's log
npm run rt:android:run -- --no-build                  # reinstall what is built
```

A phone image shows the phone shell, a tablet image (`Pixel Tablet`, API 34)
the rail. Presses are logged one line each under the tag `RtTouch`.

The five assets are the same texts the browser bundle embeds and the iOS
build copies in as resources: `web/realtrainer.css`,
`fixtures/session.compact`, the two machines under `fixtures/machines/` and
`fixtures/reference/seed.json`. They are copied at build time and not checked
in, and neither is the generated Kotlin.

## Checking the port without an SDK

`npm run rt:android:verify` compiles the facade and its checks to JavaScript
and runs them on Node: the page is the view at a Pixel 8's and a Pixel
Tablet's size and after a rotation, the phone has the bar and the tablet the
rail, a press at a view point reaches the control drawn there, a drag scrolls
the diary and drops the press, a tap on the chat field takes the focus and the
keyboard's text lands in it.

`npm run rt:android:desktop` needs `kotlinc`: it compiles the generated Kotlin
with the shared painter and paints seven frames with Java2D into
`tmp/rt-android/` — the plan, the diary, the calendar, the statistics, the chat, and a tablet both ways — asserting
that text, boxes, clips, the icons' stroked paths and the charts' filled
areas all reach the surface, and that every `save` was restored.

`npm run rt:android:typecheck` type-checks `MainActivity.kt` and
`RealTrainerView.kt` against the platform stubs in
`gallery/evg/android/androidstubs`. Green means "it will compile", not "it
draws": a stub cannot draw.
