rem call ranger-compiler -compiler


rem call node bin\ng_Compiler.js ng_Compiler.clj -o="compiler.js" -plugins="./prettier.js"
rem node bin\ng_Compiler.js ng_Compiler.clj -o="compiler.js" -plugins="./prettier.js,./babel.js,./uglify.js"
rem call node bin\ng_Compiler.js feature_tests.clj -plugins="./babel.js,./uglify.js"
rem type bin\mystyle.css

rem --> push code for the Ranger writer

call node bin\ng_Compiler.js simplePlugin.clj -nodemodule

rem calling plugin for CSS processing
call node bin\ng_Compiler.js test_plugin.clj -plugins="./simplePlugin.js" -css="mystyle.css" 
copy bin\index.html ..\featuretests\webserver\
copy bin\presentation.html ..\featuretests\webserver\reveal\
copy bin\static_presentation.html ..\featuretests\webserver\reveal\
copy bin\operators_slides.html ..\featuretests\webserver\reveal\
copy bin\static_operators_slides.html ..\featuretests\webserver\reveal\
