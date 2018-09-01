
Import "JSON.clj"
Import "Timers.clj"
; Import "immutableVector.clj"

systemunion ProcessTypeUnion ( JinxProcess )

Enum processType ( Process Attribute Block Exithandler )

operators {
    http_get _:void ( path:string port:int cb:(_:void (data:string) )) {
        templates {
            es6  (
        "require('http').get({ host : " (e 1) ", path: " (e 2) ", port:" (e 3) "}, (response) => {" nl I  
            "var body='';" nl
            "response.on('data', (d) => { body += d });" nl
            "response.on('end', () => { (" (e 4)")(body) }) " nl
            i
        "})" nl i
    )

        }
    }
}

operator type:string es6 {
    fn http_get:void ( path:string port:int cb:(_:void (data:string) )) (
        "require('http').get({ host : " (e 1) ", path: " (e 2) ", port:" (e 3) "}, (response) => {" nl I  
            "var body='';" nl
            "response.on('data', (d) => { body += d });" nl
            "response.on('end', () => { (" (e 4)")(body) }) " nl
            i
        "})" nl i
    )
    fn https_get:void ( path:string cb:(_:void (data:string) )) (
        "require('https').get({ host : " (e 1) ", path: " (e 2) "}, (response) => {" nl I  
            "var body='';" nl
            "response.on('data', (d) => { body += d });" nl
            "response.on('end', () => { (" (e 3)")(body) }) " nl
            i
        "})" nl i
    )
}

operator type:string all {
    fn createProcess:JinxProcess () {
        def p (new JinxProcess)
        p.name = self
        return p
    }
    fn process:JinxProcess ( ) {
        def p (new JinxProcess)
        p.name = self
        return p
    }
    ; (process (task ))
    ;    (task ...)
    ;    (process ...)
    ;    (process ...)

}

operator type:JinxProcess all {
    fn add@(weak):JinxProcess ( task@(strong):JinxProcess ) {
        push self.children task
        return self
    }    
    fn wait@(weak):JinxProcess ( ms:int ) {
        def t (new JinxWaitTask)
        t.ms = ms
        push self.children t
        return self
    }    
    fn func@(weak):JinxProcess ( cb@(strong):(_:JinxProcessCtx (ctx:JinxProcessCtx))) {
        def t (new JinxFuncCallBack)
        t.callback = cb
        push self.children t
        return self        
    }
    fn call@(weak):JinxProcess ( cb@(strong):(_:void (ctx:JinxProcessCtx))) {
        def t (new JinxCallBack)
        t.callback = cb
        push self.children t
        return self        
    }
    fn async@(weak):JinxProcess ( cb@(strong):(_:void (process:JinxProcess ctx:JinxProcessCtx))) {
        def t (new JinxAsyncCallBack)
        t.callback = cb
        push self.children t
        return self        
    }
    fn fetch@(weak):JinxProcess ( server:string path:string port:int cb@(strong):(_:JinxProcessCtx (res:JSONDataObject ctx:JinxProcessCtx))) {
        def t (new JinxAjaxHttpFetchTask)
        t.callback = cb
        t.server = server
        t.path = path
        t.port = port
        push self.children t
        return self        
    }
}



;operators {
;    process _:JinxProcess (name:string) {
;        templates {
;            * @macro(true) ("( json_obj " nl I ( repeat 1 (  (block 1) ) ) i nl ")")
;        }        
;    }
;    attr cmdvdomEL:vdomAttr ( name:string value:string ) {
;        templates {
;            * @macro(true) ("vdom.newAttr(" (e 1) " " (e 2) ")")
;        }
;    }        
;}


class JinxCtxEventHandler {
    def callback@(weak):(_:void ( ctx:JinxProcessCtx ))
    fn fire(ctx:JinxProcessCtx) {
        def cb:(_:void ( ctx:JinxProcessCtx )) (unwrap callback)
        if(!null? callback) {
            cb(ctx)
        }
    }
}

