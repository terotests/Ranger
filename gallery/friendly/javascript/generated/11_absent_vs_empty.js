#!/usr/bin/env node
class AbsentMain  {
  constructor() {
  }
  report (label, s) {
    if ( typeof(s) === "undefined" ) {
      return label + ": absent";
    }
    return ((label + ": present [") + s) + "]";
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const app = new AbsentMain();
  let s;
  console.log(app.report("unset", s));
  s = "";
  console.log(app.report("empty", s));
  console.log("empty ?? " + (s ?? "FALLBACK"));
  s = "x";
  console.log(app.report("set", s));
  let n;
  if ( typeof(n) === "undefined" ) {
    console.log("int unset: absent");
  } else {
    console.log("int unset: present");
  }
  n = 0;
  if ( typeof(n) === "undefined" ) {
    console.log("int zero: absent");
  } else {
    console.log("int zero: present");
  }
  console.log("int zero ?? " + ((n ?? 99).toString()));
}
__js_main();
