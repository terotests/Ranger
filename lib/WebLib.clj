systemclass View {
  java7 View
  es6 View
}

systemclass Button {
    java7 Button
    es6 HTMLElement
}

operators {
    setTextNotUsed _:void (btn:Button txt:string) {
        templates {
            ranger  ( "(setText " (e 1) " " (e 2) " )" )
        }
    }
}



operator type:void es6 {

  fn findView:View (name:string) (
    "view.querySelectorAll('[x-id=" (str 1) "]')[0]"
  )

  fn setText (btn:Button txt:string) ( (e 1) ".textContent = " (e 2) "; // ?? " )
  
  ; ev:(_:void (view:View))
  fn onClick:void (view:View ev:block) (
    (e 1) ".addEventListener('click', () => {" nl
      I (block 2) nl i 
     "});" nl
  )

  fn loadFragment:void ( pageName:string into:string ) (
        "() => {" nl
         I "var replaced = view.querySelectorAll('[x-id=" (str 2) "]')[0];" nl
           "var newChild = document.querySelectorAll('[x-id=" (str 1) "]')[0];" nl
           "replaced.parentNode.replaceChild(newChild, replaced);" nl
         i "}();" nl
  ) 
}

operator type:void ranger {
  fn setText (btn:Button txt:string) ( "(setText " (e 1) " " (e 2) " )" )
}
