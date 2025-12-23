# Ranger HTTP Server Extension - Implementation Plan

## Overview

This document outlines the plan to extend Ranger with HTTP server capabilities, primarily targeting Go as the backend language. The immediate use case is the EVG tool's watch mode with live preview via Server-Sent Events (SSE).

## Goals

1. **Unified EVG Tool** - Merge `evg_component_tool` and `evg_html_tool` into single `evg_tool`
2. **Watch Mode** - File watching with automatic re-rendering
3. **Live Preview** - HTTP server with SSE for browser hot-reload
4. **Ranger HTTP Extension** - Language-level HTTP server support via annotations

---

## Ranger Language Considerations

Based on the AI documentation in `/ai/`, the following considerations apply when adding HTTP server features to Ranger:

### Annotation Syntax

Ranger uses the `@()` syntax for annotations, which are S-expressions. The HTTP extension will follow this pattern:

```ranger
; Existing annotation examples:
def x@(optional):string          ; optional value
def x@(mutable):int 0            ; mutable variable
sfn m@(main):void ()             ; entry point
cmdSleepMs@(async):void (ms:int) ; async operator

; Nested annotation example from Lang.rgr:
cmdAssign@(moves@( 2 1 )):void   ; annotation with sub-expression

; New HTTP annotations using S-expression syntax:
class MyServer@(HttpServer@(port 8080)) { }
fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) { }
fn handleEvents@(SSE "/events"):void (req:HttpRequest client:SSEClient) { }
```

### Accessing Annotation Parameters

Annotation values are accessed via the CodeNode API. For the nested syntax `@(HttpServer@(port 8080))`:

```ranger
; Given: class MyServer@(HttpServer@(port 8080)) { }
; The annotation is an S-expression stored in vref_annotation

if (node.hasFlag("HttpServer")) {
    def httpServerFlag:CodeNode (node.getFlag("HttpServer"))
    ; httpServerFlag.vref_annotation contains the sub-expression @(port 8080)
    if (httpServerFlag.has_vref_annotation) {
        def ann:CodeNode httpServerFlag.vref_annotation
        ; ann.children contains [port, 8080] as CodeNodes
        def portName:CodeNode (ann.getFirst())   ; "port" (vref)
        def portValue:CodeNode (ann.getSecond()) ; 8080 (int_value)
        def port:int portValue.int_value
    }
}
```

### Proposed Helper Methods for CodeNode

To simplify annotation parameter access, we could add these methods to `ng_CodeNode.rgr`:

```ranger
; Get flag's sub-annotation first value as int
; e.g., @(HttpServer@(port 8080)) → getFlagInt("HttpServer" "port" 3000) → 8080
fn getFlagInt:int (flagName:string paramName:string defaultValue:int) {
    if (false == has_vref_annotation) { return defaultValue }
    def flag:CodeNode (this.getFlag(flagName))
    if (null? flag) { return defaultValue }
    if (flag.has_vref_annotation) {
        def ann:CodeNode flag.vref_annotation
        for ann.children ch:CodeNode i {
            if (ch.vref == paramName) {
                ; Next child is the value
                if ((array_length ann.children) > (i + 1)) {
                    def valueNode:CodeNode (itemAt ann.children (i + 1))
                    return valueNode.int_value
                }
            }
        }
    }
    return defaultValue
}

; Get flag's sub-annotation first value as string
; e.g., @(GET "/path") → getFlagString("GET" "") → "/path"  
fn getFlagString:string (flagName:string defaultValue:string) {
    if (false == has_vref_annotation) { return defaultValue }
    def flag:CodeNode (this.getFlag(flagName))
    if (null? flag) { return defaultValue }
    ; For route annotations like @(GET "/path"), the path is first child
    if ((array_length flag.children) > 0) {
        def first:CodeNode (flag.getFirst())
        return first.string_value
    }
    return defaultValue
}

; Check if flag has a specific sub-parameter
; e.g., @(HttpServer@(port 8080 tls true)) → hasFlagParam("HttpServer" "tls") → true
fn hasFlagParam:boolean (flagName:string paramName:string) {
    if (false == has_vref_annotation) { return false }
    def flag:CodeNode (this.getFlag(flagName))
    if (null? flag) { return false }
    if (flag.has_vref_annotation) {
        def ann:CodeNode flag.vref_annotation
        for ann.children ch:CodeNode i {
            if (ch.vref == paramName) {
                return true
            }
        }
    }
    return false
}
```

### System Classes

HTTP classes will be defined as `systemclass` in `Lang.rgr` with target-specific mappings:

```ranger
systemclass HttpRequest {
    es6 HttpRequest
    go HttpRequest ((imp '"net/http"'))
}

systemclass HttpResponse {
    es6 HttpResponse  
    go HttpResponseWriter ((imp '"net/http"'))
}

systemclass SSEClient {
    es6 SSEClient
    go SSEClient
}
```

### Operator Templates

HTTP operators will need templates for each target language:

```ranger
operators {
    ; Send HTTP response
    http_send cmdHttpSend:void (res:HttpResponse body:string) {
        templates {
            go ( (e 1) ".Write([]byte(" (e 2) "))" nl )
            es6 ( (e 1) ".send(" (e 2) ")" nl )
            * ( "// http_send not implemented" nl )
        }
    }
    
    ; Set HTTP header
    http_set_header cmdHttpSetHeader:void (res:HttpResponse name:string value:string) {
        templates {
            go ( (e 1) ".Header().Set(" (e 2) ", " (e 3) ")" nl )
            es6 ( (e 1) ".setHeader(" (e 2) ", " (e 3) ")" nl )
            * ( "// http_set_header not implemented" nl )
        }
    }
    
    ; SSE send event
    sse_send cmdSSESend:void (client:SSEClient event:string data:string) {
        templates {
            go ( 
                "fmt.Fprintf(" (e 1) ".writer, \"event: %s\\ndata: %s\\n\\n\", " (e 2) ", " (e 3) ")" nl
                (e 1) ".flusher.Flush()" nl
                (imp '"fmt"')
            )
            es6 ( (e 1) ".send(" (e 2) ", " (e 3) ")" nl )
            * ( "// sse_send not implemented" nl )
        }
    }
}
```

