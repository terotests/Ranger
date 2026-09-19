#include  <memory>
#include  "variant.hpp"
#include  <map>
#include  <functional>
#include  <vector>
#include  <string>
#include  <sstream>
#include  <iostream>

// define classes here to avoid compiler errors
class GridRow;
class Grid;
class day_three_part_two;
class operatorsOf;

typedef mpark::variant<std::shared_ptr<GridRow>, std::shared_ptr<Grid>, std::shared_ptr<day_three_part_two>, int, std::string, bool, double>  r_union_Any;

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


template<typename T>
r_optional_primitive<int> cpp_get_map_int_value( std::map<int, int> m , int key) {
r_optional_primitive<int> result;
try {
result.value = m[key];
result.has_value = true;
} catch (...) {

}
return result;
}

template <typename T>
std::string join(const T& v, const std::string& delim) {
    std::ostringstream s;
    for (const auto& i : v) {
        if (&i != &v[0]) {
            s << delim;
        }
        s << i;
    }
    return s.str();
}   
    

// header definitions
class GridRow : public std::enable_shared_from_this<GridRow>  { 
  public :
    std::map<int,int> values;
    /* class constructor */ 
    GridRow( );
};
class Grid : public std::enable_shared_from_this<Grid>  { 
  public :
    std::map<int,std::shared_ptr<GridRow>> cols;
    int minx;
    int maxx;
    int miny;
    int maxy;
    int turtle_limit;
    int first_largest;
    /* class constructor */ 
    Grid( );
    /* instance methods */ 
    int getValue( int x , int y );
    void setValue( int x , int y , int value );
    int getAdjacentSum( int x , int y );
    void printGrid();
};
class day_three_part_two : public std::enable_shared_from_this<day_three_part_two>  { 
  public :
    /* class constructor */ 
    day_three_part_two( );
    /* static methods */ 
    static int distance( int data );
    static void main();
};
class operatorsOf : public std::enable_shared_from_this<operatorsOf>  { 
  public :
    /* class constructor */ 
    operatorsOf( );
    /* static methods */ 
    static std::vector<std::string> map_2( std::vector<int> __self , std::function<std::string(int, int)> cb );
};

int __g_argc;
char **__g_argv;
GridRow::GridRow( ) {
}
Grid::Grid( ) {
  this->minx = 0;
  this->maxx = 0;
  this->miny = 0;
  this->maxy = 0;
  this->turtle_limit = 0;
  this->first_largest = 0;
}
int  Grid::getValue( int x , int y ) {
  if ( cols.count(y) > 0 ) {
    std::shared_ptr<GridRow> col = cols[y];
    if ( col->values.count(x) > 0 ) {
      return /*unwrap int*/(cpp_get_map_int_value<int>(col->values, x)).value;
    }
  }
  return 0;
}
void  Grid::setValue( int x , int y , int value ) {
  if ( (value > turtle_limit) && (first_largest == 0) ) {
    first_largest = value;
  }
  if ( cols.count(y) > 0 ) {
    std::shared_ptr<GridRow> col = cols[y];
    col->values[x] = value;
  } else {
    std::shared_ptr<GridRow> newCol =  std::make_shared<GridRow>();
    cols[y] = newCol;
    newCol->values[x] = value;
  }
  if ( x < minx ) {
    minx = x;
  }
  if ( x > maxx ) {
    maxx = x;
  }
  if ( y < miny ) {
    miny = y;
  }
  if ( y > maxy ) {
    maxy = y;
  }
}
int  Grid::getAdjacentSum( int x , int y ) {
  std::function<int(int, int)> v = [&, x, y](int dx, int dy) mutable { 
    return (shared_from_this())->getValue((x + dx), (y + dy));
  };
  return ((((((v(-1, -1) + v(-1, 0)) + v(-1, 1)) + v(0, -1)) + v(0, 1)) + v(1, -1)) + v(1, 0)) + v(1, 1);
}
void  Grid::printGrid() {
  int xx = minx;
  int yy = miny;
  while (yy <= maxy) {
    xx = minx;
    std::vector<int> row;
    while (xx <= maxx) {
      row.push_back( (shared_from_this())->getValue(xx, yy)  );
      xx = xx + 1;
    }
    std::cout << join( operatorsOf::map_2(row, [&](int item, int index) mutable { 
      return std::to_string(item);
    }) , std::string(" ")) << std::endl;
    yy = yy + 1;
  }
}
day_three_part_two::day_three_part_two( ) {
}
int  day_three_part_two::distance( int data ) {
  std::shared_ptr<Grid> myGrid =  std::make_shared<Grid>();
  myGrid->turtle_limit = data;
  myGrid->setValue(0, 0, 1);
  int i = 0;
  int j = 0;
  std::function<void(int, int, int)> moveTurtle = [&](int dx, int dy, int steps) mutable { 
    int cnt = steps;
    while (cnt > 0) {
      i = i + dx;
      j = j + dy;
      int sum = myGrid->getAdjacentSum(i, j);
      myGrid->setValue(i, j, sum);
      cnt = cnt - 1;
    }
  };
  int step = 2;
  while (myGrid->first_largest == 0) {
    moveTurtle(1, 0, 1);
    moveTurtle(0, -1, step - 1);
    moveTurtle(-1, 0, step);
    moveTurtle(0, 1, step);
    moveTurtle(1, 0, step);
    step = step + 2;
  }
  myGrid->printGrid();
  std::cout << std::string("the first largest was ") + std::to_string(myGrid->first_largest) << std::endl;
  return myGrid->turtle_limit;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  day_three_part_two::distance(289326);
  return 0;
}
operatorsOf::operatorsOf( ) {
}
std::vector<std::string>  operatorsOf::map_2( std::vector<int> __self , std::function<std::string(int, int)> cb ) {
  /** unused:  int __len = (int)(__self.size())   **/ ;
  std::vector<std::string> res;
  for ( int i = 0; i != (int)(__self.size()); i++) {
    int it = __self.at(i);
    res.push_back( cb(it, i)  );
  }
  return res;
}
