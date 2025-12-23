package main
import (
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
func (this *SimpleHttpHandler) handleRequest (req *HttpRequest, res *HttpResponse) () {
  var method string= req.Method;
  var path string= req.URL.Path;
  /** unused:  contentType*/
  /** unused:  query*/
  http_set_headerres"Content-Type""text/html"http_set_statusresint64(200)http_sendres"<h1>Hello World</h1>"
  fmt.Println( "Method: " + method )
  fmt.Println( "Path: " + path )
}
func (this *SimpleHttpHandler) handleSSE (client *SSEClient) () {
  sse_sendclient"update""content changed"var connected bool= client.IsConnected;
  if  connected {
    fmt.Println( "Client is connected" )
  }
}
func main() {
  var handler *SimpleHttpHandler= CreateNew_SimpleHttpHandler();
  fmt.Println( "HTTP test compiled successfully!" )
  fmt.Println( "Port: " + (strconv.FormatInt(handler.port, 10)) )
}
