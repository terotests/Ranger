import java.util.Optional;
import java.util.*;
import java.io.*;

class RangerLispParser { 
  public Optional<SourceCode> code = Optional.empty();
  public Optional<byte[]> buff = Optional.empty();
  public int __len = 0;
  public int i = 0;
  public ArrayList<CodeNode> parents = new ArrayList<CodeNode>();
  public Optional<CodeNode> next = Optional.empty()     /** note: unused */;
  public int paren_cnt = 0;
  public int get_op_pred = 0     /** note: unused */;
  public Optional<CodeNode> rootNode = Optional.empty();
  public Optional<CodeNode> curr_node = Optional.empty();
  public boolean had_error = false;
  
  RangerLispParser( SourceCode code_module  ) {
    buff = Optional.of(code_module.code.getBytes());
    code = Optional.of(code_module);
    __len = (buff.get()).length;
    rootNode = Optional.of(new CodeNode(code.get(), 0, 0));
    rootNode.get().is_block_node = true;
    rootNode.get().expression = true;
    curr_node = rootNode;
    parents.add(curr_node.get());
    paren_cnt = 1;
  }
  
  public void joo( SourceCode cm ) {
    /** unused:  final int ll = cm.code.length()   **/ ;
  }
  
  public CodeNode parse_raw_annotation() {
    int sp = i;
    int ep = i;
    i = i + 1;
    sp = i;
    ep = i;
    if ( i < __len ) {
      final CodeNode a_node2 = new CodeNode(code.get(), sp, ep);
      a_node2.expression = true;
      curr_node = Optional.of(a_node2);
      parents.add(a_node2);
      i = i + 1;
      paren_cnt = paren_cnt + 1;
      this.parse();
      return a_node2;
    } else {
    }
    return new CodeNode(code.get(), sp, ep);
  }
  
  public boolean skip_space( boolean is_block_parent ) {
    final byte[] s = buff.get();
    boolean did_break = false;
    if ( i >= __len ) {
      return true;
    }
    byte c = s[i];
    /** unused:  final boolean bb = c == (46)   **/ ;
    while ((i < __len) && (c <= 32)) {
      if ( is_block_parent && ((c == 10) || (c == 13)) ) {
        this.end_expression();
        did_break = true;
        break;
      }
      i = 1 + i;
      if ( i >= __len ) {
        return true;
      }
      c = s[i];
    }
    return did_break;
  }
  
  public boolean end_expression() {
    i = 1 + i;
    if ( i >= __len ) {
      return false;
    }
    paren_cnt = paren_cnt - 1;
    if ( paren_cnt < 0 ) {
      System.out.println(String.valueOf( "Parser error ) mismatch" ) );
    }
    parents.remove(parents.size() - 1);
    if ( curr_node.isPresent() ) {
      curr_node.get().ep = i;
      curr_node.get().infix_operator = false;
    }
    if ( (parents.size()) > 0 ) {
      curr_node = Optional.of(parents.get(((parents.size()) - 1)));
    } else {
      curr_node = rootNode;
    }
    curr_node.get().infix_operator = false;
    return true;
  }
  
