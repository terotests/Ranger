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
  var path string= req.URL.Path;
  res.Header().Set("Content-Type", "text/html")
  res.WriteHeader(int64(200))
  res.Write([]byte(("<html><body><h1>Hello from Ranger HTTP Server!</h1><p>Path: " + path) + "</p></body></html>"))
}
func (this *TestServer) handleContent (req *http.Request, res http.ResponseWriter) () {
  res.Header().Set("Content-Type", "text/html")
  res.WriteHeader(int64(200))
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
