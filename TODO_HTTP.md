# HTTP Server Extension - Implementation Progress

Based on [PLAN_HTTP.md](./PLAN_HTTP.md)

## Status: 🚧 In Progress

Started: December 23, 2025

---

## Phase 1: Unified EVG Tool ✅ COMPLETE

### 1.1 Create `evg_tool.rgr`
- [x] Create new file `gallery/pdf_writer/src/tools/evg_tool.rgr`
- [x] Implement command-line argument parsing
- [x] HTML-focused preview (PDF/PNG deferred)
- [x] Add format auto-detection from output extension
- [x] Generate help text (`--help`)
- [x] Add version flag (`--version`)
- [x] Support `--embed` for base64 images
- [x] Support `--assets` for component imports
- [x] Support `--components` flag

### 1.2 Update `package.json`
- [x] Add `evg:tool:compile` script (ES6)
- [x] Add `evg:tool:compile:go` script (Go)
- [x] Add `evg:tool:build:go` script (compile + go build)
- [x] Add `evg:tool:run` script
- [x] Add `evg:tool` convenience script

### 1.3 Test Unified Tool
- [x] Test HTML output
- [x] Test format auto-detection
- [x] Test help output
- [x] Test Go compilation and execution
- [ ] Test component imports with --assets

---

## Phase 2: Live Preview Architecture ✅ COMPLETE

### 2.1 Shell + Content Architecture
The live preview splits rendering into two parts:
- **Shell HTML**: Static page with JS that fetches content
- **Content endpoint**: Returns just the document elements

See PLAN_HTTP.md Part 1.5 for details.

### 2.2 EVGHTMLRenderer Updates
- [x] Add `renderContent()` - render without html/head/body wrapper
- [x] Add `getUsedFonts()` - return list of font families
- [x] Add `generateServerFontFaceCSS(serverUrl)` - CSS for server-hosted fonts
- [x] Add `setImageServer(url)` - transform image paths to server URLs
- [x] Add `generateShellHTML()` - generate shell HTML for live preview

---

## Phase 3: HTTP Server Language Extension 🚧 IN PROGRESS

### 3.1 Annotation Syntax Design ✅
Using S-expression syntax consistent with existing Ranger patterns:

```ranger
; Class annotation with nested parameter
class MyServer@(HttpServer@(port 8080)) { }

; Route annotations with path as first argument
fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) { }
fn handleEvents@(SSE "/events"):void (req:HttpRequest client:SSEClient) { }
```

### 3.2 CodeNode Helper Methods (ng_CodeNode.rgr)
- [ ] Add `getFlagInt(flagName paramName defaultValue)` - get nested int param
- [ ] Add `getFlagString(flagName defaultValue)` - get first arg as string
- [ ] Add `hasFlagParam(flagName paramName)` - check nested param exists

### 3.3 Lang.rgr - System Classes
- [ ] Add `HttpRequest` systemclass
- [ ] Add `HttpResponse` systemclass
- [ ] Add `SSEClient` systemclass
- [ ] Add `HttpServer` systemclass

### 3.4 Lang.rgr - HTTP Operators
- [ ] `http_get_method` - Get request method
- [ ] `http_get_path` - Get request path
- [ ] `http_get_param` - Get path parameter
- [ ] `http_get_query` - Get query parameter
- [ ] `http_get_header` - Get request header
- [ ] `http_get_body` - Get request body
- [ ] `http_set_status` - Set response status
- [ ] `http_set_header` - Set response header
- [ ] `http_send` - Send response body
- [ ] `http_send_file` - Send file content
- [ ] `http_json` - Send JSON response
- [ ] `http_redirect` - Redirect response

### 3.5 Lang.rgr - SSE Operators
- [ ] `sse_send` - Send SSE event
- [ ] `sse_close` - Close SSE connection
- [ ] `sse_is_connected` - Check connection status

### 3.6 Lang.rgr - Server Operators
- [ ] `http_server_start` - Start HTTP server
- [ ] `http_server_stop` - Stop HTTP server

### 3.7 Go Writer - HTTP Server Class (ng_RangerGolangClassWriter.rgr)
- [ ] Detect `@(HttpServer@(port N))` on class definition
- [ ] Extract port from nested annotation
- [ ] Generate `http.ServeMux` setup in constructor
- [ ] Generate `Start()` method with `http.ListenAndServe`
- [ ] Add required imports (`"net/http"`, `"fmt"`)

### 3.8 Go Writer - HTTP Handlers
- [ ] Detect `@(GET "/path")` on methods
- [ ] Detect `@(POST "/path")` on methods  
- [ ] Detect `@(PUT "/path")` on methods
- [ ] Detect `@(DELETE "/path")` on methods
- [ ] Generate handler wrapper functions
- [ ] Register routes in `Start()` method

### 3.9 Go Writer - SSE Handlers
- [ ] Detect `@(SSE "/path")` on methods
- [ ] Generate SSE boilerplate (flusher, headers)
- [ ] Create `SSEClient` struct polyfill
- [ ] Handle client connection/disconnection

### 3.10 Go Writer - Lifecycle Hooks
- [ ] Detect `@(ServerStart)` annotation
- [ ] Detect `@(ServerStop)` annotation
- [ ] Generate lifecycle method calls

---

## Phase 4: EVG Watch Mode Server

