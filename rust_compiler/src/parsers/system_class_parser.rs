use std::rc::Rc;
use std::cell::RefCell;
use std::collections::HashMap;

use crate::models::{CodeNode, SourceCode, SystemClass, SystemClassMapping, OperatorDefinition, OperatorParameter, RangerAppWriterContext, CompilerError, TemplateExpression, TemplateExpressionPart};
use crate::parsers::RangerLispParser;

/// Parser for SystemClass and Operator definitions in Ranger Clojure files
pub struct SystemClassParser {
    pub source: SourceCode,
    pub root_node: Option<Rc<RefCell<CodeNode>>>,
    pub system_classes: Vec<Rc<RefCell<SystemClass>>>,
    pub operators: Vec<Rc<RefCell<OperatorDefinition>>>,
    pub errors: Vec<CompilerError>,
}

impl SystemClassParser {
    pub fn new(source: SourceCode) -> Self {
        Self {
            source,
            root_node: None,
            system_classes: Vec::new(),
            operators: Vec::new(),
            errors: Vec::new(),
        }
    }
    
    /// Parse the source code and extract system classes and operators
    pub fn parse(&mut self) -> bool {
        // First use the RangerLispParser to parse the file into AST
        let mut parser = RangerLispParser::new(self.source.clone());
        if !parser.parse(true) {
            if let Some(error) = &parser.error {
                self.errors.push(CompilerError::new(
                    error,
                    parser.line,
                    parser.column,
                    &self.source.content,
                    &self.source.filename,
                ));
            }
            return false;
        }
        
        self.root_node = parser.root_node.clone();
        
        // Process the AST to find system classes and operators
        if let Some(root) = &self.root_node {
            for child in &root.borrow().children {
                if child.borrow().node_type == "expression" {
                    match child.borrow().name.as_str() {
                        "systemclass" => {
                            if let Some(system_class) = self.process_system_class(child.clone()) {
                                self.system_classes.push(system_class);
                            }
                        },
                        "operators" => {
                            self.process_operators(child.clone());
                        },
                        _ => {}
                    }
                }
            }
            return true;
        }
        
        false
    }
    
