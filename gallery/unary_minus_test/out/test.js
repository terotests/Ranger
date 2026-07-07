class UnaryMinusTest  {
  constructor() {
  }
  absIntWorkaround (x) {
    let dx = x;
    if ( dx < 0 ) {
      dx = 0 - dx;
    }
    return dx;
  };
}
