package fi.ranger.evg

import android.graphics.RenderEffect
import android.graphics.RuntimeShader
import android.os.Build
import android.util.Log
import android.view.View
import fi.ranger.rgr.EVGDisplayList

/**
 * `evg-surface-effect: ripple`, on Android, as an AGSL post-process.
 *
 * The effect is not a command in the display list and cannot be: it is a pass
 * over the FINISHED pixels, which is why the WebGL host renders the page to a
 * texture and then draws that texture through a fragment shader. An
 * `android.graphics.Canvas` has no such stage — which is why this port shipped
 * without the ripple and said so — but a `RuntimeShader` does. At API 33 the
 * platform hands Skia's own shading language to an app, and
 * `RenderEffect.createRuntimeShaderEffect` wires it into exactly that place:
 * the view is rendered into a texture, the texture is bound to a named
 * `uniform shader`, and the program below decides every pixel on screen.
 *
 * So the shader is a translation of `gallery/evg/gl/evg-webgl.js`'s
 * `RIPPLE_FRAG` and not a second effect that has to be kept looking like the
 * first one. Two things are genuinely different, and both are simplifications:
 *
 *  * **No flips.** A GL texture's origin is the bottom left and the page's is
 *    the top left, which cost the WebGL host two sign errors worth the comments
 *    it now carries. A view's coordinate space runs y-down like the page, so
 *    nothing is negated here.
 *  * **No `dFdx`.** AGSL has no screen-space derivatives, so the height field's
 *    gradient — which is where the glint comes from — is taken by evaluating
 *    the wave one page pixel away and subtracting, rather than by asking the
 *    hardware. Two extra evaluations of a loop that runs a handful of times.
 *
 * Below API 33 this is a no-op and the page draws exactly as it did.
 */
class RippleEffect(private val view: View) {

    private var shader: RuntimeShader? = null
    private var applied = false
    /** A program that will not compile is reported once, not every frame. */
    private var broken = false

    /** True when the platform can run this at all. */
    val available: Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

    /**
     * Put the current touches on screen, or take the effect off when there are
     * none left.
     *
     * `list` is only read for the effect's PARAMETERS — they come off the
     * stylesheet and are stamped onto every display list — while the drops are
     * passed separately, because a ripple frame must not cost a rebuilt page:
     * ageing a touch changes nothing about what was drawn.
     *
     * `drops` is x, y, age per touch, in page pixels and seconds, oldest first.
     * `scale` is device pixels per page pixel and `panX` is how far the page is
     * scrolled sideways — together they are how a page coordinate becomes a
     * coordinate this shader is asked about.
     */
    fun update(list: EVGDisplayList, drops: FloatArray, count: Int, scale: Float, panX: Float) {
        if (!available || broken) return
        if (list.effectKind != "ripple" || count <= 0) {
            clear()
            return
        }
        val s = shaderOrNull() ?: return
        val n = if (count > MAX_DROPS) MAX_DROPS else count
        // The array is always the full eight: a uniform array is sized by its
        // declaration, and handing it a short one is an argument error rather
        // than a partial update.
        val packed = FloatArray(MAX_DROPS * 3)
        for (i in 0 until n) {
            packed[i * 3] = drops[i * 3]
            packed[i * 3 + 1] = drops[i * 3 + 1]
            packed[i * 3 + 2] = drops[i * 3 + 2]
        }
        try {
            s.setFloatUniform("uDrops", packed)
            s.setIntUniform("uCount", n)
            s.setFloatUniform("uScale", if (scale > 0f) scale else 1f)
            s.setFloatUniform("uPanX", panX)
            s.setFloatUniform("uSpeed", list.effectSpeed.toFloat())
            s.setFloatUniform("uWidth", maxOf(list.effectWidth.toFloat(), 0.001f))
            s.setFloatUniform("uStrength", list.effectStrength.toFloat())
            s.setFloatUniform("uDecay", list.effectDecay.toFloat())
            s.setFloatUniform("uHi", list.effectHighlight.toFloat())
            s.setIntUniform("uRings", list.effectRings.toInt().coerceIn(1, MAX_RINGS))
            s.setFloatUniform("uStagger", list.effectStagger.toFloat())
            s.setFloatUniform("uFalloff", list.effectFalloff.toFloat())
            s.setFloatUniform("uShine", list.effectShine.toFloat())
            s.setFloatUniform("uGloss", maxOf(list.effectGloss.toFloat(), 1f))
            s.setFloatUniform("uBump", list.effectBump.toFloat())
            s.setFloatUniform(
                "uLight",
                list.effectLightX.toFloat(),
                list.effectLightY.toFloat(),
                list.effectLightZ.toFloat(),
            )
            view.setRenderEffect(RenderEffect.createRuntimeShaderEffect(s, "uContent"))
            applied = true
        } catch (e: Throwable) {
            // A uniform this platform will not take is worth exactly one line
            // in the log and then silence: the page is still drawn, it just is
            // not rippling.
            broken = true
            clear()
            Log.w(TAG, "ripple uniforms rejected, effect off: " + e)
        }
    }

    /** Off, and cheaply: a view with a render effect is composited off-screen. */
    fun clear() {
        if (!applied) return
        applied = false
        view.setRenderEffect(null)
    }

    private fun shaderOrNull(): RuntimeShader? {
        shader?.let { return it }
        return try {
            val s = RuntimeShader(AGSL)
            shader = s
            s
        } catch (e: Throwable) {
            broken = true
            Log.w(TAG, "AGSL would not compile, ripple off: " + e)
            null
        }
    }

