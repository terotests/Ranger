ENV: /Users/terotolonen/proj/Ranger/gallery/pdf_writer/src/tools/;/Users/terotolonen/proj/Ranger/compiler/;/Users/terotolonen/proj/Ranger/lib/;
Using language file from : /Users/terotolonen/proj/Ranger/compiler
File to be compiled: gallery/pdf_writer/src/tools/jpeg_scaler.rgr
--> ready to compile
Livecompiler starting with language => es6
--- context inited ---
1. Collecting available methods.
2. Analyzing the code.
selected language is es6
3. Compiling the source code.
Saving results to path : /Users/terotolonen/proj/Ranger/gallery/pdf_writer/src/tools/bin
node:fs:2415
    return binding.writeFileUtf8(
                   ^

Error: ENOENT: no such file or directory, open '/Users/terotolonen/proj/Ranger/gallery/pdf_writer/src/tools/bin/./gallery/pdf_writer/src/tools/jpeg_scaler.js'
    at Object.writeFileSync (node:fs:2415:20)
    at CodeFileSystem.saveTo (/Users/terotolonen/proj/Ranger/compiler/index.js:4591:23)
    at __js_main (/Users/terotolonen/proj/Ranger/compiler/index.js:30211:20) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/terotolonen/proj/Ranger/gallery/pdf_writer/src/tools/bin/./gallery/pdf_writer/src/tools/jpeg_scaler.js'
}

Node.js v24.6.0
