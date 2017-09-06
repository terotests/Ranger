class CodeFile {
    def path_name:string ""
    def name:string ""
    def writer@(optional):CodeWriter
    def import_list:[string:string]
    def import_names:[string]
    def fileSystem@(weak):CodeFileSystem

    Constructor (filePath:string fileName:string) {
        name = fileName
        path_name = filePath
        writer = (new CodeWriter())
        writer.createTag("imports")        
    }

    fn addImport:void (import_name:string) {
        if (false == (has import_list import_name)) {
            set import_list import_name import_name
            push import_names import_name
        }
    }

    fn testCreateWriter@(strong):CodeWriter () {
        return (new CodeWriter ())
    }

    fn getImports@(weak):[string] () {
        return import_names
    }

    fn getWriter@(weak optional):CodeWriter () {
        writer.ownerFile = this
        return writer
    }

    fn getCode:string () {
        return (writer.getCode())
    }

}

class CodeFileSystem {
    def files:[CodeFile]

    fn getFile@(weak):CodeFile (path:string name:string) {
        for files file:CodeFile idx {
            if ( (file.path_name == path) && (file.name == name) ) {
                return file
            }
        }
        def new_file:CodeFile (new CodeFile (path name))
        new_file.fileSystem = this
        push files new_file
        return new_file
    }

    fn mkdir:void (path:string) {
        def parts:[string] (strsplit path "/")
        def curr_path:string ""
        for parts p:string i {
            curr_path = curr_path + "/" + p
            if (false == (dir_exists curr_path)) {
                create_dir curr_path
            }
        }
    }

    fn saveTo:void (path:string) {
        for files file:CodeFile idx {
            def file_path:string (path + "/" + file.path_name)
            this.mkdir(file_path)
            print "Writing to file " + file_path + "/" + file.name
            def file_content:string (file.getCode())
            if ((strlen file_content) > 0) {
                write_file file_path (trim file.name) file_content
            }
        }
    }
}

class CodeSlice {

    def code:string ""
    def writer@(optional):CodeWriter 

    fn getCode:string () {
        if (null? writer) {
            return code
        }
        return (writer.getCode())
    }

}

class CodeWriter {
    def tagName:string ""
    def codeStr:string ""
    def currentLine:string ""
    def tabStr:string "  "
    def lineNumber:int 1
    def indentAmount:int 0

    def compiledTags:[string:boolean]
    def tags:[string:int]
    def slices:[CodeSlice]
    def current_slice@(weak optional):CodeSlice
    def ownerFile@(weak optional):CodeFile
    def forks:[CodeWriter]

    def tagOffset:int 0 
    def parent@(weak):CodeWriter

    def had_nl:boolean true
 
    Constructor() {
        def new_slice:CodeSlice (new CodeSlice ())
        push slices new_slice
        current_slice = new_slice
    }

    fn getFileWriter:CodeWriter (path:string fileName:string) {
        def fs:CodeFileSystem ownerFile.fileSystem
        def file:CodeFile (fs.getFile(path fileName))
        def wr@(optional):CodeWriter (file.getWriter())
        return (unwrap wr)
    }

    fn getImports@(weak):[string] () {

        def p:CodeWriter this
        while( (null? p.ownerFile) && (!null? p.parent)) {
            p = (unwrap p.parent)
        }

        if (!null? p.ownerFile) {
            def f:CodeFile (unwrap p.ownerFile)
            return f.import_names
        } 
        def nothing:[string]
        return nothing
    }

    fn addImport:void (name:string) {
        if (!null? ownerFile) {
            ownerFile.addImport(name)
        } {
            if (!null? parent) {
                parent.addImport(name)
            }
        }
    }

    fn indent:void (delta:int) {
        indentAmount = indentAmount + delta
        if(indentAmount < 0) {
            indentAmount = 0
        }
    }

    fn addIndent:void () {
        def i:int 0 
        if ( 0 == (strlen currentLine) ) {
            while (i < indentAmount) {
                currentLine = currentLine + tabStr
                i = i + 1
            }
        }
    }

    fn createTag@(weak):CodeWriter (name:string) {
        def new_writer:CodeWriter (new CodeWriter ())
        def new_slice:CodeSlice (new CodeSlice ())
        set tags name (array_length slices)
        push slices new_slice
        new_slice.writer = new_writer
        new_writer.indentAmount = indentAmount

        def new_active_slice:CodeSlice (new CodeSlice ())
        push slices new_active_slice

        current_slice = new_active_slice
        new_writer.parent = this

        return new_writer
    }

    fn getTag@(weak):CodeWriter (name:string) {
        if (has tags name) {
            def idx:int (unwrap (get tags name))
            def slice:CodeSlice (itemAt slices idx)
            return (unwrap slice.writer)
        } {
            if(!null? parent) {
                return (parent.getTag (name))
            }
        }
        return this
    }

    fn hasTag:boolean (name:string) {
        if (has tags name) {
            return true
        } {
            if (!null? parent) {
                return (parent.hasTag(name))
            }
        }
        return false
    }

    fn fork@(weak):CodeWriter () {
        def new_writer:CodeWriter (new CodeWriter ())
        def new_slice:CodeSlice (new CodeSlice ())
        push slices new_slice

        new_slice.writer = new_writer
        new_writer.indentAmount = indentAmount
        new_writer.parent = this

        def new_active_slice:CodeSlice (new CodeSlice ())
        push slices new_active_slice
        current_slice = new_active_slice

        return new_writer
    }

    fn newline:void () {
        if ( (strlen currentLine) > 0) {
            this.out("" true)
        }
    }

    fn writeSlice:void (str:string newLine:boolean) {
        this.addIndent()
        currentLine = currentLine + str
        if newLine {
            current_slice.code = current_slice.code + currentLine + "\n"
            currentLine = ""
        }
    }

    fn out:void (str:string newLine:boolean) {
        def lines:[string] (strsplit str "\n")
        def rowCnt:int (array_length lines)
        if (rowCnt == 1) {
            this.writeSlice(str newLine)
        } {
            for lines row:string idx {
                this.addIndent()
                if ( idx < (rowCnt - 1) ) {
                    this.writeSlice( (trim row) true)
                } {
                    this.writeSlice( row newLine )
                }
            }
        }   
    }

    fn raw:void (str:string newLine:boolean) {
        def lines:[string] (strsplit str "\n")
        def rowCnt:int (array_length lines)
        if (rowCnt == 1) {
            this.writeSlice(str newLine)
        } {
            for lines row:string idx {
                this.addIndent()
                if ( idx < (rowCnt - 1) ) {
                    this.writeSlice( row true)
                } {
                    this.writeSlice( row newLine )
                }
            }
        }   
    }

    fn getCode:string () {
        def res:string ""
        for slices slice:CodeSlice idx {
            res = res + (slice.getCode())
        }
        res = res + currentLine
        return res
    }

}