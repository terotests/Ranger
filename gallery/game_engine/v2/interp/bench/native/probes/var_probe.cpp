// The engine's hottest shape operation: test the discriminant, then read the
// payload. mpark::variant (C++11 polyfill, what Ranger emits) vs std::variant.
#include <cstdio>
#include <chrono>
#include <variant>
#include <memory>
#include <ext/concurrence.h>
#include "variant.hpp"
template<class T> using rg_ptr = std::__shared_ptr<T, __gnu_cxx::_S_single>;
struct Nul{}; struct Undef{}; struct Hole{}; struct Num{double v;}; struct Boolean{bool v;};
struct Str{ char pad[32]; }; struct Obj{ char pad[32]; };
using MV = mpark::variant<Nul,Undef,Hole,Num,rg_ptr<Str>,Boolean,rg_ptr<Obj>>;
using SV = std::  variant<Nul,Undef,Hole,Num,rg_ptr<Str>,Boolean,rg_ptr<Obj>>;
__attribute__((noinline)) double m_read(const MV& v){ if(mpark::holds_alternative<Num>(v)) return mpark::get<Num>(v).v; return 0; }
__attribute__((noinline)) double s_read(const SV& v){ if(std::  holds_alternative<Num>(v)) return std::  get<Num>(v).v; return 0; }
int main(){
  const int N=100000000; MV m = Num{2.0}; SV s = Num{2.0}; double acc=0;
  auto t0=std::chrono::steady_clock::now(); for(int i=0;i<N;i++) acc+=m_read(m);
  auto t1=std::chrono::steady_clock::now(); for(int i=0;i<N;i++) acc+=s_read(s);
  auto t2=std::chrono::steady_clock::now();
  auto ms=[&](auto a,auto b){return std::chrono::duration<double,std::milli>(b-a).count();};
  printf("sizeof(mpark) = %zu   sizeof(std) = %zu\n", sizeof(MV), sizeof(SV));
  printf("mpark::variant  holds+get : %7.1f ms\n", ms(t0,t1));
  printf("std::variant    holds+get : %7.1f ms\n", ms(t1,t2));
  printf("(checksum %.0f)\n", acc); return 0;
}
