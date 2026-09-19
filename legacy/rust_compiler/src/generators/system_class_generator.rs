use std::rc::Rc;
use std::cell::RefCell;
use std::collections::HashMap;

use crate::models::{SystemClass, OperatorDefinition, RangerAppWriterContext, LanguageWriter};
use crate::parsers::SystemClassParser;

/// Generator for system classes and operators to target languages
pub struct SystemClassGenerator {
    pub context: RangerAppWriterContext,
    pub target_language: String,
    pub imports: Vec<String>,
    pub class_definitions: HashMap<String, String>,
}

impl SystemClassGenerator {
    pub fn new(context: RangerAppWriterContext, target_language: &str) -> Self {
        Self {
            context,
            target_language: target_language.to_string(),
            imports: Vec::new(),
            class_definitions: HashMap::new(),
        }
    }
    
    /// Generate target language code for all system classes and operators in context
    pub fn generate(&mut self) -> String {
        self.collect_imports();
        self.generate_class_definitions();
        
        // Combine everything into the final output
        let mut result = String::new();
        
        // Add imports
        for import in &self.imports {
            match self.target_language.as_str() {
                "java7" => {
                    result.push_str(&format!("import {};\n", import));
                },
                "es6" => {
                    // ES6 doesn't typically have imports like Java
                    // We might add this later if needed
                },
                "rust" => {
                    result.push_str(&format!("use {};\n", import));
                },
                _ => {}
            }
        }
        
        if !self.imports.is_empty() {
            result.push('\n');
        }
        
        // Add class definitions
        for (_, class_def) in &self.class_definitions {
            result.push_str(class_def);
            result.push_str("\n\n");
        }
        
        result
    }
    
    /// Collect all imports from system classes for the target language
    fn collect_imports(&mut self) {
        self.imports.clear();
        
        for system_class in &self.context.system_classes {
            let system_class = system_class.borrow();
            if let Some(mapping) = system_class.get_mapping(&self.target_language) {
                if let Some(import_stmt) = &mapping.import_statement {
                    if !self.imports.contains(import_stmt) {
                        self.imports.push(import_stmt.clone());
                    }
                }
            }
        }
    }
    
    /// Generate class definitions for all system classes
    fn generate_class_definitions(&mut self) {
        self.class_definitions.clear();
        
        match self.target_language.as_str() {
            "java7" => self.generate_java_class_definitions(),
            "es6" => self.generate_es6_class_definitions(),
            "rust" => self.generate_rust_class_definitions(),
            _ => {}
        }
    }
    
    /// Generate Java class definitions
    fn generate_java_class_definitions(&mut self) {
        // For each system class, generate a Java class that mirrors the native class
        for system_class in &self.context.system_classes {
            let system_class = system_class.borrow();
            if let Some(mapping) = system_class.get_mapping("java7") {
                let class_name = &system_class.name;
                let native_class = &mapping.native_class_name;
                
                // Start building the class definition
                let mut class_def = format!("public class {} {{\n", class_name);
                class_def.push_str(&format!("    private {} nativeObj;\n\n", native_class));
                
                // Constructor
                class_def.push_str(&format!("    public {}({} nativeObj) {{\n", class_name, native_class));
                class_def.push_str("        this.nativeObj = nativeObj;\n");
                class_def.push_str("    }\n\n");
                
                // Native object getter
                class_def.push_str(&format!("    public {} getNativeObject() {{\n", native_class));
                class_def.push_str("        return this.nativeObj;\n");
                class_def.push_str("    }\n");
                
                // Add methods for operators that use this class
                self.add_java_operators_for_class(&mut class_def, class_name);
                
                class_def.push_str("}");
                self.class_definitions.insert(class_name.clone(), class_def);
            }
        }
    }
    
