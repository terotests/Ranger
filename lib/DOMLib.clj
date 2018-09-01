Import "ViewLib.clj"
Import "ACEEditor.clj"

systemclass SystemCanvasElement {
    es6 CanvasElement
}
systemclass CanvasDrawCtx {
    es6 CanvasDrawCtx
}
systemclass ACEEditor {
    es6 ACE
}
systemclass MediaQueryList {
  es6 Object
}


systemunion CoordinateType (double int)


operator type:void es6 {
  fn window:string ( location@(keyword) ) ('document.location.hash')
  fn hashchange ( cb:(_void ()) ) ('window.addEventListener("hashchange",(_event)=>{ (' (e 1) ')()})')    

  fn mediaQuery:MediaQueryList (query:string) ('window.matchMedia(' (e 1) ')')
  fn matches:boolean (q:MediaQueryList) ( (e 1) '.matches')
}

operators {


    set _:string ( el:ACEEditor text:string ) {
        templates {
            es6 ( (e 1) ".setValue(" (e 2) ")")
        }
    }

    valueof _:string ( el:ACEEditor ) {
        templates {
            es6 ( (e 1) ".getValue()")
        }
    }
    create_ace _:ACEEditor ( el:ViewGroup) {
        templates {
            es6 ("ace.edit(" (e 1) ")" )
        }
    }
    create_ace _:ACEEditor ( el:View) {
        templates {
            es6 ("ace.edit(" (e 1) ")" )
        }
    }
    set_mode _:void ( el:ACEEditor name:string) {
        templates {
            es6 ( (e 1 )".getSession().setMode(" (e 2) ") " )
        }
    }
    onChange _:void ( el:ACEEditor code:block) {
        templates {
            es6 ( (e 1 ) ".on(\"input\", () => {" nl I (block 2) i nl "}) " )
        }
    }

    eval_code _:void (code:string) {
        templates {
            es6 ( "eval(" (e 1 ) ")")
        }           
    }
    window_width _:int () {    
        templates {
            es6 ( 'window.innerWidth')
        }
    }
    window_height _:int () {    
        templates {
            es6 ( 'window.innerHeight')
        }
    }
    ctx _:CanvasDrawCtx (elem:SystemCanvasElement ) {
        templates {
            es6 ((e 1 ) '.getContext("2d")')
        }
    }

    beginPath _:void ( ctx:CanvasDrawCtx ) {
        templates {
            es6 ( (e 1) ".beginPath();" nl)
        }        
    }
    moveTo _:void (x:CoordinateType y:CoordinateType) {
        templates {
            es6 ( (e 1) ".moveTo(" (e 1) "," (e 2) ");" nl)
        }        
    }
    lineTo _:void (x:CoordinateType y:CoordinateType) {
        templates {
            es6 ( (e 1) ".lineTo(" (e 1) "," (e 2) ");" nl )
        }        
    }
    fill _:void () {
        templates {
            es6 ( (e 1) ".fill()")
        }        
    }

    create_canvas _:SystemCanvasElement ( width:int height:int ) {
        templates {
            es6 ( 'document.createElement("canvas")' )
        }
    }
    setWidth _:void ( c:SystemCanvasElement width:int) {
        templates {
            es6 ( (e 1) '.width = ' (e 2) ';' nl (e 1) '.style.width = ' (e 2) ' +"px";' nl)
        }
    }
    setHeight _:void ( c:SystemCanvasElement height:int) {
        templates {
            es6 ( (e 1) '.height = ' (e 2) ';' nl (e 1) '.style.height = ' (e 2) ' +"px";' nl)
        }
    }

    append _:void ( el:ViewGroup c:SystemCanvasElement ) {
        templates {
            es6 ( (e 1) '.appendChild(' (e 2) ')')
        }
    }

    beginPath _:void (c:CanvasDrawCtx) {
        templates {
            es6 ( (e 1 ) ".beginPath()")
        }        
    }
    scale _:void (c:CanvasDrawCtx amount:CoordinateType) {
        templates {
            es6 ( (e 1 ) ".scale(" (e 2) ", " (e 2) ")")
        }        
    }
    translate _:void (c:CanvasDrawCtx x:CoordinateType y:CoordinateType) {
        templates {
            es6 ( (e 1 ) ".translate(" (e 2) ", " (e 3) ")")
        }        
    }
    fill _:void (c:CanvasDrawCtx) {
        templates {
            es6 ( (e 1 ) ".fill()")
        }        
    }
    stroke _:void (c:CanvasDrawCtx) {
        templates {
            es6 ( (e 1 ) ".stroke()")
        }        
    }
    stroke _:void (c:CanvasDrawCtx color:string width:CoordinateType) {
        templates {
            es6 ( (e 1 ) ".strokeStyle = " (e 2) nl (e 1 ) ".lineWidth = " (e 3) nl )
        }        
    }
    stroke _:void (c:CanvasDrawCtx color:string) {
        templates {
            es6 ( (e 1 ) ".strokeStyle = " (e 2))
        }        
    }
    fillStyle _:void (c:CanvasDrawCtx color:string) {
        templates {
            es6 ( (e 1 ) ".fillStyle = " (e 2))
        }        
    }
    moveTo _:void (c:CanvasDrawCtx x:CoordinateType y:CoordinateType) {
        templates {
            es6 ( (e 1 ) ".moveTo(" (e 2) "," (e 3) ")")
        }        
    }
    lineTo _:void (c:CanvasDrawCtx x:CoordinateType y:CoordinateType) {
        templates {
            es6 ( (e 1 ) ".lineTo(" (e 2) "," (e 3) ")")
        }        
    }
    bezierCurveTo _:void (c:CanvasDrawCtx x1:CoordinateType y1:CoordinateType x2:CoordinateType y2:CoordinateType x3:CoordinateType y3:CoordinateType) {
        templates {
            es6 ( (e 1 ) ".bezierCurveTo(" (e 2) "," (e 3) "," (e 4) "," (e 5) "," (e 6) "," (e 7) ")")
        }        
    }
    get_context _:CanvasDrawCtx ( e:SystemCanvasElement) {
        templates {
            es6 ( (e 1 ) ".getContext(\"2d\") ")
        }
    }
    save _:void ( e:CanvasDrawCtx) {
        templates {
            es6 ( (e 1) '.save()')
        }
    }
    restore _:void ( e:CanvasDrawCtx) {
        templates {
            es6 ( (e 1) '.restore()')
        }
    }
    opacity _:void (e:CanvasDrawCtx v:double) {
        templates {
            es6 ( (e 1) '.globalAlpha = ' (e 2))
        }
    }
    document_body  base:ViewGroup () {
        templates {
            es6 ("document.body")
        }        
    }
    create_text _:ViewGroup ( text:string) {
        templates {
            es6  ("document.createTextNode( " (e 1) ")")
        }
    }
    getChild _@(optional):ViewGroup ( el:ViewGroup i:int) {
        templates {
            es6 ( (e 1) ".children[" (e 2) "]")
        }        
    }
    ; myAnchor.parentNode.replaceChild(mySpan, myAnchor);
    replace_dom _:ViewGroup ( oldEl:ViewGroup newEl:ViewGroup ) {
        templates {
            es6  ( (e 1) ".parentNode.replaceChild( " (e 2) ", " (e 1) ")")
        }
    }
    clear _:ViewGroup ( oldEl:ViewGroup ) {
        templates {
            es6  ( "while( " (e 1) ".firstChild) " (e 1) ".removeChild( " (e 1) ".firstChild);" )
        }
    }
    remove_dom _:ViewGroup ( oldEl:ViewGroup ) {
        templates {
            es6  ( "(" (e 1) ".parentNode ? " (e 1) ".parentNode.removeChild( " (e 1) ") : null);")
            ranger ( '(remove_dom ' (e 1) ')' )
        }
    }
    create_element _:ViewGroup ( elName:string) {
        templates {
            es6  ("document.createElement( " (e 1) ")")
            ranger ("(create_dom " (e 1) ")")
        }
    }
    set_class _:void ( el:ViewGroup className:string ) {
        templates {
            es6 ( (e 1) ".className = " (e 2))
        }
    }
    value _:void ( el:ViewGroup value:string ) {
        templates {
            es6 ( (e 1) ".value = " (e 2))
        }
    }
    value _:string ( el:ViewGroup) {
        templates {
            es6 ( (e 1) ".value")
        }
    }
    add_listener _:void (el:ViewGroup name:string cb:(_:void (event:DOMEvent))) {
        templates {
            es6 ( (e 1) ".addEventListener( " ( e 2 ) ", " (e 3) ")")
        }
    }
    clone _:ViewGroup (elem:ViewGroup) {
        templates {
            es6 ( (e 1) ".cloneNode(true)")
            ranger ( '(clone ' (e 1 )' )')
        }
    } 
    insert _:void (el:ViewGroup newChild:ViewGroup index:int) {
        templates {
            es6 ( (e 1) ".insertBefore( " (e 2) ", " (e 1) ".children[" (e 3) "]);")
        }
    }
    add _:void (el:ViewGroup newChild:ViewGroup) {
        templates {
            es6 ( (e 1) ".appendChild(" (e 2) ");")
            ranger ( '(add ' (e 1 )' ' (e 2) ' )')
        }
    }
    attr _:void (el:ViewGroup name:string value:string ) {
        templates {
            es6 ( (e 1) ".setAttribute(" (e 2) ", " (e 3)")")
            ranger ('(attr ' (e 1 ) ' ' (e 2 ) ' ' (e 3 ) ' ) ')
        }
    }
    text _:void (el:ViewGroup value:string ) {
        templates {
            es6 ( (e 1) ".textContent = " (e 2) )
            ranger ('(text ' (e 1) ' ' (e 2) ')')
        }
    }
    find_canvas _@(optional):SystemCanvasElement (id:string) {
        templates {
            es6 ( 'document.getElementById(' (e 1) ')')
        }        
    }
    find_element _@(optional):ViewGroup (id:string) {
        templates {
            es6 ( 'document.getElementById(' (e 1) ')')
        }        
    }
    find_element_by_attr _@(optional):ViewGroup ( attr:string value:string ) {
        templates {
            es6 ( `document.querySelectorAll('[' + ` (e 1) ` + '="' + ` (e 2) ` + '"]')[0]` )
            ranger ( '(find_element_by_attr ' (e 1) ' ' (e 2) ')' )
        }
    }
}

