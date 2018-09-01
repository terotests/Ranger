
operators {
  ret _:[T] ( a:[T] ) {
    templates {
      * ( (e 1) )
    }
  }
  ret _:T ( a:T ) {
    templates {
      * ( (e 1) )
    }
  }
}

defn Print (x) (print '' + x)
defn Print (x) (print x)

defn Range (from to) {
  def res:[int]
  def f from
  while ( f < to ) {
    push res f 
    f = f + 1
  }
  ret res
}


defn ForEach (list f) {
  def cnt (size list)
  def i 0
  while(i < cnt) {
    f (at list i) 
    i = i + 1
  }
}


defn Compose (f1 f2) (fn:? (x:?) {
  return (f1 ( (f2 (x) ) ) )
})

defn Map ( list f ) {
  def cnt (size list)
  def res:[?] 
  def i 0
  while(i < cnt) {
    def myItem (at list i)
    def item ( f myItem )
    push res item
    i = i + 1
  }
  ret res
}

defn Reduce ( list theFn initial) {
  def cnt (size list)
  def acc@(weak temp) initial
  def i 0
  while (i < cnt) {
    def myItem (at list i)
    acc = ( theFn acc myItem )
    i = i + 1
  }
  ret acc
}

defn Reduce ( list2 theFn initial) {
  def cnt (size list2)
  def acc@(weak temp) initial
  def i 0
  while (i < cnt) {
    def myItem (at list2 i)
    acc = ( theFn (acc myItem ) )
    i = i + 1
  }
  ret acc
}

defn Filter ( list f ) {
  def cnt (size list)
  def res:[?] 
  def i 0
  while(i < cnt) {
    def myItem (at list i)
    if( f myItem ) {
      push res myItem
    }
    i = i + 1
  }
  ret res
}

defn Filter ( list f ) {
  def cnt (size list)
  def res:[?] 
  def i 0
  while(i < cnt) {
    def myItem (at list i)
    if( f (myItem ) ) {
      push res myItem
    }
    i = i + 1
  }
  ret res
}

defn Revert (list) {
  def cnt (size list)
  def i 0
  def end (cnt - 1)
  def res (clone list)
  while(i < end) {
    def v1 (at list i)
    def v2 (at list end)
    set res end v1
    set res i v2
    i = i + 1
    end = end - 1
  }
  ret res
}


defn ForEach (list f) {
  def cnt (size list)
  def i 0
  while(i < cnt) {
    f ( (at list i) ) 
    i = i + 1
  }
}

defn ForEach (list f) {
  def keyList (keys list)
  def cnt (size keyList)
  def i 0
  while(i < cnt) {
    def k (at keyList i)
    f (unwrap (get list k))
    i = i + 1
  }
}

defn ConCat (left right) {
  def results:[Any]
  forEach left {
    def tmp@(temp) item
    push results tmp
  }
  forEach right {
    def tmp@(temp) item
    push results tmp
  }
  ret results
}

defn ShowAny (anyItem) {
  case anyItem str:string {
    print 'string: ' + str
  }
  case anyItem i:int {
    print " int : " + i
  }
  case anyItem b:boolean {
    print " boolean : " + (? b 'true' 'false')
  }
}