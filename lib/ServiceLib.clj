
operators {
    service_url _:string ( name@(noeval) ) {
        templates {
            ranger ( "(service_url " (e 1) ")")
            * @macro(true) ( "\"http://10.0.2.2:1777/" (service_id 1) "\"")
        }
    }
}
