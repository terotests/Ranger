#!/usr/bin/env node
class Request  {
  constructor(host, path, port) {
    this.host = "";
    this.path = "/";
    this.port = 80;
    this.host = host;
    this.path = path;
    this.port = port;
  }
}
class RequestBuild  {
  constructor() {
  }
  withHost (r, h) {
    return new Request(h, r.path, r.port);
  };
  withPath (r, p) {
    return new Request(r.host, p, r.port);
  };
  withPort (r, n) {
    return new Request(r.host, r.path, n);
  };
  url (r) {
    return (r.host + ":") + ((r.port.toString()) + r.path);
  };
}
class MutRequest  {
  constructor() {
    this.host = "";
    this.path = "/";
    this.port = 80;
  }
  withHost (h) {
    this.host = h;
    return this;
  };
  withPath (p) {
    this.path = p;
    return this;
  };
  withPort (n) {
    this.port = n;
    return this;
  };
  url () {
    return (this.host + ":") + ((this.port.toString()) + this.path);
  };
}
class BuilderMain  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const b = new RequestBuild();
  const start = new Request("", "/", 80);
  const step1 = b.withHost(start, "localhost");
  const step2 = b.withPort(step1, 8080);
  const done = b.withPath(step2, "/api");
  console.log("copy " + b.url(done));
  const m = new MutRequest();
  const chained = m.withHost("localhost").withPort(8080).withPath("/api");
  console.log("mut " + chained.url());
}
__js_main();
