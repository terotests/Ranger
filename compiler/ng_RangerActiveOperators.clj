
; Mahdollisesti:
; https://github.com/terotests/Ranger/blob/master/compiler/ng_LiveCompiler.clj#L311

class RangerActiveOperators {

  def stdCommands:CodeNode 
  def parent@(weak optional):RangerActiveOperators 

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

  fn getAllOperators:[CodeNode] (limit:int) {
    def results:[CodeNode]
    def ops:RangerActiveOperators (this)
    while(true) {
      if(!null? ops.stdCommands) {
        for ops.stdCommands.children lch:CodeNode i {
          def fc:CodeNode (lch.getFirst())
          push results lch
          if( ( limit > 0 ) && ( (array_length results) >= limit ) ) {
            break            
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

  fn getOperators:[CodeNode] (name:string) {
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