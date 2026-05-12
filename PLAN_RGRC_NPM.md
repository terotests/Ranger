# PLAN: Ranger Compiler (RGRC) NPM Publishing

## Overview

This plan outlines the steps to:
1. **Improve the CLI experience** with colors, spinners, and better error messages
2. **Set up automatic NPM publishing** when version changes on merge to master
3. **Publish `ranger-compiler` 3.0.0-beta.1** to NPM
4. **Integrate with `ranger-pdf-tool`** publishing workflow

---

## Current State

### Package Info
- **Name:** `ranger-compiler`
- **Current Version:** `3.0.0-alpha.1`
- **NPM URL:** https://www.npmjs.com/package/ranger-compiler
- **Repository:** https://github.com/terotests/Ranger

### Existing CI/CD
- `.github/workflows/ci.yml` - Runs tests on push/PR
- `.github/workflows/test.yml` - Simpler test workflow
- `.github/workflows/publish.yml` - Publishes on GitHub Release creation

### CLI Binaries
```json
"bin": {
  "ranger-compiler": "bin/output.js",
  "rgrc": "bin/output.js",
  "evg_server": "bin/evg_server.js"
}
```

### Current CLI Output (Plain)
```
Ranger compiler, version 3.0.0-alpha.1
File to be compiled: myfile.rgr
--> ready to compile
1. Collecting available methods.
2. Second pass.
3. Compiling the source code.
Got compiler error close to
src/file.rgr Line: 42
```

---

## Part 1: CLI Improvements

### 1.1 Terminal Control Operators (Already Available)

The Ranger compiler already has terminal control operators in `Lang.rgr`:
- `clear_screen` - Clear terminal
- `move_cursor (x y)` - Position cursor
- `hide_cursor` / `show_cursor` - Cursor visibility
- ANSI escape codes for colors

### 1.2 Color Console (Existing but Limited)

File: `compiler/ColorConsole.rgr`
```ranger
operators {
    has_console_colors  cmdHasColors:boolean () {
        templates {
            es6 @macro(true) ( "true" ) 
            * @macro(true) ( "false" )
        }
    }
    color_print cmdPrint:void (cname:string text:string) {
        templates {
            es6 ("console.log( require('chalk').keyword(" ( e 1 ) ")(" (e 2) "));" )
            * @macro(true) ( nl "print " (e 2) nl )
        }       
    }
}
```

### 1.3 New CLI Features to Add

#### A. Progress Indicators

Create `compiler/CLIProgress.rgr`:

