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
    static std::vector<int> map_2( std::vector<std::string> __self , std::function<int(std::string, int)> cb );
    static int reduce_3( std::vector<int> __self , std::function<int(int, int, int)> cb , int initialValue );
};

int __g_argc;
char **__g_argv;
day_one::day_one( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::string data = std::string("428122498997587283996116951397957933569136949848379417125362532269869461185743113733992331379856446362482129646556286611543756564275715359874924898113424472782974789464348626278532936228881786273586278886575828239366794429223317476722337424399239986153675275924113322561873814364451339186918813451685263192891627186769818128715595715444565444581514677521874935942913547121751851631373316122491471564697731298951989511917272684335463436218283261962158671266625299188764589814518793576375629163896349665312991285776595142146261792244475721782941364787968924537841698538288459355159783985638187254653851864874544584878999193242641611859756728634623853475638478923744471563845635468173824196684361934269459459124269196811512927442662761563824323621758785866391424778683599179447845595931928589255935953295111937431266815352781399967295389339626178664148415561175386725992469782888757942558362117938629369129439717427474416851628121191639355646394276451847131182652486561415942815818785884559193483878139351841633366398788657844396925423217662517356486193821341454889283266691224778723833397914224396722559593959125317175899594685524852419495793389481831354787287452367145661829287518771631939314683137722493531318181315216342994141683484111969476952946378314883421677952397588613562958741328987734565492378977396431481215983656814486518865642645612413945129485464979535991675776338786758997128124651311153182816188924935186361813797251997643992686294724699281969473142721116432968216434977684138184481963845141486793996476793954226225885432422654394439882842163295458549755137247614338991879966665925466545111899714943716571113326479432925939227996799951279485722836754457737668191845914566732285928453781818792236447816127492445993945894435692799839217467253986218213131249786833333936332257795191937942688668182629489191693154184177398186462481316834678733713614889439352976144726162214648922159719979143735815478633912633185334529484779322818611438194522292278787653763328944421516569181178517915745625295158611636365253948455727653672922299582352766484");
  std::vector<int> values = operatorsOf::map_2((r_str_split( data, std::string(""))), [&](std::string item, int index) mutable { 
    return /*unwrap int*/(cpp_str_to_int(item)).value;
  });
  std::function<int(std::vector<int>, int)> random_ch = [&](std::vector<int> list, int index) mutable { 
    if ( index >= ((int)(list.size())) ) {
      return list.at(0);
    }
    return list.at(index);
  };
  std::cout << std::to_string(operatorsOf::reduce_3(values, [&](int left, int right, int index) mutable { 
    return ((right == random_ch(values, (index + 1))) ? (left + right) : left);
  }, 0)) << std::endl;
  return 0;
}
operatorsOf::operatorsOf( ) {
}
std::vector<int>  operatorsOf::map_2( std::vector<std::string> __self , std::function<int(std::string, int)> cb ) {
  /** unused:  int __len = (int)(__self.size())   **/ ;
  std::vector<int> res;
  for ( int i = 0; i != (int)(__self.size()); i++) {
    std::string it = __self.at(i);
    res.push_back( cb(it, i)  );
  }
  return res;
}
int  operatorsOf::reduce_3( std::vector<int> __self , std::function<int(int, int, int)> cb , int initialValue ) {
  int len_1 = (int)(__self.size());
  int res_1 = initialValue;
  if ( len_1 >= 1 ) {
    for ( int i_1 = 0; i_1 != (int)(__self.size()); i_1++) {
      int it_1 = __self.at(i_1);
      res_1 = cb(res_1, it_1, i_1);
    }
  }
  return res_1;
}
