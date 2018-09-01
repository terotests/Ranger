Import "SVGPath.clj"

class PathExecutor2 {
  Extends(PathExecutor)
  fn Move:void( x:double y:double) {
    print "my Exec - Move called with " + x + ", " + y
  }
}

class test {
    sfn m@(main):void () {
        def ex:PathExecutor (new PathExecutor2 ())
        def path_str:string "M 100 300 L 500 300 M 20 40 C100,100 402,102 437,251 H 90 V 90 H 10"

        def parser:EVGPathParser (new EVGPathParser())
        parser.parsePath( path_str ex)
    }
}
