# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Optional



class Request:
  def __init__(self, host: str, path: str, port: int) -> None:
    self.host = ""
    self.path = "/"
    self.port = 80
    self.host = host;
    self.path = path;
    self.port = port;
class RequestBuild:
  def __init__(self) -> None:
    pass
  def withHost(self, r: Request, h: str) -> Request:
    return Request(h, r.path, r.port);
  def withPath(self, r: Request, p: str) -> Request:
    return Request(r.host, p, r.port);
  def withPort(self, r: Request, n: int) -> Request:
    return Request(r.host, r.path, n);
  def url(self, r: Request) -> str:
    return (r.host + ":") + (str(r.port) + r.path);
class MutRequest:
  def __init__(self) -> None:
    self.host = ""
    self.path = "/"
    self.port = 80
  def withHost(self, h: str) -> MutRequest:
    self.host = h;
    return self;
  def withPath(self, p: str) -> MutRequest:
    self.path = p;
    return self;
  def withPort(self, n: int) -> MutRequest:
    self.port = n;
    return self;
  def url(self) -> str:
    return (self.host + ":") + (str(self.port) + self.path);
class BuilderMain:
  def __init__(self) -> None:
    pass
# Main entry point
def main():
  b = RequestBuild()
  start = Request("", "/", 80)
  step1 = b.withHost(start, "localhost")
  step2 = b.withPort(step1, 8080)
  done = b.withPath(step2, "/api")
  print("copy " + b.url(done))
  m = MutRequest()
  chained = m.withHost("localhost").withPort(8080).withPath("/api")
  print("mut " + chained.url())
if __name__ == "__main__":
  main()
