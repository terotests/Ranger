#include  <memory>
#include  "variant.hpp"
#include  <math.h>
#include  <cmath>
#include  <iostream>
#include  <string>
#include  <vector>
#include  <sstream>
#include  <cstring>

// define classes here to avoid compiler errors
class Vec2;
class Mat2;
class PathExecutor;
class PathCollector;
class PathSegment;
class EVGBezierPath;
class EVGPathParser;

typedef mpark::variant<std::shared_ptr<Vec2>, std::shared_ptr<Mat2>, std::shared_ptr<PathExecutor>, std::shared_ptr<PathCollector>, std::shared_ptr<PathSegment>, std::shared_ptr<EVGBezierPath>, std::shared_ptr<EVGPathParser>, int, std::string, bool, double>  r_union_Any;

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

r_optional_primitive<double> cpp_str_to_double(std::string s) {
    r_optional_primitive<double> result;
    try {
        result.value = std::stod(s);
        result.has_value = true;
    } catch (...) {
        
    }
    return result;
}

// header definitions
class Vec2 : public std::enable_shared_from_this<Vec2>  { 
  public :
    double x;
    double y;
    /* class constructor */ 
    Vec2( );
    /* static methods */ 
    static std::shared_ptr<Vec2> CreateNew( double i , double j );
};
class Mat2 : public std::enable_shared_from_this<Mat2>  { 
  public :
    double m0;
    double m1;
    double m2;
    double m3;
    double m4;
    double m5;
    /* class constructor */ 
    Mat2( );
    /* instance methods */ 
    void toIdentity();
    void setTranslate( double tx , double ty );
    void setScale( double sx , double sy );
    void setSkewX( double v );
    void setSkewY( double v );
    void setRotation( double v );
    void multiply( std::shared_ptr<Mat2> b );
    std::shared_ptr<Mat2> inverse();
    std::shared_ptr<Vec2> transformPoint( std::shared_ptr<Vec2> v );
    std::shared_ptr<Vec2> rotateVector( std::shared_ptr<Vec2> v );
};
class PathExecutor : public std::enable_shared_from_this<PathExecutor>  { 
  public :
    /* class constructor */ 
    PathExecutor( );
    /* instance methods */ 
    virtual void Move( double x , double y );
    virtual void Line( double x , double y );
    virtual void Curve( double x0 , double y0 , double x1 , double y1 , double x2 , double y2 );
};
class PathCollector : public PathExecutor { 
  public :
    std::vector<std::string> pathParts;
    /* class constructor */ 
    PathCollector( );
    /* instance methods */ 
    void Move( double x , double y );
    void Line( double x , double y );
    void Curve( double x0 , double y0 , double x1 , double y1 , double x2 , double y2 );
    std::string getString();
};
class PathSegment : public std::enable_shared_from_this<PathSegment>  { 
  public :
    double t0;
    double t1;
    double t2;
    double t3;
    double t4;
    double t5;
    double t6;
    /* class constructor */ 
    PathSegment( );
};
class EVGBezierPath : public std::enable_shared_from_this<EVGBezierPath>  { 
  public :
    std::vector<std::shared_ptr<Vec2>> points     /** note: unused */;
    std::shared_ptr<EVGBezierPath> next     /** note: unused */;
    int pointCnt     /** note: unused */;
    bool closed;
    std::shared_ptr<Vec2> bounds     /** note: unused */;
    std::shared_ptr<Vec2> cp1     /** note: unused */;
    std::shared_ptr<Vec2> cp2     /** note: unused */;
    std::shared_ptr<Vec2> controlPoint;
    /* class constructor */ 
    EVGBezierPath( );
    /* instance methods */ 
    void close();
    void Line( std::shared_ptr<Vec2> point );
    void moveTo( std::shared_ptr<Vec2> point );
};
class EVGPathParser : public std::enable_shared_from_this<EVGPathParser>  { 
  public :
    int i;
    int __len;
    const char* buff;
    double last_number;
    /* class constructor */ 
    EVGPathParser( );
    /* static methods */ 
    static void m();
    /* instance methods */ 
    double __sqr( double v );
    std::shared_ptr<Vec2> __xformPoint( std::shared_ptr<Vec2> point , std::shared_ptr<PathSegment> seg );
    std::shared_ptr<Vec2> __xformVec( std::shared_ptr<Vec2> point , std::shared_ptr<PathSegment> seg );
    double __vmag( std::shared_ptr<Vec2> point );
    double __vecrat( std::shared_ptr<Vec2> u , std::shared_ptr<Vec2> v );
    double __vecang( std::shared_ptr<Vec2> u , std::shared_ptr<Vec2> v );
    bool scanNumber();
    std::shared_ptr<Vec2> pathArcTo( std::shared_ptr<PathExecutor> callback , std::shared_ptr<Vec2> cp , std::shared_ptr<PathSegment> args , bool rel );
    void parsePath( std::string path , std::shared_ptr<PathExecutor> callback );
};

