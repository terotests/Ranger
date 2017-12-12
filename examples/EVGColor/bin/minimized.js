class EVGColorContext  {
  constructor() {
    this.colorNames = {};
    this.initContext();
  }
  byName (n) {
    return this.colorNames[n];
  };
  initContext () {
    const colors = ["red", "rgb(255, 0, 0 )", "green", "rgb( 0, 128, 0 )", "blue", "rgb( 0, 0, 255 )", "yellow", "rgb(255, 255, 0 )", "cyan", "rgb( 0, 255, 255 )", "magenta", "rgb(255, 0, 255 )", "black", "rgb( 0, 0, 0 )", "grey", "rgb(128, 128, 128 )", "gray", "rgb(128, 128, 128 )", "white", "rgb(255, 255, 255 )", "aliceblue", "rgb(240, 248, 255 )", "antiquewhite", "rgb(250, 235, 215 )", "aqua", "rgb( 0, 255, 255 )", "aquamarine", "rgb(127, 255, 212 )", "azure", "rgb(240, 255, 255 )", "beige", "rgb(245, 245, 220 )", "bisque", "rgb(255, 228, 196 )", "blanchedalmond", "rgb(255, 235, 205 )", "blueviolet", "rgb(138, 43, 226 )", "brown", "rgb(165, 42, 42 )", "burlywood", "rgb(222, 184, 135 )", "cadetblue", "rgb( 95, 158, 160 )", "chartreuse", "rgb(127, 255, 0 )", "chocolate", "rgb(210, 105, 30 )", "coral", "rgb(255, 127, 80 )", "cornflowerblue", "rgb(100, 149, 237 )", "cornsilk", "rgb(255, 248, 220 )", "crimson", "rgb(220, 20, 60 )", "darkblue", "rgb( 0, 0, 139 )", "darkcyan", "rgb( 0, 139, 139 )", "darkgoldenrod", "rgb(184, 134, 11 )", "darkgray", "rgb(169, 169, 169 )", "darkgreen", "rgb( 0, 100, 0 )", "darkgrey", "rgb(169, 169, 169 )", "darkkhaki", "rgb(189, 183, 107 )", "darkmagenta", "rgb(139, 0, 139 )", "darkolivegreen", "rgb( 85, 107, 47 )", "darkorange", "rgb(255, 140, 0 )", "darkorchid", "rgb(153, 50, 204 )", "darkred", "rgb(139, 0, 0 )", "darksalmon", "rgb(233, 150, 122 )", "darkseagreen", "rgb(143, 188, 143 )", "darkslateblue", "rgb( 72, 61, 139 )", "darkslategray", "rgb( 47, 79, 79 )", "darkslategrey", "rgb( 47, 79, 79 )", "darkturquoise", "rgb( 0, 206, 209 )", "darkviolet", "rgb(148, 0, 211 )", "deeppink", "rgb(255, 20, 147 )", "deepskyblue", "rgb( 0, 191, 255 )", "dimgray", "rgb(105, 105, 105 )", "dimgrey", "rgb(105, 105, 105 )", "dodgerblue", "rgb( 30, 144, 255 )", "firebrick", "rgb(178, 34, 34 )", "floralwhite", "rgb(255, 250, 240 )", "forestgreen", "rgb( 34, 139, 34 )", "fuchsia", "rgb(255, 0, 255 )", "gainsboro", "rgb(220, 220, 220 )", "ghostwhite", "rgb(248, 248, 255 )", "gold", "rgb(255, 215, 0 )", "goldenrod", "rgb(218, 165, 32 )", "greenyellow", "rgb(173, 255, 47 )", "honeydew", "rgb(240, 255, 240 )", "hotpink", "rgb(255, 105, 180 )", "indianred", "rgb(205, 92, 92 )", "indigo", "rgb( 75, 0, 130 )", "ivory", "rgb(255, 255, 240 )", "khaki", "rgb(240, 230, 140 )", "lavender", "rgb(230, 230, 250 )", "lavenderblush", "rgb(255, 240, 245 )", "lawngreen", "rgb(124, 252, 0 )", "lemonchiffon", "rgb(255, 250, 205 )", "lightblue", "rgb(173, 216, 230 )", "lightcoral", "rgb(240, 128, 128 )", "lightcyan", "rgb(224, 255, 255 )", "lightgoldenrodyellow", "rgb(250, 250, 210 )", "lightgray", "rgb(211, 211, 211 )", "lightgreen", "rgb(144, 238, 144 )", "lightgrey", "rgb(211, 211, 211 )", "lightpink", "rgb(255, 182, 193 )", "lightsalmon", "rgb(255, 160, 122 )", "lightseagreen", "rgb( 32, 178, 170 )", "lightskyblue", "rgb(135, 206, 250 )", "lightslategray", "rgb(119, 136, 153 )", "lightslategrey", "rgb(119, 136, 153 )", "lightsteelblue", "rgb(176, 196, 222 )", "lightyellow", "rgb(255, 255, 224 )", "lime", "rgb( 0, 255, 0 )", "limegreen", "rgb( 50, 205, 50 )", "linen", "rgb(250, 240, 230 )", "maroon", "rgb(128, 0, 0 )", "mediumaquamarine", "rgb(102, 205, 170 )", "mediumblue", "rgb( 0, 0, 205 )", "mediumorchid", "rgb(186, 85, 211 )", "mediumpurple", "rgb(147, 112, 219 )", "mediumseagreen", "rgb( 60, 179, 113 )", "mediumslateblue", "rgb(123, 104, 238 )", "mediumspringgreen", "rgb( 0, 250, 154 )", "mediumturquoise", "rgb( 72, 209, 204 )", "mediumvioletred", "rgb(199, 21, 133 )", "midnightblue", "rgb( 25, 25, 112 )", "mintcream", "rgb(245, 255, 250 )", "mistyrose", "rgb(255, 228, 225 )", "moccasin", "rgb(255, 228, 181 )", "navajowhite", "rgb(255, 222, 173 )", "navy", "rgb( 0, 0, 128 )", "oldlace", "rgb(253, 245, 230 )", "olive", "rgb(128, 128, 0 )", "olivedrab", "rgb(107, 142, 35 )", "orange", "rgb(255, 165, 0 )", "orangered", "rgb(255, 69, 0 )", "orchid", "rgb(218, 112, 214 )", "palegoldenrod", "rgb(238, 232, 170 )", "palegreen", "rgb(152, 251, 152 )", "paleturquoise", "rgb(175, 238, 238 )", "palevioletred", "rgb(219, 112, 147 )", "papayawhip", "rgb(255, 239, 213 )", "peachpuff", "rgb(255, 218, 185 )", "peru", "rgb(205, 133, 63 )", "pink", "rgb(255, 192, 203 )", "plum", "rgb(221, 160, 221 )", "powderblue", "rgb(176, 224, 230 )", "purple", "rgb(128, 0, 128 )", "rosybrown", "rgb(188, 143, 143 )", "royalblue", "rgb( 65, 105, 225 )", "saddlebrown", "rgb(139, 69, 19 )", "salmon", "rgb(250, 128, 114 )", "sandybrown", "rgb(244, 164, 96 )", "seagreen", "rgb( 46, 139, 87 )", "seashell", "rgb(255, 245, 238 )", "sienna", "rgb(160, 82, 45 )", "silver", "rgb(192, 192, 192 )", "skyblue", "rgb(135, 206, 235 )", "slateblue", "rgb(106, 90, 205 )", "slategray", "rgb(112, 128, 144 )", "slategrey", "rgb(112, 128, 144 )", "snow", "rgb(255, 250, 250 )", "springgreen", "rgb( 0, 255, 127 )", "steelblue", "rgb( 70, 130, 180 )", "tan", "rgb(210, 180, 140 )", "teal", "rgb( 0, 128, 128 )", "thistle", "rgb(216, 191, 216 )", "tomato", "rgb(255, 99, 71 )", "turquoise", "rgb( 64, 224, 208 )", "violet", "rgb(238, 130, 238 )", "wheat", "rgb(245, 222, 179 )", "whitesmoke", "rgb(245, 245, 245 )", "yellowgreen", "rgb(154, 205, 50 )"];
    let cnt = colors.length;
    while (cnt >= 2) {
      const name = colors[(cnt - 2)];
      const coldef = colors[(cnt - 1)];
      const cc = new EVGColor();
      cc.fromString(coldef);
      this.colorNames[name] = cc;
      cnt = cnt - 2;
    };
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