class JinxEventHandlerCollection@(immutable) {
    def list:Vector@(JinxCtxEventHandler) (new Vector@(JinxCtxEventHandler))
    fn add:JinxEventHandlerCollection (handler@(strong):JinxCtxEventHandler) {
        list = (push list handler)
        return this
    }
    fn fire (ctx:JinxProcessCtx) {
        list.forEach({
            item.fire(ctx)
        })
    }
}
; tasks can have the context information and use it to signal things
class JinxProcessCtx@(immutable) {
    
    def allKeys:Map@(string boolean) (new Map@(string boolean))   
    def strValues:Map@(string string) (new Map@(string string))    
    def intValues:Map@(string int) (new Map@(string int)) 
    ; def dictValues:Map@(string JSONDataObject) (new Map@(string JSONDataObject))  
    def subCtxs:Map@(string JinxProcessCtx) (new Map@(string JinxProcessCtx)) 
    def handlers:Map@(string JinxEventHandlerCollection) (new Map@(string JinxEventHandlerCollection))
    def anyValues:Map@(string Any) (new Map@(string Any)) 

    fn fire (name:string) {
        if( has handlers name ) {
            def h (get handlers name)
            h.fire(this)
        }
    }
    fn onValue:JinxProcessCtx (name:string cb@(strong lives):(_:void (ctx:JinxProcessCtx))) {
        def result this
        def hdlrs:JinxEventHandlerCollection
        if( false == (has result.handlers name)) {
            def h (new JinxCtxEventHandler)
            h.callback = cb
            def newHandler@(temp) (new JinxEventHandlerCollection)
            newHandler.list = (push newHandler.list h)
            result = (result.set_handlers( (set result.handlers name newHandler) ))
        } {
            def h (new JinxCtxEventHandler)
            h.callback = cb
            def coll (unwrap ( get handlers name ))
            coll.list = (push coll.list h)
            result = (result.set_handlers( (set result.handlers name coll) ))
        }
        return result
    }

}


operator type:JinxProcessCtx all {
    fn has:boolean (name:string) {
        return (has self.allKeys name) 
    }
    fn keys:[string] () {
        return (keys self.allKeys)
    }
    fn set:JinxProcessCtx (name:string value:JinxProcessCtx) {
        def c ( self.set_subCtxs( (set self.subCtxs name value) ) )
        c = (c.set_allKeys( (set self.allKeys name true)) )
        c.fire(name)
        return c
    }
    fn getCtx@(optional):JinxProcessCtx (name:string ) {
        return ( get self.subCtxs name  )
    }
    fn set:JinxProcessCtx (name:string value:string) {
        def c ( self.set_strValues( (set self.strValues name value) ) )
        c = (c.set_allKeys( (set self.allKeys name true)) )
        c.fire(name)
        return c
    }
    fn getStr@(optional):string (name:string ) {
        return ( get self.strValues name  )
    }
    fn getString@(optional):string (name:string ) {
        return ( get self.strValues name  )
    }
    fn set:JinxProcessCtx (name:string value:int) {
        def c ( self.set_intValues( (set self.intValues name value) ) )
        c = (c.set_allKeys( (set self.allKeys name true)) )
        c.fire(name)
        return c
    }
    fn getInt@(optional):int (name:string ) {
        return ( get self.intValues name  )
    }
    fn set:JinxProcessCtx (name:string value:JSONDataObject) {
        def c ( self.set_dictValues( (set self.dictValues name value) ) )
        c = (c.set_allKeys( (set self.allKeys name true)) )
        c.fire(name)
        return c
    }
    fn getDict@(optional):JSONDataObject (name:string ) {
        return ( get self.dictValues name  )
    }
  
}


trait task {
    fn isProcess:boolean () {
        return false
    }
    fn isTask:boolean () {
        return true
    }
}

class JinxProcess {
    
    def pType:processType processType.Process
    def attrs:[string:string]

