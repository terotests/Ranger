package main
import (
  "fmt"
  "strconv"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type HuffmanTable struct { 
  bits []int64 `json:"bits"` 
  values []int64 `json:"values"` 
  maxCode []int64 `json:"maxCode"` 
  minCode []int64 `json:"minCode"` 
  valPtr []int64 `json:"valPtr"` 
  tableClass int64 `json:"tableClass"` 
  tableId int64 `json:"tableId"` 
}

func CreateNew_HuffmanTable() *HuffmanTable {
  me := new(HuffmanTable)
  me.bits = 
  make([]int64, int64(16))
  
  me.values = make([]int64,0)
  me.maxCode = 
  make([]int64, int64(16))
  
  me.minCode = 
  make([]int64, int64(16))
  
  me.valPtr = 
  make([]int64, int64(16))
  
  me.tableClass = int64(0)
  me.tableId = int64(0)
  var i int64= int64(0);
  for i < int64(16) {
    me.bits[i] = int64(0)
    me.maxCode[i] = int64(-1)
    me.minCode[i] = int64(0)
    me.valPtr[i] = int64(0)
    i = i + int64(1); 
  }
  return me;
}
func (this *HuffmanTable) build () () {
  var code int64= int64(0);
  var valueIdx int64= int64(0);
  var i int64= int64(0);
  for i < int64(16) {
    var count int64= this.bits[i];
    if  count > int64(0) {
      this.minCode[i] = code
      this.valPtr[i] = valueIdx
      valueIdx = valueIdx + count; 
      code = code + count; 
      this.maxCode[i] = code - int64(1)
    } else {
      this.maxCode[i] = int64(-1)
      this.minCode[i] = int64(0)
      this.valPtr[i] = valueIdx
    }
    code = int64(code << uint(int64(1))); 
    i = i + int64(1); 
  }
}
func (this *HuffmanTable) decode (reader *BitReader) int64 {
  var code int64= int64(0);
  var length int64= int64(0);
  for length < int64(16) {
    var bit int64= reader;
    code = int64((int64(code << uint(int64(1)))) | bit); 
    var maxC int64= this.maxCode[length];
    if  maxC >= int64(0) {
      if  code <= maxC {
        var minC int64= this.minCode[length];
        var ptr int64= this.valPtr[length];
        var idx int64= ptr + (code - minC);
        return this.values[idx]
      }
    }
    length = length + int64(1); 
  }
  fmt.Println( "Huffman decode error: code not found" )
  return int64(0)
}
func (this *HuffmanTable) resetArrays () () {
  var i int64= int64(0);
  for i < int64(16) {
    this.bits[i] = int64(0)
    this.maxCode[i] = int64(-1)
    this.minCode[i] = int64(0)
    this.valPtr[i] = int64(0)
    i = i + int64(1); 
  }
  this.values = this.values[:0]
}
type HuffmanDecoder struct { 
  dcTable0 *HuffmanTable `json:"dcTable0"` 
  dcTable1 *HuffmanTable `json:"dcTable1"` 
  acTable0 *HuffmanTable `json:"acTable0"` 
  acTable1 *HuffmanTable `json:"acTable1"` 
}

func CreateNew_HuffmanDecoder() *HuffmanDecoder {
  me := new(HuffmanDecoder)
  me.dcTable0 = CreateNew_HuffmanTable()
  me.dcTable1 = CreateNew_HuffmanTable()
  me.acTable0 = CreateNew_HuffmanTable()
  me.acTable1 = CreateNew_HuffmanTable()
  return me;
}
func (this *HuffmanDecoder) getDCTable (id int64) *HuffmanTable {
  if  id == int64(0) {
    return this.dcTable0
  }
  return this.dcTable1
}
func (this *HuffmanDecoder) getACTable (id int64) *HuffmanTable {
  if  id == int64(0) {
    return this.acTable0
  }
  return this.acTable1
}
func (this *HuffmanDecoder) parseDHT (data []byte, pos int64, length int64) () {
  var endPos int64= pos + length;
  for pos < endPos {
    var tableInfo int64= int64(data[pos]);
    pos = pos + int64(1); 
    var tableClass int64= int64(tableInfo >> uint(int64(4)));
    var tableId int64= int64(tableInfo & int64(15));
    var table *HuffmanTable= this.getDCTable(tableId);
    if  tableClass == int64(1) {
      table = this.getACTable(tableId); 
    }
    table.tableClass = tableClass; 
    table.tableId = tableId; 
    table.resetArrays();
    var totalSymbols int64= int64(0);
    var i int64= int64(0);
    for i < int64(16) {
      var count int64= int64(data[pos]);
      table.bits[i] = count
      totalSymbols = totalSymbols + count; 
      pos = pos + int64(1); 
      i = i + int64(1); 
    }
    i = int64(0); 
    for i < totalSymbols {
      table.values = append(table.values,int64(data[pos])); 
      pos = pos + int64(1); 
      i = i + int64(1); 
    }
    table.build();
    var classStr string= "DC";
    if  tableClass == int64(1) {
      classStr = "AC"; 
    }
    fmt.Println( (((("  Huffman table " + classStr) + (strconv.FormatInt(tableId, 10))) + ": ") + (strconv.FormatInt(totalSymbols, 10))) + " symbols" )
  }
}
