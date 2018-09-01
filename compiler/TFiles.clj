

class TFiles {

  static fn searchEnv:string ( env:InputEnv paths:[string] fileName:string) {
      for paths path:string i {
          if( file_exists env path fileName ) {
              return path 
          }
      }
      return ""
  }   

  static fn search:string (paths:[string] fileName:string) {
      for paths path:string i {
          if( file_exists path fileName ) {
              return path 
          }
      }
      return ""
  }   
    
}