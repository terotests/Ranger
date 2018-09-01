Import "ng_DictNode.clj"

class JSONParser:void {
  
  def i:int 0
  def len:int 0
  def next:DictNode
  def tag_depth:int 0

  fn parse@(optional):DictNode (str:string) {
    
    def s:charbuffer (to_charbuffer str)
    def rootNode:DictNode
    def c:char 0
    def next_c:char 0
    def fc:char 0
    def new_node:DictNode
    def sp:int i
    def ep:int i
    def last_i:int 0
    def cc1:char 0
    def cc2:char 0
    len = (length s)
    def curr_node@(weak):DictNode
    def parents@(weak):[DictNode]

    while (i < len) {
      last_i = i
      while ((i < len) && ((charAt s i) <= 32)) {
        i = (1 + i)
      }
      cc1 = (charAt s i)
      if (cc1 == (ccode "]")) {
        removeLast parents
        if curr_node.is_property_value {
          removeLast parents
        }
        def p_cnt:int (array_length parents)
        if( p_cnt == 0 ) {
          break
        }
        def last_parent:DictNode (itemAt parents (p_cnt - 1))
        curr_node = last_parent
        i = (i + 1)
        continue _
      }
      if (cc1 == (ccode "}")) {
        removeLast parents
        if curr_node.is_property_value {
          removeLast parents
        }
        def p_cnt:int (array_length parents)
        if( p_cnt == 0 ) {
          break
        }
        def last_parent:DictNode (itemAt parents (p_cnt - 1))
        curr_node = last_parent
        i = (i + 1)
        continue _
      }
      if (cc1 == (ccode ",")) {
        i = (i + 1)
        continue _
      }
      if (cc1 == (ccode ":")) {
        i = (i + 1)
        continue _
      }
      fc = cc1
      if ((fc == (ccode "n")) && ((charAt s (i + 1)) == (ccode "u")) && ((charAt s (i + 2)) == (ccode "l")) && ((charAt s (i + 3)) == (ccode "l"))) {
        if curr_node.is_property {
          curr_node.value_type = DictNodeType.Null
          removeLast parents
          def p_cnt:int (array_length parents)
          def last_parent:DictNode (itemAt parents (p_cnt - 1))
          curr_node = last_parent
        } {
          def new_attr:DictNode (new DictNode ())
          new_attr.value_type = DictNodeType.Null
          push curr_node.children new_attr
        }
        i = (i + 4)
        continue _
      }
      if ((fc == (ccode "t")) && ((charAt s (i + 1)) == (ccode "r")) && ((charAt s (i + 2)) == (ccode "u")) && ((charAt s (i + 3)) == (ccode "e"))) {
        if curr_node.is_property {
          curr_node.value_type = DictNodeType.Boolean
          curr_node.boolean_value = true
          removeLast parents
          def p_cnt:int (array_length parents)
          def last_parent:DictNode (itemAt parents (p_cnt - 1))
          curr_node = last_parent
        } {
          def new_attr:DictNode (new DictNode ())
          new_attr.value_type = DictNodeType.Boolean
          new_attr.boolean_value = true
          push curr_node.children new_attr
        }
        i = (i + 4)
        continue _
      }
      if ((fc == (ccode "f")) && ((charAt s (i + 1)) == (ccode "a")) && ((charAt s (i + 2)) == (ccode "l")) && ((charAt s (i + 3)) == (ccode "s")) && ((charAt s (i + 4)) == (ccode "e"))) {
        if curr_node.is_property {
          curr_node.value_type = DictNodeType.Boolean
          curr_node.boolean_value = false
          removeLast parents
          def p_cnt:int (array_length parents)
          def last_parent:DictNode (itemAt parents (p_cnt - 1))
          curr_node = last_parent
        } {
          def new_attr2:DictNode (new DictNode ())
          new_attr2.value_type = DictNodeType.Boolean
          new_attr2.boolean_value = false
          push curr_node.children new_attr2
        }
        i = (i + 5)
        continue _
      }
      if (((fc == 45) && ((charAt s (i + 1)) >= 46) && ((charAt s (i + 1)) <= 57)) || ((fc >= 48) && (fc <= 57))) {
        sp = i
        i = (1 + i)
        c = (charAt s i)
        while ((i < len) && (((c >= 48) && (c <= 57)) || (c == (ccode "e")) || (c == (ccode "E")) || (c == (ccode ".")) || (c == (ccode "+")) || (c == (ccode "-")))) {
          i = (1 + i)
          c = (charAt s i)
        }
        ep = i
        if curr_node.is_property {
          curr_node.value_type = DictNodeType.Double
          def dv@(opional):double (str2double (substring s sp ep))
          if dv {
            curr_node.double_value = (unwrap dv)
          }
          removeLast parents
          def p_cnt:int (array_length parents)
          def last_parent:DictNode (itemAt parents (p_cnt - 1))
          curr_node = last_parent
          continue _
        } {
          def new_attr:DictNode (new DictNode ())
          new_attr.value_type = DictNodeType.Double
          new_attr.double_value = (unwrap (str2double (substring s sp ep)))
          push curr_node.children new_attr
          continue _
        }
      }
      if (cc1 == 34) {
        sp = (i + 1)
        ep = sp
        c = (charAt s i)
        def must_encode:boolean false
        while (i < len) {
          i = (1 + i)
          c = (charAt s i)
          if (c == 34) {
            break _
          }
          if (c == 92) {
            i = (1 + i)
            if (i < len) {
              must_encode = true
              c = (charAt s i)
            } {
              break _
            }
          }
        }
        ep = i
        if (i < len) {
          def encoded_str:string ""
          if must_encode {
            def orig_str:string (substring s sp ep)
            def str_length:int (strlen orig_str)
            def ii:int 0
            while (ii < str_length) {
              def cc:int (charAt orig_str ii)
              if (cc == 92) {
                def next_ch:int (charAt orig_str (ii + 1))
                switch next_ch {
                  case 34 {
                    encoded_str = (encoded_str + (strfromcode 34))
                  }
                  case 92 {
                    encoded_str = (encoded_str + (strfromcode 92))
                  }
                  case 47 {
                    encoded_str = (encoded_str + (strfromcode 47))
                  }
                  case 98 {
                    encoded_str = (encoded_str + (strfromcode 8))
                  }
                  case 102 {
                    encoded_str = (encoded_str + (strfromcode 12))
                  }
                  case 110 {
                    encoded_str = (encoded_str + (strfromcode 10))
                  }
                  case 114 {
                    encoded_str = (encoded_str + (strfromcode 13))
                  }
                  case 116 {
                    encoded_str = (encoded_str + (strfromcode 9))
                  }
                  case 117 {
                    ; TODO \uxxxx not implemented
                    ii = ii + 4
                  }
                  default {

                  }
                  
                }
                ii = (ii + 2)
              } {
                encoded_str = (encoded_str + (substring orig_str ii (1 + ii)))
                ii = (ii + 1)
              }
            }
          }
          if curr_node.is_property {
            if must_encode {
              curr_node.string_value = encoded_str
            } {
              curr_node.string_value = (substring s sp ep)
            }
            curr_node.value_type = DictNodeType.String
            removeLast parents
            def p_cnt:int (array_length parents)
            def last_parent:DictNode (itemAt parents (p_cnt - 1))
            curr_node = last_parent
            i = (i + 1)
            continue _
          }
          if (curr_node.value_type == DictNodeType.Array) {
            def new_attr:DictNode (new DictNode ())
            new_attr.value_type = DictNodeType.String
            if must_encode {
              new_attr.string_value = encoded_str
            } {
              new_attr.string_value = (substring s sp ep)
            }
            push curr_node.children new_attr
            i = (i + 1)
            continue _
          }
          if (curr_node.value_type == DictNodeType.Object) {
            def new_prop:DictNode (new DictNode ())
            new_prop.is_property = true
            new_prop.vref = (substring s sp ep)
            push curr_node.keys new_prop.vref
            set curr_node.objects new_prop.vref new_prop
            push parents new_prop
            curr_node = new_prop
            i = (i + 1)
            continue 1
          }
        }
      }
      if (cc1 == (ccode "{")) {
        if (null? curr_node) {
          def new_node:DictNode (new DictNode ())
          new_node.value_type = DictNodeType.Object
          push parents new_node
          curr_node = new_node
          rootNode = new_node
          curr_node = new_node
        } {
          if curr_node.is_property {
            def new_node:DictNode (new DictNode ())
            new_node.value_type = DictNodeType.Object
            push parents new_node
            curr_node.object_value = new_node
            curr_node.value_type = DictNodeType.Object
            new_node.value_type = DictNodeType.Object
            new_node.is_property_value = true
            curr_node = new_node
          } {
            def new_node:DictNode (new DictNode ())
            new_node.value_type = DictNodeType.Object
            push parents new_node
            push curr_node.children new_node
            curr_node = new_node
          }
        }
        i = (i + 1)
        continue _
      }
      if (cc1 == (ccode "[")) {
        if (null? curr_node) {
          def new_node:DictNode (new DictNode ())
          new_node.value_type = DictNodeType.Array
          push parents new_node
          curr_node = new_node
          rootNode = new_node
        } {
          if curr_node.is_property {
            def new_node:DictNode (new DictNode ())
            new_node.value_type = DictNodeType.Array
            push parents new_node
            curr_node.object_value = new_node
            curr_node.value_type = DictNodeType.Object
            new_node.is_property_value = true
            curr_node = new_node
        } {
            def new_node:DictNode (new DictNode ())
            new_node.value_type = DictNodeType.Array
            push parents new_node
            push curr_node.children new_node
            curr_node = new_node
          }
        }
        i = (i + 1)
        continue _
      }
      if (last_i == i) {
        i = (1 + i)
      }
    }
    return rootNode
  }

  sfn testcase@(main):void () {
    def p:JSONParser (new JSONParser())
    def n:DictNode (p.parse("{\"n\":\"ClientMessage\",\"data\":{\"text\":\"-- text not filled --\",\"user\":{\"n\":\"UserInfo\",\"data\":{\"name\":\"Logged User\"}}}}"))
    if n {
      print "--> parsed"
      def nn:DictNode (unwrap n)
      def name@(optional):string (nn.getString("n"))
      if(!null? name) {
        print (unwrap name)
        def data@(optional):DictNode (nn.getObject("data"))
        if data {
          print(data.stringify())
        }
      }
      print (nn.stringify())
    }
  }
}

