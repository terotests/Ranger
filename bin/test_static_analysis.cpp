#include  <memory>
#include  "variant.hpp"
#include  <vector>
#include  <cstdint>
#include  <iostream>
#include  <string>

// define classes here to avoid compiler errors
class DataHolder;
class TestBufferMutation;

typedef mpark::variant<std::shared_ptr<DataHolder>, std::shared_ptr<TestBufferMutation>, int, std::string, bool, double>  r_union_Any;

// header definitions
class DataHolder : public std::enable_shared_from_this<DataHolder>  { 
  public :
    std::vector<uint8_t> data;
    /* class constructor */ 
    DataHolder( );
};
class TestBufferMutation : public std::enable_shared_from_this<TestBufferMutation>  { 
  public :
    std::shared_ptr<DataHolder> holder;
    /* class constructor */ 
    TestBufferMutation( );
    /* static methods */ 
    static void m();
    /* instance methods */ 
    void testDirectMutation();
    void testLocalVariable();
};

int __g_argc;
char **__g_argv;
DataHolder::DataHolder( ) {
  this->data = 
  std::vector<uint8_t>(64, 0);
  ;
}
TestBufferMutation::TestBufferMutation( ) {
  this->holder =  std::make_shared<DataHolder>();
}
void  TestBufferMutation::testDirectMutation() {
  holder->data[0] = static_cast<uint8_t>(42);
}
void  TestBufferMutation::testLocalVariable() {
  std::vector<uint8_t>& buf = holder->data;
  buf[0] = static_cast<uint8_t>(42);
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<TestBufferMutation> test =  std::make_shared<TestBufferMutation>();
  test->testDirectMutation();
  test->testLocalVariable();
  std::cout << std::string("Test completed") << std::endl;
  return 0;
}
