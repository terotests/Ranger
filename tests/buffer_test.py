# -*- coding: utf-8 -*-

class Main:
  def __init__(self):
    pass
# Main entry point
def main():
  print("=== Buffer Operations Test ===")
  print("Test 1: Allocating buffer of 16 bytes")
  buf = bytearray(16)
  print("Buffer length: " + (str((len(buf)))))
  print("Test 2: Setting and getting bytes")
  buf[0] = 65
  buf[1] = 66
  buf[2] = 67
  buf[3] = 0
  byte0 = buf[0]
  byte1 = buf[1]
  byte2 = buf[2]
  print(("Byte 0: " + (str(byte0))) + " (expected 65)")
  print(("Byte 1: " + (str(byte1))) + " (expected 66)")
  print(("Byte 2: " + (str(byte2))) + " (expected 67)")
  print("Test 3: Creating buffer from string")
  strBuf = bytearray("Hello", 'utf-8')
  strLen = len(strBuf)
  print("String buffer length: " + (str(strLen)))
  print("Test 4: Converting buffer to string")
  resultStr = strBuf.decode('utf-8')
  print("Buffer as string: " + resultStr)
  print("Test 5: Filling buffer")
  fillBuf = bytearray(8)
  fillBuf[0:8] = [255] * (8 - 0)
  filledByte = fillBuf[0]
  print(("Filled byte: " + (str(filledByte))) + " (expected 255)")
  print("Test 6: Copying buffers")
  srcBuf = bytearray("SOURCE", 'utf-8')
  dstBuf = bytearray(10)
  dstBuf[0:0+6] = srcBuf[0:0+6]
  copiedStr = dstBuf.decode('utf-8')
  print("Copied buffer: " + copiedStr)
  print("=== All tests completed ===")
if __name__ == "__main__":
  main()
