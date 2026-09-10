# Putting a Ranger app in a window

An EVG application is a pure Ranger program: it lays out a tree, applies a
stylesheet and emits an `EVGDisplayList`. It has no window, no touch, no
clock and no files. A **host** is what puts it in a window — and there are four
of those in this repository, for iOS, Android, the browser and (in
`gallery/rangerflow/platform/sdl`) a desktop SDL window.

They used to be written out per application per platform. Most of what they
each contained was the same, and this is what is left once that is shared.

---

## The pieces

| | what it is | where |
|---|---|---|
| `EvgApp` | the conversation every host has with every app: a page size, a hit test, presses, hovers, scrolls, keys, a clock, a display list | `EvgApp.rgr` |
| `EvgViewport` | a window, a safe area and where the page sits inside them: the fit, the scale, the pan, window point → page point | `EvgViewport.rgr` |
| `EvgHost` | a host for an app that scrolls a document: the press a drag cancels, the fling timed against the host's clock, the keyboard's text. Used by the UIKit view, the Android View, and the browser page in both its arrangements | `EvgHost.rgr` |
| `UiWindowHost` | a host for a fixed-width page that is fitted, panned and pinched | `../ui/src/UiWindowHost.rgr` |
| the painters | `EVGDisplayList` → CoreGraphics, Android `Canvas`, WebGL 2, DOM | `apple/`, `android/`, `gl/`, `html/` |

`EvgApp`'s defaults are what an app that does not do a thing should answer —
nothing happened, nothing is under the point, the list is empty — so a host may
ask anything of any app without checking first what kind of app it is.

`EvgViewport` has three modes, and they are modes rather than a compromise:

```
0  the page IS the window          scale 1, pan 0, a pinch does nothing
1  fit the page's own width        panned and pinched
2  fit, with a readable floor      the watch: bigger than the window, moved around
```

Mode 0 is mode 1 with the page's width equal to the usable width. It is a mode
of its own so a host that means it cannot be zoomed out of by arithmetic.

---

## A new application, on every platform

**1. Make the app answer the conversation.** Extend `EvgApp` and override what
it does. Nothing else changes: the methods have the names the app already used.

```
class MyApp extends EvgApp {
    fn display:EVGDisplayList () { ... }
    fn hitId:string (px:double py:double) { ... }
    ...
}
```

**2. Choose a host and say what is yours.** A document that scrolls extends
`EvgHost`; a fixed-width page that is fitted and pinched extends
`UiWindowHost`. The subclass holds the app twice — once as itself, for the
calls that are its own, and once in `app`, which is all the host ever sees —
and adds only how the app is loaded:

```
class MyHost extends EvgHost {
    def mine:MyApp (new MyApp)
    Constructor () { app = mine }
    fn start:void (w:double h:double css:string) {
        mine.init(css)
        this.began(w h)
    }
}
```

`RtHost.rgr` is 62 lines and four of them are RealTrainer's own; that is the
size this step should be.

**3. Name it per platform.** One line each, because the Swift and the Kotlin
import a name:

```
; ios/ranger/my_ios.rgr
class MyIos extends MyHost { }

; android/ranger/my_android.rgr
class MyAndroid extends MyHost { }
```

**4. Check it on Node.** This is the step that makes the rest cheap: the host
is Ranger, so the whole viewport — the fit, the conversion, the press, the
drag, the fling, the keys — is drivable without a device.
`realtrainer/ios/ranger/check_rt_ios.rgr` is 42 assertions and
`ui/ios/ranger/check_ios.rgr` is 82; between them they are what lets any of
this be refactored at all. A Mac and an emulator are then needed only for the
Swift and the Kotlin on top.

**5. Write the platform glue.** What genuinely cannot be shared: unpacking a
`UITouch` or a `MotionEvent`, running a display link, handing a `CGContext` or
a `Canvas` to the painter, owning the keyboard. RealTrainer's is 397 lines of
Swift and 504 of Kotlin, and it calls the host and nothing else.

---

## Where each platform stands

**iOS and Android** share everything above. `RtIos` and `RtAndroid` are one
line each; so are `UiIos` and `UiAndroid`. A gesture or a viewport rule fixed
once is fixed on both.

**SDL** is a different shape and composes rather than competes:
`rangerflow_sdl.rgr` is the outer loop — open a window, pump input, draw a
frame — where `EvgHost` is the inner viewport. A host that wanted both would
own an `EvgHost` and call it from `pumpInput`.

**The browser uses `EvgHost` too**, on the main-thread path. `main.js` had its
own copy of the press a drag cancels, the scrollbar grab, the hover and the
drag's velocity — the same state machine, in JavaScript — and now makes the
same six calls a UIKit view makes: `pressAt`, `panBy`, `releasePress`,
`cancelPress`, `hoverAt`, `clearHover`, with `key`, `typeText` and `tick`
beside them. It is 26 lines shorter and, more to the point, a rule fixed on a
phone is now fixed here.

Two things stayed in the page, and both should:

- **The wheel.** A wheel is not a finger and has no native counterpart. It
  goes straight to the app, as it always did.
- **The keyboard's own element.** `evg-textinput.js` owns a real DOM field so
  a phone keyboard has something to attach to, and the accessibility mirror
  publishes what the frame means. Neither has anything to do with the
  viewport.

The Worker arrangement — the page's default, with the engine off the main
thread — shares it too. The worker holds the host beside the tree, so a
press, a drag, a lift and a hover are six posts and no round trips; the page
used to `await` the worker to find out whether the scrollbar's thumb had taken
the press before it knew what kind of drag it had started.

What is left in the page on both arrangements is what the browser knows and a
host cannot: which pointers are down, and how long a move took. The second of
those goes over as a number — `panAt` takes an interval where `panBy` reads
the frame's clock, because a pointer event carries a timestamp and a touch
callback does not.
