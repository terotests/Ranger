// SPDX-License-Identifier: AGPL-3.0-or-later
//
// One asset in, one view on screen.
//
// No storyboard and no scene manifest, because there is no Xcode project to
// put one in: the window is made in code, which is also the shortest path from
// "swiftc produced a binary" to "the app is on an iPad".

import UIKit

// `main.swift` names this class as a STRING, which UIKit resolves through the
// Objective-C runtime. Pinning the name means the lookup does not depend on
// what the module happens to be called.
@objc(AppDelegate)
final class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = RealTrainerViewController()
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}

final class RealTrainerViewController: UIViewController {

    private let page = RealTrainerView()

    override func loadView() {
        view = page
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // The page is the window: the demo is responsive, and lays itself out
        // at the window's size less the safe area, again on every change. So
        // there is no fit and no letterbox here — a phone gets the phone app
        // and an iPad the desktop one, as the browser does at `?page=fit`.
        page.start(
            css: RealTrainerViewController.loadText("realtrainer", "css"),
            compact: RealTrainerViewController.loadText("session", "compact"),
            plan: RealTrainerViewController.loadText("planDialog.machine", "json"),
            chat: RealTrainerViewController.loadText("chat.machine", "json"),
            seed: RealTrainerViewController.loadText("seed", "json")
        )
    }

    /// This app draws its own dark background edge to edge, so the status bar's
    /// text has to be the light one or the clock disappears into it.
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    /// A text out of the bundle. The build copies the stylesheet, the session's
    /// COMPACT, the two state machines and the reference seed in as resources
    /// — the same five texts the browser bundle embeds. A missing one comes
    /// back empty: the page still opens, unstyled or unseeded, which is a much
    /// clearer failure than a crash.
    private static func loadText(_ name: String, _ ext: String) -> String {
        guard let url = Bundle.main.url(forResource: name, withExtension: ext),
              let text = try? String(contentsOf: url, encoding: .utf8)
        else {
            NSLog("%@.%@ is not in the bundle", name, ext)
            return ""
        }
        return text
    }
}
