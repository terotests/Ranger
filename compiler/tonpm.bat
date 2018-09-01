call ranger-compiler -compiler

del /F /Q bin\package\*.*
call node bin\ng_Compiler.js -compiler -npm -d="bin/package" -nodecli -o=index.ts -copysrc -operatordoc="operators.md"
call tsc bin\package\index.ts --target es5 --lib es2015
copy bin\package\*.* ..\..\..\tools\ranger-compiler
copy Lang.clj ..\..\..\tools\ranger-compiler

call node bin\ng_Compiler.js -compiler -npm -nodemodule -d="bin/lib" -o=index.js 
copy bin\lib\*.* ..\..\..\tools\ranger-lib

copy README.md ..\..\..\tools\ranger-compiler


