import java.util.*;
import java.util.Optional;

class CodeWriter { 
  public String tagName = ""     /** note: unused */;
  public String codeStr = ""     /** note: unused */;
  public String currentLine = "";
  public String tabStr = "  ";
  public int lineNumber = 1     /** note: unused */;
  public int indentAmount = 0;
  public HashMap<String,Boolean> compiledTags = new HashMap<String,Boolean>();
  public HashMap<String,Integer> tags = new HashMap<String,Integer>();
  public ArrayList<CodeSlice> slices = new ArrayList<CodeSlice>();
  public Optional<CodeSlice> current_slice = Optional.empty();
  public Optional<CodeFile> ownerFile = Optional.empty();
  public ArrayList<CodeWriter> forks = new ArrayList<CodeWriter>()     /** note: unused */;
  public int tagOffset = 0     /** note: unused */;
  public Optional<CodeWriter> parent = Optional.empty();
  public boolean had_nl = true     /** note: unused */;
  
  CodeWriter( ) {
    final CodeSlice new_slice = new CodeSlice();
    slices.add(new_slice);
    current_slice = Optional.of(new_slice);
  }
  
  public CodeWriter getFileWriter( String path , String fileName ) {
    final Optional<CodeFileSystem> fs = ownerFile.get().fileSystem;
    final CodeFile file = fs.get().getFile(path, fileName);
    final Optional<CodeWriter> wr = file.getWriter();
    return wr.get();
  }
  
  public ArrayList<String> getImports() {
    CodeWriter p = this;
    while ((!p.ownerFile.isPresent()) && (p.parent.isPresent())) {
      p = p.parent.get();
    }
    if ( p.ownerFile.isPresent() ) {
      final CodeFile f = p.ownerFile.get();
      return f.import_names;
    }
    final ArrayList<String> nothing = new ArrayList<String>();
    return nothing;
  }
  
  public void addImport( String name ) {
    if ( ownerFile.isPresent() ) {
      ownerFile.get().addImport(name);
    } else {
      if ( parent.isPresent() ) {
        parent.get().addImport(name);
      }
    }
  }
  
  public void indent( int delta ) {
    indentAmount = indentAmount + delta;
    if ( indentAmount < 0 ) {
      indentAmount = 0;
    }
  }
  
  public void addIndent() {
    int i = 0;
    if ( 0 == (currentLine.length()) ) {
      while (i < indentAmount) {
        currentLine = currentLine + tabStr;
        i = i + 1;
      }
    }
  }
  
  public CodeWriter createTag( String name ) {
    final CodeWriter new_writer = new CodeWriter();
    final CodeSlice new_slice = new CodeSlice();
    tags.put(name, slices.size());
    slices.add(new_slice);
    new_slice.writer = Optional.of(new_writer);
    new_writer.indentAmount = indentAmount;
    final CodeSlice new_active_slice = new CodeSlice();
    slices.add(new_active_slice);
    current_slice = Optional.of(new_active_slice);
    new_writer.parent = Optional.of(this);
    return new_writer;
  }
  
  public CodeWriter getTag( String name ) {
    if ( tags.containsKey(name) ) {
      final int idx = (Optional.ofNullable(tags.get(name))).get();
      final CodeSlice slice = slices.get(idx);
      return slice.writer.get();
    } else {
      if ( parent.isPresent() ) {
        return parent.get().getTag(name);
      }
    }
    return this;
  }
  
  public boolean hasTag( String name ) {
    if ( tags.containsKey(name) ) {
      return true;
    } else {
      if ( parent.isPresent() ) {
        return parent.get().hasTag(name);
      }
    }
    return false;
  }
  
  public CodeWriter fork() {
    final CodeWriter new_writer = new CodeWriter();
    final CodeSlice new_slice = new CodeSlice();
    slices.add(new_slice);
    new_slice.writer = Optional.of(new_writer);
    new_writer.indentAmount = indentAmount;
    new_writer.parent = Optional.of(this);
    final CodeSlice new_active_slice = new CodeSlice();
    slices.add(new_active_slice);
    current_slice = Optional.of(new_active_slice);
    return new_writer;
  }
  
  public void newline() {
    if ( (currentLine.length()) > 0 ) {
      this.out("", true);
    }
  }
  
  public void writeSlice( String str , boolean newLine ) {
    this.addIndent();
    currentLine = currentLine + str;
    if ( newLine ) {
      current_slice.get().code = (current_slice.get().code + currentLine) + "\n";
      currentLine = "";
    }
  }
  
  public void out( String str , boolean newLine ) {
    final ArrayList<String> lines = new ArrayList<String>(Arrays.asList(str.split("\n")));
    final int rowCnt = lines.size();
    if ( rowCnt == 1 ) {
      this.writeSlice(str, newLine);
    } else {
      for ( int idx = 0; idx < lines.size(); idx++) {
        String row = lines.get(idx);
        this.addIndent();
        if ( idx < (rowCnt - 1) ) {
          this.writeSlice(row.trim(), true);
        } else {
          this.writeSlice(row, newLine);
        }
      }
    }
  }
  
  public void raw( String str , boolean newLine ) {
    final ArrayList<String> lines = new ArrayList<String>(Arrays.asList(str.split("\n")));
    final int rowCnt = lines.size();
    if ( rowCnt == 1 ) {
      this.writeSlice(str, newLine);
    } else {
      for ( int idx = 0; idx < lines.size(); idx++) {
        String row = lines.get(idx);
        this.addIndent();
        if ( idx < (rowCnt - 1) ) {
          this.writeSlice(row, true);
        } else {
          this.writeSlice(row, newLine);
        }
      }
    }
  }
  
  public String getCode() {
    String res = "";
    for ( int idx = 0; idx < slices.size(); idx++) {
      CodeSlice slice = slices.get(idx);
      res = res + slice.getCode();
    }
    res = res + currentLine;
    return res;
  }
}
