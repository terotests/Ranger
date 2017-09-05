
; Mahdollisesti:
; https://github.com/terotests/Ranger/blob/master/compiler/ng_LiveCompiler.clj#L311

class OpList {
  def list@(weak):[CodeNode]
}

class RangerActiveOperators {

  def stdCommands:CodeNode 
  def parent@(weak optional):RangerActiveOperators 

  def opHash:[string:OpList]
  def initialized false

  fn fork:RangerActiveOperators (fromOperator:CodeNode) {
    def newOps@(lives) (new RangerActiveOperators)
    newOps.parent = this
    for fromOperator.children lch:CodeNode i {
      def fc:CodeNode (lch.getFirst())
      if (fc.vref == "operators") {
        def n:CodeNode (lch.getSecond())
        newOps.stdCommands = n
      }
    }    
    return newOps
  }


  fn getOperators@(weak):[CodeNode] (name:string) {

    def results@(weak):[CodeNode]
    if initialized {
      def items (get opHash name)
      if(!null? items) {
        return items.list
      } {
        ; print "could not find operator " + name
      }
    } {
      ; print "---> initializing the operator cache----"
      for stdCommands.children lch@(lives):CodeNode i {
        def fc:CodeNode (lch.getFirst())
        if( has opHash fc.vref ) {
          def opList (unwrap (get opHash fc.vref ))
          push opList.list lch
        } {
          def newOpList (new OpList)
          set opHash fc.vref newOpList
          push newOpList.list lch
        }
        if (fc.vref == name) {
          push results lch
        }
      }      
      initialized = true
    }
    return results

    def results:[CodeNode]
    def ops:RangerActiveOperators (this)
    while(true) {
      if(!null? ops.stdCommands) {
        for ops.stdCommands.children lch:CodeNode i {
          def fc:CodeNode (lch.getFirst())
          if (fc.vref == name) {
            push results lch
          }
        }
      }
      if(null? ops.parent) {
        break
      }
      ops = (unwrap ops.parent)
    }
    return results
  }

  fn initFrom ( main:CodeNode ) {
    def lang@(optional):CodeNode
    for main.children m:CodeNode i {
      def fc:CodeNode (m.getFirst())
      if (fc.vref == "language") {
        lang = m
      }
    }
    if(null? lang) {
      return
    }
    def cmds:CodeNode
    def langNodes:CodeNode (itemAt lang.children 1)
    for langNodes.children lch:CodeNode i {
      def fc:CodeNode (lch.getFirst())
      if (fc.vref == "commands") {
        def n:CodeNode (lch.getSecond())
        stdCommands = (lch.getSecond())
      }
    }
    return 
  }
}