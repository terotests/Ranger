package main
import (
  "fmt"
  "strconv"
  "os"
  "path/filepath"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

func r_str_2_d64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseFloat(s, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}

func r_str_2_i64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseInt(s, 10, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}

type BufferChunk struct { 
  data []byte `json:"data"` 
  used int64 `json:"used"` 
  capacity int64 `json:"capacity"` 
  next *GoNullable `json:"next"` 
}

func CreateNew_BufferChunk(size int64) *BufferChunk {
  me := new(BufferChunk)
  me.data = 
  make([]byte, int64(0))
  
  me.used = int64(0)
  me.capacity = int64(0)
  me.next = new(GoNullable);
  me.data = make([]byte, size); 
  me.capacity = size; 
  me.used = int64(0); 
  return me;
}
func (this *BufferChunk) remaining () int64 {
  return this.capacity - this.used
}
func (this *BufferChunk) isFull () bool {
  return this.used >= this.capacity
}
type GrowableBuffer struct { 
  firstChunk *BufferChunk `json:"firstChunk"` 
  currentChunk *BufferChunk `json:"currentChunk"` 
  chunkSize int64 `json:"chunkSize"` 
  totalSize int64 `json:"totalSize"` 
}

func CreateNew_GrowableBuffer() *GrowableBuffer {
  me := new(GrowableBuffer)
  me.firstChunk = CreateNew_BufferChunk(int64(4096))
  me.currentChunk = CreateNew_BufferChunk(int64(4096))
  me.chunkSize = int64(4096)
  me.totalSize = int64(0)
  var chunk *BufferChunk= CreateNew_BufferChunk(me.chunkSize);
  me.firstChunk = chunk; 
  me.currentChunk = chunk; 
  return me;
}
func (this *GrowableBuffer) setChunkSize (size int64) () {
  this.chunkSize = size; 
}
func (this *GrowableBuffer) allocateNewChunk () () {
  var newChunk *BufferChunk= CreateNew_BufferChunk(this.chunkSize);
  this.currentChunk.next.value = newChunk;
  this.currentChunk.next.has_value = true; /* detected as non-optional */
  this.currentChunk = newChunk; 
}
func (this *GrowableBuffer) writeByte (b int64) () {
  if  this.currentChunk.isFull() {
    this.allocateNewChunk();
  }
  var pos int64= this.currentChunk.used;
  this.currentChunk.data[pos] = byte(b)
  this.currentChunk.used = pos + int64(1); 
  this.totalSize = this.totalSize + int64(1); 
}
func (this *GrowableBuffer) writeBytes (src []byte, srcOffset int64, length int64) () {
  var i int64= int64(0);
  for i < length {
    var b int64= int64(src[(srcOffset + i)]);
    this.writeByte(b);
    i = i + int64(1); 
  }
}
func (this *GrowableBuffer) writeBuffer (src []byte) () {
  var __len int64= int64(len(src));
  this.writeBytes(src, int64(0), __len);
}
func (this *GrowableBuffer) writeString (s string) () {
  var __len int64= int64(len([]rune(s)));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(s)[i]);
    this.writeByte(ch);
    i = i + int64(1); 
  }
}
func (this *GrowableBuffer) writeInt16BE (value int64) () {
  var highD float64= float64(value) / float64(int64(256));
  var high int64= int64(highD);
  var low int64= value - (high * int64(256));
  this.writeByte(high);
  this.writeByte(low);
}
func (this *GrowableBuffer) writeInt32BE (value int64) () {
  var b1D float64= float64(value) / float64(int64(16777216));
  var b1 int64= int64(b1D);
  var rem1 int64= value - (b1 * int64(16777216));
  var b2D float64= float64(rem1) / float64(int64(65536));
  var b2 int64= int64(b2D);
  var rem2 int64= rem1 - (b2 * int64(65536));
  var b3D float64= float64(rem2) / float64(int64(256));
  var b3 int64= int64(b3D);
  var b4 int64= rem2 - (b3 * int64(256));
  this.writeByte(b1);
  this.writeByte(b2);
  this.writeByte(b3);
  this.writeByte(b4);
}
func (this *GrowableBuffer) size () int64 {
  return this.totalSize
}
func (this *GrowableBuffer) toBuffer () []byte {
  var allocSize int64= this.totalSize;
  var result []byte= make([]byte, allocSize);
  var pos int64= int64(0);
  var chunk *BufferChunk= this.firstChunk;
  var done bool= false;
  for done == false {
    var chunkUsed int64= chunk.used;
    var i int64= int64(0);
    for i < chunkUsed {
      var b int64= int64(chunk.data[i]);
      result[pos] = byte(b)
      pos = pos + int64(1); 
      i = i + int64(1); 
    }
    if  !chunk.next.has_value  {
      done = true; 
    } else {
      chunk = chunk.next.value.(*BufferChunk); 
    }
  }
  return result
}
func (this *GrowableBuffer) toString () string {
  var result string= "";
  var chunk *BufferChunk= this.firstChunk;
  var done bool= false;
  for done == false {
    var chunkUsed int64= chunk.used;
    var i int64= int64(0);
    for i < chunkUsed {
      var b int64= int64(chunk.data[i]);
      result = result + (string([]rune{rune(b)})); 
      i = i + int64(1); 
    }
    if  !chunk.next.has_value  {
      done = true; 
    } else {
      chunk = chunk.next.value.(*BufferChunk); 
    }
  }
  return result
}
func (this *GrowableBuffer) clear () () {
  var chunk *BufferChunk= CreateNew_BufferChunk(this.chunkSize);
  this.firstChunk = chunk; 
  this.currentChunk = chunk; 
  this.totalSize = int64(0); 
}
type BitReader struct { 
  data []byte `json:"data"` 
  dataStart int64 `json:"dataStart"` 
  dataEnd int64 `json:"dataEnd"` 
  bytePos int64 `json:"bytePos"` 
  bitPos int64 `json:"bitPos"` 
  currentByte int64 `json:"currentByte"` 
  eof bool `json:"eof"` 
}

func CreateNew_BitReader() *BitReader {
  me := new(BitReader)
  me.data = 
  make([]byte, int64(0))
  
  me.dataStart = int64(0)
  me.dataEnd = int64(0)
  me.bytePos = int64(0)
  me.bitPos = int64(0)
  me.currentByte = int64(0)
  me.eof = false
  return me;
}
func (this *BitReader) init (buf []byte, startPos int64, length int64) () {
  this.data = buf; 
  this.dataStart = startPos; 
  this.dataEnd = startPos + length; 
  this.bytePos = startPos; 
  this.bitPos = int64(0); 
  this.currentByte = int64(0); 
  this.eof = false; 
}
func (this *BitReader) loadNextByte () () {
  if  this.bytePos >= this.dataEnd {
    this.eof = true; 
    this.currentByte = int64(0); 
    this.bitPos = int64(8); 
    return
  }
  this.currentByte = int64(this.data[this.bytePos]); 
  this.bytePos = this.bytePos + int64(1); 
  if  this.currentByte == int64(255) {
    if  this.bytePos < this.dataEnd {
      var nextByte int64= int64(this.data[this.bytePos]);
      if  nextByte == int64(0) {
        this.bytePos = this.bytePos + int64(1); 
      } else {
        if  (nextByte >= int64(208)) && (nextByte <= int64(215)) {
          this.bytePos = this.bytePos + int64(1); 
          this.loadNextByte();
          return
        }
        if  nextByte == int64(255) {
          this.bytePos = this.bytePos + int64(1); 
          this.loadNextByte();
          return
        }
      }
    }
  }
  this.bitPos = int64(8); 
}
func (this *BitReader) readBit () int64 {
  if  this.bitPos == int64(0) {
    this.loadNextByte();
  }
  if  this.eof {
    return int64(0)
  }
  this.bitPos = this.bitPos - int64(1); 
  var bit int64= int64((int64(this.currentByte >> uint(this.bitPos))) & int64(1));
  return bit
}
func (this *BitReader) readBits (count int64) int64 {
  var result int64= int64(0);
  var i int64= int64(0);
  for i < count {
    result = int64((int64(result << uint(int64(1)))) | this.readBit()); 
    i = i + int64(1); 
  }
  return result
}
func (this *BitReader) peekBits (count int64) int64 {
  var savedBytePos int64= this.bytePos;
  var savedBitPos int64= this.bitPos;
  var savedCurrentByte int64= this.currentByte;
  var savedEof bool= this.eof;
  var result int64= this.readBits(count);
  this.bytePos = savedBytePos; 
  this.bitPos = savedBitPos; 
  this.currentByte = savedCurrentByte; 
  this.eof = savedEof; 
  return result
}
func (this *BitReader) alignToByte () () {
  this.bitPos = int64(0); 
}
func (this *BitReader) skipRestartMarker () bool {
  if  (this.bytePos + int64(1)) >= this.dataEnd {
    return false
  }
  var byte1 int64= int64(this.data[this.bytePos]);
  var byte2 int64= int64(this.data[(this.bytePos + int64(1))]);
  if  ((byte1 == int64(255)) && (byte2 >= int64(208))) && (byte2 <= int64(215)) {
    this.bytePos = this.bytePos + int64(2); 
    return true
  }
  return false
}
func (this *BitReader) getBytePosition () int64 {
  return this.bytePos
}
func (this *BitReader) isEOF () bool {
  return this.eof
}
func (this *BitReader) receiveExtend (length int64) int64 {
  if  length == int64(0) {
    return int64(0)
  }
  var value int64= this.readBits(length);
  var threshold int64= int64(int64(1) << uint((length - int64(1))));
  if  value < threshold {
    value = value - ((int64(threshold << uint(int64(1)))) - int64(1)); 
  }
  return value
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
    var bit int64= reader.readBit();
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
type IDCT struct { 
  cosTable []int64 `json:"cosTable"` 
  zigzagMap []int64 `json:"zigzagMap"` 
}

func CreateNew_IDCT() *IDCT {
  me := new(IDCT)
  me.cosTable = 
  make([]int64, int64(64))
  
  me.zigzagMap = 
  make([]int64, int64(64))
  
  me.cosTable[int64(0)] = int64(1024)
  me.cosTable[int64(1)] = int64(1004)
  me.cosTable[int64(2)] = int64(946)
  me.cosTable[int64(3)] = int64(851)
  me.cosTable[int64(4)] = int64(724)
  me.cosTable[int64(5)] = int64(569)
  me.cosTable[int64(6)] = int64(392)
  me.cosTable[int64(7)] = int64(200)
  me.cosTable[int64(8)] = int64(1024)
  me.cosTable[int64(9)] = int64(851)
  me.cosTable[int64(10)] = int64(392)
  me.cosTable[int64(11)] = int64(-200)
  me.cosTable[int64(12)] = int64(-724)
  me.cosTable[int64(13)] = int64(-1004)
  me.cosTable[int64(14)] = int64(-946)
  me.cosTable[int64(15)] = int64(-569)
  me.cosTable[int64(16)] = int64(1024)
  me.cosTable[int64(17)] = int64(569)
  me.cosTable[int64(18)] = int64(-392)
  me.cosTable[int64(19)] = int64(-1004)
  me.cosTable[int64(20)] = int64(-724)
  me.cosTable[int64(21)] = int64(200)
  me.cosTable[int64(22)] = int64(946)
  me.cosTable[int64(23)] = int64(851)
  me.cosTable[int64(24)] = int64(1024)
  me.cosTable[int64(25)] = int64(200)
  me.cosTable[int64(26)] = int64(-946)
  me.cosTable[int64(27)] = int64(-569)
  me.cosTable[int64(28)] = int64(724)
  me.cosTable[int64(29)] = int64(851)
  me.cosTable[int64(30)] = int64(-392)
  me.cosTable[int64(31)] = int64(-1004)
  me.cosTable[int64(32)] = int64(1024)
  me.cosTable[int64(33)] = int64(-200)
  me.cosTable[int64(34)] = int64(-946)
  me.cosTable[int64(35)] = int64(569)
  me.cosTable[int64(36)] = int64(724)
  me.cosTable[int64(37)] = int64(-851)
  me.cosTable[int64(38)] = int64(-392)
  me.cosTable[int64(39)] = int64(1004)
  me.cosTable[int64(40)] = int64(1024)
  me.cosTable[int64(41)] = int64(-569)
  me.cosTable[int64(42)] = int64(-392)
  me.cosTable[int64(43)] = int64(1004)
  me.cosTable[int64(44)] = int64(-724)
  me.cosTable[int64(45)] = int64(-200)
  me.cosTable[int64(46)] = int64(946)
  me.cosTable[int64(47)] = int64(-851)
  me.cosTable[int64(48)] = int64(1024)
  me.cosTable[int64(49)] = int64(-851)
  me.cosTable[int64(50)] = int64(392)
  me.cosTable[int64(51)] = int64(200)
  me.cosTable[int64(52)] = int64(-724)
  me.cosTable[int64(53)] = int64(1004)
  me.cosTable[int64(54)] = int64(-946)
  me.cosTable[int64(55)] = int64(569)
  me.cosTable[int64(56)] = int64(1024)
  me.cosTable[int64(57)] = int64(-1004)
  me.cosTable[int64(58)] = int64(946)
  me.cosTable[int64(59)] = int64(-851)
  me.cosTable[int64(60)] = int64(724)
  me.cosTable[int64(61)] = int64(-569)
  me.cosTable[int64(62)] = int64(392)
  me.cosTable[int64(63)] = int64(-200)
  me.zigzagMap[int64(0)] = int64(0)
  me.zigzagMap[int64(1)] = int64(1)
  me.zigzagMap[int64(2)] = int64(8)
  me.zigzagMap[int64(3)] = int64(16)
  me.zigzagMap[int64(4)] = int64(9)
  me.zigzagMap[int64(5)] = int64(2)
  me.zigzagMap[int64(6)] = int64(3)
  me.zigzagMap[int64(7)] = int64(10)
  me.zigzagMap[int64(8)] = int64(17)
  me.zigzagMap[int64(9)] = int64(24)
  me.zigzagMap[int64(10)] = int64(32)
  me.zigzagMap[int64(11)] = int64(25)
  me.zigzagMap[int64(12)] = int64(18)
  me.zigzagMap[int64(13)] = int64(11)
  me.zigzagMap[int64(14)] = int64(4)
  me.zigzagMap[int64(15)] = int64(5)
  me.zigzagMap[int64(16)] = int64(12)
  me.zigzagMap[int64(17)] = int64(19)
  me.zigzagMap[int64(18)] = int64(26)
  me.zigzagMap[int64(19)] = int64(33)
  me.zigzagMap[int64(20)] = int64(40)
  me.zigzagMap[int64(21)] = int64(48)
  me.zigzagMap[int64(22)] = int64(41)
  me.zigzagMap[int64(23)] = int64(34)
  me.zigzagMap[int64(24)] = int64(27)
  me.zigzagMap[int64(25)] = int64(20)
  me.zigzagMap[int64(26)] = int64(13)
  me.zigzagMap[int64(27)] = int64(6)
  me.zigzagMap[int64(28)] = int64(7)
  me.zigzagMap[int64(29)] = int64(14)
  me.zigzagMap[int64(30)] = int64(21)
  me.zigzagMap[int64(31)] = int64(28)
  me.zigzagMap[int64(32)] = int64(35)
  me.zigzagMap[int64(33)] = int64(42)
  me.zigzagMap[int64(34)] = int64(49)
  me.zigzagMap[int64(35)] = int64(56)
  me.zigzagMap[int64(36)] = int64(57)
  me.zigzagMap[int64(37)] = int64(50)
  me.zigzagMap[int64(38)] = int64(43)
  me.zigzagMap[int64(39)] = int64(36)
  me.zigzagMap[int64(40)] = int64(29)
  me.zigzagMap[int64(41)] = int64(22)
  me.zigzagMap[int64(42)] = int64(15)
  me.zigzagMap[int64(43)] = int64(23)
  me.zigzagMap[int64(44)] = int64(30)
  me.zigzagMap[int64(45)] = int64(37)
  me.zigzagMap[int64(46)] = int64(44)
  me.zigzagMap[int64(47)] = int64(51)
  me.zigzagMap[int64(48)] = int64(58)
  me.zigzagMap[int64(49)] = int64(59)
  me.zigzagMap[int64(50)] = int64(52)
  me.zigzagMap[int64(51)] = int64(45)
  me.zigzagMap[int64(52)] = int64(38)
  me.zigzagMap[int64(53)] = int64(31)
  me.zigzagMap[int64(54)] = int64(39)
  me.zigzagMap[int64(55)] = int64(46)
  me.zigzagMap[int64(56)] = int64(53)
  me.zigzagMap[int64(57)] = int64(60)
  me.zigzagMap[int64(58)] = int64(61)
  me.zigzagMap[int64(59)] = int64(54)
  me.zigzagMap[int64(60)] = int64(47)
  me.zigzagMap[int64(61)] = int64(55)
  me.zigzagMap[int64(62)] = int64(62)
  me.zigzagMap[int64(63)] = int64(63)
  return me;
}
func (this *IDCT) dezigzag (zigzag []int64) []int64 {
  var block []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    var pos int64= this.zigzagMap[i];
    var val int64= zigzag[i];
    block[pos] = val
    i = i + int64(1); 
  }
  return block
}
func (this *IDCT) idct1d (input []int64, startIdx int64, stride int64, output []int64, outIdx int64, outStride int64) () {
  var x int64= int64(0);
  for x < int64(8) {
    var sum int64= int64(0);
    var u int64= int64(0);
    for u < int64(8) {
      var coeff int64= input[(startIdx + (u * stride))];
      if  coeff != int64(0) {
        var cosVal int64= this.cosTable[((x * int64(8)) + u)];
        var contrib int64= coeff * cosVal;
        if  u == int64(0) {
          contrib = int64((contrib * int64(724)) >> uint(int64(10))); 
        }
        sum = sum + contrib; 
      }
      u = u + int64(1); 
    }
    output[outIdx + (x * outStride)] = int64(sum >> uint(int64(11)))
    x = x + int64(1); 
  }
}
func (this *IDCT) transform (block []int64, output []int64) () {
  var temp []int64= make([]int64, int64(64));
  var row int64= int64(0);
  for row < int64(8) {
    var rowStart int64= row * int64(8);
    this.idct1d(block, rowStart, int64(1), temp, rowStart, int64(1));
    row = row + int64(1); 
  }
  var col int64= int64(0);
  for col < int64(8) {
    this.idct1d(temp, col, int64(8), output, col, int64(8));
    col = col + int64(1); 
  }
  var i int64= int64(0);
  for i < int64(64) {
    var val int64= (output[i]) + int64(128);
    if  val < int64(0) {
      val = int64(0); 
    }
    if  val > int64(255) {
      val = int64(255); 
    }
    output[i] = val
    i = i + int64(1); 
  }
}
func (this *IDCT) transformFast (coeffs []int64, output []int64) () {
  this.transform(coeffs, output);
}
type Color struct { 
  r int64 `json:"r"` 
  g int64 `json:"g"` 
  b int64 `json:"b"` 
  a int64 `json:"a"` 
}

func CreateNew_Color() *Color {
  me := new(Color)
  me.r = int64(0)
  me.g = int64(0)
  me.b = int64(0)
  me.a = int64(255)
  return me;
}
func (this *Color) setRGB (red int64, green int64, blue int64) () {
  this.r = red; 
  this.g = green; 
  this.b = blue; 
  this.a = int64(255); 
}
func (this *Color) setRGBA (red int64, green int64, blue int64, alpha int64) () {
  this.r = red; 
  this.g = green; 
  this.b = blue; 
  this.a = alpha; 
}
func (this *Color) clamp (val int64) int64 {
  if  val < int64(0) {
    return int64(0)
  }
  if  val > int64(255) {
    return int64(255)
  }
  return val
}
func (this *Color) set (red int64, green int64, blue int64) () {
  this.r = this.clamp(red); 
  this.g = this.clamp(green); 
  this.b = this.clamp(blue); 
}
func (this *Color) grayscale () int64 {
  return int64((((this.r * int64(77)) + (this.g * int64(150))) + (this.b * int64(29))) >> uint(int64(8)))
}
func (this *Color) toGrayscale () () {
  var gray int64= this.grayscale();
  this.r = gray; 
  this.g = gray; 
  this.b = gray; 
}
func (this *Color) invert () () {
  this.r = int64(255) - this.r; 
  this.g = int64(255) - this.g; 
  this.b = int64(255) - this.b; 
}
func (this *Color) adjustBrightness (amount int64) () {
  this.r = this.clamp((this.r + amount)); 
  this.g = this.clamp((this.g + amount)); 
  this.b = this.clamp((this.b + amount)); 
}
type ImageBuffer struct { 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  pixels []byte `json:"pixels"` 
}

