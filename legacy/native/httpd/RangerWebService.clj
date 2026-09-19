
; --------------------------------------------------------------------------------------
; Web service for Go


; --------------------------------------------------------------------------------------
; Support classes

class HTTPServer {

    def port:int 80

	Constructor (p:int) {
		port = p
	}

}

class RequestResponse {
    def res:HTTPResponse
    Constructor( r:HTTPResponse ) {
        res = r
    }   
}

; --------------------------------------------------------------------------------------
; system classes

systemclass  HTTPResponse {
    go          http.ResponseWriter
}

systemclass  HTTPRequest {
    go          http.Request
}




; --------------------------------------------------------------------------------------
; operators

operators {

    get_url_path http:string () {
        templates {
            go ("__r.URL.Path")
        }
    }

    write_header http:void ( txt:string) {
        templates {
            go ( "__w.Header().Set(\"Content-Type\", " (e 1) ") " nl )
        }
    } 

    respond http:void ( txt:string) {
        templates {
            go ( "__w.Write([]byte(" (e 1) ")) " nl )
        }
    }

    get_response http:HTTPResponse () {
        templates {
            go ( "&__w" )
        }        
    }

    listen   http:void (server:HTTPServer handler:block) {
        templates {
            go (
                "http.HandleFunc(\"/\", func(__w http.ResponseWriter, __r *http.Request) {" nl 
                    I (e 2) i nl "})" nl
                "http.ListenAndServe(\":\"+fmt.Sprintf(\"%v\"," (e 1) ".port), nil)" (imp "net/http")
                (imp "fmt")
            )
        }
    }    
    
}

