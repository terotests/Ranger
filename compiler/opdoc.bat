call ranger-compiler -compiler
call node bin\ng_Compiler.js -classdoc="classes.md" -operatordoc="OPS.md" ng_Compiler.clj
call node bin\ng_Compiler.js -operatordoc="operators.md" ng_Compiler.clj
copy bin\OPS.md \dev\static\trydocs\docs\README.md