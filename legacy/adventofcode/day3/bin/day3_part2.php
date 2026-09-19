<?php 

class GridRow { 
  var $values;
  function __construct( ) {
    $this->values = array();
  }
}
class Grid { 
  var $cols;
  var $minx;
  var $maxx;
  var $miny;
  var $maxy;
  var $turtle_limit;
  var $first_largest;
  function __construct( ) {
    $this->cols = array();
    $this->minx = 0;
    $this->maxx = 0;
    $this->miny = 0;
    $this->maxy = 0;
    $this->turtle_limit = 0;
    $this->first_largest = 0;
  }
  function getValue( $x , $y ) {
    if ( array_key_exists($y , $this->cols ) ) {
      $col = $this->cols[$y];
      if ( array_key_exists($x , $col->values ) ) {
        return ($col->values[$x]);
      }
    }
    return 0;
  }
  function setValue( $x , $y , $value ) {
    if ( ($value > $this->turtle_limit) && ($this->first_largest == 0) ) {
      $this->first_largest = $value;
    }
    if ( array_key_exists($y , $this->cols ) ) {
      $col = $this->cols[$y];
      $col->values[$x] = $value;
    } else {
      $newCol =  new GridRow();
      $this->cols[$y] = $newCol;
      $newCol->values[$x] = $value;
    }
    if ( $x < $this->minx ) {
      $this->minx = $x;
    }
    if ( $x > $this->maxx ) {
      $this->maxx = $x;
    }
    if ( $y < $this->miny ) {
      $this->miny = $y;
    }
    if ( $y > $this->maxy ) {
      $this->maxy = $y;
    }
  }
  function getAdjacentSum( $x , $y ) {
    $v = (function ($dx, $dy) use ( &$x,  &$y) {
      return ($this)->getValue(($x + $dx), ($y + $dy));
      // captured var x
      // captured var y
    });
    return ((((((call_user_func($v, -1, -1) + call_user_func($v, -1, 0)) + call_user_func($v, -1, 1)) + call_user_func($v, 0, -1)) + call_user_func($v, 0, 1)) + call_user_func($v, 1, -1)) + call_user_func($v, 1, 0)) + call_user_func($v, 1, 1);
  }
  function printGrid() {
    $xx = $this->minx;
    $yy = $this->miny;
    while ($yy <= $this->maxy) {
      $xx = $this->minx;
      $row = array();
      while ($xx <= $this->maxx) {
        array_push($row, ($this)->getValue($xx, $yy));
        $xx = $xx + 1;
      }
      echo( implode(" ", operatorsOf::map_2($row, (function ($item, $index)  {
        return strval($item);
      }))) . "\n");
      $yy = $yy + 1;
    }
  }
}
class day_three_part_two { 
  function __construct( ) {
  }
  public static function distance( $data ) {
    $myGrid =  new Grid();
    $myGrid->turtle_limit = $data;
    $myGrid->setValue(0, 0, 1);
    $i = 0;
    $j = 0;
    $moveTurtle = (function ($dx, $dy, $steps) use ( &$i,  &$j,  &$myGrid) {
      $cnt = $steps;
      while ($cnt > 0) {
        $i = $i + $dx;
        $j = $j + $dy;
        $sum = $myGrid->getAdjacentSum($i, $j);
        $myGrid->setValue($i, $j, $sum);
        $cnt = $cnt - 1;
      }
      // captured var i
      // captured var j
      // captured var myGrid
    });
    $step = 2;
    while ($myGrid->first_largest == 0) {
      call_user_func($moveTurtle, 1, 0, 1);
      call_user_func($moveTurtle, 0, -1, $step - 1);
      call_user_func($moveTurtle, -1, 0, $step);
      call_user_func($moveTurtle, 0, 1, $step);
      call_user_func($moveTurtle, 1, 0, $step);
      $step = $step + 2;
    }
    $myGrid->printGrid();
    echo( "the first largest was " . $myGrid->first_largest . "\n");
    return $myGrid->turtle_limit;
  }
}
/* static PHP main routine */
day_three_part_two::distance(289326);
class operatorsOf { 
  function __construct( ) {
  }
  public static function map_2( $__self , $cb ) {
    /** unused:  $__len = count($__self)   **/ ;
    $res = array();
    for ( $i = 0; $i < count($__self); $i++) {
      $it = $__self[$i];
      array_push($res, call_user_func($cb, $it, $i));
    }
    return $res;
  }
}
