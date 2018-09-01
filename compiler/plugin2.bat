rem call ranger-compiler -compiler
call node bin\ng_Compiler.js test_plugin.clj -plugins="./simplePlugin.js" -plugins-only
rem call node bin\ng_Compiler.js ng_Compiler.clj -o="compiler.js" -plugins="./prettier.js"
rem node bin\ng_Compiler.js ng_Compiler.clj -o="compiler.js" -plugins="./prettier.js,./babel.js,./uglify.js"