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
a ratio of widths and its height is set to whatever the viewport is worth.

RealTrainer is a **composition**: 980×760, designed whole, with nothing to
scroll. Scaling it that way would re-lay it out into a shape its author never
drew. So the fit is `min(w-ratio, h-ratio)` — the page is *contained*, whole and
centred, with a letterbox where the aspect ratios disagree, and the page keeps
its own size on every screen.

That is the entire difference between the two facades, and it is why there are
two rather than a flag on one.

## What the checks prove without a Mac

The whole page, on every screen this is for — iPad Pro 11″, iPad 10.9″, iPad
mini, iPhone 15 Pro Max, iPhone SE — plus: the safe area comes off before the
fit, so nothing lands under the clock or the home indicator; a press at a
*window* coordinate reaches the control drawn there and a press in the
letterbox reaches nothing; a pinch holds the point under the fingers still; a
drag stops at the page's edge, and does nothing at all while the page fits; and
the clock runs the loading scene through to the sign-in page.

What they cannot prove is the platform delegation — `CoreGraphicsEvgSurface`
calling `CGContext`, and `RealTrainerView` unpacking a `UITouch`. Those need a
Mac, and `npm run rt:ios` is what builds them.