func CreateNew_ImageBuffer() *ImageBuffer {
  me := new(ImageBuffer)
  me.width = int64(0)
  me.height = int64(0)
  me.pixels = 
  make([]byte, int64(0))
  
  return me;
}
func (this *ImageBuffer) init (w int64, h int64) () {
  this.width = w; 
  this.height = h; 
  var size int64= (w * h) * int64(4);
  this.pixels = make([]byte, size); 
  this.fill(int64(255), int64(255), int64(255), int64(255));
}
func (this *ImageBuffer) getPixelOffset (x int64, y int64) int64 {
  return ((y * this.width) + x) * int64(4)
}
func (this *ImageBuffer) isValidCoord (x int64, y int64) bool {
  if  x < int64(0) {
    return false
  }
  if  y < int64(0) {
    return false
  }
  if  x >= this.width {
    return false
  }
  if  y >= this.height {
    return false
  }
  return true
}
func (this *ImageBuffer) getPixel (x int64, y int64) *Color {
  var c *Color= CreateNew_Color();
  if  this.isValidCoord(x, y) {
    var off int64= this.getPixelOffset(x, y);
    c.r = int64(this.pixels[off]); 
    c.g = int64(this.pixels[(off + int64(1))]); 
    c.b = int64(this.pixels[(off + int64(2))]); 
    c.a = int64(this.pixels[(off + int64(3))]); 
  }
  return c
}
func (this *ImageBuffer) setPixel (x int64, y int64, c *Color) () {
  if  this.isValidCoord(x, y) {
    var off int64= this.getPixelOffset(x, y);
    this.pixels[off] = byte(c.r)
    this.pixels[off + int64(1)] = byte(c.g)
    this.pixels[off + int64(2)] = byte(c.b)
    this.pixels[off + int64(3)] = byte(c.a)
  }
}
func (this *ImageBuffer) setPixelRGB (x int64, y int64, r int64, g int64, b int64) () {
  if  this.isValidCoord(x, y) {
    var off int64= this.getPixelOffset(x, y);
    this.pixels[off] = byte(r)
    this.pixels[off + int64(1)] = byte(g)
    this.pixels[off + int64(2)] = byte(b)
    this.pixels[off + int64(3)] = byte(int64(255))
  }
}
func (this *ImageBuffer) fill (r int64, g int64, b int64, a int64) () {
  var size int64= (this.width * this.height) * int64(4);
  var i int64= int64(0);
  for i < size {
    this.pixels[i] = byte(r)
    this.pixels[i + int64(1)] = byte(g)
    this.pixels[i + int64(2)] = byte(b)
    this.pixels[i + int64(3)] = byte(a)
    i = i + int64(4); 
  }
}
func (this *ImageBuffer) fillRect (x int64, y int64, w int64, h int64, c *Color) () {
  var endX int64= x + w;
  var endY int64= y + h;
  var py int64= y;
  for py < endY {
    var px int64= x;
    for px < endX {
      this.setPixel(px, py, c);
      px = px + int64(1); 
    }
    py = py + int64(1); 
  }
}
func (this *ImageBuffer) invert () () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    this.pixels[off] = byte(int64(255) - r)
    this.pixels[off + int64(1)] = byte(int64(255) - g)
    this.pixels[off + int64(2)] = byte(int64(255) - b)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) grayscale () () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    var gray int64= int64((((r * int64(77)) + (g * int64(150))) + (b * int64(29))) >> uint(int64(8)));
    this.pixels[off] = byte(gray)
    this.pixels[off + int64(1)] = byte(gray)
    this.pixels[off + int64(2)] = byte(gray)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) adjustBrightness (amount int64) () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    r = r + amount; 
    g = g + amount; 
    b = b + amount; 
    if  r < int64(0) {
      r = int64(0); 
    }
    if  r > int64(255) {
      r = int64(255); 
    }
    if  g < int64(0) {
      g = int64(0); 
    }
    if  g > int64(255) {
      g = int64(255); 
    }
    if  b < int64(0) {
      b = int64(0); 
    }
    if  b > int64(255) {
      b = int64(255); 
    }
    this.pixels[off] = byte(r)
    this.pixels[off + int64(1)] = byte(g)
    this.pixels[off + int64(2)] = byte(b)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) threshold (level int64) () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    var gray int64= int64((((r * int64(77)) + (g * int64(150))) + (b * int64(29))) >> uint(int64(8)));
    var val int64= int64(0);
    if  gray >= level {
      val = int64(255); 
    }
    this.pixels[off] = byte(val)
    this.pixels[off + int64(1)] = byte(val)
    this.pixels[off + int64(2)] = byte(val)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) sepia () () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    var newR int64= int64((((r * int64(101)) + (g * int64(197))) + (b * int64(48))) >> uint(int64(8)));
    var newG int64= int64((((r * int64(89)) + (g * int64(175))) + (b * int64(43))) >> uint(int64(8)));
    var newB int64= int64((((r * int64(70)) + (g * int64(137))) + (b * int64(33))) >> uint(int64(8)));
    if  newR > int64(255) {
      newR = int64(255); 
    }
    if  newG > int64(255) {
      newG = int64(255); 
    }
    if  newB > int64(255) {
      newB = int64(255); 
    }
    this.pixels[off] = byte(newR)
    this.pixels[off + int64(1)] = byte(newG)
    this.pixels[off + int64(2)] = byte(newB)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) flipHorizontal () () {
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    var halfW int64= int64(this.width >> uint(int64(1)));
    for x < halfW {
      var x2 int64= (this.width - int64(1)) - x;
      var off1 int64= this.getPixelOffset(x, y);
      var off2 int64= this.getPixelOffset(x2, y);
      var r1 int64= int64(this.pixels[off1]);
      var g1 int64= int64(this.pixels[(off1 + int64(1))]);
      var b1 int64= int64(this.pixels[(off1 + int64(2))]);
      var a1 int64= int64(this.pixels[(off1 + int64(3))]);
      var r2 int64= int64(this.pixels[off2]);
      var g2 int64= int64(this.pixels[(off2 + int64(1))]);
      var b2 int64= int64(this.pixels[(off2 + int64(2))]);
      var a2 int64= int64(this.pixels[(off2 + int64(3))]);
      this.pixels[off1] = byte(r2)
      this.pixels[off1 + int64(1)] = byte(g2)
      this.pixels[off1 + int64(2)] = byte(b2)
      this.pixels[off1 + int64(3)] = byte(a2)
      this.pixels[off2] = byte(r1)
      this.pixels[off2 + int64(1)] = byte(g1)
      this.pixels[off2 + int64(2)] = byte(b1)
      this.pixels[off2 + int64(3)] = byte(a1)
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
}
func (this *ImageBuffer) flipVertical () () {
  var y int64= int64(0);
  var halfH int64= int64(this.height >> uint(int64(1)));
  for y < halfH {
    var y2 int64= (this.height - int64(1)) - y;
    var x int64= int64(0);
    for x < this.width {
      var off1 int64= this.getPixelOffset(x, y);
      var off2 int64= this.getPixelOffset(x, y2);
      var r1 int64= int64(this.pixels[off1]);
      var g1 int64= int64(this.pixels[(off1 + int64(1))]);
      var b1 int64= int64(this.pixels[(off1 + int64(2))]);
      var a1 int64= int64(this.pixels[(off1 + int64(3))]);
      var r2 int64= int64(this.pixels[off2]);
      var g2 int64= int64(this.pixels[(off2 + int64(1))]);
      var b2 int64= int64(this.pixels[(off2 + int64(2))]);
      var a2 int64= int64(this.pixels[(off2 + int64(3))]);
      this.pixels[off1] = byte(r2)
      this.pixels[off1 + int64(1)] = byte(g2)
      this.pixels[off1 + int64(2)] = byte(b2)
      this.pixels[off1 + int64(3)] = byte(a2)
      this.pixels[off2] = byte(r1)
      this.pixels[off2 + int64(1)] = byte(g1)
      this.pixels[off2 + int64(2)] = byte(b1)
      this.pixels[off2 + int64(3)] = byte(a1)
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
}
func (this *ImageBuffer) drawLine (x1 int64, y1 int64, x2 int64, y2 int64, c *Color) () {
  var dx int64= x2 - x1;
  var dy int64= y2 - y1;
  if  dx < int64(0) {
    dx = int64(0) - dx; 
  }
  if  dy < int64(0) {
    dy = int64(0) - dy; 
  }
  var sx int64= int64(1);
  if  x1 > x2 {
    sx = int64(-1); 
  }
  var sy int64= int64(1);
  if  y1 > y2 {
    sy = int64(-1); 
  }
  var err int64= dx - dy;
  var x int64= x1;
  var y int64= y1;
  var done bool= false;
  for done == false {
    this.setPixel(x, y, c);
    if  (x == x2) && (y == y2) {
      done = true; 
    } else {
      var e2 int64= err * int64(2);
      if  e2 > (int64(0) - dy) {
        err = err - dy; 
        x = x + sx; 
      }
      if  e2 < dx {
        err = err + dx; 
        y = y + sy; 
      }
    }
  }
}
func (this *ImageBuffer) drawRect (x int64, y int64, w int64, h int64, c *Color) () {
  this.drawLine(x, y, (x + w) - int64(1), y, c);
  this.drawLine((x + w) - int64(1), y, (x + w) - int64(1), (y + h) - int64(1), c);
  this.drawLine((x + w) - int64(1), (y + h) - int64(1), x, (y + h) - int64(1), c);
  this.drawLine(x, (y + h) - int64(1), x, y, c);
}
func (this *ImageBuffer) scale (factor int64) *ImageBuffer {
  var newW int64= this.width * factor;
  var newH int64= this.height * factor;
  return this.scaleToSize(newW, newH)
}
func (this *ImageBuffer) scaleToSize (newW int64, newH int64) *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(newW, newH);
  var scaleX float64= (float64( this.width )) / (float64( newW ));
  var scaleY float64= (float64( this.height )) / (float64( newH ));
  var destY int64= int64(0);
  for destY < newH {
    var srcYf float64= (float64( destY )) * scaleY;
    var srcY0 int64= int64(srcYf);
    var srcY1 int64= srcY0 + int64(1);
    if  srcY1 >= this.height {
      srcY1 = this.height - int64(1); 
    }
    var fy float64= srcYf - (float64( srcY0 ));
    var destX int64= int64(0);
    for destX < newW {
      var srcXf float64= (float64( destX )) * scaleX;
      var srcX0 int64= int64(srcXf);
      var srcX1 int64= srcX0 + int64(1);
      if  srcX1 >= this.width {
        srcX1 = this.width - int64(1); 
      }
      var fx float64= srcXf - (float64( srcX0 ));
      var off00 int64= ((srcY0 * this.width) + srcX0) * int64(4);
      var off01 int64= ((srcY0 * this.width) + srcX1) * int64(4);
      var off10 int64= ((srcY1 * this.width) + srcX0) * int64(4);
      var off11 int64= ((srcY1 * this.width) + srcX1) * int64(4);
      var r int64= this.bilinear((int64(this.pixels[off00])), (int64(this.pixels[off01])), (int64(this.pixels[off10])), (int64(this.pixels[off11])), fx, fy);
      var g int64= this.bilinear((int64(this.pixels[(off00 + int64(1))])), (int64(this.pixels[(off01 + int64(1))])), (int64(this.pixels[(off10 + int64(1))])), (int64(this.pixels[(off11 + int64(1))])), fx, fy);
      var b int64= this.bilinear((int64(this.pixels[(off00 + int64(2))])), (int64(this.pixels[(off01 + int64(2))])), (int64(this.pixels[(off10 + int64(2))])), (int64(this.pixels[(off11 + int64(2))])), fx, fy);
      var a int64= this.bilinear((int64(this.pixels[(off00 + int64(3))])), (int64(this.pixels[(off01 + int64(3))])), (int64(this.pixels[(off10 + int64(3))])), (int64(this.pixels[(off11 + int64(3))])), fx, fy);
      var destOff int64= ((destY * newW) + destX) * int64(4);
      result.pixels[destOff] = byte(r)
      result.pixels[destOff + int64(1)] = byte(g)
      result.pixels[destOff + int64(2)] = byte(b)
      result.pixels[destOff + int64(3)] = byte(a)
      destX = destX + int64(1); 
    }
    destY = destY + int64(1); 
  }
  return result
}
func (this *ImageBuffer) bilinear (v00 int64, v01 int64, v10 int64, v11 int64, fx float64, fy float64) int64 {
  var top float64= ((float64( v00 )) * (1.0 - fx)) + ((float64( v01 )) * fx);
  var bottom float64= ((float64( v10 )) * (1.0 - fx)) + ((float64( v11 )) * fx);
  var result float64= (top * (1.0 - fy)) + (bottom * fy);
  return int64(result)
}
func (this *ImageBuffer) rotate90CW () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= (this.height - int64(1)) - y;
      var newY int64= x;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.height) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) rotate180 () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.width, this.height);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= (this.width - int64(1)) - x;
      var newY int64= (this.height - int64(1)) - y;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.width) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) rotate270CW () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= y;
      var newY int64= (this.width - int64(1)) - x;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.height) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) transpose () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((x * this.height) + y) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) transverse () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= (this.height - int64(1)) - y;
      var newY int64= (this.width - int64(1)) - x;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.height) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) applyExifOrientation (orientation int64) *ImageBuffer {
  if  orientation == int64(1) {
    return this.scale(int64(1))
  }
  if  orientation == int64(2) {
    var result *ImageBuffer= CreateNew_ImageBuffer();
    result.init(this.width, this.height);
    var y int64= int64(0);
    for y < this.height {
      var x int64= int64(0);
      for x < this.width {
        var srcOff int64= ((y * this.width) + x) * int64(4);
        var destOff int64= ((y * this.width) + ((this.width - int64(1)) - x)) * int64(4);
        result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
        result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
        result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
        result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
        x = x + int64(1); 
      }
      y = y + int64(1); 
    }
    return result
  }
  if  orientation == int64(3) {
    return this.rotate180()
  }
  if  orientation == int64(4) {
    var result_1 *ImageBuffer= CreateNew_ImageBuffer();
    result_1.init(this.width, this.height);
    var y_1 int64= int64(0);
    for y_1 < this.height {
      var x_1 int64= int64(0);
      for x_1 < this.width {
        var srcOff_1 int64= ((y_1 * this.width) + x_1) * int64(4);
        var destOff_1 int64= ((((this.height - int64(1)) - y_1) * this.width) + x_1) * int64(4);
        result_1.pixels[destOff_1] = byte(int64(this.pixels[srcOff_1]))
        result_1.pixels[destOff_1 + int64(1)] = byte(int64(this.pixels[(srcOff_1 + int64(1))]))
        result_1.pixels[destOff_1 + int64(2)] = byte(int64(this.pixels[(srcOff_1 + int64(2))]))
        result_1.pixels[destOff_1 + int64(3)] = byte(int64(this.pixels[(srcOff_1 + int64(3))]))
        x_1 = x_1 + int64(1); 
      }
      y_1 = y_1 + int64(1); 
    }
    return result_1
  }
  if  orientation == int64(5) {
    return this.transpose()
  }
  if  orientation == int64(6) {
    return this.rotate90CW()
  }
  if  orientation == int64(7) {
    return this.transverse()
  }
  if  orientation == int64(8) {
    return this.rotate270CW()
  }
  return this.scale(int64(1))
}
type PPMImage struct { 
}

