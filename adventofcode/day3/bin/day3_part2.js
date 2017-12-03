class GridRow  {
  constructor() {
    this.values = {};
  }
}
class Grid  {
  constructor() {
    this.cols = {};
    this.minx = 0;
    this.maxx = 0;
    this.miny = 0;
    this.maxy = 0;
    this.turtle_limit = 0;
    this.first_largest = 0;
  }
  getValue (x, y) {
    if ( ( typeof(this.cols[y] ) != "undefined" && this.cols.hasOwnProperty(y) ) ) {
      const col = this.cols[y];
      if ( ( typeof(col.values[x] ) != "undefined" && col.values.hasOwnProperty(x) ) ) {
        return (col.values[x]);
      }
    }
    return 0;
  };
  setValue (x, y, value) {
    if ( (value > this.turtle_limit) && (this.first_largest == 0) ) {
      this.first_largest = value;
    }
    if ( ( typeof(this.cols[y] ) != "undefined" && this.cols.hasOwnProperty(y) ) ) {
      const col = this.cols[y];
      col.values[x] = value;
    } else {
      const newCol = new GridRow();
      this.cols[y] = newCol;
      newCol.values[x] = value;
    }
    if ( x < this.minx ) {
      this.minx = x;
    }
    if ( x > this.maxx ) {
      this.maxx = x;
    }
    if ( y < this.miny ) {
      this.miny = y;
    }
    if ( y > this.maxy ) {
      this.maxy = y;
    }
  };
  getAdjacentSum (x, y) {
    const v = ((dx, dy) => { 
      return (this).getValue((x + dx), (y + dy));
    });
    return ((((((v(-1, -1) + v(-1, 0)) + v(-1, 1)) + v(0, -1)) + v(0, 1)) + v(1, -1)) + v(1, 0)) + v(1, 1);
  };
  printGrid () {
    let xx = this.minx;
    let yy = this.miny;
    while (yy <= this.maxy) {
      xx = this.minx;
      let row = [];
      while (xx <= this.maxx) {
        row.push((this).getValue(xx, yy));
        xx = xx + 1;
      };
      console.log(operatorsOf.map_2(row, ((item, index) => { 
        return (item.toString());
      })).join(" "));
      yy = yy + 1;
    };
  };
}
class day_three_part_two  {
  constructor() {
  }
}
day_three_part_two.distance = function(data) {
  const myGrid = new Grid();
  myGrid.turtle_limit = data;
  myGrid.setValue(0, 0, 1);
  let i = 0;
  let j = 0;
  const moveTurtle = ((dx, dy, steps) => { 
    let cnt = steps;
    while (cnt > 0) {
      i = i + dx;
      j = j + dy;
      const sum = myGrid.getAdjacentSum(i, j);
      myGrid.setValue(i, j, sum);
      cnt = cnt - 1;
    };
  });
  let step = 2;
  while (myGrid.first_largest == 0) {
    moveTurtle(1, 0, 1);
    moveTurtle(0, -1, step - 1);
    moveTurtle(-1, 0, step);
    moveTurtle(0, 1, step);
    moveTurtle(1, 0, step);
    step = step + 2;
  };
  myGrid.printGrid();
  console.log("the first largest was " + myGrid.first_largest);
  return myGrid.turtle_limit;
};
class operatorsOf  {
  constructor() {
  }
}
operatorsOf.map_2 = function(__self, cb) {
  /** unused:  const __len = __self.length   **/ 
  let res = [];
  for ( let i = 0; i < __self.length; i++) {
    var it = __self[i];
    res.push(cb(it, i));
  };
  return res;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  day_three_part_two.distance(289326);
}
__js_main();
