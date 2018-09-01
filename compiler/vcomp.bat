call ranger-compiler -compiler
call node bin\ng_Compiler.js VirtualCompiler.clj
copy bin\VirtualCompiler.js ..\..\Ranger\fiddle\
copy compileEnv.js ..\..\Ranger\fiddle\