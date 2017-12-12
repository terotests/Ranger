class Vec2 {
  def x:double 0.0
  def y:double 0.0
  sfn CreateNew:Vec2 (i:double j:double) {
      def v (new Vec2)
      v.x = i
      v.y = j
      return v
  }
}

class Mat2 {
  def m0 1.0
  def m1 0.0
  def m2 0.0
  def m3 1.0
  def m4 0.0
  def m5 0.0

  fn toIdentity () {
      m0 = 1.0
      m1 = 0.0
      m2 = 0.0
      m3 = 1.0
      m4 = 0.0
      m5 = 0.0
  }
  fn setTranslate( tx:double ty:double ) {
      m4 = tx
      m5 = ty
  }
  fn setScale( sx:double sy:double ) {
      m1 = sx
      m3 = sy
  }
  fn setSkewX ( v:double ) {
      m0 = 1.0
      m1 = 0.0
      m2 = (tan v)
      m3 = 1.0
      m4 = 0.0
      m5 = 0.0
  }
  fn setSkewY ( v:double ) {
      m0 = 1.0
      m1 = (tan v)
      m2 = 0.0
      m3 = 1.0
      m4 = 0.0
      m5 = 0.0
  }
  fn setRotation( v:double ) {
      def cs (cos v)
      def sn (sin v)
      m0 = cs
      m1 = sn
      m2 = -1.0 * sn
      m3 = cs
      m4 = 0.0
      m5 = 0.0
  }
  fn multiply ( b:Mat2 ) {
      def t0 (m0*b.m0 + m1 * b.m2)
      def t2 (m2*b.m0 + m3 * b.m2)
      def t4 (m4*b.m0 + m5 * b.m2 + b.m4)

      m1 = (m0 * b.m1 + m1 * b.m3)
      m3 = (m2 * b.m1 + m3 * b.m3)
      m5 = (m4 * b.m1 + m5 * b.m3 + b.m5)
      m0 = t0
      m2 = t2
      m4 = t4
  }
  fn inverse:Mat2 () {
      def invdet ( m0 * m3 - m2 * m1 )
      def det invdet
      if( (det > -0.0001) && (det < 0.0001)) {
          this.toIdentity()
          return this
      }
      invdet = 1.0 / det
      def inv (new Mat2)
      inv.m0 = m3 * invdet
      inv.m2 = -1.0 * m2 * invdet
      inv.m4 = m2 * m5 - m3 * m4 * invdet
      inv.m1 = -1.0 * m1 * invdet
      inv.m3 = m0 * invdet
      inv.m5 = m1 * m4 - m0 * m5 * invdet
      return inv
  }
  fn transformPoint:Vec2 ( v:Vec2 ) {
      def res (new Vec2)
      res.x = ( v.x * m0 + v.y * m2 + m4)
      res.y = ( v.x * m1 + v.y * m3 + m5)
      return res
  }
  fn rotateVector:Vec2 ( v:Vec2 ) {
      def res (new Vec2)
      res.x = ( v.x * m0 + v.y * m2 )
      res.y = ( v.x * m1 + v.y * m3 )
      return res
  }
}