operators {
    asread_file  _@(optional async):string (path:string filename:string) {
        templates {
            es6 ( "await (new Promise(resolve => { require('fs').readFile( " (e 1) " + '/' + " (e 2) " , 'utf8', (err,data)=>{ resolve(data) }) } ))" )
        }
    }
}
class test_readfile {
  static fn main() {
    def data (read_file '.' 'README.md')
    print (unwrap data)    
  }
} 