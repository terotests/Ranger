#!/usr/bin/env node
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
          cur = cur * 36 + this.base36Value(ch);
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
    const pairCount = total / 2.0;
    let loP = 0;
    let hiP = Math.floor(pairCount) - 1;
    while (loP <= hiP) {
      const midD = (loP + hiP) / 2.0;
      const midP = Math.floor(midD);
      const lo = table[(midP * 2)];
      const hi = table[(midP * 2 + 1)];
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
    if ( ch.length == 0 ) {
      return ch;
    }
    const chCode = ch.charCodeAt(0 );
    let isTerminator = false;
    if ( (ch == "\n" || ch == "\r") || ch == "\r\n" ) {
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
    if ( first.length == 0 ) {
      return -1;
    }
    const hi = this.charStringCodePoint(first);
    if ( hi >= 55296 ) {
      if ( hi <= 56319 ) {
        if ( idx + 1 < this.__len ) {
          const second = this.source[(idx + 1)];
          if ( second.length > 0 ) {
            const lo = this.charStringCodePoint(second);
            if ( lo >= 56320 ) {
              if ( lo <= 57343 ) {
                return ((hi - 55296) * 1024 + (lo - 56320)) + 65536;
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
    if ( first.length == 0 ) {
      return 1;
    }
    const hi = this.charStringCodePoint(first);
    if ( hi >= 55296 ) {
      if ( hi <= 56319 ) {
        if ( this.pos + 1 < this.__len ) {
          const second = this.source[(this.pos + 1)];
          if ( second.length > 0 ) {
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
    if ( ch.length == 0 ) {
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
    if ( ch.length == 0 ) {
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
    if ( ch.length == 0 ) {
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
    if ( ch.length == 0 ) {
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
    const b0 = (ch.charCodeAt(0 ) & 255);
    if ( n == 1 ) {
      return (ch.charCodeAt(0 ) & 65535);
    }
    if ( n == 2 ) {
      if ( b0 >= 192 && b0 <= 223 ) {
        const c1 = (ch.charCodeAt(1 ) & 255);
        if ( c1 >= 128 && c1 <= 191 ) {
          return (b0 & 31) * 64 + (c1 & 63);
        }
      }
      return (ch.charCodeAt(0 ) & 65535);
    }
    if ( n == 3 ) {
      if ( b0 >= 224 && b0 <= 239 ) {
        const d1 = (ch.charCodeAt(1 ) & 255);
        const d2 = (ch.charCodeAt(2 ) & 255);
        if ( d1 >= 128 && d1 <= 191 ) {
          if ( d2 >= 128 && d2 <= 191 ) {
            return ((b0 & 15) * 4096 + (d1 & 63) * 64) + (d2 & 63);
          }
        }
      }
    }
    if ( n == 4 ) {
      if ( b0 >= 240 && b0 <= 247 ) {
        const e1 = (ch.charCodeAt(1 ) & 255);
        const e2 = (ch.charCodeAt(2 ) & 255);
        const e3 = (ch.charCodeAt(3 ) & 255);
        if ( e1 >= 128 && e1 <= 191 ) {
          if ( e2 >= 128 && e2 <= 191 ) {
            if ( e3 >= 128 && e3 <= 191 ) {
              let acc = (b0 & 7) * 262144;
              acc = acc + (e1 & 63) * 4096;
              acc = acc + (e2 & 63) * 64;
              return acc + (e3 & 63);
            }
          }
        }
      }
    }
    return (ch.charCodeAt(0 ) & 65535);
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
        return this.makeToken(
          "LineComment",
          value,
          startPos,
          startLine,
          startCol
        );
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
          return this.makeToken(
            "BlockComment",
            value,
            startPos,
            startLine,
            startCol
          );
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
        const strTok = this.makeToken(
          "String",
          value,
          startPos,
          startLine,
          startCol
        );
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
                value = value + String.fromCharCode(8);
              } else {
                if ( esc == "f" ) {
                  value = value + String.fromCharCode(12);
                } else {
                  if ( esc == "v" ) {
                    value = value + String.fromCharCode(11);
                  } else {
                    if ( esc == "0" ) {
                      const afterZero = this.peek();
                      let zeroOctal = false;
                      if ( this.isDigit(afterZero) ) {
                        if ( afterZero != "8" && afterZero != "9" ) {
                          zeroOctal = true;
                        }
                      }
                      if ( zeroOctal ) {
                        sawOctalEscape = true;
                        value = value + this.readLegacyOctalEscape(esc);
                      } else {
                        value = value + String.fromCharCode(0);
                      }
                    } else {
                      if ( esc == "x" ) {
                        const h1 = this.peek();
                        const hv1 = this.hexValue(h1);
                        const h2 = this.peekAt(1);
                        const hv2 = this.hexValue(h2);
                        if ( hv1 < 0 || hv2 < 0 ) {
                          return this.makeToken(
                            "Invalid",
                            value,
                            startPos,
                            startLine,
                            startCol
                          );
                        }
                        this.advance();
                        this.advance();
                        value = value + this.codeUnitString((hv1 * 16 + hv2));
                      } else {
                        if ( esc == "u" ) {
                          const uEsc = this.readUnicodeEscapeBody();
                          if ( uEsc.length == 0 ) {
                            return this.makeToken(
                              "Invalid",
                              value,
                              startPos,
                              startLine,
                              startCol
                            );
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
                            if ( esc == "\n" || esc == "\r" ) {
                            } else {
                              if ( esc == "8" || esc == "9" ) {
                                return this.makeToken(
                                  "Invalid",
                                  value,
                                  startPos,
                                  startLine,
                                  startCol
                                );
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
  badEscapeMark () {
    return String.fromCharCode(0) + (String.fromCharCode(1) + "BADESC");
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
        const doneTok = this.makeToken(
          "Template",
          value,
          startPos,
          startLine,
          startCol
        );
        doneTok.raw = rawText;
        return doneTok;
      }
      if ( ch == "\\" ) {
        this.advance();
        const esc = this.advance();
        if ( esc == "\r" ) {
          rawText = rawText + "\\\n";
        } else {
          rawText = rawText + ("\\" + esc);
        }
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
          value = value + String.fromCharCode(8);
          handled = true;
        }
        if ( esc == "f" ) {
          value = value + String.fromCharCode(12);
          handled = true;
        }
        if ( esc == "v" ) {
          value = value + String.fromCharCode(11);
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
          if ( esc.length > 0 ) {
            const escCode = this.charStringCodePoint(esc);
            if ( escCode == 8232 || escCode == 8233 ) {
              handled = true;
            }
          }
        }
        if ( false == handled ) {
          if ( esc == "x" ) {
            const th1 = this.peek();
            const thv1 = this.hexValue(th1);
            const th2 = this.peekAt(1);
            const thv2 = this.hexValue(th2);
            if ( thv1 < 0 || thv2 < 0 ) {
              value = value + this.badEscapeMark();
              handled = true;
            } else {
              this.advance();
              this.advance();
              rawText = rawText + (th1 + th2);
              value = value + this.codeUnitString((thv1 * 16 + thv2));
              handled = true;
            }
          }
        }
        if ( false == handled ) {
          if ( esc == "u" ) {
            let tuStart = this.pos;
            const tuEsc = this.readUnicodeEscapeBody();
            while (tuStart < this.pos) {
              rawText = rawText + this.source[tuStart];
              tuStart = tuStart + 1;
            };
            if ( tuEsc.length == 0 ) {
              value = value + this.badEscapeMark();
            } else {
              value = value + tuEsc;
            }
            handled = true;
          }
        }
        if ( false == handled ) {
          if ( this.isDigit(esc) ) {
            if ( esc != "0" ) {
              value = value + this.badEscapeMark();
            } else {
              const afterZero = this.peek();
              if ( this.isDigit(afterZero) ) {
                value = value + this.badEscapeMark();
              } else {
                value = value + String.fromCharCode(0);
              }
            }
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
            while (this.pos < this.__len && braceDepth > 0) {
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
          let p1 = this.advance();
          if ( p1 == "\r" ) {
            if ( this.peek() == "\n" ) {
              this.advance();
            }
            p1 = "\n";
          }
          if ( p1 == "\r\n" ) {
            p1 = "\n";
          }
          value = value + p1;
          rawText = rawText + p1;
        }
      }
    };
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
  };
  digitVal (ch) {
    if ( ch.length == 0 ) {
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
      if ( d < 0 || d > 7 ) {
        taken = maxMore;
      } else {
        v = v * 8 + d;
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
    while (this.pos < this.__len && looping) {
      const ch = this.peek();
      if ( ch == "_" ) {
        this.advance();
      } else {
        const d = this.digitVal(ch);
        if ( d >= 0 ) {
          if ( d < radix ) {
            acc = acc * radixD + d;
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
      if ( digits.length > 0 ) {
        this.advance();
        return this.makeToken(
          "BigInt",
          (prefix + (digits + "n")),
          startPos,
          startLine,
          startCol
        );
      }
    }
    const digitsRead = this.pos > startPos + 2;
    const tail = this.peek();
    let runsOn = false;
    if ( this.isAlphaNumCh(tail) ) {
      runsOn = true;
    }
    if ( digitsRead == false || runsOn ) {
      while (this.pos < this.__len) {
        const tch = this.peek();
        if ( this.isAlphaNumCh(tch) ) {
          this.advance();
        } else {
          break;
        }
      };
      return this.makeToken(
        "Invalid",
        this.source.substring(startPos, this.pos ),
        startPos,
        startLine,
        startCol
      );
    }
    return this.makeToken(
      "Number",
      (acc.toString()),
      startPos,
      startLine,
      startCol
    );
  };
  readNumber () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    if ( this.peek() == "0" ) {
      const p1 = this.peekAt(1);
      if ( p1 == "x" || p1 == "X" ) {
        return this.readRadix(16, startPos, startLine, startCol);
      }
      if ( p1 == "b" || p1 == "B" ) {
        return this.readRadix(2, startPos, startLine, startCol);
      }
      if ( p1 == "o" || p1 == "O" ) {
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
            if ( sc == "8" || sc == "9" ) {
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
    while (this.pos < this.__len && scanning) {
      const ch = this.peek();
      if ( this.isDigit(ch) ) {
        value = value + this.advance();
      } else {
        if ( ch == "_" ) {
          this.advance();
        } else {
          if ( (ch == "." && sawDot == false) && legacyOctal == false ) {
            sawDot = true;
            value = value + this.advance();
          } else {
            if ( ch == "n" ) {
              value = value + this.advance();
              return this.makeToken(
                "BigInt",
                value,
                startPos,
                startLine,
                startCol
              );
            }
            if ( ch == "e" || ch == "E" ) {
              const afterE = this.peekAt(1);
              let expDigit = afterE;
              let signLen = 0;
              if ( afterE == "+" || afterE == "-" ) {
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
      return this.makeToken(
        "Invalid",
        this.source.substring(startPos, this.pos ),
        startPos,
        startLine,
        startCol
      );
    }
    let numText = value;
    if ( legacyOctal ) {
      if ( false == nonOctalDecimal ) {
        let oacc = 0;
        let oi = 0;
        let ook = true;
        while (oi < numText.length) {
          const od = this.digitVal(numText.substring(oi, (oi + 1) ));
          if ( od < 0 || od > 7 ) {
            ook = false;
            oi = numText.length;
          } else {
            oacc = oacc * 8 + od;
            oi = oi + 1;
          }
        };
        if ( ook ) {
          numText = (oacc.toString());
        }
      }
    }
    const numTok = this.makeToken(
      "Number",
      numText,
      startPos,
      startLine,
      startCol
    );
    numTok.legacyOctal = legacyOctal;
    if ( nonOctalDecimal ) {
      numTok.legacyOctal = true;
    }
    return numTok;
  };
  hexValue (ch) {
    if ( ch.length == 0 ) {
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
    if ( decoded.length == 0 ) {
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
        code = code * 16 + hv;
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
        code = code * 16 + hv_1;
        this.advance();
        i = i + 1;
      };
      if ( code >= 55296 && code <= 56319 ) {
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
                lowVal = lowVal * 16 + lv;
                lj = lj + 1;
              }
            };
            if ( lowOk ) {
              if ( lowVal >= 56320 && lowVal <= 57343 ) {
                let lk = 0;
                while (lk < 6) {
                  this.advance();
                  lk = lk + 1;
                };
                code = (65536 + (code - 55296) * 1024) + (lowVal - 56320);
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
        const b0 = 240 + Math.floor( (code / 262144.0));
        const b1 = 128 + (Math.floor( (code / 4096.0)) & 63);
        const b2 = 128 + (Math.floor( (code / 64.0)) & 63);
        const b3 = 128 + (code & 63);
        return String.fromCharCode(b0) + (String.fromCharCode(b1) + (String.fromCharCode(b2) + String.fromCharCode(b3)));
      }
      const rest = code - 65536;
      const restD = rest;
      const high = Math.floor((restD / 1024.0));
      const hi = 55296 + high;
      const lo = 56320 + (rest - high * 1024);
      return this.codeUnitString(hi) + this.codeUnitString(lo);
    }
    return this.codeUnitString(code);
  };
  codeUnitString (code) {
    if ( code < 128 ) {
      return String.fromCharCode(code);
    }
    if ( String.fromCharCode(8232).charCodeAt(0 ) == 8232 ) {
      return String.fromCharCode(code);
    }
    const lo6 = (code & 63);
    if ( code < 2048 ) {
      const hi5 = Math.floor( (code / 64.0));
      return String.fromCharCode((192 + hi5)) + String.fromCharCode((128 + lo6));
    }
    const mid6 = (Math.floor( (code / 64.0)) & 63);
    const hi4 = Math.floor( (code / 4096.0));
    return String.fromCharCode((224 + hi4)) + (String.fromCharCode((128 + mid6)) + String.fromCharCode((128 + lo6)));
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
          if ( esc.length == 1 ) {
            const escCode = esc.charCodeAt(0 );
            let escOk = this.isAlphaNumCh(esc);
            if ( escCode >= 55296 ) {
              if ( escCode <= 57343 ) {
                escOk = false;
              }
            }
            if ( escOk == false ) {
              return this.makeToken(
                "Invalid",
                value,
                startPos,
                startLine,
                startCol
              );
            }
          }
          if ( esc.length == 0 ) {
            if ( value.length == 0 ) {
              this.advance();
              return this.makeToken(
                "Punctuator",
                "\\",
                startPos,
                startLine,
                startCol
              );
            }
            return this.makeToken(
              this.identType(value),
              value,
              startPos,
              startLine,
              startCol
            );
          }
          sawIdEscape = true;
          value = value + esc;
        } else {
          const idTok = this.makeToken(
            this.identType(value),
            value,
            startPos,
            startLine,
            startCol
          );
          idTok.hasEscape = sawIdEscape;
          return idTok;
        }
      }
    };
    const idTokEnd = this.makeToken(
      this.identType(value),
      value,
      startPos,
      startLine,
      startCol
    );
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
        if ( this.pos + 1 < this.__len ) {
          const prevCh = this.peekAt(-1);
          const nextCh = this.peekAt(1);
          if ( prevCh.length > 0 ) {
            if ( nextCh.length > 0 ) {
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
          if ( this.prevType == "" || this.line > this.prevLine ) {
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
          return this.makeToken(
            "Punctuator",
            "===",
            startPos,
            startLine,
            startCol
          );
        }
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            "!==",
            startPos,
            startLine,
            startCol
          );
        }
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == ">" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "=>",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "==",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "!=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "<" ) {
      if ( next_1 == "<" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            "<<=",
            startPos,
            startLine,
            startCol
          );
        }
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "<=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == ">" ) {
      if ( next_1 == ">" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            ">>=",
            startPos,
            startLine,
            startCol
          );
        }
        if ( this.peekAt(2) == ">" ) {
          if ( this.peekAt(3) == "=" ) {
            this.advance();
            this.advance();
            this.advance();
            this.advance();
            return this.makeToken(
              "Punctuator",
              ">>>=",
              startPos,
              startLine,
              startCol
            );
          }
        }
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          ">=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "&" ) {
      if ( next_1 == "&" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken(
            "Punctuator",
            "&&=",
            startPos,
            startLine,
            startCol
          );
        }
        return this.makeToken(
          "Punctuator",
          "&&",
          startPos,
          startLine,
          startCol
        );
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "&=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "|" ) {
      if ( next_1 == "|" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken(
            "Punctuator",
            "||=",
            startPos,
            startLine,
            startCol
          );
        }
        return this.makeToken(
          "Punctuator",
          "||",
          startPos,
          startLine,
          startCol
        );
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "|=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "^" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "^=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "?" ) {
      if ( next_1 == "?" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken(
            "Punctuator",
            "??=",
            startPos,
            startLine,
            startCol
          );
        }
        return this.makeToken(
          "Punctuator",
          "??",
          startPos,
          startLine,
          startCol
        );
      }
      if ( next_1 == "." ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "?.",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "+" ) {
      if ( next_1 == "+" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "++",
          startPos,
          startLine,
          startCol
        );
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "+=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "-" ) {
      if ( next_1 == "-" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "--",
          startPos,
          startLine,
          startCol
        );
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "-=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "*" ) {
      if ( next_1 == "*" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            "**=",
            startPos,
            startLine,
            startCol
          );
        }
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "**",
          startPos,
          startLine,
          startCol
        );
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "*=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "/" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "/=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "%" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "%=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if ( ch == "." ) {
      if ( next_1 == "." ) {
        if ( this.peekAt(2) == "." ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            "...",
            startPos,
            startLine,
            startCol
          );
        }
      }
    }
    if ( ch.length == 0 ) {
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
    if ( this.__len > 1 ) {
      if ( this.source.substring(0, 2 ) == "#!" ) {
        let hbGo = true;
        while (hbGo && this.pos < this.__len) {
          const hbc = this.source.substring(this.pos, (this.pos + 1) );
          if ( hbc == "\n" || hbc == "\r" ) {
            hbGo = false;
          } else {
            this.pos = this.pos + 1;
            this.col = this.col + 1;
          }
        };
      }
    }
    while (true) {
      const tok = this.nextToken();
      tokens.push(tok);
      if ( (tok.tokenType != "LineComment" && tok.tokenType != "BlockComment") && tok.tokenType != "HtmlComment" ) {
        if ( tok.tokenType == "Punctuator" ) {
          if ( tok.value == "(" ) {
            let headerOpen = "e";
            if ( this.prevType == "Keyword" ) {
              if ( ((this.prevValue == "if" || this.prevValue == "while") || this.prevValue == "for") || this.prevValue == "with" ) {
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
          if ( unicodeMode && body.substring((i + 2), (i + 3) ) != "{" ) {
            if ( false == this.uModeEscapeOk(body, i, inClass) ) {
              return false;
            }
          }
          if ( body.substring((i + 2), (i + 3) ) == "{" ) {
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
              cp = cp * 16 + hv;
              digits = digits + 1;
              j = j + 1;
            };
            if ( digits > 0 ) {
              if ( cp > 1114111 ) {
                return false;
              }
            }
            if ( unicodeMode && digits == 0 ) {
              return false;
            }
            if ( body.substring(j, (j + 1) ) == "}" ) {
              skipTo = j + 1;
            }
          }
        } else {
          let isPropEsc = false;
          if ( unicodeMode ) {
            if ( esc == "p" || esc == "P" ) {
              if ( body.substring((i + 2), (i + 3) ) == "{" ) {
                isPropEsc = true;
              }
            }
          }
          if ( isPropEsc ) {
            let pj = i + 3;
            while (pj < n) {
              if ( body.substring(pj, (pj + 1) ) == "}" ) {
                break;
              }
              pj = pj + 1;
            };
            if ( body.substring(pj, (pj + 1) ) == "}" ) {
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
                if ( unicodeMode && inClass ) {
                  return false;
                }
              }
            }
            if ( unicodeMode ) {
              if ( false == this.uModeEscapeOk(body, i, inClass) ) {
                return false;
              }
              if ( inClass && this.isClassEscapeChar(esc) ) {
                if ( body.substring((i + 2), (i + 3) ) == "-" ) {
                  if ( body.substring((i + 3), (i + 4) ) != "]" ) {
                    return false;
                  }
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
          if ( unicodeMode && ch == "-" ) {
            if ( body.substring((i + 1), (i + 2) ) == "\\" ) {
              const rEsc = body.substring((i + 2), (i + 3) );
              if ( this.isClassEscapeChar(rEsc) ) {
                if ( body.substring((i - 1), i ) != "[" ) {
                  return false;
                }
              }
            }
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
              if ( after == "?=" || after == "?!" ) {
                prevWasAssertion = false;
                if ( unicodeMode ) {
                  const endP = this.regexGroupEnd(body, (i + 3));
                  if ( endP > 0 ) {
                    const afterQ = body.substring((endP + 1), (endP + 2) );
                    if ( afterQ == "*" || (afterQ == "+" || (afterQ == "?" || afterQ == "{")) ) {
                      return false;
                    }
                  }
                }
              } else {
                if ( body.substring((i + 1), (i + 2) ) != "?" ) {
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
                  if ( body.substring(bk, (bk + 1) ) == "," ) {
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
                  if ( body.substring(bk, (bk + 1) ) == "}" ) {
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
    if ( unicodeMode ) {
      if ( maxBackRef > groups ) {
        return false;
      }
    }
    return true;
  };
  isClassEscapeChar (c) {
    if ( c == "d" || (c == "D" || (c == "s" || (c == "S" || (c == "w" || (c == "W" || (c == "p" || c == "P")))))) ) {
      return true;
    }
    return false;
  };
  regexGroupEnd (body, from) {
    const n = body.length;
    let depth = 1;
    let j = from;
    let inCls = false;
    while (j < n) {
      const c = body.substring(j, (j + 1) );
      if ( c == "\\" ) {
        j = j + 2;
      } else {
        if ( inCls ) {
          if ( c == "]" ) {
            inCls = false;
          }
        } else {
          if ( c == "[" ) {
            inCls = true;
          }
          if ( c == "(" ) {
            depth = depth + 1;
          }
          if ( c == ")" ) {
            depth = depth - 1;
            if ( depth == 0 ) {
              return j;
            }
          }
        }
        j = j + 1;
      }
    };
    return -1;
  };
  uModeEscapeOk (body, i, inClass) {
    const n = body.length;
    if ( i + 1 >= n ) {
      return false;
    }
    const e = body.substring((i + 1), (i + 2) );
    const ec = e.charCodeAt(0 );
    if ( e == "f" || (e == "n" || (e == "r" || (e == "t" || (e == "v" || e == "b")))) ) {
      return true;
    }
    if ( e == "B" ) {
      if ( inClass ) {
        return false;
      }
      return true;
    }
    if ( e == "k" ) {
      if ( body.substring((i + 2), (i + 3) ) == "<" ) {
        return true;
      }
      return false;
    }
    if ( this.isClassEscapeChar(e) ) {
      return true;
    }
    if ( e == "0" ) {
      const d0 = body.substring((i + 2), (i + 3) );
      if ( this.isDigit(d0) ) {
        return false;
      }
      return true;
    }
    if ( ec >= 49 && ec <= 57 ) {
      return true;
    }
    if ( e == "c" ) {
      const cx = body.substring((i + 2), (i + 3) );
      if ( cx.length == 0 ) {
        return false;
      }
      const cxc = cx.charCodeAt(0 );
      if ( cxc >= 65 && cxc <= 90 ) {
        return true;
      }
      if ( cxc >= 97 && cxc <= 122 ) {
        return true;
      }
      return false;
    }
    if ( e == "x" ) {
      if ( i + 3 >= n ) {
        return false;
      }
      if ( this.hexValue(body.substring((i + 2), (i + 3) )) < 0 ) {
        return false;
      }
      if ( this.hexValue(body.substring((i + 3), (i + 4) )) < 0 ) {
        return false;
      }
      return true;
    }
    if ( e == "u" ) {
      if ( i + 5 >= n ) {
        return false;
      }
      let hk = 0;
      while (hk < 4) {
        if ( this.hexValue(body.substring(((i + 2) + hk), ((i + 3) + hk) )) < 0 ) {
          return false;
        }
        hk = hk + 1;
      };
      return true;
    }
    const syn = "^$\\.*+?()[]{}|/";
    if ( syn.indexOf(e) >= 0 ) {
      return true;
    }
    if ( inClass && e == "-" ) {
      return true;
    }
    return false;
  };
  stringContainsChar (haystack, ch) {
    let i = 0;
    const n = haystack.length;
    while (i < n) {
      if ( haystack.substring(i, (i + 1) ) == ch ) {
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
          if ( escCh == "\n" || escCh == "\r" ) {
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
    const bodyLen = value.length - (flags.length + 2);
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
    this.argScanned = false;     /* note: unused */
    this.usesArguments = false;     /* note: unused */
    this.strictBody = false;     /* note: unused */
    this.thisScanned = false;     /* note: unused */
    this.usesThis = false;     /* note: unused */
    this.notGlobalBuiltin = false;     /* note: unused */
    this.paramSlotScanned = false;     /* note: unused */
    this.paramSlotsSafe = false;     /* note: unused */
    this.bcScanned = false;     /* note: unused */
    this.bcProgramId = 0 - 1;     /* note: unused */
    this.numScanned = false;     /* note: unused */
    this.numValue = 0.0;     /* note: unused */
    this.numCacheId = 0 - 1;     /* note: unused */
    this.scopeHops = 0 - 1;     /* note: unused */
    this.lexScanned = false;     /* note: unused */
    this.lexDeclares = false;     /* note: unused */
    this.lexNames = [];     /* note: unused */
    this.yieldScanned = false;     /* note: unused */
    this.yieldInside = false;     /* note: unused */
    this.evalKind = 0;     /* note: unused */
    this.evalOpKind = 0;     /* note: unused */
    this.hoistScanned = false;     /* note: unused */
    this.hoistedVarNames = [];     /* note: unused */
    this.slotScanned = false;     /* note: unused */
    this.slotVarNames = [];     /* note: unused */
    this.exprId = 0 - 1;     /* note: unused */
    this.exprSlotCount = 0 - 1;     /* note: unused */
    this.transientOk = 0 - 1;     /* note: unused */
    this.callSiteOp = 0;     /* note: unused */
    this.callSiteEpoch = 0 - 1;     /* note: unused */
    this.method = false;
    this.generator = false;
    this.async = false;
    this.delegate = false;
    this.await = false;
    this.children = [];
    this.params = [];
    this.decorators = [];
    this.left = undefined;
    this.right = undefined;
    this.body = undefined;
    this.init = undefined;
    this.typeAnnotation = undefined;
    this.test = undefined;
    this.consequent = undefined;
    this.alternate = undefined;
  }
}
class TSParserSimple  {
  constructor() {
    this.tokens = [];
    this.pos = 0;
    this.currentToken = undefined;
    this.quiet = false;
    this.errorCount = 0;
    this.firstErrorText = "";
    this.firstErrorLine = -1;
    this.firstErrorCol = -1;
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
    this.pendingLabel = "";     /* note: unused */
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
    this.inForOfHead = false;     /* note: unused */
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
    this.firstErrorLine = -1;
    this.firstErrorCol = -1;
    if ( toks.length > 0 ) {
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
    if ( typeof(this.currentToken) != "undefined" ) {
      const at = this.currentToken;
      this.firstErrorLine = at.line;
      this.firstErrorCol = at.col;
    }
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
    if ( this.pos < this.tokens.length ) {
      const consumed = this.tokens[this.pos];
      this.lastTokenLine = consumed.line;
      this.lastTokenEndPos = consumed.end;
    }
    this.pos = this.pos + 1;
    if ( this.pos < this.tokens.length ) {
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
    while (this.pos < this.tokens.length) {
      const tok = this.peek();
      const tokType = tok.tokenType;
      if ( (tokType == "LineComment" || tokType == "BlockComment") || tokType == "HtmlComment" ) {
        this.pos = this.pos + 1;
        if ( this.pos < this.tokens.length ) {
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
    if ( name.length == 0 ) {
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
      while (walk >= 0 && keepWalking) {
        if ( this.scopeIsFn[walk] == 1 ) {
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
      const entryName = entry.substring(2, entry.length );
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
          if ( this.scopeIsFn[scopeIdx] == 1 ) {
            if ( depth == 1 ) {
              if ( i >= ownStart ) {
                if ( kind == "f" && entryKind == "v" ) {
                  clash = true;
                }
                if ( kind == "v" && entryKind == "f" ) {
                  clash = true;
                }
                if ( kind == "f" && entryKind == "f" ) {
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
                if ( this.scopeIsFn[scopeIdx] == 0 ) {
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
    if ( declarator.name.length > 0 ) {
      this.declareBinding(k, declarator.name);
    }
  };
  declareParam (param) {
    if ( param.name.length == 0 ) {
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
    while (i < params.length) {
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
    while (a < names.length) {
      let b = 0;
      while (b < a) {
        if ( names[a] == names[b] ) {
          this.syntaxError(("Parse error: duplicate parameter '" + names[a]) + "' in a non-simple parameter list");
        }
        b = b + 1;
      };
      a = a + 1;
    };
  };
  collectParamNames (params) {
    let out = [];
    let i = 0;
    while (i < params.length) {
      const p = params[i];
      if ( p.name.length > 0 ) {
        out.push(p.name);
      }
      const sub = this.collectPatternNames(p);
      let j = 0;
      while (j < sub.length) {
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
    while (i < node.children.length) {
      const c = node.children[i];
      let bindsOwnName = true;
      if ( c.nodeType == "Property" ) {
        if ( c.shorthand == false ) {
          bindsOwnName = false;
        }
      }
      if ( bindsOwnName ) {
        if ( c.name.length > 0 ) {
          out.push(c.name);
        }
      }
      const sub = this.collectPatternNames(c);
      let j = 0;
      while (j < sub.length) {
        out.push(sub[j]);
        j = j + 1;
      };
      i = i + 1;
    };
    return out;
  };
  recheckStrictSignature (name, params) {
    let k = 0;
    while (k < params.length) {
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
    if ( name.length > 0 ) {
      if ( this.isStrictReservedWord(name) ) {
        this.syntaxError(("Parse error: '" + name) + "' cannot name a function whose body is strict");
      }
    }
    let i = 0;
    while (i < params.length) {
      const p = params[i];
      if ( p.name.length > 0 ) {
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
    while (i < n && scanning) {
      const t = this.tokens[i];
      if ( t.tokenType == "LineComment" || t.tokenType == "BlockComment" ) {
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
    if ( (((((tt == "Identifier" || tt == "TSType") || tt == "Keyword") || tt == "TSKeyword") || tt == "Boolean") || tt == "Null") || tt == "String" ) {
      const tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  };
  expectBindingName () {
    const tt = this.peekType();
    if ( ((((tt == "Identifier" || tt == "TSType") || tt == "Keyword") || tt == "TSKeyword") || tt == "Boolean") || tt == "Null" ) {
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
  expectTypeMemberName () {
    if ( this.isMemberKeyToken() ) {
      const tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
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
      while (ti < this.tokens.length) {
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
      if ( entry.substring(0, 1 ) == "p" ) {
        if ( entry.substring(2, entry.length ) == name ) {
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
      if ( entry.substring(2, entry.length ) == name ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  checkPendingExportRefs () {
    let i = 0;
    while (i < this.pendingExportRefs.length) {
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
    if ( tokType == "String" || (tokType == "Number" || (tokType == "Template" || (tokType == "BigInt" || tokType == "Regex"))) ) {
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
      if ( afterImport == "(" || afterImport == "." ) {
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
      if ( classDecl.name.length == 0 ) {
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
    if ( (tokVal == "let" || tokVal == "const") || tokVal == "var" ) {
      const afterKind = this.peekNextValue();
      const afterKindType = this.peekNextType();
      let startsBinding = false;
      if ( (afterKindType == "Identifier" || afterKindType == "TSType") || afterKindType == "TSKeyword" ) {
        startsBinding = true;
      }
      if ( afterKindType == "Keyword" ) {
        if ( afterKind != "in" && afterKind != "instanceof" ) {
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
    let labelable = tokType_2 == "Identifier";
    if ( tokType_2 == "Keyword" ) {
      const kwLab = this.peekValue();
      if ( kwLab == "yield" && (false == this.inGenerator && false == this.strictMode) ) {
        labelable = true;
      }
      if ( kwLab == "await" && (false == this.inAsync && false == this.moduleMode) ) {
        labelable = true;
      }
    }
    if ( labelable ) {
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
    const labelTok = this.peek();
    this.advance();
    node.name = labelTok.value;
    this.expectValue(":");
    const bodyStart = this.peekValue();
    if ( (bodyStart == "let" || bodyStart == "const") || bodyStart == "class" ) {
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
      if ( cur.tokenType == "LineComment" || cur.tokenType == "BlockComment" ) {
        scanIdx = scanIdx + 1;
      } else {
        let isName = false;
        if ( cur.tokenType == "Identifier" || cur.tokenType == "TSType" ) {
          isName = true;
        }
        if ( isName == false ) {
          scanning = false;
        } else {
          let nextIdx = scanIdx + 1;
          let sawColon = false;
          while (nextIdx < tokenTotal) {
            const nxt = this.tokens[nextIdx];
            if ( nxt.tokenType == "LineComment" || nxt.tokenType == "BlockComment" ) {
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
    if ( (labelled == "for" || labelled == "while") || labelled == "do" ) {
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
    while (i < list.length) {
      if ( list[i] == value ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  listWithoutString (list, value) {
    let out = [];
    let i = 0;
    while (i < list.length) {
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
    if ( nextPos < this.tokens.length ) {
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
    if ( argOnSameLine && (v != ";" && (v != "}" && this.isAtEnd() == false)) ) {
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
    if ( node.name.length == 0 ) {
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
    if ( node.name.length == 0 ) {
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
      while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
          while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
      while (i < decl.children.length) {
        const d = decl.children[i];
        this.registerExportName(d.name);
        i = i + 1;
      };
      return;
    }
    this.registerExportName(decl.name);
  };
  registerExportName (name) {
    if ( name.length == 0 ) {
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
    if ( v == "=" ) {
      this.advance();
      node.nodeType = "TSExportAssignment";
      const assignExpr = this.parseExpr();
      node.left = assignExpr;
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "as" ) {
      this.advance();
      this.expectValue("namespace");
      const nsName = this.expect("Identifier");
      node.nodeType = "TSNamespaceExportDeclaration";
      node.name = nsName.value;
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "default" ) {
      node.nodeType = "ExportDefaultDeclaration";
      this.registerExportName("default");
      this.advance();
      const nextVal = this.peekValue();
      if ( (nextVal == "class" || nextVal == "function") || nextVal == "interface" ) {
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
      while (this.matchValue("}") == false && this.isAtEnd() == false) {
        const spec = new TSNode();
        spec.nodeType = "ExportSpecifier";
        let typeOnly = false;
        if ( this.matchValue("type") ) {
          const afterType = this.peekNextValue();
          if ( afterType != "as" && (afterType != "," && afterType != "}") ) {
            this.advance();
            typeOnly = true;
            spec.kind = "type";
          }
        }
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
        if ( typeOnly == false ) {
          this.pendingExportRefs.push(localName.value);
        }
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
    if ( (((((((v == "function" || v == "class") || v == "interface") || v == "type") || v == "var") || v == "const") || v == "let") || v == "enum") || v == "abstract" ) {
      const decl_1 = this.parseStatement();
      if ( v == "function" || v == "class" ) {
        if ( decl_1.name.length == 0 ) {
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
      for ( const ext of extendsList) {
        const wrapper = new TSNode();
        wrapper.nodeType = "TSExpressionWithTypeArguments";
        wrapper.left = ext;
        node.children.push(wrapper);
      }
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
    while (this.matchValue(">") == false && this.isAtEnd() == false) {
      if ( params.length > 0 ) {
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
      return this.parseIndexSignatureRest(
        isReadonly,
        paramTok,
        startPos,
        startLine,
        startCol
      );
    }
    if ( this.matchValue("(") ) {
      return this.parseCallSignature(startPos, startLine, startCol);
    }
    if ( this.matchValue("new") ) {
      return this.parseConstructSignature(startPos, startLine, startCol);
    }
    if ( this.matchValue("<") ) {
      return this.parseCallSignature(startPos, startLine, startCol);
    }
    const prop = new TSNode();
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.readonly = isReadonly;
    const nameTok = this.expectTypeMemberName();
    prop.name = nameTok.value;
    if ( this.matchValue("?") ) {
      prop.optional = true;
      this.advance();
    }
    if ( this.matchValue("(") ) {
      return this.parseMethodSignature(
        prop.name,
        prop.optional,
        startPos,
        startLine,
        startCol
      );
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
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if ( sig.children.length > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( sig.children.length > 0 ) {
            const lastP = sig.children[(sig.children.length - 1)];
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
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if ( sig.children.length > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( sig.children.length > 0 ) {
            const lastP = sig.children[(sig.children.length - 1)];
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
              if ( member.kind == "get" || member.kind == "set" ) {
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
    if ( decorators.length > 0 ) {
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
        if ( ((afterStatic != "(" && afterStatic != "=") && afterStatic != ";") && afterStatic != "}" ) {
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
      if ( (((((newTokVal != "public" && newTokVal != "private") && newTokVal != "protected") && newTokVal != "static") && newTokVal != "abstract") && newTokVal != "readonly") && newTokVal != "async" ) {
        keepParsing = false;
      }
      if ( newTokVal == "static" ) {
        if ( isStatic ) {
          const afterRepeat = this.peekNextValue();
          if ( ((afterRepeat != "(" && afterRepeat != "=") && afterRepeat != ";") && afterRepeat != "}" ) {
            this.syntaxError("Parse error: 'static' may appear only once on a class member");
            keepParsing = false;
          }
        }
      }
      if ( this.pos == modifierStartPos ) {
        keepParsing = false;
      }
    };
    if ( this.matchValue("constructor") && isStatic == false ) {
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
      while (this.matchValue(")") == false && this.isAtEnd() == false) {
        if ( member.params.length > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(")") ) {
            break;
          }
        }
        const param = this.parseConstructorParam();
        if ( param.name.length > 0 ) {
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
      if ( (((afterAccessorType == "Identifier" || afterAccessorType == "TSType") || afterAccessorType == "Keyword") || afterAccessorType == "String") || afterAccessorType == "Number" ) {
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
      if ( accessorKind.length > 0 ) {
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
      while (this.matchValue(")") == false && this.isAtEnd() == false) {
        if ( member.params.length > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(")") ) {
            if ( member.params.length > 0 ) {
              const lastP = member.params[(member.params.length - 1)];
              if ( lastP.nodeType == "RestElement" ) {
                this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
              }
            }
            break;
          }
        }
        const param_1 = this.parseParam();
        if ( param_1.name.length > 0 ) {
          this.declareBinding("p", param_1.name);
        }
        member.params.push(param_1);
      };
      this.expectValue(")");
      if ( accessorKind == "get" ) {
        if ( member.params.length != 0 ) {
          this.syntaxError("Parse error: a getter takes no parameters");
        }
      }
      if ( accessorKind == "set" ) {
        if ( member.params.length != 1 ) {
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
    if ( ((tokVal == "public" || tokVal == "private") || tokVal == "protected") || tokVal == "readonly" ) {
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
      while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
    if ( (this.isAtEnd() || throwArgTok.value == ";") || throwArgTok.value == "}" ) {
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
    while (i < node.children.length) {
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
      if ( ((((afterLet == "in" || afterLet == "of") || afterLet == "=") || afterLet == ";") || afterLet == ".") || afterLet == "(" ) {
        headIsDecl = false;
      }
    }
    if ( ((tokVal == "let" || tokVal == "const") || tokVal == "var") && headIsDecl ) {
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
        if ( varNameStr.length > 0 && kind == "var" ) {
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
        if ( this.matchValue(")") ) {
          if ( kind == "var" && hasPattern == false ) {
            if ( initVal.nodeType == "BinaryExpression" ) {
              if ( initVal.value == "in" ) {
                if ( this.strictMode ) {
                  this.syntaxError("Parse error: a for-in head may not have an initialiser in strict mode");
                }
                node.nodeType = "ForInStatement";
                declarator_2.init = initVal.left;
                initDecl.children.push(declarator_2);
                node.left = initDecl;
                node.right = initVal.right;
                this.expectValue(")");
                const savedBodyFlagB = this.inSingleStatementBody;
                this.inSingleStatementBody = true;
                this.atModuleTopLevel = false;
                this.iterationDepth = this.iterationDepth + 1;
                const bBody = this.parseStatement();
                this.iterationDepth = this.iterationDepth - 1;
                this.inSingleStatementBody = savedBodyFlagB;
                node.body = bBody;
                this.popScope();
                return node;
              }
            }
          }
        }
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
      while (((this.matchValue("case") == false && this.matchValue("default") == false) && this.matchValue("}") == false) && this.isAtEnd() == false) {
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
          if ( lhs.name == "eval" || lhs.name == "arguments" ) {
            this.syntaxError(("Parse error: cannot assign to '" + lhs.name) + "' in strict mode");
          }
        }
      }
      const lt = lhs.nodeType;
      if ( ((((lt != "Identifier" && lt != "MemberExpression") && lt != "ArrayPattern") && lt != "ObjectPattern") && lt != "ArrayExpression") && lt != "ObjectExpression" ) {
        this.syntaxError(("Parse error: '" + lt) + "' is not a valid destructuring target");
      }
      return lhs;
    }
    const tok = this.peek();
    const tt = this.peekType();
    if ( ((tt == "Identifier" || tt == "TSType") || tt == "Keyword") || tt == "TSKeyword" ) {
      this.checkBindableName(tok.value);
      this.advance();
      const id = new TSNode();
      id.nodeType = "Identifier";
      id.name = tok.value;
      if ( this.declaringKind.length > 0 ) {
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      if ( node.children.length > 0 ) {
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
          if ( keyType == "String" || keyType == "Number" ) {
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
            if ( keyType == "String" || keyType == "Number" ) {
              this.syntaxError("Parse error: a shorthand property name cannot be a literal");
            }
            if ( this.isAlwaysReservedWord(prop.name) ) {
              this.syntaxError(("Parse error: '" + prop.name) + "' cannot be a shorthand property name");
            }
            if ( this.declaringKind.length > 0 ) {
              this.checkBindableName(prop.name);
              this.declareBinding(this.declaringKind, prop.name);
            } else {
              if ( this.strictMode ) {
                if ( prop.name == "eval" || prop.name == "arguments" ) {
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
    while (this.matchValue("]") == false && this.isAtEnd() == false) {
      if ( node.children.length > 0 ) {
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
      for ( const tp of typeParams) {
        node.children.push(tp);
      }
    }
    const savedAsyncParams = this.inAsyncParams;
    this.inAsyncParams = node.async;
    this.expectValue("(");
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if ( node.params.length > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( node.params.length > 0 ) {
            const lastP = node.params[(node.params.length - 1)];
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
      if ( isFnExpression == false ) {
        this.declareBinding("f", node.name);
      }
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
      for ( const d of decorators) {
        pattern.decorators.push(d);
      }
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
      for ( const d_1 of decorators) {
        pattern_1.decorators.push(d_1);
      }
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
    for ( const d_2 of decorators) {
      param.decorators.push(d_2);
    }
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
    if ( this.matchValue("|") ) {
      this.advance();
    }
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
    if ( this.matchValue("&") ) {
      this.advance();
    }
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
    if ( nextPos < this.tokens.length ) {
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
    if ( tokVal == "true" || tokVal == "false" ) {
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
    while (this.matchValue(".")) {
      this.advance();
      if ( this.isNameToken() ) {
        const part = this.peek();
        this.advance();
        ref.name = (ref.name + ".") + part.value;
      } else {
        break;
      }
    };
    if ( this.matchValue("<") ) {
      this.advance();
      while (this.matchValue(">") == false && this.isAtEnd() == false) {
        if ( ref.params.length > 0 ) {
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
    while (this.matchValue("]") == false && this.isAtEnd() == false) {
      if ( tuple.children.length > 0 ) {
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
    if ( this.matchValue("...") ) {
      return this.parseFunctionType(startPos, startLine, startCol);
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
        while (depth > 0 && this.isAtEnd() == false) {
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
    const savedRest = this.sawRestParam;
    this.sawRestParam = false;
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if ( funcType.params.length > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          break;
        }
      }
      if ( this.peekValue() == "this" ) {
        const thisParam = new TSNode();
        thisParam.nodeType = "Parameter";
        const thisTok = this.peek();
        thisParam.name = "this";
        thisParam.start = thisTok.start;
        thisParam.line = thisTok.line;
        thisParam.col = thisTok.col;
        this.advance();
        if ( this.matchValue(":") ) {
          const thisType = this.parseTypeAnnotation();
          thisParam.typeAnnotation = thisType;
        }
        funcType.params.push(thisParam);
      } else {
        const param = this.parseParam();
        funcType.params.push(param);
      }
    };
    this.sawRestParam = savedRest;
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
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if ( ctorType.params.length > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( ctorType.params.length > 0 ) {
            const lastP = ctorType.params[(ctorType.params.length - 1)];
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
        while (this.matchValue(">") == false && this.isAtEnd() == false) {
          if ( importType.params.length > 0 ) {
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
    if ( this.matchValue("(") || this.matchValue("<") ) {
      return this.parseCallSignature(startPos, startLine, startCol);
    }
    if ( this.matchValue("new") ) {
      return this.parseConstructSignature(startPos, startLine, startCol);
    }
    if ( this.matchValue("[") ) {
      this.advance();
      const paramName = this.expect("Identifier");
      if ( this.matchValue("in") ) {
        return this.parseMappedType(
          isReadonly,
          readonlyModifier,
          paramName.value,
          startPos,
          startLine,
          startCol
        );
      }
      return this.parseIndexSignatureRest(
        isReadonly,
        paramName,
        startPos,
        startLine,
        startCol
      );
    }
    const nameTok = this.expectTypeMemberName();
    const memberName = nameTok.value;
    let isOptional = false;
    if ( this.matchValue("?") ) {
      isOptional = true;
      this.advance();
    }
    if ( this.matchValue("(") ) {
      return this.parseMethodSignature(
        memberName,
        isOptional,
        startPos,
        startLine,
        startCol
      );
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
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if ( method.params.length > 0 ) {
        this.expectValue(",");
        if ( this.matchValue(")") ) {
          if ( method.params.length > 0 ) {
            const lastP = method.params[(method.params.length - 1)];
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
        if ( (target.name == "eval" || target.name == "arguments") || target.name == "yield" ) {
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
      while (i < target.children.length) {
        const prop = target.children[i];
        if ( prop.method ) {
          this.syntaxError("Parse error: a method cannot be a destructuring assignment target");
          return;
        }
        if ( prop.kind == "get" || prop.kind == "set" ) {
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
        if ( target.name == "eval" || target.name == "arguments" ) {
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
    if ( ((((((((((tokVal == "+=" || tokVal == "-=") || tokVal == "*=") || tokVal == "/=") || tokVal == "%=") || tokVal == "**=") || tokVal == "&=") || tokVal == "|=") || tokVal == "^=") || tokVal == "<<=") || tokVal == ">>=") || tokVal == ">>>=" ) {
      this.checkAssignmentTarget(left);
      const leftKind = left.nodeType;
      if ( ((leftKind == "ArrayExpression" || leftKind == "ObjectExpression") || leftKind == "ArrayPattern") || leftKind == "ObjectPattern" ) {
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
    if ( (tokVal == "&&=" || tokVal == "||=") || tokVal == "??=" ) {
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
    while (((tokVal == "==" || tokVal == "!=") || tokVal == "===") || tokVal == "!==") {
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
    while ((((tokVal == "<" || tokVal == ">") || tokVal == "<=") || tokVal == ">=") && tokType == "Punctuator" || (tokVal == "instanceof" || tokVal == "in") && tokType != "String") {
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
    while (this.peekType() == "Punctuator" && (cur == "<" && nxt == "<" || cur == ">" && nxt == ">")) {
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
    while (tokVal == "+" || tokVal == "-") {
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
    while (((tokVal == "*" || tokVal == "/") || tokVal == "%") || tokVal == "**") {
      const opTok = this.peek();
      if ( opTok.value == "**" ) {
        if ( left.nodeType == "UnaryExpression" ) {
          if ( left.parenthesized == false ) {
            this.syntaxError("Parse error: an unparenthesised unary expression is not allowed as the left operand of '**'");
          }
        }
      }
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
    if ( tokIsPunct && (tokVal == "++" || tokVal == "--") ) {
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
    if ( tokIsPunct && (((tokVal == "!" || tokVal == "-") || tokVal == "+") || tokVal == "~") ) {
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
      if ( false == tokIsLiteral && ((tokVal == "typeof" || tokVal == "void") || tokVal == "delete") ) {
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
          if ( scanIdx + 1 < total ) {
            const afterParen = this.tokens[(scanIdx + 1)];
            if ( afterParen.value == "=>" ) {
              this.syntaxError("Parse error: an arrow function must be parenthesised to be a unary operand");
            }
          }
        }
      }
    }
    if ( false == tokIsLiteral && (tokVal == "void" || tokVal == "delete") ) {
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
    if ( tokVal == "typeof" && false == tokIsLiteral ) {
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
    if ( tokVal == "yield" && (this.inGenerator && this.peekType() != "String") ) {
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
    if ( tokVal == "await" && (awaitIsOperator && this.peekType() != "String") ) {
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
    if ( tokVal == "<" && this.peekType() == "Punctuator" ) {
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
      if ( (nextType == "Identifier" || nextType == "Keyword") || nextType == "TSType" ) {
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
      if ( this.looksLikeGenericCallOpener() ) {
        this.advance();
        const call = new TSNode();
        call.nodeType = "CallExpression";
        call.left = expr;
        call.start = expr.start;
        call.line = expr.line;
        call.col = expr.col;
        while (this.matchValue(">") == false && this.isAtEnd() == false) {
          if ( call.params.length > 0 ) {
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
          while (this.matchValue(")") == false && this.isAtEnd() == false) {
            if ( call.children.length > 0 ) {
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
        while (this.matchValue(")") == false && this.isAtEnd() == false) {
          if ( call_1.children.length > 0 ) {
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
          while (this.matchValue(")") == false && this.isAtEnd() == false) {
            if ( optCall.children.length > 0 ) {
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
      if ( tokVal == "++" || tokVal == "--" ) {
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
      if ( ((((((((newTokVal != "(" && newTokVal != ".") && newTokVal != "?.") && newTokVal != "[") && newTokVal != "!") && newTokVal != "as") && newTokVal != "satisfies") && newTokVal != "++") && newTokVal != "--") && newTokType != "Template" ) {
        const genericPostfix = this.looksLikeGenericCallOpener();
        if ( genericPostfix == false ) {
          keepParsing = false;
        }
      }
    };
    return expr;
  };
  parsePrimary () {
    const tokType = this.peekType();
    const tokVal = this.peekValue();
    const tok = this.peek();
    if ( ((tokType == "Identifier" || tokType == "TSType") || tokType == "Keyword") || tokType == "TSKeyword" ) {
      if ( this.peekNextValue() == "=>" ) {
        return this.parseArrowFunction();
      }
    }
    if ( tokType == "Identifier" || tokType == "TSType" ) {
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
      if ( afterHash.length > 0 ) {
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
    if ( tokVal == "true" || tokVal == "false" ) {
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
    if ( tokVal == "<" ) {
      if ( this.looksLikeGenericArrow() ) {
        return this.parseArrowFunction();
      }
    }
    if ( this.tsxMode == true && tokVal == "<" ) {
      const nextType = this.peekNextType();
      const nextVal = this.peekNextValue();
      if ( nextVal == ">" ) {
        return this.parseJSXFragment();
      }
      if ( nextType == "Identifier" || nextType == "Keyword" ) {
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
        if ( afterSuper == "." || afterSuper == "[" ) {
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
    while (this.matchValue("]") == false && this.isAtEnd() == false) {
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
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
          if ( nextType == "Identifier" || (nextVal == "[" || (nextVal == "(" || nextVal == "*")) ) {
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
              if ( scanIdx + 1 < total ) {
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
          if ( (nextType == "Identifier" || nextVal == "[") || this.isAccessorNameAhead() ) {
            this.advance();
            isGetter = true;
            prop.kind = "get";
          }
        }
        if ( currVal == "set" ) {
          if ( (nextType == "Identifier" || nextVal == "[") || this.isAccessorNameAhead() ) {
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
            if ( afterComputed != ":" && afterComputed != "(" ) {
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
          while (this.matchValue(")") == false && this.isAtEnd() == false) {
            if ( fnNode.params.length > 0 ) {
              this.expectValue(",");
              if ( this.matchValue(")") ) {
                if ( fnNode.params.length > 0 ) {
                  const lastP = fnNode.params[(fnNode.params.length - 1)];
                  if ( lastP.nodeType == "RestElement" ) {
                    this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
                  }
                }
                break;
              }
            }
            const mParam = this.parseParam();
            if ( mParam.name.length > 0 ) {
              this.declareBinding("p", mParam.name);
            }
            fnNode.params.push(mParam);
          };
          this.expectValue(")");
          if ( isGetter ) {
            if ( fnNode.params.length != 0 ) {
              this.syntaxError("Parse error: a getter takes no parameters");
            }
          }
          if ( isSetter ) {
            if ( fnNode.params.length != 1 ) {
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
          if ( isGetter == false && isSetter == false ) {
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
              if ( keyTok.tokenType == "Number" || keyTok.tokenType == "String" ) {
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
                if ( prop.kind != "get" && prop.kind != "set" ) {
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
    if ( this.pos + 1 >= this.tokens.length ) {
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
      while (depth > 0 && k < this.tokens.length) {
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
    while (parenDepth > 0 && this.isAtEnd() == false) {
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
      if ( this.ternaryConsequentDepth == 0 && this.caseTestDepth == 0 ) {
        this.parseTypeAnnotation();
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
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      for ( const tp of typeParams) {
        node.children.push(tp);
      }
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
      while (this.matchValue(")") == false && this.isAtEnd() == false) {
        if ( node.params.length > 0 ) {
          this.expectValue(",");
          if ( this.matchValue(")") ) {
            if ( node.params.length > 0 ) {
              const lastP = node.params[(node.params.length - 1)];
              if ( lastP.nodeType == "RestElement" ) {
                this.syntaxError("Parse error: a rest parameter may not be followed by a comma");
              }
            }
            break;
          }
        }
        const param = this.parseParam();
        if ( param.name.length > 0 ) {
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
      const retType = this.parseTypeAnnotation();
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
        if ( this.matchValue("[") ) {
          this.advance();
          const keyExpr = this.parseExpr();
          this.expectValue("]");
          const cMember = new TSNode();
          cMember.nodeType = "MemberExpression";
          cMember.left = callee;
          cMember.right = keyExpr;
          cMember.computed = true;
          cMember.start = callee.start;
          cMember.line = callee.line;
          cMember.col = callee.col;
          callee = cMember;
        } else {
          if ( this.peekType() == "Template" ) {
            const tQuasi = this.parseTemplateLiteral();
            const tagged = new TSNode();
            tagged.nodeType = "TaggedTemplateExpression";
            tagged.left = callee;
            tagged.right = tQuasi;
            tagged.start = callee.start;
            tagged.line = callee.line;
            tagged.col = callee.col;
            callee = tagged;
          } else {
            keepMember = false;
          }
        }
      }
    };
    node.left = callee;
    if ( this.matchValue("<") ) {
      let depth = 1;
      this.advance();
      while (depth > 0 && this.isAtEnd() == false) {
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
      while (this.matchValue(")") == false && this.isAtEnd() == false) {
        if ( node.children.length > 0 ) {
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
    if ( nextPos < this.tokens.length ) {
      const nextTok = this.tokens[nextPos];
      return nextTok.tokenType;
    }
    return "EOF";
  };
  peekAheadValue (offset) {
    const aheadPos = this.pos + offset;
    if ( aheadPos < this.tokens.length ) {
      const tok = this.tokens[aheadPos];
      return tok.value;
    }
    return "";
  };
  startsWithLowerCase (s) {
    if ( s.length == 0 ) {
      return false;
    }
    const code = s.charCodeAt(0 );
    if ( code >= 97 && code <= 122 ) {
      return true;
    }
    return false;
  };
  looksLikeGenericCallOpener () {
    if ( this.peekValue() != "<" ) {
      return false;
    }
    if ( this.peekType() != "Punctuator" ) {
      return false;
    }
    return this.looksLikeGenericCall();
  };
  looksLikeGenericCall () {
    let depth = 1;
    let offset = 1;
    const maxLookahead = 80;
    let bdepth = 0;
    let pdepth = 0;
    while (depth > 0 && offset < maxLookahead) {
      const ahead = this.peekAheadValue(offset);
      if ( ahead == "" ) {
        return false;
      }
      if ( ahead == "{" ) {
        bdepth = bdepth + 1;
      }
      if ( ahead == "}" ) {
        bdepth = bdepth - 1;
      }
      if ( ahead == "(" ) {
        pdepth = pdepth + 1;
      }
      if ( ahead == ")" ) {
        pdepth = pdepth - 1;
      }
      if ( ahead == ";" ) {
        if ( bdepth < 1 && pdepth < 1 ) {
          return false;
        }
      }
      if ( ahead == "<" ) {
        depth = depth + 1;
      }
      if ( ahead == ">" ) {
        depth = depth - 1;
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
  looksLikeGenericArrow () {
    if ( this.peekValue() != "<" ) {
      return false;
    }
    let depth = 1;
    let offset = 1;
    const maxLookahead = 80;
    let abdepth = 0;
    let apdepth = 0;
    while (depth > 0 && offset < maxLookahead) {
      const ahead = this.peekAheadValue(offset);
      if ( ahead == "" ) {
        return false;
      }
      if ( ahead == "{" ) {
        abdepth = abdepth + 1;
      }
      if ( ahead == "}" ) {
        abdepth = abdepth - 1;
      }
      if ( ahead == "(" ) {
        apdepth = apdepth + 1;
      }
      if ( ahead == ")" ) {
        apdepth = apdepth - 1;
      }
      if ( ahead == ";" ) {
        if ( abdepth < 1 && apdepth < 1 ) {
          return false;
        }
      }
      if ( ahead == "<" ) {
        depth = depth + 1;
      }
      if ( ahead == ">" ) {
        depth = depth - 1;
      }
      offset = offset + 1;
    };
    if ( depth != 0 ) {
      return false;
    }
    if ( this.peekAheadValue(offset) != "(" ) {
      return false;
    }
    let pdepth = 1;
    offset = offset + 1;
    const pmax = 160;
    while (pdepth > 0 && offset < pmax) {
      const v = this.peekAheadValue(offset);
      if ( v == "" ) {
        return false;
      }
      if ( v == "(" ) {
        pdepth = pdepth + 1;
      }
      if ( v == ")" ) {
        pdepth = pdepth - 1;
      }
      offset = offset + 1;
    };
    if ( pdepth != 0 ) {
      return false;
    }
    const next = this.peekAheadValue(offset);
    if ( next == "=>" ) {
      return true;
    }
    if ( next == ":" ) {
      let k = 1;
      while (k < 80) {
        const nv = this.peekAheadValue((offset + k));
        if ( nv == "=>" ) {
          return true;
        }
        if ( nv == "" ) {
          return false;
        }
        k = k + 1;
      };
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
          if ( (t != "EOF" && v != "<") && v != "{" ) {
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
      if ( v == ">" || v == "/" ) {
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
      if ( this.pos + 1 >= this.tokens.length ) {
        return name;
      }
      const afterTok = this.tokens[(this.pos + 1)];
      if ( afterTok.start != hyphenTok.end ) {
        return name;
      }
      if ( afterTok.tokenType != "Identifier" && afterTok.tokenType != "Keyword" ) {
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
          if ( (t != "EOF" && v != "<") && v != "{" ) {
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
class TSEmitter  {
  constructor() {
    this.output = "";
    this.indentLevel = 0;
    this.indentStr = "    ";
    this.currentFn = "";
    this.inSpritesFn = false;
    this.inInitFn = false;
    this.inUpdateFn = false;
    this.inResourcesFn = false;
    this.varTypes = {};
    this.stateVarName = "s";
    this.readEntityIds = [];
    this.readEntitySeen = {};
    this.readPlayerIndices = [];
    this.readPlayerSeen = {};
    this.inputVarName = "input";
    this.fnReturnTypes = {};
    this.fnParamTypesCsv = {};
    this.isHelperFn = {};
    this.constScalarTypes = {};
    this.constScalarValues = {};
    this.constArrayNames = {};
    this.constArrayElemType = {};
    this.interfaceFieldsCsv = {};
    this.interfaceNames = [];
    this.stateArrayFieldType = {};
    this.objectStateFieldType = {};
    this.objectStateFieldOrder = [];
    this.inferFnName = "";
    this.hoistedItemAt = {};
    this.itemAtCounter = 0;
    this.initStateLocalTypes = {};
    this.tmpCounter = 0;
    this.synthStructDone = {};
    this.moduleSingletonClass = "";
    this.moduleIdRaw = "";
    this.moduleConstDeferred = {};
    this.inModuleSingletonCtor = false;
    this.currentEmitBlock = new TSNode();
  }
  annotType (annot) {
    let node = annot;
    if ( annot.nodeType == "TSTypeAnnotation" ) {
      if ( typeof(annot.typeAnnotation) != "undefined" ) {
        node = annot.typeAnnotation;
      }
    }
    return this.typeNodeToRanger(node);
  };
  typeNodeToRanger (node) {
    const t = node.nodeType;
    if ( t == "TSNumberKeyword" ) {
      return "double";
    }
    if ( t == "TSStringKeyword" ) {
      return "string";
    }
    if ( t == "TSBooleanKeyword" ) {
      return "boolean";
    }
    if ( t == "TSArrayType" ) {
      let elem = "double";
      if ( typeof(node.left) != "undefined" ) {
        elem = this.typeNodeToRanger(node.left);
      }
      return ("[" + elem) + "]";
    }
    if ( t == "TSTypeReference" ) {
      return this.typeRefToRanger(node.name);
    }
    return "int";
  };
  typeRefToRanger (name) {
    if ( name == "int" ) {
      return "int";
    }
    if ( name == "float" ) {
      return "double";
    }
    if ( name == "double" ) {
      return "double";
    }
    if ( name == "number" ) {
      return "double";
    }
    if ( name == "i32" ) {
      return "i32";
    }
    if ( name == "u8" ) {
      return "u8";
    }
    if ( name == "u16" ) {
      return "u16";
    }
    if ( name == "u32" ) {
      return "u32";
    }
    if ( name == "f64" ) {
      return "double";
    }
    if ( name == "f32" ) {
      return "f32";
    }
    if ( name == "string" ) {
      return "string";
    }
    if ( name == "boolean" ) {
      return "boolean";
    }
    if ( name == "bool" ) {
      return "boolean";
    }
    if ( name == "EntityPose" ) {
      return "EntityPoseNative";
    }
    if ( name == "SpriteDef" ) {
      return "SpriteDefNative";
    }
    if ( name == "GameState" ) {
      return "NativeGameState";
    }
    if ( name == "UpdateProps" ) {
      return "UpdatePropsNative";
    }
    if ( name == "IntMap" ) {
      return "[string:int]";
    }
    if ( name == "EntityMap" ) {
      return "[string:EntityPoseNative]";
    }
    return name + "Native";
  };
  splitCsv (s) {
    let out = [];
    if ( s.length == 0 ) {
      return out;
    }
    let cur = "";
    let i = 0;
    while (i < s.length) {
      const ch = s.substring(i, (i + 1) );
      if ( ch == "," ) {
        out.push(cur);
        cur = "";
      } else {
        cur = cur + ch;
      }
      i = i + 1;
    };
    out.push(cur);
    return out;
  };
  joinCsv (items) {
    let out = "";
    let i = 0;
    while (i < items.length) {
      if ( i > 0 ) {
        out = out + ",";
      }
      out = out + items[i];
      i = i + 1;
    };
    return out;
  };
  helperReturnType (name) {
    const t = ( Object.prototype.hasOwnProperty.call(this.fnReturnTypes, name) ? this.fnReturnTypes[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return t;
    }
    return "int";
  };
  fnSigType (t) {
    return this.localVarType(t);
  };
  localVarType (t) {
    if ( t == "i32" ) {
      return "int";
    }
    if ( t == "u8" ) {
      return "int";
    }
    if ( t == "u16" ) {
      return "int";
    }
    if ( t == "u32" ) {
      return "int";
    }
    if ( t == "f32" ) {
      return "double";
    }
    return t;
  };
  helperParamType (name, idx) {
    const csv = ( Object.prototype.hasOwnProperty.call(this.fnParamTypesCsv, name) ? this.fnParamTypesCsv[name] : undefined );
    if ( typeof(csv) === "undefined" ) {
      return "";
    }
    const parts = this.splitCsv(csv);
    if ( idx < parts.length ) {
      return parts[idx];
    }
    return "";
  };
  isKnownHelper (name) {
    const h = ( Object.prototype.hasOwnProperty.call(this.isHelperFn, name) ? this.isHelperFn[name] : undefined );
    return (typeof(h) !== "undefined" && h != null ) ;
  };
  emit (text) {
    this.output = this.output + text;
  };
  emitLine (text) {
    const pad = this.pad();
    this.output = ((this.output + pad) + text) + "\n";
  };
  pad () {
    let result = "";
    let i = 0;
    while (i < this.indentLevel) {
      result = result + this.indentStr;
      i = i + 1;
    };
    return result;
  };
  indent () {
    this.indentLevel = this.indentLevel + 1;
  };
  dedent () {
    this.indentLevel = this.indentLevel - 1;
  };
  reset () {
    this.output = "";
    this.indentLevel = 0;
    this.currentFn = "";
    this.inSpritesFn = false;
    this.inInitFn = false;
    this.inUpdateFn = false;
    this.inResourcesFn = false;
    let fr = {};
    this.fnReturnTypes = fr;
    let fp = {};
    this.fnParamTypesCsv = fp;
    let fh = {};
    this.isHelperFn = fh;
    let cs = {};
    this.constScalarTypes = cs;
    let csv = {};
    this.constScalarValues = csv;
    let ca = {};
    this.constArrayNames = ca;
    let cae = {};
    this.constArrayElemType = cae;
    let ifc = {};
    this.interfaceFieldsCsv = ifc;
    let ifn = [];
    this.interfaceNames = ifn;
    let saf = {};
    this.stateArrayFieldType = saf;
    let osf = {};
    this.objectStateFieldType = osf;
    let oso = [];
    this.objectStateFieldOrder = oso;
    let hia = {};
    this.hoistedItemAt = hia;
    this.itemAtCounter = 0;
    let isl = {};
    this.initStateLocalTypes = isl;
    let ssd = {};
    this.synthStructDone = ssd;
    this.moduleSingletonClass = "";
    let mcd = {};
    this.moduleConstDeferred = mcd;
    this.inModuleSingletonCtor = false;
    this.tmpCounter = 0;
    this.seedBridgeStructs();
  };
  setModuleSingletonId (moduleId) {
    this.moduleIdRaw = moduleId;
  };
  isEngineGlobal (name) {
    if ( name == "bgWidth" ) {
      return true;
    }
    if ( name == "bgHeight" ) {
      return true;
    }
    if ( name == "paneIndex" ) {
      return true;
    }
    return false;
  };
  isEngineFn (name) {
    if ( name == "bgClear" ) {
      return true;
    }
    if ( name == "bgFillRect" ) {
      return true;
    }
    if ( name == "bgFillCircle" ) {
      return true;
    }
    return false;
  };
  applyModuleId () {
    if ( this.moduleIdRaw.length > 0 ) {
      const cap = this.capitalizeModuleId(this.moduleIdRaw);
      this.moduleSingletonClass = cap + "GameModule";
    }
  };
  capitalizeModuleId (id) {
    if ( id.length == 0 ) {
      return "Game";
    }
    let out = "";
    let i = 0;
    let upNext = true;
    while (i < id.length) {
      const ch = id.substring(i, (i + 1) );
      if ( ch == "_" || (ch == "-" || ch == ".") ) {
        upNext = true;
      } else {
        if ( upNext ) {
          const uc = this.upperAscii(ch);
          out = out + uc;
        } else {
          out = out + ch;
        }
        upNext = false;
      }
      i = i + 1;
    };
    if ( out.length == 0 ) {
      return "Game";
    }
    const first = out.substring(0, 1 );
    const firstUp = this.upperAscii(first);
    return firstUp + out.substring(1, out.length );
  };
  upperAscii (ch) {
    if ( ch == "a" ) {
      return "A";
    }
    if ( ch == "b" ) {
      return "B";
    }
    if ( ch == "c" ) {
      return "C";
    }
    if ( ch == "d" ) {
      return "D";
    }
    if ( ch == "e" ) {
      return "E";
    }
    if ( ch == "f" ) {
      return "F";
    }
    if ( ch == "g" ) {
      return "G";
    }
    if ( ch == "h" ) {
      return "H";
    }
    if ( ch == "i" ) {
      return "I";
    }
    if ( ch == "j" ) {
      return "J";
    }
    if ( ch == "k" ) {
      return "K";
    }
    if ( ch == "l" ) {
      return "L";
    }
    if ( ch == "m" ) {
      return "M";
    }
    if ( ch == "n" ) {
      return "N";
    }
    if ( ch == "o" ) {
      return "O";
    }
    if ( ch == "p" ) {
      return "P";
    }
    if ( ch == "q" ) {
      return "Q";
    }
    if ( ch == "r" ) {
      return "R";
    }
    if ( ch == "s" ) {
      return "S";
    }
    if ( ch == "t" ) {
      return "T";
    }
    if ( ch == "u" ) {
      return "U";
    }
    if ( ch == "v" ) {
      return "V";
    }
    if ( ch == "w" ) {
      return "W";
    }
    if ( ch == "x" ) {
      return "X";
    }
    if ( ch == "y" ) {
      return "Y";
    }
    if ( ch == "z" ) {
      return "Z";
    }
    return ch;
  };
  moduleConstAccess (name) {
    return "_mod." + name;
  };
  emitModuleLocalIfNeeded (body) {
    if ( this.moduleSingletonClass.length == 0 ) {
      return;
    }
    if ( this.bodyUsesModuleConst(body) == false ) {
      return;
    }
    this.emitLine(((("def _mod:" + this.moduleSingletonClass) + " (") + this.moduleSingletonClass) + ".__singleton())");
  };
  bodyUsesModuleConst (node) {
    if ( node.nodeType == "Identifier" ) {
      const ca = ( Object.prototype.hasOwnProperty.call(this.constArrayNames, node.name) ? this.constArrayNames[node.name] : undefined );
      if ( (typeof(ca) !== "undefined" && ca != null )  ) {
        return true;
      }
      const cs = ( Object.prototype.hasOwnProperty.call(this.constScalarTypes, node.name) ? this.constScalarTypes[node.name] : undefined );
      if ( (typeof(cs) !== "undefined" && cs != null )  ) {
        return true;
      }
      return false;
    }
    if ( typeof(node.left) != "undefined" ) {
      if ( this.bodyUsesModuleConst(node.left) ) {
        return true;
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      if ( this.bodyUsesModuleConst(node.right) ) {
        return true;
      }
    }
    if ( typeof(node.body) != "undefined" ) {
      if ( this.bodyUsesModuleConst(node.body) ) {
        return true;
      }
    }
    if ( typeof(node.init) != "undefined" ) {
      if ( this.bodyUsesModuleConst(node.init) ) {
        return true;
      }
    }
    if ( typeof(node.test) != "undefined" ) {
      if ( this.bodyUsesModuleConst(node.test) ) {
        return true;
      }
    }
    if ( typeof(node.consequent) != "undefined" ) {
      if ( this.bodyUsesModuleConst(node.consequent) ) {
        return true;
      }
    }
    if ( typeof(node.alternate) != "undefined" ) {
      if ( this.bodyUsesModuleConst(node.alternate) ) {
        return true;
      }
    }
    let i = 0;
    while (i < node.children.length) {
      if ( this.bodyUsesModuleConst(node.children[i]) ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  hasModuleConsts (ast) {
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      if ( node.nodeType == "VariableDeclaration" ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  seedBridgeStructs () {
    this.interfaceFieldsCsv["SpriteDef"] = "id:string,kind:string,w:int,h:int,rad:int,r:int,g:int,b:int,p0:int,p1:int,p2:int,px:int,br:int,bg:int,bb:int,er:int,eg:int,eb:int,frames:[[string]],path:string,frameW:int,frameH:int,cols:int,rows:int,scale:int,feetTrim:int,jumpFrame:int";
    this.interfaceFieldsCsv["EntityPose"] = "x:double,y:double,visible:int,r:int,g:int,b:int,rad:int,p0:int,p1:int,p2:int";
    this.interfaceFieldsCsv["ResourceDef"] = "kind:string,id:string,path:string,px:int,frameCount:int,w:int,h:int";
    this.interfaceFieldsCsv["GameEvent"] = "kind:string,id:string,x:double,y:double,amount:int";
    this.interfaceFieldsCsv["PlayerInput"] = "up:boolean,down:boolean,left:boolean,right:boolean,action:boolean,shoot:boolean,b:boolean,x:boolean";
    this.interfaceFieldsCsv["GameInput"] = "players:[PlayerInputNative]";
  };
  isNativeStateField (prop) {
    if ( prop == "screen" ) {
      return true;
    }
    if ( prop == "showNet" ) {
      return true;
    }
    if ( prop == "score1" ) {
      return true;
    }
    if ( prop == "score2" ) {
      return true;
    }
    if ( prop == "score" ) {
      return true;
    }
    if ( prop == "vx" ) {
      return true;
    }
    if ( prop == "vy" ) {
      return true;
    }
    if ( prop == "hasVx" ) {
      return true;
    }
    if ( prop == "hasVy" ) {
      return true;
    }
    if ( prop == "dt" ) {
      return true;
    }
    if ( prop == "hasDt" ) {
      return true;
    }
    if ( prop == "entities" ) {
      return true;
    }
    if ( prop == "numbers" ) {
      return true;
    }
    if ( prop == "events" ) {
      return true;
    }
    return false;
  };
  fieldType (prop) {
    if ( prop == "x" || prop == "y" ) {
      return "double";
    }
    if ( prop == "vx" || prop == "vy" ) {
      return "double";
    }
    if ( prop == "dt" ) {
      return "double";
    }
    if ( (((prop == "up" || prop == "down") || prop == "left") || prop == "right") || prop == "action" ) {
      return "boolean";
    }
    if ( prop == "hasVx" || prop == "hasVy" ) {
      return "boolean";
    }
    if ( prop == "hasDt" ) {
      return "boolean";
    }
    if ( ((prop == "id" || prop == "kind") || prop == "screen") || prop == "path" ) {
      return "string";
    }
    if ( prop == "state" ) {
      return "NativeGameState";
    }
    if ( prop == "input" ) {
      return "GameInputNative";
    }
    if ( prop == "players" ) {
      return "[PlayerInputNative]";
    }
    if ( prop == "events" ) {
      return "[GameEventNative]";
    }
    if ( prop == "entities" ) {
      return "[string:EntityPoseNative]";
    }
    return "int";
  };
  lookupVarType (name) {
    const t = ( Object.prototype.hasOwnProperty.call(this.varTypes, name) ? this.varTypes[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return t;
    }
    return "";
  };
  callExprType (node) {
    if ( typeof(node.left) === "undefined" ) {
      return "int";
    }
    const callee = node.left;
    if ( callee.nodeType == "Identifier" ) {
      if ( this.isBridgeHelper(callee.name) ) {
        return "GameEventNative";
      }
      if ( callee.name == "initState" ) {
        return "NativeGameState";
      }
      if ( this.isKnownHelper(callee.name) ) {
        return this.helperReturnType(callee.name);
      }
    }
    if ( callee.nodeType == "MemberExpression" ) {
      return "void";
    }
    return "int";
  };
  elemTypeOf (arrType) {
    if ( arrType.length < 3 ) {
      return "int";
    }
    const first = arrType.substring(0, 1 );
    if ( first != "[" ) {
      return "int";
    }
    const inner = arrType.substring(1, (arrType.length - 1) );
    const il = inner.length;
    let depth = 0;
    let sep = 0 - 1;
    let i = 0;
    while (i < il) {
      const c = inner.charCodeAt(i );
      if ( c == (91) ) {
        depth = depth + 1;
      }
      if ( c == 93 ) {
        depth = depth - 1;
      }
      if ( c == (58) && depth == 0 ) {
        sep = i;
      }
      i = i + 1;
    };
    if ( sep >= 0 ) {
      return inner.substring((sep + 1), il );
    }
    return inner;
  };
  structFieldType (structType, field) {
    if ( this.endsWith(structType, "Native") == false ) {
      return "";
    }
    const iface = structType.substring(0, (structType.length - 6) );
    const csv = ( Object.prototype.hasOwnProperty.call(this.interfaceFieldsCsv, iface) ? this.interfaceFieldsCsv[iface] : undefined );
    if ( typeof(csv) === "undefined" ) {
      return "";
    }
    const pairs = this.splitCsv(csv);
    let i = 0;
    while (i < pairs.length) {
      const pair = pairs[i];
      const colon = pair.indexOf(":");
      if ( colon > 0 ) {
        const fname = pair.substring(0, colon );
        if ( fname == field ) {
          return pair.substring((colon + 1), pair.length );
        }
      }
      i = i + 1;
    };
    return "";
  };
  isStateArrayField (name) {
    const t = ( Object.prototype.hasOwnProperty.call(this.stateArrayFieldType, name) ? this.stateArrayFieldType[name] : undefined );
    return (typeof(t) !== "undefined" && t != null ) ;
  };
  stateArrayType (name) {
    const t = ( Object.prototype.hasOwnProperty.call(this.stateArrayFieldType, name) ? this.stateArrayFieldType[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return t;
    }
    return "[int]";
  };
  isComparisonOp (op) {
    if ( op == "<" ) {
      return true;
    }
    if ( op == ">" ) {
      return true;
    }
    if ( op == "<=" ) {
      return true;
    }
    if ( op == ">=" ) {
      return true;
    }
    if ( op == "==" ) {
      return true;
    }
    if ( op == "!=" ) {
      return true;
    }
    if ( op == "===" ) {
      return true;
    }
    if ( op == "!==" ) {
      return true;
    }
    return false;
  };
  isLogicalOp (op) {
    if ( op == "&&" ) {
      return true;
    }
    if ( op == "||" ) {
      return true;
    }
    return false;
  };
  exprType (node) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      if ( this.containsChar(node.value, 46) ) {
        return "double";
      }
      return "int";
    }
    if ( t == "BooleanLiteral" ) {
      return "boolean";
    }
    if ( t == "StringLiteral" ) {
      return "string";
    }
    if ( t == "Identifier" ) {
      const vt = this.lookupVarType(node.name);
      if ( vt.length > 0 ) {
        return vt;
      }
      const ist = ( Object.prototype.hasOwnProperty.call(this.initStateLocalTypes, node.name) ? this.initStateLocalTypes[node.name] : undefined );
      if ( (typeof(ist) !== "undefined" && ist != null )  ) {
        return ist;
      }
      const ca = ( Object.prototype.hasOwnProperty.call(this.constArrayNames, node.name) ? this.constArrayNames[node.name] : undefined );
      if ( (typeof(ca) !== "undefined" && ca != null )  ) {
        const et = ( Object.prototype.hasOwnProperty.call(this.constArrayElemType, node.name) ? this.constArrayElemType[node.name] : undefined );
        if ( (typeof(et) !== "undefined" && et != null )  ) {
          return ("[" + et) + "]";
        }
      }
      const cst = ( Object.prototype.hasOwnProperty.call(this.constScalarTypes, node.name) ? this.constScalarTypes[node.name] : undefined );
      if ( (typeof(cst) !== "undefined" && cst != null )  ) {
        return cst;
      }
      if ( this.isEngineGlobal(node.name) ) {
        return "int";
      }
      return "int";
    }
    if ( t == "CallExpression" ) {
      return this.callExprType(node);
    }
    if ( t == "MemberExpression" ) {
      if ( node.name == "length" ) {
        if ( typeof(node.left) != "undefined" ) {
          return "int";
        }
      }
      if ( node.computed ) {
        if ( typeof(node.left) != "undefined" ) {
          const bt = this.exprType(node.left);
          return this.elemTypeOf(bt);
        }
      }
      if ( typeof(node.left) != "undefined" ) {
        const lbase = node.left;
        if ( lbase.nodeType == "Identifier" ) {
          const lvt = this.lookupVarType(lbase.name);
          if ( lvt == "NativeGameState" ) {
            if ( this.isObjectStateField(node.name) ) {
              return this.objectStateFieldTypeOf(node.name);
            }
            if ( this.isNativeStateField(node.name) == false ) {
              if ( this.isStateArrayField(node.name) ) {
                return this.stateArrayType(node.name);
              }
              return "double";
            }
          }
        }
        const baseT = this.exprType(lbase);
        const sf = this.structFieldType(baseT, node.name);
        if ( sf.length > 0 ) {
          return sf;
        }
      }
      return this.fieldType(node.name);
    }
    if ( t == "UnaryExpression" ) {
      if ( node.value == "!" ) {
        return "boolean";
      }
      if ( typeof(node.left) != "undefined" ) {
        return this.exprType(node.left);
      }
      return "int";
    }
    if ( t == "BinaryExpression" ) {
      const op = node.value;
      if ( this.isComparisonOp(op) ) {
        return "boolean";
      }
      if ( this.isLogicalOp(op) ) {
        return "boolean";
      }
      let lt = "int";
      let rt = "int";
      if ( typeof(node.left) != "undefined" ) {
        lt = this.exprType(node.left);
      }
      if ( typeof(node.right) != "undefined" ) {
        rt = this.exprType(node.right);
      }
      if ( op == "+" ) {
        if ( lt == "string" || rt == "string" ) {
          return "string";
        }
      }
      if ( lt == "double" || rt == "double" ) {
        return "double";
      }
      return "int";
    }
    if ( t == "ObjectExpression" ) {
      if ( node.children.length == 0 ) {
        return "[string:EntityPoseNative]";
      }
      return this.inferObjectStructType(node, "");
    }
    return "int";
  };
  isFloatScalar (t) {
    if ( t == "double" ) {
      return true;
    }
    if ( t == "f32" ) {
      return true;
    }
    return false;
  };
  isIntScalar (t) {
    if ( t == "int" ) {
      return true;
    }
    if ( t == "i32" ) {
      return true;
    }
    if ( t == "u8" ) {
      return true;
    }
    if ( t == "u16" ) {
      return true;
    }
    if ( t == "u32" ) {
      return true;
    }
    return false;
  };
  numericCommon (node) {
    let lt = "int";
    let rt = "int";
    if ( typeof(node.left) != "undefined" ) {
      lt = this.exprType(node.left);
    }
    if ( typeof(node.right) != "undefined" ) {
      rt = this.exprType(node.right);
    }
    if ( this.isFloatScalar(lt) || this.isFloatScalar(rt) ) {
      return "double";
    }
    return "int";
  };
  rhsValueType (node) {
    if ( node.nodeType == "BinaryExpression" ) {
      return this.numericCommon(node);
    }
    return this.exprType(node);
  };
  coerceToType (expr, node, target) {
    if ( target == "int" ) {
      const rt = this.rhsValueType(node);
      if ( rt == "double" ) {
        if ( expr.length >= 7 ) {
          if ( expr.substring(0, 7 ) == "(to_int" ) {
            return expr;
          }
        }
        return ("(to_int " + expr) + ")";
      }
    }
    if ( target == "double" ) {
      const rt2 = this.rhsValueType(node);
      if ( rt2 == "int" ) {
        if ( node.nodeType == "NumericLiteral" ) {
          return expr;
        }
        if ( node.nodeType == "Identifier" ) {
          return expr;
        }
        if ( this.containsChar(expr, 46) ) {
          return expr;
        }
        if ( expr.length >= 4 ) {
          if ( expr.substring(0, 4 ) == "(0.0" ) {
            return expr;
          }
        }
        if ( expr.length >= 10 ) {
          if ( expr.substring(0, 10 ) == "(to_double" ) {
            return expr;
          }
        }
        return ("(to_double " + expr) + ")";
      }
    }
    return expr;
  };
  emitProgram (ast) {
    this.reset();
    this.applyModuleId();
    this.prescanProgram(ast);
    this.emitLine("; Generated by gallery/ts_to_ranger/ts_emitter.rgr");
    this.emitLine("; Source: game script (.game.tsx) - do not edit by hand.");
    this.emitLine("");
    this.emitLine("Import \"../../game_engine/scripting/game_engine_host.rgr\"");
    this.emitLine("");
    this.emitInterfaces();
    if ( this.hasModuleConsts(ast) && this.moduleSingletonClass.length > 0 ) {
      this.emitModuleSingleton(ast);
      this.emitLine("");
    }
    this.emitLine("class GeneratedGameScript {");
    this.emitLine("    def host:GameEngineHost (new GameEngineHost)");
    this.emitObjectStateFields();
    this.emitLine("");
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        this.emitFunction(node);
      }
      i = i + 1;
    };
    this.emitLine("}");
    return this.output;
  };
  emitObjectStateFields () {
    let i = 0;
    while (i < this.objectStateFieldOrder.length) {
      const name = this.objectStateFieldOrder[i];
      const t = ( Object.prototype.hasOwnProperty.call(this.objectStateFieldType, name) ? this.objectStateFieldType[name] : undefined );
      if ( (typeof(t) !== "undefined" && t != null )  ) {
        const ty = t;
        const zero = this.zeroFor(ty);
        if ( zero.length > 0 ) {
          this.emitLine((((("    def st_" + name) + ":") + ty) + " ") + zero);
        } else {
          this.emitLine((("    def st_" + name) + ":") + ty);
        }
      }
      i = i + 1;
    };
  };
  isObjectStateField (name) {
    const t = ( Object.prototype.hasOwnProperty.call(this.objectStateFieldType, name) ? this.objectStateFieldType[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return true;
    }
    return false;
  };
  objectStateFieldTypeOf (name) {
    const t = ( Object.prototype.hasOwnProperty.call(this.objectStateFieldType, name) ? this.objectStateFieldType[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return t;
    }
    return "int";
  };
  emitStateFieldRead (baseName, field, expected) {
    if ( this.isObjectStateField(field) ) {
      return "st_" + field;
    }
    if ( this.isStateArrayField(field) ) {
      return ((("(unwrap (get " + baseName) + ".intArrays \"") + field) + "\"))";
    }
    if ( this.isNativeStateField(field) == false ) {
      if ( field.length > 0 ) {
        const access = ((("(unwrap (get " + baseName) + ".numbers \"") + field) + "\"))";
        if ( expected == "int" ) {
          return ("(to_int " + access) + ")";
        }
        return access;
      }
    }
    return "";
  };
  isSpecialFn (name) {
    if ( name == "sprites" ) {
      return true;
    }
    if ( name == "resources" ) {
      return true;
    }
    if ( name == "initState" ) {
      return true;
    }
    if ( name == "update" ) {
      return true;
    }
    if ( name == "hud" ) {
      return true;
    }
    return false;
  };
  prescanProgram (ast) {
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      const t = node.nodeType;
      if ( t == "TSInterfaceDeclaration" ) {
        this.recordInterface(node);
      }
      if ( t == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node.name) == false ) {
          this.recordHelper(node);
        }
      }
      if ( t == "VariableDeclaration" ) {
        this.recordModuleConst(node);
      }
      i = i + 1;
    };
    let j = 0;
    while (j < ast.children.length) {
      const node_1 = ast.children[j];
      if ( node_1.nodeType == "FunctionDeclaration" ) {
        if ( node_1.name == "initState" ) {
          this.scanStateArrays(node_1);
        }
      }
      j = j + 1;
    };
    let k = 0;
    while (k < ast.children.length) {
      const node2 = ast.children[k];
      if ( node2.nodeType == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node2.name) == false ) {
          this.inferParamTypesFromProgram(node2.name, ast);
        }
      }
      k = k + 1;
    };
    this.finalizeHelperReturnTypes(ast);
    this.finalizeSynthStructs(ast);
    this.finalizeHelperReturnTypes(ast);
    this.reinferParamTypesFromCalls(ast);
  };
  scanStateArrays (node) {
    if ( typeof(node.body) === "undefined" ) {
      return;
    }
    let empty = {};
    this.initStateLocalTypes = empty;
    const body = node.body;
    let i = 0;
    while (i < body.children.length) {
      const stmt = body.children[i];
      if ( stmt.nodeType == "VariableDeclaration" ) {
        this.scanInitStateLocalVar(stmt);
      }
      if ( stmt.nodeType == "ReturnStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const val = stmt.left;
          if ( val.nodeType == "ObjectExpression" ) {
            this.scanStateArrayProps(val);
          }
        }
      }
      i = i + 1;
    };
  };
  scanInitStateLocalVar (stmt) {
    let j = 0;
    while (j < stmt.children.length) {
      const decl = stmt.children[j];
      if ( decl.nodeType == "VariableDeclarator" ) {
        if ( typeof(decl.init) != "undefined" ) {
          const vt = this.exprType(decl.init);
          this.initStateLocalTypes[decl.name] = vt;
        }
      }
      j = j + 1;
    };
  };
  stateArrayTypeFromValueNode (valNode) {
    let vt = this.exprType(valNode);
    if ( valNode.nodeType == "Identifier" ) {
      const lt = ( Object.prototype.hasOwnProperty.call(this.initStateLocalTypes, valNode.name) ? this.initStateLocalTypes[valNode.name] : undefined );
      if ( (typeof(lt) !== "undefined" && lt != null )  ) {
        vt = lt;
      }
    }
    return vt;
  };
  scanStateArrayProps (obj) {
    let i = 0;
    while (i < obj.children.length) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        if ( this.isNativeStateField(key) == false ) {
          if ( key != "entities" ) {
            const valNode = this.propertyValueNode(prop);
            const vt = this.stateArrayTypeFromValueNode(valNode);
            let first = "";
            if ( vt.length > 0 ) {
              first = vt.substring(0, 1 );
            }
            if ( first == "[" ) {
              const et = this.elemTypeOf(vt);
              if ( et == "int" || et == "double" ) {
                this.stateArrayFieldType[key] = vt;
              } else {
                this.objectStateFieldType[key] = vt;
                this.objectStateFieldOrder.push(key);
              }
            } else {
              if ( this.endsWith(vt, "Native") ) {
                this.objectStateFieldType[key] = vt;
                this.objectStateFieldOrder.push(key);
              }
            }
          }
        }
      }
      i = i + 1;
    };
  };
  helperAnnotatedArrayElem (fnName) {
    const rt = this.helperReturnType(fnName);
    if ( this.startsWith(rt, "[") ) {
      return this.elemTypeOf(rt);
    }
    return "";
  };
  recordHelper (node) {
    this.isHelperFn[node.name] = true;
    let rt = "int";
    if ( typeof(node.typeAnnotation) != "undefined" ) {
      rt = this.annotType(node.typeAnnotation);
    } else {
      const inferred = this.inferHelperReturnType(node);
      if ( this.isPositiveType(inferred) ) {
        rt = inferred;
      }
    }
    this.fnReturnTypes[node.name] = rt;
    let types = [];
    let i = 0;
    while (i < node.params.length) {
      const p = node.params[i];
      let pt = "int";
      if ( typeof(p.typeAnnotation) != "undefined" ) {
        pt = this.annotType(p.typeAnnotation);
      }
      types.push(pt);
      i = i + 1;
    };
    this.fnParamTypesCsv[node.name] = this.joinCsv(types);
    this.inferParamTypes(node);
  };
  isBridgeHelper (name) {
    if ( name == "soundEvent" ) {
      return true;
    }
    if ( name == "voiceEvent" ) {
      return true;
    }
    if ( name == "musicEvent" ) {
      return true;
    }
    if ( name == "musicScoreEvent" ) {
      return true;
    }
    if ( name == "stopMusicEvent" ) {
      return true;
    }
    if ( name == "particleEvent" ) {
      return true;
    }
    if ( name == "rumbleEvent" ) {
      return true;
    }
    return false;
  };
  emitBridgeHelperValue (name, node) {
    const tmp = "be" + ("" + this.tmpCounter);
    this.tmpCounter = this.tmpCounter + 1;
    this.emitLine(("def " + tmp) + ":GameEventNative (new GameEventNative)");
    if ( name == "soundEvent" ) {
      this.emitLine(tmp + ".kind = \"playSound\"");
      if ( node.children.length > 0 ) {
        const id = this.emitExpr(node.children[0], "string");
        this.emitLine((tmp + ".id = ") + id);
      }
      return tmp;
    }
    if ( name == "voiceEvent" ) {
      this.emitLine(tmp + ".kind = \"playVoice\"");
      if ( node.children.length > 0 ) {
        const vid = this.emitExpr(node.children[0], "string");
        this.emitLine((tmp + ".id = ") + vid);
      }
      return tmp;
    }
    if ( name == "stopMusicEvent" ) {
      this.emitLine(tmp + ".kind = \"stopMusic\"");
      this.emitLine(tmp + ".id = \"\"");
      return tmp;
    }
    if ( name == "musicEvent" ) {
      this.emitLine(tmp + ".kind = \"playMusic\"");
      if ( node.children.length > 0 ) {
        const id_1 = this.emitExpr(node.children[0], "string");
        this.emitLine((tmp + ".id = ") + id_1);
      }
      this.emitLine(tmp + ".amount = 1");
      return tmp;
    }
    if ( name == "musicScoreEvent" ) {
      this.emitLine(tmp + ".kind = \"playMusic\"");
      this.emitLine(tmp + ".id = \"inline\"");
      if ( node.children.length > 0 ) {
        const txt = this.emitExpr(node.children[0], "string");
        this.emitLine((tmp + ".text = ") + txt);
      }
      this.emitLine(tmp + ".amount = 1");
      return tmp;
    }
    if ( name == "particleEvent" ) {
      this.emitLine(tmp + ".kind = \"particles\"");
      if ( node.children.length > 0 ) {
        const pid = this.emitExpr(node.children[0], "string");
        this.emitLine((tmp + ".id = ") + pid);
      }
      if ( node.children.length > 1 ) {
        const px = this.emitExpr(node.children[1], "double");
        this.emitLine((tmp + ".x = ") + px);
      }
      if ( node.children.length > 2 ) {
        const py = this.emitExpr(node.children[2], "double");
        this.emitLine((tmp + ".y = ") + py);
      }
      if ( node.children.length > 3 ) {
        const amt = this.emitExpr(node.children[3], "int");
        this.emitLine((tmp + ".amount = ") + amt);
      }
      return tmp;
    }
    if ( name == "rumbleEvent" ) {
      this.emitLine(tmp + ".kind = \"rumble\"");
      if ( node.children.length > 0 ) {
        const pad = this.emitExpr(node.children[0], "int");
        this.emitLine((tmp + ".pad = ") + pad);
      }
      if ( node.children.length > 1 ) {
        const lo = this.emitExpr(node.children[1], "int");
        this.emitLine((tmp + ".low = ") + lo);
      }
      if ( node.children.length > 2 ) {
        const hi = this.emitExpr(node.children[2], "int");
        this.emitLine((tmp + ".high = ") + hi);
      }
      if ( node.children.length > 3 ) {
        const dur = this.emitExpr(node.children[3], "int");
        this.emitLine((tmp + ".ms = ") + dur);
      }
      return tmp;
    }
    return tmp;
  };
  inferObjectStructType (obj, fnName) {
    const known = this.matchKnownStruct(obj);
    if ( known.length > 0 ) {
      return known;
    }
    if ( fnName.length == 0 ) {
      return "int";
    }
    return this.registerSynthStruct(obj, fnName);
  };
  matchKnownStruct (obj) {
    if ( obj.nodeType != "ObjectExpression" ) {
      return "";
    }
    let hasId = false;
    let hasKind = false;
    let hasX = false;
    let hasY = false;
    let i = 0;
    while (i < obj.children.length) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        if ( key == "id" ) {
          hasId = true;
        }
        if ( key == "kind" ) {
          hasKind = true;
        }
        if ( key == "x" ) {
          hasX = true;
        }
        if ( key == "y" ) {
          hasY = true;
        }
      }
      i = i + 1;
    };
    if ( hasId && hasKind ) {
      return "SpriteDefNative";
    }
    if ( hasX && hasY ) {
      if ( this.allFieldsArePose(obj) ) {
        return "EntityPoseNative";
      }
    }
    return "";
  };
  allFieldsArePose (obj) {
    let i = 0;
    while (i < obj.children.length) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        if ( this.isPoseField(key) == false ) {
          return false;
        }
      }
      i = i + 1;
    };
    return true;
  };
  isPoseField (key) {
    if ( key == "x" ) {
      return true;
    }
    if ( key == "y" ) {
      return true;
    }
    if ( key == "visible" ) {
      return true;
    }
    if ( key == "r" ) {
      return true;
    }
    if ( key == "g" ) {
      return true;
    }
    if ( key == "b" ) {
      return true;
    }
    if ( key == "rad" ) {
      return true;
    }
    if ( key == "p0" ) {
      return true;
    }
    if ( key == "p1" ) {
      return true;
    }
    if ( key == "p2" ) {
      return true;
    }
    return false;
  };
  registerSynthStruct (obj, fnName) {
    const baseName = fnName + "Ret";
    const structType = baseName + "Native";
    const done = ( Object.prototype.hasOwnProperty.call(this.synthStructDone, baseName) ? this.synthStructDone[baseName] : undefined );
    if ( typeof(done) === "undefined" ) {
      const csv = this.objectFieldsCsv(obj);
      this.interfaceFieldsCsv[baseName] = csv;
      this.interfaceNames.push(baseName);
      this.synthStructDone[baseName] = true;
    }
    return structType;
  };
  objectFieldType (key, valNode) {
    if ( key == "hit" ) {
      return "boolean";
    }
    if ( key == "x" ) {
      return "double";
    }
    if ( key == "y" ) {
      return "double";
    }
    if ( key == "w" ) {
      return "double";
    }
    if ( key == "vx" ) {
      return "double";
    }
    if ( key == "vy" ) {
      return "double";
    }
    if ( key == "bx" ) {
      return "double";
    }
    if ( key == "by" ) {
      return "double";
    }
    if ( key == "fireCd" ) {
      return "double";
    }
    if ( key == "carryVx" ) {
      return "double";
    }
    if ( valNode.nodeType == "ObjectExpression" ) {
      const known = this.matchKnownStruct(valNode);
      if ( known.length > 0 ) {
        return known;
      }
      const iface = this.matchRecordedInterface(valNode);
      if ( iface.length > 0 ) {
        return iface;
      }
    }
    return this.exprType(valNode);
  };
  matchRecordedInterface (obj) {
    if ( obj.nodeType != "ObjectExpression" ) {
      return "";
    }
    let i = 0;
    while (i < this.interfaceNames.length) {
      const iname = this.interfaceNames[i];
      if ( this.objectMatchesInterface(obj, iname) ) {
        return iname + "Native";
      }
      i = i + 1;
    };
    return "";
  };
  objectMatchesInterface (obj, iface) {
    const csv = ( Object.prototype.hasOwnProperty.call(this.interfaceFieldsCsv, iface) ? this.interfaceFieldsCsv[iface] : undefined );
    if ( typeof(csv) === "undefined" ) {
      return false;
    }
    const pairs = this.splitCsv(csv);
    let pi = 0;
    while (pi < pairs.length) {
      const pair = pairs[pi];
      const colon = pair.indexOf(":");
      if ( colon > 0 ) {
        const fname = pair.substring(0, colon );
        if ( this.objectHasField(obj, fname) == false ) {
          return false;
        }
      }
      pi = pi + 1;
    };
    return true;
  };
  objectHasField (obj, key) {
    let i = 0;
    while (i < obj.children.length) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        if ( this.propKey(prop) == key ) {
          return true;
        }
      }
      i = i + 1;
    };
    return false;
  };
  objectFieldsCsv (obj) {
    let pairs = [];
    let i = 0;
    while (i < obj.children.length) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        if ( key.length > 0 ) {
          const valNode = this.propertyValueNode(prop);
          const ft = this.objectFieldType(key, valNode);
          pairs.push((key + ":") + ft);
        }
      }
      i = i + 1;
    };
    return this.joinCsv(pairs);
  };
  finalizeSynthStructs (ast) {
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node.name) == false ) {
          if ( typeof(node.body) === "undefined" ) {
            i = i + 1;
            continue;
          }
          const body = node.body;
          const saved = this.varTypes;
          let local = {};
          this.varTypes = local;
          let pi = 0;
          while (pi < node.params.length) {
            const p = node.params[pi];
            const pt = this.helperParamType(node.name, pi);
            if ( pt.length > 0 ) {
              this.varTypes[p.name] = pt;
            }
            pi = pi + 1;
          };
          const savedInfer = this.inferFnName;
          this.inferFnName = node.name;
          this.collectLocalVarTypes(body, body);
          this.inferFnName = savedInfer;
          const csv = this.findReturnStructCsv(body, node.name);
          if ( csv.length > 0 ) {
            const baseName = node.name + "Ret";
            this.interfaceFieldsCsv[baseName] = csv;
          }
          this.refreshPushStructsInBlock(body, node.name);
          this.varTypes = saved;
        }
      }
      i = i + 1;
    };
  };
  refreshPushStructsInBlock (block, fnName) {
    let i = 0;
    while (i < block.children.length) {
      this.refreshPushStructsInStmt(block.children[i], fnName);
      i = i + 1;
    };
  };
  refreshPushStructsInStmt (stmt, fnName) {
    const t = stmt.nodeType;
    if ( t == "BlockStatement" ) {
      this.refreshPushStructsInBlock(stmt, fnName);
      return;
    }
    if ( t == "ExpressionStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        const expr = stmt.left;
        if ( expr.nodeType == "CallExpression" ) {
          if ( typeof(expr.left) != "undefined" ) {
            const callee = expr.left;
            if ( callee.nodeType == "MemberExpression" ) {
              if ( callee.name == "push" ) {
                if ( typeof(callee.left) != "undefined" ) {
                  const base = callee.left;
                  if ( base.nodeType == "Identifier" ) {
                    if ( expr.children.length > 0 ) {
                      const argNode = expr.children[0];
                      if ( argNode.nodeType == "ObjectExpression" ) {
                        const baseName = ((fnName + "_") + base.name) + "Ret";
                        this.interfaceFieldsCsv[baseName] = this.objectFieldsCsv(argNode);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return;
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        this.refreshPushStructsInStmt(stmt.body, fnName);
      }
      if ( typeof(stmt.right) != "undefined" ) {
        this.refreshPushStructsInStmt(stmt.right, fnName);
      }
      return;
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        this.refreshPushStructsInStmt(stmt.body, fnName);
      }
    }
  };
  reinferParamTypesFromCalls (ast) {
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node.name) == false ) {
          this.inferParamTypesFromProgram(node.name, ast);
          this.inferParamTypes(node);
        }
      }
      i = i + 1;
    };
  };
  findReturnStructCsv (block, fnName) {
    let i = 0;
    while (i < block.children.length) {
      const csv = this.findReturnStructCsvInStmt(block.children[i], fnName);
      if ( csv.length > 0 ) {
        return csv;
      }
      i = i + 1;
    };
    return "";
  };
  findReturnStructCsvInStmt (stmt, fnName) {
    const t = stmt.nodeType;
    if ( t == "ReturnStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        const val = stmt.left;
        if ( val.nodeType == "ObjectExpression" ) {
          return this.objectFieldsCsv(val);
        }
      }
      return "";
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        const r1 = this.findReturnStructCsvInStmt(stmt.body, fnName);
        if ( r1.length > 0 ) {
          return r1;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        const r2 = this.findReturnStructCsvInStmt(stmt.right, fnName);
        if ( r2.length > 0 ) {
          return r2;
        }
      }
      return "";
    }
    if ( t == "BlockStatement" ) {
      return this.findReturnStructCsv(stmt, fnName);
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.findReturnStructCsvInStmt(stmt.body, fnName);
      }
    }
    return "";
  };
  inferParamTypes (node) {
    if ( typeof(node.body) === "undefined" ) {
      return;
    }
    const body = node.body;
    const csv = ( Object.prototype.hasOwnProperty.call(this.fnParamTypesCsv, node.name) ? this.fnParamTypesCsv[node.name] : undefined );
    let oldTypes = [];
    if ( (typeof(csv) !== "undefined" && csv != null )  ) {
      oldTypes = this.splitCsv(csv);
    }
    let newTypes = [];
    let i = 0;
    while (i < node.params.length) {
      const p = node.params[i];
      let pt = "int";
      if ( typeof(p.typeAnnotation) != "undefined" ) {
        pt = this.annotType(p.typeAnnotation);
      } else {
        if ( i < oldTypes.length ) {
          pt = oldTypes[i];
        }
        const inferred = this.inferParamTypeFromBody(p.name, body);
        if ( inferred.length > 0 ) {
          pt = inferred;
        }
      }
      newTypes.push(pt);
      i = i + 1;
    };
    this.fnParamTypesCsv[node.name] = this.joinCsv(newTypes);
  };
  inferParamTypesFromProgram (fnName, ast) {
    this.inferParamTypesFromCallsWalk(fnName, ast);
  };
  inferParamTypesFromCallsWalk (fnName, node) {
    if ( node.nodeType == "CallExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const callee = node.left;
        if ( callee.nodeType == "Identifier" ) {
          if ( callee.name == fnName ) {
            this.mergeCallArgTypes(fnName, node);
          }
        }
      }
    }
    let i = 0;
    while (i < node.children.length) {
      this.inferParamTypesFromCallsWalk(fnName, node.children[i]);
      i = i + 1;
    };
    if ( typeof(node.left) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.left);
    }
    if ( typeof(node.right) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.right);
    }
    if ( typeof(node.body) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.body);
    }
    if ( typeof(node.init) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.init);
    }
    if ( typeof(node.test) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.test);
    }
    if ( typeof(node.consequent) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.consequent);
    }
    if ( typeof(node.alternate) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.alternate);
    }
  };
  inferCallArgType (arg, fnName) {
    if ( arg.nodeType == "ObjectExpression" ) {
      if ( fnName.length > 0 ) {
        return this.inferObjectStructType(arg, (fnName + "_arg"));
      }
    }
    const at = this.exprType(arg);
    if ( this.isPositiveType(at) ) {
      return at;
    }
    if ( arg.nodeType == "Identifier" ) {
      if ( arg.name == "vx" ) {
        return "double";
      }
      if ( arg.name == "vy" ) {
        return "double";
      }
      if ( arg.name == "bx" ) {
        return "double";
      }
      if ( arg.name == "by" ) {
        return "double";
      }
      if ( arg.name == "prevBx" ) {
        return "double";
      }
    }
    if ( arg.nodeType == "MemberExpression" ) {
      if ( arg.computed ) {
        if ( typeof(arg.left) != "undefined" ) {
          const base = arg.left;
          if ( base.nodeType == "MemberExpression" ) {
            if ( typeof(base.left) != "undefined" ) {
              const root = base.left;
              if ( root.nodeType == "Identifier" ) {
                if ( root.name == this.stateVarName ) {
                  const ost = this.objectStateFieldTypeOf(base.name);
                  if ( this.startsWith(ost, "[") ) {
                    return this.elemTypeOf(ost);
                  }
                }
              }
            }
          }
          if ( base.nodeType == "Identifier" ) {
            if ( base.name == this.stateVarName ) {
              const et = this.objectStateFieldTypeOf(arg.name);
              if ( this.startsWith(et, "[") ) {
                return this.elemTypeOf(et);
              }
            }
          }
          const bt = this.exprType(base);
          if ( this.startsWith(bt, "[") ) {
            return this.elemTypeOf(bt);
          }
        }
      }
      if ( arg.name == "x" ) {
        return "double";
      }
      if ( arg.name == "y" ) {
        return "double";
      }
      if ( arg.name == "vx" ) {
        return "double";
      }
      if ( arg.name == "vy" ) {
        return "double";
      }
    }
    return at;
  };
  mergeCallArgTypes (fnName, call) {
    const csv = ( Object.prototype.hasOwnProperty.call(this.fnParamTypesCsv, fnName) ? this.fnParamTypesCsv[fnName] : undefined );
    if ( typeof(csv) === "undefined" ) {
      return;
    }
    const types = this.splitCsv(csv);
    let newTypes = [];
    let i = 0;
    while (i < types.length) {
      let pt = types[i];
      if ( i < call.children.length ) {
        const arg = call.children[i];
        const at = this.inferCallArgType(arg, fnName);
        if ( this.isPositiveType(at) ) {
          pt = at;
        }
      }
      newTypes.push(pt);
      i = i + 1;
    };
    this.fnParamTypesCsv[fnName] = this.joinCsv(newTypes);
  };
  inferParamTypeFromBody (param, body) {
    if ( param == "entities" ) {
      return "[string:EntityPoseNative]";
    }
    if ( param == "events" ) {
      return "[GameEventNative]";
    }
    if ( param == "props" ) {
      return "UpdatePropsNative";
    }
    if ( param == "vx" ) {
      return "double";
    }
    if ( param == "vy" ) {
      return "double";
    }
    if ( param == "bx" ) {
      return "double";
    }
    if ( param == "by" ) {
      return "double";
    }
    if ( param == "prevBx" ) {
      return "double";
    }
    if ( param == "paddleY" ) {
      return "double";
    }
    if ( param == "paddleVy" ) {
      return "double";
    }
    if ( param == "p1y" ) {
      return "double";
    }
    if ( param == "p1vy" ) {
      return "double";
    }
    if ( param == "p2y" ) {
      return "double";
    }
    if ( param == "p2vy" ) {
      return "double";
    }
    if ( param == "alive" ) {
      return "[int]";
    }
    if ( param == "dotCol" ) {
      return "[int]";
    }
    if ( param == "dotRow" ) {
      return "[int]";
    }
    if ( param == "dotAlive" ) {
      return "[int]";
    }
    if ( param == "powerCol" ) {
      return "[int]";
    }
    if ( param == "powerRow" ) {
      return "[int]";
    }
    if ( param == "powerAlive" ) {
      return "[int]";
    }
    if ( param == "ghostCol" ) {
      return "[int]";
    }
    if ( param == "ghostRow" ) {
      return "[int]";
    }
    if ( param == "ghostDir" ) {
      return "[int]";
    }
    if ( param == "ghostFrac" ) {
      return "[int]";
    }
    if ( param == "ghostEyes" ) {
      return "[int]";
    }
    const fromUse = this.inferParamTypeWalk(param, body);
    if ( fromUse.length > 0 ) {
      return fromUse;
    }
    return "";
  };
  inferParamTypeWalk (param, node) {
    const t = node.nodeType;
    if ( t == "IfStatement" ) {
      if ( typeof(node.test) != "undefined" ) {
        const test = node.test;
        if ( test.nodeType == "Identifier" ) {
          if ( test.name == param ) {
            return "boolean";
          }
        }
      }
    }
    if ( t == "MemberExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const base = node.left;
        if ( base.nodeType == "Identifier" ) {
          if ( base.name == param ) {
            if ( node.computed ) {
              return "[int]";
            }
            if ( node.name == "length" ) {
              return "[int]";
            }
            if ( param == "entities" ) {
              return "[string:EntityPoseNative]";
            }
          }
        }
      }
    }
    let i = 0;
    while (i < node.children.length) {
      const r = this.inferParamTypeWalk(param, node.children[i]);
      if ( r.length > 0 ) {
        return r;
      }
      i = i + 1;
    };
    if ( typeof(node.left) != "undefined" ) {
      const r2 = this.inferParamTypeWalk(param, node.left);
      if ( r2.length > 0 ) {
        return r2;
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      const r3 = this.inferParamTypeWalk(param, node.right);
      if ( r3.length > 0 ) {
        return r3;
      }
    }
    if ( typeof(node.body) != "undefined" ) {
      return this.inferParamTypeWalk(param, node.body);
    }
    return "";
  };
  isPositiveType (t) {
    if ( t.length == 0 ) {
      return false;
    }
    if ( t == "void" ) {
      return true;
    }
    if ( t == "int" ) {
      return false;
    }
    if ( t.substring(0, 1 ) == "[" ) {
      return true;
    }
    if ( t == "string" ) {
      return true;
    }
    if ( t == "double" ) {
      return true;
    }
    if ( t == "boolean" ) {
      return true;
    }
    if ( this.endsWith(t, "Native") ) {
      return true;
    }
    return false;
  };
  inferHelperReturnType (node) {
    if ( typeof(node.body) === "undefined" ) {
      return "int";
    }
    const body = node.body;
    const saved = this.varTypes;
    let local = {};
    this.varTypes = local;
    let pi = 0;
    while (pi < node.params.length) {
      const p = node.params[pi];
      const pt = this.helperParamType(node.name, pi);
      if ( pt.length > 0 ) {
        this.varTypes[p.name] = pt;
      }
      pi = pi + 1;
    };
    const savedInfer = this.inferFnName;
    this.inferFnName = node.name;
    this.collectLocalVarTypes(body, body);
    if ( this.functionHasValueReturn(body) == false ) {
      this.varTypes = saved;
      this.inferFnName = savedInfer;
      return "void";
    }
    const result = this.findReturnType(body, node.name);
    this.varTypes = saved;
    this.inferFnName = savedInfer;
    return result;
  };
  finalizeHelperReturnTypes (ast) {
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node.name) == false ) {
          if ( typeof(node.typeAnnotation) === "undefined" ) {
            const inferred = this.inferHelperReturnType(node);
            if ( this.isPositiveType(inferred) ) {
              this.fnReturnTypes[node.name] = inferred;
            }
          }
        }
      }
      i = i + 1;
    };
  };
  functionHasValueReturn (block) {
    let i = 0;
    while (i < block.children.length) {
      if ( this.stmtHasValueReturn(block.children[i]) ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  stmtHasValueReturn (stmt) {
    const t = stmt.nodeType;
    if ( t == "ReturnStatement" ) {
      return (typeof(stmt.left) !== "undefined" && stmt.left != null ) ;
    }
    if ( t == "BlockStatement" ) {
      return this.functionHasValueReturn(stmt);
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        if ( this.stmtHasValueReturn(stmt.body) ) {
          return true;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        if ( this.stmtHasValueReturn(stmt.right) ) {
          return true;
        }
      }
      return false;
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.stmtHasValueReturn(stmt.body);
      }
      return false;
    }
    return false;
  };
  collectLocalVarTypes (block, root) {
    let i = 0;
    while (i < block.children.length) {
      const stmt = block.children[i];
      if ( stmt.nodeType == "VariableDeclaration" ) {
        let j = 0;
        while (j < stmt.children.length) {
          const d = stmt.children[j];
          if ( d.nodeType == "VariableDeclarator" ) {
            if ( typeof(d.init) != "undefined" ) {
              const vt = this.localInitType(d.init, d.name, root);
              if ( vt.length > 0 ) {
                this.varTypes[d.name] = vt;
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
  };
  localInitType (initNode, name, root) {
    if ( initNode.nodeType == "ObjectExpression" ) {
      if ( initNode.children.length == 0 ) {
        if ( name == "entities" ) {
          return "[string:EntityPoseNative]";
        }
        return "[string:EntityPoseNative]";
      }
    }
    if ( initNode.nodeType == "ArrayExpression" ) {
      let elem = "";
      if ( initNode.children.length > 0 ) {
        elem = this.exprType(initNode.children[0]);
      } else {
        elem = this.findPushArgType(root, name);
      }
      if ( elem.length == 0 ) {
        elem = this.helperAnnotatedArrayElem(this.inferFnName);
      }
      if ( elem.length == 0 ) {
        elem = "int";
      }
      return ("[" + elem) + "]";
    }
    return this.exprType(initNode);
  };
  findPushArgType (block, name) {
    let i = 0;
    while (i < block.children.length) {
      const stmt = block.children[i];
      const r = this.findPushArgTypeInStmt(stmt, name);
      if ( r.length > 0 ) {
        return r;
      }
      i = i + 1;
    };
    return "";
  };
  findPushArgTypeInStmt (stmt, name) {
    const t = stmt.nodeType;
    if ( t == "BlockStatement" ) {
      return this.findPushArgType(stmt, name);
    }
    if ( t == "ExpressionStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        const expr = stmt.left;
        if ( expr.nodeType == "CallExpression" ) {
          if ( typeof(expr.left) != "undefined" ) {
            const callee = expr.left;
            if ( callee.nodeType == "MemberExpression" ) {
              if ( callee.name == "push" ) {
                if ( typeof(callee.left) != "undefined" ) {
                  const base = callee.left;
                  if ( base.nodeType == "Identifier" ) {
                    if ( base.name == name ) {
                      if ( expr.children.length > 0 ) {
                        const argNode = expr.children[0];
                        if ( argNode.nodeType == "ObjectExpression" ) {
                          const ann = this.helperAnnotatedArrayElem(this.inferFnName);
                          if ( ann.length > 0 ) {
                            return ann;
                          }
                          const sname = (this.inferFnName + "_") + name;
                          return this.inferObjectStructType(argNode, sname);
                        }
                        const at = this.inferCallArgType(argNode, this.inferFnName);
                        if ( at.length > 0 ) {
                          return at;
                        }
                        return this.exprType(argNode);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return "";
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        const r1 = this.findPushArgTypeInStmt(stmt.body, name);
        if ( r1.length > 0 ) {
          return r1;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        const r2 = this.findPushArgTypeInStmt(stmt.right, name);
        if ( r2.length > 0 ) {
          return r2;
        }
      }
      return "";
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.findPushArgTypeInStmt(stmt.body, name);
      }
      return "";
    }
    return "";
  };
  findReturnType (block, fnName) {
    let i = 0;
    while (i < block.children.length) {
      const stmt = block.children[i];
      const rt = this.findReturnTypeInStmt(stmt, fnName);
      if ( this.isPositiveType(rt) ) {
        return rt;
      }
      i = i + 1;
    };
    return "int";
  };
  findReturnTypeInStmt (stmt, fnName) {
    const t = stmt.nodeType;
    if ( t == "ReturnStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        const val = stmt.left;
        if ( val.nodeType == "ObjectExpression" ) {
          return this.inferObjectStructType(val, fnName);
        }
        if ( val.nodeType == "ArrayExpression" ) {
          if ( val.children.length > 0 ) {
            const first = val.children[0];
            let et = "";
            if ( first.nodeType == "ObjectExpression" ) {
              et = this.inferObjectStructType(first, fnName);
            } else {
              et = this.exprType(first);
            }
            if ( et.length > 0 ) {
              return ("[" + et) + "]";
            }
          }
        }
        return this.exprType(val);
      }
      return "void";
    }
    if ( t == "BlockStatement" ) {
      return this.findReturnType(stmt, fnName);
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        const r1 = this.findReturnTypeInStmt(stmt.body, fnName);
        if ( this.isPositiveType(r1) ) {
          return r1;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        const r2 = this.findReturnTypeInStmt(stmt.right, fnName);
        if ( this.isPositiveType(r2) ) {
          return r2;
        }
      }
      return "int";
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.findReturnTypeInStmt(stmt.body, fnName);
      }
      return "int";
    }
    return "int";
  };
  recordModuleConst (node) {
    let i = 0;
    while (i < node.children.length) {
      const d = node.children[i];
      if ( d.nodeType == "VariableDeclarator" ) {
        if ( typeof(d.init) != "undefined" ) {
          const initNode = d.init;
          if ( initNode.nodeType == "ArrayExpression" ) {
            this.constArrayNames[d.name] = true;
            this.constArrayElemType[d.name] = this.constArrayElem(d, initNode);
          } else {
            if ( initNode.nodeType == "ObjectExpression" ) {
              const ost = this.registerModuleObjectStruct(d.name, initNode);
              this.constScalarTypes[d.name] = ost;
              this.moduleConstDeferred[d.name] = true;
            } else {
              this.constScalarTypes[d.name] = this.exprType(initNode);
              const folded = this.tryFoldIntExpr(initNode);
              if ( folded.length > 0 ) {
                this.constScalarValues[d.name] = folded;
              }
              if ( this.scalarInitNeedsCtor(initNode) == true ) {
                this.moduleConstDeferred[d.name] = true;
              }
            }
          }
        }
      }
      i = i + 1;
    };
  };
  constArrayElem (d, arr) {
    if ( typeof(d.typeAnnotation) != "undefined" ) {
      const full = this.annotType(d.typeAnnotation);
      if ( full.length > 2 ) {
        return full.substring(1, (full.length - 1) );
      }
    }
    if ( arr.children.length > 0 ) {
      const first = arr.children[0];
      if ( first.nodeType == "ObjectExpression" ) {
        return this.registerModuleArrayStruct(d.name, arr);
      }
      if ( first.nodeType == "StringLiteral" ) {
        return "string";
      }
      if ( first.nodeType == "ArrayExpression" ) {
        return "[string]";
      }
      if ( first.nodeType == "NumericLiteral" ) {
        if ( this.containsChar(first.value, 46) ) {
          return "double";
        }
        return "int";
      }
    }
    return "int";
  };
  scalarInitNeedsCtor (node) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      return false;
    }
    if ( t == "StringLiteral" ) {
      return false;
    }
    if ( t == "BooleanLiteral" ) {
      return false;
    }
    const folded = this.tryFoldIntExpr(node);
    if ( folded.length > 0 ) {
      return false;
    }
    return true;
  };
  mergeArrayObjectFieldsCsv (arr) {
    let pairs = [];
    let seen = {};
    let k = 0;
    while (k < arr.children.length) {
      const el = arr.children[k];
      if ( el.nodeType == "ObjectExpression" ) {
        let j = 0;
        while (j < el.children.length) {
          const prop = el.children[j];
          if ( prop.nodeType == "Property" ) {
            const key = this.propKey(prop);
            if ( key.length > 0 ) {
              const was = ( Object.prototype.hasOwnProperty.call(seen, key) ? seen[key] : undefined );
              if ( typeof(was) === "undefined" ) {
                seen[key] = true;
                const valNode = this.propertyValueNode(prop);
                const ft = this.objectFieldType(key, valNode);
                pairs.push((key + ":") + ft);
              }
            }
          }
          j = j + 1;
        };
      }
      k = k + 1;
    };
    return this.joinCsv(pairs);
  };
  registerModuleArrayStruct (arrName, arr) {
    const baseName = arrName + "Elem";
    const structType = baseName + "Native";
    const done = ( Object.prototype.hasOwnProperty.call(this.synthStructDone, baseName) ? this.synthStructDone[baseName] : undefined );
    if ( typeof(done) === "undefined" ) {
      const csv = this.mergeArrayObjectFieldsCsv(arr);
      this.interfaceFieldsCsv[baseName] = csv;
      this.interfaceNames.push(baseName);
      this.synthStructDone[baseName] = true;
    }
    return structType;
  };
  registerModuleObjectStruct (constName, obj) {
    const baseName = constName + "Const";
    const structType = baseName + "Native";
    const done = ( Object.prototype.hasOwnProperty.call(this.synthStructDone, baseName) ? this.synthStructDone[baseName] : undefined );
    if ( typeof(done) === "undefined" ) {
      const csv = this.objectFieldsCsv(obj);
      this.interfaceFieldsCsv[baseName] = csv;
      this.interfaceNames.push(baseName);
      this.synthStructDone[baseName] = true;
    }
    return structType;
  };
  tryFoldIntExpr (node) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      if ( this.containsChar(node.value, 46) ) {
        return "";
      }
      return node.value;
    }
    if ( t == "Identifier" ) {
      const v = ( Object.prototype.hasOwnProperty.call(this.constScalarValues, node.name) ? this.constScalarValues[node.name] : undefined );
      if ( (typeof(v) !== "undefined" && v != null )  ) {
        return v;
      }
      return "";
    }
    if ( t == "BinaryExpression" ) {
      if ( typeof(node.left) === "undefined" ) {
        return "";
      }
      if ( typeof(node.right) === "undefined" ) {
        return "";
      }
      const lv = this.tryFoldIntExpr(node.left);
      const rv = this.tryFoldIntExpr(node.right);
      if ( lv.length == 0 ) {
        return "";
      }
      if ( rv.length == 0 ) {
        return "";
      }
      const li = this.parseIntStr(lv);
      const ri = this.parseIntStr(rv);
      const op = node.value;
      if ( op == "*" ) {
        return this.formatIntStr((li * ri));
      }
      if ( op == "+" ) {
        return this.formatIntStr((li + ri));
      }
      if ( op == "-" ) {
        return this.formatIntStr((li - ri));
      }
      if ( op == "/" ) {
        return this.formatIntStr(this.divInt(li, ri));
      }
      return "";
    }
    return "";
  };
  recordInterface (node) {
    this.interfaceNames.push(node.name);
    let pairs = [];
    if ( typeof(node.body) != "undefined" ) {
      const body = node.body;
      let i = 0;
      while (i < body.children.length) {
        const prop = body.children[i];
        if ( prop.name.length > 0 ) {
          let pt = "int";
          if ( typeof(prop.typeAnnotation) != "undefined" ) {
            pt = this.annotType(prop.typeAnnotation);
          }
          pairs.push((prop.name + ":") + pt);
        }
        i = i + 1;
      };
    }
    const ownCsv = this.joinCsv(pairs);
    const extNames = this.interfaceExtendsNames(node);
    if ( extNames.length > 0 ) {
      this.interfaceFieldsCsv[node.name] = this.mergeInterfaceFieldsCsv(ownCsv, extNames);
    } else {
      this.interfaceFieldsCsv[node.name] = ownCsv;
    }
  };
  interfaceExtendsNames (node) {
    let names = [];
    let i = 0;
    while (i < node.children.length) {
      const child = node.children[i];
      if ( child.nodeType == "TSExpressionWithTypeArguments" ) {
        if ( typeof(child.left) != "undefined" ) {
          const left = child.left;
          if ( left.nodeType == "TSTypeReference" ) {
            names.push(left.name);
          }
        }
      }
      i = i + 1;
    };
    return names;
  };
  mergeInterfaceFieldsCsv (ownCsv, extendsNames) {
    let ownOnly = {};
    let ownPairs = [];
    if ( ownCsv.length > 0 ) {
      const opairs = this.splitCsv(ownCsv);
      let k = 0;
      while (k < opairs.length) {
        const pair2 = opairs[k];
        const colon2 = pair2.indexOf(":");
        if ( colon2 > 0 ) {
          const fn2 = pair2.substring(0, colon2 );
          ownOnly[fn2] = true;
          ownPairs.push(pair2);
        }
        k = k + 1;
      };
    }
    let pairs = [];
    let i = 0;
    while (i < extendsNames.length) {
      const parent = extendsNames[i];
      const pcsv = ( Object.prototype.hasOwnProperty.call(this.interfaceFieldsCsv, parent) ? this.interfaceFieldsCsv[parent] : undefined );
      if ( (typeof(pcsv) !== "undefined" && pcsv != null )  ) {
        const ppairs = this.splitCsv(pcsv);
        let j = 0;
        while (j < ppairs.length) {
          const pair = ppairs[j];
          const colon = pair.indexOf(":");
          if ( colon > 0 ) {
            const fn = pair.substring(0, colon );
            const was = ( Object.prototype.hasOwnProperty.call(ownOnly, fn) ? ownOnly[fn] : undefined );
            if ( typeof(was) === "undefined" ) {
              pairs.push(pair);
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
    let m = 0;
    while (m < ownPairs.length) {
      pairs.push(ownPairs[m]);
      m = m + 1;
    };
    return this.joinCsv(pairs);
  };
  emitInterfaces () {
    let i = 0;
    while (i < this.interfaceNames.length) {
      const name = this.interfaceNames[i];
      this.emitLine("class " + (name + "Native {"));
      const csv = ( Object.prototype.hasOwnProperty.call(this.interfaceFieldsCsv, name) ? this.interfaceFieldsCsv[name] : undefined );
      if ( (typeof(csv) !== "undefined" && csv != null )  ) {
        const pairs = this.splitCsv(csv);
        let j = 0;
        while (j < pairs.length) {
          const pair = pairs[j];
          const colon = pair.indexOf(":");
          if ( colon > 0 ) {
            const fname = pair.substring(0, colon );
            const ftype = pair.substring((colon + 1), pair.length );
            this.emitLine(("    def " + fname) + ((":" + ftype) + (" " + this.zeroFor(ftype))));
          }
          j = j + 1;
        };
      }
      this.emitLine("}");
      this.emitLine("");
      i = i + 1;
    };
  };
  zeroFor (t) {
    if ( t == "double" ) {
      return "0.0";
    }
    if ( t == "int" ) {
      return "0";
    }
    if ( t == "i32" ) {
      return "0";
    }
    if ( t == "u8" ) {
      return "0";
    }
    if ( t == "u16" ) {
      return "0";
    }
    if ( t == "u32" ) {
      return "0";
    }
    if ( t == "f32" ) {
      return "0.0";
    }
    if ( t == "f64" ) {
      return "0.0";
    }
    if ( t == "string" ) {
      return "\"\"";
    }
    if ( t == "boolean" ) {
      return "false";
    }
    const first = t.substring(0, 1 );
    if ( first == "[" ) {
      return "";
    }
    return "(new " + (t + ")");
  };
  emitModuleSingleton (ast) {
    this.emitLine(("class " + this.moduleSingletonClass) + " @singleton(true) {");
    let needsCtor = false;
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      if ( node.nodeType == "VariableDeclaration" ) {
        let j = 0;
        while (j < node.children.length) {
          const d = node.children[j];
          if ( d.nodeType == "VariableDeclarator" ) {
            const isArr = ( Object.prototype.hasOwnProperty.call(this.constArrayNames, d.name) ? this.constArrayNames[d.name] : undefined );
            if ( (typeof(isArr) !== "undefined" && isArr != null )  ) {
              needsCtor = true;
              const elem = ( Object.prototype.hasOwnProperty.call(this.constArrayElemType, d.name) ? this.constArrayElemType[d.name] : undefined );
              let et = "int";
              if ( (typeof(elem) !== "undefined" && elem != null )  ) {
                et = elem;
              }
              this.emitLine(((("    def " + d.name) + ":[") + et) + "]");
            } else {
              const dep = ( Object.prototype.hasOwnProperty.call(this.moduleConstDeferred, d.name) ? this.moduleConstDeferred[d.name] : undefined );
              if ( (typeof(dep) !== "undefined" && dep != null )  ) {
                needsCtor = true;
                if ( typeof(d.init) != "undefined" ) {
                  const initNode = d.init;
                  let ct = this.exprType(initNode);
                  const stored = ( Object.prototype.hasOwnProperty.call(this.constScalarTypes, d.name) ? this.constScalarTypes[d.name] : undefined );
                  if ( (typeof(stored) !== "undefined" && stored != null )  ) {
                    ct = stored;
                  }
                  this.emitLine((("    def " + d.name) + (":" + ct)) + (" " + this.zeroFor(ct)));
                }
              } else {
                if ( typeof(d.init) != "undefined" ) {
                  const initNode2 = d.init;
                  const ct2 = this.exprType(initNode2);
                  let rhs = "";
                  const fv = ( Object.prototype.hasOwnProperty.call(this.constScalarValues, d.name) ? this.constScalarValues[d.name] : undefined );
                  if ( (typeof(fv) !== "undefined" && fv != null )  ) {
                    rhs = fv;
                  } else {
                    rhs = this.emitExpr(initNode2, ct2);
                  }
                  this.emitLine((("    def " + d.name) + (":" + ct2)) + (" " + rhs));
                }
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
    if ( needsCtor ) {
      this.emitLine("    Constructor () {");
      this.indentLevel = 2;
      this.inModuleSingletonCtor = true;
      let k = 0;
      while (k < ast.children.length) {
        const node2 = ast.children[k];
        if ( node2.nodeType == "VariableDeclaration" ) {
          let m = 0;
          while (m < node2.children.length) {
            const d2 = node2.children[m];
            if ( d2.nodeType == "VariableDeclarator" ) {
              const isArr2 = ( Object.prototype.hasOwnProperty.call(this.constArrayNames, d2.name) ? this.constArrayNames[d2.name] : undefined );
              if ( (typeof(isArr2) !== "undefined" && isArr2 != null )  ) {
                const elem2 = ( Object.prototype.hasOwnProperty.call(this.constArrayElemType, d2.name) ? this.constArrayElemType[d2.name] : undefined );
                let et2 = "int";
                if ( (typeof(elem2) !== "undefined" && elem2 != null )  ) {
                  et2 = elem2;
                }
                const tmpName = "_boot_" + d2.name;
                this.emitLine(((("def " + tmpName) + ":[") + et2) + "]");
                if ( typeof(d2.init) != "undefined" ) {
                  const arr = d2.init;
                  if ( arr.nodeType == "ArrayExpression" ) {
                    let n = 0;
                    while (n < arr.children.length) {
                      const el = arr.children[n];
                      const ev = this.emitValueExpr(el, et2);
                      this.emitLine((("push " + tmpName) + " ") + ev);
                      n = n + 1;
                    };
                  }
                }
                this.emitLine(d2.name + (" = " + tmpName));
              }
              const dep2 = ( Object.prototype.hasOwnProperty.call(this.moduleConstDeferred, d2.name) ? this.moduleConstDeferred[d2.name] : undefined );
              if ( (typeof(dep2) !== "undefined" && dep2 != null )  ) {
                if ( typeof(d2.init) != "undefined" ) {
                  const init3 = d2.init;
                  if ( init3.nodeType == "ObjectExpression" ) {
                    const ost2 = ( Object.prototype.hasOwnProperty.call(this.constScalarTypes, d2.name) ? this.constScalarTypes[d2.name] : undefined );
                    let ostype = "int";
                    if ( (typeof(ost2) !== "undefined" && ost2 != null )  ) {
                      ostype = ost2;
                    }
                    const tmpO = "_boot_" + d2.name;
                    this.emitStructFromObject(init3, tmpO, ostype);
                    this.emitLine(d2.name + (" = " + tmpO));
                  } else {
                    const ct3 = this.exprType(init3);
                    const rhs3 = this.emitExpr(init3, ct3);
                    this.emitLine(d2.name + (" = " + rhs3));
                  }
                }
              }
            }
            m = m + 1;
          };
        }
        k = k + 1;
      };
      this.indentLevel = 0;
      this.inModuleSingletonCtor = false;
      this.emitLine("    }");
    }
    this.emitLine("}");
  };
  emitConstFields (ast) {
    let i = 0;
    while (i < ast.children.length) {
      const node = ast.children[i];
      if ( node.nodeType == "VariableDeclaration" ) {
        let j = 0;
        while (j < node.children.length) {
          const d = node.children[j];
          if ( d.nodeType == "VariableDeclarator" ) {
            const isArr = ( Object.prototype.hasOwnProperty.call(this.constArrayNames, d.name) ? this.constArrayNames[d.name] : undefined );
            if ( typeof(isArr) === "undefined" ) {
              if ( typeof(d.init) != "undefined" ) {
                const initNode = d.init;
                const ct = this.exprType(initNode);
                let rhs = "";
                const fv = ( Object.prototype.hasOwnProperty.call(this.constScalarValues, d.name) ? this.constScalarValues[d.name] : undefined );
                if ( (typeof(fv) !== "undefined" && fv != null )  ) {
                  rhs = fv;
                } else {
                  rhs = this.emitExpr(initNode, ct);
                }
                this.emitLine((("    def " + d.name) + (":" + ct)) + (" " + rhs));
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
    this.emitLine("");
  };
  emitConstArrayMethods (node) {
    let j = 0;
    while (j < node.children.length) {
      const d = node.children[j];
      if ( d.nodeType == "VariableDeclarator" ) {
        const isArr = ( Object.prototype.hasOwnProperty.call(this.constArrayNames, d.name) ? this.constArrayNames[d.name] : undefined );
        if ( (typeof(isArr) !== "undefined" && isArr != null )  ) {
          const elem = ( Object.prototype.hasOwnProperty.call(this.constArrayElemType, d.name) ? this.constArrayElemType[d.name] : undefined );
          let et = "int";
          if ( (typeof(elem) !== "undefined" && elem != null )  ) {
            et = elem;
          }
          this.emitLine(((("    fn " + d.name) + ":[") + et) + "] () {");
          this.emitLine(("        def out:[" + et) + "]");
          if ( typeof(d.init) != "undefined" ) {
            const arr = d.init;
            if ( arr.nodeType == "ArrayExpression" ) {
              let k = 0;
              while (k < arr.children.length) {
                const el = arr.children[k];
                const ev = this.emitExpr(el, et);
                this.emitLine("        push out " + ev);
                k = k + 1;
              };
            }
          }
          this.emitLine("        return out");
          this.emitLine("    }");
          this.emitLine("");
        }
      }
      j = j + 1;
    };
  };
  emitFunction (node) {
    this.currentFn = node.name;
    this.inferFnName = node.name;
    this.inSpritesFn = this.currentFn == "sprites";
    this.inInitFn = this.currentFn == "initState";
    this.inUpdateFn = this.currentFn == "update";
    this.inResourcesFn = this.currentFn == "resources";
    let fresh = {};
    this.varTypes = fresh;
    this.stateVarName = "s";
    let freshIds = [];
    this.readEntityIds = freshIds;
    let freshSeen = {};
    this.readEntitySeen = freshSeen;
    let freshPlayers = [];
    this.readPlayerIndices = freshPlayers;
    let freshPlayerSeen = {};
    this.readPlayerSeen = freshPlayerSeen;
    this.inputVarName = "input";
    const isHelper = this.isSpecialFn(this.currentFn) == false;
    let retType = "void";
    if ( this.inSpritesFn ) {
      retType = "[SpriteDefNative]";
    }
    if ( this.inResourcesFn ) {
      retType = "[ResourceDefNative]";
    }
    if ( this.inInitFn ) {
      retType = "NativeGameState";
    }
    if ( this.inUpdateFn ) {
      retType = "NativeGameState";
    }
    if ( this.currentFn == "hud" ) {
      this.emitLine("    fn hud:void (props:UpdatePropsNative) {");
      this.emitLine("        ; omitted on native path (score drawn by NativeGameRunner)");
      this.emitLine("    }");
      this.emitLine("");
      return;
    }
    if ( isHelper ) {
      retType = this.helperReturnType(this.currentFn);
    }
    const params = this.emitParams(node.params);
    this.emitLine((("    fn " + this.currentFn) + (":" + retType)) + ((" (" + params) + ") {"));
    if ( typeof(node.body) === "undefined" ) {
      this.emitLine("    }");
      return;
    }
    const body = node.body;
    this.indentLevel = 2;
    this.emitModuleLocalIfNeeded(body);
    if ( this.inUpdateFn ) {
      this.prescanStateVar(body);
      this.collectEntityReads(body);
      this.collectInputPlayerReads(body);
      this.emitStateBinding(body);
      this.emitEntityHoists();
      this.emitInputPlayerHoists();
      this.emitBlockBodySkippingStateDecl(body);
    } else {
      this.emitBlockBody(body);
    }
    this.indentLevel = 0;
    this.emitLine("    }");
    this.emitLine("");
  };
  emitStateBinding (body) {
    this.emitLine(("def " + this.stateVarName) + ":NativeGameState (props.state)");
    this.varTypes[this.stateVarName] = "NativeGameState";
  };
  emitEntityHoists () {
    let i = 0;
    while (i < this.readEntityIds.length) {
      const id = this.readEntityIds[i];
      this.emitLine((((("def in_" + id) + ":EntityPoseNative (unwrap (get ") + this.stateVarName) + (".entities \"" + id)) + "\"))");
      i = i + 1;
    };
  };
  emitBlockBodySkippingStateDecl (block) {
    let i = 0;
    while (i < block.children.length) {
      const stmt = block.children[i];
      if ( this.isStateVarDecl(stmt) ) {
        i = i + 1;
        continue;
      }
      this.emitStatement(stmt);
      i = i + 1;
    };
  };
  isStateVarDecl (stmt) {
    if ( stmt.nodeType != "VariableDeclaration" ) {
      return false;
    }
    let i = 0;
    while (i < stmt.children.length) {
      const d = stmt.children[i];
      if ( d.nodeType == "VariableDeclarator" ) {
        if ( d.name == this.stateVarName ) {
          if ( typeof(d.init) != "undefined" ) {
            const initNode = d.init;
            if ( this.isPropsStateMember(initNode) ) {
              return true;
            }
          }
        }
        if ( typeof(d.init) != "undefined" ) {
          const initNode2 = d.init;
          if ( this.isPropsInputMember(initNode2) ) {
            this.inputVarName = d.name;
          }
        }
      }
      i = i + 1;
    };
    return false;
  };
  isPropsInputMember (node) {
    if ( node.nodeType != "MemberExpression" ) {
      return false;
    }
    if ( node.name != "input" ) {
      return false;
    }
    if ( typeof(node.left) === "undefined" ) {
      return false;
    }
    const base = node.left;
    if ( base.nodeType != "Identifier" ) {
      return false;
    }
    return base.name == "props";
  };
  isPropsStateMember (node) {
    if ( node.nodeType != "MemberExpression" ) {
      return false;
    }
    if ( node.name != "state" ) {
      return false;
    }
    if ( typeof(node.left) === "undefined" ) {
      return false;
    }
    const base = node.left;
    if ( base.nodeType == "Identifier" ) {
      return base.name == "props";
    }
    return false;
  };
  prescanStateVar (node) {
    if ( node.nodeType == "VariableDeclaration" ) {
      let i = 0;
      while (i < node.children.length) {
        const d = node.children[i];
        if ( d.nodeType == "VariableDeclarator" ) {
          if ( typeof(d.init) != "undefined" ) {
            if ( this.isPropsStateMember(d.init) ) {
              this.stateVarName = d.name;
            }
            if ( this.isPropsInputMember(d.init) ) {
              this.inputVarName = d.name;
            }
          }
        }
        i = i + 1;
      };
    }
    this.walkChildren(node, "prescanStateVar");
  };
  collectEntityReads (node) {
    if ( node.nodeType == "MemberExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const base = node.left;
        if ( base.nodeType == "MemberExpression" ) {
          if ( base.name == "entities" ) {
            const id = node.name;
            if ( id.length > 0 ) {
              const seen = ( Object.prototype.hasOwnProperty.call(this.readEntitySeen, id) ? this.readEntitySeen[id] : undefined );
              if ( typeof(seen) === "undefined" ) {
                this.readEntitySeen[id] = true;
                this.readEntityIds.push(id);
              }
            }
          }
        }
      }
    }
    this.walkChildren(node, "collectEntityReads");
  };
  inputPlayerIndex (node) {
    if ( node.nodeType != "MemberExpression" ) {
      return "";
    }
    if ( typeof(node.left) === "undefined" ) {
      return "";
    }
    const idxAccess = node.left;
    if ( idxAccess.nodeType != "MemberExpression" ) {
      return "";
    }
    if ( idxAccess.computed == false ) {
      return "";
    }
    if ( typeof(idxAccess.left) === "undefined" ) {
      return "";
    }
    const playersAccess = idxAccess.left;
    if ( playersAccess.nodeType != "MemberExpression" ) {
      return "";
    }
    if ( playersAccess.name != "players" ) {
      return "";
    }
    if ( typeof(playersAccess.left) === "undefined" ) {
      return "";
    }
    const root = playersAccess.left;
    if ( root.nodeType != "Identifier" ) {
      return "";
    }
    if ( root.name != this.inputVarName ) {
      return "";
    }
    if ( typeof(idxAccess.right) === "undefined" ) {
      return "";
    }
    const idxNode = idxAccess.right;
    if ( idxNode.nodeType != "NumericLiteral" ) {
      return "";
    }
    return idxNode.value;
  };
  collectInputPlayerReads (node) {
    const idx = this.inputPlayerIndex(node);
    if ( idx.length > 0 ) {
      const seen = ( Object.prototype.hasOwnProperty.call(this.readPlayerSeen, idx) ? this.readPlayerSeen[idx] : undefined );
      if ( typeof(seen) === "undefined" ) {
        this.readPlayerSeen[idx] = true;
        this.readPlayerIndices.push(idx);
      }
    }
    this.walkChildren(node, "collectInputPlayerReads");
  };
  emitInputPlayerHoists () {
    let i = 0;
    while (i < this.readPlayerIndices.length) {
      const idx = this.readPlayerIndices[i];
      const localName = "in_pl" + idx;
      this.emitLine(((("def " + localName) + ":PlayerInputNative (itemAt props.input.players ") + idx) + ")");
      i = i + 1;
    };
  };
  walkChildren (node, visitor) {
    if ( typeof(node.left) != "undefined" ) {
      this.dispatchVisit(node.left, visitor);
    }
    if ( typeof(node.right) != "undefined" ) {
      this.dispatchVisit(node.right, visitor);
    }
    if ( typeof(node.body) != "undefined" ) {
      this.dispatchVisit(node.body, visitor);
    }
    if ( typeof(node.init) != "undefined" ) {
      this.dispatchVisit(node.init, visitor);
    }
    if ( typeof(node.test) != "undefined" ) {
      this.dispatchVisit(node.test, visitor);
    }
    if ( typeof(node.consequent) != "undefined" ) {
      this.dispatchVisit(node.consequent, visitor);
    }
    if ( typeof(node.alternate) != "undefined" ) {
      this.dispatchVisit(node.alternate, visitor);
    }
    let i = 0;
    while (i < node.children.length) {
      this.dispatchVisit(node.children[i], visitor);
      i = i + 1;
    };
  };
  dispatchVisit (node, visitor) {
    if ( visitor == "prescanStateVar" ) {
      this.prescanStateVar(node);
      return;
    }
    if ( visitor == "collectEntityReads" ) {
      this.collectEntityReads(node);
      return;
    }
    if ( visitor == "collectInputPlayerReads" ) {
      this.collectInputPlayerReads(node);
      return;
    }
  };
  emitParams (params) {
    if ( this.inUpdateFn ) {
      this.varTypes["props"] = "UpdatePropsNative";
      return "props:UpdatePropsNative";
    }
    let parts = [];
    let i = 0;
    while (i < params.length) {
      const p = params[i];
      let pt = "int";
      if ( typeof(p.typeAnnotation) != "undefined" ) {
        pt = this.annotType(p.typeAnnotation);
      } else {
        const fromReg = this.helperParamType(this.currentFn, i);
        if ( fromReg.length > 0 ) {
          pt = fromReg;
        }
      }
      this.varTypes[p.name] = pt;
      parts.push((p.name + ":") + this.fnSigType(pt));
      i = i + 1;
    };
    return this.joinSpace(parts);
  };
  joinSpace (items) {
    let out = "";
    let i = 0;
    while (i < items.length) {
      if ( i > 0 ) {
        out = out + " ";
      }
      out = out + items[i];
      i = i + 1;
    };
    return out;
  };
  emitBlockBody (block) {
    this.currentEmitBlock = block;
    let i = 0;
    while (i < block.children.length) {
      const stmt = block.children[i];
      this.emitStatement(stmt);
      i = i + 1;
    };
  };
  emitStatement (stmt) {
    const t = stmt.nodeType;
    this.hoistStmtItemAt(stmt);
    if ( t == "VariableDeclaration" ) {
      this.emitVarDecl(stmt);
      return;
    }
    if ( t == "IfStatement" ) {
      this.emitIf(stmt);
      return;
    }
    if ( t == "ReturnStatement" ) {
      this.emitReturn(stmt);
      return;
    }
    if ( t == "ExpressionStatement" ) {
      this.emitExpressionStatement(stmt);
      return;
    }
    if ( t == "WhileStatement" ) {
      this.emitWhile(stmt);
      return;
    }
    if ( t == "BlockStatement" ) {
      this.emitBlockBody(stmt);
      return;
    }
  };
  hoistStmtItemAt (stmt) {
    let fresh = {};
    this.hoistedItemAt = fresh;
    this.collectItemAtReceivers(stmt);
  };
  collectItemAtReceivers (node) {
    if ( node.nodeType == "IfStatement" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.collectItemAtReceivers(node.left);
      }
      if ( typeof(node.body) != "undefined" ) {
        this.collectItemAtReceiversInStmt(node.body);
      }
      if ( typeof(node.right) != "undefined" ) {
        this.collectItemAtReceiversInStmt(node.right);
      }
      return;
    }
    if ( node.nodeType == "WhileStatement" ) {
      if ( typeof(node.test) != "undefined" ) {
        this.collectItemAtReceivers(node.test);
      }
      return;
    }
    if ( node.nodeType == "MemberExpression" ) {
      if ( node.computed == false ) {
        if ( typeof(node.left) != "undefined" ) {
          const base = node.left;
          if ( base.nodeType == "MemberExpression" ) {
            if ( base.computed ) {
              this.registerItemAtHoist(base);
            }
          }
        }
      }
    }
    if ( typeof(node.left) != "undefined" ) {
      const ln = node.left;
      if ( ln.nodeType != "BlockStatement" ) {
        this.collectItemAtReceivers(ln);
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      const rn = node.right;
      if ( rn.nodeType != "BlockStatement" ) {
        this.collectItemAtReceivers(rn);
      }
    }
    if ( typeof(node.test) != "undefined" ) {
      this.collectItemAtReceivers(node.test);
    }
    let i = 0;
    while (i < node.children.length) {
      const ch = node.children[i];
      if ( ch.nodeType != "BlockStatement" ) {
        this.collectItemAtReceivers(ch);
      }
      i = i + 1;
    };
  };
  collectItemAtReceiversInStmt (stmt) {
    if ( stmt.nodeType == "BlockStatement" ) {
      let i = 0;
      while (i < stmt.children.length) {
        this.collectItemAtReceivers(stmt.children[i]);
        i = i + 1;
      };
      return;
    }
    this.collectItemAtReceivers(stmt);
  };
  registerItemAtHoist (computed) {
    if ( typeof(computed.left) === "undefined" ) {
      return;
    }
    if ( typeof(computed.right) === "undefined" ) {
      return;
    }
    const baseType = this.exprType(computed.left);
    const et = this.elemTypeOf(baseType);
    if ( this.endsWith(et, "Native") == false ) {
      return;
    }
    const raw = this.rawItemAt(computed);
    const existing = ( Object.prototype.hasOwnProperty.call(this.hoistedItemAt, raw) ? this.hoistedItemAt[raw] : undefined );
    if ( (typeof(existing) !== "undefined" && existing != null )  ) {
      return;
    }
    const localName = "_at" + ("" + this.itemAtCounter);
    this.itemAtCounter = this.itemAtCounter + 1;
    this.hoistedItemAt[raw] = localName;
    this.emitLine((((("def " + localName) + ":") + et) + " ") + raw);
  };
  rawItemAt (computed) {
    const base = this.emitExpr(computed.left, "int");
    const idxNode = computed.right;
    const idxT = this.exprType(idxNode);
    let idx = this.emitExpr(idxNode, idxT);
    if ( idxT == "double" ) {
      idx = ("(to_int " + idx) + ")";
    }
    return ((("(itemAt " + base) + " ") + idx) + ")";
  };
  emitWhile (node) {
    let cond = "false";
    if ( typeof(node.left) != "undefined" ) {
      cond = this.emitExpr(node.left, "boolean");
    }
    this.emitLine(("while (" + cond) + ") {");
    this.indent();
    if ( typeof(node.body) != "undefined" ) {
      const b = node.body;
      if ( b.nodeType == "BlockStatement" ) {
        this.emitBlockBody(b);
      } else {
        this.emitStatement(b);
      }
    }
    this.dedent();
    this.emitLine("}");
  };
  emitExpressionStatement (stmt) {
    if ( typeof(stmt.left) === "undefined" ) {
      return;
    }
    const expr = stmt.left;
    if ( expr.nodeType == "AssignmentExpression" ) {
      this.emitAssignment(expr);
      return;
    }
    if ( expr.nodeType == "CallExpression" ) {
      this.emitCallStatement(expr);
      return;
    }
  };
  emitCallStatement (node) {
    if ( typeof(node.left) === "undefined" ) {
      return;
    }
    const callee = node.left;
    if ( callee.nodeType == "MemberExpression" ) {
      if ( callee.name == "push" ) {
        if ( typeof(callee.left) != "undefined" ) {
          const base = this.emitExpr(callee.left, "int");
          const et = this.elemTypeOf(this.exprType(callee.left));
          let argStr = "";
          if ( node.children.length > 0 ) {
            const argNode = node.children[0];
            argStr = this.emitValueExpr(argNode, et);
            if ( argNode.nodeType == "CallExpression" ) {
              argStr = ("(" + argStr) + ")";
            }
          }
          this.emitLine((("push " + base) + " ") + argStr);
          return;
        }
      }
    }
    this.emitLine(this.emitCall(node));
  };
  emitAssignment (node) {
    const targetNode = node.left;
    const rhsNode = node.right;
    if ( targetNode.nodeType == "MemberExpression" ) {
      this.emitMemberAssign(targetNode, rhsNode);
      return;
    }
    const lhs = this.emitAssignTarget(targetNode);
    const expected = this.assignTargetType(targetNode);
    let rhs = this.emitExpr(rhsNode, expected);
    rhs = this.coerceToType(rhs, rhsNode, expected);
    this.emitLine((lhs + " = ") + rhs);
    if ( targetNode.nodeType == "Identifier" ) {
      const rhsT = this.exprType(rhsNode);
      if ( rhsT == "double" ) {
        if ( expected == "int" ) {
          this.varTypes[targetNode.name] = "double";
        }
      }
    }
  };
  emitMemberAssign (target, rhs) {
    if ( typeof(target.left) === "undefined" ) {
      return;
    }
    const baseNode = target.left;
    const baseType = this.exprType(baseNode);
    const base = this.emitExpr(baseNode, "int");
    if ( this.startsWith(baseType, "[string:") ) {
      const valType = this.elemTypeOf(baseType);
      let key = "";
      if ( target.computed ) {
        if ( typeof(target.right) != "undefined" ) {
          const keyNode = target.right;
          key = this.emitExpr(keyNode, "string");
          if ( keyNode.nodeType == "CallExpression" ) {
            key = ("(" + key) + ")";
          }
        }
      } else {
        key = ("\"" + target.name) + "\"";
      }
      const valExpr = this.emitRhsValue(rhs, valType);
      this.emitLine((((("set " + base) + " ") + key) + " ") + valExpr);
      return;
    }
    if ( target.computed ) {
      const et = this.elemTypeOf(baseType);
      let idxT = "int";
      let idx = "0";
      if ( typeof(target.right) != "undefined" ) {
        idxT = this.exprType(target.right);
        idx = this.emitExpr(target.right, idxT);
        if ( idxT == "double" ) {
          idx = ("(to_int " + idx) + ")";
        }
      }
      let valExpr_1 = this.emitRhsValue(rhs, et);
      valExpr_1 = this.coerceToType(valExpr_1, rhs, et);
      this.emitLine((((("set " + base) + " ") + idx) + " ") + valExpr_1);
      return;
    }
    if ( target.name == "events" ) {
      if ( rhs.nodeType == "ArrayExpression" ) {
        const evExpr = this.emitRhsValue(rhs, "[GameEventNative]");
        this.emitLine((base + ".events = ") + evExpr);
        return;
      }
    }
    if ( baseNode.nodeType == "Identifier" ) {
      const bvt = this.lookupVarType(baseNode.name);
      if ( bvt == "NativeGameState" ) {
        if ( this.isObjectStateField(target.name) ) {
          const ost = this.objectStateFieldTypeOf(target.name);
          const valExpr_2 = this.emitRhsValue(rhs, ost);
          this.emitLine(("st_" + target.name) + (" = " + valExpr_2));
          return;
        }
        if ( this.isNativeStateField(target.name) == false ) {
          if ( this.isStateArrayField(target.name) == false ) {
            const valNum = this.emitRhsValue(rhs, "double");
            this.emitLine((((("set " + baseNode.name) + ".numbers \"") + target.name) + "\" ") + valNum);
            return;
          }
        }
      }
    }
    let ft = this.structFieldType(baseType, target.name);
    if ( ft.length == 0 ) {
      ft = this.fieldType(target.name);
    }
    let v = this.emitExpr(rhs, ft);
    if ( ft == "double" ) {
      const rt = this.exprType(rhs);
      if ( rt == "int" ) {
        if ( rhs.nodeType != "NumericLiteral" ) {
          if ( rhs.nodeType != "Identifier" ) {
            let skip = false;
            if ( v.length >= 4 ) {
              if ( v.substring(0, 4 ) == "(0.0" ) {
                skip = true;
              }
            }
            if ( v.length >= 10 ) {
              if ( v.substring(0, 10 ) == "(to_double" ) {
                skip = true;
              }
            }
            if ( skip == false ) {
              v = ("(to_double " + v) + ")";
            }
          }
        }
      }
    }
    this.emitLine(((base + ".") + target.name) + (" = " + v));
  };
  emitRhsValue (node, expected) {
    return this.emitValueExpr(node, expected);
  };
  emitValueExpr (node, expected) {
    if ( node.nodeType == "ObjectExpression" ) {
      if ( this.endsWith(expected, "Native") ) {
        if ( node.children.length == 0 ) {
          return ("(new " + expected) + ")";
        }
        const tmp = "tmp" + ("" + this.tmpCounter);
        this.tmpCounter = this.tmpCounter + 1;
        this.emitStructFromObject(node, tmp, expected);
        return tmp;
      }
    }
    if ( node.nodeType == "ArrayExpression" ) {
      if ( this.startsWith(expected, "[") ) {
        const et = this.elemTypeOf(expected);
        const tmp2 = "tmp" + ("" + this.tmpCounter);
        this.tmpCounter = this.tmpCounter + 1;
        this.emitLine((("def " + tmp2) + ":") + expected);
        let k = 0;
        while (k < node.children.length) {
          const el = node.children[k];
          const ev = this.emitValueExpr(el, et);
          this.emitLine((("push " + tmp2) + " ") + ev);
          k = k + 1;
        };
        return tmp2;
      }
    }
    return this.emitExpr(node, expected);
  };
  startsWith (s, prefix) {
    const plen = prefix.length;
    if ( plen > s.length ) {
      return false;
    }
    return s.substring(0, plen ) == prefix;
  };
  assignTargetType (node) {
    if ( node.nodeType == "Identifier" ) {
      const vt = this.lookupVarType(node.name);
      if ( vt.length > 0 ) {
        return vt;
      }
      return "int";
    }
    if ( node.nodeType == "MemberExpression" ) {
      return this.fieldType(node.name);
    }
    return "int";
  };
  emitAssignTarget (node) {
    if ( node.nodeType == "Identifier" ) {
      return node.name;
    }
    if ( node.nodeType == "MemberExpression" ) {
      return this.emitMember(node, "int");
    }
    return "tmp";
  };
  emitVarDecl (node) {
    let i = 0;
    while (i < node.children.length) {
      const d = node.children[i];
      if ( d.nodeType != "VariableDeclarator" ) {
        i = i + 1;
        continue;
      }
      const name = d.name;
      let hasAnnot = false;
      let rtype = "int";
      if ( typeof(d.typeAnnotation) != "undefined" ) {
        rtype = this.annotType(d.typeAnnotation);
        hasAnnot = true;
      }
      if ( typeof(d.init) === "undefined" ) {
        const emitType0 = this.localVarType(rtype);
        this.varTypes[name] = emitType0;
        this.emitLine(("def " + name) + (":" + emitType0));
        i = i + 1;
        continue;
      }
      const initNode = d.init;
      if ( hasAnnot == false ) {
        rtype = this.exprType(initNode);
      }
      if ( initNode.nodeType == "ObjectExpression" ) {
        if ( this.endsWith(rtype, "Native") == false ) {
          const known = this.matchKnownStruct(initNode);
          if ( known.length > 0 ) {
            rtype = known;
          } else {
            const iface = this.matchRecordedInterface(initNode);
            if ( iface.length > 0 ) {
              rtype = iface;
            }
          }
        }
      }
      if ( initNode.nodeType == "NumericLiteral" ) {
        if ( this.inUpdateFn ) {
          if ( this.endsWith(name, "vy") ) {
            rtype = "double";
          }
        }
      }
      if ( initNode.nodeType == "ArrayExpression" ) {
        if ( initNode.children.length == 0 ) {
          const pushed = this.findPushArgType(this.currentEmitBlock, name);
          if ( pushed.length > 0 ) {
            rtype = ("[" + pushed) + "]";
          }
          if ( this.inUpdateFn && name == "events" ) {
            if ( pushed.length == 0 ) {
              rtype = "[GameEventNative]";
            }
          }
          if ( pushed.length == 0 ) {
            const annElem = this.helperAnnotatedArrayElem(this.currentFn);
            if ( annElem.length > 0 ) {
              rtype = ("[" + annElem) + "]";
            }
          }
          if ( pushed.length == 0 ) {
            if ( this.inUpdateFn ) {
              const ost = this.objectStateFieldTypeOf(name);
              if ( this.startsWith(ost, "[") ) {
                rtype = ost;
              }
            }
          }
        }
      }
      const emitType = this.localVarType(rtype);
      this.varTypes[name] = emitType;
      if ( initNode.nodeType == "ArrayExpression" ) {
        const et = this.elemTypeOf(rtype);
        this.emitLine((("def " + name) + ":") + emitType);
        let k = 0;
        while (k < initNode.children.length) {
          const el = initNode.children[k];
          const ev = this.emitValueExpr(el, et);
          this.emitLine((("push " + name) + " ") + ev);
          k = k + 1;
        };
        i = i + 1;
        continue;
      }
      if ( initNode.nodeType == "ObjectExpression" ) {
        if ( this.endsWith(rtype, "Native") ) {
          this.emitStructFromObject(initNode, name, emitType);
          i = i + 1;
          continue;
        }
        if ( initNode.children.length == 0 ) {
          if ( this.startsWith(rtype, "[") ) {
            this.emitLine((("def " + name) + ":") + rtype);
            i = i + 1;
            continue;
          }
        }
      }
      const rhs = this.emitExpr(initNode, emitType);
      this.emitLine((("def " + name) + (":" + emitType)) + ((" (" + rhs) + ")"));
      i = i + 1;
    };
  };
  emitStructFromObject (node, varName, structType) {
    this.emitLine(((("def " + varName) + ":") + structType) + ((" (new " + structType) + ")"));
    let i = 0;
    while (i < node.children.length) {
      const prop = node.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        let ft = this.structFieldType(structType, key);
        if ( ft.length == 0 ) {
          ft = this.fieldType(key);
        }
        const valNode = this.propertyValueNode(prop);
        let v = this.emitValueExpr(valNode, ft);
        if ( valNode.nodeType == "Identifier" ) {
          if ( valNode.name == key ) {
            const tmpF = "_fv" + ("" + this.tmpCounter);
            this.tmpCounter = this.tmpCounter + 1;
            const at = this.exprType(valNode);
            if ( ft == "double" && (at == "int" || at == "i32") ) {
              this.emitLine(((("def " + tmpF) + ":double (to_double ") + v) + ")");
            } else {
              if ( (ft == "int" || ft == "i32") && at == "double" ) {
                this.emitLine(((("def " + tmpF) + ":i32 (to_int ") + v) + ")");
              } else {
                this.emitLine(((("def " + tmpF) + ":") + ft) + ((" (" + v) + ")"));
              }
            }
            v = tmpF;
          }
        }
        if ( ft == "double" ) {
          const rt = this.exprType(valNode);
          if ( rt == "int" || rt == "i32" ) {
            let skip = false;
            if ( v.length >= 10 ) {
              if ( v.substring(0, 10 ) == "(to_double" ) {
                skip = true;
              }
            }
            if ( this.containsChar(v, 46) ) {
              skip = true;
            }
            if ( skip == false ) {
              v = ("(to_double " + v) + ")";
            }
          }
        }
        this.emitLine((varName + ".") + (key + (" = " + v)));
      }
      i = i + 1;
    };
  };
  emitIf (node) {
    if ( this.inUpdateFn ) {
      if ( typeof(node.left) != "undefined" ) {
        const test = node.left;
        if ( test.nodeType == "Identifier" ) {
          if ( test.name == "input" ) {
            if ( typeof(node.body) != "undefined" ) {
              const cons = node.body;
              if ( cons.nodeType == "BlockStatement" ) {
                this.emitBlockBody(cons);
              } else {
                this.emitStatement(cons);
              }
            }
            return;
          }
        }
        if ( test.nodeType == "MemberExpression" ) {
          if ( test.computed ) {
            if ( typeof(test.left) != "undefined" ) {
              const base = test.left;
              if ( base.nodeType == "MemberExpression" ) {
                if ( base.name == "players" ) {
                  if ( typeof(base.left) != "undefined" ) {
                    const root = base.left;
                    if ( root.nodeType == "Identifier" ) {
                      if ( root.name == "input" ) {
                        let idxLit = "0";
                        if ( typeof(test.right) != "undefined" ) {
                          const idxNode = test.right;
                          if ( idxNode.nodeType == "NumericLiteral" ) {
                            idxLit = idxNode.value;
                          }
                        }
                        let minLen = "1";
                        if ( idxLit == "1" ) {
                          minLen = "2";
                        }
                        if ( idxLit == "2" ) {
                          minLen = "3";
                        }
                        let ifLine = "if ((array_length input.players) >= ";
                        ifLine = ifLine + minLen;
                        ifLine = ifLine + ") {";
                        this.emitLine(ifLine);
                        this.indent();
                        if ( typeof(node.body) != "undefined" ) {
                          const cons2 = node.body;
                          if ( cons2.nodeType == "BlockStatement" ) {
                            this.emitBlockBody(cons2);
                          } else {
                            this.emitStatement(cons2);
                          }
                        }
                        this.dedent();
                        this.emitLine("}");
                        return;
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
    if ( typeof(node.left) != "undefined" ) {
      const ttest = node.left;
      if ( this.isTruthyObjectTest(ttest) ) {
        if ( typeof(node.right) === "undefined" ) {
          if ( typeof(node.body) != "undefined" ) {
            const tcons = node.body;
            if ( tcons.nodeType == "BlockStatement" ) {
              this.emitBlockBody(tcons);
            } else {
              this.emitStatement(tcons);
            }
          }
          return;
        }
      }
    }
    let cond = "";
    if ( typeof(node.left) != "undefined" ) {
      const ttest2 = node.left;
      if ( this.isTruthyObjectTest(ttest2) ) {
        cond = "true";
      } else {
        cond = this.emitExpr(ttest2, "boolean");
      }
    }
    this.emitLine(("if (" + cond) + ") {");
    this.indent();
    if ( typeof(node.body) != "undefined" ) {
      const cons_1 = node.body;
      if ( cons_1.nodeType == "BlockStatement" ) {
        this.emitBlockBody(cons_1);
      } else {
        this.emitStatement(cons_1);
      }
    }
    this.dedent();
    if ( typeof(node.right) != "undefined" ) {
      this.emitLine("} {");
      this.indent();
      const alt = node.right;
      if ( alt.nodeType == "BlockStatement" ) {
        this.emitBlockBody(alt);
      } else {
        this.emitStatement(alt);
      }
      this.dedent();
      this.emitLine("}");
      return;
    }
    this.emitLine("}");
  };
  isTruthyObjectTest (node) {
    const t = node.nodeType;
    if ( t == "Identifier" ) {
      if ( this.startsWith(node.name, "st_") ) {
        return true;
      }
      const vt = this.exprType(node);
      return this.isStructOrArrayType(vt);
    }
    if ( t == "MemberExpression" ) {
      const vt2 = this.exprType(node);
      if ( this.isStructOrArrayType(vt2) ) {
        if ( node.name == "length" ) {
          return false;
        }
        return true;
      }
    }
    return false;
  };
  isStructOrArrayType (t) {
    if ( t.length == 0 ) {
      return false;
    }
    if ( t.substring(0, 1 ) == "[" ) {
      return true;
    }
    if ( this.endsWith(t, "Native") ) {
      return true;
    }
    return false;
  };
  emitReturn (node) {
    if ( typeof(node.left) === "undefined" ) {
      this.emitLine("return");
      return;
    }
    const val = node.left;
    if ( this.inSpritesFn ) {
      if ( val.nodeType == "ArrayExpression" ) {
        this.emitSpriteArrayReturn(val);
      } else {
        const rs = this.emitExpr(val, "[SpriteDefNative]");
        this.emitLine("return " + rs);
      }
      return;
    }
    if ( this.inResourcesFn ) {
      this.emitResourceArrayReturn(val);
      return;
    }
    if ( this.inInitFn ) {
      this.emitStateReturn(val, false);
      return;
    }
    if ( this.inUpdateFn ) {
      this.emitStateReturn(val, true);
      return;
    }
    const rt = this.helperReturnType(this.currentFn);
    const expr = this.emitValueExpr(val, rt);
    this.emitLine("return " + expr);
  };
  emitSpriteArrayReturn (node) {
    this.emitLine("def list:[SpriteDefNative]");
    if ( node.nodeType != "ArrayExpression" ) {
      this.emitLine("return list");
      return;
    }
    let i = 0;
    while (i < node.children.length) {
      const elem = node.children[i];
      this.emitSpriteFromObject(elem, "d" + ("" + i));
      i = i + 1;
    };
    this.emitLine("return list");
  };
  emitResourceArrayReturn (node) {
    this.emitLine("def list:[ResourceDefNative]");
    if ( node.nodeType != "ArrayExpression" ) {
      this.emitLine("return list");
      return;
    }
    let i = 0;
    while (i < node.children.length) {
      const elem = node.children[i];
      this.emitResourceFromObject(elem, "r" + ("" + i));
      i = i + 1;
    };
    this.emitLine("return list");
  };
  emitResourceFromObject (node, varName) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    this.emitLine(("def " + varName) + ":ResourceDefNative (new ResourceDefNative)");
    let i = 0;
    while (i < node.children.length) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const key = this.propKey(prop);
      const expected = this.fieldType(key);
      const val = this.emitPropertyValue(prop, expected);
      this.emitLine((varName + ".") + (key + (" = " + val)));
      i = i + 1;
    };
    this.emitLine("push list " + varName);
  };
  emitSpriteFromObject (node, varName) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    this.emitLine(("def " + varName) + ":SpriteDefNative (new SpriteDefNative)");
    let i = 0;
    while (i < node.children.length) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const key = this.propKey(prop);
      const expected = this.fieldType(key);
      const val = this.emitPropertyValue(prop, expected);
      this.emitLine((varName + ".") + (key + (" = " + val)));
      i = i + 1;
    };
    this.emitLine("push list " + varName);
  };
  emitStateReturn (node, patch) {
    let target = "s";
    if ( patch ) {
      target = "patch";
    }
    if ( node.nodeType != "ObjectExpression" ) {
      if ( node.nodeType == "CallExpression" ) {
        if ( typeof(node.left) != "undefined" ) {
          const callee = node.left;
          if ( callee.nodeType == "Identifier" ) {
            if ( callee.name == "initState" ) {
              const callExpr = this.emitCall(node);
              this.emitLine("return " + callExpr);
              return;
            }
            if ( this.isKnownHelper(callee.name) ) {
              const callExpr_1 = this.emitCall(node);
              this.emitLine("return " + callExpr_1);
              return;
            }
          }
        }
      }
      if ( node.nodeType == "Identifier" ) {
        this.emitLine("return " + node.name);
        return;
      }
      this.emitLine(("def " + target) + ":NativeGameState (new NativeGameState)");
      this.emitLine("return " + target);
      return;
    }
    this.emitLine(("def " + target) + ":NativeGameState (new NativeGameState)");
    let i = 0;
    while (i < node.children.length) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const key = this.propKey(prop);
      const valNode = this.propertyValueNode(prop);
      if ( key == "entities" ) {
        if ( valNode.nodeType == "ObjectExpression" ) {
          this.emitEntitiesMap(valNode, target);
        } else {
          const ev = this.emitExpr(valNode, "int");
          this.emitLine((target + ".entities = ") + ev);
        }
      } else {
        if ( key == "events" || key == "event" && valNode.nodeType == "Identifier" ) {
          this.emitEventsFromValue(valNode, target);
        } else {
          if ( this.isObjectStateField(key) ) {
            const ost = this.objectStateFieldTypeOf(key);
            const oval = this.emitValueExpr(valNode, ost);
            this.emitLine(("st_" + key) + (" = " + oval));
          } else {
            if ( this.isNativeStateField(key) ) {
              const expected = this.fieldType(key);
              const val = this.emitExpr(valNode, expected);
              this.emitLine((target + ".") + (key + (" = " + val)));
              if ( key == "vx" ) {
                this.emitLine(target + ".hasVx = true");
              }
              if ( key == "vy" ) {
                this.emitLine(target + ".hasVy = true");
              }
              if ( key == "dt" ) {
                this.emitLine(target + ".hasDt = true");
              }
            } else {
              if ( this.isStateArrayField(key) ) {
                const at = this.stateArrayType(key);
                const aval = this.emitExpr(valNode, at);
                this.emitLine(((("set " + target) + ".intArrays \"") + key) + ("\" " + aval));
              } else {
                const vt = this.exprType(valNode);
                if ( vt == "[GameEventNative]" ) {
                  if ( valNode.nodeType == "Identifier" ) {
                    const en = this.resolveEventsVarName(valNode.name);
                    this.emitLine((target + ".events = ") + en);
                    i = i + 1;
                    continue;
                  }
                }
                if ( vt == "string" ) {
                  const sval = this.emitExpr(valNode, "string");
                  this.emitLine(((("set " + target) + ".strings \"") + key) + ("\" " + sval));
                } else {
                  const dval = this.emitExpr(valNode, "double");
                  this.emitLine(((("set " + target) + ".numbers \"") + key) + ("\" " + dval));
                }
              }
            }
          }
        }
      }
      i = i + 1;
    };
    this.emitLine("return " + target);
  };
  resolveEventsVarName (name) {
    if ( name == "event" ) {
      const vt = ( Object.prototype.hasOwnProperty.call(this.varTypes, "events") ? this.varTypes["events"] : undefined );
      if ( (typeof(vt) !== "undefined" && vt != null )  ) {
        return "events";
      }
    }
    return name;
  };
  emitEventsFromValue (node, target) {
    if ( node.nodeType == "Identifier" ) {
      const n = this.resolveEventsVarName(node.name);
      this.emitLine((target + ".events = ") + n);
      return;
    }
    this.emitEventsArray(node, target);
  };
  emitEventsArray (node, target) {
    this.emitLine(("def " + target) + "_events:[GameEventNative]");
    if ( node.nodeType == "ArrayExpression" ) {
      let i = 0;
      while (i < node.children.length) {
        const elem = node.children[i];
        this.emitEventFromObject(elem, target + ("_ev" + ("" + i)));
        i = i + 1;
      };
    }
    this.emitLine(((target + ".events = ") + target) + "_events");
  };
  emitEventFromObject (node, varName) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    this.emitLine(("def " + varName) + ":GameEventNative (new GameEventNative)");
    let i = 0;
    while (i < node.children.length) {
      const prop = node.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        const expected = this.fieldType(key);
        const val = this.emitPropertyValue(prop, expected);
        this.emitLine((varName + ".") + (key + (" = " + val)));
      }
      i = i + 1;
    };
    const listName = this.eventListNameFor(varName);
    this.emitLine(("push " + listName) + (" " + varName));
  };
  eventListNameFor (varName) {
    const idx = varName.indexOf("_ev");
    if ( idx < 0 ) {
      return "events";
    }
    const prefix = varName.substring(0, idx );
    return prefix + "_events";
  };
  emitEntitiesMap (node, target) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    let i = 0;
    while (i < node.children.length) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const id = this.propKey(prop);
      const valNode = this.propertyValueNode(prop);
      const poseName = "pose_" + id;
      this.emitLine(("def " + poseName) + ":EntityPoseNative (new EntityPoseNative)");
      if ( valNode.nodeType == "ObjectExpression" ) {
        let j = 0;
        while (j < valNode.children.length) {
          const p2 = valNode.children[j];
          if ( p2.nodeType == "Property" ) {
            const k = this.propKey(p2);
            const expected = this.fieldType(k);
            const v = this.emitPropertyValue(p2, expected);
            this.emitLine((poseName + ".") + (k + (" = " + v)));
          }
          j = j + 1;
        };
      }
      this.emitLine((("set " + target) + (".entities \"" + id)) + ("\" " + poseName));
      i = i + 1;
    };
  };
  propertyValueNode (prop) {
    if ( typeof(prop.left) != "undefined" ) {
      return prop.left;
    }
    const empty = new TSNode();
    return empty;
  };
  emitPropertyValue (prop, expected) {
    if ( typeof(prop.left) != "undefined" ) {
      return this.emitValueExpr(prop.left, expected);
    }
    return "0";
  };
  propKey (prop) {
    if ( prop.name.length > 0 ) {
      return prop.name;
    }
    if ( prop.computed ) {
      return "";
    }
    if ( typeof(prop.left) != "undefined" ) {
      const left = prop.left;
      if ( left.nodeType == "Identifier" ) {
        return left.name;
      }
    }
    return "";
  };
  emitExpr (node, expected) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      return this.emitNumber(node.value, expected);
    }
    if ( t == "BooleanLiteral" ) {
      return node.value;
    }
    if ( t == "StringLiteral" ) {
      return ("\"" + node.value) + "\"";
    }
    if ( t == "Identifier" ) {
      const ca = ( Object.prototype.hasOwnProperty.call(this.constArrayNames, node.name) ? this.constArrayNames[node.name] : undefined );
      if ( (typeof(ca) !== "undefined" && ca != null )  ) {
        if ( this.inModuleSingletonCtor ) {
          return node.name;
        }
        if ( this.moduleSingletonClass.length > 0 ) {
          return this.moduleConstAccess(node.name);
        }
        return ("(this." + node.name) + "())";
      }
      const cst = ( Object.prototype.hasOwnProperty.call(this.constScalarTypes, node.name) ? this.constScalarTypes[node.name] : undefined );
      if ( (typeof(cst) !== "undefined" && cst != null )  ) {
        const cstv = cst;
        let caccess = node.name;
        if ( this.inModuleSingletonCtor ) {
          caccess = node.name;
        } else {
          if ( this.moduleSingletonClass.length > 0 ) {
            caccess = this.moduleConstAccess(node.name);
          } else {
            caccess = "this." + node.name;
          }
        }
        if ( expected == "double" ) {
          if ( cstv == "int" ) {
            return ("(to_double " + caccess) + ")";
          }
        }
        return caccess;
      }
      if ( this.isEngineGlobal(node.name) ) {
        if ( expected == "double" ) {
          return ("(to_double host." + node.name) + ")";
        }
        return "host." + node.name;
      }
      if ( expected == "double" ) {
        const vt = this.lookupVarType(node.name);
        if ( vt == "int" || vt == "i32" ) {
          return ("(to_double " + node.name) + ")";
        }
      }
      return node.name;
    }
    if ( t == "CallExpression" ) {
      const callStr = this.emitCall(node);
      if ( expected == "double" ) {
        if ( this.callExprType(node) == "int" ) {
          return ("(to_double " + callStr) + ")";
        }
      }
      return callStr;
    }
    if ( t == "MemberExpression" ) {
      return this.emitMember(node, expected);
    }
    if ( t == "BinaryExpression" ) {
      return this.emitBinary(node, expected);
    }
    if ( t == "UnaryExpression" ) {
      return this.emitUnary(node, expected);
    }
    if ( t == "ObjectExpression" ) {
      if ( this.endsWith(expected, "Native") ) {
        if ( node.children.length == 0 ) {
          return ("(new " + expected) + ")";
        }
        const tmpObj = "tmp" + ("" + this.tmpCounter);
        this.tmpCounter = this.tmpCounter + 1;
        this.emitStructFromObject(node, tmpObj, expected);
        return tmpObj;
      }
      return "{}";
    }
    if ( t == "ArrayExpression" ) {
      if ( this.startsWith(expected, "[") ) {
        if ( node.children.length == 0 ) {
          const tmpArr = "tmp" + ("" + this.tmpCounter);
          this.tmpCounter = this.tmpCounter + 1;
          this.emitLine((("def " + tmpArr) + ":") + expected);
          return tmpArr;
        }
      }
      return "[]";
    }
    return "0";
  };
  emitCall (node) {
    if ( typeof(node.left) === "undefined" ) {
      return "0";
    }
    const callee = node.left;
    if ( callee.nodeType == "Identifier" ) {
      const name = callee.name;
      if ( this.isBridgeHelper(name) ) {
        return this.emitBridgeHelperValue(name, node);
      }
      let receiver = "this.";
      if ( this.isEngineFn(name) ) {
        receiver = "host.";
      }
      let args = [];
      let i = 0;
      while (i < node.children.length) {
        const arg = node.children[i];
        let pexp = this.helperParamType(name, i);
        if ( pexp.length == 0 ) {
          pexp = this.exprType(arg);
        }
        if ( arg.nodeType == "ObjectExpression" ) {
          if ( this.endsWith(pexp, "Native") == false ) {
            pexp = this.inferObjectStructType(arg, ((name + "_arg") + ("" + i)));
          }
        }
        const at = this.exprType(arg);
        let emitAs = at;
        if ( emitAs.length == 0 ) {
          emitAs = "int";
        }
        let argExpr = "";
        if ( pexp.length > 0 ) {
          argExpr = this.emitValueExpr(arg, pexp);
        } else {
          argExpr = this.emitExpr(arg, emitAs);
        }
        if ( this.isEngineFn(name) ) {
          if ( at == "double" ) {
            argExpr = ("(to_int " + argExpr) + ")";
          }
        }
        if ( pexp == "int" ) {
          if ( at == "double" ) {
            if ( this.isEngineFn(name) == false ) {
              argExpr = ("(to_int " + argExpr) + ")";
            }
          }
        }
        if ( pexp == "double" ) {
          if ( emitAs == "int" ) {
            let alreadyDouble = false;
            if ( arg.nodeType == "NumericLiteral" ) {
              alreadyDouble = true;
            }
            if ( this.containsChar(argExpr, 46) ) {
              alreadyDouble = true;
            }
            if ( argExpr.length >= 10 ) {
              if ( argExpr.substring(0, 10 ) == "(to_double" ) {
                alreadyDouble = true;
              }
            }
            if ( alreadyDouble == false ) {
              argExpr = ("(to_double " + argExpr) + ")";
            }
          }
        }
        if ( pexp == "boolean" ) {
          if ( at == "int" ) {
            argExpr = ("(" + argExpr) + " != 0)";
          }
        }
        args.push(argExpr);
        i = i + 1;
      };
      const inner = ((receiver + name) + "(") + (this.joinSpace(args) + ")");
      return ("(" + inner) + ")";
    }
    if ( callee.nodeType == "MemberExpression" ) {
      if ( callee.name == "substring" ) {
        if ( typeof(callee.left) != "undefined" ) {
          const recv = callee.left;
          const recvT = this.exprType(recv);
          const recvExpr = this.emitExpr(recv, recvT);
          let a0 = "0";
          let a1 = "0";
          if ( node.children.length > 0 ) {
            const n0 = node.children[0];
            a0 = this.emitExpr(n0, "int");
          }
          if ( node.children.length > 1 ) {
            const n1 = node.children[1];
            a1 = this.emitExpr(n1, "int");
          }
          return (((("(substring " + recvExpr) + " ") + a0) + " ") + a1;
        }
      }
    }
    return "0";
  };
  emitNumber (raw, expected) {
    const hasDot = this.containsChar(raw, 46);
    if ( expected == "double" ) {
      if ( hasDot == false ) {
        return raw + ".0";
      }
      return raw;
    }
    return raw;
  };
  emitMember (node, expected) {
    if ( typeof(node.left) === "undefined" ) {
      return "";
    }
    const leftNode = node.left;
    if ( node.computed ) {
      if ( typeof(node.right) != "undefined" ) {
        const idxNode = node.right;
        const baseType = this.exprType(leftNode);
        const base = this.emitExpr(leftNode, "int");
        const idxT = this.exprType(idxNode);
        let idx = this.emitExpr(idxNode, idxT);
        if ( idxT == "double" ) {
          idx = ("(to_int " + idx) + ")";
        }
        const elemT = this.elemTypeOf(baseType);
        const access = ((("(itemAt " + base) + " ") + idx) + ")";
        const hoisted = ( Object.prototype.hasOwnProperty.call(this.hoistedItemAt, access) ? this.hoistedItemAt[access] : undefined );
        if ( (typeof(hoisted) !== "undefined" && hoisted != null )  ) {
          return hoisted;
        }
        if ( expected == "double" ) {
          if ( elemT == "int" ) {
            return ("(to_double " + access) + ")";
          }
        }
        return access;
      }
    }
    if ( node.name == "length" ) {
      const base_1 = this.emitExpr(leftNode, "int");
      return ("(array_length " + base_1) + ")";
    }
    const pIdx = this.inputPlayerIndex(node);
    if ( pIdx.length > 0 ) {
      const localName = ("in_pl" + pIdx) + ".";
      return localName + node.name;
    }
    if ( leftNode.nodeType == "MemberExpression" ) {
      if ( leftNode.name == "entities" ) {
        return "in_" + node.name;
      }
    }
    if ( leftNode.nodeType == "CallExpression" ) {
      let ct = this.callExprType(leftNode);
      if ( ct.length == 0 ) {
        ct = "int";
      }
      if ( this.endsWith(ct, "Native") ) {
        const tmpCall = "tmp" + ("" + this.tmpCounter);
        this.tmpCounter = this.tmpCounter + 1;
        const callStr = this.emitCall(leftNode);
        this.emitLine(((("def " + tmpCall) + ":") + ct) + ((" (" + callStr) + ")"));
        const result = (tmpCall + ".") + node.name;
        if ( expected == "double" ) {
          const sf = this.structFieldType(ct, node.name);
          if ( this.isIntScalar(sf) || sf == "int" ) {
            return ("(to_double " + result) + ")";
          }
        }
        return result;
      }
    }
    if ( leftNode.nodeType == "Identifier" ) {
      const bvt = this.lookupVarType(leftNode.name);
      if ( bvt == "NativeGameState" ) {
        const routed = this.emitStateFieldRead(
          leftNode.name,
          node.name,
          expected
        );
        if ( routed.length > 0 ) {
          return routed;
        }
      }
      const identLvt = this.lookupVarType(leftNode.name);
      if ( leftNode.name == this.stateVarName && identLvt == "NativeGameState" ) {
        if ( this.isObjectStateField(node.name) ) {
          return "st_" + node.name;
        }
        if ( this.isStateArrayField(node.name) ) {
          return ((("(unwrap (get " + this.stateVarName) + ".intArrays \"") + node.name) + "\"))";
        }
        if ( this.isNativeStateField(node.name) == false ) {
          if ( node.name.length > 0 ) {
            return ((("(unwrap (get " + this.stateVarName) + ".numbers \"") + node.name) + "\"))";
          }
        }
      }
    }
    const base_2 = this.emitExpr(leftNode, "int");
    const prop = node.name;
    if ( prop.length == 0 ) {
      return base_2;
    }
    if ( base_2 == "props" ) {
      return "props." + prop;
    }
    const result_1 = (base_2 + ".") + prop;
    if ( expected == "double" ) {
      const baseT = this.exprType(leftNode);
      const sf_1 = this.structFieldType(baseT, prop);
      if ( this.isIntScalar(sf_1) || sf_1 == "int" ) {
        return ("(to_double " + result_1) + ")";
      }
    }
    return result_1;
  };
  endsWith (s, suffix) {
    const slen = s.length;
    const xlen = suffix.length;
    if ( xlen > slen ) {
      return false;
    }
    const start = slen - xlen;
    const tail = s.substring(start, slen );
    return tail == suffix;
  };
  emitBinary (node, expected) {
    let op = node.value;
    if ( op == "===" ) {
      op = "==";
    }
    if ( op == "!==" ) {
      op = "!=";
    }
    if ( op == "|" ) {
      if ( typeof(node.right) != "undefined" ) {
        const rn = node.right;
        if ( rn.nodeType == "NumericLiteral" ) {
          if ( rn.value == "0" ) {
            const lt = this.exprType(node.left);
            if ( expected == "double" ) {
              const lx = this.emitExpr(node.left, "int");
              return ("(to_double " + lx) + ")";
            }
            if ( lt == "double" ) {
              const lx_1 = this.emitExpr(node.left, "double");
              return ("(to_int " + lx_1) + ")";
            }
            return this.emitExpr(node.left, "int");
          }
        }
      }
    }
    let operandExpected = expected;
    if ( this.isComparisonOp(op) || this.isArithmeticOp(op) ) {
      operandExpected = this.numericCommon(node);
    }
    const left = this.emitExpr(node.left, operandExpected);
    const right = this.emitExpr(node.right, operandExpected);
    const result = (("(" + left) + (" " + op)) + ((" " + right) + ")");
    if ( expected == "int" && op == "/" ) {
      return ("(to_int " + result) + ")";
    }
    if ( expected == "double" ) {
      const nc = this.numericCommon(node);
      if ( nc == "int" ) {
        if ( result.length >= 10 ) {
          if ( result.substring(0, 10 ) == "(to_double" ) {
            return result;
          }
        }
        return ("(to_double " + result) + ")";
      }
    }
    return result;
  };
  isArithmeticOp (op) {
    if ( op == "+" ) {
      return true;
    }
    if ( op == "-" ) {
      return true;
    }
    if ( op == "*" ) {
      return true;
    }
    if ( op == "/" ) {
      return true;
    }
    if ( op == "%" ) {
      return true;
    }
    return false;
  };
  emitUnary (node, expected) {
    const op = node.value;
    if ( typeof(node.left) === "undefined" ) {
      return op;
    }
    const argType = this.exprType(node.left);
    if ( op == "-" ) {
      let useDouble = argType == "double";
      if ( expected == "double" ) {
        useDouble = true;
      }
      if ( useDouble ) {
        const arg = this.emitExpr(node.left, "double");
        return ("(0.0 - " + arg) + ")";
      }
      const arg2 = this.emitExpr(node.left, "int");
      return ("(0 - " + arg2) + ")";
    }
    if ( op == "!" ) {
      const argB = this.emitExpr(node.left, "boolean");
      return ("(false == " + argB) + ")";
    }
    const argD = this.emitExpr(node.left, argType);
    return op + argD;
  };
  containsChar (s, ch) {
    let i = 0;
    while (i < s.length) {
      const c = s.charCodeAt(i );
      if ( c == ch ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  foldDigitChar (d) {
    if ( d == 0 ) {
      return "0";
    }
    if ( d == 1 ) {
      return "1";
    }
    if ( d == 2 ) {
      return "2";
    }
    if ( d == 3 ) {
      return "3";
    }
    if ( d == 4 ) {
      return "4";
    }
    if ( d == 5 ) {
      return "5";
    }
    if ( d == 6 ) {
      return "6";
    }
    if ( d == 7 ) {
      return "7";
    }
    if ( d == 8 ) {
      return "8";
    }
    return "9";
  };
  parseIntStr (s) {
    let out = 0;
    let i = 0;
    let neg = false;
    if ( s.length > 0 ) {
      const c0 = s.charCodeAt(0 );
      if ( c0 == 45 ) {
        neg = true;
        i = 1;
      }
    }
    while (i < s.length) {
      const ch = s.charCodeAt(i );
      out = out * 10 + (ch - 48);
      i = i + 1;
    };
    if ( neg ) {
      return 0 - out;
    }
    return out;
  };
  divInt (a, b) {
    if ( b == 0 ) {
      return 0;
    }
    let count = 0;
    let rem = a;
    if ( rem < 0 ) {
      rem = 0 - rem;
    }
    let absB = b;
    if ( b < 0 ) {
      absB = 0 - b;
    }
    while (rem >= absB) {
      rem = rem - absB;
      count = count + 1;
    };
    if ( a < 0 && b > 0 || a > 0 && b < 0 ) {
      return 0 - count;
    }
    return count;
  };
  formatIntStr (n) {
    if ( n == 0 ) {
      return "0";
    }
    let neg = false;
    let v = n;
    if ( n < 0 ) {
      neg = true;
      v = 0 - n;
    }
    let digits = [];
    while (v > 0) {
      const digit = v % 10;
      digits.push(this.foldDigitChar(digit));
      v = this.divInt((v - digit), 10);
    };
    let out = "";
    const cnt = digits.length;
    let i = cnt - 1;
    while (i >= 0) {
      out = out + digits[i];
      i = i - 1;
    };
    if ( neg ) {
      return "-" + out;
    }
    return out;
  };
}
class TSEmitterMain  {
  constructor() {
  }
}
TSEmitterMain.lastSlash = function(path) {
  let best = -1;
  let i = 0;
  while (i < path.length) {
    const ch = path.substring(i, (i + 1) );
    if ( ch == "/" ) {
      best = i;
    }
    i = i + 1;
  };
  return best;
};
TSEmitterMain.lastDot = function(name) {
  let best = -1;
  let i = 0;
  while (i < name.length) {
    const ch = name.substring(i, (i + 1) );
    if ( ch == "." ) {
      best = i;
    }
    i = i + 1;
  };
  return best;
};
TSEmitterMain.moduleIdFromPath = function(path, stem) {
  const base = TSEmitterMain.stripGameSuffix(stem);
  if ( base != "index" && base != "game" ) {
    return base;
  }
  const slash = TSEmitterMain.lastSlash(path);
  if ( slash < 0 ) {
    return base;
  }
  const parent = path.substring(0, slash );
  const slash2 = TSEmitterMain.lastSlash(parent);
  if ( slash2 < 0 ) {
    return base;
  }
  return parent.substring((slash2 + 1), parent.length );
};
TSEmitterMain.stripGameSuffix = function(stem) {
  const n = stem.length;
  if ( n <= 5 ) {
    return stem;
  }
  const tail = stem.substring((n - 5), n );
  if ( tail == ".game" ) {
    return stem.substring(0, (n - 5) );
  }
  return stem;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  let inputFile = "";
  let outputFile = "";
  let toStdout = false;
  const argCnt = (process.argv.length - 2);
  let i = 0;
  while (i < argCnt) {
    const arg = process.argv[ 2 + i];
    if ( arg == "-i" ) {
      i = i + 1;
      if ( i < argCnt ) {
        inputFile = process.argv[ 2 + i];
      }
    } else {
      if ( arg == "-o" ) {
        i = i + 1;
        if ( i < argCnt ) {
          outputFile = process.argv[ 2 + i];
        }
      } else {
        if ( arg == "--stdout" ) {
          toStdout = true;
        }
      }
    }
    i = i + 1;
  };
  if ( inputFile.length == 0 ) {
    console.log("Usage: ts_emitter_main -i <file.game.tsx> [-o out.rgr] [--stdout]");
    return;
  }
  const slash = TSEmitterMain.lastSlash(inputFile);
  const dir = inputFile.substring(0, slash );
  const base = inputFile.substring((slash + 1), inputFile.length );
  const dot = TSEmitterMain.lastDot(base);
  let stem = base;
  if ( dot > 0 ) {
    stem = base.substring(0, dot );
  }
  const src = require('fs').readFileSync(dir + '/' + base, 'utf8');
  const moduleId = TSEmitterMain.moduleIdFromPath(inputFile, stem);
  const lexer = new TSLexer(src);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.tsxMode = true;
  const ast = parser.parseProgram();
  const emitter = new TSEmitter();
  emitter.setModuleSingletonId(moduleId);
  const code = emitter.emitProgram(ast);
  if ( toStdout ) {
    console.log(code);
    return;
  }
  if ( outputFile.length == 0 ) {
    outputFile = stem + "_generated.rgr";
  }
  const outDir = "gallery/ts_to_ranger/generated";
  require('fs').writeFileSync(outDir + '/' + outputFile, Buffer.from((function(s){ var b = new ArrayBuffer(s.length); var v = new Uint8Array(b); for(var i=0;i<s.length;i++)v[i]=s.charCodeAt(i); b._view = new DataView(b); return b; })(code)));
  console.log("Wrote gallery/ts_to_ranger/generated/" + outputFile);
}
__js_main();
