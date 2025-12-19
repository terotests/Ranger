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
      const parsed = isNaN( parseFloat(this.stringValue) ) ? undefined : parseFloat(this.stringValue);
      return parsed;
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
        const itemStr = (item).toString();
        result = result + itemStr;
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
        const valStr = (val).toString();
        result_1 = ((result_1 + key) + ": ") + valStr;
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
        const charStr = this.stringValue.substring(index, (index + 1) );
        return EvalValue.string(charStr);
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
class EvalValueModule  {
  constructor() {
  }
}
module.exports.EvalValue = EvalValue;
module.exports.EvalValueModule = EvalValueModule;
