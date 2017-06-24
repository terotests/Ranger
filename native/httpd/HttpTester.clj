
Import "RangerWebService.clj"

class HttpTester {

    fn tester:void () {
        listen (new HTTPServer (1999)) {

            def path_to_route:string (get_url_path)
            write_header "text/html"
            switch path_to_route {
                case "/koodiklinikka" {
                    respond "<!DOCTYPE html>
    <html>
    <body style='background-color:#39a'>
    <div> Served from " + path_to_route + " </div>
    <img src='https://raw.githubusercontent.com/koodiklinikka/koodiklinikka.fi/master/src/assets/images/logo.png'/>            
    </body>
    </html>"                    
                }
                default {
                    respond "nothing to see here!"
                }
            }
        }
    }

    sfn main@(main):void () {
        def testObj:HttpTester (new HttpTester ())
        testObj.tester()
    }
}

