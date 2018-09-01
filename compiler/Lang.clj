language {

    name "Ranger"

    ; compilation targets might be defined here like this
    targets {
        ; short     common name     file extension
        es5         ES5             js 
        es6         JavaScript      js
        java7       Java7           java
        kotlin      Kotlin          kt
        scala       Scala           scala
        cpp         Cpp             cpp
        csharp      CSharp          cs
        swift3      Swift3          swift
        ts          TypeScript      ts
        flow        Flow            flow
        go          Golang          go
        php         PHP             php
        python      Python          py
        nim         Nim             nim
    }

    toplevel_keywords (class systemclass Constructor fn sfn Import Extend Enum def let operators)
    annotation_keywors (weak strong lives temp)
    
    ; transformations for the reserved words for function names or other keywords
    reserved_words {
        map FnMap
        forEach forEachItem
        self _self
    }

    
    commands {

        random        _:double () {
            templates {
                es6 ('Math.random()')
            }
        }

        cast _:S  (arg:T target@(noeval):S) {
            templates {
                ranger ("(cast " (e 1) " " (e 2) ":" (typeof 2) " )")
                ts ( (e 1) " as " (typeof 2) )
                es6 ( (e 1) )
                java7 ( "((" (typeof 2) ")" (e 1) ")" )
                swift3 ( (e 1) " as " (typeof 2) "" )
                cpp ( "mpark::get<" (typeof 2) ">(" (e 1) ")" 
                
                    (plugin 'makefile' ((dep 'variant.hpp' 'https://github.com/mpark/variant/releases/download/v1.2.2/variant.hpp')))            
                )
                go ( (e 1) ".(" (typeof 2) ")" )
                php ( (e 1) )
            }
        }        

        random        _:int ( min:int max:int) {
            templates {
                es6 ('Math.floor(Math.random()*(' (e 2) ' - ' (e 1)' + 1) + ' (e 1)')')
            }
        }
        

        if_javascript _:void ( code:block ) @doc('run this code only in JavaScript') {
            templates {
                es6 ( (block 1))
                * ()
            }
        }

        if_go _:void ( code:block ) @doc('run this code only for Golang target') {
            templates {
                go ( (block 1))
                * ()
            }
        }

        if_java _:void ( code:block ) @doc('run this code only for Java target') {
            templates {
                java7 ( (block 1))
                * ()
            }
        }

        if_swift _:void ( code:block ) @doc('run this code only for Swift target') {
            templates {
                swift3 ( (block 1))
                * ()
            }
        }

        if_php _:void ( code:block ) @doc('run this code only for PHP target') {
            templates {
                php ( (block 1))
                * ()
            }
        }

        if_cpp _:void ( code:block ) @doc('run this code only for C++ target') {
            templates {
                cpp ( (block 1))
                * ()
            }
        }

        if_csharp _:void ( code:block ) @doc('run this code only for C# target') {
            templates {
                csharp ( (block 1))
                * ()
            }
        }

        if_scala _:void ( code:block ) @doc('run this code only for Scala target') {
            templates {
                scala ( (block 1))
                * ()
            }
        }

        has _:boolean (str:string) @doc('If string value is greater than > 0') {
            templates {
                * @macro(true) ('( (strlen ' (e 1) ') > 0 )')
            }
        }

        ; compiler options...
        has_option _:boolean ( name:string ) {
            templates {
                * @macro(true) ( "((strlen \"" (optional_option 1)  "\" ) > 0)")
            }
            doc "Returns true if compiler setting `name` has been enabled"
        }
        get_option _:string ( name:string ) {
            templates {
                * @macro(true) ( "\"" (optional_option 1)  "\"")
            }
            doc "Returns compiler setting `name`"
        }
        get_required_option _:string ( n:string ) {
            templates {
                * @macro(true) ( "\"" (required_option 1)  "\"")
            }
        }

        sha256 _:string (input:string) {
            templates {
                ranger ( "(sha256 " (e 1) ")")
                es6 ("require('crypto').createHash('sha256').update(" (e 1) ").digest('hex')")
                cpp ( "picosha2::hash256_hex_string(" (e 1) ")"
                    (imp "\"picosha2.h\"")
                    (install_file "picosha2.h")
                    (plugin 'makefile' (  (dep 'picosha2.h' 'https://github.com/okdshin/PicoSHA2/blob/master/picosha2.h'  ) ) )                    
                )
; fmt.Printf("sha256:\t%x\n", sha_256.Sum(nil))
                go ( "_r_md5(" (e 1) ")" 
    (create_polyfill
"
func _r_md5(value string) string {
	h := sha256.Sum256([]byte(value))
	return fmt.Sprintf(\"%x\", h[:])
}
"    
    )            
                (imp "crypto/sha256") (imp "fmt")) 
                php( "hash('sha256', " (e 1) ")")
            }
        }

        md5 _:string (input:string) {
            templates {
                ranger ( "(md5 " (e 1) ")")
                es6 ("require('crypto').createHash('md5').update(" (e 1) ").digest('hex')")
            }
        }
        
        nullify   _:void (ptr@(optional):T) @doc('Clears the optional value to empty state') {
            templates {
                ranger ( "(nullify " (e 1) ")")
                es6 ( (e 1) " = undefined;" nl)
                java7 ( (e 1) " = null;" nl)
                cpp ( (e 1) "= NULL;" nl)
                go ( (e 1) " = nil;" nl )
                php ( 'unset(' (e 1) ');' nl)
            }
        }

        ; immutable operators, maybe used by the compiler...
        ; https://github.com/Workiva/go-datastructures
        create_immutable_array _@(immutable):[T] () {
            templates {
                es6 ("require('immutable').List() /** imm **/")
                go ("seq.NewList()")
            }
        }
        create_immutable_hash _@(immutable):[K:T] () {
            templates {
                es6 ("require('immutable').Map()")
                go ("seq.NewHashMap()")
            }
        }

        M_PI mathPi:double () {
            templates {
                es6 ("Math.PI")
                go ( "math.Pi" (imp "math"))                                
                swift3 ( "Double.pi" (imp "Foundation"))   
                java7 ( "Math.PI" (imp "java.lang.Math"))         
                php ("pi()")        
                cpp ("M_PI" (imp "<math.h>"))               
            }
        }

        fabs fabs:double ( v:double ) {
            templates {
                es6 ("Math.abs(" (e 1) ")")
                go ( "math.Abs(" (e 1) ")" (imp "math"))                                
                swift3 ( "abs(" (e 1) ")" (imp "Foundation"))   
                java7 ( "Math.abs(" (e 1) ")" (imp "java.lang.Math"))       
                php ( "abs(" (e 1) ")")      
                cpp ("fabs(" (e 1) ")" (imp "<cmath>"))                       
            }
        }
        tan tan:double ( v:double ) {
            templates {
                es6 ("Math.tan(" (e 1) ")")
                go ( "math.Tan(" (e 1) ")" (imp "math"))                                
                swift3 ( "tan(" (e 1) ")" (imp "Foundation"))   
                java7 ( "Math.tan(" (e 1) ")" (imp "java.lang.Math"))     
                php ( "tan(" (e 1) ")")     
                cpp ("tan(" (e 1) ")" (imp "<math.h>"))                          
            }
        }

        golang_wait waiter:void (seconds:double ) {
            templates {
                go ( "time.Sleep(time.Duration(" (e 1) " * float64(time.Second) )) " (imp "time") )
                * ()
            }
        }

        wait cmdWait:void ( seconds:double ) {
            templates {
                es6 ( "" )
                * ()
            }
        }

        wait cmdWait:void ( seconds:double after:block) {
            templates {
                es6 ( "setTimeout( () => { " nl I (block 2) i nl " }, 1000 * " (e 1) ")" )
                go ( "go func() {" nl I "time.Sleep(time.Duration(" (e 1) " * float64(time.Second) )) " nl (block 2) i nl "}()" nl (imp "time") )
                cpp ( "std::this_thread::sleep_for(std::chrono::milliseconds((int)(" (e 1) " * 1000)));" nl (block 2) nl (imp "<chrono>" ) (imp "<thread>" ) )
                php ( "sleep(" (e 1) ");" nl (block 2) nl )
                swift3 ( "usleep(UInt32(1000000*" (e 1) "));" nl (block 2) nl )
                java7 (

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
        

        ; Profiling
        timer           cmdTimerBlock:void (name:string code:block) {
            templates {
                ; start := time.Now()
                go ( (defvar _start:int) "for {" nl I nl (varname _start) " := time.Now()" nl (block 2) nl "fmt.Println(" (e 1) ", time.Since(" (varname _start) ") )" nl "break;" i nl "}" (imp "time") (imp "fmt") )
                swift3 ( "do {" nl I nl "let _start = CFAbsoluteTimeGetCurrent()" nl (block 2) nl "print(" (e 1) ", CFAbsoluteTimeGetCurrent() - _start )" i nl "}" (imp "CoreFoundation") )
                es6 ( "console.time(" (e 1) ");" nl (block 2) nl "console.timeEnd(" (e 1) ");" )
                php ( nl "$time_start = microtime(true);" nl (block 2) nl "$time_end = microtime(true);" nl "echo(" (e 1) ".($time_end - $time_start).\"\\n\");" nl)
                java7 (
                    nl "long startTime = System.nanoTime();" nl
                    (block 2 )
                    nl "long elapsedTime = System.nanoTime() - startTime;" nl
                    nl "System.out.println( " (e 1) "+ String.valueOf((double)elapsedTime / 1000000000.0));" nl 
                )
                ranger ( nl "timer " (e 1) " {" nl I (block 2) i nl "}" nl)
                cpp ( ( imp "<ctime>" )
                    nl "std::clock_t __begin = std::clock();" nl
                    (block 2)
                    nl "std::clock_t __end = std::clock();"       
                    nl "std::cout << " (e 1) " << \" : \" << ( double(__end - __begin) / CLOCKS_PER_SEC ) << std::endl;" nl          
                )
                * ( (block 2) )
            }
        }

        env_var cmdEnvVar@(optional):string ( name:string ) {
            templates {
                php ("getenv(" (e 1) ") === FALSE ? NULL : getenv(" (e 1) ")" )
                go (
        "r_io_get_env(" (e 1) ")"
        (imp "os") 
(create_polyfill "
// polyfill for reading environment variable
func r_io_get_env( name string) *GoNullable {
   res := new(GoNullable);
   value := os.Getenv(name)
   if len(value) > 0 {
     res.has_value = true
     res.value = value
   } else {
     res.has_value = false
   }
   return res 
}
")
    )
                es6 ("process.env[" (e 1) "]")
                cpp ( "std::getenv(" (e 1) ".c_str()) ? std::string(std::getenv(" (e 1) ".c_str())) : std::string(\"\")" (imp "<cstdlib>") )
                ; * ("/* environment variable reading not implemented */")
            }
        }   

        ; Command line arguments
        shell_arg             cmdArg:string (index:int) {
            templates {
                cpp ( "std::string(__g_argv[" (e 1) " + 1])")
                php ( "$argv[" (e 1) " + 1]" )
                java7 ( "args[" (e 1) "]")
                csharp ('Environment.GetCommandLineArgs()[' (e 1) ' + 1]' (imp "System"))
                go ( "os.Args[" (e 1) " + 1]"  (imp "os"))
                swift3 ("CommandLine.arguments[" (e 1) " + 1]")
                es6 ( "process.argv[ 2 + " (e 1) "]")
                ranger ("( shell_arg " (e 1) " )")
            }
        }

        shell_arg_cnt         cmdArg:int () @doc("return the number of arguments for command line utility") {
            templates {
                cpp ( "__g_argc - 1")
                swift3 ("CommandLine.arguments.count - 1")
                csharp ('Environment.GetCommandLineArgs().Length - 1' (imp "System"))                
                php ( "(count($argv) - 1)" )
                java7 ( "args.length")
                go ( "int64( len( os.Args) - 1 )"  (imp "os"))
                es6 ( "(process.argv.length - 2)" )
                ranger ("( shell_arg_cnt )")
            }
        }        

        ; I/O
        normalize cmdArg:string ( arg:string ) {
            templates {
                es6 ( 'require("path").normalize(' (e 1) ')')
                ranger ("( normalize " (e 1) " )")
                * ( "\"./\"")
            }
        }   

        install_directory         cmdArg:string () {
            templates {
                es6 ( "__dirname" )
                ranger ("( install_directory )")
                * ( "\"./\"")
            }
        }   

        current_directory         cmdArg:string () {
            templates {
                es6 ( "process.cwd()" )
                csharp( "Directory.GetCurrentDirectory()" (imp "System") (imp "System.IO"))
                ranger ("( current_directory )")
                cpp ( "__cpp_curr_dir()"
(imp "<stdio.h>")
(create_polyfill
"

#ifdef _MSC_VER
    #include <direct.h>
    #define __RGetCurrentDir _getcwd
#else
    #include <unistd.h>
    #define __RGetCurrentDir getcwd
#endif

std::string __cpp_curr_dir() {
    char cCurrentPath[FILENAME_MAX];
    if (!__RGetCurrentDir(cCurrentPath, sizeof(cCurrentPath)))
        {
            return \"\";
        }
    cCurrentPath[sizeof(cCurrentPath) - 1] = '\\0';
    std::string result(cCurrentPath);
    return result;
}
"
)

                )
                * ( "\".\"")
            }
        }               

        file_exists          cmdIsDir:boolean (path:string filename:string) {
            templates {
                cpp ( "r_cpp_file_exists( " (e 1) " + std::string(\"/\") + " (e 2) ")" (imp "<sys/stat.h>") (imp "<string>")
(create_polyfill "
bool r_cpp_file_exists(std::string name) 
{
  struct stat buffer;
  return (stat (name.c_str(), &buffer) == 0);
}    
    ") )
                swift3 ( "r_file_exists(fileName:" (e 1) " + \"/\" + " (e 2) " )" 

(create_polyfill "
func r_file_exists ( fileName:String ) -> Bool {
    let fileManager = FileManager.default
    var isDir : ObjCBool = false
    if fileManager.fileExists(atPath: fileName, isDirectory:&isDir) {
        if isDir.boolValue {
            return false
        } else {
            return true
        }
    } else {
        return false
    }    
}
    ")                    
                )
                es6 ("require(\"fs\").existsSync(" (e 1) " + \"/\" + " (e 2) " )")
                ranger ("( file_exists " (e 1) " + \"/\" + " (e 2) "  )")
                java7 ( "new File(" (e 1) " + '/' + " (e 2) ").exists()" (imp "java.io.File") )
                php ( "file_exists(" (e 1) ".'/'." (e 2) ")" )
                go ( "r_file_exists(" (e 1) ", " (e 2) ")"
(create_polyfill
"
func r_file_exists(pathName string, fileName string) bool {
    if _, err := os.Stat(pathName + \"/\" + fileName); os.IsNotExist(err) {
        return false
    }
    return true
}
"
)                    
                )
           }
        }

        dir_exists          cmdIsDir:boolean (path:string) {
            templates {
                csharp ( "false /* dir_exists not implemented */ ")
                scala ( "false /* dir_exists not implemented */ ")
                swift3 ( "r_dir_exists( dirName: " (e 1) ")" 

(create_polyfill "
func r_dir_exists ( dirName:String ) -> Bool {
    let fileManager = FileManager.default
    var isDir : ObjCBool = false
    if fileManager.fileExists(atPath: dirName, isDirectory:&isDir) {
        if isDir.boolValue {
            return true
        } else {
            return false
        }
    } else {
        return false
    }    
}
    ")                    
                )
                cpp ( "r_cpp_dir_exists( " (e 1) " )" (imp "<sys/stat.h>") (imp "<string>")
(create_polyfill "
bool  r_cpp_dir_exists(std::string name) 
{
  struct stat buffer;
  return (stat (name.c_str(), &buffer) == 0);
}    
    ") )                 
                java7 ( "new File(" (e 1) ").exists()" (imp "java.io.File") )
                es6 ("require(\"fs\").existsSync( " (e 1) " )")
                ranger ("( dir_exists " (e 1) " )")
                php ( "is_dir(" (e 1) ")" )
                go ( "r_dir_exists(" (e 1) ")"
(create_polyfill
"
func r_dir_exists(pathName string) bool {
    if _, err := os.Stat(pathName); os.IsNotExist(err) {
        return false
    }
    return true
}
"
)                    
                )                        
           }
        }

        create_dir          cmdCreateDir:void (path:string) {
            templates {
                scala ( "/* create_dir not implemented */ ")
                csharp ( "/* create_dir not implemented */ ")

                cpp ( "r_cpp_create_dir( " (e 1) " );" nl (imp "<sys/stat.h>") (imp "<sys/types.h>") (imp "<string>")
(create_polyfill "
void  r_cpp_create_dir(std::string name) 
{
  mkdir( name.c_str(), S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
}    
    ") )
                swift3 ( nl )        
                php (  nl "mkdir(" (e 1) ");" nl )
                es6 ("require(\"fs\").mkdirSync( " (e 1) ")")
                go ( nl "_ = os.Mkdir( " (e 1 ) " , os.ModePerm)" nl (imp "os") )

                ranger ( nl "create_dir " (e 1) nl)
                java7 ( nl "createDir(" (e 1) ");" nl  
                    (imp "java.io.File")
(create_polyfill "
static void createDir(String path) 
{
    try{
        File theDir = new File(path);
        if (!theDir.exists()) {
            theDir.mkdir();
        }
    } catch(SecurityException se) {

    }
}    
    ") )    

           }
        }
; try text.write(to: path, atomically: false, encoding: String.Encoding.utf8)
        write_file          cmdWriteFile:void (path:string file:string data:string) {
            templates {
                scala ( "/* write_file not implemented */ ")
                csharp ( "/* write_file not implemented */ ")

                swift3 ("r_write_file(dirName: " (e 1) " + \"/\" + " (e 2) ", dataToWrite: " (e 3) ") " 

(create_polyfill "
func r_write_file ( dirName:String, dataToWrite:String ) {
    do {
        let fileManager = FileManager.default
        let url = NSURL(fileURLWithPath: fileManager.currentDirectoryPath)
        let path = url.appendingPathComponent(dirName)
        try dataToWrite.write(to:path!, atomically: false, encoding: String.Encoding.utf8)
    } catch {

    }
}
    ")                  
                
                ) 
                cpp_old ( nl "/* write file not yet implemented */" nl)

                cpp ( "r_cpp_write_file( " (e 1) " , " (e 2) " , " (e 3) "  );" nl (imp "<iostream>") (imp "<string>") (imp "<fstream>")
(create_polyfill "
void  r_cpp_write_file(std::string path, std::string filename, std::string text) 
{
  std::ofstream outputFile;
  outputFile.open(path + \"/\" + filename);
  outputFile << text;
  outputFile.close();
}    
    ") )                
                ranger ( nl "write_file " (e 1) " " (e 2) " " (e 3) nl)
                es6 ("require(\"fs\").writeFileSync( " 
                        (e 1) " + \"/\"  + " (e 2) ", " (e 3) ")")

                php (  nl "file_put_contents(" (e 1) ".'/'." (e 2) " , " (e 3) ");" nl )


                java7 ( nl "writeFile(" (e 1) " + \"/\" + " (e 2) " , " (e 3)" );" nl  
                    (imp "java.io.PrintWriter")
(create_polyfill "
static void writeFile(String path, String text) 
{
    try{
        PrintWriter out = new PrintWriter( path);
        out.print( text );
        out.close();
    } catch ( FileNotFoundException e) {

    }
}    
    ") )                        
                        

                go ( "r_write_text_file(" (e 1) ", " (e 2) ", " (e 3) ")"
                     (imp "os")
(create_polyfill
"
func r_write_text_file(pathName string, fileName string, txtData string)  {
    f, e := os.Create(pathName + \"/\" + fileName)
    if e != nil {
        panic(e)
    }
    defer f.Close()

    _ , err := f.WriteString(txtData)
    if err != nil {
        panic(err)
    }
    f.Sync()
}
"
) )  

            }
        }

        async_read_file  _@(optional async):string (path:string filename:string) {
            templates {
                es6 @flags('typescript') ( "await (new Promise<string>(resolve => { require('fs').readFile( " (e 1) " + '/' + " (e 2) " , 'utf8', (err,data)=>{ resolve(data) }) } ))" )
                es6 ( "await (new Promise(resolve => { require('fs').readFile( " (e 1) " + '/' + " (e 2) " , 'utf8', (err,data)=>{ resolve(data) }) } ))" )
            }
        }

        read_file        cmdReadFile@(optional async):string (path:string filename:string) {

            templates {
                ts ( "await (new Promise<string>(resolve => { require('fs').readFile( " (e 1) " + '/' + " (e 2) " , 'utf8', (err,data)=>{ resolve(data) }) } ))" )
                es6 ( "await (new Promise(resolve => { require('fs').readFile( " (e 1) " + '/' + " (e 2) " , 'utf8', (err,data)=>{ resolve(data) }) } ))" )
                ranger (  "(read_file " (e 1) " " (e 2) ")" )
                cpp ( "r_cpp_readFile( " (e 1) " , " (e 2) ")" (imp "<fstream>")
(create_polyfill "
std::string  r_cpp_readFile(std::string path, std::string filename) 
{
  std::ifstream ifs(path + \"/\" + filename);
  std::string content( (std::istreambuf_iterator<char>(ifs) ),
                       (std::istreambuf_iterator<char>()    ) );
  return content;
}    
    ")                        
            
                )
                php ("file_get_contents(" (e 1) " . \"/\" . " (e 2) ") " )
                swift3 ("r_read_file(dirName: " (e 1) " + \"/\" + " (e 2) ") " 
(create_polyfill "
func r_read_file ( dirName:String ) -> String? {
    let res: String?
    do {
        res = try String(contentsOfFile:dirName)
    } catch {
        res = nil
    }
    return res
}
    ")                                  
                )
                java7 ( "readFile(" (e 1) " + \"/\" + " (e 2) " , StandardCharsets.UTF_8 )"  
                    (imp "java.nio.file.Paths") 
                    (imp "java.io.File")
                    (imp "java.nio.file.Files") 
                    (imp 'java.io.IOException')
                    (imp "java.nio.charset.Charset")
                    (imp "java.nio.charset.StandardCharsets")
(create_polyfill "
static String readFile(String path, Charset encoding) 
{
  try {
    byte[] encoded = Files.readAllBytes(Paths.get(path));
    return new String(encoded, encoding);
  } catch(IOException e) { 
    return \"\";
  }
}    
    ")                        
                        
                        )
                scala ( "Try(Source.fromFile(" (e 1) " + \"/\" + " (e 2) ").getLines.mkString).toOption" (imp "scala.io.Source") (imp "scala.util.Try"))
                go (  "r_io_read_file(" (e 1) ", " (e 2) ")" (imp "io/ioutil")
(create_polyfill "

// polyfill for reading files
func r_io_read_file( path string , fileName string ) *GoNullable {
   res := new(GoNullable);
   if v, err := ioutil.ReadFile(path + \"/\" + fileName); err == nil {
     res.has_value = true
     res.value = string(v)
   } else {
     res.has_value = false
   }
   return res 
}
"))
                es6 ( "(require('fs').readFileSync( " (e 1) " + '/' + " (e 2) " , 'utf8'))" )
            }
        }

        =               cmdAssign@(moves@( 2 1 ) ):void            ( immutable_left@(immutable):T immutable_right@(immutable):T )  { 
            templates { 
                ranger ( nl (e 1) " = " (e 2) nl )  
                scala ( nl (e 1) " = " (e 2)   nl )   
                go ( (custom _ ) )              
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }   
        
        =               cmdAssign@(moves@( 2 1 ) ):void            ( left:T right:T )  { 
            templates { 
                ranger ( nl (e 1) " = " (e 2) nl )  
                scala ( nl (e 1) " = " (e 2) nl )   
                go ( (custom _ ) )              
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }   

      


        =               cmdAssign@(moves@( 2 1 ) ):void            ( left@(optional):T right:T )  { 
            templates { 
                ranger ( nl (e 1) " = " (e 2) nl ) 
                scala ( nl (e 1) " = Some(" (e 2) ")" nl )  
                swift ( nl (e 1) " = Optional(" (e 2) ");" nl )   
                java7 ( nl (e 1) " = " (e 2) ";" nl )   
                go ( nl (goset 1) ".value = " (e 2) ";" nl nl (goset 1) ".has_value = true; /* detected as non-optional */" nl )  
                cpp ( nl ( e 1) "  = " (e 2) ";" nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }           

        =               cmdAssign@(moves@( 2 1 ) ):void            ( left@(optional):T right@(optional):T )  { 
            templates { 
                ranger ( nl (e 1) " = " (e 2) nl ) 
                scala ( nl (e 1) " = " (e 2) nl )      
                go ( nl (goset 1) ".value = " (e 2) ".value;" nl nl (goset 1) ".has_value = false; " nl 
                    "if " (goset 1) ".value != nil {" nl I (goset 1) ".has_value = true" nl i "}" nl
                    )  
                cpp ( nl ( e 1) "  = " (e 2) ";" nl )   
                java7 ( nl (e 1) " = " (e 2) ";" nl )        
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }  

        empty       cmdEmpty@(optional):T        ( node@(ignore):T ) {
            templates {
                scala ( "Option.empty[(" (e 1) ")" )
                swift3 (  "nil" )
                csharp ( "(" (typeof 1) "?)" (e 1)  )
                cpp ( (e 1) )
                java7 ( "Optional.of(" (e 1 ) ")")
                go ( (e 1 ) )
                * ( "undefined")
            }
        }

        wrap       cmdWrap@(optional):T        ( arg:T ) {
            templates {
                ranger ( "( wrap " (e 1) ")" ) 
                scala ( "Some(" (e 1) ")" )
                swift3 (  "Optional(" (e 1) ")" )
                csharp ( "(" (typeof 1) "?)" (e 1)  )
                cpp ( (e 1) )
                java7 ( (e 1 ))
                go ( (e 1 ) )
                php ( (e 1 ) )
                * ( (e 1) )
            }
        }

        !       _:boolean        ( arg:boolean ) {
            templates {
                * @macro(true) (`(false == (` (e 1)`))`)
            }
        }


        !!       cmdUnwrap:T        ( arg@(optional):T ) {
            templates {
                ranger ( "( unwrap " (e 1) ")" )
                scala ( (e 1) ".get" )
                csharp ( (e 1) ".Value" )
                java7 ( (e 1) ".get()" )
                rust ( (e 1) ".unwrap()" )
                php ( (e 1 ) )
                kotlin ( (e 1) "!!" )
                swift3 ( (e 1) "!" )
                go ( (e 1) ".value.(" (typeof 1) ")" )
                cpp ( (e 1) )

                * ( (e 1) )
            }
        }        

        unwrap       cmdUnwrap:int        ( arg@(optional):int ) {
            templates {
                cpp ( "/*unwrap int*/" (e 1) ".value" )
            }
        } 
        unwrap       cmdUnwrap:double        ( arg@(optional):double ) {
            templates {
                cpp ( "/*unwrap dbl*/" (e 1) ".value" )
            }
        }        

        unwrap       cmdUnwrap:T        ( arg@(optional):T ) {
            templates {
                ranger ( "( unwrap " (e 1) ")" )
                scala ( (e 1) ".get" )
                csharp ( (e 1) )
                java7 ( (e 1) )
                rust ( (e 1) ".unwrap()" )
                php ( (e 1 ) )
                kotlin ( (e 1) "!!" )
                swift3 ( (e 1) "!" )
                go ( (e 1) ".value.(" (typeof 1) ")" )
                cpp ( (e 1) )

                * ( (e 1) )
            }
        }



        ; TODO: could be varname@(mutable), but the compiler may not be able to determine the
        ; mutability before the code has been processed through... 

        def             cmdDef:void            ( varname:[T] )  { 
            templates { 
                * ( nl "var " (nameof 1) " = [];" nl )
            } 
        }     

        def             cmdDef:void            ( varname:[K:T] )  { 
            templates { 
                * ( nl "var " (nameof 1) " = {};" nl )
            } 
        }     


        def             cmdDef:void            ( varname:T )  { 
            templates { 
                scala@(mutable) ( nl "var " (e 1) ":" (typeof 1 ) " /* mutable uninitialized value */" nl ) 
                scala ( nl "val " (e 1) ":" (typeof 1 ) " /* immutable uninitialized value */" nl )    
                java7 (nl (typeof 1) " " (e 1) ";" nl)             
                es6@(mutable) ( nl "let " (e 1) ";" nl ) 
                es5@(mutable) ( nl "var " (e 1) ";" nl ) 
                * ( nl "const " (e 1) ";" nl ) 
            } 
        }      

        def             cmdDef:void            ( varname:T value:T )  { 
            templates { 
                scala@(mutable) ( nl "var " (e 1) ":" (typeof 1 )" = " (e 2) " /* mutable value */" nl ) 
                scala ( nl "val " (e 1) ":" (typeof 1 )" = " (e 2) " /* immutable value */" nl ) 
                java7 (nl (typeof 1) " " (e 1) " = " (e 2) ";" nl)
                es6@(mutable) ( nl "let " (e 1) " = " (e 2) ";" nl )
                es6 ( nl "const " (e 1) " = " (e 2) ";" nl )
                * ( nl "var " (e 1) " = " (e 2) ";" nl )
            } 
        }     
        def             cmdDef:void            ( varname@(mutable):T value:T )  { 
            templates { 
                scala( nl "var " (e 1) ":" (typeof 1 )" = " (e 2) " /* mutable def value */" nl ) 
                java7 (nl (typeof 1) " " (e 1) " = " (e 2) ";" nl)
                es6 ( nl "let " (e 1) " = " (e 2) ";" nl )
                * ( nl "var " (e 1) " = " (e 2) ";" nl )
            } 
        }      
        
        return  cmdReturn@(returns@(1)):void          ( value:T ) {
            templates {
                go ( (custom _) )
            }
        }

        return  cmdReturn@(optional returns@(1)):void          ( value@(optional):T ) {
            templates {
                java7 ( (custom _) )
                scala( (custom _) )
                ranger ( nl "return " (e 1) nl ) 
                go ( (custom _) )
                * ( "return " (ifa 1 ";") (e 1) (eif _) ";" )
            }
        }        
                
        return  cmdReturn@(returns@(1)):void          ( value:T ) {
            templates {
                ranger ( nl "return " (e 1) nl ) 
                scala( (custom _ ) )
                go ( (custom _) )
                * ( "return " (ifa 1 ";") (e 1) (eif _) ";" )
            }
        }       

        return  cmdReturn@(returns):void          ( ) {
            templates {
                cpp ( (custom _ ) )
                scala ( (custon _) )
                ranger ( nl "return" nl ) 
                go ( (custom _) )
                * ( "return;" )
            }
        }        
         

        =               cmdAssign:void            ( left@(optional):T right:T )  { 
            templates {
                ranger ( nl (e 1) " = " (e 2) nl ) 
                scala ( nl (e 1) " = Some(" (e 2) " ) " nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }      

        =               cmdAssign:void            ( left:T right@(optional):T )  { 
            templates {
                ranger ( nl (e 1) " = " (e 2) nl ) 
                swift3 (  nl (e 1) " = Optional(" (e 2) ")" )
                
                scala ( nl (e 1) " = " (e 2) ".get /* scala optional assigment of values * / " nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }      

        =               cmdAssign:void            ( left@(optional):T right@(optional):T )  { 
            templates {
                ranger ( nl (e 1) " = " (e 2) nl ) 
                scala ( nl (e 1) " = " (e 2) " /* scala optional assigment of values * / " nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }      
        

        ; numeric - operations
        -               cmdMinusOp:double            ( left:double right:double )  { templates { * ( (e 1) " - " (e 2) ) } }      
        -               cmdMinusOp:int            ( left:int right:int )  { templates { * ( (e 1) " - " (e 2) ) } }      

        ; numeric + operations
        +               cmdPlusOp:double             ( left:double right:double ) { templates { * ( (e 1) " + " (e 2) ) } }

        ; random tests, remove these later:
        +               cmdUnwrappingPlusOp:int                ( left:int right@(optional):int ) {
                        
            code {
                return left + (unwrap right)
            }

        }

        +               cmdPlusOp:int                ( left:int right@(optional):int ) { 
            templates { * ( (e 1) " + " (e 2) "? /* optional add*/" ) } 
        }
        
        +               cmdPlusOp:int                ( left@(mutable):int right@(optional):int ) { 
            templates { * ( (e 1) " + " (e 2) "? /* optional add*/" ) } 
        }
        +               cmdPlusOp:int                ( left@(mutable):int right:int ) { templates { * ( (e 1) " + " (e 2)  ) } }
        +               cmdPlusOp:int                ( left@(mutable):int right:int ) { templates { * ( (e 1) " + " (e 2)  ) } }

        ; random tests end
        +               cmdPlusOp:int                ( left:int right:int ) { templates { * ( (e 1) " + " (e 2)  ) } }

        ; string + operations
        +               cmdPlusOp:string             ( left:string right:enum ) { 
            templates { 
                    go ( "strings.Join([]string{ " (e 1) ",strconv.FormatInt(" (e 2) ", 10) }, \"\")" (imp "strings") (imp "strconv"))
                    swift3 ( (e 1) " + String(" (e 2)")" )
                    rust ( "[" (e 1) " , (" (e 2)".to_string()) ].join(\"\")" )
                    php ( (e 1) " . " (e 2) ) 
                    cpp ( (e 1 ) " + std::to_string(" (e 2) ")")
                    * ( (e 1) " + " (e 2) ) 
                } 
            }

        +               cmdPlusOp:string             ( left:string right:string ) { 
            templates { 
                go ( (e 1) " + " (e 2) ) 
                go.v2 ( "strings.Join([]string{ " (e 1) "," (e 2) " }, \"\")" (imp "strings"))
                php ( (e 1) " . " (e 2) )
                * ( (e 1) " + " (e 2) ) 
            } 
        }
        
        +               cmdPlusOp:string             ( left:string right:double ) { 
                templates { 
                    go ( "strings.Join([]string{ " (e 1) ",strconv.FormatFloat(" (e 2) ",'f', 6, 64) }, \"\")" (imp "strings") (imp "strconv"))
                    rust ( "[" (e 1) " , (" (e 2)".to_string()) ].join(\"\")" )
                    swift3 ( (e 1) " + String(" (e 2)")" )
                    cpp ( (e 1 ) " + std::to_string(" (e 2) ")")
                    php ( (e 1) " . " (e 2) ) 
                    * ( (e 1) " + " (e 2) ) 
                } 
        }
        ; Go;
        ; strconv.Itoa
        +               cmdPlusOp:string             ( left:string right:int ) { 
                templates { 
                    go ( "strings.Join([]string{ " (e 1) ",strconv.FormatInt(" (e 2) ", 10) }, \"\")" (imp "strings") (imp "strconv"))
                    swift3 ( (e 1) " + String(" (e 2)")" )
                    rust ( "[" (e 1) " , (" (e 2)".to_string()) ].join(\"\")" )
                    cpp ( (e 1 ) " + std::to_string(" (e 2) ")")
                    php ( (e 1) " . " (e 2) ) 
                    * ( (e 1) " + " (e 2) ) 
                } 
        }

        %  _:int (left:int right:int) {
            templates {
                * ( (e 1) " % " (e 2) )
            }
        }
                
        +               cmdPlusOp:string             ( left:double right:string ) { 
            templates { 
                    * ( (e 1) " + " (e 2) ) 
                    php ( (e 1) " . " (e 2) ) 
                    rust ( "[" (e 1) " , " (e 2) " ].join()" )
                } 
            }

        +               cmdPlusOp:string             ( left:int right:string    ) { 
                    templates { * ( (e 1) " + " (e 2) ) 
                    php ( (e 1) " . " (e 2) ) 
                    } }


        *               cmdMulOp:double         ( left:double right:double ) { templates { * ( (e 1) " * " (e 2) ) } }
        *               cmdMulOp:int            ( left:int right:int ) { templates { * ( (e 1) " * " (e 2) ) } }

        /               cmdDivOp:double         ( left:double right:double ) { templates { * ( (e 1) " / " (e 2) ) } }
        /               cmdDivOp:double         ( left:int right:int ) { templates { * ( (e 1) " / " (e 2) ) } }

        ; optional string operator...
        ||              _:string         ( left:string right:string ) @doc('selects the first string if length > 0, else the second...') { 
            templates { 
                ranger ( '(|| (' (e 1) ') (' (e 1) ') )')
                * @macro(true) ( '(? ( (strlen ' (e 1) ') > 0 ) (' (e 1) ')  (' (e 2) ') )' ) 
            } 
        }        
        

        ?               cmdTernary:T         ( condition:boolean  left:T right:T ) { 
            templates { 
                ranger ( '(? '(e 1) ' ' (e 2)' ' (e 3) ' )')
                go ( '(func() ' (typeof 2) ' { if ' (e 1) ' { return ' (e 2) ' } else { return ' (e 3) '} }())' )  
                cpp ( '(' (e 1) " ? " (e 2) " : " (e 3) ')' ) 
                scala ( '( if (' (e 1) ")  " (e 2) " else " (e 3) ')' ) 
                * ( (e 1) " ? " (e 2) " : " (e 3) ) 
            } 
        }


        ??               elvis:T         ( left@(optional):T right:T ) { 
            templates { 
                * @macro(true) ( '(? (!null? ' (e 1) ') (unwrap ' (e 1) ') ' (e 2) ')' ) 
            } 
        }        

        =               cmdAssign:void          ( target:vref expr:expression ) {
            templates {
                ranger ( nl (e 1) " = " (e 2) nl )  
                go ( (custom _ ) )
                scala ( (e 1) " = " (e 2) )   ; <-- scala does not require ; here                
                * ( (e 1) " = " (e 2) ";" )
            }
        }




        int2double      cmdIntToDouble:double            ( value:int ) { 
                templates {
                    ranger ( "(int2double " (e 1) ")" ) 
                    * ( "parseFloat(" (e 1) ")" ) 
                } 
        }

        gitdoc      cmdGitDoc:void            ( value:string ) { 
                templates { 
                    * ( "/* git doc */" ) 
                } 
        }




; TODO: add the rest ....(case ("sin" "cos" "tan" "atan" "log" "abs" "acos" "asin" "floor" "round" "sqrt")
        ;"<cmath>"

        ceil        _:int          (  value:double )  {
            templates {
                ranger ( "(ceil " (e 1) ")" ) 
                swift3 ( "ceil(" (e 1) ")" (imp "Foundation"))               
                cpp ( "ceil(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Ceil(" (e 1) ")" (imp "System"))    
                go ( "math.Ceil(" (e 1) ")" (imp "math"))                                
                php ( "ceil(" (e 1) ")" )    
                rust ( "" (e 1) ".ceil()" )                
                scala ( "math.ceil(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.ceil(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.ceil(" (e 1) ")")
            }
        }

        floor        _:int          (  value:double )  {
            templates {
                ranger ( "(floor " (e 1) ")" ) 
                swift3 ( "floor(" (e 1) ")" (imp "Foundation"))               
                cpp ( "floor(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Floor(" (e 1) ")" (imp "System"))    
                go ( "math.Floor(" (e 1) ")" (imp "math"))                                
                php ( "floor(" (e 1) ")" )    
                rust ( "" (e 1) ".floor()" )                
                scala ( "math.floor(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.floor(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.floor(" (e 1) ")")
            }
        }

        asin        cmdCos:double          (  value:double )  {
            templates {
                ranger ( "(asin " (e 1) ")" ) 
                swift3 ( "asin(" (e 1) ")" (imp "Foundation"))               
                cpp ( "asin(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Asin(" (e 1) ")" (imp "System"))    
                go ( "math.Asin(" (e 1) ")" (imp "math"))                                
                php ( "asin(" (e 1) ")" )    
                rust ( "" (e 1) ".asin()" )                
                scala ( "math.asin(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.asin(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.asin(" (e 1) ")")
            }
        }
        


        acos        cmdCos:double          (  value:double )  {
            templates {
                ranger ( "(acos " (e 1) ")" ) 
                swift3 ( "acos(" (e 1) ")" (imp "Foundation"))               
                cpp ( "acos(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Acos(" (e 1) ")" (imp "System"))    
                go ( "math.Acos(" (e 1) ")" (imp "math"))                                
                php ( "acos(" (e 1) ")" )    
                rust ( "" (e 1) ".acos()" )                
                scala ( "math.acos(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.acos(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.acos(" (e 1) ")")
            }
        }

        cos        cmdCos:double          (  value:double )  {
            templates {
                ranger ( "(cos " (e 1) ")" )
                swift3 ( "cos(" (e 1) ")" (imp "Foundation"))               
                cpp ( "cos(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Cos(" (e 1) ")" (imp "System"))    
                go ( "math.Cos(" (e 1) ")" (imp "math"))                                
                php ( "cos(" (e 1) ")" )    
                rust ( "" (e 1) ".cos()" )                
                scala ( "math.cos(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.cos(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.cos(" (e 1) ")")
            }
        }
        
        sin        cmdSin:double          (  value:double )  {
            templates {
                ranger ( "(sin " (e 1) ")" )
                swift3 ( "sin(" (e 1) ")" (imp "Foundation"))               
                cpp ( "sin(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Sin(" (e 1) ")" (imp "System"))    
                go ( "math.Sin(" (e 1) ")" (imp "math"))                                
                php ( "sin(" (e 1) ")" )    
                rust ( "" (e 1) ".sin()" )                
                scala ( "math.sin(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.sin(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.sin(" (e 1) ")")
            }
        }

        sqrt        cmdSqrt:double          (  value:double )  {
            templates {
                ranger ( "(sqrt " (e 1) ")" )
                swift3 ( "sqrt(" (e 1) ")" (imp "Foundation"))               
                cpp ( "sqrt(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Sqrt(" (e 1) ")" (imp "System"))                                
                php ( "sqrt(" (e 1) ")" )                
                go ( "math.Sqrt(" (e 1) ")" (imp "math"))  
                rust ( "" (e 1) ".sqrt()" )  
                scala ( "math.sqrt(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.sqrt(" (e 1) ")" (imp "java.lang.Math"))
                rust ( (e 1) ".sqrt()" )
                * ( "Math.sqrt(" (e 1) ")")
            }
        }        

        if              cmdIf:void              ( condition:boolean then_block:block else@(keyword) else_block:block )  {
            templates {
                * @macro(true) ('if (' (e 1) ' ) { ' (block 2)' } { '(block 4) ' }' )
            }
        }        
        if!              cmdIf:void              ( condition:boolean then_block:block else@(keyword) else_block:block )  {
            templates {
                * @macro(true) ('if (false == (' (e 1) ' ) ) { ' (block 2)' } { '(block 4) ' }' )
            }
        }        

        if!              cmdIf:void              ( condition:boolean then_block:block else_block:block )  {
            templates {
                * @macro(true) ('if (false == (' (e 1) ' ) ) { ' (block 2)' } { '(block 3) ' }' )
            }
        }        

        if!              cmdIf:void              ( condition:boolean then_block:block )  {
            templates {
                * @macro(true) ('if (false == (' (e 1) ' ) ) { ' (block 2) ' } ' )
            }
        }        
        

        if              cmdIf:void              ( condition:boolean then_block:block else_block:block )  {
            templates {
                ranger ( "if (" (e 1) " ) {" I nl (block 2) i nl "}" (ifa 3) " {" I nl (block 3) i "}" nl)
                rust ( "if  " (e 1) " {" I nl (block 2) i nl "}" (ifa 3) " else {" I nl (block 3) i "}" nl)
                go ( "if  " (e 1) " {" I nl (block 2) i nl "}" (ifa 3) " else {" I nl (block 3) i "}" nl)
                * ( "if ( " (e 1) " ) {" I nl (block 2) i nl "}" (ifa 3) " else {" I nl (block 3) i "}" nl)
            }
        }        
        
        if              cmdIf:void              ( condition:boolean then_block:block )  {
            templates {
                ranger ( "if (" (e 1) ") {" I nl (block 2) nl i "}" nl )
                rust ( "if  " (e 1) " {" I nl (block 2) nl i "}" nl )
                go ( "if  " (e 1) " {" I nl (block 2) nl i "}" nl )
                * ( "if ( " (e 1) " ) {" I nl (block 2) nl i "}" nl )
            }
        }

        if              cmdIf:void              ( condition@(optional):int then_block:block )  {
            templates {
                cpp ( "if ( " (e 1) ".has_value ) {" nl I (block 2) i nl "}" nl )
            }
        }  

        if              cmdIf:void              ( condition@(optional):double then_block:block )  {
            templates {
                cpp ( "if ( " (e 1) ".has_value ) {" nl I (block 2) i nl "}" nl )
            }
        }        

        if              cmdIf:void              ( condition@(optional):T then_block:block )  {
            templates {
                ranger ( "if ( " (e 1) ") ) {" I nl (block 2) i nl "} {" nl I (block 3) i "}" nl)
                scala ( "if ( " (e 1) ".isDefined ) {" nl I (block 2) i nl "}" nl )
                swift3 ( "if ( " (e 1) " != nil ) {" nl I (block 2) i nl "}" nl )
                kotlin ( "if ( " (e 1) " != null ) {" nl I (block 2) i nl "}" nl )
                java7 ( "if ( " (e 1) ".isPresent()) {" nl I (block 2) i nl "}" nl )
                csharp ( "if ( " (e 1) ".HasValue) {" nl I (block 2) i nl "}" nl )
                ; go ( "" (e 1 ) " == nil " ) 
                ; is_some
                php ( "if ( isset( " (e 1) " ) ) {" nl I (block 2) i nl "}" nl )
                go ( "if ( " (e 1) ".has_value) {" nl I (block 2) i nl "}" nl )
                cpp ( "if ( " (e 1) " != NULL ) {" nl I (block 2) i nl "}" nl )
                rust ( "if " (e 1) ".is_some() {" nl I (block 2) i nl "}" nl )
                * ( "if ( typeof(" ( e 1 ) ") != \"undefined\" ) {" nl I (block 2) i nl "}" nl )

            }
        }

        if              cmdIf:void              ( condition@(optional):T then_block:block else_block )  {
            templates {
                ranger ( "if ( " (e 1) " ) {" I nl (block 2) i nl "} {" nl I (block 3) i "}" nl)
                php ( "if ( isset(" (e 1) ") ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                scala ( "if ( " (e 1) ".isDefined ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                java7 ( "if ( " (e 1) ".isPresent() ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                csharp ( "if ( " (e 1) ".HasValue ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                kotlin ( "if ( " (e 1) " != null ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                rust ( "if " (e 1) ".is_some() {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                swift3 ( "if ( " (e 1) " != nil ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                go ( "if ( " (e 1) ".has_value ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                cpp ( "if ( " (e 1) " != NULL ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                * ( "if ( typeof(" ( e 1 ) ") != \"undefined\" ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
            }
        }
        switch          cmdSwitch:void          ( condition:char case_list:block )  {
            templates {
                go ( "switch (int64(" (e 1) " )) { " I (block 2) i "}" )
            }
        }       

        switch          cmdSwitch:void          ( condition:T case_list:block )  {
            templates {
                swift3 ( (custom _ ) )
            }
        } 

        switch          cmdSwitch:void          ( condition:int case_list:block )  {
            templates {
                scala ( (e 1) " match { " I (block 2) i "}" )
                kotlin ( "when (" (e 1) ") { " I (block 2) i "}" )
                * ( "switch (" (e 1) " ) { " I (block 2) i "}" )
            }
        }       

        case        cmdCase:void          (  condition:char case_block:block )  {
            templates {
                ranger ( nl "case " (e 1)" { " nl I (block 2) i nl "}" )
                scala ( nl "case " (e 1)" => " nl I (block 2) nl i )
                swift3 ( nl "case " (e 1)" : " nl I (block 2) nl i )
                java7 ( nl "case " (e 1)" : " nl I (java_case 2) nl i )
                
                es6 ( nl "case " (e 1)" : " nl I (java_case 2) nl i )

                go ( nl "case " (e 1)" : " nl I (block 2) nl i )
                kotlin ( nl (e 1) " -> {" nl I (block 2) nl i "}" )
                cpp ( nl "case " (e 1)" : " nl I "{" nl I (block 2) nl "break;" i nl "}" i )
                * ( nl "case " (e 1)" : " nl I (block 2) nl "break;" i )
            }
        }         

        case        cmdCase:void          (  condition:int case_block:block )  {
            templates {
                ranger ( nl "case " (e 1)" { " nl I (block 2) i nl "}" )
                scala ( nl "case " (e 1)" => " nl I (block 2) nl i )
                swift3 ( nl "case " (e 1)" : " nl I (block 2) nl i )
                java7 ( nl "case " (e 1)" : " nl I (java_case 2) nl i )
                go ( nl "case " (e 1)" : " nl I (block 2) nl i )
                kotlin ( nl (e 1) " -> {" nl I (block 2) nl i "}" )
                cpp ( nl "case " (e 1)" : " nl I "{" nl I (block 2) nl "break;" i nl "}" i )
                es6 ( nl "case " (e 1)" : " nl I (java_case 2) nl i )
                * ( nl "case " (e 1)" : " nl I (block 2) nl "break;" i )
            }
        }      

        switch          cmdSwitch:void          ( condition:string case_list:block )  {
            templates {
                cpp ( (custom _) )                                
                scala ( (e 1) " match { " I (block 2) i "}" )
                kotlin ( "when (" (e 1) ") { " I (block 2) i "}" )
                * ( "switch (" (e 1) " ) { " I (block 2) i "}" )
            }
        }             

        switch          cmdSwitch:void          ( condition:T case_list:block )  {
            templates {

                scala ( (e 1) " match { " I (block 2) i "}" )
                kotlin ( "when (" (e 1) ") { " I (block 2) i "}" )
                * ( "switch (" (e 1) " ) { " I (block 2) i "}" )
            }
        }       

        case        cmdCase:void          (  condition:T case_block:block )  {
            templates {
                ranger ( nl "case " (e 1)" { " nl I (block 2) i nl "}" )
                scala ( nl "case " (e 1)" => " nl I (block 2) nl i )
                swift3 ( nl "case " (e 1)" : " nl I (block 2) nl i )
                java7 ( nl "case " (e 1)" : " nl I (java_case 2) nl i )
                go ( nl "case " (e 1)" : " nl I (block 2) nl i )
                kotlin ( nl (e 1) " -> {" nl I (block 2) nl i "}" )
                es6 ( nl "case " (e 1)" : " nl I (java_case 2) nl i )
                cpp ( nl "case " (e 1)" : " nl I "{" nl I (block 2) nl "break;" i nl "}" i )
                * ( nl "case " (e 1)" : " nl I (block 2) nl "break;" i )
            }
        }        

        default        cmdDefault:void          (  default_block:block )  {
            templates {
                ranger ( nl "default { " nl I (block 1) i nl "}" )
                scala ( nl "case _ => " nl I (block 1) nl i )
                go ( nl "default: " nl I (block 1) nl i )
                kotlin ( nl "else  -> { " nl I (block 2) nl i "}" )
                java7 ( nl "default: " nl I (java_case 1) nl i )
                * ( nl "default: " nl I (block 1) nl "break;" i )
            }
        }
        


        break           cmdBreak:void          ( )  {
            templates {
                ranger  ( nl "break" nl )
                scala ( nl "__break__.break;" nl )
                * ( nl "break;" nl )
            }
        }

        break           cmdBreak:void          ( _:T )  {
            templates {
                ranger  ( nl "break" nl )
                scala ( nl "__break__.break;" nl )
                * ( nl "break;" nl )
            }
        }

        continue        cmdContinue:void          ( )  {
            templates {
                ranger  ( nl "continue " nl )
                scala ( nl "__continue__.break;" nl )
                * ( nl "continue;" nl )
            }
        }
        
        continue        cmdContinue:void          ( _:T)  {
            templates {
                ranger  ( nl "continue " nl )
                scala ( nl "__continue__.break;" nl )
                * ( nl "continue;" nl )
            }
        }


        while           cmdWhile:void          ( condition@(loopcondition):boolean whileLoop@(loopblock):block )  {
            templates {
                go ( "for " (e 1) " {" I nl (block 2) nl i "}" )
                scala ( 
                    (forkctx _ ) (def 2) (def 3) 
                    "try {" nl I
                    "val __break__ = new Breaks;" nl
                    "__break__.breakable { " 
                        nl I 
                            "while (" (e 1) ") {" nl
                                I
                                "val __continue__ = new Breaks;" nl
                                "__continue__.breakable {" nl
                                    I nl (block 2) nl i 
                                "}" nl i
                            "}"
                        i nl
                    "}" nl
                    i nl "} " nl
                    (imp "scala.util.control._")
                )                 
                * ( "while (" (e 1) ") {" nl I (block 2) i nl "}" )
            }
        }


        make         cmdArrayLiteral:[T] ( typeDef@(ignore):[T] size:int repeatItem:T ) {
            templates {
                csharp ( "new " (typeof 1) "( new " (r_atype 1) "[" (e 2)"])")
                swift3 ( "" (typeof 1)"(repeating:" (e 3) ", count:" (e 2) ")" )
                ranger ( "(make  _:" (typeof 1) " " (e 2) ")" )
                go ( "make(" (typeof 1) "," (e 2) ")" )
                cpp (  (typeof 1) "(" (e 2) ")")
                ; new ArrayList<Double>( Arrays.asList( new Double[len_2] ) );
                java7 (  "new " (typeof 1) "( Arrays.asList( new " (r_atype 1) "[" (e 2) "]))")
                java7 ( "new " (typeof 1) "(" (e 2) ")")
                es6 ( "new Array(" (e 2) ")")                
                * ( "[" (comma 2) "]")
            }
        }

        []         cmdArrayLiteral:[T] ( typeDef@(noeval):T listOf:expression ) {
            templates {
                ranger ( "([] _:" (typeof 1) "(" (list 2) "))")
                go ( "[]" (typeof 1) "{" (comma 2) "}")
                cpp ( "r_make_vector_from_array( ( " (typeof 1) "[] ) {" (comma 2) "} )"

(create_polyfill               
"template< typename T, size_t N >
std::vector<T> r_make_vector_from_array( const T (&data)[N] )
{
    return std::vector<T>(data, data+N);
}")                
                )
                scala( "collection.mutable.ArrayBuffer(" (comma 2) ")")
                csharp ( "new List<" (typeof 1) ">{" (comma 2) "}")
                java7 ( (imp "java.util.*") "new ArrayList<" (typeof 1) ">(Arrays.asList( new " (typeof 1)" [] {" (comma 2) "})) " )
                * ( "[" (comma 2) "]")
            }
        }
        null?       cmdIsNotNull:boolean        ( arg@(optional):int ) {
            templates {
                cpp ((e 1) ".has_value == false")     
            }
        }  
        null?       cmdIsNotNull:boolean        ( arg@(optional):double ) {
            templates {
                cpp ((e 1) ".has_value == false")     
            }
        }               
        null?       cmdIsNotNull:boolean        ( arg@(optional):string ) {
            templates {
                cpp ((e 1) ".empty()")     
            }
        }               

        null?       cmdIsNull:boolean        ( arg@(optional):T ) {
            templates {
                ranger ("(null? " (e 1) ")")
                php ( "(!isset(" (e 1) "))")                                
                cpp ((e 1) " == NULL")                                
                swift3 ((e 1) " == nil")  
                java7 ( (e 1) " == null")  
                scala ((e 1) ".isDefined == false ")  
                csharp ((e 1) " == null ")  
                rust ((e 1) ".is_null()")  
                go ( "!" (goset 1 ) ".has_value " )             
                kotlin ((e 1) "== null")     
                es6 (  "typeof(" ( e 1 ) ") === \"undefined\"")
                * ((e 1) "== null")
            }
        }   
        !null?       cmdIsNotNull:boolean        ( arg@(optional):int ) {
            templates {
                cpp ((e 1) ".has_value")     
            }
        }  
        !null?       cmdIsNotNull:boolean        ( arg@(optional):double ) {
            templates {
                cpp ((e 1) ".has_value")     
            }
        }               
        !null?       cmdIsNotNull:boolean        ( arg@(optional):string ) {
            templates {
                cpp ((e 1) ".empty() == false ")     
            }
        }               

        !null?       cmdIsNotNull:boolean        ( arg@(optional):T ) {
            templates {
                ranger ("(!null? " (e 1) ")")
                php ( "(isset(" (e 1) "))")
                scala ((e 1) ".isDefined")  
                swift3 ((e 1) " != nil ")     
                cpp ((e 1) " != NULL ")     
                java7 ((e 1) " != null ")   
                csharp ("" (e 1) " != null")
                rust ((e 1) ".is_some()")     
                kotlin ((e 1) " != null")     
                go (  (goset 1 ) ".has_value" )
                * ('(typeof(' ( e 1 ) ') !== "undefined" && ' (e 1) ' != null ) ')
            }
        }        

        error_msg   _:string () {
            templates {
                ranger ( "(error_msg   )")
                go ( "\"\"" )
                es6 ( "( e.toString())" )
                php ( "( $e->getMessage())" )
                java7 ( "( e.getMessage())" )
                cpp ( " \"unspecified error\" " )
            }
        }

        throw        cmdThrow@(throws):void          (  eInfo:string  )  {
            templates {
                ranger ( nl "throw "  (e 1)  nl )
                go ( nl "panic(" (e 1) ")" nl)
                php ( "throw new Exception(" (e 1) ");")
                csharp ( "throw new ConfigurationErrorsException(" (e 1) ");" (imp "System.Configuration"))
                java7 ( "throw new IllegalArgumentException(" (e 1) ");")
                swift3 ( 
                    nl "throw "  (e 1) ";" nl 
(create_polyfill 
"
extension String: Error {}
"
)                    
                )
                scala ( "throw new customException(" (e 1) ")"

(create_polyfill
"
case class customException(smth:String)  extends Exception
")                    
                )
                * ( nl "throw "  (e 1) ";" nl )
            }
        }
        
        throw        cmdThrow@(throws):void          (  eInfo:T  )  {
            templates {
                ranger ( nl "throw "  (e 1)  nl )
                * ( nl "throw "  (e 1) ";" nl )
            }
        }        

        try          cmdTry:void          (  try_block@(try_block):block catch_block:block  )  {
            templates {
                ranger ( nl "try {" nl I (block 1) i nl "} {" nl I (block 2) i nl "}" nl )  
                csharp ( nl "try {" nl I (block 1) i nl "} catch( Exception e ) {" nl I (block 2) i nl "}" nl )               
                php ( nl "try {" nl I (block 1) i nl "} catch( Exception $e) {" nl I (block 2) i nl "}" nl )               
                scala ( (custom _ ) )
                scala ( 
                    
                    nl "try {" nl I (block 1) i nl "} catch {" nl
                    I
                    "case rv:ScalaReturnValue => {" nl I
                        "throw new ScalaReturnValue(rv.value)"  nl i
                    "}" nl
                    i
                 nl I nl "case e: Exception => {" nl I (block 2) i nl "}" i nl "}" nl )
                java7 ( nl "try {" nl I (block 1) i nl "} catch( Exception e) {" nl I (block 2) i nl "}" nl (imp 'java.io.IOException') )
                go ( (custom _) )
;                go ( "(func () { " nl I "defer func() {" nl I "if r:= recover(); r != nil {" nl I (block 2) i nl "}" nl i "}()" nl (block 1) nl i "})()" nl )  ;"
                ; with swift there is no do without try...
                swift3 ( "do {" nl I (block 1) i nl "} catch { " nl I (block 2) i nl "}" )
                cpp ( nl "try {" nl I (block 1) i nl "} catch( ... ) {" nl I (block 2) i nl "}" nl )
                * ( nl "try {" nl I (block 1) i nl "} catch(e) {" nl I (block 2) i nl "}" nl )
            }
        }
               

        ; T.name is a bit of a problem ??        
        for             cmdFor@(newcontext):void          ( list:[T] item@(define):T indexName@(define ignore):int repeat_block:block)  {
            templates {
                ranger ( nl "for " (e 1) " " (e 2) ":" (typeof 2) " " (e 3)" {" nl I (block 4) nl i "}" )
                swift3 ( (forkctx _ ) (def 2) (def 3) nl "for ( " (swift_rc 3) " , " (e 2) " ) in " (e 1) ".enumerated() {" nl I (block 4) nl i "}" )
                kotlin ( (forkctx _ ) (def 2) (def 3) "for ( " (e 3) " in " (e 1) ".indices ) {" nl I "val " (e 2) " = " (e 1) "[" (e 3) "]" nl (block 4) nl i "}" )

                rust ( (forkctx _ ) (def 2) (def 3) "for (" (e 3) ", " (e 2) " ) in " (e 1) ".enumerate() {" nl I (block 4) nl i "}" )     

                ; idea of go for macro implementation, not working yet...         
                go_idea  @macro(true) (nl 
                "def cnt:int 0" nl
                "def " (e 3) ":int -1" nl
                "while (cnt < (array_length " (e 1) ")) {" nl I
                    (e 3) " =  " (e 3) " + 1" nl
                    " cnt =  cnt + 1" nl
                    "def " (e 2) ":" (typeof 2) " (itemAt " (e 1) " (cnt - 1) );" nl     
                    (block 4) nl
                    i
                "}" nl
                )
                go    (  (def 2) (def 3) "var " (e 3) " int64 = 0;  " nl "for ; " (e 3) " < int64(len(" (e 1) ")) ; " (e 3) "++ {" nl I nl (e 2) " := " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )

                php    ( (forkctx _ ) (def 2) (def 3) "for ( " (e 3) " = 0; " (e 3) " < count(" (e 1) "); " (e 3) "++) {" nl I (e 2) " = " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )
                java7 ( (forkctx _ ) (def 2) (def 3) "for ( int " (e 3) " = 0; " (e 3) " < " (e 1) ".size(); " (e 3) "++) {" nl I (typeof 2) " " (e 2) " = " (e 1) ".get(" (e 3) ");" nl (block 4) nl i "}" )
                csharp ( (forkctx _ ) (def 2) (def 3) "for ( int " (e 3) " = 0; " (e 3) " < " (e 1) ".Count; " (e 3) "++) {" nl I (typeof 2) " " (e 2) " = " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )
                scala ( (custom _) )      
                cpp ( (forkctx _ ) (def 2) (def 3) "for ( int " (e 3) " = 0; " (e 3) " != (int)(" (e 1) ".size()); " (e 3) "++) {" nl 
                            I (typeof 2) " " (e 2) " = " (e 1) ".at(" (e 3) ");" nl (block 4) nl i "}" )          
                cpp.old ( (forkctx _ ) (def 2) (def 3) "for ( std::vector< " (typeof 2) ">::size_type " (e 3) " = 0; " (e 3) " != " (e 1) ".size(); " (e 3) "++) {" nl 
                            I (typeof 2) " " (e 2) " = " (e 1) ".at(" (e 3) ");" nl (block 4) nl i "}" )          
                * ( (forkctx _ ) (def 2) (def 3) "for ( let " (e 3) " = 0; " (e 3) " < " (e 1) ".length; " (e 3) "++) {" nl I "var " (e 2) " = " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )
            }
        }

        
        for             cmdFor@(newcontext):void          ( hash:[string:T] item@(define):T itemName@(define ignore):string repeat_block:block)  {
            templates {
                es6 ("for( var " (e 3) " in " (e 1) ") {" nl I "if(" (e 1) ".hasOwnProperty(" (e 3) ")) {" 
                        nl I "var " (e 2) " = " (e 1) "[" (e 3) "] " nl (block 4) 
                        nl i "} }"
                     )
            }
        }    

        for             cmdFor@(newcontext):void          ( hash:[string:T] itemName@(define ignore):string repeat_block:block)  {
            templates {
                es6 ("for( var " (e 2) " in " (e 1) ") {" nl I "if(" (e 1) ".hasOwnProperty(" (e 2) ")) {" 
                        nl I (block 3) 
                        nl i "} " nl i "}"
                     )
            }
        }              

        trim             cmdTrim:string          ( value:string ) { 
            templates {
                ranger ( "(trim " (e 1 ) ")")                
                swift3 ( (e 1 ) ".trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)" (imp "Foundation"))                
                php ( "trim(" (e 1 ) ")")
                cpp ( "r_cpp_trim( " (e 1) ")" (imp "<cctype>") (imp "<string>") (imp "<algorithm>")
(create_polyfill "
inline std::string  r_cpp_trim(std::string &s) 
{
   auto wsfront=std::find_if_not(s.begin(),s.end(),[](int c){return std::isspace(c);});
   auto wsback=std::find_if_not(s.rbegin(),s.rend(),[](int c){return std::isspace(c);}).base();
   return (wsback<=wsfront ? std::string() : std::string(wsfront,wsback));
}    
    ") )  
                scala ( (e 1) ".trim" )
                csharp ( (e 1) ".Trim()" (imp "System"))
                go ("strings.TrimSpace(" (e 1) ")" (imp "strings"))
                * ( (e 1) ".trim()" )
            }            
        }                 

;         wr.out (").to[collection.mutable.ArrayBuffer]" false
; kotlin could use also something like: .split(Regex("(?<=[!?])|(?=[!?])"))
; swift : .components(separatedBy:
        strsplit       cmdSplit:[string]       ( strToSplit:string delimiter:string ) { 
            templates {
                ranger ( "( strsplit " (e 1) " " (e 2) " )")
                ; TODO: C++ version, requires perhaps external lib to do it directly to vector<std::string>
                scala ( (e 1) ".split(" (e 2) ").to[collection.mutable.ArrayBuffer]")  
                csharp ( 
(create_polyfill 
"
  public static List<String>  __Split( String str, String token ) {
      if( token.Length == 0 ) {
        List<String> res = new List<String>();
        foreach (Char c in str) {
          res.Append( c.ToString() );
        }
        return res;
      }
      return ( (List<String>)str.Split(token[0]).ToList() );
  }

"

)                    
                    
                    "__Split(" (e 1) ", " (e 2) ")" (imp 'System.Linq'))
                swift3 ( (e 2) ".characters.count == 0 ? Array(" (e 1) ".characters).map { String($0) } : " (e 1) ".components( separatedBy : " (e 2) ")" (imp "Foundation"))
                java7( "new ArrayList<String>(Arrays.asList(" (e 1) ".split(" (e 2) ")))" )
                php ( "strlen(" (e 2) ") == 0 ? str_split(" (e 1) ") : " "explode(" (e 2) ", " (e 1) ")")               
                go ("strings.Split(" (e 1) ", " (e 2) ")" (imp "strings"))

                cpp ( "r_str_split( " (e 1) ", " (e 2) ")"          (imp "<sstream>") (imp "<iterator>")

(create_polyfill
"
std::vector<std::string> r_str_split(std::string data, std::string token) {
    std::vector<std::string> output;
    size_t pos = std::string::npos; 
    if(token.length() == 0) {
        for(std::string::iterator it = data.begin(); it != data.end(); ++it) {
            output.push_back( std::string( it, it + 1) );
        }        
        return output;
    }
    do
    {
        pos = data.find(token);
        output.push_back(data.substr(0, pos));
        if (std::string::npos != pos)
            data = data.substr(pos + token.size());
    } while (std::string::npos != pos);
    return output;
}
"
)   
                )

                * ( (e 1) ".split(" (e 2) ")")
            }
        }

        strlen       cmdStrlen:int       ( text:string ) { 
            templates {
                ranger ( "( strlen (" (e 1 ) "))")
                cpp ( '(int)('(e 1) ".length())") 
                java7 ( (e 1) ".length()") 
                scala ( (e 1) ".length()")  
                swift3 ( (e 1) ".characters.count")  
                csharp ( (e 1) ".Length")
                php ( "strlen(" (e 1) ")") 
                go ( "int64(len(" (e 1) "))")               
                * ( (e 1) ".length")
            }
        }

        ; String s = new String(a, 2, 4)
        
        ; C#
        ; Encoding.ASCII.GetString(bytes)
        ; System.Buffer.BlockCopy(str.ToCharArray(), 0, bytes, 0, bytes.Length);
        ; new List<string>(Source).GetRange(2, 2).ToArray();

        ; scala:
        ; new String(array.map(_.toChar)))
        ; array.slice()

        ; swift:
        ; String(data: Data(bytes: s[sp ..< i]) , encoding: .utf8)!

        substring   cmdSubstring:string       ( text:charbuffer start:int end:int ) { 
            templates {
                ranger ( "(substring " (e 1) " " (e 2) " " (e 3) ")") 
                csharp ( "Encoding.UTF.GetString(new List<byte>(" (e 1) ").GetRange(" (e 2) ", " (e 3) ").toArray())")
                scala ( "new String(" (e 1) ".slice(" (e 2) ", " (e 3) ").map(_.toChar) )")
                java7 ( "new String(" (e 1) "," (e 2) ", " (e 3) " - " (e 2) " )")
                swift3 ( "String(data: Data(bytes:" (e 1) "[" (e 2) " ..< " (e 3) "]), encoding: .utf8)!"  (imp "Foundation"))
                kotlin ( "String(" (e 1) "," (e 2) ", " (e 3) " - " (e 2) " )")           
                go ( "fmt.Sprintf(\"%s\", " (e 1) "[" (e 2) ":" (e 3) "])"               
                 (imp "fmt")
                )
                cpp ( "std::string( " (e 1) " + " (e 2) ", " (e 3) " - " (e 2) " )")
                php ( "substr(" (e 1) ", " (e 2) ", " (e 3) " - " (e 2) ")") 
                * ( (e 1) ".substring(" (e 2) ", " (e 3) " )")
            }
        }

        to_string bufferToString:string       ( text:charbuffer ) { 
            templates {      
                ranger ( "(to_string " (e 1) ")")
                go ( "string(" (e 1) ")" )
                * ( (e 1) )
            }
        }     

        toString   bufferToString:string       ( text:charbuffer ) { 
            templates {      
                go ( "string(" (e 1) ")" )
                * ( (e 1) )
            }
        }        

        to_charbuffer      cmdToCharBuffer:charbuffer       ( text:string ) { 
            templates {
                ranger ( "(to_charbuffer " (e 1) ")") 
                swift3 ( "Array(" (e 1) ".utf8)" )
                scala ( (e 1) ".toCharArray.map(_.toByte)")
                java7 ( (e 1) ".getBytes()" )
                csharp ( "Encoding.ASCII.GetBytes(" (e 1) ")")
                kotlin ( (e 1 ) ".toCharArray()" )
                rust ( (e 1) ".into_bytes()")
                cpp ( (e 1) ".c_str()")
                php ( (e 1) )
                go("[]byte(" (e 1) ")")
                * ( (e 1) )
            }
        }

        to_int      cmdToInt:int       ( value:double ) { 
            templates {
                ranger ( "(to_int " (e 1) ")") 
                csharp ( "(int)" (e 1 ) "" )
                swift3 ( "Int(" (e 1 ) ")" )
                kotlin ( (e 1 ) ".toInt()" )
                scala ( (e 1 ) ".toInt" )
                rust ( (e 1 ) " as i64 " )
                go ( "int64(" (e 1) ")")
                php ( "floor(" (e 1) ")")
                java7 ( "Double.valueOf(" (e 1) ").intValue()")
                cpp ( "(int)floor( " (e 1) ")" (imp "<math.h>"))
                * ( "Math.floor( " (e 1) ")" )
            }
        }        

        to_int      cmdToInt:int       ( ch:char ) { 
            templates {
                ranger ( "(to_int " (e 1) ")") 
                csharp ( "(int)" (e 1 ) "" )
                swift3 ( "Int(" (e 1 ) ")" )
                kotlin ( (e 1 ) ".toInt()" )
                scala ( (e 1 ) ".toInt" )
                rust ( (e 1 ) " as i64 " )
                go ( "int64(" (e 1) ")")
                php ( (e 1) )
                * ( (e 1) )
            }
        }        
        
        to_int cmdToInt@(optional):int (txt:string) {
            templates {
                * @macro(true) ("str2int(" (e 1) ")")
            }
        }

        ; Length
        length      cmdLength:int       ( buffer:charbuffer ) { 
            templates {
                ranger ( "(length " (e 1) ")") 
                csharp ( (e 1 ) ".Length" )
                kotlin ( (e 1 ) ".size" )
                scala ( (e 1 ) ".length" )
                swift3 ( (e 1 ) ".count" )
                rust ( (e 1 ) ".len()" )
                java7 ( (e 1 ) ".length" )
                cpp( "strlen( " (e 1) " )" (imp "<cstring>"))
                go ( "int64(len(" (e 1 ) "))")
                php ( "strlen(" (e 1 ) ")")
                * ( (e 1) ".length" )
            }
        }          

        substring      _:string       ( text:string position:int ) {
            templates {
                ramger ('(end ' (e 1) ' ' (e 2) ')' )
                * @macro(true) ('(substring '(e 1)' ' (e 2) ' (strlen ' (e 1) '))')
            } 
        }

        max _:int (left:int right:int) {
            templates {
                * @macro(true) ('(?  (' (e 1) ' < ' (e 2)' ) ' (e 2) ' ' (e 1) ')')
            }
        }


        at      _:string       ( text:string position:int ) { 
            templates {
                ranger ( '(at ' (e 1) ' ' ( e 2 ) ')')
                cpp ( 'r_utf8_substr(' (e 1) ', ' (e 2) ', 1)'
(create_polyfill '
std::string r_utf8_substr(const std::string& str, int start_i, int leng_i)
{
    unsigned int start ((unsigned int)start_i);
    unsigned int leng ((unsigned int)leng_i);
    if (leng==0) { return ""; }
    unsigned int c, i, ix, q, min= (unsigned int) std::string::npos, max=(unsigned int)std::string::npos;
    for (q=0, i=0, ix=str.length(); i < ix; i++, q++)
    {
        if (q==start){ min=i; }
        if (q<=start+leng || leng==std::string::npos){ max=i; }
        c = (unsigned char) str[i];
        if(c<=127) i+=0;
        else if ((c & 0xE0) == 0xC0) i+=1;
        else if ((c & 0xF0) == 0xE0) i+=2;
        else if ((c & 0xF8) == 0xF0) i+=3;
        else return ""; //invalid utf8
    }
    if (q<=start+leng || leng==std::string::npos){ max=i; }
    if (min==std::string::npos || max==std::string::npos) { return ""; }
    return str.substr(min,max);
}
')                
                
                )    
                csharp ( (e 1) ".Substring(" (e 2) ", 1)")
                php ( "substr(" (e 1) ", " (e 2) ", 1)")               
                java7 ( (e 1) ".substring(" (e 2) ", " (e 2) " + 1)")  
                kotlin ( (e 1) ".substring(" (e 2) ", " (e 2) " + 1)")  
                scala ( (e 1) "(" (e 2) ")")    
                go ( (e 1) "[" (e 2) ": (" (e 2) " + 1)]")  

                swift3 ( (imp 'Foundation') (e 1) "[" (e 1) ".index(" (e 1) ".startIndex, offsetBy:" (e 2) ")..<" (e 1) ".index(" (e 1) ".startIndex, offsetBy:" (e 2) " + 1)]" )
                
                ; swift3 ( 'Int( ( NSString(string: ' (e 1) ' ) ).character( at: ' (e 2) ' ) )')
                ; swift3 ( (imp 'Foundation')  (e 1) '.substring(from: ' (e 1) '.index(' (e 1) '.startIndex, offsetBy: ' (e 2) ' + 1), to: ' (e 1) '.index(' (e 1) '.startIndex, offsetBy: ' (e 2) ' + 1))')    
                * ( (e 1) '[' (e 2) ']')
            }
        }                

        charAt      cmdCharAt:int       ( text:string position:int ) { 
            templates {
                ranger ( "(charAt " (e 1) " " ( e 2 ) ")")
                cpp ( (e 1) ".at(" (e 2) ")")    
                csharp ( (e 1) "[" (e 2) "]")
                php ( "ord(" (e 1) "[" (e 2) "])")               
                java7 ( "(int)" (e 1) ".charAt(" (e 2) ")")  
                kotlin ( (e 1) "[" (e 2) "]")    
                scala ( (e 1) "(" (e 2) ")")    
                go ( "int64(" (e 1) "[" (e 2) "])")  
                swift3 ( "Int( ( NSString(string: " (e 1) " ) ).character( at: " (e 2) " ) )")
                swift3 ( "Int( String( " (e 1) ".characters[" (e 1) ".index(" (e 1) ".startIndex, offsetBy: " (e 2) ")]))!")    
                * ( (e 1) ".charCodeAt(" (e 2) " )")
            }
        }        

        ; https://stackoverflow.com/questions/41690156/how-to-get-the-keys-as-string-array-from-map-in-go-lang
        ; https://stackoverflow.com/questions/110157/how-to-retrieve-all-keys-or-values-from-a-stdmap-and-put-them-into-a-vector
        keys        _:[string]           ( map:[string:T] ) {
            templates {
                ranger ("(keys " (e 1) ")")
                java7 ( "new ArrayList<>(" (e 1) ".keySet())")
                swift3 ("Array(" (e 1) ".keys)")
                scala ( (e 1) ".keys.to[collection.mutable.ArrayBuffer]")
                php ("array_keys(" (e 1) ")")
                es6 ( "Object.keys(" (e 1) ")")
                csharp ( "new List<String>(" (e 1) ".Keys)")
                cpp (
                    "r_get_keys_of_map<" (r_atype 1) ">(" (e 1) ")"
(create_polyfill
"
template< typename T >
std::vector<std::string> r_get_keys_of_map(  std::map<std::string, T> orig_map )  { 
    std::vector<std::string> res;
    for(auto it = orig_map.begin(); it != orig_map.end(); ++it) {
        res.push_back(it->first);
    }
    return res;
}"  (imp "<string>") (imp "<vector>") (imp "<map>"))                  
                    

                )
                go ("(func() []string {" nl I
                        "keys := reflect.ValueOf(" (e 1) ").MapKeys()" nl
                        "strkeys := make([]string, len(keys))" nl
                        "for i := 0; i < len(keys); i++ {" nl I
                          "strkeys[i] = keys[i].String()" nl i "}" nl
                        "return strkeys" nl i "})()"
                    (imp "reflect"))
            }
        } 

        charAt      cmdCharAt:char       ( text:charbuffer position:int ) { 
            templates {
                ranger ( "(charAt " (e 1) " " ( e 2 ) ")")
                cpp ( (e 1) "[" (e 2) "]")    
                csharp ( (e 1) "[" (e 2) "]")
                php ( "ord(" (e 1) "[" (e 2) "])")               
                java7 ( (e 1) "[" (e 2) "]")  
                kotlin ( (e 1) "[" (e 2) "]")    
                scala ( (e 1) "(" (e 2) ")")    
                go ( (e 1) "[" (e 2) "]")  
                swift3 ( (e 1) "[" (e 2) "]")    
                * ( (e 1) ".charCodeAt(" (e 2) " )")
            }
        }

        substring   cmdSubstring:string       ( text:string start:int end:int ) { 
            templates {
                ranger ( '(substring ' (e 1) ' ' (e 2) ' ' (e 3) ')')
                cpp.old ( '' (e 1) '.substr(' (e 2) ', ' (e 3) ' - ' (e 2) ')' )
                cpp ( 'r_utf8_substr('(e 1) ', ' (e 2) ', ' (e 3) ' - ' (e 2) ')'
(create_polyfill '
std::string r_utf8_substr(const std::string& str, int start_i, int leng_i)
{
    unsigned int start ((unsigned int)start_i);
    unsigned int leng ((unsigned int)leng_i);
    if (leng==0) { return ""; }
    unsigned int c, i, ix, q, min= (unsigned int) std::string::npos, max=(unsigned int)std::string::npos;
    for (q=0, i=0, ix=str.length(); i < ix; i++, q++)
    {
        if (q==start){ min=i; }
        if (q<=start+leng || leng==std::string::npos){ max=i; }
        c = (unsigned char) str[i];
        if(c<=127) i+=0;
        else if ((c & 0xE0) == 0xC0) i+=1;
        else if ((c & 0xF0) == 0xE0) i+=2;
        else if ((c & 0xF8) == 0xF0) i+=3;
        else return ""; //invalid utf8
    }
    if (q<=start+leng || leng==std::string::npos){ max=i; }
    if (min==std::string::npos || max==std::string::npos) { return ""; }
    return str.substr(min,max);
}
')                
                
                )    
                csharp ( (e 1) ".Substring(" (e 2) ", " (e 3) " - " (e 2) " )")
                php ( "substr(" (e 1) ", " (e 2) ", " (e 3) " - " (e 2) ")")    
                go (  (e 1) "[" (e 2) ":" (e 3) "]")               
                swift3 ( (e 1) "[" (e 1) ".index(" (e 1) ".startIndex, offsetBy:" (e 2) ")..<" (e 1) ".index(" (e 1) ".startIndex, offsetBy:" (e 3) ")]" )
                * ( (e 1) ".substring(" (e 2) ", " (e 3) " )")
            }
        }

        ;(charcode "A")
        charcode   cmdCharcode:char       ( text:string ) { 
            templates {
                ranger ( "(charcode " (e 1) ")")
                go ( "[]byte(" (e 1) ")[0]" )
                cpp( (e 1) ".at(0)")
                php ( "ord(" (e 1) ")") 
                java7 ( "((" (e 1) ".getBytes())[0])") 
                swift3 ( "UInt8( (  NSString(string: " (e 1) " )     ).character( at: 0 ) )" (imp "Foundation"))
                swift3 ( "UInt8( String( " (e 1) ".characters[" (e 1) ".startIndex]))! ")  
                * ( (e 1) ".charCodeAt(0)" )
            }
        }

        ccode       cmdCharCode:char ( text:string ) { 
            templates {
                * ( (cc 1) )
            }
        }

        strfromcode   cmdStrFromCode:string       ( code:char ) { 
            templates {
                ranger ( "(strfromcode " (e 1) ")")
                csharp ( "((char)" (e 1) ").toString()") 
                java7 ( "(new String( new char[] {" (e 1) " }))") 
                swift3 ( "(String( Character( UnicodeScalar(" (e 1) " ) )))") 
                php ( "chr(" (e 1) ")") 
                scala ( "(" (e 1) ".toChar)")      
                go ("string([] byte{byte(" (e 1) ")})")      
                cpp ( "std::string(1, char(" (e 1) "))") 
                * ( "String.fromCharCode(" (e 1) ")")
            }
        }
        

        strfromcode   cmdStrFromCode:string       ( code:int ) { 
            templates {
                ranger ( "(strfromcode " (e 1) ")"))
                csharp ( "((char)" (e 1) ").toString()") 
                java7 ( "(new String( Character.toChars(" (e 1) ")))") 
                swift3 ( "(String( Character( UnicodeScalar(" (e 1) " )! )))") 
                php ( "chr(" (e 1) ")") 
                scala ( "(" (e 1) ".toChar)")      
                go ("string([] byte{byte(" (e 1) ")})")        
                cpp ( "std::string(1, char(" (e 1) "))") 
                * ( "String.fromCharCode(" (e 1) ")")
            }
        }

        to_string   _:string       ( value:int ) { 
            templates {
                ranger ( "(to_int " (e 1) ")")
                cpp ("std::to_string(" (e 1) ")" (imp "<string>"))
                java7 ( "String.valueOf(" (e 1) " )") 
                php ( "strval(" (e 1) ")") 
                scala ( "(" (e 1) ".toString)")
                go ("strconv.FormatInt(" (e 1) ", 10)" (imp "strconv"))
                swift3 ("String(" (e 1) ")")              
                csharp ( (e 1) ".ToString()" )
                * ( "(" (e 1) ".toString())")
            }
        }          

        to_string   cmdIntToString:string       ( value:int ) { 
            templates {
                ranger ( "(to_string " (e 1) ")")
                cpp ("std::to_string(" (e 1) ")" (imp "<string>"))
                java7 ( "String.valueOf(" (e 1) " )") 
                php ( "strval(" (e 1) ")") 
                scala ( "(" (e 1) ".toString)")
                go ("strconv.Itoa(" (e 1) ")" (imp "strconv"))
                swfit3 ("String(" (e 1) ")")              
                * ( "(" (e 1) ").toString()")
            }
        }        
        
        ; std::to_string(myDoubleVar);
        double2str   cmdDoubleToString:string       ( value:double ) { 
            templates {
                ranger ( "(double2str " (e 1) ")")
                cpp ("std::to_string(" (e 1) ")" (imp "<string>"))
                java7 ( "String.valueOf(" (e 1) " )") 
                php ( "strval(" (e 1) ")") 
                scala ( "(" (e 1) ".toString)")
                go ("strconv.FormatFloat(" (e 1) ",'f', 6, 64)" (imp "strconv"))
                swift3 ("String(" (e 1) ")")              
                * ( "(" (e 1) ".toString())")
            }
        }

        to_string  _:string       ( value:double ) { 
            templates {
                ranger ( "(double2str " (e 1) ")")
                cpp ("std::to_string(" (e 1) ")" (imp "<string>"))
                java7 ( "String.valueOf(" (e 1) " )") 
                php ( "strval(" (e 1) ")") 
                scala ( "(" (e 1) ".toString)")
                go ("strconv.FormatFloat(" (e 1) ",'f', 6, 64)" (imp "strconv"))
                swift3 ("String(" (e 1) ")")              
                * ( "(" (e 1) ".toString())")
            }
        }

        ; note: this has now different value, it is optional int...
        ; the optionality of the return value should be preserved 
        ; can not do just
        ;   def x:int (10 + (str2int "hello"))
        ; --> optional return value here...

        str2int   cmdStringToInt@(optional):int      ( value:string ) { 
            templates {
                ranger ( "(str2int " (e 1) ")")
                cpp ("cpp_str_to_int(" (e 1) ")" (imp "<string>")
                
(create_polyfill
"
template <class T>
class r_optional_primitive {
  public:
    bool has_value;
    T value;
    r_optional_primitive<T> & operator=(const r_optional_primitive<T> & rhs) {
        has_value = rhs.has_value;
        value = rhs.value;
        return *this;
    }
    r_optional_primitive<T> & operator=(const T a_value) {
        has_value = true;
        value = a_value;
        return *this;
    }
};
"
) 
(create_polyfill
"r_optional_primitive<int> cpp_str_to_int(std::string s) {
    r_optional_primitive<int> result;
    try {
        result.value = std::stoi(s);
        result.has_value = true;
    } catch (...) {
        
    }
    return result;
}"
)                  
                
                )
                java7 ( 
                    "_getIntegerOrNull(" (e 1) " )"
(create_polyfill 
"
static Integer _getIntegerOrNull ( String str ) {
    try {
       return (Integer.parseInt(str));
    } catch ( NumberFormatException e ) {
        return null;
    }
}
"
)                    
                )
                go ("r_str_2_i64(" (e 1) ")"

(create_polyfill
"
func r_str_2_i64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseInt(s, 10, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}
"
)                
                
                )
                php ( "is_numeric(" (e 1) ") ? intval(" (e 1) ") : NULL ")
                scala ( "Try(" (e 1) ".toInt).toOption" (imp "scala.util.Try"))
                kotlin (  (e 1) ".toInt()")
                swift3 ("Int(" (e 1) ")")           
                csharp( "Int32.Parse(" (e 1) ")" )   
                * ( "isNaN( parseInt(" (e 1) ") ) ? undefined : parseInt(" (e 1) ")")
            }
        }

        str2double   cmdStringToDouble@(optional):double      ( value:string ) { 
            templates {
                ranger ( "(str2double " (e 1) ")")
                cpp ("cpp_str_to_double(" (e 1) ")" (imp "<string>")
(create_polyfill
"
template <class T>
class r_optional_primitive {
  public:
    bool has_value;
    T value;
    r_optional_primitive<T> & operator=(const r_optional_primitive<T> & rhs) {
        has_value = rhs.has_value;
        value = rhs.value;
        return *this;
    }
    r_optional_primitive<T> & operator=(const T a_value) {
        has_value = true;
        value = a_value;
        return *this;
    }
};
"
) 
(create_polyfill
"r_optional_primitive<double> cpp_str_to_double(std::string s) {
    r_optional_primitive<double> result;
    try {
        result.value = std::stod(s);
        result.has_value = true;
    } catch (...) {
        
    }
    return result;
}"
)                  
                
                )
                java7 ( 
                    "_getDoubleOrNull(" (e 1) " )"
(create_polyfill 
"
Double _getDoubleOrNull ( String str ) {
    try {
       return (Double.parseDouble(str));
    } catch ( NullPointerException e ) {
        return null;
    } catch ( NumberFormatException e ) {
        return null;
    }
}
"
)                    
                    ) 
                go ("r_str_2_d64(" (e 1) ")"
                (imp "strconv")
(create_polyfill
"func r_str_2_d64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseFloat(s, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}"
)                
                )
                php ( "floatval(" (e 1) ")")
                scala ( "Try(" (e 1) ".toDouble).toOption" (imp "scala.util.Try"))
                kotlin (  (e 1) ".toDouble()")
                swift3 ("Double(" (e 1) ")")              
                * ( "isNaN( parseFloat(" (e 1) ") ) ? undefined : parseFloat(" (e 1) ")")
            }
        }

        to_double cmdToDbl@(optional):double (value:string) {
            templates {
                * @macro(true) ("str2double(" (e 1) ")")
            }
        }
        
        ; scala: .mkString(
        join             cmdJoin:string          ( array:[string] delimiter:string ) { 
            templates {      
                ranger ( "(join " (e 1) " " (e 2) ")")          
                java7 ( "joinStrings(" (e 1 ) ", " (e 2) ")" 
                    (imp "java.lang.StringBuilder")
(create_polyfill "
static String joinStrings(ArrayList<String> list, String delimiter) 
{
    StringBuilder b = new StringBuilder();
    for(int i=0; i < list.size() ; i++) {
        if( i > 0 ) {
            b.append(delimiter);
        }
        b.append(list.get(i));
    }
    return b.toString();
}    
    ")                               
                
                )

                cpp ( "join( " (e 1) " , " (e 2) ")" (imp "<sstream>") (imp "<string>") (imp "<iostream>")
(create_polyfill "
template <typename T>
std::string join(const T& v, const std::string& delim) {
    std::ostringstream s;
    for (const auto& i : v) {
        if (&i != &v[0]) {
            s << delim;
        }
        s << i;
    }
    return s.str();
}   
    ") )  

                csharp ( "String.Join(" (e 2) ", " (e 1) ")" (imp "System"))
                go ( "strings.Join(" (e 1) ", " (e 2) ")")
                scala ( (e 1) ".mkString(" (e 2) ")" )
                php ( "implode(" (e 2) ", " (e 1) ")")
                swift3 ( (e 1) ".joined(separator:" (e 2) ")")
                * ( (e 1) ".join(" (e 2) ")" )
            }            
        }                 
        
        has             cmdHas:boolean          ( map:[K:T] key:K ) { 
            templates {                
                ranger ( "(has " (e 1) " " (e 2) ")") 
                es5  ( "typeof(" (e 1) "[" (e 2) "] ) != \"undefined\"" )
                es6  ( "( typeof(" (e 1) "[" (e 2) "] ) != \"undefined\" && " (e 1) ".hasOwnProperty(" (e 2) ") )" )
                ts   ( "typeof(" (e 1) "[" (e 2) "] ) != \"undefined\"" )
                flow ( "typeof(" (e 1) "[" (e 2) "] ) != \"undefined\"" )
                cpp ( (e 1) ".count(" (e 2) ") > 0" )
                php ( "array_key_exists(" (e 2) " , " (e 1) " )" )
                java7 ( (e 1) ".containsKey(" (e 2) ")" )
                kotlin ( (e 1) ".containsKey(" (e 2) ")" )
                go ( 

(macro (nl "func r_has_key_" (r_ktype 1)  "_" (r_atype_fname 1) "( a "  (typeof 1) ", key " (r_ktype 1) " ) bool { " nl I 
    "_, ok := a[key]" nl "return ok" nl i "
}" nl ))                   
                    "r_has_key_" (r_ktype 1)  "_" (r_atype_fname 1) "(" (e 1) ", " (e 2) ")"
                )
                rust ( (e 1 ) ".contains_key(&" (e 2) ")")
                csharp ( (e 1) ".ContainsKey(" (e 2) ")" )
                scala ( (e 1) ".contains(" (e 2) ")" )
                swift3 ( (e 1) "[" (e 2) "] != nil" )
                * ( (e 1) "[" (e 2) "] != null" )
            }            
        }  

        get             cmdGet@(optional):T          ( a:[T] index:int ) {
            templates {
                es6 ('( ' (e 1) '.length  > ' (e 2)'  && ' (e 2)' >= 0  ?  '(e 1) '[' (e 2)'] : null ) ')
            } 
        }
        

        get             cmdGet@(optional weak):int          ( map:[K:int] key:K ) { 
            templates {
                cpp( "cpp_get_map_int_value<" (r_ktype 1) ">(" (e 1) ", " (e 2) ")"
(create_polyfill
"
template <class T>
class r_optional_primitive {
  public:
    bool has_value;
    T value;
    r_optional_primitive<T> & operator=(const r_optional_primitive<T> & rhs) {
        has_value = rhs.has_value;
        value = rhs.value;
        return *this;
    }
    r_optional_primitive<T> & operator=(const T a_value) {
        has_value = true;
        value = a_value;
        return *this;
    }
};
"
) 
(macro
("
template<typename T>
r_optional_primitive<int> cpp_get_map_int_value( std::map<" (r_ktype 1) ", int> m , " (typeof 2) space "  key) {
    r_optional_primitive<int> result;
    try {
        result.value = m[key];
        result.has_value = true;
    } catch (...) {
        
    }
    return result;
}")
) 

                )
            }
        }
         
        get             cmdGet@(optional weak):T          ( map:[K:T] key:K ) { 
            templates {
                ranger ( "(get " (e 1) " " (e 2) ")")                 
                java7 ( (e 1) ".get(" (e 2) ")" )
                rust ( (e 1) ".get(" (e 2) ")" )

                scala ( (e 1) ".get(" (e 2) ")" )

                ; scala ( (e 1) ".get(" (e 2) ").asInstanceOf[" (atype 1) "]" )

                go ( 

(macro (nl "func r_get_" (r_ktype 1)  "_" (r_atype_fname 1) "( a " (typeof 1) ", key " (r_ktype 1) " ) *GoNullable  { " nl I 
    "res := new(GoNullable)" nl  
    "v, ok := a[key]" nl 
    "if ok { " nl
        I 
          "res.has_value = true" nl
          "res.value = v" nl
          "return res" nl
        i
    "}" nl
    "res.has_value = false" nl
    "return res" nl
i "}" nl ))                   
                    "r_get_" (r_ktype 1)  "_" (r_atype_fname 1) "(" (e 1) ", " (e 2) ")"
                )                
                * ( (e 1) "[" (e 2) "]" )
            }            
        }                 

        set             cmdSet@(moves@( 3 1 ) ):void          ( array@(mutates):[T] index:int value@( refto@(1) ):T ) { 
            templates {
                ranger ( "set " (e 1) " " (e 2) " " (e 3) )                
                java7 ( (e 1) ".set(" (e 2) ", " (e 3) ");" )
                rust ( (e 1) ".insert(" (e 2) ", " (e 3) ");" )
                scala ( (e 1) "(" (e 2) ") =  " (e 3)  )
                kotlin ( (e 1) ".set(" (e 2) ", " (e 3) ")" )
                php ( (e 1) "[" (e 2) "] = " (e 3) ";" )
                cpp ( (e 1) "[" (e 2) "] = " (e 3) ";" )
                ; * ( (e 1) "[" (e 2) "] = " (e 3) )
                * ( (e 1) "[" (e 2) "] = " (e 3) ";" )
            }            
        } 
        
        set             cmdSet@(moves@( 3 1 ) ):void          ( map@(mutates):[K:T] key:K value@( refto@(1) ):T ) { 
            templates {
                ranger ( "set " (e 1) " " (e 2) " " (e 3) )                
                java7 ( (e 1) ".put(" (e 2) ", " (e 3) ");" )
                rust ( (e 1) ".insert(" (e 2) ", " (e 3) ");" )
                scala ( (e 1) ".put(" (e 2) ", " (e 3) ")" )
                kotlin ( (e 1) ".set(" (e 2) ", " (e 3) ")" )
                php ( (e 1) "[" (e 2) "] = " (e 3) ";" )
                cpp ( (e 1) "[" (e 2) "] = " (e 3) ";" )
                * ( (e 1) "[" (e 2) "] = " (e 3) ";" )
            }            
        }                 

        lift    cmdLift@(optional):T      ( array:[T] index:int ) { 
            templates {
                ranger ( "(set " (e 1) " " (e 2) ")")
                 cpp ( (e 1) ".at( " (e 2) ")" (imp "<vector>"))   
                 java7 ( (e 1) ".get(" (e 2) ")" )                                 
                 ; lift return optional type => safer                             
                 scala ( (e 1) ".lift(" (e 2) ")" )  
                 swift3 ( (e 1) "[" (e 2) "]" )    
                 * (  (e 1) "[" (e 2) "]" )                                              
            }
        }

        itemAt    cmdItemAt@(weak):T      ( array:[T] index:int ) { 
            templates {
                ranger ( "(itemAt " (e 1) " " (e 2) ")" )
                 cpp ( (e 1) ".at(" (e 2) ")" (imp "<vector>"))   
                 java7 ( (e 1) ".get(" (e 2) ")" )                                 
                 ; lift return optional type => safer                             
                 scala ( (e 1) "(" (e 2) ")" )  
                 * ( (e 1) "[" (e 2) "]" )                                              
            }
        }

        indexOf cmdStringIndex:int (str:string key:string) {
            templates {
                php( "strpos(" (e 1) ", " (e 2) ")")
                go ( "int64(strings.Index(" (e 1) ", " (e 2) "))" (imp "strings"))
                es6 ( (e 1) ".indexOf(" (e 2 ) ")" )
                java7 ( (e 1) ".indexOf(" (e 2 ) ")" )
                cpp (
                    "r_string_index_of(" (e 1) " , " (e 2) ")"
(create_polyfill
"
int r_string_index_of( std::string str, std::string key )  { 
    auto n = str.find( key );
    if (n == std::string::npos) {
        return -1;
    }   
    return n;
}
" )                   
                    
                )
            }        
        }

        ; array function derived from scala

        indexOf    cmdIndexOf:int      ( array:[T] element:T ) { 
            templates {
                ranger ( "(indexOf " (e 1) " " (e 2) ")")
                 cpp ( "r_arr_index_of<" (typeof 2) ">(" (e 1) ", " (e 2) ")" (imp "<vector>") (imp "<iterator>") (imp "<algorithm>")

(create_polyfill
"
template< typename T >
int r_arr_index_of( std::vector<T> vec, T elem )  { 
    auto it = std::find(vec.begin(),vec.end(),elem);
    if(it!=vec.end()) {
        return it - vec.begin();
    } 
    return -1;
}
" )                   
                 
                 )   
                 cpp ( "std::distance( std::find( " (e 1) ".begin(), " (e 1) ".end(), " (e 2) ") )" (imp "<vector>") (imp "<iterator>"))   
                 rust ( (e 1) ".iter().position( |&r| r == " (e 2) " ).unwrap()" )   
                 php ( "array_search(" (e 2) ", " (e 1) ", true)")
                 go ( "r_indexof_arr_" (rawtype 1)  "(" (e 1) ", " (e 2) ")"
(macro ("func r_indexof_arr_" (rawtype 1)  "( a []"  (ptr 1) (rawtype 1) ", item "  (ptr 1) (rawtype 1) " ) ( int64 ) { " nl I 
    "for i, v := range a {" nl I "if item == v { " nl I "return int64(i) " nl i " } " nl i " } " nl i
    "return -1" nl
"}" nl ))  

                 )
                 swift3( "r_index_of(arr:" (e 1) ", elem:" (e 2)")"
(macro ("
func r_index_of ( arr:" (typeof 1)  " , elem: " (typeof 2) ") -> Int { " nl I
    "if let idx = arr.index(of: elem) { " nl
    "    return idx " nl
    "} else { " nl
    I "    return -1 " nl i
    "}  " nl
    i
"}" nl ) )                
                 )
                 * ( (e 1) ".indexOf(" (e 2) ")" )                                              
            }
        }

        remove_index    cmdRemoveIndex:void  ( array:[T] index:int ) { 
            templates {
                ranger ( "(remove_index " (e 1) " " (e 2) ")")
                 cpp ( (e 1) ".erase( "(e 1)".begin() + " (e 2) " );")
                 swift3 ( (e 1) ".remove(at:" (e 2)")")
                 php ( "array_splice(" (e 1) ", " (e 2 )", 1);")
                 kotlin ( (e 1) ".removeAt(" (e 2) ")" ) 
                 java7 ( (e 1) ".remove(" (e 2) ")" )
                 scala ( (e 1) ".remove(" (e 2) ")" )
                 go ( (e 1) " = append(" (e 1) "[:" (e 2) "], " (e 1) "[" (e 2) "+1:]...)" )
                 * ( (e 1) ".splice(" (e 2) ", 1).pop();" )                                              
            }
        }

        ; https://github.com/golang/go/wiki/SliceTricks
        insert    cmdInsert@(moves@( 2 1 ) ):void  ( array@(mutates):[T] index:int item:T ) { 
            templates {
                 ranger ( nl "insert " (e 1) " " (e 2) " " (e 3) nl)
                 es6 ( (e 1) ".splice(" (e 2) ", 0, " (e 3) ");" )  
                 cpp ( (e 1) ".insert(" (e 1) ".begin() + " (e 2) ", " (e 3) ");")          
                 go( (e 1 ) " = append(" (e 1) "[:" (e 2) "], append(" (typeof 1) "{" (e 3) "}, " (e 1) "[" (e 2) ":]...)...)")   
                 php ( "array_splice(" (e 1) ", " (e 2) ", 0, " (e 3) ");")   

            }
        }      
        
        remove    cmdRemove@(moves@( 2 1 ) ):void  ( array@(mutates):[T] index:int ) { 
            templates {
                 ranger ( nl "remove " (e 1) " " (e 2) nl)
                 es6 ( (e 1) ".splice(" (e 2) ", 1);" )                                              
            }
        }         

        push    cmdPush@(moves@( 2 1 ) ):void  ( array@(mutates):[T] item:T ) { 
            templates {
                ranger ( nl "push " (e 1) " " (e 2) "" nl)
                 cpp ( (e 1) ".push_back( "(e 2)"  );")
                 swift3 ( (e 1) ".append(" (e 2)")")
                 php ( "array_push(" (e 1) ", " (e 2 )");")
                 java7 ( (e 1) ".add(" (e 2) ");" )
                 go ( (custom _) )
                 go ( (e 1) " = append("  (e 1) ","  (e 2) ");" )
                 kotlin ( (e 1) ".add(" (e 2) ");" )
                 csharp ( (e 1) ".Add(" (e 2) ");" ) 
                 scala ( (e 1) ".append(" (e 2) ")" )
                 * ( (e 1) ".push(" (e 2) ");" )                                              
            }
        }

        ; think: how to release the strong array
        removeLast  cmdRemoveLast:void  ( array@(mutates):[T] ) { 
            templates {
                ranger ( "removeLast " (e 1) "")
                 cpp ( (e 1) ".pop_back();")
                 swift3 ( (e 1) ".removeLast();")
                 php ( "array_pop(" (e 1) " );")
                 java7 ( (e 1) ".remove(" (e 1) ".size() - 1);" )
                 csharp ( "Array.Resize(ref "(e 1) ", " (e 1 )".Length - 1);" ) 
                 scala ( (e 1) ".remove(" (e 1) ".length - 1)" )
                 go ( (custom _) )
                 go ( (e 1) "= " (e 1)"[:len(" (e 1)") - 1]")
                 * ( (e 1) ".pop();" )                                              
            }
        }

        length    cmdArrayLength:int      ( array:[T] ) { 
            templates {
                ranger ( "(length " (e 1) ")")
                 cpp ( (e 1) ".size()" )                                                              
                 swift3 ( (e 1) ".count")
                 php ( "count(" (e 1) ")")
                 java7 ( (e 1) ".size()" )                                                              
                 scala ( (e 1) ".length" )
                 kotlin ( (e 1) ".size" )                                                              
                 * ( (e 1) ".length" )                                              
            }
        }

        length       cmdStrlen:int       ( text:string ) { 
            templates {
                ranger ( "(length " (e 1) ")")
                cpp ( (e 1) ".length()") 
                java7 ( (e 1) ".length()") 
                scala ( (e 1) ".length()")  
                swift3 ( (e 1) ".characters.count")  
                csharp ( (e 1) ".Length")
                rust ( (e 1 ) ".len()" )
                go( "int64(len([]rune(" (e 1) ")))")
                php ( "strlen(" (e 1) ")")               
                * ( (e 1) ".length")
            }
        }
        clear    _:void      ( array:[T] ) { 
            templates {
                 ranger ( "(clear " (e 1) ")")
                 cpp ( (e 1) ".clear();" )                                                              
                 swift3 ( (e 1) ".removeAll()")
                 php ( nl (e 1) " = array();" nl)
                 java7 ( (e 1) ".clear();" )                                                              
                 scala ( (e 1) ".clear()" )
                 go ( (e 1) " = nil" )                                                     
                 * ( (e 1) ".length = 0;" nl )                                              
            }
        }

        has    _:boolean      ( array:[T] ) { 
            templates {
                * @macro(true) ('( (array_length ' (e 1) ')  > 0 )')
            }
        }

        last_index    _:int      ( array:[T] ) { 
            templates {
                * @macro(true) ('(array_length ' (e 1) ') - 1')
            }
        }
        last    _:T      ( array:[T] ) { 
            templates {
                * @macro(true) ('(itemAt ' ( e 1 ) ' ( (array_length ' (e 1) ') - 1) )')
            }
        }
        ; first character of the string
        first    _:string      ( str:string ) { 
            templates {
                * @macro(true) ('(at ' (e 1) ' 0)')
            }
        }
        first    _:T      ( array:[T] ) { 
            templates {
                * @macro(true) ('(itemAt ' ( e 1 ) ' 0 )')
            }
        }
        size    _:int      ( array:[T] ) { 
            templates {
                * @macro(true) ('(array_length ' ( e 1 ) ' )')
            }
        }

        at    _:T      ( array:[T] index:int ) { 
            templates {
                * @macro(true) ('(itemAt ' ( e 1 ) ' (' (e 2) ') )')
            }
        }

        ; go sort.slice...
        sort _:[T] ( array:[T] cb:(_:int (left:T right:T))) {
            templates {
                es6 ( (e 1) ".slice().sort(" ( e 2) ")")
                go ( "(func(list " (typeof 1) ") " (typeof 1) " {" nl 
                    I "sort.Slice(" (e 1) ", func(i, j int) bool { " nl
                    I "sortfn := " (e 2) nl
                      "sortval := sortfn(" (e 1)"[i], " (e 1)"[j])" nl
                      "return (sortval < 0)" nl i
                      "})" nl
                      "return list" nl 
                    i "}(" (e 1) "))"
                    (imp "sort"))
            }            
        }

        reverse _:[T] (array:[T]) {
            templates {
                ranger ( '(reverse (' (e 1) '))')
                es6 ( (e 1) ".slice().reverse()")
            }            
        }

        array_length    cmdArrayLength:int      ( array:[T] ) { 
            templates {
                ranger ( "(array_length " (e 1) ")")
                 cpp ( '(int)(' (e 1) ".size())" )                                                              
                 swift3 ( (e 1) ".count")
                 php ( "count(" (e 1) ")")
                 java7 ( (e 1) ".size()" )                                                              
                 scala ( (e 1) ".length" )
                 rust ( (e 1 ) ".len()" )
                 go ( "int64(len(" (e 1 ) "))" )
                 kotlin ( (e 1) ".size" )       
                 csharp ( (e 1) ".Count")                                                       
                 * ( (e 1) ".length" )                                              
            }
        }

; vec.erase(vec.begin() + index);
        array_extract    cmdArrayExtract@(strong):T      ( array@(mutates):[T] position:int ) { 
            templates {
                ranger ( "(array_extract " (e 1) " " (e 2) ")")
                 ; TODO: C++ version does not seem to have a clear functino to extrace element from std::vector
                 swift3 ( (e 1) ".remove(at:" (e 2)")")
                 php ( "array_splice(" (e 1) ", " (e 2 )", 1)[0]")
                 go ( "r_m_arr_" (rawtype 1) "_extract(" (e 1) ", " (e 2 )")"

(macro ("func r_m_arr_" (rawtype 1)  "_extract( a "  (typeof 1) ", i int64 ) (" (arraytype 1)  ", " (typeof 1) " ) { " nl I 
    "item := a[i]" nl "res := append(a[:i], a[(i+1):]...)" nl "return item, res " nl i "
}" nl ))                  
                 
                 )

                 cpp ( "r_m_arr_extract<" (typeof 1) ">(" (e 1) ", " (e 2 )")"

(create_polyfill
"template< typename T >
auto r_m_arr_extract( T & a, int i )  { 
    auto elem = a.at(i); 
    a.erase(a.begin() + i);
    return elem;
}" )                  
                 
                 )                 
                 kotlin ( (e 1) ".removeAt(" (e 2) ")" ) 
                 java7 ( "_arr_extract(" (e 1) ", " (e 2) ")" 
(create_polyfill
"
public <T> T _arr_extract( ArrayList<T> list, Integer i )  { 
    T elem = list.get(i); 
    list.remove(i);
    return elem;
}" )                  
                 
                 )
                 scala ( (e 1) ".remove(" (e 2) ")" )
                 * ( (e 1) ".splice(" (e 2) ", 1).pop()" )                                              
            }
        }


        
        print           cmdPrint:void           ( text:string) { 
            templates {
                 ranger ( nl "print " (e 1) nl)
                 cpp (ln "std::cout << " (e 1) " << std::endl;" nl (imp "<iostream>") (imp "<string>"))
                 kotlin ( nl "println( " (e 1) " )" nl )                                              
                 scala ( "println( " (e 1) " )" ) 
                 go ( nl "fmt.Println( " (e 1) " )" nl (imp "fmt")             ) 
                 rust ( nl "println!( \"{}\", " (e 1) " );" nl )                              
                 java7 ( nl "System.out.println(String.valueOf( " (e 1) " ) );" nl (imp "java.io.*"))                              
                 php ( nl "echo( " (e 1) " . \"\\n\");" nl )               
                 csharp ( nl "Console.WriteLine(" (e 1) ");" nl (imp "System"))
                 swift3 ( nl "print(" (e 1) ")" nl)
                 * ( nl "console.log(" (e 1) ");" nl)                                                                
            }
        }

        to_lowercase _:string (s:string) {
            templates {
                es6 ((e 1) '.toLowerCase()')
            }
        }
        to_uppercase _:string (s:string) {
            templates {
                swift3 ( (e 1) ".uppercased()")
                scala ( (e 1 ) ".toUpperCase()" )
                ranger ("(to_uppercase " (e 1) ")")
                es6 ( (e 1) ".toUpperCase()")
                java7 ( (e 1) ".toUpperCase()")
                php( "strtoupper(" (e 1) ")")
                csharp ( (e 1) ".ToUpper()" )
                cpp (                     
                    "r_cpp_str_to_uppercase(" (e 1) ")"
                        (imp "<algorithm>")
                        (imp "<string>")
(create_polyfill "
std::string r_cpp_str_to_uppercase(std::string original) 
{
    std::string str = original;
    std::transform(str.begin(), str.end(),str.begin(), ::toupper);  
    return str;
}    
    ") 

                    )
                go ( "strings.ToUpper(" (e 1) ")" (imp "strings"))
            }
        }

        ; ----------------------------------------------------------------------------------------------------------
        ; conversions


        to_double       toDouble:double ( input:int ) {
            templates {
                ranger ("( to_double " (e 1) " )")
                go ("float64( " (e 1) " )")
                es6 ( (e 1) )
                swift3 ("Double(" (e 1) ")")
                scala ( (e 1) '.toDouble')
                java7 ("Double.valueOf(" (e 1) ")")
                cpp ("(double)(" (e 1) ")")
                php ( (e 1) )
            }
        }

        to_int _:int (value:string) {
            templates {
                php ("intvalue(" (e 1)")")
            }
        }

        ; ----------------------------------------------------------------------------------------------------------

        ==              cmdEqual:boolean ( left:string right:string ) { 
            templates { 
                java7 ( (e 1) ".equals(" (e 2) ")" ) 
                * ( (e 1) " == " (e 2) ) 
            } 
        }

        ==              cmdEqual:boolean ( left:T right:T ) { templates { * ( (e 1) " == " (e 2) ) } }
        ==              cmdEqual:boolean ( left:enum right:enum ) { templates { * ( (e 1) " == " (e 2) ) } }

        ==              cmdEqual:boolean ( left:int right:char ) { 
                templates { 
                    go ( (e 1) " == int64(" (e 2) ")" ) 
                    * ( (e 1) " == " (e 2) ) 
                } 
        }
        ==              cmdEqual:boolean ( left:char right:int ) { 
                templates { 
                    go ( "int64(" (e 1) ") == " (e 2) ) 
                    * ( (e 1) " == " (e 2) ) 
                } 
        }

        ==              cmdEqual:boolean ( left:int right:int ) { templates { * ( (e 1) " == " (e 2) ) } }
        ==              cmdEqual:boolean ( left:double right:double ) { templates { * ( (e 1) " == " (e 2) ) } }
        ==              cmdEqual:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " == " (e 2) ) } }
        
        
        >               cmdGt:boolean ( left:double right:double ) { templates { * ( (e 1) " > " (e 2) ) } }
        >               cmdGt:boolean ( left:int right:int ) { templates { * ( (e 1) " > " (e 2) ) } }

        ; ----------------------------------------------------------------------------------------------------------
        ; TODO: expression to cast the types comparing to character

        <=               cmdLte:boolean ( left:char right:int ) { 
            templates {
                go ( "int64(" (e 1) ") <= " (e 2) "")                 
                * ( (e 1) " <= " (e 2) ) 
            } 
        }
        <=               cmdLte:boolean ( left:int right:char ) { 
            templates { 
                go ( (e 1) " <= int64(" (e 2) ")")
                * ( (e 1) " <= " (e 2) ) 
            } 
        }
        <=               cmdLte:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " <= " (e 2) ) } 
        }

        <               cmdLt:boolean ( left:int right:char ) { 
            templates {
                go ( (e 1) " < int64(" (e 2) ")")
                * ( (e 1) " < " (e 2) ) 
                } 
        }

        <               cmdLt:boolean ( left:char right:int ) { 
            templates {
                go ( "int64(" (e 1) ") < " (e 2) ) 
                * ( (e 1) " < " (e 2) ) 
            } 
        }

        <               cmdLt:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " < " (e 2) ) } 
        }

        ==               cmdEq:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " == " (e 2) ) } 
        }

        ==               cmdEq:boolean ( left:char right:int ) { 
            templates { * ( (e 1) " == " (e 2) ) } 
        }

        ==               cmdEq:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " == " (e 2) ) } 
        }

        !=               cmdNeq:boolean ( left:string right:string ) { 
            templates { 
                java7 ( "!" (e 1) ".equals(" (e 2) ")") 
                * ( (e 1) " != " (e 2) ) 
            } 
        }        

        !=               cmdNeq:boolean ( left:int right:char ) { 
            templates { 
                go ( (e 1) " != int64(" (e 2) ")" ) 
                * ( (e 1) " != " (e 2) ) 
            } 
        }

        !=               cmdNeq:boolean ( left:char right:int ) { 
            templates { 
                go ( "int64(" (e 1) ") != " (e 2) ) 
                * ( (e 1) " != " (e 2) ) 
            } 
        }

        !=               cmdNeq:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " != " (e 2) ) } 
        }


        !=               cmdNeq:boolean ( left:T right:T ) { 
            templates { * ( (e 1) " != " (e 2) ) } 
        }
        
        >=               cmdGte:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " >= " (e 2) ) } 
        }
        >=               cmdGte:boolean ( left:char right:int ) { 
            templates { 
                go ( "int64(" (e 1) ") >= " (e 2) ) 
                * ( (e 1) " >= " (e 2) ) 
            } 
        }
        >=               cmdGte:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " >= " (e 2) ) } 
        }
        
        >               cmdGt:boolean ( left:int right:char ) { 
            templates { 
                go ( (e 1) " > int64(" (e 2) ")" )
                * ( (e 1) " > " (e 2) ) } 
        }
        >               cmdGt:boolean ( left:char right:int ) { 
            templates { 
                go ( "int64(" (e 1) ") > " (e 2) )                
                * ( (e 1) " > " (e 2) ) } 
        }
        >               cmdGt:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " > " (e 2) ) } 
        }

        ;------------------------------------------------------------------------------------------------------------

        <               cmdLt:boolean ( left:int right:int ) { templates { * ( (e 1) " < " (e 2) ) } }
        <               cmdLt:boolean ( left:double right:double ) { templates { * ( (e 1) " < " (e 2) ) } }

        <=              cmdLte:boolean ( left:int right:int ) { templates { * ( (e 1) " <= " (e 2) ) } }
        <=              cmdLte:boolean ( left:double right:double ) { templates { * ( (e 1) " <= " (e 2) ) } }

        >=              cmdGte:boolean ( left:int right:int ) { templates { * ( (e 1) " >= " (e 2) ) } }
        >=              cmdGte:boolean ( left:double right:double ) { templates { * ( (e 1) " >= " (e 2) ) } }

        ; optional testing
        &&              cmdLogicAnd:boolean ( left@(optional):T right@(optional):S ) { 
            templates { 
                ranger ( "(" (e 1) " && " (e 2) ")" ) 
                scala ( (e 1) ".isDefined  && " (e 2) ".isDefined") 
                csharp ( (e 1) ".HasValue  && " (e 2) ".HasValue") 

                php ( "isset("(e 1) ") && isset(" (e 2) ")") 
                java7 ( (e 1) ".isPresent()  && " (e 2) ".isPresent()") 
                rust ( (e 1) ".is_some()  && " (e 2) ".is_some()") 
                swift3 ( (e 1) " != nil  && " (e 2) " != nil") 
                go ( "" (e 1) ".has_value  && " "" (e 2) ".has_value")
                cpp ( "" (e 1) "!= NULL  && " "" (e 2) " != NULL") 
                kotlin ( (e 1) " != null  && " (e 2) " != null") 

                * ( "typeof(" ( e 1 ) ") != \"undefined\" && typeof(" ( e 2 ) ") != \"undefined\"" ) 
            } 
        }
        &&              cmdLogicAnd:boolean ( left:boolean right@(optional):S ) { 
            templates {
                ranger ( "(" (e 1) " && " (e 2) ")" ) 
                php ( (e 1) " && isset(" (e 2) ")") 
                scala ( (e 1) " && " (e 2) ".isDefined") 
                java7 ( (e 1) " && " (e 2) ".isPresent()") 
                csharp ( (e 1) " && " (e 2) "HasValue") 

                rust ( (e 1) " && " (e 2) ".is_some()") 
                swift3 ( (e 1) " && " (e 2) " != nil") 
                go ( (e 1) " && " "" (e 2) ".has_value") 
                cpp ( (e 1) " && " "" (e 2) "!= NULL ") 
                kotlin ( (e 1) " && " (e 2) " != null") 
                cpp (e 1) " && " (e 2) 
                * ( (e 1) " && " "typeof(" ( e 2 ) ") != \"undefined\"") 
            } 
        }
        &&              cmdLogicAnd:boolean ( left@(optional):T right:boolean ) { 
            templates { 
                ranger ( "(" (e 1) " && " (e 2) ")" ) 
                php ( "isset("(e 1) ") && " (e 2) ) 
                scala ( ""(e 1) ".isDefined && " (e 2) ) 
                java7 ( ""(e 1) ".isPresent() && " (e 2) ) 
                csharp ( ""(e 1) ".HasValue && " (e 2) ) 

                rust ( ""(e 1) ".is_some() && " (e 2) ) 
                swift3 ( ""(e 1) " != nil && " (e 2) ) 
                go ( "" (e 1) ".has_value && " (e 2) ) 
                cpp ( "" (e 1) " != NULL && " (e 2) ) 
                kotlin ( ""(e 1) " != null && " (e 2) ) 
                cpp (e 1) " && " (e 2) 
                * ( "typeof(" ( e 1 ) ") != \"undefined\"" " && " (e 2) ) 
            } 
        }



        &&              cmdLogicAnd:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " && " (e 2) ) } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean) { templates { * ( (e 1) " && " (e 2) " && " (e 3) )  } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) )  } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) " && " (e 5) ) } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean p6:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) " && " (e 5) " && " (e 6) ) } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean p6:boolean p7:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) " && " (e 5) " && " (e 6) " && " (e 7) ) } }

        ||              cmdLogicOr:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " || " (e 2) ) } }
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean  ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) ) } }
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean     ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) " || " (e 4) )  } }
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean    ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) " || " (e 4) " || " (e 5) ) } }        
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean p6:boolean    ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) " || " (e 4) " || " (e 5) " || " (e 6) ) } }


    }



}
