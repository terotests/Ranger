// Compile-time stub. See AndroidStubs.kt.
package android.annotation

@Target(
    AnnotationTarget.FUNCTION,
    AnnotationTarget.PROPERTY,
    AnnotationTarget.CLASS,
    AnnotationTarget.VALUE_PARAMETER,
)
annotation class SuppressLint(vararg val value: String)
