
Import "ng_Compiler.clj"

flag npm (
  name "ranger-file"
  version "0.0.3"
  description "Plain file output plugin for Ranger Compiler"
  author "Tero Tolonen"
  license "MIT"
)

plugin.file 'README.md' "

# Plaintext plugin for Ranger Compiler

Creates slides for http://lab.hakim.se/reveal-js/#/

## Usage

Install ranger compiler

`npm install -g ranger-compiler`

Install this package 

`npm install ranger-file`

Create a file with slides, for example `test.txt`

```
plugin.file 'README.md' '
# Hello World
'

```

And then run the compiler with command:

`ranger-compiler -plugins=ranger-file test.txt`

The results will be saved in `bin/README.md`

"

class Plugin {

    fn features:[string] () {
        return ([]  "postprocess")
    }
    fn postprocess (item:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        try {
            def nodes (ctx.getPluginNodes("file"))
            nodes.forEach({
                def fileName (item.getSecond())
                def fileContents (item.getThird())

                if( fileName.value_type == RangerNodeType.String && 
                    fileContents.value_type == RangerNodeType.String ) {
                    def pageWriter (wr.getFileWriter("." (fileName.string_value )))
                    pageWriter.raw(fileContents.string_value false)                        
                } {
                    ctx.addError(item 'Filename and contents must be strings' )
                }
            })            
        } {
            print (error_msg)
        }
    }
}