    /// Add Java methods for operators related to a system class
    fn add_java_operators_for_class(&self, class_def: &mut String, class_name: &str) {
        for operator in &self.context.operators {
            let operator = operator.borrow();
            if !operator.has_template_for("java7") {
                continue;
            }
            
            // Check if the operator is related to this class (either as return type or first parameter)
            let is_related = operator.return_type == class_name ||
                             (operator.parameters.len() > 0 && operator.parameters[0].param_type == class_name);
            
            if is_related {
                // Build the method signature
                let mut method_def = String::new();
                method_def.push_str("\n    public ");
                
                // Return type
                if operator.return_type == "void" {
                    method_def.push_str("void ");
                } else if operator.return_type == class_name {
                    method_def.push_str(&format!("{} ", class_name));
                } else {
                    // Check if the return type is another system class
                    let return_is_system_class = self.context.system_classes.iter()
                        .any(|sc| sc.borrow().name == operator.return_type);
                    
                    if return_is_system_class {
                        method_def.push_str(&format!("{} ", operator.return_type));
                    } else {
                        // Use Java primitive types or Object
                        let java_type = match operator.return_type.as_str() {
                            "int" => "int",
                            "float" => "float",
                            "double" => "double",
                            "boolean" => "boolean",
                            "string" => "String",
                            "Bytes" => "byte[]",
                            _ => "Object"
                        };
                        method_def.push_str(&format!("{} ", java_type));
                    }
                }
                
                // Method name
                method_def.push_str(&operator.name);
                method_def.push('(');
                
                // Parameters, skipping the first if it's this class (instance method)
                let start_idx = if operator.parameters.len() > 0 && operator.parameters[0].param_type == class_name {
                    1
                } else {
                    0
                };
                
                for (i, param) in operator.parameters.iter().enumerate().skip(start_idx) {
                    if i > start_idx {
                        method_def.push_str(", ");
                    }
                    
                    // Convert parameter type to Java type
                    let java_param_type = match param.param_type.as_str() {
                        "int" => "int".to_string(),
                        "float" => "float".to_string(),
                        "double" => "double".to_string(),
                        "boolean" => "boolean".to_string(),
                        "string" => "String".to_string(),
                        "Bytes" => "byte[]".to_string(),
                        _ => {
                            // Check if it's a system class
                            let is_system_class = self.context.system_classes.iter()
                                .any(|sc| sc.borrow().name == param.param_type);
                            
                            if is_system_class {
                                param.param_type.clone()
                            } else {
                                "Object".to_string()
                            }
                        }
                    };
                    
                    method_def.push_str(&format!("{} {}", java_param_type, param.name));
                }
                
                method_def.push_str(") ");
                
                // Add throws if necessary
                if operator.has_attribute("throws") {
                    method_def.push_str("throws Exception ");
                }
                
                // Method body
                method_def.push_str("{\n");
                
                // Get the template
                if let Some(template) = operator.get_template("java7") {
                    // Process the template to replace parameter references
                    let mut java_code = template.clone();
                    
                    // Replace (e N) references with actual parameter values
                    for i in 1..=operator.parameters.len() {
                        let param_ref = format!("(e {})", i);
                        let replacement = if i == 1 && operator.parameters[0].param_type == class_name {
                            "this.nativeObj".to_string()
                        } else if start_idx == 1 {
                            if i > 1 {
                                let param = &operator.parameters[i];
                                if self.context.system_classes.iter()
                                    .any(|sc| sc.borrow().name == param.param_type) {
                                    format!("{}.getNativeObject()", param.name)
                                } else {
                                    param.name.clone()
                                }
                            } else {
                                "this.nativeObj".to_string()
                            }
                        } else {
                            let param = &operator.parameters[i-1];
                            if self.context.system_classes.iter()
                                .any(|sc| sc.borrow().name == param.param_type) {
                                format!("{}.getNativeObject()", param.name)
                            } else {
                                param.name.clone()
                            }
                        };
                        
                        java_code = java_code.replace(&param_ref, &replacement);
                    }
                    
                    // Add return statement if necessary
                    if operator.return_type != "void" {
                        if operator.return_type == class_name {
                            method_def.push_str(&format!("        return new {}({});\n", class_name, java_code));
                        } else if self.context.system_classes.iter()
                               .any(|sc| sc.borrow().name == operator.return_type) {
                            method_def.push_str(&format!("        return new {}({});\n", operator.return_type, java_code));
                        } else {
                            method_def.push_str(&format!("        return {};\n", java_code));
                        }
                    } else {
                        method_def.push_str(&format!("        {};\n", java_code));
                    }
                }
                
                method_def.push_str("    }");
                class_def.push_str(&method_def);
            }
        }
    }
    
