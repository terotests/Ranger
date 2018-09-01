
; https://developer.android.com/guide/topics/data/data-storage.html#filesInternal


systemclass StorageOutputStream {
  java7 FileOutputStream   ( (imp 'java.io.FileOutputStream'))
}
systemclass StorageInputStream {
  java7 FileInputStream    ( (imp 'java.io.FileInputStream '))
}

operators {

  ; JavaScript localstorage functions using localforage
  localStorage _@(async):void (path:string value:string) {
      templates {
          es6 (`await (new Promise(resolve => { localforage.setItem(` (e 1) `, ` (e 2) `, resolve ) } ) )` )
      }
  }
  
  localStorage _@(optional async):string (path:string) {
      templates {
          es6 (`await (new Promise(resolve => { localforage.getItem(` (e 1) `, (err,value) => {
              if(err) resolve(null);
              resolve(value)
          }) } ))` )
      }
  }

  ; Android + UIContext functions
  file_exists _:boolean (ui:UIContext filename:string) {
    templates {
      java7 ( '__storageFileExist(' (e 1) '.getCtx(), ' (e 2) ')' (imp 'java.io.File')
(create_polyfill `
static boolean __storageFileExist(Context ctx, String fname){
    File file = ctx.getFileStreamPath(fname);
    return file.exists();
}
`)

      )
    }
  }

  open_private_output _:StorageOutputStream (ui:UIContext filename:string) {
    templates {
      java7 ( (e 1) '.getCtx().openFileOutput(' (e 2) ', Context.MODE_PRIVATE)')
    }
  }
  open_private_input _:StorageInputStream (ui:UIContext filename:string) {
    templates {
      java7 ( (e 1) '.getCtx().openFileInput(' (e 2) ')')
    }
  }
  read _:Bytes (stream:StorageInputStream) {
    templates {
      java7 ( '__readStream(' (e 1) ')' (imp 'java.io.BufferedInputStream') (imp 'java.io.FileNotFoundException')

(create_polyfill `
static byte[] __readStream(FileInputStream fis) {
  byte[] bytes = null;
  try {
      bytes = new byte[fis.available()];
      BufferedInputStream buf = new BufferedInputStream(fis);
      buf.read(bytes, 0, bytes.length);
      buf.close();
  } catch (FileNotFoundException e) {
      e.printStackTrace();
  } catch (IOException e) {
      e.printStackTrace();
  }
  return bytes;
}
`)

      )
    }
  }
  write _:void (stream:StorageOutputStream data:Bytes) {
    templates {
      java7 ( (e 1) '.write(' (e 2) ');')
    }
  }
  close _:void (stream:StorageOutputStream) {
    templates {
      java7 ( (e 1) '.close();')
    }
  }
}