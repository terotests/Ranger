; operators to get time from JavaScript
systemclass TimeIntervalID {
    es6 TimeInterval
}
systemclass TimeOutID {
    es6 number
    java7 Thread
    swift3 setTimeoutClass
    go '*r_go_timer'
}
operators {
    clearInterval cmdClearInterval:void ( i:TimeIntervalID) {
        templates {
            es6 ("clearInterval( " (e 1) ")")
        }
    }
    setInterval cmdInterval:TimeIntervalID (code:block ms:int) {
        templates {
            es6 ("setInterval( () => {" (block 1 ) "} , " (e 2) ")")
        }
    }
    clearTimeout cmdClearInterval:void ( i:TimeOutID) {
        templates {
            es6 ("clearTimeout(" (e 1) ")")
            java7 ( (e 1) ".interrupt();" nl)
            swift3 ( (e 1) '.stop()' nl)
            cpp ()
            go ( (e 1) ".is_valid = false;" nl)
        }
    }

    setTimeout cmdInterval:TimeOutID (ms:int code:block) {
        templates {
            go (
                "r_setTimeout( " (e 1) ",  func() {" nl I (block 2) i nl " } )"
                (imp "time")

(create_polyfill '
type r_go_timer struct { 
  is_valid bool 
}
func r_setTimeout(  ms int64, cb func() () ) *r_go_timer {
    o := new(r_go_timer)
    o.is_valid = true
    time.AfterFunc( time.Duration(ms)*time.Millisecond, func() () {
        if o.is_valid {
            cb() 
        }   
    })
    return o
} 
') ) 
            cpp ( 'setTimeout(' (e 1) ', [&](){' nl I (block 2) i nl '});' 
    (imp '<future>')
    (imp '<chrono>')
    (imp '<thread>')
(create_polyfill `

void setTimeout(int milliseconds,std::function<void()> func)
{   
    std::async(std::launch::async,[=]()
    {       
        std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));        
        func(); 
    });
};
`)

            )

            test1_swift3 ( 'setTimeoutClass(ms: ' (e 1) ', callback: { () ->  Void in ' nl I  (block 2) i nl '})'
            (imp "Foundation")
(create_polyfill '
class setTimeoutClass {
  var cb : (() -> Void)?
  init( ms:Int, callback : @escaping  (() -> Void) ) { 
    self.cb = callback
    self.cb!()
  }
  func call() {
    self.cb!()
  } 
  func stop() {
  }
} 
'    )

            )


            swift3 ( 'setTimeoutClass(ms: ' (e 1) ', callback: { () ->  Void in ' nl I  (block 2) i nl '})'
            (imp "Foundation")
(create_polyfill '
class setTimeoutClass {
  var timer = Timer()
  var cb : (() -> Void)?
	init( ms:Int, callback : @escaping  (() -> Void) ) { 
    self.timer = Timer.scheduledTimer(timeInterval:(Double(ms)*0.001), target: self, selector: #selector(self.callMe), userInfo: nil, repeats: false)
    self.cb = callback
  }
	@objc func callMe(t: Timer) {
    self.cb!()
  } 
  func stop() {
    self.timer.invalidate();
  }
} 
'    )

            )

            es6 ("setTimeout( () => {" (block 2 ) "} , " (e 1) ")") ;"
            java7 (
"__startThread(" 
    "new Thread() {" nl I
        "@Override" nl
        "public void run() {" nl I
            "try {" nl I
                "Thread.sleep( (long) ( " (e 1) "));" nl
                (block 2)
                nl i
            "} catch (Exception e) {" nl I
                "System.err.println(e);" nl i
            "}" nl i
        "}" nl i
    "}" nl
 ");"
(create_polyfill
"static Thread __startThread( Thread t) {
    t.start();
    return t;
}"
)
            )

            java7uisave (
            "new Thread() {" nl I
                "@Override" nl
                "public void run() {" nl I
                    "try {" nl I
                        "Thread.sleep( (long) (1000 *" (e 1) "));" nl
                        "getActivity().runOnUiThread(new Runnable(){" nl
                            "@Override" nl
                            "public void run() {" nl I                    
                                (block 2)
                            nl i "}"
                            nl i 
                        "});"
                        nl i
                    "} catch (Exception e) {" nl I
                        "System.err.println(e);" nl i
                    "}" nl i
                "}" nl i
            "}.start();" nl

            )
            
        }
    }
    setTimeout cmdInterval:TimeOutID (code:block ms:int) {
        templates {
            es6 ("setTimeout( () => {" (block 1 ) "} , " (e 2) ")")
        }
    }
    time_as_string cmdTime:string () {
        templates {
            es6 ("(new Date()).toString()")
        }
    }
}