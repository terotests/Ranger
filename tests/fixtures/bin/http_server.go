package main
import (
  "net/http"
  "fmt"
  "log"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

// SSEClient represents a Server-Sent Events client connection
type SSEClient struct {
  Writer      http.ResponseWriter
  Flusher     http.Flusher
  Request     *http.Request
  IsConnected bool
  done        chan bool
}
type TestServer struct { 
  name string `json:"name"` 
}

func CreateNew_TestServer() *TestServer {
  me := new(TestServer)
  me.name = "Test Server"
  return me;
}
func (this *TestServer) handleIndex (req *http.Request, res http.ResponseWriter) () {
  /** unused:  method*/
  /** unused:  path*/
  res.Header().Set("Content-Type", "text/html")
  res.WriteHeader(int(int64(200)))
  res.Write([]byte("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Ranger HTTP Server</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;\n            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);\n            min-height: 100vh;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            color: #fff;\n        }\n        .container {\n            text-align: center;\n            padding: 3rem;\n            background: rgba(255, 255, 255, 0.05);\n            border-radius: 20px;\n            backdrop-filter: blur(10px);\n            border: 1px solid rgba(255, 255, 255, 0.1);\n            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);\n            max-width: 600px;\n        }\n        .logo {\n            font-size: 4rem;\n            margin-bottom: 1rem;\n        }\n        h1 {\n            font-size: 2.5rem;\n            margin-bottom: 0.5rem;\n            background: linear-gradient(90deg, #e94560, #ff6b6b, #feca57);\n            -webkit-background-clip: text;\n            -webkit-text-fill-color: transparent;\n            background-clip: text;\n        }\n        .subtitle {\n            color: #8892b0;\n            font-size: 1.1rem;\n            margin-bottom: 2rem;\n        }\n        .status {\n            display: inline-flex;\n            align-items: center;\n            gap: 0.5rem;\n            background: rgba(46, 213, 115, 0.1);\n            color: #2ed573;\n            padding: 0.5rem 1rem;\n            border-radius: 20px;\n            font-size: 0.9rem;\n            margin-bottom: 2rem;\n        }\n        .status::before {\n            content: '';\n            width: 8px;\n            height: 8px;\n            background: #2ed573;\n            border-radius: 50%;\n            animation: pulse 2s infinite;\n        }\n        @keyframes pulse {\n            0%, 100% { opacity: 1; }\n            50% { opacity: 0.5; }\n        }\n        .endpoints {\n            text-align: left;\n            margin-top: 2rem;\n            padding: 1.5rem;\n            background: rgba(0, 0, 0, 0.2);\n            border-radius: 10px;\n        }\n        .endpoints h3 {\n            color: #8892b0;\n            font-size: 0.8rem;\n            text-transform: uppercase;\n            letter-spacing: 2px;\n            margin-bottom: 1rem;\n        }\n        .endpoint {\n            display: flex;\n            align-items: center;\n            gap: 0.75rem;\n            padding: 0.5rem 0;\n            border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n        }\n        .endpoint:last-child { border-bottom: none; }\n        .method {\n            font-size: 0.75rem;\n            font-weight: 600;\n            padding: 0.25rem 0.5rem;\n            border-radius: 4px;\n            min-width: 45px;\n            text-align: center;\n        }\n        .method.get { background: #2ed573; color: #000; }\n        .method.sse { background: #feca57; color: #000; }\n        .path { color: #ccd6f6; font-family: monospace; }\n        .footer {\n            margin-top: 2rem;\n            color: #495670;\n            font-size: 0.85rem;\n        }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"logo\">🦊</div>\n        <h1>Ranger HTTP Server</h1>\n        <p class=\"subtitle\">High-performance server generated from Ranger code</p>\n        <div class=\"status\">Server Running on Port 3000</div>\n        <div class=\"endpoints\">\n            <h3>Available Endpoints</h3>\n            <div class=\"endpoint\">\n                <span class=\"method get\">GET</span>\n                <span class=\"path\">/</span>\n            </div>\n            <div class=\"endpoint\">\n                <span class=\"method get\">GET</span>\n                <span class=\"path\">/content</span>\n            </div>\n            <div class=\"endpoint\">\n                <span class=\"method sse\">SSE</span>\n                <span class=\"path\">/events</span>\n            </div>\n        </div>\n        <p class=\"footer\">Built with Ranger Programming Language</p>\n    </div>\n</body>\n</html>"))
}
func (this *TestServer) handleContent (req *http.Request, res http.ResponseWriter) () {
  res.Header().Set("Content-Type", "text/html")
  res.WriteHeader(int(int64(200)))
  res.Write([]byte("<div><h2>Dynamic Content</h2><p>This is rendered content.</p></div>"))
}
func (this *TestServer) handleEvents (client *SSEClient) () {
  fmt.Fprintf(client.Writer, "event: %s\ndata: %s\n\n", "connected", "Welcome to SSE!")
  client.Flusher.Flush()
  var connected bool= client.IsConnected;
  if  connected {
    fmt.Println( "Client connected to SSE" )
  }
}
func main() {
  var server *TestServer= CreateNew_TestServer();
  fmt.Println( ("Starting " + server.name) + "..." )
  // HTTP Server setup for TestServer
  mux := http.NewServeMux()
  mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
      http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      return
    }
    server.handleIndex(r, w)
  })
  mux.HandleFunc("/content", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
      http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      return
    }
    server.handleContent(r, w)
  })
  mux.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
      http.Error(w, "SSE not supported", http.StatusInternalServerError)
      return
    }
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("Access-Control-Allow-Origin", "*")
    client := &SSEClient{
      Writer:      w,
      Flusher:     flusher,
      Request:     r,
      IsConnected: true,
      done:        make(chan bool),
    }
    server.handleEvents(client)
  })
  addr := fmt.Sprintf(":%d", 3000)
  fmt.Printf("Server starting on http://localhost%s\n", addr)
  log.Fatal(http.ListenAndServe(addr, mux))
}