```ranger
; CLIProgress.rgr - Modern CLI progress indicators for Ranger compiler

operators {
    ; ANSI color codes
    ansi_reset      cmdAnsiReset:string () {
        templates {
            es6 ( "\"\\x1b[0m\"" )
            * ( "\"\"" )
        }
    }
    ansi_bold       cmdAnsiBold:string () {
        templates {
            es6 ( "\"\\x1b[1m\"" )
            * ( "\"\"" )
        }
    }
    ansi_green      cmdAnsiGreen:string () {
        templates {
            es6 ( "\"\\x1b[32m\"" )
            * ( "\"\"" )
        }
    }
    ansi_red        cmdAnsiRed:string () {
        templates {
            es6 ( "\"\\x1b[31m\"" )
            * ( "\"\"" )
        }
    }
    ansi_yellow     cmdAnsiYellow:string () {
        templates {
            es6 ( "\"\\x1b[33m\"" )
            * ( "\"\"" )
        }
    }
    ansi_cyan       cmdAnsicyan:string () {
        templates {
            es6 ( "\"\\x1b[36m\"" )
            * ( "\"\"" )
        }
    }
    ansi_gray       cmdAnsiGray:string () {
        templates {
            es6 ( "\"\\x1b[90m\"" )
            * ( "\"\"" )
        }
    }
    
    ; Unicode symbols
    check_mark      cmdCheckMark:string () {
        templates {
            es6 ( "\"✓\"" )
            * ( "\"[OK]\"" )
        }
    }
    cross_mark      cmdCrossMark:string () {
        templates {
            es6 ( "\"✗\"" )
            * ( "\"[FAIL]\"" )
        }
    }
    arrow_right     cmdArrowRight:string () {
        templates {
            es6 ( "\"→\"" )
            * ( "\"->\"" )
        }
    }
    spinner_frame   cmdSpinnerFrame:string (frameIndex:int) {
        templates {
            es6 ( "(([\"⠋\",\"⠙\",\"⠹\",\"⠸\",\"⠼\",\"⠴\",\"⠦\",\"⠧\",\"⠇\",\"⠏\"])[" (e 1) " % 10])" )
            * ( "\"|\"" )
        }
    }
}

class CLIProgress {
    def spinnerIndex:int 0
    def currentStep:string ""
    def stepStartTime:double 0.0
    def totalSteps:int 5
    def currentStepIndex:int 0
    def useColors:boolean true
    
    ; Detect if running in TTY
    sfn isTTY:boolean () {
        if_javascript {
            return (eval_js "process.stdout.isTTY || false")
        }
        return false
    }
    
    fn setUseColors:void (use:boolean) {
        useColors = use
    }
    
    fn success:string (msg:string) {
        if useColors {
            return (ansi_green) + (check_mark) + " " + msg + (ansi_reset)
        }
        return "[OK] " + msg
    }
    
    fn error:string (msg:string) {
        if useColors {
            return (ansi_red) + (cross_mark) + " " + msg + (ansi_reset)
        }
        return "[ERROR] " + msg
    }
    
    fn warning:string (msg:string) {
        if useColors {
            return (ansi_yellow) + "⚠ " + msg + (ansi_reset)
        }
        return "[WARN] " + msg
    }
    
    fn info:string (msg:string) {
        if useColors {
            return (ansi_cyan) + "ℹ " + msg + (ansi_reset)
        }
        return "[INFO] " + msg
    }
    
    fn dim:string (msg:string) {
        if useColors {
            return (ansi_gray) + msg + (ansi_reset)
        }
        return msg
    }
    
    fn bold:string (msg:string) {
        if useColors {
            return (ansi_bold) + msg + (ansi_reset)
        }
        return msg
    }
    
    fn step:void (stepNum:int stepName:string) {
        currentStepIndex = stepNum
        currentStep = stepName
        def prefix:string "[" + (to_string stepNum) + "/" + (to_string totalSteps) + "]"
        print (this.bold(prefix)) + " " + stepName
    }
    
    fn stepDone:void () {
        ; Move cursor up and add checkmark
        ; For simplicity, just print completion
    }
    
    fn header:void (title:string version:string) {
        print ""
        if useColors {
            print (ansi_bold) + (ansi_cyan) + "⚡ " + title + (ansi_reset) + " " + (ansi_gray) + "v" + version + (ansi_reset)
        } {
            print "=== " + title + " v" + version + " ==="
        }
        print ""
    }
    
    fn divider:void () {
        print (this.dim("─────────────────────────────────────────"))
    }
    
    fn fileInfo:void (label:string path:string) {
        print "  " + (this.dim(label + ":")) + " " + (this.bold(path))
    }
}
```

#### B. Enhanced Error Display

Update error display to be more helpful:

```ranger
; In VirtualCompiler.rgr - Enhanced error display
static fn displayCompilerErrors:void (appCtx@(weak):RangerAppWriterContext cli:CLIProgress) {
    if ( (array_length appCtx.compilerErrors) == 0 ) {
        return
    }
    
    print ""
    print (cli.error("Compilation failed with " + (to_string (array_length appCtx.compilerErrors)) + " error(s):"))
    print ""
    
    for appCtx.compilerErrors e:RangerCompilerMessage i {
        def line_index:int (e.node.getLine())
        def col_index:int (e.node.sp)
        def filename:string (e.node.getFilename())
        def lineStr:string (e.node.getLineString(line_index))
        
        ; Error header with file location
        print (cli.bold(filename)) + ":" + (to_string (1 + line_index)) + ":" + (to_string col_index)
        print ""
        
        ; Error description in red
        print "  " + (cli.error(e.description))
        print ""
        
        ; Show code context with line numbers
        def prevLine:int (line_index - 1)
        if (prevLine >= 0) {
            def prevLineStr:string (e.node.getLineString(prevLine))
            print "    " + (cli.dim((to_string prevLine) + " │ ")) + prevLineStr
        }
        
        ; Current line (highlighted)
        print "  " + (cli.bold((to_string (1 + line_index)) + " │ ")) + lineStr
        
        ; Error pointer
        def pointer:string ""
        def pi 0
        while (pi < col_index) {
            pointer = pointer + " "
            pi = pi + 1
        }
        print "    " + (cli.dim("│ ")) + pointer + (cli.error("^--- here"))
        
        print ""
    }
}
```

