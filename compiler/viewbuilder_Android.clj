
class viewbuilder_Android {

  fn _attr (wr:CodeWriter name:string value:string) {
      wr.out("android:" + name + "=" + "\"" + value + "\" " , true)
  }

  fn elWithText (name:string node:CodeNode wr:CodeWriter ) {
    wr.out("<" + name + " " , true)
    wr.indent(1)
    def width "match_parent"
    def height "wrap_content"
    def weight ""
    node.children.forEach({
        switch item.value_type {
            case RangerNodeType.XMLText {
                ; TODO: write to resources
                this._attr(wr "text" item.string_value)
            }
        }
    })
    node.attrs.forEach({
        if(item.vref == "font-size") {
            this._attr(wr "textSize" (item.string_value + "dp"))                      
        }
        if(item.vref == "id") {
            this._attr(wr "id" ("@+id/" + item.string_value))                      
        }
        if(item.vref == "width-pros") {
            weight = item.string_value 
        }
        if(item.vref == "width") {
            width = item.string_value + "dp"
        }
    })
    this._attr(wr "layout_width" width)
    this._attr(wr "layout_height" height)
    if( (strlen weight) > 0) {
        this._attr(wr "layout_weight" weight)
    }
    wr.out("/>" true)
    wr.indent(-1)
      
  }

  fn WalkNode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) { 

      switch node.vref {
          case "ScrollView" {
              wr.out("<ScrollView " true)
              wr.indent(1)
              this._attr(wr "layout_width" "match_parent")
              this._attr(wr "layout_height" "wrap_content")

              node.attrs.forEach({
                  if(item.vref == "id") {
                      this._attr(wr "id" ("@+id/" + item.string_value))                      
                  }
              })
              wr.out(">" true)
              wr.indent(1)
                node.children.forEach({
                    this.WalkNode( item ctx wr )
                })
              wr.indent(-1)
              wr.out("</ScrollView>" true)
              wr.indent(-1)
          }
          case "LinearLayout" {
              wr.out("<LinearLayout " true)
              wr.indent(1)
              this._attr(wr "layout_width" "match_parent")
              this._attr(wr "layout_height" "wrap_content")

              def orientation "vertical"
              node.attrs.forEach({
                  if(item.vref == "id") {
                      this._attr(wr "id" ("@+id/" + item.string_value))                      
                  }
                  if(item.vref == "direction") {
                      orientation = item.string_value
                  }
              })
              this._attr(wr "orientation" orientation)
              this._attr(wr "weightSum" "100")
              wr.out(">" true)
              wr.indent(1)
                node.children.forEach({
                    this.WalkNode( item ctx wr )
                })
              wr.indent(-1)
              wr.out("</LinearLayout>" true)
              wr.indent(-1)
          }
          case "Button" {
              this.elWithText("Button" node wr)
          }
          case "Text" {
              this.elWithText("TextView" node wr)
          }
          case "Input" {
              wr.out("<EditText " true)
              wr.indent(1)
              this._attr(wr "layout_width" "match_parent")
              this._attr(wr "layout_height" "wrap_content")

              node.attrs.forEach({
                    if(item.vref == "hint") {
                        this._attr( wr "hint" item.string_value)
                    }
                    if(item.vref == "id") {
                        this._attr(wr "id" ("@+id/" + item.string_value))                      
                    }
                    if(item.vref == "type" && (item.string_value=="password")) {
                        this._attr(wr "inputType" "textPassword")                      
                    }

                  })

              node.children.forEach({
                  switch item.value_type {
                      case RangerNodeType.XMLText {
                          ; TODO: write to resources
                          this._attr(wr "text" item.string_value)
                      }
                  }
              })
              wr.out("/>" true)
              wr.indent(-1)
          }
      }
      
  }
  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {

    def viewName ""
    def b_scroll false
    node.attrs.forEach({
        if(item.vref == "name") {
            viewName = item.string_value
        }
        if(item.vref == "type") {
            if(item.string_value == "scroll") {
                b_scroll = true
            }
        }
    })
    def wr:CodeWriter (orig_wr.getFileWriter("layout" ("activity_" + viewName + ".xml")))

    wr.out("<?xml version=\"1.0\" encoding=\"utf-8\"?>" true) ;"
    def viewTag "LinearLayout"
    if(b_scroll) {
        viewTag = "ScrollView"
    } 
    wr.out("<" + viewTag + " xmlns:android=\"http://schemas.android.com/apk/res/android\" " , true) ;"    
    wr.indent(1)
    this._attr( wr "layout_width" "match_parent")
    this._attr( wr "layout_height" "match_parent")
    if( b_scroll == false ) {
        this._attr( wr "paddingLeft" "16dp")
        this._attr( wr "paddingRight" "16dp")
        this._attr( wr "orientation" "vertical")
    }
    this._attr( wr "id" ("@+id/view_id_" + viewName))                      
    
    wr.out(">" true)

    node.children.forEach({
        this.WalkNode( item ctx wr )
    })
    wr.indent(-1)
    wr.out("</" + viewTag + ">" , true)
       
  }
    
}