use std::collections::HashMap;
use std::rc::Rc;
use std::cell::RefCell;

/// Represents a mapping of a system class to a native class in a specific language
#[derive(Clone, Debug)]
pub struct SystemClassMapping {
    pub native_class_name: String,
    pub import_statement: Option<String>,
}

impl SystemClassMapping {
    pub fn new(native_class_name: &str) -> Self {
        Self {
            native_class_name: native_class_name.to_string(),
            import_statement: None,
        }
    }
    
    pub fn with_import(native_class_name: &str, import_statement: &str) -> Self {
        Self {
            native_class_name: native_class_name.to_string(),
            import_statement: Some(import_statement.to_string()),
        }
    }
}

/// Represents a system class in Ranger, which is a binding to native classes
/// across different language targets
#[derive(Clone, Debug)]
pub struct SystemClass {
    pub name: String,
    pub mappings: HashMap<String, SystemClassMapping>,
}

impl SystemClass {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            mappings: HashMap::new(),
        }
    }
    
    pub fn add_mapping(&mut self, language: &str, mapping: SystemClassMapping) {
        self.mappings.insert(language.to_string(), mapping);
    }
    
    pub fn get_mapping(&self, language: &str) -> Option<&SystemClassMapping> {
        self.mappings.get(language)
    }
    
    /// Check if the system class has a mapping for the specified language
    pub fn has_mapping_for(&self, language: &str) -> bool {
        self.mappings.contains_key(language)
    }
    
    /// Get the native class name for a specific language
    pub fn get_native_class_name(&self, language: &str) -> Option<String> {
        if let Some(mapping) = self.mappings.get(language) {
            Some(mapping.native_class_name.clone())
        } else {
            None
        }
    }
    
    /// Get the import statement for a specific language
    pub fn get_import_statement(&self, language: &str) -> Option<String> {
        if let Some(mapping) = self.mappings.get(language) {
            mapping.import_statement.clone()
        } else {
            None
        }
    }
}

/// A parameter for an operator
#[derive(Clone, Debug)]
pub struct OperatorParameter {
    pub name: String,
    pub param_type: String,
}

impl OperatorParameter {
    pub fn new(name: &str, param_type: &str) -> Self {
        Self {
            name: name.to_string(),
            param_type: param_type.to_string(),
        }
    }
}

/// Represents a template expression part
#[derive(Clone, Debug)]
pub enum TemplateExpressionPart {
    Text(String),
    Parameter(usize),  // Parameter index (1-based)
    Expression(Vec<TemplateExpressionPart>),
}

/// Represents a template expression
#[derive(Clone, Debug)]
pub struct TemplateExpression {
    pub parts: Vec<TemplateExpressionPart>,
}

impl TemplateExpression {
    pub fn new() -> Self {
        Self {
            parts: Vec::new(),
        }
    }
    
    pub fn add_text(&mut self, text: &str) {
        self.parts.push(TemplateExpressionPart::Text(text.to_string()));
    }
    
    pub fn add_parameter(&mut self, index: usize) {
        self.parts.push(TemplateExpressionPart::Parameter(index));
    }
    
    pub fn add_expression(&mut self, expr: Vec<TemplateExpressionPart>) {
        self.parts.push(TemplateExpressionPart::Expression(expr));
    }
}

/// Represents an operator definition
#[derive(Clone, Debug)]
pub struct OperatorDefinition {
    pub name: String,
    pub return_type: String,
    pub parameters: Vec<OperatorParameter>,
    pub templates: HashMap<String, String>,
    pub attributes: Vec<String>,
}

impl OperatorDefinition {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            return_type: "void".to_string(),
            parameters: Vec::new(),
            templates: HashMap::new(),
            attributes: Vec::new(),
        }
    }
    
    pub fn with_return_type(name: &str, return_type: &str) -> Self {
        Self {
            name: name.to_string(),
            return_type: return_type.to_string(),
            parameters: Vec::new(),
            templates: HashMap::new(),
            attributes: Vec::new(),
        }
    }
    
    pub fn add_parameter(&mut self, param: OperatorParameter) {
        self.parameters.push(param);
    }
    
    pub fn add_template(&mut self, language: &str, template: &str) {
        self.templates.insert(language.to_string(), template.to_string());
    }
    
    pub fn add_attribute(&mut self, attribute: &str) {
        self.attributes.push(attribute.to_string());
    }
    
    pub fn has_attribute(&self, attribute: &str) -> bool {
        self.attributes.contains(&attribute.to_string())
    }
    
    /// Get the template for a specific language
    pub fn get_template(&self, language: &str) -> Option<&String> {
        self.templates.get(language)
    }
    
    /// Check if there is a template for the specified language
    pub fn has_template_for(&self, language: &str) -> bool {
        self.templates.contains_key(language)
    }
    
    /// Get parameter by index (0-based)
    pub fn get_parameter(&self, index: usize) -> Option<&OperatorParameter> {
        self.parameters.get(index)
    }
}