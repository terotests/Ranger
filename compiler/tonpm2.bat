rem call ranger-compiler -compiler

call node compiler.js -compiler -npm -d="bin/package" -nodecli -o=index.js -copysrc
copy bin\package\*.* ..\..\..\tools\ranger-compiler
copy Lang.clj ..\..\..\tools\ranger-compiler

call node compiler.js -compiler -npm -nodemodule -d="bin/lib" -o=index.js 
copy bin\lib\*.* ..\..\..\tools\ranger-lib

copy README.md ..\..\..\tools\ranger-compiler