#### C. Compilation Summary

```ranger
fn printSummary:void (cli:CLIProgress result:CompileResult duration:double) {
    print ""
    cli.divider()
    
    if result.hasErrors {
        print (cli.error("Compilation FAILED"))
    } {
        print (cli.success("Compilation successful!"))
        print ""
        print "  " + (cli.dim("Output:")) + " " + result.outputFile
        print "  " + (cli.dim("Target:")) + " " + result.targetLanguage
        print "  " + (cli.dim("Time:"))   + " " + (to_string duration) + "ms"
    }
    
    print ""
}
```

### 1.4 Example CLI Output (New)

```
⚡ Ranger Compiler v3.0.0-beta.1

  Input:  src/myapp.rgr
  Output: bin/myapp.js
  Target: JavaScript (ES6)

─────────────────────────────────────────
[1/5] Parsing source files...
[2/5] Collecting methods...
[3/5] Type checking...
[4/5] Code generation...
[5/5] Writing output...

✓ Compilation successful!

  Output: bin/myapp.js
  Target: JavaScript (ES6)
  Time:   234ms
```

**Error Output:**
```
⚡ Ranger Compiler v3.0.0-beta.1

  Input:  src/myapp.rgr
  Output: bin/myapp.js
  Target: JavaScript (ES6)

─────────────────────────────────────────
[1/5] Parsing source files...
[2/5] Collecting methods...

src/myapp.rgr:42:15

  ✗ Unknown method 'fooBar' on type 'MyClass'

    41 │     def result (obj.process())
  42 │     obj.fooBar(result)
     │         ^--- here
    43 │     return result

✗ Compilation FAILED (1 error)
```

---

## Part 2: Automatic NPM Publishing

### 2.1 Version Detection Workflow

Create `.github/workflows/npm-publish.yml`:

```yaml
name: NPM Publish on Version Change

on:
  push:
    branches: [master, main]
    paths:
      - 'package.json'

jobs:
  check-version:
    runs-on: ubuntu-latest
    outputs:
      version_changed: ${{ steps.check.outputs.changed }}
      new_version: ${{ steps.check.outputs.version }}
    
    steps:
      - name: Checkout current
        uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Check if version changed
        id: check
        run: |
          # Get current version
          CURRENT_VERSION=$(node -p "require('./package.json').version")
          
          # Get previous version from the commit before
          git show HEAD~1:package.json > /tmp/prev-package.json 2>/dev/null || echo '{"version":"0.0.0"}' > /tmp/prev-package.json
          PREV_VERSION=$(node -p "require('/tmp/prev-package.json').version")
          
          echo "Current version: $CURRENT_VERSION"
          echo "Previous version: $PREV_VERSION"
          
          if [ "$CURRENT_VERSION" != "$PREV_VERSION" ]; then
            echo "Version changed!"
            echo "changed=true" >> $GITHUB_OUTPUT
            echo "version=$CURRENT_VERSION" >> $GITHUB_OUTPUT
          else
            echo "Version unchanged"
            echo "changed=false" >> $GITHUB_OUTPUT
          fi

  test:
    needs: check-version
    if: needs.check-version.outputs.version_changed == 'true'
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build compiler
        run: |
          npm run compile
          npm run module

  publish:
    needs: [check-version, test]
    if: needs.check-version.outputs.version_changed == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: |
          npm run compile
          npm run module
      
      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create Git Tag
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git tag -a "v${{ needs.check-version.outputs.new_version }}" -m "Release v${{ needs.check-version.outputs.new_version }}"
          git push origin "v${{ needs.check-version.outputs.new_version }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ needs.check-version.outputs.new_version }}
          name: Release v${{ needs.check-version.outputs.new_version }}
          body: |
            ## Ranger Compiler v${{ needs.check-version.outputs.new_version }}
            
            ### Installation
            ```bash
            npm install -g ranger-compiler
            ```
            
            See [CHANGELOG.md](CHANGELOG.md) for details.
          draft: false
          prerelease: ${{ contains(needs.check-version.outputs.new_version, 'alpha') || contains(needs.check-version.outputs.new_version, 'beta') }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2.2 NPM Organization Setup

#### Required NPM Settings:

1. **NPM Account:** https://www.npmjs.com/
   - Ensure `ranger-compiler` package ownership
   - Enable 2FA for publishing (recommended)

2. **Create NPM Access Token:**
   - Go to npmjs.com → Access Tokens → Generate New Token
   - Type: **Automation** (for CI/CD)
   - Copy the token

3. **Add GitHub Secret:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN` with the NPM token value