@
- [ ] Implement `notifyReload()` method
- [ ] Implement `renderDocument()` method

### 4.2 File Watching
- [ ] Add `watch_file` operator to Lang.rgr (Go: fsnotify)
- [ ] Implement file change detection
- [ ] Send SSE "update" event on file change
- [ ] Handle imported component changes
- [ ] Add debouncing for rapid changes

### 4.3 Browser Auto-Open
- [ ] Add `open_browser` operator to Lang.rgr
- [ ] Implement macOS support (`open` command)
- [ ] Implement Linux support (`xdg-open` command)
- [ ] Implement Windows support (`start` command)

### 4.4 Integration with evg_tool
- [ ] Add `--watch` flag to evg_tool
- [ ] Add `--port` flag for server port
- [ ] Start preview server when --watch specified
- [ ] Connect file watcher to preview server
- [ ] Handle compilation errors gracefully

---

## Phase 5: Testing & Documentation

### 5.1 Test Fixtures
- [ ] Create `tests/fixtures/http_server.rgr` - basic HTTP server
- [ ] Create `tests/fixtures/http_sse.rgr` - SSE endpoint
- [ ] Create `tests/fixtures/http_params.rgr` - path parameters

### 5.2 Test Cases
- [ ] Test HTTP server compilation to Go
- [ ] Test route generation
- [ ] Test SSE endpoint generation
- [ ] Test path parameter handling
- [ ] Test annotation parameter extraction

### 5.3 Documentation
- [ ] Update `gallery/pdf_writer/README.md` with new CLI
- [ ] Add watch mode examples
- [ ] Document HTTP server annotations (S-expression syntax)
- [ ] Add examples to `/ai/EXAMPLES.md`

---

## Phase 6: AI Integration (Future)

> **Note**: This phase should be implemented after Phases 1-5 are stable.

### 6.1 AI Configuration
- [ ] Define `ai.config.json` schema
- [ ] Load AI config from file
- [ ] Support environment variable substitution for API keys
- [ ] Support multiple AI providers (OpenAI, Anthropic, etc.)

### 6.2 AI System Classes (Lang.rgr)
- [ ] Add `AIConfig` systemclass
- [ ] Add `AIResponse` systemclass
- [ ] Add `ai_load_config` operator
- [ ] Add `ai_send` operator
- [ ] Add `ai_get_response` operator
- [ ] Add `ai_extract_code` operator

### 6.3 AI Polyfills
- [ ] Go: OpenAI client implementation
- [ ] ES6: openai npm package wrapper
- [ ] Context building (include TSX, components, images)
- [ ] Response parsing (extract code blocks)

### 6.4 Preview Server AI Endpoint
- [ ] Add `POST /ai` handler
- [ ] Build document context for AI
- [ ] Parse AI response and extract TSX
- [ ] Write updated TSX to disk
- [ ] Return response to client

### 6.5 AI Chat UI
- [ ] Create chat panel HTML/CSS
- [ ] Implement message sending
- [ ] Display AI responses
- [ ] Handle loading states
- [ ] Handle errors gracefully

### 6.6 CLI Integration
- [ ] Add `--ai` flag to enable AI assistant
- [ ] Add `--ai-config` option for config file path
- [ ] Add `--ai-provider` option
- [ ] Add `--ai-model` option

---

## Verification Checklist

Before marking a phase complete:

- [ ] Code compiles to ES6 without errors
- [ ] Code compiles to Go without errors
- [ ] Go binary builds successfully
- [ ] Go binary runs correctly
- [ ] All tests pass
- [ ] Documentation updated

---

## Notes

### December 23, 2025
- Phase 1 COMPLETE: evg_tool.rgr created and tested
- Phase 2 COMPLETE: EVGHTMLRenderer partial rendering methods added
  - `renderContent()` - render without wrapper
  - `getUsedFonts()` - list of font families
  - `generateServerFontFaceCSS()` - @font-face for server
  - `setImageServer()` - set image server URL
  - `generateShellHTML()` - shell HTML for live preview
- Annotation syntax finalized: `@(HttpServer@(port 8080))`
- Ready to start Phase 3: HTTP Server Language Extension

---

## Quick Commands

```bash
# Compile evg_tool to Go
npm run evg:tool:compile:go

# Build Go executable
npm run evg:tool:build:go

# Run evg_tool
./gallery/pdf_writer/bin/evg_tool input.tsx output.html

# Full compile + build + run
npm run evg:tool

# Compile evg_html_tool to Go (legacy)
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./gallery/pdf_writer/src/tools/evg_html_tool.rgr -d=./gallery/pdf_writer/bin -o=evg_html_tool.go -nodecli
```

## Annotation Syntax Reference

```ranger
; HTTP Server class
class MyServer@(HttpServer@(port 8080)) {
    
    ; GET endpoint
    fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) { }
    
    ; Path parameters
    fn handleUser@(GET "/users/:id"):void (req:HttpRequest res:HttpResponse) { }
    
    ; SSE endpoint
    fn handleEvents@(SSE "/events"):void (req:HttpRequest client:SSEClient) { }
    
    ; POST endpoint
    fn handleCreate@(POST "/api/create"):void (req:HttpRequest res:HttpResponse) { }
    
    ; Lifecycle hooks
    fn onStart@(ServerStart):void () { }
    fn onStop@(ServerStop):void () { }
}
```