    /// Generate ES6 class definitions
    fn generate_es6_class_definitions(&mut self) {
        // Implementation similar to Java but for JavaScript/ES6
        for system_class in &self.context.system_classes {
            let system_class = system_class.borrow();
            if let Some(mapping) = system_class.get_mapping("es6") {
                let class_name = &system_class.name;
                let native_class = &mapping.native_class_name;
                
                // Start building the class definition
                let mut class_def = format!("class {} {{\n", class_name);
                class_def.push_str("    constructor(nativeObj) {\n");
                class_def.push_str("        this.nativeObj = nativeObj;\n");
                class_def.push_str("    }\n\n");
                
                // Native object getter
                class_def.push_str("    getNativeObject() {\n");
                class_def.push_str("        return this.nativeObj;\n");
                class_def.push_str("    }\n");
                
                // Add methods for operators that use this class
                self.add_es6_operators_for_class(&mut class_def, class_name);
                
                class_def.push_str("}");
                self.class_definitions.insert(class_name.clone(), class_def);
            }
        }
    }
    
    /// Add ES6 methods for operators related to a system class
    fn add_es6_operators_for_class(&self, class_def: &mut String, class_name: &str) {
        // Similar to Java method but with JavaScript syntax
        for operator in &self.context.operators {
            let operator = operator.borrow();
            if !operator.has_template_for("es6") {
                continue;
            }
            
            // Check if the operator is related to this class
            let is_related = operator.return_type == class_name ||
                             (operator.parameters.len() > 0 && operator.parameters[0].param_type == class_name);
            
            if is_related {
                // Build the method signature
                let mut method_def = String::new();
                method_def.push_str("\n    ");
                
                // Method name
                method_def.push_str(&operator.name);
                method_def.push('(');
                
                // Parameters, skipping the first if it's this class (instance method)
                let start_idx = if operator.parameters.len() > 0 && operator.parameters[0].param_type == class_name {
                    1
                } else {
                    0
                };
                
                for (i, param) in operator.parameters.iter().enumerate().skip(start_idx) {
                    if i > start_idx {
                        method_def.push_str(", ");
                    }
                    method_def.push_str(&param.name);
                }
                
                method_def.push_str(") {\n");
                
                // Get the template
                if let Some(template) = operator.get_template("es6") {
                    // Process the template to replace parameter references
                    let mut js_code = template.clone();
                    
                    // Replace (e N) references with actual parameter values
                    for i in 1..=operator.parameters.len() {
                        let param_ref = format!("(e {})", i);
                        let replacement = if i == 1 && operator.parameters[0].param_type == class_name {
                            "this.nativeObj".to_string()
                        } else if start_idx == 1 {
                            if i > 1 {
                                let param = &operator.parameters[i];
                                if self.context.system_classes.iter()
                                    .any(|sc| sc.borrow().name == param.param_type) {
                                    format!("{}.getNativeObject()", param.name)
                                } else {
                                    param.name.clone()
                                }
                            } else {
                                "this.nativeObj".to_string()
                            }
                        } else {
                            let param = &operator.parameters[i-1];
                            if self.context.system_classes.iter()
                                .any(|sc| sc.borrow().name == param.param_type) {
                                format!("{}.getNativeObject()", param.name)
                            } else {
                                param.name.clone()
                            }
                        };
                        
                        js_code = js_code.replace(&param_ref, &replacement);
                    }
                    
                    // Add return statement if necessary
                    if operator.return_type != "void" {
                        if operator.return_type == class_name {
                            method_def.push_str(&format!("        return new {}({});\n", class_name, js_code));
                        } else if self.context.system_classes.iter()
                               .any(|sc| sc.borrow().name == operator.return_type) {
                            method_def.push_str(&format!("        return new {}({});\n", operator.return_type, js_code));
                        } else {
                            method_def.push_str(&format!("        return {};\n", js_code));
                        }
                    } else {
                        method_def.push_str(&format!("        {};\n", js_code));
                    }
                }
                
                method_def.push_str("    }");
                class_def.push_str(&method_def);
            }
        }
    }
    