    private companion object {
        const val TAG = "EvgRipple"

        /**
         * Eight touches is not a number anybody reaches by tapping; it is what
         * a finger dragged across the surface fills in a third of a second, and
         * the oldest is retired to make room. Five rings is one touch's train.
         */
        const val MAX_DROPS = 8
        const val MAX_RINGS = 5

        val AGSL = """
uniform shader uContent;
uniform float3 uDrops[8];   // x, y in PAGE pixels; z is seconds since the touch
uniform int uCount;
uniform float uScale;       // device pixels per page pixel
uniform float uPanX;        // page pixels scrolled sideways
uniform float uSpeed;       // page px per second the ring travels
uniform float uWidth;       // the envelope's sigma, page px
uniform float uStrength;    // displacement at the crest, page px
uniform float uDecay;       // per second
uniform float uHi;          // how much the crest lightens
uniform int uRings;
uniform float uStagger;     // seconds between one wavefront and the next
uniform float uFalloff;     // what each ring behind the front is worth
uniform float uShine;       // how strong the glint is
uniform float uGloss;       // Blinn-Phong exponent: how tight it is
uniform float uBump;        // what turns the height field into a slope
uniform float3 uLight;      // where the light is, not necessarily normalised

// The wave sum at one page point: the displacement as a VECTOR, the crest, and
// the envelope. Summing the displacement rather than an amplitude is the whole
// of the interference — two rings arriving from opposite sides push the surface
// in opposite directions and the pixel between them stays where it was.
float4 waveAt(float2 p) {
    float2 push = float2(0.0, 0.0);
    float crest = 0.0;
    float energy = 0.0;
    for (int i = 0; i < 8; i++) {
        if (i >= uCount) { break; }
        float3 drop = uDrops[i];
        float2 delta = p - drop.xy;
        float d = length(delta);
        float2 dir = delta / max(d, 0.001);
        float amp = 1.0;
        // The TRAIN. A drop on water does not make one ring, it makes several
        // from the same point a moment apart, each fainter than the one in
        // front. They cost no state: the k-th is this touch aged by k staggers,
        // and one that has not started yet has a negative age and is skipped.
        for (int k = 0; k < 5; k++) {
            if (k >= uRings) { break; }
            float t = drop.z - float(k) * uStagger;
            if (t <= 0.0) { break; }
            float radius = t * uSpeed;
            // A Gaussian ring: the wave only exists near the front, so the rest
            // of the page is sampled where it was drawn and stays sharp.
            float e = (d - radius) / uWidth;
            float env = exp(-e * e);
            float fade = env * exp(-t * uDecay) * amp;
            float w = sin((d - radius) * 0.16) * fade;
            push = push + dir * w;
            crest = crest + w;
            // The envelope, kept apart from the signal: it is the amplitude
            // with the oscillation divided out, so unlike the wave itself it
            // does not pass through zero twice per wavelength.
            energy = energy + fade;
            amp = amp * uFalloff;
        }
    }
    return float4(push.x, push.y, crest, energy);
}

half4 main(float2 fragCoord) {
    // Device pixels to page pixels. Both spaces run y DOWN — the flips the
    // WebGL host needs are a GL texture's business, not a view's.
    float2 p = float2(fragCoord.x / uScale + uPanX, fragCoord.y / uScale);
    float4 w = waveAt(p);

    // Back to device pixels to sample with.
    float2 offset = w.xy * uStrength * uScale;

    // A whisper of chromatic aberration along the crest. 1.08 and 0.92 rather
    // than anything bolder: past about a tenth the page stops looking like
    // water and starts looking like a filter.
    float r = uContent.eval(fragCoord + offset * 1.08).r;
    float g = uContent.eval(fragCoord + offset).g;
    float b = uContent.eval(fragCoord + offset * 0.92).b;
    float a = uContent.eval(fragCoord + offset).a;

    // THE SURFACE'S OWN NORMAL. The wave sum is a height field, its gradient is
    // the slope, and the slope is the normal — so nothing has to be stored to
    // light this that the displacement did not already need. AGSL has no
    // dFdx/dFdy, so the gradient is a finite difference one PAGE pixel away,
    // divided by the scale to be the per-device-pixel slope the WebGL host's
    // derivative gives it.
    float wx = waveAt(p + float2(1.0, 0.0)).z - w.z;
    float wy = waveAt(p + float2(0.0, 1.0)).z - w.z;
    float2 grad = float2(wx, wy) * uBump / max(uScale, 0.001);
    float3 N = normalize(float3(-grad.x, -grad.y, 1.0));

    // Blinn-Phong. The eye looks straight down at a flat page, so V is +Z.
    float3 L = normalize(uLight);
    float3 V = float3(0.0, 0.0, 1.0);
    float3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), uGloss) * uShine;

    // The specular lives on the FLANK of a wave rather than its top, which is
    // why the glint slides along the ring as the ring travels. It is faded out
    // where there is no ring — by the ENVELOPE, not by the wave, which crosses
    // zero twice per wavelength and would cut a dark seam through every glint.
    float alive = clamp(w.w * 3.0, 0.0, 1.0);

    float3 col = float3(r, g, b) + float3(w.z * uHi + spec * alive);
    return half4(half3(col), half(a));
}
""".trimIndent()
    }
}
