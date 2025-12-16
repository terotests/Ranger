package main
import (
  "fmt"
  "strconv"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type Main struct { 
}

func CreateNew_Main() *Main {
  me := new(Main)
  return me;
}
func main() {
  fmt.Println( "=== Buffer Operations Test ===" )
  fmt.Println( "Test 1: Allocating buffer of 16 bytes" )
  var buf []byte= make([]byte, int64(16));
  fmt.Println( "Buffer length: " + (strconv.FormatInt((int64(len(buf))), 10)) )
  fmt.Println( "Test 2: Setting and getting bytes" )
  buf[int64(0)] = byte(int64(65))
  buf[int64(1)] = byte(int64(66))
  buf[int64(2)] = byte(int64(67))
  buf[int64(3)] = byte(int64(0))
  var byte0 int64= int64(buf[int64(0)]);
  var byte1 int64= int64(buf[int64(1)]);
  var byte2 int64= int64(buf[int64(2)]);
  fmt.Println( ("Byte 0: " + (strconv.FormatInt(byte0, 10))) + " (expected 65)" )
  fmt.Println( ("Byte 1: " + (strconv.FormatInt(byte1, 10))) + " (expected 66)" )
  fmt.Println( ("Byte 2: " + (strconv.FormatInt(byte2, 10))) + " (expected 67)" )
  fmt.Println( "Test 3: Creating buffer from string" )
  var strBuf []byte= []byte("Hello");
  var strLen int64= int64(len(strBuf));
  fmt.Println( "String buffer length: " + (strconv.FormatInt(strLen, 10)) )
  fmt.Println( "Test 4: Converting buffer to string" )
  var resultStr string= string(strBuf);
  fmt.Println( "Buffer as string: " + resultStr )
  fmt.Println( "Test 5: Filling buffer" )
  var fillBuf []byte= make([]byte, int64(8));
  for i := int64(0); i < int64(8); i++ { fillBuf[i] = byte(int64(255)) }
  var filledByte int64= int64(fillBuf[int64(0)]);
  fmt.Println( ("Filled byte: " + (strconv.FormatInt(filledByte, 10))) + " (expected 255)" )
  fmt.Println( "Test 6: Copying buffers" )
  var srcBuf []byte= []byte("SOURCE");
  var dstBuf []byte= make([]byte, int64(10));
  copy(dstBuf[int64(0):], srcBuf[int64(0):int64(0)+int64(6)])
  var copiedStr string= string(dstBuf);
  fmt.Println( "Copied buffer: " + copiedStr )
  fmt.Println( "=== All tests completed ===" )
}
