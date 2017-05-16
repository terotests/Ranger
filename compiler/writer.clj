(
    (Import "CompilerGeneric.clj")

    ( CreateClass CodeFile
        (
            
            (def path_name:string "")
            (def name:string "")
            (def writer:CodeWriter)

            (def import_list:[string:string])
            (def import_names:[string])

            (def fileSystem:CodeFileSystem @weak(true))

            (Constructor (filePath:string fileName:string)
                (
                    (= name fileName)
                    (= path_name filePath)
                    (= writer (new CodeWriter ()))
                    
                    (call writer createTag ("imports"))                    
                    (= writer.ownerFile this)
                )
            )

            (PublicMethod addImport:void (import_name:string) (
                (if (has import_list import_name)
                    (

                    )
                    (
                        (set import_list name import_name)
                        (push import_names import_name)
                    )
                )
            ))  
            
            (PublicMethod testCreateWriter:CodeWriter @strong(true) () (
                (return (new CodeWriter ()))
            ))                     

            (PublicMethod getImports:[string] () (
                (return import_names)
            ))                     

            (PublicMethod getWriter:CodeWriter () (
                (return writer)
            ))                     

            (PublicMethod getCode:string () (
                (return (call writer getCode ()))
            ))            

        )
    )    

    ( CreateClass CodeFileSystem
        (

            (def files:[CodeFile])

            (PublicMethod getFile:CodeFile @weak(true) (path:string name:string) (

                (for files file:CodeFile idx
                    (
                        (if (&& (== file.path_name path) (== file.name name))
                            (
                                (return file)
                            )
                        )   
                    )
                )
                (def new_file:CodeFile (new CodeFile (path name)))
                (= new_file.fileSystem this)
                (push files new_file)
                (return new_file)
            ))

            (PublicMethod mkdir:void (path:string) (
                (def parts:[string] (strsplit path "/"))
                (def curr_path:string "")
                (for parts p:string i
                    (
                        (= curr_path (+ curr_path "/" p))
                        (if (dir_exists curr_path)
                            (

                            )
                            (
                                (dir_create curr_path)
                            )
                        )
                    )
                )
            ))


            (PublicMethod saveTo:void (path:string) (

                (for files file:CodeFile idx
                    (
                        (def file_path:string (+ path "/" file.path_name))
                        (mkdir file_path)
                        (print (+ "Writing to path " file_path))
                        (file_write file_path file.name (call file getCode ()) )
                    )
                )
            ))
            

            (PublicMethod printFilesList:void () (

                (for files file:CodeFile idx
                    (
                        (print (+ "----===== " (+ file.path_name "/" file.name) " ====----"))
                        
                        (print (call file getCode ()))
                    )
                )
            ))

                        

        )
    )

    ( CreateClass CodeSlice:void
        (
            (def code:string "")

            ; setting a weak reference to the writer so assigment does not actually
            ; break the ownership of the code slice and deleting codeslice does not free
            ; the writer
            (def writer:CodeWriter)

            (PublicMethod getCode:string () (

                (if (null? writer)
                    (return code)
                )
                (return (call writer getCode ()))
            ))            
        )
    )    

    ( CreateClass CodeWriter 
        (
            (def tagName:string "")
            (def codeStr:string "")
            (def currentLine:string "")      
            (def tabStr:string "  ")
            (def lineNumber:int 1)
            (def indentAmount:int 0)

            ; tag -> pointer to a slice       
            (def tags:[string:int])

            ; all the code slices which are written by the writer
            (def slices:[CodeSlice])
            (def current_slice:CodeSlice @weak(true))

            ; possibly the file where the writer belongs to
            (def ownerFile:CodeFile @weak(true))

            ; forks and their names...
            (def forks:[CodeWriter])

            (def tagOffset:int)
            (def parent:CodeWriter @weak(true)) ; necessary to prevent errors

            (def had_nl:boolean true)

            (Constructor ()
                (
                    (def new_slice:CodeSlice (new CodeSlice ()))
                    (= current_slice new_slice)
                    (push slices new_slice)
                )
            )

            ( PublicMethod addImport:void (name:string ) (

                (if (!null? ownerFile)
                    (
                        (call ownerFile addImport (name))
                    )
                    (
                        (if (!null? parent)
                            (call parent addImport (name))
                        )
                    )
                )
            ))

            ( PublicMethod indent:void (delta:int) (
                (= indentAmount (+ delta indentAmount))
                (if (< indentAmount 0)
                    (= indentAmount 0)
                )
            ))

            ( PublicMethod addIndent:void () (
                (def i:int 0)
                (if (== (strlen currentLine ) 0)
                    (while (< i indentAmount)
                        (
                            (= currentLine (+ currentLine tabStr))
                            (= i (+ i 1))
                        )
                    )
                )
            ))

            ( PublicMethod createTag:CodeWriter (name:string) (

                (def new_writer:CodeWriter (new CodeWriter ()))
                (def new_slice:CodeSlice (new CodeSlice ()))

                (set tags name (array_length slices))
                (push slices new_slice)
                (= new_slice.writer new_writer)
                (= new_writer.indentAmount indentAmount)

                (def new_active_slice:CodeSlice (new CodeSlice ()))
                (push slices new_active_slice)    
                
                (= current_slice new_active_slice)            
                (= new_writer.parent this)

                (return new_writer)
            ))
            
            ( PublicMethod getTag:CodeWriter (name:string) (

                (if (has tags name)
                    (
                        (def idx:int (get tags name ))
                        (def slice:CodeSlice (itemAt slices idx))
                        
                        (return slice.writer)
                    )
                    (
                        (if (!null? parent)
                            (return (call parent getTag (name)))
                        )
                    )
                )
                (return this)
            ))

            ( PublicMethod hasTag:boolean (name:string) (

                (if (has tags name)
                    (
                        (return true)
                    )
                    (
                        (if (!null? parent)
                            (return (call parent hasTag (name)))
                        )
                    )
                )
                (return false)
            ))



            ( PublicMethod fork:CodeWriter () (

                (def new_writer:CodeWriter (new CodeWriter ()))
                (def new_slice:CodeSlice (new CodeSlice ()))
                (push slices new_slice)
                (= new_slice.writer new_writer)
                (= new_writer.indentAmount indentAmount)
                (= new_writer.parent this)

                (def new_active_slice:CodeSlice (new CodeSlice ()))
                (push slices new_active_slice)    
                (= current_slice new_active_slice)            

                (return new_writer)
            ))

            ( PublicMethod newline:void () (
                (doc "Inserts newline if necessary")
                (if ( > (strlen currentLine) 0)
                    (
                        (call this out ("" true))
                    )
                )
            ))
            

            ( PublicMethod writeSlice:void (str:string newLine:boolean) (
                    (addIndent ())
                    (= currentLine (+ currentLine str))
                    (if newLine
                        (
                            (= current_slice.code (+ current_slice.code currentLine "\n" ))
                            (= currentLine "")
                        )
                    )
            ))

            (doc
            "out function accepts string and newline parameter"
            )

            ( PublicMethod out:void (str:string newLine:boolean) (
                (def lines:[string] (strsplit str "\n" ))
                (def rowCnt:int (array_length lines))
                (if (== rowCnt 1)
                    (
                        (writeSlice str newLine)
                    )
                    (
                        ; if more than 1 line to be written
                        (for lines row idx
                            (
                                (addIndent ())
                                (if (< idx (- rowCnt 1))
                                    (
                                        (writeSlice (trim row) true)
                                        ;(= currentLine (+ currentLine row))
                                        ;(= codeStr (+ codeStr currentLine "\n" ))
                                        ;(= currentLine "")
                                    )
                                    (
                                        (writeSlice row newLine)
                                        ;(= currentLine (+ currentLine row))
                                        ;(if newLine
                                        ;    (
                                        ;        (= codeStr (+ codeStr currentLine "\n" ))
                                        ;        (= currentLine "")
                                        ;    )
                                        ;)                                        
                                    )
                                )
                            )
                        )
                    )
                )
            ))
            

            ( PublicMethod getCode:string () (
                (def res:string "")
                (for slices slice:CodeSlice idx
                    (
                        (= res (+ res (call slice getCode ())))
                    )
                )
                (= res (+ res currentLine))
                (return res)
            ))


        )
    )


    ( CreateClass CodeWriterTester
        (
            (PublicMethod test1:void () (

                ; json reader
                ; xml reader
                ; lisp reader
                ; --> EVG reader, EQL reader etc.

                
                ; possibly:
                ; (file_write path name)
                ; 

                ; example of how to create a file with some defined imports

                (def fs:CodeFileSystem (new CodeFileSystem ()))
                (def testFile:CodeFile (call fs getFile ("root" "test.java")))
                (def wr:CodeWriter (call testFile getWriter ()))

                (call wr addImport ("java.utils.*"))
                
                (call wr out ("
                
// this is a sample output from LISP code

class mySampleClass {

}                               
                " true))

                (call testFile addImport ("java.io.*"))

                ; then printing the imports(
                (def iWriter:CodeWriter (call wr getTag ("imports")))
                (def i_list:[string] (call testFile getImports ()))

                (for i_list str:string idx:int 
                    (
                        (call iWriter out ((+ "import " str ";") true))
                    )
                )
                (call fs printFilesList ())

            ))  

        )
    )        
    

)