### Polyfills for Complex Code

For complex HTTP handling code (like SSE client management), use `create_polyfill`:

```ranger
operators {
    http_server_start cmdHttpServerStart:void (server:HttpServer) {
        templates {
            go (
                (e 1) ".Start()" nl
                (create_polyfill "
// SSEClient represents a Server-Sent Events connection
type SSEClient struct {
    writer  http.ResponseWriter
    flusher http.Flusher
    done    chan bool
}

func (c *SSEClient) Send(event string, data string) {
    fmt.Fprintf(c.writer, \"event: %s\\ndata: %s\\n\\n\", event, data)
    c.flusher.Flush()
}
")
            )
        }
    }
}
```

### Async Considerations

For JavaScript target, HTTP handlers should be marked `@(async)` if they perform async operations:

```ranger
; Async handler for JavaScript
fn handleData@(GET "/data")@(async):void (req:HttpRequest res:HttpResponse) {
    def data:string (await fetchData())  ; async operation
    res.send(data)
}
```

### File Structure for Implementation

Based on the language addition guide, the HTTP extension requires changes to:

1. **`compiler/Lang.rgr`** - Add HTTP operators and system classes
2. **`compiler/ng_parser.rgr`** - Parse `@(HttpServer)`, `@(GET)`, `@(SSE)` annotations
3. **`compiler/ng_RangerGolangClassWriter.rgr`** - Generate Go HTTP server code
4. **`compiler/ng_RangerJavaScriptClassWriter.rgr`** - Generate Express.js code (future)
5. **`compiler/ng_LiveCompiler.rgr`** - Handle HTTP class generation

### Avoiding Circular References

Per the EVG implementation guidelines, HTTP server classes should avoid circular parent-child references:

```ranger
; GOOD: Use visitor pattern for request handling
class HttpServer {
    def handlers:[HttpHandler]
    
    fn handleRequest:void (req:HttpRequest res:HttpResponse) {
        ; Iterate handlers without circular refs
        for handlers handler:HttpHandler i {
            if (handler.matches(req)) {
                handler.handle(req res)
                return
            }
        }
    }
}
```

---

## Part 1: Unified EVG Tool

### Current State

```
evg_component_tool.rgr  → TSX → PDF (with components)
evg_html_tool.rgr       → TSX → HTML
evg_pdf_tool.rgr        → TSX → PDF (simple)
evg_png_tool.rgr        → TSX → PNG
```

### Target State

```
evg_tool.rgr            → TSX → PDF | HTML | PNG
                        → Watch mode with live preview
                        → HTTP server for development
```

### Command Line Interface

```bash
# Basic usage
evg_tool <input.tsx> [output] [options]

# Output formats (auto-detected from extension, or explicit)
evg_tool doc.tsx doc.pdf              # PDF output
evg_tool doc.tsx doc.html             # HTML output  
evg_tool doc.tsx doc.png              # PNG output
evg_tool doc.tsx --format=html        # Explicit format, stdout or default name

# Watch mode with live preview
evg_tool doc.tsx --watch              # Watch + serve HTML at localhost:3000
evg_tool doc.tsx --watch --port=8080  # Custom port

# Asset paths
evg_tool doc.tsx doc.pdf --assets="./fonts;./images;./components"

# Image options (PDF/PNG)
evg_tool doc.tsx doc.pdf --quality=85 --maxsize=1200

# PNG specific
evg_tool doc.tsx doc.png --scale=2    # 2x resolution

# Help
evg_tool --help
evg_tool -h
```

### Help Output

```
EVG Tool - Convert TSX documents to PDF, HTML, or PNG

USAGE:
    evg_tool <input.tsx> [output] [options]
    evg_tool --watch <input.tsx> [options]

FORMATS:
    .pdf        PDF document (default)
    .html       HTML document with CSS
    .png        PNG image

OPTIONS:
    -f, --format=FORMAT     Output format: pdf, html, png
    -w, --watch             Watch mode with live preview server
    -p, --port=PORT         Server port for watch mode (default: 3000)
    -a, --assets=PATHS      Asset directories (semicolon-separated)
    -q, --quality=N         JPEG quality 1-100 (default: 85)
    -m, --maxsize=N         Max image dimension in pixels (default: 1200)
    -s, --scale=N           PNG scale factor (default: 1)
    -e, --embed             Embed images as base64 (HTML)
    -t, --title=TEXT        HTML page title
    -d, --debug             Enable debug output
    -h, --help              Show this help message
    -v, --version           Show version

EXAMPLES:
    # Generate PDF
    evg_tool document.tsx output.pdf

    # Generate HTML with embedded images
    evg_tool document.tsx output.html --embed

    # Watch mode with live preview
    evg_tool document.tsx --watch --port=8080

    # With custom assets
    evg_tool document.tsx output.pdf --assets="./fonts;./images"

WATCH MODE:
    Opens a browser preview at http://localhost:PORT
    Automatically reloads when the TSX file changes
    Press Ctrl+C to stop

For more information, see: https://github.com/nickarora/Ranger
```

---

## Part 1.5: Live Preview Architecture (Revised)

### Design Principles for Fast Preview

The live preview system prioritizes speed and simplicity:

1. **HTML-first** - Focus on HTML preview, PDF can be generated separately
2. **Partial rendering** - Server sends document content, not full HTML page
3. **Assets via HTTP** - Fonts and images served from localhost, not embedded
4. **Quick updates** - Only re-render changed content, browser handles caching

### Architecture: Content-Only Rendering

Instead of generating complete HTML documents, the preview server renders just the document content:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Server (Go)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET /                    → Static shell HTML (cached)          │
│  GET /content             → Rendered document content (dynamic) │
│  GET /fonts/:name         → Font files (CSS @font-face)         │
│  GET /images/:path        → Image files (direct serving)        │
│  GET /events              → SSE stream (file change events)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Shell HTML (served once, cached)

