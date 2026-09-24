
ColorConsolen dependencynä on chalk eli kääntäjä ei oo ihan standalone.
require('chalk')

--> tämä on poistettu nyt

-------------------

Ranger codebasesta itsestään puuttuu koodidokumentaatio, esim tämmöinen

fn whole:VlDataRow (field:string value:int) {
    obj.setMember(field (VlJson.intValue(value)))
    return this
} doc {
    public
    category "Data"
    description "Puts a whole number in one column of this row.

A count is an integer and prints as one: 12, not 12.0. Use this rather than
`num` wherever the value counts things, or the axis labels will say so."
    param field "The column name."
    param value "The value."
    returns "This row, so columns chain."
    see num
}


------

EVG is a bit like also native bindings lib:
    - consider moving those bindings into some other place
    - maybe...

------

lib folder needs to be cleaned:

- lot of old stuff that is no longer relevant: 
  - ACEEditor, Engine3D...
  - service_url
  - ViewLib, WebLib, WebServerLib
  - JinxProcess
- some good libraries, but no documentation, 
  - like maybe base64
  - image libraries
  - EVG is there, but it has been moved also to separate repo, consider
  - RgU32 ? is this needed
  - RgNum, RgText....
    - RgTest herättää vähän kysymyksiä string supportin tilasta nyt.
  - zip
  - Shell.rgr I think?
- Lot of files that needs to be evaluated, are they good anymore?




-------------------

class CLIConsole  on aika geneerinen, se voisi olla ihan oma Ranger kirjastonsa, jota ei käytetä suoraan kääntäjän "ytimestä" tai siitä voisi erottaa oman CLI
kirjastonsa.

--- varmistettava et tää optional primitive on poissa


template <class T>
class r_optional_primitive {
  public:
    // has_value has to start false: cpp_str_to_int and its siblings leave the
    // field untouched when the conversion throws, and an indeterminate bool
    // made a failed str2int read back as a value on the C++ target.
    bool has_value = false;
    T value = T();
    r_optional_primitive() {}
    // a plain value placed into an optional slot: returning a bare string
    // from a function declared @(optional):string arrives here. Declaring
    // any constructor takes the implicit default one away, hence the pair.
    r_optional_primitive(const T & a_value) : has_value(true), value(a_value) {}
    r_optional_primitive<T> & operator=(const r_optional_primitive<T> & rhs) {
        has_value = rhs.has_value;
        value = rhs.value;
        return *this;
    }
    r_optional_primitive<T> & operator=(const T a_value) {
        has_value = true;
        value = a_value;
        return *this;
    }
};

--- tää toDict voisi olla kiva esimerkki playgroundilla,
Ranger kooodi:


Enum RangerNodeType:int (
  NoType
  InvalidType
  Double
  Integer
  String     
  Boolean      ; 5
  Array
  Hash
  ImmutableArray
  ImmutableHash
  Object      ; 10
  VRef        ; 11
  Comment
  Enum
  Char
  CharBuffer
  Buffer
  IntBuffer
  DoubleBuffer
  Expression
  ExpressionType
  Lambda
  XMLNode
  XMLText
  XMLAttr
  XMLCDATA
  Dictionary
  Any
  Class       ; 25
  GenericClass
  ClassRef
  Method
  ClassVar
  Function
  Literal
  Quasiliteral
  Null
  ArrayLiteral
)


class CodeNodeLiteral @serialize(true) {
  def expression:boolean false
  def vref:string ""
  def is_block_node:boolean false
  def type_name:string ""
  def key_type:string ""
  def array_type:string ""
  def ns:[string]
  def has_vref_annotation:boolean false
  def vref_annotation:CodeNodeLiteral
  def has_type_annotation:boolean false
  def type_annotation:CodeNodeLiteral
  def parsed_type:RangerNodeType RangerNodeType.NoType
  def value_type:RangerNodeType RangerNodeType.NoType
  def double_value:double 0.0
  def string_value:string ""
  def int_value:int 0
  def boolean_value:boolean false
  def expression_value:CodeNodeLiteral
  def props:[string:CodeNodeLiteral]
  def prop_keys:[string]
  def comments:[CodeNodeLiteral]
  def children:[CodeNodeLiteral]
  def attrs:[CodeNodeLiteral]
};

JavaScript:

