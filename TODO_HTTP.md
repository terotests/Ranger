# HTTP Server Extension - Implementation Progress

Based on [PLAN_HTTP.md](./PLAN_HTTP.md)

## Status: ✅ Phase 4 Complete (EVG Preview Server Working)

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

## Phase 3: HTTP Server Language Extension ✅ COMPLETE

### 3.1 Annotation Syntax Design ✅
Using annotation syntax with `@(HttpServer)` marker on classes:

```ranger
; Class annotation marks it as HttpServer type
class TestServer@(HttpServer) {
    ; Route annotations with path as sibling
    fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) { }
    fn handleEvents@(SSE "/events"):void (client:SSEClient) { }
}

; Start server with simple syntax
start server 3000
```

### 3.2 CodeNode Helper Methods (ng_CodeNode.rgr) ✅
- [x] Add `getFlagSiblingString(flagName defaultValue)` - get sibling string after flag

### 3.3 Lang.rgr - System Classes ✅
- [x] Add `HttpRequest` systemclass (Go: `*http.Request`)
- [x] Add `HttpResponse` systemclass (Go: `http.ResponseWriter`)
- [x] Add `SSEClient` systemclass (Go: `*SSEClient`)
- [x] Add `HttpServer` systemclass

### 3.4 Lang.rgr - HTTP Operators ✅
- [x] `http_get_method` - Get request method
- [x] `http_get_path` - Get request path
- [x] `http_get_header` - Get request header
- [x] `http_get_query` - Get query parameter
- [x] `http_set_status` - Set response status (with `int()` cast fix for Go)
- [x] `http_set_header` - Set response header
- [x] `http_send` - Send response body

### 3.5 Lang.rgr - SSE Operators ✅
- [x] `sse_send` - Send SSE event
- [x] `sse_is_connected` - Check connection status

### 3.6 Lang.rgr - Server Operators ✅
- [x] `start` - Start HTTP server (custom operator for HttpServer type)
- [x] `stop` - Stop HTTP server

### 3.7 Type Matching for @(HttpServer) Annotation ✅
- [x] Add `getSystemclassType()` to ng_RangerAppClassDesc.rgr
- [x] Add `isSystemclassType(typeName)` to ng_RangerAppClassDesc.rgr
- [x] Update `areEqualTypes()` in ng_RangerArgMatch.rgr to check annotations
- [x] Classes with `@(HttpServer)` now match `HttpServer` type for operators

### 3.8 Go Writer - HTTP Server (ng_RangerGolangHttpServerWriter.rgr) ✅
- [x] Create `RangerGolangHttpServerWriter` class
- [x] `writeServerStart()` - Generate inline server setup code
- [x] `writeSSEClientStruct()` - Generate SSEClient struct at package level
- [x] `getRoutePath()` - Extract path from route annotations
- [x] Generate `http.ServeMux` setup
- [x] Generate route registration with `mux.HandleFunc()`
- [x] Generate `http.ListenAndServe()` call
- [x] Add required imports (`"net/http"`, `"fmt"`)

### 3.9 Go Writer - HTTP Handlers ✅
- [x] Detect `@(GET "/path")` on methods
- [x] Detect `@(POST "/path")` on methods  
- [x] Detect `@(SSE "/path")` on methods
- [x] Generate handler wrapper functions
- [x] Register routes in server start code

### 3.10 Go Writer - SSE Handlers ✅
- [x] Detect `@(SSE "/path")` on methods
- [x] Generate SSE boilerplate (flusher, headers)
- [x] Create `SSEClient` struct at package level
- [x] Handle client connection tracking

### 3.11 Test HTTP Server ✅
- [x] Create `tests/fixtures/http_server.rgr`
- [x] Compile to Go successfully
- [x] Run Go server - WORKING!
- [x] Test GET `/` endpoint - Returns nice HTML page
- [x] Test GET `/content` endpoint - Returns content

---

## Phase 4: EVG Watch Mode Server ✅ COMPLETE