The main HTML page is a static shell that loads content dynamically:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>EVG Preview</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #b0b0b0; 
            padding: 40px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
        }
        .evg-page-container {
            width: 595px;  /* Updated dynamically */
            height: 842px;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            position: relative;
            overflow: hidden;
        }
    </style>
    <!-- Font preloads injected here -->
    <link rel="preconnect" href="http://localhost:3000">
</head>
<body>
    <div class="evg-page-container" id="content">
        <!-- Document content loaded here -->
    </div>
    
    <script>
        // Load initial content
        fetch('/content').then(r => r.text()).then(html => {
            document.getElementById('content').innerHTML = html;
        });
        
        // SSE for live reload
        const evtSource = new EventSource('/events');
        evtSource.addEventListener('update', function(e) {
            fetch('/content').then(r => r.text()).then(html => {
                document.getElementById('content').innerHTML = html;
            });
        });
    </script>
</body>
</html>
```

### Content Response (dynamic)

The `/content` endpoint returns just the document elements (no html/head/body):

```html
<!-- Response from GET /content -->
<div style="position: absolute; left: 0px; top: 0px; width: 595px; height: 842px;">
    <div style="position: absolute; left: 30px; top: 30px; font-size: 32px;">
        Hello World
    </div>
    <img src="/images/photo.jpg" style="position: absolute; left: 30px; top: 100px; width: 200px;">
</div>
```

### Font Loading via HTTP

Fonts are loaded via CSS `@font-face` pointing to the server:

```css
/* Injected into shell HTML based on document requirements */
@font-face {
    font-family: 'Open Sans';
    src: url('/fonts/OpenSans-Regular.ttf') format('truetype');
    font-weight: 400;
}
@font-face {
    font-family: 'Open Sans';
    src: url('/fonts/OpenSans-Bold.ttf') format('truetype');
    font-weight: 700;
}
```

### Image Loading via HTTP

Images in the document use server paths:

```html
<!-- Before: embedded base64 or relative path -->
<img src="../assets/images/photo.jpg">

<!-- After: server-proxied path -->
<img src="/images/assets/images/photo.jpg">
```

### EVGHTMLRenderer Changes

Add new methods to EVGHTMLRenderer for partial rendering:

```ranger
class EVGHTMLRenderer {
    ; ... existing code ...
    
    ; Render just the document content (no html/head/body)
    fn renderContent:string (root:EVGElement) {
        ; Reset state
        elementCounter = 0
        
        ; Run layout
        layout.layout(root)
        
        ; Render content only
        return (this.renderElement(root 0))
    }
    
    ; Get list of fonts used in document
    fn getUsedFonts:[string] () {
        return usedFontFamilies
    }
    
    ; Generate CSS font-face rules pointing to server
    fn generateFontFaceCSS:string (serverUrl:string) {
        def css:string ""
        for usedFontFamilies fontFamily:string i {
            css = css + (this.generateServerFontFace(fontFamily serverUrl))
        }
        return css
    }
    
    ; Transform image paths to server paths
    fn setImageServer:void (serverUrl:string) {
        imageBasePath = serverUrl + "/images/"
    }
}
```

### Benefits of This Architecture

1. **Fast updates** - Only content changes, not full page reload
2. **Browser caching** - Shell HTML, fonts, and images cached by browser
3. **Simple SSE** - Just send "update" event, browser fetches new content
4. **No embedding** - Assets served directly, faster initial load
5. **Easy debugging** - Can inspect network requests in browser DevTools

---

## Part 2: Watch Mode Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         evg_tool                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐│
│  │ File Watcher │──▶│ TSX Compiler │──▶│ HTML Renderer        ││
│  │  (FSEvents)  │   │  (JSXToEVG)  │   │ (EVGHTMLRenderer)    ││
│  └──────────────┘   └──────────────┘   └──────────────────────┘│
│         │                                        │              │
│         ▼                                        ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    HTTP Server                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ GET /       │  │ GET /events │  │ GET /assets/*   │   │  │
│  │  │ (HTML page) │  │ (SSE stream)│  │ (static files)  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Browser                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  <script>                                                 │  │
│  │    const evtSource = new EventSource('/events');          │  │
│  │    evtSource.onmessage = (e) => {                        │  │
│  │      if (e.data === 'reload') location.reload();         │  │
│  │    };                                                     │  │
│  │  </script>                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### SSE Client Script (injected into HTML)

```javascript
// Auto-injected by evg_tool in watch mode
(function() {
  const evtSource = new EventSource('http://localhost:${PORT}/events');
  
  evtSource.addEventListener('reload', function(e) {
    console.log('EVG: Reloading page...');
    location.reload();
  });
  
  evtSource.addEventListener('error', function(e) {
    console.log('EVG: Connection lost, retrying...');
  });
  
  evtSource.onopen = function() {
    console.log('EVG: Connected to live preview server');
  };
})();
```

---

## Part 3: Ranger HTTP Server Extension

### Design Principles

1. **Annotation-based** - Use `@()` syntax for HTTP configuration
2. **Class-based** - HTTP server is a class with handler methods annotated with `@(GET)`, `@(POST)`, `@(SSE)`, etc.
3. **Operator-based** - HTTP operations use operators, not method calls
4. **S-expression style** - Annotations use Ranger's native S-expression syntax
5. **Opinionated** - Single default approach per target language
6. **Extensible** - Future options for different frameworks

### Syntax Design (S-expression Style)

Following Ranger's existing annotation patterns (like `@(moves@( 2 1 ))`), HTTP annotations use nested S-expressions:

```ranger
; HTTP Server class - recommended syntax with named parameter
class MyServer@(HttpServer@(port 8080)) {
    
    ; Instance state
    def clients:[SSEClient]
    def documentHtml:string ""
    
