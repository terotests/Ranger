#include  <memory>
#include  <vector>
#include  <functional>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class Stats;
class IterMain;



// header definitions
class Stats { 
  public :
    /* class constructor */ 
    Stats( );
    /* instance methods */ 
    int total( const std::vector<int>& xs );
    int evenCount( const std::vector<int>& xs );
    std::vector<int> doubled( const std::vector<int>& xs );
    std::vector<int> applyEach( const std::vector<int>& xs , std::function<int(int)> f );
};
class IterMain { 
  public :
    /* class constructor */ 
    IterMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
Stats::Stats( ) {
}
int  Stats::total( const std::vector<int>& xs ) {
  int acc = 0;
  for ( int v : xs ) {
    acc = acc + v;
  }
  return acc;
}
int  Stats::evenCount( const std::vector<int>& xs ) {
  int n = 0;
  for ( int v : xs ) {
    if ( v % 2 == 0 ) {
      n = n + 1;
    }
  }
  return n;
}
std::vector<int>  Stats::doubled( const std::vector<int>& xs ) {
  std::vector<int> out;
  for ( int v : xs ) {
    out.push_back( v * 2  );
  }
  return out;
}
std::vector<int>  Stats::applyEach( const std::vector<int>& xs , std::function<int(int)> f ) {
  std::vector<int> out;
  for ( int v : xs ) {
    int next = f(v);
    out.push_back( next  );
  }
  return out;
}
IterMain::IterMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Stats> s =  std::make_shared<Stats>();
  std::vector<int> xs = std::vector<int>{1, 2, 3, 4};
  std::cout << std::string("sum ") + std::to_string(s->total(xs)) << std::endl;
  std::cout << std::string("evens ") + std::to_string(s->evenCount(xs)) << std::endl;
  std::vector<int> twice = s->doubled(xs);
  std::cout << std::string("doubled0 ") + std::to_string(twice.at(0)) << std::endl;
  std::function<int(int)> addOne = [&](int p) mutable { 
    return p + 1;
  };
  std::vector<int> bumped = s->applyEach(xs, addOne);
  std::cout << std::string("bumped0 ") + std::to_string(bumped.at(0)) << std::endl;
  return 0;
}