### 4.1 Create EVG Preview Server ✅
- [x] Create `gallery/pdf_writer/src/tools/evg_preview_server.rgr`
- [x] Implement ComponentEngine integration for TSX parsing
- [x] Implement EVGHTMLRenderer for HTML generation
- [x] Implement EVGLayout for proper page dimensions
- [x] Add shell HTML endpoint (GET `/`)
- [x] Add content endpoint (GET `/content`)
- [x] Add font CSS endpoint (GET `/fonts.css`)
- [x] Add SSE events endpoint (GET `/events`)
- [x] Add asset serving endpoint (GET `/assets/`)

### 4.2 File Watching ✅
- [x] Add `file_mtime` operator to Lang.rgr (Go: os.Stat)
- [x] Implement file change detection via polling
- [x] Send SSE "reload" event on file change
- [x] Cache font CSS to avoid regeneration

### 4.3 Asset Serving ✅
- [x] Add `buffer_read_file` operator for binary file reading
- [x] Add `http_send_buffer` operator for sending binary data
- [x] Implement `/assets/` route for images and fonts
- [x] Transform image paths from `../assets/` to `/assets/`
- [x] Generate proper font-face CSS with server URLs

### 4.4 Live Reload ✅
- [x] SSE connection management
- [x] Automatic reload on file save
- [x] Font CSS served from server (not embedded)
- [x] Images served from server (not base64)

### 4.5 Package.json Scripts ✅
- [x] Add `evgpreview:compile` - Compile to Go
- [x] Add `evgpreview:build` - Compile + Go build
- [x] Add `evgpreview:start` - Run preview server
- [x] Add `evgpreview` - Build and start

### 4.6 Browser Auto-Open (TODO)
- [ ] Add `open_browser` operator to Lang.rgr
- [ ] Implement macOS support (`open` command)
- [ ] Implement Linux support (`xdg-open` command)
- [ ] Implement Windows support (`start` command)

### 4.7 Integration with evg_tool (TODO)
- [ ] Add `--watch` flag to evg_tool
- [ ] Add `--port` flag for server port
- [ ] Start preview server when --watch specified
- [ ] Connect file watcher to preview server
- [ ] Handle compilation errors gracefully

---

## Phase 5: Incremental Page Updates (Future Enhancement)

### 5.1 Diff-Based Page Loading
- [ ] Assign unique IDs to each Page element during rendering
- [ ] Store previous render content hash per page
- [ ] Compare page content hashes on re-render
- [ ] Send only changed pages via SSE with page index
- [ ] Client-side DOM patching for individual pages

### 5.2 Benefits
- Faster updates for large documents
- Preserved scroll position
- Reduced network traffic
- Smoother editing experience

### 5.3 Implementation Notes
```
SSE event format for incremental updates:
  event: page-update
  data: {"index": 5, "html": "<div class='evg-page'>...</div>"}

Client JS: Replace specific page div instead of full content
```

---

## Phase 6: Testing & Documentation

### 6.1 Test Fixtures ✅ PARTIAL
- [x] Create `tests/fixtures/http_server.rgr` - basic HTTP server
- [x] Create `gallery/pdf_writer/src/tools/evg_preview_server.rgr` - EVG preview server
- [ ] Create `tests/fixtures/http_sse.rgr` - SSE endpoint test
- [ ] Create `tests/fixtures/http_params.rgr` - path parameters

### 6.2 Test Cases
- [x] Test HTTP server compilation to Go
- [x] Test route generation
- [x] Test SSE endpoint generation
- [ ] Test path parameter handling
- [x] Test annotation parameter extraction
- [x] Test asset serving (images, fonts)

### 6.3 Documentation
- [ ] Update `gallery/pdf_writer/README.md` with new CLI
- [ ] Add watch mode examples
- [ ] Document HTTP server annotations
- [ ] Add examples to `/ai/EXAMPLES.md`

---

## Phase 7: AI Integration (Future)

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

