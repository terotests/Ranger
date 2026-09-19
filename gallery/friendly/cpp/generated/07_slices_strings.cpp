#include  <memory>
#include  <string>
#include  <vector>
#include  <iostream>

// define classes here to avoid compiler errors
class TextTools;
class SliceMain;



// header definitions
class TextTools { 
  public :
    /* class constructor */ 
    TextTools( );
    /* instance methods */ 
    std::string greet( const std::string& name );
    int total( const std::vector<int>& xs );
    std::string firstChar( const std::string& s );
    int twice( const std::vector<int>& xs );
};
class SliceMain { 
  public :
    /* class constructor */ 
    SliceMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
TextTools::TextTools( ) {
}
std::string  TextTools::greet( const std::string& name ) {
  return std::string("hello ") + name;
}
int  TextTools::total( const std::vector<int>& xs ) {
  int acc = 0;
  for ( int v : xs ) {
    acc = acc + v;
  }
  return acc;
}
std::string  TextTools::firstChar( const std::string& s ) {
  if ( ((int)(s.length())) == 0 ) {
    return std::string("");
  }
  return s.substr(0, 1 - 0);
}
int  TextTools::twice( const std::vector<int>& xs ) {
  return this->total(xs) + this->total(xs);
}
SliceMain::SliceMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<TextTools> t =  std::make_shared<TextTools>();
  std::cout << t->greet(std::string("ada")) << std::endl;
  std::vector<int> xs = std::vector<int>{1, 2, 3};
  std::cout << std::string("twice ") + std::to_string(t->twice(xs)) << std::endl;
  std::cout << std::string("first ") + t->firstChar(std::string("grace")) << std::endl;
  return 0;
}
