
class viewbuilder_Web {

  fn _attr (wr:CodeWriter name:string value:string) {
      wr.out( " " + name + "=" + "\"" + value + "\" " , false)
  }

  fn tagAttrs(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    node.attrs.forEach({
        if(item.vref == "id") {
            this._attr(wr "x-id" item.string_value)                      
        }
        if(item.vref == "hint") {
            this._attr( wr "tooltip" item.string_value)
            this._attr( wr "title" item.string_value)
            this._attr( wr "placeholder" item.string_value)
        }        
    })
  }

  fn tagText(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    node.children.forEach({
        switch item.value_type {
            case RangerNodeType.XMLText {
                ; TODO: write to resources
                wr.out(item.string_value false)
            }
        }
    })
  }

  fn tag (name:string node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.out( ("<" + name) false)
    
    this.tagAttrs( node ctx wr)
    wr.out(">" false) 
    this.tagText(node ctx wr)   
    wr.out( ("</" + name + ">") true)
          
  }

  fn WalkNode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { 
      switch node.vref {
          case "LinearLayout" {
              this.tag("div" node ctx wr)
          }
          case "Button" {
              wr.out("<div><a class='waves-effect waves-light btn' " false)
              this.tagAttrs(node ctx wr)
              wr.out(">" false)
              this.tagText(node ctx wr)
              wr.out("</a></div>" false)
          }
          case "Text" {
              this.tag("div" node ctx wr)
          }
          case "Input" {
              wr.out("<div>" true)
              this.tag("input" node ctx wr)
              wr.out("</div>" true)
          }
      }
  }

  fn CreateViews (ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.out("<!DOCTYPE html>" true)
    wr.out("<html>" true)
    wr.indent(1)
    wr.out("<head>" true)
    wr.indent(1)
    wr.out("
  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css\">
  <script src=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/js/materialize.min.js\"></script>    
    " true)
    wr.indent(-1)
    wr.out("</head>" true)
    wr.out("<body>" true)
    ctx.viewClassBody.forEach({
        this.writeClass( item ctx wr )
    })
    wr.out("</body>" true)
    wr.out("</html>" true)
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def viewName ""
    node.attrs.forEach({
        if(item.vref == "name") {
            viewName = item.string_value
        }
    })

    wr.out("" true)
    wr.out("<div id=\"" + viewName +"\">" , true)    
    wr.indent(1)
    node.children.forEach({
        this.WalkNode( item ctx wr )
    })
    wr.indent(-1)
    wr.out("</div>" true)
       
  }
    
}