call ranger-compiler -compiler
call node bin\ng_Compiler.js maven_plugin.clj -npm -nodemodule -d="bin/plugin/maven/" -plugins=ranger-file -o=index.js  
call node bin\ng_Compiler.js -plugins="./plugin/maven/index.js" test_pcmd.clj -l=es6
call node bin\ng_Compiler.js -plugins="./plugin/maven/index.js" test_pcmd.clj -l=java7