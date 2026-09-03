// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The entry point, written out rather than left to `@main`.
//
// `@main` on a `UIApplicationDelegate` works and is what Xcode templates use.
// This build has no Xcode project and hands swiftc a list of files, and a
// `main.swift` is the form that behaves the same way on every toolchain that
// list has been given to — including one where the generated Ranger file grows
// a top-level declaration that `@main` would then argue with.

import UIKit

// `CommandLine.unsafeArgv` is already the `UnsafeMutablePointer<
// UnsafeMutablePointer<Int8>?>` this wants, so the memory-rebinding dance the
// older examples do is not needed. It never returns; the assignment is only
// there so the unused result is not a warning.
_ = UIApplicationMain(
    CommandLine.argc,
    CommandLine.unsafeArgv,
    nil,
    NSStringFromClass(AppDelegate.self)
)