int __g_argc;
char **__g_argv;
Vec2::Vec2( ) {
  this->x = 0;
  this->y = 0;
}
std::shared_ptr<Vec2>  Vec2::CreateNew( double i , double j ) {
  std::shared_ptr<Vec2> v =  std::make_shared<Vec2>();
  v->x = i;
  v->y = j;
  return v;
}
Mat2::Mat2( ) {
  this->m0 = 1;
  this->m1 = 0;
  this->m2 = 0;
  this->m3 = 1;
  this->m4 = 0;
  this->m5 = 0;
}
void  Mat2::toIdentity() {
  m0 = 1;
  m1 = 0;
  m2 = 0;
  m3 = 1;
  m4 = 0;
  m5 = 0;
}
void  Mat2::setTranslate( double tx , double ty ) {
  m4 = tx;
  m5 = ty;
}
void  Mat2::setScale( double sx , double sy ) {
  m1 = sx;
  m3 = sy;
}
void  Mat2::setSkewX( double v ) {
  m0 = 1;
  m1 = 0;
  m2 = tan(v);
  m3 = 1;
  m4 = 0;
  m5 = 0;
}
void  Mat2::setSkewY( double v ) {
  m0 = 1;
  m1 = tan(v);
  m2 = 0;
  m3 = 1;
  m4 = 0;
  m5 = 0;
}
void  Mat2::setRotation( double v ) {
  double cs = cos(v);
  double sn = sin(v);
  m0 = cs;
  m1 = sn;
  m2 = -1 * sn;
  m3 = cs;
  m4 = 0;
  m5 = 0;
}
void  Mat2::multiply( std::shared_ptr<Mat2> b ) {
  double t0 = (m0 * b->m0) + (m1 * b->m2);
  double t2 = (m2 * b->m0) + (m3 * b->m2);
  double t4 = ((m4 * b->m0) + (m5 * b->m2)) + b->m4;
  m1 = (m0 * b->m1) + (m1 * b->m3);
  m3 = (m2 * b->m1) + (m3 * b->m3);
  m5 = ((m4 * b->m1) + (m5 * b->m3)) + b->m5;
  m0 = t0;
  m2 = t2;
  m4 = t4;
}
std::shared_ptr<Mat2>  Mat2::inverse() {
  double invdet = (m0 * m3) - (m2 * m1);
  double det = invdet;
  if ( (det > -0.0001) && (det < 0.0001) ) {
    this->toIdentity();
    return shared_from_this();
  }
  invdet = 1 / det;
  std::shared_ptr<Mat2> inv =  std::make_shared<Mat2>();
  inv->m0 = m3 * invdet;
  inv->m2 = (-1 * m2) * invdet;
  inv->m4 = (m2 * m5) - ((m3 * m4) * invdet);
  inv->m1 = (-1 * m1) * invdet;
  inv->m3 = m0 * invdet;
  inv->m5 = (m1 * m4) - ((m0 * m5) * invdet);
  return inv;
}
std::shared_ptr<Vec2>  Mat2::transformPoint( std::shared_ptr<Vec2> v ) {
  std::shared_ptr<Vec2> res =  std::make_shared<Vec2>();
  res->x = ((v->x * m0) + (v->y * m2)) + m4;
  res->y = ((v->x * m1) + (v->y * m3)) + m5;
  return res;
}
std::shared_ptr<Vec2>  Mat2::rotateVector( std::shared_ptr<Vec2> v ) {
  std::shared_ptr<Vec2> res =  std::make_shared<Vec2>();
  res->x = (v->x * m0) + (v->y * m2);
  res->y = (v->x * m1) + (v->y * m3);
  return res;
}
PathExecutor::PathExecutor( ) {
}
void  PathExecutor::Move( double x , double y ) {
  std::cout << ((std::string("Move called with ") + std::to_string(x)) + std::string(", ")) + std::to_string(y) << std::endl;
}
void  PathExecutor::Line( double x , double y ) {
  std::cout << ((std::string("Line called with ") + std::to_string(x)) + std::string(", ")) + std::to_string(y) << std::endl;
}
void  PathExecutor::Curve( double x0 , double y0 , double x1 , double y1 , double x2 , double y2 ) {
  std::cout << (((((((((((std::string("Cubic bezier curve called with ") + std::to_string(x0)) + std::string(", ")) + std::to_string(y0)) + std::string(" ")) + std::to_string(x1)) + std::string(", ")) + std::to_string(y1)) + std::string(" ")) + std::to_string(x2)) + std::string(", ")) + std::to_string(y2)) + std::string(" ") << std::endl;
}
PathCollector::PathCollector( ) {
}
void  PathCollector::Move( double x , double y ) {
  pathParts.push_back( (((std::string("M ") + std::to_string(x)) + std::string(" ")) + std::to_string(y)) + std::string(" ")  );
}
void  PathCollector::Line( double x , double y ) {
  pathParts.push_back( (((std::string("L ") + std::to_string(x)) + std::string(" ")) + std::to_string(y)) + std::string(" ")  );
}
void  PathCollector::Curve( double x0 , double y0 , double x1 , double y1 , double x2 , double y2 ) {
  pathParts.push_back( (((((((((((std::string("C ") + std::to_string(x0)) + std::string(" ")) + std::to_string(y0)) + std::string(" ")) + std::to_string(x1)) + std::string(" ")) + std::to_string(y1)) + std::string(" ")) + std::to_string(x2)) + std::string(" ")) + std::to_string(y2)) + std::string(" ")  );
}
std::string  PathCollector::getString() {
  return join( pathParts , std::string(" "));
}
PathSegment::PathSegment( ) {
  this->t0 = 0;
  this->t1 = 0;
  this->t2 = 0;
  this->t3 = 0;
  this->t4 = 0;
  this->t5 = 0;
  this->t6 = 0;
}
EVGBezierPath::EVGBezierPath( ) {
  this->pointCnt = 0;
  this->closed = false;
  this->bounds = Vec2::CreateNew(0, 0);
  ;
  this->cp1 = Vec2::CreateNew(0, 0);
  ;
  this->cp2 = Vec2::CreateNew(0, 0);
  ;
  this->controlPoint = Vec2::CreateNew(0, 0);
  ;
}
void  EVGBezierPath::close() {
  closed = true;
}
void  EVGBezierPath::Line( std::shared_ptr<Vec2> point ) {
}
void  EVGBezierPath::moveTo( std::shared_ptr<Vec2> point ) {
  controlPoint->x = point->x;
  controlPoint->y = point->y;
}
EVGPathParser::EVGPathParser( ) {
  this->i = 0;
  this->__len = 0;
  this->last_number = 0;
}
double  EVGPathParser::__sqr( double v ) {
  return v * v;
}
std::shared_ptr<Vec2>  EVGPathParser::__xformPoint( std::shared_ptr<Vec2> point , std::shared_ptr<PathSegment> seg ) {
  std::shared_ptr<Vec2> res = Vec2::CreateNew((((point->x * seg->t0) + (point->y * seg->t2)) + seg->t4), (((point->x * seg->t1) + (point->y * seg->t3)) + seg->t5));
  return res;
}
std::shared_ptr<Vec2>  EVGPathParser::__xformVec( std::shared_ptr<Vec2> point , std::shared_ptr<PathSegment> seg ) {
  return Vec2::CreateNew(((point->x * seg->t0) + (point->y * seg->t2)), ((point->x * seg->t1) + (point->y * seg->t3)));
}
double  EVGPathParser::__vmag( std::shared_ptr<Vec2> point ) {
  return sqrt(((point->x * point->x) + (point->y * point->y)));
}
double  EVGPathParser::__vecrat( std::shared_ptr<Vec2> u , std::shared_ptr<Vec2> v ) {
  return ((u->x * v->x) + (u->y * v->y)) / (this->__vmag(u) * this->__vmag(v));
}
double  EVGPathParser::__vecang( std::shared_ptr<Vec2> u , std::shared_ptr<Vec2> v ) {
  double r = this->__vecrat(u, v);
  if ( r < -1 ) {
    r = -1;
  }
  if ( r > 1 ) {
    r = 1;
  }
  double res = 1;
  if ( (u->x * v->y) < (u->y * v->x) ) {
    res = -1;
  }
  return res * (acos(r));
}
bool  EVGPathParser::scanNumber() {
  const char* s = this->buff;
  char fc = s[i];
  char c = fc;
  int sp = 0;
  int ep = 0;
  fc = s[i];
  if ( (((fc == 45) && ((s[(i + 1)]) >= 46)) && ((s[(i + 1)]) <= 57)) || ((fc >= 48) && (fc <= 57)) ) {
    sp = i;
    i = 1 + i;
    c = s[i];
    while ((i < __len) && ((((c >= 48) && (c <= 57)) || (c == (46))) || ((i == sp) && ((c == (43)) || (c == (45)))))) {
      i = 1 + i;
      if ( i >= __len ) {
        break;
      }
      c = s[i];
    }
    ep = i;
    last_number = /*unwrap dbl*/(cpp_str_to_double((std::string( s + sp, ep - sp )))).value;
    return true;
  }
  return false;
}
std::shared_ptr<Vec2>  EVGPathParser::pathArcTo( std::shared_ptr<PathExecutor> callback , std::shared_ptr<Vec2> cp , std::shared_ptr<PathSegment> args , bool rel ) {
  double rx = 0;
  double ry = 0;
  double rotx = 0;
  double x1 = 0;
  double y1 = 0;
  double x2 = 0;
  double y2 = 0;
  double cx = 0;
  double cy = 0;
  double dx = 0;
  double dy = 0;
  double d = 0;
  double x1p = 0;
  double y1p = 0;
  double cxp = 0;
  double cyp = 0;
  double s = 0;
  double sa = 0;
  double sb = 0;
  /** unused:  double ux = 0   **/ ;
  /** unused:  double uy = 0   **/ ;
  /** unused:  double vx = 0   **/ ;
  /** unused:  double vy = 0   **/ ;
  double a1 = 0;
  double da = 0;
  double x = 0;
  double y = 0;
  double tanx = 0;
  double tany = 0;
  double a = 0;
  double px = 0;
  double py = 0;
  double ptanx = 0;
  double ptany = 0;
  std::shared_ptr<PathSegment> t =  std::make_shared<PathSegment>();
  double sinrx = 0;
  double cosrx = 0;
  double fa = 0;
  double fs = 0;
  int i_1 = 0;
  int ndivs = 0;
  double hda = 0;
  double kappa = 0;
  double PI_VALUE = M_PI;
  double cpx = cp->x;
  double cpy = cp->y;
  rx = fabs(args->t0);
  ry = fabs(args->t1);
  rotx = (args->t2 / 180) * PI_VALUE;
  fa = (((fabs(args->t3)) > 0.00001) ? 1 : 0);
  fs = (((fabs(args->t4)) > 0.00001) ? 1 : 0);
  x1 = cpx;
  y1 = cpy;
  if ( rel ) {
    x2 = cpx + args->t5;
    y2 = cpy + args->t6;
  } else {
    x2 = args->t5;
    y2 = args->t6;
  }
  dx = x1 - x2;
  dy = y1 - y2;
  d = sqrt(((dx * dx) + (dy * dy)));
  if ( ((d < 0.00001) || (rx < 0.00001)) || (ry < 0.00001) ) {
    callback->Line(x2, y2);
    return Vec2::CreateNew(x2, y2);
  }
  sinrx = sin(rotx);
  cosrx = cos(rotx);
  x1p = ((cosrx * dx) / 2) + ((sinrx * dy) / 2);
  y1p = (((-1 * sinrx) * dx) / 2) + ((cosrx * dy) / 2);
  d = ((x1p * x1p) / (rx * rx)) + ((y1p * y1p) / (ry * ry));
  if ( d > 1 ) {
    d = sqrt(d);
    rx = rx * d;
    ry = ry * d;
  }
  s = 0;
  sa = (((rx * rx) * (ry * ry)) - ((rx * rx) * (y1p * y1p))) - ((ry * ry) * (x1p * x1p));
  sb = ((rx * rx) * (y1p * y1p)) + ((ry * ry) * (x1p * x1p));
  if ( sa < 0 ) {
    sa = 0;
  }
  if ( sb > 0 ) {
    s = sqrt((sa / sb));
  }
  if ( fa == fs ) {
    s = -1 * s;
  }
  cxp = ((s * rx) * y1p) / ry;
  cyp = ((s * (-1 * ry)) * x1p) / rx;
  cx = ((x1 + x2) / 2) + ((cosrx * cxp) - (sinrx * cyp));
  cy = ((y1 + y2) / 2) + ((sinrx * cxp) + (cosrx * cyp));
  std::shared_ptr<Vec2> u = Vec2::CreateNew(((x1p - cxp) / rx), ((y1p - cyp) / ry));
  std::shared_ptr<Vec2> v = Vec2::CreateNew((((-1 * x1p) - cxp) / rx), (((-1 * y1p) - cyp) / ry));
  std::shared_ptr<Vec2> unitV = Vec2::CreateNew(1, 0);
  a1 = this->__vecang(unitV, u);
  da = this->__vecang(u, v);
  if ( (fs == 0) && (da > 0) ) {
    da = da - (2 * PI_VALUE);
  } else {
    if ( (fs == 1) && (da < 0) ) {
      da = (2 * PI_VALUE) + da;
    }
  }
  t->t0 = cosrx;
  t->t1 = sinrx;
  t->t2 = -1 * sinrx;
  t->t3 = cosrx;
  t->t4 = cx;
  t->t5 = cy;
  ndivs = (int)floor( (((fabs(da)) / (PI_VALUE * 0.5)) + 1));
  hda = (da / ((double)(ndivs))) / 2;
  kappa = fabs((((4 / 3) * (1 - (cos(hda)))) / (sin(hda))));
  if ( da < 0 ) {
    kappa = -1 * kappa;
  }
  i_1 = 0;
  while (i_1 <= ndivs) {
    a = a1 + ((da * ((double)(i_1))) / ((double)(ndivs)));
    dx = cos(a);
    dy = sin(a);
    std::shared_ptr<Vec2> trans = this->__xformPoint(Vec2::CreateNew((dx * rx), (dy * ry)), t);
    x = trans->x;
    y = trans->y;
    std::shared_ptr<Vec2> v_trans = this->__xformVec(Vec2::CreateNew((((-1 * dy) * rx) * kappa), ((dx * ry) * kappa)), t);
    tanx = v_trans->x;
    tany = v_trans->y;
    if ( i_1 > 0 ) {
      callback->Curve(px + ptanx, py + ptany, x - tanx, y - tany, x, y);
    }
    px = x;
    py = y;
    ptanx = tanx;
    ptany = tany;
    i_1 = i_1 + 1;
  }
  std::shared_ptr<Vec2> rv = Vec2::CreateNew(x2, y2);
  return rv;
}
void  EVGPathParser::parsePath( std::string path , std::shared_ptr<PathExecutor> callback ) {
  i = 0;
  this->buff  = path.c_str();
  const char* s = this->buff;
  __len = strlen( s );
  /** unused:  const char* buff_1 = path.c_str()   **/ ;
  char cmd = 76;
  /** unused:  std::shared_ptr<EVGBezierPath> path_1 =  std::make_shared<EVGBezierPath>()   **/ ;
  std::shared_ptr<PathSegment> args =  std::make_shared<PathSegment>();
  int require_args = 2;
  int arg_cnt = 0;
  std::shared_ptr<PathSegment> QPx =  std::make_shared<PathSegment>();
  std::shared_ptr<PathSegment> QPy =  std::make_shared<PathSegment>();
  std::shared_ptr<PathSegment> CPx =  std::make_shared<PathSegment>();
  std::shared_ptr<PathSegment> CPy =  std::make_shared<PathSegment>();
  double cx = 0;
  double cy = 0;
  double cx2 = 0;
  double cy2 = 0;
  int last_i = -1;
  while (i < __len) {
    if ( last_i == i ) {
      i = i + 1;
    }
    last_i = i;
    char c = s[i];
    if ( (((c == (86)) || (c == (118))) || (c == (72))) || (c == (104)) ) {
      cmd = c;
      require_args = 1;
      arg_cnt = 0;
      continue;
    }
    if ( (((((c == (109)) || (c == (77))) || (c == (76))) || (c == (108))) || (c == (116))) || (c == (84)) ) {
      cmd = c;
      require_args = 2;
      arg_cnt = 0;
      continue;
    }
    if ( (((c == (113)) || (c == (81))) || (c == (83))) || (c == (115)) ) {
      cmd = c;
      require_args = 4;
      arg_cnt = 0;
      continue;
    }
    if ( (c == (99)) || (c == (67)) ) {
      cmd = c;
      require_args = 6;
      arg_cnt = 0;
      continue;
    }
    if ( (c == (97)) || (c == (65)) ) {
      cmd = c;
      require_args = 7;
      arg_cnt = 0;
      continue;
    }
    if ( this->scanNumber() ) {
      switch (arg_cnt ) { 
        case 0 : 
          {
            args->t0 = last_number;
            break;
          }
        case 1 : 
          {
            args->t1 = last_number;
            break;
          }
        case 2 : 
          {
            args->t2 = last_number;
            break;
          }
        case 3 : 
          {
            args->t3 = last_number;
            break;
          }
        case 4 : 
          {
            args->t4 = last_number;
            break;
          }
        case 5 : 
          {
            args->t5 = last_number;
            break;
          }
        case 6 : 
          {
            args->t6 = last_number;
            break;
          }
        default: 
          break;
      }
      arg_cnt = arg_cnt + 1;
      if ( arg_cnt >= require_args ) {
        switch (cmd ) { 
          case 109 : 
            {
              callback->Move(cx + args->t0, cy + args->t1);
              cx = args->t0;
              cy = args->t1;
              cmd = 76;
              require_args = 2;
              cx2 = cx;
              cy2 = cy;
              break;
            }
          case 77 : 
            {
              callback->Move(args->t0, args->t1);
              cx = args->t0;
              cy = args->t1;
              cmd = 76;
              require_args = 2;
              cx2 = cx;
              cy2 = cy;
              break;
            }
          case 108 : 
            {
              callback->Line(cx + args->t0, cy + args->t1);
              cx = cx + args->t0;
              cy = cy + args->t1;
              cx2 = cx;
              cy2 = cy;
              break;
            }
          case 76 : 
            {
              callback->Line(args->t0, args->t1);
              cx = args->t0;
              cy = args->t1;
              cx2 = cx;
              cy2 = cy;
              break;
            }
          case 104 : 
            {
              callback->Line(cx + args->t0, cy);
              cx = cx + args->t0;
              cx2 = cx;
              break;
            }
          case 72 : 
            {
              callback->Line(args->t0, cy);
              cx = args->t0;
              cx2 = cx;
              break;
            }
          case 118 : 
            {
              callback->Line(cx, cy + args->t0);
              cy = cy + args->t0;
              cy2 = cy;
              break;
            }
          case 86 : 
            {
              callback->Line(cx, args->t0);
              cy = args->t0;
              cy2 = cy;
              break;
            }
          case 99 : 
            {
              callback->Curve(cx + args->t0, cy + args->t1, cx + args->t2, cy + args->t3, cx + args->t4, cy + args->t5);
              cx2 = cx + args->t2;
              cy2 = cy + args->t3;
              cx = cx + args->t4;
              cy = cy + args->t5;
              break;
            }
          case 67 : 
            {
              callback->Curve(args->t0, args->t1, args->t2, args->t3, args->t4, args->t5);
              cx2 = args->t2;
              cy2 = args->t3;
              cx = args->t4;
              cy = args->t5;
              break;
            }
          case 115 : 
            {
              callback->Curve((cx + cx) - cx2, (cy + cy) - cy2, cx + args->t0, cy + args->t1, cx + args->t2, cy + args->t3);
              cx2 = cx + args->t0;
              cy2 = cy + args->t1;
              cx = cx + args->t2;
              cy = cy + args->t3;
              break;
            }
          case 83 : 
            {
              callback->Curve((cx + cx) - cx2, (cy + cy) - cy2, args->t0, args->t1, args->t2, args->t3);
              cx2 = args->t0;
              cy2 = args->t1;
              cx = args->t2;
              cy = args->t3;
              break;
            }
          case 113 : 
            {
              QPx->t0 = cx;
              QPy->t0 = cy;
              QPx->t1 = cx + args->t0;
              QPy->t1 = cy + args->t1;
              QPx->t2 = cx + args->t2;
              QPy->t2 = cy + args->t3;
              CPx->t0 = QPx->t0;
              CPy->t0 = QPy->t0;
              CPx->t1 = QPx->t0 + ((2 / 3) * (QPx->t1 - QPx->t0));
              CPy->t1 = QPy->t0 + ((2 / 3) * (QPy->t1 - QPy->t0));
              CPx->t2 = QPx->t2 + ((2 / 3) * (QPx->t1 - QPx->t2));
              CPy->t2 = QPy->t2 + ((2 / 3) * (QPy->t1 - QPy->t2));
              CPx->t3 = QPx->t2;
              CPy->t3 = QPy->t2;
              callback->Curve(CPx->t1, CPy->t1, CPx->t2, CPy->t2, CPx->t3, CPy->t3);
              cx2 = CPx->t2;
              cy2 = CPy->t2;
              cx = CPx->t3;
              cy = CPy->t3;
              break;
            }
          case 81 : 
            {
              QPx->t0 = cx;
              QPy->t0 = cy;
              QPx->t1 = args->t0;
              QPy->t1 = args->t1;
              QPx->t2 = args->t2;
              QPy->t2 = args->t3;
              CPx->t0 = QPx->t0;
              CPy->t0 = QPy->t0;
              CPx->t1 = QPx->t0 + ((2 / 3) * (QPx->t1 - QPx->t0));
              CPy->t1 = QPy->t0 + ((2 / 3) * (QPy->t1 - QPy->t0));
              CPx->t2 = QPx->t2 + ((2 / 3) * (QPx->t1 - QPx->t2));
              CPy->t2 = QPy->t2 + ((2 / 3) * (QPy->t1 - QPy->t2));
              CPx->t3 = QPx->t2;
              CPy->t3 = QPy->t2;
              callback->Curve(CPx->t1, CPy->t1, CPx->t2, CPy->t2, CPx->t3, CPy->t3);
              cx2 = CPx->t1;
              cy2 = CPy->t1;
              cx = CPx->t2;
              cy = CPy->t3;
              break;
            }
          case 84 : 
            {
              QPx->t0 = cx;
              QPy->t0 = cy;
              QPx->t1 = (2 * cx) - cx2;
              QPy->t1 = (2 * cy) - cy2;
              QPx->t2 = args->t0;
              QPy->t2 = args->t1;
              CPx->t0 = QPx->t0;
              CPy->t0 = QPy->t0;
              CPx->t1 = QPx->t0 + ((2 / 3) * (QPx->t1 - QPx->t0));
              CPy->t1 = QPy->t0 + ((2 / 3) * (QPy->t1 - QPy->t0));
              CPx->t2 = QPx->t2;
              CPy->t2 = QPy->t2;
              callback->Curve(CPx->t0, CPy->t0, CPx->t1, CPy->t1, CPx->t2, CPy->t2);
              cx2 = CPx->t1;
              cy2 = CPy->t1;
              cx = CPx->t2;
              cy = CPy->t3;
              break;
            }
          case 116 : 
            {
              QPx->t0 = cx;
              QPy->t0 = cy;
              QPx->t1 = (2 * cx) - cx2;
              QPy->t1 = (2 * cy) - cy2;
              QPx->t2 = cx + args->t0;
              QPy->t2 = cy + args->t1;
              CPx->t0 = QPx->t0;
              CPy->t0 = QPy->t0;
              CPx->t1 = QPx->t0 + ((2 / 3) * (QPx->t1 - QPx->t0));
              CPy->t1 = QPy->t0 + ((2 / 3) * (QPy->t1 - QPy->t0));
              CPx->t2 = QPx->t2;
              CPy->t2 = QPy->t2;
              callback->Curve(CPx->t0, CPy->t0, CPx->t1, CPy->t1, CPx->t2, CPy->t2);
              cx2 = CPx->t1;
              cy2 = CPy->t1;
              cx = CPx->t2;
              cy = CPy->t3;
              break;
            }
          case 97 : 
            {
              std::shared_ptr<Vec2> res = this->pathArcTo(callback, Vec2::CreateNew(cx, cy), args, true);
              cx = res->x;
              cy = res->y;
              cx2 = cx;
              cy2 = cy;
              break;
            }
          case 65 : 
            {
              std::shared_ptr<Vec2> res_1 = this->pathArcTo(callback, Vec2::CreateNew(cx, cy), args, false);
              cx = res_1->x;
              cy = res_1->y;
              cx2 = cx;
              cy2 = cy;
              break;
            }
          default: 
            if ( arg_cnt >= 2 ) {
              cx = args->t0;
              cy = args->t1;
              cx2 = cx;
              cy2 = cy;
            }
            break;
        }
        arg_cnt = 0;
      }
    }
  }
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::string path1 = std::string("M130 110 C 120 140, 180 140, 170 110");
  std::string path2 = std::string("M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80");
  std::string path3 = std::string("M10 80 Q 95 10 180 80");
  std::string path4 = std::string("M10 80 Q 52.5 10, 95 80 T 180 80");
  std::string path5 = std::string("M-130 -110 C 120 140, 180 140, 170 110");
  std::string path6 = std::string("M10 315\r\n           L 110 215\r\n           A 30 50 0 0 1 162.55 162.45\r\n           L 172.55 152.45\r\n           A 30 50 -45 0 1 215.1 109.9\r\n           L 315 10");
  std::string path7 = std::string("M 14.781 14.347 h 1.738 c 0.24 0 0.436 -0.194 0.436 -0.435 v -1.739 c 0 -0.239 -0.195 -0.435 -0.436 -0.435 h -1.738 c -0.239 0 -0.435 0.195 -0.435 0.435 v 1.739 C 14.347 14.152 14.542 14.347 14.781 14.347 M 18.693 3.045 H 1.307 c -0.48 0 -0.869 0.39 -0.869 0.869 v 12.17 c 0 0.479 0.389 0.869 0.869 0.869 h 17.387 c 0.479 0 0.869 -0.39 0.869 -0.869 V 3.915 C 19.562 3.435 19.173 3.045 18.693 3.045 M 18.693 16.085 H 1.307 V 9.13 h 17.387 V 16.085 Z M 18.693 5.653 H 1.307 V 3.915 h 17.387 V 5.653 Z M 3.48 12.608 h 7.824 c 0.24 0 0.435 -0.195 0.435 -0.436 c 0 -0.239 -0.194 -0.435 -0.435 -0.435 H 3.48 c -0.24 0 -0.435 0.195 -0.435 0.435 C 3.045 12.413 3.24 12.608 3.48 12.608 M 3.48 14.347 h 6.085 c 0.24 0 0.435 -0.194 0.435 -0.435 s -0.195 -0.435 -0.435 -0.435 H 3.48 c -0.24 0 -0.435 0.194 -0.435 0.435 S 3.24 14.347 3.48 14.347");
  std::string path8 = std::string("M 4.423 9.141 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 4.66 9.141 4.423 9.141 M 6.997 16.861 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 7.234 16.861 6.997 16.861 M 4.423 16.861 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 4.66 16.861 4.423 16.861 M 13.861 9.998 h 0.857 c 0.236 0 0.429 -0.192 0.429 -0.429 s -0.192 -0.429 -0.429 -0.429 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.429 S 13.624 9.998 13.861 9.998 M 14.719 16.861 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.43 s 0.192 0.429 0.43 0.429 h 0.857 c 0.236 0 0.429 -0.191 0.429 -0.429 S 14.955 16.861 14.719 16.861 M 15.576 13.001 c -0.236 0 -0.429 0.192 -0.429 0.43 c 0 0.236 0.192 0.429 0.429 0.429 c 0.237 0 0.43 -0.192 0.43 -0.429 C 16.006 13.193 15.813 13.001 15.576 13.001 M 6.997 9.141 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 7.234 9.141 6.997 9.141 M 12.145 9.141 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.429 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.192 0.43 -0.429 S 12.382 9.141 12.145 9.141 M 17.722 10.856 V 7.424 c 0 -0.948 -0.769 -1.716 -1.716 -1.716 h -0.617 l -1.038 -3.873 c -0.245 -0.916 -1.186 -1.458 -2.101 -1.213 L 3.592 2.912 C 2.676 3.157 2.133 4.098 2.378 5.014 l 0.186 0.695 H 2.278 c -0.947 0 -1.716 0.768 -1.716 1.716 V 17.72 c 0 0.947 0.769 1.716 1.716 1.716 h 13.728 c 0.947 0 1.716 -0.769 1.716 -1.716 v -1.716 c 0.947 0 1.716 -0.769 1.716 -1.716 v -1.716 C 19.438 11.624 18.669 10.856 17.722 10.856 M 16.006 6.566 c 0.473 0 0.857 0.384 0.857 0.858 v 0.238 c -0.253 -0.146 -0.544 -0.238 -0.857 -0.238 h -0.157 l -0.229 -0.858 H 16.006 Z M 14.41 5.372 l 0.55 2.053 H 6.67 L 14.41 5.372 Z M 3.814 3.741 l 8.657 -2.29 c 0.458 -0.123 0.928 0.149 1.051 0.607 l 0.222 0.828 L 3.43 5.621 l -0.223 -0.83 C 3.084 4.333 3.356 3.863 3.814 3.741 M 1.42 7.424 c 0 -0.474 0.384 -0.858 0.858 -0.858 h 0.517 l 0.229 0.858 H 2.278 c -0.314 0 -0.605 0.091 -0.858 0.238 V 7.424 Z M 16.863 17.72 c 0 0.474 -0.385 0.858 -0.857 0.858 H 2.278 c -0.474 0 -0.858 -0.385 -0.858 -0.858 V 9.141 c 0 -0.474 0.384 -0.858 0.858 -0.858 h 13.728 c 0.473 0 0.857 0.384 0.857 0.858 v 1.715 h -1.716 c -0.947 0 -1.716 0.768 -1.716 1.716 v 1.716 c 0 0.947 0.769 1.716 1.716 1.716 h 1.716 V 17.72 Z M 18.58 14.288 c 0 0.474 -0.385 0.857 -0.858 0.857 h -2.574 c -0.474 0 -0.857 -0.384 -0.857 -0.857 v -1.716 c 0 -0.474 0.384 -0.858 0.857 -0.858 h 2.574 c 0.474 0 0.858 0.385 0.858 0.858 V 14.288 Z M 9.571 16.861 H 8.713 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.236 0 0.429 -0.191 0.429 -0.429 S 9.808 16.861 9.571 16.861 M 12.145 16.861 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.43 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.191 0.43 -0.429 S 12.382 16.861 12.145 16.861 M 9.571 9.141 H 8.713 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 C 9.808 9.998 10 9.806 10 9.569 S 9.808 9.141 9.571 9.141");
  std::string path9 = std::string("M 4.423 9.141 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 4.66 9.141 4.423 9.141 M 6.997 16.861 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 7.234 16.861 6.997 16.861 M 4.423 16.861 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 4.66 16.861 4.423 16.861 M 13.861 9.998 h 0.857 c 0.236 0 0.429 -0.192 0.429 -0.429 s -0.192 -0.429 -0.429 -0.429 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.429 S 13.624 9.998 13.861 9.998 M 14.719 16.861 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.43 s 0.192 0.429 0.43 0.429 h 0.857 c 0.236 0 0.429 -0.191 0.429 -0.429 S 14.955 16.861 14.719 16.861 M 15.576 13.001 c -0.236 0 -0.429 0.192 -0.429 0.43 c 0 0.236 0.192 0.429 0.429 0.429 c 0.237 0 0.43 -0.192 0.43 -0.429 C 16.006 13.193 15.813 13.001 15.576 13.001 M 6.997 9.141 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 7.234 9.141 6.997 9.141 M 12.145 9.141 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.429 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.192 0.43 -0.429 S 12.382 9.141 12.145 9.141 M 17.722 10.856 V 7.424 c 0 -0.948 -0.769 -1.716 -1.716 -1.716 h -0.617 l -1.038 -3.873 -3 -4");
  std::string path10 = std::string("M 16.853 8.355 V 5.888 c 0 -3.015 -2.467 -5.482 -5.482 -5.482 H 8.629 c -3.015 0 -5.482 2.467 -5.482 5.482 v 2.467 l -2.741 7.127 c 0 1.371 4.295 4.112 9.594 4.112 s 9.594 -2.741 9.594 -4.112 L 16.853 8.355 Z M 5.888 17.367 c -0.284 0 -0.514 -0.23 -0.514 -0.514 c 0 -0.284 0.23 -0.514 0.514 -0.514 c 0.284 0 0.514 0.23 0.514 0.514 C 6.402 17.137 6.173 17.367 5.888 17.367 Z M 5.203 10 c 0 -0.377 0.19 -0.928 0.423 -1.225 c 0 0 0.651 -0.831 1.976 -0.831 c 0.672 0 1.141 0.309 1.141 0.309 C 9.057 8.46 9.315 8.938 9.315 9.315 v 1.028 c 0 0.188 -0.308 0.343 -0.685 0.343 H 5.888 C 5.511 10.685 5.203 10.377 5.203 10 Z M 7.944 16.853 H 7.259 v -1.371 l 0.685 -0.685 V 16.853 Z M 9.657 16.853 H 8.629 v -2.741 h 1.028 V 16.853 Z M 8.972 13.426 v -1.028 c 0 -0.568 0.46 -1.028 1.028 -1.028 c 0.568 0 1.028 0.46 1.028 1.028 v 1.028 H 8.972 Z M 11.371 16.853 h -1.028 v -2.741 h 1.028 V 16.853 Z M 12.741 16.853 h -0.685 v -2.056 l 0.685 0.685 V 16.853 Z M 14.112 17.367 c -0.284 0 -0.514 -0.23 -0.514 -0.514 c 0 -0.284 0.23 -0.514 0.514 -0.514 c 0.284 0 0.514 0.23 0.514 0.514 C 14.626 17.137 14.396 17.367 14.112 17.367 Z M 14.112 10.685 h -2.741 c -0.377 0 -0.685 -0.154 -0.685 -0.343 V 9.315 c 0 -0.377 0.258 -0.855 0.572 -1.062 c 0 0 0.469 -0.309 1.141 -0.309 c 1.325 0 1.976 0.831 1.976 0.831 c 0.232 0.297 0.423 0.848 0.423 1.225 S 14.489 10.685 14.112 10.685 Z M 18.347 15.801 c -0.041 0.016 -0.083 0.023 -0.124 0.023 c -0.137 0 -0.267 -0.083 -0.319 -0.218 l -2.492 -6.401 c -0.659 -1.647 -1.474 -2.289 -2.905 -2.289 c -0.95 0 -1.746 0.589 -1.754 0.595 c -0.422 0.317 -1.084 0.316 -1.507 0 C 9.239 7.505 8.435 6.916 7.492 6.916 c -1.431 0 -2.246 0.642 -2.906 2.292 l -2.491 6.398 c -0.069 0.176 -0.268 0.264 -0.443 0.195 c -0.176 -0.068 -0.264 -0.267 -0.195 -0.444 l 2.492 -6.401 c 0.765 -1.911 1.824 -2.726 3.543 -2.726 c 1.176 0 2.125 0.702 2.165 0.731 c 0.179 0.135 0.506 0.135 0.685 0 c 0.04 -0.029 0.99 -0.731 2.165 -0.731 c 1.719 0 2.779 0.814 3.542 2.723 l 2.493 6.404 C 18.611 15.534 18.524 15.733 18.347 15.801 Z");
  /** unused:  std::string path11 = std::string("M10,6.536c-2.263,0-4.099,1.836-4.099,4.098S7.737,14.732,10,14.732s4.099-1.836,4.099-4.098S12.263,6.536,10,6.536M10,13.871c-1.784,0-3.235-1.453-3.235-3.237S8.216,7.399,10,7.399c1.784,0,3.235,1.452,3.235,3.235S11.784,13.871,10,13.871M17.118,5.672l-3.237,0.014L12.52,3.697c-0.082-0.105-0.209-0.168-0.343-0.168H7.824c-0.134,0-0.261,0.062-0.343,0.168L6.12,5.686H2.882c-0.951,0-1.726,0.748-1.726,1.699v7.362c0,0.951,0.774,1.725,1.726,1.725h14.236c0.951,0,1.726-0.773,1.726-1.725V7.195C18.844,6.244,18.069,5.672,17.118,5.672 M17.98,14.746c0,0.477-0.386,0.861-0.862,0.861H2.882c-0.477,0-0.863-0.385-0.863-0.861V7.384c0-0.477,0.386-0.85,0.863-0.85l3.451,0.014c0.134,0,0.261-0.062,0.343-0.168l1.361-1.989h3.926l1.361,1.989c0.082,0.105,0.209,0.168,0.343,0.168l3.451-0.014c0.477,0,0.862,0.184,0.862,0.661V14.746z")   **/ ;
  std::shared_ptr<PathExecutor> ex =  std::make_shared<PathExecutor>();
  std::shared_ptr<EVGPathParser> parser =  std::make_shared<EVGPathParser>();
  parser->parsePath(path1, ex);
  parser->parsePath(path2, ex);
  parser->parsePath(path3, ex);
  parser->parsePath(path4, ex);
  parser->parsePath(path5, ex);
  parser->parsePath(path6, ex);
  std::shared_ptr<PathCollector> coll =  std::make_shared<PathCollector>();
  parser->parsePath(path6, coll);
  std::cout << coll->getString() << std::endl;
  std::shared_ptr<PathCollector> coll_2 =  std::make_shared<PathCollector>();
  parser->parsePath(path7, coll_2);
  std::cout << coll_2->getString() << std::endl;
  std::cout << std::string(" -----  ") << std::endl;
  std::shared_ptr<PathCollector> coll_3 =  std::make_shared<PathCollector>();
  parser->parsePath(path8, coll_3);
  std::cout << coll_3->getString() << std::endl;
  std::cout << std::string(" -----  ") << std::endl;
  std::shared_ptr<PathCollector> coll_4 =  std::make_shared<PathCollector>();
  parser->parsePath(path9, coll_4);
  std::cout << coll_4->getString() << std::endl;
  std::cout << std::string(" -----  ") << std::endl;
  std::shared_ptr<PathCollector> coll_5 =  std::make_shared<PathCollector>();
  parser->parsePath(path10, coll_5);
  std::cout << coll_5->getString() << std::endl;
  return 0;
}
