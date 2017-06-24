import java.util.Optional;
import java.util.*;

class CodeFile { 
  public String path_name = "";
  public String name = "";
  public Optional<CodeWriter> writer = Optional.empty();
  public HashMap<String,String> import_list = new HashMap<String,String>();
  public ArrayList<String> import_names = new ArrayList<String>();
  public Optional<CodeFileSystem> fileSystem = Optional.empty();
  
  CodeFile( String filePath , String fileName  ) {
    name = fileName;
    path_name = filePath;
    writer = Optional.of(new CodeWriter());
    writer.get().createTag("imports");
    writer.get().ownerFile = Optional.of(this);
  }
  
  public void addImport( String import_name ) {
    if ( false == (import_list.containsKey(import_name)) ) {
      import_list.put(import_name, import_name);
      import_names.add(import_name);
    }
  }
  
  public CodeWriter testCreateWriter() {
    return new CodeWriter();
  }
  
  public ArrayList<String> getImports() {
    return import_names;
  }
  
  public Optional<CodeWriter> getWriter() {
    return Optional.ofNullable((writer.isPresent() ? (CodeWriter)writer.get() : null ) );
  }
  
  public String getCode() {
    return writer.get().getCode();
  }
}
