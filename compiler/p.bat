call node bin\ng_Compiler.js ui_plugin.clj -npm -nodemodule -d="bin/plugin/materialui/" -plugins=ranger-file -o=index.js 
call node bin\ng_Compiler.js -plugins="./plugin/materialui/index.js" test_slides.clj
copy bin\material*.html ..\featuretests\webserver\reveal\
copy bin\test_slides.js ..\featuretests\webserver\reveal\