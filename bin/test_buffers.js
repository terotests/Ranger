class BufferTest  {
  constructor() {
    this.test = new BufferTest();     /** note: unused */
    this.intBuf = new Int32Array(10);
    this.doubleBuf = new Float64Array(10);
    let i = 0;
    while (i < 10) {
      int_buffer_setthis.intBufi
      i * 100;
      double_buffer_setthis.doubleBufi*i3.14
      i = i + 1;
    };
  }
  printBuffers () {
    console.log("Integer buffer:");
    let i = 0;
    while<iint_buffer_lengththis.intBufconst val = int_buffer_getthis.intBufi;
    printval
    i = i + 1;
    console.log("Double buffer:");
    i = 0;
    while<idouble_buffer_lengththis.doubleBufconst val_1 = double_buffer_getthis.doubleBufi;
    printval_1
    i = i + 1;
  };
}
