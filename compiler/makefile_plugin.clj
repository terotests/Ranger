
Import "ng_Compiler.clj"

; could download the necessary files using:
; wget -O README.md https://github.com/terotests/Ranger/blob/master/README.md?raw=true


flag npm (
  name "ranger-makefile"
  version "0.0.4"
  description "Makefile plugin for Ranger Compiler"
  author "Tero Tolonen"
  license "MIT"
)

plugin.markdown 'README.md' {
    h3 'Makefile plugin'
    p "Creates a makefile, currently for C++ target"
    p Example
    code '
ranger-compiler -plugins="ranger-makefile" -l=cpp myfile.clj
    '
}

class Plugin {

    def app_name ""
    def group_id ""

    fn features:[string] () {
        return ([]  "postprocess")
    }

    fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      try {
          
        def nodes (ctx.getPluginNodes("makefile"))
        ; what is the main class file ? 
        def mainClass (ctx.getCompilerSetting('mainclass'))
        if( (has mainClass) == false ) {
          return
        }

        def version ((ctx.getCompilerSetting('version')) || '0.0.1')

        ; transform all the files 
        app_name = ((ctx.getCompilerSetting('name')) || mainClass || 'helloworld' )
        group_id = ( ((ctx.getCompilerSetting('domain')) || 'com.example') + "." + mainClass)

        ; think: could also follow the Java conventions here..
        def tDir ( 'cpp/' + app_name + '/' ) )

        def fs (wr.getFilesystem())
        def mainFile ""
        fs.files.forEach({
          ; item.name --> name of the Java file
          if( (indexOf item.name '.cpp') > 0 ) {
            def code (item.getCode())
            def fWriter (wr.getFileWriter(tDir item.name))                   
            mainFile = item.name     
            fWriter.raw(code false)
          }
        })

        def pWriter (wr.getFileWriter(tDir 'Makefile'))                        
        pWriter.tabStr = "\t"
        pWriter.nlStr = "\n"

        ; downloading the dependencies...

        ; (plugin 'makefile' (dep))

        ; cpp ( '' (plugin 'makefile' (  (dep 'picosha2.h' 'wget...'  ) ) ) )

        def deps_list:[string]
        def hasAdded:[string:boolean]

        nodes.forEach({
          if( (size item.children) > 0 ) {
            item.children.forEach({
                try {
                  def itemHash (item.getCode())
                  if( has hasAdded itemHash) {
                    return
                  }
                  set hasAdded itemHash true

                  def fc (item.getFirst())
                  def get_str (fn:string (i:int) {
                    return ( (at item.children i).string_value)
                  })                  
                  switch fc.vref {
                    case 'dep' {
                      push deps_list (get_str(1))
                      pWriter.out( (get_str(1)) + ': ' , true)
                      pWriter.indent(1)
    ; wget -O README.md https://github.com/terotests/Ranger/blob/master/README.md?raw=true                 
                      pWriter.out('wget -O ' + (get_str(1)) + ' ' + (get_str(2)) + "?raw=true" , true)
                      pWriter.indent(-1)
                    }
                  }
                } {

                }
            })
          }
        })

;         push deps_list (mainClass + '.cpp') 
        pWriter.out('all: ' false)
        pWriter.out( (join deps_list ' ')  true)
        pWriter.indent(1)
        pWriter.out('g++ -std=c++14 ' + mainFile + ' -o ' + mainClass + ' -O3' , true)
        pWriter.indent(-1)

;        def shellWr (wr.getFileWriter((app_name + '/') (mainClass + '.sh') ))
;        shellWr.out('mvn clean compile assembly:single' true)
;        shellWr.out(('java -cp target/'+ (app_name) + '-' + version + '-jar-with-dependencies.jar ' + mainClass ) true)                

        def target_dir ( (ctx.getCompilerSetting('d')) || 'bin')

        print "----------------------------------------------------------------------------------"
        print " Makefile plugin run succesfully."
        print " Compile with 'make all' in output directory"
;        print ""
        print " " + target_dir + '/' + tDir   
        print ""
        print "----------------------------------------------------------------------------------"
                
        
      } {
          print (error_msg)
      }
    }
}