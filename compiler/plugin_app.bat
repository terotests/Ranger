
call node bin\ng_Compiler.js plugin_apps.clj -nodemodule
call node bin\ng_Compiler.js test_app_plugin.clj -plugins="./plugin_apps.js" -css="mystyle.css" 
