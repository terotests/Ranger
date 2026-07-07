systemclass RUint32Array {
  es6 Uint32Array
}

systemclass Uint32 {
  es6 Uint32
}

operator type:void es6 {
  fn create_Uint32Array:RUint32Array (size:int) ('new Uint32Array(' (e 1) ')') 
  fn at:Uint32 (buff:RUint32Array index:int) ( (e 1) '[' (e 2) ']')
  fn to_int:int (value:Uint32) ( (e 1) )
  fn to_hex_string:string (value:Uint32) ( (e 1) '.toString(16)' )
}
