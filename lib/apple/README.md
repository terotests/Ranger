# `lib/apple` — building an Apple app from Ranger, with no Xcode project

**License: MIT.** Nothing here imports `gallery/`.

An iOS, iPadOS or watchOS app is a directory with an executable in it and a
property list explaining that executable to the system. Xcode assembles both
from a project file, a target, a scheme and a build settings sheet. None of
that is required: `swiftc` can build an iOS executable directly, and everything
above it is bookkeeping a program can do instead.

This is that program's library. It drives Apple's own command line tools —
`xcrun`, `swiftc`, `plutil`, `codesign`, `simctl`, `security`, `actool` — over
[`lib/Shell.rgr`](../Shell.rgr), which means the whole thing can be run **dry**:
every decision made, every command line recorded, nothing executed. That is what
makes an Apple build testable on a machine that is not a Mac, and it is how
`apple_test.rgr` checks 99 things about it in this repository's CI, on Linux.

```bash
npm run apple:test
```

## What is here

| File | What it is |
| --- | --- |
| `AppleTarget.rgr` | The four decisions Xcode hides behind a scheme pop-up: the SDK, the triple, the device families, the signing identity |
| `AppleAppSpec.rgr` | The app as everything but the code — name, bundle id, sources, resources — and the Info.plist writer |
| `AppleSimulator.rgr` | Reading `xcrun simctl list devices`, as a pure function over its text |
| `AppleToolchain.rgr` | `xcrun` and the tools it resolves, as methods |
| `AppleAppBuilder.rgr` | The pipeline: SDK, bundle, plist, swiftc, resources, signing — then boot, install, launch |
| `apple_test.rgr` | All of the above, checked without a Mac |

## The pipeline

```
   AppleAppSpec  +  AppleTarget
          │
          ├─ 1  xcrun --sdk NAME --show-sdk-path        where the SDK is
          ├─ 2  Info.plist                              written, then plutil -lint
          ├─ 3  xcrun --sdk NAME swiftc -target …       one executable, whole-module
          ├─ 4  cp -R                                   resources into the bundle
          ├─ 5  security cms -D  /  plutil -extract     a device build's entitlements
          └─ 6  codesign --force --sign                 "-" for a simulator
                    │
          ┌─────────┴──────────┐
   xcrun simctl boot / install / launch      xcrun devicectl device install app
```

Nothing in that list is `xcodebuild`, and nothing in it is an `.xcodeproj`.

## Putting it on a simulator

`AppleAppBuilder.runOnSimulator(spec target nameWanted)` is the second half, and
it is five commands:

```
xcrun simctl boot <udid>
open -a Simulator
xcrun simctl bootstatus <udid>
xcrun simctl install <udid> build/ios-simulator/MyApp.app
xcrun simctl launch --terminate-running-process <udid> com.example.myapp
```

Three of those are there for reasons that are not obvious until the day they
are missing:

* **`open -a Simulator`** — `simctl boot` starts the *device*, not the
  application that shows it. Without this the app is running and there is no
  window, which looks exactly like a build that did nothing.
* **`bootstatus`** — installing into a device that is still starting fails
  intermittently, which is the worst kind of failure to debug.
* **`--terminate-running-process`** — so a second run replaces the first
  instead of appearing to do nothing.

`boot` is skipped when the device is already `Booted`, and a
`Unable to boot device in current state: Booted` race with something else is
read as success rather than as an error.

**Which device.** `nameWanted` is a substring of a device name (`"iPad Pro"`,
`"iPhone 15"`) or a UDID. Given `""`, a device that is **already booted** wins:
booting a second simulator when one is open is slow and puts the app on a
window nobody is looking at. Given a name, the named one wins even over a
booted one — you asked for an iPad, you get the iPad. A name that matches
nothing is an error naming it, not a fallback to something else.

**A real device is built and not launched.** `runOnSimulator` refuses a device
target — naming it — rather than booting something unrelated. Installing on one
is `AppleToolchain.installOnDevice`, wrapping `xcrun devicectl`; the driver in
`gallery/ui/ios` prints that command to finish with instead of running it,
because the step needs a cable and a trusted machine.

## The four decisions, and why each one is its own field

```ranger
def target:AppleTarget (AppleTarget.iosSimulator("arm64"))
print (target.describe())
; ios-simulator (arm64-apple-ios15.0-simulator, sdk iphonesimulator, iPhone + iPad)
```

**The SDK** is what `xcrun --sdk` resolves and what `swiftc` compiles against.

**The triple** carries the architecture, the platform, the **deployment target**
and — for a simulator — the `-simulator` environment. Leaving that environment
off produces a device build that links and will not run on the simulator, with
no error that says so.

**The families** are one number list in Info.plist, and the only difference
between "an iPhone app" and "an iPad app" once the binary exists. A watch app is
its own family and its own kind of bundle: `WKApplication` and `WKWatchOnly`,
no `UIDeviceFamily`, no launch screen.

**Signing** is `-` for a simulator, which needs no developer account, no
keychain and no profile. A device build needs an identity and a
`.mobileprovision`, and the builder reads the entitlements OUT OF the profile
rather than letting a caller write them by hand — a bundle signed with
entitlements its profile does not grant installs and then refuses to launch,
with no message anyone can act on.

## What the tests check, and why they are worth having

`apple_test.rgr` runs no Apple tool. It checks the part of a build driver that
has bugs in it: **which program, with which arguments, in which order.**

* the triples, for all four targets and both host architectures
* the plist: the executable key, the escaping, the launch screen an iPad needs,
  the watch's `WKApplication`, and the keys each one must NOT have
* the simulator listing, against a fixture with the two traps in it — a device
  name that contains brackets (`iPhone SE (3rd generation)`) and a runtime
  marked unavailable
* which device gets picked: booted beats not-booted, named beats booted
* the whole plan for an iPhone, a watch and a device, including that the plist
  is linted **before** an hour of compiling and that signing is **last**
* that a path with a space in it survives into the log quoted

99 checks, on JavaScript, Python, Go, Rust, C++, Java and PHP — the same Ranger
source, run on seven runtimes.

## Using it

```ranger
Import "lib/Shell.rgr"
Import "lib/apple/AppleAppBuilder.rgr"

def sh:Shell (new Shell)
sh.dryRun = false
def tools:AppleToolchain (new AppleToolchain (sh))
def builder:AppleAppBuilder (new AppleAppBuilder (sh tools))

def spec:AppleAppSpec (new AppleAppSpec)
spec.name = "MyApp"
spec.bundleId = "com.example.myapp"
spec.addSource("generated/app.swift")
spec.addSource("host/Main.swift")

def target:AppleTarget (AppleTarget.iosSimulator((tools.hostArch())))
def res:AppleBuildResult (builder.build(spec target))
if res.ok {
    builder.runOnSimulator(spec target "iPad Pro")
}
```

A worked example, end to end, is
[`gallery/ui/ios`](../../gallery/ui/ios/README.md): the dashboard demo as an
iPhone, iPad and Apple Watch app.

## What is not here

* **`xcodebuild`.** Deliberately. If you have a project file, use it; this is
  for the case where you would rather not have one.
* **An asset catalog pipeline.** `AppleToolchain.compileAssets` wraps `actool`,
  and nothing calls it yet — an app with no icon builds and runs.
* **App Store packaging.** No `.ipa`, no `exportOptions.plist`, no upload.
* **Installing on a real device.** `devicectl` is wrapped; the builder prints
  the command rather than running it, because it needs a cable and a trusted
  machine.