    def is_cleaned false
    def is_running:boolean false
    def is_background false
    def is_aborted false
    def is_loop false
    def is_exithandler false
    def is_exit_run false
    def is_persistent false
    def index -1
    def buffer_index 0
    def name ""
    
    ; different process types on this process...
    def backgroundProcesses@(weak):[JinxProcess]
    def errorHandlers:[JinxProcess]
    def exitHandlers:[JinxProcess]

    def children:[JinxProcess]
    def parent@(weak):JinxProcess
    def myCtx@(weak):JinxProcessCtx
    ; if returns true exits immediately

    fn getName:string() {
        return ""
    }
    fn getValue:string() {
        return ""
    }

    ; --> dispatch change to the processes running things...
;    fn sendChange( method:(_:JinxProcessCtx (previous:JinxProcessCtx))) {
;        if(!null? myCtx) {
;            myCtx = (method( (unwrap myCtx)))
;        }
;        if(!null? parent) {
;            parent.sendChange(method)
;        }
;    }

    ; --------- error handler ------- 
    fn generateError ( ctx:JinxProcessCtx ) {
        if( ( array_length errorHandlers) > 0 ) {
            this.abort(ctx)
            for errorHandlers pc:JinxProcess i {
                pc.start( ctx )
            }
        } {
            this.abort(ctx)
            if(!null? parent) {
                parent.generateError(ctx)
            }
        }
    }

    fn isProcess:boolean () {
        return true
    }
    
    fn isTask:boolean () {
        return false
    }

    fn isGenerator:boolean () {
        return false
    }

    fn generate:JinxProcess ( ctx:JinxProcessCtx ) {
        return (new JinxProcess)
    }

    fn isBackgroundProcess:boolean () {
        return is_background
    }

    ; funtion to override
    fn cleanup() {

    }

    fn cancelTask () {
    }

    fn start (ctx:JinxProcessCtx) {
        if(is_running) {
            if( index < buffer_index) {
                this.abort(ctx)
            } {
                return            
            }
        }
        myCtx = ctx
        is_running = true
        is_aborted = false
        for children ch:JinxProcess i {
            if(ch.is_exithandler) {
                ch.is_exit_run = false
            }
        }
        this.step(ctx)
    }
    fn done:void (ctx:JinxProcessCtx) {
        def findLast:JinxProcess (this)
        while( (!null? findLast.parent) ) {
            if(findLast.is_persistent) {
                break
            }
            findLast = (unwrap findLast.parent)
        }
        findLast.returnSuccess(ctx)
    }
    fn run:boolean (ctx:JinxProcessCtx execParent:JinxProcess) {
        parent = execParent
        this.start( ctx )
        return false
    }
    fn runTask:boolean (ctx:JinxProcessCtx execParent:JinxProcess) {        
        if( is_exithandler ) {
            return true
        }
        parent = execParent
        if(this.isProcess()) {
            this.start( ctx )
            return false            
        } 
        if(is_running) {
            return false
        }
        myCtx = ctx
        is_running = true
        is_aborted = false
        def is_done ( this.run( ctx execParent ) )
        if( is_done ) {
            is_running = false
            is_aborted = false
        }
        return is_done
    }
    fn returnSuccess (ctx:JinxProcessCtx) {
        if(is_running == false || is_aborted) {
            return
        }
        this.endStep(ctx)
        if(!null? parent) {
            def p (unwrap parent)
            p.step(ctx)
        }
    }
    fn canRun:boolean () {
        if(null? parent) {
            return false
        }
        def p (unwrap parent)
        if( p.index >= 0) {
            def activeTask (itemAt p.children p.index)
            if( this == activeTask ) {
                return true
            }            
        }
        return false
    }

    fn spawnBackground ( ctx:JinxProcessCtx p:JinxProcess ) {
        if( (p.isProcess()) && is_running ) {
            p.is_background = true
            print ">>> background process is starting"
            p.parent = this
            push backgroundProcesses p
            p.start(ctx)
            return
        }        
    }

