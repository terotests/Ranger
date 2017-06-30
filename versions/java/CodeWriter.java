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
    final Optional<CodeFileSystem> fs_2 = ownerFile.get().fileSystem;
    final CodeFile file_4 = fs_2.get().getFile(path, fileName);
    final Optional<CodeWriter> wr_3 = file_4.getWriter();
    return wr_3.get();
  }
  
  public ArrayList<String> getImports() {
    CodeWriter p_2 = this;
    while ((!p_2.ownerFile.isPresent()) && (p_2.parent.isPresent())) {
      p_2 = p_2.parent.get();
    }
    if ( p_2.ownerFile.isPresent() ) {
      final CodeFile f = p_2.ownerFile.get();
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
    int i_23 = 0;
    if ( 0 == (currentLine.length()) ) {
      while (i_23 < indentAmount) {
        currentLine = currentLine + tabStr;
        i_23 = i_23 + 1;
      }
    }
  }
  
  public CodeWriter createTag( String name ) {
    final CodeWriter new_writer = new CodeWriter();
    final CodeSlice new_slice_4 = new CodeSlice();
    tags.put(name, slices.size());
    slices.add(new_slice_4);
    new_slice_4.writer = Optional.of(new_writer);
    new_writer.indentAmount = indentAmount;
    final CodeSlice new_active_slice = new CodeSlice();
    slices.add(new_active_slice);
    current_slice = Optional.of(new_active_slice);
    new_writer.parent = Optional.of(this);
    return new_writer;
  }
  
  public CodeWriter getTag( String name ) {
    if ( tags.containsKey(name) ) {
      final int idx_4 = (Optional.ofNullable(tags.get(name))).get();
      final CodeSlice slice = slices.get(idx_4);
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
    final CodeWriter new_writer_4 = new CodeWriter();
    final CodeSlice new_slice_6 = new CodeSlice();
    slices.add(new_slice_6);
    new_slice_6.writer = Optional.of(new_writer_4);
    new_writer_4.indentAmount = indentAmount;
    new_writer_4.parent = Optional.of(this);
    final CodeSlice new_active_slice_4 = new CodeSlice();
    slices.add(new_active_slice_4);
    current_slice = Optional.of(new_active_slice_4);
    return new_writer_4;
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
      for ( int idx_7 = 0; idx_7 < lines.size(); idx_7++) {
        String row = lines.get(idx_7);
        this.addIndent();
        if ( idx_7 < (rowCnt - 1) ) {
          this.writeSlice(row.trim(), true);
        } else {
          this.writeSlice(row, newLine);
        }
      }
    }
  }
  
  public void raw( String str , boolean newLine ) {
    final ArrayList<String> lines_4 = new ArrayList<String>(Arrays.asList(str.split("\n")));
    final int rowCnt_4 = lines_4.size();
    if ( rowCnt_4 == 1 ) {
      this.writeSlice(str, newLine);
    } else {
      for ( int idx_9 = 0; idx_9 < lines_4.size(); idx_9++) {
        String row_4 = lines_4.get(idx_9);
        this.addIndent();
        if ( idx_9 < (rowCnt_4 - 1) ) {
          this.writeSlice(row_4, true);
        } else {
          this.writeSlice(row_4, newLine);
        }
      }
    }
  }
  
  public String getCode() {
    String res_3 = "";
    for ( int idx_11 = 0; idx_11 < slices.size(); idx_11++) {
      CodeSlice slice_4 = slices.get(idx_11);
      res_3 = res_3 + slice_4.getCode();
    }
    res_3 = res_3 + currentLine;
    return res_3;
  }
}
