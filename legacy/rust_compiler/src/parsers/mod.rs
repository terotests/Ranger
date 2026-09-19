use std::collections::HashMap;
use std::rc::Rc;
use std::cell::RefCell;

use crate::models::{CodeNode, SourceCode, RangerNodeType, RangerAppWriterContext, CompilerError, RangerAppClassDesc, RangerAppFunctionDesc, RangerAppParamDesc};
use crate::writers::CodeWriter;

/// Parser for Ranger Lisp-like syntax
pub struct RangerLispParser {
    pub source: SourceCode,
    pub root_node: Option<Rc<RefCell<CodeNode>>>,
    pub current_idx: usize,
    pub line: usize,
    pub column: usize,
    pub error: Option<String>,
}

impl RangerLispParser {
    pub fn new(source: SourceCode) -> Self {
        Self {
            source,
            root_node: None,
            current_idx: 0,
            line: 1,
            column: 1,
            error: None,
        }
    }
    
    /// Parse the source code and build the AST
    pub fn parse(&mut self, create_root: bool) -> bool {
        // Initialize root node if requested
        if create_root {
            let mut root = CodeNode::new();
            root.node_type = RangerNodeType::Root;
            root.name = "root".to_string();
            self.root_node = Some(Rc::new(RefCell::new(root)));
        }
        
        // Parse the entire source code
        while self.current_idx < self.source.content.len() {
            if let Some(node) = self.parse_next_node() {
                // Add the parsed node to the root
                if let Some(ref root) = self.root_node {
                    root.borrow_mut().add_child(node);
                } else {
                    // If there's no root, use this as the root
                    self.root_node = Some(node);
                    break;
                }
            } else if let Some(err) = &self.error {
                // If there was an error parsing, return false
                println!("Error parsing at line {}, column {}: {}", self.line, self.column, err);
                return false;
            } else {
                // Skip whitespace and continue
                self.skip_whitespace();
            }
        }
        
        true
    }
    
    /// Parse the next node in the source code
    fn parse_next_node(&mut self) -> Option<Rc<RefCell<CodeNode>>> {
        self.skip_whitespace();
        
        if self.current_idx >= self.source.content.len() {
            return None;
        }
        
        // Get the current character
        let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
        
        match current_char {
            '(' => self.parse_expression(),
            '"' => self.parse_string(),
            '0'..='9' | '-' => self.parse_number(),
            ';' => self.parse_comment(),
            _ => self.parse_symbol(),
        }
    }
    
    /// Parse a Lisp-like expression (form)
    fn parse_expression(&mut self) -> Option<Rc<RefCell<CodeNode>>> {
        // Skip the opening parenthesis
        self.advance();
        
        // Create a new expression node
        let mut expr = CodeNode::new();
        expr.node_type = RangerNodeType::Expression;
        expr.idx = self.current_idx;
        expr.line = self.line;
        expr.column = self.column;
        let expr_node = Rc::new(RefCell::new(expr));
        
        // Parse the operator (first element of the expression)
        self.skip_whitespace();
        if let Some(op_node) = self.parse_next_node() {
            // If the operator is a symbol, set it as the name of the expression
            if op_node.borrow().node_type == RangerNodeType::Variable {
                expr_node.borrow_mut().name = op_node.borrow().value.clone();
            }
            
            // Add the operator as the first child
            expr_node.borrow_mut().add_child(op_node);
            
            // Parse all remaining arguments until the closing parenthesis
            loop {
                self.skip_whitespace();
                
                // Check for end of expression
                if self.current_idx >= self.source.content.len() {
                    self.error = Some("Unexpected end of file in expression".to_string());
                    return None;
                }
                
                let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
                if current_char == ')' {
                    // Skip the closing parenthesis
                    self.advance();
                    break;
                }
                
                // Parse the next argument
                if let Some(arg_node) = self.parse_next_node() {
                    expr_node.borrow_mut().add_child(arg_node);
                } else if self.error.is_some() {
                    return None;
                }
            }
            
            Some(expr_node)
        } else {
            self.error = Some("Expected operator in expression".to_string());
            None
        }
    }
    
