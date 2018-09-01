call node bin\ng_Compiler.js reveal_plugin.clj -npm -nodemodule -d="bin/plugin/reveal/" -o=index.js 
copy bin\plugin\reveal\*.* ..\..\..\tools\ranger-reveal\

call node bin\ng_Compiler.js makefile_plugin.clj -npm -nodemodule -d="bin/plugin/makefile/" -plugins="ranger-markdown,ranger-file" -o=index.js 

call node bin\ng_Compiler.js maven_plugin.clj -npm -nodemodule -d="bin/plugin/maven/" -plugins="ranger-markdown,ranger-file" -o=index.js 
call node bin\ng_Compiler.js plaintext_plugin.clj -npm -nodemodule -d="bin/plugin/file/" -plugins=ranger-file -o=index.js 
call node bin\ng_Compiler.js commonmark_plugin.clj -npm -nodemodule -d="bin/plugin/markdown/" -plugins=ranger-file -o=index.js 

call node bin\ng_Compiler.js ui_plugin.clj -npm -nodemodule -d="bin/plugin/materialui/" -plugins=ranger-file -o=index.js 