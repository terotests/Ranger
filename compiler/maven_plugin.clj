
Import "ng_Compiler.clj"

; NOTE:
; https://stackoverflow.com/questions/4687609/maven-not-setting-classpath-for-dependencies-properly

flag npm (
  name "ranger-maven"
  version "0.0.6"
  description "Maven plugin for Ranger Compiler"
  author "Tero Tolonen"
  license "MIT"
)

plugin.markdown 'README.md' {
    h3 'Maven plugin'
    p "Creates the pom.xml file into the target directory"
    p Example
    code '
ranger-compiler -plugins="ranger-maven" -l=java7
    '
}

class Plugin {

    def app_name ""
    def group_id ""

    fn features:[string] () {
        return ([]  "postprocess")
    }

    fn mavenHeader (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        def version ((ctx.getCompilerSetting('version')) || '0.0.1')
        def full_name ((ctx.getCompilerSetting('fullname')) || app_name )

        wr.raw(`
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>` + group_id + `</groupId>
  <artifactId>` + app_name + `</artifactId>
  <version>` + version + `</version>
  <packaging>jar</packaging>
  <name>` + full_name + `</name>
  <url>http://maven.apache.org</url>
  <properties>
    <maven.compiler.source>1.7</maven.compiler.source>
    <maven.compiler.target>1.7</maven.compiler.target>
  </properties>  

        ` , false)
    }

    fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      try {
        def nodes (ctx.getPluginNodes("maven"))

        ; what is the main class file ? 
        def mainClass (ctx.getCompilerSetting('mainclass'))
        if( (has mainClass) == false ) {
          return
        }

        def version ((ctx.getCompilerSetting('version')) || '0.0.1')

        ; transform all the files 
        app_name = ((ctx.getCompilerSetting('name')) || mainClass || 'helloworld' )
        group_id = ( ((ctx.getCompilerSetting('domain')) || 'com.example') + "." + mainClass)
        def tDir ( app_name + '/src/main/java/' + ( join (strsplit group_id ".") "/" ) )

        def pWriter (wr.getFileWriter((app_name + '/') 'pom.xml'))                        

        def fs (wr.getFilesystem())
        fs.files.forEach({
          ; item.name --> name of the Java file
          if( (indexOf item.name '.java') > 0 ) {
            def code (item.getCode())
            def fWriter (wr.getFileWriter(tDir item.name))                        
            fWriter.raw(code false)
          }
        })

        this.mavenHeader( root ctx pWriter )

        def hasAdded:[string:boolean]
        
        pWriter.out('<dependencies>' true)
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
                      pWriter.out('<dependency><groupId>' + (get_str(1)) + '</groupId>' + 
                                            '<artifactId>' +  (get_str(2)) + '</artifactId>' +
                                            '<version>' + (get_str(3)) + '</version></dependency>' , true)
                    }
                  }
                } {

                }
            })
          }              
        })
        pWriter.newline()
        pWriter.out('</dependencies>' true)
        pWriter.raw('
<build>
  <plugins>
    <plugin>
      <artifactId>maven-assembly-plugin</artifactId>
      <configuration>
        <archive>
          <manifest>
            <mainClass>' + (group_id + "." + mainClass) + '</mainClass>
          </manifest>
        </archive>
        <descriptorRefs>
          <descriptorRef>jar-with-dependencies</descriptorRef>
        </descriptorRefs>
      </configuration>
    </plugin>
  </plugins>
</build>        
        ' , true)
        
        pWriter.out('</project>' true)            

        ; create a shell script which makes running even easier...
        def shellWr (wr.getFileWriter((app_name + '/') (mainClass + '.sh') ))
        shellWr.out('mvn clean compile assembly:single' true)
        shellWr.out(('java -cp target/'+ (app_name) + '-' + version + '-jar-with-dependencies.jar ' + mainClass ) true)                

        def target_dir ( (ctx.getCompilerSetting('d')) || 'bin')

        print "----------------------------------------------------------------------------------"
        print " Maven plugin run succesfully."
        print " To run and compile the project execute in the output directory"
        print ""
        print " " + target_dir + "/" + (app_name + '/') + (mainClass + '.sh') 
        print ""
        print "----------------------------------------------------------------------------------"                
        
      } {
          print (error_msg)
      }
    }
}