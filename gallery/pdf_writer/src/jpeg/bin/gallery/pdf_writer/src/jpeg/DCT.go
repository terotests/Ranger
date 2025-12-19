package main
import (
)

type GoNullable struct {
  value interface{}
  has_value bool
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
