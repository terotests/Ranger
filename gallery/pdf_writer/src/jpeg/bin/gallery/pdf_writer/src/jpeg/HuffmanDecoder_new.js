class HuffmanTable  {
  constructor() {
    this.bits = new Int32Array(16);
    this.values = [];
    this.maxCode = new Int32Array(16);
    this.minCode = new Int32Array(16);
    this.valPtr = new Int32Array(16);
    this.tableClass = 0;
    this.tableId = 0;
    let i = 0;
    while (i < 16) {
      this.bits[i] = 0;
      this.maxCode[i] = -1;
      this.minCode[i] = 0;
      this.valPtr[i] = 0;
      i = i + 1;
    };
  }
  build () {
    let code = 0;
    let valueIdx = 0;
    let i = 0;
    while (i < 16) {
      const count = this.bits[i];
      if ( count > 0 ) {
        this.minCode[i] = code;
        this.valPtr[i] = valueIdx;
        valueIdx = valueIdx + count;
        code = code + count;
        this.maxCode[i] = code - 1;
      } else {
        this.maxCode[i] = -1;
        this.minCode[i] = 0;
        this.valPtr[i] = valueIdx;
      }
      code = (code << 1);
      i = i + 1;
    };
  };
  decode (reader) {
    let code = 0;
    let length = 0;
    while (length < 16) {
      const bit = reader;
      code = (((code << 1)) | bit);
      const maxC = this.maxCode[length];
      if ( maxC >= 0 ) {
        if ( code <= maxC ) {
          const minC = this.minCode[length];
          const ptr = this.valPtr[length];
          const idx = ptr + (code - minC);
          return this.values[idx];
        }
      }
      length = length + 1;
    };
    console.log("Huffman decode error: code not found");
    return 0;
  };
  resetArrays () {
    let i = 0;
    while (i < 16) {
      this.bits[i] = 0;
      this.maxCode[i] = -1;
      this.minCode[i] = 0;
      this.valPtr[i] = 0;
      i = i + 1;
    };
    this.values.length = 0;
  };
}
class HuffmanDecoder  {
  constructor() {
    this.dcTable0 = new HuffmanTable();
    this.dcTable1 = new HuffmanTable();
    this.acTable0 = new HuffmanTable();
    this.acTable1 = new HuffmanTable();
  }
  getDCTable (id) {
    if ( id == 0 ) {
      return this.dcTable0;
    }
    return this.dcTable1;
  };
  getACTable (id) {
    if ( id == 0 ) {
      return this.acTable0;
    }
    return this.acTable1;
  };
  parseDHT (data, pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const tableInfo = data._view.getUint8(pos);
      pos = pos + 1;
      const tableClass = (tableInfo >> 4);
      const tableId = (tableInfo & 15);
      let table = this.getDCTable(tableId);
      if ( tableClass == 1 ) {
        table = this.getACTable(tableId);
      }
      table.tableClass = tableClass;
      table.tableId = tableId;
      table.resetArrays();
      let totalSymbols = 0;
      let i = 0;
      while (i < 16) {
        const count = data._view.getUint8(pos);
        table.bits[i] = count;
        totalSymbols = totalSymbols + count;
        pos = pos + 1;
        i = i + 1;
      };
      i = 0;
      while (i < totalSymbols) {
        table.values.push(data._view.getUint8(pos));
        pos = pos + 1;
        i = i + 1;
      };
      table.build();
      let classStr = "DC";
      if ( tableClass == 1 ) {
        classStr = "AC";
      }
      console.log((((("  Huffman table " + classStr) + ((tableId.toString()))) + ": ") + ((totalSymbols.toString()))) + " symbols");
    };
  };
}
