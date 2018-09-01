
systemclass  UIElement {
    es6          DOMElement
}

systemclass SystemDate {
    es6 Date
}

systemclass SystemUnixDate {
    es6 Number
}

operators {
    watch_has_file cmdFiles:boolean () {
        templates {
            es6  ( " typeof(_fileName) != 'undefined' " )
        }
    }
    ; statSync

    to_date _:SystemDate ( timevalue:int ) {
        templates {
            es6 ( "(new Date(" (e 1) "))" )
        }     
    }

    remove_file _:void (path:string name:string) {
        templates {
            ranger ('(remove_file ' (e 1)' ' (e 2) ' )')
            es6 ('(require("fs")).unlinkSync(' (e 1) ' + "/" + ' (e 2) ')')
        }
    }

    utc_to_string _:string ( sd:int ) {
        templates {
            es6 ( "(new Date(" (e 1) ")).toString()" )
        }     
    }

    file_created _:int ( path:string) {
        templates {
            es6 ( "(new Date((require('fs')).statSync(" (e 1) ").birthtime)).getTime()" ) 
        }     
    }

    file_modtime _:int ( path:string) {
        templates {
            es6 ( "(new Date((require('fs')).statSync(" (e 1) ").mtime)).getTime()" )
        }     
    }

    file_modtime_str _:int ( path:string) {
        templates {
            es6 ( "(new Date((require('fs')).statSync(" (e 1) ").mtime)).toString()" )
        }     
    }    

    watch_filename cmdFiles:string () {
        templates {
            es6 ( "_fileName" )
        }        
    }    
    watch_dir cmdFiles:void (path:string code:block) {
        templates {
            es6 ( "require('fs').watch(" (e 1) ", (_eventType, _fileName) => { " nl I (block 2) i nl " })" )
        }        
    }

    cs_list_dir_files cmdFiles:[string] (path:string) {
        templates {
            csharp( "new List<String>(Directory.GetFiles(" (e 1) "))" (imp "System") (imp "System.IO") (imp "System.Collections.Generic"))         
        }¨
    }   


    ; Path.GetFileName  
    list_dir_files cmdFiles:[string] (path:string) {
        templates {
            ranger ( '(list_dir_files (' (e 1) '))')
            go ( 'r_io_list_directory(' (e 1) ')'

(create_polyfill `

func r_io_list_directory( path string ) []string {
    res := make([]string, 0)
    files, err := ioutil.ReadDir("./")
    if err != nil {
        return res
    }
    for _, f := range files {
        res = append(res, f.Name())
    }
    return res
}

`)

            )
            csharp ("DirListReader.getFiles(" (e 1) ")"

(create_polyfill 
"
class DirListReader {
    public static List<String> getFiles( String path ) {
        string[] names = Directory.GetFiles(path);
        string[] basenames = new string[names.Length];
        for(int i=0; i<names.Length; i++) {
            basenames[i] = Path.GetFileName(names[i]);
        }
        return (new List<String>(basenames));
    }
}
"
) )
            es6 ( "require('fs').readdirSync(" (e 1) ")" )
            cpp ( "__cpp_list_directory_files(" (e 1) ")"
(create_polyfill
"

#ifdef _MSC_VER
    #include <windows.h>
#else
#endif

std::vector<std::string> __cpp_list_directory_files(std::string dirName) {
    WIN32_FIND_DATA data;
    std::vector<std::string> fileList;
    std::string query = (dirName + \"\\\\*\");
    HANDLE hFind = FindFirstFile(query.c_str(), &data);      // DIRECTORY

    if ( hFind != INVALID_HANDLE_VALUE ) {
        do {
            std::string name(data.cFileName);
            fileList.push_back( name );
        } while (FindNextFile(hFind, &data));
        FindClose(hFind);
    }   
    return fileList;
}
"


            )
        }        
    }
    is_directory cmdFiles:boolean (path:string) {
        templates {
            es6 ( "require('fs').statSync(" (e 1) ").isDirectory()" )
        }        
    }
    is_file cmdFiles:boolean (path:string) {
        templates {
            es6 ( "require('fs').statSync(" (e 1) ").isFile()" )
        }        
    }
}

class testFilesystem {
    fn test_case:void () {
        print "Directory testing ready"
        def list:[string] (list_dir_files ".")
        for list name:string i {
            if( ( indexOf name ".js" ) > 0 ) {
                print name
            }
        }
        ; watch interface...
        watch_dir "." {
            if( watch_has_file) {
                print "... something changed with " + (watch_filename)
            }
        }
    }
}