    ; process is immutable and context contains the parameters which the process tasks need for the
    ; actual processing...
    fn step(ctx:JinxProcessCtx) {
        if ( is_aborted || (is_running == false ) ) {
            return
        }
        if( index >= (array_length children) ) {
            print "*** TASK ERROR ***"
            is_aborted = true
            is_running = false
            return
        }
        if (index >= 0) {
            def activeTask (itemAt children index)
            if(activeTask.is_running && (activeTask.is_background == false)) {
                print "--- active task was running... sorry"
                return
            }
        }
        index = index + 1
        if( index >= (array_length children) ) {
            ; print "--> should exit the process " + name
            if is_loop {
                index = -1
                this.step((unwrap myCtx))
                return
            }
            if(is_persistent) {
                ; do not exit persistent process until it has specific exit command...
                return
            }
            this.returnSuccess(ctx)
            return
        }
        def p@(lives) (itemAt children index)
        
        ; the generator task or process
        if(p.isGenerator()) {
            p = p.generate(ctx)
        }
        p.parent = this
        if( (p.isProcess()) &&  (p.isBackgroundProcess()) ) {
            push backgroundProcesses p
            p.runTask( ctx this)
            this.step(ctx)
            return
        }
        ; if run return "true" continue immediately
        if( p.runTask( ctx this) ) {
            this.step(ctx)
        }
    }
    fn callExitHandlers(ctx:JinxProcessCtx) {
        for children ch:JinxProcess i {
            if(ch.is_exithandler && (false == ch.is_exit_run)) {
                ch.is_exit_run = true
                ch.start(ctx)
            }
        }        
    }
    fn cancel(ctx:JinxProcessCtx) {
        is_aborted = true
        if is_running {
            this.end(ctx)
            is_aborted = true
            for children ch:JinxProcess i {
                ch.cancel(ctx)
                ; cleanup the task event handlers
                if(ch.isTask()) {
                    ch.doTaskCleanup()
                    ch.cancelTask()
                    ch.is_running = false
                    ch.is_aborted = true
                } {
                    is_running = false
                }
                this.callExitHandlers(ctx)
            }
            for backgroundProcesses bProcess:JinxProcess i {
                bProcess.cancel(ctx)
            }
            is_running = false
        } {
            print "stopped, clearing bg processes..."
            for backgroundProcesses bProcess:JinxProcess i {
                bProcess.cancel(ctx)
            }
        }
    }
    fn doTaskCleanup() {
        if( (this.isTask())  && (is_cleaned == false ) ) {
            is_cleaned = true
            this.cleanup()
        }
    }

    ; after a step ends run this...
    fn endStep(ctx:JinxProcessCtx) {
        if(is_running == false) {
            return
        }
        is_running = false
        index = -1
        for backgroundProcesses bProcess:JinxProcess i {
            bProcess.cancel(ctx)
        }
        for children ch:JinxProcess i {
            ch.end(ctx)
            this.callExitHandlers(ctx)
        }        
        clear backgroundProcesses
    }

    fn end(ctx:JinxProcessCtx) {
        if(is_running == false) {
            this.doTaskCleanup()
            return
        }
        is_running = false
        index = -1

        this.doTaskCleanup()

        ; shutdown the background processing
        for backgroundProcesses bProcess:JinxProcess i {
            bProcess.cancel(ctx)
        }
        ; cleaning up the child processes...
        for children ch:JinxProcess i {
            ch.end(ctx)
        }        
        this.callExitHandlers(ctx)
        clear backgroundProcesses
    }
    fn abort(ctx:JinxProcessCtx) {
        if(is_running) {
            this.cancel(ctx)
        }
    }

