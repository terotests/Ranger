class day_two  {
  constructor() {
  }
}
day_two.distance = function(data) {
  /** unused:  const size = 1   **/ 
  let side = 1;
  let total = 1;
  let last_total = 1;
  let n = 1;
  while (total < data) {
    last_total = total;
    side = side + 2;
    total = total + ((side - 1) * 4);
    n = n + 1;
  };
  const dist = (data - last_total) - 1;
  const sideStep = side - 1;
  const pos = dist % sideStep;
  let step_ort = 0;
  const halfway = Math.floor( (sideStep / 2));
  if ( pos < halfway ) {
    step_ort = (halfway - 1) - pos;
  } else {
    step_ort = (pos - halfway) + 1;
  }
  console.log((("total steps for " + data) + " == ") + (step_ort + halfway));
  return step_ort + halfway;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  day_two.distance(9);
  day_two.distance(10);
  day_two.distance(11);
  day_two.distance(12);
  day_two.distance(17);
  day_two.distance(23);
  day_two.distance(24);
  day_two.distance(1024);
  day_two.distance(289326);
}
__js_main();
