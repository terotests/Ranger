/**
 * Ranger Language Keywords, Types, Operators, and Built-in Functions
 *
 * This file contains all the language constructs for auto-completion and hover information.
 */

export interface LanguageItem {
  name: string;
  description: string;
  signature?: string;
}

/**
 * Ranger Keywords
 */
export const KEYWORDS: LanguageItem[] = [
  { name: "class", description: "Define a new class" },
  {
    name: "extension",
    description: "Extend an existing class with new methods/properties",
  },
  { name: "Extends", description: "Inherit from a parent class" },
  { name: "Constructor", description: "Define class constructor" },
  { name: "fn", description: "Define an instance method" },
  { name: "sfn", description: "Define a static method" },
  { name: "def", description: "Define a variable or property" },
  { name: "let", description: "Define a local variable" },
  { name: "if", description: "Conditional statement" },
  { name: "if!", description: "Negated conditional (if NOT)" },
  { name: "while", description: "While loop" },
  { name: "for", description: "For loop over array" },
  { name: "switch", description: "Switch/case statement" },
  { name: "case", description: "Case branch in switch" },
  { name: "default", description: "Default branch in switch" },
  { name: "break", description: "Break out of loop" },
  { name: "continue", description: "Continue to next iteration" },
  { name: "return", description: "Return from function" },
  { name: "throw", description: "Throw an error" },
  { name: "try", description: "Try-catch error handling" },
  { name: "new", description: "Create new instance of class" },
  { name: "Import", description: "Import another Ranger file" },
  { name: "Enum", description: "Define an enumeration" },
  { name: "operators", description: "Define custom operators" },
  {
    name: "templates",
    description: "Define operator templates for target languages",
  },
  {
    name: "systemclass",
    description: "Define system class mappings for native types",
  },
];

/**
 * Ranger Primitive and Built-in Types
 */
export const TYPES: LanguageItem[] = [
  { name: "int", description: "Integer number type" },
  { name: "double", description: "Floating-point number type" },
  { name: "string", description: "Text string type" },
  { name: "boolean", description: "Boolean true/false type" },
  { name: "char", description: "Single character type" },
  { name: "charbuffer", description: "Byte array/buffer type" },
  { name: "void", description: "No return value" },
];

/**
 * Ranger Annotations
 */
export const ANNOTATIONS: LanguageItem[] = [
  { name: "main", description: "Mark as program entry point" },
  { name: "optional", description: "Value may be null/undefined" },
  { name: "mutable", description: "Variable can be reassigned" },
  { name: "weak", description: "Weak reference" },
  { name: "strong", description: "Strong reference" },
  { name: "temp", description: "Temporary variable" },
  { name: "pure", description: "Pure function (no side effects)" },
  { name: "async", description: "Asynchronous function" },
  { name: "throws", description: "Function may throw an error" },
];

/**
 * Ranger Built-in Functions and Operators
 */