    fn addItem (pItem:JinxProcess) {
        switch pItem.pType {
            case processType.Attribute {
                if( (pItem.getName()) == "background") {
                    this.is_background = true
                }
                if( (pItem.getName()) == "loop") {
                    this.is_loop = true
                }
                if( (pItem.getName()) == "exit") {
                    this.is_exithandler = true
                }
                if( (pItem.getName()) == "persistent") {
                    this.is_persistent = true
                }
            }
            case processType.Process {
                this.add(pItem)
            }
            case processType.Block {
                pItem.children.forEach({
                    this.add(item)
                })
;                this.add(pItem)
            }
            default {

            }
        }
    }

    sfn p1:JinxProcess (name:string) {
        def p (new JinxProcess)
        p.name = name
        return p
    }

    sfn p2:JinxProcess (name:string childP:JinxProcess) {
        def p (new JinxProcess)
        p.name = name
        p.addItem( childP )
        return p
    }

    sfn fromList:JinxProcess (list:[JinxProcess]) {
        def p (new JinxProcess)
        for list task:JinxProcess i {
            p.addItem( task )
        }
        return p
    }
    sfn fromList2:JinxProcess (name:string list:[JinxProcess]) {
        def p (new JinxProcess)
        p.name = name
        for list task:JinxProcess i {
            p.addItem( task )
        }
        return p
    }
}

; fetch data from "somewhere"

; fn fetch:JSONDataObject (url:string)
; -> just set the value to "__R"
; -> then read the "__R"
; -> if many calls just pick the __R from several calls when they arrive
;   callsomeFn( (fetch url1) (fetch url2))
; -> task should have it's own context set
; -> you can then read the return values


; fn wait (amount:double)
class JinxWaitTask {
    def ms 0
    def waitTimeout:TimeOutID
    Extends (JinxProcess)
    does task
    fn cancelTask () {
        if(!null? this.waitTimeout) {
            clearTimeout (unwrap this.waitTimeout)
        }
    }
    fn run:boolean (ctx:JinxProcessCtx execParent:JinxProcess) {
        def timeout (setTimeout ms {
            if( is_aborted == false) {
                this.returnSuccess( ctx )
            }
        })
        this.waitTimeout = timeout
        return false
    }    
}

; TODO: callback as member variable does not work currently....
class JinxGeneratorTask {
    def callback:(_:JinxProcess (ctx:JinxProcessCtx ))
    does task
    Extends (JinxProcess)
    fn generate:JinxProcess (ctx:JinxProcessCtx) {
        def cbFn (unwrap callback)
        return ( cbFn( ctx ) )
    }
    fn isGenerator:boolean () {
        return true
    }
    fn run:boolean (ctx:JinxProcessCtx execParent:JinxProcess) {
        return true
    }    
}

class JinxFuncCallBack {
    def callback:(_:JinxProcessCtx (ctx:JinxProcessCtx))
    does task
    Extends (JinxProcess)
    fn run:boolean (ctx:JinxProcessCtx execParent:JinxProcess) {
        def cb (unwrap callback)
        def nextCtx (cb(ctx))
        this.returnSuccess( nextCtx )
        return false
    }    
}
class JinxCallBack {
    def callback:(_:void (ctx:JinxProcessCtx process:JinxProcess))
    does task
    Extends (JinxProcess)
    fn run:boolean (ctx:JinxProcessCtx execParent:JinxProcess) {
        def cb (unwrap callback)
        cb(ctx execParent)
        return true
    }    
}

class JinxAsyncCallBack {
    def callback:(_:void ( process:JinxAsyncCallBack ctx:JinxProcessCtx ))
    does task
    Extends (JinxProcess)
    fn run:boolean (ctx:JinxProcessCtx execParent:JinxProcess) {
        print "callback is called "        
        def cb (unwrap callback)
        cb(this ctx)
        return false
    }    
}


class processAttr {
    Extends (JinxProcess)
    def name ""
    def value ""
    fn getName:string () {
        return name
    }
    fn getValue:string () {
        return value
    }
}

class JinxProcessBlock {
    
    Extends (JinxProcess)
    ; def items@(weak):[JinxProcess]

