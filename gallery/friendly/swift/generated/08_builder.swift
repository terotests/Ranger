func ==(l: Request, r: Request) -> Bool {
  return l === r
}
final class Request : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var host : String = ""
  var path : String = "/"
  var port : Int = 80
  init(host : String, path : String, port : Int ) {
    self.host = host;
    self.path = path;
    self.port = port;
  }
}
func ==(l: RequestBuild, r: RequestBuild) -> Bool {
  return l === r
}
final class RequestBuild : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func withHost(r : Request, h : String) -> Request {
    return Request(host : h, path : r.path, port : r.port)
  }
  func withPath(r : Request, p : String) -> Request {
    return Request(host : r.host, path : p, port : r.port)
  }
  func withPort(r : Request, n : Int) -> Request {
    return Request(host : r.host, path : r.path, port : n)
  }
  func url(r : Request) -> String {
    return (r.host + ":") + (String(r.port) + r.path)
  }
}
func ==(l: MutRequest, r: MutRequest) -> Bool {
  return l === r
}
final class MutRequest : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var host : String = ""
  var path : String = "/"
  var port : Int = 80
  func withHost(h : String) -> MutRequest {
    self.host = h;
    return self
  }
  func withPath(p : String) -> MutRequest {
    self.path = p;
    return self
  }
  func withPort(n : Int) -> MutRequest {
    self.port = n;
    return self
  }
  func url() -> String {
    return (self.host + ":") + (String(self.port) + self.path)
  }
}
func ==(l: BuilderMain, r: BuilderMain) -> Bool {
  return l === r
}
final class BuilderMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
// Main entry point
func __main__swift() {
  let b : RequestBuild = RequestBuild()
  let start : Request = Request(host : "", path : "/", port : 80)
  let step1 : Request = b.withHost(r : start, h : "localhost")
  let step2 : Request = b.withPort(r : step1, n : 8080)
  let done : Request = b.withPath(r : step2, p : "/api")
  print("copy " + b.url(r : done))
  let m : MutRequest = MutRequest()
  let chained : MutRequest = m.withHost(h : "localhost").withPort(n : 8080).withPath(p : "/api")
  print("mut " + chained.url())
}
__main__swift()
