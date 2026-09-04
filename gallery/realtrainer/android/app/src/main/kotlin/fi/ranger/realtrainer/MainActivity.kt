package fi.ranger.realtrainer

import android.app.Activity
import android.os.Bundle
import android.widget.Toast

/**
 * The Android host: five assets in, one [RealTrainerView] on screen.
 *
 * There is no RealTrainer code in this file, and none anywhere else in this
 * directory. The shell, the diary, the COMPACT parser, the state machines, the
 * statistics and the Vela runtime that draws them are all `gallery/realtrainer`
 * and `gallery/evg`, compiled to Kotlin — the same source the browser demo
 * and the gates run.
 *
 * The five assets are the same five texts the browser bundle embeds and the
 * iOS build copies in as resources: the stylesheet, the session's COMPACT, the
 * two state machines and the reference seed. They are read rather than
 * compiled in for the same reason the browser build generates a module from
 * them: the page and everything that checks the page have to open from the
 * same text, and a copy is a thing that drifts.
 */
class MainActivity : Activity() {

    private lateinit var view: RealTrainerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        view = RealTrainerView(this)
        view.css = readAsset("realtrainer.css")
        view.compact = readAsset("session.compact")
        view.plan = readAsset("planDialog.machine.json")
        view.chat = readAsset("chat.machine.json")
        view.seed = readAsset("seed.json")
        if (view.css.isEmpty()) {
            Toast.makeText(this, "realtrainer.css is missing from the assets", Toast.LENGTH_LONG).show()
        }
        setContentView(view)
        title = "RealTrainer"
    }

    /** A missing asset comes back empty: the page still opens, unstyled or unseeded. */
    private fun readAsset(name: String): String =
        runCatching { assets.open(name).use { it.readBytes().toString(Charsets.UTF_8) } }.getOrDefault("")
}