4. **Package.json Configuration:**
   ```json
   {
     "name": "ranger-compiler",
     "version": "3.0.0-beta.1",
     "publishConfig": {
       "access": "public",
       "registry": "https://registry.npmjs.org/"
     }
   }
   ```

### 2.3 Version Bump Script

Add to `package.json`:
```json
{
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major",
    "version:prerelease": "npm version prerelease --preid=beta",
    "version:beta": "npm version 3.0.0-beta.1"
  }
}
```

---

## Part 3: ranger-pdf-tool Integration

### 3.1 Separate Package Publishing

The `ranger-pdf-tool` package lives in `gallery/pdf_writer/` and needs its own publishing workflow.

Create `.github/workflows/npm-publish-pdf-tool.yml`:

```yaml
name: NPM Publish ranger-pdf-tool

on:
  push:
    branches: [master, main]
    paths:
      - 'gallery/pdf_writer/package.json'

jobs:
  check-version:
    runs-on: ubuntu-latest
    outputs:
      version_changed: ${{ steps.check.outputs.changed }}
      new_version: ${{ steps.check.outputs.version }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Check version change
        id: check
        run: |
          CURRENT=$(node -p "require('./gallery/pdf_writer/package.json').version")
          git show HEAD~1:gallery/pdf_writer/package.json > /tmp/prev.json 2>/dev/null || echo '{"version":"0.0.0"}' > /tmp/prev.json
          PREV=$(node -p "require('/tmp/prev.json').version")
          
          if [ "$CURRENT" != "$PREV" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
            echo "version=$CURRENT" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi

  build-and-publish:
    needs: check-version
    if: needs.check-version.outputs.version_changed == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'
      
      - name: Install root dependencies
        run: npm ci
      
      - name: Build pdf-tool package
        run: |
          npm run pdf:build
      
      - name: Install pdf-tool dependencies
        working-directory: gallery/pdf_writer
        run: npm ci
      
      - name: Publish ranger-pdf-tool
        working-directory: gallery/pdf_writer
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 3.2 Monorepo Considerations

If both packages need coordinated releases:

```yaml
# .github/workflows/npm-publish-all.yml
name: NPM Publish All Packages

on:
  push:
    branches: [master, main]
    paths:
      - 'package.json'
      - 'gallery/pdf_writer/package.json'

jobs:
  publish-compiler:
    # ... (same as above)
    
  publish-pdf-tool:
    # ... (depends on compiler build)
    needs: publish-compiler
```

---

## Part 4: Implementation Tasks

### Phase 1: CLI Improvements

- [ ] **Task 1.1:** Create `compiler/CLIProgress.rgr` with ANSI operators
- [ ] **Task 1.2:** Add color/symbol operators to `Lang.rgr`
- [ ] **Task 1.3:** Update `VirtualCompiler.rgr` to use new CLI utilities
- [ ] **Task 1.4:** Implement step-by-step progress display
- [ ] **Task 1.5:** Enhance error message formatting
- [ ] **Task 1.6:** Add compilation summary with timing
- [ ] **Task 1.7:** Add `--no-color` flag for CI environments
- [ ] **Task 1.8:** Test CLI on Windows, macOS, Linux

### Phase 2: GitHub Actions

- [ ] **Task 2.1:** Create `.github/workflows/npm-publish.yml`
- [ ] **Task 2.2:** Update existing `publish.yml` (deprecate or remove)
- [ ] **Task 2.3:** Add version check script
- [ ] **Task 2.4:** Test workflow with dry-run

### Phase 3: NPM Configuration

- [ ] **Task 3.1:** Verify NPM token exists in GitHub secrets
- [ ] **Task 3.2:** Update `package.json` with `publishConfig`
- [ ] **Task 3.3:** Add `.npmignore` to exclude dev files
- [ ] **Task 3.4:** Test `npm pack` locally

### Phase 4: Beta Release

- [ ] **Task 4.1:** Update version to `3.0.0-beta.1`
- [ ] **Task 4.2:** Update CHANGELOG.md
- [ ] **Task 4.3:** Recompile compiler with new CLI
- [ ] **Task 4.4:** Merge to master (triggers publish)
- [ ] **Task 4.5:** Verify NPM publication

### Phase 5: ranger-pdf-tool Setup

- [ ] **Task 5.1:** Create publish workflow for pdf-tool
- [ ] **Task 5.2:** Update gallery/pdf_writer/package.json
- [ ] **Task 5.3:** Test pdf-tool build in CI
- [ ] **Task 5.4:** Coordinate release with compiler

---

## Part 5: Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `compiler/CLIProgress.rgr` | CLI progress indicators and colors |
| `.github/workflows/npm-publish.yml` | Auto-publish on version change |
| `.github/workflows/npm-publish-pdf-tool.yml` | PDF tool publish workflow |
| `.npmignore` | Exclude files from NPM package |

### Files to Modify

| File | Changes |
|------|---------|
| `compiler/VirtualCompiler.rgr` | Use CLIProgress for output |
| `compiler/Lang.rgr` | Add ANSI color operators |
| `package.json` | Add publishConfig, version scripts |
| `CHANGELOG.md` | Document 3.0.0-beta.1 changes |
| `.github/workflows/publish.yml` | Update or deprecate |

---

## Part 6: .npmignore Configuration

Create `.npmignore`:

```
# Development files
.github/
tests/
features/
generated/
gallery/
examples/
native/
rust_compiler/
adventofcode/
fiddle/

