#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(unused_assignments)]
#![allow(non_snake_case)]
#![allow(dead_code)]
// The clippy allows below cover shapes that mirror the Ranger source
// itself - statement-level clamp chains, nested ifs, function arity and
// type names - which the transpiler must not rewrite or rename.
#![allow(clippy::manual_clamp)]
#![allow(clippy::collapsible_if)]
#![allow(clippy::too_many_arguments)]
#![allow(clippy::upper_case_acronyms)]

use std::rc::Rc;
use std::cell::RefCell;

#[derive(Clone)]
struct Token { 
  tokenType : String, 
  value : String, 
  line : i64, 
  col : i64, 
  start : i64, 
  end : i64, 
  hasEscape : bool, 
  legacyOctal : bool, 
}
impl Token { 
  
  pub fn new() ->  Token {
    Token { 
      tokenType:"".to_string(), 
      value:"".to_string(), 
      line:0, 
      col:0, 
      start:0, 
      end:0, 
      hasEscape:false, 
      legacyOctal:false, 
    }
  }
}
#[derive(Clone)]
struct TSUnicodeId { 
}
impl TSUnicodeId { 
  
  pub fn new() ->  TSUnicodeId {
    TSUnicodeId { 
    }
  }
  fn idStartSpec() -> String {
    let mut s : String = "".to_string();
    s = format!("{}1t.p,6.p,1b.0,a.0,4.0,5.m,1.u,1.cp,4.b,e.4,7.0,1.0,3l.4,1.1,2.3,1.0,6.0,1.2,1.0,1.j,1.2a,1", s);
    s = format!("{}.3u,8.4l,1.11,2.0,6.14,1z.q,4.3,19.16,z.1,1.2q,1.0,f.1,7.1,a.2,2.0,g.0,1.t,t.2g,b.0,o.w,9.", s);
    s = format!("{}1,4.0,5.l,4.0,9.0,3.0,n.o,7.a,5.n,1.6,g.15,1m.1h,3.0,i.0,7.9,f.f,4.7,2.1,2.l,1.6,1.0,3.3,3", s);
    s = format!("{}.0,g.0,d.1,1.2,e.1,a.0,8.5,4.1,2.l,1.6,1.1,1.1,1.1,v.3,1.0,j.2,g.8,1.2,1.l,1.6,1.1,1.4,3.0", s);
    s = format!("{},i.0,f.1,n.0,b.7,2.1,2.l,1.6,1.1,1.4,3.0,u.1,1.2,f.0,h.0,1.5,3.2,1.3,3.1,1.0,1.1,3.1,3.2,3", s);
    s = format!("{}.b,m.0,1g.7,1.2,1.m,1.f,3.0,q.2,1.1,2.1,u.0,4.7,1.2,1.m,1.9,1.4,3.0,u.2,1.1,f.1,h.8,1.2,1.", s);
    s = format!("{}14,2.0,g.0,5.2,8.2,o.5,5.h,3.n,1.8,1.0,2.6,1m.1b,1.1,c.6,1m.1,1.0,1.4,1.n,1.0,1.9,1.1,9.0,", s);
    s = format!("{}2.4,1.0,l.3,w.0,1r.7,1.z,r.4,37.16,k.0,g.5,4.3,3.0,3.1,7.2,4.c,c.0,h.11,1.0,5.0,2.16,1.98,", s);
    s = format!("{}1.3,2.6,1.0,1.3,2.14,1.3,2.w,1.3,2.6,1.0,1.3,2.e,1.1k,1.3,2.1u,11.f,g.2d,2.5,3.h7,2.g,1.p,", s);
    s = format!("{}5.22,3.a,7.h,d.i,e.h,e.c,1.2,f.1f,z.0,4.0,1v.2g,7.14,1.0,5.1x,a.u,1d.t,2.4,b.17,4.p,1i.m,9", s);
    s = format!("{}.1g,2a.0,2l.1a,h.7,1i.t,d.1,a.17,q.z,15.2,a.z,2.a,5.16,2.2,15.3,1.5,1.1,3.0,5.5b,1s.7p,2.5", s);
    s = format!("{},2.11,2.5,2.7,1.0,1.0,1.0,1.u,2.1g,1.6,1.0,3.2,1.6,3.3,2.5,4.c,5.2,1.6,38.0,d.0,g.c,2t.0,4", s);
    s = format!("{}.0,2.9,1.0,2.5,6.0,1.0,1.0,1.f,2.3,5.4,4.0,h.14,22f.6c,6.3,3.1,c.11,1.0,5.0,2.1j,7.0,g.m,9", s);
    s = format!("{}.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6,fa.2,p.8,7.4,2.4,4.2d,4.4,1.2h,1.3,5.16,1.2l,h.v,1c.f,e8.53", s);
    s = format!("{}3,1s.h3g,1v.19,2.7g,3.f,a.1,k.1a,g.u,2.27,13.8,2.2u,2.29,k.g,1.2,1.3,1.m,t.1f,e.1d,1q.5,3.", s);
    s = format!("{}0,1.1,b.r,a.m,p.s,7.1a,s.0,g.4,1.9,a.4,1.14,n.2,1.7,k.m,3.0,3.1d,1.0,3.1,2.4,2.0,1.0,o.2,2", s);
    s = format!("{}.a,7.2,c.5,2.5,2.5,9.6,1.6,1.16,1.d,6.36,t.8mb,c.m,4.1c,6is.a5,2.2x,12.6,c.4,5.0,1.9,1.c,1", s);
    s = format!("{}.4,1.0,1.1,1.1,1.2z,x.a2,i.1r,2.1h,14.b,38.4,1.3q,10.p,6.p,b.2g,3.5,2.5,2.5,2.2,z.b,1.p,1.", s);
    s = format!("{}i,1.1,1.e,2.d,y.3e,1x.1g,7f.s,3.1c,1b.v,d.t,5.11,a.t,2.z,4.7,1.4,16.4d,i.z,4.z,4.13,8.1f,c", s);
    s = format!("{}.a,1.e,1.6,1.1,1.a,1.e,1.6,1.1,3.1f,c.8m,9.l,a.7,o.5,1.15,1.8,1x.5,2.0,1.17,1.1,3.0,2.m,a.", s);
    s = format!("{}m,9.u,1t.i,1.1,a.l,a.p,6.p,12.1j,6.1,1s.0,f.3,1.2,1.s,16.s,3.s,z.7,1.r,r.1h,a.l,a.i,d.h,32", s);
    s = format!("{}.20,1j.1e,d.1e,d.z,12.r,9.m,6y.15,6.1,g.5,1k.s,a.0,8.l,16.h,1a.k,r.m,c.1g,1l.1,2.0,d.18,w.", s);
    s = format!("{}o,q.z,t.0,2.0,8.y,3.0,c.1b,e.3,l.0,1.0,z.h,1.o,j.1,1r.6,1.0,1.3,1.e,1.9,7.1a,12.7,2.1,2.l,", s);
    s = format!("{}1.6,1.1,1.4,3.0,i.0,c.4,u.9,1.0,2.0,1.11,1.0,p.0,1.0,18.1g,i.3,k.2,u.1b,k.1,1.0,54.1a,15.3", s);
    s = format!("{},10.1b,k.0,1n.16,d.0,1z.q,11.6,55.17,38.1r,v.7,2.0,2.7,1.1,1.n,f.0,1.0,2m.7,2.12,g.0,1.0,s", s);
    s = format!("{}.0,a.13,7.0,l.0,b.19,j.0,i.20,5j.w,v.8,1.10,h.0,1d.t,34.6,1.1,1.11,l.0,p.5,1.1,1.v,e.0,n.1", s);
    s = format!("{}7,78.i,f.0,1.c,1.x,3g.0,27.pl,2u.32,h.5f,218.2o,f.tr,h.5,p.32y,5.g6,5a1.t,1cy.fs,7.u,h.26,", s);
    s = format!("{}h.t,i.1b,g.3,v.k,5.i,c0.18,5v.1r,w.o,2.o,18.22,5.0,1u.c,1s.1,1.0,e.4,9.5p1,15.v,2p.36,6pp.", s);
    s = format!("{}3,1.6,1.1,1.82,f.0,t.2,2.0,e.3,8.az,1s4.2y,5.c,3.8,7.9,4me.2c,1.1y,1.1,2.0,2.1,2.3,1.b,1.0", s);
    s = format!("{},1.6,1.1s,1.3,2.7,1.6,1.r,1.3,1.4,1.0,3.6,1.9f,2.o,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.7", s);
    s = format!("{},1f8.u,6.5,79.1p,42.18,a.6,g.0,8x.t,i.17,dg.r,6c.t,2.0,5r.u,1.2,1.1,1.6,2.4,9.1,68.6,1.3,1", s);
    s = format!("{}.1,1.e,1.5g,1n.1v,7.0,xg.3,1.q,1.1,1.0,2.0,1.9,1.3,1.0,1.0,6.0,4.0,1.0,1.0,1.2,1.1,1.0,2.0", s);
    s = format!("{},1.0,1.0,1.0,1.0,1.1,1.0,2.3,1.6,1.3,1.3,1.0,1.9,1.g,5.2,1.4,1.g,3es.wyn,w.3dp,2.4gd,2.5rk", s);
    s = format!("{},f.h9,1wi.f1,15u.3t6,5.6jt", s);
    s.clone()
  }
  fn idContinueSpec() -> String {
    let mut s : String = "".to_string();
    s = format!("{}1c.9,7.p,4.0,1.p,1b.0,a.0,1.0,2.0,5.m,1.u,1.cp,4.b,e.4,7.0,1.0,h.38,1.1,2.3,1.0,6.4,1.0,1.", s);
    s = format!("{}j,1.2a,1.3u,1.4,2.4l,1.11,2.0,6.14,8.18,1.0,1.1,1.1,1.0,8.q,4.3,t.a,5.21,4.2t,1.7,2.9,1.i,", s);
    s = format!("{}2.0,g.1m,2.2s,e.1h,4.0,2.0,2.19,i.r,4.a,5.n,1.6,7.22,1.3k,2.9,1.i,1.7,2.1,2.l,1.6,1.0,3.3,", s);
    s = format!("{}2.8,2.1,2.3,8.0,4.1,1.4,2.b,a.0,1.0,2.2,1.5,4.1,2.l,1.6,1.1,1.1,1.1,2.0,1.4,4.1,2.2,3.0,7.", s);
    s = format!("{}3,1.0,7.f,b.2,1.8,1.2,1.l,1.6,1.1,1.4,2.9,1.2,1.2,2.0,f.3,2.9,9.6,1.2,1.7,2.1,2.l,1.6,1.1,", s);
    s = format!("{}1.4,2.8,2.1,2.2,7.2,4.1,1.4,2.9,1.0,g.1,1.5,3.2,1.3,3.1,1.0,1.1,3.1,3.2,3.b,4.4,3.2,1.3,2.", s);
    s = format!("{}0,6.0,e.9,g.c,1.2,1.m,1.f,2.8,1.2,1.3,7.1,1.2,1.1,2.3,2.9,g.3,1.7,1.2,1.m,1.9,1.4,2.8,1.2,", s);
    s = format!("{}1.3,7.1,5.2,1.3,2.9,1.2,c.c,1.2,1.1e,1.2,1.4,5.3,7.4,2.9,a.5,1.2,1.h,3.n,1.8,1.0,2.6,3.0,4", s);
    s = format!("{}.5,1.0,1.7,6.9,2.1,d.1l,5.e,1.9,13.1,1.0,1.4,1.n,1.0,1.m,2.4,1.0,1.6,1.9,2.3,w.0,n.1,6.9,b", s);
    s = format!("{}.0,1.0,1.0,4.9,1.z,4.j,1.h,1.z,9.0,1l.21,6.25,2.11,1.0,5.0,2.16,1.98,1.3,2.6,1.0,1.3,2.14,", s);
    s = format!("{}1.3,2.w,1.3,2.6,1.0,1.3,2.e,1.1k,1.3,2.1u,2.2,9.8,e.f,g.2d,2.5,3.h7,2.g,1.p,5.22,3.a,7.l,9", s);
    s = format!("{}.l,b.j,c.c,1.2,1.1,c.2b,3.0,4.1,2.9,x.2,1.a,6.2g,7.16,5.1x,a.u,1.b,4.b,a.13,2.4,b.17,4.p,6", s);
    s = format!("{}.a,11.r,4.1q,1.s,2.a,6.9,d.0,8.d,1.u,2.b,k.24,3.9,h.8,c.37,c.1j,8.9,3.1c,2.a,5.16,2.2,g.2,", s);
    s = format!("{}1.12,5.et,2.5,2.11,2.5,2.7,1.0,1.0,1.0,1.u,2.1g,1.6,1.0,3.2,1.6,3.3,2.5,4.c,5.2,1.6,f.1,1d", s);
    s = format!("{}.1,j.0,s.0,d.0,g.c,1f.c,4.0,3.b,h.0,4.0,2.9,1.0,2.5,6.0,1.0,1.0,1.f,2.3,5.4,4.0,h.14,22f.6", s);
    s = format!("{}c,6.8,c.11,1.0,5.0,2.1j,7.0,f.n,9.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6,1.v,ed.2,p.e,1.4,2.4,4.2d,", s);
    s = format!("{}2.6,1.2m,5.16,1.2l,h.v,1c.f,e8.533,1s.h3g,1v.19,2.7g,3.r,k.1b,4.9,1.36,11.8,2.2u,2.29,k.1i", s);
    s = format!("{},4.0,j.1f,c.1x,a.9,6.n,3.0,1.1c,2.z,c.s,3.1s,e.a,6.u,1.1i,9.d,2.9,6.m,3.20,o.2,2.f,2.4,a.5", s);
    s = format!("{},2.5,2.5,9.6,1.6,1.16,1.d,6.3e,1.1,2.9,6.8mb,c.m,4.1c,6is.a5,2.2x,12.6,c.4,5.b,1.c,1.4,1.0", s);
    s = format!("{},1.1,1.1,1.2z,x.a2,i.1r,2.1h,14.b,4.f,g.f,3.1,o.2,w.4,1.3q,j.9,7.p,4.0,1.p,a.2h,3.5,2.5,2.", s);
    s = format!("{}5,2.2,z.b,1.p,1.i,1.1,1.e,2.d,y.3e,1x.1g,3s.0,3m.s,3.1c,f.0,v.v,d.t,5.16,5.t,2.z,4.7,1.4,1", s);
    s = format!("{}6.4d,2.9,6.z,4.z,4.13,8.1f,c.a,1.e,1.6,1.1,1.a,1.e,1.6,1.1,3.1f,c.8m,9.l,a.7,o.5,1.15,1.8,", s);
    s = format!("{}1x.5,2.0,1.17,1.1,3.0,2.m,a.m,9.u,1t.i,1.1,a.l,a.p,6.p,12.1j,6.1,1s.3,1.1,5.7,1.2,1.s,2.2,", s);
    s = format!("{}4.0,w.s,3.s,z.7,1.t,p.1h,a.l,a.i,d.h,32.20,1j.1e,d.1e,d.13,8.9,6.11,3.4,1.m,6y.15,1.1,3.1,", s);
    s = format!("{}g.5,1e.y,a.0,8.w,v.l,16.k,r.m,9.1y,v.f,9.1n,7.0,d.o,7.9,6.1g,1.9,4.3,8.z,2.0,9.1w,4.3,1.c,", s);
    s = format!("{}1.0,z.h,1.10,6.3,1q.6,1.0,1.3,1.e,1.9,7.1m,5.9,6.3,1.7,2.1,2.l,1.6,1.1,1.4,1.9,2.1,2.2,2.0", s);
    s = format!("{},6.0,5.6,2.6,3.4,b.9,1.0,2.0,1.11,1.9,1.0,2.0,1.3,1.7,d.1,t.22,5.9,4.3,u.1x,1.0,8.9,4m.1h,", s);
    s = format!("{}2.8,n.5,y.1s,3.0,b.9,12.1k,7.9,6.j,s.q,2.e,4.9,6.6,55.1m,2t.21,l.7,2.0,2.7,1.1,1.t,1.1,2.8", s);
    s = format!("{},c.9,1y.7,2.19,2.7,1.1,r.1q,8.0,8.21,3.0,i.20,2v.7,2g.w,f.9,6.8,1.18,1.8,f.9,o.t,2.l,1.d,2", s);
    s = format!("{}1.6,1.1,1.17,3.0,1.1,1.8,8.9,6.5,1.1,1.10,1.1,1.5,7.9,6.17,4.9,6u.m,9.g,1.14,3.4,d.a,2d.0,", s);
    s = format!("{}27.pl,2u.32,h.5f,218.2o,f.tr,g.l,a.32y,5.g6,5a1.1l,1c6.fs,7.u,1.9,6.26,1.9,6.t,2.4,b.1i,9.", s);
    s = format!("{}3,c.9,9.k,5.i,c0.18,3.9,5i.1r,w.o,2.o,18.22,4.1k,7.g,1s.1,1.1,b.6,9.5p1,15.v,2p.36,6pp.3,1", s);
    s = format!("{}.6,1.1,1.82,f.0,t.2,2.0,e.3,8.az,1s4.2y,5.c,3.8,7.9,3.1,381.9,ee.19,2.m,f2.4,3.5,8.7,2.6,u", s);
    s = format!("{}.3,44.2,cb.2c,1.1y,1.1,2.0,2.1,2.3,1.b,1.0,1.6,1.1s,1.3,2.7,1.6,1.r,1.3,1.4,1.0,3.6,1.9f,2", s);
    s = format!("{}.o,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.7,2.1d,e8.1i,4.1d,8.0,e.0,m.4,1.e,uo.u,6.5,5x.6,1", s);
    s = format!("{}.g,2.6,1.1,1.4,5.1p,x.0,34.18,3.d,2.9,4.0,8x.u,h.1l,d2.15,5y.16,5h.u,1.l,8.1,68.6,1.3,1.1,", s);
    s = format!("{}1.e,1.5g,b.6,15.23,4.9,x2.3,1.q,1.1,1.0,2.0,1.9,1.3,1.0,1.0,6.0,4.0,1.0,1.0,1.2,1.1,1.0,2.", s);
    s = format!("{}0,1.0,1.0,1.0,1.0,1.1,1.0,2.3,1.6,1.3,1.3,1.0,1.9,1.g,5.2,1.4,1.g,2lw.9,sm.wyn,w.3dp,2.4gd", s);
    s = format!("{},2.5rk,f.h9,1wi.f1,15u.3t6,5.6jt,f62u.6n", s);
    s.clone()
  }
  fn base36Value(ch : String) -> i64 {
    let code : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    if  code >= 48 {
      if  code <= 57 {
        return code - 48;
      }
    }
    if  code >= 97 {
      if  code <= 122 {
        return (code - 97) + 10;
      }
    }
    0
  }
  fn decodeRangeTable(&self, spec : String) -> Vec<i64> {
    let mut out : Vec<i64> = Vec::new();
    let mut prev : i64 = -1;
    let mut i : i64 = 0;
    let n : i64 = spec.chars().count() as i64;
    let mut cur : i64 = 0;
    let mut delta : i64 = 0;
    while i < n {
      let ch : String = spec.chars().skip((i) as usize).take((i + 1 - i) as usize).collect::<String>();
      if  ch == "." {
        delta = cur;
        cur = 0;
      } else {
        if  ch == "," {
          let s : i64 = (prev + 1) + delta;
          let e : i64 = s + cur;
          out.push(s);
          out.push(e);
          prev = e;
          cur = 0;
          delta = 0;
        } else {
          cur = (cur * 36) + TSUnicodeId::base36Value(ch.clone());
        }
      }
      i += 1;
    };
    let sLast : i64 = (prev + 1) + delta;
    let eLast : i64 = sLast + cur;
    out.push(sLast);
    out.push(eLast);
    out.clone()
  }
  fn inRangeTable(table : &[i64], code : i64) -> bool {
    let total : i64 = table.len() as i64;
    if  total == 0 {
      return false;
    }
    let pairCount : f64 = (total as f64) / 2_f64;
    let mut loP : i64 = 0;
    let mut hiP : i64 = (pairCount.floor() as i64) - 1;
    while loP <= hiP {
      let midD : f64 = ((loP + hiP) as f64) / 2_f64;
      let midP : i64 = midD.floor() as i64;
      let lo : i64 = table[(midP * 2) as usize];
      let hi : i64 = table[((midP * 2) + 1) as usize];
      if  code < lo {
        hiP = midP - 1;
      } else {
        if  code > hi {
          loP = midP + 1;
        } else {
          return true;
        }
      }
    };
    false
  }
}
#[derive(Clone)]
struct TSLexer { 
  source : String, 
  pos : i64, 
  line : i64, 
  col : i64, 
  __len : i64, 
  prevType : String, 
  prevValue : String, 
  prevLine : i64, 
  unicodeIds : TSUnicodeId, 
  idStartTable : Vec<i64>, 
  idContinueTable : Vec<i64>, 
  idTablesReady : bool, 
  braceKinds : String, 
  lastCloseKind : String, 
  parenKinds : String, 
  lastCloseParen : String, 
}
impl TSLexer { 
  
  pub fn new(src : String) ->  TSLexer {
    let mut me = TSLexer { 
      source:"".to_string(), 
      pos:0, 
      line:1, 
      col:1, 
      __len:0, 
      prevType:"".to_string(), 
      prevValue:"".to_string(), 
      prevLine:0, 
      unicodeIds:TSUnicodeId::new(), 
      idStartTable: Vec::new(), 
      idContinueTable: Vec::new(), 
      idTablesReady:false, 
      braceKinds:"".to_string(), 
      lastCloseKind:"o".to_string(), 
      parenKinds:"".to_string(), 
      lastCloseParen:"e".to_string(), 
    };
    me.source = src.clone();
    me.__len = src.chars().count() as i64;
    me
  }
  fn peek(&self) -> String {
    if  self.pos >= self.__len {
      return "".to_string().clone();
    }
    self.source.chars().nth((self.pos) as usize).map(|c| c.to_string()).unwrap_or_default().clone()
  }
  fn peekAt(&self, offset : i64) -> String {
    let idx : i64 = self.pos + offset;
    if  idx >= self.__len {
      return "".to_string().clone();
    }
    self.source.chars().nth((idx) as usize).map(|c| c.to_string()).unwrap_or_default().clone()
  }
  fn advance(&mut self) -> String {
    if  self.pos >= self.__len {
      return "".to_string().clone();
    }
    let ch : String = self.source.chars().nth((self.pos) as usize).map(|c| c.to_string()).unwrap_or_default();
    self.pos += 1;
    let chCode : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    let mut isTerminator : bool = false;
    if  ((ch == "\n") || (ch == "\r")) || (ch == "\r\n") {
      isTerminator = true;
    }
    if  chCode == 8232 {
      isTerminator = true;
    }
    if  chCode == 8233 {
      isTerminator = true;
    }
    if  isTerminator {
      self.line += 1;
      self.col = 1;
    } else {
      self.col += 1;
    }
    ch.clone()
  }
  fn isDigit(ch : String) -> bool {
    if  ch == "0" {
      return true;
    }
    if  ch == "1" {
      return true;
    }
    if  ch == "2" {
      return true;
    }
    if  ch == "3" {
      return true;
    }
    if  ch == "4" {
      return true;
    }
    if  ch == "5" {
      return true;
    }
    if  ch == "6" {
      return true;
    }
    if  ch == "7" {
      return true;
    }
    if  ch == "8" {
      return true;
    }
    if  ch == "9" {
      return true;
    }
    false
  }
  fn ensureIdTables(&mut self) {
    if  self.idTablesReady {
      return;
    }
    let startSpec : String = TSUnicodeId::idStartSpec();
    self.idStartTable = self.unicodeIds.decodeRangeTable(startSpec.clone());
    let contSpec : String = TSUnicodeId::idContinueSpec();
    self.idContinueTable = self.unicodeIds.decodeRangeTable(contSpec.clone());
    self.idTablesReady = true;
  }
  fn codePointAt(&self, offset : i64) -> i64 {
    let idx : i64 = self.pos + offset;
    if  idx >= self.__len {
      return -1;
    }
    let first : String = self.source.chars().nth((idx) as usize).map(|c| c.to_string()).unwrap_or_default();
    let hi : i64 = first.chars().nth(0).unwrap_or('\0') as i64;
    if  hi >= 55296 {
      if  hi <= 56319 {
        if  (idx + 1) < self.__len {
          let second : String = self.source.chars().nth((idx + 1) as usize).map(|c| c.to_string()).unwrap_or_default();
          let lo : i64 = second.chars().nth(0).unwrap_or('\0') as i64;
          if  lo >= 56320 {
            if  lo <= 57343 {
              return (((hi - 55296) * 1024) + (lo - 56320)) + 65536;
            }
          }
        }
      }
    }
    hi
  }
  fn codePointWidth(&self) -> i64 {
    let cp : i64 = self.codePointAt(0);
    if  cp > 65535 {
      return 2;
    }
    1
  }
  fn isIdStartHere(&mut self) -> bool {
    let cp : i64 = self.codePointAt(0);
    if  cp < 0 {
      return false;
    }
    if  cp < 128 {
      let ch : String = self.source.chars().nth((self.pos) as usize).map(|c| c.to_string()).unwrap_or_default();
      return self.isAlpha(ch.clone());
    }
    self.ensureIdTables();
    TSUnicodeId::inRangeTable(&self.idStartTable, cp)
  }
  fn isIdContinueHere(&mut self) -> bool {
    let cp : i64 = self.codePointAt(0);
    if  cp < 0 {
      return false;
    }
    if  cp < 128 {
      let ch : String = self.source.chars().nth((self.pos) as usize).map(|c| c.to_string()).unwrap_or_default();
      return self.isAlphaNumCh(ch.clone());
    }
    self.ensureIdTables();
    TSUnicodeId::inRangeTable(&self.idContinueTable, cp)
  }
  fn isAlpha(&mut self, ch : String) -> bool {
    if  (ch.chars().count() as i64) == 0 {
      return false;
    }
    let code : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    if  code >= 97 {
      if  code <= 122 {
        return true;
      }
    }
    if  code >= 65 {
      if  code <= 90 {
        return true;
      }
    }
    if  ch == "_" {
      return true;
    }
    if  ch == "$" {
      return true;
    }
    if  code > 127 {
      self.ensureIdTables();
      return TSUnicodeId::inRangeTable(&self.idStartTable, code);
    }
    false
  }
  fn isLetterCode(code : i64) -> bool {
    if  code >= 97 {
      if  code <= 122 {
        return true;
      }
    }
    if  code >= 65 {
      if  code <= 90 {
        return true;
      }
    }
    false
  }
  fn isAlphaNumCh(&mut self, ch : String) -> bool {
    if  TSLexer::isDigit(ch.clone()) {
      return true;
    }
    if  ch == "_" {
      return true;
    }
    if  ch == "$" {
      return true;
    }
    if  (ch.chars().count() as i64) == 0 {
      return false;
    }
    let code : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    if  code >= 97 {
      if  code <= 122 {
        return true;
      }
    }
    if  code >= 65 {
      if  code <= 90 {
        return true;
      }
    }
    if  code > 127 {
      self.ensureIdTables();
      return TSUnicodeId::inRangeTable(&self.idContinueTable, code);
    }
    false
  }
  fn isWhitespace(ch : String) -> bool {
    if  ch == " " {
      return true;
    }
    if  ch == "\t" {
      return true;
    }
    if  ch == "\n" {
      return true;
    }
    if  ch == "\r" {
      return true;
    }
    if  ch == "\r\n" {
      return true;
    }
    if  (ch.chars().count() as i64) == 0 {
      return false;
    }
    let code : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    if  code == 11 {
      return true;
    }
    if  code == 12 {
      return true;
    }
    if  code == 160 {
      return true;
    }
    if  code == 5760 {
      return true;
    }
    if  code >= 8192 {
      if  code <= 8202 {
        return true;
      }
    }
    if  code == 8232 {
      return true;
    }
    if  code == 8233 {
      return true;
    }
    if  code == 8239 {
      return true;
    }
    if  code == 8287 {
      return true;
    }
    if  code == 12288 {
      return true;
    }
    if  code == 65279 {
      return true;
    }
    false
  }
  fn skipWhitespace(&mut self) {
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  TSLexer::isWhitespace(ch.clone()) {
        self.advance();
      } else {
        return;
      }
    };
  }
  fn makeToken(&mut self, tokType : String, value : String, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<Token>> {
    let mut tok : Rc<RefCell<Token>> = Rc::new(RefCell::new(Token::new()));
    tok.borrow_mut().tokenType = tokType.clone();
    tok.borrow_mut().value = value.clone();
    tok.borrow_mut().start = startPos;
    tok.borrow_mut().end = self.pos;
    tok.borrow_mut().line = startLine;
    tok.borrow_mut().col = startCol;
    tok.clone()
  }
  fn isLineTerminatorChar(ch : String) -> bool {
    if  ch == "\n" {
      return true;
    }
    if  ch == "\r" {
      return true;
    }
    if  ch == "\r\n" {
      return true;
    }
    if  (ch.chars().count() as i64) == 0 {
      return false;
    }
    let code : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    if  code == 8232 {
      return true;
    }
    if  code == 8233 {
      return true;
    }
    false
  }
  fn readLineComment(&mut self) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    self.advance();
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  TSLexer::isLineTerminatorChar(ch.clone()) {
        return self.makeToken("LineComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
      }
      value = format!("{}{}", value, self.advance());
    };
    self.makeToken("LineComment".to_string(), value.clone(), startPos, startLine, startCol).clone()
  }
  fn readHtmlComment(&mut self) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  TSLexer::isLineTerminatorChar(ch.clone()) {
        break;
      }
      value = format!("{}{}", value, self.advance());
    };
    self.makeToken("HtmlComment".to_string(), value.clone(), startPos, startLine, startCol).clone()
  }
  fn readBlockComment(&mut self) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    self.advance();
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "*" {
        if  self.peekAt(1) == "/" {
          self.advance();
          self.advance();
          return self.makeToken("BlockComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
        }
      }
      value = format!("{}{}", value, self.advance());
    };
    self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone()
  }
  fn readString(&mut self, quote : String) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    let mut value : String = "".to_string();
    let mut sawEscape : bool = false;
    let mut sawOctalEscape : bool = false;
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == quote {
        self.advance();
        let mut strTok : Rc<RefCell<Token>> = self.makeToken("String".to_string(), value.clone(), startPos, startLine, startCol);
        strTok.borrow_mut().hasEscape = sawEscape;
        strTok.borrow_mut().legacyOctal = sawOctalEscape;
        return strTok.clone();
      }
      if  ch == "\n" {
        return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
      }
      if  ch == "\r" {
        return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
      }
      if  ch == "\\" {
        sawEscape = true;
        self.advance();
        let esc : String = self.advance();
        if  esc == "n" {
          value = format!("{}\n", value);
        } else {
          if  esc == "t" {
            value = format!("{}\t", value);
          } else {
            if  esc == "r" {
              value = format!("{}\r", value);
            } else {
              if  esc == "b" {
                value = format!("{}{}", value, char::from_u32(8 as u32).unwrap_or('\0'));
              } else {
                if  esc == "f" {
                  value = format!("{}{}", value, char::from_u32(12 as u32).unwrap_or('\0'));
                } else {
                  if  esc == "v" {
                    value = format!("{}{}", value, char::from_u32(11 as u32).unwrap_or('\0'));
                  } else {
                    if  esc == "0" {
                      let afterZero : String = self.peek();
                      if  TSLexer::isDigit(afterZero.clone()) {
                        sawOctalEscape = true;
                        value = format!("{}{}", value, esc);
                      } else {
                        value = format!("{}{}", value, char::from_u32(0 as u32).unwrap_or('\0'));
                      }
                    } else {
                      if  esc == "x" {
                        let h1 : String = self.peek();
                        let hv1 : i64 = TSLexer::hexValue(h1.clone());
                        let h2 : String = self.peekAt(1);
                        let hv2 : i64 = TSLexer::hexValue(h2.clone());
                        if  (hv1 < 0) || (hv2 < 0) {
                          return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
                        }
                        self.advance();
                        self.advance();
                        value = format!("{}{}", value, char::from_u32(((hv1 * 16) + hv2) as u32).unwrap_or('\0'));
                      } else {
                        if  esc == "u" {
                          let uEsc : String = self.readUnicodeEscapeBody();
                          if  (uEsc.chars().count() as i64) == 0 {
                            return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
                          }
                          value = format!("{}{}", value, uEsc);
                        } else {
                          if  esc == "\\" {
                            value = format!("{}\\", value);
                          } else {
                            if  esc == "\r" {
                              if  self.peek() == "\n" {
                                self.advance();
                              }
                            }
                            if  (esc == "\n") || (esc == "\r") {
                            } else {
                              if  (esc == "8") || (esc == "9") {
                                return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
                              }
                              if  TSLexer::isDigit(esc.clone()) {
                                sawOctalEscape = true;
                              }
                              value = format!("{}{}", value, esc);
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
        value = format!("{}{}", value, self.advance());
      }
    };
    self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone()
  }
  fn readTemplateLiteral(&mut self) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "`" {
        self.advance();
        return self.makeToken("Template".to_string(), value.clone(), startPos, startLine, startCol).clone();
      }
      if  ch == "\\" {
        self.advance();
        let esc : String = self.advance();
        if  esc == "n" {
          value = format!("{}\n", value);
        } else {
          if  esc == "t" {
            value = format!("{}\t", value);
          } else {
            if  esc == "`" {
              value = format!("{}`", value);
            } else {
              if  esc == "$" {
                value = format!("{}$", value);
              } else {
                if  TSLexer::isDigit(esc.clone()) {
                  if  esc != "0" {
                    return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
                  }
                  let afterZero : String = self.peek();
                  if  TSLexer::isDigit(afterZero.clone()) {
                    return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
                  }
                }
                value = format!("{}{}", value, esc);
              }
            }
          }
        }
      } else {
        if  ch == "$" {
          if  self.peekAt(1) == "{" {
            value = format!("{}{}", value, self.advance());
            value = format!("{}{}", value, self.advance());
            let mut braceDepth : i64 = 1;
            while (self.pos < self.__len) && (braceDepth > 0) {
              let ic : String = self.peek();
              if  ic == "\\" {
                value = format!("{}{}", value, self.advance());
                if  self.pos < self.__len {
                  value = format!("{}{}", value, self.advance());
                }
              } else {
                if  ic == "{" {
                  braceDepth += 1;
                  value = format!("{}{}", value, self.advance());
                } else {
                  if  ic == "}" {
                    braceDepth -= 1;
                    value = format!("{}{}", value, self.advance());
                  } else {
                    if  ic == "`" {
                      let mut innerTok : Rc<RefCell<Token>> = self.readTemplateLiteral();
                      value = format!("{}`{}`", value, innerTok.borrow().value);
                    } else {
                      value = format!("{}{}", value, self.advance());
                    }
                  }
                }
              }
            };
          } else {
            value = format!("{}{}", value, self.advance());
          }
        } else {
          value = format!("{}{}", value, self.advance());
        }
      }
    };
    self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone()
  }
  fn digitVal(ch : String) -> i64 {
    if  (ch.chars().count() as i64) == 0 {
      return 0 - 1;
    }
    let code : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    if  code >= 48 {
      if  code <= 57 {
        return code - 48;
      }
    }
    if  code >= 97 {
      if  code <= 102 {
        return (code - 97) + 10;
      }
    }
    if  code >= 65 {
      if  code <= 70 {
        return (code - 65) + 10;
      }
    }
    0 - 1
  }
  fn readRadix(&mut self, radix : i64, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<Token>> {
    self.advance();
    self.advance();
    let mut acc : i64 = 0;
    let mut looping : bool = true;
    while (self.pos < self.__len) && looping {
      let ch : String = self.peek();
      if  ch == "_" {
        self.advance();
      } else {
        let d : i64 = TSLexer::digitVal(ch.clone());
        if  d >= 0 {
          if  d < radix {
            acc = (acc * radix) + d;
            self.advance();
          } else {
            looping = false;
          }
        } else {
          looping = false;
        }
      }
    };
    let digitsRead : bool = self.pos > (startPos + 2);
    let tail : String = self.peek();
    let mut runsOn : bool = false;
    if  self.isAlphaNumCh(tail.clone()) {
      runsOn = true;
    }
    if  (!digitsRead) || runsOn {
      while self.pos < self.__len {
        let tch : String = self.peek();
        if  self.isAlphaNumCh(tch.clone()) {
          self.advance();
        } else {
          break;
        }
      };
      return self.makeToken("Invalid".to_string(), self.source.chars().skip((startPos) as usize).take((self.pos - startPos) as usize).collect::<String>(), startPos, startLine, startCol).clone();
    }
    self.makeToken("Number".to_string(), acc.to_string(), startPos, startLine, startCol).clone()
  }
  fn readNumber(&mut self) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    if  self.peek() == "0" {
      let p1 : String = self.peekAt(1);
      if  (p1 == "x") || (p1 == "X") {
        return self.readRadix(16, startPos, startLine, startCol).clone();
      }
      if  (p1 == "b") || (p1 == "B") {
        return self.readRadix(2, startPos, startLine, startCol).clone();
      }
      if  (p1 == "o") || (p1 == "O") {
        return self.readRadix(8, startPos, startLine, startCol).clone();
      }
    }
    let mut sawDot : bool = false;
    let mut legacyOctal : bool = false;
    let mut nonOctalDecimal : bool = false;
    if  self.peek() == "0" {
      let secondCh : String = self.peekAt(1);
      if  TSLexer::isDigit(secondCh.clone()) {
        legacyOctal = true;
        let mut scan : i64 = self.pos + 1;
        while scan < self.__len {
          let sc : String = self.source.chars().nth((scan) as usize).map(|c| c.to_string()).unwrap_or_default();
          if  TSLexer::isDigit(sc.clone()) {
            if  (sc == "8") || (sc == "9") {
              nonOctalDecimal = true;
            }
            scan += 1;
          } else {
            break;
          }
        };
        if  nonOctalDecimal {
          legacyOctal = false;
        }
      }
    }
    let mut scanning : bool = true;
    while (self.pos < self.__len) && scanning {
      let ch : String = self.peek();
      if  TSLexer::isDigit(ch.clone()) {
        value = format!("{}{}", value, self.advance());
      } else {
        if  ch == "_" {
          self.advance();
        } else {
          if  ((ch == ".") && (!sawDot)) && (!legacyOctal) {
            sawDot = true;
            value = format!("{}{}", value, self.advance());
          } else {
            if  ch == "n" {
              value = format!("{}{}", value, self.advance());
              return self.makeToken("BigInt".to_string(), value.clone(), startPos, startLine, startCol).clone();
            }
            if  (ch == "e") || (ch == "E") {
              let afterE : String = self.peekAt(1);
              let mut expDigit : String = afterE.clone();
              let mut signLen : i64 = 0;
              if  (afterE == "+") || (afterE == "-") {
                expDigit = self.peekAt(2);
                signLen = 1;
              }
              if  TSLexer::isDigit(expDigit.clone()) {
                value = format!("{}{}", value, self.advance());
                if  signLen > 0 {
                  value = format!("{}{}", value, self.advance());
                }
                while self.pos < self.__len {
                  let ech : String = self.peek();
                  if  TSLexer::isDigit(ech.clone()) {
                    value = format!("{}{}", value, self.advance());
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
    let numTail : String = self.peek();
    if  self.isAlphaNumCh(numTail.clone()) {
      while self.pos < self.__len {
        let tch : String = self.peek();
        if  self.isAlphaNumCh(tch.clone()) {
          self.advance();
        } else {
          break;
        }
      };
      return self.makeToken("Invalid".to_string(), self.source.chars().skip((startPos) as usize).take((self.pos - startPos) as usize).collect::<String>(), startPos, startLine, startCol).clone();
    }
    let mut numTok : Rc<RefCell<Token>> = self.makeToken("Number".to_string(), value.clone(), startPos, startLine, startCol);
    numTok.borrow_mut().legacyOctal = legacyOctal;
    if  nonOctalDecimal {
      numTok.borrow_mut().legacyOctal = true;
    }
    numTok.clone()
  }
  fn hexValue(ch : String) -> i64 {
    if  (ch.chars().count() as i64) == 0 {
      return -1;
    }
    let code : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    if  code >= 48 {
      if  code <= 57 {
        return code - 48;
      }
    }
    if  code >= 97 {
      if  code <= 102 {
        return (code - 97) + 10;
      }
    }
    if  code >= 65 {
      if  code <= 70 {
        return (code - 65) + 10;
      }
    }
    -1
  }
  fn readUnicodeEscape(&mut self) -> String {
    let savedPos : i64 = self.pos;
    let savedLine : i64 = self.line;
    let savedCol : i64 = self.col;
    if  self.peek() != "\\" {
      return "".to_string().clone();
    }
    self.advance();
    if  self.peek() != "u" {
      self.pos = savedPos;
      self.line = savedLine;
      self.col = savedCol;
      return "".to_string().clone();
    }
    self.advance();
    let decoded : String = self.readUnicodeEscapeBody();
    if  (decoded.chars().count() as i64) == 0 {
      self.pos = savedPos;
      self.line = savedLine;
      self.col = savedCol;
      return "".to_string().clone();
    }
    decoded.clone()
  }
  fn readUnicodeEscapeBody(&mut self) -> String {
    let mut code : i64 = 0;
    if  self.peek() == "{" {
      self.advance();
      let mut any : bool = false;
      while self.pos < self.__len {
        let ch : String = self.peek();
        if  ch == "}" {
          break;
        }
        let hv : i64 = TSLexer::hexValue(ch.clone());
        if  hv < 0 {
          return "".to_string().clone();
        }
        code = (code * 16) + hv;
        any = true;
        self.advance();
      };
      if  !any {
        return "".to_string().clone();
      }
      if  self.peek() != "}" {
        return "".to_string().clone();
      }
      if  code > 1114111 {
        return "".to_string().clone();
      }
      self.advance();
    } else {
      let mut i : i64 = 0;
      while i < 4 {
        let hch : String = self.peek();
        let hv_1 : i64 = TSLexer::hexValue(hch.clone());
        if  hv_1 < 0 {
          return "".to_string().clone();
        }
        code = (code * 16) + hv_1;
        self.advance();
        i += 1;
      };
    }
    if  code > 65535 {
      let rest : i64 = code - 65536;
      let restD : f64 = rest as f64;
      let high : i64 = (restD / 1024_f64).floor() as i64;
      let hi : i64 = 55296 + high;
      let lo : i64 = 56320 + (rest - (high * 1024));
      return format!("{}{}", char::from_u32(hi as u32).unwrap_or('\0'), char::from_u32(lo as u32).unwrap_or('\0')).clone();
    }
    char::from_u32(code as u32).unwrap_or('\0').to_string().clone()
  }
  fn readIdentifier(&mut self) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    let mut sawIdEscape : bool = false;
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  self.isIdContinueHere() {
        let width : i64 = self.codePointWidth();
        value = format!("{}{}", value, self.advance());
        if  width == 2 {
          value = format!("{}{}", value, self.advance());
        }
      } else {
        if  ch == "\\" {
          let esc : String = self.readUnicodeEscape();
          if  (esc.chars().count() as i64) == 1 {
            let escCode : i64 = esc.chars().nth(0).unwrap_or('\0') as i64;
            let mut escOk : bool = self.isAlphaNumCh(esc.clone());
            if  escCode >= 55296 {
              if  escCode <= 57343 {
                escOk = false;
              }
            }
            if  !escOk {
              return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
            }
          }
          if  (esc.chars().count() as i64) == 0 {
            if  (value.chars().count() as i64) == 0 {
              self.advance();
              return self.makeToken("Punctuator".to_string(), "\\".to_string(), startPos, startLine, startCol).clone();
            }
            let _tmp_1 = TSLexer::identType(value.clone());
            return self.makeToken(_tmp_1, value.clone(), startPos, startLine, startCol).clone();
          }
          sawIdEscape = true;
          value = format!("{}{}", value, esc);
        } else {
          let _tmp_1 = TSLexer::identType(value.clone());
          let mut idTok : Rc<RefCell<Token>> = self.makeToken(_tmp_1, value.clone(), startPos, startLine, startCol);
          idTok.borrow_mut().hasEscape = sawIdEscape;
          return idTok.clone();
        }
      }
    };
    let _tmp_1 = TSLexer::identType(value.clone());
    let mut idTokEnd : Rc<RefCell<Token>> = self.makeToken(_tmp_1, value.clone(), startPos, startLine, startCol);
    idTokEnd.borrow_mut().hasEscape = sawIdEscape;
    idTokEnd.clone()
  }
  fn identType(value : String) -> String {
    if  value == "var" {
      return "Keyword".to_string().clone();
    }
    if  value == "let" {
      return "Keyword".to_string().clone();
    }
    if  value == "const" {
      return "Keyword".to_string().clone();
    }
    if  value == "function" {
      return "Keyword".to_string().clone();
    }
    if  value == "return" {
      return "Keyword".to_string().clone();
    }
    if  value == "if" {
      return "Keyword".to_string().clone();
    }
    if  value == "else" {
      return "Keyword".to_string().clone();
    }
    if  value == "while" {
      return "Keyword".to_string().clone();
    }
    if  value == "do" {
      return "Keyword".to_string().clone();
    }
    if  value == "with" {
      return "Keyword".to_string().clone();
    }
    if  value == "debugger" {
      return "Keyword".to_string().clone();
    }
    if  value == "for" {
      return "Keyword".to_string().clone();
    }
    if  value == "in" {
      return "Keyword".to_string().clone();
    }
    if  value == "of" {
      return "Keyword".to_string().clone();
    }
    if  value == "switch" {
      return "Keyword".to_string().clone();
    }
    if  value == "case" {
      return "Keyword".to_string().clone();
    }
    if  value == "default" {
      return "Keyword".to_string().clone();
    }
    if  value == "break" {
      return "Keyword".to_string().clone();
    }
    if  value == "continue" {
      return "Keyword".to_string().clone();
    }
    if  value == "try" {
      return "Keyword".to_string().clone();
    }
    if  value == "catch" {
      return "Keyword".to_string().clone();
    }
    if  value == "finally" {
      return "Keyword".to_string().clone();
    }
    if  value == "throw" {
      return "Keyword".to_string().clone();
    }
    if  value == "new" {
      return "Keyword".to_string().clone();
    }
    if  value == "typeof" {
      return "Keyword".to_string().clone();
    }
    if  value == "instanceof" {
      return "Keyword".to_string().clone();
    }
    if  value == "this" {
      return "Keyword".to_string().clone();
    }
    if  value == "class" {
      return "Keyword".to_string().clone();
    }
    if  value == "extends" {
      return "Keyword".to_string().clone();
    }
    if  value == "static" {
      return "Keyword".to_string().clone();
    }
    if  value == "get" {
      return "Keyword".to_string().clone();
    }
    if  value == "set" {
      return "Keyword".to_string().clone();
    }
    if  value == "super" {
      return "Keyword".to_string().clone();
    }
    if  value == "async" {
      return "Keyword".to_string().clone();
    }
    if  value == "await" {
      return "Keyword".to_string().clone();
    }
    if  value == "yield" {
      return "Keyword".to_string().clone();
    }
    if  value == "import" {
      return "Keyword".to_string().clone();
    }
    if  value == "export" {
      return "Keyword".to_string().clone();
    }
    if  value == "from" {
      return "Keyword".to_string().clone();
    }
    if  value == "as" {
      return "Keyword".to_string().clone();
    }
    if  value == "delete" {
      return "Keyword".to_string().clone();
    }
    if  value == "void" {
      return "Keyword".to_string().clone();
    }
    if  value == "type" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "interface" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "namespace" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "module" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "declare" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "readonly" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "abstract" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "implements" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "private" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "protected" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "public" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "override" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "is" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "keyof" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "infer" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "asserts" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "satisfies" {
      return "TSKeyword".to_string().clone();
    }
    if  value == "string" {
      return "TSType".to_string().clone();
    }
    if  value == "number" {
      return "TSType".to_string().clone();
    }
    if  value == "boolean" {
      return "TSType".to_string().clone();
    }
    if  value == "any" {
      return "TSType".to_string().clone();
    }
    if  value == "unknown" {
      return "TSType".to_string().clone();
    }
    if  value == "never" {
      return "TSType".to_string().clone();
    }
    if  value == "undefined" {
      return "TSType".to_string().clone();
    }
    if  value == "object" {
      return "TSType".to_string().clone();
    }
    if  value == "symbol" {
      return "TSType".to_string().clone();
    }
    if  value == "bigint" {
      return "TSType".to_string().clone();
    }
    if  value == "true" {
      return "Boolean".to_string().clone();
    }
    if  value == "false" {
      return "Boolean".to_string().clone();
    }
    if  value == "null" {
      return "Null".to_string().clone();
    }
    "Identifier".to_string().clone()
  }
  fn nextToken(&mut self) -> Rc<RefCell<Token>> {
    self.skipWhitespace();
    if  self.pos >= self.__len {
      return self.makeToken("EOF".to_string(), "".to_string(), self.pos, self.line, self.col).clone();
    }
    let ch : String = self.peek();
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    if  ch == "/" {
      let next : String = self.peekAt(1);
      if  next == "/" {
        return self.readLineComment().clone();
      }
      if  next == "*" {
        return self.readBlockComment().clone();
      }
      if  self.regexAllowed() {
        let mut re : Rc<RefCell<Token>> = self.readRegex();
        if  re.borrow().tokenType == "Regex" {
          return re.clone();
        }
        if  re.borrow().tokenType == "Invalid" {
          return re.clone();
        }
      }
    }
    if  ch == "\"" {
      return self.readString("\"".to_string()).clone();
    }
    if  ch == "'" {
      let mut wordApostrophe : bool = false;
      if  self.pos > 0 {
        if  (self.pos + 1) < self.__len {
          let prevCh : String = self.peekAt(-1);
          let nextCh : String = self.peekAt(1);
          if  (prevCh.chars().count() as i64) > 0 {
            if  (nextCh.chars().count() as i64) > 0 {
              let prevCode : i64 = prevCh.chars().nth(0).unwrap_or('\0') as i64;
              let nextCode : i64 = nextCh.chars().nth(0).unwrap_or('\0') as i64;
              if  TSLexer::isLetterCode(prevCode) && TSLexer::isLetterCode(nextCode) {
                if  self.prevType != "Keyword" {
                  wordApostrophe = true;
                }
              }
            }
          }
        }
      }
      if  wordApostrophe {
        self.advance();
        return self.makeToken("Punctuator".to_string(), "'".to_string(), startPos, startLine, startCol).clone();
      }
      return self.readString("'".to_string()).clone();
    }
    if  ch == "<" {
      if  self.peekAt(1) == "!" {
        if  self.peekAt(2) == "-" {
          if  self.peekAt(3) == "-" {
            return self.readHtmlComment().clone();
          }
        }
      }
    }
    if  ch == "-" {
      if  self.peekAt(1) == "-" {
        if  self.peekAt(2) == ">" {
          if  (self.prevType.is_empty()) || (self.line > self.prevLine) {
            return self.readHtmlComment().clone();
          }
        }
      }
    }
    if  ch == "`" {
      return self.readTemplateLiteral().clone();
    }
    if  TSLexer::isDigit(ch.clone()) {
      return self.readNumber().clone();
    }
    if  ch == "." {
      let afterDot : String = self.peekAt(1);
      if  TSLexer::isDigit(afterDot.clone()) {
        return self.readNumber().clone();
      }
    }
    if  self.isIdStartHere() {
      return self.readIdentifier().clone();
    }
    if  ch == "\\" {
      if  self.peekAt(1) == "u" {
        return self.readIdentifier().clone();
      }
    }
    let next_1 : String = self.peekAt(1);
    if  ch == "=" {
      if  next_1 == "=" {
        if  self.peekAt(2) == "=" {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "===".to_string(), startPos, startLine, startCol).clone();
        }
      }
    }
    if  ch == "!" {
      if  next_1 == "=" {
        if  self.peekAt(2) == "=" {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "!==".to_string(), startPos, startLine, startCol).clone();
        }
      }
    }
    if  ch == "=" {
      if  next_1 == ">" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "=>".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "=" {
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "==".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "!" {
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "!=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "<" {
      if  next_1 == "<" {
        if  self.peekAt(2) == "=" {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "<<=".to_string(), startPos, startLine, startCol).clone();
        }
      }
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "<=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == ">" {
      if  next_1 == ">" {
        if  self.peekAt(2) == "=" {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), ">>=".to_string(), startPos, startLine, startCol).clone();
        }
        if  self.peekAt(2) == ">" {
          if  self.peekAt(3) == "=" {
            self.advance();
            self.advance();
            self.advance();
            self.advance();
            return self.makeToken("Punctuator".to_string(), ">>>=".to_string(), startPos, startLine, startCol).clone();
          }
        }
      }
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), ">=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "&" {
      if  next_1 == "&" {
        self.advance();
        self.advance();
        if  self.peek() == "=" {
          self.advance();
          return self.makeToken("Punctuator".to_string(), "&&=".to_string(), startPos, startLine, startCol).clone();
        }
        return self.makeToken("Punctuator".to_string(), "&&".to_string(), startPos, startLine, startCol).clone();
      }
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "&=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "|" {
      if  next_1 == "|" {
        self.advance();
        self.advance();
        if  self.peek() == "=" {
          self.advance();
          return self.makeToken("Punctuator".to_string(), "||=".to_string(), startPos, startLine, startCol).clone();
        }
        return self.makeToken("Punctuator".to_string(), "||".to_string(), startPos, startLine, startCol).clone();
      }
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "|=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "^" {
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "^=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "?" {
      if  next_1 == "?" {
        self.advance();
        self.advance();
        if  self.peek() == "=" {
          self.advance();
          return self.makeToken("Punctuator".to_string(), "??=".to_string(), startPos, startLine, startCol).clone();
        }
        return self.makeToken("Punctuator".to_string(), "??".to_string(), startPos, startLine, startCol).clone();
      }
      if  next_1 == "." {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "?.".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "+" {
      if  next_1 == "+" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "++".to_string(), startPos, startLine, startCol).clone();
      }
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "+=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "-" {
      if  next_1 == "-" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "--".to_string(), startPos, startLine, startCol).clone();
      }
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "-=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "*" {
      if  next_1 == "*" {
        if  self.peekAt(2) == "=" {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "**=".to_string(), startPos, startLine, startCol).clone();
        }
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "**".to_string(), startPos, startLine, startCol).clone();
      }
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "*=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "/" {
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "/=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "%" {
      if  next_1 == "=" {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "%=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "." {
      if  next_1 == "." {
        if  self.peekAt(2) == "." {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "...".to_string(), startPos, startLine, startCol).clone();
        }
      }
    }
    if  (ch.chars().count() as i64) == 0 {
      return self.makeToken("EOF".to_string(), "".to_string(), self.pos, self.line, self.col).clone();
    }
    let fallbackCode : i64 = ch.chars().nth(0).unwrap_or('\0') as i64;
    self.advance();
    if  fallbackCode > 127 {
      return self.makeToken("Unknown".to_string(), ch.clone(), startPos, startLine, startCol).clone();
    }
    self.makeToken("Punctuator".to_string(), ch.clone(), startPos, startLine, startCol).clone()
  }
  fn tokenize(&mut self) -> Vec<Rc<RefCell<Token>>> {
    let mut tokens : Vec<Rc<RefCell<Token>>> = Vec::new();
    while true {
      let mut tok : Rc<RefCell<Token>> = self.nextToken();
      tokens.push(tok.clone());
      if  ((tok.borrow().tokenType != "LineComment") && (tok.borrow().tokenType != "BlockComment")) && (tok.borrow().tokenType != "HtmlComment") {
        if  tok.borrow().tokenType == "Punctuator" {
          if  tok.borrow().value == "(" {
            let mut headerOpen : String = "e".to_string();
            if  self.prevType == "Keyword" {
              if  (((self.prevValue == "if") || (self.prevValue == "while")) || (self.prevValue == "for")) || (self.prevValue == "with") {
                headerOpen = "h".to_string();
              }
            }
            self.parenKinds = format!("{}{}", self.parenKinds, headerOpen);
          }
          if  tok.borrow().value == ")" {
            let pDepth : i64 = self.parenKinds.chars().count() as i64;
            if  pDepth > 0 {
              self.lastCloseParen = self.parenKinds.chars().skip((pDepth - 1) as usize).take((pDepth - pDepth - 1) as usize).collect::<String>();
              self.parenKinds = self.parenKinds.chars().take((pDepth - 1) as usize).collect::<String>();
            } else {
              self.lastCloseParen = "e".to_string();
            }
          }
          if  tok.borrow().value == "{" {
            self.braceKinds = format!("{}{}", self.braceKinds, self.braceKindHere());
          }
          if  tok.borrow().value == "}" {
            let depth : i64 = self.braceKinds.chars().count() as i64;
            if  depth > 0 {
              self.lastCloseKind = self.braceKinds.chars().skip((depth - 1) as usize).take((depth - depth - 1) as usize).collect::<String>();
              self.braceKinds = self.braceKinds.chars().take((depth - 1) as usize).collect::<String>();
            } else {
              self.lastCloseKind = "o".to_string();
            }
          }
        }
        self.prevType = tok.borrow().tokenType.clone();
        self.prevValue = tok.borrow().value.clone();
        self.prevLine = tok.borrow().line;
      }
      if  tok.borrow().tokenType == "EOF" {
        return tokens.clone();
      }
    };
    tokens.clone()
  }
  fn braceKindHere(&self) -> String {
    if  self.prevType.is_empty() {
      return "b".to_string().clone();
    }
    if  self.line > self.prevLine {
      return "b".to_string().clone();
    }
    if  self.prevType == "Punctuator" {
      if  self.prevValue == ")" {
        return "b".to_string().clone();
      }
      if  self.prevValue == ";" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "{" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "}" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "=>" {
        return "b".to_string().clone();
      }
      if  self.prevValue == ":" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "++" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "--" {
        return "b".to_string().clone();
      }
      return "o".to_string().clone();
    }
    if  self.prevType == "Keyword" {
      if  self.prevValue == "else" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "do" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "try" {
        return "b".to_string().clone();
      }
      if  self.prevValue == "finally" {
        return "b".to_string().clone();
      }
      return "o".to_string().clone();
    }
    "o".to_string().clone()
  }
  fn regexBodyValid(&self, body : String, unicodeMode : bool) -> bool {
    let n : i64 = body.chars().count() as i64;
    let mut groups : i64 = 0;
    let mut maxBackRef : i64 = 0;
    let mut i : i64 = 0;
    let mut inClass : bool = false;
    let mut prevWasAssertion : bool = false;
    let mut skipTo : i64 = -1;
    while i < n {
      skipTo = -1;
      let ch : String = body.chars().skip((i) as usize).take((i + 1 - i) as usize).collect::<String>();
      if  ch == "\\" {
        let esc : String = body.chars().skip((i + 1) as usize).take((i + 2 - i + 1) as usize).collect::<String>();
        if  esc == "u" {
          if  (body.chars().skip((i + 2) as usize).take((i + 3 - i + 2) as usize).collect::<String>()) == "{" {
            let mut cp : i64 = 0;
            let mut j : i64 = i + 3;
            let mut digits : i64 = 0;
            while j < n {
              let hc : String = body.chars().skip((j) as usize).take((j + 1 - j) as usize).collect::<String>();
              if  hc == "}" {
                break;
              }
              let hv : i64 = TSLexer::hexValue(hc.clone());
              if  hv < 0 {
                break;
              }
              cp = (cp * 16) + hv;
              digits += 1;
              j += 1;
            };
            if  digits > 0 {
              if  cp > 1114111 {
                return false;
              }
            }
            if  (body.chars().skip((j) as usize).take((j + 1 - j) as usize).collect::<String>()) == "}" {
              skipTo = j + 1;
            }
          }
        } else {
          let escCode : i64 = esc.chars().nth(0).unwrap_or('\0') as i64;
          if  escCode >= 49 {
            if  escCode <= 57 {
              let refNum : i64 = escCode - 48;
              if  refNum > maxBackRef {
                maxBackRef = refNum;
              }
            }
          }
        }
        if  skipTo >= 0 {
          i = skipTo;
        } else {
          i += 2;
        }
        prevWasAssertion = false;
      } else {
        if  inClass {
          if  ch == "]" {
            inClass = false;
          }
          i += 1;
        } else {
          if  ch == "[" {
            inClass = true;
            prevWasAssertion = false;
            i += 1;
          } else {
            if  ch == "(" {
              let after : String = body.chars().skip((i + 1) as usize).take((i + 3 - i + 1) as usize).collect::<String>();
              if  (after == "?=") || (after == "?!") {
                prevWasAssertion = false;
              } else {
                if  (body.chars().skip((i + 1) as usize).take((i + 2 - i + 1) as usize).collect::<String>()) != "?" {
                  groups += 1;
                }
              }
              i += 1;
            } else {
              if  unicodeMode {
                if  ch == "}" {
                  return false;
                }
                if  ch == "]" {
                  return false;
                }
                if  ch == "{" {
                  let mut k : i64 = i + 1;
                  let mut numDigits : i64 = 0;
                  while k < n {
                    let dc : String = body.chars().skip((k) as usize).take((k + 1 - k) as usize).collect::<String>();
                    if  TSLexer::isDigit(dc.clone()) {
                      numDigits += 1;
                      k += 1;
                    } else {
                      break;
                    }
                  };
                  if  numDigits == 0 {
                    return false;
                  }
                }
              }
              i += 1;
            }
          }
        }
      }
    };
    if  maxBackRef > groups {
      return false;
    }
    true
  }
  fn stringContainsChar(haystack : String, ch : String) -> bool {
    let mut i : i64 = 0;
    let n : i64 = haystack.chars().count() as i64;
    while i < n {
      if  (haystack.chars().skip((i) as usize).take((i + 1 - i) as usize).collect::<String>()) == ch {
        return true;
      }
      i += 1;
    };
    false
  }
  fn regexAllowed(&self) -> bool {
    if  self.prevType.is_empty() {
      return true;
    }
    if  self.prevType == "Number" {
      return false;
    }
    if  self.prevType == "BigInt" {
      return false;
    }
    if  self.prevType == "String" {
      return false;
    }
    if  self.prevType == "Template" {
      return false;
    }
    if  self.prevType == "Regex" {
      return false;
    }
    if  self.prevType == "Unknown" {
      return false;
    }
    if  self.prevType == "Identifier" {
      return false;
    }
    if  self.prevType == "TSType" {
      return false;
    }
    if  self.prevType == "Keyword" {
      if  self.prevValue == "this" {
        return false;
      }
      if  self.prevValue == "super" {
        return false;
      }
      if  self.prevValue == "true" {
        return false;
      }
      if  self.prevValue == "false" {
        return false;
      }
      if  self.prevValue == "null" {
        return false;
      }
      return true;
    }
    if  self.prevType == "Punctuator" {
      if  self.prevValue == ")" {
        if  self.lastCloseParen == "h" {
          return true;
        }
        return false;
      }
      if  self.prevValue == "]" {
        return false;
      }
      if  self.prevValue == "++" {
        return false;
      }
      if  self.prevValue == "--" {
        return false;
      }
      if  self.prevValue == "<" {
        return false;
      }
      if  self.prevValue == "}" {
        if  self.lastCloseKind == "b" {
          return true;
        }
        return false;
      }
      return true;
    }
    true
  }
  fn readRegex(&mut self) -> Rc<RefCell<Token>> {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = self.advance();
    let mut inClass : bool = false;
    let mut closed : bool = false;
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "\n" {
        break;
      }
      if  ch == "\r" {
        break;
      }
      if  ch == "\\" {
        value = format!("{}{}", value, self.advance());
        if  self.pos < self.__len {
          let escCh : String = self.peek();
          if  (escCh == "\n") || (escCh == "\r") {
            break;
          }
          value = format!("{}{}", value, self.advance());
        }
      } else {
        if  ch == "[" {
          inClass = true;
          value = format!("{}{}", value, self.advance());
        } else {
          if  ch == "]" {
            inClass = false;
            value = format!("{}{}", value, self.advance());
          } else {
            if  ch == "/" {
              if  inClass {
                value = format!("{}{}", value, self.advance());
              } else {
                value = format!("{}{}", value, self.advance());
                closed = true;
                break;
              }
            } else {
              value = format!("{}{}", value, self.advance());
            }
          }
        }
      }
    };
    if  !closed {
      self.pos = startPos;
      self.line = startLine;
      self.col = startCol;
      return self.makeToken("".to_string(), "".to_string(), startPos, startLine, startCol).clone();
    }
    let mut flags : String = "".to_string();
    let mut badFlag : bool = false;
    while self.pos < self.__len {
      let fch : String = self.peek();
      if  self.isAlphaNumCh(fch.clone()) {
        let mut known : bool = false;
        if  fch == "d" {
          known = true;
        }
        if  fch == "g" {
          known = true;
        }
        if  fch == "i" {
          known = true;
        }
        if  fch == "m" {
          known = true;
        }
        if  fch == "s" {
          known = true;
        }
        if  fch == "u" {
          known = true;
        }
        if  fch == "v" {
          known = true;
        }
        if  fch == "y" {
          known = true;
        }
        if  !known {
          badFlag = true;
        }
        if  TSLexer::stringContainsChar(flags.clone(), fch.clone()) {
          badFlag = true;
        }
        flags = format!("{}{}", flags, fch);
        value = format!("{}{}", value, self.advance());
      } else {
        break;
      }
    };
    if  badFlag {
      return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
    }
    if  self.peek() == "\\" {
      return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
    }
    let bodyLen : i64 = (value.chars().count() as i64) - ((flags.chars().count() as i64) + 2);
    let body : String = value.chars().skip(1).take((1 + bodyLen - 1) as usize).collect::<String>();
    let unicodeMode : bool = TSLexer::stringContainsChar(flags.clone(), "u".to_string());
    if  !(self.regexBodyValid(body.clone(), unicodeMode)) {
      return self.makeToken("Invalid".to_string(), value.clone(), startPos, startLine, startCol).clone();
    }
    self.makeToken("Regex".to_string(), value.clone(), startPos, startLine, startCol).clone()
  }
}
#[derive(Clone)]
struct TSNode { 
  nodeType : String, 
  start : i64, 
  end : i64, 
  line : i64, 
  col : i64, 
  name : String, 
  value : String, 
  kind : String, 
  optional : bool, 
  readonly : bool, 
  prefix : bool, 
  shorthand : bool, 
  computed : bool, 
  accessor : String, 
  parenthesized : bool, 
  hasEscape : bool, 
  argScanned : bool, 
  usesArguments : bool, 
  numScanned : bool, 
  numValue : f64, 
  method : bool, 
  generator : bool, 
  r#async : bool, 
  delegate : bool, 
  r#await : bool, 
  children : Vec<Rc<RefCell<TSNode>>>, 
  params : Vec<Rc<RefCell<TSNode>>>, 
  decorators : Vec<Rc<RefCell<TSNode>>>, 
  left : Option<Rc<RefCell<TSNode>>>, 
  right : Option<Rc<RefCell<TSNode>>>, 
  body : Option<Rc<RefCell<TSNode>>>, 
  init : Option<Rc<RefCell<TSNode>>>, 
  typeAnnotation : Option<Rc<RefCell<TSNode>>>, 
  test : Option<Rc<RefCell<TSNode>>>, 
  consequent : Option<Rc<RefCell<TSNode>>>, 
  alternate : Option<Rc<RefCell<TSNode>>>, 
}
impl TSNode { 
  
  pub fn new() ->  TSNode {
    TSNode { 
      nodeType:"".to_string(), 
      start:0, 
      end:0, 
      line:0, 
      col:0, 
      name:"".to_string(), 
      value:"".to_string(), 
      kind:"".to_string(), 
      optional:false, 
      readonly:false, 
      prefix:false, 
      shorthand:false, 
      computed:false, 
      accessor:"".to_string(), 
      parenthesized:false, 
      hasEscape:false, 
      argScanned:false, 
      usesArguments:false, 
      numScanned:false, 
      numValue:0_f64, 
      method:false, 
      generator:false, 
      r#async:false, 
      delegate:false, 
      r#await:false, 
      children: Vec::new(), 
      params: Vec::new(), 
      decorators: Vec::new(), 
      left: None, 
      right: None, 
      body: None, 
      init: None, 
      typeAnnotation: None, 
      test: None, 
      consequent: None, 
      alternate: None, 
    }
  }
}
#[derive(Clone)]
struct TSParserSimple { 
  tokens : Vec<Rc<RefCell<Token>>>, 
  pos : i64, 
  currentToken : Option<Rc<RefCell<Token>>>, 
  quiet : bool, 
  errorCount : i64, 
  scopeNames : Vec<String>, 
  scopeStart : Vec<i64>, 
  scopeIsFn : Vec<i64>, 
  suppressBlockScope : bool, 
  strictMode : bool, 
  declaringKind : String, 
  allowSuperCall : bool, 
  allowSuperProperty : bool, 
  inDerivedClass : bool, 
  iterationDepth : i64, 
  switchDepth : i64, 
  activeLabels : Vec<String>, 
  iterationLabels : Vec<String>, 
  pendingLabel : String, 
  inGenerator : bool, 
  functionDepth : i64, 
  sawRestParam : bool, 
  lastBlockEnabledStrict : bool, 
  restParamPending : bool, 
  patternAllowsMemberTarget : bool, 
  exportedNames : Vec<String>, 
  moduleMode : bool, 
  typeScriptMode : bool, 
  ecmaVersion : i64, 
  noLetReference : bool, 
  inForOfHead : bool, 
  inParamList : bool, 
  parsingFunctionExpression : bool, 
  pendingExportRefs : Vec<String>, 
  inSingleStatementBody : bool, 
  singleBodyIsIfBranch : bool, 
  lastTokenLine : i64, 
  lastTokenEndPos : i64, 
  atModuleTopLevel : bool, 
  inExportDefault : bool, 
  speculating : i64, 
  tsxMode : bool, 
}
impl TSParserSimple { 
  
  pub fn new() ->  TSParserSimple {
    TSParserSimple { 
      tokens: Vec::new(), 
      pos:0, 
      currentToken: None, 
      quiet:false, 
      errorCount:0, 
      scopeNames: Vec::new(), 
      scopeStart: Vec::new(), 
      scopeIsFn: Vec::new(), 
      suppressBlockScope:false, 
      strictMode:false, 
      declaringKind:"".to_string(), 
      allowSuperCall:false, 
      allowSuperProperty:false, 
      inDerivedClass:false, 
      iterationDepth:0, 
      switchDepth:0, 
      activeLabels: Vec::new(), 
      iterationLabels: Vec::new(), 
      pendingLabel:"".to_string(), 
      inGenerator:false, 
      functionDepth:0, 
      sawRestParam:false, 
      lastBlockEnabledStrict:false, 
      restParamPending:false, 
      patternAllowsMemberTarget:false, 
      exportedNames: Vec::new(), 
      moduleMode:true, 
      typeScriptMode:true, 
      ecmaVersion:2024, 
      noLetReference:false, 
      inForOfHead:false, 
      inParamList:false, 
      parsingFunctionExpression:false, 
      pendingExportRefs: Vec::new(), 
      inSingleStatementBody:false, 
      singleBodyIsIfBranch:false, 
      lastTokenLine:0, 
      lastTokenEndPos:0, 
      atModuleTopLevel:false, 
      inExportDefault:false, 
      speculating:0, 
      tsxMode:false, 
    }
  }
  fn initParser(&mut self, mut toks : Vec<Rc<RefCell<Token>>>) {
    self.tokens = toks.clone();
    self.pos = 0;
    self.quiet = false;
    if  (toks.len() as i64) > 0 {
      self.currentToken = Some(toks[0].clone());
      self.skipIgnoredTokens();
    }
  }
  fn syntaxError(&mut self, msg : String) {
    self.errorCount += 1;
    if  self.speculating > 0 {
      return;
    }
    if  !self.quiet {
      println!("{}", msg);
    }
  }
  fn setQuiet(&mut self, q : bool) {
    self.quiet = q;
  }
  fn setTsxMode(&mut self, enabled : bool) {
    self.tsxMode = enabled;
  }
  fn setModuleMode(&mut self, enabled : bool) {
    self.moduleMode = enabled;
  }
  fn setTypeScriptMode(&mut self, enabled : bool) {
    self.typeScriptMode = enabled;
  }
  fn setEcmaVersion(&mut self, year : i64) {
    self.ecmaVersion = year;
  }
  fn peek(&mut self) -> Rc<RefCell<Token>> {
    self.currentToken.clone().unwrap().clone()
  }
  fn peekType(&mut self) -> String {
    if  self.currentToken.is_none() {
      return "EOF".to_string().clone();
    }
    let mut tok : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
    return tok.borrow().tokenType.clone();
  }
  fn peekValue(&mut self) -> String {
    if  self.currentToken.is_none() {
      return "".to_string().clone();
    }
    let mut tok : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
    return tok.borrow().value.clone();
  }
  fn advance(&mut self) {
    if  self.pos < (self.tokens.len() as i64) {
      let mut consumed : Rc<RefCell<Token>> = self.tokens[(self.pos) as usize].clone();
      self.lastTokenLine = consumed.borrow().line;
      self.lastTokenEndPos = consumed.borrow().end;
    }
    self.pos += 1;
    if  self.pos < (self.tokens.len() as i64) {
      self.currentToken = Some(self.tokens[(self.pos) as usize].clone());
    } else {
      let mut eof : Rc<RefCell<Token>> = Rc::new(RefCell::new(Token::new()));
      eof.borrow_mut().tokenType = "EOF".to_string();
      eof.borrow_mut().value = "".to_string();
      self.currentToken = Some(eof.clone());
    }
    self.skipIgnoredTokens();
  }
  fn skipIgnoredTokens(&mut self) {
    while self.pos < (self.tokens.len() as i64) {
      let mut tok : Rc<RefCell<Token>> = self.peek();
      let tokType : String = tok.borrow().tokenType.clone();
      if  ((tokType == "LineComment") || (tokType == "BlockComment")) || (tokType == "HtmlComment") {
        self.pos += 1;
        if  self.pos < (self.tokens.len() as i64) {
          self.currentToken = Some(self.tokens[(self.pos) as usize].clone());
        } else {
          let mut eof : Rc<RefCell<Token>> = Rc::new(RefCell::new(Token::new()));
          eof.borrow_mut().tokenType = "EOF".to_string();
          eof.borrow_mut().value = "".to_string();
          self.currentToken = Some(eof.clone());
          return;
        }
      } else {
        return;
      }
    };
  }
  fn listPrefix(list : &[String], n : i64) -> Vec<String> {
    let mut out : Vec<String> = Vec::new();
    let mut i : i64 = 0;
    while i < n {
      out.push(list[(i) as usize].clone());
      i += 1;
    };
    out.clone()
  }
  fn intListPrefix(list : &[i64], n : i64) -> Vec<i64> {
    let mut out : Vec<i64> = Vec::new();
    let mut i : i64 = 0;
    while i < n {
      out.push(list[(i) as usize]);
      i += 1;
    };
    out.clone()
  }
  fn pushScope(&mut self, isFunctionBoundary : bool) {
    self.scopeStart.push(self.scopeNames.len() as i64);
    if  isFunctionBoundary {
      self.scopeIsFn.push(1);
    } else {
      self.scopeIsFn.push(0);
    }
  }
  fn popScope(&mut self) {
    let depth : i64 = self.scopeStart.len() as i64;
    if  depth == 0 {
      return;
    }
    let start : i64 = self.scopeStart[(depth - 1) as usize];
    self.scopeNames = TSParserSimple::listPrefix(&self.scopeNames, start);
    self.scopeStart = TSParserSimple::intListPrefix(&self.scopeStart, depth - 1);
    self.scopeIsFn = TSParserSimple::intListPrefix(&self.scopeIsFn, depth - 1);
  }
  fn declareBinding(&mut self, kind : String, name : String) {
    if  (name.chars().count() as i64) == 0 {
      return;
    }
    let depth : i64 = self.scopeStart.len() as i64;
    if  depth == 0 {
      return;
    }
    let total : i64 = self.scopeNames.len() as i64;
    let scopeIdx : i64 = depth - 1;
    let mut limit : i64 = 0;
    let mut hoists : bool = false;
    if  kind == "v" {
      hoists = true;
    }
    if  kind == "f" {
      hoists = true;
    }
    if  hoists {
      let mut walk : i64 = scopeIdx;
      let mut keepWalking : bool = true;
      while (walk >= 0) && keepWalking {
        if  self.scopeIsFn[(walk) as usize] == 1 {
          keepWalking = false;
        } else {
          walk -= 1;
        }
      };
      if  walk < 0 {
        limit = 0;
      } else {
        limit = self.scopeStart[(walk) as usize];
      }
    } else {
      limit = self.scopeStart[(scopeIdx) as usize];
    }
    let ownStart : i64 = self.scopeStart[(scopeIdx) as usize];
    let mut i : i64 = limit;
    while i < total {
      let entry : String = self.scopeNames[(i) as usize].clone();
      // unused:  let sep : i64 = 1;
      let entryKind : String = entry.chars().take(1).collect::<String>();
      let entryName : String = entry.chars().skip(2).take((entry.chars().count() as i64 - 2) as usize).collect::<String>();
      if  entryName == name {
        let mut clash : bool = false;
        if  kind == "l" {
          if  i >= ownStart {
            clash = true;
          }
        }
        if  hoists {
          if  entryKind == "l" {
            clash = true;
          }
        }
        if  kind == "f" {
          if  entryKind == "p" {
            if  i >= ownStart {
              if  !self.inSingleStatementBody {
                clash = true;
              }
            }
          }
        }
        if  self.moduleMode {
          if  self.scopeIsFn[(scopeIdx) as usize] == 1 {
            if  depth == 1 {
              if  i >= ownStart {
                if  (kind == "f") && (entryKind == "v") {
                  clash = true;
                }
                if  (kind == "v") && (entryKind == "f") {
                  clash = true;
                }
                if  (kind == "f") && (entryKind == "f") {
                  clash = true;
                }
              }
            }
          }
        }
        if  kind == "f" {
          if  entryKind == "f" {
            if  i >= ownStart {
              if  self.scopeIsFn[(scopeIdx) as usize] == 0 {
                clash = true;
              }
            }
          }
        }
        if  kind == "p" {
          if  i >= ownStart {
            if  entryKind == "p" {
              clash = true;
            }
          }
        }
        if  clash {
          self.syntaxError(format!("Parse error: '{}' has already been declared", name));
          self.scopeNames.push(format!("{}|{}", kind, name));
          return;
        }
      }
      i += 1;
    };
    self.scopeNames.push(format!("{}|{}", kind, name));
  }
  fn declareBindingKind(&mut self, declKind : String, mut declarator : Rc<RefCell<TSNode>>) {
    let mut k : String = "v".to_string();
    if  declKind == "let" {
      k = "l".to_string();
    }
    if  declKind == "const" {
      k = "l".to_string();
    }
    if  (declarator.borrow().name.chars().count() as i64) > 0 {
      let __arg_0 = declarator.borrow().name.clone();
      self.declareBinding(k.clone(), __arg_0);
    }
  }
  fn declareParam(&mut self, mut param : Rc<RefCell<TSNode>>) {
    if  (param.borrow().name.chars().count() as i64) == 0 {
      return;
    }
    if  self.strictMode {
      let __arg_0 = param.borrow().name.clone();
      self.declareBinding("p".to_string(), __arg_0);
    } else {
      let __arg_0 = param.borrow().name.clone();
      self.declareBinding("q".to_string(), __arg_0);
    }
  }
  fn checkNonSimpleParamDuplicates(&mut self, params : &Vec<Rc<RefCell<TSNode>>>) {
    let mut simple : bool = true;
    let mut i : i64 = 0;
    while i < (params.len() as i64) {
      let mut p : Rc<RefCell<TSNode>> = params[(i) as usize].clone();
      if  p.borrow().nodeType != "Parameter" {
        simple = false;
      }
      if  !(p.borrow().init.is_none()) {
        simple = false;
      }
      i += 1;
    };
    if  simple {
      return;
    }
    let mut names : Vec<String> = self.collectParamNames(params);
    let mut a : i64 = 0;
    while a < (names.len() as i64) {
      let mut b : i64 = 0;
      while b < a {
        if  names[(a) as usize].clone() == names[(b) as usize].clone() {
          self.syntaxError(format!("Parse error: duplicate parameter '{}' in a non-simple parameter list", names[(a) as usize].clone()));
        }
        b += 1;
      };
      a += 1;
    };
  }
  fn collectParamNames(&self, params : &Vec<Rc<RefCell<TSNode>>>) -> Vec<String> {
    let mut out : Vec<String> = Vec::new();
    let mut i : i64 = 0;
    while i < (params.len() as i64) {
      let mut p : Rc<RefCell<TSNode>> = params[(i) as usize].clone();
      if  (p.borrow().name.chars().count() as i64) > 0 {
        out.push(p.borrow().name.clone());
      }
      let mut sub : Vec<String> = self.collectPatternNames(p.clone());
      let mut j : i64 = 0;
      while j < (sub.len() as i64) {
        out.push(sub[(j) as usize].clone());
        j += 1;
      };
      i += 1;
    };
    out.clone()
  }
  fn collectPatternNames(&self, mut node : Rc<RefCell<TSNode>>) -> Vec<String> {
    let mut out : Vec<String> = Vec::new();
    let mut i : i64 = 0;
    while i < (node.borrow().children.len() as i64) {
      let mut c : Rc<RefCell<TSNode>> = node.borrow().children[(i) as usize].clone();
      let mut bindsOwnName : bool = true;
      if  c.borrow().nodeType == "Property" {
        if  !c.borrow().shorthand {
          bindsOwnName = false;
        }
      }
      if  bindsOwnName {
        if  (c.borrow().name.chars().count() as i64) > 0 {
          out.push(c.borrow().name.clone());
        }
      }
      let mut sub : Vec<String> = self.collectPatternNames(c.clone());
      let mut j : i64 = 0;
      while j < (sub.len() as i64) {
        out.push(sub[(j) as usize].clone());
        j += 1;
      };
      i += 1;
    };
    out.clone()
  }
  fn recheckStrictSignature(&mut self, name : String, params : &Vec<Rc<RefCell<TSNode>>>) {
    let mut k : i64 = 0;
    while k < (params.len() as i64) {
      let mut sp : Rc<RefCell<TSNode>> = params[(k) as usize].clone();
      let spKind : String = sp.borrow().nodeType.clone();
      if  spKind != "Parameter" {
        self.syntaxError("Parse error: a function with a 'use strict' directive must have a simple parameter list".to_string());
      } else {
        if  !(sp.borrow().init.is_none()) {
          self.syntaxError("Parse error: a function with a 'use strict' directive must have a simple parameter list".to_string());
        }
      }
      k += 1;
    };
    if  (name.chars().count() as i64) > 0 {
      if  TSParserSimple::isStrictReservedWord(name.clone()) {
        self.syntaxError(format!("Parse error: '{}' cannot name a function whose body is strict", name));
      }
    }
    let mut i : i64 = 0;
    while i < (params.len() as i64) {
      let mut p : Rc<RefCell<TSNode>> = params[(i) as usize].clone();
      if  (p.borrow().name.chars().count() as i64) > 0 {
        if  TSParserSimple::isStrictReservedWord(p.borrow().name.clone()) {
          let __arg_0 = format!("Parse error: '{}' cannot be a parameter of a strict function", p.borrow().name).clone();
          self.syntaxError(__arg_0);
        }
        let mut j : i64 = 0;
        while j < i {
          let mut q : Rc<RefCell<TSNode>> = params[(j) as usize].clone();
          if  q.borrow().name == p.borrow().name {
            let __arg_0 = format!("Parse error: duplicate parameter '{}' in a strict function", p.borrow().name).clone();
            self.syntaxError(__arg_0);
          }
          j += 1;
        };
      }
      i += 1;
    };
  }
  fn hasUseStrictDirective(&mut self) -> bool {
    let mut i : i64 = self.pos;
    let n : i64 = self.tokens.len() as i64;
    let mut scanning : bool = true;
    while (i < n) && scanning {
      let mut t : Rc<RefCell<Token>> = self.tokens[(i) as usize].clone();
      if  (t.borrow().tokenType == "LineComment") || (t.borrow().tokenType == "BlockComment") {
        i += 1;
      } else {
        if  t.borrow().tokenType == "String" {
          if  t.borrow().value == "use strict" {
            if  !t.borrow().hasEscape {
              return true;
            }
          }
          i += 1;
          if  i < n {
            let mut semi : Rc<RefCell<Token>> = self.tokens[(i) as usize].clone();
            if  semi.borrow().value == ";" {
              i += 1;
            }
          }
        } else {
          scanning = false;
        }
      }
    };
    false
  }
  fn isStrictReservedReference(&self, word : String) -> bool {
    if  word == "eval" {
      return false;
    }
    if  word == "arguments" {
      return false;
    }
    TSParserSimple::isStrictReservedWord(word.clone())
  }
  fn isStrictReservedWord(word : String) -> bool {
    if  word == "implements" {
      return true;
    }
    if  word == "interface" {
      return true;
    }
    if  word == "let" {
      return true;
    }
    if  word == "package" {
      return true;
    }
    if  word == "private" {
      return true;
    }
    if  word == "protected" {
      return true;
    }
    if  word == "public" {
      return true;
    }
    if  word == "static" {
      return true;
    }
    if  word == "yield" {
      return true;
    }
    if  word == "eval" {
      return true;
    }
    if  word == "arguments" {
      return true;
    }
    false
  }
  fn checkBindableName(&mut self, name : String) {
    if  TSParserSimple::isAlwaysReservedWord(name.clone()) {
      self.syntaxError(format!("Parse error: '{}' is a reserved word and cannot be used as a name", name));
      return;
    }
    if  self.moduleMode {
      if  name == "await" {
        self.syntaxError("Parse error: 'await' cannot be used as a name in a module".to_string());
      }
    }
    if  self.strictMode {
      if  TSParserSimple::isStrictReservedWord(name.clone()) {
        self.syntaxError(format!("Parse error: '{}' cannot be used as a name in strict mode", name));
      }
      return;
    }
    if  self.inGenerator {
      if  name == "yield" {
        self.syntaxError("Parse error: 'yield' cannot be used as a name inside a generator".to_string());
      }
    }
    if  self.moduleMode {
      if  name == "await" {
        self.syntaxError("Parse error: 'await' cannot be used as a name in a module".to_string());
      }
    }
    if  self.declaringKind == "l" {
      if  name == "let" {
        self.syntaxError("Parse error: 'let' cannot be the name of a lexical binding".to_string());
      }
    }
  }
  fn isAlwaysReservedWord(word : String) -> bool {
    if  word == "break" {
      return true;
    }
    if  word == "case" {
      return true;
    }
    if  word == "catch" {
      return true;
    }
    if  word == "class" {
      return true;
    }
    if  word == "const" {
      return true;
    }
    if  word == "continue" {
      return true;
    }
    if  word == "debugger" {
      return true;
    }
    if  word == "default" {
      return true;
    }
    if  word == "delete" {
      return true;
    }
    if  word == "do" {
      return true;
    }
    if  word == "else" {
      return true;
    }
    if  word == "enum" {
      return true;
    }
    if  word == "export" {
      return true;
    }
    if  word == "extends" {
      return true;
    }
    if  word == "false" {
      return true;
    }
    if  word == "finally" {
      return true;
    }
    if  word == "for" {
      return true;
    }
    if  word == "function" {
      return true;
    }
    if  word == "if" {
      return true;
    }
    if  word == "import" {
      return true;
    }
    if  word == "in" {
      return true;
    }
    if  word == "instanceof" {
      return true;
    }
    if  word == "new" {
      return true;
    }
    if  word == "null" {
      return true;
    }
    if  word == "return" {
      return true;
    }
    if  word == "super" {
      return true;
    }
    if  word == "switch" {
      return true;
    }
    if  word == "this" {
      return true;
    }
    if  word == "throw" {
      return true;
    }
    if  word == "true" {
      return true;
    }
    if  word == "try" {
      return true;
    }
    if  word == "typeof" {
      return true;
    }
    if  word == "var" {
      return true;
    }
    if  word == "void" {
      return true;
    }
    if  word == "while" {
      return true;
    }
    if  word == "with" {
      return true;
    }
    false
  }
  fn expectModuleExportName(&mut self) -> Rc<RefCell<Token>> {
    let tt : String = self.peekType();
    if  ((((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null")) || (tt == "String") {
      let mut tok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      return tok.clone();
    }
    self.expect("Identifier".to_string()).clone()
  }
  fn expectBindingName(&mut self) -> Rc<RefCell<Token>> {
    let tt : String = self.peekType();
    if  (((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null") {
      let mut tok : Rc<RefCell<Token>> = self.peek();
      let __arg_0 = tok.borrow().value.clone();
      self.checkBindableName(__arg_0);
      self.advance();
      return tok.clone();
    }
    self.expect("Identifier".to_string()).clone()
  }
  fn expect(&mut self, expectedType : String) -> Rc<RefCell<Token>> {
    let mut tok : Rc<RefCell<Token>> = self.peek();
    if  tok.borrow().tokenType != expectedType {
      let __arg_0 = format!("Parse error: expected {} but got {}", expectedType, tok.borrow().tokenType).clone();
      self.syntaxError(__arg_0);
    }
    self.advance();
    tok.clone()
  }
  fn expectValue(&mut self, expectedValue : String) -> Rc<RefCell<Token>> {
    let mut tok : Rc<RefCell<Token>> = self.peek();
    if  tok.borrow().value != expectedValue {
      let __arg_0 = format!("Parse error: expected '{}' but got '{}'", expectedValue, tok.borrow().value).clone();
      self.syntaxError(__arg_0);
    }
    self.advance();
    tok.clone()
  }
  fn isAtEnd(&mut self) -> bool {
    let t : String = self.peekType();
    t == "EOF"
  }
  fn matchType(&mut self, tokenType : String) -> bool {
    let t : String = self.peekType();
    t == tokenType
  }
  fn matchValue(&mut self, value : String) -> bool {
    let t : String = self.peekType();
    if  t == "String" {
      return false;
    }
    if  t == "Template" {
      return false;
    }
    if  t == "Regex" {
      return false;
    }
    let v : String = self.peekValue();
    v == value
  }
  fn matchPunct(&mut self, value : String) -> bool {
    if  self.peekType() != "Punctuator" {
      return false;
    }
    let v : String = self.peekValue();
    v == value
  }
  fn isNameToken(&mut self) -> bool {
    let t : String = self.peekType();
    if  t == "Identifier" {
      return true;
    }
    if  t == "TSType" {
      return true;
    }
    if  t == "Keyword" {
      return true;
    }
    if  t == "TSKeyword" {
      return true;
    }
    if  t == "Boolean" {
      return true;
    }
    if  t == "Null" {
      return true;
    }
    false
  }
  fn isMemberKeyToken(&mut self) -> bool {
    if  self.isNameToken() {
      return true;
    }
    let t : String = self.peekType();
    if  t == "Number" {
      return true;
    }
    if  t == "String" {
      return true;
    }
    false
  }
  fn isAccessorNameAhead(&mut self) -> bool {
    let nt : String = self.peekNextType();
    let mut keyish : bool = false;
    if  nt == "Identifier" {
      keyish = true;
    }
    if  nt == "Keyword" {
      keyish = true;
    }
    if  nt == "TSKeyword" {
      keyish = true;
    }
    if  nt == "TSType" {
      keyish = true;
    }
    if  nt == "String" {
      keyish = true;
    }
    if  nt == "Number" {
      keyish = true;
    }
    if  nt == "Boolean" {
      keyish = true;
    }
    if  nt == "Null" {
      keyish = true;
    }
    if  !keyish {
      return false;
    }
    self.peekAheadValue(2) == "("
  }
  fn isObjectPropertyKeyToken(&mut self) -> bool {
    if  self.isNameToken() {
      return true;
    }
    let t : String = self.peekType();
    if  t == "String" {
      return true;
    }
    if  t == "Number" {
      return true;
    }
    if  t == "Boolean" {
      return true;
    }
    if  t == "Null" {
      return true;
    }
    false
  }
  fn parseMemberName(&mut self) -> Rc<RefCell<Token>> {
    if  self.matchPunct("#".to_string()) {
      self.advance();
    }
    if  self.isNameToken() {
      let mut tok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      return tok.clone();
    }
    self.expect("Identifier".to_string()).clone()
  }
  fn guardNoProgress(&mut self, prevPos : i64) {
    if  self.pos != prevPos {
      return;
    }
    let mut recTok : Rc<RefCell<Token>> = self.peek();
    let __arg_0 = format!("Parser recovery: skipping unexpected token '{}' (type {})", recTok.borrow().value, recTok.borrow().tokenType).clone();
    self.syntaxError(__arg_0);
    if  !(self.isAtEnd()) {
      self.advance();
    }
  }
  fn parseProgram(&mut self) -> Rc<RefCell<TSNode>> {
    let mut prog : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    prog.borrow_mut().nodeType = "Program".to_string();
    self.pushScope(true);
    if  self.moduleMode {
      self.strictMode = true;
    }
    if  self.hasUseStrictDirective() {
      self.strictMode = true;
    }
    self.atModuleTopLevel = true;
    while !(self.isAtEnd()) {
      let beforePos : i64 = self.pos;
      self.atModuleTopLevel = true;
      let mut stmt : Rc<RefCell<TSNode>> = self.parseStatement();
      prog.borrow_mut().children.push(stmt.clone());
      self.guardNoProgress(beforePos);
    };
    self.atModuleTopLevel = false;
    if  self.moduleMode {
      let mut ti : i64 = 0;
      while ti < (self.tokens.len() as i64) {
        let mut t : Rc<RefCell<Token>> = self.tokens[(ti) as usize].clone();
        if  t.borrow().tokenType == "HtmlComment" {
          self.syntaxError("Parse error: HTML-like comments are not allowed in module code".to_string());
        }
        ti += 1;
      };
    }
    self.checkPendingExportRefs();
    self.popScope();
    prog.clone()
  }
  fn isParameterInScope(&mut self, name : String) -> bool {
    let mut i : i64 = 0;
    let total : i64 = self.scopeNames.len() as i64;
    while i < total {
      let entry : String = self.scopeNames[(i) as usize].clone();
      if  (entry.chars().take(1).collect::<String>()) == "p" {
        if  (entry.chars().skip(2).take((entry.chars().count() as i64 - 2) as usize).collect::<String>()) == name {
          return true;
        }
      }
      i += 1;
    };
    false
  }
  fn isDeclaredAnywhere(&mut self, name : String) -> bool {
    let mut i : i64 = 0;
    let total : i64 = self.scopeNames.len() as i64;
    while i < total {
      let entry : String = self.scopeNames[(i) as usize].clone();
      if  (entry.chars().skip(2).take((entry.chars().count() as i64 - 2) as usize).collect::<String>()) == name {
        return true;
      }
      i += 1;
    };
    false
  }
  fn checkPendingExportRefs(&mut self) {
    let mut i : i64 = 0;
    while i < (self.pendingExportRefs.len() as i64) {
      let name : String = self.pendingExportRefs[(i) as usize].clone();
      if  !(self.isDeclaredAnywhere(name.clone())) {
        self.syntaxError(format!("Parse error: export of undeclared name '{}'", name));
      }
      i += 1;
    };
  }
  fn parseStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let tokVal : String = self.peekValue();
    if  tokVal == "@" {
      let mut decorators : Vec<Rc<RefCell<TSNode>>> = Vec::new();
      while self.matchValue("@".to_string()) {
        let mut dec : Rc<RefCell<TSNode>> = self.parseDecorator();
        decorators.push(dec.clone());
      };
      let mut decorated : Rc<RefCell<TSNode>> = self.parseStatement();
      decorated.borrow_mut().decorators = decorators.clone();
      return decorated.clone();
    }
    if  tokVal == "declare" {
      return self.parseDeclare().clone();
    }
    if  tokVal == "import" {
      let afterImport : String = self.peekNextValue();
      if  (afterImport == "(") || (afterImport == ".") {
        return self.parseExprStmt().clone();
      }
      if  !self.moduleMode {
        self.syntaxError("Parse error: an import declaration is only allowed in a module".to_string());
      }
      if  !self.atModuleTopLevel {
        self.syntaxError("Parse error: an import declaration must be at the top level of a module".to_string());
      }
      return self.parseImport().clone();
    }
    if  tokVal == "export" {
      if  !self.moduleMode {
        self.syntaxError("Parse error: an export declaration is only allowed in a module".to_string());
      }
      if  !self.atModuleTopLevel {
        self.syntaxError("Parse error: an export declaration must be at the top level of a module".to_string());
      }
      return self.parseExport().clone();
    }
    if  tokVal == "interface" {
      return self.parseInterface().clone();
    }
    if  tokVal == "type" {
      return self.parseTypeAlias().clone();
    }
    if  tokVal == "class" {
      if  self.inSingleStatementBody {
        self.syntaxError("Parse error: a class declaration cannot be a statement body".to_string());
      }
      let mut classDecl : Rc<RefCell<TSNode>> = self.parseClass();
      if  (classDecl.borrow().name.chars().count() as i64) == 0 {
        if  !self.inExportDefault {
          self.syntaxError("Parse error: a class declaration needs a name".to_string());
        }
      }
      return classDecl.clone();
    }
    if  tokVal == "abstract" {
      let nextVal : String = self.peekNextValue();
      if  nextVal == "class" {
        return self.parseClass().clone();
      }
    }
    if  tokVal == "enum" {
      return self.parseEnum().clone();
    }
    if  tokVal == "namespace" {
      return self.parseNamespace().clone();
    }
    if  tokVal == "const" {
      let nextVal_1 : String = self.peekNextValue();
      if  nextVal_1 == "enum" {
        return self.parseEnum().clone();
      }
    }
    if  ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") {
      let afterKind : String = self.peekNextValue();
      let afterKindType : String = self.peekNextType();
      let mut startsBinding : bool = false;
      if  ((afterKindType == "Identifier") || (afterKindType == "TSType")) || (afterKindType == "TSKeyword") {
        startsBinding = true;
      }
      if  afterKindType == "Keyword" {
        if  (afterKind != "in") && (afterKind != "instanceof") {
          startsBinding = true;
        }
      }
      if  afterKind == "{" {
        startsBinding = true;
      }
      if  afterKind == "[" {
        startsBinding = true;
      }
      if  tokVal != "let" {
        startsBinding = true;
      }
      if  startsBinding {
        if  self.inSingleStatementBody {
          if  tokVal != "var" {
            self.syntaxError("Parse error: a lexical declaration cannot be a statement body".to_string());
          }
        }
        return self.parseVarDecl().clone();
      }
    }
    if  tokVal == "function" {
      if  self.inSingleStatementBody {
        if  self.strictMode {
          self.syntaxError("Parse error: a function declaration cannot be a statement body in strict mode".to_string());
        } else {
          if  !self.singleBodyIsIfBranch {
            self.syntaxError("Parse error: a function declaration cannot be a loop or with body".to_string());
          }
        }
      }
      return self.parseFuncDecl(false).clone();
    }
    if  tokVal == "async" {
      let nextVal_2 : String = self.peekNextValue();
      if  nextVal_2 == "function" {
        self.advance();
        return self.parseFuncDecl(true).clone();
      }
    }
    if  tokVal == "return" {
      return self.parseReturn().clone();
    }
    if  tokVal == "break" {
      return self.parseBreak().clone();
    }
    if  tokVal == "continue" {
      return self.parseContinue().clone();
    }
    if  tokVal == "throw" {
      return self.parseThrow().clone();
    }
    if  tokVal == "if" {
      return self.parseIfStatement().clone();
    }
    if  tokVal == "debugger" {
      let mut dbg : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      dbg.borrow_mut().nodeType = "DebuggerStatement".to_string();
      let mut dbgTok : Rc<RefCell<Token>> = self.peek();
      let _tmp_1 = dbgTok.borrow().start;
      dbg.borrow_mut().start = _tmp_1;
      let _tmp_2 = dbgTok.borrow().line;
      dbg.borrow_mut().line = _tmp_2;
      let _tmp_3 = dbgTok.borrow().col;
      dbg.borrow_mut().col = _tmp_3;
      self.advance();
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return dbg.clone();
    }
    if  tokVal == "with" {
      let mut withNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      withNode.borrow_mut().nodeType = "WithStatement".to_string();
      let mut withTok : Rc<RefCell<Token>> = self.peek();
      let _tmp_1 = withTok.borrow().start;
      withNode.borrow_mut().start = _tmp_1;
      let _tmp_2 = withTok.borrow().line;
      withNode.borrow_mut().line = _tmp_2;
      let _tmp_3 = withTok.borrow().col;
      withNode.borrow_mut().col = _tmp_3;
      if  self.strictMode {
        self.syntaxError("Parse error: 'with' is not allowed in strict mode".to_string());
      }
      self.advance();
      self.expectValue("(".to_string());
      let mut withObj : Rc<RefCell<TSNode>> = self.parseExprSeq();
      withNode.borrow_mut().left = Some(withObj.clone());
      self.expectValue(")".to_string());
      let savedWithBody : bool = self.inSingleStatementBody;
      self.inSingleStatementBody = true;
      self.atModuleTopLevel = false;
      let mut withBody : Rc<RefCell<TSNode>> = self.parseStatement();
      self.inSingleStatementBody = savedWithBody;
      withNode.borrow_mut().body = Some(withBody.clone());
      return withNode.clone();
    }
    if  tokVal == "while" {
      return self.parseWhileStatement().clone();
    }
    if  tokVal == "do" {
      return self.parseDoWhileStatement().clone();
    }
    if  tokVal == "for" {
      return self.parseForStatement().clone();
    }
    if  tokVal == "switch" {
      return self.parseSwitchStatement().clone();
    }
    if  tokVal == "try" {
      return self.parseTryStatement().clone();
    }
    if  tokVal == "{" {
      return self.parseBlock().clone();
    }
    if  tokVal == ";" {
      self.advance();
      let mut empty : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      empty.borrow_mut().nodeType = "EmptyStatement".to_string();
      return empty.clone();
    }
    let tokType : String = self.peekType();
    if  tokType == "Identifier" {
      let nextVal_3 : String = self.peekNextValue();
      if  nextVal_3 == ":" {
        return self.parseLabeledStatement().clone();
      }
    }
    self.parseExprStmt().clone()
  }
  fn parseLabeledStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "LabeledStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    let mut labelTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let _tmp_4 = labelTok.borrow().value.clone();
    node.borrow_mut().name = _tmp_4;
    self.expectValue(":".to_string());
    let bodyStart : String = self.peekValue();
    if  ((bodyStart == "let") || (bodyStart == "const")) || (bodyStart == "class") {
      self.syntaxError(format!("Parse error: '{}' declaration cannot be the body of a labelled statement", bodyStart));
    }
    if  bodyStart == "function" {
      if  self.inSingleStatementBody {
        self.syntaxError("Parse error: a labelled function declaration cannot be a statement body".to_string());
      }
      if  self.strictMode {
        self.syntaxError("Parse error: a function declaration cannot be the body of a labelled statement in strict mode".to_string());
      } else {
        if  self.peekNextValue() == "*" {
          self.syntaxError("Parse error: a generator declaration cannot be the body of a labelled statement".to_string());
        }
      }
    }
    if  TSParserSimple::isInStringList(node.borrow().name.clone(), &self.activeLabels) {
      let __arg_0 = format!("Parse error: label '{}' has already been declared", node.borrow().name).clone();
      self.syntaxError(__arg_0);
    }
    self.activeLabels.push(node.borrow().name.clone());
    let mut scanIdx : i64 = self.pos;
    let tokenTotal : i64 = self.tokens.len() as i64;
    let mut scanning : bool = true;
    while scanning {
      let mut cur : Rc<RefCell<Token>> = self.tokens[(scanIdx) as usize].clone();
      if  (cur.borrow().tokenType == "LineComment") || (cur.borrow().tokenType == "BlockComment") {
        scanIdx += 1;
      } else {
        let mut isName : bool = false;
        if  (cur.borrow().tokenType == "Identifier") || (cur.borrow().tokenType == "TSType") {
          isName = true;
        }
        if  !isName {
          scanning = false;
        } else {
          let mut nextIdx : i64 = scanIdx + 1;
          let mut sawColon : bool = false;
          while nextIdx < tokenTotal {
            let mut nxt : Rc<RefCell<Token>> = self.tokens[(nextIdx) as usize].clone();
            if  (nxt.borrow().tokenType == "LineComment") || (nxt.borrow().tokenType == "BlockComment") {
              nextIdx += 1;
            } else {
              if  nxt.borrow().value == ":" {
                sawColon = true;
              }
              break;
            }
          };
          if  sawColon {
            scanIdx = nextIdx + 1;
          } else {
            scanning = false;
          }
        }
      }
      if  scanIdx >= tokenTotal {
        scanning = false;
      }
    };
    let mut labelledTok : Rc<RefCell<Token>> = self.tokens[(scanIdx) as usize].clone();
    let labelled : String = labelledTok.borrow().value.clone();
    if  ((labelled == "for") || (labelled == "while")) || (labelled == "do") {
      self.iterationLabels.push(node.borrow().name.clone());
    }
    let mut body : Rc<RefCell<TSNode>> = self.parseStatement();
    node.borrow_mut().body = Some(body.clone());
    self.activeLabels = TSParserSimple::listWithoutString(&self.activeLabels, node.borrow().name.clone());
    self.iterationLabels = TSParserSimple::listWithoutString(&self.iterationLabels, node.borrow().name.clone());
    node.clone()
  }
  fn isInStringList(value : String, list : &[String]) -> bool {
    let mut i : i64 = 0;
    while i < (list.len() as i64) {
      if  list[(i) as usize].clone() == value {
        return true;
      }
      i += 1;
    };
    false
  }
  fn listWithoutString(list : &[String], value : String) -> Vec<String> {
    let mut out : Vec<String> = Vec::new();
    let mut i : i64 = 0;
    while i < (list.len() as i64) {
      let item : String = list[(i) as usize].clone();
      if  item != value {
        out.push(item.clone());
      }
      i += 1;
    };
    out.clone()
  }
  fn peekNextValue(&mut self) -> String {
    let nextPos : i64 = self.pos + 1;
    if  nextPos < (self.tokens.len() as i64) {
      let mut nextTok : Rc<RefCell<Token>> = self.tokens[(nextPos) as usize].clone();
      return nextTok.borrow().value.clone();
    }
    "".to_string().clone()
  }
  fn parseReturn(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ReturnStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("return".to_string());
    if  self.functionDepth == 0 {
      self.syntaxError("Parse error: 'return' outside of a function".to_string());
    }
    let v : String = self.peekValue();
    let mut argOnSameLine : bool = true;
    let mut argTok : Rc<RefCell<Token>> = self.peek();
    if  argTok.borrow().line != startTok.borrow().line {
      argOnSameLine = false;
    }
    if  argOnSameLine && ((v != ";") && ((v != "}") && (!(self.isAtEnd())))) {
      let mut arg : Rc<RefCell<TSNode>> = self.parseExprSeq();
      node.borrow_mut().left = Some(arg.clone());
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    node.clone()
  }
  fn parseBreak(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "BreakStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("break".to_string());
    if  self.isNameToken() {
      let mut labelTok : Rc<RefCell<Token>> = self.peek();
      if  labelTok.borrow().line == startTok.borrow().line {
        self.advance();
        let _tmp_1 = labelTok.borrow().value.clone();
        node.borrow_mut().name = _tmp_1;
      }
    }
    if  (node.borrow().name.chars().count() as i64) == 0 {
      if  self.iterationDepth == 0 {
        if  self.switchDepth == 0 {
          self.syntaxError("Parse error: 'break' outside of a loop or switch".to_string());
        }
      }
    } else {
      if  !(TSParserSimple::isInStringList(node.borrow().name.clone(), &self.activeLabels)) {
        let __arg_0 = format!("Parse error: 'break {}' does not name an enclosing label", node.borrow().name).clone();
        self.syntaxError(__arg_0);
      }
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    node.clone()
  }
  fn parseContinue(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ContinueStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("continue".to_string());
    if  self.isNameToken() {
      let mut labelTok : Rc<RefCell<Token>> = self.peek();
      if  labelTok.borrow().line == startTok.borrow().line {
        self.advance();
        let _tmp_1 = labelTok.borrow().value.clone();
        node.borrow_mut().name = _tmp_1;
      }
    }
    if  (node.borrow().name.chars().count() as i64) == 0 {
      if  self.iterationDepth == 0 {
        self.syntaxError("Parse error: 'continue' outside of a loop".to_string());
      }
    } else {
      if  !(TSParserSimple::isInStringList(node.borrow().name.clone(), &self.iterationLabels)) {
        let __arg_0 = format!("Parse error: 'continue {}' does not name an enclosing loop", node.borrow().name).clone();
        self.syntaxError(__arg_0);
      }
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    node.clone()
  }
  fn parseImport(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ImportDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("import".to_string());
    if  self.matchValue("type".to_string()) {
      self.advance();
      node.borrow_mut().kind = "type".to_string();
    }
    let v : String = self.peekValue();
    if  self.peekType() == "String" {
      let mut bareStr : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut bareSource : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      bareSource.borrow_mut().nodeType = "StringLiteral".to_string();
      let _tmp_1 = bareStr.borrow().value.clone();
      bareSource.borrow_mut().value = _tmp_1;
      node.borrow_mut().left = Some(bareSource.clone());
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return node.clone();
    }
    if  v == "{" {
      self.advance();
      let mut specifiers : Vec<Rc<RefCell<TSNode>>> = Vec::new();
      while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
        let mut spec : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        spec.borrow_mut().nodeType = "ImportSpecifier".to_string();
        if  self.matchValue("type".to_string()) {
          self.advance();
          spec.borrow_mut().kind = "type".to_string();
        }
        let mut importedName : Rc<RefCell<Token>> = self.expectModuleExportName();
        let _tmp_1 = importedName.borrow().value.clone();
        spec.borrow_mut().name = _tmp_1;
        if  self.matchValue("as".to_string()) {
          self.advance();
          let mut localName : Rc<RefCell<Token>> = self.expectBindingName();
          let _tmp_1 = localName.borrow().value.clone();
          spec.borrow_mut().value = _tmp_1;
        } else {
          let _tmp_1 = importedName.borrow().value.clone();
          spec.borrow_mut().value = _tmp_1;
        }
        let __arg_0 = spec.borrow().value.clone();
        self.checkBindableName(__arg_0);
        let __arg_0 = spec.borrow().value.clone();
        self.declareBinding("l".to_string(), __arg_0);
        specifiers.push(spec.clone());
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      };
      self.expectValue("}".to_string());
      node.borrow_mut().children = specifiers.clone();
    }
    if  v == "*" {
      self.advance();
      self.expectValue("as".to_string());
      let mut namespaceName : Rc<RefCell<Token>> = self.expectBindingName();
      let __arg_0 = namespaceName.borrow().value.clone();
      self.declareBinding("l".to_string(), __arg_0);
      let mut nsSpec : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      nsSpec.borrow_mut().nodeType = "ImportNamespaceSpecifier".to_string();
      let _tmp_1 = namespaceName.borrow().value.clone();
      nsSpec.borrow_mut().name = _tmp_1;
      node.borrow_mut().children.push(nsSpec.clone());
    }
    if  self.matchType("Identifier".to_string()) {
      let mut defaultSpec : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      defaultSpec.borrow_mut().nodeType = "ImportDefaultSpecifier".to_string();
      let mut defaultName : Rc<RefCell<Token>> = self.expectBindingName();
      let _tmp_1 = defaultName.borrow().value.clone();
      defaultSpec.borrow_mut().name = _tmp_1;
      let __arg_0 = defaultName.borrow().value.clone();
      self.declareBinding("l".to_string(), __arg_0);
      node.borrow_mut().children.push(defaultSpec.clone());
      if  self.matchValue(",".to_string()) {
        self.advance();
        if  self.matchValue("*".to_string()) {
          self.advance();
          self.expectValue("as".to_string());
          let mut nsName : Rc<RefCell<Token>> = self.expectBindingName();
          let __arg_0 = nsName.borrow().value.clone();
          self.declareBinding("l".to_string(), __arg_0);
          let mut nsSpec2 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          nsSpec2.borrow_mut().nodeType = "ImportNamespaceSpecifier".to_string();
          let _tmp_1 = nsName.borrow().value.clone();
          nsSpec2.borrow_mut().name = _tmp_1;
          node.borrow_mut().children.push(nsSpec2.clone());
        }
        if  self.matchValue("{".to_string()) {
          self.advance();
          while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
            let mut spec_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
            spec_1.borrow_mut().nodeType = "ImportSpecifier".to_string();
            let mut importedName_1 : Rc<RefCell<Token>> = self.expectModuleExportName();
            let _tmp_1 = importedName_1.borrow().value.clone();
            spec_1.borrow_mut().name = _tmp_1;
            if  self.matchValue("as".to_string()) {
              self.advance();
              let mut localName_1 : Rc<RefCell<Token>> = self.expectBindingName();
              let _tmp_1 = localName_1.borrow().value.clone();
              spec_1.borrow_mut().value = _tmp_1;
            } else {
              let _tmp_1 = importedName_1.borrow().value.clone();
              spec_1.borrow_mut().value = _tmp_1;
            }
            let __arg_0 = spec_1.borrow().value.clone();
            self.declareBinding("l".to_string(), __arg_0);
            node.borrow_mut().children.push(spec_1.clone());
            if  self.matchValue(",".to_string()) {
              self.advance();
            }
          };
          self.expectValue("}".to_string());
        }
      }
    }
    if  self.matchValue("from".to_string()) {
      self.advance();
      let mut sourceStr : Rc<RefCell<Token>> = self.expect("String".to_string());
      let mut source : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      source.borrow_mut().nodeType = "StringLiteral".to_string();
      let _tmp_1 = sourceStr.borrow().value.clone();
      source.borrow_mut().value = _tmp_1;
      node.borrow_mut().left = Some(source.clone());
    } else {
      if  node.borrow().left.is_none() {
        self.syntaxError("Parse error: an import declaration needs a module specifier".to_string());
      }
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    node.clone()
  }
  fn registerExportedDeclaration(&mut self, mut decl : Rc<RefCell<TSNode>>) {
    if  decl.borrow().nodeType == "VariableDeclaration" {
      let mut i : i64 = 0;
      while i < (decl.borrow().children.len() as i64) {
        let mut d : Rc<RefCell<TSNode>> = decl.borrow().children[(i) as usize].clone();
        let __arg_0 = d.borrow().name.clone();
        self.registerExportName(__arg_0);
        i += 1;
      };
      return;
    }
    let __arg_0 = decl.borrow().name.clone();
    self.registerExportName(__arg_0);
  }
  fn registerExportName(&mut self, name : String) {
    if  (name.chars().count() as i64) == 0 {
      return;
    }
    if  TSParserSimple::isInStringList(name.clone(), &self.exportedNames) {
      self.syntaxError(format!("Parse error: duplicate export of '{}'", name));
    }
    self.exportedNames.push(name.clone());
  }
  fn parseExport(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ExportNamedDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("export".to_string());
    if  self.matchValue("type".to_string()) {
      let nextV : String = self.peekNextValue();
      if  nextV == "{" {
        self.advance();
        node.borrow_mut().kind = "type".to_string();
      }
    }
    let v : String = self.peekValue();
    if  v == "default" {
      node.borrow_mut().nodeType = "ExportDefaultDeclaration".to_string();
      self.registerExportName("default".to_string());
      self.advance();
      let nextVal : String = self.peekValue();
      if  ((nextVal == "class") || (nextVal == "function")) || (nextVal == "interface") {
        let savedExportDefault : bool = self.inExportDefault;
        self.inExportDefault = true;
        let mut decl : Rc<RefCell<TSNode>> = self.parseStatement();
        self.inExportDefault = savedExportDefault;
        node.borrow_mut().left = Some(decl.clone());
      } else {
        let mut expr : Rc<RefCell<TSNode>> = self.parseExpr();
        node.borrow_mut().left = Some(expr.clone());
      }
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return node.clone();
    }
    if  v == "{" {
      self.advance();
      let mut specifiers : Vec<Rc<RefCell<TSNode>>> = Vec::new();
      while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
        let mut spec : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        spec.borrow_mut().nodeType = "ExportSpecifier".to_string();
        let mut localName : Rc<RefCell<Token>> = self.expectModuleExportName();
        let _tmp_1 = localName.borrow().value.clone();
        spec.borrow_mut().name = _tmp_1;
        if  self.matchValue("as".to_string()) {
          self.advance();
          let mut exportedName : Rc<RefCell<Token>> = self.expectModuleExportName();
          let _tmp_1 = exportedName.borrow().value.clone();
          spec.borrow_mut().value = _tmp_1;
        } else {
          let _tmp_1 = localName.borrow().value.clone();
          spec.borrow_mut().value = _tmp_1;
        }
        let __arg_0 = spec.borrow().value.clone();
        self.registerExportName(__arg_0);
        self.pendingExportRefs.push(localName.borrow().value.clone());
        specifiers.push(spec.clone());
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      };
      self.expectValue("}".to_string());
      node.borrow_mut().children = specifiers.clone();
      if  self.matchValue("from".to_string()) {
        self.advance();
        let mut sourceStr : Rc<RefCell<Token>> = self.expect("String".to_string());
        let mut source : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        source.borrow_mut().nodeType = "StringLiteral".to_string();
        let _tmp_1 = sourceStr.borrow().value.clone();
        source.borrow_mut().value = _tmp_1;
        node.borrow_mut().left = Some(source.clone());
        let mut emptyRefs : Vec<String> = Vec::new();
        self.pendingExportRefs = emptyRefs.clone();
      }
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return node.clone();
    }
    if  v == "*" {
      node.borrow_mut().nodeType = "ExportAllDeclaration".to_string();
      self.advance();
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut exportName : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
        let _tmp_1 = exportName.borrow().value.clone();
        node.borrow_mut().name = _tmp_1;
      }
      self.expectValue("from".to_string());
      let mut sourceStr_1 : Rc<RefCell<Token>> = self.expect("String".to_string());
      let mut source_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      source_1.borrow_mut().nodeType = "StringLiteral".to_string();
      let _tmp_1 = sourceStr_1.borrow().value.clone();
      source_1.borrow_mut().value = _tmp_1;
      node.borrow_mut().left = Some(source_1.clone());
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return node.clone();
    }
    if  ((((((((v == "function") || (v == "class")) || (v == "interface")) || (v == "type")) || (v == "var")) || (v == "const")) || (v == "let")) || (v == "enum")) || (v == "abstract") {
      let mut decl_1 : Rc<RefCell<TSNode>> = self.parseStatement();
      if  (v == "function") || (v == "class") {
        if  (decl_1.borrow().name.chars().count() as i64) == 0 {
          self.syntaxError(format!("Parse error: an exported {} declaration needs a name", v));
        }
      }
      node.borrow_mut().left = Some(decl_1.clone());
      self.registerExportedDeclaration(decl_1.clone());
      return node.clone();
    }
    if  v == "async" {
      let mut decl_2 : Rc<RefCell<TSNode>> = self.parseStatement();
      node.borrow_mut().left = Some(decl_2.clone());
      self.registerExportedDeclaration(decl_2.clone());
      return node.clone();
    }
    self.syntaxError(format!("Parse error: '{}' cannot follow 'export'", v));
    node.clone()
  }
  fn parseInterface(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "TSInterfaceDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("interface".to_string());
    let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let _tmp_4 = nameTok.borrow().value.clone();
    node.borrow_mut().name = _tmp_4;
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<Rc<RefCell<TSNode>>> = self.parseTypeParams();
      node.borrow_mut().params = typeParams.clone();
    }
    if  self.matchValue("extends".to_string()) {
      self.advance();
      let mut extendsList : Vec<Rc<RefCell<TSNode>>> = Vec::new();
      let mut extendsType : Rc<RefCell<TSNode>> = self.parseType();
      extendsList.push(extendsType.clone());
      while self.matchValue(",".to_string()) {
        self.advance();
        let mut nextType : Rc<RefCell<TSNode>> = self.parseType();
        extendsList.push(nextType.clone());
      };
      for i in 0..extendsList.len() {
        let mut ext = extendsList[i].clone();
        let mut wrapper : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        wrapper.borrow_mut().nodeType = "TSExpressionWithTypeArguments".to_string();
        wrapper.borrow_mut().left = Some(ext.clone());
        node.borrow_mut().children.push(wrapper.clone());
      };
    }
    let mut body : Rc<RefCell<TSNode>> = self.parseInterfaceBody();
    node.borrow_mut().body = Some(body.clone());
    node.clone()
  }
  fn parseInterfaceBody(&mut self) -> Rc<RefCell<TSNode>> {
    let mut body : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    body.borrow_mut().nodeType = "TSInterfaceBody".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    body.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    body.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    body.borrow_mut().col = _tmp_3;
    self.expectValue("{".to_string());
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      let mut prop : Rc<RefCell<TSNode>> = self.parsePropertySig();
      body.borrow_mut().children.push(prop.clone());
      if  self.matchValue(";".to_string()) || self.matchValue(",".to_string()) {
        self.advance();
      }
    };
    self.expectValue("}".to_string());
    body.clone()
  }
  fn parseTypeParams(&mut self) -> Vec<Rc<RefCell<TSNode>>> {
    let mut params : Vec<Rc<RefCell<TSNode>>> = Vec::new();
    self.expectValue("<".to_string());
    while (!(self.matchValue(">".to_string()))) && (!(self.isAtEnd())) {
      if  (params.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      param.borrow_mut().nodeType = "TSTypeParameter".to_string();
      let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      let _tmp_1 = nameTok.borrow().value.clone();
      param.borrow_mut().name = _tmp_1;
      let _tmp_2 = nameTok.borrow().start;
      param.borrow_mut().start = _tmp_2;
      let _tmp_3 = nameTok.borrow().line;
      param.borrow_mut().line = _tmp_3;
      let _tmp_4 = nameTok.borrow().col;
      param.borrow_mut().col = _tmp_4;
      if  self.matchValue("extends".to_string()) {
        self.advance();
        let mut constraint : Rc<RefCell<TSNode>> = self.parseType();
        param.borrow_mut().typeAnnotation = Some(constraint.clone());
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut defaultType : Rc<RefCell<TSNode>> = self.parseType();
        param.borrow_mut().init = Some(defaultType.clone());
      }
      params.push(param.clone());
    };
    self.expectValue(">".to_string());
    params.clone()
  }
  fn parsePropertySig(&mut self) -> Rc<RefCell<TSNode>> {
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let startPos : i64 = startTok.borrow().start;
    let startLine : i64 = startTok.borrow().line;
    let startCol : i64 = startTok.borrow().col;
    let mut isReadonly : bool = false;
    if  self.matchValue("readonly".to_string()) {
      isReadonly = true;
      self.advance();
    }
    if  self.matchValue("[".to_string()) {
      self.advance();
      let mut paramTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      return self.parseIndexSignatureRest(isReadonly, paramTok.clone(), startPos, startLine, startCol).clone();
    }
    if  self.matchValue("(".to_string()) {
      return self.parseCallSignature(startPos, startLine, startCol).clone();
    }
    if  self.matchValue("new".to_string()) {
      return self.parseConstructSignature(startPos, startLine, startCol).clone();
    }
    let mut prop : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    prop.borrow_mut().nodeType = "TSPropertySignature".to_string();
    prop.borrow_mut().start = startPos;
    prop.borrow_mut().line = startLine;
    prop.borrow_mut().col = startCol;
    prop.borrow_mut().readonly = isReadonly;
    let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let _tmp_1 = nameTok.borrow().value.clone();
    prop.borrow_mut().name = _tmp_1;
    if  self.matchValue("?".to_string()) {
      prop.borrow_mut().optional = true;
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      prop.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
    }
    prop.clone()
  }
  fn parseCallSignature(&mut self, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<TSNode>> {
    let mut sig : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    sig.borrow_mut().nodeType = "TSCallSignatureDeclaration".to_string();
    sig.borrow_mut().start = startPos;
    sig.borrow_mut().line = startLine;
    sig.borrow_mut().col = startCol;
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<Rc<RefCell<TSNode>>> = self.parseTypeParams();
      sig.borrow_mut().params = typeParams.clone();
    }
    self.expectValue("(".to_string());
    while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
      if  (sig.borrow().children.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : Rc<RefCell<TSNode>> = self.parseParam();
      sig.borrow_mut().children.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      sig.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
    }
    sig.clone()
  }
  fn parseConstructSignature(&mut self, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<TSNode>> {
    let mut sig : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    sig.borrow_mut().nodeType = "TSConstructSignatureDeclaration".to_string();
    sig.borrow_mut().start = startPos;
    sig.borrow_mut().line = startLine;
    sig.borrow_mut().col = startCol;
    self.expectValue("new".to_string());
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<Rc<RefCell<TSNode>>> = self.parseTypeParams();
      sig.borrow_mut().params = typeParams.clone();
    }
    self.expectValue("(".to_string());
    while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
      if  (sig.borrow().children.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : Rc<RefCell<TSNode>> = self.parseParam();
      sig.borrow_mut().children.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      sig.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
    }
    sig.clone()
  }
  fn parseTypeAlias(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "TSTypeAliasDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("type".to_string());
    let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let _tmp_4 = nameTok.borrow().value.clone();
    node.borrow_mut().name = _tmp_4;
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<Rc<RefCell<TSNode>>> = self.parseTypeParams();
      node.borrow_mut().params = typeParams.clone();
    }
    self.expectValue("=".to_string());
    let mut typeExpr : Rc<RefCell<TSNode>> = self.parseType();
    node.borrow_mut().typeAnnotation = Some(typeExpr.clone());
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    node.clone()
  }
  fn parseDecorator(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "Decorator".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("@".to_string());
    let mut expr : Rc<RefCell<TSNode>> = self.parsePostfix();
    node.borrow_mut().left = Some(expr.clone());
    node.clone()
  }
  fn parseClass(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ClassDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    if  self.matchValue("abstract".to_string()) {
      node.borrow_mut().kind = "abstract".to_string();
      self.advance();
    }
    self.expectValue("class".to_string());
    let mut classNameFollows : bool = self.isNameToken();
    if  self.matchValue("extends".to_string()) {
      classNameFollows = false;
    }
    if  self.matchValue("implements".to_string()) {
      classNameFollows = false;
    }
    if  classNameFollows {
      let savedNameStrict : bool = self.strictMode;
      self.strictMode = true;
      let mut nameTok : Rc<RefCell<Token>> = self.expectBindingName();
      self.strictMode = savedNameStrict;
      let _tmp_1 = nameTok.borrow().value.clone();
      node.borrow_mut().name = _tmp_1;
      let __arg_0 = nameTok.borrow().value.clone();
      self.declareBinding("l".to_string(), __arg_0);
    }
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<Rc<RefCell<TSNode>>> = self.parseTypeParams();
      node.borrow_mut().params = typeParams.clone();
    }
    let savedDerived : bool = self.inDerivedClass;
    self.inDerivedClass = false;
    let savedClassStrictAll : bool = self.strictMode;
    self.strictMode = true;
    if  self.matchValue("extends".to_string()) {
      self.inDerivedClass = true;
      self.advance();
      let mut superClass : Rc<RefCell<TSNode>> = self.parsePostfix();
      let mut extendsNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      extendsNode.borrow_mut().nodeType = "TSExpressionWithTypeArguments".to_string();
      extendsNode.borrow_mut().left = Some(superClass.clone());
      node.borrow_mut().left = Some(extendsNode.clone());
    }
    if  self.matchValue("implements".to_string()) {
      self.advance();
      let mut r#impl : Rc<RefCell<TSNode>> = self.parseType();
      let mut implNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      implNode.borrow_mut().nodeType = "TSExpressionWithTypeArguments".to_string();
      implNode.borrow_mut().left = Some(r#impl.clone());
      node.borrow_mut().children.push(implNode.clone());
      while self.matchValue(",".to_string()) {
        self.advance();
        let mut nextImpl : Rc<RefCell<TSNode>> = self.parseType();
        let mut nextImplNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        nextImplNode.borrow_mut().nodeType = "TSExpressionWithTypeArguments".to_string();
        nextImplNode.borrow_mut().left = Some(nextImpl.clone());
        node.borrow_mut().children.push(nextImplNode.clone());
      };
    }
    let mut body : Rc<RefCell<TSNode>> = self.parseClassBody();
    node.borrow_mut().body = Some(body.clone());
    self.inDerivedClass = savedDerived;
    self.strictMode = savedClassStrictAll;
    node.clone()
  }
  fn parseClassBody(&mut self) -> Rc<RefCell<TSNode>> {
    let mut body : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    body.borrow_mut().nodeType = "ClassBody".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    body.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    body.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    body.borrow_mut().col = _tmp_3;
    self.expectValue("{".to_string());
    let savedClassStrict : bool = self.strictMode;
    self.strictMode = true;
    let mut sawConstructor : bool = false;
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      if  self.matchValue(";".to_string()) {
        self.advance();
      } else {
        let mut member : Rc<RefCell<TSNode>> = self.parseClassMember();
        if  !member.borrow().computed {
          let mut namesConstructor : bool = false;
          if  member.borrow().name == "constructor" {
            namesConstructor = true;
          }
          if  member.borrow().kind == "constructor" {
            namesConstructor = true;
          }
          if  namesConstructor {
            if  member.borrow().kind != "static" {
              if  member.borrow().nodeType == "MethodDefinition" {
                if  sawConstructor {
                  self.syntaxError("Parse error: a class may only have one constructor".to_string());
                }
                sawConstructor = true;
              }
            }
          }
          if  namesConstructor {
            if  member.borrow().kind != "static" {
              if  (member.borrow().kind == "get") || (member.borrow().kind == "set") {
                self.syntaxError("Parse error: a class constructor may not be an accessor".to_string());
              }
              if  member.borrow().generator {
                self.syntaxError("Parse error: a class constructor may not be a generator".to_string());
              }
            }
          }
          if  member.borrow().kind == "static" {
            if  member.borrow().name == "prototype" {
              self.syntaxError("Parse error: a static class member may not be named 'prototype'".to_string());
            }
          }
        }
        body.borrow_mut().children.push(member.clone());
        if  self.matchValue(";".to_string()) {
          self.advance();
        } else {
          if  member.borrow().nodeType == "PropertyDefinition" {
            if  !(self.matchValue("}".to_string())) {
              let mut nextMember : Rc<RefCell<Token>> = self.peek();
              if  nextMember.borrow().line == self.lastTokenLine {
                self.syntaxError("Parse error: missing ';' between class members".to_string());
              }
            }
          }
        }
      }
    };
    self.strictMode = savedClassStrict;
    self.expectValue("}".to_string());
    body.clone()
  }
  fn parseClassMember(&mut self) -> Rc<RefCell<TSNode>> {
    let mut member : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    member.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    member.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    member.borrow_mut().col = _tmp_3;
    let mut decorators : Vec<Rc<RefCell<TSNode>>> = Vec::new();
    while self.matchValue("@".to_string()) {
      let mut dec : Rc<RefCell<TSNode>> = self.parseDecorator();
      decorators.push(dec.clone());
    };
    if  (decorators.len() as i64) > 0 {
      member.borrow_mut().decorators = decorators.clone();
    }
    let mut isStatic : bool = false;
    let mut isAbstract : bool = false;
    let mut isReadonly : bool = false;
    let mut isAsync : bool = false;
    let mut accessibility : String = "".to_string();
    let mut keepParsing : bool = true;
    while keepParsing {
      let modifierStartPos : i64 = self.pos;
      let tokVal : String = self.peekValue();
      if  tokVal == "public" {
        accessibility = "public".to_string();
        self.advance();
      }
      if  tokVal == "private" {
        accessibility = "private".to_string();
        self.advance();
      }
      if  tokVal == "protected" {
        accessibility = "protected".to_string();
        self.advance();
      }
      if  tokVal == "static" {
        let afterStatic : String = self.peekNextValue();
        if  (((afterStatic != "(") && (afterStatic != "=")) && (afterStatic != ";")) && (afterStatic != "}") {
          isStatic = true;
          self.advance();
          if  self.matchValue("{".to_string()) {
            member.borrow_mut().nodeType = "StaticBlock".to_string();
            member.borrow_mut().body = Some(self.parseBlock().clone());
            let _tmp_1 = startTok.borrow().start;
            member.borrow_mut().start = _tmp_1;
            let _tmp_2 = startTok.borrow().line;
            member.borrow_mut().line = _tmp_2;
            let _tmp_3 = startTok.borrow().col;
            member.borrow_mut().col = _tmp_3;
            return member.clone();
          }
        }
      }
      if  tokVal == "abstract" {
        isAbstract = true;
        self.advance();
      }
      if  tokVal == "readonly" {
        isReadonly = true;
        self.advance();
      }
      if  tokVal == "async" {
        isAsync = true;
        self.advance();
      }
      let newTokVal : String = self.peekValue();
      if  ((((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly")) && (newTokVal != "async") {
        keepParsing = false;
      }
      if  newTokVal == "static" {
        if  isStatic {
          let afterRepeat : String = self.peekNextValue();
          if  (((afterRepeat != "(") && (afterRepeat != "=")) && (afterRepeat != ";")) && (afterRepeat != "}") {
            self.syntaxError("Parse error: 'static' may appear only once on a class member".to_string());
            keepParsing = false;
          }
        }
      }
      if  self.pos == modifierStartPos {
        keepParsing = false;
      }
    };
    if  self.matchValue("constructor".to_string()) && (!isStatic) {
      member.borrow_mut().nodeType = "MethodDefinition".to_string();
      member.borrow_mut().kind = "constructor".to_string();
      self.advance();
      self.pushScope(true);
      self.functionDepth += 1;
      let savedCtorRest : bool = self.sawRestParam;
      self.sawRestParam = false;
      let savedCtorSuperCall : bool = self.allowSuperCall;
      let savedCtorSuperProp : bool = self.allowSuperProperty;
      let savedctorIter : i64 = self.iterationDepth;
      let savedctorSwitch : i64 = self.switchDepth;
      let mut savedctorLabels : Vec<String> = self.activeLabels.clone();
      let mut savedctorIterLabels : Vec<String> = self.iterationLabels.clone();
      let mut freshctorLabels : Vec<String> = Vec::new();
      let mut freshctorIterLabels : Vec<String> = Vec::new();
      self.iterationDepth = 0;
      self.switchDepth = 0;
      self.activeLabels = freshctorLabels.clone();
      self.iterationLabels = freshctorIterLabels.clone();
      self.allowSuperCall = self.inDerivedClass;
      self.allowSuperProperty = true;
      self.expectValue("(".to_string());
      while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
        if  (member.borrow().params.len() as i64) > 0 {
          self.expectValue(",".to_string());
        }
        let mut param : Rc<RefCell<TSNode>> = self.parseConstructorParam();
        if  (param.borrow().name.chars().count() as i64) > 0 {
          let __arg_0 = param.borrow().name.clone();
          self.declareBinding("p".to_string(), __arg_0);
        }
        member.borrow_mut().params.push(param.clone());
      };
      self.expectValue(")".to_string());
      if  self.matchValue("{".to_string()) {
        self.suppressBlockScope = true;
        let mut bodyNode : Rc<RefCell<TSNode>> = self.parseBlock();
        member.borrow_mut().body = Some(bodyNode.clone());
        let _tmp_1 = bodyNode.borrow().end;
        member.borrow_mut().end = _tmp_1;
      }
      self.popScope();
      self.allowSuperCall = savedCtorSuperCall;
      self.allowSuperProperty = savedCtorSuperProp;
      self.sawRestParam = savedCtorRest;
      self.functionDepth -= 1;
      self.iterationDepth = savedctorIter;
      self.switchDepth = savedctorSwitch;
      self.activeLabels = savedctorLabels.clone();
      self.iterationLabels = savedctorIterLabels.clone();
      return member.clone();
    }
    let mut accessorKind : String = "".to_string();
    if  self.matchValue("get".to_string()) || self.matchValue("set".to_string()) {
      let accessorWord : String = self.peekValue();
      let afterAccessor : String = self.peekNextValue();
      let afterAccessorType : String = self.peekNextType();
      let mut looksLikeAccessor : bool = false;
      if  ((((afterAccessorType == "Identifier") || (afterAccessorType == "TSType")) || (afterAccessorType == "Keyword")) || (afterAccessorType == "String")) || (afterAccessorType == "Number") {
        looksLikeAccessor = true;
      }
      if  afterAccessor == "[" {
        looksLikeAccessor = true;
      }
      if  afterAccessor == "#" {
        looksLikeAccessor = true;
      }
      if  looksLikeAccessor {
        self.advance();
        accessorKind = accessorWord.clone();
      }
    }
    if  self.matchValue("*".to_string()) {
      self.advance();
      member.borrow_mut().generator = true;
    }
    if  self.matchValue("#".to_string()) {
      self.advance();
      member.borrow_mut().value = "#".to_string();
    }
    if  self.matchPunct("[".to_string()) {
      self.advance();
      let mut keyExpr : Rc<RefCell<TSNode>> = self.parseExpr();
      self.expectValue("]".to_string());
      member.borrow_mut().computed = true;
      member.borrow_mut().init = Some(keyExpr.clone());
    } else {
      let mut nameTok : Rc<RefCell<Token>> = self.peek();
      if  self.isMemberKeyToken() {
        self.advance();
      } else {
        let _tmp_1 = self.expect("Identifier".to_string());
        nameTok = _tmp_1;
      }
      let _tmp_1 = nameTok.borrow().value.clone();
      member.borrow_mut().name = _tmp_1;
    }
    if  !accessibility.is_empty() {
      member.borrow_mut().kind = accessibility.clone();
    }
    member.borrow_mut().readonly = isReadonly;
    if  self.matchValue("?".to_string()) {
      member.borrow_mut().optional = true;
      self.advance();
    }
    if  self.matchPunct("!".to_string()) {
      if  self.typeScriptMode {
        self.advance();
      }
    }
    if  self.matchValue("(".to_string()) {
      member.borrow_mut().nodeType = "MethodDefinition".to_string();
      if  isStatic {
        member.borrow_mut().kind = "static".to_string();
      }
      if  (accessorKind.chars().count() as i64) > 0 {
        if  !isStatic {
          member.borrow_mut().kind = accessorKind.clone();
        }
        member.borrow_mut().accessor = accessorKind.clone();
      }
      if  isAbstract {
        member.borrow_mut().kind = "abstract".to_string();
      }
      if  isAsync {
        member.borrow_mut().r#async = true;
      }
      self.pushScope(true);
      let savedMethodRest : bool = self.sawRestParam;
      self.sawRestParam = false;
      let savedMethodGenerator : bool = self.inGenerator;
      self.inGenerator = member.borrow().generator;
      let savedMethodSuperCall : bool = self.allowSuperCall;
      let savedMethodSuperProp : bool = self.allowSuperProperty;
      let savedmethIter : i64 = self.iterationDepth;
      let savedmethSwitch : i64 = self.switchDepth;
      let mut savedmethLabels : Vec<String> = self.activeLabels.clone();
      let mut savedmethIterLabels : Vec<String> = self.iterationLabels.clone();
      let mut freshmethLabels : Vec<String> = Vec::new();
      let mut freshmethIterLabels : Vec<String> = Vec::new();
      self.iterationDepth = 0;
      self.switchDepth = 0;
      self.activeLabels = freshmethLabels.clone();
      self.iterationLabels = freshmethIterLabels.clone();
      self.functionDepth += 1;
      let mut isCtorNamed : bool = false;
      if  member.borrow().name == "constructor" {
        if  !isStatic {
          if  !member.borrow().computed {
            isCtorNamed = true;
          }
        }
      }
      if  isCtorNamed {
        self.allowSuperCall = self.inDerivedClass;
      } else {
        self.allowSuperCall = false;
      }
      self.allowSuperProperty = true;
      self.expectValue("(".to_string());
      while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
        if  (member.borrow().params.len() as i64) > 0 {
          self.expectValue(",".to_string());
        }
        let mut param_1 : Rc<RefCell<TSNode>> = self.parseParam();
        if  (param_1.borrow().name.chars().count() as i64) > 0 {
          let __arg_0 = param_1.borrow().name.clone();
          self.declareBinding("p".to_string(), __arg_0);
        }
        member.borrow_mut().params.push(param_1.clone());
      };
      self.expectValue(")".to_string());
      if  accessorKind == "get" {
        if  (member.borrow().params.len() as i64) != 0 {
          self.syntaxError("Parse error: a getter takes no parameters".to_string());
        }
      }
      if  accessorKind == "set" {
        if  (member.borrow().params.len() as i64) != 1 {
          self.syntaxError("Parse error: a setter takes exactly one parameter".to_string());
        } else {
          let mut setP : Rc<RefCell<TSNode>> = member.borrow().params[0].clone();
          if  setP.borrow().nodeType == "RestElement" {
            self.syntaxError("Parse error: a setter parameter may not be a rest element".to_string());
          }
        }
      }
      if  self.matchValue(":".to_string()) {
        let mut returnType : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        member.borrow_mut().typeAnnotation = Some(returnType.clone());
      }
      if  self.matchValue("{".to_string()) {
        self.suppressBlockScope = true;
        let mut bodyNode_1 : Rc<RefCell<TSNode>> = self.parseBlock();
        member.borrow_mut().body = Some(bodyNode_1.clone());
        let _tmp_1 = bodyNode_1.borrow().end;
        member.borrow_mut().end = _tmp_1;
        if  self.lastBlockEnabledStrict {
          let __arg_0 = member.borrow().name.clone();
          let __arg_1 = member.borrow().params.clone();
          self.recheckStrictSignature(__arg_0, &__arg_1);
        }
      }
      self.popScope();
      self.allowSuperCall = savedMethodSuperCall;
      self.allowSuperProperty = savedMethodSuperProp;
      self.inGenerator = savedMethodGenerator;
      self.sawRestParam = savedMethodRest;
      self.functionDepth -= 1;
      self.iterationDepth = savedmethIter;
      self.switchDepth = savedmethSwitch;
      self.activeLabels = savedmethLabels.clone();
      self.iterationLabels = savedmethIterLabels.clone();
    } else {
      member.borrow_mut().nodeType = "PropertyDefinition".to_string();
      if  self.ecmaVersion < 2022 {
        if  !self.typeScriptMode {
          self.syntaxError("Parse error: class fields need ES2022".to_string());
        }
      }
      if  isStatic {
        member.borrow_mut().kind = "static".to_string();
      }
      if  self.matchValue(":".to_string()) {
        if  !self.typeScriptMode {
          self.syntaxError("Parse error: a class field cannot carry a type annotation in JavaScript".to_string());
        }
        let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        member.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : Rc<RefCell<TSNode>> = self.parseExprSeq();
        member.borrow_mut().init = Some(initExpr.clone());
      }
    }
    member.clone()
  }
  fn parseConstructorParam(&mut self) -> Rc<RefCell<TSNode>> {
    let mut param : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    param.borrow_mut().nodeType = "Parameter".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    param.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    param.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    param.borrow_mut().col = _tmp_3;
    let tokVal : String = self.peekValue();
    if  (((tokVal == "public") || (tokVal == "private")) || (tokVal == "protected")) || (tokVal == "readonly") {
      param.borrow_mut().kind = tokVal.clone();
      self.advance();
      let nextVal : String = self.peekValue();
      if  nextVal == "readonly" {
        param.borrow_mut().readonly = true;
        self.advance();
      }
    }
    if  self.matchValue("...".to_string()) {
      self.advance();
      param.borrow_mut().nodeType = "RestElement".to_string();
      param.borrow_mut().kind = "rest".to_string();
      if  self.sawRestParam {
        self.syntaxError("Parse error: a rest element must be the last parameter".to_string());
      }
      self.sawRestParam = true;
      self.restParamPending = true;
    }
    if  self.matchValue("{".to_string()) || self.matchValue("[".to_string()) {
      let mut ctorPattern : Rc<RefCell<TSNode>> = self.parseBindingTarget();
      if  self.matchValue(":".to_string()) {
        let mut ctorPatType : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        ctorPattern.borrow_mut().typeAnnotation = Some(ctorPatType.clone());
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut ctorDefault : Rc<RefCell<TSNode>> = self.parseExpr();
        let mut ctorAssign : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        ctorAssign.borrow_mut().nodeType = "AssignmentPattern".to_string();
        ctorAssign.borrow_mut().left = Some(ctorPattern.clone());
        ctorAssign.borrow_mut().right = Some(ctorDefault.clone());
        return ctorAssign.clone();
      }
      return ctorPattern.clone();
    }
    let mut nameTok : Rc<RefCell<Token>> = self.expectBindingName();
    let _tmp_4 = nameTok.borrow().value.clone();
    param.borrow_mut().name = _tmp_4;
    if  self.restParamPending {
      self.restParamPending = false;
      if  self.matchValue("=".to_string()) {
        self.syntaxError("Parse error: a rest parameter may not have a default".to_string());
      }
    }
    if  self.matchValue("?".to_string()) {
      param.borrow_mut().optional = true;
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      param.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
    }
    if  self.matchValue("=".to_string()) {
      self.advance();
      let mut defaultVal : Rc<RefCell<TSNode>> = self.parseExpr();
      param.borrow_mut().init = Some(defaultVal.clone());
    }
    param.clone()
  }
  fn parseEnum(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "TSEnumDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    if  self.matchValue("const".to_string()) {
      node.borrow_mut().kind = "const".to_string();
      self.advance();
    }
    self.expectValue("enum".to_string());
    let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let _tmp_4 = nameTok.borrow().value.clone();
    node.borrow_mut().name = _tmp_4;
    self.expectValue("{".to_string());
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      let mut member : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      member.borrow_mut().nodeType = "TSEnumMember".to_string();
      let mut memberTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      let _tmp_1 = memberTok.borrow().value.clone();
      member.borrow_mut().name = _tmp_1;
      let _tmp_2 = memberTok.borrow().start;
      member.borrow_mut().start = _tmp_2;
      let _tmp_3 = memberTok.borrow().line;
      member.borrow_mut().line = _tmp_3;
      let _tmp_4 = memberTok.borrow().col;
      member.borrow_mut().col = _tmp_4;
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initVal : Rc<RefCell<TSNode>> = self.parseExpr();
        member.borrow_mut().init = Some(initVal.clone());
      }
      node.borrow_mut().children.push(member.clone());
      if  self.matchValue(",".to_string()) {
        self.advance();
      }
    };
    self.expectValue("}".to_string());
    node.clone()
  }
  fn parseNamespace(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "TSModuleDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("namespace".to_string());
    let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let _tmp_4 = nameTok.borrow().value.clone();
    node.borrow_mut().name = _tmp_4;
    self.expectValue("{".to_string());
    let mut body : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    body.borrow_mut().nodeType = "TSModuleBlock".to_string();
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      let beforePos : i64 = self.pos;
      let mut stmt : Rc<RefCell<TSNode>> = self.parseStatement();
      body.borrow_mut().children.push(stmt.clone());
      self.guardNoProgress(beforePos);
    };
    self.expectValue("}".to_string());
    node.borrow_mut().body = Some(body.clone());
    node.clone()
  }
  fn parseDeclare(&mut self) -> Rc<RefCell<TSNode>> {
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    self.expectValue("declare".to_string());
    let nextVal : String = self.peekValue();
    if  nextVal == "module" {
      let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node.borrow_mut().nodeType = "TSModuleDeclaration".to_string();
      let _tmp_1 = startTok.borrow().start;
      node.borrow_mut().start = _tmp_1;
      let _tmp_2 = startTok.borrow().line;
      node.borrow_mut().line = _tmp_2;
      let _tmp_3 = startTok.borrow().col;
      node.borrow_mut().col = _tmp_3;
      node.borrow_mut().kind = "declare".to_string();
      self.advance();
      let mut nameTok : Rc<RefCell<Token>> = self.peek();
      if  self.matchType("String".to_string()) {
        self.advance();
        let _tmp_1 = nameTok.borrow().value.clone();
        node.borrow_mut().name = _tmp_1;
      } else {
        self.advance();
        let _tmp_1 = nameTok.borrow().value.clone();
        node.borrow_mut().name = _tmp_1;
      }
      self.expectValue("{".to_string());
      let mut body : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      body.borrow_mut().nodeType = "TSModuleBlock".to_string();
      while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
        let beforePos : i64 = self.pos;
        let mut stmt : Rc<RefCell<TSNode>> = self.parseStatement();
        body.borrow_mut().children.push(stmt.clone());
        self.guardNoProgress(beforePos);
      };
      self.expectValue("}".to_string());
      node.borrow_mut().body = Some(body.clone());
      return node.clone();
    }
    let mut node_1 : Rc<RefCell<TSNode>> = self.parseStatement();
    node_1.borrow_mut().kind = "declare".to_string();
    node_1.clone()
  }
  fn parseIfStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "IfStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("if".to_string());
    self.expectValue("(".to_string());
    let mut test : Rc<RefCell<TSNode>> = self.parseExpr();
    node.borrow_mut().left = Some(test.clone());
    self.expectValue(")".to_string());
    let savedConsBody : bool = self.inSingleStatementBody;
    let savedConsIf : bool = self.singleBodyIsIfBranch;
    self.inSingleStatementBody = true;
    self.atModuleTopLevel = false;
    self.singleBodyIsIfBranch = true;
    self.atModuleTopLevel = false;
    let mut consequent : Rc<RefCell<TSNode>> = self.parseStatement();
    self.inSingleStatementBody = savedConsBody;
    self.singleBodyIsIfBranch = savedConsIf;
    node.borrow_mut().body = Some(consequent.clone());
    if  self.matchValue("else".to_string()) {
      self.advance();
      let savedAltBody : bool = self.inSingleStatementBody;
      let savedAltIf : bool = self.singleBodyIsIfBranch;
      self.inSingleStatementBody = true;
      self.atModuleTopLevel = false;
      self.singleBodyIsIfBranch = true;
      let mut alternate : Rc<RefCell<TSNode>> = self.parseStatement();
      self.inSingleStatementBody = savedAltBody;
      self.singleBodyIsIfBranch = savedAltIf;
      node.borrow_mut().right = Some(alternate.clone());
    }
    node.clone()
  }
  fn parseWhileStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "WhileStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : Rc<RefCell<TSNode>> = self.parseExpr();
    node.borrow_mut().left = Some(test.clone());
    self.expectValue(")".to_string());
    let savedBodyFlag0 : bool = self.inSingleStatementBody;
    self.inSingleStatementBody = true;
    self.atModuleTopLevel = false;
    self.iterationDepth += 1;
    let mut body : Rc<RefCell<TSNode>> = self.parseStatement();
    self.iterationDepth -= 1;
    self.inSingleStatementBody = savedBodyFlag0;
    node.borrow_mut().body = Some(body.clone());
    node.clone()
  }
  fn parseDoWhileStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "DoWhileStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("do".to_string());
    let savedBodyFlag1 : bool = self.inSingleStatementBody;
    self.inSingleStatementBody = true;
    self.atModuleTopLevel = false;
    self.iterationDepth += 1;
    let mut body : Rc<RefCell<TSNode>> = self.parseStatement();
    self.iterationDepth -= 1;
    self.inSingleStatementBody = savedBodyFlag1;
    node.borrow_mut().body = Some(body.clone());
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : Rc<RefCell<TSNode>> = self.parseExpr();
    node.borrow_mut().left = Some(test.clone());
    self.expectValue(")".to_string());
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    node.clone()
  }
  fn parseThrow(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ThrowStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("throw".to_string());
    let mut throwArgTok : Rc<RefCell<Token>> = self.peek();
    if  throwArgTok.borrow().line != self.lastTokenLine {
      self.syntaxError("Parse error: no line terminator is allowed after 'throw'".to_string());
    }
    if  (self.isAtEnd() || (throwArgTok.borrow().value == ";")) || (throwArgTok.borrow().value == "}") {
      self.syntaxError("Parse error: 'throw' requires an argument".to_string());
    }
    let mut arg : Rc<RefCell<TSNode>> = self.parseExpr();
    node.borrow_mut().left = Some(arg.clone());
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    node.clone()
  }
  fn containsInOperator(&self, mut node : Rc<RefCell<TSNode>>) -> bool {
    if  node.borrow().nodeType == "BinaryExpression" {
      if  node.borrow().value == "in" {
        return true;
      }
    }
    let mut i : i64 = 0;
    while i < (node.borrow().children.len() as i64) {
      let mut c : Rc<RefCell<TSNode>> = node.borrow().children[(i) as usize].clone();
      if  self.containsInOperator(c.clone()) {
        return true;
      }
      i += 1;
    };
    false
  }
  fn parseForStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("for".to_string());
    let mut isAwait : bool = false;
    if  self.matchValue("await".to_string()) {
      self.advance();
      isAwait = true;
    }
    self.expectValue("(".to_string());
    self.pushScope(false);
    let tokVal : String = self.peekValue();
    let mut headIsDecl : bool = true;
    if  tokVal == "let" {
      let afterLet : String = self.peekNextValue();
      if  (((((afterLet == "in") || (afterLet == "of")) || (afterLet == "=")) || (afterLet == ";")) || (afterLet == ".")) || (afterLet == "(") {
        headIsDecl = false;
      }
    }
    if  (((tokVal == "let") || (tokVal == "const")) || (tokVal == "var")) && headIsDecl {
      let kind : String = tokVal.clone();
      self.advance();
      let mut headDeclKind : String = "v".to_string();
      if  kind == "let" {
        headDeclKind = "l".to_string();
      }
      if  kind == "const" {
        headDeclKind = "l".to_string();
      }
      let savedHeadDeclaring : String = self.declaringKind.clone();
      self.declaringKind = headDeclKind.clone();
      let mut hasPattern : bool = false;
      let mut patternNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      let mut varNameStr : String = "".to_string();
      let bindTokVal : String = self.peekValue();
      if  bindTokVal == "[" {
        hasPattern = true;
        let _tmp_1 = self.parseArrayPattern();
        patternNode = _tmp_1;
      } else {
        if  bindTokVal == "{" {
          hasPattern = true;
          let _tmp_1 = self.parseObjectPattern();
          patternNode = _tmp_1;
        } else {
          let mut vt : Rc<RefCell<Token>> = self.expectBindingName();
          varNameStr = vt.borrow().value.clone();
          if  headDeclKind == "l" {
            if  vt.borrow().value == "let" {
              self.syntaxError("Parse error: 'let' cannot be the name of a lexical binding".to_string());
            }
          }
          let __arg_0 = vt.borrow().value.clone();
          self.declareBinding(headDeclKind.clone(), __arg_0);
        }
      }
      self.declaringKind = savedHeadDeclaring.clone();
      let nextVal : String = self.peekValue();
      if  nextVal == "of" {
        if  (varNameStr.chars().count() as i64) > 0 {
          if  self.isParameterInScope(varNameStr.clone()) {
            self.syntaxError(format!("Parse error: '{}' shadows a parameter in a for-of head", varNameStr));
          }
        }
        node.borrow_mut().nodeType = "ForOfStatement".to_string();
        node.borrow_mut().r#await = isAwait;
        self.advance();
        let mut left : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        left.borrow_mut().nodeType = "VariableDeclaration".to_string();
        left.borrow_mut().kind = kind.clone();
        let mut declarator : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        declarator.borrow_mut().nodeType = "VariableDeclarator".to_string();
        if  hasPattern {
          declarator.borrow_mut().left = Some(patternNode.clone());
        } else {
          declarator.borrow_mut().name = varNameStr.clone();
        }
        left.borrow_mut().children.push(declarator.clone());
        node.borrow_mut().left = Some(left.clone());
        let mut right : Rc<RefCell<TSNode>> = self.parseExpr();
        node.borrow_mut().right = Some(right.clone());
        self.expectValue(")".to_string());
        let savedBodyFlag2 : bool = self.inSingleStatementBody;
        self.inSingleStatementBody = true;
        self.atModuleTopLevel = false;
        self.iterationDepth += 1;
        let mut body : Rc<RefCell<TSNode>> = self.parseStatement();
        self.iterationDepth -= 1;
        self.inSingleStatementBody = savedBodyFlag2;
        node.borrow_mut().body = Some(body.clone());
        self.popScope();
        return node.clone();
      }
      if  nextVal == "in" {
        if  (varNameStr.chars().count() as i64) > 0 {
          if  self.isParameterInScope(varNameStr.clone()) {
            self.syntaxError(format!("Parse error: '{}' shadows a parameter in a for-in head", varNameStr));
          }
        }
        node.borrow_mut().nodeType = "ForInStatement".to_string();
        self.advance();
        let mut left_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        left_1.borrow_mut().nodeType = "VariableDeclaration".to_string();
        left_1.borrow_mut().kind = kind.clone();
        let mut declarator_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        declarator_1.borrow_mut().nodeType = "VariableDeclarator".to_string();
        if  hasPattern {
          declarator_1.borrow_mut().left = Some(patternNode.clone());
        } else {
          declarator_1.borrow_mut().name = varNameStr.clone();
        }
        left_1.borrow_mut().children.push(declarator_1.clone());
        node.borrow_mut().left = Some(left_1.clone());
        let mut right_1 : Rc<RefCell<TSNode>> = self.parseExpr();
        node.borrow_mut().right = Some(right_1.clone());
        self.expectValue(")".to_string());
        let savedBodyFlag3 : bool = self.inSingleStatementBody;
        self.inSingleStatementBody = true;
        self.atModuleTopLevel = false;
        self.iterationDepth += 1;
        let mut body_1 : Rc<RefCell<TSNode>> = self.parseStatement();
        self.iterationDepth -= 1;
        self.inSingleStatementBody = savedBodyFlag3;
        node.borrow_mut().body = Some(body_1.clone());
        self.popScope();
        return node.clone();
      }
      node.borrow_mut().nodeType = "ForStatement".to_string();
      let mut initDecl : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      initDecl.borrow_mut().nodeType = "VariableDeclaration".to_string();
      initDecl.borrow_mut().kind = kind.clone();
      let mut declarator_2 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      declarator_2.borrow_mut().nodeType = "VariableDeclarator".to_string();
      if  hasPattern {
        declarator_2.borrow_mut().left = Some(patternNode.clone());
      } else {
        declarator_2.borrow_mut().name = varNameStr.clone();
      }
      if  self.matchValue(":".to_string()) {
        let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        declarator_2.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initVal : Rc<RefCell<TSNode>> = self.parseExpr();
        declarator_2.borrow_mut().init = Some(initVal.clone());
      } else {
        if  kind == "const" {
          self.syntaxError("Parse error: a 'const' declaration must have an initializer".to_string());
        }
      }
      initDecl.borrow_mut().children.push(declarator_2.clone());
      while self.matchValue(",".to_string()) {
        self.advance();
        let mut more : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        more.borrow_mut().nodeType = "VariableDeclarator".to_string();
        let savedMoreDeclaring : String = self.declaringKind.clone();
        self.declaringKind = headDeclKind.clone();
        let mut moreTarget : Rc<RefCell<TSNode>> = self.parseBindingTarget();
        self.declaringKind = savedMoreDeclaring.clone();
        if  moreTarget.borrow().nodeType == "Identifier" {
          let _tmp_1 = moreTarget.borrow().name.clone();
          more.borrow_mut().name = _tmp_1;
        } else {
          more.borrow_mut().left = Some(moreTarget.clone());
        }
        if  self.matchValue(":".to_string()) {
          let mut moreType : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
          more.borrow_mut().typeAnnotation = Some(moreType.clone());
        }
        if  self.matchValue("=".to_string()) {
          self.advance();
          let mut moreInit : Rc<RefCell<TSNode>> = self.parseExpr();
          more.borrow_mut().init = Some(moreInit.clone());
        } else {
          if  kind == "const" {
            self.syntaxError("Parse error: a 'const' declaration must have an initializer".to_string());
          }
        }
        initDecl.borrow_mut().children.push(more.clone());
      };
      node.borrow_mut().init = Some(initDecl.clone());
    } else {
      node.borrow_mut().nodeType = "ForStatement".to_string();
      if  !(self.matchValue(";".to_string())) {
        let mut initExpr : Rc<RefCell<TSNode>> = self.parseExpr();
        if  self.matchValue("of".to_string()) {
          node.borrow_mut().nodeType = "ForOfStatement".to_string();
          node.borrow_mut().r#await = isAwait;
          if  tokVal == "let" {
            self.syntaxError("Parse error: a for-of head may not start with 'let'".to_string());
          }
          self.checkAssignmentTarget(initExpr.clone());
          self.advance();
          node.borrow_mut().left = Some(initExpr.clone());
          let mut ofRight : Rc<RefCell<TSNode>> = self.parseExpr();
          node.borrow_mut().right = Some(ofRight.clone());
          self.expectValue(")".to_string());
          let savedBodyFlag4 : bool = self.inSingleStatementBody;
          self.inSingleStatementBody = true;
          self.atModuleTopLevel = false;
          self.iterationDepth += 1;
          let mut ofBody : Rc<RefCell<TSNode>> = self.parseStatement();
          self.iterationDepth -= 1;
          self.inSingleStatementBody = savedBodyFlag4;
          node.borrow_mut().body = Some(ofBody.clone());
          self.popScope();
          return node.clone();
        }
        if  initExpr.borrow().nodeType == "BinaryExpression" {
          if  initExpr.borrow().value == "in" {
            if  self.matchValue(")".to_string()) {
              node.borrow_mut().nodeType = "ForInStatement".to_string();
              if  initExpr.borrow().parenthesized {
                self.syntaxError("Parse error: the 'in' operator is not allowed in a for-initialiser".to_string());
              }
              let mut inLeft : Rc<RefCell<TSNode>> = initExpr.borrow().left.clone().unwrap();
              self.checkAssignmentTarget(inLeft.clone());
              node.borrow_mut().left = Some(inLeft.clone());
              node.borrow_mut().right = Some(initExpr.borrow().right.clone().unwrap().clone());
              self.expectValue(")".to_string());
              let savedBodyFlag5 : bool = self.inSingleStatementBody;
              self.inSingleStatementBody = true;
              self.atModuleTopLevel = false;
              self.iterationDepth += 1;
              let mut inBody : Rc<RefCell<TSNode>> = self.parseStatement();
              self.iterationDepth -= 1;
              self.inSingleStatementBody = savedBodyFlag5;
              node.borrow_mut().body = Some(inBody.clone());
              self.popScope();
              return node.clone();
            }
          }
        }
        if  self.containsInOperator(initExpr.clone()) {
          self.syntaxError("Parse error: the 'in' operator is not allowed in a for-initialiser".to_string());
        }
        if  self.matchValue(",".to_string()) {
          let mut seq : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          seq.borrow_mut().nodeType = "SequenceExpression".to_string();
          let _tmp_1 = initExpr.borrow().start;
          seq.borrow_mut().start = _tmp_1;
          let _tmp_2 = initExpr.borrow().line;
          seq.borrow_mut().line = _tmp_2;
          let _tmp_3 = initExpr.borrow().col;
          seq.borrow_mut().col = _tmp_3;
          seq.borrow_mut().children.push(initExpr.clone());
          while self.matchValue(",".to_string()) {
            self.advance();
            let mut more_1 : Rc<RefCell<TSNode>> = self.parseExpr();
            seq.borrow_mut().children.push(more_1.clone());
          };
          node.borrow_mut().init = Some(seq.clone());
        } else {
          node.borrow_mut().init = Some(initExpr.clone());
        }
      }
    }
    self.expectValue(";".to_string());
    if  !(self.matchValue(";".to_string())) {
      let mut test : Rc<RefCell<TSNode>> = self.parseExprSeq();
      node.borrow_mut().left = Some(test.clone());
    }
    self.expectValue(";".to_string());
    if  !(self.matchValue(")".to_string())) {
      let mut update : Rc<RefCell<TSNode>> = self.parseExprSeq();
      node.borrow_mut().right = Some(update.clone());
    }
    self.expectValue(")".to_string());
    let savedBodyFlag6 : bool = self.inSingleStatementBody;
    self.inSingleStatementBody = true;
    self.atModuleTopLevel = false;
    self.iterationDepth += 1;
    let mut body_2 : Rc<RefCell<TSNode>> = self.parseStatement();
    self.iterationDepth -= 1;
    self.inSingleStatementBody = savedBodyFlag6;
    node.borrow_mut().body = Some(body_2.clone());
    self.popScope();
    node.clone()
  }
  fn parseSwitchStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "SwitchStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("switch".to_string());
    self.expectValue("(".to_string());
    let mut discriminant : Rc<RefCell<TSNode>> = self.parseExpr();
    node.borrow_mut().left = Some(discriminant.clone());
    self.expectValue(")".to_string());
    self.expectValue("{".to_string());
    self.switchDepth += 1;
    let mut sawDefaultClause : bool = false;
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      let mut caseNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      if  self.matchValue("default".to_string()) {
        if  sawDefaultClause {
          self.syntaxError("Parse error: a switch may have only one default clause".to_string());
        }
        sawDefaultClause = true;
      }
      if  self.matchValue("case".to_string()) {
        caseNode.borrow_mut().nodeType = "SwitchCase".to_string();
        self.advance();
        let mut test : Rc<RefCell<TSNode>> = self.parseExpr();
        caseNode.borrow_mut().left = Some(test.clone());
        self.expectValue(":".to_string());
      }
      if  self.matchValue("default".to_string()) {
        caseNode.borrow_mut().nodeType = "SwitchCase".to_string();
        caseNode.borrow_mut().kind = "default".to_string();
        self.advance();
        self.expectValue(":".to_string());
      }
      while (((!(self.matchValue("case".to_string()))) && (!(self.matchValue("default".to_string())))) && (!(self.matchValue("}".to_string())))) && (!(self.isAtEnd())) {
        let beforePos : i64 = self.pos;
        let mut stmt : Rc<RefCell<TSNode>> = self.parseStatement();
        caseNode.borrow_mut().children.push(stmt.clone());
        self.guardNoProgress(beforePos);
      };
      node.borrow_mut().children.push(caseNode.clone());
    };
    self.switchDepth -= 1;
    self.expectValue("}".to_string());
    node.clone()
  }
  fn parseTryStatement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "TryStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("try".to_string());
    let mut tryBlock : Rc<RefCell<TSNode>> = self.parseBlock();
    node.borrow_mut().body = Some(tryBlock.clone());
    if  self.matchValue("catch".to_string()) {
      let mut catchNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      catchNode.borrow_mut().nodeType = "CatchClause".to_string();
      self.advance();
      self.pushScope(false);
      if  self.matchValue("(".to_string()) {
        self.advance();
        let savedCatchDeclaring : String = self.declaringKind.clone();
        self.declaringKind = "p".to_string();
        let mut param : Rc<RefCell<TSNode>> = self.parseBindingTarget();
        self.declaringKind = savedCatchDeclaring.clone();
        let _tmp_1 = param.borrow().name.clone();
        catchNode.borrow_mut().name = _tmp_1;
        catchNode.borrow_mut().left = Some(param.clone());
        if  self.matchValue(":".to_string()) {
          let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
          catchNode.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
        }
        self.expectValue(")".to_string());
      }
      self.suppressBlockScope = true;
      let mut catchBlock : Rc<RefCell<TSNode>> = self.parseBlock();
      catchNode.borrow_mut().body = Some(catchBlock.clone());
      self.popScope();
      node.borrow_mut().left = Some(catchNode.clone());
    }
    let mut sawHandler : bool = false;
    if  !(node.borrow().left.is_none()) {
      sawHandler = true;
    }
    if  self.matchValue("finally".to_string()) {
      self.advance();
      let mut finallyBlock : Rc<RefCell<TSNode>> = self.parseBlock();
      node.borrow_mut().right = Some(finallyBlock.clone());
      sawHandler = true;
    }
    if  !sawHandler {
      self.syntaxError("Parse error: 'try' requires a catch or a finally clause".to_string());
    }
    node.clone()
  }
  fn parseVarDecl(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "VariableDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    let _tmp_4 = startTok.borrow().value.clone();
    node.borrow_mut().kind = _tmp_4;
    self.advance();
    let mut moreDecls : bool = true;
    while moreDecls {
      let mut declarator : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      declarator.borrow_mut().nodeType = "VariableDeclarator".to_string();
      let nextVal : String = self.peekValue();
      let mut declKind : String = "v".to_string();
      if  node.borrow().kind == "let" {
        declKind = "l".to_string();
      }
      if  node.borrow().kind == "const" {
        declKind = "l".to_string();
      }
      let savedVarDeclaring : String = self.declaringKind.clone();
      self.declaringKind = declKind.clone();
      let savedVarMemberTarget : bool = self.patternAllowsMemberTarget;
      self.patternAllowsMemberTarget = false;
      if  nextVal == "{" {
        let mut pattern : Rc<RefCell<TSNode>> = self.parseObjectPattern();
        declarator.borrow_mut().left = Some(pattern.clone());
        let _tmp_1 = pattern.borrow().start;
        declarator.borrow_mut().start = _tmp_1;
        let _tmp_2 = pattern.borrow().line;
        declarator.borrow_mut().line = _tmp_2;
        let _tmp_3 = pattern.borrow().col;
        declarator.borrow_mut().col = _tmp_3;
      } else {
        if  nextVal == "[" {
          let mut pattern_1 : Rc<RefCell<TSNode>> = self.parseArrayPattern();
          declarator.borrow_mut().left = Some(pattern_1.clone());
          let _tmp_1 = pattern_1.borrow().start;
          declarator.borrow_mut().start = _tmp_1;
          let _tmp_2 = pattern_1.borrow().line;
          declarator.borrow_mut().line = _tmp_2;
          let _tmp_3 = pattern_1.borrow().col;
          declarator.borrow_mut().col = _tmp_3;
        } else {
          let mut nameTok : Rc<RefCell<Token>> = self.expectBindingName();
          let _tmp_1 = nameTok.borrow().value.clone();
          declarator.borrow_mut().name = _tmp_1;
          let _tmp_2 = nameTok.borrow().start;
          declarator.borrow_mut().start = _tmp_2;
          let _tmp_3 = nameTok.borrow().line;
          declarator.borrow_mut().line = _tmp_3;
          let _tmp_4 = nameTok.borrow().col;
          declarator.borrow_mut().col = _tmp_4;
          let __arg_0 = nameTok.borrow().value.clone();
          self.declareBinding(declKind.clone(), __arg_0);
        }
      }
      self.declaringKind = savedVarDeclaring.clone();
      self.patternAllowsMemberTarget = savedVarMemberTarget;
      if  self.matchValue(":".to_string()) {
        let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        declarator.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : Rc<RefCell<TSNode>> = self.parseExpr();
        declarator.borrow_mut().init = Some(initExpr.clone());
      }
      if  declarator.borrow().init.is_none() {
        if declarator.borrow().left.is_some() {
          if  declarator.borrow().typeAnnotation.is_none() {
            self.syntaxError("Parse error: a destructuring declaration must have an initializer".to_string());
          }
        }
      }
      if  node.borrow().kind == "const" {
        if  declarator.borrow().init.is_none() {
          if  declarator.borrow().typeAnnotation.is_none() {
            self.syntaxError("Parse error: a 'const' declaration must have an initializer".to_string());
          }
        }
      }
      node.borrow_mut().children.push(declarator.clone());
      if  self.matchValue(",".to_string()) {
        self.advance();
      } else {
        moreDecls = false;
      }
    };
    if  self.matchValue(";".to_string()) {
      self.advance();
    } else {
      if  !(self.isAtEnd()) {
        let mut afterDecl : Rc<RefCell<Token>> = self.peek();
        if  afterDecl.borrow().value != "}" {
          if  afterDecl.borrow().line == self.lastTokenLine {
            self.syntaxError("Parse error: missing ';' after a declaration".to_string());
          }
        }
      }
    }
    node.clone()
  }
  fn isAssignmentPatternFollow(&mut self) -> bool {
    if  self.matchValue("=".to_string()) {
      return true;
    }
    if  self.matchValue("in".to_string()) {
      return true;
    }
    if  self.matchValue("of".to_string()) {
      return true;
    }
    false
  }
  fn parseBindingTarget(&mut self) -> Rc<RefCell<TSNode>> {
    if  self.matchValue("{".to_string()) {
      return self.parseObjectPattern().clone();
    }
    if  self.matchValue("[".to_string()) {
      return self.parseArrayPattern().clone();
    }
    if  self.patternAllowsMemberTarget {
      let mut lhs : Rc<RefCell<TSNode>> = self.parsePostfix();
      if  self.strictMode {
        if  lhs.borrow().nodeType == "Identifier" {
          if  (lhs.borrow().name == "eval") || (lhs.borrow().name == "arguments") {
            let __arg_0 = format!("Parse error: cannot assign to '{}' in strict mode", lhs.borrow().name).clone();
            self.syntaxError(__arg_0);
          }
        }
      }
      let lt : String = lhs.borrow().nodeType.clone();
      if  (((((lt != "Identifier") && (lt != "MemberExpression")) && (lt != "ArrayPattern")) && (lt != "ObjectPattern")) && (lt != "ArrayExpression")) && (lt != "ObjectExpression") {
        self.syntaxError(format!("Parse error: '{}' is not a valid destructuring target", lt));
      }
      return lhs.clone();
    }
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let tt : String = self.peekType();
    if  (((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword") {
      let __arg_0 = tok.borrow().value.clone();
      self.checkBindableName(__arg_0);
      self.advance();
      let mut id : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      id.borrow_mut().nodeType = "Identifier".to_string();
      let _tmp_1 = tok.borrow().value.clone();
      id.borrow_mut().name = _tmp_1;
      if  (self.declaringKind.chars().count() as i64) > 0 {
        let __arg_0 = self.declaringKind.clone();
        let __arg_1 = tok.borrow().value.clone();
        self.declareBinding(__arg_0, __arg_1);
      }
      let _tmp_2 = tok.borrow().start;
      id.borrow_mut().start = _tmp_2;
      let _tmp_3 = tok.borrow().end;
      id.borrow_mut().end = _tmp_3;
      let _tmp_4 = tok.borrow().line;
      id.borrow_mut().line = _tmp_4;
      let _tmp_5 = tok.borrow().col;
      id.borrow_mut().col = _tmp_5;
      return id.clone();
    }
    let mut bad : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let mut errId : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    errId.borrow_mut().nodeType = "Identifier".to_string();
    let _tmp_1 = bad.borrow().value.clone();
    errId.borrow_mut().name = _tmp_1;
    errId.clone()
  }
  fn parseBindingElement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut target : Rc<RefCell<TSNode>> = self.parseBindingTarget();
    if  self.matchValue("=".to_string()) {
      self.advance();
      let savedDeclaring : String = self.declaringKind.clone();
      let wasLexical : bool = savedDeclaring == "l";
      self.declaringKind = "".to_string();
      let savedNoLet : bool = self.noLetReference;
      if  wasLexical {
        self.noLetReference = true;
      }
      let mut defaultExpr : Rc<RefCell<TSNode>> = self.parseExpr();
      self.noLetReference = savedNoLet;
      self.declaringKind = savedDeclaring.clone();
      let mut assignPat : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      assignPat.borrow_mut().nodeType = "AssignmentPattern".to_string();
      assignPat.borrow_mut().left = Some(target.clone());
      assignPat.borrow_mut().right = Some(defaultExpr.clone());
      let _tmp_1 = target.borrow().start;
      assignPat.borrow_mut().start = _tmp_1;
      let _tmp_2 = target.borrow().line;
      assignPat.borrow_mut().line = _tmp_2;
      let _tmp_3 = target.borrow().col;
      assignPat.borrow_mut().col = _tmp_3;
      return assignPat.clone();
    }
    target.clone()
  }
  fn parseObjectPattern(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ObjectPattern".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("{".to_string());
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      if  (node.borrow().children.len() as i64) > 0 {
        self.expectValue(",".to_string());
        if  self.matchValue("}".to_string()) {
          break;
        }
      }
      if  self.matchPunct(",".to_string()) {
        self.syntaxError("Parse error: an object pattern may not contain an elision".to_string());
        self.advance();
      }
      if  self.matchValue("...".to_string()) {
        self.advance();
        let mut restProp : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        restProp.borrow_mut().nodeType = "RestElement".to_string();
        let mut restTarget : Rc<RefCell<TSNode>> = self.parseBindingTarget();
        restProp.borrow_mut().left = Some(restTarget.clone());
        let _tmp_1 = restTarget.borrow().name.clone();
        restProp.borrow_mut().name = _tmp_1;
        node.borrow_mut().children.push(restProp.clone());
      } else {
        let mut prop : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        prop.borrow_mut().nodeType = "Property".to_string();
        if  self.matchPunct("[".to_string()) {
          self.advance();
          let savedKeyDeclaring : String = self.declaringKind.clone();
          self.declaringKind = "".to_string();
          let mut keyExpr : Rc<RefCell<TSNode>> = self.parseExpr();
          self.declaringKind = savedKeyDeclaring.clone();
          self.expectValue("]".to_string());
          prop.borrow_mut().computed = true;
          prop.borrow_mut().body = Some(keyExpr.clone());
          self.expectValue(":".to_string());
          prop.borrow_mut().right = Some(self.parseBindingElement().clone());
        } else {
          let mut keyTok : Rc<RefCell<Token>> = self.peek();
          let keyType : String = self.peekType();
          if  (keyType == "String") || (keyType == "Number") {
            self.advance();
            let _tmp_1 = keyTok.borrow().value.clone();
            prop.borrow_mut().name = _tmp_1;
          } else {
            let mut idTok : Rc<RefCell<Token>> = self.parseMemberName();
            let _tmp_1 = idTok.borrow().value.clone();
            prop.borrow_mut().name = _tmp_1;
          }
          if  self.matchValue(":".to_string()) {
            self.advance();
            prop.borrow_mut().right = Some(self.parseBindingElement().clone());
          } else {
            prop.borrow_mut().shorthand = true;
            if  (keyType == "String") || (keyType == "Number") {
              self.syntaxError("Parse error: a shorthand property name cannot be a literal".to_string());
            }
            if  TSParserSimple::isAlwaysReservedWord(prop.borrow().name.clone()) {
              let __arg_0 = format!("Parse error: '{}' cannot be a shorthand property name", prop.borrow().name).clone();
              self.syntaxError(__arg_0);
            }
            if  (self.declaringKind.chars().count() as i64) > 0 {
              let __arg_0 = prop.borrow().name.clone();
              self.checkBindableName(__arg_0);
              let __arg_0 = self.declaringKind.clone();
              let __arg_1 = prop.borrow().name.clone();
              self.declareBinding(__arg_0, __arg_1);
            } else {
              if  self.strictMode {
                if  (prop.borrow().name == "eval") || (prop.borrow().name == "arguments") {
                  let __arg_0 = format!("Parse error: cannot assign to '{}' in strict mode", prop.borrow().name).clone();
                  self.syntaxError(__arg_0);
                }
              }
            }
            if  self.matchValue("=".to_string()) {
              self.advance();
              let mut defaultExpr : Rc<RefCell<TSNode>> = self.parseExpr();
              prop.borrow_mut().init = Some(defaultExpr.clone());
              prop.borrow_mut().left = Some(defaultExpr.clone());
            }
          }
        }
        node.borrow_mut().children.push(prop.clone());
      }
    };
    self.expectValue("}".to_string());
    node.clone()
  }
  fn parseArrayPattern(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ArrayPattern".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("[".to_string());
    while (!(self.matchValue("]".to_string()))) && (!(self.isAtEnd())) {
      if  (node.borrow().children.len() as i64) > 0 {
        self.expectValue(",".to_string());
        if  self.matchValue("]".to_string()) {
          break;
        }
      }
      if  self.matchValue(",".to_string()) {
        let mut hole : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        hole.borrow_mut().nodeType = "Elision".to_string();
        node.borrow_mut().children.push(hole.clone());
      } else {
        if  self.matchValue("...".to_string()) {
          self.advance();
          let mut restElem : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          restElem.borrow_mut().nodeType = "RestElement".to_string();
          let mut restTarget : Rc<RefCell<TSNode>> = self.parseBindingTarget();
          restElem.borrow_mut().left = Some(restTarget.clone());
          let _tmp_1 = restTarget.borrow().name.clone();
          restElem.borrow_mut().name = _tmp_1;
          if  self.matchValue("=".to_string()) {
            self.syntaxError("Parse error: a rest element may not have a default".to_string());
          }
          if  self.matchValue(",".to_string()) {
            self.syntaxError("Parse error: a rest element must be last in an array pattern".to_string());
          }
          node.borrow_mut().children.push(restElem.clone());
        } else {
          node.borrow_mut().children.push(self.parseBindingElement());
        }
      }
    };
    self.expectValue("]".to_string());
    node.clone()
  }
  fn parseFuncDecl(&mut self, isAsync : bool) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "FunctionDeclaration".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    if  isAsync {
      node.borrow_mut().r#async = true;
    }
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      self.advance();
      node.borrow_mut().generator = true;
    }
    let savedGenerator : bool = self.inGenerator;
    let isFnExpression : bool = self.parsingFunctionExpression;
    self.parsingFunctionExpression = false;
    if  isFnExpression {
      self.inGenerator = node.borrow().generator;
    }
    if  !(self.matchValue("(".to_string())) {
      let mut nameTok : Rc<RefCell<Token>> = self.expectBindingName();
      let _tmp_1 = nameTok.borrow().value.clone();
      node.borrow_mut().name = _tmp_1;
    }
    self.inGenerator = node.borrow().generator;
    self.pushScope(true);
    self.functionDepth += 1;
    let savedRest : bool = self.sawRestParam;
    self.sawRestParam = false;
    let savedSuperCall : bool = self.allowSuperCall;
    let savedSuperProp : bool = self.allowSuperProperty;
    let savedfnIter : i64 = self.iterationDepth;
    let savedfnSwitch : i64 = self.switchDepth;
    let mut savedfnLabels : Vec<String> = self.activeLabels.clone();
    let mut savedfnIterLabels : Vec<String> = self.iterationLabels.clone();
    let mut freshfnLabels : Vec<String> = Vec::new();
    let mut freshfnIterLabels : Vec<String> = Vec::new();
    self.iterationDepth = 0;
    self.switchDepth = 0;
    self.activeLabels = freshfnLabels.clone();
    self.iterationLabels = freshfnIterLabels.clone();
    self.allowSuperCall = false;
    self.allowSuperProperty = false;
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<Rc<RefCell<TSNode>>> = self.parseTypeParams();
      for i in 0..typeParams.len() {
        let mut tp = typeParams[i].clone();
        node.borrow_mut().children.push(tp.clone());
      };
    }
    self.expectValue("(".to_string());
    while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
      if  (node.borrow().params.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : Rc<RefCell<TSNode>> = self.parseParam();
      self.declareParam(param.clone());
      node.borrow_mut().params.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut returnType : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      node.borrow_mut().typeAnnotation = Some(returnType.clone());
    }
    let __arg_0 = node.borrow().params.clone();
    self.checkNonSimpleParamDuplicates(&__arg_0);
    if  self.matchValue("{".to_string()) {
      self.suppressBlockScope = true;
      let mut body : Rc<RefCell<TSNode>> = self.parseBlock();
      node.borrow_mut().body = Some(body.clone());
      let _tmp_1 = body.borrow().end;
      node.borrow_mut().end = _tmp_1;
      if  self.lastBlockEnabledStrict {
        let __arg_0 = node.borrow().name.clone();
        let __arg_1 = node.borrow().params.clone();
        self.recheckStrictSignature(__arg_0, &__arg_1);
      }
    } else {
      node.borrow_mut().kind = "overload".to_string();
      if  self.matchValue(";".to_string()) {
        self.advance();
      } else {
        let mut afterSig : Rc<RefCell<Token>> = self.peek();
        if  !(self.isAtEnd()) {
          if  afterSig.borrow().line == self.lastTokenLine {
            self.syntaxError("Parse error: a function declaration needs a body".to_string());
          }
        }
      }
    }
    self.popScope();
    if  node.borrow().kind != "overload" {
      let __arg_0 = node.borrow().name.clone();
      self.declareBinding("f".to_string(), __arg_0);
    }
    self.allowSuperCall = savedSuperCall;
    self.allowSuperProperty = savedSuperProp;
    self.inGenerator = savedGenerator;
    self.sawRestParam = savedRest;
    self.functionDepth -= 1;
    self.iterationDepth = savedfnIter;
    self.switchDepth = savedfnSwitch;
    self.activeLabels = savedfnLabels.clone();
    self.iterationLabels = savedfnIterLabels.clone();
    node.clone()
  }
  fn parseParam(&mut self) -> Rc<RefCell<TSNode>> {
    let savedParamCtx : bool = self.inParamList;
    self.inParamList = true;
    let mut result : Rc<RefCell<TSNode>> = self.parseParamInner();
    self.inParamList = savedParamCtx;
    result.clone()
  }
  fn parseParamInner(&mut self) -> Rc<RefCell<TSNode>> {
    let mut decorators : Vec<Rc<RefCell<TSNode>>> = Vec::new();
    while self.matchValue("@".to_string()) {
      let mut dec : Rc<RefCell<TSNode>> = self.parseDecorator();
      decorators.push(dec.clone());
    };
    let mut isRest : bool = false;
    if  self.matchValue("...".to_string()) {
      self.advance();
      isRest = true;
    }
    if  self.sawRestParam {
      self.syntaxError("Parse error: a rest element must be the last parameter".to_string());
    }
    if  isRest {
      self.sawRestParam = true;
      self.restParamPending = true;
    }
    if  self.matchValue("{".to_string()) {
      let savedParamDeclaring : String = self.declaringKind.clone();
      self.declaringKind = "p".to_string();
      let mut pattern : Rc<RefCell<TSNode>> = self.parseObjectPattern();
      self.declaringKind = savedParamDeclaring.clone();
      for i in 0..decorators.len() {
        let mut d = decorators[i].clone();
        pattern.borrow_mut().decorators.push(d.clone());
      };
      if  isRest {
        let mut restElem : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        restElem.borrow_mut().nodeType = "RestElement".to_string();
        restElem.borrow_mut().left = Some(pattern.clone());
        return restElem.clone();
      }
      if  self.matchValue(":".to_string()) {
        let mut patType : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        pattern.borrow_mut().typeAnnotation = Some(patType.clone());
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut patDefault : Rc<RefCell<TSNode>> = self.parseExpr();
        let mut patAssign : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        patAssign.borrow_mut().nodeType = "AssignmentPattern".to_string();
        patAssign.borrow_mut().left = Some(pattern.clone());
        patAssign.borrow_mut().right = Some(patDefault.clone());
        return patAssign.clone();
      }
      return pattern.clone();
    }
    if  self.matchValue("[".to_string()) {
      let savedParamDeclaring_1 : String = self.declaringKind.clone();
      self.declaringKind = "p".to_string();
      let mut pattern_1 : Rc<RefCell<TSNode>> = self.parseArrayPattern();
      self.declaringKind = savedParamDeclaring_1.clone();
      for i_1 in 0..decorators.len() {
        let mut d_1 = decorators[i_1].clone();
        pattern_1.borrow_mut().decorators.push(d_1.clone());
      };
      if  isRest {
        let mut restElem_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        restElem_1.borrow_mut().nodeType = "RestElement".to_string();
        restElem_1.borrow_mut().left = Some(pattern_1.clone());
        return restElem_1.clone();
      }
      if  self.matchValue(":".to_string()) {
        let mut patType_1 : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        pattern_1.borrow_mut().typeAnnotation = Some(patType_1.clone());
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut patDefault_1 : Rc<RefCell<TSNode>> = self.parseExpr();
        let mut patAssign_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        patAssign_1.borrow_mut().nodeType = "AssignmentPattern".to_string();
        patAssign_1.borrow_mut().left = Some(pattern_1.clone());
        patAssign_1.borrow_mut().right = Some(patDefault_1.clone());
        return patAssign_1.clone();
      }
      return pattern_1.clone();
    }
    let mut param : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    if  isRest {
      param.borrow_mut().nodeType = "RestElement".to_string();
      param.borrow_mut().kind = "rest".to_string();
    } else {
      param.borrow_mut().nodeType = "Parameter".to_string();
    }
    for i_2 in 0..decorators.len() {
      let mut d_2 = decorators[i_2].clone();
      param.borrow_mut().decorators.push(d_2.clone());
    };
    let mut nameTok : Rc<RefCell<Token>> = self.expectBindingName();
    let _tmp_1 = nameTok.borrow().value.clone();
    param.borrow_mut().name = _tmp_1;
    let _tmp_2 = nameTok.borrow().start;
    param.borrow_mut().start = _tmp_2;
    let _tmp_3 = nameTok.borrow().line;
    param.borrow_mut().line = _tmp_3;
    let _tmp_4 = nameTok.borrow().col;
    param.borrow_mut().col = _tmp_4;
    if  self.matchValue("?".to_string()) {
      param.borrow_mut().optional = true;
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      param.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
    }
    if  self.matchValue("=".to_string()) {
      if  isRest {
        self.syntaxError("Parse error: a rest parameter may not have a default".to_string());
      }
      self.advance();
      let savedInParams : bool = self.inParamList;
      self.inParamList = true;
      param.borrow_mut().init = Some(self.parseExpr().clone());
      self.inParamList = savedInParams;
    }
    param.clone()
  }
  fn parseBlock(&mut self) -> Rc<RefCell<TSNode>> {
    let mut block : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    block.borrow_mut().nodeType = "BlockStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    block.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    block.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    block.borrow_mut().col = _tmp_3;
    self.expectValue("{".to_string());
    let savedSingleBody : bool = self.inSingleStatementBody;
    self.inSingleStatementBody = false;
    let mut ownScope : bool = true;
    if  self.suppressBlockScope {
      ownScope = false;
      self.suppressBlockScope = false;
    }
    if  ownScope {
      self.pushScope(false);
    }
    let savedStrict : bool = self.strictMode;
    let mut myStrictDirective : bool = false;
    self.lastBlockEnabledStrict = false;
    if  !ownScope {
      if  self.hasUseStrictDirective() {
        if  !savedStrict {
          myStrictDirective = true;
        }
        self.strictMode = true;
      }
    }
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      let beforePos : i64 = self.pos;
      self.atModuleTopLevel = false;
      let mut stmt : Rc<RefCell<TSNode>> = self.parseStatement();
      block.borrow_mut().children.push(stmt.clone());
      self.guardNoProgress(beforePos);
    };
    if  ownScope {
      self.popScope();
    }
    self.lastBlockEnabledStrict = myStrictDirective;
    self.strictMode = savedStrict;
    self.inSingleStatementBody = savedSingleBody;
    let mut closeTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_4 = closeTok.borrow().end;
    block.borrow_mut().end = _tmp_4;
    self.expectValue("}".to_string());
    block.clone()
  }
  fn parseExprStmt(&mut self) -> Rc<RefCell<TSNode>> {
    let mut stmt : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    stmt.borrow_mut().nodeType = "ExpressionStatement".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    stmt.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    stmt.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    stmt.borrow_mut().col = _tmp_3;
    let mut expr : Rc<RefCell<TSNode>> = self.parseExprSeq();
    stmt.borrow_mut().left = Some(expr.clone());
    if  self.matchValue(";".to_string()) {
      self.advance();
    } else {
      if  !(self.isAtEnd()) {
        let mut nextTok : Rc<RefCell<Token>> = self.peek();
        if  nextTok.borrow().value != "}" {
          if  nextTok.borrow().line == self.lastTokenLine {
            self.syntaxError("Parse error: missing ';' between statements".to_string());
          }
        }
      }
    }
    stmt.clone()
  }
  fn parseTypeAnnotation(&mut self) -> Rc<RefCell<TSNode>> {
    let mut annot : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    annot.borrow_mut().nodeType = "TSTypeAnnotation".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    annot.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    annot.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    annot.borrow_mut().col = _tmp_3;
    self.expectValue(":".to_string());
    let nextVal : String = self.peekValue();
    if  nextVal == "asserts" {
      let mut assertsTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut predicate : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      predicate.borrow_mut().nodeType = "TSTypePredicate".to_string();
      let _tmp_1 = assertsTok.borrow().start;
      predicate.borrow_mut().start = _tmp_1;
      let _tmp_2 = assertsTok.borrow().line;
      predicate.borrow_mut().line = _tmp_2;
      let _tmp_3 = assertsTok.borrow().col;
      predicate.borrow_mut().col = _tmp_3;
      predicate.borrow_mut().value = "asserts".to_string();
      let mut paramTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      let _tmp_4 = paramTok.borrow().value.clone();
      predicate.borrow_mut().name = _tmp_4;
      if  self.matchValue("is".to_string()) {
        self.advance();
        let mut assertType : Rc<RefCell<TSNode>> = self.parseType();
        predicate.borrow_mut().typeAnnotation = Some(assertType.clone());
      }
      annot.borrow_mut().typeAnnotation = Some(predicate.clone());
      return annot.clone();
    }
    if  self.matchType("Identifier".to_string()) {
      let savedPos : i64 = self.pos;
      let mut savedTok : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
      let mut paramTok_1 : Rc<RefCell<Token>> = self.peek();
      self.advance();
      if  self.matchValue("is".to_string()) {
        self.advance();
        let mut predicate_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        predicate_1.borrow_mut().nodeType = "TSTypePredicate".to_string();
        let _tmp_1 = paramTok_1.borrow().start;
        predicate_1.borrow_mut().start = _tmp_1;
        let _tmp_2 = paramTok_1.borrow().line;
        predicate_1.borrow_mut().line = _tmp_2;
        let _tmp_3 = paramTok_1.borrow().col;
        predicate_1.borrow_mut().col = _tmp_3;
        let _tmp_4 = paramTok_1.borrow().value.clone();
        predicate_1.borrow_mut().name = _tmp_4;
        let mut typeExpr : Rc<RefCell<TSNode>> = self.parseType();
        predicate_1.borrow_mut().typeAnnotation = Some(typeExpr.clone());
        annot.borrow_mut().typeAnnotation = Some(predicate_1.clone());
        return annot.clone();
      }
      self.pos = savedPos;
      self.currentToken = Some(savedTok.clone());
    }
    let mut typeExpr_1 : Rc<RefCell<TSNode>> = self.parseType();
    annot.borrow_mut().typeAnnotation = Some(typeExpr_1.clone());
    annot.clone()
  }
  fn parseType(&mut self) -> Rc<RefCell<TSNode>> {
    self.parseConditionalType().clone()
  }
  fn parseConditionalType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut checkType : Rc<RefCell<TSNode>> = self.parseUnionType();
    if  self.matchValue("extends".to_string()) {
      self.advance();
      let mut extendsType : Rc<RefCell<TSNode>> = self.parseUnionType();
      if  self.matchValue("?".to_string()) {
        self.advance();
        let mut conditional : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        conditional.borrow_mut().nodeType = "TSConditionalType".to_string();
        let _tmp_1 = checkType.borrow().start;
        conditional.borrow_mut().start = _tmp_1;
        let _tmp_2 = checkType.borrow().line;
        conditional.borrow_mut().line = _tmp_2;
        let _tmp_3 = checkType.borrow().col;
        conditional.borrow_mut().col = _tmp_3;
        conditional.borrow_mut().left = Some(checkType.clone());
        conditional.borrow_mut().params.push(extendsType.clone());
        conditional.borrow_mut().body = Some(self.parseUnionType().clone());
        self.expectValue(":".to_string());
        conditional.borrow_mut().right = Some(self.parseUnionType().clone());
        return conditional.clone();
      }
      return checkType.clone();
    }
    checkType.clone()
  }
  fn parseUnionType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseIntersectionType();
    if  self.matchValue("|".to_string()) {
      let mut r#union : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      r#union.borrow_mut().nodeType = "TSUnionType".to_string();
      let _tmp_1 = left.borrow().start;
      r#union.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      r#union.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      r#union.borrow_mut().col = _tmp_3;
      r#union.borrow_mut().children.push(left.clone());
      while self.matchValue("|".to_string()) {
        self.advance();
        let mut right : Rc<RefCell<TSNode>> = self.parseIntersectionType();
        r#union.borrow_mut().children.push(right.clone());
      };
      return r#union.clone();
    }
    left.clone()
  }
  fn parseIntersectionType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseArrayType();
    if  self.matchValue("&".to_string()) {
      let mut intersection : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      intersection.borrow_mut().nodeType = "TSIntersectionType".to_string();
      let _tmp_1 = left.borrow().start;
      intersection.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      intersection.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      intersection.borrow_mut().col = _tmp_3;
      intersection.borrow_mut().children.push(left.clone());
      while self.matchValue("&".to_string()) {
        self.advance();
        let mut right : Rc<RefCell<TSNode>> = self.parseArrayType();
        intersection.borrow_mut().children.push(right.clone());
      };
      return intersection.clone();
    }
    left.clone()
  }
  fn parseArrayType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut elemType : Rc<RefCell<TSNode>> = self.parsePrimaryType();
    while self.matchValue("[".to_string()) {
      if  self.checkNext("]".to_string()) {
        self.advance();
        self.advance();
        let mut arrayType : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        arrayType.borrow_mut().nodeType = "TSArrayType".to_string();
        let _tmp_1 = elemType.borrow().start;
        arrayType.borrow_mut().start = _tmp_1;
        let _tmp_2 = elemType.borrow().line;
        arrayType.borrow_mut().line = _tmp_2;
        let _tmp_3 = elemType.borrow().col;
        arrayType.borrow_mut().col = _tmp_3;
        arrayType.borrow_mut().left = Some(elemType.clone());
        elemType = arrayType.clone();
      } else {
        self.advance();
        let mut indexType : Rc<RefCell<TSNode>> = self.parseType();
        self.expectValue("]".to_string());
        let mut indexedAccess : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        indexedAccess.borrow_mut().nodeType = "TSIndexedAccessType".to_string();
        let _tmp_1 = elemType.borrow().start;
        indexedAccess.borrow_mut().start = _tmp_1;
        let _tmp_2 = elemType.borrow().line;
        indexedAccess.borrow_mut().line = _tmp_2;
        let _tmp_3 = elemType.borrow().col;
        indexedAccess.borrow_mut().col = _tmp_3;
        indexedAccess.borrow_mut().left = Some(elemType.clone());
        indexedAccess.borrow_mut().right = Some(indexType.clone());
        elemType = indexedAccess.clone();
      }
    };
    elemType.clone()
  }
  fn checkNext(&mut self, value : String) -> bool {
    let nextPos : i64 = self.pos + 1;
    if  nextPos < (self.tokens.len() as i64) {
      let mut nextTok : Rc<RefCell<Token>> = self.tokens[(nextPos) as usize].clone();
      let v : String = nextTok.borrow().value.clone();
      return v == value;
    }
    false
  }
  fn parsePrimaryType(&mut self) -> Rc<RefCell<TSNode>> {
    let tokVal : String = self.peekValue();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    if  tokVal == "keyof" {
      self.advance();
      let mut operand : Rc<RefCell<TSNode>> = self.parsePrimaryType();
      let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node.borrow_mut().nodeType = "TSTypeOperator".to_string();
      node.borrow_mut().value = "keyof".to_string();
      let _tmp_1 = tok.borrow().start;
      node.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().line;
      node.borrow_mut().line = _tmp_2;
      let _tmp_3 = tok.borrow().col;
      node.borrow_mut().col = _tmp_3;
      node.borrow_mut().typeAnnotation = Some(operand.clone());
      return node.clone();
    }
    if  tokVal == "typeof" {
      self.advance();
      let mut operand_1 : Rc<RefCell<TSNode>> = self.parsePrimaryType();
      let mut node_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_1.borrow_mut().nodeType = "TSTypeQuery".to_string();
      node_1.borrow_mut().value = "typeof".to_string();
      let _tmp_1 = tok.borrow().start;
      node_1.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().line;
      node_1.borrow_mut().line = _tmp_2;
      let _tmp_3 = tok.borrow().col;
      node_1.borrow_mut().col = _tmp_3;
      node_1.borrow_mut().typeAnnotation = Some(operand_1.clone());
      return node_1.clone();
    }
    if  tokVal == "infer" {
      self.advance();
      let mut paramTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      let mut node_2 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_2.borrow_mut().nodeType = "TSInferType".to_string();
      let _tmp_1 = tok.borrow().start;
      node_2.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().line;
      node_2.borrow_mut().line = _tmp_2;
      let _tmp_3 = tok.borrow().col;
      node_2.borrow_mut().col = _tmp_3;
      let mut typeParam : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      typeParam.borrow_mut().nodeType = "TSTypeParameter".to_string();
      let _tmp_4 = paramTok.borrow().value.clone();
      typeParam.borrow_mut().name = _tmp_4;
      node_2.borrow_mut().typeAnnotation = Some(typeParam.clone());
      return node_2.clone();
    }
    if  tokVal == "string" {
      self.advance();
      let mut node_3 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_3.borrow_mut().nodeType = "TSStringKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_3.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_3.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_3.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_3.borrow_mut().col = _tmp_4;
      return node_3.clone();
    }
    if  tokVal == "number" {
      self.advance();
      let mut node_4 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_4.borrow_mut().nodeType = "TSNumberKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_4.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_4.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_4.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_4.borrow_mut().col = _tmp_4;
      return node_4.clone();
    }
    if  tokVal == "boolean" {
      self.advance();
      let mut node_5 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_5.borrow_mut().nodeType = "TSBooleanKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_5.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_5.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_5.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_5.borrow_mut().col = _tmp_4;
      return node_5.clone();
    }
    if  tokVal == "any" {
      self.advance();
      let mut node_6 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_6.borrow_mut().nodeType = "TSAnyKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_6.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_6.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_6.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_6.borrow_mut().col = _tmp_4;
      return node_6.clone();
    }
    if  tokVal == "unknown" {
      self.advance();
      let mut node_7 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_7.borrow_mut().nodeType = "TSUnknownKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_7.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_7.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_7.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_7.borrow_mut().col = _tmp_4;
      return node_7.clone();
    }
    if  tokVal == "object" {
      self.advance();
      let mut node_8 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_8.borrow_mut().nodeType = "TSObjectKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_8.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_8.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_8.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_8.borrow_mut().col = _tmp_4;
      return node_8.clone();
    }
    if  tokVal == "void" {
      self.advance();
      let mut node_9 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_9.borrow_mut().nodeType = "TSVoidKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_9.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_9.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_9.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_9.borrow_mut().col = _tmp_4;
      return node_9.clone();
    }
    if  tokVal == "null" {
      self.advance();
      let mut node_10 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_10.borrow_mut().nodeType = "TSNullKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_10.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_10.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_10.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_10.borrow_mut().col = _tmp_4;
      return node_10.clone();
    }
    if  tokVal == "never" {
      self.advance();
      let mut node_11 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_11.borrow_mut().nodeType = "TSNeverKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_11.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_11.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_11.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_11.borrow_mut().col = _tmp_4;
      return node_11.clone();
    }
    if  tokVal == "undefined" {
      self.advance();
      let mut node_12 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_12.borrow_mut().nodeType = "TSUndefinedKeyword".to_string();
      let _tmp_1 = tok.borrow().start;
      node_12.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_12.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_12.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_12.borrow_mut().col = _tmp_4;
      return node_12.clone();
    }
    let tokType : String = self.peekType();
    if  tokType == "Identifier" {
      return self.parseTypeRef().clone();
    }
    if  tokType == "String" {
      self.advance();
      let mut node_13 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_13.borrow_mut().nodeType = "TSLiteralType".to_string();
      let _tmp_1 = tok.borrow().start;
      node_13.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_13.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_13.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_13.borrow_mut().col = _tmp_4;
      let _tmp_5 = tok.borrow().value.clone();
      node_13.borrow_mut().value = _tmp_5;
      node_13.borrow_mut().kind = "string".to_string();
      return node_13.clone();
    }
    if  tokType == "Number" {
      self.advance();
      let mut node_14 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_14.borrow_mut().nodeType = "TSLiteralType".to_string();
      let _tmp_1 = tok.borrow().start;
      node_14.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_14.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_14.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_14.borrow_mut().col = _tmp_4;
      let _tmp_5 = tok.borrow().value.clone();
      node_14.borrow_mut().value = _tmp_5;
      node_14.borrow_mut().kind = "number".to_string();
      return node_14.clone();
    }
    if  (tokVal == "true") || (tokVal == "false") {
      self.advance();
      let mut node_15 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_15.borrow_mut().nodeType = "TSLiteralType".to_string();
      let _tmp_1 = tok.borrow().start;
      node_15.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_15.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_15.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_15.borrow_mut().col = _tmp_4;
      node_15.borrow_mut().value = tokVal.clone();
      node_15.borrow_mut().kind = "boolean".to_string();
      return node_15.clone();
    }
    if  tokType == "Template" {
      self.advance();
      let mut node_16 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      node_16.borrow_mut().nodeType = "TSTemplateLiteralType".to_string();
      let _tmp_1 = tok.borrow().start;
      node_16.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      node_16.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      node_16.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      node_16.borrow_mut().col = _tmp_4;
      let _tmp_5 = tok.borrow().value.clone();
      node_16.borrow_mut().value = _tmp_5;
      return node_16.clone();
    }
    if  tokVal == "new" {
      return self.parseConstructorType().clone();
    }
    if  tokVal == "import" {
      return self.parseImportType().clone();
    }
    if  tokVal == "(" {
      return self.parseParenOrFunctionType().clone();
    }
    if  tokVal == "[" {
      return self.parseTupleType().clone();
    }
    if  tokVal == "{" {
      return self.parseTypeLiteral().clone();
    }
    self.syntaxError(format!("Unknown type: {}", tokVal));
    self.advance();
    let mut errNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    errNode.borrow_mut().nodeType = "TSAnyKeyword".to_string();
    errNode.clone()
  }
  fn parseTypeRef(&mut self) -> Rc<RefCell<TSNode>> {
    let mut r#ref : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    r#ref.borrow_mut().nodeType = "TSTypeReference".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    r#ref.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    r#ref.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    r#ref.borrow_mut().col = _tmp_3;
    let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let _tmp_4 = nameTok.borrow().value.clone();
    r#ref.borrow_mut().name = _tmp_4;
    if  self.matchValue("<".to_string()) {
      self.advance();
      while (!(self.matchValue(">".to_string()))) && (!(self.isAtEnd())) {
        if  (r#ref.borrow().params.len() as i64) > 0 {
          self.expectValue(",".to_string());
        }
        let mut typeArg : Rc<RefCell<TSNode>> = self.parseType();
        r#ref.borrow_mut().params.push(typeArg.clone());
      };
      self.expectValue(">".to_string());
    }
    r#ref.clone()
  }
  fn parseTupleType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut tuple : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    tuple.borrow_mut().nodeType = "TSTupleType".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    tuple.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    tuple.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    tuple.borrow_mut().col = _tmp_3;
    self.expectValue("[".to_string());
    while (!(self.matchValue("]".to_string()))) && (!(self.isAtEnd())) {
      if  (tuple.borrow().children.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue("...".to_string()) {
        let mut restTok : Rc<RefCell<Token>> = self.peek();
        self.advance();
        let mut restName : String = "".to_string();
        if  self.matchType("Identifier".to_string()) {
          let savedPos : i64 = self.pos;
          let mut savedTok : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
          let mut nameTok : Rc<RefCell<Token>> = self.peek();
          self.advance();
          if  self.matchValue(":".to_string()) {
            restName = nameTok.borrow().value.clone();
            self.advance();
          } else {
            self.pos = savedPos;
            self.currentToken = Some(savedTok.clone());
          }
        }
        let mut innerType : Rc<RefCell<TSNode>> = self.parseType();
        let mut restType : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        restType.borrow_mut().nodeType = "TSRestType".to_string();
        let _tmp_1 = restTok.borrow().start;
        restType.borrow_mut().start = _tmp_1;
        let _tmp_2 = restTok.borrow().line;
        restType.borrow_mut().line = _tmp_2;
        let _tmp_3 = restTok.borrow().col;
        restType.borrow_mut().col = _tmp_3;
        restType.borrow_mut().typeAnnotation = Some(innerType.clone());
        if  !restName.is_empty() {
          restType.borrow_mut().name = restName.clone();
        }
        tuple.borrow_mut().children.push(restType.clone());
      } else {
        let mut isNamed : bool = false;
        let mut elemName : String = "".to_string();
        let mut elemOptional : bool = false;
        let mut elemStart : Rc<RefCell<Token>> = self.peek();
        if  self.matchType("Identifier".to_string()) {
          let savedPos_1 : i64 = self.pos;
          let mut savedTok_1 : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
          let mut nameTok_1 : Rc<RefCell<Token>> = self.peek();
          self.advance();
          if  self.matchValue("?".to_string()) {
            self.advance();
            elemOptional = true;
          }
          if  self.matchValue(":".to_string()) {
            isNamed = true;
            elemName = nameTok_1.borrow().value.clone();
            self.advance();
          } else {
            self.pos = savedPos_1;
            self.currentToken = Some(savedTok_1.clone());
            elemOptional = false;
          }
        }
        let mut elemType : Rc<RefCell<TSNode>> = self.parseType();
        if  isNamed {
          let mut namedElem : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          namedElem.borrow_mut().nodeType = "TSNamedTupleMember".to_string();
          let _tmp_1 = elemStart.borrow().start;
          namedElem.borrow_mut().start = _tmp_1;
          let _tmp_2 = elemStart.borrow().line;
          namedElem.borrow_mut().line = _tmp_2;
          let _tmp_3 = elemStart.borrow().col;
          namedElem.borrow_mut().col = _tmp_3;
          namedElem.borrow_mut().name = elemName.clone();
          namedElem.borrow_mut().optional = elemOptional;
          namedElem.borrow_mut().typeAnnotation = Some(elemType.clone());
          tuple.borrow_mut().children.push(namedElem.clone());
        } else {
          if  self.matchValue("?".to_string()) {
            self.advance();
            let mut optType : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
            optType.borrow_mut().nodeType = "TSOptionalType".to_string();
            let _tmp_1 = elemType.borrow().start;
            optType.borrow_mut().start = _tmp_1;
            let _tmp_2 = elemType.borrow().line;
            optType.borrow_mut().line = _tmp_2;
            let _tmp_3 = elemType.borrow().col;
            optType.borrow_mut().col = _tmp_3;
            optType.borrow_mut().typeAnnotation = Some(elemType.clone());
            tuple.borrow_mut().children.push(optType.clone());
          } else {
            tuple.borrow_mut().children.push(elemType.clone());
          }
        }
      }
    };
    self.expectValue("]".to_string());
    tuple.clone()
  }
  fn parseParenOrFunctionType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let startPos : i64 = startTok.borrow().start;
    let startLine : i64 = startTok.borrow().line;
    let startCol : i64 = startTok.borrow().col;
    self.expectValue("(".to_string());
    if  self.matchValue(")".to_string()) {
      self.advance();
      if  self.matchValue("=>".to_string()) {
        self.advance();
        let mut returnType : Rc<RefCell<TSNode>> = self.parseType();
        let mut funcType : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        funcType.borrow_mut().nodeType = "TSFunctionType".to_string();
        funcType.borrow_mut().start = startPos;
        funcType.borrow_mut().line = startLine;
        funcType.borrow_mut().col = startCol;
        funcType.borrow_mut().typeAnnotation = Some(returnType.clone());
        return funcType.clone();
      }
      let mut voidNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      voidNode.borrow_mut().nodeType = "TSVoidKeyword".to_string();
      return voidNode.clone();
    }
    let isIdentifier : bool = self.matchType("Identifier".to_string());
    if  isIdentifier {
      let savedPos : i64 = self.pos;
      let mut savedToken : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
      self.advance();
      if  self.matchValue(":".to_string()) || self.matchValue("?".to_string()) {
        self.pos = savedPos;
        self.currentToken = Some(savedToken.clone());
        return self.parseFunctionType(startPos, startLine, startCol).clone();
      }
      if  self.matchValue(",".to_string()) {
        // unused:  let savedPos2 : i64 = self.pos;
        // unused:  let mut savedToken2 : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
        let mut depth : i64 = 1;
        while (depth > 0) && (!(self.isAtEnd())) {
          if  self.matchValue("(".to_string()) {
            depth += 1;
          }
          if  self.matchValue(")".to_string()) {
            depth -= 1;
          }
          if  depth > 0 {
            self.advance();
          }
        };
        if  self.matchValue(")".to_string()) {
          self.advance();
          if  self.matchValue("=>".to_string()) {
            self.pos = savedPos;
            self.currentToken = Some(savedToken.clone());
            return self.parseFunctionType(startPos, startLine, startCol).clone();
          }
        }
        self.pos = savedPos;
        self.currentToken = Some(savedToken.clone());
      }
      self.pos = savedPos;
      self.currentToken = Some(savedToken.clone());
    }
    let mut innerType : Rc<RefCell<TSNode>> = self.parseType();
    self.expectValue(")".to_string());
    if  self.matchValue("=>".to_string()) {
      self.advance();
      let mut returnType_1 : Rc<RefCell<TSNode>> = self.parseType();
      let mut funcType_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      funcType_1.borrow_mut().nodeType = "TSFunctionType".to_string();
      funcType_1.borrow_mut().start = startPos;
      funcType_1.borrow_mut().line = startLine;
      funcType_1.borrow_mut().col = startCol;
      funcType_1.borrow_mut().typeAnnotation = Some(returnType_1.clone());
      return funcType_1.clone();
    }
    innerType.clone()
  }
  fn parseFunctionType(&mut self, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<TSNode>> {
    let mut funcType : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    funcType.borrow_mut().nodeType = "TSFunctionType".to_string();
    funcType.borrow_mut().start = startPos;
    funcType.borrow_mut().line = startLine;
    funcType.borrow_mut().col = startCol;
    while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
      if  (funcType.borrow().params.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      param.borrow_mut().nodeType = "Parameter".to_string();
      let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      let _tmp_1 = nameTok.borrow().value.clone();
      param.borrow_mut().name = _tmp_1;
      let _tmp_2 = nameTok.borrow().start;
      param.borrow_mut().start = _tmp_2;
      let _tmp_3 = nameTok.borrow().line;
      param.borrow_mut().line = _tmp_3;
      let _tmp_4 = nameTok.borrow().col;
      param.borrow_mut().col = _tmp_4;
      if  self.matchValue("?".to_string()) {
        param.borrow_mut().optional = true;
        self.advance();
      }
      if  self.matchValue(":".to_string()) {
        let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
        param.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
      }
      funcType.borrow_mut().params.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue("=>".to_string()) {
      self.advance();
      let mut returnType : Rc<RefCell<TSNode>> = self.parseType();
      funcType.borrow_mut().typeAnnotation = Some(returnType.clone());
    }
    funcType.clone()
  }
  fn parseConstructorType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut ctorType : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    ctorType.borrow_mut().nodeType = "TSConstructorType".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    ctorType.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    ctorType.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    ctorType.borrow_mut().col = _tmp_3;
    self.expectValue("new".to_string());
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<Rc<RefCell<TSNode>>> = self.parseTypeParams();
      ctorType.borrow_mut().children = typeParams.clone();
    }
    self.expectValue("(".to_string());
    while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
      if  (ctorType.borrow().params.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : Rc<RefCell<TSNode>> = self.parseParam();
      ctorType.borrow_mut().params.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue("=>".to_string()) {
      self.advance();
      let mut returnType : Rc<RefCell<TSNode>> = self.parseType();
      ctorType.borrow_mut().typeAnnotation = Some(returnType.clone());
    }
    ctorType.clone()
  }
  fn parseImportType(&mut self) -> Rc<RefCell<TSNode>> {
    let mut importType : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    importType.borrow_mut().nodeType = "TSImportType".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    importType.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    importType.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    importType.borrow_mut().col = _tmp_3;
    self.expectValue("import".to_string());
    self.expectValue("(".to_string());
    let mut sourceTok : Rc<RefCell<Token>> = self.expect("String".to_string());
    let _tmp_4 = sourceTok.borrow().value.clone();
    importType.borrow_mut().value = _tmp_4;
    self.expectValue(")".to_string());
    if  self.matchValue(".".to_string()) {
      self.advance();
      let mut memberTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      let _tmp_1 = memberTok.borrow().value.clone();
      importType.borrow_mut().name = _tmp_1;
      if  self.matchValue("<".to_string()) {
        self.advance();
        while (!(self.matchValue(">".to_string()))) && (!(self.isAtEnd())) {
          if  (importType.borrow().params.len() as i64) > 0 {
            self.expectValue(",".to_string());
          }
          let mut typeArg : Rc<RefCell<TSNode>> = self.parseType();
          importType.borrow_mut().params.push(typeArg.clone());
        };
        self.expectValue(">".to_string());
      }
    }
    importType.clone()
  }
  fn parseTypeLiteral(&mut self) -> Rc<RefCell<TSNode>> {
    let mut literal : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    literal.borrow_mut().nodeType = "TSTypeLiteral".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    literal.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    literal.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    literal.borrow_mut().col = _tmp_3;
    self.expectValue("{".to_string());
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      let mut member : Rc<RefCell<TSNode>> = self.parseTypeLiteralMember();
      literal.borrow_mut().children.push(member.clone());
      if  self.matchValue(";".to_string()) || self.matchValue(",".to_string()) {
        self.advance();
      }
    };
    self.expectValue("}".to_string());
    literal.clone()
  }
  fn parseTypeLiteralMember(&mut self) -> Rc<RefCell<TSNode>> {
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let startPos : i64 = startTok.borrow().start;
    let startLine : i64 = startTok.borrow().line;
    let startCol : i64 = startTok.borrow().col;
    let mut isReadonly : bool = false;
    if  self.matchValue("readonly".to_string()) {
      isReadonly = true;
      self.advance();
    }
    let mut readonlyModifier : String = "".to_string();
    if  self.matchValue("+".to_string()) || self.matchValue("-".to_string()) {
      readonlyModifier = self.peekValue();
      self.advance();
      if  self.matchValue("readonly".to_string()) {
        isReadonly = true;
        self.advance();
      }
    }
    if  self.matchValue("[".to_string()) {
      self.advance();
      let mut paramName : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
      if  self.matchValue("in".to_string()) {
        return self.parseMappedType(isReadonly, readonlyModifier.clone(), paramName.borrow().value.clone(), startPos, startLine, startCol).clone();
      }
      return self.parseIndexSignatureRest(isReadonly, paramName.clone(), startPos, startLine, startCol).clone();
    }
    let mut nameTok : Rc<RefCell<Token>> = self.expect("Identifier".to_string());
    let memberName : String = nameTok.borrow().value.clone();
    let mut isOptional : bool = false;
    if  self.matchValue("?".to_string()) {
      isOptional = true;
      self.advance();
    }
    if  self.matchValue("(".to_string()) {
      return self.parseMethodSignature(memberName.clone(), isOptional, startPos, startLine, startCol).clone();
    }
    let mut prop : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    prop.borrow_mut().nodeType = "TSPropertySignature".to_string();
    prop.borrow_mut().start = startPos;
    prop.borrow_mut().line = startLine;
    prop.borrow_mut().col = startCol;
    prop.borrow_mut().name = memberName.clone();
    prop.borrow_mut().readonly = isReadonly;
    prop.borrow_mut().optional = isOptional;
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      prop.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
    }
    prop.clone()
  }
  fn parseMappedType(&mut self, isReadonly : bool, readonlyMod : String, paramName : String, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<TSNode>> {
    let mut mapped : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    mapped.borrow_mut().nodeType = "TSMappedType".to_string();
    mapped.borrow_mut().start = startPos;
    mapped.borrow_mut().line = startLine;
    mapped.borrow_mut().col = startCol;
    mapped.borrow_mut().readonly = isReadonly;
    if  !readonlyMod.is_empty() {
      mapped.borrow_mut().kind = readonlyMod.clone();
    }
    self.expectValue("in".to_string());
    let mut typeParam : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    typeParam.borrow_mut().nodeType = "TSTypeParameter".to_string();
    typeParam.borrow_mut().name = paramName.clone();
    let mut constraint : Rc<RefCell<TSNode>> = self.parseType();
    typeParam.borrow_mut().typeAnnotation = Some(constraint.clone());
    mapped.borrow_mut().params.push(typeParam.clone());
    if  self.matchValue("as".to_string()) {
      self.advance();
      let mut nameType : Rc<RefCell<TSNode>> = self.parseType();
      mapped.borrow_mut().right = Some(nameType.clone());
    }
    self.expectValue("]".to_string());
    let mut optionalMod : String = "".to_string();
    if  self.matchValue("+".to_string()) || self.matchValue("-".to_string()) {
      optionalMod = self.peekValue();
      self.advance();
    }
    if  self.matchValue("?".to_string()) {
      mapped.borrow_mut().optional = true;
      if  !optionalMod.is_empty() {
        mapped.borrow_mut().value = optionalMod.clone();
      }
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      self.advance();
      let mut valueType : Rc<RefCell<TSNode>> = self.parseType();
      mapped.borrow_mut().typeAnnotation = Some(valueType.clone());
    }
    mapped.clone()
  }
  fn parseIndexSignatureRest(&mut self, isReadonly : bool, mut paramTok : Rc<RefCell<Token>>, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<TSNode>> {
    let mut indexSig : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    indexSig.borrow_mut().nodeType = "TSIndexSignature".to_string();
    indexSig.borrow_mut().start = startPos;
    indexSig.borrow_mut().line = startLine;
    indexSig.borrow_mut().col = startCol;
    indexSig.borrow_mut().readonly = isReadonly;
    let mut param : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    param.borrow_mut().nodeType = "Parameter".to_string();
    let _tmp_1 = paramTok.borrow().value.clone();
    param.borrow_mut().name = _tmp_1;
    let _tmp_2 = paramTok.borrow().start;
    param.borrow_mut().start = _tmp_2;
    let _tmp_3 = paramTok.borrow().line;
    param.borrow_mut().line = _tmp_3;
    let _tmp_4 = paramTok.borrow().col;
    param.borrow_mut().col = _tmp_4;
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      param.borrow_mut().typeAnnotation = Some(typeAnnot.clone());
    }
    indexSig.borrow_mut().params.push(param.clone());
    self.expectValue("]".to_string());
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot_1 : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      indexSig.borrow_mut().typeAnnotation = Some(typeAnnot_1.clone());
    }
    indexSig.clone()
  }
  fn parseMethodSignature(&mut self, methodName : String, isOptional : bool, startPos : i64, startLine : i64, startCol : i64) -> Rc<RefCell<TSNode>> {
    let mut method : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    method.borrow_mut().nodeType = "TSMethodSignature".to_string();
    method.borrow_mut().start = startPos;
    method.borrow_mut().line = startLine;
    method.borrow_mut().col = startCol;
    method.borrow_mut().name = methodName.clone();
    method.borrow_mut().optional = isOptional;
    self.expectValue("(".to_string());
    while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
      if  (method.borrow().params.len() as i64) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : Rc<RefCell<TSNode>> = self.parseParam();
      method.borrow_mut().params.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut returnType : Rc<RefCell<TSNode>> = self.parseTypeAnnotation();
      method.borrow_mut().typeAnnotation = Some(returnType.clone());
    }
    method.clone()
  }
  fn parseExpr(&mut self) -> Rc<RefCell<TSNode>> {
    self.parseAssign().clone()
  }
  fn parseExprSeq(&mut self) -> Rc<RefCell<TSNode>> {
    let mut first : Rc<RefCell<TSNode>> = self.parseExpr();
    if  !(self.matchValue(",".to_string())) {
      return first.clone();
    }
    let mut seq : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    seq.borrow_mut().nodeType = "SequenceExpression".to_string();
    let _tmp_1 = first.borrow().start;
    seq.borrow_mut().start = _tmp_1;
    let _tmp_2 = first.borrow().line;
    seq.borrow_mut().line = _tmp_2;
    let _tmp_3 = first.borrow().col;
    seq.borrow_mut().col = _tmp_3;
    seq.borrow_mut().children.push(first.clone());
    while self.matchValue(",".to_string()) {
      self.advance();
      let mut next : Rc<RefCell<TSNode>> = self.parseExpr();
      seq.borrow_mut().children.push(next.clone());
    };
    seq.clone()
  }
  fn checkAssignmentTarget(&mut self, mut target : Rc<RefCell<TSNode>>) {
    let t : String = target.borrow().nodeType.clone();
    if  t == "Identifier" {
      if  self.strictMode {
        if  ((target.borrow().name == "eval") || (target.borrow().name == "arguments")) || (target.borrow().name == "yield") {
          let __arg_0 = format!("Parse error: cannot assign to '{}' in strict mode", target.borrow().name).clone();
          self.syntaxError(__arg_0);
        }
      }
      return;
    }
    if  t == "MemberExpression" {
      return;
    }
    if  t == "ObjectPattern" {
      return;
    }
    if  t == "ArrayPattern" {
      return;
    }
    if  t == "AssignmentPattern" {
      return;
    }
    if  t == "ObjectExpression" {
      if  target.borrow().parenthesized {
        self.syntaxError("Parse error: a parenthesised object literal is not a valid assignment target".to_string());
        return;
      }
      let mut i : i64 = 0;
      while i < (target.borrow().children.len() as i64) {
        let mut prop : Rc<RefCell<TSNode>> = target.borrow().children[(i) as usize].clone();
        if  prop.borrow().method {
          self.syntaxError("Parse error: a method cannot be a destructuring assignment target".to_string());
          return;
        }
        if  (prop.borrow().kind == "get") || (prop.borrow().kind == "set") {
          self.syntaxError("Parse error: an accessor cannot be a destructuring assignment target".to_string());
          return;
        }
        i += 1;
      };
      return;
    }
    if  t == "ArrayExpression" {
      if  target.borrow().parenthesized {
        self.syntaxError("Parse error: a parenthesised array literal is not a valid assignment target".to_string());
      }
      return;
    }
    self.syntaxError(format!("Parse error: invalid assignment target ({})", t));
  }
  fn checkUpdateTarget(&mut self, mut target : Rc<RefCell<TSNode>>) {
    let t : String = target.borrow().nodeType.clone();
    if  t == "Identifier" {
      if  self.strictMode {
        if  (target.borrow().name == "eval") || (target.borrow().name == "arguments") {
          let __arg_0 = format!("Parse error: cannot update '{}' in strict mode", target.borrow().name).clone();
          self.syntaxError(__arg_0);
        }
      }
      return;
    }
    if  t == "MemberExpression" {
      return;
    }
    self.syntaxError(format!("Parse error: '{}' is not a valid update target", t));
  }
  fn parseAssign(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseNullishCoalescing();
    let tokVal : String = self.peekValue();
    if  tokVal == "=" {
      self.checkAssignmentTarget(left.clone());
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseAssign();
      let mut assign : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      assign.borrow_mut().nodeType = "AssignmentExpression".to_string();
      assign.borrow_mut().value = "=".to_string();
      assign.borrow_mut().left = Some(left.clone());
      assign.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      assign.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      assign.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      assign.borrow_mut().col = _tmp_3;
      return assign.clone();
    }
    if  (((((((((((tokVal == "+=") || (tokVal == "-=")) || (tokVal == "*=")) || (tokVal == "/=")) || (tokVal == "%=")) || (tokVal == "**=")) || (tokVal == "&=")) || (tokVal == "|=")) || (tokVal == "^=")) || (tokVal == "<<=")) || (tokVal == ">>=")) || (tokVal == ">>>=") {
      self.checkAssignmentTarget(left.clone());
      let leftKind : String = left.borrow().nodeType.clone();
      if  (((leftKind == "ArrayExpression") || (leftKind == "ObjectExpression")) || (leftKind == "ArrayPattern")) || (leftKind == "ObjectPattern") {
        self.syntaxError("Parse error: a compound assignment cannot have a destructuring target".to_string());
      }
      self.advance();
      let mut right_1 : Rc<RefCell<TSNode>> = self.parseAssign();
      let mut assign_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      assign_1.borrow_mut().nodeType = "AssignmentExpression".to_string();
      assign_1.borrow_mut().value = tokVal.clone();
      assign_1.borrow_mut().left = Some(left.clone());
      assign_1.borrow_mut().right = Some(right_1.clone());
      let _tmp_1 = left.borrow().start;
      assign_1.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      assign_1.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      assign_1.borrow_mut().col = _tmp_3;
      return assign_1.clone();
    }
    if  ((tokVal == "&&=") || (tokVal == "||=")) || (tokVal == "??=") {
      self.advance();
      let mut right_2 : Rc<RefCell<TSNode>> = self.parseAssign();
      let mut assign_2 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      assign_2.borrow_mut().nodeType = "AssignmentExpression".to_string();
      assign_2.borrow_mut().value = tokVal.clone();
      assign_2.borrow_mut().left = Some(left.clone());
      assign_2.borrow_mut().right = Some(right_2.clone());
      let _tmp_1 = left.borrow().start;
      assign_2.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      assign_2.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      assign_2.borrow_mut().col = _tmp_3;
      return assign_2.clone();
    }
    left.clone()
  }
  fn parseNullishCoalescing(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseTernary();
    while self.matchValue("??".to_string()) {
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseTernary();
      let mut nullish : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      nullish.borrow_mut().nodeType = "LogicalExpression".to_string();
      nullish.borrow_mut().value = "??".to_string();
      nullish.borrow_mut().left = Some(left.clone());
      nullish.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      nullish.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      nullish.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      nullish.borrow_mut().col = _tmp_3;
      left = nullish.clone();
    };
    left.clone()
  }
  fn parseTernary(&mut self) -> Rc<RefCell<TSNode>> {
    let mut testExpr : Rc<RefCell<TSNode>> = self.parseLogicalOr();
    if  self.matchValue("?".to_string()) {
      self.advance();
      let mut consequentExpr : Rc<RefCell<TSNode>> = self.parseAssign();
      if  self.matchValue(":".to_string()) {
        self.advance();
        let mut alternateExpr : Rc<RefCell<TSNode>> = self.parseAssign();
        let mut cond : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        cond.borrow_mut().nodeType = "ConditionalExpression".to_string();
        let _tmp_1 = testExpr.borrow().start;
        cond.borrow_mut().start = _tmp_1;
        let _tmp_2 = testExpr.borrow().line;
        cond.borrow_mut().line = _tmp_2;
        let _tmp_3 = testExpr.borrow().col;
        cond.borrow_mut().col = _tmp_3;
        cond.borrow_mut().left = Some(testExpr.clone());
        cond.borrow_mut().test = Some(testExpr.clone());
        cond.borrow_mut().consequent = Some(consequentExpr.clone());
        cond.borrow_mut().alternate = Some(alternateExpr.clone());
        return cond.clone();
      }
    }
    testExpr.clone()
  }
  fn parseLogicalOr(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseLogicalAnd();
    while self.matchValue("||".to_string()) {
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseLogicalAnd();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      expr.borrow_mut().value = "||".to_string();
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      expr.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      expr.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      expr.borrow_mut().col = _tmp_3;
      left = expr.clone();
    };
    left.clone()
  }
  fn parseLogicalAnd(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseBitwiseOr();
    while self.matchValue("&&".to_string()) {
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseBitwiseOr();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      expr.borrow_mut().value = "&&".to_string();
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      expr.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      expr.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      expr.borrow_mut().col = _tmp_3;
      left = expr.clone();
    };
    left.clone()
  }
  fn parseBitwiseOr(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseBitwiseXor();
    while self.matchValue("|".to_string()) {
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseBitwiseXor();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      expr.borrow_mut().value = "|".to_string();
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      expr.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      expr.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      expr.borrow_mut().col = _tmp_3;
      left = expr.clone();
    };
    left.clone()
  }
  fn parseBitwiseXor(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseBitwiseAnd();
    while self.matchValue("^".to_string()) {
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseBitwiseAnd();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      expr.borrow_mut().value = "^".to_string();
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      expr.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      expr.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      expr.borrow_mut().col = _tmp_3;
      left = expr.clone();
    };
    left.clone()
  }
  fn parseBitwiseAnd(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseEquality();
    while self.matchValue("&".to_string()) {
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseEquality();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      expr.borrow_mut().value = "&".to_string();
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      expr.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      expr.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      expr.borrow_mut().col = _tmp_3;
      left = expr.clone();
    };
    left.clone()
  }
  fn parseEquality(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseComparison();
    let mut tokVal : String = self.peekValue();
    while (((tokVal == "==") || (tokVal == "!=")) || (tokVal == "===")) || (tokVal == "!==") {
      let mut opTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseComparison();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      let _tmp_1 = opTok.borrow().value.clone();
      expr.borrow_mut().value = _tmp_1;
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_2 = left.borrow().start;
      expr.borrow_mut().start = _tmp_2;
      let _tmp_3 = left.borrow().line;
      expr.borrow_mut().line = _tmp_3;
      let _tmp_4 = left.borrow().col;
      expr.borrow_mut().col = _tmp_4;
      left = expr.clone();
      tokVal = self.peekValue();
    };
    left.clone()
  }
  fn parseComparison(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseShift();
    let mut tokVal : String = self.peekValue();
    let mut tokType : String = self.peekType();
    while (((((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=")) && (tokType == "Punctuator")) || (((tokVal == "instanceof") || (tokVal == "in")) && (tokType != "String")) {
      if  tokVal == "<" {
        if  self.tsxMode {
          if  left.borrow().nodeType == "Identifier" {
            if  TSParserSimple::startsWithLowerCase(left.borrow().name.clone()) {
              if  self.looksLikeGenericCall() {
                return left.clone();
              }
            }
          }
        }
      }
      let mut opTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseShift();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      let _tmp_1 = opTok.borrow().value.clone();
      expr.borrow_mut().value = _tmp_1;
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_2 = left.borrow().start;
      expr.borrow_mut().start = _tmp_2;
      let _tmp_3 = left.borrow().line;
      expr.borrow_mut().line = _tmp_3;
      let _tmp_4 = left.borrow().col;
      expr.borrow_mut().col = _tmp_4;
      left = expr.clone();
      tokVal = self.peekValue();
      tokType = self.peekType();
    };
    left.clone()
  }
  fn parseShift(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseAdditive();
    let mut cur : String = self.peekValue();
    let mut nxt : String = self.peekAheadValue(1);
    while (self.peekType() == "Punctuator") && (((cur == "<") && (nxt == "<")) || ((cur == ">") && (nxt == ">"))) {
      let mut _startTok : Rc<RefCell<Token>> = self.peek();
      let mut op : String = "".to_string();
      if  cur == "<" {
        self.advance();
        self.advance();
        op = "<<".to_string();
      } else {
        self.advance();
        self.advance();
        op = ">>".to_string();
        if  self.peekValue() == ">" {
          self.advance();
          op = ">>>".to_string();
        }
      }
      let mut right : Rc<RefCell<TSNode>> = self.parseAdditive();
      let mut expr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      expr.borrow_mut().nodeType = "BinaryExpression".to_string();
      expr.borrow_mut().value = op.clone();
      expr.borrow_mut().left = Some(left.clone());
      expr.borrow_mut().right = Some(right.clone());
      let _tmp_1 = left.borrow().start;
      expr.borrow_mut().start = _tmp_1;
      let _tmp_2 = left.borrow().line;
      expr.borrow_mut().line = _tmp_2;
      let _tmp_3 = left.borrow().col;
      expr.borrow_mut().col = _tmp_3;
      left = expr.clone();
      cur = self.peekValue();
      nxt = self.peekAheadValue(1);
    };
    left.clone()
  }
  fn parseAdditive(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseMultiplicative();
    let mut tokVal : String = self.peekValue();
    while (tokVal == "+") || (tokVal == "-") {
      let mut opTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseMultiplicative();
      let mut binExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      binExpr.borrow_mut().nodeType = "BinaryExpression".to_string();
      let _tmp_1 = opTok.borrow().value.clone();
      binExpr.borrow_mut().value = _tmp_1;
      binExpr.borrow_mut().left = Some(left.clone());
      binExpr.borrow_mut().right = Some(right.clone());
      let _tmp_2 = left.borrow().start;
      binExpr.borrow_mut().start = _tmp_2;
      let _tmp_3 = left.borrow().line;
      binExpr.borrow_mut().line = _tmp_3;
      let _tmp_4 = left.borrow().col;
      binExpr.borrow_mut().col = _tmp_4;
      left = binExpr.clone();
      tokVal = self.peekValue();
    };
    left.clone()
  }
  fn parseMultiplicative(&mut self) -> Rc<RefCell<TSNode>> {
    let mut left : Rc<RefCell<TSNode>> = self.parseUnary();
    let mut tokVal : String = self.peekValue();
    while (((tokVal == "*") || (tokVal == "/")) || (tokVal == "%")) || (tokVal == "**") {
      let mut opTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut right : Rc<RefCell<TSNode>> = self.parseUnary();
      let mut binExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      binExpr.borrow_mut().nodeType = "BinaryExpression".to_string();
      let _tmp_1 = opTok.borrow().value.clone();
      binExpr.borrow_mut().value = _tmp_1;
      binExpr.borrow_mut().left = Some(left.clone());
      binExpr.borrow_mut().right = Some(right.clone());
      let _tmp_2 = left.borrow().start;
      binExpr.borrow_mut().start = _tmp_2;
      let _tmp_3 = left.borrow().line;
      binExpr.borrow_mut().line = _tmp_3;
      let _tmp_4 = left.borrow().col;
      binExpr.borrow_mut().col = _tmp_4;
      left = binExpr.clone();
      tokVal = self.peekValue();
    };
    left.clone()
  }
  fn parseUnary(&mut self) -> Rc<RefCell<TSNode>> {
    let tokVal : String = self.peekValue();
    let tokIsPunct : bool = self.peekType() == "Punctuator";
    let mut tokIsLiteral : bool = false;
    let tokKindU : String = self.peekType();
    if  tokKindU == "String" {
      tokIsLiteral = true;
    }
    if  tokKindU == "Number" {
      tokIsLiteral = true;
    }
    if  tokKindU == "Boolean" {
      tokIsLiteral = true;
    }
    if  tokKindU == "Null" {
      tokIsLiteral = true;
    }
    if  tokIsPunct && ((tokVal == "++") || (tokVal == "--")) {
      let mut opTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut arg : Rc<RefCell<TSNode>> = self.parseUnary();
      self.checkUpdateTarget(arg.clone());
      let mut update : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      update.borrow_mut().nodeType = "UpdateExpression".to_string();
      let _tmp_1 = opTok.borrow().value.clone();
      update.borrow_mut().value = _tmp_1;
      update.borrow_mut().left = Some(arg.clone());
      update.borrow_mut().prefix = true;
      let _tmp_2 = opTok.borrow().start;
      update.borrow_mut().start = _tmp_2;
      let _tmp_3 = opTok.borrow().line;
      update.borrow_mut().line = _tmp_3;
      let _tmp_4 = opTok.borrow().col;
      update.borrow_mut().col = _tmp_4;
      return update.clone();
    }
    if  tokIsPunct && ((((tokVal == "!") || (tokVal == "-")) || (tokVal == "+")) || (tokVal == "~")) {
      let mut opTok_1 : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut arg_1 : Rc<RefCell<TSNode>> = self.parseUnary();
      let mut unary : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      unary.borrow_mut().nodeType = "UnaryExpression".to_string();
      let _tmp_1 = opTok_1.borrow().value.clone();
      unary.borrow_mut().value = _tmp_1;
      unary.borrow_mut().left = Some(arg_1.clone());
      let _tmp_2 = opTok_1.borrow().start;
      unary.borrow_mut().start = _tmp_2;
      let _tmp_3 = opTok_1.borrow().line;
      unary.borrow_mut().line = _tmp_3;
      let _tmp_4 = opTok_1.borrow().col;
      unary.borrow_mut().col = _tmp_4;
      return unary.clone();
    }
    if  !tokIsPunct {
      if  (false == tokIsLiteral) && (((tokVal == "typeof") || (tokVal == "void")) || (tokVal == "delete")) {
        let opAfter : String = self.peekNextValue();
        if  opAfter == "(" {
          let mut scanIdx : i64 = self.pos + 1;
          let mut depth : i64 = 0;
          let total : i64 = self.tokens.len() as i64;
          while scanIdx < total {
            let mut st : Rc<RefCell<Token>> = self.tokens[(scanIdx) as usize].clone();
            if  st.borrow().tokenType == "Punctuator" {
              if  st.borrow().value == "(" {
                depth += 1;
              }
              if  st.borrow().value == ")" {
                depth -= 1;
                if  depth == 0 {
                  break;
                }
              }
            }
            scanIdx += 1;
          };
          if  (scanIdx + 1) < total {
            let mut afterParen : Rc<RefCell<Token>> = self.tokens[(scanIdx + 1) as usize].clone();
            if  afterParen.borrow().value == "=>" {
              self.syntaxError("Parse error: an arrow function must be parenthesised to be a unary operand".to_string());
            }
          }
        }
      }
    }
    if  (false == tokIsLiteral) && ((tokVal == "void") || (tokVal == "delete")) {
      let mut opTok_2 : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut arg_2 : Rc<RefCell<TSNode>> = self.parseUnary();
      if  tokVal == "delete" {
        if  self.strictMode {
          if  arg_2.borrow().nodeType == "Identifier" {
            self.syntaxError("Parse error: cannot delete an unqualified name in strict mode".to_string());
          }
        }
      }
      let mut unary_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      unary_1.borrow_mut().nodeType = "UnaryExpression".to_string();
      let _tmp_1 = opTok_2.borrow().value.clone();
      unary_1.borrow_mut().value = _tmp_1;
      unary_1.borrow_mut().left = Some(arg_2.clone());
      let _tmp_2 = opTok_2.borrow().start;
      unary_1.borrow_mut().start = _tmp_2;
      let _tmp_3 = opTok_2.borrow().line;
      unary_1.borrow_mut().line = _tmp_3;
      let _tmp_4 = opTok_2.borrow().col;
      unary_1.borrow_mut().col = _tmp_4;
      return unary_1.clone();
    }
    if  (tokVal == "typeof") && (false == tokIsLiteral) {
      let mut opTok_3 : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut arg_3 : Rc<RefCell<TSNode>> = self.parseUnary();
      let mut unary_2 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      unary_2.borrow_mut().nodeType = "UnaryExpression".to_string();
      unary_2.borrow_mut().value = "typeof".to_string();
      unary_2.borrow_mut().left = Some(arg_3.clone());
      let _tmp_1 = opTok_3.borrow().start;
      unary_2.borrow_mut().start = _tmp_1;
      let _tmp_2 = opTok_3.borrow().line;
      unary_2.borrow_mut().line = _tmp_2;
      let _tmp_3 = opTok_3.borrow().col;
      unary_2.borrow_mut().col = _tmp_3;
      return unary_2.clone();
    }
    if  (tokVal == "yield") && (self.inGenerator && (self.peekType() != "String")) {
      let mut yieldTok : Rc<RefCell<Token>> = self.peek();
      if  self.inParamList {
        self.syntaxError("Parse error: a parameter default may not contain a yield expression".to_string());
      }
      self.advance();
      let mut afterYield : Rc<RefCell<Token>> = self.peek();
      if  afterYield.borrow().value == "*" {
        if  afterYield.borrow().line != self.lastTokenLine {
          self.syntaxError("Parse error: no line terminator is allowed between 'yield' and '*'".to_string());
        }
      }
      let mut yieldExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      yieldExpr.borrow_mut().nodeType = "YieldExpression".to_string();
      let _tmp_1 = yieldTok.borrow().start;
      yieldExpr.borrow_mut().start = _tmp_1;
      let _tmp_2 = yieldTok.borrow().line;
      yieldExpr.borrow_mut().line = _tmp_2;
      let _tmp_3 = yieldTok.borrow().col;
      yieldExpr.borrow_mut().col = _tmp_3;
      if  self.matchValue("*".to_string()) {
        self.advance();
        yieldExpr.borrow_mut().delegate = true;
      }
      let nextVal : String = self.peekValue();
      let mut endsYield : bool = false;
      if  nextVal == ";" {
        endsYield = true;
      }
      if  nextVal == "}" {
        endsYield = true;
      }
      if  nextVal == "," {
        endsYield = true;
      }
      if  nextVal == ")" {
        endsYield = true;
      }
      if  nextVal == "]" {
        endsYield = true;
      }
      if  nextVal == ":" {
        endsYield = true;
      }
      if  self.isAtEnd() {
        endsYield = true;
      }
      let mut yieldNextTok : Rc<RefCell<Token>> = self.peek();
      if  yieldNextTok.borrow().line != self.lastTokenLine {
        endsYield = true;
      }
      if  endsYield {
        if  yieldExpr.borrow().delegate {
          self.syntaxError("Parse error: 'yield*' requires an operand".to_string());
        }
      } else {
        yieldExpr.borrow_mut().left = Some(self.parseAssign().clone());
      }
      return yieldExpr.clone();
    }
    if  (tokVal == "await") && (self.peekType() != "String") {
      let mut awaitTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let mut arg_4 : Rc<RefCell<TSNode>> = self.parseUnary();
      let mut awaitExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      awaitExpr.borrow_mut().nodeType = "AwaitExpression".to_string();
      awaitExpr.borrow_mut().left = Some(arg_4.clone());
      let _tmp_1 = awaitTok.borrow().start;
      awaitExpr.borrow_mut().start = _tmp_1;
      let _tmp_2 = awaitTok.borrow().line;
      awaitExpr.borrow_mut().line = _tmp_2;
      let _tmp_3 = awaitTok.borrow().col;
      awaitExpr.borrow_mut().col = _tmp_3;
      return awaitExpr.clone();
    }
    if  (tokVal == "<") && (self.peekType() == "Punctuator") {
      if  self.tsxMode {
        let peekNext : String = self.peekNextValue();
        let peekNextT : String = self.peekNextType();
        if  peekNext == ">" {
          return self.parsePostfix().clone();
        }
        if  peekNextT == "Identifier" {
          let peekTwoAhead : String = self.peekAheadValue(2);
          if  peekTwoAhead != "extends" {
            return self.parsePostfix().clone();
          }
        }
      }
      let mut startTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      let nextType : String = self.peekType();
      if  ((nextType == "Identifier") || (nextType == "Keyword")) || (nextType == "TSType") {
        let mut typeNode : Rc<RefCell<TSNode>> = self.parseType();
        if  self.matchValue(">".to_string()) {
          self.advance();
          let mut arg_5 : Rc<RefCell<TSNode>> = self.parseUnary();
          let mut assertion : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          assertion.borrow_mut().nodeType = "TSTypeAssertion".to_string();
          assertion.borrow_mut().typeAnnotation = Some(typeNode.clone());
          assertion.borrow_mut().left = Some(arg_5.clone());
          let _tmp_1 = startTok.borrow().start;
          assertion.borrow_mut().start = _tmp_1;
          let _tmp_2 = startTok.borrow().line;
          assertion.borrow_mut().line = _tmp_2;
          let _tmp_3 = startTok.borrow().col;
          assertion.borrow_mut().col = _tmp_3;
          return assertion.clone();
        }
      }
    }
    self.parsePostfix().clone()
  }
  fn parsePostfix(&mut self) -> Rc<RefCell<TSNode>> {
    let mut expr : Rc<RefCell<TSNode>> = self.parsePrimary();
    let mut keepParsing : bool = true;
    while keepParsing {
      let mut tokVal : String = self.peekValue();
      if  (tokVal == "<") && (self.peekType() == "Punctuator") {
        let mut shouldParseAsGenericCall : bool = false;
        if  !self.tsxMode {
          let _next1 : String = self.peekAheadValue(1);
          let next2 : String = self.peekAheadValue(2);
          if  ((next2 == ">") || (next2 == ",")) || (next2 == "extends") {
            shouldParseAsGenericCall = true;
          }
        } else {
          if  expr.borrow().nodeType == "Identifier" {
            if  TSParserSimple::startsWithLowerCase(expr.borrow().name.clone()) {
              if  self.looksLikeGenericCall() {
                shouldParseAsGenericCall = true;
              }
            }
          }
          if  expr.borrow().nodeType == "MemberExpression" {
            if  self.looksLikeGenericCall() {
              shouldParseAsGenericCall = true;
            }
          }
        }
        if  shouldParseAsGenericCall {
          self.advance();
          let mut call : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          call.borrow_mut().nodeType = "CallExpression".to_string();
          call.borrow_mut().left = Some(expr.clone());
          let _tmp_1 = expr.borrow().start;
          call.borrow_mut().start = _tmp_1;
          let _tmp_2 = expr.borrow().line;
          call.borrow_mut().line = _tmp_2;
          let _tmp_3 = expr.borrow().col;
          call.borrow_mut().col = _tmp_3;
          while (!(self.matchValue(">".to_string()))) && (!(self.isAtEnd())) {
            if  (call.borrow().params.len() as i64) > 0 {
              self.expectValue(",".to_string());
            }
            let mut typeArg : Rc<RefCell<TSNode>> = self.parseType();
            call.borrow_mut().params.push(typeArg.clone());
          };
          self.expectValue(">".to_string());
          if  self.matchValue("(".to_string()) {
            self.advance();
            while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
              if  (call.borrow().children.len() as i64) > 0 {
                self.expectValue(",".to_string());
              }
              if  self.matchValue("...".to_string()) {
                self.advance();
                let mut spreadArg : Rc<RefCell<TSNode>> = self.parseExpr();
                let mut spread : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
                spread.borrow_mut().nodeType = "SpreadElement".to_string();
                spread.borrow_mut().left = Some(spreadArg.clone());
                call.borrow_mut().children.push(spread.clone());
              } else {
                let mut arg : Rc<RefCell<TSNode>> = self.parseExpr();
                call.borrow_mut().children.push(arg.clone());
              }
            };
            self.expectValue(")".to_string());
            expr = call.clone();
          }
        }
      }
      tokVal = self.peekValue();
      if  tokVal == "(" {
        if  expr.borrow().nodeType == "ArrowFunctionExpression" {
          if  !expr.borrow().parenthesized {
            self.syntaxError("Parse error: an arrow function must be parenthesised to be called".to_string());
          }
        }
        self.advance();
        let mut call_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        call_1.borrow_mut().nodeType = "CallExpression".to_string();
        call_1.borrow_mut().left = Some(expr.clone());
        let _tmp_1 = expr.borrow().start;
        call_1.borrow_mut().start = _tmp_1;
        let _tmp_2 = expr.borrow().line;
        call_1.borrow_mut().line = _tmp_2;
        let _tmp_3 = expr.borrow().col;
        call_1.borrow_mut().col = _tmp_3;
        while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
          if  (call_1.borrow().children.len() as i64) > 0 {
            self.expectValue(",".to_string());
          }
          if  self.matchValue("...".to_string()) {
            self.advance();
            let mut spreadArg_1 : Rc<RefCell<TSNode>> = self.parseExpr();
            let mut spread_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
            spread_1.borrow_mut().nodeType = "SpreadElement".to_string();
            spread_1.borrow_mut().left = Some(spreadArg_1.clone());
            call_1.borrow_mut().children.push(spread_1.clone());
          } else {
            let mut arg_1 : Rc<RefCell<TSNode>> = self.parseExpr();
            call_1.borrow_mut().children.push(arg_1.clone());
          }
        };
        self.expectValue(")".to_string());
        expr = call_1.clone();
      }
      if  tokVal == "." {
        self.advance();
        let mut propTok : Rc<RefCell<Token>> = self.parseMemberName();
        let mut member : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        member.borrow_mut().nodeType = "MemberExpression".to_string();
        member.borrow_mut().left = Some(expr.clone());
        let _tmp_1 = propTok.borrow().value.clone();
        member.borrow_mut().name = _tmp_1;
        let _tmp_2 = expr.borrow().start;
        member.borrow_mut().start = _tmp_2;
        let _tmp_3 = expr.borrow().line;
        member.borrow_mut().line = _tmp_3;
        let _tmp_4 = expr.borrow().col;
        member.borrow_mut().col = _tmp_4;
        expr = member.clone();
      }
      if  tokVal == "?." {
        self.advance();
        let nextTokVal : String = self.peekValue();
        if  nextTokVal == "(" {
          self.advance();
          let mut optCall : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          optCall.borrow_mut().nodeType = "OptionalCallExpression".to_string();
          optCall.borrow_mut().optional = true;
          optCall.borrow_mut().left = Some(expr.clone());
          let _tmp_1 = expr.borrow().start;
          optCall.borrow_mut().start = _tmp_1;
          let _tmp_2 = expr.borrow().line;
          optCall.borrow_mut().line = _tmp_2;
          let _tmp_3 = expr.borrow().col;
          optCall.borrow_mut().col = _tmp_3;
          while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
            if  (optCall.borrow().children.len() as i64) > 0 {
              self.expectValue(",".to_string());
            }
            let mut arg_2 : Rc<RefCell<TSNode>> = self.parseExpr();
            optCall.borrow_mut().children.push(arg_2.clone());
          };
          self.expectValue(")".to_string());
          expr = optCall.clone();
        }
        if  nextTokVal == "[" {
          self.advance();
          let mut indexExpr : Rc<RefCell<TSNode>> = self.parseExpr();
          self.expectValue("]".to_string());
          let mut optIndex : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          optIndex.borrow_mut().nodeType = "OptionalMemberExpression".to_string();
          optIndex.borrow_mut().optional = true;
          optIndex.borrow_mut().left = Some(expr.clone());
          optIndex.borrow_mut().right = Some(indexExpr.clone());
          let _tmp_1 = expr.borrow().start;
          optIndex.borrow_mut().start = _tmp_1;
          let _tmp_2 = expr.borrow().line;
          optIndex.borrow_mut().line = _tmp_2;
          let _tmp_3 = expr.borrow().col;
          optIndex.borrow_mut().col = _tmp_3;
          expr = optIndex.clone();
        }
        if  self.isNameToken() {
          let mut propTok_1 : Rc<RefCell<Token>> = self.parseMemberName();
          let mut optMember : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          optMember.borrow_mut().nodeType = "OptionalMemberExpression".to_string();
          optMember.borrow_mut().optional = true;
          optMember.borrow_mut().left = Some(expr.clone());
          let _tmp_1 = propTok_1.borrow().value.clone();
          optMember.borrow_mut().name = _tmp_1;
          let _tmp_2 = expr.borrow().start;
          optMember.borrow_mut().start = _tmp_2;
          let _tmp_3 = expr.borrow().line;
          optMember.borrow_mut().line = _tmp_3;
          let _tmp_4 = expr.borrow().col;
          optMember.borrow_mut().col = _tmp_4;
          expr = optMember.clone();
        }
      }
      if  tokVal == "[" {
        self.advance();
        let mut indexExpr_1 : Rc<RefCell<TSNode>> = self.parseExprSeq();
        self.expectValue("]".to_string());
        let mut computed : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        computed.borrow_mut().nodeType = "MemberExpression".to_string();
        computed.borrow_mut().computed = true;
        computed.borrow_mut().left = Some(expr.clone());
        computed.borrow_mut().right = Some(indexExpr_1.clone());
        let _tmp_1 = expr.borrow().start;
        computed.borrow_mut().start = _tmp_1;
        let _tmp_2 = expr.borrow().line;
        computed.borrow_mut().line = _tmp_2;
        let _tmp_3 = expr.borrow().col;
        computed.borrow_mut().col = _tmp_3;
        expr = computed.clone();
      }
      if  tokVal == "!" {
        let mut tok : Rc<RefCell<Token>> = self.peek();
        self.advance();
        let mut nonNull : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        nonNull.borrow_mut().nodeType = "TSNonNullExpression".to_string();
        nonNull.borrow_mut().left = Some(expr.clone());
        let _tmp_1 = expr.borrow().start;
        nonNull.borrow_mut().start = _tmp_1;
        let _tmp_2 = expr.borrow().line;
        nonNull.borrow_mut().line = _tmp_2;
        let _tmp_3 = tok.borrow().col;
        nonNull.borrow_mut().col = _tmp_3;
        expr = nonNull.clone();
      }
      if  tokVal == "as" {
        self.advance();
        let mut asType : Rc<RefCell<TSNode>> = self.parseType();
        let mut assertion : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        assertion.borrow_mut().nodeType = "TSAsExpression".to_string();
        assertion.borrow_mut().left = Some(expr.clone());
        assertion.borrow_mut().typeAnnotation = Some(asType.clone());
        let _tmp_1 = expr.borrow().start;
        assertion.borrow_mut().start = _tmp_1;
        let _tmp_2 = expr.borrow().line;
        assertion.borrow_mut().line = _tmp_2;
        let _tmp_3 = expr.borrow().col;
        assertion.borrow_mut().col = _tmp_3;
        expr = assertion.clone();
      }
      if  tokVal == "satisfies" {
        self.advance();
        let mut satisfiesType : Rc<RefCell<TSNode>> = self.parseType();
        let mut satisfiesExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        satisfiesExpr.borrow_mut().nodeType = "TSSatisfiesExpression".to_string();
        satisfiesExpr.borrow_mut().left = Some(expr.clone());
        satisfiesExpr.borrow_mut().typeAnnotation = Some(satisfiesType.clone());
        let _tmp_1 = expr.borrow().start;
        satisfiesExpr.borrow_mut().start = _tmp_1;
        let _tmp_2 = expr.borrow().line;
        satisfiesExpr.borrow_mut().line = _tmp_2;
        let _tmp_3 = expr.borrow().col;
        satisfiesExpr.borrow_mut().col = _tmp_3;
        expr = satisfiesExpr.clone();
      }
      if  self.peekType() == "Template" {
        if  expr.borrow().nodeType == "UpdateExpression" {
          self.syntaxError("Parse error: an update expression cannot tag a template".to_string());
        }
      }
      let tokType : String = self.peekType();
      if  tokType == "Template" {
        let mut quasi : Rc<RefCell<TSNode>> = self.parseTemplateLiteral();
        let mut tagged : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        tagged.borrow_mut().nodeType = "TaggedTemplateExpression".to_string();
        tagged.borrow_mut().left = Some(expr.clone());
        tagged.borrow_mut().right = Some(quasi.clone());
        let _tmp_1 = expr.borrow().start;
        tagged.borrow_mut().start = _tmp_1;
        let _tmp_2 = expr.borrow().line;
        tagged.borrow_mut().line = _tmp_2;
        let _tmp_3 = expr.borrow().col;
        tagged.borrow_mut().col = _tmp_3;
        expr = tagged.clone();
      }
      if  (tokVal == "++") || (tokVal == "--") {
        let mut opTok : Rc<RefCell<Token>> = self.peek();
        if  opTok.borrow().line != self.lastTokenLine {
          keepParsing = false;
          break;
        }
        self.checkUpdateTarget(expr.clone());
        self.advance();
        let mut update : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        update.borrow_mut().nodeType = "UpdateExpression".to_string();
        let _tmp_1 = opTok.borrow().value.clone();
        update.borrow_mut().value = _tmp_1;
        update.borrow_mut().left = Some(expr.clone());
        update.borrow_mut().prefix = false;
        let _tmp_2 = expr.borrow().start;
        update.borrow_mut().start = _tmp_2;
        let _tmp_3 = expr.borrow().line;
        update.borrow_mut().line = _tmp_3;
        let _tmp_4 = expr.borrow().col;
        update.borrow_mut().col = _tmp_4;
        expr = update.clone();
      }
      let newTokVal : String = self.peekValue();
      let newTokType : String = self.peekType();
      if  (((((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies")) && (newTokVal != "++")) && (newTokVal != "--")) && (newTokType != "Template") {
        keepParsing = false;
      }
    };
    expr.clone()
  }
  fn parsePrimary(&mut self) -> Rc<RefCell<TSNode>> {
    let tokType : String = self.peekType();
    let tokVal : String = self.peekValue();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    if  (((tokType == "Identifier") || (tokType == "TSType")) || (tokType == "Keyword")) || (tokType == "TSKeyword") {
      if  self.peekNextValue() == "=>" {
        return self.parseArrowFunction().clone();
      }
    }
    if  (tokType == "Identifier") || (tokType == "TSType") {
      if  self.strictMode {
        if  self.isStrictReservedReference(tok.borrow().value.clone()) {
          let __arg_0 = format!("Parse error: '{}' is reserved in strict mode", tok.borrow().value).clone();
          self.syntaxError(__arg_0);
        }
      }
      self.advance();
      let mut id : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      id.borrow_mut().nodeType = "Identifier".to_string();
      let _tmp_1 = tok.borrow().value.clone();
      id.borrow_mut().name = _tmp_1;
      let _tmp_2 = tok.borrow().start;
      id.borrow_mut().start = _tmp_2;
      let _tmp_3 = tok.borrow().end;
      id.borrow_mut().end = _tmp_3;
      let _tmp_4 = tok.borrow().line;
      id.borrow_mut().line = _tmp_4;
      let _tmp_5 = tok.borrow().col;
      id.borrow_mut().col = _tmp_5;
      return id.clone();
    }
    if  tokType == "Number" {
      if  self.strictMode {
        if  tok.borrow().legacyOctal {
          self.syntaxError("Parse error: a leading-zero numeric literal is not allowed in strict mode".to_string());
        }
      }
      self.advance();
      let mut num : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      num.borrow_mut().nodeType = "NumericLiteral".to_string();
      let _tmp_1 = tok.borrow().value.clone();
      num.borrow_mut().value = _tmp_1;
      let _tmp_2 = tok.borrow().start;
      num.borrow_mut().start = _tmp_2;
      let _tmp_3 = tok.borrow().end;
      num.borrow_mut().end = _tmp_3;
      let _tmp_4 = tok.borrow().line;
      num.borrow_mut().line = _tmp_4;
      let _tmp_5 = tok.borrow().col;
      num.borrow_mut().col = _tmp_5;
      return num.clone();
    }
    if  tokType == "BigInt" {
      self.advance();
      let mut bigint : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      bigint.borrow_mut().nodeType = "BigIntLiteral".to_string();
      let _tmp_1 = tok.borrow().value.clone();
      bigint.borrow_mut().value = _tmp_1;
      let _tmp_2 = tok.borrow().start;
      bigint.borrow_mut().start = _tmp_2;
      let _tmp_3 = tok.borrow().end;
      bigint.borrow_mut().end = _tmp_3;
      let _tmp_4 = tok.borrow().line;
      bigint.borrow_mut().line = _tmp_4;
      let _tmp_5 = tok.borrow().col;
      bigint.borrow_mut().col = _tmp_5;
      return bigint.clone();
    }
    if  tokType == "String" {
      if  self.strictMode {
        if  tok.borrow().legacyOctal {
          self.syntaxError("Parse error: octal escape sequences are not allowed in strict mode".to_string());
        }
      }
      self.advance();
      let mut str : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      str.borrow_mut().nodeType = "StringLiteral".to_string();
      let _tmp_1 = tok.borrow().value.clone();
      str.borrow_mut().value = _tmp_1;
      let _tmp_2 = tok.borrow().hasEscape;
      str.borrow_mut().hasEscape = _tmp_2;
      let _tmp_3 = tok.borrow().start;
      str.borrow_mut().start = _tmp_3;
      let _tmp_4 = tok.borrow().end;
      str.borrow_mut().end = _tmp_4;
      let _tmp_5 = tok.borrow().line;
      str.borrow_mut().line = _tmp_5;
      let _tmp_6 = tok.borrow().col;
      str.borrow_mut().col = _tmp_6;
      return str.clone();
    }
    if  tokType == "Template" {
      return self.parseTemplateLiteral().clone();
    }
    if  (tokVal == "true") || (tokVal == "false") {
      self.advance();
      let mut r#bool : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      r#bool.borrow_mut().nodeType = "BooleanLiteral".to_string();
      r#bool.borrow_mut().value = tokVal.clone();
      let _tmp_1 = tok.borrow().start;
      r#bool.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      r#bool.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      r#bool.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      r#bool.borrow_mut().col = _tmp_4;
      return r#bool.clone();
    }
    if  tokVal == "null" {
      self.advance();
      let mut nullLit : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      nullLit.borrow_mut().nodeType = "NullLiteral".to_string();
      let _tmp_1 = tok.borrow().start;
      nullLit.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      nullLit.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      nullLit.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      nullLit.borrow_mut().col = _tmp_4;
      return nullLit.clone();
    }
    if  tokVal == "undefined" {
      self.advance();
      let mut undefId : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      undefId.borrow_mut().nodeType = "Identifier".to_string();
      undefId.borrow_mut().name = "undefined".to_string();
      let _tmp_1 = tok.borrow().start;
      undefId.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      undefId.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      undefId.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      undefId.borrow_mut().col = _tmp_4;
      return undefId.clone();
    }
    if  tokVal == "[" {
      let arrSavedPos : i64 = self.pos;
      let mut arrSavedTok : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
      let arrSavedErrors : i64 = self.errorCount;
      self.speculating += 1;
      let savedArrMemberTarget : bool = self.patternAllowsMemberTarget;
      self.patternAllowsMemberTarget = true;
      let mut arrPat : Rc<RefCell<TSNode>> = self.parseArrayPattern();
      self.patternAllowsMemberTarget = savedArrMemberTarget;
      self.speculating -= 1;
      let arrPatErrors : i64 = self.errorCount;
      if  self.errorCount == arrSavedErrors {
        if  self.isAssignmentPatternFollow() {
          return arrPat.clone();
        }
      }
      self.pos = arrSavedPos;
      self.currentToken = Some(arrSavedTok.clone());
      self.errorCount = arrSavedErrors;
      let mut arrLit : Rc<RefCell<TSNode>> = self.parseArrayLiteral();
      if  self.isAssignmentPatternFollow() {
        if  arrPatErrors > arrSavedErrors {
          self.errorCount = arrPatErrors;
        }
      }
      return arrLit.clone();
    }
    if  tokVal == "{" {
      let objSavedPos : i64 = self.pos;
      let mut objSavedTok : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
      let objSavedErrors : i64 = self.errorCount;
      self.speculating += 1;
      let savedObjMemberTarget : bool = self.patternAllowsMemberTarget;
      self.patternAllowsMemberTarget = true;
      let mut objPat : Rc<RefCell<TSNode>> = self.parseObjectPattern();
      self.patternAllowsMemberTarget = savedObjMemberTarget;
      self.speculating -= 1;
      let objPatErrors : i64 = self.errorCount;
      if  self.errorCount == objSavedErrors {
        if  self.isAssignmentPatternFollow() {
          return objPat.clone();
        }
      }
      self.pos = objSavedPos;
      self.currentToken = Some(objSavedTok.clone());
      self.errorCount = objSavedErrors;
      let mut objLit : Rc<RefCell<TSNode>> = self.parseObjectLiteral();
      if  self.isAssignmentPatternFollow() {
        if  objPatErrors > objSavedErrors {
          self.errorCount = objPatErrors;
        }
      }
      return objLit.clone();
    }
    if  (self.tsxMode) && (tokVal == "<") {
      let nextType : String = self.peekNextType();
      let nextVal : String = self.peekNextValue();
      if  nextVal == ">" {
        return self.parseJSXFragment().clone();
      }
      if  (nextType == "Identifier") || (nextType == "Keyword") {
        let peekTwoAhead : String = self.peekAheadValue(2);
        if  peekTwoAhead != "extends" {
          return self.parseJSXElement().clone();
        }
      }
    }
    if  tokVal == "(" {
      return self.parseParenOrArrow().clone();
    }
    if  tokVal == "async" {
      let nextVal_1 : String = self.peekNextValue();
      let nextType_1 : String = self.peekNextType();
      if  (nextVal_1 == "(") || (nextType_1 == "Identifier") {
        return self.parseArrowFunction().clone();
      }
    }
    if  tokVal == "new" {
      return self.parseNewExpression().clone();
    }
    if  tokVal == "import" {
      let mut importTok : Rc<RefCell<Token>> = self.peek();
      self.advance();
      if  self.matchValue(".".to_string()) {
        self.advance();
        if  self.matchValue("meta".to_string()) {
          self.advance();
          let mut metaProp : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          metaProp.borrow_mut().nodeType = "MetaProperty".to_string();
          metaProp.borrow_mut().name = "import".to_string();
          metaProp.borrow_mut().value = "meta".to_string();
          let _tmp_1 = importTok.borrow().start;
          metaProp.borrow_mut().start = _tmp_1;
          let _tmp_2 = importTok.borrow().line;
          metaProp.borrow_mut().line = _tmp_2;
          let _tmp_3 = importTok.borrow().col;
          metaProp.borrow_mut().col = _tmp_3;
          return metaProp.clone();
        }
      }
      if  self.matchValue("(".to_string()) {
        self.advance();
        let mut source : Rc<RefCell<TSNode>> = self.parseExpr();
        self.expectValue(")".to_string());
        let mut importExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        importExpr.borrow_mut().nodeType = "ImportExpression".to_string();
        importExpr.borrow_mut().left = Some(source.clone());
        let _tmp_1 = importTok.borrow().start;
        importExpr.borrow_mut().start = _tmp_1;
        let _tmp_2 = importTok.borrow().line;
        importExpr.borrow_mut().line = _tmp_2;
        let _tmp_3 = importTok.borrow().col;
        importExpr.borrow_mut().col = _tmp_3;
        return importExpr.clone();
      }
    }
    if  tokType == "Regex" {
      self.advance();
      let mut re : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      re.borrow_mut().nodeType = "RegExpLiteral".to_string();
      let _tmp_1 = tok.borrow().value.clone();
      re.borrow_mut().value = _tmp_1;
      let _tmp_2 = tok.borrow().start;
      re.borrow_mut().start = _tmp_2;
      let _tmp_3 = tok.borrow().end;
      re.borrow_mut().end = _tmp_3;
      let _tmp_4 = tok.borrow().line;
      re.borrow_mut().line = _tmp_4;
      let _tmp_5 = tok.borrow().col;
      re.borrow_mut().col = _tmp_5;
      return re.clone();
    }
    if  tokVal == "function" {
      self.parsingFunctionExpression = true;
      let mut fnExpr : Rc<RefCell<TSNode>> = self.parseFuncDecl(false);
      fnExpr.borrow_mut().nodeType = "FunctionExpression".to_string();
      return fnExpr.clone();
    }
    if  tokVal == "async" {
      if  self.peekNextValue() == "function" {
        self.advance();
        self.parsingFunctionExpression = true;
        let mut asyncFnExpr : Rc<RefCell<TSNode>> = self.parseFuncDecl(true);
        asyncFnExpr.borrow_mut().nodeType = "FunctionExpression".to_string();
        return asyncFnExpr.clone();
      }
    }
    if  tokVal == "class" {
      let mut clsExpr : Rc<RefCell<TSNode>> = self.parseClass();
      clsExpr.borrow_mut().nodeType = "ClassExpression".to_string();
      return clsExpr.clone();
    }
    if  tokVal == "super" {
      let afterSuper : String = self.peekNextValue();
      if  afterSuper == "(" {
        if  !self.allowSuperCall {
          self.syntaxError("Parse error: 'super()' is only valid in a derived class constructor".to_string());
        }
      } else {
        if  (afterSuper == ".") || (afterSuper == "[") {
          if  !self.allowSuperProperty {
            self.syntaxError("Parse error: 'super' property access is only valid in a method".to_string());
          }
        } else {
          self.syntaxError("Parse error: 'super' must be called or have a property accessed".to_string());
        }
      }
      self.advance();
      let mut superExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      superExpr.borrow_mut().nodeType = "Super".to_string();
      let _tmp_1 = tok.borrow().start;
      superExpr.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      superExpr.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      superExpr.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      superExpr.borrow_mut().col = _tmp_4;
      return superExpr.clone();
    }
    if  tokVal == "this" {
      self.advance();
      let mut thisExpr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      thisExpr.borrow_mut().nodeType = "ThisExpression".to_string();
      let _tmp_1 = tok.borrow().start;
      thisExpr.borrow_mut().start = _tmp_1;
      let _tmp_2 = tok.borrow().end;
      thisExpr.borrow_mut().end = _tmp_2;
      let _tmp_3 = tok.borrow().line;
      thisExpr.borrow_mut().line = _tmp_3;
      let _tmp_4 = tok.borrow().col;
      thisExpr.borrow_mut().col = _tmp_4;
      return thisExpr.clone();
    }
    if  tokType == "Punctuator" {
      if  tokVal == "*" {
        self.syntaxError("Parse error: '*' cannot start an expression".to_string());
        self.advance();
        let mut starErr : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        starErr.borrow_mut().nodeType = "Identifier".to_string();
        starErr.borrow_mut().name = "error".to_string();
        return starErr.clone();
      }
    }
    if  tokType == "TSKeyword" {
      if  self.strictMode {
        if  self.isStrictReservedReference(tokVal.clone()) {
          self.syntaxError(format!("Parse error: '{}' is reserved in strict mode", tokVal));
        }
      }
      self.advance();
      let mut tsId : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      tsId.borrow_mut().nodeType = "Identifier".to_string();
      let _tmp_1 = tok.borrow().value.clone();
      tsId.borrow_mut().name = _tmp_1;
      let _tmp_2 = tok.borrow().start;
      tsId.borrow_mut().start = _tmp_2;
      let _tmp_3 = tok.borrow().end;
      tsId.borrow_mut().end = _tmp_3;
      let _tmp_4 = tok.borrow().line;
      tsId.borrow_mut().line = _tmp_4;
      let _tmp_5 = tok.borrow().col;
      tsId.borrow_mut().col = _tmp_5;
      return tsId.clone();
    }
    if  tokType == "Keyword" {
      let mut contextual : bool = false;
      if  tokVal == "let" {
        contextual = true;
      }
      if  tokVal == "yield" {
        contextual = true;
      }
      if  tokVal == "await" {
        contextual = true;
      }
      if  tokVal == "of" {
        contextual = true;
      }
      if  tokVal == "static" {
        contextual = true;
      }
      if  tokVal == "as" {
        contextual = true;
      }
      if  tokVal == "from" {
        contextual = true;
      }
      if  tokVal == "implements" {
        contextual = true;
      }
      if  tokVal == "interface" {
        contextual = true;
      }
      if  tokVal == "package" {
        contextual = true;
      }
      if  tokVal == "private" {
        contextual = true;
      }
      if  tokVal == "protected" {
        contextual = true;
      }
      if  tokVal == "public" {
        contextual = true;
      }
      if  contextual {
        if  self.noLetReference {
          if  tokVal == "let" {
            self.syntaxError("Parse error: 'let' cannot be referenced inside a lexical declaration".to_string());
          }
        }
        if  self.strictMode {
          if  self.isStrictReservedReference(tokVal.clone()) {
            self.syntaxError(format!("Parse error: '{}' is reserved in strict mode", tokVal));
          }
        }
        if  self.inGenerator {
          if  tokVal == "yield" {
            self.syntaxError("Parse error: 'yield' is reserved inside a generator".to_string());
          }
        }
        self.advance();
        let mut ctxId : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        ctxId.borrow_mut().nodeType = "Identifier".to_string();
        let _tmp_1 = tok.borrow().value.clone();
        ctxId.borrow_mut().name = _tmp_1;
        let _tmp_2 = tok.borrow().start;
        ctxId.borrow_mut().start = _tmp_2;
        let _tmp_3 = tok.borrow().end;
        ctxId.borrow_mut().end = _tmp_3;
        let _tmp_4 = tok.borrow().line;
        ctxId.borrow_mut().line = _tmp_4;
        let _tmp_5 = tok.borrow().col;
        ctxId.borrow_mut().col = _tmp_5;
        return ctxId.clone();
      }
    }
    self.syntaxError(format!("Unexpected token: {}", tokVal));
    self.advance();
    let mut errId : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    errId.borrow_mut().nodeType = "Identifier".to_string();
    errId.borrow_mut().name = "error".to_string();
    errId.clone()
  }
  fn parseTemplateLiteral(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "TemplateLiteral".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.advance();
    let mut quasi : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    quasi.borrow_mut().nodeType = "TemplateElement".to_string();
    let _tmp_4 = tok.borrow().value.clone();
    quasi.borrow_mut().value = _tmp_4;
    node.borrow_mut().children.push(quasi.clone());
    node.clone()
  }
  fn parseArrayLiteral(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ArrayExpression".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("[".to_string());
    while (!(self.matchValue("]".to_string()))) && (!(self.isAtEnd())) {
      if  self.matchValue("...".to_string()) {
        self.advance();
        let mut spreadArg : Rc<RefCell<TSNode>> = self.parseExpr();
        let mut spread : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        spread.borrow_mut().nodeType = "SpreadElement".to_string();
        spread.borrow_mut().left = Some(spreadArg.clone());
        node.borrow_mut().children.push(spread.clone());
      } else {
        if  self.matchValue(",".to_string()) {
          let mut holeTok : Rc<RefCell<Token>> = self.peek();
          let mut hole : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          hole.borrow_mut().nodeType = "ArrayHole".to_string();
          let _tmp_1 = holeTok.borrow().start;
          hole.borrow_mut().start = _tmp_1;
          let _tmp_2 = holeTok.borrow().line;
          hole.borrow_mut().line = _tmp_2;
          let _tmp_3 = holeTok.borrow().col;
          hole.borrow_mut().col = _tmp_3;
          node.borrow_mut().children.push(hole.clone());
        } else {
          let mut elem : Rc<RefCell<TSNode>> = self.parseExpr();
          node.borrow_mut().children.push(elem.clone());
        }
      }
      if  self.matchValue(",".to_string()) {
        self.advance();
      } else {
        if  !(self.matchValue("]".to_string())) {
          if  !(self.isAtEnd()) {
            let mut badArrTok : Rc<RefCell<Token>> = self.peek();
            let __arg_0 = format!("Parse error: expected ',' or ']' in array literal but got '{}'", badArrTok.borrow().value).clone();
            self.syntaxError(__arg_0);
            return node.clone();
          }
        }
      }
    };
    self.expectValue("]".to_string());
    node.clone()
  }
  fn parseObjectLiteral(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ObjectExpression".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("{".to_string());
    let mut sawProto : bool = false;
    while (!(self.matchValue("}".to_string()))) && (!(self.isAtEnd())) {
      let loopStartPos : i64 = self.pos;
      if  self.matchValue("...".to_string()) {
        self.advance();
        let mut spreadArg : Rc<RefCell<TSNode>> = self.parseExpr();
        let mut spread : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        spread.borrow_mut().nodeType = "SpreadElement".to_string();
        spread.borrow_mut().left = Some(spreadArg.clone());
        node.borrow_mut().children.push(spread.clone());
      } else {
        let mut prop : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        prop.borrow_mut().nodeType = "Property".to_string();
        let mut propStartTok : Rc<RefCell<Token>> = self.peek();
        let _tmp_1 = propStartTok.borrow().start;
        prop.borrow_mut().start = _tmp_1;
        let mut isComputed : bool = false;
        let mut isMethod : bool = false;
        let mut isGetter : bool = false;
        let mut isSetter : bool = false;
        let mut currVal : String = self.peekValue();
        let mut nextType : String = self.peekNextType();
        let mut nextVal : String = self.peekNextValue();
        if  currVal == "async" {
          if  ((nextType == "Identifier") || (nextVal == "[")) || (nextVal == "(") {
            self.advance();
            prop.borrow_mut().r#async = true;
            currVal = self.peekValue();
            nextType = self.peekNextType();
            nextVal = self.peekNextValue();
          }
        }
        if  currVal == "*" {
          self.advance();
          prop.borrow_mut().generator = true;
          currVal = self.peekValue();
          nextType = self.peekNextType();
          nextVal = self.peekNextValue();
          let mut starNameOk : bool = false;
          if  self.isMemberKeyToken() {
            starNameOk = true;
          }
          if  currVal == "[" {
            starNameOk = true;
          }
          if  !starNameOk {
            self.syntaxError("Parse error: '*' must be followed by a method name".to_string());
          } else {
            if  currVal == "[" {
              let mut scanIdx : i64 = self.pos + 1;
              let mut depth : i64 = 1;
              let total : i64 = self.tokens.len() as i64;
              while scanIdx < total {
                let mut st : Rc<RefCell<Token>> = self.tokens[(scanIdx) as usize].clone();
                if  st.borrow().tokenType == "Punctuator" {
                  if  st.borrow().value == "[" {
                    depth += 1;
                  }
                  if  st.borrow().value == "]" {
                    depth -= 1;
                    if  depth == 0 {
                      break;
                    }
                  }
                }
                scanIdx += 1;
              };
              if  (scanIdx + 1) < total {
                let mut afterKey : Rc<RefCell<Token>> = self.tokens[(scanIdx + 1) as usize].clone();
                if  afterKey.borrow().value != "(" {
                  self.syntaxError("Parse error: a generator property must be a method".to_string());
                }
              }
            } else {
              if  nextVal != "(" {
                self.syntaxError("Parse error: a generator property must be a method".to_string());
              }
            }
          }
        }
        if  currVal == "get" {
          if  ((nextType == "Identifier") || (nextVal == "[")) || self.isAccessorNameAhead() {
            self.advance();
            isGetter = true;
            prop.borrow_mut().kind = "get".to_string();
          }
        }
        if  currVal == "set" {
          if  ((nextType == "Identifier") || (nextVal == "[")) || self.isAccessorNameAhead() {
            self.advance();
            isSetter = true;
            prop.borrow_mut().kind = "set".to_string();
          }
        }
        let mut keyTok : Rc<RefCell<Token>> = self.peek();
        if  self.matchPunct("[".to_string()) {
          self.advance();
          let mut keyExpr : Rc<RefCell<TSNode>> = self.parseExpr();
          self.expectValue("]".to_string());
          prop.borrow_mut().right = Some(keyExpr.clone());
          isComputed = true;
          prop.borrow_mut().computed = true;
        }
        if  self.isObjectPropertyKeyToken() {
          if  self.strictMode {
            if  keyTok.borrow().legacyOctal {
              self.syntaxError("Parse error: a leading-zero numeric key is not allowed in strict mode".to_string());
            }
          }
          let _tmp_1 = keyTok.borrow().value.clone();
          prop.borrow_mut().name = _tmp_1;
          self.advance();
        } else {
          if  isComputed {
            let afterComputed : String = self.peekValue();
            if  (afterComputed != ":") && (afterComputed != "(") {
              self.syntaxError("Parse error: a computed property needs a value".to_string());
            }
          } else {
            if  self.matchValue("(".to_string()) {
              self.syntaxError("Parse error: a property key cannot be parenthesised".to_string());
            }
          }
        }
        if  self.matchValue("(".to_string()) {
          isMethod = true;
          prop.borrow_mut().method = true;
          let mut fnNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          fnNode.borrow_mut().nodeType = "FunctionExpression".to_string();
          let _tmp_1 = prop.borrow().start;
          fnNode.borrow_mut().start = _tmp_1;
          self.advance();
          self.pushScope(true);
          self.functionDepth += 1;
          let savedObjRest : bool = self.sawRestParam;
          self.sawRestParam = false;
          let savedObjGenerator : bool = self.inGenerator;
          self.inGenerator = prop.borrow().generator;
          let savedObjSuperCall : bool = self.allowSuperCall;
          let savedObjSuperProp : bool = self.allowSuperProperty;
          let savedobjIter : i64 = self.iterationDepth;
          let savedobjSwitch : i64 = self.switchDepth;
          let mut savedobjLabels : Vec<String> = self.activeLabels.clone();
          let mut savedobjIterLabels : Vec<String> = self.iterationLabels.clone();
          let mut freshobjLabels : Vec<String> = Vec::new();
          let mut freshobjIterLabels : Vec<String> = Vec::new();
          self.iterationDepth = 0;
          self.switchDepth = 0;
          self.activeLabels = freshobjLabels.clone();
          self.iterationLabels = freshobjIterLabels.clone();
          self.allowSuperCall = false;
          self.allowSuperProperty = true;
          while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
            if  (fnNode.borrow().params.len() as i64) > 0 {
              self.expectValue(",".to_string());
            }
            let mut mParam : Rc<RefCell<TSNode>> = self.parseParam();
            if  (mParam.borrow().name.chars().count() as i64) > 0 {
              let __arg_0 = mParam.borrow().name.clone();
              self.declareBinding("p".to_string(), __arg_0);
            }
            fnNode.borrow_mut().params.push(mParam.clone());
          };
          self.expectValue(")".to_string());
          if  isGetter {
            if  (fnNode.borrow().params.len() as i64) != 0 {
              self.syntaxError("Parse error: a getter takes no parameters".to_string());
            }
          }
          if  isSetter {
            if  (fnNode.borrow().params.len() as i64) != 1 {
              self.syntaxError("Parse error: a setter takes exactly one parameter".to_string());
            } else {
              let mut setParam : Rc<RefCell<TSNode>> = fnNode.borrow().params[0].clone();
              if  setParam.borrow().nodeType == "RestElement" {
                self.syntaxError("Parse error: a setter parameter may not be a rest element".to_string());
              }
            }
          }
          if  self.matchValue(":".to_string()) {
            self.advance();
            fnNode.borrow_mut().typeAnnotation = Some(self.parseType().clone());
          }
          if  self.matchValue("{".to_string()) {
            self.suppressBlockScope = true;
            let mut objMethodBody : Rc<RefCell<TSNode>> = self.parseBlock();
            fnNode.borrow_mut().body = Some(objMethodBody.clone());
            let _tmp_1 = objMethodBody.borrow().end;
            fnNode.borrow_mut().end = _tmp_1;
            if  self.lastBlockEnabledStrict {
              let __arg_0 = prop.borrow().name.clone();
              let __arg_1 = fnNode.borrow().params.clone();
              self.recheckStrictSignature(__arg_0, &__arg_1);
            }
          }
          self.popScope();
          self.allowSuperCall = savedObjSuperCall;
          self.allowSuperProperty = savedObjSuperProp;
          self.inGenerator = savedObjGenerator;
          self.sawRestParam = savedObjRest;
          self.functionDepth -= 1;
          self.iterationDepth = savedobjIter;
          self.switchDepth = savedobjSwitch;
          self.activeLabels = savedobjLabels.clone();
          self.iterationLabels = savedobjIterLabels.clone();
          prop.borrow_mut().left = Some(fnNode.clone());
          if  (!isGetter) && (!isSetter) {
            prop.borrow_mut().kind = "init".to_string();
          }
        }
        if  !isMethod {
          if  self.matchValue(":".to_string()) {
            self.advance();
            let mut valueExpr : Rc<RefCell<TSNode>> = self.parseExpr();
            prop.borrow_mut().left = Some(valueExpr.clone());
            prop.borrow_mut().kind = "init".to_string();
          } else {
            if  !isComputed {
              if  (keyTok.borrow().tokenType == "Number") || (keyTok.borrow().tokenType == "String") {
                self.syntaxError("Parse error: a shorthand property name cannot be a literal".to_string());
              }
              if  TSParserSimple::isAlwaysReservedWord(prop.borrow().name.clone()) {
                let __arg_0 = format!("Parse error: '{}' cannot be a shorthand property name", prop.borrow().name).clone();
                self.syntaxError(__arg_0);
              }
              if  self.strictMode {
                if  self.isStrictReservedReference(prop.borrow().name.clone()) {
                  let __arg_0 = format!("Parse error: '{}' is reserved in strict mode", prop.borrow().name).clone();
                  self.syntaxError(__arg_0);
                }
              }
              let mut shorthandVal : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
              shorthandVal.borrow_mut().nodeType = "Identifier".to_string();
              let _tmp_1 = prop.borrow().name.clone();
              shorthandVal.borrow_mut().name = _tmp_1;
              prop.borrow_mut().left = Some(shorthandVal.clone());
              prop.borrow_mut().shorthand = true;
              prop.borrow_mut().kind = "init".to_string();
            }
          }
        }
        if  prop.borrow().name == "__proto__" {
          if  !prop.borrow().shorthand {
            if  !prop.borrow().computed {
              if  !prop.borrow().method {
                if  (prop.borrow().kind != "get") && (prop.borrow().kind != "set") {
                  if  sawProto {
                    self.syntaxError("Parse error: duplicate __proto__ in an object literal".to_string());
                  }
                  sawProto = true;
                }
              }
            }
          }
        }
        node.borrow_mut().children.push(prop.clone());
      }
      if  self.matchValue(",".to_string()) {
        self.advance();
      } else {
        if  !(self.matchValue("}".to_string())) {
          if  !(self.isAtEnd()) {
            let mut badObjTok : Rc<RefCell<Token>> = self.peek();
            let __arg_0 = format!("{}{}'", "Parse error: expected ',' or '}' in object literal but got '".to_string(), badObjTok.borrow().value).clone();
            self.syntaxError(__arg_0);
            return node.clone();
          }
        }
      }
      if  self.pos == loopStartPos {
        break;
      }
    };
    self.expectValue("}".to_string());
    node.clone()
  }
  fn parseParenOrArrow(&mut self) -> Rc<RefCell<TSNode>> {
    let mut _startTok : Rc<RefCell<Token>> = self.peek();
    let savedPos : i64 = self.pos;
    let mut savedTok : Rc<RefCell<Token>> = self.currentToken.clone().unwrap();
    self.advance();
    let mut parenDepth : i64 = 1;
    while (parenDepth > 0) && (!(self.isAtEnd())) {
      if  self.matchPunct("(".to_string()) {
        parenDepth += 1;
      }
      if  self.matchPunct(")".to_string()) {
        parenDepth -= 1;
      }
      if  parenDepth > 0 {
        self.advance();
      }
    };
    if  !(self.matchValue(")".to_string())) {
      self.pos = savedPos;
      self.currentToken = Some(savedTok.clone());
      self.advance();
      let mut expr : Rc<RefCell<TSNode>> = self.parseExprSeq();
      self.expectValue(")".to_string());
      return expr.clone();
    }
    self.advance();
    if  self.matchValue(":".to_string()) {
      self.advance();
      self.parseType();
    }
    if  self.matchValue("=>".to_string()) {
      self.pos = savedPos;
      self.currentToken = Some(savedTok.clone());
      return self.parseArrowFunction().clone();
    }
    self.pos = savedPos;
    self.currentToken = Some(savedTok.clone());
    self.advance();
    let mut expr_1 : Rc<RefCell<TSNode>> = self.parseExprSeq();
    self.expectValue(")".to_string());
    expr_1.borrow_mut().parenthesized = true;
    expr_1.clone()
  }
  fn parseArrowFunction(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "ArrowFunctionExpression".to_string();
    let mut startTok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = startTok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = startTok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = startTok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    if  self.matchValue("async".to_string()) {
      self.advance();
      node.borrow_mut().kind = "async".to_string();
    }
    self.pushScope(true);
    self.functionDepth += 1;
    let savedArrowRest : bool = self.sawRestParam;
    self.sawRestParam = false;
    let savedArrowGenerator : bool = self.inGenerator;
    let savedArrowIter : i64 = self.iterationDepth;
    let savedArrowSwitch : i64 = self.switchDepth;
    let mut savedArrowLabels : Vec<String> = self.activeLabels.clone();
    let mut savedArrowIterLabels : Vec<String> = self.iterationLabels.clone();
    let mut freshArrowLabels : Vec<String> = Vec::new();
    let mut freshArrowIterLabels : Vec<String> = Vec::new();
    self.iterationDepth = 0;
    self.switchDepth = 0;
    self.activeLabels = freshArrowLabels.clone();
    self.iterationLabels = freshArrowIterLabels.clone();
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
        if  (node.borrow().params.len() as i64) > 0 {
          self.expectValue(",".to_string());
        }
        let mut param : Rc<RefCell<TSNode>> = self.parseParam();
        if  (param.borrow().name.chars().count() as i64) > 0 {
          let __arg_0 = param.borrow().name.clone();
          self.declareBinding("p".to_string(), __arg_0);
        }
        node.borrow_mut().params.push(param.clone());
      };
      self.expectValue(")".to_string());
    } else {
      let mut paramTok : Rc<RefCell<Token>> = self.expectBindingName();
      let mut param_1 : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      param_1.borrow_mut().nodeType = "Parameter".to_string();
      let _tmp_1 = paramTok.borrow().value.clone();
      param_1.borrow_mut().name = _tmp_1;
      let __arg_0 = param_1.borrow().name.clone();
      self.declareBinding("p".to_string(), __arg_0);
      node.borrow_mut().params.push(param_1.clone());
    }
    if  self.matchValue(":".to_string()) {
      self.advance();
      let mut retType : Rc<RefCell<TSNode>> = self.parseType();
      node.borrow_mut().typeAnnotation = Some(retType.clone());
    }
    let mut arrowTok : Rc<RefCell<Token>> = self.peek();
    if  arrowTok.borrow().value == "=>" {
      if  arrowTok.borrow().line != self.lastTokenLine {
        self.syntaxError("Parse error: no line terminator is allowed before '=>'".to_string());
      }
    }
    self.expectValue("=>".to_string());
    if  self.matchValue("{".to_string()) {
      self.suppressBlockScope = true;
      let mut body : Rc<RefCell<TSNode>> = self.parseBlock();
      node.borrow_mut().body = Some(body.clone());
      let _tmp_1 = body.borrow().end;
      node.borrow_mut().end = _tmp_1;
      if  self.lastBlockEnabledStrict {
        let __arg_0 = node.borrow().params.clone();
        self.recheckStrictSignature("".to_string(), &__arg_0);
      }
    } else {
      let mut body_1 : Rc<RefCell<TSNode>> = self.parseExpr();
      node.borrow_mut().body = Some(body_1.clone());
      node.borrow_mut().end = self.lastTokenEndPos;
    }
    self.popScope();
    self.iterationDepth = savedArrowIter;
    self.switchDepth = savedArrowSwitch;
    self.activeLabels = savedArrowLabels.clone();
    self.iterationLabels = savedArrowIterLabels.clone();
    self.inGenerator = savedArrowGenerator;
    self.sawRestParam = savedArrowRest;
    self.functionDepth -= 1;
    node.clone()
  }
  fn parseNewExpression(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "NewExpression".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("new".to_string());
    if  self.matchValue(".".to_string()) {
      self.advance();
      if  self.matchValue("target".to_string()) {
        let mut targetTok : Rc<RefCell<Token>> = self.peek();
        if  targetTok.borrow().hasEscape {
          self.syntaxError("Parse error: 'new.target' may not use an escape sequence".to_string());
        }
        self.advance();
        node.borrow_mut().nodeType = "MetaProperty".to_string();
        node.borrow_mut().name = "new".to_string();
        node.borrow_mut().value = "target".to_string();
        if  self.functionDepth == 0 {
          self.syntaxError("Parse error: 'new.target' is only allowed inside a function".to_string());
        }
        return node.clone();
      }
      let mut badMeta : Rc<RefCell<Token>> = self.peek();
      let __arg_0 = format!("Parse error: 'new.{}' is not a meta property", badMeta.borrow().value).clone();
      self.syntaxError(__arg_0);
    }
    if  self.matchValue("super".to_string()) {
      if  self.peekNextValue() == "(" {
        self.syntaxError("Parse error: 'super' cannot be the callee of 'new'".to_string());
      }
    }
    let mut callee : Rc<RefCell<TSNode>> = self.parsePrimary();
    let mut keepMember : bool = true;
    while keepMember {
      if  self.matchValue(".".to_string()) {
        self.advance();
        let mut propTok : Rc<RefCell<Token>> = self.parseMemberName();
        let mut member : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        member.borrow_mut().nodeType = "MemberExpression".to_string();
        member.borrow_mut().left = Some(callee.clone());
        let _tmp_1 = propTok.borrow().value.clone();
        member.borrow_mut().name = _tmp_1;
        let _tmp_2 = callee.borrow().start;
        member.borrow_mut().start = _tmp_2;
        let _tmp_3 = callee.borrow().line;
        member.borrow_mut().line = _tmp_3;
        let _tmp_4 = callee.borrow().col;
        member.borrow_mut().col = _tmp_4;
        callee = member.clone();
      } else {
        keepMember = false;
      }
    };
    node.borrow_mut().left = Some(callee.clone());
    if  self.matchValue("<".to_string()) {
      let mut depth : i64 = 1;
      self.advance();
      while (depth > 0) && (!(self.isAtEnd())) {
        let v : String = self.peekValue();
        if  v == "<" {
          depth += 1;
        }
        if  v == ">" {
          depth -= 1;
        }
        self.advance();
      };
    }
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (!(self.matchValue(")".to_string()))) && (!(self.isAtEnd())) {
        if  (node.borrow().children.len() as i64) > 0 {
          self.expectValue(",".to_string());
          if  self.matchValue(")".to_string()) {
            break;
          }
        }
        if  self.matchValue("...".to_string()) {
          self.advance();
          let mut spreadArg : Rc<RefCell<TSNode>> = self.parseExpr();
          let mut spread : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
          spread.borrow_mut().nodeType = "SpreadElement".to_string();
          spread.borrow_mut().left = Some(spreadArg.clone());
          node.borrow_mut().children.push(spread.clone());
        } else {
          let mut arg : Rc<RefCell<TSNode>> = self.parseExpr();
          node.borrow_mut().children.push(arg.clone());
        }
      };
      self.expectValue(")".to_string());
    }
    node.clone()
  }
  fn peekNextType(&mut self) -> String {
    let nextPos : i64 = self.pos + 1;
    if  nextPos < (self.tokens.len() as i64) {
      let mut nextTok : Rc<RefCell<Token>> = self.tokens[(nextPos) as usize].clone();
      return nextTok.borrow().tokenType.clone();
    }
    "EOF".to_string().clone()
  }
  fn peekAheadValue(&mut self, offset : i64) -> String {
    let aheadPos : i64 = self.pos + offset;
    if  aheadPos < (self.tokens.len() as i64) {
      let mut tok : Rc<RefCell<Token>> = self.tokens[(aheadPos) as usize].clone();
      return tok.borrow().value.clone();
    }
    "".to_string().clone()
  }
  fn startsWithLowerCase(s : String) -> bool {
    if  (s.chars().count() as i64) == 0 {
      return false;
    }
    let code : i64 = s.chars().nth(0).unwrap_or('\0') as i64;
    if  (97..=122).contains(&code) {
      return true;
    }
    false
  }
  fn looksLikeGenericCall(&mut self) -> bool {
    let mut depth : i64 = 1;
    let mut offset : i64 = 1;
    let maxLookahead : i64 = 20;
    while (depth > 0) && (offset < maxLookahead) {
      let ahead : String = self.peekAheadValue(offset);
      if  ahead.is_empty() {
        return false;
      }
      if  ahead == "<" {
        depth += 1;
      }
      if  ahead == ">" {
        depth -= 1;
      }
      if  (((ahead == "{") || (ahead == "}")) || (ahead == ";")) || (ahead == "=>") {
        return false;
      }
      offset += 1;
    };
    if  depth == 0 {
      let afterClose : String = self.peekAheadValue(offset);
      if  afterClose == "(" {
        return true;
      }
    }
    false
  }
  fn parseJSXElement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXElement".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    let mut opening : Rc<RefCell<TSNode>> = self.parseJSXOpeningElement();
    node.borrow_mut().left = Some(opening.clone());
    if  opening.borrow().kind == "self-closing" {
      node.borrow_mut().nodeType = "JSXElement".to_string();
      return node.clone();
    }
    // unused:  let tagName : String = opening.borrow().name.clone();
    while !(self.isAtEnd()) {
      let v : String = self.peekValue();
      if  v == "<" {
        let nextVal : String = self.peekNextValue();
        if  nextVal == "/" {
          break;
        }
        let mut child : Rc<RefCell<TSNode>> = self.parseJSXElement();
        node.borrow_mut().children.push(child.clone());
      } else {
        if  v == "{" {
          let mut exprChild : Rc<RefCell<TSNode>> = self.parseJSXExpressionContainer();
          node.borrow_mut().children.push(exprChild.clone());
        } else {
          let t : String = self.peekType();
          if  ((t != "EOF") && (v != "<")) && (v != "{") {
            let mut textChild : Rc<RefCell<TSNode>> = self.parseJSXText();
            node.borrow_mut().children.push(textChild.clone());
          } else {
            break;
          }
        }
      }
    };
    let mut closing : Rc<RefCell<TSNode>> = self.parseJSXClosingElement();
    node.borrow_mut().right = Some(closing.clone());
    node.clone()
  }
  fn parseJSXOpeningElement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXOpeningElement".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("<".to_string());
    let mut tagName : Rc<RefCell<TSNode>> = self.parseJSXElementName();
    let _tmp_4 = tagName.borrow().name.clone();
    node.borrow_mut().name = _tmp_4;
    node.borrow_mut().left = Some(tagName.clone());
    while !(self.isAtEnd()) {
      let v : String = self.peekValue();
      if  (v == ">") || (v == "/") {
        break;
      }
      let mut attr : Rc<RefCell<TSNode>> = self.parseJSXAttribute();
      node.borrow_mut().children.push(attr.clone());
    };
    if  self.matchValue("/".to_string()) {
      self.advance();
      node.borrow_mut().kind = "self-closing".to_string();
    }
    self.expectValue(">".to_string());
    node.clone()
  }
  fn parseJSXClosingElement(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXClosingElement".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("<".to_string());
    self.expectValue("/".to_string());
    let mut tagName : Rc<RefCell<TSNode>> = self.parseJSXElementName();
    let _tmp_4 = tagName.borrow().name.clone();
    node.borrow_mut().name = _tmp_4;
    node.borrow_mut().left = Some(tagName.clone());
    self.expectValue(">".to_string());
    node.clone()
  }
  fn parseJSXElementName(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXIdentifier".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    let mut namePart : String = tok.borrow().value.clone();
    self.advance();
    while self.matchValue(".".to_string()) {
      self.advance();
      let mut nextTok : Rc<RefCell<Token>> = self.peek();
      namePart = format!("{}.{}", namePart, nextTok.borrow().value);
      self.advance();
      node.borrow_mut().nodeType = "JSXMemberExpression".to_string();
    };
    node.borrow_mut().name = namePart.clone();
    node.clone()
  }
  fn parseJSXAttribute(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXAttribute".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    if  self.matchValue("{".to_string()) {
      self.advance();
      if  self.matchValue("...".to_string()) {
        self.advance();
        node.borrow_mut().nodeType = "JSXSpreadAttribute".to_string();
        let mut arg : Rc<RefCell<TSNode>> = self.parseExpr();
        node.borrow_mut().left = Some(arg.clone());
        self.expectValue("}".to_string());
        return node.clone();
      }
    }
    let attrName : String = tok.borrow().value.clone();
    node.borrow_mut().name = attrName.clone();
    self.advance();
    if  self.matchValue("=".to_string()) {
      self.advance();
      let valTok : String = self.peekValue();
      if  valTok == "{" {
        let mut exprValue : Rc<RefCell<TSNode>> = self.parseJSXExpressionContainer();
        node.borrow_mut().right = Some(exprValue.clone());
      } else {
        let mut strTok : Rc<RefCell<Token>> = self.peek();
        let mut strNode : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
        strNode.borrow_mut().nodeType = "StringLiteral".to_string();
        let _tmp_1 = strTok.borrow().value.clone();
        strNode.borrow_mut().value = _tmp_1;
        let _tmp_2 = strTok.borrow().start;
        strNode.borrow_mut().start = _tmp_2;
        let _tmp_3 = strTok.borrow().end;
        strNode.borrow_mut().end = _tmp_3;
        let _tmp_4 = strTok.borrow().line;
        strNode.borrow_mut().line = _tmp_4;
        let _tmp_5 = strTok.borrow().col;
        strNode.borrow_mut().col = _tmp_5;
        self.advance();
        node.borrow_mut().right = Some(strNode.clone());
      }
    }
    node.clone()
  }
  fn parseJSXExpressionContainer(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXExpressionContainer".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("{".to_string());
    if  self.matchValue("}".to_string()) {
      let mut empty : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
      empty.borrow_mut().nodeType = "JSXEmptyExpression".to_string();
      node.borrow_mut().left = Some(empty.clone());
    } else {
      let mut expr : Rc<RefCell<TSNode>> = self.parseExpr();
      node.borrow_mut().left = Some(expr.clone());
    }
    self.expectValue("}".to_string());
    node.clone()
  }
  fn parseJSXText(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXText".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    let _tmp_4 = tok.borrow().value.clone();
    node.borrow_mut().value = _tmp_4;
    self.advance();
    node.clone()
  }
  fn parseJSXFragment(&mut self) -> Rc<RefCell<TSNode>> {
    let mut node : Rc<RefCell<TSNode>> = Rc::new(RefCell::new(TSNode::new()));
    node.borrow_mut().nodeType = "JSXFragment".to_string();
    let mut tok : Rc<RefCell<Token>> = self.peek();
    let _tmp_1 = tok.borrow().start;
    node.borrow_mut().start = _tmp_1;
    let _tmp_2 = tok.borrow().line;
    node.borrow_mut().line = _tmp_2;
    let _tmp_3 = tok.borrow().col;
    node.borrow_mut().col = _tmp_3;
    self.expectValue("<".to_string());
    self.expectValue(">".to_string());
    while !(self.isAtEnd()) {
      let v : String = self.peekValue();
      if  v == "<" {
        let nextVal : String = self.peekNextValue();
        if  nextVal == "/" {
          break;
        }
        let mut child : Rc<RefCell<TSNode>> = self.parseJSXElement();
        node.borrow_mut().children.push(child.clone());
      } else {
        if  v == "{" {
          let mut exprChild : Rc<RefCell<TSNode>> = self.parseJSXExpressionContainer();
          node.borrow_mut().children.push(exprChild.clone());
        } else {
          let t : String = self.peekType();
          if  ((t != "EOF") && (v != "<")) && (v != "{") {
            let mut textChild : Rc<RefCell<TSNode>> = self.parseJSXText();
            node.borrow_mut().children.push(textChild.clone());
          } else {
            break;
          }
        }
      }
    };
    self.expectValue("<".to_string());
    self.expectValue("/".to_string());
    self.expectValue(">".to_string());
    node.clone()
  }
}
#[derive(Clone)]
struct TSParserMain { 
}
impl TSParserMain { 
  
  pub fn new() ->  TSParserMain {
    TSParserMain { 
    }
  }
  pub fn showHelp() {
    println!("TypeScript Parser");
    println!();
    println!("Usage: node ts_parser_main.js [options]");
    println!();
    println!("Options:");
    println!("  -h, --help          Show this help message");
    println!("  -d                  Run built-in demo/test suite");
    println!("  -i <file>           Input TypeScript file to parse");
    println!("  --tokens            Show tokens in addition to AST");
    println!("  --show-interfaces   List all interfaces in the file");
    println!("  --show-types        List all type aliases in the file");
    println!("  --show-functions    List all functions in the file");
    println!();
    println!("Examples:");
    println!("  node ts_parser_main.js -d                              Run the demo");
    println!("  node ts_parser_main.js -i script.ts                    Parse and show AST");
    println!("  node ts_parser_main.js -i script.ts --tokens           Also show tokens");
    println!("  node ts_parser_main.js -i script.ts --show-interfaces  List interfaces");
  }
  pub fn listDeclarations(filename : String, showInterfaces : bool, showTypes : bool, showFunctions : bool) {
    let codeOpt : Option<String> = r_read_file(&".".to_string(), &filename);
    if  codeOpt.is_none() {
      println!("Error: Could not read file: {}", filename);
      return;
    }
    let code : String = codeOpt.clone().unwrap();
    let mut lexer : TSLexer = TSLexer::new(code.clone());
    let mut tokens : Vec<Rc<RefCell<Token>>> = lexer.tokenize();
    let mut parser : TSParserSimple = TSParserSimple::new();
    parser.initParser(tokens.clone());
    parser.setQuiet(true);
    let mut program : Rc<RefCell<TSNode>> = parser.parseProgram();
    if  showInterfaces {
      println!("=== Interfaces in {} ===", filename);
      println!();
      TSParserMain::listInterfaces(program.clone());
      println!();
    }
    if  showTypes {
      println!("=== Type Aliases in {} ===", filename);
      println!();
      TSParserMain::listTypeAliases(program.clone());
      println!();
    }
    if  showFunctions {
      println!("=== Functions in {} ===", filename);
      println!();
      TSParserMain::listFunctions(program.clone());
      println!();
    }
  }
  pub fn listInterfaces(mut program : Rc<RefCell<TSNode>>) {
    let mut count : i64 = 0;
    for idx in 0..program.borrow().children.len() {
      let mut stmt = program.borrow().children[idx].clone();
      if  stmt.borrow().nodeType == "TSInterfaceDeclaration" {
        count += 1;
        let line : String = format!("{}", stmt.borrow().line);
        let mut props : i64 = 0;
        if  stmt.borrow().body.is_some() {
          let mut body : Rc<RefCell<TSNode>> = stmt.borrow().body.clone().unwrap();
          props = body.borrow().children.len() as i64;
        }
        println!("  {} ({} properties) [line {}]", stmt.borrow().name, props, line);
        if  stmt.borrow().body.is_some() {
          let mut bodyNode : Rc<RefCell<TSNode>> = stmt.borrow().body.clone().unwrap();
          for mi in 0..bodyNode.borrow().children.len() {
            let mut member = bodyNode.borrow().children[mi].clone();
            if  member.borrow().nodeType == "TSPropertySignature" {
              let mut propInfo : String = format!("    - {}", member.borrow().name);
              if  member.borrow().optional {
                propInfo = format!("{}?", propInfo);
              }
              if  member.borrow().readonly {
                propInfo = format!("    - readonly {}", member.borrow().name);
                if  member.borrow().optional {
                  propInfo = format!("{}?", propInfo);
                }
              }
              if  member.borrow().typeAnnotation.is_some() {
                let mut typeNode : Rc<RefCell<TSNode>> = member.borrow().typeAnnotation.clone().unwrap();
                if  typeNode.borrow().typeAnnotation.is_some() {
                  let mut innerType : Rc<RefCell<TSNode>> = typeNode.borrow().typeAnnotation.clone().unwrap();
                  propInfo = format!("{}: {}", propInfo, TSParserMain::getTypeName(innerType.clone()));
                }
              }
              println!("{}", propInfo);
            }
          };
        }
      }
    };
    println!();
    println!("Total: {} interface(s)", count);
  }
  pub fn listTypeAliases(mut program : Rc<RefCell<TSNode>>) {
    let mut count : i64 = 0;
    for idx in 0..program.borrow().children.len() {
      let mut stmt = program.borrow().children[idx].clone();
      if  stmt.borrow().nodeType == "TSTypeAliasDeclaration" {
        count += 1;
        let line : String = format!("{}", stmt.borrow().line);
        let mut typeInfo : String = format!("  {}", stmt.borrow().name);
        if  stmt.borrow().typeAnnotation.is_some() {
          let mut typeNode : Rc<RefCell<TSNode>> = stmt.borrow().typeAnnotation.clone().unwrap();
          typeInfo = format!("{} = {}", typeInfo, TSParserMain::getTypeName(typeNode.clone()));
        }
        typeInfo = format!("{} [line {}]", typeInfo, line);
        println!("{}", typeInfo);
      }
    };
    println!();
    println!("Total: {} type alias(es)", count);
  }
  pub fn listFunctions(mut program : Rc<RefCell<TSNode>>) {
    let mut count : i64 = 0;
    for idx in 0..program.borrow().children.len() {
      let mut stmt = program.borrow().children[idx].clone();
      if  stmt.borrow().nodeType == "FunctionDeclaration" {
        count += 1;
        let line : String = format!("{}", stmt.borrow().line);
        let mut funcInfo : String = format!("  {}(", stmt.borrow().name);
        // unused:  let paramCount : i64 = stmt.borrow().params.len() as i64;
        let mut pi : i64 = 0;
        for paramIdx in 0..stmt.borrow().params.len() {
          let mut param = stmt.borrow().params[paramIdx].clone();
          if  pi > 0 {
            funcInfo = format!("{}, ", funcInfo);
          }
          funcInfo = format!("{}{}", funcInfo, param.borrow().name);
          if  param.borrow().optional {
            funcInfo = format!("{}?", funcInfo);
          }
          if  param.borrow().typeAnnotation.is_some() {
            let mut paramType : Rc<RefCell<TSNode>> = param.borrow().typeAnnotation.clone().unwrap();
            if  paramType.borrow().typeAnnotation.is_some() {
              let mut innerType : Rc<RefCell<TSNode>> = paramType.borrow().typeAnnotation.clone().unwrap();
              funcInfo = format!("{}: {}", funcInfo, TSParserMain::getTypeName(innerType.clone()));
            }
          }
          pi += 1;
        };
        funcInfo = format!("{})", funcInfo);
        if  stmt.borrow().typeAnnotation.is_some() {
          let mut retType : Rc<RefCell<TSNode>> = stmt.borrow().typeAnnotation.clone().unwrap();
          if  retType.borrow().typeAnnotation.is_some() {
            let mut innerRet : Rc<RefCell<TSNode>> = retType.borrow().typeAnnotation.clone().unwrap();
            funcInfo = format!("{}: {}", funcInfo, TSParserMain::getTypeName(innerRet.clone()));
          }
        }
        funcInfo = format!("{} [line {}]", funcInfo, line);
        println!("{}", funcInfo);
      }
    };
    println!();
    println!("Total: {} function(s)", count);
  }
  pub fn getTypeName(mut typeNode : Rc<RefCell<TSNode>>) -> String {
    let nodeType : String = typeNode.borrow().nodeType.clone();
    if  nodeType == "TSStringKeyword" {
      return "string".to_string().clone();
    }
    if  nodeType == "TSNumberKeyword" {
      return "number".to_string().clone();
    }
    if  nodeType == "TSBooleanKeyword" {
      return "boolean".to_string().clone();
    }
    if  nodeType == "TSAnyKeyword" {
      return "any".to_string().clone();
    }
    if  nodeType == "TSVoidKeyword" {
      return "void".to_string().clone();
    }
    if  nodeType == "TSNullKeyword" {
      return "null".to_string().clone();
    }
    if  nodeType == "TSUndefinedKeyword" {
      return "undefined".to_string().clone();
    }
    if  nodeType == "TSTypeReference" {
      let mut result : String = typeNode.borrow().name.clone();
      if  (typeNode.borrow().params.len() as i64) > 0 {
        result = format!("{}<", result);
        let mut gi : i64 = 0;
        for gpIdx in 0..typeNode.borrow().params.len() {
          let mut gp = typeNode.borrow().params[gpIdx].clone();
          if  gi > 0 {
            result = format!("{}, ", result);
          }
          result = format!("{}{}", result, TSParserMain::getTypeName(gp.clone()));
          gi += 1;
        };
        result = format!("{}>", result);
      }
      return result.clone();
    }
    if  nodeType == "TSUnionType" {
      let mut result_1 : String = "".to_string();
      let mut ui : i64 = 0;
      for utIdx in 0..typeNode.borrow().children.len() {
        let mut ut = typeNode.borrow().children[utIdx].clone();
        if  ui > 0 {
          result_1 = format!("{} | ", result_1);
        }
        result_1 = format!("{}{}", result_1, TSParserMain::getTypeName(ut.clone()));
        ui += 1;
      };
      return result_1.clone();
    }
    nodeType.clone()
  }
  pub fn parseFile(filename : String, showTokens : bool) {
    let codeOpt : Option<String> = r_read_file(&".".to_string(), &filename);
    if  codeOpt.is_none() {
      println!("Error: Could not read file: {}", filename);
      return;
    }
    let code : String = codeOpt.clone().unwrap();
    println!("=== Parsing: {} ===", filename);
    println!();
    let mut lexer : TSLexer = TSLexer::new(code.clone());
    let mut tokens : Vec<Rc<RefCell<Token>>> = lexer.tokenize();
    if  showTokens {
      println!("--- Tokens ---");
      for ti in 0..tokens.len() {
        let mut tok = tokens[ti].clone();
        let output : String = format!("{}: '{}'", tok.borrow().tokenType, tok.borrow().value);
        println!("{}", output);
      };
      println!();
    }
    let mut parser : TSParserSimple = TSParserSimple::new();
    parser.initParser(tokens.clone());
    let mut program : Rc<RefCell<TSNode>> = parser.parseProgram();
    println!("--- AST ---");
    println!("Program with {} statements:", program.borrow().children.len() as i64);
    println!();
    for idx in 0..program.borrow().children.len() {
      let mut stmt = program.borrow().children[idx].clone();
      TSParserMain::printNode(stmt.clone(), 0);
    };
  }
  pub fn runDemo() {
    let code : String = "\ninterface Person {\n  readonly id: number;\n  name: string;\n  age?: number;\n}\n\ntype ID = string | number;\n\ntype Result = Person | null;\n\nlet count: number = 42;\n\nconst message: string = 'hello';\n\nfunction greet(name: string, age?: number): string {\n  return name;\n}\n\nlet data: Array<string>;\n".to_string();
    println!("=== TypeScript Parser Demo ===");
    println!();
    println!("Input:");
    println!("{}", code);
    println!();
    println!("--- Tokens ---");
    let mut lexer : TSLexer = TSLexer::new(code.clone());
    let mut tokens : Vec<Rc<RefCell<Token>>> = lexer.tokenize();
    for i in 0..tokens.len() {
      let mut tok = tokens[i].clone();
      let output : String = format!("{}: '{}'", tok.borrow().tokenType, tok.borrow().value);
      println!("{}", output);
    };
    println!();
    println!("--- AST ---");
    let mut parser : TSParserSimple = TSParserSimple::new();
    parser.initParser(tokens.clone());
    let mut program : Rc<RefCell<TSNode>> = parser.parseProgram();
    println!("Program with {} statements:", program.borrow().children.len() as i64);
    println!();
    for idx in 0..program.borrow().children.len() {
      let mut stmt = program.borrow().children[idx].clone();
      TSParserMain::printNode(stmt.clone(), 0);
    };
  }
  pub fn printNode(mut node : Rc<RefCell<TSNode>>, depth : i64) {
    let mut indent : String = "".to_string();
    let mut i : i64 = 0;
    while i < depth {
      indent = format!("{}  ", indent);
      i += 1;
    };
    let nodeType : String = node.borrow().nodeType.clone();
    let loc : String = format!("[{}:{}]", node.borrow().line, node.borrow().col);
    if  nodeType == "TSInterfaceDeclaration" {
      println!("{}TSInterfaceDeclaration: {} {}", indent, node.borrow().name, loc);
      if  node.borrow().body.is_some() {
        TSParserMain::printNode(node.borrow().body.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSInterfaceBody" {
      println!("{}TSInterfaceBody {}", indent, loc);
      for mi in 0..node.borrow().children.len() {
        let mut member = node.borrow().children[mi].clone();
        TSParserMain::printNode(member.clone(), depth + 1);
      };
      return;
    }
    if  nodeType == "TSPropertySignature" {
      let mut modifiers : String = "".to_string();
      if  node.borrow().readonly {
        modifiers = "readonly ".to_string();
      }
      if  node.borrow().optional {
        modifiers = format!("{}optional ", modifiers);
      }
      println!("{}TSPropertySignature: {}{} {}", indent, modifiers, node.borrow().name, loc);
      if  node.borrow().typeAnnotation.is_some() {
        TSParserMain::printNode(node.borrow().typeAnnotation.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSTypeAliasDeclaration" {
      println!("{}TSTypeAliasDeclaration: {} {}", indent, node.borrow().name, loc);
      if  node.borrow().typeAnnotation.is_some() {
        TSParserMain::printNode(node.borrow().typeAnnotation.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSTypeAnnotation" {
      println!("{}TSTypeAnnotation {}", indent, loc);
      if  node.borrow().typeAnnotation.is_some() {
        TSParserMain::printNode(node.borrow().typeAnnotation.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSUnionType" {
      println!("{}TSUnionType {}", indent, loc);
      for ti in 0..node.borrow().children.len() {
        let mut typeNode = node.borrow().children[ti].clone();
        TSParserMain::printNode(typeNode.clone(), depth + 1);
      };
      return;
    }
    if  nodeType == "TSTypeReference" {
      println!("{}TSTypeReference: {} {}", indent, node.borrow().name, loc);
      for pi in 0..node.borrow().params.len() {
        let mut param = node.borrow().params[pi].clone();
        TSParserMain::printNode(param.clone(), depth + 1);
      };
      return;
    }
    if  nodeType == "TSArrayType" {
      println!("{}TSArrayType {}", indent, loc);
      if  node.borrow().left.is_some() {
        TSParserMain::printNode(node.borrow().left.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSStringKeyword" {
      println!("{}TSStringKeyword {}", indent, loc);
      return;
    }
    if  nodeType == "TSNumberKeyword" {
      println!("{}TSNumberKeyword {}", indent, loc);
      return;
    }
    if  nodeType == "TSBooleanKeyword" {
      println!("{}TSBooleanKeyword {}", indent, loc);
      return;
    }
    if  nodeType == "TSAnyKeyword" {
      println!("{}TSAnyKeyword {}", indent, loc);
      return;
    }
    if  nodeType == "TSNullKeyword" {
      println!("{}TSNullKeyword {}", indent, loc);
      return;
    }
    if  nodeType == "TSVoidKeyword" {
      println!("{}TSVoidKeyword {}", indent, loc);
      return;
    }
    if  nodeType == "VariableDeclaration" {
      println!("{}VariableDeclaration ({}) {}", indent, node.borrow().kind, loc);
      for di in 0..node.borrow().children.len() {
        let mut declarator = node.borrow().children[di].clone();
        TSParserMain::printNode(declarator.clone(), depth + 1);
      };
      return;
    }
    if  nodeType == "VariableDeclarator" {
      println!("{}VariableDeclarator: {} {}", indent, node.borrow().name, loc);
      if  node.borrow().typeAnnotation.is_some() {
        TSParserMain::printNode(node.borrow().typeAnnotation.clone().unwrap().clone(), depth + 1);
      }
      if  node.borrow().init.is_some() {
        println!("{}  init:", indent);
        TSParserMain::printNode(node.borrow().init.clone().unwrap().clone(), depth + 2);
      }
      return;
    }
    if  nodeType == "FunctionDeclaration" {
      let mut paramNames : String = "".to_string();
      for pi_1 in 0..node.borrow().params.len() {
        let mut p = node.borrow().params[pi_1].clone();
        if  pi_1 > 0 {
          paramNames = format!("{}, ", paramNames);
        }
        paramNames = format!("{}{}", paramNames, p.borrow().name);
        if  p.borrow().optional {
          paramNames = format!("{}?", paramNames);
        }
      };
      println!("{}FunctionDeclaration: {}({}) {}", indent, node.borrow().name, paramNames, loc);
      if  node.borrow().typeAnnotation.is_some() {
        println!("{}  returnType:", indent);
        TSParserMain::printNode(node.borrow().typeAnnotation.clone().unwrap().clone(), depth + 2);
      }
      if  node.borrow().body.is_some() {
        TSParserMain::printNode(node.borrow().body.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "BlockStatement" {
      println!("{}BlockStatement {}", indent, loc);
      for si in 0..node.borrow().children.len() {
        let mut stmt = node.borrow().children[si].clone();
        TSParserMain::printNode(stmt.clone(), depth + 1);
      };
      return;
    }
    if  nodeType == "ExpressionStatement" {
      println!("{}ExpressionStatement {}", indent, loc);
      if  node.borrow().left.is_some() {
        TSParserMain::printNode(node.borrow().left.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "ReturnStatement" {
      println!("{}ReturnStatement {}", indent, loc);
      if  node.borrow().left.is_some() {
        TSParserMain::printNode(node.borrow().left.clone().unwrap().clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "Identifier" {
      println!("{}Identifier: {} {}", indent, node.borrow().name, loc);
      return;
    }
    if  nodeType == "NumericLiteral" {
      println!("{}NumericLiteral: {} {}", indent, node.borrow().value, loc);
      return;
    }
    if  nodeType == "StringLiteral" {
      println!("{}StringLiteral: {} {}", indent, node.borrow().value, loc);
      return;
    }
    println!("{}{} {}", indent, nodeType, loc);
  }
}
fn main() {
  let argCnt : i64 = (std::env::args().len() as i64 - 1);
  if  argCnt == 0 {
    TSParserMain::showHelp();
    return;
  }
  let mut inputFile : String = "".to_string();
  let mut runDefault : bool = false;
  let mut showTokens : bool = false;
  let mut showInterfaces : bool = false;
  let mut showTypes : bool = false;
  let mut showFunctions : bool = false;
  let mut i : i64 = 0;
  while i < argCnt {
    let arg : String = std::env::args().nth((i + 1) as usize).unwrap_or_default();
    if  (arg == "--help") || (arg == "-h") {
      TSParserMain::showHelp();
      return;
    }
    if  arg == "-d" {
      runDefault = true;
      i += 1;
    } else {
      if  arg == "-i" {
        i += 1;
        if  i < argCnt {
          inputFile = std::env::args().nth((i + 1) as usize).unwrap_or_default();
        }
        i += 1;
      } else {
        if  arg == "--tokens" {
          showTokens = true;
          i += 1;
        } else {
          if  arg == "--show-interfaces" {
            showInterfaces = true;
            i += 1;
          } else {
            if  arg == "--show-types" {
              showTypes = true;
              i += 1;
            } else {
              if  arg == "--show-functions" {
                showFunctions = true;
                i += 1;
              } else {
                i += 1;
              }
            }
          }
        }
      }
    }
  };
  if  runDefault {
    TSParserMain::runDemo();
    return;
  }
  if  (inputFile.chars().count() as i64) > 0 {
    if  (showInterfaces || showTypes) || showFunctions {
      TSParserMain::listDeclarations(inputFile.clone(), showInterfaces, showTypes, showFunctions);
      return;
    }
    TSParserMain::parseFile(inputFile.clone(), showTokens);
    return;
  }
  TSParserMain::showHelp();
}

fn r_read_file(path: &str, filename: &str) -> Option<String> {
    let full_path = format!("{}/{}", path, filename);
    std::fs::read_to_string(full_path).ok()
}