class CodeNodeLiteral  {
  constructor() {
    this.expression = false;
    this.vref = "";
    this.is_block_node = false;
    this.type_name = "";
    this.key_type = "";
    this.array_type = "";
    this.ns = [];
    this.has_vref_annotation = false;
    this.vref_annotation = undefined;
    this.has_type_annotation = false;
    this.type_annotation = undefined;
    this.parsed_type = 0;
    this.value_type = 0;
    this.double_value = 0.0;
    this.string_value = "";
    this.int_value = 0;
    this.boolean_value = false;
    this.expression_value = undefined;
    this.props = {};
    this.prop_keys = [];
    this.comments = [];
    this.children = [];
    this.attrs = [];
  }
  toDictionary () {
    let res = {};
    try {
      res["expression"] = this.expression;
      res["vref"] = this.vref;
      res["is_block_node"] = this.is_block_node;
      res["type_name"] = this.type_name;
      res["key_type"] = this.key_type;
      res["array_type"] = this.array_type;
      let values = [];
      for ( const item of this.ns) {
        values.push(item);
      }
      res["ns"] = values;
      res["has_vref_annotation"] = this.has_vref_annotation;
      if ( (typeof(this.vref_annotation) !== "undefined" && this.vref_annotation != null )  ) {
        res["vref_annotation"] = this.vref_annotation.toDictionary();
      }
      res["has_type_annotation"] = this.has_type_annotation;
      if ( (typeof(this.type_annotation) !== "undefined" && this.type_annotation != null )  ) {
        res["type_annotation"] = this.type_annotation.toDictionary();
      }
      res["parsed_type"] = this.parsed_type;
      res["value_type"] = this.value_type;
      res["double_value"] = this.double_value;
      res["string_value"] = this.string_value;
      res["int_value"] = this.int_value;
      res["boolean_value"] = this.boolean_value;
      if ( (typeof(this.expression_value) !== "undefined" && this.expression_value != null )  ) {
        res["expression_value"] = this.expression_value.toDictionary();
      }
      let values_1 = {};
      const keyList = Object.keys(this.props);
      for ( const keyname of keyList) {
        const item_1 = ( Object.prototype.hasOwnProperty.call(this.props, keyname) ? this.props[keyname] : undefined );
        const obj = item_1.toDictionary();
        values_1[keyname] = obj;
      }
      res["props"] = values_1;
      let values_2 = [];
      for ( const item_2 of this.prop_keys) {
        values_2.push(item_2);
      }
      res["prop_keys"] = values_2;
      let values_3 = [];
      for ( const item_3 of this.comments) {
        const obj_1 = item_3.toDictionary();
        values_3.push(obj_1);
      }
      res["comments"] = values_3;
      let values_4 = [];
      for ( const item_4 of this.children) {
        const obj_2 = item_4.toDictionary();
        values_4.push(obj_2);
      }
      res["children"] = values_4;
      let values_5 = [];
      for ( const item_5 of this.attrs) {
        const obj_3 = item_5.toDictionary();
        values_5.push(obj_3);
      }
      res["attrs"] = values_5;
    } catch(e) {
    }
    return res;
  };
}
CodeNodeLiteral.fromDictionary = function(dict) {
  const obj = new CodeNodeLiteral();
  try {
    const v = typeof(dict ["expression"]) === "undefined" ? undefined :(dict ["expression"]) ;
    if ( (typeof(v) !== "undefined" && v != null )  ) {
      obj.expression = v;
    }
    const v_1 = (typeof (dict ["vref"]) != "string" ) ? undefined : dict ["vref"] 
    ;
    if ( (typeof(v_1) !== "undefined" && v_1 != null )  ) {
      obj.vref = v_1;
    }
    const v_2 = typeof(dict ["is_block_node"]) === "undefined" ? undefined :(dict ["is_block_node"]) ;
    if ( (typeof(v_2) !== "undefined" && v_2 != null )  ) {
      obj.is_block_node = v_2;
    }
    const v_3 = (typeof (dict ["type_name"]) != "string" ) ? undefined : dict ["type_name"] 
    ;
    if ( (typeof(v_3) !== "undefined" && v_3 != null )  ) {
      obj.type_name = v_3;
    }
    const v_4 = (typeof (dict ["key_type"]) != "string" ) ? undefined : dict ["key_type"] 
    ;
    if ( (typeof(v_4) !== "undefined" && v_4 != null )  ) {
      obj.key_type = v_4;
    }
    const v_5 = (typeof (dict ["array_type"]) != "string" ) ? undefined : dict ["array_type"] 
    ;
    if ( (typeof(v_5) !== "undefined" && v_5 != null )  ) {
      obj.array_type = v_5;
    }
    const values = (dict["ns"] instanceof Array ) ? dict ["ns"] : undefined ;
    if ( (typeof(values) !== "undefined" && values != null )  ) {
      const arr = values;
      const arr_len = arr.length;
      let arr_i = 0;
      while (arr_i < arr_len) {
        const item = arr[arr_i];
        if( typeof(item) === 'string' ) /* union case for string */ {
          var oo = item;
          obj.ns.push(oo);
        };
        arr_i = arr_i + 1;
      };
    }
    const v_6 = typeof(dict ["has_vref_annotation"]) === "undefined" ? undefined :(dict ["has_vref_annotation"]) ;
    if ( (typeof(v_6) !== "undefined" && v_6 != null )  ) {
      obj.has_vref_annotation = v_6;
    }
    const theValue = (dict["vref_annotation"] instanceof Object ) ? dict ["vref_annotation"] : undefined ;
    if ( (typeof(theValue) !== "undefined" && theValue != null )  ) {
      const newObj = CodeNodeLiteral.fromDictionary(theValue);
      obj.vref_annotation = newObj;
    }
    const v_7 = typeof(dict ["has_type_annotation"]) === "undefined" ? undefined :(dict ["has_type_annotation"]) ;
    if ( (typeof(v_7) !== "undefined" && v_7 != null )  ) {
      obj.has_type_annotation = v_7;
    }
    const theValue_1 = (dict["type_annotation"] instanceof Object ) ? dict ["type_annotation"] : undefined ;
    if ( (typeof(theValue_1) !== "undefined" && theValue_1 != null )  ) {
      const newObj_1 = CodeNodeLiteral.fromDictionary(theValue_1);
      obj.type_annotation = newObj_1;
    }
    const v_8 = isNaN( parseFloat(dict ["double_value"]) ) ? undefined : parseFloat(dict ["double_value"]) 
    ;
    if ( (typeof(v_8) !== "undefined" && v_8 != null )  ) {
      obj.double_value = v_8;
    }
    const v_9 = (typeof (dict ["string_value"]) != "string" ) ? undefined : dict ["string_value"] 
    ;
    if ( (typeof(v_9) !== "undefined" && v_9 != null )  ) {
      obj.string_value = v_9;
    }
    const v_10 = isNaN( parseInt(dict ["int_value"]) ) ? undefined : parseInt(dict ["int_value"]) 
    ;
    if ( (typeof(v_10) !== "undefined" && v_10 != null )  ) {
      obj.int_value = v_10;
    }
    const v_11 = typeof(dict ["boolean_value"]) === "undefined" ? undefined :(dict ["boolean_value"]) ;
    if ( (typeof(v_11) !== "undefined" && v_11 != null )  ) {
      obj.boolean_value = v_11;
    }
    const theValue_2 = (dict["expression_value"] instanceof Object ) ? dict ["expression_value"] : undefined ;
    if ( (typeof(theValue_2) !== "undefined" && theValue_2 != null )  ) {
      const newObj_2 = CodeNodeLiteral.fromDictionary(theValue_2);
      obj.expression_value = newObj_2;
    }
    const values_1 = (dict["props"] instanceof Object ) ? dict ["props"] : undefined ;
    if ( (typeof(values_1) !== "undefined" && values_1 != null )  ) {
      const theObjprops = values_1;
      const obj_keys = Object.keys(theObjprops);
      const key_len = obj_keys.length;
      let key_i = 0;
      while (key_i < key_len) {
        const item_1 = obj_keys[key_i];
        const theValue_3 = (theObjprops[item_1] instanceof Object ) ? theObjprops [item_1] : undefined ;
        if ( (typeof(theValue_3) !== "undefined" && theValue_3 != null )  ) {
          const newObj_3 = CodeNodeLiteral.fromDictionary(theValue_3);
          obj.props[item_1] = newObj_3;
        }
        key_i = key_i + 1;
      };
    }
    const values_2 = (dict["prop_keys"] instanceof Array ) ? dict ["prop_keys"] : undefined ;
    if ( (typeof(values_2) !== "undefined" && values_2 != null )  ) {
      const arr_1 = values_2;
      const arr_len_1 = arr_1.length;
      let arr_i_1 = 0;
      while (arr_i_1 < arr_len_1) {
        const item_2 = arr_1[arr_i_1];
        if( typeof(item_2) === 'string' ) /* union case for string */ {
          var oo_1 = item_2;
          obj.prop_keys.push(oo_1);
        };
        arr_i_1 = arr_i_1 + 1;
      };
    }
    const values_3 = (dict["comments"] instanceof Array ) ? dict ["comments"] : undefined ;
    if ( (typeof(values_3) !== "undefined" && values_3 != null )  ) {
      const arr_2 = values_3;
      const arr_len_2 = arr_2.length;
      let arr_i_2 = 0;
      while (arr_i_2 < arr_len_2) {
        const item_3 = arr_2[arr_i_2];
        if( item_3 instanceof Object ) /* union case */ {
          var oo_2 = item_3;
          const newObj_4 = CodeNodeLiteral.fromDictionary(oo_2);
          obj.comments.push(newObj_4);
        };
        arr_i_2 = arr_i_2 + 1;
      };
    }
    const values_4 = (dict["children"] instanceof Array ) ? dict ["children"] : undefined ;
    if ( (typeof(values_4) !== "undefined" && values_4 != null )  ) {
      const arr_3 = values_4;
      const arr_len_3 = arr_3.length;
      let arr_i_3 = 0;
      while (arr_i_3 < arr_len_3) {
        const item_4 = arr_3[arr_i_3];
        if( item_4 instanceof Object ) /* union case */ {
          var oo_3 = item_4;
          const newObj_5 = CodeNodeLiteral.fromDictionary(oo_3);
          obj.children.push(newObj_5);
        };
        arr_i_3 = arr_i_3 + 1;
      };
    }
    const values_5 = (dict["attrs"] instanceof Array ) ? dict ["attrs"] : undefined ;
    if ( (typeof(values_5) !== "undefined" && values_5 != null )  ) {
      const arr_4 = values_5;
      const arr_len_4 = arr_4.length;
      let arr_i_4 = 0;
      while (arr_i_4 < arr_len_4) {
        const item_5 = arr_4[arr_i_4];
        if( item_5 instanceof Object ) /* union case */ {
          var oo_4 = item_5;
          const newObj_6 = CodeNodeLiteral.fromDictionary(oo_4);
          obj.attrs.push(newObj_6);
        };
        arr_i_4 = arr_i_4 + 1;
      };
    }
  } catch(e) {
  }
  return obj;
};

