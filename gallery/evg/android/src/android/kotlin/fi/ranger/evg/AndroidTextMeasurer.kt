// SPDX-License-Identifier: AGPL-3.0-or-later
package fi.ranger.evg

import android.graphics.Paint
import fi.ranger.rgr.EVGDefaultMeasurer
import fi.ranger.rgr.EVGHostTextMeasurer

/**
 * Skia measures, EVG breaks the lines.
 *
 * PLAN_NATIVE_HOSTS.md S0, the Android half. `EVGHostTextMeasurer` (Ranger,
 * in the app's generated Kotlin) takes ONE function from the platform — a
 * run's width, and a face's ascent, descent and leading — and every layout
 * the app builds then measures with it. Before this the layout measured with
 * the advance table, a snapshot of one browser's sans, and
 * [AndroidEvgSurface] drew with whatever the [FaceSet] handed it: two faces,
 * and every box sized from the wrong one.
 *
 * The face is the SAME `Typeface` the surface draws with — the [FaceSet] is
 * asked with the same three arguments `drawTextRun` asks it with — so the
 * width the layout measured is the width `Canvas.drawText` puts on the
 * screen, at the size the layout named. The canvas is scaled for density and
 * zoom AFTER that, which is why a pinch stays sharp and why the measurement
 * is in the layout's own pixels rather than the panel's.
 *
 * Install once, before the app's `start`. The `Paint` is used from whatever
 * thread lays out — `gallery/ui/android` starts the page on a worker — and
 * from no other, and is guarded in case a host ever measures from two.
 */
object AndroidTextMeasurer {

    /**
     * Make the measurer, attach the platform to it and make it the default
     * every `EVGLayout` and `EVGTextEngine` in the process starts from.
     */
    fun install(faces: FaceSet): EVGHostTextMeasurer {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG)
        val measurer = EVGHostTextMeasurer()
        measurer.attach({ kind, text, family, size, bold, italic ->
            synchronized(paint) {
                paint.typeface = faces.typeface(family, bold, italic)
                paint.textSize = size.toFloat()
                when (kind) {
                    0 -> if (text.isEmpty()) 0.0 else paint.measureText(text).toDouble()
                    // `ascent` is negative on Android — the distance from
                    // the baseline UP to the top — and EVG wants it positive.
                    1 -> (-paint.fontMetrics.ascent).toDouble()
                    2 -> paint.fontMetrics.descent.toDouble()
                    else -> paint.fontMetrics.leading.toDouble()
                }
            }
        }, "android")
        EVGDefaultMeasurer.install(measurer)
        return measurer
    }
}
