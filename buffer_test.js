#!/usr/bin/env node
class Main  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  console.log("=== Buffer Operations Test ===");
  console.log("Test 1: Allocating buffer of 16 bytes");
  const buf = (function(){ var b = new ArrayBuffer(16); b._view = new DataView(b); return b; })();
  console.log("Buffer length: " + (((buf.byteLength).toString())));
  console.log("Test 2: Setting and getting bytes");
  buf._view.setUint8(0, 65);
  buf._view.setUint8(1, 66);
  buf._view.setUint8(2, 67);
  buf._view.setUint8(3, 0);
  const byte0 = buf._view.getUint8(0);
  const byte1 = buf._view.getUint8(1);
  const byte2 = buf._view.getUint8(2);
  console.log(("Byte 0: " + ((byte0.toString()))) + " (expected 65)");
  console.log(("Byte 1: " + ((byte1.toString()))) + " (expected 66)");
  console.log(("Byte 2: " + ((byte2.toString()))) + " (expected 67)");
  console.log("Test 3: Creating buffer from string");
  const strBuf = (function(s){ var b = new ArrayBuffer(s.length); var v = new Uint8Array(b); for(var i=0;i<s.length;i++)v[i]=s.charCodeAt(i); b._view = new DataView(b); return b; })("Hello");
  const strLen = strBuf.byteLength;
  console.log("String buffer length: " + ((strLen.toString())));
  console.log("Test 4: Converting buffer to string");
  const resultStr = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(strBuf);
  console.log("Buffer as string: " + resultStr);
  console.log("Test 5: Filling buffer");
  const fillBuf = (function(){ var b = new ArrayBuffer(8); b._view = new DataView(b); return b; })();
  (function(b,v,s,e){ var arr = new Uint8Array(b); for(var i=s;i<e;i++) arr[i]=v; })(fillBuf,255,0,8);
  const filledByte = fillBuf._view.getUint8(0);
  console.log(("Filled byte: " + ((filledByte.toString()))) + " (expected 255)");
  console.log("Test 6: Copying buffers");
  const srcBuf = (function(s){ var b = new ArrayBuffer(s.length); var v = new Uint8Array(b); for(var i=0;i<s.length;i++)v[i]=s.charCodeAt(i); b._view = new DataView(b); return b; })("SOURCE");
  const dstBuf = (function(){ var b = new ArrayBuffer(10); b._view = new DataView(b); return b; })();
  (function(d,dOff,s,sOff,len){ var dv = new Uint8Array(d); var sv = new Uint8Array(s); for(var i=0;i<len;i++) dv[dOff+i]=sv[sOff+i]; })(dstBuf,0,srcBuf,0,6);
  const copiedStr = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(dstBuf);
  console.log("Copied buffer: " + copiedStr);
  console.log("=== All tests completed ===");
}
__js_main();