    /// Process a systemclass definition
    fn process_system_class(&mut self, node: Rc<RefCell<CodeNode>>) -> Option<Rc<RefCell<SystemClass>>> {
        // A systemclass definition should have at least 2 children:
        // 1. The 'systemclass' symbol
        // 2. The class name
        // 3+ Language mappings
        
        if node.borrow().children.len() < 2 {
            return None;
        }
        
        // Get the class name
        let class_name = if let Some(name_node) = node.borrow().children.get(1) {
            if name_node.borrow().node_type == "variable" {
                name_node.borrow().value.clone()
            } else {
                return None;
            }
        } else {
            return None;
        };
        
        // Create the system class
        let mut system_class = SystemClass::new(&class_name);
        
        // Process language mappings
        for i in 2..node.borrow().children.len() {
            if let Some(mapping_node) = node.borrow().children.get(i) {
                // A language mapping is an expression with at least 2 children:
                // 1. The language name
                // 2. The native class name
                // 3. Import statement (optional, enclosed in parentheses)
                
                if mapping_node.borrow().node_type == "expression" && mapping_node.borrow().children.len() >= 2 {
                    // Get the language name
                    let language = if let Some(lang_node) = mapping_node.borrow().children.get(0) {
                        if lang_node.borrow().node_type == "variable" {
                            lang_node.borrow().value.clone()
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    };
                    
                    // Get the native class name
                    let native_class = if let Some(class_node) = mapping_node.borrow().children.get(1) {
                        if class_node.borrow().node_type == "variable" || class_node.borrow().node_type == "literal" {
                            class_node.borrow().value.clone()
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    };
                    
                    // Check for import statement
                    let mut mapping = SystemClassMapping::new(&native_class);
                    
                    if mapping_node.borrow().children.len() >= 3 {
                        if let Some(import_node) = mapping_node.borrow().children.get(2) {
                            if import_node.borrow().node_type == "expression" {
                                // Extract import statement from the expression
                                let import_stmt = self.extract_import_statement(import_node.clone());
                                if !import_stmt.is_empty() {
                                    mapping.import_statement = Some(import_stmt);
                                }
                            }
                        }
                    }
                    
                    // Add the mapping to the system class
                    system_class.add_mapping(&language, mapping);
                }
            }
        }
        
        Some(Rc::new(RefCell::new(system_class)))
    }
    
    /// Extract an import statement from a node
    fn extract_import_statement(&self, node: Rc<RefCell<CodeNode>>) -> String {
        // An import statement is typically in the form (imp 'package.name')
        
        if node.borrow().children.len() >= 2 && node.borrow().name == "imp" {
            if let Some(package_node) = node.borrow().children.get(1) {
                if package_node.borrow().node_type == "literal" {
                    return package_node.borrow().value.clone();
                }
            }
        }
        
        // Also check for direct string literals in case of different import syntax
        if node.borrow().children.len() >= 1 {
            if let Some(first_child) = node.borrow().children.get(0) {
                if first_child.borrow().node_type == "literal" && 
                   first_child.borrow().get_property("type").unwrap_or_default() == "string" {
                    return first_child.borrow().value.clone();
                }
            }
        }
        
        String::new()
    }
    
    /// Process operators block
    fn process_operators(&mut self, node: Rc<RefCell<CodeNode>>) {
        // The operators block contains multiple operator definitions
        // Each operator is its own expression
        
        for i in 1..node.borrow().children.len() {
            if let Some(op_node) = node.borrow().children.get(i) {
                if op_node.borrow().node_type == "expression" {
                    if let Some(operator) = self.process_operator(op_node.clone()) {
                        self.operators.push(operator);
                    }
                }
            }
        }
    }
    
    /// Process an operator definition
    fn process_operator(&mut self, node: Rc<RefCell<CodeNode>>) -> Option<Rc<RefCell<OperatorDefinition>>> {
        // An operator definition has the following structure:
        // (operator_name return_type (param1:type param2:type ...) { ... })
        
        if node.borrow().children.len() < 3 {
            return None;
        }
        
        // Get the operator name
        let op_name = if let Some(name_node) = node.borrow().children.get(0) {
            if name_node.borrow().node_type == "variable" {
                name_node.borrow().value.clone()
            } else {
                return None;
            }
        } else {
            return None;
        };
        
        // Get the return type
        let return_type = if let Some(type_node) = node.borrow().children.get(1) {
            if type_node.borrow().node_type == "variable" {
                // Check if it starts with '_' which indicates the return type
                let value = type_node.borrow().value.clone();
                if value.starts_with('_') {
                    // Extract actual type after '_:'
                    if value.starts_with("_:") {
                        value[2..].to_string()
                    } else {
                        "void".to_string()
                    }
                } else {
                    value
                }
            } else {
                "void".to_string()
            }
        } else {
            "void".to_string()
        };
        
        // Create the operator
        let mut operator = OperatorDefinition::with_return_type(&op_name, &return_type);
        
        // Check for attributes in the return type (like @throws)
        if return_type.contains('@') {
            let parts: Vec<&str> = return_type.split('@').collect();
            if parts.len() > 1 {
                let base_type = parts[0].trim();
                let attributes = parts[1].trim();
                
                // Update return type to just the base type
                operator.return_type = base_type.to_string();
                
                // Extract attributes
                let attr_parts: Vec<&str> = attributes
                    .trim_start_matches('(')
                    .trim_end_matches(')')
                    .split(',')
                    .collect();
                
                for attr in attr_parts {
                    operator.add_attribute(attr.trim());
                }
            }
        }
        
        // Process parameters
        if let Some(params_node) = node.borrow().children.get(2) {
            if params_node.borrow().node_type == "expression" {
                for param_node in &params_node.borrow().children {
                    // Each parameter is in the form "name:type"
                    if param_node.borrow().node_type == "variable" {
                        let param_str = param_node.borrow().value.clone();
                        if let Some(colon_idx) = param_str.find(':') {
                            let param_name = param_str[0..colon_idx].to_string();
                            let param_type = param_str[colon_idx+1..].to_string();
                            
                            operator.add_parameter(OperatorParameter::new(&param_name, &param_type));
                        } else {
                            // Parameter without type
                            operator.add_parameter(OperatorParameter::new(&param_str, "any"));
                        }
                    }
                }
            }
        }
        
        // Process templates
        if let Some(templates_node) = node.borrow().children.get(3) {
            if templates_node.borrow().node_type == "expression" && templates_node.borrow().name == "templates" {
                for template_node in &templates_node.borrow().children {
                    if template_node.borrow().node_type == "expression" && template_node.borrow().children.len() >= 2 {
                        // Get the language
                        let language = if let Some(lang_node) = template_node.borrow().children.get(0) {
                            if lang_node.borrow().node_type == "variable" {
                                lang_node.borrow().value.clone()
                            } else {
                                continue;
                            }
                        } else {
                            continue;
                        };
                        
                        // Extract template
                        let template = self.extract_template(template_node.clone());
                        if !template.is_empty() {
                            operator.add_template(&language, &template);
                        }
                    }
                }
            }
        }
        
        Some(Rc::new(RefCell::new(operator)))
    }
    
    /// Extract a template from a node
    fn extract_template(&self, node: Rc<RefCell<CodeNode>>) -> String {
        // Templates can be complex expressions, we need to reconstruct the code
        
        if node.borrow().children.len() < 2 {
            return String::new();
        }
        
        // Skip the language node (first child)
        // The template is in the second child, which might be a literal or an expression
        
        if let Some(template_node) = node.borrow().children.get(1) {
            match template_node.borrow().node_type.as_str() {
                "literal" => {
                    // Simple string template
                    template_node.borrow().value.clone()
                },
                "expression" => {
                    // Complex template with expressions
                    // Reconstruct the template from the expression
                    self.reconstruct_template(template_node.clone())
                },
                _ => String::new()
            }
        } else {
            String::new()
        }
    }
    
    /// Reconstruct a complex template from an expression
    fn reconstruct_template(&self, node: Rc<RefCell<CodeNode>>) -> String {
        // For complex templates, we need to convert the AST back to code
        // This is a simplified version that handles the most common cases
        
        let mut result = String::new();
        
        // Check if this is an e (expression reference) node
        if node.borrow().name == "e" && node.borrow().children.len() >= 2 {
            // This is a reference to a parameter by index
            if let Some(index_node) = node.borrow().children.get(1) {
                if index_node.borrow().node_type == "literal" {
                    return format!("(e {})", index_node.borrow().value);
                }
            }
            return "(e)".to_string();
        }
        
        // Handle other expression types
        for i in 0..node.borrow().children.len() {
            let child = node.borrow().children[i].clone();
            
            match child.borrow().node_type.as_str() {
                "expression" => {
                    // Recursively process nested expressions
                    let nested = self.reconstruct_template(child);
                    if !nested.is_empty() {
                        if !result.is_empty() && !result.ends_with('(') {
                            result.push(' ');
                        }
                        result.push_str(&nested);
                    }
                },
                "literal" => {
                    // Add literals directly
                    if !result.is_empty() && !result.ends_with('(') {
                        result.push(' ');
                    }
                    // Check if it's a string that needs quotes
                    let value = child.borrow().value.clone();
                    if child.borrow().get_property("type").unwrap_or_default() == "string" {
                        result.push_str(&format!("'{}'", value));
                    } else {
                        result.push_str(&value);
                    }
                },
                "variable" => {
                    // Add variables directly
                    if !result.is_empty() && !result.ends_with('(') {
                        result.push(' ');
                    }
                    result.push_str(&child.borrow().value);
                },
                _ => {}
            }
        }
        
        result
    }
    
    /// Add the parsed system classes and operators to a writer context
    pub fn add_to_context(&self, context: &mut RangerAppWriterContext) {
        // Add system classes
        for system_class in &self.system_classes {
            context.add_system_class(system_class.clone());
        }
        
        // Add operators
        for operator in &self.operators {
            context.add_operator(operator.clone());
        }
        
        // Add errors
        for error in &self.errors {
            context.add_error(error.clone());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_system_class() {
        let sample = "systemclass RandomGenerator {
            java7 SecureRandom  ( (imp 'java.security.SecureRandom'))
            es6 RandomSource
        }";
        
        let source = SourceCode::new(sample.to_string());
        let mut parser = SystemClassParser::new(source);
        assert!(parser.parse());
        
        assert_eq!(parser.system_classes.len(), 1);
        let system_class = parser.system_classes[0].borrow();
        assert_eq!(system_class.name, "RandomGenerator");
        
        // Check Java mapping
        let java_mapping = system_class.get_mapping("java7").unwrap();
        assert_eq!(java_mapping.native_class_name, "SecureRandom");
        assert_eq!(java_mapping.import_statement, Some("java.security.SecureRandom".to_string()));
        
        // Check ES6 mapping
        let es6_mapping = system_class.get_mapping("es6").unwrap();
        assert_eq!(es6_mapping.native_class_name, "RandomSource");
        assert_eq!(es6_mapping.import_statement, None);
    }
    
    #[test]
    fn test_parse_operators() {
        let sample = "operators {
            newRandomGenerator _:RandomGenerator () {
                templates {
                    java7 ('SecureRandom.getInstance(\"SHA1PRNG\")')
                    es6 ( 'window.crypto' )
                }      
            }
        }";
        
        let source = SourceCode::new(sample.to_string());
        let mut parser = SystemClassParser::new(source);
        assert!(parser.parse());
        
        assert_eq!(parser.operators.len(), 1);
        let operator = parser.operators[0].borrow();
        assert_eq!(operator.name, "newRandomGenerator");
        assert_eq!(operator.return_type, "RandomGenerator");
        assert_eq!(operator.parameters.len(), 0);
        
        // Check templates
        assert!(operator.templates.contains_key("java7"));
        assert!(operator.templates.contains_key("es6"));
        assert_eq!(operator.templates.get("java7").unwrap(), "SecureRandom.getInstance(\"SHA1PRNG\")");
        assert_eq!(operator.templates.get("es6").unwrap(), "window.crypto");
    }
    
    #[test]
    fn test_parse_operator_with_parameters() {
        let sample = "operators {
            init _:void ( kg:KeyGenerator keylen:int rand:RandomGenerator) {
                templates {
                    java7 ( (e 1 ) '.init(' (e 2) ', ' (e 3)');' )
                }
            }
        }";
        
        let source = SourceCode::new(sample.to_string());
        let mut parser = SystemClassParser::new(source);
        assert!(parser.parse());
        
        assert_eq!(parser.operators.len(), 1);
        let operator = parser.operators[0].borrow();
        assert_eq!(operator.name, "init");
        assert_eq!(operator.return_type, "void");
        
        // Check parameters
        assert_eq!(operator.parameters.len(), 3);
        assert_eq!(operator.parameters[0].name, "kg");
        assert_eq!(operator.parameters[0].param_type, "KeyGenerator");
        assert_eq!(operator.parameters[1].name, "keylen");
        assert_eq!(operator.parameters[1].param_type, "int");
        assert_eq!(operator.parameters[2].name, "rand");
        assert_eq!(operator.parameters[2].param_type, "RandomGenerator");
        
        // Check template
        assert!(operator.templates.contains_key("java7"));
        let template = operator.templates.get("java7").unwrap();
        assert!(template.contains("(e 1)"));
        assert!(template.contains("(e 2)"));
        assert!(template.contains("(e 3)"));
    }
    
    #[test]
    fn test_parse_operator_with_throws() {
        let sample = "operators {
            encode _@(throws):Bytes ( c:Cipher data:Bytes ) {
                templates {
                    java7 ( (e 1) '.doFinal(' (e 2) ')')
                }
            }
        }";
        
        let source = SourceCode::new(sample.to_string());
        let mut parser = SystemClassParser::new(source);
        assert!(parser.parse());
        
        assert_eq!(parser.operators.len(), 1);
        let operator = parser.operators[0].borrow();
        assert_eq!(operator.name, "encode");
        assert_eq!(operator.return_type, "Bytes");
        
        // Check attributes
        assert!(operator.has_attribute("throws"));
        
        // Check parameters
        assert_eq!(operator.parameters.len(), 2);
        assert_eq!(operator.parameters[0].name, "c");
        assert_eq!(operator.parameters[0].param_type, "Cipher");
        assert_eq!(operator.parameters[1].name, "data");
        assert_eq!(operator.parameters[1].param_type, "Bytes");
    }
}