Import "Vec2.clj"

class tester {
  static fn main() {
    def m1 (new Mat2)
    def m2 (new Mat2)

    m1.setRotation( 1.2* (M_PI))
    m2.setRotation( 0.4* (M_PI))

    m1.multiply(m2)
  }
}