import java.util.*;
import java.util.Optional;
import java.io.File;
import java.io.*;
import java.io.PrintWriter;

class CodeFileSystem { 
  
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
      
  
  static void writeFile(String path, String text) 
  {
      try{
          PrintWriter out = new PrintWriter( path);
          out.print( text );
          out.close();
      } catch ( FileNotFoundException e) {
  
      }
  }    
      
  public ArrayList<CodeFile> files = new ArrayList<CodeFile>();
  
  public CodeFile getFile( String path , String name ) {
    for ( int idx = 0; idx < files.size(); idx++) {
      CodeFile file = files.get(idx);
      if ( (file.path_name.equals(path)) && (file.name.equals(name)) ) {
        return file;
      }
    }
    final CodeFile new_file = new CodeFile(path, name);
    new_file.fileSystem = Optional.of(this);
    files.add(new_file);
    return new_file;
  }
  
  public void mkdir( String path ) {
    final ArrayList<String> parts = new ArrayList<String>(Arrays.asList(path.split("/")));
    String curr_path = "";
    for ( int i = 0; i < parts.size(); i++) {
      String p = parts.get(i);
      curr_path = (curr_path + "/") + p;
      if ( false == (new File(curr_path).exists()) ) {
        createDir(curr_path);
      }
    }
  }
  
  public void saveTo( String path ) {
    for ( int idx = 0; idx < files.size(); idx++) {
      CodeFile file = files.get(idx);
      final String file_path = (path + "/") + file.path_name;
      this.mkdir(file_path);
      System.out.println(String.valueOf( (("Writing to file " + file_path) + "/") + file.name ) );
      final String file_content = file.getCode();
      if ( (file_content.length()) > 0 ) {
        writeFile(file_path + "/" + file.name , file_content );
      }
    }
  }
}
