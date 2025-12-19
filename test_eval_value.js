#!/usr/bin/env node
class EvalValue  {
  constructor() {
    this.valueType = 0;
    this.numberValue = 0.0;
    this.stringValue = "";
    this.boolValue = false;
    this.arrayValue = [];
    this.objectKeys = [];
    this.objectValues = [];
    this.functionName = "";
    this.functionBody = "";     /** note: unused */
  }
  isNull () {
    return this.valueType == 0;
  };
  isNumber () {
    return this.valueType == 1;
  };
  isString () {
    return this.valueType == 2;
  };
  isBoolean () {
    return this.valueType == 3;
  };
  isArray () {
    return this.valueType == 4;
  };
  isObject () {
    return this.valueType == 5;
  };
  isFunction () {
    return this.valueType == 6;
  };
  toNumber () {
    if ( this.valueType == 1 ) {
      return this.numberValue;
    }
    if ( this.valueType == 2 ) {
      return isNaN( parseFloat(this.stringValue) ) ? undefined : parseFloat(this.stringValue);
    }
    if ( this.valueType == 3 ) {
      if ( this.boolValue ) {
        return 1.0;
      }
      return 0.0;
    }
    return 0.0;
  };
  toString () {
    if ( this.valueType == 0 ) {
      return "null";
    }
    if ( this.valueType == 1 ) {
      const s = (this.numberValue.toString());
      const intVal = Math.floor( this.numberValue);
      if ( (intVal) == this.numberValue ) {
        return (intVal.toString());
      }
      return s;
    }
    if ( this.valueType == 2 ) {
      return this.stringValue;
    }
    if ( this.valueType == 3 ) {
      if ( this.boolValue ) {
        return "true";
      }
      return "false";
    }
    if ( this.valueType == 4 ) {
      let result = "[";
      let i = 0;
      while (i < (this.arrayValue.length)) {
        if ( i > 0 ) {
          result = result + ", ";
        }
        const item = this.arrayValue[i];
        =result+resultitem.toString
        i = i + 1;
      };
      return result + "]";
    }
    if ( this.valueType == 5 ) {
      let result_1 = "{";
      let i_1 = 0;
      while (i_1 < (this.objectKeys.length)) {
        if ( i_1 > 0 ) {
          result_1 = result_1 + ", ";
        }
        const key = this.objectKeys[i_1];
        const val = this.objectValues[i_1];
        =result_1+++resultkey": "val.toString
        i_1 = i_1 + 1;
      };
      return result_1 + "}";
    }
    if ( this.valueType == 6 ) {
      return ("[Function: " + this.functionName) + "]";
    }
    return "undefined";
  };
  toBool () {
    if ( this.valueType == 0 ) {
      return false;
    }
    if ( this.valueType == 1 ) {
      return this.numberValue != 0.0;
    }
    if ( this.valueType == 2 ) {
      return (this.stringValue.length) > 0;
    }
    if ( this.valueType == 3 ) {
      return this.boolValue;
    }
    if ( this.valueType == 4 ) {
      return true;
    }
    if ( this.valueType == 5 ) {
      return true;
    }
    if ( this.valueType == 6 ) {
      return true;
    }
    return false;
  };
  getMember (key) {
    if ( this.valueType == 5 ) {
      let i = 0;
      while (i < (this.objectKeys.length)) {
        if ( (this.objectKeys[i]) == key ) {
          return this.objectValues[i];
        }
        i = i + 1;
      };
    }
    if ( this.valueType == 4 ) {
      if ( key == "length" ) {
        return EvalValue.fromInt((this.arrayValue.length));
      }
    }
    if ( this.valueType == 2 ) {
      if ( key == "length" ) {
        return EvalValue.fromInt((this.stringValue.length));
      }
    }
    return EvalValue.null();
  };
  getIndex (index) {
    if ( this.valueType == 4 ) {
      if ( (index >= 0) && (index < (this.arrayValue.length)) ) {
        return this.arrayValue[index];
      }
    }
    if ( this.valueType == 2 ) {
      if ( (index >= 0) && (index < (this.stringValue.length)) ) {
        return EvalValue.string((this.stringValue.charCodeAt(index )));
      }
    }
    return EvalValue.null();
  };
  equals (other) {
    if ( this.valueType != other.valueType ) {
      return false;
    }
    if ( this.valueType == 0 ) {
      return true;
    }
    if ( this.valueType == 1 ) {
      return this.numberValue == other.numberValue;
    }
    if ( this.valueType == 2 ) {
      return this.stringValue == other.stringValue;
    }
    if ( this.valueType == 3 ) {
      return this.boolValue == other.boolValue;
    }
    return false;
  };
}
EvalValue.null = function() {
  const v = new EvalValue();
  v.valueType = 0;
  return v;
};
EvalValue.number = function(n) {
  const v = new EvalValue();
  v.valueType = 1;
  v.numberValue = n;
  return v;
};
EvalValue.fromInt = function(n) {
  const v = new EvalValue();
  v.valueType = 1;
  v.numberValue = n;
  return v;
};
EvalValue.string = function(s) {
  const v = new EvalValue();
  v.valueType = 2;
  v.stringValue = s;
  return v;
};
EvalValue.boolean = function(b) {
  const v = new EvalValue();
  v.valueType = 3;
  v.boolValue = b;
  return v;
};
EvalValue.array = function(items) {
  const v = new EvalValue();
  v.valueType = 4;
  v.arrayValue = items;
  return v;
};
EvalValue.object = function(keys, values) {
  const v = new EvalValue();
  v.valueType = 5;
  v.objectKeys = keys;
  v.objectValues = values;
  return v;
};
class TestEvalValue  {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }
  expect (condition, msg) {
    if ( condition ) {
      console.log("  ✓ " + msg);
      this.passed = this.passed + 1;
    } else {
      console.log("  ✗ FAIL: " + msg);
      this.failed = this.failed + 1;
    }
  };
  header (name) {
    console.log("");
    console.log(("=== " + name) + " ===");
  };
  summary () {
    console.log("");
    console.log("================================");
    console.log("Tests: " + (((this.passed + this.failed).toString())));
    console.log("Passed: " + ((this.passed.toString())));
    console.log("Failed: " + ((this.failed.toString())));
    console.log("================================");
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const t = new TestEvalValue();
  t.header("Null value");
  const nullVal = EvalValue.null();
  t.expect(nullVal.isNull(), "isNull() returns true");
  t.expect(nullVal.isNumber(), "isNumber() returns false");
  t.expect((nullVal).toString(==, , "null"), "toString() returns 'null'");
  t.expect(nullVal.toBool(), "toBool() returns false");
  t.header("Number values");
  const num1 = EvalValue.number(42.0);
  t.expect(num1.isNumber(), "isNumber() returns true");
  t.expect(num1.numberValue == 42.0, "numberValue is 42.0");
  t.expect((num1).toString(==, , "42"), "toString() returns '42'");
  t.expect(num1.toBool(), "toBool() returns true for non-zero");
  const num2 = EvalValue.number(0.0);
  t.expect(num2.toBool(), "toBool() returns false for zero");
  const num3 = EvalValue.number(3.14);
  t.expect(num3.numberValue == 3.14, "numberValue is 3.14");
  const num4 = EvalValue.fromInt(100);
  t.expect(num4.numberValue == 100.0, "fromInt creates correct value");
  t.header("String values");
  const str1 = EvalValue.string("hello");
  t.expect(str1.isString(), "isString() returns true");
  t.expect(str1.stringValue == "hello", "stringValue is 'hello'");
  t.expect((str1).toString(==, , "hello"), "toString() returns 'hello'");
  t.expect(str1.toBool(), "toBool() returns true for non-empty string");
  const str2 = EvalValue.string("");
  t.expect(str2.toBool(), "toBool() returns false for empty string");
  t.header("Boolean values");
  const bool1 = EvalValue.boolean(true);
  t.expect(bool1.isBoolean(), "isBoolean() returns true");
  t.expect(bool1.boolValue, "boolValue is true");
  t.expect((bool1).toString(==, , "true"), "toString() returns 'true'");
  t.expect(bool1.toBool(), "toBool() returns true");
  const bool2 = EvalValue.boolean(false);
  t.expect(bool2.boolValue == false, "boolValue is false");
  t.expect((bool2).toString(==, , "false"), "toString() returns 'false'");
  t.expect(bool2.toBool(), "toBool() returns false");
  t.header("Type coercion - toNumber");
  const n1 = EvalValue.string("123");
  t.expect(n1.toNumber(), "string '123' converts to 123.0");
  const n2 = EvalValue.boolean(true);
  t.expect(n2.toNumber(), "true converts to 1.0");
  const n3 = EvalValue.boolean(false);
  t.expect(n3.toNumber(), "false converts to 0.0");
  const n4 = EvalValue.null();
  t.expect(n4.toNumber(), "null converts to 0.0");
  t.header("Array values");
  let items = [];
  items.push(EvalValue.number(1.0));
  items.push(EvalValue.number(2.0));
  items.push(EvalValue.number(3.0));
  const arr = EvalValue.array(items);
  t.expect((arr).isArray(), "isArray() returns true");
  t.expect(arr.toBool(), "arrays are truthy");
  t.expect((arr.arrayValue.length) == 3, "array has 3 items");
  const first = arr.getIndex(0);
  t.expect(first.numberValue == 1.0, "getIndex(0) returns first element");
  const third = arr.getIndex(2);
  t.expect(third.numberValue == 3.0, "getIndex(2) returns third element");
  const outOfBounds = arr.getIndex(10);
  t.expect(outOfBounds.isNull(), "out of bounds returns null");
  const arrLen = arr.getMember("length");
  t.expect(arrLen.numberValue == 3.0, "getMember('length') returns 3");
  t.header("Array toString");
  const arrStr = (arr).toString();
  t.expect(arrStr == "[1, 2, 3]", "array toString is '[1, 2, 3]'");
  t.header("Object values");
  let keys = [];
  let values = [];
  keys.push("name");
  values.push(EvalValue.string("Alice"));
  keys.push("age");
  values.push(EvalValue.number(30.0));
  const obj = EvalValue.object(keys, values);
  t.expect(obj.isObject(), "isObject() returns true");
  t.expect(obj.toBool(), "objects are truthy");
  const nameVal = obj.getMember("name");
  t.expect(nameVal.stringValue == "Alice", "getMember('name') returns 'Alice'");
  const ageVal = obj.getMember("age");
  t.expect(ageVal.numberValue == 30.0, "getMember('age') returns 30");
  const missing = obj.getMember("unknown");
  t.expect(missing.isNull(), "unknown key returns null");
  t.header("Object toString");
  const objStr = (obj).toString();
  console.log(objStr);
  t.expect((objStr.length) > 5, "object toString has content");
  t.header("String properties");
  const testStr = EvalValue.string("hello");
  const strLen = testStr.getMember("length");
  t.expect(strLen.numberValue == 5.0, "string length is 5");
  const char0 = testStr.getIndex(0);
  t.expect(char0.stringValue == "h", "getIndex(0) returns 'h'");
  const char4 = testStr.getIndex(4);
  t.expect(char4.stringValue == "o", "getIndex(4) returns 'o'");
  t.header("Equality checks");
  const a1 = EvalValue.number(42.0);
  const a2 = EvalValue.number(42.0);
  const a3 = EvalValue.number(99.0);
  t.expect(a1.equals(a2), "42 equals 42");
  t.expect(a1.equals(==), "42 does not equal 99");
  const s1 = EvalValue.string("test");
  const s2 = EvalValue.string("test");
  const s3 = EvalValue.string("other");
  t.expect(s1.equals(s2), "'test' equals 'test'");
  t.expect(s1.equals(==), "'test' does not equal 'other'");
  const b1 = EvalValue.boolean(true);
  const b2 = EvalValue.boolean(true);
  const b3 = EvalValue.boolean(false);
  t.expect(b1.equals(b2), "true equals true");
  t.expect(b1.equals(==), "true does not equal false");
  const null1 = EvalValue.null();
  const null2 = EvalValue.null();
  t.expect(null1.equals(null2), "null equals null");
  t.expect(a1.equals(==), "number does not equal string");
  t.expect(b1.equals(==), "boolean does not equal null");
  t.summary();
}
__js_main();