--- yllä olevassa esimerkissä voisi ehkä olla

class Main {
  sfn main() {
      def node (new CodeNodeLiteral())
      print (node.toDictionary())
    }
}


HUOM! Vanhoissa koodeissa esimerkki menee:

  sfn m@(main):void () {

README.md korjattu yksinkertaisin esimerkki, voisi korjata kaikkiin muihinkin:

class Hello {
    sfn main () {
        print "Hello World"
    }
}

---- playgroundin target lista

TypeScript näemmä puuttuu vaikka se on mm. idiomacy listassa mukana....

-- alla olevat ei pidä paikkaansa, esim. tää koodi kääntyy ihan hyvin

class HelloWorld {
    fn contains:string () {
       return "Hello World my friend"
    }

    sfn main() {
      def c (new HelloWorld())
      print c.contains()
    }
}


Why does the compiler say that a class does not have a method that I wrote?
The compiler resolves some method names in another place. A class can define one of these names, and the class compiles. Each call to that method then fails with Class X does not have method ….

Do not use as a method name	A name that works
contains	hasSub
startsWith	beginsWith
endsWith	finishesWith
trim	trimWs
first	lowest
last	highest
remove	removeNode
insert	insertNode



--- luokkiin tulee tarpeettomia metodeja, esim. konstructori vaikka se on tyhjä

class HelloWorld {
    fn contains:string () {
       return "Hello World my friend"
    }
}

class HelloWorld  {
  constructor() {
  }
  contains () {
    return "Hello World my friend";
  };
}

--- havainto, dokumentointi enginestä ei ole paljoa...


    fn whole:VlDataRow (field:string value:int) {
        obj.setMember(field (VlJson.intValue(value)))
        return this
    } doc {
        public
        category "Data"
        description "Puts a whole number in one column of this row.

A count is an integer and prints as one: 12, not 12.0. Use this rather than
`num` wherever the value counts things, or the axis labels will say so."
        param field "The column name."
        param value "The value."
        returns "This row, so columns chain."
        see num
    }