    static fn fromList:JinxProcess ( list:[JinxProcess]) {
        def o (new JinxProcessBlock)
        o.pType = processType.Block
        def list2@(lives temp) list
        o.children = list2
        return o
    }
}


operators {
    process _:JinxProcess ( n:string ) {
        templates {
            * @macro(true) ("JinxProcess.p1(" (e 1) ")")
        }
    }    
    process _:JinxProcess ( n:string v:vdom ) {
        templates {
            * @macro(true) ("JinxProcess.p2(" (e 1) " " (e 2) ")")
        }
    }    
    process _@(expands):JinxProcess ( v:JinxProcess el2:JinxProcess ) {
        templates {
            * @macro(true) ("(JinxProcess.fromList( ([] _:JinxProcess (" nl I
                ( repeat 1 ( nl (e 1) nl ) ) i nl
                "))))")
        }
    }       
    process _@(expands):JinxProcess ( n:string el2:JinxProcess ) {
        templates {
            * @macro(true) ("(JinxProcess.fromList2( " (e 1) " ([] _:JinxProcess (" nl I
                ( repeat 2 ( nl (e 1) nl ) ) i nl
                "))))")
        }
    }       
    process.block _@(expands):JinxProcess ( el2:[JinxProcess] ) {
        templates {
            * @macro(true) ("(JinxProcessBlock.fromList( " (e 1) " ))")
        }
    }       
    process.block _@(expands):JinxProcess ( el2:JinxProcess ) {
        templates {
            * @macro(true) ("(JinxProcessBlock.fromList( " (e 1) " ([] _:JinxProcess (" nl I
                ( repeat 2 ( nl (e 1) nl ) ) i nl
                "))))")
        }
    }       
}
operator type:JinxProcess all {
    fn getAttr:string (name:string) {

    }
}
operator type:void all {
    fn task.func:JinxProcess ( callback@(strong):(_:JinxProcessCtx (ctx:JinxProcessCtx)) ) {
        def t (new JinxFuncCallBack)
        t.callback = callback
        return t        
    }       
    ; JinxGeneratorTask
    fn task.generate:JinxProcess ( callback@(strong):(_:JinxProcess (ctx:JinxProcessCtx) ) ) {
        def t (new JinxGeneratorTask)
        t.callback = callback
        return t        
    }
    fn task.call:JinxProcess ( callback@(strong):(_:void (ctx:JinxProcessCtx process:JinxProcess)) ) {
        def t (new JinxCallBack)
        t.callback = callback
        return t        
    }
    fn task.callback:JinxProcess ( callback@(strong):(_:void (ctx:JinxProcessCtx)) ) {
        def t (new JinxCallBack)
        t.callback = callback
        return t        
    }
}
operator type:string all {
    fn process () {
        def p (new JinxProcess)
        p.name = self
        return p
    }
    fn process.attr:JinxProcess (value:string) {
        def pa (new processAttr)
        pa.name = self
        pa.value = value
        pa.pType = processType.Attribute
        return pa
    }
    fn task.func:JinxProcess ( callback@(strong):(_:JinxProcessCtx (ctx:JinxProcessCtx)) ) {
        def t (new JinxFuncCallBack)
        t.callback = callback
        return t        
    }    
    fn task_func:JinxProcess ( callback@(strong):(_:JinxProcessCtx (ctx:JinxProcessCtx)) ) {
        def t (new JinxFuncCallBack)
        t.callback = callback
        return t        
    }    
    fn task.callback:JinxProcess ( callback@(strong):(_:void (ctx:JinxProcessCtx)) ) {
        def t (new JinxCallBack)
        t.callback = callback
        return t        
    }
    fn task.fancy:JinxProcess () {
        return (process 
                    "OK task...."
                    (task.wait 0.4)
                )
    }
    
}

operator type:void all {
    fn task.wait:JinxProcess ( ms:double ) {
        def t (new JinxWaitTask)
        t.ms = (to_int (1000.0 * ms ))
        return t        
    }
}