func CreateNew_PPMImage() *PPMImage {
  me := new(PPMImage)
  return me;
}
func (this *PPMImage) parseNumber (data []byte, startPos int64, endPos []int64) int64 {
  var __len int64= int64(len(data));
  var pos int64= startPos;
  var skipping bool= true;
  for skipping && (pos < __len) {
    var ch int64= int64(data[pos]);
    if  (((ch == int64(32)) || (ch == int64(10))) || (ch == int64(13))) || (ch == int64(9)) {
      pos = pos + int64(1); 
    } else {
      skipping = false; 
    }
  }
  var value int64= int64(0);
  var parsing bool= true;
  for parsing && (pos < __len) {
    var ch_1 int64= int64(data[pos]);
    if  (ch_1 >= int64(48)) && (ch_1 <= int64(57)) {
      value = (value * int64(10)) + (ch_1 - int64(48)); 
      pos = pos + int64(1); 
    } else {
      parsing = false; 
    }
  }
  endPos[int64(0)] = pos;
  return value
}
func (this *PPMImage) skipToNextLine (data []byte, pos int64) int64 {
  var __len int64= int64(len(data));
  for pos < __len {
    var ch int64= int64(data[pos]);
    pos = pos + int64(1); 
    if  ch == int64(10) {
      return pos
    }
  }
  return pos
}
func (this *PPMImage) load (dirPath string, fileName string) *ImageBuffer {
  var data []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }();
  var __len int64= int64(len(data));
  if  __len < int64(10) {
    fmt.Println( "Error: File too small: " + fileName )
    var errImg *ImageBuffer= CreateNew_ImageBuffer();
    errImg.init(int64(1), int64(1));
    return errImg
  }
  var m1 int64= int64(data[int64(0)]);
  var m2 int64= int64(data[int64(1)]);
  if  (m1 != int64(80)) || ((m2 != int64(54)) && (m2 != int64(51))) {
    fmt.Println( "Error: Not a PPM file (P3 or P6): " + fileName )
    var errImg_1 *ImageBuffer= CreateNew_ImageBuffer();
    errImg_1.init(int64(1), int64(1));
    return errImg_1
  }
  var isBinary bool= m2 == int64(54);
  var pos int64= int64(2);
  var endPos []int64 = make([]int64, 0);
  endPos = append(endPos,int64(0)); 
  var skippingComments bool= true;
  for skippingComments && (pos < __len) {
    var ch int64= int64(data[pos]);
    if  (((ch == int64(32)) || (ch == int64(10))) || (ch == int64(13))) || (ch == int64(9)) {
      pos = pos + int64(1); 
    } else {
      if  ch == int64(35) {
        pos = this.skipToNextLine(data, pos); 
      } else {
        skippingComments = false; 
      }
    }
  }
  var width int64= this.parseNumber(data, pos, endPos);
  pos = endPos[int64(0)]; 
  var height int64= this.parseNumber(data, pos, endPos);
  pos = endPos[int64(0)]; 
  var maxVal int64= this.parseNumber(data, pos, endPos);
  pos = endPos[int64(0)]; 
  if  pos < __len {
    pos = pos + int64(1); 
  }
  fmt.Println( (((("Loading PPM: " + (strconv.FormatInt(width, 10))) + "x") + (strconv.FormatInt(height, 10))) + ", maxval=") + (strconv.FormatInt(maxVal, 10)) )
  var img *ImageBuffer= CreateNew_ImageBuffer();
  img.init(width, height);
  if  isBinary {
    var y int64= int64(0);
    for y < height {
      var x int64= int64(0);
      for x < width {
        if  (pos + int64(2)) < __len {
          var r int64= int64(data[pos]);
          var g int64= int64(data[(pos + int64(1))]);
          var b int64= int64(data[(pos + int64(2))]);
          img.setPixelRGB(x, y, r, g, b);
          pos = pos + int64(3); 
        }
        x = x + int64(1); 
      }
      y = y + int64(1); 
    }
  } else {
    var y_1 int64= int64(0);
    for y_1 < height {
      var x_1 int64= int64(0);
      for x_1 < width {
        var r_1 int64= this.parseNumber(data, pos, endPos);
        pos = endPos[int64(0)]; 
        var g_1 int64= this.parseNumber(data, pos, endPos);
        pos = endPos[int64(0)]; 
        var b_1 int64= this.parseNumber(data, pos, endPos);
        pos = endPos[int64(0)]; 
        img.setPixelRGB(x_1, y_1, r_1, g_1, b_1);
        x_1 = x_1 + int64(1); 
      }
      y_1 = y_1 + int64(1); 
    }
  }
  return img
}
func (this *PPMImage) save (img *ImageBuffer, dirPath string, fileName string) () {
  var buf *GrowableBuffer= CreateNew_GrowableBuffer();
  buf.writeString("P6\n");
  buf.writeString((((strconv.FormatInt(img.width, 10)) + " ") + (strconv.FormatInt(img.height, 10))) + "\n");
  buf.writeString("255\n");
  var y int64= int64(0);
  for y < img.height {
    var x int64= int64(0);
    for x < img.width {
      var c *Color= img.getPixel(x, y);
      buf.writeByte(c.r);
      buf.writeByte(c.g);
      buf.writeByte(c.b);
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  var data []byte= buf.toBuffer();
  os.WriteFile(dirPath + "/" + fileName, data, 0644)
  fmt.Println( (("Saved PPM: " + dirPath) + "/") + fileName )
}
func (this *PPMImage) saveP3 (img *ImageBuffer, dirPath string, fileName string) () {
  var buf *GrowableBuffer= CreateNew_GrowableBuffer();
  buf.writeString("P3\n");
  buf.writeString("# Created by Ranger ImageEditor\n");
  buf.writeString((((strconv.FormatInt(img.width, 10)) + " ") + (strconv.FormatInt(img.height, 10))) + "\n");
  buf.writeString("255\n");
  var y int64= int64(0);
  for y < img.height {
    var x int64= int64(0);
    for x < img.width {
      var c *Color= img.getPixel(x, y);
      buf.writeString(((((strconv.FormatInt(c.r, 10)) + " ") + (strconv.FormatInt(c.g, 10))) + " ") + (strconv.FormatInt(c.b, 10)));
      if  x < (img.width - int64(1)) {
        buf.writeString("  ");
      }
      x = x + int64(1); 
    }
    buf.writeString("\n");
    y = y + int64(1); 
  }
  var data []byte= buf.toBuffer();
  os.WriteFile(dirPath + "/" + fileName, data, 0644)
  fmt.Println( (("Saved PPM (ASCII): " + dirPath) + "/") + fileName )
}
type JPEGComponent struct { 
  id int64 `json:"id"` 
  hSamp int64 `json:"hSamp"` 
  vSamp int64 `json:"vSamp"` 
  quantTableId int64 `json:"quantTableId"` 
  dcTableId int64 `json:"dcTableId"` 
  acTableId int64 `json:"acTableId"` 
  prevDC int64 `json:"prevDC"` 
}

func CreateNew_JPEGComponent() *JPEGComponent {
  me := new(JPEGComponent)
  me.id = int64(0)
  me.hSamp = int64(1)
  me.vSamp = int64(1)
  me.quantTableId = int64(0)
  me.dcTableId = int64(0)
  me.acTableId = int64(0)
  me.prevDC = int64(0)
  return me;
}
type QuantizationTable struct { 
  values []int64 `json:"values"` 
  id int64 `json:"id"` 
}

func CreateNew_QuantizationTable() *QuantizationTable {
  me := new(QuantizationTable)
  me.values = make([]int64,0)
  me.id = int64(0)
  var i_1 int64= int64(0);
  for i_1 < int64(64) {
    me.values = append(me.values,int64(1)); 
    i_1 = i_1 + int64(1); 
  }
  return me;
}
type JPEGDecoder struct { 
  data []byte `json:"data"` 
  dataLen int64 `json:"dataLen"` 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  numComponents int64 `json:"numComponents"` 
  precision int64 `json:"precision"` 
  components []*JPEGComponent `json:"components"` 
  quantTables []*QuantizationTable `json:"quantTables"` 
  huffman *GoNullable `json:"huffman"` 
  idct *GoNullable `json:"idct"` 
  scanDataStart int64 `json:"scanDataStart"` 
  scanDataLen int64 `json:"scanDataLen"` 
  mcuWidth int64 `json:"mcuWidth"` 
  mcuHeight int64 `json:"mcuHeight"` 
  mcusPerRow int64 `json:"mcusPerRow"` 
  mcusPerCol int64 `json:"mcusPerCol"` 
  maxHSamp int64 `json:"maxHSamp"` 
  maxVSamp int64 `json:"maxVSamp"` 
  restartInterval int64 `json:"restartInterval"` 
}

func CreateNew_JPEGDecoder() *JPEGDecoder {
  me := new(JPEGDecoder)
  me.data = 
  make([]byte, int64(0))
  
  me.dataLen = int64(0)
  me.width = int64(0)
  me.height = int64(0)
  me.numComponents = int64(0)
  me.precision = int64(8)
  me.components = make([]*JPEGComponent,0)
  me.quantTables = make([]*QuantizationTable,0)
  me.scanDataStart = int64(0)
  me.scanDataLen = int64(0)
  me.mcuWidth = int64(8)
  me.mcuHeight = int64(8)
  me.mcusPerRow = int64(0)
  me.mcusPerCol = int64(0)
  me.maxHSamp = int64(1)
  me.maxVSamp = int64(1)
  me.restartInterval = int64(0)
  me.huffman = new(GoNullable);
  me.idct = new(GoNullable);
  me.huffman.value = CreateNew_HuffmanDecoder();
  me.huffman.has_value = true; /* detected as non-optional */
  me.idct.value = CreateNew_IDCT();
  me.idct.has_value = true; /* detected as non-optional */
  var i_2 int64= int64(0);
  for i_2 < int64(4) {
    me.quantTables = append(me.quantTables,CreateNew_QuantizationTable()); 
    i_2 = i_2 + int64(1); 
  }
  return me;
}
func (this *JPEGDecoder) readUint16BE (pos int64) int64 {
  var high int64= int64(this.data[pos]);
  var low int64= int64(this.data[(pos + int64(1))]);
  return (high * int64(256)) + low
}
func (this *JPEGDecoder) parseSOF (pos int64, length int64) () {
  this.precision = int64(this.data[pos]); 
  this.height = this.readUint16BE((pos + int64(1))); 
  this.width = this.readUint16BE((pos + int64(3))); 
  this.numComponents = int64(this.data[(pos + int64(5))]); 
  fmt.Println( ((((("  Image: " + (strconv.FormatInt(this.width, 10))) + "x") + (strconv.FormatInt(this.height, 10))) + ", ") + (strconv.FormatInt(this.numComponents, 10))) + " components" )
  this.components = this.components[:0]
  this.maxHSamp = int64(1); 
  this.maxVSamp = int64(1); 
  var i int64= int64(0);
  var offset int64= pos + int64(6);
  for i < this.numComponents {
    var comp *JPEGComponent= CreateNew_JPEGComponent();
    comp.id = int64(this.data[offset]); 
    var sampling int64= int64(this.data[(offset + int64(1))]);
    comp.hSamp = int64(sampling >> uint(int64(4))); 
    comp.vSamp = int64(sampling & int64(15)); 
    comp.quantTableId = int64(this.data[(offset + int64(2))]); 
    if  comp.hSamp > this.maxHSamp {
      this.maxHSamp = comp.hSamp; 
    }
    if  comp.vSamp > this.maxVSamp {
      this.maxVSamp = comp.vSamp; 
    }
    this.components = append(this.components,comp); 
    fmt.Println( (((((("    Component " + (strconv.FormatInt(comp.id, 10))) + ": ") + (strconv.FormatInt(comp.hSamp, 10))) + "x") + (strconv.FormatInt(comp.vSamp, 10))) + " sampling, quant table ") + (strconv.FormatInt(comp.quantTableId, 10)) )
    offset = offset + int64(3); 
    i = i + int64(1); 
  }
  this.mcuWidth = this.maxHSamp * int64(8); 
  this.mcuHeight = this.maxVSamp * int64(8); 
  this.mcusPerRow = int64((float64(((this.width + this.mcuWidth) - int64(1))) / float64(this.mcuWidth))); 
  this.mcusPerCol = int64((float64(((this.height + this.mcuHeight) - int64(1))) / float64(this.mcuHeight))); 
  fmt.Println( (((((("  MCU size: " + (strconv.FormatInt(this.mcuWidth, 10))) + "x") + (strconv.FormatInt(this.mcuHeight, 10))) + ", grid: ") + (strconv.FormatInt(this.mcusPerRow, 10))) + "x") + (strconv.FormatInt(this.mcusPerCol, 10)) )
}
func (this *JPEGDecoder) parseDQT (pos int64, length int64) () {
  var endPos int64= pos + length;
  for pos < endPos {
    var info int64= int64(this.data[pos]);
    pos = pos + int64(1); 
    var precision_1 int64= int64(info >> uint(int64(4)));
    var tableId int64= int64(info & int64(15));
    var table *QuantizationTable= this.quantTables[tableId];
    table.id = tableId; 
    table.values = table.values[:0]
    var i int64= int64(0);
    for i < int64(64) {
      if  precision_1 == int64(0) {
        table.values = append(table.values,int64(this.data[pos])); 
        pos = pos + int64(1); 
      } else {
        table.values = append(table.values,this.readUint16BE(pos)); 
        pos = pos + int64(2); 
      }
      i = i + int64(1); 
    }
    fmt.Println( ((("  Quantization table " + (strconv.FormatInt(tableId, 10))) + " (") + (strconv.FormatInt((precision_1 + int64(1)), 10))) + "-byte values)" )
  }
}
func (this *JPEGDecoder) parseSOS (pos int64, length int64) () {
  var numScanComponents int64= int64(this.data[pos]);
  pos = pos + int64(1); 
  var i int64= int64(0);
  for i < numScanComponents {
    var compId int64= int64(this.data[pos]);
    var tableSelect int64= int64(this.data[(pos + int64(1))]);
    pos = pos + int64(2); 
    var j int64= int64(0);
    for j < this.numComponents {
      var comp *JPEGComponent= this.components[j];
      if  comp.id == compId {
        comp.dcTableId = int64(tableSelect >> uint(int64(4))); 
        comp.acTableId = int64(tableSelect & int64(15)); 
        fmt.Println( (((("    Component " + (strconv.FormatInt(compId, 10))) + ": DC table ") + (strconv.FormatInt(comp.dcTableId, 10))) + ", AC table ") + (strconv.FormatInt(comp.acTableId, 10)) )
      }
      j = j + int64(1); 
    }
    i = i + int64(1); 
  }
  pos = pos + int64(3); 
  this.scanDataStart = pos; 
  var searchPos int64= pos;
  for searchPos < (this.dataLen - int64(1)) {
    var b int64= int64(this.data[searchPos]);
    if  b == int64(255) {
      var nextB int64= int64(this.data[(searchPos + int64(1))]);
      if  (nextB != int64(0)) && (nextB != int64(255)) {
        if  (nextB >= int64(208)) && (nextB <= int64(215)) {
          searchPos = searchPos + int64(2); 
          continue;
        }
        this.scanDataLen = searchPos - this.scanDataStart; 
        return
      }
    }
    searchPos = searchPos + int64(1); 
  }
  this.scanDataLen = this.dataLen - this.scanDataStart; 
}
func (this *JPEGDecoder) parseMarkers () bool {
  var pos int64= int64(0);
  if  this.dataLen < int64(2) {
    fmt.Println( "Error: File too small" )
    return false
  }
  var m1 int64= int64(this.data[int64(0)]);
  var m2 int64= int64(this.data[int64(1)]);
  if  (m1 != int64(255)) || (m2 != int64(216)) {
    fmt.Println( "Error: Not a JPEG file (missing SOI)" )
    return false
  }
  pos = int64(2); 
  fmt.Println( "Parsing JPEG markers..." )
  for pos < (this.dataLen - int64(1)) {
    var marker1 int64= int64(this.data[pos]);
    if  marker1 != int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    var marker2 int64= int64(this.data[(pos + int64(1))]);
    if  marker2 == int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    if  marker2 == int64(0) {
      pos = pos + int64(2); 
      continue;
    }
    if  marker2 == int64(216) {
      pos = pos + int64(2); 
      continue;
    }
    if  marker2 == int64(217) {
      fmt.Println( "  End of Image" )
      return true
    }
    if  (marker2 >= int64(208)) && (marker2 <= int64(215)) {
      pos = pos + int64(2); 
      continue;
    }
    if  (pos + int64(4)) > this.dataLen {
      return true
    }
    var markerLen int64= this.readUint16BE((pos + int64(2)));
    var dataStart int64= pos + int64(4);
    var markerDataLen int64= markerLen - int64(2);
    if  marker2 == int64(192) {
      fmt.Println( "  SOF0 (Baseline DCT)" )
      this.parseSOF(dataStart, markerDataLen);
    }
    if  marker2 == int64(193) {
      fmt.Println( "  SOF1 (Extended Sequential DCT)" )
      this.parseSOF(dataStart, markerDataLen);
    }
    if  marker2 == int64(194) {
      fmt.Println( "  SOF2 (Progressive DCT) - NOT SUPPORTED" )
      return false
    }
    if  marker2 == int64(196) {
      fmt.Println( "  DHT (Huffman Tables)" )
      this.huffman.value.(*HuffmanDecoder).parseDHT(this.data, dataStart, markerDataLen);
    }
    if  marker2 == int64(219) {
      fmt.Println( "  DQT (Quantization Tables)" )
      this.parseDQT(dataStart, markerDataLen);
    }
    if  marker2 == int64(221) {
      this.restartInterval = this.readUint16BE(dataStart); 
      fmt.Println( ("  DRI (Restart Interval: " + (strconv.FormatInt(this.restartInterval, 10))) + ")" )
    }
    if  marker2 == int64(218) {
      fmt.Println( "  SOS (Start of Scan)" )
      this.parseSOS(dataStart, markerDataLen);
      pos = this.scanDataStart + this.scanDataLen; 
      continue;
    }
    if  marker2 == int64(224) {
      fmt.Println( "  APP0 (JFIF)" )
    }
    if  marker2 == int64(225) {
      fmt.Println( "  APP1 (EXIF)" )
    }
    if  marker2 == int64(254) {
      fmt.Println( "  COM (Comment)" )
    }
    pos = (pos + int64(2)) + markerLen; 
  }
  return true
}
func (this *JPEGDecoder) decodeBlock (reader *BitReader, comp *JPEGComponent, quantTable *QuantizationTable) []int64 {
  var coeffs []int64= make([]int64, int64(64));
  for i := int64(0); i < int64(64); i++ { coeffs[i] = int64(0) }
  var dcTable *HuffmanTable= this.huffman.value.(*HuffmanDecoder).getDCTable(comp.dcTableId);
  var dcCategory int64= dcTable.decode(reader);
  var dcDiff int64= reader.receiveExtend(dcCategory);
  var dcValue int64= comp.prevDC + dcDiff;
  comp.prevDC = dcValue; 
  var dcQuant int64= quantTable.values[int64(0)];
  coeffs[int64(0)] = dcValue * dcQuant
  var acTable *HuffmanTable= this.huffman.value.(*HuffmanDecoder).getACTable(comp.acTableId);
  var k int64= int64(1);
  for k < int64(64) {
    var acSymbol int64= acTable.decode(reader);
    if  acSymbol == int64(0) {
      k = int64(64); 
    } else {
      var runLength int64= int64(acSymbol >> uint(int64(4)));
      var acCategory int64= int64(acSymbol & int64(15));
      if  acSymbol == int64(240) {
        k = k + int64(16); 
      } else {
        k = k + runLength; 
        if  k < int64(64) {
          var acValue int64= reader.receiveExtend(acCategory);
          var acQuant int64= quantTable.values[k];
          coeffs[k] = acValue * acQuant
          k = k + int64(1); 
        }
      }
    }
  }
  return coeffs
}
func (this *JPEGDecoder) decode (dirPath string, fileName string) *ImageBuffer {
  this.data = func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }(); 
  this.dataLen = int64(len(this.data)); 
  fmt.Println( ((("Decoding JPEG: " + fileName) + " (") + (strconv.FormatInt(this.dataLen, 10))) + " bytes)" )
  var ok bool= this.parseMarkers();
  if  ok == false {
    fmt.Println( "Error parsing JPEG markers" )
    var errImg *ImageBuffer= CreateNew_ImageBuffer();
    errImg.init(int64(1), int64(1));
    return errImg
  }
  if  (this.width == int64(0)) || (this.height == int64(0)) {
    fmt.Println( "Error: Invalid image dimensions" )
    var errImg_1 *ImageBuffer= CreateNew_ImageBuffer();
    errImg_1.init(int64(1), int64(1));
    return errImg_1
  }
  fmt.Println( ("Decoding " + (strconv.FormatInt(this.scanDataLen, 10))) + " bytes of scan data..." )
  var img *ImageBuffer= CreateNew_ImageBuffer();
  img.init(this.width, this.height);
  var reader *BitReader= CreateNew_BitReader();
  reader.init(this.data, this.scanDataStart, this.scanDataLen);
  var c int64= int64(0);
  for c < this.numComponents {
    var comp *JPEGComponent= this.components[c];
    comp.prevDC = int64(0); 
    c = c + int64(1); 
  }
  var yBlocksData []int64 = make([]int64, 0);
  var yBlockCount int64= int64(0);
  var cbBlock []int64 = make([]int64, 0);
  var crBlock []int64 = make([]int64, 0);
  var mcuCount int64= int64(0);
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      if  ((this.restartInterval > int64(0)) && (mcuCount > int64(0))) && ((mcuCount % this.restartInterval) == int64(0)) {
        c = int64(0); 
        for c < this.numComponents {
          var compRst *JPEGComponent= this.components[c];
          compRst.prevDC = int64(0); 
          c = c + int64(1); 
        }
        reader.alignToByte();
        reader.skipRestartMarker();
      }
      yBlocksData = yBlocksData[:0]
      yBlockCount = int64(0); 
      var compIdx int64= int64(0);
      for compIdx < this.numComponents {
        var comp_1 *JPEGComponent= this.components[compIdx];
        var quantTable *QuantizationTable= this.quantTables[comp_1.quantTableId];
        var blockV int64= int64(0);
        for blockV < comp_1.vSamp {
          var blockH int64= int64(0);
          for blockH < comp_1.hSamp {
            var coeffs []int64= this.decodeBlock(reader, comp_1, quantTable);
            var blockPixels []int64= make([]int64, int64(64));
            for i := int64(0); i < int64(64); i++ { blockPixels[i] = int64(0) }
            var tempBlock []int64= this.idct.value.(*IDCT).dezigzag(coeffs);
            this.idct.value.(*IDCT).transform(tempBlock, blockPixels);
            if  compIdx == int64(0) {
              var bi int64= int64(0);
              for bi < int64(64) {
                yBlocksData = append(yBlocksData,blockPixels[bi]); 
                bi = bi + int64(1); 
              }
              yBlockCount = yBlockCount + int64(1); 
            }
            if  compIdx == int64(1) {
              cbBlock = cbBlock[:0]
              var bi_1 int64= int64(0);
              for bi_1 < int64(64) {
                cbBlock = append(cbBlock,blockPixels[bi_1]); 
                bi_1 = bi_1 + int64(1); 
              }
            }
            if  compIdx == int64(2) {
              crBlock = crBlock[:0]
              var bi_2 int64= int64(0);
              for bi_2 < int64(64) {
                crBlock = append(crBlock,blockPixels[bi_2]); 
                bi_2 = bi_2 + int64(1); 
              }
            }
            blockH = blockH + int64(1); 
          }
          blockV = blockV + int64(1); 
        }
        compIdx = compIdx + int64(1); 
      }
      this.writeMCU(img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock);
      mcuX = mcuX + int64(1); 
      mcuCount = mcuCount + int64(1); 
    }
    mcuY = mcuY + int64(1); 
    if  (mcuY % int64(10)) == int64(0) {
      fmt.Println( (("  Row " + (strconv.FormatInt(mcuY, 10))) + "/") + (strconv.FormatInt(this.mcusPerCol, 10)) )
    }
  }
  fmt.Println( "Decode complete!" )
  return img
}
func (this *JPEGDecoder) writeMCU (img *ImageBuffer, mcuX int64, mcuY int64, yBlocksData []int64, yBlockCount int64, cbBlock []int64, crBlock []int64) () {
  var baseX int64= mcuX * this.mcuWidth;
  var baseY int64= mcuY * this.mcuHeight;
  /** unused:  comp0*/
  if  (this.maxHSamp == int64(1)) && (this.maxVSamp == int64(1)) {
    var py int64= int64(0);
    for py < int64(8) {
      var px int64= int64(0);
      for px < int64(8) {
        var imgX int64= baseX + px;
        var imgY int64= baseY + py;
        if  (imgX < this.width) && (imgY < this.height) {
          var idx int64= (py * int64(8)) + px;
          var y int64= yBlocksData[idx];
          var cb int64= int64(128);
          var cr int64= int64(128);
          if  this.numComponents >= int64(3) {
            cb = cbBlock[idx]; 
            cr = crBlock[idx]; 
          }
          var r int64= y + (int64((int64(359) * (cr - int64(128))) >> uint(int64(8))));
          var g int64= (y - (int64((int64(88) * (cb - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr - int64(128))) >> uint(int64(8))));
          var b int64= y + (int64((int64(454) * (cb - int64(128))) >> uint(int64(8))));
          if  r < int64(0) {
            r = int64(0); 
          }
          if  r > int64(255) {
            r = int64(255); 
          }
          if  g < int64(0) {
            g = int64(0); 
          }
          if  g > int64(255) {
            g = int64(255); 
          }
          if  b < int64(0) {
            b = int64(0); 
          }
          if  b > int64(255) {
            b = int64(255); 
          }
          img.setPixelRGB(imgX, imgY, r, g, b);
        }
        px = px + int64(1); 
      }
      py = py + int64(1); 
    }
    return
  }
  if  (this.maxHSamp == int64(2)) && (this.maxVSamp == int64(2)) {
    var blockIdx int64= int64(0);
    var blockY int64= int64(0);
    for blockY < int64(2) {
      var blockX int64= int64(0);
      for blockX < int64(2) {
        var yBlockOffset int64= blockIdx * int64(64);
        var py_1 int64= int64(0);
        for py_1 < int64(8) {
          var px_1 int64= int64(0);
          for px_1 < int64(8) {
            var imgX_1 int64= (baseX + (blockX * int64(8))) + px_1;
            var imgY_1 int64= (baseY + (blockY * int64(8))) + py_1;
            if  (imgX_1 < this.width) && (imgY_1 < this.height) {
              var yIdx int64= (yBlockOffset + (py_1 * int64(8))) + px_1;
              var y_1 int64= yBlocksData[yIdx];
              var chromaX int64= (blockX * int64(4)) + (int64(px_1 >> uint(int64(1))));
              var chromaY int64= (blockY * int64(4)) + (int64(py_1 >> uint(int64(1))));
              var chromaIdx int64= (chromaY * int64(8)) + chromaX;
              var cb_1 int64= int64(128);
              var cr_1 int64= int64(128);
              if  this.numComponents >= int64(3) {
                cb_1 = cbBlock[chromaIdx]; 
                cr_1 = crBlock[chromaIdx]; 
              }
              var r_1 int64= y_1 + (int64((int64(359) * (cr_1 - int64(128))) >> uint(int64(8))));
              var g_1 int64= (y_1 - (int64((int64(88) * (cb_1 - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr_1 - int64(128))) >> uint(int64(8))));
              var b_1 int64= y_1 + (int64((int64(454) * (cb_1 - int64(128))) >> uint(int64(8))));
              if  r_1 < int64(0) {
                r_1 = int64(0); 
              }
              if  r_1 > int64(255) {
                r_1 = int64(255); 
              }
              if  g_1 < int64(0) {
                g_1 = int64(0); 
              }
              if  g_1 > int64(255) {
                g_1 = int64(255); 
              }
              if  b_1 < int64(0) {
                b_1 = int64(0); 
              }
              if  b_1 > int64(255) {
                b_1 = int64(255); 
              }
              img.setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
            }
            px_1 = px_1 + int64(1); 
          }
          py_1 = py_1 + int64(1); 
        }
        blockIdx = blockIdx + int64(1); 
        blockX = blockX + int64(1); 
      }
      blockY = blockY + int64(1); 
    }
    return
  }
  if  (this.maxHSamp == int64(2)) && (this.maxVSamp == int64(1)) {
    var blockX_1 int64= int64(0);
    for blockX_1 < int64(2) {
      var yBlockOffset_1 int64= blockX_1 * int64(64);
      var py_2 int64= int64(0);
      for py_2 < int64(8) {
        var px_2 int64= int64(0);
        for px_2 < int64(8) {
          var imgX_2 int64= (baseX + (blockX_1 * int64(8))) + px_2;
          var imgY_2 int64= baseY + py_2;
          if  (imgX_2 < this.width) && (imgY_2 < this.height) {
            var yIdx_1 int64= (yBlockOffset_1 + (py_2 * int64(8))) + px_2;
            var y_2 int64= yBlocksData[yIdx_1];
            var chromaX_1 int64= (blockX_1 * int64(4)) + (int64(px_2 >> uint(int64(1))));
            var chromaY_1 int64= py_2;
            var chromaIdx_1 int64= (chromaY_1 * int64(8)) + chromaX_1;
            var cb_2 int64= int64(128);
            var cr_2 int64= int64(128);
            if  this.numComponents >= int64(3) {
              cb_2 = cbBlock[chromaIdx_1]; 
              cr_2 = crBlock[chromaIdx_1]; 
            }
            var r_2 int64= y_2 + (int64((int64(359) * (cr_2 - int64(128))) >> uint(int64(8))));
            var g_2 int64= (y_2 - (int64((int64(88) * (cb_2 - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr_2 - int64(128))) >> uint(int64(8))));
            var b_2 int64= y_2 + (int64((int64(454) * (cb_2 - int64(128))) >> uint(int64(8))));
            if  r_2 < int64(0) {
              r_2 = int64(0); 
            }
            if  r_2 > int64(255) {
              r_2 = int64(255); 
            }
            if  g_2 < int64(0) {
              g_2 = int64(0); 
            }
            if  g_2 > int64(255) {
              g_2 = int64(255); 
            }
            if  b_2 < int64(0) {
              b_2 = int64(0); 
            }
            if  b_2 > int64(255) {
              b_2 = int64(255); 
            }
            img.setPixelRGB(imgX_2, imgY_2, r_2, g_2, b_2);
          }
          px_2 = px_2 + int64(1); 
        }
        py_2 = py_2 + int64(1); 
      }
      blockX_1 = blockX_1 + int64(1); 
    }
    return
  }
  if  yBlockCount > int64(0) {
    var py_3 int64= int64(0);
    for py_3 < int64(8) {
      var px_3 int64= int64(0);
      for px_3 < int64(8) {
        var imgX_3 int64= baseX + px_3;
        var imgY_3 int64= baseY + py_3;
        if  (imgX_3 < this.width) && (imgY_3 < this.height) {
          var y_3 int64= yBlocksData[((py_3 * int64(8)) + px_3)];
          img.setPixelRGB(imgX_3, imgY_3, y_3, y_3, y_3);
        }
        px_3 = px_3 + int64(1); 
      }
      py_3 = py_3 + int64(1); 
    }
  }
}
type FDCT struct { 
  cosTable []int64 `json:"cosTable"` 
  zigzagOrder []int64 `json:"zigzagOrder"` 
}

func CreateNew_FDCT() *FDCT {
  me := new(FDCT)
  me.cosTable = 
  make([]int64, int64(64))
  
  me.zigzagOrder = 
  make([]int64, int64(64))
  
  me.cosTable[int64(0)] = int64(1024)
  me.cosTable[int64(1)] = int64(1004)
  me.cosTable[int64(2)] = int64(946)
  me.cosTable[int64(3)] = int64(851)
  me.cosTable[int64(4)] = int64(724)
  me.cosTable[int64(5)] = int64(569)
  me.cosTable[int64(6)] = int64(392)
  me.cosTable[int64(7)] = int64(200)
  me.cosTable[int64(8)] = int64(1024)
  me.cosTable[int64(9)] = int64(851)
  me.cosTable[int64(10)] = int64(392)
  me.cosTable[int64(11)] = int64(-200)
  me.cosTable[int64(12)] = int64(-724)
  me.cosTable[int64(13)] = int64(-1004)
  me.cosTable[int64(14)] = int64(-946)
  me.cosTable[int64(15)] = int64(-569)
  me.cosTable[int64(16)] = int64(1024)
  me.cosTable[int64(17)] = int64(569)
  me.cosTable[int64(18)] = int64(-392)
  me.cosTable[int64(19)] = int64(-1004)
  me.cosTable[int64(20)] = int64(-724)
  me.cosTable[int64(21)] = int64(200)
  me.cosTable[int64(22)] = int64(946)
  me.cosTable[int64(23)] = int64(851)
  me.cosTable[int64(24)] = int64(1024)
  me.cosTable[int64(25)] = int64(200)
  me.cosTable[int64(26)] = int64(-946)
  me.cosTable[int64(27)] = int64(-569)
  me.cosTable[int64(28)] = int64(724)
  me.cosTable[int64(29)] = int64(851)
  me.cosTable[int64(30)] = int64(-392)
  me.cosTable[int64(31)] = int64(-1004)
  me.cosTable[int64(32)] = int64(1024)
  me.cosTable[int64(33)] = int64(-200)
  me.cosTable[int64(34)] = int64(-946)
  me.cosTable[int64(35)] = int64(569)
  me.cosTable[int64(36)] = int64(724)
  me.cosTable[int64(37)] = int64(-851)
  me.cosTable[int64(38)] = int64(-392)
  me.cosTable[int64(39)] = int64(1004)
  me.cosTable[int64(40)] = int64(1024)
  me.cosTable[int64(41)] = int64(-569)
  me.cosTable[int64(42)] = int64(-392)
  me.cosTable[int64(43)] = int64(1004)
  me.cosTable[int64(44)] = int64(-724)
  me.cosTable[int64(45)] = int64(-200)
  me.cosTable[int64(46)] = int64(946)
  me.cosTable[int64(47)] = int64(-851)
  me.cosTable[int64(48)] = int64(1024)
  me.cosTable[int64(49)] = int64(-851)
  me.cosTable[int64(50)] = int64(392)
  me.cosTable[int64(51)] = int64(200)
  me.cosTable[int64(52)] = int64(-724)
  me.cosTable[int64(53)] = int64(1004)
  me.cosTable[int64(54)] = int64(-946)
  me.cosTable[int64(55)] = int64(569)
  me.cosTable[int64(56)] = int64(1024)
  me.cosTable[int64(57)] = int64(-1004)
  me.cosTable[int64(58)] = int64(946)
  me.cosTable[int64(59)] = int64(-851)
  me.cosTable[int64(60)] = int64(724)
  me.cosTable[int64(61)] = int64(-569)
  me.cosTable[int64(62)] = int64(392)
  me.cosTable[int64(63)] = int64(-200)
  me.zigzagOrder[int64(0)] = int64(0)
  me.zigzagOrder[int64(1)] = int64(1)
  me.zigzagOrder[int64(2)] = int64(8)
  me.zigzagOrder[int64(3)] = int64(16)
  me.zigzagOrder[int64(4)] = int64(9)
  me.zigzagOrder[int64(5)] = int64(2)
  me.zigzagOrder[int64(6)] = int64(3)
  me.zigzagOrder[int64(7)] = int64(10)
  me.zigzagOrder[int64(8)] = int64(17)
  me.zigzagOrder[int64(9)] = int64(24)
  me.zigzagOrder[int64(10)] = int64(32)
  me.zigzagOrder[int64(11)] = int64(25)
  me.zigzagOrder[int64(12)] = int64(18)
  me.zigzagOrder[int64(13)] = int64(11)
  me.zigzagOrder[int64(14)] = int64(4)
  me.zigzagOrder[int64(15)] = int64(5)
  me.zigzagOrder[int64(16)] = int64(12)
  me.zigzagOrder[int64(17)] = int64(19)
  me.zigzagOrder[int64(18)] = int64(26)
  me.zigzagOrder[int64(19)] = int64(33)
  me.zigzagOrder[int64(20)] = int64(40)
  me.zigzagOrder[int64(21)] = int64(48)
  me.zigzagOrder[int64(22)] = int64(41)
  me.zigzagOrder[int64(23)] = int64(34)
  me.zigzagOrder[int64(24)] = int64(27)
  me.zigzagOrder[int64(25)] = int64(20)
  me.zigzagOrder[int64(26)] = int64(13)
  me.zigzagOrder[int64(27)] = int64(6)
  me.zigzagOrder[int64(28)] = int64(7)
  me.zigzagOrder[int64(29)] = int64(14)
  me.zigzagOrder[int64(30)] = int64(21)
  me.zigzagOrder[int64(31)] = int64(28)
  me.zigzagOrder[int64(32)] = int64(35)
  me.zigzagOrder[int64(33)] = int64(42)
  me.zigzagOrder[int64(34)] = int64(49)
  me.zigzagOrder[int64(35)] = int64(56)
  me.zigzagOrder[int64(36)] = int64(57)
  me.zigzagOrder[int64(37)] = int64(50)
  me.zigzagOrder[int64(38)] = int64(43)
  me.zigzagOrder[int64(39)] = int64(36)
  me.zigzagOrder[int64(40)] = int64(29)
  me.zigzagOrder[int64(41)] = int64(22)
  me.zigzagOrder[int64(42)] = int64(15)
  me.zigzagOrder[int64(43)] = int64(23)
  me.zigzagOrder[int64(44)] = int64(30)
  me.zigzagOrder[int64(45)] = int64(37)
  me.zigzagOrder[int64(46)] = int64(44)
  me.zigzagOrder[int64(47)] = int64(51)
  me.zigzagOrder[int64(48)] = int64(58)
  me.zigzagOrder[int64(49)] = int64(59)
  me.zigzagOrder[int64(50)] = int64(52)
  me.zigzagOrder[int64(51)] = int64(45)
  me.zigzagOrder[int64(52)] = int64(38)
  me.zigzagOrder[int64(53)] = int64(31)
  me.zigzagOrder[int64(54)] = int64(39)
  me.zigzagOrder[int64(55)] = int64(46)
  me.zigzagOrder[int64(56)] = int64(53)
  me.zigzagOrder[int64(57)] = int64(60)
  me.zigzagOrder[int64(58)] = int64(61)
  me.zigzagOrder[int64(59)] = int64(54)
  me.zigzagOrder[int64(60)] = int64(47)
  me.zigzagOrder[int64(61)] = int64(55)
  me.zigzagOrder[int64(62)] = int64(62)
  me.zigzagOrder[int64(63)] = int64(63)
  return me;
}
func (this *FDCT) dct1d (input []int64, startIdx int64, stride int64, output []int64, outIdx int64, outStride int64) () {
  var u int64= int64(0);
  for u < int64(8) {
    var sum int64= int64(0);
    var x int64= int64(0);
    for x < int64(8) {
      var pixel int64= input[(startIdx + (x * stride))];
      var cosVal int64= this.cosTable[((x * int64(8)) + u)];
      sum = sum + (pixel * cosVal); 
      x = x + int64(1); 
    }
    if  u == int64(0) {
      sum = int64((sum * int64(724)) >> uint(int64(10))); 
    }
    output[outIdx + (u * outStride)] = int64(sum >> uint(int64(11)))
    u = u + int64(1); 
  }
}
func (this *FDCT) transform (pixels []int64) []int64 {
  var shifted []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    shifted[i] = (pixels[i]) - int64(128)
    i = i + int64(1); 
  }
  var temp []int64= make([]int64, int64(64));
  var row int64= int64(0);
  for row < int64(8) {
    var rowStart int64= row * int64(8);
    this.dct1d(shifted, rowStart, int64(1), temp, rowStart, int64(1));
    row = row + int64(1); 
  }
  var coeffs []int64= make([]int64, int64(64));
  var col int64= int64(0);
  for col < int64(8) {
    this.dct1d(temp, col, int64(8), coeffs, col, int64(8));
    col = col + int64(1); 
  }
  return coeffs
}
func (this *FDCT) zigzag (block []int64) []int64 {
  var zigzagOut []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    var pos int64= this.zigzagOrder[i];
    zigzagOut[i] = block[pos]
    i = i + int64(1); 
  }
  return zigzagOut
}
type BitWriter struct { 
  buffer *GrowableBuffer `json:"buffer"` 
  bitBuffer int64 `json:"bitBuffer"` 
  bitCount int64 `json:"bitCount"` 
}

func CreateNew_BitWriter() *BitWriter {
  me := new(BitWriter)
  me.buffer = CreateNew_GrowableBuffer()
  me.bitBuffer = int64(0)
  me.bitCount = int64(0)
  return me;
}
func (this *BitWriter) writeBit (bit int64) () {
  this.bitBuffer = int64(this.bitBuffer << uint(int64(1))); 
  this.bitBuffer = int64(this.bitBuffer | (int64(bit & int64(1)))); 
  this.bitCount = this.bitCount + int64(1); 
  if  this.bitCount == int64(8) {
    this.flushByte();
  }
}
func (this *BitWriter) writeBits (value int64, numBits int64) () {
  var i int64= numBits - int64(1);
  for i >= int64(0) {
    var bit int64= int64((int64(value >> uint(i))) & int64(1));
    this.writeBit(bit);
    i = i - int64(1); 
  }
}
func (this *BitWriter) flushByte () () {
  if  this.bitCount > int64(0) {
    for this.bitCount < int64(8) {
      this.bitBuffer = int64(this.bitBuffer << uint(int64(1))); 
      this.bitBuffer = int64(this.bitBuffer | int64(1)); 
      this.bitCount = this.bitCount + int64(1); 
    }
    this.buffer.writeByte(this.bitBuffer);
    if  this.bitBuffer == int64(255) {
      this.buffer.writeByte(int64(0));
    }
    this.bitBuffer = int64(0); 
    this.bitCount = int64(0); 
  }
}
func (this *BitWriter) writeByte (b int64) () {
  this.flushByte();
  this.buffer.writeByte(b);
}
func (this *BitWriter) writeWord (w int64) () {
  this.writeByte(int64(w >> uint(int64(8))));
  this.writeByte(int64(w & int64(255)));
}
func (this *BitWriter) getBuffer () []byte {
  this.flushByte();
  return this.buffer.toBuffer()
}
func (this *BitWriter) getLength () int64 {
  return (this.buffer).size()
}
type JPEGEncoder struct { 
  fdct *GoNullable `json:"fdct"` 
  quality int64 `json:"quality"` 
  yQuantTable []int64 `json:"yQuantTable"` 
  cQuantTable []int64 `json:"cQuantTable"` 
  stdYQuant []int64 `json:"stdYQuant"` 
  stdCQuant []int64 `json:"stdCQuant"` 
  dcYBits []int64 `json:"dcYBits"` 
  dcYValues []int64 `json:"dcYValues"` 
  acYBits []int64 `json:"acYBits"` 
  acYValues []int64 `json:"acYValues"` 
  dcCBits []int64 `json:"dcCBits"` 
  dcCValues []int64 `json:"dcCValues"` 
  acCBits []int64 `json:"acCBits"` 
  acCValues []int64 `json:"acCValues"` 
  dcYCodes []int64 `json:"dcYCodes"` 
  dcYLengths []int64 `json:"dcYLengths"` 
  acYCodes []int64 `json:"acYCodes"` 
  acYLengths []int64 `json:"acYLengths"` 
  dcCCodes []int64 `json:"dcCCodes"` 
  dcCLengths []int64 `json:"dcCLengths"` 
  acCCodes []int64 `json:"acCCodes"` 
  acCLengths []int64 `json:"acCLengths"` 
  prevDCY int64 `json:"prevDCY"` 
  prevDCCb int64 `json:"prevDCCb"` 
  prevDCCr int64 `json:"prevDCCr"` 
}

func CreateNew_JPEGEncoder() *JPEGEncoder {
  me := new(JPEGEncoder)
  me.quality = int64(75)
  me.yQuantTable = make([]int64,0)
  me.cQuantTable = make([]int64,0)
  me.stdYQuant = make([]int64,0)
  me.stdCQuant = make([]int64,0)
  me.dcYBits = make([]int64,0)
  me.dcYValues = make([]int64,0)
  me.acYBits = make([]int64,0)
  me.acYValues = make([]int64,0)
  me.dcCBits = make([]int64,0)
  me.dcCValues = make([]int64,0)
  me.acCBits = make([]int64,0)
  me.acCValues = make([]int64,0)
  me.dcYCodes = make([]int64,0)
  me.dcYLengths = make([]int64,0)
  me.acYCodes = make([]int64,0)
  me.acYLengths = make([]int64,0)
  me.dcCCodes = make([]int64,0)
  me.dcCLengths = make([]int64,0)
  me.acCCodes = make([]int64,0)
  me.acCLengths = make([]int64,0)
  me.prevDCY = int64(0)
  me.prevDCCb = int64(0)
  me.prevDCCr = int64(0)
  me.fdct = new(GoNullable);
  me.fdct.value = CreateNew_FDCT();
  me.fdct.has_value = true; /* detected as non-optional */
  me.initQuantTables();
  me.initHuffmanTables();
  return me;
}
func (this *JPEGEncoder) initQuantTables () () {
  this.stdYQuant = append(this.stdYQuant,int64(16)); 
  this.stdYQuant = append(this.stdYQuant,int64(11)); 
  this.stdYQuant = append(this.stdYQuant,int64(10)); 
  this.stdYQuant = append(this.stdYQuant,int64(16)); 
  this.stdYQuant = append(this.stdYQuant,int64(24)); 
  this.stdYQuant = append(this.stdYQuant,int64(40)); 
  this.stdYQuant = append(this.stdYQuant,int64(51)); 
  this.stdYQuant = append(this.stdYQuant,int64(61)); 
  this.stdYQuant = append(this.stdYQuant,int64(12)); 
  this.stdYQuant = append(this.stdYQuant,int64(12)); 
  this.stdYQuant = append(this.stdYQuant,int64(14)); 
  this.stdYQuant = append(this.stdYQuant,int64(19)); 
  this.stdYQuant = append(this.stdYQuant,int64(26)); 
  this.stdYQuant = append(this.stdYQuant,int64(58)); 
  this.stdYQuant = append(this.stdYQuant,int64(60)); 
  this.stdYQuant = append(this.stdYQuant,int64(55)); 
  this.stdYQuant = append(this.stdYQuant,int64(14)); 
  this.stdYQuant = append(this.stdYQuant,int64(13)); 
  this.stdYQuant = append(this.stdYQuant,int64(16)); 
  this.stdYQuant = append(this.stdYQuant,int64(24)); 
  this.stdYQuant = append(this.stdYQuant,int64(40)); 
  this.stdYQuant = append(this.stdYQuant,int64(57)); 
  this.stdYQuant = append(this.stdYQuant,int64(69)); 
  this.stdYQuant = append(this.stdYQuant,int64(56)); 
  this.stdYQuant = append(this.stdYQuant,int64(14)); 
  this.stdYQuant = append(this.stdYQuant,int64(17)); 
  this.stdYQuant = append(this.stdYQuant,int64(22)); 
  this.stdYQuant = append(this.stdYQuant,int64(29)); 
  this.stdYQuant = append(this.stdYQuant,int64(51)); 
  this.stdYQuant = append(this.stdYQuant,int64(87)); 
  this.stdYQuant = append(this.stdYQuant,int64(80)); 
  this.stdYQuant = append(this.stdYQuant,int64(62)); 
  this.stdYQuant = append(this.stdYQuant,int64(18)); 
  this.stdYQuant = append(this.stdYQuant,int64(22)); 
  this.stdYQuant = append(this.stdYQuant,int64(37)); 
  this.stdYQuant = append(this.stdYQuant,int64(56)); 
  this.stdYQuant = append(this.stdYQuant,int64(68)); 
  this.stdYQuant = append(this.stdYQuant,int64(109)); 
  this.stdYQuant = append(this.stdYQuant,int64(103)); 
  this.stdYQuant = append(this.stdYQuant,int64(77)); 
  this.stdYQuant = append(this.stdYQuant,int64(24)); 
  this.stdYQuant = append(this.stdYQuant,int64(35)); 
  this.stdYQuant = append(this.stdYQuant,int64(55)); 
  this.stdYQuant = append(this.stdYQuant,int64(64)); 
  this.stdYQuant = append(this.stdYQuant,int64(81)); 
  this.stdYQuant = append(this.stdYQuant,int64(104)); 
  this.stdYQuant = append(this.stdYQuant,int64(113)); 
  this.stdYQuant = append(this.stdYQuant,int64(92)); 
  this.stdYQuant = append(this.stdYQuant,int64(49)); 
  this.stdYQuant = append(this.stdYQuant,int64(64)); 
  this.stdYQuant = append(this.stdYQuant,int64(78)); 
  this.stdYQuant = append(this.stdYQuant,int64(87)); 
  this.stdYQuant = append(this.stdYQuant,int64(103)); 
  this.stdYQuant = append(this.stdYQuant,int64(121)); 
  this.stdYQuant = append(this.stdYQuant,int64(120)); 
  this.stdYQuant = append(this.stdYQuant,int64(101)); 
  this.stdYQuant = append(this.stdYQuant,int64(72)); 
  this.stdYQuant = append(this.stdYQuant,int64(92)); 
  this.stdYQuant = append(this.stdYQuant,int64(95)); 
  this.stdYQuant = append(this.stdYQuant,int64(98)); 
  this.stdYQuant = append(this.stdYQuant,int64(112)); 
  this.stdYQuant = append(this.stdYQuant,int64(100)); 
  this.stdYQuant = append(this.stdYQuant,int64(103)); 
  this.stdYQuant = append(this.stdYQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(17)); 
  this.stdCQuant = append(this.stdCQuant,int64(18)); 
  this.stdCQuant = append(this.stdCQuant,int64(24)); 
  this.stdCQuant = append(this.stdCQuant,int64(47)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(18)); 
  this.stdCQuant = append(this.stdCQuant,int64(21)); 
  this.stdCQuant = append(this.stdCQuant,int64(26)); 
  this.stdCQuant = append(this.stdCQuant,int64(66)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(24)); 
  this.stdCQuant = append(this.stdCQuant,int64(26)); 
  this.stdCQuant = append(this.stdCQuant,int64(56)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(47)); 
  this.stdCQuant = append(this.stdCQuant,int64(66)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.scaleQuantTables(this.quality);
}
func (this *JPEGEncoder) scaleQuantTables (q int64) () {
  var scale int64= int64(0);
  if  q < int64(50) {
    scale = int64((float64(int64(5000)) / float64(q))); 
  } else {
    scale = int64(200) - (q * int64(2)); 
  }
  this.yQuantTable = this.yQuantTable[:0]
  this.cQuantTable = this.cQuantTable[:0]
  var i int64= int64(0);
  for i < int64(64) {
    var yVal int64= int64((float64((((this.stdYQuant[i]) * scale) + int64(50))) / float64(int64(100))));
    if  yVal < int64(1) {
      yVal = int64(1); 
    }
    if  yVal > int64(255) {
      yVal = int64(255); 
    }
    this.yQuantTable = append(this.yQuantTable,yVal); 
    var cVal int64= int64((float64((((this.stdCQuant[i]) * scale) + int64(50))) / float64(int64(100))));
    if  cVal < int64(1) {
      cVal = int64(1); 
    }
    if  cVal > int64(255) {
      cVal = int64(255); 
    }
    this.cQuantTable = append(this.cQuantTable,cVal); 
    i = i + int64(1); 
  }
}
func (this *JPEGEncoder) initHuffmanTables () () {
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(5)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYValues = append(this.dcYValues,int64(0)); 
  this.dcYValues = append(this.dcYValues,int64(1)); 
  this.dcYValues = append(this.dcYValues,int64(2)); 
  this.dcYValues = append(this.dcYValues,int64(3)); 
  this.dcYValues = append(this.dcYValues,int64(4)); 
  this.dcYValues = append(this.dcYValues,int64(5)); 
  this.dcYValues = append(this.dcYValues,int64(6)); 
  this.dcYValues = append(this.dcYValues,int64(7)); 
  this.dcYValues = append(this.dcYValues,int64(8)); 
  this.dcYValues = append(this.dcYValues,int64(9)); 
  this.dcYValues = append(this.dcYValues,int64(10)); 
  this.dcYValues = append(this.dcYValues,int64(11)); 
  this.acYBits = append(this.acYBits,int64(0)); 
  this.acYBits = append(this.acYBits,int64(2)); 
  this.acYBits = append(this.acYBits,int64(1)); 
  this.acYBits = append(this.acYBits,int64(3)); 
  this.acYBits = append(this.acYBits,int64(3)); 
  this.acYBits = append(this.acYBits,int64(2)); 
  this.acYBits = append(this.acYBits,int64(4)); 
  this.acYBits = append(this.acYBits,int64(3)); 
  this.acYBits = append(this.acYBits,int64(5)); 
  this.acYBits = append(this.acYBits,int64(5)); 
  this.acYBits = append(this.acYBits,int64(4)); 
  this.acYBits = append(this.acYBits,int64(4)); 
  this.acYBits = append(this.acYBits,int64(0)); 
  this.acYBits = append(this.acYBits,int64(0)); 
  this.acYBits = append(this.acYBits,int64(1)); 
  this.acYBits = append(this.acYBits,int64(125)); 
  this.acYValues = append(this.acYValues,int64(1)); 
  this.acYValues = append(this.acYValues,int64(2)); 
  this.acYValues = append(this.acYValues,int64(3)); 
  this.acYValues = append(this.acYValues,int64(0)); 
  this.acYValues = append(this.acYValues,int64(4)); 
  this.acYValues = append(this.acYValues,int64(17)); 
  this.acYValues = append(this.acYValues,int64(5)); 
  this.acYValues = append(this.acYValues,int64(18)); 
  this.acYValues = append(this.acYValues,int64(33)); 
  this.acYValues = append(this.acYValues,int64(49)); 
  this.acYValues = append(this.acYValues,int64(65)); 
  this.acYValues = append(this.acYValues,int64(6)); 
  this.acYValues = append(this.acYValues,int64(19)); 
  this.acYValues = append(this.acYValues,int64(81)); 
  this.acYValues = append(this.acYValues,int64(97)); 
  this.acYValues = append(this.acYValues,int64(7)); 
  this.acYValues = append(this.acYValues,int64(34)); 
  this.acYValues = append(this.acYValues,int64(113)); 
  this.acYValues = append(this.acYValues,int64(20)); 
  this.acYValues = append(this.acYValues,int64(50)); 
  this.acYValues = append(this.acYValues,int64(129)); 
  this.acYValues = append(this.acYValues,int64(145)); 
  this.acYValues = append(this.acYValues,int64(161)); 
  this.acYValues = append(this.acYValues,int64(8)); 
  this.acYValues = append(this.acYValues,int64(35)); 
  this.acYValues = append(this.acYValues,int64(66)); 
  this.acYValues = append(this.acYValues,int64(177)); 
  this.acYValues = append(this.acYValues,int64(193)); 
  this.acYValues = append(this.acYValues,int64(21)); 
  this.acYValues = append(this.acYValues,int64(82)); 
  this.acYValues = append(this.acYValues,int64(209)); 
  this.acYValues = append(this.acYValues,int64(240)); 
  this.acYValues = append(this.acYValues,int64(36)); 
  this.acYValues = append(this.acYValues,int64(51)); 
  this.acYValues = append(this.acYValues,int64(98)); 
  this.acYValues = append(this.acYValues,int64(114)); 
  this.acYValues = append(this.acYValues,int64(130)); 
  this.acYValues = append(this.acYValues,int64(9)); 
  this.acYValues = append(this.acYValues,int64(10)); 
  this.acYValues = append(this.acYValues,int64(22)); 
  this.acYValues = append(this.acYValues,int64(23)); 
  this.acYValues = append(this.acYValues,int64(24)); 
  this.acYValues = append(this.acYValues,int64(25)); 
  this.acYValues = append(this.acYValues,int64(26)); 
  this.acYValues = append(this.acYValues,int64(37)); 
  this.acYValues = append(this.acYValues,int64(38)); 
  this.acYValues = append(this.acYValues,int64(39)); 
  this.acYValues = append(this.acYValues,int64(40)); 
  this.acYValues = append(this.acYValues,int64(41)); 
  this.acYValues = append(this.acYValues,int64(42)); 
  this.acYValues = append(this.acYValues,int64(52)); 
  this.acYValues = append(this.acYValues,int64(53)); 
  this.acYValues = append(this.acYValues,int64(54)); 
  this.acYValues = append(this.acYValues,int64(55)); 
  this.acYValues = append(this.acYValues,int64(56)); 
  this.acYValues = append(this.acYValues,int64(57)); 
  this.acYValues = append(this.acYValues,int64(58)); 
  this.acYValues = append(this.acYValues,int64(67)); 
  this.acYValues = append(this.acYValues,int64(68)); 
  this.acYValues = append(this.acYValues,int64(69)); 
  this.acYValues = append(this.acYValues,int64(70)); 
  this.acYValues = append(this.acYValues,int64(71)); 
  this.acYValues = append(this.acYValues,int64(72)); 
  this.acYValues = append(this.acYValues,int64(73)); 
  this.acYValues = append(this.acYValues,int64(74)); 
  this.acYValues = append(this.acYValues,int64(83)); 
  this.acYValues = append(this.acYValues,int64(84)); 
  this.acYValues = append(this.acYValues,int64(85)); 
  this.acYValues = append(this.acYValues,int64(86)); 
  this.acYValues = append(this.acYValues,int64(87)); 
  this.acYValues = append(this.acYValues,int64(88)); 
  this.acYValues = append(this.acYValues,int64(89)); 
  this.acYValues = append(this.acYValues,int64(90)); 
  this.acYValues = append(this.acYValues,int64(99)); 
  this.acYValues = append(this.acYValues,int64(100)); 
  this.acYValues = append(this.acYValues,int64(101)); 
  this.acYValues = append(this.acYValues,int64(102)); 
  this.acYValues = append(this.acYValues,int64(103)); 
  this.acYValues = append(this.acYValues,int64(104)); 
  this.acYValues = append(this.acYValues,int64(105)); 
  this.acYValues = append(this.acYValues,int64(106)); 
  this.acYValues = append(this.acYValues,int64(115)); 
  this.acYValues = append(this.acYValues,int64(116)); 
  this.acYValues = append(this.acYValues,int64(117)); 
  this.acYValues = append(this.acYValues,int64(118)); 
  this.acYValues = append(this.acYValues,int64(119)); 
  this.acYValues = append(this.acYValues,int64(120)); 
  this.acYValues = append(this.acYValues,int64(121)); 
  this.acYValues = append(this.acYValues,int64(122)); 
  this.acYValues = append(this.acYValues,int64(131)); 
  this.acYValues = append(this.acYValues,int64(132)); 
  this.acYValues = append(this.acYValues,int64(133)); 
  this.acYValues = append(this.acYValues,int64(134)); 
  this.acYValues = append(this.acYValues,int64(135)); 
  this.acYValues = append(this.acYValues,int64(136)); 
  this.acYValues = append(this.acYValues,int64(137)); 
  this.acYValues = append(this.acYValues,int64(138)); 
  this.acYValues = append(this.acYValues,int64(146)); 
  this.acYValues = append(this.acYValues,int64(147)); 
  this.acYValues = append(this.acYValues,int64(148)); 
  this.acYValues = append(this.acYValues,int64(149)); 
  this.acYValues = append(this.acYValues,int64(150)); 
  this.acYValues = append(this.acYValues,int64(151)); 
  this.acYValues = append(this.acYValues,int64(152)); 
  this.acYValues = append(this.acYValues,int64(153)); 
  this.acYValues = append(this.acYValues,int64(154)); 
  this.acYValues = append(this.acYValues,int64(162)); 
  this.acYValues = append(this.acYValues,int64(163)); 
  this.acYValues = append(this.acYValues,int64(164)); 
  this.acYValues = append(this.acYValues,int64(165)); 
  this.acYValues = append(this.acYValues,int64(166)); 
  this.acYValues = append(this.acYValues,int64(167)); 
  this.acYValues = append(this.acYValues,int64(168)); 
  this.acYValues = append(this.acYValues,int64(169)); 
  this.acYValues = append(this.acYValues,int64(170)); 
  this.acYValues = append(this.acYValues,int64(178)); 
  this.acYValues = append(this.acYValues,int64(179)); 
  this.acYValues = append(this.acYValues,int64(180)); 
  this.acYValues = append(this.acYValues,int64(181)); 
  this.acYValues = append(this.acYValues,int64(182)); 
  this.acYValues = append(this.acYValues,int64(183)); 
  this.acYValues = append(this.acYValues,int64(184)); 
  this.acYValues = append(this.acYValues,int64(185)); 
  this.acYValues = append(this.acYValues,int64(186)); 
  this.acYValues = append(this.acYValues,int64(194)); 
  this.acYValues = append(this.acYValues,int64(195)); 
  this.acYValues = append(this.acYValues,int64(196)); 
  this.acYValues = append(this.acYValues,int64(197)); 
  this.acYValues = append(this.acYValues,int64(198)); 
  this.acYValues = append(this.acYValues,int64(199)); 
  this.acYValues = append(this.acYValues,int64(200)); 
  this.acYValues = append(this.acYValues,int64(201)); 
  this.acYValues = append(this.acYValues,int64(202)); 
  this.acYValues = append(this.acYValues,int64(210)); 
  this.acYValues = append(this.acYValues,int64(211)); 
  this.acYValues = append(this.acYValues,int64(212)); 
  this.acYValues = append(this.acYValues,int64(213)); 
  this.acYValues = append(this.acYValues,int64(214)); 
  this.acYValues = append(this.acYValues,int64(215)); 
  this.acYValues = append(this.acYValues,int64(216)); 
  this.acYValues = append(this.acYValues,int64(217)); 
  this.acYValues = append(this.acYValues,int64(218)); 
  this.acYValues = append(this.acYValues,int64(225)); 
  this.acYValues = append(this.acYValues,int64(226)); 
  this.acYValues = append(this.acYValues,int64(227)); 
  this.acYValues = append(this.acYValues,int64(228)); 
  this.acYValues = append(this.acYValues,int64(229)); 
  this.acYValues = append(this.acYValues,int64(230)); 
  this.acYValues = append(this.acYValues,int64(231)); 
  this.acYValues = append(this.acYValues,int64(232)); 
  this.acYValues = append(this.acYValues,int64(233)); 
  this.acYValues = append(this.acYValues,int64(234)); 
  this.acYValues = append(this.acYValues,int64(241)); 
  this.acYValues = append(this.acYValues,int64(242)); 
  this.acYValues = append(this.acYValues,int64(243)); 
  this.acYValues = append(this.acYValues,int64(244)); 
  this.acYValues = append(this.acYValues,int64(245)); 
  this.acYValues = append(this.acYValues,int64(246)); 
  this.acYValues = append(this.acYValues,int64(247)); 
  this.acYValues = append(this.acYValues,int64(248)); 
  this.acYValues = append(this.acYValues,int64(249)); 
  this.acYValues = append(this.acYValues,int64(250)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(3)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCValues = append(this.dcCValues,int64(0)); 
  this.dcCValues = append(this.dcCValues,int64(1)); 
  this.dcCValues = append(this.dcCValues,int64(2)); 
  this.dcCValues = append(this.dcCValues,int64(3)); 
  this.dcCValues = append(this.dcCValues,int64(4)); 
  this.dcCValues = append(this.dcCValues,int64(5)); 
  this.dcCValues = append(this.dcCValues,int64(6)); 
  this.dcCValues = append(this.dcCValues,int64(7)); 
  this.dcCValues = append(this.dcCValues,int64(8)); 
  this.dcCValues = append(this.dcCValues,int64(9)); 
  this.dcCValues = append(this.dcCValues,int64(10)); 
  this.dcCValues = append(this.dcCValues,int64(11)); 
  this.acCBits = append(this.acCBits,int64(0)); 
  this.acCBits = append(this.acCBits,int64(2)); 
  this.acCBits = append(this.acCBits,int64(1)); 
  this.acCBits = append(this.acCBits,int64(2)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(3)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(7)); 
  this.acCBits = append(this.acCBits,int64(5)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(0)); 
  this.acCBits = append(this.acCBits,int64(1)); 
  this.acCBits = append(this.acCBits,int64(2)); 
  this.acCBits = append(this.acCBits,int64(119)); 
  this.acCValues = append(this.acCValues,int64(0)); 
  this.acCValues = append(this.acCValues,int64(1)); 
  this.acCValues = append(this.acCValues,int64(2)); 
  this.acCValues = append(this.acCValues,int64(3)); 
  this.acCValues = append(this.acCValues,int64(17)); 
  this.acCValues = append(this.acCValues,int64(4)); 
  this.acCValues = append(this.acCValues,int64(5)); 
  this.acCValues = append(this.acCValues,int64(33)); 
  this.acCValues = append(this.acCValues,int64(49)); 
  this.acCValues = append(this.acCValues,int64(6)); 
  this.acCValues = append(this.acCValues,int64(18)); 
  this.acCValues = append(this.acCValues,int64(65)); 
  this.acCValues = append(this.acCValues,int64(81)); 
  this.acCValues = append(this.acCValues,int64(7)); 
  this.acCValues = append(this.acCValues,int64(97)); 
  this.acCValues = append(this.acCValues,int64(113)); 
  this.acCValues = append(this.acCValues,int64(19)); 
  this.acCValues = append(this.acCValues,int64(34)); 
  this.acCValues = append(this.acCValues,int64(50)); 
  this.acCValues = append(this.acCValues,int64(129)); 
  this.acCValues = append(this.acCValues,int64(8)); 
  this.acCValues = append(this.acCValues,int64(20)); 
  this.acCValues = append(this.acCValues,int64(66)); 
  this.acCValues = append(this.acCValues,int64(145)); 
  this.acCValues = append(this.acCValues,int64(161)); 
  this.acCValues = append(this.acCValues,int64(177)); 
  this.acCValues = append(this.acCValues,int64(193)); 
  this.acCValues = append(this.acCValues,int64(9)); 
  this.acCValues = append(this.acCValues,int64(35)); 
  this.acCValues = append(this.acCValues,int64(51)); 
  this.acCValues = append(this.acCValues,int64(82)); 
  this.acCValues = append(this.acCValues,int64(240)); 
  this.acCValues = append(this.acCValues,int64(21)); 
  this.acCValues = append(this.acCValues,int64(98)); 
  this.acCValues = append(this.acCValues,int64(114)); 
  this.acCValues = append(this.acCValues,int64(209)); 
  this.acCValues = append(this.acCValues,int64(10)); 
  this.acCValues = append(this.acCValues,int64(22)); 
  this.acCValues = append(this.acCValues,int64(36)); 
  this.acCValues = append(this.acCValues,int64(52)); 
  this.acCValues = append(this.acCValues,int64(225)); 
  this.acCValues = append(this.acCValues,int64(37)); 
  this.acCValues = append(this.acCValues,int64(241)); 
  this.acCValues = append(this.acCValues,int64(23)); 
  this.acCValues = append(this.acCValues,int64(24)); 
  this.acCValues = append(this.acCValues,int64(25)); 
  this.acCValues = append(this.acCValues,int64(26)); 
  this.acCValues = append(this.acCValues,int64(38)); 
  this.acCValues = append(this.acCValues,int64(39)); 
  this.acCValues = append(this.acCValues,int64(40)); 
  this.acCValues = append(this.acCValues,int64(41)); 
  this.acCValues = append(this.acCValues,int64(42)); 
  this.acCValues = append(this.acCValues,int64(53)); 
  this.acCValues = append(this.acCValues,int64(54)); 
  this.acCValues = append(this.acCValues,int64(55)); 
  this.acCValues = append(this.acCValues,int64(56)); 
  this.acCValues = append(this.acCValues,int64(57)); 
  this.acCValues = append(this.acCValues,int64(58)); 
  this.acCValues = append(this.acCValues,int64(67)); 
  this.acCValues = append(this.acCValues,int64(68)); 
  this.acCValues = append(this.acCValues,int64(69)); 
  this.acCValues = append(this.acCValues,int64(70)); 
  this.acCValues = append(this.acCValues,int64(71)); 
  this.acCValues = append(this.acCValues,int64(72)); 
  this.acCValues = append(this.acCValues,int64(73)); 
  this.acCValues = append(this.acCValues,int64(74)); 
  this.acCValues = append(this.acCValues,int64(83)); 
  this.acCValues = append(this.acCValues,int64(84)); 
  this.acCValues = append(this.acCValues,int64(85)); 
  this.acCValues = append(this.acCValues,int64(86)); 
  this.acCValues = append(this.acCValues,int64(87)); 
  this.acCValues = append(this.acCValues,int64(88)); 
  this.acCValues = append(this.acCValues,int64(89)); 
  this.acCValues = append(this.acCValues,int64(90)); 
  this.acCValues = append(this.acCValues,int64(99)); 
  this.acCValues = append(this.acCValues,int64(100)); 
  this.acCValues = append(this.acCValues,int64(101)); 
  this.acCValues = append(this.acCValues,int64(102)); 
  this.acCValues = append(this.acCValues,int64(103)); 
  this.acCValues = append(this.acCValues,int64(104)); 
  this.acCValues = append(this.acCValues,int64(105)); 
  this.acCValues = append(this.acCValues,int64(106)); 
  this.acCValues = append(this.acCValues,int64(115)); 
  this.acCValues = append(this.acCValues,int64(116)); 
  this.acCValues = append(this.acCValues,int64(117)); 
  this.acCValues = append(this.acCValues,int64(118)); 
  this.acCValues = append(this.acCValues,int64(119)); 
  this.acCValues = append(this.acCValues,int64(120)); 
  this.acCValues = append(this.acCValues,int64(121)); 
  this.acCValues = append(this.acCValues,int64(122)); 
  this.acCValues = append(this.acCValues,int64(130)); 
  this.acCValues = append(this.acCValues,int64(131)); 
  this.acCValues = append(this.acCValues,int64(132)); 
  this.acCValues = append(this.acCValues,int64(133)); 
  this.acCValues = append(this.acCValues,int64(134)); 
  this.acCValues = append(this.acCValues,int64(135)); 
  this.acCValues = append(this.acCValues,int64(136)); 
  this.acCValues = append(this.acCValues,int64(137)); 
  this.acCValues = append(this.acCValues,int64(138)); 
  this.acCValues = append(this.acCValues,int64(146)); 
  this.acCValues = append(this.acCValues,int64(147)); 
  this.acCValues = append(this.acCValues,int64(148)); 
  this.acCValues = append(this.acCValues,int64(149)); 
  this.acCValues = append(this.acCValues,int64(150)); 
  this.acCValues = append(this.acCValues,int64(151)); 
  this.acCValues = append(this.acCValues,int64(152)); 
  this.acCValues = append(this.acCValues,int64(153)); 
  this.acCValues = append(this.acCValues,int64(154)); 
  this.acCValues = append(this.acCValues,int64(162)); 
  this.acCValues = append(this.acCValues,int64(163)); 
  this.acCValues = append(this.acCValues,int64(164)); 
  this.acCValues = append(this.acCValues,int64(165)); 
  this.acCValues = append(this.acCValues,int64(166)); 
  this.acCValues = append(this.acCValues,int64(167)); 
  this.acCValues = append(this.acCValues,int64(168)); 
  this.acCValues = append(this.acCValues,int64(169)); 
  this.acCValues = append(this.acCValues,int64(170)); 
  this.acCValues = append(this.acCValues,int64(178)); 
  this.acCValues = append(this.acCValues,int64(179)); 
  this.acCValues = append(this.acCValues,int64(180)); 
  this.acCValues = append(this.acCValues,int64(181)); 
  this.acCValues = append(this.acCValues,int64(182)); 
  this.acCValues = append(this.acCValues,int64(183)); 
  this.acCValues = append(this.acCValues,int64(184)); 
  this.acCValues = append(this.acCValues,int64(185)); 
  this.acCValues = append(this.acCValues,int64(186)); 
  this.acCValues = append(this.acCValues,int64(194)); 
  this.acCValues = append(this.acCValues,int64(195)); 
  this.acCValues = append(this.acCValues,int64(196)); 
  this.acCValues = append(this.acCValues,int64(197)); 
  this.acCValues = append(this.acCValues,int64(198)); 
  this.acCValues = append(this.acCValues,int64(199)); 
  this.acCValues = append(this.acCValues,int64(200)); 
  this.acCValues = append(this.acCValues,int64(201)); 
  this.acCValues = append(this.acCValues,int64(202)); 
  this.acCValues = append(this.acCValues,int64(210)); 
  this.acCValues = append(this.acCValues,int64(211)); 
  this.acCValues = append(this.acCValues,int64(212)); 
  this.acCValues = append(this.acCValues,int64(213)); 
  this.acCValues = append(this.acCValues,int64(214)); 
  this.acCValues = append(this.acCValues,int64(215)); 
  this.acCValues = append(this.acCValues,int64(216)); 
  this.acCValues = append(this.acCValues,int64(217)); 
  this.acCValues = append(this.acCValues,int64(218)); 
  this.acCValues = append(this.acCValues,int64(226)); 
  this.acCValues = append(this.acCValues,int64(227)); 
  this.acCValues = append(this.acCValues,int64(228)); 
  this.acCValues = append(this.acCValues,int64(229)); 
  this.acCValues = append(this.acCValues,int64(230)); 
  this.acCValues = append(this.acCValues,int64(231)); 
  this.acCValues = append(this.acCValues,int64(232)); 
  this.acCValues = append(this.acCValues,int64(233)); 
  this.acCValues = append(this.acCValues,int64(234)); 
  this.acCValues = append(this.acCValues,int64(242)); 
  this.acCValues = append(this.acCValues,int64(243)); 
  this.acCValues = append(this.acCValues,int64(244)); 
  this.acCValues = append(this.acCValues,int64(245)); 
  this.acCValues = append(this.acCValues,int64(246)); 
  this.acCValues = append(this.acCValues,int64(247)); 
  this.acCValues = append(this.acCValues,int64(248)); 
  this.acCValues = append(this.acCValues,int64(249)); 
  this.acCValues = append(this.acCValues,int64(250)); 
  var i int64= int64(0);
  for i < int64(256) {
    this.dcYCodes = append(this.dcYCodes,int64(0)); 
    this.dcYLengths = append(this.dcYLengths,int64(0)); 
    this.acYCodes = append(this.acYCodes,int64(0)); 
    this.acYLengths = append(this.acYLengths,int64(0)); 
    this.dcCCodes = append(this.dcCCodes,int64(0)); 
    this.dcCLengths = append(this.dcCLengths,int64(0)); 
    this.acCCodes = append(this.acCCodes,int64(0)); 
    this.acCLengths = append(this.acCLengths,int64(0)); 
    i = i + int64(1); 
  }
  this.buildHuffmanCodes(this.dcYBits, this.dcYValues, this.dcYCodes, this.dcYLengths);
  this.buildHuffmanCodes(this.acYBits, this.acYValues, this.acYCodes, this.acYLengths);
  this.buildHuffmanCodes(this.dcCBits, this.dcCValues, this.dcCCodes, this.dcCLengths);
  this.buildHuffmanCodes(this.acCBits, this.acCValues, this.acCCodes, this.acCLengths);
}
func (this *JPEGEncoder) buildHuffmanCodes (bits []int64, values []int64, codes []int64, lengths []int64) () {
  var code int64= int64(0);
  var valueIdx int64= int64(0);
  var bitLen int64= int64(1);
  for bitLen <= int64(16) {
    var count int64= bits[(bitLen - int64(1))];
    var j int64= int64(0);
    for j < count {
      var symbol int64= values[valueIdx];
      codes[symbol] = code;
      lengths[symbol] = bitLen;
      code = code + int64(1); 
      valueIdx = valueIdx + int64(1); 
      j = j + int64(1); 
    }
    code = int64(code << uint(int64(1))); 
    bitLen = bitLen + int64(1); 
  }
}
func (this *JPEGEncoder) getCategory (value int64) int64 {
  if  value < int64(0) {
    value = int64(0) - value; 
  }
  if  value == int64(0) {
    return int64(0)
  }
  var cat int64= int64(0);
  for value > int64(0) {
    cat = cat + int64(1); 
    value = int64(value >> uint(int64(1))); 
  }
  return cat
}
func (this *JPEGEncoder) encodeNumber (value int64, category int64) int64 {
  if  value < int64(0) {
    return value + ((int64(int64(1) << uint(category))) - int64(1))
  }
  return value
}
func (this *JPEGEncoder) encodeBlock (writer *BitWriter, coeffs []int64, quantTable []int64, dcCodes []int64, dcLengths []int64, acCodes []int64, acLengths []int64, prevDC int64) () {
  var quantized []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    var q int64= quantTable[i];
    var c int64= coeffs[i];
    var qVal int64= int64(0);
    if  c >= int64(0) {
      qVal = int64((float64((c + (int64(q >> uint(int64(1)))))) / float64(q))); 
    } else {
      qVal = int64((float64((c - (int64(q >> uint(int64(1)))))) / float64(q))); 
    }
    quantized[i] = qVal
    i = i + int64(1); 
  }
  var zigzagged []int64= this.fdct.value.(*FDCT).zigzag(quantized);
  var dc int64= zigzagged[int64(0)];
  var dcDiff int64= dc - prevDC;
  var dcCat int64= this.getCategory(dcDiff);
  var dcCode int64= dcCodes[dcCat];
  var dcLen int64= dcLengths[dcCat];
  writer.writeBits(dcCode, dcLen);
  if  dcCat > int64(0) {
    var dcVal int64= this.encodeNumber(dcDiff, dcCat);
    writer.writeBits(dcVal, dcCat);
  }
  var zeroRun int64= int64(0);
  var k int64= int64(1);
  for k < int64(64) {
    var ac int64= zigzagged[k];
    if  ac == int64(0) {
      zeroRun = zeroRun + int64(1); 
    } else {
      for zeroRun >= int64(16) {
        var zrlCode int64= acCodes[int64(240)];
        var zrlLen int64= acLengths[int64(240)];
        writer.writeBits(zrlCode, zrlLen);
        zeroRun = zeroRun - int64(16); 
      }
      var acCat int64= this.getCategory(ac);
      var runCat int64= int64((int64(zeroRun << uint(int64(4)))) | acCat);
      var acHuffCode int64= acCodes[runCat];
      var acHuffLen int64= acLengths[runCat];
      writer.writeBits(acHuffCode, acHuffLen);
      var acVal int64= this.encodeNumber(ac, acCat);
      writer.writeBits(acVal, acCat);
      zeroRun = int64(0); 
    }
    k = k + int64(1); 
  }
  if  zeroRun > int64(0) {
    var eobCode int64= acCodes[int64(0)];
    var eobLen int64= acLengths[int64(0)];
    writer.writeBits(eobCode, eobLen);
  }
}
func (this *JPEGEncoder) rgbToYCbCr (r int64, g int64, b int64, yOut []int64, cbOut []int64, crOut []int64) () {
  var y int64= int64((((int64(77) * r) + (int64(150) * g)) + (int64(29) * b)) >> uint(int64(8)));
  var cb int64= (int64((((int64(0) - (int64(43) * r)) - (int64(85) * g)) + (int64(128) * b)) >> uint(int64(8)))) + int64(128);
  var cr int64= (int64((((int64(128) * r) - (int64(107) * g)) - (int64(21) * b)) >> uint(int64(8)))) + int64(128);
  if  y < int64(0) {
    y = int64(0); 
  }
  if  y > int64(255) {
    y = int64(255); 
  }
  if  cb < int64(0) {
    cb = int64(0); 
  }
  if  cb > int64(255) {
    cb = int64(255); 
  }
  if  cr < int64(0) {
    cr = int64(0); 
  }
  if  cr > int64(255) {
    cr = int64(255); 
  }
  yOut = append(yOut,y); 
  cbOut = append(cbOut,cb); 
  crOut = append(crOut,cr); 
}
func (this *JPEGEncoder) extractBlock (img *ImageBuffer, blockX int64, blockY int64, channel int64) []int64 {
  var output []int64= make([]int64, int64(64));
  var idx int64= int64(0);
  var py int64= int64(0);
  for py < int64(8) {
    var px int64= int64(0);
    for px < int64(8) {
      var imgX int64= blockX + px;
      var imgY int64= blockY + py;
      if  imgX >= img.width {
        imgX = img.width - int64(1); 
      }
      if  imgY >= img.height {
        imgY = img.height - int64(1); 
      }
      var c *Color= img.getPixel(imgX, imgY);
      var y int64= int64((((int64(77) * c.r) + (int64(150) * c.g)) + (int64(29) * c.b)) >> uint(int64(8)));
      var cb int64= (int64((((int64(0) - (int64(43) * c.r)) - (int64(85) * c.g)) + (int64(128) * c.b)) >> uint(int64(8)))) + int64(128);
      var cr int64= (int64((((int64(128) * c.r) - (int64(107) * c.g)) - (int64(21) * c.b)) >> uint(int64(8)))) + int64(128);
      if  channel == int64(0) {
        output[idx] = y
      }
      if  channel == int64(1) {
        output[idx] = cb
      }
      if  channel == int64(2) {
        output[idx] = cr
      }
      idx = idx + int64(1); 
      px = px + int64(1); 
    }
    py = py + int64(1); 
  }
  return output
}
func (this *JPEGEncoder) writeMarkers (writer *BitWriter, width int64, height int64) () {
  writer.writeByte(int64(255));
  writer.writeByte(int64(216));
  writer.writeByte(int64(255));
  writer.writeByte(int64(224));
  writer.writeWord(int64(16));
  writer.writeByte(int64(74));
  writer.writeByte(int64(70));
  writer.writeByte(int64(73));
  writer.writeByte(int64(70));
  writer.writeByte(int64(0));
  writer.writeByte(int64(1));
  writer.writeByte(int64(1));
  writer.writeByte(int64(0));
  writer.writeWord(int64(1));
  writer.writeWord(int64(1));
  writer.writeByte(int64(0));
  writer.writeByte(int64(0));
  writer.writeByte(int64(255));
  writer.writeByte(int64(219));
  writer.writeWord(int64(67));
  writer.writeByte(int64(0));
  var i int64= int64(0);
  for i < int64(64) {
    writer.writeByte(this.yQuantTable[(this.fdct.value.(*FDCT).zigzagOrder[i])]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(219));
  writer.writeWord(int64(67));
  writer.writeByte(int64(1));
  i = int64(0); 
  for i < int64(64) {
    writer.writeByte(this.cQuantTable[(this.fdct.value.(*FDCT).zigzagOrder[i])]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(192));
  writer.writeWord(int64(17));
  writer.writeByte(int64(8));
  writer.writeWord(height);
  writer.writeWord(width);
  writer.writeByte(int64(3));
  writer.writeByte(int64(1));
  writer.writeByte(int64(17));
  writer.writeByte(int64(0));
  writer.writeByte(int64(2));
  writer.writeByte(int64(17));
  writer.writeByte(int64(1));
  writer.writeByte(int64(3));
  writer.writeByte(int64(17));
  writer.writeByte(int64(1));
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(31));
  writer.writeByte(int64(0));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.dcYBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(12) {
    writer.writeByte(this.dcYValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(181));
  writer.writeByte(int64(16));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.acYBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(162) {
    writer.writeByte(this.acYValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(31));
  writer.writeByte(int64(1));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.dcCBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(12) {
    writer.writeByte(this.dcCValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(181));
  writer.writeByte(int64(17));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.acCBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(162) {
    writer.writeByte(this.acCValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(218));
  writer.writeWord(int64(12));
  writer.writeByte(int64(3));
  writer.writeByte(int64(1));
  writer.writeByte(int64(0));
  writer.writeByte(int64(2));
  writer.writeByte(int64(17));
  writer.writeByte(int64(3));
  writer.writeByte(int64(17));
  writer.writeByte(int64(0));
  writer.writeByte(int64(63));
  writer.writeByte(int64(0));
}
func (this *JPEGEncoder) encodeToBuffer (img *ImageBuffer) []byte {
  var writer *BitWriter= CreateNew_BitWriter();
  this.writeMarkers(writer, img.width, img.height);
  var mcuWidth int64= int64((float64((img.width + int64(7))) / float64(int64(8))));
  var mcuHeight int64= int64((float64((img.height + int64(7))) / float64(int64(8))));
  this.prevDCY = int64(0); 
  this.prevDCCb = int64(0); 
  this.prevDCCr = int64(0); 
  var mcuY int64= int64(0);
  for mcuY < mcuHeight {
    var mcuX int64= int64(0);
    for mcuX < mcuWidth {
      var blockX int64= mcuX * int64(8);
      var blockY int64= mcuY * int64(8);
      var yBlock []int64= this.extractBlock(img, blockX, blockY, int64(0));
      var yCoeffs []int64= this.fdct.value.(*FDCT).transform(yBlock);
      this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
      var yZig []int64= this.fdct.value.(*FDCT).zigzag(yCoeffs);
      var yQ int64= this.yQuantTable[int64(0)];
      var yDC int64= yZig[int64(0)];
      if  yDC >= int64(0) {
        this.prevDCY = int64((float64((yDC + (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      } else {
        this.prevDCY = int64((float64((yDC - (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      }
      var cbBlock []int64= this.extractBlock(img, blockX, blockY, int64(1));
      var cbCoeffs []int64= this.fdct.value.(*FDCT).transform(cbBlock);
      this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
      var cbZig []int64= this.fdct.value.(*FDCT).zigzag(cbCoeffs);
      var cbQ int64= this.cQuantTable[int64(0)];
      var cbDC int64= cbZig[int64(0)];
      if  cbDC >= int64(0) {
        this.prevDCCb = int64((float64((cbDC + (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      } else {
        this.prevDCCb = int64((float64((cbDC - (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      }
      var crBlock []int64= this.extractBlock(img, blockX, blockY, int64(2));
      var crCoeffs []int64= this.fdct.value.(*FDCT).transform(crBlock);
      this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
      var crZig []int64= this.fdct.value.(*FDCT).zigzag(crCoeffs);
      var crQ int64= this.cQuantTable[int64(0)];
      var crDC int64= crZig[int64(0)];
      if  crDC >= int64(0) {
        this.prevDCCr = int64((float64((crDC + (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      } else {
        this.prevDCCr = int64((float64((crDC - (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
  writer.flushByte();
  var outBuf []byte= writer.getBuffer();
  var outLen int64= writer.getLength();
  var finalBuf []byte= make([]byte, (outLen + int64(2)));
  var i int64= int64(0);
  for i < outLen {
    finalBuf[i] = byte(int64(outBuf[i]))
    i = i + int64(1); 
  }
  finalBuf[outLen] = byte(int64(255))
  finalBuf[outLen + int64(1)] = byte(int64(217))
  return finalBuf
}
func (this *JPEGEncoder) encode (img *ImageBuffer, dirPath string, fileName string) () {
  fmt.Println( "Encoding JPEG: " + fileName )
  fmt.Println( (("  Image size: " + (strconv.FormatInt(img.width, 10))) + "x") + (strconv.FormatInt(img.height, 10)) )
  var writer *BitWriter= CreateNew_BitWriter();
  this.writeMarkers(writer, img.width, img.height);
  var mcuWidth int64= int64((float64((img.width + int64(7))) / float64(int64(8))));
  var mcuHeight int64= int64((float64((img.height + int64(7))) / float64(int64(8))));
  fmt.Println( (("  MCU grid: " + (strconv.FormatInt(mcuWidth, 10))) + "x") + (strconv.FormatInt(mcuHeight, 10)) )
  this.prevDCY = int64(0); 
  this.prevDCCb = int64(0); 
  this.prevDCCr = int64(0); 
  var mcuY int64= int64(0);
  for mcuY < mcuHeight {
    var mcuX int64= int64(0);
    for mcuX < mcuWidth {
      var blockX int64= mcuX * int64(8);
      var blockY int64= mcuY * int64(8);
      var yBlock []int64= this.extractBlock(img, blockX, blockY, int64(0));
      var yCoeffs []int64= this.fdct.value.(*FDCT).transform(yBlock);
      this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
      var yZig []int64= this.fdct.value.(*FDCT).zigzag(yCoeffs);
      var yQ int64= this.yQuantTable[int64(0)];
      var yDC int64= yZig[int64(0)];
      if  yDC >= int64(0) {
        this.prevDCY = int64((float64((yDC + (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      } else {
        this.prevDCY = int64((float64((yDC - (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      }
      var cbBlock []int64= this.extractBlock(img, blockX, blockY, int64(1));
      var cbCoeffs []int64= this.fdct.value.(*FDCT).transform(cbBlock);
      this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
      var cbZig []int64= this.fdct.value.(*FDCT).zigzag(cbCoeffs);
      var cbQ int64= this.cQuantTable[int64(0)];
      var cbDC int64= cbZig[int64(0)];
      if  cbDC >= int64(0) {
        this.prevDCCb = int64((float64((cbDC + (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      } else {
        this.prevDCCb = int64((float64((cbDC - (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      }
      var crBlock []int64= this.extractBlock(img, blockX, blockY, int64(2));
      var crCoeffs []int64= this.fdct.value.(*FDCT).transform(crBlock);
      this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
      var crZig []int64= this.fdct.value.(*FDCT).zigzag(crCoeffs);
      var crQ int64= this.cQuantTable[int64(0)];
      var crDC int64= crZig[int64(0)];
      if  crDC >= int64(0) {
        this.prevDCCr = int64((float64((crDC + (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      } else {
        this.prevDCCr = int64((float64((crDC - (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
  writer.flushByte();
  var outBuf []byte= writer.getBuffer();
  var outLen int64= writer.getLength();
  var finalBuf []byte= make([]byte, (outLen + int64(2)));
  var i int64= int64(0);
  for i < outLen {
    finalBuf[i] = byte(int64(outBuf[i]))
    i = i + int64(1); 
  }
  finalBuf[outLen] = byte(int64(255))
  finalBuf[outLen + int64(1)] = byte(int64(217))
  os.WriteFile(dirPath + "/" + fileName, finalBuf, 0644)
  fmt.Println( ("  Encoded size: " + (strconv.FormatInt((outLen + int64(2)), 10))) + " bytes" )
  fmt.Println( (("  Saved: " + dirPath) + "/") + fileName )
}
func (this *JPEGEncoder) setQuality (q int64) () {
  this.quality = q; 
  this.scaleQuantTables(q);
}
type CoeffBuffer struct { 
  coeffs []int64 `json:"coeffs"` 
  numBlocks int64 `json:"numBlocks"` 
}

func CreateNew_CoeffBuffer() *CoeffBuffer {
  me := new(CoeffBuffer)
  me.coeffs = make([]int64,0)
  me.numBlocks = int64(0)
  return me;
}
func (this *CoeffBuffer) init (blocks int64) () {
  this.numBlocks = blocks; 
  this.coeffs = this.coeffs[:0]
  var numCoeffs int64= blocks * int64(64);
  var i int64= int64(0);
  for i < numCoeffs {
    this.coeffs = append(this.coeffs,int64(0)); 
    i = i + int64(1); 
  }
}
func (this *CoeffBuffer) get (blockIdx int64, k int64) int64 {
  var offset int64= (blockIdx * int64(64)) + k;
  return this.coeffs[offset]
}
func (this *CoeffBuffer) setVal (blockIdx int64, k int64, value int64) () {
  var offset int64= (blockIdx * int64(64)) + k;
  this.coeffs[offset] = value;
}
type ProgressiveJPEGDecoder struct { 
  data []byte `json:"data"` 
  dataLen int64 `json:"dataLen"` 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  numComponents int64 `json:"numComponents"` 
  precision int64 `json:"precision"` 
  isProgressive bool `json:"isProgressive"` 
  components []*JPEGComponent `json:"components"` 
  quantTables []*QuantizationTable `json:"quantTables"` 
  huffman *HuffmanDecoder `json:"huffman"` 
  idct *IDCT `json:"idct"` 
  mcuWidth int64 `json:"mcuWidth"` 
  mcuHeight int64 `json:"mcuHeight"` 
  mcusPerRow int64 `json:"mcusPerRow"` 
  mcusPerCol int64 `json:"mcusPerCol"` 
  maxHSamp int64 `json:"maxHSamp"` 
  maxVSamp int64 `json:"maxVSamp"` 
  coeffBuffers []*CoeffBuffer `json:"coeffBuffers"` 
  scanSs int64 `json:"scanSs"` 
  scanSe int64 `json:"scanSe"` 
  scanAh int64 `json:"scanAh"` 
  scanAl int64 `json:"scanAl"` 
  eobrun int64 `json:"eobrun"` 
}

func CreateNew_ProgressiveJPEGDecoder() *ProgressiveJPEGDecoder {
  me := new(ProgressiveJPEGDecoder)
  me.data = 
  make([]byte, int64(0))
  
  me.dataLen = int64(0)
  me.width = int64(0)
  me.height = int64(0)
  me.numComponents = int64(0)
  me.precision = int64(8)
  me.isProgressive = false
  me.components = make([]*JPEGComponent,0)
  me.quantTables = make([]*QuantizationTable,0)
  me.huffman = CreateNew_HuffmanDecoder()
  me.idct = CreateNew_IDCT()
  me.mcuWidth = int64(8)
  me.mcuHeight = int64(8)
  me.mcusPerRow = int64(0)
  me.mcusPerCol = int64(0)
  me.maxHSamp = int64(1)
  me.maxVSamp = int64(1)
  me.coeffBuffers = make([]*CoeffBuffer,0)
  me.scanSs = int64(0)
  me.scanSe = int64(63)
  me.scanAh = int64(0)
  me.scanAl = int64(0)
  me.eobrun = int64(0)
  me.huffman = CreateNew_HuffmanDecoder(); 
  me.idct = CreateNew_IDCT(); 
  var i_5 int64= int64(0);
  for i_5 < int64(4) {
    me.quantTables = append(me.quantTables,CreateNew_QuantizationTable()); 
    i_5 = i_5 + int64(1); 
  }
  return me;
}
func (this *ProgressiveJPEGDecoder) readUint16BE (pos int64) int64 {
  var high int64= int64(this.data[pos]);
  var low int64= int64(this.data[(pos + int64(1))]);
  return (high * int64(256)) + low
}
func (this *ProgressiveJPEGDecoder) parseSOF (pos int64, length int64, sofType int64) () {
  this.precision = int64(this.data[pos]); 
  this.height = this.readUint16BE((pos + int64(1))); 
  this.width = this.readUint16BE((pos + int64(3))); 
  this.numComponents = int64(this.data[(pos + int64(5))]); 
  if  sofType == int64(2) {
    this.isProgressive = true; 
    fmt.Println( ((((("  Progressive JPEG: " + (strconv.FormatInt(this.width, 10))) + "x") + (strconv.FormatInt(this.height, 10))) + ", ") + (strconv.FormatInt(this.numComponents, 10))) + " components" )
  } else {
    this.isProgressive = false; 
    fmt.Println( ((((("  Baseline JPEG: " + (strconv.FormatInt(this.width, 10))) + "x") + (strconv.FormatInt(this.height, 10))) + ", ") + (strconv.FormatInt(this.numComponents, 10))) + " components" )
  }
  this.components = this.components[:0]
  this.maxHSamp = int64(1); 
  this.maxVSamp = int64(1); 
  var i int64= int64(0);
  var offset int64= pos + int64(6);
  for i < this.numComponents {
    var comp *JPEGComponent= CreateNew_JPEGComponent();
    comp.id = int64(this.data[offset]); 
    var sampling int64= int64(this.data[(offset + int64(1))]);
    comp.hSamp = int64(sampling >> uint(int64(4))); 
    comp.vSamp = int64(sampling & int64(15)); 
    comp.quantTableId = int64(this.data[(offset + int64(2))]); 
    if  comp.hSamp > this.maxHSamp {
      this.maxHSamp = comp.hSamp; 
    }
    if  comp.vSamp > this.maxVSamp {
      this.maxVSamp = comp.vSamp; 
    }
    this.components = append(this.components,comp); 
    fmt.Println( ((((("    Component " + (strconv.FormatInt(comp.id, 10))) + ": ") + (strconv.FormatInt(comp.hSamp, 10))) + "x") + (strconv.FormatInt(comp.vSamp, 10))) + " sampling" )
    offset = offset + int64(3); 
    i = i + int64(1); 
  }
  this.mcuWidth = this.maxHSamp * int64(8); 
  this.mcuHeight = this.maxVSamp * int64(8); 
  this.mcusPerRow = int64((float64(((this.width + this.mcuWidth) - int64(1))) / float64(this.mcuWidth))); 
  this.mcusPerCol = int64((float64(((this.height + this.mcuHeight) - int64(1))) / float64(this.mcuHeight))); 
  fmt.Println( (("  MCU grid: " + (strconv.FormatInt(this.mcusPerRow, 10))) + "x") + (strconv.FormatInt(this.mcusPerCol, 10)) )
  this.allocateCoeffBuffers();
}
func (this *ProgressiveJPEGDecoder) allocateCoeffBuffers () () {
  this.coeffBuffers = this.coeffBuffers[:0]
  var totalMCUs int64= this.mcusPerRow * this.mcusPerCol;
  var c int64= int64(0);
  for c < this.numComponents {
    var comp *JPEGComponent= this.components[c];
    var blocksInComp int64= (totalMCUs * comp.hSamp) * comp.vSamp;
    var buf *CoeffBuffer= CreateNew_CoeffBuffer();
    buf.init(blocksInComp);
    this.coeffBuffers = append(this.coeffBuffers,buf); 
    c = c + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) parseDQT (pos int64, length int64) () {
  var endPos int64= pos + length;
  for pos < endPos {
    var info int64= int64(this.data[pos]);
    pos = pos + int64(1); 
    var prec int64= int64(info >> uint(int64(4)));
    var tableId int64= int64(info & int64(15));
    var table *QuantizationTable= this.quantTables[tableId];
    table.id = tableId; 
    table.values = table.values[:0]
    var i int64= int64(0);
    for i < int64(64) {
      if  prec == int64(0) {
        table.values = append(table.values,int64(this.data[pos])); 
        pos = pos + int64(1); 
      } else {
        table.values = append(table.values,this.readUint16BE(pos)); 
        pos = pos + int64(2); 
      }
      i = i + int64(1); 
    }
    fmt.Println( "  Quantization table " + (strconv.FormatInt(tableId, 10)) )
  }
}
func (this *ProgressiveJPEGDecoder) parseSOS (pos int64, length int64) int64 {
  var numScanComponents int64= int64(this.data[pos]);
  pos = pos + int64(1); 
  var scanComponents []int64 = make([]int64, 0);
  var i int64= int64(0);
  for i < numScanComponents {
    var compId int64= int64(this.data[pos]);
    var tableSelect int64= int64(this.data[(pos + int64(1))]);
    pos = pos + int64(2); 
    var j int64= int64(0);
    for j < this.numComponents {
      var comp *JPEGComponent= this.components[j];
      if  comp.id == compId {
        comp.dcTableId = int64(tableSelect >> uint(int64(4))); 
        comp.acTableId = int64(tableSelect & int64(15)); 
        scanComponents = append(scanComponents,j); 
      }
      j = j + int64(1); 
    }
    i = i + int64(1); 
  }
  this.scanSs = int64(this.data[pos]); 
  this.scanSe = int64(this.data[(pos + int64(1))]); 
  var approx int64= int64(this.data[(pos + int64(2))]);
  this.scanAh = int64(approx >> uint(int64(4))); 
  this.scanAl = int64(approx & int64(15)); 
  pos = pos + int64(3); 
  var scanType string= "data";
  if  (this.scanSs == int64(0)) && (this.scanSe == int64(0)) {
    if  this.scanAh == int64(0) {
      scanType = "DC first"; 
    } else {
      scanType = "DC refine"; 
    }
  } else {
    if  this.scanAh == int64(0) {
      scanType = "AC first"; 
    } else {
      scanType = "AC refine"; 
    }
  }
  var compList string= "";
  var si int64= int64(0);
  for si < (int64(len(scanComponents))) {
    if  si > int64(0) {
      compList = compList + ","; 
    }
    compList = compList + (strconv.FormatInt((scanComponents[si]), 10)); 
    si = si + int64(1); 
  }
  fmt.Println( ((((((((((("    Scan: comps=[" + compList) + "] Ss=") + (strconv.FormatInt(this.scanSs, 10))) + " Se=") + (strconv.FormatInt(this.scanSe, 10))) + " Ah=") + (strconv.FormatInt(this.scanAh, 10))) + " Al=") + (strconv.FormatInt(this.scanAl, 10))) + " (") + scanType) + ")" )
  var scanStart int64= pos;
  var searchPos int64= pos;
  for searchPos < (this.dataLen - int64(1)) {
    var b int64= int64(this.data[searchPos]);
    if  b == int64(255) {
      var nextB int64= int64(this.data[(searchPos + int64(1))]);
      if  (nextB != int64(0)) && (nextB != int64(255)) {
        if  (nextB >= int64(208)) && (nextB <= int64(215)) {
          searchPos = searchPos + int64(2); 
          continue;
        }
        break;
      }
    }
    searchPos = searchPos + int64(1); 
  }
  var scanLen int64= searchPos - scanStart;
  var reader *BitReader= CreateNew_BitReader();
  reader.init(this.data, scanStart, scanLen);
  this.eobrun = int64(0); 
  if  (this.scanSs == int64(0)) && (this.scanAh == int64(0)) {
    var c int64= int64(0);
    for c < this.numComponents {
      var comp_1 *JPEGComponent= this.components[c];
      comp_1.prevDC = int64(0); 
      c = c + int64(1); 
    }
  }
  if  this.isProgressive {
    this.decodeProgressiveScan(reader, scanComponents);
  } else {
    this.decodeBaselineScan(reader, scanComponents);
  }
  return searchPos
}
func (this *ProgressiveJPEGDecoder) decodeProgressiveScan (reader *BitReader, scanComps []int64) () {
  var numScanComps int64= int64(len(scanComps));
  var isDCFirst bool= ((this.scanSs == int64(0)) && (this.scanSe == int64(0))) && (this.scanAh == int64(0));
  var isDCRefine bool= ((this.scanSs == int64(0)) && (this.scanSe == int64(0))) && (this.scanAh > int64(0));
  var isACFirst bool= (this.scanSs > int64(0)) && (this.scanAh == int64(0));
  var isACRefine bool= (this.scanSs > int64(0)) && (this.scanAh > int64(0));
  if  numScanComps > int64(1) {
    this.decodeInterleavedDC(reader, scanComps, isDCFirst, isDCRefine);
  } else {
    var compIdx int64= scanComps[int64(0)];
    if  isDCFirst {
      this.decodeDCFirst(reader, compIdx);
    }
    if  isDCRefine {
      this.decodeDCRefine(reader, compIdx);
    }
    if  isACFirst {
      this.decodeACFirst(reader, compIdx);
    }
    if  isACRefine {
      this.decodeACRefine(reader, compIdx);
    }
  }
}
func (this *ProgressiveJPEGDecoder) decodeInterleavedDC (reader *BitReader, scanComps []int64, isDCFirst bool, isDCRefine bool) () {
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      var mcuIdx int64= (mcuY * this.mcusPerRow) + mcuX;
      var sc int64= int64(0);
      var numScanComps int64= int64(len(scanComps));
      for sc < numScanComps {
        var compIdx int64= scanComps[sc];
        var comp *JPEGComponent= this.components[compIdx];
        var buf *CoeffBuffer= this.coeffBuffers[compIdx];
        var bv int64= int64(0);
        for bv < comp.vSamp {
          var bh int64= int64(0);
          for bh < comp.hSamp {
            var blockIdx int64= (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
            if  isDCFirst {
              var dcTable *HuffmanTable= this.huffman.getDCTable(comp.dcTableId);
              var dcCategory int64= dcTable.decode(reader);
              var dcDiff int64= reader.receiveExtend(dcCategory);
              var dcValue int64= comp.prevDC + dcDiff;
              comp.prevDC = dcValue; 
              buf.setVal(blockIdx, int64(0), int64(dcValue << uint(this.scanAl)));
            }
            if  isDCRefine {
              var bit int64= reader.readBit();
              var oldVal int64= (buf).get(blockIdx, int64(0));
              buf.setVal(blockIdx, int64(0), int64(oldVal | (int64(bit << uint(this.scanAl)))));
            }
            bh = bh + int64(1); 
          }
          bv = bv + int64(1); 
        }
        sc = sc + int64(1); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) decodeDCFirst (reader *BitReader, compIdx int64) () {
  var comp *JPEGComponent= this.components[compIdx];
  var buf *CoeffBuffer= this.coeffBuffers[compIdx];
  var dcTable *HuffmanTable= this.huffman.getDCTable(comp.dcTableId);
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      var mcuIdx int64= (mcuY * this.mcusPerRow) + mcuX;
      var bv int64= int64(0);
      for bv < comp.vSamp {
        var bh int64= int64(0);
        for bh < comp.hSamp {
          var blockIdx int64= (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
          var dcCategory int64= dcTable.decode(reader);
          var dcDiff int64= reader.receiveExtend(dcCategory);
          var dcValue int64= comp.prevDC + dcDiff;
          comp.prevDC = dcValue; 
          buf.setVal(blockIdx, int64(0), int64(dcValue << uint(this.scanAl)));
          bh = bh + int64(1); 
        }
        bv = bv + int64(1); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) decodeDCRefine (reader *BitReader, compIdx int64) () {
  var comp *JPEGComponent= this.components[compIdx];
  var buf *CoeffBuffer= this.coeffBuffers[compIdx];
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      var mcuIdx int64= (mcuY * this.mcusPerRow) + mcuX;
      var bv int64= int64(0);
      for bv < comp.vSamp {
        var bh int64= int64(0);
        for bh < comp.hSamp {
          var blockIdx int64= (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
          var bit int64= reader.readBit();
          var oldVal int64= (buf).get(blockIdx, int64(0));
          buf.setVal(blockIdx, int64(0), int64(oldVal | (int64(bit << uint(this.scanAl)))));
          bh = bh + int64(1); 
        }
        bv = bv + int64(1); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) decodeACFirst (reader *BitReader, compIdx int64) () {
  var comp *JPEGComponent= this.components[compIdx];
  var buf *CoeffBuffer= this.coeffBuffers[compIdx];
  var acTable *HuffmanTable= this.huffman.getACTable(comp.acTableId);
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      var mcuIdx int64= (mcuY * this.mcusPerRow) + mcuX;
      var bv int64= int64(0);
      for bv < comp.vSamp {
        var bh int64= int64(0);
        for bh < comp.hSamp {
          var blockIdx int64= (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
          if  this.eobrun > int64(0) {
            this.eobrun = this.eobrun - int64(1); 
          } else {
            var k int64= this.scanSs;
            for k <= this.scanSe {
              var symbol int64= acTable.decode(reader);
              var run int64= int64(symbol >> uint(int64(4)));
              var size int64= int64(symbol & int64(15));
              if  size == int64(0) {
                if  run == int64(15) {
                  k = k + int64(16); 
                } else {
                  if  run > int64(0) {
                    this.eobrun = int64(int64(1) << uint(run)); 
                    this.eobrun = this.eobrun + reader.readBits(run); 
                  } else {
                    this.eobrun = int64(1); 
                  }
                  this.eobrun = this.eobrun - int64(1); 
                  k = int64(64); 
                }
              } else {
                k = k + run; 
                if  k <= this.scanSe {
                  var acValue int64= reader.receiveExtend(size);
                  buf.setVal(blockIdx, k, int64(acValue << uint(this.scanAl)));
                  k = k + int64(1); 
                }
              }
            }
          }
          bh = bh + int64(1); 
        }
        bv = bv + int64(1); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) decodeACRefine (reader *BitReader, compIdx int64) () {
  var comp *JPEGComponent= this.components[compIdx];
  var buf *CoeffBuffer= this.coeffBuffers[compIdx];
  var acTable *HuffmanTable= this.huffman.getACTable(comp.acTableId);
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      var mcuIdx int64= (mcuY * this.mcusPerRow) + mcuX;
      var bv int64= int64(0);
      for bv < comp.vSamp {
        var bh int64= int64(0);
        for bh < comp.hSamp {
          var blockIdx int64= (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
          this.decodeACRefineBlock(reader, buf, blockIdx, acTable);
          bh = bh + int64(1); 
        }
        bv = bv + int64(1); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) decodeACRefineBlock (reader *BitReader, buf *CoeffBuffer, blockIdx int64, acTable *HuffmanTable) () {
  var k int64= this.scanSs;
  if  this.eobrun > int64(0) {
    for k <= this.scanSe {
      var oldVal int64= (buf).get(blockIdx, k);
      if  oldVal != int64(0) {
        var bit int64= reader.readBit();
        if  bit != int64(0) {
          if  oldVal > int64(0) {
            buf.setVal(blockIdx, k, int64(oldVal | (int64(int64(1) << uint(this.scanAl)))));
          } else {
            buf.setVal(blockIdx, k, oldVal - (int64(int64(1) << uint(this.scanAl))));
          }
        }
      }
      k = k + int64(1); 
    }
    this.eobrun = this.eobrun - int64(1); 
    return
  }
  for k <= this.scanSe {
    var symbol int64= acTable.decode(reader);
    var run int64= int64(symbol >> uint(int64(4)));
    var size int64= int64(symbol & int64(15));
    if  size == int64(0) {
      if  run == int64(15) {
        var zerosToSkip int64= int64(16);
        for (zerosToSkip > int64(0)) && (k <= this.scanSe) {
          var oldVal_1 int64= (buf).get(blockIdx, k);
          if  oldVal_1 != int64(0) {
            var bit_1 int64= reader.readBit();
            if  bit_1 != int64(0) {
              if  oldVal_1 > int64(0) {
                buf.setVal(blockIdx, k, int64(oldVal_1 | (int64(int64(1) << uint(this.scanAl)))));
              } else {
                buf.setVal(blockIdx, k, oldVal_1 - (int64(int64(1) << uint(this.scanAl))));
              }
            }
          } else {
            zerosToSkip = zerosToSkip - int64(1); 
          }
          k = k + int64(1); 
        }
      } else {
        if  run > int64(0) {
          this.eobrun = int64(int64(1) << uint(run)); 
          this.eobrun = this.eobrun + reader.readBits(run); 
        } else {
          this.eobrun = int64(1); 
        }
        for k <= this.scanSe {
          var oldVal_2 int64= (buf).get(blockIdx, k);
          if  oldVal_2 != int64(0) {
            var bit_2 int64= reader.readBit();
            if  bit_2 != int64(0) {
              if  oldVal_2 > int64(0) {
                buf.setVal(blockIdx, k, int64(oldVal_2 | (int64(int64(1) << uint(this.scanAl)))));
              } else {
                buf.setVal(blockIdx, k, oldVal_2 - (int64(int64(1) << uint(this.scanAl))));
              }
            }
          }
          k = k + int64(1); 
        }
        this.eobrun = this.eobrun - int64(1); 
      }
    } else {
      var signBit int64= reader.readBit();
      var newCoeff int64= int64(int64(1) << uint(this.scanAl));
      if  signBit == int64(0) {
        newCoeff = int64(0) - newCoeff; 
      }
      var zerosToSkip_1 int64= run;
      for k <= this.scanSe {
        var oldVal_3 int64= (buf).get(blockIdx, k);
        if  oldVal_3 != int64(0) {
          var bit_3 int64= reader.readBit();
          if  bit_3 != int64(0) {
            if  oldVal_3 > int64(0) {
              buf.setVal(blockIdx, k, int64(oldVal_3 | (int64(int64(1) << uint(this.scanAl)))));
            } else {
              buf.setVal(blockIdx, k, oldVal_3 - (int64(int64(1) << uint(this.scanAl))));
            }
          }
        } else {
          if  zerosToSkip_1 > int64(0) {
            zerosToSkip_1 = zerosToSkip_1 - int64(1); 
          } else {
            buf.setVal(blockIdx, k, newCoeff);
            k = k + int64(1); 
            break;
          }
        }
        k = k + int64(1); 
      }
    }
  }
}
func (this *ProgressiveJPEGDecoder) decodeBaselineScan (reader *BitReader, scanComps []int64) () {
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      var mcuIdx int64= (mcuY * this.mcusPerRow) + mcuX;
      var sc int64= int64(0);
      var numScanComps int64= int64(len(scanComps));
      for sc < numScanComps {
        var compIdx int64= scanComps[sc];
        var comp *JPEGComponent= this.components[compIdx];
        var quantTable *QuantizationTable= this.quantTables[comp.quantTableId];
        var buf *CoeffBuffer= this.coeffBuffers[compIdx];
        var bv int64= int64(0);
        for bv < comp.vSamp {
          var bh int64= int64(0);
          for bh < comp.hSamp {
            var blockIdx int64= (((mcuIdx * comp.hSamp) * comp.vSamp) + (bv * comp.hSamp)) + bh;
            var dcTable *HuffmanTable= this.huffman.getDCTable(comp.dcTableId);
            var dcCategory int64= dcTable.decode(reader);
            var dcDiff int64= reader.receiveExtend(dcCategory);
            var dcValue int64= comp.prevDC + dcDiff;
            comp.prevDC = dcValue; 
            var dcQuant int64= quantTable.values[int64(0)];
            buf.setVal(blockIdx, int64(0), dcValue * dcQuant);
            var acTable *HuffmanTable= this.huffman.getACTable(comp.acTableId);
            var k int64= int64(1);
            for k < int64(64) {
              var acSymbol int64= acTable.decode(reader);
              if  acSymbol == int64(0) {
                k = int64(64); 
              } else {
                var run int64= int64(acSymbol >> uint(int64(4)));
                var size int64= int64(acSymbol & int64(15));
                if  acSymbol == int64(240) {
                  k = k + int64(16); 
                } else {
                  k = k + run; 
                  if  k < int64(64) {
                    var acValue int64= reader.receiveExtend(size);
                    var acQuant int64= quantTable.values[k];
                    buf.setVal(blockIdx, k, acValue * acQuant);
                    k = k + int64(1); 
                  }
                }
              }
            }
            bh = bh + int64(1); 
          }
          bv = bv + int64(1); 
        }
        sc = sc + int64(1); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) parseMarkers () bool {
  var pos int64= int64(0);
  if  this.dataLen < int64(2) {
    fmt.Println( "Error: File too small" )
    return false
  }
  var m1 int64= int64(this.data[int64(0)]);
  var m2 int64= int64(this.data[int64(1)]);
  if  (m1 != int64(255)) || (m2 != int64(216)) {
    fmt.Println( "Error: Not a JPEG file" )
    return false
  }
  pos = int64(2); 
  fmt.Println( "Parsing JPEG markers..." )
  for pos < (this.dataLen - int64(1)) {
    var marker1 int64= int64(this.data[pos]);
    if  marker1 != int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    var marker2 int64= int64(this.data[(pos + int64(1))]);
    if  marker2 == int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    if  marker2 == int64(0) {
      pos = pos + int64(2); 
      continue;
    }
    if  marker2 == int64(216) {
      pos = pos + int64(2); 
      continue;
    }
    if  marker2 == int64(217) {
      fmt.Println( "  End of Image" )
      return true
    }
    if  (marker2 >= int64(208)) && (marker2 <= int64(215)) {
      pos = pos + int64(2); 
      continue;
    }
    if  (pos + int64(4)) > this.dataLen {
      return true
    }
    var markerLen int64= this.readUint16BE((pos + int64(2)));
    var dataStart int64= pos + int64(4);
    var markerDataLen int64= markerLen - int64(2);
    if  marker2 == int64(192) {
      fmt.Println( "  SOF0 (Baseline DCT)" )
      this.parseSOF(dataStart, markerDataLen, int64(0));
    }
    if  marker2 == int64(193) {
      fmt.Println( "  SOF1 (Extended Sequential)" )
      this.parseSOF(dataStart, markerDataLen, int64(1));
    }
    if  marker2 == int64(194) {
      fmt.Println( "  SOF2 (Progressive DCT)" )
      this.parseSOF(dataStart, markerDataLen, int64(2));
    }
    if  marker2 == int64(196) {
      fmt.Println( "  DHT (Huffman Tables)" )
      this.huffman.parseDHT(this.data, dataStart, markerDataLen);
    }
    if  marker2 == int64(219) {
      fmt.Println( "  DQT (Quantization Tables)" )
      this.parseDQT(dataStart, markerDataLen);
    }
    if  marker2 == int64(218) {
      fmt.Println( "  SOS (Start of Scan)" )
      var nextPos int64= this.parseSOS(dataStart, markerDataLen);
      pos = nextPos; 
      continue;
    }
    if  marker2 == int64(224) {
      fmt.Println( "  APP0 (JFIF)" )
    }
    if  marker2 == int64(225) {
      fmt.Println( "  APP1 (EXIF)" )
    }
    pos = (pos + int64(2)) + markerLen; 
  }
  return true
}
func (this *ProgressiveJPEGDecoder) dequantizeCoefficients () () {
  var c int64= int64(0);
  for c < this.numComponents {
    var comp *JPEGComponent= this.components[c];
    var quantTable *QuantizationTable= this.quantTables[comp.quantTableId];
    var buf *CoeffBuffer= this.coeffBuffers[c];
    var blockIdx int64= int64(0);
    for blockIdx < buf.numBlocks {
      var k int64= int64(0);
      for k < int64(64) {
        var oldVal int64= (buf).get(blockIdx, k);
        var quantVal int64= quantTable.values[k];
        buf.setVal(blockIdx, k, oldVal * quantVal);
        k = k + int64(1); 
      }
      blockIdx = blockIdx + int64(1); 
    }
    c = c + int64(1); 
  }
}
func (this *ProgressiveJPEGDecoder) buildImage () *ImageBuffer {
  if  this.isProgressive {
    fmt.Println( "Dequantizing coefficients..." )
    this.dequantizeCoefficients();
  }
  var img *ImageBuffer= CreateNew_ImageBuffer();
  img.init(this.width, this.height);
  fmt.Println( "Building image..." )
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      var mcuIdx int64= (mcuY * this.mcusPerRow) + mcuX;
      var baseX int64= mcuX * this.mcuWidth;
      var baseY int64= mcuY * this.mcuHeight;
      var comp0 *JPEGComponent= this.components[int64(0)];
      var yBuf *CoeffBuffer= this.coeffBuffers[int64(0)];
      var yBlocksData []int64 = make([]int64, 0);
      var bv int64= int64(0);
      for bv < comp0.vSamp {
        var bh int64= int64(0);
        for bh < comp0.hSamp {
          var blockIdx int64= (((mcuIdx * comp0.hSamp) * comp0.vSamp) + (bv * comp0.hSamp)) + bh;
          var blockCoeffs []int64= make([]int64, int64(64));
          var k int64= int64(0);
          for k < int64(64) {
            blockCoeffs[k] = (yBuf).get(blockIdx, k)
            k = k + int64(1); 
          }
          var tempBlock []int64= this.idct.dezigzag(blockCoeffs);
          var blockPixels []int64= make([]int64, int64(64));
          for i := int64(0); i < int64(64); i++ { blockPixels[i] = int64(0) }
          this.idct.transform(tempBlock, blockPixels);
          k = int64(0); 
          for k < int64(64) {
            yBlocksData = append(yBlocksData,blockPixels[k]); 
            k = k + int64(1); 
          }
          bh = bh + int64(1); 
        }
        bv = bv + int64(1); 
      }
      var cbBlock []int64 = make([]int64, 0);
      var crBlock []int64 = make([]int64, 0);
      if  this.numComponents >= int64(3) {
        var cbBuf *CoeffBuffer= this.coeffBuffers[int64(1)];
        var cbBlockIdx int64= mcuIdx;
        var blockCoeffs_1 []int64= make([]int64, int64(64));
        var k_1 int64= int64(0);
        for k_1 < int64(64) {
          blockCoeffs_1[k_1] = (cbBuf).get(cbBlockIdx, k_1)
          k_1 = k_1 + int64(1); 
        }
        var tempBlock_1 []int64= this.idct.dezigzag(blockCoeffs_1);
        var cbPixels []int64= make([]int64, int64(64));
        for i := int64(0); i < int64(64); i++ { cbPixels[i] = int64(0) }
        this.idct.transform(tempBlock_1, cbPixels);
        k_1 = int64(0); 
        for k_1 < int64(64) {
          cbBlock = append(cbBlock,cbPixels[k_1]); 
          k_1 = k_1 + int64(1); 
        }
        var crBuf *CoeffBuffer= this.coeffBuffers[int64(2)];
        var crBlockIdx int64= mcuIdx;
        var crCoeffs []int64= make([]int64, int64(64));
        k_1 = int64(0); 
        for k_1 < int64(64) {
          crCoeffs[k_1] = (crBuf).get(crBlockIdx, k_1)
          k_1 = k_1 + int64(1); 
        }
        var crTempBlock []int64= this.idct.dezigzag(crCoeffs);
        var crPixels []int64= make([]int64, int64(64));
        for i := int64(0); i < int64(64); i++ { crPixels[i] = int64(0) }
        this.idct.transform(crTempBlock, crPixels);
        k_1 = int64(0); 
        for k_1 < int64(64) {
          crBlock = append(crBlock,crPixels[k_1]); 
          k_1 = k_1 + int64(1); 
        }
      }
      this.writeMCU(img, baseX, baseY, yBlocksData, cbBlock, crBlock);
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
  return img
}
func (this *ProgressiveJPEGDecoder) writeMCU (img *ImageBuffer, baseX int64, baseY int64, yBlocksData []int64, cbBlock []int64, crBlock []int64) () {
  /** unused:  comp0*/
  if  (this.maxHSamp == int64(1)) && (this.maxVSamp == int64(1)) {
    var py int64= int64(0);
    for py < int64(8) {
      var px int64= int64(0);
      for px < int64(8) {
        var imgX int64= baseX + px;
        var imgY int64= baseY + py;
        if  (imgX < this.width) && (imgY < this.height) {
          var idx int64= (py * int64(8)) + px;
          var y int64= yBlocksData[idx];
          var cb int64= int64(128);
          var cr int64= int64(128);
          if  this.numComponents >= int64(3) {
            cb = cbBlock[idx]; 
            cr = crBlock[idx]; 
          }
          var r int64= y + (int64((int64(359) * (cr - int64(128))) >> uint(int64(8))));
          var g int64= (y - (int64((int64(88) * (cb - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr - int64(128))) >> uint(int64(8))));
          var b int64= y + (int64((int64(454) * (cb - int64(128))) >> uint(int64(8))));
          if  r < int64(0) {
            r = int64(0); 
          }
          if  r > int64(255) {
            r = int64(255); 
          }
          if  g < int64(0) {
            g = int64(0); 
          }
          if  g > int64(255) {
            g = int64(255); 
          }
          if  b < int64(0) {
            b = int64(0); 
          }
          if  b > int64(255) {
            b = int64(255); 
          }
          img.setPixelRGB(imgX, imgY, r, g, b);
        }
        px = px + int64(1); 
      }
      py = py + int64(1); 
    }
    return
  }
  if  (this.maxHSamp == int64(2)) && (this.maxVSamp == int64(2)) {
    var blockIdx int64= int64(0);
    var blockY int64= int64(0);
    for blockY < int64(2) {
      var blockX int64= int64(0);
      for blockX < int64(2) {
        var yBlockOffset int64= blockIdx * int64(64);
        var py_1 int64= int64(0);
        for py_1 < int64(8) {
          var px_1 int64= int64(0);
          for px_1 < int64(8) {
            var imgX_1 int64= (baseX + (blockX * int64(8))) + px_1;
            var imgY_1 int64= (baseY + (blockY * int64(8))) + py_1;
            if  (imgX_1 < this.width) && (imgY_1 < this.height) {
              var yIdx int64= (yBlockOffset + (py_1 * int64(8))) + px_1;
              var y_1 int64= yBlocksData[yIdx];
              var chromaX int64= (blockX * int64(4)) + (int64(px_1 >> uint(int64(1))));
              var chromaY int64= (blockY * int64(4)) + (int64(py_1 >> uint(int64(1))));
              var chromaIdx int64= (chromaY * int64(8)) + chromaX;
              var cb_1 int64= int64(128);
              var cr_1 int64= int64(128);
              if  this.numComponents >= int64(3) {
                cb_1 = cbBlock[chromaIdx]; 
                cr_1 = crBlock[chromaIdx]; 
              }
              var r_1 int64= y_1 + (int64((int64(359) * (cr_1 - int64(128))) >> uint(int64(8))));
              var g_1 int64= (y_1 - (int64((int64(88) * (cb_1 - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr_1 - int64(128))) >> uint(int64(8))));
              var b_1 int64= y_1 + (int64((int64(454) * (cb_1 - int64(128))) >> uint(int64(8))));
              if  r_1 < int64(0) {
                r_1 = int64(0); 
              }
              if  r_1 > int64(255) {
                r_1 = int64(255); 
              }
              if  g_1 < int64(0) {
                g_1 = int64(0); 
              }
              if  g_1 > int64(255) {
                g_1 = int64(255); 
              }
              if  b_1 < int64(0) {
                b_1 = int64(0); 
              }
              if  b_1 > int64(255) {
                b_1 = int64(255); 
              }
              img.setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
            }
            px_1 = px_1 + int64(1); 
          }
          py_1 = py_1 + int64(1); 
        }
        blockIdx = blockIdx + int64(1); 
        blockX = blockX + int64(1); 
      }
      blockY = blockY + int64(1); 
    }
    return
  }
  var yLen int64= int64(len(yBlocksData));
  if  yLen > int64(0) {
    var py_2 int64= int64(0);
    for py_2 < int64(8) {
      var px_2 int64= int64(0);
      for px_2 < int64(8) {
        var imgX_2 int64= baseX + px_2;
        var imgY_2 int64= baseY + py_2;
        if  (imgX_2 < this.width) && (imgY_2 < this.height) {
          var y_2 int64= yBlocksData[((py_2 * int64(8)) + px_2)];
          img.setPixelRGB(imgX_2, imgY_2, y_2, y_2, y_2);
        }
        px_2 = px_2 + int64(1); 
      }
      py_2 = py_2 + int64(1); 
    }
  }
}
func (this *ProgressiveJPEGDecoder) decode (dirPath string, fileName string) *ImageBuffer {
  this.data = func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }(); 
  this.dataLen = int64(len(this.data)); 
  fmt.Println( ((("Decoding JPEG: " + fileName) + " (") + (strconv.FormatInt(this.dataLen, 10))) + " bytes)" )
  var ok bool= this.parseMarkers();
  if  ok == false {
    fmt.Println( "Error parsing JPEG markers" )
    var errImg *ImageBuffer= CreateNew_ImageBuffer();
    errImg.init(int64(1), int64(1));
    return errImg
  }
  if  (this.width == int64(0)) || (this.height == int64(0)) {
    fmt.Println( "Error: Invalid image dimensions" )
    var errImg_1 *ImageBuffer= CreateNew_ImageBuffer();
    errImg_1.init(int64(1), int64(1));
    return errImg_1
  }
  var img *ImageBuffer= this.buildImage();
  fmt.Println( "Decode complete!" )
  return img
}
type ExifTag struct { 
  tagId int64 `json:"tagId"` 
  tagName string `json:"tagName"` 
  tagValue string `json:"tagValue"` 
  dataType int64 `json:"dataType"` 
}

func CreateNew_ExifTag() *ExifTag {
  me := new(ExifTag)
  me.tagId = int64(0)
  me.tagName = ""
  me.tagValue = ""
  me.dataType = int64(0)
  return me;
}
type JPEGMetadataInfo struct { 
  isValid bool `json:"isValid"` 
  errorMessage string `json:"errorMessage"` 
  hasJFIF bool `json:"hasJFIF"` 
  jfifVersion string `json:"jfifVersion"` 
  densityUnits int64 `json:"densityUnits"` 
  xDensity int64 `json:"xDensity"` 
  yDensity int64 `json:"yDensity"` 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  colorComponents int64 `json:"colorComponents"` 
  bitsPerComponent int64 `json:"bitsPerComponent"` 
  hasExif bool `json:"hasExif"` 
  cameraMake string `json:"cameraMake"` 
  cameraModel string `json:"cameraModel"` 
  software string `json:"software"` 
  dateTime string `json:"dateTime"` 
  dateTimeOriginal string `json:"dateTimeOriginal"` 
  exposureTime string `json:"exposureTime"` 
  fNumber string `json:"fNumber"` 
  isoSpeed string `json:"isoSpeed"` 
  focalLength string `json:"focalLength"` 
  flash string `json:"flash"` 
  orientation int64 `json:"orientation"` 
  xResolution string `json:"xResolution"` 
  yResolution string `json:"yResolution"` 
  resolutionUnit int64 `json:"resolutionUnit"` 
  hasGPS bool `json:"hasGPS"` 
  gpsLatitude string `json:"gpsLatitude"` 
  gpsLongitude string `json:"gpsLongitude"` 
  gpsAltitude string `json:"gpsAltitude"` 
  gpsLatitudeRef string `json:"gpsLatitudeRef"` 
  gpsLongitudeRef string `json:"gpsLongitudeRef"` 
  hasComment bool `json:"hasComment"` 
  comment string `json:"comment"` 
  exifTags []*ExifTag `json:"exifTags"` 
}

func CreateNew_JPEGMetadataInfo() *JPEGMetadataInfo {
  me := new(JPEGMetadataInfo)
  me.isValid = false
  me.errorMessage = ""
  me.hasJFIF = false
  me.jfifVersion = ""
  me.densityUnits = int64(0)
  me.xDensity = int64(0)
  me.yDensity = int64(0)
  me.width = int64(0)
  me.height = int64(0)
  me.colorComponents = int64(0)
  me.bitsPerComponent = int64(0)
  me.hasExif = false
  me.cameraMake = ""
  me.cameraModel = ""
  me.software = ""
  me.dateTime = ""
  me.dateTimeOriginal = ""
  me.exposureTime = ""
  me.fNumber = ""
  me.isoSpeed = ""
  me.focalLength = ""
  me.flash = ""
  me.orientation = int64(1)
  me.xResolution = ""
  me.yResolution = ""
  me.resolutionUnit = int64(0)
  me.hasGPS = false
  me.gpsLatitude = ""
  me.gpsLongitude = ""
  me.gpsAltitude = ""
  me.gpsLatitudeRef = ""
  me.gpsLongitudeRef = ""
  me.hasComment = false
  me.comment = ""
  me.exifTags = make([]*ExifTag,0)
  return me;
}
type JPEGMetadataParser struct { 
  data []byte `json:"data"` 
  dataLen int64 `json:"dataLen"` 
  littleEndian bool `json:"littleEndian"` 
}

func CreateNew_JPEGMetadataParser() *JPEGMetadataParser {
  me := new(JPEGMetadataParser)
  me.data = 
  make([]byte, int64(0))
  
  me.dataLen = int64(0)
  me.littleEndian = false
  return me;
}
func (this *JPEGMetadataParser) readUint16BE (offset int64) int64 {
  var high int64= int64(this.data[offset]);
  var low int64= int64(this.data[(offset + int64(1))]);
  return (high * int64(256)) + low
}
func (this *JPEGMetadataParser) readUint16 (offset int64) int64 {
  var result int64= int64(0);
  if  this.littleEndian {
    var low int64= int64(this.data[offset]);
    var high int64= int64(this.data[(offset + int64(1))]);
    result = (high * int64(256)) + low; 
  } else {
    var high_1 int64= int64(this.data[offset]);
    var low_1 int64= int64(this.data[(offset + int64(1))]);
    result = (high_1 * int64(256)) + low_1; 
  }
  return result
}
func (this *JPEGMetadataParser) readUint32 (offset int64) int64 {
  var result int64= int64(0);
  if  this.littleEndian {
    var b0 int64= int64(this.data[offset]);
    var b1 int64= int64(this.data[(offset + int64(1))]);
    var b2 int64= int64(this.data[(offset + int64(2))]);
    var b3 int64= int64(this.data[(offset + int64(3))]);
    result = (((b3 * int64(16777216)) + (b2 * int64(65536))) + (b1 * int64(256))) + b0; 
  } else {
    var b0_1 int64= int64(this.data[offset]);
    var b1_1 int64= int64(this.data[(offset + int64(1))]);
    var b2_1 int64= int64(this.data[(offset + int64(2))]);
    var b3_1 int64= int64(this.data[(offset + int64(3))]);
    result = (((b0_1 * int64(16777216)) + (b1_1 * int64(65536))) + (b2_1 * int64(256))) + b3_1; 
  }
  return result
}
func (this *JPEGMetadataParser) readString (offset int64, length int64) string {
  var result string= "";
  var i int64= int64(0);
  for i < length {
    var b int64= int64(this.data[(offset + i)]);
    if  b == int64(0) {
      return result
    }
    result = result + (string([]rune{rune(b)})); 
    i = i + int64(1); 
  }
  return result
}
func (this *JPEGMetadataParser) getTagName (tagId int64, ifdType int64) string {
  if  ifdType == int64(2) {
    if  tagId == int64(0) {
      return "GPSVersionID"
    }
    if  tagId == int64(1) {
      return "GPSLatitudeRef"
    }
    if  tagId == int64(2) {
      return "GPSLatitude"
    }
    if  tagId == int64(3) {
      return "GPSLongitudeRef"
    }
    if  tagId == int64(4) {
      return "GPSLongitude"
    }
    if  tagId == int64(5) {
      return "GPSAltitudeRef"
    }
    if  tagId == int64(6) {
      return "GPSAltitude"
    }
    return "GPS_" + (strconv.FormatInt(tagId, 10))
  }
  if  tagId == int64(256) {
    return "ImageWidth"
  }
  if  tagId == int64(257) {
    return "ImageHeight"
  }
  if  tagId == int64(258) {
    return "BitsPerSample"
  }
  if  tagId == int64(259) {
    return "Compression"
  }
  if  tagId == int64(262) {
    return "PhotometricInterpretation"
  }
  if  tagId == int64(270) {
    return "ImageDescription"
  }
  if  tagId == int64(271) {
    return "Make"
  }
  if  tagId == int64(272) {
    return "Model"
  }
  if  tagId == int64(274) {
    return "Orientation"
  }
  if  tagId == int64(282) {
    return "XResolution"
  }
  if  tagId == int64(283) {
    return "YResolution"
  }
  if  tagId == int64(296) {
    return "ResolutionUnit"
  }
  if  tagId == int64(305) {
    return "Software"
  }
  if  tagId == int64(306) {
    return "DateTime"
  }
  if  tagId == int64(315) {
    return "Artist"
  }
  if  tagId == int64(33432) {
    return "Copyright"
  }
  if  tagId == int64(33434) {
    return "ExposureTime"
  }
  if  tagId == int64(33437) {
    return "FNumber"
  }
  if  tagId == int64(34850) {
    return "ExposureProgram"
  }
  if  tagId == int64(34855) {
    return "ISOSpeedRatings"
  }
  if  tagId == int64(36864) {
    return "ExifVersion"
  }
  if  tagId == int64(36867) {
    return "DateTimeOriginal"
  }
  if  tagId == int64(36868) {
    return "DateTimeDigitized"
  }
  if  tagId == int64(37377) {
    return "ShutterSpeedValue"
  }
  if  tagId == int64(37378) {
    return "ApertureValue"
  }
  if  tagId == int64(37380) {
    return "ExposureBiasValue"
  }
  if  tagId == int64(37381) {
    return "MaxApertureValue"
  }
  if  tagId == int64(37383) {
    return "MeteringMode"
  }
  if  tagId == int64(37384) {
    return "LightSource"
  }
  if  tagId == int64(37385) {
    return "Flash"
  }
  if  tagId == int64(37386) {
    return "FocalLength"
  }
  if  tagId == int64(37500) {
    return "MakerNote"
  }
  if  tagId == int64(37510) {
    return "UserComment"
  }
  if  tagId == int64(40960) {
    return "FlashpixVersion"
  }
  if  tagId == int64(40961) {
    return "ColorSpace"
  }
  if  tagId == int64(40962) {
    return "PixelXDimension"
  }
  if  tagId == int64(40963) {
    return "PixelYDimension"
  }
  if  tagId == int64(41486) {
    return "FocalPlaneXResolution"
  }
  if  tagId == int64(41487) {
    return "FocalPlaneYResolution"
  }
  if  tagId == int64(41488) {
    return "FocalPlaneResolutionUnit"
  }
  if  tagId == int64(41495) {
    return "SensingMethod"
  }
  if  tagId == int64(41728) {
    return "FileSource"
  }
  if  tagId == int64(41729) {
    return "SceneType"
  }
  if  tagId == int64(41985) {
    return "CustomRendered"
  }
  if  tagId == int64(41986) {
    return "ExposureMode"
  }
  if  tagId == int64(41987) {
    return "WhiteBalance"
  }
  if  tagId == int64(41988) {
    return "DigitalZoomRatio"
  }
  if  tagId == int64(41989) {
    return "FocalLengthIn35mmFilm"
  }
  if  tagId == int64(41990) {
    return "SceneCaptureType"
  }
  if  tagId == int64(34665) {
    return "ExifIFDPointer"
  }
  if  tagId == int64(34853) {
    return "GPSInfoIFDPointer"
  }
  return "Tag_" + (strconv.FormatInt(tagId, 10))
}
func (this *JPEGMetadataParser) formatRational (offset int64) string {
  var numerator int64= this.readUint32(offset);
  var denominator int64= this.readUint32((offset + int64(4)));
  if  denominator == int64(0) {
    return strconv.FormatInt(numerator, 10)
  }
  if  denominator == int64(1) {
    return strconv.FormatInt(numerator, 10)
  }
  return ((strconv.FormatInt(numerator, 10)) + "/") + (strconv.FormatInt(denominator, 10))
}
func (this *JPEGMetadataParser) formatGPSCoordinate (offset int64, ref string) string {
  var degNum int64= this.readUint32(offset);
  var degDen int64= this.readUint32((offset + int64(4)));
  var minNum int64= this.readUint32((offset + int64(8)));
  var minDen int64= this.readUint32((offset + int64(12)));
  var secNum int64= this.readUint32((offset + int64(16)));
  var secDen int64= this.readUint32((offset + int64(20)));
  var degrees int64= int64(0);
  if  degDen > int64(0) {
    var tempDeg int64= degNum;
    for tempDeg >= degDen {
      tempDeg = tempDeg - degDen; 
      degrees = degrees + int64(1); 
    }
  }
  var minutes int64= int64(0);
  if  minDen > int64(0) {
    var tempMin int64= minNum;
    for tempMin >= minDen {
      tempMin = tempMin - minDen; 
      minutes = minutes + int64(1); 
    }
  }
  var seconds string= "0";
  if  secDen > int64(0) {
    var secWhole int64= int64(0);
    var tempSec int64= secNum;
    for tempSec >= secDen {
      tempSec = tempSec - secDen; 
      secWhole = secWhole + int64(1); 
    }
    var secRem int64= tempSec;
    if  secRem > int64(0) {
      var decPartTemp int64= secRem * int64(100);
      var decPart int64= int64(0);
      for decPartTemp >= secDen {
        decPartTemp = decPartTemp - secDen; 
        decPart = decPart + int64(1); 
      }
      if  decPart < int64(10) {
        seconds = ((strconv.FormatInt(secWhole, 10)) + ".0") + (strconv.FormatInt(decPart, 10)); 
      } else {
        seconds = ((strconv.FormatInt(secWhole, 10)) + ".") + (strconv.FormatInt(decPart, 10)); 
      }
    } else {
      seconds = strconv.FormatInt(secWhole, 10); 
    }
  }
  return (((((strconv.FormatInt(degrees, 10)) + "° ") + (strconv.FormatInt(minutes, 10))) + "' ") + seconds) + "\""
}
func (this *JPEGMetadataParser) parseIFD (info *JPEGMetadataInfo, tiffStart int64, ifdOffset int64, ifdType int64) () {
  var pos int64= tiffStart + ifdOffset;
  if  (pos + int64(2)) > this.dataLen {
    return
  }
  var numEntries int64= this.readUint16(pos);
  pos = pos + int64(2); 
  var i int64= int64(0);
  for i < numEntries {
    if  (pos + int64(12)) > this.dataLen {
      return
    }
    var tagId int64= this.readUint16(pos);
    var dataType int64= this.readUint16((pos + int64(2)));
    var numValues int64= this.readUint32((pos + int64(4)));
    var valueOffset int64= pos + int64(8);
    var dataSize int64= int64(0);
    if  dataType == int64(1) {
      dataSize = numValues; 
    }
    if  dataType == int64(2) {
      dataSize = numValues; 
    }
    if  dataType == int64(3) {
      dataSize = numValues * int64(2); 
    }
    if  dataType == int64(4) {
      dataSize = numValues * int64(4); 
    }
    if  dataType == int64(5) {
      dataSize = numValues * int64(8); 
    }
    if  dataType == int64(7) {
      dataSize = numValues; 
    }
    if  dataType == int64(9) {
      dataSize = numValues * int64(4); 
    }
    if  dataType == int64(10) {
      dataSize = numValues * int64(8); 
    }
    if  dataSize > int64(4) {
      valueOffset = tiffStart + this.readUint32((pos + int64(8))); 
    }
    var tagName string= this.getTagName(tagId, ifdType);
    var tagValue string= "";
    if  dataType == int64(2) {
      tagValue = this.readString(valueOffset, numValues); 
    }
    if  dataType == int64(3) {
      if  dataSize <= int64(4) {
        tagValue = strconv.FormatInt(this.readUint16((pos + int64(8))), 10); 
      } else {
        tagValue = strconv.FormatInt(this.readUint16(valueOffset), 10); 
      }
    }
    if  dataType == int64(4) {
      if  dataSize <= int64(4) {
        tagValue = strconv.FormatInt(this.readUint32((pos + int64(8))), 10); 
      } else {
        tagValue = strconv.FormatInt(this.readUint32(valueOffset), 10); 
      }
    }
    if  dataType == int64(5) {
      tagValue = this.formatRational(valueOffset); 
    }
    var tag *ExifTag= CreateNew_ExifTag();
    tag.tagId = tagId; 
    tag.tagName = tagName; 
    tag.tagValue = tagValue; 
    tag.dataType = dataType; 
    info.exifTags = append(info.exifTags,tag); 
    if  tagId == int64(271) {
      info.cameraMake = tagValue; 
    }
    if  tagId == int64(272) {
      info.cameraModel = tagValue; 
    }
    if  tagId == int64(305) {
      info.software = tagValue; 
    }
    if  tagId == int64(306) {
      info.dateTime = tagValue; 
    }
    if  tagId == int64(274) {
      info.orientation = this.readUint16((pos + int64(8))); 
    }
    if  tagId == int64(282) {
      info.xResolution = tagValue; 
    }
    if  tagId == int64(283) {
      info.yResolution = tagValue; 
    }
    if  tagId == int64(296) {
      info.resolutionUnit = this.readUint16((pos + int64(8))); 
    }
    if  tagId == int64(36867) {
      info.dateTimeOriginal = tagValue; 
    }
    if  tagId == int64(33434) {
      info.exposureTime = tagValue; 
    }
    if  tagId == int64(33437) {
      info.fNumber = tagValue; 
    }
    if  tagId == int64(34855) {
      info.isoSpeed = tagValue; 
    }
    if  tagId == int64(37386) {
      info.focalLength = tagValue; 
    }
    if  tagId == int64(37385) {
      var flashVal int64= this.readUint16((pos + int64(8)));
      if  (flashVal % int64(2)) == int64(1) {
        info.flash = "Fired"; 
      } else {
        info.flash = "Did not fire"; 
      }
    }
    if  tagId == int64(34665) {
      var exifOffset int64= this.readUint32((pos + int64(8)));
      this.parseIFD(info, tiffStart, exifOffset, int64(1));
    }
    if  tagId == int64(34853) {
      info.hasGPS = true; 
      var gpsOffset int64= this.readUint32((pos + int64(8)));
      this.parseIFD(info, tiffStart, gpsOffset, int64(2));
    }
    if  ifdType == int64(2) {
      if  tagId == int64(1) {
        info.gpsLatitudeRef = tagValue; 
      }
      if  tagId == int64(2) {
        info.gpsLatitude = this.formatGPSCoordinate(valueOffset, info.gpsLatitudeRef); 
      }
      if  tagId == int64(3) {
        info.gpsLongitudeRef = tagValue; 
      }
      if  tagId == int64(4) {
        info.gpsLongitude = this.formatGPSCoordinate(valueOffset, info.gpsLongitudeRef); 
      }
      if  tagId == int64(6) {
        var altNum int64= this.readUint32(valueOffset);
        var altDen int64= this.readUint32((valueOffset + int64(4)));
        if  altDen > int64(0) {
          var altWhole int64= int64(0);
          var tempAlt int64= altNum;
          for tempAlt >= altDen {
            tempAlt = tempAlt - altDen; 
            altWhole = altWhole + int64(1); 
          }
          var altRem int64= tempAlt;
          if  altRem > int64(0) {
            var altDecTemp int64= altRem * int64(10);
            var altDec int64= int64(0);
            for altDecTemp >= altDen {
              altDecTemp = altDecTemp - altDen; 
              altDec = altDec + int64(1); 
            }
            info.gpsAltitude = (((strconv.FormatInt(altWhole, 10)) + ".") + (strconv.FormatInt(altDec, 10))) + " m"; 
          } else {
            info.gpsAltitude = (strconv.FormatInt(altWhole, 10)) + " m"; 
          }
        } else {
          info.gpsAltitude = (strconv.FormatInt(altNum, 10)) + " m"; 
        }
      }
    }
    pos = pos + int64(12); 
    i = i + int64(1); 
  }
}
func (this *JPEGMetadataParser) parseExif (info *JPEGMetadataInfo, appStart int64, appLen int64) () {
  var header string= this.readString(appStart, int64(4));
  if  header != "Exif" {
    return
  }
  info.hasExif = true; 
  var tiffStart int64= appStart + int64(6);
  var byteOrder0 int64= int64(this.data[tiffStart]);
  var byteOrder1 int64= int64(this.data[(tiffStart + int64(1))]);
  if  (byteOrder0 == int64(73)) && (byteOrder1 == int64(73)) {
    this.littleEndian = true; 
  } else {
    if  (byteOrder0 == int64(77)) && (byteOrder1 == int64(77)) {
      this.littleEndian = false; 
    } else {
      return
    }
  }
  var magic int64= this.readUint16((tiffStart + int64(2)));
  if  magic != int64(42) {
    return
  }
  var ifd0Offset int64= this.readUint32((tiffStart + int64(4)));
  this.parseIFD(info, tiffStart, ifd0Offset, int64(0));
}
func (this *JPEGMetadataParser) parseJFIF (info *JPEGMetadataInfo, appStart int64, appLen int64) () {
  var header string= this.readString(appStart, int64(4));
  if  header != "JFIF" {
    return
  }
  info.hasJFIF = true; 
  var verMajor int64= int64(this.data[(appStart + int64(5))]);
  var verMinor int64= int64(this.data[(appStart + int64(6))]);
  info.jfifVersion = ((strconv.FormatInt(verMajor, 10)) + ".") + (strconv.FormatInt(verMinor, 10)); 
  info.densityUnits = int64(this.data[(appStart + int64(7))]); 
  info.xDensity = this.readUint16BE((appStart + int64(8))); 
  info.yDensity = this.readUint16BE((appStart + int64(10))); 
}
func (this *JPEGMetadataParser) parseComment (info *JPEGMetadataInfo, appStart int64, appLen int64) () {
  info.hasComment = true; 
  info.comment = this.readString(appStart, appLen); 
}
func (this *JPEGMetadataParser) parseMetadata (dirPath string, fileName string) *JPEGMetadataInfo {
  var info *JPEGMetadataInfo= CreateNew_JPEGMetadataInfo();
  this.data = func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }(); 
  this.dataLen = int64(len(this.data)); 
  if  this.dataLen < int64(4) {
    info.errorMessage = "File too small"; 
    return info
  }
  var m1 int64= int64(this.data[int64(0)]);
  var m2 int64= int64(this.data[int64(1)]);
  if  (m1 != int64(255)) || (m2 != int64(216)) {
    info.errorMessage = "Not a valid JPEG file"; 
    return info
  }
  info.isValid = true; 
  var pos int64= int64(2);
  for pos < this.dataLen {
    var marker1 int64= int64(this.data[pos]);
    if  marker1 != int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    var marker2 int64= int64(this.data[(pos + int64(1))]);
    if  marker2 == int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    if  (marker2 == int64(216)) || (marker2 == int64(217)) {
      pos = pos + int64(2); 
      continue;
    }
    if  (marker2 >= int64(208)) && (marker2 <= int64(215)) {
      pos = pos + int64(2); 
      continue;
    }
    if  (pos + int64(4)) > this.dataLen {
      return info
    }
    var segLen int64= this.readUint16BE((pos + int64(2)));
    var segStart int64= pos + int64(4);
    if  marker2 == int64(224) {
      this.parseJFIF(info, segStart, segLen - int64(2));
    }
    if  marker2 == int64(225) {
      this.parseExif(info, segStart, segLen - int64(2));
    }
    if  marker2 == int64(254) {
      this.parseComment(info, segStart, segLen - int64(2));
    }
    if  (marker2 == int64(192)) || (marker2 == int64(194)) {
      if  (pos + int64(9)) < this.dataLen {
        info.bitsPerComponent = int64(this.data[(pos + int64(4))]); 
        info.height = this.readUint16BE((pos + int64(5))); 
        info.width = this.readUint16BE((pos + int64(7))); 
        info.colorComponents = int64(this.data[(pos + int64(9))]); 
      }
    }
    if  marker2 == int64(218) {
      return info
    }
    if  marker2 == int64(217) {
      return info
    }
    pos = (pos + int64(2)) + segLen; 
  }
  return info
}
func (this *JPEGMetadataParser) formatMetadata (info *JPEGMetadataInfo) string {
  var out *GrowableBuffer= CreateNew_GrowableBuffer();
  out.writeString("=== JPEG Metadata ===\n\n");
  if  info.isValid == false {
    out.writeString(("Error: " + info.errorMessage) + "\n");
    return (out).toString()
  }
  out.writeString("--- Image Info ---\n");
  out.writeString(((("  Dimensions: " + (strconv.FormatInt(info.width, 10))) + " x ") + (strconv.FormatInt(info.height, 10))) + "\n");
  out.writeString(("  Color Components: " + (strconv.FormatInt(info.colorComponents, 10))) + "\n");
  out.writeString(("  Bits per Component: " + (strconv.FormatInt(info.bitsPerComponent, 10))) + "\n");
  if  info.hasJFIF {
    out.writeString("\n--- JFIF Info ---\n");
    out.writeString(("  Version: " + info.jfifVersion) + "\n");
    var densityStr string= "No units (aspect ratio)";
    if  info.densityUnits == int64(1) {
      densityStr = "pixels/inch"; 
    }
    if  info.densityUnits == int64(2) {
      densityStr = "pixels/cm"; 
    }
    out.writeString(((((("  Density: " + (strconv.FormatInt(info.xDensity, 10))) + " x ") + (strconv.FormatInt(info.yDensity, 10))) + " ") + densityStr) + "\n");
  }
  if  info.hasExif {
    out.writeString("\n--- EXIF Info ---\n");
    if  (int64(len([]rune(info.cameraMake)))) > int64(0) {
      out.writeString(("  Camera Make: " + info.cameraMake) + "\n");
    }
    if  (int64(len([]rune(info.cameraModel)))) > int64(0) {
      out.writeString(("  Camera Model: " + info.cameraModel) + "\n");
    }
    if  (int64(len([]rune(info.software)))) > int64(0) {
      out.writeString(("  Software: " + info.software) + "\n");
    }
    if  (int64(len([]rune(info.dateTimeOriginal)))) > int64(0) {
      out.writeString(("  Date/Time Original: " + info.dateTimeOriginal) + "\n");
    } else {
      if  (int64(len([]rune(info.dateTime)))) > int64(0) {
        out.writeString(("  Date/Time: " + info.dateTime) + "\n");
      }
    }
    if  (int64(len([]rune(info.exposureTime)))) > int64(0) {
      out.writeString(("  Exposure Time: " + info.exposureTime) + " sec\n");
    }
    if  (int64(len([]rune(info.fNumber)))) > int64(0) {
      out.writeString(("  F-Number: f/" + info.fNumber) + "\n");
    }
    if  (int64(len([]rune(info.isoSpeed)))) > int64(0) {
      out.writeString(("  ISO Speed: " + info.isoSpeed) + "\n");
    }
    if  (int64(len([]rune(info.focalLength)))) > int64(0) {
      out.writeString(("  Focal Length: " + info.focalLength) + " mm\n");
    }
    if  (int64(len([]rune(info.flash)))) > int64(0) {
      out.writeString(("  Flash: " + info.flash) + "\n");
    }
    var orientStr string= "Normal";
    if  info.orientation == int64(2) {
      orientStr = "Flip horizontal"; 
    }
    if  info.orientation == int64(3) {
      orientStr = "Rotate 180"; 
    }
    if  info.orientation == int64(4) {
      orientStr = "Flip vertical"; 
    }
    if  info.orientation == int64(5) {
      orientStr = "Transpose"; 
    }
    if  info.orientation == int64(6) {
      orientStr = "Rotate 90 CW"; 
    }
    if  info.orientation == int64(7) {
      orientStr = "Transverse"; 
    }
    if  info.orientation == int64(8) {
      orientStr = "Rotate 270 CW"; 
    }
    out.writeString(("  Orientation: " + orientStr) + "\n");
  }
  if  info.hasGPS {
    out.writeString("\n--- GPS Info ---\n");
    if  (int64(len([]rune(info.gpsLatitude)))) > int64(0) {
      out.writeString(("  Latitude: " + info.gpsLatitude) + "\n");
    }
    if  (int64(len([]rune(info.gpsLongitude)))) > int64(0) {
      out.writeString(("  Longitude: " + info.gpsLongitude) + "\n");
    }
    if  (int64(len([]rune(info.gpsAltitude)))) > int64(0) {
      out.writeString(("  Altitude: " + info.gpsAltitude) + "\n");
    }
  }
  if  info.hasComment {
    out.writeString("\n--- Comment ---\n");
    out.writeString(("  " + info.comment) + "\n");
  }
  var tagCount int64= int64(len(info.exifTags));
  if  tagCount > int64(0) {
    out.writeString(("\n--- All EXIF Tags (" + (strconv.FormatInt(tagCount, 10))) + ") ---\n");
    var idx int64 = 0;  
    for ; idx < int64(len(info.exifTags)) ; idx++ {
      tag := info.exifTags[idx];
      out.writeString(("  " + tag.tagName) + " (0x");
      var tagHex string= "";
      var tid int64= tag.tagId;
      var hexChars string= "0123456789ABCDEF";
      var h3D float64= float64(tid) / float64(int64(4096));
      var h3 int64= int64(h3D);
      var r3 int64= tid - (h3 * int64(4096));
      var h2D float64= float64(r3) / float64(int64(256));
      var h2 int64= int64(h2D);
      var r2 int64= r3 - (h2 * int64(256));
      var h1D float64= float64(r2) / float64(int64(16));
      var h1 int64= int64(h1D);
      var h0 int64= r2 - (h1 * int64(16));
      tagHex = (((string([]rune(hexChars)[h3:(h3 + int64(1))])) + (string([]rune(hexChars)[h2:(h2 + int64(1))]))) + (string([]rune(hexChars)[h1:(h1 + int64(1))]))) + (string([]rune(hexChars)[h0:(h0 + int64(1))])); 
      out.writeString(((tagHex + "): ") + tag.tagValue) + "\n");
    }
  }
  return (out).toString()
}
type JPEGMetadataMain struct { 
}

func CreateNew_JPEGMetadataMain() *JPEGMetadataMain {
  me := new(JPEGMetadataMain)
  return me;
}
type JPEGScaler struct { 
}

func CreateNew_JPEGScaler() *JPEGScaler {
  me := new(JPEGScaler)
  return me;
}
func (this *JPEGScaler) run () () {
  var argc int64= int64( len( os.Args) - 1 );
  if  argc < int64(4) {
    this.printUsage();
    return
  }
  var mode string= "";
  var value float64= 0.0;
  var inputFile string= "";
  var outputFile string= "";
  var quality int64= int64(85);
  var i int64= int64(0);
  for i < argc {
    var arg string= os.Args[i + 1];
    if  arg == "-width" {
      mode = "width"; 
      i = i + int64(1); 
      if  i < argc {
        var valStr string= os.Args[i + 1];
        var optVal *GoNullable = new(GoNullable); 
        optVal = r_str_2_d64(valStr);
        value = optVal.value.(float64); 
      }
    }
    if  arg == "-height" {
      mode = "height"; 
      i = i + int64(1); 
      if  i < argc {
        var valStr_1 string= os.Args[i + 1];
        var optVal_1 *GoNullable = new(GoNullable); 
        optVal_1 = r_str_2_d64(valStr_1);
        value = optVal_1.value.(float64); 
      }
    }
    if  arg == "-scale" {
      mode = "scale"; 
      i = i + int64(1); 
      if  i < argc {
        var valStr_2 string= os.Args[i + 1];
        var optVal_2 *GoNullable = new(GoNullable); 
        optVal_2 = r_str_2_d64(valStr_2);
        value = optVal_2.value.(float64); 
      }
    }
    if  arg == "-quality" {
      i = i + int64(1); 
      if  i < argc {
        var valStr_3 string= os.Args[i + 1];
        var optVal_3 *GoNullable = new(GoNullable); 
        optVal_3 = r_str_2_i64(valStr_3);
        var qVal int64= optVal_3.value.(int64);
        quality = qVal; 
      }
    }
    if  (int64([]rune(arg)[int64(0)])) != int64(45) {
      if  inputFile == "" {
        inputFile = arg; 
      } else {
        if  outputFile == "" {
          outputFile = arg; 
        }
      }
    }
    i = i + int64(1); 
  }
  if  ((mode == "") || (inputFile == "")) || (outputFile == "") {
    this.printUsage();
    return
  }
  fmt.Println( "JPEG Scaler" )
  fmt.Println( "Input:  " + inputFile )
  fmt.Println( "Output: " + outputFile )
  fmt.Println( (("Mode:   " + mode) + " = ") + (strconv.FormatFloat(value,'f', 6, 64)) )
  fmt.Println( "Quality: " + (strconv.FormatInt(quality, 10)) )
  fmt.Println( "" )
  var inputDir string= ".";
  var inputName string= inputFile;
  var lastInputSlash int64= int64(-1);
  var k int64= int64(0);
  for k < (int64(len([]rune(inputFile)))) {
    var ch int64= int64([]rune(inputFile)[k]);
    if  (ch == int64(47)) || (ch == int64(92)) {
      lastInputSlash = k; 
    }
    k = k + int64(1); 
  }
  if  lastInputSlash >= int64(0) {
    inputDir = string([]rune(inputFile)[int64(0):lastInputSlash]); 
    inputName = string([]rune(inputFile)[(lastInputSlash + int64(1)):(int64(len([]rune(inputFile))))]); 
  }
  var metaParser *JPEGMetadataParser= CreateNew_JPEGMetadataParser();
  var metaInfo *JPEGMetadataInfo= metaParser.parseMetadata(inputDir, inputName);
  var orientation int64= metaInfo.orientation;
  fmt.Println( "EXIF Orientation: " + (strconv.FormatInt(orientation, 10)) )
  var img *ImageBuffer= this.decodeJPEG(inputFile);
  if  img.width == int64(0) {
    fmt.Println( "Error: Failed to decode input JPEG" )
    return
  }
  fmt.Println( (("Decoded size: " + (strconv.FormatInt(img.width, 10))) + "x") + (strconv.FormatInt(img.height, 10)) )
  if  orientation > int64(1) {
    fmt.Println( "Applying EXIF orientation correction..." )
    img = img.applyExifOrientation(orientation); 
    fmt.Println( (("After orientation: " + (strconv.FormatInt(img.width, 10))) + "x") + (strconv.FormatInt(img.height, 10)) )
  }
  fmt.Println( (("Original size: " + (strconv.FormatInt(img.width, 10))) + "x") + (strconv.FormatInt(img.height, 10)) )
  var newWidth int64= int64(0);
  var newHeight int64= int64(0);
  if  mode == "width" {
    newWidth = int64(value); 
    var ratio float64= (float64( newWidth )) / (float64( img.width ));
    newHeight = int64(((float64( img.height )) * ratio)); 
  }
  if  mode == "height" {
    newHeight = int64(value); 
    var ratio_1 float64= (float64( newHeight )) / (float64( img.height ));
    newWidth = int64(((float64( img.width )) * ratio_1)); 
  }
  if  mode == "scale" {
    newWidth = int64(((float64( img.width )) * value)); 
    newHeight = int64(((float64( img.height )) * value)); 
  }
  fmt.Println( (("New size: " + (strconv.FormatInt(newWidth, 10))) + "x") + (strconv.FormatInt(newHeight, 10)) )
  var scaled *ImageBuffer= img.scaleToSize(newWidth, newHeight);
  var outDir string= ".";
  var outName string= outputFile;
  var lastSlash int64= int64(-1);
  var j int64= int64(0);
  for j < (int64(len([]rune(outputFile)))) {
    var ch_1 int64= int64([]rune(outputFile)[j]);
    if  (ch_1 == int64(47)) || (ch_1 == int64(92)) {
      lastSlash = j; 
    }
    j = j + int64(1); 
  }
  if  lastSlash >= int64(0) {
    outDir = string([]rune(outputFile)[int64(0):lastSlash]); 
    outName = string([]rune(outputFile)[(lastSlash + int64(1)):(int64(len([]rune(outputFile))))]); 
  }
  var encoder *JPEGEncoder= CreateNew_JPEGEncoder();
  encoder.setQuality(quality);
  encoder.encode(scaled, outDir, outName);
  fmt.Println( "" )
  fmt.Println( "Done!" )
}
func (this *JPEGScaler) decodeJPEG (filePath string) *ImageBuffer {
  var dir string= ".";
  var name string= filePath;
  var lastSlash int64= int64(-1);
  var j int64= int64(0);
  for j < (int64(len([]rune(filePath)))) {
    var c int64= int64([]rune(filePath)[j]);
    if  (c == int64(47)) || (c == int64(92)) {
      lastSlash = j; 
    }
    j = j + int64(1); 
  }
  if  lastSlash >= int64(0) {
    dir = string([]rune(filePath)[int64(0):lastSlash]); 
    name = string([]rune(filePath)[(lastSlash + int64(1)):(int64(len([]rune(filePath))))]); 
  }
  var data []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(dir, name)); return d }();
  var dataLen int64= int64(len(data));
  var isProgressive bool= false;
  var i int64= int64(0);
  var marker int64= int64(0);
  for i < (dataLen - int64(1)) {
    var b int64= int64(data[i]);
    if  b == int64(255) {
      marker = int64(data[(i + int64(1))]); 
      if  marker == int64(194) {
        isProgressive = true; 
        i = dataLen; 
      }
      if  marker == int64(192) {
        isProgressive = false; 
        i = dataLen; 
      }
    }
    i = i + int64(1); 
  }
  if  isProgressive {
    fmt.Println( "Detected: Progressive JPEG" )
    var decoder *ProgressiveJPEGDecoder= CreateNew_ProgressiveJPEGDecoder();
    return decoder.decode(dir, name)
  }
  fmt.Println( "Detected: Baseline JPEG" )
  var decoder_1 *JPEGDecoder= CreateNew_JPEGDecoder();
  return decoder_1.decode(dir, name)
}
func (this *JPEGScaler) printUsage () () {
  fmt.Println( "JPEG Scaler - Scale JPEG images" )
  fmt.Println( "" )
  fmt.Println( "Usage:" )
  fmt.Println( "  jpeg_scaler -width <pixels> input.jpg output.jpg" )
  fmt.Println( "  jpeg_scaler -height <pixels> input.jpg output.jpg" )
  fmt.Println( "  jpeg_scaler -scale <factor> input.jpg output.jpg" )
  fmt.Println( "" )
  fmt.Println( "Options:" )
  fmt.Println( "  -width <pixels>   Scale to specified width (height proportional)" )
  fmt.Println( "  -height <pixels>  Scale to specified height (width proportional)" )
  fmt.Println( "  -scale <factor>   Scale by factor (e.g., 2.0 = double size)" )
  fmt.Println( "  -quality <1-100>  JPEG quality (default: 85)" )
  fmt.Println( "" )
  fmt.Println( "Examples:" )
  fmt.Println( "  jpeg_scaler -width 800 photo.jpg photo_800.jpg" )
  fmt.Println( "  jpeg_scaler -height 600 photo.jpg photo_600h.jpg" )
  fmt.Println( "  jpeg_scaler -scale 0.5 photo.jpg photo_half.jpg" )
  fmt.Println( "  jpeg_scaler -width 1920 -quality 95 input.jpg output.jpg" )
}
func main() {
  var scaler *JPEGScaler= CreateNew_JPEGScaler();
  scaler.run();
}
