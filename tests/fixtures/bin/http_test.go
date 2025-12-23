package main
import (
  "net/http"
  "fmt"
  "strconv"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type SimpleHttpHandler struct { 
  port int64 `json:"port"` 
}

func CreateNew_SimpleHttpHandler() *SimpleHttpHandler {
  me := new(SimpleHttpHandler)
  me.port = int64(8080)
  return me;
}
func (this *SimpleHttpHandler) handleRequest (req *http.Request, res http.ResponseWriter) () {
  var method string= req.Method;
  var path string= req.URL.Path;
  var contentType string= req.Header.Get("Content-Type");
  var query string= req.URL.Query().Get("id");
  res.Header().Set("Content-Type", "text/html")
  res.WriteHeader(int64(200))
  res.Write([]byte("<h1>Hello World</h1>"))
  fmt.Println( "Method: " + method )
  fmt.Println( "Path: " + path )
  fmt.Println( "Content-Type: " + contentType )
  fmt.Println( "Query id: " + query )
}
func (this *SimpleHttpHandler) handleSSE (client *SSEClient) () {
  fmt.Fprintf(client.Writer, "event: %s\ndata: %s\n\n", "update", "content changed")
  client.Flusher.Flush()
  var connected bool= client.IsConnected;
  if  connected {
    fmt.Println( "Client is connected" )
  }
}
func main() {
  var handler *SimpleHttpHandler= CreateNew_SimpleHttpHandler();
  fmt.Println( "HTTP test compiled successfully!" )
  fmt.Println( "Port: " + (strconv.FormatInt(handler.port, 10)) )
}
