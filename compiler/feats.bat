call ranger-compiler -compiler
call node bin\ng_Compiler.js feature_tests.clj -o=test.scala -l=scala -scalafiddle
call node bin\ng_Compiler.js feature_tests.clj -o=test.go -l=go 
call node bin\ng_Compiler.js feature_tests.clj -o=test.php -l=php 
call node bin\ng_Compiler.js feature_tests.clj -o=test.js -l=es6
call node bin\ng_Compiler.js feature_tests.clj -o=test.java -l=java7

call node bin\ng_Compiler.js feature_tests.clj -npm -nodemodule -d="bin/feats" -o=index.js -classdoc="README.md" 
copy bin\feats\*.* ..\..\..\tools\feature-test