# Documentation (keep README.md)
*.md
!README.md
!CHANGELOG.md

# Config files
.gitignore
.editorconfig
tsconfig.json
vitest.config.*
*.bat

# Source files (keep compiled only)
compiler/*.rgr
lib/*.rgr

# Test files
*_test.js
*_test.rgr
*.test.ts

# Temporary files
*.log
.DS_Store
node_modules/
```

---

## Part 7: package.json Updates

```json
{
  "name": "ranger-compiler",
  "version": "3.0.0-beta.1",
  "description": "Ranger cross-language compiler - compile once, run anywhere",
  "keywords": [
    "compiler",
    "transpiler",
    "cross-language",
    "javascript",
    "typescript",
    "python",
    "go",
    "rust",
    "swift",
    "code-generation"
  ],
  "main": "dist/bin/api.js",
  "types": "dist/bin/api.d.ts",
  "bin": {
    "ranger-compiler": "bin/output.js",
    "rgrc": "bin/output.js"
  },
  "files": [
    "bin/",
    "dist/",
    "compiler/Lang.rgr",
    "lib/",
    "README.md",
    "CHANGELOG.md"
  ],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "scripts": {
    "prepublishOnly": "npm run compile && npm run module && npm test"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Part 8: Release Checklist

### Pre-Release

- [ ] All tests passing (`npm test`)
- [ ] Compiler self-compiles (`npm run compile`)
- [ ] CLI improvements working
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] NPM_TOKEN secret configured

### Release Process

1. Create PR with version bump
2. Merge PR to master
3. GitHub Action automatically:
   - Runs tests
   - Builds compiler
   - Publishes to NPM
   - Creates Git tag
   - Creates GitHub Release

### Post-Release

- [ ] Verify on npmjs.com
- [ ] Test installation: `npm install -g ranger-compiler`
- [ ] Announce release

---

## Timeline Estimate

| Phase | Effort | Duration |
|-------|--------|----------|
| Phase 1: CLI Improvements | 8-12 hours | 2-3 days |
| Phase 2: GitHub Actions | 2-4 hours | 1 day |
| Phase 3: NPM Config | 1-2 hours | 1 day |
| Phase 4: Beta Release | 2-4 hours | 1 day |
| Phase 5: PDF Tool Setup | 2-4 hours | 1 day |

**Total: 15-26 hours over 5-7 days**

---

## Success Criteria

1. ✅ `npm install -g ranger-compiler` installs latest version
2. ✅ `rgrc --help` shows colored, formatted help
3. ✅ Compilation shows progress steps with colors
4. ✅ Errors display with context and pointers
5. ✅ Version change triggers automatic NPM publish
6. ✅ GitHub Releases created automatically
7. ✅ ranger-pdf-tool publishes independently

---

## References

- Current package.json: `package.json`
- Existing publish workflow: `.github/workflows/publish.yml`
- ColorConsole: `compiler/ColorConsole.rgr`
- Terminal operators: `compiler/Lang.rgr` (lines 3980-4100)
- VirtualCompiler output: `compiler/VirtualCompiler.rgr`
- Invaders game terminal usage: `gallery/invaders/invaders.rgr`
