# Ranger Plugin Architecture Review

## Executive Summary

Ranger has a powerful but currently non-functional plugin architecture that allows extending the compiler's capabilities through npm-distributed JavaScript modules. The plugin system enables custom code generation, domain-specific language (DSL) support, and post-processing of compilation output. This document evaluates the current state, potential uses, and recommendations for the future.

---

## What Are Ranger Plugins?

Ranger plugins are npm packages that can:

1. **Intercept imports** - Custom handling of `Import` statements
2. **Post-process output** - Transform compiled code or generate additional files
3. **Define custom DSLs** - Create domain-specific languages within Ranger
4. **Generate artifacts** - Produce files like `pom.xml`, `Makefile`, HTML slides, etc.

### Plugin Structure

Every plugin must export a `Plugin` class with specific methods:

```javascript
class Plugin {
  // Return list of supported features
  features() {
    return ["postprocess", "import_loader", "generate_ast"];
  }

  // Called during post-processing phase
  postprocess(root, ctx, wr) {
    // Access parsed nodes via ctx.getPluginNodes("pluginName")
    // Write output via wr.getFileWriter()
  }
}
```

### Available Plugin Hooks

| Hook            | Purpose                       | When Called                          |
| --------------- | ----------------------------- | ------------------------------------ |
| `import_loader` | Custom import resolution      | During `Import` statement processing |
| `preprocess`    | Modify AST before compilation | Before type checking                 |
| `postprocess`   | Generate output files         | After compilation                    |
| `generate_ast`  | Inject code into AST          | Before static analysis               |
| `apps`          | Application-level processing  | During compilation                   |

---

## Existing Plugins

### 1. **plaintext_plugin.rgr** (ranger-file)

- **Purpose**: Write arbitrary files from plugin nodes
- **Usage**: `plugin.file 'README.md' "content here"`
- **Status**: Foundation plugin used by other plugins

### 2. **reveal_plugin.rgr** (ranger-reveal)

- **Purpose**: Generate Reveal.js presentation slides
- **Usage**: Define slides with semantic syntax
- **Example**:

```ranger
plugin.slides {
    presentation "Title" "output.html" {
        slide {
            h1 "Ranger"
            p.fragment "Supports multiple languages"
        }
    }
}
```

### 3. **commonmark_plugin.rgr** (ranger-markdown)

- **Purpose**: Generate Markdown files with structured syntax
- **Usage**: `plugin.md 'README.md' { h3 'Title' p "content" table {...} }`

### 4. **maven_plugin.rgr** (ranger-maven)

- **Purpose**: Generate Maven `pom.xml` for Java projects
- **Usage**: Automatically creates project structure for Java compilation

### 5. **makefile_plugin.rgr** (ranger-makefile)

- **Purpose**: Generate Makefiles for C++ compilation
- **Usage**: Creates build configuration for C++ targets

### 6. **ui_plugin.rgr** (ranger-material-ui)

- **Purpose**: Generate Material UI HTML components
- **Status**: Experimental/incomplete

### 7. **markdown_plugin.rgr**

- **Purpose**: Alternative Markdown generation (slide-focused)

---

## How Plugins Are Invoked

### CLI Usage

```bash
# Using npm-installed plugins
ranger-compiler -plugins="ranger-reveal,ranger-markdown" myfile.rgr

# Using local plugin files
ranger-compiler -plugins="./plugin/custom/index.js" myfile.rgr

# Plugin-only mode (skip language output)
ranger-compiler -plugins-only -plugins="ranger-reveal" slides.rgr
```

### Plugin Node Collection

Plugins define custom syntax that the parser collects:

```ranger
; In source file
plugin.slides { ... }      ; Collected under "slides"
plugin.md "file" { ... }   ; Collected under "md"
plugin.file 'x' "y"        ; Collected under "file"
```

Plugins retrieve these nodes via:

```javascript
const nodes = ctx.getPluginNodes("slides");
```

---

## Current Issues

### Why Plugins Stopped Working

1. **Module System Changes**: The plugins use `require()` syntax which may have issues with ES modules
2. **Path Resolution**: Plugin paths are resolved relative to `process.cwd()` which may not work in all contexts
3. **Missing Error Handling**: Silent failures when plugins can't be loaded
4. **Outdated npm Packages**: Published plugin packages may be out of date

### Technical Debt

1. **Hardcoded `require()` in templates**:

```ranger
load_compiler_plugin _:RangerCompilerPlugin ( name:string ) {
    templates {
        es6 ( 'require( ' (e 1) ' )' )  ; Only works in Node.js CommonJS
        * ()  ; No-op for other targets
    }
}
```

2. **No browser support**: Plugins only work in Node.js environment
3. **No TypeScript definitions**: Plugin API lacks type definitions
4. **Sparse documentation**: Usage patterns not well documented

---

## Future Possibilities

### 1. Domain-Specific Languages (DSLs)

Plugins could enable high-level abstractions:

```ranger
; Define a REST API
plugin.api "UserService" {
    endpoint GET "/users" {
        returns [User]
    }
    endpoint POST "/users" {
        body User
        returns User
    }
}

; Define a database schema
plugin.schema "MyDatabase" {
    table "users" {
        column id int primary_key auto_increment
        column name string(255) not_null
        column email string(255) unique
    }
}

; Generate documentation
plugin.docs "API.md" {
    section "Overview" { ... }
    section "Endpoints" { ... }
}
```

### 2. Build System Integration

```ranger
plugin.build {
    target "web" {
        language "typescript"
        bundle true
        minify true
    }
    target "server" {
        language "go"
        docker true
    }
}
```