    ; GET endpoint - path is first argument in annotation
    fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) {
        http_set_header(res "Content-Type" "text/html")
        http_send(res documentHtml)
    }
    
    ; GET with path parameter - :path captures the URL segment
    fn handleAsset@(GET "/assets/:path"):void (req:HttpRequest res:HttpResponse) {
        def path:string (http_get_param(req "path"))
        def content:charbuffer (read_file_buffer(path))
        http_send_file(res content)
    }
    
    ; Server-Sent Events endpoint
    fn handleEvents@(SSE "/events"):void (req:HttpRequest client:SSEClient) {
        push clients client
        ; Client automatically removed on disconnect
    }
    
    ; POST endpoint with JSON body
    fn handleUpdate@(POST "/update"):void (req:HttpRequest res:HttpResponse) {
        def body:string (http_get_body(req))
        ; Process update...
        http_json(res responseData)
    }
    
    ; Broadcast to all SSE clients (regular method, no HTTP annotation)
    fn notifyReload:void () {
        for clients client:SSEClient i {
            sse_send(client "reload" "")
        }
    }
    
    ; Lifecycle hook: called after server starts
    fn onStart@(ServerStart):void () {
        print ("Server started on port 8080")
    }
}
```

### System Classes (Lang.rgr additions)

```ranger
; HTTP Request object - type declaration only
systemclass HttpRequest {
    es6 HttpRequest
    go "*http.Request" ((imp '"net/http"'))
}

; HTTP Response object - type declaration only
systemclass HttpResponse {
    es6 HttpResponse
    go "http.ResponseWriter" ((imp '"net/http"'))
}

; Server-Sent Events client - type declaration only
systemclass SSEClient {
    es6 SSEClient
    go "*SSEClient"
}

; HTTP Server control - type declaration only  
systemclass HttpServer {
    es6 HttpServer
    go "*http.Server" ((imp '"net/http"'))
}
```

### HTTP Operators (Lang.rgr additions)

Methods on system classes are implemented as operators:

```ranger
operators {
    ; ============ HttpRequest operators ============
    
    http_get_method cmdHttpGetMethod:string (req:HttpRequest) {
        templates {
            go ( (e 1) ".Method" )
            es6 ( (e 1) ".method" )
        }
    }
    
    http_get_path cmdHttpGetPath:string (req:HttpRequest) {
        templates {
            go ( (e 1) ".URL.Path" )
            es6 ( (e 1) ".path" )
        }
    }
    
    http_get_param cmdHttpGetParam:string (req:HttpRequest name:string) {
        templates {
            go ( (e 1) ".PathValue(" (e 2) ")" )
            es6 ( (e 1) ".params[" (e 2) "]" )
        }
    }
    
    http_get_query cmdHttpGetQuery:string (req:HttpRequest name:string) {
        templates {
            go ( (e 1) ".URL.Query().Get(" (e 2) ")" )
            es6 ( (e 1) ".query[" (e 2) "]" )
        }
    }
    
    http_get_header cmdHttpGetHeader:string (req:HttpRequest name:string) {
        templates {
            go ( (e 1) ".Header.Get(" (e 2) ")" )
            es6 ( (e 1) ".get(" (e 2) ")" )
        }
    }
    
    http_get_body cmdHttpGetBody:string (req:HttpRequest) {
        templates {
            go ( 
                "func() string { b, _ := io.ReadAll(" (e 1) ".Body); return string(b) }()"
                (imp '"io"')
            )
            es6 ( (e 1) ".body" )
        }
    }
    
    ; ============ HttpResponse operators ============
    
    http_set_status cmdHttpSetStatus:void (res:HttpResponse code:int) {
        templates {
            go ( (e 1) ".WriteHeader(" (e 2) ")" nl )
            es6 ( (e 1) ".status(" (e 2) ")" nl )
        }
    }
    
    http_set_header cmdHttpSetHeader:void (res:HttpResponse name:string value:string) {
        templates {
            go ( (e 1) ".Header().Set(" (e 2) ", " (e 3) ")" nl )
            es6 ( (e 1) ".setHeader(" (e 2) ", " (e 3) ")" nl )
        }
    }
    
    http_send cmdHttpSend:void (res:HttpResponse body:string) {
        templates {
            go ( (e 1) ".Write([]byte(" (e 2) "))" nl )
            es6 ( (e 1) ".send(" (e 2) ")" nl )
        }
    }
    
    http_send_file cmdHttpSendFile:void (res:HttpResponse content:charbuffer) {
        templates {
            go ( (e 1) ".Write(" (e 2) ")" nl )
            es6 ( (e 1) ".send(Buffer.from(" (e 2) "))" nl )
        }
    }
    
    http_json cmdHttpJson:void (res:HttpResponse data:DictNode) {
        templates {
            go ( 
                (e 1) ".Header().Set(\"Content-Type\", \"application/json\")" nl
                "json.NewEncoder(" (e 1) ").Encode(" (e 2) ")" nl
                (imp '"encoding/json"')
            )
            es6 ( (e 1) ".json(" (e 2) ")" nl )
        }
    }
    
    http_redirect cmdHttpRedirect:void (res:HttpResponse req:HttpRequest url:string) {
        templates {
            go ( "http.Redirect(" (e 1) ", " (e 2) ", " (e 3) ", http.StatusFound)" nl )
            es6 ( (e 1) ".redirect(" (e 3) ")" nl )
        }
    }
    
    ; ============ SSEClient operators ============
    
    sse_send cmdSSESend:void (client:SSEClient event:string data:string) {
        templates {
            go ( 
                "fmt.Fprintf(" (e 1) ".writer, \"event: %s\\ndata: %s\\n\\n\", " (e 2) ", " (e 3) ")" nl
                (e 1) ".flusher.Flush()" nl
                (imp '"fmt"')
            )
            es6 ( (e 1) ".send(" (e 2) ", " (e 3) ")" nl )
        }
    }
    
    sse_close cmdSSEClose:void (client:SSEClient) {
        templates {
            go ( "close(" (e 1) ".done)" nl )
            es6 ( (e 1) ".close()" nl )
        }
    }
    
    sse_is_connected cmdSSEIsConnected:boolean (client:SSEClient) {
        templates {
            go ( (e 1) ".isConnected" )
            es6 ( (e 1) ".isConnected()" )
        }
    }
    
    ; ============ HttpServer operators ============
    
    http_server_start cmdHttpServerStart:void (server:HttpServer) {
        templates {
            go ( (e 1) ".ListenAndServe()" nl )
            es6 ( (e 1) ".listen()" nl )
        }
    }
    
    http_server_stop cmdHttpServerStop:void (server:HttpServer) {
        templates {
            go ( (e 1) ".Shutdown(context.Background())" nl (imp '"context"') )
            es6 ( (e 1) ".close()" nl )
        }
    }
}
```

### Usage Example

With the operators defined, HTTP handling in Ranger looks like:

```ranger
fn handleIndex@(GET "/"):void (req:HttpRequest res:HttpResponse) {
    ; Use operators instead of method calls
    http_set_header(res "Content-Type" "text/html")
    http_send(res "<h1>Hello World</h1>")
}

