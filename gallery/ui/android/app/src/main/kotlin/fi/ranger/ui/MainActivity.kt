package fi.ranger.ui

import android.app.Activity
import android.os.Bundle
import android.widget.Toast

/**
 * The Android host: one asset in, one [DashboardView] on screen.
 *
 * There is no dashboard code in this file, and none anywhere else in this
 * directory. The controllers, the stylesheet cascade, the flex layout, the
 * virtualised table, the Vega runtime that draws the chart and the page itself
 * are all `gallery/ui` and `gallery/evg`, compiled to Kotlin — the same source
 * the browser demo and the gates run.
 *
 * The one asset is the demo's own stylesheet. It is read rather than compiled
 * in for the same reason the browser build generates a module from it: the page
 * and everything that checks the page have to be styled from the same text, and
 * a copy is a thing that drifts.
 */
class MainActivity : Activity() {

    private lateinit var view: DashboardView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        view = DashboardView(this)
        // Hardware-accelerated, which is the default and is deliberately left
        // alone: on Android the accelerated `Canvas` IS the GPU path — Skia
        // draws it through Ganesh/Vulkan — and it brings glyph rasterisation,
        // path filling and antialiasing with it.
        view.css = readAsset("dashboard.css")
        if (view.css.isEmpty()) {
            Toast.makeText(this, "dashboard.css is missing from the assets", Toast.LENGTH_LONG).show()
        }
        setContentView(view)
        title = "Ranger EVG — dashboard"
    }

    private fun readAsset(name: String): String =
        runCatching { assets.open(name).use { it.readBytes().toString(Charsets.UTF_8) } }.getOrDefault("")
}