    /// Parse a string literal
    fn parse_string(&mut self) -> Option<Rc<RefCell<CodeNode>>> {
        // Skip the opening quote
        self.advance();
        
        let mut string_value = String::new();
        let start_idx = self.current_idx;
        let start_line = self.line;
        let start_column = self.column;
        
        // Parse until the closing quote
        let mut escaped = false;
        
        while self.current_idx < self.source.content.len() {
            let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
            
            if escaped {
                // Handle escape sequences
                match current_char {
                    'n' => string_value.push('\n'),
                    't' => string_value.push('\t'),
                    'r' => string_value.push('\r'),
                    '\\' => string_value.push('\\'),
                    '"' => string_value.push('"'),
                    _ => string_value.push(current_char),
                }
                escaped = false;
            } else if current_char == '\\' {
                escaped = true;
            } else if current_char == '"' {
                // Skip the closing quote
                self.advance();
                
                // Create a new string node
                let mut string_node = CodeNode::new();
                string_node.node_type = RangerNodeType::Literal;
                string_node.value = string_value;
                string_node.set_property("type", "string");
                string_node.idx = start_idx;
                string_node.line = start_line;
                string_node.column = start_column;
                
                return Some(Rc::new(RefCell::new(string_node)));
            } else {
                string_value.push(current_char);
            }
            
            self.advance();
        }
        
        self.error = Some("Unterminated string literal".to_string());
        None
    }
    
    /// Parse a number literal
    fn parse_number(&mut self) -> Option<Rc<RefCell<CodeNode>>> {
        let start_idx = self.current_idx;
        let start_line = self.line;
        let start_column = self.column;
        
        let mut is_float = false;
        let mut number_str = String::new();
        
        // Check if it's a negative number
        let first_char = self.source.content.chars().nth(self.current_idx).unwrap();
        if first_char == '-' {
            number_str.push('-');
            self.advance();
        }
        
        // Parse the digits
        while self.current_idx < self.source.content.len() {
            let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
            
            if current_char.is_digit(10) {
                number_str.push(current_char);
            } else if current_char == '.' && !is_float {
                number_str.push('.');
                is_float = true;
            } else if !current_char.is_whitespace() && current_char != ')' && current_char != '(' {
                // Not a valid number character and not a delimiter - must be a symbol
                return self.parse_symbol_from(start_idx, start_line, start_column);
            } else {
                // End of number
                break;
            }
            
            self.advance();
        }
        
        // Create a new number node
        let mut number_node = CodeNode::new();
        number_node.node_type = RangerNodeType::Literal;
        number_node.value = number_str;
        number_node.set_property("type", if is_float { "float" } else { "integer" });
        number_node.idx = start_idx;
        number_node.line = start_line;
        number_node.column = start_column;
        
        Some(Rc::new(RefCell::new(number_node)))
    }
    
    /// Parse a symbol (identifier or keyword)
    fn parse_symbol(&mut self) -> Option<Rc<RefCell<CodeNode>>> {
        let start_idx = self.current_idx;
        let start_line = self.line;
        let start_column = self.column;
        
        self.parse_symbol_from(start_idx, start_line, start_column)
    }
    
    /// Parse a symbol starting from a specific position
    fn parse_symbol_from(&mut self, start_idx: usize, start_line: usize, start_column: usize) -> Option<Rc<RefCell<CodeNode>>> {
        let mut symbol_name = String::new();
        
        // Parse until a delimiter
        while self.current_idx < self.source.content.len() {
            let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
            
            if current_char.is_whitespace() || current_char == '(' || current_char == ')' {
                break;
            }
            
            symbol_name.push(current_char);
            self.advance();
        }
        
        if symbol_name.is_empty() {
            return None;
        }
        
        // Create a new symbol node
        let mut symbol_node = CodeNode::new();
        
        // Check if it's a special keyword
        if symbol_name == "true" || symbol_name == "false" {
            symbol_node.node_type = RangerNodeType::Literal;
            symbol_node.value = symbol_name.clone();
            symbol_node.set_property("type", "boolean");
        } else if symbol_name == "nil" || symbol_name == "null" {
            symbol_node.node_type = RangerNodeType::Literal;
            symbol_node.value = symbol_name.clone();
            symbol_node.set_property("type", "null");
        } else {
            symbol_node.node_type = RangerNodeType::Variable;
            symbol_node.value = symbol_name.clone();
        }
        
        symbol_node.idx = start_idx;
        symbol_node.line = start_line;
        symbol_node.column = start_column;
        
        Some(Rc::new(RefCell::new(symbol_node)))
    }
    