fn handleApi@(GET "/api/user/:id"):void (req:HttpRequest res:HttpResponse) {
    def userId:string (http_get_param(req "id"))
    def accept:string (http_get_header(req "Accept"))
    
    ; ... build response data ...
    
    http_json(res responseData)
}

fn handleEvents@(SSE "/events"):void (req:HttpRequest client:SSEClient) {
    ; SSE client is managed by the framework
    sse_send(client "connected" "true")
}
```

### Annotation Reference (S-expression Syntax)

| Annotation | Target | Description | Example |
|------------|--------|-------------|---------|
| `@(HttpServer@(port N))` | class | HTTP server on port N | `@(HttpServer@(port 8080))` |
| `@(GET "/path")` | method | HTTP GET endpoint | `@(GET "/users")` |
| `@(POST "/path")` | method | HTTP POST endpoint | `@(POST "/api/data")` |
| `@(PUT "/path")` | method | HTTP PUT endpoint | `@(PUT "/users/:id")` |
| `@(DELETE "/path")` | method | HTTP DELETE endpoint | `@(DELETE "/users/:id")` |
| `@(SSE "/path")` | method | Server-Sent Events | `@(SSE "/events")` |
| `@(ServerStart)` | method | Called on server start | `@(ServerStart)` |
| `@(ServerStop)` | method | Called on server stop | `@(ServerStop)` |

### Path Parameters

Path parameters use `:param` syntax in routes. These examples show handler methods inside an `@(HttpServer)` annotated class:

```ranger
class ApiServer@(HttpServer@(port 8080)) {
    
    ; Path with single parameter
    fn handleUser@(GET "/users/:id"):void (req:HttpRequest res:HttpResponse) {
        def userId:string (http_get_param(req "id"))
        ; ... fetch user by id ...
        http_json(res userData)
    }
    
    ; Multiple parameters
    fn handleFile@(GET "/files/:category/:name"):void (req:HttpRequest res:HttpResponse) {
        def category:string (http_get_param(req "category"))
        def name:string (http_get_param(req "name"))
        ; ... serve file ...
        http_send(res fileContent)
    }
    
