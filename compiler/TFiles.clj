

class TFiles {

  static fn search:string (paths:[string] fileName:string) {
      for paths path:string i {
          if( file_exists path fileName ) {
              return path 
          }
      }
      return ""
  }   
    
}