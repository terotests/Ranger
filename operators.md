## Statements
<<<<<<< HEAD
  `nullify` ,   `golang_wait` ,   `wait` ,   `timer` ,   `create_dir` ,   `write_file` ,   `=` ,   `def` ,   `return` ,   `gitdoc` ,   `if` ,   `switch` ,   `case` ,   `default` ,   `break` ,   `continue` ,   `while` ,   `throw` ,   `try` ,   `set` ,   `push` ,   `print` ,   `forEach` ,   `forUntil` ,   `color_print` ,   `plugin_preprocess` ,   `plugin_postprocess` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| nullify | |   (`ptr`:<optional>T  )| Clears the optional value to empty state| 
=======
  `nullify` ,   `golang_wait` ,   `wait` ,   `timer` ,   `create_dir` ,   `write_file` ,   `=` ,   `def` ,   `return` ,   `gitdoc` ,   `if` ,   `switch` ,   `case` ,   `default` ,   `break` ,   `continue` ,   `while` ,   `throw` ,   `try` ,   `set` ,   `push` ,   `print` ,   `forEach` ,   `forUntil` ,   `color_print` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| nullify | |   (`ptr`:<optional>T  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| golang_wait | |   (`seconds`:double  )| | 
| wait | |   (`seconds`:double  )| | 
| timer | |   (`name`:string  `code`:block  )| | 
| create_dir | |   (`path`:string  )| | 
| write_file | |   (`path`:string  `file`:string  `data`:string  )| | 
| = | |   (`immutable_left`:T  `immutable_right`:T  )| | 
| def | |   (`varname`:T  )| | 
<<<<<<< HEAD
| return | |   (`value`:T  )| | 
=======
| return | |   ( )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| gitdoc | |   (`value`:string  )| | 
| if | |   (`condition`:boolean  `then_block`:block  `else_block`:block  )| | 
| switch | |   (`condition`:char  `case_list`:block  )| | 
| case | |   (`condition`:char  `case_block`:block  )| | 
| default | |   (`default_block`:block  )| | 
| break | |   ( )| | 
| continue | |   ( )| | 
| while | |   (`condition`:boolean  `whileLoop`:block  )| | 
| throw | |   (`eInfo`:string  )| | 
| try | |   (`try_block`:block  `catch_block`:block  )| | 
| set | |   (`e`:JSONDataObject  `key`:string  `value`:JSONValueUnion  )| | 
| push | |   (`e`:JSONArrayObject  `el`:JSONArrayUnion  )| | 
| print | |   (`text`:string  )| | 
| forEach | |   (`self`:Vector  `cb`:(fn:void (item: T))  )| | 
| forUntil | |   (`self`:Vector  `cb`:(fn:boolean (item: T))  )| | 
| color_print | |   (`cname`:string  `text`:string  )| | 
<<<<<<< HEAD
| plugin_preprocess | |   (`plugin`:RangerCompilerPlugin  `root`:CodeNode  `ctx`:RangerAppWriterContext  `wr`:CodeWriter  )| | 
| plugin_postprocess | |   (`plugin`:RangerCompilerPlugin  `root`:CodeNode  `ctx`:RangerAppWriterContext  `wr`:CodeWriter  )| | 
=======
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f

## Language switches
  `if_javascript` ,   `if_go` ,   `if_java` ,   `if_swift` ,   `if_php` ,   `if_cpp` ,   `if_csharp` ,   `if_scala` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| if_javascript | |   (`code`:block  )| run this code only in JavaScript| 
| if_go | |   (`code`:block  )| run this code only for Golang target| 
| if_java | |   (`code`:block  )| run this code only for Java target| 
| if_swift | |   (`code`:block  )| run this code only for Swift target| 
| if_php | |   (`code`:block  )| run this code only for PHP target| 
| if_cpp | |   (`code`:block  )| run this code only for C++ target| 
| if_csharp | |   (`code`:block  )| run this code only for C# target| 
| if_scala | |   (`code`:block  )| run this code only for Scala target| 

## Operators without arguments
<<<<<<< HEAD
  `create_immutable_array` ,   `create_immutable_hash` ,   `M_PI` ,   `shell_arg_cnt` ,   `install_directory` ,   `current_directory` ,   `error_msg` ,   `json_array` ,   `json_object` ,   `r.expression` ,   `r.block` ,   `has_console_colors` 
=======
  `create_immutable_array` ,   `create_immutable_hash` ,   `M_PI` ,   `shell_arg_cnt` ,   `install_directory` ,   `current_directory` ,   `error_msg` ,   `json_array` ,   `json_object` ,   `has_console_colors` 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| create_immutable_array | `[T]` |   ( )| | 
| create_immutable_hash | `[K:T]` |   ( )| | 
| M_PI | `double` |   ( )| | 
| shell_arg_cnt | `int` |   ( )| return the number of arguments for command line utility| 
| install_directory | `string` |   ( )| | 
| current_directory | `string` |   ( )| | 
| error_msg | `string` |   ( )| | 
| json_array | `JSONArrayObject` |   ( )| | 
| json_object | `JSONDataObject` |   ( )| | 
<<<<<<< HEAD
| r.expression | `CodeNode` |   ( )| | 
| r.block | `CodeNode` |   ( )| | 
| has_console_colors | `boolean` |   ( )| | 

## Generic operators
  `empty` ,   `wrap` ,   `!!` ,   `unwrap` ,   `??` ,   `[]` ,   `null?` ,   `!null?` ,   `==` ,   `!=` ,   `&&` ,   `cast` ,   `to` 
=======
| has_console_colors | `boolean` |   ( )| | 

## Generic operators
  `empty` ,   `wrap` ,   `!!` ,   `unwrap` ,   `return` ,   `??` ,   `[]` ,   `null?` ,   `!null?` ,   `==` ,   `!=` ,   `&&` ,   `cast` ,   `to` 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| empty | `<optional>T` |   (`node`:T  )| | 
| wrap | `<optional>T` |   (`arg`:T  )| | 
| !! | `T` |   (`arg`:<optional>T  )| | 
| unwrap | `T` |   (`arg`:<optional>T  )| | 
<<<<<<< HEAD
=======
| return | `T` |   (`value`:T  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| ?? | `T` |   (`left`:<optional>T  `right`:T  )| | 
| [] | `[T]` |   (`typeDef`:T  `listOf`:expression  )| | 
| null? | `boolean` |   (`arg`:<optional>T  )| | 
| !null? | `boolean` |   (`arg`:<optional>T  )| | 
| == | `boolean` |   (`left`:T  `right`:T  )| | 
| != | `boolean` |   (`left`:T  `right`:T  )| | 
| && | `boolean` |   (`left`:<optional>T  `right`:<optional>S  )| | 
<<<<<<< HEAD
| cast | `Any` |   (`arg`:T  `target`:Any  )| | 
| to | `T` |   (`to`:T  `item`:T  )| | 

## Numeric operators
  `fabs` ,   `tan` ,   `unwrap` ,   `unwrap` ,   `-` ,   `-` ,   `+` ,   `+` ,   `%` ,   `*` ,   `*` ,   `/` ,   `/` ,   `int2double` ,   `acos` ,   `cos` ,   `sin` ,   `sqrt` ,   `to_int` ,   `to_double` 
=======
| cast | `S` |   (`arg`:T  `target`:S  )| | 
| to | `T` |   (`to`:T  `item`:T  )| | 

## Numeric operators
  `fabs` ,   `tan` ,   `unwrap` ,   `unwrap` ,   `-` ,   `-` ,   `+` ,   `+` ,   `*` ,   `*` ,   `/` ,   `/` ,   `int2double` ,   `acos` ,   `cos` ,   `sin` ,   `sqrt` ,   `to_int` ,   `to_double` 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| fabs | `double` |   (`v`:double  )| | 
| tan | `double` |   (`v`:double  )| | 
| unwrap | `int` |   (`arg`:<optional>int  )| | 
| unwrap | `double` |   (`arg`:<optional>double  )| | 
| - | `double` |   (`left`:double  `right`:double  )| | 
| - | `int` |   (`left`:int  `right`:int  )| | 
| + | `double` |   (`left`:double  `right`:double  )| | 
| + | `int` |   (`left`:int  `right`:<optional>int  )| | 
<<<<<<< HEAD
| % | `int` |   (`left`:int  `right`:int  )| | 
=======
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| * | `double` |   (`left`:double  `right`:double  )| | 
| * | `int` |   (`left`:int  `right`:int  )| | 
| / | `double` |   (`left`:double  `right`:double  )| | 
| / | `double` |   (`left`:int  `right`:int  )| | 
| int2double | `double` |   (`value`:int  )| | 
| acos | `double` |   (`value`:double  )| | 
| cos | `double` |   (`value`:double  )| | 
| sin | `double` |   (`value`:double  )| | 
| sqrt | `double` |   (`value`:double  )| | 
| to_int | `int` |   (`value`:double  )| | 
| to_double | `double` |   (`input`:int  )| | 

## Miscellaneous operators
  `shell_arg` ,   `to_string` ,   `strfromcode` ,   `double2str` ,   `r.value` ,   `r.value` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| shell_arg | `string` |   (`index`:int  )| | 
| to_string | `string` |   (`value`:int  )| | 
| strfromcode | `string` |   (`code`:int  )| | 
| double2str | `string` |   (`value`:double  )| | 
| r.value | `CodeNode` |   (`n`:double  )| | 
| r.value | `CodeNode` |   (`n`:int  )| | 

## String operators
<<<<<<< HEAD
  `has` ,   `has_option` ,   `get_option` ,   `get_required_option` ,   `sha256` ,   `md5` ,   `env_var` ,   `file_exists` ,   `dir_exists` ,   `read_file` ,   `+` ,   `null?` ,   `!null?` ,   `trim` ,   `strsplit` ,   `strlen` ,   `substring` ,   `to_charbuffer` ,   `to_int` ,   `length` ,   `at` ,   `charAt` ,   `charcode` ,   `ccode` ,   `str2int` ,   `str2double` ,   `to_double` ,   `indexOf` ,   `first` ,   `to_uppercase` ,   `==` ,   `!=` ,   `from_string` ,   `json_obj.attr` ,   `json.attr` ,   `r.op` ,   `r.vref` ,   `r.value` ,   `load_compiler_plugin` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| has | `boolean` |   (`str`:string  )| If string value is greater than > 0| 
=======
  `has_option` ,   `get_option` ,   `get_required_option` ,   `sha256` ,   `md5` ,   `env_var` ,   `file_exists` ,   `dir_exists` ,   `read_file` ,   `+` ,   `null?` ,   `!null?` ,   `trim` ,   `strsplit` ,   `strlen` ,   `substring` ,   `to_charbuffer` ,   `to_int` ,   `length` ,   `charAt` ,   `charcode` ,   `ccode` ,   `str2int` ,   `str2double` ,   `to_double` ,   `indexOf` ,   `to_uppercase` ,   `==` ,   `!=` ,   `from_string` ,   `json_obj.attr` ,   `json.attr` ,   `r.op` ,   `r.vref` ,   `r.value` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| has_option | `boolean` |   (`name`:string  )| | 
| get_option | `string` |   (`name`:string  )| | 
| get_required_option | `string` |   (`n`:string  )| | 
| sha256 | `string` |   (`input`:string  )| | 
| md5 | `string` |   (`input`:string  )| | 
| env_var | `<optional>string` |   (`name`:string  )| | 
| file_exists | `boolean` |   (`path`:string  `filename`:string  )| | 
| dir_exists | `boolean` |   (`path`:string  )| | 
| read_file | `<optional>string` |   (`path`:string  `filename`:string  )| | 
| + | `string` |   (`left`:string  `right`:enum  )| | 
| null? | `boolean` |   (`arg`:<optional>string  )| | 
| !null? | `boolean` |   (`arg`:<optional>string  )| | 
| trim | `string` |   (`value`:string  )| | 
| strsplit | `[string]` |   (`strToSplit`:string  `delimiter`:string  )| | 
| strlen | `int` |   (`text`:string  )| | 
<<<<<<< HEAD
| substring | `string` |   (`text`:string  `position`:int  )| | 
| to_charbuffer | `charbuffer` |   (`text`:string  )| | 
| to_int | `<optional>int` |   (`txt`:string  )| | 
| length | `int` |   (`text`:string  )| | 
| at | `string` |   (`text`:string  `position`:int  )| | 
=======
| substring | `string` |   (`text`:string  `start`:int  `end`:int  )| | 
| to_charbuffer | `charbuffer` |   (`text`:string  )| | 
| to_int | `<optional>int` |   (`txt`:string  )| | 
| length | `int` |   (`text`:string  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| charAt | `int` |   (`text`:string  `position`:int  )| | 
| charcode | `char` |   (`text`:string  )| | 
| ccode | `char` |   (`text`:string  )| | 
| str2int | `<optional>int` |   (`value`:string  )| | 
| str2double | `<optional>double` |   (`value`:string  )| | 
| to_double | `<optional>double` |   (`value`:string  )| | 
| indexOf | `int` |   (`str`:string  `key`:string  )| | 
<<<<<<< HEAD
| first | `string` |   (`str`:string  )| | 
=======
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| to_uppercase | `string` |   (`s`:string  )| | 
| == | `boolean` |   (`left`:string  `right`:string  )| | 
| != | `boolean` |   (`left`:string  `right`:string  )| | 
| from_string | `JSONDataObject` |   (`txt`:string  )| | 
| json_obj.attr | `JSONKeyValue` |   (`name`:string  `value`:string  )| | 
| json.attr | `JSONKeyValue` |   (`name`:string  `value`:string  )| | 
| r.op | `CodeNode` |   (`n`:string  )| | 
| r.vref | `CodeNode` |   (`n`:string  `t`:string  )| | 
| r.value | `CodeNode` |   (`n`:string  )| | 
<<<<<<< HEAD
| load_compiler_plugin | `RangerCompilerPlugin` |   (`name`:string  )| | 


## Array operators
  `has` ,   `def` ,   `make` ,   `for` ,   `length` ,   `at` ,   `join` ,   `set` ,   `lift` ,   `itemAt` ,   `indexOf` ,   `clone` ,   `remove_index` ,   `insert` ,   `remove` ,   `push` ,   `removeLast` ,   `clear` ,   `last_index` ,   `last` ,   `first` ,   `size` ,   `sort` ,   `reverse` ,   `array_length` ,   `array_extract` ,   `forEach` ,   `map` ,   `filter` ,   `reduce` ,   `groupBy` ,   `find` ,   `count` ,   `contains` ,   `r.expression` ,   `r.block` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| has | `boolean` |   (`array`:[T]  )| | 
=======


## Array operators
  `def` ,   `make` ,   `for` ,   `length` ,   `join` ,   `has` ,   `set` ,   `lift` ,   `itemAt` ,   `indexOf` ,   `clone` ,   `contains` ,   `remove_index` ,   `insert` ,   `remove` ,   `push` ,   `removeLast` ,   `clear` ,   `last_index` ,   `last` ,   `sort` ,   `reverse` ,   `array_length` ,   `array_extract` ,   `forEach` ,   `map` ,   `filter` ,   `reduce` ,   `groupBy` ,   `find` ,   `count` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| def | |   (`varname`:[T]  )| | 
| make | `[T]` |   (`typeDef`:[T]  `size`:int  `repeatItem`:T  )| | 
| for | |   (`list`:[T]  `item`:T  `indexName`:int  `repeat_block`:block  )| | 
| length | `int` |   (`array`:[T]  )| | 
<<<<<<< HEAD
| at | `T` |   (`array`:[T]  `index`:int  )| | 
| join | `string` |   (`array`:[string]  `delimiter`:string  )| | 
=======
| join | `string` |   (`array`:[string]  `delimiter`:string  )| | 
| has | `boolean` |   (`array`:[T]  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| set | |   (`array`:[T]  `index`:int  `value`:T  )| | 
| lift | `<optional>T` |   (`array`:[T]  `index`:int  )| | 
| itemAt | `T` |   (`array`:[T]  `index`:int  )| | 
| indexOf | `int` |   (`array`:[T]  `element`:T  )| | 
| clone | `[T]` |   (`array`:[T]  )| Create a copy of this buffer| 
<<<<<<< HEAD
=======
| contains | `boolean` |   (`array`:[T]  `element`:T  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| remove_index | |   (`array`:[T]  `index`:int  )| | 
| insert | |   (`array`:[T]  `index`:int  `item`:T  )| | 
| remove | |   (`array`:[T]  `index`:int  )| | 
| push | |   (`array`:[T]  `item`:<optional>T  )| | 
| removeLast | |   (`array`:[T]  )| | 
| clear | |   (`array`:[T]  )| | 
| last_index | `int` |   (`array`:[T]  )| | 
| last | `T` |   (`array`:[T]  )| | 
<<<<<<< HEAD
| first | `T` |   (`array`:[T]  )| | 
| size | `int` |   (`array`:[T]  )| | 
=======
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| sort | `[T]` |   (`array`:[T]  `cb`:(fn:int (left: T, right: T))  )| | 
| reverse | `[T]` |   (`array`:[T]  )| | 
| array_length | `int` |   (`array`:[T]  )| | 
| array_extract | `T` |   (`array`:[T]  `position`:int  )| | 
<<<<<<< HEAD
| forEach | |   (`self`:[T]  `cb`:(fn:void (item: T, index: int))  )| | 
| map | `[T]` |   (`self`:[T]  `cb`:(fn:T (item: T, index: int))  )| | 
| filter | `[T]` |   (`self`:[T]  `cb`:(fn:boolean (item: T, index: int))  )| | 
=======
| forEach | |   (`self`:[T]  `cb`:(fn:void (item: T, index: int))  )| Call `fb` for each item in array| 
| map | `[S]` |   (`self`:[T]  `cb`:(fn:S (item: T, index: int))  `to`:[S]  )| | 
| filter | `[T]` |   (`self`:[T]  `cb`:(fn:boolean (item: T))  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| reduce | `T` |   (`self`:[T]  `cb`:(fn:T (left: T, right: T))  `initialValue`:T  )| | 
| groupBy | `[T]` |   (`self`:[T]  `cb`:(fn:string (item: T))  )| | 
| find | `<optional>T` |   (`self`:[T]  `cb`:(fn:boolean (item: T))  )| | 
| count | `int` |   (`self`:[T]  `cb`:(fn:boolean (item: T))  )| | 
<<<<<<< HEAD
| contains | `boolean` |   (`self`:[T]  `cb`:(fn:boolean (item: T))  )| | 
| r.expression | `CodeNode` |   (`v`:[CodeNode]  )| | 
| r.block | `CodeNode` |   (`v`:[CodeNode]  )| | 

## Map operators
  `has` ,   `def` ,   `for` ,   `keys` ,   `get` ,   `get` ,   `set` ,   `forEach` ,   `forKeys` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| has | `boolean` |   (`map`:[K:T]  `key`:K  )| | 
| def | |   (`varname`:[K:T]  )| | 
| for | |   (`hash`:[string:T]  `item`:T  `itemName`:string  `repeat_block`:block  )| | 
| keys | `[string]` |   (`map`:[string:T]  )| | 
=======

## Map operators
  `def` ,   `for` ,   `keys` ,   `has` ,   `get` ,   `get` ,   `set` ,   `forEach` ,   `forKeys` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| def | |   (`varname`:[K:T]  )| | 
| for | |   (`hash`:[string:T]  `item`:T  `itemName`:string  `repeat_block`:block  )| | 
| keys | `[string]` |   (`map`:[string:T]  )| | 
| has | `boolean` |   (`map`:[K:T]  `key`:K  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| get | `<optional>int` |   (`map`:[K:int]  `key`:K  )| | 
| get | `<optional>T` |   (`map`:[K:T]  `key`:K  )| | 
| set | |   (`map`:[K:T]  `key`:K  `value`:T  )| | 
| forEach | |   (`self`:[string:T]  `cb`:(fn:void (item: T, index: string))  )| | 
| forKeys | |   (`self`:[string:T]  `cb`:(fn:void (index: string))  )| | 

## Boolean / test operators
<<<<<<< HEAD
  `has` ,   `has` ,   `has` ,   `has` ,   `has_option` ,   `file_exists` ,   `dir_exists` ,   `null?` ,   `null?` ,   `null?` ,   `null?` ,   `!null?` ,   `!null?` ,   `!null?` ,   `!null?` ,   `==` ,   `==` ,   `==` ,   `==` ,   `==` ,   `==` ,   `==` ,   `>` ,   `>` ,   `>` ,   `<=` ,   `<=` ,   `<=` ,   `<` ,   `<` ,   `<` ,   `!=` ,   `!=` ,   `!=` ,   `!=` ,   `>=` ,   `>=` ,   `>=` ,   `&&` ,   `&&` ,   `||` ,   `getBoolean` ,   `isArray` ,   `contains` ,   `is_not_limiter` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| has | `boolean` |   (`str`:string  )| If string value is greater than > 0| 
| has | `boolean` |   (`map`:[K:T]  `key`:K  )| | 
| has | `boolean` |   (`array`:[T]  )| | 
| has | `boolean` |   (`self`:Map  `key`:K  )| | 
=======
  `has_option` ,   `file_exists` ,   `dir_exists` ,   `null?` ,   `null?` ,   `null?` ,   `null?` ,   `!null?` ,   `!null?` ,   `!null?` ,   `!null?` ,   `has` ,   `has` ,   `has` ,   `contains` ,   `==` ,   `==` ,   `==` ,   `==` ,   `==` ,   `==` ,   `==` ,   `>` ,   `>` ,   `>` ,   `<=` ,   `<=` ,   `<=` ,   `<` ,   `<` ,   `<` ,   `!=` ,   `!=` ,   `!=` ,   `!=` ,   `>=` ,   `>=` ,   `>=` ,   `&&` ,   `&&` ,   `||` ,   `getBoolean` ,   `isArray` ,   `is_not_limiter` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| has_option | `boolean` |   (`name`:string  )| | 
| file_exists | `boolean` |   (`path`:string  `filename`:string  )| | 
| dir_exists | `boolean` |   (`path`:string  )| | 
| null? | `boolean` |   (`arg`:<optional>int  )| | 
| null? | `boolean` |   (`arg`:<optional>double  )| | 
| null? | `boolean` |   (`arg`:<optional>string  )| | 
| null? | `boolean` |   (`arg`:<optional>T  )| | 
| !null? | `boolean` |   (`arg`:<optional>int  )| | 
| !null? | `boolean` |   (`arg`:<optional>double  )| | 
| !null? | `boolean` |   (`arg`:<optional>string  )| | 
| !null? | `boolean` |   (`arg`:<optional>T  )| | 
<<<<<<< HEAD
=======
| has | `boolean` |   (`map`:[K:T]  `key`:K  )| | 
| has | `boolean` |   (`array`:[T]  )| | 
| has | `boolean` |   (`self`:Map  `key`:K  )| | 
| contains | `boolean` |   (`array`:[T]  `element`:T  )| | 
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| == | `boolean` |   (`left`:string  `right`:string  )| | 
| == | `boolean` |   (`left`:T  `right`:T  )| | 
| == | `boolean` |   (`left`:enum  `right`:enum  )| | 
| == | `boolean` |   (`left`:int  `right`:char  )| | 
| == | `boolean` |   (`left`:char  `right`:int  )| | 
| == | `boolean` |   (`left`:double  `right`:double  )| | 
| == | `boolean` |   (`left`:boolean  `right`:boolean  )| | 
| > | `boolean` |   (`left`:double  `right`:double  )| | 
| > | `boolean` |   (`left`:int  `right`:int  )| | 
| > | `boolean` |   (`left`:char  `right`:int  )| | 
| <= | `boolean` |   (`left`:char  `right`:int  )| | 
| <= | `boolean` |   (`left`:int  `right`:char  )| | 
| <= | `boolean` |   (`left`:double  `right`:double  )| | 
| < | `boolean` |   (`left`:int  `right`:char  )| | 
| < | `boolean` |   (`left`:char  `right`:int  )| | 
| < | `boolean` |   (`left`:double  `right`:double  )| | 
| != | `boolean` |   (`left`:string  `right`:string  )| | 
| != | `boolean` |   (`left`:int  `right`:char  )| | 
| != | `boolean` |   (`left`:char  `right`:int  )| | 
| != | `boolean` |   (`left`:T  `right`:T  )| | 
| >= | `boolean` |   (`left`:int  `right`:char  )| | 
| >= | `boolean` |   (`left`:char  `right`:int  )| | 
| >= | `boolean` |   (`left`:double  `right`:double  )| | 
| && | `boolean` |   (`left`:<optional>T  `right`:<optional>S  )| | 
| && | `boolean` |   (`left`:boolean  `right`:<optional>S  )| | 
| &#124;&#124; | `boolean` |   (`left`:boolean  `right`:boolean  )| | 
| getBoolean | `<optional>boolean` |   (`e`:JSONDataObject  `key`:string  )| | 
| isArray | `boolean` |   (`e`:JSONValueUnion  )| | 
<<<<<<< HEAD
| contains | `boolean` |   (`self`:[T]  `cb`:(fn:boolean (item: T))  )| | 
=======
>>>>>>> 4618b3ebcb1dfb69ee3fc2d0913cf715dfa94b1f
| is_not_limiter | `boolean` |   (`c`:char  )| | 
