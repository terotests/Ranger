class IDCT  {
  constructor() {
    this.cosTable = new Int32Array(64);
    this.zigzagMap = new Int32Array(64);
    this.cosTable[0] = 1024;
    this.cosTable[1] = 1004;
    this.cosTable[2] = 946;
    this.cosTable[3] = 851;
    this.cosTable[4] = 724;
    this.cosTable[5] = 569;
    this.cosTable[6] = 392;
    this.cosTable[7] = 200;
    this.cosTable[8] = 1024;
    this.cosTable[9] = 851;
    this.cosTable[10] = 392;
    this.cosTable[11] = -200;
    this.cosTable[12] = -724;
    this.cosTable[13] = -1004;
    this.cosTable[14] = -946;
    this.cosTable[15] = -569;
    this.cosTable[16] = 1024;
    this.cosTable[17] = 569;
    this.cosTable[18] = -392;
    this.cosTable[19] = -1004;
    this.cosTable[20] = -724;
    this.cosTable[21] = 200;
    this.cosTable[22] = 946;
    this.cosTable[23] = 851;
    this.cosTable[24] = 1024;
    this.cosTable[25] = 200;
    this.cosTable[26] = -946;
    this.cosTable[27] = -569;
    this.cosTable[28] = 724;
    this.cosTable[29] = 851;
    this.cosTable[30] = -392;
    this.cosTable[31] = -1004;
    this.cosTable[32] = 1024;
    this.cosTable[33] = -200;
    this.cosTable[34] = -946;
    this.cosTable[35] = 569;
    this.cosTable[36] = 724;
    this.cosTable[37] = -851;
    this.cosTable[38] = -392;
    this.cosTable[39] = 1004;
    this.cosTable[40] = 1024;
    this.cosTable[41] = -569;
    this.cosTable[42] = -392;
    this.cosTable[43] = 1004;
    this.cosTable[44] = -724;
    this.cosTable[45] = -200;
    this.cosTable[46] = 946;
    this.cosTable[47] = -851;
    this.cosTable[48] = 1024;
    this.cosTable[49] = -851;
    this.cosTable[50] = 392;
    this.cosTable[51] = 200;
    this.cosTable[52] = -724;
    this.cosTable[53] = 1004;
    this.cosTable[54] = -946;
    this.cosTable[55] = 569;
    this.cosTable[56] = 1024;
    this.cosTable[57] = -1004;
    this.cosTable[58] = 946;
    this.cosTable[59] = -851;
    this.cosTable[60] = 724;
    this.cosTable[61] = -569;
    this.cosTable[62] = 392;
    this.cosTable[63] = -200;
    this.zigzagMap[0] = 0;
    this.zigzagMap[1] = 1;
    this.zigzagMap[2] = 8;
    this.zigzagMap[3] = 16;
    this.zigzagMap[4] = 9;
    this.zigzagMap[5] = 2;
    this.zigzagMap[6] = 3;
    this.zigzagMap[7] = 10;
    this.zigzagMap[8] = 17;
    this.zigzagMap[9] = 24;
    this.zigzagMap[10] = 32;
    this.zigzagMap[11] = 25;
    this.zigzagMap[12] = 18;
    this.zigzagMap[13] = 11;
    this.zigzagMap[14] = 4;
    this.zigzagMap[15] = 5;
    this.zigzagMap[16] = 12;
    this.zigzagMap[17] = 19;
    this.zigzagMap[18] = 26;
    this.zigzagMap[19] = 33;
    this.zigzagMap[20] = 40;
    this.zigzagMap[21] = 48;
    this.zigzagMap[22] = 41;
    this.zigzagMap[23] = 34;
    this.zigzagMap[24] = 27;
    this.zigzagMap[25] = 20;
    this.zigzagMap[26] = 13;
    this.zigzagMap[27] = 6;
    this.zigzagMap[28] = 7;
    this.zigzagMap[29] = 14;
    this.zigzagMap[30] = 21;
    this.zigzagMap[31] = 28;
    this.zigzagMap[32] = 35;
    this.zigzagMap[33] = 42;
    this.zigzagMap[34] = 49;
    this.zigzagMap[35] = 56;
    this.zigzagMap[36] = 57;
    this.zigzagMap[37] = 50;
    this.zigzagMap[38] = 43;
    this.zigzagMap[39] = 36;
    this.zigzagMap[40] = 29;
    this.zigzagMap[41] = 22;
    this.zigzagMap[42] = 15;
    this.zigzagMap[43] = 23;
    this.zigzagMap[44] = 30;
    this.zigzagMap[45] = 37;
    this.zigzagMap[46] = 44;
    this.zigzagMap[47] = 51;
    this.zigzagMap[48] = 58;
    this.zigzagMap[49] = 59;
    this.zigzagMap[50] = 52;
    this.zigzagMap[51] = 45;
    this.zigzagMap[52] = 38;
    this.zigzagMap[53] = 31;
    this.zigzagMap[54] = 39;
    this.zigzagMap[55] = 46;
    this.zigzagMap[56] = 53;
    this.zigzagMap[57] = 60;
    this.zigzagMap[58] = 61;
    this.zigzagMap[59] = 54;
    this.zigzagMap[60] = 47;
    this.zigzagMap[61] = 55;
    this.zigzagMap[62] = 62;
    this.zigzagMap[63] = 63;
  }
  dezigzag (zigzag) {
    const block = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagMap[i];
      const val = zigzag[i];
      block[pos] = val;
      i = i + 1;
    };
    return block;
  };
  idct1d (input, startIdx, stride, output, outIdx, outStride) {
    let x = 0;
    while (x < 8) {
      let sum = 0;
      let u = 0;
      while (u < 8) {
        const coeff = input[(startIdx + (u * stride))];
        if ( coeff != 0 ) {
          const cosVal = this.cosTable[((x * 8) + u)];
          let contrib = coeff * cosVal;
          if ( u == 0 ) {
            contrib = ((contrib * 724) >> 10);
          }
          sum = sum + contrib;
        }
        u = u + 1;
      };
      output[outIdx + (x * outStride)] = (sum >> 11);
      x = x + 1;
    };
  };
  transform (block, output) {
    const temp = new Int32Array(64);
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.idct1d(block, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    let col = 0;
    while (col < 8) {
      this.idct1d(temp, col, 8, output, col, 8);
      col = col + 1;
    };
    let i = 0;
    while (i < 64) {
      let val = (output[i]) + 128;
      if ( val < 0 ) {
        val = 0;
      }
      if ( val > 255 ) {
        val = 255;
      }
      output[i] = val;
      i = i + 1;
    };
  };
  transformFast (coeffs, output) {
    this.transform(coeffs, output);
  };
}
