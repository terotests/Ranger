#include  <memory>
#include  "variant.hpp"
#include  <string>
#include  <vector>
#include  <sstream>
#include  <iterator>
#include  <functional>
#include  <iostream>

// define classes here to avoid compiler errors
class day_one;
class operatorsOf;

typedef mpark::variant<std::shared_ptr<day_one>, int, std::string, bool, double>  r_union_Any;

std::vector<std::string> r_str_split(std::string data, std::string token) {
    std::vector<std::string> output;
    size_t pos = std::string::npos; 
    if(token.length() == 0) {
        for(std::string::iterator it = data.begin(); it != data.end(); ++it) {
            output.push_back( std::string( it, it + 1) );
        }        
        return output;
    }
    do
    {
        pos = data.find(token);
        output.push_back(data.substr(0, pos));
        if (std::string::npos != pos)
            data = data.substr(pos + token.size());
    } while (std::string::npos != pos);
    return output;
}


template <class T>
class r_optional_primitive {
  public:
    bool has_value;
    T value;
    r_optional_primitive<T> & operator=(const r_optional_primitive<T> & rhs) {
        has_value = rhs.has_value;
        value = rhs.value;
        return *this;
    }
    r_optional_primitive<T> & operator=(const T a_value) {
        has_value = true;
        value = a_value;
        return *this;
    }
};

r_optional_primitive<int> cpp_str_to_int(std::string s) {
    r_optional_primitive<int> result;
    try {
        result.value = std::stoi(s);
        result.has_value = true;
    } catch (...) {
        
    }
    return result;
}

// header definitions
class day_one : public std::enable_shared_from_this<day_one>  { 
  public :
    /* class constructor */ 
    day_one( );
    /* static methods */ 
    static void main();
};
class operatorsOf : public std::enable_shared_from_this<operatorsOf>  { 
  public :
    /* class constructor */ 
    operatorsOf( );
    /* static methods */ 
    static void forEach_2( std::vector<std::string> __self , std::function<void(std::string, int)> cb );
};

int __g_argc;
char **__g_argv;
day_one::day_one( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::string data = std::string("\r\n3751\t3769\t2769\t2039\t2794\t240\t3579\t1228\t4291\t220\t324\t3960\t211\t1346\t237\t1586\r\n550\t589\t538\t110\t167\t567\t99\t203\t524\t288\t500\t111\t118\t185\t505\t74\r\n2127\t1904\t199\t221\t1201\t250\t1119\t377\t1633\t1801\t2011\t1794\t394\t238\t206\t680\r\n435\t1703\t1385\t1461\t213\t1211\t192\t1553\t1580\t197\t571\t195\t326\t1491\t869\t1282\r\n109\t104\t3033\t120\t652\t2752\t1822\t2518\t1289\t1053\t1397\t951\t3015\t3016\t125\t1782\r\n2025\t1920\t1891\t99\t1057\t1909\t2237\t106\t97\t920\t603\t1841\t2150\t1980\t1970\t88\r\n1870\t170\t167\t176\t306\t1909\t1825\t1709\t168\t1400\t359\t817\t1678\t1718\t1594\t1552\r\n98\t81\t216\t677\t572\t295\t38\t574\t403\t74\t91\t534\t662\t588\t511\t51\r\n453\t1153\t666\t695\t63\t69\t68\t58\t524\t1088\t75\t1117\t1192\t1232\t1046\t443\r\n3893\t441\t1825\t3730\t3660\t115\t4503\t4105\t3495\t4092\t48\t3852\t132\t156\t150\t4229\r\n867\t44\t571\t40\t884\t922\t418\t328\t901\t845\t42\t860\t932\t53\t432\t569\r\n905\t717\t162\t4536\t4219\t179\t990\t374\t4409\t4821\t393\t4181\t4054\t4958\t186\t193\r\n2610\t2936\t218\t2552\t3281\t761\t204\t3433\t3699\t2727\t3065\t3624\t193\t926\t1866\t236\r\n2602\t216\t495\t3733\t183\t4688\t2893\t4042\t3066\t3810\t189\t4392\t3900\t4321\t2814\t159\r\n166\t136\t80\t185\t135\t78\t177\t123\t82\t150\t121\t145\t115\t63\t68\t24\r\n214\t221\t265\t766\t959\t1038\t226\t1188\t1122\t117\t458\t1105\t1285\t1017\t274\t281    \r\n");
  std::vector<std::string> list = r_str_split( data, std::string(""));
  /** unused:  int idx = 0   **/ ;
  int value = 0;
  int n_idx = 1;
  int min = 0;
  int max = 0;
  int total = 0;
  operatorsOf::forEach_2(list, [&](std::string item, int index) mutable { 
     r_optional_primitive<int>  val = cpp_str_to_int(item);
    if ( val.has_value ) {
      value = (/*unwrap int*/val.value) + (value * 10);
      n_idx = n_idx + 1;
    } else {
      if ( n_idx > 1 ) {
        if ( (min == 0) && (max == 0) ) {
          min = value;
          max = value;
        } else {
          if ( min > value ) {
            min = value;
          }
          if ( max < value ) {
            max = value;
          }
        }
      }
      value = 0;
      n_idx = 1;
      if ( item == std::string("\n") ) {
        total = total + (max - min);
        max = 0;
        min = 0;
      }
    }
  });
  std::cout << std::string("Total == ") + std::to_string(total) << std::endl;
  return 0;
}
operatorsOf::operatorsOf( ) {
}
void  operatorsOf::forEach_2( std::vector<std::string> __self , std::function<void(std::string, int)> cb ) {
  for ( int i = 0; i != (int)(__self.size()); i++) {
    std::string it = __self.at(i);
    cb(it, i);
  }
}
