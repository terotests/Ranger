package fi.ranger.ui

import android.app.Activity
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
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

    /**
     * One item, and it is the ripple.
     *
     * The effect is the one thing here that can cost more than it is worth: it
     * is a shader over every pixel of the page, and a machine without a real GPU
     * under it — an emulator, most of all — pays for that in frames. The view
     * turns it off by itself when the frames say so; this is how a person turns
     * it off before that, or back on to see whether it was the effect at all.
     */
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_RIPPLE, 0, rippleLabel())
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId != MENU_RIPPLE) return super.onOptionsItemSelected(item)
        view.rippleAffordable = !view.rippleAffordable
        Toast.makeText(this, rippleLabel(), Toast.LENGTH_SHORT).show()
        invalidateOptionsMenu()
        return true
    }

    private fun rippleLabel(): String =
        if (view.rippleAffordable) "Surface ripple: on" else "Surface ripple: off"

    private fun readAsset(name: String): String =
        runCatching { assets.open(name).use { it.readBytes().toString(Charsets.UTF_8) } }.getOrDefault("")

    private companion object {
        const val MENU_RIPPLE = 1
    }
}
