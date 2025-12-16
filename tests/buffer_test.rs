#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct Main { 
}
impl Main { 
  
  pub fn new() ->  Main {
    let mut me = Main { 
    };
    return me;
  }
}
fn main() {
  println!( "{}", "=== Buffer Operations Test ===".to_string() );
  println!( "{}", "Test 1: Allocating buffer of 16 bytes".to_string() );
  let mut buf : Vec<u8> = vec![0u8; 16 as usize];
  println!( "{}", format!("{}{}", "Buffer length: ".to_string(), ((buf.len() as i64).to_string())) );
  println!( "{}", "Test 2: Setting and getting bytes".to_string() );
  buf[0 as usize] = 65 as u8;
  buf[1 as usize] = 66 as u8;
  buf[2 as usize] = 67 as u8;
  buf[3 as usize] = 0 as u8;
  let byte0 : i64 = buf[0 as usize] as i64;
  let byte1 : i64 = buf[1 as usize] as i64;
  let byte2 : i64 = buf[2 as usize] as i64;
  println!( "{}", format!("{}{}", (format!("{}{}", "Byte 0: ".to_string(), (byte0.to_string()))), " (expected 65)".to_string()) );
  println!( "{}", format!("{}{}", (format!("{}{}", "Byte 1: ".to_string(), (byte1.to_string()))), " (expected 66)".to_string()) );
  println!( "{}", format!("{}{}", (format!("{}{}", "Byte 2: ".to_string(), (byte2.to_string()))), " (expected 67)".to_string()) );
  println!( "{}", "Test 3: Creating buffer from string".to_string() );
  let mut strBuf : Vec<u8> = "Hello".to_string().as_bytes().to_vec();
  let strLen : i64 = strBuf.len() as i64;
  println!( "{}", format!("{}{}", "String buffer length: ".to_string(), (strLen.to_string())) );
  println!( "{}", "Test 4: Converting buffer to string".to_string() );
  let resultStr : String = String::from_utf8_lossy(&strBuf).to_string();
  println!( "{}", format!("{}{}", "Buffer as string: ".to_string(), resultStr) );
  println!( "{}", "Test 5: Filling buffer".to_string() );
  let mut fillBuf : Vec<u8> = vec![0u8; 8 as usize];
  fillBuf[0 as usize..8 as usize].fill(255 as u8);
  let filledByte : i64 = fillBuf[0 as usize] as i64;
  println!( "{}", format!("{}{}", (format!("{}{}", "Filled byte: ".to_string(), (filledByte.to_string()))), " (expected 255)".to_string()) );
  println!( "{}", "Test 6: Copying buffers".to_string() );
  let mut srcBuf : Vec<u8> = "SOURCE".to_string().as_bytes().to_vec();
  let mut dstBuf : Vec<u8> = vec![0u8; 10 as usize];
  dstBuf[0 as usize..(0+6) as usize].copy_from_slice(&srcBuf[0 as usize..(0+6) as usize]);
  let copiedStr : String = String::from_utf8_lossy(&dstBuf).to_string();
  println!( "{}", format!("{}{}", "Copied buffer: ".to_string(), copiedStr) );
  println!( "{}", "=== All tests completed ===".to_string() );
}
