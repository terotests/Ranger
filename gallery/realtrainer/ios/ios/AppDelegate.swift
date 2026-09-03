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
        // Which fit, and the only platform-specific decision in this port. The
        // page is a 980x760 composition: on an iPad that shape is close enough
        // to the window that showing all of it costs little, and on a phone it
        // is not — a 19.5:9 window leaves about 40% of the screen empty and
        // halves the size of the text. A phone spends the whole width on the
        // page and lets the reader move down it. The arithmetic for both is in
        // `rt_ios.rgr`, where check_rt_ios.rgr drives it; only this choice
        // needs to know what kind of device it is on.
        if traitCollection.userInterfaceIdiom == .phone {
            page.app.useFillWidth()
        }
        page.start(css: RealTrainerViewController.loadStylesheet())
    }

    /// This app draws its own dark background edge to edge, so the status bar's
    /// text has to be the light one or the clock disappears into it.
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    /// The demo's own stylesheet, out of the bundle. The build copies
    /// `gallery/realtrainer/web/realtrainer.css` in as a resource; if it is
    /// missing the page still lays out, unstyled, which is a much clearer
    /// failure than a crash.
    private static func loadStylesheet() -> String {
        guard let url = Bundle.main.url(forResource: "realtrainer", withExtension: "css"),
              let text = try? String(contentsOf: url, encoding: .utf8)
        else {
            NSLog("realtrainer.css is not in the bundle — the page will be unstyled")
            return ""
        }
        return text
    }
}
