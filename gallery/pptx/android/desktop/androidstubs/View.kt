// Compile-time stub. See AndroidStubs.kt.
@file:Suppress("UNUSED_PARAMETER", "unused")

package android.view

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet

open class View(context: Context, attrs: AttributeSet? = null) {
    companion object {
        const val LAYER_TYPE_NONE = 0
        const val LAYER_TYPE_SOFTWARE = 1
        const val LAYER_TYPE_HARDWARE = 2
    }

    val width: Int = 0
    val height: Int = 0
    val resources: android.content.res.Resources = context.resources

    fun setLayerType(layerType: Int, paint: android.graphics.Paint?) {}
    open fun invalidate() {}
    open fun postInvalidateOnAnimation() {}
    protected open fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {}
    protected open fun onDraw(canvas: Canvas) {}
    open fun onTouchEvent(event: MotionEvent): Boolean = false
}

class MotionEvent {
    companion object {
        const val ACTION_DOWN = 0
        const val ACTION_UP = 1
        const val ACTION_MOVE = 2
        const val ACTION_CANCEL = 3
    }

    val x: Float = 0f
    val y: Float = 0f
    val actionMasked: Int = 0
}

class GestureDetector(context: Context, listener: OnGestureListener) {
    interface OnGestureListener

    open class SimpleOnGestureListener : OnGestureListener {
        open fun onDown(e: MotionEvent): Boolean = false
        open fun onSingleTapUp(e: MotionEvent): Boolean = false
        open fun onDoubleTap(e: MotionEvent): Boolean = false
        open fun onScroll(e1: MotionEvent?, e2: MotionEvent, distanceX: Float, distanceY: Float): Boolean = false
        open fun onFling(e1: MotionEvent?, e2: MotionEvent, velocityX: Float, velocityY: Float): Boolean = false
    }

    fun onTouchEvent(event: MotionEvent): Boolean = false
}

class ScaleGestureDetector(context: Context, listener: OnScaleGestureListener) {
    interface OnScaleGestureListener

    open class SimpleOnScaleGestureListener : OnScaleGestureListener {
        open fun onScale(detector: ScaleGestureDetector): Boolean = false
    }

    val scaleFactor: Float = 1f
    val focusX: Float = 0f
    val focusY: Float = 0f
    fun onTouchEvent(event: MotionEvent): Boolean = false
}

interface Menu {
    fun add(groupId: Int, itemId: Int, order: Int, title: CharSequence): MenuItem
}

interface MenuItem {
    val itemId: Int
}
