#include  <memory>
#include  "variant.hpp"
#include  <math.h>
#include  <iostream>
#include  <string>

// define classes here to avoid compiler errors
class day_two;

typedef mpark::variant<std::shared_ptr<day_two>, int, std::string, bool, double>  r_union_Any;

// header definitions
class day_two : public std::enable_shared_from_this<day_two>  { 
  public :
    /* class constructor */ 
    day_two( );
    /* static methods */ 
    static int distance( int data );
    static void main();
};

int __g_argc;
char **__g_argv;
day_two::day_two( ) {
}
int  day_two::distance( int data ) {
  /** unused:  int size = 1   **/ ;
  int side = 1;
  int total = 1;
  int last_total = 1;
  int n = 1;
  while (total < data) {
    last_total = total;
    side = side + 2;
    total = total + ((side - 1) * 4);
    n = n + 1;
  }
  int dist = (data - last_total) - 1;
  int sideStep = side - 1;
  int pos = dist % sideStep;
  int step_ort = 0;
  int halfway = (int)floor( (sideStep / 2));
  if ( pos < halfway ) {
    step_ort = (halfway - 1) - pos;
  } else {
    step_ort = (pos - halfway) + 1;
  }
  std::cout << ((std::string("total steps for ") + std::to_string(data)) + std::string(" == ")) + std::to_string((step_ort + halfway)) << std::endl;
  return step_ort + halfway;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  day_two::distance(9);
  day_two::distance(10);
  day_two::distance(11);
  day_two::distance(12);
  day_two::distance(17);
  day_two::distance(23);
  day_two::distance(24);
  day_two::distance(1024);
  day_two::distance(289326);
  return 0;
}
