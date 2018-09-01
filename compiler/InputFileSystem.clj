
Import "stdops.clj"
Import "CmdParams.clj"


class InputFSFolder @serialize(true) {
  def name ""
  def data ""
  def is_folder true
  def base64bin false
  def folders:[InputFSFolder]
  def files:[InputFSFile]

  fn forTree (cb:(_:void (item:InputFSFolder)) ) {
    cb(this)
    folders.forEach({
      item.forTree(cb)
    })
  }
}
class InputFSFile @serialize(true) {
  def name ""
  def data ""
  def is_folder false
  def base64bin false
}

; --> the running environment for the current setup... 
class InputEnv @serialize(true) {
  def use_real false
  def filesystem:InputFSFolder
  def envVars:[string:string]
  def commandLine:CmdParams

  fn setEnv (name:string value:string) {
    set envVars name value
  }
}

operator type:void all {
  fn env_var:string ( env:InputEnv name:string) {
    if(env.use_real) {
      if(has env.envVars name) {
        return (unwrap (get env.envVars name))
      }
      def ev (env_var name)
      if(!null? ev) {
        return (unwrap ev)
      }
      return ''
    }
    return (?? (get env.envVars name) '')
  }
  fn install_directory:string (env:InputEnv) {
    if(env.use_real) {
      return (install_directory)
    }
    return '/'
  }
  fn current_directory:string (env:InputEnv) {
    if(env.use_real) {
      return (current_directory)
    }
    return '/'
  }
  fn file_exists:boolean (env:InputEnv path:string name:string) {
    if(env.use_real) {
      return (file_exists path name)
    }
    def fo (find_file env path name)
    return (!null? fo)
  }

  fn find_file@(optional weak):InputFSFile (env:InputEnv path:string name:string) {
    def res@(optional):InputFSFile
    if( path == '/' ){
      def files (filter env.filesystem.files {
        return item.name == name
      })
      if( has files ) {
        res = (at files 0) 
      }
      return res
    }
    def parts (strsplit path '/')
    def fold (env.filesystem)
    def i 0
    while( ( (size parts) > i ) && (!null? fold) ) {
      def pathName (at parts i)
      if(has pathName) {
        def folder (filter fold.folders {
          return item.name == pathName
        })
        if( has folder ) {
          fold = (at folder 0)
        } {
          return res
        }
      }
      i = i + 1
    }
    if(!null? fold) {
      def files (filter fold.files {
        return item.name == name
      })
      if( has files ) {
        res = (at files 0)
      }
    }
    return res
  }

  fn write_file:void (env:InputEnv path:string name:string data:string) {
    if( env.use_real ) {
      write_file path name data
      return
    }
    print data
  }
  
  fn read_file@(optional):string (env:InputEnv path:string name:string) {
    if env.use_real {
      return (read_file path name)
    } 
    def resStr@(optional):string
    def f (find_file env path name)
    if(!null? f) {
      resStr = f.data
    }
    return resStr
  }
  fn create_file@(optional weak):InputFSFile (fs:InputFSFolder name:string) {

    def res@(weak):InputFSFile
    def files (fs.files.filter({
      return item.name == name
    }))
    def folders (fs.folders.filter({
      return item.name == name
    }))
    if(!( has folders) ) {
      if(has files) {
        res = (at files 0)
      } {
        def f (new InputFSFile)
        f.name = name
        push fs.files f
        res = f
      }
    }
    return res
  }
  fn create_folder@(optional weak):InputFSFolder (fs:InputFSFolder name:string) {
    def res@(weak):InputFSFolder
    def files (fs.files.filter({
      return item.name == name
    }))
    def folders (fs.folders.filter({
      return item.name == name
    }))
    if(!( has files) )  {
      if(has folders) {
        res = (at folders 0)
      } {
        def f (new InputFSFolder)
        f.name = name
        push fs.folders f
        res = f
      }
    }
    return res
  }
  fn create_file@(optional weak):InputFSFile (fs:InputFSFolder name:string data:string) {
    def f (create_file fs name)
    if(!null? f) {
      f.data = data
    }
    return f
  }
}


class test_input_filesystem {
  
  static fn main() {

    ; compile time pattern matching....

    defn CreateFolder (folder fname) (create_folder (unwrap folder) fname)
    defn CreateFolder (folder fname) (create_folder folder fname)
    defn CreateFolder (fname) (create_folder (unwrap env.filesystem) fname)
  
    defn CreateFile (folder name data) (create_file folder name data)
    defn CreateFile (folder name data) (create_file (unwrap folder) name data)
    defn CreateFile (name data) (create_file (unwrap env.filesystem) name data)

    print "--> started"
    def env (new InputEnv)
    env.filesystem = (new InputFSFolder)

    CreateFile 'README2.md' 'Data of readme round here...'

    create_file (unwrap env.filesystem) 'README.md' '# the readme file'
    set env.envVars 'RANGER_DIR' '/'

    def subF (CreateFolder 'lib' )
    def someFile (create_file (unwrap subF) 'stdlib.clj' 'Contents of the standard library')

    ; try to create some files...
    CreateFile subF 'JSON.clj' 'JSON file comes round here...'
    CreateFile subF 'DOMLib.clj' 'JSON file comes round here...'
    
    (CreateFile (CreateFolder subF 'etc' ) 'readme.txt' '...' )
    (CreateFile (CreateFolder subF 'etc' ) 'notes.txt' '...' )

    print (to_string (env.toDictionary()))

    def data (read_file env '/' 'README.md')
    if(!null? data) {
      print " -> data " + (unwrap data)
    }

    def data (read_file env '/lib/' 'stdlib.clj')
    if(!null? data) {
      print " -> data " + (unwrap data)
    }

    if( (file_exists env '/lib/' 'stdlib.clj')) {
      print "stdlib does exists"
    }
    if( (file_exists env '/lib/etc/' 'readme.txt')) {
      print "/lib/etc/readme.txt does exists"
    }

    defn fInfo (x) {
      def mF:InputFSFolder x
      print ' folder -> ' + ((mF).name) 
    }
    defn fInfo (x) {
      def mF:InputFSFile x
      print ' file -> ' + (mF.name) + " size : " + (strlen mF.data)
    }

    
    defn ShowThem (f) {
      def myFold f
      print "*******************************"
      print " DIR: " + (? (has myFold.name) myFold.name '/' )
      ForEach myFold.folders fInfo
      ForEach myFold.files fInfo
      ForEach (ConCat myFold.files myFold.folders) (# print '...')
    }

    defn ShowThem (f) {
      def myFile:InputFSFile f
      print " file " + myFile.name
    }

    env.filesystem.forTree({
      ShowThem item
    })

    ; NOTICE: the param...it is there two times...

    defn Tell (something) {
      def s something
      print something
      ret s
    }
    ; maybe have to walk the params first or not ? 
    Tell ( 'say: ' + ( Tell 'It is ok' ) )



  }
}