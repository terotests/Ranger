Import "ng_RangerAppEnums.clj"

class RangerAppTodo {
  def description:string ""
  def todonode@(weak):CodeNode
}

class RangerCompilerMessage {
  def error_level:int 0
  def code_line:int 0
  def fileName:string ""
  def description:string ""
  def node@(weak):CodeNode
}

