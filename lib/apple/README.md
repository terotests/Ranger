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
`apple_test.rgr` checks 151 things about it in this repository's CI, on Linux.

```bash
npm run apple:test
```

## What is here

| File | What it is |
| --- | --- |
| `AppleTarget.rgr` | The four decisions Xcode hides behind a scheme pop-up: the SDK, the triple, the device families, the signing identity |
| `AppleAppSpec.rgr` | The app as everything but the code — name, bundle id, sources, resources — and the Info.plist writer |
| `AppleSimulator.rgr` | Reading `xcrun simctl list devices`, as a pure function over its text |
| `AppleDevice.rgr` | The same for `xcrun devicectl list devices` — the iPhones and iPads on a cable |
| `AppleSigning.rgr` | Finding the identity and the `.mobileprovision`, so nobody types them |
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

**A simulator target is all `runOnSimulator` takes.** A device goes through
`runOnDevice`, below; asking either for the other is an error that names it
rather than installing nowhere.

## Putting it on a real iPhone or iPad

`AppleAppBuilder.runOnDevice(spec target nameWanted attach)` is two commands,
where a simulator needs five — there is nothing to boot and no window to bring
forward:

```
xcrun devicectl device install app --device <id> build/ios-device/MyApp.app
xcrun devicectl device process launch --device <id> --terminate-existing com.example.myapp
```

`attach` swaps `--terminate-existing` for `--console` and keeps the process in
the foreground with its output coming back, which is the whole point of a test
build on a cable: a device has no console you can otherwise see.

`nameWanted` is a substring of the device name or the identifier `devicectl`
assigns; `""` takes the first **connected** device. A paired-but-absent one is
listed by `devicectl` and is not a candidate — installing onto it fails four
seconds later, and saying which is why is better than that.

### The three things it needs, and where they come from

`AppleSigning` finds all three, so a device build is one command rather than
three flags. `--identity` and `--profile` still win when given.

* **The identity** — `security find-identity -v -p codesigning`, preferring an
  **Apple Development** certificate. This is testing on a cable; a distribution
  certificate cannot do it.
* **The profile** — the `.mobileprovision` files Xcode leaves behind, in both
  the directory it used before Xcode 16 and the one it uses now. A profile is a
  candidate when its `application-identifier` covers the bundle id (an exact
  one beats a wildcard, because the exact one is what Xcode made for this app)
  **and** its `ProvisionedDevices` names this device.
* **The entitlements** — read out of the profile that was chosen, never written
  by hand. A bundle signed with entitlements its profile does not grant
  installs and then refuses to launch, with no message anyone can act on.

A `.mobileprovision` is a CMS envelope around a plist, so reading one is
`security cms -D` and then `plutil -extract` — two tools and no plist parser.

**What it cannot do is CREATE a profile.** That is a conversation with Apple's
developer portal, and the only command line tool that has it is `xcodebuild
-allowProvisioningUpdates`, which is what this directory exists to avoid. Open
the project in Xcode once and build to the device; after that the profile is on
the machine and this finds it. The error says exactly that.

`devicectl` needs Xcode 15 or later. An older toolchain needs a third-party
installer, which this does not wrap, and the error says so rather than failing
inside a tool that is not there.

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

151 checks, on JavaScript, Python, Go, Rust, C++, Java and PHP — the same Ranger
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

...and onto the phone on the cable, with nothing typed that can be found:

```ranger
def signing:AppleSigning (new AppleSigning (sh))
def target:AppleTarget (AppleTarget.iosDevice("-"))

def udid:string ""
def devOpt@(optional):AppleDeviceInfo (tools.pickDevice(""))
if (!null? devOpt) {
    def dev:AppleDeviceInfo (unwrap devOpt)
    udid = dev.identifier
}

def ids:[AppleSigningIdentity] (signing.findIdentities())
def idOpt@(optional):AppleSigningIdentity (AppleSigning.pickIdentity(ids ""))
def profOpt@(optional):AppleProvisioningProfile (signing.pickProfile(spec.bundleId udid "build/ios-device"))
if ((!null? idOpt) && (!null? profOpt)) {
    def id:AppleSigningIdentity (unwrap idOpt)
    def prof:AppleProvisioningProfile (unwrap profOpt)
    target.signIdentity = id.sha1
    spec.provisioningProfile = prof.path
    def built:AppleBuildResult (builder.build(spec target))
    if built.ok {
        builder.runOnDevice(spec target "" false)
    }
}
```

Every intermediate is bound rather than chained, and that is not style: a call
result that is immediately dereferenced loses an argument (ISSUES.md #85) and a
`(expr).field` read as a call argument does not resolve (#81). Both examples
above compile and run — they are checked, not written from memory.

A worked example, end to end, is
[`gallery/ui/ios`](../../gallery/ui/ios/README.md): the dashboard demo as an
iPhone, iPad and Apple Watch app.

## What is not here

* **`xcodebuild`.** Deliberately. If you have a project file, use it; this is
  for the case where you would rather not have one.
* **An asset catalog pipeline.** `AppleToolchain.compileAssets` wraps `actool`,
  and nothing calls it yet — an app with no icon builds and runs.
* **App Store packaging.** No `.ipa`, no `exportOptions.plist`, no upload.
* **Creating a provisioning profile.** Found, matched and used; not created —
  see above.
* **Wireless device install.** `devicectl` can do it and this asks for the
  device it is given, so a device paired over the network works if `devicectl`
  reports it `connected`. Nothing here pairs one.
