class EVGColorContext  {
  constructor() {
    this.colorNames = {};
    this.initContext();
  }
  byName (n) {
    return this.colorNames[n];
  };
}
class EVGColor  {
  constructor() {
    this.is_set = true;
    this.r = 0.0;
    this.g = 0.0;
    this.b = 0.0;
    this.a = 1.0;
  }
  testFn () {
    /** unused:  const colors = new EVGColor()   **/ 
    const c = EVGColor.hslToRgb(195.0, 100.0, 50.0);
    console.log((((("RGB of 30 20 10 = " + c.r) + ",") + c.g) + ",") + c.b);
    const c_2 = new EVGColor();
    c_2.fromString("hsl(  195 100.20 50)");
    console.log(((((("parsed value = (" + c_2.red()) + ", ") + c_2.green()) + ", ") + c_2.blue()) + " )");
    c_2.fromString("hsl( 43 100 56)");
    console.log(((((("parsed value = (" + c_2.red()) + ", ") + c_2.green()) + ", ") + c_2.blue()) + " )");
    c_2.fromString("rgb( 43 100 56)");
    console.log(((((("parsed value = (" + c_2.red()) + ", ") + c_2.green()) + ", ") + c_2.blue()) + " )");
    c_2.fromString("rgba( 43 100 56 0.4)");
    console.log(((((((("parsed value = (" + c_2.red()) + ", ") + c_2.green()) + ", ") + c_2.blue()) + " ") + c_2.alpha()) + " )");
    const ctx = new EVGColorContext();
    const redCol = ctx.byName("red");
    console.log("Red color is " + redCol.toCSSString());
    const blueCol = ctx.byName("blue");
    console.log("Blue color is " + blueCol.toCSSString());
  };
  toCSSString () {
    if ( this.is_set == false ) {
      return "none";
    }
    if ( this.a < 1.0 ) {
      return ((((((("rgba(" + this.red()) + ",") + this.green()) + ",") + this.blue()) + ", ") + this.alpha()) + ")";
    }
    return ((((("rgb(" + this.red()) + ",") + this.green()) + ",") + this.blue()) + ")";
  };
  alpha () {
    if ( this.a < 0.0 ) {
      return 0.0;
    }
    if ( this.a > 1.0 ) {
      return 1.0;
    }
    return this.a;
  };
  red () {
    if ( this.r > 255.0 ) {
      return 255;
    }
    if ( this.r < 0.0 ) {
      return 0;
    }
    return Math.floor( this.r);
  };
  green () {
    if ( this.g > 255.0 ) {
      return 255;
    }
    if ( this.g < 0.0 ) {
      return 0;
    }
    return Math.floor( this.g);
  };
  blue () {
    if ( this.b > 255.0 ) {
      return 255;
    }
    if ( this.b < 0.0 ) {
      return 0;
    }
    return Math.floor( this.b);
  };
  copyFrom (col) {
    this.r = col.r;
    this.g = col.g;
    this.b = col.b;
    this.a = col.a;
    this.is_set = col.is_set;
  };
  fromString (str) {
    const buff = str;
    let i = 0;
    let last_number = 0.0;
    const __len = buff.length;
    const skipSpace = (() => { 
      while (i < __len) {
        const c = buff.charCodeAt(i );
        if ( (c <= 32) || (c == (44)) ) {
          i = i + 1;
        } else {
          break;
        }
      };
    });
    const scanNumber = (() => { 
      const s = buff;
      let fc = s.charCodeAt(i );
      let c_1 = fc;
      let sp = 0;
      let ep = 0;
      fc = s.charCodeAt(i );
      if ( (((fc == 45) && ((s.charCodeAt((i + 1) )) >= 46)) && ((s.charCodeAt((i + 1) )) <= 57)) || ((fc >= 48) && (fc <= 57)) ) {
        sp = i;
        i = 1 + i;
        c_1 = s.charCodeAt(i );
        while ((i < __len) && ((((c_1 >= 48) && (c_1 <= 57)) || (c_1 == (46))) || ((i == sp) && ((c_1 == (43)) || (c_1 == (45)))))) {
          i = 1 + i;
          if ( i >= __len ) {
            break;
          }
          c_1 = s.charCodeAt(i );
        };
        ep = i;
        last_number = (isNaN( parseFloat((s.substring(sp, ep ))) ) ? undefined : parseFloat((s.substring(sp, ep ))));
        return true;
      }
      return false;
    });
    if ( __len > 4 ) {
      if ( (((((114) == (buff.charCodeAt(0 ))) && ((103) == (buff.charCodeAt(1 )))) && ((98) == (buff.charCodeAt(2 )))) && ((97) == (buff.charCodeAt(3 )))) && ((40) == (buff.charCodeAt(4 ))) ) {
        i = i + 5;
        skipSpace();
        let h = 0.0;
        let s_1 = 0.0;
        let l = 0.0;
        let a_lpha = 0.0;
        let cnt = 0;
        if ( scanNumber() ) {
          h = last_number;
          cnt = cnt + 1;
        }
        skipSpace();
        if ( scanNumber() ) {
          s_1 = last_number;
          cnt = cnt + 1;
        }
        skipSpace();
        if ( scanNumber() ) {
          l = last_number;
          cnt = cnt + 1;
        }
        skipSpace();
        if ( scanNumber() ) {
          a_lpha = last_number;
          cnt = cnt + 1;
        }
        if ( cnt == 4 ) {
          this.r = h;
          this.g = s_1;
          this.b = l;
          this.a = a_lpha;
          this.is_set = true;
          return;
        }
      }
      if ( ((((114) == (buff.charCodeAt(0 ))) && ((103) == (buff.charCodeAt(1 )))) && ((98) == (buff.charCodeAt(2 )))) && ((40) == (buff.charCodeAt(3 ))) ) {
        i = i + 4;
        skipSpace();
        let h_1 = 0.0;
        let s_2 = 0.0;
        let l_1 = 0.0;
        let cnt_1 = 0;
        if ( scanNumber() ) {
          h_1 = last_number;
          cnt_1 = cnt_1 + 1;
        }
        skipSpace();
        if ( scanNumber() ) {
          s_2 = last_number;
          cnt_1 = cnt_1 + 1;
        }
        skipSpace();
        if ( scanNumber() ) {
          l_1 = last_number;
          cnt_1 = cnt_1 + 1;
        }
        if ( cnt_1 == 3 ) {
          this.r = h_1;
          this.g = s_2;
          this.b = l_1;
          this.a = 1.0;
          this.is_set = true;
          return;
        }
      }
      if ( ((((104) == (buff.charCodeAt(0 ))) && ((115) == (buff.charCodeAt(1 )))) && ((108) == (buff.charCodeAt(2 )))) && ((40) == (buff.charCodeAt(3 ))) ) {
        i = i + 4;
        skipSpace();
        let h_2 = 0.0;
        let s_3 = 0.0;
        let l_2 = 0.0;
        let cnt_2 = 0;
        if ( scanNumber() ) {
          h_2 = last_number;
          cnt_2 = cnt_2 + 1;
        }
        skipSpace();
        if ( scanNumber() ) {
          s_3 = last_number;
          cnt_2 = cnt_2 + 1;
        }
        skipSpace();
        if ( scanNumber() ) {
          l_2 = last_number;
          cnt_2 = cnt_2 + 1;
        }
        if ( cnt_2 == 3 ) {
          const rr = EVGColor.hslToRgb(h_2, s_3, l_2);
          this.copyFrom(rr);
          this.is_set = true;
          return;
        }
      }
    }
  };
}
EVGColor.hue2rgb = function(p, q, tt) {
  let t = tt;
  if ( t < 0.0 ) {
    t = t + 1.0;
  }
  if ( t > 1.0 ) {
    t = t - 1.0;
  }
  if ( t < (1.0 / 6.0) ) {
    return p + (((q - p) * 6.0) * t);
  }
  if ( t < (1.0 / 2.0) ) {
    return q;
  }
  if ( t < (2.0 / 3.0) ) {
    return p + (((q - p) * ((2.0 / 3.0) - t)) * 6.0);
  }
  return p;
};
EVGColor.hslToRgb = function(hh, ss, ll) {
  let r = 0.0;
  let g = 0.0;
  let b = 0.0;
  const h = hh / 360.0;
  const s = ss / 100.0;
  const l = ll / 100.0;
  if ( s == 0.0 ) {
    r = l;
    g = r;
    b = r;
  } else {
    const q = (l < 0.5) ? l : ((l + s) - (l * s));
    const p = (2.0 * l) - q;
    r = EVGColor.hue2rgb(p, q, (h + (1.0 / 3.0)));
    g = EVGColor.hue2rgb(p, q, h);
    b = EVGColor.hue2rgb(p, q, (h - (1.0 / 3.0)));
  }
  const rv = new EVGColor();
  rv.r = r * 255.0;
  rv.g = g * 255.0;
  rv.b = b * 255.0;
  return rv;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const c = new EVGColor();
  c.testFn();
}
__js_main();
