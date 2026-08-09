// Representative of the engine's value traffic: pass a refcounted value into a
// function, keep it alive, return another. Compares what Ranger emits today
// (non-atomic shared_ptr, by value) with an intrusive refcount.
#include <cstdio>
#include <cstdint>
#include <vector>
#include <chrono>
#include <memory>
#include <ext/concurrence.h>

template<class T> using rg_ptr = std::__shared_ptr<T, __gnu_cxx::_S_single>;
template<class T, class... A> inline rg_ptr<T> rg_make(A&&... a) {
    return std::__allocate_shared<T, __gnu_cxx::_S_single>(std::allocator<T>(), std::forward<A>(a)...);
}
struct Val { double n; int64_t a,b,c,d; };            // ~40 bytes, like EvHandle

// --- intrusive: counter in the object, 8-byte handle ---
struct IVal { uint32_t rc; double n; int64_t a,b,c,d; };
struct IPtr {
    IVal* p;
    IPtr(): p(nullptr) {}
    explicit IPtr(IVal* q): p(q) { if(p) p->rc++; }
    IPtr(const IPtr& o): p(o.p) { if(p) p->rc++; }
    IPtr& operator=(const IPtr& o){ if(o.p) o.p->rc++; release(); p=o.p; return *this; }
    ~IPtr(){ release(); }
    void release(){ if(p && --p->rc==0) ::operator delete(p); }
    IVal* operator->() const { return p; }
};
static IPtr imake(){ IVal* v=(IVal*)::operator new(sizeof(IVal)); v->rc=0; v->n=1; return IPtr(v); }

__attribute__((noinline)) double sink_shared(rg_ptr<Val> a, rg_ptr<Val> b){ return a->n + b->n; }
__attribute__((noinline)) double sink_intru (IPtr a, IPtr b)              { return a->n + b->n; }
__attribute__((noinline)) double sink_raw   (const Val* a, const Val* b)  { return a->n + b->n; }
__attribute__((noinline)) double sink_cref  (const rg_ptr<Val>& a, const rg_ptr<Val>& b){ return a->n + b->n; }
__attribute__((noinline)) double sink_icref (const IPtr& a, const IPtr& b){ return a->n + b->n; }

int main(){
    const int N = 20000000;
    auto A = rg_make<Val>(); A->n = 1; auto B = rg_make<Val>(); B->n = 2;
    IPtr ia = imake(), ib = imake(); ia->n = 1; ib->n = 2;
    double s = 0;
    auto t0=std::chrono::steady_clock::now();
    for(int i=0;i<N;i++) s += sink_shared(A,B);
    auto t1=std::chrono::steady_clock::now();
    for(int i=0;i<N;i++) s += sink_intru(ia,ib);
    auto t2=std::chrono::steady_clock::now();
    for(int i=0;i<N;i++) s += sink_raw(A.get(),B.get());
    auto t3=std::chrono::steady_clock::now();
    for(int i=0;i<N;i++) s += sink_cref(A,B);
    auto t4=std::chrono::steady_clock::now();
    for(int i=0;i<N;i++) s += sink_icref(ia,ib);
    auto t5=std::chrono::steady_clock::now();
    auto ms=[&](auto a,auto b){ return std::chrono::duration<double,std::milli>(b-a).count(); };
    printf("sizeof(rg_ptr<Val>) = %zu   sizeof(IPtr) = %zu   sizeof(Val*) = %zu\n",
           sizeof(rg_ptr<Val>), sizeof(IPtr), sizeof(Val*));
    printf("by-value shared_ptr (what Ranger emits) : %8.1f ms\n", ms(t0,t1));
    printf("by-value intrusive  (QuickJS style)     : %8.1f ms\n", ms(t1,t2));
    printf("raw pointer         (borrowed, no rc)   : %8.1f ms\n", ms(t2,t3));
    printf("const shared_ptr&   (what 267 params do): %8.1f ms\n", ms(t3,t4));
    printf("const intrusive&                          : %8.1f ms\n", ms(t4,t5));
    printf("(checksum %.0f)\n", s);
    return 0;
}