  public int getOperator() {
    final byte[] s = buff.get();
    if ( (i + 2) >= __len ) {
      return 0;
    }
    final byte c = s[i];
    final byte c2 = s[(i + 1)];
    switch (c ) { 
      case 42 : 
        i = i + 1;
        return 14;
      case 47 : 
        i = i + 1;
        return 14;
      case 43 : 
        i = i + 1;
        return 13;
      case 45 : 
        i = i + 1;
        return 13;
      case 60 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 11;
        }
        i = i + 1;
        return 11;
      case 62 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 11;
        }
        i = i + 1;
        return 11;
      case 33 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 10;
        }
        return 0;
      case 61 : 
        if ( c2 == (61) ) {
          i = i + 2;
          return 10;
        }
        i = i + 1;
        return 3;
      case 38 : 
        if ( c2 == (38) ) {
          i = i + 2;
          return 6;
        }
        return 0;
      case 124 : 
        if ( c2 == (124) ) {
          i = i + 2;
          return 5;
        }
        return 0;
      default: 
        break;
    }
    return 0;
  }
  
  public int isOperator() {
    final byte[] s = buff.get();
    if ( (i - 2) > __len ) {
      return 0;
    }
    final byte c = s[i];
    final byte c2 = s[(i + 1)];
    switch (c ) { 
      case 42 : 
        return 1;
      case 47 : 
        return 14;
      case 43 : 
        return 13;
      case 45 : 
        return 13;
      case 60 : 
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
      case 62 : 
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
      case 33 : 
        if ( c2 == (61) ) {
          return 10;
        }
        return 0;
      case 61 : 
        if ( c2 == (61) ) {
          return 10;
        }
        return 3;
      case 38 : 
        if ( c2 == (38) ) {
          return 6;
        }
        return 0;
      case 124 : 
        if ( c2 == (124) ) {
          return 5;
        }
        return 0;
      default: 
        break;
    }
    return 0;
  }
  
  public int getOperatorPred( String str ) {
    switch (str ) { 
      case "<" : 
        return 11;
      case ">" : 
        return 11;
      case "<=" : 
        return 11;
      case ">=" : 
        return 11;
      case "==" : 
        return 10;
      case "!=" : 
        return 10;
      case "=" : 
        return 3;
      case "&&" : 
        return 6;
      case "||" : 
        return 5;
      case "+" : 
        return 13;
      case "-" : 
        return 13;
      case "*" : 
        return 14;
      case "/" : 
        return 14;
      default: 
        break;
    }
    return 0;
  }
  
  public void insert_node( CodeNode p_node ) {
    Optional<CodeNode> push_target = curr_node;
    if ( curr_node.get().infix_operator ) {
      push_target = curr_node.get().infix_node;
      if ( push_target.get().to_the_right ) {
        push_target = push_target.get().right_node;
        p_node.parent = push_target;
      }
    }
    push_target.get().children.add(p_node);
  }
  
  public void parse() {
    final byte[] s = buff.get();
    byte c = s[0];
    /** unused:  final byte next_c = 0   **/ ;
    byte fc = 0;
    Optional<CodeNode> new_node = Optional.empty();
    int sp = 0;
    int ep = 0;
    int last_i = 0;
    boolean had_lf = false;
    while (i < __len) {
      if ( had_error ) {
        break;
      }
      last_i = i;
      boolean is_block_parent = false;
      if ( had_lf ) {
        had_lf = false;
        this.end_expression();
        break;
      }
      if ( curr_node.isPresent() ) {
        if ( curr_node.get().parent.isPresent() ) {
          final Optional<CodeNode> nodeParent = curr_node.get().parent;
          if ( nodeParent.get().is_block_node ) {
            is_block_parent = true;
          }
        }
      }
      if ( this.skip_space(is_block_parent) ) {
        break;
      }
      had_lf = false;
      c = s[i];
      if ( i < __len ) {
        c = s[i];
        if ( c == 59 ) {
          sp = i + 1;
          while ((i < __len) && ((s[i]) > 31)) {
            i = 1 + i;
          }
          if ( i >= __len ) {
            break;
          }
          new_node = Optional.of(new CodeNode(code.get(), sp, i));
          new_node.get().parsed_type = 10;
          new_node.get().value_type = 10;
          new_node.get().string_value = new String(s,sp, i - sp );
          curr_node.get().comments.add(new_node.get());
          continue;
        }
        if ( i < (__len - 1) ) {
          fc = s[(i + 1)];
          if ( (((c == 40) || (c == (123))) || ((c == 39) && (fc == 40))) || ((c == 96) && (fc == 40)) ) {
            paren_cnt = paren_cnt + 1;
            if ( !curr_node.isPresent() ) {
              rootNode = Optional.of(new CodeNode(code.get(), i, i));
              curr_node = rootNode;
              if ( c == 96 ) {
                curr_node.get().parsed_type = 30;
                curr_node.get().value_type = 30;
              }
              if ( c == 39 ) {
                curr_node.get().parsed_type = 29;
                curr_node.get().value_type = 29;
              }
              curr_node.get().expression = true;
              parents.add(curr_node.get());
            } else {
              final CodeNode new_qnode = new CodeNode(code.get(), i, i);
              if ( c == 96 ) {
                new_qnode.value_type = 30;
              }
              if ( c == 39 ) {
                new_qnode.value_type = 29;
              }
              new_qnode.expression = true;
              this.insert_node(new_qnode);
              parents.add(new_qnode);
              curr_node = Optional.of(new_qnode);
            }
            if ( c == (123) ) {
              curr_node.get().is_block_node = true;
            }
            i = 1 + i;
            this.parse();
            continue;
          }
        }
        sp = i;
        ep = i;
        fc = s[i];
        if ( (((fc == 45) && ((s[(i + 1)]) >= 46)) && ((s[(i + 1)]) <= 57)) || ((fc >= 48) && (fc <= 57)) ) {
          boolean is_double = false;
          sp = i;
          i = 1 + i;
          c = s[i];
          while ((i < __len) && ((((c >= 48) && (c <= 57)) || (c == (46))) || ((i == sp) && ((c == (43)) || (c == (45)))))) {
            if ( c == (46) ) {
              is_double = true;
            }
            i = 1 + i;
            c = s[i];
          }
          ep = i;
          final CodeNode new_num_node = new CodeNode(code.get(), sp, ep);
          if ( is_double ) {
            new_num_node.parsed_type = 2;
            new_num_node.value_type = 2;
            new_num_node.double_value = (Optional.of(Double.parseDouble((new String(s,sp, ep - sp )) ))).get();
          } else {
            new_num_node.parsed_type = 3;
            new_num_node.value_type = 3;
            new_num_node.int_value = (Optional.of(Integer.parseInt((new String(s,sp, ep - sp )) ))).get();
          }
          this.insert_node(new_num_node);
          continue;
        }
        if ( fc == 34 ) {
          sp = i + 1;
          ep = sp;
          c = s[i];
          boolean must_encode = false;
          while (i < __len) {
            i = 1 + i;
            c = s[i];
            if ( c == 34 ) {
              break;
            }
            if ( c == 92 ) {
              i = 1 + i;
              if ( i < __len ) {
                must_encode = true;
                c = s[i];
              } else {
                break;
              }
            }
          }
          ep = i;
          if ( i < __len ) {
            String encoded_str = "";
            if ( must_encode ) {
              final byte[] orig_str = (new String(s,sp, ep - sp )).getBytes();
              final int str_length = orig_str.length;
              int ii = 0;
              while (ii < str_length) {
                final byte cc = orig_str[ii];
                if ( cc == 92 ) {
                  final byte next_ch = orig_str[(ii + 1)];
                  switch (next_ch ) { 
                    case 34 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(34))));
                      break;
                    case 92 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(92))));
                      break;
                    case 47 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(47))));
                      break;
                    case 98 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(8))));
                      break;
                    case 102 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(12))));
                      break;
                    case 110 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(10))));
                      break;
                    case 114 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(13))));
                      break;
                    case 116 : 
                      encoded_str = encoded_str + ((new String( Character.toChars(9))));
                      break;
                    case 117 : 
                      ii = ii + 4;
                      break;
                    default: 
                      break;
                  }
                  ii = ii + 2;
                } else {
                  encoded_str = encoded_str + (new String(orig_str,ii, (1 + ii) - ii ));
                  ii = ii + 1;
                }
              }
            }
            final CodeNode new_str_node = new CodeNode(code.get(), sp, ep);
            new_str_node.parsed_type = 4;
            new_str_node.value_type = 4;
            if ( must_encode ) {
              new_str_node.string_value = encoded_str;
            } else {
              new_str_node.string_value = new String(s,sp, ep - sp );
            }
            this.insert_node(new_str_node);
            i = 1 + i;
            continue;
          }
        }
        if ( (((fc == (116)) && ((s[(i + 1)]) == (114))) && ((s[(i + 2)]) == (117))) && ((s[(i + 3)]) == (101)) ) {
          final CodeNode new_true_node = new CodeNode(code.get(), sp, sp + 4);
          new_true_node.value_type = 5;
          new_true_node.parsed_type = 5;
          new_true_node.boolean_value = true;
          this.insert_node(new_true_node);
          i = i + 4;
          continue;
        }
        if ( ((((fc == (102)) && ((s[(i + 1)]) == (97))) && ((s[(i + 2)]) == (108))) && ((s[(i + 3)]) == (115))) && ((s[(i + 4)]) == (101)) ) {
          final CodeNode new_f_node = new CodeNode(code.get(), sp, sp + 5);
          new_f_node.value_type = 5;
          new_f_node.parsed_type = 5;
          new_f_node.boolean_value = false;
          this.insert_node(new_f_node);
          i = i + 5;
          continue;
        }
        if ( fc == (64) ) {
          i = i + 1;
          sp = i;
          ep = i;
          c = s[i];
          while (((((i < __len) && ((s[i]) > 32)) && (c != 40)) && (c != 41)) && (c != (125))) {
            i = 1 + i;
            c = s[i];
          }
          ep = i;
          if ( (i < __len) && (ep > sp) ) {
            final CodeNode a_node2 = new CodeNode(code.get(), sp, ep);
            final String a_name = new String(s,sp, ep - sp );
            a_node2.expression = true;
            curr_node = Optional.of(a_node2);
            parents.add(a_node2);
            i = i + 1;
            paren_cnt = paren_cnt + 1;
            this.parse();
            boolean use_first = false;
            if ( 1 == (a_node2.children.size()) ) {
              final CodeNode ch1 = a_node2.children.get(0);
              use_first = ch1.isPrimitive();
            }
            if ( use_first ) {
              final CodeNode theNode = a_node2.children.remove(0);
              curr_node.get().props.put(a_name, theNode);
            } else {
              curr_node.get().props.put(a_name, a_node2);
            }
            curr_node.get().prop_keys.add(a_name);
            continue;
          }
        }
        ArrayList<String> ns_list = new ArrayList<String>();
        int last_ns = i;
        int ns_cnt = 1;
        boolean vref_had_type_ann = false;
        Optional<CodeNode> vref_ann_node = Optional.empty();
        int vref_end = i;
        if ( (((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125)) ) {
          if ( curr_node.get().is_block_node == true ) {
            final CodeNode new_expr_node = new CodeNode(code.get(), sp, ep);
            new_expr_node.parent = curr_node;
            new_expr_node.expression = true;
            curr_node.get().children.add(new_expr_node);
            curr_node = Optional.of(new_expr_node);
            parents.add(new_expr_node);
            paren_cnt = 1 + paren_cnt;
            this.parse();
            continue;
          }
        }
        int op_c = 0;
        op_c = this.getOperator();
        boolean last_was_newline = false;
        if ( op_c > 0 ) {
        } else {
          while ((((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) {
            if ( i > sp ) {
              final int is_opchar = this.isOperator();
              if ( is_opchar > 0 ) {
                break;
              }
            }
            i = 1 + i;
            c = s[i];
            if ( (c == 10) || (c == 13) ) {
              last_was_newline = true;
              break;
            }
            if ( c == (46) ) {
              ns_list.add(new String(s,last_ns, i - last_ns ));
              last_ns = i + 1;
              ns_cnt = 1 + ns_cnt;
            }
            if ( (i > vref_end) && (c == (64)) ) {
              vref_had_type_ann = true;
              vref_end = i;
              vref_ann_node = Optional.of(this.parse_raw_annotation());
              c = s[i];
              break;
            }
          }
        }
        ep = i;
        if ( vref_had_type_ann ) {
          ep = vref_end;
        }
        ns_list.add(new String(s,last_ns, ep - last_ns ));
        c = s[i];
        while (((i < __len) && (c <= 32)) && (false == last_was_newline)) {
          i = 1 + i;
          c = s[i];
          if ( is_block_parent && ((c == 10) || (c == 13)) ) {
            i = i - 1;
            c = s[i];
            had_lf = true;
            break;
          }
        }
        if ( c == 58 ) {
          i = i + 1;
          while ((i < __len) && ((s[i]) <= 32)) {
            i = 1 + i;
          }
          int vt_sp = i;
          int vt_ep = i;
          c = s[i];
          if ( c == (40) ) {
            final CodeNode vann_arr2 = this.parse_raw_annotation();
            vann_arr2.expression = true;
            final CodeNode new_expr_node_1 = new CodeNode(code.get(), sp, vt_ep);
            new_expr_node_1.vref = new String(s,sp, ep - sp );
            new_expr_node_1.ns = ns_list;
            new_expr_node_1.expression_value = Optional.of(vann_arr2);
            new_expr_node_1.parsed_type = 15;
            new_expr_node_1.value_type = 15;
            if ( vref_had_type_ann ) {
              new_expr_node_1.vref_annotation = vref_ann_node;
              new_expr_node_1.has_vref_annotation = true;
            }
            curr_node.get().children.add(new_expr_node_1);
            continue;
          }
          if ( c == (91) ) {
            i = i + 1;
            vt_sp = i;
            int hash_sep = 0;
            boolean had_array_type_ann = false;
            c = s[i];
            while (((i < __len) && (c > 32)) && (c != 93)) {
              i = 1 + i;
              c = s[i];
              if ( c == (58) ) {
                hash_sep = i;
              }
              if ( c == (64) ) {
                had_array_type_ann = true;
                break;
              }
            }
            vt_ep = i;
            if ( hash_sep > 0 ) {
              vt_ep = i;
              final String type_name = new String(s,(1 + hash_sep), vt_ep - (1 + hash_sep) );
              final String key_type_name = new String(s,vt_sp, hash_sep - vt_sp );
              final CodeNode new_hash_node = new CodeNode(code.get(), sp, vt_ep);
              new_hash_node.vref = new String(s,sp, ep - sp );
              new_hash_node.ns = ns_list;
              new_hash_node.parsed_type = 7;
              new_hash_node.value_type = 7;
              new_hash_node.array_type = type_name;
              new_hash_node.key_type = key_type_name;
              if ( vref_had_type_ann ) {
                new_hash_node.vref_annotation = vref_ann_node;
                new_hash_node.has_vref_annotation = true;
              }
              if ( had_array_type_ann ) {
                final CodeNode vann_hash = this.parse_raw_annotation();
                new_hash_node.type_annotation = Optional.of(vann_hash);
                new_hash_node.has_type_annotation = true;
                System.out.println(String.valueOf( "--> parsed HASH TYPE annotation" ) );
              }
              new_hash_node.parent = curr_node;
              curr_node.get().children.add(new_hash_node);
              i = 1 + i;
              continue;
            } else {
              vt_ep = i;
              final String type_name_1 = new String(s,vt_sp, vt_ep - vt_sp );
              final CodeNode new_arr_node = new CodeNode(code.get(), sp, vt_ep);
              new_arr_node.vref = new String(s,sp, ep - sp );
              new_arr_node.ns = ns_list;
              new_arr_node.parsed_type = 6;
              new_arr_node.value_type = 6;
              new_arr_node.array_type = type_name_1;
              new_arr_node.parent = curr_node;
              curr_node.get().children.add(new_arr_node);
              if ( vref_had_type_ann ) {
                new_arr_node.vref_annotation = vref_ann_node;
                new_arr_node.has_vref_annotation = true;
              }
              if ( had_array_type_ann ) {
                final CodeNode vann_arr = this.parse_raw_annotation();
                new_arr_node.type_annotation = Optional.of(vann_arr);
                new_arr_node.has_type_annotation = true;
                System.out.println(String.valueOf( "--> parsed ARRAY TYPE annotation" ) );
              }
              i = 1 + i;
              continue;
            }
          }
          boolean had_type_ann = false;
          while (((((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) && (c != (44))) {
            i = 1 + i;
            c = s[i];
            if ( c == (64) ) {
              had_type_ann = true;
              break;
            }
          }
          if ( i < __len ) {
            vt_ep = i;
            /** unused:  final String type_name_2 = new String(s,vt_sp, vt_ep - vt_sp )   **/ ;
            final CodeNode new_ref_node = new CodeNode(code.get(), sp, ep);
            new_ref_node.vref = new String(s,sp, ep - sp );
            new_ref_node.ns = ns_list;
            new_ref_node.parsed_type = 9;
            new_ref_node.value_type = 9;
            new_ref_node.type_name = new String(s,vt_sp, vt_ep - vt_sp );
            new_ref_node.parent = curr_node;
            if ( vref_had_type_ann ) {
              new_ref_node.vref_annotation = vref_ann_node;
              new_ref_node.has_vref_annotation = true;
            }
            curr_node.get().children.add(new_ref_node);
            if ( had_type_ann ) {
              final CodeNode vann = this.parse_raw_annotation();
              new_ref_node.type_annotation = Optional.of(vann);
              new_ref_node.has_type_annotation = true;
            }
            continue;
          }
        } else {
          if ( (i < __len) && (ep > sp) ) {
            final CodeNode new_vref_node = new CodeNode(code.get(), sp, ep);
            new_vref_node.vref = new String(s,sp, ep - sp );
            new_vref_node.parsed_type = 9;
            new_vref_node.value_type = 9;
            new_vref_node.ns = ns_list;
            new_vref_node.parent = curr_node;
            final int op_pred = this.getOperatorPred(new_vref_node.vref);
            if ( new_vref_node.vref.equals(",") ) {
              curr_node.get().infix_operator = false;
              continue;
            }
            Optional<CodeNode> pTarget = curr_node;
            if ( curr_node.get().infix_operator ) {
              final Optional<CodeNode> iNode = curr_node.get().infix_node;
              if ( (op_pred > 0) || (iNode.get().to_the_right == false) ) {
                pTarget = iNode;
              } else {
                final Optional<CodeNode> rn = iNode.get().right_node;
                new_vref_node.parent = rn;
                pTarget = rn;
              }
            }
            pTarget.get().children.add(new_vref_node);
            if ( vref_had_type_ann ) {
              new_vref_node.vref_annotation = vref_ann_node;
              new_vref_node.has_vref_annotation = true;
            }
            if ( (i + 1) < __len ) {
              if ( ((s[(i + 1)]) == (40)) || ((s[(i + 0)]) == (40)) ) {
                if ( ((0 == op_pred) && curr_node.get().infix_operator) && (1 == (curr_node.get().children.size())) ) {
                }
              }
            }
            if ( ((op_pred > 0) && curr_node.get().infix_operator) || ((op_pred > 0) && ((curr_node.get().children.size()) >= 2)) ) {
              if ( (op_pred == 3) && (2 == (curr_node.get().children.size())) ) {
                final CodeNode n_ch = curr_node.get().children.remove(0);
                curr_node.get().children.add(n_ch);
              } else {
                if ( false == curr_node.get().infix_operator ) {
                  final CodeNode if_node = new CodeNode(code.get(), sp, ep);
                  curr_node.get().infix_node = Optional.of(if_node);
                  curr_node.get().infix_operator = true;
                  if_node.infix_subnode = true;
                  curr_node.get().value_type = 0;
                  curr_node.get().expression = true;
                  if_node.expression = true;
                  int ch_cnt = curr_node.get().children.size();
                  int ii_1 = 0;
                  final int start_from = ch_cnt - 2;
                  final CodeNode keep_nodes = new CodeNode(code.get(), sp, ep);
                  while (ch_cnt > 0) {
                    final CodeNode n_ch_1 = curr_node.get().children.remove(0);
                    CodeNode p_target = if_node;
                    if ( (ii_1 < start_from) || n_ch_1.infix_subnode ) {
                      p_target = keep_nodes;
                    }
                    p_target.children.add(n_ch_1);
                    ch_cnt = ch_cnt - 1;
                    ii_1 = 1 + ii_1;
                  }
                  for ( int i_1 = 0; i_1 < keep_nodes.children.size(); i_1++) {
                    CodeNode keep = keep_nodes.children.get(i_1);
                    curr_node.get().children.add(keep);
                  }
                  curr_node.get().children.add(if_node);
                }
                final Optional<CodeNode> ifNode = curr_node.get().infix_node;
                final CodeNode new_op_node = new CodeNode(code.get(), sp, ep);
                new_op_node.expression = true;
                new_op_node.parent = ifNode;
                int until_index = (ifNode.get().children.size()) - 1;
                boolean to_right = false;
                final boolean just_continue = false;
                if ( (ifNode.get().operator_pred > 0) && (ifNode.get().operator_pred < op_pred) ) {
                  to_right = true;
                }
                if ( (ifNode.get().operator_pred > 0) && (ifNode.get().operator_pred > op_pred) ) {
                  ifNode.get().to_the_right = false;
                }
                if ( (ifNode.get().operator_pred > 0) && (ifNode.get().operator_pred == op_pred) ) {
                  to_right = ifNode.get().to_the_right;
                }
                /** unused:  final Optional<CodeNode> opTarget = ifNode   **/ ;
                if ( to_right ) {
                  final CodeNode op_node = ifNode.get().children.remove(until_index);
                  final CodeNode last_value = ifNode.get().children.remove((until_index - 1));
                  new_op_node.children.add(op_node);
                  new_op_node.children.add(last_value);
                } else {
                  if ( false == just_continue ) {
                    while (until_index > 0) {
                      final CodeNode what_to_add = ifNode.get().children.remove(0);
                      new_op_node.children.add(what_to_add);
                      until_index = until_index - 1;
                    }
                  }
                }
                if ( to_right || (false == just_continue) ) {
                  ifNode.get().children.add(new_op_node);
                }
                if ( to_right ) {
                  ifNode.get().right_node = Optional.of(new_op_node);
                  ifNode.get().to_the_right = true;
                }
                ifNode.get().operator_pred = op_pred;
                continue;
              }
            }
            continue;
          }
        }
        if ( (c == 41) || (c == (125)) ) {
          if ( ((c == (125)) && is_block_parent) && ((curr_node.get().children.size()) > 0) ) {
            this.end_expression();
          }
          i = 1 + i;
          paren_cnt = paren_cnt - 1;
          if ( paren_cnt < 0 ) {
            break;
          }
          parents.remove(parents.size() - 1);
          if ( curr_node.isPresent() ) {
            curr_node.get().ep = i;
          }
          if ( (parents.size()) > 0 ) {
            curr_node = Optional.of(parents.get(((parents.size()) - 1)));
          } else {
            curr_node = rootNode;
          }
          break;
        }
        if ( last_i == i ) {
          i = 1 + i;
        }
      }
    }
  }
}
