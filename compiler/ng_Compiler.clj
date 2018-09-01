; def opts ([] "name" "version" "description" "author" "license")

flag es6 (
  version "2.1.67"
)

flag npm (
  version "2.1.67"
  name "ranger-lib"
  description "Cross-language compiler and build tool"
  author "Tero Tolonen"
  license "MIT"
)

flag nodecli (
  name "ranger-compiler"
)

plugin.md "plugins.md" {
  h2 'How to push code from plugins to the Ranger compiler'
  h3 'generate_ast phase'
  p 'Before code gets typechecke during the generate_ast phase you can use'
  code '(source_code:string node:CodeNode wr:CodeWriter )'
  p 'to push code before it is statically analyzed'
}

Import "VirtualCompiler.clj"

class CompilerInterface {

  static fn create_env:InputEnv () {
    
    def env (new InputEnv)
    env.use_real = true
    env.commandLine = (new CmdParams)
    env.commandLine.collect()
    return env
  }
  

  static fn main () {
    def env (CompilerInterface.create_env())
    def o (new VirtualCompiler)
    def res (o.run( env ))
    if( has res.target_dir) {
      res.fileSystem.saveTo(res.target_dir false)
    }
  }
}
