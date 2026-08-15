#!/usr/bin/env node
class Utf8  {
  constructor() {
  }
}
Utf8.decode = function(raw) {
  let out = "";
  const __len = raw.length;
  let i = 0;
  while (i < __len) {
    const b0 = raw.charCodeAt(i );
    if ( b0 > 255 ) {
      out = out + (String.fromCharCode(b0));
      i = i + 1;
      continue;
    }
    if ( b0 < 128 ) {
      out = out + (String.fromCharCode(b0));
      i = i + 1;
      continue;
    }
    if ( (b0 >= 192) && (b0 < 224) ) {
      if ( (i + 1) < __len ) {
        const b1 = raw.charCodeAt((i + 1) );
        if ( Utf8.isCont(b1) ) {
          const cp = ((b0 - 192) * 64) + (b1 - 128);
          out = out + (String.fromCharCode(cp));
          i = i + 2;
          continue;
        }
      }
    }
    if ( (b0 >= 224) && (b0 < 240) ) {
      if ( (i + 2) < __len ) {
        const b1b = raw.charCodeAt((i + 1) );
        const b2 = raw.charCodeAt((i + 2) );
        if ( Utf8.isCont(b1b) && Utf8.isCont(b2) ) {
          const cp3 = (((b0 - 224) * 4096) + ((b1b - 128) * 64)) + (b2 - 128);
          out = out + (String.fromCharCode(cp3));
          i = i + 3;
          continue;
        }
      }
    }
    if ( (b0 >= 240) && (b0 < 248) ) {
      if ( (i + 3) < __len ) {
        const c1 = raw.charCodeAt((i + 1) );
        const c2 = raw.charCodeAt((i + 2) );
        const c3 = raw.charCodeAt((i + 3) );
        if ( (Utf8.isCont(c1) && Utf8.isCont(c2)) && Utf8.isCont(c3) ) {
          const cp4 = ((((b0 - 240) * 262144) + ((c1 - 128) * 4096)) + ((c2 - 128) * 64)) + (c3 - 128);
          const rel = cp4 - 65536;
          const hi = 55296 + (Math.floor( (rel / 1024)));
          const lo = 56320 + (rel % 1024);
          out = out + (String.fromCharCode(hi));
          out = out + (String.fromCharCode(lo));
          i = i + 4;
          continue;
        }
      }
    }
    out = out + (String.fromCharCode(b0));
    i = i + 1;
  };
  return out;
};
Utf8.isCont = function(b) {
  return (b >= 128) && (b < 192);
};
Utf8.encode = function(s) {
  let out = "";
  let i = 0;
  while (i < (s.length)) {
    const cp = s.charCodeAt(i );
    if ( cp < 128 ) {
      out = out + (String.fromCharCode(cp));
    } else {
      if ( cp < 2048 ) {
        out = out + (String.fromCharCode((192 + (Math.floor( (cp / 64))))));
        out = out + (String.fromCharCode((128 + (cp % 64))));
      } else {
        out = out + (String.fromCharCode((224 + (Math.floor( (cp / 4096))))));
        out = out + (String.fromCharCode((128 + ((Math.floor( (cp / 64))) % 64))));
        out = out + (String.fromCharCode((128 + (cp % 64))));
      }
    }
    i = i + 1;
  };
  return out;
};
Utf8.toWinAnsi = function(cp) {
  if ( (cp >= 32) && (cp <= 126) ) {
    return cp;
  }
  if ( (cp >= 160) && (cp <= 255) ) {
    return cp;
  }
  if ( cp == 8364 ) {
    return 128;
  }
  if ( cp == 8218 ) {
    return 130;
  }
  if ( cp == 402 ) {
    return 131;
  }
  if ( cp == 8222 ) {
    return 132;
  }
  if ( cp == 8230 ) {
    return 133;
  }
  if ( cp == 8224 ) {
    return 134;
  }
  if ( cp == 8225 ) {
    return 135;
  }
  if ( cp == 710 ) {
    return 136;
  }
  if ( cp == 8240 ) {
    return 137;
  }
  if ( cp == 352 ) {
    return 138;
  }
  if ( cp == 8249 ) {
    return 139;
  }
  if ( cp == 338 ) {
    return 140;
  }
  if ( cp == 381 ) {
    return 142;
  }
  if ( cp == 8216 ) {
    return 145;
  }
  if ( cp == 8217 ) {
    return 146;
  }
  if ( cp == 8220 ) {
    return 147;
  }
  if ( cp == 8221 ) {
    return 148;
  }
  if ( cp == 8226 ) {
    return 149;
  }
  if ( cp == 8211 ) {
    return 150;
  }
  if ( cp == 8212 ) {
    return 151;
  }
  if ( cp == 732 ) {
    return 152;
  }
  if ( cp == 8482 ) {
    return 153;
  }
  if ( cp == 353 ) {
    return 154;
  }
  if ( cp == 8250 ) {
    return 155;
  }
  if ( cp == 339 ) {
    return 156;
  }
  if ( cp == 382 ) {
    return 158;
  }
  if ( cp == 376 ) {
    return 159;
  }
  return 0 - 1;
};
Utf8.fromWinAnsi = function(b) {
  if ( (b >= 32) && (b <= 126) ) {
    return b;
  }
  if ( (b >= 160) && (b <= 255) ) {
    return b;
  }
  if ( b == 128 ) {
    return 8364;
  }
  if ( b == 130 ) {
    return 8218;
  }
  if ( b == 131 ) {
    return 402;
  }
  if ( b == 132 ) {
    return 8222;
  }
  if ( b == 133 ) {
    return 8230;
  }
  if ( b == 134 ) {
    return 8224;
  }
  if ( b == 135 ) {
    return 8225;
  }
  if ( b == 136 ) {
    return 710;
  }
  if ( b == 137 ) {
    return 8240;
  }
  if ( b == 138 ) {
    return 352;
  }
  if ( b == 139 ) {
    return 8249;
  }
  if ( b == 140 ) {
    return 338;
  }
  if ( b == 142 ) {
    return 381;
  }
  if ( b == 145 ) {
    return 8216;
  }
  if ( b == 146 ) {
    return 8217;
  }
  if ( b == 147 ) {
    return 8220;
  }
  if ( b == 148 ) {
    return 8221;
  }
  if ( b == 149 ) {
    return 8226;
  }
  if ( b == 150 ) {
    return 8211;
  }
  if ( b == 151 ) {
    return 8212;
  }
  if ( b == 152 ) {
    return 732;
  }
  if ( b == 153 ) {
    return 8482;
  }
  if ( b == 154 ) {
    return 353;
  }
  if ( b == 155 ) {
    return 8250;
  }
  if ( b == 156 ) {
    return 339;
  }
  if ( b == 158 ) {
    return 382;
  }
  if ( b == 159 ) {
    return 376;
  }
  return 0 - 1;
};
Utf8.hasNonWinAnsi = function(s) {
  let i = 0;
  while (i < (s.length)) {
    const cp = s.charCodeAt(i );
    if ( cp >= 32 ) {
      if ( Utf8.toWinAnsi(cp) < 0 ) {
        return true;
      }
    }
    i = i + 1;
  };
  return false;
};
class Token  {
  constructor() {
    this.tokenType = "";
    this.value = "";
    this.line = 0;
    this.col = 0;
    this.start = 0;
    this.end = 0;
    this.hasEscape = false;
    this.legacyOctal = false;
    this.raw = "";
  }
}
class TSUnicodeId  {
  constructor() {
  }
  idStartSpec () {
    let s = "";
    s = s + "1t.p,6.p,1b.0,a.0,4.0,5.m,1.u,1.cp,4.b,e.4,7.0,1.0,3l.4,1.1,2.3,1.0,6.0,1.2,1.0,1.j,1.2a,1";
    s = s + ".3u,8.4l,1.11,2.0,6.14,1z.q,4.3,19.16,z.1,1.2q,1.0,f.1,7.1,a.2,2.0,g.0,1.t,t.2g,b.0,o.w,9.";
    s = s + "1,4.0,5.l,4.0,9.0,3.0,n.o,7.a,5.n,1.6,g.15,1m.1h,3.0,i.0,7.9,f.f,4.7,2.1,2.l,1.6,1.0,3.3,3";
    s = s + ".0,g.0,d.1,1.2,e.1,a.0,8.5,4.1,2.l,1.6,1.1,1.1,1.1,v.3,1.0,j.2,g.8,1.2,1.l,1.6,1.1,1.4,3.0";
    s = s + ",i.0,f.1,n.0,b.7,2.1,2.l,1.6,1.1,1.4,3.0,u.1,1.2,f.0,h.0,1.5,3.2,1.3,3.1,1.0,1.1,3.1,3.2,3";
    s = s + ".b,m.0,1g.7,1.2,1.m,1.f,3.0,q.2,1.1,2.1,u.0,4.7,1.2,1.m,1.9,1.4,3.0,u.2,1.1,f.1,h.8,1.2,1.";
    s = s + "14,2.0,g.0,5.2,8.2,o.5,5.h,3.n,1.8,1.0,2.6,1m.1b,1.1,c.6,1m.1,1.0,1.4,1.n,1.0,1.9,1.1,9.0,";
    s = s + "2.4,1.0,l.3,w.0,1r.7,1.z,r.4,37.16,k.0,g.5,4.3,3.0,3.1,7.2,4.c,c.0,h.11,1.0,5.0,2.16,1.98,";
    s = s + "1.3,2.6,1.0,1.3,2.14,1.3,2.w,1.3,2.6,1.0,1.3,2.e,1.1k,1.3,2.1u,11.f,g.2d,2.5,3.h7,2.g,1.p,";
    s = s + "5.22,3.a,7.h,d.i,e.h,e.c,1.2,f.1f,z.0,4.0,1v.2g,7.14,1.0,5.1x,a.u,1d.t,2.4,b.17,4.p,1i.m,9";
    s = s + ".1g,2a.0,2l.1a,h.7,1i.t,d.1,a.17,q.z,15.2,a.z,2.a,5.16,2.2,15.3,1.5,1.1,3.0,5.5b,1s.7p,2.5";
    s = s + ",2.11,2.5,2.7,1.0,1.0,1.0,1.u,2.1g,1.6,1.0,3.2,1.6,3.3,2.5,4.c,5.2,1.6,38.0,d.0,g.c,2t.0,4";
    s = s + ".0,2.9,1.0,2.5,6.0,1.0,1.0,1.f,2.3,5.4,4.0,h.14,22f.6c,6.3,3.1,c.11,1.0,5.0,2.1j,7.0,g.m,9";
    s = s + ".6,1.6,1.6,1.6,1.6,1.6,1.6,1.6,fa.2,p.8,7.4,2.4,4.2d,4.4,1.2h,1.3,5.16,1.2l,h.v,1c.f,e8.53";
    s = s + "3,1s.h3g,1v.19,2.7g,3.f,a.1,k.1a,g.u,2.27,13.8,2.2u,2.29,k.g,1.2,1.3,1.m,t.1f,e.1d,1q.5,3.";
    s = s + "0,1.1,b.r,a.m,p.s,7.1a,s.0,g.4,1.9,a.4,1.14,n.2,1.7,k.m,3.0,3.1d,1.0,3.1,2.4,2.0,1.0,o.2,2";
    s = s + ".a,7.2,c.5,2.5,2.5,9.6,1.6,1.16,1.d,6.36,t.8mb,c.m,4.1c,6is.a5,2.2x,12.6,c.4,5.0,1.9,1.c,1";
    s = s + ".4,1.0,1.1,1.1,1.2z,x.a2,i.1r,2.1h,14.b,38.4,1.3q,10.p,6.p,b.2g,3.5,2.5,2.5,2.2,z.b,1.p,1.";
    s = s + "i,1.1,1.e,2.d,y.3e,1x.1g,7f.s,3.1c,1b.v,d.t,5.11,a.t,2.z,4.7,1.4,16.4d,i.z,4.z,4.13,8.1f,c";
    s = s + ".a,1.e,1.6,1.1,1.a,1.e,1.6,1.1,3.1f,c.8m,9.l,a.7,o.5,1.15,1.8,1x.5,2.0,1.17,1.1,3.0,2.m,a.";
    s = s + "m,9.u,1t.i,1.1,a.l,a.p,6.p,12.1j,6.1,1s.0,f.3,1.2,1.s,16.s,3.s,z.7,1.r,r.1h,a.l,a.i,d.h,32";
    s = s + ".20,1j.1e,d.1e,d.z,12.r,9.m,6y.15,6.1,g.5,1k.s,a.0,8.l,16.h,1a.k,r.m,c.1g,1l.1,2.0,d.18,w.";
    s = s + "o,q.z,t.0,2.0,8.y,3.0,c.1b,e.3,l.0,1.0,z.h,1.o,j.1,1r.6,1.0,1.3,1.e,1.9,7.1a,12.7,2.1,2.l,";
    s = s + "1.6,1.1,1.4,3.0,i.0,c.4,u.9,1.0,2.0,1.11,1.0,p.0,1.0,18.1g,i.3,k.2,u.1b,k.1,1.0,54.1a,15.3";
    s = s + ",10.1b,k.0,1n.16,d.0,1z.q,11.6,55.17,38.1r,v.7,2.0,2.7,1.1,1.n,f.0,1.0,2m.7,2.12,g.0,1.0,s";
    s = s + ".0,a.13,7.0,l.0,b.19,j.0,i.20,5j.w,v.8,1.10,h.0,1d.t,34.6,1.1,1.11,l.0,p.5,1.1,1.v,e.0,n.1";
    s = s + "7,78.i,f.0,1.c,1.x,3g.0,27.pl,2u.32,h.5f,218.2o,f.tr,h.5,p.32y,5.g6,5a1.t,1cy.fs,7.u,h.26,";
    s = s + "h.t,i.1b,g.3,v.k,5.i,c0.18,5v.1r,w.o,2.o,18.22,5.0,1u.c,1s.1,1.0,e.4,9.5p1,15.v,2p.36,6pp.";
    s = s + "3,1.6,1.1,1.82,f.0,t.2,2.0,e.3,8.az,1s4.2y,5.c,3.8,7.9,4me.2c,1.1y,1.1,2.0,2.1,2.3,1.b,1.0";
    s = s + ",1.6,1.1s,1.3,2.7,1.6,1.r,1.3,1.4,1.0,3.6,1.9f,2.o,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.7";
    s = s + ",1f8.u,6.5,79.1p,42.18,a.6,g.0,8x.t,i.17,dg.r,6c.t,2.0,5r.u,1.2,1.1,1.6,2.4,9.1,68.6,1.3,1";
    s = s + ".1,1.e,1.5g,1n.1v,7.0,xg.3,1.q,1.1,1.0,2.0,1.9,1.3,1.0,1.0,6.0,4.0,1.0,1.0,1.2,1.1,1.0,2.0";
    s = s + ",1.0,1.0,1.0,1.0,1.1,1.0,2.3,1.6,1.3,1.3,1.0,1.9,1.g,5.2,1.4,1.g,3es.wyn,w.3dp,2.4gd,2.5rk";
    s = s + ",f.h9,1wi.f1,15u.3t6,5.6jt";
    return s;
  };
  idContinueSpec () {
    let s = "";
    s = s + "1c.9,7.p,4.0,1.p,1b.0,a.0,1.0,2.0,5.m,1.u,1.cp,4.b,e.4,7.0,1.0,h.38,1.1,2.3,1.0,6.4,1.0,1.";
    s = s + "j,1.2a,1.3u,1.4,2.4l,1.11,2.0,6.14,8.18,1.0,1.1,1.1,1.0,8.q,4.3,t.a,5.21,4.2t,1.7,2.9,1.i,";
    s = s + "2.0,g.1m,2.2s,e.1h,4.0,2.0,2.19,i.r,4.a,5.n,1.6,7.22,1.3k,2.9,1.i,1.7,2.1,2.l,1.6,1.0,3.3,";
    s = s + "2.8,2.1,2.3,8.0,4.1,1.4,2.b,a.0,1.0,2.2,1.5,4.1,2.l,1.6,1.1,1.1,1.1,2.0,1.4,4.1,2.2,3.0,7.";
    s = s + "3,1.0,7.f,b.2,1.8,1.2,1.l,1.6,1.1,1.4,2.9,1.2,1.2,2.0,f.3,2.9,9.6,1.2,1.7,2.1,2.l,1.6,1.1,";
    s = s + "1.4,2.8,2.1,2.2,7.2,4.1,1.4,2.9,1.0,g.1,1.5,3.2,1.3,3.1,1.0,1.1,3.1,3.2,3.b,4.4,3.2,1.3,2.";
    s = s + "0,6.0,e.9,g.c,1.2,1.m,1.f,2.8,1.2,1.3,7.1,1.2,1.1,2.3,2.9,g.3,1.7,1.2,1.m,1.9,1.4,2.8,1.2,";
    s = s + "1.3,7.1,5.2,1.3,2.9,1.2,c.c,1.2,1.1e,1.2,1.4,5.3,7.4,2.9,a.5,1.2,1.h,3.n,1.8,1.0,2.6,3.0,4";
    s = s + ".5,1.0,1.7,6.9,2.1,d.1l,5.e,1.9,13.1,1.0,1.4,1.n,1.0,1.m,2.4,1.0,1.6,1.9,2.3,w.0,n.1,6.9,b";
    s = s + ".0,1.0,1.0,4.9,1.z,4.j,1.h,1.z,9.0,1l.21,6.25,2.11,1.0,5.0,2.16,1.98,1.3,2.6,1.0,1.3,2.14,";
    s = s + "1.3,2.w,1.3,2.6,1.0,1.3,2.e,1.1k,1.3,2.1u,2.2,9.8,e.f,g.2d,2.5,3.h7,2.g,1.p,5.22,3.a,7.l,9";
    s = s + ".l,b.j,c.c,1.2,1.1,c.2b,3.0,4.1,2.9,x.2,1.a,6.2g,7.16,5.1x,a.u,1.b,4.b,a.13,2.4,b.17,4.p,6";
    s = s + ".a,11.r,4.1q,1.s,2.a,6.9,d.0,8.d,1.u,2.b,k.24,3.9,h.8,c.37,c.1j,8.9,3.1c,2.a,5.16,2.2,g.2,";
    s = s + "1.12,5.et,2.5,2.11,2.5,2.7,1.0,1.0,1.0,1.u,2.1g,1.6,1.0,3.2,1.6,3.3,2.5,4.c,5.2,1.6,f.1,1d";
    s = s + ".1,j.0,s.0,d.0,g.c,1f.c,4.0,3.b,h.0,4.0,2.9,1.0,2.5,6.0,1.0,1.0,1.f,2.3,5.4,4.0,h.14,22f.6";
    s = s + "c,6.8,c.11,1.0,5.0,2.1j,7.0,f.n,9.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6,1.v,ed.2,p.e,1.4,2.4,4.2d,";
    s = s + "2.6,1.2m,5.16,1.2l,h.v,1c.f,e8.533,1s.h3g,1v.19,2.7g,3.r,k.1b,4.9,1.36,11.8,2.2u,2.29,k.1i";
    s = s + ",4.0,j.1f,c.1x,a.9,6.n,3.0,1.1c,2.z,c.s,3.1s,e.a,6.u,1.1i,9.d,2.9,6.m,3.20,o.2,2.f,2.4,a.5";
    s = s + ",2.5,2.5,9.6,1.6,1.16,1.d,6.3e,1.1,2.9,6.8mb,c.m,4.1c,6is.a5,2.2x,12.6,c.4,5.b,1.c,1.4,1.0";
    s = s + ",1.1,1.1,1.2z,x.a2,i.1r,2.1h,14.b,4.f,g.f,3.1,o.2,w.4,1.3q,j.9,7.p,4.0,1.p,a.2h,3.5,2.5,2.";
    s = s + "5,2.2,z.b,1.p,1.i,1.1,1.e,2.d,y.3e,1x.1g,3s.0,3m.s,3.1c,f.0,v.v,d.t,5.16,5.t,2.z,4.7,1.4,1";
    s = s + "6.4d,2.9,6.z,4.z,4.13,8.1f,c.a,1.e,1.6,1.1,1.a,1.e,1.6,1.1,3.1f,c.8m,9.l,a.7,o.5,1.15,1.8,";
    s = s + "1x.5,2.0,1.17,1.1,3.0,2.m,a.m,9.u,1t.i,1.1,a.l,a.p,6.p,12.1j,6.1,1s.3,1.1,5.7,1.2,1.s,2.2,";
    s = s + "4.0,w.s,3.s,z.7,1.t,p.1h,a.l,a.i,d.h,32.20,1j.1e,d.1e,d.13,8.9,6.11,3.4,1.m,6y.15,1.1,3.1,";
    s = s + "g.5,1e.y,a.0,8.w,v.l,16.k,r.m,9.1y,v.f,9.1n,7.0,d.o,7.9,6.1g,1.9,4.3,8.z,2.0,9.1w,4.3,1.c,";
    s = s + "1.0,z.h,1.10,6.3,1q.6,1.0,1.3,1.e,1.9,7.1m,5.9,6.3,1.7,2.1,2.l,1.6,1.1,1.4,1.9,2.1,2.2,2.0";
    s = s + ",6.0,5.6,2.6,3.4,b.9,1.0,2.0,1.11,1.9,1.0,2.0,1.3,1.7,d.1,t.22,5.9,4.3,u.1x,1.0,8.9,4m.1h,";
    s = s + "2.8,n.5,y.1s,3.0,b.9,12.1k,7.9,6.j,s.q,2.e,4.9,6.6,55.1m,2t.21,l.7,2.0,2.7,1.1,1.t,1.1,2.8";
    s = s + ",c.9,1y.7,2.19,2.7,1.1,r.1q,8.0,8.21,3.0,i.20,2v.7,2g.w,f.9,6.8,1.18,1.8,f.9,o.t,2.l,1.d,2";
    s = s + "1.6,1.1,1.17,3.0,1.1,1.8,8.9,6.5,1.1,1.10,1.1,1.5,7.9,6.17,4.9,6u.m,9.g,1.14,3.4,d.a,2d.0,";
    s = s + "27.pl,2u.32,h.5f,218.2o,f.tr,g.l,a.32y,5.g6,5a1.1l,1c6.fs,7.u,1.9,6.26,1.9,6.t,2.4,b.1i,9.";
    s = s + "3,c.9,9.k,5.i,c0.18,3.9,5i.1r,w.o,2.o,18.22,4.1k,7.g,1s.1,1.1,b.6,9.5p1,15.v,2p.36,6pp.3,1";
    s = s + ".6,1.1,1.82,f.0,t.2,2.0,e.3,8.az,1s4.2y,5.c,3.8,7.9,3.1,381.9,ee.19,2.m,f2.4,3.5,8.7,2.6,u";
    s = s + ".3,44.2,cb.2c,1.1y,1.1,2.0,2.1,2.3,1.b,1.0,1.6,1.1s,1.3,2.7,1.6,1.r,1.3,1.4,1.0,3.6,1.9f,2";
    s = s + ".o,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.7,2.1d,e8.1i,4.1d,8.0,e.0,m.4,1.e,uo.u,6.5,5x.6,1";
    s = s + ".g,2.6,1.1,1.4,5.1p,x.0,34.18,3.d,2.9,4.0,8x.u,h.1l,d2.15,5y.16,5h.u,1.l,8.1,68.6,1.3,1.1,";
    s = s + "1.e,1.5g,b.6,15.23,4.9,x2.3,1.q,1.1,1.0,2.0,1.9,1.3,1.0,1.0,6.0,4.0,1.0,1.0,1.2,1.1,1.0,2.";
    s = s + "0,1.0,1.0,1.0,1.0,1.1,1.0,2.3,1.6,1.3,1.3,1.0,1.9,1.g,5.2,1.4,1.g,2lw.9,sm.wyn,w.3dp,2.4gd";
    s = s + ",2.5rk,f.h9,1wi.f1,15u.3t6,5.6jt,f62u.6n";
    return s;
  };
  base36Value (ch) {
    const code = ch.charCodeAt(0 );
    if ( code >= 48 ) {
      if ( code <= 57 ) {
        return code - 48;
      }
    }
    if ( code >= 97 ) {
      if ( code <= 122 ) {
        return (code - 97) + 10;
      }
    }
    return 0;
  };
  decodeRangeTable (spec) {
    let out = [];
    let prev = -1;
    let i = 0;
    const n = spec.length;
    let cur = 0;
    let delta = 0;
    while (i < n) {
      const ch = spec.substring(i, (i + 1) );
      if ( ch == "." ) {
        delta = cur;
        cur = 0;
      } else {
        if ( ch == "," ) {
          const s = (prev + 1) + delta;
          const e = s + cur;
          out.push(s);
          out.push(e);
          prev = e;
          cur = 0;
          delta = 0;
        } else {
          cur = (cur * 36) + this.base36Value(ch);
        }
      }
      i = i + 1;
    };
    const sLast = (prev + 1) + delta;
    const eLast = sLast + cur;
    out.push(sLast);
    out.push(eLast);
    return out;
  };
  inRangeTable (table, code) {
    const total = table.length;
    if ( total == 0 ) {
      return false;
    }
    const pairCount = (total) / 2.0;
    let loP = 0;
    let hiP = (Math.floor(pairCount)) - 1;
    while (loP <= hiP) {
      const midD = ((loP + hiP)) / 2.0;
      const midP = Math.floor(midD);
      const lo = table[(midP * 2)];
      const hi = table[((midP * 2) + 1)];
      if ( code < lo ) {
        hiP = midP - 1;
      } else {
        if ( code > hi ) {
          loP = midP + 1;
        } else {
          return true;
        }
      }
    };
    return false;
  };
}
class TSLexer  {
  constructor(src) {
    this.source = "";
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.__len = 0;
    this.prevType = "";
    this.prevValue = "";
    this.prevLine = 0;
    this.unicodeIds = new TSUnicodeId();
    this.idStartTable = [];
    this.idContinueTable = [];
    this.idTablesReady = false;
    this.braceKinds = "";
    this.lastCloseKind = "o";
    this.parenKinds = "";
    this.lastCloseParen = "e";
    this.source = src;
    this.__len = src.length;
  }
  peek () {
    if ( this.pos >= this.__len ) {
      return "";
    }
    return this.source[this.pos];
  };
  peekAt (offset) {
    const idx = this.pos + offset;
    if ( idx >= this.__len ) {
      return "";
    }
    return this.source[idx];
  };
  advance () {
    if ( this.pos >= this.__len ) {
      return "";
    }
    const ch = this.source[this.pos];
    this.pos = this.pos + 1;
    if ( (ch.length) == 0 ) {
      return ch;
    }
    const chCode = ch.charCodeAt(0 );
    let isTerminator = false;
    if ( ((ch == "\n") || (ch == "\r")) || (ch == "\r\n") ) {
      isTerminator = true;
    }
    if ( chCode == 8232 ) {
      isTerminator = true;
    }
    if ( chCode == 8233 ) {
      isTerminator = true;
    }
    if ( this.isLsPsUtf8(ch) ) {
      isTerminator = true;
    }
    if ( isTerminator ) {
      this.line = this.line + 1;
      this.col = 1;
    } else {
      this.col = this.col + 1;
    }
    return ch;
  };
  isDigit (ch) {
    if ( ch == "0" ) {
      return true;
    }
    if ( ch == "1" ) {
      return true;
    }
    if ( ch == "2" ) {
      return true;
    }
    if ( ch == "3" ) {
      return true;
    }
    if ( ch == "4" ) {
      return true;
    }
    if ( ch == "5" ) {
      return true;
    }
    if ( ch == "6" ) {
      return true;
    }
    if ( ch == "7" ) {
      return true;
    }
    if ( ch == "8" ) {
      return true;
    }
    if ( ch == "9" ) {
      return true;
    }
    return false;
  };
  ensureIdTables () {
    if ( this.idTablesReady ) {
      return;
    }
    const startSpec = this.unicodeIds.idStartSpec();
    this.idStartTable = this.unicodeIds.decodeRangeTable(startSpec);
    const contSpec = this.unicodeIds.idContinueSpec();
    this.idContinueTable = this.unicodeIds.decodeRangeTable(contSpec);
    this.idTablesReady = true;
  };
  codePointAt (offset) {
    const idx = this.pos + offset;
    if ( idx >= this.__len ) {
      return -1;
    }
    const first = this.source[idx];
    if ( (first.length) == 0 ) {
      return -1;
    }
    const hi = this.charStringCodePoint(first);
    if ( hi >= 55296 ) {
      if ( hi <= 56319 ) {
        if ( (idx + 1) < this.__len ) {
          const second = this.source[(idx + 1)];
          if ( (second.length) > 0 ) {
            const lo = this.charStringCodePoint(second);
            if ( lo >= 56320 ) {
              if ( lo <= 57343 ) {
                return (((hi - 55296) * 1024) + (lo - 56320)) + 65536;
              }
            }
          }
        }
      }
    }
    return hi;
  };
  codePointWidth () {
    if ( this.pos >= this.__len ) {
      return 1;
    }
    const first = this.source[this.pos];
    if ( (first.length) == 0 ) {
      return 1;
    }
    const hi = this.charStringCodePoint(first);
    if ( hi >= 55296 ) {
      if ( hi <= 56319 ) {
        if ( (this.pos + 1) < this.__len ) {
          const second = this.source[(this.pos + 1)];
          if ( (second.length) > 0 ) {
            const lo = this.charStringCodePoint(second);
            if ( lo >= 56320 ) {
              if ( lo <= 57343 ) {
                return 2;
              }
            }
          }
        }
      }
    }
    return 1;
  };
  isIdStartHere () {
    const cp = this.codePointAt(0);
    if ( cp < 0 ) {
      return false;
    }
    if ( cp < 128 ) {
      const ch = this.source[this.pos];
      return this.isAlpha(ch);
    }
    this.ensureIdTables();
    return this.unicodeIds.inRangeTable(this.idStartTable, cp);
  };
  isIdContinueHere () {
    const cp = this.codePointAt(0);
    if ( cp < 0 ) {
      return false;
    }
    if ( cp < 128 ) {
      const ch = this.source[this.pos];
      return this.isAlphaNumCh(ch);
    }
    this.ensureIdTables();
    return this.unicodeIds.inRangeTable(this.idContinueTable, cp);
  };
  isAlpha (ch) {
    if ( (ch.length) == 0 ) {
      return false;
    }
    const code = ch.charCodeAt(0 );
    if ( code >= 97 ) {
      if ( code <= 122 ) {
        return true;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 90 ) {
        return true;
      }
    }
    if ( ch == "_" ) {
      return true;
    }
    if ( ch == "$" ) {
      return true;
    }
    if ( code > 127 ) {
      this.ensureIdTables();
      return this.unicodeIds.inRangeTable(this.idStartTable, code);
    }
    return false;
  };
  isLetterCode (code) {
    if ( code >= 97 ) {
      if ( code <= 122 ) {
        return true;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 90 ) {
        return true;
      }
    }
    return false;
  };
  isAlphaNumCh (ch) {
    if ( this.isDigit(ch) ) {
      return true;
    }
    if ( ch == "_" ) {
      return true;
    }
    if ( ch == "$" ) {
      return true;
    }
    if ( (ch.length) == 0 ) {
      return false;
    }
    const code = ch.charCodeAt(0 );
    if ( code >= 97 ) {
      if ( code <= 122 ) {
        return true;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 90 ) {
        return true;
      }
    }
    if ( code > 127 ) {
      this.ensureIdTables();
      return this.unicodeIds.inRangeTable(this.idContinueTable, code);
    }
    return false;
  };
  isWhitespace (ch) {
    if ( ch == " " ) {
      return true;
    }
    if ( ch == "\t" ) {
      return true;
    }
    if ( ch == "\n" ) {
      return true;
    }
    if ( ch == "\r" ) {
      return true;
    }
    if ( ch == "\r\n" ) {
      return true;
    }
    if ( (ch.length) == 0 ) {
      return false;
    }
    const code = this.charStringCodePoint(ch);
    if ( code == 11 ) {
      return true;
    }
    if ( code == 12 ) {
      return true;
    }
    if ( code == 160 ) {
      return true;
    }
    if ( code == 5760 ) {
      return true;
    }
    if ( code >= 8192 ) {
      if ( code <= 8202 ) {
        return true;
      }
    }
    if ( code == 8232 ) {
      return true;
    }
    if ( code == 8233 ) {
      return true;
    }
    if ( code == 8239 ) {
      return true;
    }
    if ( code == 8287 ) {
      return true;
    }
    if ( code == 12288 ) {
      return true;
    }
    if ( code == 65279 ) {
      return true;
    }
    if ( this.isLsPsUtf8(ch) ) {
      return true;
    }
    return false;
  };
  skipWhitespace () {
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( this.isWhitespace(ch) ) {
        this.advance();
      } else {
        return;
      }
    };
  };
  makeToken (tokType, value, startPos, startLine, startCol) {
    const tok = new Token();
    tok.tokenType = tokType;
    tok.value = value;
    tok.start = startPos;
    tok.end = this.pos;
    tok.line = startLine;
    tok.col = startCol;
    return tok;
  };
  isLineTerminatorChar (ch) {
    if ( ch == "\n" ) {
      return true;
    }
    if ( ch == "\r" ) {
      return true;
    }
    if ( ch == "\r\n" ) {
      return true;
    }
    if ( (ch.length) == 0 ) {
      return false;
    }
    const code = this.charStringCodePoint(ch);
    if ( code == 8232 ) {
      return true;
    }
    if ( code == 8233 ) {
      return true;
    }
    return false;
  };
  isLsPsUtf8 (ch) {
    const cp = this.charStringCodePoint(ch);
    if ( cp == 8232 ) {
      return true;
    }
    if ( cp == 8233 ) {
      return true;
    }
    return false;
  };
  charStringCodePoint (ch) {
    const n = ch.length;
    if ( n == 0 ) {
      return -1;
    }
    const b0 = ((ch.charCodeAt(0 )) & 255);
    if ( n == 1 ) {
      return ((ch.charCodeAt(0 )) & 65535);
    }
    if ( n == 2 ) {
      if ( (b0 >= 192) && (b0 <= 223) ) {
        const c1 = ((ch.charCodeAt(1 )) & 255);
        if ( (c1 >= 128) && (c1 <= 191) ) {
          return (((b0 & 31)) * 64) + ((c1 & 63));
        }
      }
      return ((ch.charCodeAt(0 )) & 65535);
    }
    if ( n == 3 ) {
      if ( (b0 >= 224) && (b0 <= 239) ) {
        const d1 = ((ch.charCodeAt(1 )) & 255);
        const d2 = ((ch.charCodeAt(2 )) & 255);
        if ( (d1 >= 128) && (d1 <= 191) ) {
          if ( (d2 >= 128) && (d2 <= 191) ) {
            return ((((b0 & 15)) * 4096) + (((d1 & 63)) * 64)) + ((d2 & 63));
          }
        }
      }
    }
    if ( n == 4 ) {
      if ( (b0 >= 240) && (b0 <= 247) ) {
        const e1 = ((ch.charCodeAt(1 )) & 255);
        const e2 = ((ch.charCodeAt(2 )) & 255);
        const e3 = ((ch.charCodeAt(3 )) & 255);
        if ( (e1 >= 128) && (e1 <= 191) ) {
          if ( (e2 >= 128) && (e2 <= 191) ) {
            if ( (e3 >= 128) && (e3 <= 191) ) {
              let acc = ((b0 & 7)) * 262144;
              acc = acc + (((e1 & 63)) * 4096);
              acc = acc + (((e2 & 63)) * 64);
              return acc + ((e3 & 63));
            }
          }
        }
      }
    }
    return ((ch.charCodeAt(0 )) & 65535);
  };
  readLineComment () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( this.isLineTerminatorChar(ch) ) {
        return this.makeToken("LineComment", value, startPos, startLine, startCol);
      }
      value = value + this.advance();
    };
    return this.makeToken("LineComment", value, startPos, startLine, startCol);
  };
  readHtmlComment () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( this.isLineTerminatorChar(ch) ) {
        break;
      }
      value = value + this.advance();
    };
    return this.makeToken("HtmlComment", value, startPos, startLine, startCol);
  };
  readBlockComment () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "*" ) {
        if ( this.peekAt(1) == "/" ) {
          this.advance();
          this.advance();
          return this.makeToken("BlockComment", value, startPos, startLine, startCol);
        }
      }
      value = value + this.advance();
    };
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
  };
  readString (quote) {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let value = "";
    let sawEscape = false;
    let sawOctalEscape = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == quote ) {
        this.advance();
        const strTok = this.makeToken("String", value, startPos, startLine, startCol);
        strTok.hasEscape = sawEscape;
        strTok.legacyOctal = sawOctalEscape;
        return strTok;
      }
      if ( ch == "\n" ) {
        return this.makeToken("Invalid", value, startPos, startLine, startCol);
      }
      if ( ch == "\r" ) {
        return this.makeToken("Invalid", value, startPos, startLine, startCol);
      }
      if ( ch == "\\" ) {
        sawEscape = true;
        this.advance();
        const esc = this.advance();
        if ( esc == "n" ) {
          value = value + "\n";
        } else {
          if ( esc == "t" ) {
            value = value + "\t";
          } else {
            if ( esc == "r" ) {
              value = value + "\r";
            } else {
              if ( esc == "b" ) {
                value = value + (String.fromCharCode(8));
              } else {
                if ( esc == "f" ) {
                  value = value + (String.fromCharCode(12));
                } else {
                  if ( esc == "v" ) {
                    value = value + (String.fromCharCode(11));
                  } else {
                    if ( esc == "0" ) {
                      const afterZero = this.peek();
                      let zeroOctal = false;
                      if ( this.isDigit(afterZero) ) {
                        if ( (afterZero != "8") && (afterZero != "9") ) {
                          zeroOctal = true;
                        }
                      }
                      if ( zeroOctal ) {
                        sawOctalEscape = true;
                        value = value + this.readLegacyOctalEscape(esc);
                      } else {
                        value = value + (String.fromCharCode(0));
                      }
                    } else {
                      if ( esc == "x" ) {
                        const h1 = this.peek();
                        const hv1 = this.hexValue(h1);
                        const h2 = this.peekAt(1);
                        const hv2 = this.hexValue(h2);
                        if ( (hv1 < 0) || (hv2 < 0) ) {
                          return this.makeToken("Invalid", value, startPos, startLine, startCol);
                        }
                        this.advance();
                        this.advance();
                        value = value + this.codeUnitString(((hv1 * 16) + hv2));
                      } else {
                        if ( esc == "u" ) {
                          const uEsc = this.readUnicodeEscapeBody();
                          if ( (uEsc.length) == 0 ) {
                            return this.makeToken("Invalid", value, startPos, startLine, startCol);
                          }
                          value = value + uEsc;
                        } else {
                          if ( esc == "\\" ) {
                            value = value + "\\";
                          } else {
                            if ( esc == "\r" ) {
                              if ( this.peek() == "\n" ) {
                                this.advance();
                              }
                            }
                            if ( (esc == "\n") || (esc == "\r") ) {
                            } else {
                              if ( (esc == "8") || (esc == "9") ) {
                                return this.makeToken("Invalid", value, startPos, startLine, startCol);
                              }
                              if ( this.isDigit(esc) ) {
                                sawOctalEscape = true;
                                value = value + this.readLegacyOctalEscape(esc);
                              } else {
                                value = value + esc;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        value = value + this.advance();
      }
    };
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
  };
  readTemplateLiteral () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let value = "";
    let rawText = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "`" ) {
        this.advance();
        const doneTok = this.makeToken("Template", value, startPos, startLine, startCol);
        doneTok.raw = rawText;
        return doneTok;
      }
      if ( ch == "\\" ) {
        this.advance();
        const esc = this.advance();
        rawText = rawText + ("\\" + esc);
        let handled = false;
        if ( esc == "n" ) {
          value = value + "\n";
          handled = true;
        }
        if ( esc == "t" ) {
          value = value + "\t";
          handled = true;
        }
        if ( esc == "r" ) {
          value = value + "\r";
          handled = true;
        }
        if ( esc == "b" ) {
          value = value + (String.fromCharCode(8));
          handled = true;
        }
        if ( esc == "f" ) {
          value = value + (String.fromCharCode(12));
          handled = true;
        }
        if ( esc == "v" ) {
          value = value + (String.fromCharCode(11));
          handled = true;
        }
        if ( esc == "`" ) {
          value = value + "`";
          handled = true;
        }
        if ( esc == "$" ) {
          value = value + "\\$";
          handled = true;
        }
        if ( esc == "\\" ) {
          value = value + "\\";
          handled = true;
        }
        if ( esc == "'" ) {
          value = value + "'";
          handled = true;
        }
        if ( esc == "\"" ) {
          value = value + "\"";
          handled = true;
        }
        if ( esc == "\r" ) {
          if ( this.peek() == "\n" ) {
            this.advance();
          }
          handled = true;
        }
        if ( esc == "\n" ) {
          handled = true;
        }
        if ( false == handled ) {
          if ( esc == "x" ) {
            const th1 = this.peek();
            const thv1 = this.hexValue(th1);
            const th2 = this.peekAt(1);
            const thv2 = this.hexValue(th2);
            if ( (thv1 < 0) || (thv2 < 0) ) {
              return this.makeToken("Invalid", value, startPos, startLine, startCol);
            }
            this.advance();
            this.advance();
            value = value + this.codeUnitString(((thv1 * 16) + thv2));
            handled = true;
          }
        }
        if ( false == handled ) {
          if ( esc == "u" ) {
            const tuEsc = this.readUnicodeEscapeBody();
            if ( (tuEsc.length) == 0 ) {
              return this.makeToken("Invalid", value, startPos, startLine, startCol);
            }
            value = value + tuEsc;
            handled = true;
          }
        }
        if ( false == handled ) {
          if ( this.isDigit(esc) ) {
            if ( esc != "0" ) {
              return this.makeToken("Invalid", value, startPos, startLine, startCol);
            }
            const afterZero = this.peek();
            if ( this.isDigit(afterZero) ) {
              return this.makeToken("Invalid", value, startPos, startLine, startCol);
            }
            value = value + (String.fromCharCode(0));
          } else {
            value = value + esc;
          }
        }
      } else {
        if ( ch == "$" ) {
          if ( this.peekAt(1) == "{" ) {
            const o1 = this.advance();
            const o2 = this.advance();
            value = (value + o1) + o2;
            rawText = (rawText + o1) + o2;
            let braceDepth = 1;
            while ((this.pos < this.__len) && (braceDepth > 0)) {
              const ic = this.peek();
              if ( ic == "\\" ) {
                const e1 = this.advance();
                value = value + e1;
                rawText = rawText + e1;
                if ( this.pos < this.__len ) {
                  const e2 = this.advance();
                  value = value + e2;
                  rawText = rawText + e2;
                }
              } else {
                if ( ic == "{" ) {
                  braceDepth = braceDepth + 1;
                  const b1 = this.advance();
                  value = value + b1;
                  rawText = rawText + b1;
                } else {
                  if ( ic == "}" ) {
                    braceDepth = braceDepth - 1;
                    const b2 = this.advance();
                    value = value + b2;
                    rawText = rawText + b2;
                  } else {
                    if ( ic == "`" ) {
                      const innerTok = this.readTemplateLiteral();
                      value = ((value + "`") + innerTok.value) + "`";
                      rawText = ((rawText + "`") + innerTok.raw) + "`";
                    } else {
                      const c1 = this.advance();
                      value = value + c1;
                      rawText = rawText + c1;
                    }
                  }
                }
              }
            };
          } else {
            const d1 = this.advance();
            value = value + d1;
            rawText = rawText + d1;
          }
        } else {
          const p1 = this.advance();
          value = value + p1;
          rawText = rawText + p1;
        }
      }
    };
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
  };
  digitVal (ch) {
    if ( (ch.length) == 0 ) {
      return 0 - 1;
    }
    const code = ch.charCodeAt(0 );
    if ( code >= 48 ) {
      if ( code <= 57 ) {
        return code - 48;
      }
    }
    if ( code >= 97 ) {
      if ( code <= 102 ) {
        return (code - 97) + 10;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 70 ) {
        return (code - 65) + 10;
      }
    }
    return 0 - 1;
  };
  readLegacyOctalEscape (first) {
    let v = this.digitVal(first);
    let maxMore = 2;
    if ( v >= 4 ) {
      maxMore = 1;
    }
    let taken = 0;
    while (taken < maxMore) {
      const nx = this.peek();
      const d = this.digitVal(nx);
      if ( (d < 0) || (d > 7) ) {
        taken = maxMore;
      } else {
        v = (v * 8) + d;
        this.advance();
        taken = taken + 1;
      }
    };
    return this.codeUnitString(v);
  };
  readRadix (radix, startPos, startLine, startCol) {
    const prefix = this.peek() + this.peekAt(1);
    this.advance();
    this.advance();
    let acc = 0.0;
    const radixD = radix;
    let digits = "";
    let looping = true;
    while ((this.pos < this.__len) && looping) {
      const ch = this.peek();
      if ( ch == "_" ) {
        this.advance();
      } else {
        const d = this.digitVal(ch);
        if ( d >= 0 ) {
          if ( d < radix ) {
            acc = (acc * radixD) + (d);
            digits = digits + ch;
            this.advance();
          } else {
            looping = false;
          }
        } else {
          looping = false;
        }
      }
    };
    if ( this.peek() == "n" ) {
      if ( (digits.length) > 0 ) {
        this.advance();
        return this.makeToken("BigInt", (prefix + (digits + "n")), startPos, startLine, startCol);
      }
    }
    const digitsRead = this.pos > (startPos + 2);
    const tail = this.peek();
    let runsOn = false;
    if ( this.isAlphaNumCh(tail) ) {
      runsOn = true;
    }
    if ( (digitsRead == false) || runsOn ) {
      while (this.pos < this.__len) {
        const tch = this.peek();
        if ( this.isAlphaNumCh(tch) ) {
          this.advance();
        } else {
          break;
        }
      };
      return this.makeToken("Invalid", (this.source.substring(startPos, this.pos )), startPos, startLine, startCol);
    }
    return this.makeToken("Number", ((acc.toString())), startPos, startLine, startCol);
  };
  readNumber () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    if ( this.peek() == "0" ) {
      const p1 = this.peekAt(1);
      if ( (p1 == "x") || (p1 == "X") ) {
        return this.readRadix(16, startPos, startLine, startCol);
      }
      if ( (p1 == "b") || (p1 == "B") ) {
        return this.readRadix(2, startPos, startLine, startCol);
      }
      if ( (p1 == "o") || (p1 == "O") ) {
        return this.readRadix(8, startPos, startLine, startCol);
      }
    }
    let sawDot = false;
    let legacyOctal = false;
    let nonOctalDecimal = false;
    if ( this.peek() == "0" ) {
      const secondCh = this.peekAt(1);
      if ( this.isDigit(secondCh) ) {
        legacyOctal = true;
        let scan = this.pos + 1;
        while (scan < this.__len) {
          const sc = this.source[scan];
          if ( this.isDigit(sc) ) {
            if ( (sc == "8") || (sc == "9") ) {
              nonOctalDecimal = true;
            }
            scan = scan + 1;
          } else {
            break;
          }
        };
        if ( nonOctalDecimal ) {
          legacyOctal = false;
        }
      }
    }
    let scanning = true;
    while ((this.pos < this.__len) && scanning) {
      const ch = this.peek();
      if ( this.isDigit(ch) ) {
        value = value + this.advance();
      } else {
        if ( ch == "_" ) {
          this.advance();
        } else {
          if ( ((ch == ".") && (sawDot == false)) && (legacyOctal == false) ) {
            sawDot = true;
            value = value + this.advance();
          } else {
            if ( ch == "n" ) {
              value = value + this.advance();
              return this.makeToken("BigInt", value, startPos, startLine, startCol);
            }
            if ( (ch == "e") || (ch == "E") ) {
              const afterE = this.peekAt(1);
              let expDigit = afterE;
              let signLen = 0;
              if ( (afterE == "+") || (afterE == "-") ) {
                expDigit = this.peekAt(2);
                signLen = 1;
              }
              if ( this.isDigit(expDigit) ) {
                value = value + this.advance();
                if ( signLen > 0 ) {
                  value = value + this.advance();
                }
                while (this.pos < this.__len) {
                  const ech = this.peek();
                  if ( this.isDigit(ech) ) {
                    value = value + this.advance();
                  } else {
                    break;
                  }
                };
              }
            }
            scanning = false;
          }
        }
      }
    };
    const numTail = this.peek();
    if ( this.isAlphaNumCh(numTail) ) {
      while (this.pos < this.__len) {
        const tch = this.peek();
        if ( this.isAlphaNumCh(tch) ) {
          this.advance();
        } else {
          break;
        }
      };
      return this.makeToken("Invalid", (this.source.substring(startPos, this.pos )), startPos, startLine, startCol);
    }
    let numText = value;
    if ( legacyOctal ) {
      if ( false == nonOctalDecimal ) {
        let oacc = 0;
        let oi = 0;
        let ook = true;
        while (oi < (numText.length)) {
          const od = this.digitVal((numText.substring(oi, (oi + 1) )));
          if ( (od < 0) || (od > 7) ) {
            ook = false;
            oi = numText.length;
          } else {
            oacc = (oacc * 8) + od;
            oi = oi + 1;
          }
        };
        if ( ook ) {
          numText = (oacc.toString());
        }
      }
    }
    const numTok = this.makeToken("Number", numText, startPos, startLine, startCol);
    numTok.legacyOctal = legacyOctal;
    if ( nonOctalDecimal ) {
      numTok.legacyOctal = true;
    }
    return numTok;
  };
  hexValue (ch) {
    if ( (ch.length) == 0 ) {
      return -1;
    }
    const code = ch.charCodeAt(0 );
    if ( code >= 48 ) {
      if ( code <= 57 ) {
        return code - 48;
      }
    }
    if ( code >= 97 ) {
      if ( code <= 102 ) {
        return (code - 97) + 10;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 70 ) {
        return (code - 65) + 10;
      }
    }
    return -1;
  };
  readUnicodeEscape () {
    const savedPos = this.pos;
    const savedLine = this.line;
    const savedCol = this.col;
    if ( this.peek() != "\\" ) {
      return "";
    }
    this.advance();
    if ( this.peek() != "u" ) {
      this.pos = savedPos;
      this.line = savedLine;
      this.col = savedCol;
      return "";
    }
    this.advance();
    const decoded = this.readUnicodeEscapeBody();
    if ( (decoded.length) == 0 ) {
      this.pos = savedPos;
      this.line = savedLine;
      this.col = savedCol;
      return "";
    }
    return decoded;
  };
  readUnicodeEscapeBody () {
    let code = 0;
    if ( this.peek() == "{" ) {
      this.advance();
      let any = false;
      while (this.pos < this.__len) {
        const ch = this.peek();
        if ( ch == "}" ) {
          break;
        }
        const hv = this.hexValue(ch);
        if ( hv < 0 ) {
          return "";
        }
        code = (code * 16) + hv;
        any = true;
        this.advance();
      };
      if ( any == false ) {
        return "";
      }
      if ( this.peek() != "}" ) {
        return "";
      }
      if ( code > 1114111 ) {
        return "";
      }
      this.advance();
    } else {
      let i = 0;
      while (i < 4) {
        const hch = this.peek();
        const hv_1 = this.hexValue(hch);
        if ( hv_1 < 0 ) {
          return "";
        }
        code = (code * 16) + hv_1;
        this.advance();
        i = i + 1;
      };
      if ( (code >= 55296) && (code <= 56319) ) {
        if ( this.peek() == "\\" ) {
          if ( this.peekAt(1) == "u" ) {
            let lowVal = 0;
            let lj = 0;
            let lowOk = true;
            while (lj < 4) {
              const lc = this.peekAt((2 + lj));
              const lv = this.hexValue(lc);
              if ( lv < 0 ) {
                lowOk = false;
                lj = 4;
              } else {
                lowVal = (lowVal * 16) + lv;
                lj = lj + 1;
              }
            };
            if ( lowOk ) {
              if ( (lowVal >= 56320) && (lowVal <= 57343) ) {
                let lk = 0;
                while (lk < 6) {
                  this.advance();
                  lk = lk + 1;
                };
                code = (65536 + ((code - 55296) * 1024)) + (lowVal - 56320);
              }
            }
          }
        }
      }
    }
    if ( code > 65535 ) {
      if ( ("😀".length) == 1 ) {
        if ( ("é".length) == 1 ) {
          return String.fromCharCode(code);
        }
      }
      if ( ("é".length) > 1 ) {
        const b0 = 240 + (Math.floor( ((code) / 262144.0)));
        const b1 = 128 + (((Math.floor( ((code) / 4096.0))) & 63));
        const b2 = 128 + (((Math.floor( ((code) / 64.0))) & 63));
        const b3 = 128 + ((code & 63));
        return (String.fromCharCode(b0)) + ((String.fromCharCode(b1)) + ((String.fromCharCode(b2)) + (String.fromCharCode(b3))));
      }
      const rest = code - 65536;
      const restD = rest;
      const high = Math.floor((restD / 1024.0));
      const hi = 55296 + high;
      const lo = 56320 + (rest - (high * 1024));
      return this.codeUnitString(hi) + this.codeUnitString(lo);
    }
    return this.codeUnitString(code);
  };
  codeUnitString (code) {
    if ( code < 128 ) {
      return String.fromCharCode(code);
    }
    if ( ((String.fromCharCode(8232)).charCodeAt(0 )) == 8232 ) {
      return String.fromCharCode(code);
    }
    const lo6 = (code & 63);
    if ( code < 2048 ) {
      const hi5 = Math.floor( ((code) / 64.0));
      return (String.fromCharCode((192 + hi5))) + (String.fromCharCode((128 + lo6)));
    }
    const mid6 = ((Math.floor( ((code) / 64.0))) & 63);
    const hi4 = Math.floor( ((code) / 4096.0));
    return (String.fromCharCode((224 + hi4))) + ((String.fromCharCode((128 + mid6))) + (String.fromCharCode((128 + lo6))));
  };
  readIdentifier () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    let sawIdEscape = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( this.isIdContinueHere() ) {
        const width = this.codePointWidth();
        value = value + this.advance();
        if ( width == 2 ) {
          value = value + this.advance();
        }
      } else {
        if ( ch == "\\" ) {
          const esc = this.readUnicodeEscape();
          if ( (esc.length) == 1 ) {
            const escCode = esc.charCodeAt(0 );
            let escOk = this.isAlphaNumCh(esc);
            if ( escCode >= 55296 ) {
              if ( escCode <= 57343 ) {
                escOk = false;
              }
            }
            if ( escOk == false ) {
              return this.makeToken("Invalid", value, startPos, startLine, startCol);
            }
          }
          if ( (esc.length) == 0 ) {
            if ( (value.length) == 0 ) {
              this.advance();
              return this.makeToken("Punctuator", "\\", startPos, startLine, startCol);
            }
            return this.makeToken(this.identType(value), value, startPos, startLine, startCol);
          }
          sawIdEscape = true;
          value = value + esc;
        } else {
          const idTok = this.makeToken(this.identType(value), value, startPos, startLine, startCol);
          idTok.hasEscape = sawIdEscape;
          return idTok;
        }
      }
    };
    const idTokEnd = this.makeToken(this.identType(value), value, startPos, startLine, startCol);
    idTokEnd.hasEscape = sawIdEscape;
    return idTokEnd;
  };
  identType (value) {
    if ( value == "var" ) {
      return "Keyword";
    }
    if ( value == "let" ) {
      return "Keyword";
    }
    if ( value == "const" ) {
      return "Keyword";
    }
    if ( value == "function" ) {
      return "Keyword";
    }
    if ( value == "return" ) {
      return "Keyword";
    }
    if ( value == "if" ) {
      return "Keyword";
    }
    if ( value == "else" ) {
      return "Keyword";
    }
    if ( value == "while" ) {
      return "Keyword";
    }
    if ( value == "do" ) {
      return "Keyword";
    }
    if ( value == "with" ) {
      return "Keyword";
    }
    if ( value == "debugger" ) {
      return "Keyword";
    }
    if ( value == "for" ) {
      return "Keyword";
    }
    if ( value == "in" ) {
      return "Keyword";
    }
    if ( value == "of" ) {
      return "Keyword";
    }
    if ( value == "switch" ) {
      return "Keyword";
    }
    if ( value == "case" ) {
      return "Keyword";
    }
    if ( value == "default" ) {
      return "Keyword";
    }
    if ( value == "break" ) {
      return "Keyword";
    }
    if ( value == "continue" ) {
      return "Keyword";
    }
    if ( value == "try" ) {
      return "Keyword";
    }
    if ( value == "catch" ) {
      return "Keyword";
    }
    if ( value == "finally" ) {
      return "Keyword";
    }
    if ( value == "throw" ) {
      return "Keyword";
    }
    if ( value == "new" ) {
      return "Keyword";
    }
    if ( value == "typeof" ) {
      return "Keyword";
    }
    if ( value == "instanceof" ) {
      return "Keyword";
    }
    if ( value == "this" ) {
      return "Keyword";
    }
    if ( value == "class" ) {
      return "Keyword";
    }
    if ( value == "extends" ) {
      return "Keyword";
    }
    if ( value == "static" ) {
      return "Keyword";
    }
    if ( value == "get" ) {
      return "Keyword";
    }
    if ( value == "set" ) {
      return "Keyword";
    }
    if ( value == "super" ) {
      return "Keyword";
    }
    if ( value == "async" ) {
      return "Keyword";
    }
    if ( value == "await" ) {
      return "Keyword";
    }
    if ( value == "yield" ) {
      return "Keyword";
    }
    if ( value == "import" ) {
      return "Keyword";
    }
    if ( value == "export" ) {
      return "Keyword";
    }
    if ( value == "from" ) {
      return "Keyword";
    }
    if ( value == "as" ) {
      return "Keyword";
    }
    if ( value == "delete" ) {
      return "Keyword";
    }
    if ( value == "void" ) {
      return "Keyword";
    }
    if ( value == "type" ) {
      return "TSKeyword";
    }
    if ( value == "interface" ) {
      return "TSKeyword";
    }
    if ( value == "namespace" ) {
      return "TSKeyword";
    }
    if ( value == "module" ) {
      return "TSKeyword";
    }
    if ( value == "declare" ) {
      return "TSKeyword";
    }
    if ( value == "readonly" ) {
      return "TSKeyword";
    }
    if ( value == "abstract" ) {
      return "TSKeyword";
    }
    if ( value == "implements" ) {
      return "TSKeyword";
    }
    if ( value == "private" ) {
      return "TSKeyword";
    }
    if ( value == "protected" ) {
      return "TSKeyword";
    }
    if ( value == "public" ) {
      return "TSKeyword";
    }
    if ( value == "override" ) {
      return "TSKeyword";
    }
    if ( value == "is" ) {
      return "TSKeyword";
    }
    if ( value == "keyof" ) {
      return "TSKeyword";
    }
    if ( value == "infer" ) {
      return "TSKeyword";
    }
    if ( value == "asserts" ) {
      return "TSKeyword";
    }
    if ( value == "satisfies" ) {
      return "TSKeyword";
    }
    if ( value == "string" ) {
      return "TSType";
    }
    if ( value == "number" ) {
      return "TSType";
    }
    if ( value == "boolean" ) {
      return "TSType";
    }
    if ( value == "any" ) {
      return "TSType";
    }
    if ( value == "unknown" ) {
      return "TSType";
    }
    if ( value == "never" ) {
      return "TSType";
    }
    if ( value == "undefined" ) {
      return "TSType";
    }
    if ( value == "object" ) {
      return "TSType";
    }
    if ( value == "symbol" ) {
      return "TSType";
    }
    if ( value == "bigint" ) {
      return "TSType";
    }
    if ( value == "true" ) {
      return "Boolean";
    }
    if ( value == "false" ) {
      return "Boolean";
    }
    if ( value == "null" ) {
      return "Null";
    }
    return "Identifier";
  };
  nextToken () {
    this.skipWhitespace();
    if ( this.pos >= this.__len ) {
      return this.makeToken("EOF", "", this.pos, this.line, this.col);
    }
    const ch = this.peek();
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    if ( ch == "/" ) {
      const next = this.peekAt(1);
      if ( next == "/" ) {
        return this.readLineComment();
      }
      if ( next == "*" ) {
        return this.readBlockComment();
      }
      if ( this.regexAllowed() ) {
        const re = this.readRegex();
        if ( re.tokenType == "Regex" ) {
          return re;
        }
        if ( re.tokenType == "Invalid" ) {
          return re;
        }
      }
    }
    if ( ch == "\"" ) {
      return this.readString("\"");
    }
    if ( ch == "'" ) {
      let wordApostrophe = false;
      if ( this.pos > 0 ) {
        if ( (this.pos + 1) < this.__len ) {
          const prevCh = this.peekAt(-1);
          const nextCh = this.peekAt(1);
          if ( (prevCh.length) > 0 ) {
            if ( (nextCh.length) > 0 ) {
              const prevCode = prevCh.charCodeAt(0 );
              const nextCode = nextCh.charCodeAt(0 );
              if ( this.isLetterCode(prevCode) && this.isLetterCode(nextCode) ) {
                if ( this.prevType != "Keyword" ) {
                  wordApostrophe = true;
                }
              }
            }
          }
        }
      }
      if ( wordApostrophe ) {
        this.advance();
        return this.makeToken("Punctuator", "'", startPos, startLine, startCol);
      }
      return this.readString("'");
    }
    if ( ch == "<" ) {
      if ( this.peekAt(1) == "!" ) {
        if ( this.peekAt(2) == "-" ) {
          if ( this.peekAt(3) == "-" ) {
            return this.readHtmlComment();
          }
        }
      }
    }
    if ( ch == "-" ) {
      if ( this.peekAt(1) == "-" ) {
        if ( this.peekAt(2) == ">" ) {
          if ( (this.prevType == "") || (this.line > this.prevLine) ) {
            return this.readHtmlComment();
          }
        }
      }
    }
    if ( ch == "`" ) {
      return this.readTemplateLiteral();
    }
    if ( this.isDigit(ch) ) {
      return this.readNumber();
    }
    if ( ch == "." ) {
      const afterDot = this.peekAt(1);
      if ( this.isDigit(afterDot) ) {
        return this.readNumber();
      }
    }
    if ( this.isIdStartHere() ) {
      return this.readIdentifier();
    }
    if ( ch == "\\" ) {
      if ( this.peekAt(1) == "u" ) {
        return this.readIdentifier();
      }
    }
    const next_1 = this.peekAt(1);
    if ( ch == "=" ) {
      if ( next_1 == "=" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "===", startPos, startLine, startCol);
        }
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "!==", startPos, startLine, startCol);
        }
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == ">" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "=>", startPos, startLine, startCol);
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "==", startPos, startLine, startCol);
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "!=", startPos, startLine, startCol);
      }
    }
    if ( ch == "<" ) {
      if ( next_1 == "<" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "<<=", startPos, startLine, startCol);
        }
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "<=", startPos, startLine, startCol);
      }
    }
    if ( ch == ">" ) {
      if ( next_1 == ">" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", ">>=", startPos, startLine, startCol);
        }
        if ( this.peekAt(2) == ">" ) {
          if ( this.peekAt(3) == "=" ) {
            this.advance();
            this.advance();
            this.advance();
            this.advance();
            return this.makeToken("Punctuator", ">>>=", startPos, startLine, startCol);
          }
        }
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", ">=", startPos, startLine, startCol);
      }
    }
    if ( ch == "&" ) {
      if ( next_1 == "&" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken("Punctuator", "&&=", startPos, startLine, startCol);
        }
        return this.makeToken("Punctuator", "&&", startPos, startLine, startCol);
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "&=", startPos, startLine, startCol);
      }
    }
    if ( ch == "|" ) {
      if ( next_1 == "|" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken("Punctuator", "||=", startPos, startLine, startCol);
        }
        return this.makeToken("Punctuator", "||", startPos, startLine, startCol);
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "|=", startPos, startLine, startCol);
      }
    }
    if ( ch == "^" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "^=", startPos, startLine, startCol);
      }
    }
    if ( ch == "?" ) {
      if ( next_1 == "?" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken("Punctuator", "??=", startPos, startLine, startCol);
        }
        return this.makeToken("Punctuator", "??", startPos, startLine, startCol);
      }
      if ( next_1 == "." ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "?.", startPos, startLine, startCol);
      }
    }
    if ( ch == "+" ) {
      if ( next_1 == "+" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "++", startPos, startLine, startCol);
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "+=", startPos, startLine, startCol);
      }
    }
    if ( ch == "-" ) {
      if ( next_1 == "-" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "--", startPos, startLine, startCol);
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "-=", startPos, startLine, startCol);
      }
    }
    if ( ch == "*" ) {
      if ( next_1 == "*" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "**=", startPos, startLine, startCol);
        }
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "**", startPos, startLine, startCol);
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "*=", startPos, startLine, startCol);
      }
    }
    if ( ch == "/" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "/=", startPos, startLine, startCol);
      }
    }
    if ( ch == "%" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "%=", startPos, startLine, startCol);
      }
    }
    if ( ch == "." ) {
      if ( next_1 == "." ) {
        if ( this.peekAt(2) == "." ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "...", startPos, startLine, startCol);
        }
      }
    }
    if ( (ch.length) == 0 ) {
      return this.makeToken("EOF", "", this.pos, this.line, this.col);
    }
    const fallbackCode = ch.charCodeAt(0 );
    this.advance();
    if ( fallbackCode > 127 ) {
      return this.makeToken("Unknown", ch, startPos, startLine, startCol);
    }
    return this.makeToken("Punctuator", ch, startPos, startLine, startCol);
  };
  tokenize () {
    let tokens = [];
    while (true) {
      const tok = this.nextToken();
      tokens.push(tok);
      if ( ((tok.tokenType != "LineComment") && (tok.tokenType != "BlockComment")) && (tok.tokenType != "HtmlComment") ) {
        if ( tok.tokenType == "Punctuator" ) {
          if ( tok.value == "(" ) {
            let headerOpen = "e";
            if ( this.prevType == "Keyword" ) {
              if ( (((this.prevValue == "if") || (this.prevValue == "while")) || (this.prevValue == "for")) || (this.prevValue == "with") ) {
                headerOpen = "h";
              }
            }
            this.parenKinds = this.parenKinds + headerOpen;
          }
          if ( tok.value == ")" ) {
            const pDepth = this.parenKinds.length;
            if ( pDepth > 0 ) {
              this.lastCloseParen = this.parenKinds.substring((pDepth - 1), pDepth );
              this.parenKinds = this.parenKinds.substring(0, (pDepth - 1) );
            } else {
              this.lastCloseParen = "e";
            }
          }
          if ( tok.value == "{" ) {
            this.braceKinds = this.braceKinds + this.braceKindHere();
          }
          if ( tok.value == "}" ) {
            const depth = this.braceKinds.length;
            if ( depth > 0 ) {
              this.lastCloseKind = this.braceKinds.substring((depth - 1), depth );
              this.braceKinds = this.braceKinds.substring(0, (depth - 1) );
            } else {
              this.lastCloseKind = "o";
            }
          }
        }
        this.prevType = tok.tokenType;
        this.prevValue = tok.value;
        this.prevLine = tok.line;
      }
      if ( tok.tokenType == "EOF" ) {
        return tokens;
      }
    };
    return tokens;
  };
  braceKindHere () {
    if ( this.prevType == "" ) {
      return "b";
    }
    if ( this.line > this.prevLine ) {
      return "b";
    }
    if ( this.prevType == "Punctuator" ) {
      if ( this.prevValue == ")" ) {
        return "b";
      }
      if ( this.prevValue == ";" ) {
        return "b";
      }
      if ( this.prevValue == "{" ) {
        return "b";
      }
      if ( this.prevValue == "}" ) {
        return "b";
      }
      if ( this.prevValue == "=>" ) {
        return "b";
      }
      if ( this.prevValue == ":" ) {
        return "b";
      }
      if ( this.prevValue == "++" ) {
        return "b";
      }
      if ( this.prevValue == "--" ) {
        return "b";
      }
      return "o";
    }
    if ( this.prevType == "Keyword" ) {
      if ( this.prevValue == "else" ) {
        return "b";
      }
      if ( this.prevValue == "do" ) {
        return "b";
      }
      if ( this.prevValue == "try" ) {
        return "b";
      }
      if ( this.prevValue == "finally" ) {
        return "b";
      }
      return "o";
    }
    return "o";
  };
  regexBodyValid (body, unicodeMode) {
    const n = body.length;
    let groups = 0;
    let maxBackRef = 0;
    let i = 0;
    let inClass = false;
    let prevWasAssertion = false;
    let skipTo = -1;
    while (i < n) {
      skipTo = -1;
      const ch = body.substring(i, (i + 1) );
      if ( ch == "\\" ) {
        const esc = body.substring((i + 1), (i + 2) );
        if ( esc == "u" ) {
          if ( (body.substring((i + 2), (i + 3) )) == "{" ) {
            let cp = 0;
            let j = i + 3;
            let digits = 0;
            while (j < n) {
              const hc = body.substring(j, (j + 1) );
              if ( hc == "}" ) {
                break;
              }
              const hv = this.hexValue(hc);
              if ( hv < 0 ) {
                break;
              }
              cp = (cp * 16) + hv;
              digits = digits + 1;
              j = j + 1;
            };
            if ( digits > 0 ) {
              if ( cp > 1114111 ) {
                return false;
              }
            }
            if ( (body.substring(j, (j + 1) )) == "}" ) {
              skipTo = j + 1;
            }
          }
        } else {
          let isPropEsc = false;
          if ( unicodeMode ) {
            if ( (esc == "p") || (esc == "P") ) {
              if ( (body.substring((i + 2), (i + 3) )) == "{" ) {
                isPropEsc = true;
              }
            }
          }
          if ( isPropEsc ) {
            let pj = i + 3;
            while (pj < n) {
              if ( (body.substring(pj, (pj + 1) )) == "}" ) {
                break;
              }
              pj = pj + 1;
            };
            if ( (body.substring(pj, (pj + 1) )) == "}" ) {
              skipTo = pj + 1;
            } else {
              return false;
            }
          } else {
            const escCode = esc.charCodeAt(0 );
            if ( escCode >= 49 ) {
              if ( escCode <= 57 ) {
                const refNum = escCode - 48;
                if ( refNum > maxBackRef ) {
                  maxBackRef = refNum;
                }
              }
            }
          }
        }
        if ( skipTo >= 0 ) {
          i = skipTo;
        } else {
          i = i + 2;
        }
        prevWasAssertion = false;
      } else {
        if ( inClass ) {
          if ( ch == "]" ) {
            inClass = false;
          }
          i = i + 1;
        } else {
          if ( ch == "[" ) {
            inClass = true;
            prevWasAssertion = false;
            i = i + 1;
          } else {
            if ( ch == "(" ) {
              const after = body.substring((i + 1), (i + 3) );
              if ( (after == "?=") || (after == "?!") ) {
                prevWasAssertion = false;
              } else {
                if ( (body.substring((i + 1), (i + 2) )) != "?" ) {
                  groups = groups + 1;
                }
              }
              i = i + 1;
            } else {
              if ( unicodeMode ) {
                if ( ch == "}" ) {
                  return false;
                }
                if ( ch == "]" ) {
                  return false;
                }
                if ( ch == "{" ) {
                  let k = i + 1;
                  let numDigits = 0;
                  while (k < n) {
                    const dc = body.substring(k, (k + 1) );
                    if ( this.isDigit(dc) ) {
                      numDigits = numDigits + 1;
                      k = k + 1;
                    } else {
                      break;
                    }
                  };
                  if ( numDigits == 0 ) {
                    return false;
                  }
                  let bk = k;
                  if ( (body.substring(bk, (bk + 1) )) == "," ) {
                    bk = bk + 1;
                    while (bk < n) {
                      const d2 = body.substring(bk, (bk + 1) );
                      if ( this.isDigit(d2) ) {
                        bk = bk + 1;
                      } else {
                        break;
                      }
                    };
                  }
                  if ( (body.substring(bk, (bk + 1) )) == "}" ) {
                    i = bk;
                  } else {
                    return false;
                  }
                }
              }
              i = i + 1;
            }
          }
        }
      }
    };
    if ( maxBackRef > groups ) {
      return false;
    }
    return true;
  };
  stringContainsChar (haystack, ch) {
    let i = 0;
    const n = haystack.length;
    while (i < n) {
      if ( (haystack.substring(i, (i + 1) )) == ch ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  regexAllowed () {
    if ( this.prevType == "" ) {
      return true;
    }
    if ( this.prevType == "Number" ) {
      return false;
    }
    if ( this.prevType == "BigInt" ) {
      return false;
    }
    if ( this.prevType == "String" ) {
      return false;
    }
    if ( this.prevType == "Template" ) {
      return false;
    }
    if ( this.prevType == "Regex" ) {
      return false;
    }
    if ( this.prevType == "Unknown" ) {
      return false;
    }
    if ( this.prevType == "Identifier" ) {
      return false;
    }
    if ( this.prevType == "TSType" ) {
      return false;
    }
    if ( this.prevType == "Keyword" ) {
      if ( this.prevValue == "this" ) {
        return false;
      }
      if ( this.prevValue == "super" ) {
        return false;
      }
      if ( this.prevValue == "true" ) {
        return false;
      }
      if ( this.prevValue == "false" ) {
        return false;
      }
      if ( this.prevValue == "null" ) {
        return false;
      }
      return true;
    }
    if ( this.prevType == "Punctuator" ) {
      if ( this.prevValue == ")" ) {
        if ( this.lastCloseParen == "h" ) {
          return true;
        }
        return false;
      }
      if ( this.prevValue == "]" ) {
        return false;
      }
      if ( this.prevValue == "++" ) {
        return false;
      }
      if ( this.prevValue == "--" ) {
        return false;
      }
      if ( this.prevValue == "<" ) {
        return false;
      }
      if ( this.prevValue == "}" ) {
        if ( this.lastCloseKind == "b" ) {
          return true;
        }
        return false;
      }
      return true;
    }
    return true;
  };
  readRegex () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = this.advance();
    let inClass = false;
    let closed = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "\n" ) {
        break;
      }
      if ( ch == "\r" ) {
        break;
      }
      if ( ch == "\\" ) {
        value = value + this.advance();
        if ( this.pos < this.__len ) {
          const escCh = this.peek();
          if ( (escCh == "\n") || (escCh == "\r") ) {
            break;
          }
          value = value + this.advance();
        }
      } else {
        if ( ch == "[" ) {
          inClass = true;
          value = value + this.advance();
        } else {
          if ( ch == "]" ) {
            inClass = false;
            value = value + this.advance();
          } else {
            if ( ch == "/" ) {
              if ( inClass ) {
                value = value + this.advance();
              } else {
                value = value + this.advance();
                closed = true;
                break;
              }
            } else {
              value = value + this.advance();
            }
          }
        }
      }
    };
    if ( closed == false ) {
      this.pos = startPos;
      this.line = startLine;
      this.col = startCol;
      return this.makeToken("", "", startPos, startLine, startCol);
    }
    let flags = "";
    let badFlag = false;
    while (this.pos < this.__len) {
      const fch = this.peek();
      if ( this.isAlphaNumCh(fch) ) {
        let known = false;
        if ( fch == "d" ) {
          known = true;
        }
        if ( fch == "g" ) {
          known = true;
        }
        if ( fch == "i" ) {
          known = true;
        }
        if ( fch == "m" ) {
          known = true;
        }
        if ( fch == "s" ) {
          known = true;
        }
        if ( fch == "u" ) {
          known = true;
        }
        if ( fch == "v" ) {
          known = true;
        }
        if ( fch == "y" ) {
          known = true;
        }
        if ( known == false ) {
          badFlag = true;
        }
        if ( this.stringContainsChar(flags, fch) ) {
          badFlag = true;
        }
        flags = flags + fch;
        value = value + this.advance();
      } else {
        break;
      }
    };
    if ( badFlag ) {
      return this.makeToken("Invalid", value, startPos, startLine, startCol);
    }
    if ( this.peek() == "\\" ) {
      return this.makeToken("Invalid", value, startPos, startLine, startCol);
    }
    const bodyLen = (value.length) - ((flags.length) + 2);
    const body = value.substring(1, (1 + bodyLen) );
    const unicodeMode = this.stringContainsChar(flags, "u");
    if ( this.regexBodyValid(body, unicodeMode) == false ) {
      return this.makeToken("Invalid", value, startPos, startLine, startCol);
    }
    return this.makeToken("Regex", value, startPos, startLine, startCol);
  };
}
class TSNode  {
  constructor() {
    this.nodeType = "";
    this.start = 0;
    this.end = 0;
    this.line = 0;
    this.col = 0;
    this.name = "";
    this.value = "";
    this.kind = "";
    this.optional = false;
    this.readonly = false;
    this.prefix = false;
    this.shorthand = false;
    this.computed = false;
    this.numericKey = false;
    this.accessor = "";
    this.parenthesized = false;
    this.hasEscape = false;
    this.argScanned = false;     /** note: unused */
    this.usesArguments = false;     /** note: unused */
    this.thisScanned = false;     /** note: unused */
    this.usesThis = false;     /** note: unused */
    this.notGlobalBuiltin = false;     /** note: unused */
    this.paramSlotScanned = false;     /** note: unused */
    this.paramSlotsSafe = false;     /** note: unused */
    this.bcScanned = false;     /** note: unused */
    this.bcProgramId = 0 - 1;     /** note: unused */
    this.numScanned = false;     /** note: unused */
    this.numValue = 0.0;     /** note: unused */
    this.numCacheId = 0 - 1;     /** note: unused */
    this.scopeHops = 0 - 1;     /** note: unused */
    this.lexScanned = false;     /** note: unused */
    this.lexDeclares = false;     /** note: unused */
    this.lexNames = [];     /** note: unused */
    this.yieldScanned = false;     /** note: unused */
    this.yieldInside = false;     /** note: unused */
    this.evalKind = 0;     /** note: unused */
    this.evalOpKind = 0;     /** note: unused */
    this.hoistScanned = false;     /** note: unused */
    this.hoistedVarNames = [];     /** note: unused */
    this.slotScanned = false;     /** note: unused */
    this.slotVarNames = [];     /** note: unused */
    this.exprId = 0 - 1;     /** note: unused */
    this.exprSlotCount = 0 - 1;     /** note: unused */
    this.transientOk = 0 - 1;     /** note: unused */
    this.callSiteOp = 0;     /** note: unused */
    this.callSiteEpoch = 0 - 1;     /** note: unused */
    this.method = false;
    this.generator = false;
    this.async = false;
    this.delegate = false;
    this.await = false;
    this.children = [];
    this.params = [];
    this.decorators = [];
  }
}
class TSParserSimple  {
  constructor() {
    this.tokens = [];
    this.pos = 0;
    this.quiet = false;
    this.errorCount = 0;
    this.firstErrorText = "";
    this.scopeNames = [];
    this.scopeStart = [];
    this.scopeIsFn = [];
    this.suppressBlockScope = false;
    this.ternaryConsequentDepth = 0;
    this.caseTestDepth = 0;
    this.strictMode = false;
    this.declaringKind = "";
    this.allowSuperCall = false;
    this.allowSuperProperty = false;
    this.inDerivedClass = false;
    this.iterationDepth = 0;
    this.switchDepth = 0;
    this.activeLabels = [];
    this.iterationLabels = [];
    this.pendingLabel = "";     /** note: unused */
    this.inGenerator = false;
    this.inAsync = false;
    this.inAsyncParams = false;
    this.functionDepth = 0;
    this.sawRestParam = false;
    this.lastBlockEnabledStrict = false;
    this.restParamPending = false;
    this.patternAllowsMemberTarget = false;
    this.exportedNames = [];
    this.moduleMode = true;
    this.typeScriptMode = true;
    this.ecmaVersion = 2024;
    this.noLetReference = false;
    this.inForOfHead = false;     /** note: unused */
    this.inParamList = false;
    this.parsingFunctionExpression = false;
    this.parsingClassExpression = false;
    this.pendingExportRefs = [];
    this.inSingleStatementBody = false;
    this.singleBodyIsIfBranch = false;
    this.lastTokenLine = 0;
    this.lastTokenEndPos = 0;
    this.atModuleTopLevel = false;
    this.inExportDefault = false;
    this.speculating = 0;
    this.tsxMode = false;
  }
  initParser (toks) {
    this.tokens = toks;
    this.pos = 0;
    this.quiet = false;
    this.errorCount = 0;
    this.firstErrorText = "";
    if ( (toks.length) > 0 ) {
      this.currentToken = toks[0];
      this.skipIgnoredTokens();
    }
  };
  syntaxError (msg) {
    this.errorCount = this.errorCount + 1;
    if ( this.speculating > 0 ) {
      return;
    }
    if ( this.errorCount > 1 ) {
      return;
    }
    this.firstErrorText = msg;
    if ( this.quiet == false ) {
      console.log(msg);
    }
  };
  firstError () {
    return this.firstErrorText;
  };
  setQuiet (q) {
    this.quiet = q;
  };
  setTsxMode (enabled) {
    this.tsxMode = enabled;
  };
  setModuleMode (enabled) {
    this.moduleMode = enabled;
  };
  setTypeScriptMode (enabled) {
    this.typeScriptMode = enabled;
  };
  setEcmaVersion (year) {
    this.ecmaVersion = year;
  };
  peek () {
    return this.currentToken;
  };
  peekType () {
    if ( typeof(this.currentToken) === "undefined" ) {
      return "EOF";
    }
    const tok = this.currentToken;
    return tok.tokenType;
  };
  peekValue () {
    if ( typeof(this.currentToken) === "undefined" ) {
      return "";
    }
    const tok = this.currentToken;
    return tok.value;
  };
  advance () {
    if ( this.pos < (this.tokens.length) ) {
      const consumed = this.tokens[this.pos];
      this.lastTokenLine = consumed.line;
      this.lastTokenEndPos = consumed.end;
    }
    this.pos = this.pos + 1;
    if ( this.pos < (this.tokens.length) ) {
      this.currentToken = this.tokens[this.pos];
    } else {
      const eof = new Token();
      eof.tokenType = "EOF";
      eof.value = "";
      this.currentToken = eof;
    }
    this.skipIgnoredTokens();
  };
  skipIgnoredTokens () {
    while (this.pos < (this.tokens.length)) {
      const tok = this.peek();
      const tokType = tok.tokenType;
      if ( ((tokType == "LineComment") || (tokType == "BlockComment")) || (tokType == "HtmlComment") ) {
        this.pos = this.pos + 1;
        if ( this.pos < (this.tokens.length) ) {
          this.currentToken = this.tokens[this.pos];
        } else {
          const eof = new Token();
          eof.tokenType = "EOF";
          eof.value = "";
          this.currentToken = eof;
          return;
        }
      } else {
        return;
      }
    };
  };
  listPrefix (list, n) {
    let out = [];
    let i = 0;
    while (i < n) {
      out.push(list[i]);
      i = i + 1;
    };
    return out;
  };
  intListPrefix (list, n) {
    let out = [];
    let i = 0;
    while (i < n) {
      out.push(list[i]);
      i = i + 1;
    };
    return out;
  };
  pushScope (isFunctionBoundary) {
    this.scopeStart.push(this.scopeNames.length);
    if ( isFunctionBoundary ) {
      this.scopeIsFn.push(1);
    } else {
      this.scopeIsFn.push(0);
    }
  };
  popScope () {
    const depth = this.scopeStart.length;
    if ( depth == 0 ) {
      return;
    }
    const start = this.scopeStart[(depth - 1)];
    this.scopeNames = this.listPrefix(this.scopeNames, start);
    this.scopeStart = this.intListPrefix(this.scopeStart, (depth - 1));
    this.scopeIsFn = this.intListPrefix(this.scopeIsFn, (depth - 1));
  };
  declareBinding (kind, name) {
    if ( (name.length) == 0 ) {
      return;
    }
    const depth = this.scopeStart.length;
    if ( depth == 0 ) {
      return;
    }
    const total = this.scopeNames.length;
    const scopeIdx = depth - 1;
    let limit = 0;
    let hoists = false;
    if ( kind == "v" ) {
      hoists = true;
    }
    if ( kind == "f" ) {
      hoists = true;
    }
    if ( hoists ) {
      let walk = scopeIdx;
      let keepWalking = true;
      while ((walk >= 0) && keepWalking) {
        if ( (this.scopeIsFn[walk]) == 1 ) {
          keepWalking = false;
        } else {
          walk = walk - 1;
        }
      };
      if ( walk < 0 ) {
        limit = 0;
      } else {
        limit = this.scopeStart[walk];
      }
    } else {
      limit = this.scopeStart[scopeIdx];
    }
    const ownStart = this.scopeStart[scopeIdx];
    let i = limit;
    while (i < total) {
      const entry = this.scopeNames[i];
      const sep = 1;
      const entryKind = entry.substring(0, 1 );
      const entryName = entry.substring(2, (entry.length) );
      if ( entryName == name ) {
        let clash = false;
        if ( kind == "l" ) {
          if ( i >= ownStart ) {
            clash = true;
          }
        }
        if ( hoists ) {
          if ( entryKind == "l" ) {
            clash = true;
          }
        }
        if ( kind == "f" ) {
          if ( entryKind == "p" ) {
            if ( i >= ownStart ) {
              if ( this.inSingleStatementBody == false ) {
                clash = true;
              }
            }
          }
        }
        if ( this.moduleMode ) {
          if ( (this.scopeIsFn[scopeIdx]) == 1 ) {
            if ( depth == 1 ) {
              if ( i >= ownStart ) {
                if ( (kind == "f") && (entryKind == "v") ) {
                  clash = true;
                }
                if ( (kind == "v") && (entryKind == "f") ) {
                  clash = true;
                }
                if ( (kind == "f") && (entryKind == "f") ) {
                  clash = true;
                }
              }
            }
          }
        }
        if ( kind == "f" ) {
          if ( entryKind == "f" ) {
            if ( i >= ownStart ) {
              if ( this.strictMode ) {
                if ( (this.scopeIsFn[scopeIdx]) == 0 ) {
                  clash = true;
                }
              }
            }
          }
        }
        if ( kind == "p" ) {
          if ( i >= ownStart ) {
            if ( entryKind == "p" ) {
              clash = true;
            }
          }
        }
        if ( clash ) {
          this.syntaxError(("Parse error: '" + name) + "' has already been declared");
          this.scopeNames.push((kind + "|") + name);
          return;
        }
      }
      i = i + 1;
    };
    this.scopeNames.push((kind + "|") + name);
  };
  declareBindingKind (declKind, declarator) {
    let k = "v";
    if ( declKind == "let" ) {
      k = "l";
    }
    if ( declKind == "const" ) {
      k = "l";
    }
    if ( (declarator.name.length) > 0 ) {
      this.declareBinding(k, declarator.name);
    }
  };
  declareParam (param) {
    if ( (param.name.length) == 0 ) {
      return;
    }
    if ( this.strictMode ) {
      this.declareBinding("p", param.name);
    } else {
      this.declareBinding("q", param.name);
    }
  };
  checkNonSimpleParamDuplicates (params) {
    let simple = true;
    let i = 0;
    while (i < (params.length)) {
      const p = params[i];
      if ( p.nodeType != "Parameter" ) {
        simple = false;
      }
      if ( (typeof(p.init) === "undefined") == false ) {
        simple = false;
      }
      i = i + 1;
    };
    if ( simple ) {
      return;
    }
    const names = this.collectParamNames(params);
    let a = 0;
    while (a < (names.length)) {
      let b = 0;
      while (b < a) {
        if ( (names[a]) == (names[b]) ) {
          this.syntaxError(("Parse error: duplicate parameter '" + (names[a])) + "' in a non-simple parameter list");
        }
        b = b + 1;
      };
      a = a + 1;
    };
  };
  collectParamNames (params) {
    let out = [];
    let i = 0;
    while (i < (params.length)) {
      const p = params[i];
      if ( (p.name.length) > 0 ) {
        out.push(p.name);
      }
      const sub = this.collectPatternNames(p);
      let j = 0;
      while (j < (sub.length)) {
        out.push(sub[j]);
        j = j + 1;
      };
      i = i + 1;
    };
    return out;
  };
  collectPatternNames (node) {
    let out = [];
    let i = 0;
    while (i < (node.children.length)) {
      const c = node.children[i];
      let bindsOwnName = true;
      if ( c.nodeType == "Property" ) {
        if ( c.shorthand == false ) {
          bindsOwnName = false;
        }
      }
      if ( bindsOwnName ) {
        if ( (c.name.length) > 0 ) {
          out.push(c.name);
        }
      }
      const sub = this.collectPatternNames(c);
      let j = 0;
      while (j < (sub.length)) {
        out.push(sub[j]);
        j = j + 1;
      };
      i = i + 1;
    };
    return out;
  };
  recheckStrictSignature (name, params) {
    let k = 0;
    while (k < (params.length)) {
      const sp = params[k];
      const spKind = sp.nodeType;
      if ( spKind != "Parameter" ) {
        this.syntaxError("Parse error: a function with a 'use strict' directive must have a simple parameter list");
      } else {
        if ( (typeof(sp.init) === "undefined") == false ) {
          this.syntaxError("Parse error: a function with a 'use strict' directive must have a simple parameter list");
        }
      }
      k = k + 1;
    };
    if ( (name.length) > 0 ) {
      if ( this.isStrictReservedWord(name) ) {
        this.syntaxError(("Parse error: '" + name) + "' cannot name a function whose body is strict");
      }
    }
    let i = 0;
    while (i < (params.length)) {
      const p = params[i];
      if ( (p.name.length) > 0 ) {
        if ( this.isStrictReservedWord(p.name) ) {
          this.syntaxError(("Parse error: '" + p.name) + "' cannot be a parameter of a strict function");
        }
        let j = 0;
        while (j < i) {
          const q = params[j];
          if ( q.name == p.name ) {
            this.syntaxError(("Parse error: duplicate parameter '" + p.name) + "' in a strict function");
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
  };
  hasUseStrictDirective () {
    let i = this.pos;
    const n = this.tokens.length;
    let scanning = true;
    while ((i < n) && scanning) {
      const t = this.tokens[i];
      if ( (t.tokenType == "LineComment") || (t.tokenType == "BlockComment") ) {
        i = i + 1;
      } else {
        if ( t.tokenType == "String" ) {
          if ( t.value == "use strict" ) {
            if ( t.hasEscape == false ) {
              return true;
            }
          }
          i = i + 1;
          if ( i < n ) {
            const semi = this.tokens[i];
            if ( semi.value == ";" ) {
              i = i + 1;
            }
          }
        } else {
          scanning = false;
        }
      }
    };
    return false;
  };
  isStrictReservedReference (word) {
    if ( word == "eval" ) {
      return false;
    }
    if ( word == "arguments" ) {
      return false;
    }
    return this.isStrictReservedWord(word);
  };
  isStrictReservedWord (word) {
    if ( word == "implements" ) {
      return true;
    }
    if ( word == "interface" ) {
      return true;
    }
    if ( word == "let" ) {
      return true;
    }
    if ( word == "package" ) {
      return true;
    }
    if ( word == "private" ) {
      return true;
    }
    if ( word == "protected" ) {
      return true;
    }
    if ( word == "public" ) {
      return true;
    }
    if ( word == "static" ) {
      return true;
    }
    if ( word == "yield" ) {
      return true;
    }
    if ( word == "eval" ) {
      return true;
    }
    if ( word == "arguments" ) {
      return true;
    }
    return false;
  };
  checkBindableName (name) {
    if ( this.isAlwaysReservedWord(name) ) {
      this.syntaxError(("Parse error: '" + name) + "' is a reserved word and cannot be used as a name");
      return;
    }
    if ( this.moduleMode ) {
      if ( name == "await" ) {
        this.syntaxError("Parse error: 'await' cannot be used as a name in a module");
      }
    }
    if ( this.strictMode ) {
      if ( this.isStrictReservedWord(name) ) {
        this.syntaxError(("Parse error: '" + name) + "' cannot be used as a name in strict mode");
      }
      return;
    }
    if ( this.inGenerator ) {
      if ( name == "yield" ) {
        this.syntaxError("Parse error: 'yield' cannot be used as a name inside a generator");
      }
    }
    if ( this.moduleMode ) {
      if ( name == "await" ) {
        this.syntaxError("Parse error: 'await' cannot be used as a name in a module");
      }
    }
    if ( this.declaringKind == "l" ) {
      if ( name == "let" ) {
        this.syntaxError("Parse error: 'let' cannot be the name of a lexical binding");
      }
    }
  };
  isAlwaysReservedWord (word) {
    if ( word == "break" ) {
      return true;
    }
    if ( word == "case" ) {
      return true;
    }
    if ( word == "catch" ) {
      return true;
    }
    if ( word == "class" ) {
      return true;
    }
    if ( word == "const" ) {
      return true;
    }
    if ( word == "continue" ) {
      return true;
    }
    if ( word == "debugger" ) {
      return true;
    }
    if ( word == "default" ) {
      return true;
    }
    if ( word == "delete" ) {
      return true;
    }
    if ( word == "do" ) {
      return true;
    }
    if ( word == "else" ) {
      return true;
    }
    if ( word == "enum" ) {
      return true;
    }
    if ( word == "export" ) {
      return true;
    }
    if ( word == "extends" ) {
      return true;
    }
    if ( word == "false" ) {
      return true;
    }
    if ( word == "finally" ) {
      return true;
    }
    if ( word == "for" ) {
      return true;
    }
    if ( word == "function" ) {
      return true;
    }
    if ( word == "if" ) {
      return true;
    }
    if ( word == "import" ) {
      return true;
    }
    if ( word == "in" ) {
      return true;
    }
    if ( word == "instanceof" ) {
      return true;
    }
    if ( word == "new" ) {
      return true;
    }
    if ( word == "null" ) {
      return true;
    }
    if ( word == "return" ) {
      return true;
    }
    if ( word == "super" ) {
      return true;
    }
    if ( word == "switch" ) {
      return true;
    }
    if ( word == "this" ) {
      return true;
    }
    if ( word == "throw" ) {
      return true;
    }
    if ( word == "true" ) {
      return true;
    }
    if ( word == "try" ) {
      return true;
    }
    if ( word == "typeof" ) {
      return true;
    }
    if ( word == "var" ) {
      return true;
    }
    if ( word == "void" ) {
      return true;
    }
    if ( word == "while" ) {
      return true;
    }
    if ( word == "with" ) {
      return true;
    }
    return false;
  };
  expectModuleExportName () {
    const tt = this.peekType();
    if ( ((((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null")) || (tt == "String") ) {
      const tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  };
  expectBindingName () {
    const tt = this.peekType();
    if ( (((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null") ) {
      const tok = this.peek();
      this.checkBindableName(tok.value);
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  };
  expect (expectedType) {
    const tok = this.peek();
    if ( tok.tokenType != expectedType ) {
      this.syntaxError((("Parse error: expected " + expectedType) + " but got ") + tok.tokenType);
    }
    this.advance();
    return tok;
  };
  expectValue (expectedValue) {
    const tok = this.peek();
    if ( tok.value != expectedValue ) {
      this.syntaxError(((("Parse error: expected '" + expectedValue) + "' but got '") + tok.value) + "'");
    }
    this.advance();
    return tok;
  };
  isAtEnd () {
    const t = this.peekType();
    return t == "EOF";
  };
  matchType (tokenType) {
    const t = this.peekType();
    return t == tokenType;
  };
  matchValue (value) {
    const t = this.peekType();
    if ( t == "String" ) {
      return false;
    }
    if ( t == "Template" ) {
      return false;
    }
    if ( t == "Regex" ) {
      return false;
    }
    const v = this.peekValue();
    return v == value;
  };
  matchPunct (value) {
    if ( this.peekType() != "Punctuator" ) {
      return false;
    }
    const v = this.peekValue();
    return v == value;
  };
  isNameToken () {
    const t = this.peekType();
    if ( t == "Identifier" ) {
      return true;
    }
    if ( t == "TSType" ) {
      return true;
    }
    if ( t == "Keyword" ) {
      return true;
    }
    if ( t == "TSKeyword" ) {
      return true;
    }
    if ( t == "Boolean" ) {
      return true;
    }
    if ( t == "Null" ) {
      return true;
    }
    return false;
  };
  isMemberKeyToken () {
    if ( this.isNameToken() ) {
      return true;
    }
    const t = this.peekType();
    if ( t == "Number" ) {
      return true;
    }
    if ( t == "String" ) {
      return true;
    }
    return false;
  };
  isAccessorNameAhead () {
    const nt = this.peekNextType();
    let keyish = false;
    if ( nt == "Identifier" ) {
      keyish = true;
    }
    if ( nt == "Keyword" ) {
      keyish = true;
    }
    if ( nt == "TSKeyword" ) {
      keyish = true;
    }
    if ( nt == "TSType" ) {
      keyish = true;
    }
    if ( nt == "String" ) {
      keyish = true;
    }
    if ( nt == "Number" ) {
      keyish = true;
    }
    if ( nt == "Boolean" ) {
      keyish = true;
    }
    if ( nt == "Null" ) {
      keyish = true;
    }
    if ( keyish == false ) {
      return false;
    }
    return this.peekAheadValue(2) == "(";
  };
  isObjectPropertyKeyToken () {
    if ( this.isNameToken() ) {
      return true;
    }
    const t = this.peekType();
    if ( t == "String" ) {
      return true;
    }
    if ( t == "Number" ) {
      return true;
    }
    if ( t == "Boolean" ) {
      return true;
    }
    if ( t == "Null" ) {
      return true;
    }
    return false;
  };
  parseMemberName () {
    if ( this.matchPunct("#") ) {
      this.advance();
      if ( this.isNameToken() ) {
        const ptok = this.peek();
        this.advance();
        const hashed = new Token();
        hashed.tokenType = ptok.tokenType;
        hashed.value = "#" + ptok.value;
        hashed.start = ptok.start;
        hashed.end = ptok.end;
        hashed.line = ptok.line;
        hashed.col = ptok.col;
        return hashed;
      }
    }
    if ( this.isNameToken() ) {
      const tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  };
  guardNoProgress (prevPos) {
    if ( this.pos != prevPos ) {
      return;
    }
    const recTok = this.peek();
    this.syntaxError(((("Parser recovery: skipping unexpected token '" + recTok.value) + "' (type ") + recTok.tokenType) + ")");
    if ( this.isAtEnd() == false ) {
      this.advance();
    }
  };
  parseProgram () {
    const prog = new TSNode();
    prog.nodeType = "Program";
    this.pushScope(true);
    if ( this.moduleMode ) {
      this.strictMode = true;
    }
    if ( this.hasUseStrictDirective() ) {
      this.strictMode = true;
    }
    this.atModuleTopLevel = true;
    while (this.isAtEnd() == false) {
      const beforePos = this.pos;
      this.atModuleTopLevel = true;
      const stmt = this.parseStatement();
      prog.children.push(stmt);
      this.guardNoProgress(beforePos);
    };
    this.atModuleTopLevel = false;
    if ( this.moduleMode ) {
      let ti = 0;
      while (ti < (this.tokens.length)) {
        const t = this.tokens[ti];
        if ( t.tokenType == "HtmlComment" ) {
          this.syntaxError("Parse error: HTML-like comments are not allowed in module code");
        }
        ti = ti + 1;
      };
    }
    this.checkPendingExportRefs();
    this.popScope();
    return prog;
  };
  isParameterInScope (name) {
    let i = 0;
    const total = this.scopeNames.length;
    while (i < total) {
      const entry = this.scopeNames[i];
      if ( (entry.substring(0, 1 )) == "p" ) {
        if ( (entry.substring(2, (entry.length) )) == name ) {
          return true;
        }
      }
      i = i + 1;
    };
    return false;
  };
  isDeclaredAnywhere (name) {
    let i = 0;
    const total = this.scopeNames.length;
    while (i < total) {
      const entry = this.scopeNames[i];
      if ( (entry.substring(2, (entry.length) )) == name ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  checkPendingExportRefs () {
    let i = 0;
    while (i < (this.pendingExportRefs.length)) {
      const name = this.pendingExportRefs[i];
      if ( this.isDeclaredAnywhere(name) == false ) {
        this.syntaxError(("Parse error: export of undeclared name '" + name) + "'");
      }
      i = i + 1;
    };
  };
  parseStatement () {
    const tokVal = this.peekValue();
    const tokType = this.peekType();
    if ( (tokType == "String") || ((tokType == "Number") || ((tokType == "Template") || ((tokType == "BigInt") || (tokType == "Regex")))) ) {
      return this.parseExprStmt();
    }
    if ( tokVal == "@" ) {
      let decorators = [];
      while (this.matchValue("@")) {
        const dec = this.parseDecorator();
        decorators.push(dec);
      };
      const decorated = this.parseStatement();
      decorated.decorators = decorators;
      return decorated;
    }
    if ( tokVal == "declare" ) {
      return this.parseDeclare();
    }
    if ( tokVal == "import" ) {
      const afterImport = this.peekNextValue();
      if ( (afterImport == "(") || (afterImport == ".") ) {
        return this.parseExprStmt();
      }
      if ( this.moduleMode == false ) {
        this.syntaxError("Parse error: an import declaration is only allowed in a module");
      }
      if ( this.atModuleTopLevel == false ) {
        this.syntaxError("Parse error: an import declaration must be at the top level of a module");
      }
      return this.parseImport();
    }
    if ( tokVal == "export" ) {
      if ( this.moduleMode == false ) {
        this.syntaxError("Parse error: an export declaration is only allowed in a module");
      }
      if ( this.atModuleTopLevel == false ) {
        this.syntaxError("Parse error: an export declaration must be at the top level of a module");
      }
      return this.parseExport();
    }
    if ( tokVal == "interface" ) {
      return this.parseInterface();
    }
    if ( tokVal == "type" ) {
      if ( this.peekNextType() == "Identifier" ) {
        return this.parseTypeAlias();
      }
    }
    if ( tokVal == "class" ) {
      if ( this.inSingleStatementBody ) {
        this.syntaxError("Parse error: a class declaration cannot be a statement body");
      }
      const classDecl = this.parseClass();
      if ( (classDecl.name.length) == 0 ) {
        if ( this.inExportDefault == false ) {
          this.syntaxError("Parse error: a class declaration needs a name");
        }
      }
      return classDecl;
    }
    if ( tokVal == "abstract" ) {
      const nextVal = this.peekNextValue();
      if ( nextVal == "class" ) {
        return this.parseClass();
      }
    }
    if ( tokVal == "enum" ) {
      return this.parseEnum();
    }
    if ( tokVal == "namespace" ) {
      return this.parseNamespace();
    }
    if ( tokVal == "const" ) {
      const nextVal_1 = this.peekNextValue();
      if ( nextVal_1 == "enum" ) {
        return this.parseEnum();
      }
    }
    if ( ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") ) {
      const afterKind = this.peekNextValue();
      const afterKindType = this.peekNextType();
      let startsBinding = false;
      if ( ((afterKindType == "Identifier") || (afterKindType == "TSType")) || (afterKindType == "TSKeyword") ) {
        startsBinding = true;
      }
      if ( afterKindType == "Keyword" ) {
        if ( (afterKind != "in") && (afterKind != "instanceof") ) {
          startsBinding = true;
        }
      }
      if ( afterKind == "{" ) {
        startsBinding = true;
      }
      if ( afterKind == "[" ) {
        startsBinding = true;
      }
      if ( tokVal != "let" ) {
        startsBinding = true;
      }
      if ( startsBinding ) {
        if ( this.inSingleStatementBody ) {
          if ( tokVal != "var" ) {
            this.syntaxError("Parse error: a lexical declaration cannot be a statement body");
          }
        }
        return this.parseVarDecl();
      }
    }
    if ( tokVal == "function" ) {
      if ( this.inSingleStatementBody ) {
        if ( this.strictMode ) {
          this.syntaxError("Parse error: a function declaration cannot be a statement body in strict mode");
        } else {
          if ( this.singleBodyIsIfBranch == false ) {
            this.syntaxError("Parse error: a function declaration cannot be a loop or with body");
          }
        }
      }
      return this.parseFuncDecl(false);
    }
    if ( tokVal == "async" ) {
      const nextVal_2 = this.peekNextValue();
      if ( nextVal_2 == "function" ) {
        const asyncTok = this.peek();
        const fnTok = this.tokens[(this.pos + 1)];
        if ( asyncTok.line == fnTok.line ) {
          this.advance();
          const asyncDecl = this.parseFuncDecl(true);
          asyncDecl.start = asyncTok.start;
          asyncDecl.line = asyncTok.line;
          asyncDecl.col = asyncTok.col;
          return asyncDecl;
        }
      }
    }
    if ( tokVal == "return" ) {
      return this.parseReturn();
    }
    if ( tokVal == "break" ) {
      return this.parseBreak();
    }
    if ( tokVal == "continue" ) {
      return this.parseContinue();
    }
    if ( tokVal == "throw" ) {
      return this.parseThrow();
    }
    if ( tokVal == "if" ) {
      return this.parseIfStatement();
    }
    if ( tokVal == "debugger" ) {
      const dbg = new TSNode();
      dbg.nodeType = "DebuggerStatement";
      const dbgTok = this.peek();
      dbg.start = dbgTok.start;
      dbg.line = dbgTok.line;
      dbg.col = dbgTok.col;
      this.advance();
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return dbg;
    }
    if ( tokVal == "with" ) {
      const withNode = new TSNode();
      withNode.nodeType = "WithStatement";
      const withTok = this.peek();
      withNode.start = withTok.start;
      withNode.line = withTok.line;
      withNode.col = withTok.col;
      if ( this.strictMode ) {
        this.syntaxError("Parse error: 'with' is not allowed in strict mode");
      }
      this.advance();
      this.expectValue("(");
      const withObj = this.parseExprSeq();
      withNode.left = withObj;
      this.expectValue(")");
      const savedWithBody = this.inSingleStatementBody;
      this.inSingleStatementBody = true;
      this.atModuleTopLevel = false;
      const withBody = this.parseStatement();
      this.inSingleStatementBody = savedWithBody;
      withNode.body = withBody;
      return withNode;
    }
    if ( tokVal == "while" ) {
      return this.parseWhileStatement();
    }
    if ( tokVal == "do" ) {
      return this.parseDoWhileStatement();
    }
    if ( tokVal == "for" ) {
      return this.parseForStatement();
    }
    if ( tokVal == "switch" ) {
      return this.parseSwitchStatement();
    }
    if ( tokVal == "try" ) {
      return this.parseTryStatement();
    }
    if ( tokVal == "{" ) {
      return this.parseBlock();
    }
    if ( tokVal == ";" ) {
      this.advance();
      const empty = new TSNode();
      empty.nodeType = "EmptyStatement";
      return empty;
    }
    const tokType_2 = this.peekType();
    if ( tokType_2 == "Identifier" ) {
      const nextVal_3 = this.peekNextValue();
      if ( nextVal_3 == ":" ) {
        return this.parseLabeledStatement();
      }
    }
    return this.parseExprStmt();
  };
  parseLabeledStatement () {
    const node = new TSNode();
    node.nodeType = "LabeledStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    const labelTok = this.expect("Identifier");
    node.name = labelTok.value;
    this.expectValue(":");
    const bodyStart = this.peekValue();
    if ( ((bodyStart == "let") || (bodyStart == "const")) || (bodyStart == "class") ) {
      this.syntaxError(("Parse error: '" + bodyStart) + "' declaration cannot be the body of a labelled statement");
    }
    if ( bodyStart == "function" ) {
      if ( this.inSingleStatementBody ) {
        this.syntaxError("Parse error: a labelled function declaration cannot be a statement body");
      }
      if ( this.strictMode ) {
        this.syntaxError("Parse error: a function declaration cannot be the body of a labelled statement in strict mode");
      } else {
        if ( this.peekNextValue() == "*" ) {
          this.syntaxError("Parse error: a generator declaration cannot be the body of a labelled statement");
        }
      }
    }
    if ( this.isInStringList(node.name, this.activeLabels) ) {
      this.syntaxError(("Parse error: label '" + node.name) + "' has already been declared");
    }
    this.activeLabels.push(node.name);
    let scanIdx = this.pos;
    const tokenTotal = this.tokens.length;
    let scanning = true;
    while (scanning) {
      const cur = this.tokens[scanIdx];
      if ( (cur.tokenType == "LineComment") || (cur.tokenType == "BlockComment") ) {
        scanIdx = scanIdx + 1;
      } else {
        let isName = false;
        if ( (cur.tokenType == "Identifier") || (cur.tokenType == "TSType") ) {
          isName = true;
        }
        if ( isName == false ) {
          scanning = false;
        } else {
          let nextIdx = scanIdx + 1;
          let sawColon = false;
          while (nextIdx < tokenTotal) {
            const nxt = this.tokens[nextIdx];
            if ( (nxt.tokenType == "LineComment") || (nxt.tokenType == "BlockComment") ) {
              nextIdx = nextIdx + 1;
            } else {
              if ( nxt.value == ":" ) {
                sawColon = true;
              }
              break;
            }
          };
          if ( sawColon ) {
            scanIdx = nextIdx + 1;
          } else {
            scanning = false;
          }
        }
      }
      if ( scanIdx >= tokenTotal ) {
        scanning = false;
      }
    };
    const labelledTok = this.tokens[scanIdx];
    const labelled = labelledTok.value;
    if ( ((labelled == "for") || (labelled == "while")) || (labelled == "do") ) {
      this.iterationLabels.push(node.name);
    }
    const body = this.parseStatement();
    node.body = body;
    this.activeLabels = this.listWithoutString(this.activeLabels, node.name);
    this.iterationLabels = this.listWithoutString(this.iterationLabels, node.name);
    return node;
  };
  isInStringList (value, list) {
    let i = 0;
    while (i < (list.length)) {
      if ( (list[i]) == value ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  listWithoutString (list, value) {
    let out = [];
    let i = 0;
    while (i < (list.length)) {
      const item = list[i];
      if ( item != value ) {
        out.push(item);
      }
      i = i + 1;
    };
    return out;
  };
  peekNextValue () {
    const nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      const nextTok = this.tokens[nextPos];
      return nextTok.value;
    }
    return "";
  };
  parseReturn () {
    const node = new TSNode();
    node.nodeType = "ReturnStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("return");
    if ( this.functionDepth == 0 ) {
      this.syntaxError("Parse error: 'return' outside of a function");
    }
    const v = this.peekValue();
    let argOnSameLine = true;
    const argTok = this.peek();
    if ( argTok.line != startTok.line ) {
      argOnSameLine = false;
    }
    if ( argOnSameLine && ((v != ";") && ((v != "}") && (this.isAtEnd() == false))) ) {
      const arg = this.parseExprSeq();
      node.left = arg;
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseBreak () {
    const node = new TSNode();
    node.nodeType = "BreakStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("break");
    if ( this.isNameToken() ) {
      const labelTok = this.peek();
      if ( labelTok.line == startTok.line ) {
        this.advance();
        node.name = labelTok.value;
      }
    }
    if ( (node.name.length) == 0 ) {
      if ( this.iterationDepth == 0 ) {
        if ( this.switchDepth == 0 ) {
          this.syntaxError("Parse error: 'break' outside of a loop or switch");
        }
      }
    } else {
      if ( this.isInStringList(node.name, this.activeLabels) == false ) {
        this.syntaxError(("Parse error: 'break " + node.name) + "' does not name an enclosing label");
      }
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseContinue () {
    const node = new TSNode();
    node.nodeType = "ContinueStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("continue");
    if ( this.isNameToken() ) {
      const labelTok = this.peek();
      if ( labelTok.line == startTok.line ) {
        this.advance();
        node.name = labelTok.value;
      }
    }
    if ( (node.name.length) == 0 ) {
      if ( this.iterationDepth == 0 ) {
        this.syntaxError("Parse error: 'continue' outside of a loop");
      }
    } else {
      if ( this.isInStringList(node.name, this.iterationLabels) == false ) {
        this.syntaxError(("Parse error: 'continue " + node.name) + "' does not name an enclosing loop");
      }
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseImport () {
    const node = new TSNode();
    node.nodeType = "ImportDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("import");
    if ( this.matchValue("type") ) {
      this.advance();
      node.kind = "type";
    }
    const v = this.peekValue();
    if ( this.peekType() == "String" ) {
      const bareStr = this.peek();
      this.advance();
      const bareSource = new TSNode();
      bareSource.nodeType = "StringLiteral";
      bareSource.value = bareStr.value;
      node.left = bareSource;
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "{" ) {
      this.advance();
      let specifiers = [];
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        const spec = new TSNode();
        spec.nodeType = "ImportSpecifier";
        if ( this.matchValue("type") ) {
          this.advance();
          spec.kind = "type";
        }
        const importedName = this.expectModuleExportName();
        spec.name = importedName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          const localName = this.expectBindingName();
          spec.value = localName.value;
        } else {
          spec.value = importedName.value;
        }
        this.checkBindableName(spec.value);
        this.declareBinding("l", spec.value);
        specifiers.push(spec);
        if ( this.matchValue(",") ) {
          this.advance();
        }
      };
      this.expectValue("}");
      node.children = specifiers;
    }
    if ( v == "*" ) {
      this.advance();
      this.expectValue("as");
      const namespaceName = this.expectBindingName();
      this.declareBinding("l", namespaceName.value);
      const nsSpec = new TSNode();
      nsSpec.nodeType = "ImportNamespaceSpecifier";
      nsSpec.name = namespaceName.value;
      node.children.push(nsSpec);
    }
    if ( this.matchType("Identifier") ) {
      const defaultSpec = new TSNode();
      defaultSpec.nodeType = "ImportDefaultSpecifier";
      const defaultName = this.expectBindingName();
      defaultSpec.name = defaultName.value;
      this.declareBinding("l", defaultName.value);
      node.children.push(defaultSpec);
      if ( this.matchValue(",") ) {
        this.advance();
        if ( this.matchValue("*") ) {
          this.advance();
          this.expectValue("as");
          const nsName = this.expectBindingName();
          this.declareBinding("l", nsName.value);
          const nsSpec2 = new TSNode();
          nsSpec2.nodeType = "ImportNamespaceSpecifier";
          nsSpec2.name = nsName.value;
          node.children.push(nsSpec2);
        }
        if ( this.matchValue("{") ) {
          this.advance();
          while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
            const spec_1 = new TSNode();
            spec_1.nodeType = "ImportSpecifier";
            const importedName_1 = this.expectModuleExportName();
            spec_1.name = importedName_1.value;
            if ( this.matchValue("as") ) {
              this.advance();
              const localName_1 = this.expectBindingName();
              spec_1.value = localName_1.value;
            } else {
              spec_1.value = importedName_1.value;
            }
            this.declareBinding("l", spec_1.value);
            node.children.push(spec_1);
            if ( this.matchValue(",") ) {
              this.advance();
            }
          };
          this.expectValue("}");
        }
      }
    }
    if ( this.matchValue("from") ) {
      this.advance();
      const sourceStr = this.expect("String");
      const source = new TSNode();
      source.nodeType = "StringLiteral";
      source.value = sourceStr.value;
      node.left = source;
    } else {
      if ( typeof(node.left) === "undefined" ) {
        this.syntaxError("Parse error: an import declaration needs a module specifier");
      }
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  registerExportedDeclaration (decl) {
    if ( decl.nodeType == "VariableDeclaration" ) {
      let i = 0;
      while (i < (decl.children.length)) {
        const d = decl.children[i];
        this.registerExportName(d.name);
        i = i + 1;
      };
      return;
    }
    this.registerExportName(decl.name);
  };
  registerExportName (name) {
    if ( (name.length) == 0 ) {
      return;
    }
    if ( this.isInStringList(name, this.exportedNames) ) {
      this.syntaxError(("Parse error: duplicate export of '" + name) + "'");
    }
    this.exportedNames.push(name);
  };
  parseExport () {
    const node = new TSNode();
    node.nodeType = "ExportNamedDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("export");
    if ( this.matchValue("type") ) {
      const nextV = this.peekNextValue();
      if ( nextV == "{" ) {
        this.advance();
        node.kind = "type";
      }
    }
    const v = this.peekValue();
    if ( v == "default" ) {
      node.nodeType = "ExportDefaultDeclaration";
      this.registerExportName("default");
      this.advance();
      const nextVal = this.peekValue();
      if ( ((nextVal == "class") || (nextVal == "function")) || (nextVal == "interface") ) {
        const savedExportDefault = this.inExportDefault;
        this.inExportDefault = true;
        const decl = this.parseStatement();
        this.inExportDefault = savedExportDefault;
        node.left = decl;
      } else {
        const expr = this.parseExpr();
        node.left = expr;
      }
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "{" ) {
      this.advance();
      let specifiers = [];
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        const spec = new TSNode();
        spec.nodeType = "ExportSpecifier";
        const localName = this.expectModuleExportName();
        spec.name = localName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          const exportedName = this.expectModuleExportName();
          spec.value = exportedName.value;
        } else {
          spec.value = localName.value;
        }
        this.registerExportName(spec.value);
        this.pendingExportRefs.push(localName.value);
        specifiers.push(spec);
        if ( this.matchValue(",") ) {
          this.advance();
        }
      };
      this.expectValue("}");
      node.children = specifiers;
      if ( this.matchValue("from") ) {
        this.advance();
        const sourceStr = this.expect("String");
        const source = new TSNode();
        source.nodeType = "StringLiteral";
        source.value = sourceStr.value;
        node.left = source;
        let emptyRefs = [];
        this.pendingExportRefs = emptyRefs;
      }
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "*" ) {
      node.nodeType = "ExportAllDeclaration";
      this.advance();
      if ( this.matchValue("as") ) {
        this.advance();
        const exportName = this.expect("Identifier");
        node.name = exportName.value;
      }
      this.expectValue("from");
      const sourceStr_1 = this.expect("String");
      const source_1 = new TSNode();
      source_1.nodeType = "StringLiteral";
      source_1.value = sourceStr_1.value;
      node.left = source_1;
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( ((((((((v == "function") || (v == "class")) || (v == "interface")) || (v == "type")) || (v == "var")) || (v == "const")) || (v == "let")) || (v == "enum")) || (v == "abstract") ) {
      const decl_1 = this.parseStatement();
      if ( (v == "function") || (v == "class") ) {
        if ( (decl_1.name.length) == 0 ) {
          this.syntaxError(("Parse error: an exported " + v) + " declaration needs a name");
        }
      }
      node.left = decl_1;
      this.registerExportedDeclaration(decl_1);
      return node;
    }
    if ( v == "async" ) {
      const decl_2 = this.parseStatement();
      node.left = decl_2;
      this.registerExportedDeclaration(decl_2);
      return node;
    }
    this.syntaxError(("Parse error: '" + v) + "' cannot follow 'export'");
    return node;
  };
  parseInterface () {
    const node = new TSNode();
    node.nodeType = "TSInterfaceDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("interface");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    if ( this.matchValue("extends") ) {
      this.advance();
      let extendsList = [];
      const extendsType = this.parseType();
      extendsList.push(extendsType);
      while (this.matchValue(",")) {
        this.advance();
        const nextType = this.parseType();
        extendsList.push(nextType);
      };
      for ( let i = 0; i < extendsList.length; i++) {
        var ext = extendsList[i];
        const wrapper = new TSNode();
        wrapper.nodeType = "TSExpressionWithTypeArguments";
        wrapper.left = ext;
        node.children.push(wrapper);
      };
    }
    const body = this.parseInterfaceBody();
    node.body = body;
    return node;
  };
  parseInterfaceBody () {
    const body = new TSNode();
    body.nodeType = "TSInterfaceBody";
    const startTok = this.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const prop = this.parsePropertySig();
      body.children.push(prop);
      if ( this.matchValue(";") || this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return body;
  };
  parseTypeParams () {
    let params = [];
    this.expectValue("<");
    while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
      if ( (params.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(">") ) {
          break;
        }
      }
      const param = new TSNode();
      param.nodeType = "TSTypeParameter";
      const nameTok = this.expect("Identifier");
      param.name = nameTok.value;
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if ( this.matchValue("extends") ) {
        this.advance();
        const constraint = this.parseType();
        param.typeAnnotation = constraint;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const defaultType = this.parseType();
        param.init = defaultType;
      }
      params.push(param);
    };
    this.expectValue(">");
    return params;
  };
  parsePropertySig () {
    const startTok = this.peek();
    const startPos = startTok.start;
    const startLine = startTok.line;
    const startCol = startTok.col;
    let isReadonly = false;
    if ( this.matchValue("readonly") ) {
      isReadonly = true;
      this.advance();
    }
    if ( this.matchValue("[") ) {
      this.advance();
      const paramTok = this.expect("Identifier");
      return this.parseIndexSignatureRest(isReadonly, paramTok, startPos, startLine, startCol);
    }
    if ( this.matchValue("(") ) {
      return this.parseCallSignature(startPos, startLine, startCol);
    }
    if ( this.matchValue("new") ) {
      return this.parseConstructSignature(startPos, startLine, startCol);
    }
    const prop = new TSNode();
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.readonly = isReadonly;
    const nameTok = this.expect("Identifier");
    prop.name = nameTok.value;
    if ( this.matchValue("?") ) {
      prop.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  };
  parseCallSignature (startPos, startLine, startCol) {
    const sig = new TSNode();
    sig.nodeType = "TSCallSignatureDeclaration";
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      sig.params = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (sig.children.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( (sig.children.length) > 0 ) {
            const lastP = sig.children[((sig.children.length) - 1)];
            if ( lastP.nodeType == "RestElement" ) {
              this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
            }
          }
          break;
        }
      }
      const param = this.parseParam();
      sig.children.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      sig.typeAnnotation = typeAnnot;
    }
    return sig;
  };
  parseConstructSignature (startPos, startLine, startCol) {
    const sig = new TSNode();
    sig.nodeType = "TSConstructSignatureDeclaration";
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    this.expectValue("new");
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      sig.params = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (sig.children.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( (sig.children.length) > 0 ) {
            const lastP = sig.children[((sig.children.length) - 1)];
            if ( lastP.nodeType == "RestElement" ) {
              this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
            }
          }
          break;
        }
      }
      const param = this.parseParam();
      sig.children.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      sig.typeAnnotation = typeAnnot;
    }
    return sig;
  };
  parseTypeAlias () {
    const node = new TSNode();
    node.nodeType = "TSTypeAliasDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("type");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    this.expectValue("=");
    const typeExpr = this.parseType();
    node.typeAnnotation = typeExpr;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseDecorator () {
    const node = new TSNode();
    node.nodeType = "Decorator";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("@");
    const expr = this.parsePostfix();
    node.left = expr;
    return node;
  };
  parseClass () {
    const node = new TSNode();
    node.nodeType = "ClassDeclaration";
    const asClassExpr = this.parsingClassExpression;
    this.parsingClassExpression = false;
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("abstract") ) {
      node.kind = "abstract";
      this.advance();
    }
    this.expectValue("class");
    let classNameFollows = this.isNameToken();
    if ( this.matchValue("extends") ) {
      classNameFollows = false;
    }
    if ( this.matchValue("implements") ) {
      classNameFollows = false;
    }
    if ( classNameFollows ) {
      const savedNameStrict = this.strictMode;
      this.strictMode = true;
      const nameTok = this.expectBindingName();
      this.strictMode = savedNameStrict;
      node.name = nameTok.value;
      if ( false == asClassExpr ) {
        this.declareBinding("l", nameTok.value);
      }
    }
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    const savedDerived = this.inDerivedClass;
    this.inDerivedClass = false;
    const savedClassStrictAll = this.strictMode;
    this.strictMode = true;
    if ( this.matchValue("extends") ) {
      this.inDerivedClass = true;
      this.advance();
      const superClass = this.parsePostfix();
      const extendsNode = new TSNode();
      extendsNode.nodeType = "TSExpressionWithTypeArguments";
      extendsNode.left = superClass;
      node.left = extendsNode;
    }
    if ( this.matchValue("implements") ) {
      this.advance();
      const impl = this.parseType();
      const implNode = new TSNode();
      implNode.nodeType = "TSExpressionWithTypeArguments";
      implNode.left = impl;
      node.children.push(implNode);
      while (this.matchValue(",")) {
        this.advance();
        const nextImpl = this.parseType();
        const nextImplNode = new TSNode();
        nextImplNode.nodeType = "TSExpressionWithTypeArguments";
        nextImplNode.left = nextImpl;
        node.children.push(nextImplNode);
      };
    }
    const body = this.parseClassBody();
    node.body = body;
    this.inDerivedClass = savedDerived;
    this.strictMode = savedClassStrictAll;
    return node;
  };
  parseClassBody () {
    const body = new TSNode();
    body.nodeType = "ClassBody";
    const startTok = this.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    this.expectValue("{");
    const savedClassStrict = this.strictMode;
    this.strictMode = true;
    let sawConstructor = false;
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      if ( this.matchValue(";") ) {
        this.advance();
      } else {
        const member = this.parseClassMember();
        if ( member.computed == false ) {
          let namesConstructor = false;
          if ( member.name == "constructor" ) {
            namesConstructor = true;
          }
          if ( member.kind == "constructor" ) {
            namesConstructor = true;
          }
          if ( namesConstructor ) {
            if ( member.kind != "static" ) {
              if ( member.nodeType == "MethodDefinition" ) {
                if ( sawConstructor ) {
                  this.syntaxError("Parse error: a class may only have one constructor");
                }
                sawConstructor = true;
              }
            }
          }
          if ( namesConstructor ) {
            if ( member.kind != "static" ) {
              if ( (member.kind == "get") || (member.kind == "set") ) {
                this.syntaxError("Parse error: a class constructor may not be an accessor");
              }
              if ( member.generator ) {
                this.syntaxError("Parse error: a class constructor may not be a generator");
              }
            }
          }
          if ( member.kind == "static" ) {
            if ( member.name == "prototype" ) {
              this.syntaxError("Parse error: a static class member may not be named 'prototype'");
            }
          }
        }
        body.children.push(member);
        if ( this.matchValue(";") ) {
          this.advance();
        } else {
          if ( member.nodeType == "PropertyDefinition" ) {
            if ( this.matchValue("}") == false ) {
              const nextMember = this.peek();
              if ( nextMember.line == this.lastTokenLine ) {
                this.syntaxError("Parse error: missing ';' between class members");
              }
            }
          }
        }
      }
    };
    this.strictMode = savedClassStrict;
    this.expectValue("}");
    return body;
  };
  parseClassMember () {
    const member = new TSNode();
    const startTok = this.peek();
    member.start = startTok.start;
    member.line = startTok.line;
    member.col = startTok.col;
    let decorators = [];
    while (this.matchValue("@")) {
      const dec = this.parseDecorator();
      decorators.push(dec);
    };
    if ( (decorators.length) > 0 ) {
      member.decorators = decorators;
    }
    let isStatic = false;
    let isAbstract = false;
    let isReadonly = false;
    let isAsync = false;
    let accessibility = "";
    let keepParsing = true;
    while (keepParsing) {
      const modifierStartPos = this.pos;
      const tokVal = this.peekValue();
      if ( tokVal == "public" ) {
        accessibility = "public";
        this.advance();
      }
      if ( tokVal == "private" ) {
        accessibility = "private";
        this.advance();
      }
      if ( tokVal == "protected" ) {
        accessibility = "protected";
        this.advance();
      }
      if ( tokVal == "static" ) {
        const afterStatic = this.peekNextValue();
        if ( (((afterStatic != "(") && (afterStatic != "=")) && (afterStatic != ";")) && (afterStatic != "}") ) {
          isStatic = true;
          this.advance();
          if ( this.matchValue("{") ) {
            member.nodeType = "StaticBlock";
            member.body = this.parseBlock();
            member.start = startTok.start;
            member.line = startTok.line;
            member.col = startTok.col;
            return member;
          }
        }
      }
      if ( tokVal == "abstract" ) {
        isAbstract = true;
        this.advance();
      }
      if ( tokVal == "readonly" ) {
        isReadonly = true;
        this.advance();
      }
      if ( tokVal == "async" ) {
        isAsync = true;
        this.advance();
      }
      const newTokVal = this.peekValue();
      if ( ((((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly")) && (newTokVal != "async") ) {
        keepParsing = false;
      }
      if ( newTokVal == "static" ) {
        if ( isStatic ) {
          const afterRepeat = this.peekNextValue();
          if ( (((afterRepeat != "(") && (afterRepeat != "=")) && (afterRepeat != ";")) && (afterRepeat != "}") ) {
            this.syntaxError("Parse error: 'static' may appear only once on a class member");
            keepParsing = false;
          }
        }
      }
      if ( this.pos == modifierStartPos ) {
        keepParsing = false;
      }
    };
    if ( this.matchValue("constructor") && (isStatic == false) ) {
      member.nodeType = "MethodDefinition";
      member.kind = "constructor";
      this.advance();
      this.pushScope(true);
      this.functionDepth = this.functionDepth + 1;
      const savedCtorRest = this.sawRestParam;
      this.sawRestParam = false;
      const savedCtorSuperCall = this.allowSuperCall;
      const savedCtorSuperProp = this.allowSuperProperty;
      const savedctorIter = this.iterationDepth;
      const savedctorSwitch = this.switchDepth;
      const savedctorLabels = this.activeLabels;
      const savedctorIterLabels = this.iterationLabels;
      let freshctorLabels = [];
      let freshctorIterLabels = [];
      this.iterationDepth = 0;
      this.switchDepth = 0;
      this.activeLabels = freshctorLabels;
      this.iterationLabels = freshctorIterLabels;
      this.allowSuperCall = this.inDerivedClass;
      this.allowSuperProperty = true;
      this.expectValue("(");
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (member.params.length) > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(")") ) {
            break;
          }
        }
        const param = this.parseConstructorParam();
        if ( (param.name.length) > 0 ) {
          this.declareBinding("p", param.name);
        }
        member.params.push(param);
      };
      this.expectValue(")");
      if ( this.matchValue("{") ) {
        this.suppressBlockScope = true;
        const bodyNode = this.parseBlock();
        member.body = bodyNode;
        member.end = bodyNode.end;
      }
      this.popScope();
      this.allowSuperCall = savedCtorSuperCall;
      this.allowSuperProperty = savedCtorSuperProp;
      this.sawRestParam = savedCtorRest;
      this.functionDepth = this.functionDepth - 1;
      this.iterationDepth = savedctorIter;
      this.switchDepth = savedctorSwitch;
      this.activeLabels = savedctorLabels;
      this.iterationLabels = savedctorIterLabels;
      return member;
    }
    let accessorKind = "";
    if ( this.matchValue("get") || this.matchValue("set") ) {
      const accessorWord = this.peekValue();
      const afterAccessor = this.peekNextValue();
      const afterAccessorType = this.peekNextType();
      let looksLikeAccessor = false;
      if ( ((((afterAccessorType == "Identifier") || (afterAccessorType == "TSType")) || (afterAccessorType == "Keyword")) || (afterAccessorType == "String")) || (afterAccessorType == "Number") ) {
        looksLikeAccessor = true;
      }
      if ( afterAccessor == "[" ) {
        looksLikeAccessor = true;
      }
      if ( afterAccessor == "#" ) {
        looksLikeAccessor = true;
      }
      if ( looksLikeAccessor ) {
        this.advance();
        accessorKind = accessorWord;
      }
    }
    if ( this.matchValue("*") ) {
      this.advance();
      member.generator = true;
    }
    if ( this.matchValue("#") ) {
      this.advance();
      member.value = "#";
    }
    if ( this.matchPunct("[") ) {
      this.advance();
      const keyExpr = this.parseExpr();
      this.expectValue("]");
      member.computed = true;
      member.init = keyExpr;
      member.right = keyExpr;
    } else {
      let nameTok = this.peek();
      if ( this.isMemberKeyToken() ) {
        this.advance();
      } else {
        nameTok = this.expect("Identifier");
      }
      if ( member.value == "#" ) {
        member.name = "#" + nameTok.value;
      } else {
        member.name = nameTok.value;
      }
    }
    if ( accessibility != "" ) {
      member.kind = accessibility;
    }
    member.readonly = isReadonly;
    if ( this.matchValue("?") ) {
      member.optional = true;
      this.advance();
    }
    if ( this.matchPunct("!") ) {
      if ( this.typeScriptMode ) {
        this.advance();
      }
    }
    if ( this.matchValue("(") ) {
      member.nodeType = "MethodDefinition";
      if ( isStatic ) {
        member.kind = "static";
      }
      if ( (accessorKind.length) > 0 ) {
        if ( isStatic == false ) {
          member.kind = accessorKind;
        }
        member.accessor = accessorKind;
      }
      if ( isAbstract ) {
        member.kind = "abstract";
      }
      if ( isAsync ) {
        member.async = true;
      }
      this.pushScope(true);
      const savedMethodRest = this.sawRestParam;
      this.sawRestParam = false;
      const savedMethodGenerator = this.inGenerator;
      this.inGenerator = member.generator;
      const savedMethodAsync = this.inAsync;
      this.inAsync = member.async;
      const savedMethodSuperCall = this.allowSuperCall;
      const savedMethodSuperProp = this.allowSuperProperty;
      const savedmethIter = this.iterationDepth;
      const savedmethSwitch = this.switchDepth;
      const savedmethLabels = this.activeLabels;
      const savedmethIterLabels = this.iterationLabels;
      let freshmethLabels = [];
      let freshmethIterLabels = [];
      this.iterationDepth = 0;
      this.switchDepth = 0;
      this.activeLabels = freshmethLabels;
      this.iterationLabels = freshmethIterLabels;
      this.functionDepth = this.functionDepth + 1;
      let isCtorNamed = false;
      if ( member.name == "constructor" ) {
        if ( isStatic == false ) {
          if ( member.computed == false ) {
            isCtorNamed = true;
          }
        }
      }
      if ( isCtorNamed ) {
        this.allowSuperCall = this.inDerivedClass;
      } else {
        this.allowSuperCall = false;
      }
      this.allowSuperProperty = true;
      this.expectValue("(");
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (member.params.length) > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(")") ) {
            if ( (member.params.length) > 0 ) {
              const lastP = member.params[((member.params.length) - 1)];
              if ( lastP.nodeType == "RestElement" ) {
                this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
              }
            }
            break;
          }
        }
        const param_1 = this.parseParam();
        if ( (param_1.name.length) > 0 ) {
          this.declareBinding("p", param_1.name);
        }
        member.params.push(param_1);
      };
      this.expectValue(")");
      if ( accessorKind == "get" ) {
        if ( (member.params.length) != 0 ) {
          this.syntaxError("Parse error: a getter takes no parameters");
        }
      }
      if ( accessorKind == "set" ) {
        if ( (member.params.length) != 1 ) {
          this.syntaxError("Parse error: a setter takes exactly one parameter");
        } else {
          const setP = member.params[0];
          if ( setP.nodeType == "RestElement" ) {
            this.syntaxError("Parse error: a setter parameter may not be a rest element");
          }
        }
      }
      if ( this.matchValue(":") ) {
        const returnType = this.parseTypeAnnotation();
        member.typeAnnotation = returnType;
      }
      if ( this.matchValue("{") ) {
        this.suppressBlockScope = true;
        const bodyNode_1 = this.parseBlock();
        member.body = bodyNode_1;
        member.end = bodyNode_1.end;
        if ( this.lastBlockEnabledStrict ) {
          this.recheckStrictSignature(member.name, member.params);
        }
      }
      this.popScope();
      this.allowSuperCall = savedMethodSuperCall;
      this.allowSuperProperty = savedMethodSuperProp;
      this.inGenerator = savedMethodGenerator;
      this.inAsync = savedMethodAsync;
      this.sawRestParam = savedMethodRest;
      this.functionDepth = this.functionDepth - 1;
      this.iterationDepth = savedmethIter;
      this.switchDepth = savedmethSwitch;
      this.activeLabels = savedmethLabels;
      this.iterationLabels = savedmethIterLabels;
    } else {
      member.nodeType = "PropertyDefinition";
      if ( this.ecmaVersion < 2022 ) {
        if ( this.typeScriptMode == false ) {
          this.syntaxError("Parse error: class fields need ES2022");
        }
      }
      if ( isStatic ) {
        member.kind = "static";
      }
      if ( this.matchValue(":") ) {
        if ( this.typeScriptMode == false ) {
          this.syntaxError("Parse error: a class field cannot carry a type annotation in JavaScript");
        }
        const typeAnnot = this.parseTypeAnnotation();
        member.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const initExpr = this.parseExprSeq();
        member.init = initExpr;
      }
    }
    return member;
  };
  parseConstructorParam () {
    const param = new TSNode();
    param.nodeType = "Parameter";
    const startTok = this.peek();
    param.start = startTok.start;
    param.line = startTok.line;
    param.col = startTok.col;
    const tokVal = this.peekValue();
    if ( (((tokVal == "public") || (tokVal == "private")) || (tokVal == "protected")) || (tokVal == "readonly") ) {
      param.kind = tokVal;
      this.advance();
      const nextVal = this.peekValue();
      if ( nextVal == "readonly" ) {
        param.readonly = true;
        this.advance();
      }
    }
    if ( this.matchValue("...") ) {
      this.advance();
      param.nodeType = "RestElement";
      param.kind = "rest";
      if ( this.sawRestParam ) {
        this.syntaxError("Parse error: a rest element must be the last parameter");
      }
      this.sawRestParam = true;
      this.restParamPending = true;
    }
    if ( this.matchValue("{") || this.matchValue("[") ) {
      const ctorPattern = this.parseBindingTarget();
      if ( this.matchValue(":") ) {
        const ctorPatType = this.parseTypeAnnotation();
        ctorPattern.typeAnnotation = ctorPatType;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const ctorDefault = this.parseExpr();
        const ctorAssign = new TSNode();
        ctorAssign.nodeType = "AssignmentPattern";
        ctorAssign.left = ctorPattern;
        ctorAssign.right = ctorDefault;
        return ctorAssign;
      }
      return ctorPattern;
    }
    const nameTok = this.expectBindingName();
    param.name = nameTok.value;
    if ( this.restParamPending ) {
      this.restParamPending = false;
      if ( this.matchValue("=") ) {
        this.syntaxError("Parse error: a rest parameter may not have a default");
      }
    }
    if ( this.matchValue("?") ) {
      param.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    if ( this.matchValue("=") ) {
      this.advance();
      const defaultVal = this.parseExpr();
      param.init = defaultVal;
    }
    return param;
  };
  parseEnum () {
    const node = new TSNode();
    node.nodeType = "TSEnumDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("const") ) {
      node.kind = "const";
      this.advance();
    }
    this.expectValue("enum");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const member = new TSNode();
      member.nodeType = "TSEnumMember";
      const memberTok = this.expect("Identifier");
      member.name = memberTok.value;
      member.start = memberTok.start;
      member.line = memberTok.line;
      member.col = memberTok.col;
      if ( this.matchValue("=") ) {
        this.advance();
        const initVal = this.parseExpr();
        member.init = initVal;
      }
      node.children.push(member);
      if ( this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return node;
  };
  parseNamespace () {
    const node = new TSNode();
    node.nodeType = "TSModuleDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("namespace");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("{");
    const body = new TSNode();
    body.nodeType = "TSModuleBlock";
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const beforePos = this.pos;
      const stmt = this.parseStatement();
      body.children.push(stmt);
      this.guardNoProgress(beforePos);
    };
    this.expectValue("}");
    node.body = body;
    return node;
  };
  parseDeclare () {
    const startTok = this.peek();
    this.expectValue("declare");
    const nextVal = this.peekValue();
    if ( nextVal == "module" ) {
      const node = new TSNode();
      node.nodeType = "TSModuleDeclaration";
      node.start = startTok.start;
      node.line = startTok.line;
      node.col = startTok.col;
      node.kind = "declare";
      this.advance();
      const nameTok = this.peek();
      if ( this.matchType("String") ) {
        this.advance();
        node.name = nameTok.value;
      } else {
        this.advance();
        node.name = nameTok.value;
      }
      this.expectValue("{");
      const body = new TSNode();
      body.nodeType = "TSModuleBlock";
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        const beforePos = this.pos;
        const stmt = this.parseStatement();
        body.children.push(stmt);
        this.guardNoProgress(beforePos);
      };
      this.expectValue("}");
      node.body = body;
      return node;
    }
    const node_1 = this.parseStatement();
    node_1.kind = "declare";
    return node_1;
  };
  parseIfStatement () {
    const node = new TSNode();
    node.nodeType = "IfStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("if");
    this.expectValue("(");
    const test = this.parseExprSeq();
    node.left = test;
    this.expectValue(")");
    const savedConsBody = this.inSingleStatementBody;
    const savedConsIf = this.singleBodyIsIfBranch;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.singleBodyIsIfBranch = true;
    this.atModuleTopLevel = false;
    const consequent = this.parseStatement();
    this.inSingleStatementBody = savedConsBody;
    this.singleBodyIsIfBranch = savedConsIf;
    node.body = consequent;
    if ( this.matchValue("else") ) {
      this.advance();
      const savedAltBody = this.inSingleStatementBody;
      const savedAltIf = this.singleBodyIsIfBranch;
      this.inSingleStatementBody = true;
      this.atModuleTopLevel = false;
      this.singleBodyIsIfBranch = true;
      const alternate = this.parseStatement();
      this.inSingleStatementBody = savedAltBody;
      this.singleBodyIsIfBranch = savedAltIf;
      node.right = alternate;
    }
    return node;
  };
  parseWhileStatement () {
    const node = new TSNode();
    node.nodeType = "WhileStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("while");
    this.expectValue("(");
    const test = this.parseExprSeq();
    node.left = test;
    this.expectValue(")");
    const savedBodyFlag0 = this.inSingleStatementBody;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.iterationDepth = this.iterationDepth + 1;
    const body = this.parseStatement();
    this.iterationDepth = this.iterationDepth - 1;
    this.inSingleStatementBody = savedBodyFlag0;
    node.body = body;
    return node;
  };
  parseDoWhileStatement () {
    const node = new TSNode();
    node.nodeType = "DoWhileStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("do");
    const savedBodyFlag1 = this.inSingleStatementBody;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.iterationDepth = this.iterationDepth + 1;
    const body = this.parseStatement();
    this.iterationDepth = this.iterationDepth - 1;
    this.inSingleStatementBody = savedBodyFlag1;
    node.body = body;
    this.expectValue("while");
    this.expectValue("(");
    const test = this.parseExprSeq();
    node.left = test;
    this.expectValue(")");
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseThrow () {
    const node = new TSNode();
    node.nodeType = "ThrowStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("throw");
    const throwArgTok = this.peek();
    if ( throwArgTok.line != this.lastTokenLine ) {
      this.syntaxError("Parse error: no line terminator is allowed after 'throw'");
    }
    if ( (this.isAtEnd() || (throwArgTok.value == ";")) || (throwArgTok.value == "}") ) {
      this.syntaxError("Parse error: 'throw' requires an argument");
    }
    const arg = this.parseExprSeq();
    node.left = arg;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  containsInOperator (node) {
    if ( node.nodeType == "BinaryExpression" ) {
      if ( node.value == "in" ) {
        return true;
      }
    }
    let i = 0;
    while (i < (node.children.length)) {
      const c = node.children[i];
      if ( this.containsInOperator(c) ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  parseForStatement () {
    const node = new TSNode();
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("for");
    let isAwait = false;
    if ( this.matchValue("await") ) {
      this.advance();
      isAwait = true;
    }
    this.expectValue("(");
    this.pushScope(false);
    const tokVal = this.peekValue();
    let headIsDecl = true;
    if ( tokVal == "let" ) {
      const afterLet = this.peekNextValue();
      if ( (((((afterLet == "in") || (afterLet == "of")) || (afterLet == "=")) || (afterLet == ";")) || (afterLet == ".")) || (afterLet == "(") ) {
        headIsDecl = false;
      }
    }
    if ( (((tokVal == "let") || (tokVal == "const")) || (tokVal == "var")) && headIsDecl ) {
      const kind = tokVal;
      this.advance();
      let headDeclKind = "v";
      if ( kind == "let" ) {
        headDeclKind = "l";
      }
      if ( kind == "const" ) {
        headDeclKind = "l";
      }
      const savedHeadDeclaring = this.declaringKind;
      this.declaringKind = headDeclKind;
      let hasPattern = false;
      let patternNode = new TSNode();
      let varNameStr = "";
      const bindTokVal = this.peekValue();
      if ( bindTokVal == "[" ) {
        hasPattern = true;
        patternNode = this.parseArrayPattern();
      } else {
        if ( bindTokVal == "{" ) {
          hasPattern = true;
          patternNode = this.parseObjectPattern();
        } else {
          const vt = this.expectBindingName();
          varNameStr = vt.value;
          if ( headDeclKind == "l" ) {
            if ( vt.value == "let" ) {
              this.syntaxError("Parse error: 'let' cannot be the name of a lexical binding");
            }
          }
          this.declareBinding(headDeclKind, vt.value);
        }
      }
      this.declaringKind = savedHeadDeclaring;
      const nextVal = this.peekValue();
      if ( nextVal == "of" ) {
        if ( (varNameStr.length) > 0 ) {
          if ( this.isParameterInScope(varNameStr) ) {
            this.syntaxError(("Parse error: '" + varNameStr) + "' shadows a parameter in a for-of head");
          }
        }
        node.nodeType = "ForOfStatement";
        node.await = isAwait;
        this.advance();
        const left = new TSNode();
        left.nodeType = "VariableDeclaration";
        left.kind = kind;
        const declarator = new TSNode();
        declarator.nodeType = "VariableDeclarator";
        if ( hasPattern ) {
          declarator.left = patternNode;
        } else {
          declarator.name = varNameStr;
        }
        left.children.push(declarator);
        node.left = left;
        const right = this.parseExpr();
        node.right = right;
        this.expectValue(")");
        const savedBodyFlag2 = this.inSingleStatementBody;
        this.inSingleStatementBody = true;
        this.atModuleTopLevel = false;
        this.iterationDepth = this.iterationDepth + 1;
        const body = this.parseStatement();
        this.iterationDepth = this.iterationDepth - 1;
        this.inSingleStatementBody = savedBodyFlag2;
        node.body = body;
        this.popScope();
        return node;
      }
      if ( nextVal == "in" ) {
        if ( (varNameStr.length) > 0 ) {
          if ( this.isParameterInScope(varNameStr) ) {
            this.syntaxError(("Parse error: '" + varNameStr) + "' shadows a parameter in a for-in head");
          }
        }
        node.nodeType = "ForInStatement";
        this.advance();
        const left_1 = new TSNode();
        left_1.nodeType = "VariableDeclaration";
        left_1.kind = kind;
        const declarator_1 = new TSNode();
        declarator_1.nodeType = "VariableDeclarator";
        if ( hasPattern ) {
          declarator_1.left = patternNode;
        } else {
          declarator_1.name = varNameStr;
        }
        left_1.children.push(declarator_1);
        node.left = left_1;
        const right_1 = this.parseExprSeq();
        node.right = right_1;
        this.expectValue(")");
        const savedBodyFlag3 = this.inSingleStatementBody;
        this.inSingleStatementBody = true;
        this.atModuleTopLevel = false;
        this.iterationDepth = this.iterationDepth + 1;
        const body_1 = this.parseStatement();
        this.iterationDepth = this.iterationDepth - 1;
        this.inSingleStatementBody = savedBodyFlag3;
        node.body = body_1;
        this.popScope();
        return node;
      }
      node.nodeType = "ForStatement";
      const initDecl = new TSNode();
      initDecl.nodeType = "VariableDeclaration";
      initDecl.kind = kind;
      const declarator_2 = new TSNode();
      declarator_2.nodeType = "VariableDeclarator";
      if ( hasPattern ) {
        declarator_2.left = patternNode;
      } else {
        declarator_2.name = varNameStr;
      }
      if ( this.matchValue(":") ) {
        const typeAnnot = this.parseTypeAnnotation();
        declarator_2.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const initVal = this.parseExpr();
        declarator_2.init = initVal;
      } else {
        if ( kind == "const" ) {
          this.syntaxError("Parse error: a 'const' declaration must have an initializer");
        }
      }
      initDecl.children.push(declarator_2);
      while (this.matchValue(",")) {
        this.advance();
        const more = new TSNode();
        more.nodeType = "VariableDeclarator";
        const savedMoreDeclaring = this.declaringKind;
        this.declaringKind = headDeclKind;
        const moreTarget = this.parseBindingTarget();
        this.declaringKind = savedMoreDeclaring;
        if ( moreTarget.nodeType == "Identifier" ) {
          more.name = moreTarget.name;
        } else {
          more.left = moreTarget;
        }
        if ( this.matchValue(":") ) {
          const moreType = this.parseTypeAnnotation();
          more.typeAnnotation = moreType;
        }
        if ( this.matchValue("=") ) {
          this.advance();
          const moreInit = this.parseExpr();
          more.init = moreInit;
        } else {
          if ( kind == "const" ) {
            this.syntaxError("Parse error: a 'const' declaration must have an initializer");
          }
        }
        initDecl.children.push(more);
      };
      node.init = initDecl;
    } else {
      node.nodeType = "ForStatement";
      if ( this.matchValue(";") == false ) {
        const initExpr = this.parseExpr();
        if ( this.matchValue("of") ) {
          node.nodeType = "ForOfStatement";
          node.await = isAwait;
          if ( tokVal == "let" ) {
            this.syntaxError("Parse error: a for-of head may not start with 'let'");
          }
          this.checkAssignmentTarget(initExpr);
          this.advance();
          node.left = initExpr;
          const ofRight = this.parseExpr();
          node.right = ofRight;
          this.expectValue(")");
          const savedBodyFlag4 = this.inSingleStatementBody;
          this.inSingleStatementBody = true;
          this.atModuleTopLevel = false;
          this.iterationDepth = this.iterationDepth + 1;
          const ofBody = this.parseStatement();
          this.iterationDepth = this.iterationDepth - 1;
          this.inSingleStatementBody = savedBodyFlag4;
          node.body = ofBody;
          this.popScope();
          return node;
        }
        if ( initExpr.nodeType == "BinaryExpression" ) {
          if ( initExpr.value == "in" ) {
            if ( this.matchValue(",") ) {
              if ( initExpr.parenthesized == false ) {
                const inSeq = new TSNode();
                inSeq.nodeType = "SequenceExpression";
                const inFirst = initExpr.right;
                inSeq.start = inFirst.start;
                inSeq.line = inFirst.line;
                inSeq.col = inFirst.col;
                inSeq.children.push(inFirst);
                while (this.matchValue(",")) {
                  this.advance();
                  inSeq.children.push(this.parseExpr());
                };
                initExpr.right = inSeq;
              }
            }
            if ( this.matchValue(")") ) {
              node.nodeType = "ForInStatement";
              if ( initExpr.parenthesized ) {
                this.syntaxError("Parse error: the 'in' operator is not allowed in a for-initialiser");
              }
              const inLeft = initExpr.left;
              this.checkAssignmentTarget(inLeft);
              node.left = inLeft;
              node.right = initExpr.right;
              this.expectValue(")");
              const savedBodyFlag5 = this.inSingleStatementBody;
              this.inSingleStatementBody = true;
              this.atModuleTopLevel = false;
              this.iterationDepth = this.iterationDepth + 1;
              const inBody = this.parseStatement();
              this.iterationDepth = this.iterationDepth - 1;
              this.inSingleStatementBody = savedBodyFlag5;
              node.body = inBody;
              this.popScope();
              return node;
            }
          }
        }
        if ( this.containsInOperator(initExpr) ) {
          this.syntaxError("Parse error: the 'in' operator is not allowed in a for-initialiser");
        }
        if ( this.matchValue(",") ) {
          const seq = new TSNode();
          seq.nodeType = "SequenceExpression";
          seq.start = initExpr.start;
          seq.line = initExpr.line;
          seq.col = initExpr.col;
          seq.children.push(initExpr);
          while (this.matchValue(",")) {
            this.advance();
            const more_1 = this.parseExpr();
            seq.children.push(more_1);
          };
          node.init = seq;
        } else {
          node.init = initExpr;
        }
      }
    }
    this.expectValue(";");
    if ( this.matchValue(";") == false ) {
      const test = this.parseExprSeq();
      node.left = test;
    }
    this.expectValue(";");
    if ( this.matchValue(")") == false ) {
      const update = this.parseExprSeq();
      node.right = update;
    }
    this.expectValue(")");
    const savedBodyFlag6 = this.inSingleStatementBody;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.iterationDepth = this.iterationDepth + 1;
    const body_2 = this.parseStatement();
    this.iterationDepth = this.iterationDepth - 1;
    this.inSingleStatementBody = savedBodyFlag6;
    node.body = body_2;
    this.popScope();
    return node;
  };
  parseSwitchStatement () {
    const node = new TSNode();
    node.nodeType = "SwitchStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("switch");
    this.expectValue("(");
    const discriminant = this.parseExprSeq();
    node.left = discriminant;
    this.expectValue(")");
    this.expectValue("{");
    this.switchDepth = this.switchDepth + 1;
    let sawDefaultClause = false;
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const caseNode = new TSNode();
      if ( this.matchValue("default") ) {
        if ( sawDefaultClause ) {
          this.syntaxError("Parse error: a switch may have only one default clause");
        }
        sawDefaultClause = true;
      }
      if ( this.matchValue("case") ) {
        caseNode.nodeType = "SwitchCase";
        this.advance();
        this.caseTestDepth = this.caseTestDepth + 1;
        const test = this.parseExprSeq();
        this.caseTestDepth = this.caseTestDepth - 1;
        caseNode.left = test;
        this.expectValue(":");
      }
      if ( this.matchValue("default") ) {
        caseNode.nodeType = "SwitchCase";
        caseNode.kind = "default";
        this.advance();
        this.expectValue(":");
      }
      while ((((this.matchValue("case") == false) && (this.matchValue("default") == false)) && (this.matchValue("}") == false)) && (this.isAtEnd() == false)) {
        const beforePos = this.pos;
        const stmt = this.parseStatement();
        caseNode.children.push(stmt);
        this.guardNoProgress(beforePos);
      };
      node.children.push(caseNode);
    };
    this.switchDepth = this.switchDepth - 1;
    this.expectValue("}");
    return node;
  };
  parseTryStatement () {
    const node = new TSNode();
    node.nodeType = "TryStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("try");
    const tryBlock = this.parseBlock();
    node.body = tryBlock;
    if ( this.matchValue("catch") ) {
      const catchNode = new TSNode();
      catchNode.nodeType = "CatchClause";
      this.advance();
      this.pushScope(false);
      if ( this.matchValue("(") ) {
        this.advance();
        const savedCatchDeclaring = this.declaringKind;
        this.declaringKind = "p";
        const param = this.parseBindingTarget();
        this.declaringKind = savedCatchDeclaring;
        catchNode.name = param.name;
        catchNode.left = param;
        if ( this.matchValue(":") ) {
          const typeAnnot = this.parseTypeAnnotation();
          catchNode.typeAnnotation = typeAnnot;
        }
        this.expectValue(")");
      }
      this.suppressBlockScope = true;
      const catchBlock = this.parseBlock();
      catchNode.body = catchBlock;
      this.popScope();
      node.left = catchNode;
    }
    let sawHandler = false;
    if ( (typeof(node.left) === "undefined") == false ) {
      sawHandler = true;
    }
    if ( this.matchValue("finally") ) {
      this.advance();
      const finallyBlock = this.parseBlock();
      node.right = finallyBlock;
      sawHandler = true;
    }
    if ( sawHandler == false ) {
      this.syntaxError("Parse error: 'try' requires a catch or a finally clause");
    }
    return node;
  };
  parseVarDecl () {
    const node = new TSNode();
    node.nodeType = "VariableDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    node.kind = startTok.value;
    this.advance();
    let moreDecls = true;
    while (moreDecls) {
      const declarator = new TSNode();
      declarator.nodeType = "VariableDeclarator";
      const nextVal = this.peekValue();
      let declKind = "v";
      if ( node.kind == "let" ) {
        declKind = "l";
      }
      if ( node.kind == "const" ) {
        declKind = "l";
      }
      const savedVarDeclaring = this.declaringKind;
      this.declaringKind = declKind;
      const savedVarMemberTarget = this.patternAllowsMemberTarget;
      this.patternAllowsMemberTarget = false;
      if ( nextVal == "{" ) {
        const pattern = this.parseObjectPattern();
        declarator.left = pattern;
        declarator.start = pattern.start;
        declarator.line = pattern.line;
        declarator.col = pattern.col;
      } else {
        if ( nextVal == "[" ) {
          const pattern_1 = this.parseArrayPattern();
          declarator.left = pattern_1;
          declarator.start = pattern_1.start;
          declarator.line = pattern_1.line;
          declarator.col = pattern_1.col;
        } else {
          const nameTok = this.expectBindingName();
          declarator.name = nameTok.value;
          declarator.start = nameTok.start;
          declarator.line = nameTok.line;
          declarator.col = nameTok.col;
          this.declareBinding(declKind, nameTok.value);
        }
      }
      this.declaringKind = savedVarDeclaring;
      this.patternAllowsMemberTarget = savedVarMemberTarget;
      if ( this.matchValue(":") ) {
        const typeAnnot = this.parseTypeAnnotation();
        declarator.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const initExpr = this.parseExpr();
        declarator.init = initExpr;
      }
      if ( typeof(declarator.init) === "undefined" ) {
        if ( typeof(declarator.left) != "undefined" ) {
          if ( typeof(declarator.typeAnnotation) === "undefined" ) {
            this.syntaxError("Parse error: a destructuring declaration must have an initializer");
          }
        }
      }
      if ( node.kind == "const" ) {
        if ( typeof(declarator.init) === "undefined" ) {
          if ( typeof(declarator.typeAnnotation) === "undefined" ) {
            this.syntaxError("Parse error: a 'const' declaration must have an initializer");
          }
        }
      }
      node.children.push(declarator);
      if ( this.matchValue(",") ) {
        this.advance();
      } else {
        moreDecls = false;
      }
    };
    if ( this.matchValue(";") ) {
      this.advance();
    } else {
      if ( this.isAtEnd() == false ) {
        const afterDecl = this.peek();
        if ( afterDecl.value != "}" ) {
          if ( afterDecl.line == this.lastTokenLine ) {
            this.syntaxError("Parse error: missing ';' after a declaration");
          }
        }
      }
    }
    return node;
  };
  isAssignmentPatternFollow () {
    if ( this.matchValue("=") ) {
      return true;
    }
    if ( this.matchValue("in") ) {
      return true;
    }
    if ( this.matchValue("of") ) {
      return true;
    }
    return false;
  };
  parseBindingTarget () {
    if ( this.matchValue("{") ) {
      return this.parseObjectPattern();
    }
    if ( this.matchValue("[") ) {
      return this.parseArrayPattern();
    }
    if ( this.patternAllowsMemberTarget ) {
      const lhs = this.parsePostfix();
      if ( this.strictMode ) {
        if ( lhs.nodeType == "Identifier" ) {
          if ( (lhs.name == "eval") || (lhs.name == "arguments") ) {
            this.syntaxError(("Parse error: cannot assign to '" + lhs.name) + "' in strict mode");
          }
        }
      }
      const lt = lhs.nodeType;
      if ( (((((lt != "Identifier") && (lt != "MemberExpression")) && (lt != "ArrayPattern")) && (lt != "ObjectPattern")) && (lt != "ArrayExpression")) && (lt != "ObjectExpression") ) {
        this.syntaxError(("Parse error: '" + lt) + "' is not a valid destructuring target");
      }
      return lhs;
    }
    const tok = this.peek();
    const tt = this.peekType();
    if ( (((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword") ) {
      this.checkBindableName(tok.value);
      this.advance();
      const id = new TSNode();
      id.nodeType = "Identifier";
      id.name = tok.value;
      if ( (this.declaringKind.length) > 0 ) {
        this.declareBinding(this.declaringKind, tok.value);
      }
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id;
    }
    const bad = this.expect("Identifier");
    const errId = new TSNode();
    errId.nodeType = "Identifier";
    errId.name = bad.value;
    return errId;
  };
  parseBindingElement () {
    const target = this.parseBindingTarget();
    if ( this.matchValue("=") ) {
      this.advance();
      const savedDeclaring = this.declaringKind;
      const wasLexical = savedDeclaring == "l";
      this.declaringKind = "";
      const savedNoLet = this.noLetReference;
      if ( wasLexical ) {
        this.noLetReference = true;
      }
      const defaultExpr = this.parseExpr();
      this.noLetReference = savedNoLet;
      this.declaringKind = savedDeclaring;
      const assignPat = new TSNode();
      assignPat.nodeType = "AssignmentPattern";
      assignPat.left = target;
      assignPat.right = defaultExpr;
      assignPat.start = target.start;
      assignPat.line = target.line;
      assignPat.col = target.col;
      return assignPat;
    }
    return target;
  };
  parseObjectPattern () {
    const node = new TSNode();
    node.nodeType = "ObjectPattern";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      if ( (node.children.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue("}") ) {
          break;
        }
      }
      if ( this.matchPunct(",") ) {
        this.syntaxError("Parse error: an object pattern may not contain an elision");
        this.advance();
      }
      if ( this.matchValue("...") ) {
        this.advance();
        const restProp = new TSNode();
        restProp.nodeType = "RestElement";
        const restTarget = this.parseBindingTarget();
        restProp.left = restTarget;
        restProp.name = restTarget.name;
        node.children.push(restProp);
      } else {
        const prop = new TSNode();
        prop.nodeType = "Property";
        if ( this.matchPunct("[") ) {
          this.advance();
          const savedKeyDeclaring = this.declaringKind;
          this.declaringKind = "";
          const keyExpr = this.parseExpr();
          this.declaringKind = savedKeyDeclaring;
          this.expectValue("]");
          prop.computed = true;
          prop.body = keyExpr;
          this.expectValue(":");
          prop.right = this.parseBindingElement();
        } else {
          const keyTok = this.peek();
          const keyType = this.peekType();
          if ( (keyType == "String") || (keyType == "Number") ) {
            this.advance();
            prop.name = keyTok.value;
          } else {
            const idTok = this.parseMemberName();
            prop.name = idTok.value;
          }
          if ( this.matchValue(":") ) {
            this.advance();
            prop.right = this.parseBindingElement();
          } else {
            prop.shorthand = true;
            if ( (keyType == "String") || (keyType == "Number") ) {
              this.syntaxError("Parse error: a shorthand property name cannot be a literal");
            }
            if ( this.isAlwaysReservedWord(prop.name) ) {
              this.syntaxError(("Parse error: '" + prop.name) + "' cannot be a shorthand property name");
            }
            if ( (this.declaringKind.length) > 0 ) {
              this.checkBindableName(prop.name);
              this.declareBinding(this.declaringKind, prop.name);
            } else {
              if ( this.strictMode ) {
                if ( (prop.name == "eval") || (prop.name == "arguments") ) {
                  this.syntaxError(("Parse error: cannot assign to '" + prop.name) + "' in strict mode");
                }
              }
            }
            if ( this.matchValue("=") ) {
              this.advance();
              const defaultExpr = this.parseExpr();
              prop.init = defaultExpr;
              prop.left = defaultExpr;
            }
          }
        }
        node.children.push(prop);
      }
    };
    this.expectValue("}");
    return node;
  };
  parseArrayPattern () {
    const node = new TSNode();
    node.nodeType = "ArrayPattern";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( (node.children.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue("]") ) {
          break;
        }
      }
      if ( this.matchValue(",") ) {
        const hole = new TSNode();
        hole.nodeType = "Elision";
        node.children.push(hole);
      } else {
        if ( this.matchValue("...") ) {
          this.advance();
          const restElem = new TSNode();
          restElem.nodeType = "RestElement";
          const restTarget = this.parseBindingTarget();
          restElem.left = restTarget;
          restElem.name = restTarget.name;
          if ( this.matchValue("=") ) {
            this.syntaxError("Parse error: a rest element may not have a default");
          }
          if ( this.matchValue(",") ) {
            this.syntaxError("Parse error: a rest element must be last in an array pattern");
          }
          node.children.push(restElem);
        } else {
          node.children.push(this.parseBindingElement());
        }
      }
    };
    this.expectValue("]");
    return node;
  };
  parseFuncDecl (isAsync) {
    const node = new TSNode();
    node.nodeType = "FunctionDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( isAsync ) {
      node.async = true;
    }
    this.expectValue("function");
    if ( this.matchValue("*") ) {
      this.advance();
      node.generator = true;
    }
    const savedGenerator = this.inGenerator;
    const savedAsync = this.inAsync;
    const isFnExpression = this.parsingFunctionExpression;
    this.parsingFunctionExpression = false;
    if ( isFnExpression ) {
      this.inGenerator = node.generator;
      this.inAsync = node.async;
    }
    if ( this.matchValue("(") == false ) {
      const nameTok = this.expectBindingName();
      node.name = nameTok.value;
    }
    this.inGenerator = node.generator;
    this.inAsync = node.async;
    this.pushScope(true);
    this.functionDepth = this.functionDepth + 1;
    const savedRest = this.sawRestParam;
    this.sawRestParam = false;
    const savedSuperCall = this.allowSuperCall;
    const savedSuperProp = this.allowSuperProperty;
    const savedfnIter = this.iterationDepth;
    const savedfnSwitch = this.switchDepth;
    const savedfnLabels = this.activeLabels;
    const savedfnIterLabels = this.iterationLabels;
    let freshfnLabels = [];
    let freshfnIterLabels = [];
    this.iterationDepth = 0;
    this.switchDepth = 0;
    this.activeLabels = freshfnLabels;
    this.iterationLabels = freshfnIterLabels;
    this.allowSuperCall = false;
    this.allowSuperProperty = false;
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      for ( let i = 0; i < typeParams.length; i++) {
        var tp = typeParams[i];
        node.children.push(tp);
      };
    }
    const savedAsyncParams = this.inAsyncParams;
    this.inAsyncParams = node.async;
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (node.params.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( (node.params.length) > 0 ) {
            const lastP = node.params[((node.params.length) - 1)];
            if ( lastP.nodeType == "RestElement" ) {
              this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
            }
          }
          break;
        }
      }
      const param = this.parseParam();
      this.declareParam(param);
      node.params.push(param);
    };
    this.expectValue(")");
    this.inAsyncParams = false;
    if ( this.matchValue(":") ) {
      const returnType = this.parseTypeAnnotation();
      node.typeAnnotation = returnType;
    }
    this.checkNonSimpleParamDuplicates(node.params);
    if ( this.matchValue("{") ) {
      this.suppressBlockScope = true;
      const body = this.parseBlock();
      node.body = body;
      node.end = body.end;
      if ( this.lastBlockEnabledStrict ) {
        this.recheckStrictSignature(node.name, node.params);
      }
    } else {
      node.kind = "overload";
      if ( this.matchValue(";") ) {
        this.advance();
      } else {
        const afterSig = this.peek();
        if ( this.isAtEnd() == false ) {
          if ( afterSig.line == this.lastTokenLine ) {
            this.syntaxError("Parse error: a function declaration needs a body");
          }
        }
      }
    }
    this.popScope();
    if ( node.kind != "overload" ) {
      this.declareBinding("f", node.name);
    }
    this.allowSuperCall = savedSuperCall;
    this.allowSuperProperty = savedSuperProp;
    this.inGenerator = savedGenerator;
    this.inAsync = savedAsync;
    this.inAsyncParams = savedAsyncParams;
    this.sawRestParam = savedRest;
    this.functionDepth = this.functionDepth - 1;
    this.iterationDepth = savedfnIter;
    this.switchDepth = savedfnSwitch;
    this.activeLabels = savedfnLabels;
    this.iterationLabels = savedfnIterLabels;
    return node;
  };
  parseParam () {
    const savedParamCtx = this.inParamList;
    this.inParamList = true;
    const result = this.parseParamInner();
    this.inParamList = savedParamCtx;
    return result;
  };
  parseParamInner () {
    let decorators = [];
    while (this.matchValue("@")) {
      const dec = this.parseDecorator();
      decorators.push(dec);
    };
    let isRest = false;
    if ( this.matchValue("...") ) {
      this.advance();
      isRest = true;
    }
    if ( this.sawRestParam ) {
      this.syntaxError("Parse error: a rest element must be the last parameter");
    }
    if ( isRest ) {
      this.sawRestParam = true;
      this.restParamPending = true;
    }
    if ( this.matchValue("{") ) {
      const savedParamDeclaring = this.declaringKind;
      this.declaringKind = "p";
      const pattern = this.parseObjectPattern();
      this.declaringKind = savedParamDeclaring;
      for ( let i = 0; i < decorators.length; i++) {
        var d = decorators[i];
        pattern.decorators.push(d);
      };
      if ( isRest ) {
        const restElem = new TSNode();
        restElem.nodeType = "RestElement";
        restElem.left = pattern;
        return restElem;
      }
      if ( this.matchValue(":") ) {
        const patType = this.parseTypeAnnotation();
        pattern.typeAnnotation = patType;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const patDefault = this.parseExpr();
        const patAssign = new TSNode();
        patAssign.nodeType = "AssignmentPattern";
        patAssign.left = pattern;
        patAssign.right = patDefault;
        return patAssign;
      }
      return pattern;
    }
    if ( this.matchValue("[") ) {
      const savedParamDeclaring_1 = this.declaringKind;
      this.declaringKind = "p";
      const pattern_1 = this.parseArrayPattern();
      this.declaringKind = savedParamDeclaring_1;
      for ( let i_1 = 0; i_1 < decorators.length; i_1++) {
        var d_1 = decorators[i_1];
        pattern_1.decorators.push(d_1);
      };
      if ( isRest ) {
        const restElem_1 = new TSNode();
        restElem_1.nodeType = "RestElement";
        restElem_1.left = pattern_1;
        return restElem_1;
      }
      if ( this.matchValue(":") ) {
        const patType_1 = this.parseTypeAnnotation();
        pattern_1.typeAnnotation = patType_1;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const patDefault_1 = this.parseExpr();
        const patAssign_1 = new TSNode();
        patAssign_1.nodeType = "AssignmentPattern";
        patAssign_1.left = pattern_1;
        patAssign_1.right = patDefault_1;
        return patAssign_1;
      }
      return pattern_1;
    }
    const param = new TSNode();
    if ( isRest ) {
      param.nodeType = "RestElement";
      param.kind = "rest";
    } else {
      param.nodeType = "Parameter";
    }
    for ( let i_2 = 0; i_2 < decorators.length; i_2++) {
      var d_2 = decorators[i_2];
      param.decorators.push(d_2);
    };
    const nameTok = this.expectBindingName();
    param.name = nameTok.value;
    param.start = nameTok.start;
    param.line = nameTok.line;
    param.col = nameTok.col;
    if ( this.matchValue("?") ) {
      param.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    if ( this.matchValue("=") ) {
      if ( isRest ) {
        this.syntaxError("Parse error: a rest parameter may not have a default");
      }
      this.advance();
      const savedInParams = this.inParamList;
      this.inParamList = true;
      param.init = this.parseExpr();
      this.inParamList = savedInParams;
    }
    return param;
  };
  parseBlock () {
    const savedTernaryDepth = this.ternaryConsequentDepth;
    this.ternaryConsequentDepth = 0;
    const savedCaseDepth = this.caseTestDepth;
    this.caseTestDepth = 0;
    const block = new TSNode();
    block.nodeType = "BlockStatement";
    const startTok = this.peek();
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    this.expectValue("{");
    const savedSingleBody = this.inSingleStatementBody;
    this.inSingleStatementBody = false;
    let ownScope = true;
    if ( this.suppressBlockScope ) {
      ownScope = false;
      this.suppressBlockScope = false;
    }
    if ( ownScope ) {
      this.pushScope(false);
    }
    const savedStrict = this.strictMode;
    let myStrictDirective = false;
    this.lastBlockEnabledStrict = false;
    if ( ownScope == false ) {
      if ( this.hasUseStrictDirective() ) {
        if ( savedStrict == false ) {
          myStrictDirective = true;
        }
        this.strictMode = true;
      }
    }
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const beforePos = this.pos;
      this.atModuleTopLevel = false;
      const stmt = this.parseStatement();
      block.children.push(stmt);
      this.guardNoProgress(beforePos);
    };
    if ( ownScope ) {
      this.popScope();
    }
    this.lastBlockEnabledStrict = myStrictDirective;
    this.strictMode = savedStrict;
    this.inSingleStatementBody = savedSingleBody;
    const closeTok = this.peek();
    block.end = closeTok.end;
    this.expectValue("}");
    this.ternaryConsequentDepth = savedTernaryDepth;
    this.caseTestDepth = savedCaseDepth;
    return block;
  };
  parseExprStmt () {
    const stmt = new TSNode();
    stmt.nodeType = "ExpressionStatement";
    const startTok = this.peek();
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    const expr = this.parseExprSeq();
    stmt.left = expr;
    if ( this.matchValue(";") ) {
      this.advance();
    } else {
      if ( this.isAtEnd() == false ) {
        const nextTok = this.peek();
        if ( nextTok.value != "}" ) {
          if ( nextTok.line == this.lastTokenLine ) {
            this.syntaxError("Parse error: missing ';' between statements");
          }
        }
      }
    }
    return stmt;
  };
  parseTypeAnnotation () {
    const annot = new TSNode();
    annot.nodeType = "TSTypeAnnotation";
    const startTok = this.peek();
    annot.start = startTok.start;
    annot.line = startTok.line;
    annot.col = startTok.col;
    this.expectValue(":");
    const nextVal = this.peekValue();
    if ( nextVal == "asserts" ) {
      const assertsTok = this.peek();
      this.advance();
      const predicate = new TSNode();
      predicate.nodeType = "TSTypePredicate";
      predicate.start = assertsTok.start;
      predicate.line = assertsTok.line;
      predicate.col = assertsTok.col;
      predicate.value = "asserts";
      const paramTok = this.expect("Identifier");
      predicate.name = paramTok.value;
      if ( this.matchValue("is") ) {
        this.advance();
        const assertType = this.parseType();
        predicate.typeAnnotation = assertType;
      }
      annot.typeAnnotation = predicate;
      return annot;
    }
    if ( this.matchType("Identifier") ) {
      const savedPos = this.pos;
      const savedTok = this.currentToken;
      const paramTok_1 = this.peek();
      this.advance();
      if ( this.matchValue("is") ) {
        this.advance();
        const predicate_1 = new TSNode();
        predicate_1.nodeType = "TSTypePredicate";
        predicate_1.start = paramTok_1.start;
        predicate_1.line = paramTok_1.line;
        predicate_1.col = paramTok_1.col;
        predicate_1.name = paramTok_1.value;
        const typeExpr = this.parseType();
        predicate_1.typeAnnotation = typeExpr;
        annot.typeAnnotation = predicate_1;
        return annot;
      }
      this.pos = savedPos;
      this.currentToken = savedTok;
    }
    const typeExpr_1 = this.parseType();
    annot.typeAnnotation = typeExpr_1;
    return annot;
  };
  parseType () {
    return this.parseConditionalType();
  };
  parseConditionalType () {
    const checkType = this.parseUnionType();
    if ( this.matchValue("extends") ) {
      this.advance();
      const extendsType = this.parseUnionType();
      if ( this.matchValue("?") ) {
        this.advance();
        const conditional = new TSNode();
        conditional.nodeType = "TSConditionalType";
        conditional.start = checkType.start;
        conditional.line = checkType.line;
        conditional.col = checkType.col;
        conditional.left = checkType;
        conditional.params.push(extendsType);
        conditional.body = this.parseUnionType();
        this.expectValue(":");
        conditional.right = this.parseUnionType();
        return conditional;
      }
      return checkType;
    }
    return checkType;
  };
  parseUnionType () {
    const left = this.parseIntersectionType();
    if ( this.matchValue("|") ) {
      const union = new TSNode();
      union.nodeType = "TSUnionType";
      union.start = left.start;
      union.line = left.line;
      union.col = left.col;
      union.children.push(left);
      while (this.matchValue("|")) {
        this.advance();
        const right = this.parseIntersectionType();
        union.children.push(right);
      };
      return union;
    }
    return left;
  };
  parseIntersectionType () {
    const left = this.parseArrayType();
    if ( this.matchValue("&") ) {
      const intersection = new TSNode();
      intersection.nodeType = "TSIntersectionType";
      intersection.start = left.start;
      intersection.line = left.line;
      intersection.col = left.col;
      intersection.children.push(left);
      while (this.matchValue("&")) {
        this.advance();
        const right = this.parseArrayType();
        intersection.children.push(right);
      };
      return intersection;
    }
    return left;
  };
  parseArrayType () {
    let elemType = this.parsePrimaryType();
    while (this.matchValue("[")) {
      if ( this.checkNext("]") ) {
        this.advance();
        this.advance();
        const arrayType = new TSNode();
        arrayType.nodeType = "TSArrayType";
        arrayType.start = elemType.start;
        arrayType.line = elemType.line;
        arrayType.col = elemType.col;
        arrayType.left = elemType;
        elemType = arrayType;
      } else {
        this.advance();
        const indexType = this.parseType();
        this.expectValue("]");
        const indexedAccess = new TSNode();
        indexedAccess.nodeType = "TSIndexedAccessType";
        indexedAccess.start = elemType.start;
        indexedAccess.line = elemType.line;
        indexedAccess.col = elemType.col;
        indexedAccess.left = elemType;
        indexedAccess.right = indexType;
        elemType = indexedAccess;
      }
    };
    return elemType;
  };
  checkNext (value) {
    const nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      const nextTok = this.tokens[nextPos];
      const v = nextTok.value;
      return v == value;
    }
    return false;
  };
  parsePrimaryType () {
    const tokVal = this.peekValue();
    const tok = this.peek();
    if ( tokVal == "keyof" ) {
      this.advance();
      const operand = this.parsePrimaryType();
      const node = new TSNode();
      node.nodeType = "TSTypeOperator";
      node.value = "keyof";
      node.start = tok.start;
      node.line = tok.line;
      node.col = tok.col;
      node.typeAnnotation = operand;
      return node;
    }
    if ( tokVal == "typeof" ) {
      this.advance();
      const operand_1 = this.parsePrimaryType();
      const node_1 = new TSNode();
      node_1.nodeType = "TSTypeQuery";
      node_1.value = "typeof";
      node_1.start = tok.start;
      node_1.line = tok.line;
      node_1.col = tok.col;
      node_1.typeAnnotation = operand_1;
      return node_1;
    }
    if ( tokVal == "infer" ) {
      this.advance();
      const paramTok = this.expect("Identifier");
      const node_2 = new TSNode();
      node_2.nodeType = "TSInferType";
      node_2.start = tok.start;
      node_2.line = tok.line;
      node_2.col = tok.col;
      const typeParam = new TSNode();
      typeParam.nodeType = "TSTypeParameter";
      typeParam.name = paramTok.value;
      node_2.typeAnnotation = typeParam;
      return node_2;
    }
    if ( tokVal == "string" ) {
      this.advance();
      const node_3 = new TSNode();
      node_3.nodeType = "TSStringKeyword";
      node_3.start = tok.start;
      node_3.end = tok.end;
      node_3.line = tok.line;
      node_3.col = tok.col;
      return node_3;
    }
    if ( tokVal == "number" ) {
      this.advance();
      const node_4 = new TSNode();
      node_4.nodeType = "TSNumberKeyword";
      node_4.start = tok.start;
      node_4.end = tok.end;
      node_4.line = tok.line;
      node_4.col = tok.col;
      return node_4;
    }
    if ( tokVal == "boolean" ) {
      this.advance();
      const node_5 = new TSNode();
      node_5.nodeType = "TSBooleanKeyword";
      node_5.start = tok.start;
      node_5.end = tok.end;
      node_5.line = tok.line;
      node_5.col = tok.col;
      return node_5;
    }
    if ( tokVal == "any" ) {
      this.advance();
      const node_6 = new TSNode();
      node_6.nodeType = "TSAnyKeyword";
      node_6.start = tok.start;
      node_6.end = tok.end;
      node_6.line = tok.line;
      node_6.col = tok.col;
      return node_6;
    }
    if ( tokVal == "unknown" ) {
      this.advance();
      const node_7 = new TSNode();
      node_7.nodeType = "TSUnknownKeyword";
      node_7.start = tok.start;
      node_7.end = tok.end;
      node_7.line = tok.line;
      node_7.col = tok.col;
      return node_7;
    }
    if ( tokVal == "object" ) {
      this.advance();
      const node_8 = new TSNode();
      node_8.nodeType = "TSObjectKeyword";
      node_8.start = tok.start;
      node_8.end = tok.end;
      node_8.line = tok.line;
      node_8.col = tok.col;
      return node_8;
    }
    if ( tokVal == "void" ) {
      this.advance();
      const node_9 = new TSNode();
      node_9.nodeType = "TSVoidKeyword";
      node_9.start = tok.start;
      node_9.end = tok.end;
      node_9.line = tok.line;
      node_9.col = tok.col;
      return node_9;
    }
    if ( tokVal == "null" ) {
      this.advance();
      const node_10 = new TSNode();
      node_10.nodeType = "TSNullKeyword";
      node_10.start = tok.start;
      node_10.end = tok.end;
      node_10.line = tok.line;
      node_10.col = tok.col;
      return node_10;
    }
    if ( tokVal == "never" ) {
      this.advance();
      const node_11 = new TSNode();
      node_11.nodeType = "TSNeverKeyword";
      node_11.start = tok.start;
      node_11.end = tok.end;
      node_11.line = tok.line;
      node_11.col = tok.col;
      return node_11;
    }
    if ( tokVal == "undefined" ) {
      this.advance();
      const node_12 = new TSNode();
      node_12.nodeType = "TSUndefinedKeyword";
      node_12.start = tok.start;
      node_12.end = tok.end;
      node_12.line = tok.line;
      node_12.col = tok.col;
      return node_12;
    }
    const tokType = this.peekType();
    if ( tokType == "Identifier" ) {
      return this.parseTypeRef();
    }
    if ( tokType == "String" ) {
      this.advance();
      const node_13 = new TSNode();
      node_13.nodeType = "TSLiteralType";
      node_13.start = tok.start;
      node_13.end = tok.end;
      node_13.line = tok.line;
      node_13.col = tok.col;
      node_13.value = tok.value;
      node_13.kind = "string";
      return node_13;
    }
    if ( tokType == "Number" ) {
      this.advance();
      const node_14 = new TSNode();
      node_14.nodeType = "TSLiteralType";
      node_14.start = tok.start;
      node_14.end = tok.end;
      node_14.line = tok.line;
      node_14.col = tok.col;
      node_14.value = tok.value;
      node_14.kind = "number";
      return node_14;
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      this.advance();
      const node_15 = new TSNode();
      node_15.nodeType = "TSLiteralType";
      node_15.start = tok.start;
      node_15.end = tok.end;
      node_15.line = tok.line;
      node_15.col = tok.col;
      node_15.value = tokVal;
      node_15.kind = "boolean";
      return node_15;
    }
    if ( tokType == "Template" ) {
      this.advance();
      const node_16 = new TSNode();
      node_16.nodeType = "TSTemplateLiteralType";
      node_16.start = tok.start;
      node_16.end = tok.end;
      node_16.line = tok.line;
      node_16.col = tok.col;
      node_16.value = tok.value;
      return node_16;
    }
    if ( tokVal == "new" ) {
      return this.parseConstructorType();
    }
    if ( tokVal == "import" ) {
      return this.parseImportType();
    }
    if ( tokVal == "(" ) {
      return this.parseParenOrFunctionType();
    }
    if ( tokVal == "[" ) {
      return this.parseTupleType();
    }
    if ( tokVal == "{" ) {
      return this.parseTypeLiteral();
    }
    this.syntaxError("Unknown type: " + tokVal);
    this.advance();
    const errNode = new TSNode();
    errNode.nodeType = "TSAnyKeyword";
    return errNode;
  };
  parseTypeRef () {
    const ref = new TSNode();
    ref.nodeType = "TSTypeReference";
    const tok = this.peek();
    ref.start = tok.start;
    ref.line = tok.line;
    ref.col = tok.col;
    const nameTok = this.expect("Identifier");
    ref.name = nameTok.value;
    if ( this.matchValue("<") ) {
      this.advance();
      while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
        if ( (ref.params.length) > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(">") ) {
            break;
          }
        }
        const typeArg = this.parseType();
        ref.params.push(typeArg);
      };
      this.expectValue(">");
    }
    return ref;
  };
  parseTupleType () {
    const tuple = new TSNode();
    tuple.nodeType = "TSTupleType";
    const startTok = this.peek();
    tuple.start = startTok.start;
    tuple.line = startTok.line;
    tuple.col = startTok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( (tuple.children.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue("]") ) {
          break;
        }
      }
      if ( this.matchValue("...") ) {
        const restTok = this.peek();
        this.advance();
        let restName = "";
        if ( this.matchType("Identifier") ) {
          const savedPos = this.pos;
          const savedTok = this.currentToken;
          const nameTok = this.peek();
          this.advance();
          if ( this.matchValue(":") ) {
            restName = nameTok.value;
            this.advance();
          } else {
            this.pos = savedPos;
            this.currentToken = savedTok;
          }
        }
        const innerType = this.parseType();
        const restType = new TSNode();
        restType.nodeType = "TSRestType";
        restType.start = restTok.start;
        restType.line = restTok.line;
        restType.col = restTok.col;
        restType.typeAnnotation = innerType;
        if ( restName != "" ) {
          restType.name = restName;
        }
        tuple.children.push(restType);
      } else {
        let isNamed = false;
        let elemName = "";
        let elemOptional = false;
        const elemStart = this.peek();
        if ( this.matchType("Identifier") ) {
          const savedPos_1 = this.pos;
          const savedTok_1 = this.currentToken;
          const nameTok_1 = this.peek();
          this.advance();
          if ( this.matchValue("?") ) {
            this.advance();
            elemOptional = true;
          }
          if ( this.matchValue(":") ) {
            isNamed = true;
            elemName = nameTok_1.value;
            this.advance();
          } else {
            this.pos = savedPos_1;
            this.currentToken = savedTok_1;
            elemOptional = false;
          }
        }
        const elemType = this.parseType();
        if ( isNamed ) {
          const namedElem = new TSNode();
          namedElem.nodeType = "TSNamedTupleMember";
          namedElem.start = elemStart.start;
          namedElem.line = elemStart.line;
          namedElem.col = elemStart.col;
          namedElem.name = elemName;
          namedElem.optional = elemOptional;
          namedElem.typeAnnotation = elemType;
          tuple.children.push(namedElem);
        } else {
          if ( this.matchValue("?") ) {
            this.advance();
            const optType = new TSNode();
            optType.nodeType = "TSOptionalType";
            optType.start = elemType.start;
            optType.line = elemType.line;
            optType.col = elemType.col;
            optType.typeAnnotation = elemType;
            tuple.children.push(optType);
          } else {
            tuple.children.push(elemType);
          }
        }
      }
    };
    this.expectValue("]");
    return tuple;
  };
  parseParenOrFunctionType () {
    const startTok = this.peek();
    const startPos = startTok.start;
    const startLine = startTok.line;
    const startCol = startTok.col;
    this.expectValue("(");
    if ( this.matchValue(")") ) {
      this.advance();
      if ( this.matchValue("=>") ) {
        this.advance();
        const returnType = this.parseType();
        const funcType = new TSNode();
        funcType.nodeType = "TSFunctionType";
        funcType.start = startPos;
        funcType.line = startLine;
        funcType.col = startCol;
        funcType.typeAnnotation = returnType;
        return funcType;
      }
      const voidNode = new TSNode();
      voidNode.nodeType = "TSVoidKeyword";
      return voidNode;
    }
    const isIdentifier = this.matchType("Identifier");
    if ( isIdentifier ) {
      const savedPos = this.pos;
      const savedToken = this.currentToken;
      this.advance();
      if ( this.matchValue(":") || this.matchValue("?") ) {
        this.pos = savedPos;
        this.currentToken = savedToken;
        return this.parseFunctionType(startPos, startLine, startCol);
      }
      if ( this.matchValue(",") ) {
        const savedPos2 = this.pos;
        const savedToken2 = this.currentToken;
        let depth = 1;
        while ((depth > 0) && (this.isAtEnd() == false)) {
          if ( this.matchValue("(") ) {
            depth = depth + 1;
          }
          if ( this.matchValue(")") ) {
            depth = depth - 1;
          }
          if ( depth > 0 ) {
            this.advance();
          }
        };
        if ( this.matchValue(")") ) {
          this.advance();
          if ( this.matchValue("=>") ) {
            this.pos = savedPos;
            this.currentToken = savedToken;
            return this.parseFunctionType(startPos, startLine, startCol);
          }
        }
        this.pos = savedPos;
        this.currentToken = savedToken;
      }
      this.pos = savedPos;
      this.currentToken = savedToken;
    }
    const innerType = this.parseType();
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      const returnType_1 = this.parseType();
      const funcType_1 = new TSNode();
      funcType_1.nodeType = "TSFunctionType";
      funcType_1.start = startPos;
      funcType_1.line = startLine;
      funcType_1.col = startCol;
      funcType_1.typeAnnotation = returnType_1;
      return funcType_1;
    }
    return innerType;
  };
  parseFunctionType (startPos, startLine, startCol) {
    const funcType = new TSNode();
    funcType.nodeType = "TSFunctionType";
    funcType.start = startPos;
    funcType.line = startLine;
    funcType.col = startCol;
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (funcType.params.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          break;
        }
      }
      const param = new TSNode();
      param.nodeType = "Parameter";
      const nameTok = this.expect("Identifier");
      param.name = nameTok.value;
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if ( this.matchValue("?") ) {
        param.optional = true;
        this.advance();
      }
      if ( this.matchValue(":") ) {
        const typeAnnot = this.parseTypeAnnotation();
        param.typeAnnotation = typeAnnot;
      }
      funcType.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      const returnType = this.parseType();
      funcType.typeAnnotation = returnType;
    }
    return funcType;
  };
  parseConstructorType () {
    const ctorType = new TSNode();
    ctorType.nodeType = "TSConstructorType";
    const startTok = this.peek();
    ctorType.start = startTok.start;
    ctorType.line = startTok.line;
    ctorType.col = startTok.col;
    this.expectValue("new");
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      ctorType.children = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (ctorType.params.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( (ctorType.params.length) > 0 ) {
            const lastP = ctorType.params[((ctorType.params.length) - 1)];
            if ( lastP.nodeType == "RestElement" ) {
              this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
            }
          }
          break;
        }
      }
      const param = this.parseParam();
      ctorType.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      const returnType = this.parseType();
      ctorType.typeAnnotation = returnType;
    }
    return ctorType;
  };
  parseImportType () {
    const importType = new TSNode();
    importType.nodeType = "TSImportType";
    const startTok = this.peek();
    importType.start = startTok.start;
    importType.line = startTok.line;
    importType.col = startTok.col;
    this.expectValue("import");
    this.expectValue("(");
    const sourceTok = this.expect("String");
    importType.value = sourceTok.value;
    this.expectValue(")");
    if ( this.matchValue(".") ) {
      this.advance();
      const memberTok = this.expect("Identifier");
      importType.name = memberTok.value;
      if ( this.matchValue("<") ) {
        this.advance();
        while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
          if ( (importType.params.length) > 0 ) {
            this.expectValue(",");
            if ( this.matchValue(">") ) {
              break;
            }
          }
          const typeArg = this.parseType();
          importType.params.push(typeArg);
        };
        this.expectValue(">");
      }
    }
    return importType;
  };
  parseTypeLiteral () {
    const literal = new TSNode();
    literal.nodeType = "TSTypeLiteral";
    const startTok = this.peek();
    literal.start = startTok.start;
    literal.line = startTok.line;
    literal.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const member = this.parseTypeLiteralMember();
      literal.children.push(member);
      if ( this.matchValue(";") || this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return literal;
  };
  parseTypeLiteralMember () {
    const startTok = this.peek();
    const startPos = startTok.start;
    const startLine = startTok.line;
    const startCol = startTok.col;
    let isReadonly = false;
    if ( this.matchValue("readonly") ) {
      isReadonly = true;
      this.advance();
    }
    let readonlyModifier = "";
    if ( this.matchValue("+") || this.matchValue("-") ) {
      readonlyModifier = this.peekValue();
      this.advance();
      if ( this.matchValue("readonly") ) {
        isReadonly = true;
        this.advance();
      }
    }
    if ( this.matchValue("[") ) {
      this.advance();
      const paramName = this.expect("Identifier");
      if ( this.matchValue("in") ) {
        return this.parseMappedType(isReadonly, readonlyModifier, paramName.value, startPos, startLine, startCol);
      }
      return this.parseIndexSignatureRest(isReadonly, paramName, startPos, startLine, startCol);
    }
    const nameTok = this.expect("Identifier");
    const memberName = nameTok.value;
    let isOptional = false;
    if ( this.matchValue("?") ) {
      isOptional = true;
      this.advance();
    }
    if ( this.matchValue("(") ) {
      return this.parseMethodSignature(memberName, isOptional, startPos, startLine, startCol);
    }
    const prop = new TSNode();
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.name = memberName;
    prop.readonly = isReadonly;
    prop.optional = isOptional;
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  };
  parseMappedType (isReadonly, readonlyMod, paramName, startPos, startLine, startCol) {
    const mapped = new TSNode();
    mapped.nodeType = "TSMappedType";
    mapped.start = startPos;
    mapped.line = startLine;
    mapped.col = startCol;
    mapped.readonly = isReadonly;
    if ( readonlyMod != "" ) {
      mapped.kind = readonlyMod;
    }
    this.expectValue("in");
    const typeParam = new TSNode();
    typeParam.nodeType = "TSTypeParameter";
    typeParam.name = paramName;
    const constraint = this.parseType();
    typeParam.typeAnnotation = constraint;
    mapped.params.push(typeParam);
    if ( this.matchValue("as") ) {
      this.advance();
      const nameType = this.parseType();
      mapped.right = nameType;
    }
    this.expectValue("]");
    let optionalMod = "";
    if ( this.matchValue("+") || this.matchValue("-") ) {
      optionalMod = this.peekValue();
      this.advance();
    }
    if ( this.matchValue("?") ) {
      mapped.optional = true;
      if ( optionalMod != "" ) {
        mapped.value = optionalMod;
      }
      this.advance();
    }
    if ( this.matchValue(":") ) {
      this.advance();
      const valueType = this.parseType();
      mapped.typeAnnotation = valueType;
    }
    return mapped;
  };
  parseIndexSignatureRest (isReadonly, paramTok, startPos, startLine, startCol) {
    const indexSig = new TSNode();
    indexSig.nodeType = "TSIndexSignature";
    indexSig.start = startPos;
    indexSig.line = startLine;
    indexSig.col = startCol;
    indexSig.readonly = isReadonly;
    const param = new TSNode();
    param.nodeType = "Parameter";
    param.name = paramTok.value;
    param.start = paramTok.start;
    param.line = paramTok.line;
    param.col = paramTok.col;
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    indexSig.params.push(param);
    this.expectValue("]");
    if ( this.matchValue(":") ) {
      const typeAnnot_1 = this.parseTypeAnnotation();
      indexSig.typeAnnotation = typeAnnot_1;
    }
    return indexSig;
  };
  parseMethodSignature (methodName, isOptional, startPos, startLine, startCol) {
    const method = new TSNode();
    method.nodeType = "TSMethodSignature";
    method.start = startPos;
    method.line = startLine;
    method.col = startCol;
    method.name = methodName;
    method.optional = isOptional;
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (method.params.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( (method.params.length) > 0 ) {
            const lastP = method.params[((method.params.length) - 1)];
            if ( lastP.nodeType == "RestElement" ) {
              this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
            }
          }
          break;
        }
      }
      const param = this.parseParam();
      method.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const returnType = this.parseTypeAnnotation();
      method.typeAnnotation = returnType;
    }
    return method;
  };
  parseExpr () {
    return this.parseAssign();
  };
  parseExprSeq () {
    const first = this.parseExpr();
    if ( this.matchValue(",") == false ) {
      return first;
    }
    const seq = new TSNode();
    seq.nodeType = "SequenceExpression";
    seq.start = first.start;
    seq.line = first.line;
    seq.col = first.col;
    seq.children.push(first);
    while (this.matchValue(",")) {
      this.advance();
      const next = this.parseExpr();
      seq.children.push(next);
    };
    return seq;
  };
  checkAssignmentTarget (target) {
    const t = target.nodeType;
    if ( t == "Identifier" ) {
      if ( this.strictMode ) {
        if ( ((target.name == "eval") || (target.name == "arguments")) || (target.name == "yield") ) {
          this.syntaxError(("Parse error: cannot assign to '" + target.name) + "' in strict mode");
        }
      }
      return;
    }
    if ( t == "MemberExpression" ) {
      return;
    }
    if ( t == "ObjectPattern" ) {
      return;
    }
    if ( t == "ArrayPattern" ) {
      return;
    }
    if ( t == "AssignmentPattern" ) {
      return;
    }
    if ( t == "ObjectExpression" ) {
      if ( target.parenthesized ) {
        this.syntaxError("Parse error: a parenthesised object literal is not a valid assignment target");
        return;
      }
      let i = 0;
      while (i < (target.children.length)) {
        const prop = target.children[i];
        if ( prop.method ) {
          this.syntaxError("Parse error: a method cannot be a destructuring assignment target");
          return;
        }
        if ( (prop.kind == "get") || (prop.kind == "set") ) {
          this.syntaxError("Parse error: an accessor cannot be a destructuring assignment target");
          return;
        }
        i = i + 1;
      };
      return;
    }
    if ( t == "ArrayExpression" ) {
      if ( target.parenthesized ) {
        this.syntaxError("Parse error: a parenthesised array literal is not a valid assignment target");
      }
      return;
    }
    this.syntaxError(("Parse error: invalid assignment target (" + t) + ")");
  };
  checkUpdateTarget (target) {
    const t = target.nodeType;
    if ( t == "Identifier" ) {
      if ( this.strictMode ) {
        if ( (target.name == "eval") || (target.name == "arguments") ) {
          this.syntaxError(("Parse error: cannot update '" + target.name) + "' in strict mode");
        }
      }
      return;
    }
    if ( t == "MemberExpression" ) {
      return;
    }
    this.syntaxError(("Parse error: '" + t) + "' is not a valid update target");
  };
  parseAssign () {
    const left = this.parseNullishCoalescing();
    const tokVal = this.peekValue();
    if ( tokVal == "=" ) {
      this.checkAssignmentTarget(left);
      this.advance();
      const right = this.parseAssign();
      const assign = new TSNode();
      assign.nodeType = "AssignmentExpression";
      assign.value = "=";
      assign.left = left;
      assign.right = right;
      assign.start = left.start;
      assign.line = left.line;
      assign.col = left.col;
      return assign;
    }
    if ( (((((((((((tokVal == "+=") || (tokVal == "-=")) || (tokVal == "*=")) || (tokVal == "/=")) || (tokVal == "%=")) || (tokVal == "**=")) || (tokVal == "&=")) || (tokVal == "|=")) || (tokVal == "^=")) || (tokVal == "<<=")) || (tokVal == ">>=")) || (tokVal == ">>>=") ) {
      this.checkAssignmentTarget(left);
      const leftKind = left.nodeType;
      if ( (((leftKind == "ArrayExpression") || (leftKind == "ObjectExpression")) || (leftKind == "ArrayPattern")) || (leftKind == "ObjectPattern") ) {
        this.syntaxError("Parse error: a compound assignment cannot have a destructuring target");
      }
      this.advance();
      const right_1 = this.parseAssign();
      const assign_1 = new TSNode();
      assign_1.nodeType = "AssignmentExpression";
      assign_1.value = tokVal;
      assign_1.left = left;
      assign_1.right = right_1;
      assign_1.start = left.start;
      assign_1.line = left.line;
      assign_1.col = left.col;
      return assign_1;
    }
    if ( ((tokVal == "&&=") || (tokVal == "||=")) || (tokVal == "??=") ) {
      this.advance();
      const right_2 = this.parseAssign();
      const assign_2 = new TSNode();
      assign_2.nodeType = "AssignmentExpression";
      assign_2.value = tokVal;
      assign_2.left = left;
      assign_2.right = right_2;
      assign_2.start = left.start;
      assign_2.line = left.line;
      assign_2.col = left.col;
      return assign_2;
    }
    return left;
  };
  parseNullishCoalescing () {
    let left = this.parseTernary();
    while (this.matchValue("??")) {
      this.advance();
      const right = this.parseTernary();
      const nullish = new TSNode();
      nullish.nodeType = "BinaryExpression";
      nullish.value = "??";
      nullish.left = left;
      nullish.right = right;
      nullish.start = left.start;
      nullish.line = left.line;
      nullish.col = left.col;
      left = nullish;
    };
    return left;
  };
  parseTernary () {
    const testExpr = this.parseLogicalOr();
    if ( this.matchValue("?") ) {
      this.advance();
      this.ternaryConsequentDepth = this.ternaryConsequentDepth + 1;
      const consequentExpr = this.parseAssign();
      this.ternaryConsequentDepth = this.ternaryConsequentDepth - 1;
      if ( this.matchValue(":") ) {
        this.advance();
        const alternateExpr = this.parseAssign();
        const cond = new TSNode();
        cond.nodeType = "ConditionalExpression";
        cond.start = testExpr.start;
        cond.line = testExpr.line;
        cond.col = testExpr.col;
        cond.left = testExpr;
        cond.test = testExpr;
        cond.consequent = consequentExpr;
        cond.alternate = alternateExpr;
        return cond;
      }
    }
    return testExpr;
  };
  parseLogicalOr () {
    let left = this.parseLogicalAnd();
    while (this.matchValue("||")) {
      this.advance();
      const right = this.parseLogicalAnd();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "||";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseLogicalAnd () {
    let left = this.parseBitwiseOr();
    while (this.matchValue("&&")) {
      this.advance();
      const right = this.parseBitwiseOr();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "&&";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseBitwiseOr () {
    let left = this.parseBitwiseXor();
    while (this.matchValue("|")) {
      this.advance();
      const right = this.parseBitwiseXor();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "|";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseBitwiseXor () {
    let left = this.parseBitwiseAnd();
    while (this.matchValue("^")) {
      this.advance();
      const right = this.parseBitwiseAnd();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "^";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseBitwiseAnd () {
    let left = this.parseEquality();
    while (this.matchValue("&")) {
      this.advance();
      const right = this.parseEquality();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "&";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseEquality () {
    let left = this.parseComparison();
    let tokVal = this.peekValue();
    while ((((tokVal == "==") || (tokVal == "!=")) || (tokVal == "===")) || (tokVal == "!==")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseComparison();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = opTok.value;
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseComparison () {
    let left = this.parseShift();
    let tokVal = this.peekValue();
    let tokType = this.peekType();
    while ((((((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=")) && (tokType == "Punctuator")) || (((tokVal == "instanceof") || (tokVal == "in")) && (tokType != "String"))) {
      if ( tokVal == "<" ) {
        if ( this.tsxMode == true ) {
          if ( left.nodeType == "Identifier" ) {
            if ( this.startsWithLowerCase(left.name) ) {
              if ( this.looksLikeGenericCall() ) {
                return left;
              }
            }
          }
        }
      }
      const opTok = this.peek();
      this.advance();
      const right = this.parseShift();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = opTok.value;
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
      tokVal = this.peekValue();
      tokType = this.peekType();
    };
    return left;
  };
  parseShift () {
    let left = this.parseAdditive();
    let cur = this.peekValue();
    let nxt = this.peekAheadValue(1);
    while ((this.peekType() == "Punctuator") && (((cur == "<") && (nxt == "<")) || ((cur == ">") && (nxt == ">")))) {
      const startTok = this.peek();
      let op = "";
      if ( cur == "<" ) {
        this.advance();
        this.advance();
        op = "<<";
      } else {
        this.advance();
        this.advance();
        op = ">>";
        if ( this.peekValue() == ">" ) {
          this.advance();
          op = ">>>";
        }
      }
      const right = this.parseAdditive();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = op;
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
      cur = this.peekValue();
      nxt = this.peekAheadValue(1);
    };
    return left;
  };
  parseAdditive () {
    let left = this.parseMultiplicative();
    let tokVal = this.peekValue();
    while ((tokVal == "+") || (tokVal == "-")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseMultiplicative();
      const binExpr = new TSNode();
      binExpr.nodeType = "BinaryExpression";
      binExpr.value = opTok.value;
      binExpr.left = left;
      binExpr.right = right;
      binExpr.start = left.start;
      binExpr.line = left.line;
      binExpr.col = left.col;
      left = binExpr;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseMultiplicative () {
    let left = this.parseUnary();
    let tokVal = this.peekValue();
    while ((((tokVal == "*") || (tokVal == "/")) || (tokVal == "%")) || (tokVal == "**")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseUnary();
      const binExpr = new TSNode();
      binExpr.nodeType = "BinaryExpression";
      binExpr.value = opTok.value;
      binExpr.left = left;
      binExpr.right = right;
      binExpr.start = left.start;
      binExpr.line = left.line;
      binExpr.col = left.col;
      left = binExpr;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseUnary () {
    const tokVal = this.peekValue();
    const tokIsPunct = this.peekType() == "Punctuator";
    let tokIsLiteral = false;
    const tokKindU = this.peekType();
    if ( tokKindU == "String" ) {
      tokIsLiteral = true;
    }
    if ( tokKindU == "Number" ) {
      tokIsLiteral = true;
    }
    if ( tokKindU == "Boolean" ) {
      tokIsLiteral = true;
    }
    if ( tokKindU == "Null" ) {
      tokIsLiteral = true;
    }
    if ( tokIsPunct && ((tokVal == "++") || (tokVal == "--")) ) {
      const opTok = this.peek();
      this.advance();
      const arg = this.parseUnary();
      this.checkUpdateTarget(arg);
      const update = new TSNode();
      update.nodeType = "UpdateExpression";
      update.value = opTok.value;
      update.left = arg;
      update.prefix = true;
      update.start = opTok.start;
      update.line = opTok.line;
      update.col = opTok.col;
      return update;
    }
    if ( tokIsPunct && ((((tokVal == "!") || (tokVal == "-")) || (tokVal == "+")) || (tokVal == "~")) ) {
      const opTok_1 = this.peek();
      this.advance();
      const arg_1 = this.parseUnary();
      const unary = new TSNode();
      unary.nodeType = "UnaryExpression";
      unary.value = opTok_1.value;
      unary.left = arg_1;
      unary.start = opTok_1.start;
      unary.line = opTok_1.line;
      unary.col = opTok_1.col;
      return unary;
    }
    if ( tokIsPunct == false ) {
      if ( (false == tokIsLiteral) && (((tokVal == "typeof") || (tokVal == "void")) || (tokVal == "delete")) ) {
        const opAfter = this.peekNextValue();
        if ( opAfter == "(" ) {
          let scanIdx = this.pos + 1;
          let depth = 0;
          const total = this.tokens.length;
          while (scanIdx < total) {
            const st = this.tokens[scanIdx];
            if ( st.tokenType == "Punctuator" ) {
              if ( st.value == "(" ) {
                depth = depth + 1;
              }
              if ( st.value == ")" ) {
                depth = depth - 1;
                if ( depth == 0 ) {
                  break;
                }
              }
            }
            scanIdx = scanIdx + 1;
          };
          if ( (scanIdx + 1) < total ) {
            const afterParen = this.tokens[(scanIdx + 1)];
            if ( afterParen.value == "=>" ) {
              this.syntaxError("Parse error: an arrow function must be parenthesised to be a unary operand");
            }
          }
        }
      }
    }
    if ( (false == tokIsLiteral) && ((tokVal == "void") || (tokVal == "delete")) ) {
      const opTok_2 = this.peek();
      this.advance();
      const arg_2 = this.parseUnary();
      if ( tokVal == "delete" ) {
        if ( this.strictMode ) {
          if ( arg_2.nodeType == "Identifier" ) {
            this.syntaxError("Parse error: cannot delete an unqualified name in strict mode");
          }
        }
      }
      const unary_1 = new TSNode();
      unary_1.nodeType = "UnaryExpression";
      unary_1.value = opTok_2.value;
      unary_1.left = arg_2;
      unary_1.start = opTok_2.start;
      unary_1.line = opTok_2.line;
      unary_1.col = opTok_2.col;
      return unary_1;
    }
    if ( (tokVal == "typeof") && (false == tokIsLiteral) ) {
      const opTok_3 = this.peek();
      this.advance();
      const arg_3 = this.parseUnary();
      const unary_2 = new TSNode();
      unary_2.nodeType = "UnaryExpression";
      unary_2.value = "typeof";
      unary_2.left = arg_3;
      unary_2.start = opTok_3.start;
      unary_2.line = opTok_3.line;
      unary_2.col = opTok_3.col;
      return unary_2;
    }
    if ( (tokVal == "yield") && (this.inGenerator && (this.peekType() != "String")) ) {
      const yieldTok = this.peek();
      if ( this.inParamList ) {
        this.syntaxError("Parse error: a parameter default may not contain a yield expression");
      }
      this.advance();
      const afterYield = this.peek();
      if ( afterYield.value == "*" ) {
        if ( afterYield.line != this.lastTokenLine ) {
          this.syntaxError("Parse error: no line terminator is allowed between 'yield' and '*'");
        }
      }
      const yieldExpr = new TSNode();
      yieldExpr.nodeType = "YieldExpression";
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if ( this.matchValue("*") ) {
        this.advance();
        yieldExpr.delegate = true;
      }
      const nextVal = this.peekValue();
      let endsYield = false;
      if ( nextVal == ";" ) {
        endsYield = true;
      }
      if ( nextVal == "}" ) {
        endsYield = true;
      }
      if ( nextVal == "," ) {
        endsYield = true;
      }
      if ( nextVal == ")" ) {
        endsYield = true;
      }
      if ( nextVal == "]" ) {
        endsYield = true;
      }
      if ( nextVal == ":" ) {
        endsYield = true;
      }
      if ( this.isAtEnd() ) {
        endsYield = true;
      }
      const yieldNextTok = this.peek();
      if ( false == yieldExpr.delegate ) {
        if ( yieldNextTok.line != this.lastTokenLine ) {
          endsYield = true;
        }
      }
      if ( endsYield ) {
        if ( yieldExpr.delegate ) {
          this.syntaxError("Parse error: 'yield*' requires an operand");
        }
      } else {
        yieldExpr.left = this.parseAssign();
      }
      return yieldExpr;
    }
    let awaitIsOperator = this.inAsync;
    if ( this.moduleMode ) {
      if ( this.functionDepth == 0 ) {
        awaitIsOperator = true;
      }
    }
    if ( (tokVal == "await") && (awaitIsOperator && (this.peekType() != "String")) ) {
      if ( this.inAsyncParams ) {
        this.syntaxError("Parse error: 'await' cannot appear in the parameters of an async function");
      }
      const awaitTok = this.peek();
      this.advance();
      const arg_4 = this.parseUnary();
      const awaitExpr = new TSNode();
      awaitExpr.nodeType = "AwaitExpression";
      awaitExpr.left = arg_4;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr;
    }
    if ( (tokVal == "<") && (this.peekType() == "Punctuator") ) {
      if ( this.tsxMode == true ) {
        const peekNext = this.peekNextValue();
        const peekNextT = this.peekNextType();
        if ( peekNext == ">" ) {
          return this.parsePostfix();
        }
        if ( peekNextT == "Identifier" ) {
          const peekTwoAhead = this.peekAheadValue(2);
          if ( peekTwoAhead != "extends" ) {
            return this.parsePostfix();
          }
        }
      }
      const startTok = this.peek();
      this.advance();
      const nextType = this.peekType();
      if ( ((nextType == "Identifier") || (nextType == "Keyword")) || (nextType == "TSType") ) {
        const typeNode = this.parseType();
        if ( this.matchValue(">") ) {
          this.advance();
          const arg_5 = this.parseUnary();
          const assertion = new TSNode();
          assertion.nodeType = "TSTypeAssertion";
          assertion.typeAnnotation = typeNode;
          assertion.left = arg_5;
          assertion.start = startTok.start;
          assertion.line = startTok.line;
          assertion.col = startTok.col;
          return assertion;
        }
      }
    }
    return this.parsePostfix();
  };
  parsePostfix () {
    let expr = this.parsePrimary();
    let keepParsing = true;
    while (keepParsing) {
      let tokVal = this.peekValue();
      if ( (tokVal == "<") && (this.peekType() == "Punctuator") ) {
        let shouldParseAsGenericCall = false;
        if ( this.tsxMode == false ) {
          const next1 = this.peekAheadValue(1);
          const next2 = this.peekAheadValue(2);
          if ( ((next2 == ">") || (next2 == ",")) || (next2 == "extends") ) {
            shouldParseAsGenericCall = true;
          }
        } else {
          if ( expr.nodeType == "Identifier" ) {
            if ( this.startsWithLowerCase(expr.name) ) {
              if ( this.looksLikeGenericCall() ) {
                shouldParseAsGenericCall = true;
              }
            }
          }
          if ( expr.nodeType == "MemberExpression" ) {
            if ( this.looksLikeGenericCall() ) {
              shouldParseAsGenericCall = true;
            }
          }
        }
        if ( shouldParseAsGenericCall ) {
          this.advance();
          const call = new TSNode();
          call.nodeType = "CallExpression";
          call.left = expr;
          call.start = expr.start;
          call.line = expr.line;
          call.col = expr.col;
          while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
            if ( (call.params.length) > 0 ) {
              this.expectValue(",");
              if ( this.matchValue(">") ) {
                break;
              }
            }
            const typeArg = this.parseType();
            call.params.push(typeArg);
          };
          this.expectValue(">");
          if ( this.matchValue("(") ) {
            this.advance();
            while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
              if ( (call.children.length) > 0 ) {
                this.expectValue(",");
                if ( this.matchValue(")") ) {
                  break;
                }
              }
              if ( this.matchValue("...") ) {
                this.advance();
                const spreadArg = this.parseExpr();
                const spread = new TSNode();
                spread.nodeType = "SpreadElement";
                spread.left = spreadArg;
                call.children.push(spread);
              } else {
                const arg = this.parseExpr();
                call.children.push(arg);
              }
            };
            this.expectValue(")");
            expr = call;
          }
        }
      }
      tokVal = this.peekValue();
      if ( tokVal == "(" ) {
        if ( expr.nodeType == "ArrowFunctionExpression" ) {
          if ( expr.parenthesized == false ) {
            this.syntaxError("Parse error: an arrow function must be parenthesised to be called");
          }
        }
        this.advance();
        const call_1 = new TSNode();
        call_1.nodeType = "CallExpression";
        call_1.left = expr;
        call_1.start = expr.start;
        call_1.line = expr.line;
        call_1.col = expr.col;
        while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
          if ( (call_1.children.length) > 0 ) {
            this.expectValue(",");
            if ( this.matchValue(")") ) {
              break;
            }
          }
          if ( this.matchValue("...") ) {
            this.advance();
            const spreadArg_1 = this.parseExpr();
            const spread_1 = new TSNode();
            spread_1.nodeType = "SpreadElement";
            spread_1.left = spreadArg_1;
            call_1.children.push(spread_1);
          } else {
            const arg_1 = this.parseExpr();
            call_1.children.push(arg_1);
          }
        };
        this.expectValue(")");
        expr = call_1;
      }
      if ( tokVal == "." ) {
        this.advance();
        const propTok = this.parseMemberName();
        const member = new TSNode();
        member.nodeType = "MemberExpression";
        member.left = expr;
        member.name = propTok.value;
        member.start = expr.start;
        member.line = expr.line;
        member.col = expr.col;
        expr = member;
      }
      if ( tokVal == "?." ) {
        this.advance();
        const nextTokVal = this.peekValue();
        if ( nextTokVal == "(" ) {
          this.advance();
          const optCall = new TSNode();
          optCall.nodeType = "OptionalCallExpression";
          optCall.optional = true;
          optCall.left = expr;
          optCall.start = expr.start;
          optCall.line = expr.line;
          optCall.col = expr.col;
          while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
            if ( (optCall.children.length) > 0 ) {
              this.expectValue(",");
              if ( this.matchValue(")") ) {
                break;
              }
            }
            if ( this.matchValue("...") ) {
              this.advance();
              const optSpreadArg = this.parseExpr();
              const optSpread = new TSNode();
              optSpread.nodeType = "SpreadElement";
              optSpread.left = optSpreadArg;
              optCall.children.push(optSpread);
            } else {
              const arg_2 = this.parseExpr();
              optCall.children.push(arg_2);
            }
          };
          this.expectValue(")");
          expr = optCall;
        }
        if ( nextTokVal == "[" ) {
          this.advance();
          const indexExpr = this.parseExpr();
          this.expectValue("]");
          const optIndex = new TSNode();
          optIndex.nodeType = "OptionalMemberExpression";
          optIndex.optional = true;
          optIndex.computed = true;
          optIndex.left = expr;
          optIndex.right = indexExpr;
          optIndex.start = expr.start;
          optIndex.line = expr.line;
          optIndex.col = expr.col;
          expr = optIndex;
        }
        let optIsPrivate = false;
        if ( nextTokVal == "#" ) {
          optIsPrivate = true;
        }
        if ( this.isNameToken() || optIsPrivate ) {
          const propTok_1 = this.parseMemberName();
          const optMember = new TSNode();
          optMember.nodeType = "OptionalMemberExpression";
          optMember.optional = true;
          optMember.left = expr;
          optMember.name = propTok_1.value;
          optMember.start = expr.start;
          optMember.line = expr.line;
          optMember.col = expr.col;
          expr = optMember;
        }
      }
      if ( tokVal == "[" ) {
        this.advance();
        const indexExpr_1 = this.parseExprSeq();
        this.expectValue("]");
        const computed = new TSNode();
        computed.nodeType = "MemberExpression";
        computed.computed = true;
        computed.left = expr;
        computed.right = indexExpr_1;
        computed.start = expr.start;
        computed.line = expr.line;
        computed.col = expr.col;
        expr = computed;
      }
      if ( tokVal == "!" ) {
        const tok = this.peek();
        this.advance();
        const nonNull = new TSNode();
        nonNull.nodeType = "TSNonNullExpression";
        nonNull.left = expr;
        nonNull.start = expr.start;
        nonNull.line = expr.line;
        nonNull.col = tok.col;
        expr = nonNull;
      }
      if ( tokVal == "as" ) {
        this.advance();
        const asType = this.parseType();
        const assertion = new TSNode();
        assertion.nodeType = "TSAsExpression";
        assertion.left = expr;
        assertion.typeAnnotation = asType;
        assertion.start = expr.start;
        assertion.line = expr.line;
        assertion.col = expr.col;
        expr = assertion;
      }
      if ( tokVal == "satisfies" ) {
        this.advance();
        const satisfiesType = this.parseType();
        const satisfiesExpr = new TSNode();
        satisfiesExpr.nodeType = "TSSatisfiesExpression";
        satisfiesExpr.left = expr;
        satisfiesExpr.typeAnnotation = satisfiesType;
        satisfiesExpr.start = expr.start;
        satisfiesExpr.line = expr.line;
        satisfiesExpr.col = expr.col;
        expr = satisfiesExpr;
      }
      if ( this.peekType() == "Template" ) {
        if ( expr.nodeType == "UpdateExpression" ) {
          this.syntaxError("Parse error: an update expression cannot tag a template");
        }
      }
      const tokType = this.peekType();
      if ( tokType == "Template" ) {
        const quasi = this.parseTemplateLiteral();
        const tagged = new TSNode();
        tagged.nodeType = "TaggedTemplateExpression";
        tagged.left = expr;
        tagged.right = quasi;
        tagged.start = expr.start;
        tagged.line = expr.line;
        tagged.col = expr.col;
        expr = tagged;
      }
      if ( (tokVal == "++") || (tokVal == "--") ) {
        const opTok = this.peek();
        if ( opTok.line != this.lastTokenLine ) {
          keepParsing = false;
          break;
        }
        this.checkUpdateTarget(expr);
        this.advance();
        const update = new TSNode();
        update.nodeType = "UpdateExpression";
        update.value = opTok.value;
        update.left = expr;
        update.prefix = false;
        update.start = expr.start;
        update.line = expr.line;
        update.col = expr.col;
        expr = update;
      }
      const newTokVal = this.peekValue();
      const newTokType = this.peekType();
      if ( (((((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies")) && (newTokVal != "++")) && (newTokVal != "--")) && (newTokType != "Template") ) {
        keepParsing = false;
      }
    };
    return expr;
  };
  parsePrimary () {
    const tokType = this.peekType();
    const tokVal = this.peekValue();
    const tok = this.peek();
    if ( (((tokType == "Identifier") || (tokType == "TSType")) || (tokType == "Keyword")) || (tokType == "TSKeyword") ) {
      if ( this.peekNextValue() == "=>" ) {
        return this.parseArrowFunction();
      }
    }
    if ( (tokType == "Identifier") || (tokType == "TSType") ) {
      if ( this.strictMode ) {
        if ( this.isStrictReservedReference(tok.value) ) {
          this.syntaxError(("Parse error: '" + tok.value) + "' is reserved in strict mode");
        }
      }
      this.advance();
      const id = new TSNode();
      id.nodeType = "Identifier";
      id.name = tok.value;
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id;
    }
    if ( tokType == "Number" ) {
      if ( this.strictMode ) {
        if ( tok.legacyOctal ) {
          this.syntaxError("Parse error: a leading-zero numeric literal is not allowed in strict mode");
        }
      }
      this.advance();
      const num = new TSNode();
      num.nodeType = "NumericLiteral";
      num.value = tok.value;
      num.start = tok.start;
      num.end = tok.end;
      num.line = tok.line;
      num.col = tok.col;
      return num;
    }
    if ( this.matchPunct("#") ) {
      const hashTok = this.peek();
      const afterHash = this.peekNextValue();
      if ( (afterHash.length) > 0 ) {
        this.advance();
        const privTok = this.peek();
        this.advance();
        const priv = new TSNode();
        priv.nodeType = "StringLiteral";
        priv.value = "#" + privTok.value;
        priv.start = hashTok.start;
        priv.end = privTok.end;
        priv.line = hashTok.line;
        priv.col = hashTok.col;
        return priv;
      }
    }
    if ( tokType == "BigInt" ) {
      this.advance();
      const bigint = new TSNode();
      bigint.nodeType = "BigIntLiteral";
      bigint.value = tok.value;
      bigint.start = tok.start;
      bigint.end = tok.end;
      bigint.line = tok.line;
      bigint.col = tok.col;
      return bigint;
    }
    if ( tokType == "String" ) {
      if ( this.strictMode ) {
        if ( tok.legacyOctal ) {
          this.syntaxError("Parse error: octal escape sequences are not allowed in strict mode");
        }
      }
      this.advance();
      const str = new TSNode();
      str.nodeType = "StringLiteral";
      str.value = tok.value;
      str.hasEscape = tok.hasEscape;
      str.start = tok.start;
      str.end = tok.end;
      str.line = tok.line;
      str.col = tok.col;
      return str;
    }
    if ( tokType == "Template" ) {
      return this.parseTemplateLiteral();
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      this.advance();
      const bool = new TSNode();
      bool.nodeType = "BooleanLiteral";
      bool.value = tokVal;
      bool.start = tok.start;
      bool.end = tok.end;
      bool.line = tok.line;
      bool.col = tok.col;
      return bool;
    }
    if ( tokVal == "null" ) {
      this.advance();
      const nullLit = new TSNode();
      nullLit.nodeType = "NullLiteral";
      nullLit.start = tok.start;
      nullLit.end = tok.end;
      nullLit.line = tok.line;
      nullLit.col = tok.col;
      return nullLit;
    }
    if ( tokVal == "undefined" ) {
      this.advance();
      const undefId = new TSNode();
      undefId.nodeType = "Identifier";
      undefId.name = "undefined";
      undefId.start = tok.start;
      undefId.end = tok.end;
      undefId.line = tok.line;
      undefId.col = tok.col;
      return undefId;
    }
    if ( tokVal == "[" ) {
      const arrSavedPos = this.pos;
      const arrSavedTok = this.currentToken;
      const arrSavedErrors = this.errorCount;
      this.speculating = this.speculating + 1;
      const savedArrMemberTarget = this.patternAllowsMemberTarget;
      this.patternAllowsMemberTarget = true;
      const arrPat = this.parseArrayPattern();
      this.patternAllowsMemberTarget = savedArrMemberTarget;
      this.speculating = this.speculating - 1;
      const arrPatErrors = this.errorCount;
      if ( this.errorCount == arrSavedErrors ) {
        if ( this.isAssignmentPatternFollow() ) {
          return arrPat;
        }
      }
      this.pos = arrSavedPos;
      this.currentToken = arrSavedTok;
      this.errorCount = arrSavedErrors;
      const arrLit = this.parseArrayLiteral();
      if ( this.isAssignmentPatternFollow() ) {
        if ( arrPatErrors > arrSavedErrors ) {
          this.errorCount = arrPatErrors;
        }
      }
      return arrLit;
    }
    if ( tokVal == "{" ) {
      const objSavedPos = this.pos;
      const objSavedTok = this.currentToken;
      const objSavedErrors = this.errorCount;
      this.speculating = this.speculating + 1;
      const savedObjMemberTarget = this.patternAllowsMemberTarget;
      this.patternAllowsMemberTarget = true;
      const objPat = this.parseObjectPattern();
      this.patternAllowsMemberTarget = savedObjMemberTarget;
      this.speculating = this.speculating - 1;
      const objPatErrors = this.errorCount;
      if ( this.errorCount == objSavedErrors ) {
        if ( this.isAssignmentPatternFollow() ) {
          return objPat;
        }
      }
      this.pos = objSavedPos;
      this.currentToken = objSavedTok;
      this.errorCount = objSavedErrors;
      const objLit = this.parseObjectLiteral();
      if ( this.isAssignmentPatternFollow() ) {
        if ( objPatErrors > objSavedErrors ) {
          this.errorCount = objPatErrors;
        }
      }
      return objLit;
    }
    if ( (this.tsxMode == true) && (tokVal == "<") ) {
      const nextType = this.peekNextType();
      const nextVal = this.peekNextValue();
      if ( nextVal == ">" ) {
        return this.parseJSXFragment();
      }
      if ( (nextType == "Identifier") || (nextType == "Keyword") ) {
        const peekTwoAhead = this.peekAheadValue(2);
        if ( peekTwoAhead != "extends" ) {
          return this.parseJSXElement();
        }
      }
    }
    if ( tokVal == "(" ) {
      return this.parseParenOrArrow();
    }
    if ( tokVal == "async" ) {
      if ( this.asyncArrowAhead() ) {
        return this.parseArrowFunction();
      }
    }
    if ( tokVal == "new" ) {
      return this.parseNewExpression();
    }
    if ( tokVal == "import" ) {
      const importTok = this.peek();
      this.advance();
      if ( this.matchValue(".") ) {
        this.advance();
        if ( this.matchValue("meta") ) {
          this.advance();
          const metaProp = new TSNode();
          metaProp.nodeType = "MetaProperty";
          metaProp.name = "import";
          metaProp.value = "meta";
          metaProp.start = importTok.start;
          metaProp.line = importTok.line;
          metaProp.col = importTok.col;
          return metaProp;
        }
      }
      if ( this.matchValue("(") ) {
        this.advance();
        const source = this.parseExpr();
        this.expectValue(")");
        const importExpr = new TSNode();
        importExpr.nodeType = "ImportExpression";
        importExpr.left = source;
        importExpr.start = importTok.start;
        importExpr.line = importTok.line;
        importExpr.col = importTok.col;
        return importExpr;
      }
    }
    if ( tokType == "Regex" ) {
      this.advance();
      const re = new TSNode();
      re.nodeType = "RegExpLiteral";
      re.value = tok.value;
      re.start = tok.start;
      re.end = tok.end;
      re.line = tok.line;
      re.col = tok.col;
      return re;
    }
    if ( tokVal == "function" ) {
      this.parsingFunctionExpression = true;
      const fnExpr = this.parseFuncDecl(false);
      fnExpr.nodeType = "FunctionExpression";
      return fnExpr;
    }
    if ( tokVal == "async" ) {
      if ( this.peekNextValue() == "function" ) {
        const asyncExprTok = this.peek();
        const fnExprTok = this.tokens[(this.pos + 1)];
        if ( asyncExprTok.line == fnExprTok.line ) {
          this.advance();
          this.parsingFunctionExpression = true;
          const asyncFnExpr = this.parseFuncDecl(true);
          asyncFnExpr.nodeType = "FunctionExpression";
          asyncFnExpr.start = asyncExprTok.start;
          asyncFnExpr.line = asyncExprTok.line;
          asyncFnExpr.col = asyncExprTok.col;
          return asyncFnExpr;
        }
      }
    }
    if ( tokVal == "class" ) {
      this.parsingClassExpression = true;
      const clsExpr = this.parseClass();
      clsExpr.nodeType = "ClassExpression";
      return clsExpr;
    }
    if ( tokVal == "super" ) {
      const afterSuper = this.peekNextValue();
      if ( afterSuper == "(" ) {
        if ( this.allowSuperCall == false ) {
          this.syntaxError("Parse error: 'super()' is only valid in a derived class constructor");
        }
      } else {
        if ( (afterSuper == ".") || (afterSuper == "[") ) {
          if ( this.allowSuperProperty == false ) {
            this.syntaxError("Parse error: 'super' property access is only valid in a method");
          }
        } else {
          this.syntaxError("Parse error: 'super' must be called or have a property accessed");
        }
      }
      this.advance();
      const superExpr = new TSNode();
      superExpr.nodeType = "Super";
      superExpr.start = tok.start;
      superExpr.end = tok.end;
      superExpr.line = tok.line;
      superExpr.col = tok.col;
      return superExpr;
    }
    if ( tokVal == "this" ) {
      this.advance();
      const thisExpr = new TSNode();
      thisExpr.nodeType = "ThisExpression";
      thisExpr.start = tok.start;
      thisExpr.end = tok.end;
      thisExpr.line = tok.line;
      thisExpr.col = tok.col;
      return thisExpr;
    }
    if ( tokType == "Punctuator" ) {
      if ( tokVal == "*" ) {
        this.syntaxError("Parse error: '*' cannot start an expression");
        this.advance();
        const starErr = new TSNode();
        starErr.nodeType = "Identifier";
        starErr.name = "error";
        return starErr;
      }
    }
    if ( tokType == "TSKeyword" ) {
      if ( this.strictMode ) {
        if ( this.isStrictReservedReference(tokVal) ) {
          this.syntaxError(("Parse error: '" + tokVal) + "' is reserved in strict mode");
        }
      }
      this.advance();
      const tsId = new TSNode();
      tsId.nodeType = "Identifier";
      tsId.name = tok.value;
      tsId.start = tok.start;
      tsId.end = tok.end;
      tsId.line = tok.line;
      tsId.col = tok.col;
      return tsId;
    }
    if ( tokType == "Keyword" ) {
      let contextual = false;
      if ( tokVal == "let" ) {
        contextual = true;
      }
      if ( tokVal == "yield" ) {
        contextual = true;
      }
      if ( tokVal == "await" ) {
        contextual = true;
      }
      if ( tokVal == "of" ) {
        contextual = true;
      }
      if ( tokVal == "static" ) {
        contextual = true;
      }
      if ( tokVal == "as" ) {
        contextual = true;
      }
      if ( tokVal == "from" ) {
        contextual = true;
      }
      if ( tokVal == "get" ) {
        contextual = true;
      }
      if ( tokVal == "set" ) {
        contextual = true;
      }
      if ( tokVal == "async" ) {
        contextual = true;
      }
      if ( tokVal == "implements" ) {
        contextual = true;
      }
      if ( tokVal == "interface" ) {
        contextual = true;
      }
      if ( tokVal == "package" ) {
        contextual = true;
      }
      if ( tokVal == "private" ) {
        contextual = true;
      }
      if ( tokVal == "protected" ) {
        contextual = true;
      }
      if ( tokVal == "public" ) {
        contextual = true;
      }
      if ( contextual ) {
        if ( this.noLetReference ) {
          if ( tokVal == "let" ) {
            this.syntaxError("Parse error: 'let' cannot be referenced inside a lexical declaration");
          }
        }
        if ( this.strictMode ) {
          if ( this.isStrictReservedReference(tokVal) ) {
            this.syntaxError(("Parse error: '" + tokVal) + "' is reserved in strict mode");
          }
        }
        if ( this.inGenerator ) {
          if ( tokVal == "yield" ) {
            this.syntaxError("Parse error: 'yield' is reserved inside a generator");
          }
        }
        this.advance();
        const ctxId = new TSNode();
        ctxId.nodeType = "Identifier";
        ctxId.name = tok.value;
        ctxId.start = tok.start;
        ctxId.end = tok.end;
        ctxId.line = tok.line;
        ctxId.col = tok.col;
        return ctxId;
      }
    }
    this.syntaxError("Unexpected token: " + tokVal);
    this.advance();
    const errId = new TSNode();
    errId.nodeType = "Identifier";
    errId.name = "error";
    return errId;
  };
  parseTemplateLiteral () {
    const node = new TSNode();
    node.nodeType = "TemplateLiteral";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.advance();
    const quasi = new TSNode();
    quasi.nodeType = "TemplateElement";
    quasi.value = tok.value;
    quasi.name = tok.raw;
    node.children.push(quasi);
    return node;
  };
  parseArrayLiteral () {
    const node = new TSNode();
    node.nodeType = "ArrayExpression";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( this.matchValue("...") ) {
        this.advance();
        const spreadArg = this.parseExpr();
        const spread = new TSNode();
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.push(spread);
      } else {
        if ( this.matchValue(",") ) {
          const holeTok = this.peek();
          const hole = new TSNode();
          hole.nodeType = "ArrayHole";
          hole.start = holeTok.start;
          hole.line = holeTok.line;
          hole.col = holeTok.col;
          node.children.push(hole);
        } else {
          const elem = this.parseExpr();
          node.children.push(elem);
        }
      }
      if ( this.matchValue(",") ) {
        this.advance();
      } else {
        if ( this.matchValue("]") == false ) {
          if ( this.isAtEnd() == false ) {
            const badArrTok = this.peek();
            this.syntaxError("Parse error: expected ',' or ']' in array literal but got '" + (badArrTok.value + "'"));
            return node;
          }
        }
      }
    };
    this.expectValue("]");
    return node;
  };
  parseObjectLiteral () {
    const node = new TSNode();
    node.nodeType = "ObjectExpression";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("{");
    let sawProto = false;
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const loopStartPos = this.pos;
      if ( this.matchValue("...") ) {
        this.advance();
        const spreadArg = this.parseExpr();
        const spread = new TSNode();
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.push(spread);
      } else {
        const prop = new TSNode();
        prop.nodeType = "Property";
        const propStartTok = this.peek();
        prop.start = propStartTok.start;
        let isComputed = false;
        let isMethod = false;
        let isGetter = false;
        let isSetter = false;
        let currVal = this.peekValue();
        let nextType = this.peekNextType();
        let nextVal = this.peekNextValue();
        if ( currVal == "async" ) {
          if ( (nextType == "Identifier") || ((nextVal == "[") || ((nextVal == "(") || (nextVal == "*"))) ) {
            this.advance();
            prop.async = true;
            currVal = this.peekValue();
            nextType = this.peekNextType();
            nextVal = this.peekNextValue();
          }
        }
        if ( currVal == "*" ) {
          this.advance();
          prop.generator = true;
          currVal = this.peekValue();
          nextType = this.peekNextType();
          nextVal = this.peekNextValue();
          let starNameOk = false;
          if ( this.isMemberKeyToken() ) {
            starNameOk = true;
          }
          if ( currVal == "[" ) {
            starNameOk = true;
          }
          if ( starNameOk == false ) {
            this.syntaxError("Parse error: '*' must be followed by a method name");
          } else {
            if ( currVal == "[" ) {
              let scanIdx = this.pos + 1;
              let depth = 1;
              const total = this.tokens.length;
              while (scanIdx < total) {
                const st = this.tokens[scanIdx];
                if ( st.tokenType == "Punctuator" ) {
                  if ( st.value == "[" ) {
                    depth = depth + 1;
                  }
                  if ( st.value == "]" ) {
                    depth = depth - 1;
                    if ( depth == 0 ) {
                      break;
                    }
                  }
                }
                scanIdx = scanIdx + 1;
              };
              if ( (scanIdx + 1) < total ) {
                const afterKey = this.tokens[(scanIdx + 1)];
                if ( afterKey.value != "(" ) {
                  this.syntaxError("Parse error: a generator property must be a method");
                }
              }
            } else {
              if ( nextVal != "(" ) {
                this.syntaxError("Parse error: a generator property must be a method");
              }
            }
          }
        }
        if ( currVal == "get" ) {
          if ( ((nextType == "Identifier") || (nextVal == "[")) || this.isAccessorNameAhead() ) {
            this.advance();
            isGetter = true;
            prop.kind = "get";
          }
        }
        if ( currVal == "set" ) {
          if ( ((nextType == "Identifier") || (nextVal == "[")) || this.isAccessorNameAhead() ) {
            this.advance();
            isSetter = true;
            prop.kind = "set";
          }
        }
        const keyTok = this.peek();
        if ( this.matchPunct("[") ) {
          this.advance();
          const keyExpr = this.parseExpr();
          this.expectValue("]");
          prop.right = keyExpr;
          isComputed = true;
          prop.computed = true;
        }
        if ( this.isObjectPropertyKeyToken() ) {
          if ( this.strictMode ) {
            if ( keyTok.legacyOctal ) {
              this.syntaxError("Parse error: a leading-zero numeric key is not allowed in strict mode");
            }
          }
          prop.name = keyTok.value;
          if ( keyTok.tokenType == "Number" ) {
            prop.numericKey = true;
          }
          this.advance();
        } else {
          if ( isComputed ) {
            const afterComputed = this.peekValue();
            if ( (afterComputed != ":") && (afterComputed != "(") ) {
              this.syntaxError("Parse error: a computed property needs a value");
            }
          } else {
            if ( this.matchValue("(") ) {
              this.syntaxError("Parse error: a property key cannot be parenthesised");
            }
          }
        }
        if ( this.matchValue("(") ) {
          isMethod = true;
          prop.method = true;
          const fnNode = new TSNode();
          fnNode.nodeType = "FunctionExpression";
          fnNode.generator = prop.generator;
          fnNode.async = prop.async;
          fnNode.start = prop.start;
          this.advance();
          this.pushScope(true);
          this.functionDepth = this.functionDepth + 1;
          const savedObjRest = this.sawRestParam;
          this.sawRestParam = false;
          const savedObjGenerator = this.inGenerator;
          this.inGenerator = prop.generator;
          const savedObjAsync = this.inAsync;
          this.inAsync = prop.async;
          const savedObjSuperCall = this.allowSuperCall;
          const savedObjSuperProp = this.allowSuperProperty;
          const savedobjIter = this.iterationDepth;
          const savedobjSwitch = this.switchDepth;
          const savedobjLabels = this.activeLabels;
          const savedobjIterLabels = this.iterationLabels;
          let freshobjLabels = [];
          let freshobjIterLabels = [];
          this.iterationDepth = 0;
          this.switchDepth = 0;
          this.activeLabels = freshobjLabels;
          this.iterationLabels = freshobjIterLabels;
          this.allowSuperCall = false;
          this.allowSuperProperty = true;
          while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
            if ( (fnNode.params.length) > 0 ) {
              this.expectValue(",");
              if ( this.matchValue(")") ) {
                if ( (fnNode.params.length) > 0 ) {
                  const lastP = fnNode.params[((fnNode.params.length) - 1)];
                  if ( lastP.nodeType == "RestElement" ) {
                    this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
                  }
                }
                break;
              }
            }
            const mParam = this.parseParam();
            if ( (mParam.name.length) > 0 ) {
              this.declareBinding("p", mParam.name);
            }
            fnNode.params.push(mParam);
          };
          this.expectValue(")");
          if ( isGetter ) {
            if ( (fnNode.params.length) != 0 ) {
              this.syntaxError("Parse error: a getter takes no parameters");
            }
          }
          if ( isSetter ) {
            if ( (fnNode.params.length) != 1 ) {
              this.syntaxError("Parse error: a setter takes exactly one parameter");
            } else {
              const setParam = fnNode.params[0];
              if ( setParam.nodeType == "RestElement" ) {
                this.syntaxError("Parse error: a setter parameter may not be a rest element");
              }
            }
          }
          if ( this.matchValue(":") ) {
            this.advance();
            fnNode.typeAnnotation = this.parseType();
          }
          if ( this.matchValue("{") ) {
            this.suppressBlockScope = true;
            const objMethodBody = this.parseBlock();
            fnNode.body = objMethodBody;
            fnNode.end = objMethodBody.end;
            if ( this.lastBlockEnabledStrict ) {
              this.recheckStrictSignature(prop.name, fnNode.params);
            }
          }
          this.popScope();
          this.allowSuperCall = savedObjSuperCall;
          this.allowSuperProperty = savedObjSuperProp;
          this.inGenerator = savedObjGenerator;
          this.inAsync = savedObjAsync;
          this.sawRestParam = savedObjRest;
          this.functionDepth = this.functionDepth - 1;
          this.iterationDepth = savedobjIter;
          this.switchDepth = savedobjSwitch;
          this.activeLabels = savedobjLabels;
          this.iterationLabels = savedobjIterLabels;
          prop.left = fnNode;
          if ( (isGetter == false) && (isSetter == false) ) {
            prop.kind = "init";
          }
        }
        if ( isMethod == false ) {
          if ( this.matchValue(":") ) {
            this.advance();
            const valueExpr = this.parseExpr();
            prop.left = valueExpr;
            prop.kind = "init";
          } else {
            if ( isComputed == false ) {
              if ( (keyTok.tokenType == "Number") || (keyTok.tokenType == "String") ) {
                this.syntaxError("Parse error: a shorthand property name cannot be a literal");
              }
              if ( this.isAlwaysReservedWord(prop.name) ) {
                this.syntaxError(("Parse error: '" + prop.name) + "' cannot be a shorthand property name");
              }
              if ( this.strictMode ) {
                if ( this.isStrictReservedReference(prop.name) ) {
                  this.syntaxError(("Parse error: '" + prop.name) + "' is reserved in strict mode");
                }
              }
              const shorthandVal = new TSNode();
              shorthandVal.nodeType = "Identifier";
              shorthandVal.name = prop.name;
              prop.left = shorthandVal;
              prop.shorthand = true;
              prop.kind = "init";
            }
          }
        }
        if ( prop.name == "__proto__" ) {
          if ( prop.shorthand == false ) {
            if ( prop.computed == false ) {
              if ( prop.method == false ) {
                if ( (prop.kind != "get") && (prop.kind != "set") ) {
                  if ( sawProto ) {
                    this.syntaxError("Parse error: duplicate __proto__ in an object literal");
                  }
                  sawProto = true;
                }
              }
            }
          }
        }
        node.children.push(prop);
      }
      if ( this.matchValue(",") ) {
        this.advance();
      } else {
        if ( this.matchValue("}") == false ) {
          if ( this.isAtEnd() == false ) {
            const badObjTok = this.peek();
            this.syntaxError("Parse error: expected ',' or '}' in object literal but got '" + (badObjTok.value + "'"));
            return node;
          }
        }
      }
      if ( this.pos == loopStartPos ) {
        break;
      }
    };
    this.expectValue("}");
    return node;
  };
  asyncArrowAhead () {
    if ( (this.pos + 1) >= (this.tokens.length) ) {
      return false;
    }
    const asyncTok0 = this.tokens[this.pos];
    const nextTok0 = this.tokens[(this.pos + 1)];
    if ( asyncTok0.line != nextTok0.line ) {
      return false;
    }
    const afterVal = this.peekAheadValue(1);
    if ( afterVal == "(" ) {
      let depth = 1;
      let k = 2;
      while ((depth > 0) && (k < (this.tokens.length))) {
        const v = this.peekAheadValue(k);
        if ( v == "(" ) {
          depth = depth + 1;
        }
        if ( v == ")" ) {
          depth = depth - 1;
        }
        k = k + 1;
      };
      if ( depth > 0 ) {
        return false;
      }
      const tail = this.peekAheadValue(k);
      if ( tail == "=>" ) {
        return true;
      }
      if ( tail == ":" ) {
        return true;
      }
      return false;
    }
    if ( this.peekNextType() == "Identifier" ) {
      if ( this.peekAheadValue(2) == "=>" ) {
        return true;
      }
    }
    return false;
  };
  parseParenOrArrow () {
    const startTok = this.peek();
    const savedPos = this.pos;
    const savedTok = this.currentToken;
    this.advance();
    let parenDepth = 1;
    while ((parenDepth > 0) && (this.isAtEnd() == false)) {
      if ( this.matchPunct("(") ) {
        parenDepth = parenDepth + 1;
      }
      if ( this.matchPunct(")") ) {
        parenDepth = parenDepth - 1;
      }
      if ( parenDepth > 0 ) {
        this.advance();
      }
    };
    if ( this.matchValue(")") == false ) {
      this.pos = savedPos;
      this.currentToken = savedTok;
      this.advance();
      const expr = this.parseExprSeq();
      this.expectValue(")");
      return expr;
    }
    this.advance();
    if ( this.matchValue(":") ) {
      if ( (this.ternaryConsequentDepth == 0) && (this.caseTestDepth == 0) ) {
        this.advance();
        this.parseType();
      }
    }
    if ( this.matchValue("=>") ) {
      this.pos = savedPos;
      this.currentToken = savedTok;
      return this.parseArrowFunction();
    }
    this.pos = savedPos;
    this.currentToken = savedTok;
    this.advance();
    const expr_1 = this.parseExprSeq();
    this.expectValue(")");
    expr_1.parenthesized = true;
    return expr_1;
  };
  parseArrowFunction () {
    const node = new TSNode();
    node.nodeType = "ArrowFunctionExpression";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("async") ) {
      this.advance();
      node.kind = "async";
      node.async = true;
    }
    this.pushScope(true);
    this.functionDepth = this.functionDepth + 1;
    const savedArrowRest = this.sawRestParam;
    this.sawRestParam = false;
    const savedArrowGenerator = this.inGenerator;
    const savedArrowAsync = this.inAsync;
    this.inAsync = node.async;
    const savedArrowAsyncParams = this.inAsyncParams;
    this.inAsyncParams = false;
    const savedArrowIter = this.iterationDepth;
    const savedArrowSwitch = this.switchDepth;
    const savedArrowLabels = this.activeLabels;
    const savedArrowIterLabels = this.iterationLabels;
    let freshArrowLabels = [];
    let freshArrowIterLabels = [];
    this.iterationDepth = 0;
    this.switchDepth = 0;
    this.activeLabels = freshArrowLabels;
    this.iterationLabels = freshArrowIterLabels;
    if ( this.matchValue("(") ) {
      this.advance();
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (node.params.length) > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(")") ) {
            if ( (node.params.length) > 0 ) {
              const lastP = node.params[((node.params.length) - 1)];
              if ( lastP.nodeType == "RestElement" ) {
                this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
              }
            }
            break;
          }
        }
        const param = this.parseParam();
        if ( (param.name.length) > 0 ) {
          this.declareBinding("p", param.name);
        }
        node.params.push(param);
      };
      this.expectValue(")");
    } else {
      const paramTok = this.expectBindingName();
      const param_1 = new TSNode();
      param_1.nodeType = "Parameter";
      param_1.name = paramTok.value;
      this.declareBinding("p", param_1.name);
      node.params.push(param_1);
    }
    if ( this.matchValue(":") ) {
      this.advance();
      const retType = this.parseType();
      node.typeAnnotation = retType;
    }
    const arrowTok = this.peek();
    if ( arrowTok.value == "=>" ) {
      if ( arrowTok.line != this.lastTokenLine ) {
        this.syntaxError("Parse error: no line terminator is allowed before '=>'");
      }
    }
    this.expectValue("=>");
    if ( this.matchValue("{") ) {
      this.suppressBlockScope = true;
      const body = this.parseBlock();
      node.body = body;
      node.end = body.end;
      if ( this.lastBlockEnabledStrict ) {
        this.recheckStrictSignature("", node.params);
      }
    } else {
      const body_1 = this.parseExpr();
      node.body = body_1;
      node.end = this.lastTokenEndPos;
      if ( node.async ) {
        const retN = new TSNode();
        retN.nodeType = "ReturnStatement";
        retN.left = body_1;
        retN.start = body_1.start;
        retN.line = body_1.line;
        retN.col = body_1.col;
        retN.end = body_1.end;
        const blockN = new TSNode();
        blockN.nodeType = "BlockStatement";
        blockN.start = body_1.start;
        blockN.line = body_1.line;
        blockN.col = body_1.col;
        blockN.end = body_1.end;
        blockN.children.push(retN);
        node.body = blockN;
      }
    }
    this.popScope();
    this.iterationDepth = savedArrowIter;
    this.switchDepth = savedArrowSwitch;
    this.activeLabels = savedArrowLabels;
    this.iterationLabels = savedArrowIterLabels;
    this.inGenerator = savedArrowGenerator;
    this.inAsync = savedArrowAsync;
    this.inAsyncParams = savedArrowAsyncParams;
    this.sawRestParam = savedArrowRest;
    this.functionDepth = this.functionDepth - 1;
    return node;
  };
  parseNewExpression () {
    const node = new TSNode();
    node.nodeType = "NewExpression";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("new");
    if ( this.matchValue(".") ) {
      this.advance();
      if ( this.matchValue("target") ) {
        const targetTok = this.peek();
        if ( targetTok.hasEscape ) {
          this.syntaxError("Parse error: 'new.target' may not use an escape sequence");
        }
        this.advance();
        node.nodeType = "MetaProperty";
        node.name = "new";
        node.value = "target";
        if ( this.functionDepth == 0 ) {
          this.syntaxError("Parse error: 'new.target' is only allowed inside a function");
        }
        return node;
      }
      const badMeta = this.peek();
      this.syntaxError(("Parse error: 'new." + badMeta.value) + "' is not a meta property");
    }
    if ( this.matchValue("super") ) {
      if ( this.peekNextValue() == "(" ) {
        this.syntaxError("Parse error: 'super' cannot be the callee of 'new'");
      }
    }
    let callee = this.parsePrimary();
    let keepMember = true;
    while (keepMember) {
      if ( this.matchValue(".") ) {
        this.advance();
        const propTok = this.parseMemberName();
        const member = new TSNode();
        member.nodeType = "MemberExpression";
        member.left = callee;
        member.name = propTok.value;
        member.start = callee.start;
        member.line = callee.line;
        member.col = callee.col;
        callee = member;
      } else {
        keepMember = false;
      }
    };
    node.left = callee;
    if ( this.matchValue("<") ) {
      let depth = 1;
      this.advance();
      while ((depth > 0) && (this.isAtEnd() == false)) {
        const v = this.peekValue();
        if ( v == "<" ) {
          depth = depth + 1;
        }
        if ( v == ">" ) {
          depth = depth - 1;
        }
        this.advance();
      };
    }
    if ( this.matchValue("(") ) {
      this.advance();
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (node.children.length) > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(")") ) {
            break;
          }
        }
        if ( this.matchValue("...") ) {
          this.advance();
          const spreadArg = this.parseExpr();
          const spread = new TSNode();
          spread.nodeType = "SpreadElement";
          spread.left = spreadArg;
          node.children.push(spread);
        } else {
          const arg = this.parseExpr();
          node.children.push(arg);
        }
      };
      this.expectValue(")");
    }
    return node;
  };
  peekNextType () {
    const nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      const nextTok = this.tokens[nextPos];
      return nextTok.tokenType;
    }
    return "EOF";
  };
  peekAheadValue (offset) {
    const aheadPos = this.pos + offset;
    if ( aheadPos < (this.tokens.length) ) {
      const tok = this.tokens[aheadPos];
      return tok.value;
    }
    return "";
  };
  startsWithLowerCase (s) {
    if ( (s.length) == 0 ) {
      return false;
    }
    const code = s.charCodeAt(0 );
    if ( (code >= 97) && (code <= 122) ) {
      return true;
    }
    return false;
  };
  looksLikeGenericCall () {
    let depth = 1;
    let offset = 1;
    const maxLookahead = 20;
    while ((depth > 0) && (offset < maxLookahead)) {
      const ahead = this.peekAheadValue(offset);
      if ( ahead == "" ) {
        return false;
      }
      if ( ahead == "<" ) {
        depth = depth + 1;
      }
      if ( ahead == ">" ) {
        depth = depth - 1;
      }
      if ( (((ahead == "{") || (ahead == "}")) || (ahead == ";")) || (ahead == "=>") ) {
        return false;
      }
      offset = offset + 1;
    };
    if ( depth == 0 ) {
      const afterClose = this.peekAheadValue(offset);
      if ( afterClose == "(" ) {
        return true;
      }
    }
    return false;
  };
  parseJSXElement () {
    const node = new TSNode();
    node.nodeType = "JSXElement";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    const opening = this.parseJSXOpeningElement();
    node.left = opening;
    if ( opening.kind == "self-closing" ) {
      node.nodeType = "JSXElement";
      return node;
    }
    const tagName = opening.name;
    while (this.isAtEnd() == false) {
      const v = this.peekValue();
      if ( v == "<" ) {
        const nextVal = this.peekNextValue();
        if ( nextVal == "/" ) {
          break;
        }
        if ( nextVal == ">" ) {
          node.children.push(this.parseJSXFragment());
        } else {
          const child = this.parseJSXElement();
          node.children.push(child);
        }
      } else {
        if ( v == "{" ) {
          const exprChild = this.parseJSXExpressionContainer();
          node.children.push(exprChild);
        } else {
          const t = this.peekType();
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            const textChild = this.parseJSXText();
            node.children.push(textChild);
          } else {
            break;
          }
        }
      }
    };
    const closing = this.parseJSXClosingElement();
    node.right = closing;
    return node;
  };
  parseJSXOpeningElement () {
    const node = new TSNode();
    node.nodeType = "JSXOpeningElement";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    const tagName = this.parseJSXElementName();
    node.name = tagName.name;
    node.left = tagName;
    while (this.isAtEnd() == false) {
      const v = this.peekValue();
      if ( (v == ">") || (v == "/") ) {
        break;
      }
      const attr = this.parseJSXAttribute();
      node.children.push(attr);
    };
    if ( this.matchValue("/") ) {
      this.advance();
      node.kind = "self-closing";
    }
    this.expectValue(">");
    return node;
  };
  parseJSXClosingElement () {
    const node = new TSNode();
    node.nodeType = "JSXClosingElement";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    this.expectValue("/");
    const tagName = this.parseJSXElementName();
    node.name = tagName.name;
    node.left = tagName;
    this.expectValue(">");
    return node;
  };
  joinHyphenatedName (firstPart) {
    let name = firstPart;
    while (this.matchValue("-")) {
      let prevEnd = 0;
      if ( this.pos > 0 ) {
        const prevTok = this.tokens[(this.pos - 1)];
        prevEnd = prevTok.end;
      }
      const hyphenTok = this.tokens[this.pos];
      if ( hyphenTok.start != prevEnd ) {
        return name;
      }
      if ( (this.pos + 1) >= (this.tokens.length) ) {
        return name;
      }
      const afterTok = this.tokens[(this.pos + 1)];
      if ( afterTok.start != hyphenTok.end ) {
        return name;
      }
      if ( (afterTok.tokenType != "Identifier") && (afterTok.tokenType != "Keyword") ) {
        return name;
      }
      this.advance();
      name = name + ("-" + afterTok.value);
      this.advance();
    };
    return name;
  };
  parseJSXElementName () {
    const node = new TSNode();
    node.nodeType = "JSXIdentifier";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    let namePart = tok.value;
    this.advance();
    namePart = this.joinHyphenatedName(namePart);
    while (this.matchValue(".")) {
      this.advance();
      const nextTok = this.peek();
      namePart = (namePart + ".") + nextTok.value;
      this.advance();
      node.nodeType = "JSXMemberExpression";
    };
    node.name = namePart;
    return node;
  };
  parseJSXAttribute () {
    const node = new TSNode();
    node.nodeType = "JSXAttribute";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    if ( this.matchValue("{") ) {
      this.advance();
      if ( this.matchValue("...") ) {
        this.advance();
        node.nodeType = "JSXSpreadAttribute";
        const arg = this.parseExpr();
        node.left = arg;
        this.expectValue("}");
        return node;
      }
    }
    let attrName = tok.value;
    this.advance();
    attrName = this.joinHyphenatedName(attrName);
    node.name = attrName;
    if ( this.matchValue("=") ) {
      this.advance();
      const valTok = this.peekValue();
      if ( valTok == "{" ) {
        const exprValue = this.parseJSXExpressionContainer();
        node.right = exprValue;
      } else {
        const strTok = this.peek();
        const strNode = new TSNode();
        strNode.nodeType = "StringLiteral";
        strNode.value = strTok.value;
        strNode.start = strTok.start;
        strNode.end = strTok.end;
        strNode.line = strTok.line;
        strNode.col = strTok.col;
        this.advance();
        node.right = strNode;
      }
    }
    return node;
  };
  parseJSXExpressionContainer () {
    const node = new TSNode();
    node.nodeType = "JSXExpressionContainer";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("{");
    if ( this.matchValue("}") ) {
      const empty = new TSNode();
      empty.nodeType = "JSXEmptyExpression";
      node.left = empty;
    } else {
      const expr = this.parseExpr();
      node.left = expr;
    }
    this.expectValue("}");
    return node;
  };
  parseJSXText () {
    const node = new TSNode();
    node.nodeType = "JSXText";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    node.value = tok.value;
    this.advance();
    return node;
  };
  parseJSXFragment () {
    const node = new TSNode();
    node.nodeType = "JSXFragment";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    this.expectValue(">");
    while (this.isAtEnd() == false) {
      const v = this.peekValue();
      if ( v == "<" ) {
        const nextVal = this.peekNextValue();
        if ( nextVal == "/" ) {
          break;
        }
        if ( nextVal == ">" ) {
          node.children.push(this.parseJSXFragment());
        } else {
          const child = this.parseJSXElement();
          node.children.push(child);
        }
      } else {
        if ( v == "{" ) {
          const exprChild = this.parseJSXExpressionContainer();
          node.children.push(exprChild);
        } else {
          const t = this.peekType();
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            const textChild = this.parseJSXText();
            node.children.push(textChild);
          } else {
            break;
          }
        }
      }
    };
    this.expectValue("<");
    this.expectValue("/");
    this.expectValue(">");
    return node;
  };
}
class EVGUnit  {
  constructor() {
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
    this.rootFontSize = 14.0;
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
  }
  resolve (parentSize, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
      return;
    }
    if ( this.unitType == 0 ) {
      this.pixels = this.value;
      return;
    }
    if ( this.unitType == 1 ) {
      this.pixels = (parentSize * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 2 ) {
      this.pixels = fontSize * this.value;
      return;
    }
    if ( this.unitType == 5 ) {
      this.pixels = this.rootFontSize * this.value;
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentSize * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 4 ) {
      this.pixels = parentSize;
      return;
    }
    this.pixels = this.value;
  };
  resolveForHeight (parentWidth, parentHeight, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 1 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    this.resolve(parentWidth, fontSize);
  };
  resolveWithHeight (parentWidth, parentHeight, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    this.resolve(parentWidth, fontSize);
  };
  isPixels () {
    return this.unitType == 0;
  };
  isPercent () {
    return this.unitType == 1;
  };
  isEm () {
    return this.unitType == 2;
  };
  isRem () {
    return this.unitType == 5;
  };
  isHeightPercent () {
    return this.unitType == 3;
  };
  isFill () {
    return this.unitType == 4;
  };
  toString () {
    if ( this.isSet == false ) {
      return "unset";
    }
    if ( this.unitType == 0 ) {
      return ((this.value.toString())) + "px";
    }
    if ( this.unitType == 1 ) {
      return ((this.value.toString())) + "%";
    }
    if ( this.unitType == 2 ) {
      return ((this.value.toString())) + "em";
    }
    if ( this.unitType == 3 ) {
      return ((this.value.toString())) + "hp";
    }
    if ( this.unitType == 4 ) {
      return "fill";
    }
    if ( this.unitType == 5 ) {
      return ((this.value.toString())) + "rem";
    }
    return (this.value.toString());
  };
}
EVGUnit.isAlpha = function(c) {
  if ( (c >= 65) && (c <= 90) ) {
    return true;
  }
  return (c >= 97) && (c <= 122);
};
EVGUnit.pxPerUnit = function(suffix) {
  if ( suffix == "pt" ) {
    return 96.0 / 72.0;
  }
  if ( suffix == "pc" ) {
    return 16.0;
  }
  if ( suffix == "in" ) {
    return 96.0;
  }
  if ( suffix == "mm" ) {
    return 96.0 / 25.4;
  }
  if ( suffix == "cm" ) {
    return 96.0 / 2.54;
  }
  return 0.0;
};
EVGUnit.create = function(val, uType) {
  const unit = new EVGUnit();
  unit.value = val;
  unit.unitType = uType;
  unit.isSet = true;
  return unit;
};
EVGUnit.px = function(val) {
  const unit = EVGUnit.create(val, 0);
  unit.pixels = val;
  return unit;
};
EVGUnit.percent = function(val) {
  return EVGUnit.create(val, 1);
};
EVGUnit.em = function(val) {
  return EVGUnit.create(val, 2);
};
EVGUnit.rem = function(val) {
  return EVGUnit.create(val, 5);
};
EVGUnit.heightPercent = function(val) {
  return EVGUnit.create(val, 3);
};
EVGUnit.fill = function() {
  return EVGUnit.create(100.0, 4);
};
EVGUnit.unset = function() {
  const unit = new EVGUnit();
  unit.isSet = false;
  return unit;
};
EVGUnit.parse = function(str) {
  const unit = new EVGUnit();
  const trimmed = str.trim();
  const __len = trimmed.length;
  if ( __len == 0 ) {
    return unit;
  }
  if ( trimmed == "fill" ) {
    unit.value = 100.0;
    unit.unitType = 4;
    unit.isSet = true;
    return unit;
  }
  if ( trimmed == "auto" ) {
    return unit;
  }
  const lastChar = trimmed.charCodeAt((__len - 1) );
  if ( lastChar == 37 ) {
    const numStr = trimmed.substring(0, (__len - 1) );
    const numVal = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
    if ( typeof(numVal) != "undefined" ) {
      unit.value = numVal;
      unit.unitType = 1;
      unit.isSet = true;
    }
    return unit;
  }
  if ( __len >= 3 ) {
    const suffix3 = trimmed.substring((__len - 3), __len );
    if ( suffix3 == "rem" ) {
      const numStr3 = trimmed.substring(0, (__len - 3) );
      const numVal3 = isNaN( parseFloat(numStr3) ) ? undefined : parseFloat(numStr3);
      if ( typeof(numVal3) != "undefined" ) {
        unit.value = numVal3;
        unit.unitType = 5;
        unit.isSet = true;
      }
      return unit;
    }
  }
  if ( __len >= 2 ) {
    const suffix = trimmed.substring((__len - 2), __len );
    const perUnit = EVGUnit.pxPerUnit(suffix);
    if ( perUnit > 0.0 ) {
      const numStrA = trimmed.substring(0, (__len - 2) );
      const numValA = isNaN( parseFloat(numStrA) ) ? undefined : parseFloat(numStrA);
      if ( typeof(numValA) != "undefined" ) {
        unit.value = (numValA) * perUnit;
        unit.pixels = unit.value;
        unit.unitType = 0;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "em" ) {
      const numStr_1 = trimmed.substring(0, (__len - 2) );
      const numVal_1 = isNaN( parseFloat(numStr_1) ) ? undefined : parseFloat(numStr_1);
      if ( typeof(numVal_1) != "undefined" ) {
        unit.value = numVal_1;
        unit.unitType = 2;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "px" ) {
      const numStr_2 = trimmed.substring(0, (__len - 2) );
      const numVal_2 = isNaN( parseFloat(numStr_2) ) ? undefined : parseFloat(numStr_2);
      if ( typeof(numVal_2) != "undefined" ) {
        unit.value = numVal_2;
        unit.pixels = unit.value;
        unit.unitType = 0;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "hp" ) {
      const numStr_3 = trimmed.substring(0, (__len - 2) );
      const numVal_3 = isNaN( parseFloat(numStr_3) ) ? undefined : parseFloat(numStr_3);
      if ( typeof(numVal_3) != "undefined" ) {
        unit.value = numVal_3;
        unit.unitType = 3;
        unit.isSet = true;
      }
      return unit;
    }
  }
  if ( EVGUnit.isAlpha(lastChar) || (lastChar == 41) ) {
    return unit;
  }
  const numVal_4 = isNaN( parseFloat(trimmed) ) ? undefined : parseFloat(trimmed);
  if ( typeof(numVal_4) != "undefined" ) {
    unit.value = numVal_4;
    unit.pixels = unit.value;
    unit.unitType = 0;
    unit.isSet = true;
  }
  return unit;
};
class EVGColor  {
  constructor() {
    this.r = 0.0;
    this.g = 0.0;
    this.b = 0.0;
    this.a = 1.0;
    this.isSet = true;
    this.r = 0.0;
    this.g = 0.0;
    this.b = 0.0;
    this.a = 1.0;
    this.isSet = true;
  }
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
  alpha () {
    if ( this.a < 0.0 ) {
      return 0.0;
    }
    if ( this.a > 1.0 ) {
      return 1.0;
    }
    return this.a;
  };
  toCSSString () {
    if ( this.isSet == false ) {
      return "none";
    }
    if ( this.a < 1.0 ) {
      return ((((((("rgba(" + ((this.red().toString()))) + ",") + ((this.green().toString()))) + ",") + ((this.blue().toString()))) + ",") + ((this.alpha().toString()))) + ")";
    }
    return ((((("rgb(" + ((this.red().toString()))) + ",") + ((this.green().toString()))) + ",") + ((this.blue().toString()))) + ")";
  };
  toHexString () {
    if ( this.isSet == false ) {
      return "none";
    }
    const hexChars = "0123456789ABCDEF";
    const rH = this.red();
    const gH = this.green();
    const bH = this.blue();
    const r1D = (rH) / 16.0;
    const r1 = Math.floor( r1D);
    const r2 = rH % 16;
    const g1D = (gH) / 16.0;
    const g1 = Math.floor( g1D);
    const g2 = gH % 16;
    const b1D = (bH) / 16.0;
    const b1 = Math.floor( b1D);
    const b2 = bH % 16;
    return ((((("#" + (String.fromCharCode((hexChars.charCodeAt(r1 ))))) + (String.fromCharCode((hexChars.charCodeAt(r2 ))))) + (String.fromCharCode((hexChars.charCodeAt(g1 ))))) + (String.fromCharCode((hexChars.charCodeAt(g2 ))))) + (String.fromCharCode((hexChars.charCodeAt(b1 ))))) + (String.fromCharCode((hexChars.charCodeAt(b2 ))));
  };
  toPDFColorString () {
    if ( this.isSet == false ) {
      return "";
    }
    const rN = this.r / 255.0;
    const gN = this.g / 255.0;
    const bN = this.b / 255.0;
    return (((((rN.toString())) + " ") + ((gN.toString()))) + " ") + ((bN.toString()));
  };
  withAlpha (newAlpha) {
    return EVGColor.create(this.r, this.g, this.b, newAlpha);
  };
  lighten (amount) {
    const newR = this.r + ((255.0 - this.r) * amount);
    const newG = this.g + ((255.0 - this.g) * amount);
    const newB = this.b + ((255.0 - this.b) * amount);
    return EVGColor.create(newR, newG, newB, this.a);
  };
  darken (amount) {
    const newR = this.r * (1.0 - amount);
    const newG = this.g * (1.0 - amount);
    const newB = this.b * (1.0 - amount);
    return EVGColor.create(newR, newG, newB, this.a);
  };
}
EVGColor.create = function(red, green, blue, alpha) {
  const c = new EVGColor();
  c.r = red;
  c.g = green;
  c.b = blue;
  c.a = alpha;
  c.isSet = true;
  return c;
};
EVGColor.rgb = function(red, green, blue) {
  return EVGColor.create((red), (green), (blue), 1.0);
};
EVGColor.rgba = function(red, green, blue, alpha) {
  return EVGColor.create((red), (green), (blue), alpha);
};
EVGColor.noColor = function() {
  const c = new EVGColor();
  c.isSet = false;
  return c;
};
EVGColor.black = function() {
  return EVGColor.rgb(0, 0, 0);
};
EVGColor.white = function() {
  return EVGColor.rgb(255, 255, 255);
};
EVGColor.transparent = function() {
  return EVGColor.rgba(0, 0, 0, 0.0);
};
EVGColor.hexDigit = function(ch) {
  if ( (ch >= 48) && (ch <= 57) ) {
    return ch - 48;
  }
  if ( (ch >= 65) && (ch <= 70) ) {
    return (ch - 65) + 10;
  }
  if ( (ch >= 97) && (ch <= 102) ) {
    return (ch - 97) + 10;
  }
  return 0;
};
EVGColor.parseHex = function(hex) {
  const c = new EVGColor();
  let __len = hex.length;
  let start = 0;
  if ( __len > 0 ) {
    const firstChar = hex.charCodeAt(0 );
    if ( firstChar == 35 ) {
      start = 1;
      __len = __len - 1;
    }
  }
  if ( __len == 3 ) {
    const r1 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const g1 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const b1 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    c.r = ((r1 * 16) + r1);
    c.g = ((g1 * 16) + g1);
    c.b = ((b1 * 16) + b1);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 6 ) {
    const r1_1 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const r2 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const g1_1 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    const g2 = EVGColor.hexDigit((hex.charCodeAt((start + 3) )));
    const b1_1 = EVGColor.hexDigit((hex.charCodeAt((start + 4) )));
    const b2 = EVGColor.hexDigit((hex.charCodeAt((start + 5) )));
    c.r = ((r1_1 * 16) + r2);
    c.g = ((g1_1 * 16) + g2);
    c.b = ((b1_1 * 16) + b2);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 8 ) {
    const r1_2 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const r2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const g1_2 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    const g2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 3) )));
    const b1_2 = EVGColor.hexDigit((hex.charCodeAt((start + 4) )));
    const b2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 5) )));
    const a1 = EVGColor.hexDigit((hex.charCodeAt((start + 6) )));
    const a2 = EVGColor.hexDigit((hex.charCodeAt((start + 7) )));
    c.r = ((r1_2 * 16) + r2_1);
    c.g = ((g1_2 * 16) + g2_1);
    c.b = ((b1_2 * 16) + b2_1);
    c.a = (((a1 * 16) + a2)) / 255.0;
    c.isSet = true;
    return c;
  }
  c.isSet = false;
  return c;
};
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
EVGColor.hslToRgb = function(h, s, l) {
  const c = new EVGColor();
  const hNorm = h / 360.0;
  const sNorm = s / 100.0;
  const lNorm = l / 100.0;
  if ( sNorm == 0.0 ) {
    const gray = lNorm * 255.0;
    c.r = gray;
    c.g = gray;
    c.b = gray;
  } else {
    let q = 0.0;
    if ( lNorm < 0.5 ) {
      q = lNorm * (1.0 + sNorm);
    } else {
      q = (lNorm + sNorm) - (lNorm * sNorm);
    }
    const p = (2.0 * lNorm) - q;
    c.r = EVGColor.hue2rgb(p, q, (hNorm + (1.0 / 3.0))) * 255.0;
    c.g = EVGColor.hue2rgb(p, q, hNorm) * 255.0;
    c.b = EVGColor.hue2rgb(p, q, (hNorm - (1.0 / 3.0))) * 255.0;
  }
  c.a = 1.0;
  c.isSet = true;
  return c;
};
EVGColor.parseNumber = function(str) {
  const val = isNaN( parseFloat((str.trim())) ) ? undefined : parseFloat((str.trim()));
  return val;
};
EVGColor.parse = function(str) {
  const trimmed = str.trim();
  const __len = trimmed.length;
  if ( __len == 0 ) {
    return EVGColor.noColor();
  }
  const firstChar = trimmed.charCodeAt(0 );
  if ( firstChar == 35 ) {
    return EVGColor.parseHex(trimmed);
  }
  if ( __len >= 4 ) {
    const prefix = trimmed.substring(0, 4 );
    if ( prefix == "rgba" ) {
      return EVGColor.parseRgba(trimmed);
    }
    const prefix3 = trimmed.substring(0, 3 );
    if ( prefix3 == "rgb" ) {
      return EVGColor.parseRgb(trimmed);
    }
    if ( prefix3 == "hsl" ) {
      return EVGColor.parseHsl(trimmed);
    }
  }
  return EVGColor.parseNamed(trimmed);
};
EVGColor.parseRgb = function(str) {
  const c = new EVGColor();
  const __len = str.length;
  let start = 0;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    i = i + 1;
  };
  let end = __len - 1;
  i = __len - 1;
  while (i >= 0) {
    const ch_1 = str.charCodeAt(i );
    if ( ch_1 == 41 ) {
      end = i;
    }
    i = i - 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_2 = content.charCodeAt(i );
    if ( (ch_2 == 44) || (ch_2 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_2));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 3 ) {
    c.r = EVGColor.parseNumber((parts[0]));
    c.g = EVGColor.parseNumber((parts[1]));
    c.b = EVGColor.parseNumber((parts[2]));
    c.a = 1.0;
    c.isSet = true;
  }
  return c;
};
EVGColor.parseRgba = function(str) {
  const c = EVGColor.parseRgb(str);
  const __len = str.length;
  let start = 0;
  let end = __len - 1;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_1 = content.charCodeAt(i );
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_1));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 4 ) {
    c.r = EVGColor.parseNumber((parts[0]));
    c.g = EVGColor.parseNumber((parts[1]));
    c.b = EVGColor.parseNumber((parts[2]));
    c.a = EVGColor.parseNumber((parts[3]));
    c.isSet = true;
  }
  return c;
};
EVGColor.parseHsl = function(str) {
  const __len = str.length;
  let start = 0;
  let end = __len - 1;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_1 = content.charCodeAt(i );
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_1));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 3 ) {
    const h = EVGColor.parseNumber((parts[0]));
    const s = EVGColor.parseNumber((parts[1]));
    const l = EVGColor.parseNumber((parts[2]));
    const c = EVGColor.hslToRgb(h, s, l);
    if ( (parts.length) >= 4 ) {
      c.a = EVGColor.parseNumber((parts[3]));
    }
    return c;
  }
  return EVGColor.noColor();
};
EVGColor.parseNamed = function(name) {
  let lower = "";
  const __len = name.length;
  let i = 0;
  while (i < __len) {
    const ch = name.charCodeAt(i );
    if ( (ch >= 65) && (ch <= 90) ) {
      lower = lower + (String.fromCharCode((ch + 32)));
    } else {
      lower = lower + (String.fromCharCode(ch));
    }
    i = i + 1;
  };
  if ( lower == "black" ) {
    return EVGColor.rgb(0, 0, 0);
  }
  if ( lower == "white" ) {
    return EVGColor.rgb(255, 255, 255);
  }
  if ( lower == "red" ) {
    return EVGColor.rgb(255, 0, 0);
  }
  if ( lower == "green" ) {
    return EVGColor.rgb(0, 128, 0);
  }
  if ( lower == "blue" ) {
    return EVGColor.rgb(0, 0, 255);
  }
  if ( lower == "yellow" ) {
    return EVGColor.rgb(255, 255, 0);
  }
  if ( lower == "cyan" ) {
    return EVGColor.rgb(0, 255, 255);
  }
  if ( lower == "magenta" ) {
    return EVGColor.rgb(255, 0, 255);
  }
  if ( lower == "gray" ) {
    return EVGColor.rgb(128, 128, 128);
  }
  if ( lower == "grey" ) {
    return EVGColor.rgb(128, 128, 128);
  }
  if ( lower == "orange" ) {
    return EVGColor.rgb(255, 165, 0);
  }
  if ( lower == "purple" ) {
    return EVGColor.rgb(128, 0, 128);
  }
  if ( lower == "pink" ) {
    return EVGColor.rgb(255, 192, 203);
  }
  if ( lower == "brown" ) {
    return EVGColor.rgb(165, 42, 42);
  }
  if ( lower == "transparent" ) {
    return EVGColor.transparent();
  }
  if ( lower == "none" ) {
    return EVGColor.noColor();
  }
  return EVGColor.noColor();
};
class EVGBox  {
  constructor() {
    this.marginTopPx = 0.0;
    this.marginRightPx = 0.0;
    this.marginBottomPx = 0.0;
    this.marginLeftPx = 0.0;
    this.paddingTopPx = 0.0;
    this.paddingRightPx = 0.0;
    this.paddingBottomPx = 0.0;
    this.paddingLeftPx = 0.0;
    this.borderWidthPx = 0.0;
    this.borderRadiusPx = 0.0;
    this.marginTop = EVGUnit.unset();
    this.marginRight = EVGUnit.unset();
    this.marginBottom = EVGUnit.unset();
    this.marginLeft = EVGUnit.unset();
    this.paddingTop = EVGUnit.unset();
    this.paddingRight = EVGUnit.unset();
    this.paddingBottom = EVGUnit.unset();
    this.paddingLeft = EVGUnit.unset();
    this.borderWidth = EVGUnit.unset();
    this.borderColor = EVGColor.noColor();
    this.borderRadius = EVGUnit.unset();
  }
  setMargin (all) {
    this.marginTop = all;
    this.marginRight = all;
    this.marginBottom = all;
    this.marginLeft = all;
  };
  setMarginValues (top, right, bottom, left) {
    this.marginTop = top;
    this.marginRight = right;
    this.marginBottom = bottom;
    this.marginLeft = left;
  };
  setPadding (all) {
    this.paddingTop = all;
    this.paddingRight = all;
    this.paddingBottom = all;
    this.paddingLeft = all;
  };
  setPaddingValues (top, right, bottom, left) {
    this.paddingTop = top;
    this.paddingRight = right;
    this.paddingBottom = bottom;
    this.paddingLeft = left;
  };
  resolveUnits (parentWidth, parentHeight, fontSize, rootFontSize) {
    this.marginTop.rootFontSize = rootFontSize;
    this.marginRight.rootFontSize = rootFontSize;
    this.marginBottom.rootFontSize = rootFontSize;
    this.marginLeft.rootFontSize = rootFontSize;
    this.paddingTop.rootFontSize = rootFontSize;
    this.paddingRight.rootFontSize = rootFontSize;
    this.paddingBottom.rootFontSize = rootFontSize;
    this.paddingLeft.rootFontSize = rootFontSize;
    this.borderWidth.rootFontSize = rootFontSize;
    this.borderRadius.rootFontSize = rootFontSize;
    this.marginTop.resolve(parentWidth, fontSize);
    this.marginTopPx = this.marginTop.pixels;
    this.marginRight.resolve(parentWidth, fontSize);
    this.marginRightPx = this.marginRight.pixels;
    this.marginBottom.resolve(parentWidth, fontSize);
    this.marginBottomPx = this.marginBottom.pixels;
    this.marginLeft.resolve(parentWidth, fontSize);
    this.marginLeftPx = this.marginLeft.pixels;
    this.paddingTop.resolve(parentWidth, fontSize);
    this.paddingTopPx = this.paddingTop.pixels;
    this.paddingRight.resolve(parentWidth, fontSize);
    this.paddingRightPx = this.paddingRight.pixels;
    this.paddingBottom.resolve(parentWidth, fontSize);
    this.paddingBottomPx = this.paddingBottom.pixels;
    this.paddingLeft.resolve(parentWidth, fontSize);
    this.paddingLeftPx = this.paddingLeft.pixels;
    this.borderWidth.resolve(parentWidth, fontSize);
    this.borderWidthPx = this.borderWidth.pixels;
    let smallerDim = parentWidth;
    if ( parentHeight < parentWidth ) {
      smallerDim = parentHeight;
    }
    this.borderRadius.resolve(smallerDim, fontSize);
    this.borderRadiusPx = this.borderRadius.pixels;
  };
  getHorizontalChrome () {
    return (this.paddingLeftPx + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getVerticalChrome () {
    return (this.paddingTopPx + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
  };
  getInnerWidth (outerWidth) {
    const inner = outerWidth - this.getHorizontalChrome();
    if ( inner < 0.0 ) {
      return 0.0;
    }
    return inner;
  };
  getInnerHeight (outerHeight) {
    const inner = outerHeight - this.getVerticalChrome();
    if ( inner < 0.0 ) {
      return 0.0;
    }
    return inner;
  };
  getTotalWidth (contentWidth) {
    return ((((contentWidth + this.marginLeftPx) + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getTotalHeight (contentHeight) {
    return ((((contentHeight + this.marginTopPx) + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
  };
  getContentX (elementX) {
    return ((elementX + this.marginLeftPx) + this.borderWidthPx) + this.paddingLeftPx;
  };
  getContentY (elementY) {
    return ((elementY + this.marginTopPx) + this.borderWidthPx) + this.paddingTopPx;
  };
  getHorizontalSpace () {
    return (((this.marginLeftPx + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getVerticalSpace () {
    return (((this.marginTopPx + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
  };
  getMarginHorizontal () {
    return this.marginLeftPx + this.marginRightPx;
  };
  getMarginVertical () {
    return this.marginTopPx + this.marginBottomPx;
  };
  getPaddingHorizontal () {
    return this.paddingLeftPx + this.paddingRightPx;
  };
  getPaddingVertical () {
    return this.paddingTopPx + this.paddingBottomPx;
  };
  toString () {
    return ((((((((((((((((("Box[margin:" + ((this.marginTopPx.toString()))) + "/") + ((this.marginRightPx.toString()))) + "/") + ((this.marginBottomPx.toString()))) + "/") + ((this.marginLeftPx.toString()))) + " padding:") + ((this.paddingTopPx.toString()))) + "/") + ((this.paddingRightPx.toString()))) + "/") + ((this.paddingBottomPx.toString()))) + "/") + ((this.paddingLeftPx.toString()))) + " border:") + ((this.borderWidthPx.toString()))) + "]";
  };
}
class EVGGradientStop  {
  constructor() {
    this.percentage = 0.0;
    this.color = new EVGColor();
  }
}
EVGGradientStop.create = function(pct, col) {
  const stop = new EVGGradientStop();
  stop.percentage = pct;
  stop.color = col;
  return stop;
};
class EVGGradient  {
  constructor() {
    this.isSet = false;
    this.isLinear = true;
    this.angle = 0.0;
    this.stops = [];
    let s = [];
    this.stops = s;
  }
  getStartColor () {
    if ( (this.stops.length) > 0 ) {
      const stop = this.stops[0];
      return stop.color;
    }
    return EVGColor.noColor();
  };
  getEndColor () {
    const __len = this.stops.length;
    if ( __len > 0 ) {
      const stop = this.stops[(__len - 1)];
      return stop.color;
    }
    return EVGColor.noColor();
  };
  getStopCount () {
    return this.stops.length;
  };
  getStop (index) {
    return this.stops[index];
  };
  addStop (percentage, color) {
    const stop = EVGGradientStop.create(percentage, color);
    this.stops.push(stop);
  };
  toCSSString () {
    if ( this.isSet == false ) {
      return "";
    }
    let result = "";
    if ( this.isLinear ) {
      result = ("linear-gradient(" + ((this.angle.toString()))) + "deg";
    } else {
      result = "radial-gradient(circle";
    }
    const numStops = this.stops.length;
    let i = 0;
    while (i < numStops) {
      const stop = this.stops[i];
      result = (result + ", ") + stop.color.toCSSString();
      i = i + 1;
    };
    result = result + ")";
    return result;
  };
}
EVGGradient.parse = function(gradStr) {
  const grad = new EVGGradient();
  const __len = gradStr.length;
  if ( __len == 0 ) {
    return grad;
  }
  const linearIdx = gradStr.indexOf("linear-gradient");
  const radialIdx = gradStr.indexOf("radial-gradient");
  if ( linearIdx >= 0 ) {
    grad.isLinear = true;
    grad.isSet = true;
  }
  if ( radialIdx >= 0 ) {
    grad.isLinear = false;
    grad.isSet = true;
  }
  if ( grad.isSet == false ) {
    return grad;
  }
  if ( grad.isLinear ) {
    const degIdx = gradStr.indexOf("deg");
    if ( degIdx > 0 ) {
      const startIdx = gradStr.indexOf("(");
      if ( startIdx >= 0 ) {
        const angleStr = gradStr.substring((startIdx + 1), degIdx );
        const angleVal = isNaN( parseFloat((angleStr.trim())) ) ? undefined : parseFloat((angleStr.trim()));
        if ( typeof(angleVal) != "undefined" ) {
          grad.angle = angleVal;
        }
      }
    }
  }
  let colors = [];
  let i = 0;
  while (i < __len) {
    const ch = gradStr.charCodeAt(i );
    if ( ch == 35 ) {
      const colorStart = i;
      let colorEnd = i + 1;
      while (colorEnd < __len) {
        const c = gradStr.charCodeAt(colorEnd );
        let isHex = false;
        if ( (c >= 48) && (c <= 57) ) {
          isHex = true;
        }
        if ( (c >= 65) && (c <= 70) ) {
          isHex = true;
        }
        if ( (c >= 97) && (c <= 102) ) {
          isHex = true;
        }
        if ( isHex ) {
          colorEnd = colorEnd + 1;
        } else {
          break;
        }
      };
      const colorStr = gradStr.substring(colorStart, colorEnd );
      const parsedColor = EVGColor.parseHex(colorStr);
      if ( parsedColor.isSet ) {
        colors.push(parsedColor);
      }
      i = colorEnd;
    } else {
      i = i + 1;
    }
  };
  const numColors = colors.length;
  if ( numColors > 0 ) {
    let colorIdx = 0;
    while (colorIdx < numColors) {
      let pct = 0.0;
      if ( numColors > 1 ) {
        pct = (colorIdx) / ((numColors - 1));
      }
      const col = colors[colorIdx];
      grad.addStop(pct, col);
      colorIdx = colorIdx + 1;
    };
  }
  return grad;
};
class EVGElement  {
  constructor() {
    this.id = "";
    this.tagName = "div";
    this.elementType = 0;
    this.format = "";
    this.orientation = "";
    this.pageWidth = 0.0;
    this.pageHeight = 0.0;
    this.children = [];
    this.opacity = 1.0;
    this.gradientSet = false;
    this.gradientDir = 0;
    this.absPosSet = false;     /** note: unused */
    this.absX = 0.0;     /** note: unused */
    this.absY = 0.0;     /** note: unused */
    this.glowIntensity = 0.0;
    this.bgImageSet = false;
    this.bgImagePath = "";
    this.direction = "row";
    this.align = "left";
    this.verticalAlign = "top";
    this.isInline = false;
    this.lineBreak = false;
    this.overflow = "visible";
    this.fontSizeInherited = false;
    this.fontSizeBase = 14.0;
    this.rootFontSize = 14.0;
    this.fontFamily = "Noto Sans";
    this.fontWeight = "normal";
    this.lineHeight = 1.2;
    this.textAlign = "left";
    this.textContent = "";
    this.display = "block";
    this.flex = 0.0;
    this.flexShrink = 1.0;
    this.flexDirection = "column";
    this.justifyContent = "flex-start";
    this.alignItems = "flex-start";
    this.alignContent = "flex-start";
    this.flexWrap = "wrap";
    this.gridTemplateColumns = "";
    this.gridTemplateRows = "";
    this.subgridColumnSizes = [];
    this.subgridRowSizes = [];
    this.computedRowSizes = [];
    this.subgridPending = false;
    this.gridTemplateAreas = "";
    this.gridAutoFlow = "row";
    this.fullBleed = false;
    this.gridArea = "";
    this.gridColumn = "";
    this.gridRow = "";
    this.position = "relative";
    this.src = "";
    this.alt = "";
    this.imageViewBox = "";
    this.imageViewBoxX = 0.0;
    this.imageViewBoxY = 0.0;
    this.imageViewBoxW = 1.0;
    this.imageViewBoxH = 1.0;
    this.imageViewBoxSet = false;
    this.objectFit = "cover";
    this.sourceWidth = 0.0;
    this.sourceHeight = 0.0;
    this.svgPath = "";
    this.viewBox = "";
    this.strokeWidth = 0.0;
    this.clipPath = "";
    this.className = "";
    this.theme = "";
    this.inlineProps = [];
    this.imageQuality = 0;
    this.maxImageSize = 0;
    this.rotate = 0.0;
    this.scale = 1.0;
    this.backgroundGradient = "";
    this.gradient = new EVGGradient();
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.calculatedInnerWidth = 0.0;
    this.calculatedInnerHeight = 0.0;
    this.calculatedFlexWidth = 0.0;
    this.calculatedFlexHeight = 0.0;
    this.calculatedBaseline = 0.0;
    this.calculatedDescent = 0.0;
    this.hasBaseline = false;
    this.hasDefiniteHeight = false;
    this.calculatedPage = 0;
    this.isAbsolute = false;
    this.isLayoutComplete = false;
    this.unitsResolved = false;
    this.hasReturn = false;     /** note: unused */
    this.hasBreak = false;     /** note: unused */
    this.hasContinue = false;     /** note: unused */
    this.inheritedFontSize = 14.0;
    this.tagName = "div";
    this.elementType = 0;
    this.width = EVGUnit.unset();
    this.height = EVGUnit.unset();
    this.minWidth = EVGUnit.unset();
    this.minHeight = EVGUnit.unset();
    this.maxWidth = EVGUnit.unset();
    this.maxHeight = EVGUnit.unset();
    this.left = EVGUnit.unset();
    this.top = EVGUnit.unset();
    this.right = EVGUnit.unset();
    this.bottom = EVGUnit.unset();
    this.x = EVGUnit.unset();
    this.y = EVGUnit.unset();
    this.gap = EVGUnit.unset();
    this.flexBasis = EVGUnit.unset();
    this.rowGap = EVGUnit.unset();
    this.columnGap = EVGUnit.unset();
    const newBox = new EVGBox();
    this.box = newBox;
    this.backgroundColor = EVGColor.noColor();
    this.color = EVGColor.black();
    this.fontSize = EVGUnit.unset();
    this.shadowRadius = EVGUnit.unset();
    this.shadowColor = EVGColor.noColor();
    this.shadowOffsetX = EVGUnit.unset();
    this.shadowOffsetY = EVGUnit.unset();
    this.imageOffsetX = EVGUnit.unset();
    this.imageOffsetY = EVGUnit.unset();
    this.fillColor = EVGColor.noColor();
    this.strokeColor = EVGColor.noColor();
  }
  addChild (child) {
    this.children.push(child);
  };
  resetLayoutState () {
    this.unitsResolved = false;
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.hasDefiniteHeight = false;
    this.calculatedBaseline = 0.0;
    this.calculatedDescent = 0.0;
    this.hasBaseline = false;
    let i = 0;
    while (i < (this.children.length)) {
      const child = this.children[i];
      child.resetLayoutState();
      i = i + 1;
    };
  };
  getChildCount () {
    return this.children.length;
  };
  getChild (index) {
    return this.children[index];
  };
  hasParent () {
    if ( typeof(this.parent) != "undefined" ) {
      return true;
    }
    return false;
  };
  isContainer () {
    return this.elementType == 0;
  };
  isText () {
    return this.elementType == 1;
  };
  isImage () {
    return this.elementType == 2;
  };
  isPath () {
    return this.elementType == 3;
  };
  hasAbsolutePosition () {
    if ( (this.tagName == "layer") || (this.tagName == "Layer") ) {
      return true;
    }
    if ( this.left.isSet ) {
      return true;
    }
    if ( this.top.isSet ) {
      return true;
    }
    if ( this.right.isSet ) {
      return true;
    }
    if ( this.bottom.isSet ) {
      return true;
    }
    if ( this.x.isSet ) {
      return true;
    }
    if ( this.y.isSet ) {
      return true;
    }
    return false;
  };
  resolveBookFormat () {
    let w = 595.0;
    let h = 842.0;
    if ( this.format == "a4" ) {
      w = 595.0;
      h = 842.0;
    }
    if ( this.format == "letter" ) {
      w = 612.0;
      h = 792.0;
    }
    if ( this.format == "trade-5x8" ) {
      w = 360.0;
      h = 576.0;
    }
    if ( this.format == "trade-6x9" ) {
      w = 432.0;
      h = 648.0;
    }
    if ( this.format == "trade-8x10" ) {
      w = 576.0;
      h = 720.0;
    }
    if ( this.format == "mini-square" ) {
      w = 360.0;
      h = 360.0;
    }
    if ( this.format == "small-square" ) {
      w = 504.0;
      h = 504.0;
    }
    if ( this.format == "standard-portrait" ) {
      w = 576.0;
      h = 720.0;
    }
    if ( this.format == "standard-landscape" ) {
      w = 720.0;
      h = 576.0;
    }
    if ( this.format == "large-landscape" ) {
      w = 936.0;
      h = 792.0;
    }
    if ( this.format == "large-square" ) {
      w = 864.0;
      h = 864.0;
    }
    if ( this.format == "magazine" ) {
      w = 612.0;
      h = 792.0;
    }
    if ( this.orientation == "landscape" ) {
      if ( w < h ) {
        const temp = w;
        w = h;
        h = temp;
      }
    }
    if ( this.orientation == "portrait" ) {
      if ( w > h ) {
        const temp_1 = w;
        w = h;
        h = temp_1;
      }
    }
    if ( this.pageWidth > 0.0 ) {
      w = this.pageWidth;
    }
    if ( this.pageHeight > 0.0 ) {
      h = this.pageHeight;
    }
    this.pageWidth = w;
    this.pageHeight = h;
  };
  effectiveFontFamily () {
    if ( this.fontWeight == "bold" ) {
      return this.fontFamily + "-Bold";
    }
    return this.fontFamily;
  };
  inheritProperties (parentEl) {
    if ( this.fontFamily == "Noto Sans" ) {
      this.fontFamily = parentEl.fontFamily;
    }
    if ( this.color.isSet == false ) {
      this.color = parentEl.color;
    }
    this.fontSizeBase = parentEl.inheritedFontSize;
    this.rootFontSize = parentEl.rootFontSize;
    this.applyOwnFontSize();
  };
  applyOwnFontSize () {
    let authored = this.fontSize.isSet;
    if ( this.fontSizeInherited ) {
      authored = false;
    }
    if ( authored ) {
      this.fontSize.rootFontSize = this.rootFontSize;
      this.fontSize.resolve(this.fontSizeBase, this.fontSizeBase);
      this.inheritedFontSize = this.fontSize.pixels;
    } else {
      this.inheritedFontSize = this.fontSizeBase;
      this.fontSize = EVGUnit.px(this.fontSizeBase);
      this.fontSizeInherited = true;
    }
  };
  resolveUnits (parentWidth, parentHeight) {
    if ( this.unitsResolved ) {
      return;
    }
    this.unitsResolved = true;
    const fs = this.inheritedFontSize;
    const rfs = this.rootFontSize;
    this.width.rootFontSize = rfs;
    this.height.rootFontSize = rfs;
    this.flexBasis.rootFontSize = rfs;
    this.minWidth.rootFontSize = rfs;
    this.minHeight.rootFontSize = rfs;
    this.maxWidth.rootFontSize = rfs;
    this.maxHeight.rootFontSize = rfs;
    this.left.rootFontSize = rfs;
    this.top.rootFontSize = rfs;
    this.right.rootFontSize = rfs;
    this.bottom.rootFontSize = rfs;
    this.x.rootFontSize = rfs;
    this.y.rootFontSize = rfs;
    this.shadowRadius.rootFontSize = rfs;
    this.shadowOffsetX.rootFontSize = rfs;
    this.shadowOffsetY.rootFontSize = rfs;
    this.width.resolveWithHeight(parentWidth, parentHeight, fs);
    this.height.resolveForHeight(parentWidth, parentHeight, fs);
    this.flexBasis.resolve(parentWidth, fs);
    this.minWidth.resolve(parentWidth, fs);
    this.minHeight.resolve(parentHeight, fs);
    this.maxWidth.resolve(parentWidth, fs);
    this.maxHeight.resolve(parentHeight, fs);
    this.left.resolve(parentWidth, fs);
    this.top.resolve(parentHeight, fs);
    this.right.resolve(parentWidth, fs);
    this.bottom.resolve(parentHeight, fs);
    this.x.resolve(parentWidth, fs);
    this.y.resolve(parentHeight, fs);
    this.box.resolveUnits(parentWidth, parentHeight, fs, rfs);
    this.shadowRadius.resolve(parentWidth, fs);
    this.shadowOffsetX.resolve(parentWidth, fs);
    this.shadowOffsetY.resolve(parentHeight, fs);
    this.isAbsolute = this.hasAbsolutePosition();
  };
  markInline (name) {
    const key = EVGElement.toKebab(name);
    if ( this.hasInline(key) == false ) {
      this.inlineProps.push(key);
    }
  };
  hasInline (name) {
    const key = EVGElement.toKebab(name);
    let i = 0;
    while (i < (this.inlineProps.length)) {
      if ( (this.inlineProps[i]) == key ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  setFlexShorthand (value) {
    const parts = EVGElement.splitSpaces(value);
    const n = parts.length;
    if ( n == 0 ) {
      return;
    }
    const first = parts[0];
    const growVal = isNaN( parseFloat(first) ) ? undefined : parseFloat(first);
    if ( EVGElement.isPlainNumber(first) ) {
      this.flex = growVal;
      this.flexBasis = EVGUnit.px(0.0);
      if ( n >= 2 ) {
        const shrinkVal = isNaN( parseFloat((parts[1])) ) ? undefined : parseFloat((parts[1]));
        if ( typeof(shrinkVal) != "undefined" ) {
          this.flexShrink = shrinkVal;
        }
      }
      if ( n >= 3 ) {
        this.flexBasis = EVGUnit.parse((parts[2]));
      }
    } else {
      this.flexBasis = EVGUnit.parse(first);
      this.flex = 1.0;
    }
  };
  setAttribute (name, value) {
    if ( name == "className" ) {
      this.className = value;
      return;
    }
    if ( name == "theme" ) {
      this.theme = value;
      return;
    }
    if ( name == "id" ) {
      this.id = value;
      return;
    }
    if ( name == "format" ) {
      this.format = value.toLowerCase();
      return;
    }
    if ( name == "orientation" ) {
      this.orientation = value.toLowerCase();
      return;
    }
    if ( name == "pageWidth" ) {
      const pw = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(pw) != "undefined" ) {
        this.pageWidth = pw;
      }
      return;
    }
    if ( name == "pageHeight" ) {
      const ph = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(ph) != "undefined" ) {
        this.pageHeight = ph;
      }
      return;
    }
    if ( name == "width" ) {
      this.width = EVGUnit.parse(value);
      return;
    }
    if ( name == "height" ) {
      this.height = EVGUnit.parse(value);
      return;
    }
    if ( (name == "min-width") || (name == "minWidth") ) {
      this.minWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "min-height") || (name == "minHeight") ) {
      this.minHeight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "max-width") || (name == "maxWidth") ) {
      this.maxWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "max-height") || (name == "maxHeight") ) {
      this.maxHeight = EVGUnit.parse(value);
      return;
    }
    if ( name == "left" ) {
      this.left = EVGUnit.parse(value);
      return;
    }
    if ( name == "top" ) {
      this.top = EVGUnit.parse(value);
      return;
    }
    if ( name == "right" ) {
      this.right = EVGUnit.parse(value);
      return;
    }
    if ( name == "bottom" ) {
      this.bottom = EVGUnit.parse(value);
      return;
    }
    if ( name == "x" ) {
      this.x = EVGUnit.parse(value);
      return;
    }
    if ( name == "y" ) {
      this.y = EVGUnit.parse(value);
      return;
    }
    if ( name == "margin" ) {
      this.box.setMargin(EVGUnit.parse(value));
      return;
    }
    if ( (name == "margin-left") || (name == "marginLeft") ) {
      this.box.marginLeft = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-right") || (name == "marginRight") ) {
      this.box.marginRight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-top") || (name == "marginTop") ) {
      this.box.marginTop = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-bottom") || (name == "marginBottom") ) {
      this.box.marginBottom = EVGUnit.parse(value);
      return;
    }
    if ( name == "padding" ) {
      this.box.setPadding(EVGUnit.parse(value));
      return;
    }
    if ( (name == "padding-left") || (name == "paddingLeft") ) {
      this.box.paddingLeft = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-right") || (name == "paddingRight") ) {
      this.box.paddingRight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-top") || (name == "paddingTop") ) {
      this.box.paddingTop = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-bottom") || (name == "paddingBottom") ) {
      this.box.paddingBottom = EVGUnit.parse(value);
      return;
    }
    if ( (name == "border-width") || (name == "borderWidth") ) {
      this.box.borderWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "border-color") || (name == "borderColor") ) {
      this.box.borderColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "border-radius") || (name == "borderRadius") ) {
      this.box.borderRadius = EVGUnit.parse(value);
      return;
    }
    if ( name == "glow" ) {
      const gv = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.glowIntensity = gv;
      return;
    }
    if ( (name == "background-image") || (name == "backgroundImage") ) {
      this.bgImageSet = true;
      this.bgImagePath = value;
      return;
    }
    if ( (name == "gradient-from") || (name == "gradientFrom") ) {
      this.gradientFrom = EVGColor.parse(value);
      this.gradientSet = true;
      return;
    }
    if ( (name == "gradient-to") || (name == "gradientTo") ) {
      this.gradientTo = EVGColor.parse(value);
      this.gradientSet = true;
      return;
    }
    if ( (name == "gradient-dir") || (name == "gradientDir") ) {
      const dv = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      this.gradientDir = dv;
      return;
    }
    if ( (name == "background-color") || (name == "backgroundColor") ) {
      this.backgroundColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "background-gradient") || (name == "backgroundGradient") ) {
      this.backgroundGradient = value;
      this.gradient = EVGGradient.parse(value);
      return;
    }
    if ( name == "background" ) {
      if ( (value.includes("linear-gradient")) || (value.includes("radial-gradient")) ) {
        this.backgroundGradient = value;
        this.gradient = EVGGradient.parse(value);
      } else {
        this.backgroundColor = EVGColor.parse(value);
      }
      return;
    }
    if ( name == "color" ) {
      this.color = EVGColor.parse(value);
      return;
    }
    if ( name == "opacity" ) {
      const val = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.opacity = val;
      return;
    }
    if ( (name == "object-fit") || (name == "objectFit") ) {
      this.objectFit = value;
      return;
    }
    if ( (name == "image-offset-x") || (name == "imageOffsetX") ) {
      this.imageOffsetX = EVGUnit.parse(value);
      return;
    }
    if ( (name == "image-offset-y") || (name == "imageOffsetY") ) {
      this.imageOffsetY = EVGUnit.parse(value);
      return;
    }
    if ( name == "direction" ) {
      this.direction = value;
      return;
    }
    if ( name == "align" ) {
      this.align = value;
      return;
    }
    if ( (name == "vertical-align") || (name == "verticalAlign") ) {
      this.verticalAlign = value;
      return;
    }
    if ( name == "inline" ) {
      this.isInline = value == "true";
      return;
    }
    if ( (name == "line-break") || (name == "lineBreak") ) {
      this.lineBreak = value == "true";
      return;
    }
    if ( name == "overflow" ) {
      this.overflow = value;
      return;
    }
    if ( name == "display" ) {
      this.display = value;
      return;
    }
    if ( (name == "flex-direction") || (name == "flexDirection") ) {
      this.flexDirection = value;
      return;
    }
    if ( (name == "flex-wrap") || (name == "flexWrap") ) {
      this.flexWrap = value;
      return;
    }
    if ( (name == "flex-shrink") || (name == "flexShrink") ) {
      const sv = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(sv) != "undefined" ) {
        this.flexShrink = sv;
      }
      return;
    }
    if ( (name == "flex-basis") || (name == "flexBasis") ) {
      this.flexBasis = EVGUnit.parse(value);
      return;
    }
    if ( name == "flex" ) {
      this.setFlexShorthand(value);
      return;
    }
    if ( name == "gap" ) {
      this.gap = EVGUnit.parse(value);
      return;
    }
    if ( (name == "row-gap") || (name == "rowGap") ) {
      this.rowGap = EVGUnit.parse(value);
      return;
    }
    if ( (name == "column-gap") || (name == "columnGap") ) {
      this.columnGap = EVGUnit.parse(value);
      return;
    }
    if ( (name == "grid-template-columns") || (name == "gridTemplateColumns") ) {
      this.gridTemplateColumns = value;
      return;
    }
    if ( (name == "grid-template-rows") || (name == "gridTemplateRows") ) {
      this.gridTemplateRows = value;
      return;
    }
    if ( (name == "grid-template-areas") || (name == "gridTemplateAreas") ) {
      this.gridTemplateAreas = value;
      return;
    }
    if ( (name == "grid-auto-flow") || (name == "gridAutoFlow") ) {
      this.gridAutoFlow = value;
      return;
    }
    if ( (name == "full-bleed") || (name == "fullBleed") ) {
      this.fullBleed = (value == "true") || (value == "1");
      return;
    }
    if ( (name == "grid-area") || (name == "gridArea") ) {
      this.gridArea = value;
      return;
    }
    if ( (name == "grid-column") || (name == "gridColumn") ) {
      this.gridColumn = value;
      return;
    }
    if ( (name == "grid-row") || (name == "gridRow") ) {
      this.gridRow = value;
      return;
    }
    if ( (name == "justify-content") || (name == "justifyContent") ) {
      this.justifyContent = value;
      return;
    }
    if ( (name == "align-content") || (name == "alignContent") ) {
      this.alignContent = value;
      return;
    }
    if ( (name == "align-items") || (name == "alignItems") ) {
      this.alignItems = value;
      return;
    }
    if ( (name == "font-size") || (name == "fontSize") ) {
      this.fontSize = EVGUnit.parse(value);
      this.fontSizeInherited = false;
      return;
    }
    if ( (name == "font-family") || (name == "fontFamily") ) {
      this.fontFamily = value;
      return;
    }
    if ( (name == "font-weight") || (name == "fontWeight") ) {
      this.fontWeight = value;
      return;
    }
    if ( (name == "text-align") || (name == "textAlign") ) {
      this.textAlign = value;
      return;
    }
    if ( (name == "line-height") || (name == "lineHeight") ) {
      const val_1 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_1) != "undefined" ) {
        this.lineHeight = val_1;
      }
      return;
    }
    if ( name == "rotate" ) {
      const val_2 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.rotate = val_2;
      return;
    }
    if ( name == "scale" ) {
      const val_3 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.scale = val_3;
      return;
    }
    if ( (name == "shadow-radius") || (name == "shadowRadius") ) {
      this.shadowRadius = EVGUnit.parse(value);
      return;
    }
    if ( (name == "shadow-color") || (name == "shadowColor") ) {
      this.shadowColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "shadow-offset-x") || (name == "shadowOffsetX") ) {
      this.shadowOffsetX = EVGUnit.parse(value);
      return;
    }
    if ( (name == "shadow-offset-y") || (name == "shadowOffsetY") ) {
      this.shadowOffsetY = EVGUnit.parse(value);
      return;
    }
    if ( (name == "clip-path") || (name == "clipPath") ) {
      this.clipPath = value;
      return;
    }
    if ( ((name == "d") || (name == "svgPath")) || (name == "path") ) {
      this.svgPath = value;
      return;
    }
    if ( name == "imageQuality" ) {
      const val_4 = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      if ( typeof(val_4) != "undefined" ) {
        this.imageQuality = val_4;
      }
      return;
    }
    if ( name == "maxImageSize" ) {
      const val_5 = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      if ( typeof(val_5) != "undefined" ) {
        this.maxImageSize = val_5;
      }
      return;
    }
    if ( (name == "d") || (name == "svgPath") ) {
      this.svgPath = value;
      return;
    }
    if ( name == "viewBox" ) {
      this.viewBox = value;
      return;
    }
    if ( name == "fill" ) {
      this.fillColor = EVGColor.parse(value);
      return;
    }
    if ( name == "stroke" ) {
      this.strokeColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "stroke-width") || (name == "strokeWidth") ) {
      const val_6 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_6) != "undefined" ) {
        this.strokeWidth = val_6;
      }
      return;
    }
  };
  getCalculatedBounds () {
    return (((((("(" + ((this.calculatedX.toString()))) + ", ") + ((this.calculatedY.toString()))) + ") ") + ((this.calculatedWidth.toString()))) + "x") + ((this.calculatedHeight.toString()));
  };
  toString () {
    return ((((("<" + this.tagName) + " id=\"") + this.id) + "\" ") + this.getCalculatedBounds()) + ">";
  };
}
EVGElement.createDiv = function() {
  const el = new EVGElement();
  el.tagName = "div";
  el.elementType = 0;
  return el;
};
EVGElement.createSpan = function() {
  const el = new EVGElement();
  el.tagName = "span";
  el.elementType = 1;
  return el;
};
EVGElement.createImg = function() {
  const el = new EVGElement();
  el.tagName = "img";
  el.elementType = 2;
  return el;
};
EVGElement.createPath = function() {
  const el = new EVGElement();
  el.tagName = "path";
  el.elementType = 3;
  return el;
};
EVGElement.toKebab = function(name) {
  let out = "";
  const __len = name.length;
  let i = 0;
  while (i < __len) {
    const c = name.charCodeAt(i );
    if ( (c >= 65) && (c <= 90) ) {
      if ( i > 0 ) {
        out = out + "-";
      }
      out = out + (String.fromCharCode((c + 32)));
    } else {
      out = out + (String.fromCharCode(c));
    }
    i = i + 1;
  };
  return out;
};
EVGElement.isPlainNumber = function(s) {
  const __len = s.length;
  if ( __len == 0 ) {
    return false;
  }
  let digits = 0;
  let i = 0;
  while (i < __len) {
    const c = s.charCodeAt(i );
    const isDigit = (c >= 48) && (c <= 57);
    if ( isDigit ) {
      digits = digits + 1;
    } else {
      if ( ((c != 46) && (c != 45)) && (c != 43) ) {
        return false;
      }
    }
    i = i + 1;
  };
  return digits > 0;
};
EVGElement.splitSpaces = function(s) {
  let out = [];
  const __len = s.length;
  let start = 0;
  let inTok = false;
  let i = 0;
  while (i < __len) {
    const c = s.charCodeAt(i );
    const isSpace = ((c == 32) || (c == 9)) || ((c == 10) || (c == 13));
    if ( isSpace ) {
      if ( inTok ) {
        out.push(s.substring(start, i ));
        inTok = false;
      }
    } else {
      if ( inTok == false ) {
        start = i;
        inTok = true;
      }
    }
    i = i + 1;
  };
  if ( inTok ) {
    out.push(s.substring(start, __len ));
  }
  return out;
};
class JSXToEVG  {
  constructor() {
    this.source = "";
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.parser = new TSParserSimple();
    this.parser.tsxMode = true;
  }
  camelToKebab (name) {
    let result = "";
    let i = 0;
    const __len = name.length;
    while (i < __len) {
      const code = name.charCodeAt(i );
      const codeInt = code;
      if ( (codeInt >= 65) && (codeInt <= 90) ) {
        if ( i > 0 ) {
          result = result + "-";
        }
        const lowerCode = codeInt + 32;
        const lowerCh = String.fromCharCode(lowerCode);
        result = result + lowerCh;
      } else {
        const ch = String.fromCharCode(codeInt);
        result = result + ch;
      }
      i = i + 1;
    };
    return result;
  };
  parseFile (dirPath, fileName) {
    const fileContent = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const src = Utf8.decode(((function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(fileContent)));
    return this.parse(src);
  };
  parse (src) {
    this.source = src;
    const lexer = new TSLexer(src);
    const tokens = lexer.tokenize();
    this.parser.initParser(tokens);
    this.parser.tsxMode = true;
    const ast = this.parser.parseProgram();
    const jsxRoot = this.findJSXRoot(ast);
    if ( jsxRoot.nodeType == "" ) {
      console.log("Error: No JSX found in render() function");
      const empty = new EVGElement();
      return empty;
    }
    return this.convertNode(jsxRoot);
  };
  findJSXRoot (ast) {
    const result = this.searchForRenderFunction(ast);
    return result;
  };
  searchForRenderFunction (node) {
    const empty = new TSNode();
    if ( node.nodeType == "FunctionDeclaration" ) {
      if ( node.name == "render" ) {
        return this.findReturnJSX(node);
      }
    }
    if ( node.nodeType == "VariableDeclaration" ) {
      let i = 0;
      while (i < (node.children.length)) {
        const child = node.children[i];
        if ( child.name == "render" ) {
          if ( typeof(child.right) != "undefined" ) {
            const rightNode = child.right;
            if ( rightNode.nodeType == "FunctionExpression" ) {
              return this.findReturnJSX(rightNode);
            }
            if ( rightNode.nodeType == "ArrowFunctionExpression" ) {
              return this.findReturnJSX(rightNode);
            }
          }
        }
        i = i + 1;
      };
    }
    let i_1 = 0;
    while (i_1 < (node.children.length)) {
      const child_1 = node.children[i_1];
      const found = this.searchForRenderFunction(child_1);
      if ( found.nodeType != "" ) {
        return found;
      }
      i_1 = i_1 + 1;
    };
    if ( typeof(node.left) != "undefined" ) {
      const leftNode = node.left;
      const found_1 = this.searchForRenderFunction(leftNode);
      if ( found_1.nodeType != "" ) {
        return found_1;
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      const rightNode_1 = node.right;
      const found_2 = this.searchForRenderFunction(rightNode_1);
      if ( found_2.nodeType != "" ) {
        return found_2;
      }
    }
    return empty;
  };
  findReturnJSX (funcNode) {
    const empty = new TSNode();
    if ( typeof(funcNode.body) != "undefined" ) {
      const bodyNode = funcNode.body;
      const found = this.findReturnJSX(bodyNode);
      if ( found.nodeType != "" ) {
        return found;
      }
    }
    let i = 0;
    while (i < (funcNode.children.length)) {
      const child = funcNode.children[i];
      if ( child.nodeType == "ReturnStatement" ) {
        if ( typeof(child.left) != "undefined" ) {
          const leftNode = child.left;
          if ( (leftNode.nodeType == "JSXElement") || (leftNode.nodeType == "JSXFragment") ) {
            return leftNode;
          }
        }
      }
      if ( child.nodeType == "BlockStatement" ) {
        const found_1 = this.findReturnJSX(child);
        if ( found_1.nodeType != "" ) {
          return found_1;
        }
      }
      if ( (child.nodeType == "JSXElement") || (child.nodeType == "JSXFragment") ) {
        return child;
      }
      i = i + 1;
    };
    if ( typeof(funcNode.right) != "undefined" ) {
      const rightNode = funcNode.right;
      if ( (rightNode.nodeType == "JSXElement") || (rightNode.nodeType == "JSXFragment") ) {
        return rightNode;
      }
    }
    return empty;
  };
  convertNode (jsxNode) {
    const element = new EVGElement();
    if ( jsxNode.nodeType == "JSXElement" ) {
      return this.convertJSXElement(jsxNode);
    }
    if ( jsxNode.nodeType == "JSXFragment" ) {
      element.tagName = "div";
      this.convertChildren(element, jsxNode);
      return element;
    }
    if ( jsxNode.nodeType == "JSXText" ) {
      element.tagName = "text";
      element.textContent = this.trimText(jsxNode.value);
      return element;
    }
    if ( jsxNode.nodeType == "JSXExpressionContainer" ) {
      if ( typeof(jsxNode.left) != "undefined" ) {
        if ( jsxNode.left.nodeType == "StringLiteral" ) {
          element.tagName = "text";
          element.textContent = jsxNode.left.value;
          return element;
        }
        if ( jsxNode.left.nodeType == "NumericLiteral" ) {
          element.tagName = "text";
          element.textContent = jsxNode.left.value;
          return element;
        }
      }
      element.tagName = "";
      return element;
    }
    element.tagName = "";
    return element;
  };
  convertJSXElement (jsxNode) {
    const element = new EVGElement();
    let tagName = "";
    if ( typeof(jsxNode.left) != "undefined" ) {
      tagName = jsxNode.left.name;
    }
    element.tagName = this.mapTagName(tagName);
    if ( tagName == "page" ) {
      element.tagName = "page";
    }
    if ( tagName == "row" ) {
      element.tagName = "div";
      element.display = "flex";
      element.flexDirection = "row";
    }
    if ( tagName == "column" ) {
      element.tagName = "div";
      element.display = "flex";
      element.flexDirection = "column";
    }
    if ( tagName == "spacer" ) {
      element.tagName = "spacer";
    }
    if ( tagName == "divider" ) {
      element.tagName = "divider";
    }
    if ( (tagName == "layer") || (tagName == "Layer") ) {
      element.tagName = "layer";
      element.position = "absolute";
      element.left = EVGUnit.px(0.0);
      element.top = EVGUnit.px(0.0);
      element.width = EVGUnit.percent(100.0);
      element.height = EVGUnit.percent(100.0);
    }
    if ( typeof(jsxNode.left) != "undefined" ) {
      const leftNode = jsxNode.left;
      this.parseAttributes(element, leftNode);
    }
    if ( ((tagName == "span") || (tagName == "Label")) || (tagName == "text") ) {
      element.textContent = this.collectTextContent(jsxNode);
    } else {
      this.convertChildren(element, jsxNode);
    }
    return element;
  };
  collectTextContent (jsxNode) {
    let result = "";
    let prevEnd = 0 - 1;
    let i = 0;
    while (i < (jsxNode.children.length)) {
      const child = jsxNode.children[i];
      if ( child.nodeType == "JSXText" ) {
        const raw = child.value;
        const text = this.trimText(raw);
        if ( (text.length) > 0 ) {
          if ( (result.length) > 0 ) {
            if ( child.start > prevEnd ) {
              result = result + " ";
            }
          }
          result = result + text;
          prevEnd = child.start + (raw.length);
        }
      }
      if ( child.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(child.left) != "undefined" ) {
          let handled = false;
          let text_1 = "";
          if ( child.left.nodeType == "StringLiteral" ) {
            text_1 = this.unquote(child.left.value);
            handled = true;
          }
          if ( child.left.nodeType == "TemplateLiteral" ) {
            const leftNode = child.left;
            text_1 = this.extractTemplateLiteralText(leftNode);
            handled = true;
          }
          if ( handled ) {
            if ( (result.length) > 0 ) {
              if ( child.start > prevEnd ) {
                result = result + " ";
              }
            }
            result = result + text_1;
            prevEnd = child.start;
          }
        }
      }
      i = i + 1;
    };
    return result;
  };
  extractTemplateLiteralText (node) {
    let result = "";
    let i = 0;
    while (i < (node.children.length)) {
      const child = node.children[i];
      if ( child.nodeType == "TemplateElement" ) {
        if ( (result.length) > 0 ) {
          result = result + child.value;
        } else {
          result = child.value;
        }
      }
      i = i + 1;
    };
    return result;
  };
  mapTagName (jsxTag) {
    if ( jsxTag == "Print" ) {
      return "print";
    }
    if ( jsxTag == "Section" ) {
      return "section";
    }
    if ( jsxTag == "Page" ) {
      return "page";
    }
    if ( jsxTag == "page" ) {
      return "page";
    }
    if ( jsxTag == "View" ) {
      return "div";
    }
    if ( jsxTag == "div" ) {
      return "div";
    }
    if ( jsxTag == "box" ) {
      return "div";
    }
    if ( jsxTag == "row" ) {
      return "div";
    }
    if ( jsxTag == "column" ) {
      return "div";
    }
    if ( jsxTag == "span" ) {
      return "text";
    }
    if ( jsxTag == "Label" ) {
      return "text";
    }
    if ( jsxTag == "text" ) {
      return "text";
    }
    if ( jsxTag == "img" ) {
      return "image";
    }
    if ( jsxTag == "image" ) {
      return "image";
    }
    if ( jsxTag == "Image" ) {
      return "image";
    }
    if ( jsxTag == "path" ) {
      return "path";
    }
    if ( jsxTag == "Path" ) {
      return "path";
    }
    if ( jsxTag == "layer" ) {
      return "layer";
    }
    if ( jsxTag == "Layer" ) {
      return "layer";
    }
    return "div";
  };
  parseAttributes (element, openingNode) {
    let i = 0;
    while (i < (openingNode.children.length)) {
      const attr = openingNode.children[i];
      if ( attr.nodeType == "JSXAttribute" ) {
        const rawAttrName = attr.name;
        const attrName = this.camelToKebab(rawAttrName);
        const attrValue = this.getAttributeValue(attr);
        console.log((((("  Attr: " + rawAttrName) + " -> ") + attrName) + " = ") + attrValue);
        element.markInline(attrName);
        element.setAttribute(attrName, attrValue);
        if ( attrName == "id" ) {
          element.id = attrValue;
        }
        if ( (attrName == "class-name") || (attrName == "class") ) {
          element.className = attrValue;
        }
        if ( attrName == "theme" ) {
          element.theme = attrValue;
        }
        if ( attrName == "src" ) {
          element.src = attrValue;
        }
        if ( attrName == "alt" ) {
          element.alt = attrValue;
        }
        if ( attrName == "image-view-box" ) {
          element.imageViewBox = attrValue;
          this.parseImageViewBox(element, attrValue);
        }
        if ( attrName == "object-fit" ) {
          element.objectFit = attrValue;
        }
        if ( (attrName == "d") || (attrName == "svg-path") ) {
          element.svgPath = attrValue;
        }
        if ( attrName == "view-box" ) {
          element.viewBox = attrValue;
        }
        if ( attrName == "fill" ) {
          element.fillColor = EVGColor.parse(attrValue);
        }
        if ( attrName == "stroke" ) {
          element.strokeColor = EVGColor.parse(attrValue);
        }
        if ( attrName == "stroke-width" ) {
          element.strokeWidth = (isNaN( parseFloat(attrValue) ) ? undefined : parseFloat(attrValue));
        }
        if ( attrName == "clip-path" ) {
          element.clipPath = attrValue;
        }
        if ( attrName == "width" ) {
          const unit = EVGUnit.parse(attrValue);
          element.width = unit;
          if ( (unit.unitType == 0) && (unit.pixels > 0.0) ) {
            this.pageWidth = unit.pixels;
          }
        }
        if ( attrName == "height" ) {
          const unit_1 = EVGUnit.parse(attrValue);
          element.height = unit_1;
          if ( (unit_1.unitType == 0) && (unit_1.pixels > 0.0) ) {
            this.pageHeight = unit_1.pixels;
          }
        }
        if ( attrName == "page-width" ) {
          const unit_2 = EVGUnit.parse(attrValue);
          element.width = unit_2;
        }
        if ( attrName == "page-height" ) {
          const unit_3 = EVGUnit.parse(attrValue);
          element.height = unit_3;
        }
        if ( attrName == "color" ) {
          element.color = EVGColor.parse(attrValue);
        }
        if ( attrName == "style" ) {
          this.parseStyleAttribute(element, attr);
        }
        if ( attrName == "padding" ) {
          this.applyStyleProperty(element, "padding", attrValue);
        }
        if ( attrName == "margin" ) {
          this.applyStyleProperty(element, "margin", attrValue);
        }
        if ( attrName == "margin-top" ) {
          this.applyStyleProperty(element, "marginTop", attrValue);
        }
        if ( attrName == "margin-bottom" ) {
          this.applyStyleProperty(element, "marginBottom", attrValue);
        }
        if ( attrName == "margin-left" ) {
          this.applyStyleProperty(element, "marginLeft", attrValue);
        }
        if ( attrName == "margin-right" ) {
          this.applyStyleProperty(element, "marginRight", attrValue);
        }
        if ( attrName == "font-size" ) {
          this.applyStyleProperty(element, "fontSize", attrValue);
        }
        if ( attrName == "font-weight" ) {
          this.applyStyleProperty(element, "fontWeight", attrValue);
        }
        if ( attrName == "font-family" ) {
          this.applyStyleProperty(element, "fontFamily", attrValue);
        }
        if ( attrName == "background-color" ) {
          console.log("  Parsing background-color: " + attrValue);
          this.applyStyleProperty(element, "backgroundColor", attrValue);
          const bgc = element.backgroundColor;
          console.log((("  After parse: isSet=" + ((bgc.isSet.toString()))) + " r=") + ((bgc.r.toString())));
        }
        if ( attrName == "border-radius" ) {
          this.applyStyleProperty(element, "borderRadius", attrValue);
        }
        if ( attrName == "border-width" ) {
          this.applyStyleProperty(element, "borderWidth", attrValue);
        }
        if ( attrName == "line-height" ) {
          this.applyStyleProperty(element, "lineHeight", attrValue);
        }
        if ( attrName == "text-align" ) {
          this.applyStyleProperty(element, "textAlign", attrValue);
        }
        if ( attrName == "flex-direction" ) {
          this.applyStyleProperty(element, "flexDirection", attrValue);
        }
        if ( attrName == "flex" ) {
          this.applyStyleProperty(element, "flex", attrValue);
        }
        if ( attrName == "gap" ) {
          this.applyStyleProperty(element, "gap", attrValue);
        }
        if ( attrName == "flex-wrap" ) {
          element.flexWrap = attrValue;
        }
        if ( attrName == "display" ) {
          element.display = attrValue;
        }
        if ( ((attrName == "grid-template-columns") || (attrName == "grid-template-rows")) || ((attrName == "grid-column") || (attrName == "grid-row")) ) {
          element.setAttribute(attrName, attrValue);
        }
        if ( (attrName == "row-gap") || (attrName == "column-gap") ) {
          element.setAttribute(attrName, attrValue);
        }
        if ( attrName == "align" ) {
          element.align = attrValue;
        }
        if ( attrName == "vertical-align" ) {
          element.verticalAlign = attrValue;
        }
        if ( attrName == "border-color" ) {
          this.applyStyleProperty(element, "borderColor", attrValue);
        }
        if ( attrName == "shadow-radius" ) {
          this.applyStyleProperty(element, "shadowRadius", attrValue);
        }
        if ( attrName == "shadow-color" ) {
          this.applyStyleProperty(element, "shadowColor", attrValue);
        }
        if ( attrName == "shadow-offset-x" ) {
          this.applyStyleProperty(element, "shadowOffsetX", attrValue);
        }
        if ( attrName == "shadow-offset-y" ) {
          this.applyStyleProperty(element, "shadowOffsetY", attrValue);
        }
        if ( attrName == "background" ) {
          this.applyStyleProperty(element, "background", attrValue);
        }
        if ( attrName == "background-gradient" ) {
          this.applyStyleProperty(element, "backgroundGradient", attrValue);
        }
      }
      i = i + 1;
    };
  };
  getAttributeValue (attr) {
    if ( typeof(attr.right) != "undefined" ) {
      const rightNode = attr.right;
      if ( rightNode.nodeType == "StringLiteral" ) {
        return this.unquote(rightNode.value);
      }
      if ( rightNode.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(rightNode.left) != "undefined" ) {
          const exprNode = rightNode.left;
          return this.extractExpressionValue(exprNode);
        }
      }
    }
    return "";
  };
  extractExpressionValue (exprNode) {
    if ( exprNode.nodeType == "NumericLiteral" ) {
      return exprNode.value;
    }
    if ( exprNode.nodeType == "StringLiteral" ) {
      return this.unquote(exprNode.value);
    }
    if ( exprNode.nodeType == "Identifier" ) {
      return exprNode.name;
    }
    if ( exprNode.nodeType == "ObjectExpression" ) {
      return "OBJECT";
    }
    return "";
  };
  parseStyleAttribute (element, attr) {
    if ( typeof(attr.right) != "undefined" ) {
      const rightNode = attr.right;
      if ( rightNode.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(rightNode.left) != "undefined" ) {
          const styleExpr = rightNode.left;
          this.parseStyleObject(element, styleExpr);
        }
      }
    }
  };
  parseStyleObject (element, styleNode) {
    if ( styleNode.nodeType != "ObjectExpression" ) {
      return;
    }
    let i = 0;
    while (i < (styleNode.children.length)) {
      const prop = styleNode.children[i];
      if ( prop.nodeType == "Property" ) {
        const propName = prop.name;
        let propValue = "";
        if ( typeof(prop.right) != "undefined" ) {
          const propRightNode = prop.right;
          propValue = this.extractExpressionValue(propRightNode);
          if ( propRightNode.nodeType == "StringLiteral" ) {
            propValue = this.unquote(propRightNode.value);
          }
        }
        this.applyStyleProperty(element, propName, propValue);
      }
      i = i + 1;
    };
  };
  applyStyleProperty (element, name, value) {
    element.markInline(name);
    if ( name == "width" ) {
      element.width = EVGUnit.parse(value);
    }
    if ( name == "height" ) {
      element.height = EVGUnit.parse(value);
    }
    if ( name == "minWidth" ) {
      element.minWidth = EVGUnit.parse(value);
    }
    if ( name == "maxWidth" ) {
      element.maxWidth = EVGUnit.parse(value);
    }
    if ( name == "minHeight" ) {
      element.minHeight = EVGUnit.parse(value);
    }
    if ( name == "maxHeight" ) {
      element.maxHeight = EVGUnit.parse(value);
    }
    if ( name == "margin" ) {
      const unit = EVGUnit.parse(value);
      element.box.marginTop = unit;
      element.box.marginRight = unit;
      element.box.marginBottom = unit;
      element.box.marginLeft = unit;
    }
    if ( name == "marginTop" ) {
      element.box.marginTop = EVGUnit.parse(value);
    }
    if ( name == "marginRight" ) {
      element.box.marginRight = EVGUnit.parse(value);
    }
    if ( name == "marginBottom" ) {
      element.box.marginBottom = EVGUnit.parse(value);
    }
    if ( name == "marginLeft" ) {
      element.box.marginLeft = EVGUnit.parse(value);
    }
    if ( name == "padding" ) {
      const unit_1 = EVGUnit.parse(value);
      element.box.paddingTop = unit_1;
      element.box.paddingRight = unit_1;
      element.box.paddingBottom = unit_1;
      element.box.paddingLeft = unit_1;
    }
    if ( name == "paddingTop" ) {
      element.box.paddingTop = EVGUnit.parse(value);
    }
    if ( name == "paddingRight" ) {
      element.box.paddingRight = EVGUnit.parse(value);
    }
    if ( name == "paddingBottom" ) {
      element.box.paddingBottom = EVGUnit.parse(value);
    }
    if ( name == "paddingLeft" ) {
      element.box.paddingLeft = EVGUnit.parse(value);
    }
    if ( name == "border" ) {
      element.box.borderWidth = EVGUnit.parse(value);
    }
    if ( name == "borderWidth" ) {
      element.borderWidth = EVGUnit.parse(value);
    }
    if ( name == "borderColor" ) {
      element.borderColor = EVGColor.parse(value);
    }
    if ( name == "borderTop" ) {
      element.borderTopWidth = EVGUnit.parse(value);
    }
    if ( name == "borderRight" ) {
      element.borderRightWidth = EVGUnit.parse(value);
    }
    if ( name == "borderBottom" ) {
      element.borderBottomWidth = EVGUnit.parse(value);
    }
    if ( name == "borderLeft" ) {
      element.borderLeftWidth = EVGUnit.parse(value);
    }
    if ( name == "borderRadius" ) {
      element.box.borderRadius = EVGUnit.parse(value);
    }
    if ( name == "display" ) {
      element.display = value;
    }
    if ( name == "flexDirection" ) {
      element.flexDirection = value;
    }
    if ( name == "justifyContent" ) {
      element.justifyContent = value;
    }
    if ( name == "alignItems" ) {
      element.alignItems = value;
    }
    if ( name == "align" ) {
      element.align = value;
    }
    if ( name == "verticalAlign" ) {
      element.verticalAlign = value;
    }
    if ( name == "gap" ) {
      element.gap = EVGUnit.parse(value);
    }
    if ( name == "flexWrap" ) {
      element.flexWrap = value;
    }
    if ( name == "display" ) {
      element.display = value;
    }
    if ( ((name == "gridTemplateColumns") || (name == "gridTemplateRows")) || ((name == "gridColumn") || (name == "gridRow")) ) {
      element.setAttribute(name, value);
    }
    if ( (name == "rowGap") || (name == "columnGap") ) {
      element.setAttribute(name, value);
    }
    if ( name == "flex" ) {
      element.flex = this.parseNumberValue(value);
    }
    if ( name == "position" ) {
      element.position = value;
    }
    if ( name == "top" ) {
      element.top = EVGUnit.parse(value);
    }
    if ( name == "left" ) {
      element.left = EVGUnit.parse(value);
    }
    if ( name == "right" ) {
      element.right = EVGUnit.parse(value);
    }
    if ( name == "bottom" ) {
      element.bottom = EVGUnit.parse(value);
    }
    if ( name == "backgroundColor" ) {
      element.backgroundColor = EVGColor.parse(value);
    }
    if ( name == "background" ) {
      if ( (value.includes("linear-gradient")) || (value.includes("radial-gradient")) ) {
        element.backgroundGradient = value;
        element.gradient = EVGGradient.parse(value);
      } else {
        element.backgroundColor = EVGColor.parse(value);
      }
    }
    if ( name == "backgroundGradient" ) {
      element.backgroundGradient = value;
      element.gradient = EVGGradient.parse(value);
    }
    if ( name == "color" ) {
      element.color = EVGColor.parse(value);
    }
    if ( name == "opacity" ) {
      element.opacity = this.parseNumberValue(value);
    }
    if ( name == "shadowRadius" ) {
      element.shadowRadius = EVGUnit.parse(value);
    }
    if ( name == "shadowColor" ) {
      element.shadowColor = EVGColor.parse(value);
    }
    if ( name == "shadowOffsetX" ) {
      element.shadowOffsetX = EVGUnit.parse(value);
    }
    if ( name == "shadowOffsetY" ) {
      element.shadowOffsetY = EVGUnit.parse(value);
    }
    if ( name == "fontSize" ) {
      element.fontSize = EVGUnit.parse(value);
    }
    if ( name == "fontFamily" ) {
      element.fontFamily = value;
    }
    if ( name == "fontWeight" ) {
      element.fontWeight = value;
    }
    if ( name == "textAlign" ) {
      element.textAlign = value;
    }
    if ( name == "lineHeight" ) {
      element.lineHeight = this.parseNumberValue(value);
    }
  };
  convertChildren (element, jsxNode) {
    let i = 0;
    while (i < (jsxNode.children.length)) {
      const childJsx = jsxNode.children[i];
      if ( childJsx.nodeType == "JSXOpeningElement" ) {
        i = i + 1;
        continue;
      }
      if ( childJsx.nodeType == "JSXClosingElement" ) {
        i = i + 1;
        continue;
      }
      if ( childJsx.nodeType == "JSXAttribute" ) {
        i = i + 1;
        continue;
      }
      const childElement = this.convertNode(childJsx);
      if ( childElement.tagName != "" ) {
        if ( childElement.tagName == "text" ) {
          let hasContent = false;
          if ( (childElement.textContent.length) > 0 ) {
            hasContent = true;
          }
          if ( childElement.getChildCount() > 0 ) {
            hasContent = true;
          }
          if ( hasContent == false ) {
            i = i + 1;
            continue;
          }
        }
        element.children.push(childElement);
      }
      i = i + 1;
    };
  };
  unquote (s) {
    const __len = s.length;
    if ( __len < 2 ) {
      return s;
    }
    const first = s.charCodeAt(0 );
    const last = s.charCodeAt((__len - 1) );
    if ( ((first == 34) || (first == 39)) && (first == last) ) {
      let inner = 1;
      while (inner < (__len - 1)) {
        if ( (s.charCodeAt(inner )) == first ) {
          return s;
        }
        inner = inner + 1;
      };
      return s.substring(1, (__len - 1) );
    }
    return s;
  };
  trimText (s) {
    const __len = s.length;
    let result = "";
    let lastWasSpace = true;
    let i = 0;
    while (i < __len) {
      const c = s.charCodeAt(i );
      const isWhitespace = (((c == 32) || (c == 9)) || (c == 10)) || (c == 13);
      if ( isWhitespace ) {
        if ( lastWasSpace == false ) {
          result = result + " ";
          lastWasSpace = true;
        }
      } else {
        result = result + (String.fromCharCode(c));
        lastWasSpace = false;
      }
      i = i + 1;
    };
    const resultLen = result.length;
    if ( resultLen > 0 ) {
      const lastChar = result.charCodeAt((resultLen - 1) );
      if ( lastChar == 32 ) {
        result = result.substring(0, (resultLen - 1) );
      }
    }
    return result;
  };
  parseNumberValue (s) {
    const result = isNaN( parseFloat(s) ) ? undefined : parseFloat(s);
    if ( typeof(result) != "undefined" ) {
      return result;
    }
    return 0.0;
  };
  parseImageViewBox (element, value) {
    const parts = value.split(" ");
    const numParts = parts.length;
    if ( numParts >= 4 ) {
      const xStr = parts[0];
      const yStr = parts[1];
      const wStr = parts[2];
      const hStr = parts[3];
      const isPercent = xStr.includes("%");
      if ( isPercent ) {
        const xPct = this.parsePercentValue(xStr);
        const yPct = this.parsePercentValue(yStr);
        const wPct = this.parsePercentValue(wStr);
        const hPct = this.parsePercentValue(hStr);
        element.imageViewBoxX = xPct;
        element.imageViewBoxY = yPct;
        element.imageViewBoxW = wPct;
        element.imageViewBoxH = hPct;
      } else {
        const xPx = this.parseNumberValue(xStr);
        const yPx = this.parseNumberValue(yStr);
        const wPx = this.parseNumberValue(wStr);
        const hPx = this.parseNumberValue(hStr);
        element.imageViewBoxX = xPx;
        element.imageViewBoxY = yPx;
        element.imageViewBoxW = wPx;
        element.imageViewBoxH = hPx;
      }
      element.imageViewBoxSet = true;
    }
  };
  parsePercentValue (s) {
    const numStr = s.split("%").join("");
    const val = this.parseNumberValue(numStr);
    return val / 100.0;
  };
  getPageWidth () {
    return this.pageWidth;
  };
  getPageHeight () {
    return this.pageHeight;
  };
}
class EVGStyleDecl  {
  constructor() {
    this.name = "";
    this.value = "";
    this.name = "";
    this.value = "";
  }
}
class EVGStyleRule  {
  constructor() {
    this.theme = "";
    this.className = "";
    this.decls = [];
    this.order = 0;
    this.theme = "";
    this.className = "";
    this.order = 0;
  }
  isThemeScoped () {
    return (this.theme.length) > 0;
  };
}
class EVGStyleSheet  {
  constructor() {
    this.rules = [];
    this.errors = [];
    this.ruleCounter = 0;
    this.ruleCounter = 0;
  }
  getRuleCount () {
    return this.rules.length;
  };
  getErrorCount () {
    return this.errors.length;
  };
  getError (i) {
    return this.errors[i];
  };
  parse (css) {
    const src = this.stripComments(css);
    const __len = src.length;
    let i = 0;
    while (i < __len) {
      const braceAt = this.findChar(src, i, 123);
      if ( braceAt < 0 ) {
        const tail = (src.substring(i, __len )).trim();
        if ( (tail.length) > 0 ) {
          this.errors.push("Ignored trailing text with no rule body: " + tail);
        }
        return;
      }
      const selectorText = src.substring(i, braceAt );
      const closeAt = this.findChar(src, (braceAt + 1), 125);
      if ( closeAt < 0 ) {
        this.errors.push("Unclosed rule body for selector: " + (selectorText.trim()));
        return;
      }
      const body = src.substring((braceAt + 1), closeAt );
      this.addRules(selectorText, body);
      i = closeAt + 1;
    };
  };
  stripComments (css) {
    let out = "";
    const __len = css.length;
    let i = 0;
    while (i < __len) {
      const c = css.charCodeAt(i );
      let isStart = false;
      if ( c == 47 ) {
        if ( (i + 1) < __len ) {
          if ( (css.charCodeAt((i + 1) )) == 42 ) {
            isStart = true;
          }
        }
      }
      if ( isStart ) {
        let j = i + 2;
        let closed = false;
        while ((j < __len) && (closed == false)) {
          if ( (css.charCodeAt(j )) == 42 ) {
            if ( (j + 1) < __len ) {
              if ( (css.charCodeAt((j + 1) )) == 47 ) {
                closed = true;
              }
            }
          }
          if ( closed == false ) {
            j = j + 1;
          }
        };
        out = out + " ";
        i = j + 2;
      } else {
        out = out + (css.substring(i, (i + 1) ));
        i = i + 1;
      }
    };
    return out;
  };
  findChar (s, from, ch) {
    const __len = s.length;
    let i = from;
    while (i < __len) {
      if ( (s.charCodeAt(i )) == ch ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  addRules (selectorText, body) {
    const decls = this.parseDeclarations(body);
    const selectors = this.splitOn(selectorText, 44);
    let i = 0;
    while (i < (selectors.length)) {
      const sel = (selectors[i]).trim();
      if ( (sel.length) > 0 ) {
        this.addRuleForSelector(sel, decls);
      }
      i = i + 1;
    };
  };
  addRuleForSelector (sel, decls) {
    const parts = this.splitWhitespace(sel);
    const n = parts.length;
    if ( n == 1 ) {
      const only = parts[0];
      if ( this.isClassToken(only) == false ) {
        this.errors.push("Unsupported selector (only .class and .theme-x .class are supported): " + sel);
        return;
      }
      const rule = new EVGStyleRule();
      rule.className = only.substring(1, (only.length) );
      this.pushRule(rule, decls);
      return;
    }
    if ( n == 2 ) {
      const scope = parts[0];
      const target = parts[1];
      if ( (this.isClassToken(scope) == false) || (this.isClassToken(target) == false) ) {
        this.errors.push("Unsupported selector (only .class and .theme-x .class are supported): " + sel);
        return;
      }
      const scopeName = scope.substring(1, (scope.length) );
      if ( (this).startsWith(scopeName, "theme-") == false ) {
        this.errors.push("Descendant selectors are only supported as `.theme-<name> .class`: " + sel);
        return;
      }
      const rule2 = new EVGStyleRule();
      rule2.theme = scopeName.substring(6, (scopeName.length) );
      rule2.className = target.substring(1, (target.length) );
      this.pushRule(rule2, decls);
      return;
    }
    this.errors.push("Unsupported selector (too many parts): " + sel);
  };
  pushRule (rule, decls) {
    rule.decls = decls;
    rule.order = this.ruleCounter;
    this.ruleCounter = this.ruleCounter + 1;
    this.rules.push(rule);
  };
  isClassToken (tok) {
    if ( (tok.length) < 2 ) {
      return false;
    }
    return (tok.charCodeAt(0 )) == 46;
  };
  startsWith (s, prefix) {
    const pl = prefix.length;
    if ( (s.length) < pl ) {
      return false;
    }
    return (s.substring(0, pl )) == prefix;
  };
  parseDeclarations (body) {
    let out = [];
    const parts = this.splitOn(body, 59);
    let i = 0;
    while (i < (parts.length)) {
      const part = (parts[i]).trim();
      if ( (part.length) > 0 ) {
        const colon = this.findChar(part, 0, 58);
        if ( colon < 0 ) {
          this.errors.push("Declaration without ':' ignored: " + part);
        } else {
          const d = new EVGStyleDecl();
          d.name = (part.substring(0, colon )).trim();
          d.value = this.unquote(((part.substring((colon + 1), (part.length) )).trim()));
          if ( ((d.name.length) > 0) && ((d.value.length) > 0) ) {
            out.push(d);
          } else {
            this.errors.push("Incomplete declaration ignored: " + part);
          }
        }
      }
      i = i + 1;
    };
    return out;
  };
  unquote (s) {
    const __len = s.length;
    if ( __len < 2 ) {
      return s;
    }
    const first = s.charCodeAt(0 );
    const last = s.charCodeAt((__len - 1) );
    if ( ((first == 34) && (last == 34)) || ((first == 39) && (last == 39)) ) {
      let inner = 1;
      while (inner < (__len - 1)) {
        if ( (s.charCodeAt(inner )) == first ) {
          return s;
        }
        inner = inner + 1;
      };
      return s.substring(1, (__len - 1) );
    }
    return s;
  };
  splitOn (s, sep) {
    let out = [];
    const __len = s.length;
    let start = 0;
    let i = 0;
    while (i < __len) {
      if ( (s.charCodeAt(i )) == sep ) {
        out.push(s.substring(start, i ));
        start = i + 1;
      }
      i = i + 1;
    };
    out.push(s.substring(start, __len ));
    return out;
  };
  splitWhitespace (s) {
    let out = [];
    const __len = s.length;
    let start = 0;
    let inTok = false;
    let i = 0;
    while (i < __len) {
      const c = s.charCodeAt(i );
      const isSpace = ((c == 32) || (c == 9)) || ((c == 10) || (c == 13));
      if ( isSpace ) {
        if ( inTok ) {
          out.push(s.substring(start, i ));
          inTok = false;
        }
      } else {
        if ( inTok == false ) {
          start = i;
          inTok = true;
        }
      }
      i = i + 1;
    };
    if ( inTok ) {
      out.push(s.substring(start, __len ));
    }
    return out;
  };
  applyTree (root, theme) {
    this.applyTo(root, theme);
    let i = 0;
    const n = root.getChildCount();
    while (i < n) {
      this.applyTree(root.getChild(i), theme);
      i = i + 1;
    };
  };
  applyTo (el, theme) {
    if ( (el.className.length) == 0 ) {
      return;
    }
    const classes = this.splitWhitespace(el.className);
    this.applyGroup(el, classes, theme, false);
    this.applyGroup(el, classes, theme, true);
  };
  applyGroup (el, classes, theme, themeScoped) {
    let i = 0;
    const n = this.rules.length;
    while (i < n) {
      const rule = this.rules[i];
      if ( rule.isThemeScoped() == themeScoped ) {
        let applies = true;
        if ( themeScoped ) {
          applies = rule.theme == theme;
        }
        if ( applies ) {
          if ( this.matchesClass(classes, rule.className) ) {
            this.applyDecls(el, rule);
          }
        }
      }
      i = i + 1;
    };
  };
  matchesClass (classes, want) {
    let i = 0;
    while (i < (classes.length)) {
      if ( (classes[i]) == want ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  applyDecls (el, rule) {
    let i = 0;
    while (i < (rule.decls.length)) {
      const d = rule.decls[i];
      if ( el.hasInline(d.name) == false ) {
        el.setAttribute(d.name, d.value);
      }
      i = i + 1;
    };
  };
}
class EVGStyleLoader  {
  constructor() {
    this.cssFiles = [];
    this.themeOverride = "";
    this.loadedCount = 0;
    const s_2 = new EVGStyleSheet();
    this.sheet = s_2;
    this.themeOverride = "";
    this.loadedCount = 0;
  }
  addFile (path) {
    this.cssFiles.push(path);
  };
  hasFiles () {
    return (this.cssFiles.length) > 0;
  };
  setTheme (name) {
    this.themeOverride = name;
  };
  dirOf (path) {
    const lastSlash = path.lastIndexOf("/");
    const lastBackslash = path.lastIndexOf("\\");
    let lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      return path.substring(0, (lastSep + 1) );
    }
    return "./";
  };
  nameOf (path) {
    const lastSlash = path.lastIndexOf("/");
    const lastBackslash = path.lastIndexOf("\\");
    let lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      return path.substring((lastSep + 1), (path.length) );
    }
    return path;
  };
  applyTo (root) {
    let i = 0;
    while (i < (this.cssFiles.length)) {
      const path = this.cssFiles[i];
      const dir = this.dirOf(path);
      const name = this.nameOf(path);
      const content = (function(){ var b = require('fs').readFileSync(dir + '/' + name); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
      const css = Utf8.decode(((function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(content)));
      if ( (css.length) == 0 ) {
        console.log("Warning: stylesheet is empty or could not be read: " + path);
      } else {
        this.sheet.parse(css);
        this.loadedCount = this.loadedCount + 1;
      }
      i = i + 1;
    };
    let theme = this.themeOverride;
    if ( (theme.length) == 0 ) {
      theme = root.theme;
    }
    let e = 0;
    while (e < this.sheet.getErrorCount()) {
      console.log("Stylesheet warning: " + this.sheet.getError(e));
      e = e + 1;
    };
    this.sheet.applyTree(root, theme);
    return theme;
  };
  report (theme) {
    if ( this.hasFiles() == false ) {
      return;
    }
    console.log(((("Stylesheets: " + ((this.loadedCount.toString()))) + " file(s), ") + ((this.sheet.getRuleCount().toString()))) + " rule(s)");
    if ( (theme.length) > 0 ) {
      console.log("Theme: " + theme);
    } else {
      console.log("Theme: (none) - only unscoped .class rules apply");
    }
  };
}
class BufferChunk  {
  constructor(size) {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.used = 0;
    this.capacity = 0;
    this.data = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.capacity = size;
    this.used = 0;
  }
  remaining () {
    return this.capacity - this.used;
  };
  isFull () {
    return this.used >= this.capacity;
  };
}
class GrowableBuffer  {
  constructor() {
    this.firstChunk = new BufferChunk(4096);
    this.currentChunk = new BufferChunk(4096);
    this.chunkSize = 4096;
    this.totalSize = 0;
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
  }
  setChunkSize (size) {
    this.chunkSize = size;
  };
  allocateNewChunk () {
    const newChunk = new BufferChunk(this.chunkSize);
    this.currentChunk.next = newChunk;
    this.currentChunk = newChunk;
  };
  writeByte (b) {
    if ( this.currentChunk.isFull() ) {
      this.allocateNewChunk();
    }
    const pos = this.currentChunk.used;
    this.currentChunk.data._view.setUint8(pos, b);
    this.currentChunk.used = pos + 1;
    this.totalSize = this.totalSize + 1;
  };
  writeBytes (src, srcOffset, length) {
    let i = 0;
    while (i < length) {
      const b = src._view.getUint8((srcOffset + i));
      this.writeByte(b);
      i = i + 1;
    };
  };
  writeBuffer (src) {
    const __len = src.byteLength;
    this.writeBytes(src, 0, __len);
  };
  writeString (s) {
    const __len = s.length;
    let i = 0;
    while (i < __len) {
      const ch = s.charCodeAt(i );
      this.writeByte(ch);
      i = i + 1;
    };
  };
  writeInt16BE (value) {
    const highD = value / 256;
    const high = Math.floor( highD);
    const low = value - (high * 256);
    this.writeByte(high);
    this.writeByte(low);
  };
  writeInt32BE (value) {
    const b1D = value / 16777216;
    const b1 = Math.floor( b1D);
    const rem1 = value - (b1 * 16777216);
    const b2D = rem1 / 65536;
    const b2 = Math.floor( b2D);
    const rem2 = rem1 - (b2 * 65536);
    const b3D = rem2 / 256;
    const b3 = Math.floor( b3D);
    const b4 = rem2 - (b3 * 256);
    this.writeByte(b1);
    this.writeByte(b2);
    this.writeByte(b3);
    this.writeByte(b4);
  };
  size () {
    return this.totalSize;
  };
  toBuffer () {
    const allocSize = this.totalSize;
    let result = (function(){ var b = new ArrayBuffer(allocSize); b._view = new DataView(b); return b; })();
    let pos = 0;
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunk.data._view.getUint8(i);
        result._view.setUint8(pos, b);
        pos = pos + 1;
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  toString () {
    let result = "";
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunk.data._view.getUint8(i);
        result = result + (String.fromCharCode(b));
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  clear () {
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
    this.totalSize = 0;
  };
}
class TTFTableRecord  {
  constructor() {
    this.tag = "";
    this.checksum = 0;
    this.offset = 0;
    this.length = 0;
  }
}
class TTFGlyphMetrics  {
  constructor() {
    this.advanceWidth = 0;     /** note: unused */
    this.leftSideBearing = 0;     /** note: unused */
  }
}
class TrueTypeFont  {
  constructor() {
    this.fontData = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.fontPath = "";
    this.fontFamily = "";
    this.fontStyle = "Regular";
    this.sfntVersion = 0;
    this.numTables = 0;
    this.searchRange = 0;
    this.entrySelector = 0;
    this.rangeShift = 0;
    this.tables = [];
    this.unitsPerEm = 1000;
    this.xMin = 0;
    this.yMin = 0;
    this.xMax = 0;
    this.yMax = 0;
    this.indexToLocFormat = 0;
    this.ascender = 0;
    this.descender = 0;
    this.lineGap = 0;
    this.numberOfHMetrics = 0;
    this.numGlyphs = 0;
    this.cmapFormat = 0;
    this.cmapOffset = 0;
    this.glyphWidths = [];
    this.defaultWidth = 500;
    this.charWidths = [];
    this.charWidthsLoaded = false;
    this.kernSubtables = [];
    this.kernSubtableLookups = [];
    this.pairMatched = false;
    this.legacyKernOffset = 0;
    this.legacyKernPairs = 0;
    this.hasKerning = false;
    let t = [];
    this.tables = t;
    let gw = [];
    this.glyphWidths = gw;
    let cw = [];
    this.charWidths = cw;
    let ks = [];
    this.kernSubtables = ks;
    let ksl = [];
    this.kernSubtableLookups = ksl;
  }
  loadFromFile (path) {
    this.fontPath = path;
    let lastSlash = -1;
    let i = 0;
    while (i < (path.length)) {
      const ch = path.charCodeAt(i );
      if ( (ch == 47) || (ch == 92) ) {
        lastSlash = i;
      }
      i = i + 1;
    };
    let dirPath = ".";
    let fileName = path;
    if ( lastSlash >= 0 ) {
      dirPath = path.substring(0, lastSlash );
      fileName = path.substring((lastSlash + 1), (path.length) );
    }
    if ( (require("fs").existsSync(dirPath + "/" + fileName )) == false ) {
      return false;
    }
    this.fontData = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( (this.fontData.byteLength) == 0 ) {
      console.log("TrueTypeFont: Failed to load " + path);
      return false;
    }
    if ( this.parseOffsetTable() == false ) {
      return false;
    }
    if ( this.parseTableDirectory() == false ) {
      return false;
    }
    this.parseHeadTable();
    this.parseHheaTable();
    this.parseMaxpTable();
    this.parseCmapTable();
    this.parseHmtxTable();
    this.parseNameTable();
    this.parseKerning();
    this.buildCharWidthCache();
    return true;
  };
  parseOffsetTable () {
    if ( (this.fontData.byteLength) < 12 ) {
      return false;
    }
    this.sfntVersion = this.readUInt32(0);
    this.numTables = this.readUInt16(4);
    this.searchRange = this.readUInt16(6);
    this.entrySelector = this.readUInt16(8);
    this.rangeShift = this.readUInt16(10);
    return true;
  };
  parseTableDirectory () {
    let offset = 12;
    let i = 0;
    while (i < this.numTables) {
      const record = new TTFTableRecord();
      record.tag = this.readTag(offset);
      record.checksum = this.readUInt32((offset + 4));
      record.offset = this.readUInt32((offset + 8));
      record.length = this.readUInt32((offset + 12));
      this.tables.push(record);
      offset = offset + 16;
      i = i + 1;
    };
    return true;
  };
  findTable (tag) {
    let i = 0;
    while (i < (this.tables.length)) {
      const t = this.tables[i];
      if ( t.tag == tag ) {
        return t;
      }
      i = i + 1;
    };
    const empty = new TTFTableRecord();
    return empty;
  };
  parseHeadTable () {
    const table = this.findTable("head");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.unitsPerEm = this.readUInt16((off + 18));
    this.xMin = this.readInt16((off + 36));
    this.yMin = this.readInt16((off + 38));
    this.xMax = this.readInt16((off + 40));
    this.yMax = this.readInt16((off + 42));
    this.indexToLocFormat = this.readInt16((off + 50));
  };
  parseHheaTable () {
    const table = this.findTable("hhea");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.ascender = this.readInt16((off + 4));
    this.descender = this.readInt16((off + 6));
    this.lineGap = this.readInt16((off + 8));
    this.numberOfHMetrics = this.readUInt16((off + 34));
  };
  parseMaxpTable () {
    const table = this.findTable("maxp");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.numGlyphs = this.readUInt16((off + 4));
  };
  parseCmapTable () {
    const table = this.findTable("cmap");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    const numSubtables = this.readUInt16((off + 2));
    let i = 0;
    let subtableOffset = 0;
    while (i < numSubtables) {
      const recordOff = (off + 4) + (i * 8);
      const platformID = this.readUInt16(recordOff);
      const encodingID = this.readUInt16((recordOff + 2));
      const subOff = this.readUInt32((recordOff + 4));
      if ( (platformID == 3) && (encodingID == 1) ) {
        subtableOffset = subOff;
      }
      if ( (platformID == 0) && (subtableOffset == 0) ) {
        subtableOffset = subOff;
      }
      i = i + 1;
    };
    if ( subtableOffset > 0 ) {
      this.cmapOffset = off + subtableOffset;
      this.cmapFormat = this.readUInt16(this.cmapOffset);
    }
  };
  parseHmtxTable () {
    const table = this.findTable("hmtx");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    let i = 0;
    while (i < this.numberOfHMetrics) {
      const advanceWidth = this.readUInt16((off + (i * 4)));
      this.glyphWidths.push(advanceWidth);
      i = i + 1;
    };
    if ( this.numberOfHMetrics > 0 ) {
      this.defaultWidth = this.glyphWidths[(this.numberOfHMetrics - 1)];
    }
  };
  parseNameTable () {
    const table = this.findTable("name");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    const count = this.readUInt16((off + 2));
    const stringOffset = this.readUInt16((off + 4));
    let i = 0;
    while (i < count) {
      const recordOff = (off + 6) + (i * 12);
      const platformID = this.readUInt16(recordOff);
      const encodingID = this.readUInt16((recordOff + 2));
      const languageID = this.readUInt16((recordOff + 4));
      const nameID = this.readUInt16((recordOff + 6));
      const length = this.readUInt16((recordOff + 8));
      const strOffset = this.readUInt16((recordOff + 10));
      if ( (nameID == 1) && (platformID == 3) ) {
        const strOff = (off + stringOffset) + strOffset;
        this.fontFamily = this.readUnicodeString(strOff, length);
      }
      if ( ((nameID == 1) && (platformID == 1)) && ((this.fontFamily.length) == 0) ) {
        const strOff_1 = (off + stringOffset) + strOffset;
        this.fontFamily = this.readAsciiString(strOff_1, length);
      }
      if ( (nameID == 2) && (platformID == 3) ) {
        const strOff_2 = (off + stringOffset) + strOffset;
        this.fontStyle = this.readUnicodeString(strOff_2, length);
      }
      if ( ((nameID == 2) && (platformID == 1)) && ((this.fontStyle.length) == 0) ) {
        const strOff_3 = (off + stringOffset) + strOffset;
        this.fontStyle = this.readAsciiString(strOff_3, length);
      }
      i = i + 1;
    };
  };
  getGlyphIndex (charCode) {
    if ( this.cmapOffset == 0 ) {
      return 0;
    }
    if ( this.cmapFormat == 4 ) {
      return this.getGlyphIndexFormat4(charCode);
    }
    if ( this.cmapFormat == 0 ) {
      if ( (charCode >= 0) && (charCode < 256) ) {
        return this.readUInt8(((this.cmapOffset + 6) + charCode));
      }
    }
    if ( this.cmapFormat == 6 ) {
      const firstCode = this.readUInt16((this.cmapOffset + 6));
      const entryCount = this.readUInt16((this.cmapOffset + 8));
      if ( (charCode >= firstCode) && (charCode < (firstCode + entryCount)) ) {
        return this.readUInt16(((this.cmapOffset + 10) + ((charCode - firstCode) * 2)));
      }
    }
    return 0;
  };
  getGlyphIndexFormat4 (charCode) {
    const off = this.cmapOffset;
    const segCountX2 = this.readUInt16((off + 6));
    const segCountD = (segCountX2) / 2.0;
    const segCount = Math.floor( segCountD);
    const endCodesOff = off + 14;
    const startCodesOff = (endCodesOff + segCountX2) + 2;
    const idDeltaOff = startCodesOff + segCountX2;
    const idRangeOffsetOff = idDeltaOff + segCountX2;
    let i = 0;
    while (i < segCount) {
      const endCode = this.readUInt16((endCodesOff + (i * 2)));
      const startCode = this.readUInt16((startCodesOff + (i * 2)));
      if ( (charCode >= startCode) && (charCode <= endCode) ) {
        const idDelta = this.readInt16((idDeltaOff + (i * 2)));
        const idRangeOffset = this.readUInt16((idRangeOffsetOff + (i * 2)));
        if ( idRangeOffset == 0 ) {
          return (charCode + idDelta) % 65536;
        } else {
          const glyphIdOff = ((idRangeOffsetOff + (i * 2)) + idRangeOffset) + ((charCode - startCode) * 2);
          const glyphId = this.readUInt16(glyphIdOff);
          if ( glyphId != 0 ) {
            return (glyphId + idDelta) % 65536;
          }
        }
      }
      i = i + 1;
    };
    return 0;
  };
  getGlyphWidth (glyphIndex) {
    if ( glyphIndex < (this.glyphWidths.length) ) {
      return this.glyphWidths[glyphIndex];
    }
    return this.defaultWidth;
  };
  buildCharWidthCache () {
    let i = 0;
    while (i < 256) {
      const glyphIdx = this.getGlyphIndex(i);
      const width = this.getGlyphWidth(glyphIdx);
      this.charWidths.push(width);
      i = i + 1;
    };
    this.charWidthsLoaded = true;
  };
  getCharWidth (charCode) {
    if ( (this.charWidthsLoaded && (charCode >= 0)) && (charCode < 256) ) {
      return this.charWidths[charCode];
    }
    const glyphIdx = this.getGlyphIndex(charCode);
    return this.getGlyphWidth(glyphIdx);
  };
  getCharWidthPoints (charCode, fontSize) {
    const fontUnits = this.getCharWidth(charCode);
    return ((fontUnits) * fontSize) / (this.unitsPerEm);
  };
  measureText (text, fontSize) {
    let width = 0.0;
    const __len = text.length;
    let i = 0;
    while (i < __len) {
      const ch = text.charCodeAt(i );
      width = width + this.getCharWidthPoints(ch, fontSize);
      if ( i > 0 ) {
        width = width + this.kernPoints((text.charCodeAt((i - 1) )), ch, fontSize);
      }
      i = i + 1;
    };
    return width;
  };
  getAscender (fontSize) {
    return ((this.ascender) * fontSize) / (this.unitsPerEm);
  };
  getDescender (fontSize) {
    return ((this.descender) * fontSize) / (this.unitsPerEm);
  };
  getLineHeight (fontSize) {
    const asc = this.getAscender(fontSize);
    const desc = this.getDescender(fontSize);
    const gap = ((this.lineGap) * fontSize) / (this.unitsPerEm);
    return (asc - desc) + gap;
  };
  getFontData () {
    return this.fontData;
  };
  getPostScriptName () {
    const name = this.fontFamily;
    let result = "";
    let i = 0;
    while (i < (name.length)) {
      const ch = name.charCodeAt(i );
      if ( ch != 32 ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    if ( (result.length) == 0 ) {
      return "CustomFont";
    }
    return result;
  };
  readUInt8 (offset) {
    return this.fontData._view.getUint8(offset);
  };
  parseKerning () {
    const gpos = this.findTable("GPOS");
    if ( gpos.offset > 0 ) {
      this.parseGposKernFeature(gpos.offset);
      if ( (this.kernSubtables.length) > 0 ) {
        this.hasKerning = true;
      }
      return;
    }
    const kt = this.findTable("kern");
    if ( kt.offset > 0 ) {
      this.parseLegacyKern(kt.offset);
    }
  };
  parseGposKernFeature (gposOff) {
    const featureListOff = gposOff + this.readUInt16((gposOff + 6));
    const lookupListOff = gposOff + this.readUInt16((gposOff + 8));
    const featureCount = this.readUInt16(featureListOff);
    const lookupCount = this.readUInt16(lookupListOff);
    let f = 0;
    while (f < featureCount) {
      const recOff = (featureListOff + 2) + (f * 6);
      const tag = this.readTag(recOff);
      if ( tag == "kern" ) {
        const featOff = featureListOff + this.readUInt16((recOff + 4));
        const idxCount = this.readUInt16((featOff + 2));
        let li = 0;
        while (li < idxCount) {
          const lookupIndex = this.readUInt16(((featOff + 4) + (li * 2)));
          if ( lookupIndex < lookupCount ) {
            const lookupOff = lookupListOff + this.readUInt16(((lookupListOff + 2) + (lookupIndex * 2)));
            this.collectPairLookup(lookupOff, lookupIndex);
          }
          li = li + 1;
        };
      }
      f = f + 1;
    };
  };
  collectPairLookup (lookupOff, lookupIndex) {
    const lookupType = this.readUInt16(lookupOff);
    const subCount = this.readUInt16((lookupOff + 4));
    let i = 0;
    while (i < subCount) {
      const subOff = lookupOff + this.readUInt16(((lookupOff + 6) + (i * 2)));
      if ( lookupType == 2 ) {
        this.kernSubtables.push(subOff);
        this.kernSubtableLookups.push(lookupIndex);
      }
      if ( lookupType == 9 ) {
        const extType = this.readUInt16((subOff + 2));
        if ( extType == 2 ) {
          this.kernSubtables.push(subOff + this.readUInt32((subOff + 4)));
          this.kernSubtableLookups.push(lookupIndex);
        }
      }
      i = i + 1;
    };
  };
  parseLegacyKern (kernOff) {
    const nTables = this.readUInt16((kernOff + 2));
    if ( nTables < 1 ) {
      return;
    }
    const sub = kernOff + 4;
    const coverage = this.readUInt16((sub + 4));
    const format = Math.floor( (coverage / 256));
    const horizontal = (coverage % 2) == 1;
    if ( (format == 0) && horizontal ) {
      this.legacyKernPairs = this.readUInt16((sub + 6));
      this.legacyKernOffset = sub + 14;
      if ( this.legacyKernPairs > 0 ) {
        this.hasKerning = true;
      }
    }
  };
  kernAdvance (leftGlyph, rightGlyph) {
    if ( this.hasKerning == false ) {
      return 0;
    }
    if ( this.legacyKernOffset > 0 ) {
      return this.legacyKernAdvance(leftGlyph, rightGlyph);
    }
    let total = 0;
    let satisfied = 0 - 1;
    let i = 0;
    while (i < (this.kernSubtables.length)) {
      const lk = this.kernSubtableLookups[i];
      if ( lk != satisfied ) {
        const adj = this.pairAdvance((this.kernSubtables[i]), leftGlyph, rightGlyph);
        if ( this.pairMatched ) {
          total = total + adj;
          satisfied = lk;
        }
      }
      i = i + 1;
    };
    return total;
  };
  pairAdvance (st, leftGlyph, rightGlyph) {
    this.pairMatched = false;
    const posFormat = this.readUInt16(st);
    const coverageOff = st + this.readUInt16((st + 2));
    const valueFormat1 = this.readUInt16((st + 4));
    const valueFormat2 = this.readUInt16((st + 6));
    const covIndex = this.coverageIndex(coverageOff, leftGlyph);
    if ( covIndex < 0 ) {
      return 0;
    }
    const v1Size = this.valueRecordSize(valueFormat1);
    const v2Size = this.valueRecordSize(valueFormat2);
    if ( posFormat == 1 ) {
      const pairSetOff = st + this.readUInt16(((st + 10) + (covIndex * 2)));
      const pairCount = this.readUInt16(pairSetOff);
      const recSize = (2 + v1Size) + v2Size;
      let lo = 0;
      let hi = pairCount - 1;
      while (lo <= hi) {
        const mid = Math.floor( ((lo + hi) / 2));
        const recOff = (pairSetOff + 2) + (mid * recSize);
        const second = this.readUInt16(recOff);
        if ( second == rightGlyph ) {
          this.pairMatched = true;
          return this.valueXAdvance((recOff + 2), valueFormat1);
        }
        if ( second < rightGlyph ) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      };
      return 0;
    }
    if ( posFormat == 2 ) {
      const classDef1 = st + this.readUInt16((st + 8));
      const classDef2 = st + this.readUInt16((st + 10));
      const class2Count = this.readUInt16((st + 14));
      const c1 = this.glyphClass(classDef1, leftGlyph);
      const c2 = this.glyphClass(classDef2, rightGlyph);
      const recSize_1 = v1Size + v2Size;
      const recOff_1 = (st + 16) + (((c1 * class2Count) + c2) * recSize_1);
      this.pairMatched = true;
      return this.valueXAdvance(recOff_1, valueFormat1);
    }
    return 0;
  };
  valueRecordSize (format) {
    let size = 0;
    let bit = 0;
    while (bit < 8) {
      const mask = this.powTwo(bit);
      if ( this.hasBit(format, mask) ) {
        size = size + 2;
      }
      bit = bit + 1;
    };
    return size;
  };
  valueXAdvance (recOff, format) {
    if ( this.hasBit(format, 4) == false ) {
      return 0;
    }
    let off = recOff;
    if ( this.hasBit(format, 1) ) {
      off = off + 2;
    }
    if ( this.hasBit(format, 2) ) {
      off = off + 2;
    }
    return this.readInt16(off);
  };
  powTwo (n) {
    let v = 1;
    let i = 0;
    while (i < n) {
      v = v * 2;
      i = i + 1;
    };
    return v;
  };
  hasBit (value, mask) {
    return ((Math.floor( (value / mask))) % 2) == 1;
  };
  coverageIndex (cov, glyph) {
    const format = this.readUInt16(cov);
    if ( format == 1 ) {
      const count = this.readUInt16((cov + 2));
      let lo = 0;
      let hi = count - 1;
      while (lo <= hi) {
        const mid = Math.floor( ((lo + hi) / 2));
        const g = this.readUInt16(((cov + 4) + (mid * 2)));
        if ( g == glyph ) {
          return mid;
        }
        if ( g < glyph ) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      };
      return 0 - 1;
    }
    if ( format == 2 ) {
      const rangeCount = this.readUInt16((cov + 2));
      let lo2 = 0;
      let hi2 = rangeCount - 1;
      while (lo2 <= hi2) {
        const mid2 = Math.floor( ((lo2 + hi2) / 2));
        const rec = (cov + 4) + (mid2 * 6);
        const start = this.readUInt16(rec);
        const end = this.readUInt16((rec + 2));
        if ( glyph < start ) {
          hi2 = mid2 - 1;
        } else {
          if ( glyph > end ) {
            lo2 = mid2 + 1;
          } else {
            return this.readUInt16((rec + 4)) + (glyph - start);
          }
        }
      };
      return 0 - 1;
    }
    return 0 - 1;
  };
  glyphClass (cd, glyph) {
    const format = this.readUInt16(cd);
    if ( format == 1 ) {
      const startGlyph = this.readUInt16((cd + 2));
      const count = this.readUInt16((cd + 4));
      if ( glyph < startGlyph ) {
        return 0;
      }
      if ( glyph >= (startGlyph + count) ) {
        return 0;
      }
      return this.readUInt16(((cd + 6) + ((glyph - startGlyph) * 2)));
    }
    if ( format == 2 ) {
      const rangeCount = this.readUInt16((cd + 2));
      let lo = 0;
      let hi = rangeCount - 1;
      while (lo <= hi) {
        const mid = Math.floor( ((lo + hi) / 2));
        const rec = (cd + 4) + (mid * 6);
        const start = this.readUInt16(rec);
        const end = this.readUInt16((rec + 2));
        if ( glyph < start ) {
          hi = mid - 1;
        } else {
          if ( glyph > end ) {
            lo = mid + 1;
          } else {
            return this.readUInt16((rec + 4));
          }
        }
      };
      return 0;
    }
    return 0;
  };
  legacyKernAdvance (leftGlyph, rightGlyph) {
    let lo = 0;
    let hi = this.legacyKernPairs - 1;
    while (lo <= hi) {
      const mid = Math.floor( ((lo + hi) / 2));
      const rec = this.legacyKernOffset + (mid * 6);
      const l = this.readUInt16(rec);
      const r = this.readUInt16((rec + 2));
      if ( l == leftGlyph ) {
        if ( r == rightGlyph ) {
          return this.readInt16((rec + 4));
        }
      }
      const key = (l * 65536) + r;
      const want = (leftGlyph * 65536) + rightGlyph;
      if ( key < want ) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    };
    return 0;
  };
  kernUnits (leftChar, rightChar) {
    if ( this.hasKerning == false ) {
      return 0;
    }
    const lg = this.getGlyphIndex(leftChar);
    const rg = this.getGlyphIndex(rightChar);
    if ( (lg == 0) || (rg == 0) ) {
      return 0;
    }
    return this.kernAdvance(lg, rg);
  };
  kernPoints (leftChar, rightChar, fontSize) {
    if ( this.hasKerning == false ) {
      return 0.0;
    }
    const lg = this.getGlyphIndex(leftChar);
    const rg = this.getGlyphIndex(rightChar);
    if ( (lg == 0) || (rg == 0) ) {
      return 0.0;
    }
    const units = this.kernAdvance(lg, rg);
    if ( units == 0 ) {
      return 0.0;
    }
    return ((units) * fontSize) / (this.unitsPerEm);
  };
  readUInt16 (offset) {
    const b1 = this.fontData._view.getUint8(offset);
    const b2 = this.fontData._view.getUint8((offset + 1));
    return (b1 * 256) + b2;
  };
  readInt16 (offset) {
    const val = this.readUInt16(offset);
    if ( val >= 32768 ) {
      return val - 65536;
    }
    return val;
  };
  readUInt32 (offset) {
    const b1 = this.fontData._view.getUint8(offset);
    const b2 = this.fontData._view.getUint8((offset + 1));
    const b3 = this.fontData._view.getUint8((offset + 2));
    const b4 = this.fontData._view.getUint8((offset + 3));
    const result = (((((b1 * 256) + b2) * 256) + b3) * 256) + b4;
    return result;
  };
  readTag (offset) {
    let result = "";
    let i = 0;
    while (i < 4) {
      const ch = this.fontData._view.getUint8((offset + i));
      result = result + (String.fromCharCode(ch));
      i = i + 1;
    };
    return result;
  };
  readAsciiString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const ch = this.fontData._view.getUint8((offset + i));
      if ( ch > 0 ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    return result;
  };
  readUnicodeString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const ch = this.readUInt16((offset + i));
      if ( (ch > 0) && (ch < 128) ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 2;
    };
    return result;
  };
  printInfo () {
    console.log((("Font: " + this.fontFamily) + " ") + this.fontStyle);
    console.log("  Units per EM: " + ((this.unitsPerEm.toString())));
    console.log("  Ascender: " + ((this.ascender.toString())));
    console.log("  Descender: " + ((this.descender.toString())));
    console.log("  Line gap: " + ((this.lineGap.toString())));
    console.log("  Num glyphs: " + ((this.numGlyphs.toString())));
    console.log("  Num hMetrics: " + ((this.numberOfHMetrics.toString())));
    console.log("  Tables: " + (((this.tables.length).toString())));
  };
}
class EVGTextMetrics  {
  constructor() {
    this.width = 0.0;
    this.height = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.lineHeight = 0.0;
    this.width = 0.0;
    this.height = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.lineHeight = 0.0;
  }
}
EVGTextMetrics.create = function(w, h) {
  const m = new EVGTextMetrics();
  m.width = w;
  m.height = h;
  return m;
};
class EVGTextMeasurer  {
  constructor() {
  }
  isFontAccurate () {
    return false;
  };
  hasFace (fontFamily) {
    return false;
  };
  measureText (text, fontFamily, fontSize) {
    const avgCharWidth = fontSize * 0.55;
    const textLen = text.length;
    const width = (textLen) * avgCharWidth;
    const lineHeight = fontSize * 1.2;
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8;
    metrics.descent = fontSize * 0.2;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    const metrics = this.measureText(text, fontFamily, fontSize);
    return metrics.width;
  };
  getLineHeight (fontFamily, fontSize) {
    return fontSize * 1.2;
  };
  measureChar (ch, fontFamily, fontSize) {
    if ( ch == 32 ) {
      return fontSize * 0.3;
    }
    if ( ((((ch == 105) || (ch == 108)) || (ch == 106)) || (ch == 116)) || (ch == 102) ) {
      return fontSize * 0.3;
    }
    if ( (ch == 109) || (ch == 119) ) {
      return fontSize * 0.8;
    }
    if ( (ch == 77) || (ch == 87) ) {
      return fontSize * 0.9;
    }
    if ( ch == 73 ) {
      return fontSize * 0.35;
    }
    return fontSize * 0.55;
  };
  wrapText (text, fontFamily, fontSize, maxWidth) {
    let lines = [];
    let currentLine = "";
    let currentWidth = 0.0;
    let wordStart = 0;
    const textLen = text.length;
    let i = 0;
    while (i <= textLen) {
      let ch = 0;
      const isEnd = i == textLen;
      if ( isEnd == false ) {
        ch = text.charCodeAt(i );
      }
      let isWordEnd = false;
      if ( isEnd ) {
        isWordEnd = true;
      }
      if ( ch == 32 ) {
        isWordEnd = true;
      }
      if ( ch == 10 ) {
        isWordEnd = true;
      }
      if ( isWordEnd ) {
        let word = "";
        if ( i > wordStart ) {
          word = text.substring(wordStart, i );
        }
        const wordWidth = this.measureTextWidth(word, fontFamily, fontSize);
        let spaceWidth = 0.0;
        if ( (currentLine.length) > 0 ) {
          spaceWidth = this.measureTextWidth(" ", fontFamily, fontSize);
        }
        if ( ((currentWidth + spaceWidth) + wordWidth) <= maxWidth ) {
          if ( (currentLine.length) > 0 ) {
            currentLine = currentLine + " ";
            currentWidth = currentWidth + spaceWidth;
          }
          currentLine = currentLine + word;
          currentWidth = currentWidth + wordWidth;
        } else {
          if ( (currentLine.length) > 0 ) {
            lines.push(currentLine);
          }
          currentLine = word;
          currentWidth = wordWidth;
        }
        if ( ch == 10 ) {
          lines.push(currentLine);
          currentLine = "";
          currentWidth = 0.0;
        }
        wordStart = i + 1;
      }
      i = i + 1;
    };
    if ( (currentLine.length) > 0 ) {
      lines.push(currentLine);
    }
    return lines;
  };
}
class SimpleTextMeasurer  extends EVGTextMeasurer {
  constructor() {
    super()
    this.charWidthRatio = 0.55;
  }
  setCharWidthRatio (ratio) {
    this.charWidthRatio = ratio;
  };
  measureText (text, fontFamily, fontSize) {
    const textLen = text.length;
    let width = 0.0;
    let i = 0;
    while (i < textLen) {
      const ch = text.charCodeAt(i );
      width = width + this.measureChar(ch, fontFamily, fontSize);
      i = i + 1;
    };
    const lineHeight = fontSize * 1.2;
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8;
    metrics.descent = fontSize * 0.2;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
}
class FontManager  {
  constructor() {
    this.fonts = [];
    this.fontNames = [];
    this.fontsDirectory = "./Fonts";
    this.fontsDirectories = [];
    this.resolvedDirectory = "";
    this.defaultFont = new TrueTypeFont();
    this.hasDefaultFont = false;
    let f = [];
    this.fonts = f;
    let n = [];
    this.fontNames = n;
    let fd = [];
    this.fontsDirectories = fd;
  }
  setFontsDirectory (path) {
    this.fontsDirectory = path;
  };
  getFontCount () {
    return this.fonts.length;
  };
  addFontsDirectory (path) {
    this.fontsDirectories.push(path);
  };
  setFontsDirectories (paths) {
    let start = 0;
    let i = 0;
    const __len = paths.length;
    while (i <= __len) {
      let ch = "";
      if ( i < __len ) {
        ch = paths.substring(i, (i + 1) );
      }
      if ( (ch == ";") || (i == __len) ) {
        if ( i > start ) {
          const part = paths.substring(start, i );
          this.fontsDirectories.push(part);
          console.log("FontManager: Added fonts directory: " + part);
        }
        start = i + 1;
      }
      i = i + 1;
    };
    if ( (this.fontsDirectories.length) > 0 ) {
      this.fontsDirectory = this.fontsDirectories[0];
    }
  };
  loadFont (relativePath) {
    let i = 0;
    while (i < (this.fontsDirectories.length)) {
      const dir = this.fontsDirectories[i];
      const fullPath = (dir + "/") + relativePath;
      const font = new TrueTypeFont();
      if ( font.loadFromFile(fullPath) == true ) {
        this.fonts.push(font);
        this.fontNames.push(font.fontFamily);
        if ( (this.resolvedDirectory.length) == 0 ) {
          this.resolvedDirectory = dir;
        }
        if ( this.hasDefaultFont == false ) {
          this.defaultFont = font;
          this.hasDefaultFont = true;
        }
        console.log((((("FontManager: Loaded font '" + font.fontFamily) + "' (") + font.fontStyle) + ") from ") + fullPath);
        return true;
      }
      i = i + 1;
    };
    let separator = "/";
    const dirLen = this.fontsDirectory.length;
    if ( dirLen > 0 ) {
      const lastChar = this.fontsDirectory.substring((dirLen - 1), dirLen );
      if ( lastChar == "/" ) {
        separator = "";
      }
    }
    const fullPath_1 = (this.fontsDirectory + separator) + relativePath;
    console.log("FontManager: Trying to load font from: " + fullPath_1);
    const font_1 = new TrueTypeFont();
    if ( font_1.loadFromFile(fullPath_1) == false ) {
      console.log(((("FontManager: Failed to load font: " + relativePath) + " (full path: ") + fullPath_1) + ")");
      return false;
    }
    this.fonts.push(font_1);
    this.fontNames.push(font_1.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font_1;
      this.hasDefaultFont = true;
    }
    console.log(((("FontManager: Loaded font '" + font_1.fontFamily) + "' (") + font_1.fontStyle) + ")");
    return true;
  };
  loadFontFamily (familyDir) {
    this.loadFont(((familyDir + "/") + familyDir) + "-Regular.ttf");
  };
  getFont (fontFamily) {
    const slashIdx = fontFamily.indexOf("/");
    let searchFamily = fontFamily;
    let searchStyle = "";
    if ( slashIdx >= 0 ) {
      searchFamily = fontFamily.substring(0, slashIdx );
      const afterSlash = fontFamily.substring((slashIdx + 1), (fontFamily.length) );
      const dashIdx = afterSlash.indexOf("-");
      if ( dashIdx >= 0 ) {
        searchStyle = afterSlash.substring((dashIdx + 1), (afterSlash.length) );
      }
    } else {
      const dashIdx_1 = fontFamily.indexOf("-");
      if ( dashIdx_1 >= 0 ) {
        searchFamily = fontFamily.substring(0, dashIdx_1 );
        searchStyle = fontFamily.substring((dashIdx_1 + 1), (fontFamily.length) );
      }
    }
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.fontFamily == searchFamily ) {
        if ( (searchStyle.length) > 0 ) {
          if ( f.fontStyle == searchStyle ) {
            return f;
          }
        } else {
          return f;
        }
      }
      i = i + 1;
    };
    i = 0;
    while (i < (this.fonts.length)) {
      const f_1 = this.fonts[i];
      if ( f_1.fontFamily == searchFamily ) {
        if ( (searchStyle.length) > 0 ) {
          if ( (f_1.fontStyle.indexOf(searchStyle)) >= 0 ) {
            return f_1;
          }
        }
      }
      i = i + 1;
    };
    i = 0;
    while (i < (this.fonts.length)) {
      const f_2 = this.fonts[i];
      if ( f_2.fontFamily == fontFamily ) {
        return f_2;
      }
      i = i + 1;
    };
    i = 0;
    while (i < (this.fonts.length)) {
      const f_3 = this.fonts[i];
      if ( (f_3.fontFamily.indexOf(fontFamily)) >= 0 ) {
        return f_3;
      }
      i = i + 1;
    };
    return this.defaultFont;
  };
  hasFont (fontFamily) {
    if ( (this.fonts.length) == 0 ) {
      return false;
    }
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm == 0 ) {
      return false;
    }
    const slashIdx = fontFamily.indexOf("/");
    let searchFamily = fontFamily;
    if ( slashIdx >= 0 ) {
      searchFamily = fontFamily.substring(0, slashIdx );
    } else {
      const dashIdx = fontFamily.indexOf("-");
      if ( dashIdx >= 0 ) {
        searchFamily = fontFamily.substring(0, dashIdx );
      }
    }
    return (font.fontFamily == searchFamily) || (font.fontFamily == fontFamily);
  };
  measureText (text, fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.measureText(text, fontSize);
    }
    return (((text.length)) * fontSize) * 0.5;
  };
  getLineHeight (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getLineHeight(fontSize);
    }
    return fontSize * 1.2;
  };
  getAscender (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getAscender(fontSize);
    }
    return fontSize * 0.8;
  };
  getDescender (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getDescender(fontSize);
    }
    return fontSize * -0.2;
  };
  getFontData (fontFamily) {
    const font = this.getFont(fontFamily);
    return font.getFontData();
  };
  getPostScriptName (fontFamily) {
    const font = this.getFont(fontFamily);
    return font.getPostScriptName();
  };
  printLoadedFonts () {
    console.log(("FontManager: " + (((this.fonts.length).toString()))) + " fonts loaded:");
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      console.log(((("  - " + f.fontFamily) + " (") + f.fontStyle) + ")");
      i = i + 1;
    };
  };
}
class TTFTextMeasurer  extends EVGTextMeasurer {
  constructor(fm) {
    super(fm)
    this.fontManager = fm;
  }
  isFontAccurate () {
    return true;
  };
  hasFace (fontFamily) {
    return this.fontManager.hasFont(fontFamily);
  };
  measureText (text, fontFamily, fontSize) {
    const width = this.fontManager.measureText(text, fontFamily, fontSize);
    const lineHeight = this.fontManager.getLineHeight(fontFamily, fontSize);
    const ascent = this.fontManager.getAscender(fontFamily, fontSize);
    const descent = this.fontManager.getDescender(fontFamily, fontSize);
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = ascent;
    metrics.descent = descent;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    return this.fontManager.measureText(text, fontFamily, fontSize);
  };
  getLineHeight (fontFamily, fontSize) {
    return this.fontManager.getLineHeight(fontFamily, fontSize);
  };
  measureChar (ch, fontFamily, fontSize) {
    const font = this.fontManager.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getCharWidthPoints(ch, fontSize);
    }
    return fontSize * 0.5;
  };
}
class EVGFontSetup  {
  constructor() {
    this.manager = new FontManager();
    this.searched = [];
    this.loaded = [];
    this.missing = [];
  }
  getManager () {
    return this.manager;
  };
  fontsRoot () {
    if ( (this.manager.resolvedDirectory.length) == 0 ) {
      return "";
    }
    return this.manager.resolvedDirectory + "/";
  };
  loadedCount () {
    return this.loaded.length;
  };
  missingCount () {
    return this.missing.length;
  };
  init (inputDir, override) {
    if ( (override.length) > 0 ) {
      this.manager.addFontsDirectory(override);
      this.searched.push(override);
      this.loadStandardFaces();
      return;
    }
    const rel = inputDir + "../assets/fonts";
    this.manager.addFontsDirectory(rel);
    this.searched.push(rel);
    const rel2 = inputDir + "assets/fonts";
    this.manager.addFontsDirectory(rel2);
    this.searched.push(rel2);
    this.manager.addFontsDirectory("./gallery/pdf_writer/assets/fonts");
    this.searched.push("./gallery/pdf_writer/assets/fonts");
    this.loadStandardFaces();
  };
  loadStandardFaces () {
    this.tryFace("Noto_Sans/NotoSans-Regular.ttf");
    this.tryFace("Noto_Sans/NotoSans-Bold.ttf");
    this.tryFace("Open_Sans/OpenSans-Regular.ttf");
    this.tryFace("Open_Sans/OpenSans-Bold.ttf");
    this.tryFace("Cinzel/Cinzel-Regular.ttf");
    this.tryFace("Cinzel/Cinzel-Bold.ttf");
    this.tryFace("Josefin_Sans/JosefinSans-Regular.ttf");
    this.tryFace("Josefin_Sans/JosefinSans-Bold.ttf");
    this.tryFace("Great_Vibes/GreatVibes-Regular.ttf");
  };
  tryFace (relativePath) {
    if ( this.manager.loadFont(relativePath) ) {
      this.loaded.push(relativePath);
    } else {
      this.missing.push(relativePath);
    }
  };
  report (verbose) {
    console.log(("Fonts: " + (((this.loaded.length).toString()))) + " face(s) loaded");
    if ( (this.loaded.length) == 0 ) {
      console.log("  WARNING: no font files found - text will be measured with");
      console.log("  heuristic widths and will not match printed output.");
      let s = 0;
      while (s < (this.searched.length)) {
        console.log("    searched: " + (this.searched[s]));
        s = s + 1;
      };
      return;
    }
    if ( verbose ) {
      let i = 0;
      while (i < (this.loaded.length)) {
        console.log("    " + (this.loaded[i]));
        i = i + 1;
      };
      let m = 0;
      while (m < (this.missing.length)) {
        console.log("    (not found) " + (this.missing[m]));
        m = m + 1;
      };
    }
  };
}
class EVGImageDimensions  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.aspectRatio = 1.0;
    this.isValid = false;
    this.width = 0;
    this.height = 0;
    this.aspectRatio = 1.0;
    this.isValid = false;
  }
}
EVGImageDimensions.create = function(w, h) {
  const d = new EVGImageDimensions();
  d.width = w;
  d.height = h;
  if ( h > 0 ) {
    d.aspectRatio = (w) / (h);
  }
  d.isValid = true;
  return d;
};
class EVGImageMeasurer  {
  constructor() {
  }
  getImageDimensions (src) {
    const dims = new EVGImageDimensions();
    return dims;
  };
  calculateHeightForWidth (src, targetWidth) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid ) {
      return targetWidth / dims.aspectRatio;
    }
    return targetWidth;
  };
  calculateWidthForHeight (src, targetHeight) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid ) {
      return targetHeight * dims.aspectRatio;
    }
    return targetHeight;
  };
  calculateFitDimensions (src, maxWidth, maxHeight) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid == false ) {
      return EVGImageDimensions.create((Math.floor( maxWidth)), (Math.floor( maxHeight)));
    }
    const scaleW = maxWidth / (dims.width);
    const scaleH = maxHeight / (dims.height);
    let scale = scaleW;
    if ( scaleH < scaleW ) {
      scale = scaleH;
    }
    const newW = Math.floor( ((dims.width) * scale));
    const newH = Math.floor( ((dims.height) * scale));
    return EVGImageDimensions.create(newW, newH);
  };
}
class SimpleImageMeasurer  extends EVGImageMeasurer {
  constructor() {
    super()
  }
}
class EVGGridTrack  {
  constructor() {
    this.kind = 0;
    this.value = 0.0;
    this.hasFitLimit = false;
    this.sizePx = 0.0;
    this.hasMin = false;
    this.hasMax = false;
    this.frozen = false;
    this.kind = 0;
    this.value = 0.0;
    this.sizePx = 0.0;
    this.hasMin = false;
    this.hasMax = false;
    this.frozen = false;
    this.hasFitLimit = false;
    this.minUnit = EVGUnit.unset();
    this.maxUnit = EVGUnit.unset();
    this.fitLimit = EVGUnit.unset();
  }
}
class EVGGridTemplate  {
  constructor() {
    this.tracks = [];
    this.lineNames = [];
    this.lineNumbers = [];
    this.hadError = false;
    this.errorText = "";
    this.hadError = false;
    this.errorText = "";
  }
  lineNumberNamed (name) {
    let i = 0;
    while (i < (this.lineNames.length)) {
      if ( (this.lineNames[i]) == name ) {
        return this.lineNumbers[i];
      }
      i = i + 1;
    };
    return 0;
  };
  addLineNames (tok) {
    const inner = (tok.substring(1, ((tok.length) - 1) )).trim();
    const line = (this.tracks.length) + 1;
    const parts = EVGGridTemplate.tokenize(inner);
    let i = 0;
    while (i < (parts.length)) {
      const nm = parts[i];
      if ( (nm.length) > 0 ) {
        if ( this.lineNumberNamed(nm) == 0 ) {
          this.lineNames.push(nm);
          this.lineNumbers.push(line);
        }
      }
      i = i + 1;
    };
  };
  count () {
    return this.tracks.length;
  };
  trackAt (i) {
    return this.tracks[i];
  };
  expandRepeat (tok) {
    const __len = tok.length;
    const close = __len - 1;
    if ( (tok.charCodeAt(close )) != 41 ) {
      this.hadError = true;
      this.errorText = "Malformed repeat(): " + tok;
      return;
    }
    const inner = tok.substring(7, close );
    let comma = 0 - 1;
    let j = 0;
    while (j < (inner.length)) {
      if ( (inner.charCodeAt(j )) == 44 ) {
        comma = j;
        j = inner.length;
      } else {
        j = j + 1;
      }
    };
    if ( comma < 0 ) {
      this.hadError = true;
      this.errorText = "repeat() needs a count and a track list: " + tok;
      return;
    }
    const countStr = (inner.substring(0, comma )).trim();
    const listStr = (inner.substring((comma + 1), (inner.length) )).trim();
    const countVal = isNaN( parseFloat(countStr) ) ? undefined : parseFloat(countStr);
    let n = 0;
    if ( typeof(countVal) != "undefined" ) {
      n = Math.floor( (countVal));
    } else {
      this.hadError = true;
      this.errorText = "repeat() count is not a number: " + tok;
      return;
    }
    if ( n < 1 ) {
      this.hadError = true;
      this.errorText = "repeat() count must be at least 1: " + tok;
      return;
    }
    const inner2 = EVGGridTemplate.tokenize(listStr);
    let r = 0;
    while (r < n) {
      let k = 0;
      while (k < (inner2.length)) {
        const innerTok = inner2[k];
        if ( EVGGridTemplate.isMinmax(innerTok) ) {
          this.addMinmax(innerTok);
        } else {
          this.addTrack(innerTok);
        }
        k = k + 1;
      };
      r = r + 1;
    };
  };
  addMinmax (tok) {
    const __len = tok.length;
    const close = __len - 1;
    if ( (tok.charCodeAt(close )) != 41 ) {
      this.hadError = true;
      this.errorText = "Malformed minmax(): " + tok;
      return;
    }
    const inner = tok.substring(7, close );
    let comma = 0 - 1;
    let j = 0;
    while (j < (inner.length)) {
      if ( (inner.charCodeAt(j )) == 44 ) {
        comma = j;
        j = inner.length;
      } else {
        j = j + 1;
      }
    };
    if ( comma < 0 ) {
      this.hadError = true;
      this.errorText = "minmax() needs two values: " + tok;
      return;
    }
    const minStr = (inner.substring(0, comma )).trim();
    const maxStr = (inner.substring((comma + 1), (inner.length) )).trim();
    const before = this.tracks.length;
    this.addTrack(maxStr);
    if ( (this.tracks.length) == before ) {
      return;
    }
    const track = this.tracks[((this.tracks.length) - 1)];
    if ( EVGGridTemplate.isFrToken(minStr) == false ) {
      track.minUnit = EVGUnit.parse(minStr);
      track.hasMin = track.minUnit.isSet;
    }
    if ( EVGGridTemplate.isFrToken(maxStr) == false ) {
      track.maxUnit = EVGUnit.parse(maxStr);
      track.hasMax = track.maxUnit.isSet;
    }
  };
  addTrack (tok) {
    const t = tok.trim();
    const __len = t.length;
    if ( __len == 0 ) {
      return;
    }
    const track = new EVGGridTrack();
    if ( t == "auto" ) {
      track.kind = 3;
      this.tracks.push(track);
      return;
    }
    if ( EVGGridTemplate.isFitContent(t) ) {
      const inner = (t.substring(12, (__len - 1) )).trim();
      const lim = EVGUnit.parse(inner);
      if ( lim.isSet == false ) {
        this.hadError = true;
        this.errorText = "Unsupported fit-content() limit: " + inner;
        return;
      }
      track.kind = 3;
      track.hasFitLimit = true;
      track.fitLimit = lim;
      this.tracks.push(track);
      return;
    }
    if ( __len > 2 ) {
      if ( (t.substring((__len - 2), __len )) == "fr" ) {
        const numStr = t.substring(0, (__len - 2) );
        const frVal = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
        if ( typeof(frVal) != "undefined" ) {
          track.kind = 2;
          track.value = frVal;
          this.tracks.push(track);
          return;
        }
      }
    }
    if ( t == "fr" ) {
      track.kind = 2;
      track.value = 1.0;
      this.tracks.push(track);
      return;
    }
    const unit = EVGUnit.parse(t);
    if ( unit.isSet == false ) {
      this.hadError = true;
      this.errorText = "Unsupported track size: " + t;
      return;
    }
    if ( unit.unitType == 1 ) {
      track.kind = 1;
      track.value = unit.value;
    } else {
      track.kind = 0;
      track.value = unit.value;
    }
    this.tracks.push(track);
  };
  hasIntrinsicTrack () {
    let i = 0;
    while (i < (this.tracks.length)) {
      const t = this.tracks[i];
      if ( t.kind == 3 ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  resolve (available) {
    let empty = [];
    let empty2 = [];
    this.resolveWithContent(available, empty, empty2);
  };
  resolveWithContent (available, content, minContent) {
    const n = this.tracks.length;
    let used = 0.0;
    let totalFr = 0.0;
    let i = 0;
    while (i < n) {
      const t = this.tracks[i];
      t.frozen = false;
      if ( t.hasMin ) {
        t.minUnit.resolve(available, 16.0);
      }
      if ( t.hasMax ) {
        t.maxUnit.resolve(available, 16.0);
      }
      if ( t.kind == 0 ) {
        t.sizePx = t.value;
        used = used + t.sizePx;
        t.frozen = true;
      }
      if ( t.kind == 1 ) {
        t.sizePx = (available * t.value) / 100.0;
        used = used + t.sizePx;
        t.frozen = true;
      }
      if ( t.kind == 2 ) {
        totalFr = totalFr + t.value;
      }
      if ( t.kind == 3 ) {
        let c = 0.0;
        if ( i < (content.length) ) {
          c = content[i];
        }
        if ( t.hasFitLimit ) {
          t.fitLimit.resolve(available, 16.0);
          if ( c > t.fitLimit.pixels ) {
            c = t.fitLimit.pixels;
          }
          if ( i < (minContent.length) ) {
            const floorPx = minContent[i];
            if ( c < floorPx ) {
              c = floorPx;
            }
          }
        }
        t.sizePx = c;
        used = used + c;
        t.frozen = true;
      }
      i = i + 1;
    };
    let poolSpace = available - used;
    if ( poolSpace < 0.0 ) {
      poolSpace = 0.0;
    }
    let poolFr = totalFr;
    let pass = 0;
    let settled = false;
    while ((pass <= n) && (settled == false)) {
      settled = true;
      let j = 0;
      while (j < n) {
        const t2 = this.tracks[j];
        if ( (t2.kind == 2) && (t2.frozen == false) ) {
          let size = 0.0;
          if ( poolFr > 0.0 ) {
            size = (poolSpace * t2.value) / poolFr;
          }
          let clamped = size;
          if ( t2.hasMin ) {
            if ( clamped < t2.minUnit.pixels ) {
              clamped = t2.minUnit.pixels;
            }
          }
          if ( t2.hasMax ) {
            if ( clamped > t2.maxUnit.pixels ) {
              clamped = t2.maxUnit.pixels;
            }
          }
          t2.sizePx = clamped;
          if ( clamped != size ) {
            t2.frozen = true;
            poolSpace = poolSpace - clamped;
            poolFr = poolFr - t2.value;
            if ( poolSpace < 0.0 ) {
              poolSpace = 0.0;
            }
            settled = false;
          }
        }
        j = j + 1;
      };
      pass = pass + 1;
    };
    let k = 0;
    while (k < n) {
      const t3 = this.tracks[k];
      if ( t3.kind != 2 ) {
        if ( t3.hasMin ) {
          if ( t3.sizePx < t3.minUnit.pixels ) {
            t3.sizePx = t3.minUnit.pixels;
          }
        }
        if ( t3.hasMax ) {
          if ( t3.sizePx > t3.maxUnit.pixels ) {
            t3.sizePx = t3.maxUnit.pixels;
          }
        }
      }
      k = k + 1;
    };
  };
  extentOf (from, span, gap) {
    let total = 0.0;
    const n = this.tracks.length;
    let i = from;
    let placed = 0;
    while ((i < n) && (placed < span)) {
      const tk = this.tracks[i];
      total = total + tk.sizePx;
      placed = placed + 1;
      i = i + 1;
    };
    if ( placed > 1 ) {
      total = total + (((placed - 1)) * gap);
    }
    return total;
  };
  offsetOf (index, gap) {
    let total = 0.0;
    let i = 0;
    while (i < index) {
      const tk = this.tracks[i];
      total = total + tk.sizePx;
      total = total + gap;
      i = i + 1;
    };
    return total;
  };
}
EVGGridTemplate.isLineNameToken = function(tok) {
  const __len = tok.length;
  if ( __len < 2 ) {
    return false;
  }
  if ( (tok.charCodeAt(0 )) != 91 ) {
    return false;
  }
  return (tok.charCodeAt((__len - 1) )) == 93;
};
EVGGridTemplate.parse = function(spec) {
  const tpl = new EVGGridTemplate();
  const tokens = EVGGridTemplate.tokenize(spec);
  let i = 0;
  while (i < (tokens.length)) {
    const tok = tokens[i];
    if ( EVGGridTemplate.isLineNameToken(tok) ) {
      tpl.addLineNames(tok);
    } else {
      if ( EVGGridTemplate.isRepeat(tok) ) {
        tpl.expandRepeat(tok);
      } else {
        if ( EVGGridTemplate.isMinmax(tok) ) {
          tpl.addMinmax(tok);
        } else {
          tpl.addTrack(tok);
        }
      }
    }
    i = i + 1;
  };
  return tpl;
};
EVGGridTemplate.tokenize = function(spec) {
  let out = [];
  const __len = spec.length;
  let depth = 0;
  let start = 0;
  let inTok = false;
  let i = 0;
  while (i < __len) {
    const c = spec.charCodeAt(i );
    if ( (c == 40) || (c == 91) ) {
      depth = depth + 1;
    }
    if ( (c == 41) || (c == 93) ) {
      depth = depth - 1;
    }
    const isSpace = ((c == 32) || (c == 9)) || ((c == 10) || (c == 13));
    if ( isSpace && (depth == 0) ) {
      if ( inTok ) {
        out.push(spec.substring(start, i ));
        inTok = false;
      }
    } else {
      if ( inTok == false ) {
        start = i;
        inTok = true;
      }
    }
    i = i + 1;
  };
  if ( inTok ) {
    out.push(spec.substring(start, __len ));
  }
  return out;
};
EVGGridTemplate.isRepeat = function(tok) {
  if ( (tok.length) < 8 ) {
    return false;
  }
  return (tok.substring(0, 7 )) == "repeat(";
};
EVGGridTemplate.isMinmax = function(tok) {
  if ( (tok.length) < 8 ) {
    return false;
  }
  return (tok.substring(0, 7 )) == "minmax(";
};
EVGGridTemplate.isFrToken = function(tok) {
  const __len = tok.length;
  if ( __len < 2 ) {
    return false;
  }
  return (tok.substring((__len - 2), __len )) == "fr";
};
EVGGridTemplate.isFitContent = function(tok) {
  if ( (tok.length) < 14 ) {
    return false;
  }
  if ( (tok.substring(0, 12 )) != "fit-content(" ) {
    return false;
  }
  return (tok.charCodeAt(((tok.length) - 1) )) == 41;
};
class EVGGridAreas  {
  constructor() {
    this.names = [];
    this.rowStart = [];
    this.colStart = [];
    this.rowSpan = [];
    this.colSpan = [];
    this.columns = 0;
    this.rows = 0;
    this.hadError = false;
    this.errorText = "";
    this.columns = 0;
    this.rows = 0;
    this.hadError = false;
    this.errorText = "";
  }
  count () {
    return this.names.length;
  };
  indexOfName (name) {
    let i = 0;
    while (i < (this.names.length)) {
      if ( (this.names[i]) == name ) {
        return i;
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  build (rowsOut) {
    this.rows = rowsOut.length;
    let cells = [];
    let r = 0;
    while (r < this.rows) {
      const toks = EVGGridTemplate.tokenize((rowsOut[r]));
      if ( r == 0 ) {
        this.columns = toks.length;
      } else {
        if ( (toks.length) != this.columns ) {
          this.hadError = true;
          this.errorText = "grid-template-areas rows must all have the same number of columns";
          return;
        }
      }
      let c = 0;
      while (c < (toks.length)) {
        cells.push(toks[c]);
        c = c + 1;
      };
      r = r + 1;
    };
    if ( this.columns == 0 ) {
      this.hadError = true;
      this.errorText = "grid-template-areas has no columns";
      return;
    }
    let rr = 0;
    while (rr < this.rows) {
      let cc = 0;
      while (cc < this.columns) {
        const name = cells[((rr * this.columns) + cc)];
        if ( name != "." ) {
          const at = this.indexOfName(name);
          if ( at < 0 ) {
            this.names.push(name);
            this.rowStart.push(rr);
            this.colStart.push(cc);
            this.rowSpan.push(1);
            this.colSpan.push(1);
          } else {
            const r0 = this.rowStart[at];
            const c0 = this.colStart[at];
            const rs = this.rowSpan[at];
            const cs = this.colSpan[at];
            if ( (rr + 1) > (r0 + rs) ) {
              this.rowSpan[at] = (rr + 1) - r0;
            }
            if ( (cc + 1) > (c0 + cs) ) {
              this.colSpan[at] = (cc + 1) - c0;
            }
          }
        }
        cc = cc + 1;
      };
      rr = rr + 1;
    };
    const n = this.names.length;
    let k = 0;
    while (k < n) {
      const nm = this.names[k];
      const r0_1 = this.rowStart[k];
      const c0_1 = this.colStart[k];
      const rs_1 = this.rowSpan[k];
      const cs_1 = this.colSpan[k];
      let a = 0;
      while (a < rs_1) {
        let b = 0;
        while (b < cs_1) {
          const idx = ((r0_1 + a) * this.columns) + (c0_1 + b);
          if ( (cells[idx]) != nm ) {
            this.hadError = true;
            this.errorText = ("Area \"" + nm) + "\" is not a rectangle in grid-template-areas";
            return;
          }
          b = b + 1;
        };
        a = a + 1;
      };
      k = k + 1;
    };
  };
}
EVGGridAreas.parse = function(spec) {
  const areas = new EVGGridAreas();
  let rowsOut = [];
  let cur = "";
  let inQuote = false;
  let quoteCh = 0;
  let i = 0;
  const __len = spec.length;
  while (i < __len) {
    const c = spec.charCodeAt(i );
    if ( inQuote ) {
      if ( c == quoteCh ) {
        rowsOut.push(cur);
        cur = "";
        inQuote = false;
      } else {
        cur = cur + (String.fromCharCode(c));
      }
    } else {
      if ( (c == 34) || (c == 39) ) {
        inQuote = true;
        quoteCh = c;
      }
    }
    i = i + 1;
  };
  if ( inQuote ) {
    areas.hadError = true;
    areas.errorText = "Unterminated row in grid-template-areas: " + spec;
    return areas;
  }
  if ( (rowsOut.length) == 0 ) {
    areas.hadError = true;
    areas.errorText = "grid-template-areas needs quoted rows: " + spec;
    return areas;
  }
  areas.build(rowsOut);
  return areas;
};
class EVGGridPlacement  {
  constructor() {
    this.start = 0;
    this.span = 1;
    this.hadError = false;
    this.errorText = "";
    this.startName = "";
    this.endName = "";
    this.endLine = 0;
    this.spanExplicit = false;
    this.start = 0;
    this.span = 1;
    this.hadError = false;
    this.errorText = "";
    this.startName = "";
    this.endName = "";
    this.endLine = 0;
    this.spanExplicit = false;
  }
  takeStart (token) {
    if ( EVGGridPlacement.isNumericToken(token) ) {
      this.start = EVGGridPlacement.lineNumber(token);
      if ( this.start == 0 ) {
        this.reject(token);
      }
    } else {
      this.startName = token;
    }
  };
  takeEnd (token) {
    if ( EVGGridPlacement.isNumericToken(token) ) {
      this.endLine = EVGGridPlacement.lineNumber(token);
      if ( this.endLine == 0 ) {
        this.reject(token);
      }
    } else {
      this.endName = token;
    }
  };
  applyEndLine () {
    if ( this.spanExplicit ) {
      return;
    }
    if ( this.start < 1 ) {
      return;
    }
    if ( this.endLine > this.start ) {
      this.span = this.endLine - this.start;
    }
  };
  resolveNames (tpl) {
    if ( (this.startName.length) > 0 ) {
      const n = tpl.lineNumberNamed(this.startName);
      if ( n > 0 ) {
        this.start = n;
        this.startName = "";
      } else {
        this.rejectName(this.startName);
      }
    }
    if ( (this.endName.length) > 0 ) {
      const e = tpl.lineNumberNamed(this.endName);
      if ( e > 0 ) {
        this.endLine = e;
        this.endName = "";
      } else {
        this.rejectName(this.endName);
      }
    }
    this.applyEndLine();
  };
  rejectName (name) {
    if ( this.hadError ) {
      return;
    }
    this.hadError = true;
    this.errorText = ("no line named \"" + name) + "\"; the item was auto-placed";
  };
  reject (token) {
    if ( this.hadError ) {
      return;
    }
    this.hadError = true;
    this.errorText = ("unsupported line \"" + token) + "\" (negative line numbers are not supported); the item was auto-placed";
  };
}
EVGGridPlacement.parse = function(spec) {
  const p = new EVGGridPlacement();
  const s = spec.trim();
  if ( (s.length) == 0 ) {
    return p;
  }
  let slash = 0 - 1;
  let i = 0;
  while (i < (s.length)) {
    if ( (s.charCodeAt(i )) == 47 ) {
      slash = i;
      i = s.length;
    } else {
      i = i + 1;
    }
  };
  if ( slash < 0 ) {
    if ( EVGGridPlacement.isSpan(s) ) {
      p.span = EVGGridPlacement.spanCount(s);
      p.spanExplicit = true;
    } else {
      p.takeStart(s);
    }
    return p;
  }
  const lhs = (s.substring(0, slash )).trim();
  const rhs = (s.substring((slash + 1), (s.length) )).trim();
  p.takeStart(lhs);
  if ( EVGGridPlacement.isSpan(rhs) ) {
    p.span = EVGGridPlacement.spanCount(rhs);
    p.spanExplicit = true;
  } else {
    p.takeEnd(rhs);
  }
  p.applyEndLine();
  return p;
};
EVGGridPlacement.isNumericToken = function(s) {
  if ( (s.length) == 0 ) {
    return false;
  }
  const c = s.charCodeAt(0 );
  if ( (c >= 48) && (c <= 57) ) {
    return true;
  }
  return (c == 45) || (c == 43);
};
EVGGridPlacement.isSpan = function(s) {
  if ( (s.length) < 4 ) {
    return false;
  }
  return (s.substring(0, 4 )) == "span";
};
EVGGridPlacement.spanCount = function(s) {
  const rest = (s.substring(4, (s.length) )).trim();
  const v = isNaN( parseFloat(rest) ) ? undefined : parseFloat(rest);
  if ( typeof(v) != "undefined" ) {
    const n = Math.floor( (v));
    if ( n >= 1 ) {
      return n;
    }
  }
  return 1;
};
EVGGridPlacement.lineNumber = function(s) {
  const v = isNaN( parseFloat(s) ) ? undefined : parseFloat(s);
  if ( typeof(v) != "undefined" ) {
    const n = Math.floor( (v));
    if ( n >= 1 ) {
      return n;
    }
  }
  return 0;
};
class EVGTextLine  {
  constructor() {
    this.text = "";
    this.width = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.text = "";
    this.width = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
  }
}
class EVGTextEngine  {
  constructor() {
    this.strict = false;
    this.reported = [];
    this.warnings = [];
    this.hadFatal = false;
    const m = new SimpleTextMeasurer();
    this.measurer = m;
    this.strict = false;
    this.hadFatal = false;
  }
  setMeasurer (m) {
    this.measurer = m;
  };
  setStrict (s) {
    this.strict = s;
  };
  warningCount () {
    return this.warnings.length;
  };
  warningAt (i) {
    return this.warnings[i];
  };
  noteFamily (fontFamily) {
    let i = 0;
    while (i < (this.reported.length)) {
      if ( (this.reported[i]) == fontFamily ) {
        return;
      }
      i = i + 1;
    };
    this.reported.push(fontFamily);
    if ( this.measurer.isFontAccurate() == false ) {
      this.warnings.push(("No font metrics available for \"" + fontFamily) + "\" - measuring with heuristic widths. Print layout will not match paint.");
      if ( this.strict ) {
        this.hadFatal = true;
      }
      return;
    }
    if ( this.measurer.hasFace(fontFamily) == false ) {
      this.warnings.push(("Font face not loaded: \"" + fontFamily) + "\" - falling back to another face. Widths will not match paint.");
      if ( this.strict ) {
        this.hadFatal = true;
      }
    }
  };
  checkFamily (fontFamily) {
    if ( this.measurer.isFontAccurate() == false ) {
      this.noteFamily(fontFamily);
      return;
    }
    if ( this.measurer.hasFace(fontFamily) == false ) {
      this.noteFamily(fontFamily);
    }
  };
  measureRun (text, fontFamily, fontSize) {
    this.checkFamily(fontFamily);
    return this.measurer.measureText(text, fontFamily, fontSize);
  };
  lineHeightFor (fontFamily, fontSize) {
    return this.measurer.getLineHeight(fontFamily, fontSize);
  };
  breakLines (text, fontFamily, fontSize, maxWidth) {
    let out = [];
    this.checkFamily(fontFamily);
    const paragraphs = text.split("\n");
    let p = 0;
    while (p < (paragraphs.length)) {
      const para = paragraphs[p];
      if ( maxWidth <= 0.0 ) {
        this.pushLine(out, para, fontFamily, fontSize);
      } else {
        const words = para.split(" ");
        let currentLine = "";
        let w = 0;
        while (w < (words.length)) {
          const word = words[w];
          let testLine = "";
          if ( (currentLine.length) == 0 ) {
            testLine = word;
          } else {
            testLine = (currentLine + " ") + word;
          }
          const testWidth = this.measurer.measureTextWidth(testLine, fontFamily, fontSize);
          if ( (testWidth > maxWidth) && ((currentLine.length) > 0) ) {
            this.pushLine(out, currentLine, fontFamily, fontSize);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
          w = w + 1;
        };
        this.pushLine(out, currentLine, fontFamily, fontSize);
      }
      p = p + 1;
    };
    if ( (out.length) == 0 ) {
      this.pushLine(out, "", fontFamily, fontSize);
    }
    return out;
  };
  pushLine (out, text, fontFamily, fontSize) {
    const m = this.measurer.measureText(text, fontFamily, fontSize);
    const line = new EVGTextLine();
    line.text = text;
    line.width = m.width;
    line.ascent = m.ascent;
    line.descent = m.descent;
    out.push(line);
  };
  lineCount (text, fontFamily, fontSize, maxWidth) {
    const lines = this.breakLines(text, fontFamily, fontSize, maxWidth);
    return lines.length;
  };
  maxLineWidth (text, fontFamily, fontSize) {
    const lines = this.breakLines(text, fontFamily, fontSize, 0.0);
    let maxW = 0.0;
    let i = 0;
    while (i < (lines.length)) {
      const ln = lines[i];
      if ( ln.width > maxW ) {
        maxW = ln.width;
      }
      i = i + 1;
    };
    return maxW;
  };
  minLineWidth (text, fontFamily, fontSize) {
    const lines = this.breakLines(text, fontFamily, fontSize, 0.001);
    let maxW = 0.0;
    let i = 0;
    while (i < (lines.length)) {
      const ln = lines[i];
      if ( ln.width > maxW ) {
        maxW = ln.width;
      }
      i = i + 1;
    };
    return maxW;
  };
  breakToStrings (text, fontFamily, fontSize, maxWidth) {
    let out = [];
    const lines = this.breakLines(text, fontFamily, fontSize, maxWidth);
    let i = 0;
    while (i < (lines.length)) {
      const ln = lines[i];
      out.push(ln.text);
      i = i + 1;
    };
    return out;
  };
}
class EVGLayout  {
  constructor() {
    this.textEngine = new EVGTextEngine();
    this.pageWidth = 612.0;
    this.pageHeight = 792.0;
    this.currentPage = 0;
    this.debug = false;
    this.warnings = [];
    const m_1 = new SimpleTextMeasurer();
    this.measurer = m_1;
    this.textEngine.setMeasurer(m_1);
    const im = new SimpleImageMeasurer();
    this.imageMeasurer = im;
  }
  setMeasurer (m) {
    this.measurer = m;
    this.textEngine.setMeasurer(m);
  };
  getTextEngine () {
    return this.textEngine;
  };
  setStrictFonts (s) {
    this.textEngine.setStrict(s);
  };
  setImageMeasurer (m) {
    this.imageMeasurer = m;
  };
  setPageSize (w, h) {
    this.pageWidth = w;
    this.pageHeight = h;
  };
  setDebug (d) {
    this.debug = d;
  };
  log (msg) {
    if ( this.debug ) {
      console.log(msg);
    }
  };
  warn (msg) {
    let i = 0;
    while (i < (this.warnings.length)) {
      if ( (this.warnings[i]) == msg ) {
        return;
      }
      i = i + 1;
    };
    this.warnings.push(msg);
    this.log("  " + msg);
  };
  warningCount () {
    return this.warnings.length;
  };
  warningAt (i) {
    return this.warnings[i];
  };
  layout (root) {
    this.log("EVGLayout: Starting layout");
    this.currentPage = 0;
    if ( root.width.isSet == false ) {
      root.width = EVGUnit.px(this.pageWidth);
    }
    if ( root.height.isSet == false ) {
      root.height = EVGUnit.px(this.pageHeight);
    }
    root.applyOwnFontSize();
    root.rootFontSize = root.inheritedFontSize;
    root.calculatedX = 0.0;
    root.calculatedY = 0.0;
    this.layoutElement(root, 0.0, 0.0, this.pageWidth, this.pageHeight);
    this.log("EVGLayout: Layout complete");
  };
  layoutElement (element, parentX, parentY, parentWidth, parentHeight) {
    element.resolveUnits(parentWidth, parentHeight);
    let width = parentWidth;
    if ( element.width.isSet ) {
      width = element.width.pixels;
    }
    if ( element.width.isSet == false ) {
      const textContent = element.textContent;
      if ( (textContent.length) > 0 ) {
        if ( element.getChildCount() == 0 ) {
          let fontSize = element.inheritedFontSize;
          if ( element.fontSize.isSet ) {
            fontSize = element.fontSize.pixels;
          }
          if ( fontSize <= 0.0 ) {
            fontSize = 14.0;
          }
          const contentW = this.textEngine.maxLineWidth(textContent, element.effectiveFontFamily(), fontSize);
          const measuredW = ((contentW + element.box.paddingLeftPx) + element.box.paddingRightPx) + (element.box.borderWidthPx * 2.0);
          if ( measuredW < parentWidth ) {
            width = measuredW;
          }
        }
      }
    }
    let height = 0.0;
    let autoHeight = true;
    if ( (element.tagName == "Page") || (element.tagName == "page") ) {
      if ( element.width.isSet == false ) {
        width = this.pageWidth;
      }
      if ( element.height.isSet == false ) {
        height = this.pageHeight;
        autoHeight = false;
      }
    }
    if ( element.height.isSet ) {
      height = element.height.pixels;
      autoHeight = false;
    }
    if ( element.height.isSet == false ) {
      if ( element.calculatedFlexHeight > 0.0 ) {
        height = element.calculatedFlexHeight;
        autoHeight = false;
      }
    }
    if ( ((element.tagName == "image") || (element.tagName == "Image")) || (element.tagName == "img") ) {
      const imgSrc = element.src;
      if ( (imgSrc.length) > 0 ) {
        const dims = this.imageMeasurer.getImageDimensions(imgSrc);
        if ( dims.isValid ) {
          element.sourceWidth = dims.width;
          element.sourceHeight = dims.height;
          if ( element.width.isSet && (element.height.isSet == false) ) {
            if ( parentHeight > 0.0 ) {
              height = parentHeight;
              this.log((("  Image container using parent height: " + ((width.toString()))) + "x") + ((height.toString())));
            } else {
              height = width / dims.aspectRatio;
              this.log((("  Image aspect ratio: " + ((dims.aspectRatio.toString()))) + " -> height=") + ((height.toString())));
            }
            autoHeight = false;
          }
          if ( (element.width.isSet == false) && element.height.isSet ) {
            if ( parentWidth > 0.0 ) {
              width = parentWidth;
              this.log((("  Image container using parent width: " + ((width.toString()))) + "x") + ((height.toString())));
            } else {
              width = height * dims.aspectRatio;
              this.log((("  Image aspect ratio: " + ((dims.aspectRatio.toString()))) + " -> width=") + ((width.toString())));
            }
          }
          if ( (element.width.isSet == false) && (element.height.isSet == false) ) {
            if ( (parentWidth > 0.0) && (parentHeight > 0.0) ) {
              width = parentWidth;
              height = parentHeight;
              this.log((("  Image filling parent: " + ((width.toString()))) + "x") + ((height.toString())));
            } else {
              width = dims.width;
              height = dims.height;
              if ( width > parentWidth ) {
                if ( parentWidth > 0.0 ) {
                  const scale = parentWidth / width;
                  width = parentWidth;
                  height = height * scale;
                }
              }
              this.log((("  Image natural size: " + ((width.toString()))) + "x") + ((height.toString())));
            }
            autoHeight = false;
          }
        }
      }
    }
    if ( element.minWidth.isSet ) {
      if ( width < element.minWidth.pixels ) {
        width = element.minWidth.pixels;
      }
    }
    if ( element.maxWidth.isSet ) {
      if ( width > element.maxWidth.pixels ) {
        width = element.maxWidth.pixels;
      }
    }
    element.calculatedWidth = width;
    element.calculatedInnerWidth = element.box.getInnerWidth(width);
    element.hasDefiniteHeight = autoHeight == false;
    if ( autoHeight == false ) {
      element.calculatedHeight = height;
      element.calculatedInnerHeight = element.box.getInnerHeight(height);
    }
    if ( element.isAbsolute ) {
      this.layoutAbsolute(element, parentWidth, parentHeight);
    }
    const childCount = element.getChildCount();
    let contentHeight = 0.0;
    if ( childCount > 0 ) {
      contentHeight = this.layoutChildren(element);
    } else {
      const textContent_1 = element.textContent;
      if ( (textContent_1.length) > 0 ) {
        let fontSize_1 = element.inheritedFontSize;
        if ( element.fontSize.isSet ) {
          fontSize_1 = element.fontSize.pixels;
        }
        if ( fontSize_1 <= 0.0 ) {
          fontSize_1 = 14.0;
        }
        let lineHeightFactor = element.lineHeight;
        if ( lineHeightFactor <= 0.0 ) {
          lineHeightFactor = 1.2;
        }
        const lineSpacing = fontSize_1 * lineHeightFactor;
        const availableWidth = (width - element.box.paddingLeftPx) - element.box.paddingRightPx;
        const lineCount = this.textEngine.lineCount(textContent_1, element.effectiveFontFamily(), fontSize_1, availableWidth);
        contentHeight = lineSpacing * (lineCount);
        const metrics = this.textEngine.measureRun(textContent_1, element.effectiveFontFamily(), fontSize_1);
        let leading = (lineSpacing - (metrics.ascent + metrics.descent)) / 2.0;
        if ( leading < 0.0 ) {
          leading = 0.0;
        }
        element.calculatedBaseline = ((element.box.paddingTopPx + element.box.borderWidthPx) + leading) + metrics.ascent;
        element.calculatedDescent = metrics.descent;
        element.hasBaseline = true;
      }
    }
    if ( autoHeight ) {
      height = ((contentHeight + element.box.paddingTopPx) + element.box.paddingBottomPx) + (element.box.borderWidthPx * 2.0);
    }
    const vChrome = element.box.getVerticalChrome();
    if ( height < vChrome ) {
      height = vChrome;
    }
    const hChrome = element.box.getHorizontalChrome();
    if ( width < hChrome ) {
      width = hChrome;
    }
    if ( element.minHeight.isSet ) {
      if ( height < element.minHeight.pixels ) {
        height = element.minHeight.pixels;
      }
    }
    if ( element.maxHeight.isSet ) {
      if ( height > element.maxHeight.pixels ) {
        height = element.maxHeight.pixels;
      }
    }
    element.calculatedHeight = height;
    element.calculatedInnerHeight = element.box.getInnerHeight(height);
    element.calculatedPage = this.currentPage;
    element.isLayoutComplete = true;
    if ( (element.hasBaseline == false) && (childCount > 0) ) {
      this.inheritBaselineFromFirstChild(element);
    }
    this.log((((((((((("  Laid out " + element.tagName) + " id=") + element.id) + " at (") + ((element.calculatedX.toString()))) + ",") + ((element.calculatedY.toString()))) + ") size=") + ((width.toString()))) + "x") + ((height.toString())));
  };
  layoutChildren (parent) {
    const childCount = parent.getChildCount();
    if ( childCount == 0 ) {
      return 0.0;
    }
    if ( parent.display == "grid" ) {
      return this.layoutGrid(parent);
    }
    const innerWidth = parent.calculatedInnerWidth;
    const innerHeight = parent.calculatedInnerHeight;
    const startX = (parent.calculatedX + parent.box.borderWidthPx) + parent.box.paddingLeftPx;
    const startY = (parent.calculatedY + parent.box.borderWidthPx) + parent.box.paddingTopPx;
    let currentX = startX;
    let currentY = startY;
    let rowHeight = 0.0;
    let rowElements = [];
    let totalHeight = 0.0;
    let lineMembers = [];
    let lineCounts = [];
    let lineHeights = [];
    let placedInFlow = 0;
    const isColumn = parent.flexDirection == "column";
    let gapPx = 0.0;
    if ( parent.gap.isSet ) {
      if ( isColumn ) {
        parent.gap.rootFontSize = parent.rootFontSize;
        parent.gap.resolve(innerHeight, parent.inheritedFontSize);
      } else {
        parent.gap.rootFontSize = parent.rootFontSize;
        parent.gap.resolve(innerWidth, parent.inheritedFontSize);
      }
      gapPx = parent.gap.pixels;
    }
    if ( isColumn == false ) {
      let fixedWidth = 0.0;
      let totalFlex = 0.0;
      let j = 0;
      while (j < childCount) {
        const c = parent.getChild(j);
        c.inheritProperties(parent);
        c.resolveUnits(innerWidth, innerHeight);
        const hasBasis = c.flexBasis.isSet;
        if ( (c.flex > 0.0) && hasBasis ) {
          totalFlex = totalFlex + c.flex;
          fixedWidth = ((fixedWidth + c.flexBasis.pixels) + c.box.marginLeftPx) + c.box.marginRightPx;
        } else {
          if ( c.width.isSet ) {
            fixedWidth = ((fixedWidth + c.width.pixels) + c.box.marginLeftPx) + c.box.marginRightPx;
          } else {
            if ( c.flex > 0.0 ) {
              totalFlex = totalFlex + c.flex;
              fixedWidth = (fixedWidth + c.box.marginLeftPx) + c.box.marginRightPx;
            } else {
              const avail = (innerWidth - c.box.marginLeftPx) - c.box.marginRightPx;
              const estW = this.estimateChildWidth(c, avail);
              fixedWidth = ((fixedWidth + estW) + c.box.marginLeftPx) + c.box.marginRightPx;
            }
          }
        }
        j = j + 1;
      };
      let totalGap = 0.0;
      if ( childCount > 1 ) {
        totalGap = ((childCount - 1)) * gapPx;
      }
      let availableForFlex = (innerWidth - fixedWidth) - totalGap;
      if ( availableForFlex < 0.0 ) {
        availableForFlex = 0.0;
      }
      if ( totalFlex > 0.0 ) {
        let frozen = [];
        let jf = 0;
        while (jf < childCount) {
          frozen.push(false);
          jf = jf + 1;
        };
        let poolSpace = availableForFlex;
        let poolFlex = totalFlex;
        let pass = 0;
        let settled = false;
        while ((pass < childCount) && (settled == false)) {
          settled = true;
          j = 0;
          while (j < childCount) {
            const c_1 = parent.getChild(j);
            let isFlexItem = false;
            if ( c_1.flex > 0.0 ) {
              if ( c_1.flexBasis.isSet || (c_1.width.isSet == false) ) {
                isFlexItem = true;
              }
            }
            if ( isFlexItem && ((frozen[j]) == false) ) {
              let basisW = 0.0;
              if ( c_1.flexBasis.isSet ) {
                basisW = c_1.flexBasis.pixels;
              }
              let sizeW = basisW;
              if ( poolFlex > 0.0 ) {
                sizeW = basisW + ((poolSpace * c_1.flex) / poolFlex);
              }
              let clampedW = sizeW;
              if ( c_1.minWidth.isSet ) {
                if ( clampedW < c_1.minWidth.pixels ) {
                  clampedW = c_1.minWidth.pixels;
                }
              }
              if ( c_1.maxWidth.isSet ) {
                if ( clampedW > c_1.maxWidth.pixels ) {
                  clampedW = c_1.maxWidth.pixels;
                }
              }
              if ( clampedW != sizeW ) {
                frozen[j] = true;
                poolSpace = (poolSpace - clampedW) + basisW;
                poolFlex = poolFlex - c_1.flex;
                if ( poolSpace < 0.0 ) {
                  poolSpace = 0.0;
                }
                settled = false;
              }
              c_1.calculatedFlexWidth = clampedW;
              c_1.width.isSet = false;
            }
            j = j + 1;
          };
          pass = pass + 1;
        };
      }
    }
    if ( isColumn && parent.hasDefiniteHeight ) {
      let fixedHeight = 0.0;
      let totalFlexC = 0.0;
      let flowCountC = 0;
      let jc = 0;
      while (jc < childCount) {
        const c_2 = parent.getChild(jc);
        c_2.inheritProperties(parent);
        c_2.resolveUnits(innerWidth, innerHeight);
        if ( c_2.isAbsolute == false ) {
          flowCountC = flowCountC + 1;
          const mAxis = c_2.box.marginTopPx + c_2.box.marginBottomPx;
          if ( c_2.height.isSet ) {
            fixedHeight = (fixedHeight + c_2.height.pixels) + mAxis;
          } else {
            if ( c_2.flex > 0.0 ) {
              totalFlexC = totalFlexC + c_2.flex;
              fixedHeight = fixedHeight + mAxis;
            } else {
              fixedHeight = fixedHeight + mAxis;
            }
          }
        }
        jc = jc + 1;
      };
      let gapTotalC = 0.0;
      if ( flowCountC > 1 ) {
        gapTotalC = ((flowCountC - 1)) * gapPx;
      }
      if ( totalFlexC > 0.0 ) {
        let availC = (innerHeight - fixedHeight) - gapTotalC;
        if ( availC < 0.0 ) {
          availC = 0.0;
        }
        let jg = 0;
        while (jg < childCount) {
          const c_3 = parent.getChild(jg);
          if ( c_3.isAbsolute == false ) {
            if ( (c_3.height.isSet == false) && (c_3.flex > 0.0) ) {
              c_3.calculatedFlexHeight = (availC * c_3.flex) / totalFlexC;
            }
          }
          jg = jg + 1;
        };
      } else {
        const contentH = fixedHeight + gapTotalC;
        const overflowH = contentH - innerHeight;
        if ( (overflowH > 0.0) && (fixedHeight > 0.0) ) {
          let weightedH = 0.0;
          let jq = 0;
          while (jq < childCount) {
            const c_4 = parent.getChild(jq);
            if ( (c_4.isAbsolute == false) && c_4.height.isSet ) {
              weightedH = weightedH + (c_4.flexShrink * c_4.height.pixels);
            }
            jq = jq + 1;
          };
          if ( weightedH > 0.0 ) {
            let js = 0;
            while (js < childCount) {
              const c_5 = parent.getChild(js);
              if ( (c_5.isAbsolute == false) && c_5.height.isSet ) {
                const cut = (overflowH * (c_5.flexShrink * c_5.height.pixels)) / weightedH;
                let finalH = c_5.height.pixels - cut;
                if ( finalH < 0.0 ) {
                  finalH = 0.0;
                }
                c_5.calculatedFlexHeight = finalH;
                c_5.height.isSet = false;
              }
              js = js + 1;
            };
          }
        }
      }
    }
    if ( isColumn == false ) {
      if ( parent.flexWrap == "nowrap" ) {
        let fixedW2 = 0.0;
        let totalFlex2 = 0.0;
        let flowCount2 = 0;
        let jr = 0;
        while (jr < childCount) {
          const c_6 = parent.getChild(jr);
          if ( c_6.isAbsolute == false ) {
            flowCount2 = flowCount2 + 1;
            if ( c_6.width.isSet ) {
              fixedW2 = ((fixedW2 + c_6.width.pixels) + c_6.box.marginLeftPx) + c_6.box.marginRightPx;
            } else {
              if ( c_6.flex > 0.0 ) {
                totalFlex2 = totalFlex2 + c_6.flex;
              }
            }
          }
          jr = jr + 1;
        };
        let gapTotal2 = 0.0;
        if ( flowCount2 > 1 ) {
          gapTotal2 = ((flowCount2 - 1)) * gapPx;
        }
        const contentW2 = fixedW2 + gapTotal2;
        const overflowW = contentW2 - innerWidth;
        if ( ((totalFlex2 == 0.0) && (overflowW > 0.0)) && (fixedW2 > 0.0) ) {
          let weightedW = 0.0;
          let jz = 0;
          while (jz < childCount) {
            const c_7 = parent.getChild(jz);
            if ( (c_7.isAbsolute == false) && c_7.width.isSet ) {
              weightedW = weightedW + (c_7.flexShrink * c_7.width.pixels);
            }
            jz = jz + 1;
          };
          if ( weightedW > 0.0 ) {
            let jw = 0;
            while (jw < childCount) {
              const c_8 = parent.getChild(jw);
              if ( (c_8.isAbsolute == false) && c_8.width.isSet ) {
                const cutW = (overflowW * (c_8.flexShrink * c_8.width.pixels)) / weightedW;
                let finalW = c_8.width.pixels - cutW;
                if ( finalW < 0.0 ) {
                  finalW = 0.0;
                }
                c_8.calculatedFlexWidth = finalW;
                c_8.width.isSet = false;
              }
              jw = jw + 1;
            };
          }
        }
      }
    }
    let i = 0;
    while (i < childCount) {
      const child = parent.getChild(i);
      child.inheritProperties(parent);
      child.resolveUnits(innerWidth, innerHeight);
      if ( child.isAbsolute ) {
        if ( (child.tagName == "layer") || (child.tagName == "Layer") ) {
          child.unitsResolved = false;
          child.resolveUnits(parent.calculatedWidth, parent.calculatedHeight);
          child.calculatedWidth = parent.calculatedWidth;
          child.calculatedHeight = parent.calculatedHeight;
          child.calculatedInnerWidth = child.box.getInnerWidth(child.calculatedWidth);
          child.calculatedInnerHeight = child.box.getInnerHeight(child.calculatedHeight);
          child.height.isSet = true;
          child.height.pixels = child.calculatedHeight;
          this.layoutAbsolute(child, parent.calculatedWidth, parent.calculatedHeight);
          child.calculatedX = child.calculatedX + parent.calculatedX;
          child.calculatedY = child.calculatedY + parent.calculatedY;
        } else {
          this.layoutAbsolute(child, innerWidth, innerHeight);
          child.calculatedX = child.calculatedX + startX;
          child.calculatedY = child.calculatedY + startY;
        }
        if ( child.getChildCount() > 0 ) {
          this.layoutChildren(child);
        }
        i = i + 1;
        continue;
      }
      const availableForChild = (innerWidth - child.box.marginLeftPx) - child.box.marginRightPx;
      let childWidth = this.estimateChildWidth(child, availableForChild);
      if ( child.width.isSet ) {
        if ( child.width.pixels >= innerWidth ) {
          childWidth = availableForChild;
        } else {
          childWidth = child.width.pixels;
        }
      } else {
        if ( child.calculatedFlexWidth > 0.0 ) {
          childWidth = child.calculatedFlexWidth;
        }
      }
      if ( isColumn == false ) {
        if ( parent.alignItems == "stretch" ) {
          if ( child.height.isSet == false ) {
            child.calculatedFlexHeight = innerHeight;
          }
        }
      }
      const childTotalWidth = (childWidth + child.box.marginLeftPx) + child.box.marginRightPx;
      if ( gapPx > 0.0 ) {
        if ( isColumn == false ) {
          if ( (rowElements.length) > 0 ) {
            currentX = currentX + gapPx;
          }
        } else {
          if ( placedInFlow > 0 ) {
            currentY = currentY + gapPx;
            totalHeight = totalHeight + gapPx;
          }
        }
      }
      if ( isColumn == false ) {
        const availableWidth = (startX + innerWidth) - currentX;
        if ( ((childTotalWidth > availableWidth) && ((rowElements.length) > 0)) && (parent.flexWrap != "nowrap") ) {
          this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
          this.recordLine(lineMembers, lineCounts, lineHeights, rowElements, rowHeight);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0.0;
          rowElements.length = 0;
        }
      }
      child.calculatedX = currentX + child.box.marginLeftPx;
      child.calculatedY = currentY + child.box.marginTopPx;
      this.layoutElement(child, child.calculatedX, child.calculatedY, childWidth, innerHeight);
      const childHeight = child.calculatedHeight;
      const childTotalHeight = (childHeight + child.box.marginTopPx) + child.box.marginBottomPx;
      const placedWidth = (child.calculatedWidth + child.box.marginLeftPx) + child.box.marginRightPx;
      if ( isColumn ) {
        currentY = currentY + childTotalHeight;
        totalHeight = totalHeight + childTotalHeight;
      } else {
        currentX = currentX + placedWidth;
        rowElements.push(child);
        if ( childTotalHeight > rowHeight ) {
          rowHeight = childTotalHeight;
        }
      }
      placedInFlow = placedInFlow + 1;
      if ( child.lineBreak ) {
        if ( isColumn == false ) {
          this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
          this.recordLine(lineMembers, lineCounts, lineHeights, rowElements, rowHeight);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0.0;
          rowElements.length = 0;
        }
      }
      i = i + 1;
    };
    if ( (isColumn == false) && ((rowElements.length) > 0) ) {
      this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
      this.recordLine(lineMembers, lineCounts, lineHeights, rowElements, rowHeight);
      totalHeight = totalHeight + rowHeight;
    }
    if ( isColumn == false ) {
      this.applyWrapReverse(parent, lineMembers, lineCounts, lineHeights, totalHeight);
      this.applyAlignContent(parent, lineMembers, lineCounts, lineHeights, totalHeight, innerHeight);
    }
    if ( isColumn ) {
      this.alignColumn(parent, totalHeight, startX, startY, innerWidth, innerHeight);
    }
    return totalHeight;
  };
  recordLine (members, counts, heights, rowElements, rowHeight) {
    const n = rowElements.length;
    if ( n == 0 ) {
      return;
    }
    let i = 0;
    while (i < n) {
      members.push(rowElements[i]);
      i = i + 1;
    };
    counts.push(n);
    heights.push(rowHeight);
  };
  applyWrapReverse (parent, members, counts, heights, contentHeight) {
    if ( parent.flexWrap != "wrap-reverse" ) {
      return;
    }
    const lineCount = counts.length;
    if ( lineCount < 2 ) {
      return;
    }
    let idx = 0;
    let offset = 0.0;
    let li = 0;
    while (li < lineCount) {
      const h = heights[li];
      const newOffset = (contentHeight - offset) - h;
      const shift = newOffset - offset;
      const n = counts[li];
      let k = 0;
      while (k < n) {
        const el = members[(idx + k)];
        if ( shift != 0.0 ) {
          el.calculatedY = el.calculatedY + shift;
          this.propagateOffsetToChildren(el, 0.0, shift);
        }
        k = k + 1;
      };
      idx = idx + n;
      offset = offset + h;
      li = li + 1;
    };
  };
  applyAlignContentStretch (parent, members, counts, heights, contentHeight, innerHeight) {
    const lineCount = counts.length;
    const free = innerHeight - contentHeight;
    if ( free <= 0.0 ) {
      return;
    }
    const extra = free / (lineCount);
    let idx = 0;
    let li = 0;
    while (li < lineCount) {
      const shift = extra * (li);
      const grown = (heights[li]) + extra;
      const n = counts[li];
      let k = 0;
      while (k < n) {
        const el = members[(idx + k)];
        if ( shift != 0.0 ) {
          el.calculatedY = el.calculatedY + shift;
          this.propagateOffsetToChildren(el, 0.0, shift);
        }
        if ( (el.height.isSet == false) && (el.isAbsolute == false) ) {
          const target = (grown - el.box.marginTopPx) - el.box.marginBottomPx;
          if ( target > el.calculatedHeight ) {
            el.calculatedHeight = target;
            el.calculatedInnerHeight = el.box.getInnerHeight(target);
            el.hasDefiniteHeight = true;
            if ( el.getChildCount() > 0 ) {
              this.layoutChildren(el);
            }
          }
        }
        k = k + 1;
      };
      idx = idx + n;
      li = li + 1;
    };
  };
  applyAlignContent (parent, members, counts, heights, contentHeight, innerHeight) {
    const lineCount = counts.length;
    if ( lineCount < 2 ) {
      return;
    }
    if ( parent.hasDefiniteHeight == false ) {
      return;
    }
    const mode = parent.alignContent;
    if ( mode == "flex-start" ) {
      return;
    }
    if ( mode == "start" ) {
      return;
    }
    if ( mode == "stretch" ) {
      this.applyAlignContentStretch(parent, members, counts, heights, contentHeight, innerHeight);
      return;
    }
    const free = innerHeight - contentHeight;
    if ( free <= 0.0 ) {
      return;
    }
    let first = 0.0;
    let between = 0.0;
    if ( (mode == "flex-end") || (mode == "end") ) {
      first = free;
    }
    if ( mode == "center" ) {
      first = free / 2.0;
    }
    if ( mode == "space-between" ) {
      between = free / ((lineCount - 1));
    }
    if ( mode == "space-around" ) {
      between = free / (lineCount);
      first = between / 2.0;
    }
    if ( mode == "space-evenly" ) {
      between = free / ((lineCount + 1));
      first = between;
    }
    let idx = 0;
    let li = 0;
    while (li < lineCount) {
      const shift = first + (between * (li));
      const n = counts[li];
      let k = 0;
      while (k < n) {
        const el = members[(idx + k)];
        if ( shift != 0.0 ) {
          el.calculatedY = el.calculatedY + shift;
          this.propagateOffsetToChildren(el, 0.0, shift);
        }
        k = k + 1;
      };
      idx = idx + n;
      li = li + 1;
    };
  };
  alignColumn (parent, contentHeight, startX, startY, innerWidth, innerHeight) {
    const childCount = parent.getChildCount();
    if ( childCount == 0 ) {
      return;
    }
    const verticalAlign = parent.justifyContent;
    let horizontalAlign = parent.alignItems;
    if ( (parent.align.length) > 0 ) {
      if ( parent.align != "left" ) {
        horizontalAlign = parent.align;
      }
    }
    let availableHeight = innerHeight;
    if ( parent.height.isSet ) {
      availableHeight = parent.calculatedInnerHeight;
    }
    let offsetY = 0.0;
    if ( verticalAlign == "center" ) {
      offsetY = (availableHeight - contentHeight) / 2.0;
    }
    if ( (verticalAlign == "flex-end") || (verticalAlign == "end") ) {
      offsetY = availableHeight - contentHeight;
    }
    let flowCount = 0;
    let fc = 0;
    while (fc < childCount) {
      const fchild = parent.getChild(fc);
      if ( fchild.isAbsolute == false ) {
        flowCount = flowCount + 1;
      }
      fc = fc + 1;
    };
    let freeSpaceY = availableHeight - contentHeight;
    if ( freeSpaceY < 0.0 ) {
      freeSpaceY = 0.0;
    }
    let distributeGapY = 0.0;
    let distributeFirstY = 0.0;
    if ( verticalAlign == "space-between" ) {
      if ( flowCount > 1 ) {
        distributeGapY = freeSpaceY / ((flowCount - 1));
      }
    }
    if ( verticalAlign == "space-around" ) {
      if ( flowCount > 0 ) {
        distributeGapY = freeSpaceY / (flowCount);
        distributeFirstY = distributeGapY / 2.0;
      }
    }
    if ( verticalAlign == "space-evenly" ) {
      distributeGapY = freeSpaceY / ((flowCount + 1));
      distributeFirstY = distributeGapY;
    }
    const usesDistributeY = (distributeGapY > 0.0) || (distributeFirstY > 0.0);
    let i = 0;
    let flowIndex = 0;
    while (i < childCount) {
      const child = parent.getChild(i);
      if ( child.isAbsolute == false ) {
        let elemOffsetY = offsetY;
        if ( usesDistributeY ) {
          elemOffsetY = distributeFirstY + (distributeGapY * (flowIndex));
        }
        if ( elemOffsetY != 0.0 ) {
          child.calculatedY = child.calculatedY + elemOffsetY;
          this.propagateOffsetToChildren(child, 0.0, elemOffsetY);
        }
        flowIndex = flowIndex + 1;
        const childTotalWidth = (child.calculatedWidth + child.box.marginLeftPx) + child.box.marginRightPx;
        let offsetX = 0.0;
        if ( horizontalAlign == "center" ) {
          offsetX = (innerWidth - childTotalWidth) / 2.0;
        }
        if ( (horizontalAlign == "flex-end") || (horizontalAlign == "end") ) {
          offsetX = innerWidth - childTotalWidth;
        }
        if ( offsetX != 0.0 ) {
          child.calculatedX = child.calculatedX + offsetX;
          this.propagateOffsetToChildren(child, offsetX, 0.0);
        }
      }
      i = i + 1;
    };
  };
  inheritBaselineFromFirstChild (element) {
    let i = 0;
    const n = element.getChildCount();
    while (i < n) {
      const c = element.getChild(i);
      if ( c.isAbsolute == false ) {
        if ( c.hasBaseline ) {
          element.calculatedBaseline = (c.calculatedY - element.calculatedY) + c.calculatedBaseline;
          element.calculatedDescent = c.calculatedDescent;
          element.hasBaseline = true;
          return;
        }
      }
      i = i + 1;
    };
  };
  baselineOffsetOf (el) {
    if ( el.hasBaseline ) {
      return el.box.marginTopPx + el.calculatedBaseline;
    }
    return (el.box.marginTopPx + el.calculatedHeight) + el.box.marginBottomPx;
  };
  alignRow (rowElements, parent, rowHeight, startX, innerWidth) {
    const elementCount = rowElements.length;
    if ( elementCount == 0 ) {
      return;
    }
    let rowWidth = 0.0;
    let i = 0;
    while (i < elementCount) {
      const el = rowElements[i];
      rowWidth = ((rowWidth + el.calculatedWidth) + el.box.marginLeftPx) + el.box.marginRightPx;
      i = i + 1;
    };
    const isColumn = parent.flexDirection == "column";
    const mainAxisAlign = parent.justifyContent;
    const crossAxisAlign = parent.alignItems;
    let horizontalAlign = mainAxisAlign;
    if ( isColumn ) {
      horizontalAlign = crossAxisAlign;
    }
    if ( (parent.align.length) > 0 ) {
      if ( parent.align != "left" ) {
        horizontalAlign = parent.align;
      }
    }
    let offsetX = 0.0;
    if ( horizontalAlign == "center" ) {
      offsetX = (innerWidth - rowWidth) / 2.0;
    }
    if ( (horizontalAlign == "flex-end") || (horizontalAlign == "right") ) {
      offsetX = innerWidth - rowWidth;
    }
    let freeSpace = innerWidth - rowWidth;
    if ( freeSpace < 0.0 ) {
      freeSpace = 0.0;
    }
    let distributeGap = 0.0;
    let distributeFirst = 0.0;
    if ( horizontalAlign == "space-between" ) {
      if ( elementCount > 1 ) {
        distributeGap = freeSpace / ((elementCount - 1));
      }
    }
    if ( horizontalAlign == "space-around" ) {
      distributeGap = freeSpace / (elementCount);
      distributeFirst = distributeGap / 2.0;
    }
    if ( horizontalAlign == "space-evenly" ) {
      distributeGap = freeSpace / ((elementCount + 1));
      distributeFirst = distributeGap;
    }
    const usesDistribute = (distributeGap > 0.0) || (distributeFirst > 0.0);
    let verticalAlignVal = crossAxisAlign;
    if ( isColumn ) {
      verticalAlignVal = mainAxisAlign;
    }
    if ( (parent.verticalAlign.length) > 0 ) {
      if ( parent.verticalAlign != "top" ) {
        verticalAlignVal = parent.verticalAlign;
      }
    }
    let effectiveRowHeight = rowHeight;
    if ( parent.height.isSet ) {
      const parentInnerHeight = parent.calculatedInnerHeight;
      if ( parentInnerHeight > rowHeight ) {
        effectiveRowHeight = parentInnerHeight;
      }
    }
    const useBaseline = verticalAlignVal == "baseline";
    let maxBaseline = 0.0;
    if ( useBaseline ) {
      let b = 0;
      while (b < elementCount) {
        const bel = rowElements[b];
        const bo = this.baselineOffsetOf(bel);
        if ( bo > maxBaseline ) {
          maxBaseline = bo;
        }
        b = b + 1;
      };
    }
    i = 0;
    while (i < elementCount) {
      const el_1 = rowElements[i];
      let elemOffsetX = offsetX;
      if ( usesDistribute ) {
        elemOffsetX = distributeFirst + (distributeGap * (i));
      }
      if ( elemOffsetX != 0.0 ) {
        el_1.calculatedX = el_1.calculatedX + elemOffsetX;
        this.propagateOffsetToChildren(el_1, elemOffsetX, 0.0);
      }
      const childTotalHeight = (el_1.calculatedHeight + el_1.box.marginTopPx) + el_1.box.marginBottomPx;
      let offsetY = 0.0;
      if ( verticalAlignVal == "center" ) {
        offsetY = (effectiveRowHeight - childTotalHeight) / 2.0;
      }
      if ( (verticalAlignVal == "flex-end") || (verticalAlignVal == "bottom") ) {
        offsetY = effectiveRowHeight - childTotalHeight;
      }
      if ( useBaseline ) {
        offsetY = maxBaseline - this.baselineOffsetOf(el_1);
      }
      if ( offsetY != 0.0 ) {
        el_1.calculatedY = el_1.calculatedY + offsetY;
        this.propagateOffsetToChildren(el_1, 0.0, offsetY);
      }
      i = i + 1;
    };
  };
  propagateOffsetToChildren (parent, offsetX, offsetY) {
    const childCount = parent.getChildCount();
    let i = 0;
    while (i < childCount) {
      const child = parent.getChild(i);
      if ( offsetX != 0.0 ) {
        child.calculatedX = child.calculatedX + offsetX;
      }
      if ( offsetY != 0.0 ) {
        child.calculatedY = child.calculatedY + offsetY;
      }
      this.propagateOffsetToChildren(child, offsetX, offsetY);
      i = i + 1;
    };
  };
  layoutAbsolute (element, parentWidth, parentHeight) {
    if ( element.left.isSet ) {
      element.calculatedX = element.left.pixels + element.box.marginLeftPx;
    } else {
      if ( element.x.isSet ) {
        element.calculatedX = element.x.pixels + element.box.marginLeftPx;
      } else {
        if ( element.right.isSet ) {
          let width = element.calculatedWidth;
          if ( width == 0.0 ) {
            if ( element.width.isSet ) {
              width = element.width.pixels;
            }
          }
          element.calculatedX = ((parentWidth - element.right.pixels) - width) - element.box.marginRightPx;
        }
      }
    }
    if ( element.top.isSet ) {
      element.calculatedY = element.top.pixels + element.box.marginTopPx;
    } else {
      if ( element.y.isSet ) {
        element.calculatedY = element.y.pixels + element.box.marginTopPx;
      } else {
        if ( element.bottom.isSet ) {
          let height = element.calculatedHeight;
          if ( height == 0.0 ) {
            if ( element.height.isSet ) {
              height = element.height.pixels;
            }
          }
          element.calculatedY = ((parentHeight - element.bottom.pixels) - height) - element.box.marginBottomPx;
        }
      }
    }
  };
  printLayout (element, indent) {
    let indentStr = "";
    let i = 0;
    while (i < indent) {
      indentStr = indentStr + "  ";
      i = i + 1;
    };
    console.log(((((((((((indentStr + element.tagName) + " id=\"") + element.id) + "\" (") + ((element.calculatedX.toString()))) + ", ") + ((element.calculatedY.toString()))) + ") ") + ((element.calculatedWidth.toString()))) + "x") + ((element.calculatedHeight.toString())));
    const childCount = element.getChildCount();
    i = 0;
    while (i < childCount) {
      const child = element.getChild(i);
      this.printLayout(child, indent + 1);
      i = i + 1;
    };
  };
  intrinsicWidthOf (el) {
    return this.intrinsicWidth(el, false);
  };
  minIntrinsicWidthOf (el) {
    return this.intrinsicWidth(el, true);
  };
  intrinsicWidth (el, wantMin) {
    let outer = 0.0;
    if ( el.width.isSet ) {
      outer = el.width.pixels;
    } else {
      const textContent = el.textContent;
      if ( (textContent.length) > 0 ) {
        if ( el.getChildCount() == 0 ) {
          let fs = el.inheritedFontSize;
          if ( el.fontSize.isSet ) {
            fs = el.fontSize.pixels;
          }
          if ( fs <= 0.0 ) {
            fs = 14.0;
          }
          let contentW = 0.0;
          if ( wantMin ) {
            contentW = this.textEngine.minLineWidth(textContent, el.effectiveFontFamily(), fs);
          } else {
            contentW = this.textEngine.maxLineWidth(textContent, el.effectiveFontFamily(), fs);
          }
          outer = contentW + el.box.getHorizontalChrome();
        }
      }
    }
    if ( outer <= 0.0 ) {
      return 0.0;
    }
    return (outer + el.box.marginLeftPx) + el.box.marginRightPx;
  };
  layoutGrid (parent) {
    const innerWidth = parent.calculatedInnerWidth;
    const innerHeight = parent.calculatedInnerHeight;
    const startX = (parent.calculatedX + parent.box.borderWidthPx) + parent.box.paddingLeftPx;
    const startY = (parent.calculatedY + parent.box.borderWidthPx) + parent.box.paddingTopPx;
    let colGapPx = 0.0;
    let rowGapPx = 0.0;
    if ( parent.gap.isSet ) {
      parent.gap.rootFontSize = parent.rootFontSize;
      parent.gap.resolve(innerWidth, parent.inheritedFontSize);
      colGapPx = parent.gap.pixels;
      rowGapPx = parent.gap.pixels;
    }
    if ( parent.columnGap.isSet ) {
      parent.columnGap.rootFontSize = parent.rootFontSize;
      parent.columnGap.resolve(innerWidth, parent.inheritedFontSize);
      colGapPx = parent.columnGap.pixels;
    }
    if ( parent.rowGap.isSet ) {
      parent.rowGap.rootFontSize = parent.rootFontSize;
      parent.rowGap.resolve(innerHeight, parent.inheritedFontSize);
      rowGapPx = parent.rowGap.pixels;
    }
    let colSpec = parent.gridTemplateColumns;
    if ( (colSpec.length) == 0 ) {
      colSpec = "1fr";
    }
    let usingSubgrid = false;
    if ( colSpec == "subgrid" ) {
      if ( (parent.subgridColumnSizes.length) > 0 ) {
        usingSubgrid = true;
        let sgSpec = "";
        let sg = 0;
        while (sg < (parent.subgridColumnSizes.length)) {
          if ( sg > 0 ) {
            sgSpec = sgSpec + " ";
          }
          sgSpec = (sgSpec + (((parent.subgridColumnSizes[sg]).toString()))) + "px";
          sg = sg + 1;
        };
        colSpec = sgSpec;
      } else {
        if ( parent.subgridPending == false ) {
          this.warn("grid-template-columns: subgrid has no enclosing grid to inherit tracks from; falling back to 1fr");
        }
        colSpec = "1fr";
      }
    }
    const areas = EVGGridAreas.parse(parent.gridTemplateAreas);
    let hasAreas = false;
    if ( (parent.gridTemplateAreas.length) > 0 ) {
      if ( areas.hadError ) {
        this.warn("grid-template-areas: " + areas.errorText);
      } else {
        hasAreas = true;
        if ( (parent.gridTemplateColumns.length) == 0 ) {
          let derived = "";
          let dc = 0;
          while (dc < areas.columns) {
            if ( dc > 0 ) {
              derived = derived + " ";
            }
            derived = derived + "1fr";
            dc = dc + 1;
          };
          colSpec = derived;
        }
      }
    }
    const cols = EVGGridTemplate.parse(colSpec);
    if ( cols.hadError ) {
      this.warn("grid-template-columns: " + cols.errorText);
    }
    const colCount = (cols).count();
    if ( colCount < 1 ) {
      return 0.0;
    }
    const colGapTotal = ((colCount - 1)) * colGapPx;
    let rowTemplateSpec = parent.gridTemplateRows;
    if ( rowTemplateSpec == "subgrid" ) {
      rowTemplateSpec = "";
    }
    const rowTemplate = EVGGridTemplate.parse(rowTemplateSpec);
    let items = [];
    let colStarts = [];
    let colSpans = [];
    let rowStarts = [];
    let rowSpans = [];
    let i = 0;
    const childCount = parent.getChildCount();
    while (i < childCount) {
      const c = parent.getChild(i);
      c.inheritProperties(parent);
      c.resolveUnits(innerWidth, innerHeight);
      if ( (c.gridTemplateColumns == "subgrid") || (c.gridTemplateRows == "subgrid") ) {
        c.subgridPending = true;
      }
      if ( c.isAbsolute == false ) {
        const cp = EVGGridPlacement.parse(c.gridColumn);
        cp.resolveNames(cols);
        if ( cp.hadError ) {
          this.warn("grid-column: " + cp.errorText);
        }
        const rp = EVGGridPlacement.parse(c.gridRow);
        rp.resolveNames(rowTemplate);
        if ( rp.hadError ) {
          this.warn("grid-row: " + rp.errorText);
        }
        if ( hasAreas ) {
          if ( (c.gridArea.length) > 0 ) {
            const at = areas.indexOfName(c.gridArea);
            if ( at >= 0 ) {
              cp.start = (areas.colStart[at]) + 1;
              cp.span = areas.colSpan[at];
              rp.start = (areas.rowStart[at]) + 1;
              rp.span = areas.rowSpan[at];
            } else {
              this.warn(("grid-area: no area named \"" + c.gridArea) + "\" in grid-template-areas");
            }
          }
        }
        let cspan = cp.span;
        if ( cspan > colCount ) {
          cspan = colCount;
        }
        items.push(c);
        colStarts.push(cp.start);
        colSpans.push(cspan);
        rowStarts.push(rp.start);
        rowSpans.push(rp.span);
      }
      i = i + 1;
    };
    const itemCount = items.length;
    if ( itemCount == 0 ) {
      return 0.0;
    }
    const isDense = (parent.gridAutoFlow.indexOf("dense")) >= 0;
    let occupied = [];
    let rowsUsed = 0;
    let placedRow = [];
    let placedCol = [];
    let cursorRow = 0;
    let cursorCol = 0;
    let k = 0;
    while (k < itemCount) {
      const wantCol = colStarts[k];
      const wantRow = rowStarts[k];
      const span = colSpans[k];
      const rspan = rowSpans[k];
      let col = 0;
      let row = 0;
      if ( wantCol > 0 ) {
        col = wantCol - 1;
        if ( col > (colCount - span) ) {
          col = colCount - span;
        }
        if ( col < 0 ) {
          col = 0;
        }
      }
      if ( wantRow > 0 ) {
        row = wantRow - 1;
      }
      if ( (wantCol > 0) && (wantRow > 0) ) {
      } else {
        if ( wantRow > 0 ) {
          cursorRow = row;
          cursorCol = 0;
        }
        if ( wantCol > 0 ) {
          row = cursorRow;
          while (this.gridOccupied(occupied, colCount, row, col, span, rspan)) {
            row = row + 1;
          };
        } else {
          if ( isDense ) {
            row = 0;
            col = 0;
          } else {
            row = cursorRow;
            col = cursorCol;
          }
          let searching = true;
          while (searching) {
            if ( (col + span) > colCount ) {
              row = row + 1;
              col = 0;
            } else {
              if ( this.gridOccupied(occupied, colCount, row, col, span, rspan) ) {
                col = col + 1;
              } else {
                searching = false;
              }
            }
          };
          if ( isDense == false ) {
            cursorRow = row;
            cursorCol = col + span;
          }
        }
      }
      const needRows = row + rspan;
      while (rowsUsed < needRows) {
        let g = 0;
        while (g < colCount) {
          occupied.push(false);
          g = g + 1;
        };
        rowsUsed = rowsUsed + 1;
      };
      let rr = 0;
      while (rr < rspan) {
        let cc = 0;
        while (cc < span) {
          const idx = (((row + rr) * colCount) + col) + cc;
          occupied[idx] = true;
          cc = cc + 1;
        };
        rr = rr + 1;
      };
      placedRow.push(row);
      placedCol.push(col);
      k = k + 1;
    };
    let colContent = [];
    let colMinContent = [];
    let ci = 0;
    while (ci < colCount) {
      colContent.push(0.0);
      colMinContent.push(0.0);
      ci = ci + 1;
    };
    if ( cols.hasIntrinsicTrack() ) {
      let ic = 0;
      while (ic < (items.length)) {
        if ( (colSpans[ic]) == 1 ) {
          const col2 = placedCol[ic];
          if ( col2 < colCount ) {
            const it = items[ic];
            const w2 = this.intrinsicWidthOf(it);
            if ( w2 > (colContent[col2]) ) {
              colContent[col2] = w2;
            }
            const m2 = this.minIntrinsicWidthOf(it);
            if ( m2 > (colMinContent[col2]) ) {
              colMinContent[col2] = m2;
            }
          }
        }
        ic = ic + 1;
      };
    }
    cols.resolveWithContent(innerWidth - colGapTotal, colContent, colMinContent);
    let rowSpec = parent.gridTemplateRows;
    let rowSizes = [];
    let rowGapTotal = 0.0;
    if ( rowsUsed > 1 ) {
      rowGapTotal = ((rowsUsed - 1)) * rowGapPx;
    }
    let usingRowSubgrid = false;
    if ( rowSpec == "subgrid" ) {
      if ( (parent.subgridRowSizes.length) > 0 ) {
        usingRowSubgrid = true;
        let sgrSpec = "";
        let sgr = 0;
        while (sgr < (parent.subgridRowSizes.length)) {
          if ( sgr > 0 ) {
            sgrSpec = sgrSpec + " ";
          }
          sgrSpec = (sgrSpec + (((parent.subgridRowSizes[sgr]).toString()))) + "px";
          sgr = sgr + 1;
        };
        rowSpec = sgrSpec;
      } else {
        if ( parent.subgridPending == false ) {
          this.warn("grid-template-rows: subgrid has no enclosing grid to inherit tracks from; falling back to content-sized rows");
        }
        rowSpec = "";
      }
    }
    let haveTemplateRows = false;
    if ( (rowSpec.length) > 0 ) {
      if ( parent.hasDefiniteHeight || usingRowSubgrid ) {
        haveTemplateRows = true;
      }
    }
    if ( haveTemplateRows ) {
      const rows = EVGGridTemplate.parse(rowSpec);
      if ( rows.hadError ) {
        this.warn("grid-template-rows: " + rows.errorText);
      }
      rows.resolve(innerHeight - rowGapTotal);
      let r2 = 0;
      while (r2 < rowsUsed) {
        if ( r2 < (rows).count() ) {
          const tk = rows.trackAt(r2);
          rowSizes.push(tk.sizePx);
        } else {
          if ( (rows).count() > 0 ) {
            const lastTk = rows.trackAt(((rows).count() - 1));
            rowSizes.push(lastTk.sizePx);
          } else {
            rowSizes.push(0.0);
          }
        }
        r2 = r2 + 1;
      };
    } else {
      let r3 = 0;
      while (r3 < rowsUsed) {
        rowSizes.push(0.0);
        r3 = r3 + 1;
      };
      let m = 0;
      while (m < itemCount) {
        const it_1 = items[m];
        const rspanM = rowSpans[m];
        const ri = placedRow[m];
        const isRowSubgrid = it_1.gridTemplateRows == "subgrid";
        if ( (rspanM == 1) || isRowSubgrid ) {
          const cw = cols.extentOf((placedCol[m]), (colSpans[m]), colGapPx);
          const avail = (cw - it_1.box.marginLeftPx) - it_1.box.marginRightPx;
          it_1.calculatedFlexHeight = 0.0;
          this.layoutElement(it_1, 0.0, 0.0, avail, 0.0);
          if ( isRowSubgrid ) {
            let sub = 0;
            while (sub < rspanM) {
              if ( sub < (it_1.computedRowSizes.length) ) {
                const sh = it_1.computedRowSizes[sub];
                if ( sh > (rowSizes[(ri + sub)]) ) {
                  rowSizes[ri + sub] = sh;
                }
              }
              sub = sub + 1;
            };
          } else {
            const h = (it_1.calculatedHeight + it_1.box.marginTopPx) + it_1.box.marginBottomPx;
            if ( h > (rowSizes[ri]) ) {
              rowSizes[ri] = h;
            }
          }
        }
        m = m + 1;
      };
      if ( (rowSpec.length) > 0 ) {
        const declared = EVGGridTemplate.parse(rowSpec);
        if ( declared.hadError ) {
          this.warn("grid-template-rows: " + declared.errorText);
        }
        let dr = 0;
        while (dr < rowsUsed) {
          if ( dr < (declared).count() ) {
            const dt = declared.trackAt(dr);
            if ( dt.kind == 0 ) {
              rowSizes[dr] = dt.value;
            }
          }
          dr = dr + 1;
        };
      }
    }
    let p = 0;
    while (p < itemCount) {
      const el = items[p];
      const cIdx = placedCol[p];
      const rIdx = placedRow[p];
      const cSpan = colSpans[p];
      const rSpan = rowSpans[p];
      const cellW = cols.extentOf(cIdx, cSpan, colGapPx);
      const cellH = this.gridRowExtent(rowSizes, rIdx, rSpan, rowGapPx);
      const offX = cols.offsetOf(cIdx, colGapPx);
      const offY = this.gridRowOffset(rowSizes, rIdx, rowGapPx);
      el.calculatedX = (startX + offX) + el.box.marginLeftPx;
      el.calculatedY = (startY + offY) + el.box.marginTopPx;
      let boxW = (cellW - el.box.marginLeftPx) - el.box.marginRightPx;
      let boxH = (cellH - el.box.marginTopPx) - el.box.marginBottomPx;
      if ( boxW < 0.0 ) {
        boxW = 0.0;
      }
      if ( boxH < 0.0 ) {
        boxH = 0.0;
      }
      if ( boxH > 0.0 ) {
        el.calculatedFlexHeight = boxH;
      }
      if ( el.gridTemplateColumns == "subgrid" ) {
        el.subgridColumnSizes.length = 0;
        let sgi = 0;
        while (sgi < cSpan) {
          const tk_1 = cols.trackAt((cIdx + sgi));
          el.subgridColumnSizes.push(tk_1.sizePx);
          sgi = sgi + 1;
        };
      }
      if ( el.gridTemplateRows == "subgrid" ) {
        el.subgridRowSizes.length = 0;
        let sgj = 0;
        while (sgj < rSpan) {
          const rIdx2 = rIdx + sgj;
          if ( rIdx2 < (rowSizes.length) ) {
            el.subgridRowSizes.push(rowSizes[rIdx2]);
          }
          sgj = sgj + 1;
        };
      }
      el.unitsResolved = false;
      el.resolveUnits(boxW, boxH);
      this.layoutElement(el, el.calculatedX, el.calculatedY, boxW, boxH);
      p = p + 1;
    };
    parent.computedRowSizes.length = 0;
    let cr = 0;
    while (cr < rowsUsed) {
      parent.computedRowSizes.push(rowSizes[cr]);
      cr = cr + 1;
    };
    let total = 0.0;
    let s = 0;
    while (s < rowsUsed) {
      total = total + (rowSizes[s]);
      s = s + 1;
    };
    total = total + rowGapTotal;
    return total;
  };
  gridOccupied (occupied, colCount, row, col, span, rspan) {
    const total = occupied.length;
    let rr = 0;
    while (rr < rspan) {
      let cc = 0;
      while (cc < span) {
        const idx = (((row + rr) * colCount) + col) + cc;
        if ( idx < total ) {
          if ( occupied[idx] ) {
            return true;
          }
        }
        cc = cc + 1;
      };
      rr = rr + 1;
    };
    return false;
  };
  gridRowExtent (rowSizes, from, span, gap) {
    let total = 0.0;
    const n = rowSizes.length;
    let i = from;
    let placed = 0;
    while ((i < n) && (placed < span)) {
      total = total + (rowSizes[i]);
      placed = placed + 1;
      i = i + 1;
    };
    if ( placed > 1 ) {
      total = total + (((placed - 1)) * gap);
    }
    return total;
  };
  gridRowOffset (rowSizes, index, gap) {
    let total = 0.0;
    let i = 0;
    while (i < index) {
      total = total + (rowSizes[i]);
      total = total + gap;
      i = i + 1;
    };
    return total;
  };
  estimateChildWidth (child, maxInnerWidth) {
    if ( child.width.isSet ) {
      return child.width.pixels;
    }
    if ( child.calculatedFlexWidth > 0.0 ) {
      return child.calculatedFlexWidth;
    }
    const textContent = child.textContent;
    if ( (textContent.length) > 0 ) {
      if ( child.getChildCount() == 0 ) {
        let fontSize = child.inheritedFontSize;
        if ( child.fontSize.isSet ) {
          fontSize = child.fontSize.pixels;
        }
        if ( fontSize <= 0.0 ) {
          fontSize = 14.0;
        }
        const contentW = this.textEngine.maxLineWidth(textContent, child.effectiveFontFamily(), fontSize);
        const measuredW = ((contentW + child.box.paddingLeftPx) + child.box.paddingRightPx) + (child.box.borderWidthPx * 2.0);
        if ( measuredW < maxInnerWidth ) {
          return measuredW;
        }
      }
    }
    return maxInnerWidth;
  };
}
class EVGDrawCmd  {
  constructor() {
    this.kind = 0;
    this.x = 0.0;
    this.y = 0.0;
    this.w = 0.0;
    this.h = 0.0;
    this.radius = 0.0;
    this.thickness = 0.0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 1.0;
    this.text = "";
    this.fontFamily = "";
    this.fontSize = 0.0;
    this.src = "";
  }
  kindName () {
    if ( this.kind == 0 ) {
      return "RECT";
    }
    if ( this.kind == 1 ) {
      return "BORDER";
    }
    if ( this.kind == 2 ) {
      return "IMAGE";
    }
    if ( this.kind == 3 ) {
      return "TEXT";
    }
    if ( this.kind == 4 ) {
      return "PUSH_CLIP";
    }
    return "POP_CLIP";
  };
}
class EVGDisplayList  {
  constructor() {
    this.cmds = [];
    this.textEngine = new EVGTextEngine();
  }
  setTextEngine (e) {
    this.textEngine = e;
  };
  count () {
    return this.cmds.length;
  };
  at (i) {
    return this.cmds[i];
  };
  build (root) {
    this.cmds.length = 0;
    this.walk(root);
  };
  walk (el) {
    const x = el.calculatedX;
    const y = el.calculatedY;
    const w = el.calculatedWidth;
    const h = el.calculatedHeight;
    const radius = el.box.borderRadiusPx;
    if ( typeof(el.backgroundColor) != "undefined" ) {
      const bg = el.backgroundColor;
      if ( bg.isSet ) {
        const c = new EVGDrawCmd();
        c.kind = 0;
        c.x = x;
        c.y = y;
        c.w = w;
        c.h = h;
        c.radius = radius;
        c.r = bg.red();
        c.g = bg.green();
        c.b = bg.blue();
        c.a = bg.alpha();
        this.cmds.push(c);
      }
    }
    if ( el.box.borderWidthPx > 0.0 ) {
      if ( typeof(el.borderColor) != "undefined" ) {
        const bc = el.borderColor;
        if ( bc.isSet ) {
          const c2 = new EVGDrawCmd();
          c2.kind = 1;
          c2.x = x;
          c2.y = y;
          c2.w = w;
          c2.h = h;
          c2.radius = radius;
          c2.thickness = el.box.borderWidthPx;
          c2.r = bc.red();
          c2.g = bc.green();
          c2.b = bc.blue();
          c2.a = bc.alpha();
          this.cmds.push(c2);
        }
      }
    }
    if ( (el.src.length) > 0 ) {
      const c3 = new EVGDrawCmd();
      c3.kind = 2;
      c3.x = x;
      c3.y = y;
      c3.w = w;
      c3.h = h;
      c3.radius = radius;
      c3.src = el.src;
      this.cmds.push(c3);
    }
    if ( (el.textContent.length) > 0 ) {
      const face = el.effectiveFontFamily();
      let fs = el.inheritedFontSize;
      if ( el.fontSize.isSet ) {
        fs = el.fontSize.pixels;
      }
      if ( fs <= 0.0 ) {
        fs = 14.0;
      }
      let lh = el.lineHeight;
      if ( lh <= 0.0 ) {
        lh = 1.2;
      }
      const avail = el.box.getInnerWidth(w);
      const lines = this.textEngine.breakToStrings(el.textContent, face, fs, avail);
      let tr = 0;
      let tg = 0;
      let tb = 0;
      let ta = 1.0;
      if ( typeof(el.color) != "undefined" ) {
        const tc = el.color;
        tr = tc.red();
        tg = tc.green();
        tb = tc.blue();
        ta = tc.alpha();
      }
      let li = 0;
      while (li < (lines.length)) {
        const c4 = new EVGDrawCmd();
        c4.kind = 3;
        c4.x = x + el.box.paddingLeftPx;
        c4.y = (y + el.box.paddingTopPx) + ((li) * (fs * lh));
        c4.w = avail;
        c4.h = fs * lh;
        c4.text = lines[li];
        c4.fontFamily = face;
        c4.fontSize = fs;
        c4.r = tr;
        c4.g = tg;
        c4.b = tb;
        c4.a = ta;
        this.cmds.push(c4);
        li = li + 1;
      };
    }
    const clips = el.overflow == "hidden";
    if ( clips ) {
      const cp = new EVGDrawCmd();
      cp.kind = 4;
      cp.x = x;
      cp.y = y;
      cp.w = w;
      cp.h = h;
      this.cmds.push(cp);
    }
    let i = 0;
    while (i < el.getChildCount()) {
      const kid = el.getChild(i);
      this.walk(kid);
      i = i + 1;
    };
    if ( clips ) {
      const pp = new EVGDrawCmd();
      pp.kind = 5;
      this.cmds.push(pp);
    }
  };
  toJson () {
    let out = "{\"cmds\":[";
    let i = 0;
    while (i < (this.cmds.length)) {
      const c = this.cmds[i];
      if ( i > 0 ) {
        out = out + ",";
      }
      out = (out + "{\"k\":") + ((c.kind.toString()));
      out = (out + ",\"x\":") + EVGDisplayList.num(c.x);
      out = (out + ",\"y\":") + EVGDisplayList.num(c.y);
      out = (out + ",\"w\":") + EVGDisplayList.num(c.w);
      out = (out + ",\"h\":") + EVGDisplayList.num(c.h);
      if ( c.radius > 0.0 ) {
        out = (out + ",\"r\":") + EVGDisplayList.num(c.radius);
      }
      if ( c.thickness > 0.0 ) {
        out = (out + ",\"t\":") + EVGDisplayList.num(c.thickness);
      }
      out = (((out + ",\"c\":[") + ((c.r.toString()))) + ",") + ((c.g.toString()));
      out = ((((out + ",") + ((c.b.toString()))) + ",") + EVGDisplayList.num(c.a)) + "]";
      if ( (c.text.length) > 0 ) {
        out = (out + ",\"text\":") + EVGDisplayList.jsonString(c.text);
        out = (out + ",\"font\":") + EVGDisplayList.jsonString(c.fontFamily);
        out = (out + ",\"size\":") + EVGDisplayList.num(c.fontSize);
      }
      if ( (c.src.length) > 0 ) {
        out = (out + ",\"src\":") + EVGDisplayList.jsonString(c.src);
      }
      out = out + "}";
      i = i + 1;
    };
    out = out + "]}";
    return out;
  };
  summary () {
    let rects = 0;
    let borders = 0;
    let images = 0;
    let texts = 0;
    let clips = 0;
    let i = 0;
    while (i < (this.cmds.length)) {
      const c = this.cmds[i];
      if ( c.kind == 0 ) {
        rects = rects + 1;
      }
      if ( c.kind == 1 ) {
        borders = borders + 1;
      }
      if ( c.kind == 2 ) {
        images = images + 1;
      }
      if ( c.kind == 3 ) {
        texts = texts + 1;
      }
      if ( c.kind == 4 ) {
        clips = clips + 1;
      }
      i = i + 1;
    };
    let s = "rects=" + ((rects.toString()));
    s = (s + " borders=") + ((borders.toString()));
    s = (s + " images=") + ((images.toString()));
    s = (s + " text=") + ((texts.toString()));
    s = (s + " clips=") + ((clips.toString()));
    return s;
  };
}
EVGDisplayList.num = function(v) {
  let scaled = Math.floor( ((v * 100.0) + 0.5));
  if ( v < 0.0 ) {
    scaled = Math.floor( ((v * 100.0) - 0.5));
  }
  const whole = Math.floor( (scaled / 100));
  let frac = scaled - (whole * 100);
  if ( frac < 0 ) {
    frac = 0 - frac;
  }
  let fs = (frac.toString());
  if ( frac < 10 ) {
    fs = "0" + fs;
  }
  return (((whole.toString())) + ".") + fs;
};
EVGDisplayList.jsonString = function(v) {
  let out = "\"";
  let i = 0;
  while (i < (v.length)) {
    const c = v.charCodeAt(i );
    if ( c == 34 ) {
      out = out + "\\\"";
    } else {
      if ( c == 92 ) {
        out = out + "\\\\";
      } else {
        if ( c < 32 ) {
          out = out + " ";
        } else {
          out = out + (String.fromCharCode(c));
        }
      }
    }
    i = i + 1;
  };
  return out + "\"";
};
class EVGDisplayListTool  {
  constructor() {
    this.inputFile = "";
    this.outputFile = "";
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.fontsOverride = "";
  }
  run () {
    const sl = new EVGStyleLoader();
    this.styles = sl;
    const argCount = (process.argv.length - 2);
    if ( argCount < 2 ) {
      console.log("Usage: evg-displaylist input.tsx output.json [-css file] [-theme name] [-w N] [-h N] [-fonts dir]");
      return;
    }
    this.inputFile = process.argv[ 2 + 0];
    this.outputFile = process.argv[ 2 + 1];
    let i = 2;
    while (i < argCount) {
      const arg = process.argv[ 2 + i];
      if ( arg == "-css" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.styles.addFile(process.argv[ 2 + i]);
        }
      }
      if ( arg == "-theme" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.styles.setTheme(process.argv[ 2 + i]);
        }
      }
      if ( arg == "-fonts" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.fontsOverride = process.argv[ 2 + i];
        }
      }
      if ( arg == "-w" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const wv = isNaN( parseFloat((process.argv[ 2 + i])) ) ? undefined : parseFloat((process.argv[ 2 + i]));
          if ( typeof(wv) != "undefined" ) {
            this.pageWidth = wv;
          }
        }
      }
      if ( arg == "-h" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const hv = isNaN( parseFloat((process.argv[ 2 + i])) ) ? undefined : parseFloat((process.argv[ 2 + i]));
          if ( typeof(hv) != "undefined" ) {
            this.pageHeight = hv;
          }
        }
      }
      i = i + 1;
    };
    let lastSlash = 0 - 1;
    let si = 0;
    while (si < (this.inputFile.length)) {
      if ( (this.inputFile.charCodeAt(si )) == 47 ) {
        lastSlash = si;
      }
      si = si + 1;
    };
    let inputDir = "./";
    let inputName = this.inputFile;
    if ( lastSlash >= 0 ) {
      inputDir = this.inputFile.substring(0, (lastSlash + 1) );
      inputName = this.inputFile.substring((lastSlash + 1), (this.inputFile.length) );
    }
    const fontSetup = new EVGFontSetup();
    fontSetup.init(inputDir, this.fontsOverride);
    const conv = new JSXToEVG();
    conv.pageWidth = this.pageWidth;
    conv.pageHeight = this.pageHeight;
    const root = conv.parseFile(inputDir, inputName);
    if ( root.tagName == "" ) {
      console.log("Error: no JSX content found");
      return;
    }
    const usedTheme = this.styles.applyTo(root);
    if ( this.styles.hasFiles() ) {
      this.styles.report(usedTheme);
    }
    const lay = new EVGLayout();
    lay.setMeasurer(new TTFTextMeasurer(fontSetup.getManager()));
    lay.setPageSize(this.pageWidth, this.pageHeight);
    lay.layout(root);
    let li = 0;
    while (li < lay.warningCount()) {
      console.log("Layout warning: " + lay.warningAt(li));
      li = li + 1;
    };
    const dl = new EVGDisplayList();
    dl.setTextEngine(lay.getTextEngine());
    dl.build(root);
    let json = "{\"width\":";
    json = json + EVGDisplayList.num(this.pageWidth);
    json = (json + ",\"height\":") + EVGDisplayList.num(this.pageHeight);
    json = ((json + ",\"list\":") + dl.toJson()) + "}";
    let oLast = 0 - 1;
    let oi = 0;
    while (oi < (this.outputFile.length)) {
      if ( (this.outputFile.charCodeAt(oi )) == 47 ) {
        oLast = oi;
      }
      oi = oi + 1;
    };
    let outDir = "./";
    let outName = this.outputFile;
    if ( oLast >= 0 ) {
      outDir = this.outputFile.substring(0, (oLast + 1) );
      outName = this.outputFile.substring((oLast + 1), (this.outputFile.length) );
    }
    const buf = (function(s){ var b = new ArrayBuffer(s.length); var v = new Uint8Array(b); for(var i=0;i<s.length;i++)v[i]=s.charCodeAt(i); b._view = new DataView(b); return b; })(Utf8.encode(json));
    require('fs').writeFileSync(outDir + '/' + outName, Buffer.from(buf));
    console.log((dl.summary() + "  -> ") + this.outputFile);
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const tool = new EVGDisplayListTool();
  tool.run();
}
__js_main();