### December 23, 2025 - Phase 4 Complete! 🎉
- **EVG Watch Mode Preview Server WORKING**
  - Live preview of TSX files with ComponentEngine
  - SSE-based live reload on file save
  - Asset serving for images and fonts via `/assets/` route
  - Proper layout calculation using EVGLayout
  - Multi-page document support (16+ pages tested)
  
- **New Operators Added to Lang.rgr**:
  - `file_mtime` - Get file modification time (Go: os.Stat)
  - `buffer_read_file` - Read file as binary buffer
  - `http_send_buffer` - Send binary buffer in HTTP response

- **EVGHTMLRenderer Updates**:
  - `transformImagePath()` - Convert `../assets/` paths to `/assets/`
  - `fontFamilyToFileName()` - Fixed font path mappings
  - Server-side font serving with proper folder structure

- **Usage**:
  ```bash
  npm run evgpreview:build
  cd gallery/pdf_writer && ./bin/evg_preview_server examples/test_gallery.tsx 3006
  # Open http://localhost:3006
  ```

### December 23, 2025 - Phase 3 Complete! 🎉
- **HTTP Server Language Extension WORKING**
  - Systemclasses: HttpRequest, HttpResponse, SSEClient, HttpServer
  - Operators: http_get_method, http_get_path, http_get_header, http_get_query, http_set_status, http_set_header, http_send
  - SSE operators: sse_send, sse_is_connected
  - Server operators: `start` and `stop` (custom operators for HttpServer type)
  
- **Key Implementation Details**:
  - Classes with `@(HttpServer)` annotation match HttpServer type via `isSystemclassType()` check
  - Route annotations use sibling syntax: `@(GET "/path")` where path is sibling to GET
  - `getFlagSiblingString()` helper extracts route paths from annotations
  - SSEClient struct written at package level using `wr.getTag("utilities")`
  - `http_set_status` uses `int()` cast for Go's WriteHeader

- **Test Server Running**:
  - `tests/fixtures/http_server.rgr` compiles to Go
  - Server runs on port 3000 with nice HTML landing page
  - GET `/` returns styled welcome page
  - GET `/content` returns dynamic content
  - SSE `/events` endpoint defined

### December 23, 2025 - Earlier
- Phase 1 COMPLETE: evg_tool.rgr created and tested
- Phase 2 COMPLETE: EVGHTMLRenderer partial rendering methods added
  - `renderContent()` - render without wrapper
  - `getUsedFonts()` - list of font families
  - `generateServerFontFaceCSS()` - @font-face for server
  - `setImageServer()` - set image server URL
  - `generateShellHTML()` - shell HTML for live preview

---

## Quick Commands

```bash
# Compile HTTP server to Go
RANGER_LIB=./compiler/Lang.rgr node bin/output.js -l=go ./tests/fixtures/http_server.rgr -d=./tests/fixtures/bin -o=http_server.go -nodecli

# Run HTTP server
cd tests/fixtures/bin && go run http_server.go

# Test endpoints
curl http://localhost:3000/
curl http://localhost:3000/content

# Compile evg_tool to Go
npm run evg:tool:compile:go

# Build Go executable
npm run evg:tool:build:go

# Run evg_tool
./gallery/pdf_writer/bin/evg_tool input.tsx output.html
```

## Annotation Syntax Reference

```ranger
; HTTP Server class - @(HttpServer) makes class match HttpServer type
class MyServer@(HttpServer) {
    
    ; GET endpoint - path is sibling to GET
    fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) {
        http_set_header res "Content-Type" "text/html"
        http_set_status res 200
        http_send res "<h1>Hello!</h1>"
    }
    
    ; POST endpoint
    fn handleCreate@(POST "/api/create"):void (req:HttpRequest res:HttpResponse) { }
    
    ; SSE endpoint - receives SSEClient instead of HttpResponse
    fn handleEvents@(SSE "/events"):void (client:SSEClient) {
        sse_send client "message" "Hello SSE!"
    }
}

sfn main@(main):void () {
    def server:MyServer (new MyServer())
    start server 3000  ; Start server on port 3000
}
```