    ; Wildcard path (captures rest of path)
    fn handleStatic@(GET "/static/*path"):void (req:HttpRequest res:HttpResponse) {
        def filePath:string (http_get_param(req "path"))
        def content:charbuffer (read_file_buffer(filePath))
        http_send_file(res content)
    }
}
```

---

## Part 4: Target Language Implementations

### Go Implementation

The Go writer (`ng_RangerGolangClassWriter.rgr`) will be extended to:

1. **Detect `@(HttpServer)` annotation** on class definitions
2. **Generate route registration** using `http.ServeMux` for methods with `@(GET)`, `@(POST)`, `@(SSE)` annotations
3. **Add HTTP handler wrappers** that convert Ranger method signatures to Go's `http.Handler` pattern
4. **Generate SSE boilerplate** for `@(SSE)` endpoints (flusher setup, keep-alive headers, client tracking)
5. **Create `Start()` method** that initializes routes and starts the server

The exact Go output will follow Ranger's existing code generation patterns (e.g., `CreateNew_ClassName()` constructors, struct fields with JSON tags, etc.). The HTTP-specific code will be injected via operator templates and polyfills.

**Key Go packages used:**
- `net/http` - HTTP server and handlers
- `fmt` - SSE event formatting
- `context` - Graceful shutdown (optional)

### JavaScript (ES6) Implementation

For future JavaScript target, the writer will generate Express.js-based servers:

1. **Generate Express app setup** in constructor
2. **Register routes** in `start()` method
3. **Handle SSE** with response streaming

The JavaScript implementation is lower priority since the initial use case (EVG tool) targets Go for better performance.

---

## Part 5: Implementation Plan

### Phase 1: Unified EVG Tool (Week 1)

1. **Create `evg_tool.rgr`**
   - Merge functionality from all existing tools
   - Implement command-line argument parsing
   - Add format auto-detection
   - Generate help text

2. **Update `package.json`**
   - Add `npm run evg:compile`
   - Add `npm run evg:run`
   - Deprecate old individual tool scripts

### Phase 2: File Watching (Week 1-2)

1. **Add file system watching to Lang.rgr**
   ```ranger
   ; File watcher operator
   watch_file cmdWatchFile:void (path:string callback:(fn:void (path:string))) {
       templates {
           go (
               "go func() {" nl I
               "watcher, _ := fsnotify.NewWatcher()" nl
               "watcher.Add(" (e 1) ")" nl
               "for event := range watcher.Events {" nl I
               "if event.Op&fsnotify.Write == fsnotify.Write {" nl I
               (block 2) nl
               i "}" nl
               i "}" nl
               i "}()" nl
               (imp '"github.com/fsnotify/fsnotify"')
           )
           es6 (
               "const fs = require('fs');" nl
               "fs.watch(" (e 1) ", (eventType, filename) => {" nl I
               "if (eventType === 'change') {" nl I
               (block 2) nl
               i "}" nl
               i "});" nl
           )
       }
   }
   ```

2. **Implement in Go runtime**
   - Use `fsnotify` package for cross-platform watching

3. **Add to evg_tool**
   - Watch input file and imported components
   - Re-render on changes

### Phase 3: HTTP Server Extension (Week 2-3)

1. **Update Lang.rgr**
   - Add `HttpRequest`, `HttpResponse`, `SSEClient` system classes
   - Add HTTP-related operators

2. **Update Ranger Parser (`ng_parser.rgr`)**
   - Recognize `@(HttpServer)`, `@(GET)`, `@(POST)`, `@(SSE)` annotations
   - Store annotations in AST node's `annotation_map`
   
   ```ranger
   ; In ng_parser.rgr, extend annotation parsing
   ; Current annotations: @(main), @(optional), @(mutable), @(async), etc.
   ; Add: @(HttpServer), @(GET path), @(POST path), @(SSE path)
   
   ; Annotation format: @(name key=value key2=value2)
   ; Example: @(HttpServer port=8080)
   ; Example: @(GET "/api/users")
   ```

3. **Update Go Writer (`ng_RangerGolangClassWriter.rgr`)**
   - Detect `@(HttpServer)` annotation on class
   - Generate HTTP server boilerplate
   - Generate route registration
   - Handle SSE endpoint generation

   ```ranger
   ; In writeClass method, check for HttpServer annotation
   if (has node.annotation_map "HttpServer") {
       this.writeHttpServerClass(node ctx wr)
   }
   ```

4. **Create HTTP Handler Generation**
   ```ranger
   fn writeHttpHandler:void (method:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
       ; Check for HTTP method annotation
       if (has method.node.annotation_map "GET") {
           def path:string (get method.node.annotation_map "GET")
           wr.out("mux.HandleFunc(\"" + path + "\", s." + method.name + ")" false)
           wr.newline()
       }
       ; Similar for POST, PUT, DELETE, SSE
   }
   ```

### Phase 4: EVG Watch Mode Server (Week 3)

1. **Create EVG preview server class**
   ```ranger
   class EVGPreviewServer@(HttpServer port=3000) {
       def currentHtml:string ""
       def watchPath:string ""
       def clients:[SSEClient]
       
       fn handlePreview@(GET "/"):void (req:HttpRequest res:HttpResponse) {
           http_set_header(res "Content-Type" "text/html")
           http_send(res currentHtml)
       }
       
       fn handleEvents@(SSE "/events"):void (req:HttpRequest client:SSEClient) {
           push clients client
       }
       
       fn handleAssets@(GET "/assets/*"):void (req:HttpRequest res:HttpResponse) {
           def path:string (http_get_param(req "*"))
           def content:charbuffer (read_file_buffer(watchPath path))
           http_send_file(res content)
       }
       
       fn notifyReload:void () {
           for clients client:SSEClient i {
               sse_send(client "reload" "")
           }
       }
       
       fn onFileChange:void (path:string) {
           this.renderDocument()
           this.notifyReload()
       }
       
       fn renderDocument:void () {
           ; Re-parse and render TSX to HTML
           def parser (new JSXToEVG)
           def root:EVGElement (parser.parseFile(watchPath))
           def renderer (new EVGHTMLRenderer)
           currentHtml = (renderer.render(root))
           ; Inject SSE client script
           currentHtml = (this.injectSSEScript(currentHtml))
       }
       
       fn injectSSEScript:string (html:string) {
           def script:string "
<script>
(function() {
    const evtSource = new EventSource('/events');
    evtSource.addEventListener('reload', () => location.reload());
    evtSource.onopen = () => console.log('EVG: Connected to preview server');
})();
</script>
"
           ; Insert before </body>
           return (str_replace(html "</body>" (script + "</body>")))
       }
   }
   ```

2. **Inject SSE client script into HTML**
   - Modify `EVGHTMLRenderer` to add script in watch mode

3. **Auto-open browser**
   ```ranger
   ; Open browser operator
   open_browser cmdOpenBrowser:void (url:string) {
       templates {
           go (
               "exec.Command(\"open\", " (e 1) ").Start()" nl  ; macOS
               (imp '"os/exec"')
           )
           es6 (
               "require('child_process').exec('open ' + " (e 1) ")" nl
           )
       }
   }
   ```

### Phase 5: Testing & Documentation (Week 4)

1. **Test watch mode**
   - Multiple file changes
   - Component imports
   - Error recovery

2. **Update documentation**
   - README.md with new CLI
   - Examples for watch mode

3. **Add tests to `tests/` folder**
   ```typescript
   // tests/http-server.test.ts
   describe('HTTP Server Extension', () => {
       it('should generate Go HTTP server from annotated class', () => {
           const { compile } = compileRangerToGo('fixtures/http_server.rgr');
           expect(compile.success).toBe(true);
           expect(compile.output).toContain('http.HandleFunc');
       });
   });
   ```

---

## Part 6: File Structure

### New/Modified Files

```
Ranger/
├── compiler/
│   ├── Lang.rgr                    # Add HTTP system classes
│   ├── ng_parser.rgr               # Parse HTTP annotations
│   ├── ng_RangerGolangClassWriter.rgr  # Generate Go HTTP code
│   └── ng_RangerJavaScriptClassWriter.rgr  # Future: Express code
│
├── gallery/pdf_writer/
│   ├── src/tools/
│   │   ├── evg_tool.rgr           # NEW: Unified tool
│   │   ├── evg_preview_server.rgr # NEW: Watch mode server
│   │   ├── evg_component_tool.rgr # DEPRECATED
│   │   ├── evg_html_tool.rgr      # DEPRECATED
│   │   ├── evg_pdf_tool.rgr       # DEPRECATED
│   │   └── evg_png_tool.rgr       # DEPRECATED
│   │
│   └── bin/
│       └── evg_tool.js            # Compiled unified tool
│
├── PLAN_HTTP.md                   # This document
└── TODO_EVG.md                    # Updated with HTTP tasks
```

---

## Part 7: Future Extensions

### Framework Options (Future)

```bash
# Future: Specify JavaScript framework
evg_tool doc.tsx --watch --target=javascript:express
evg_tool doc.tsx --watch --target=javascript:fastify
evg_tool doc.tsx --watch --target=javascript:bun

