import 'dart:io';

class Token {
  String tokenType = "";
  String value = "";
  int line = 0;
  int col = 0;
  int start = 0;
  int end = 0;
  bool hasEscape = false;
  bool legacyOctal = false;
}

class TSUnicodeId {
  
  String idStartSpec() {
    String s = "";
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
  }
  
  String idContinueSpec() {
    String s = "";
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
  }
  
  int base36Value(String ch) {
    int code = ch.codeUnitAt(0);
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
  }
  
  List<int> decodeRangeTable(String spec) {
    List<int> out = [];
    int prev = -1;
    int i = 0;
    int n = spec.length;
    int cur = 0;
    int delta = 0;
    while (i < n) {
      String ch = spec.substring(i, (i + 1) );
      if ( ch == "." ) {
        delta = cur;
        cur = 0;
      } else {
        if ( ch == "," ) {
          int s = (prev + 1) + delta;
          int e = s + cur;
          out.add(s);
          out.add(e);
          prev = e;
          cur = 0;
          delta = 0;
        } else {
          cur = (cur * 36) + this.base36Value(ch);
        }
      }
      i = i + 1;
    }
    int sLast = (prev + 1) + delta;
    int eLast = sLast + cur;
    out.add(sLast);
    out.add(eLast);
    return out;
  }
  
  bool inRangeTable(List<int> table, int code) {
    int total = table.length;
    if ( total == 0 ) {
      return false;
    }
    double pairCount = (total.toDouble()) / 2.0;
    int loP = 0;
    int hiP = ((pairCount).floor()) - 1;
    while (loP <= hiP) {
      double midD = ((loP + hiP).toDouble()) / 2.0;
      int midP = (midD).floor();
      int lo = table[(midP * 2)];
      int hi = table[((midP * 2) + 1)];
      if ( code < lo ) {
        hiP = midP - 1;
      } else {
        if ( code > hi ) {
          loP = midP + 1;
        } else {
          return true;
        }
      }
    }
    return false;
  }
}

class TSLexer {
  String source = "";
  int pos = 0;
  int line = 1;
  int col = 1;
  int __len = 0;
  String prevType = "";
  String prevValue = "";
  int prevLine = 0;
  TSUnicodeId unicodeIds =  TSUnicodeId();
  List<int> idStartTable = [];
  List<int> idContinueTable = [];
  bool idTablesReady = false;
  String braceKinds = "";
  String lastCloseKind = "o";
  String parenKinds = "";
  String lastCloseParen = "e";
  
  TSLexer(String src) {
    source = src;
    __len = src.length;
  }
  
  String peek() {
    if ( pos >= __len ) {
      return "";
    }
    return source[pos];
  }
  
  String peekAt(int offset) {
    int idx = pos + offset;
    if ( idx >= __len ) {
      return "";
    }
    return source[idx];
  }
  
  String advance() {
    if ( pos >= __len ) {
      return "";
    }
    String ch = source[pos];
    pos = pos + 1;
    int chCode = ch.codeUnitAt(0);
    bool isTerminator = false;
    if ( ((ch == "\n") || (ch == "\r")) || (ch == "\r\n") ) {
      isTerminator = true;
    }
    if ( chCode == 8232 ) {
      isTerminator = true;
    }
    if ( chCode == 8233 ) {
      isTerminator = true;
    }
    if ( isTerminator ) {
      line = line + 1;
      col = 1;
    } else {
      col = col + 1;
    }
    return ch;
  }
  
  bool isDigit(String ch) {
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
  }
  
  void ensureIdTables() {
    if ( idTablesReady ) {
      return;
    }
    String startSpec = this.unicodeIds.idStartSpec();
    idStartTable = this.unicodeIds.decodeRangeTable(startSpec);
    String contSpec = this.unicodeIds.idContinueSpec();
    idContinueTable = this.unicodeIds.decodeRangeTable(contSpec);
    idTablesReady = true;
  }
  
  int codePointAt(int offset) {
    int idx = pos + offset;
    if ( idx >= __len ) {
      return -1;
    }
    String first = source[idx];
    int hi = first.codeUnitAt(0);
    if ( hi >= 55296 ) {
      if ( hi <= 56319 ) {
        if ( (idx + 1) < __len ) {
          String second = source[(idx + 1)];
          int lo = second.codeUnitAt(0);
          if ( lo >= 56320 ) {
            if ( lo <= 57343 ) {
              return (((hi - 55296) * 1024) + (lo - 56320)) + 65536;
            }
          }
        }
      }
    }
    return hi;
  }
  
  int codePointWidth() {
    int cp = this.codePointAt(0);
    if ( cp > 65535 ) {
      return 2;
    }
    return 1;
  }
  
  bool isIdStartHere() {
    int cp = this.codePointAt(0);
    if ( cp < 0 ) {
      return false;
    }
    if ( cp < 128 ) {
      String ch = source[pos];
      return this.isAlpha(ch);
    }
    this.ensureIdTables();
    return this.unicodeIds.inRangeTable(idStartTable, cp);
  }
  
  bool isIdContinueHere() {
    int cp = this.codePointAt(0);
    if ( cp < 0 ) {
      return false;
    }
    if ( cp < 128 ) {
      String ch = source[pos];
      return this.isAlphaNumCh(ch);
    }
    this.ensureIdTables();
    return this.unicodeIds.inRangeTable(idContinueTable, cp);
  }
  
  bool isAlpha(String ch) {
    if ( (ch.length) == 0 ) {
      return false;
    }
    int code = ch.codeUnitAt(0);
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
    if ( ch == "\$" ) {
      return true;
    }
    if ( code > 127 ) {
      this.ensureIdTables();
      return this.unicodeIds.inRangeTable(idStartTable, code);
    }
    return false;
  }
  
  bool isLetterCode(int code) {
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
  }
  