    /// Generate Rust class definitions
    fn generate_rust_class_definitions(&mut self) {
        // Generate Rust code for the system classes
        for system_class in &self.context.system_classes {
            let system_class = system_class.borrow();
            let class_name = &system_class.name;
            
            // Start building the class definition
            let mut class_def = format!("pub struct {} {{\n", class_name);
            class_def.push_str("    // Native implementation\n");
            
            // For Rust, we wrap the native implementation type if available
            if let Some(mapping) = system_class.get_mapping("rust") {
                class_def.push_str(&format!("    inner: {},\n", mapping.native_class_name));
            } else {
                // Add a placeholder for when native implementation isn't specified
                class_def.push_str("    // No native implementation provided for Rust\n");
                class_def.push_str("    inner: (),\n");
            }
            class_def.push_str("}\n\n");
            
            // Implement methods for the class
            class_def.push_str(&format!("impl {} {{\n", class_name));
            class_def.push_str("    // Create a new instance wrapping a native object\n");
            
            // Constructor
            if let Some(mapping) = system_class.get_mapping("rust") {
                class_def.push_str(&format!("    pub fn new(inner: {}) -> Self {{\n", mapping.native_class_name));
            } else {
                class_def.push_str("    pub fn new() -> Self {\n");
            }
            class_def.push_str("        Self {\n");
            class_def.push_str("            inner: ");
            
            if let Some(mapping) = system_class.get_mapping("rust") {
                class_def.push_str("inner");
            } else {
                class_def.push_str("()");
            }
            
            class_def.push_str(",\n");
            class_def.push_str("        }\n");
            class_def.push_str("    }\n\n");
            
            // Add methods for operators related to this class
            self.add_rust_operators_for_class(&mut class_def, class_name);
            
            class_def.push_str("}");
            self.class_definitions.insert(class_name.clone(), class_def);
        }
    }
    
