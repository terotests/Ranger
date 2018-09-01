call ranger-compiler -compiler
call node bin\ng_Compiler.js makefile_plugin.clj -npm -nodemodule -d="bin/plugin/makefile/" -plugins=ranger-file -o=index.js  
call node bin\ng_Compiler.js -plugins="./plugin/makefile/index.js" test_pcmd2.clj -l=cpp
