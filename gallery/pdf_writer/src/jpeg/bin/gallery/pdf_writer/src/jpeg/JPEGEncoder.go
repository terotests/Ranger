package main
import (
  "fmt"
  "strconv"
  "os"
)

type GoNullable struct {
  value interface{}
  has_value bool
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
  var buf []byte= this.currentChunk.data;
  var pos int64= this.currentChunk.used;
  buf[pos] = byte(b)
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
  var __len int64= int64(len(s));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64(s[i]);
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
    var chunkData []byte= chunk.data;
    var chunkUsed int64= chunk.used;
    var i int64= int64(0);
    for i < chunkUsed {
      var b int64= int64(chunkData[i]);
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
    var chunkData []byte= chunk.data;
    var chunkUsed int64= chunk.used;
    var i int64= int64(0);
    for i < chunkUsed {
      var b int64= int64(chunkData[i]);
      result = result + (string([] byte{byte(b)})); 
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
