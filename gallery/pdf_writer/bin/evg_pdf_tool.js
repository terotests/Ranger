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
    this.firstErrorLine = -1;
    this.firstErrorCol = -1;
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
  if ( lower == "navy" ) {
    return EVGColor.rgb(0, 0, 128);
  }
  if ( lower == "teal" ) {
    return EVGColor.rgb(0, 128, 128);
  }
  if ( lower == "olive" ) {
    return EVGColor.rgb(128, 128, 0);
  }
  if ( lower == "maroon" ) {
    return EVGColor.rgb(128, 0, 0);
  }
  if ( lower == "silver" ) {
    return EVGColor.rgb(192, 192, 192);
  }
  if ( lower == "lime" ) {
    return EVGColor.rgb(0, 255, 0);
  }
  if ( lower == "aqua" ) {
    return EVGColor.rgb(0, 255, 255);
  }
  if ( lower == "fuchsia" ) {
    return EVGColor.rgb(255, 0, 255);
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
    this.textDir = "";
    this.resolvedRtl = false;
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
    this.svgSource = "";
    this.viewBox = "";
    this.strokeWidth = 0.0;
    this.fillRule = "nonzero";
    this.strokeDashArray = "";
    this.strokeDashOffset = 0.0;
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
    this.emojiColor = EVGColor.noColor();
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
  effectiveBorderWidthPx () {
    if ( this.box.borderWidthPx > 0.0 ) {
      return this.box.borderWidthPx;
    }
    if ( typeof(this.borderWidth) != "undefined" ) {
      if ( this.borderWidth.isSet ) {
        return this.borderWidth.pixels;
      }
    }
    return 0.0;
  };
  effectiveBorderColor () {
    if ( typeof(this.box.borderColor) != "undefined" ) {
      const bc = this.box.borderColor;
      if ( bc.isSet ) {
        return bc;
      }
    }
    if ( typeof(this.borderColor) != "undefined" ) {
      const ec = this.borderColor;
      if ( ec.isSet ) {
        return ec;
      }
    }
    return EVGColor.black();
  };
  hasBorder () {
    if ( this.effectiveBorderWidthPx() <= 0.0 ) {
      return false;
    }
    return true;
  };
  effectiveEmojiColor () {
    if ( this.emojiColor.isSet ) {
      return this.emojiColor;
    }
    return this.color;
  };
  inheritProperties (parentEl) {
    if ( this.fontFamily == "Noto Sans" ) {
      this.fontFamily = parentEl.fontFamily;
    }
    if ( this.color.isSet == false ) {
      this.color = parentEl.color;
    }
    if ( this.emojiColor.isSet == false ) {
      this.emojiColor = parentEl.emojiColor;
    }
    this.fontSizeBase = parentEl.inheritedFontSize;
    this.rootFontSize = parentEl.rootFontSize;
    this.applyOwnFontSize();
    this.applyOwnDirection(parentEl.resolvedRtl);
  };
  applyOwnDirection (inherited) {
    this.resolvedRtl = inherited;
    if ( this.textDir == "rtl" ) {
      this.resolvedRtl = true;
    }
    if ( this.textDir == "ltr" ) {
      this.resolvedRtl = false;
    }
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
    if ( name == "emoji-color" ) {
      this.emojiColor = EVGColor.parse(value);
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
      if ( (value == "rtl") || (value == "ltr") ) {
        this.textDir = value;
        return;
      }
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
    if ( (name == "svg") || (name == "svgSource") ) {
      this.svgSource = value;
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
    if ( (name == "stroke-dasharray") || (name == "strokeDasharray") ) {
      this.strokeDashArray = value;
      return;
    }
    if ( (name == "stroke-dashoffset") || (name == "strokeDashoffset") ) {
      const dv_1 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(dv_1) != "undefined" ) {
        this.strokeDashOffset = dv_1;
      }
      return;
    }
    if ( (name == "fill-rule") || (name == "fillRule") ) {
      if ( value == "evenodd" ) {
        this.fillRule = "evenodd";
      } else {
        this.fillRule = "nonzero";
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
class EVGCodepoint  {
  constructor() {
  }
}
EVGCodepoint.breaksAfter = function(c) {
  if ( (c == 45) || (c == 8208) ) {
    return true;
  }
  if ( (c == 8211) || (c == 8212) ) {
    return true;
  }
  if ( c == 47 ) {
    return true;
  }
  return false;
};
EVGCodepoint.isSpace = function(c) {
  if ( c == 32 ) {
    return true;
  }
  if ( c == 9 ) {
    return true;
  }
  return false;
};
EVGCodepoint.stringIsBytes = function() {
  return ("ä".length) > 1;
};
EVGCodepoint.isHighSurrogate = function(u) {
  return (u >= 55296) && (u <= 56319);
};
EVGCodepoint.isLowSurrogate = function(u) {
  return (u >= 56320) && (u <= 57343);
};
EVGCodepoint.codeAt = function(s, i) {
  const u = s.charCodeAt(i );
  if ( EVGCodepoint.stringIsBytes() ) {
    return EVGCodepoint.utf8CodeAt(s, i, u);
  }
  if ( EVGCodepoint.isHighSurrogate(u) ) {
    if ( (i + 1) < (s.length) ) {
      const lo = s.charCodeAt((i + 1) );
      if ( EVGCodepoint.isLowSurrogate(lo) ) {
        return (((u - 55296) * 1024) + (lo - 56320)) + 65536;
      }
    }
  }
  return u;
};
EVGCodepoint.utf8CodeAt = function(s, i, u) {
  const n = s.length;
  if ( u < 128 ) {
    return u;
  }
  if ( (u >= 192) && (u < 224) ) {
    if ( (i + 1) < n ) {
      const b1 = s.charCodeAt((i + 1) );
      if ( EVGCodepoint.isUtf8Cont(b1) ) {
        return ((u - 192) * 64) + (b1 - 128);
      }
    }
    return u;
  }
  if ( (u >= 224) && (u < 240) ) {
    if ( (i + 2) < n ) {
      const c1 = s.charCodeAt((i + 1) );
      const c2 = s.charCodeAt((i + 2) );
      if ( EVGCodepoint.isUtf8Cont(c1) && EVGCodepoint.isUtf8Cont(c2) ) {
        return (((u - 224) * 4096) + ((c1 - 128) * 64)) + (c2 - 128);
      }
    }
    return u;
  }
  if ( (u >= 240) && (u < 248) ) {
    if ( (i + 3) < n ) {
      const d1 = s.charCodeAt((i + 1) );
      const d2 = s.charCodeAt((i + 2) );
      const d3 = s.charCodeAt((i + 3) );
      if ( (EVGCodepoint.isUtf8Cont(d1) && EVGCodepoint.isUtf8Cont(d2)) && EVGCodepoint.isUtf8Cont(d3) ) {
        return ((((u - 240) * 262144) + ((d1 - 128) * 4096)) + ((d2 - 128) * 64)) + (d3 - 128);
      }
    }
    return u;
  }
  return u;
};
EVGCodepoint.isUtf8Cont = function(b) {
  return (b >= 128) && (b < 192);
};
EVGCodepoint.utf8UnitsAt = function(s, i) {
  const u = s.charCodeAt(i );
  const n = s.length;
  if ( u < 128 ) {
    return 1;
  }
  if ( (u >= 192) && (u < 224) ) {
    if ( (i + 1) < n ) {
      if ( EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 1) ))) ) {
        return 2;
      }
    }
    return 1;
  }
  if ( (u >= 224) && (u < 240) ) {
    if ( (i + 2) < n ) {
      if ( EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 1) ))) && EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 2) ))) ) {
        return 3;
      }
    }
    return 1;
  }
  if ( (u >= 240) && (u < 248) ) {
    if ( (i + 3) < n ) {
      const e1 = EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 1) )));
      const e2 = EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 2) )));
      const e3 = EVGCodepoint.isUtf8Cont((s.charCodeAt((i + 3) )));
      if ( (e1 && e2) && e3 ) {
        return 4;
      }
    }
    return 1;
  }
  return 1;
};
EVGCodepoint.unitsAt = function(s, i) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return EVGCodepoint.utf8UnitsAt(s, i);
  }
  const u = s.charCodeAt(i );
  if ( EVGCodepoint.isHighSurrogate(u) ) {
    if ( (i + 1) < (s.length) ) {
      if ( EVGCodepoint.isLowSurrogate((s.charCodeAt((i + 1) ))) ) {
        return 2;
      }
    }
  }
  return 1;
};
EVGCodepoint.charCount = function(s) {
  let n = 0;
  let i = 0;
  while (i < (s.length)) {
    i = i + EVGCodepoint.unitsAt(s, i);
    n = n + 1;
  };
  return n;
};
EVGCodepoint.count = function(s) {
  let n = 0;
  let i = 0;
  while (i < (s.length)) {
    i = i + EVGCodepoint.unitsAt(s, i);
    n = n + 1;
  };
  return n;
};
EVGCodepoint.toArray = function(s) {
  let out = [];
  let i = 0;
  while (i < (s.length)) {
    out.push(EVGCodepoint.codeAt(s, i));
    i = i + EVGCodepoint.unitsAt(s, i);
  };
  return out;
};
EVGCodepoint.toStr = function(cp) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return String.fromCharCode(cp);
  }
  if ( cp < 65536 ) {
    return String.fromCharCode(cp);
  }
  const rel = cp - 65536;
  const hi = 55296 + (Math.floor( (rel / 1024)));
  const lo = 56320 + (rel % 1024);
  return (String.fromCharCode(hi)) + (String.fromCharCode(lo));
};
EVGCodepoint.encodeUtf8 = function(s) {
  if ( EVGCodepoint.stringIsBytes() ) {
    return s;
  }
  let out = "";
  let i = 0;
  while (i < (s.length)) {
    const cp = EVGCodepoint.codeAt(s, i);
    i = i + EVGCodepoint.unitsAt(s, i);
    if ( cp < 128 ) {
      out = out + (String.fromCharCode(cp));
    } else {
      if ( cp < 2048 ) {
        out = out + (String.fromCharCode((192 + (Math.floor( (cp / 64))))));
        out = out + (String.fromCharCode((128 + (cp % 64))));
      } else {
        if ( cp < 65536 ) {
          out = out + (String.fromCharCode((224 + (Math.floor( (cp / 4096))))));
          out = out + (String.fromCharCode((128 + ((Math.floor( (cp / 64))) % 64))));
          out = out + (String.fromCharCode((128 + (cp % 64))));
        } else {
          out = out + (String.fromCharCode((240 + (Math.floor( (cp / 262144))))));
          out = out + (String.fromCharCode((128 + ((Math.floor( (cp / 4096))) % 64))));
          out = out + (String.fromCharCode((128 + ((Math.floor( (cp / 64))) % 64))));
          out = out + (String.fromCharCode((128 + (cp % 64))));
        }
      }
    }
    continue;
  };
  return out;
};
class Utf8  {
  constructor() {
  }
}
Utf8.stringIsBytes = function() {
  return EVGCodepoint.stringIsBytes();
};
Utf8.encode = function(s) {
  if ( Utf8.stringIsBytes() ) {
    return s;
  }
  return EVGCodepoint.encodeUtf8(s);
};
Utf8.decode = function(raw) {
  if ( Utf8.stringIsBytes() ) {
    return raw;
  }
  const __len = raw.length;
  let scan = 0;
  let asciiOnly = true;
  while (scan < __len) {
    if ( (raw.charCodeAt(scan )) > 127 ) {
      asciiOnly = false;
      break;
    }
    scan = scan + 1;
  };
  if ( asciiOnly ) {
    return raw;
  }
  let out = "";
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
    const cp = EVGCodepoint.codeAt(s, i);
    const step = EVGCodepoint.unitsAt(s, i);
    if ( cp >= 32 ) {
      if ( Utf8.toWinAnsi(cp) < 0 ) {
        return true;
      }
    }
    i = i + step;
  };
  return false;
};
class JSXToEVG  {
  constructor() {
    this.source = "";
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.baseDir = "";
    this.verbose = true;
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
    this.baseDir = dirPath;
    const fileContent = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const src = Utf8.decode(((function(b){ var v = (b instanceof Uint8Array) ? b : new Uint8Array(b); var s = ""; var i = 0; var n = v.length; var c = 32768; while (i < n) { var e = i + c; if (e > n) { e = n; } s += String.fromCharCode.apply(null, v.subarray(i, e)); i = e; } return s; })(fileContent)));
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
    if ( (tagName == "Svg") || (tagName == "svg") ) {
      this.loadSvgSource(element);
    }
    if ( ((tagName == "span") || (tagName == "Label")) || (tagName == "text") ) {
      element.textContent = this.collectTextContent(jsxNode);
    } else {
      this.convertChildren(element, jsxNode);
    }
    return element;
  };
  loadSvgSource (element) {
    if ( (element.svgSource.length) > 0 ) {
      return;
    }
    if ( (element.src.length) == 0 ) {
      return;
    }
    let dir = this.baseDir;
    let name = element.src;
    const lastSlash = name.lastIndexOf("/");
    if ( lastSlash >= 0 ) {
      dir = dir + (name.substring(0, (lastSlash + 1) ));
      name = name.substring((lastSlash + 1), (name.length) );
    }
    const content = (function(){ var b = require('fs').readFileSync(dir + '/' + name); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const markup = Utf8.decode(((function(b){ var v = (b instanceof Uint8Array) ? b : new Uint8Array(b); var s = ""; var i = 0; var n = v.length; var c = 32768; while (i < n) { var e = i + c; if (e > n) { e = n; } s += String.fromCharCode.apply(null, v.subarray(i, e)); i = e; } return s; })(content)));
    if ( (markup.length) == 0 ) {
      console.log("Warning: the SVG named by src is empty or could not be read: " + element.src);
      return;
    }
    element.svgSource = markup;
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
    if ( jsxTag == "Svg" ) {
      return "path";
    }
    if ( jsxTag == "svg" ) {
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
        if ( this.verbose ) {
          console.log((((("  Attr: " + rawAttrName) + " -> ") + attrName) + " = ") + attrValue);
        }
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
      element.box.borderWidth = EVGUnit.parse(value);
    }
    if ( name == "borderColor" ) {
      element.box.borderColor = EVGColor.parse(value);
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
    if ( name == "emojiColor" ) {
      element.emojiColor = EVGColor.parse(value);
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
class JPEGImage  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.colorComponents = 3;
    this.bitsPerComponent = 8;
    this.isValid = false;
    this.errorMessage = "";
  }
}
class JPEGReader  {
  constructor() {
  }
  readUint16BE (data, offset) {
    const high = data._view.getUint8(offset);
    const low = data._view.getUint8((offset + 1));
    return (high * 256) + low;
  };
  readJPEG (dirPath, fileName) {
    const result = new JPEGImage();
    const data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const dataLen = data.byteLength;
    if ( dataLen < 4 ) {
      result.errorMessage = "File too small to be a valid JPEG";
      return result;
    }
    const marker1 = data._view.getUint8(0);
    const marker2 = data._view.getUint8(1);
    if ( (marker1 != 255) || (marker2 != 216) ) {
      result.errorMessage = "Invalid JPEG signature - expected FFD8";
      return result;
    }
    let pos = 2;
    let foundSOF = false;
    while ((pos < (dataLen - 2)) && (foundSOF == false)) {
      const m1 = data._view.getUint8(pos);
      if ( m1 != 255 ) {
        pos = pos + 1;
      } else {
        const m2 = data._view.getUint8((pos + 1));
        if ( m2 == 255 ) {
          pos = pos + 1;
        } else {
          if ( m2 == 0 ) {
            pos = pos + 2;
          } else {
            if ( ((m2 == 192) || (m2 == 193)) || (m2 == 194) ) {
              if ( (pos + 9) < dataLen ) {
                result.bitsPerComponent = data._view.getUint8((pos + 4));
                result.height = this.readUint16BE(data, (pos + 5));
                result.width = this.readUint16BE(data, (pos + 7));
                result.colorComponents = data._view.getUint8((pos + 9));
                foundSOF = true;
              }
            } else {
              if ( m2 == 217 ) {
                pos = dataLen;
              } else {
                if ( m2 == 218 ) {
                  pos = dataLen;
                } else {
                  if ( (pos + 4) < dataLen ) {
                    const segLen = this.readUint16BE(data, (pos + 2));
                    pos = (pos + 2) + segLen;
                  } else {
                    pos = dataLen;
                  }
                }
              }
            }
          }
        }
      }
    };
    if ( foundSOF == false ) {
      result.errorMessage = "Could not find SOF marker in JPEG";
      return result;
    }
    result.imageData = data;
    result.isValid = true;
    return result;
  };
  getImageInfo (img) {
    if ( img.isValid == false ) {
      return "Invalid JPEG: " + img.errorMessage;
    }
    return ((((((("JPEG: " + ((img.width.toString()))) + "x") + ((img.height.toString()))) + " pixels, ") + ((img.colorComponents.toString()))) + " components, ") + ((img.bitsPerComponent.toString()))) + " bits";
  };
}
class ExifTag  {
  constructor() {
    this.tagId = 0;
    this.tagName = "";
    this.tagValue = "";
    this.dataType = 0;
  }
}
class JPEGMetadataInfo  {
  constructor() {
    this.isValid = false;
    this.errorMessage = "";
    this.hasJFIF = false;
    this.jfifVersion = "";
    this.densityUnits = 0;
    this.xDensity = 0;
    this.yDensity = 0;
    this.width = 0;
    this.height = 0;
    this.colorComponents = 0;
    this.bitsPerComponent = 0;
    this.hasExif = false;
    this.cameraMake = "";
    this.cameraModel = "";
    this.software = "";
    this.dateTime = "";
    this.dateTimeOriginal = "";
    this.exposureTime = "";
    this.fNumber = "";
    this.isoSpeed = "";
    this.focalLength = "";
    this.flash = "";
    this.orientation = 1;
    this.xResolution = "";
    this.yResolution = "";
    this.resolutionUnit = 0;
    this.hasGPS = false;
    this.gpsLatitude = "";
    this.gpsLongitude = "";
    this.gpsAltitude = "";
    this.gpsLatitudeRef = "";
    this.gpsLongitudeRef = "";
    this.gpsLatitudeDeg = 0.0;
    this.gpsLongitudeDeg = 0.0;
    this.hasComment = false;
    this.comment = "";
    this.exifTags = [];
  }
}
class JPEGMetadataParser  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.littleEndian = false;
  }
  readUint16BE (offset) {
    const high = this.data._view.getUint8(offset);
    const low = this.data._view.getUint8((offset + 1));
    return (high * 256) + low;
  };
  readUint16 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const low = this.data._view.getUint8(offset);
      const high = this.data._view.getUint8((offset + 1));
      result = (high * 256) + low;
    } else {
      const high_1 = this.data._view.getUint8(offset);
      const low_1 = this.data._view.getUint8((offset + 1));
      result = (high_1 * 256) + low_1;
    }
    return result;
  };
  readUint32 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const b0 = this.data._view.getUint8(offset);
      const b1 = this.data._view.getUint8((offset + 1));
      const b2 = this.data._view.getUint8((offset + 2));
      const b3 = this.data._view.getUint8((offset + 3));
      result = (((b3 * 16777216) + (b2 * 65536)) + (b1 * 256)) + b0;
    } else {
      const b0_1 = this.data._view.getUint8(offset);
      const b1_1 = this.data._view.getUint8((offset + 1));
      const b2_1 = this.data._view.getUint8((offset + 2));
      const b3_1 = this.data._view.getUint8((offset + 3));
      result = (((b0_1 * 16777216) + (b1_1 * 65536)) + (b2_1 * 256)) + b3_1;
    }
    return result;
  };
  readString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const b = this.data._view.getUint8((offset + i));
      if ( b == 0 ) {
        return result;
      }
      result = result + (String.fromCharCode(b));
      i = i + 1;
    };
    return result;
  };
  getTagName (tagId, ifdType) {
    if ( ifdType == 2 ) {
      if ( tagId == 0 ) {
        return "GPSVersionID";
      }
      if ( tagId == 1 ) {
        return "GPSLatitudeRef";
      }
      if ( tagId == 2 ) {
        return "GPSLatitude";
      }
      if ( tagId == 3 ) {
        return "GPSLongitudeRef";
      }
      if ( tagId == 4 ) {
        return "GPSLongitude";
      }
      if ( tagId == 5 ) {
        return "GPSAltitudeRef";
      }
      if ( tagId == 6 ) {
        return "GPSAltitude";
      }
      return "GPS_" + ((tagId.toString()));
    }
    if ( tagId == 256 ) {
      return "ImageWidth";
    }
    if ( tagId == 257 ) {
      return "ImageHeight";
    }
    if ( tagId == 258 ) {
      return "BitsPerSample";
    }
    if ( tagId == 259 ) {
      return "Compression";
    }
    if ( tagId == 262 ) {
      return "PhotometricInterpretation";
    }
    if ( tagId == 270 ) {
      return "ImageDescription";
    }
    if ( tagId == 271 ) {
      return "Make";
    }
    if ( tagId == 272 ) {
      return "Model";
    }
    if ( tagId == 274 ) {
      return "Orientation";
    }
    if ( tagId == 282 ) {
      return "XResolution";
    }
    if ( tagId == 283 ) {
      return "YResolution";
    }
    if ( tagId == 296 ) {
      return "ResolutionUnit";
    }
    if ( tagId == 305 ) {
      return "Software";
    }
    if ( tagId == 306 ) {
      return "DateTime";
    }
    if ( tagId == 315 ) {
      return "Artist";
    }
    if ( tagId == 33432 ) {
      return "Copyright";
    }
    if ( tagId == 33434 ) {
      return "ExposureTime";
    }
    if ( tagId == 33437 ) {
      return "FNumber";
    }
    if ( tagId == 34850 ) {
      return "ExposureProgram";
    }
    if ( tagId == 34855 ) {
      return "ISOSpeedRatings";
    }
    if ( tagId == 36864 ) {
      return "ExifVersion";
    }
    if ( tagId == 36867 ) {
      return "DateTimeOriginal";
    }
    if ( tagId == 36868 ) {
      return "DateTimeDigitized";
    }
    if ( tagId == 37377 ) {
      return "ShutterSpeedValue";
    }
    if ( tagId == 37378 ) {
      return "ApertureValue";
    }
    if ( tagId == 37380 ) {
      return "ExposureBiasValue";
    }
    if ( tagId == 37381 ) {
      return "MaxApertureValue";
    }
    if ( tagId == 37383 ) {
      return "MeteringMode";
    }
    if ( tagId == 37384 ) {
      return "LightSource";
    }
    if ( tagId == 37385 ) {
      return "Flash";
    }
    if ( tagId == 37386 ) {
      return "FocalLength";
    }
    if ( tagId == 37500 ) {
      return "MakerNote";
    }
    if ( tagId == 37510 ) {
      return "UserComment";
    }
    if ( tagId == 40960 ) {
      return "FlashpixVersion";
    }
    if ( tagId == 40961 ) {
      return "ColorSpace";
    }
    if ( tagId == 40962 ) {
      return "PixelXDimension";
    }
    if ( tagId == 40963 ) {
      return "PixelYDimension";
    }
    if ( tagId == 41486 ) {
      return "FocalPlaneXResolution";
    }
    if ( tagId == 41487 ) {
      return "FocalPlaneYResolution";
    }
    if ( tagId == 41488 ) {
      return "FocalPlaneResolutionUnit";
    }
    if ( tagId == 41495 ) {
      return "SensingMethod";
    }
    if ( tagId == 41728 ) {
      return "FileSource";
    }
    if ( tagId == 41729 ) {
      return "SceneType";
    }
    if ( tagId == 41985 ) {
      return "CustomRendered";
    }
    if ( tagId == 41986 ) {
      return "ExposureMode";
    }
    if ( tagId == 41987 ) {
      return "WhiteBalance";
    }
    if ( tagId == 41988 ) {
      return "DigitalZoomRatio";
    }
    if ( tagId == 41989 ) {
      return "FocalLengthIn35mmFilm";
    }
    if ( tagId == 41990 ) {
      return "SceneCaptureType";
    }
    if ( tagId == 34665 ) {
      return "ExifIFDPointer";
    }
    if ( tagId == 34853 ) {
      return "GPSInfoIFDPointer";
    }
    return "Tag_" + ((tagId.toString()));
  };
  formatRational (offset) {
    const numerator = this.readUint32(offset);
    const denominator = this.readUint32((offset + 4));
    if ( denominator == 0 ) {
      return (numerator.toString());
    }
    if ( denominator == 1 ) {
      return (numerator.toString());
    }
    return (((numerator.toString())) + "/") + ((denominator.toString()));
  };
  formatGPSCoordinate (offset, ref) {
    const degNum = this.readUint32(offset);
    const degDen = this.readUint32((offset + 4));
    const minNum = this.readUint32((offset + 8));
    const minDen = this.readUint32((offset + 12));
    const secNum = this.readUint32((offset + 16));
    const secDen = this.readUint32((offset + 20));
    let degrees = 0;
    if ( degDen > 0 ) {
      let tempDeg = degNum;
      while (tempDeg >= degDen) {
        tempDeg = tempDeg - degDen;
        degrees = degrees + 1;
      };
    }
    let minutes = 0;
    if ( minDen > 0 ) {
      let tempMin = minNum;
      while (tempMin >= minDen) {
        tempMin = tempMin - minDen;
        minutes = minutes + 1;
      };
    }
    let seconds = "0";
    if ( secDen > 0 ) {
      let secWhole = 0;
      let tempSec = secNum;
      while (tempSec >= secDen) {
        tempSec = tempSec - secDen;
        secWhole = secWhole + 1;
      };
      const secRem = tempSec;
      if ( secRem > 0 ) {
        let decPartTemp = secRem * 100;
        let decPart = 0;
        while (decPartTemp >= secDen) {
          decPartTemp = decPartTemp - secDen;
          decPart = decPart + 1;
        };
        if ( decPart < 10 ) {
          seconds = (((secWhole.toString())) + ".0") + ((decPart.toString()));
        } else {
          seconds = (((secWhole.toString())) + ".") + ((decPart.toString()));
        }
      } else {
        seconds = (secWhole.toString());
      }
    }
    return ((((((degrees.toString())) + "° ") + ((minutes.toString()))) + "' ") + seconds) + "\"";
  };
  decimalGPS (offset, ref) {
    const degNum = this.readUint32(offset);
    const degDen = this.readUint32((offset + 4));
    const minNum = this.readUint32((offset + 8));
    const minDen = this.readUint32((offset + 12));
    const secNum = this.readUint32((offset + 16));
    const secDen = this.readUint32((offset + 20));
    let total = 0.0;
    if ( degDen > 0 ) {
      const d = (degNum) / (degDen);
      total = total + d;
    }
    if ( minDen > 0 ) {
      const m = (minNum) / (minDen);
      total = total + (m / 60.0);
    }
    if ( secDen > 0 ) {
      const sec = (secNum) / (secDen);
      total = total + (sec / 3600.0);
    }
    if ( ref == "S" ) {
      return 0.0 - total;
    }
    if ( ref == "W" ) {
      return 0.0 - total;
    }
    return total;
  };
  parseIFD (info, tiffStart, ifdOffset, ifdType) {
    let pos = tiffStart + ifdOffset;
    if ( (pos + 2) > this.dataLen ) {
      return;
    }
    const numEntries = this.readUint16(pos);
    pos = pos + 2;
    let i = 0;
    while (i < numEntries) {
      if ( (pos + 12) > this.dataLen ) {
        return;
      }
      const tagId = this.readUint16(pos);
      const dataType = this.readUint16((pos + 2));
      const numValues = this.readUint32((pos + 4));
      let valueOffset = pos + 8;
      let dataSize = 0;
      if ( dataType == 1 ) {
        dataSize = numValues;
      }
      if ( dataType == 2 ) {
        dataSize = numValues;
      }
      if ( dataType == 3 ) {
        dataSize = numValues * 2;
      }
      if ( dataType == 4 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 5 ) {
        dataSize = numValues * 8;
      }
      if ( dataType == 7 ) {
        dataSize = numValues;
      }
      if ( dataType == 9 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 10 ) {
        dataSize = numValues * 8;
      }
      if ( dataSize > 4 ) {
        valueOffset = tiffStart + this.readUint32((pos + 8));
      }
      const tagName = this.getTagName(tagId, ifdType);
      let tagValue = "";
      if ( dataType == 2 ) {
        tagValue = this.readString(valueOffset, numValues);
      }
      if ( dataType == 3 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint16((pos + 8)).toString());
        } else {
          tagValue = (this.readUint16(valueOffset).toString());
        }
      }
      if ( dataType == 4 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint32((pos + 8)).toString());
        } else {
          tagValue = (this.readUint32(valueOffset).toString());
        }
      }
      if ( dataType == 5 ) {
        tagValue = this.formatRational(valueOffset);
      }
      const tag = new ExifTag();
      tag.tagId = tagId;
      tag.tagName = tagName;
      tag.tagValue = tagValue;
      tag.dataType = dataType;
      info.exifTags.push(tag);
      if ( tagId == 271 ) {
        info.cameraMake = tagValue;
      }
      if ( tagId == 272 ) {
        info.cameraModel = tagValue;
      }
      if ( tagId == 305 ) {
        info.software = tagValue;
      }
      if ( tagId == 306 ) {
        info.dateTime = tagValue;
      }
      if ( tagId == 274 ) {
        info.orientation = this.readUint16((pos + 8));
      }
      if ( tagId == 282 ) {
        info.xResolution = tagValue;
      }
      if ( tagId == 283 ) {
        info.yResolution = tagValue;
      }
      if ( tagId == 296 ) {
        info.resolutionUnit = this.readUint16((pos + 8));
      }
      if ( tagId == 36867 ) {
        info.dateTimeOriginal = tagValue;
      }
      if ( tagId == 33434 ) {
        info.exposureTime = tagValue;
      }
      if ( tagId == 33437 ) {
        info.fNumber = tagValue;
      }
      if ( tagId == 34855 ) {
        info.isoSpeed = tagValue;
      }
      if ( tagId == 37386 ) {
        info.focalLength = tagValue;
      }
      if ( tagId == 37385 ) {
        const flashVal = this.readUint16((pos + 8));
        if ( (flashVal % 2) == 1 ) {
          info.flash = "Fired";
        } else {
          info.flash = "Did not fire";
        }
      }
      if ( tagId == 34665 ) {
        const exifOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, exifOffset, 1);
      }
      if ( tagId == 34853 ) {
        info.hasGPS = true;
        const gpsOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, gpsOffset, 2);
      }
      if ( ifdType == 2 ) {
        if ( tagId == 1 ) {
          info.gpsLatitudeRef = tagValue;
        }
        if ( tagId == 2 ) {
          info.gpsLatitude = this.formatGPSCoordinate(valueOffset, info.gpsLatitudeRef);
          info.gpsLatitudeDeg = this.decimalGPS(valueOffset, info.gpsLatitudeRef);
        }
        if ( tagId == 3 ) {
          info.gpsLongitudeRef = tagValue;
        }
        if ( tagId == 4 ) {
          info.gpsLongitude = this.formatGPSCoordinate(valueOffset, info.gpsLongitudeRef);
          info.gpsLongitudeDeg = this.decimalGPS(valueOffset, info.gpsLongitudeRef);
        }
        if ( tagId == 6 ) {
          const altNum = this.readUint32(valueOffset);
          const altDen = this.readUint32((valueOffset + 4));
          if ( altDen > 0 ) {
            let altWhole = 0;
            let tempAlt = altNum;
            while (tempAlt >= altDen) {
              tempAlt = tempAlt - altDen;
              altWhole = altWhole + 1;
            };
            const altRem = tempAlt;
            if ( altRem > 0 ) {
              let altDecTemp = altRem * 10;
              let altDec = 0;
              while (altDecTemp >= altDen) {
                altDecTemp = altDecTemp - altDen;
                altDec = altDec + 1;
              };
              info.gpsAltitude = ((((altWhole.toString())) + ".") + ((altDec.toString()))) + " m";
            } else {
              info.gpsAltitude = ((altWhole.toString())) + " m";
            }
          } else {
            info.gpsAltitude = ((altNum.toString())) + " m";
          }
        }
      }
      pos = pos + 12;
      i = i + 1;
    };
  };
  parseExif (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "Exif" ) {
      return;
    }
    info.hasExif = true;
    const tiffStart = appStart + 6;
    const byteOrder0 = this.data._view.getUint8(tiffStart);
    const byteOrder1 = this.data._view.getUint8((tiffStart + 1));
    if ( (byteOrder0 == 73) && (byteOrder1 == 73) ) {
      this.littleEndian = true;
    } else {
      if ( (byteOrder0 == 77) && (byteOrder1 == 77) ) {
        this.littleEndian = false;
      } else {
        return;
      }
    }
    const magic = this.readUint16((tiffStart + 2));
    if ( magic != 42 ) {
      return;
    }
    const ifd0Offset = this.readUint32((tiffStart + 4));
    this.parseIFD(info, tiffStart, ifd0Offset, 0);
  };
  parseJFIF (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "JFIF" ) {
      return;
    }
    info.hasJFIF = true;
    const verMajor = this.data._view.getUint8((appStart + 5));
    const verMinor = this.data._view.getUint8((appStart + 6));
    info.jfifVersion = (((verMajor.toString())) + ".") + ((verMinor.toString()));
    info.densityUnits = this.data._view.getUint8((appStart + 7));
    info.xDensity = this.readUint16BE((appStart + 8));
    info.yDensity = this.readUint16BE((appStart + 10));
  };
  parseComment (info, appStart, appLen) {
    info.hasComment = true;
    info.comment = this.readString(appStart, appLen);
  };
  parseMetadata (dirPath, fileName) {
    this.data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    return this.parseLoaded();
  };
  parseBuffer (bytes) {
    this.data = bytes;
    return this.parseLoaded();
  };
  parseLoaded () {
    const info = new JPEGMetadataInfo();
    this.dataLen = this.data.byteLength;
    if ( this.dataLen < 4 ) {
      info.errorMessage = "File too small";
      return info;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( (m1 != 255) || (m2 != 216) ) {
      info.errorMessage = "Not a valid JPEG file";
      return info;
    }
    info.isValid = true;
    let pos = 2;
    while (pos < this.dataLen) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8((pos + 1));
      if ( marker2 == 255 ) {
        pos = pos + 1;
        continue;
      }
      if ( (marker2 == 216) || (marker2 == 217) ) {
        pos = pos + 2;
        continue;
      }
      if ( (marker2 >= 208) && (marker2 <= 215) ) {
        pos = pos + 2;
        continue;
      }
      if ( (pos + 4) > this.dataLen ) {
        return info;
      }
      const segLen = this.readUint16BE((pos + 2));
      const segStart = pos + 4;
      if ( marker2 == 224 ) {
        this.parseJFIF(info, segStart, segLen - 2);
      }
      if ( marker2 == 225 ) {
        this.parseExif(info, segStart, segLen - 2);
      }
      if ( marker2 == 254 ) {
        this.parseComment(info, segStart, segLen - 2);
      }
      if ( (marker2 == 192) || (marker2 == 194) ) {
        if ( (pos + 9) < this.dataLen ) {
          info.bitsPerComponent = this.data._view.getUint8((pos + 4));
          info.height = this.readUint16BE((pos + 5));
          info.width = this.readUint16BE((pos + 7));
          info.colorComponents = this.data._view.getUint8((pos + 9));
        }
      }
      if ( marker2 == 218 ) {
        return info;
      }
      if ( marker2 == 217 ) {
        return info;
      }
      pos = (pos + 2) + segLen;
    };
    return info;
  };
  formatMetadata (info) {
    const out = new GrowableBuffer();
    out.writeString("=== JPEG Metadata ===\n\n");
    if ( info.isValid == false ) {
      out.writeString(("Error: " + info.errorMessage) + "\n");
      return (out).toString();
    }
    out.writeString("--- Image Info ---\n");
    out.writeString(((("  Dimensions: " + ((info.width.toString()))) + " x ") + ((info.height.toString()))) + "\n");
    out.writeString(("  Color Components: " + ((info.colorComponents.toString()))) + "\n");
    out.writeString(("  Bits per Component: " + ((info.bitsPerComponent.toString()))) + "\n");
    if ( info.hasJFIF ) {
      out.writeString("\n--- JFIF Info ---\n");
      out.writeString(("  Version: " + info.jfifVersion) + "\n");
      let densityStr = "No units (aspect ratio)";
      if ( info.densityUnits == 1 ) {
        densityStr = "pixels/inch";
      }
      if ( info.densityUnits == 2 ) {
        densityStr = "pixels/cm";
      }
      out.writeString(((((("  Density: " + ((info.xDensity.toString()))) + " x ") + ((info.yDensity.toString()))) + " ") + densityStr) + "\n");
    }
    if ( info.hasExif ) {
      out.writeString("\n--- EXIF Info ---\n");
      if ( (info.cameraMake.length) > 0 ) {
        out.writeString(("  Camera Make: " + info.cameraMake) + "\n");
      }
      if ( (info.cameraModel.length) > 0 ) {
        out.writeString(("  Camera Model: " + info.cameraModel) + "\n");
      }
      if ( (info.software.length) > 0 ) {
        out.writeString(("  Software: " + info.software) + "\n");
      }
      if ( (info.dateTimeOriginal.length) > 0 ) {
        out.writeString(("  Date/Time Original: " + info.dateTimeOriginal) + "\n");
      } else {
        if ( (info.dateTime.length) > 0 ) {
          out.writeString(("  Date/Time: " + info.dateTime) + "\n");
        }
      }
      if ( (info.exposureTime.length) > 0 ) {
        out.writeString(("  Exposure Time: " + info.exposureTime) + " sec\n");
      }
      if ( (info.fNumber.length) > 0 ) {
        out.writeString(("  F-Number: f/" + info.fNumber) + "\n");
      }
      if ( (info.isoSpeed.length) > 0 ) {
        out.writeString(("  ISO Speed: " + info.isoSpeed) + "\n");
      }
      if ( (info.focalLength.length) > 0 ) {
        out.writeString(("  Focal Length: " + info.focalLength) + " mm\n");
      }
      if ( (info.flash.length) > 0 ) {
        out.writeString(("  Flash: " + info.flash) + "\n");
      }
      let orientStr = "Normal";
      if ( info.orientation == 2 ) {
        orientStr = "Flip horizontal";
      }
      if ( info.orientation == 3 ) {
        orientStr = "Rotate 180";
      }
      if ( info.orientation == 4 ) {
        orientStr = "Flip vertical";
      }
      if ( info.orientation == 5 ) {
        orientStr = "Transpose";
      }
      if ( info.orientation == 6 ) {
        orientStr = "Rotate 90 CW";
      }
      if ( info.orientation == 7 ) {
        orientStr = "Transverse";
      }
      if ( info.orientation == 8 ) {
        orientStr = "Rotate 270 CW";
      }
      out.writeString(("  Orientation: " + orientStr) + "\n");
    }
    if ( info.hasGPS ) {
      out.writeString("\n--- GPS Info ---\n");
      if ( (info.gpsLatitude.length) > 0 ) {
        out.writeString(("  Latitude: " + info.gpsLatitude) + "\n");
      }
      if ( (info.gpsLongitude.length) > 0 ) {
        out.writeString(("  Longitude: " + info.gpsLongitude) + "\n");
      }
      if ( (info.gpsAltitude.length) > 0 ) {
        out.writeString(("  Altitude: " + info.gpsAltitude) + "\n");
      }
    }
    if ( info.hasComment ) {
      out.writeString("\n--- Comment ---\n");
      out.writeString(("  " + info.comment) + "\n");
    }
    const tagCount = info.exifTags.length;
    if ( tagCount > 0 ) {
      out.writeString(("\n--- All EXIF Tags (" + ((tagCount.toString()))) + ") ---\n");
      for ( let idx = 0; idx < info.exifTags.length; idx++) {
        var tag = info.exifTags[idx];
        out.writeString(("  " + tag.tagName) + " (0x");
        let tagHex = "";
        const tid = tag.tagId;
        const hexChars = "0123456789ABCDEF";
        const h3D = tid / 4096;
        const h3 = Math.floor( h3D);
        const r3 = tid - (h3 * 4096);
        const h2D = r3 / 256;
        const h2 = Math.floor( h2D);
        const r2 = r3 - (h2 * 256);
        const h1D = r2 / 16;
        const h1 = Math.floor( h1D);
        const h0 = r2 - (h1 * 16);
        tagHex = (((hexChars.substring(h3, (h3 + 1) )) + (hexChars.substring(h2, (h2 + 1) ))) + (hexChars.substring(h1, (h1 + 1) ))) + (hexChars.substring(h0, (h0 + 1) ));
        out.writeString(((tagHex + "): ") + tag.tagValue) + "\n");
      };
    }
    return (out).toString();
  };
}
class JPEGMetadataMain  {
  constructor() {
  }
}
class PDFWriter  {
  constructor() {
    this.nextObjNum = 1;
    this.objectOffsets = [];
    this.imageObjNum = 0;
    const buf = new GrowableBuffer();
    this.pdfBuffer = buf;
    const reader = new JPEGReader();
    this.jpegReader = reader;
    const parser = new JPEGMetadataParser();
    this.metadataParser = parser;
  }
  writeObject (content) {
    const buf = this.pdfBuffer;
    this.objectOffsets.push((buf).size());
    buf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    buf.writeString(content);
    buf.writeString("\nendobj\n\n");
    this.nextObjNum = this.nextObjNum + 1;
  };
  writeObjectGetNum (content) {
    const objNum = this.nextObjNum;
    this.writeObject(content);
    return objNum;
  };
  writeImageObject (header, imageData, footer) {
    const buf = this.pdfBuffer;
    this.objectOffsets.push((buf).size());
    buf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    buf.writeString(header);
    buf.writeBuffer(imageData);
    buf.writeString(footer);
    buf.writeString("\nendobj\n\n");
    const objNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    return objNum;
  };
  addJPEGImage (dirPath, fileName) {
    const reader = this.jpegReader;
    const img = reader.readJPEG(dirPath, fileName);
    if ( img.isValid == false ) {
      console.log("Error loading image: " + img.errorMessage);
      return 0;
    }
    console.log(reader.getImageInfo(img));
    const parser = this.metadataParser;
    const meta = parser.parseMetadata(dirPath, fileName);
    this.lastImageMetadata = meta;
    let colorSpace = "/DeviceRGB";
    if ( img.colorComponents == 1 ) {
      colorSpace = "/DeviceGray";
    }
    if ( img.colorComponents == 4 ) {
      colorSpace = "/DeviceCMYK";
    }
    const imgData = img.imageData;
    const dataLen = imgData.byteLength;
    let imgHeader = "<< /Type /XObject /Subtype /Image";
    imgHeader = (imgHeader + " /Width ") + ((img.width.toString()));
    imgHeader = (imgHeader + " /Height ") + ((img.height.toString()));
    imgHeader = (imgHeader + " /ColorSpace ") + colorSpace;
    imgHeader = (imgHeader + " /BitsPerComponent ") + ((img.bitsPerComponent.toString()));
    imgHeader = imgHeader + " /Filter /DCTDecode";
    imgHeader = (imgHeader + " /Length ") + ((dataLen.toString()));
    imgHeader = imgHeader + " >>\nstream\n";
    const imgFooter = "\nendstream";
    this.imageObjNum = this.writeImageObject(imgHeader, imgData, imgFooter);
    return this.imageObjNum;
  };
  toOctalEscape (ch) {
    const d0 = ch % 8;
    const t1 = Math.floor((ch / 8));
    const d1 = t1 % 8;
    const d2 = Math.floor((t1 / 8));
    return (("\\" + ((d2.toString()))) + ((d1.toString()))) + ((d0.toString()));
  };
  escapeText (text) {
    let result = "";
    const __len = text.length;
    let i = 0;
    while (i < __len) {
      const ch = text.charCodeAt(i );
      if ( ch == 40 ) {
        result = result + "\\(";
      } else {
        if ( ch == 41 ) {
          result = result + "\\)";
        } else {
          if ( ch == 92 ) {
            result = result + "\\\\";
          } else {
            if ( ch < 128 ) {
              result = result + (String.fromCharCode(ch));
            } else {
              if ( ch <= 255 ) {
                result = result + this.toOctalEscape(ch);
              } else {
                result = result + "?";
              }
            }
          }
        }
      }
      i = i + 1;
    };
    return result;
  };
  createHelloWorldPDF (message) {
    return this.createPDFWithImage(message, "", "");
  };
  createPDFWithImage (message, imageDirPath, imageFileName) {
    this.nextObjNum = 1;
    const buf = this.pdfBuffer;
    (buf).clear();
    this.imageObjNum = 0;
    this.objectOffsets.length = 0;
    buf.writeString("%PDF-1.4\n");
    buf.writeByte(37);
    buf.writeByte(226);
    buf.writeByte(227);
    buf.writeByte(207);
    buf.writeByte(211);
    buf.writeByte(10);
    let hasImage = (imageFileName.length) > 0;
    if ( hasImage ) {
      const imgNum = this.addJPEGImage(imageDirPath, imageFileName);
      if ( imgNum == 0 ) {
        hasImage = false;
      }
    }
    const catalogObjNum = this.nextObjNum;
    const pagesObjNum = this.nextObjNum + 1;
    this.writeObject(("<< /Type /Catalog /Pages " + ((pagesObjNum.toString()))) + " 0 R >>");
    const pageObjNum = this.nextObjNum + 1;
    this.writeObject(("<< /Type /Pages /Kids [" + ((pageObjNum.toString()))) + " 0 R] /Count 1 >>");
    const contentObjNum = this.nextObjNum + 1;
    const fontObjNum = this.nextObjNum + 2;
    let resourcesStr = ("<< /Font << /F1 " + ((fontObjNum.toString()))) + " 0 R >>";
    if ( hasImage ) {
      resourcesStr = ((resourcesStr + " /XObject << /Img1 ") + ((this.imageObjNum.toString()))) + " 0 R >>";
    }
    resourcesStr = resourcesStr + " >>";
    this.writeObject(((((("<< /Type /Page /Parent " + ((pagesObjNum.toString()))) + " 0 R /MediaBox [0 0 612 792] /Contents ") + ((contentObjNum.toString()))) + " 0 R /Resources ") + resourcesStr) + " >>");
    const streamBuf = new GrowableBuffer();
    if ( hasImage ) {
      streamBuf.writeString("q\n");
      streamBuf.writeString("150 0 0 150 400 600 cm\n");
      streamBuf.writeString("/Img1 Do\n");
      streamBuf.writeString("Q\n");
    }
    streamBuf.writeString("q\n");
    streamBuf.writeString("1 0 0 RG\n");
    streamBuf.writeString("1 0.8 0.8 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("100 650 80 60 re\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0 1 RG\n");
    streamBuf.writeString("0.8 0.8 1 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("220 650 m\n");
    streamBuf.writeString("280 650 l\n");
    streamBuf.writeString("250 710 l\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0.5 0 RG\n");
    streamBuf.writeString("0.8 1 0.8 rg\n");
    streamBuf.writeString("2 w\n");
    const cx = 370;
    const cy = 680;
    const r = 30;
    const k = 17;
    streamBuf.writeString((((((cx + r).toString())) + " ") + ((cy.toString()))) + " m\n");
    streamBuf.writeString((((((((((((((cx + r).toString())) + " ") + (((cy + k).toString()))) + " ") + (((cx + k).toString()))) + " ") + (((cy + r).toString()))) + " ") + ((cx.toString()))) + " ") + (((cy + r).toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx - k).toString())) + " ") + (((cy + r).toString()))) + " ") + (((cx - r).toString()))) + " ") + (((cy + k).toString()))) + " ") + (((cx - r).toString()))) + " ") + ((cy.toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx - r).toString())) + " ") + (((cy - k).toString()))) + " ") + (((cx - k).toString()))) + " ") + (((cy - r).toString()))) + " ") + ((cx.toString()))) + " ") + (((cy - r).toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx + k).toString())) + " ") + (((cy - r).toString()))) + " ") + (((cx + r).toString()))) + " ") + (((cy - k).toString()))) + " ") + (((cx + r).toString()))) + " ") + ((cy.toString()))) + " c\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.8 0 0.2 RG\n");
    streamBuf.writeString("1 0.4 0.5 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("140 480 m\n");
    streamBuf.writeString("90 510 80 560 110 580 c\n");
    streamBuf.writeString("130 595 140 580 140 565 c\n");
    streamBuf.writeString("140 580 150 595 170 580 c\n");
    streamBuf.writeString("200 560 190 510 140 480 c\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0.5 0.8 RG\n");
    streamBuf.writeString("2 w\n");
    const sx = 300;
    const sy = 530;
    const arm = 50;
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy + arm).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx + 43).toString())) + " ") + (((sy + 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx + 43).toString())) + " ") + (((sy - 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy - arm).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx - 43).toString())) + " ") + (((sy - 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx - 43).toString())) + " ") + (((sy + 25).toString()))) + " l\n");
    streamBuf.writeString((((((sx - 10).toString())) + " ") + ((((sy + arm) - 10).toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy + arm).toString()))) + " l\n");
    streamBuf.writeString((((((sx + 10).toString())) + " ") + ((((sy + arm) - 10).toString()))) + " l\n");
    streamBuf.writeString((((((sx - 10).toString())) + " ") + ((((sy - arm) + 10).toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy - arm).toString()))) + " l\n");
    streamBuf.writeString((((((sx + 10).toString())) + " ") + ((((sy - arm) + 10).toString()))) + " l\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.8 0.6 0 RG\n");
    streamBuf.writeString("1 0.9 0.3 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("460 575 m\n");
    streamBuf.writeString("472 545 l\n");
    streamBuf.writeString("505 545 l\n");
    streamBuf.writeString("478 522 l\n");
    streamBuf.writeString("488 490 l\n");
    streamBuf.writeString("460 508 l\n");
    streamBuf.writeString("432 490 l\n");
    streamBuf.writeString("442 522 l\n");
    streamBuf.writeString("415 545 l\n");
    streamBuf.writeString("448 545 l\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.5 0.5 0.5 RG\n");
    streamBuf.writeString("1 w\n");
    streamBuf.writeString("50 450 m\n");
    streamBuf.writeString("562 450 l\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.6 0 0.6 RG\n");
    streamBuf.writeString("3 w\n");
    streamBuf.writeString("50 400 m\n");
    streamBuf.writeString("150 450 200 350 300 400 c\n");
    streamBuf.writeString("400 450 450 350 550 400 c\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("BT\n");
    streamBuf.writeString("/F1 36 Tf\n");
    streamBuf.writeString("100 320 Td\n");
    streamBuf.writeString(("(" + this.escapeText(message)) + ") Tj\n");
    streamBuf.writeString("ET\n");
    streamBuf.writeString("BT\n");
    streamBuf.writeString("/F1 14 Tf\n");
    streamBuf.writeString("100 280 Td\n");
    streamBuf.writeString("(Generated by Ranger PDF Writer) Tj\n");
    streamBuf.writeString("ET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n100 630 Td\n(Rectangle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n225 630 Td\n(Triangle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n355 630 Td\n(Circle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n125 465 Td\n(Heart) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n275 465 Td\n(Snowflake) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n445 465 Td\n(Star) Tj\nET\n");
    if ( hasImage ) {
      streamBuf.writeString("BT\n/F1 10 Tf\n400 585 Td\n(JPEG Image) Tj\nET\n");
      if ( (typeof(this.lastImageMetadata) !== "undefined" && this.lastImageMetadata != null )  ) {
        const meta = this.lastImageMetadata;
        let metaY = 240;
        streamBuf.writeString(("BT\n/F1 12 Tf\n400 " + ((metaY.toString()))) + " Td\n(Image Metadata:) Tj\nET\n");
        metaY = metaY - 14;
        streamBuf.writeString(((((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Size: ") + ((meta.width.toString()))) + " x ") + ((meta.height.toString()))) + ") Tj\nET\n");
        metaY = metaY - 12;
        if ( meta.hasExif ) {
          if ( (meta.cameraMake.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Make: ") + this.escapeText(meta.cameraMake)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.cameraModel.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Model: ") + this.escapeText(meta.cameraModel)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.dateTimeOriginal.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Date: ") + this.escapeText(meta.dateTimeOriginal)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.exposureTime.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Exposure: ") + meta.exposureTime) + " sec) Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.fNumber.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Aperture: f/") + meta.fNumber) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.isoSpeed.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(ISO: ") + meta.isoSpeed) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.focalLength.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Focal Length: ") + meta.focalLength) + " mm) Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.flash.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Flash: ") + meta.flash) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
        }
        if ( meta.hasGPS ) {
          streamBuf.writeString(("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(--- GPS Data ---) Tj\nET\n");
          metaY = metaY - 12;
          if ( (meta.gpsLatitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Latitude: ") + meta.gpsLatitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.gpsLongitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Longitude: ") + meta.gpsLongitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.gpsAltitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Altitude: ") + meta.gpsAltitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
        }
      }
    }
    const streamLen = (streamBuf).size();
    const streamContent = (streamBuf).toString();
    this.writeObject(((("<< /Length " + ((streamLen.toString()))) + " >>\nstream\n") + streamContent) + "endstream");
    this.writeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    let rootObjNum = 1;
    if ( hasImage ) {
      rootObjNum = 2;
    }
    const xrefOffset = (buf).size();
    buf.writeString("xref\n");
    buf.writeString(("0 " + ((this.nextObjNum.toString()))) + "\n");
    buf.writeString("0000000000 65535 f \n");
    for ( let i = 0; i < this.objectOffsets.length; i++) {
      var offset = this.objectOffsets[i];
      let offsetStr = (offset.toString());
      while ((offsetStr.length) < 10) {
        offsetStr = "0" + offsetStr;
      };
      buf.writeString(offsetStr + " 00000 n \n");
    };
    buf.writeString("trailer\n");
    buf.writeString(((("<< /Size " + ((this.nextObjNum.toString()))) + " /Root ") + ((rootObjNum.toString()))) + " 0 R >>\n");
    buf.writeString("startxref\n");
    buf.writeString(((xrefOffset.toString())) + "\n");
    buf.writeString("%%EOF\n");
    return buf.toBuffer();
  };
  savePDF (path, filename, message) {
    const pdfContent = this.createHelloWorldPDF(message);
    require('fs').writeFileSync(path + '/' + filename, Buffer.from(pdfContent));
    console.log((("PDF saved to " + path) + "/") + filename);
  };
  savePDFWithImage (path, filename, message, imageDirPath, imageFileName) {
    const pdfContent = this.createPDFWithImage(message, imageDirPath, imageFileName);
    require('fs').writeFileSync(path + '/' + filename, Buffer.from(pdfContent));
    console.log((("PDF saved to " + path) + "/") + filename);
  };
}
class Main  {
  constructor() {
  }
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
    let joiner = " ";
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
      let hyphen = false;
      if ( isEnd == false ) {
        if ( EVGCodepoint.breaksAfter(ch) ) {
          if ( i > wordStart ) {
            isWordEnd = true;
            hyphen = true;
          }
        }
      }
      if ( isWordEnd ) {
        let wordEnd = i;
        if ( hyphen ) {
          wordEnd = i + 1;
        }
        let word = "";
        if ( wordEnd > wordStart ) {
          word = text.substring(wordStart, wordEnd );
        }
        const wordWidth = this.measureTextWidth(word, fontFamily, fontSize);
        let spaceWidth = 0.0;
        if ( (currentLine.length) > 0 ) {
          if ( (joiner.length) > 0 ) {
            spaceWidth = this.measureTextWidth(joiner, fontFamily, fontSize);
          }
        }
        if ( ((currentWidth + spaceWidth) + wordWidth) <= maxWidth ) {
          if ( (currentLine.length) > 0 ) {
            currentLine = currentLine + joiner;
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
        joiner = " ";
        if ( hyphen ) {
          joiner = "";
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
    root.applyOwnDirection(false);
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
      this.mirrorChildren(element);
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
          this.layoutElement(child, 0.0, 0.0, innerWidth, innerHeight);
          this.translateSubtree(child, startX, startY);
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
  mirrorChildren (parent) {
    if ( parent.resolvedRtl == false ) {
      return;
    }
    const left = (parent.calculatedX + parent.box.borderWidthPx) + parent.box.paddingLeftPx;
    const right = left + parent.calculatedInnerWidth;
    const span = left + right;
    const n = parent.getChildCount();
    let i = 0;
    while (i < n) {
      const ch = parent.getChild(i);
      if ( ch.isAbsolute == false ) {
        const mL = ch.box.marginLeftPx;
        const mR = ch.box.marginRightPx;
        const marginRightEdge = (ch.calculatedX + ch.calculatedWidth) + mR;
        const nx = (span - marginRightEdge) + mL;
        this.translateSubtree(ch, nx - ch.calculatedX, 0.0);
      }
      i = i + 1;
    };
  };
  translateSubtree (element, dx, dy) {
    element.calculatedX = element.calculatedX + dx;
    element.calculatedY = element.calculatedY + dy;
    const count = element.getChildCount();
    let i = 0;
    while (i < count) {
      this.translateSubtree(element.getChild(i), dx, dy);
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
class PathCommand  {
  constructor() {
    this.type = "";
    this.x = 0.0;
    this.y = 0.0;
    this.x1 = 0.0;
    this.y1 = 0.0;
    this.x2 = 0.0;
    this.y2 = 0.0;
    this.rx = 0.0;     /** note: unused */
    this.ry = 0.0;     /** note: unused */
    this.rotation = 0.0;     /** note: unused */
    this.largeArc = false;     /** note: unused */
    this.sweep = false;     /** note: unused */
  }
}
class PathRing  {
  constructor() {
    this.pts = [];
    let p = [];
    this.pts = p;
  }
  pointCount () {
    return (((this.pts.length) / 2) | 0);
  };
}
class PathBounds  {
  constructor() {
    this.minX = 0.0;
    this.minY = 0.0;
    this.maxX = 0.0;
    this.maxY = 0.0;
    this.width = 0.0;
    this.height = 0.0;
  }
}
class SVGPathParser  {
  constructor() {
    this.pathData = "";
    this.i = 0;
    this.__len = 0;
    this.currentX = 0.0;
    this.currentY = 0.0;
    this.startX = 0.0;
    this.startY = 0.0;
    this.commands = [];
    this.lastCtrlX = 0.0;
    this.lastCtrlY = 0.0;
    this.lastCtrlKind = "";
    this.errors = [];
    this.truncated = false;
    this.numFail = false;
    let emptyCommands = [];
    this.commands = emptyCommands;
    let emptyErrors = [];
    this.errors = emptyErrors;
    this.bounds = new PathBounds();
  }
  getErrors () {
    return this.errors;
  };
  hasErrors () {
    return (this.errors.length) > 0;
  };
  errorSummary () {
    const n = this.errors.length;
    if ( n == 0 ) {
      return "";
    }
    let out = this.errors[0];
    let k = 1;
    while (k < n) {
      out = (out + "; ") + (this.errors[k]);
      k = k + 1;
    };
    return out;
  };
  addError (msg) {
    this.errors.push((msg + " at offset ") + ((this.i.toString())));
  };
  parse (data) {
    this.pathData = data;
    this.i = 0;
    this.__len = data.length;
    this.currentX = 0.0;
    this.currentY = 0.0;
    this.startX = 0.0;
    this.startY = 0.0;
    let emptyCommands = [];
    this.commands = emptyCommands;
    let emptyErrors = [];
    this.errors = emptyErrors;
    this.truncated = false;
    this.lastCtrlKind = "";
    let pending = 0;
    while (this.i < this.__len) {
      this.skipWhitespace();
      if ( this.i >= this.__len ) {
        break;
      }
      const ch = this.pathData.charCodeAt(this.i );
      const chInt = ch;
      let isLetter = false;
      if ( (chInt >= 65) && (chInt <= 90) ) {
        isLetter = true;
      }
      if ( (chInt >= 97) && (chInt <= 122) ) {
        isLetter = true;
      }
      if ( isLetter ) {
        pending = chInt;
        this.i = this.i + 1;
      } else {
        if ( pending == 0 ) {
          this.addError("path data must begin with a command letter");
          this.truncated = true;
          break;
        }
        if ( pending == 77 ) {
          pending = 76;
        }
        if ( pending == 109 ) {
          pending = 108;
        }
        if ( pending == 90 ) {
          this.addError("unexpected number after closepath");
          this.truncated = true;
          break;
        }
        if ( pending == 122 ) {
          this.addError("unexpected number after closepath");
          this.truncated = true;
          break;
        }
      }
      const ok = this.parseCommand(pending);
      if ( ok == false ) {
        this.truncated = true;
        break;
      }
    };
    this.calculateBounds();
  };
  hasNumberAhead () {
    this.skipWhitespace();
    if ( this.i >= this.__len ) {
      return false;
    }
    const ch = this.pathData.charCodeAt(this.i );
    const chInt = ch;
    if ( (chInt >= 48) && (chInt <= 57) ) {
      return true;
    }
    if ( chInt == 46 ) {
      return true;
    }
    if ( chInt == 45 ) {
      return true;
    }
    if ( chInt == 43 ) {
      return true;
    }
    return false;
  };
  parseFlag () {
    this.skipWhitespace();
    if ( this.i >= this.__len ) {
      this.numFail = true;
      this.addError("arc flag expected");
      return false;
    }
    const ch = this.pathData.charCodeAt(this.i );
    const chInt = ch;
    if ( chInt == 48 ) {
      this.i = this.i + 1;
      return false;
    }
    if ( chInt == 49 ) {
      this.i = this.i + 1;
      return true;
    }
    this.numFail = true;
    this.addError("arc flag must be 0 or 1");
    return false;
  };
  skipWhitespace () {
    while (this.i < this.__len) {
      const ch = this.pathData.charCodeAt(this.i );
      const chInt = ch;
      if ( ((((chInt == 32) || (chInt == 9)) || (chInt == 10)) || (chInt == 13)) || (chInt == 44) ) {
        this.i = this.i + 1;
      } else {
        break;
      }
    };
  };
  parseNumber () {
    this.skipWhitespace();
    const start = this.i;
    const ch = this.pathData.charCodeAt(this.i );
    const chInt = ch;
    if ( (chInt == 45) || (chInt == 43) ) {
      this.i = this.i + 1;
    }
    while (this.i < this.__len) {
      const ch2 = this.pathData.charCodeAt(this.i );
      const chInt2 = ch2;
      if ( (chInt2 >= 48) && (chInt2 <= 57) ) {
        this.i = this.i + 1;
      } else {
        break;
      }
    };
    if ( this.i < this.__len ) {
      const ch3 = this.pathData.charCodeAt(this.i );
      const chInt3 = ch3;
      if ( chInt3 == 46 ) {
        this.i = this.i + 1;
        while (this.i < this.__len) {
          const ch4 = this.pathData.charCodeAt(this.i );
          const chInt4 = ch4;
          if ( (chInt4 >= 48) && (chInt4 <= 57) ) {
            this.i = this.i + 1;
          } else {
            break;
          }
        };
      }
    }
    if ( this.i < this.__len ) {
      const ch5 = this.pathData.charCodeAt(this.i );
      const chInt5 = ch5;
      if ( (chInt5 == 101) || (chInt5 == 69) ) {
        this.i = this.i + 1;
        if ( this.i < this.__len ) {
          const ch6 = this.pathData.charCodeAt(this.i );
          const chInt6 = ch6;
          if ( (chInt6 == 45) || (chInt6 == 43) ) {
            this.i = this.i + 1;
          }
        }
        while (this.i < this.__len) {
          const ch7 = this.pathData.charCodeAt(this.i );
          const chInt7 = ch7;
          if ( (chInt7 >= 48) && (chInt7 <= 57) ) {
            this.i = this.i + 1;
          } else {
            break;
          }
        };
      }
    }
    const numStr = this.pathData.substring(start, this.i );
    const parsed = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
    if ( typeof(parsed) != "undefined" ) {
      return parsed;
    }
    this.numFail = true;
    this.addError("expected a number");
    return 0.0;
  };
  parseCommand (cmdInt) {
    this.numFail = false;
    if ( (cmdInt == 77) || (cmdInt == 109) ) {
      let x = this.parseNumber();
      let y = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 109 ) {
        x = this.currentX + x;
        y = this.currentY + y;
      }
      const pathCmd = new PathCommand();
      pathCmd.type = "M";
      pathCmd.x = x;
      pathCmd.y = y;
      this.commands.push(pathCmd);
      this.currentX = x;
      this.currentY = y;
      this.startX = x;
      this.startY = y;
      this.lastCtrlKind = "";
      return true;
    }
    if ( (cmdInt == 76) || (cmdInt == 108) ) {
      let x_1 = this.parseNumber();
      let y_1 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 108 ) {
        x_1 = this.currentX + x_1;
        y_1 = this.currentY + y_1;
      }
      this.emitLine(x_1, y_1);
      return true;
    }
    if ( (cmdInt == 72) || (cmdInt == 104) ) {
      let x_2 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 104 ) {
        x_2 = this.currentX + x_2;
      }
      this.emitLine(x_2, this.currentY);
      return true;
    }
    if ( (cmdInt == 86) || (cmdInt == 118) ) {
      let y_2 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 118 ) {
        y_2 = this.currentY + y_2;
      }
      this.emitLine(this.currentX, y_2);
      return true;
    }
    if ( (cmdInt == 67) || (cmdInt == 99) ) {
      let x1 = this.parseNumber();
      let y1 = this.parseNumber();
      let x2 = this.parseNumber();
      let y2 = this.parseNumber();
      let x_3 = this.parseNumber();
      let y_3 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 99 ) {
        x1 = this.currentX + x1;
        y1 = this.currentY + y1;
        x2 = this.currentX + x2;
        y2 = this.currentY + y2;
        x_3 = this.currentX + x_3;
        y_3 = this.currentY + y_3;
      }
      this.emitCubic(x1, y1, x2, y2, x_3, y_3);
      return true;
    }
    if ( (cmdInt == 83) || (cmdInt == 115) ) {
      let x2_1 = this.parseNumber();
      let y2_1 = this.parseNumber();
      let x_4 = this.parseNumber();
      let y_4 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 115 ) {
        x2_1 = this.currentX + x2_1;
        y2_1 = this.currentY + y2_1;
        x_4 = this.currentX + x_4;
        y_4 = this.currentY + y_4;
      }
      let x1_1 = this.currentX;
      let y1_1 = this.currentY;
      if ( this.lastCtrlKind == "C" ) {
        x1_1 = (2.0 * this.currentX) - this.lastCtrlX;
        y1_1 = (2.0 * this.currentY) - this.lastCtrlY;
      }
      this.emitCubic(x1_1, y1_1, x2_1, y2_1, x_4, y_4);
      return true;
    }
    if ( (cmdInt == 81) || (cmdInt == 113) ) {
      let x1_2 = this.parseNumber();
      let y1_2 = this.parseNumber();
      let x_5 = this.parseNumber();
      let y_5 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 113 ) {
        x1_2 = this.currentX + x1_2;
        y1_2 = this.currentY + y1_2;
        x_5 = this.currentX + x_5;
        y_5 = this.currentY + y_5;
      }
      this.emitQuad(x1_2, y1_2, x_5, y_5);
      return true;
    }
    if ( (cmdInt == 84) || (cmdInt == 116) ) {
      let x_6 = this.parseNumber();
      let y_6 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 116 ) {
        x_6 = this.currentX + x_6;
        y_6 = this.currentY + y_6;
      }
      let x1_3 = this.currentX;
      let y1_3 = this.currentY;
      if ( this.lastCtrlKind == "Q" ) {
        x1_3 = (2.0 * this.currentX) - this.lastCtrlX;
        y1_3 = (2.0 * this.currentY) - this.lastCtrlY;
      }
      this.emitQuad(x1_3, y1_3, x_6, y_6);
      return true;
    }
    if ( (cmdInt == 65) || (cmdInt == 97) ) {
      const rx = this.parseNumber();
      const ry = this.parseNumber();
      const rot = this.parseNumber();
      const largeArc = this.parseFlag();
      const sweep = this.parseFlag();
      let x_7 = this.parseNumber();
      let y_7 = this.parseNumber();
      if ( this.numFail ) {
        return false;
      }
      if ( cmdInt == 97 ) {
        x_7 = this.currentX + x_7;
        y_7 = this.currentY + y_7;
      }
      this.emitArc(rx, ry, rot, largeArc, sweep, x_7, y_7);
      return true;
    }
    if ( (cmdInt == 90) || (cmdInt == 122) ) {
      const pathCmd_1 = new PathCommand();
      pathCmd_1.type = "Z";
      this.commands.push(pathCmd_1);
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.lastCtrlKind = "";
      return true;
    }
    this.addError(("unsupported path command '" + (String.fromCharCode(cmdInt))) + "'");
    return false;
  };
  emitLine (x, y) {
    const pathCmd = new PathCommand();
    pathCmd.type = "L";
    pathCmd.x = x;
    pathCmd.y = y;
    this.commands.push(pathCmd);
    this.currentX = x;
    this.currentY = y;
    this.lastCtrlKind = "";
  };
  emitCubic (x1, y1, x2, y2, x, y) {
    const pathCmd = new PathCommand();
    pathCmd.type = "C";
    pathCmd.x1 = x1;
    pathCmd.y1 = y1;
    pathCmd.x2 = x2;
    pathCmd.y2 = y2;
    pathCmd.x = x;
    pathCmd.y = y;
    this.commands.push(pathCmd);
    this.currentX = x;
    this.currentY = y;
    this.lastCtrlX = x2;
    this.lastCtrlY = y2;
    this.lastCtrlKind = "C";
  };
  emitQuad (x1, y1, x, y) {
    const pathCmd = new PathCommand();
    pathCmd.type = "Q";
    pathCmd.x1 = x1;
    pathCmd.y1 = y1;
    pathCmd.x = x;
    pathCmd.y = y;
    this.commands.push(pathCmd);
    this.currentX = x;
    this.currentY = y;
    this.lastCtrlX = x1;
    this.lastCtrlY = y1;
    this.lastCtrlKind = "Q";
  };
  emitArc (rxIn, ryIn, rotDeg, largeArc, sweep, x, y) {
    const x1 = this.currentX;
    const y1 = this.currentY;
    const x2 = x;
    const y2 = y;
    let rx = Math.abs(rxIn);
    let ry = Math.abs(ryIn);
    const dx = x1 - x2;
    const dy = y1 - y2;
    const d = Math.sqrt(((dx * dx) + (dy * dy)));
    if ( d < 0.00001 ) {
      this.emitLine(x2, y2);
      return;
    }
    if ( rx < 0.00001 ) {
      this.emitLine(x2, y2);
      return;
    }
    if ( ry < 0.00001 ) {
      this.emitLine(x2, y2);
      return;
    }
    const PI = Math.PI;
    const rot = (rotDeg / 180.0) * PI;
    const sinrot = Math.sin(rot);
    const cosrot = Math.cos(rot);
    const x1p = ((cosrot * dx) / 2.0) + ((sinrot * dy) / 2.0);
    const y1p = (((0.0 - sinrot) * dx) / 2.0) + ((cosrot * dy) / 2.0);
    const lambda = ((x1p * x1p) / (rx * rx)) + ((y1p * y1p) / (ry * ry));
    if ( lambda > 1.0 ) {
      const k = Math.sqrt(lambda);
      rx = rx * k;
      ry = ry * k;
    }
    let sa = (((rx * rx) * (ry * ry)) - ((rx * rx) * (y1p * y1p))) - ((ry * ry) * (x1p * x1p));
    const sb = ((rx * rx) * (y1p * y1p)) + ((ry * ry) * (x1p * x1p));
    if ( sa < 0.0 ) {
      sa = 0.0;
    }
    let s = 0.0;
    if ( sb > 0.0 ) {
      s = Math.sqrt((sa / sb));
    }
    if ( largeArc == sweep ) {
      s = 0.0 - s;
    }
    const cxp = ((s * rx) * y1p) / ry;
    const cyp = (((0.0 - s) * ry) * x1p) / rx;
    const cx = ((x1 + x2) / 2.0) + ((cosrot * cxp) - (sinrot * cyp));
    const cy = ((y1 + y2) / 2.0) + ((sinrot * cxp) + (cosrot * cyp));
    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = ((0.0 - x1p) - cxp) / rx;
    const vy = ((0.0 - y1p) - cyp) / ry;
    const a1 = this.vecAngle(1.0, 0.0, ux, uy);
    let da = this.vecAngle(ux, uy, vx, vy);
    if ( sweep == false ) {
      if ( da > 0.0 ) {
        da = da - (2.0 * PI);
      }
    } else {
      if ( da < 0.0 ) {
        da = (2.0 * PI) + da;
      }
    }
    const ndivs = Math.floor( (((Math.abs(da)) / (PI * 0.5)) + 1.0));
    const hda = (da / (ndivs)) / 2.0;
    let kappa = Math.abs((((4.0 / 3.0) * (1.0 - (Math.cos(hda)))) / (Math.sin(hda))));
    if ( da < 0.0 ) {
      kappa = 0.0 - kappa;
    }
    let px = 0.0;
    let py = 0.0;
    let ptanx = 0.0;
    let ptany = 0.0;
    let k_1 = 0;
    while (k_1 <= ndivs) {
      const a = a1 + ((da * (k_1)) / (ndivs));
      const cosa = Math.cos(a);
      const sina = Math.sin(a);
      const ex = ((cosrot * (cosa * rx)) - (sinrot * (sina * ry))) + cx;
      const ey = ((sinrot * (cosa * rx)) + (cosrot * (sina * ry))) + cy;
      const tvx = (0.0 - sina) * (rx * kappa);
      const tvy = cosa * (ry * kappa);
      const tanx = (cosrot * tvx) - (sinrot * tvy);
      const tany = (sinrot * tvx) + (cosrot * tvy);
      if ( k_1 > 0 ) {
        this.emitCubic(px + ptanx, py + ptany, ex - tanx, ey - tany, ex, ey);
      }
      px = ex;
      py = ey;
      ptanx = tanx;
      ptany = tany;
      k_1 = k_1 + 1;
    };
    this.currentX = x2;
    this.currentY = y2;
    this.lastCtrlKind = "";
  };
  vecAngle (ux, uy, vx, vy) {
    const magU = Math.sqrt(((ux * ux) + (uy * uy)));
    const magV = Math.sqrt(((vx * vx) + (vy * vy)));
    const denom = magU * magV;
    if ( denom < 1e-10 ) {
      return 0.0;
    }
    let r = ((ux * vx) + (uy * vy)) / denom;
    if ( r < (0.0 - 1.0) ) {
      r = 0.0 - 1.0;
    }
    if ( r > 1.0 ) {
      r = 1.0;
    }
    let sign = 1.0;
    if ( (ux * vy) < (uy * vx) ) {
      sign = 0.0 - 1.0;
    }
    return sign * (Math.acos(r));
  };
  calculateBounds () {
    if ( (this.commands.length) == 0 ) {
      return;
    }
    let minX = 999999.0;
    let minY = 999999.0;
    let maxX = -999999.0;
    let maxY = -999999.0;
    let i_1 = 0;
    while (i_1 < (this.commands.length)) {
      const cmd = this.commands[i_1];
      if ( (cmd.type == "M") || (cmd.type == "L") ) {
        if ( cmd.x < minX ) {
          minX = cmd.x;
        }
        if ( cmd.x > maxX ) {
          maxX = cmd.x;
        }
        if ( cmd.y < minY ) {
          minY = cmd.y;
        }
        if ( cmd.y > maxY ) {
          maxY = cmd.y;
        }
      }
      if ( cmd.type == "C" ) {
        if ( cmd.x1 < minX ) {
          minX = cmd.x1;
        }
        if ( cmd.x1 > maxX ) {
          maxX = cmd.x1;
        }
        if ( cmd.y1 < minY ) {
          minY = cmd.y1;
        }
        if ( cmd.y1 > maxY ) {
          maxY = cmd.y1;
        }
        if ( cmd.x2 < minX ) {
          minX = cmd.x2;
        }
        if ( cmd.x2 > maxX ) {
          maxX = cmd.x2;
        }
        if ( cmd.y2 < minY ) {
          minY = cmd.y2;
        }
        if ( cmd.y2 > maxY ) {
          maxY = cmd.y2;
        }
        if ( cmd.x < minX ) {
          minX = cmd.x;
        }
        if ( cmd.x > maxX ) {
          maxX = cmd.x;
        }
        if ( cmd.y < minY ) {
          minY = cmd.y;
        }
        if ( cmd.y > maxY ) {
          maxY = cmd.y;
        }
      }
      if ( cmd.type == "Q" ) {
        if ( cmd.x1 < minX ) {
          minX = cmd.x1;
        }
        if ( cmd.x1 > maxX ) {
          maxX = cmd.x1;
        }
        if ( cmd.y1 < minY ) {
          minY = cmd.y1;
        }
        if ( cmd.y1 > maxY ) {
          maxY = cmd.y1;
        }
        if ( cmd.x < minX ) {
          minX = cmd.x;
        }
        if ( cmd.x > maxX ) {
          maxX = cmd.x;
        }
        if ( cmd.y < minY ) {
          minY = cmd.y;
        }
        if ( cmd.y > maxY ) {
          maxY = cmd.y;
        }
      }
      i_1 = i_1 + 1;
    };
    this.bounds.minX = minX;
    this.bounds.minY = minY;
    this.bounds.maxX = maxX;
    this.bounds.maxY = maxY;
    this.bounds.width = maxX - minX;
    this.bounds.height = maxY - minY;
  };
  getBounds () {
    const result = this.bounds;
    return result;
  };
  getCommands () {
    return this.commands;
  };
  getScaledCommands (targetWidth, targetHeight) {
    let scaleX = 1.0;
    let scaleY = 1.0;
    if ( this.bounds.width > 0.0 ) {
      scaleX = targetWidth / this.bounds.width;
    }
    if ( this.bounds.height > 0.0 ) {
      scaleY = targetHeight / this.bounds.height;
    }
    let scaled = [];
    let i_1 = 0;
    while (i_1 < (this.commands.length)) {
      const cmd = this.commands[i_1];
      const newCmd = new PathCommand();
      newCmd.type = cmd.type;
      if ( (cmd.type == "M") || (cmd.type == "L") ) {
        newCmd.x = (cmd.x - this.bounds.minX) * scaleX;
        newCmd.y = (cmd.y - this.bounds.minY) * scaleY;
      }
      if ( cmd.type == "C" ) {
        newCmd.x1 = (cmd.x1 - this.bounds.minX) * scaleX;
        newCmd.y1 = (cmd.y1 - this.bounds.minY) * scaleY;
        newCmd.x2 = (cmd.x2 - this.bounds.minX) * scaleX;
        newCmd.y2 = (cmd.y2 - this.bounds.minY) * scaleY;
        newCmd.x = (cmd.x - this.bounds.minX) * scaleX;
        newCmd.y = (cmd.y - this.bounds.minY) * scaleY;
      }
      if ( cmd.type == "Q" ) {
        newCmd.x1 = (cmd.x1 - this.bounds.minX) * scaleX;
        newCmd.y1 = (cmd.y1 - this.bounds.minY) * scaleY;
        newCmd.x = (cmd.x - this.bounds.minX) * scaleX;
        newCmd.y = (cmd.y - this.bounds.minY) * scaleY;
      }
      scaled.push(newCmd);
      i_1 = i_1 + 1;
    };
    return scaled;
  };
  flattenRings (steps, ma, mb, mc, md, me, mf) {
    let rings = [];
    let current = new PathRing();
    let started = false;
    let cx = 0.0;
    let cy = 0.0;
    let sx = 0.0;
    let sy = 0.0;
    const n = this.commands.length;
    let k = 0;
    while (k < n) {
      const cmd = this.commands[k];
      if ( cmd.type == "M" ) {
        if ( started ) {
          if ( current.pointCount() >= 2 ) {
            rings.push(current);
          }
        }
        current = new PathRing();
        started = true;
        cx = cmd.x;
        cy = cmd.y;
        sx = cmd.x;
        sy = cmd.y;
        current.pts.push((ma * cx) + ((mc * cy) + me));
        current.pts.push((mb * cx) + ((md * cy) + mf));
      }
      if ( cmd.type == "L" ) {
        cx = cmd.x;
        cy = cmd.y;
        current.pts.push((ma * cx) + ((mc * cy) + me));
        current.pts.push((mb * cx) + ((md * cy) + mf));
      }
      if ( cmd.type == "C" ) {
        let s = 1;
        while (s <= steps) {
          const tt = (s) / (steps);
          const u = 1.0 - tt;
          const b0 = (u * u) * u;
          const b1 = ((3.0 * u) * u) * tt;
          const b2 = ((3.0 * u) * tt) * tt;
          const b3 = (tt * tt) * tt;
          const px = (((b0 * cx) + (b1 * cmd.x1)) + (b2 * cmd.x2)) + (b3 * cmd.x);
          const py = (((b0 * cy) + (b1 * cmd.y1)) + (b2 * cmd.y2)) + (b3 * cmd.y);
          current.pts.push((ma * px) + ((mc * py) + me));
          current.pts.push((mb * px) + ((md * py) + mf));
          s = s + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Q" ) {
        let s_1 = 1;
        while (s_1 <= steps) {
          const tt_1 = (s_1) / (steps);
          const u_1 = 1.0 - tt_1;
          const b0_1 = u_1 * u_1;
          const b1_1 = (2.0 * u_1) * tt_1;
          const b2_1 = tt_1 * tt_1;
          const px_1 = ((b0_1 * cx) + (b1_1 * cmd.x1)) + (b2_1 * cmd.x);
          const py_1 = ((b0_1 * cy) + (b1_1 * cmd.y1)) + (b2_1 * cmd.y);
          current.pts.push((ma * px_1) + ((mc * py_1) + me));
          current.pts.push((mb * px_1) + ((md * py_1) + mf));
          s_1 = s_1 + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Z" ) {
        if ( started ) {
          if ( current.pointCount() >= 2 ) {
            rings.push(current);
          }
        }
        current = new PathRing();
        started = false;
        cx = sx;
        cy = sy;
      }
      k = k + 1;
    };
    if ( started ) {
      if ( current.pointCount() >= 2 ) {
        rings.push(current);
      }
    }
    return rings;
  };
  flattenRingsPlain (steps) {
    return this.flattenRings(steps, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
  };
  flatten (steps) {
    let pts = [];
    let cx = 0.0;
    let cy = 0.0;
    const n = this.commands.length;
    let i_1 = 0;
    while (i_1 < n) {
      const cmd = this.commands[i_1];
      if ( cmd.type == "M" ) {
        cx = cmd.x;
        cy = cmd.y;
        pts.push(cx);
        pts.push(cy);
      }
      if ( cmd.type == "L" ) {
        cx = cmd.x;
        cy = cmd.y;
        pts.push(cx);
        pts.push(cy);
      }
      if ( cmd.type == "C" ) {
        let s = 1;
        while (s <= steps) {
          const tt = (s) / (steps);
          const u = 1.0 - tt;
          const b0 = (u * u) * u;
          const b1 = ((3.0 * u) * u) * tt;
          const b2 = ((3.0 * u) * tt) * tt;
          const b3 = (tt * tt) * tt;
          const px = (((b0 * cx) + (b1 * cmd.x1)) + (b2 * cmd.x2)) + (b3 * cmd.x);
          const py = (((b0 * cy) + (b1 * cmd.y1)) + (b2 * cmd.y2)) + (b3 * cmd.y);
          pts.push(px);
          pts.push(py);
          s = s + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "Q" ) {
        let s_1 = 1;
        while (s_1 <= steps) {
          const tt_1 = (s_1) / (steps);
          const u_1 = 1.0 - tt_1;
          const b0_1 = u_1 * u_1;
          const b1_1 = (2.0 * u_1) * tt_1;
          const b2_1 = tt_1 * tt_1;
          const px_1 = ((b0_1 * cx) + (b1_1 * cmd.x1)) + (b2_1 * cmd.x);
          const py_1 = ((b0_1 * cy) + (b1_1 * cmd.y1)) + (b2_1 * cmd.y);
          pts.push(px_1);
          pts.push(py_1);
          s_1 = s_1 + 1;
        };
        cx = cmd.x;
        cy = cmd.y;
      }
      if ( cmd.type == "A" ) {
        cx = cmd.x;
        cy = cmd.y;
        pts.push(cx);
        pts.push(cy);
      }
      i_1 = i_1 + 1;
    };
    return pts;
  };
}
SVGPathParser.fromCommands = function(cmds) {
  const p = new SVGPathParser();
  p.commands = cmds;
  p.calculateBounds();
  return p;
};
class Matrix2D  {
  constructor() {
    this.a = 1.0;
    this.b = 0.0;
    this.c = 0.0;
    this.d = 1.0;
    this.e = 0.0;
    this.f = 0.0;
  }
  applyX (x, y) {
    const v = ((this.a * x) + (this.c * y)) + this.e;
    return v;
  };
  applyY (x, y) {
    const v = ((this.b * x) + (this.d * y)) + this.f;
    return v;
  };
  multiply (o) {
    const na = (this.a * o.a) + (this.c * o.b);
    const nb = (this.b * o.a) + (this.d * o.b);
    const nc = (this.a * o.c) + (this.c * o.d);
    const nd = (this.b * o.c) + (this.d * o.d);
    const ne = ((this.a * o.e) + (this.c * o.f)) + this.e;
    const nf = ((this.b * o.e) + (this.d * o.f)) + this.f;
    return Matrix2D.create(na, nb, nc, nd, ne, nf);
  };
  isIdentity () {
    let flat = true;
    if ( (this.a == 1.0) == false ) {
      flat = false;
    }
    if ( (this.b == 0.0) == false ) {
      flat = false;
    }
    if ( (this.c == 0.0) == false ) {
      flat = false;
    }
    if ( (this.d == 1.0) == false ) {
      flat = false;
    }
    if ( (this.e == 0.0) == false ) {
      flat = false;
    }
    if ( (this.f == 0.0) == false ) {
      flat = false;
    }
    return flat;
  };
}
Matrix2D.identity = function() {
  const m = new Matrix2D();
  return m;
};
Matrix2D.create = function(ma, mb, mc, md, me, mf) {
  const m = new Matrix2D();
  m.a = ma;
  m.b = mb;
  m.c = mc;
  m.d = md;
  m.e = me;
  m.f = mf;
  return m;
};
Matrix2D.translate = function(tx, ty) {
  return Matrix2D.create(1.0, 0.0, 0.0, 1.0, tx, ty);
};
Matrix2D.scale = function(sx, sy) {
  return Matrix2D.create(sx, 0.0, 0.0, sy, 0.0, 0.0);
};
class ViewBoxRect  {
  constructor() {
    this.minX = 0.0;
    this.minY = 0.0;
    this.width = 0.0;
    this.height = 0.0;
    this.isSet = false;
  }
  asAttribute () {
    let s = (((this.minX.toString())) + " ") + ((this.minY.toString()));
    s = (((s + " ") + ((this.width.toString()))) + " ") + ((this.height.toString()));
    return s;
  };
}
ViewBoxRect.create = function(x, y, w, h) {
  const r = new ViewBoxRect();
  r.minX = x;
  r.minY = y;
  r.width = w;
  r.height = h;
  r.isSet = true;
  return r;
};
class VectorViewBox  {
  constructor() {
  }
}
VectorViewBox.splitTokens = function(s) {
  let parts = [];
  let current = "";
  let i = 0;
  const n = s.length;
  while (i < n) {
    const ch = s.charCodeAt(i );
    let isSep = false;
    if ( ch == 32 ) {
      isSep = true;
    }
    if ( ch == 9 ) {
      isSep = true;
    }
    if ( ch == 10 ) {
      isSep = true;
    }
    if ( ch == 13 ) {
      isSep = true;
    }
    if ( ch == 44 ) {
      isSep = true;
    }
    if ( isSep ) {
      if ( (current.length) > 0 ) {
        parts.push(current);
        current = "";
      }
    } else {
      current = current + (String.fromCharCode(ch));
    }
    i = i + 1;
  };
  if ( (current.length) > 0 ) {
    parts.push(current);
  }
  return parts;
};
VectorViewBox.parseViewBox = function(s) {
  const out = new ViewBoxRect();
  const parts = VectorViewBox.splitTokens(s);
  if ( (parts.length) != 4 ) {
    return out;
  }
  let vals = [];
  let i = 0;
  while (i < 4) {
    const tok = parts[i];
    const num = isNaN( parseFloat(tok) ) ? undefined : parseFloat(tok);
    if ( typeof(num) != "undefined" ) {
      vals.push(num);
    } else {
      return out;
    }
    i = i + 1;
  };
  const w = vals[2];
  const h = vals[3];
  if ( w <= 0.0 ) {
    return out;
  }
  if ( h <= 0.0 ) {
    return out;
  }
  out.minX = vals[0];
  out.minY = vals[1];
  out.width = w;
  out.height = h;
  out.isSet = true;
  return out;
};
VectorViewBox.alignX = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < (parts.length)) {
    const tok = parts[i];
    if ( (tok.indexOf("xMin")) == 0 ) {
      return 0;
    }
    if ( (tok.indexOf("xMid")) == 0 ) {
      return 1;
    }
    if ( (tok.indexOf("xMax")) == 0 ) {
      return 2;
    }
    i = i + 1;
  };
  return 1;
};
VectorViewBox.alignY = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < (parts.length)) {
    const tok = parts[i];
    if ( (tok.indexOf("YMin")) > 0 ) {
      return 0;
    }
    if ( (tok.indexOf("YMid")) > 0 ) {
      return 1;
    }
    if ( (tok.indexOf("YMax")) > 0 ) {
      return 2;
    }
    i = i + 1;
  };
  return 1;
};
VectorViewBox.isNone = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < (parts.length)) {
    const tok = parts[i];
    if ( tok == "none" ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
VectorViewBox.isSlice = function(par) {
  const parts = VectorViewBox.splitTokens(par);
  let i = 0;
  while (i < (parts.length)) {
    const tok = parts[i];
    if ( tok == "slice" ) {
      return true;
    }
    i = i + 1;
  };
  return false;
};
VectorViewBox.resolve = function(vb, viewW, viewH, par) {
  if ( vb.isSet == false ) {
    return Matrix2D.identity();
  }
  if ( viewW <= 0.0 ) {
    return Matrix2D.identity();
  }
  if ( viewH <= 0.0 ) {
    return Matrix2D.identity();
  }
  let scaleX = viewW / vb.width;
  let scaleY = viewH / vb.height;
  if ( VectorViewBox.isNone(par) == false ) {
    let uniform = scaleX;
    if ( VectorViewBox.isSlice(par) ) {
      if ( scaleY > uniform ) {
        uniform = scaleY;
      }
    } else {
      if ( scaleY < uniform ) {
        uniform = scaleY;
      }
    }
    scaleX = uniform;
    scaleY = uniform;
  }
  let tx = 0.0 - (vb.minX * scaleX);
  let ty = 0.0 - (vb.minY * scaleY);
  const slackX = viewW - (vb.width * scaleX);
  const slackY = viewH - (vb.height * scaleY);
  const ax = VectorViewBox.alignX(par);
  const ay = VectorViewBox.alignY(par);
  if ( ax == 1 ) {
    tx = tx + (slackX / 2.0);
  }
  if ( ax == 2 ) {
    tx = tx + slackX;
  }
  if ( ay == 1 ) {
    ty = ty + (slackY / 2.0);
  }
  if ( ay == 2 ) {
    ty = ty + slackY;
  }
  return Matrix2D.create(scaleX, 0.0, 0.0, scaleY, tx, ty);
};
VectorViewBox.effectiveViewBox = function(declared, boundsX, boundsY, boundsW, boundsH) {
  const explicit = VectorViewBox.parseViewBox(declared);
  if ( explicit.isSet ) {
    return explicit;
  }
  const synth = new ViewBoxRect();
  if ( boundsW <= 0.0 ) {
    return synth;
  }
  if ( boundsH <= 0.0 ) {
    return synth;
  }
  return ViewBoxRect.create(boundsX, boundsY, boundsW, boundsH);
};
VectorViewBox.resolveString = function(viewBox, viewW, viewH, par) {
  let effective = par;
  if ( (effective.length) == 0 ) {
    effective = "xMidYMid meet";
  }
  const vb = VectorViewBox.parseViewBox(viewBox);
  return VectorViewBox.resolve(vb, viewW, viewH, effective);
};
class VectorStroke  {
  constructor() {
  }
}
VectorStroke.parseDashes = function(s) {
  let out = [];
  let current = "";
  let i = 0;
  const n = s.length;
  let bad = false;
  while (i <= n) {
    let isSep = true;
    if ( i < n ) {
      const ch = s.charCodeAt(i );
      isSep = false;
      if ( ch == 32 ) {
        isSep = true;
      }
      if ( ch == 9 ) {
        isSep = true;
      }
      if ( ch == 10 ) {
        isSep = true;
      }
      if ( ch == 13 ) {
        isSep = true;
      }
      if ( ch == 44 ) {
        isSep = true;
      }
    }
    if ( isSep ) {
      if ( (current.length) > 0 ) {
        const v = isNaN( parseFloat(current) ) ? undefined : parseFloat(current);
        if ( typeof(v) != "undefined" ) {
          const dv = v;
          if ( dv < 0.0 ) {
            bad = true;
          }
          out.push(dv);
        } else {
          bad = true;
        }
        current = "";
      }
    } else {
      current = current + (String.fromCharCode((s.charCodeAt(i ))));
    }
    i = i + 1;
  };
  let empty = [];
  if ( bad ) {
    return empty;
  }
  const cnt = out.length;
  if ( cnt == 0 ) {
    return empty;
  }
  let total = 0.0;
  let j = 0;
  while (j < cnt) {
    total = total + (out[j]);
    j = j + 1;
  };
  if ( total <= 0.0 ) {
    return empty;
  }
  if ( ((((cnt / 2) | 0)) * 2) != cnt ) {
    let k = 0;
    while (k < cnt) {
      out.push(out[k]);
      k = k + 1;
    };
  }
  return out;
};
VectorStroke.scaleDashes = function(dashes, scale) {
  let out = [];
  let k = 0;
  while (k < (dashes.length)) {
    out.push((dashes[k]) * scale);
    k = k + 1;
  };
  return out;
};
class VectorShapes  {
  constructor() {
  }
}
VectorShapes.kappa = function() {
  return 0.5522847498307936;
};
VectorShapes.moveTo = function(x, y) {
  const c = new PathCommand();
  c.type = "M";
  c.x = x;
  c.y = y;
  return c;
};
VectorShapes.lineTo = function(x, y) {
  const c = new PathCommand();
  c.type = "L";
  c.x = x;
  c.y = y;
  return c;
};
VectorShapes.cubicTo = function(x1, y1, x2, y2, x, y) {
  const c = new PathCommand();
  c.type = "C";
  c.x1 = x1;
  c.y1 = y1;
  c.x2 = x2;
  c.y2 = y2;
  c.x = x;
  c.y = y;
  return c;
};
VectorShapes.closePath = function() {
  const c = new PathCommand();
  c.type = "Z";
  return c;
};
VectorShapes.line = function(x1, y1, x2, y2) {
  let out = [];
  out.push(VectorShapes.moveTo(x1, y1));
  out.push(VectorShapes.lineTo(x2, y2));
  return out;
};
VectorShapes.polyline = function(pts) {
  return VectorShapes.pointsToPath(pts, false);
};
VectorShapes.polygon = function(pts) {
  return VectorShapes.pointsToPath(pts, true);
};
VectorShapes.pointsToPath = function(pts, closed) {
  let out = [];
  const n = (((pts.length) / 2) | 0);
  if ( n < 2 ) {
    return out;
  }
  out.push(VectorShapes.moveTo((pts[0]), (pts[1])));
  let k = 1;
  while (k < n) {
    out.push(VectorShapes.lineTo((pts[(k * 2)]), (pts[((k * 2) + 1)])));
    k = k + 1;
  };
  if ( closed ) {
    out.push(VectorShapes.closePath());
  }
  return out;
};
VectorShapes.ellipse = function(cx, cy, rx, ry) {
  let out = [];
  if ( rx <= 0.0 ) {
    return out;
  }
  if ( ry <= 0.0 ) {
    return out;
  }
  const k = VectorShapes.kappa();
  const ox = rx * k;
  const oy = ry * k;
  out.push(VectorShapes.moveTo((cx + rx), cy));
  out.push(VectorShapes.cubicTo((cx + rx), (cy + oy), (cx + ox), (cy + ry), cx, (cy + ry)));
  out.push(VectorShapes.cubicTo((cx - ox), (cy + ry), (cx - rx), (cy + oy), (cx - rx), cy));
  out.push(VectorShapes.cubicTo((cx - rx), (cy - oy), (cx - ox), (cy - ry), cx, (cy - ry)));
  out.push(VectorShapes.cubicTo((cx + ox), (cy - ry), (cx + rx), (cy - oy), (cx + rx), cy));
  out.push(VectorShapes.closePath());
  return out;
};
VectorShapes.circle = function(cx, cy, r) {
  return VectorShapes.ellipse(cx, cy, r, r);
};
VectorShapes.rect = function(x, y, w, h, rxIn, ryIn) {
  let out = [];
  if ( w <= 0.0 ) {
    return out;
  }
  if ( h <= 0.0 ) {
    return out;
  }
  let rx = rxIn;
  let ry = ryIn;
  if ( rx < 0.0 ) {
    rx = ry;
  }
  if ( ry < 0.0 ) {
    ry = rx;
  }
  if ( rx < 0.0 ) {
    rx = 0.0;
  }
  if ( ry < 0.0 ) {
    ry = 0.0;
  }
  if ( rx > (w / 2.0) ) {
    rx = w / 2.0;
  }
  if ( ry > (h / 2.0) ) {
    ry = h / 2.0;
  }
  let rounded = true;
  if ( rx <= 0.0 ) {
    rounded = false;
  }
  if ( ry <= 0.0 ) {
    rounded = false;
  }
  if ( rounded == false ) {
    out.push(VectorShapes.moveTo(x, y));
    out.push(VectorShapes.lineTo((x + w), y));
    out.push(VectorShapes.lineTo((x + w), (y + h)));
    out.push(VectorShapes.lineTo(x, (y + h)));
    out.push(VectorShapes.closePath());
    return out;
  }
  const k = VectorShapes.kappa();
  const ox = rx * k;
  const oy = ry * k;
  const x1 = x + w;
  const y1 = y + h;
  out.push(VectorShapes.moveTo((x + rx), y));
  out.push(VectorShapes.lineTo((x1 - rx), y));
  out.push(VectorShapes.cubicTo(((x1 - rx) + ox), y, x1, ((y + ry) - oy), x1, (y + ry)));
  out.push(VectorShapes.lineTo(x1, (y1 - ry)));
  out.push(VectorShapes.cubicTo(x1, ((y1 - ry) + oy), ((x1 - rx) + ox), y1, (x1 - rx), y1));
  out.push(VectorShapes.lineTo((x + rx), y1));
  out.push(VectorShapes.cubicTo(((x + rx) - ox), y1, x, ((y1 - ry) + oy), x, (y1 - ry)));
  out.push(VectorShapes.lineTo(x, (y + ry)));
  out.push(VectorShapes.cubicTo(x, ((y + ry) - oy), ((x + rx) - ox), y, (x + rx), y));
  out.push(VectorShapes.closePath());
  return out;
};
VectorShapes.asPathData = function(cmds) {
  let out = "";
  const n = cmds.length;
  let k = 0;
  while (k < n) {
    const c = cmds[k];
    if ( k > 0 ) {
      out = out + " ";
    }
    if ( c.type == "M" ) {
      out = (((out + "M") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "L" ) {
      out = (((out + "L") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "C" ) {
      out = (((out + "C") + VectorShapes.num(c.x1)) + ",") + VectorShapes.num(c.y1);
      out = (((out + " ") + VectorShapes.num(c.x2)) + ",") + VectorShapes.num(c.y2);
      out = (((out + " ") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "Q" ) {
      out = (((out + "Q") + VectorShapes.num(c.x1)) + ",") + VectorShapes.num(c.y1);
      out = (((out + " ") + VectorShapes.num(c.x)) + ",") + VectorShapes.num(c.y);
    }
    if ( c.type == "Z" ) {
      out = out + "Z";
    }
    k = k + 1;
  };
  return out;
};
VectorShapes.num = function(v) {
  let neg = false;
  let a = v;
  if ( a < 0.0 ) {
    neg = true;
    a = 0.0 - a;
  }
  const scaled = Math.floor( ((a * 10000.0) + 0.5));
  const whole = ((scaled / 10000) | 0);
  let fracPart = scaled - (whole * 10000);
  let out = (whole.toString());
  if ( fracPart > 0 ) {
    let digits = 4;
    while ((fracPart - ((((fracPart / 10) | 0)) * 10)) == 0) {
      fracPart = ((fracPart / 10) | 0);
      digits = digits - 1;
    };
    let frac = (fracPart.toString());
    let pad = digits - (frac.length);
    while (pad > 0) {
      frac = "0" + frac;
      pad = pad - 1;
    };
    out = (out + ".") + frac;
  }
  if ( neg ) {
    if ( scaled > 0 ) {
      out = "-" + out;
    }
  }
  return out;
};
class SvgVectorItem  {
  constructor() {
    this.commands = [];
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
    let c = [];
    this.commands = c;
    this.fillColor = EVGColor.noColor();
    this.strokeColor = EVGColor.noColor();
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
  }
  hasFill () {
    return this.fillColor.isSet;
  };
  hasStroke () {
    if ( this.strokeColor.isSet == false ) {
      return false;
    }
    return this.strokeWidth > 0.0;
  };
  pathData () {
    return VectorShapes.asPathData(this.commands);
  };
}
class SvgStyleState  {
  constructor() {
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
    this.fillOpacity = 1.0;
    this.strokeOpacity = 1.0;
    this.groupOpacity = 1.0;
    this.ctm = Matrix2D.identity();
    this.fill = EVGColor.black();
    this.stroke = EVGColor.noColor();
    this.strokeWidth = 1.0;
    this.fillRule = "nonzero";
    this.dashArray = "";
    this.dashOffset = 0.0;
    this.fillOpacity = 1.0;
    this.strokeOpacity = 1.0;
    this.groupOpacity = 1.0;
  }
  copy () {
    const s = new SvgStyleState();
    s.ctm = this.ctm;
    s.fill = this.fill;
    s.stroke = this.stroke;
    s.strokeWidth = this.strokeWidth;
    s.fillRule = this.fillRule;
    s.dashArray = this.dashArray;
    s.dashOffset = this.dashOffset;
    s.fillOpacity = this.fillOpacity;
    s.strokeOpacity = this.strokeOpacity;
    s.groupOpacity = this.groupOpacity;
    return s;
  };
}
class SvgDocument  {
  constructor() {
    this.items = [];
    this.width = 0.0;
    this.height = 0.0;
    this.warnings = [];
    this.errors = [];
    this.truncated = false;
    let it = [];
    this.items = it;
    let w = [];
    this.warnings = w;
    let e = [];
    this.errors = e;
    this.viewBox = new ViewBoxRect();
    this.width = 0.0;
    this.height = 0.0;
    this.truncated = false;
  }
  itemCount () {
    return this.items.length;
  };
  hasErrors () {
    return (this.errors.length) > 0;
  };
  hasWarnings () {
    return (this.warnings.length) > 0;
  };
  commandCount () {
    let total = 0;
    let k = 0;
    while (k < (this.items.length)) {
      const it = this.items[k];
      total = total + (it.commands.length);
      k = k + 1;
    };
    return total;
  };
  joinLines (lines) {
    const n = lines.length;
    if ( n == 0 ) {
      return "";
    }
    let out = lines[0];
    let k = 1;
    while (k < n) {
      out = (out + "; ") + (lines[k]);
      k = k + 1;
    };
    return out;
  };
  errorSummary () {
    return this.joinLines(this.errors);
  };
  warningSummary () {
    return this.joinLines(this.warnings);
  };
  bounds () {
    const b = new PathBounds();
    let minX = 999999.0;
    let minY = 999999.0;
    let maxX = -999999.0;
    let maxY = -999999.0;
    let any = false;
    let k = 0;
    while (k < (this.items.length)) {
      const it = this.items[k];
      let j = 0;
      while (j < (it.commands.length)) {
        const c = it.commands[j];
        if ( (c.type == "Z") == false ) {
          any = true;
          if ( c.x < minX ) {
            minX = c.x;
          }
          if ( c.x > maxX ) {
            maxX = c.x;
          }
          if ( c.y < minY ) {
            minY = c.y;
          }
          if ( c.y > maxY ) {
            maxY = c.y;
          }
        }
        if ( (c.type == "C") || (c.type == "Q") ) {
          if ( c.x1 < minX ) {
            minX = c.x1;
          }
          if ( c.x1 > maxX ) {
            maxX = c.x1;
          }
          if ( c.y1 < minY ) {
            minY = c.y1;
          }
          if ( c.y1 > maxY ) {
            maxY = c.y1;
          }
        }
        if ( c.type == "C" ) {
          if ( c.x2 < minX ) {
            minX = c.x2;
          }
          if ( c.x2 > maxX ) {
            maxX = c.x2;
          }
          if ( c.y2 < minY ) {
            minY = c.y2;
          }
          if ( c.y2 > maxY ) {
            maxY = c.y2;
          }
        }
        j = j + 1;
      };
      k = k + 1;
    };
    if ( any == false ) {
      return b;
    }
    b.minX = minX;
    b.minY = minY;
    b.maxX = maxX;
    b.maxY = maxY;
    b.width = maxX - minX;
    b.height = maxY - minY;
    return b;
  };
  effectiveViewBox () {
    if ( this.viewBox.isSet ) {
      return this.viewBox;
    }
    if ( (this.width > 0.0) && (this.height > 0.0) ) {
      return ViewBoxRect.create(0.0, 0.0, this.width, this.height);
    }
    const b = this.bounds();
    return VectorViewBox.effectiveViewBox("", b.minX, b.minY, b.width, b.height);
  };
}
class SvgAttr  {
  constructor() {
    this.name = "";
    this.value = "";
  }
}
class SvgTag  {
  constructor() {
    this.name = "";
    this.isEnd = false;
    this.selfClose = false;
    this.attrs = [];
    this.valid = false;
    let a = [];
    this.attrs = a;
    this.name = "";
    this.isEnd = false;
    this.selfClose = false;
    this.valid = false;
  }
  has (n) {
    let k = 0;
    while (k < (this.attrs.length)) {
      const a = this.attrs[k];
      if ( a.name == n ) {
        return true;
      }
      k = k + 1;
    };
    return false;
  };
  attr (n) {
    let k = 0;
    while (k < (this.attrs.length)) {
      const a = this.attrs[k];
      if ( a.name == n ) {
        return a.value;
      }
      k = k + 1;
    };
    return "";
  };
}
class SvgParser  {
  constructor() {
    this.src = "";
    this.pos = 0;
    this.__len = 0;
    this.maxNodes = 50000;
    this.maxDepth = 64;
    this.maxCommands = 500000;
    this.maxUseDepth = 8;
    this.nodeCount = 0;
    this.emittedCommands = 0;
    this.useDepth = 0;
    this.aborted = false;
    this.spans = {};
    this.warnedKeys = {};
    this.doc = new SvgDocument();
    this.initialFill = EVGColor.black();
  }
  setInitialFill (c) {
    this.initialFill = c;
  };
  warn (key, msg) {
    const seen = ( Object.prototype.hasOwnProperty.call(this.warnedKeys, key) ? this.warnedKeys[key] : undefined );
    if ( (typeof(seen) !== "undefined" && seen != null )  ) {
      return;
    }
    this.warnedKeys[key] = true;
    this.doc.warnings.push(msg);
  };
  fail (msg) {
    this.doc.errors.push(msg);
    this.doc.truncated = true;
    this.aborted = true;
  };
  parse (source) {
    this.doc = new SvgDocument();
    let emptySpans = {};
    this.spans = emptySpans;
    let emptyWarned = {};
    this.warnedKeys = emptyWarned;
    this.nodeCount = 0;
    this.emittedCommands = 0;
    this.useDepth = 0;
    this.aborted = false;
    this.src = source;
    this.__len = source.length;
    this.pos = 0;
    this.indexIds();
    if ( this.aborted ) {
      return this.doc;
    }
    this.src = source;
    this.__len = source.length;
    this.pos = 0;
    const root = new SvgStyleState();
    root.fill = this.initialFill;
    this.parseChildren(root, 0, "");
    return this.doc;
  };
  indexIds () {
    let openNames = [];
    let openIds = [];
    let openStarts = [];
    while (this.aborted == false) {
      const tagStart = this.findTagStart();
      if ( tagStart < 0 ) {
        return;
      }
      const tag = this.readTag();
      if ( tag.valid == false ) {
        return;
      }
      if ( tag.isEnd ) {
        const depth = openNames.length;
        if ( depth > 0 ) {
          const openName = openNames[(depth - 1)];
          if ( openName == tag.name ) {
            const id = openIds[(depth - 1)];
            if ( (id.length) > 0 ) {
              const from = openStarts[(depth - 1)];
              this.spans[id] = this.src.substring(from, this.pos );
            }
            openNames.pop();
            openIds.pop();
            openStarts.pop();
          }
        }
      } else {
        const id2 = tag.attr("id");
        if ( tag.selfClose ) {
          if ( (id2.length) > 0 ) {
            this.spans[id2] = this.src.substring(tagStart, this.pos );
          }
        } else {
          openNames.push(tag.name);
          openIds.push(id2);
          openStarts.push(tagStart);
          if ( (openNames.length) > this.maxDepth ) {
            this.fail(("nesting deeper than " + ((this.maxDepth.toString()))) + " levels");
            return;
          }
        }
      }
    };
  };
  parseChildren (inherited, depth, endName) {
    if ( depth > this.maxDepth ) {
      this.fail(("nesting deeper than " + ((this.maxDepth.toString()))) + " levels");
      return;
    }
    while (this.aborted == false) {
      const tagStart = this.findTagStart();
      if ( tagStart < 0 ) {
        return;
      }
      const tag = this.readTag();
      if ( tag.valid == false ) {
        return;
      }
      if ( tag.isEnd ) {
        return;
      }
      this.nodeCount = this.nodeCount + 1;
      if ( this.nodeCount > this.maxNodes ) {
        this.fail(("more than " + ((this.maxNodes.toString()))) + " elements");
        return;
      }
      this.handleElement(tag, inherited, depth);
    };
  };
  handleElement (tag, inherited, depth) {
    const name = tag.name;
    if ( this.isRefused(name) ) {
      this.refuse(name);
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( ((name == "title") || (name == "desc")) || (name == "metadata") ) {
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( name == "defs" ) {
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( name == "svg" ) {
      if ( depth == 0 ) {
        this.readRootAttributes(tag);
        const rootState = this.applyPresentation(inherited, tag, depth);
        if ( tag.selfClose == false ) {
          this.parseChildren(rootState, depth + 1, name);
        }
        return;
      }
      this.warn("nested-svg", "a nested <svg> element establishes its own viewport and is not supported; its contents are not drawn");
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( (name == "g") || (name == "a") ) {
      const groupState = this.applyPresentation(inherited, tag, depth);
      if ( tag.selfClose == false ) {
        this.parseChildren(groupState, depth + 1, name);
      }
      return;
    }
    if ( name == "switch" ) {
      this.warn("switch", "<switch> conditional processing is not supported; its contents are not drawn");
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( name == "use" ) {
      this.handleUse(tag, inherited, depth);
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    if ( this.isShape(name) ) {
      const shapeState = this.applyPresentation(inherited, tag, depth);
      this.emitShape(tag, shapeState);
      if ( tag.selfClose == false ) {
        this.skipSubtree(name);
      }
      return;
    }
    this.warn("unknown-" + name, ("<" + name) + "> is not part of the supported SVG profile and was skipped");
    if ( tag.selfClose == false ) {
      this.skipSubtree(name);
    }
  };
  isRefused (name) {
    if ( name == "script" ) {
      return true;
    }
    if ( name == "foreignObject" ) {
      return true;
    }
    if ( name == "filter" ) {
      return true;
    }
    if ( name == "mask" ) {
      return true;
    }
    if ( name == "clipPath" ) {
      return true;
    }
    if ( name == "pattern" ) {
      return true;
    }
    if ( name == "marker" ) {
      return true;
    }
    if ( name == "symbol" ) {
      return true;
    }
    if ( name == "style" ) {
      return true;
    }
    if ( name == "text" ) {
      return true;
    }
    if ( name == "image" ) {
      return true;
    }
    if ( name == "linearGradient" ) {
      return true;
    }
    if ( name == "radialGradient" ) {
      return true;
    }
    if ( name == "animate" ) {
      return true;
    }
    if ( name == "animateTransform" ) {
      return true;
    }
    if ( name == "animateMotion" ) {
      return true;
    }
    if ( name == "set" ) {
      return true;
    }
    return false;
  };
  refuse (name) {
    if ( name == "text" ) {
      this.warn("text", "<text> is not supported; convert text to outlines before export, or the wordmark will be missing");
      return;
    }
    if ( name == "image" ) {
      this.warn("image", "<image> references an external resource, which the importer does not fetch; it was skipped");
      return;
    }
    if ( name == "style" ) {
      this.warn("style", "a <style> element is not applied; CSS in the document is outside the profile, so use presentation attributes instead");
      return;
    }
    if ( (name == "linearGradient") || (name == "radialGradient") ) {
      this.warn("gradient", "gradient paint is deferred (PLAN_VECTOR_IR.md §6): the three renderers do not agree on gradients yet, so a gradient fill is dropped rather than rendered differently in each output");
      return;
    }
    if ( (name == "clipPath") || (name == "mask") ) {
      this.warn("clip-" + name, ("<" + name) + "> is not supported; the shapes it would have cut are drawn whole");
      return;
    }
    this.warn("refused-" + name, ("<" + name) + "> is outside the supported SVG profile and was skipped");
  };
  isShape (name) {
    if ( name == "path" ) {
      return true;
    }
    if ( name == "rect" ) {
      return true;
    }
    if ( name == "circle" ) {
      return true;
    }
    if ( name == "ellipse" ) {
      return true;
    }
    if ( name == "line" ) {
      return true;
    }
    if ( name == "polyline" ) {
      return true;
    }
    if ( name == "polygon" ) {
      return true;
    }
    return false;
  };
  handleUse (tag, inherited, depth) {
    let href = tag.attr("href");
    if ( (href.length) == 0 ) {
      href = tag.attr("xlink:href");
    }
    if ( (href.length) == 0 ) {
      this.warn("use-nohref", "<use> without an href draws nothing");
      return;
    }
    if ( (href.charCodeAt(0 )) != 35 ) {
      this.warn("use-external", "<use> may only reference a fragment in the same document; an external reference was dropped");
      return;
    }
    const id = href.substring(1, (href.length) );
    const target = ( Object.prototype.hasOwnProperty.call(this.spans, id) ? this.spans[id] : undefined );
    let fragment = "";
    if ( (typeof(target) !== "undefined" && target != null )  ) {
      fragment = target;
    } else {
      this.warn("use-missing-" + id, ("<use href=\"#" + id) + "\"> refers to an id that is not in this document");
      return;
    }
    if ( this.useDepth >= this.maxUseDepth ) {
      this.warn("use-depth", ("<use> references nested more than " + ((this.maxUseDepth.toString()))) + " deep, which is either a cycle or deeper than this profile expands");
      return;
    }
    const state = this.applyPresentation(inherited, tag, depth);
    const ux = this.numAttr(tag, "x", 0.0);
    const uy = this.numAttr(tag, "y", 0.0);
    if ( ((ux == 0.0) && (uy == 0.0)) == false ) {
      state.ctm = state.ctm.multiply(Matrix2D.translate(ux, uy));
    }
    const savedSrc = this.src;
    const savedPos = this.pos;
    const savedLen = this.__len;
    this.src = fragment;
    this.__len = this.src.length;
    this.pos = 0;
    this.useDepth = this.useDepth + 1;
    this.parseChildren(state, depth + 1, "");
    this.useDepth = this.useDepth - 1;
    this.src = savedSrc;
    this.pos = savedPos;
    this.__len = savedLen;
  };
  applyPresentation (inherited, tag, depth) {
    const s = inherited.copy();
    let k = 0;
    while (k < (tag.attrs.length)) {
      const a = tag.attrs[k];
      this.applyProperty(s, a.name, a.value);
      k = k + 1;
    };
    const styleAttr = tag.attr("style");
    if ( (styleAttr.length) > 0 ) {
      this.applyStyleAttribute(s, styleAttr);
    }
    const tf = tag.attr("transform");
    if ( (tf.length) > 0 ) {
      const m = this.parseTransform(tf);
      s.ctm = s.ctm.multiply(m);
    }
    return s;
  };
  applyStyleAttribute (s, style) {
    const decls = this.splitOn(style, 59);
    let k = 0;
    while (k < (decls.length)) {
      const decl = decls[k];
      const colon = decl.indexOf(":");
      if ( colon > 0 ) {
        const n = (decl.substring(0, colon )).trim();
        const v = (decl.substring((colon + 1), (decl.length) )).trim();
        this.applyProperty(s, n, v);
      }
      k = k + 1;
    };
  };
  applyProperty (s, name, value) {
    const v = value.trim();
    if ( name == "fill" ) {
      s.fill = this.parsePaint(v, (s.fill));
      return;
    }
    if ( name == "stroke" ) {
      s.stroke = this.parsePaint(v, (s.stroke));
      return;
    }
    if ( name == "stroke-width" ) {
      const w = isNaN( parseFloat(v) ) ? undefined : parseFloat(v);
      if ( typeof(w) != "undefined" ) {
        s.strokeWidth = w;
      }
      return;
    }
    if ( name == "fill-rule" ) {
      if ( v == "evenodd" ) {
        s.fillRule = "evenodd";
      }
      if ( v == "nonzero" ) {
        s.fillRule = "nonzero";
      }
      return;
    }
    if ( name == "stroke-dasharray" ) {
      if ( v == "none" ) {
        s.dashArray = "";
      } else {
        s.dashArray = v;
      }
      return;
    }
    if ( name == "stroke-dashoffset" ) {
      const o = isNaN( parseFloat(v) ) ? undefined : parseFloat(v);
      if ( typeof(o) != "undefined" ) {
        s.dashOffset = o;
      }
      return;
    }
    if ( name == "fill-opacity" ) {
      s.fillOpacity = this.parseOpacity(v, s.fillOpacity);
      return;
    }
    if ( name == "stroke-opacity" ) {
      s.strokeOpacity = this.parseOpacity(v, s.strokeOpacity);
      return;
    }
    if ( name == "opacity" ) {
      const o2 = this.parseOpacity(v, 1.0);
      s.groupOpacity = s.groupOpacity * o2;
      return;
    }
    if ( ((name == "stroke-linecap") || (name == "stroke-linejoin")) || (name == "stroke-miterlimit") ) {
      this.warn("stroke-joins", "stroke-linecap/linejoin/miterlimit are not represented; strokes are drawn with butt caps and round joins");
      return;
    }
    if ( name == "class" ) {
      this.warn("class", "class attributes have no effect because the profile applies no CSS");
      return;
    }
  };
  parsePaint (v, inheritedPaint) {
    if ( v == "none" ) {
      return EVGColor.noColor();
    }
    if ( v == "inherit" ) {
      return inheritedPaint;
    }
    if ( v == "currentColor" ) {
      return this.initialFill;
    }
    if ( (v.indexOf("url(")) == 0 ) {
      this.warn("gradient", "gradient paint is deferred (PLAN_VECTOR_IR.md §6): the three renderers do not agree on gradients yet, so a gradient fill is dropped rather than rendered differently in each output");
      return EVGColor.noColor();
    }
    const c = EVGColor.parse(v);
    if ( c.isSet == false ) {
      this.warn("color-" + v, ("could not read the colour \"" + v) + "\"; the inherited paint was used instead");
      return inheritedPaint;
    }
    return c;
  };
  parseOpacity (v, fallback) {
    let pct = false;
    let s = v;
    if ( (s.length) > 0 ) {
      if ( (s.charCodeAt(((s.length) - 1) )) == 37 ) {
        pct = true;
        s = s.substring(0, ((s.length) - 1) );
      }
    }
    const d = isNaN( parseFloat(s) ) ? undefined : parseFloat(s);
    let out = fallback;
    if ( typeof(d) != "undefined" ) {
      out = d;
    } else {
      return fallback;
    }
    if ( pct ) {
      out = out / 100.0;
    }
    if ( out < 0.0 ) {
      out = 0.0;
    }
    if ( out > 1.0 ) {
      out = 1.0;
    }
    return out;
  };
  parseTransform (s) {
    let m = Matrix2D.identity();
    let i = 0;
    const n = s.length;
    while (i < n) {
      const open = this.findFrom(s, i, 40);
      if ( open < 0 ) {
        return m;
      }
      const fname = (s.substring(i, open )).trim();
      const close = this.findFrom(s, (open + 1), 41);
      if ( close < 0 ) {
        this.warn("transform-unclosed", "a transform is missing its closing parenthesis: " + s);
        return m;
      }
      const args = this.parseNumberList((s.substring((open + 1), close )));
      const na = args.length;
      i = close + 1;
      let part = Matrix2D.identity();
      let known = true;
      if ( fname == "matrix" ) {
        if ( na == 6 ) {
          part = Matrix2D.create((args[0]), (args[1]), (args[2]), (args[3]), (args[4]), (args[5]));
        } else {
          known = false;
        }
      } else {
        if ( fname == "translate" ) {
          if ( na == 1 ) {
            part = Matrix2D.translate((args[0]), 0.0);
          } else {
            if ( na == 2 ) {
              part = Matrix2D.translate((args[0]), (args[1]));
            } else {
              known = false;
            }
          }
        } else {
          if ( fname == "scale" ) {
            if ( na == 1 ) {
              part = Matrix2D.scale((args[0]), (args[0]));
            } else {
              if ( na == 2 ) {
                part = Matrix2D.scale((args[0]), (args[1]));
              } else {
                known = false;
              }
            }
          } else {
            if ( fname == "rotate" ) {
              if ( na == 1 ) {
                part = this.rotation((args[0]));
              } else {
                if ( na == 3 ) {
                  const cx = args[1];
                  const cy = args[2];
                  const r = this.rotation((args[0]));
                  part = Matrix2D.translate(cx, cy);
                  part = part.multiply(r);
                  part = part.multiply(Matrix2D.translate((0.0 - cx), (0.0 - cy)));
                } else {
                  known = false;
                }
              }
            } else {
              if ( fname == "skewX" ) {
                if ( na == 1 ) {
                  part = Matrix2D.create(1.0, 0.0, this.tanDeg((args[0])), 1.0, 0.0, 0.0);
                } else {
                  known = false;
                }
              } else {
                if ( fname == "skewY" ) {
                  if ( na == 1 ) {
                    part = Matrix2D.create(1.0, this.tanDeg((args[0])), 0.0, 1.0, 0.0, 0.0);
                  } else {
                    known = false;
                  }
                } else {
                  known = false;
                }
              }
            }
          }
        }
      }
      if ( known == false ) {
        this.warn("transform-" + fname, ("the transform \"" + fname) + "\" was not applied: unknown, or given the wrong number of arguments");
      } else {
        m = m.multiply(part);
      }
    };
    return m;
  };
  rotation (deg) {
    const rad = (deg * 3.141592653589793) / 180.0;
    const cs = Math.cos(rad);
    const sn = Math.sin(rad);
    return Matrix2D.create(cs, sn, (0.0 - sn), cs, 0.0, 0.0);
  };
  tanDeg (deg) {
    const rad = (deg * 3.141592653589793) / 180.0;
    return (Math.sin(rad)) / (Math.cos(rad));
  };
  emitShape (tag, s) {
    const name = tag.name;
    let cmds = [];
    if ( name == "path" ) {
      const d = tag.attr("d");
      if ( (d.length) == 0 ) {
        return;
      }
      const p = new SVGPathParser();
      p.parse(d);
      if ( p.hasErrors() ) {
        this.warn("pathdata-" + p.errorSummary(), "path data was not fully read: " + p.errorSummary());
      }
      cmds = p.getCommands();
    } else {
      if ( name == "rect" ) {
        const rx = this.numAttr(tag, "rx", -1.0);
        const ry = this.numAttr(tag, "ry", -1.0);
        cmds = VectorShapes.rect(this.numAttr(tag, "x", 0.0), this.numAttr(tag, "y", 0.0), this.numAttr(tag, "width", 0.0), this.numAttr(tag, "height", 0.0), rx, ry);
      } else {
        if ( name == "circle" ) {
          cmds = VectorShapes.circle(this.numAttr(tag, "cx", 0.0), this.numAttr(tag, "cy", 0.0), this.numAttr(tag, "r", 0.0));
        } else {
          if ( name == "ellipse" ) {
            cmds = VectorShapes.ellipse(this.numAttr(tag, "cx", 0.0), this.numAttr(tag, "cy", 0.0), this.numAttr(tag, "rx", 0.0), this.numAttr(tag, "ry", 0.0));
          } else {
            if ( name == "line" ) {
              cmds = VectorShapes.line(this.numAttr(tag, "x1", 0.0), this.numAttr(tag, "y1", 0.0), this.numAttr(tag, "x2", 0.0), this.numAttr(tag, "y2", 0.0));
            } else {
              if ( name == "polyline" ) {
                cmds = VectorShapes.polyline(this.parseNumberList(tag.attr("points")));
              } else {
                if ( name == "polygon" ) {
                  cmds = VectorShapes.polygon(this.parseNumberList(tag.attr("points")));
                }
              }
            }
          }
        }
      }
    }
    const count = cmds.length;
    if ( count == 0 ) {
      return;
    }
    this.emittedCommands = this.emittedCommands + count;
    if ( this.emittedCommands > this.maxCommands ) {
      this.fail(("more than " + ((this.maxCommands.toString()))) + " path commands");
      return;
    }
    const item = new SvgVectorItem();
    item.commands = this.transformCommands(cmds, (s.ctm));
    item.fillRule = s.fillRule;
    item.dashArray = s.dashArray;
    item.dashOffset = s.dashOffset;
    if ( s.fill.isSet ) {
      item.fillColor = this.withAlpha((s.fill), (s.fillOpacity * s.groupOpacity));
    }
    if ( s.stroke.isSet ) {
      item.strokeColor = this.withAlpha((s.stroke), (s.strokeOpacity * s.groupOpacity));
      item.strokeWidth = s.strokeWidth * this.scaleOf((s.ctm));
    }
    if ( (item.hasFill() == false) && (item.hasStroke() == false) ) {
      return;
    }
    this.doc.items.push(item);
  };
  withAlpha (c, mul) {
    if ( mul >= 1.0 ) {
      return c;
    }
    return EVGColor.create(c.r, c.g, c.b, (c.a * mul));
  };
  scaleOf (m) {
    let det = (m.a * m.d) - (m.b * m.c);
    if ( det < 0.0 ) {
      det = 0.0 - det;
    }
    if ( det == 0.0 ) {
      return 0.0;
    }
    return Math.sqrt(det);
  };
  transformCommands (cmds, m) {
    let out = [];
    if ( m.isIdentity() ) {
      return cmds;
    }
    let k = 0;
    while (k < (cmds.length)) {
      const c = cmds[k];
      const n = new PathCommand();
      n.type = c.type;
      n.x = m.applyX(c.x, c.y);
      n.y = m.applyY(c.x, c.y);
      n.x1 = m.applyX(c.x1, c.y1);
      n.y1 = m.applyY(c.x1, c.y1);
      n.x2 = m.applyX(c.x2, c.y2);
      n.y2 = m.applyY(c.x2, c.y2);
      out.push(n);
      k = k + 1;
    };
    return out;
  };
  readRootAttributes (tag) {
    const vb = tag.attr("viewBox");
    if ( (vb.length) > 0 ) {
      const parsed = VectorViewBox.parseViewBox(vb);
      if ( parsed.isSet ) {
        this.doc.viewBox = parsed;
      } else {
        this.warn("viewbox", ("the root viewBox \"" + vb) + "\" is not four numbers with a positive width and height, and was ignored");
      }
    }
    this.doc.width = this.lengthAttr(tag, "width");
    this.doc.height = this.lengthAttr(tag, "height");
    const par = tag.attr("preserveAspectRatio");
    if ( (par.length) > 0 ) {
      this.warn("par", "preserveAspectRatio on the imported root is ignored; the element that hosts the drawing decides how it is fitted");
    }
  };
  lengthAttr (tag, name) {
    const raw = tag.attr(name).trim();
    if ( (raw.length) == 0 ) {
      return 0.0;
    }
    let s = raw;
    if ( (s.indexOf("px")) > 0 ) {
      s = s.substring(0, (s.indexOf("px")) );
    }
    if ( this.isPlainNumber((s.trim())) == false ) {
      return 0.0;
    }
    const d = isNaN( parseFloat((s.trim())) ) ? undefined : parseFloat((s.trim()));
    let out = 0.0;
    if ( typeof(d) != "undefined" ) {
      out = d;
    } else {
      return 0.0;
    }
    if ( out < 0.0 ) {
      return 0.0;
    }
    return out;
  };
  isPlainNumber (s) {
    const n = s.length;
    if ( n == 0 ) {
      return false;
    }
    let k = 0;
    while (k < n) {
      const c = s.charCodeAt(k );
      let ok = false;
      if ( (c >= 48) && (c <= 57) ) {
        ok = true;
      }
      if ( c == 46 ) {
        ok = true;
      }
      if ( c == 45 ) {
        ok = true;
      }
      if ( c == 43 ) {
        ok = true;
      }
      if ( c == 101 ) {
        ok = true;
      }
      if ( c == 69 ) {
        ok = true;
      }
      if ( ok == false ) {
        return false;
      }
      k = k + 1;
    };
    return true;
  };
  numAttr (tag, name, fallback) {
    const raw = tag.attr(name).trim();
    if ( (raw.length) == 0 ) {
      return fallback;
    }
    let s = raw;
    if ( (s.indexOf("px")) > 0 ) {
      s = s.substring(0, (s.indexOf("px")) );
    }
    if ( this.isPlainNumber((s.trim())) ) {
      const d = isNaN( parseFloat((s.trim())) ) ? undefined : parseFloat((s.trim()));
      if ( typeof(d) != "undefined" ) {
        return d;
      }
    }
    this.warn("num-" + name, ((("the value \"" + raw) + "\" on ") + name) + " is not a plain number, and this profile resolves no units; it was treated as unspecified");
    return fallback;
  };
  findTagStart () {
    while (this.pos < this.__len) {
      const c = this.src.charCodeAt(this.pos );
      if ( c != 60 ) {
        this.pos = this.pos + 1;
      } else {
        if ( this.matchesAt((this.pos + 1), "!--") ) {
          const end = this.findString((this.pos + 4), "-->");
          if ( end < 0 ) {
            this.pos = this.__len;
            return -1;
          }
          this.pos = end + 3;
        } else {
          if ( this.matchesAt((this.pos + 1), "![CDATA[") ) {
            const cend = this.findString((this.pos + 9), "]]>");
            if ( cend < 0 ) {
              this.pos = this.__len;
              return -1;
            }
            this.pos = cend + 3;
          } else {
            if ( this.matchesAt((this.pos + 1), "?") ) {
              const pend = this.findString((this.pos + 2), "?>");
              if ( pend < 0 ) {
                this.pos = this.__len;
                return -1;
              }
              this.pos = pend + 2;
            } else {
              if ( this.matchesAt((this.pos + 1), "!") ) {
                this.skipDeclaration();
                if ( this.aborted ) {
                  return -1;
                }
              } else {
                return this.pos;
              }
            }
          }
        }
      }
    };
    return -1;
  };
  skipDeclaration () {
    let i = this.pos + 2;
    while (i < this.__len) {
      const c = this.src.charCodeAt(i );
      if ( c == 91 ) {
        this.fail("this document has a DOCTYPE internal subset, which is where entity declarations live; the importer implements no entities and will not guess at one");
        this.pos = this.__len;
        return;
      }
      if ( c == 62 ) {
        this.pos = i + 1;
        return;
      }
      i = i + 1;
    };
    this.pos = this.__len;
  };
  readTag () {
    const tag = new SvgTag();
    if ( this.pos >= this.__len ) {
      return tag;
    }
    let i = this.pos + 1;
    if ( i < this.__len ) {
      if ( (this.src.charCodeAt(i )) == 47 ) {
        tag.isEnd = true;
        i = i + 1;
      }
    }
    const nameStart = i;
    while (i < this.__len) {
      const c = this.src.charCodeAt(i );
      if ( this.isNameChar(c) ) {
        i = i + 1;
      } else {
        break;
      }
    };
    tag.name = this.localName((this.src.substring(nameStart, i )));
    if ( (tag.name.length) == 0 ) {
      this.pos = this.pos + 1;
      return tag;
    }
    while (i < this.__len) {
      i = this.skipSpaceFrom(i);
      if ( i >= this.__len ) {
        break;
      }
      const c2 = this.src.charCodeAt(i );
      if ( c2 == 62 ) {
        i = i + 1;
        tag.valid = true;
        this.pos = i;
        return tag;
      }
      if ( c2 == 47 ) {
        tag.selfClose = true;
        i = i + 1;
        if ( i < this.__len ) {
          if ( (this.src.charCodeAt(i )) == 62 ) {
            i = i + 1;
          }
        }
        tag.valid = true;
        this.pos = i;
        return tag;
      }
      const attrStart = i;
      while (i < this.__len) {
        const c3 = this.src.charCodeAt(i );
        if ( this.isNameChar(c3) ) {
          i = i + 1;
        } else {
          break;
        }
      };
      if ( i == attrStart ) {
        i = i + 1;
      } else {
        const attrName = this.src.substring(attrStart, i );
        i = this.skipSpaceFrom(i);
        let value = "";
        if ( i < this.__len ) {
          if ( (this.src.charCodeAt(i )) == 61 ) {
            i = i + 1;
            i = this.skipSpaceFrom(i);
            if ( i < this.__len ) {
              const q = this.src.charCodeAt(i );
              if ( (q == 34) || (q == 39) ) {
                const vstart = i + 1;
                const vend = this.findFrom(this.src, vstart, q);
                if ( vend < 0 ) {
                  this.warn("unquoted", ("an attribute value on <" + tag.name) + "> is missing its closing quote");
                  this.pos = this.__len;
                  return tag;
                }
                value = this.decodeEntities((this.src.substring(vstart, vend )));
                i = vend + 1;
              } else {
                this.warn("unquoted", ("an attribute value on <" + tag.name) + "> is not quoted; XML requires quotes, so it was skipped");
                while (i < this.__len) {
                  const c4 = this.src.charCodeAt(i );
                  if ( (c4 == 62) || this.isSpace(c4) ) {
                    break;
                  }
                  i = i + 1;
                };
              }
            }
          }
        }
        const a = new SvgAttr();
        a.name = this.attrName(attrName);
        a.value = value;
        tag.attrs.push(a);
      }
    };
    this.pos = this.__len;
    return tag;
  };
  skipSubtree (name) {
    let depth = 1;
    while ((depth > 0) && (this.aborted == false)) {
      const start = this.findTagStart();
      if ( start < 0 ) {
        return;
      }
      const tag = this.readTag();
      if ( tag.valid == false ) {
        return;
      }
      if ( tag.selfClose == false ) {
        if ( tag.name == name ) {
          if ( tag.isEnd ) {
            depth = depth - 1;
          } else {
            depth = depth + 1;
          }
        }
      }
    };
  };
  decodeEntities (s) {
    if ( (s.indexOf("&")) < 0 ) {
      return s;
    }
    let out = "";
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s.charCodeAt(i );
      if ( c != 38 ) {
        out = out + (String.fromCharCode(c));
        i = i + 1;
      } else {
        const semi = this.findFrom(s, i, 59);
        let handled = false;
        if ( semi > i ) {
          const ent = s.substring(i, (semi + 1) );
          if ( ent == "&amp;" ) {
            out = out + "&";
            handled = true;
          }
          if ( ent == "&lt;" ) {
            out = out + "<";
            handled = true;
          }
          if ( ent == "&gt;" ) {
            out = out + ">";
            handled = true;
          }
          if ( ent == "&quot;" ) {
            out = out + "\"";
            handled = true;
          }
          if ( ent == "&apos;" ) {
            out = out + "'";
            handled = true;
          }
          if ( handled ) {
            i = semi + 1;
          } else {
            this.warn("entity", "only the five predefined XML entities are expanded; any other reference is left as written");
            out = out + "&";
            i = i + 1;
          }
        } else {
          out = out + "&";
          i = i + 1;
        }
      }
    };
    return out;
  };
  localName (raw) {
    const colon = raw.indexOf(":");
    if ( colon < 0 ) {
      return raw;
    }
    return raw.substring((colon + 1), (raw.length) );
  };
  attrName (raw) {
    if ( (raw.indexOf("xlink:")) == 0 ) {
      return raw;
    }
    const colon = raw.indexOf(":");
    if ( colon < 0 ) {
      return raw;
    }
    return raw.substring((colon + 1), (raw.length) );
  };
  isSpace (c) {
    if ( c == 32 ) {
      return true;
    }
    if ( c == 9 ) {
      return true;
    }
    if ( c == 10 ) {
      return true;
    }
    if ( c == 13 ) {
      return true;
    }
    return false;
  };
  isNameChar (c) {
    if ( (c >= 65) && (c <= 90) ) {
      return true;
    }
    if ( (c >= 97) && (c <= 122) ) {
      return true;
    }
    if ( (c >= 48) && (c <= 57) ) {
      return true;
    }
    if ( c == 58 ) {
      return true;
    }
    if ( c == 45 ) {
      return true;
    }
    if ( c == 95 ) {
      return true;
    }
    if ( c == 46 ) {
      return true;
    }
    return false;
  };
  skipSpaceFrom (from) {
    let i = from;
    while (i < this.__len) {
      if ( this.isSpace((this.src.charCodeAt(i ))) ) {
        i = i + 1;
      } else {
        break;
      }
    };
    return i;
  };
  findFrom (s, from, ch) {
    let i = from;
    const n = s.length;
    while (i < n) {
      if ( (s.charCodeAt(i )) == ch ) {
        return i;
      }
      i = i + 1;
    };
    return -1;
  };
  findString (from, needle) {
    const nl = needle.length;
    let i = from;
    while ((i + nl) <= this.__len) {
      if ( this.matchesAt(i, needle) ) {
        return i;
      }
      i = i + 1;
    };
    return -1;
  };
  matchesAt (at, needle) {
    const nl = needle.length;
    if ( (at + nl) > this.__len ) {
      return false;
    }
    return (this.src.substring(at, (at + nl) )) == needle;
  };
  splitOn (s, sep) {
    let out = [];
    const n = s.length;
    let start = 0;
    let i = 0;
    while (i < n) {
      if ( (s.charCodeAt(i )) == sep ) {
        out.push(s.substring(start, i ));
        start = i + 1;
      }
      i = i + 1;
    };
    out.push(s.substring(start, n ));
    return out;
  };
  parseNumberList (s) {
    let out = [];
    const toks = VectorViewBox.splitTokens(s);
    let k = 0;
    while (k < (toks.length)) {
      const d = isNaN( parseFloat((toks[k])) ) ? undefined : parseFloat((toks[k]));
      if ( typeof(d) != "undefined" ) {
        out.push(d);
      } else {
        this.warn("numlist-" + (toks[k]), ("\"" + (toks[k])) + "\" is not a number; the rest of that list was not read");
        return out;
      }
      k = k + 1;
    };
    return out;
  };
}
class EVGGrapheme  {
  constructor() {
  }
}
EVGGrapheme.isZWJ = function(cp) {
  return cp == 8205;
};
EVGGrapheme.isRegionalIndicator = function(cp) {
  if ( cp < 127462 ) {
    return false;
  }
  return cp <= 127487;
};
EVGGrapheme.isEmojiModifier = function(cp) {
  if ( cp < 127995 ) {
    return false;
  }
  return cp <= 127999;
};
EVGGrapheme.isTag = function(cp) {
  if ( cp < 917536 ) {
    return false;
  }
  return cp <= 917631;
};
EVGGrapheme.isExtend = function(cp) {
  if ( (cp >= 768) && (cp <= 879) ) {
    return true;
  }
  if ( (cp >= 6832) && (cp <= 6911) ) {
    return true;
  }
  if ( (cp >= 7616) && (cp <= 7679) ) {
    return true;
  }
  if ( (cp >= 8400) && (cp <= 8447) ) {
    return true;
  }
  if ( (cp >= 65024) && (cp <= 65039) ) {
    return true;
  }
  if ( (cp >= 65056) && (cp <= 65071) ) {
    return true;
  }
  if ( EVGGrapheme.isEmojiModifier(cp) ) {
    return true;
  }
  return EVGGrapheme.isTag(cp);
};
EVGGrapheme.clusterEnd = function(cps, start) {
  const n = cps.length;
  if ( start >= n ) {
    return n;
  }
  let i = start + 1;
  if ( EVGGrapheme.isRegionalIndicator((cps[start])) ) {
    if ( i < n ) {
      if ( EVGGrapheme.isRegionalIndicator((cps[i])) ) {
        i = i + 1;
      }
    }
    return i;
  }
  let more = true;
  while (more) {
    more = false;
    if ( i < n ) {
      const cp = cps[i];
      if ( EVGGrapheme.isExtend(cp) ) {
        i = i + 1;
        more = true;
      } else {
        if ( EVGGrapheme.isZWJ(cp) ) {
          if ( (i + 1) < n ) {
            i = i + 2;
            more = true;
          }
        }
      }
    }
  };
  return i;
};
EVGGrapheme.boundaries = function(cps) {
  let out = [];
  let i = 0;
  const n = cps.length;
  while (i < n) {
    out.push(i);
    i = EVGGrapheme.clusterEnd(cps, i);
  };
  out.push(n);
  return out;
};
EVGGrapheme.clusterCount = function(s) {
  const cps = EVGCodepoint.toArray(s);
  let n = 0;
  let i = 0;
  while (i < (cps.length)) {
    i = EVGGrapheme.clusterEnd(cps, i);
    n = n + 1;
  };
  return n;
};
EVGGrapheme.clusterAt = function(s, i) {
  const cps = EVGCodepoint.toArray(s);
  let cpIdx = 0;
  let u = 0;
  while (u < i) {
    u = u + EVGCodepoint.unitsAt(s, u);
    cpIdx = cpIdx + 1;
  };
  const end = EVGGrapheme.clusterEnd(cps, cpIdx);
  let out = "";
  let k = cpIdx;
  while (k < end) {
    out = out + EVGCodepoint.toStr((cps[k]));
    k = k + 1;
  };
  return out;
};
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
class TTFShapedRun  {
  constructor() {
    this.glyphs = [];
    this.clusterStart = [];
    this.clusterEnd = [];
  }
  count () {
    return this.glyphs.length;
  };
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
    this.ligatureSubtables = [];
    this.hasShaping = false;
    this.legacyKernOffset = 0;
    this.legacyKernPairs = 0;
    this.hasKerning = false;
    this.ligatureMatched = 0;
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
    let ls = [];
    this.ligatureSubtables = ls;
  }
  loadFromBuffer (name, data) {
    this.fontPath = name;
    this.fontData = data;
    if ( (this.fontData.byteLength) == 0 ) {
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
    this.parseGsubLigatures();
    this.buildCharWidthCache();
    return true;
  };
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
    this.parseGsubLigatures();
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
    let wideFound = false;
    while (i < numSubtables) {
      const recordOff = (off + 4) + (i * 8);
      const platformID = this.readUInt16(recordOff);
      const encodingID = this.readUInt16((recordOff + 2));
      const subOff = this.readUInt32((recordOff + 4));
      const fmt = this.readUInt16((off + subOff));
      let wideCandidate = false;
      if ( (platformID == 3) && (encodingID == 10) ) {
        wideCandidate = true;
      }
      if ( (platformID == 0) && (encodingID == 4) ) {
        wideCandidate = true;
      }
      if ( (platformID == 0) && (encodingID == 6) ) {
        wideCandidate = true;
      }
      if ( wideCandidate && (fmt == 12) ) {
        subtableOffset = subOff;
        wideFound = true;
      }
      if ( wideFound == false ) {
        if ( (platformID == 3) && (encodingID == 1) ) {
          subtableOffset = subOff;
        }
        if ( (platformID == 0) && (subtableOffset == 0) ) {
          subtableOffset = subOff;
        }
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
  isLoaded () {
    if ( this.numGlyphs <= 0 ) {
      return false;
    }
    return this.cmapOffset > 0;
  };
  getGlyphIndex (charCode) {
    if ( this.cmapOffset == 0 ) {
      return 0;
    }
    if ( this.cmapFormat == 12 ) {
      return this.getGlyphIndexFormat12(charCode);
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
  getGlyphIndexFormat12 (charCode) {
    const off = this.cmapOffset;
    const nGroups = this.readUInt32((off + 12));
    let lo = 0;
    let hi = nGroups - 1;
    while (lo <= hi) {
      const mid = Math.floor( ((lo + hi) / 2));
      const g = (off + 16) + (mid * 12);
      const startChar = this.readUInt32(g);
      const endChar = this.readUInt32((g + 4));
      if ( charCode < startChar ) {
        hi = mid - 1;
      } else {
        if ( charCode > endChar ) {
          lo = mid + 1;
        } else {
          const startGlyph = this.readUInt32((g + 8));
          return startGlyph + (charCode - startChar);
        }
      }
    };
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
    let prev = 0;
    let first = true;
    while (i < __len) {
      const ch = EVGCodepoint.codeAt(text, i);
      const step = EVGCodepoint.unitsAt(text, i);
      width = width + this.getCharWidthPoints(ch, fontSize);
      if ( first == false ) {
        width = width + this.kernPoints(prev, ch, fontSize);
      }
      prev = ch;
      first = false;
      i = i + step;
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
  keepSet () {
    let keep = [];
    let i = 0;
    while (i < this.numGlyphs) {
      keep.push(false);
      i = i + 1;
    };
    if ( this.numGlyphs > 0 ) {
      keep[0] = true;
    }
    let c = 32;
    while (c < 256) {
      const cp = TrueTypeFont.winAnsiToUnicode(c);
      const g = this.getGlyphIndex(cp);
      if ( (g > 0) && (g < this.numGlyphs) ) {
        keep[g] = true;
      }
      c = c + 1;
    };
    let again = true;
    while (again) {
      again = false;
      let gi = 0;
      while (gi < this.numGlyphs) {
        if ( keep[gi] ) {
          const added = this.addComponents(gi, keep);
          if ( added ) {
            again = true;
          }
        }
        gi = gi + 1;
      };
    };
    return keep;
  };
  addComponents (gid, keep) {
    const glyf = this.findTable("glyf");
    const start = this.glyphStart(gid);
    const end = this.glyphEnd(gid);
    if ( (end - start) < 10 ) {
      return false;
    }
    const at = glyf.offset + start;
    const contours = this.readInt16(at);
    if ( contours >= 0 ) {
      return false;
    }
    let added = false;
    let p = at + 10;
    let more = true;
    while (more) {
      const flags = this.readUInt16(p);
      const comp = this.readUInt16((p + 2));
      if ( (comp >= 0) && (comp < this.numGlyphs) ) {
        if ( (keep[comp]) == false ) {
          keep[comp] = true;
          added = true;
        }
      }
      p = p + 4;
      if ( ((flags & 1)) != 0 ) {
        p = p + 4;
      } else {
        p = p + 2;
      }
      if ( ((flags & 8)) != 0 ) {
        p = p + 2;
      }
      if ( ((flags & 64)) != 0 ) {
        p = p + 4;
      }
      if ( ((flags & 128)) != 0 ) {
        p = p + 8;
      }
      more = ((flags & 32)) != 0;
      if ( p >= (glyf.offset + end) ) {
        more = false;
      }
    };
    return added;
  };
  glyphStart (gid) {
    return this.locaAt(gid);
  };
  glyphEnd (gid) {
    return this.locaAt((gid + 1));
  };
  locaAt (i) {
    const loca = this.findTable("loca");
    if ( this.indexToLocFormat == 0 ) {
      return this.readUInt16((loca.offset + (i * 2))) * 2;
    }
    return this.readUInt32((loca.offset + (i * 4)));
  };
  buildGlyf () {
    const keep = this.keepSet();
    let total = 0;
    let g = 0;
    while (g < this.numGlyphs) {
      if ( keep[g] ) {
        const __len = this.glyphEnd(g) - this.glyphStart(g);
        if ( __len > 0 ) {
          total = total + __len;
          while ((total % 2) != 0) {
            total = total + 1;
          };
        }
      }
      g = g + 1;
    };
    let out = [];
    out.push(total);
    let gi = 0;
    while (gi < this.numGlyphs) {
      let k = 0;
      if ( keep[gi] ) {
        k = 1;
      }
      out.push(k);
      gi = gi + 1;
    };
    return out;
  };
  pdfFontData () {
    let kept = [];
    let i = 0;
    while (i < (this.tables.length)) {
      const t = this.tables[i];
      if ( TrueTypeFont.keepsInPdf(t.tag) ) {
        kept.push(t);
      }
      i = i + 1;
    };
    if ( (kept.length) == 0 ) {
      return this.fontData;
    }
    const n = kept.length;
    let a = 0;
    while (a < n) {
      let b = a + 1;
      while (b < n) {
        const x = kept[a];
        const y = kept[b];
        if ( TrueTypeFont.tagLess(y.tag, x.tag) ) {
          kept[a] = y;
          kept[b] = x;
        }
        b = b + 1;
      };
      a = a + 1;
    };
    const plan = this.buildGlyf();
    const newGlyfLen = plan[0];
    let lengths = [];
    let li = 0;
    while (li < n) {
      const rl = kept[li];
      if ( rl.tag == "glyf" ) {
        lengths.push(newGlyfLen);
      } else {
        lengths.push(rl.length);
      }
      li = li + 1;
    };
    const headerLen = 12 + (16 * n);
    let offsets = [];
    let at = headerLen;
    let k = 0;
    while (k < n) {
      offsets.push(at);
      at = at + (lengths[k]);
      while ((at % 4) != 0) {
        at = at + 1;
      };
      k = k + 1;
    };
    const total = at;
    let out = (function(){ var b = new ArrayBuffer(total); b._view = new DataView(b); return b; })();
    TrueTypeFont.put32(out, 0, 65536);
    TrueTypeFont.put16(out, 4, n);
    let pow2 = 1;
    let log2 = 0;
    while ((pow2 * 2) <= n) {
      pow2 = pow2 * 2;
      log2 = log2 + 1;
    };
    TrueTypeFont.put16(out, 6, pow2 * 16);
    TrueTypeFont.put16(out, 8, log2);
    TrueTypeFont.put16(out, 10, (n * 16) - (pow2 * 16));
    let d = 0;
    while (d < n) {
      const rec = kept[d];
      const dst = offsets[d];
      const __len = lengths[d];
      if ( rec.tag == "glyf" ) {
        this.writeGlyf(out, dst, plan);
      } else {
        if ( rec.tag == "loca" ) {
          this.writeLoca(out, dst, plan);
        } else {
          const src = rec.offset;
          let c = 0;
          while (c < rec.length) {
            out._view.setUint8(dst + c, this.fontData._view.getUint8((src + c)));
            c = c + 1;
          };
        }
      }
      d = d + 1;
    };
    let e = 0;
    while (e < n) {
      const r2 = kept[e];
      const base = 12 + (16 * e);
      let ti = 0;
      while (ti < 4) {
        let ch = 32;
        if ( ti < (r2.tag.length) ) {
          ch = r2.tag.charCodeAt(ti );
        }
        out._view.setUint8(base + ti, ch);
        ti = ti + 1;
      };
      const off2 = offsets[e];
      const len2 = lengths[e];
      TrueTypeFont.put32(out, base + 4, TrueTypeFont.tableSum(out, off2, len2));
      TrueTypeFont.put32(out, base + 8, off2);
      TrueTypeFont.put32(out, base + 12, len2);
      e = e + 1;
    };
    return out;
  };
  writeGlyf (out, dst, plan) {
    let w = dst;
    let g = 0;
    while (g < this.numGlyphs) {
      if ( (plan[(g + 1)]) == 1 ) {
        const from = this.glyphStart(g);
        const to = this.glyphEnd(g);
        const __len = to - from;
        if ( __len > 0 ) {
          const glyf = this.findTable("glyf");
          let c = 0;
          while (c < __len) {
            out._view.setUint8(w + c, this.fontData._view.getUint8(((glyf.offset + from) + c)));
            c = c + 1;
          };
          w = w + __len;
          while (((w - dst) % 2) != 0) {
            out._view.setUint8(w, 0);
            w = w + 1;
          };
        }
      }
      g = g + 1;
    };
  };
  writeLoca (out, dst, plan) {
    let at = 0;
    let g = 0;
    while (g < this.numGlyphs) {
      TrueTypeFont.putLoca(out, dst, g, at, this.indexToLocFormat);
      if ( (plan[(g + 1)]) == 1 ) {
        const __len = this.glyphEnd(g) - this.glyphStart(g);
        if ( __len > 0 ) {
          at = at + __len;
          while ((at % 2) != 0) {
            at = at + 1;
          };
        }
      }
      g = g + 1;
    };
    TrueTypeFont.putLoca(out, dst, this.numGlyphs, at, this.indexToLocFormat);
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
  parseGsubLigatures () {
    const table = this.findTable("GSUB");
    if ( table.offset == 0 ) {
      return;
    }
    const gsubOff = table.offset;
    const featureListOff = gsubOff + this.readUInt16((gsubOff + 6));
    const lookupListOff = gsubOff + this.readUInt16((gsubOff + 8));
    const featureCount = this.readUInt16(featureListOff);
    const lookupCount = this.readUInt16(lookupListOff);
    let f = 0;
    while (f < featureCount) {
      const recOff = (featureListOff + 2) + (f * 6);
      const tag = this.readTag(recOff);
      let wanted = false;
      if ( tag == "ccmp" ) {
        wanted = true;
      }
      if ( tag == "liga" ) {
        wanted = true;
      }
      if ( tag == "rlig" ) {
        wanted = true;
      }
      if ( wanted ) {
        const featOff = featureListOff + this.readUInt16((recOff + 4));
        const idxCount = this.readUInt16((featOff + 2));
        let li = 0;
        while (li < idxCount) {
          const lookupIndex = this.readUInt16(((featOff + 4) + (li * 2)));
          if ( lookupIndex < lookupCount ) {
            const lookupOff = lookupListOff + this.readUInt16(((lookupListOff + 2) + (lookupIndex * 2)));
            this.collectLigatureLookup(lookupOff);
          }
          li = li + 1;
        };
      }
      f = f + 1;
    };
    if ( (this.ligatureSubtables.length) > 0 ) {
      this.hasShaping = true;
    }
  };
  collectLigatureLookup (lookupOff) {
    const lookupType = this.readUInt16(lookupOff);
    const subCount = this.readUInt16((lookupOff + 4));
    let i = 0;
    while (i < subCount) {
      const subOff = lookupOff + this.readUInt16(((lookupOff + 6) + (i * 2)));
      if ( lookupType == 4 ) {
        this.ligatureSubtables.push(subOff);
      }
      if ( lookupType == 7 ) {
        const extType = this.readUInt16((subOff + 2));
        if ( extType == 4 ) {
          this.ligatureSubtables.push(subOff + this.readUInt32((subOff + 4)));
        }
      }
      i = i + 1;
    };
  };
  ligatureAt (gids, start) {
    this.ligatureMatched = 0;
    let best = 0;
    let bestLen = 0;
    const first = gids[start];
    const remaining = (gids.length) - start;
    let s = 0;
    while (s < (this.ligatureSubtables.length)) {
      const sub = this.ligatureSubtables[s];
      const cov = sub + this.readUInt16((sub + 2));
      const ci = this.coverageIndex(cov, first);
      if ( ci >= 0 ) {
        const setCount = this.readUInt16((sub + 4));
        if ( ci < setCount ) {
          const setOff = sub + this.readUInt16(((sub + 6) + (ci * 2)));
          const ligCount = this.readUInt16(setOff);
          let l = 0;
          while (l < ligCount) {
            const lig = setOff + this.readUInt16(((setOff + 2) + (l * 2)));
            const ligGlyph = this.readUInt16(lig);
            const compCount = this.readUInt16((lig + 2));
            if ( compCount <= remaining ) {
              let ok = true;
              let c = 1;
              while (c < compCount) {
                if ( this.readUInt16(((lig + 2) + (c * 2))) != (gids[(start + c)]) ) {
                  ok = false;
                  c = compCount;
                } else {
                  c = c + 1;
                }
              };
              if ( ok ) {
                if ( compCount > bestLen ) {
                  best = ligGlyph;
                  bestLen = compCount;
                }
              }
            }
            l = l + 1;
          };
        }
      }
      s = s + 1;
    };
    this.ligatureMatched = bestLen;
    return best;
  };
  shape (cps) {
    const run = new TTFShapedRun();
    let kept = [];
    let keptIndex = [];
    let i = 0;
    while (i < (cps.length)) {
      const cp = cps[i];
      if ( TrueTypeFont.isVariationSelector(cp) == false ) {
        kept.push(cp);
        keptIndex.push(i);
      }
      i = i + 1;
    };
    let gids = [];
    let k = 0;
    while (k < (kept.length)) {
      gids.push(this.getGlyphIndex((kept[k])));
      k = k + 1;
    };
    const n = gids.length;
    let p = 0;
    while (p < n) {
      let glyph = gids[p];
      let consumed = 1;
      if ( this.hasShaping ) {
        const lig = this.ligatureAt(gids, p);
        if ( this.ligatureMatched > 1 ) {
          glyph = lig;
          consumed = this.ligatureMatched;
        }
      }
      run.glyphs.push(glyph);
      run.clusterStart.push(keptIndex[p]);
      let endIdx = cps.length;
      if ( (p + consumed) < n ) {
        endIdx = keptIndex[(p + consumed)];
      }
      run.clusterEnd.push(endIdx);
      p = p + consumed;
    };
    return run;
  };
  shapeString (text) {
    return this.shape(EVGCodepoint.toArray(text));
  };
  shapeRange (cps, start, end) {
    let slice = [];
    let i = start;
    while (i < end) {
      slice.push(cps[i]);
      i = i + 1;
    };
    return this.shape(slice);
  };
  measureShapedText (text, fontSize) {
    const cps = EVGCodepoint.toArray(text);
    const n = cps.length;
    let total = 0.0;
    let i = 0;
    while (i < n) {
      const end = EVGGrapheme.clusterEnd(cps, i);
      total = total + this.measureShapedRange(cps, i, end, fontSize);
      i = end;
    };
    return total;
  };
  measureShapedRange (cps, start, end, fontSize) {
    const run = this.shapeRange(cps, start, end);
    const scale = fontSize / (this.unitsPerEm);
    let total = 0.0;
    let i = 0;
    while (i < (run.glyphs.length)) {
      total = total + ((this.getGlyphWidth((run.glyphs[i]))) * scale);
      i = i + 1;
    };
    return total;
  };
  measureShaped (text, fontSize) {
    const run = this.shapeString(text);
    const scale = fontSize / (this.unitsPerEm);
    let total = 0.0;
    let i = 0;
    while (i < (run.glyphs.length)) {
      total = total + ((this.getGlyphWidth((run.glyphs[i]))) * scale);
      i = i + 1;
    };
    return total;
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
TrueTypeFont.keepsInPdf = function(tag) {
  if ( tag == "glyf" ) {
    return true;
  }
  if ( tag == "head" ) {
    return true;
  }
  if ( tag == "hhea" ) {
    return true;
  }
  if ( tag == "hmtx" ) {
    return true;
  }
  if ( tag == "loca" ) {
    return true;
  }
  if ( tag == "maxp" ) {
    return true;
  }
  if ( tag == "cvt " ) {
    return true;
  }
  if ( tag == "fpgm" ) {
    return true;
  }
  if ( tag == "prep" ) {
    return true;
  }
  if ( tag == "cmap" ) {
    return true;
  }
  if ( tag == "name" ) {
    return true;
  }
  if ( tag == "OS/2" ) {
    return true;
  }
  if ( tag == "post" ) {
    return true;
  }
  return false;
};
TrueTypeFont.winAnsiToUnicode = function(b) {
  if ( (b < 128) || (b > 159) ) {
    return b;
  }
  const _map = [8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 141, 381, 143, 144, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 157, 382, 376];
  return _map[(b - 128)];
};
TrueTypeFont.tableSum = function(b, at, __len) {
  let sum = 0;
  let i = 0;
  while (i < __len) {
    let w = 0;
    let j = 0;
    while (j < 4) {
      let byte = 0;
      if ( (i + j) < __len ) {
        byte = b._view.getUint8(((at + i) + j));
      }
      w = (w * 256) + byte;
      j = j + 1;
    };
    sum = ((sum + w) & 4294967295);
    i = i + 4;
  };
  return sum;
};
TrueTypeFont.putLoca = function(out, dst, i, value, format) {
  if ( format == 0 ) {
    TrueTypeFont.put16(out, dst + (i * 2), Math.floor( (value / 2)));
  } else {
    TrueTypeFont.put32(out, dst + (i * 4), value);
  }
};
TrueTypeFont.tagLess = function(a, b) {
  let i = 0;
  while (i < 4) {
    let ca = 32;
    let cb = 32;
    if ( i < (a.length) ) {
      ca = a.charCodeAt(i );
    }
    if ( i < (b.length) ) {
      cb = b.charCodeAt(i );
    }
    if ( ca != cb ) {
      return ca < cb;
    }
    i = i + 1;
  };
  return false;
};
TrueTypeFont.put16 = function(b, at, v) {
  b._view.setUint8(at, (((v >> 8)) & 255));
  b._view.setUint8(at + 1, (v & 255));
};
TrueTypeFont.put32 = function(b, at, v) {
  b._view.setUint8(at, (((v >> 24)) & 255));
  b._view.setUint8(at + 1, (((v >> 16)) & 255));
  b._view.setUint8(at + 2, (((v >> 8)) & 255));
  b._view.setUint8(at + 3, (v & 255));
};
TrueTypeFont.isVariationSelector = function(cp) {
  if ( cp == 65038 ) {
    return true;
  }
  return cp == 65039;
};
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
  addFontBuffer (name, data) {
    const font = new TrueTypeFont();
    if ( font.loadFromBuffer(name, data) == false ) {
      return false;
    }
    this.fonts.push(font);
    this.fontNames.push(font.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font;
      this.hasDefaultFont = true;
    }
    return true;
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
  loadFontBuffer (name, data) {
    const font = new TrueTypeFont();
    if ( font.loadFromBuffer(name, data) == false ) {
      return false;
    }
    this.fonts.push(font);
    this.fontNames.push(font.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font;
      this.hasDefaultFont = true;
    }
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
  faceForCodepoint (fontFamily, cp) {
    const primary = this.getFont(fontFamily);
    if ( primary.isLoaded() ) {
      if ( primary.getGlyphIndex(cp) > 0 ) {
        return primary;
      }
    }
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.isLoaded() ) {
        if ( f.getGlyphIndex(cp) > 0 ) {
          return f;
        }
      }
      i = i + 1;
    };
    return primary;
  };
  fallbackFace (cp) {
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.isLoaded() ) {
        if ( f.getGlyphIndex(cp) > 0 ) {
          return f;
        }
      }
      i = i + 1;
    };
    const none = new TrueTypeFont();
    return none;
  };
  faceForClusterFrom (primary, cps, start, end) {
    const base = cps[start];
    if ( (end - start) <= 1 ) {
      if ( primary.isLoaded() ) {
        if ( primary.getGlyphIndex(base) > 0 ) {
          return primary;
        }
      }
      return this.fallbackFace(base);
    }
    if ( primary.isLoaded() ) {
      if ( FontManager.coversCluster(primary, cps, start, end) ) {
        return primary;
      }
    }
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.isLoaded() ) {
        if ( FontManager.coversCluster(f, cps, start, end) ) {
          return f;
        }
      }
      i = i + 1;
    };
    if ( primary.isLoaded() ) {
      if ( primary.getGlyphIndex(base) > 0 ) {
        return primary;
      }
    }
    return this.fallbackFace(base);
  };
  faceForCluster (fontFamily, cps, start, end) {
    return this.faceForClusterFrom(this.getFont(fontFamily), cps, start, end);
  };
  needsFallback (fontFamily, cp) {
    const primary = this.getFont(fontFamily);
    if ( primary.isLoaded() == false ) {
      return false;
    }
    return primary.getGlyphIndex(cp) == 0;
  };
  measureText (text, fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.isLoaded() == false ) {
      return (((text.length)) * fontSize) * 0.5;
    }
    const cps = EVGCodepoint.toArray(text);
    const n = cps.length;
    let width = 0.0;
    let i = 0;
    let prev = 0;
    let prevWasPrimary = false;
    let first = true;
    while (i < n) {
      const end = EVGGrapheme.clusterEnd(cps, i);
      const found = this.faceForClusterFrom(font, cps, i, end);
      let face = font;
      if ( found.isLoaded() ) {
        face = found;
      }
      const isPrimary = face.fontPath == font.fontPath;
      if ( isPrimary ) {
        let c = i;
        while (c < end) {
          const cp = cps[c];
          width = width + face.getCharWidthPoints(cp, fontSize);
          if ( first == false ) {
            if ( prevWasPrimary ) {
              width = width + face.kernPoints(prev, cp, fontSize);
            }
          }
          prev = cp;
          prevWasPrimary = true;
          first = false;
          c = c + 1;
        };
      } else {
        width = width + face.measureShapedRange(cps, i, end, fontSize);
        prev = cps[i];
        prevWasPrimary = false;
        first = false;
      }
      i = end;
    };
    return width;
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
FontManager.coversCluster = function(f, cps, start, end) {
  let i = start;
  while (i < end) {
    const cp = cps[i];
    let skip = EVGGrapheme.isZWJ(cp);
    if ( (cp >= 65024) && (cp <= 65039) ) {
      skip = true;
    }
    if ( skip == false ) {
      if ( f.getGlyphIndex(cp) == 0 ) {
        return false;
      }
    }
    i = i + 1;
  };
  return true;
};
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
class DeflateWriter  {
  constructor() {
    this.out = new GrowableBuffer();
    this.acc = 0;
    this.nbits = 0;
  }
  putBit (b) {
    if ( b != 0 ) {
      this.acc = (this.acc | ((1 << this.nbits)));
    }
    this.nbits = this.nbits + 1;
    if ( this.nbits == 8 ) {
      this.out.writeByte(this.acc);
      this.acc = 0;
      this.nbits = 0;
    }
  };
  bits (value, count) {
    let i = 0;
    while (i < count) {
      this.putBit((((value >> i)) & 1));
      i = i + 1;
    };
  };
  huff (code, count) {
    let i = count - 1;
    while (i >= 0) {
      this.putBit((((code >> i)) & 1));
      i = i - 1;
    };
  };
  align () {
    while (this.nbits != 0) {
      this.putBit(0);
    };
  };
}
class Deflate  {
  constructor() {
    this.lenBase = [];
    this.lenExtra = [];
    this.distBase = [];
    this.distExtra = [];
    this.head = [];
    this.hashBits = 15;     /** note: unused */
    this.hashSize = 32768;
    this.lenBase.push(3);
    this.lenBase.push(4);
    this.lenBase.push(5);
    this.lenBase.push(6);
    this.lenBase.push(7);
    this.lenBase.push(8);
    this.lenBase.push(9);
    this.lenBase.push(10);
    this.lenBase.push(11);
    this.lenBase.push(13);
    this.lenBase.push(15);
    this.lenBase.push(17);
    this.lenBase.push(19);
    this.lenBase.push(23);
    this.lenBase.push(27);
    this.lenBase.push(31);
    this.lenBase.push(35);
    this.lenBase.push(43);
    this.lenBase.push(51);
    this.lenBase.push(59);
    this.lenBase.push(67);
    this.lenBase.push(83);
    this.lenBase.push(99);
    this.lenBase.push(115);
    this.lenBase.push(131);
    this.lenBase.push(163);
    this.lenBase.push(195);
    this.lenBase.push(227);
    this.lenBase.push(258);
    this.lenExtra.push(0);
    this.lenExtra.push(0);
    this.lenExtra.push(0);
    this.lenExtra.push(0);
    this.lenExtra.push(0);
    this.lenExtra.push(0);
    this.lenExtra.push(0);
    this.lenExtra.push(0);
    this.lenExtra.push(1);
    this.lenExtra.push(1);
    this.lenExtra.push(1);
    this.lenExtra.push(1);
    this.lenExtra.push(2);
    this.lenExtra.push(2);
    this.lenExtra.push(2);
    this.lenExtra.push(2);
    this.lenExtra.push(3);
    this.lenExtra.push(3);
    this.lenExtra.push(3);
    this.lenExtra.push(3);
    this.lenExtra.push(4);
    this.lenExtra.push(4);
    this.lenExtra.push(4);
    this.lenExtra.push(4);
    this.lenExtra.push(5);
    this.lenExtra.push(5);
    this.lenExtra.push(5);
    this.lenExtra.push(5);
    this.lenExtra.push(0);
    this.distBase.push(1);
    this.distBase.push(2);
    this.distBase.push(3);
    this.distBase.push(4);
    this.distBase.push(5);
    this.distBase.push(7);
    this.distBase.push(9);
    this.distBase.push(13);
    this.distBase.push(17);
    this.distBase.push(25);
    this.distBase.push(33);
    this.distBase.push(49);
    this.distBase.push(65);
    this.distBase.push(97);
    this.distBase.push(129);
    this.distBase.push(193);
    this.distBase.push(257);
    this.distBase.push(385);
    this.distBase.push(513);
    this.distBase.push(769);
    this.distBase.push(1025);
    this.distBase.push(1537);
    this.distBase.push(2049);
    this.distBase.push(3073);
    this.distBase.push(4097);
    this.distBase.push(6145);
    this.distBase.push(8193);
    this.distBase.push(12289);
    this.distBase.push(16385);
    this.distBase.push(24577);
    this.distExtra.push(0);
    this.distExtra.push(0);
    this.distExtra.push(0);
    this.distExtra.push(0);
    this.distExtra.push(1);
    this.distExtra.push(1);
    this.distExtra.push(2);
    this.distExtra.push(2);
    this.distExtra.push(3);
    this.distExtra.push(3);
    this.distExtra.push(4);
    this.distExtra.push(4);
    this.distExtra.push(5);
    this.distExtra.push(5);
    this.distExtra.push(6);
    this.distExtra.push(6);
    this.distExtra.push(7);
    this.distExtra.push(7);
    this.distExtra.push(8);
    this.distExtra.push(8);
    this.distExtra.push(9);
    this.distExtra.push(9);
    this.distExtra.push(10);
    this.distExtra.push(10);
    this.distExtra.push(11);
    this.distExtra.push(11);
    this.distExtra.push(12);
    this.distExtra.push(12);
    this.distExtra.push(13);
    this.distExtra.push(13);
  }
  literal (w, sym) {
    if ( sym < 144 ) {
      w.huff(48 + sym, 8);
      return;
    }
    if ( sym < 256 ) {
      w.huff(400 + (sym - 144), 9);
      return;
    }
    if ( sym < 280 ) {
      w.huff(sym - 256, 7);
      return;
    }
    w.huff(192 + (sym - 280), 8);
  };
  lengthSlot (__len) {
    let i = 28;
    while (i > 0) {
      const base = this.lenBase[i];
      if ( __len >= base ) {
        return i;
      }
      i = i - 1;
    };
    return 0;
  };
  distSlot (dist) {
    let i = 29;
    while (i > 0) {
      const base = this.distBase[i];
      if ( dist >= base ) {
        return i;
      }
      i = i - 1;
    };
    return 0;
  };
  emitMatch (w, __len, dist) {
    const ls = this.lengthSlot(__len);
    this.literal(w, 257 + ls);
    const lx = this.lenExtra[ls];
    if ( lx > 0 ) {
      w.bits(__len - (this.lenBase[ls]), lx);
    }
    const ds = this.distSlot(dist);
    w.huff(ds, 5);
    const dx = this.distExtra[ds];
    if ( dx > 0 ) {
      w.bits(dist - (this.distBase[ds]), dx);
    }
  };
  compress (src, n, w) {
    this.head.length = 0;
    let i = 0;
    while (i < this.hashSize) {
      this.head.push(-1);
      i = i + 1;
    };
    w.bits(1, 1);
    w.bits(1, 2);
    let pos = 0;
    while (pos < n) {
      let bestLen = 0;
      let bestDist = 0;
      if ( (pos + 3) <= n ) {
        const h = Deflate.hash3((src._view.getUint8(pos)), (src._view.getUint8((pos + 1))), (src._view.getUint8((pos + 2))));
        const cand = this.head[h];
        this.head[h] = pos;
        if ( cand >= 0 ) {
          const dist = pos - cand;
          if ( (dist > 0) && (dist <= 32768) ) {
            let maxLen = n - pos;
            if ( maxLen > 258 ) {
              maxLen = 258;
            }
            let k = 0;
            while (k < maxLen) {
              if ( (src._view.getUint8((cand + k))) != (src._view.getUint8((pos + k))) ) {
                break;
              }
              k = k + 1;
            };
            if ( k >= 3 ) {
              bestLen = k;
              bestDist = dist;
            }
          }
        }
      }
      if ( bestLen >= 3 ) {
        this.emitMatch(w, bestLen, bestDist);
        let j = 1;
        while (j < bestLen) {
          const at = pos + j;
          if ( (at + 3) <= n ) {
            const h2 = Deflate.hash3((src._view.getUint8(at)), (src._view.getUint8((at + 1))), (src._view.getUint8((at + 2))));
            this.head[h2] = at;
          }
          j = j + 1;
        };
        pos = pos + bestLen;
      } else {
        this.literal(w, src._view.getUint8(pos));
        pos = pos + 1;
      }
    };
    this.literal(w, 256);
    w.align();
  };
}
Deflate.hash3 = function(a, b, c) {
  const h = ((((a * 7853) + (b * 271)) + c) & 32767);
  return h;
};
class PdfFlate  {
  constructor() {
  }
}
PdfFlate.zlib = function(src) {
  const n = src.byteLength;
  const out = new GrowableBuffer();
  out.writeByte(120);
  out.writeByte(1);
  const w = new DeflateWriter();
  const d = new Deflate();
  d.compress(src, n, w);
  w.align();
  const body = w.out.toBuffer();
  let bi = 0;
  while (bi < (body.byteLength)) {
    out.writeByte(body._view.getUint8(bi));
    bi = bi + 1;
  };
  const adler = PdfFlate.adler32(src, n);
  out.writeByte((((adler >> 24)) & 255));
  out.writeByte((((adler >> 16)) & 255));
  out.writeByte((((adler >> 8)) & 255));
  out.writeByte((adler & 255));
  return out.toBuffer();
};
PdfFlate.adler32 = function(data, n) {
  let a = 1;
  let b = 0;
  let i = 0;
  while (i < n) {
    a = (a + (data._view.getUint8(i))) % 65521;
    b = (b + a) % 65521;
    i = i + 1;
  };
  return (((b << 16)) | a);
};
PdfFlate.worthIt = function(raw, packed) {
  const r = raw.byteLength;
  const p = packed.byteLength;
  if ( r < 64 ) {
    return false;
  }
  const margin = Math.floor( (r / 32));
  return p < (r - margin);
};
class TTFSubset  {
  constructor() {
    this.glyfOffset = 0;
    this.glyfLength = 0;
    this.locaOffset = 0;
    this.locaLongFormat = false;
    this.keep = [];
  }
  run (f, usedGids) {
    this.font = f;
    const empty = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    if ( f.isLoaded() == false ) {
      return empty;
    }
    const glyfTab = f.findTable("glyf");
    const locaTab = f.findTable("loca");
    const headTab = f.findTable("head");
    const hheaTab = f.findTable("hhea");
    const maxpTab = f.findTable("maxp");
    const hmtxTab = f.findTable("hmtx");
    if ( glyfTab.offset == 0 ) {
      return empty;
    }
    if ( locaTab.offset == 0 ) {
      return empty;
    }
    if ( headTab.offset == 0 ) {
      return empty;
    }
    if ( hheaTab.offset == 0 ) {
      return empty;
    }
    if ( maxpTab.offset == 0 ) {
      return empty;
    }
    if ( hmtxTab.offset == 0 ) {
      return empty;
    }
    this.glyfOffset = glyfTab.offset;
    this.glyfLength = glyfTab.length;
    this.locaOffset = locaTab.offset;
    this.locaLongFormat = f.indexToLocFormat == 1;
    const total = f.numGlyphs;
    if ( total <= 0 ) {
      return empty;
    }
    this.keep.length = 0;
    let i = 0;
    while (i < total) {
      this.keep.push(false);
      i = i + 1;
    };
    this.mark(0, 0);
    let u = 0;
    while (u < (usedGids.length)) {
      this.mark(usedGids[u], 0);
      u = u + 1;
    };
    let maxGid = 0;
    let k = 0;
    while (k < total) {
      if ( this.keep[k] ) {
        maxGid = k;
      }
      k = k + 1;
    };
    const newNumGlyphs = maxGid + 1;
    const newGlyf = new GrowableBuffer();
    let offsets = [];
    let g = 0;
    while (g < newNumGlyphs) {
      offsets.push((newGlyf).size());
      if ( this.keep[g] ) {
        const start = this.glyphStart(g);
        const end = this.glyphEnd(g);
        if ( end > start ) {
          newGlyf.writeBytes(this.font.fontData, this.glyfOffset + start, end - start);
          while (((newGlyf).size() % 4) != 0) {
            newGlyf.writeByte(0);
          };
        }
      }
      g = g + 1;
    };
    offsets.push((newGlyf).size());
    const newLoca = new GrowableBuffer();
    let li = 0;
    while (li < (offsets.length)) {
      newLoca.writeInt32BE(offsets[li]);
      li = li + 1;
    };
    const newHead = new GrowableBuffer();
    newHead.writeBytes(this.font.fontData, headTab.offset, headTab.length);
    let headBuf = newHead.toBuffer();
    headBuf._view.setUint8(8, 0);
    headBuf._view.setUint8(9, 0);
    headBuf._view.setUint8(10, 0);
    headBuf._view.setUint8(11, 0);
    headBuf._view.setUint8(50, 0);
    headBuf._view.setUint8(51, 1);
    const newHmtx = new GrowableBuffer();
    const origMetrics = this.font.numberOfHMetrics;
    let m = 0;
    while (m < newNumGlyphs) {
      let src = m;
      if ( src >= origMetrics ) {
        src = origMetrics - 1;
      }
      if ( src < 0 ) {
        src = 0;
      }
      const adv = this.font.readUInt16((hmtxTab.offset + (src * 4)));
      let lsb = 0;
      if ( m < origMetrics ) {
        lsb = this.font.readInt16(((hmtxTab.offset + (m * 4)) + 2));
      } else {
        const tailOff = (hmtxTab.offset + (origMetrics * 4)) + ((m - origMetrics) * 2);
        if ( (tailOff + 2) <= (hmtxTab.offset + hmtxTab.length) ) {
          lsb = this.font.readInt16(tailOff);
        }
      }
      newHmtx.writeInt16BE(adv);
      newHmtx.writeInt16BE(lsb);
      m = m + 1;
    };
    const newHhea = new GrowableBuffer();
    newHhea.writeBytes(this.font.fontData, hheaTab.offset, hheaTab.length);
    let hheaBuf = newHhea.toBuffer();
    hheaBuf._view.setUint8(34, Math.floor( (newNumGlyphs / 256)));
    hheaBuf._view.setUint8(35, newNumGlyphs % 256);
    const newMaxp = new GrowableBuffer();
    newMaxp.writeBytes(this.font.fontData, maxpTab.offset, maxpTab.length);
    let maxpBuf = newMaxp.toBuffer();
    maxpBuf._view.setUint8(4, Math.floor( (newNumGlyphs / 256)));
    maxpBuf._view.setUint8(5, newNumGlyphs % 256);
    let tags = [];
    let datas = [];
    tags.push("glyf");
    datas.push(newGlyf.toBuffer());
    tags.push("head");
    datas.push(headBuf);
    tags.push("hhea");
    datas.push(hheaBuf);
    tags.push("hmtx");
    datas.push(newHmtx.toBuffer());
    tags.push("loca");
    datas.push(newLoca.toBuffer());
    tags.push("maxp");
    datas.push(maxpBuf);
    return this.writeSfnt(tags, datas);
  };
  mark (gid, depth) {
    if ( depth > 8 ) {
      return;
    }
    if ( gid < 0 ) {
      return;
    }
    if ( gid >= (this.keep.length) ) {
      return;
    }
    if ( this.keep[gid] ) {
      return;
    }
    this.keep[gid] = true;
    const start = this.glyphStart(gid);
    const end = this.glyphEnd(gid);
    if ( (end - start) < 10 ) {
      return;
    }
    const off = this.glyfOffset + start;
    const numberOfContours = this.font.readInt16(off);
    if ( numberOfContours >= 0 ) {
      return;
    }
    let p = off + 10;
    let more = true;
    while (more) {
      const flags = this.font.readUInt16(p);
      const compGid = this.font.readUInt16((p + 2));
      this.mark(compGid, depth + 1);
      p = p + 4;
      if ( (flags % 2) == 1 ) {
        p = p + 4;
      } else {
        p = p + 2;
      }
      if ( this.bit(flags, 3) == 1 ) {
        p = p + 2;
      }
      if ( this.bit(flags, 6) == 1 ) {
        p = p + 4;
      }
      if ( this.bit(flags, 7) == 1 ) {
        p = p + 8;
      }
      more = this.bit(flags, 5) == 1;
      if ( p >= (this.glyfOffset + this.glyfLength) ) {
        more = false;
      }
    };
  };
  bit (value, n) {
    let shifted = value;
    let i = 0;
    while (i < n) {
      shifted = Math.floor( (shifted / 2));
      i = i + 1;
    };
    return shifted % 2;
  };
  glyphStart (gid) {
    if ( this.locaLongFormat ) {
      return this.font.readUInt32((this.locaOffset + (gid * 4)));
    }
    return this.font.readUInt16((this.locaOffset + (gid * 2))) * 2;
  };
  glyphEnd (gid) {
    return this.glyphStart((gid + 1));
  };
  writeSfnt (tags, datas) {
    const n = tags.length;
    const out = new GrowableBuffer();
    let entrySelector = 0;
    let pow = 1;
    while ((pow * 2) <= n) {
      pow = pow * 2;
      entrySelector = entrySelector + 1;
    };
    const searchRange = pow * 16;
    out.writeInt32BE(65536);
    out.writeInt16BE(n);
    out.writeInt16BE(searchRange);
    out.writeInt16BE(entrySelector);
    out.writeInt16BE((n * 16) - searchRange);
    const dataStart = 12 + (n * 16);
    let offsets = [];
    let cursor = dataStart;
    let i = 0;
    while (i < n) {
      offsets.push(cursor);
      const __len = (datas[i]).byteLength;
      cursor = cursor + __len;
      while ((cursor % 4) != 0) {
        cursor = cursor + 1;
      };
      i = i + 1;
    };
    i = 0;
    while (i < n) {
      const d = datas[i];
      out.writeString(tags[i]);
      out.writeInt32BE(TTFSubset.checksum(d));
      out.writeInt32BE(offsets[i]);
      out.writeInt32BE(d.byteLength);
      i = i + 1;
    };
    i = 0;
    while (i < n) {
      const d2 = datas[i];
      out.writeBuffer(d2);
      while (((out).size() % 4) != 0) {
        out.writeByte(0);
      };
      i = i + 1;
    };
    return out.toBuffer();
  };
}
TTFSubset.build = function(font, usedGids) {
  const sub = new TTFSubset();
  return sub.run(font, usedGids);
};
TTFSubset.checksum = function(data) {
  let sum = 0;
  const __len = data.byteLength;
  let i = 0;
  while (i < __len) {
    const b0 = data._view.getUint8(i);
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    if ( (i + 1) < __len ) {
      b1 = data._view.getUint8((i + 1));
    }
    if ( (i + 2) < __len ) {
      b2 = data._view.getUint8((i + 2));
    }
    if ( (i + 3) < __len ) {
      b3 = data._view.getUint8((i + 3));
    }
    const word = (((b0 * 16777216) + (b1 * 65536)) + (b2 * 256)) + b3;
    sum = (sum + word) % 4294967296;
    i = i + 4;
  };
  return sum;
};
class BitReader  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataStart = 0;
    this.dataEnd = 0;
    this.bytePos = 0;
    this.bitPos = 0;
    this.currentByte = 0;
    this.eof = false;
  }
  init (buf, startPos, length) {
    this.data = buf;
    this.dataStart = startPos;
    this.dataEnd = startPos + length;
    this.bytePos = startPos;
    this.bitPos = 0;
    this.currentByte = 0;
    this.eof = false;
  };
  loadNextByte () {
    if ( this.bytePos >= this.dataEnd ) {
      this.eof = true;
      this.currentByte = 0;
      this.bitPos = 8;
      return;
    }
    this.currentByte = this.data._view.getUint8(this.bytePos);
    this.bytePos = this.bytePos + 1;
    if ( this.currentByte == 255 ) {
      if ( this.bytePos < this.dataEnd ) {
        const nextByte = this.data._view.getUint8(this.bytePos);
        if ( nextByte == 0 ) {
          this.bytePos = this.bytePos + 1;
        } else {
          if ( (nextByte >= 208) && (nextByte <= 215) ) {
            this.bytePos = this.bytePos + 1;
            this.loadNextByte();
            return;
          }
          if ( nextByte == 255 ) {
            this.bytePos = this.bytePos + 1;
            this.loadNextByte();
            return;
          }
        }
      }
    }
    this.bitPos = 8;
  };
  readBit () {
    if ( this.bitPos == 0 ) {
      this.loadNextByte();
    }
    if ( this.eof ) {
      return 0;
    }
    this.bitPos = this.bitPos - 1;
    const bit = (((this.currentByte >> this.bitPos)) & 1);
    return bit;
  };
  readBits (count) {
    let result = 0;
    let i = 0;
    while (i < count) {
      result = (((result << 1)) | this.readBit());
      i = i + 1;
    };
    return result;
  };
  peekBits (count) {
    const savedBytePos = this.bytePos;
    const savedBitPos = this.bitPos;
    const savedCurrentByte = this.currentByte;
    const savedEof = this.eof;
    const result = this.readBits(count);
    this.bytePos = savedBytePos;
    this.bitPos = savedBitPos;
    this.currentByte = savedCurrentByte;
    this.eof = savedEof;
    return result;
  };
  alignToByte () {
    this.bitPos = 0;
  };
  skipRestartMarker () {
    if ( (this.bytePos + 1) >= this.dataEnd ) {
      return false;
    }
    const byte1 = this.data._view.getUint8(this.bytePos);
    const byte2 = this.data._view.getUint8((this.bytePos + 1));
    if ( ((byte1 == 255) && (byte2 >= 208)) && (byte2 <= 215) ) {
      this.bytePos = this.bytePos + 2;
      return true;
    }
    return false;
  };
  getBytePosition () {
    return this.bytePos;
  };
  isEOF () {
    return this.eof;
  };
  receiveExtend (length) {
    if ( length == 0 ) {
      return 0;
    }
    let value = this.readBits(length);
    const threshold = (1 << (length - 1));
    if ( value < threshold ) {
      value = value - (((threshold << 1)) - 1);
    }
    return value;
  };
}
class HuffmanTable  {
  constructor() {
    this.bits = new Int32Array(16);
    this.values = [];
    this.maxCode = new Int32Array(16);
    this.minCode = new Int32Array(16);
    this.valPtr = new Int32Array(16);
    this.tableClass = 0;
    this.tableId = 0;
    let i = 0;
    while (i < 16) {
      this.bits[i] = 0;
      this.maxCode[i] = -1;
      this.minCode[i] = 0;
      this.valPtr[i] = 0;
      i = i + 1;
    };
  }
  build () {
    let code = 0;
    let valueIdx = 0;
    let i = 0;
    while (i < 16) {
      const count = this.bits[i];
      if ( count > 0 ) {
        this.minCode[i] = code;
        this.valPtr[i] = valueIdx;
        valueIdx = valueIdx + count;
        code = code + count;
        this.maxCode[i] = code - 1;
      } else {
        this.maxCode[i] = -1;
        this.minCode[i] = 0;
        this.valPtr[i] = valueIdx;
      }
      code = (code << 1);
      i = i + 1;
    };
  };
  decode (reader) {
    let code = 0;
    let length = 0;
    while (length < 16) {
      const bit = reader.readBit();
      code = (((code << 1)) | bit);
      const maxC = this.maxCode[length];
      if ( maxC >= 0 ) {
        if ( code <= maxC ) {
          const minC = this.minCode[length];
          const ptr = this.valPtr[length];
          const idx = ptr + (code - minC);
          return this.values[idx];
        }
      }
      length = length + 1;
    };
    console.log("Huffman decode error: code not found");
    return 0;
  };
  resetArrays () {
    let i = 0;
    while (i < 16) {
      this.bits[i] = 0;
      this.maxCode[i] = -1;
      this.minCode[i] = 0;
      this.valPtr[i] = 0;
      i = i + 1;
    };
    this.values.length = 0;
  };
}
class HuffmanDecoder  {
  constructor() {
    this.quiet = false;
    this.dcTable0 = new HuffmanTable();
    this.dcTable1 = new HuffmanTable();
    this.acTable0 = new HuffmanTable();
    this.acTable1 = new HuffmanTable();
  }
  getDCTable (id) {
    if ( id == 0 ) {
      return this.dcTable0;
    }
    return this.dcTable1;
  };
  getACTable (id) {
    if ( id == 0 ) {
      return this.acTable0;
    }
    return this.acTable1;
  };
  parseDHT (data, pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const tableInfo = data._view.getUint8(pos);
      pos = pos + 1;
      const tableClass = (tableInfo >> 4);
      const tableId = (tableInfo & 15);
      let table = this.getDCTable(tableId);
      if ( tableClass == 1 ) {
        table = this.getACTable(tableId);
      }
      table.tableClass = tableClass;
      table.tableId = tableId;
      table.resetArrays();
      let totalSymbols = 0;
      let i = 0;
      while (i < 16) {
        const count = data._view.getUint8(pos);
        table.bits[i] = count;
        totalSymbols = totalSymbols + count;
        pos = pos + 1;
        i = i + 1;
      };
      i = 0;
      while (i < totalSymbols) {
        table.values.push(data._view.getUint8(pos));
        pos = pos + 1;
        i = i + 1;
      };
      table.build();
      let classStr = "DC";
      if ( tableClass == 1 ) {
        classStr = "AC";
      }
      if ( this.quiet == false ) {
        console.log((((("  Huffman table " + classStr) + ((tableId.toString()))) + ": ") + ((totalSymbols.toString()))) + " symbols");
      }
    };
  };
}
class IDCT  {
  constructor() {
    this.cosTable = new Int32Array(64);
    this.zigzagMap = new Int32Array(64);
    this.cosTable[0] = 1024;
    this.cosTable[1] = 1004;
    this.cosTable[2] = 946;
    this.cosTable[3] = 851;
    this.cosTable[4] = 724;
    this.cosTable[5] = 569;
    this.cosTable[6] = 392;
    this.cosTable[7] = 200;
    this.cosTable[8] = 1024;
    this.cosTable[9] = 851;
    this.cosTable[10] = 392;
    this.cosTable[11] = -200;
    this.cosTable[12] = -724;
    this.cosTable[13] = -1004;
    this.cosTable[14] = -946;
    this.cosTable[15] = -569;
    this.cosTable[16] = 1024;
    this.cosTable[17] = 569;
    this.cosTable[18] = -392;
    this.cosTable[19] = -1004;
    this.cosTable[20] = -724;
    this.cosTable[21] = 200;
    this.cosTable[22] = 946;
    this.cosTable[23] = 851;
    this.cosTable[24] = 1024;
    this.cosTable[25] = 200;
    this.cosTable[26] = -946;
    this.cosTable[27] = -569;
    this.cosTable[28] = 724;
    this.cosTable[29] = 851;
    this.cosTable[30] = -392;
    this.cosTable[31] = -1004;
    this.cosTable[32] = 1024;
    this.cosTable[33] = -200;
    this.cosTable[34] = -946;
    this.cosTable[35] = 569;
    this.cosTable[36] = 724;
    this.cosTable[37] = -851;
    this.cosTable[38] = -392;
    this.cosTable[39] = 1004;
    this.cosTable[40] = 1024;
    this.cosTable[41] = -569;
    this.cosTable[42] = -392;
    this.cosTable[43] = 1004;
    this.cosTable[44] = -724;
    this.cosTable[45] = -200;
    this.cosTable[46] = 946;
    this.cosTable[47] = -851;
    this.cosTable[48] = 1024;
    this.cosTable[49] = -851;
    this.cosTable[50] = 392;
    this.cosTable[51] = 200;
    this.cosTable[52] = -724;
    this.cosTable[53] = 1004;
    this.cosTable[54] = -946;
    this.cosTable[55] = 569;
    this.cosTable[56] = 1024;
    this.cosTable[57] = -1004;
    this.cosTable[58] = 946;
    this.cosTable[59] = -851;
    this.cosTable[60] = 724;
    this.cosTable[61] = -569;
    this.cosTable[62] = 392;
    this.cosTable[63] = -200;
    this.zigzagMap[0] = 0;
    this.zigzagMap[1] = 1;
    this.zigzagMap[2] = 8;
    this.zigzagMap[3] = 16;
    this.zigzagMap[4] = 9;
    this.zigzagMap[5] = 2;
    this.zigzagMap[6] = 3;
    this.zigzagMap[7] = 10;
    this.zigzagMap[8] = 17;
    this.zigzagMap[9] = 24;
    this.zigzagMap[10] = 32;
    this.zigzagMap[11] = 25;
    this.zigzagMap[12] = 18;
    this.zigzagMap[13] = 11;
    this.zigzagMap[14] = 4;
    this.zigzagMap[15] = 5;
    this.zigzagMap[16] = 12;
    this.zigzagMap[17] = 19;
    this.zigzagMap[18] = 26;
    this.zigzagMap[19] = 33;
    this.zigzagMap[20] = 40;
    this.zigzagMap[21] = 48;
    this.zigzagMap[22] = 41;
    this.zigzagMap[23] = 34;
    this.zigzagMap[24] = 27;
    this.zigzagMap[25] = 20;
    this.zigzagMap[26] = 13;
    this.zigzagMap[27] = 6;
    this.zigzagMap[28] = 7;
    this.zigzagMap[29] = 14;
    this.zigzagMap[30] = 21;
    this.zigzagMap[31] = 28;
    this.zigzagMap[32] = 35;
    this.zigzagMap[33] = 42;
    this.zigzagMap[34] = 49;
    this.zigzagMap[35] = 56;
    this.zigzagMap[36] = 57;
    this.zigzagMap[37] = 50;
    this.zigzagMap[38] = 43;
    this.zigzagMap[39] = 36;
    this.zigzagMap[40] = 29;
    this.zigzagMap[41] = 22;
    this.zigzagMap[42] = 15;
    this.zigzagMap[43] = 23;
    this.zigzagMap[44] = 30;
    this.zigzagMap[45] = 37;
    this.zigzagMap[46] = 44;
    this.zigzagMap[47] = 51;
    this.zigzagMap[48] = 58;
    this.zigzagMap[49] = 59;
    this.zigzagMap[50] = 52;
    this.zigzagMap[51] = 45;
    this.zigzagMap[52] = 38;
    this.zigzagMap[53] = 31;
    this.zigzagMap[54] = 39;
    this.zigzagMap[55] = 46;
    this.zigzagMap[56] = 53;
    this.zigzagMap[57] = 60;
    this.zigzagMap[58] = 61;
    this.zigzagMap[59] = 54;
    this.zigzagMap[60] = 47;
    this.zigzagMap[61] = 55;
    this.zigzagMap[62] = 62;
    this.zigzagMap[63] = 63;
  }
  dezigzag (zigzag) {
    let block = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagMap[i];
      const val = zigzag[i];
      block[pos] = val;
      i = i + 1;
    };
    return block;
  };
  idct1d (input, startIdx, stride, output, outIdx, outStride) {
    let hasAC = false;
    let uc = 1;
    while (uc < 8) {
      if ( (input[(startIdx + (uc * stride))]) != 0 ) {
        hasAC = true;
        uc = 8;
      }
      uc = uc + 1;
    };
    if ( hasAC == false ) {
      let dcSum = 0;
      const dcCoeff = input[startIdx];
      if ( dcCoeff != 0 ) {
        let dcContrib = dcCoeff * 1024;
        dcContrib = ((dcContrib * 724) >> 10);
        dcSum = dcSum + dcContrib;
      }
      const flat = (dcSum >> 11);
      let fx = 0;
      while (fx < 8) {
        output[outIdx + (fx * outStride)] = flat;
        fx = fx + 1;
      };
      return;
    }
    let x = 0;
    while (x < 8) {
      let sum = 0;
      let u = 0;
      while (u < 8) {
        const coeff = input[(startIdx + (u * stride))];
        if ( coeff != 0 ) {
          const cosVal = this.cosTable[((x * 8) + u)];
          let contrib = coeff * cosVal;
          if ( u == 0 ) {
            contrib = ((contrib * 724) >> 10);
          }
          sum = sum + contrib;
        }
        u = u + 1;
      };
      output[outIdx + (x * outStride)] = (sum >> 11);
      x = x + 1;
    };
  };
  transform (block, output) {
    const temp = new Int32Array(64);
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.idct1d(block, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    let col = 0;
    while (col < 8) {
      this.idct1d(temp, col, 8, output, col, 8);
      col = col + 1;
    };
    let i = 0;
    while (i < 64) {
      let val = (output[i]) + 128;
      if ( val < 0 ) {
        val = 0;
      }
      if ( val > 255 ) {
        val = 255;
      }
      output[i] = val;
      i = i + 1;
    };
  };
  transformFast (coeffs, output) {
    this.transform(coeffs, output);
  };
}
class Color  {
  constructor() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
  }
  setRGB (red, green, blue) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = 255;
  };
  setRGBA (red, green, blue, alpha) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  };
  clamp (val) {
    if ( val < 0 ) {
      return 0;
    }
    if ( val > 255 ) {
      return 255;
    }
    return val;
  };
  set (red, green, blue) {
    this.r = this.clamp(red);
    this.g = this.clamp(green);
    this.b = this.clamp(blue);
  };
  grayscale () {
    return ((((this.r * 77) + (this.g * 150)) + (this.b * 29)) >> 8);
  };
  toGrayscale () {
    const gray = this.grayscale();
    this.r = gray;
    this.g = gray;
    this.b = gray;
  };
  invert () {
    this.r = 255 - this.r;
    this.g = 255 - this.g;
    this.b = 255 - this.b;
  };
  adjustBrightness (amount) {
    this.r = this.clamp((this.r + amount));
    this.g = this.clamp((this.g + amount));
    this.b = this.clamp((this.b + amount));
  };
}
class ImageBuffer  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.pixels = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
  }
  init (w, h) {
    this.width = w;
    this.height = h;
    const size = (w * h) * 4;
    this.pixels = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.fill(255, 255, 255, 255);
  };
  initClear (w, h) {
    this.width = w;
    this.height = h;
    this.pixels = (function(){ var b = new ArrayBuffer(((w * h) * 4)); b._view = new DataView(b); return b; })();
  };
  fillTransparent () {
    const size = (this.width * this.height) * 4;
    (function(b,v,s,e){ var arr = new Uint8Array(b); for(var i=s;i<e;i++) arr[i]=v; })(this.pixels,0,0,size);
  };
  getPixelOffset (x, y) {
    return ((y * this.width) + x) * 4;
  };
  isValidCoord (x, y) {
    if ( x < 0 ) {
      return false;
    }
    if ( y < 0 ) {
      return false;
    }
    if ( x >= this.width ) {
      return false;
    }
    if ( y >= this.height ) {
      return false;
    }
    return true;
  };
  getPixel (x, y) {
    const c = new Color();
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      c.r = this.pixels._view.getUint8(off);
      c.g = this.pixels._view.getUint8((off + 1));
      c.b = this.pixels._view.getUint8((off + 2));
      c.a = this.pixels._view.getUint8((off + 3));
    }
    return c;
  };
  setPixel (x, y, c) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, c.r);
      this.pixels._view.setUint8(off + 1, c.g);
      this.pixels._view.setUint8(off + 2, c.b);
      this.pixels._view.setUint8(off + 3, c.a);
    }
  };
  setPixelRGB (x, y, r, g, b) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      this.pixels._view.setUint8(off + 3, 255);
    }
  };
  setPixelRGBA (x, y, r, g, b, a) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      this.pixels._view.setUint8(off + 3, a);
    }
  };
  getRawBuffer () {
    return this.pixels;
  };
  fill (r, g, b, a) {
    const size = (this.width * this.height) * 4;
    let i = 0;
    while (i < size) {
      this.pixels._view.setUint8(i, r);
      this.pixels._view.setUint8(i + 1, g);
      this.pixels._view.setUint8(i + 2, b);
      this.pixels._view.setUint8(i + 3, a);
      i = i + 4;
    };
  };
  fillRect (x, y, w, h, c) {
    const endX = x + w;
    const endY = y + h;
    let py = y;
    while (py < endY) {
      let px = x;
      while (px < endX) {
        this.setPixel(px, py, c);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  invert () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      this.pixels._view.setUint8(off, 255 - r);
      this.pixels._view.setUint8(off + 1, 255 - g);
      this.pixels._view.setUint8(off + 2, 255 - b);
      i = i + 1;
    };
  };
  grayscale () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      const gray = ((((r * 77) + (g * 150)) + (b * 29)) >> 8);
      this.pixels._view.setUint8(off, gray);
      this.pixels._view.setUint8(off + 1, gray);
      this.pixels._view.setUint8(off + 2, gray);
      i = i + 1;
    };
  };
  adjustBrightness (amount) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      let r = this.pixels._view.getUint8(off);
      let g = this.pixels._view.getUint8((off + 1));
      let b = this.pixels._view.getUint8((off + 2));
      r = r + amount;
      g = g + amount;
      b = b + amount;
      if ( r < 0 ) {
        r = 0;
      }
      if ( r > 255 ) {
        r = 255;
      }
      if ( g < 0 ) {
        g = 0;
      }
      if ( g > 255 ) {
        g = 255;
      }
      if ( b < 0 ) {
        b = 0;
      }
      if ( b > 255 ) {
        b = 255;
      }
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      i = i + 1;
    };
  };
  threshold (level) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      const gray = ((((r * 77) + (g * 150)) + (b * 29)) >> 8);
      let val = 0;
      if ( gray >= level ) {
        val = 255;
      }
      this.pixels._view.setUint8(off, val);
      this.pixels._view.setUint8(off + 1, val);
      this.pixels._view.setUint8(off + 2, val);
      i = i + 1;
    };
  };
  sepia () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      let newR = ((((r * 101) + (g * 197)) + (b * 48)) >> 8);
      let newG = ((((r * 89) + (g * 175)) + (b * 43)) >> 8);
      let newB = ((((r * 70) + (g * 137)) + (b * 33)) >> 8);
      if ( newR > 255 ) {
        newR = 255;
      }
      if ( newG > 255 ) {
        newG = 255;
      }
      if ( newB > 255 ) {
        newB = 255;
      }
      this.pixels._view.setUint8(off, newR);
      this.pixels._view.setUint8(off + 1, newG);
      this.pixels._view.setUint8(off + 2, newB);
      i = i + 1;
    };
  };
  flipHorizontal () {
    let y = 0;
    while (y < this.height) {
      let x = 0;
      const halfW = (this.width >> 1);
      while (x < halfW) {
        const x2 = (this.width - 1) - x;
        const off1 = this.getPixelOffset(x, y);
        const off2 = this.getPixelOffset(x2, y);
        const r1 = this.pixels._view.getUint8(off1);
        const g1 = this.pixels._view.getUint8((off1 + 1));
        const b1 = this.pixels._view.getUint8((off1 + 2));
        const a1 = this.pixels._view.getUint8((off1 + 3));
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8((off2 + 1));
        const b2 = this.pixels._view.getUint8((off2 + 2));
        const a2 = this.pixels._view.getUint8((off2 + 3));
        this.pixels._view.setUint8(off1, r2);
        this.pixels._view.setUint8(off1 + 1, g2);
        this.pixels._view.setUint8(off1 + 2, b2);
        this.pixels._view.setUint8(off1 + 3, a2);
        this.pixels._view.setUint8(off2, r1);
        this.pixels._view.setUint8(off2 + 1, g1);
        this.pixels._view.setUint8(off2 + 2, b1);
        this.pixels._view.setUint8(off2 + 3, a1);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  flipVertical () {
    let y = 0;
    const halfH = (this.height >> 1);
    while (y < halfH) {
      const y2 = (this.height - 1) - y;
      let x = 0;
      while (x < this.width) {
        const off1 = this.getPixelOffset(x, y);
        const off2 = this.getPixelOffset(x, y2);
        const r1 = this.pixels._view.getUint8(off1);
        const g1 = this.pixels._view.getUint8((off1 + 1));
        const b1 = this.pixels._view.getUint8((off1 + 2));
        const a1 = this.pixels._view.getUint8((off1 + 3));
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8((off2 + 1));
        const b2 = this.pixels._view.getUint8((off2 + 2));
        const a2 = this.pixels._view.getUint8((off2 + 3));
        this.pixels._view.setUint8(off1, r2);
        this.pixels._view.setUint8(off1 + 1, g2);
        this.pixels._view.setUint8(off1 + 2, b2);
        this.pixels._view.setUint8(off1 + 3, a2);
        this.pixels._view.setUint8(off2, r1);
        this.pixels._view.setUint8(off2 + 1, g1);
        this.pixels._view.setUint8(off2 + 2, b1);
        this.pixels._view.setUint8(off2 + 3, a1);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawLine (x1, y1, x2, y2, c) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    if ( dx < 0 ) {
      dx = 0 - dx;
    }
    if ( dy < 0 ) {
      dy = 0 - dy;
    }
    let sx = 1;
    if ( x1 > x2 ) {
      sx = -1;
    }
    let sy = 1;
    if ( y1 > y2 ) {
      sy = -1;
    }
    let err = dx - dy;
    let x = x1;
    let y = y1;
    let done = false;
    while (done == false) {
      this.setPixel(x, y, c);
      if ( (x == x2) && (y == y2) ) {
        done = true;
      } else {
        const e2 = err * 2;
        if ( e2 > (0 - dy) ) {
          err = err - dy;
          x = x + sx;
        }
        if ( e2 < dx ) {
          err = err + dx;
          y = y + sy;
        }
      }
    };
  };
  drawRect (x, y, w, h, c) {
    this.drawLine(x, y, (x + w) - 1, y, c);
    this.drawLine((x + w) - 1, y, (x + w) - 1, (y + h) - 1, c);
    this.drawLine((x + w) - 1, (y + h) - 1, x, (y + h) - 1, c);
    this.drawLine(x, (y + h) - 1, x, y, c);
  };
  scale (factor) {
    const newW = this.width * factor;
    const newH = this.height * factor;
    return this.scaleToSize(newW, newH);
  };
  scaleToSize (newW, newH) {
    const result = new ImageBuffer();
    result.init(newW, newH);
    const scaleX = (this.width) / (newW);
    const scaleY = (this.height) / (newH);
    let destY = 0;
    while (destY < newH) {
      const srcYf = (destY) * scaleY;
      const srcY0 = Math.floor( srcYf);
      let srcY1 = srcY0 + 1;
      if ( srcY1 >= this.height ) {
        srcY1 = this.height - 1;
      }
      const fy = srcYf - (srcY0);
      let destX = 0;
      while (destX < newW) {
        const srcXf = (destX) * scaleX;
        const srcX0 = Math.floor( srcXf);
        let srcX1 = srcX0 + 1;
        if ( srcX1 >= this.width ) {
          srcX1 = this.width - 1;
        }
        const fx = srcXf - (srcX0);
        const off00 = ((srcY0 * this.width) + srcX0) * 4;
        const off01 = ((srcY0 * this.width) + srcX1) * 4;
        const off10 = ((srcY1 * this.width) + srcX0) * 4;
        const off11 = ((srcY1 * this.width) + srcX1) * 4;
        const r = this.bilinear((this.pixels._view.getUint8(off00)), (this.pixels._view.getUint8(off01)), (this.pixels._view.getUint8(off10)), (this.pixels._view.getUint8(off11)), fx, fy);
        const g = this.bilinear((this.pixels._view.getUint8((off00 + 1))), (this.pixels._view.getUint8((off01 + 1))), (this.pixels._view.getUint8((off10 + 1))), (this.pixels._view.getUint8((off11 + 1))), fx, fy);
        const b = this.bilinear((this.pixels._view.getUint8((off00 + 2))), (this.pixels._view.getUint8((off01 + 2))), (this.pixels._view.getUint8((off10 + 2))), (this.pixels._view.getUint8((off11 + 2))), fx, fy);
        const a = this.bilinear((this.pixels._view.getUint8((off00 + 3))), (this.pixels._view.getUint8((off01 + 3))), (this.pixels._view.getUint8((off10 + 3))), (this.pixels._view.getUint8((off11 + 3))), fx, fy);
        const destOff = ((destY * newW) + destX) * 4;
        result.pixels._view.setUint8(destOff, r);
        result.pixels._view.setUint8(destOff + 1, g);
        result.pixels._view.setUint8(destOff + 2, b);
        result.pixels._view.setUint8(destOff + 3, a);
        destX = destX + 1;
      };
      destY = destY + 1;
    };
    return result;
  };
  bilinear (v00, v01, v10, v11, fx, fy) {
    const top = ((v00) * (1.0 - fx)) + ((v01) * fx);
    const bottom = ((v10) * (1.0 - fx)) + ((v11) * fx);
    const result = (top * (1.0 - fy)) + (bottom * fy);
    return Math.floor( result);
  };
  rotate90CW () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.height - 1) - y;
        const newY = x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  rotate180 () {
    const result = new ImageBuffer();
    result.init(this.width, this.height);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.width - 1) - x;
        const newY = (this.height - 1) - y;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.width) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  rotate270CW () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = y;
        const newY = (this.width - 1) - x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  transpose () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((x * this.height) + y) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  transverse () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.height - 1) - y;
        const newY = (this.width - 1) - x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  applyExifOrientation (orientation) {
    if ( orientation == 1 ) {
      return this.scale(1);
    }
    if ( orientation == 2 ) {
      const result = new ImageBuffer();
      result.init(this.width, this.height);
      let y = 0;
      while (y < this.height) {
        let x = 0;
        while (x < this.width) {
          const srcOff = ((y * this.width) + x) * 4;
          const destOff = ((y * this.width) + ((this.width - 1) - x)) * 4;
          result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
          result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
          result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
          result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
          x = x + 1;
        };
        y = y + 1;
      };
      return result;
    }
    if ( orientation == 3 ) {
      return this.rotate180();
    }
    if ( orientation == 4 ) {
      const result_1 = new ImageBuffer();
      result_1.init(this.width, this.height);
      let y_1 = 0;
      while (y_1 < this.height) {
        let x_1 = 0;
        while (x_1 < this.width) {
          const srcOff_1 = ((y_1 * this.width) + x_1) * 4;
          const destOff_1 = ((((this.height - 1) - y_1) * this.width) + x_1) * 4;
          result_1.pixels._view.setUint8(destOff_1, this.pixels._view.getUint8(srcOff_1));
          result_1.pixels._view.setUint8(destOff_1 + 1, this.pixels._view.getUint8((srcOff_1 + 1)));
          result_1.pixels._view.setUint8(destOff_1 + 2, this.pixels._view.getUint8((srcOff_1 + 2)));
          result_1.pixels._view.setUint8(destOff_1 + 3, this.pixels._view.getUint8((srcOff_1 + 3)));
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
      return result_1;
    }
    if ( orientation == 5 ) {
      return this.transpose();
    }
    if ( orientation == 6 ) {
      return this.rotate90CW();
    }
    if ( orientation == 7 ) {
      return this.transverse();
    }
    if ( orientation == 8 ) {
      return this.rotate270CW();
    }
    return this.scale(1);
  };
}
class PPMImage  {
  constructor() {
  }
  parseNumber (data, startPos, endPos) {
    const __len = data.byteLength;
    let pos = startPos;
    let skipping = true;
    while (skipping && (pos < __len)) {
      const ch = data._view.getUint8(pos);
      if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
        pos = pos + 1;
      } else {
        skipping = false;
      }
    };
    let value = 0;
    let parsing = true;
    while (parsing && (pos < __len)) {
      const ch_1 = data._view.getUint8(pos);
      if ( (ch_1 >= 48) && (ch_1 <= 57) ) {
        value = (value * 10) + (ch_1 - 48);
        pos = pos + 1;
      } else {
        parsing = false;
      }
    };
    endPos[0] = pos;
    return value;
  };
  skipToNextLine (data, pos) {
    const __len = data.byteLength;
    while (pos < __len) {
      const ch = data._view.getUint8(pos);
      pos = pos + 1;
      if ( ch == 10 ) {
        return pos;
      }
    };
    return pos;
  };
  load (dirPath, fileName) {
    const data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const __len = data.byteLength;
    if ( __len < 10 ) {
      console.log("Error: File too small: " + fileName);
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    const m1 = data._view.getUint8(0);
    const m2 = data._view.getUint8(1);
    if ( (m1 != 80) || ((m2 != 54) && (m2 != 51)) ) {
      console.log("Error: Not a PPM file (P3 or P6): " + fileName);
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    const isBinary = m2 == 54;
    let pos = 2;
    let endPos = [];
    endPos.push(0);
    let skippingComments = true;
    while (skippingComments && (pos < __len)) {
      const ch = data._view.getUint8(pos);
      if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
        pos = pos + 1;
      } else {
        if ( ch == 35 ) {
          pos = this.skipToNextLine(data, pos);
        } else {
          skippingComments = false;
        }
      }
    };
    const width = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    const height = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    const maxVal = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    if ( pos < __len ) {
      pos = pos + 1;
    }
    console.log((((("Loading PPM: " + ((width.toString()))) + "x") + ((height.toString()))) + ", maxval=") + ((maxVal.toString())));
    const img = new ImageBuffer();
    img.init(width, height);
    if ( isBinary ) {
      let y = 0;
      while (y < height) {
        let x = 0;
        while (x < width) {
          if ( (pos + 2) < __len ) {
            const r = data._view.getUint8(pos);
            const g = data._view.getUint8((pos + 1));
            const b = data._view.getUint8((pos + 2));
            img.setPixelRGB(x, y, r, g, b);
            pos = pos + 3;
          }
          x = x + 1;
        };
        y = y + 1;
      };
    } else {
      let y_1 = 0;
      while (y_1 < height) {
        let x_1 = 0;
        while (x_1 < width) {
          const r_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          const g_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          const b_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          img.setPixelRGB(x_1, y_1, r_1, g_1, b_1);
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
    }
    return img;
  };
  save (img, dirPath, fileName) {
    const buf = new GrowableBuffer();
    buf.writeString("P6\n");
    buf.writeString(((((img.width.toString())) + " ") + ((img.height.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        buf.writeByte(c.r);
        buf.writeByte(c.g);
        buf.writeByte(c.b);
        x = x + 1;
      };
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM: " + dirPath) + "/") + fileName);
  };
  saveP3 (img, dirPath, fileName) {
    const buf = new GrowableBuffer();
    buf.writeString("P3\n");
    buf.writeString("# Created by Ranger ImageEditor\n");
    buf.writeString(((((img.width.toString())) + " ") + ((img.height.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        buf.writeString((((((c.r.toString())) + " ") + ((c.g.toString()))) + " ") + ((c.b.toString())));
        if ( x < (img.width - 1) ) {
          buf.writeString("  ");
        }
        x = x + 1;
      };
      buf.writeString("\n");
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM (ASCII): " + dirPath) + "/") + fileName);
  };
}
class JPEGComponent  {
  constructor() {
    this.id = 0;
    this.hSamp = 1;
    this.vSamp = 1;
    this.quantTableId = 0;
    this.dcTableId = 0;
    this.acTableId = 0;
    this.prevDC = 0;
  }
}
class QuantizationTable  {
  constructor() {
    this.values = [];
    this.id = 0;
    let i_1 = 0;
    while (i_1 < 64) {
      this.values.push(1);
      i_1 = i_1 + 1;
    };
  }
}
class JPEGDecoder  {
  constructor() {
    this.quiet = false;
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.components = [];
    this.quantTables = [];
    this.scanDataStart = 0;
    this.scanDataLen = 0;
    this.mcuWidth = 8;
    this.mcuHeight = 8;
    this.mcusPerRow = 0;
    this.mcusPerCol = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    this.restartInterval = 0;
    this.huffman = new HuffmanDecoder();
    this.idct = new IDCT();
    let i_2 = 0;
    while (i_2 < 4) {
      this.quantTables.push(new QuantizationTable());
      i_2 = i_2 + 1;
    };
  }
  say (msg) {
    if ( this.quiet ) {
      return;
    }
    console.log(msg);
  };
  reset () {
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.scanDataStart = 0;
    this.scanDataLen = 0;
    this.mcuWidth = 8;
    this.mcuHeight = 8;
    this.mcusPerRow = 0;
    this.mcusPerCol = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    this.restartInterval = 0;
    this.components.length = 0;
    this.huffman.dcTable0.resetArrays();
    this.huffman.dcTable1.resetArrays();
    this.huffman.acTable0.resetArrays();
    this.huffman.acTable1.resetArrays();
    let i = 0;
    while (i < 4) {
      const qt = this.quantTables[i];
      qt.values.length = 0;
      let j = 0;
      while (j < 64) {
        qt.values.push(1);
        j = j + 1;
      };
      i = i + 1;
    };
  };
  readUint16BE (pos) {
    const high = this.data._view.getUint8(pos);
    const low = this.data._view.getUint8((pos + 1));
    return (high * 256) + low;
  };
  parseSOF (pos, length) {
    this.precision = this.data._view.getUint8(pos);
    this.height = this.readUint16BE((pos + 1));
    this.width = this.readUint16BE((pos + 3));
    this.numComponents = this.data._view.getUint8((pos + 5));
    this.say(((((("  Image: " + ((this.width.toString()))) + "x") + ((this.height.toString()))) + ", ") + ((this.numComponents.toString()))) + " components");
    this.components.length = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    let i = 0;
    let offset = pos + 6;
    while (i < this.numComponents) {
      const comp = new JPEGComponent();
      comp.id = this.data._view.getUint8(offset);
      const sampling = this.data._view.getUint8((offset + 1));
      comp.hSamp = (sampling >> 4);
      comp.vSamp = (sampling & 15);
      comp.quantTableId = this.data._view.getUint8((offset + 2));
      if ( comp.hSamp > this.maxHSamp ) {
        this.maxHSamp = comp.hSamp;
      }
      if ( comp.vSamp > this.maxVSamp ) {
        this.maxVSamp = comp.vSamp;
      }
      this.components.push(comp);
      this.say((((((("    Component " + ((comp.id.toString()))) + ": ") + ((comp.hSamp.toString()))) + "x") + ((comp.vSamp.toString()))) + " sampling, quant table ") + ((comp.quantTableId.toString())));
      offset = offset + 3;
      i = i + 1;
    };
    this.mcuWidth = this.maxHSamp * 8;
    this.mcuHeight = this.maxVSamp * 8;
    this.mcusPerRow = Math.floor( (((this.width + this.mcuWidth) - 1) / this.mcuWidth));
    this.mcusPerCol = Math.floor( (((this.height + this.mcuHeight) - 1) / this.mcuHeight));
    this.say((((((("  MCU size: " + ((this.mcuWidth.toString()))) + "x") + ((this.mcuHeight.toString()))) + ", grid: ") + ((this.mcusPerRow.toString()))) + "x") + ((this.mcusPerCol.toString())));
  };
  parseDQT (pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const info = this.data._view.getUint8(pos);
      pos = pos + 1;
      const precision_1 = (info >> 4);
      const tableId = (info & 15);
      const table = this.quantTables[tableId];
      table.id = tableId;
      table.values.length = 0;
      let i = 0;
      while (i < 64) {
        if ( precision_1 == 0 ) {
          table.values.push(this.data._view.getUint8(pos));
          pos = pos + 1;
        } else {
          table.values.push(this.readUint16BE(pos));
          pos = pos + 2;
        }
        i = i + 1;
      };
      this.say(((("  Quantization table " + ((tableId.toString()))) + " (") + (((precision_1 + 1).toString()))) + "-byte values)");
    };
  };
  parseSOS (pos, length) {
    const numScanComponents = this.data._view.getUint8(pos);
    pos = pos + 1;
    let i = 0;
    while (i < numScanComponents) {
      const compId = this.data._view.getUint8(pos);
      const tableSelect = this.data._view.getUint8((pos + 1));
      pos = pos + 2;
      let j = 0;
      while (j < this.numComponents) {
        const comp = this.components[j];
        if ( comp.id == compId ) {
          comp.dcTableId = (tableSelect >> 4);
          comp.acTableId = (tableSelect & 15);
          this.say((((("    Component " + ((compId.toString()))) + ": DC table ") + ((comp.dcTableId.toString()))) + ", AC table ") + ((comp.acTableId.toString())));
        }
        j = j + 1;
      };
      i = i + 1;
    };
    pos = pos + 3;
    this.scanDataStart = pos;
    let searchPos = pos;
    while (searchPos < (this.dataLen - 1)) {
      const b = this.data._view.getUint8(searchPos);
      if ( b == 255 ) {
        const nextB = this.data._view.getUint8((searchPos + 1));
        if ( (nextB != 0) && (nextB != 255) ) {
          if ( (nextB >= 208) && (nextB <= 215) ) {
            searchPos = searchPos + 2;
            continue;
          }
          this.scanDataLen = searchPos - this.scanDataStart;
          return;
        }
      }
      searchPos = searchPos + 1;
    };
    this.scanDataLen = this.dataLen - this.scanDataStart;
  };
  parseMarkers () {
    let pos = 0;
    if ( this.dataLen < 2 ) {
      this.say("Error: File too small");
      return false;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( (m1 != 255) || (m2 != 216) ) {
      this.say("Error: Not a JPEG file (missing SOI)");
      return false;
    }
    pos = 2;
    this.say("Parsing JPEG markers...");
    while (pos < (this.dataLen - 1)) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8((pos + 1));
      if ( marker2 == 255 ) {
        pos = pos + 1;
        continue;
      }
      if ( marker2 == 0 ) {
        pos = pos + 2;
        continue;
      }
      if ( marker2 == 216 ) {
        pos = pos + 2;
        continue;
      }
      if ( marker2 == 217 ) {
        this.say("  End of Image");
        return true;
      }
      if ( (marker2 >= 208) && (marker2 <= 215) ) {
        pos = pos + 2;
        continue;
      }
      if ( (pos + 4) > this.dataLen ) {
        return true;
      }
      const markerLen = this.readUint16BE((pos + 2));
      const dataStart = pos + 4;
      const markerDataLen = markerLen - 2;
      if ( marker2 == 192 ) {
        this.say("  SOF0 (Baseline DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 193 ) {
        this.say("  SOF1 (Extended Sequential DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 194 ) {
        this.say("  SOF2 (Progressive DCT) - NOT SUPPORTED");
        return false;
      }
      if ( marker2 == 196 ) {
        this.say("  DHT (Huffman Tables)");
        this.huffman.parseDHT(this.data, dataStart, markerDataLen);
      }
      if ( marker2 == 219 ) {
        this.say("  DQT (Quantization Tables)");
        this.parseDQT(dataStart, markerDataLen);
      }
      if ( marker2 == 221 ) {
        this.restartInterval = this.readUint16BE(dataStart);
        this.say(("  DRI (Restart Interval: " + ((this.restartInterval.toString()))) + ")");
      }
      if ( marker2 == 218 ) {
        this.say("  SOS (Start of Scan)");
        this.parseSOS(dataStart, markerDataLen);
        pos = this.scanDataStart + this.scanDataLen;
        continue;
      }
      if ( marker2 == 224 ) {
        this.say("  APP0 (JFIF)");
      }
      if ( marker2 == 225 ) {
        this.say("  APP1 (EXIF)");
      }
      if ( marker2 == 254 ) {
        this.say("  COM (Comment)");
      }
      pos = (pos + 2) + markerLen;
    };
    return true;
  };
  decodeBlock (reader, comp, quantTable) {
    let coeffs = new Int32Array(64);
    coeffs.fill(0, 0, 64);
    const dcTable = this.huffman.getDCTable(comp.dcTableId);
    const dcCategory = dcTable.decode(reader);
    const dcDiff = reader.receiveExtend(dcCategory);
    const dcValue = comp.prevDC + dcDiff;
    comp.prevDC = dcValue;
    const dcQuant = quantTable.values[0];
    coeffs[0] = dcValue * dcQuant;
    const acTable = this.huffman.getACTable(comp.acTableId);
    let k = 1;
    while (k < 64) {
      const acSymbol = acTable.decode(reader);
      if ( acSymbol == 0 ) {
        k = 64;
      } else {
        const runLength = (acSymbol >> 4);
        const acCategory = (acSymbol & 15);
        if ( acSymbol == 240 ) {
          k = k + 16;
        } else {
          k = k + runLength;
          if ( k < 64 ) {
            const acValue = reader.receiveExtend(acCategory);
            const acQuant = quantTable.values[k];
            coeffs[k] = acValue * acQuant;
            k = k + 1;
          }
        }
      }
    };
    return coeffs;
  };
  decode (dirPath, fileName) {
    const bytes = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    return this.decodeBytes(bytes);
  };
  decodeBytes (bytes) {
    this.reset();
    this.huffman.quiet = this.quiet;
    this.data = bytes;
    this.dataLen = this.data.byteLength;
    this.say(("Decoding JPEG in-memory (" + ((this.dataLen.toString()))) + " bytes)");
    const ok = this.parseMarkers();
    if ( ok == false ) {
      this.say("Error parsing JPEG markers");
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    if ( (this.width == 0) || (this.height == 0) ) {
      this.say("Error: Invalid image dimensions");
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    this.say(("Decoding " + ((this.scanDataLen.toString()))) + " bytes of scan data...");
    const img = new ImageBuffer();
    img.init(this.width, this.height);
    const reader = new BitReader();
    reader.init(this.data, this.scanDataStart, this.scanDataLen);
    let c = 0;
    while (c < this.numComponents) {
      const comp = this.components[c];
      comp.prevDC = 0;
      c = c + 1;
    };
    let yBlocksData = [];
    let yBlockCount = 0;
    let cbBlock = [];
    let crBlock = [];
    let mcuCount = 0;
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        if ( ((this.restartInterval > 0) && (mcuCount > 0)) && ((mcuCount % this.restartInterval) == 0) ) {
          c = 0;
          while (c < this.numComponents) {
            const compRst = this.components[c];
            compRst.prevDC = 0;
            c = c + 1;
          };
          reader.alignToByte();
          reader.skipRestartMarker();
        }
        yBlocksData.length = 0;
        yBlockCount = 0;
        let compIdx = 0;
        while (compIdx < this.numComponents) {
          const comp_1 = this.components[compIdx];
          const quantTable = this.quantTables[comp_1.quantTableId];
          let blockV = 0;
          while (blockV < comp_1.vSamp) {
            let blockH = 0;
            while (blockH < comp_1.hSamp) {
              const coeffs = this.decodeBlock(reader, comp_1, quantTable);
              let blockPixels = new Int32Array(64);
              blockPixels.fill(0, 0, 64);
              const tempBlock = this.idct.dezigzag(coeffs);
              this.idct.transform(tempBlock, blockPixels);
              if ( compIdx == 0 ) {
                let bi = 0;
                while (bi < 64) {
                  yBlocksData.push(blockPixels[bi]);
                  bi = bi + 1;
                };
                yBlockCount = yBlockCount + 1;
              }
              if ( compIdx == 1 ) {
                cbBlock.length = 0;
                let bi_1 = 0;
                while (bi_1 < 64) {
                  cbBlock.push(blockPixels[bi_1]);
                  bi_1 = bi_1 + 1;
                };
              }
              if ( compIdx == 2 ) {
                crBlock.length = 0;
                let bi_2 = 0;
                while (bi_2 < 64) {
                  crBlock.push(blockPixels[bi_2]);
                  bi_2 = bi_2 + 1;
                };
              }
              blockH = blockH + 1;
            };
            blockV = blockV + 1;
          };
          compIdx = compIdx + 1;
        };
        this.writeMCU(img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock);
        mcuX = mcuX + 1;
        mcuCount = mcuCount + 1;
      };
      mcuY = mcuY + 1;
      if ( (mcuY % 10) == 0 ) {
        this.say((("  Row " + ((mcuY.toString()))) + "/") + ((this.mcusPerCol.toString())));
      }
    };
    this.say("Decode complete!");
    return img;
  };
  writeMCU (img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock) {
    const baseX = mcuX * this.mcuWidth;
    const baseY = mcuY * this.mcuHeight;
    const comp0 = this.components[0];
    if ( (this.maxHSamp == 1) && (this.maxVSamp == 1) ) {
      let py = 0;
      while (py < 8) {
        let px = 0;
        while (px < 8) {
          const imgX = baseX + px;
          const imgY = baseY + py;
          if ( (imgX < this.width) && (imgY < this.height) ) {
            const idx = (py * 8) + px;
            const y = yBlocksData[idx];
            let cb = 128;
            let cr = 128;
            if ( this.numComponents >= 3 ) {
              cb = cbBlock[idx];
              cr = crBlock[idx];
            }
            let r = y + (((359 * (cr - 128)) >> 8));
            let g = (y - (((88 * (cb - 128)) >> 8))) - (((183 * (cr - 128)) >> 8));
            let b = y + (((454 * (cb - 128)) >> 8));
            if ( r < 0 ) {
              r = 0;
            }
            if ( r > 255 ) {
              r = 255;
            }
            if ( g < 0 ) {
              g = 0;
            }
            if ( g > 255 ) {
              g = 255;
            }
            if ( b < 0 ) {
              b = 0;
            }
            if ( b > 255 ) {
              b = 255;
            }
            img.setPixelRGB(imgX, imgY, r, g, b);
          }
          px = px + 1;
        };
        py = py + 1;
      };
      return;
    }
    if ( (this.maxHSamp == 2) && (this.maxVSamp == 2) ) {
      let blockIdx = 0;
      let blockY = 0;
      while (blockY < 2) {
        let blockX = 0;
        while (blockX < 2) {
          const yBlockOffset = blockIdx * 64;
          let py_1 = 0;
          while (py_1 < 8) {
            let px_1 = 0;
            while (px_1 < 8) {
              const imgX_1 = (baseX + (blockX * 8)) + px_1;
              const imgY_1 = (baseY + (blockY * 8)) + py_1;
              if ( (imgX_1 < this.width) && (imgY_1 < this.height) ) {
                const yIdx = (yBlockOffset + (py_1 * 8)) + px_1;
                const y_1 = yBlocksData[yIdx];
                const chromaX = (blockX * 4) + ((px_1 >> 1));
                const chromaY = (blockY * 4) + ((py_1 >> 1));
                const chromaIdx = (chromaY * 8) + chromaX;
                let cb_1 = 128;
                let cr_1 = 128;
                if ( this.numComponents >= 3 ) {
                  cb_1 = cbBlock[chromaIdx];
                  cr_1 = crBlock[chromaIdx];
                }
                let r_1 = y_1 + (((359 * (cr_1 - 128)) >> 8));
                let g_1 = (y_1 - (((88 * (cb_1 - 128)) >> 8))) - (((183 * (cr_1 - 128)) >> 8));
                let b_1 = y_1 + (((454 * (cb_1 - 128)) >> 8));
                if ( r_1 < 0 ) {
                  r_1 = 0;
                }
                if ( r_1 > 255 ) {
                  r_1 = 255;
                }
                if ( g_1 < 0 ) {
                  g_1 = 0;
                }
                if ( g_1 > 255 ) {
                  g_1 = 255;
                }
                if ( b_1 < 0 ) {
                  b_1 = 0;
                }
                if ( b_1 > 255 ) {
                  b_1 = 255;
                }
                img.setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
              }
              px_1 = px_1 + 1;
            };
            py_1 = py_1 + 1;
          };
          blockIdx = blockIdx + 1;
          blockX = blockX + 1;
        };
        blockY = blockY + 1;
      };
      return;
    }
    if ( (this.maxHSamp == 2) && (this.maxVSamp == 1) ) {
      let blockX_1 = 0;
      while (blockX_1 < 2) {
        const yBlockOffset_1 = blockX_1 * 64;
        let py_2 = 0;
        while (py_2 < 8) {
          let px_2 = 0;
          while (px_2 < 8) {
            const imgX_2 = (baseX + (blockX_1 * 8)) + px_2;
            const imgY_2 = baseY + py_2;
            if ( (imgX_2 < this.width) && (imgY_2 < this.height) ) {
              const yIdx_1 = (yBlockOffset_1 + (py_2 * 8)) + px_2;
              const y_2 = yBlocksData[yIdx_1];
              const chromaX_1 = (blockX_1 * 4) + ((px_2 >> 1));
              const chromaY_1 = py_2;
              const chromaIdx_1 = (chromaY_1 * 8) + chromaX_1;
              let cb_2 = 128;
              let cr_2 = 128;
              if ( this.numComponents >= 3 ) {
                cb_2 = cbBlock[chromaIdx_1];
                cr_2 = crBlock[chromaIdx_1];
              }
              let r_2 = y_2 + (((359 * (cr_2 - 128)) >> 8));
              let g_2 = (y_2 - (((88 * (cb_2 - 128)) >> 8))) - (((183 * (cr_2 - 128)) >> 8));
              let b_2 = y_2 + (((454 * (cb_2 - 128)) >> 8));
              if ( r_2 < 0 ) {
                r_2 = 0;
              }
              if ( r_2 > 255 ) {
                r_2 = 255;
              }
              if ( g_2 < 0 ) {
                g_2 = 0;
              }
              if ( g_2 > 255 ) {
                g_2 = 255;
              }
              if ( b_2 < 0 ) {
                b_2 = 0;
              }
              if ( b_2 > 255 ) {
                b_2 = 255;
              }
              img.setPixelRGB(imgX_2, imgY_2, r_2, g_2, b_2);
            }
            px_2 = px_2 + 1;
          };
          py_2 = py_2 + 1;
        };
        blockX_1 = blockX_1 + 1;
      };
      return;
    }
    if ( yBlockCount > 0 ) {
      let py_3 = 0;
      while (py_3 < 8) {
        let px_3 = 0;
        while (px_3 < 8) {
          const imgX_3 = baseX + px_3;
          const imgY_3 = baseY + py_3;
          if ( (imgX_3 < this.width) && (imgY_3 < this.height) ) {
            const y_3 = yBlocksData[((py_3 * 8) + px_3)];
            img.setPixelRGB(imgX_3, imgY_3, y_3, y_3, y_3);
          }
          px_3 = px_3 + 1;
        };
        py_3 = py_3 + 1;
      };
    }
  };
}
class FDCT  {
  constructor() {
    this.cosTable = new Int32Array(64);
    this.zigzagOrder = new Int32Array(64);
    this.cosTable[0] = 1024;
    this.cosTable[1] = 1004;
    this.cosTable[2] = 946;
    this.cosTable[3] = 851;
    this.cosTable[4] = 724;
    this.cosTable[5] = 569;
    this.cosTable[6] = 392;
    this.cosTable[7] = 200;
    this.cosTable[8] = 1024;
    this.cosTable[9] = 851;
    this.cosTable[10] = 392;
    this.cosTable[11] = -200;
    this.cosTable[12] = -724;
    this.cosTable[13] = -1004;
    this.cosTable[14] = -946;
    this.cosTable[15] = -569;
    this.cosTable[16] = 1024;
    this.cosTable[17] = 569;
    this.cosTable[18] = -392;
    this.cosTable[19] = -1004;
    this.cosTable[20] = -724;
    this.cosTable[21] = 200;
    this.cosTable[22] = 946;
    this.cosTable[23] = 851;
    this.cosTable[24] = 1024;
    this.cosTable[25] = 200;
    this.cosTable[26] = -946;
    this.cosTable[27] = -569;
    this.cosTable[28] = 724;
    this.cosTable[29] = 851;
    this.cosTable[30] = -392;
    this.cosTable[31] = -1004;
    this.cosTable[32] = 1024;
    this.cosTable[33] = -200;
    this.cosTable[34] = -946;
    this.cosTable[35] = 569;
    this.cosTable[36] = 724;
    this.cosTable[37] = -851;
    this.cosTable[38] = -392;
    this.cosTable[39] = 1004;
    this.cosTable[40] = 1024;
    this.cosTable[41] = -569;
    this.cosTable[42] = -392;
    this.cosTable[43] = 1004;
    this.cosTable[44] = -724;
    this.cosTable[45] = -200;
    this.cosTable[46] = 946;
    this.cosTable[47] = -851;
    this.cosTable[48] = 1024;
    this.cosTable[49] = -851;
    this.cosTable[50] = 392;
    this.cosTable[51] = 200;
    this.cosTable[52] = -724;
    this.cosTable[53] = 1004;
    this.cosTable[54] = -946;
    this.cosTable[55] = 569;
    this.cosTable[56] = 1024;
    this.cosTable[57] = -1004;
    this.cosTable[58] = 946;
    this.cosTable[59] = -851;
    this.cosTable[60] = 724;
    this.cosTable[61] = -569;
    this.cosTable[62] = 392;
    this.cosTable[63] = -200;
    this.zigzagOrder[0] = 0;
    this.zigzagOrder[1] = 1;
    this.zigzagOrder[2] = 8;
    this.zigzagOrder[3] = 16;
    this.zigzagOrder[4] = 9;
    this.zigzagOrder[5] = 2;
    this.zigzagOrder[6] = 3;
    this.zigzagOrder[7] = 10;
    this.zigzagOrder[8] = 17;
    this.zigzagOrder[9] = 24;
    this.zigzagOrder[10] = 32;
    this.zigzagOrder[11] = 25;
    this.zigzagOrder[12] = 18;
    this.zigzagOrder[13] = 11;
    this.zigzagOrder[14] = 4;
    this.zigzagOrder[15] = 5;
    this.zigzagOrder[16] = 12;
    this.zigzagOrder[17] = 19;
    this.zigzagOrder[18] = 26;
    this.zigzagOrder[19] = 33;
    this.zigzagOrder[20] = 40;
    this.zigzagOrder[21] = 48;
    this.zigzagOrder[22] = 41;
    this.zigzagOrder[23] = 34;
    this.zigzagOrder[24] = 27;
    this.zigzagOrder[25] = 20;
    this.zigzagOrder[26] = 13;
    this.zigzagOrder[27] = 6;
    this.zigzagOrder[28] = 7;
    this.zigzagOrder[29] = 14;
    this.zigzagOrder[30] = 21;
    this.zigzagOrder[31] = 28;
    this.zigzagOrder[32] = 35;
    this.zigzagOrder[33] = 42;
    this.zigzagOrder[34] = 49;
    this.zigzagOrder[35] = 56;
    this.zigzagOrder[36] = 57;
    this.zigzagOrder[37] = 50;
    this.zigzagOrder[38] = 43;
    this.zigzagOrder[39] = 36;
    this.zigzagOrder[40] = 29;
    this.zigzagOrder[41] = 22;
    this.zigzagOrder[42] = 15;
    this.zigzagOrder[43] = 23;
    this.zigzagOrder[44] = 30;
    this.zigzagOrder[45] = 37;
    this.zigzagOrder[46] = 44;
    this.zigzagOrder[47] = 51;
    this.zigzagOrder[48] = 58;
    this.zigzagOrder[49] = 59;
    this.zigzagOrder[50] = 52;
    this.zigzagOrder[51] = 45;
    this.zigzagOrder[52] = 38;
    this.zigzagOrder[53] = 31;
    this.zigzagOrder[54] = 39;
    this.zigzagOrder[55] = 46;
    this.zigzagOrder[56] = 53;
    this.zigzagOrder[57] = 60;
    this.zigzagOrder[58] = 61;
    this.zigzagOrder[59] = 54;
    this.zigzagOrder[60] = 47;
    this.zigzagOrder[61] = 55;
    this.zigzagOrder[62] = 62;
    this.zigzagOrder[63] = 63;
  }
  dct1d (input, startIdx, stride, output, outIdx, outStride) {
    const s0 = (input[startIdx]) + (input[(startIdx + (7 * stride))]);
    const s1 = (input[(startIdx + stride)]) + (input[(startIdx + (6 * stride))]);
    const s2 = (input[(startIdx + (2 * stride))]) + (input[(startIdx + (5 * stride))]);
    const s3 = (input[(startIdx + (3 * stride))]) + (input[(startIdx + (4 * stride))]);
    const d0 = (input[startIdx]) - (input[(startIdx + (7 * stride))]);
    const d1 = (input[(startIdx + stride)]) - (input[(startIdx + (6 * stride))]);
    const d2 = (input[(startIdx + (2 * stride))]) - (input[(startIdx + (5 * stride))]);
    const d3 = (input[(startIdx + (3 * stride))]) - (input[(startIdx + (4 * stride))]);
    let u = 0;
    while (u < 8) {
      let e0 = s0;
      let e1 = s1;
      let e2 = s2;
      let e3 = s3;
      if ( ((u & 1)) == 1 ) {
        e0 = d0;
        e1 = d1;
        e2 = d2;
        e3 = d3;
      }
      let sum = ((e0 * (this.cosTable[u])) + (e1 * (this.cosTable[(8 + u)]))) + ((e2 * (this.cosTable[(16 + u)])) + (e3 * (this.cosTable[(24 + u)])));
      if ( u == 0 ) {
        sum = ((sum * 724) >> 10);
      }
      output[outIdx + (u * outStride)] = (sum >> 11);
      u = u + 1;
    };
  };
  transform (pixels) {
    let shifted = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      shifted[i] = (pixels[i]) - 128;
      i = i + 1;
    };
    const temp = new Int32Array(64);
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.dct1d(shifted, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    const coeffs = new Int32Array(64);
    let col = 0;
    while (col < 8) {
      this.dct1d(temp, col, 8, coeffs, col, 8);
      col = col + 1;
    };
    return coeffs;
  };
  zigzag (block) {
    let zigzagOut = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagOrder[i];
      zigzagOut[i] = block[pos];
      i = i + 1;
    };
    return zigzagOut;
  };
}
class BitWriter  {
  constructor() {
    this.buffer = new GrowableBuffer();
    this.bitBuffer = 0;
    this.bitCount = 0;
  }
  writeBit (bit) {
    this.bitBuffer = (this.bitBuffer << 1);
    this.bitBuffer = (this.bitBuffer | ((bit & 1)));
    this.bitCount = this.bitCount + 1;
    if ( this.bitCount == 8 ) {
      this.flushByte();
    }
  };
  writeBits (value, numBits) {
    let i = numBits - 1;
    while (i >= 0) {
      const bit = (((value >> i)) & 1);
      this.writeBit(bit);
      i = i - 1;
    };
  };
  flushByte () {
    if ( this.bitCount > 0 ) {
      while (this.bitCount < 8) {
        this.bitBuffer = (this.bitBuffer << 1);
        this.bitBuffer = (this.bitBuffer | 1);
        this.bitCount = this.bitCount + 1;
      };
      this.buffer.writeByte(this.bitBuffer);
      if ( this.bitBuffer == 255 ) {
        this.buffer.writeByte(0);
      }
      this.bitBuffer = 0;
      this.bitCount = 0;
    }
  };
  writeByte (b) {
    this.flushByte();
    this.buffer.writeByte(b);
  };
  writeWord (w) {
    this.writeByte((w >> 8));
    this.writeByte((w & 255));
  };
  getBuffer () {
    this.flushByte();
    return this.buffer.toBuffer();
  };
  getLength () {
    return (this.buffer).size();
  };
}
class JPEGEncoder  {
  constructor() {
    this.quality = 75;
    this.yQuantTable = [];
    this.cQuantTable = [];
    this.stdYQuant = [];
    this.stdCQuant = [];
    this.dcYBits = [];
    this.dcYValues = [];
    this.acYBits = [];
    this.acYValues = [];
    this.dcCBits = [];
    this.dcCValues = [];
    this.acCBits = [];
    this.acCValues = [];
    this.dcYCodes = [];
    this.dcYLengths = [];
    this.acYCodes = [];
    this.acYLengths = [];
    this.dcCCodes = [];
    this.dcCLengths = [];
    this.acCCodes = [];
    this.acCLengths = [];
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    this.fdct = new FDCT();
    this.initQuantTables();
    this.initHuffmanTables();
  }
  initQuantTables () {
    this.stdYQuant.push(16);
    this.stdYQuant.push(11);
    this.stdYQuant.push(10);
    this.stdYQuant.push(16);
    this.stdYQuant.push(24);
    this.stdYQuant.push(40);
    this.stdYQuant.push(51);
    this.stdYQuant.push(61);
    this.stdYQuant.push(12);
    this.stdYQuant.push(12);
    this.stdYQuant.push(14);
    this.stdYQuant.push(19);
    this.stdYQuant.push(26);
    this.stdYQuant.push(58);
    this.stdYQuant.push(60);
    this.stdYQuant.push(55);
    this.stdYQuant.push(14);
    this.stdYQuant.push(13);
    this.stdYQuant.push(16);
    this.stdYQuant.push(24);
    this.stdYQuant.push(40);
    this.stdYQuant.push(57);
    this.stdYQuant.push(69);
    this.stdYQuant.push(56);
    this.stdYQuant.push(14);
    this.stdYQuant.push(17);
    this.stdYQuant.push(22);
    this.stdYQuant.push(29);
    this.stdYQuant.push(51);
    this.stdYQuant.push(87);
    this.stdYQuant.push(80);
    this.stdYQuant.push(62);
    this.stdYQuant.push(18);
    this.stdYQuant.push(22);
    this.stdYQuant.push(37);
    this.stdYQuant.push(56);
    this.stdYQuant.push(68);
    this.stdYQuant.push(109);
    this.stdYQuant.push(103);
    this.stdYQuant.push(77);
    this.stdYQuant.push(24);
    this.stdYQuant.push(35);
    this.stdYQuant.push(55);
    this.stdYQuant.push(64);
    this.stdYQuant.push(81);
    this.stdYQuant.push(104);
    this.stdYQuant.push(113);
    this.stdYQuant.push(92);
    this.stdYQuant.push(49);
    this.stdYQuant.push(64);
    this.stdYQuant.push(78);
    this.stdYQuant.push(87);
    this.stdYQuant.push(103);
    this.stdYQuant.push(121);
    this.stdYQuant.push(120);
    this.stdYQuant.push(101);
    this.stdYQuant.push(72);
    this.stdYQuant.push(92);
    this.stdYQuant.push(95);
    this.stdYQuant.push(98);
    this.stdYQuant.push(112);
    this.stdYQuant.push(100);
    this.stdYQuant.push(103);
    this.stdYQuant.push(99);
    this.stdCQuant.push(17);
    this.stdCQuant.push(18);
    this.stdCQuant.push(24);
    this.stdCQuant.push(47);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(18);
    this.stdCQuant.push(21);
    this.stdCQuant.push(26);
    this.stdCQuant.push(66);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(24);
    this.stdCQuant.push(26);
    this.stdCQuant.push(56);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(47);
    this.stdCQuant.push(66);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.scaleQuantTables(this.quality);
  };
  scaleQuantTables (q) {
    let scale = 0;
    if ( q < 50 ) {
      scale = Math.floor( (5000 / q));
    } else {
      scale = 200 - (q * 2);
    }
    this.yQuantTable.length = 0;
    this.cQuantTable.length = 0;
    let i = 0;
    while (i < 64) {
      let yVal = Math.floor( ((((this.stdYQuant[i]) * scale) + 50) / 100));
      if ( yVal < 1 ) {
        yVal = 1;
      }
      if ( yVal > 255 ) {
        yVal = 255;
      }
      this.yQuantTable.push(yVal);
      let cVal = Math.floor( ((((this.stdCQuant[i]) * scale) + 50) / 100));
      if ( cVal < 1 ) {
        cVal = 1;
      }
      if ( cVal > 255 ) {
        cVal = 255;
      }
      this.cQuantTable.push(cVal);
      i = i + 1;
    };
  };
  initHuffmanTables () {
    this.dcYBits.push(0);
    this.dcYBits.push(1);
    this.dcYBits.push(5);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYValues.push(0);
    this.dcYValues.push(1);
    this.dcYValues.push(2);
    this.dcYValues.push(3);
    this.dcYValues.push(4);
    this.dcYValues.push(5);
    this.dcYValues.push(6);
    this.dcYValues.push(7);
    this.dcYValues.push(8);
    this.dcYValues.push(9);
    this.dcYValues.push(10);
    this.dcYValues.push(11);
    this.acYBits.push(0);
    this.acYBits.push(2);
    this.acYBits.push(1);
    this.acYBits.push(3);
    this.acYBits.push(3);
    this.acYBits.push(2);
    this.acYBits.push(4);
    this.acYBits.push(3);
    this.acYBits.push(5);
    this.acYBits.push(5);
    this.acYBits.push(4);
    this.acYBits.push(4);
    this.acYBits.push(0);
    this.acYBits.push(0);
    this.acYBits.push(1);
    this.acYBits.push(125);
    this.acYValues.push(1);
    this.acYValues.push(2);
    this.acYValues.push(3);
    this.acYValues.push(0);
    this.acYValues.push(4);
    this.acYValues.push(17);
    this.acYValues.push(5);
    this.acYValues.push(18);
    this.acYValues.push(33);
    this.acYValues.push(49);
    this.acYValues.push(65);
    this.acYValues.push(6);
    this.acYValues.push(19);
    this.acYValues.push(81);
    this.acYValues.push(97);
    this.acYValues.push(7);
    this.acYValues.push(34);
    this.acYValues.push(113);
    this.acYValues.push(20);
    this.acYValues.push(50);
    this.acYValues.push(129);
    this.acYValues.push(145);
    this.acYValues.push(161);
    this.acYValues.push(8);
    this.acYValues.push(35);
    this.acYValues.push(66);
    this.acYValues.push(177);
    this.acYValues.push(193);
    this.acYValues.push(21);
    this.acYValues.push(82);
    this.acYValues.push(209);
    this.acYValues.push(240);
    this.acYValues.push(36);
    this.acYValues.push(51);
    this.acYValues.push(98);
    this.acYValues.push(114);
    this.acYValues.push(130);
    this.acYValues.push(9);
    this.acYValues.push(10);
    this.acYValues.push(22);
    this.acYValues.push(23);
    this.acYValues.push(24);
    this.acYValues.push(25);
    this.acYValues.push(26);
    this.acYValues.push(37);
    this.acYValues.push(38);
    this.acYValues.push(39);
    this.acYValues.push(40);
    this.acYValues.push(41);
    this.acYValues.push(42);
    this.acYValues.push(52);
    this.acYValues.push(53);
    this.acYValues.push(54);
    this.acYValues.push(55);
    this.acYValues.push(56);
    this.acYValues.push(57);
    this.acYValues.push(58);
    this.acYValues.push(67);
    this.acYValues.push(68);
    this.acYValues.push(69);
    this.acYValues.push(70);
    this.acYValues.push(71);
    this.acYValues.push(72);
    this.acYValues.push(73);
    this.acYValues.push(74);
    this.acYValues.push(83);
    this.acYValues.push(84);
    this.acYValues.push(85);
    this.acYValues.push(86);
    this.acYValues.push(87);
    this.acYValues.push(88);
    this.acYValues.push(89);
    this.acYValues.push(90);
    this.acYValues.push(99);
    this.acYValues.push(100);
    this.acYValues.push(101);
    this.acYValues.push(102);
    this.acYValues.push(103);
    this.acYValues.push(104);
    this.acYValues.push(105);
    this.acYValues.push(106);
    this.acYValues.push(115);
    this.acYValues.push(116);
    this.acYValues.push(117);
    this.acYValues.push(118);
    this.acYValues.push(119);
    this.acYValues.push(120);
    this.acYValues.push(121);
    this.acYValues.push(122);
    this.acYValues.push(131);
    this.acYValues.push(132);
    this.acYValues.push(133);
    this.acYValues.push(134);
    this.acYValues.push(135);
    this.acYValues.push(136);
    this.acYValues.push(137);
    this.acYValues.push(138);
    this.acYValues.push(146);
    this.acYValues.push(147);
    this.acYValues.push(148);
    this.acYValues.push(149);
    this.acYValues.push(150);
    this.acYValues.push(151);
    this.acYValues.push(152);
    this.acYValues.push(153);
    this.acYValues.push(154);
    this.acYValues.push(162);
    this.acYValues.push(163);
    this.acYValues.push(164);
    this.acYValues.push(165);
    this.acYValues.push(166);
    this.acYValues.push(167);
    this.acYValues.push(168);
    this.acYValues.push(169);
    this.acYValues.push(170);
    this.acYValues.push(178);
    this.acYValues.push(179);
    this.acYValues.push(180);
    this.acYValues.push(181);
    this.acYValues.push(182);
    this.acYValues.push(183);
    this.acYValues.push(184);
    this.acYValues.push(185);
    this.acYValues.push(186);
    this.acYValues.push(194);
    this.acYValues.push(195);
    this.acYValues.push(196);
    this.acYValues.push(197);
    this.acYValues.push(198);
    this.acYValues.push(199);
    this.acYValues.push(200);
    this.acYValues.push(201);
    this.acYValues.push(202);
    this.acYValues.push(210);
    this.acYValues.push(211);
    this.acYValues.push(212);
    this.acYValues.push(213);
    this.acYValues.push(214);
    this.acYValues.push(215);
    this.acYValues.push(216);
    this.acYValues.push(217);
    this.acYValues.push(218);
    this.acYValues.push(225);
    this.acYValues.push(226);
    this.acYValues.push(227);
    this.acYValues.push(228);
    this.acYValues.push(229);
    this.acYValues.push(230);
    this.acYValues.push(231);
    this.acYValues.push(232);
    this.acYValues.push(233);
    this.acYValues.push(234);
    this.acYValues.push(241);
    this.acYValues.push(242);
    this.acYValues.push(243);
    this.acYValues.push(244);
    this.acYValues.push(245);
    this.acYValues.push(246);
    this.acYValues.push(247);
    this.acYValues.push(248);
    this.acYValues.push(249);
    this.acYValues.push(250);
    this.dcCBits.push(0);
    this.dcCBits.push(3);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCValues.push(0);
    this.dcCValues.push(1);
    this.dcCValues.push(2);
    this.dcCValues.push(3);
    this.dcCValues.push(4);
    this.dcCValues.push(5);
    this.dcCValues.push(6);
    this.dcCValues.push(7);
    this.dcCValues.push(8);
    this.dcCValues.push(9);
    this.dcCValues.push(10);
    this.dcCValues.push(11);
    this.acCBits.push(0);
    this.acCBits.push(2);
    this.acCBits.push(1);
    this.acCBits.push(2);
    this.acCBits.push(4);
    this.acCBits.push(4);
    this.acCBits.push(3);
    this.acCBits.push(4);
    this.acCBits.push(7);
    this.acCBits.push(5);
    this.acCBits.push(4);
    this.acCBits.push(4);
    this.acCBits.push(0);
    this.acCBits.push(1);
    this.acCBits.push(2);
    this.acCBits.push(119);
    this.acCValues.push(0);
    this.acCValues.push(1);
    this.acCValues.push(2);
    this.acCValues.push(3);
    this.acCValues.push(17);
    this.acCValues.push(4);
    this.acCValues.push(5);
    this.acCValues.push(33);
    this.acCValues.push(49);
    this.acCValues.push(6);
    this.acCValues.push(18);
    this.acCValues.push(65);
    this.acCValues.push(81);
    this.acCValues.push(7);
    this.acCValues.push(97);
    this.acCValues.push(113);
    this.acCValues.push(19);
    this.acCValues.push(34);
    this.acCValues.push(50);
    this.acCValues.push(129);
    this.acCValues.push(8);
    this.acCValues.push(20);
    this.acCValues.push(66);
    this.acCValues.push(145);
    this.acCValues.push(161);
    this.acCValues.push(177);
    this.acCValues.push(193);
    this.acCValues.push(9);
    this.acCValues.push(35);
    this.acCValues.push(51);
    this.acCValues.push(82);
    this.acCValues.push(240);
    this.acCValues.push(21);
    this.acCValues.push(98);
    this.acCValues.push(114);
    this.acCValues.push(209);
    this.acCValues.push(10);
    this.acCValues.push(22);
    this.acCValues.push(36);
    this.acCValues.push(52);
    this.acCValues.push(225);
    this.acCValues.push(37);
    this.acCValues.push(241);
    this.acCValues.push(23);
    this.acCValues.push(24);
    this.acCValues.push(25);
    this.acCValues.push(26);
    this.acCValues.push(38);
    this.acCValues.push(39);
    this.acCValues.push(40);
    this.acCValues.push(41);
    this.acCValues.push(42);
    this.acCValues.push(53);
    this.acCValues.push(54);
    this.acCValues.push(55);
    this.acCValues.push(56);
    this.acCValues.push(57);
    this.acCValues.push(58);
    this.acCValues.push(67);
    this.acCValues.push(68);
    this.acCValues.push(69);
    this.acCValues.push(70);
    this.acCValues.push(71);
    this.acCValues.push(72);
    this.acCValues.push(73);
    this.acCValues.push(74);
    this.acCValues.push(83);
    this.acCValues.push(84);
    this.acCValues.push(85);
    this.acCValues.push(86);
    this.acCValues.push(87);
    this.acCValues.push(88);
    this.acCValues.push(89);
    this.acCValues.push(90);
    this.acCValues.push(99);
    this.acCValues.push(100);
    this.acCValues.push(101);
    this.acCValues.push(102);
    this.acCValues.push(103);
    this.acCValues.push(104);
    this.acCValues.push(105);
    this.acCValues.push(106);
    this.acCValues.push(115);
    this.acCValues.push(116);
    this.acCValues.push(117);
    this.acCValues.push(118);
    this.acCValues.push(119);
    this.acCValues.push(120);
    this.acCValues.push(121);
    this.acCValues.push(122);
    this.acCValues.push(130);
    this.acCValues.push(131);
    this.acCValues.push(132);
    this.acCValues.push(133);
    this.acCValues.push(134);
    this.acCValues.push(135);
    this.acCValues.push(136);
    this.acCValues.push(137);
    this.acCValues.push(138);
    this.acCValues.push(146);
    this.acCValues.push(147);
    this.acCValues.push(148);
    this.acCValues.push(149);
    this.acCValues.push(150);
    this.acCValues.push(151);
    this.acCValues.push(152);
    this.acCValues.push(153);
    this.acCValues.push(154);
    this.acCValues.push(162);
    this.acCValues.push(163);
    this.acCValues.push(164);
    this.acCValues.push(165);
    this.acCValues.push(166);
    this.acCValues.push(167);
    this.acCValues.push(168);
    this.acCValues.push(169);
    this.acCValues.push(170);
    this.acCValues.push(178);
    this.acCValues.push(179);
    this.acCValues.push(180);
    this.acCValues.push(181);
    this.acCValues.push(182);
    this.acCValues.push(183);
    this.acCValues.push(184);
    this.acCValues.push(185);
    this.acCValues.push(186);
    this.acCValues.push(194);
    this.acCValues.push(195);
    this.acCValues.push(196);
    this.acCValues.push(197);
    this.acCValues.push(198);
    this.acCValues.push(199);
    this.acCValues.push(200);
    this.acCValues.push(201);
    this.acCValues.push(202);
    this.acCValues.push(210);
    this.acCValues.push(211);
    this.acCValues.push(212);
    this.acCValues.push(213);
    this.acCValues.push(214);
    this.acCValues.push(215);
    this.acCValues.push(216);
    this.acCValues.push(217);
    this.acCValues.push(218);
    this.acCValues.push(226);
    this.acCValues.push(227);
    this.acCValues.push(228);
    this.acCValues.push(229);
    this.acCValues.push(230);
    this.acCValues.push(231);
    this.acCValues.push(232);
    this.acCValues.push(233);
    this.acCValues.push(234);
    this.acCValues.push(242);
    this.acCValues.push(243);
    this.acCValues.push(244);
    this.acCValues.push(245);
    this.acCValues.push(246);
    this.acCValues.push(247);
    this.acCValues.push(248);
    this.acCValues.push(249);
    this.acCValues.push(250);
    let i = 0;
    while (i < 256) {
      this.dcYCodes.push(0);
      this.dcYLengths.push(0);
      this.acYCodes.push(0);
      this.acYLengths.push(0);
      this.dcCCodes.push(0);
      this.dcCLengths.push(0);
      this.acCCodes.push(0);
      this.acCLengths.push(0);
      i = i + 1;
    };
    this.buildHuffmanCodes(this.dcYBits, this.dcYValues, this.dcYCodes, this.dcYLengths);
    this.buildHuffmanCodes(this.acYBits, this.acYValues, this.acYCodes, this.acYLengths);
    this.buildHuffmanCodes(this.dcCBits, this.dcCValues, this.dcCCodes, this.dcCLengths);
    this.buildHuffmanCodes(this.acCBits, this.acCValues, this.acCCodes, this.acCLengths);
  };
  buildHuffmanCodes (bits, values, codes, lengths) {
    let code = 0;
    let valueIdx = 0;
    let bitLen = 1;
    while (bitLen <= 16) {
      const count = bits[(bitLen - 1)];
      let j = 0;
      while (j < count) {
        const symbol = values[valueIdx];
        codes[symbol] = code;
        lengths[symbol] = bitLen;
        code = code + 1;
        valueIdx = valueIdx + 1;
        j = j + 1;
      };
      code = (code << 1);
      bitLen = bitLen + 1;
    };
  };
  getCategory (value) {
    if ( value < 0 ) {
      value = 0 - value;
    }
    if ( value == 0 ) {
      return 0;
    }
    let cat = 0;
    while (value > 0) {
      cat = cat + 1;
      value = (value >> 1);
    };
    return cat;
  };
  encodeNumber (value, category) {
    if ( value < 0 ) {
      return value + (((1 << category)) - 1);
    }
    return value;
  };
  encodeBlock (writer, coeffs, quantTable, dcCodes, dcLengths, acCodes, acLengths, prevDC) {
    let quantized = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const q = quantTable[i];
      const c = coeffs[i];
      let qVal = 0;
      if ( c >= 0 ) {
        qVal = Math.floor( ((c + ((q >> 1))) / q));
      } else {
        qVal = 0 - (Math.floor( (((0 - c) + ((q >> 1))) / q)));
      }
      quantized[i] = qVal;
      i = i + 1;
    };
    const zigzagged = this.fdct.zigzag(quantized);
    const dc = zigzagged[0];
    const dcDiff = dc - prevDC;
    const dcCat = this.getCategory(dcDiff);
    const dcCode = dcCodes[dcCat];
    const dcLen = dcLengths[dcCat];
    writer.writeBits(dcCode, dcLen);
    if ( dcCat > 0 ) {
      const dcVal = this.encodeNumber(dcDiff, dcCat);
      writer.writeBits(dcVal, dcCat);
    }
    let zeroRun = 0;
    let k = 1;
    while (k < 64) {
      const ac = zigzagged[k];
      if ( ac == 0 ) {
        zeroRun = zeroRun + 1;
      } else {
        while (zeroRun >= 16) {
          const zrlCode = acCodes[240];
          const zrlLen = acLengths[240];
          writer.writeBits(zrlCode, zrlLen);
          zeroRun = zeroRun - 16;
        };
        const acCat = this.getCategory(ac);
        const runCat = (((zeroRun << 4)) | acCat);
        const acHuffCode = acCodes[runCat];
        const acHuffLen = acLengths[runCat];
        writer.writeBits(acHuffCode, acHuffLen);
        const acVal = this.encodeNumber(ac, acCat);
        writer.writeBits(acVal, acCat);
        zeroRun = 0;
      }
      k = k + 1;
    };
    if ( zeroRun > 0 ) {
      const eobCode = acCodes[0];
      const eobLen = acLengths[0];
      writer.writeBits(eobCode, eobLen);
    }
  };
  rgbToYCbCr (r, g, b, yOut, cbOut, crOut) {
    let y = ((((77 * r) + (150 * g)) + (29 * b)) >> 8);
    let cb = (((((0 - (43 * r)) - (85 * g)) + (128 * b)) >> 8)) + 128;
    let cr = (((((128 * r) - (107 * g)) - (21 * b)) >> 8)) + 128;
    if ( y < 0 ) {
      y = 0;
    }
    if ( y > 255 ) {
      y = 255;
    }
    if ( cb < 0 ) {
      cb = 0;
    }
    if ( cb > 255 ) {
      cb = 255;
    }
    if ( cr < 0 ) {
      cr = 0;
    }
    if ( cr > 255 ) {
      cr = 255;
    }
    yOut.push(y);
    cbOut.push(cb);
    crOut.push(cr);
  };
  extractBlock (img, blockX, blockY, channel) {
    let output = new Int32Array(64);
    let idx = 0;
    let py = 0;
    while (py < 8) {
      let px = 0;
      while (px < 8) {
        let imgX = blockX + px;
        let imgY = blockY + py;
        if ( imgX >= img.width ) {
          imgX = img.width - 1;
        }
        if ( imgY >= img.height ) {
          imgY = img.height - 1;
        }
        const off = ((imgY * img.width) + imgX) * 4;
        const cr0 = img.pixels._view.getUint8(off);
        const cg0 = img.pixels._view.getUint8((off + 1));
        const cb0 = img.pixels._view.getUint8((off + 2));
        if ( channel == 0 ) {
          output[idx] = ((((77 * cr0) + (150 * cg0)) + (29 * cb0)) >> 8);
        }
        if ( channel == 1 ) {
          output[idx] = (((((0 - (43 * cr0)) - (85 * cg0)) + (128 * cb0)) >> 8)) + 128;
        }
        if ( channel == 2 ) {
          output[idx] = (((((128 * cr0) - (107 * cg0)) - (21 * cb0)) >> 8)) + 128;
        }
        idx = idx + 1;
        px = px + 1;
      };
      py = py + 1;
    };
    return output;
  };
  writeMarkers (writer, width, height) {
    writer.writeByte(255);
    writer.writeByte(216);
    writer.writeByte(255);
    writer.writeByte(224);
    writer.writeWord(16);
    writer.writeByte(74);
    writer.writeByte(70);
    writer.writeByte(73);
    writer.writeByte(70);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeWord(1);
    writer.writeWord(1);
    writer.writeByte(0);
    writer.writeByte(0);
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(0);
    let i = 0;
    while (i < 64) {
      writer.writeByte(this.yQuantTable[(this.fdct.zigzagOrder[i])]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(1);
    i = 0;
    while (i < 64) {
      writer.writeByte(this.cQuantTable[(this.fdct.zigzagOrder[i])]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(192);
    writer.writeWord(17);
    writer.writeByte(8);
    writer.writeWord(height);
    writer.writeWord(width);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(0);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.dcYBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 12) {
      writer.writeByte(this.dcYValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(16);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.acYBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 162) {
      writer.writeByte(this.acYValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(1);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.dcCBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 12) {
      writer.writeByte(this.dcCValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(17);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.acCBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 162) {
      writer.writeByte(this.acCValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(218);
    writer.writeWord(12);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(63);
    writer.writeByte(0);
  };
  encodeToBuffer (img) {
    const writer = new BitWriter();
    this.writeMarkers(writer, img.width, img.height);
    const mcuWidth = Math.floor( ((img.width + 7) / 8));
    const mcuHeight = Math.floor( ((img.height + 7) / 8));
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    let mcuY = 0;
    while (mcuY < mcuHeight) {
      let mcuX = 0;
      while (mcuX < mcuWidth) {
        const blockX = mcuX * 8;
        const blockY = mcuY * 8;
        const yBlock = this.extractBlock(img, blockX, blockY, 0);
        const yCoeffs = this.fdct.transform(yBlock);
        this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
        const yZig = this.fdct.zigzag(yCoeffs);
        const yQ = this.yQuantTable[0];
        const yDC = yZig[0];
        if ( yDC >= 0 ) {
          this.prevDCY = Math.floor( ((yDC + ((yQ >> 1))) / yQ));
        } else {
          this.prevDCY = 0 - (Math.floor( (((0 - yDC) + ((yQ >> 1))) / yQ)));
        }
        const cbBlock = this.extractBlock(img, blockX, blockY, 1);
        const cbCoeffs = this.fdct.transform(cbBlock);
        this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
        const cbZig = this.fdct.zigzag(cbCoeffs);
        const cbQ = this.cQuantTable[0];
        const cbDC = cbZig[0];
        if ( cbDC >= 0 ) {
          this.prevDCCb = Math.floor( ((cbDC + ((cbQ >> 1))) / cbQ));
        } else {
          this.prevDCCb = 0 - (Math.floor( (((0 - cbDC) + ((cbQ >> 1))) / cbQ)));
        }
        const crBlock = this.extractBlock(img, blockX, blockY, 2);
        const crCoeffs = this.fdct.transform(crBlock);
        this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
        const crZig = this.fdct.zigzag(crCoeffs);
        const crQ = this.cQuantTable[0];
        const crDC = crZig[0];
        if ( crDC >= 0 ) {
          this.prevDCCr = Math.floor( ((crDC + ((crQ >> 1))) / crQ));
        } else {
          this.prevDCCr = 0 - (Math.floor( (((0 - crDC) + ((crQ >> 1))) / crQ)));
        }
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    writer.flushByte();
    const outBuf = writer.getBuffer();
    const outLen = writer.getLength();
    let finalBuf = (function(){ var b = new ArrayBuffer((outLen + 2)); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < outLen) {
      finalBuf._view.setUint8(i, outBuf._view.getUint8(i));
      i = i + 1;
    };
    finalBuf._view.setUint8(outLen, 255);
    finalBuf._view.setUint8(outLen + 1, 217);
    return finalBuf;
  };
  encode (img, dirPath, fileName) {
    console.log("Encoding JPEG: " + fileName);
    console.log((("  Image size: " + ((img.width.toString()))) + "x") + ((img.height.toString())));
    const writer = new BitWriter();
    this.writeMarkers(writer, img.width, img.height);
    const mcuWidth = Math.floor( ((img.width + 7) / 8));
    const mcuHeight = Math.floor( ((img.height + 7) / 8));
    console.log((("  MCU grid: " + ((mcuWidth.toString()))) + "x") + ((mcuHeight.toString())));
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    let mcuY = 0;
    while (mcuY < mcuHeight) {
      let mcuX = 0;
      while (mcuX < mcuWidth) {
        const blockX = mcuX * 8;
        const blockY = mcuY * 8;
        const yBlock = this.extractBlock(img, blockX, blockY, 0);
        const yCoeffs = this.fdct.transform(yBlock);
        this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
        const yZig = this.fdct.zigzag(yCoeffs);
        const yQ = this.yQuantTable[0];
        const yDC = yZig[0];
        if ( yDC >= 0 ) {
          this.prevDCY = Math.floor( ((yDC + ((yQ >> 1))) / yQ));
        } else {
          this.prevDCY = 0 - (Math.floor( (((0 - yDC) + ((yQ >> 1))) / yQ)));
        }
        const cbBlock = this.extractBlock(img, blockX, blockY, 1);
        const cbCoeffs = this.fdct.transform(cbBlock);
        this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
        const cbZig = this.fdct.zigzag(cbCoeffs);
        const cbQ = this.cQuantTable[0];
        const cbDC = cbZig[0];
        if ( cbDC >= 0 ) {
          this.prevDCCb = Math.floor( ((cbDC + ((cbQ >> 1))) / cbQ));
        } else {
          this.prevDCCb = 0 - (Math.floor( (((0 - cbDC) + ((cbQ >> 1))) / cbQ)));
        }
        const crBlock = this.extractBlock(img, blockX, blockY, 2);
        const crCoeffs = this.fdct.transform(crBlock);
        this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
        const crZig = this.fdct.zigzag(crCoeffs);
        const crQ = this.cQuantTable[0];
        const crDC = crZig[0];
        if ( crDC >= 0 ) {
          this.prevDCCr = Math.floor( ((crDC + ((crQ >> 1))) / crQ));
        } else {
          this.prevDCCr = 0 - (Math.floor( (((0 - crDC) + ((crQ >> 1))) / crQ)));
        }
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    writer.flushByte();
    const outBuf = writer.getBuffer();
    const outLen = writer.getLength();
    let finalBuf = (function(){ var b = new ArrayBuffer((outLen + 2)); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < outLen) {
      finalBuf._view.setUint8(i, outBuf._view.getUint8(i));
      i = i + 1;
    };
    finalBuf._view.setUint8(outLen, 255);
    finalBuf._view.setUint8(outLen + 1, 217);
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(finalBuf));
    console.log(("  Encoded size: " + (((outLen + 2).toString()))) + " bytes");
    console.log((("  Saved: " + dirPath) + "/") + fileName);
  };
  setQuality (q) {
    this.quality = q;
    this.scaleQuantTables(q);
  };
}
class EmbeddedFont  {
  constructor(n, pn, font) {
    this.name = "";
    this.fontObjNum = 0;     /** note: unused */
    this.fontDescObjNum = 0;     /** note: unused */
    this.fontFileObjNum = 0;     /** note: unused */
    this.pdfName = "";
    this.name = n;
    this.pdfName = pn;
    this.ttfFont = font;
  }
}
class EmbeddedImage  {
  constructor(s) {
    this.src = "";
    this.objNum = 0;
    this.width = 0;
    this.height = 0;
    this.orientation = 1;
    this.pdfName = "";
    this.src = s;
  }
}
class PDFImageMeasurer  extends EVGImageMeasurer {
  constructor() {
    super()
  }
  setRenderer (r) {
    this.renderer = r;
  };
  getImageDimensions (src) {
    if ( (typeof(this.renderer) !== "undefined" && this.renderer != null )  ) {
      return ((this.renderer)).loadImageDimensions(src);
    }
    const dims = new EVGImageDimensions();
    return dims;
  };
}
class PDFTextSegment  {
  constructor() {
    this.text = "";
    this.family = "";
    this.isCid = false;
    this.x = 0.0;
  }
}
class EVGPDFRenderer  {
  constructor() {
    this.bleed = 0.0;
    this.colorMode = "rgb";
    this.alphaFills = [];
    this.alphaStrokes = [];
    this.pdfxProfile = "";
    this.outputIntent = "FOGRA39";
    this.outputIntentInfo = "Coated FOGRA39 (ISO 12647-2:2004)";
    this.docTitle = "";
    this.docAuthor = "";
    this.producer = "Ranger EVG PDF writer";
    this.rgbImages = 0;
    this.unsupportedGlyphs = [];
    this.unsupportedContexts = [];
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.nextObjNum = 1;
    this.fontObjNum = 0;     /** note: unused */
    this.pagesObjNum = 0;
    this.contentObjNums = [];
    this.pageCount = 1;     /** note: unused */
    this.debug = false;
    this.fontManager = new FontManager();
    this.embeddedFonts = [];
    this.usedFontNames = [];
    this.usedCidFonts = [];
    this.cidFontObjNums = [];
    this.cidUsedFont = [];
    this.cidUsedGid = [];
    this.cidUsedText = [];
    this.embeddedImages = [];
    this.jpegReader = new JPEGReader();     /** note: unused */
    this.jpegDecoder = new JPEGDecoder();
    this.jpegEncoder = new JPEGEncoder();
    this.metadataParser = new JPEGMetadataParser();
    this.suppliedImages = {};
    this.fontFileByFace = {};
    this.baseDir = "./";
    this.assetPaths = [];
    this.maxImageWidth = 800;
    this.maxImageHeight = 800;
    this.jpegQuality = 75;
    this.imageDimensionsCache = [];
    this.imageDimensionsCacheKeys = [];
    this.foundSections = [];
    this.foundPages = [];
    const w_1 = new PDFWriter();
    this.writer = w_1;
    const lay = new EVGLayout();
    this.layout = lay;
    const m_3 = new SimpleTextMeasurer();
    this.measurer = m_3;
    const buf_1 = new GrowableBuffer();
    this.streamBuffer = buf_1;
    let ef = [];
    this.embeddedFonts = ef;
    let uf = [];
    this.usedFontNames = uf;
    let ei = [];
    this.embeddedImages = ei;
    let idc = [];
    this.imageDimensionsCache = idc;
    let idck = [];
    this.imageDimensionsCacheKeys = idck;
    let ap = [];
    this.assetPaths = ap;
    let fs = [];
    this.foundSections = fs;
    let fp = [];
    this.foundPages = fp;
    const imgMeasurer = new PDFImageMeasurer();
    this.imageMeasurer = imgMeasurer;
  }
  writeStream (pdf, body, extra) {
    const packed = PdfFlate.zlib(body);
    const raw = body.byteLength;
    if ( PdfFlate.worthIt(body, packed) ) {
      pdf.writeString(((("<< /Length " + (((packed.byteLength).toString()))) + " /Filter /FlateDecode") + extra) + " >>\n");
      pdf.writeString("stream\n");
      pdf.writeBuffer(packed);
    } else {
      pdf.writeString((("<< /Length " + ((raw.toString()))) + extra) + " >>\n");
      pdf.writeString("stream\n");
      pdf.writeBuffer(body);
    }
    pdf.writeString("\nendstream\n");
    pdf.writeString("endobj\n\n");
  };
  registerImage (src, pixels) {
    this.suppliedImages[src] = pixels;
  };
  suppliedImage (src) {
    const hit = ( Object.prototype.hasOwnProperty.call(this.suppliedImages, src) ? this.suppliedImages[src] : undefined );
    return hit;
  };
  init (selfRc) {
    const imgM = this.imageMeasurer;
    imgM.setRenderer(selfRc);
    this.layout.setImageMeasurer(imgM);
  };
  setPageSize (width, height) {
    this.pageWidth = width;
    this.pageHeight = height;
    this.layout.setPageSize(width, height);
  };
  setBaseDir (dir) {
    this.baseDir = dir;
  };
  setAssetPaths (paths) {
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
          this.assetPaths.push(part);
          console.log("EVGPDFRenderer: Added asset path: " + part);
        }
        start = i + 1;
      }
      i = i + 1;
    };
  };
  resolveImagePath (src) {
    let imgSrc = src;
    if ( (src.length) > 2 ) {
      const prefix = src.substring(0, 2 );
      if ( prefix == "./" ) {
        imgSrc = src.substring(2, (src.length) );
      }
    }
    const fullPath = this.baseDir + imgSrc;
    return fullPath;
  };
  setStrictFonts (s) {
    this.layout.setStrictFonts(s);
  };
  getLayout () {
    return this.layout;
  };
  getTextEngine () {
    return this.layout.getTextEngine();
  };
  setMeasurer (m) {
    this.measurer = m;
    this.layout.setMeasurer(m);
  };
  setFontManager (fm) {
    this.fontManager = fm;
  };
  setDebug (enabled) {
    this.layout.debug = enabled;
    this.debug = enabled;
  };
  loadImageDimensions (src) {
    let i = 0;
    while (i < (this.imageDimensionsCacheKeys.length)) {
      const key = this.imageDimensionsCacheKeys[i];
      if ( key == src ) {
        return this.imageDimensionsCache[i];
      }
      i = i + 1;
    };
    const suppliedDims = this.suppliedImage(src);
    if ( (typeof(suppliedDims) !== "undefined" && suppliedDims != null )  ) {
      const sp = suppliedDims;
      const known = EVGImageDimensions.create(sp.width, sp.height);
      this.imageDimensionsCacheKeys.push(src);
      this.imageDimensionsCache.push(known);
      return known;
    }
    let dims = new EVGImageDimensions();
    let imgDir = "";
    let imgFile = "";
    let imgSrc = src;
    if ( (src.length) > 2 ) {
      const prefix = src.substring(0, 2 );
      if ( prefix == "./" ) {
        imgSrc = src.substring(2, (src.length) );
      }
    }
    const lastSlash = imgSrc.lastIndexOf("/");
    const lastBackslash = imgSrc.lastIndexOf("\\");
    let lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      imgDir = this.baseDir + (imgSrc.substring(0, (lastSep + 1) ));
      imgFile = imgSrc.substring((lastSep + 1), (imgSrc.length) );
    } else {
      imgDir = this.baseDir;
      imgFile = imgSrc;
    }
    const reader = new JPEGReader();
    let jpegImage = reader.readJPEG(imgDir, imgFile);
    if ( jpegImage.isValid == false ) {
      let altDirPath = "";
      if ( (src.indexOf("./")) == 0 ) {
        altDirPath = (this.baseDir + "assets/") + (src.substring(2, (src.length) ));
      } else {
        altDirPath = (this.baseDir + "assets/") + src;
      }
      const altLastSlash = altDirPath.lastIndexOf("/");
      if ( altLastSlash >= 0 ) {
        imgDir = altDirPath.substring(0, (altLastSlash + 1) );
        imgFile = altDirPath.substring((altLastSlash + 1), (altDirPath.length) );
      }
      console.log((("  Trying alternative: dir=" + imgDir) + " file=") + imgFile);
      jpegImage = reader.readJPEG(imgDir, imgFile);
    }
    if ( jpegImage.isValid ) {
      const metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
      const orientation = metaInfo.orientation;
      let imgW = jpegImage.width;
      let imgH = jpegImage.height;
      if ( (((orientation == 5) || (orientation == 6)) || (orientation == 7)) || (orientation == 8) ) {
        const tmp = imgW;
        imgW = imgH;
        imgH = tmp;
      }
      dims = EVGImageDimensions.create(imgW, imgH);
      console.log(((((((("Image dimensions: " + src) + " = ") + ((imgW.toString()))) + "x") + ((imgH.toString()))) + " (orientation=") + ((orientation.toString()))) + ")");
    }
    this.imageDimensionsCacheKeys.push(src);
    this.imageDimensionsCache.push(dims);
    return dims;
  };
  getPdfFontName (fontFamily) {
    let i = 0;
    while (i < (this.usedFontNames.length)) {
      const name = this.usedFontNames[i];
      if ( name == fontFamily ) {
        return "/F" + (((i + 1).toString()));
      }
      i = i + 1;
    };
    this.usedFontNames.push(fontFamily);
    return "/F" + (((this.usedFontNames.length).toString()));
  };
  getCidFontName (fontFamily) {
    return "/E" + (((this.cidFontIndex(fontFamily) + 1).toString()));
  };
  cidFontIndex (fontFamily) {
    let i = 0;
    while (i < (this.usedCidFonts.length)) {
      if ( (this.usedCidFonts[i]) == fontFamily ) {
        return i;
      }
      i = i + 1;
    };
    this.usedCidFonts.push(fontFamily);
    return (this.usedCidFonts.length) - 1;
  };
  noteCidGlyphCluster (fontIdx, gid, cps, start, end) {
    let i = 0;
    while (i < (this.cidUsedGid.length)) {
      if ( (this.cidUsedFont[i]) == fontIdx ) {
        if ( (this.cidUsedGid[i]) == gid ) {
          return;
        }
      }
      i = i + 1;
    };
    let text = "";
    let c = start;
    while (c < end) {
      text = text + EVGCodepoint.toStr((cps[c]));
      c = c + 1;
    };
    this.cidUsedFont.push(fontIdx);
    this.cidUsedGid.push(gid);
    this.cidUsedText.push(text);
  };
  splitLine (line, fontFamily, fontSize, startX) {
    let segs = [];
    const primary = this.fontManager.getFont(fontFamily);
    const cps = EVGCodepoint.toArray(line);
    const n = cps.length;
    let curText = "";
    let curFamily = fontFamily;
    let curIsCid = false;
    let haveCur = false;
    let x = startX;
    let i = 0;
    while (i < n) {
      const cEnd = EVGGrapheme.clusterEnd(cps, i);
      let useFamily = fontFamily;
      let useCid = false;
      if ( primary.isLoaded() ) {
        const face = this.fontManager.faceForClusterFrom(primary, cps, i, cEnd);
        if ( face.isLoaded() ) {
          if ( (face.fontPath == primary.fontPath) == false ) {
            useFamily = face.fontFamily;
            useCid = true;
          }
        }
      }
      let sameRun = false;
      if ( haveCur ) {
        if ( useCid == curIsCid ) {
          if ( useFamily == curFamily ) {
            sameRun = true;
          }
        }
      }
      if ( sameRun == false ) {
        if ( haveCur ) {
          const done = new PDFTextSegment();
          done.text = curText;
          done.family = curFamily;
          done.isCid = curIsCid;
          done.x = x;
          segs.push(done);
          x = x + this.segmentWidth(done, fontSize);
        }
        curText = "";
        curFamily = useFamily;
        curIsCid = useCid;
        haveCur = true;
      }
      let c = i;
      while (c < cEnd) {
        curText = curText + EVGCodepoint.toStr((cps[c]));
        c = c + 1;
      };
      i = cEnd;
    };
    if ( haveCur ) {
      const last = new PDFTextSegment();
      last.text = curText;
      last.family = curFamily;
      last.isCid = curIsCid;
      last.x = x;
      segs.push(last);
    }
    return segs;
  };
  cidShowOperator (segment, fontFamily) {
    const font = this.fontManager.getFont(fontFamily);
    const fontIdx = this.cidFontIndex(fontFamily);
    const cps = EVGCodepoint.toArray(segment);
    const n = cps.length;
    let out = "<";
    let i = 0;
    while (i < n) {
      const cEnd = EVGGrapheme.clusterEnd(cps, i);
      const run = font.shapeRange(cps, i, cEnd);
      let gi = 0;
      while (gi < (run.glyphs.length)) {
        const gid = run.glyphs[gi];
        const cs = i + (run.clusterStart[gi]);
        let ce = i + (run.clusterEnd[gi]);
        if ( ce > cEnd ) {
          ce = cEnd;
        }
        this.noteCidGlyphCluster(fontIdx, gid, cps, cs, ce);
        out = out + this.toHex4(gid);
        gi = gi + 1;
      };
      i = cEnd;
    };
    return out + "> Tj";
  };
  render (root) {
    if ( root.tagName == "print" ) {
      return this.renderMultiPageToPDF(root);
    }
    this.layout.layout(root);
    return this.renderToPDF(root);
  };
  findPageElementsRecursive (el) {
    if ( el.tagName == "page" ) {
      this.foundPages.push(el);
    }
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      this.findPageElementsRecursive(child);
      i = i + 1;
    };
  };
  findSectionElementsRecursive (el) {
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      if ( child.tagName == "section" ) {
        this.foundSections.push(child);
      }
      i = i + 1;
    };
  };
  getSectionPageWidth (section) {
    if ( section.width.isSet ) {
      return section.width.pixels;
    }
    return this.pageWidth;
  };
  getSectionPageHeight (section) {
    if ( section.height.isSet ) {
      return section.height.pixels;
    }
    return this.pageHeight;
  };
  getSectionMargin (section) {
    const m = section.box.marginTop;
    if ( m.isSet ) {
      return m.pixels;
    }
    return 40.0;
  };
  renderMultiPageToPDF (root) {
    const pdf = new GrowableBuffer();
    this.nextObjNum = 1;
    this.contentObjNums.length = 0;
    this.usedFontNames.length = 0;
    this.usedCidFonts.length = 0;
    this.cidFontObjNums.length = 0;
    this.cidUsedFont.length = 0;
    this.cidUsedGid.length = 0;
    this.cidUsedText.length = 0;
    this.embeddedFonts.length = 0;
    this.embeddedImages.length = 0;
    if ( root.imageQuality > 0 ) {
      this.jpegQuality = root.imageQuality;
      console.log("Image quality: " + ((this.jpegQuality.toString())));
    }
    if ( root.maxImageSize > 0 ) {
      this.maxImageWidth = root.maxImageSize;
      this.maxImageHeight = root.maxImageSize;
      console.log(("Max image size: " + ((this.maxImageWidth.toString()))) + "px");
    }
    pdf.writeString(this.headerLine());
    pdf.writeByte(37);
    pdf.writeByte(226);
    pdf.writeByte(227);
    pdf.writeByte(207);
    pdf.writeByte(211);
    pdf.writeByte(10);
    let objectOffsets = [];
    let emptyArr = [];
    this.foundSections = emptyArr;
    this.findSectionElementsRecursive(root);
    let allPages = [];
    let allPageWidths = [];
    let allPageHeights = [];
    let allPageMargins = [];
    let si = 0;
    while (si < (this.foundSections.length)) {
      const section = this.foundSections[si];
      const sectionWidth = this.getSectionPageWidth(section);
      const sectionHeight = this.getSectionPageHeight(section);
      const sectionMargin = this.getSectionMargin(section);
      let emptyPages = [];
      this.foundPages = emptyPages;
      this.findPageElementsRecursive(section);
      let pi = 0;
      while (pi < (this.foundPages.length)) {
        const pg = this.foundPages[pi];
        allPages.push(pg);
        allPageWidths.push(sectionWidth);
        allPageHeights.push(sectionHeight);
        allPageMargins.push(sectionMargin);
        const contentWidth = sectionWidth - (sectionMargin * 2.0);
        const contentHeight = sectionHeight - (sectionMargin * 2.0);
        console.log((((("Page " + (((pi + 1).toString()))) + " content size: ") + ((contentWidth.toString()))) + " x ") + ((contentHeight.toString())));
        this.layout.pageWidth = contentWidth;
        this.layout.pageHeight = contentHeight;
        pg.resetLayoutState();
        pg.width.pixels = contentWidth;
        pg.width.value = contentWidth;
        pg.width.unitType = 0;
        pg.width.isSet = true;
        pg.height.pixels = contentHeight;
        pg.height.value = contentHeight;
        pg.height.unitType = 0;
        pg.height.isSet = true;
        this.layout.layout(pg);
        console.log((("  After layout: pg.calculatedWidth=" + ((pg.calculatedWidth.toString()))) + " pg.calculatedHeight=") + ((pg.calculatedHeight.toString())));
        if ( pg.getChildCount() > 0 ) {
          const firstChild = pg.getChild(0);
          console.log((("  First child: w=" + ((firstChild.calculatedWidth.toString()))) + " h=") + ((firstChild.calculatedHeight.toString())));
        }
        pi = pi + 1;
      };
      si = si + 1;
    };
    if ( (allPages.length) == 0 ) {
      this.layout.layout(root);
      allPages.push(root);
      allPageWidths.push(this.pageWidth);
      allPageHeights.push(this.pageHeight);
      allPageMargins.push(0.0);
    }
    const numPages = allPages.length;
    console.log(("Rendering " + ((numPages.toString()))) + " pages");
    let contentDataList = [];
    let pgi = 0;
    while (pgi < numPages) {
      const pg_1 = allPages[pgi];
      const pgWidth = allPageWidths[pgi];
      const pgHeight = allPageHeights[pgi];
      const pgMargin = allPageMargins[pgi];
      this.pageHeight = pgHeight;
      (this.streamBuffer).clear();
      this.beginBleedShift();
      this.renderElement(pg_1, pgMargin, pgMargin);
      this.endBleedShift();
      const contentData = this.streamBuffer.toBuffer();
      contentDataList.push(contentData);
      console.log(((("  Page " + (((pgi + 1).toString()))) + ": ") + (((contentData.byteLength).toString()))) + " bytes");
      pgi = pgi + 1;
    };
    let fontObjNums = [];
    let fi = 0;
    while (fi < (this.usedFontNames.length)) {
      const fontName = this.usedFontNames[fi];
      const ttfFont = this.fontManager.getFont(fontName);
      if ( ttfFont.unitsPerEm > 0 ) {
        const key = EVGPDFRenderer.faceKey(ttfFont);
        const already = ( Object.prototype.hasOwnProperty.call(this.fontFileByFace, key) ? this.fontFileByFace[key] : undefined );
        let fontFileObjNum = 0;
        if ( (typeof(already) !== "undefined" && already != null )  ) {
          fontFileObjNum = already;
        } else {
          const fontFileData = ttfFont.pdfFontData();
          const fontFileLen = fontFileData.byteLength;
          objectOffsets.push((pdf).size());
          pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
          this.writeStream(pdf, fontFileData, " /Length1 " + ((fontFileLen.toString())));
          fontFileObjNum = this.nextObjNum;
          this.fontFileByFace[key] = fontFileObjNum;
          this.nextObjNum = this.nextObjNum + 1;
        }
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /FontDescriptor");
        pdf.writeString(" /FontName /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /Flags 32");
        pdf.writeString((((" /FontBBox [0 " + ((ttfFont.descender.toString()))) + " 1000 ") + ((ttfFont.ascender.toString()))) + "]");
        pdf.writeString(" /ItalicAngle 0");
        pdf.writeString(" /Ascent " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /Descent " + ((ttfFont.descender.toString())));
        pdf.writeString(" /CapHeight " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /StemV 80");
        pdf.writeString((" /FontFile2 " + ((fontFileObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        const fontDescObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        const toUnicodeStream = this.toUnicodeCMap();
        const toUnicodeLen = toUnicodeStream.length;
        pdf.writeString(("<< /Length " + ((toUnicodeLen.toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeString(toUnicodeStream);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const toUnicodeObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font");
        pdf.writeString(" /Subtype /TrueType");
        pdf.writeString(" /BaseFont /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /FirstChar 32");
        pdf.writeString(" /LastChar 255");
        pdf.writeString(" /Widths [");
        let ch = 32;
        while (ch <= 255) {
          const cwCp = Utf8.fromWinAnsi(ch);
          let cw = 0;
          if ( cwCp >= 0 ) {
            cw = ttfFont.getCharWidth(cwCp);
          }
          const scaledWd = ((cw) * 1000.0) / (ttfFont.unitsPerEm);
          const scaledW = Math.floor( scaledWd);
          pdf.writeString((scaledW.toString()));
          if ( ch < 255 ) {
            pdf.writeString(" ");
          }
          ch = ch + 1;
        };
        pdf.writeString("]");
        pdf.writeString((" /FontDescriptor " + ((fontDescObjNum.toString()))) + " 0 R");
        pdf.writeString(" /Encoding /WinAnsiEncoding");
        pdf.writeString((" /ToUnicode " + ((toUnicodeObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      } else {
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      }
      fi = fi + 1;
    };
    this.writeCidFontObjects(pdf, objectOffsets);
    if ( (fontObjNums.length) == 0 ) {
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
    }
    let imgIdx = 0;
    while (imgIdx < (this.embeddedImages.length)) {
      const embImg = this.embeddedImages[imgIdx];
      let imgSrc = embImg.src;
      let imgDir = this.baseDir;
      let imgFile = imgSrc;
      if ( (imgSrc.length) > 2 ) {
        const prefix = imgSrc.substring(0, 2 );
        if ( prefix == "./" ) {
          imgSrc = imgSrc.substring(2, (imgSrc.length) );
        }
      }
      const lastSlash = imgSrc.lastIndexOf("/");
      const lastBackslash = imgSrc.lastIndexOf("\\");
      let lastSep = lastSlash;
      if ( lastBackslash > lastSep ) {
        lastSep = lastBackslash;
      }
      if ( lastSep >= 0 ) {
        imgDir = this.baseDir + (imgSrc.substring(0, (lastSep + 1) ));
        imgFile = imgSrc.substring((lastSep + 1), (imgSrc.length) );
      } else {
        imgDir = this.baseDir;
        imgFile = imgSrc;
      }
      const supplied = this.suppliedImage(embImg.src);
      let imgBuffer = new ImageBuffer();
      if ( (typeof(supplied) !== "undefined" && supplied != null )  ) {
        imgBuffer = supplied;
        embImg.orientation = 1;
        console.log("Image supplied in memory: " + embImg.src);
      } else {
        console.log((("Loading image: dir=" + imgDir) + " file=") + imgFile);
        let metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
        if ( metaInfo.isValid == false ) {
          const origImgSrc = embImg.src;
          let altDirPath = "";
          if ( (origImgSrc.indexOf("./")) == 0 ) {
            altDirPath = (this.baseDir + "assets/") + (origImgSrc.substring(2, (origImgSrc.length) ));
          } else {
            altDirPath = (this.baseDir + "assets/") + origImgSrc;
          }
          const altLastSlash = altDirPath.lastIndexOf("/");
          if ( altLastSlash >= 0 ) {
            imgDir = altDirPath.substring(0, (altLastSlash + 1) );
            imgFile = altDirPath.substring((altLastSlash + 1), (altDirPath.length) );
          }
          console.log((("  Trying alternative: dir=" + imgDir) + " file=") + imgFile);
          metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
        }
        embImg.orientation = metaInfo.orientation;
        imgBuffer = this.jpegDecoder.decode(imgDir, imgFile);
      }
      if ( (imgBuffer.width > 1) && (imgBuffer.height > 1) ) {
        if ( embImg.orientation > 1 ) {
          console.log("  Applying EXIF orientation: " + ((embImg.orientation.toString())));
          imgBuffer = imgBuffer.applyExifOrientation(embImg.orientation);
        }
        const origW = imgBuffer.width;
        const origH = imgBuffer.height;
        let newW = origW;
        let newH = origH;
        if ( (origW > this.maxImageWidth) || (origH > this.maxImageHeight) ) {
          const scaleW = (this.maxImageWidth) / (origW);
          const scaleH = (this.maxImageHeight) / (origH);
          let scale = scaleW;
          if ( scaleH < scaleW ) {
            scale = scaleH;
          }
          newW = Math.floor( ((origW) * scale));
          newH = Math.floor( ((origH) * scale));
          console.log((((((("  Resizing from " + ((origW.toString()))) + "x") + ((origH.toString()))) + " to ") + ((newW.toString()))) + "x") + ((newH.toString())));
          imgBuffer = imgBuffer.scaleToSize(newW, newH);
        }
        this.jpegEncoder.setQuality(this.jpegQuality);
        const encodedData = this.jpegEncoder.encodeToBuffer(imgBuffer);
        const encodedLen = encodedData.byteLength;
        embImg.width = newW;
        embImg.height = newH;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /XObject");
        pdf.writeString(" /Subtype /Image");
        pdf.writeString(" /Width " + ((newW.toString())));
        pdf.writeString(" /Height " + ((newH.toString())));
        pdf.writeString(" /ColorSpace /DeviceRGB");
        this.rgbImages = this.rgbImages + 1;
        pdf.writeString(" /BitsPerComponent 8");
        pdf.writeString(" /Filter /DCTDecode");
        pdf.writeString(" /Length " + ((encodedLen.toString())));
        pdf.writeString(" >>\n");
        pdf.writeString("stream\n");
        pdf.writeBuffer(encodedData);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        embImg.objNum = this.nextObjNum;
        embImg.pdfName = "/Im" + (((imgIdx + 1).toString()));
        this.nextObjNum = this.nextObjNum + 1;
        console.log(((((("Embedded image: " + embImg.src) + " (") + ((newW.toString()))) + "x") + ((newH.toString()))) + ")");
      } else {
        console.log("Failed to decode image: " + embImg.src);
      }
      imgIdx = imgIdx + 1;
    };
    let contentObjNumList = [];
    let ci = 0;
    while (ci < numPages) {
      const contentData_1 = contentDataList[ci];
      const contentLen = contentData_1.byteLength;
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      this.writeStream(pdf, contentData_1, "");
      contentObjNumList.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
      ci = ci + 1;
    };
    let pageObjNumList = [];
    const pagesRefNum = this.nextObjNum + numPages;
    let pi2 = 0;
    while (pi2 < numPages) {
      const pgWidth_1 = allPageWidths[pi2];
      const pgHeight_1 = allPageHeights[pi2];
      const contentObjN = contentObjNumList[pi2];
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(("<< /Type /Page /Parent " + ((pagesRefNum.toString()))) + " 0 R");
      const bx1 = this.pageBoxes(pgWidth_1, pgHeight_1);
      pdf.writeString(bx1);
      pdf.writeString((" /Contents " + ((contentObjN.toString()))) + " 0 R");
      pdf.writeString(" /Resources <<");
      pdf.writeString(" /Font <<");
      let ffi = 0;
      while (ffi < (fontObjNums.length)) {
        const fontObjN = fontObjNums[ffi];
        pdf.writeString((((" /F" + (((ffi + 1).toString()))) + " ") + ((fontObjN.toString()))) + " 0 R");
        ffi = ffi + 1;
      };
      let efi = 0;
      while (efi < (this.cidFontObjNums.length)) {
        const cidObjN = this.cidFontObjNums[efi];
        pdf.writeString((((" /E" + (((efi + 1).toString()))) + " ") + ((cidObjN.toString()))) + " 0 R");
        efi = efi + 1;
      };
      pdf.writeString(" >>");
      if ( (this.embeddedImages.length) > 0 ) {
        pdf.writeString(" /XObject <<");
        let ii = 0;
        while (ii < (this.embeddedImages.length)) {
          const embImg_1 = this.embeddedImages[ii];
          if ( embImg_1.objNum > 0 ) {
            pdf.writeString((((" /Im" + (((ii + 1).toString()))) + " ") + ((embImg_1.objNum.toString()))) + " 0 R");
          }
          ii = ii + 1;
        };
        pdf.writeString(" >>");
      }
      pdf.writeString(this.extGStateDict());
      pdf.writeString(" >> >>\n");
      pdf.writeString("endobj\n\n");
      pageObjNumList.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
      pi2 = pi2 + 1;
    };
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString("<< /Type /Pages /Kids [");
    let ki = 0;
    while (ki < numPages) {
      const pageObjN = pageObjNumList[ki];
      pdf.writeString(((pageObjN.toString())) + " 0 R");
      if ( ki < (numPages - 1) ) {
        pdf.writeString(" ");
      }
      ki = ki + 1;
    };
    pdf.writeString(("] /Count " + ((numPages.toString()))) + " >>\n");
    pdf.writeString("endobj\n\n");
    this.pagesObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    let metadataObjNum = 0;
    let intentObjNum = 0;
    let infoObjNum = 0;
    if ( this.wantsFinishing() ) {
      const xmp = this.xmpPacket();
      const xmpLen = EVGPDFRenderer.byteLength(xmp);
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(("<< /Type /Metadata /Subtype /XML /Length " + ((xmpLen.toString()))) + " >>\nstream\n");
      pdf.writeString(xmp);
      pdf.writeString("endstream\nendobj\n\n");
      metadataObjNum = this.nextObjNum;
      this.nextObjNum = this.nextObjNum + 1;
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(this.outputIntentBody());
      pdf.writeString("endobj\n\n");
      intentObjNum = this.nextObjNum;
      this.nextObjNum = this.nextObjNum + 1;
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(this.infoBody());
      pdf.writeString("endobj\n\n");
      infoObjNum = this.nextObjNum;
      this.nextObjNum = this.nextObjNum + 1;
    }
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString(this.catalogBody(this.pagesObjNum, metadataObjNum, intentObjNum));
    pdf.writeString("endobj\n\n");
    const catalogObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    const xrefOffset = (pdf).size();
    pdf.writeString("xref\n");
    pdf.writeString(("0 " + ((this.nextObjNum.toString()))) + "\n");
    pdf.writeString("0000000000 65535 f \n");
    let xi = 0;
    while (xi < (objectOffsets.length)) {
      const offset = objectOffsets[xi];
      pdf.writeString(this.padLeft(((offset.toString())), 10, "0") + " 00000 n \n");
      xi = xi + 1;
    };
    pdf.writeString("trailer\n");
    pdf.writeString(this.trailerBody(this.nextObjNum, catalogObjNum, infoObjNum));
    pdf.writeString("startxref\n");
    pdf.writeString(((xrefOffset.toString())) + "\n");
    pdf.writeString("%%EOF\n");
    return pdf.toBuffer();
  };
  renderToPDF (root) {
    const pdf = new GrowableBuffer();
    this.nextObjNum = 1;
    this.contentObjNums.length = 0;
    this.usedFontNames.length = 0;
    this.usedCidFonts.length = 0;
    this.cidFontObjNums.length = 0;
    this.cidUsedFont.length = 0;
    this.cidUsedGid.length = 0;
    this.cidUsedText.length = 0;
    this.embeddedFonts.length = 0;
    this.embeddedImages.length = 0;
    pdf.writeString(this.headerLine());
    pdf.writeByte(37);
    pdf.writeByte(226);
    pdf.writeByte(227);
    pdf.writeByte(207);
    pdf.writeByte(211);
    pdf.writeByte(10);
    let objectOffsets = [];
    (this.streamBuffer).clear();
    this.beginBleedShift();
    this.renderElement(root, 0.0, 0.0);
    this.endBleedShift();
    const contentData = this.streamBuffer.toBuffer();
    const contentLen = contentData.byteLength;
    let fontObjNums = [];
    let i = 0;
    while (i < (this.usedFontNames.length)) {
      const fontName = this.usedFontNames[i];
      const ttfFont = this.fontManager.getFont(fontName);
      if ( ttfFont.unitsPerEm > 0 ) {
        const key = EVGPDFRenderer.faceKey(ttfFont);
        const already = ( Object.prototype.hasOwnProperty.call(this.fontFileByFace, key) ? this.fontFileByFace[key] : undefined );
        let fontFileObjNum = 0;
        if ( (typeof(already) !== "undefined" && already != null )  ) {
          fontFileObjNum = already;
        } else {
          const fontFileData = ttfFont.pdfFontData();
          const fontFileLen = fontFileData.byteLength;
          objectOffsets.push((pdf).size());
          pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
          this.writeStream(pdf, fontFileData, " /Length1 " + ((fontFileLen.toString())));
          fontFileObjNum = this.nextObjNum;
          this.fontFileByFace[key] = fontFileObjNum;
          this.nextObjNum = this.nextObjNum + 1;
        }
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /FontDescriptor");
        pdf.writeString(" /FontName /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /Flags 32");
        pdf.writeString((((" /FontBBox [0 " + ((ttfFont.descender.toString()))) + " 1000 ") + ((ttfFont.ascender.toString()))) + "]");
        pdf.writeString(" /ItalicAngle 0");
        pdf.writeString(" /Ascent " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /Descent " + ((ttfFont.descender.toString())));
        pdf.writeString(" /CapHeight " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /StemV 80");
        pdf.writeString((" /FontFile2 " + ((fontFileObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        const fontDescObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        const toUnicodeStream = this.toUnicodeCMap();
        const toUnicodeLen = toUnicodeStream.length;
        pdf.writeString(("<< /Length " + ((toUnicodeLen.toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeString(toUnicodeStream);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const toUnicodeObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font");
        pdf.writeString(" /Subtype /TrueType");
        pdf.writeString(" /BaseFont /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /FirstChar 32");
        pdf.writeString(" /LastChar 255");
        pdf.writeString(" /Widths [");
        let ch = 32;
        while (ch <= 255) {
          const wCp = Utf8.fromWinAnsi(ch);
          let w = 0;
          if ( wCp >= 0 ) {
            w = ttfFont.getCharWidth(wCp);
          }
          const scaledWd = ((w) * 1000.0) / (ttfFont.unitsPerEm);
          const scaledW = Math.floor( scaledWd);
          pdf.writeString((scaledW.toString()));
          if ( ch < 255 ) {
            pdf.writeString(" ");
          }
          ch = ch + 1;
        };
        pdf.writeString("]");
        pdf.writeString((" /FontDescriptor " + ((fontDescObjNum.toString()))) + " 0 R");
        pdf.writeString(" /Encoding /WinAnsiEncoding");
        pdf.writeString((" /ToUnicode " + ((toUnicodeObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      } else {
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      }
      i = i + 1;
    };
    this.writeCidFontObjects(pdf, objectOffsets);
    if ( (fontObjNums.length) == 0 ) {
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
    }
    let imgIdx = 0;
    while (imgIdx < (this.embeddedImages.length)) {
      const embImg = this.embeddedImages[imgIdx];
      let imgSrc = embImg.src;
      let imgDir = this.baseDir;
      let imgFile = imgSrc;
      if ( (imgSrc.length) > 2 ) {
        const prefix = imgSrc.substring(0, 2 );
        if ( prefix == "./" ) {
          imgSrc = imgSrc.substring(2, (imgSrc.length) );
        }
      }
      const lastSlash = imgSrc.lastIndexOf("/");
      const lastBackslash = imgSrc.lastIndexOf("\\");
      let lastSep = lastSlash;
      if ( lastBackslash > lastSep ) {
        lastSep = lastBackslash;
      }
      if ( lastSep >= 0 ) {
        imgDir = this.baseDir + (imgSrc.substring(0, (lastSep + 1) ));
        imgFile = imgSrc.substring((lastSep + 1), (imgSrc.length) );
      } else {
        imgDir = this.baseDir;
        imgFile = imgSrc;
      }
      console.log((("Loading image: dir=" + imgDir) + " file=") + imgFile);
      let metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
      if ( metaInfo.isValid == false ) {
        const origImgSrc = embImg.src;
        let altDirPath = "";
        if ( (origImgSrc.indexOf("./")) == 0 ) {
          altDirPath = (this.baseDir + "assets/") + (origImgSrc.substring(2, (origImgSrc.length) ));
        } else {
          altDirPath = (this.baseDir + "assets/") + origImgSrc;
        }
        const altLastSlash = altDirPath.lastIndexOf("/");
        if ( altLastSlash >= 0 ) {
          imgDir = altDirPath.substring(0, (altLastSlash + 1) );
          imgFile = altDirPath.substring((altLastSlash + 1), (altDirPath.length) );
        }
        console.log((("  Trying alternative: dir=" + imgDir) + " file=") + imgFile);
        metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
      }
      embImg.orientation = metaInfo.orientation;
      let imgBuffer = this.jpegDecoder.decode(imgDir, imgFile);
      if ( (imgBuffer.width > 1) && (imgBuffer.height > 1) ) {
        if ( metaInfo.orientation > 1 ) {
          console.log("  Applying EXIF orientation: " + ((metaInfo.orientation.toString())));
          imgBuffer = imgBuffer.applyExifOrientation(metaInfo.orientation);
        }
        const origW = imgBuffer.width;
        const origH = imgBuffer.height;
        let newW = origW;
        let newH = origH;
        if ( (origW > this.maxImageWidth) || (origH > this.maxImageHeight) ) {
          const scaleW = (this.maxImageWidth) / (origW);
          const scaleH = (this.maxImageHeight) / (origH);
          let scale = scaleW;
          if ( scaleH < scaleW ) {
            scale = scaleH;
          }
          newW = Math.floor( ((origW) * scale));
          newH = Math.floor( ((origH) * scale));
          console.log((((((("  Resizing from " + ((origW.toString()))) + "x") + ((origH.toString()))) + " to ") + ((newW.toString()))) + "x") + ((newH.toString())));
          imgBuffer = imgBuffer.scaleToSize(newW, newH);
        }
        this.jpegEncoder.setQuality(this.jpegQuality);
        const encodedData = this.jpegEncoder.encodeToBuffer(imgBuffer);
        const encodedLen = encodedData.byteLength;
        embImg.width = newW;
        embImg.height = newH;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /XObject");
        pdf.writeString(" /Subtype /Image");
        pdf.writeString(" /Width " + ((newW.toString())));
        pdf.writeString(" /Height " + ((newH.toString())));
        pdf.writeString(" /ColorSpace /DeviceRGB");
        this.rgbImages = this.rgbImages + 1;
        pdf.writeString(" /BitsPerComponent 8");
        pdf.writeString(" /Filter /DCTDecode");
        pdf.writeString(" /Length " + ((encodedLen.toString())));
        pdf.writeString(" >>\n");
        pdf.writeString("stream\n");
        pdf.writeBuffer(encodedData);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        embImg.objNum = this.nextObjNum;
        embImg.pdfName = "/Im" + (((imgIdx + 1).toString()));
        this.nextObjNum = this.nextObjNum + 1;
        console.log(((((((("Embedded image: " + imgSrc) + " (resized to ") + ((newW.toString()))) + "x") + ((newH.toString()))) + ", ") + ((encodedLen.toString()))) + " bytes)");
      } else {
        console.log("Failed to decode image: " + imgSrc);
      }
      imgIdx = imgIdx + 1;
    };
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    this.writeStream(pdf, contentData, "");
    const contentObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    const pagesRef = this.nextObjNum + 1;
    pdf.writeString(("<< /Type /Page /Parent " + ((pagesRef.toString()))) + " 0 R");
    const bx2 = this.pageBoxes(this.pageWidth, this.pageHeight);
    pdf.writeString(bx2);
    pdf.writeString((" /Contents " + ((contentObjNum.toString()))) + " 0 R");
    pdf.writeString(" /Resources <<");
    pdf.writeString(" /Font <<");
    let fi = 0;
    while (fi < (fontObjNums.length)) {
      const fontObjN = fontObjNums[fi];
      pdf.writeString((((" /F" + (((fi + 1).toString()))) + " ") + ((fontObjN.toString()))) + " 0 R");
      fi = fi + 1;
    };
    let efi = 0;
    while (efi < (this.cidFontObjNums.length)) {
      const cidObjN = this.cidFontObjNums[efi];
      pdf.writeString((((" /E" + (((efi + 1).toString()))) + " ") + ((cidObjN.toString()))) + " 0 R");
      efi = efi + 1;
    };
    pdf.writeString(" >>");
    if ( (this.embeddedImages.length) > 0 ) {
      pdf.writeString(" /XObject <<");
      let ii = 0;
      while (ii < (this.embeddedImages.length)) {
        const embImg_1 = this.embeddedImages[ii];
        if ( embImg_1.objNum > 0 ) {
          pdf.writeString((((" /Im" + (((ii + 1).toString()))) + " ") + ((embImg_1.objNum.toString()))) + " 0 R");
        }
        ii = ii + 1;
      };
      pdf.writeString(" >>");
    }
    pdf.writeString(this.extGStateDict());
    pdf.writeString(" >> >>\n");
    pdf.writeString("endobj\n\n");
    const pageObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString(("<< /Type /Pages /Kids [" + ((pageObjNum.toString()))) + " 0 R] /Count 1 >>\n");
    pdf.writeString("endobj\n\n");
    this.pagesObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    let metadataObjNum = 0;
    let intentObjNum = 0;
    let infoObjNum = 0;
    if ( this.wantsFinishing() ) {
      const xmp = this.xmpPacket();
      const xmpLen = EVGPDFRenderer.byteLength(xmp);
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(("<< /Type /Metadata /Subtype /XML /Length " + ((xmpLen.toString()))) + " >>\nstream\n");
      pdf.writeString(xmp);
      pdf.writeString("endstream\nendobj\n\n");
      metadataObjNum = this.nextObjNum;
      this.nextObjNum = this.nextObjNum + 1;
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(this.outputIntentBody());
      pdf.writeString("endobj\n\n");
      intentObjNum = this.nextObjNum;
      this.nextObjNum = this.nextObjNum + 1;
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(this.infoBody());
      pdf.writeString("endobj\n\n");
      infoObjNum = this.nextObjNum;
      this.nextObjNum = this.nextObjNum + 1;
    }
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString(this.catalogBody(this.pagesObjNum, metadataObjNum, intentObjNum));
    pdf.writeString("endobj\n\n");
    const catalogObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    const xrefOffset = (pdf).size();
    pdf.writeString("xref\n");
    pdf.writeString(("0 " + ((this.nextObjNum.toString()))) + "\n");
    pdf.writeString("0000000000 65535 f \n");
    let i_2 = 0;
    while (i_2 < (objectOffsets.length)) {
      const offset = objectOffsets[i_2];
      pdf.writeString(this.padLeft(((offset.toString())), 10, "0") + " 00000 n \n");
      i_2 = i_2 + 1;
    };
    pdf.writeString("trailer\n");
    pdf.writeString(this.trailerBody(this.nextObjNum, catalogObjNum, infoObjNum));
    pdf.writeString("startxref\n");
    pdf.writeString(((xrefOffset.toString())) + "\n");
    pdf.writeString("%%EOF\n");
    return pdf.toBuffer();
  };
  renderElement (el, offsetX, offsetY) {
    let x = el.calculatedX + offsetX;
    let y = el.calculatedY + offsetY;
    let w = el.calculatedWidth;
    let h = el.calculatedHeight;
    if ( el.fullBleed ) {
      if ( this.bleed > 0.0 ) {
        if ( x <= 0.001 ) {
          x = x - this.bleed;
          w = w + this.bleed;
        }
        if ( y <= 0.001 ) {
          y = y - this.bleed;
          h = h + this.bleed;
        }
        if ( ((x + w) + 0.001) >= this.pageWidth ) {
          w = w + this.bleed;
        }
        if ( ((y + h) + 0.001) >= this.pageHeight ) {
          h = h + this.bleed;
        }
      }
    }
    const pdfY = (this.pageHeight - y) - h;
    let borderRadius = 0.0;
    if ( el.box.borderRadius.isSet ) {
      borderRadius = el.box.borderRadius.pixels;
    }
    let rotated = false;
    if ( (el.rotate == 0.0) == false ) {
      rotated = true;
      const rad = (el.rotate / 180.0) * (Math.PI);
      const cs = Math.cos(rad);
      const sn = Math.sin(rad);
      const ccx = x + (w / 2.0);
      const ccy = pdfY + (h / 2.0);
      const ex = (ccx - (cs * ccx)) + (sn * ccy);
      const fy = (ccy - (sn * ccx)) - (cs * ccy);
      this.streamBuffer.writeString("q\n");
      this.streamBuffer.writeString(((((((((((this.formatNum(cs) + " ") + this.formatNum(sn)) + " ") + this.formatNum((0.0 - sn))) + " ") + this.formatNum(cs)) + " ") + this.formatNum(ex)) + " ") + this.formatNum(fy)) + " cm\n");
    }
    let hasClipPath = false;
    if ( (el.clipPath.length) > 0 ) {
      hasClipPath = true;
      this.streamBuffer.writeString("q\n");
      this.applyClipPath(el.clipPath, x, pdfY, w, h);
    }
    let hasOverflowClip = false;
    if ( el.overflow == "hidden" ) {
      hasOverflowClip = true;
      this.streamBuffer.writeString("q\n");
      if ( borderRadius > 0.0 ) {
        this.drawRoundedRectPath(x, pdfY, w, h, borderRadius);
        this.streamBuffer.writeString("W n\n");
      } else {
        this.streamBuffer.writeString(((((((((x.toString())) + " ") + ((pdfY.toString()))) + " ") + ((w.toString()))) + " ") + ((h.toString()))) + " re W n\n");
      }
    }
    if ( el.tagName != "text" ) {
      this.renderShadow(el, x, pdfY, w, h, borderRadius);
    }
    if ( (el.backgroundGradient.length) > 0 ) {
      let hasOpacity = false;
      if ( el.backgroundGradient.includes("rgba") ) {
        hasOpacity = true;
      }
      if ( el.backgroundGradient.includes("transparent") ) {
        hasOpacity = true;
      }
      if ( hasOpacity == false ) {
        this.renderGradientBackground(el, x, pdfY, w, h, borderRadius);
      }
    } else {
      const bgColor = el.backgroundColor;
      if ( this.debug ) {
        console.log((((("  bg check: " + el.tagName) + " isSet=") + ((bgColor.isSet.toString()))) + " r=") + ((bgColor.r.toString())));
      }
      if ( bgColor.isSet ) {
        this.renderBackgroundWithRadius(x, pdfY, w, h, bgColor, borderRadius);
      }
    }
    this.renderBorderWithRadius(el, x, pdfY, w, h, borderRadius);
    if ( el.tagName == "text" ) {
      this.renderText(el, x, pdfY, w, h);
    }
    if ( el.tagName == "divider" ) {
      this.renderDivider(el, x, pdfY, w, h);
    }
    if ( ((el.tagName == "image") || (el.tagName == "Image")) || (el.tagName == "img") ) {
      this.renderImage(el, x, pdfY, w, h);
    }
    if ( el.tagName == "path" ) {
      this.renderPath(el, x, pdfY, w, h);
    }
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      this.renderElement(child, offsetX, offsetY);
      i = i + 1;
    };
    if ( hasClipPath ) {
      this.streamBuffer.writeString("Q\n");
    }
    if ( hasOverflowClip ) {
      this.streamBuffer.writeString("Q\n");
    }
    if ( rotated ) {
      this.streamBuffer.writeString("Q\n");
    }
  };
  getImagePdfName (src) {
    let i = 0;
    while (i < (this.embeddedImages.length)) {
      const embImg = this.embeddedImages[i];
      if ( embImg.src == src ) {
        return "/Im" + (((i + 1).toString()));
      }
      i = i + 1;
    };
    const newImg = new EmbeddedImage(src);
    this.embeddedImages.push(newImg);
    return "/Im" + (((this.embeddedImages.length).toString()));
  };
  getEmbeddedImage (src) {
    let i = 0;
    while (i < (this.embeddedImages.length)) {
      const embImg = this.embeddedImages[i];
      if ( embImg.src == src ) {
        return embImg;
      }
      i = i + 1;
    };
    const empty = new EmbeddedImage("");
    return empty;
  };
  renderImage (el, x, y, w, h) {
    const src = el.src;
    if ( (src.length) == 0 ) {
      return;
    }
    const imgName = this.getImagePdfName(src);
    let origW = 0.0;
    let origH = 0.0;
    const dims = this.loadImageDimensions(src);
    if ( dims.isValid ) {
      origW = dims.width;
      origH = dims.height;
    }
    let renderW = w;
    let renderH = h;
    let offsetX = 0.0;
    let offsetY = 0.0;
    console.log((((((((("renderImage: src=" + src) + " container=") + ((w.toString()))) + "x") + ((h.toString()))) + " origImg=") + ((origW.toString()))) + "x") + ((origH.toString())));
    if ( origW > 0.0 ) {
      if ( origH > 0.0 ) {
        let objectFit = el.objectFit;
        if ( (objectFit.length) == 0 ) {
          objectFit = "cover";
        }
        const containerRatio = w / h;
        const imageRatio = origW / origH;
        console.log((((("  objectFit=" + objectFit) + " containerRatio=") + ((containerRatio.toString()))) + " imageRatio=") + ((imageRatio.toString())));
        if ( objectFit == "cover" ) {
          if ( imageRatio > containerRatio ) {
            renderH = h;
            renderW = h * imageRatio;
            offsetX = (w - renderW) / 2.0;
          } else {
            renderW = w;
            renderH = w / imageRatio;
            offsetY = (h - renderH) / 2.0;
          }
        }
        if ( objectFit == "contain" ) {
          if ( imageRatio > containerRatio ) {
            renderW = w;
            renderH = w / imageRatio;
            offsetY = (h - renderH) / 2.0;
          } else {
            renderH = h;
            renderW = h * imageRatio;
            offsetX = (w - renderW) / 2.0;
          }
        }
      }
    }
    this.streamBuffer.writeString("q\n");
    let borderRadius = 0.0;
    if ( el.box.borderRadius.isSet ) {
      borderRadius = el.box.borderRadius.pixels;
    }
    if ( borderRadius > 0.0 ) {
      this.drawRoundedRectPath(x, y, w, h, borderRadius);
      this.streamBuffer.writeString("W n\n");
    } else {
      this.streamBuffer.writeString(((((((this.formatNum(x) + " ") + this.formatNum(y)) + " ") + this.formatNum(w)) + " ") + this.formatNum(h)) + " re W n\n");
    }
    const finalX = x + offsetX;
    const finalY = y + offsetY;
    this.streamBuffer.writeString(((((((this.formatNum(renderW) + " 0 0 ") + this.formatNum(renderH)) + " ") + this.formatNum(finalX)) + " ") + this.formatNum(finalY)) + " cm\n");
    this.streamBuffer.writeString(imgName + " Do\n");
    this.streamBuffer.writeString("Q\n");
  };
  pathViewBoxMatrix (el, parser, w, h) {
    const b = parser.getBounds();
    const vb = VectorViewBox.effectiveViewBox(el.viewBox, b.minX, b.minY, b.width, b.height);
    return VectorViewBox.resolve(vb, w, h, "xMidYMid meet");
  };
  writeDashPattern (el) {
    this.writeDashArray(el.strokeDashArray, el.strokeDashOffset);
  };
  writeDashArray (dashArray, dashOffset) {
    if ( (dashArray.length) == 0 ) {
      return;
    }
    const dashes = VectorStroke.parseDashes(dashArray);
    if ( (dashes.length) == 0 ) {
      return;
    }
    let out = "[";
    let k = 0;
    while (k < (dashes.length)) {
      if ( k > 0 ) {
        out = out + " ";
      }
      out = out + this.formatNum((dashes[k]));
      k = k + 1;
    };
    out = ((out + "] ") + this.formatNum(dashOffset)) + " d\n";
    this.streamBuffer.writeString(out);
  };
  writePathOps (commands) {
    let curX = 0.0;
    let curY = 0.0;
    let startX = 0.0;
    let startY = 0.0;
    let i = 0;
    while (i < (commands.length)) {
      const cmd = commands[i];
      if ( cmd.type == "M" ) {
        this.streamBuffer.writeString(((this.formatNum(cmd.x) + " ") + this.formatNum(cmd.y)) + " m\n");
      }
      if ( cmd.type == "L" ) {
        this.streamBuffer.writeString(((this.formatNum(cmd.x) + " ") + this.formatNum(cmd.y)) + " l\n");
      }
      if ( cmd.type == "C" ) {
        this.streamBuffer.writeString(((((((((((this.formatNum(cmd.x1) + " ") + this.formatNum(cmd.y1)) + " ") + this.formatNum(cmd.x2)) + " ") + this.formatNum(cmd.y2)) + " ") + this.formatNum(cmd.x)) + " ") + this.formatNum(cmd.y)) + " c\n");
      }
      if ( cmd.type == "Q" ) {
        const c1x = curX + ((2.0 / 3.0) * (cmd.x1 - curX));
        const c1y = curY + ((2.0 / 3.0) * (cmd.y1 - curY));
        const c2x = cmd.x + ((2.0 / 3.0) * (cmd.x1 - cmd.x));
        const c2y = cmd.y + ((2.0 / 3.0) * (cmd.y1 - cmd.y));
        this.streamBuffer.writeString(((((((((((this.formatNum(c1x) + " ") + this.formatNum(c1y)) + " ") + this.formatNum(c2x)) + " ") + this.formatNum(c2y)) + " ") + this.formatNum(cmd.x)) + " ") + this.formatNum(cmd.y)) + " c\n");
      }
      if ( cmd.type == "Z" ) {
        this.streamBuffer.writeString("h\n");
        curX = startX;
        curY = startY;
      }
      if ( cmd.type == "M" ) {
        startX = cmd.x;
        startY = cmd.y;
      }
      if ( (cmd.type == "Z") == false ) {
        curX = cmd.x;
        curY = cmd.y;
      }
      i = i + 1;
    };
  };
  renderPath (el, x, y, w, h) {
    if ( (el.svgSource.length) > 0 ) {
      this.renderSvgDocument(el, x, y, w, h);
      return;
    }
    const pathData = el.svgPath;
    if ( (pathData.length) == 0 ) {
      return;
    }
    const parser = new SVGPathParser();
    parser.parse(pathData);
    const commands = parser.getCommands();
    let fillColor = el.fillColor;
    const strokeColor = el.strokeColor;
    if ( fillColor.isSet == false ) {
      fillColor = el.backgroundColor;
    }
    const m = this.pathViewBoxMatrix(el, parser, w, h);
    this.streamBuffer.writeString("q\n");
    this.streamBuffer.writeString(((("1 0 0 1 " + this.formatNum(x)) + " ") + this.formatNum(y)) + " cm\n");
    this.streamBuffer.writeString(("1 0 0 -1 0 " + this.formatNum(h)) + " cm\n");
    this.streamBuffer.writeString(((((((((((this.formatNum(m.a) + " ") + this.formatNum(m.b)) + " ") + this.formatNum(m.c)) + " ") + this.formatNum(m.d)) + " ") + this.formatNum(m.e)) + " ") + this.formatNum(m.f)) + " cm\n");
    this.writePathOps(commands);
    this.writePaintOps(fillColor, strokeColor, el.strokeWidth, el.fillRule, el.strokeDashArray, el.strokeDashOffset);
    this.streamBuffer.writeString("Q\n");
  };
  writePaintOps (fillColor, strokeColor, strokeWidth, fillRule, dashArray, dashOffset) {
    const evenOdd = fillRule == "evenodd";
    let fa = 1.0;
    if ( fillColor.isSet ) {
      fa = fillColor.a;
    }
    let sa = 1.0;
    if ( strokeColor.isSet ) {
      sa = strokeColor.a;
    }
    const gs = this.alphaState(fa, sa);
    if ( (gs.length) > 0 ) {
      this.streamBuffer.writeString(gs);
    }
    if ( fillColor.isSet ) {
      const r = fillColor.r / 255.0;
      const g = fillColor.g / 255.0;
      const b = fillColor.b / 255.0;
      this.streamBuffer.writeString(this.fillOp(r, g, b));
    }
    if ( strokeColor.isSet ) {
      const sr = strokeColor.r / 255.0;
      const sg = strokeColor.g / 255.0;
      const sb = strokeColor.b / 255.0;
      this.streamBuffer.writeString(this.strokeOp(sr, sg, sb));
      if ( strokeWidth > 0.0 ) {
        this.streamBuffer.writeString(this.formatNum(strokeWidth) + " w\n");
      }
      this.writeDashArray(dashArray, dashOffset);
    }
    if ( fillColor.isSet && strokeColor.isSet ) {
      if ( evenOdd ) {
        this.streamBuffer.writeString("B*\n");
      } else {
        this.streamBuffer.writeString("B\n");
      }
      return;
    }
    if ( fillColor.isSet ) {
      if ( evenOdd ) {
        this.streamBuffer.writeString("f*\n");
      } else {
        this.streamBuffer.writeString("f\n");
      }
      return;
    }
    if ( strokeColor.isSet ) {
      this.streamBuffer.writeString("S\n");
    }
  };
  renderSvgDocument (el, x, y, w, h) {
    const sp = new SvgParser();
    if ( el.fillColor.isSet ) {
      sp.setInitialFill(el.fillColor);
    }
    const doc = sp.parse(el.svgSource);
    this.reportSvgDiagnostics(doc);
    if ( doc.itemCount() == 0 ) {
      return;
    }
    const vb = doc.effectiveViewBox();
    const m = VectorViewBox.resolve(vb, w, h, "xMidYMid meet");
    this.streamBuffer.writeString("q\n");
    this.streamBuffer.writeString(((("1 0 0 1 " + this.formatNum(x)) + " ") + this.formatNum(y)) + " cm\n");
    this.streamBuffer.writeString(("1 0 0 -1 0 " + this.formatNum(h)) + " cm\n");
    this.streamBuffer.writeString(((((((((((this.formatNum(m.a) + " ") + this.formatNum(m.b)) + " ") + this.formatNum(m.c)) + " ") + this.formatNum(m.d)) + " ") + this.formatNum(m.e)) + " ") + this.formatNum(m.f)) + " cm\n");
    let k = 0;
    while (k < doc.itemCount()) {
      const item = doc.items[k];
      this.writePathOps(item.commands);
      this.writePaintOps(item.fillColor, item.strokeColor, item.strokeWidth, item.fillRule, item.dashArray, item.dashOffset);
      k = k + 1;
    };
    this.streamBuffer.writeString("Q\n");
  };
  reportSvgDiagnostics (doc) {
    if ( doc.hasErrors() ) {
      console.log("  SVG import error: " + doc.errorSummary());
    }
    if ( doc.hasWarnings() ) {
      console.log("  SVG import: " + doc.warningSummary());
    }
  };
  applyClipPath (pathData, x, y, w, h) {
    const parser = new SVGPathParser();
    parser.parse(pathData);
    const commands = parser.getScaledCommands(w, h);
    let i = 0;
    while (i < (commands.length)) {
      const cmd = commands[i];
      const px = x + cmd.x;
      const py = (y + h) - cmd.y;
      const px1 = x + cmd.x1;
      const py1 = (y + h) - cmd.y1;
      const px2 = x + cmd.x2;
      const py2 = (y + h) - cmd.y2;
      if ( cmd.type == "M" ) {
        this.streamBuffer.writeString(((this.formatNum(px) + " ") + this.formatNum(py)) + " m\n");
      }
      if ( cmd.type == "L" ) {
        this.streamBuffer.writeString(((this.formatNum(px) + " ") + this.formatNum(py)) + " l\n");
      }
      if ( cmd.type == "C" ) {
        this.streamBuffer.writeString(((((((((((this.formatNum(px1) + " ") + this.formatNum(py1)) + " ") + this.formatNum(px2)) + " ") + this.formatNum(py2)) + " ") + this.formatNum(px)) + " ") + this.formatNum(py)) + " c\n");
      }
      if ( cmd.type == "Q" ) {
        this.streamBuffer.writeString(((((((((((this.formatNum(px1) + " ") + this.formatNum(py1)) + " ") + this.formatNum(px1)) + " ") + this.formatNum(py1)) + " ") + this.formatNum(px)) + " ") + this.formatNum(py)) + " c\n");
      }
      if ( cmd.type == "Z" ) {
        this.streamBuffer.writeString("h\n");
      }
      i = i + 1;
    };
    this.streamBuffer.writeString("W n\n");
  };
  drawRoundedRectPath (x, y, w, h, radius) {
    let maxRadius = w / 2.0;
    if ( (h / 2.0) < maxRadius ) {
      maxRadius = h / 2.0;
    }
    let r = radius;
    if ( r > maxRadius ) {
      r = maxRadius;
    }
    if ( r <= 0.0 ) {
      this.streamBuffer.writeString(((((((this.formatNum(x) + " ") + this.formatNum(y)) + " ") + this.formatNum(w)) + " ") + this.formatNum(h)) + " re\n");
      return;
    }
    const k = 0.5523;
    const c = r * k;
    this.streamBuffer.writeString(((this.formatNum(x) + " ") + this.formatNum((y + r))) + " m\n");
    this.streamBuffer.writeString(((((((((((this.formatNum(x) + " ") + this.formatNum(((y + r) - c))) + " ") + this.formatNum(((x + r) - c))) + " ") + this.formatNum(y)) + " ") + this.formatNum((x + r))) + " ") + this.formatNum(y)) + " c\n");
    this.streamBuffer.writeString(((this.formatNum(((x + w) - r)) + " ") + this.formatNum(y)) + " l\n");
    this.streamBuffer.writeString(((((((((((this.formatNum((((x + w) - r) + c)) + " ") + this.formatNum(y)) + " ") + this.formatNum((x + w))) + " ") + this.formatNum(((y + r) - c))) + " ") + this.formatNum((x + w))) + " ") + this.formatNum((y + r))) + " c\n");
    this.streamBuffer.writeString(((this.formatNum((x + w)) + " ") + this.formatNum(((y + h) - r))) + " l\n");
    this.streamBuffer.writeString(((((((((((this.formatNum((x + w)) + " ") + this.formatNum((((y + h) - r) + c))) + " ") + this.formatNum((((x + w) - r) + c))) + " ") + this.formatNum((y + h))) + " ") + this.formatNum(((x + w) - r))) + " ") + this.formatNum((y + h))) + " c\n");
    this.streamBuffer.writeString(((this.formatNum((x + r)) + " ") + this.formatNum((y + h))) + " l\n");
    this.streamBuffer.writeString(((((((((((this.formatNum(((x + r) - c)) + " ") + this.formatNum((y + h))) + " ") + this.formatNum(x)) + " ") + this.formatNum((((y + h) - r) + c))) + " ") + this.formatNum(x)) + " ") + this.formatNum(((y + h) - r))) + " c\n");
    this.streamBuffer.writeString("h\n");
  };
  renderShadow (el, x, y, w, h, radius) {
    if ( el.shadowRadius.isSet == false ) {
      if ( el.shadowColor.isSet == false ) {
        return;
      }
    }
    let offsetX = 0.0;
    let offsetY = 0.0;
    if ( el.shadowOffsetX.isSet ) {
      offsetX = el.shadowOffsetX.pixels;
    }
    if ( el.shadowOffsetY.isSet ) {
      offsetY = 0.0 - el.shadowOffsetY.pixels;
    }
    let blur = 0.0;
    if ( el.shadowRadius.isSet ) {
      blur = el.shadowRadius.pixels;
    }
    let shadowColor = el.shadowColor;
    if ( shadowColor.isSet == false ) {
      shadowColor = EVGColor.rgba(0, 0, 0, 0.5);
    }
    let numLayers = 8;
    if ( blur < 5.0 ) {
      numLayers = 5;
    }
    if ( blur < 2.0 ) {
      numLayers = 3;
    }
    const baseAlpha = shadowColor.a / 255.0;
    const alphaPerLayer = baseAlpha / (numLayers);
    let i = 0;
    while (i < numLayers) {
      const layerRatio = ((numLayers - i)) / (numLayers);
      const spread = blur * layerRatio;
      const layerAlpha = alphaPerLayer * (1.0 + (layerRatio * 0.5));
      this.streamBuffer.writeString("q\n");
      const r = shadowColor.r / 255.0;
      const g = shadowColor.g / 255.0;
      const b = shadowColor.b / 255.0;
      const blendFactor = 1.0 - layerAlpha;
      let blendedR = (r * layerAlpha) + (1.0 * blendFactor);
      let blendedG = (g * layerAlpha) + (1.0 * blendFactor);
      let blendedB = (b * layerAlpha) + (1.0 * blendFactor);
      if ( blendedR > 1.0 ) {
        blendedR = 1.0;
      }
      if ( blendedG > 1.0 ) {
        blendedG = 1.0;
      }
      if ( blendedB > 1.0 ) {
        blendedB = 1.0;
      }
      this.streamBuffer.writeString(this.fillOp(blendedR, blendedG, blendedB));
      const sx = (x + offsetX) - spread;
      const sy = (y + offsetY) - spread;
      const sw = w + (spread * 2.0);
      const sh = h + (spread * 2.0);
      const sr = radius + spread;
      this.drawRoundedRectPath(sx, sy, sw, sh, sr);
      if ( i < (numLayers - 1) ) {
        const nextRatio = (((numLayers - i) - 1)) / (numLayers);
        const nextSpread = blur * nextRatio;
        const nx = (x + offsetX) - nextSpread;
        const ny = (y + offsetY) - nextSpread;
        const nw = w + (nextSpread * 2.0);
        const nh = h + (nextSpread * 2.0);
        const nr = radius + nextSpread;
        this.drawRoundedRectPath(nx, ny, nw, nh, nr);
      }
      this.streamBuffer.writeString("f*\n");
      this.streamBuffer.writeString("Q\n");
      i = i + 1;
    };
  };
  renderBackgroundWithRadius (x, y, w, h, color, radius) {
    this.streamBuffer.writeString("q\n");
    const gs = this.alphaState(color.a, 1.0);
    if ( (gs.length) > 0 ) {
      this.streamBuffer.writeString(gs);
    }
    const r = color.r / 255.0;
    const g = color.g / 255.0;
    const b = color.b / 255.0;
    this.streamBuffer.writeString(this.fillOp(r, g, b));
    this.drawRoundedRectPath(x, y, w, h, radius);
    this.streamBuffer.writeString("f\n");
    this.streamBuffer.writeString("Q\n");
  };
  renderBackground (x, y, w, h, color) {
    this.renderBackgroundWithRadius(x, y, w, h, color, 0.0);
  };
  renderGradientBackground (el, x, y, w, h, radius) {
    const gradient = el.backgroundGradient;
    const isLinear = gradient.includes("linear-gradient");
    const isRadial = gradient.includes("radial-gradient");
    if ( isLinear == false ) {
      if ( isRadial == false ) {
        return;
      }
    }
    const parenStart = gradient.indexOf("(");
    if ( parenStart < 0 ) {
      return;
    }
    const parenEnd = gradient.lastIndexOf(")");
    if ( parenEnd < 0 ) {
      return;
    }
    const content = gradient.substring((parenStart + 1), parenEnd );
    const parts = content.split(",");
    if ( (parts.length) < 2 ) {
      return;
    }
    const firstPart = (parts[0]).trim();
    let angle = 180.0;
    if ( isLinear ) {
      if ( firstPart.includes("deg") ) {
        const angleStr = firstPart.split("deg").join("");
        const angleVal = isNaN( parseFloat(angleStr) ) ? undefined : parseFloat(angleStr);
        if ( typeof(angleVal) != "undefined" ) {
          angle = angleVal;
        }
      }
    }
    let colors = [];
    let i = 1;
    while (i < (parts.length)) {
      const colorStr = (parts[i]).trim();
      const color = EVGColor.parse(colorStr);
      if ( color.isSet ) {
        colors.push(color);
      }
      i = i + 1;
    };
    if ( (colors.length) < 2 ) {
      if ( (colors.length) == 1 ) {
        const c = colors[0];
        this.renderBackgroundWithRadius(x, y, w, h, c, radius);
      }
      return;
    }
    this.streamBuffer.writeString("q\n");
    if ( radius > 0.0 ) {
      this.drawRoundedRectPath(x, y, w, h, radius);
      this.streamBuffer.writeString("W n\n");
    }
    const numSteps = 50;
    const radians = (angle * 3.14159265) / 180.0;
    let isHorizontal = false;
    while (angle < 0.0) {
      angle = angle + 360.0;
    };
    while (angle >= 360.0) {
      angle = angle - 360.0;
    };
    if ( (angle >= 45.0) && (angle < 135.0) ) {
      isHorizontal = true;
    }
    if ( (angle >= 225.0) && (angle < 315.0) ) {
      isHorizontal = true;
    }
    let stepIdx = 0;
    while (stepIdx < numSteps) {
      const t = (stepIdx) / ((numSteps - 1));
      const colorIdx = t * (((colors.length) - 1));
      const idx1 = Math.floor( colorIdx);
      let idx2 = idx1 + 1;
      if ( idx2 >= (colors.length) ) {
        idx2 = (colors.length) - 1;
      }
      const localT = colorIdx - (idx1);
      const c1 = colors[idx1];
      const c2 = colors[idx2];
      const r = ((c1.r * (1.0 - localT)) + (c2.r * localT)) / 255.0;
      const g = ((c1.g * (1.0 - localT)) + (c2.g * localT)) / 255.0;
      const b = ((c1.b * (1.0 - localT)) + (c2.b * localT)) / 255.0;
      this.streamBuffer.writeString(this.fillOp(r, g, b));
      if ( isHorizontal ) {
        const stripW = w / (numSteps);
        let stripX = x;
        if ( (angle >= 225.0) && (angle < 315.0) ) {
          stripX = (x + w) - (stripW * ((stepIdx + 1)));
        } else {
          stripX = x + (stripW * (stepIdx));
        }
        this.streamBuffer.writeString(((((((this.formatNum(stripX) + " ") + this.formatNum(y)) + " ") + this.formatNum((stripW + 0.5))) + " ") + this.formatNum(h)) + " re\n");
      } else {
        const stripH = h / (numSteps);
        let stripY = y;
        if ( (angle >= 135.0) && (angle < 225.0) ) {
          stripY = (y + h) - (stripH * ((stepIdx + 1)));
        } else {
          stripY = y + (stripH * (stepIdx));
        }
        this.streamBuffer.writeString(((((((this.formatNum(x) + " ") + this.formatNum(stripY)) + " ") + this.formatNum(w)) + " ") + this.formatNum((stripH + 0.5))) + " re\n");
      }
      this.streamBuffer.writeString("f\n");
      stepIdx = stepIdx + 1;
    };
    this.streamBuffer.writeString("Q\n");
  };
  renderBorderWithRadius (el, x, y, w, h, radius) {
    const borderWidth = el.effectiveBorderWidthPx();
    if ( borderWidth <= 0.0 ) {
      return;
    }
    const borderColor = el.effectiveBorderColor();
    this.streamBuffer.writeString("q\n");
    const r = borderColor.r / 255.0;
    const g = borderColor.g / 255.0;
    const b = borderColor.b / 255.0;
    this.streamBuffer.writeString(this.strokeOp(r, g, b));
    this.streamBuffer.writeString(this.formatNum(borderWidth) + " w\n");
    this.drawRoundedRectPath(x, y, w, h, radius);
    this.streamBuffer.writeString("S\n");
    this.streamBuffer.writeString("Q\n");
  };
  renderBorder (el, x, y, w, h) {
    const borderWidth = el.effectiveBorderWidthPx();
    if ( borderWidth <= 0.0 ) {
      return;
    }
    const borderColor = el.effectiveBorderColor();
    this.streamBuffer.writeString("q\n");
    const r = borderColor.r / 255.0;
    const g = borderColor.g / 255.0;
    const b = borderColor.b / 255.0;
    this.streamBuffer.writeString(this.strokeOp(r, g, b));
    this.streamBuffer.writeString(this.formatNum(borderWidth) + " w\n");
    this.streamBuffer.writeString(((((((this.formatNum(x) + " ") + this.formatNum(y)) + " ") + this.formatNum(w)) + " ") + this.formatNum(h)) + " re\n");
    this.streamBuffer.writeString("S\n");
    this.streamBuffer.writeString("Q\n");
  };
  renderText (el, x, y, w, h) {
    const text = this.getTextContent(el);
    if ( (text.length) == 0 ) {
      return;
    }
    let fontSize = 14.0;
    if ( el.fontSize.isSet ) {
      fontSize = el.fontSize.pixels;
    }
    let color = el.color;
    if ( color.isSet == false ) {
      color = EVGColor.black();
    }
    let lineHeight = el.lineHeight;
    if ( lineHeight <= 0.0 ) {
      lineHeight = 1.2;
    }
    const lineSpacing = fontSize * lineHeight;
    let fontFamily = el.effectiveFontFamily();
    if ( (fontFamily.length) == 0 ) {
      fontFamily = "Helvetica";
    }
    const lines = this.wrapText(text, w, fontSize, fontFamily);
    const fontName = this.getPdfFontName(fontFamily);
    const ttfFontDebug = this.fontManager.getFont(fontFamily);
    if ( ttfFontDebug.unitsPerEm > 0 ) {
      if ( this.debug ) {
        console.log(((((("PDF Font: requested='" + fontFamily) + "' -> resolved='") + ttfFontDebug.fontFamily) + "' style='") + ttfFontDebug.fontStyle) + "'");
      }
    } else {
      console.log(("PDF Font: requested='" + fontFamily) + "' -> FALLBACK (font not found)");
    }
    let hasShadow = false;
    let shadowOffsetX = 0.0;
    let shadowOffsetY = 0.0;
    let shadowBlur = 0.0;
    let shadowColor = EVGColor.rgba(0, 0, 0, 0.5);
    if ( el.shadowRadius.isSet || el.shadowColor.isSet ) {
      hasShadow = true;
      if ( el.shadowOffsetX.isSet ) {
        shadowOffsetX = el.shadowOffsetX.pixels;
      }
      if ( el.shadowOffsetY.isSet ) {
        shadowOffsetY = 0.0 - el.shadowOffsetY.pixels;
      }
      if ( el.shadowRadius.isSet ) {
        shadowBlur = el.shadowRadius.pixels;
      }
      if ( el.shadowColor.isSet ) {
        shadowColor = el.shadowColor;
      }
    }
    let lineY = (y + h) - fontSize;
    let i = 0;
    while (i < (lines.length)) {
      const line = lines[i];
      let textX = x;
      if ( el.textAlign == "center" ) {
        const textWidth = this.measurer.measureTextWidth(line, fontFamily, fontSize);
        textX = x + ((w - textWidth) / 2.0);
      }
      if ( el.textAlign == "right" ) {
        const textWidth_1 = this.measurer.measureTextWidth(line, fontFamily, fontSize);
        textX = (x + w) - textWidth_1;
      }
      if ( hasShadow ) {
        let numPasses = 1;
        if ( shadowBlur > 1.0 ) {
          numPasses = 3;
        }
        let pass = 0;
        while (pass < numPasses) {
          let blurOffset = 0.0;
          if ( numPasses > 1 ) {
            blurOffset = (shadowBlur * 0.3) * (pass);
          }
          const shadowAlpha = (shadowColor.a / 255.0) / (numPasses);
          const blendFactor = 1.0 - shadowAlpha;
          const sr = ((shadowColor.r / 255.0) * shadowAlpha) + (1.0 * blendFactor);
          const sg = ((shadowColor.g / 255.0) * shadowAlpha) + (1.0 * blendFactor);
          const sb = ((shadowColor.b / 255.0) * shadowAlpha) + (1.0 * blendFactor);
          const shadowX = (textX + shadowOffsetX) + blurOffset;
          const shadowY = (lineY + shadowOffsetY) - blurOffset;
          const shSegs = this.splitLine(line, fontFamily, fontSize, shadowX);
          let shi = 0;
          while (shi < (shSegs.length)) {
            const shSeg = shSegs[shi];
            this.streamBuffer.writeString("BT\n");
            this.streamBuffer.writeString(((this.segmentFontName(shSeg) + " ") + this.formatNum(fontSize)) + " Tf\n");
            this.streamBuffer.writeString(this.fillOp(sr, sg, sb));
            this.streamBuffer.writeString(((this.formatNum(shSeg.x) + " ") + this.formatNum(shadowY)) + " Td\n");
            this.streamBuffer.writeString(this.segmentShowOperator(shSeg) + "\n");
            this.streamBuffer.writeString("ET\n");
            shi = shi + 1;
          };
          pass = pass + 1;
        };
      }
      const r = color.r / 255.0;
      const g = color.g / 255.0;
      const b = color.b / 255.0;
      const ec = el.effectiveEmojiColor();
      const er = ec.r / 255.0;
      const eg = ec.g / 255.0;
      const eb = ec.b / 255.0;
      const segs = this.splitLine(line, fontFamily, fontSize, textX);
      let sgi = 0;
      while (sgi < (segs.length)) {
        const seg = segs[sgi];
        let sr_1 = r;
        let sg_1 = g;
        let sb_1 = b;
        if ( seg.isCid ) {
          sr_1 = er;
          sg_1 = eg;
          sb_1 = eb;
        }
        this.streamBuffer.writeString("BT\n");
        this.streamBuffer.writeString(((this.segmentFontName(seg) + " ") + this.formatNum(fontSize)) + " Tf\n");
        this.streamBuffer.writeString(this.fillOp(sr_1, sg_1, sb_1));
        this.streamBuffer.writeString(((this.formatNum(seg.x) + " ") + this.formatNum(lineY)) + " Td\n");
        this.streamBuffer.writeString(this.segmentShowOperator(seg) + "\n");
        this.streamBuffer.writeString("ET\n");
        sgi = sgi + 1;
      };
      lineY = lineY - lineSpacing;
      i = i + 1;
    };
  };
  writeCidFontObjects (pdf, objectOffsets) {
    this.cidFontObjNums.length = 0;
    let fi = 0;
    while (fi < (this.usedCidFonts.length)) {
      const family = this.usedCidFonts[fi];
      const ttf = this.fontManager.getFont(family);
      if ( ttf.isLoaded() ) {
        let subsetGids = [];
        let gi = 0;
        while (gi < (this.cidUsedGid.length)) {
          if ( (this.cidUsedFont[gi]) == fi ) {
            subsetGids.push(this.cidUsedGid[gi]);
          }
          gi = gi + 1;
        };
        let fontFileData = TTFSubset.build(ttf, subsetGids);
        if ( (fontFileData.byteLength) == 0 ) {
          fontFileData = ttf.getFontData();
        }
        const fontFileLen = fontFileData.byteLength;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString(((("<< /Length " + ((fontFileLen.toString()))) + " /Length1 ") + ((fontFileLen.toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeBuffer(fontFileData);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const fontFileObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        const psName = this.sanitizeFontName(ttf.fontFamily);
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /FontDescriptor");
        pdf.writeString(" /FontName /" + psName);
        pdf.writeString(" /Flags 4");
        pdf.writeString((((" /FontBBox [0 " + ((ttf.descender.toString()))) + " 1000 ") + ((ttf.ascender.toString()))) + "]");
        pdf.writeString(" /ItalicAngle 0");
        pdf.writeString(" /Ascent " + ((ttf.ascender.toString())));
        pdf.writeString(" /Descent " + ((ttf.descender.toString())));
        pdf.writeString(" /CapHeight " + ((ttf.ascender.toString())));
        pdf.writeString(" /StemV 80");
        pdf.writeString((" /FontFile2 " + ((fontFileObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        const descObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        const cidToUni = this.cidToUnicodeCMap(fi);
        pdf.writeString(("<< /Length " + (((cidToUni.length).toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeString(cidToUni);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const toUniObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font /Subtype /CIDFontType2");
        pdf.writeString(" /BaseFont /" + psName);
        pdf.writeString(" /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>");
        pdf.writeString((" /FontDescriptor " + ((descObjNum.toString()))) + " 0 R");
        pdf.writeString(" /DW 1000");
        pdf.writeString(" /W [");
        let wi = 0;
        while (wi < (this.cidUsedGid.length)) {
          if ( (this.cidUsedFont[wi]) == fi ) {
            const gid = this.cidUsedGid[wi];
            const wUnits = ttf.getGlyphWidth(gid);
            const scaled = Math.floor( (((wUnits) * 1000.0) / (ttf.unitsPerEm)));
            pdf.writeString((((" " + ((gid.toString()))) + " [") + ((scaled.toString()))) + "]");
          }
          wi = wi + 1;
        };
        pdf.writeString(" ]");
        pdf.writeString(" /CIDToGIDMap /Identity");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        const cidFontObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font /Subtype /Type0");
        pdf.writeString(" /BaseFont /" + psName);
        pdf.writeString(" /Encoding /Identity-H");
        pdf.writeString((" /DescendantFonts [" + ((cidFontObjNum.toString()))) + " 0 R]");
        pdf.writeString((" /ToUnicode " + ((toUniObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        this.cidFontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      } else {
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
        pdf.writeString("endobj\n\n");
        this.cidFontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      }
      fi = fi + 1;
    };
  };
  cidToUnicodeCMap (fontIdx) {
    let entries = [];
    let i = 0;
    while (i < (this.cidUsedGid.length)) {
      if ( (this.cidUsedFont[i]) == fontIdx ) {
        const gid = this.cidUsedGid[i];
        const text = this.cidUsedText[i];
        let dst = "";
        let ci = 0;
        while (ci < (text.length)) {
          dst = dst + this.utf16BeHex(EVGCodepoint.codeAt(text, ci));
          ci = ci + EVGCodepoint.unitsAt(text, ci);
        };
        entries.push(((("<" + this.toHex4(gid)) + "> <") + dst) + ">");
      }
      i = i + 1;
    };
    let cmap = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n";
    cmap = cmap + "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n";
    cmap = cmap + "/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n";
    cmap = cmap + "1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n";
    const n = entries.length;
    let start = 0;
    while (start < n) {
      let end = start + 100;
      if ( end > n ) {
        end = n;
      }
      cmap = (cmap + (((end - start).toString()))) + " beginbfchar\n";
      let j = start;
      while (j < end) {
        cmap = (cmap + (entries[j])) + "\n";
        j = j + 1;
      };
      cmap = cmap + "endbfchar\n";
      start = end;
    };
    cmap = cmap + "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
    return cmap;
  };
  utf16BeHex (cp) {
    if ( cp < 65536 ) {
      return this.toHex4(cp);
    }
    const rel = cp - 65536;
    const hi = 55296 + (Math.floor( (rel / 1024)));
    const lo = 56320 + (rel % 1024);
    return this.toHex4(hi) + this.toHex4(lo);
  };
  segmentWidth (seg, fontSize) {
    if ( seg.isCid ) {
      const face = this.fontManager.getFont(seg.family);
      if ( face.isLoaded() ) {
        return face.measureShapedText(seg.text, fontSize);
      }
    }
    return this.measurer.measureTextWidth(seg.text, seg.family, fontSize);
  };
  segmentFontName (seg) {
    if ( seg.isCid ) {
      return this.getCidFontName(seg.family);
    }
    return this.getPdfFontName(seg.family);
  };
  segmentShowOperator (seg) {
    if ( seg.isCid ) {
      return this.cidShowOperator(seg.text, seg.family);
    }
    return this.textShowOperator(seg.text, seg.family);
  };
  textShowOperator (line, fontFamily) {
    const font = this.fontManager.getFont(fontFamily);
    const plain = ("(" + this.escapeText(line)) + ") Tj";
    if ( font.hasKerning == false ) {
      return plain;
    }
    if ( font.unitsPerEm <= 0 ) {
      return plain;
    }
    const __len = line.length;
    if ( __len < 2 ) {
      return plain;
    }
    let out = "[";
    let seg = "";
    let kerns = 0;
    let i = 0;
    let prevCp = 0;
    let firstCp = true;
    while (i < __len) {
      const ch = EVGCodepoint.codeAt(line, i);
      const cpStep = EVGCodepoint.unitsAt(line, i);
      if ( firstCp == false ) {
        const k = font.kernUnits(prevCp, ch);
        if ( k != 0 ) {
          out = ((out + "(") + this.escapeText(seg)) + ")";
          seg = "";
          const num = ((0.0 - 1000.0) * (k)) / (font.unitsPerEm);
          out = ((out + " ") + this.formatNum(num)) + " ";
          kerns = kerns + 1;
        }
      }
      prevCp = ch;
      firstCp = false;
      seg = seg + EVGCodepoint.toStr(ch);
      i = i + cpStep;
    };
    if ( kerns == 0 ) {
      return plain;
    }
    out = ((out + "(") + this.escapeText(seg)) + ")] TJ";
    return out;
  };
  wrapText (text, maxWidth, fontSize, fontFamily) {
    const engine = this.layout.getTextEngine();
    return engine.breakToStrings(text, fontFamily, fontSize, maxWidth);
  };
  renderDivider (el, x, y, w, h) {
    let color = el.color;
    if ( color.isSet == false ) {
      color = EVGColor.rgb(200, 200, 200);
    }
    const lineY = y + (h / 2.0);
    this.streamBuffer.writeString("q\n");
    const r = color.r / 255.0;
    const g = color.g / 255.0;
    const b = color.b / 255.0;
    this.streamBuffer.writeString(this.strokeOp(r, g, b));
    this.streamBuffer.writeString("1 w\n");
    this.streamBuffer.writeString(((this.formatNum(x) + " ") + this.formatNum(lineY)) + " m\n");
    this.streamBuffer.writeString(((this.formatNum((x + w)) + " ") + this.formatNum(lineY)) + " l\n");
    this.streamBuffer.writeString("S\n");
    this.streamBuffer.writeString("Q\n");
  };
  getTextContent (el) {
    if ( (el.textContent.length) > 0 ) {
      return el.textContent;
    }
    let result = "";
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      if ( child.tagName == "text" ) {
        const childText = child.textContent;
        if ( (childText.length) > 0 ) {
          if ( (result.length) > 0 ) {
            const lastChar = result.charCodeAt(((result.length) - 1) );
            const firstChar = childText.charCodeAt(0 );
            if ( (lastChar != 32) && (firstChar != 32) ) {
              result = result + " ";
            }
          }
          result = result + childText;
        }
      }
      i = i + 1;
    };
    return result;
  };
  estimateTextWidth (text, fontSize) {
    return this.measurer.measureTextWidth(text, "Helvetica", fontSize);
  };
  toOctalEscape (ch) {
    const d0 = ch % 8;
    const t1 = Math.floor((ch / 8));
    const d1 = t1 % 8;
    const d2 = Math.floor((t1 / 8));
    return (("\\" + ((d2.toString()))) + ((d1.toString()))) + ((d0.toString()));
  };
  toUnicodeCMap () {
    let cmap = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n";
    cmap = cmap + "2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n";
    cmap = cmap + "27 beginbfchar\n<80> <20AC>\n<82> <201A>\n<83> <0192>\n<84> <201E>\n<85> <2026>\n<86> <2020>\n<87> <2021>\n<88> <02C6>\n<89> <2030>\n<8A> <0160>\n<8B> <2039>\n<8C> <0152>\n<8E> <017D>\n<91> <2018>\n<92> <2019>\n<93> <201C>\n<94> <201D>\n<95> <2022>\n<96> <2013>\n<97> <2014>\n<98> <02DC>\n<99> <2122>\n<9A> <0161>\n<9B> <203A>\n<9C> <0153>\n<9E> <017E>\n<9F> <0178>\nendbfchar\n";
    cmap = cmap + "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
    return cmap;
  };
  noteUnsupportedGlyph (ch, context) {
    let i = 0;
    while (i < (this.unsupportedGlyphs.length)) {
      if ( (this.unsupportedGlyphs[i]) == ch ) {
        return;
      }
      i = i + 1;
    };
    this.unsupportedGlyphs.push(ch);
    this.unsupportedContexts.push(context);
  };
  unsupportedGlyphCount () {
    return this.unsupportedGlyphs.length;
  };
  unsupportedGlyphReport (i) {
    const ch = this.unsupportedGlyphs[i];
    return ((("U+" + this.toHex4(ch)) + " in \"") + (this.unsupportedContexts[i])) + "\"";
  };
  toHex4 (v) {
    const digits = "0123456789ABCDEF";
    let nibbles = [];
    let n = v;
    let i = 0;
    while (i < 4) {
      nibbles.push(n % 16);
      n = Math.floor( (n / 16));
      i = i + 1;
    };
    let out = "";
    let j = 3;
    while (j >= 0) {
      const d = nibbles[j];
      out = out + (digits.substring(d, (d + 1) ));
      j = j - 1;
    };
    return out;
  };
  beginBleedShift () {
    if ( this.bleed > 0.0 ) {
      this.streamBuffer.writeString("q\n");
      this.streamBuffer.writeString(((("1 0 0 1 " + this.formatNum(this.bleed)) + " ") + this.formatNum(this.bleed)) + " cm\n");
    }
  };
  endBleedShift () {
    if ( this.bleed > 0.0 ) {
      this.streamBuffer.writeString("Q\n");
    }
  };
  setBleed (b) {
    this.bleed = b;
  };
  pageBoxes (trimW, trimH) {
    if ( this.bleed <= 0.0 ) {
      return (((" /MediaBox [0 0 " + this.formatNum(trimW)) + " ") + this.formatNum(trimH)) + "]";
    }
    const sheetW = trimW + (this.bleed * 2.0);
    const sheetH = trimH + (this.bleed * 2.0);
    let out = (((" /MediaBox [0 0 " + this.formatNum(sheetW)) + " ") + this.formatNum(sheetH)) + "]";
    out = out + ((((" /BleedBox [0 0 " + this.formatNum(sheetW)) + " ") + this.formatNum(sheetH)) + "]");
    const trimX2 = this.bleed + trimW;
    const trimY2 = this.bleed + trimH;
    out = out + ((((((((" /TrimBox [" + this.formatNum(this.bleed)) + " ") + this.formatNum(this.bleed)) + " ") + this.formatNum(trimX2)) + " ") + this.formatNum(trimY2)) + "]");
    return out;
  };
  escapeText (text) {
    let result = "";
    const __len = text.length;
    let i = 0;
    while (i < __len) {
      const ch = EVGCodepoint.codeAt(text, i);
      const cpStep = EVGCodepoint.unitsAt(text, i);
      if ( ch == 40 ) {
        result = result + "\\(";
      } else {
        if ( ch == 41 ) {
          result = result + "\\)";
        } else {
          if ( ch == 92 ) {
            result = result + "\\\\";
          } else {
            if ( ch < 32 ) {
              result = result + " ";
            } else {
              if ( ch < 128 ) {
                result = result + (String.fromCharCode(ch));
              } else {
                const enc = Utf8.toWinAnsi(ch);
                if ( enc >= 0 ) {
                  result = result + this.toOctalEscape(enc);
                } else {
                  this.noteUnsupportedGlyph(ch, text);
                  result = result + "?";
                }
              }
            }
          }
        }
      }
      i = i + cpStep;
    };
    return result;
  };
  setColorMode (mode) {
    this.colorMode = mode;
  };
  setPdfxProfile (profile) {
    this.pdfxProfile = profile;
  };
  setOutputIntent (identifier, info) {
    this.outputIntent = identifier;
    this.outputIntentInfo = info;
  };
  setDocumentInfo (title, author) {
    this.docTitle = title;
    this.docAuthor = author;
  };
  isCmyk () {
    return this.colorMode == "cmyk";
  };
  extGStateDict () {
    const n = this.alphaFills.length;
    if ( n == 0 ) {
      return "";
    }
    let out = " /ExtGState <<";
    let i = 0;
    while (i < n) {
      const fa = this.alphaFills[i];
      const sa = this.alphaStrokes[i];
      out = ((out + " /GS") + (((i + 1).toString()))) + " << /Type /ExtGState";
      out = (out + " /ca ") + this.formatNum(fa);
      out = (out + " /CA ") + this.formatNum(sa);
      out = out + " >>";
      i = i + 1;
    };
    return out + " >>";
  };
  alphaState (fillAlpha, strokeAlpha) {
    const fa = EVGPDFRenderer.clampAlpha(fillAlpha);
    const sa = EVGPDFRenderer.clampAlpha(strokeAlpha);
    if ( fa >= 0.999 ) {
      if ( sa >= 0.999 ) {
        return "";
      }
    }
    let i = 0;
    while (i < (this.alphaFills.length)) {
      const haveF = this.alphaFills[i];
      const haveS = this.alphaStrokes[i];
      if ( EVGPDFRenderer.sameAlpha(haveF, fa) ) {
        if ( EVGPDFRenderer.sameAlpha(haveS, sa) ) {
          return ("/GS" + (((i + 1).toString()))) + " gs\n";
        }
      }
      i = i + 1;
    };
    this.alphaFills.push(fa);
    this.alphaStrokes.push(sa);
    return ("/GS" + (((this.alphaFills.length).toString()))) + " gs\n";
  };
  fillOp (r, g, b) {
    if ( this.colorMode == "cmyk" ) {
      const v = EVGPDFRenderer.toCmyk(r, g, b);
      const c = this.formatNum((v[0]));
      const m = this.formatNum((v[1]));
      const y = this.formatNum((v[2]));
      const k = this.formatNum((v[3]));
      return ((((((c + " ") + m) + " ") + y) + " ") + k) + " k\n";
    }
    return ((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " rg\n";
  };
  strokeOp (r, g, b) {
    if ( this.colorMode == "cmyk" ) {
      const v = EVGPDFRenderer.toCmyk(r, g, b);
      const c = this.formatNum((v[0]));
      const m = this.formatNum((v[1]));
      const y = this.formatNum((v[2]));
      const k = this.formatNum((v[3]));
      return ((((((c + " ") + m) + " ") + y) + " ") + k) + " K\n";
    }
    return ((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " RG\n";
  };
  headerLine () {
    if ( (this.pdfxProfile.length) > 0 ) {
      return "%PDF-1.6\n";
    }
    return "%PDF-1.5\n";
  };
  wantsFinishing () {
    return (this.pdfxProfile.length) > 0;
  };
  xmpPacket () {
    const title = EVGPDFRenderer.xmlEscape(this.docTitle);
    const author = EVGPDFRenderer.xmlEscape(this.docAuthor);
    const prod = EVGPDFRenderer.xmlEscape(this.producer);
    let out = "<?xpacket begin=\"\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>\n";
    out = out + "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">\n";
    out = out + " <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">\n";
    out = out + "  <rdf:Description rdf:about=\"\" xmlns:pdfxid=\"http://www.npes.org/pdfx/ns/id/\">\n";
    out = ((out + "   <pdfxid:GTS_PDFXVersion>PDF/") + this.pdfxProfile) + "</pdfxid:GTS_PDFXVersion>\n";
    out = out + "  </rdf:Description>\n";
    out = out + "  <rdf:Description rdf:about=\"\" xmlns:pdf=\"http://ns.adobe.com/pdf/1.3/\">\n";
    out = ((out + "   <pdf:Producer>") + prod) + "</pdf:Producer>\n";
    out = out + "   <pdf:Trapped>False</pdf:Trapped>\n";
    out = out + "  </rdf:Description>\n";
    out = out + "  <rdf:Description rdf:about=\"\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\">\n";
    out = ((out + "   <xmp:CreatorTool>") + prod) + "</xmp:CreatorTool>\n";
    out = out + "  </rdf:Description>\n";
    out = out + "  <rdf:Description rdf:about=\"\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\">\n";
    out = out + "   <dc:format>application/pdf</dc:format>\n";
    if ( (title.length) > 0 ) {
      out = ((out + "   <dc:title><rdf:Alt><rdf:li xml:lang=\"x-default\">") + title) + "</rdf:li></rdf:Alt></dc:title>\n";
    }
    if ( (author.length) > 0 ) {
      out = ((out + "   <dc:creator><rdf:Seq><rdf:li>") + author) + "</rdf:li></rdf:Seq></dc:creator>\n";
    }
    out = out + "  </rdf:Description>\n";
    out = out + " </rdf:RDF>\n";
    out = out + "</x:xmpmeta>\n";
    out = out + "<?xpacket end=\"w\"?>\n";
    return out;
  };
  finishingReport () {
    if ( this.wantsFinishing() == false ) {
      return "";
    }
    let out = "";
    out = ((((((out + "  PDF/") + this.pdfxProfile) + ": output intent ") + this.outputIntent) + ", colours ") + this.colorMode) + ", Trapped False\n";
    if ( this.isCmyk() ) {
      if ( this.rgbImages > 0 ) {
        out = ((out + "  WARNING: ") + ((this.rgbImages.toString()))) + " image(s) are embedded as untagged DeviceRGB while the\n";
        out = out + "  output intent is a CMYK condition. Text and vectors are separated; the\n";
        out = ((out + "  pictures are not, and PDF/") + this.pdfxProfile) + " does not allow that combination.\n";
        out = out + "  Either supply the pictures already in CMYK, or keep the whole job in RGB\n";
        out = out + "  with an RGB output intent - which several print-on-demand services\n";
        out = out + "  prefer - rather than shipping a file that only claims to be separated.\n";
      }
    }
    return out;
  };
  conformanceIssues () {
    if ( this.wantsFinishing() == false ) {
      return 0;
    }
    if ( this.isCmyk() ) {
      return this.rgbImages;
    }
    return 0;
  };
  outputIntentBody () {
    let out = "<< /Type /OutputIntent /S /GTS_PDFX";
    out = (out + " /OutputConditionIdentifier ") + EVGPDFRenderer.pdfTextString(this.outputIntent);
    out = (out + " /OutputCondition ") + EVGPDFRenderer.pdfTextString(this.outputIntentInfo);
    out = (out + " /Info ") + EVGPDFRenderer.pdfTextString(this.outputIntentInfo);
    out = out + " /RegistryName (http://www.color.org) >>\n";
    return out;
  };
  infoBody () {
    let out = "<< /Producer " + EVGPDFRenderer.pdfTextString(this.producer);
    if ( (this.docTitle.length) > 0 ) {
      out = (out + " /Title ") + EVGPDFRenderer.pdfTextString(this.docTitle);
    }
    if ( (this.docAuthor.length) > 0 ) {
      out = (out + " /Author ") + EVGPDFRenderer.pdfTextString(this.docAuthor);
    }
    out = out + " /Trapped /False >>\n";
    return out;
  };
  catalogBody (pagesNum, metadataNum, intentNum) {
    let out = ("<< /Type /Catalog /Pages " + ((pagesNum.toString()))) + " 0 R";
    if ( this.wantsFinishing() ) {
      out = ((out + " /Metadata ") + ((metadataNum.toString()))) + " 0 R";
      out = ((out + " /OutputIntents [") + ((intentNum.toString()))) + " 0 R]";
    }
    out = out + " >>\n";
    return out;
  };
  trailerBody (size, catalogNum, infoNum) {
    let out = ((("<< /Size " + ((size.toString()))) + " /Root ") + ((catalogNum.toString()))) + " 0 R";
    if ( this.wantsFinishing() ) {
      out = ((out + " /Info ") + ((infoNum.toString()))) + " 0 R";
    }
    out = out + " >>\n";
    return out;
  };
  formatNum (n) {
    let mag = n;
    if ( mag < 0.0 ) {
      mag = 0.0 - mag;
    }
    if ( mag < 0.000001 ) {
      return "0";
    }
    const result = (n.toString());
    return result;
  };
  padLeft (s, __len, padChar) {
    let result = s;
    while ((result.length) < __len) {
      result = padChar + result;
    };
    return result;
  };
  sanitizeFontName (name) {
    let result = "";
    const __len = name.length;
    let i = 0;
    while (i < __len) {
      const ch = name.charCodeAt(i );
      if ( (((ch >= 65) && (ch <= 90)) || ((ch >= 97) && (ch <= 122))) || ((ch >= 48) && (ch <= 57)) ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    return result;
  };
}
EVGPDFRenderer.faceKey = function(f) {
  return (f.fontFamily + "/") + f.fontStyle;
};
EVGPDFRenderer.toCmyk = function(r, g, b) {
  let out = [];
  const c = 1.0 - r;
  const m = 1.0 - g;
  const y = 1.0 - b;
  let k = c;
  if ( m < k ) {
    k = m;
  }
  if ( y < k ) {
    k = y;
  }
  if ( k >= 0.9999 ) {
    out.push(0.0);
    out.push(0.0);
    out.push(0.0);
    out.push(1.0);
    return out;
  }
  const span = 1.0 - k;
  out.push((c - k) / span);
  out.push((m - k) / span);
  out.push((y - k) / span);
  out.push(k);
  return out;
};
EVGPDFRenderer.clampAlpha = function(a) {
  if ( a < 0.0 ) {
    return 0.0;
  }
  if ( a > 1.0 ) {
    return 1.0;
  }
  return a;
};
EVGPDFRenderer.sameAlpha = function(a, b) {
  let d = a - b;
  if ( d < 0.0 ) {
    d = 0.0 - d;
  }
  return d < 0.002;
};
EVGPDFRenderer.pdfString = function(v) {
  let out = "";
  const n = v.length;
  let i = 0;
  while (i < n) {
    const ch = v.substring(i, (i + 1) );
    if ( ch == "(" ) {
      out = out + "\\(";
    } else {
      if ( ch == ")" ) {
        out = out + "\\)";
      } else {
        if ( ch == "\\" ) {
          out = out + "\\\\";
        } else {
          out = out + ch;
        }
      }
    }
    i = i + 1;
  };
  return out;
};
EVGPDFRenderer.xmlEscape = function(v) {
  let out = "";
  const n = v.length;
  let i = 0;
  while (i < n) {
    const code = v.charCodeAt(i );
    if ( code == 38 ) {
      out = out + "&amp;";
    } else {
      if ( code == 60 ) {
        out = out + "&lt;";
      } else {
        if ( code == 62 ) {
          out = out + "&gt;";
        } else {
          if ( code < 127 ) {
            out = out + (v.substring(i, (i + 1) ));
          } else {
            let point = code;
            const isHigh = (code >= 55296) && (code <= 56319);
            if ( isHigh ) {
              if ( (i + 1) < n ) {
                const low = v.charCodeAt((i + 1) );
                const isLow = (low >= 56320) && (low <= 57343);
                if ( isLow ) {
                  const hi = (code - 55296) * 1024;
                  const lo = low - 56320;
                  point = (hi + lo) + 65536;
                  i = i + 1;
                }
              }
            }
            out = ((out + "&#") + ((point.toString()))) + ";";
          }
        }
      }
    }
    i = i + 1;
  };
  return out;
};
EVGPDFRenderer.pdfTextString = function(v) {
  const n = v.length;
  let ascii = true;
  let i = 0;
  while (i < n) {
    const code = v.charCodeAt(i );
    if ( code > 126 ) {
      ascii = false;
    }
    i = i + 1;
  };
  if ( ascii ) {
    return ("(" + EVGPDFRenderer.pdfString(v)) + ")";
  }
  let out = "<FEFF";
  let k = 0;
  while (k < n) {
    const unit = v.charCodeAt(k );
    out = out + EVGPDFRenderer.hex4(unit);
    k = k + 1;
  };
  return out + ">";
};
EVGPDFRenderer.hex4 = function(v) {
  const digits = "0123456789ABCDEF";
  let out = "";
  let shift = 12;
  while (shift >= 0) {
    const nib = (((v / EVGPDFRenderer.pow16(shift)) | 0)) % 16;
    out = out + (digits.substring(nib, (nib + 1) ));
    shift = shift - 4;
  };
  return out;
};
EVGPDFRenderer.pow16 = function(shift) {
  if ( shift <= 0 ) {
    return 1;
  }
  if ( shift == 4 ) {
    return 16;
  }
  if ( shift == 8 ) {
    return 256;
  }
  return 4096;
};
EVGPDFRenderer.byteLength = function(v) {
  const scratch = new GrowableBuffer();
  scratch.writeString(v);
  return (scratch).size();
};
class EVGStyleDecl  {
  constructor() {
    this.name = "";
    this.value = "";
    this.name = "";
    this.value = "";
  }
}
class EVGMediaQuery  {
  constructor() {
    this.minWidth = 0.0 - 1.0;
    this.maxWidth = 0.0 - 1.0;
    this.minHeight = 0.0 - 1.0;
    this.maxHeight = 0.0 - 1.0;
    this.orientation = "";
    this.pointer = 0;
    this.broken = false;
  }
  isEmpty () {
    if ( this.broken ) {
      return false;
    }
    if ( this.minWidth >= 0.0 ) {
      return false;
    }
    if ( this.maxWidth >= 0.0 ) {
      return false;
    }
    if ( this.minHeight >= 0.0 ) {
      return false;
    }
    if ( this.maxHeight >= 0.0 ) {
      return false;
    }
    if ( (this.orientation.length) > 0 ) {
      return false;
    }
    if ( this.pointer != 0 ) {
      return false;
    }
    return true;
  };
  matches (w, h, coarse) {
    if ( this.broken ) {
      return false;
    }
    if ( this.isEmpty() ) {
      return true;
    }
    if ( w <= 0.0 ) {
      return false;
    }
    if ( this.minWidth >= 0.0 ) {
      if ( w < this.minWidth ) {
        return false;
      }
    }
    if ( this.maxWidth >= 0.0 ) {
      if ( w > this.maxWidth ) {
        return false;
      }
    }
    if ( this.minHeight >= 0.0 ) {
      if ( h < this.minHeight ) {
        return false;
      }
    }
    if ( this.maxHeight >= 0.0 ) {
      if ( h > this.maxHeight ) {
        return false;
      }
    }
    if ( (this.orientation.length) > 0 ) {
      let want = "landscape";
      if ( h > w ) {
        want = "portrait";
      }
      if ( this.orientation != want ) {
        return false;
      }
    }
    if ( this.pointer == 1 ) {
      if ( coarse == false ) {
        return false;
      }
    }
    if ( this.pointer == 2 ) {
      if ( coarse ) {
        return false;
      }
    }
    return true;
  };
}
class EVGStyleRule  {
  constructor() {
    this.theme = "";
    this.className = "";
    this.decls = [];
    this.order = 0;
    this.media = new EVGMediaQuery();
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
    this.pendingMedia = new EVGMediaQuery();
    this.viewportW = 0.0;
    this.viewportH = 0.0;
    this.coarsePointer = false;
    this.ruleCounter = 0;
  }
  setViewport (w, h, coarse) {
    this.viewportW = w;
    this.viewportH = h;
    this.coarsePointer = coarse;
  };
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
    this.parseBlock(src, new EVGMediaQuery());
  };
  parseBlock (src, cond) {
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
      const selectorText = (src.substring(i, braceAt )).trim();
      if ( (this).startsWith(selectorText, "@media") ) {
        const endAt = this.matchingBrace(src, braceAt);
        if ( endAt < 0 ) {
          this.errors.push("Unclosed @media block: " + selectorText);
          return;
        }
        const inner = src.substring((braceAt + 1), endAt );
        const q = this.parseMedia(((selectorText.substring(6, (selectorText.length) )).trim()));
        this.parseBlock(inner, this.andQuery(cond, q));
        i = endAt + 1;
      } else {
        if ( (selectorText.length) > 0 ) {
          if ( (selectorText.charCodeAt(0 )) == 64 ) {
            const skipTo = this.matchingBrace(src, braceAt);
            if ( skipTo < 0 ) {
              this.errors.push("Unclosed at-rule: " + selectorText);
              return;
            }
            this.errors.push("Unsupported at-rule ignored: " + selectorText);
            i = skipTo + 1;
            continue;
          }
        }
        const closeAt = this.findChar(src, (braceAt + 1), 125);
        if ( closeAt < 0 ) {
          this.errors.push("Unclosed rule body for selector: " + selectorText);
          return;
        }
        const body = src.substring((braceAt + 1), closeAt );
        this.addRulesIn(selectorText, body, cond);
        i = closeAt + 1;
      }
    };
  };
  matchingBrace (s, open) {
    const __len = s.length;
    let depth = 0;
    let i = open;
    while (i < __len) {
      const c = s.charCodeAt(i );
      if ( c == 123 ) {
        depth = depth + 1;
      }
      if ( c == 125 ) {
        depth = depth - 1;
        if ( depth == 0 ) {
          return i;
        }
      }
      i = i + 1;
    };
    return 0 - 1;
  };
  parseMedia (text) {
    const q = new EVGMediaQuery();
    const body = text.trim();
    if ( (body.length) == 0 ) {
      this.errors.push("Empty @media condition");
      q.broken = true;
      return q;
    }
    if ( this.findChar(body, 0, 44) >= 0 ) {
      this.errors.push("Comma-separated media queries are not supported: " + body);
      q.broken = true;
      return q;
    }
    const parts = this.splitFeatures(body);
    let i = 0;
    while (i < (parts.length)) {
      const feat = (parts[i]).trim();
      if ( (feat.length) > 0 ) {
        this.applyFeature(q, feat, body);
      }
      i = i + 1;
    };
    return q;
  };
  splitFeatures (body) {
    let out = [];
    const __len = body.length;
    let i = 0;
    while (i < __len) {
      const open = this.findChar(body, i, 40);
      if ( open < 0 ) {
        const tail = (body.substring(i, __len )).trim();
        if ( (tail.length) > 0 ) {
          if ( tail != "and" ) {
            out.push(tail);
          }
        }
        return out;
      }
      const close = this.findChar(body, (open + 1), 41);
      if ( close < 0 ) {
        out.push(body.substring((open + 1), __len ));
        return out;
      }
      out.push(body.substring((open + 1), close ));
      i = close + 1;
    };
    return out;
  };
  applyFeature (q, feat, whole) {
    const colon = this.findChar(feat, 0, 58);
    if ( colon < 0 ) {
      this.errors.push("Media feature without a value: " + feat);
      q.broken = true;
      return;
    }
    const name = (feat.substring(0, colon )).trim();
    const value = (feat.substring((colon + 1), (feat.length) )).trim();
    if ( name == "orientation" ) {
      if ( (value == "portrait") || (value == "landscape") ) {
        q.orientation = value;
        return;
      }
      this.errors.push("Unknown orientation: " + value);
      q.broken = true;
      return;
    }
    if ( name == "pointer" ) {
      if ( value == "coarse" ) {
        q.pointer = 1;
        return;
      }
      if ( value == "fine" ) {
        q.pointer = 2;
        return;
      }
      this.errors.push("Unknown pointer value: " + value);
      q.broken = true;
      return;
    }
    const px = this.parsePx(value);
    if ( typeof(px) === "undefined" ) {
      this.errors.push("Media feature value is not a length: " + feat);
      q.broken = true;
      return;
    }
    const v = px;
    if ( name == "min-width" ) {
      q.minWidth = v;
      return;
    }
    if ( name == "max-width" ) {
      q.maxWidth = v;
      return;
    }
    if ( name == "min-height" ) {
      q.minHeight = v;
      return;
    }
    if ( name == "max-height" ) {
      q.maxHeight = v;
      return;
    }
    this.errors.push("Unsupported media feature: " + name);
    q.broken = true;
  };
  parsePx (value) {
    let __none;
    const v = value.trim();
    const __len = v.length;
    if ( __len == 0 ) {
      return __none;
    }
    let digits = v;
    if ( __len > 2 ) {
      if ( (v.substring((__len - 2), __len )) == "px" ) {
        digits = (v.substring(0, (__len - 2) )).trim();
      }
    }
    if ( (digits.length) == 0 ) {
      return __none;
    }
    let i = 0;
    let dots = 0;
    while (i < (digits.length)) {
      const c = digits.charCodeAt(i );
      if ( c == 46 ) {
        dots = dots + 1;
      } else {
        if ( (c < 48) || (c > 57) ) {
          return __none;
        }
      }
      i = i + 1;
    };
    if ( dots > 1 ) {
      return __none;
    }
    return isNaN( parseFloat(digits) ) ? undefined : parseFloat(digits);
  };
  andQuery (a, b) {
    if ( a.isEmpty() ) {
      return b;
    }
    if ( b.isEmpty() ) {
      return a;
    }
    const q = new EVGMediaQuery();
    q.broken = a.broken || b.broken;
    q.minWidth = EVGStyleSheet.larger(a.minWidth, b.minWidth);
    q.maxWidth = EVGStyleSheet.smaller(a.maxWidth, b.maxWidth);
    q.minHeight = EVGStyleSheet.larger(a.minHeight, b.minHeight);
    q.maxHeight = EVGStyleSheet.smaller(a.maxHeight, b.maxHeight);
    q.orientation = a.orientation;
    if ( (b.orientation.length) > 0 ) {
      if ( (a.orientation.length) > 0 ) {
        if ( a.orientation != b.orientation ) {
          q.broken = true;
        }
      }
      q.orientation = b.orientation;
    }
    q.pointer = a.pointer;
    if ( b.pointer != 0 ) {
      if ( a.pointer != 0 ) {
        if ( a.pointer != b.pointer ) {
          q.broken = true;
        }
      }
      q.pointer = b.pointer;
    }
    return q;
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
    this.addRulesIn(selectorText, body, new EVGMediaQuery());
  };
  addRulesIn (selectorText, body, cond) {
    const decls = this.parseDeclarations(body);
    const selectors = this.splitOn(selectorText, 44);
    let i = 0;
    while (i < (selectors.length)) {
      const sel = (selectors[i]).trim();
      if ( (sel.length) > 0 ) {
        this.pendingMedia = cond;
        this.addRuleForSelector(sel, decls);
      }
      i = i + 1;
    };
    this.pendingMedia = new EVGMediaQuery();
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
    rule.media = this.pendingMedia;
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
  applyTreeIn (root, theme, w, h, coarse) {
    this.setViewport(w, h, coarse);
    this.applyTree(root, theme);
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
          applies = rule.media.matches(this.viewportW, this.viewportH, this.coarsePointer);
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
EVGStyleSheet.larger = function(a, b) {
  if ( a < 0.0 ) {
    return b;
  }
  if ( b < 0.0 ) {
    return a;
  }
  if ( a > b ) {
    return a;
  }
  return b;
};
EVGStyleSheet.smaller = function(a, b) {
  if ( a < 0.0 ) {
    return b;
  }
  if ( b < 0.0 ) {
    return a;
  }
  if ( a < b ) {
    return a;
  }
  return b;
};
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
      const css = Utf8.decode(((function(b){ var v = (b instanceof Uint8Array) ? b : new Uint8Array(b); var s = ""; var i = 0; var n = v.length; var c = 32768; while (i < n) { var e = i + c; if (e > n) { e = n; } s += String.fromCharCode.apply(null, v.subarray(i, e)); i = e; } return s; })(content)));
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
    this.tryFace("Noto_Emoji/NotoEmoji-Regular.ttf");
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
class EVGPDFTool  {
  constructor() {
    this.inputFile = "";
    this.outputFile = "";
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.fontsDir = "./gallery/pdf_writer/Fonts";     /** note: unused */
    this.debug = false;
    this.fontManager = new FontManager();
    this.fontSetup = new EVGFontSetup();
    this.fontsOverride = "";
    this.strictFonts = false;
    this.bleed = 0.0;
    this.colorMode = "rgb";
    this.pdfxProfile = "";
    this.intentId = "FOGRA39";
    this.intentInfo = "Coated FOGRA39 (ISO 12647-2:2004)";
    this.docTitle = "";
    this.docAuthor = "";
    this.strictPrint = false;
    const sl = new EVGStyleLoader();
    this.styles = sl;
  }
  run () {
    const argCount = (process.argv.length - 2);
    if ( argCount < 2 ) {
      this.printUsage();
      return;
    }
    this.inputFile = process.argv[ 2 + 0];
    this.outputFile = process.argv[ 2 + 1];
    let i = 2;
    while (i < argCount) {
      const arg = process.argv[ 2 + i];
      if ( arg == "-w" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const wArg = process.argv[ 2 + i];
          const wVal = isNaN( parseFloat(wArg) ) ? undefined : parseFloat(wArg);
          if ( typeof(wVal) != "undefined" ) {
            this.pageWidth = wVal;
          }
        }
      }
      if ( arg == "-h" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const hArg = process.argv[ 2 + i];
          const hVal = isNaN( parseFloat(hArg) ) ? undefined : parseFloat(hArg);
          if ( typeof(hVal) != "undefined" ) {
            this.pageHeight = hVal;
          }
        }
      }
      if ( arg == "-bleed" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const bArg = process.argv[ 2 + i];
          const bVal = isNaN( parseFloat(bArg) ) ? undefined : parseFloat(bArg);
          if ( typeof(bVal) != "undefined" ) {
            this.bleed = bVal;
          }
        }
      }
      if ( arg == "-colors" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.colorMode = process.argv[ 2 + i];
        }
      }
      if ( arg == "-pdfx" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.pdfxProfile = process.argv[ 2 + i];
        }
      }
      if ( arg == "-intent" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.intentId = process.argv[ 2 + i];
        }
      }
      if ( arg == "-intent-info" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.intentInfo = process.argv[ 2 + i];
        }
      }
      if ( arg == "-title" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.docTitle = process.argv[ 2 + i];
        }
      }
      if ( arg == "-author" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.docAuthor = process.argv[ 2 + i];
        }
      }
      if ( arg == "-fonts" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          this.fontsOverride = process.argv[ 2 + i];
        }
      }
      if ( arg == "-strict-print" ) {
        this.strictPrint = true;
      }
      if ( arg == "-strict-fonts" ) {
        this.strictFonts = true;
      }
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
      if ( arg == "-debug" ) {
        this.debug = true;
      }
      i = i + 1;
    };
    console.log("EVG PDF Tool");
    console.log("Input:  " + this.inputFile);
    console.log("Output: " + this.outputFile);
    console.log(((("Page:   " + ((this.pageWidth.toString()))) + " x ") + ((this.pageHeight.toString()))) + " points");
    this.convert();
  };
  initFonts (inputDir) {
    console.log("");
    console.log("Loading fonts...");
    this.fontSetup.init(inputDir, this.fontsOverride);
    this.fontManager = this.fontSetup.getManager();
    this.fontSetup.report(this.debug);
  };
  printUsage () {
    console.log("EVG PDF Tool - Convert TSX files to PDF");
    console.log("");
    console.log("Usage: evg_pdf_tool input.tsx output.pdf");
    console.log("");
    console.log("Options:");
    console.log("  -w WIDTH   Page width in points (default: 595 = A4)");
    console.log("  -h HEIGHT  Page height in points (default: 842 = A4)");
    console.log("  -css FILE  Apply a CSS subset stylesheet (repeatable)");
    console.log("  -theme T   Theme name selecting .theme-T rules");
    console.log("  -bleed PT  Print bleed in points on every side (adds TrimBox)");
    console.log("  -colors M  rgb (default) or cmyk - converts fills, strokes and text");
    console.log("  -pdfx V    X-4 or X-1a - identifies the file, adds the output intent");
    console.log("  -intent ID Printing condition, e.g. FOGRA39 or 'CGATS TR 001'");
    console.log("  -title S   Document title, for the info dictionary and the XMP");
    console.log("  -author S  Document author");
    console.log("  -strict-print  Fail rather than write a file that claims PDF/X it does not meet");
    console.log("  -fonts DIR Directory to search for font families");
    console.log("  -strict-fonts  Fail instead of measuring with guessed widths");
    console.log("  -debug     Enable debug output");
    console.log("");
    console.log("Example:");
    console.log("  evg_pdf_tool sample.tsx output.pdf");
    console.log("  evg_pdf_tool sample.tsx output.pdf -w 612 -h 792");
  };
  convert () {
    let inputDir = "";
    let inputFileName = this.inputFile;
    let lastSlash = this.inputFile.lastIndexOf("/");
    let lastBackslash = this.inputFile.lastIndexOf("\\");
    let lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      inputDir = this.inputFile.substring(0, (lastSep + 1) );
      inputFileName = this.inputFile.substring((lastSep + 1), (this.inputFile.length) );
    } else {
      inputDir = "./";
    }
    this.initFonts(inputDir);
    console.log("");
    console.log("Parsing TSX file...");
    const converter = new JSXToEVG();
    converter.pageWidth = this.pageWidth;
    converter.pageHeight = this.pageHeight;
    const root = converter.parseFile(inputDir, inputFileName);
    if ( root.tagName == "" ) {
      console.log("Error: Failed to parse TSX file or no JSX content found");
      return;
    }
    console.log(("Found root element: <" + root.tagName) + ">");
    console.log("Children: " + ((root.getChildCount().toString())));
    const usedTheme = this.styles.applyTo(root);
    this.styles.report(usedTheme);
    if ( this.debug ) {
      this.printTree(root, 0);
    }
    console.log("");
    console.log("Rendering to PDF...");
    const renderer = new EVGPDFRenderer();
    renderer.init(renderer);
    renderer.setPageSize(this.pageWidth, this.pageHeight);
    renderer.setFontManager(this.fontManager);
    renderer.setBaseDir(inputDir);
    if ( this.debug ) {
      renderer.setDebug(true);
    }
    const ttfMeasurer = new TTFTextMeasurer(this.fontManager);
    renderer.setMeasurer(ttfMeasurer);
    renderer.setStrictFonts(this.strictFonts);
    renderer.setBleed(this.bleed);
    renderer.setColorMode(this.colorMode);
    renderer.setPdfxProfile(this.pdfxProfile);
    renderer.setOutputIntent(this.intentId, this.intentInfo);
    renderer.setDocumentInfo(this.docTitle, this.docAuthor);
    if ( (this.pdfxProfile.length) > 0 ) {
      console.log((((("  Print finishing: PDF/" + this.pdfxProfile) + ", ") + this.colorMode) + ", intent ") + this.intentId);
    }
    const pdfData = renderer.render(root);
    const finishing = renderer.finishingReport();
    if ( (finishing.length) > 0 ) {
      console.log(finishing);
    }
    const issues = renderer.conformanceIssues();
    if ( issues > 0 ) {
      if ( this.strictPrint ) {
        console.log("FAILED: -strict-print, and this file would not pass a PDF/X check.");
        process.exit(2);
      }
    }
    const lay = renderer.getLayout();
    let li = 0;
    while (li < lay.warningCount()) {
      console.log("Layout warning: " + lay.warningAt(li));
      li = li + 1;
    };
    const engine = renderer.getTextEngine();
    let wi = 0;
    while (wi < engine.warningCount()) {
      console.log("Font warning: " + engine.warningAt(wi));
      wi = wi + 1;
    };
    if ( engine.hadFatal ) {
      console.log("Error: -strict-fonts was requested and text could not be measured from the declared faces.");
      return;
    }
    let gi = 0;
    while (gi < renderer.unsupportedGlyphCount()) {
      console.log(("Encoding warning: " + renderer.unsupportedGlyphReport(gi)) + " is outside WinAnsi and was written as '?'");
      gi = gi + 1;
    };
    if ( renderer.unsupportedGlyphCount() > 0 ) {
      console.log(("  " + ((renderer.unsupportedGlyphCount().toString()))) + " character(s) could not be encoded. Use characters within WinAnsi,");
      console.log("  or extend the PDF font path to an embedded subset with a /ToUnicode cmap.");
      if ( this.strictFonts ) {
        console.log("Error: -strict-fonts was requested and some characters cannot be encoded.");
        return;
      }
    }
    console.log("");
    console.log("Writing PDF to: " + this.outputFile);
    let outputDir = "";
    let outputFileName = this.outputFile;
    lastSlash = this.outputFile.lastIndexOf("/");
    lastBackslash = this.outputFile.lastIndexOf("\\");
    lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      outputDir = this.outputFile.substring(0, (lastSep + 1) );
      outputFileName = this.outputFile.substring((lastSep + 1), (this.outputFile.length) );
    } else {
      outputDir = "./";
    }
    require('fs').writeFileSync(outputDir + '/' + outputFileName, Buffer.from(pdfData));
    console.log("");
    console.log(("Done! PDF written: " + (((pdfData.byteLength).toString()))) + " bytes");
  };
  printTree (el, indent) {
    let spaces = "";
    let i = 0;
    while (i < indent) {
      spaces = spaces + "  ";
      i = i + 1;
    };
    let info = (spaces + "<") + el.tagName;
    if ( (el.id.length) > 0 ) {
      info = ((info + " id=\"") + el.id) + "\"";
    }
    if ( (el.textContent.length) > 0 ) {
      info = ((info + " text=\"") + el.textContent) + "\"";
    }
    info = (((((((info + "> pos=(") + ((el.calculatedX.toString()))) + ",") + ((el.calculatedY.toString()))) + ") size=") + ((el.calculatedWidth.toString()))) + "x") + ((el.calculatedHeight.toString()));
    console.log(info);
    let j = 0;
    const childCount = el.getChildCount();
    while (j < childCount) {
      const child = el.getChild(j);
      this.printTree(child, indent + 1);
      j = j + 1;
    };
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const tool = new EVGPDFTool();
  tool.run();
}
__js_main();
