<?php 

class day_two { 
  function __construct( ) {
  }
  public static function distance( $data ) {
    /** unused:  $size = 1   **/ ;
    $side = 1;
    $total = 1;
    $last_total = 1;
    $n = 1;
    while ($total < $data) {
      $last_total = $total;
      $side = $side + 2;
      $total = $total + (($side - 1) * 4);
      $n = $n + 1;
    }
    $dist = ($data - $last_total) - 1;
    $sideStep = $side - 1;
    $pos = $dist % $sideStep;
    $step_ort = 0;
    $halfway = floor(($sideStep / 2));
    if ( $pos < $halfway ) {
      $step_ort = ($halfway - 1) - $pos;
    } else {
      $step_ort = ($pos - $halfway) + 1;
    }
    echo( (("total steps for " . $data) . " == ") . ($step_ort + $halfway) . "\n");
    return $step_ort + $halfway;
  }
}
/* static PHP main routine */
day_two::distance(9);
day_two::distance(10);
day_two::distance(11);
day_two::distance(12);
day_two::distance(17);
day_two::distance(23);
day_two::distance(24);
day_two::distance(1024);
day_two::distance(289326);
