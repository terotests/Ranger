<? 

class RangerAppTodo { 
  var $description;
  var $todonode;
  
  function __construct( ) {
    $this->description = "";
    $this->todonode;
  }
}
class RangerCompilerMessage { 
  var $error_level;
  var $code_line;
  var $fileName;
  var $description;
  var $node;
  
  function __construct( ) {
    $this->error_level = 0;     /** note: unused */
    $this->code_line = 0;     /** note: unused */
    $this->fileName = "";     /** note: unused */
    $this->description = "";
    $this->node;
  }
}
class RangerParamEventHandler { 
  
  function __construct( ) {
  }
  
  function callback( $param ) {
  }
}
class RangerParamEventList { 
  var $list;
  
  function __construct( ) {
    $this->list = array();
  }
}
class RangerParamEventMap { 
  var $events;
  
  function __construct( ) {
    $this->events = array();
  }
  
  function clearAllEvents() {
  }
  
  function addEvent( $name , $e ) {
    if ( (array_key_exists($name , $this->events )) == false ) {
      $this->events[$name] =  new RangerParamEventList();
    }
    $list = ($this->events[$name]);
    array_push($list->list, $e);
  }
  
  function fireEvent( $name , $from ) {
    if ( array_key_exists($name , $this->events ) ) {
      $list = ($this->events[$name]);
      for ( $i = 0; $i < count($list->list); $i++) {
        $ev = $list->list[$i];
        $ev->callback($from);
      }
    }
  }
}
class RangerAppArrayValue { 
  var $value_type;
  var $value_type_name;
  var $values;
  
  function __construct( ) {
    $this->value_type = 0;     /** note: unused */
    $this->value_type_name = "";     /** note: unused */
    $this->values = array();     /** note: unused */
  }
}
class RangerAppHashValue { 
  var $value_type;
  var $key_type_name;
  var $value_type_name;
  var $s_values;
  var $i_values;
  var $b_values;
  var $d_values;
  
  function __construct( ) {
    $this->value_type = 0;     /** note: unused */
    $this->key_type_name = "";     /** note: unused */
    $this->value_type_name = "";     /** note: unused */
    $this->s_values = array();     /** note: unused */
    $this->i_values = array();     /** note: unused */
    $this->b_values = array();     /** note: unused */
    $this->d_values = array();     /** note: unused */
  }
}
class RangerAppValue { 
  var $double_value;
  var $string_value;
  var $int_value;
  var $boolean_value;
  var $arr;
  var $hash;
  
  function __construct( ) {
    $this->double_value = 0;     /** note: unused */
    $this->string_value = "";     /** note: unused */
    $this->int_value = 0;     /** note: unused */
    $this->boolean_value = false;     /** note: unused */
    $this->arr;     /** note: unused */
    $this->hash;     /** note: unused */
  }
}
class RangerRefForce { 
  var $strength;
  var $lifetime;
  var $changer;
  
  function __construct( ) {
    $this->strength = 0;
    $this->lifetime = 1;
    $this->changer;
  }
}
class RangerAppParamDesc { 
  var $name;
  var $value;
  var $compiledName;
  var $debugString;
  var $ref_cnt;
  var $init_cnt;
  var $set_cnt;
  var $return_cnt;
  var $prop_assign_cnt;
  var $value_type;
  var $has_default;
  var $def_value;
  var $default_value;
  var $isThis;
  var $classDesc;
  var $fnDesc;
  var $ownerHistory;
  var $varType;
  var $refType;
  var $initRefType;
  var $isParam;
  var $paramIndex;
  var $is_optional;
  var $is_mutating;
  var $is_set;
  var $is_class_variable;
  var $is_captured;
  var $node;
  var $nameNode;
  var $description;
  var $git_doc;
  var $has_events;
  var $eMap;
  
  function __construct( ) {
    $this->name = "";
    $this->value;     /** note: unused */
    $this->compiledName = "";
    $this->debugString = "";
    $this->ref_cnt = 0;
    $this->init_cnt = 0;
    $this->set_cnt = 0;
    $this->return_cnt = 0;
    $this->prop_assign_cnt = 0;     /** note: unused */
    $this->value_type = 0;
    $this->has_default = false;     /** note: unused */
    $this->def_value;
    $this->default_value;     /** note: unused */
    $this->isThis = false;     /** note: unused */
    $this->classDesc;     /** note: unused */
    $this->fnDesc;     /** note: unused */
    $this->ownerHistory = array();
    $this->varType = 0;
    $this->refType = 0;
    $this->initRefType = 0;
    $this->isParam;     /** note: unused */
    $this->paramIndex = 0;     /** note: unused */
    $this->is_optional = false;
    $this->is_mutating = false;     /** note: unused */
    $this->is_set = false;     /** note: unused */
    $this->is_class_variable = false;
    $this->is_captured = false;
    $this->node;
    $this->nameNode;
    $this->description = "";     /** note: unused */
    $this->git_doc = "";     /** note: unused */
    $this->has_events = false;
    $this->eMap;
  }
  
  function addEvent( $name , $e ) {
    if ( $this->has_events == false ) {
      $this->eMap =  new RangerParamEventMap();
      $this->has_events = true;
    }
    $this->eMap->addEvent($this->name, $e);
  }
  
  function changeStrength( $newStrength , $lifeTime , $changer ) {
    $entry =  new RangerRefForce();
    $entry->strength = $newStrength;
    $entry->lifetime = $lifeTime;
    $entry->changer = $changer;
    array_push($this->ownerHistory, $entry);
  }
  
  function isProperty() {
    return true;
  }
  
  function isClass() {
    return false;
  }
  
  function doesInherit() {
    return false;
  }
  
  function isAllocatedType() {
    if ( (isset($this->nameNode)) ) {
      if ( $this->nameNode->eval_type != 0 ) {
        if ( $this->nameNode->eval_type == 6 ) {
          return true;
        }
        if ( $this->nameNode->eval_type == 7 ) {
          return true;
        }
        if ( ((((($this->nameNode->eval_type == 13) || ($this->nameNode->eval_type == 12)) || ($this->nameNode->eval_type == 4)) || ($this->nameNode->eval_type == 2)) || ($this->nameNode->eval_type == 5)) || ($this->nameNode->eval_type == 3) ) {
          return false;
        }
        if ( $this->nameNode->eval_type == 11 ) {
          return false;
        }
        return true;
      }
      if ( $this->nameNode->eval_type == 11 ) {
        return false;
      }
      if ( $this->nameNode->value_type == 9 ) {
        if ( false == $this->nameNode->isPrimitive() ) {
          return true;
        }
      }
      if ( $this->nameNode->value_type == 6 ) {
        return true;
      }
      if ( $this->nameNode->value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  
  function moveRefTo( $node , $target , $ctx ) {
    if ( $this->node->ref_change_done ) {
      return;
    }
    if ( false == $target->isAllocatedType() ) {
      return;
    }
    if ( false == $this->isAllocatedType() ) {
      return;
    }
    $this->node->ref_change_done = true;
    $other_s = $target->getStrength();
    $my_s = $this->getStrength();
    $my_lifetime = $this->getLifetime();
    $other_lifetime = $target->getLifetime();
    $a_lives = false;
    $b_lives = false;
    $tmp_var = $this->nameNode->hasFlag("temp");
    if ( (isset($target->nameNode)) ) {
      if ( $target->nameNode->hasFlag("lives") ) {
        $my_lifetime = 2;
        $b_lives = true;
      }
    }
    if ( (isset($this->nameNode)) ) {
      if ( $this->nameNode->hasFlag("lives") ) {
        $my_lifetime = 2;
        $a_lives = true;
      }
    }
    if ( $other_s > 0 ) {
      if ( $my_s == 1 ) {
        $lt = $my_lifetime;
        if ( $other_lifetime > $my_lifetime ) {
          $lt = $other_lifetime;
        }
        $this->changeStrength(0, $lt, $this->node);
      } else {
        if ( $my_s == 0 ) {
          if ( $tmp_var == false ) {
            $ctx->addError($this->node, "Can not move a weak reference to a strong target, at " . $this->node->getCode());
            echo( "can not move weak refs to strong target:" . "\n");
            $this->debugRefChanges();
          }
        } else {
          $ctx->addError($this->node, "Can not move immutable reference to a strong target, evald type " . $this->nameNode->eval_type_name);
        }
      }
    } else {
      if ( $a_lives || $b_lives ) {
      } else {
        if ( ($my_lifetime < $other_lifetime) && ($this->return_cnt == 0) ) {
          if ( $this->nameNode->hasFlag("returnvalue") == false ) {
            $ctx->addError($this->node, "Can not create a weak reference if target has longer lifetime than original, current lifetime == " . $my_lifetime);
          }
        }
      }
    }
  }
  
  function originalStrength() {
    $__len = count($this->ownerHistory);
    if ( $__len > 0 ) {
      $firstEntry = $this->ownerHistory[0];
      return $firstEntry->strength;
    }
    return 1;
  }
  
  function getLifetime() {
    $__len = count($this->ownerHistory);
    if ( $__len > 0 ) {
      $lastEntry = $this->ownerHistory[($__len - 1)];
      return $lastEntry->lifetime;
    }
    return 1;
  }
  
  function getStrength() {
    $__len = count($this->ownerHistory);
    if ( $__len > 0 ) {
      $lastEntry = $this->ownerHistory[($__len - 1)];
      return $lastEntry->strength;
    }
    return 1;
  }
  
  function debugRefChanges() {
    echo( ("variable " . $this->name) . " ref history : " . "\n");
    for ( $i = 0; $i < count($this->ownerHistory); $i++) {
      $h = $this->ownerHistory[$i];
      echo( ((" => change to " . $h->strength) . " by ") . $h->changer->getCode() . "\n");
    }
  }
  
  function pointsToObject( $ctx ) {
    if ( (isset($this->nameNode)) ) {
      $is_primitive = false;
      switch ($this->nameNode->array_type ) { 
        case "string" : 
          $is_primitive = true;
          break;
        case "int" : 
          $is_primitive = true;
          break;
        case "boolean" : 
          $is_primitive = true;
          break;
        case "double" : 
          $is_primitive = true;
          break;
      }
      if ( $is_primitive ) {
        return false;
      }
      if ( ($this->nameNode->value_type == 6) || ($this->nameNode->value_type == 7) ) {
        $is_object = true;
        switch ($this->nameNode->array_type ) { 
          case "string" : 
            $is_object = false;
            break;
          case "int" : 
            $is_object = false;
            break;
          case "boolean" : 
            $is_object = false;
            break;
          case "double" : 
            $is_object = false;
            break;
        }
        return $is_object;
      }
      if ( $this->nameNode->value_type == 9 ) {
        $is_object_1 = true;
        switch ($this->nameNode->type_name ) { 
          case "string" : 
            $is_object_1 = false;
            break;
          case "int" : 
            $is_object_1 = false;
            break;
          case "boolean" : 
            $is_object_1 = false;
            break;
          case "double" : 
            $is_object_1 = false;
            break;
        }
        if ( $ctx->isEnumDefined($this->nameNode->type_name) ) {
          return false;
        }
        return $is_object_1;
      }
    }
    return false;
  }
  
  function isObject() {
    if ( (isset($this->nameNode)) ) {
      if ( $this->nameNode->value_type == 9 ) {
        if ( false == $this->nameNode->isPrimitive() ) {
          return true;
        }
      }
    }
    return false;
  }
  
  function isArray() {
    if ( (isset($this->nameNode)) ) {
      if ( $this->nameNode->value_type == 6 ) {
        return true;
      }
    }
    return false;
  }
  
  function isHash() {
    if ( (isset($this->nameNode)) ) {
      if ( $this->nameNode->value_type == 7 ) {
        return true;
      }
    }
    return false;
  }
  
  function isPrimitive() {
    if ( (isset($this->nameNode)) ) {
      return $this->nameNode->isPrimitive();
    }
    return false;
  }
  
  function getRefTypeName() {
    switch ($this->refType ) { 
      case 0 : 
        return "NoType";
        break;
      case 1 : 
        return "Weak";
        break;
    }
    return "";
  }
  
  function getVarTypeName() {
    switch ($this->refType ) { 
      case 0 : 
        return "NoType";
        break;
      case 1 : 
        return "This";
        break;
    }
    return "";
  }
  
  function getTypeName() {
    $s = $this->nameNode->type_name;
    return $s;
  }
}
class RangerAppFunctionDesc extends RangerAppParamDesc { 
  var $name;
  var $ref_cnt;
  var $node;
  var $nameNode;
  var $fnBody;
  var $params;
  var $return_value;
  var $is_method;
  var $is_static;
  var $container_class;
  var $refType;
  var $fnCtx;
  
  function __construct( ) {
    parent::__construct();
    $this->name = "";
    $this->ref_cnt = 0;
    $this->node;
    $this->nameNode;
    $this->fnBody;
    $this->params = array();
    $this->return_value;     /** note: unused */
    $this->is_method = false;     /** note: unused */
    $this->is_static = false;
    $this->container_class;     /** note: unused */
    $this->refType = 0;
    $this->fnCtx;
  }
  
  function isClass() {
    return false;
  }
  
  function isProperty() {
    return false;
  }
}
class RangerAppMethodVariants { 
  var $name;
  var $variants;
  
  function __construct( ) {
    $this->name = "";     /** note: unused */
    $this->variants = array();
  }
}
class RangerAppInterfaceImpl { 
  var $name;
  var $typeParams;
  
  function __construct( ) {
    $this->name = "";     /** note: unused */
    $this->typeParams;     /** note: unused */
  }
}
class RangerAppClassDesc extends RangerAppParamDesc { 
  var $name;
  var $is_system;
  var $compiledName;
  var $systemNames;
  var $systemInfo;
  var $is_interface;
  var $is_system_union;
  var $is_template;
  var $is_serialized;
  var $is_trait;
  var $generic_params;
  var $ctx;
  var $variables;
  var $capturedLocals;
  var $methods;
  var $defined_methods;
  var $static_methods;
  var $defined_static_methods;
  var $defined_variants;
  var $method_variants;
  var $has_constructor;
  var $constructor_node;
  var $constructor_fn;
  var $has_destructor;
  var $destructor_node;
  var $destructor_fn;
  var $extends_classes;
  var $implements_interfaces;
  var $consumes_traits;
  var $is_union_of;
  var $nameNode;
  var $classNode;
  var $contr_writers;
  var $is_inherited;
  
  function __construct( ) {
    parent::__construct();
    $this->name = "";
    $this->is_system = false;
    $this->compiledName = "";     /** note: unused */
    $this->systemNames = array();
    $this->systemInfo;     /** note: unused */
    $this->is_interface = false;
    $this->is_system_union = false;
    $this->is_template = false;     /** note: unused */
    $this->is_serialized = false;
    $this->is_trait = false;
    $this->generic_params;     /** note: unused */
    $this->ctx;
    $this->variables = array();
    $this->capturedLocals = array();
    $this->methods = array();
    $this->defined_methods = array();
    $this->static_methods = array();
    $this->defined_static_methods = array();
    $this->defined_variants = array();
    $this->method_variants = array();
    $this->has_constructor = false;
    $this->constructor_node;
    $this->constructor_fn;
    $this->has_destructor = false;     /** note: unused */
    $this->destructor_node;     /** note: unused */
    $this->destructor_fn;     /** note: unused */
    $this->extends_classes = array();
    $this->implements_interfaces = array();
    $this->consumes_traits = array();
    $this->is_union_of = array();
    $this->nameNode;
    $this->classNode;
    $this->contr_writers = array();     /** note: unused */
    $this->is_inherited = false;
  }
  
  function isClass() {
    return true;
  }
  
  function isProperty() {
    return false;
  }
  
  function doesInherit() {
    return $this->is_inherited;
  }
  
  function isSameOrParentClass( $class_name , $ctx ) {
    if ( $this->ctx->isPrimitiveType($class_name) ) {
      if ( (array_search($class_name, $this->is_union_of, true)) >= 0 ) {
        return true;
      }
      return false;
    }
    if ( $class_name == $this->name ) {
      return true;
    }
    if ( (array_search($class_name, $this->extends_classes, true)) >= 0 ) {
      return true;
    }
    if ( (array_search($class_name, $this->consumes_traits, true)) >= 0 ) {
      return true;
    }
    if ( (array_search($class_name, $this->implements_interfaces, true)) >= 0 ) {
      return true;
    }
    if ( (array_search($class_name, $this->is_union_of, true)) >= 0 ) {
      return true;
    }
    for ( $i = 0; $i < count($this->extends_classes); $i++) {
      $c_name = $this->extends_classes[$i];
      $c = $this->ctx->findClass($c_name);
      if ( $c->isSameOrParentClass($class_name, $this->ctx) ) {
        return true;
      }
    }
    for ( $i_1 = 0; $i_1 < count($this->consumes_traits); $i_1++) {
      $c_name_1 = $this->consumes_traits[$i_1];
      $c_1 = $this->ctx->findClass($c_name_1);
      if ( $c_1->isSameOrParentClass($class_name, $this->ctx) ) {
        return true;
      }
    }
    for ( $i_2 = 0; $i_2 < count($this->implements_interfaces); $i_2++) {
      $i_name = $this->implements_interfaces[$i_2];
      $c_2 = $this->ctx->findClass($i_name);
      if ( $c_2->isSameOrParentClass($class_name, $this->ctx) ) {
        return true;
      }
    }
    for ( $i_3 = 0; $i_3 < count($this->is_union_of); $i_3++) {
      $i_name_1 = $this->is_union_of[$i_3];
      if ( $this->isSameOrParentClass($i_name_1, $this->ctx) ) {
        return true;
      }
      if ( $this->ctx->isDefinedClass($i_name_1) ) {
        $c_3 = $this->ctx->findClass($i_name_1);
        if ( $c_3->isSameOrParentClass($class_name, $this->ctx) ) {
          return true;
        }
      } else {
        echo( "did not find union class " . $i_name_1 . "\n");
      }
    }
    return false;
  }
  
  function hasOwnMethod( $m_name ) {
    if ( array_key_exists($m_name , $this->defined_methods ) ) {
      return true;
    }
    return false;
  }
  
  function hasMethod( $m_name ) {
    if ( array_key_exists($m_name , $this->defined_methods ) ) {
      return true;
    }
    for ( $i = 0; $i < count($this->extends_classes); $i++) {
      $cname = $this->extends_classes[$i];
      $cDesc = $this->ctx->findClass($cname);
      if ( $cDesc->hasMethod($m_name) ) {
        return $cDesc->hasMethod($m_name);
      }
    }
    return false;
  }
  
  function findMethod( $f_name ) {
    $res;
    for ( $i = 0; $i < count($this->methods); $i++) {
      $m = $this->methods[$i];
      if ( $m->name == $f_name ) {
        $res = $m;
        return $res;
      }
    }
    for ( $i_1 = 0; $i_1 < count($this->extends_classes); $i_1++) {
      $cname = $this->extends_classes[$i_1];
      $cDesc = $this->ctx->findClass($cname);
      if ( $cDesc->hasMethod($f_name) ) {
        return $cDesc->findMethod($f_name);
      }
    }
    return $res;
  }
  
  function hasStaticMethod( $m_name ) {
    return array_key_exists($m_name , $this->defined_static_methods );
  }
  
  function findStaticMethod( $f_name ) {
    $e;
    for ( $i = 0; $i < count($this->static_methods); $i++) {
      $m = $this->static_methods[$i];
      if ( $m->name == $f_name ) {
        $e = $m;
        return $e;
      }
    }
    for ( $i_1 = 0; $i_1 < count($this->extends_classes); $i_1++) {
      $cname = $this->extends_classes[$i_1];
      $cDesc = $this->ctx->findClass($cname);
      if ( $cDesc->hasStaticMethod($f_name) ) {
        return $cDesc->findStaticMethod($f_name);
      }
    }
    return $e;
  }
  
  function findVariable( $f_name ) {
    $e;
    for ( $i = 0; $i < count($this->variables); $i++) {
      $m = $this->variables[$i];
      if ( $m->name == $f_name ) {
        $e = $m;
        return $e;
      }
    }
    for ( $i_1 = 0; $i_1 < count($this->extends_classes); $i_1++) {
      $cname = $this->extends_classes[$i_1];
      $cDesc = $this->ctx->findClass($cname);
      return $cDesc->findVariable($f_name);
    }
    return $e;
  }
  
  function addParentClass( $p_name ) {
    array_push($this->extends_classes, $p_name);
  }
  
  function addVariable( $desc ) {
    array_push($this->variables, $desc);
  }
  
  function addMethod( $desc ) {
    $this->defined_methods[$desc->name] = true;
    array_push($this->methods, $desc);
    $defVs = $this->method_variants[$desc->name];
    if ( (!isset($defVs)) ) {
      $new_v =  new RangerAppMethodVariants();
      $this->method_variants[$desc->name] = $new_v;
      array_push($this->defined_variants, $desc->name);
      array_push($new_v->variants, $desc);
    } else {
      $new_v2 = $defVs;
      array_push($new_v2->variants, $desc);
    }
  }
  
  function addStaticMethod( $desc ) {
    $this->defined_static_methods[$desc->name] = true;
    array_push($this->static_methods, $desc);
  }
}
class RangerTypeClass { 
  var $name;
  var $compiledName;
  var $value_type;
  var $type_name;
  var $key_type;
  var $array_type;
  var $is_primitive;
  var $is_mutable;
  var $is_optional;
  var $is_generic;
  var $is_lambda;
  var $nameNode;
  var $templateParams;
  
  function __construct( ) {
    $this->name = "";     /** note: unused */
    $this->compiledName = "";     /** note: unused */
    $this->value_type = 0;     /** note: unused */
    $this->type_name;     /** note: unused */
    $this->key_type;     /** note: unused */
    $this->array_type;     /** note: unused */
    $this->is_primitive = false;     /** note: unused */
    $this->is_mutable = false;     /** note: unused */
    $this->is_optional = false;     /** note: unused */
    $this->is_generic = false;     /** note: unused */
    $this->is_lambda = false;     /** note: unused */
    $this->nameNode;     /** note: unused */
    $this->templateParams;     /** note: unused */
  }
}
class SourceCode { 
  var $code;
  var $lines;
  var $filename;
  
  function __construct( $code_str  ) {
    $this->code = "";
    $this->lines = array();
    $this->filename = "";
    $this->code = $code_str;
    $this->lines = explode("\n", $code_str);
  }
  
  function getLineString( $line_index ) {
    if ( (count($this->lines)) > $line_index ) {
      return $this->lines[$line_index];
    }
    return "";
  }
  
  function getLine( $sp ) {
    $cnt = 0;
    for ( $i = 0; $i < count($this->lines); $i++) {
      $str = $this->lines[$i];
      $cnt = $cnt + ((strlen($str)) + 1);
      if ( $cnt > $sp ) {
        return $i;
      }
    }
    return -1;
  }
  
  function getColumnStr( $sp ) {
    $cnt = 0;
    $last = 0;
    for ( $i = 0; $i < count($this->lines); $i++) {
      $str = $this->lines[$i];
      $cnt = $cnt + ((strlen($str)) + 1);
      if ( $cnt > $sp ) {
        $ll = $sp - $last;
        $ss = "";
        while ($ll > 0) {
          $ss = $ss . " ";
          $ll = $ll - 1;
        }
        return $ss;
      }
      $last = $cnt;
    }
    return "";
  }
  
  function getColumn( $sp ) {
    $cnt = 0;
    $last = 0;
    for ( $i = 0; $i < count($this->lines); $i++) {
      $str = $this->lines[$i];
      $cnt = $cnt + ((strlen($str)) + 1);
      if ( $cnt > $sp ) {
        return $sp - $last;
      }
      $last = $cnt;
    }
    return -1;
  }
}
class CodeNode { 
  var $code;
  var $sp;
  var $ep;
  var $has_operator;
  var $disabled_node;
  var $op_index;
  var $is_system_class;
  var $mutable_def;
  var $expression;
  var $vref;
  var $is_block_node;
  var $infix_operator;
  var $infix_node;
  var $infix_subnode;
  var $has_lambda;
  var $has_lambda_call;
  var $operator_pred;
  var $to_the_right;
  var $right_node;
  var $type_type;
  var $type_name;
  var $key_type;
  var $array_type;
  var $ns;
  var $has_vref_annotation;
  var $vref_annotation;
  var $has_type_annotation;
  var $type_annotation;
  var $parsed_type;
  var $value_type;
  var $ref_type;
  var $ref_need_assign;
  var $double_value;
  var $string_value;
  var $int_value;
  var $boolean_value;
  var $expression_value;
  var $props;
  var $prop_keys;
  var $comments;
  var $children;
  var $parent;
  var $typeClass;
  var $lambda_ctx;
  var $nsp;
  var $eval_type;
  var $eval_type_name;
  var $eval_key_type;
  var $eval_array_type;
  var $eval_function;
  var $flow_done;
  var $ref_change_done;
  var $eval_type_node;
  var $didReturnAtIndex;
  var $hasVarDef;
  var $hasClassDescription;
  var $hasNewOper;
  var $clDesc;
  var $hasFnCall;
  var $fnDesc;
  var $hasParamDesc;
  var $paramDesc;
  var $ownParamDesc;
  var $evalCtx;
  var $evalState;
  
  function __construct( $source , $start , $end  ) {
    $this->code;
    $this->sp = 0;
    $this->ep = 0;
    $this->has_operator = false;
    $this->disabled_node = false;
    $this->op_index = 0;
    $this->is_system_class = false;
    $this->mutable_def = false;
    $this->expression = false;
    $this->vref = "";
    $this->is_block_node = false;
    $this->infix_operator = false;
    $this->infix_node;
    $this->infix_subnode = false;
    $this->has_lambda = false;
    $this->has_lambda_call = false;
    $this->operator_pred = 0;
    $this->to_the_right = false;
    $this->right_node;
    $this->type_type = "";
    $this->type_name = "";
    $this->key_type = "";
    $this->array_type = "";
    $this->ns = array();
    $this->has_vref_annotation = false;
    $this->vref_annotation;
    $this->has_type_annotation = false;
    $this->type_annotation;
    $this->parsed_type = 0;
    $this->value_type = 0;
    $this->ref_type = 0;
    $this->ref_need_assign = 0;     /** note: unused */
    $this->double_value = 0;
    $this->string_value = "";
    $this->int_value = 0;
    $this->boolean_value = false;
    $this->expression_value;
    $this->props = array();
    $this->prop_keys = array();
    $this->comments = array();
    $this->children = array();
    $this->parent;
    $this->typeClass;
    $this->lambda_ctx;
    $this->nsp = array();
    $this->eval_type = 0;
    $this->eval_type_name = "";
    $this->eval_key_type = "";
    $this->eval_array_type = "";
    $this->eval_function;
    $this->flow_done = false;
    $this->ref_change_done = false;
    $this->eval_type_node;     /** note: unused */
    $this->didReturnAtIndex = -1;
    $this->hasVarDef = false;
    $this->hasClassDescription = false;
    $this->hasNewOper = false;
    $this->clDesc;
    $this->hasFnCall = false;
    $this->fnDesc;
    $this->hasParamDesc = false;
    $this->paramDesc;
    $this->ownParamDesc;
    $this->evalCtx;
    $this->evalState;     /** note: unused */
    $this->sp = $start;
    $this->ep = $end;
    $this->code = $source;
  }
  
  function getParsedString() {
    return substr($this->code->code, $this->sp, $this->ep - $this->sp);
  }
  
  function getFilename() {
    return $this->code->filename;
  }
  
  function getFlag( $flagName ) {
    $res;
    if ( false == $this->has_vref_annotation ) {
      return $res;
    }
    for ( $i = 0; $i < count($this->vref_annotation->children); $i++) {
      $ch = $this->vref_annotation->children[$i];
      if ( $ch->vref == $flagName ) {
        $res = $ch;
        return $res;
      }
    }
    return $res;
  }
  
  function hasFlag( $flagName ) {
    if ( false == $this->has_vref_annotation ) {
      return false;
    }
    for ( $i = 0; $i < count($this->vref_annotation->children); $i++) {
      $ch = $this->vref_annotation->children[$i];
      if ( $ch->vref == $flagName ) {
        return true;
      }
    }
    return false;
  }
  
  function setFlag( $flagName ) {
    if ( false == $this->has_vref_annotation ) {
      $this->vref_annotation =  new CodeNode($this->code, $this->sp, $this->ep);
    }
    if ( $this->hasFlag($flagName) ) {
      return;
    }
    $flag =  new CodeNode($this->code, $this->sp, $this->ep);
    $flag->vref = $flagName;
    $flag->value_type = 9;
    array_push($this->vref_annotation->children, $flag);
    $this->has_vref_annotation = true;
  }
  
  function getTypeInformationString() {
    $s = "";
    if ( (strlen($this->vref)) > 0 ) {
      $s = (($s . "<vref:") . $this->vref) . ">";
    } else {
      $s = $s . "<no.vref>";
    }
    if ( (strlen($this->type_name)) > 0 ) {
      $s = (($s . "<type_name:") . $this->type_name) . ">";
    } else {
      $s = $s . "<no.type_name>";
    }
    if ( (strlen($this->array_type)) > 0 ) {
      $s = (($s . "<array_type:") . $this->array_type) . ">";
    } else {
      $s = $s . "<no.array_type>";
    }
    if ( (strlen($this->key_type)) > 0 ) {
      $s = (($s . "<key_type:") . $this->key_type) . ">";
    } else {
      $s = $s . "<no.key_type>";
    }
    switch ($this->value_type ) { 
      case 5 : 
        $s = $s . "<value_type=Boolean>";
        break;
      case 4 : 
        $s = $s . "<value_type=String>";
        break;
    }
    return $s;
  }
  
  function getLine() {
    return $this->code->getLine($this->sp);
  }
  
  function getLineString( $line_index ) {
    return $this->code->getLineString($line_index);
  }
  
  function getColStartString() {
    return $this->code->getColumnStr($this->sp);
  }
  
  function getLineAsString() {
    $idx = $this->getLine();
    $line_name_idx = $idx + 1;
    return ((($this->getFilename() . ", line ") . $line_name_idx) . " : ") . $this->code->getLineString($idx);
  }
  
  function getPositionalString() {
    if ( ($this->ep > $this->sp) && (($this->ep - $this->sp) < 50) ) {
      $start = $this->sp;
      $end = $this->ep;
      $start = $start - 100;
      $end = $end + 50;
      if ( $start < 0 ) {
        $start = 0;
      }
      if ( $end >= (strlen($this->code->code)) ) {
        $end = (strlen($this->code->code)) - 1;
      }
      return substr($this->code->code, $start, $end - $start);
    }
    return "";
  }
  
  function isParsedAsPrimitive() {
    if ( ((((($this->parsed_type == 2) || ($this->parsed_type == 4)) || ($this->parsed_type == 3)) || ($this->parsed_type == 12)) || ($this->parsed_type == 13)) || ($this->parsed_type == 5) ) {
      return true;
    }
    return false;
  }
  
  function isPrimitive() {
    if ( ((((($this->value_type == 2) || ($this->value_type == 4)) || ($this->value_type == 3)) || ($this->value_type == 12)) || ($this->value_type == 13)) || ($this->value_type == 5) ) {
      return true;
    }
    return false;
  }
  
  function isPrimitiveType() {
    $tn = $this->type_name;
    if ( ((((($tn == "double") || ($tn == "string")) || ($tn == "int")) || ($tn == "char")) || ($tn == "charbuffer")) || ($tn == "boolean") ) {
      return true;
    }
    return false;
  }
  
  function isAPrimitiveType() {
    $tn = $this->type_name;
    if ( ($this->value_type == 6) || ($this->value_type == 7) ) {
      $tn = $this->array_type;
    }
    if ( ((((($tn == "double") || ($tn == "string")) || ($tn == "int")) || ($tn == "char")) || ($tn == "charbuffer")) || ($tn == "boolean") ) {
      return true;
    }
    return false;
  }
  
  function getFirst() {
    return $this->children[0];
  }
  
  function getSecond() {
    return $this->children[1];
  }
  
  function getThird() {
    return $this->children[2];
  }
  
  function isSecondExpr() {
    if ( (count($this->children)) > 1 ) {
      $second = $this->children[1];
      if ( $second->expression ) {
        return true;
      }
    }
    return false;
  }
  
  function getOperator() {
    $s = "";
    if ( (count($this->children)) > 0 ) {
      $fc = $this->children[0];
      if ( $fc->value_type == 9 ) {
        return $fc->vref;
      }
    }
    return $s;
  }
  
  function getVRefAt( $idx ) {
    $s = "";
    if ( (count($this->children)) > $idx ) {
      $fc = $this->children[$idx];
      return $fc->vref;
    }
    return $s;
  }
  
  function getStringAt( $idx ) {
    $s = "";
    if ( (count($this->children)) > $idx ) {
      $fc = $this->children[$idx];
      if ( $fc->value_type == 4 ) {
        return $fc->string_value;
      }
    }
    return $s;
  }
  
  function hasExpressionProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      return $ann->expression;
    }
    return false;
  }
  
  function getExpressionProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      return $ann;
    }
    return $ann;
  }
  
  function hasIntProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      $fc = $ann->children[0];
      if ( $fc->value_type == 3 ) {
        return true;
      }
    }
    return false;
  }
  
  function getIntProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      $fc = $ann->children[0];
      if ( $fc->value_type == 3 ) {
        return $fc->int_value;
      }
    }
    return 0;
  }
  
  function hasDoubleProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      if ( $ann->value_type == 2 ) {
        return true;
      }
    }
    return false;
  }
  
  function getDoubleProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      if ( $ann->value_type == 2 ) {
        return $ann->double_value;
      }
    }
    return 0;
  }
  
  function hasStringProperty( $name ) {
    if ( false == (array_key_exists($name , $this->props )) ) {
      return false;
    }
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      if ( $ann->value_type == 4 ) {
        return true;
      }
    }
    return false;
  }
  
  function getStringProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      if ( $ann->value_type == 4 ) {
        return $ann->string_value;
      }
    }
    return "";
  }
  
  function hasBooleanProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      if ( $ann->value_type == 5 ) {
        return true;
      }
    }
    return false;
  }
  
  function getBooleanProperty( $name ) {
    $ann = $this->props[$name];
    if ( (isset($ann)) ) {
      if ( $ann->value_type == 5 ) {
        return $ann->boolean_value;
      }
    }
    return false;
  }
  
  function isFirstTypeVref( $vrefName ) {
    if ( (count($this->children)) > 0 ) {
      $fc = $this->children[0];
      if ( $fc->value_type == 9 ) {
        return true;
      }
    }
    return false;
  }
  
  function isFirstVref( $vrefName ) {
    if ( (count($this->children)) > 0 ) {
      $fc = $this->children[0];
      if ( $fc->vref == $vrefName ) {
        return true;
      }
    }
    return false;
  }
  
  function getString() {
    return substr($this->code->code, $this->sp, $this->ep - $this->sp);
  }
  
  function walk() {
    switch ($this->value_type ) { 
      case 2 : 
        echo( "Double : " . $this->double_value . "\n");
        break;
      case 4 : 
        echo( "String : " . $this->string_value . "\n");
        break;
    }
    if ( $this->expression ) {
      echo( "(" . "\n");
    } else {
      echo( substr($this->code->code, $this->sp, $this->ep - $this->sp) . "\n");
    }
    for ( $i = 0; $i < count($this->children); $i++) {
      $item = $this->children[$i];
      $item->walk();
    }
    if ( $this->expression ) {
      echo( ")" . "\n");
    }
  }
  
  function writeCode( $wr ) {
    switch ($this->value_type ) { 
      case 2 : 
        $wr->out(strval($this->double_value), false);
        break;
      case 4 : 
        $wr->out(((chr(34)) . $this->string_value) . (chr(34)), false);
        break;
      case 3 : 
        $wr->out("" . $this->int_value, false);
        break;
      case 5 : 
        if ( $this->boolean_value ) {
          $wr->out("true", false);
        } else {
          $wr->out("false", false);
        }
        break;
      case 9 : 
        $wr->out($this->vref, false);
        break;
      case 7 : 
        $wr->out($this->vref, false);
        $wr->out((((":[" . $this->key_type) . ":") . $this->array_type) . "]", false);
        break;
      case 6 : 
        $wr->out($this->vref, false);
        $wr->out((":[" . $this->array_type) . "]", false);
        break;
    }
    if ( $this->expression ) {
      $wr->out("(", false);
      for ( $i = 0; $i < count($this->children); $i++) {
        $ch = $this->children[$i];
        $ch->writeCode($wr);
      }
      $wr->out(")", false);
    }
  }
  
  function getCode() {
    $wr =  new CodeWriter();
    $this->writeCode($wr);
    return $wr->getCode();
  }
  
  function rebuildWithType( $match , $changeVref ) {
    $newNode =  new CodeNode($this->code, $this->sp, $this->ep);
    $newNode->has_operator = $this->has_operator;
    $newNode->op_index = $this->op_index;
    $newNode->mutable_def = $this->mutable_def;
    $newNode->expression = $this->expression;
    if ( $changeVref ) {
      $newNode->vref = $match->getTypeName($this->vref);
    } else {
      $newNode->vref = $this->vref;
    }
    $newNode->is_block_node = $this->is_block_node;
    $newNode->type_type = $match->getTypeName($this->type_type);
    $newNode->type_name = $match->getTypeName($this->type_name);
    $newNode->key_type = $match->getTypeName($this->key_type);
    $newNode->array_type = $match->getTypeName($this->array_type);
    $newNode->value_type = $this->value_type;
    if ( $this->has_vref_annotation ) {
      $newNode->has_vref_annotation = true;
      $ann = $this->vref_annotation;
      $newNode->vref_annotation = $ann->rebuildWithType($match, true);
    }
    if ( $this->has_type_annotation ) {
      $newNode->has_type_annotation = true;
      $t_ann = $this->type_annotation;
      $newNode->type_annotation = $t_ann->rebuildWithType($match, true);
    }
    for ( $i = 0; $i < count($this->ns); $i++) {
      $n = $this->ns[$i];
      if ( $changeVref ) {
        $new_ns = $match->getTypeName($n);
        array_push($newNode->ns, $new_ns);
      } else {
        $newNode->vref = $this->vref;
        array_push($newNode->ns, $n);
      }
    }
    switch ($this->value_type ) { 
      case 2 : 
        $newNode->double_value = $this->double_value;
        break;
      case 4 : 
        $newNode->string_value = $this->string_value;
        break;
      case 3 : 
        $newNode->int_value = $this->int_value;
        break;
      case 5 : 
        $newNode->boolean_value = $this->boolean_value;
        break;
      case 15 : 
        if ( (isset($this->expression_value)) ) {
          $newNode->expression_value = $this->expression_value->rebuildWithType($match, $changeVref);
        }
        break;
    }
    for ( $i_1 = 0; $i_1 < count($this->prop_keys); $i_1++) {
      $key = $this->prop_keys[$i_1];
      array_push($newNode->prop_keys, $key);
      $oldp = $this->props[$key];
      $np = $oldp->rebuildWithType($match, $changeVref);
      $newNode->props[$key] = $np;
    }
    for ( $i_2 = 0; $i_2 < count($this->children); $i_2++) {
      $ch = $this->children[$i_2];
      $newCh = $ch->rebuildWithType($match, $changeVref);
      $newCh->parent = $newNode;
      array_push($newNode->children, $newCh);
    }
    return $newNode;
  }
  
  function buildTypeSignatureUsingMatch( $match ) {
    $tName = $match->getTypeName($this->type_name);
    switch ($tName ) { 
      case "double" : 
        return "double";
        break;
      case "string" : 
        return "string";
        break;
      case "integer" : 
        return "int";
        break;
      case "boolean" : 
        return "boolean";
        break;
    }
    $s = "";
    if ( $this->value_type == 6 ) {
      $s = $s . "[";
      $s = $s . $match->getTypeName($this->array_type);
      $s = $s . $this->getTypeSignatureWithMatch($match);
      $s = $s . "]";
      return $s;
    }
    if ( $this->value_type == 7 ) {
      $s = $s . "[";
      $s = $s . $match->getTypeName($this->key_type);
      $s = $s . ":";
      $s = $s . $match->getTypeName($this->array_type);
      $s = $s . $this->getTypeSignatureWithMatch($match);
      $s = $s . "]";
      return $s;
    }
    $s = $match->getTypeName($this->type_name);
    $s = $s . $this->getVRefSignatureWithMatch($match);
    return $s;
  }
  
  function buildTypeSignature() {
    switch ($this->value_type ) { 
      case 2 : 
        return "double";
        break;
      case 4 : 
        return "string";
        break;
      case 3 : 
        return "int";
        break;
      case 5 : 
        return "boolean";
        break;
      case 12 : 
        return "char";
        break;
      case 13 : 
        return "charbuffer";
        break;
    }
    $s = "";
    if ( $this->value_type == 6 ) {
      $s = $s . "[";
      $s = $s . $this->array_type;
      $s = $s . $this->getTypeSignature();
      $s = $s . "]";
      return $s;
    }
    if ( $this->value_type == 7 ) {
      $s = $s . "[";
      $s = $s . $this->key_type;
      $s = $s . ":";
      $s = $s . $this->array_type;
      $s = $s . $this->getTypeSignature();
      $s = $s . "]";
      return $s;
    }
    $s = $this->type_name;
    return $s;
  }
  
  function getVRefSignatureWithMatch( $match ) {
    if ( $this->has_vref_annotation ) {
      $nn = $this->vref_annotation->rebuildWithType($match, true);
      return "@" . $nn->getCode();
    }
    return "";
  }
  
  function getVRefSignature() {
    if ( $this->has_vref_annotation ) {
      return "@" . $this->vref_annotation->getCode();
    }
    return "";
  }
  
  function getTypeSignatureWithMatch( $match ) {
    if ( $this->has_type_annotation ) {
      $nn = $this->type_annotation->rebuildWithType($match, true);
      return "@" . $nn->getCode();
    }
    return "";
  }
  
  function getTypeSignature() {
    if ( $this->has_type_annotation ) {
      return "@" . $this->type_annotation->getCode();
    }
    return "";
  }
  
  function typeNameAsType( $ctx ) {
    switch ($this->type_name ) { 
      case "double" : 
        return 2;
        break;
      case "int" : 
        return 3;
        break;
      case "string" : 
        return 4;
        break;
      case "boolean" : 
        return 5;
        break;
      case "char" : 
        return 12;
        break;
      case "charbuffer" : 
        return 13;
        break;
      default: 
        if ( true == $this->expression ) {
          return 15;
        }
        if ( $this->value_type == 9 ) {
          if ( $ctx->isEnumDefined($this->type_name) ) {
            return 11;
          }
          if ( $ctx->isDefinedClass($this->type_name) ) {
            return 8;
          }
        }
        break;
    }
    return $this->value_type;
  }
  
  function copyEvalResFrom( $node ) {
    if ( $node->hasParamDesc ) {
      $this->hasParamDesc = $node->hasParamDesc;
      $this->paramDesc = $node->paramDesc;
    }
    if ( (isset($node->typeClass)) ) {
      $this->typeClass = $node->typeClass;
    }
    $this->eval_type = $node->eval_type;
    $this->eval_type_name = $node->eval_type_name;
    if ( $node->hasFlag("optional") ) {
      $this->setFlag("optional");
    }
    if ( $node->value_type == 7 ) {
      $this->eval_key_type = $node->eval_key_type;
      $this->eval_array_type = $node->eval_array_type;
      $this->eval_type = 7;
    }
    if ( $node->value_type == 6 ) {
      $this->eval_key_type = $node->eval_key_type;
      $this->eval_array_type = $node->eval_array_type;
      $this->eval_type = 6;
    }
    if ( $node->value_type == 15 ) {
      $this->eval_type = 15;
      $this->eval_function = $node->eval_function;
    }
  }
  
  function defineNodeTypeTo( $node , $ctx ) {
    switch ($this->type_name ) { 
      case "double" : 
        $node->value_type = 2;
        $node->eval_type = 2;
        $node->eval_type_name = "double";
        break;
      case "int" : 
        $node->value_type = 3;
        $node->eval_type = 3;
        $node->eval_type_name = "int";
        break;
      case "char" : 
        $node->value_type = 12;
        $node->eval_type = 12;
        $node->eval_type_name = "char";
        break;
      case "charbuffer" : 
        $node->value_type = 13;
        $node->eval_type = 13;
        $node->eval_type_name = "charbuffer";
        break;
      case "string" : 
        $node->value_type = 4;
        $node->eval_type = 4;
        $node->eval_type_name = "string";
        break;
      case "boolean" : 
        $node->value_type = 5;
        $node->eval_type = 5;
        $node->eval_type_name = "string";
        break;
      default: 
        if ( true == $this->expression ) {
          $node->value_type = 15;
          $node->eval_type = 15;
          $node->expression = true;
        }
        if ( $this->value_type == 6 ) {
          $node->value_type = 6;
          $node->eval_type = 6;
          $node->eval_type_name = $this->type_name;
          $node->eval_array_type = $this->array_type;
        }
        if ( $this->value_type == 7 ) {
          $node->value_type = 7;
          $node->eval_type = 7;
          $node->eval_type_name = $this->type_name;
          $node->eval_array_type = $this->array_type;
          $node->key_type = $this->key_type;
        }
        if ( $this->value_type == 11 ) {
          $node->value_type = 11;
          $node->eval_type = 11;
          $node->eval_type_name = $this->type_name;
        }
        if ( $this->value_type == 9 ) {
          if ( $ctx->isEnumDefined($this->type_name) ) {
            $node->value_type = 11;
            $node->eval_type = 11;
            $node->eval_type_name = $this->type_name;
          }
          if ( $ctx->isDefinedClass($this->type_name) ) {
            $node->value_type = 8;
            $node->eval_type = 8;
            $node->eval_type_name = $this->type_name;
          }
        }
        break;
    }
  }
  
  function ifNoTypeSetToVoid() {
    if ( (((strlen($this->type_name)) == 0) && ((strlen($this->key_type)) == 0)) && ((strlen($this->array_type)) == 0) ) {
      $this->type_name = "void";
    }
  }
  
  function ifNoTypeSetToEvalTypeOf( $node ) {
    if ( (((strlen($this->type_name)) == 0) && ((strlen($this->key_type)) == 0)) && ((strlen($this->array_type)) == 0) ) {
      $this->type_name = $node->eval_type_name;
      $this->array_type = $node->eval_array_type;
      $this->key_type = $node->eval_key_type;
      $this->value_type = $node->eval_type;
      $this->eval_type = $node->eval_type;
      $this->eval_type_name = $node->eval_type_name;
      $this->eval_array_type = $node->eval_array_type;
      $this->eval_key_type = $node->eval_key_type;
      if ( $node->value_type == 15 ) {
        if ( (!isset($this->expression_value)) ) {
          $copyOf = $node->rebuildWithType( new RangerArgMatch(), false);
          array_pop($copyOf->children );
          $this->expression_value = $copyOf;
        }
      }
      return true;
    }
    return false;
  }
}
class RangerNodeValue { 
  var $double_value;
  var $string_value;
  var $int_value;
  var $boolean_value;
  var $expression_value;
  
  function __construct( ) {
    $this->double_value;     /** note: unused */
    $this->string_value;     /** note: unused */
    $this->int_value;     /** note: unused */
    $this->boolean_value;     /** note: unused */
    $this->expression_value;     /** note: unused */
  }
}
class RangerBackReference { 
  var $from_class;
  var $var_name;
  var $ref_type;
  
  function __construct( ) {
    $this->from_class;     /** note: unused */
    $this->var_name;     /** note: unused */
    $this->ref_type;     /** note: unused */
  }
}
class RangerAppEnum { 
  var $name;
  var $cnt;
  var $values;
  var $node;
  
  function __construct( ) {
    $this->name = "";     /** note: unused */
    $this->cnt = 0;
    $this->values = array();
    $this->node;     /** note: unused */
  }
  
  function add( $n ) {
    $this->values[$n] = $this->cnt;
    $this->cnt = $this->cnt + 1;
  }
}
class OpFindResult { 
  var $did_find;
  var $node;
  
  function __construct( ) {
    $this->did_find = false;     /** note: unused */
    $this->node;     /** note: unused */
  }
}
class RangerAppWriterContext { 
  var $langOperators;
  var $stdCommands;
  var $reservedWords;
  var $intRootCounter;
  var $targetLangName;
  var $parent;
  var $defined_imports;
  var $already_imported;
  var $fileSystem;
  var $is_function;
  var $class_level_context;
  var $function_level_context;
  var $in_main;
  var $is_block;
  var $is_capturing;
  var $captured_variables;
  var $has_block_exited;
  var $in_expression;
  var $expr_stack;
  var $expr_restart;
  var $in_method;
  var $method_stack;
  var $typeNames;
  var $typeClasses;
  var $currentClassName;
  var $in_class;
  var $in_static_method;
  var $currentClass;
  var $currentMethod;
  var $thisName;
  var $definedEnums;
  var $definedInterfaces;
  var $definedInterfaceList;
  var $definedClasses;
  var $definedClassList;
  var $templateClassNodes;
  var $templateClassList;
  var $classSignatures;
  var $classToSignature;
  var $templateClasses;
  var $classStaticWriters;
  var $localVariables;
  var $localVarNames;
  var $compilerFlags;
  var $compilerSettings;
  var $parserErrors;
  var $compilerErrors;
  var $compilerMessages;
  var $compilerLog;
  var $todoList;
  var $definedMacro;
  var $defCounts;
  var $refTransform;
  var $rootFile;
  
  function __construct( ) {
    $this->langOperators;
    $this->stdCommands;
    $this->reservedWords;
    $this->intRootCounter = 1;     /** note: unused */
    $this->targetLangName = "";
    $this->parent;
    $this->defined_imports = array();     /** note: unused */
    $this->already_imported = array();
    $this->fileSystem;
    $this->is_function = false;
    $this->class_level_context = false;
    $this->function_level_context = false;
    $this->in_main = false;
    $this->is_block = false;     /** note: unused */
    $this->is_capturing = false;
    $this->captured_variables = array();
    $this->has_block_exited = false;     /** note: unused */
    $this->in_expression = false;     /** note: unused */
    $this->expr_stack = array();
    $this->expr_restart = false;
    $this->in_method = false;     /** note: unused */
    $this->method_stack = array();
    $this->typeNames = array();     /** note: unused */
    $this->typeClasses = array();     /** note: unused */
    $this->currentClassName;     /** note: unused */
    $this->in_class = false;
    $this->in_static_method = false;
    $this->currentClass;
    $this->currentMethod;
    $this->thisName = "this";
    $this->definedEnums = array();
    $this->definedInterfaces = array();     /** note: unused */
    $this->definedInterfaceList = array();     /** note: unused */
    $this->definedClasses = array();
    $this->definedClassList = array();
    $this->templateClassNodes = array();
    $this->templateClassList = array();
    $this->classSignatures = array();
    $this->classToSignature = array();
    $this->templateClasses = array();     /** note: unused */
    $this->classStaticWriters = array();
    $this->localVariables = array();
    $this->localVarNames = array();
    $this->compilerFlags = array();
    $this->compilerSettings = array();
    $this->parserErrors = array();
    $this->compilerErrors = array();
    $this->compilerMessages = array();
    $this->compilerLog = array();     /** note: unused */
    $this->todoList = array();
    $this->definedMacro = array();     /** note: unused */
    $this->defCounts = array();
    $this->refTransform = array();
    $this->rootFile = "--not-defined--";
  }
  
  function isCapturing() {
    if ( $this->is_capturing ) {
      return true;
    }
    if ( isset( $this->parent ) ) {
      return $this->parent->isCapturing();
    }
    return false;
  }
  
  function isLocalToCapture( $name ) {
    if ( array_key_exists($name , $this->localVariables ) ) {
      return true;
    }
    if ( $this->is_capturing ) {
      return false;
    }
    if ( isset( $this->parent ) ) {
      return $this->parent->isLocalToCapture($name);
    }
    return false;
  }
  
  function addCapturedVariable( $name ) {
    if ( $this->is_capturing ) {
      if ( (array_search($name, $this->captured_variables, true)) < 0 ) {
        array_push($this->captured_variables, $name);
      }
      return;
    }
    if ( isset( $this->parent ) ) {
      $this->parent->addCapturedVariable($name);
    }
  }
  
  function getCapturedVariables() {
    if ( $this->is_capturing ) {
      return $this->captured_variables;
    }
    if ( isset( $this->parent ) ) {
      $r = $this->parent->getCapturedVariables();
      return $r;
    }
    $res = array();
    return $res;
  }
  
  function transformWord( $input_word ) {
    $root = $this->getRoot();
    $root->initReservedWords();
    if ( array_key_exists($input_word , $this->refTransform ) ) {
      return ($this->refTransform[$input_word]);
    }
    return $input_word;
  }
  
  function initReservedWords() {
    if ( (isset($this->reservedWords)) ) {
      return true;
    }
    $main = $this->langOperators;
    $lang;
    for ( $i = 0; $i < count($main->children); $i++) {
      $m = $main->children[$i];
      $fc = $m->getFirst();
      if ( $fc->vref == "language" ) {
        $lang = $m;
      }
    }
    /** unused:  $cmds   **/ ;
    $langNodes = $lang->children[1];
    for ( $i_1 = 0; $i_1 < count($langNodes->children); $i_1++) {
      $lch = $langNodes->children[$i_1];
      $fc_1 = $lch->getFirst();
      if ( $fc_1->vref == "reserved_words" ) {
        /** unused:  $n = $lch->getSecond()   **/ ;
        $this->reservedWords = $lch->getSecond();
        for ( $i_2 = 0; $i_2 < count($this->reservedWords->children); $i_2++) {
          $ch = $this->reservedWords->children[$i_2];
          $word = $ch->getFirst();
          $transform = $ch->getSecond();
          $this->refTransform[$word->vref] = $transform->vref;
        }
      }
    }
    return true;
  }
  
  function initStdCommands() {
    if ( (isset($this->stdCommands)) ) {
      return true;
    }
    if ( (!isset($this->langOperators)) ) {
      return true;
    }
    $main = $this->langOperators;
    $lang;
    for ( $i = 0; $i < count($main->children); $i++) {
      $m = $main->children[$i];
      $fc = $m->getFirst();
      if ( $fc->vref == "language" ) {
        $lang = $m;
      }
    }
    /** unused:  $cmds   **/ ;
    $langNodes = $lang->children[1];
    for ( $i_1 = 0; $i_1 < count($langNodes->children); $i_1++) {
      $lch = $langNodes->children[$i_1];
      $fc_1 = $lch->getFirst();
      if ( $fc_1->vref == "commands" ) {
        /** unused:  $n = $lch->getSecond()   **/ ;
        $this->stdCommands = $lch->getSecond();
      }
    }
    return true;
  }
  
  function transformTypeName( $typeName ) {
    if ( $this->isPrimitiveType($typeName) ) {
      return $typeName;
    }
    if ( $this->isEnumDefined($typeName) ) {
      return $typeName;
    }
    if ( $this->isDefinedClass($typeName) ) {
      $cl = $this->findClass($typeName);
      if ( $cl->is_system ) {
        return ($cl->systemNames[$this->getTargetLang()]);
      }
    }
    return $typeName;
  }
  
  function isPrimitiveType( $typeName ) {
    if ( ((((($typeName == "double") || ($typeName == "string")) || ($typeName == "int")) || ($typeName == "char")) || ($typeName == "charbuffer")) || ($typeName == "boolean") ) {
      return true;
    }
    return false;
  }
  
  function isDefinedType( $typeName ) {
    if ( ((((($typeName == "double") || ($typeName == "string")) || ($typeName == "int")) || ($typeName == "char")) || ($typeName == "charbuffer")) || ($typeName == "boolean") ) {
      return true;
    }
    if ( $this->isEnumDefined($typeName) ) {
      return true;
    }
    if ( $this->isDefinedClass($typeName) ) {
      return true;
    }
    return false;
  }
  
  function hadValidType( $node ) {
    if ( $node->isPrimitiveType() || $node->isPrimitive() ) {
      return true;
    }
    if ( $node->value_type == 6 ) {
      if ( $this->isDefinedType($node->array_type) ) {
        return true;
      } else {
        $this->addError($node, "Unknown type for array values: " . $node->array_type);
        return false;
      }
    }
    if ( $node->value_type == 7 ) {
      if ( $this->isDefinedType($node->array_type) && $this->isPrimitiveType($node->key_type) ) {
        return true;
      } else {
        if ( $this->isDefinedType($node->array_type) == false ) {
          $this->addError($node, "Unknown type for map values: " . $node->array_type);
        }
        if ( $this->isDefinedType($node->array_type) == false ) {
          $this->addError($node, "Unknown type for map keys: " . $node->key_type);
        }
        return false;
      }
    }
    if ( $this->isDefinedType($node->type_name) ) {
      return true;
    } else {
      if ( $node->value_type == 15 ) {
      } else {
        $this->addError($node, (("Unknown type: " . $node->type_name) . " type ID : ") . $node->value_type);
      }
    }
    return false;
  }
  
  function getTargetLang() {
    if ( (strlen($this->targetLangName)) > 0 ) {
      return $this->targetLangName;
    }
    if ( isset( $this->parent ) ) {
      return $this->parent->getTargetLang();
    }
    return "ranger";
  }
  
  function findOperator( $node ) {
    $root = $this->getRoot();
    $root->initStdCommands();
    return $root->stdCommands->children[$node->op_index];
  }
  
  function getStdCommands() {
    $root = $this->getRoot();
    $root->initStdCommands();
    return $root->stdCommands;
  }
  
  function findClassWithSign( $node ) {
    $root = $this->getRoot();
    $tplArgs = $node->vref_annotation;
    $sign = $node->vref . $tplArgs->getCode();
    $theName = $root->classSignatures[$sign];
    return $this->findClass(($theName));
  }
  
  function createSignature( $origClass , $classSig ) {
    if ( array_key_exists($classSig , $this->classSignatures ) ) {
      return ($this->classSignatures[$classSig]);
    }
    $ii = 1;
    $sigName = ($origClass . "V") . $ii;
    while (array_key_exists($sigName , $this->classToSignature )) {
      $ii = $ii + 1;
      $sigName = ($origClass . "V") . $ii;
    }
    $this->classToSignature[$sigName] = $classSig;
    $this->classSignatures[$classSig] = $sigName;
    return $sigName;
  }
  
  function createOperator( $fromNode ) {
    $root = $this->getRoot();
    if ( $root->initStdCommands() ) {
      array_push($root->stdCommands->children, $fromNode);
      /** unused:  $fc = $fromNode->children[0]   **/ ;
    }
  }
  
  function getFileWriter( $path , $fileName ) {
    $root = $this->getRoot();
    $fs = $root->fileSystem;
    $file = $fs->getFile($path, $fileName);
    $wr;
    $wr = $file->getWriter();
    return $wr;
  }
  
  function addTodo( $node , $descr ) {
    $e =  new RangerAppTodo();
    $e->description = $descr;
    $e->todonode = $node;
    $root = $this->getRoot();
    array_push($root->todoList, $e);
  }
  
  function setThisName( $the_name ) {
    $root = $this->getRoot();
    $root->thisName = $the_name;
  }
  
  function getThisName() {
    $root = $this->getRoot();
    return $root->thisName;
  }
  
  function printLogs( $logName ) {
  }
  
  function log( $node , $logName , $descr ) {
  }
  
  function addMessage( $node , $descr ) {
    $e =  new RangerCompilerMessage();
    $e->description = $descr;
    $e->node = $node;
    $root = $this->getRoot();
    array_push($root->compilerMessages, $e);
  }
  
  function addError( $targetnode , $descr ) {
    $e =  new RangerCompilerMessage();
    $e->description = $descr;
    $e->node = $targetnode;
    $root = $this->getRoot();
    array_push($root->compilerErrors, $e);
  }
  
  function addParserError( $targetnode , $descr ) {
    $e =  new RangerCompilerMessage();
    $e->description = $descr;
    $e->node = $targetnode;
    $root = $this->getRoot();
    array_push($root->parserErrors, $e);
  }
  
  function addTemplateClass( $name , $node ) {
    $root = $this->getRoot();
    array_push($root->templateClassList, $name);
    $root->templateClassNodes[$name] = $node;
  }
  
  function hasTemplateNode( $name ) {
    $root = $this->getRoot();
    return array_key_exists($name , $root->templateClassNodes );
  }
  
  function findTemplateNode( $name ) {
    $root = $this->getRoot();
    return ($root->templateClassNodes[$name]);
  }
  
  function setStaticWriter( $className , $writer ) {
    $root = $this->getRoot();
    $root->classStaticWriters[$className] = $writer;
  }
  
  function getStaticWriter( $className ) {
    $root = $this->getRoot();
    return ($root->classStaticWriters[$className]);
  }
  
  function isEnumDefined( $n ) {
    if ( array_key_exists($n , $this->definedEnums ) ) {
      return true;
    }
    if ( (!isset($this->parent)) ) {
      return false;
    }
    return $this->parent->isEnumDefined($n);
  }
  
  function getEnum( $n ) {
    if ( array_key_exists($n , $this->definedEnums ) ) {
      return $this->definedEnums[$n];
    }
    if ( (isset($this->parent)) ) {
      return $this->parent->getEnum($n);
    }
    $none;
    return $none;
  }
  
  function isVarDefined( $name ) {
    if ( array_key_exists($name , $this->localVariables ) ) {
      return true;
    }
    if ( (!isset($this->parent)) ) {
      return false;
    }
    return $this->parent->isVarDefined($name);
  }
  
  function setCompilerFlag( $name , $value ) {
    $this->compilerFlags[$name] = $value;
  }
  
  function hasCompilerFlag( $s_name ) {
    if ( array_key_exists($s_name , $this->compilerFlags ) ) {
      return ($this->compilerFlags[$s_name]);
    }
    if ( (!isset($this->parent)) ) {
      return false;
    }
    return $this->parent->hasCompilerFlag($s_name);
  }
  
  function getCompilerSetting( $s_name ) {
    if ( array_key_exists($s_name , $this->compilerSettings ) ) {
      return ($this->compilerSettings[$s_name]);
    }
    if ( (!isset($this->parent)) ) {
      return "";
    }
    return $this->parent->getCompilerSetting($s_name);
  }
  
  function hasCompilerSetting( $s_name ) {
    if ( array_key_exists($s_name , $this->compilerSettings ) ) {
      return true;
    }
    if ( (!isset($this->parent)) ) {
      return false;
    }
    return $this->parent->hasCompilerSetting($s_name);
  }
  
  function getVariableDef( $name ) {
    if ( array_key_exists($name , $this->localVariables ) ) {
      return ($this->localVariables[$name]);
    }
    if ( (!isset($this->parent)) ) {
      $tmp =  new RangerAppParamDesc();
      return $tmp;
    }
    return $this->parent->getVariableDef($name);
  }
  
  function findFunctionCtx() {
    if ( $this->is_function ) {
      return $this;
    }
    if ( (!isset($this->parent)) ) {
      return $this;
    }
    return $this->parent->findFunctionCtx();
  }
  
  function getFnVarCnt( $name ) {
    $fnCtx = $this->findFunctionCtx();
    $ii = 0;
    if ( array_key_exists($name , $fnCtx->defCounts ) ) {
      $ii = ($fnCtx->defCounts[$name]);
      $ii = 1 + $ii;
    } else {
      $fnCtx->defCounts[$name] = $ii;
      return 0;
    }
    $scope_has = $this->isVarDefined((($name . "_") . $ii));
    while ($scope_has) {
      $ii = 1 + $ii;
      $scope_has = $this->isVarDefined((($name . "_") . $ii));
    }
    $fnCtx->defCounts[$name] = $ii;
    return $ii;
  }
  
  function debugVars() {
    echo( "--- context vars ---" . "\n");
    for ( $i = 0; $i < count($this->localVarNames); $i++) {
      $na = $this->localVarNames[$i];
      echo( "var => " . $na . "\n");
    }
    if ( (isset($this->parent)) ) {
      $this->parent->debugVars();
    }
  }
  
  function getVarTotalCnt( $name ) {
    $fnCtx = $this;
    $ii = 0;
    if ( array_key_exists($name , $fnCtx->defCounts ) ) {
      $ii = ($fnCtx->defCounts[$name]);
    }
    if ( (isset($fnCtx->parent)) ) {
      $ii = $ii + $fnCtx->parent->getVarTotalCnt($name);
    }
    if ( $this->isVarDefined($name) ) {
      $ii = $ii + 1;
    }
    return $ii;
  }
  
  function getFnVarCnt2( $name ) {
    $fnCtx = $this;
    $ii = 0;
    if ( array_key_exists($name , $fnCtx->defCounts ) ) {
      $ii = ($fnCtx->defCounts[$name]);
      $ii = 1 + $ii;
      $fnCtx->defCounts[$name] = $ii;
    } else {
      $fnCtx->defCounts[$name] = 1;
    }
    if ( (isset($fnCtx->parent)) ) {
      $ii = $ii + $fnCtx->parent->getFnVarCnt2($name);
    }
    $scope_has = $this->isVarDefined($name);
    if ( $scope_has ) {
      $ii = 1 + $ii;
    }
    $scope_has_2 = $this->isVarDefined((($name . "_") . $ii));
    while ($scope_has_2) {
      $ii = 1 + $ii;
      $scope_has_2 = $this->isVarDefined((($name . "_") . $ii));
    }
    return $ii;
  }
  
  function getFnVarCnt3( $name ) {
    $classLevel = $this->findMethodLevelContext();
    $fnCtx = $this;
    $ii = 0;
    if ( array_key_exists($name , $fnCtx->defCounts ) ) {
      $ii = ($fnCtx->defCounts[$name]);
      $fnCtx->defCounts[$name] = $ii + 1;
    } else {
      $fnCtx->defCounts[$name] = 1;
    }
    if ( $classLevel->isVarDefined($name) ) {
      $ii = $ii + 1;
    }
    $scope_has = $this->isVarDefined((($name . "_") . $ii));
    while ($scope_has) {
      $ii = 1 + $ii;
      $scope_has = $this->isVarDefined((($name . "_") . $ii));
    }
    return $ii;
  }
  
  function isMemberVariable( $name ) {
    if ( $this->isVarDefined($name) ) {
      $vDef = $this->getVariableDef($name);
      if ( $vDef->varType == 8 ) {
        return true;
      }
    }
    return false;
  }
  
  function defineVariable( $name , $desc ) {
    $cnt = 0;
    $fnLevel = $this->findMethodLevelContext();
    if ( false == ((($desc->varType == 8) || ($desc->varType == 4)) || ($desc->varType == 10)) ) {
      $cnt = $fnLevel->getFnVarCnt3($name);
    }
    if ( 0 == $cnt ) {
      if ( $name == "len" ) {
        $desc->compiledName = "__len";
      } else {
        $desc->compiledName = $name;
      }
    } else {
      $desc->compiledName = ($name . "_") . $cnt;
    }
    $this->localVariables[$name] = $desc;
    array_push($this->localVarNames, $name);
  }
  
  function isDefinedClass( $name ) {
    if ( array_key_exists($name , $this->definedClasses ) ) {
      return true;
    } else {
      if ( (isset($this->parent)) ) {
        return $this->parent->isDefinedClass($name);
      }
    }
    return false;
  }
  
  function getRoot() {
    if ( (!isset($this->parent)) ) {
      return $this;
    }
    return $this->parent->getRoot();
  }
  
  function getClasses() {
    $list = array();
    for ( $i = 0; $i < count($this->definedClassList); $i++) {
      $n = $this->definedClassList[$i];
      array_push($list, ($this->definedClasses[$n]));
    }
    return $list;
  }
  
  function addClass( $name , $desc ) {
    $root = $this->getRoot();
    if ( array_key_exists($name , $root->definedClasses ) ) {
    } else {
      $root->definedClasses[$name] = $desc;
      array_push($root->definedClassList, $name);
    }
  }
  
  function findClass( $name ) {
    $root = $this->getRoot();
    return ($root->definedClasses[$name]);
  }
  
  function hasClass( $name ) {
    $root = $this->getRoot();
    return array_key_exists($name , $root->definedClasses );
  }
  
  function getCurrentMethod() {
    if ( (isset($this->currentMethod)) ) {
      return $this->currentMethod;
    }
    if ( (isset($this->parent)) ) {
      return $this->parent->getCurrentMethod();
    }
    return  new RangerAppFunctionDesc();
  }
  
  function setCurrentClass( $cc ) {
    $this->in_class = true;
    $this->currentClass = $cc;
  }
  
  function disableCurrentClass() {
    if ( $this->in_class ) {
      $this->in_class = false;
    }
    if ( (isset($this->parent)) ) {
      $this->parent->disableCurrentClass();
    }
  }
  
  function hasCurrentClass() {
    if ( $this->in_class && ((isset($this->currentClass))) ) {
      return true;
    }
    if ( (isset($this->parent)) ) {
      return $this->parent->hasCurrentClass();
    }
    return false;
  }
  
  function getCurrentClass() {
    if ( $this->in_class && ((isset($this->currentClass))) ) {
      return $this->currentClass;
    }
    if ( (isset($this->parent)) ) {
      return $this->parent->getCurrentClass();
    }
    $non;
    return $non;
  }
  
  function restartExpressionLevel() {
    $this->expr_restart = true;
  }
  
  function isInExpression() {
    if ( (count($this->expr_stack)) > 0 ) {
      return true;
    }
    if ( ((isset($this->parent))) && ($this->expr_restart == false) ) {
      return $this->parent->isInExpression();
    }
    return false;
  }
  
  function expressionLevel() {
    $level = count($this->expr_stack);
    if ( ((isset($this->parent))) && ($this->expr_restart == false) ) {
      return $level + $this->parent->expressionLevel();
    }
    return $level;
  }
  
  function setInExpr() {
    array_push($this->expr_stack, true);
  }
  
  function unsetInExpr() {
    array_pop($this->expr_stack );
  }
  
  function getErrorCount() {
    $cnt = count($this->compilerErrors);
    if ( isset( $this->parent ) ) {
      $cnt = $cnt + $this->parent->getErrorCount();
    }
    return $cnt;
  }
  
  function isInStatic() {
    if ( $this->in_static_method ) {
      return true;
    }
    if ( isset( $this->parent ) ) {
      return $this->parent->isInStatic();
    }
    return false;
  }
  
  function isInMain() {
    if ( $this->in_main ) {
      return true;
    }
    if ( isset( $this->parent ) ) {
      return $this->parent->isInMain();
    }
    return false;
  }
  
  function isInMethod() {
    if ( (count($this->method_stack)) > 0 ) {
      return true;
    }
    if ( (isset($this->parent)) ) {
      return $this->parent->isInMethod();
    }
    return false;
  }
  
  function setInMethod() {
    array_push($this->method_stack, true);
  }
  
  function unsetInMethod() {
    array_pop($this->method_stack );
  }
  
  function findMethodLevelContext() {
    $res;
    if ( $this->function_level_context ) {
      $res = $this;
      return $res;
    }
    if ( isset( $this->parent ) ) {
      return $this->parent->findMethodLevelContext();
    }
    $res = $this;
    return $res;
  }
  
  function findClassLevelContext() {
    $res;
    if ( $this->class_level_context ) {
      $res = $this;
      return $res;
    }
    if ( isset( $this->parent ) ) {
      return $this->parent->findClassLevelContext();
    }
    $res = $this;
    return $res;
  }
  
  function fork() {
    $new_ctx =  new RangerAppWriterContext();
    $new_ctx->parent = $this;
    return $new_ctx;
  }
  
  function getRootFile() {
    $root = $this->getRoot();
    return $root->rootFile;
  }
  
  function setRootFile( $file_name ) {
    $root = $this->getRoot();
    $root->rootFile = $file_name;
  }
}
class CodeFile { 
  var $path_name;
  var $name;
  var $writer;
  var $import_list;
  var $import_names;
  var $fileSystem;
  
  function __construct( $filePath , $fileName  ) {
    $this->path_name = "";
    $this->name = "";
    $this->writer;
    $this->import_list = array();
    $this->import_names = array();
    $this->fileSystem;
    $this->name = $fileName;
    $this->path_name = $filePath;
    $this->writer =  new CodeWriter();
    $this->writer->createTag("imports");
  }
  
  function addImport( $import_name ) {
    if ( false == (array_key_exists($import_name , $this->import_list )) ) {
      $this->import_list[$import_name] = $import_name;
      array_push($this->import_names, $import_name);
    }
  }
  
  function testCreateWriter() {
    return  new CodeWriter();
  }
  
  function getImports() {
    return $this->import_names;
  }
  
  function getWriter() {
    $this->writer->ownerFile = $this;
    return $this->writer;
  }
  
  function getCode() {
    return $this->writer->getCode();
  }
}
class CodeFileSystem { 
  var $files;
  
  function __construct( ) {
    $this->files = array();
  }
  
  function getFile( $path , $name ) {
    for ( $idx = 0; $idx < count($this->files); $idx++) {
      $file = $this->files[$idx];
      if ( ($file->path_name == $path) && ($file->name == $name) ) {
        return $file;
      }
    }
    $new_file =  new CodeFile($path, $name);
    $new_file->fileSystem = $this;
    array_push($this->files, $new_file);
    return $new_file;
  }
  
  function mkdir( $path ) {
    $parts = explode("/", $path);
    $curr_path = "";
    for ( $i = 0; $i < count($parts); $i++) {
      $p = $parts[$i];
      $curr_path = ($curr_path . "/") . $p;
      if ( false == (is_dir($curr_path)) ) {
        mkdir($curr_path);
      }
    }
  }
  
  function saveTo( $path ) {
    for ( $idx = 0; $idx < count($this->files); $idx++) {
      $file = $this->files[$idx];
      $file_path = ($path . "/") . $file->path_name;
      $this->mkdir($file_path);
      echo( (("Writing to file " . $file_path) . "/") . $file->name . "\n");
      $file_content = $file->getCode();
      if ( (strlen($file_content)) > 0 ) {
        file_put_contents($file_path.'/'.$file->name , $file_content);
      }
    }
  }
}
class CodeSlice { 
  var $code;
  var $writer;
  
  function __construct( ) {
    $this->code = "";
    $this->writer;
  }
  
  function getCode() {
    if ( (!isset($this->writer)) ) {
      return $this->code;
    }
    return $this->writer->getCode();
  }
}
class CodeWriter { 
  var $tagName;
  var $codeStr;
  var $currentLine;
  var $tabStr;
  var $lineNumber;
  var $indentAmount;
  var $compiledTags;
  var $tags;
  var $slices;
  var $current_slice;
  var $ownerFile;
  var $forks;
  var $tagOffset;
  var $parent;
  var $had_nl;
  
  function __construct( ) {
    $this->tagName = "";     /** note: unused */
    $this->codeStr = "";     /** note: unused */
    $this->currentLine = "";
    $this->tabStr = "  ";
    $this->lineNumber = 1;     /** note: unused */
    $this->indentAmount = 0;
    $this->compiledTags = array();
    $this->tags = array();
    $this->slices = array();
    $this->current_slice;
    $this->ownerFile;
    $this->forks = array();     /** note: unused */
    $this->tagOffset = 0;     /** note: unused */
    $this->parent;
    $this->had_nl = true;     /** note: unused */
    $new_slice =  new CodeSlice();
    array_push($this->slices, $new_slice);
    $this->current_slice = $new_slice;
  }
  
  function getFileWriter( $path , $fileName ) {
    $fs = $this->ownerFile->fileSystem;
    $file = $fs->getFile($path, $fileName);
    $wr = $file->getWriter();
    return $wr;
  }
  
  function getImports() {
    $p = $this;
    while (((!isset($p->ownerFile))) && ((isset($p->parent)))) {
      $p = $p->parent;
    }
    if ( (isset($p->ownerFile)) ) {
      $f = $p->ownerFile;
      return $f->import_names;
    }
    $nothing = array();
    return $nothing;
  }
  
  function addImport( $name ) {
    if ( (isset($this->ownerFile)) ) {
      $this->ownerFile->addImport($name);
    } else {
      if ( (isset($this->parent)) ) {
        $this->parent->addImport($name);
      }
    }
  }
  
  function indent( $delta ) {
    $this->indentAmount = $this->indentAmount + $delta;
    if ( $this->indentAmount < 0 ) {
      $this->indentAmount = 0;
    }
  }
  
  function addIndent() {
    $i = 0;
    if ( 0 == (strlen($this->currentLine)) ) {
      while ($i < $this->indentAmount) {
        $this->currentLine = $this->currentLine . $this->tabStr;
        $i = $i + 1;
      }
    }
  }
  
  function createTag( $name ) {
    $new_writer =  new CodeWriter();
    $new_slice =  new CodeSlice();
    $this->tags[$name] = count($this->slices);
    array_push($this->slices, $new_slice);
    $new_slice->writer = $new_writer;
    $new_writer->indentAmount = $this->indentAmount;
    $new_active_slice =  new CodeSlice();
    array_push($this->slices, $new_active_slice);
    $this->current_slice = $new_active_slice;
    $new_writer->parent = $this;
    return $new_writer;
  }
  
  function getTag( $name ) {
    if ( array_key_exists($name , $this->tags ) ) {
      $idx = ($this->tags[$name]);
      $slice = $this->slices[$idx];
      return $slice->writer;
    } else {
      if ( (isset($this->parent)) ) {
        return $this->parent->getTag($name);
      }
    }
    return $this;
  }
  
  function hasTag( $name ) {
    if ( array_key_exists($name , $this->tags ) ) {
      return true;
    } else {
      if ( (isset($this->parent)) ) {
        return $this->parent->hasTag($name);
      }
    }
    return false;
  }
  
  function fork() {
    $new_writer =  new CodeWriter();
    $new_slice =  new CodeSlice();
    array_push($this->slices, $new_slice);
    $new_slice->writer = $new_writer;
    $new_writer->indentAmount = $this->indentAmount;
    $new_writer->parent = $this;
    $new_active_slice =  new CodeSlice();
    array_push($this->slices, $new_active_slice);
    $this->current_slice = $new_active_slice;
    return $new_writer;
  }
  
  function newline() {
    if ( (strlen($this->currentLine)) > 0 ) {
      $this->out("", true);
    }
  }
  
  function writeSlice( $str , $newLine ) {
    $this->addIndent();
    $this->currentLine = $this->currentLine . $str;
    if ( $newLine ) {
      $this->current_slice->code = ($this->current_slice->code . $this->currentLine) . "\n";
      $this->currentLine = "";
    }
  }
  
  function out( $str , $newLine ) {
    $lines = explode("\n", $str);
    $rowCnt = count($lines);
    if ( $rowCnt == 1 ) {
      $this->writeSlice($str, $newLine);
    } else {
      for ( $idx = 0; $idx < count($lines); $idx++) {
        $row = $lines[$idx];
        $this->addIndent();
        if ( $idx < ($rowCnt - 1) ) {
          $this->writeSlice(trim($row), true);
        } else {
          $this->writeSlice($row, $newLine);
        }
      }
    }
  }
  
  function raw( $str , $newLine ) {
    $lines = explode("\n", $str);
    $rowCnt = count($lines);
    if ( $rowCnt == 1 ) {
      $this->writeSlice($str, $newLine);
    } else {
      for ( $idx = 0; $idx < count($lines); $idx++) {
        $row = $lines[$idx];
        $this->addIndent();
        if ( $idx < ($rowCnt - 1) ) {
          $this->writeSlice($row, true);
        } else {
          $this->writeSlice($row, $newLine);
        }
      }
    }
  }
  
  function getCode() {
    $res = "";
    for ( $idx = 0; $idx < count($this->slices); $idx++) {
      $slice = $this->slices[$idx];
      $res = $res . $slice->getCode();
    }
    $res = $res . $this->currentLine;
    return $res;
  }
}
class RangerLispParser { 
  var $code;
  var $buff;
  var $__len;
  var $i;
  var $parents;
  var $next;
  var $paren_cnt;
  var $get_op_pred;
  var $rootNode;
  var $curr_node;
  var $had_error;
  
  function __construct( $code_module  ) {
    $this->code;
    $this->buff;
    $this->__len = 0;
    $this->i = 0;
    $this->parents = array();
    $this->next;     /** note: unused */
    $this->paren_cnt = 0;
    $this->get_op_pred = 0;     /** note: unused */
    $this->rootNode;
    $this->curr_node;
    $this->had_error = false;
    $this->buff = $code_module->code;
    $this->code = $code_module;
    $this->__len = strlen(($this->buff));
    $this->rootNode =  new CodeNode($this->code, 0, 0);
    $this->rootNode->is_block_node = true;
    $this->rootNode->expression = true;
    $this->curr_node = $this->rootNode;
    array_push($this->parents, $this->curr_node);
    $this->paren_cnt = 1;
  }
  
  function joo( $cm ) {
    /** unused:  $ll = strlen($cm->code)   **/ ;
  }
  
  function parse_raw_annotation() {
    $sp = $this->i;
    $ep = $this->i;
    $this->i = $this->i + 1;
    $sp = $this->i;
    $ep = $this->i;
    if ( $this->i < $this->__len ) {
      $a_node2 =  new CodeNode($this->code, $sp, $ep);
      $a_node2->expression = true;
      $this->curr_node = $a_node2;
      array_push($this->parents, $a_node2);
      $this->i = $this->i + 1;
      $this->paren_cnt = $this->paren_cnt + 1;
      $this->parse();
      return $a_node2;
    } else {
    }
    return  new CodeNode($this->code, $sp, $ep);
  }
  
  function skip_space( $is_block_parent ) {
    $s = $this->buff;
    $did_break = false;
    if ( $this->i >= $this->__len ) {
      return true;
    }
    $c = ord($s[$this->i]);
    /** unused:  $bb = $c == (46)   **/ ;
    while (($this->i < $this->__len) && ($c <= 32)) {
      if ( $is_block_parent && (($c == 10) || ($c == 13)) ) {
        $this->end_expression();
        $did_break = true;
        break;
      }
      $this->i = 1 + $this->i;
      if ( $this->i >= $this->__len ) {
        return true;
      }
      $c = ord($s[$this->i]);
    }
    return $did_break;
  }
  
  function end_expression() {
    $this->i = 1 + $this->i;
    if ( $this->i >= $this->__len ) {
      return false;
    }
    $this->paren_cnt = $this->paren_cnt - 1;
    if ( $this->paren_cnt < 0 ) {
      echo( "Parser error ) mismatch" . "\n");
    }
    array_pop($this->parents );
    if ( (isset($this->curr_node)) ) {
      $this->curr_node->ep = $this->i;
      $this->curr_node->infix_operator = false;
    }
    if ( (count($this->parents)) > 0 ) {
      $this->curr_node = $this->parents[((count($this->parents)) - 1)];
    } else {
      $this->curr_node = $this->rootNode;
    }
    $this->curr_node->infix_operator = false;
    return true;
  }
  
  function getOperator() {
    $s = $this->buff;
    if ( ($this->i + 2) >= $this->__len ) {
      return 0;
    }
    $c = ord($s[$this->i]);
    $c2 = ord($s[($this->i + 1)]);
    switch ($c ) { 
      case 42 : 
        $this->i = $this->i + 1;
        return 14;
        break;
      case 47 : 
        $this->i = $this->i + 1;
        return 14;
        break;
      case 43 : 
        $this->i = $this->i + 1;
        return 13;
        break;
      case 45 : 
        $this->i = $this->i + 1;
        return 13;
        break;
      case 60 : 
        if ( $c2 == (61) ) {
          $this->i = $this->i + 2;
          return 11;
        }
        $this->i = $this->i + 1;
        return 11;
        break;
      case 62 : 
        if ( $c2 == (61) ) {
          $this->i = $this->i + 2;
          return 11;
        }
        $this->i = $this->i + 1;
        return 11;
        break;
      case 33 : 
        if ( $c2 == (61) ) {
          $this->i = $this->i + 2;
          return 10;
        }
        return 0;
        break;
      case 61 : 
        if ( $c2 == (61) ) {
          $this->i = $this->i + 2;
          return 10;
        }
        $this->i = $this->i + 1;
        return 3;
        break;
      case 38 : 
        if ( $c2 == (38) ) {
          $this->i = $this->i + 2;
          return 6;
        }
        return 0;
        break;
      case 124 : 
        if ( $c2 == (124) ) {
          $this->i = $this->i + 2;
          return 5;
        }
        return 0;
        break;
      default: 
        break;
    }
    return 0;
  }
  
  function isOperator() {
    $s = $this->buff;
    if ( ($this->i - 2) > $this->__len ) {
      return 0;
    }
    $c = ord($s[$this->i]);
    $c2 = ord($s[($this->i + 1)]);
    switch ($c ) { 
      case 42 : 
        return 1;
        break;
      case 47 : 
        return 14;
        break;
      case 43 : 
        return 13;
        break;
      case 45 : 
        return 13;
        break;
      case 60 : 
        if ( $c2 == (61) ) {
          return 11;
        }
        return 11;
        break;
      case 62 : 
        if ( $c2 == (61) ) {
          return 11;
        }
        return 11;
        break;
      case 33 : 
        if ( $c2 == (61) ) {
          return 10;
        }
        return 0;
        break;
      case 61 : 
        if ( $c2 == (61) ) {
          return 10;
        }
        return 3;
        break;
      case 38 : 
        if ( $c2 == (38) ) {
          return 6;
        }
        return 0;
        break;
      case 124 : 
        if ( $c2 == (124) ) {
          return 5;
        }
        return 0;
        break;
      default: 
        break;
    }
    return 0;
  }
  
  function getOperatorPred( $str ) {
    switch ($str ) { 
      case "<" : 
        return 11;
        break;
      case ">" : 
        return 11;
        break;
      case "<=" : 
        return 11;
        break;
      case ">=" : 
        return 11;
        break;
      case "==" : 
        return 10;
        break;
      case "!=" : 
        return 10;
        break;
      case "=" : 
        return 3;
        break;
      case "&&" : 
        return 6;
        break;
      case "||" : 
        return 5;
        break;
      case "+" : 
        return 13;
        break;
      case "-" : 
        return 13;
        break;
      case "*" : 
        return 14;
        break;
      case "/" : 
        return 14;
        break;
      default: 
        break;
    }
    return 0;
  }
  
  function insert_node( $p_node ) {
    $push_target = $this->curr_node;
    if ( $this->curr_node->infix_operator ) {
      $push_target = $this->curr_node->infix_node;
      if ( $push_target->to_the_right ) {
        $push_target = $push_target->right_node;
        $p_node->parent = $push_target;
      }
    }
    array_push($push_target->children, $p_node);
  }
  
  function parse() {
    $s = $this->buff;
    $c = ord($s[0]);
    /** unused:  $next_c = 0   **/ ;
    $fc = 0;
    $new_node;
    $sp = 0;
    $ep = 0;
    $last_i = 0;
    $had_lf = false;
    while ($this->i < $this->__len) {
      if ( $this->had_error ) {
        break;
      }
      $last_i = $this->i;
      $is_block_parent = false;
      if ( $had_lf ) {
        $had_lf = false;
        $this->end_expression();
        break;
      }
      if ( (isset($this->curr_node)) ) {
        if ( (isset($this->curr_node->parent)) ) {
          $nodeParent = $this->curr_node->parent;
          if ( $nodeParent->is_block_node ) {
            $is_block_parent = true;
          }
        }
      }
      if ( $this->skip_space($is_block_parent) ) {
        break;
      }
      $had_lf = false;
      $c = ord($s[$this->i]);
      if ( $this->i < $this->__len ) {
        $c = ord($s[$this->i]);
        if ( $c == 59 ) {
          $sp = $this->i + 1;
          while (($this->i < $this->__len) && ((ord($s[$this->i])) > 31)) {
            $this->i = 1 + $this->i;
          }
          if ( $this->i >= $this->__len ) {
            break;
          }
          $new_node =  new CodeNode($this->code, $sp, $this->i);
          $new_node->parsed_type = 10;
          $new_node->value_type = 10;
          $new_node->string_value = substr($s, $sp, $this->i - $sp);
          array_push($this->curr_node->comments, $new_node);
          continue;
        }
        if ( $this->i < ($this->__len - 1) ) {
          $fc = ord($s[($this->i + 1)]);
          if ( ((($c == 40) || ($c == (123))) || (($c == 39) && ($fc == 40))) || (($c == 96) && ($fc == 40)) ) {
            $this->paren_cnt = $this->paren_cnt + 1;
            if ( (!isset($this->curr_node)) ) {
              $this->rootNode =  new CodeNode($this->code, $this->i, $this->i);
              $this->curr_node = $this->rootNode;
              if ( $c == 96 ) {
                $this->curr_node->parsed_type = 30;
                $this->curr_node->value_type = 30;
              }
              if ( $c == 39 ) {
                $this->curr_node->parsed_type = 29;
                $this->curr_node->value_type = 29;
              }
              $this->curr_node->expression = true;
              array_push($this->parents, $this->curr_node);
            } else {
              $new_qnode =  new CodeNode($this->code, $this->i, $this->i);
              if ( $c == 96 ) {
                $new_qnode->value_type = 30;
              }
              if ( $c == 39 ) {
                $new_qnode->value_type = 29;
              }
              $new_qnode->expression = true;
              $this->insert_node($new_qnode);
              array_push($this->parents, $new_qnode);
              $this->curr_node = $new_qnode;
            }
            if ( $c == (123) ) {
              $this->curr_node->is_block_node = true;
            }
            $this->i = 1 + $this->i;
            $this->parse();
            continue;
          }
        }
        $sp = $this->i;
        $ep = $this->i;
        $fc = ord($s[$this->i]);
        if ( ((($fc == 45) && ((ord($s[($this->i + 1)])) >= 46)) && ((ord($s[($this->i + 1)])) <= 57)) || (($fc >= 48) && ($fc <= 57)) ) {
          $is_double = false;
          $sp = $this->i;
          $this->i = 1 + $this->i;
          $c = ord($s[$this->i]);
          while (($this->i < $this->__len) && (((($c >= 48) && ($c <= 57)) || ($c == (46))) || (($this->i == $sp) && (($c == (43)) || ($c == (45)))))) {
            if ( $c == (46) ) {
              $is_double = true;
            }
            $this->i = 1 + $this->i;
            $c = ord($s[$this->i]);
          }
          $ep = $this->i;
          $new_num_node =  new CodeNode($this->code, $sp, $ep);
          if ( $is_double ) {
            $new_num_node->parsed_type = 2;
            $new_num_node->value_type = 2;
            $new_num_node->double_value = (floatval((substr($s, $sp, $ep - $sp))));
          } else {
            $new_num_node->parsed_type = 3;
            $new_num_node->value_type = 3;
            $new_num_node->int_value = (intval((substr($s, $sp, $ep - $sp))));
          }
          $this->insert_node($new_num_node);
          continue;
        }
        if ( $fc == 34 ) {
          $sp = $this->i + 1;
          $ep = $sp;
          $c = ord($s[$this->i]);
          $must_encode = false;
          while ($this->i < $this->__len) {
            $this->i = 1 + $this->i;
            $c = ord($s[$this->i]);
            if ( $c == 34 ) {
              break;
            }
            if ( $c == 92 ) {
              $this->i = 1 + $this->i;
              if ( $this->i < $this->__len ) {
                $must_encode = true;
                $c = ord($s[$this->i]);
              } else {
                break;
              }
            }
          }
          $ep = $this->i;
          if ( $this->i < $this->__len ) {
            $encoded_str = "";
            if ( $must_encode ) {
              $orig_str = (substr($s, $sp, $ep - $sp));
              $str_length = strlen($orig_str);
              $ii = 0;
              while ($ii < $str_length) {
                $cc = ord($orig_str[$ii]);
                if ( $cc == 92 ) {
                  $next_ch = ord($orig_str[($ii + 1)]);
                  switch ($next_ch ) { 
                    case 34 : 
                      $encoded_str = $encoded_str . (chr(34));
                      break;
                    case 92 : 
                      $encoded_str = $encoded_str . (chr(92));
                      break;
                    case 47 : 
                      $encoded_str = $encoded_str . (chr(47));
                      break;
                    case 98 : 
                      $encoded_str = $encoded_str . (chr(8));
                      break;
                    case 102 : 
                      $encoded_str = $encoded_str . (chr(12));
                      break;
                    case 110 : 
                      $encoded_str = $encoded_str . (chr(10));
                      break;
                    case 114 : 
                      $encoded_str = $encoded_str . (chr(13));
                      break;
                    case 116 : 
                      $encoded_str = $encoded_str . (chr(9));
                      break;
                    case 117 : 
                      $ii = $ii + 4;
                      break;
                    default: 
                      break;
                  }
                  $ii = $ii + 2;
                } else {
                  $encoded_str = $encoded_str . (substr($orig_str, $ii, (1 + $ii) - $ii));
                  $ii = $ii + 1;
                }
              }
            }
            $new_str_node =  new CodeNode($this->code, $sp, $ep);
            $new_str_node->parsed_type = 4;
            $new_str_node->value_type = 4;
            if ( $must_encode ) {
              $new_str_node->string_value = $encoded_str;
            } else {
              $new_str_node->string_value = substr($s, $sp, $ep - $sp);
            }
            $this->insert_node($new_str_node);
            $this->i = 1 + $this->i;
            continue;
          }
        }
        if ( ((($fc == (116)) && ((ord($s[($this->i + 1)])) == (114))) && ((ord($s[($this->i + 2)])) == (117))) && ((ord($s[($this->i + 3)])) == (101)) ) {
          $new_true_node =  new CodeNode($this->code, $sp, $sp + 4);
          $new_true_node->value_type = 5;
          $new_true_node->parsed_type = 5;
          $new_true_node->boolean_value = true;
          $this->insert_node($new_true_node);
          $this->i = $this->i + 4;
          continue;
        }
        if ( (((($fc == (102)) && ((ord($s[($this->i + 1)])) == (97))) && ((ord($s[($this->i + 2)])) == (108))) && ((ord($s[($this->i + 3)])) == (115))) && ((ord($s[($this->i + 4)])) == (101)) ) {
          $new_f_node =  new CodeNode($this->code, $sp, $sp + 5);
          $new_f_node->value_type = 5;
          $new_f_node->parsed_type = 5;
          $new_f_node->boolean_value = false;
          $this->insert_node($new_f_node);
          $this->i = $this->i + 5;
          continue;
        }
        if ( $fc == (64) ) {
          $this->i = $this->i + 1;
          $sp = $this->i;
          $ep = $this->i;
          $c = ord($s[$this->i]);
          while ((((($this->i < $this->__len) && ((ord($s[$this->i])) > 32)) && ($c != 40)) && ($c != 41)) && ($c != (125))) {
            $this->i = 1 + $this->i;
            $c = ord($s[$this->i]);
          }
          $ep = $this->i;
          if ( ($this->i < $this->__len) && ($ep > $sp) ) {
            $a_node2 =  new CodeNode($this->code, $sp, $ep);
            $a_name = substr($s, $sp, $ep - $sp);
            $a_node2->expression = true;
            $this->curr_node = $a_node2;
            array_push($this->parents, $a_node2);
            $this->i = $this->i + 1;
            $this->paren_cnt = $this->paren_cnt + 1;
            $this->parse();
            $use_first = false;
            if ( 1 == (count($a_node2->children)) ) {
              $ch1 = $a_node2->children[0];
              $use_first = $ch1->isPrimitive();
            }
            if ( $use_first ) {
              $theNode = array_splice($a_node2->children, 0, 1)[0];
              $this->curr_node->props[$a_name] = $theNode;
            } else {
              $this->curr_node->props[$a_name] = $a_node2;
            }
            array_push($this->curr_node->prop_keys, $a_name);
            continue;
          }
        }
        $ns_list = array();
        $last_ns = $this->i;
        $ns_cnt = 1;
        $vref_had_type_ann = false;
        $vref_ann_node;
        $vref_end = $this->i;
        if ( ((((($this->i < $this->__len) && ((ord($s[$this->i])) > 32)) && ($c != 58)) && ($c != 40)) && ($c != 41)) && ($c != (125)) ) {
          if ( $this->curr_node->is_block_node == true ) {
            $new_expr_node =  new CodeNode($this->code, $sp, $ep);
            $new_expr_node->parent = $this->curr_node;
            $new_expr_node->expression = true;
            array_push($this->curr_node->children, $new_expr_node);
            $this->curr_node = $new_expr_node;
            array_push($this->parents, $new_expr_node);
            $this->paren_cnt = 1 + $this->paren_cnt;
            $this->parse();
            continue;
          }
        }
        $op_c = 0;
        $op_c = $this->getOperator();
        $last_was_newline = false;
        if ( $op_c > 0 ) {
        } else {
          while (((((($this->i < $this->__len) && ((ord($s[$this->i])) > 32)) && ($c != 58)) && ($c != 40)) && ($c != 41)) && ($c != (125))) {
            if ( $this->i > $sp ) {
              $is_opchar = $this->isOperator();
              if ( $is_opchar > 0 ) {
                break;
              }
            }
            $this->i = 1 + $this->i;
            $c = ord($s[$this->i]);
            if ( ($c == 10) || ($c == 13) ) {
              $last_was_newline = true;
              break;
            }
            if ( $c == (46) ) {
              array_push($ns_list, substr($s, $last_ns, $this->i - $last_ns));
              $last_ns = $this->i + 1;
              $ns_cnt = 1 + $ns_cnt;
            }
            if ( ($this->i > $vref_end) && ($c == (64)) ) {
              $vref_had_type_ann = true;
              $vref_end = $this->i;
              $vref_ann_node = $this->parse_raw_annotation();
              $c = ord($s[$this->i]);
              break;
            }
          }
        }
        $ep = $this->i;
        if ( $vref_had_type_ann ) {
          $ep = $vref_end;
        }
        array_push($ns_list, substr($s, $last_ns, $ep - $last_ns));
        $c = ord($s[$this->i]);
        while ((($this->i < $this->__len) && ($c <= 32)) && (false == $last_was_newline)) {
          $this->i = 1 + $this->i;
          $c = ord($s[$this->i]);
          if ( $is_block_parent && (($c == 10) || ($c == 13)) ) {
            $this->i = $this->i - 1;
            $c = ord($s[$this->i]);
            $had_lf = true;
            break;
          }
        }
        if ( $c == 58 ) {
          $this->i = $this->i + 1;
          while (($this->i < $this->__len) && ((ord($s[$this->i])) <= 32)) {
            $this->i = 1 + $this->i;
          }
          $vt_sp = $this->i;
          $vt_ep = $this->i;
          $c = ord($s[$this->i]);
          if ( $c == (40) ) {
            $vann_arr2 = $this->parse_raw_annotation();
            $vann_arr2->expression = true;
            $new_expr_node_1 =  new CodeNode($this->code, $sp, $vt_ep);
            $new_expr_node_1->vref = substr($s, $sp, $ep - $sp);
            $new_expr_node_1->ns = $ns_list;
            $new_expr_node_1->expression_value = $vann_arr2;
            $new_expr_node_1->parsed_type = 15;
            $new_expr_node_1->value_type = 15;
            if ( $vref_had_type_ann ) {
              $new_expr_node_1->vref_annotation = $vref_ann_node;
              $new_expr_node_1->has_vref_annotation = true;
            }
            array_push($this->curr_node->children, $new_expr_node_1);
            continue;
          }
          if ( $c == (91) ) {
            $this->i = $this->i + 1;
            $vt_sp = $this->i;
            $hash_sep = 0;
            $had_array_type_ann = false;
            $c = ord($s[$this->i]);
            while ((($this->i < $this->__len) && ($c > 32)) && ($c != 93)) {
              $this->i = 1 + $this->i;
              $c = ord($s[$this->i]);
              if ( $c == (58) ) {
                $hash_sep = $this->i;
              }
              if ( $c == (64) ) {
                $had_array_type_ann = true;
                break;
              }
            }
            $vt_ep = $this->i;
            if ( $hash_sep > 0 ) {
              $vt_ep = $this->i;
              $type_name = substr($s, (1 + $hash_sep), $vt_ep - (1 + $hash_sep));
              $key_type_name = substr($s, $vt_sp, $hash_sep - $vt_sp);
              $new_hash_node =  new CodeNode($this->code, $sp, $vt_ep);
              $new_hash_node->vref = substr($s, $sp, $ep - $sp);
              $new_hash_node->ns = $ns_list;
              $new_hash_node->parsed_type = 7;
              $new_hash_node->value_type = 7;
              $new_hash_node->array_type = $type_name;
              $new_hash_node->key_type = $key_type_name;
              if ( $vref_had_type_ann ) {
                $new_hash_node->vref_annotation = $vref_ann_node;
                $new_hash_node->has_vref_annotation = true;
              }
              if ( $had_array_type_ann ) {
                $vann_hash = $this->parse_raw_annotation();
                $new_hash_node->type_annotation = $vann_hash;
                $new_hash_node->has_type_annotation = true;
                echo( "--> parsed HASH TYPE annotation" . "\n");
              }
              $new_hash_node->parent = $this->curr_node;
              array_push($this->curr_node->children, $new_hash_node);
              $this->i = 1 + $this->i;
              continue;
            } else {
              $vt_ep = $this->i;
              $type_name_1 = substr($s, $vt_sp, $vt_ep - $vt_sp);
              $new_arr_node =  new CodeNode($this->code, $sp, $vt_ep);
              $new_arr_node->vref = substr($s, $sp, $ep - $sp);
              $new_arr_node->ns = $ns_list;
              $new_arr_node->parsed_type = 6;
              $new_arr_node->value_type = 6;
              $new_arr_node->array_type = $type_name_1;
              $new_arr_node->parent = $this->curr_node;
              array_push($this->curr_node->children, $new_arr_node);
              if ( $vref_had_type_ann ) {
                $new_arr_node->vref_annotation = $vref_ann_node;
                $new_arr_node->has_vref_annotation = true;
              }
              if ( $had_array_type_ann ) {
                $vann_arr = $this->parse_raw_annotation();
                $new_arr_node->type_annotation = $vann_arr;
                $new_arr_node->has_type_annotation = true;
                echo( "--> parsed ARRAY TYPE annotation" . "\n");
              }
              $this->i = 1 + $this->i;
              continue;
            }
          }
          $had_type_ann = false;
          while ((((((($this->i < $this->__len) && ((ord($s[$this->i])) > 32)) && ($c != 58)) && ($c != 40)) && ($c != 41)) && ($c != (125))) && ($c != (44))) {
            $this->i = 1 + $this->i;
            $c = ord($s[$this->i]);
            if ( $c == (64) ) {
              $had_type_ann = true;
              break;
            }
          }
          if ( $this->i < $this->__len ) {
            $vt_ep = $this->i;
            /** unused:  $type_name_2 = substr($s, $vt_sp, $vt_ep - $vt_sp)   **/ ;
            $new_ref_node =  new CodeNode($this->code, $sp, $ep);
            $new_ref_node->vref = substr($s, $sp, $ep - $sp);
            $new_ref_node->ns = $ns_list;
            $new_ref_node->parsed_type = 9;
            $new_ref_node->value_type = 9;
            $new_ref_node->type_name = substr($s, $vt_sp, $vt_ep - $vt_sp);
            $new_ref_node->parent = $this->curr_node;
            if ( $vref_had_type_ann ) {
              $new_ref_node->vref_annotation = $vref_ann_node;
              $new_ref_node->has_vref_annotation = true;
            }
            array_push($this->curr_node->children, $new_ref_node);
            if ( $had_type_ann ) {
              $vann = $this->parse_raw_annotation();
              $new_ref_node->type_annotation = $vann;
              $new_ref_node->has_type_annotation = true;
            }
            continue;
          }
        } else {
          if ( ($this->i < $this->__len) && ($ep > $sp) ) {
            $new_vref_node =  new CodeNode($this->code, $sp, $ep);
            $new_vref_node->vref = substr($s, $sp, $ep - $sp);
            $new_vref_node->parsed_type = 9;
            $new_vref_node->value_type = 9;
            $new_vref_node->ns = $ns_list;
            $new_vref_node->parent = $this->curr_node;
            $op_pred = $this->getOperatorPred($new_vref_node->vref);
            if ( $new_vref_node->vref == "," ) {
              $this->curr_node->infix_operator = false;
              continue;
            }
            $pTarget = $this->curr_node;
            if ( $this->curr_node->infix_operator ) {
              $iNode = $this->curr_node->infix_node;
              if ( ($op_pred > 0) || ($iNode->to_the_right == false) ) {
                $pTarget = $iNode;
              } else {
                $rn = $iNode->right_node;
                $new_vref_node->parent = $rn;
                $pTarget = $rn;
              }
            }
            array_push($pTarget->children, $new_vref_node);
            if ( $vref_had_type_ann ) {
              $new_vref_node->vref_annotation = $vref_ann_node;
              $new_vref_node->has_vref_annotation = true;
            }
            if ( ($this->i + 1) < $this->__len ) {
              if ( ((ord($s[($this->i + 1)])) == (40)) || ((ord($s[($this->i + 0)])) == (40)) ) {
                if ( ((0 == $op_pred) && $this->curr_node->infix_operator) && (1 == (count($this->curr_node->children))) ) {
                }
              }
            }
            if ( (($op_pred > 0) && $this->curr_node->infix_operator) || (($op_pred > 0) && ((count($this->curr_node->children)) >= 2)) ) {
              if ( ($op_pred == 3) && (2 == (count($this->curr_node->children))) ) {
                $n_ch = array_splice($this->curr_node->children, 0, 1)[0];
                array_push($this->curr_node->children, $n_ch);
              } else {
                if ( false == $this->curr_node->infix_operator ) {
                  $if_node =  new CodeNode($this->code, $sp, $ep);
                  $this->curr_node->infix_node = $if_node;
                  $this->curr_node->infix_operator = true;
                  $if_node->infix_subnode = true;
                  $this->curr_node->value_type = 0;
                  $this->curr_node->expression = true;
                  $if_node->expression = true;
                  $ch_cnt = count($this->curr_node->children);
                  $ii_1 = 0;
                  $start_from = $ch_cnt - 2;
                  $keep_nodes =  new CodeNode($this->code, $sp, $ep);
                  while ($ch_cnt > 0) {
                    $n_ch_1 = array_splice($this->curr_node->children, 0, 1)[0];
                    $p_target = $if_node;
                    if ( ($ii_1 < $start_from) || $n_ch_1->infix_subnode ) {
                      $p_target = $keep_nodes;
                    }
                    array_push($p_target->children, $n_ch_1);
                    $ch_cnt = $ch_cnt - 1;
                    $ii_1 = 1 + $ii_1;
                  }
                  for ( $this->i_1 = 0; $this->i_1 < count($keep_nodes->children); $this->i_1++) {
                    $keep = $keep_nodes->children[$this->i_1];
                    array_push($this->curr_node->children, $keep);
                  }
                  array_push($this->curr_node->children, $if_node);
                }
                $ifNode = $this->curr_node->infix_node;
                $new_op_node =  new CodeNode($this->code, $sp, $ep);
                $new_op_node->expression = true;
                $new_op_node->parent = $ifNode;
                $until_index = (count($ifNode->children)) - 1;
                $to_right = false;
                $just_continue = false;
                if ( ($ifNode->operator_pred > 0) && ($ifNode->operator_pred < $op_pred) ) {
                  $to_right = true;
                }
                if ( ($ifNode->operator_pred > 0) && ($ifNode->operator_pred > $op_pred) ) {
                  $ifNode->to_the_right = false;
                }
                if ( ($ifNode->operator_pred > 0) && ($ifNode->operator_pred == $op_pred) ) {
                  $to_right = $ifNode->to_the_right;
                }
                /** unused:  $opTarget = $ifNode   **/ ;
                if ( $to_right ) {
                  $op_node = array_splice($ifNode->children, $until_index, 1)[0];
                  $last_value = array_splice($ifNode->children, ($until_index - 1), 1)[0];
                  array_push($new_op_node->children, $op_node);
                  array_push($new_op_node->children, $last_value);
                } else {
                  if ( false == $just_continue ) {
                    while ($until_index > 0) {
                      $what_to_add = array_splice($ifNode->children, 0, 1)[0];
                      array_push($new_op_node->children, $what_to_add);
                      $until_index = $until_index - 1;
                    }
                  }
                }
                if ( $to_right || (false == $just_continue) ) {
                  array_push($ifNode->children, $new_op_node);
                }
                if ( $to_right ) {
                  $ifNode->right_node = $new_op_node;
                  $ifNode->to_the_right = true;
                }
                $ifNode->operator_pred = $op_pred;
                continue;
              }
            }
            continue;
          }
        }
        if ( ($c == 41) || ($c == (125)) ) {
          if ( (($c == (125)) && $is_block_parent) && ((count($this->curr_node->children)) > 0) ) {
            $this->end_expression();
          }
          $this->i = 1 + $this->i;
          $this->paren_cnt = $this->paren_cnt - 1;
          if ( $this->paren_cnt < 0 ) {
            break;
          }
          array_pop($this->parents );
          if ( (isset($this->curr_node)) ) {
            $this->curr_node->ep = $this->i;
          }
          if ( (count($this->parents)) > 0 ) {
            $this->curr_node = $this->parents[((count($this->parents)) - 1)];
          } else {
            $this->curr_node = $this->rootNode;
          }
          break;
        }
        if ( $last_i == $this->i ) {
          $this->i = 1 + $this->i;
        }
      }
    }
  }
}
class RangerArgMatch { 
  var $matched;
  
  function __construct( ) {
    $this->matched = array();
  }
  
  function matchArguments( $args , $callArgs , $ctx , $firstArgIndex ) {
    /** unused:  $fc = $callArgs->children[0]   **/ ;
    $missed_args = array();
    $all_matched = true;
    if ( ((count($args->children)) == 0) && ((count($callArgs->children)) > 1) ) {
      return false;
    }
    $lastArg;
    for ( $i = 0; $i < count($callArgs->children); $i++) {
      $callArg = $callArgs->children[$i];
      if ( $i == 0 ) {
        continue;
      }
      $arg_index = $i - 1;
      if ( $arg_index < (count($args->children)) ) {
        $lastArg = $args->children[$arg_index];
      }
      $arg = $lastArg;
      if ( $arg->hasFlag("ignore") ) {
        continue;
      }
      if ( $arg->hasFlag("mutable") ) {
        if ( $callArg->hasParamDesc ) {
          $pa = $callArg->paramDesc;
          $b = $pa->nameNode->hasFlag("mutable");
          if ( $b == false ) {
            array_push($missed_args, "was mutable");
            $all_matched = false;
          }
        } else {
          $all_matched = false;
        }
      }
      if ( $arg->hasFlag("optional") ) {
        if ( $callArg->hasParamDesc ) {
          $pa_1 = $callArg->paramDesc;
          $b_1 = $pa_1->nameNode->hasFlag("optional");
          if ( $b_1 == false ) {
            array_push($missed_args, "optional was missing");
            $all_matched = false;
          }
        } else {
          if ( $callArg->hasFlag("optional") ) {
          } else {
            $all_matched = false;
          }
        }
      }
      if ( $callArg->hasFlag("optional") ) {
        if ( false == $arg->hasFlag("optional") ) {
          $all_matched = false;
        }
      }
      if ( ($arg->value_type != 7) && ($arg->value_type != 6) ) {
        if ( $callArg->eval_type == 11 ) {
          if ( $arg->type_name == "enum" ) {
            continue;
          }
        }
        if ( false == $this->add($arg->type_name, $callArg->eval_type_name, $ctx) ) {
          $all_matched = false;
          return $all_matched;
        }
      }
      if ( $arg->value_type == 6 ) {
        if ( false == $this->add($arg->array_type, $callArg->eval_array_type, $ctx) ) {
          echo( "--> Failed to add the argument  " . "\n");
          $all_matched = false;
        }
      }
      if ( $arg->value_type == 7 ) {
        if ( false == $this->add($arg->key_type, $callArg->eval_key_type, $ctx) ) {
          echo( "--> Failed to add the key argument  " . "\n");
          $all_matched = false;
        }
        if ( false == $this->add($arg->array_type, $callArg->eval_array_type, $ctx) ) {
          echo( "--> Failed to add the key argument  " . "\n");
          $all_matched = false;
        }
      }
      $did_match = false;
      if ( $this->doesMatch($arg, $callArg, $ctx) ) {
        $did_match = true;
      } else {
        array_push($missed_args, (("matching arg " . $arg->vref) . " faileg against ") . $callArg->vref);
      }
      if ( false == $did_match ) {
        $all_matched = false;
      }
    }
    return $all_matched;
  }
  
  function add( $tplKeyword , $typeName , $ctx ) {
    switch ($tplKeyword ) { 
      case "string" : 
        return true;
        break;
      case "int" : 
        return true;
        break;
      case "double" : 
        return true;
        break;
      case "boolean" : 
        return true;
        break;
      case "enum" : 
        return true;
        break;
      case "char" : 
        return true;
        break;
      case "charbuffer" : 
        return true;
        break;
    }
    if ( (strlen($tplKeyword)) > 1 ) {
      return true;
    }
    if ( array_key_exists($tplKeyword , $this->matched ) ) {
      $s = ($this->matched[$tplKeyword]);
      if ( $this->areEqualTypes($s, $typeName, $ctx) ) {
        return true;
      }
      if ( $s == $typeName ) {
        return true;
      } else {
        return false;
      }
    }
    $this->matched[$tplKeyword] = $typeName;
    return true;
  }
  
  function doesDefsMatch( $arg , $node , $ctx ) {
    if ( $node->value_type == 11 ) {
      if ( $arg->type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( ($arg->value_type != 7) && ($arg->value_type != 6) ) {
      $eq = $this->areEqualTypes($arg->type_name, $node->type_name, $ctx);
      $t_name = $arg->type_name;
      switch ($t_name ) { 
        case "expression" : 
          return $node->expression;
          break;
        case "block" : 
          return $node->expression;
          break;
        case "arguments" : 
          return $node->expression;
          break;
        case "keyword" : 
          return $node->eval_type == 9;
          break;
        case "T.name" : 
          return $node->eval_type_name == $t_name;
          break;
      }
      return $eq;
    }
    if ( ($arg->value_type == 6) && ($node->eval_type == 6) ) {
      $same_arrays = $this->areEqualTypes($arg->array_type, $node->array_type, $ctx);
      return $same_arrays;
    }
    if ( ($arg->value_type == 7) && ($node->eval_type == 7) ) {
      $same_arrays_1 = $this->areEqualTypes($arg->array_type, $node->array_type, $ctx);
      $same_keys = $this->areEqualTypes($arg->key_type, $node->key_type, $ctx);
      return $same_arrays_1 && $same_keys;
    }
    return false;
  }
  
  function doesMatch( $arg , $node , $ctx ) {
    if ( $node->value_type == 11 ) {
      if ( $arg->type_name == "enum" ) {
        return true;
      } else {
        return false;
      }
    }
    if ( ($arg->value_type != 7) && ($arg->value_type != 6) ) {
      $eq = $this->areEqualTypes($arg->type_name, $node->eval_type_name, $ctx);
      $t_name = $arg->type_name;
      switch ($t_name ) { 
        case "expression" : 
          return $node->expression;
          break;
        case "block" : 
          return $node->expression;
          break;
        case "arguments" : 
          return $node->expression;
          break;
        case "keyword" : 
          return $node->eval_type == 9;
          break;
        case "T.name" : 
          return $node->eval_type_name == $t_name;
          break;
      }
      return $eq;
    }
    if ( ($arg->value_type == 6) && ($node->eval_type == 6) ) {
      $same_arrays = $this->areEqualTypes($arg->array_type, $node->eval_array_type, $ctx);
      return $same_arrays;
    }
    if ( ($arg->value_type == 7) && ($node->eval_type == 7) ) {
      $same_arrays_1 = $this->areEqualTypes($arg->array_type, $node->eval_array_type, $ctx);
      $same_keys = $this->areEqualTypes($arg->key_type, $node->eval_key_type, $ctx);
      return $same_arrays_1 && $same_keys;
    }
    return false;
  }
  
  function areEqualTypes( $type1 , $type2 , $ctx ) {
    $t_name = $type1;
    if ( array_key_exists($type1 , $this->matched ) ) {
      $t_name = ($this->matched[$type1]);
    }
    switch ($t_name ) { 
      case "string" : 
        return $type2 == "string";
        break;
      case "int" : 
        return $type2 == "int";
        break;
      case "double" : 
        return $type2 == "double";
        break;
      case "boolean" : 
        return $type2 == "boolean";
        break;
      case "enum" : 
        return $type2 == "enum";
        break;
      case "char" : 
        return $type2 == "char";
        break;
      case "charbuffer" : 
        return $type2 == "charbuffer";
        break;
    }
    if ( $ctx->isDefinedClass($t_name) && $ctx->isDefinedClass($type2) ) {
      $c1 = $ctx->findClass($t_name);
      $c2 = $ctx->findClass($type2);
      if ( $c1->isSameOrParentClass($type2, $ctx) ) {
        return true;
      }
      if ( $c2->isSameOrParentClass($t_name, $ctx) ) {
        return true;
      }
    } else {
      if ( $ctx->isDefinedClass($t_name) ) {
        $c1_1 = $ctx->findClass($t_name);
        if ( $c1_1->isSameOrParentClass($type2, $ctx) ) {
          return true;
        }
      }
    }
    return $t_name == $type2;
  }
  
  function getTypeName( $n ) {
    $t_name = $n;
    if ( array_key_exists($t_name , $this->matched ) ) {
      $t_name = ($this->matched[$t_name]);
    }
    if ( 0 == (strlen($t_name)) ) {
      return "";
    }
    return $t_name;
  }
  
  function getType( $n ) {
    $t_name = $n;
    if ( array_key_exists($t_name , $this->matched ) ) {
      $t_name = ($this->matched[$t_name]);
    }
    if ( 0 == (strlen($t_name)) ) {
      return 0;
    }
    switch ($t_name ) { 
      case "expression" : 
        return 14;
        break;
      case "block" : 
        return 14;
        break;
      case "arguments" : 
        return 14;
        break;
      case "string" : 
        return 4;
        break;
      case "int" : 
        return 3;
        break;
      case "char" : 
        return 12;
        break;
      case "charbuffer" : 
        return 13;
        break;
      case "boolean" : 
        return 5;
        break;
      case "double" : 
        return 2;
        break;
      case "enum" : 
        return 11;
        break;
    }
    return 8;
  }
  
  function setRvBasedOn( $arg , $node ) {
    if ( $arg->hasFlag("optional") ) {
      $node->setFlag("optional");
    }
    if ( ($arg->value_type != 7) && ($arg->value_type != 6) ) {
      $node->eval_type = $this->getType($arg->type_name);
      $node->eval_type_name = $this->getTypeName($arg->type_name);
      return true;
    }
    if ( $arg->value_type == 6 ) {
      $node->eval_type = 6;
      $node->eval_array_type = $this->getTypeName($arg->array_type);
      return true;
    }
    if ( $arg->value_type == 7 ) {
      $node->eval_type = 7;
      $node->eval_key_type = $this->getTypeName($arg->key_type);
      $node->eval_array_type = $this->getTypeName($arg->array_type);
      return true;
    }
    return false;
  }
}
class ClassJoinPoint { 
  var $class_def;
  var $node;
  
  function __construct( ) {
    $this->class_def;
    $this->node;
  }
}
class RangerFlowParser { 
  var $stdCommands;
  var $lastProcessedNode;
  var $collectWalkAtEnd;
  var $walkAlso;
  var $serializedClasses;
  var $classesWithTraits;
  var $collectedIntefaces;
  var $definedInterfaces;
  
  function __construct( ) {
    $this->stdCommands;
    $this->lastProcessedNode;
    $this->collectWalkAtEnd = array();     /** note: unused */
    $this->walkAlso = array();
    $this->serializedClasses = array();
    $this->classesWithTraits = array();
    $this->collectedIntefaces = array();
    $this->definedInterfaces = array();     /** note: unused */
  }
  
  function cmdEnum( $node , $ctx , $wr ) {
    $fNameNode = $node->children[1];
    $enumList = $node->children[2];
    $new_enum =  new RangerAppEnum();
    for ( $i = 0; $i < count($enumList->children); $i++) {
      $item = $enumList->children[$i];
      $new_enum->add($item->vref);
    }
    $ctx->definedEnums[$fNameNode->vref] = $new_enum;
  }
  
  function initStdCommands() {
  }
  
  function findLanguageOper( $details , $ctx ) {
    $langName = $ctx->getTargetLang();
    for ( $i = 0; $i < count($details->children); $i++) {
      $det = $details->children[$i];
      if ( (count($det->children)) > 0 ) {
        $fc = $det->children[0];
        if ( $fc->vref == "templates" ) {
          $tplList = $det->children[1];
          for ( $i_1 = 0; $i_1 < count($tplList->children); $i_1++) {
            $tpl = $tplList->children[$i_1];
            $tplName = $tpl->getFirst();
            $tplImpl;
            $tplImpl = $tpl->getSecond();
            if ( ($tplName->vref != "*") && ($tplName->vref != $langName) ) {
              continue;
            }
            $rv;
            $rv = $tpl;
            return $rv;
          }
        }
      }
    }
    $none;
    return $none;
  }
  
  function buildMacro( $langOper , $args , $ctx ) {
    $subCtx = $ctx->fork();
    $wr =  new CodeWriter();
    $lcc =  new LiveCompiler();
    $lcc->langWriter =  new RangerRangerClassWriter();
    $lcc->langWriter->compiler = $lcc;
    $subCtx->targetLangName = "ranger";
    $subCtx->restartExpressionLevel();
    $macroNode = $langOper;
    $cmdList = $macroNode->getSecond();
    $lcc->walkCommandList($cmdList, $args, $subCtx, $wr);
    $lang_str = $wr->getCode();
    $lang_code =  new SourceCode($lang_str);
    $lang_code->filename = ("<macro " . $macroNode->vref) . ">";
    $lang_parser =  new RangerLispParser($lang_code);
    $lang_parser->parse();
    $node = $lang_parser->rootNode;
    return $node;
  }
  
  function stdParamMatch( $callArgs , $inCtx , $wr ) {
    $this->stdCommands = $inCtx->getStdCommands();
    $callFnName = $callArgs->getFirst();
    $cmds = $this->stdCommands;
    $some_matched = false;
    /** unused:  $found_fn = false   **/ ;
    /** unused:  $missed_args = array()   **/ ;
    $ctx = $inCtx->fork();
    /** unused:  $lang_name = $ctx->getTargetLang()   **/ ;
    $expects_error = false;
    $err_cnt = $inCtx->getErrorCount();
    if ( $callArgs->hasBooleanProperty("error") ) {
      $expects_error = true;
    }
    for ( $main_index = 0; $main_index < count($cmds->children); $main_index++) {
      $ch = $cmds->children[$main_index];
      $fc = $ch->getFirst();
      $nameNode = $ch->getSecond();
      $args = $ch->getThird();
      if ( $callFnName->vref == $fc->vref ) {
        /** unused:  $line_index = $callArgs->getLine()   **/ ;
        $callerArgCnt = (count($callArgs->children)) - 1;
        $fnArgCnt = count($args->children);
        $has_eval_ctx = false;
        $is_macro = false;
        if ( $nameNode->hasFlag("newcontext") ) {
          $ctx = $inCtx->fork();
          $has_eval_ctx = true;
        }
        $expanding_node = $nameNode->hasFlag("expands");
        if ( ($callerArgCnt == $fnArgCnt) || $expanding_node ) {
          $details_list = $ch->children[3];
          $langOper = $this->findLanguageOper($details_list, $ctx);
          if ( (!isset($langOper)) ) {
            continue;
          }
          if ( $langOper->hasBooleanProperty("macro") ) {
            $is_macro = true;
          }
          $match =  new RangerArgMatch();
          $last_walked = 0;
          for ( $i = 0; $i < count($args->children); $i++) {
            $arg = $args->children[$i];
            $callArg = $callArgs->children[($i + 1)];
            if ( $arg->hasFlag("define") ) {
              $p =  new RangerAppParamDesc();
              $p->name = $callArg->vref;
              $p->value_type = $arg->value_type;
              $p->node = $callArg;
              $p->nameNode = $callArg;
              $p->is_optional = false;
              $p->init_cnt = 1;
              $ctx->defineVariable($p->name, $p);
              $callArg->hasParamDesc = true;
              $callArg->ownParamDesc = $p;
              $callArg->paramDesc = $p;
              if ( (strlen($callArg->type_name)) == 0 ) {
                $callArg->type_name = $arg->type_name;
                $callArg->value_type = $arg->value_type;
              }
              $callArg->eval_type = $arg->value_type;
              $callArg->eval_type_name = $arg->type_name;
            }
            if ( $arg->hasFlag("ignore") ) {
              continue;
            }
            $ctx->setInExpr();
            $last_walked = $i + 1;
            $this->WalkNode($callArg, $ctx, $wr);
            $ctx->unsetInExpr();
          }
          if ( $expanding_node ) {
            for ( $i2 = 0; $i2 < count($callArgs->children); $i2++) {
              $caCh = $callArgs->children[$i2];
              if ( $i2 > $last_walked ) {
                $ctx->setInExpr();
                $this->WalkNode($caCh, $ctx, $wr);
                $ctx->unsetInExpr();
              }
            }
          }
          $all_matched = $match->matchArguments($args, $callArgs, $ctx, 1);
          if ( $all_matched ) {
            if ( $is_macro ) {
              $macroNode = $this->buildMacro($langOper, $callArgs, $ctx);
              $arg_len = count($callArgs->children);
              while ($arg_len > 0) {
                array_pop($callArgs->children );
                $arg_len = $arg_len - 1;
              }
              array_push($callArgs->children, $macroNode);
              $macroNode->parent = $callArgs;
              $this->WalkNode($macroNode, $ctx, $wr);
              $match->setRvBasedOn($nameNode, $callArgs);
              return true;
            }
            if ( $nameNode->hasFlag("moves") ) {
              $moves_opt = $nameNode->getFlag("moves");
              $moves = $moves_opt;
              $ann = $moves->vref_annotation;
              $from = $ann->getFirst();
              $to = $ann->getSecond();
              $cA = $callArgs->children[$from->int_value];
              $cA2 = $callArgs->children[$to->int_value];
              if ( $cA->hasParamDesc ) {
                $pp = $cA->paramDesc;
                $pp2 = $cA2->paramDesc;
                $pp->moveRefTo($callArgs, $pp2, $ctx);
              }
            }
            if ( $nameNode->hasFlag("returns") ) {
              $activeFn = $ctx->getCurrentMethod();
              if ( $activeFn->nameNode->type_name != "void" ) {
                if ( (count($callArgs->children)) < 2 ) {
                  $ctx->addError($callArgs, " missing return value !!!");
                } else {
                  $returnedValue = $callArgs->children[1];
                  if ( $match->doesMatch(($activeFn->nameNode), $returnedValue, $ctx) == false ) {
                    if ( $activeFn->nameNode->ifNoTypeSetToEvalTypeOf($returnedValue) ) {
                    } else {
                      $ctx->addError($returnedValue, "invalid return value type!!!");
                    }
                  }
                  $argNode = $activeFn->nameNode;
                  if ( $returnedValue->hasFlag("optional") ) {
                    if ( false == $argNode->hasFlag("optional") ) {
                      $ctx->addError($callArgs, "function return value optionality does not match, expected non-optional return value, optional given at " . $argNode->getCode());
                    }
                  }
                  if ( $argNode->hasFlag("optional") ) {
                    if ( false == $returnedValue->hasFlag("optional") ) {
                      $ctx->addError($callArgs, "function return value optionality does not match, expected optional return value " . $argNode->getCode());
                    }
                  }
                  $pp_1 = $returnedValue->paramDesc;
                  if ( (isset($pp_1)) ) {
                    $pp_1->moveRefTo($callArgs, $activeFn, $ctx);
                  }
                }
              }
              if ( (!isset($callArgs->parent)) ) {
                $ctx->addError($callArgs, "did not have parent");
                echo( "no parent => " . $callArgs->getCode() . "\n");
              }
              $callArgs->parent->didReturnAtIndex = array_search($callArgs, $callArgs->parent->children, true);
            }
            if ( $nameNode->hasFlag("returns") == false ) {
              $match->setRvBasedOn($nameNode, $callArgs);
            }
            if ( $has_eval_ctx ) {
              $callArgs->evalCtx = $ctx;
            }
            $nodeP = $callArgs->parent;
            if ( (isset($nodeP)) ) {
            } else {
            }
            /** unused:  $sig = $nameNode->buildTypeSignatureUsingMatch($match)   **/ ;
            $some_matched = true;
            $callArgs->has_operator = true;
            $callArgs->op_index = $main_index;
            for ( $arg_index = 0; $arg_index < count($args->children); $arg_index++) {
              $arg_1 = $args->children[$arg_index];
              if ( $arg_1->has_vref_annotation ) {
                $anns = $arg_1->vref_annotation;
                for ( $i_1 = 0; $i_1 < count($anns->children); $i_1++) {
                  $ann_1 = $anns->children[$i_1];
                  if ( $ann_1->vref == "mutates" ) {
                    $theArg = $callArgs->children[($arg_index + 1)];
                    if ( $theArg->hasParamDesc ) {
                      $theArg->paramDesc->set_cnt = $theArg->paramDesc->set_cnt + 1;
                    }
                  }
                }
              }
            }
            break;
          }
        }
      }
    }
    if ( $some_matched == false ) {
      $ctx->addError($callArgs, "stdMatch -> Could not match argument types for " . $callFnName->vref);
    }
    if ( $expects_error ) {
      $cnt_now = $ctx->getErrorCount();
      if ( $cnt_now == $err_cnt ) {
        $ctx->addParserError($callArgs, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " . $err_cnt) . " : ") . $cnt_now);
      }
    } else {
      $cnt_now_1 = $ctx->getErrorCount();
      if ( $cnt_now_1 > $err_cnt ) {
        $ctx->addParserError($callArgs, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " . $err_cnt) . " : ") . $cnt_now_1);
      }
    }
    return true;
  }
  
  function cmdImport( $node , $ctx , $wr ) {
    return false;
  }
  
  function getThisName() {
    return "this";
  }
  
  function WriteThisVar( $node , $ctx , $wr ) {
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->vref == "_" ) {
      return;
    }
    $rootObjName = $node->ns[0];
    if ( $ctx->isInStatic() ) {
      if ( $rootObjName == "this" ) {
        $ctx->addError($node, "This can not be used in static context");
      }
    }
    if ( $ctx->isEnumDefined($rootObjName) ) {
      $enumName = $node->ns[1];
      $ee = $ctx->getEnum($rootObjName);
      $e = $ee;
      if ( array_key_exists($enumName , $e->values ) ) {
        $node->eval_type = 11;
        $node->eval_type_name = $rootObjName;
        $node->int_value = ($e->values[$enumName]);
      } else {
        $ctx->addError($node, (("Undefined Enum " . $rootObjName) . ".") . $enumName);
        $node->eval_type = 1;
      }
      return;
    }
    if ( $node->vref == $this->getThisName() ) {
      $cd = $ctx->getCurrentClass();
      $thisClassDesc = $cd;
      $node->eval_type = 8;
      $node->eval_type_name = $thisClassDesc->name;
      $node->ref_type = 4;
      return;
    }
    if ( $ctx->isCapturing() ) {
      if ( $ctx->isVarDefined($rootObjName) ) {
        if ( $ctx->isLocalToCapture($rootObjName) == false ) {
          $captDef = $ctx->getVariableDef($rootObjName);
          $cd_1 = $ctx->getCurrentClass();
          array_push($cd_1->capturedLocals, $captDef);
          $captDef->is_captured = true;
          $ctx->addCapturedVariable($rootObjName);
        }
      }
    }
    if ( ($rootObjName == "this") || $ctx->isVarDefined($rootObjName) ) {
      /** unused:  $vDef2 = $ctx->getVariableDef($rootObjName)   **/ ;
      /** unused:  $activeFn = $ctx->getCurrentMethod()   **/ ;
      $vDef = $this->findParamDesc($node, $ctx, $wr);
      if ( (isset($vDef)) ) {
        $node->hasParamDesc = true;
        $node->ownParamDesc = $vDef;
        $node->paramDesc = $vDef;
        $vDef->ref_cnt = 1 + $vDef->ref_cnt;
        $vNameNode = $vDef->nameNode;
        if ( (isset($vNameNode)) ) {
          if ( $vNameNode->hasFlag("optional") ) {
            $node->setFlag("optional");
          }
          $node->eval_type = $vNameNode->typeNameAsType($ctx);
          $node->eval_type_name = $vNameNode->type_name;
          if ( $vNameNode->value_type == 6 ) {
            $node->eval_type = 6;
            $node->eval_array_type = $vNameNode->array_type;
          }
          if ( $vNameNode->value_type == 7 ) {
            $node->eval_type = 7;
            $node->eval_key_type = $vNameNode->key_type;
            $node->eval_array_type = $vNameNode->array_type;
          }
        }
      }
    } else {
      $class_or_this = $rootObjName == $this->getThisName();
      if ( $ctx->isDefinedClass($rootObjName) ) {
        $class_or_this = true;
        $node->eval_type = 23;
        $node->eval_type_name = $rootObjName;
      }
      if ( $ctx->hasTemplateNode($rootObjName) ) {
        $class_or_this = true;
      }
      if ( false == $class_or_this ) {
        $udesc = $ctx->getCurrentClass();
        $desc = $udesc;
        $ctx->addError($node, (("Undefined variable " . $rootObjName) . " in class ") . $desc->name);
      }
      return;
    }
  }
  
  function CreateClass( $node , $ctx , $wr ) {
  }
  
  function DefineVar( $node , $ctx , $wr ) {
  }
  
  function WriteComment( $node , $ctx , $wr ) {
  }
  
  function cmdLog( $node , $ctx , $wr ) {
  }
  
  function cmdDoc( $node , $ctx , $wr ) {
  }
  
  function cmdGitDoc( $node , $ctx , $wr ) {
  }
  
  function cmdNative( $node , $ctx , $wr ) {
  }
  
  function LangInit( $node , $ctx , $wr ) {
  }
  
  function getWriterLang() {
    return "_";
  }
  
  function StartCodeWriting( $node , $ctx , $wr ) {
  }
  
  function Constructor( $node , $ctx , $wr ) {
    $this->shouldHaveChildCnt(3, $node, $ctx, "Method expexts four arguments");
    /** unused:  $cn = $node->children[1]   **/ ;
    $fnBody = $node->children[2];
    $udesc = $ctx->getCurrentClass();
    $desc = $udesc;
    $m = $desc->constructor_fn;
    $subCtx = $m->fnCtx;
    $subCtx->is_function = true;
    $subCtx->currentMethod = $m;
    $subCtx->setInMethod();
    for ( $i = 0; $i < count($m->params); $i++) {
      $v = $m->params[$i];
      $subCtx->defineVariable($v->name, $v);
    }
    $this->WalkNodeChildren($fnBody, $subCtx, $wr);
    $subCtx->unsetInMethod();
    if ( $fnBody->didReturnAtIndex >= 0 ) {
      $ctx->addError($node, "constructor should not return any values!");
    }
    for ( $i_1 = 0; $i_1 < count($subCtx->localVarNames); $i_1++) {
      $n = $subCtx->localVarNames[$i_1];
      $p = $subCtx->localVariables[$n];
      if ( $p->set_cnt > 0 ) {
        $defNode = $p->node;
        $defNode->setFlag("mutable");
        $nNode = $p->nameNode;
        $nNode->setFlag("mutable");
      }
    }
  }
  
  function WriteScalarValue( $node , $ctx , $wr ) {
    $node->eval_type = $node->value_type;
    switch ($node->value_type ) { 
      case 2 : 
        $node->eval_type_name = "double";
        break;
      case 4 : 
        $node->eval_type_name = "string";
        break;
      case 3 : 
        $node->eval_type_name = "int";
        break;
      case 5 : 
        $node->eval_type_name = "boolean";
        break;
    }
  }
  
  function buildGenericClass( $tpl , $node , $ctx , $wr ) {
    $root = $ctx->getRoot();
    $cn = $tpl->getSecond();
    $newName = $node->getSecond();
    $tplArgs = $cn->vref_annotation;
    $givenArgs = $newName->vref_annotation;
    $sign = $cn->vref . $givenArgs->getCode();
    if ( array_key_exists($sign , $root->classSignatures ) ) {
      return;
    }
    echo( "could build generic class... " . $cn->vref . "\n");
    $match =  new RangerArgMatch();
    for ( $i = 0; $i < count($tplArgs->children); $i++) {
      $arg = $tplArgs->children[$i];
      $given = $givenArgs->children[$i];
      echo( ((" setting " . $arg->vref) . " => ") . $given->vref . "\n");
      if ( false == $match->add($arg->vref, $given->vref, $ctx) ) {
        echo( "set failed!" . "\n");
      } else {
        echo( "set OK" . "\n");
      }
      echo( " T == " . $match->getTypeName($arg->vref) . "\n");
    }
    echo( " T == " . $match->getTypeName("T") . "\n");
    $newClassNode = $tpl->rebuildWithType($match, false);
    echo( "build done" . "\n");
    echo( $newClassNode->getCode() . "\n");
    $sign_2 = $cn->vref . $givenArgs->getCode();
    echo( "signature ==> " . $sign_2 . "\n");
    $cName = $newClassNode->getSecond();
    $friendlyName = $root->createSignature($cn->vref, $sign_2);
    echo( "class common name => " . $friendlyName . "\n");
    $cName->vref = $friendlyName;
    $cName->has_vref_annotation = false;
    echo( $newClassNode->getCode() . "\n");
    $this->WalkCollectMethods($newClassNode, $ctx, $wr);
    $this->WalkNode($newClassNode, $root, $wr);
    echo( "the class collected the methods..." . "\n");
  }
  
  function cmdNew( $node , $ctx , $wr ) {
    if ( (count($node->children)) < 2 ) {
      $ctx->addError($node, "the new operator expects at lest two arguments");
      return;
    }
    if ( (count($node->children)) < 3 ) {
      $expr =  new CodeNode($node->code, $node->sp, $node->ep);
      $expr->expression = true;
      array_push($node->children, $expr);
    }
    $obj = $node->getSecond();
    $params = $node->getThird();
    $currC;
    $b_template = false;
    $expects_error = false;
    $err_cnt = $ctx->getErrorCount();
    if ( $node->hasBooleanProperty("error") ) {
      $expects_error = true;
    }
    if ( $ctx->hasTemplateNode($obj->vref) ) {
      echo( " ==> template class" . "\n");
      $b_template = true;
      $tpl = $ctx->findTemplateNode($obj->vref);
      if ( $obj->has_vref_annotation ) {
        echo( "generic class OK" . "\n");
        $this->buildGenericClass($tpl, $node, $ctx, $wr);
        $currC = $ctx->findClassWithSign($obj);
        if ( (isset($currC)) ) {
          echo( "@@ class was found " . $obj->vref . "\n");
        }
      } else {
        $ctx->addError($node, "generic class requires a type annotation");
        return;
      }
    }
    $this->WalkNode($obj, $ctx, $wr);
    for ( $i = 0; $i < count($params->children); $i++) {
      $arg = $params->children[$i];
      $ctx->setInExpr();
      $this->WalkNode($arg, $ctx, $wr);
      $ctx->unsetInExpr();
    }
    $node->eval_type = 8;
    $node->eval_type_name = $obj->vref;
    if ( $b_template == false ) {
      $currC = $ctx->findClass($obj->vref);
    }
    $node->hasNewOper = true;
    $node->clDesc = $currC;
    $fnDescr = $currC->constructor_fn;
    if ( (isset($fnDescr)) ) {
      for ( $i_1 = 0; $i_1 < count($fnDescr->params); $i_1++) {
        $param = $fnDescr->params[$i_1];
        $has_default = false;
        if ( $param->nameNode->hasFlag("default") ) {
          $has_default = true;
        }
        if ( (count($params->children)) <= $i_1 ) {
          if ( $has_default ) {
            continue;
          }
          $ctx->addError($node, "Missing arguments for function");
          $ctx->addError($param->nameNode, "To fix the previous error: Check original function declaration");
        }
        $argNode = $params->children[$i_1];
        if ( false == $this->areEqualTypes(($param->nameNode), $argNode, $ctx) ) {
          $ctx->addError($argNode, ("ERROR, invalid argument type for " . $currC->name) . " constructor ");
        }
        $pNode = $param->nameNode;
        if ( $pNode->hasFlag("optional") ) {
          if ( false == $argNode->hasFlag("optional") ) {
            $ctx->addError($node, "new parameter optionality does not match, expected optional parameter" . $argNode->getCode());
          }
        }
        if ( $argNode->hasFlag("optional") ) {
          if ( false == $pNode->hasFlag("optional") ) {
            $ctx->addError($node, "new parameter optionality does not match, expected non-optional, optional given" . $argNode->getCode());
          }
        }
      }
    }
    if ( $expects_error ) {
      $cnt_now = $ctx->getErrorCount();
      if ( $cnt_now == $err_cnt ) {
        $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " . $err_cnt) . " : ") . $cnt_now);
      }
    } else {
      $cnt_now_1 = $ctx->getErrorCount();
      if ( $cnt_now_1 > $err_cnt ) {
        $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " . $err_cnt) . " : ") . $cnt_now_1);
      }
    }
  }
  
  function transformParams( $list , $fnArgs , $ctx ) {
    $res = array();
    for ( $i = 0; $i < count($list); $i++) {
      $item = $list[$i];
      if ( $item->is_block_node ) {
        /** unused:  $newNode =  new CodeNode($item->code, $item->sp, $item->ep)   **/ ;
        $fnArg = $fnArgs[$i];
        $nn = $fnArg->nameNode;
        if ( (!isset($nn->expression_value)) ) {
          $ctx->addError($item, "Parameter is not lambda expression");
          break;
        }
        $fnDef = $nn->expression_value;
        $match =  new RangerArgMatch();
        $copyOf = $fnDef->rebuildWithType($match, false);
        $fc = $copyOf->children[0];
        $fc->vref = "fun";
        $itemCopy = $item->rebuildWithType($match, false);
        array_push($copyOf->children, $itemCopy);
        $cnt = count($item->children);
        while ($cnt > 0) {
          array_pop($item->children );
          $cnt = $cnt - 1;
        }
        for ( $i_1 = 0; $i_1 < count($copyOf->children); $i_1++) {
          $ch = $copyOf->children[$i_1];
          array_push($item->children, $ch);
        }
      }
      array_push($res, $item);
    }
    return $res;
  }
  
  function cmdLocalCall( $node , $ctx , $wr ) {
    $fnNode = $node->getFirst();
    $udesc = $ctx->getCurrentClass();
    $desc = $udesc;
    $expects_error = false;
    $err_cnt = $ctx->getErrorCount();
    if ( $node->hasBooleanProperty("error") ) {
      $expects_error = true;
    }
    if ( (count($fnNode->ns)) > 1 ) {
      $rootName = $fnNode->ns[0];
      $vDef2 = $ctx->getVariableDef($rootName);
      if ( (($rootName != "this") && ($vDef2->init_cnt == 0)) && ($vDef2->set_cnt == 0) ) {
        if ( ($vDef2->is_class_variable == false) && ($ctx->isDefinedClass($rootName) == false) ) {
          $ctx->addError($node, "Call to uninitialized object " . $rootName);
        }
      }
      $vFnDef = $this->findFunctionDesc($fnNode, $ctx, $wr);
      if ( (isset($vFnDef)) ) {
        $vFnDef->ref_cnt = $vFnDef->ref_cnt + 1;
        $subCtx = $ctx->fork();
        $node->hasFnCall = true;
        $node->fnDesc = $vFnDef;
        $p =  new RangerAppParamDesc();
        $p->name = $fnNode->vref;
        $p->value_type = $fnNode->value_type;
        $p->node = $fnNode;
        $p->nameNode = $fnNode;
        $p->varType = 10;
        $subCtx->defineVariable($p->name, $p);
        $this->WalkNode($fnNode, $subCtx, $wr);
        $callParams = $node->children[1];
        $nodeList = $this->transformParams($callParams->children, $vFnDef->params, $subCtx);
        for ( $i = 0; $i < count($nodeList); $i++) {
          $arg = $nodeList[$i];
          $ctx->setInExpr();
          $this->WalkNode($arg, $subCtx, $wr);
          $ctx->unsetInExpr();
          $fnArg = $vFnDef->params[$i];
          $callArgP = $arg->paramDesc;
          if ( (isset($callArgP)) ) {
            $callArgP->moveRefTo($node, $fnArg, $ctx);
          }
        }
        $cp_len = count($callParams->children);
        if ( $cp_len > (count($vFnDef->params)) ) {
          $lastCallParam = $callParams->children[($cp_len - 1)];
          $ctx->addError($lastCallParam, "Too many arguments for function");
          $ctx->addError($vFnDef->nameNode, "NOTE: To fix the previous error: Check original function declaration which was");
        }
        for ( $i_1 = 0; $i_1 < count($vFnDef->params); $i_1++) {
          $param = $vFnDef->params[$i_1];
          if ( (count($callParams->children)) <= $i_1 ) {
            if ( $param->nameNode->hasFlag("default") ) {
              continue;
            }
            $ctx->addError($node, "Missing arguments for function");
            $ctx->addError($param->nameNode, "NOTE: To fix the previous error: Check original function declaration which was");
            break;
          }
          $argNode = $callParams->children[$i_1];
          if ( false == $this->areEqualTypes(($param->nameNode), $argNode, $ctx) ) {
            $ctx->addError($argNode, "ERROR, invalid argument type for method " . $vFnDef->name);
          }
          $pNode = $param->nameNode;
          if ( $pNode->hasFlag("optional") ) {
            if ( false == $argNode->hasFlag("optional") ) {
              $ctx->addError($node, "function parameter optionality does not match, consider making parameter optional " . $argNode->getCode());
            }
          }
          if ( $argNode->hasFlag("optional") ) {
            if ( false == $pNode->hasFlag("optional") ) {
              $ctx->addError($node, "function parameter optionality does not match, consider unwrapping " . $argNode->getCode());
            }
          }
        }
        $nn = $vFnDef->nameNode;
        $node->eval_type = $nn->typeNameAsType($ctx);
        $node->eval_type_name = $nn->type_name;
        $node->eval_array_type = $nn->array_type;
        $node->eval_key_type = $nn->key_type;
        if ( $nn->hasFlag("optional") ) {
          $node->setFlag("optional");
        }
        if ( $expects_error ) {
          $cnt_now = $ctx->getErrorCount();
          if ( $cnt_now == $err_cnt ) {
            $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " . $err_cnt) . " : ") . $cnt_now);
          }
        } else {
          $cnt_now_1 = $ctx->getErrorCount();
          if ( $cnt_now_1 > $err_cnt ) {
            $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " . $err_cnt) . " : ") . $cnt_now_1);
          }
        }
        return true;
      } else {
        $ctx->addError($node, "Called Object or Property was not defined");
      }
    }
    if ( $desc->hasMethod($fnNode->vref) ) {
      $fnDescr = $desc->findMethod($fnNode->vref);
      $subCtx_1 = $ctx->fork();
      $node->hasFnCall = true;
      $node->fnDesc = $fnDescr;
      $p_1 =  new RangerAppParamDesc();
      $p_1->name = $fnNode->vref;
      $p_1->value_type = $fnNode->value_type;
      $p_1->node = $fnNode;
      $p_1->nameNode = $fnNode;
      $p_1->varType = 10;
      $subCtx_1->defineVariable($p_1->name, $p_1);
      $this->WriteThisVar($fnNode, $subCtx_1, $wr);
      $this->WalkNode($fnNode, $subCtx_1, $wr);
      for ( $i_2 = 0; $i_2 < count($node->children); $i_2++) {
        $arg_1 = $node->children[$i_2];
        if ( $i_2 < 1 ) {
          continue;
        }
        $ctx->setInExpr();
        $this->WalkNode($arg_1, $subCtx_1, $wr);
        $ctx->unsetInExpr();
      }
      for ( $i_3 = 0; $i_3 < count($fnDescr->params); $i_3++) {
        $param_1 = $fnDescr->params[$i_3];
        if ( (count($node->children)) <= ($i_3 + 1) ) {
          $ctx->addError($node, "Argument was not defined");
          break;
        }
        $argNode_1 = $node->children[($i_3 + 1)];
        if ( false == $this->areEqualTypes(($param_1->nameNode), $argNode_1, $ctx) ) {
          $ctx->addError($argNode_1, (("ERROR, invalid argument type for " . $desc->name) . " method ") . $fnDescr->name);
        }
      }
      $nn_1 = $fnDescr->nameNode;
      $nn_1->defineNodeTypeTo($node, $ctx);
      if ( $expects_error ) {
        $cnt_now_2 = $ctx->getErrorCount();
        if ( $cnt_now_2 == $err_cnt ) {
          $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " . $err_cnt) . " : ") . $cnt_now_2);
        }
      } else {
        $cnt_now_3 = $ctx->getErrorCount();
        if ( $cnt_now_3 > $err_cnt ) {
          $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " . $err_cnt) . " : ") . $cnt_now_3);
        }
      }
      return true;
    }
    if ( $ctx->isVarDefined($fnNode->vref) ) {
      $d = $ctx->getVariableDef($fnNode->vref);
      $d->ref_cnt = 1 + $d->ref_cnt;
      if ( $d->nameNode->value_type == 15 ) {
        /** unused:  $lambdaDefArgs = $d->nameNode->expression_value->children[1]   **/ ;
        $callParams_1 = $node->children[1];
        for ( $i_4 = 0; $i_4 < count($callParams_1->children); $i_4++) {
          $arg_2 = $callParams_1->children[$i_4];
          $ctx->setInExpr();
          $this->WalkNode($arg_2, $ctx, $wr);
          $ctx->unsetInExpr();
        }
        $lambdaDef = $d->nameNode->expression_value->children[0];
        /** unused:  $lambdaArgs = $d->nameNode->expression_value->children[1]   **/ ;
        $node->has_lambda_call = true;
        $node->eval_type = $lambdaDef->typeNameAsType($ctx);
        $node->eval_type_name = $lambdaDef->type_name;
        $node->eval_array_type = $lambdaDef->array_type;
        $node->eval_key_type = $lambdaDef->key_type;
        return true;
      }
    }
    $ctx->addError($node, (("ERROR, could not find class " . $desc->name) . " method ") . $fnNode->vref);
    $ctx->addError($node, "definition : " . $node->getCode());
    if ( $expects_error ) {
      $cnt_now_4 = $ctx->getErrorCount();
      if ( $cnt_now_4 == $err_cnt ) {
        $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: expected generated error, err counts : " . $err_cnt) . " : ") . $cnt_now_4);
      }
    } else {
      $cnt_now_5 = $ctx->getErrorCount();
      if ( $cnt_now_5 > $err_cnt ) {
        $ctx->addParserError($node, (("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " . $err_cnt) . " : ") . $cnt_now_5);
      }
    }
    return false;
  }
  
  function cmdReturn( $node , $ctx , $wr ) {
    $node->has_operator = true;
    $node->op_index = 5;
    echo( "cmdReturn" . "\n");
    if ( (count($node->children)) > 1 ) {
      $fc = $node->getSecond();
      if ( $fc->vref == "_" ) {
      } else {
        $ctx->setInExpr();
        $this->WalkNode($fc, $ctx, $wr);
        $ctx->unsetInExpr();
        /** unused:  $activeFn = $ctx->getCurrentMethod()   **/ ;
        if ( $fc->hasParamDesc ) {
          $fc->paramDesc->return_cnt = 1 + $fc->paramDesc->return_cnt;
          $fc->paramDesc->ref_cnt = 1 + $fc->paramDesc->ref_cnt;
        }
        $currFn = $ctx->getCurrentMethod();
        if ( $fc->hasParamDesc ) {
          echo( "cmdReturn move-->" . "\n");
          $pp = $fc->paramDesc;
          $pp->moveRefTo($node, $currFn, $ctx);
        } else {
          echo( "cmdReturn had no param desc" . "\n");
        }
      }
    }
  }
  
  function cmdAssign( $node , $ctx , $wr ) {
    $wr->newline();
    $n1 = $node->getSecond();
    $n2 = $node->getThird();
    $this->WalkNode($n1, $ctx, $wr);
    $ctx->setInExpr();
    $this->WalkNode($n2, $ctx, $wr);
    $ctx->unsetInExpr();
    if ( $n1->hasParamDesc ) {
      $n1->paramDesc->ref_cnt = $n1->paramDesc->ref_cnt + 1;
      $n1->paramDesc->set_cnt = $n1->paramDesc->set_cnt + 1;
    }
    if ( $n2->hasParamDesc ) {
      $n2->paramDesc->ref_cnt = $n2->paramDesc->ref_cnt + 1;
    }
    if ( $n2->hasFlag("optional") ) {
      if ( false == $n1->hasFlag("optional") ) {
        $ctx->addError($node, "Can not assign optional to non-optional type");
      }
    }
    $this->stdParamMatch($node, $ctx, $wr);
  }
  
  function EnterTemplateClass( $node , $ctx , $wr ) {
  }
  
  function EnterClass( $node , $ctx , $wr ) {
    if ( (count($node->children)) != 3 ) {
      $ctx->addError($node, "Invalid class declaration");
      return;
    }
    if ( $node->hasBooleanProperty("trait") ) {
      return;
    }
    $cn = $node->children[1];
    $cBody = $node->children[2];
    $desc = $ctx->findClass($cn->vref);
    if ( $cn->has_vref_annotation ) {
      echo( "--> generic class, not processed" . "\n");
      return;
    }
    $subCtx = $desc->ctx;
    $subCtx->setCurrentClass($desc);
    $subCtx->class_level_context = true;
    for ( $i = 0; $i < count($desc->variables); $i++) {
      $p = $desc->variables[$i];
      $vNode = $p->node;
      if ( (count($vNode->children)) > 2 ) {
        $value = $vNode->children[2];
        $ctx->setInExpr();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      }
      $p->is_class_variable = true;
      $p->nameNode->eval_type = $p->nameNode->typeNameAsType($ctx);
      $p->nameNode->eval_type_name = $p->nameNode->type_name;
    }
    for ( $i_1 = 0; $i_1 < count($cBody->children); $i_1++) {
      $fNode = $cBody->children[$i_1];
      if ( $fNode->isFirstVref("fn") || $fNode->isFirstVref("Constructor") ) {
        $this->WalkNode($fNode, $subCtx, $wr);
      }
    }
    for ( $i_2 = 0; $i_2 < count($cBody->children); $i_2++) {
      $fNode_1 = $cBody->children[$i_2];
      if ( $fNode_1->isFirstVref("fn") || $fNode_1->isFirstVref("PublicMethod") ) {
        $this->WalkNode($fNode_1, $subCtx, $wr);
      }
    }
    $staticCtx = $ctx->fork();
    $staticCtx->setCurrentClass($desc);
    for ( $i_3 = 0; $i_3 < count($cBody->children); $i_3++) {
      $fNode_2 = $cBody->children[$i_3];
      if ( $fNode_2->isFirstVref("sfn") || $fNode_2->isFirstVref("StaticMethod") ) {
        $this->WalkNode($fNode_2, $staticCtx, $wr);
      }
    }
    $node->hasClassDescription = true;
    $node->clDesc = $desc;
    $desc->classNode = $node;
  }
  
  function EnterMethod( $node , $ctx , $wr ) {
    $this->shouldHaveChildCnt(4, $node, $ctx, "Method expexts four arguments");
    $cn = $node->children[1];
    $fnBody = $node->children[3];
    $udesc = $ctx->getCurrentClass();
    $desc = $udesc;
    $um = $desc->findMethod($cn->vref);
    $m = $um;
    $subCtx = $m->fnCtx;
    $subCtx->function_level_context = true;
    $subCtx->currentMethod = $m;
    for ( $i = 0; $i < count($m->params); $i++) {
      $v = $m->params[$i];
      $v->nameNode->eval_type = $v->nameNode->typeNameAsType($subCtx);
      $v->nameNode->eval_type_name = $v->nameNode->type_name;
      $ctx->hadValidType($v->nameNode);
    }
    $subCtx->setInMethod();
    $this->WalkNodeChildren($fnBody, $subCtx, $wr);
    $subCtx->unsetInMethod();
    if ( $fnBody->didReturnAtIndex == -1 ) {
      if ( $cn->type_name != "void" ) {
        $ctx->addError($node, "Function does not return any values!");
      }
    }
    for ( $i_1 = 0; $i_1 < count($subCtx->localVarNames); $i_1++) {
      $n = $subCtx->localVarNames[$i_1];
      $p = $subCtx->localVariables[$n];
      if ( $p->set_cnt > 0 ) {
        $defNode = $p->node;
        $defNode->setFlag("mutable");
        $nNode = $p->nameNode;
        $nNode->setFlag("mutable");
      }
    }
  }
  
  function EnterStaticMethod( $node , $ctx , $wr ) {
    $this->shouldHaveChildCnt(4, $node, $ctx, "Method expexts four arguments");
    $cn = $node->children[1];
    $fnBody = $node->children[3];
    $udesc = $ctx->getCurrentClass();
    $desc = $udesc;
    $subCtx = $ctx->fork();
    $subCtx->is_function = true;
    $um = $desc->findStaticMethod($cn->vref);
    $m = $um;
    $subCtx->currentMethod = $m;
    $subCtx->in_static_method = true;
    $m->fnCtx = $subCtx;
    if ( $cn->hasFlag("weak") ) {
      $m->changeStrength(0, 1, $node);
    } else {
      $m->changeStrength(1, 1, $node);
    }
    $subCtx->setInMethod();
    for ( $i = 0; $i < count($m->params); $i++) {
      $v = $m->params[$i];
      $subCtx->defineVariable($v->name, $v);
      $v->nameNode->eval_type = $v->nameNode->typeNameAsType($ctx);
      $v->nameNode->eval_type_name = $v->nameNode->type_name;
    }
    $this->WalkNodeChildren($fnBody, $subCtx, $wr);
    $subCtx->unsetInMethod();
    $subCtx->in_static_method = false;
    $subCtx->function_level_context = true;
    if ( $fnBody->didReturnAtIndex == -1 ) {
      if ( $cn->type_name != "void" ) {
        $ctx->addError($node, "Function does not return any values!");
      }
    }
    for ( $i_1 = 0; $i_1 < count($subCtx->localVarNames); $i_1++) {
      $n = $subCtx->localVarNames[$i_1];
      $p = $subCtx->localVariables[$n];
      if ( $p->set_cnt > 0 ) {
        $defNode = $p->node;
        $defNode->setFlag("mutable");
        $nNode = $p->nameNode;
        $nNode->setFlag("mutable");
      }
    }
  }
  
  function EnterLambdaMethod( $node , $ctx , $wr ) {
    $args = $node->children[1];
    $body = $node->children[2];
    $subCtx = $ctx->fork();
    $subCtx->is_capturing = true;
    $cn = $node->children[0];
    $m =  new RangerAppFunctionDesc();
    $m->name = "lambda";
    $m->node = $node;
    $m->nameNode = $node->children[0];
    $subCtx->is_function = true;
    $subCtx->currentMethod = $m;
    if ( $cn->hasFlag("weak") ) {
      $m->changeStrength(0, 1, $node);
    } else {
      $m->changeStrength(1, 1, $node);
    }
    $m->fnBody = $node->children[2];
    for ( $ii = 0; $ii < count($args->children); $ii++) {
      $arg = $args->children[$ii];
      $p2 =  new RangerAppParamDesc();
      $p2->name = $arg->vref;
      $p2->value_type = $arg->value_type;
      $p2->node = $arg;
      $p2->nameNode = $arg;
      $p2->init_cnt = 1;
      $p2->refType = 1;
      $p2->initRefType = 1;
      if ( $args->hasBooleanProperty("strong") ) {
        $p2->refType = 2;
        $p2->initRefType = 2;
      }
      $p2->varType = 4;
      array_push($m->params, $p2);
      $arg->hasParamDesc = true;
      $arg->paramDesc = $p2;
      $arg->eval_type = $arg->value_type;
      $arg->eval_type_name = $arg->type_name;
      if ( $arg->hasFlag("strong") ) {
        $p2->changeStrength(1, 1, $p2->nameNode);
      } else {
        $arg->setFlag("lives");
        $p2->changeStrength(0, 1, $p2->nameNode);
      }
      $subCtx->defineVariable($p2->name, $p2);
    }
    /** unused:  $cnt = count($body->children)   **/ ;
    for ( $i = 0; $i < count($body->children); $i++) {
      $item = $body->children[$i];
      $this->WalkNode($item, $subCtx, $wr);
      if ( $i == ((count($body->children)) - 1) ) {
        if ( (count($item->children)) > 0 ) {
          $fc = $item->getFirst();
          if ( $fc->vref != "return" ) {
            $cn->type_name = "void";
          }
        }
      }
    }
    $node->has_lambda = true;
    $node->lambda_ctx = $subCtx;
    $node->eval_type = 15;
    $node->eval_function = $node;
  }
  
  function EnterVarDef( $node , $ctx , $wr ) {
    if ( $ctx->isInMethod() ) {
      if ( (count($node->children)) > 3 ) {
        $ctx->addError($node, "invalid variable definition");
        return;
      }
      if ( (count($node->children)) < 2 ) {
        $ctx->addError($node, "invalid variable definition");
        return;
      }
      $cn = $node->children[1];
      $p =  new RangerAppParamDesc();
      $defaultArg;
      if ( (count($node->children)) == 2 ) {
        if ( ($cn->value_type != 6) && ($cn->value_type != 7) ) {
          $cn->setFlag("optional");
        }
      }
      if ( (strlen($cn->vref)) == 0 ) {
        $ctx->addError($node, "invalid variable definition");
      }
      if ( $cn->hasFlag("weak") ) {
        $p->changeStrength(0, 1, $node);
      } else {
        $p->changeStrength(1, 1, $node);
      }
      $node->hasVarDef = true;
      if ( $cn->value_type == 15 ) {
        echo( "Expression node..." . "\n");
      }
      if ( (count($node->children)) > 2 ) {
        $p->init_cnt = 1;
        $p->def_value = $node->children[2];
        $p->is_optional = false;
        $defaultArg = $node->children[2];
        $ctx->setInExpr();
        $this->WalkNode($defaultArg, $ctx, $wr);
        $ctx->unsetInExpr();
        if ( $defaultArg->hasFlag("optional") ) {
          $cn->setFlag("optional");
        }
        if ( $defaultArg->eval_type == 6 ) {
          $node->op_index = 1;
        }
        if ( $cn->value_type == 11 ) {
          $cn->eval_type_name = $defaultArg->ns[0];
        }
        if ( $cn->value_type == 12 ) {
          if ( ($defaultArg->eval_type != 3) && ($defaultArg->eval_type != 12) ) {
            $ctx->addError($defaultArg, "Char should be assigned char or integer value --> " . $defaultArg->getCode());
          } else {
            $defaultArg->eval_type = 12;
          }
        }
      } else {
        if ( (($cn->value_type != 7) && ($cn->value_type != 6)) && (false == $cn->hasFlag("optional")) ) {
          $cn->setFlag("optional");
        }
      }
      if ( (count($node->children)) > 2 ) {
        if ( ((strlen($cn->type_name)) == 0) && ((strlen($cn->array_type)) == 0) ) {
          $nodeValue = $node->children[2];
          if ( $nodeValue->eval_type == 15 ) {
            if ( (!isset($node->expression_value)) ) {
              $copyOf = $nodeValue->rebuildWithType( new RangerArgMatch(), false);
              array_pop($copyOf->children );
              $cn->expression_value = $copyOf;
            }
          }
          $cn->value_type = $nodeValue->eval_type;
          $cn->type_name = $nodeValue->eval_type_name;
          $cn->array_type = $nodeValue->eval_array_type;
          $cn->key_type = $nodeValue->eval_key_type;
        }
      }
      $ctx->hadValidType($cn);
      $cn->defineNodeTypeTo($cn, $ctx);
      $p->name = $cn->vref;
      if ( $p->value_type == 0 ) {
        if ( (0 == (strlen($cn->type_name))) && ((isset($defaultArg))) ) {
          $p->value_type = $defaultArg->eval_type;
          $cn->type_name = $defaultArg->eval_type_name;
          $cn->eval_type_name = $defaultArg->eval_type_name;
          $cn->value_type = $defaultArg->eval_type;
        }
      } else {
        $p->value_type = $cn->value_type;
      }
      $p->node = $node;
      $p->nameNode = $cn;
      $p->varType = 5;
      if ( $cn->has_vref_annotation ) {
        $ctx->log($node, "ann", "At a variable -> Found has_vref_annotation annotated reference ");
        $ann = $cn->vref_annotation;
        if ( (count($ann->children)) > 0 ) {
          $fc = $ann->children[0];
          $ctx->log($node, "ann", (("value of first annotation " . $fc->vref) . " and variable name ") . $cn->vref);
        }
      }
      if ( $cn->has_type_annotation ) {
        $ctx->log($node, "ann", "At a variable -> Found annotated reference ");
        $ann_1 = $cn->type_annotation;
        if ( (count($ann_1->children)) > 0 ) {
          $fc_1 = $ann_1->children[0];
          $ctx->log($node, "ann", (("value of first annotation " . $fc_1->vref) . " and variable name ") . $cn->vref);
        }
      }
      $cn->hasParamDesc = true;
      $cn->ownParamDesc = $p;
      $cn->paramDesc = $p;
      $node->hasParamDesc = true;
      $node->paramDesc = $p;
      $cn->eval_type = $cn->typeNameAsType($ctx);
      $cn->eval_type_name = $cn->type_name;
      if ( (count($node->children)) > 2 ) {
        if ( $cn->eval_type != $defaultArg->eval_type ) {
          if ( (($cn->eval_type == 12) && ($defaultArg->eval_type == 3)) || (($cn->eval_type == 3) && ($defaultArg->eval_type == 12)) ) {
          } else {
            $ctx->addError($node, (("Variable was assigned an incompatible type. Types were " . $cn->eval_type) . " vs ") . $defaultArg->eval_type);
          }
        }
      } else {
        $p->is_optional = true;
      }
      $ctx->defineVariable($p->name, $p);
      $this->DefineVar($node, $ctx, $wr);
      if ( (count($node->children)) > 2 ) {
        $this->shouldBeEqualTypes($cn, $p->def_value, $ctx, "Variable was assigned an incompatible type.");
      }
    } else {
      $cn_1 = $node->children[1];
      $cn_1->eval_type = $cn_1->typeNameAsType($ctx);
      $cn_1->eval_type_name = $cn_1->type_name;
      $this->DefineVar($node, $ctx, $wr);
      if ( (count($node->children)) > 2 ) {
        $this->shouldBeEqualTypes($node->children[1], $node->children[2], $ctx, "Variable was assigned an incompatible type.");
      }
    }
  }
  
  function WalkNodeChildren( $node , $ctx , $wr ) {
    if ( $node->hasStringProperty("todo") ) {
      $ctx->addTodo($node, $node->getStringProperty("todo"));
    }
    if ( $node->expression ) {
      for ( $i = 0; $i < count($node->children); $i++) {
        $item = $node->children[$i];
        $item->parent = $node;
        $this->WalkNode($item, $ctx, $wr);
        $node->copyEvalResFrom($item);
      }
    }
  }
  
  function matchNode( $node , $ctx , $wr ) {
    if ( 0 == (count($node->children)) ) {
      return false;
    }
    $fc = $node->getFirst();
    $this->stdCommands = $ctx->getStdCommands();
    for ( $i = 0; $i < count($this->stdCommands->children); $i++) {
      $cmd = $this->stdCommands->children[$i];
      $cmdName = $cmd->getFirst();
      if ( $cmdName->vref == $fc->vref ) {
        $this->stdParamMatch($node, $ctx, $wr);
        if ( (isset($node->parent)) ) {
          $node->parent->copyEvalResFrom($node);
        }
        return true;
      }
    }
    return false;
  }
  
  function StartWalk( $node , $ctx , $wr ) {
    $this->WalkNode($node, $ctx, $wr);
    for ( $i = 0; $i < count($this->walkAlso); $i++) {
      $ch = $this->walkAlso[$i];
      $this->WalkNode($ch, $ctx, $wr);
    }
  }
  
  function WalkNode( $node , $ctx , $wr ) {
    /** unused:  $line_index = $node->getLine()   **/ ;
    if ( $node->flow_done ) {
      return true;
    }
    $node->flow_done = true;
    $this->lastProcessedNode = $node;
    if ( $node->hasStringProperty("todo") ) {
      $ctx->addTodo($node, $node->getStringProperty("todo"));
    }
    if ( $node->isPrimitive() ) {
      if ( $ctx->expressionLevel() == 0 ) {
        $ctx->addError($node, "Primitive element at top level!");
      }
      $this->WriteScalarValue($node, $ctx, $wr);
      return true;
    }
    if ( $node->value_type == 9 ) {
      $this->WriteVRef($node, $ctx, $wr);
      return true;
    }
    if ( $node->value_type == 10 ) {
      $this->WriteComment($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("fun") ) {
      $this->EnterLambdaMethod($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("fn") ) {
      if ( $ctx->isInMethod() ) {
        $this->EnterLambdaMethod($node, $ctx, $wr);
        return true;
      }
    }
    if ( $node->isFirstVref("Extends") ) {
      return true;
    }
    if ( $node->isFirstVref("extension") ) {
      $this->EnterClass($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("operators") ) {
      return true;
    }
    if ( $node->isFirstVref("systemclass") ) {
      return true;
    }
    if ( $node->isFirstVref("systemunion") ) {
      return true;
    }
    if ( $node->isFirstVref("Import") ) {
      $this->cmdImport($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("def") ) {
      $this->EnterVarDef($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("let") ) {
      $this->EnterVarDef($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("TemplateClass") ) {
      $this->EnterTemplateClass($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("CreateClass") ) {
      $this->EnterClass($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("class") ) {
      $this->EnterClass($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("trait") ) {
      return true;
    }
    if ( $node->isFirstVref("PublicMethod") ) {
      $this->EnterMethod($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("StaticMethod") ) {
      $this->EnterStaticMethod($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("fn") ) {
      $this->EnterMethod($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("sfn") ) {
      $this->EnterStaticMethod($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("=") ) {
      $this->cmdAssign($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("Constructor") ) {
      $this->Constructor($node, $ctx, $wr);
      return true;
    }
    if ( $node->isFirstVref("new") ) {
      $this->cmdNew($node, $ctx, $wr);
      return true;
    }
    if ( $this->matchNode($node, $ctx, $wr) ) {
      return true;
    }
    if ( (count($node->children)) > 0 ) {
      $fc = $node->children[0];
      if ( $fc->value_type == 9 ) {
        $was_called = true;
        switch ($fc->vref ) { 
          case "Enum" : 
            $this->cmdEnum($node, $ctx, $wr);
            break;
          default: 
            $was_called = false;
            break;
        }
        if ( $was_called ) {
          return true;
        }
        if ( (count($node->children)) > 1 ) {
          if ( $this->cmdLocalCall($node, $ctx, $wr) ) {
            return true;
          }
        }
      }
    }
    if ( $node->expression ) {
      for ( $i = 0; $i < count($node->children); $i++) {
        $item = $node->children[$i];
        $item->parent = $node;
        $this->WalkNode($item, $ctx, $wr);
        $node->copyEvalResFrom($item);
      }
      return true;
    }
    $ctx->addError($node, "Could not understand this part");
    return true;
  }
  
  function mergeImports( $node , $ctx , $wr ) {
    if ( $node->isFirstVref("Import") ) {
      $fNameNode = $node->children[1];
      $import_file = $fNameNode->string_value;
      if ( array_key_exists($import_file , $ctx->already_imported ) ) {
        return;
      }
      $ctx->already_imported[$import_file] = true;
      $c = file_get_contents("." . "/" . $import_file) ;
      $code =  new SourceCode($c);
      $code->filename = $import_file;
      $parser =  new RangerLispParser($code);
      $parser->parse();
      $node->expression = true;
      $node->vref = "";
      array_pop($node->children );
      array_pop($node->children );
      $rn = $parser->rootNode;
      $this->mergeImports($rn, $ctx, $wr);
      array_push($node->children, $rn);
    } else {
      for ( $i = 0; $i < count($node->children); $i++) {
        $item = $node->children[$i];
        $this->mergeImports($item, $ctx, $wr);
      }
    }
  }
  
  function CollectMethods( $node , $ctx , $wr ) {
    $this->WalkCollectMethods($node, $ctx, $wr);
    for ( $i = 0; $i < count($this->classesWithTraits); $i++) {
      $point = $this->classesWithTraits[$i];
      $cl = $point->class_def;
      /** unused:  $joinPoint = $point->node   **/ ;
      $traitClassDef = $point->node->children[1];
      $name = $traitClassDef->vref;
      $t = $ctx->findClass($name);
      if ( (count($t->extends_classes)) > 0 ) {
        $ctx->addError($point->node, ("Can not join class " . $name) . " because it is inherited. Currently on base classes can be used as traits.");
        continue;
      }
      if ( $t->has_constructor ) {
        $ctx->addError($point->node, ("Can not join class " . $name) . " because it has a constructor function");
      } else {
        $origBody = $cl->node->children[2];
        $match =  new RangerArgMatch();
        $params = $t->node->getExpressionProperty("params");
        $initParams = $point->node->getExpressionProperty("params");
        if ( ((isset($params))) && ((isset($initParams))) ) {
          for ( $i_1 = 0; $i_1 < count($params->children); $i_1++) {
            $typeName = $params->children[$i_1];
            $pArg = $initParams->children[$i_1];
            $match->add($typeName->vref, $pArg->vref, $ctx);
          }
        } else {
          $match->add("T", $cl->name, $ctx);
        }
        $ctx->setCurrentClass($cl);
        $traitClass = $ctx->findClass($traitClassDef->vref);
        for ( $i_2 = 0; $i_2 < count($traitClass->variables); $i_2++) {
          $pvar = $traitClass->variables[$i_2];
          $ccopy = $pvar->node->rebuildWithType($match, true);
          $this->WalkCollectMethods($ccopy, $ctx, $wr);
          array_push($origBody->children, $ccopy);
        }
        for ( $i_3 = 0; $i_3 < count($traitClass->defined_variants); $i_3++) {
          $fnVar = $traitClass->defined_variants[$i_3];
          $mVs = $traitClass->method_variants[$fnVar];
          for ( $i_4 = 0; $i_4 < count($mVs->variants); $i_4++) {
            $variant = $mVs->variants[$i_4];
            $ccopy_1 = $variant->node->rebuildWithType($match, true);
            $this->WalkCollectMethods($ccopy_1, $ctx, $wr);
            array_push($origBody->children, $ccopy_1);
          }
        }
      }
    }
    for ( $i_5 = 0; $i_5 < count($this->serializedClasses); $i_5++) {
      $cl_1 = $this->serializedClasses[$i_5];
      $cl_1->is_serialized = true;
      $ser =  new RangerSerializeClass();
      $extWr =  new CodeWriter();
      $ser->createJSONSerializerFn($cl_1, $cl_1->ctx, $extWr);
      $theCode = $extWr->getCode();
      $code =  new SourceCode($theCode);
      $code->filename = "extension " . $ctx->currentClass->name;
      $parser =  new RangerLispParser($code);
      $parser->parse();
      $rn = $parser->rootNode;
      $this->WalkCollectMethods($rn, $cl_1->ctx, $wr);
      array_push($this->walkAlso, $rn);
    }
  }
  
  function WalkCollectMethods( $node , $ctx , $wr ) {
    $find_more = true;
    if ( $node->isFirstVref("systemunion") ) {
      $nameNode = $node->getSecond();
      $instances = $node->getThird();
      $new_class =  new RangerAppClassDesc();
      $new_class->name = $nameNode->vref;
      $new_class->nameNode = $nameNode;
      $ctx->addClass($nameNode->vref, $new_class);
      $new_class->is_system_union = true;
      for ( $i = 0; $i < count($instances->children); $i++) {
        $ch = $instances->children[$i];
        array_push($new_class->is_union_of, $ch->vref);
      }
      $nameNode->clDesc = $new_class;
      return;
    }
    if ( $node->isFirstVref("systemclass") ) {
      $nameNode_1 = $node->getSecond();
      $instances_1 = $node->getThird();
      $new_class_1 =  new RangerAppClassDesc();
      $new_class_1->name = $nameNode_1->vref;
      $new_class_1->nameNode = $nameNode_1;
      $ctx->addClass($nameNode_1->vref, $new_class_1);
      $new_class_1->is_system = true;
      for ( $i_1 = 0; $i_1 < count($instances_1->children); $i_1++) {
        $ch_1 = $instances_1->children[$i_1];
        $langName = $ch_1->getFirst();
        $langClassName = $ch_1->getSecond();
        $new_class_1->systemNames[$langName->vref] = $langClassName->vref;
      }
      $nameNode_1->is_system_class = true;
      $nameNode_1->clDesc = $new_class_1;
      return;
    }
    if ( $node->isFirstVref("Extends") ) {
      $extList = $node->children[1];
      $currC = $ctx->currentClass;
      for ( $ii = 0; $ii < count($extList->children); $ii++) {
        $ee = $extList->children[$ii];
        $currC->addParentClass($ee->vref);
        $ParentClass = $ctx->findClass($ee->vref);
        $ParentClass->is_inherited = true;
      }
    }
    if ( $node->isFirstVref("Constructor") ) {
      $currC_1 = $ctx->currentClass;
      $subCtx = $currC_1->ctx->fork();
      $currC_1->has_constructor = true;
      $currC_1->constructor_node = $node;
      $m =  new RangerAppFunctionDesc();
      $m->name = "Constructor";
      $m->node = $node;
      $m->nameNode = $node->children[0];
      $m->fnBody = $node->children[2];
      $m->fnCtx = $subCtx;
      $args = $node->children[1];
      for ( $ii_1 = 0; $ii_1 < count($args->children); $ii_1++) {
        $arg = $args->children[$ii_1];
        $p =  new RangerAppParamDesc();
        $p->name = $arg->vref;
        $p->value_type = $arg->value_type;
        $p->node = $arg;
        $p->nameNode = $arg;
        $p->refType = 1;
        $p->varType = 4;
        array_push($m->params, $p);
        $arg->hasParamDesc = true;
        $arg->paramDesc = $p;
        $arg->eval_type = $arg->value_type;
        $arg->eval_type_name = $arg->type_name;
        $subCtx->defineVariable($p->name, $p);
      }
      $currC_1->constructor_fn = $m;
      $find_more = false;
    }
    if ( $node->isFirstVref("trait") ) {
      $s = $node->getVRefAt(1);
      $classNameNode = $node->getSecond();
      $new_class_2 =  new RangerAppClassDesc();
      $new_class_2->name = $s;
      $subCtx_1 = $ctx->fork();
      $ctx->setCurrentClass($new_class_2);
      $subCtx_1->setCurrentClass($new_class_2);
      $new_class_2->ctx = $subCtx_1;
      $new_class_2->nameNode = $classNameNode;
      $ctx->addClass($s, $new_class_2);
      $new_class_2->classNode = $node;
      $new_class_2->node = $node;
      $new_class_2->is_trait = true;
    }
    if ( $node->isFirstVref("CreateClass") || $node->isFirstVref("class") ) {
      $s_1 = $node->getVRefAt(1);
      $classNameNode_1 = $node->getSecond();
      if ( $classNameNode_1->has_vref_annotation ) {
        echo( "%% vref_annotation" . "\n");
        $ann = $classNameNode_1->vref_annotation;
        echo( ($classNameNode_1->vref . " : ") . $ann->getCode() . "\n");
        $ctx->addTemplateClass($classNameNode_1->vref, $node);
        $find_more = false;
      } else {
        $new_class_3 =  new RangerAppClassDesc();
        $new_class_3->name = $s_1;
        $subCtx_2 = $ctx->fork();
        $ctx->setCurrentClass($new_class_3);
        $subCtx_2->setCurrentClass($new_class_3);
        $new_class_3->ctx = $subCtx_2;
        $new_class_3->nameNode = $classNameNode_1;
        $ctx->addClass($s_1, $new_class_3);
        $new_class_3->classNode = $node;
        $new_class_3->node = $node;
        if ( $node->hasBooleanProperty("trait") ) {
          $new_class_3->is_trait = true;
        }
      }
    }
    if ( $node->isFirstVref("TemplateClass") ) {
      $s_2 = $node->getVRefAt(1);
      $ctx->addTemplateClass($s_2, $node);
      $find_more = false;
    }
    if ( $node->isFirstVref("Extends") ) {
      $list = $node->children[1];
      for ( $i_2 = 0; $i_2 < count($list->children); $i_2++) {
        $cname = $list->children[$i_2];
        $extC = $ctx->findClass($cname->vref);
        for ( $i_3 = 0; $i_3 < count($extC->variables); $i_3++) {
          $vv = $extC->variables[$i_3];
          $currC_2 = $ctx->currentClass;
          $subCtx_3 = $currC_2->ctx;
          $subCtx_3->defineVariable($vv->name, $vv);
        }
      }
      $find_more = false;
    }
    if ( $node->isFirstVref("def") || $node->isFirstVref("let") ) {
      $s_3 = $node->getVRefAt(1);
      $vDef = $node->children[1];
      $p_1 =  new RangerAppParamDesc();
      if ( $s_3 != $ctx->transformWord($s_3) ) {
        $ctx->addError($node, ("Can not use reserved word " . $s_3) . " as class propery");
      }
      $p_1->name = $s_3;
      $p_1->value_type = $vDef->value_type;
      $p_1->node = $node;
      $p_1->is_class_variable = true;
      $p_1->varType = 8;
      $p_1->node = $node;
      $p_1->nameNode = $vDef;
      $vDef->hasParamDesc = true;
      $vDef->ownParamDesc = $p_1;
      $vDef->paramDesc = $p_1;
      $node->hasParamDesc = true;
      $node->paramDesc = $p_1;
      if ( $vDef->hasFlag("weak") ) {
        $p_1->changeStrength(0, 2, $p_1->nameNode);
      } else {
        $p_1->changeStrength(2, 2, $p_1->nameNode);
      }
      if ( (count($node->children)) > 2 ) {
        $p_1->set_cnt = 1;
        $p_1->init_cnt = 1;
        $p_1->def_value = $node->children[2];
        $p_1->is_optional = false;
        if ( $p_1->def_value->value_type == 4 ) {
          $vDef->type_name = "string";
        }
        if ( $p_1->def_value->value_type == 3 ) {
          $vDef->type_name = "int";
        }
        if ( $p_1->def_value->value_type == 2 ) {
          $vDef->type_name = "double";
        }
        if ( $p_1->def_value->value_type == 5 ) {
          $vDef->type_name = "boolean";
        }
      } else {
        $p_1->is_optional = true;
        if ( false == (($vDef->value_type == 6) || ($vDef->value_type == 7)) ) {
          $vDef->setFlag("optional");
        }
      }
      $currC_3 = $ctx->currentClass;
      $currC_3->addVariable($p_1);
      $subCtx_4 = $currC_3->ctx;
      $subCtx_4->defineVariable($p_1->name, $p_1);
      $p_1->is_class_variable = true;
    }
    if ( $node->isFirstVref("operators") ) {
      $listOf = $node->getSecond();
      for ( $i_4 = 0; $i_4 < count($listOf->children); $i_4++) {
        $item = $listOf->children[$i_4];
        $ctx->createOperator($item);
      }
      $find_more = false;
    }
    if ( $node->isFirstVref("Import") || $node->isFirstVref("import") ) {
      $fNameNode = $node->children[1];
      $import_file = $fNameNode->string_value;
      if ( array_key_exists($import_file , $ctx->already_imported ) ) {
        return;
      } else {
        $ctx->already_imported[$import_file] = true;
      }
      $c = file_get_contents("." . "/" . $import_file) ;
      $code =  new SourceCode($c);
      $code->filename = $import_file;
      $parser =  new RangerLispParser($code);
      $parser->parse();
      $rnode = $parser->rootNode;
      $this->WalkCollectMethods($rnode, $ctx, $wr);
      $find_more = false;
    }
    if ( $node->isFirstVref("does") ) {
      $defName = $node->getSecond();
      $currC_4 = $ctx->currentClass;
      array_push($currC_4->consumes_traits, $defName->vref);
      $joinPoint =  new ClassJoinPoint();
      $joinPoint->class_def = $currC_4;
      $joinPoint->node = $node;
      array_push($this->classesWithTraits, $joinPoint);
    }
    if ( $node->isFirstVref("StaticMethod") || $node->isFirstVref("sfn") ) {
      $s_4 = $node->getVRefAt(1);
      $currC_5 = $ctx->currentClass;
      $m_1 =  new RangerAppFunctionDesc();
      $m_1->name = $s_4;
      $m_1->compiledName = $ctx->transformWord($s_4);
      $m_1->node = $node;
      $m_1->is_static = true;
      $m_1->nameNode = $node->children[1];
      $m_1->nameNode->ifNoTypeSetToVoid();
      $args_1 = $node->children[2];
      $m_1->fnBody = $node->children[3];
      for ( $ii_2 = 0; $ii_2 < count($args_1->children); $ii_2++) {
        $arg_1 = $args_1->children[$ii_2];
        $p_2 =  new RangerAppParamDesc();
        $p_2->name = $arg_1->vref;
        $p_2->value_type = $arg_1->value_type;
        $p_2->node = $arg_1;
        $p_2->init_cnt = 1;
        $p_2->nameNode = $arg_1;
        $p_2->refType = 1;
        $p_2->varType = 4;
        array_push($m_1->params, $p_2);
        $arg_1->hasParamDesc = true;
        $arg_1->paramDesc = $p_2;
        $arg_1->eval_type = $arg_1->value_type;
        $arg_1->eval_type_name = $arg_1->type_name;
        if ( $arg_1->hasFlag("strong") ) {
          $p_2->changeStrength(1, 1, $p_2->nameNode);
        } else {
          $arg_1->setFlag("lives");
          $p_2->changeStrength(0, 1, $p_2->nameNode);
        }
      }
      $currC_5->addStaticMethod($m_1);
      $find_more = false;
    }
    if ( $node->isFirstVref("extension") ) {
      $s_5 = $node->getVRefAt(1);
      $old_class = $ctx->findClass($s_5);
      $ctx->setCurrentClass($old_class);
      echo( "extension for " . $s_5 . "\n");
    }
    if ( $node->isFirstVref("PublicMethod") || $node->isFirstVref("fn") ) {
      $cn = $node->getSecond();
      $s_6 = $node->getVRefAt(1);
      $cn->ifNoTypeSetToVoid();
      $currC_6 = $ctx->currentClass;
      if ( $currC_6->hasOwnMethod($s_6) ) {
        $ctx->addError($node, "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!");
        return;
      }
      if ( $cn->hasFlag("main") ) {
        $ctx->addError($node, "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.");
        return;
      }
      $m_2 =  new RangerAppFunctionDesc();
      $m_2->name = $s_6;
      $m_2->compiledName = $ctx->transformWord($s_6);
      $m_2->node = $node;
      $m_2->nameNode = $node->children[1];
      if ( $node->hasBooleanProperty("strong") ) {
        $m_2->refType = 2;
      } else {
        $m_2->refType = 1;
      }
      $subCtx_5 = $currC_6->ctx->fork();
      $subCtx_5->is_function = true;
      $subCtx_5->currentMethod = $m_2;
      $m_2->fnCtx = $subCtx_5;
      if ( $cn->hasFlag("weak") ) {
        $m_2->changeStrength(0, 1, $node);
      } else {
        $m_2->changeStrength(1, 1, $node);
      }
      $args_2 = $node->children[2];
      $m_2->fnBody = $node->children[3];
      for ( $ii_3 = 0; $ii_3 < count($args_2->children); $ii_3++) {
        $arg_2 = $args_2->children[$ii_3];
        $p2 =  new RangerAppParamDesc();
        $p2->name = $arg_2->vref;
        $p2->value_type = $arg_2->value_type;
        $p2->node = $arg_2;
        $p2->nameNode = $arg_2;
        $p2->init_cnt = 1;
        $p2->refType = 1;
        $p2->initRefType = 1;
        $p2->debugString = "--> collected ";
        if ( $args_2->hasBooleanProperty("strong") ) {
          $p2->debugString = "--> collected as STRONG";
          $ctx->log($node, "memory5", "strong param should move local ownership to call ***");
          $p2->refType = 2;
          $p2->initRefType = 2;
        }
        $p2->varType = 4;
        array_push($m_2->params, $p2);
        $arg_2->hasParamDesc = true;
        $arg_2->paramDesc = $p2;
        $arg_2->eval_type = $arg_2->value_type;
        $arg_2->eval_type_name = $arg_2->type_name;
        if ( $arg_2->hasFlag("strong") ) {
          $p2->changeStrength(1, 1, $p2->nameNode);
        } else {
          $arg_2->setFlag("lives");
          $p2->changeStrength(0, 1, $p2->nameNode);
        }
        $subCtx_5->defineVariable($p2->name, $p2);
      }
      $currC_6->addMethod($m_2);
      $find_more = false;
    }
    if ( $find_more ) {
      for ( $i_5 = 0; $i_5 < count($node->children); $i_5++) {
        $item_1 = $node->children[$i_5];
        $this->WalkCollectMethods($item_1, $ctx, $wr);
      }
    }
    if ( $node->hasBooleanProperty("serialize") ) {
      array_push($this->serializedClasses, $ctx->currentClass);
    }
  }
  
  function FindWeakRefs( $node , $ctx , $wr ) {
    $list = $ctx->getClasses();
    for ( $i = 0; $i < count($list); $i++) {
      $classDesc = $list[$i];
      for ( $i2 = 0; $i2 < count($classDesc->variables); $i2++) {
        $varD = $classDesc->variables[$i2];
        if ( $varD->refType == 1 ) {
          if ( $varD->isArray() ) {
            /** unused:  $nn = $varD->nameNode   **/ ;
          }
          if ( $varD->isHash() ) {
            /** unused:  $nn_1 = $varD->nameNode   **/ ;
          }
          if ( $varD->isObject() ) {
            /** unused:  $nn_2 = $varD->nameNode   **/ ;
          }
        }
      }
    }
  }
  
  function findFunctionDesc( $obj , $ctx , $wr ) {
    $varDesc;
    $varFnDesc;
    if ( $obj->vref != $this->getThisName() ) {
      if ( (count($obj->ns)) > 1 ) {
        $cnt = count($obj->ns);
        $classRefDesc;
        $classDesc;
        for ( $i = 0; $i < count($obj->ns); $i++) {
          $strname = $obj->ns[$i];
          if ( $i == 0 ) {
            if ( $strname == $this->getThisName() ) {
              $classDesc = $ctx->getCurrentClass();
            } else {
              if ( $ctx->isDefinedClass($strname) ) {
                $classDesc = $ctx->findClass($strname);
                continue;
              }
              $classRefDesc = $ctx->getVariableDef($strname);
              if ( ((!isset($classRefDesc))) || ((!isset($classRefDesc->nameNode))) ) {
                $ctx->addError($obj, "Error, no description for called object: " . $strname);
                break;
              }
              $classRefDesc->ref_cnt = 1 + $classRefDesc->ref_cnt;
              $classDesc = $ctx->findClass($classRefDesc->nameNode->type_name);
              if ( (!isset($classDesc)) ) {
                return $varFnDesc;
              }
            }
          } else {
            if ( (!isset($classDesc)) ) {
              return $varFnDesc;
            }
            if ( $i < ($cnt - 1) ) {
              $varDesc = $classDesc->findVariable($strname);
              if ( (!isset($varDesc)) ) {
                $ctx->addError($obj, "Error, no description for refenced obj: " . $strname);
              }
              $subClass = $varDesc->getTypeName();
              $classDesc = $ctx->findClass($subClass);
              continue;
            }
            if ( (isset($classDesc)) ) {
              $varFnDesc = $classDesc->findMethod($strname);
              if ( (!isset($varFnDesc)) ) {
                $varFnDesc = $classDesc->findStaticMethod($strname);
                if ( (!isset($varFnDesc)) ) {
                  $ctx->addError($obj, " function variable not found " . $strname);
                }
              }
            }
          }
        }
        return $varFnDesc;
      }
      $udesc = $ctx->getCurrentClass();
      $currClass = $udesc;
      $varFnDesc = $currClass->findMethod($obj->vref);
      if ( (isset($varFnDesc->nameNode)) ) {
      } else {
        $ctx->addError($obj, "Error, no description for called function: " . $obj->vref);
      }
      return $varFnDesc;
    }
    $ctx->addError($obj, "Can not call 'this' like function");
    $varFnDesc =  new RangerAppFunctionDesc();
    return $varFnDesc;
  }
  
  function findParamDesc( $obj , $ctx , $wr ) {
    $varDesc;
    $set_nsp = false;
    $classDesc;
    if ( 0 == (count($obj->nsp)) ) {
      $set_nsp = true;
    }
    if ( $obj->vref != $this->getThisName() ) {
      if ( (count($obj->ns)) > 1 ) {
        $cnt = count($obj->ns);
        $classRefDesc;
        for ( $i = 0; $i < count($obj->ns); $i++) {
          $strname = $obj->ns[$i];
          if ( $i == 0 ) {
            if ( $strname == $this->getThisName() ) {
              $classDesc = $ctx->getCurrentClass();
              if ( $set_nsp ) {
                array_push($obj->nsp, $classDesc);
              }
            } else {
              if ( $ctx->isDefinedClass($strname) ) {
                $classDesc = $ctx->findClass($strname);
                if ( $set_nsp ) {
                  array_push($obj->nsp, $classDesc);
                }
                continue;
              }
              $classRefDesc = $ctx->getVariableDef($strname);
              if ( (!isset($classRefDesc)) ) {
                $ctx->addError($obj, "Error, no description for called object: " . $strname);
                break;
              }
              if ( $set_nsp ) {
                array_push($obj->nsp, $classRefDesc);
              }
              $classRefDesc->ref_cnt = 1 + $classRefDesc->ref_cnt;
              $classDesc = $ctx->findClass($classRefDesc->nameNode->type_name);
            }
          } else {
            if ( $i < ($cnt - 1) ) {
              $varDesc = $classDesc->findVariable($strname);
              if ( (!isset($varDesc)) ) {
                $ctx->addError($obj, "Error, no description for refenced obj: " . $strname);
              }
              $subClass = $varDesc->getTypeName();
              $classDesc = $ctx->findClass($subClass);
              if ( $set_nsp ) {
                array_push($obj->nsp, $varDesc);
              }
              continue;
            }
            if ( (isset($classDesc)) ) {
              $varDesc = $classDesc->findVariable($strname);
              if ( (!isset($varDesc)) ) {
                $classMethod = $classDesc->findMethod($strname);
                if ( (!isset($classMethod)) ) {
                  $classMethod = $classDesc->findStaticMethod($strname);
                  if ( (!isset($classMethod)) ) {
                    $ctx->addError($obj, "variable not found " . $strname);
                  }
                }
                if ( (isset($classMethod)) ) {
                  if ( $set_nsp ) {
                    array_push($obj->nsp, $classMethod);
                  }
                  return $classMethod;
                }
              }
              if ( $set_nsp ) {
                array_push($obj->nsp, $varDesc);
              }
            }
          }
        }
        return $varDesc;
      }
      $varDesc = $ctx->getVariableDef($obj->vref);
      if ( (isset($varDesc->nameNode)) ) {
      } else {
        echo( "findParamDesc : description not found for " . $obj->vref . "\n");
        if ( (isset($varDesc)) ) {
          echo( "Vardesc was found though..." . $varDesc->name . "\n");
        }
        $ctx->addError($obj, "Error, no description for called object: " . $obj->vref);
      }
      return $varDesc;
    }
    $cc = $ctx->getCurrentClass();
    return $cc;
  }
  
  function areEqualTypes( $n1 , $n2 , $ctx ) {
    if ( ((($n1->eval_type != 0) && ($n2->eval_type != 0)) && ((strlen($n1->eval_type_name)) > 0)) && ((strlen($n2->eval_type_name)) > 0) ) {
      if ( $n1->eval_type_name == $n2->eval_type_name ) {
      } else {
        $b_ok = false;
        if ( $ctx->isEnumDefined($n1->eval_type_name) && ($n2->eval_type_name == "int") ) {
          $b_ok = true;
        }
        if ( $ctx->isEnumDefined($n2->eval_type_name) && ($n1->eval_type_name == "int") ) {
          $b_ok = true;
        }
        if ( ($n1->eval_type_name == "char") && ($n2->eval_type_name == "int") ) {
          $b_ok = true;
        }
        if ( ($n1->eval_type_name == "int") && ($n2->eval_type_name == "char") ) {
          $b_ok = true;
        }
        if ( $ctx->isDefinedClass($n1->eval_type_name) && $ctx->isDefinedClass($n2->eval_type_name) ) {
          $c1 = $ctx->findClass($n1->eval_type_name);
          $c2 = $ctx->findClass($n2->eval_type_name);
          if ( $c1->isSameOrParentClass($n2->eval_type_name, $ctx) ) {
            return true;
          }
          if ( $c2->isSameOrParentClass($n1->eval_type_name, $ctx) ) {
            return true;
          }
        }
        if ( $b_ok == false ) {
          return false;
        }
      }
    }
    return true;
  }
  
  function shouldBeEqualTypes( $n1 , $n2 , $ctx , $msg ) {
    if ( ((($n1->eval_type != 0) && ($n2->eval_type != 0)) && ((strlen($n1->eval_type_name)) > 0)) && ((strlen($n2->eval_type_name)) > 0) ) {
      if ( $n1->eval_type_name == $n2->eval_type_name ) {
      } else {
        $b_ok = false;
        if ( $ctx->isEnumDefined($n1->eval_type_name) && ($n2->eval_type_name == "int") ) {
          $b_ok = true;
        }
        if ( $ctx->isEnumDefined($n2->eval_type_name) && ($n1->eval_type_name == "int") ) {
          $b_ok = true;
        }
        if ( $ctx->isDefinedClass($n2->eval_type_name) ) {
          $cc = $ctx->findClass($n2->eval_type_name);
          if ( $cc->isSameOrParentClass($n1->eval_type_name, $ctx) ) {
            $b_ok = true;
          }
        }
        if ( ($n1->eval_type_name == "char") && ($n2->eval_type_name == "int") ) {
          $b_ok = true;
        }
        if ( ($n1->eval_type_name == "int") && ($n2->eval_type_name == "char") ) {
          $b_ok = true;
        }
        if ( $b_ok == false ) {
          $ctx->addError($n1, (((("Type mismatch " . $n2->eval_type_name) . " <> ") . $n1->eval_type_name) . ". ") . $msg);
        }
      }
    }
  }
  
  function shouldBeExpression( $n1 , $ctx , $msg ) {
    if ( $n1->expression == false ) {
      $ctx->addError($n1, $msg);
    }
  }
  
  function shouldHaveChildCnt( $cnt , $n1 , $ctx , $msg ) {
    if ( (count($n1->children)) != $cnt ) {
      $ctx->addError($n1, $msg);
    }
  }
  
  function shouldBeNumeric( $n1 , $ctx , $msg ) {
    if ( ($n1->eval_type != 0) && ((strlen($n1->eval_type_name)) > 0) ) {
      if ( false == (($n1->eval_type_name == "double") || ($n1->eval_type_name == "int")) ) {
        $ctx->addError($n1, (("Not numeric: " . $n1->eval_type_name) . ". ") . $msg);
      }
    }
  }
  
  function shouldBeArray( $n1 , $ctx , $msg ) {
    if ( $n1->eval_type != 6 ) {
      $ctx->addError($n1, "Expecting array. " . $msg);
    }
  }
  
  function shouldBeType( $type_name , $n1 , $ctx , $msg ) {
    if ( ($n1->eval_type != 0) && ((strlen($n1->eval_type_name)) > 0) ) {
      if ( $n1->eval_type_name == $type_name ) {
      } else {
        $b_ok = false;
        if ( $ctx->isEnumDefined($n1->eval_type_name) && ($type_name == "int") ) {
          $b_ok = true;
        }
        if ( $ctx->isEnumDefined($type_name) && ($n1->eval_type_name == "int") ) {
          $b_ok = true;
        }
        if ( ($n1->eval_type_name == "char") && ($type_name == "int") ) {
          $b_ok = true;
        }
        if ( ($n1->eval_type_name == "int") && ($type_name == "char") ) {
          $b_ok = true;
        }
        if ( $b_ok == false ) {
          $ctx->addError($n1, (((("Type mismatch " . $type_name) . " <> ") . $n1->eval_type_name) . ". ") . $msg);
        }
      }
    }
  }
}
class NodeEvalState { 
  var $ctx;
  var $is_running;
  var $child_index;
  var $cmd_index;
  var $is_ready;
  var $is_waiting;
  var $exit_after;
  var $expand_args;
  var $ask_expand;
  var $eval_rest;
  var $exec_cnt;
  var $b_debugger;
  var $b_top_node;
  var $ask_eval;
  var $param_eval_on;
  var $eval_index;
  var $eval_end_index;
  var $ask_eval_start;
  var $ask_eval_end;
  var $evaluating_cmd;
  
  function __construct( ) {
    $this->ctx;     /** note: unused */
    $this->is_running = false;     /** note: unused */
    $this->child_index = -1;     /** note: unused */
    $this->cmd_index = -1;     /** note: unused */
    $this->is_ready = false;     /** note: unused */
    $this->is_waiting = false;     /** note: unused */
    $this->exit_after = false;     /** note: unused */
    $this->expand_args = false;     /** note: unused */
    $this->ask_expand = false;     /** note: unused */
    $this->eval_rest = false;     /** note: unused */
    $this->exec_cnt = 0;     /** note: unused */
    $this->b_debugger = false;     /** note: unused */
    $this->b_top_node = false;     /** note: unused */
    $this->ask_eval = false;     /** note: unused */
    $this->param_eval_on = false;     /** note: unused */
    $this->eval_index = -1;     /** note: unused */
    $this->eval_end_index = -1;     /** note: unused */
    $this->ask_eval_start = 0;     /** note: unused */
    $this->ask_eval_end = 0;     /** note: unused */
    $this->evaluating_cmd;     /** note: unused */
  }
}
class RangerGenericClassWriter { 
  var $compiler;
  
  function __construct( ) {
    $this->compiler;
  }
  
  function EncodeString( $node , $ctx , $wr ) {
    /** unused:  $encoded_str = ""   **/ ;
    $str_length = strlen($node->string_value);
    $encoded_str_2 = "";
    $ii = 0;
    while ($ii < $str_length) {
      $cc = ord($node->string_value[$ii]);
      switch ($cc ) { 
        case 8 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(98));
          break;
        case 9 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(116));
          break;
        case 10 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(110));
          break;
        case 12 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(102));
          break;
        case 13 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(114));
          break;
        case 34 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(34));
          break;
        case 92 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(92));
          break;
        default: 
          $encoded_str_2 = $encoded_str_2 . (chr($cc));
          break;
      }
      $ii = $ii + 1;
    }
    return $encoded_str_2;
  }
  
  function CustomOperator( $node , $ctx , $wr ) {
  }
  
  function WriteSetterVRef( $node , $ctx , $wr ) {
  }
  
  function writeArrayTypeDef( $node , $ctx , $wr ) {
  }
  
  function WriteEnum( $node , $ctx , $wr ) {
    if ( $node->eval_type == 11 ) {
      $rootObjName = $node->ns[0];
      $e = $ctx->getEnum($rootObjName);
      if ( (isset($e)) ) {
        $enumName = $node->ns[1];
        $wr->out("" . (($e->values[$enumName])), false);
      } else {
        if ( $node->hasParamDesc ) {
          $pp = $node->paramDesc;
          $nn = $pp->nameNode;
          $this->WriteVRef($nn, $ctx, $wr);
        }
      }
    }
  }
  
  function WriteScalarValue( $node , $ctx , $wr ) {
    switch ($node->value_type ) { 
      case 2 : 
        $wr->out("" . $node->double_value, false);
        break;
      case 4 : 
        $s = $this->EncodeString($node, $ctx, $wr);
        $wr->out(("\"" . $s) . "\"", false);
        break;
      case 3 : 
        $wr->out("" . $node->int_value, false);
        break;
      case 5 : 
        if ( $node->boolean_value ) {
          $wr->out("true", false);
        } else {
          $wr->out("false", false);
        }
        break;
    }
  }
  
  function getTypeString( $type_string ) {
    return $type_string;
  }
  
  function import_lib( $lib_name , $ctx , $wr ) {
    $wr->addImport($lib_name);
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return $type_string;
  }
  
  function release_local_vars( $node , $ctx , $wr ) {
    for ( $i = 0; $i < count($ctx->localVarNames); $i++) {
      $n = $ctx->localVarNames[$i];
      $p = $ctx->localVariables[$n];
      if ( $p->ref_cnt == 0 ) {
        continue;
      }
      if ( $p->isAllocatedType() ) {
        if ( 1 == $p->getStrength() ) {
          if ( $p->nameNode->eval_type == 7 ) {
          }
          if ( $p->nameNode->eval_type == 6 ) {
          }
          if ( ($p->nameNode->eval_type != 6) && ($p->nameNode->eval_type != 7) ) {
          }
        }
        if ( 0 == $p->getStrength() ) {
          if ( $p->nameNode->eval_type == 7 ) {
          }
          if ( $p->nameNode->eval_type == 6 ) {
          }
          if ( ($p->nameNode->eval_type != 6) && ($p->nameNode->eval_type != 7) ) {
          }
        }
      }
    }
    if ( $ctx->is_function ) {
      return;
    }
    if ( (isset($ctx->parent)) ) {
      $this->release_local_vars($node, $ctx->parent, $wr);
    }
  }
  
  function WalkNode( $node , $ctx , $wr ) {
    $this->compiler->WalkNode($node, $ctx, $wr);
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $wr->out($node->type_name, false);
  }
  
  function writeRawTypeDef( $node , $ctx , $wr ) {
    $this->writeTypeDef($node, $ctx, $wr);
  }
  
  function adjustType( $tn ) {
    return $tn;
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i > 0 ) {
          $wr->out(".", false);
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
      }
      return;
    }
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        $wr->out(".", false);
      }
      $wr->out($this->adjustType($part), false);
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $p = $node->paramDesc;
      if ( $p->set_cnt > 0 ) {
        $wr->out("var " . $p->name, false);
      } else {
        $wr->out("const " . $p->name, false);
      }
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
        $wr->out(";", true);
      } else {
        $wr->out(";", true);
      }
    }
  }
  
  function CreateLambdaCall( $node , $ctx , $wr ) {
    $fName = $node->children[0];
    $args = $node->children[1];
    $this->WriteVRef($fName, $ctx, $wr);
    $wr->out("(", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $this->WalkNode($arg, $ctx, $wr);
    }
    $wr->out(")", false);
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->out(";", true);
    }
  }
  
  function CreateLambda( $node , $ctx , $wr ) {
    $lambdaCtx = $node->lambda_ctx;
    $args = $node->children[1];
    $body = $node->children[2];
    $wr->out("(", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $this->WalkNode($arg, $lambdaCtx, $wr);
    }
    $wr->out(")", false);
    $wr->out(" => { ", true);
    $wr->indent(1);
    $lambdaCtx->restartExpressionLevel();
    for ( $i_1 = 0; $i_1 < count($body->children); $i_1++) {
      $item = $body->children[$i_1];
      $this->WalkNode($item, $lambdaCtx, $wr);
    }
    $wr->newline();
    $wr->indent(-1);
    $wr->out("}", true);
  }
  
  function writeFnCall( $node , $ctx , $wr ) {
    if ( $node->hasFnCall ) {
      $fc = $node->getFirst();
      $this->WriteVRef($fc, $ctx, $wr);
      $wr->out("(", false);
      $givenArgs = $node->getSecond();
      $ctx->setInExpr();
      for ( $i = 0; $i < count($node->fnDesc->params); $i++) {
        $arg = $node->fnDesc->params[$i];
        if ( $i > 0 ) {
          $wr->out(", ", false);
        }
        if ( (count($givenArgs->children)) <= $i ) {
          $defVal = $arg->nameNode->getFlag("default");
          if ( (isset($defVal)) ) {
            $fc_1 = $defVal->vref_annotation->getFirst();
            $this->WalkNode($fc_1, $ctx, $wr);
          } else {
            $ctx->addError($node, "Default argument was missing");
          }
          continue;
        }
        $n = $givenArgs->children[$i];
        $this->WalkNode($n, $ctx, $wr);
      }
      $ctx->unsetInExpr();
      $wr->out(")", false);
      if ( $ctx->expressionLevel() == 0 ) {
        $wr->out(";", true);
      }
    }
  }
  
  function writeNewCall( $node , $ctx , $wr ) {
    if ( $node->hasNewOper ) {
      $cl = $node->clDesc;
      /** unused:  $fc = $node->getSecond()   **/ ;
      $wr->out("new " . $node->clDesc->name, false);
      $wr->out("(", false);
      $constr = $cl->constructor_fn;
      $givenArgs = $node->getThird();
      if ( (isset($constr)) ) {
        for ( $i = 0; $i < count($constr->params); $i++) {
          $arg = $constr->params[$i];
          $n = $givenArgs->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          if ( true || ((isset($arg->nameNode))) ) {
            $this->WalkNode($n, $ctx, $wr);
          }
        }
      }
      $wr->out(")", false);
    }
  }
  
  function writeInterface( $cl , $ctx , $wr ) {
  }
  
  function disabledVarDef( $node , $ctx , $wr ) {
  }
  
  function writeClass( $node , $ctx , $wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr->out(("class " . $cl->name) . " { ", true);
    $wr->indent(1);
    for ( $i = 0; $i < count($cl->variables); $i++) {
      $pvar = $cl->variables[$i];
      $wr->out(((("/* var " . $pvar->name) . " => ") . $pvar->nameNode->parent->getCode()) . " */ ", true);
    }
    for ( $i_1 = 0; $i_1 < count($cl->static_methods); $i_1++) {
      $pvar_1 = $cl->static_methods[$i_1];
      $wr->out(("/* static " . $pvar_1->name) . " */ ", true);
    }
    for ( $i_2 = 0; $i_2 < count($cl->defined_variants); $i_2++) {
      $fnVar = $cl->defined_variants[$i_2];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_3 = 0; $i_3 < count($mVs->variants); $i_3++) {
        $variant = $mVs->variants[$i_3];
        $wr->out(("function " . $variant->name) . "() {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx = $ctx->fork();
        $this->WalkNode($variant->fnBody, $subCtx, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
  }
}
class RangerJava7ClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  var $signatures;
  var $signature_cnt;
  var $iface_created;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
    $this->signatures = array();
    $this->signature_cnt = 0;
    $this->iface_created = array();
  }
  
  function getSignatureInterface( $s ) {
    $idx = $this->signatures[$s];
    if ( (isset($idx)) ) {
      return "LambdaSignature" . ($idx);
    }
    $this->signature_cnt = $this->signature_cnt + 1;
    $this->signatures[$s] = $this->signature_cnt;
    return "LambdaSignature" . $this->signature_cnt;
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "this";
    }
    return $tn;
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return $type_string;
  }
  
  function getTypeString( $type_string ) {
    switch ($type_string ) { 
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "boolean";
        break;
      case "double" : 
        return "double";
        break;
    }
    return $type_string;
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    $t_name = $node->type_name;
    $a_name = $node->array_type;
    $k_name = $node->key_type;
    if ( (($v_type == 8) || ($v_type == 9)) || ($v_type == 0) ) {
      $v_type = $node->typeNameAsType($ctx);
    }
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
      if ( (strlen($node->eval_type_name)) > 0 ) {
        $t_name = $node->eval_type_name;
      }
      if ( (strlen($node->eval_array_type)) > 0 ) {
        $a_name = $node->eval_array_type;
      }
      if ( (strlen($node->eval_key_type)) > 0 ) {
        $k_name = $node->eval_key_type;
      }
    }
    if ( $node->hasFlag("optional") ) {
      $wr->addImport("java.util.Optional");
      $wr->out("Optional<", false);
      switch ($v_type ) { 
        case 15 : 
          $sig = $this->buildLambdaSignature(($node->expression_value));
          $iface_name = $this->getSignatureInterface($sig);
          $wr->out($iface_name, false);
          if ( (array_key_exists($iface_name , $this->iface_created )) == false ) {
            $fnNode = $node->expression_value->children[0];
            $args = $node->expression_value->children[1];
            $this->iface_created[$iface_name] = true;
            $utilWr = $wr->getFileWriter(".", ($iface_name . ".java"));
            $utilWr->out(("public interface " . $iface_name) . " { ", true);
            $utilWr->indent(1);
            $utilWr->out("public ", false);
            $this->writeTypeDef($fnNode, $ctx, $utilWr);
            $utilWr->out(" run(", false);
            for ( $i = 0; $i < count($args->children); $i++) {
              $arg = $args->children[$i];
              if ( $i > 0 ) {
                $utilWr->out(", ", false);
              }
              $this->writeTypeDef($arg, $ctx, $utilWr);
              $utilWr->out(" ", false);
              $utilWr->out($arg->vref, false);
            }
            $utilWr->out(");", true);
            $utilWr->indent(-1);
            $utilWr->out("}", true);
          }
          break;
        case 11 : 
          $wr->out("Integer", false);
          break;
        case 3 : 
          $wr->out("Integer", false);
          break;
        case 2 : 
          $wr->out("Double", false);
          break;
        case 4 : 
          $wr->out("String", false);
          break;
        case 5 : 
          $wr->out("Boolean", false);
          break;
        case 12 : 
          $wr->out("byte", false);
          break;
        case 13 : 
          $wr->out("byte[]", false);
          break;
        case 7 : 
          $wr->out(((("HashMap<" . $this->getObjectTypeString($k_name, $ctx)) . ",") . $this->getObjectTypeString($a_name, $ctx)) . ">", false);
          $wr->addImport("java.util.*");
          break;
        case 6 : 
          $wr->out(("ArrayList<" . $this->getObjectTypeString($a_name, $ctx)) . ">", false);
          $wr->addImport("java.util.*");
          break;
        default: 
          if ( $t_name == "void" ) {
            $wr->out("void", false);
          } else {
            $wr->out($this->getObjectTypeString($t_name, $ctx), false);
          }
          break;
      }
    } else {
      switch ($v_type ) { 
        case 15 : 
          $sig_1 = $this->buildLambdaSignature(($node->expression_value));
          $iface_name_1 = $this->getSignatureInterface($sig_1);
          $wr->out($iface_name_1, false);
          if ( (array_key_exists($iface_name_1 , $this->iface_created )) == false ) {
            $fnNode_1 = $node->expression_value->children[0];
            $args_1 = $node->expression_value->children[1];
            $this->iface_created[$iface_name_1] = true;
            $utilWr_1 = $wr->getFileWriter(".", ($iface_name_1 . ".java"));
            $utilWr_1->out(("public interface " . $iface_name_1) . " { ", true);
            $utilWr_1->indent(1);
            $utilWr_1->out("public ", false);
            $this->writeTypeDef($fnNode_1, $ctx, $utilWr_1);
            $utilWr_1->out(" run(", false);
            for ( $i_1 = 0; $i_1 < count($args_1->children); $i_1++) {
              $arg_1 = $args_1->children[$i_1];
              if ( $i_1 > 0 ) {
                $utilWr_1->out(", ", false);
              }
              $this->writeTypeDef($arg_1, $ctx, $utilWr_1);
              $utilWr_1->out(" ", false);
              $utilWr_1->out($arg_1->vref, false);
            }
            $utilWr_1->out(");", true);
            $utilWr_1->indent(-1);
            $utilWr_1->out("}", true);
          }
          break;
        case 11 : 
          $wr->out("int", false);
          break;
        case 3 : 
          $wr->out("int", false);
          break;
        case 2 : 
          $wr->out("double", false);
          break;
        case 12 : 
          $wr->out("byte", false);
          break;
        case 13 : 
          $wr->out("byte[]", false);
          break;
        case 4 : 
          $wr->out("String", false);
          break;
        case 5 : 
          $wr->out("boolean", false);
          break;
        case 7 : 
          $wr->out(((("HashMap<" . $this->getObjectTypeString($k_name, $ctx)) . ",") . $this->getObjectTypeString($a_name, $ctx)) . ">", false);
          $wr->addImport("java.util.*");
          break;
        case 6 : 
          $wr->out(("ArrayList<" . $this->getObjectTypeString($a_name, $ctx)) . ">", false);
          $wr->addImport("java.util.*");
          break;
        default: 
          if ( $t_name == "void" ) {
            $wr->out("void", false);
          } else {
            $wr->out($this->getTypeString($t_name), false);
          }
          break;
      }
    }
    if ( $node->hasFlag("optional") ) {
      $wr->out(">", false);
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->vref == "this" ) {
      $wr->out("this", false);
      return;
    }
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    $max_len = count($node->ns);
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i == 0 ) {
          $part = $node->ns[0];
          if ( $part == "this" ) {
            $wr->out("this", false);
            continue;
          }
        }
        if ( $i > 0 ) {
          $wr->out(".", false);
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
        if ( $i < ($max_len - 1) ) {
          if ( $p->nameNode->hasFlag("optional") ) {
            $wr->out(".get()", false);
          }
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part_1 = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        $wr->out(".", false);
      }
      $wr->out($this->adjustType($part_1), false);
    }
  }
  
  function disabledVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      $wr->out($p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        $b_was_set = false;
        if ( $nn->value_type == 6 ) {
          $wr->out(" = new ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
          $b_was_set = true;
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = new ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
          $b_was_set = true;
        }
        if ( ($b_was_set == false) && $nn->hasFlag("optional") ) {
          $wr->out(" = Optional.empty()", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ;", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out("", false);
      } else {
        $wr->out("final ", false);
      }
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      $wr->out(" ", false);
      $wr->out($p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        $b_was_set = false;
        if ( $nn->value_type == 6 ) {
          $wr->out(" = new ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
          $b_was_set = true;
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = new ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
          $b_was_set = true;
        }
        if ( ($b_was_set == false) && $nn->hasFlag("optional") ) {
          $wr->out(" = Optional.empty()", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ;", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(",", false);
      }
      $wr->out(" ", false);
      $this->writeTypeDef($arg->nameNode, $ctx, $wr);
      $wr->out((" " . $arg->name) . " ", false);
    }
  }
  
  function CustomOperator( $node , $ctx , $wr ) {
    $fc = $node->getFirst();
    $cmd = $fc->vref;
    if ( $cmd == "return" ) {
      $wr->newline();
      if ( (count($node->children)) > 1 ) {
        $value = $node->getSecond();
        if ( $value->hasParamDesc ) {
          $nn = $value->paramDesc->nameNode;
          if ( $ctx->isDefinedClass($nn->type_name) ) {
            /** unused:  $cl = $ctx->findClass($nn->type_name)   **/ ;
            $activeFn = $ctx->getCurrentMethod();
            $fnNameNode = $activeFn->nameNode;
            if ( $fnNameNode->hasFlag("optional") ) {
              $wr->out("return Optional.ofNullable((", false);
              $this->WalkNode($value, $ctx, $wr);
              $wr->out(".isPresent() ? (", false);
              $wr->out($fnNameNode->type_name, false);
              $wr->out(")", false);
              $this->WalkNode($value, $ctx, $wr);
              $wr->out(".get() : null ) );", true);
              return;
            }
          }
        }
        $wr->out("return ", false);
        $ctx->setInExpr();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
        $wr->out(";", true);
      } else {
        $wr->out("return;", true);
      }
    }
  }
  
  function buildLambdaSignature( $node ) {
    $exp = $node;
    $exp_s = "";
    $fc = $exp->getFirst();
    $args = $exp->getSecond();
    $exp_s = $exp_s . $fc->buildTypeSignature();
    $exp_s = $exp_s . "(";
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      $exp_s = $exp_s . $arg->buildTypeSignature();
      $exp_s = $exp_s . ",";
    }
    $exp_s = $exp_s . ")";
    return $exp_s;
  }
  
  function CreateLambdaCall( $node , $ctx , $wr ) {
    $fName = $node->children[0];
    $givenArgs = $node->children[1];
    $this->WriteVRef($fName, $ctx, $wr);
    $param = $ctx->getVariableDef($fName->vref);
    $args = $param->nameNode->expression_value->children[1];
    $wr->out(".run(", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      $n = $givenArgs->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      if ( $arg->value_type != 0 ) {
        $this->WalkNode($n, $ctx, $wr);
      }
    }
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->out(");", true);
    } else {
      $wr->out(")", false);
    }
  }
  
  function CreateLambda( $node , $ctx , $wr ) {
    $lambdaCtx = $node->lambda_ctx;
    $fnNode = $node->children[0];
    $args = $node->children[1];
    $body = $node->children[2];
    $sig = $this->buildLambdaSignature($node);
    $iface_name = $this->getSignatureInterface($sig);
    if ( (array_key_exists($iface_name , $this->iface_created )) == false ) {
      $this->iface_created[$iface_name] = true;
      $utilWr = $wr->getFileWriter(".", ($iface_name . ".java"));
      $utilWr->out(("public interface " . $iface_name) . " { ", true);
      $utilWr->indent(1);
      $utilWr->out("public ", false);
      $this->writeTypeDef($fnNode, $ctx, $utilWr);
      $utilWr->out(" run(", false);
      for ( $i = 0; $i < count($args->children); $i++) {
        $arg = $args->children[$i];
        if ( $i > 0 ) {
          $utilWr->out(", ", false);
        }
        $this->writeTypeDef($arg, $lambdaCtx, $utilWr);
        $utilWr->out(" ", false);
        $utilWr->out($arg->vref, false);
      }
      $utilWr->out(");", true);
      $utilWr->indent(-1);
      $utilWr->out("}", true);
    }
    $wr->out(("new " . $iface_name) . "() { ", true);
    $wr->indent(1);
    $wr->out("public ", false);
    $this->writeTypeDef($fnNode, $ctx, $wr);
    $wr->out(" run(", false);
    for ( $i_1 = 0; $i_1 < count($args->children); $i_1++) {
      $arg_1 = $args->children[$i_1];
      if ( $i_1 > 0 ) {
        $wr->out(", ", false);
      }
      $this->writeTypeDef($arg_1, $lambdaCtx, $wr);
      $wr->out(" ", false);
      $wr->out($arg_1->vref, false);
    }
    $wr->out(") {", true);
    $wr->indent(1);
    $lambdaCtx->restartExpressionLevel();
    for ( $i_2 = 0; $i_2 < count($body->children); $i_2++) {
      $item = $body->children[$i_2];
      $this->WalkNode($item, $lambdaCtx, $wr);
    }
    $wr->newline();
    for ( $i_3 = 0; $i_3 < count($lambdaCtx->captured_variables); $i_3++) {
      $cname = $lambdaCtx->captured_variables[$i_3];
      $wr->out("// captured var " . $cname, true);
    }
    $wr->indent(-1);
    $wr->out("}", true);
    $wr->indent(-1);
    $wr->out("}", false);
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $declaredVariable = array();
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i = 0; $i < count($cl->extends_classes); $i++) {
        $pName = $cl->extends_classes[$i];
        $pC = $ctx->findClass($pName);
        for ( $i_1 = 0; $i_1 < count($pC->variables); $i_1++) {
          $pvar = $pC->variables[$i_1];
          $declaredVariable[$pvar->name] = true;
        }
      }
    }
    $wr = $orig_wr->getFileWriter(".", ($cl->name . ".java"));
    $importFork = $wr->fork();
    for ( $i_2 = 0; $i_2 < count($cl->capturedLocals); $i_2++) {
      $dd = $cl->capturedLocals[$i_2];
      if ( $dd->is_class_variable == false ) {
        $wr->out("// local captured " . $dd->name, true);
        echo( "java captured" . "\n");
        echo( $dd->node->getLineAsString() . "\n");
        $dd->node->disabled_node = true;
        $cl->addVariable($dd);
        $csubCtx = $cl->ctx;
        $csubCtx->defineVariable($dd->name, $dd);
        $dd->is_class_variable = true;
      }
    }
    $wr->out("", true);
    $wr->out("class " . $cl->name, false);
    $parentClass;
    if ( (count($cl->extends_classes)) > 0 ) {
      $wr->out(" extends ", false);
      for ( $i_3 = 0; $i_3 < count($cl->extends_classes); $i_3++) {
        $pName_1 = $cl->extends_classes[$i_3];
        $wr->out($pName_1, false);
        $parentClass = $ctx->findClass($pName_1);
      }
    }
    $wr->out(" { ", true);
    $wr->indent(1);
    $wr->createTag("utilities");
    for ( $i_4 = 0; $i_4 < count($cl->variables); $i_4++) {
      $pvar_1 = $cl->variables[$i_4];
      if ( array_key_exists($pvar_1->name , $declaredVariable ) ) {
        continue;
      }
      $wr->out("public ", false);
      $this->writeVarDef($pvar_1->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $wr->out("", true);
      $wr->out($cl->name . "(", false);
      $this->writeArgsDef($constr, $ctx, $wr);
      $wr->out(" ) {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx = $constr->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr->fnBody, $subCtx, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_5 = 0; $i_5 < count($cl->static_methods); $i_5++) {
      $variant = $cl->static_methods[$i_5];
      $wr->out("", true);
      if ( $variant->nameNode->hasFlag("main") && ($variant->nameNode->code->filename != $ctx->getRootFile()) ) {
        continue;
      }
      if ( $variant->nameNode->hasFlag("main") ) {
        $wr->out("public static void main(String [] args ) {", true);
      } else {
        $wr->out("public static ", false);
        $this->writeTypeDef($variant->nameNode, $ctx, $wr);
        $wr->out(" ", false);
        $wr->out($variant->compiledName . "(", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") {", true);
      }
      $wr->indent(1);
      $wr->newline();
      $subCtx_1 = $variant->fnCtx;
      $subCtx_1->is_function = true;
      $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_6 = 0; $i_6 < count($cl->defined_variants); $i_6++) {
      $fnVar = $cl->defined_variants[$i_6];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_7 = 0; $i_7 < count($mVs->variants); $i_7++) {
        $variant_1 = $mVs->variants[$i_7];
        $wr->out("", true);
        $wr->out("public ", false);
        $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
        $wr->out(" ", false);
        $wr->out($variant_1->compiledName . "(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(") {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_2 = $variant_1->fnCtx;
        $subCtx_2->is_function = true;
        $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    $import_list = $wr->getImports();
    for ( $i_8 = 0; $i_8 < count($import_list); $i_8++) {
      $codeStr = $import_list[$i_8];
      $importFork->out(("import " . $codeStr) . ";", true);
    }
  }
}
class RangerSwift3ClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  var $header_created;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
    $this->header_created = false;
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "self";
    }
    return $tn;
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
        return "[UInt8]";
        break;
      case "char" : 
        return "UInt8";
        break;
      case "boolean" : 
        return "Bool";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return $type_string;
  }
  
  function getTypeString( $type_string ) {
    switch ($type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "charbuffer" : 
        return "[UInt8]";
        break;
      case "char" : 
        return "UInt8";
        break;
      case "boolean" : 
        return "Bool";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return $type_string;
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    $t_name = $node->type_name;
    $a_name = $node->array_type;
    $k_name = $node->key_type;
    if ( (($v_type == 8) || ($v_type == 9)) || ($v_type == 0) ) {
      $v_type = $node->typeNameAsType($ctx);
    }
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
      if ( (strlen($node->eval_type_name)) > 0 ) {
        $t_name = $node->eval_type_name;
      }
      if ( (strlen($node->eval_array_type)) > 0 ) {
        $a_name = $node->eval_array_type;
      }
      if ( (strlen($node->eval_key_type)) > 0 ) {
        $k_name = $node->eval_key_type;
      }
    }
    switch ($v_type ) { 
      case 15 : 
        $rv = $node->expression_value->children[0];
        $sec = $node->expression_value->children[1];
        /** unused:  $fc = $sec->getFirst()   **/ ;
        $wr->out("(", false);
        for ( $i = 0; $i < count($sec->children); $i++) {
          $arg = $sec->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          $wr->out(" _ : ", false);
          $this->writeTypeDef($arg, $ctx, $wr);
        }
        $wr->out(") -> ", false);
        $this->writeTypeDef($rv, $ctx, $wr);
        break;
      case 11 : 
        $wr->out("Int", false);
        break;
      case 3 : 
        $wr->out("Int", false);
        break;
      case 2 : 
        $wr->out("Double", false);
        break;
      case 4 : 
        $wr->out("String", false);
        break;
      case 12 : 
        $wr->out("UInt8", false);
        break;
      case 13 : 
        $wr->out("[UInt8]", false);
        break;
      case 5 : 
        $wr->out("Bool", false);
        break;
      case 7 : 
        $wr->out(((("[" . $this->getObjectTypeString($k_name, $ctx)) . ":") . $this->getObjectTypeString($a_name, $ctx)) . "]", false);
        break;
      case 6 : 
        $wr->out(("[" . $this->getObjectTypeString($a_name, $ctx)) . "]", false);
        break;
      default: 
        if ( $t_name == "void" ) {
          $wr->out("Void", false);
          return;
        }
        $wr->out($this->getTypeString($t_name), false);
        break;
    }
    if ( $node->hasFlag("optional") ) {
      $wr->out("?", false);
    }
  }
  
  function WriteEnum( $node , $ctx , $wr ) {
    if ( $node->eval_type == 11 ) {
      $rootObjName = $node->ns[0];
      $e = $ctx->getEnum($rootObjName);
      if ( (isset($e)) ) {
        $enumName = $node->ns[1];
        $wr->out("" . (($e->values[$enumName])), false);
      } else {
        if ( $node->hasParamDesc ) {
          $pp = $node->paramDesc;
          $nn = $pp->nameNode;
          $wr->out($nn->vref, false);
        }
      }
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->vref == "this" ) {
      $wr->out("self", false);
      return;
    }
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    $max_len = count($node->ns);
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i == 0 ) {
          $part = $node->ns[0];
          if ( $part == "this" ) {
            $wr->out("self", false);
            continue;
          }
        }
        if ( $i > 0 ) {
          $wr->out(".", false);
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
        if ( $i < ($max_len - 1) ) {
          if ( $p->nameNode->hasFlag("optional") ) {
            $wr->out("!", false);
          }
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part_1 = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        $wr->out(".", false);
      }
      $wr->out($this->adjustType($part_1), false);
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out(("var " . $p->compiledName) . " : ", false);
      } else {
        $wr->out(("let " . $p->compiledName) . " : ", false);
      }
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ", true);
      } else {
        $wr->newline();
      }
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $wr->out($arg->name . " : ", false);
      $this->writeTypeDef($arg->nameNode, $ctx, $wr);
    }
  }
  
  function writeFnCall( $node , $ctx , $wr ) {
    if ( $node->hasFnCall ) {
      $fc = $node->getFirst();
      $fnName = $node->fnDesc->nameNode;
      if ( $ctx->expressionLevel() == 0 ) {
        if ( $fnName->type_name != "void" ) {
          $wr->out("_ = ", false);
        }
      }
      $this->WriteVRef($fc, $ctx, $wr);
      $wr->out("(", false);
      $ctx->setInExpr();
      $givenArgs = $node->getSecond();
      for ( $i = 0; $i < count($node->fnDesc->params); $i++) {
        $arg = $node->fnDesc->params[$i];
        if ( $i > 0 ) {
          $wr->out(", ", false);
        }
        if ( (count($givenArgs->children)) <= $i ) {
          $defVal = $arg->nameNode->getFlag("default");
          if ( (isset($defVal)) ) {
            $fc_1 = $defVal->vref_annotation->getFirst();
            $this->WalkNode($fc_1, $ctx, $wr);
          } else {
            $ctx->addError($node, "Default argument was missing");
          }
          continue;
        }
        $n = $givenArgs->children[$i];
        $wr->out($arg->name . " : ", false);
        $this->WalkNode($n, $ctx, $wr);
      }
      $ctx->unsetInExpr();
      $wr->out(")", false);
      if ( $ctx->expressionLevel() == 0 ) {
        $wr->newline();
      }
    }
  }
  
  function CreateLambdaCall( $node , $ctx , $wr ) {
    $fName = $node->children[0];
    $givenArgs = $node->children[1];
    $this->WriteVRef($fName, $ctx, $wr);
    $param = $ctx->getVariableDef($fName->vref);
    $args = $param->nameNode->expression_value->children[1];
    $wr->out("(", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      $n = $givenArgs->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      if ( $arg->value_type != 0 ) {
        $this->WalkNode($n, $ctx, $wr);
      }
    }
    $wr->out(")", false);
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->out("", true);
    }
  }
  
  function CreateLambda( $node , $ctx , $wr ) {
    $lambdaCtx = $node->lambda_ctx;
    $fnNode = $node->children[0];
    $args = $node->children[1];
    $body = $node->children[2];
    $wr->out("{ (", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $wr->out($arg->vref, false);
    }
    $wr->out(") ->  ", false);
    $this->writeTypeDef($fnNode, $lambdaCtx, $wr);
    $wr->out(" in ", true);
    $wr->indent(1);
    $lambdaCtx->restartExpressionLevel();
    for ( $i_1 = 0; $i_1 < count($body->children); $i_1++) {
      $item = $body->children[$i_1];
      $this->WalkNode($item, $lambdaCtx, $wr);
    }
    $wr->newline();
    for ( $i_2 = 0; $i_2 < count($lambdaCtx->captured_variables); $i_2++) {
      $cname = $lambdaCtx->captured_variables[$i_2];
      $wr->out("// captured var " . $cname, true);
    }
    $wr->indent(-1);
    $wr->out("}", false);
  }
  
  function writeNewCall( $node , $ctx , $wr ) {
    if ( $node->hasNewOper ) {
      $cl = $node->clDesc;
      /** unused:  $fc = $node->getSecond()   **/ ;
      $wr->out($node->clDesc->name, false);
      $wr->out("(", false);
      $constr = $cl->constructor_fn;
      $givenArgs = $node->getThird();
      if ( (isset($constr)) ) {
        for ( $i = 0; $i < count($constr->params); $i++) {
          $arg = $constr->params[$i];
          $n = $givenArgs->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          $wr->out($arg->name . " : ", false);
          $this->WalkNode($n, $ctx, $wr);
        }
      }
      $wr->out(")", false);
    }
  }
  
  function haveSameSig( $fn1 , $fn2 , $ctx ) {
    if ( $fn1->name != $fn2->name ) {
      return false;
    }
    $match =  new RangerArgMatch();
    $n1 = $fn1->nameNode;
    $n2 = $fn1->nameNode;
    if ( $match->doesDefsMatch($n1, $n2, $ctx) == false ) {
      return false;
    }
    if ( (count($fn1->params)) != (count($fn2->params)) ) {
      return false;
    }
    for ( $i = 0; $i < count($fn1->params); $i++) {
      $p = $fn1->params[$i];
      $p2 = $fn2->params[$i];
      if ( $match->doesDefsMatch(($p->nameNode), ($p2->nameNode), $ctx) == false ) {
        return false;
      }
    }
    return true;
  }
  
  function writeClass( $node , $ctx , $wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $declaredVariable = array();
    $declaredFunction = array();
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i = 0; $i < count($cl->extends_classes); $i++) {
        $pName = $cl->extends_classes[$i];
        $pC = $ctx->findClass($pName);
        for ( $i_1 = 0; $i_1 < count($pC->variables); $i_1++) {
          $pvar = $pC->variables[$i_1];
          $declaredVariable[$pvar->name] = true;
        }
        for ( $i_2 = 0; $i_2 < count($pC->defined_variants); $i_2++) {
          $fnVar = $pC->defined_variants[$i_2];
          $mVs = $pC->method_variants[$fnVar];
          for ( $i_3 = 0; $i_3 < count($mVs->variants); $i_3++) {
            $variant = $mVs->variants[$i_3];
            $declaredFunction[$variant->compiledName] = true;
          }
        }
      }
    }
    if ( $this->header_created == false ) {
      $wr->createTag("utilities");
      $this->header_created = true;
    }
    $wr->out(((("func ==(l: " . $cl->name) . ", r: ") . $cl->name) . ") -> Bool {", true);
    $wr->indent(1);
    $wr->out("return l == r", true);
    $wr->indent(-1);
    $wr->out("}", true);
    $wr->out("class " . $cl->name, false);
    $parentClass;
    if ( (count($cl->extends_classes)) > 0 ) {
      $wr->out(" : ", false);
      for ( $i_4 = 0; $i_4 < count($cl->extends_classes); $i_4++) {
        $pName_1 = $cl->extends_classes[$i_4];
        $wr->out($pName_1, false);
        $parentClass = $ctx->findClass($pName_1);
      }
    } else {
      $wr->out(" : Equatable ", false);
    }
    $wr->out(" { ", true);
    $wr->indent(1);
    for ( $i_5 = 0; $i_5 < count($cl->variables); $i_5++) {
      $pvar_1 = $cl->variables[$i_5];
      if ( array_key_exists($pvar_1->name , $declaredVariable ) ) {
        $wr->out("// WAS DECLARED : " . $pvar_1->name, true);
        continue;
      }
      $this->writeVarDef($pvar_1->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $b_must_override = false;
      if ( isset( $parentClass ) ) {
        if ( (count($constr->params)) == 0 ) {
          $b_must_override = true;
        } else {
          if ( $parentClass->has_constructor ) {
            $p_constr = $parentClass->constructor_fn;
            if ( $this->haveSameSig(($constr), $p_constr, $ctx) ) {
              $b_must_override = true;
            }
          }
        }
      }
      if ( $b_must_override ) {
        $wr->out("override ", false);
      }
      $wr->out("init(", false);
      $this->writeArgsDef($constr, $ctx, $wr);
      $wr->out(" ) {", true);
      $wr->indent(1);
      if ( isset( $parentClass ) ) {
        $wr->out("super.init()", true);
      }
      $wr->newline();
      $subCtx = $constr->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr->fnBody, $subCtx, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_6 = 0; $i_6 < count($cl->static_methods); $i_6++) {
      $variant_1 = $cl->static_methods[$i_6];
      if ( $variant_1->nameNode->hasFlag("main") ) {
        continue;
      }
      $wr->out(("static func " . $variant_1->compiledName) . "(", false);
      $this->writeArgsDef($variant_1, $ctx, $wr);
      $wr->out(") -> ", false);
      $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
      $wr->out(" {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx_1 = $variant_1->fnCtx;
      $subCtx_1->is_function = true;
      $this->WalkNode($variant_1->fnBody, $subCtx_1, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_7 = 0; $i_7 < count($cl->defined_variants); $i_7++) {
      $fnVar_1 = $cl->defined_variants[$i_7];
      $mVs_1 = $cl->method_variants[$fnVar_1];
      for ( $i_8 = 0; $i_8 < count($mVs_1->variants); $i_8++) {
        $variant_2 = $mVs_1->variants[$i_8];
        if ( array_key_exists($variant_2->name , $declaredFunction ) ) {
          $wr->out("override ", false);
        }
        $wr->out(("func " . $variant_2->compiledName) . "(", false);
        $this->writeArgsDef($variant_2, $ctx, $wr);
        $wr->out(") -> ", false);
        $this->writeTypeDef($variant_2->nameNode, $ctx, $wr);
        $wr->out(" {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_2 = $variant_2->fnCtx;
        $subCtx_2->is_function = true;
        $this->WalkNode($variant_2->fnBody, $subCtx_2, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    for ( $i_9 = 0; $i_9 < count($cl->static_methods); $i_9++) {
      $variant_3 = $cl->static_methods[$i_9];
      if ( $variant_3->nameNode->hasFlag("main") && ($variant_3->nameNode->code->filename == $ctx->getRootFile()) ) {
        $wr->newline();
        $wr->out("func __main__swift() {", true);
        $wr->indent(1);
        $subCtx_3 = $variant_3->fnCtx;
        $subCtx_3->is_function = true;
        $this->WalkNode($variant_3->fnBody, $subCtx_3, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
        $wr->out("// call the main function", true);
        $wr->out("__main__swift()", true);
      }
    }
  }
}
class RangerCppClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  var $header_created;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
    $this->header_created = false;
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "this";
    }
    return $tn;
  }
  
  function WriteScalarValue( $node , $ctx , $wr ) {
    switch ($node->value_type ) { 
      case 2 : 
        $wr->out("" . $node->double_value, false);
        break;
      case 4 : 
        $s = $this->EncodeString($node, $ctx, $wr);
        $wr->out(("std::string(" . (("\"" . $s) . "\"")) . ")", false);
        break;
      case 3 : 
        $wr->out("" . $node->int_value, false);
        break;
      case 5 : 
        if ( $node->boolean_value ) {
          $wr->out("true", false);
        } else {
          $wr->out("false", false);
        }
        break;
    }
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "char" : 
        return "char";
        break;
      case "charbuffer" : 
        return "const char*";
        break;
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "std::string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "double";
        break;
    }
    if ( $ctx->isEnumDefined($type_string) ) {
      return "int";
    }
    if ( $ctx->isDefinedClass($type_string) ) {
      return ("std::shared_ptr<" . $type_string) . ">";
    }
    return $type_string;
  }
  
  function getTypeString2( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "char" : 
        return "char";
        break;
      case "charbuffer" : 
        return "const char*";
        break;
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "std::string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "double";
        break;
    }
    if ( $ctx->isEnumDefined($type_string) ) {
      return "int";
    }
    return $type_string;
  }
  
  function writePtr( $node , $ctx , $wr ) {
    if ( $node->type_name == "void" ) {
      return;
    }
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    $t_name = $node->type_name;
    $a_name = $node->array_type;
    $k_name = $node->key_type;
    if ( (($v_type == 8) || ($v_type == 9)) || ($v_type == 0) ) {
      $v_type = $node->typeNameAsType($ctx);
    }
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
      if ( (strlen($node->eval_type_name)) > 0 ) {
        $t_name = $node->eval_type_name;
      }
      if ( (strlen($node->eval_array_type)) > 0 ) {
        $a_name = $node->eval_array_type;
      }
      if ( (strlen($node->eval_key_type)) > 0 ) {
        $k_name = $node->eval_key_type;
      }
    }
    switch ($v_type ) { 
      case 15 : 
        $rv = $node->expression_value->children[0];
        $sec = $node->expression_value->children[1];
        /** unused:  $fc = $sec->getFirst()   **/ ;
        $wr->out("std::function<", false);
        $this->writeTypeDef($rv, $ctx, $wr);
        $wr->out("(", false);
        for ( $i = 0; $i < count($sec->children); $i++) {
          $arg = $sec->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          $this->writeTypeDef($arg, $ctx, $wr);
        }
        $wr->out(")>", false);
        break;
      case 11 : 
        $wr->out("int", false);
        break;
      case 3 : 
        if ( $node->hasFlag("optional") ) {
          $wr->out(" r_optional_primitive<int> ", false);
        } else {
          $wr->out("int", false);
        }
        break;
      case 12 : 
        $wr->out("char", false);
        break;
      case 13 : 
        $wr->out("const char*", false);
        break;
      case 2 : 
        if ( $node->hasFlag("optional") ) {
          $wr->out(" r_optional_primitive<double> ", false);
        } else {
          $wr->out("double", false);
        }
        break;
      case 4 : 
        $wr->addImport("<string>");
        $wr->out("std::string", false);
        break;
      case 5 : 
        $wr->out("bool", false);
        break;
      case 7 : 
        $wr->out(((("std::map<" . $this->getObjectTypeString($k_name, $ctx)) . ",") . $this->getObjectTypeString($a_name, $ctx)) . ">", false);
        $wr->addImport("<map>");
        break;
      case 6 : 
        $wr->out(("std::vector<" . $this->getObjectTypeString($a_name, $ctx)) . ">", false);
        $wr->addImport("<vector>");
        break;
      default: 
        if ( $node->type_name == "void" ) {
          $wr->out("void", false);
          return;
        }
        if ( $ctx->isDefinedClass($t_name) ) {
          $cc = $ctx->findClass($t_name);
          $wr->out("std::shared_ptr<", false);
          $wr->out($cc->name, false);
          $wr->out(">", false);
          return;
        }
        if ( $node->hasFlag("optional") ) {
          $wr->out("std::shared_ptr<std::vector<", false);
          $wr->out($this->getTypeString2($t_name, $ctx), false);
          $wr->out(">", false);
          return;
        }
        $wr->out($this->getTypeString2($t_name, $ctx), false);
        break;
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->vref == "this" ) {
      $wr->out("shared_from_this()", false);
      return;
    }
    if ( $node->eval_type == 11 ) {
      $rootObjName = $node->ns[0];
      if ( (count($node->ns)) > 1 ) {
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    $had_static = false;
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i > 0 ) {
          if ( $had_static ) {
            $wr->out("::", false);
          } else {
            $wr->out("->", false);
          }
        }
        if ( $i == 0 ) {
          $part = $node->ns[0];
          if ( $part == "this" ) {
            $wr->out("this", false);
            continue;
          }
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
        if ( $p->isClass() ) {
          $had_static = true;
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part_1 = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        if ( $had_static ) {
          $wr->out("::", false);
        } else {
          $wr->out("->", false);
        }
      }
      if ( $ctx->hasClass($part_1) ) {
        $had_static = true;
      } else {
        $had_static = false;
      }
      $wr->out($this->adjustType($part_1), false);
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out("", false);
      } else {
        $wr->out("", false);
      }
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      $wr->out(" ", false);
      $wr->out($p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ;", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function disabledVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out("", false);
      } else {
        $wr->out("", false);
      }
      $wr->out($p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
      }
      $wr->out(";", false);
      $wr->newline();
    }
  }
  
  function CustomOperator( $node , $ctx , $wr ) {
    $fc = $node->getFirst();
    $cmd = $fc->vref;
    if ( $cmd == "return" ) {
      if ( $ctx->isInMain() ) {
        $wr->out("return 0;", true);
      } else {
        $wr->out("return;", true);
      }
      return;
    }
    if ( $cmd == "switch" ) {
      $condition = $node->getSecond();
      $case_nodes = $node->getThird();
      $wr->newline();
      $p =  new RangerAppParamDesc();
      $p->name = "caseMatched";
      $p->value_type = 5;
      $ctx->defineVariable($p->name, $p);
      $wr->out(("bool " . $p->compiledName) . " = false;", true);
      for ( $i = 0; $i < count($case_nodes->children); $i++) {
        $ch = $case_nodes->children[$i];
        $blockName = $ch->getFirst();
        if ( $blockName->vref == "default" ) {
          $defBlock = $ch->getSecond();
          $wr->out("if( ! ", false);
          $wr->out($p->compiledName, false);
          $wr->out(") {", true);
          $wr->indent(1);
          $this->WalkNode($defBlock, $ctx, $wr);
          $wr->indent(-1);
          $wr->out("}", true);
        } else {
          $caseValue = $ch->getSecond();
          $caseBlock = $ch->getThird();
          $wr->out("if( ", false);
          $this->WalkNode($condition, $ctx, $wr);
          $wr->out(" == ", false);
          $this->WalkNode($caseValue, $ctx, $wr);
          $wr->out(") {", true);
          $wr->indent(1);
          $wr->out($p->compiledName . " = true;", true);
          $this->WalkNode($caseBlock, $ctx, $wr);
          $wr->indent(-1);
          $wr->out("}", true);
        }
      }
    }
  }
  
  function CreateLambdaCall( $node , $ctx , $wr ) {
    $fName = $node->children[0];
    $givenArgs = $node->children[1];
    $this->WriteVRef($fName, $ctx, $wr);
    $param = $ctx->getVariableDef($fName->vref);
    $args = $param->nameNode->expression_value->children[1];
    $wr->out("(", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      $n = $givenArgs->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      if ( $arg->value_type != 0 ) {
        $this->WalkNode($n, $ctx, $wr);
      }
    }
    $wr->out(")", false);
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->out(";", true);
    }
  }
  
  function CreateLambda( $node , $ctx , $wr ) {
    $lambdaCtx = $node->lambda_ctx;
    /** unused:  $fnNode = $node->children[0]   **/ ;
    $args = $node->children[1];
    $body = $node->children[2];
    $wr->out("[this", false);
    $wr->out("](", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $this->writeTypeDef($arg, $ctx, $wr);
      $wr->out(" ", false);
      $wr->out($arg->vref, false);
    }
    $wr->out(") mutable { ", true);
    $wr->indent(1);
    $lambdaCtx->restartExpressionLevel();
    for ( $i_1 = 0; $i_1 < count($body->children); $i_1++) {
      $item = $body->children[$i_1];
      $this->WalkNode($item, $lambdaCtx, $wr);
    }
    $wr->newline();
    $wr->indent(-1);
    $wr->out("}", false);
  }
  
  function writeCppHeaderVar( $node , $ctx , $wr , $do_initialize ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out("", false);
      } else {
        $wr->out("", false);
      }
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      $wr->out(" ", false);
      $wr->out($p->compiledName, false);
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ;", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(",", false);
      }
      $wr->out(" ", false);
      $this->writeTypeDef($arg->nameNode, $ctx, $wr);
      $wr->out((" " . $arg->name) . " ", false);
    }
  }
  
  function writeFnCall( $node , $ctx , $wr ) {
    if ( $node->hasFnCall ) {
      $fc = $node->getFirst();
      $this->WriteVRef($fc, $ctx, $wr);
      $wr->out("(", false);
      $ctx->setInExpr();
      $givenArgs = $node->getSecond();
      for ( $i = 0; $i < count($node->fnDesc->params); $i++) {
        $arg = $node->fnDesc->params[$i];
        if ( $i > 0 ) {
          $wr->out(", ", false);
        }
        if ( $i >= (count($givenArgs->children)) ) {
          $defVal = $arg->nameNode->getFlag("default");
          if ( (isset($defVal)) ) {
            $fc_1 = $defVal->vref_annotation->getFirst();
            $this->WalkNode($fc_1, $ctx, $wr);
          } else {
            $ctx->addError($node, "Default argument was missing");
          }
          continue;
        }
        $n = $givenArgs->children[$i];
        $this->WalkNode($n, $ctx, $wr);
      }
      $ctx->unsetInExpr();
      $wr->out(")", false);
      if ( $ctx->expressionLevel() == 0 ) {
        $wr->out(";", true);
      }
    }
  }
  
  function writeNewCall( $node , $ctx , $wr ) {
    if ( $node->hasNewOper ) {
      $cl = $node->clDesc;
      /** unused:  $fc = $node->getSecond()   **/ ;
      $wr->out(" std::make_shared<", false);
      $wr->out($node->clDesc->name, false);
      $wr->out(">(", false);
      $constr = $cl->constructor_fn;
      $givenArgs = $node->getThird();
      if ( (isset($constr)) ) {
        for ( $i = 0; $i < count($constr->params); $i++) {
          $arg = $constr->params[$i];
          $n = $givenArgs->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          if ( true || ((isset($arg->nameNode))) ) {
            $this->WalkNode($n, $ctx, $wr);
          }
        }
      }
      $wr->out(")", false);
    }
  }
  
  function writeClassHeader( $node , $ctx , $wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr->out("class " . $cl->name, false);
    $parentClass;
    if ( (count($cl->extends_classes)) > 0 ) {
      $wr->out(" : ", false);
      for ( $i = 0; $i < count($cl->extends_classes); $i++) {
        $pName = $cl->extends_classes[$i];
        $wr->out("public ", false);
        $wr->out($pName, false);
        $parentClass = $ctx->findClass($pName);
      }
    } else {
      $wr->out((" : public std::enable_shared_from_this<" . $cl->name) . "> ", false);
    }
    $wr->out(" { ", true);
    $wr->indent(1);
    $wr->out("public :", true);
    $wr->indent(1);
    for ( $i_1 = 0; $i_1 < count($cl->variables); $i_1++) {
      $pvar = $cl->variables[$i_1];
      $this->writeCppHeaderVar($pvar->node, $ctx, $wr, false);
    }
    $wr->out("/* class constructor */ ", true);
    $wr->out($cl->name . "(", false);
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $this->writeArgsDef($constr, $ctx, $wr);
    }
    $wr->out(" );", true);
    for ( $i_2 = 0; $i_2 < count($cl->static_methods); $i_2++) {
      $variant = $cl->static_methods[$i_2];
      if ( $i_2 == 0 ) {
        $wr->out("/* static methods */ ", true);
      }
      $wr->out("static ", false);
      $this->writeTypeDef($variant->nameNode, $ctx, $wr);
      $wr->out((" " . $variant->compiledName) . "(", false);
      $this->writeArgsDef($variant, $ctx, $wr);
      $wr->out(");", true);
    }
    for ( $i_3 = 0; $i_3 < count($cl->defined_variants); $i_3++) {
      $fnVar = $cl->defined_variants[$i_3];
      if ( $i_3 == 0 ) {
        $wr->out("/* instance methods */ ", true);
      }
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_4 = 0; $i_4 < count($mVs->variants); $i_4++) {
        $variant_1 = $mVs->variants[$i_4];
        if ( $cl->is_inherited ) {
          $wr->out("virtual ", false);
        }
        $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
        $wr->out((" " . $variant_1->compiledName) . "(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(");", true);
      }
    }
    $wr->indent(-1);
    $wr->indent(-1);
    $wr->out("};", true);
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    $wr = $orig_wr;
    if ( (!isset($cl)) ) {
      return;
    }
    if ( $this->header_created == false ) {
      $wr->createTag("c++Imports");
      $wr->out("", true);
      $wr->out("// define classes here to avoid compiler errors", true);
      $wr->createTag("c++ClassDefs");
      $wr->out("", true);
      $wr->createTag("utilities");
      $wr->out("", true);
      $wr->out("// header definitions", true);
      $wr->createTag("c++Header");
      $wr->out("", true);
      $this->header_created = true;
    }
    $classWriter = $orig_wr->getTag("c++ClassDefs");
    $headerWriter = $orig_wr->getTag("c++Header");
    /** unused:  $projectName = "project"   **/ ;
    for ( $i = 0; $i < count($cl->capturedLocals); $i++) {
      $dd = $cl->capturedLocals[$i];
      if ( $dd->is_class_variable == false ) {
        $wr->out("// local captured " . $dd->name, true);
        $dd->node->disabled_node = true;
        $cl->addVariable($dd);
        $csubCtx = $cl->ctx;
        $csubCtx->defineVariable($dd->name, $dd);
        $dd->is_class_variable = true;
      }
    }
    $classWriter->out(("class " . $cl->name) . ";", true);
    $this->writeClassHeader($node, $ctx, $headerWriter);
    $wr->out("", true);
    $wr->out((($cl->name . "::") . $cl->name) . "(", false);
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $this->writeArgsDef($constr, $ctx, $wr);
    }
    $wr->out(" ) ", false);
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i_1 = 0; $i_1 < count($cl->extends_classes); $i_1++) {
        $pName = $cl->extends_classes[$i_1];
        $pcc = $ctx->findClass($pName);
        if ( $pcc->has_constructor ) {
          $wr->out((" : " . $pcc->name) . "(", false);
          $constr_1 = $cl->constructor_fn;
          for ( $i_2 = 0; $i_2 < count($constr_1->params); $i_2++) {
            $arg = $constr_1->params[$i_2];
            if ( $i_2 > 0 ) {
              $wr->out(",", false);
            }
            $wr->out(" ", false);
            $wr->out((" " . $arg->name) . " ", false);
          }
          $wr->out(")", false);
        }
      }
    }
    $wr->out("{", true);
    $wr->indent(1);
    for ( $i_3 = 0; $i_3 < count($cl->variables); $i_3++) {
      $pvar = $cl->variables[$i_3];
      $nn = $pvar->node;
      if ( $pvar->is_captured ) {
        continue;
      }
      if ( (count($nn->children)) > 2 ) {
        $valueNode = $nn->children[2];
        $wr->out(("this->" . $pvar->compiledName) . " = ", false);
        $this->WalkNode($valueNode, $ctx, $wr);
        $wr->out(";", true);
      }
    }
    if ( $cl->has_constructor ) {
      $constr_2 = $cl->constructor_fn;
      $wr->newline();
      $subCtx = $constr_2->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr_2->fnBody, $subCtx, $wr);
      $wr->newline();
    }
    $wr->indent(-1);
    $wr->out("}", true);
    for ( $i_4 = 0; $i_4 < count($cl->static_methods); $i_4++) {
      $variant = $cl->static_methods[$i_4];
      if ( $variant->nameNode->hasFlag("main") ) {
        continue;
      }
      $wr->out("", true);
      $this->writeTypeDef($variant->nameNode, $ctx, $wr);
      $wr->out(" ", false);
      $wr->out((" " . $cl->name) . "::", false);
      $wr->out($variant->compiledName . "(", false);
      $this->writeArgsDef($variant, $ctx, $wr);
      $wr->out(") {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx_1 = $variant->fnCtx;
      $subCtx_1->is_function = true;
      $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_5 = 0; $i_5 < count($cl->defined_variants); $i_5++) {
      $fnVar = $cl->defined_variants[$i_5];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_6 = 0; $i_6 < count($mVs->variants); $i_6++) {
        $variant_1 = $mVs->variants[$i_6];
        $wr->out("", true);
        $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
        $wr->out(" ", false);
        $wr->out((" " . $cl->name) . "::", false);
        $wr->out($variant_1->compiledName . "(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(") {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_2 = $variant_1->fnCtx;
        $subCtx_2->is_function = true;
        $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    for ( $i_7 = 0; $i_7 < count($cl->static_methods); $i_7++) {
      $variant_2 = $cl->static_methods[$i_7];
      if ( $variant_2->nameNode->hasFlag("main") && ($variant_2->nameNode->code->filename == $ctx->getRootFile()) ) {
        $wr->out("", true);
        $wr->out("int main(int argc, char* argv[]) {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_3 = $variant_2->fnCtx;
        $subCtx_3->in_main = true;
        $subCtx_3->is_function = true;
        $this->WalkNode($variant_2->fnBody, $subCtx_3, $wr);
        $wr->newline();
        $wr->out("return 0;", true);
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
  }
}
class RangerKotlinClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
  }
  
  function WriteScalarValue( $node , $ctx , $wr ) {
    switch ($node->value_type ) { 
      case 2 : 
        $wr->out($node->getParsedString(), false);
        break;
      case 4 : 
        $s = $this->EncodeString($node, $ctx, $wr);
        $wr->out(("\"" . $s) . "\"", false);
        break;
      case 3 : 
        $wr->out("" . $node->int_value, false);
        break;
      case 5 : 
        if ( $node->boolean_value ) {
          $wr->out("true", false);
        } else {
          $wr->out("false", false);
        }
        break;
    }
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "this";
    }
    return $tn;
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "CharArray";
        break;
      case "char" : 
        return "char";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return $type_string;
  }
  
  function getTypeString( $type_string ) {
    switch ($type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "CharArray";
        break;
      case "char" : 
        return "Char";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return $type_string;
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
    }
    switch ($v_type ) { 
      case 11 : 
        $wr->out("Int", false);
        break;
      case 3 : 
        $wr->out("Int", false);
        break;
      case 2 : 
        $wr->out("Double", false);
        break;
      case 12 : 
        $wr->out("Char", false);
        break;
      case 13 : 
        $wr->out("CharArray", false);
        break;
      case 4 : 
        $wr->out("String", false);
        break;
      case 5 : 
        $wr->out("Boolean", false);
        break;
      case 7 : 
        $wr->out(((("MutableMap<" . $this->getObjectTypeString($node->key_type, $ctx)) . ",") . $this->getObjectTypeString($node->array_type, $ctx)) . ">", false);
        break;
      case 6 : 
        $wr->out(("MutableList<" . $this->getObjectTypeString($node->array_type, $ctx)) . ">", false);
        break;
      default: 
        if ( $node->type_name == "void" ) {
          $wr->out("Unit", false);
        } else {
          $wr->out($this->getTypeString($node->type_name), false);
        }
        break;
    }
    if ( $node->hasFlag("optional") ) {
      $wr->out("?", false);
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i > 0 ) {
          $wr->out(".", false);
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
        if ( $i == 0 ) {
          if ( $p->nameNode->hasFlag("optional") ) {
            $wr->out("!!", false);
          }
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        $wr->out(".", false);
      }
      $wr->out($this->adjustType($part), false);
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out("var ", false);
      } else {
        $wr->out("val ", false);
      }
      $wr->out($p->compiledName, false);
      $wr->out(" : ", false);
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      $wr->out(" ", false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = arrayListOf()", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = hashMapOf()", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ;", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(",", false);
      }
      $wr->out(" ", false);
      $wr->out($arg->name . " : ", false);
      $this->writeTypeDef($arg->nameNode, $ctx, $wr);
    }
  }
  
  function writeFnCall( $node , $ctx , $wr ) {
    if ( $node->hasFnCall ) {
      $fc = $node->getFirst();
      $this->WriteVRef($fc, $ctx, $wr);
      $wr->out("(", false);
      $givenArgs = $node->getSecond();
      for ( $i = 0; $i < count($node->fnDesc->params); $i++) {
        $arg = $node->fnDesc->params[$i];
        if ( $i > 0 ) {
          $wr->out(", ", false);
        }
        if ( (count($givenArgs->children)) <= $i ) {
          $defVal = $arg->nameNode->getFlag("default");
          if ( (isset($defVal)) ) {
            $fc_1 = $defVal->vref_annotation->getFirst();
            $this->WalkNode($fc_1, $ctx, $wr);
          } else {
            $ctx->addError($node, "Default argument was missing");
          }
          continue;
        }
        $n = $givenArgs->children[$i];
        $this->WalkNode($n, $ctx, $wr);
      }
      $wr->out(")", false);
      if ( $ctx->expressionLevel() == 0 ) {
        $wr->out(";", true);
      }
    }
  }
  
  function writeNewCall( $node , $ctx , $wr ) {
    if ( $node->hasNewOper ) {
      $cl = $node->clDesc;
      /** unused:  $fc = $node->getSecond()   **/ ;
      $wr->out(" ", false);
      $wr->out($node->clDesc->name, false);
      $wr->out("(", false);
      $constr = $cl->constructor_fn;
      $givenArgs = $node->getThird();
      if ( (isset($constr)) ) {
        for ( $i = 0; $i < count($constr->params); $i++) {
          $arg = $constr->params[$i];
          $n = $givenArgs->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          if ( true || ((isset($arg->nameNode))) ) {
            $this->WalkNode($n, $ctx, $wr);
          }
        }
      }
      $wr->out(")", false);
    }
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr = $orig_wr;
    /** unused:  $importFork = $wr->fork()   **/ ;
    $wr->out("", true);
    $wr->out("class " . $cl->name, false);
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $wr->out("(", false);
      $this->writeArgsDef($constr, $ctx, $wr);
      $wr->out(" ) ", true);
    }
    $wr->out(" {", true);
    $wr->indent(1);
    for ( $i = 0; $i < count($cl->variables); $i++) {
      $pvar = $cl->variables[$i];
      $this->writeVarDef($pvar->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr_1 = $cl->constructor_fn;
      $wr->out("", true);
      $wr->out("init {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx = $constr_1->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr_1->fnBody, $subCtx, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    if ( (count($cl->static_methods)) > 0 ) {
      $wr->out("companion object {", true);
      $wr->indent(1);
    }
    for ( $i_1 = 0; $i_1 < count($cl->static_methods); $i_1++) {
      $variant = $cl->static_methods[$i_1];
      $wr->out("", true);
      if ( $variant->nameNode->hasFlag("main") ) {
        continue;
      }
      $wr->out("fun ", false);
      $wr->out(" ", false);
      $wr->out($variant->name . "(", false);
      $this->writeArgsDef($variant, $ctx, $wr);
      $wr->out(") : ", false);
      $this->writeTypeDef($variant->nameNode, $ctx, $wr);
      $wr->out(" {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx_1 = $variant->fnCtx;
      $subCtx_1->is_function = true;
      $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    if ( (count($cl->static_methods)) > 0 ) {
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_2 = 0; $i_2 < count($cl->defined_variants); $i_2++) {
      $fnVar = $cl->defined_variants[$i_2];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_3 = 0; $i_3 < count($mVs->variants); $i_3++) {
        $variant_1 = $mVs->variants[$i_3];
        $wr->out("", true);
        $wr->out("fun ", false);
        $wr->out(" ", false);
        $wr->out($variant_1->name . "(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(") : ", false);
        $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
        $wr->out(" {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_2 = $variant_1->fnCtx;
        $subCtx_2->is_function = true;
        $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    for ( $i_4 = 0; $i_4 < count($cl->static_methods); $i_4++) {
      $variant_2 = $cl->static_methods[$i_4];
      $wr->out("", true);
      if ( $variant_2->nameNode->hasFlag("main") && ($variant_2->nameNode->code->filename == $ctx->getRootFile()) ) {
        $wr->out("fun main(args : Array<String>) {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_3 = $variant_2->fnCtx;
        $subCtx_3->is_function = true;
        $this->WalkNode($variant_2->fnBody, $subCtx_3, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
  }
}
class RangerCSharpClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "this";
    }
    return $tn;
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "int" : 
        return "Integer";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
    }
    return $type_string;
  }
  
  function getTypeString( $type_string ) {
    switch ($type_string ) { 
      case "int" : 
        return "int";
        break;
      case "string" : 
        return "String";
        break;
      case "chararray" : 
        return "byte[]";
        break;
      case "char" : 
        return "byte";
        break;
      case "boolean" : 
        return "boolean";
        break;
      case "double" : 
        return "double";
        break;
    }
    return $type_string;
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
    }
    switch ($v_type ) { 
      case 11 : 
        $wr->out("int", false);
        break;
      case 3 : 
        $wr->out("int", false);
        break;
      case 2 : 
        $wr->out("double", false);
        break;
      case 12 : 
        $wr->out("byte", false);
        break;
      case 13 : 
        $wr->out("byte[]", false);
        break;
      case 4 : 
        $wr->out("String", false);
        break;
      case 5 : 
        $wr->out("boolean", false);
        break;
      case 7 : 
        $wr->out(((("Dictionary<" . $this->getObjectTypeString($node->key_type, $ctx)) . ",") . $this->getObjectTypeString($node->array_type, $ctx)) . ">", false);
        $wr->addImport("System.Collections");
        break;
      case 6 : 
        $wr->out(("List<" . $this->getObjectTypeString($node->array_type, $ctx)) . ">", false);
        $wr->addImport("System.Collections");
        break;
      default: 
        if ( $node->type_name == "void" ) {
          $wr->out("void", false);
        } else {
          $wr->out($this->getTypeString($node->type_name), false);
        }
        break;
    }
    if ( $node->hasFlag("optional") ) {
      $wr->out("?", false);
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i > 0 ) {
          $wr->out(".", false);
        }
        if ( $i == 0 ) {
          if ( $p->nameNode->hasFlag("optional") ) {
          }
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        $wr->out(".", false);
      }
      $wr->out($this->adjustType($part), false);
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out("", false);
      } else {
        $wr->out("const ", false);
      }
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      $wr->out(" ", false);
      $wr->out($p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = new ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = new ", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out("()", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ;", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(",", false);
      }
      $wr->out(" ", false);
      $this->writeTypeDef($arg->nameNode, $ctx, $wr);
      $wr->out((" " . $arg->name) . " ", false);
    }
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr = $orig_wr->getFileWriter(".", ($cl->name . ".cs"));
    $importFork = $wr->fork();
    $wr->out("", true);
    $wr->out(("class " . $cl->name) . " {", true);
    $wr->indent(1);
    for ( $i = 0; $i < count($cl->variables); $i++) {
      $pvar = $cl->variables[$i];
      $wr->out("public ", false);
      $this->writeVarDef($pvar->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $wr->out("", true);
      $wr->out($cl->name . "(", false);
      $this->writeArgsDef($constr, $ctx, $wr);
      $wr->out(" ) {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx = $constr->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr->fnBody, $subCtx, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_1 = 0; $i_1 < count($cl->static_methods); $i_1++) {
      $variant = $cl->static_methods[$i_1];
      $wr->out("", true);
      if ( $variant->nameNode->hasFlag("main") && ($variant->nameNode->code->filename != $ctx->getRootFile()) ) {
        continue;
      }
      if ( $variant->nameNode->hasFlag("main") ) {
        $wr->out("static int Main( string [] args ) {", true);
      } else {
        $wr->out("public static ", false);
        $this->writeTypeDef($variant->nameNode, $ctx, $wr);
        $wr->out(" ", false);
        $wr->out($variant->name . "(", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") {", true);
      }
      $wr->indent(1);
      $wr->newline();
      $subCtx_1 = $variant->fnCtx;
      $subCtx_1->is_function = true;
      $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_2 = 0; $i_2 < count($cl->defined_variants); $i_2++) {
      $fnVar = $cl->defined_variants[$i_2];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_3 = 0; $i_3 < count($mVs->variants); $i_3++) {
        $variant_1 = $mVs->variants[$i_3];
        $wr->out("", true);
        $wr->out("public ", false);
        $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
        $wr->out(" ", false);
        $wr->out($variant_1->name . "(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(") {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_2 = $variant_1->fnCtx;
        $subCtx_2->is_function = true;
        $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    $import_list = $wr->getImports();
    for ( $i_4 = 0; $i_4 < count($import_list); $i_4++) {
      $codeStr = $import_list[$i_4];
      $importFork->out(("using " . $codeStr) . ";", true);
    }
  }
}
class RangerScalaClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    switch ($type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
      case "chararray" : 
        return "Array[Byte]";
        break;
      case "char" : 
        return "byte";
        break;
    }
    return $type_string;
  }
  
  function getTypeString( $type_string ) {
    switch ($type_string ) { 
      case "int" : 
        return "Int";
        break;
      case "string" : 
        return "String";
        break;
      case "boolean" : 
        return "Boolean";
        break;
      case "double" : 
        return "Double";
        break;
      case "chararray" : 
        return "Array[Byte]";
        break;
      case "char" : 
        return "byte";
        break;
    }
    return $type_string;
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    if ( $node->hasFlag("optional") ) {
      $wr->out("Option[", false);
    }
    $v_type = $node->value_type;
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
    }
    switch ($v_type ) { 
      case 11 : 
        $wr->out("Int", false);
        break;
      case 3 : 
        $wr->out("Int", false);
        break;
      case 2 : 
        $wr->out("Double", false);
        break;
      case 4 : 
        $wr->out("String", false);
        break;
      case 5 : 
        $wr->out("Boolean", false);
        break;
      case 12 : 
        $wr->out("Byte", false);
        break;
      case 13 : 
        $wr->out("Array[Byte]", false);
        break;
      case 7 : 
        $wr->addImport("scala.collection.mutable");
        $wr->out(((("collection.mutable.HashMap[" . $this->getObjectTypeString($node->key_type, $ctx)) . ", ") . $this->getObjectTypeString($node->array_type, $ctx)) . "]", false);
        break;
      case 6 : 
        $wr->addImport("scala.collection.mutable");
        $wr->out(("collection.mutable.ArrayBuffer[" . $this->getObjectTypeString($node->array_type, $ctx)) . "]", false);
        break;
      default: 
        if ( $node->type_name == "void" ) {
          $wr->out("Unit", false);
          return;
        }
        $wr->out($this->getTypeString($node->type_name), false);
        break;
    }
    if ( $node->hasFlag("optional") ) {
      $wr->out("]", false);
    }
  }
  
  function writeTypeDefNoOption( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
    }
    switch ($v_type ) { 
      case 11 : 
        $wr->out("Int", false);
        break;
      case 3 : 
        $wr->out("Int", false);
        break;
      case 2 : 
        $wr->out("Double", false);
        break;
      case 4 : 
        $wr->out("String", false);
        break;
      case 5 : 
        $wr->out("Boolean", false);
        break;
      case 12 : 
        $wr->out("Byte", false);
        break;
      case 13 : 
        $wr->out("Array[Byte]", false);
        break;
      case 7 : 
        $wr->addImport("scala.collection.mutable");
        $wr->out(((("collection.mutable.HashMap[" . $this->getObjectTypeString($node->key_type, $ctx)) . ", ") . $this->getObjectTypeString($node->array_type, $ctx)) . "]", false);
        break;
      case 6 : 
        $wr->addImport("scala.collection.mutable");
        $wr->out(("collection.mutable.ArrayBuffer[" . $this->getObjectTypeString($node->array_type, $ctx)) . "]", false);
        break;
      default: 
        if ( $node->type_name == "void" ) {
          $wr->out("Unit", false);
          return;
        }
        $wr->out($this->getTypeString($node->type_name), false);
        break;
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i > 0 ) {
          $wr->out(".", false);
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
        if ( $i == 0 ) {
          if ( $p->nameNode->hasFlag("optional") ) {
            $wr->out(".get", false);
          }
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        $wr->out(".", false);
      }
      $wr->out($this->adjustType($part), false);
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $p = $node->paramDesc;
      /** unused:  $nn = $node->children[1]   **/ ;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused ", false);
      }
      if ( ($p->set_cnt > 0) || $p->is_class_variable ) {
        $wr->out(("var " . $p->compiledName) . " : ", false);
      } else {
        $wr->out(("val " . $p->compiledName) . " : ", false);
      }
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        $b_inited = false;
        if ( $p->nameNode->value_type == 6 ) {
          $b_inited = true;
          $wr->out("= new collection.mutable.ArrayBuffer()", false);
        }
        if ( $p->nameNode->value_type == 7 ) {
          $b_inited = true;
          $wr->out("= new collection.mutable.HashMap()", false);
        }
        if ( $p->nameNode->hasFlag("optional") ) {
          $wr->out(" = Option.empty[", false);
          $this->writeTypeDefNoOption($p->nameNode, $ctx, $wr);
          $wr->out("]", false);
        } else {
          if ( $b_inited == false ) {
            $wr->out(" = _", false);
          }
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("**/ ", true);
      } else {
        $wr->newline();
      }
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(",", false);
      }
      $wr->out(" ", false);
      $wr->out($arg->name . " : ", false);
      $this->writeTypeDef($arg->nameNode, $ctx, $wr);
    }
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr = $orig_wr->getFileWriter(".", ($cl->name . ".scala"));
    $importFork = $wr->fork();
    $wr->out("", true);
    $wr->out(("class " . $cl->name) . " ", false);
    if ( $cl->has_constructor ) {
      $wr->out("(", false);
      $constr = $cl->constructor_fn;
      for ( $i = 0; $i < count($constr->params); $i++) {
        $arg = $constr->params[$i];
        if ( $i > 0 ) {
          $wr->out(", ", false);
        }
        $wr->out($arg->name . " : ", false);
        $this->writeTypeDef($arg->nameNode, $ctx, $wr);
      }
      $wr->out(")", false);
    }
    $wr->out(" {", true);
    $wr->indent(1);
    for ( $i_1 = 0; $i_1 < count($cl->variables); $i_1++) {
      $pvar = $cl->variables[$i_1];
      $this->writeVarDef($pvar->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr_1 = $cl->constructor_fn;
      $wr->newline();
      $subCtx = $constr_1->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr_1->fnBody, $subCtx, $wr);
      $wr->newline();
    }
    for ( $i_2 = 0; $i_2 < count($cl->defined_variants); $i_2++) {
      $fnVar = $cl->defined_variants[$i_2];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_3 = 0; $i_3 < count($mVs->variants); $i_3++) {
        $variant = $mVs->variants[$i_3];
        $wr->out("", true);
        $wr->out("def ", false);
        $wr->out(" ", false);
        $wr->out($variant->name . "(", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") : ", false);
        $this->writeTypeDef($variant->nameNode, $ctx, $wr);
        $wr->out(" = {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_1 = $variant->fnCtx;
        $subCtx_1->is_function = true;
        $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    $b_had_app = false;
    $app_obj;
    if ( (count($cl->static_methods)) > 0 ) {
      $wr->out("", true);
      $wr->out("// companion object for static methods of " . $cl->name, true);
      $wr->out(("object " . $cl->name) . " {", true);
      $wr->indent(1);
    }
    for ( $i_4 = 0; $i_4 < count($cl->static_methods); $i_4++) {
      $variant_1 = $cl->static_methods[$i_4];
      if ( $variant_1->nameNode->hasFlag("main") ) {
        $b_had_app = true;
        $app_obj = $variant_1;
        continue;
      }
      $wr->out("", true);
      $wr->out("def ", false);
      $wr->out(" ", false);
      $wr->out($variant_1->name . "(", false);
      $this->writeArgsDef($variant_1, $ctx, $wr);
      $wr->out(") : ", false);
      $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
      $wr->out(" = {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx_2 = $variant_1->fnCtx;
      $subCtx_2->is_function = true;
      $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    if ( (count($cl->static_methods)) > 0 ) {
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    if ( $b_had_app ) {
      $variant_2 = $app_obj;
      $wr->out("", true);
      $wr->out("// application main function for " . $cl->name, true);
      $wr->out(("object App" . $cl->name) . " extends App {", true);
      $wr->indent(1);
      $wr->indent(1);
      $wr->newline();
      $subCtx_3 = $variant_2->fnCtx;
      $subCtx_3->is_function = true;
      $this->WalkNode($variant_2->fnBody, $subCtx_3, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    $import_list = $wr->getImports();
    for ( $i_5 = 0; $i_5 < count($import_list); $i_5++) {
      $codeStr = $import_list[$i_5];
      $importFork->out(("import " . $codeStr) . ";", true);
    }
  }
}
class RangerGolangClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  var $thisName;
  var $write_raw_type;
  var $did_write_nullable;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
    $this->thisName = "this";
    $this->write_raw_type = false;
    $this->did_write_nullable = false;
  }
  
  function WriteScalarValue( $node , $ctx , $wr ) {
    switch ($node->value_type ) { 
      case 2 : 
        $wr->out($node->getParsedString(), false);
        break;
      case 4 : 
        $s = $this->EncodeString($node, $ctx, $wr);
        $wr->out(("\"" . $s) . "\"", false);
        break;
      case 3 : 
        $wr->out("" . $node->int_value, false);
        break;
      case 5 : 
        if ( $node->boolean_value ) {
          $wr->out("true", false);
        } else {
          $wr->out("false", false);
        }
        break;
    }
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    if ( $type_string == "this" ) {
      return $this->thisName;
    }
    if ( $ctx->isDefinedClass($type_string) ) {
      $cc = $ctx->findClass($type_string);
      if ( $cc->doesInherit() ) {
        return "IFACE_" . $ctx->transformTypeName($type_string);
      }
    }
    switch ($type_string ) { 
      case "int" : 
        return "int64";
        break;
      case "string" : 
        return "string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "float64";
        break;
      case "char" : 
        return "byte";
        break;
      case "charbuffer" : 
        return "[]byte";
        break;
    }
    return $ctx->transformTypeName($type_string);
  }
  
  function getTypeString2( $type_string , $ctx ) {
    if ( $type_string == "this" ) {
      return $this->thisName;
    }
    switch ($type_string ) { 
      case "int" : 
        return "int64";
        break;
      case "string" : 
        return "string";
        break;
      case "boolean" : 
        return "bool";
        break;
      case "double" : 
        return "float64";
        break;
      case "char" : 
        return "byte";
        break;
      case "charbuffer" : 
        return "[]byte";
        break;
    }
    return $ctx->transformTypeName($type_string);
  }
  
  function writeRawTypeDef( $node , $ctx , $wr ) {
    $this->write_raw_type = true;
    $this->writeTypeDef($node, $ctx, $wr);
    $this->write_raw_type = false;
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $this->writeTypeDef2($node, $ctx, $wr);
  }
  
  function writeArrayTypeDef( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    $a_name = $node->array_type;
    if ( (($v_type == 8) || ($v_type == 9)) || ($v_type == 0) ) {
      $v_type = $node->typeNameAsType($ctx);
    }
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
      if ( (strlen($node->eval_array_type)) > 0 ) {
        $a_name = $node->eval_array_type;
      }
    }
    switch ($v_type ) { 
      case 7 : 
        if ( $ctx->isDefinedClass($a_name) ) {
          $cc = $ctx->findClass($a_name);
          if ( $cc->doesInherit() ) {
            $wr->out("IFACE_" . $this->getTypeString2($a_name, $ctx), false);
            return;
          }
        }
        if ( $ctx->isPrimitiveType($a_name) == false ) {
          $wr->out("*", false);
        }
        $wr->out($this->getObjectTypeString($a_name, $ctx) . "", false);
        break;
      case 6 : 
        if ( $ctx->isDefinedClass($a_name) ) {
          $cc_1 = $ctx->findClass($a_name);
          if ( $cc_1->doesInherit() ) {
            $wr->out("IFACE_" . $this->getTypeString2($a_name, $ctx), false);
            return;
          }
        }
        if ( ($this->write_raw_type == false) && ($ctx->isPrimitiveType($a_name) == false) ) {
          $wr->out("*", false);
        }
        $wr->out($this->getObjectTypeString($a_name, $ctx) . "", false);
        break;
      default: 
        break;
    }
  }
  
  function writeTypeDef2( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    $t_name = $node->type_name;
    $a_name = $node->array_type;
    $k_name = $node->key_type;
    if ( (($v_type == 8) || ($v_type == 9)) || ($v_type == 0) ) {
      $v_type = $node->typeNameAsType($ctx);
    }
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
      if ( (strlen($node->eval_type_name)) > 0 ) {
        $t_name = $node->eval_type_name;
      }
      if ( (strlen($node->eval_array_type)) > 0 ) {
        $a_name = $node->eval_array_type;
      }
      if ( (strlen($node->eval_key_type)) > 0 ) {
        $k_name = $node->eval_key_type;
      }
    }
    switch ($v_type ) { 
      case 15 : 
        $rv = $node->expression_value->children[0];
        $sec = $node->expression_value->children[1];
        /** unused:  $fc = $sec->getFirst()   **/ ;
        $wr->out("func(", false);
        for ( $i = 0; $i < count($sec->children); $i++) {
          $arg = $sec->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          $this->writeTypeDef2($arg, $ctx, $wr);
        }
        $wr->out(") ", false);
        $this->writeTypeDef2($rv, $ctx, $wr);
        break;
      case 11 : 
        $wr->out("int64", false);
        break;
      case 3 : 
        $wr->out("int64", false);
        break;
      case 2 : 
        $wr->out("float64", false);
        break;
      case 4 : 
        $wr->out("string", false);
        break;
      case 5 : 
        $wr->out("bool", false);
        break;
      case 12 : 
        $wr->out("byte", false);
        break;
      case 13 : 
        $wr->out("[]byte", false);
        break;
      case 7 : 
        if ( $this->write_raw_type ) {
          $wr->out($this->getObjectTypeString($a_name, $ctx) . "", false);
        } else {
          $wr->out(("map[" . $this->getObjectTypeString($k_name, $ctx)) . "]", false);
          if ( $ctx->isDefinedClass($a_name) ) {
            $cc = $ctx->findClass($a_name);
            if ( $cc->doesInherit() ) {
              $wr->out("IFACE_" . $this->getTypeString2($a_name, $ctx), false);
              return;
            }
          }
          if ( ($this->write_raw_type == false) && ($ctx->isPrimitiveType($a_name) == false) ) {
            $wr->out("*", false);
          }
          $wr->out($this->getObjectTypeString($a_name, $ctx) . "", false);
        }
        break;
      case 6 : 
        if ( false == $this->write_raw_type ) {
          $wr->out("[]", false);
        }
        if ( $ctx->isDefinedClass($a_name) ) {
          $cc_1 = $ctx->findClass($a_name);
          if ( $cc_1->doesInherit() ) {
            $wr->out("IFACE_" . $this->getTypeString2($a_name, $ctx), false);
            return;
          }
        }
        if ( ($this->write_raw_type == false) && ($ctx->isPrimitiveType($a_name) == false) ) {
          $wr->out("*", false);
        }
        $wr->out($this->getObjectTypeString($a_name, $ctx) . "", false);
        break;
      default: 
        if ( $node->type_name == "void" ) {
          $wr->out("()", false);
          return;
        }
        $b_iface = false;
        if ( $ctx->isDefinedClass($t_name) ) {
          $cc_2 = $ctx->findClass($t_name);
          $b_iface = $cc_2->is_interface;
        }
        if ( $ctx->isDefinedClass($t_name) ) {
          $cc_3 = $ctx->findClass($t_name);
          if ( $cc_3->doesInherit() ) {
            $wr->out("IFACE_" . $this->getTypeString2($t_name, $ctx), false);
            return;
          }
        }
        if ( (($this->write_raw_type == false) && ($node->isPrimitiveType() == false)) && ($b_iface == false) ) {
          $wr->out("*", false);
        }
        $wr->out($this->getTypeString2($t_name, $ctx), false);
        break;
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->vref == "this" ) {
      $wr->out($this->thisName, false);
      return;
    }
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    $next_is_gs = false;
    /** unused:  $last_was_setter = false   **/ ;
    $needs_par = false;
    $ns_last = (count($node->ns)) - 1;
    if ( (count($node->nsp)) > 0 ) {
      $had_static = false;
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $next_is_gs ) {
          if ( $p->isProperty() ) {
            $wr->out(".Get_", false);
            $needs_par = true;
          } else {
            $needs_par = false;
          }
          $next_is_gs = false;
        }
        if ( $needs_par == false ) {
          if ( $i > 0 ) {
            if ( $had_static ) {
              $wr->out("_static_", false);
            } else {
              $wr->out(".", false);
            }
          }
        }
        if ( ((isset($p->nameNode))) && $ctx->isDefinedClass($p->nameNode->type_name) ) {
          $c = $ctx->findClass($p->nameNode->type_name);
          if ( $c->doesInherit() ) {
            $next_is_gs = true;
          }
        }
        if ( $i == 0 ) {
          $part = $node->ns[0];
          if ( $part == "this" ) {
            $wr->out($this->thisName, false);
            continue;
          }
          if ( ($part != $this->thisName) && $ctx->isMemberVariable($part) ) {
            $cc = $ctx->getCurrentClass();
            $currC = $cc;
            $up = $currC->findVariable($part);
            if ( (isset($up)) ) {
              /** unused:  $p3 = $up   **/ ;
              $wr->out($this->thisName . ".", false);
            }
          }
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
        if ( $needs_par ) {
          $wr->out("()", false);
          $needs_par = false;
        }
        if ( (((isset($p->nameNode))) && $p->nameNode->hasFlag("optional")) && ($i != $ns_last) ) {
          $wr->out(".value.(", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out(")", false);
        }
        if ( $p->isClass() ) {
          $had_static = true;
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $part_1 = $node->ns[0];
      if ( ($part_1 != $this->thisName) && $ctx->isMemberVariable($part_1) ) {
        $cc_1 = $ctx->getCurrentClass();
        $currC_1 = $cc_1;
        $up_1 = $currC_1->findVariable($part_1);
        if ( (isset($up_1)) ) {
          /** unused:  $p3_1 = $up_1   **/ ;
          $wr->out($this->thisName . ".", false);
        }
      }
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    $b_was_static = false;
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part_2 = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        if ( ($i_1 == 1) && $b_was_static ) {
          $wr->out("_static_", false);
        } else {
          $wr->out(".", false);
        }
      }
      if ( $i_1 == 0 ) {
        if ( $part_2 == "this" ) {
          $wr->out($this->thisName, false);
          continue;
        }
        if ( $ctx->hasClass($part_2) ) {
          $b_was_static = true;
        }
        if ( ($part_2 != "this") && $ctx->isMemberVariable($part_2) ) {
          $cc_2 = $ctx->getCurrentClass();
          $currC_2 = $cc_2;
          $up_2 = $currC_2->findVariable($part_2);
          if ( (isset($up_2)) ) {
            /** unused:  $p3_2 = $up_2   **/ ;
            $wr->out($this->thisName . ".", false);
          }
        }
      }
      $wr->out($this->adjustType($part_2), false);
    }
  }
  
  function WriteSetterVRef( $node , $ctx , $wr ) {
    if ( $node->vref == "this" ) {
      $wr->out($this->thisName, false);
      return;
    }
    if ( $node->eval_type == 11 ) {
      $rootObjName = $node->ns[0];
      $enumName = $node->ns[1];
      $e = $ctx->getEnum($rootObjName);
      if ( (isset($e)) ) {
        $wr->out("" . (($e->values[$enumName])), false);
        return;
      }
    }
    $next_is_gs = false;
    /** unused:  $last_was_setter = false   **/ ;
    $needs_par = false;
    $ns_len = (count($node->ns)) - 1;
    if ( (count($node->nsp)) > 0 ) {
      $had_static = false;
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $next_is_gs ) {
          if ( $p->isProperty() ) {
            $wr->out(".Get_", false);
            $needs_par = true;
          } else {
            $needs_par = false;
          }
          $next_is_gs = false;
        }
        if ( $needs_par == false ) {
          if ( $i > 0 ) {
            if ( $had_static ) {
              $wr->out("_static_", false);
            } else {
              $wr->out(".", false);
            }
          }
        }
        if ( $ctx->isDefinedClass($p->nameNode->type_name) ) {
          $c = $ctx->findClass($p->nameNode->type_name);
          if ( $c->doesInherit() ) {
            $next_is_gs = true;
          }
        }
        if ( $i == 0 ) {
          $part = $node->ns[0];
          if ( $part == "this" ) {
            $wr->out($this->thisName, false);
            continue;
          }
          if ( ($part != $this->thisName) && $ctx->isMemberVariable($part) ) {
            $cc = $ctx->getCurrentClass();
            $currC = $cc;
            $up = $currC->findVariable($part);
            if ( (isset($up)) ) {
              /** unused:  $p3 = $up   **/ ;
              $wr->out($this->thisName . ".", false);
            }
          }
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
        if ( $needs_par ) {
          $wr->out("()", false);
          $needs_par = false;
        }
        if ( $i < $ns_len ) {
          if ( $p->nameNode->hasFlag("optional") ) {
            $wr->out(".value.(", false);
            $this->writeTypeDef($p->nameNode, $ctx, $wr);
            $wr->out(")", false);
          }
        }
        if ( $p->isClass() ) {
          $had_static = true;
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $part_1 = $node->ns[0];
      if ( ($part_1 != $this->thisName) && $ctx->isMemberVariable($part_1) ) {
        $cc_1 = $ctx->getCurrentClass();
        $currC_1 = $cc_1;
        $up_1 = $currC_1->findVariable($part_1);
        if ( (isset($up_1)) ) {
          /** unused:  $p3_1 = $up_1   **/ ;
          $wr->out($this->thisName . ".", false);
        }
      }
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    $b_was_static = false;
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part_2 = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        if ( ($i_1 == 1) && $b_was_static ) {
          $wr->out("_static_", false);
        } else {
          $wr->out(".", false);
        }
      }
      if ( $i_1 == 0 ) {
        if ( $part_2 == "this" ) {
          $wr->out($this->thisName, false);
          continue;
        }
        if ( $ctx->hasClass($part_2) ) {
          $b_was_static = true;
        }
        if ( ($part_2 != "this") && $ctx->isMemberVariable($part_2) ) {
          $cc_2 = $ctx->getCurrentClass();
          $currC_2 = $cc_2;
          $up_2 = $currC_2->findVariable($part_2);
          if ( (isset($up_2)) ) {
            /** unused:  $p3_2 = $up_2   **/ ;
            $wr->out($this->thisName . ".", false);
          }
        }
      }
      $wr->out($this->adjustType($part_2), false);
    }
  }
  
  function goExtractAssign( $value , $p , $ctx , $wr ) {
    $arr_node = $value->children[1];
    $wr->newline();
    $wr->out("", true);
    $wr->out("// array_extract operator ", true);
    $wr->out("var ", false);
    $pArr =  new RangerAppParamDesc();
    $pArr->name = "_arrTemp";
    $pArr->node = $arr_node;
    $pArr->nameNode = $arr_node;
    $pArr->is_optional = false;
    $ctx->defineVariable($p->name, $pArr);
    $wr->out($pArr->compiledName, false);
    $wr->out(" ", false);
    $this->writeTypeDef($arr_node, $ctx, $wr);
    $wr->newline();
    $wr->out((($p->compiledName . " , ") . $pArr->compiledName) . " = ", false);
    $ctx->setInExpr();
    $this->WalkNode($value, $ctx, $wr);
    $ctx->unsetInExpr();
    $wr->out(";", true);
    $left = $arr_node;
    $a_len = (count($left->ns)) - 1;
    /** unused:  $last_part = $left->ns[$a_len]   **/ ;
    $next_is_gs = false;
    $last_was_setter = false;
    $needs_par = false;
    $b_was_static = false;
    for ( $i = 0; $i < count($left->ns); $i++) {
      $part = $left->ns[$i];
      if ( $next_is_gs ) {
        if ( $i == $a_len ) {
          $wr->out(".Set_", false);
          $last_was_setter = true;
        } else {
          $wr->out(".Get_", false);
          $needs_par = true;
          $next_is_gs = false;
          $last_was_setter = false;
        }
      }
      if ( ($last_was_setter == false) && ($needs_par == false) ) {
        if ( $i > 0 ) {
          if ( ($i == 1) && $b_was_static ) {
            $wr->out("_static_", false);
          } else {
            $wr->out(".", false);
          }
        }
      }
      if ( $i == 0 ) {
        if ( $part == "this" ) {
          $wr->out($this->thisName, false);
          continue;
        }
        if ( $ctx->hasClass($part) ) {
          $b_was_static = true;
        }
        $partDef = $ctx->getVariableDef($part);
        if ( (isset($partDef->nameNode)) ) {
          if ( $ctx->isDefinedClass($partDef->nameNode->type_name) ) {
            $c = $ctx->findClass($partDef->nameNode->type_name);
            if ( $c->doesInherit() ) {
              $next_is_gs = true;
            }
          }
        }
        if ( ($part != "this") && $ctx->isMemberVariable($part) ) {
          $cc = $ctx->getCurrentClass();
          $currC = $cc;
          $up = $currC->findVariable($part);
          if ( (isset($up)) ) {
            /** unused:  $p3 = $up   **/ ;
            $wr->out($this->thisName . ".", false);
          }
        }
      }
      if ( (count($left->nsp)) > 0 ) {
        $p_1 = $left->nsp[$i];
        $wr->out($this->adjustType($p_1->compiledName), false);
      } else {
        if ( $left->hasParamDesc ) {
          $wr->out($left->paramDesc->compiledName, false);
        } else {
          $wr->out($this->adjustType($part), false);
        }
      }
      if ( $needs_par ) {
        $wr->out("()", false);
        $needs_par = false;
      }
      if ( (count($left->nsp)) >= ($i + 1) ) {
        $pp = $left->nsp[$i];
        if ( $pp->nameNode->hasFlag("optional") ) {
          $wr->out(".value.(", false);
          $this->writeTypeDef($pp->nameNode, $ctx, $wr);
          $wr->out(")", false);
        }
      }
    }
    if ( $last_was_setter ) {
      $wr->out("(", false);
      $wr->out($pArr->compiledName, false);
      $wr->out("); ", true);
    } else {
      $wr->out(" = ", false);
      $wr->out($pArr->compiledName, false);
      $wr->out("; ", true);
    }
    $wr->out("", true);
  }
  
  function writeStructField( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      $wr->out($p->compiledName . " ", false);
      if ( $p->nameNode->hasFlag("optional") ) {
        $wr->out("*GoNullable", false);
      } else {
        $this->writeTypeDef($p->nameNode, $ctx, $wr);
      }
      if ( $p->ref_cnt == 0 ) {
        $wr->out(" /**  unused  **/ ", false);
      }
      $wr->out("", true);
      if ( $p->nameNode->hasFlag("optional") ) {
      }
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      $b_not_used = false;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out(("/** unused:  " . $p->compiledName) . "*/", true);
        $b_not_used = true;
        return;
      }
      $map_or_hash = ($nn->value_type == 6) || ($nn->value_type == 7);
      if ( $nn->hasFlag("optional") ) {
        $wr->out(("var " . $p->compiledName) . " *GoNullable = new(GoNullable); ", true);
        if ( (count($node->children)) > 2 ) {
          $value = $node->children[2];
          if ( $value->hasParamDesc ) {
            $pnn = $value->paramDesc->nameNode;
            if ( $pnn->hasFlag("optional") ) {
              $wr->out($p->compiledName . ".value = ", false);
              $ctx->setInExpr();
              $value_1 = $node->getThird();
              $this->WalkNode($value_1, $ctx, $wr);
              $ctx->unsetInExpr();
              $wr->out(".value;", true);
              $wr->out($p->compiledName . ".has_value = ", false);
              $ctx->setInExpr();
              $value_2 = $node->getThird();
              $this->WalkNode($value_2, $ctx, $wr);
              $ctx->unsetInExpr();
              $wr->out(".has_value;", true);
              return;
            } else {
              $wr->out($p->compiledName . ".value = ", false);
              $ctx->setInExpr();
              $value_3 = $node->getThird();
              $this->WalkNode($value_3, $ctx, $wr);
              $ctx->unsetInExpr();
              $wr->out(";", true);
              $wr->out($p->compiledName . ".has_value = true;", true);
              return;
            }
          } else {
            $wr->out($p->compiledName . " = ", false);
            $ctx->setInExpr();
            $value_4 = $node->getThird();
            $this->WalkNode($value_4, $ctx, $wr);
            $ctx->unsetInExpr();
            $wr->out(";", true);
            return;
          }
        }
        return;
      } else {
        if ( (($p->set_cnt > 0) || $p->is_class_variable) || $map_or_hash ) {
          $wr->out(("var " . $p->compiledName) . " ", false);
        } else {
          $wr->out(("var " . $p->compiledName) . " ", false);
        }
      }
      $this->writeTypeDef2($p->nameNode, $ctx, $wr);
      if ( (count($node->children)) > 2 ) {
        $value_5 = $node->getThird();
        if ( $value_5->expression && ((count($value_5->children)) > 1) ) {
          $fc = $value_5->children[0];
          if ( $fc->vref == "array_extract" ) {
            $this->goExtractAssign($value_5, $p, $ctx, $wr);
            return;
          }
        }
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $this->WalkNode($value_5, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = make(", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out(", 0)", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = make(", false);
          $this->writeTypeDef($p->nameNode, $ctx, $wr);
          $wr->out(")", false);
        }
      }
      $wr->out(";", false);
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ", true);
      } else {
        $wr->newline();
      }
      if ( $b_not_used == false ) {
        if ( $nn->hasFlag("optional") ) {
          $wr->addImport("errors");
        }
      }
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $wr->out($arg->name . " ", false);
      if ( $arg->nameNode->hasFlag("optional") ) {
        $wr->out("*GoNullable", false);
      } else {
        $this->writeTypeDef($arg->nameNode, $ctx, $wr);
      }
    }
  }
  
  function writeNewCall( $node , $ctx , $wr ) {
    if ( $node->hasNewOper ) {
      $cl = $node->clDesc;
      /** unused:  $fc = $node->getSecond()   **/ ;
      $wr->out(("CreateNew_" . $node->clDesc->name) . "(", false);
      $constr = $cl->constructor_fn;
      $givenArgs = $node->getThird();
      if ( (isset($constr)) ) {
        for ( $i = 0; $i < count($constr->params); $i++) {
          $arg = $constr->params[$i];
          $n = $givenArgs->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          if ( true || ((isset($arg->nameNode))) ) {
            $this->WalkNode($n, $ctx, $wr);
          }
        }
      }
      $wr->out(")", false);
    }
  }
  
  function CreateLambdaCall( $node , $ctx , $wr ) {
    $fName = $node->children[0];
    $args = $node->children[1];
    $this->WriteVRef($fName, $ctx, $wr);
    $wr->out("(", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      if ( $arg->value_type != 0 ) {
        $this->WalkNode($arg, $ctx, $wr);
      }
    }
    $wr->out(")", false);
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->out(";", true);
    }
  }
  
  function CreateLambda( $node , $ctx , $wr ) {
    $lambdaCtx = $node->lambda_ctx;
    $fnNode = $node->children[0];
    $args = $node->children[1];
    $body = $node->children[2];
    $wr->out("func (", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $this->WalkNode($arg, $lambdaCtx, $wr);
      $wr->out(" ", false);
      if ( $arg->hasFlag("optional") ) {
        $wr->out("*GoNullable", false);
      } else {
        $this->writeTypeDef($arg, $lambdaCtx, $wr);
      }
    }
    $wr->out(") ", false);
    if ( $fnNode->hasFlag("optional") ) {
      $wr->out("*GoNullable", false);
    } else {
      $this->writeTypeDef($fnNode, $lambdaCtx, $wr);
    }
    $wr->out(" {", true);
    $wr->indent(1);
    $lambdaCtx->restartExpressionLevel();
    for ( $i_1 = 0; $i_1 < count($body->children); $i_1++) {
      $item = $body->children[$i_1];
      $this->WalkNode($item, $lambdaCtx, $wr);
    }
    $wr->newline();
    $wr->indent(-1);
    $wr->out("}", false);
  }
  
  function CustomOperator( $node , $ctx , $wr ) {
    $fc = $node->getFirst();
    $cmd = $fc->vref;
    if ( (($cmd == "=") || ($cmd == "push")) || ($cmd == "removeLast") ) {
      $left = $node->getSecond();
      $right = $left;
      if ( ($cmd == "=") || ($cmd == "push") ) {
        $right = $node->getThird();
      }
      $wr->newline();
      $b_was_static = false;
      if ( $left->hasParamDesc ) {
        $a_len = (count($left->ns)) - 1;
        /** unused:  $last_part = $left->ns[$a_len]   **/ ;
        $next_is_gs = false;
        $last_was_setter = false;
        $needs_par = false;
        for ( $i = 0; $i < count($left->ns); $i++) {
          $part = $left->ns[$i];
          if ( $next_is_gs ) {
            if ( $i == $a_len ) {
              $wr->out(".Set_", false);
              $last_was_setter = true;
            } else {
              $wr->out(".Get_", false);
              $needs_par = true;
              $next_is_gs = false;
              $last_was_setter = false;
            }
          }
          if ( ($last_was_setter == false) && ($needs_par == false) ) {
            if ( $i > 0 ) {
              if ( ($i == 1) && $b_was_static ) {
                $wr->out("_static_", false);
              } else {
                $wr->out(".", false);
              }
            }
          }
          if ( $i == 0 ) {
            if ( $part == "this" ) {
              $wr->out($this->thisName, false);
              continue;
            }
            if ( $ctx->hasClass($part) ) {
              $b_was_static = true;
            }
            if ( ($part != "this") && $ctx->isMemberVariable($part) ) {
              $cc = $ctx->getCurrentClass();
              $currC = $cc;
              $up = $currC->findVariable($part);
              if ( (isset($up)) ) {
                /** unused:  $p3 = $up   **/ ;
                $wr->out($this->thisName . ".", false);
              }
            }
          }
          $partDef = $ctx->getVariableDef($part);
          if ( (count($left->nsp)) > $i ) {
            $partDef = $left->nsp[$i];
          }
          if ( (isset($partDef->nameNode)) ) {
            if ( $ctx->isDefinedClass($partDef->nameNode->type_name) ) {
              $c = $ctx->findClass($partDef->nameNode->type_name);
              if ( $c->doesInherit() ) {
                $next_is_gs = true;
              }
            }
          }
          if ( (count($left->nsp)) > 0 ) {
            $p = $left->nsp[$i];
            $wr->out($this->adjustType($p->compiledName), false);
          } else {
            if ( $left->hasParamDesc ) {
              $wr->out($left->paramDesc->compiledName, false);
            } else {
              $wr->out($this->adjustType($part), false);
            }
          }
          if ( $needs_par ) {
            $wr->out("()", false);
            $needs_par = false;
          }
          if ( (count($left->nsp)) >= ($i + 1) ) {
            $pp = $left->nsp[$i];
            if ( $pp->nameNode->hasFlag("optional") ) {
              $wr->out(".value.(", false);
              $this->writeTypeDef($pp->nameNode, $ctx, $wr);
              $wr->out(")", false);
            }
          }
        }
        if ( $cmd == "removeLast" ) {
          if ( $last_was_setter ) {
            $wr->out("(", false);
            $ctx->setInExpr();
            $this->WalkNode($left, $ctx, $wr);
            $wr->out("[:len(", false);
            $this->WalkNode($left, $ctx, $wr);
            $wr->out(")-1]", false);
            $ctx->unsetInExpr();
            $wr->out("); ", true);
          } else {
            $wr->out(" = ", false);
            $ctx->setInExpr();
            $this->WalkNode($left, $ctx, $wr);
            $wr->out("[:len(", false);
            $this->WalkNode($left, $ctx, $wr);
            $wr->out(")-1]", false);
            $ctx->unsetInExpr();
            $wr->out("; ", true);
          }
          return;
        }
        if ( $cmd == "push" ) {
          if ( $last_was_setter ) {
            $wr->out("(", false);
            $ctx->setInExpr();
            $wr->out("append(", false);
            $this->WalkNode($left, $ctx, $wr);
            $wr->out(",", false);
            $this->WalkNode($right, $ctx, $wr);
            $ctx->unsetInExpr();
            $wr->out(")); ", true);
          } else {
            $wr->out(" = ", false);
            $wr->out("append(", false);
            $ctx->setInExpr();
            $this->WalkNode($left, $ctx, $wr);
            $wr->out(",", false);
            $this->WalkNode($right, $ctx, $wr);
            $ctx->unsetInExpr();
            $wr->out("); ", true);
          }
          return;
        }
        if ( $last_was_setter ) {
          $wr->out("(", false);
          $ctx->setInExpr();
          $this->WalkNode($right, $ctx, $wr);
          $ctx->unsetInExpr();
          $wr->out("); ", true);
        } else {
          $wr->out(" = ", false);
          $ctx->setInExpr();
          $this->WalkNode($right, $ctx, $wr);
          $ctx->unsetInExpr();
          $wr->out("; ", true);
        }
        return;
      }
      $this->WriteSetterVRef($left, $ctx, $wr);
      $wr->out(" = ", false);
      $ctx->setInExpr();
      $this->WalkNode($right, $ctx, $wr);
      $ctx->unsetInExpr();
      $wr->out("; /* custom */", true);
    }
  }
  
  function writeInterface( $cl , $ctx , $wr ) {
    $wr->out(("type " . $cl->name) . " interface { ", true);
    $wr->indent(1);
    for ( $i = 0; $i < count($cl->defined_variants); $i++) {
      $fnVar = $cl->defined_variants[$i];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_1 = 0; $i_1 < count($mVs->variants); $i_1++) {
        $variant = $mVs->variants[$i_1];
        $wr->out($variant->compiledName . "(", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") ", false);
        if ( $variant->nameNode->hasFlag("optional") ) {
          $wr->out("*GoNullable", false);
        } else {
          $this->writeTypeDef($variant->nameNode, $ctx, $wr);
        }
        $wr->out("", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr = $orig_wr;
    if ( $this->did_write_nullable == false ) {
      $wr->raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
      $wr->createTag("utilities");
      $this->did_write_nullable = true;
    }
    $declaredVariable = array();
    $wr->out(("type " . $cl->name) . " struct { ", true);
    $wr->indent(1);
    for ( $i = 0; $i < count($cl->variables); $i++) {
      $pvar = $cl->variables[$i];
      $this->writeStructField($pvar->node, $ctx, $wr);
      $declaredVariable[$pvar->name] = true;
    }
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i_1 = 0; $i_1 < count($cl->extends_classes); $i_1++) {
        $pName = $cl->extends_classes[$i_1];
        $pC = $ctx->findClass($pName);
        $wr->out("// inherited from parent class " . $pName, true);
        for ( $i_2 = 0; $i_2 < count($pC->variables); $i_2++) {
          $pvar_1 = $pC->variables[$i_2];
          if ( array_key_exists($pvar_1->name , $declaredVariable ) ) {
            continue;
          }
          $this->writeStructField($pvar_1->node, $ctx, $wr);
        }
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    $wr->out(("type IFACE_" . $cl->name) . " interface { ", true);
    $wr->indent(1);
    for ( $i_3 = 0; $i_3 < count($cl->variables); $i_3++) {
      $p = $cl->variables[$i_3];
      $wr->out("Get_", false);
      $wr->out($p->compiledName . "() ", false);
      if ( $p->nameNode->hasFlag("optional") ) {
        $wr->out("*GoNullable", false);
      } else {
        $this->writeTypeDef($p->nameNode, $ctx, $wr);
      }
      $wr->out("", true);
      $wr->out("Set_", false);
      $wr->out($p->compiledName . "(value ", false);
      if ( $p->nameNode->hasFlag("optional") ) {
        $wr->out("*GoNullable", false);
      } else {
        $this->writeTypeDef($p->nameNode, $ctx, $wr);
      }
      $wr->out(") ", true);
    }
    for ( $i_4 = 0; $i_4 < count($cl->defined_variants); $i_4++) {
      $fnVar = $cl->defined_variants[$i_4];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_5 = 0; $i_5 < count($mVs->variants); $i_5++) {
        $variant = $mVs->variants[$i_5];
        $wr->out($variant->compiledName . "(", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") ", false);
        if ( $variant->nameNode->hasFlag("optional") ) {
          $wr->out("*GoNullable", false);
        } else {
          $this->writeTypeDef($variant->nameNode, $ctx, $wr);
        }
        $wr->out("", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    $this->thisName = "me";
    $wr->out("", true);
    $wr->out(("func CreateNew_" . $cl->name) . "(", false);
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      for ( $i_6 = 0; $i_6 < count($constr->params); $i_6++) {
        $arg = $constr->params[$i_6];
        if ( $i_6 > 0 ) {
          $wr->out(", ", false);
        }
        $wr->out($arg->name . " ", false);
        $this->writeTypeDef($arg->nameNode, $ctx, $wr);
      }
    }
    $wr->out((") *" . $cl->name) . " {", true);
    $wr->indent(1);
    $wr->newline();
    $wr->out(("me := new(" . $cl->name) . ")", true);
    for ( $i_7 = 0; $i_7 < count($cl->variables); $i_7++) {
      $pvar_2 = $cl->variables[$i_7];
      $nn = $pvar_2->node;
      if ( (count($nn->children)) > 2 ) {
        $valueNode = $nn->children[2];
        $wr->out(("me." . $pvar_2->compiledName) . " = ", false);
        $this->WalkNode($valueNode, $ctx, $wr);
        $wr->out("", true);
      } else {
        $pNameN = $pvar_2->nameNode;
        if ( $pNameN->value_type == 6 ) {
          $wr->out(("me." . $pvar_2->compiledName) . " = ", false);
          $wr->out("make(", false);
          $this->writeTypeDef($pvar_2->nameNode, $ctx, $wr);
          $wr->out(",0)", true);
        }
        if ( $pNameN->value_type == 7 ) {
          $wr->out(("me." . $pvar_2->compiledName) . " = ", false);
          $wr->out("make(", false);
          $this->writeTypeDef($pvar_2->nameNode, $ctx, $wr);
          $wr->out(")", true);
        }
      }
    }
    for ( $i_8 = 0; $i_8 < count($cl->variables); $i_8++) {
      $pvar_3 = $cl->variables[$i_8];
      if ( $pvar_3->nameNode->hasFlag("optional") ) {
        $wr->out(("me." . $pvar_3->compiledName) . " = new(GoNullable);", true);
      }
    }
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i_9 = 0; $i_9 < count($cl->extends_classes); $i_9++) {
        $pName_1 = $cl->extends_classes[$i_9];
        $pC_1 = $ctx->findClass($pName_1);
        for ( $i_10 = 0; $i_10 < count($pC_1->variables); $i_10++) {
          $pvar_4 = $pC_1->variables[$i_10];
          $nn_1 = $pvar_4->node;
          if ( (count($nn_1->children)) > 2 ) {
            $valueNode_1 = $nn_1->children[2];
            $wr->out(("me." . $pvar_4->compiledName) . " = ", false);
            $this->WalkNode($valueNode_1, $ctx, $wr);
            $wr->out("", true);
          } else {
            $pNameN_1 = $pvar_4->nameNode;
            if ( $pNameN_1->value_type == 6 ) {
              $wr->out(("me." . $pvar_4->compiledName) . " = ", false);
              $wr->out("make(", false);
              $this->writeTypeDef($pvar_4->nameNode, $ctx, $wr);
              $wr->out(",0)", true);
            }
            if ( $pNameN_1->value_type == 7 ) {
              $wr->out(("me." . $pvar_4->compiledName) . " = ", false);
              $wr->out("make(", false);
              $this->writeTypeDef($pvar_4->nameNode, $ctx, $wr);
              $wr->out(")", true);
            }
          }
        }
        for ( $i_11 = 0; $i_11 < count($pC_1->variables); $i_11++) {
          $pvar_5 = $pC_1->variables[$i_11];
          if ( $pvar_5->nameNode->hasFlag("optional") ) {
            $wr->out(("me." . $pvar_5->compiledName) . " = new(GoNullable);", true);
          }
        }
        if ( $pC_1->has_constructor ) {
          $constr_1 = $pC_1->constructor_fn;
          $subCtx = $constr_1->fnCtx;
          $subCtx->is_function = true;
          $this->WalkNode($constr_1->fnBody, $subCtx, $wr);
        }
      }
    }
    if ( $cl->has_constructor ) {
      $constr_2 = $cl->constructor_fn;
      $subCtx_1 = $constr_2->fnCtx;
      $subCtx_1->is_function = true;
      $this->WalkNode($constr_2->fnBody, $subCtx_1, $wr);
    }
    $wr->out("return me;", true);
    $wr->indent(-1);
    $wr->out("}", true);
    $this->thisName = "this";
    for ( $i_12 = 0; $i_12 < count($cl->static_methods); $i_12++) {
      $variant_1 = $cl->static_methods[$i_12];
      if ( $variant_1->nameNode->hasFlag("main") ) {
        continue;
      }
      $wr->newline();
      $wr->out(((("func " . $cl->name) . "_static_") . $variant_1->compiledName) . "(", false);
      $this->writeArgsDef($variant_1, $ctx, $wr);
      $wr->out(") ", false);
      $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
      $wr->out(" {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx_2 = $variant_1->fnCtx;
      $subCtx_2->is_function = true;
      $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    $declaredFn = array();
    for ( $i_13 = 0; $i_13 < count($cl->defined_variants); $i_13++) {
      $fnVar_1 = $cl->defined_variants[$i_13];
      $mVs_1 = $cl->method_variants[$fnVar_1];
      for ( $i_14 = 0; $i_14 < count($mVs_1->variants); $i_14++) {
        $variant_2 = $mVs_1->variants[$i_14];
        $declaredFn[$variant_2->name] = true;
        $wr->out(((("func (this *" . $cl->name) . ") ") . $variant_2->compiledName) . " (", false);
        $this->writeArgsDef($variant_2, $ctx, $wr);
        $wr->out(") ", false);
        if ( $variant_2->nameNode->hasFlag("optional") ) {
          $wr->out("*GoNullable", false);
        } else {
          $this->writeTypeDef($variant_2->nameNode, $ctx, $wr);
        }
        $wr->out(" {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_3 = $variant_2->fnCtx;
        $subCtx_3->is_function = true;
        $this->WalkNode($variant_2->fnBody, $subCtx_3, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i_15 = 0; $i_15 < count($cl->extends_classes); $i_15++) {
        $pName_2 = $cl->extends_classes[$i_15];
        $pC_2 = $ctx->findClass($pName_2);
        $wr->out("// inherited methods from parent class " . $pName_2, true);
        for ( $i_16 = 0; $i_16 < count($pC_2->defined_variants); $i_16++) {
          $fnVar_2 = $pC_2->defined_variants[$i_16];
          $mVs_2 = $pC_2->method_variants[$fnVar_2];
          for ( $i_17 = 0; $i_17 < count($mVs_2->variants); $i_17++) {
            $variant_3 = $mVs_2->variants[$i_17];
            if ( array_key_exists($variant_3->name , $declaredFn ) ) {
              continue;
            }
            $wr->out(((("func (this *" . $cl->name) . ") ") . $variant_3->compiledName) . " (", false);
            $this->writeArgsDef($variant_3, $ctx, $wr);
            $wr->out(") ", false);
            if ( $variant_3->nameNode->hasFlag("optional") ) {
              $wr->out("*GoNullable", false);
            } else {
              $this->writeTypeDef($variant_3->nameNode, $ctx, $wr);
            }
            $wr->out(" {", true);
            $wr->indent(1);
            $wr->newline();
            $subCtx_4 = $variant_3->fnCtx;
            $subCtx_4->is_function = true;
            $this->WalkNode($variant_3->fnBody, $subCtx_4, $wr);
            $wr->newline();
            $wr->indent(-1);
            $wr->out("}", true);
          }
        }
      }
    }
    $declaredGetter = array();
    for ( $i_18 = 0; $i_18 < count($cl->variables); $i_18++) {
      $p_1 = $cl->variables[$i_18];
      $declaredGetter[$p_1->name] = true;
      $wr->newline();
      $wr->out("// getter for variable " . $p_1->name, true);
      $wr->out(("func (this *" . $cl->name) . ") ", false);
      $wr->out("Get_", false);
      $wr->out($p_1->compiledName . "() ", false);
      if ( $p_1->nameNode->hasFlag("optional") ) {
        $wr->out("*GoNullable", false);
      } else {
        $this->writeTypeDef($p_1->nameNode, $ctx, $wr);
      }
      $wr->out(" {", true);
      $wr->indent(1);
      $wr->out("return this." . $p_1->compiledName, true);
      $wr->indent(-1);
      $wr->out("}", true);
      $wr->newline();
      $wr->out("// setter for variable " . $p_1->name, true);
      $wr->out(("func (this *" . $cl->name) . ") ", false);
      $wr->out("Set_", false);
      $wr->out($p_1->compiledName . "( value ", false);
      if ( $p_1->nameNode->hasFlag("optional") ) {
        $wr->out("*GoNullable", false);
      } else {
        $this->writeTypeDef($p_1->nameNode, $ctx, $wr);
      }
      $wr->out(") ", false);
      $wr->out(" {", true);
      $wr->indent(1);
      $wr->out(("this." . $p_1->compiledName) . " = value ", true);
      $wr->indent(-1);
      $wr->out("}", true);
    }
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i_19 = 0; $i_19 < count($cl->extends_classes); $i_19++) {
        $pName_3 = $cl->extends_classes[$i_19];
        $pC_3 = $ctx->findClass($pName_3);
        $wr->out("// inherited getters and setters from the parent class " . $pName_3, true);
        for ( $i_20 = 0; $i_20 < count($pC_3->variables); $i_20++) {
          $p_2 = $pC_3->variables[$i_20];
          if ( array_key_exists($p_2->name , $declaredGetter ) ) {
            continue;
          }
          $wr->newline();
          $wr->out("// getter for variable " . $p_2->name, true);
          $wr->out(("func (this *" . $cl->name) . ") ", false);
          $wr->out("Get_", false);
          $wr->out($p_2->compiledName . "() ", false);
          if ( $p_2->nameNode->hasFlag("optional") ) {
            $wr->out("*GoNullable", false);
          } else {
            $this->writeTypeDef($p_2->nameNode, $ctx, $wr);
          }
          $wr->out(" {", true);
          $wr->indent(1);
          $wr->out("return this." . $p_2->compiledName, true);
          $wr->indent(-1);
          $wr->out("}", true);
          $wr->newline();
          $wr->out("// getter for variable " . $p_2->name, true);
          $wr->out(("func (this *" . $cl->name) . ") ", false);
          $wr->out("Set_", false);
          $wr->out($p_2->compiledName . "( value ", false);
          if ( $p_2->nameNode->hasFlag("optional") ) {
            $wr->out("*GoNullable", false);
          } else {
            $this->writeTypeDef($p_2->nameNode, $ctx, $wr);
          }
          $wr->out(") ", false);
          $wr->out(" {", true);
          $wr->indent(1);
          $wr->out(("this." . $p_2->compiledName) . " = value ", true);
          $wr->indent(-1);
          $wr->out("}", true);
        }
      }
    }
    for ( $i_21 = 0; $i_21 < count($cl->static_methods); $i_21++) {
      $variant_4 = $cl->static_methods[$i_21];
      if ( $variant_4->nameNode->hasFlag("main") && ($variant_4->nameNode->code->filename == $ctx->getRootFile()) ) {
        $wr->out("func main() {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_5 = $variant_4->fnCtx;
        $subCtx_5->is_function = true;
        $this->WalkNode($variant_4->fnBody, $subCtx_5, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
  }
}
class RangerPHPClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  var $thisName;
  var $wrote_header;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
    $this->thisName = "this";
    $this->wrote_header = false;
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "this";
    }
    return $tn;
  }
  
  function EncodeString( $node , $ctx , $wr ) {
    /** unused:  $encoded_str = ""   **/ ;
    $str_length = strlen($node->string_value);
    $encoded_str_2 = "";
    $ii = 0;
    while ($ii < $str_length) {
      $cc = ord($node->string_value[$ii]);
      switch ($cc ) { 
        case 8 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(98));
          break;
        case 9 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(116));
          break;
        case 10 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(110));
          break;
        case 12 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(102));
          break;
        case 13 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(114));
          break;
        case 34 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(34));
          break;
        case 36 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(34));
          break;
        case 92 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(92));
          break;
        default: 
          $encoded_str_2 = $encoded_str_2 . (chr($cc));
          break;
      }
      $ii = $ii + 1;
    }
    return $encoded_str_2;
  }
  
  function WriteScalarValue( $node , $ctx , $wr ) {
    switch ($node->value_type ) { 
      case 2 : 
        $wr->out("" . $node->double_value, false);
        break;
      case 4 : 
        $s = $this->EncodeString($node, $ctx, $wr);
        $wr->out(("\"" . $s) . "\"", false);
        break;
      case 3 : 
        $wr->out("" . $node->int_value, false);
        break;
      case 5 : 
        if ( $node->boolean_value ) {
          $wr->out("true", false);
        } else {
          $wr->out("false", false);
        }
        break;
    }
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->vref == "this" ) {
      $wr->out("\"this", false);
      return;
    }
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i == 0 ) {
          $part = $node->ns[0];
          if ( $part == "this" ) {
            $wr->out("\"this", false);
            continue;
          }
        }
        if ( $i > 0 ) {
          $wr->out("->", false);
        }
        if ( $i == 0 ) {
          $wr->out("\"", false);
          if ( $p->nameNode->hasFlag("optional") ) {
          }
          $part_1 = $node->ns[0];
          if ( ($part_1 != "this") && $ctx->hasCurrentClass() ) {
            $uc = $ctx->getCurrentClass();
            $currC = $uc;
            $up = $currC->findVariable($part_1);
            if ( (isset($up)) ) {
              if ( false == $ctx->isInStatic() ) {
                $wr->out($this->thisName . "->", false);
              }
            }
          }
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $wr->out("\"", false);
      $part_2 = $node->ns[0];
      if ( ($part_2 != "this") && $ctx->hasCurrentClass() ) {
        $uc_1 = $ctx->getCurrentClass();
        $currC_1 = $uc_1;
        $up_1 = $currC_1->findVariable($part_2);
        if ( (isset($up_1)) ) {
          if ( false == $ctx->isInStatic() ) {
            $wr->out($this->thisName . "->", false);
          }
        }
      }
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    $b_was_static = false;
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part_3 = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        if ( ($i_1 == 1) && $b_was_static ) {
          $wr->out("::", false);
        } else {
          $wr->out("->", false);
        }
      }
      if ( $i_1 == 0 ) {
        if ( $ctx->hasClass($part_3) ) {
          $b_was_static = true;
        } else {
          $wr->out("\"", false);
        }
        if ( ($part_3 != "this") && $ctx->hasCurrentClass() ) {
          $uc_2 = $ctx->getCurrentClass();
          $currC_2 = $uc_2;
          $up_2 = $currC_2->findVariable($part_3);
          if ( (isset($up_2)) ) {
            if ( false == $ctx->isInStatic() ) {
              $wr->out($this->thisName . "->", false);
            }
          }
        }
      }
      $wr->out($this->adjustType($part_3), false);
    }
  }
  
  function writeVarInitDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      $wr->out("\"this->" . $p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = array()", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = array()", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/", true);
        return;
      }
      $wr->out(";", false);
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      $wr->newline();
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      $wr->out("\"" . $p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = array()", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = array()", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ;", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function disabledVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      $wr->out("\"this->" . $p->compiledName, false);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = array()", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = array()", false);
        }
      }
      $wr->out(";", false);
      $wr->newline();
    }
  }
  
  function CreateLambdaCall( $node , $ctx , $wr ) {
    $fName = $node->children[0];
    $givenArgs = $node->children[1];
    $this->WriteVRef($fName, $ctx, $wr);
    $param = $ctx->getVariableDef($fName->vref);
    $args = $param->nameNode->expression_value->children[1];
    $wr->out("(", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      $n = $givenArgs->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      if ( $arg->value_type != 0 ) {
        $this->WalkNode($n, $ctx, $wr);
      }
    }
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->out(");", true);
    } else {
      $wr->out(")", false);
    }
  }
  
  function CreateLambda( $node , $ctx , $wr ) {
    $lambdaCtx = $node->lambda_ctx;
    /** unused:  $fnNode = $node->children[0]   **/ ;
    $args = $node->children[1];
    $body = $node->children[2];
    $wr->out("function (", false);
    for ( $i = 0; $i < count($args->children); $i++) {
      $arg = $args->children[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $this->WalkNode($arg, $lambdaCtx, $wr);
    }
    $wr->out(") ", false);
    $had_capture = false;
    if ( $had_capture ) {
      $wr->out(")", false);
    }
    $wr->out(" {", true);
    $wr->indent(1);
    $lambdaCtx->restartExpressionLevel();
    for ( $i_1 = 0; $i_1 < count($body->children); $i_1++) {
      $item = $body->children[$i_1];
      $this->WalkNode($item, $lambdaCtx, $wr);
    }
    $wr->newline();
    for ( $i_2 = 0; $i_2 < count($lambdaCtx->captured_variables); $i_2++) {
      $cname = $lambdaCtx->captured_variables[$i_2];
      $wr->out("// captured var " . $cname, true);
    }
    $wr->indent(-1);
    $wr->out("}", true);
  }
  
  function writeClassVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      $wr->out(("var \"" . $p->compiledName) . ";", true);
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(",", false);
      }
      $wr->out((" \"" . $arg->name) . " ", false);
    }
  }
  
  function writeFnCall( $node , $ctx , $wr ) {
    if ( $node->hasFnCall ) {
      $fc = $node->getFirst();
      $this->WriteVRef($fc, $ctx, $wr);
      $wr->out("(", false);
      $givenArgs = $node->getSecond();
      $ctx->setInExpr();
      for ( $i = 0; $i < count($node->fnDesc->params); $i++) {
        $arg = $node->fnDesc->params[$i];
        if ( $i > 0 ) {
          $wr->out(", ", false);
        }
        if ( (count($givenArgs->children)) <= $i ) {
          $defVal = $arg->nameNode->getFlag("default");
          if ( (isset($defVal)) ) {
            $fc_1 = $defVal->vref_annotation->getFirst();
            $this->WalkNode($fc_1, $ctx, $wr);
          } else {
            $ctx->addError($node, "Default argument was missing");
          }
          continue;
        }
        $n = $givenArgs->children[$i];
        $this->WalkNode($n, $ctx, $wr);
      }
      $ctx->unsetInExpr();
      $wr->out(")", false);
      if ( $ctx->expressionLevel() == 0 ) {
        $wr->out(";", true);
      }
    }
  }
  
  function writeNewCall( $node , $ctx , $wr ) {
    if ( $node->hasNewOper ) {
      $cl = $node->clDesc;
      /** unused:  $fc = $node->getSecond()   **/ ;
      $wr->out(" new ", false);
      $wr->out($node->clDesc->name, false);
      $wr->out("(", false);
      $constr = $cl->constructor_fn;
      $givenArgs = $node->getThird();
      if ( (isset($constr)) ) {
        for ( $i = 0; $i < count($constr->params); $i++) {
          $arg = $constr->params[$i];
          $n = $givenArgs->children[$i];
          if ( $i > 0 ) {
            $wr->out(", ", false);
          }
          if ( true || ((isset($arg->nameNode))) ) {
            $this->WalkNode($n, $ctx, $wr);
          }
        }
      }
      $wr->out(")", false);
    }
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr = $orig_wr;
    /** unused:  $importFork = $wr->fork()   **/ ;
    for ( $i = 0; $i < count($cl->capturedLocals); $i++) {
      $dd = $cl->capturedLocals[$i];
      if ( $dd->is_class_variable == false ) {
        $wr->out("// local captured " . $dd->name, true);
        $dd->node->disabled_node = true;
        $cl->addVariable($dd);
        $csubCtx = $cl->ctx;
        $csubCtx->defineVariable($dd->name, $dd);
        $dd->is_class_variable = true;
      }
    }
    if ( $this->wrote_header == false ) {
      $wr->out("<? ", true);
      $wr->out("", true);
      $this->wrote_header = true;
    }
    $wr->out("class " . $cl->name, false);
    $parentClass;
    if ( (count($cl->extends_classes)) > 0 ) {
      $wr->out(" extends ", false);
      for ( $i_1 = 0; $i_1 < count($cl->extends_classes); $i_1++) {
        $pName = $cl->extends_classes[$i_1];
        $wr->out($pName, false);
        $parentClass = $ctx->findClass($pName);
      }
    }
    $wr->out(" { ", true);
    $wr->indent(1);
    for ( $i_2 = 0; $i_2 < count($cl->variables); $i_2++) {
      $pvar = $cl->variables[$i_2];
      $this->writeClassVarDef($pvar->node, $ctx, $wr);
    }
    $wr->out("", true);
    $wr->out("function __construct(", false);
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $this->writeArgsDef($constr, $ctx, $wr);
    }
    $wr->out(" ) {", true);
    $wr->indent(1);
    if ( isset( $parentClass ) ) {
      $wr->out("parent::__construct();", true);
    }
    for ( $i_3 = 0; $i_3 < count($cl->variables); $i_3++) {
      $pvar_1 = $cl->variables[$i_3];
      $this->writeVarInitDef($pvar_1->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr_1 = $cl->constructor_fn;
      $wr->newline();
      $subCtx = $constr_1->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr_1->fnBody, $subCtx, $wr);
    }
    $wr->newline();
    $wr->indent(-1);
    $wr->out("}", true);
    for ( $i_4 = 0; $i_4 < count($cl->static_methods); $i_4++) {
      $variant = $cl->static_methods[$i_4];
      $wr->out("", true);
      if ( $variant->nameNode->hasFlag("main") ) {
        continue;
      } else {
        $wr->out("public static function ", false);
        $wr->out($variant->compiledName . "(", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") {", true);
      }
      $wr->indent(1);
      $wr->newline();
      $subCtx_1 = $variant->fnCtx;
      $subCtx_1->is_function = true;
      $subCtx_1->in_static_method = true;
      $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_5 = 0; $i_5 < count($cl->defined_variants); $i_5++) {
      $fnVar = $cl->defined_variants[$i_5];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_6 = 0; $i_6 < count($mVs->variants); $i_6++) {
        $variant_1 = $mVs->variants[$i_6];
        $wr->out("", true);
        $wr->out(("function " . $variant_1->compiledName) . "(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(") {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_2 = $variant_1->fnCtx;
        $subCtx_2->is_function = true;
        $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    for ( $i_7 = 0; $i_7 < count($cl->static_methods); $i_7++) {
      $variant_2 = $cl->static_methods[$i_7];
      $ctx->disableCurrentClass();
      $ctx->in_static_method = true;
      $wr->out("", true);
      if ( $variant_2->nameNode->hasFlag("main") && ($variant_2->nameNode->code->filename == $ctx->getRootFile()) ) {
        $wr->out("/* static PHP main routine */", false);
        $wr->newline();
        $this->WalkNode($variant_2->fnBody, $ctx, $wr);
        $wr->newline();
      }
    }
  }
}
class RangerJavaScriptClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  var $thisName;
  var $wrote_header;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
    $this->thisName = "this";     /** note: unused */
    $this->wrote_header = false;
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "this";
    }
    return $tn;
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    if ( $node->eval_type == 11 ) {
      if ( (count($node->ns)) > 1 ) {
        $rootObjName = $node->ns[0];
        $enumName = $node->ns[1];
        $e = $ctx->getEnum($rootObjName);
        if ( (isset($e)) ) {
          $wr->out("" . (($e->values[$enumName])), false);
          return;
        }
      }
    }
    if ( (count($node->nsp)) > 0 ) {
      for ( $i = 0; $i < count($node->nsp); $i++) {
        $p = $node->nsp[$i];
        if ( $i > 0 ) {
          $wr->out(".", false);
        }
        if ( $i == 0 ) {
          $part = $node->ns[0];
          if ( ($part != "this") && $ctx->isMemberVariable($part) ) {
            $uc = $ctx->getCurrentClass();
            $currC = $uc;
            $up = $currC->findVariable($part);
            if ( (isset($up)) ) {
              $wr->out("this.", false);
            }
          }
          if ( $part == "this" ) {
            $wr->out("this", false);
            continue;
          }
        }
        if ( (strlen($p->compiledName)) > 0 ) {
          $wr->out($this->adjustType($p->compiledName), false);
        } else {
          if ( (strlen($p->name)) > 0 ) {
            $wr->out($this->adjustType($p->name), false);
          } else {
            $wr->out($this->adjustType(($node->ns[$i])), false);
          }
        }
      }
      return;
    }
    if ( $node->hasParamDesc ) {
      $part_1 = $node->ns[0];
      if ( ($part_1 != "this") && $ctx->isMemberVariable($part_1) ) {
        $uc_1 = $ctx->getCurrentClass();
        $currC_1 = $uc_1;
        $up_1 = $currC_1->findVariable($part_1);
        if ( (isset($up_1)) ) {
          $wr->out("this.", false);
        }
      }
      $p_1 = $node->paramDesc;
      $wr->out($p_1->compiledName, false);
      return;
    }
    $b_was_static = false;
    for ( $i_1 = 0; $i_1 < count($node->ns); $i_1++) {
      $part_2 = $node->ns[$i_1];
      if ( $i_1 > 0 ) {
        if ( ($i_1 == 1) && $b_was_static ) {
          $wr->out(".", false);
        } else {
          $wr->out(".", false);
        }
      }
      if ( $i_1 == 0 ) {
        if ( $ctx->hasClass($part_2) ) {
          $b_was_static = true;
        } else {
          $wr->out("", false);
        }
        if ( ($part_2 != "this") && $ctx->isMemberVariable($part_2) ) {
          $uc_2 = $ctx->getCurrentClass();
          $currC_2 = $uc_2;
          $up_2 = $currC_2->findVariable($part_2);
          if ( (isset($up_2)) ) {
            $wr->out("this.", false);
          }
        }
      }
      $wr->out($this->adjustType($part_2), false);
    }
  }
  
  function writeVarInitDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      $remove_unused = $ctx->hasCompilerFlag("remove-unused-class-vars");
      if ( ($p->ref_cnt == 0) && ($remove_unused || ($p->is_class_variable == false)) ) {
        return;
      }
      $was_set = false;
      if ( (count($node->children)) > 2 ) {
        $wr->out(("this." . $p->compiledName) . " = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
        $was_set = true;
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out("this." . $p->compiledName, false);
          $wr->out(" = []", false);
          $was_set = true;
        }
        if ( $nn->value_type == 7 ) {
          $wr->out("this." . $p->compiledName, false);
          $wr->out(" = {}", false);
          $was_set = true;
        }
      }
      if ( $was_set ) {
        $wr->out(";", false);
        if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
          $wr->out("     /** note: unused */", false);
        }
        $wr->newline();
      }
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      /** unused:  $opt_js = $ctx->hasCompilerFlag("optimize-js")   **/ ;
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("/** unused:  ", false);
      }
      $has_value = false;
      if ( (count($node->children)) > 2 ) {
        $has_value = true;
      }
      if ( (($p->set_cnt > 0) || $p->is_class_variable) || ($has_value == false) ) {
        $wr->out("let " . $p->compiledName, false);
      } else {
        $wr->out("const " . $p->compiledName, false);
      }
      if ( (count($node->children)) > 2 ) {
        $wr->out(" = ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      } else {
        if ( $nn->value_type == 6 ) {
          $wr->out(" = []", false);
        }
        if ( $nn->value_type == 7 ) {
          $wr->out(" = {}", false);
        }
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == true) ) {
        $wr->out("     /** note: unused */", false);
      }
      if ( ($p->ref_cnt == 0) && ($p->is_class_variable == false) ) {
        $wr->out("   **/ ", true);
      } else {
        $wr->out(";", false);
        $wr->newline();
      }
    }
  }
  
  function writeClassVarDef( $node , $ctx , $wr ) {
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(", ", false);
      }
      $wr->out($arg->name, false);
    }
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( $cl->is_interface ) {
      $orig_wr->out("// interface : " . $cl->name, true);
      return;
    }
    if ( (!isset($cl)) ) {
      return;
    }
    $wr = $orig_wr;
    /** unused:  $importFork = $wr->fork()   **/ ;
    if ( $this->wrote_header == false ) {
      $wr->out("", true);
      $this->wrote_header = true;
    }
    $b_extd = false;
    $wr->out(("class " . $cl->name) . " ", false);
    for ( $i = 0; $i < count($cl->extends_classes); $i++) {
      $pName = $cl->extends_classes[$i];
      if ( $i == 0 ) {
        $wr->out(" extends ", false);
      }
      $wr->out($pName, false);
      $b_extd = true;
    }
    $wr->out(" {", true);
    $wr->indent(1);
    for ( $i_1 = 0; $i_1 < count($cl->variables); $i_1++) {
      $pvar = $cl->variables[$i_1];
      $this->writeClassVarDef($pvar->node, $ctx, $wr);
    }
    $wr->out("constructor(", false);
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $this->writeArgsDef($constr, $ctx, $wr);
    }
    $wr->out(") {", true);
    $wr->indent(1);
    if ( $b_extd ) {
      $wr->out("super()", true);
    }
    for ( $i_2 = 0; $i_2 < count($cl->variables); $i_2++) {
      $pvar_1 = $cl->variables[$i_2];
      $this->writeVarInitDef($pvar_1->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr_1 = $cl->constructor_fn;
      $wr->newline();
      $subCtx = $constr_1->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr_1->fnBody, $subCtx, $wr);
    }
    $wr->newline();
    $wr->indent(-1);
    $wr->out("}", true);
    for ( $i_3 = 0; $i_3 < count($cl->defined_variants); $i_3++) {
      $fnVar = $cl->defined_variants[$i_3];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_4 = 0; $i_4 < count($mVs->variants); $i_4++) {
        $variant = $mVs->variants[$i_4];
        $wr->out(("" . $variant->compiledName) . " (", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_1 = $variant->fnCtx;
        $subCtx_1->is_function = true;
        $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    for ( $i_5 = 0; $i_5 < count($cl->static_methods); $i_5++) {
      $variant_1 = $cl->static_methods[$i_5];
      if ( $variant_1->nameNode->hasFlag("main") ) {
        continue;
      } else {
        $wr->out((($cl->name . ".") . $variant_1->compiledName) . " = function(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(") {", true);
      }
      $wr->indent(1);
      $wr->newline();
      $subCtx_2 = $variant_1->fnCtx;
      $subCtx_2->is_function = true;
      $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_6 = 0; $i_6 < count($cl->static_methods); $i_6++) {
      $variant_2 = $cl->static_methods[$i_6];
      $ctx->disableCurrentClass();
      if ( $variant_2->nameNode->hasFlag("main") && ($variant_2->nameNode->code->filename == $ctx->getRootFile()) ) {
        $wr->out("/* static JavaSript main routine */", false);
        $wr->newline();
        $wr->out("function __js_main() {", true);
        $wr->indent(1);
        $this->WalkNode($variant_2->fnBody, $ctx, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
        $wr->out("__js_main();", true);
      }
    }
  }
}
class RangerRangerClassWriter extends RangerGenericClassWriter { 
  var $compiler;
  
  function __construct( ) {
    parent::__construct();
    $this->compiler;     /** note: unused */
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "this";
    }
    return $tn;
  }
  
  function getObjectTypeString( $type_string , $ctx ) {
    return $type_string;
  }
  
  function getTypeString( $type_string ) {
    return $type_string;
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $v_type = $node->value_type;
    $t_name = $node->type_name;
    $a_name = $node->array_type;
    $k_name = $node->key_type;
    if ( (($v_type == 8) || ($v_type == 9)) || ($v_type == 0) ) {
      $v_type = $node->typeNameAsType($ctx);
    }
    if ( $node->eval_type != 0 ) {
      $v_type = $node->eval_type;
      if ( (strlen($node->eval_type_name)) > 0 ) {
        $t_name = $node->eval_type_name;
      }
      if ( (strlen($node->eval_array_type)) > 0 ) {
        $a_name = $node->eval_array_type;
      }
      if ( (strlen($node->eval_key_type)) > 0 ) {
        $k_name = $node->eval_key_type;
      }
    }
    if ( $v_type == 7 ) {
      $wr->out(((("[" . $k_name) . ":") . $a_name) . "]", false);
      return;
    }
    if ( $v_type == 6 ) {
      $wr->out(("[" . $a_name) . "]", false);
      return;
    }
    $wr->out($t_name, false);
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    $wr->out($node->vref, false);
  }
  
  function WriteVRefWithOpt( $node , $ctx , $wr ) {
    $wr->out($node->vref, false);
    $flags = ["optional","weak","strong","temp","lives","returns","returnvalue"];
    $some_set = false;
    for ( $i = 0; $i < count($flags); $i++) {
      $flag = $flags[$i];
      if ( $node->hasFlag($flag) ) {
        if ( false == $some_set ) {
          $wr->out("@(", false);
          $some_set = true;
        } else {
          $wr->out(" ", false);
        }
        $wr->out($flag, false);
      }
    }
    if ( $some_set ) {
      $wr->out(")", false);
    }
  }
  
  function writeVarDef( $node , $ctx , $wr ) {
    if ( $node->hasParamDesc ) {
      $nn = $node->children[1];
      $p = $nn->paramDesc;
      $wr->out("def ", false);
      $this->WriteVRefWithOpt($nn, $ctx, $wr);
      $wr->out(":", false);
      $this->writeTypeDef($p->nameNode, $ctx, $wr);
      if ( (count($node->children)) > 2 ) {
        $wr->out(" ", false);
        $ctx->setInExpr();
        $value = $node->getThird();
        $this->WalkNode($value, $ctx, $wr);
        $ctx->unsetInExpr();
      }
      $wr->newline();
    }
  }
  
  function writeFnCall( $node , $ctx , $wr ) {
    if ( $node->hasFnCall ) {
      if ( $ctx->expressionLevel() > 0 ) {
        $wr->out("(", false);
      }
      $fc = $node->getFirst();
      $this->WriteVRef($fc, $ctx, $wr);
      $wr->out("(", false);
      $givenArgs = $node->getSecond();
      $ctx->setInExpr();
      for ( $i = 0; $i < count($node->fnDesc->params); $i++) {
        $arg = $node->fnDesc->params[$i];
        if ( $i > 0 ) {
          $wr->out(", ", false);
        }
        if ( (count($givenArgs->children)) <= $i ) {
          $defVal = $arg->nameNode->getFlag("default");
          if ( (isset($defVal)) ) {
            $fc_1 = $defVal->vref_annotation->getFirst();
            $this->WalkNode($fc_1, $ctx, $wr);
          } else {
            $ctx->addError($node, "Default argument was missing");
          }
          continue;
        }
        $n = $givenArgs->children[$i];
        $this->WalkNode($n, $ctx, $wr);
      }
      $ctx->unsetInExpr();
      $wr->out(")", false);
      if ( $ctx->expressionLevel() > 0 ) {
        $wr->out(")", false);
      }
      if ( $ctx->expressionLevel() == 0 ) {
        $wr->newline();
      }
    }
  }
  
  function writeNewCall( $node , $ctx , $wr ) {
    if ( $node->hasNewOper ) {
      $cl = $node->clDesc;
      /** unused:  $fc = $node->getSecond()   **/ ;
      $wr->out("(new " . $node->clDesc->name, false);
      $wr->out("(", false);
      $constr = $cl->constructor_fn;
      $givenArgs = $node->getThird();
      if ( (isset($constr)) ) {
        for ( $i = 0; $i < count($constr->params); $i++) {
          $arg = $constr->params[$i];
          $n = $givenArgs->children[$i];
          if ( $i > 0 ) {
            $wr->out(" ", false);
          }
          if ( true || ((isset($arg->nameNode))) ) {
            $this->WalkNode($n, $ctx, $wr);
          }
        }
      }
      $wr->out("))", false);
    }
  }
  
  function writeArgsDef( $fnDesc , $ctx , $wr ) {
    for ( $i = 0; $i < count($fnDesc->params); $i++) {
      $arg = $fnDesc->params[$i];
      if ( $i > 0 ) {
        $wr->out(",", false);
      }
      $wr->out(" ", false);
      $this->WriteVRefWithOpt($arg->nameNode, $ctx, $wr);
      $wr->out(":", false);
      $this->writeTypeDef($arg->nameNode, $ctx, $wr);
    }
  }
  
  function writeClass( $node , $ctx , $orig_wr ) {
    $cl = $node->clDesc;
    if ( (!isset($cl)) ) {
      return;
    }
    $wr = $orig_wr;
    $importFork = $wr->fork();
    $wr->out("", true);
    $wr->out("class " . $cl->name, false);
    $parentClass;
    $wr->out(" { ", true);
    $wr->indent(1);
    if ( (count($cl->extends_classes)) > 0 ) {
      $wr->out("Extends(", false);
      for ( $i = 0; $i < count($cl->extends_classes); $i++) {
        $pName = $cl->extends_classes[$i];
        $wr->out($pName, false);
        $parentClass = $ctx->findClass($pName);
      }
      $wr->out(")", true);
    }
    $wr->createTag("utilities");
    for ( $i_1 = 0; $i_1 < count($cl->variables); $i_1++) {
      $pvar = $cl->variables[$i_1];
      $this->writeVarDef($pvar->node, $ctx, $wr);
    }
    if ( $cl->has_constructor ) {
      $constr = $cl->constructor_fn;
      $wr->out("", true);
      $wr->out("Constructor (", false);
      $this->writeArgsDef($constr, $ctx, $wr);
      $wr->out(" ) {", true);
      $wr->indent(1);
      $wr->newline();
      $subCtx = $constr->fnCtx;
      $subCtx->is_function = true;
      $this->WalkNode($constr->fnBody, $subCtx, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_2 = 0; $i_2 < count($cl->static_methods); $i_2++) {
      $variant = $cl->static_methods[$i_2];
      $wr->out("", true);
      if ( $variant->nameNode->hasFlag("main") ) {
        $wr->out("sfn m@(main):void () {", true);
      } else {
        $wr->out("sfn ", false);
        $this->WriteVRefWithOpt($variant->nameNode, $ctx, $wr);
        $wr->out(":", false);
        $this->writeTypeDef($variant->nameNode, $ctx, $wr);
        $wr->out(" (", false);
        $this->writeArgsDef($variant, $ctx, $wr);
        $wr->out(") {", true);
      }
      $wr->indent(1);
      $wr->newline();
      $subCtx_1 = $variant->fnCtx;
      $subCtx_1->is_function = true;
      $this->WalkNode($variant->fnBody, $subCtx_1, $wr);
      $wr->newline();
      $wr->indent(-1);
      $wr->out("}", true);
    }
    for ( $i_3 = 0; $i_3 < count($cl->defined_variants); $i_3++) {
      $fnVar = $cl->defined_variants[$i_3];
      $mVs = $cl->method_variants[$fnVar];
      for ( $i_4 = 0; $i_4 < count($mVs->variants); $i_4++) {
        $variant_1 = $mVs->variants[$i_4];
        $wr->out("", true);
        $wr->out("fn ", false);
        $this->WriteVRefWithOpt($variant_1->nameNode, $ctx, $wr);
        $wr->out(":", false);
        $this->writeTypeDef($variant_1->nameNode, $ctx, $wr);
        $wr->out(" ", false);
        $wr->out("(", false);
        $this->writeArgsDef($variant_1, $ctx, $wr);
        $wr->out(") {", true);
        $wr->indent(1);
        $wr->newline();
        $subCtx_2 = $variant_1->fnCtx;
        $subCtx_2->is_function = true;
        $this->WalkNode($variant_1->fnBody, $subCtx_2, $wr);
        $wr->newline();
        $wr->indent(-1);
        $wr->out("}", true);
      }
    }
    $wr->indent(-1);
    $wr->out("}", true);
    $import_list = $wr->getImports();
    for ( $i_5 = 0; $i_5 < count($import_list); $i_5++) {
      $codeStr = $import_list[$i_5];
      $importFork->out(("Import \"" . $codeStr) . "\"", true);
    }
  }
}
class LiveCompiler { 
  var $langWriter;
  var $hasCreatedPolyfill;
  var $lastProcessedNode;
  var $repeat_index;
  
  function __construct( ) {
    $this->langWriter;
    $this->hasCreatedPolyfill = array();     /** note: unused */
    $this->lastProcessedNode;
    $this->repeat_index = 0;
  }
  
  function initWriter( $ctx ) {
    if ( (isset($this->langWriter)) ) {
      return;
    }
    $root = $ctx->getRoot();
    switch ($root->targetLangName ) { 
      case "go" : 
        $this->langWriter =  new RangerGolangClassWriter();
        break;
      case "scala" : 
        $this->langWriter =  new RangerScalaClassWriter();
        break;
      case "java7" : 
        $this->langWriter =  new RangerJava7ClassWriter();
        break;
      case "swift3" : 
        $this->langWriter =  new RangerSwift3ClassWriter();
        break;
      case "kotlin" : 
        $this->langWriter =  new RangerKotlinClassWriter();
        break;
      case "php" : 
        $this->langWriter =  new RangerPHPClassWriter();
        break;
      case "cpp" : 
        $this->langWriter =  new RangerCppClassWriter();
        break;
      case "csharp" : 
        $this->langWriter =  new RangerCSharpClassWriter();
        break;
      case "es6" : 
        $this->langWriter =  new RangerJavaScriptClassWriter();
        break;
      case "ranger" : 
        $this->langWriter =  new RangerRangerClassWriter();
        break;
    }
    if ( (isset($this->langWriter)) ) {
      $this->langWriter->compiler = $this;
    } else {
      $this->langWriter =  new RangerGenericClassWriter();
      $this->langWriter->compiler = $this;
    }
  }
  
  function EncodeString( $node , $ctx , $wr ) {
    /** unused:  $encoded_str = ""   **/ ;
    $str_length = strlen($node->string_value);
    $encoded_str_2 = "";
    $ii = 0;
    while ($ii < $str_length) {
      $ch = ord($node->string_value[$ii]);
      $cc = $ch;
      switch ($cc ) { 
        case 8 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(98));
          break;
        case 9 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(116));
          break;
        case 10 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(110));
          break;
        case 12 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(102));
          break;
        case 13 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(114));
          break;
        case 34 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(34));
          break;
        case 92 : 
          $encoded_str_2 = ($encoded_str_2 . (chr(92))) . (chr(92));
          break;
        default: 
          $encoded_str_2 = $encoded_str_2 . (chr($ch));
          break;
      }
      $ii = $ii + 1;
    }
    return $encoded_str_2;
  }
  
  function WriteScalarValue( $node , $ctx , $wr ) {
    $this->langWriter->WriteScalarValue($node, $ctx, $wr);
  }
  
  function adjustType( $tn ) {
    if ( $tn == "this" ) {
      return "self";
    }
    return $tn;
  }
  
  function WriteVRef( $node , $ctx , $wr ) {
    $this->langWriter->WriteVRef($node, $ctx, $wr);
  }
  
  function writeTypeDef( $node , $ctx , $wr ) {
    $this->langWriter->writeTypeDef($node, $ctx, $wr);
  }
  
  function CreateLambdaCall( $node , $ctx , $wr ) {
    $this->langWriter->CreateLambdaCall($node, $ctx, $wr);
  }
  
  function CreateLambda( $node , $ctx , $wr ) {
    $this->langWriter->CreateLambda($node, $ctx, $wr);
  }
  
  function getTypeString( $str , $ctx ) {
    return "";
  }
  
  function findOpCode( $op , $node , $ctx , $wr ) {
    $fnName = $op->children[1];
    $args = $op->children[2];
    if ( (count($op->children)) > 3 ) {
      $details = $op->children[3];
      for ( $i = 0; $i < count($details->children); $i++) {
        $det = $details->children[$i];
        if ( (count($det->children)) > 0 ) {
          $fc = $det->children[0];
          if ( $fc->vref == "code" ) {
            $match =  new RangerArgMatch();
            $all_matched = $match->matchArguments($args, $node, $ctx, 1);
            if ( $all_matched == false ) {
              return;
            }
            $origCode = $det->children[1];
            $theCode = $origCode->rebuildWithType($match, true);
            $appCtx = $ctx->getRoot();
            $stdFnName = $appCtx->createSignature($fnName->vref, ($fnName->vref . $theCode->getCode()));
            $stdClass = $ctx->findClass("RangerStaticMethods");
            $runCtx = $appCtx->fork();
            $b_failed = false;
            if ( false == (array_key_exists($stdFnName , $stdClass->defined_static_methods )) ) {
              $runCtx->setInMethod();
              $m =  new RangerAppFunctionDesc();
              $m->name = $stdFnName;
              $m->node = $op;
              $m->is_static = true;
              $m->nameNode = $fnName;
              $m->fnBody = $theCode;
              for ( $ii = 0; $ii < count($args->children); $ii++) {
                $arg = $args->children[$ii];
                $p =  new RangerAppParamDesc();
                $p->name = $arg->vref;
                $p->value_type = $arg->value_type;
                $p->node = $arg;
                $p->nameNode = $arg;
                $p->refType = 1;
                $p->varType = 4;
                array_push($m->params, $p);
                $arg->hasParamDesc = true;
                $arg->paramDesc = $p;
                $arg->eval_type = $arg->value_type;
                $arg->eval_type_name = $arg->type_name;
                $runCtx->defineVariable($p->name, $p);
              }
              $stdClass->addStaticMethod($m);
              $err_cnt = count($ctx->compilerErrors);
              $flowParser =  new RangerFlowParser();
              $TmpWr =  new CodeWriter();
              $flowParser->WalkNode($theCode, $runCtx, $TmpWr);
              $runCtx->unsetInMethod();
              $err_delta = (count($ctx->compilerErrors)) - $err_cnt;
              if ( $err_delta > 0 ) {
                $b_failed = true;
                echo( "Had following compiler errors:" . "\n");
                for ( $i_1 = 0; $i_1 < count($ctx->compilerErrors); $i_1++) {
                  $e = $ctx->compilerErrors[$i_1];
                  if ( $i_1 < $err_cnt ) {
                    continue;
                  }
                  $line_index = $e->node->getLine();
                  echo( ($e->node->getFilename() . " Line: ") . $line_index . "\n");
                  echo( $e->description . "\n");
                  echo( $e->node->getLineString($line_index) . "\n");
                }
              } else {
                echo( "no errors found" . "\n");
              }
            }
            if ( $b_failed ) {
              $wr->out("/* custom operator compilation failed */ ", false);
            } else {
              $wr->out(("RangerStaticMethods." . $stdFnName) . "(", false);
              for ( $i_2 = 0; $i_2 < count($node->children); $i_2++) {
                $cc = $node->children[$i_2];
                if ( $i_2 == 0 ) {
                  continue;
                }
                if ( $i_2 > 1 ) {
                  $wr->out(", ", false);
                }
                $this->WalkNode($cc, $ctx, $wr);
              }
              $wr->out(")", false);
            }
            return;
          }
        }
      }
    }
  }
  
  function findOpTemplate( $op , $node , $ctx , $wr ) {
    /** unused:  $fnName = $op->children[1]   **/ ;
    /** unused:  $root = $ctx->getRoot()   **/ ;
    $langName = $ctx->getTargetLang();
    if ( (count($op->children)) > 3 ) {
      $details = $op->children[3];
      for ( $i = 0; $i < count($details->children); $i++) {
        $det = $details->children[$i];
        if ( (count($det->children)) > 0 ) {
          $fc = $det->children[0];
          if ( $fc->vref == "templates" ) {
            $tplList = $det->children[1];
            for ( $i_1 = 0; $i_1 < count($tplList->children); $i_1++) {
              $tpl = $tplList->children[$i_1];
              $tplName = $tpl->getFirst();
              $tplImpl;
              $tplImpl = $tpl->getSecond();
              if ( ($tplName->vref != "*") && ($tplName->vref != $langName) ) {
                continue;
              }
              if ( $tplName->hasFlag("mutable") ) {
                if ( false == $node->hasFlag("mutable") ) {
                  continue;
                }
              }
              return $tplImpl;
            }
          }
        }
      }
    }
    $non;
    return $non;
  }
  
  function localCall( $node , $ctx , $wr ) {
    if ( $node->hasFnCall ) {
      if ( (isset($this->langWriter)) ) {
        $this->langWriter->writeFnCall($node, $ctx, $wr);
        return true;
      }
    }
    if ( $node->hasNewOper ) {
      $this->langWriter->writeNewCall($node, $ctx, $wr);
      return true;
    }
    if ( $node->hasVarDef ) {
      if ( $node->disabled_node ) {
        $this->langWriter->disabledVarDef($node, $ctx, $wr);
      } else {
        $this->langWriter->writeVarDef($node, $ctx, $wr);
      }
      return true;
    }
    if ( $node->hasClassDescription ) {
      $this->langWriter->writeClass($node, $ctx, $wr);
      return true;
    }
    return false;
  }
  
  function WalkNode( $node , $ctx , $wr ) {
    $this->initWriter($ctx);
    if ( $node->isPrimitive() ) {
      $this->WriteScalarValue($node, $ctx, $wr);
      return;
    }
    $this->lastProcessedNode = $node;
    if ( $node->value_type == 9 ) {
      $this->WriteVRef($node, $ctx, $wr);
      return;
    }
    if ( $node->value_type == 16 ) {
      $this->WriteVRef($node, $ctx, $wr);
      return;
    }
    if ( (count($node->children)) > 0 ) {
      if ( $node->has_operator ) {
        $op = $ctx->findOperator($node);
        /** unused:  $fc = $op->getFirst()   **/ ;
        $tplImpl = $this->findOpTemplate($op, $node, $ctx, $wr);
        $evalCtx = $ctx;
        if ( (isset($node->evalCtx)) ) {
          $evalCtx = $node->evalCtx;
        }
        if ( (isset($tplImpl)) ) {
          $opName = $op->getSecond();
          if ( $opName->hasFlag("returns") ) {
            $this->langWriter->release_local_vars($node, $evalCtx, $wr);
          }
          $this->walkCommandList($tplImpl, $node, $evalCtx, $wr);
        } else {
          $this->findOpCode($op, $node, $evalCtx, $wr);
        }
        return;
      }
      if ( $node->has_lambda ) {
        $this->CreateLambda($node, $ctx, $wr);
        return;
      }
      if ( $node->has_lambda_call ) {
        $this->CreateLambdaCall($node, $ctx, $wr);
        return;
      }
      if ( (count($node->children)) > 1 ) {
        if ( $this->localCall($node, $ctx, $wr) ) {
          return;
        }
      }
      /** unused:  $fc_1 = $node->getFirst()   **/ ;
    }
    if ( $node->expression ) {
      for ( $i = 0; $i < count($node->children); $i++) {
        $item = $node->children[$i];
        if ( ($node->didReturnAtIndex >= 0) && ($node->didReturnAtIndex < $i) ) {
          break;
        }
        $this->WalkNode($item, $ctx, $wr);
      }
    } else {
    }
  }
  
  function walkCommandList( $cmd , $node , $ctx , $wr ) {
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->newline();
    }
    if ( $ctx->expressionLevel() > 1 ) {
      $wr->out("(", false);
    }
    for ( $i = 0; $i < count($cmd->children); $i++) {
      $c = $cmd->children[$i];
      $this->walkCommand($c, $node, $ctx, $wr);
    }
    if ( $ctx->expressionLevel() > 1 ) {
      $wr->out(")", false);
    }
    if ( $ctx->expressionLevel() == 0 ) {
      $wr->newline();
    }
  }
  
  function walkCommand( $cmd , $node , $ctx , $wr ) {
    if ( $cmd->expression ) {
      if ( (count($cmd->children)) < 2 ) {
        $ctx->addError($node, "Invalid command");
        $ctx->addError($cmd, "Invalid command");
        return;
      }
      $cmdE = $cmd->getFirst();
      $cmdArg = $cmd->getSecond();
      switch ($cmdE->vref ) { 
        case "str" : 
          $idx = $cmdArg->int_value;
          if ( (count($node->children)) > $idx ) {
            $arg = $node->children[$idx];
            $wr->out($arg->string_value, false);
          }
          break;
        case "block" : 
          $idx_1 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_1 ) {
            $arg_1 = $node->children[$idx_1];
            $this->WalkNode($arg_1, $ctx, $wr);
          }
          break;
        case "varname" : 
          if ( $ctx->isVarDefined($cmdArg->vref) ) {
            $p = $ctx->getVariableDef($cmdArg->vref);
            $wr->out($p->compiledName, false);
          }
          break;
        case "defvar" : 
          $p_1 =  new RangerAppParamDesc();
          $p_1->name = $cmdArg->vref;
          $p_1->value_type = $cmdArg->value_type;
          $p_1->node = $cmdArg;
          $p_1->nameNode = $cmdArg;
          $p_1->is_optional = false;
          $ctx->defineVariable($p_1->name, $p_1);
          break;
        case "cc" : 
          $idx_2 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_2 ) {
            $arg_2 = $node->children[$idx_2];
            $cc = ord($arg_2->string_value[0]);
            $wr->out("" . (ord($cc)), false);
          }
          break;
        case "java_case" : 
          $idx_3 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_3 ) {
            $arg_3 = $node->children[$idx_3];
            $this->WalkNode($arg_3, $ctx, $wr);
            if ( $arg_3->didReturnAtIndex < 0 ) {
              $wr->newline();
              $wr->out("break;", true);
            }
          }
          break;
        case "e" : 
          $idx_4 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_4 ) {
            $arg_4 = $node->children[$idx_4];
            $ctx->setInExpr();
            $this->WalkNode($arg_4, $ctx, $wr);
            $ctx->unsetInExpr();
          }
          break;
        case "goset" : 
          $idx_5 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_5 ) {
            $arg_5 = $node->children[$idx_5];
            $ctx->setInExpr();
            $this->langWriter->WriteSetterVRef($arg_5, $ctx, $wr);
            $ctx->unsetInExpr();
          }
          break;
        case "pe" : 
          $idx_6 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_6 ) {
            $arg_6 = $node->children[$idx_6];
            $this->WalkNode($arg_6, $ctx, $wr);
          }
          break;
        case "ptr" : 
          $idx_7 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_7 ) {
            $arg_7 = $node->children[$idx_7];
            if ( $arg_7->hasParamDesc ) {
              if ( $arg_7->paramDesc->nameNode->isAPrimitiveType() == false ) {
                $wr->out("*", false);
              }
            } else {
              if ( $arg_7->isAPrimitiveType() == false ) {
                $wr->out("*", false);
              }
            }
          }
          break;
        case "ptrsrc" : 
          $idx_8 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_8 ) {
            $arg_8 = $node->children[$idx_8];
            if ( ($arg_8->isPrimitiveType() == false) && ($arg_8->isPrimitive() == false) ) {
              $wr->out("&", false);
            }
          }
          break;
        case "nameof" : 
          $idx_9 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_9 ) {
            $arg_9 = $node->children[$idx_9];
            $wr->out($arg_9->vref, false);
          }
          break;
        case "list" : 
          $idx_10 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_10 ) {
            $arg_10 = $node->children[$idx_10];
            for ( $i = 0; $i < count($arg_10->children); $i++) {
              $ch = $arg_10->children[$i];
              if ( $i > 0 ) {
                $wr->out(" ", false);
              }
              $ctx->setInExpr();
              $this->WalkNode($ch, $ctx, $wr);
              $ctx->unsetInExpr();
            }
          }
          break;
        case "repeat_from" : 
          $idx_11 = $cmdArg->int_value;
          $this->repeat_index = $idx_11;
          if ( (count($node->children)) >= $idx_11 ) {
            $cmdToRepeat = $cmd->getThird();
            $i_1 = $idx_11;
            while ($i_1 < (count($node->children))) {
              if ( $i_1 >= $idx_11 ) {
                for ( $ii = 0; $ii < count($cmdToRepeat->children); $ii++) {
                  $cc_1 = $cmdToRepeat->children[$ii];
                  if ( (count($cc_1->children)) > 0 ) {
                    $fc = $cc_1->getFirst();
                    if ( $fc->vref == "e" ) {
                      $dc = $cc_1->getSecond();
                      $dc->int_value = $i_1;
                    }
                    if ( $fc->vref == "block" ) {
                      $dc_1 = $cc_1->getSecond();
                      $dc_1->int_value = $i_1;
                    }
                  }
                }
                $this->walkCommandList($cmdToRepeat, $node, $ctx, $wr);
                if ( ($i_1 + 1) < (count($node->children)) ) {
                  $wr->out(",", false);
                }
              }
              $i_1 = $i_1 + 1;
            }
          }
          break;
        case "comma" : 
          $idx_12 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_12 ) {
            $arg_11 = $node->children[$idx_12];
            for ( $i_2 = 0; $i_2 < count($arg_11->children); $i_2++) {
              $ch_1 = $arg_11->children[$i_2];
              if ( $i_2 > 0 ) {
                $wr->out(",", false);
              }
              $ctx->setInExpr();
              $this->WalkNode($ch_1, $ctx, $wr);
              $ctx->unsetInExpr();
            }
          }
          break;
        case "swift_rc" : 
          $idx_13 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_13 ) {
            $arg_12 = $node->children[$idx_13];
            if ( $arg_12->hasParamDesc ) {
              if ( $arg_12->paramDesc->ref_cnt == 0 ) {
                $wr->out("_", false);
              } else {
                $p_2 = $ctx->getVariableDef($arg_12->vref);
                $wr->out($p_2->compiledName, false);
              }
            } else {
              $wr->out($arg_12->vref, false);
            }
          }
          break;
        case "r_ktype" : 
          $idx_14 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_14 ) {
            $arg_13 = $node->children[$idx_14];
            if ( $arg_13->hasParamDesc ) {
              $ss = $this->langWriter->getObjectTypeString($arg_13->paramDesc->nameNode->key_type, $ctx);
              $wr->out($ss, false);
            } else {
              $ss_1 = $this->langWriter->getObjectTypeString($arg_13->key_type, $ctx);
              $wr->out($ss_1, false);
            }
          }
          break;
        case "r_atype" : 
          $idx_15 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_15 ) {
            $arg_14 = $node->children[$idx_15];
            if ( $arg_14->hasParamDesc ) {
              $ss_2 = $this->langWriter->getObjectTypeString($arg_14->paramDesc->nameNode->array_type, $ctx);
              $wr->out($ss_2, false);
            } else {
              $ss_3 = $this->langWriter->getObjectTypeString($arg_14->array_type, $ctx);
              $wr->out($ss_3, false);
            }
          }
          break;
        case "custom" : 
          $this->langWriter->CustomOperator($node, $ctx, $wr);
          break;
        case "arraytype" : 
          $idx_16 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_16 ) {
            $arg_15 = $node->children[$idx_16];
            if ( $arg_15->hasParamDesc ) {
              $this->langWriter->writeArrayTypeDef($arg_15->paramDesc->nameNode, $ctx, $wr);
            } else {
              $this->langWriter->writeArrayTypeDef($arg_15, $ctx, $wr);
            }
          }
          break;
        case "rawtype" : 
          $idx_17 = $cmdArg->int_value;
          if ( (count($node->children)) > $idx_17 ) {
            $arg_16 = $node->children[$idx_17];
            if ( $arg_16->hasParamDesc ) {
              $this->langWriter->writeRawTypeDef($arg_16->paramDesc->nameNode, $ctx, $wr);
            } else {
              $this->langWriter->writeRawTypeDef($arg_16, $ctx, $wr);
            }
          }
          break;
        case "macro" : 
          $p_write = $wr->getTag("utilities");
          $newWriter =  new CodeWriter();
          $testCtx = $ctx->fork();
          $testCtx->restartExpressionLevel();
          $this->walkCommandList($cmdArg, $node, $testCtx, $newWriter);
          $p_str = $newWriter->getCode();
          /** unused:  $root = $ctx->getRoot()   **/ ;
          if ( (array_key_exists($p_str , $p_write->compiledTags )) == false ) {
            $p_write->compiledTags[$p_str] = true;
            $mCtx = $ctx->fork();
            $mCtx->restartExpressionLevel();
            $this->walkCommandList($cmdArg, $node, $mCtx, $p_write);
          }
          break;
        case "create_polyfill" : 
          $p_write_1 = $wr->getTag("utilities");
          $p_str_1 = $cmdArg->string_value;
          if ( (array_key_exists($p_str_1 , $p_write_1->compiledTags )) == false ) {
            $p_write_1->raw($p_str_1, true);
            $p_write_1->compiledTags[$p_str_1] = true;
          }
          break;
        case "typeof" : 
          $idx_18 = $cmdArg->int_value;
          if ( (count($node->children)) >= $idx_18 ) {
            $arg_17 = $node->children[$idx_18];
            if ( $arg_17->hasParamDesc ) {
              $this->writeTypeDef($arg_17->paramDesc->nameNode, $ctx, $wr);
            } else {
              $this->writeTypeDef($arg_17, $ctx, $wr);
            }
          }
          break;
        case "imp" : 
          $this->langWriter->import_lib($cmdArg->string_value, $ctx, $wr);
          break;
        case "atype" : 
          $idx_19 = $cmdArg->int_value;
          if ( (count($node->children)) >= $idx_19 ) {
            $arg_18 = $node->children[$idx_19];
            $p_3 = $this->findParamDesc($arg_18, $ctx, $wr);
            $nameNode = $p_3->nameNode;
            $tn = $nameNode->array_type;
            $wr->out($this->getTypeString($tn, $ctx), false);
          }
          break;
      }
    } else {
      if ( $cmd->value_type == 9 ) {
        switch ($cmd->vref ) { 
          case "nl" : 
            $wr->newline();
            break;
          case "space" : 
            $wr->out(" ", false);
            break;
          case "I" : 
            $wr->indent(1);
            break;
          case "i" : 
            $wr->indent(-1);
            break;
          case "op" : 
            $fc_1 = $node->getFirst();
            $wr->out($fc_1->vref, false);
            break;
        }
      } else {
        if ( $cmd->value_type == 4 ) {
          $wr->out($cmd->string_value, false);
        }
      }
    }
  }
  
  function compile( $node , $ctx , $wr ) {
  }
  
  function findParamDesc( $obj , $ctx , $wr ) {
    $varDesc;
    $set_nsp = false;
    $classDesc;
    if ( 0 == (count($obj->nsp)) ) {
      $set_nsp = true;
    }
    if ( $obj->vref != "this" ) {
      if ( (count($obj->ns)) > 1 ) {
        $cnt = count($obj->ns);
        $classRefDesc;
        for ( $i = 0; $i < count($obj->ns); $i++) {
          $strname = $obj->ns[$i];
          if ( $i == 0 ) {
            if ( $strname == "this" ) {
              $classDesc = $ctx->getCurrentClass();
              if ( $set_nsp ) {
                array_push($obj->nsp, $classDesc);
              }
            } else {
              if ( $ctx->isDefinedClass($strname) ) {
                $classDesc = $ctx->findClass($strname);
                if ( $set_nsp ) {
                  array_push($obj->nsp, $classDesc);
                }
                continue;
              }
              $classRefDesc = $ctx->getVariableDef($strname);
              if ( (!isset($classRefDesc)) ) {
                $ctx->addError($obj, "Error, no description for called object: " . $strname);
                break;
              }
              if ( $set_nsp ) {
                array_push($obj->nsp, $classRefDesc);
              }
              $classRefDesc->ref_cnt = 1 + $classRefDesc->ref_cnt;
              $classDesc = $ctx->findClass($classRefDesc->nameNode->type_name);
            }
          } else {
            if ( $i < ($cnt - 1) ) {
              $varDesc = $classDesc->findVariable($strname);
              if ( (!isset($varDesc)) ) {
                $ctx->addError($obj, "Error, no description for refenced obj: " . $strname);
              }
              $subClass = $varDesc->getTypeName();
              $classDesc = $ctx->findClass($subClass);
              if ( $set_nsp ) {
                array_push($obj->nsp, $varDesc);
              }
              continue;
            }
            if ( (isset($classDesc)) ) {
              $varDesc = $classDesc->findVariable($strname);
              if ( (!isset($varDesc)) ) {
                $classMethod = $classDesc->findMethod($strname);
                if ( (!isset($classMethod)) ) {
                  $classMethod = $classDesc->findStaticMethod($strname);
                  if ( (!isset($classMethod)) ) {
                    $ctx->addError($obj, "variable not found " . $strname);
                  }
                }
                if ( (isset($classMethod)) ) {
                  if ( $set_nsp ) {
                    array_push($obj->nsp, $classMethod);
                  }
                  return $classMethod;
                }
              }
              if ( $set_nsp ) {
                array_push($obj->nsp, $varDesc);
              }
            }
          }
        }
        return $varDesc;
      }
      $varDesc = $ctx->getVariableDef($obj->vref);
      if ( (isset($varDesc->nameNode)) ) {
      } else {
        echo( "findParamDesc : description not found for " . $obj->vref . "\n");
        if ( (isset($varDesc)) ) {
          echo( "Vardesc was found though..." . $varDesc->name . "\n");
        }
        $ctx->addError($obj, "Error, no description for called object: " . $obj->vref);
      }
      return $varDesc;
    }
    $cc = $ctx->getCurrentClass();
    return $cc;
  }
}
class ColorConsole { 
  
  function __construct( ) {
  }
  
  function out( $color , $str ) {
    echo( $str . "\n");
  }
}
class DictNode { 
  var $is_property;
  var $is_property_value;
  var $vref;
  var $value_type;
  var $double_value;
  var $int_value;
  var $string_value;
  var $boolean_value;
  var $object_value;
  var $children;
  var $objects;
  var $keys;
  
  function __construct( ) {
    $this->is_property = false;
    $this->is_property_value = false;
    $this->vref = "";
    $this->value_type = 6;
    $this->double_value = 0;
    $this->int_value = 0;
    $this->string_value = "";
    $this->boolean_value = false;
    $this->object_value;
    $this->children = array();
    $this->objects = array();
    $this->keys = array();
  }
  
  public static function createEmptyObject() {
    $v =  new DictNode();
    $v->value_type = 6;
    return $v;
  }
  
  
  function EncodeString( $orig_str ) {
    $encoded_str = "";
    /** unused:  $str_length = strlen($orig_str)   **/ ;
    $ii = 0;
    $buff = $orig_str;
    $cb_len = strlen($buff);
    while ($ii < $cb_len) {
      $cc = ord($buff[$ii]);
      switch ($cc ) { 
        case 8 : 
          $encoded_str = ($encoded_str . (chr(92))) . (chr(98));
          break;
        case 9 : 
          $encoded_str = ($encoded_str . (chr(92))) . (chr(116));
          break;
        case 10 : 
          $encoded_str = ($encoded_str . (chr(92))) . (chr(110));
          break;
        case 12 : 
          $encoded_str = ($encoded_str . (chr(92))) . (chr(102));
          break;
        case 13 : 
          $encoded_str = ($encoded_str . (chr(92))) . (chr(114));
          break;
        case 34 : 
          $encoded_str = ($encoded_str . (chr(92))) . "\"";
          break;
        case 92 : 
          $encoded_str = ($encoded_str . (chr(92))) . (chr(92));
          break;
        case 47 : 
          $encoded_str = ($encoded_str . (chr(92))) . (chr(47));
          break;
        default: 
          $encoded_str = $encoded_str . (chr($cc));
          break;
      }
      $ii = 1 + $ii;
    }
    return $encoded_str;
  }
  
  function addString( $key , $value ) {
    if ( $this->value_type == 6 ) {
      $v =  new DictNode();
      $v->string_value = $value;
      $v->value_type = 3;
      $v->vref = $key;
      $v->is_property = true;
      array_push($this->keys, $key);
      $this->objects[$key] = $v;
    }
  }
  
  function addDouble( $key , $value ) {
    if ( $this->value_type == 6 ) {
      $v =  new DictNode();
      $v->double_value = $value;
      $v->value_type = 1;
      $v->vref = $key;
      $v->is_property = true;
      array_push($this->keys, $key);
      $this->objects[$key] = $v;
    }
  }
  
  function addInt( $key , $value ) {
    if ( $this->value_type == 6 ) {
      $v =  new DictNode();
      $v->int_value = $value;
      $v->value_type = 2;
      $v->vref = $key;
      $v->is_property = true;
      array_push($this->keys, $key);
      $this->objects[$key] = $v;
    }
  }
  
  function addBoolean( $key , $value ) {
    if ( $this->value_type == 6 ) {
      $v =  new DictNode();
      $v->boolean_value = $value;
      $v->value_type = 4;
      $v->vref = $key;
      $v->is_property = true;
      array_push($this->keys, $key);
      $this->objects[$key] = $v;
    }
  }
  
  function addObject( $key ) {
    $v;
    if ( $this->value_type == 6 ) {
      $p =  new DictNode();
      $v =  new DictNode();
      $p->value_type = 6;
      $p->vref = $key;
      $p->is_property = true;
      $v->value_type = 6;
      $v->vref = $key;
      $v->is_property_value = true;
      $p->object_value = $v;
      array_push($this->keys, $key);
      $this->objects[$key] = $p;
      return $v;
    }
    return $v;
  }
  
  function setObject( $key , $value ) {
    if ( $this->value_type == 6 ) {
      $p =  new DictNode();
      $p->value_type = 6;
      $p->vref = $key;
      $p->is_property = true;
      $value->is_property_value = true;
      $value->vref = $key;
      $p->object_value = $value;
      array_push($this->keys, $key);
      $this->objects[$key] = $p;
    }
  }
  
  function addArray( $key ) {
    $v;
    if ( $this->value_type == 6 ) {
      $v =  new DictNode();
      $v->value_type = 5;
      $v->vref = $key;
      $v->is_property = true;
      array_push($this->keys, $key);
      $this->objects[$key] = $v;
      return $v;
    }
    return $v;
  }
  
  function push( $obj ) {
    if ( $this->value_type == 5 ) {
      array_push($this->children, $obj);
    }
  }
  
  function getDoubleAt( $index ) {
    if ( $index < (count($this->children)) ) {
      $k = $this->children[$index];
      return $k->double_value;
    }
    return 0;
  }
  
  function getStringAt( $index ) {
    if ( $index < (count($this->children)) ) {
      $k = $this->children[$index];
      return $k->string_value;
    }
    return "";
  }
  
  function getIntAt( $index ) {
    if ( $index < (count($this->children)) ) {
      $k = $this->children[$index];
      return $k->int_value;
    }
    return 0;
  }
  
  function getBooleanAt( $index ) {
    if ( $index < (count($this->children)) ) {
      $k = $this->children[$index];
      return $k->boolean_value;
    }
    return false;
  }
  
  function getString( $key ) {
    $res;
    if ( array_key_exists($key , $this->objects ) ) {
      $k = $this->objects[$key];
      $res = $k->string_value;
    }
    return $res;
  }
  
  function getDouble( $key ) {
    $res;
    if ( array_key_exists($key , $this->objects ) ) {
      $k = $this->objects[$key];
      $res = $k->double_value;
    }
    return $res;
  }
  
  function getInt( $key ) {
    $res;
    if ( array_key_exists($key , $this->objects ) ) {
      $k = $this->objects[$key];
      $res = $k->int_value;
    }
    return $res;
  }
  
  function getBoolean( $key ) {
    $res;
    if ( array_key_exists($key , $this->objects ) ) {
      $k = $this->objects[$key];
      $res = $k->boolean_value;
    }
    return $res;
  }
  
  function getArray( $key ) {
    $res;
    if ( array_key_exists($key , $this->objects ) ) {
      $obj = $this->objects[$key];
      if ( $obj->is_property ) {
        $res = $obj->object_value;
      }
    }
    return $res;
  }
  
  function getArrayAt( $index ) {
    $res;
    if ( $index < (count($this->children)) ) {
      $res = $this->children[$index];
    }
    return $res;
  }
  
  function getObject( $key ) {
    $res;
    if ( array_key_exists($key , $this->objects ) ) {
      $obj = $this->objects[$key];
      if ( $obj->is_property ) {
        $res = $obj->object_value;
      }
    }
    return $res;
  }
  
  function getObjectAt( $index ) {
    $res;
    if ( $index < (count($this->children)) ) {
      $res = $this->children[$index];
    }
    return $res;
  }
  
  function stringify() {
    if ( $this->is_property ) {
      if ( $this->value_type == 7 ) {
        return (("\"" . $this->vref) . "\"") . ":null";
      }
      if ( $this->value_type == 4 ) {
        if ( $this->boolean_value ) {
          return ((("\"" . $this->vref) . "\"") . ":") . "true";
        } else {
          return ((("\"" . $this->vref) . "\"") . ":") . "false";
        }
      }
      if ( $this->value_type == 1 ) {
        return ((("\"" . $this->vref) . "\"") . ":") . $this->double_value;
      }
      if ( $this->value_type == 2 ) {
        return ((("\"" . $this->vref) . "\"") . ":") . $this->int_value;
      }
      if ( $this->value_type == 3 ) {
        return ((((("\"" . $this->vref) . "\"") . ":") . "\"") . $this->EncodeString($this->string_value)) . "\"";
      }
    } else {
      if ( $this->value_type == 7 ) {
        return "null";
      }
      if ( $this->value_type == 1 ) {
        return "" . $this->double_value;
      }
      if ( $this->value_type == 2 ) {
        return "" . $this->int_value;
      }
      if ( $this->value_type == 3 ) {
        return ("\"" . $this->EncodeString($this->string_value)) . "\"";
      }
      if ( $this->value_type == 4 ) {
        if ( $this->boolean_value ) {
          return "true";
        } else {
          return "false";
        }
      }
    }
    if ( $this->value_type == 5 ) {
      $str = "";
      if ( $this->is_property ) {
        $str = (("\"" . $this->vref) . "\"") . ":[";
      } else {
        $str = "[";
      }
      for ( $i = 0; $i < count($this->children); $i++) {
        $item = $this->children[$i];
        if ( $i > 0 ) {
          $str = $str . ",";
        }
        $str = $str . $item->stringify();
      }
      $str = $str . "]";
      return $str;
    }
    if ( $this->value_type == 6 ) {
      $str_1 = "";
      if ( $this->is_property ) {
        return ((("\"" . $this->vref) . "\"") . ":") . $this->object_value->stringify();
      } else {
        $str_1 = "{";
        for ( $i_1 = 0; $i_1 < count($this->keys); $i_1++) {
          $key = $this->keys[$i_1];
          if ( $i_1 > 0 ) {
            $str_1 = $str_1 . ",";
          }
          $item_1 = $this->objects[$key];
          $str_1 = $str_1 . $item_1->stringify();
        }
        $str_1 = $str_1 . "}";
        return $str_1;
      }
    }
    return "";
  }
}


class RangerSerializeClass { 
  
  function __construct( ) {
  }
  
  function isSerializedClass( $cName , $ctx ) {
    if ( $ctx->hasClass($cName) ) {
      $clDecl = $ctx->findClass($cName);
      if ( $clDecl->is_serialized ) {
        return true;
      }
    }
    return false;
  }
  
  function createWRWriter( $pvar , $nn , $ctx , $wr ) {
    $wr->out("def key@(lives):DictNode (new DictNode())", true);
    $wr->out(("key.addString(\"n\" \"" . $pvar->name) . "\")", true);
    if ( $nn->value_type == 6 ) {
      if ( $this->isSerializedClass($nn->array_type, $ctx) ) {
        $wr->out(("def values:DictNode (keys.addArray(\"" . $pvar->compiledName) . "\"))", true);
        $wr->out(((("for this." . $pvar->compiledName) . " item:") . $nn->array_type) . " i {", true);
        $wr->indent(1);
        $wr->out("def obj@(lives):DictNode (item.serializeToDict())", true);
        $wr->out("values.push( obj )", true);
        $wr->indent(-1);
        $wr->out("}", true);
      }
      return;
    }
    if ( $nn->value_type == 7 ) {
      if ( $this->isSerializedClass($nn->array_type, $ctx) ) {
        $wr->out(("def values:DictNode (keys.addObject(\"" . $pvar->compiledName) . "\"))", true);
        $wr->out(("for this." . $pvar->compiledName) . " keyname {", true);
        $wr->indent(1);
        $wr->out(("def item:DictNode (unwrap (get this." . $pvar->compiledName) . " keyname))", true);
        $wr->out("def obj@(lives):DictNode (item.serializeToDict())", true);
        $wr->out("values.setObject( obj )", true);
        $wr->indent(-1);
        $wr->out("}", true);
      }
      if ( $nn->key_type == "string" ) {
        $wr->out(("def values:DictNode (keys.addObject(\"" . $pvar->compiledName) . "\"))", true);
        $wr->out(("for this." . $pvar->compiledName) . " keyname {", true);
        $wr->indent(1);
        if ( $nn->array_type == "string" ) {
          $wr->out(("values.addString(keyname (unwrap (get this." . $pvar->compiledName) . " keyname)))", true);
        }
        if ( $nn->array_type == "int" ) {
          $wr->out(("values.addInt(keyname (unwrap (get this." . $pvar->compiledName) . " keyname)))", true);
        }
        if ( $nn->array_type == "boolean" ) {
          $wr->out(("values.addBoolean(keyname (unwrap (get this." . $pvar->compiledName) . " keyname)))", true);
        }
        if ( $nn->array_type == "double" ) {
          $wr->out(("values.addDouble(keyname (unwrap (get this." . $pvar->compiledName) . " keyname)))", true);
        }
        $wr->indent(-1);
        $wr->out("}", true);
        return;
      }
      return;
    }
    if ( $nn->type_name == "string" ) {
      $wr->out(((("keys.addString(\"" . $pvar->compiledName) . "\" (this.") . $pvar->compiledName) . "))", true);
      return;
    }
    if ( $nn->type_name == "double" ) {
      $wr->out(((("keys.addDouble(\"" . $pvar->compiledName) . "\" (this.") . $pvar->compiledName) . "))", true);
      return;
    }
    if ( $nn->type_name == "int" ) {
      $wr->out(((("keys.addInt(\"" . $pvar->compiledName) . "\" (this.") . $pvar->compiledName) . "))", true);
      return;
    }
    if ( $nn->type_name == "boolean" ) {
      $wr->out(((("keys.addBoolean(\"" . $pvar->compiledName) . "\" (this.") . $pvar->compiledName) . "))", true);
      return;
    }
    if ( $this->isSerializedClass($nn->type_name, $ctx) ) {
      $wr->out(("def value@(lives):DictNode (this." . $pvar->compiledName) . ".serializeToDict())", true);
      $wr->out(("keys.setObject(\"" . $pvar->compiledName) . "\" value)", true);
    }
  }
  
  function createJSONSerializerFn( $cl , $ctx , $wr ) {
    $declaredVariable = array();
    $wr->out("Import \"ng_DictNode.clj\"", true);
    $wr->out(("extension " . $cl->name) . " {", true);
    $wr->indent(1);
    $wr->out(("fn unserializeFromDict@(strong):" . $cl->name) . " (dict:DictNode) {", true);
    $wr->indent(1);
    $wr->out(((("def obj:" . $cl->name) . " (new ") . $cl->name) . "())", true);
    $wr->out("return obj", true);
    $wr->indent(-1);
    $wr->out("}", true);
    $wr->newline();
    $wr->out("fn serializeToDict:DictNode () {", true);
    $wr->indent(1);
    $wr->out("def res:DictNode (new DictNode ())", true);
    $wr->out(("res.addString(\"n\" \"" . $cl->name) . "\")", true);
    $wr->out("def keys:DictNode (res.addObject(\"data\"))", true);
    if ( (count($cl->extends_classes)) > 0 ) {
      for ( $i = 0; $i < count($cl->extends_classes); $i++) {
        $pName = $cl->extends_classes[$i];
        $pC = $ctx->findClass($pName);
        for ( $i_1 = 0; $i_1 < count($pC->variables); $i_1++) {
          $pvar = $pC->variables[$i_1];
          $declaredVariable[$pvar->name] = true;
          $nn = $pvar->nameNode;
          if ( $nn->isPrimitive() ) {
            $wr->out("; extended ", true);
            $wr->out("def key@(lives):DictNode (new DictNode())", true);
            $wr->out(("key.addString(\"n\" \"" . $pvar->name) . "\")", true);
            $wr->out(("key.addString(\"t\" \"" . $pvar->value_type) . "\")", true);
            $wr->out("keys.push(key)", true);
          }
        }
      }
    }
    for ( $i_2 = 0; $i_2 < count($cl->variables); $i_2++) {
      $pvar_1 = $cl->variables[$i_2];
      if ( array_key_exists($pvar_1->name , $declaredVariable ) ) {
        continue;
      }
      $nn_1 = $pvar_1->nameNode;
      if ( $nn_1->hasFlag("optional") ) {
        $wr->out("; optional variable", true);
        $wr->out(("if (!null? this." . $pvar_1->name) . ") {", true);
        $wr->indent(1);
        $this->createWRWriter($pvar_1, $nn_1, $ctx, $wr);
        $wr->indent(-1);
        $wr->out("} {", true);
        $wr->indent(1);
        $wr->indent(-1);
        $wr->out("}", true);
        continue;
      }
      $wr->out("; not extended ", true);
      $this->createWRWriter($pvar_1, $nn_1, $ctx, $wr);
    }
    $wr->out("return res", true);
    $wr->indent(-1);
    $wr->out("}", true);
    $wr->indent(-1);
    $wr->out("}", true);
  }
}
class CompilerInterface { 
  
  function __construct( ) {
  }
  
  
  public static function displayCompilerErrors( $appCtx ) {
    $cons =  new ColorConsole();
    for ( $i_3 = 0; $i_3 < count($appCtx->compilerErrors); $i_3++) {
      $e = $appCtx->compilerErrors[$i_3];
      $line_index = $e->node->getLine();
      $cons->out("gray", ($e->node->getFilename() . " Line: ") . (1 + $line_index));
      $cons->out("gray", $e->description);
      $cons->out("gray", $e->node->getLineString($line_index));
      $cons->out("", $e->node->getColStartString() . "^-------");
    }
  }
  
  public static function displayParserErrors( $appCtx ) {
    if ( (count($appCtx->parserErrors)) == 0 ) {
      echo( "no language test errors" . "\n");
      return;
    }
    echo( "LANGUAGE TEST ERRORS:" . "\n");
    for ( $i_4 = 0; $i_4 < count($appCtx->parserErrors); $i_4++) {
      $e_1 = $appCtx->parserErrors[$i_4];
      $line_index_1 = $e_1->node->getLine();
      echo( ($e_1->node->getFilename() . " Line: ") . (1 + $line_index_1) . "\n");
      echo( $e_1->description . "\n");
      echo( $e_1->node->getLineString($line_index_1) . "\n");
    }
  }
}

/* static PHP main routine */
$allowed_languages = ["es6","go","scala","java7","swift3","cpp","php","ranger"];
if ( ((count($argv) - 1)) < 5 ) {
  echo( "Ranger compiler, version 2.0.8" . "\n");
  echo( "usage <file> <language-file> <language> <directory> <targetfile>" . "\n");
  echo( "allowed languages: " . (implode(" ", $allowed_languages)) . "\n");
  return;
}
$the_file = $argv[0 + 1];
$the_lang_file = $argv[1 + 1];
$the_lang = $argv[2 + 1];
$the_target_dir = $argv[3 + 1];
$the_target = $argv[4 + 1];
echo( "language == " . $the_lang . "\n");
if ( (array_search($the_lang, $allowed_languages, true)) < 0 ) {
  echo( "Invalid language : " . $the_lang . "\n");
  /** unused:  $s = ""   **/ ;
  echo( "allowed languages: " . (implode(" ", $allowed_languages)) . "\n");
  return;
}
if ( (file_exists(".".'/'.$the_file)) == false ) {
  echo( "Could not compile." . "\n");
  echo( "File not found: " . $the_file . "\n");
  return;
}
if ( (file_exists(".".'/'.$the_lang_file)) == false ) {
  echo( ("language file " . $the_lang_file) . " not found!" . "\n");
  echo( "download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj" . "\n");
  return;
}
echo( "File to be compiled: " . $the_file . "\n");
$c = file_get_contents("." . "/" . $the_file) ;
$code =  new SourceCode($c);
$code->filename = $the_file;
$parser =  new RangerLispParser($code);
$parser->parse();
$lcc =  new LiveCompiler();
$node = $parser->rootNode;
$flowParser =  new RangerFlowParser();
$appCtx =  new RangerAppWriterContext();
$wr =  new CodeWriter();
$time_start = microtime(true);
try {
  $flowParser->mergeImports($node, $appCtx, $wr);
  $lang_str = file_get_contents("." . "/" . $the_lang_file) ;
  $lang_code =  new SourceCode($lang_str);
  $lang_code->filename = $the_lang_file;
  $lang_parser =  new RangerLispParser($lang_code);
  $lang_parser->parse();
  $appCtx->langOperators = $lang_parser->rootNode;
  $appCtx->setRootFile($the_file);
  echo( "1. Collecting available methods." . "\n");
  $flowParser->CollectMethods($node, $appCtx, $wr);
  if ( (count($appCtx->compilerErrors)) > 0 ) {
    CompilerInterface::displayCompilerErrors($appCtx);
    return;
  }
  echo( "2. Analyzing the code." . "\n");
  $appCtx->targetLangName = $the_lang;
  echo( "selected language is " . $appCtx->targetLangName . "\n");
  $flowParser->StartWalk($node, $appCtx, $wr);
  if ( (count($appCtx->compilerErrors)) > 0 ) {
    CompilerInterface::displayCompilerErrors($appCtx);
    return;
  }
  echo( "3. Compiling the source code." . "\n");
  $fileSystem =  new CodeFileSystem();
  $file = $fileSystem->getFile(".", $the_target);
  $wr_1 = $file->getWriter();
  $staticMethods;
  $importFork = $wr_1->fork();
  for ( $i = 0; $i < count($appCtx->definedClassList); $i++) {
    $cName = $appCtx->definedClassList[$i];
    if ( $cName == "RangerStaticMethods" ) {
      $staticMethods = $appCtx->definedClasses[$cName];
      continue;
    }
    $cl = $appCtx->definedClasses[$cName];
    if ( $cl->is_trait ) {
      continue;
    }
    if ( $cl->is_system ) {
      continue;
    }
    if ( $cl->is_system_union ) {
      continue;
    }
    $lcc->WalkNode($cl->classNode, $appCtx, $wr_1);
  }
  if ( (isset($staticMethods)) ) {
    $lcc->WalkNode($staticMethods->classNode, $appCtx, $wr_1);
  }
  for ( $i_1 = 0; $i_1 < count($flowParser->collectedIntefaces); $i_1++) {
    $ifDesc = $flowParser->collectedIntefaces[$i_1];
    echo( "should define also interface " . $ifDesc->name . "\n");
    $lcc->langWriter->writeInterface($ifDesc, $appCtx, $wr_1);
  }
  $import_list = $wr_1->getImports();
  if ( $appCtx->targetLangName == "go" ) {
    $importFork->out("package main", true);
    $importFork->newline();
    $importFork->out("import (", true);
    $importFork->indent(1);
  }
  for ( $i_2 = 0; $i_2 < count($import_list); $i_2++) {
    $codeStr = $import_list[$i_2];
    switch ($appCtx->targetLangName ) { 
      case "go" : 
        if ( (ord($codeStr[0])) == (ord((ord("_"[0])))) ) {
          $importFork->out((" _ \"" . (substr($codeStr, 1, (strlen($codeStr)) - 1))) . "\"", true);
        } else {
          $importFork->out(("\"" . $codeStr) . "\"", true);
        }
        break;
      case "rust" : 
        $importFork->out(("use " . $codeStr) . ";", true);
        break;
      case "cpp" : 
        $importFork->out(("#include  " . $codeStr) . "", true);
        break;
      default: 
        $importFork->out(("import " . $codeStr) . "", true);
        break;
    }
  }
  if ( $appCtx->targetLangName == "go" ) {
    $importFork->indent(-1);
    $importFork->out(")", true);
  }
  $fileSystem->saveTo($the_target_dir);
  echo( "Ready." . "\n");
  CompilerInterface::displayCompilerErrors($appCtx);
} catch( Exception $e) {
  if ( isset( $lcc->lastProcessedNode ) ) {
    echo( "Got compiler error close to" . "\n");
    echo( $lcc->lastProcessedNode->getLineAsString() . "\n");
    return;
  }
  if ( isset( $flowParser->lastProcessedNode ) ) {
    echo( "Got compiler error close to" . "\n");
    echo( $flowParser->lastProcessedNode->getLineAsString() . "\n");
    return;
  }
  echo( "Got unknown compiler error" . "\n");
  return;
}
$time_end = microtime(true);
echo("Total time".($time_end - $time_start)."\n");