### 3. Cross-Platform UI Generation

```ranger
plugin.ui {
    screen "Login" {
        textfield "username" placeholder="Email"
        textfield "password" secure=true
        button "Login" action=login
    }
}
; Generates: SwiftUI, Jetpack Compose, React components
```

### 4. Testing DSL

```ranger
plugin.test "MathTests" {
    suite "Addition" {
        test "adds positive numbers" {
            expect (add 2 3) == 5
        }
    }
}
```

---

## Risk Assessment

### Security Risks

| Risk                     | Severity | Mitigation                                               |
| ------------------------ | -------- | -------------------------------------------------------- |
| Arbitrary code execution | High     | Plugins run with full Node.js access; sandboxing needed  |
| Supply chain attacks     | Medium   | npm packages could be compromised; verify sources        |
| Path traversal           | Medium   | Plugin file writers could write outside target directory |

### Compatibility Risks

| Risk                  | Severity | Impact                                               |
| --------------------- | -------- | ---------------------------------------------------- |
| Breaking changes      | Medium   | Plugin API changes could break existing plugins      |
| Node.js version drift | Low      | Newer Node.js features may not work with old plugins |
| ES modules migration  | High     | CommonJS `require()` approach needs updating         |

### Maintenance Risks

| Risk               | Severity | Mitigation                                         |
| ------------------ | -------- | -------------------------------------------------- |
| Abandoned plugins  | Medium   | Document plugin API well so community can maintain |
| API surface area   | Medium   | Keep plugin API minimal and stable                 |
| Testing difficulty | High     | Plugins need their own test harness                |

---

## Recommendations

### Short-Term Fixes

1. **Update module loading** to support both CommonJS and ES modules
2. **Add error logging** when plugin loading fails
3. **Verify existing plugins** work with current compiler version
4. **Add plugin examples** to documentation

### Medium-Term Improvements

1. **Create plugin template** repository for easy plugin development
2. **Add TypeScript definitions** for plugin API
3. **Implement plugin validation** to verify required methods exist
4. **Add browser support** via dynamic imports

### Long-Term Vision

1. **Plugin marketplace** - curated list of community plugins
2. **Visual plugin editor** - define DSLs through web interface
3. **Plugin composition** - chain plugins for complex workflows
4. **Sandboxed execution** - run plugins in isolated environments

---

## Plugin Development Guide

### Minimal Plugin Template

```ranger
Import "ng_Compiler.rgr"

flag npm (
  name "ranger-myplugin"
  version "0.0.1"
  description "My custom plugin"
  author "Your Name"
  license "MIT"
)

class Plugin {
    fn features:[string] () {
        return ([] "postprocess")
    }

    fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        try {
            def nodes (ctx.getPluginNodes("myplugin"))
            nodes.forEach({
                ; Process each plugin.myplugin { ... } block
                print "Processing node..."
            })
        } {
            print (error_msg)
        }
    }
}
```

### Building a Plugin

```bash
# Compile plugin to npm package
ranger-compiler myplugin.rgr -npm -nodemodule -o=index.js

# Test locally
ranger-compiler -plugins="./index.js" test.rgr

# Publish to npm
npm publish
```

### Using Plugin Syntax

```ranger
; In your source file
plugin.myplugin {
    ; Custom DSL syntax here
    command "argument" {
        nested "content"
    }
}
```

---

## Conclusion

The Ranger plugin architecture is a powerful but underutilized feature that could enable:

- **Higher-level abstractions** - Define apps in terms of screens, APIs, data models
- **Custom output formats** - Generate project files, documentation, build scripts
- **Cross-platform code** - Single definition, multiple platform outputs
- **Domain-specific languages** - Tailored syntax for specific problem domains

The main barriers to adoption are:

1. Currently broken/unreliable loading mechanism
2. Lack of documentation and examples
3. No type safety or validation

With targeted fixes to the module loading system and better documentation, plugins could become a key differentiator for Ranger, enabling a "compile once, output anywhere" vision that extends beyond just programming languages to entire project structures and build systems.

---

## Appendix: Plugin Files Reference

| File                                                    | npm Package        | Purpose                     |
| ------------------------------------------------------- | ------------------ | --------------------------- |
| [plaintext_plugin.rgr](compiler/plaintext_plugin.rgr)   | ranger-file        | File output                 |
| [reveal_plugin.rgr](compiler/reveal_plugin.rgr)         | ranger-reveal      | Presentation slides         |
| [commonmark_plugin.rgr](compiler/commonmark_plugin.rgr) | ranger-markdown    | Markdown generation         |
| [markdown_plugin.rgr](compiler/markdown_plugin.rgr)     | -                  | Slide-focused markdown      |
| [maven_plugin.rgr](compiler/maven_plugin.rgr)           | ranger-maven       | Maven pom.xml               |
| [makefile_plugin.rgr](compiler/makefile_plugin.rgr)     | ranger-makefile    | C++ Makefile                |
| [ui_plugin.rgr](compiler/ui_plugin.rgr)                 | ranger-material-ui | Material UI HTML            |
| [ui_plugin2.rgr](compiler/ui_plugin2.rgr)               | -                  | UI variant                  |
| [plugin_apps.rgr](compiler/plugin_apps.rgr)             | -                  | App-level processing        |
| [simplePlugin.rgr](compiler/simplePlugin.rgr)           | -                  | CSS/HTML/GraphQL generation |
| [test_plugin.rgr](compiler/test_plugin.rgr)             | -                  | Test/example plugin         |