    /// Parse a comment
    fn parse_comment(&mut self) -> Option<Rc<RefCell<CodeNode>>> {
        // Skip the semicolon
        self.advance();
        
        let start_idx = self.current_idx;
        let start_line = self.line;
        let start_column = self.column;
        
        let mut comment_text = String::new();
        
        // Parse until the end of the line
        while self.current_idx < self.source.content.len() {
            let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
            
            if current_char == '\n' {
                self.advance(); // Skip the newline
                break;
            }
            
            comment_text.push(current_char);
            self.advance();
        }
        
        // Create a new comment node
        let mut comment_node = CodeNode::new();
        comment_node.node_type = RangerNodeType::Comment;
        comment_node.value = comment_text;
        comment_node.idx = start_idx;
        comment_node.line = start_line;
        comment_node.column = start_column;
        
        Some(Rc::new(RefCell::new(comment_node)))
    }
    
    /// Skip whitespace and update line/column tracking
    fn skip_whitespace(&mut self) {
        while self.current_idx < self.source.content.len() {
            let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
            
            if current_char.is_whitespace() {
                if current_char == '\n' {
                    self.line += 1;
                    self.column = 1;
                } else {
                    self.column += 1;
                }
                
                self.current_idx += 1;
            } else {
                break;
            }
        }
    }
    
    /// Advance the current position and update line/column tracking
    fn advance(&mut self) {
        if self.current_idx < self.source.content.len() {
            let current_char = self.source.content.chars().nth(self.current_idx).unwrap();
            
            if current_char == '\n' {
                self.line += 1;
                self.column = 1;
            } else {
                self.column += 1;
            }
            
            self.current_idx += 1;
        }
    }
}

/// Parser for transforming AST into target language
pub struct RangerFlowParser {
    pub class_map: HashMap<String, Rc<RefCell<RangerAppClassDesc>>>,
    pub function_map: HashMap<String, Rc<RefCell<RangerAppFunctionDesc>>>,
}

impl RangerFlowParser {
    pub fn new() -> Self {
        Self {
            class_map: HashMap::new(),
            function_map: HashMap::new(),
        }
    }
    
    /// Process imports and merge them into the context
    pub fn merge_imports(&mut self, root_node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) -> bool {
        // Iterate through the root node's children to find imports
        for child in &root_node.borrow().children {
            if child.borrow().node_type == RangerNodeType::Expression && child.borrow().name == "import" {
                self.process_import(child.clone(), context, writer);
            }
        }
        
        true
    }
    