    /// Add Rust methods for operators related to a system class
    fn add_rust_operators_for_class(&self, class_def: &mut String, class_name: &str) {
        for operator in &self.context.operators {
            let operator = operator.borrow();
            if !operator.has_template_for("rust") {
                continue;
            }
            
            // Check if the operator is related to this class
            let is_related = operator.return_type == class_name ||
                             (operator.parameters.len() > 0 && operator.parameters[0].param_type == class_name);
            
            if is_related {
                // Build the method signature
                let mut method_def = String::new();
                method_def.push_str("    pub fn ");
                
                // Method name
                method_def.push_str(&operator.name);
                method_def.push('(');
                
                // Parameters, using &self if the first parameter is the same type as the class
                let start_idx = if operator.parameters.len() > 0 && operator.parameters[0].param_type == class_name {
                    method_def.push_str("&self");
                    if operator.parameters.len() > 1 {
                        method_def.push_str(", ");
                    }
                    1
                } else {
                    method_def.push_str("&self");
                    0
                };
                
                for (i, param) in operator.parameters.iter().enumerate().skip(start_idx) {
                    if i > start_idx {
                        method_def.push_str(", ");
                    }
                    
                    // Convert parameter type to Rust type
                    let rust_param_type = match param.param_type.as_str() {
                        "int" => "i32".to_string(),
                        "float" => "f32".to_string(),
                        "double" => "f64".to_string(),
                        "boolean" => "bool".to_string(),
                        "string" => "String".to_string(),
                        "Bytes" => "Vec<u8>".to_string(),
                        _ => {
                            // Check if it's a system class
                            let is_system_class = self.context.system_classes.iter()
                                .any(|sc| sc.borrow().name == param.param_type);
                            
                            if is_system_class {
                                format!("&{}", param.param_type)
                            } else {
                                "Box<dyn Any>".to_string()
                            }
                        }
                    };
                    
                    method_def.push_str(&format!("{}: {}", param.name, rust_param_type));
                }
                
                // Return type
                method_def.push_str(") -> ");
                
                let rust_return_type = if operator.return_type == "void" {
                    "()".to_string()
                } else {
                    match operator.return_type.as_str() {
                        "int" => "i32".to_string(),
                        "float" => "f32".to_string(),
                        "double" => "f64".to_string(),
                        "boolean" => "bool".to_string(),
                        "string" => "String".to_string(),
                        "Bytes" => "Vec<u8>".to_string(),
                        _ => {
                            // Check if it's a system class
                            let is_system_class = self.context.system_classes.iter()
                                .any(|sc| sc.borrow().name == operator.return_type);
                            
                            if is_system_class {
                                operator.return_type.clone()
                            } else {
                                "Box<dyn Any>".to_string()
                            }
                        }
                    }
                };
                
                method_def.push_str(&rust_return_type);
                
                // Method body
                method_def.push_str(" {\n");
                
                // Get the template
                if let Some(template) = operator.get_template("rust") {
                    // Process the template to replace parameter references
                    let mut rust_code = template.clone();
                    
                    // Replace (e N) references with actual parameter values
                    for i in 1..=operator.parameters.len() {
                        let param_ref = format!("(e {})", i);
                        let replacement = if i == 1 && operator.parameters[0].param_type == class_name {
                            "self.inner".to_string()
                        } else if start_idx == 1 {
                            if i > 1 {
                                let param = &operator.parameters[i];
                                if self.context.system_classes.iter()
                                    .any(|sc| sc.borrow().name == param.param_type) {
                                    format!("{}.inner", param.name)
                                } else {
                                    param.name.clone()
                                }
                            } else {
                                "self.inner".to_string()
                            }
                        } else {
                            let param = &operator.parameters[i-1];
                            if self.context.system_classes.iter()
                                .any(|sc| sc.borrow().name == param.param_type) {
                                format!("{}.inner", param.name)
                            } else {
                                param.name.clone()
                            }
                        };
                        
                        rust_code = rust_code.replace(&param_ref, &replacement);
                    }
                    
                    // Add return statement if necessary
                    if operator.return_type != "void" {
                        if operator.return_type == class_name {
                            method_def.push_str(&format!("        Self::new({})\n", rust_code));
                        } else if self.context.system_classes.iter()
                               .any(|sc| sc.borrow().name == operator.return_type) {
                            method_def.push_str(&format!("        {}::new({})\n", operator.return_type, rust_code));
                        } else {
                            method_def.push_str(&format!("        {}\n", rust_code));
                        }
                    } else {
                        method_def.push_str(&format!("        {}\n", rust_code));
                    }
                } else {
                    // No template for Rust, add a stub implementation
                    if operator.return_type != "void" {
                        match rust_return_type.as_str() {
                            "i32" => method_def.push_str("        0\n"),
                            "f32" => method_def.push_str("        0.0\n"),
                            "f64" => method_def.push_str("        0.0\n"),
                            "bool" => method_def.push_str("        false\n"),
                            "String" => method_def.push_str("        String::new()\n"),
                            "Vec<u8>" => method_def.push_str("        Vec::new()\n"),
                            _ => {
                                // Check if it's a system class
                                let is_system_class = self.context.system_classes.iter()
                                    .any(|sc| sc.borrow().name == operator.return_type);
                                
                                if is_system_class {
                                    method_def.push_str(&format!("        {}::new()\n", operator.return_type));
                                } else {
                                    method_def.push_str("        unimplemented!()\n");
                                }
                            }
                        }
                    } else {
                        method_def.push_str("        // Not implemented for Rust\n");
                    }
                }
                
                method_def.push_str("    }\n\n");
                class_def.push_str(&method_def);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::SourceCode;
    use crate::parsers::SystemClassParser;
    
    #[test]
    fn test_simple_java_generation() {
        // Create a simple system class and operator
        let source = SourceCode::new(r#"
            systemclass RandomGenerator {
                java7 SecureRandom  ( (imp 'java.security.SecureRandom'))
            }
            operators {
                newRandomGenerator _:RandomGenerator () {
                    templates {
                        java7 ('SecureRandom.getInstance("SHA1PRNG")')
                    }      
                }
            }
        "#.to_string());
        
        let mut parser = SystemClassParser::new(source);
        assert!(parser.parse());
        
        let mut context = RangerAppWriterContext::new();
        parser.add_to_context(&mut context);
        
        let mut generator = SystemClassGenerator::new(context, "java7");
        let code = generator.generate();
        
        // Check that imports are included
        assert!(code.contains("import java.security.SecureRandom;"));
        
        // Check that the class is defined
        assert!(code.contains("public class RandomGenerator {"));
        assert!(code.contains("private SecureRandom nativeObj;"));
        
        // Check that the static method is generated
        assert!(code.contains("public RandomGenerator newRandomGenerator()"));
        assert!(code.contains("return new RandomGenerator(SecureRandom.getInstance(\"SHA1PRNG\"));"));
    }
}