# Future: Specify Go framework  
evg_tool doc.tsx --watch --target=go:stdlib
evg_tool doc.tsx --watch --target=go:gin
evg_tool doc.tsx --watch --target=go:fiber
```

### Additional HTTP Features (Future)

- **Middleware support**: `@(Middleware auth)`
- **WebSocket support**: `@(WebSocket "/ws")`
- **Static file serving**: `@(Static "/public" "./static")`
- **CORS configuration**: `@(HttpServer cors="*")`
- **TLS/HTTPS**: `@(HttpServer tls cert="..." key="...")`

### Ranger HTTP Client (Future)

```ranger
; HTTP client for making requests
def client:HttpClient (HttpClient.new())
def response:HttpClientResponse (client.get("https://api.example.com/data"))
def body:string (response.getBody())
def json:DictNode (response.getJson())
```

### AI-Assisted Document Editing (Future)

A compelling extension would be integrating AI assistants (ChatGPT, Claude, etc.) directly into the EVG preview workflow. This would enable interactive document editing where users can request changes via natural language.

#### Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVG Preview (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Rendered Document Preview                    │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────┐    │  │
│  │   │  [Page 1 content...]                            │    │  │
│  │   └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🤖 AI Assistant                                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ "Add a blue header with the title 'Q3 Report'"     │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  [Send] [Clear]                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                                    ▲
         ▼                                    │
┌─────────────────────────────────────────────────────────────────┐
│                       evg_tool Server                            │
│  ┌────────────┐    ┌────────────┐    ┌────────────────────┐    │
│  │ POST /ai   │───▶│ AI Client  │───▶│ Update TSX file    │    │
│  │            │    │ (OpenAI)   │    │ (write to disk)    │    │
│  └────────────┘    └────────────┘    └────────────────────┘    │
│                                              │                  │
│                                              ▼                  │
│                                       File Watcher triggers     │
│                                       re-render + SSE reload    │
└─────────────────────────────────────────────────────────────────┘
```

#### Configuration File (ai.config.json)

```json
{
  "provider": "openai",
  "model": "gpt-4",
  "apiKey": "${OPENAI_API_KEY}",
  "systemPrompt": "You are an EVG document editor. When asked to modify the document, respond with the complete updated TSX code.",
  "context": {
    "includeComponents": true,
    "includeImages": true,
    "includeCurrentDocument": true
  }
}
```

#### Ranger AI System Classes (Future)

```ranger
; AI client configuration - type declaration only
systemclass AIConfig {
    es6 AIConfig
    go "*AIConfig"
}

; AI response - type declaration only
systemclass AIResponse {
    es6 AIResponse
    go "*AIResponse"
}
```

#### AI Operators (Future)

```ranger
operators {
    ; Load AI configuration from JSON file
    ai_load_config cmdAILoadConfig:AIConfig (path:string) {
        templates {
            go ( "LoadAIConfig(" (e 1) ")" )
            es6 ( "loadAIConfig(" (e 1) ")" )
        }
    }
    
    ; Send prompt to AI with context
    ai_send cmdAISend:AIResponse (config:AIConfig prompt:string context:string) {
        templates {
            go ( "SendToAI(" (e 1) ", " (e 2) ", " (e 3) ")" )
            es6 ( "await sendToAI(" (e 1) ", " (e 2) ", " (e 3) ")" )
        }
    }
    
    ; Get response text
    ai_get_response cmdAIGetResponse:string (response:AIResponse) {
        templates {
            go ( (e 1) ".Text" )
            es6 ( (e 1) ".text" )
        }
    }
    
    ; Extract code block from response
    ai_extract_code cmdAIExtractCode:string (response:AIResponse language:string) {
        templates {
            go ( "ExtractCodeBlock(" (e 1) ", " (e 2) ")" )
            es6 ( "extractCodeBlock(" (e 1) ", " (e 2) ")" )
        }
    }
}
```

#### Preview Server with AI (Future)