  bool isAlphaNumCh(String ch) {
    if ( this.isDigit(ch) ) {
      return true;
    }
    if ( ch == "_" ) {
      return true;
    }
    if ( ch == "\$" ) {
      return true;
    }
    if ( (ch.length) == 0 ) {
      return false;
    }
    int code = ch.codeUnitAt(0);
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
      return this.unicodeIds.inRangeTable(idContinueTable, code);
    }
    return false;
  }
  
  bool isWhitespace(String ch) {
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
    int code = ch.codeUnitAt(0);
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
    return false;
  }
  
  void skipWhitespace() {
    while (pos < __len) {
      String ch = this.peek();
      if ( this.isWhitespace(ch) ) {
        this.advance();
      } else {
        return;
      }
    }
  }
  
  Token makeToken(String tokType, String value, int startPos, int startLine, int startCol) {
    Token tok =  Token();
    tok.tokenType = tokType;
    tok.value = value;
    tok.start = startPos;
    tok.end = pos;
    tok.line = startLine;
    tok.col = startCol;
    return tok;
  }
  
  bool isLineTerminatorChar(String ch) {
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
    int code = ch.codeUnitAt(0);
    if ( code == 8232 ) {
      return true;
    }
    if ( code == 8233 ) {
      return true;
    }
    return false;
  }
  
  Token readLineComment() {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    this.advance();
    this.advance();
    String value = "";
    while (pos < __len) {
      String ch = this.peek();
      if ( this.isLineTerminatorChar(ch) ) {
        return this.makeToken("LineComment", value, startPos, startLine, startCol);
      }
      value = value + this.advance();
    }
    return this.makeToken("LineComment", value, startPos, startLine, startCol);
  }
  
  Token readHtmlComment() {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    String value = "";
    while (pos < __len) {
      String ch = this.peek();
      if ( this.isLineTerminatorChar(ch) ) {
        break;
      }
      value = value + this.advance();
    }
    return this.makeToken("HtmlComment", value, startPos, startLine, startCol);
  }
  
  Token readBlockComment() {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    this.advance();
    this.advance();
    String value = "";
    while (pos < __len) {
      String ch = this.peek();
      if ( ch == "*" ) {
        if ( this.peekAt(1) == "/" ) {
          this.advance();
          this.advance();
          return this.makeToken("BlockComment", value, startPos, startLine, startCol);
        }
      }
      value = value + this.advance();
    }
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
  }
  
  Token readString(String quote) {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    this.advance();
    String value = "";
    bool sawEscape = false;
    bool sawOctalEscape = false;
    while (pos < __len) {
      String ch = this.peek();
      if ( ch == quote ) {
        this.advance();
        Token strTok = this.makeToken("String", value, startPos, startLine, startCol);
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
        String esc = this.advance();
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
                      String afterZero = this.peek();
                      if ( this.isDigit(afterZero) ) {
                        sawOctalEscape = true;
                        value = value + esc;
                      } else {
                        value = value + (String.fromCharCode(0));
                      }
                    } else {
                      if ( esc == "x" ) {
                        String h1 = this.peek();
                        int hv1 = this.hexValue(h1);
                        String h2 = this.peekAt(1);
                        int hv2 = this.hexValue(h2);
                        if ( (hv1 < 0) || (hv2 < 0) ) {
                          return this.makeToken("Invalid", value, startPos, startLine, startCol);
                        }
                        this.advance();
                        this.advance();
                        value = value + (String.fromCharCode(((hv1 * 16) + hv2)));
                      } else {
                        if ( esc == "u" ) {
                          String uEsc = this.readUnicodeEscapeBody();
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
                              }
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
      } else {
        value = value + this.advance();
      }
    }
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
  }
  
  Token readTemplateLiteral() {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    this.advance();
    String value = "";
    while (pos < __len) {
      String ch = this.peek();
      if ( ch == "`" ) {
        this.advance();
        return this.makeToken("Template", value, startPos, startLine, startCol);
      }
      if ( ch == "\\" ) {
        this.advance();
        String esc = this.advance();
        if ( esc == "n" ) {
          value = value + "\n";
        } else {
          if ( esc == "t" ) {
            value = value + "\t";
          } else {
            if ( esc == "`" ) {
              value = value + "`";
            } else {
              if ( esc == "\$" ) {
                value = value + "\$";
              } else {
                if ( this.isDigit(esc) ) {
                  if ( esc != "0" ) {
                    return this.makeToken("Invalid", value, startPos, startLine, startCol);
                  }
                  String afterZero = this.peek();
                  if ( this.isDigit(afterZero) ) {
                    return this.makeToken("Invalid", value, startPos, startLine, startCol);
                  }
                }
                value = value + esc;
              }
            }
          }
        }
      } else {
        if ( ch == "\$" ) {
          if ( this.peekAt(1) == "{" ) {
            value = value + this.advance();
            value = value + this.advance();
            int braceDepth = 1;
            while ((pos < __len) && (braceDepth > 0)) {
              String ic = this.peek();
              if ( ic == "\\" ) {
                value = value + this.advance();
                if ( pos < __len ) {
                  value = value + this.advance();
                }
              } else {
                if ( ic == "{" ) {
                  braceDepth = braceDepth + 1;
                  value = value + this.advance();
                } else {
                  if ( ic == "}" ) {
                    braceDepth = braceDepth - 1;
                    value = value + this.advance();
                  } else {
                    if ( ic == "`" ) {
                      Token innerTok = this.readTemplateLiteral();
                      value = ((value + "`") + innerTok.value) + "`";
                    } else {
                      value = value + this.advance();
                    }
                  }
                }
              }
            }
          } else {
            value = value + this.advance();
          }
        } else {
          value = value + this.advance();
        }
      }
    }
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
  }
  
  int digitVal(String ch) {
    if ( (ch.length) == 0 ) {
      return 0 - 1;
    }
    int code = ch.codeUnitAt(0);
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
  }
  
  Token readRadix(int radix, int startPos, int startLine, int startCol) {
    this.advance();
    this.advance();
    int acc = 0;
    bool looping = true;
    while ((pos < __len) && looping) {
      String ch = this.peek();
      if ( ch == "_" ) {
        this.advance();
      } else {
        int d = this.digitVal(ch);
        if ( d >= 0 ) {
          if ( d < radix ) {
            acc = (acc * radix) + d;
            this.advance();
          } else {
            looping = false;
          }
        } else {
          looping = false;
        }
      }
    }
    bool digitsRead = pos > (startPos + 2);
    String tail = this.peek();
    bool runsOn = false;
    if ( this.isAlphaNumCh(tail) ) {
      runsOn = true;
    }
    if ( (digitsRead == false) || runsOn ) {
      while (pos < __len) {
        String tch = this.peek();
        if ( this.isAlphaNumCh(tch) ) {
          this.advance();
        } else {
          break;
        }
      }
      return this.makeToken("Invalid", (source.substring(startPos, pos )), startPos, startLine, startCol);
    }
    return this.makeToken("Number", ((acc.toString())), startPos, startLine, startCol);
  }
  
  Token readNumber() {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    String value = "";
    if ( this.peek() == "0" ) {
      String p1 = this.peekAt(1);
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
    bool sawDot = false;
    bool legacyOctal = false;
    bool nonOctalDecimal = false;
    if ( this.peek() == "0" ) {
      String secondCh = this.peekAt(1);
      if ( this.isDigit(secondCh) ) {
        legacyOctal = true;
        int scan = pos + 1;
        while (scan < __len) {
          String sc = source[scan];
          if ( this.isDigit(sc) ) {
            if ( (sc == "8") || (sc == "9") ) {
              nonOctalDecimal = true;
            }
            scan = scan + 1;
          } else {
            break;
          }
        }
        if ( nonOctalDecimal ) {
          legacyOctal = false;
        }
      }
    }
    bool scanning = true;
    while ((pos < __len) && scanning) {
      String ch = this.peek();
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
              String afterE = this.peekAt(1);
              String expDigit = afterE;
              int signLen = 0;
              if ( (afterE == "+") || (afterE == "-") ) {
                expDigit = this.peekAt(2);
                signLen = 1;
              }
              if ( this.isDigit(expDigit) ) {
                value = value + this.advance();
                if ( signLen > 0 ) {
                  value = value + this.advance();
                }
                while (pos < __len) {
                  String ech = this.peek();
                  if ( this.isDigit(ech) ) {
                    value = value + this.advance();
                  } else {
                    break;
                  }
                }
              }
            }
            scanning = false;
          }
        }
      }
    }
    String numTail = this.peek();
    if ( this.isAlphaNumCh(numTail) ) {
      while (pos < __len) {
        String tch = this.peek();
        if ( this.isAlphaNumCh(tch) ) {
          this.advance();
        } else {
          break;
        }
      }
      return this.makeToken("Invalid", (source.substring(startPos, pos )), startPos, startLine, startCol);
    }
    Token numTok = this.makeToken("Number", value, startPos, startLine, startCol);
    numTok.legacyOctal = legacyOctal;
    if ( nonOctalDecimal ) {
      numTok.legacyOctal = true;
    }
    return numTok;
  }
  
  int hexValue(String ch) {
    if ( (ch.length) == 0 ) {
      return -1;
    }
    int code = ch.codeUnitAt(0);
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
  }
  
  String readUnicodeEscape() {
    int savedPos = pos;
    int savedLine = line;
    int savedCol = col;
    if ( this.peek() != "\\" ) {
      return "";
    }
    this.advance();
    if ( this.peek() != "u" ) {
      pos = savedPos;
      line = savedLine;
      col = savedCol;
      return "";
    }
    this.advance();
    String decoded = this.readUnicodeEscapeBody();
    if ( (decoded.length) == 0 ) {
      pos = savedPos;
      line = savedLine;
      col = savedCol;
      return "";
    }
    return decoded;
  }
  
  String readUnicodeEscapeBody() {
    int code = 0;
    if ( this.peek() == "{" ) {
      this.advance();
      bool any = false;
      while (pos < __len) {
        String ch = this.peek();
        if ( ch == "}" ) {
          break;
        }
        int hv = this.hexValue(ch);
        if ( hv < 0 ) {
          return "";
        }
        code = (code * 16) + hv;
        any = true;
        this.advance();
      }
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
      int i = 0;
      while (i < 4) {
        String hch = this.peek();
        int hv_1 = this.hexValue(hch);
        if ( hv_1 < 0 ) {
          return "";
        }
        code = (code * 16) + hv_1;
        this.advance();
        i = i + 1;
      }
    }
    if ( code > 65535 ) {
      int rest = code - 65536;
      double restD = rest.toDouble();
      int high = ((restD / 1024.0)).floor();
      int hi = 55296 + high;
      int lo = 56320 + (rest - (high * 1024));
      return (String.fromCharCode(hi)) + (String.fromCharCode(lo));
    }
    return String.fromCharCode(code);
  }
  
  Token readIdentifier() {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    String value = "";
    bool sawIdEscape = false;
    while (pos < __len) {
      String ch = this.peek();
      if ( this.isIdContinueHere() ) {
        int width = this.codePointWidth();
        value = value + this.advance();
        if ( width == 2 ) {
          value = value + this.advance();
        }
      } else {
        if ( ch == "\\" ) {
          String esc = this.readUnicodeEscape();
          if ( (esc.length) == 1 ) {
            int escCode = esc.codeUnitAt(0);
            bool escOk = this.isAlphaNumCh(esc);
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
          Token idTok = this.makeToken(this.identType(value), value, startPos, startLine, startCol);
          idTok.hasEscape = sawIdEscape;
          return idTok;
        }
      }
    }
    Token idTokEnd = this.makeToken(this.identType(value), value, startPos, startLine, startCol);
    idTokEnd.hasEscape = sawIdEscape;
    return idTokEnd;
  }
  
  String identType(String value) {
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
  }
  
  Token nextToken() {
    this.skipWhitespace();
    if ( pos >= __len ) {
      return this.makeToken("EOF", "", pos, line, col);
    }
    String ch = this.peek();
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    if ( ch == "/" ) {
      String next = this.peekAt(1);
      if ( next == "/" ) {
        return this.readLineComment();
      }
      if ( next == "*" ) {
        return this.readBlockComment();
      }
      if ( this.regexAllowed() ) {
        Token re = this.readRegex();
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
      bool wordApostrophe = false;
      if ( pos > 0 ) {
        if ( (pos + 1) < __len ) {
          String prevCh = this.peekAt(-1);
          String nextCh = this.peekAt(1);
          if ( (prevCh.length) > 0 ) {
            if ( (nextCh.length) > 0 ) {
              int prevCode = prevCh.codeUnitAt(0);
              int nextCode = nextCh.codeUnitAt(0);
              if ( this.isLetterCode(prevCode) && this.isLetterCode(nextCode) ) {
                if ( prevType != "Keyword" ) {
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
          if ( (prevType == "") || (line > prevLine) ) {
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
      String afterDot = this.peekAt(1);
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
    String next_1 = this.peekAt(1);
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
      return this.makeToken("EOF", "", pos, line, col);
    }
    int fallbackCode = ch.codeUnitAt(0);
    this.advance();
    if ( fallbackCode > 127 ) {
      return this.makeToken("Unknown", ch, startPos, startLine, startCol);
    }
    return this.makeToken("Punctuator", ch, startPos, startLine, startCol);
  }
  
  List<Token> tokenize() {
    List<Token> tokens = [];
    while (true) {
      Token tok = this.nextToken();
      tokens.add(tok);
      if ( ((tok.tokenType != "LineComment") && (tok.tokenType != "BlockComment")) && (tok.tokenType != "HtmlComment") ) {
        if ( tok.tokenType == "Punctuator" ) {
          if ( tok.value == "(" ) {
            String headerOpen = "e";
            if ( prevType == "Keyword" ) {
              if ( (((prevValue == "if") || (prevValue == "while")) || (prevValue == "for")) || (prevValue == "with") ) {
                headerOpen = "h";
              }
            }
            parenKinds = parenKinds + headerOpen;
          }
          if ( tok.value == ")" ) {
            int pDepth = parenKinds.length;
            if ( pDepth > 0 ) {
              lastCloseParen = parenKinds.substring((pDepth - 1), pDepth );
              parenKinds = parenKinds.substring(0, (pDepth - 1) );
            } else {
              lastCloseParen = "e";
            }
          }
          if ( tok.value == "{" ) {
            braceKinds = braceKinds + this.braceKindHere();
          }
          if ( tok.value == "}" ) {
            int depth = braceKinds.length;
            if ( depth > 0 ) {
              lastCloseKind = braceKinds.substring((depth - 1), depth );
              braceKinds = braceKinds.substring(0, (depth - 1) );
            } else {
              lastCloseKind = "o";
            }
          }
        }
        prevType = tok.tokenType;
        prevValue = tok.value;
        prevLine = tok.line;
      }
      if ( tok.tokenType == "EOF" ) {
        return tokens;
      }
    }
    return tokens;
  }
  
  String braceKindHere() {
    if ( prevType == "" ) {
      return "b";
    }
    if ( line > prevLine ) {
      return "b";
    }
    if ( prevType == "Punctuator" ) {
      if ( prevValue == ")" ) {
        return "b";
      }
      if ( prevValue == ";" ) {
        return "b";
      }
      if ( prevValue == "{" ) {
        return "b";
      }
      if ( prevValue == "}" ) {
        return "b";
      }
      if ( prevValue == "=>" ) {
        return "b";
      }
      if ( prevValue == ":" ) {
        return "b";
      }
      if ( prevValue == "++" ) {
        return "b";
      }
      if ( prevValue == "--" ) {
        return "b";
      }
      return "o";
    }
    if ( prevType == "Keyword" ) {
      if ( prevValue == "else" ) {
        return "b";
      }
      if ( prevValue == "do" ) {
        return "b";
      }
      if ( prevValue == "try" ) {
        return "b";
      }
      if ( prevValue == "finally" ) {
        return "b";
      }
      return "o";
    }
    return "o";
  }
  
  bool regexBodyValid(String body, bool unicodeMode) {
    int n = body.length;
    int groups = 0;
    int maxBackRef = 0;
    int i = 0;
    bool inClass = false;
    bool prevWasAssertion = false;
    int skipTo = -1;
    while (i < n) {
      skipTo = -1;
      String ch = body.substring(i, (i + 1) );
      if ( ch == "\\" ) {
        String esc = body.substring((i + 1), (i + 2) );
        if ( esc == "u" ) {
          if ( (body.substring((i + 2), (i + 3) )) == "{" ) {
            int cp = 0;
            int j = i + 3;
            int digits = 0;
            while (j < n) {
              String hc = body.substring(j, (j + 1) );
              if ( hc == "}" ) {
                break;
              }
              int hv = this.hexValue(hc);
              if ( hv < 0 ) {
                break;
              }
              cp = (cp * 16) + hv;
              digits = digits + 1;
              j = j + 1;
            }
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
          int escCode = esc.codeUnitAt(0);
          if ( escCode >= 49 ) {
            if ( escCode <= 57 ) {
              int refNum = escCode - 48;
              if ( refNum > maxBackRef ) {
                maxBackRef = refNum;
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
              String after = body.substring((i + 1), (i + 3) );
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
                  int k = i + 1;
                  int numDigits = 0;
                  while (k < n) {
                    String dc = body.substring(k, (k + 1) );
                    if ( this.isDigit(dc) ) {
                      numDigits = numDigits + 1;
                      k = k + 1;
                    } else {
                      break;
                    }
                  }
                  if ( numDigits == 0 ) {
                    return false;
                  }
                }
              }
              i = i + 1;
            }
          }
        }
      }
    }
    if ( maxBackRef > groups ) {
      return false;
    }
    return true;
  }
  
  bool stringContainsChar(String haystack, String ch) {
    int i = 0;
    int n = haystack.length;
    while (i < n) {
      if ( (haystack.substring(i, (i + 1) )) == ch ) {
        return true;
      }
      i = i + 1;
    }
    return false;
  }
  
  bool regexAllowed() {
    if ( prevType == "" ) {
      return true;
    }
    if ( prevType == "Number" ) {
      return false;
    }
    if ( prevType == "BigInt" ) {
      return false;
    }
    if ( prevType == "String" ) {
      return false;
    }
    if ( prevType == "Template" ) {
      return false;
    }
    if ( prevType == "Regex" ) {
      return false;
    }
    if ( prevType == "Unknown" ) {
      return false;
    }
    if ( prevType == "Identifier" ) {
      return false;
    }
    if ( prevType == "TSType" ) {
      return false;
    }
    if ( prevType == "Keyword" ) {
      if ( prevValue == "this" ) {
        return false;
      }
      if ( prevValue == "super" ) {
        return false;
      }
      if ( prevValue == "true" ) {
        return false;
      }
      if ( prevValue == "false" ) {
        return false;
      }
      if ( prevValue == "null" ) {
        return false;
      }
      return true;
    }
    if ( prevType == "Punctuator" ) {
      if ( prevValue == ")" ) {
        if ( lastCloseParen == "h" ) {
          return true;
        }
        return false;
      }
      if ( prevValue == "]" ) {
        return false;
      }
      if ( prevValue == "++" ) {
        return false;
      }
      if ( prevValue == "--" ) {
        return false;
      }
      if ( prevValue == "<" ) {
        return false;
      }
      if ( prevValue == "}" ) {
        if ( lastCloseKind == "b" ) {
          return true;
        }
        return false;
      }
      return true;
    }
    return true;
  }
  
  Token readRegex() {
    int startPos = pos;
    int startLine = line;
    int startCol = col;
    String value = this.advance();
    bool inClass = false;
    bool closed = false;
    while (pos < __len) {
      String ch = this.peek();
      if ( ch == "\n" ) {
        break;
      }
      if ( ch == "\r" ) {
        break;
      }
      if ( ch == "\\" ) {
        value = value + this.advance();
        if ( pos < __len ) {
          String escCh = this.peek();
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
    }
    if ( closed == false ) {
      pos = startPos;
      line = startLine;
      col = startCol;
      return this.makeToken("", "", startPos, startLine, startCol);
    }
    String flags = "";
    bool badFlag = false;
    while (pos < __len) {
      String fch = this.peek();
      if ( this.isAlphaNumCh(fch) ) {
        bool known = false;
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
    }
    if ( badFlag ) {
      return this.makeToken("Invalid", value, startPos, startLine, startCol);
    }
    if ( this.peek() == "\\" ) {
      return this.makeToken("Invalid", value, startPos, startLine, startCol);
    }
    int bodyLen = (value.length) - ((flags.length) + 2);
    String body = value.substring(1, (1 + bodyLen) );
    bool unicodeMode = this.stringContainsChar(flags, "u");
    if ( this.regexBodyValid(body, unicodeMode) == false ) {
      return this.makeToken("Invalid", value, startPos, startLine, startCol);
    }
    return this.makeToken("Regex", value, startPos, startLine, startCol);
  }
}

class TSNode {
  String nodeType = "";
  int start = 0;
  int end = 0;
  int line = 0;
  int col = 0;
  String name = "";
  String value = "";
  String kind = "";
  bool optional = false;
  bool readonly = false;
  bool prefix = false;
  bool shorthand = false;
  bool computed = false;
  String accessor = "";
  bool parenthesized = false;
  bool hasEscape = false;
  bool argScanned = false     /* note: unused */;
  bool usesArguments = false     /* note: unused */;
  bool numScanned = false     /* note: unused */;
  double numValue = 0.0     /* note: unused */;
  int evalKind = 0     /* note: unused */;
  int evalOpKind = 0     /* note: unused */;
  bool hoistScanned = false     /* note: unused */;
  List<String> hoistedVarNames = []     /* note: unused */;
  bool method = false;
  bool generator = false;
  bool _async = false;
  bool delegate = false;
  bool _await = false;
  List<TSNode> children = [];
  List<TSNode> params = [];
  List<TSNode> decorators = [];
  TSNode? left = null;
  TSNode? right = null;
  TSNode? body = null;
  TSNode? init = null;
  TSNode? typeAnnotation = null;
  TSNode? test = null;
  TSNode? consequent = null;
  TSNode? alternate = null;
}

class TSParserSimple {
  List<Token> tokens = [];
  int pos = 0;
  Token? currentToken = null;
  bool quiet = false;
  int errorCount = 0;
  List<String> scopeNames = [];
  List<int> scopeStart = [];
  List<int> scopeIsFn = [];
  bool suppressBlockScope = false;
  bool strictMode = false;
  String declaringKind = "";
  bool allowSuperCall = false;
  bool allowSuperProperty = false;
  bool inDerivedClass = false;
  int iterationDepth = 0;
  int switchDepth = 0;
  List<String> activeLabels = [];
  List<String> iterationLabels = [];
  String pendingLabel = ""     /* note: unused */;
  bool inGenerator = false;
  int functionDepth = 0;
  bool sawRestParam = false;
  bool lastBlockEnabledStrict = false;
  bool restParamPending = false;
  bool patternAllowsMemberTarget = false;
  List<String> exportedNames = [];
  bool moduleMode = true;
  bool typeScriptMode = true;
  int ecmaVersion = 2024;
  bool noLetReference = false;
  bool inForOfHead = false     /* note: unused */;
  bool inParamList = false;
  bool parsingFunctionExpression = false;
  List<String> pendingExportRefs = [];
  bool inSingleStatementBody = false;
  bool singleBodyIsIfBranch = false;
  int lastTokenLine = 0;
  int lastTokenEndPos = 0;
  bool atModuleTopLevel = false;
  bool inExportDefault = false;
  int speculating = 0;
  bool tsxMode = false;
  
  void initParser(List<Token> toks) {
    this.tokens = toks;
    this.pos = 0;
    this.quiet = false;
    if ( (toks.length) > 0 ) {
      this.currentToken = toks[0];
      this.skipIgnoredTokens();
    }
  }
  
  void syntaxError(String msg) {
    this.errorCount = this.errorCount + 1;
    if ( this.speculating > 0 ) {
      return;
    }
    if ( this.quiet == false ) {
      print( msg );
    }
  }
  
  void setQuiet(bool q) {
    this.quiet = q;
  }
  
  void setTsxMode(bool enabled) {
    this.tsxMode = enabled;
  }
  
  void setModuleMode(bool enabled) {
    this.moduleMode = enabled;
  }
  
  void setTypeScriptMode(bool enabled) {
    this.typeScriptMode = enabled;
  }
  
  void setEcmaVersion(int year) {
    this.ecmaVersion = year;
  }
  
  Token peek() {
    return this.currentToken!;
  }
  
  String peekType() {
    if ( this.currentToken == null ) {
      return "EOF";
    }
    Token tok = this.currentToken!;
    return tok.tokenType;
  }
  
  String peekValue() {
    if ( this.currentToken == null ) {
      return "";
    }
    Token tok = this.currentToken!;
    return tok.value;
  }
  
  void advance() {
    if ( this.pos < (this.tokens.length) ) {
      Token consumed = this.tokens[this.pos];
      this.lastTokenLine = consumed.line;
      this.lastTokenEndPos = consumed.end;
    }
    this.pos = this.pos + 1;
    if ( this.pos < (this.tokens.length) ) {
      this.currentToken = this.tokens[this.pos];
    } else {
      Token eof =  Token();
      eof.tokenType = "EOF";
      eof.value = "";
      this.currentToken = eof;
    }
    this.skipIgnoredTokens();
  }
  
  void skipIgnoredTokens() {
    while (this.pos < (this.tokens.length)) {
      Token tok = this.peek();
      String tokType = tok.tokenType;
      if ( ((tokType == "LineComment") || (tokType == "BlockComment")) || (tokType == "HtmlComment") ) {
        this.pos = this.pos + 1;
        if ( this.pos < (this.tokens.length) ) {
          this.currentToken = this.tokens[this.pos];
        } else {
          Token eof =  Token();
          eof.tokenType = "EOF";
          eof.value = "";
          this.currentToken = eof;
          return;
        }
      } else {
        return;
      }
    }
  }
  
  List<String> listPrefix(List<String> list, int n) {
    List<String> out = [];
    int i = 0;
    while (i < n) {
      out.add(list[i]);
      i = i + 1;
    }
    return out;
  }
  
  List<int> intListPrefix(List<int> list, int n) {
    List<int> out = [];
    int i = 0;
    while (i < n) {
      out.add(list[i]);
      i = i + 1;
    }
    return out;
  }
  
  void pushScope(bool isFunctionBoundary) {
    this.scopeStart.add(this.scopeNames.length);
    if ( isFunctionBoundary ) {
      this.scopeIsFn.add(1);
    } else {
      this.scopeIsFn.add(0);
    }
  }
  
  void popScope() {
    int depth = this.scopeStart.length;
    if ( depth == 0 ) {
      return;
    }
    int start = this.scopeStart[(depth - 1)];
    this.scopeNames = this.listPrefix(this.scopeNames, start);
    this.scopeStart = this.intListPrefix(this.scopeStart, (depth - 1));
    this.scopeIsFn = this.intListPrefix(this.scopeIsFn, (depth - 1));
  }
  
  void declareBinding(String kind, String name) {
    if ( (name.length) == 0 ) {
      return;
    }
    int depth = this.scopeStart.length;
    if ( depth == 0 ) {
      return;
    }
    int total = this.scopeNames.length;
    int scopeIdx = depth - 1;
    int limit = 0;
    bool hoists = false;
    if ( kind == "v" ) {
      hoists = true;
    }
    if ( kind == "f" ) {
      hoists = true;
    }
    if ( hoists ) {
      int walk = scopeIdx;
      bool keepWalking = true;
      while ((walk >= 0) && keepWalking) {
        if ( (this.scopeIsFn[walk]) == 1 ) {
          keepWalking = false;
        } else {
          walk = walk - 1;
        }
      }
      if ( walk < 0 ) {
        limit = 0;
      } else {
        limit = this.scopeStart[walk];
      }
    } else {
      limit = this.scopeStart[scopeIdx];
    }
    int ownStart = this.scopeStart[scopeIdx];
    int i = limit;
    while (i < total) {
      String entry = this.scopeNames[i];
      /* unused:  int sep = 1   */
      String entryKind = entry.substring(0, 1 );
      String entryName = entry.substring(2, (entry.length) );
      if ( entryName == name ) {
        bool clash = false;
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
              if ( (this.scopeIsFn[scopeIdx]) == 0 ) {
                clash = true;
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
          this.scopeNames.add((kind + "|") + name);
          return;
        }
      }
      i = i + 1;
    }
    this.scopeNames.add((kind + "|") + name);
  }
  
  void declareBindingKind(String declKind, TSNode declarator) {
    String k = "v";
    if ( declKind == "let" ) {
      k = "l";
    }
    if ( declKind == "const" ) {
      k = "l";
    }
    if ( (declarator.name.length) > 0 ) {
      this.declareBinding(k, declarator.name);
    }
  }
  
  void declareParam(TSNode param) {
    if ( (param.name.length) == 0 ) {
      return;
    }
    if ( this.strictMode ) {
      this.declareBinding("p", param.name);
    } else {
      this.declareBinding("q", param.name);
    }
  }
  
  void checkNonSimpleParamDuplicates(List<TSNode> params) {
    bool simple = true;
    int i = 0;
    while (i < (params.length)) {
      TSNode p = params[i];
      if ( p.nodeType != "Parameter" ) {
        simple = false;
      }
      if ( (p.init == null) == false ) {
        simple = false;
      }
      i = i + 1;
    }
    if ( simple ) {
      return;
    }
    List<String> names = this.collectParamNames(params);
    int a = 0;
    while (a < (names.length)) {
      int b = 0;
      while (b < a) {
        if ( (names[a]) == (names[b]) ) {
          this.syntaxError(("Parse error: duplicate parameter '" + (names[a])) + "' in a non-simple parameter list");
        }
        b = b + 1;
      }
      a = a + 1;
    }
  }
  
  List<String> collectParamNames(List<TSNode> params) {
    List<String> out = [];
    int i = 0;
    while (i < (params.length)) {
      TSNode p = params[i];
      if ( (p.name.length) > 0 ) {
        out.add(p.name);
      }
      List<String> sub = this.collectPatternNames(p);
      int j = 0;
      while (j < (sub.length)) {
        out.add(sub[j]);
        j = j + 1;
      }
      i = i + 1;
    }
    return out;
  }
  
  List<String> collectPatternNames(TSNode node) {
    List<String> out = [];
    int i = 0;
    while (i < (node.children.length)) {
      TSNode c = node.children[i];
      bool bindsOwnName = true;
      if ( c.nodeType == "Property" ) {
        if ( c.shorthand == false ) {
          bindsOwnName = false;
        }
      }
      if ( bindsOwnName ) {
        if ( (c.name.length) > 0 ) {
          out.add(c.name);
        }
      }
      List<String> sub = this.collectPatternNames(c);
      int j = 0;
      while (j < (sub.length)) {
        out.add(sub[j]);
        j = j + 1;
      }
      i = i + 1;
    }
    return out;
  }
  
  void recheckStrictSignature(String name, List<TSNode> params) {
    int k = 0;
    while (k < (params.length)) {
      TSNode sp = params[k];
      String spKind = sp.nodeType;
      if ( spKind != "Parameter" ) {
        this.syntaxError("Parse error: a function with a 'use strict' directive must have a simple parameter list");
      } else {
        if ( (sp.init == null) == false ) {
          this.syntaxError("Parse error: a function with a 'use strict' directive must have a simple parameter list");
        }
      }
      k = k + 1;
    }
    if ( (name.length) > 0 ) {
      if ( this.isStrictReservedWord(name) ) {
        this.syntaxError(("Parse error: '" + name) + "' cannot name a function whose body is strict");
      }
    }
    int i = 0;
    while (i < (params.length)) {
      TSNode p = params[i];
      if ( (p.name.length) > 0 ) {
        if ( this.isStrictReservedWord(p.name) ) {
          this.syntaxError(("Parse error: '" + p.name) + "' cannot be a parameter of a strict function");
        }
        int j = 0;
        while (j < i) {
          TSNode q = params[j];
          if ( q.name == p.name ) {
            this.syntaxError(("Parse error: duplicate parameter '" + p.name) + "' in a strict function");
          }
          j = j + 1;
        }
      }
      i = i + 1;
    }
  }
  
  bool hasUseStrictDirective() {
    int i = this.pos;
    int n = this.tokens.length;
    bool scanning = true;
    while ((i < n) && scanning) {
      Token t = this.tokens[i];
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
            Token semi = this.tokens[i];
            if ( semi.value == ";" ) {
              i = i + 1;
            }
          }
        } else {
          scanning = false;
        }
      }
    }
    return false;
  }
  
  bool isStrictReservedReference(String word) {
    if ( word == "eval" ) {
      return false;
    }
    if ( word == "arguments" ) {
      return false;
    }
    return this.isStrictReservedWord(word);
  }
  
  bool isStrictReservedWord(String word) {
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
  }
  
  void checkBindableName(String name) {
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
  }
  
  bool isAlwaysReservedWord(String word) {
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
  }
  
  Token expectModuleExportName() {
    String tt = this.peekType();
    if ( ((((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null")) || (tt == "String") ) {
      Token tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  }
  
  Token expectBindingName() {
    String tt = this.peekType();
    if ( (((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null") ) {
      Token tok = this.peek();
      this.checkBindableName(tok.value);
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  }
  
  Token expect(String expectedType) {
    Token tok = this.peek();
    if ( tok.tokenType != expectedType ) {
      this.syntaxError((("Parse error: expected " + expectedType) + " but got ") + tok.tokenType);
    }
    this.advance();
    return tok;
  }
  
  Token expectValue(String expectedValue) {
    Token tok = this.peek();
    if ( tok.value != expectedValue ) {
      this.syntaxError(((("Parse error: expected '" + expectedValue) + "' but got '") + tok.value) + "'");
    }
    this.advance();
    return tok;
  }
  
  bool isAtEnd() {
    String t = this.peekType();
    return t == "EOF";
  }
  
  bool matchType(String tokenType) {
    String t = this.peekType();
    return t == tokenType;
  }
  
  bool matchValue(String value) {
    String t = this.peekType();
    if ( t == "String" ) {
      return false;
    }
    if ( t == "Template" ) {
      return false;
    }
    if ( t == "Regex" ) {
      return false;
    }
    String v = this.peekValue();
    return v == value;
  }
  
  bool matchPunct(String value) {
    if ( this.peekType() != "Punctuator" ) {
      return false;
    }
    String v = this.peekValue();
    return v == value;
  }
  
  bool isNameToken() {
    String t = this.peekType();
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
  }
  
  bool isMemberKeyToken() {
    if ( this.isNameToken() ) {
      return true;
    }
    String t = this.peekType();
    if ( t == "Number" ) {
      return true;
    }
    if ( t == "String" ) {
      return true;
    }
    return false;
  }
  
  bool isAccessorNameAhead() {
    String nt = this.peekNextType();
    bool keyish = false;
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
  }
  
  bool isObjectPropertyKeyToken() {
    if ( this.isNameToken() ) {
      return true;
    }
    String t = this.peekType();
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
  }
  
  Token parseMemberName() {
    if ( this.matchPunct("#") ) {
      this.advance();
    }
    if ( this.isNameToken() ) {
      Token tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  }
  
  void guardNoProgress(int prevPos) {
    if ( this.pos != prevPos ) {
      return;
    }
    Token recTok = this.peek();
    this.syntaxError(((("Parser recovery: skipping unexpected token '" + recTok.value) + "' (type ") + recTok.tokenType) + ")");
    if ( this.isAtEnd() == false ) {
      this.advance();
    }
  }
  
  TSNode parseProgram() {
    TSNode prog =  TSNode();
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
      int beforePos = this.pos;
      this.atModuleTopLevel = true;
      TSNode stmt = this.parseStatement();
      prog.children.add(stmt);
      this.guardNoProgress(beforePos);
    }
    this.atModuleTopLevel = false;
    if ( this.moduleMode ) {
      int ti = 0;
      while (ti < (this.tokens.length)) {
        Token t = this.tokens[ti];
        if ( t.tokenType == "HtmlComment" ) {
          this.syntaxError("Parse error: HTML-like comments are not allowed in module code");
        }
        ti = ti + 1;
      }
    }
    this.checkPendingExportRefs();
    this.popScope();
    return prog;
  }
  
  bool isParameterInScope(String name) {
    int i = 0;
    int total = this.scopeNames.length;
    while (i < total) {
      String entry = this.scopeNames[i];
      if ( (entry.substring(0, 1 )) == "p" ) {
        if ( (entry.substring(2, (entry.length) )) == name ) {
          return true;
        }
      }
      i = i + 1;
    }
    return false;
  }
  
  bool isDeclaredAnywhere(String name) {
    int i = 0;
    int total = this.scopeNames.length;
    while (i < total) {
      String entry = this.scopeNames[i];
      if ( (entry.substring(2, (entry.length) )) == name ) {
        return true;
      }
      i = i + 1;
    }
    return false;
  }
  
  void checkPendingExportRefs() {
    int i = 0;
    while (i < (this.pendingExportRefs.length)) {
      String name = this.pendingExportRefs[i];
      if ( this.isDeclaredAnywhere(name) == false ) {
        this.syntaxError(("Parse error: export of undeclared name '" + name) + "'");
      }
      i = i + 1;
    }
  }
  
  TSNode parseStatement() {
    String tokVal = this.peekValue();
    if ( tokVal == "@" ) {
      List<TSNode> decorators = [];
      while (this.matchValue("@")) {
        TSNode dec = this.parseDecorator();
        decorators.add(dec);
      }
      TSNode decorated = this.parseStatement();
      decorated.decorators = decorators;
      return decorated;
    }
    if ( tokVal == "declare" ) {
      return this.parseDeclare();
    }
    if ( tokVal == "import" ) {
      String afterImport = this.peekNextValue();
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
      return this.parseTypeAlias();
    }
    if ( tokVal == "class" ) {
      if ( this.inSingleStatementBody ) {
        this.syntaxError("Parse error: a class declaration cannot be a statement body");
      }
      TSNode classDecl = this.parseClass();
      if ( (classDecl.name.length) == 0 ) {
        if ( this.inExportDefault == false ) {
          this.syntaxError("Parse error: a class declaration needs a name");
        }
      }
      return classDecl;
    }
    if ( tokVal == "abstract" ) {
      String nextVal = this.peekNextValue();
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
      String nextVal_1 = this.peekNextValue();
      if ( nextVal_1 == "enum" ) {
        return this.parseEnum();
      }
    }
    if ( ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") ) {
      String afterKind = this.peekNextValue();
      String afterKindType = this.peekNextType();
      bool startsBinding = false;
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
      String nextVal_2 = this.peekNextValue();
      if ( nextVal_2 == "function" ) {
        this.advance();
        return this.parseFuncDecl(true);
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
      TSNode dbg =  TSNode();
      dbg.nodeType = "DebuggerStatement";
      Token dbgTok = this.peek();
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
      TSNode withNode =  TSNode();
      withNode.nodeType = "WithStatement";
      Token withTok = this.peek();
      withNode.start = withTok.start;
      withNode.line = withTok.line;
      withNode.col = withTok.col;
      if ( this.strictMode ) {
        this.syntaxError("Parse error: 'with' is not allowed in strict mode");
      }
      this.advance();
      this.expectValue("(");
      TSNode withObj = this.parseExprSeq();
      withNode.left = withObj;
      this.expectValue(")");
      bool savedWithBody = this.inSingleStatementBody;
      this.inSingleStatementBody = true;
      this.atModuleTopLevel = false;
      TSNode withBody = this.parseStatement();
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
      TSNode empty =  TSNode();
      empty.nodeType = "EmptyStatement";
      return empty;
    }
    String tokType = this.peekType();
    if ( tokType == "Identifier" ) {
      String nextVal_3 = this.peekNextValue();
      if ( nextVal_3 == ":" ) {
        return this.parseLabeledStatement();
      }
    }
    return this.parseExprStmt();
  }
  
  TSNode parseLabeledStatement() {
    TSNode node =  TSNode();
    node.nodeType = "LabeledStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    Token labelTok = this.expect("Identifier");
    node.name = labelTok.value;
    this.expectValue(":");
    String bodyStart = this.peekValue();
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
    this.activeLabels.add(node.name);
    int scanIdx = this.pos;
    int tokenTotal = this.tokens.length;
    bool scanning = true;
    while (scanning) {
      Token cur = this.tokens[scanIdx];
      if ( (cur.tokenType == "LineComment") || (cur.tokenType == "BlockComment") ) {
        scanIdx = scanIdx + 1;
      } else {
        bool isName = false;
        if ( (cur.tokenType == "Identifier") || (cur.tokenType == "TSType") ) {
          isName = true;
        }
        if ( isName == false ) {
          scanning = false;
        } else {
          int nextIdx = scanIdx + 1;
          bool sawColon = false;
          while (nextIdx < tokenTotal) {
            Token nxt = this.tokens[nextIdx];
            if ( (nxt.tokenType == "LineComment") || (nxt.tokenType == "BlockComment") ) {
              nextIdx = nextIdx + 1;
            } else {
              if ( nxt.value == ":" ) {
                sawColon = true;
              }
              break;
            }
          }
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
    }
    Token labelledTok = this.tokens[scanIdx];
    String labelled = labelledTok.value;
    if ( ((labelled == "for") || (labelled == "while")) || (labelled == "do") ) {
      this.iterationLabels.add(node.name);
    }
    TSNode body = this.parseStatement();
    node.body = body;
    this.activeLabels = this.listWithoutString(this.activeLabels, node.name);
    this.iterationLabels = this.listWithoutString(this.iterationLabels, node.name);
    return node;
  }
  
  bool isInStringList(String value, List<String> list) {
    int i = 0;
    while (i < (list.length)) {
      if ( (list[i]) == value ) {
        return true;
      }
      i = i + 1;
    }
    return false;
  }
  
  List<String> listWithoutString(List<String> list, String value) {
    List<String> out = [];
    int i = 0;
    while (i < (list.length)) {
      String item = list[i];
      if ( item != value ) {
        out.add(item);
      }
      i = i + 1;
    }
    return out;
  }
  
  String peekNextValue() {
    int nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      Token nextTok = this.tokens[nextPos];
      return nextTok.value;
    }
    return "";
  }
  
  TSNode parseReturn() {
    TSNode node =  TSNode();
    node.nodeType = "ReturnStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("return");
    if ( this.functionDepth == 0 ) {
      this.syntaxError("Parse error: 'return' outside of a function");
    }
    String v = this.peekValue();
    bool argOnSameLine = true;
    Token argTok = this.peek();
    if ( argTok.line != startTok.line ) {
      argOnSameLine = false;
    }
    if ( argOnSameLine && ((v != ";") && ((v != "}") && (this.isAtEnd() == false))) ) {
      TSNode arg = this.parseExprSeq();
      node.left = arg;
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  }
  
  TSNode parseBreak() {
    TSNode node =  TSNode();
    node.nodeType = "BreakStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("break");
    if ( this.isNameToken() ) {
      Token labelTok = this.peek();
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
  }
  
  TSNode parseContinue() {
    TSNode node =  TSNode();
    node.nodeType = "ContinueStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("continue");
    if ( this.isNameToken() ) {
      Token labelTok = this.peek();
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
  }
  
  TSNode parseImport() {
    TSNode node =  TSNode();
    node.nodeType = "ImportDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("import");
    if ( this.matchValue("type") ) {
      this.advance();
      node.kind = "type";
    }
    String v = this.peekValue();
    if ( this.peekType() == "String" ) {
      Token bareStr = this.peek();
      this.advance();
      TSNode bareSource =  TSNode();
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
      List<TSNode> specifiers = [];
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        TSNode spec =  TSNode();
        spec.nodeType = "ImportSpecifier";
        if ( this.matchValue("type") ) {
          this.advance();
          spec.kind = "type";
        }
        Token importedName = this.expectModuleExportName();
        spec.name = importedName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          Token localName = this.expectBindingName();
          spec.value = localName.value;
        } else {
          spec.value = importedName.value;
        }
        this.checkBindableName(spec.value);
        this.declareBinding("l", spec.value);
        specifiers.add(spec);
        if ( this.matchValue(",") ) {
          this.advance();
        }
      }
      this.expectValue("}");
      node.children = specifiers;
    }
    if ( v == "*" ) {
      this.advance();
      this.expectValue("as");
      Token namespaceName = this.expectBindingName();
      this.declareBinding("l", namespaceName.value);
      TSNode nsSpec =  TSNode();
      nsSpec.nodeType = "ImportNamespaceSpecifier";
      nsSpec.name = namespaceName.value;
      node.children.add(nsSpec);
    }
    if ( this.matchType("Identifier") ) {
      TSNode defaultSpec =  TSNode();
      defaultSpec.nodeType = "ImportDefaultSpecifier";
      Token defaultName = this.expectBindingName();
      defaultSpec.name = defaultName.value;
      this.declareBinding("l", defaultName.value);
      node.children.add(defaultSpec);
      if ( this.matchValue(",") ) {
        this.advance();
        if ( this.matchValue("*") ) {
          this.advance();
          this.expectValue("as");
          Token nsName = this.expectBindingName();
          this.declareBinding("l", nsName.value);
          TSNode nsSpec2 =  TSNode();
          nsSpec2.nodeType = "ImportNamespaceSpecifier";
          nsSpec2.name = nsName.value;
          node.children.add(nsSpec2);
        }
        if ( this.matchValue("{") ) {
          this.advance();
          while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
            TSNode spec_1 =  TSNode();
            spec_1.nodeType = "ImportSpecifier";
            Token importedName_1 = this.expectModuleExportName();
            spec_1.name = importedName_1.value;
            if ( this.matchValue("as") ) {
              this.advance();
              Token localName_1 = this.expectBindingName();
              spec_1.value = localName_1.value;
            } else {
              spec_1.value = importedName_1.value;
            }
            this.declareBinding("l", spec_1.value);
            node.children.add(spec_1);
            if ( this.matchValue(",") ) {
              this.advance();
            }
          }
          this.expectValue("}");
        }
      }
    }
    if ( this.matchValue("from") ) {
      this.advance();
      Token sourceStr = this.expect("String");
      TSNode source =  TSNode();
      source.nodeType = "StringLiteral";
      source.value = sourceStr.value;
      node.left = source;
    } else {
      if ( node.left == null ) {
        this.syntaxError("Parse error: an import declaration needs a module specifier");
      }
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  }
  
  void registerExportedDeclaration(TSNode decl) {
    if ( decl.nodeType == "VariableDeclaration" ) {
      int i = 0;
      while (i < (decl.children.length)) {
        TSNode d = decl.children[i];
        this.registerExportName(d.name);
        i = i + 1;
      }
      return;
    }
    this.registerExportName(decl.name);
  }
  
  void registerExportName(String name) {
    if ( (name.length) == 0 ) {
      return;
    }
    if ( this.isInStringList(name, this.exportedNames) ) {
      this.syntaxError(("Parse error: duplicate export of '" + name) + "'");
    }
    this.exportedNames.add(name);
  }
  
  TSNode parseExport() {
    TSNode node =  TSNode();
    node.nodeType = "ExportNamedDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("export");
    if ( this.matchValue("type") ) {
      String nextV = this.peekNextValue();
      if ( nextV == "{" ) {
        this.advance();
        node.kind = "type";
      }
    }
    String v = this.peekValue();
    if ( v == "default" ) {
      node.nodeType = "ExportDefaultDeclaration";
      this.registerExportName("default");
      this.advance();
      String nextVal = this.peekValue();
      if ( ((nextVal == "class") || (nextVal == "function")) || (nextVal == "interface") ) {
        bool savedExportDefault = this.inExportDefault;
        this.inExportDefault = true;
        TSNode decl = this.parseStatement();
        this.inExportDefault = savedExportDefault;
        node.left = decl;
      } else {
        TSNode expr = this.parseExpr();
        node.left = expr;
      }
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "{" ) {
      this.advance();
      List<TSNode> specifiers = [];
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        TSNode spec =  TSNode();
        spec.nodeType = "ExportSpecifier";
        Token localName = this.expectModuleExportName();
        spec.name = localName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          Token exportedName = this.expectModuleExportName();
          spec.value = exportedName.value;
        } else {
          spec.value = localName.value;
        }
        this.registerExportName(spec.value);
        this.pendingExportRefs.add(localName.value);
        specifiers.add(spec);
        if ( this.matchValue(",") ) {
          this.advance();
        }
      }
      this.expectValue("}");
      node.children = specifiers;
      if ( this.matchValue("from") ) {
        this.advance();
        Token sourceStr = this.expect("String");
        TSNode source =  TSNode();
        source.nodeType = "StringLiteral";
        source.value = sourceStr.value;
        node.left = source;
        List<String> emptyRefs = [];
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
        Token exportName = this.expect("Identifier");
        node.name = exportName.value;
      }
      this.expectValue("from");
      Token sourceStr_1 = this.expect("String");
      TSNode source_1 =  TSNode();
      source_1.nodeType = "StringLiteral";
      source_1.value = sourceStr_1.value;
      node.left = source_1;
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( ((((((((v == "function") || (v == "class")) || (v == "interface")) || (v == "type")) || (v == "var")) || (v == "const")) || (v == "let")) || (v == "enum")) || (v == "abstract") ) {
      TSNode decl_1 = this.parseStatement();
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
      TSNode decl_2 = this.parseStatement();
      node.left = decl_2;
      this.registerExportedDeclaration(decl_2);
      return node;
    }
    this.syntaxError(("Parse error: '" + v) + "' cannot follow 'export'");
    return node;
  }
  
  TSNode parseInterface() {
    TSNode node =  TSNode();
    node.nodeType = "TSInterfaceDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("interface");
    Token nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    if ( this.matchValue("<") ) {
      List<TSNode> typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    if ( this.matchValue("extends") ) {
      this.advance();
      List<TSNode> extendsList = [];
      TSNode extendsType = this.parseType();
      extendsList.add(extendsType);
      while (this.matchValue(",")) {
        this.advance();
        TSNode nextType = this.parseType();
        extendsList.add(nextType);
      }
      for ( int i = 0; i < extendsList.length; i++) {
        var ext = extendsList[i];
        TSNode wrapper =  TSNode();
        wrapper.nodeType = "TSExpressionWithTypeArguments";
        wrapper.left = ext;
        node.children.add(wrapper);
      }
    }
    TSNode body = this.parseInterfaceBody();
    node.body = body;
    return node;
  }
  
  TSNode parseInterfaceBody() {
    TSNode body =  TSNode();
    body.nodeType = "TSInterfaceBody";
    Token startTok = this.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      TSNode prop = this.parsePropertySig();
      body.children.add(prop);
      if ( this.matchValue(";") || this.matchValue(",") ) {
        this.advance();
      }
    }
    this.expectValue("}");
    return body;
  }
  
  List<TSNode> parseTypeParams() {
    List<TSNode> params = [];
    this.expectValue("<");
    while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
      if ( (params.length) > 0 ) {
        this.expectValue(",");
      }
      TSNode param =  TSNode();
      param.nodeType = "TSTypeParameter";
      Token nameTok = this.expect("Identifier");
      param.name = nameTok.value;
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if ( this.matchValue("extends") ) {
        this.advance();
        TSNode constraint = this.parseType();
        param.typeAnnotation = constraint;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode defaultType = this.parseType();
        param.init = defaultType;
      }
      params.add(param);
    }
    this.expectValue(">");
    return params;
  }
  
  TSNode parsePropertySig() {
    Token startTok = this.peek();
    int startPos = startTok.start;
    int startLine = startTok.line;
    int startCol = startTok.col;
    bool isReadonly = false;
    if ( this.matchValue("readonly") ) {
      isReadonly = true;
      this.advance();
    }
    if ( this.matchValue("[") ) {
      this.advance();
      Token paramTok = this.expect("Identifier");
      return this.parseIndexSignatureRest(isReadonly, paramTok, startPos, startLine, startCol);
    }
    if ( this.matchValue("(") ) {
      return this.parseCallSignature(startPos, startLine, startCol);
    }
    if ( this.matchValue("new") ) {
      return this.parseConstructSignature(startPos, startLine, startCol);
    }
    TSNode prop =  TSNode();
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.readonly = isReadonly;
    Token nameTok = this.expect("Identifier");
    prop.name = nameTok.value;
    if ( this.matchValue("?") ) {
      prop.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      TSNode typeAnnot = this.parseTypeAnnotation();
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  }
  
  TSNode parseCallSignature(int startPos, int startLine, int startCol) {
    TSNode sig =  TSNode();
    sig.nodeType = "TSCallSignatureDeclaration";
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    if ( this.matchValue("<") ) {
      List<TSNode> typeParams = this.parseTypeParams();
      sig.params = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (sig.children.length) > 0 ) {
        this.expectValue(",");
      }
      TSNode param = this.parseParam();
      sig.children.add(param);
    }
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      TSNode typeAnnot = this.parseTypeAnnotation();
      sig.typeAnnotation = typeAnnot;
    }
    return sig;
  }
  
  TSNode parseConstructSignature(int startPos, int startLine, int startCol) {
    TSNode sig =  TSNode();
    sig.nodeType = "TSConstructSignatureDeclaration";
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    this.expectValue("new");
    if ( this.matchValue("<") ) {
      List<TSNode> typeParams = this.parseTypeParams();
      sig.params = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (sig.children.length) > 0 ) {
        this.expectValue(",");
      }
      TSNode param = this.parseParam();
      sig.children.add(param);
    }
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      TSNode typeAnnot = this.parseTypeAnnotation();
      sig.typeAnnotation = typeAnnot;
    }
    return sig;
  }
  
  TSNode parseTypeAlias() {
    TSNode node =  TSNode();
    node.nodeType = "TSTypeAliasDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("type");
    Token nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    if ( this.matchValue("<") ) {
      List<TSNode> typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    this.expectValue("=");
    TSNode typeExpr = this.parseType();
    node.typeAnnotation = typeExpr;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  }
  
  TSNode parseDecorator() {
    TSNode node =  TSNode();
    node.nodeType = "Decorator";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("@");
    TSNode expr = this.parsePostfix();
    node.left = expr;
    return node;
  }
  
  TSNode parseClass() {
    TSNode node =  TSNode();
    node.nodeType = "ClassDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("abstract") ) {
      node.kind = "abstract";
      this.advance();
    }
    this.expectValue("class");
    bool classNameFollows = this.isNameToken();
    if ( this.matchValue("extends") ) {
      classNameFollows = false;
    }
    if ( this.matchValue("implements") ) {
      classNameFollows = false;
    }
    if ( classNameFollows ) {
      bool savedNameStrict = this.strictMode;
      this.strictMode = true;
      Token nameTok = this.expectBindingName();
      this.strictMode = savedNameStrict;
      node.name = nameTok.value;
      this.declareBinding("l", nameTok.value);
    }
    if ( this.matchValue("<") ) {
      List<TSNode> typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    bool savedDerived = this.inDerivedClass;
    this.inDerivedClass = false;
    bool savedClassStrictAll = this.strictMode;
    this.strictMode = true;
    if ( this.matchValue("extends") ) {
      this.inDerivedClass = true;
      this.advance();
      TSNode superClass = this.parsePostfix();
      TSNode extendsNode =  TSNode();
      extendsNode.nodeType = "TSExpressionWithTypeArguments";
      extendsNode.left = superClass;
      node.left = extendsNode;
    }
    if ( this.matchValue("implements") ) {
      this.advance();
      TSNode impl = this.parseType();
      TSNode implNode =  TSNode();
      implNode.nodeType = "TSExpressionWithTypeArguments";
      implNode.left = impl;
      node.children.add(implNode);
      while (this.matchValue(",")) {
        this.advance();
        TSNode nextImpl = this.parseType();
        TSNode nextImplNode =  TSNode();
        nextImplNode.nodeType = "TSExpressionWithTypeArguments";
        nextImplNode.left = nextImpl;
        node.children.add(nextImplNode);
      }
    }
    TSNode body = this.parseClassBody();
    node.body = body;
    this.inDerivedClass = savedDerived;
    this.strictMode = savedClassStrictAll;
    return node;
  }
  
  TSNode parseClassBody() {
    TSNode body =  TSNode();
    body.nodeType = "ClassBody";
    Token startTok = this.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    this.expectValue("{");
    bool savedClassStrict = this.strictMode;
    this.strictMode = true;
    bool sawConstructor = false;
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      if ( this.matchValue(";") ) {
        this.advance();
      } else {
        TSNode member = this.parseClassMember();
        if ( member.computed == false ) {
          bool namesConstructor = false;
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
        body.children.add(member);
        if ( this.matchValue(";") ) {
          this.advance();
        } else {
          if ( member.nodeType == "PropertyDefinition" ) {
            if ( this.matchValue("}") == false ) {
              Token nextMember = this.peek();
              if ( nextMember.line == this.lastTokenLine ) {
                this.syntaxError("Parse error: missing ';' between class members");
              }
            }
          }
        }
      }
    }
    this.strictMode = savedClassStrict;
    this.expectValue("}");
    return body;
  }
  
  TSNode parseClassMember() {
    TSNode member =  TSNode();
    Token startTok = this.peek();
    member.start = startTok.start;
    member.line = startTok.line;
    member.col = startTok.col;
    List<TSNode> decorators = [];
    while (this.matchValue("@")) {
      TSNode dec = this.parseDecorator();
      decorators.add(dec);
    }
    if ( (decorators.length) > 0 ) {
      member.decorators = decorators;
    }
    bool isStatic = false;
    bool isAbstract = false;
    bool isReadonly = false;
    bool isAsync = false;
    String accessibility = "";
    bool keepParsing = true;
    while (keepParsing) {
      int modifierStartPos = this.pos;
      String tokVal = this.peekValue();
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
        String afterStatic = this.peekNextValue();
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
      String newTokVal = this.peekValue();
      if ( ((((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly")) && (newTokVal != "async") ) {
        keepParsing = false;
      }
      if ( newTokVal == "static" ) {
        if ( isStatic ) {
          String afterRepeat = this.peekNextValue();
          if ( (((afterRepeat != "(") && (afterRepeat != "=")) && (afterRepeat != ";")) && (afterRepeat != "}") ) {
            this.syntaxError("Parse error: 'static' may appear only once on a class member");
            keepParsing = false;
          }
        }
      }
      if ( this.pos == modifierStartPos ) {
        keepParsing = false;
      }
    }
    if ( this.matchValue("constructor") && (isStatic == false) ) {
      member.nodeType = "MethodDefinition";
      member.kind = "constructor";
      this.advance();
      this.pushScope(true);
      this.functionDepth = this.functionDepth + 1;
      bool savedCtorRest = this.sawRestParam;
      this.sawRestParam = false;
      bool savedCtorSuperCall = this.allowSuperCall;
      bool savedCtorSuperProp = this.allowSuperProperty;
      int savedctorIter = this.iterationDepth;
      int savedctorSwitch = this.switchDepth;
      List<String> savedctorLabels = this.activeLabels;
      List<String> savedctorIterLabels = this.iterationLabels;
      List<String> freshctorLabels = [];
      List<String> freshctorIterLabels = [];
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
        }
        TSNode param = this.parseConstructorParam();
        if ( (param.name.length) > 0 ) {
          this.declareBinding("p", param.name);
        }
        member.params.add(param);
      }
      this.expectValue(")");
      if ( this.matchValue("{") ) {
        this.suppressBlockScope = true;
        TSNode bodyNode = this.parseBlock();
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
    String accessorKind = "";
    if ( this.matchValue("get") || this.matchValue("set") ) {
      String accessorWord = this.peekValue();
      String afterAccessor = this.peekNextValue();
      String afterAccessorType = this.peekNextType();
      bool looksLikeAccessor = false;
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
      TSNode keyExpr = this.parseExpr();
      this.expectValue("]");
      member.computed = true;
      member.init = keyExpr;
    } else {
      Token nameTok = this.peek();
      if ( this.isMemberKeyToken() ) {
        this.advance();
      } else {
        nameTok = this.expect("Identifier");
      }
      member.name = nameTok.value;
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
        member._async = true;
      }
      this.pushScope(true);
      bool savedMethodRest = this.sawRestParam;
      this.sawRestParam = false;
      bool savedMethodGenerator = this.inGenerator;
      this.inGenerator = member.generator;
      bool savedMethodSuperCall = this.allowSuperCall;
      bool savedMethodSuperProp = this.allowSuperProperty;
      int savedmethIter = this.iterationDepth;
      int savedmethSwitch = this.switchDepth;
      List<String> savedmethLabels = this.activeLabels;
      List<String> savedmethIterLabels = this.iterationLabels;
      List<String> freshmethLabels = [];
      List<String> freshmethIterLabels = [];
      this.iterationDepth = 0;
      this.switchDepth = 0;
      this.activeLabels = freshmethLabels;
      this.iterationLabels = freshmethIterLabels;
      this.functionDepth = this.functionDepth + 1;
      bool isCtorNamed = false;
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
        }
        TSNode param_1 = this.parseParam();
        if ( (param_1.name.length) > 0 ) {
          this.declareBinding("p", param_1.name);
        }
        member.params.add(param_1);
      }
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
          TSNode setP = member.params[0];
          if ( setP.nodeType == "RestElement" ) {
            this.syntaxError("Parse error: a setter parameter may not be a rest element");
          }
        }
      }
      if ( this.matchValue(":") ) {
        TSNode returnType = this.parseTypeAnnotation();
        member.typeAnnotation = returnType;
      }
      if ( this.matchValue("{") ) {
        this.suppressBlockScope = true;
        TSNode bodyNode_1 = this.parseBlock();
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
        TSNode typeAnnot = this.parseTypeAnnotation();
        member.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode initExpr = this.parseExprSeq();
        member.init = initExpr;
      }
    }
    return member;
  }
  
  TSNode parseConstructorParam() {
    TSNode param =  TSNode();
    param.nodeType = "Parameter";
    Token startTok = this.peek();
    param.start = startTok.start;
    param.line = startTok.line;
    param.col = startTok.col;
    String tokVal = this.peekValue();
    if ( (((tokVal == "public") || (tokVal == "private")) || (tokVal == "protected")) || (tokVal == "readonly") ) {
      param.kind = tokVal;
      this.advance();
      String nextVal = this.peekValue();
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
      TSNode ctorPattern = this.parseBindingTarget();
      if ( this.matchValue(":") ) {
        TSNode ctorPatType = this.parseTypeAnnotation();
        ctorPattern.typeAnnotation = ctorPatType;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode ctorDefault = this.parseExpr();
        TSNode ctorAssign =  TSNode();
        ctorAssign.nodeType = "AssignmentPattern";
        ctorAssign.left = ctorPattern;
        ctorAssign.right = ctorDefault;
        return ctorAssign;
      }
      return ctorPattern;
    }
    Token nameTok = this.expectBindingName();
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
      TSNode typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    if ( this.matchValue("=") ) {
      this.advance();
      TSNode defaultVal = this.parseExpr();
      param.init = defaultVal;
    }
    return param;
  }
  
  TSNode parseEnum() {
    TSNode node =  TSNode();
    node.nodeType = "TSEnumDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("const") ) {
      node.kind = "const";
      this.advance();
    }
    this.expectValue("enum");
    Token nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      TSNode member =  TSNode();
      member.nodeType = "TSEnumMember";
      Token memberTok = this.expect("Identifier");
      member.name = memberTok.value;
      member.start = memberTok.start;
      member.line = memberTok.line;
      member.col = memberTok.col;
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode initVal = this.parseExpr();
        member.init = initVal;
      }
      node.children.add(member);
      if ( this.matchValue(",") ) {
        this.advance();
      }
    }
    this.expectValue("}");
    return node;
  }
  
  TSNode parseNamespace() {
    TSNode node =  TSNode();
    node.nodeType = "TSModuleDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("namespace");
    Token nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("{");
    TSNode body =  TSNode();
    body.nodeType = "TSModuleBlock";
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      int beforePos = this.pos;
      TSNode stmt = this.parseStatement();
      body.children.add(stmt);
      this.guardNoProgress(beforePos);
    }
    this.expectValue("}");
    node.body = body;
    return node;
  }
  
  TSNode parseDeclare() {
    Token startTok = this.peek();
    this.expectValue("declare");
    String nextVal = this.peekValue();
    if ( nextVal == "module" ) {
      TSNode node =  TSNode();
      node.nodeType = "TSModuleDeclaration";
      node.start = startTok.start;
      node.line = startTok.line;
      node.col = startTok.col;
      node.kind = "declare";
      this.advance();
      Token nameTok = this.peek();
      if ( this.matchType("String") ) {
        this.advance();
        node.name = nameTok.value;
      } else {
        this.advance();
        node.name = nameTok.value;
      }
      this.expectValue("{");
      TSNode body =  TSNode();
      body.nodeType = "TSModuleBlock";
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        int beforePos = this.pos;
        TSNode stmt = this.parseStatement();
        body.children.add(stmt);
        this.guardNoProgress(beforePos);
      }
      this.expectValue("}");
      node.body = body;
      return node;
    }
    TSNode node_1 = this.parseStatement();
    node_1.kind = "declare";
    return node_1;
  }
  
  TSNode parseIfStatement() {
    TSNode node =  TSNode();
    node.nodeType = "IfStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("if");
    this.expectValue("(");
    TSNode test = this.parseExpr();
    node.left = test;
    this.expectValue(")");
    bool savedConsBody = this.inSingleStatementBody;
    bool savedConsIf = this.singleBodyIsIfBranch;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.singleBodyIsIfBranch = true;
    this.atModuleTopLevel = false;
    TSNode consequent = this.parseStatement();
    this.inSingleStatementBody = savedConsBody;
    this.singleBodyIsIfBranch = savedConsIf;
    node.body = consequent;
    if ( this.matchValue("else") ) {
      this.advance();
      bool savedAltBody = this.inSingleStatementBody;
      bool savedAltIf = this.singleBodyIsIfBranch;
      this.inSingleStatementBody = true;
      this.atModuleTopLevel = false;
      this.singleBodyIsIfBranch = true;
      TSNode alternate = this.parseStatement();
      this.inSingleStatementBody = savedAltBody;
      this.singleBodyIsIfBranch = savedAltIf;
      node.right = alternate;
    }
    return node;
  }
  
  TSNode parseWhileStatement() {
    TSNode node =  TSNode();
    node.nodeType = "WhileStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("while");
    this.expectValue("(");
    TSNode test = this.parseExpr();
    node.left = test;
    this.expectValue(")");
    bool savedBodyFlag0 = this.inSingleStatementBody;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.iterationDepth = this.iterationDepth + 1;
    TSNode body = this.parseStatement();
    this.iterationDepth = this.iterationDepth - 1;
    this.inSingleStatementBody = savedBodyFlag0;
    node.body = body;
    return node;
  }
  
  TSNode parseDoWhileStatement() {
    TSNode node =  TSNode();
    node.nodeType = "DoWhileStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("do");
    bool savedBodyFlag1 = this.inSingleStatementBody;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.iterationDepth = this.iterationDepth + 1;
    TSNode body = this.parseStatement();
    this.iterationDepth = this.iterationDepth - 1;
    this.inSingleStatementBody = savedBodyFlag1;
    node.body = body;
    this.expectValue("while");
    this.expectValue("(");
    TSNode test = this.parseExpr();
    node.left = test;
    this.expectValue(")");
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  }
  
  TSNode parseThrow() {
    TSNode node =  TSNode();
    node.nodeType = "ThrowStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("throw");
    Token throwArgTok = this.peek();
    if ( throwArgTok.line != this.lastTokenLine ) {
      this.syntaxError("Parse error: no line terminator is allowed after 'throw'");
    }
    if ( (this.isAtEnd() || (throwArgTok.value == ";")) || (throwArgTok.value == "}") ) {
      this.syntaxError("Parse error: 'throw' requires an argument");
    }
    TSNode arg = this.parseExpr();
    node.left = arg;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  }
  
  bool containsInOperator(TSNode node) {
    if ( node.nodeType == "BinaryExpression" ) {
      if ( node.value == "in" ) {
        return true;
      }
    }
    int i = 0;
    while (i < (node.children.length)) {
      TSNode c = node.children[i];
      if ( this.containsInOperator(c) ) {
        return true;
      }
      i = i + 1;
    }
    return false;
  }
  
  TSNode parseForStatement() {
    TSNode node =  TSNode();
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("for");
    bool isAwait = false;
    if ( this.matchValue("await") ) {
      this.advance();
      isAwait = true;
    }
    this.expectValue("(");
    this.pushScope(false);
    String tokVal = this.peekValue();
    bool headIsDecl = true;
    if ( tokVal == "let" ) {
      String afterLet = this.peekNextValue();
      if ( (((((afterLet == "in") || (afterLet == "of")) || (afterLet == "=")) || (afterLet == ";")) || (afterLet == ".")) || (afterLet == "(") ) {
        headIsDecl = false;
      }
    }
    if ( (((tokVal == "let") || (tokVal == "const")) || (tokVal == "var")) && headIsDecl ) {
      String kind = tokVal;
      this.advance();
      String headDeclKind = "v";
      if ( kind == "let" ) {
        headDeclKind = "l";
      }
      if ( kind == "const" ) {
        headDeclKind = "l";
      }
      String savedHeadDeclaring = this.declaringKind;
      this.declaringKind = headDeclKind;
      bool hasPattern = false;
      TSNode patternNode =  TSNode();
      String varNameStr = "";
      String bindTokVal = this.peekValue();
      if ( bindTokVal == "[" ) {
        hasPattern = true;
        patternNode = this.parseArrayPattern();
      } else {
        if ( bindTokVal == "{" ) {
          hasPattern = true;
          patternNode = this.parseObjectPattern();
        } else {
          Token vt = this.expectBindingName();
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
      String nextVal = this.peekValue();
      if ( nextVal == "of" ) {
        if ( (varNameStr.length) > 0 ) {
          if ( this.isParameterInScope(varNameStr) ) {
            this.syntaxError(("Parse error: '" + varNameStr) + "' shadows a parameter in a for-of head");
          }
        }
        node.nodeType = "ForOfStatement";
        node._await = isAwait;
        this.advance();
        TSNode left =  TSNode();
        left.nodeType = "VariableDeclaration";
        left.kind = kind;
        TSNode declarator =  TSNode();
        declarator.nodeType = "VariableDeclarator";
        if ( hasPattern ) {
          declarator.left = patternNode;
        } else {
          declarator.name = varNameStr;
        }
        left.children.add(declarator);
        node.left = left;
        TSNode right = this.parseExpr();
        node.right = right;
        this.expectValue(")");
        bool savedBodyFlag2 = this.inSingleStatementBody;
        this.inSingleStatementBody = true;
        this.atModuleTopLevel = false;
        this.iterationDepth = this.iterationDepth + 1;
        TSNode body = this.parseStatement();
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
        TSNode left_1 =  TSNode();
        left_1.nodeType = "VariableDeclaration";
        left_1.kind = kind;
        TSNode declarator_1 =  TSNode();
        declarator_1.nodeType = "VariableDeclarator";
        if ( hasPattern ) {
          declarator_1.left = patternNode;
        } else {
          declarator_1.name = varNameStr;
        }
        left_1.children.add(declarator_1);
        node.left = left_1;
        TSNode right_1 = this.parseExpr();
        node.right = right_1;
        this.expectValue(")");
        bool savedBodyFlag3 = this.inSingleStatementBody;
        this.inSingleStatementBody = true;
        this.atModuleTopLevel = false;
        this.iterationDepth = this.iterationDepth + 1;
        TSNode body_1 = this.parseStatement();
        this.iterationDepth = this.iterationDepth - 1;
        this.inSingleStatementBody = savedBodyFlag3;
        node.body = body_1;
        this.popScope();
        return node;
      }
      node.nodeType = "ForStatement";
      TSNode initDecl =  TSNode();
      initDecl.nodeType = "VariableDeclaration";
      initDecl.kind = kind;
      TSNode declarator_2 =  TSNode();
      declarator_2.nodeType = "VariableDeclarator";
      if ( hasPattern ) {
        declarator_2.left = patternNode;
      } else {
        declarator_2.name = varNameStr;
      }
      if ( this.matchValue(":") ) {
        TSNode typeAnnot = this.parseTypeAnnotation();
        declarator_2.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode initVal = this.parseExpr();
        declarator_2.init = initVal;
      } else {
        if ( kind == "const" ) {
          this.syntaxError("Parse error: a 'const' declaration must have an initializer");
        }
      }
      initDecl.children.add(declarator_2);
      while (this.matchValue(",")) {
        this.advance();
        TSNode more =  TSNode();
        more.nodeType = "VariableDeclarator";
        String savedMoreDeclaring = this.declaringKind;
        this.declaringKind = headDeclKind;
        TSNode moreTarget = this.parseBindingTarget();
        this.declaringKind = savedMoreDeclaring;
        if ( moreTarget.nodeType == "Identifier" ) {
          more.name = moreTarget.name;
        } else {
          more.left = moreTarget;
        }
        if ( this.matchValue(":") ) {
          TSNode moreType = this.parseTypeAnnotation();
          more.typeAnnotation = moreType;
        }
        if ( this.matchValue("=") ) {
          this.advance();
          TSNode moreInit = this.parseExpr();
          more.init = moreInit;
        } else {
          if ( kind == "const" ) {
            this.syntaxError("Parse error: a 'const' declaration must have an initializer");
          }
        }
        initDecl.children.add(more);
      }
      node.init = initDecl;
    } else {
      node.nodeType = "ForStatement";
      if ( this.matchValue(";") == false ) {
        TSNode initExpr = this.parseExpr();
        if ( this.matchValue("of") ) {
          node.nodeType = "ForOfStatement";
          node._await = isAwait;
          if ( tokVal == "let" ) {
            this.syntaxError("Parse error: a for-of head may not start with 'let'");
          }
          this.checkAssignmentTarget(initExpr);
          this.advance();
          node.left = initExpr;
          TSNode ofRight = this.parseExpr();
          node.right = ofRight;
          this.expectValue(")");
          bool savedBodyFlag4 = this.inSingleStatementBody;
          this.inSingleStatementBody = true;
          this.atModuleTopLevel = false;
          this.iterationDepth = this.iterationDepth + 1;
          TSNode ofBody = this.parseStatement();
          this.iterationDepth = this.iterationDepth - 1;
          this.inSingleStatementBody = savedBodyFlag4;
          node.body = ofBody;
          this.popScope();
          return node;
        }
        if ( initExpr.nodeType == "BinaryExpression" ) {
          if ( initExpr.value == "in" ) {
            if ( this.matchValue(")") ) {
              node.nodeType = "ForInStatement";
              if ( initExpr.parenthesized ) {
                this.syntaxError("Parse error: the 'in' operator is not allowed in a for-initialiser");
              }
              TSNode inLeft = initExpr.left!;
              this.checkAssignmentTarget(inLeft);
              node.left = inLeft;
              node.right = initExpr.right!;
              this.expectValue(")");
              bool savedBodyFlag5 = this.inSingleStatementBody;
              this.inSingleStatementBody = true;
              this.atModuleTopLevel = false;
              this.iterationDepth = this.iterationDepth + 1;
              TSNode inBody = this.parseStatement();
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
          TSNode seq =  TSNode();
          seq.nodeType = "SequenceExpression";
          seq.start = initExpr.start;
          seq.line = initExpr.line;
          seq.col = initExpr.col;
          seq.children.add(initExpr);
          while (this.matchValue(",")) {
            this.advance();
            TSNode more_1 = this.parseExpr();
            seq.children.add(more_1);
          }
          node.init = seq;
        } else {
          node.init = initExpr;
        }
      }
    }
    this.expectValue(";");
    if ( this.matchValue(";") == false ) {
      TSNode test = this.parseExprSeq();
      node.left = test;
    }
    this.expectValue(";");
    if ( this.matchValue(")") == false ) {
      TSNode update = this.parseExprSeq();
      node.right = update;
    }
    this.expectValue(")");
    bool savedBodyFlag6 = this.inSingleStatementBody;
    this.inSingleStatementBody = true;
    this.atModuleTopLevel = false;
    this.iterationDepth = this.iterationDepth + 1;
    TSNode body_2 = this.parseStatement();
    this.iterationDepth = this.iterationDepth - 1;
    this.inSingleStatementBody = savedBodyFlag6;
    node.body = body_2;
    this.popScope();
    return node;
  }
  
  TSNode parseSwitchStatement() {
    TSNode node =  TSNode();
    node.nodeType = "SwitchStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("switch");
    this.expectValue("(");
    TSNode discriminant = this.parseExpr();
    node.left = discriminant;
    this.expectValue(")");
    this.expectValue("{");
    this.switchDepth = this.switchDepth + 1;
    bool sawDefaultClause = false;
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      TSNode caseNode =  TSNode();
      if ( this.matchValue("default") ) {
        if ( sawDefaultClause ) {
          this.syntaxError("Parse error: a switch may have only one default clause");
        }
        sawDefaultClause = true;
      }
      if ( this.matchValue("case") ) {
        caseNode.nodeType = "SwitchCase";
        this.advance();
        TSNode test = this.parseExpr();
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
        int beforePos = this.pos;
        TSNode stmt = this.parseStatement();
        caseNode.children.add(stmt);
        this.guardNoProgress(beforePos);
      }
      node.children.add(caseNode);
    }
    this.switchDepth = this.switchDepth - 1;
    this.expectValue("}");
    return node;
  }
  
  TSNode parseTryStatement() {
    TSNode node =  TSNode();
    node.nodeType = "TryStatement";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("try");
    TSNode tryBlock = this.parseBlock();
    node.body = tryBlock;
    if ( this.matchValue("catch") ) {
      TSNode catchNode =  TSNode();
      catchNode.nodeType = "CatchClause";
      this.advance();
      this.pushScope(false);
      if ( this.matchValue("(") ) {
        this.advance();
        String savedCatchDeclaring = this.declaringKind;
        this.declaringKind = "p";
        TSNode param = this.parseBindingTarget();
        this.declaringKind = savedCatchDeclaring;
        catchNode.name = param.name;
        catchNode.left = param;
        if ( this.matchValue(":") ) {
          TSNode typeAnnot = this.parseTypeAnnotation();
          catchNode.typeAnnotation = typeAnnot;
        }
        this.expectValue(")");
      }
      this.suppressBlockScope = true;
      TSNode catchBlock = this.parseBlock();
      catchNode.body = catchBlock;
      this.popScope();
      node.left = catchNode;
    }
    bool sawHandler = false;
    if ( (node.left == null) == false ) {
      sawHandler = true;
    }
    if ( this.matchValue("finally") ) {
      this.advance();
      TSNode finallyBlock = this.parseBlock();
      node.right = finallyBlock;
      sawHandler = true;
    }
    if ( sawHandler == false ) {
      this.syntaxError("Parse error: 'try' requires a catch or a finally clause");
    }
    return node;
  }
  
  TSNode parseVarDecl() {
    TSNode node =  TSNode();
    node.nodeType = "VariableDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    node.kind = startTok.value;
    this.advance();
    bool moreDecls = true;
    while (moreDecls) {
      TSNode declarator =  TSNode();
      declarator.nodeType = "VariableDeclarator";
      String nextVal = this.peekValue();
      String declKind = "v";
      if ( node.kind == "let" ) {
        declKind = "l";
      }
      if ( node.kind == "const" ) {
        declKind = "l";
      }
      String savedVarDeclaring = this.declaringKind;
      this.declaringKind = declKind;
      bool savedVarMemberTarget = this.patternAllowsMemberTarget;
      this.patternAllowsMemberTarget = false;
      if ( nextVal == "{" ) {
        TSNode pattern = this.parseObjectPattern();
        declarator.left = pattern;
        declarator.start = pattern.start;
        declarator.line = pattern.line;
        declarator.col = pattern.col;
      } else {
        if ( nextVal == "[" ) {
          TSNode pattern_1 = this.parseArrayPattern();
          declarator.left = pattern_1;
          declarator.start = pattern_1.start;
          declarator.line = pattern_1.line;
          declarator.col = pattern_1.col;
        } else {
          Token nameTok = this.expectBindingName();
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
        TSNode typeAnnot = this.parseTypeAnnotation();
        declarator.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode initExpr = this.parseExpr();
        declarator.init = initExpr;
      }
      if ( declarator.init == null ) {
        if ( declarator.left != null ) {
          if ( declarator.typeAnnotation == null ) {
            this.syntaxError("Parse error: a destructuring declaration must have an initializer");
          }
        }
      }
      if ( node.kind == "const" ) {
        if ( declarator.init == null ) {
          if ( declarator.typeAnnotation == null ) {
            this.syntaxError("Parse error: a 'const' declaration must have an initializer");
          }
        }
      }
      node.children.add(declarator);
      if ( this.matchValue(",") ) {
        this.advance();
      } else {
        moreDecls = false;
      }
    }
    if ( this.matchValue(";") ) {
      this.advance();
    } else {
      if ( this.isAtEnd() == false ) {
        Token afterDecl = this.peek();
        if ( afterDecl.value != "}" ) {
          if ( afterDecl.line == this.lastTokenLine ) {
            this.syntaxError("Parse error: missing ';' after a declaration");
          }
        }
      }
    }
    return node;
  }
  
  bool isAssignmentPatternFollow() {
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
  }
  
  TSNode parseBindingTarget() {
    if ( this.matchValue("{") ) {
      return this.parseObjectPattern();
    }
    if ( this.matchValue("[") ) {
      return this.parseArrayPattern();
    }
    if ( this.patternAllowsMemberTarget ) {
      TSNode lhs = this.parsePostfix();
      if ( this.strictMode ) {
        if ( lhs.nodeType == "Identifier" ) {
          if ( (lhs.name == "eval") || (lhs.name == "arguments") ) {
            this.syntaxError(("Parse error: cannot assign to '" + lhs.name) + "' in strict mode");
          }
        }
      }
      String lt = lhs.nodeType;
      if ( (((((lt != "Identifier") && (lt != "MemberExpression")) && (lt != "ArrayPattern")) && (lt != "ObjectPattern")) && (lt != "ArrayExpression")) && (lt != "ObjectExpression") ) {
        this.syntaxError(("Parse error: '" + lt) + "' is not a valid destructuring target");
      }
      return lhs;
    }
    Token tok = this.peek();
    String tt = this.peekType();
    if ( (((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword") ) {
      this.checkBindableName(tok.value);
      this.advance();
      TSNode id =  TSNode();
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
    Token bad = this.expect("Identifier");
    TSNode errId =  TSNode();
    errId.nodeType = "Identifier";
    errId.name = bad.value;
    return errId;
  }
  
  TSNode parseBindingElement() {
    TSNode target = this.parseBindingTarget();
    if ( this.matchValue("=") ) {
      this.advance();
      String savedDeclaring = this.declaringKind;
      bool wasLexical = savedDeclaring == "l";
      this.declaringKind = "";
      bool savedNoLet = this.noLetReference;
      if ( wasLexical ) {
        this.noLetReference = true;
      }
      TSNode defaultExpr = this.parseExpr();
      this.noLetReference = savedNoLet;
      this.declaringKind = savedDeclaring;
      TSNode assignPat =  TSNode();
      assignPat.nodeType = "AssignmentPattern";
      assignPat.left = target;
      assignPat.right = defaultExpr;
      assignPat.start = target.start;
      assignPat.line = target.line;
      assignPat.col = target.col;
      return assignPat;
    }
    return target;
  }
  
  TSNode parseObjectPattern() {
    TSNode node =  TSNode();
    node.nodeType = "ObjectPattern";
    Token startTok = this.peek();
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
        TSNode restProp =  TSNode();
        restProp.nodeType = "RestElement";
        TSNode restTarget = this.parseBindingTarget();
        restProp.left = restTarget;
        restProp.name = restTarget.name;
        node.children.add(restProp);
      } else {
        TSNode prop =  TSNode();
        prop.nodeType = "Property";
        if ( this.matchPunct("[") ) {
          this.advance();
          String savedKeyDeclaring = this.declaringKind;
          this.declaringKind = "";
          TSNode keyExpr = this.parseExpr();
          this.declaringKind = savedKeyDeclaring;
          this.expectValue("]");
          prop.computed = true;
          prop.body = keyExpr;
          this.expectValue(":");
          prop.right = this.parseBindingElement();
        } else {
          Token keyTok = this.peek();
          String keyType = this.peekType();
          if ( (keyType == "String") || (keyType == "Number") ) {
            this.advance();
            prop.name = keyTok.value;
          } else {
            Token idTok = this.parseMemberName();
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
              TSNode defaultExpr = this.parseExpr();
              prop.init = defaultExpr;
              prop.left = defaultExpr;
            }
          }
        }
        node.children.add(prop);
      }
    }
    this.expectValue("}");
    return node;
  }
  
  TSNode parseArrayPattern() {
    TSNode node =  TSNode();
    node.nodeType = "ArrayPattern";
    Token startTok = this.peek();
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
        TSNode hole =  TSNode();
        hole.nodeType = "Elision";
        node.children.add(hole);
      } else {
        if ( this.matchValue("...") ) {
          this.advance();
          TSNode restElem =  TSNode();
          restElem.nodeType = "RestElement";
          TSNode restTarget = this.parseBindingTarget();
          restElem.left = restTarget;
          restElem.name = restTarget.name;
          if ( this.matchValue("=") ) {
            this.syntaxError("Parse error: a rest element may not have a default");
          }
          if ( this.matchValue(",") ) {
            this.syntaxError("Parse error: a rest element must be last in an array pattern");
          }
          node.children.add(restElem);
        } else {
          node.children.add(this.parseBindingElement());
        }
      }
    }
    this.expectValue("]");
    return node;
  }
  
  TSNode parseFuncDecl(bool isAsync) {
    TSNode node =  TSNode();
    node.nodeType = "FunctionDeclaration";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( isAsync ) {
      node._async = true;
    }
    this.expectValue("function");
    if ( this.matchValue("*") ) {
      this.advance();
      node.generator = true;
    }
    bool savedGenerator = this.inGenerator;
    bool isFnExpression = this.parsingFunctionExpression;
    this.parsingFunctionExpression = false;
    if ( isFnExpression ) {
      this.inGenerator = node.generator;
    }
    if ( this.matchValue("(") == false ) {
      Token nameTok = this.expectBindingName();
      node.name = nameTok.value;
    }
    this.inGenerator = node.generator;
    this.pushScope(true);
    this.functionDepth = this.functionDepth + 1;
    bool savedRest = this.sawRestParam;
    this.sawRestParam = false;
    bool savedSuperCall = this.allowSuperCall;
    bool savedSuperProp = this.allowSuperProperty;
    int savedfnIter = this.iterationDepth;
    int savedfnSwitch = this.switchDepth;
    List<String> savedfnLabels = this.activeLabels;
    List<String> savedfnIterLabels = this.iterationLabels;
    List<String> freshfnLabels = [];
    List<String> freshfnIterLabels = [];
    this.iterationDepth = 0;
    this.switchDepth = 0;
    this.activeLabels = freshfnLabels;
    this.iterationLabels = freshfnIterLabels;
    this.allowSuperCall = false;
    this.allowSuperProperty = false;
    if ( this.matchValue("<") ) {
      List<TSNode> typeParams = this.parseTypeParams();
      for ( int i = 0; i < typeParams.length; i++) {
        var tp = typeParams[i];
        node.children.add(tp);
      }
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (node.params.length) > 0 ) {
        this.expectValue(",");
      }
      TSNode param = this.parseParam();
      this.declareParam(param);
      node.params.add(param);
    }
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      TSNode returnType = this.parseTypeAnnotation();
      node.typeAnnotation = returnType;
    }
    this.checkNonSimpleParamDuplicates(node.params);
    if ( this.matchValue("{") ) {
      this.suppressBlockScope = true;
      TSNode body = this.parseBlock();
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
        Token afterSig = this.peek();
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
    this.sawRestParam = savedRest;
    this.functionDepth = this.functionDepth - 1;
    this.iterationDepth = savedfnIter;
    this.switchDepth = savedfnSwitch;
    this.activeLabels = savedfnLabels;
    this.iterationLabels = savedfnIterLabels;
    return node;
  }
  
  TSNode parseParam() {
    bool savedParamCtx = this.inParamList;
    this.inParamList = true;
    TSNode result = this.parseParamInner();
    this.inParamList = savedParamCtx;
    return result;
  }
  
  TSNode parseParamInner() {
    List<TSNode> decorators = [];
    while (this.matchValue("@")) {
      TSNode dec = this.parseDecorator();
      decorators.add(dec);
    }
    bool isRest = false;
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
      String savedParamDeclaring = this.declaringKind;
      this.declaringKind = "p";
      TSNode pattern = this.parseObjectPattern();
      this.declaringKind = savedParamDeclaring;
      for ( int i = 0; i < decorators.length; i++) {
        var d = decorators[i];
        pattern.decorators.add(d);
      }
      if ( isRest ) {
        TSNode restElem =  TSNode();
        restElem.nodeType = "RestElement";
        restElem.left = pattern;
        return restElem;
      }
      if ( this.matchValue(":") ) {
        TSNode patType = this.parseTypeAnnotation();
        pattern.typeAnnotation = patType;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode patDefault = this.parseExpr();
        TSNode patAssign =  TSNode();
        patAssign.nodeType = "AssignmentPattern";
        patAssign.left = pattern;
        patAssign.right = patDefault;
        return patAssign;
      }
      return pattern;
    }
    if ( this.matchValue("[") ) {
      String savedParamDeclaring_1 = this.declaringKind;
      this.declaringKind = "p";
      TSNode pattern_1 = this.parseArrayPattern();
      this.declaringKind = savedParamDeclaring_1;
      for ( int i_1 = 0; i_1 < decorators.length; i_1++) {
        var d_1 = decorators[i_1];
        pattern_1.decorators.add(d_1);
      }
      if ( isRest ) {
        TSNode restElem_1 =  TSNode();
        restElem_1.nodeType = "RestElement";
        restElem_1.left = pattern_1;
        return restElem_1;
      }
      if ( this.matchValue(":") ) {
        TSNode patType_1 = this.parseTypeAnnotation();
        pattern_1.typeAnnotation = patType_1;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        TSNode patDefault_1 = this.parseExpr();
        TSNode patAssign_1 =  TSNode();
        patAssign_1.nodeType = "AssignmentPattern";
        patAssign_1.left = pattern_1;
        patAssign_1.right = patDefault_1;
        return patAssign_1;
      }
      return pattern_1;
    }
    TSNode param =  TSNode();
    if ( isRest ) {
      param.nodeType = "RestElement";
      param.kind = "rest";
    } else {
      param.nodeType = "Parameter";
    }
    for ( int i_2 = 0; i_2 < decorators.length; i_2++) {
      var d_2 = decorators[i_2];
      param.decorators.add(d_2);
    }
    Token nameTok = this.expectBindingName();
    param.name = nameTok.value;
    param.start = nameTok.start;
    param.line = nameTok.line;
    param.col = nameTok.col;
    if ( this.matchValue("?") ) {
      param.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      TSNode typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    if ( this.matchValue("=") ) {
      if ( isRest ) {
        this.syntaxError("Parse error: a rest parameter may not have a default");
      }
      this.advance();
      bool savedInParams = this.inParamList;
      this.inParamList = true;
      param.init = this.parseExpr();
      this.inParamList = savedInParams;
    }
    return param;
  }
  
  TSNode parseBlock() {
    TSNode block =  TSNode();
    block.nodeType = "BlockStatement";
    Token startTok = this.peek();
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    this.expectValue("{");
    bool savedSingleBody = this.inSingleStatementBody;
    this.inSingleStatementBody = false;
    bool ownScope = true;
    if ( this.suppressBlockScope ) {
      ownScope = false;
      this.suppressBlockScope = false;
    }
    if ( ownScope ) {
      this.pushScope(false);
    }
    bool savedStrict = this.strictMode;
    bool myStrictDirective = false;
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
      int beforePos = this.pos;
      this.atModuleTopLevel = false;
      TSNode stmt = this.parseStatement();
      block.children.add(stmt);
      this.guardNoProgress(beforePos);
    }
    if ( ownScope ) {
      this.popScope();
    }
    this.lastBlockEnabledStrict = myStrictDirective;
    this.strictMode = savedStrict;
    this.inSingleStatementBody = savedSingleBody;
    Token closeTok = this.peek();
    block.end = closeTok.end;
    this.expectValue("}");
    return block;
  }
  
  TSNode parseExprStmt() {
    TSNode stmt =  TSNode();
    stmt.nodeType = "ExpressionStatement";
    Token startTok = this.peek();
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    TSNode expr = this.parseExprSeq();
    stmt.left = expr;
    if ( this.matchValue(";") ) {
      this.advance();
    } else {
      if ( this.isAtEnd() == false ) {
        Token nextTok = this.peek();
        if ( nextTok.value != "}" ) {
          if ( nextTok.line == this.lastTokenLine ) {
            this.syntaxError("Parse error: missing ';' between statements");
          }
        }
      }
    }
    return stmt;
  }
  
  TSNode parseTypeAnnotation() {
    TSNode annot =  TSNode();
    annot.nodeType = "TSTypeAnnotation";
    Token startTok = this.peek();
    annot.start = startTok.start;
    annot.line = startTok.line;
    annot.col = startTok.col;
    this.expectValue(":");
    String nextVal = this.peekValue();
    if ( nextVal == "asserts" ) {
      Token assertsTok = this.peek();
      this.advance();
      TSNode predicate =  TSNode();
      predicate.nodeType = "TSTypePredicate";
      predicate.start = assertsTok.start;
      predicate.line = assertsTok.line;
      predicate.col = assertsTok.col;
      predicate.value = "asserts";
      Token paramTok = this.expect("Identifier");
      predicate.name = paramTok.value;
      if ( this.matchValue("is") ) {
        this.advance();
        TSNode assertType = this.parseType();
        predicate.typeAnnotation = assertType;
      }
      annot.typeAnnotation = predicate;
      return annot;
    }
    if ( this.matchType("Identifier") ) {
      int savedPos = this.pos;
      Token savedTok = this.currentToken!;
      Token paramTok_1 = this.peek();
      this.advance();
      if ( this.matchValue("is") ) {
        this.advance();
        TSNode predicate_1 =  TSNode();
        predicate_1.nodeType = "TSTypePredicate";
        predicate_1.start = paramTok_1.start;
        predicate_1.line = paramTok_1.line;
        predicate_1.col = paramTok_1.col;
        predicate_1.name = paramTok_1.value;
        TSNode typeExpr = this.parseType();
        predicate_1.typeAnnotation = typeExpr;
        annot.typeAnnotation = predicate_1;
        return annot;
      }
      this.pos = savedPos;
      this.currentToken = savedTok;
    }
    TSNode typeExpr_1 = this.parseType();
    annot.typeAnnotation = typeExpr_1;
    return annot;
  }
  
  TSNode parseType() {
    return this.parseConditionalType();
  }
  
  TSNode parseConditionalType() {
    TSNode checkType = this.parseUnionType();
    if ( this.matchValue("extends") ) {
      this.advance();
      TSNode extendsType = this.parseUnionType();
      if ( this.matchValue("?") ) {
        this.advance();
        TSNode conditional =  TSNode();
        conditional.nodeType = "TSConditionalType";
        conditional.start = checkType.start;
        conditional.line = checkType.line;
        conditional.col = checkType.col;
        conditional.left = checkType;
        conditional.params.add(extendsType);
        conditional.body = this.parseUnionType();
        this.expectValue(":");
        conditional.right = this.parseUnionType();
        return conditional;
      }
      return checkType;
    }
    return checkType;
  }
  
  TSNode parseUnionType() {
    TSNode left = this.parseIntersectionType();
    if ( this.matchValue("|") ) {
      TSNode union =  TSNode();
      union.nodeType = "TSUnionType";
      union.start = left.start;
      union.line = left.line;
      union.col = left.col;
      union.children.add(left);
      while (this.matchValue("|")) {
        this.advance();
        TSNode right = this.parseIntersectionType();
        union.children.add(right);
      }
      return union;
    }
    return left;
  }
  
  TSNode parseIntersectionType() {
    TSNode left = this.parseArrayType();
    if ( this.matchValue("&") ) {
      TSNode intersection =  TSNode();
      intersection.nodeType = "TSIntersectionType";
      intersection.start = left.start;
      intersection.line = left.line;
      intersection.col = left.col;
      intersection.children.add(left);
      while (this.matchValue("&")) {
        this.advance();
        TSNode right = this.parseArrayType();
        intersection.children.add(right);
      }
      return intersection;
    }
    return left;
  }
  
  TSNode parseArrayType() {
    TSNode elemType = this.parsePrimaryType();
    while (this.matchValue("[")) {
      if ( this.checkNext("]") ) {
        this.advance();
        this.advance();
        TSNode arrayType =  TSNode();
        arrayType.nodeType = "TSArrayType";
        arrayType.start = elemType.start;
        arrayType.line = elemType.line;
        arrayType.col = elemType.col;
        arrayType.left = elemType;
        elemType = arrayType;
      } else {
        this.advance();
        TSNode indexType = this.parseType();
        this.expectValue("]");
        TSNode indexedAccess =  TSNode();
        indexedAccess.nodeType = "TSIndexedAccessType";
        indexedAccess.start = elemType.start;
        indexedAccess.line = elemType.line;
        indexedAccess.col = elemType.col;
        indexedAccess.left = elemType;
        indexedAccess.right = indexType;
        elemType = indexedAccess;
      }
    }
    return elemType;
  }
  
  bool checkNext(String value) {
    int nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      Token nextTok = this.tokens[nextPos];
      String v = nextTok.value;
      return v == value;
    }
    return false;
  }
  
  TSNode parsePrimaryType() {
    String tokVal = this.peekValue();
    Token tok = this.peek();
    if ( tokVal == "keyof" ) {
      this.advance();
      TSNode operand = this.parsePrimaryType();
      TSNode node =  TSNode();
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
      TSNode operand_1 = this.parsePrimaryType();
      TSNode node_1 =  TSNode();
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
      Token paramTok = this.expect("Identifier");
      TSNode node_2 =  TSNode();
      node_2.nodeType = "TSInferType";
      node_2.start = tok.start;
      node_2.line = tok.line;
      node_2.col = tok.col;
      TSNode typeParam =  TSNode();
      typeParam.nodeType = "TSTypeParameter";
      typeParam.name = paramTok.value;
      node_2.typeAnnotation = typeParam;
      return node_2;
    }
    if ( tokVal == "string" ) {
      this.advance();
      TSNode node_3 =  TSNode();
      node_3.nodeType = "TSStringKeyword";
      node_3.start = tok.start;
      node_3.end = tok.end;
      node_3.line = tok.line;
      node_3.col = tok.col;
      return node_3;
    }
    if ( tokVal == "number" ) {
      this.advance();
      TSNode node_4 =  TSNode();
      node_4.nodeType = "TSNumberKeyword";
      node_4.start = tok.start;
      node_4.end = tok.end;
      node_4.line = tok.line;
      node_4.col = tok.col;
      return node_4;
    }
    if ( tokVal == "boolean" ) {
      this.advance();
      TSNode node_5 =  TSNode();
      node_5.nodeType = "TSBooleanKeyword";
      node_5.start = tok.start;
      node_5.end = tok.end;
      node_5.line = tok.line;
      node_5.col = tok.col;
      return node_5;
    }
    if ( tokVal == "any" ) {
      this.advance();
      TSNode node_6 =  TSNode();
      node_6.nodeType = "TSAnyKeyword";
      node_6.start = tok.start;
      node_6.end = tok.end;
      node_6.line = tok.line;
      node_6.col = tok.col;
      return node_6;
    }
    if ( tokVal == "unknown" ) {
      this.advance();
      TSNode node_7 =  TSNode();
      node_7.nodeType = "TSUnknownKeyword";
      node_7.start = tok.start;
      node_7.end = tok.end;
      node_7.line = tok.line;
      node_7.col = tok.col;
      return node_7;
    }
    if ( tokVal == "object" ) {
      this.advance();
      TSNode node_8 =  TSNode();
      node_8.nodeType = "TSObjectKeyword";
      node_8.start = tok.start;
      node_8.end = tok.end;
      node_8.line = tok.line;
      node_8.col = tok.col;
      return node_8;
    }
    if ( tokVal == "void" ) {
      this.advance();
      TSNode node_9 =  TSNode();
      node_9.nodeType = "TSVoidKeyword";
      node_9.start = tok.start;
      node_9.end = tok.end;
      node_9.line = tok.line;
      node_9.col = tok.col;
      return node_9;
    }
    if ( tokVal == "null" ) {
      this.advance();
      TSNode node_10 =  TSNode();
      node_10.nodeType = "TSNullKeyword";
      node_10.start = tok.start;
      node_10.end = tok.end;
      node_10.line = tok.line;
      node_10.col = tok.col;
      return node_10;
    }
    if ( tokVal == "never" ) {
      this.advance();
      TSNode node_11 =  TSNode();
      node_11.nodeType = "TSNeverKeyword";
      node_11.start = tok.start;
      node_11.end = tok.end;
      node_11.line = tok.line;
      node_11.col = tok.col;
      return node_11;
    }
    if ( tokVal == "undefined" ) {
      this.advance();
      TSNode node_12 =  TSNode();
      node_12.nodeType = "TSUndefinedKeyword";
      node_12.start = tok.start;
      node_12.end = tok.end;
      node_12.line = tok.line;
      node_12.col = tok.col;
      return node_12;
    }
    String tokType = this.peekType();
    if ( tokType == "Identifier" ) {
      return this.parseTypeRef();
    }
    if ( tokType == "String" ) {
      this.advance();
      TSNode node_13 =  TSNode();
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
      TSNode node_14 =  TSNode();
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
      TSNode node_15 =  TSNode();
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
      TSNode node_16 =  TSNode();
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
    TSNode errNode =  TSNode();
    errNode.nodeType = "TSAnyKeyword";
    return errNode;
  }
  
  TSNode parseTypeRef() {
    TSNode ref =  TSNode();
    ref.nodeType = "TSTypeReference";
    Token tok = this.peek();
    ref.start = tok.start;
    ref.line = tok.line;
    ref.col = tok.col;
    Token nameTok = this.expect("Identifier");
    ref.name = nameTok.value;
    if ( this.matchValue("<") ) {
      this.advance();
      while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
        if ( (ref.params.length) > 0 ) {
          this.expectValue(",");
        }
        TSNode typeArg = this.parseType();
        ref.params.add(typeArg);
      }
      this.expectValue(">");
    }
    return ref;
  }
  
  TSNode parseTupleType() {
    TSNode tuple =  TSNode();
    tuple.nodeType = "TSTupleType";
    Token startTok = this.peek();
    tuple.start = startTok.start;
    tuple.line = startTok.line;
    tuple.col = startTok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( (tuple.children.length) > 0 ) {
        this.expectValue(",");
      }
      if ( this.matchValue("...") ) {
        Token restTok = this.peek();
        this.advance();
        String restName = "";
        if ( this.matchType("Identifier") ) {
          int savedPos = this.pos;
          Token savedTok = this.currentToken!;
          Token nameTok = this.peek();
          this.advance();
          if ( this.matchValue(":") ) {
            restName = nameTok.value;
            this.advance();
          } else {
            this.pos = savedPos;
            this.currentToken = savedTok;
          }
        }
        TSNode innerType = this.parseType();
        TSNode restType =  TSNode();
        restType.nodeType = "TSRestType";
        restType.start = restTok.start;
        restType.line = restTok.line;
        restType.col = restTok.col;
        restType.typeAnnotation = innerType;
        if ( restName != "" ) {
          restType.name = restName;
        }
        tuple.children.add(restType);
      } else {
        bool isNamed = false;
        String elemName = "";
        bool elemOptional = false;
        Token elemStart = this.peek();
        if ( this.matchType("Identifier") ) {
          int savedPos_1 = this.pos;
          Token savedTok_1 = this.currentToken!;
          Token nameTok_1 = this.peek();
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
        TSNode elemType = this.parseType();
        if ( isNamed ) {
          TSNode namedElem =  TSNode();
          namedElem.nodeType = "TSNamedTupleMember";
          namedElem.start = elemStart.start;
          namedElem.line = elemStart.line;
          namedElem.col = elemStart.col;
          namedElem.name = elemName;
          namedElem.optional = elemOptional;
          namedElem.typeAnnotation = elemType;
          tuple.children.add(namedElem);
        } else {
          if ( this.matchValue("?") ) {
            this.advance();
            TSNode optType =  TSNode();
            optType.nodeType = "TSOptionalType";
            optType.start = elemType.start;
            optType.line = elemType.line;
            optType.col = elemType.col;
            optType.typeAnnotation = elemType;
            tuple.children.add(optType);
          } else {
            tuple.children.add(elemType);
          }
        }
      }
    }
    this.expectValue("]");
    return tuple;
  }
  
  TSNode parseParenOrFunctionType() {
    Token startTok = this.peek();
    int startPos = startTok.start;
    int startLine = startTok.line;
    int startCol = startTok.col;
    this.expectValue("(");
    if ( this.matchValue(")") ) {
      this.advance();
      if ( this.matchValue("=>") ) {
        this.advance();
        TSNode returnType = this.parseType();
        TSNode funcType =  TSNode();
        funcType.nodeType = "TSFunctionType";
        funcType.start = startPos;
        funcType.line = startLine;
        funcType.col = startCol;
        funcType.typeAnnotation = returnType;
        return funcType;
      }
      TSNode voidNode =  TSNode();
      voidNode.nodeType = "TSVoidKeyword";
      return voidNode;
    }
    bool isIdentifier = this.matchType("Identifier");
    if ( isIdentifier ) {
      int savedPos = this.pos;
      Token savedToken = this.currentToken!;
      this.advance();
      if ( this.matchValue(":") || this.matchValue("?") ) {
        this.pos = savedPos;
        this.currentToken = savedToken;
        return this.parseFunctionType(startPos, startLine, startCol);
      }
      if ( this.matchValue(",") ) {
        /* unused:  int savedPos2 = this.pos   */
        /* unused:  Token savedToken2 = this.currentToken!   */
        int depth = 1;
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
        }
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
    TSNode innerType = this.parseType();
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      TSNode returnType_1 = this.parseType();
      TSNode funcType_1 =  TSNode();
      funcType_1.nodeType = "TSFunctionType";
      funcType_1.start = startPos;
      funcType_1.line = startLine;
      funcType_1.col = startCol;
      funcType_1.typeAnnotation = returnType_1;
      return funcType_1;
    }
    return innerType;
  }
  
  TSNode parseFunctionType(int startPos, int startLine, int startCol) {
    TSNode funcType =  TSNode();
    funcType.nodeType = "TSFunctionType";
    funcType.start = startPos;
    funcType.line = startLine;
    funcType.col = startCol;
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (funcType.params.length) > 0 ) {
        this.expectValue(",");
      }
      TSNode param =  TSNode();
      param.nodeType = "Parameter";
      Token nameTok = this.expect("Identifier");
      param.name = nameTok.value;
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if ( this.matchValue("?") ) {
        param.optional = true;
        this.advance();
      }
      if ( this.matchValue(":") ) {
        TSNode typeAnnot = this.parseTypeAnnotation();
        param.typeAnnotation = typeAnnot;
      }
      funcType.params.add(param);
    }
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      TSNode returnType = this.parseType();
      funcType.typeAnnotation = returnType;
    }
    return funcType;
  }
  
  TSNode parseConstructorType() {
    TSNode ctorType =  TSNode();
    ctorType.nodeType = "TSConstructorType";
    Token startTok = this.peek();
    ctorType.start = startTok.start;
    ctorType.line = startTok.line;
    ctorType.col = startTok.col;
    this.expectValue("new");
    if ( this.matchValue("<") ) {
      List<TSNode> typeParams = this.parseTypeParams();
      ctorType.children = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (ctorType.params.length) > 0 ) {
        this.expectValue(",");
      }
      TSNode param = this.parseParam();
      ctorType.params.add(param);
    }
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      TSNode returnType = this.parseType();
      ctorType.typeAnnotation = returnType;
    }
    return ctorType;
  }
  
  TSNode parseImportType() {
    TSNode importType =  TSNode();
    importType.nodeType = "TSImportType";
    Token startTok = this.peek();
    importType.start = startTok.start;
    importType.line = startTok.line;
    importType.col = startTok.col;
    this.expectValue("import");
    this.expectValue("(");
    Token sourceTok = this.expect("String");
    importType.value = sourceTok.value;
    this.expectValue(")");
    if ( this.matchValue(".") ) {
      this.advance();
      Token memberTok = this.expect("Identifier");
      importType.name = memberTok.value;
      if ( this.matchValue("<") ) {
        this.advance();
        while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
          if ( (importType.params.length) > 0 ) {
            this.expectValue(",");
          }
          TSNode typeArg = this.parseType();
          importType.params.add(typeArg);
        }
        this.expectValue(">");
      }
    }
    return importType;
  }
  
  TSNode parseTypeLiteral() {
    TSNode literal =  TSNode();
    literal.nodeType = "TSTypeLiteral";
    Token startTok = this.peek();
    literal.start = startTok.start;
    literal.line = startTok.line;
    literal.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      TSNode member = this.parseTypeLiteralMember();
      literal.children.add(member);
      if ( this.matchValue(";") || this.matchValue(",") ) {
        this.advance();
      }
    }
    this.expectValue("}");
    return literal;
  }
  
  TSNode parseTypeLiteralMember() {
    Token startTok = this.peek();
    int startPos = startTok.start;
    int startLine = startTok.line;
    int startCol = startTok.col;
    bool isReadonly = false;
    if ( this.matchValue("readonly") ) {
      isReadonly = true;
      this.advance();
    }
    String readonlyModifier = "";
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
      Token paramName = this.expect("Identifier");
      if ( this.matchValue("in") ) {
        return this.parseMappedType(isReadonly, readonlyModifier, paramName.value, startPos, startLine, startCol);
      }
      return this.parseIndexSignatureRest(isReadonly, paramName, startPos, startLine, startCol);
    }
    Token nameTok = this.expect("Identifier");
    String memberName = nameTok.value;
    bool isOptional = false;
    if ( this.matchValue("?") ) {
      isOptional = true;
      this.advance();
    }
    if ( this.matchValue("(") ) {
      return this.parseMethodSignature(memberName, isOptional, startPos, startLine, startCol);
    }
    TSNode prop =  TSNode();
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.name = memberName;
    prop.readonly = isReadonly;
    prop.optional = isOptional;
    if ( this.matchValue(":") ) {
      TSNode typeAnnot = this.parseTypeAnnotation();
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  }
  
  TSNode parseMappedType(bool isReadonly, String readonlyMod, String paramName, int startPos, int startLine, int startCol) {
    TSNode mapped =  TSNode();
    mapped.nodeType = "TSMappedType";
    mapped.start = startPos;
    mapped.line = startLine;
    mapped.col = startCol;
    mapped.readonly = isReadonly;
    if ( readonlyMod != "" ) {
      mapped.kind = readonlyMod;
    }
    this.expectValue("in");
    TSNode typeParam =  TSNode();
    typeParam.nodeType = "TSTypeParameter";
    typeParam.name = paramName;
    TSNode constraint = this.parseType();
    typeParam.typeAnnotation = constraint;
    mapped.params.add(typeParam);
    if ( this.matchValue("as") ) {
      this.advance();
      TSNode nameType = this.parseType();
      mapped.right = nameType;
    }
    this.expectValue("]");
    String optionalMod = "";
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
      TSNode valueType = this.parseType();
      mapped.typeAnnotation = valueType;
    }
    return mapped;
  }
  
  TSNode parseIndexSignatureRest(bool isReadonly, Token paramTok, int startPos, int startLine, int startCol) {
    TSNode indexSig =  TSNode();
    indexSig.nodeType = "TSIndexSignature";
    indexSig.start = startPos;
    indexSig.line = startLine;
    indexSig.col = startCol;
    indexSig.readonly = isReadonly;
    TSNode param =  TSNode();
    param.nodeType = "Parameter";
    param.name = paramTok.value;
    param.start = paramTok.start;
    param.line = paramTok.line;
    param.col = paramTok.col;
    if ( this.matchValue(":") ) {
      TSNode typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    indexSig.params.add(param);
    this.expectValue("]");
    if ( this.matchValue(":") ) {
      TSNode typeAnnot_1 = this.parseTypeAnnotation();
      indexSig.typeAnnotation = typeAnnot_1;
    }
    return indexSig;
  }
  
  TSNode parseMethodSignature(String methodName, bool isOptional, int startPos, int startLine, int startCol) {
    TSNode method =  TSNode();
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
      }
      TSNode param = this.parseParam();
      method.params.add(param);
    }
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      TSNode returnType = this.parseTypeAnnotation();
      method.typeAnnotation = returnType;
    }
    return method;
  }
  
  TSNode parseExpr() {
    return this.parseAssign();
  }
  
  TSNode parseExprSeq() {
    TSNode first = this.parseExpr();
    if ( this.matchValue(",") == false ) {
      return first;
    }
    TSNode seq =  TSNode();
    seq.nodeType = "SequenceExpression";
    seq.start = first.start;
    seq.line = first.line;
    seq.col = first.col;
    seq.children.add(first);
    while (this.matchValue(",")) {
      this.advance();
      TSNode next = this.parseExpr();
      seq.children.add(next);
    }
    return seq;
  }
  
  void checkAssignmentTarget(TSNode target) {
    String t = target.nodeType;
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
      int i = 0;
      while (i < (target.children.length)) {
        TSNode prop = target.children[i];
        if ( prop.method ) {
          this.syntaxError("Parse error: a method cannot be a destructuring assignment target");
          return;
        }
        if ( (prop.kind == "get") || (prop.kind == "set") ) {
          this.syntaxError("Parse error: an accessor cannot be a destructuring assignment target");
          return;
        }
        i = i + 1;
      }
      return;
    }
    if ( t == "ArrayExpression" ) {
      if ( target.parenthesized ) {
        this.syntaxError("Parse error: a parenthesised array literal is not a valid assignment target");
      }
      return;
    }
    this.syntaxError(("Parse error: invalid assignment target (" + t) + ")");
  }
  
  void checkUpdateTarget(TSNode target) {
    String t = target.nodeType;
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
  }
  
  TSNode parseAssign() {
    TSNode left = this.parseNullishCoalescing();
    String tokVal = this.peekValue();
    if ( tokVal == "=" ) {
      this.checkAssignmentTarget(left);
      this.advance();
      TSNode right = this.parseAssign();
      TSNode assign =  TSNode();
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
      String leftKind = left.nodeType;
      if ( (((leftKind == "ArrayExpression") || (leftKind == "ObjectExpression")) || (leftKind == "ArrayPattern")) || (leftKind == "ObjectPattern") ) {
        this.syntaxError("Parse error: a compound assignment cannot have a destructuring target");
      }
      this.advance();
      TSNode right_1 = this.parseAssign();
      TSNode assign_1 =  TSNode();
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
      TSNode right_2 = this.parseAssign();
      TSNode assign_2 =  TSNode();
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
  }
  
  TSNode parseNullishCoalescing() {
    TSNode left = this.parseTernary();
    while (this.matchValue("??")) {
      this.advance();
      TSNode right = this.parseTernary();
      TSNode nullish =  TSNode();
      nullish.nodeType = "LogicalExpression";
      nullish.value = "??";
      nullish.left = left;
      nullish.right = right;
      nullish.start = left.start;
      nullish.line = left.line;
      nullish.col = left.col;
      left = nullish;
    }
    return left;
  }
  
  TSNode parseTernary() {
    TSNode testExpr = this.parseLogicalOr();
    if ( this.matchValue("?") ) {
      this.advance();
      TSNode consequentExpr = this.parseAssign();
      if ( this.matchValue(":") ) {
        this.advance();
        TSNode alternateExpr = this.parseAssign();
        TSNode cond =  TSNode();
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
  }
  
  TSNode parseLogicalOr() {
    TSNode left = this.parseLogicalAnd();
    while (this.matchValue("||")) {
      this.advance();
      TSNode right = this.parseLogicalAnd();
      TSNode expr =  TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "||";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    }
    return left;
  }
  
  TSNode parseLogicalAnd() {
    TSNode left = this.parseBitwiseOr();
    while (this.matchValue("&&")) {
      this.advance();
      TSNode right = this.parseBitwiseOr();
      TSNode expr =  TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "&&";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    }
    return left;
  }
  
  TSNode parseBitwiseOr() {
    TSNode left = this.parseBitwiseXor();
    while (this.matchValue("|")) {
      this.advance();
      TSNode right = this.parseBitwiseXor();
      TSNode expr =  TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "|";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    }
    return left;
  }
  
  TSNode parseBitwiseXor() {
    TSNode left = this.parseBitwiseAnd();
    while (this.matchValue("^")) {
      this.advance();
      TSNode right = this.parseBitwiseAnd();
      TSNode expr =  TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "^";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    }
    return left;
  }
  
  TSNode parseBitwiseAnd() {
    TSNode left = this.parseEquality();
    while (this.matchValue("&")) {
      this.advance();
      TSNode right = this.parseEquality();
      TSNode expr =  TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "&";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    }
    return left;
  }
  
  TSNode parseEquality() {
    TSNode left = this.parseComparison();
    String tokVal = this.peekValue();
    while ((((tokVal == "==") || (tokVal == "!=")) || (tokVal == "===")) || (tokVal == "!==")) {
      Token opTok = this.peek();
      this.advance();
      TSNode right = this.parseComparison();
      TSNode expr =  TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = opTok.value;
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
      tokVal = this.peekValue();
    }
    return left;
  }
  
  TSNode parseComparison() {
    TSNode left = this.parseShift();
    String tokVal = this.peekValue();
    String tokType = this.peekType();
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
      Token opTok = this.peek();
      this.advance();
      TSNode right = this.parseShift();
      TSNode expr =  TSNode();
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
    }
    return left;
  }
  
  TSNode parseShift() {
    TSNode left = this.parseAdditive();
    String cur = this.peekValue();
    String nxt = this.peekAheadValue(1);
    while ((this.peekType() == "Punctuator") && (((cur == "<") && (nxt == "<")) || ((cur == ">") && (nxt == ">")))) {
      this.peek();
      String op = "";
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
      TSNode right = this.parseAdditive();
      TSNode expr =  TSNode();
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
    }
    return left;
  }
  
  TSNode parseAdditive() {
    TSNode left = this.parseMultiplicative();
    String tokVal = this.peekValue();
    while ((tokVal == "+") || (tokVal == "-")) {
      Token opTok = this.peek();
      this.advance();
      TSNode right = this.parseMultiplicative();
      TSNode binExpr =  TSNode();
      binExpr.nodeType = "BinaryExpression";
      binExpr.value = opTok.value;
      binExpr.left = left;
      binExpr.right = right;
      binExpr.start = left.start;
      binExpr.line = left.line;
      binExpr.col = left.col;
      left = binExpr;
      tokVal = this.peekValue();
    }
    return left;
  }
  
  TSNode parseMultiplicative() {
    TSNode left = this.parseUnary();
    String tokVal = this.peekValue();
    while ((((tokVal == "*") || (tokVal == "/")) || (tokVal == "%")) || (tokVal == "**")) {
      Token opTok = this.peek();
      this.advance();
      TSNode right = this.parseUnary();
      TSNode binExpr =  TSNode();
      binExpr.nodeType = "BinaryExpression";
      binExpr.value = opTok.value;
      binExpr.left = left;
      binExpr.right = right;
      binExpr.start = left.start;
      binExpr.line = left.line;
      binExpr.col = left.col;
      left = binExpr;
      tokVal = this.peekValue();
    }
    return left;
  }
  
  TSNode parseUnary() {
    String tokVal = this.peekValue();
    bool tokIsPunct = this.peekType() == "Punctuator";
    bool tokIsLiteral = false;
    String tokKindU = this.peekType();
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
      Token opTok = this.peek();
      this.advance();
      TSNode arg = this.parseUnary();
      this.checkUpdateTarget(arg);
      TSNode update =  TSNode();
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
      Token opTok_1 = this.peek();
      this.advance();
      TSNode arg_1 = this.parseUnary();
      TSNode unary =  TSNode();
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
        String opAfter = this.peekNextValue();
        if ( opAfter == "(" ) {
          int scanIdx = this.pos + 1;
          int depth = 0;
          int total = this.tokens.length;
          while (scanIdx < total) {
            Token st = this.tokens[scanIdx];
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
          }
          if ( (scanIdx + 1) < total ) {
            Token afterParen = this.tokens[(scanIdx + 1)];
            if ( afterParen.value == "=>" ) {
              this.syntaxError("Parse error: an arrow function must be parenthesised to be a unary operand");
            }
          }
        }
      }
    }
    if ( (false == tokIsLiteral) && ((tokVal == "void") || (tokVal == "delete")) ) {
      Token opTok_2 = this.peek();
      this.advance();
      TSNode arg_2 = this.parseUnary();
      if ( tokVal == "delete" ) {
        if ( this.strictMode ) {
          if ( arg_2.nodeType == "Identifier" ) {
            this.syntaxError("Parse error: cannot delete an unqualified name in strict mode");
          }
        }
      }
      TSNode unary_1 =  TSNode();
      unary_1.nodeType = "UnaryExpression";
      unary_1.value = opTok_2.value;
      unary_1.left = arg_2;
      unary_1.start = opTok_2.start;
      unary_1.line = opTok_2.line;
      unary_1.col = opTok_2.col;
      return unary_1;
    }
    if ( (tokVal == "typeof") && (false == tokIsLiteral) ) {
      Token opTok_3 = this.peek();
      this.advance();
      TSNode arg_3 = this.parseUnary();
      TSNode unary_2 =  TSNode();
      unary_2.nodeType = "UnaryExpression";
      unary_2.value = "typeof";
      unary_2.left = arg_3;
      unary_2.start = opTok_3.start;
      unary_2.line = opTok_3.line;
      unary_2.col = opTok_3.col;
      return unary_2;
    }
    if ( (tokVal == "yield") && (this.inGenerator && (this.peekType() != "String")) ) {
      Token yieldTok = this.peek();
      if ( this.inParamList ) {
        this.syntaxError("Parse error: a parameter default may not contain a yield expression");
      }
      this.advance();
      Token afterYield = this.peek();
      if ( afterYield.value == "*" ) {
        if ( afterYield.line != this.lastTokenLine ) {
          this.syntaxError("Parse error: no line terminator is allowed between 'yield' and '*'");
        }
      }
      TSNode yieldExpr =  TSNode();
      yieldExpr.nodeType = "YieldExpression";
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if ( this.matchValue("*") ) {
        this.advance();
        yieldExpr.delegate = true;
      }
      String nextVal = this.peekValue();
      bool endsYield = false;
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
      Token yieldNextTok = this.peek();
      if ( yieldNextTok.line != this.lastTokenLine ) {
        endsYield = true;
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
    if ( (tokVal == "await") && (this.peekType() != "String") ) {
      Token awaitTok = this.peek();
      this.advance();
      TSNode arg_4 = this.parseUnary();
      TSNode awaitExpr =  TSNode();
      awaitExpr.nodeType = "AwaitExpression";
      awaitExpr.left = arg_4;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr;
    }
    if ( (tokVal == "<") && (this.peekType() == "Punctuator") ) {
      if ( this.tsxMode == true ) {
        String peekNext = this.peekNextValue();
        String peekNextT = this.peekNextType();
        if ( peekNext == ">" ) {
          return this.parsePostfix();
        }
        if ( peekNextT == "Identifier" ) {
          String peekTwoAhead = this.peekAheadValue(2);
          if ( peekTwoAhead != "extends" ) {
            return this.parsePostfix();
          }
        }
      }
      Token startTok = this.peek();
      this.advance();
      String nextType = this.peekType();
      if ( ((nextType == "Identifier") || (nextType == "Keyword")) || (nextType == "TSType") ) {
        TSNode typeNode = this.parseType();
        if ( this.matchValue(">") ) {
          this.advance();
          TSNode arg_5 = this.parseUnary();
          TSNode assertion =  TSNode();
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
  }
  
  TSNode parsePostfix() {
    TSNode expr = this.parsePrimary();
    bool keepParsing = true;
    while (keepParsing) {
      String tokVal = this.peekValue();
      if ( (tokVal == "<") && (this.peekType() == "Punctuator") ) {
        bool shouldParseAsGenericCall = false;
        if ( this.tsxMode == false ) {
          this.peekAheadValue(1);
          String next2 = this.peekAheadValue(2);
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
          TSNode call =  TSNode();
          call.nodeType = "CallExpression";
          call.left = expr;
          call.start = expr.start;
          call.line = expr.line;
          call.col = expr.col;
          while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
            if ( (call.params.length) > 0 ) {
              this.expectValue(",");
            }
            TSNode typeArg = this.parseType();
            call.params.add(typeArg);
          }
          this.expectValue(">");
          if ( this.matchValue("(") ) {
            this.advance();
            while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
              if ( (call.children.length) > 0 ) {
                this.expectValue(",");
              }
              if ( this.matchValue("...") ) {
                this.advance();
                TSNode spreadArg = this.parseExpr();
                TSNode spread =  TSNode();
                spread.nodeType = "SpreadElement";
                spread.left = spreadArg;
                call.children.add(spread);
              } else {
                TSNode arg = this.parseExpr();
                call.children.add(arg);
              }
            }
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
        TSNode call_1 =  TSNode();
        call_1.nodeType = "CallExpression";
        call_1.left = expr;
        call_1.start = expr.start;
        call_1.line = expr.line;
        call_1.col = expr.col;
        while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
          if ( (call_1.children.length) > 0 ) {
            this.expectValue(",");
          }
          if ( this.matchValue("...") ) {
            this.advance();
            TSNode spreadArg_1 = this.parseExpr();
            TSNode spread_1 =  TSNode();
            spread_1.nodeType = "SpreadElement";
            spread_1.left = spreadArg_1;
            call_1.children.add(spread_1);
          } else {
            TSNode arg_1 = this.parseExpr();
            call_1.children.add(arg_1);
          }
        }
        this.expectValue(")");
        expr = call_1;
      }
      if ( tokVal == "." ) {
        this.advance();
        Token propTok = this.parseMemberName();
        TSNode member =  TSNode();
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
        String nextTokVal = this.peekValue();
        if ( nextTokVal == "(" ) {
          this.advance();
          TSNode optCall =  TSNode();
          optCall.nodeType = "OptionalCallExpression";
          optCall.optional = true;
          optCall.left = expr;
          optCall.start = expr.start;
          optCall.line = expr.line;
          optCall.col = expr.col;
          while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
            if ( (optCall.children.length) > 0 ) {
              this.expectValue(",");
            }
            TSNode arg_2 = this.parseExpr();
            optCall.children.add(arg_2);
          }
          this.expectValue(")");
          expr = optCall;
        }
        if ( nextTokVal == "[" ) {
          this.advance();
          TSNode indexExpr = this.parseExpr();
          this.expectValue("]");
          TSNode optIndex =  TSNode();
          optIndex.nodeType = "OptionalMemberExpression";
          optIndex.optional = true;
          optIndex.left = expr;
          optIndex.right = indexExpr;
          optIndex.start = expr.start;
          optIndex.line = expr.line;
          optIndex.col = expr.col;
          expr = optIndex;
        }
        if ( this.isNameToken() ) {
          Token propTok_1 = this.parseMemberName();
          TSNode optMember =  TSNode();
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
        TSNode indexExpr_1 = this.parseExprSeq();
        this.expectValue("]");
        TSNode computed =  TSNode();
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
        Token tok = this.peek();
        this.advance();
        TSNode nonNull =  TSNode();
        nonNull.nodeType = "TSNonNullExpression";
        nonNull.left = expr;
        nonNull.start = expr.start;
        nonNull.line = expr.line;
        nonNull.col = tok.col;
        expr = nonNull;
      }
      if ( tokVal == "as" ) {
        this.advance();
        TSNode asType = this.parseType();
        TSNode assertion =  TSNode();
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
        TSNode satisfiesType = this.parseType();
        TSNode satisfiesExpr =  TSNode();
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
      String tokType = this.peekType();
      if ( tokType == "Template" ) {
        TSNode quasi = this.parseTemplateLiteral();
        TSNode tagged =  TSNode();
        tagged.nodeType = "TaggedTemplateExpression";
        tagged.left = expr;
        tagged.right = quasi;
        tagged.start = expr.start;
        tagged.line = expr.line;
        tagged.col = expr.col;
        expr = tagged;
      }
      if ( (tokVal == "++") || (tokVal == "--") ) {
        Token opTok = this.peek();
        if ( opTok.line != this.lastTokenLine ) {
          keepParsing = false;
          break;
        }
        this.checkUpdateTarget(expr);
        this.advance();
        TSNode update =  TSNode();
        update.nodeType = "UpdateExpression";
        update.value = opTok.value;
        update.left = expr;
        update.prefix = false;
        update.start = expr.start;
        update.line = expr.line;
        update.col = expr.col;
        expr = update;
      }
      String newTokVal = this.peekValue();
      String newTokType = this.peekType();
      if ( (((((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies")) && (newTokVal != "++")) && (newTokVal != "--")) && (newTokType != "Template") ) {
        keepParsing = false;
      }
    }
    return expr;
  }
  
  TSNode parsePrimary() {
    String tokType = this.peekType();
    String tokVal = this.peekValue();
    Token tok = this.peek();
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
      TSNode id =  TSNode();
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
      TSNode num =  TSNode();
      num.nodeType = "NumericLiteral";
      num.value = tok.value;
      num.start = tok.start;
      num.end = tok.end;
      num.line = tok.line;
      num.col = tok.col;
      return num;
    }
    if ( tokType == "BigInt" ) {
      this.advance();
      TSNode bigint =  TSNode();
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
      TSNode str =  TSNode();
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
      TSNode bool =  TSNode();
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
      TSNode nullLit =  TSNode();
      nullLit.nodeType = "NullLiteral";
      nullLit.start = tok.start;
      nullLit.end = tok.end;
      nullLit.line = tok.line;
      nullLit.col = tok.col;
      return nullLit;
    }
    if ( tokVal == "undefined" ) {
      this.advance();
      TSNode undefId =  TSNode();
      undefId.nodeType = "Identifier";
      undefId.name = "undefined";
      undefId.start = tok.start;
      undefId.end = tok.end;
      undefId.line = tok.line;
      undefId.col = tok.col;
      return undefId;
    }
    if ( tokVal == "[" ) {
      int arrSavedPos = this.pos;
      Token arrSavedTok = this.currentToken!;
      int arrSavedErrors = this.errorCount;
      this.speculating = this.speculating + 1;
      bool savedArrMemberTarget = this.patternAllowsMemberTarget;
      this.patternAllowsMemberTarget = true;
      TSNode arrPat = this.parseArrayPattern();
      this.patternAllowsMemberTarget = savedArrMemberTarget;
      this.speculating = this.speculating - 1;
      int arrPatErrors = this.errorCount;
      if ( this.errorCount == arrSavedErrors ) {
        if ( this.isAssignmentPatternFollow() ) {
          return arrPat;
        }
      }
      this.pos = arrSavedPos;
      this.currentToken = arrSavedTok;
      this.errorCount = arrSavedErrors;
      TSNode arrLit = this.parseArrayLiteral();
      if ( this.isAssignmentPatternFollow() ) {
        if ( arrPatErrors > arrSavedErrors ) {
          this.errorCount = arrPatErrors;
        }
      }
      return arrLit;
    }
    if ( tokVal == "{" ) {
      int objSavedPos = this.pos;
      Token objSavedTok = this.currentToken!;
      int objSavedErrors = this.errorCount;
      this.speculating = this.speculating + 1;
      bool savedObjMemberTarget = this.patternAllowsMemberTarget;
      this.patternAllowsMemberTarget = true;
      TSNode objPat = this.parseObjectPattern();
      this.patternAllowsMemberTarget = savedObjMemberTarget;
      this.speculating = this.speculating - 1;
      int objPatErrors = this.errorCount;
      if ( this.errorCount == objSavedErrors ) {
        if ( this.isAssignmentPatternFollow() ) {
          return objPat;
        }
      }
      this.pos = objSavedPos;
      this.currentToken = objSavedTok;
      this.errorCount = objSavedErrors;
      TSNode objLit = this.parseObjectLiteral();
      if ( this.isAssignmentPatternFollow() ) {
        if ( objPatErrors > objSavedErrors ) {
          this.errorCount = objPatErrors;
        }
      }
      return objLit;
    }
    if ( (this.tsxMode == true) && (tokVal == "<") ) {
      String nextType = this.peekNextType();
      String nextVal = this.peekNextValue();
      if ( nextVal == ">" ) {
        return this.parseJSXFragment();
      }
      if ( (nextType == "Identifier") || (nextType == "Keyword") ) {
        String peekTwoAhead = this.peekAheadValue(2);
        if ( peekTwoAhead != "extends" ) {
          return this.parseJSXElement();
        }
      }
    }
    if ( tokVal == "(" ) {
      return this.parseParenOrArrow();
    }
    if ( tokVal == "async" ) {
      String nextVal_1 = this.peekNextValue();
      String nextType_1 = this.peekNextType();
      if ( (nextVal_1 == "(") || (nextType_1 == "Identifier") ) {
        return this.parseArrowFunction();
      }
    }
    if ( tokVal == "new" ) {
      return this.parseNewExpression();
    }
    if ( tokVal == "import" ) {
      Token importTok = this.peek();
      this.advance();
      if ( this.matchValue(".") ) {
        this.advance();
        if ( this.matchValue("meta") ) {
          this.advance();
          TSNode metaProp =  TSNode();
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
        TSNode source = this.parseExpr();
        this.expectValue(")");
        TSNode importExpr =  TSNode();
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
      TSNode re =  TSNode();
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
      TSNode fnExpr = this.parseFuncDecl(false);
      fnExpr.nodeType = "FunctionExpression";
      return fnExpr;
    }
    if ( tokVal == "async" ) {
      if ( this.peekNextValue() == "function" ) {
        this.advance();
        this.parsingFunctionExpression = true;
        TSNode asyncFnExpr = this.parseFuncDecl(true);
        asyncFnExpr.nodeType = "FunctionExpression";
        return asyncFnExpr;
      }
    }
    if ( tokVal == "class" ) {
      TSNode clsExpr = this.parseClass();
      clsExpr.nodeType = "ClassExpression";
      return clsExpr;
    }
    if ( tokVal == "super" ) {
      String afterSuper = this.peekNextValue();
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
      TSNode superExpr =  TSNode();
      superExpr.nodeType = "Super";
      superExpr.start = tok.start;
      superExpr.end = tok.end;
      superExpr.line = tok.line;
      superExpr.col = tok.col;
      return superExpr;
    }
    if ( tokVal == "this" ) {
      this.advance();
      TSNode thisExpr =  TSNode();
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
        TSNode starErr =  TSNode();
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
      TSNode tsId =  TSNode();
      tsId.nodeType = "Identifier";
      tsId.name = tok.value;
      tsId.start = tok.start;
      tsId.end = tok.end;
      tsId.line = tok.line;
      tsId.col = tok.col;
      return tsId;
    }
    if ( tokType == "Keyword" ) {
      bool contextual = false;
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
        TSNode ctxId =  TSNode();
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
    TSNode errId =  TSNode();
    errId.nodeType = "Identifier";
    errId.name = "error";
    return errId;
  }
  
  TSNode parseTemplateLiteral() {
    TSNode node =  TSNode();
    node.nodeType = "TemplateLiteral";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.advance();
    TSNode quasi =  TSNode();
    quasi.nodeType = "TemplateElement";
    quasi.value = tok.value;
    node.children.add(quasi);
    return node;
  }
  
  TSNode parseArrayLiteral() {
    TSNode node =  TSNode();
    node.nodeType = "ArrayExpression";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( this.matchValue("...") ) {
        this.advance();
        TSNode spreadArg = this.parseExpr();
        TSNode spread =  TSNode();
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.add(spread);
      } else {
        if ( this.matchValue(",") ) {
          Token holeTok = this.peek();
          TSNode hole =  TSNode();
          hole.nodeType = "ArrayHole";
          hole.start = holeTok.start;
          hole.line = holeTok.line;
          hole.col = holeTok.col;
          node.children.add(hole);
        } else {
          TSNode elem = this.parseExpr();
          node.children.add(elem);
        }
      }
      if ( this.matchValue(",") ) {
        this.advance();
      } else {
        if ( this.matchValue("]") == false ) {
          if ( this.isAtEnd() == false ) {
            Token badArrTok = this.peek();
            this.syntaxError("Parse error: expected ',' or ']' in array literal but got '" + (badArrTok.value + "'"));
            return node;
          }
        }
      }
    }
    this.expectValue("]");
    return node;
  }
  
  TSNode parseObjectLiteral() {
    TSNode node =  TSNode();
    node.nodeType = "ObjectExpression";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("{");
    bool sawProto = false;
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      int loopStartPos = this.pos;
      if ( this.matchValue("...") ) {
        this.advance();
        TSNode spreadArg = this.parseExpr();
        TSNode spread =  TSNode();
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.add(spread);
      } else {
        TSNode prop =  TSNode();
        prop.nodeType = "Property";
        Token propStartTok = this.peek();
        prop.start = propStartTok.start;
        bool isComputed = false;
        bool isMethod = false;
        bool isGetter = false;
        bool isSetter = false;
        String currVal = this.peekValue();
        String nextType = this.peekNextType();
        String nextVal = this.peekNextValue();
        if ( currVal == "async" ) {
          if ( ((nextType == "Identifier") || (nextVal == "[")) || (nextVal == "(") ) {
            this.advance();
            prop._async = true;
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
          bool starNameOk = false;
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
              int scanIdx = this.pos + 1;
              int depth = 1;
              int total = this.tokens.length;
              while (scanIdx < total) {
                Token st = this.tokens[scanIdx];
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
              }
              if ( (scanIdx + 1) < total ) {
                Token afterKey = this.tokens[(scanIdx + 1)];
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
        Token keyTok = this.peek();
        if ( this.matchPunct("[") ) {
          this.advance();
          TSNode keyExpr = this.parseExpr();
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
          this.advance();
        } else {
          if ( isComputed ) {
            String afterComputed = this.peekValue();
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
          TSNode fnNode =  TSNode();
          fnNode.nodeType = "FunctionExpression";
          fnNode.start = prop.start;
          this.advance();
          this.pushScope(true);
          this.functionDepth = this.functionDepth + 1;
          bool savedObjRest = this.sawRestParam;
          this.sawRestParam = false;
          bool savedObjGenerator = this.inGenerator;
          this.inGenerator = prop.generator;
          bool savedObjSuperCall = this.allowSuperCall;
          bool savedObjSuperProp = this.allowSuperProperty;
          int savedobjIter = this.iterationDepth;
          int savedobjSwitch = this.switchDepth;
          List<String> savedobjLabels = this.activeLabels;
          List<String> savedobjIterLabels = this.iterationLabels;
          List<String> freshobjLabels = [];
          List<String> freshobjIterLabels = [];
          this.iterationDepth = 0;
          this.switchDepth = 0;
          this.activeLabels = freshobjLabels;
          this.iterationLabels = freshobjIterLabels;
          this.allowSuperCall = false;
          this.allowSuperProperty = true;
          while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
            if ( (fnNode.params.length) > 0 ) {
              this.expectValue(",");
            }
            TSNode mParam = this.parseParam();
            if ( (mParam.name.length) > 0 ) {
              this.declareBinding("p", mParam.name);
            }
            fnNode.params.add(mParam);
          }
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
              TSNode setParam = fnNode.params[0];
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
            TSNode objMethodBody = this.parseBlock();
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
            TSNode valueExpr = this.parseExpr();
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
              TSNode shorthandVal =  TSNode();
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
        node.children.add(prop);
      }
      if ( this.matchValue(",") ) {
        this.advance();
      } else {
        if ( this.matchValue("}") == false ) {
          if ( this.isAtEnd() == false ) {
            Token badObjTok = this.peek();
            this.syntaxError("Parse error: expected ',' or '}' in object literal but got '" + (badObjTok.value + "'"));
            return node;
          }
        }
      }
      if ( this.pos == loopStartPos ) {
        break;
      }
    }
    this.expectValue("}");
    return node;
  }
  
  TSNode parseParenOrArrow() {
    this.peek();
    int savedPos = this.pos;
    Token savedTok = this.currentToken!;
    this.advance();
    int parenDepth = 1;
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
    }
    if ( this.matchValue(")") == false ) {
      this.pos = savedPos;
      this.currentToken = savedTok;
      this.advance();
      TSNode expr = this.parseExprSeq();
      this.expectValue(")");
      return expr;
    }
    this.advance();
    if ( this.matchValue(":") ) {
      this.advance();
      this.parseType();
    }
    if ( this.matchValue("=>") ) {
      this.pos = savedPos;
      this.currentToken = savedTok;
      return this.parseArrowFunction();
    }
    this.pos = savedPos;
    this.currentToken = savedTok;
    this.advance();
    TSNode expr_1 = this.parseExprSeq();
    this.expectValue(")");
    expr_1.parenthesized = true;
    return expr_1;
  }
  
  TSNode parseArrowFunction() {
    TSNode node =  TSNode();
    node.nodeType = "ArrowFunctionExpression";
    Token startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("async") ) {
      this.advance();
      node.kind = "async";
    }
    this.pushScope(true);
    this.functionDepth = this.functionDepth + 1;
    bool savedArrowRest = this.sawRestParam;
    this.sawRestParam = false;
    bool savedArrowGenerator = this.inGenerator;
    int savedArrowIter = this.iterationDepth;
    int savedArrowSwitch = this.switchDepth;
    List<String> savedArrowLabels = this.activeLabels;
    List<String> savedArrowIterLabels = this.iterationLabels;
    List<String> freshArrowLabels = [];
    List<String> freshArrowIterLabels = [];
    this.iterationDepth = 0;
    this.switchDepth = 0;
    this.activeLabels = freshArrowLabels;
    this.iterationLabels = freshArrowIterLabels;
    if ( this.matchValue("(") ) {
      this.advance();
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (node.params.length) > 0 ) {
          this.expectValue(",");
        }
        TSNode param = this.parseParam();
        if ( (param.name.length) > 0 ) {
          this.declareBinding("p", param.name);
        }
        node.params.add(param);
      }
      this.expectValue(")");
    } else {
      Token paramTok = this.expectBindingName();
      TSNode param_1 =  TSNode();
      param_1.nodeType = "Parameter";
      param_1.name = paramTok.value;
      this.declareBinding("p", param_1.name);
      node.params.add(param_1);
    }
    if ( this.matchValue(":") ) {
      this.advance();
      TSNode retType = this.parseType();
      node.typeAnnotation = retType;
    }
    Token arrowTok = this.peek();
    if ( arrowTok.value == "=>" ) {
      if ( arrowTok.line != this.lastTokenLine ) {
        this.syntaxError("Parse error: no line terminator is allowed before '=>'");
      }
    }
    this.expectValue("=>");
    if ( this.matchValue("{") ) {
      this.suppressBlockScope = true;
      TSNode body = this.parseBlock();
      node.body = body;
      node.end = body.end;
      if ( this.lastBlockEnabledStrict ) {
        this.recheckStrictSignature("", node.params);
      }
    } else {
      TSNode body_1 = this.parseExpr();
      node.body = body_1;
      node.end = this.lastTokenEndPos;
    }
    this.popScope();
    this.iterationDepth = savedArrowIter;
    this.switchDepth = savedArrowSwitch;
    this.activeLabels = savedArrowLabels;
    this.iterationLabels = savedArrowIterLabels;
    this.inGenerator = savedArrowGenerator;
    this.sawRestParam = savedArrowRest;
    this.functionDepth = this.functionDepth - 1;
    return node;
  }
  
  TSNode parseNewExpression() {
    TSNode node =  TSNode();
    node.nodeType = "NewExpression";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("new");
    if ( this.matchValue(".") ) {
      this.advance();
      if ( this.matchValue("target") ) {
        Token targetTok = this.peek();
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
      Token badMeta = this.peek();
      this.syntaxError(("Parse error: 'new." + badMeta.value) + "' is not a meta property");
    }
    if ( this.matchValue("super") ) {
      if ( this.peekNextValue() == "(" ) {
        this.syntaxError("Parse error: 'super' cannot be the callee of 'new'");
      }
    }
    TSNode callee = this.parsePrimary();
    bool keepMember = true;
    while (keepMember) {
      if ( this.matchValue(".") ) {
        this.advance();
        Token propTok = this.parseMemberName();
        TSNode member =  TSNode();
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
    }
    node.left = callee;
    if ( this.matchValue("<") ) {
      int depth = 1;
      this.advance();
      while ((depth > 0) && (this.isAtEnd() == false)) {
        String v = this.peekValue();
        if ( v == "<" ) {
          depth = depth + 1;
        }
        if ( v == ">" ) {
          depth = depth - 1;
        }
        this.advance();
      }
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
          TSNode spreadArg = this.parseExpr();
          TSNode spread =  TSNode();
          spread.nodeType = "SpreadElement";
          spread.left = spreadArg;
          node.children.add(spread);
        } else {
          TSNode arg = this.parseExpr();
          node.children.add(arg);
        }
      }
      this.expectValue(")");
    }
    return node;
  }
  
  String peekNextType() {
    int nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      Token nextTok = this.tokens[nextPos];
      return nextTok.tokenType;
    }
    return "EOF";
  }
  
  String peekAheadValue(int offset) {
    int aheadPos = this.pos + offset;
    if ( aheadPos < (this.tokens.length) ) {
      Token tok = this.tokens[aheadPos];
      return tok.value;
    }
    return "";
  }
  
  bool startsWithLowerCase(String s) {
    if ( (s.length) == 0 ) {
      return false;
    }
    int code = s.codeUnitAt(0);
    if ( (code >= 97) && (code <= 122) ) {
      return true;
    }
    return false;
  }
  
  bool looksLikeGenericCall() {
    int depth = 1;
    int offset = 1;
    int maxLookahead = 20;
    while ((depth > 0) && (offset < maxLookahead)) {
      String ahead = this.peekAheadValue(offset);
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
    }
    if ( depth == 0 ) {
      String afterClose = this.peekAheadValue(offset);
      if ( afterClose == "(" ) {
        return true;
      }
    }
    return false;
  }
  
  TSNode parseJSXElement() {
    TSNode node =  TSNode();
    node.nodeType = "JSXElement";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    TSNode opening = this.parseJSXOpeningElement();
    node.left = opening;
    if ( opening.kind == "self-closing" ) {
      node.nodeType = "JSXElement";
      return node;
    }
    /* unused:  String tagName = opening.name   */
    while (this.isAtEnd() == false) {
      String v = this.peekValue();
      if ( v == "<" ) {
        String nextVal = this.peekNextValue();
        if ( nextVal == "/" ) {
          break;
        }
        TSNode child = this.parseJSXElement();
        node.children.add(child);
      } else {
        if ( v == "{" ) {
          TSNode exprChild = this.parseJSXExpressionContainer();
          node.children.add(exprChild);
        } else {
          String t = this.peekType();
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            TSNode textChild = this.parseJSXText();
            node.children.add(textChild);
          } else {
            break;
          }
        }
      }
    }
    TSNode closing = this.parseJSXClosingElement();
    node.right = closing;
    return node;
  }
  
  TSNode parseJSXOpeningElement() {
    TSNode node =  TSNode();
    node.nodeType = "JSXOpeningElement";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    TSNode tagName = this.parseJSXElementName();
    node.name = tagName.name;
    node.left = tagName;
    while (this.isAtEnd() == false) {
      String v = this.peekValue();
      if ( (v == ">") || (v == "/") ) {
        break;
      }
      TSNode attr = this.parseJSXAttribute();
      node.children.add(attr);
    }
    if ( this.matchValue("/") ) {
      this.advance();
      node.kind = "self-closing";
    }
    this.expectValue(">");
    return node;
  }
  
  TSNode parseJSXClosingElement() {
    TSNode node =  TSNode();
    node.nodeType = "JSXClosingElement";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    this.expectValue("/");
    TSNode tagName = this.parseJSXElementName();
    node.name = tagName.name;
    node.left = tagName;
    this.expectValue(">");
    return node;
  }
  
  TSNode parseJSXElementName() {
    TSNode node =  TSNode();
    node.nodeType = "JSXIdentifier";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    String namePart = tok.value;
    this.advance();
    while (this.matchValue(".")) {
      this.advance();
      Token nextTok = this.peek();
      namePart = (namePart + ".") + nextTok.value;
      this.advance();
      node.nodeType = "JSXMemberExpression";
    }
    node.name = namePart;
    return node;
  }
  
  TSNode parseJSXAttribute() {
    TSNode node =  TSNode();
    node.nodeType = "JSXAttribute";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    if ( this.matchValue("{") ) {
      this.advance();
      if ( this.matchValue("...") ) {
        this.advance();
        node.nodeType = "JSXSpreadAttribute";
        TSNode arg = this.parseExpr();
        node.left = arg;
        this.expectValue("}");
        return node;
      }
    }
    String attrName = tok.value;
    node.name = attrName;
    this.advance();
    if ( this.matchValue("=") ) {
      this.advance();
      String valTok = this.peekValue();
      if ( valTok == "{" ) {
        TSNode exprValue = this.parseJSXExpressionContainer();
        node.right = exprValue;
      } else {
        Token strTok = this.peek();
        TSNode strNode =  TSNode();
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
  }
  
  TSNode parseJSXExpressionContainer() {
    TSNode node =  TSNode();
    node.nodeType = "JSXExpressionContainer";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("{");
    if ( this.matchValue("}") ) {
      TSNode empty =  TSNode();
      empty.nodeType = "JSXEmptyExpression";
      node.left = empty;
    } else {
      TSNode expr = this.parseExpr();
      node.left = expr;
    }
    this.expectValue("}");
    return node;
  }
  
  TSNode parseJSXText() {
    TSNode node =  TSNode();
    node.nodeType = "JSXText";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    node.value = tok.value;
    this.advance();
    return node;
  }
  
  TSNode parseJSXFragment() {
    TSNode node =  TSNode();
    node.nodeType = "JSXFragment";
    Token tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    this.expectValue(">");
    while (this.isAtEnd() == false) {
      String v = this.peekValue();
      if ( v == "<" ) {
        String nextVal = this.peekNextValue();
        if ( nextVal == "/" ) {
          break;
        }
        TSNode child = this.parseJSXElement();
        node.children.add(child);
      } else {
        if ( v == "{" ) {
          TSNode exprChild = this.parseJSXExpressionContainer();
          node.children.add(exprChild);
        } else {
          String t = this.peekType();
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            TSNode textChild = this.parseJSXText();
            node.children.add(textChild);
          } else {
            break;
          }
        }
      }
    }
    this.expectValue("<");
    this.expectValue("/");
    this.expectValue(">");
    return node;
  }
}

class TSParserMain {
  
  static void showHelp() {
    print( "TypeScript Parser" );
    print( "" );
    print( "Usage: node ts_parser_main.js [options]" );
    print( "" );
    print( "Options:" );
    print( "  -h, --help          Show this help message" );
    print( "  -d                  Run built-in demo/test suite" );
    print( "  -i <file>           Input TypeScript file to parse" );
    print( "  --tokens            Show tokens in addition to AST" );
    print( "  --show-interfaces   List all interfaces in the file" );
    print( "  --show-types        List all type aliases in the file" );
    print( "  --show-functions    List all functions in the file" );
    print( "" );
    print( "Examples:" );
    print( "  node ts_parser_main.js -d                              Run the demo" );
    print( "  node ts_parser_main.js -i script.ts                    Parse and show AST" );
    print( "  node ts_parser_main.js -i script.ts --tokens           Also show tokens" );
    print( "  node ts_parser_main.js -i script.ts --show-interfaces  List interfaces" );
  }
  
  static void listDeclarations(String filename, bool showInterfaces, bool showTypes, bool showFunctions) {
    String? codeOpt = (() { try { final __p = (".").isEmpty ? (filename) : ((".") + "/" + (filename)); return File(__p).readAsStringSync(); } catch (_) { return null; } })();
    if ( codeOpt == null ) {
      print( "Error: Could not read file: " + filename );
      return;
    }
    String code = codeOpt!;
    TSLexer lexer =  TSLexer(code);
    List<Token> tokens = lexer.tokenize();
    TSParserSimple parser =  TSParserSimple();
    parser.initParser(tokens);
    parser.setQuiet(true);
    TSNode program = parser.parseProgram();
    if ( showInterfaces ) {
      print( ("=== Interfaces in " + filename) + " ===" );
      print( "" );
      TSParserMain.listInterfaces(program);
      print( "" );
    }
    if ( showTypes ) {
      print( ("=== Type Aliases in " + filename) + " ===" );
      print( "" );
      TSParserMain.listTypeAliases(program);
      print( "" );
    }
    if ( showFunctions ) {
      print( ("=== Functions in " + filename) + " ===" );
      print( "" );
      TSParserMain.listFunctions(program);
      print( "" );
    }
  }
  
  static void listInterfaces(TSNode program) {
    int count = 0;
    for ( int idx = 0; idx < program.children.length; idx++) {
      var stmt = program.children[idx];
      if ( stmt.nodeType == "TSInterfaceDeclaration" ) {
        count = count + 1;
        String line = "" + stmt.line.toString();
        int props = 0;
        if ( stmt.body != null ) {
          TSNode body = stmt.body!;
          props = body.children.length;
        }
        print( ((((("  " + stmt.name) + " (") + props.toString()) + " properties) [line ") + line) + "]" );
        if ( stmt.body != null ) {
          TSNode bodyNode = stmt.body!;
          for ( int mi = 0; mi < bodyNode.children.length; mi++) {
            var member = bodyNode.children[mi];
            if ( member.nodeType == "TSPropertySignature" ) {
              String propInfo = "    - " + member.name;
              if ( member.optional ) {
                propInfo = propInfo + "?";
              }
              if ( member.readonly ) {
                propInfo = "    - readonly " + member.name;
                if ( member.optional ) {
                  propInfo = propInfo + "?";
                }
              }
              if ( member.typeAnnotation != null ) {
                TSNode typeNode = member.typeAnnotation!;
                if ( typeNode.typeAnnotation != null ) {
                  TSNode innerType = typeNode.typeAnnotation!;
                  propInfo = (propInfo + ": ") + TSParserMain.getTypeName(innerType);
                }
              }
              print( propInfo );
            }
          }
        }
      }
    }
    print( "" );
    print( ("Total: " + count.toString()) + " interface(s)" );
  }
  
  static void listTypeAliases(TSNode program) {
    int count = 0;
    for ( int idx = 0; idx < program.children.length; idx++) {
      var stmt = program.children[idx];
      if ( stmt.nodeType == "TSTypeAliasDeclaration" ) {
        count = count + 1;
        String line = "" + stmt.line.toString();
        String typeInfo = "  " + stmt.name;
        if ( stmt.typeAnnotation != null ) {
          TSNode typeNode = stmt.typeAnnotation!;
          typeInfo = (typeInfo + " = ") + TSParserMain.getTypeName(typeNode);
        }
        typeInfo = ((typeInfo + " [line ") + line) + "]";
        print( typeInfo );
      }
    }
    print( "" );
    print( ("Total: " + count.toString()) + " type alias(es)" );
  }
  
  static void listFunctions(TSNode program) {
    int count = 0;
    for ( int idx = 0; idx < program.children.length; idx++) {
      var stmt = program.children[idx];
      if ( stmt.nodeType == "FunctionDeclaration" ) {
        count = count + 1;
        String line = "" + stmt.line.toString();
        String funcInfo = ("  " + stmt.name) + "(";
        /* unused:  int paramCount = stmt.params.length   */
        int pi = 0;
        for ( int paramIdx = 0; paramIdx < stmt.params.length; paramIdx++) {
          var param = stmt.params[paramIdx];
          if ( pi > 0 ) {
            funcInfo = funcInfo + ", ";
          }
          funcInfo = funcInfo + param.name;
          if ( param.optional ) {
            funcInfo = funcInfo + "?";
          }
          if ( param.typeAnnotation != null ) {
            TSNode paramType = param.typeAnnotation!;
            if ( paramType.typeAnnotation != null ) {
              TSNode innerType = paramType.typeAnnotation!;
              funcInfo = (funcInfo + ": ") + TSParserMain.getTypeName(innerType);
            }
          }
          pi = pi + 1;
        }
        funcInfo = funcInfo + ")";
        if ( stmt.typeAnnotation != null ) {
          TSNode retType = stmt.typeAnnotation!;
          if ( retType.typeAnnotation != null ) {
            TSNode innerRet = retType.typeAnnotation!;
            funcInfo = (funcInfo + ": ") + TSParserMain.getTypeName(innerRet);
          }
        }
        funcInfo = ((funcInfo + " [line ") + line) + "]";
        print( funcInfo );
      }
    }
    print( "" );
    print( ("Total: " + count.toString()) + " function(s)" );
  }
  
  static String getTypeName(TSNode typeNode) {
    String nodeType = typeNode.nodeType;
    if ( nodeType == "TSStringKeyword" ) {
      return "string";
    }
    if ( nodeType == "TSNumberKeyword" ) {
      return "number";
    }
    if ( nodeType == "TSBooleanKeyword" ) {
      return "boolean";
    }
    if ( nodeType == "TSAnyKeyword" ) {
      return "any";
    }
    if ( nodeType == "TSVoidKeyword" ) {
      return "void";
    }
    if ( nodeType == "TSNullKeyword" ) {
      return "null";
    }
    if ( nodeType == "TSUndefinedKeyword" ) {
      return "undefined";
    }
    if ( nodeType == "TSTypeReference" ) {
      String result = typeNode.name;
      if ( (typeNode.params.length) > 0 ) {
        result = result + "<";
        int gi = 0;
        for ( int gpIdx = 0; gpIdx < typeNode.params.length; gpIdx++) {
          var gp = typeNode.params[gpIdx];
          if ( gi > 0 ) {
            result = result + ", ";
          }
          result = result + TSParserMain.getTypeName(gp);
          gi = gi + 1;
        }
        result = result + ">";
      }
      return result;
    }
    if ( nodeType == "TSUnionType" ) {
      String result_1 = "";
      int ui = 0;
      for ( int utIdx = 0; utIdx < typeNode.children.length; utIdx++) {
        var ut = typeNode.children[utIdx];
        if ( ui > 0 ) {
          result_1 = result_1 + " | ";
        }
        result_1 = result_1 + TSParserMain.getTypeName(ut);
        ui = ui + 1;
      }
      return result_1;
    }
    return nodeType;
  }
  
  static void parseFile(String filename, bool showTokens) {
    String? codeOpt = (() { try { final __p = (".").isEmpty ? (filename) : ((".") + "/" + (filename)); return File(__p).readAsStringSync(); } catch (_) { return null; } })();
    if ( codeOpt == null ) {
      print( "Error: Could not read file: " + filename );
      return;
    }
    String code = codeOpt!;
    print( ("=== Parsing: " + filename) + " ===" );
    print( "" );
    TSLexer lexer =  TSLexer(code);
    List<Token> tokens = lexer.tokenize();
    if ( showTokens ) {
      print( "--- Tokens ---" );
      for ( int ti = 0; ti < tokens.length; ti++) {
        var tok = tokens[ti];
        String output = ((tok.tokenType + ": '") + tok.value) + "'";
        print( output );
      }
      print( "" );
    }
    TSParserSimple parser =  TSParserSimple();
    parser.initParser(tokens);
    TSNode program = parser.parseProgram();
    print( "--- AST ---" );
    print( ("Program with " + (program.children.length).toString()) + " statements:" );
    print( "" );
    for ( int idx = 0; idx < program.children.length; idx++) {
      var stmt = program.children[idx];
      TSParserMain.printNode(stmt, 0);
    }
  }
  
  static void runDemo() {
    String code = "\ninterface Person {\n  readonly id: number;\n  name: string;\n  age?: number;\n}\n\ntype ID = string | number;\n\ntype Result = Person | null;\n\nlet count: number = 42;\n\nconst message: string = 'hello';\n\nfunction greet(name: string, age?: number): string {\n  return name;\n}\n\nlet data: Array<string>;\n";
    print( "=== TypeScript Parser Demo ===" );
    print( "" );
    print( "Input:" );
    print( code );
    print( "" );
    print( "--- Tokens ---" );
    TSLexer lexer =  TSLexer(code);
    List<Token> tokens = lexer.tokenize();
    for ( int i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      String output = ((tok.tokenType + ": '") + tok.value) + "'";
      print( output );
    }
    print( "" );
    print( "--- AST ---" );
    TSParserSimple parser =  TSParserSimple();
    parser.initParser(tokens);
    TSNode program = parser.parseProgram();
    print( ("Program with " + (program.children.length).toString()) + " statements:" );
    print( "" );
    for ( int idx = 0; idx < program.children.length; idx++) {
      var stmt = program.children[idx];
      TSParserMain.printNode(stmt, 0);
    }
  }
  
  static void printNode(TSNode node, int depth) {
    String indent = "";
    int i = 0;
    while (i < depth) {
      indent = indent + "  ";
      i = i + 1;
    }
    String nodeType = node.nodeType;
    String loc = ((("[" + node.line.toString()) + ":") + node.col.toString()) + "]";
    if ( nodeType == "TSInterfaceDeclaration" ) {
      print( (((indent + "TSInterfaceDeclaration: ") + node.name) + " ") + loc );
      if ( node.body != null ) {
        TSParserMain.printNode(node.body!, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSInterfaceBody" ) {
      print( (indent + "TSInterfaceBody ") + loc );
      for ( int mi = 0; mi < node.children.length; mi++) {
        var member = node.children[mi];
        TSParserMain.printNode(member, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSPropertySignature" ) {
      String modifiers = "";
      if ( node.readonly ) {
        modifiers = "readonly ";
      }
      if ( node.optional ) {
        modifiers = modifiers + "optional ";
      }
      print( ((((indent + "TSPropertySignature: ") + modifiers) + node.name) + " ") + loc );
      if ( node.typeAnnotation != null ) {
        TSParserMain.printNode(node.typeAnnotation!, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSTypeAliasDeclaration" ) {
      print( (((indent + "TSTypeAliasDeclaration: ") + node.name) + " ") + loc );
      if ( node.typeAnnotation != null ) {
        TSParserMain.printNode(node.typeAnnotation!, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSTypeAnnotation" ) {
      print( (indent + "TSTypeAnnotation ") + loc );
      if ( node.typeAnnotation != null ) {
        TSParserMain.printNode(node.typeAnnotation!, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSUnionType" ) {
      print( (indent + "TSUnionType ") + loc );
      for ( int ti = 0; ti < node.children.length; ti++) {
        var typeNode = node.children[ti];
        TSParserMain.printNode(typeNode, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSTypeReference" ) {
      print( (((indent + "TSTypeReference: ") + node.name) + " ") + loc );
      for ( int pi = 0; pi < node.params.length; pi++) {
        var param = node.params[pi];
        TSParserMain.printNode(param, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSArrayType" ) {
      print( (indent + "TSArrayType ") + loc );
      if ( node.left != null ) {
        TSParserMain.printNode(node.left!, depth + 1);
      }
      return;
    }
    if ( nodeType == "TSStringKeyword" ) {
      print( (indent + "TSStringKeyword ") + loc );
      return;
    }
    if ( nodeType == "TSNumberKeyword" ) {
      print( (indent + "TSNumberKeyword ") + loc );
      return;
    }
    if ( nodeType == "TSBooleanKeyword" ) {
      print( (indent + "TSBooleanKeyword ") + loc );
      return;
    }
    if ( nodeType == "TSAnyKeyword" ) {
      print( (indent + "TSAnyKeyword ") + loc );
      return;
    }
    if ( nodeType == "TSNullKeyword" ) {
      print( (indent + "TSNullKeyword ") + loc );
      return;
    }
    if ( nodeType == "TSVoidKeyword" ) {
      print( (indent + "TSVoidKeyword ") + loc );
      return;
    }
    if ( nodeType == "VariableDeclaration" ) {
      print( (((indent + "VariableDeclaration (") + node.kind) + ") ") + loc );
      for ( int di = 0; di < node.children.length; di++) {
        var declarator = node.children[di];
        TSParserMain.printNode(declarator, depth + 1);
      }
      return;
    }
    if ( nodeType == "VariableDeclarator" ) {
      print( (((indent + "VariableDeclarator: ") + node.name) + " ") + loc );
      if ( node.typeAnnotation != null ) {
        TSParserMain.printNode(node.typeAnnotation!, depth + 1);
      }
      if ( node.init != null ) {
        print( indent + "  init:" );
        TSParserMain.printNode(node.init!, depth + 2);
      }
      return;
    }
    if ( nodeType == "FunctionDeclaration" ) {
      String paramNames = "";
      for ( int pi_1 = 0; pi_1 < node.params.length; pi_1++) {
        var p = node.params[pi_1];
        if ( pi_1 > 0 ) {
          paramNames = paramNames + ", ";
        }
        paramNames = paramNames + p.name;
        if ( p.optional ) {
          paramNames = paramNames + "?";
        }
      }
      print( (((((indent + "FunctionDeclaration: ") + node.name) + "(") + paramNames) + ") ") + loc );
      if ( node.typeAnnotation != null ) {
        print( indent + "  returnType:" );
        TSParserMain.printNode(node.typeAnnotation!, depth + 2);
      }
      if ( node.body != null ) {
        TSParserMain.printNode(node.body!, depth + 1);
      }
      return;
    }
    if ( nodeType == "BlockStatement" ) {
      print( (indent + "BlockStatement ") + loc );
      for ( int si = 0; si < node.children.length; si++) {
        var stmt = node.children[si];
        TSParserMain.printNode(stmt, depth + 1);
      }
      return;
    }
    if ( nodeType == "ExpressionStatement" ) {
      print( (indent + "ExpressionStatement ") + loc );
      if ( node.left != null ) {
        TSParserMain.printNode(node.left!, depth + 1);
      }
      return;
    }
    if ( nodeType == "ReturnStatement" ) {
      print( (indent + "ReturnStatement ") + loc );
      if ( node.left != null ) {
        TSParserMain.printNode(node.left!, depth + 1);
      }
      return;
    }
    if ( nodeType == "Identifier" ) {
      print( (((indent + "Identifier: ") + node.name) + " ") + loc );
      return;
    }
    if ( nodeType == "NumericLiteral" ) {
      print( (((indent + "NumericLiteral: ") + node.value) + " ") + loc );
      return;
    }
    if ( nodeType == "StringLiteral" ) {
      print( (((indent + "StringLiteral: ") + node.value) + " ") + loc );
      return;
    }
    print( ((indent + nodeType) + " ") + loc );
  }
}

void main(List<String> args) {
  int argCnt = args.length;
  if ( argCnt == 0 ) {
    TSParserMain.showHelp();
    return;
  }
  String inputFile = "";
  bool runDefault = false;
  bool showTokens = false;
  bool showInterfaces = false;
  bool showTypes = false;
  bool showFunctions = false;
  int i = 0;
  while (i < argCnt) {
    String arg = args[i];
    if ( (arg == "--help") || (arg == "-h") ) {
      TSParserMain.showHelp();
      return;
    }
    if ( arg == "-d" ) {
      runDefault = true;
      i = i + 1;
    } else {
      if ( arg == "-i" ) {
        i = i + 1;
        if ( i < argCnt ) {
          inputFile = args[i];
        }
        i = i + 1;
      } else {
        if ( arg == "--tokens" ) {
          showTokens = true;
          i = i + 1;
        } else {
          if ( arg == "--show-interfaces" ) {
            showInterfaces = true;
            i = i + 1;
          } else {
            if ( arg == "--show-types" ) {
              showTypes = true;
              i = i + 1;
            } else {
              if ( arg == "--show-functions" ) {
                showFunctions = true;
                i = i + 1;
              } else {
                i = i + 1;
              }
            }
          }
        }
      }
    }
  }
  if ( runDefault ) {
    TSParserMain.runDemo();
    return;
  }
  if ( (inputFile.length) > 0 ) {
    if ( (showInterfaces || showTypes) || showFunctions ) {
      TSParserMain.listDeclarations(inputFile, showInterfaces, showTypes, showFunctions);
      return;
    }
    TSParserMain.parseFile(inputFile, showTokens);
    return;
  }
  TSParserMain.showHelp();
}