    /// Process an import statement
    fn process_import(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) {
        if node.borrow().children.len() < 2 {
            return;
        }
        
        // Get the import path (second child of the import expression)
        let import_path = if let Some(path_node) = node.borrow().children.get(1) {
            if path_node.borrow().node_type == RangerNodeType::Literal {
                path_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Add the import to the context
        context.add_import(&import_path);
        
        // Add the import to the writer
        writer.add_import(&import_path);
    }
    
    /// Collect method and class definitions from the AST
    pub fn collect_methods(&mut self, root_node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) -> bool {
        // Iterate through the root node's children
        for child in &root_node.borrow().children {
            if child.borrow().node_type == RangerNodeType::Expression {
                let expr_name = &child.borrow().name;
                
                match expr_name.as_str() {
                    "defn" | "defun" => self.process_function_def(child.clone(), context, writer),
                    "class" => self.process_class_def(child.clone(), context, writer),
                    _ => {}
                }
            }
        }
        
        true
    }
    
    /// Process a function definition
    fn process_function_def(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, _writer: &mut CodeWriter) {
        // A function definition should have at least 3 children:
        // 1. The 'defn' symbol
        // 2. The function name
        // 3. The parameter list
        // 4. The function body (optional)
        
        if node.borrow().children.len() < 3 {
            return;
        }
        
        // Get the function name
        let func_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == RangerNodeType::Variable {
                name_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Create the function description
        let mut func_desc = RangerAppFunctionDesc::new();
        func_desc.name = func_name.clone();
        func_desc.node = Some(node.clone());
        
        // Process the parameter list
        if let Some(params_node) = node.borrow().children.get(2) {
            if params_node.borrow().node_type == RangerNodeType::Expression {
                for param_node in &params_node.borrow().children {
                    let param_name = if param_node.borrow().node_type == RangerNodeType::Variable {
                        param_node.borrow().value.clone()
                    } else {
                        continue;
                    };
                    
                    // Create the parameter description
                    let mut param_desc = RangerAppParamDesc::new();
                    param_desc.name = param_name;
                    param_desc.param_type = "any".to_string(); // Default type
                    param_desc.node = Some(param_node.clone());
                    
                    // Add the parameter to the function
                    func_desc.add_param(Rc::new(RefCell::new(param_desc)));
                }
            }
        }
        
        // Check for return type annotation
        if let Some(return_type) = node.borrow().get_property("return-type") {
            func_desc.return_type = return_type;
        }
        
        // Add the function to the context
        let func_rc = Rc::new(RefCell::new(func_desc));
        context.add_function(func_rc.clone());
        self.function_map.insert(func_name, func_rc);
    }
    
    /// Process a class definition
    fn process_class_def(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, _writer: &mut CodeWriter) {
        // A class definition should have at least 2 children:
        // 1. The 'class' symbol
        // 2. The class name
        // 3+ Class body elements
        
        if node.borrow().children.len() < 2 {
            return;
        }
        
        // Get the class name
        let class_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == RangerNodeType::Variable {
                name_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Create the class description
        let mut class_desc = RangerAppClassDesc::new();
        class_desc.name = class_name.clone();
        class_desc.node = Some(node.clone());
        
        // Process the class body
        for i in 2..node.borrow().children.len() {
            if let Some(body_node) = node.borrow().children.get(i) {
                if body_node.borrow().node_type == RangerNodeType::Expression {
                    let expr_name = &body_node.borrow().name;
                    
                    match expr_name.as_str() {
                        "property" | "prop" => self.process_class_property(body_node.clone(), &mut class_desc),
                        "method" => self.process_class_method(body_node.clone(), &mut class_desc),
                        "extends" => self.process_class_extends(body_node.clone(), &mut class_desc),
                        "implements" => self.process_class_implements(body_node.clone(), &mut class_desc),
                        _ => {}
                    }
                }
            }
        }
        
        // Add the class to the context
        let class_rc = Rc::new(RefCell::new(class_desc));
        context.add_class(class_rc.clone());
        self.class_map.insert(class_name, class_rc);
    }
    
    /// Process a class property definition
    fn process_class_property(&mut self, node: Rc<RefCell<CodeNode>>, class_desc: &mut RangerAppClassDesc) {
        // A property definition should have at least 2 children:
        // 1. The 'property' symbol
        // 2. The property name
        // 3. The property type (optional)
        // 4. The default value (optional)
        
        if node.borrow().children.len() < 2 {
            return;
        }
        
        // Get the property name
        let prop_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == RangerNodeType::Variable {
                name_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Create the property description
        let mut prop_desc = RangerAppParamDesc::new();
        prop_desc.name = prop_name;
        prop_desc.is_class_property = true;
        prop_desc.node = Some(node.clone());
        
        // Check for property type
        if node.borrow().children.len() > 2 {
            if let Some(type_node) = node.borrow().children.get(2) {
                if type_node.borrow().node_type == RangerNodeType::Variable {
                    prop_desc.param_type = type_node.borrow().value.clone();
                }
            }
        }
        
        // Check for default value
        if node.borrow().children.len() > 3 {
            if let Some(value_node) = node.borrow().children.get(3) {
                if value_node.borrow().node_type == RangerNodeType::Literal {
                    prop_desc.default_value = Some(value_node.borrow().value.clone());
                }
            }
        }
        
        // Check for static modifier
        if let Some(static_val) = node.borrow().get_property("static") {
            prop_desc.is_static = static_val == "true";
        }
        
        // Check for access level
        if let Some(access) = node.borrow().get_property("access") {
            prop_desc.access_level = access;
        }
        
        // Add the property to the class
        class_desc.add_property(Rc::new(RefCell::new(prop_desc)));
    }
    
    /// Process a class method definition
    fn process_class_method(&mut self, node: Rc<RefCell<CodeNode>>, class_desc: &mut RangerAppClassDesc) {
        // A method definition should have at least 3 children:
        // 1. The 'method' symbol
        // 2. The method name
        // 3. The parameter list
        // 4. The method body (optional)
        
        if node.borrow().children.len() < 3 {
            return;
        }
        
        // Get the method name
        let method_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == RangerNodeType::Variable {
                name_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Create the method description
        let mut method_desc = RangerAppFunctionDesc::new();
        method_desc.name = method_name;
        method_desc.node = Some(node.clone());
        
        // Check if it's a constructor
        if method_desc.name == "constructor" || method_desc.name == "initialize" || method_desc.name == "init" {
            method_desc.is_constructor = true;
        }
        
        // Process the parameter list
        if let Some(params_node) = node.borrow().children.get(2) {
            if params_node.borrow().node_type == RangerNodeType::Expression {
                for param_node in &params_node.borrow().children {
                    let param_name = if param_node.borrow().node_type == RangerNodeType::Variable {
                        param_node.borrow().value.clone()
                    } else {
                        continue;
                    };
                    
                    // Create the parameter description
                    let mut param_desc = RangerAppParamDesc::new();
                    param_desc.name = param_name;
                    param_desc.param_type = "any".to_string(); // Default type
                    param_desc.node = Some(param_node.clone());
                    
                    // Add the parameter to the method
                    method_desc.add_param(Rc::new(RefCell::new(param_desc)));
                }
            }
        }
        
        // Check for return type annotation
        if let Some(return_type) = node.borrow().get_property("return-type") {
            method_desc.return_type = return_type;
        }
        
        // Check for static modifier
        if let Some(static_val) = node.borrow().get_property("static") {
            method_desc.is_static = static_val == "true";
        }
        
        // Check for async modifier
        if let Some(async_val) = node.borrow().get_property("async") {
            method_desc.is_async = async_val == "true";
        }
        
        // Check for access level
        if let Some(access) = node.borrow().get_property("access") {
            method_desc.access_level = access;
        }
        
        // Add the method to the class
        class_desc.add_method(Rc::new(RefCell::new(method_desc)));
    }
    
    /// Process a class extends definition
    fn process_class_extends(&mut self, node: Rc<RefCell<CodeNode>>, class_desc: &mut RangerAppClassDesc) {
        // An extends definition should have at least 2 children:
        // 1. The 'extends' symbol
        // 2. The parent class name
        
        if node.borrow().children.len() < 2 {
            return;
        }
        
        // Get the parent class name
        if let Some(parent_node) = node.borrow().children.get(1) {
            if parent_node.borrow().node_type == RangerNodeType::Variable {
                class_desc.parent_class = Some(parent_node.borrow().value.clone());
            }
        }
    }
    
    /// Process a class implements definition
    fn process_class_implements(&mut self, node: Rc<RefCell<CodeNode>>, class_desc: &mut RangerAppClassDesc) {
        // An implements definition should have at least 2 children:
        // 1. The 'implements' symbol
        // 2+ Interface names
        
        if node.borrow().children.len() < 2 {
            return;
        }
        
        // Process all interface names
        for i in 1..node.borrow().children.len() {
            if let Some(interface_node) = node.borrow().children.get(i) {
                if interface_node.borrow().node_type == RangerNodeType::Variable {
                    class_desc.add_interface(&interface_node.borrow().value);
                }
            }
        }
    }
    
    /// Process async functions in the AST
    pub fn solve_async_funcs(&mut self, root_node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, _writer: &mut CodeWriter) -> bool {
        // Iterate through the root node's children
        for child in &root_node.borrow().children {
            if child.borrow().node_type == RangerNodeType::Expression {
                let expr_name = &child.borrow().name;
                
                if expr_name == "async" || expr_name == "defasync" {
                    self.process_async_function(child.clone(), context);
                }
            }
        }
        
        true
    }
    
    /// Process an async function definition
    fn process_async_function(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext) {
        // An async function definition should have at least 3 children:
        // 1. The 'async' symbol
        // 2. The function name
        // 3. The parameter list
        // 4. The function body (optional)
        
        if node.borrow().children.len() < 3 {
            return;
        }
        
        // Get the function name
        let func_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == RangerNodeType::Variable {
                name_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Check if the function is already defined
        if let Some(func) = context.get_function(&func_name) {
            // Mark the function as async
            func.borrow_mut().is_async = true;
        } else {
            // Create the function description
            let mut func_desc = RangerAppFunctionDesc::new();
            func_desc.name = func_name.clone();
            func_desc.is_async = true;
            func_desc.node = Some(node.clone());
            
            // Process the parameter list
            if let Some(params_node) = node.borrow().children.get(2) {
                if params_node.borrow().node_type == RangerNodeType::Expression {
                    for param_node in &params_node.borrow().children {
                        let param_name = if param_node.borrow().node_type == RangerNodeType::Variable {
                            param_node.borrow().value.clone()
                        } else {
                            continue;
                        };
                        
                        // Create the parameter description
                        let mut param_desc = RangerAppParamDesc::new();
                        param_desc.name = param_name;
                        param_desc.param_type = "any".to_string(); // Default type
                        param_desc.node = Some(param_node.clone());
                        
                        // Add the parameter to the function
                        func_desc.add_param(Rc::new(RefCell::new(param_desc)));
                    }
                }
            }
            
            // Add the function to the context
            let func_rc = Rc::new(RefCell::new(func_desc));
            context.add_function(func_rc.clone());
            self.function_map.insert(func_name, func_rc);
        }
    }
    
    /// Start walking the AST to generate code
    pub fn start_walk(&mut self, root_node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) -> bool {
        // Generate code for each top-level node
        for child in &root_node.borrow().children {
            self.walk_node(child.clone(), context, writer);
        }
        
        true
    }
    
    /// Walk a node and generate code
    fn walk_node(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) {
        match node.borrow().node_type {
            RangerNodeType::Expression => self.walk_expression(node, context, writer),
            RangerNodeType::Comment => {
                writer.add_comment(&node.borrow().value);
            },
            _ => {}
        }
    }
    
    /// Walk an expression node and generate code
    fn walk_expression(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) {
        let expr_name = &node.borrow().name;
        
        match expr_name.as_str() {
            "defn" | "defun" => self.generate_function(node, context, writer),
            "class" => self.generate_class(node, context, writer),
            "import" => self.generate_import(node, context, writer),
            "async" | "defasync" => self.generate_async_function(node, context, writer),
            "if" => self.generate_if(node, context, writer),
            "cond" => self.generate_cond(node, context, writer),
            "loop" => self.generate_loop(node, context, writer),
            "while" => self.generate_while(node, context, writer),
            "for" | "foreach" => self.generate_for(node, context, writer),
            "set" | "setq" | "=" => self.generate_assignment(node, context, writer),
            "def" => self.generate_variable_def(node, context, writer),
            "+" | "-" | "*" | "/" | "%" => self.generate_arithmetic(node, context, writer),
            "==" | "!=" | ">" | "<" | ">=" | "<=" => self.generate_comparison(node, context, writer),
            "and" | "&&" | "or" | "||" | "not" | "!" => self.generate_logical(node, context, writer),
            "return" => self.generate_return(node, context, writer),
            "new" => self.generate_new_instance(node, context, writer),
            "." => self.generate_member_access(node, context, writer),
            "fn" | "lambda" => self.generate_lambda(node, context, writer),
            _ => self.generate_function_call(node, context, writer),
        }
    }
    
    // Implementation of code generation methods will follow here...
    // For brevity, I'll include just a few examples
    
    /// Generate code for a function definition
    fn generate_function(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) {
        // Get the function name
        let func_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == RangerNodeType::Variable {
                name_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Get the function from the context
        if let Some(func) = context.get_function(&func_name) {
            // Generate function signature based on the target language
            writer.begin_function(&func.borrow().name, &func.borrow().return_type, func.borrow().is_async);
            
            // Generate parameters
            for param in &func.borrow().params {
                writer.add_param(&param.borrow().name, &param.borrow().param_type);
            }
            
            writer.begin_function_body();
            
            // Generate function body
            if let Some(body_nodes) = node.borrow().children.get(3..) {
                for body_node in body_nodes {
                    self.walk_node(body_node.clone(), context, writer);
                }
            }
            
            writer.end_function();
        }
    }
    
    /// Generate code for a class definition
    fn generate_class(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) {
        // Get the class name
        let class_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == RangerNodeType::Variable {
                name_node.borrow().value.clone()
            } else {
                return;
            }
        } else {
            return;
        }
        
        // Get the class from the context
        if let Some(class) = context.get_class(&class_name) {
            // Generate class definition based on the target language
            writer.begin_class(&class.borrow().name);
            
            // Generate parent class if any
            if let Some(parent) = &class.borrow().parent_class {
                writer.add_extends(parent);
            }
            
            // Generate interfaces if any
            for interface in &class.borrow().interfaces {
                writer.add_implements(interface);
            }
            
            writer.begin_class_body();
            
            // Generate properties
            for property in &class.borrow().properties {
                writer.add_property(
                    &property.borrow().name,
                    &property.borrow().param_type,
                    property.borrow().default_value.as_deref(),
                    property.borrow().is_static,
                    &property.borrow().access_level
                );
            }
            
            // Generate methods
            for method in &class.borrow().methods {
                writer.begin_method(
                    &method.borrow().name,
                    &method.borrow().return_type,
                    method.borrow().is_constructor,
                    method.borrow().is_static,
                    method.borrow().is_async,
                    &method.borrow().access_level
                );
                
                // Generate parameters
                for param in &method.borrow().params {
                    writer.add_param(&param.borrow().name, &param.borrow().param_type);
                }
                
                writer.begin_method_body();
                
                // Generate method body if available
                if let Some(body_node) = &method.borrow().node {
                    if let Some(body_nodes) = body_node.borrow().children.get(3..) {
                        for body_node in body_nodes {
                            self.walk_node(body_node.clone(), context, writer);
                        }
                    }
                }
                
                writer.end_method();
            }
            
            writer.end_class();
        }
    }
    
    /// Generate code for an if statement
    fn generate_if(&mut self, node: Rc<RefCell<CodeNode>>, context: &mut RangerAppWriterContext, writer: &mut CodeWriter) {
        // An if statement should have at least 3 children:
        // 1. The 'if' symbol
        // 2. The condition
        // 3. The then branch
        // 4. The else branch (optional)
        
        if node.borrow().children.len() < 3 {
            return;
        }
        
        // Generate the condition
        if let Some(cond_node) = node.borrow().children.get(1) {
            writer.begin_if();
            self.walk_node(cond_node.clone(), context, writer);
            writer.end_if_condition();
            
            // Generate the then branch
            if let Some(then_node) = node.borrow().children.get(2) {
                writer.begin_then();
                self.walk_node(then_node.clone(), context, writer);
                writer.end_then();
            }
            
            // Generate the else branch if it exists
            if let Some(else_node) = node.borrow().children.get(3) {
                writer.begin_else();
                self.walk_node(else_node.clone(), context, writer);
                writer.end_else();
            }
            
            writer.end_if();
        }
    }
}

/// Live compiler for interactive code execution
pub struct LiveCompiler {
    pub parser: Option<Rc<RefCell<RangerFlowParser>>>,
    pub writer: Option<Rc<RefCell<CodeWriter>>>,
}

impl LiveCompiler {
    pub fn new() -> Self {
        Self {
            parser: None,
            writer: None,
        }
    }
    
    /// Initialize the writer component
    pub fn init_writer(&mut self, context: &RangerAppWriterContext) {
        let mut writer = CodeWriter::new();
        writer.target_lang = context.target_lang_name.clone();
        self.writer = Some(Rc::new(RefCell::new(writer)));
    }
    
    /// Compile a code snippet
    pub fn compile_snippet(&mut self, code: &str, context: &mut RangerAppWriterContext) -> Result<String, String> {
        // Create source code
        let source = SourceCode::new(code.to_string());
        
        // Parse the code
        let mut parser = RangerLispParser::new(source);
        if !parser.parse(true) {
            return Err(format!("Parsing error: {:?}", parser.error));
        }
        
        // Process the AST
        if let Some(root_node) = parser.root_node {
            if let Some(flow_parser) = &self.parser {
                let mut writer = CodeWriter::new();
                writer.target_lang = context.target_lang_name.clone();
                
                // Generate code
                flow_parser.borrow_mut().start_walk(root_node.clone(), context, &mut writer);
                
                // Check for compiler errors
                if !context.compiler_errors.is_empty() {
                    let errors = context.compiler_errors
                        .iter()
                        .map(|e| e.description.clone())
                        .collect::<Vec<String>>()
                        .join("\n");
                    return Err(format!("Compilation errors:\n{}", errors));
                }
                
                // Return the generated code
                Ok(writer.get_output())
            } else {
                Err("Flow parser not initialized".to_string())
            }
        } else {
            Err("No AST generated".to_string())
        }
    }
    
    /// Execute a code snippet (if supported by the target language)
    pub fn execute_snippet(&mut self, code: &str, context: &mut RangerAppWriterContext) -> Result<String, String> {
        // First compile the code
        let compiled_code = self.compile_snippet(code, context)?;
        
        // Execution depends on the target language
        match context.target_lang_name.as_str() {
            "es6" => {
                // For JavaScript, we could use a JS runtime
                Err("JavaScript execution not implemented".to_string())
            },
            _ => {
                Err(format!("Execution not supported for {}", context.target_lang_name))
            }
        }
    }
}

pub mod clj_parser;
pub mod parser;
pub mod system_class_parser;