export const BUILT_IN_FUNCTIONS: LanguageItem[] = [
  // Array operations
  {
    name: "push",
    description: "Add item to end of array",
    signature: "push array item",
  },
  {
    name: "itemAt",
    description: "Get item at index",
    signature: "(itemAt array index)",
  },
  {
    name: "array_length",
    description: "Get array length",
    signature: "(array_length array)",
  },
  {
    name: "set",
    description: "Set item at index or map key",
    signature: "set array index value",
  },
  {
    name: "remove_array_at",
    description: "Remove item at index",
    signature: "remove_array_at array index",
  },
  {
    name: "indexOf",
    description: "Find index of item (-1 if not found)",
    signature: "(indexOf array item)",
  },
  {
    name: "slice",
    description: "Get subarray",
    signature: "(slice array start end)",
  },

  // Map operations
  {
    name: "get",
    description: "Get value from map (returns optional)",
    signature: "(get map key)",
  },
  {
    name: "has",
    description: "Check if key exists in map",
    signature: "(has map key)",
  },
  {
    name: "keys",
    description: "Get all keys from map",
    signature: "(keys map)",
  },
  {
    name: "remove",
    description: "Remove key from map",
    signature: "remove map key",
  },

  // String operations
  {
    name: "strlen",
    description: "Get string length",
    signature: "(strlen string)",
  },
  {
    name: "substring",
    description: "Get substring",
    signature: "(substring string start end)",
  },
  {
    name: "charAt",
    description: "Get character code at index",
    signature: "(charAt string index)",
  },
  {
    name: "at",
    description: "Get character at index as string",
    signature: "(at string index)",
  },
  {
    name: "strsplit",
    description: "Split string by delimiter",
    signature: "(strsplit string delimiter)",
  },
  {
    name: "trim",
    description: "Trim whitespace from string",
    signature: "(trim string)",
  },
  {
    name: "startsWith",
    description: "Check if string starts with prefix",
    signature: "(startsWith string prefix)",
  },
  {
    name: "endsWith",
    description: "Check if string ends with suffix",
    signature: "(endsWith string suffix)",
  },
  {
    name: "contains",
    description: "Check if string contains substring",
    signature: "(contains string substring)",
  },
  {
    name: "replace",
    description: "Replace first occurrence",
    signature: "(replace string old new)",
  },
  {
    name: "to_uppercase",
    description: "Convert to uppercase",
    signature: "(to_uppercase string)",
  },
  {
    name: "to_lowercase",
    description: "Convert to lowercase",
    signature: "(to_lowercase string)",
  },
  {
    name: "join",
    description: "Join array with delimiter",
    signature: "(join array delimiter)",
  },

  // Type conversion
  {
    name: "to_int",
    description: "Convert double to int",
    signature: "(to_int double)",
  },
  {
    name: "to_double",
    description: "Convert int to double",
    signature: "(to_double int)",
  },
  {
    name: "to_string",
    description: "Convert charbuffer to string",
    signature: "(to_string buffer)",
  },
  {
    name: "to_charbuffer",
    description: "Convert string to charbuffer",
    signature: "(to_charbuffer string)",
  },
  {
    name: "str2int",
    description: "Parse string to int (returns optional)",
    signature: "(str2int string)",
  },
  {
    name: "str2double",
    description: "Parse string to double (returns optional)",
    signature: "(str2double string)",
  },

  // Math functions
  { name: "sin", description: "Sine function", signature: "(sin value)" },
  { name: "cos", description: "Cosine function", signature: "(cos value)" },
  { name: "tan", description: "Tangent function", signature: "(tan value)" },
  { name: "asin", description: "Arc sine function", signature: "(asin value)" },
  {
    name: "acos",
    description: "Arc cosine function",
    signature: "(acos value)",
  },
  { name: "sqrt", description: "Square root", signature: "(sqrt value)" },
  { name: "floor", description: "Floor function", signature: "(floor value)" },
  { name: "ceil", description: "Ceiling function", signature: "(ceil value)" },
  { name: "fabs", description: "Absolute value", signature: "(fabs value)" },
  { name: "M_PI", description: "Pi constant", signature: "(M_PI)" },
  {
    name: "random",
    description: "Random number",
    signature: "(random) or (random min max)",
  },

  // Optional handling
  {
    name: "null?",
    description: "Check if optional is null",
    signature: "(null? optional)",
  },
  {
    name: "!null?",
    description: "Check if optional is not null",
    signature: "(!null? optional)",
  },
  {
    name: "unwrap",
    description: "Get value from optional",
    signature: "(unwrap optional)",
  },
  {
    name: "wrap",
    description: "Wrap value as optional",
    signature: "(wrap value)",
  },

  // I/O operations
  {
    name: "print",
    description: "Print to console",
    signature: "print message",
  },
  {
    name: "read_file",
    description: "Read file contents (returns optional)",
    signature: "(read_file path filename)",
  },
  {
    name: "write_file",
    description: "Write to file",
    signature: "write_file path filename data",
  },
  {
    name: "file_exists",
    description: "Check if file exists",
    signature: "(file_exists path filename)",
  },
  {
    name: "dir_exists",
    description: "Check if directory exists",
    signature: "(dir_exists path)",
  },
  {
    name: "create_dir",
    description: "Create directory",
    signature: "create_dir path",
  },

  // Error handling
  {
    name: "error_msg",
    description: "Get error message in catch block",
    signature: "(error_msg)",
  },

  // Miscellaneous
  { name: "sha256", description: "SHA256 hash", signature: "(sha256 input)" },
  { name: "md5", description: "MD5 hash", signature: "(md5 input)" },
];

/**
 * Ranger Operators
 */
export const OPERATORS: LanguageItem[] = [
  // Arithmetic
  { name: "+", description: "Addition or string concatenation" },
  { name: "-", description: "Subtraction" },
  { name: "*", description: "Multiplication" },
  { name: "/", description: "Division" },
  { name: "%", description: "Modulo (remainder)" },

  // Comparison
  { name: "==", description: "Equal to" },
  { name: "!=", description: "Not equal to" },
  { name: "<", description: "Less than" },
  { name: "<=", description: "Less than or equal" },
  { name: ">", description: "Greater than" },
  { name: ">=", description: "Greater than or equal" },

  // Boolean
  { name: "&&", description: "Logical AND" },
  { name: "||", description: "Logical OR" },
  { name: "!", description: "Logical NOT" },

  // Special
  { name: "?", description: "Ternary conditional" },
  { name: "??", description: "Elvis operator (null coalescing)" },
  { name: "=", description: "Assignment" },
];
