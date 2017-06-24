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
    for ( int idx_2 = 0; idx_2 < files.size(); idx_2++) {
      CodeFile file_2 = files.get(idx_2);
      if ( (file_2.path_name.equals(path)) && (file_2.name.equals(name)) ) {
        return file_2;
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
    for ( int i_21 = 0; i_21 < parts.size(); i_21++) {
      String p = parts.get(i_21);
      curr_path = (curr_path + "/") + p;
      if ( false == (new File(curr_path).exists()) ) {
        createDir(curr_path);
      }
    }
  }
  
  public void saveTo( String path ) {
    for ( int idx_5 = 0; idx_5 < files.size(); idx_5++) {
      CodeFile file_5 = files.get(idx_5);
      final String file_path = (path + "/") + file_5.path_name;
      this.mkdir(file_path);
      System.out.println(String.valueOf( (("Writing to file " + file_path) + "/") + file_5.name ) );
      final String file_content = file_5.getCode();
      if ( (file_content.length()) > 0 ) {
        writeFile(file_path + "/" + file_5.name , file_content );
      }
    }
  }
}