```ranger
class EVGPreviewServer@(HttpServer port=3000) {
    def currentHtml:string ""
    def tsxPath:string ""
    def aiConfig:AIConfig
    def clients:[SSEClient]
    
    ; ... existing handlers ...
    
    ; AI chat endpoint
    fn handleAI@(POST "/ai"):void (req:HttpRequest res:HttpResponse) {
        def body:string (http_get_body(req))
        def prompt:string (json_get_string(body "prompt"))
        
        ; Build context with current TSX and available components
        def context:string (this.buildAIContext())
        
        ; Send to AI
        def response:AIResponse (ai_send(aiConfig prompt context))
        def newTsx:string (ai_extract_code(response "tsx"))
        
        ; Write updated TSX to file
        if ((strlen(newTsx)) > 0) {
            write_file(tsxPath newTsx)
            ; File watcher will trigger re-render
        }
        
        ; Return AI response
        http_json(res { "success": true, "response": (ai_get_response(response)) })
    }
    
    fn buildAIContext:string () {
        def context:StringBuilder (new StringBuilder)
        
        ; Add current document
        context.append("## Current Document (TSX)\n```tsx\n")
        context.append((read_file(tsxPath)))
        context.append("\n```\n\n")
        
        ; Add available components
        context.append("## Available Components\n")
        ; ... list components from components directory ...
        
        ; Add available images
        context.append("## Available Images\n")
        ; ... list images from assets directory ...
        
        return (context.toString())
    }
}
```

#### Injected AI Chat UI (Future)

```javascript
// Auto-injected in watch mode with AI enabled
(function() {
  const chatUI = document.createElement('div');
  chatUI.innerHTML = `
    <div id="evg-ai-panel" style="position:fixed; bottom:20px; right:20px; 
         width:400px; background:#1a1a2e; border-radius:12px; 
         box-shadow:0 4px 20px rgba(0,0,0,0.3); font-family:system-ui;">
      <div style="padding:12px; border-bottom:1px solid #333; color:#fff;">
        🤖 AI Assistant
      </div>
      <div id="evg-ai-messages" style="height:200px; overflow-y:auto; padding:12px;">
      </div>
      <div style="padding:12px; border-top:1px solid #333;">
        <textarea id="evg-ai-input" placeholder="Describe changes..." 
                  style="width:100%; height:60px; background:#16213e; 
                         border:none; border-radius:8px; color:#fff; 
                         padding:8px; resize:none;"></textarea>
        <button onclick="evgSendToAI()" 
                style="margin-top:8px; padding:8px 16px; background:#4361ee; 
                       color:#fff; border:none; border-radius:6px; cursor:pointer;">
          Send
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(chatUI);
  
  window.evgSendToAI = async function() {
    const input = document.getElementById('evg-ai-input');
    const prompt = input.value.trim();
    if (!prompt) return;
    
    // Add user message to chat
    addMessage('user', prompt);
    input.value = '';
    
    // Send to server
    const response = await fetch('/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    const data = await response.json();
    addMessage('ai', data.response);
    // SSE will trigger page reload when TSX is updated
  };
  
  function addMessage(role, text) {
    const messages = document.getElementById('evg-ai-messages');
    const msg = document.createElement('div');
    msg.style.cssText = `margin:8px 0; padding:8px; border-radius:8px; 
                         background:${role === 'user' ? '#4361ee' : '#16213e'}; 
                         color:#fff;`;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }
})();
```

#### CLI Integration (Future)

```bash
# Enable AI assistant in watch mode
evg_tool doc.tsx --watch --ai

# Specify AI config file
evg_tool doc.tsx --watch --ai --ai-config=./ai.config.json

# Use specific AI provider
evg_tool doc.tsx --watch --ai --ai-provider=openai --ai-model=gpt-4
```

#### Implementation Notes

This feature would require:
1. **AI client polyfills** for Go (OpenAI SDK) and JavaScript (openai npm package)
2. **Secure API key handling** via environment variables
3. **Context management** to include relevant document info without exceeding token limits
4. **Response parsing** to extract TSX code blocks from AI responses
5. **Error handling** for AI API failures, rate limits, etc.

This is a significant feature that should be implemented **after** the core HTTP server and watch mode are stable.

---

## Summary

This plan provides a roadmap for:

1. **Immediate**: Unified `evg_tool` with better CLI
2. **Short-term**: Watch mode with file system events
3. **Medium-term**: HTTP server extension for Ranger
4. **Long-term**: Framework-agnostic HTTP abstraction
5. **Future**: AI-assisted document editing via chat interface

The HTTP server extension uses Ranger's existing `@()` annotation syntax to provide a clean, declarative way to define HTTP endpoints, with Go as the primary target language and JavaScript/Express as a future option.

The AI integration vision transforms EVG from a static document generator into an interactive editing environment where users can describe changes in natural language and see them applied in real-time.

---

*Created: December 23, 2025*
*Status: Planning*

---

## Appendix: Compiler Changes Checklist

Based on the Ranger language conventions in `/ai/ADDING_NEW_LANGUAGE.md` and `/ai/INSTRUCTIONS.md`, implementing HTTP server support requires:

### Lang.rgr Changes

- [ ] Add `HttpRequest` systemclass with target mappings
- [ ] Add `HttpResponse` systemclass with target mappings
- [ ] Add `SSEClient` systemclass with target mappings
- [ ] Add `http_send` operator with Go/ES6 templates
- [ ] Add `http_set_header` operator with Go/ES6 templates
- [ ] Add `http_send_file` operator with Go/ES6 templates
- [ ] Add `sse_send` operator with Go/ES6 templates
- [ ] Add `http_server_start` operator with polyfills
- [ ] Add `watch_file` operator with Go/ES6 templates
- [ ] Add `open_browser` operator with Go/ES6 templates

### Parser Changes (ng_parser.rgr)

- [ ] Extend annotation parsing to handle `@(HttpServer key=value)`
- [ ] Store HTTP route annotations in `annotation_map`
- [ ] Parse path parameters in route annotations (`:param`, `*wildcard`)

### Go Writer Changes (ng_RangerGolangClassWriter.rgr)

- [ ] Detect `@(HttpServer)` on class definition
- [ ] Generate `http.ServeMux` setup code
- [ ] Generate handler function wrappers for `@(GET)`, `@(POST)`, etc.
- [ ] Generate SSE endpoint code for `@(SSE)` methods
- [ ] Add required imports (`"net/http"`, `"fmt"`)

### JavaScript Writer Changes (ng_RangerJavaScriptClassWriter.rgr) - Future

- [ ] Detect `@(HttpServer)` on class definition
- [ ] Generate Express.js app setup
- [ ] Generate route handlers
- [ ] Generate SSE endpoint code

### Test Fixtures

- [ ] Create `tests/fixtures/http_server.rgr` - basic HTTP server
- [ ] Create `tests/fixtures/http_sse.rgr` - SSE endpoint
- [ ] Create `tests/fixtures/http_params.rgr` - path parameters
- [ ] Add test cases to `tests/compiler-go.test.ts`

### EVG Tool Changes

- [ ] Create `gallery/pdf_writer/src/tools/evg_tool.rgr`
- [ ] Implement argument parsing with help text
- [ ] Implement format detection from output extension
- [ ] Implement `--watch` mode with file watching
- [ ] Create `EVGPreviewServer` class for live preview
- [ ] Add SSE script injection to `EVGHTMLRenderer`
- [ ] Update `package.json` with new npm scripts

### Documentation

- [ ] Update `gallery/pdf_writer/README.md` with new CLI
- [ ] Add HTTP server examples to `/ai/EXAMPLES.md`
- [ ] Update this plan with progress notes
