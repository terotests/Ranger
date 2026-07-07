
; Plan:
; to support: Go, PHP, Node.js

; maybe could be using Scalatra
; http://scalatra.org/guides/2.5/http/routes.html


class DefinedHTTPServer {
    def port:int 80
    constructor ( p:int ) {
        this.port = p
    }
    fn golangPortStr:string () {
        return (":" + port)
    }
}

systemclass WebServer {
    es6 Object
    go "*DefinedHTTPServer"
}

systemclass WebRequest {
    es6 Object
    go "*http.Request"
}

systemclass WebResponse {
    es6 Object
    go "http.ResponseWriter"
}


operators {
    create_web_server _:WebServer ( port:int ) {
        templates {
            go ( "CreateNew_DefinedHTTPServer(" (e 1) ")" 
                (imp "net/http")
                (imp "fmt")            
            )
            ranger ("(create_web_server " (e 1) ")")
            es6 ("(require('express'))()")
        }
    }
    prepare_server _:void ( s:WebServer )  {
        templates {
            ranger ("(prepare_server " (e 1) ")")
            es6 (
    (e 1) ".use(function(req, res, next){" nl I
        "var data = '';" nl
        "req.on('data', function(chunk){ " nl I
            "data += chunk;" nl i
        "});" nl 
        "req.on('end', function(){"nl I
          "req.rawBody = data;" nl 
          "next();" nl i
        "})" nl i
    "});" nl    

            )
            go ()
        }
    }
}


operator class:WebRequest es6 {
    fn get_post_data:string () ( (e 1) ".rawBody" )
    fn getVar:string ( varName:string ) ( (e 1) ".query[" (e 2) "] ? " (e 1) ".query[" (e 2) "] : \"\" ")
}
operator class:WebResponse es6 {
    fn contentType ( typeName:string) (
            (e 1) ".writeHead(200,  {'Content-Type': " (e 2) "});"
    )
    fn plaintext () ( (e 1) ".writeHead(200,  {'Content-Type': 'text/plain'});")
    fn send (value:string) ( (e 1) ".send(" (e 2) ")")
    fn sendFile (value:string) ( (e 1) ".sendFile(" (e 2) ")")
}

operator class:WebServer es6 {
    fn startServer ( post:int code:block) ( (e 1) ".listen(" (e 2) ", () => {" nl I (e 3) i nl "})" )
    fn route ( path:string cb:(_:void (req:WebRequest res:WebResponse))) ( (e 1) ".get(" (e 2) ", " nl I (e 3) i nl ")" )
    fn post_route ( path:string cb:(_:void (req:WebRequest res:WebResponse))) ( (e 1) ".post(" (e 2) ", " nl I (e 3) i nl ")" )    
}

; http.HandleFunc("/", handler)
; body, err := ioutil.ReadAll(r.Body)

operators {
    getVar _:string ( varName:string ) {
        templates {
            go ('req.URL.Query().Get(' (e 1) ')')
        }
    }
    get_post_data _:string ( req:WebRequest) {
        templates {
            go ( "_req_to_string(" (e 1) ")"
                (imp "io/ioutil")
(create_polyfill "
func _req_to_string (r *http.Request) string {        
    body, err := ioutil.ReadAll(r.Body)
    if err != nil {
        return \"\"
    }
    return string(body)
}
")
            )
        }
    }
;    class:WebRequest go {
;    fn get_post_data:string () 

}
operator class:WebServer go {
    fn startServer ( port:int code:block) ( "http.ListenAndServe( " (e 1) ".golangPortStr(), nil)"  )
    fn route ( path:string cb:(_:void ( res:WebResponse req:WebRequest))) ( "http.HandleFunc(" (e 2) ", " (e 3) ")" )
    fn post_route ( path:string cb:(_:void ( res:WebResponse req:WebRequest))) ( "http.HandleFunc(" (e 2) ", " (e 3) ")" )
}
; http.ServeFile(w, r, "file")
operator class:WebResponse go {
    fn contentType ( typeName:string) (
            (e 1 ) ".Header().Add(\"Content-Type\", " (e 2) ")"
    )
    fn send (value:string) ( "fmt.Fprint( " (e 1) ", " (e 2) ")")
    fn sendFile (value:string) ( "http.ServeFile("  (e 1) ", req, " (e 2) ")")    
}
operator class:WebRequest go {
;     fn get_post_data:string () ( (e 1) ".rawBody" )
    fn getVar:string ( varName:string ) ( (e 1) ".URL.Query().Get(" (e 2) ")")
}





