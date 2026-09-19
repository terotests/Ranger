package main
import (
  "strconv"
  "fmt"
)
type Request struct { 
  host string `json:"host"` 
  path string `json:"path"` 
  port int64 `json:"port"` 
}

func CreateNew_Request(host string, path string, port int64) *Request {
  me := new(Request)
  me.host = ""
  me.path = "/"
  me.port = int64(80)
  me.host = host; 
  me.path = path; 
  me.port = port; 
  return me;
}
type RequestBuild struct { 
}

func CreateNew_RequestBuild() *RequestBuild {
  me := new(RequestBuild)
  return me;
}
func (this *RequestBuild) withHost (r *Request, h string) *Request {
  return CreateNew_Request(h, r.path, r.port)
}
func (this *RequestBuild) withPath (r *Request, p string) *Request {
  return CreateNew_Request(r.host, p, r.port)
}
func (this *RequestBuild) withPort (r *Request, n int64) *Request {
  return CreateNew_Request(r.host, r.path, n)
}
func (this *RequestBuild) url (r *Request) string {
  return (r.host + ":") + (strconv.FormatInt(r.port, 10) + r.path)
}
type MutRequest struct { 
  host string `json:"host"` 
  path string `json:"path"` 
  port int64 `json:"port"` 
}

func CreateNew_MutRequest() *MutRequest {
  me := new(MutRequest)
  me.host = ""
  me.path = "/"
  me.port = int64(80)
  return me;
}
func (this *MutRequest) withHost (h string) *MutRequest {
  this.host = h; 
  return this
}
func (this *MutRequest) withPath (p string) *MutRequest {
  this.path = p; 
  return this
}
func (this *MutRequest) withPort (n int64) *MutRequest {
  this.port = n; 
  return this
}
func (this *MutRequest) url () string {
  return (this.host + ":") + (strconv.FormatInt(this.port, 10) + this.path)
}
type BuilderMain struct { 
}

func CreateNew_BuilderMain() *BuilderMain {
  me := new(BuilderMain)
  return me;
}
func main() {
  var b *RequestBuild= CreateNew_RequestBuild(); _ = b
  var start *Request= CreateNew_Request("", "/", int64(80));
  var step1 *Request= b.withHost(start, "localhost");
  var step2 *Request= b.withPort(step1, int64(8080));
  var done *Request= b.withPath(step2, "/api");
  fmt.Println( "copy " + b.url(done) )
  var m *MutRequest= CreateNew_MutRequest(); _ = m
  var chained *MutRequest= m.withHost("localhost").
    withPort(int64(8080)).
    withPath("/api"); _ = chained
  fmt.Println( "mut " + chained.url() )
}
