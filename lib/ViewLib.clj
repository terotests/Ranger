
systemclass Bytes {
  java7 'byte[]'
}

operators {
  to_bytes _:Bytes (str:string) {
    templates {
      java7 ( (e 1) '.getBytes()')
    }
  }
  to_string _:string (bytes:Bytes) {
    templates {
      java7 ( 'new String('(e 1) ')')
    }
  }
  to_base64 _:string (bytes:Bytes) {
    templates {
      java7 ('Base64.encodeToString(' (e 1) ', Base64.DEFAULT)' (imp 'android.util.Base64'))
    }
  }
}

systemclass UIContextHandle {
  java7 Activity ( (imp "android.app.Activity") (imp "android.content.Context") )
  es6 HTMLElement
}

systemclass ViewGroup {
  java7 ViewGroup ( (imp 'android.view.ViewGroup'))
  es6 HTMLElement
}

systemclass ViewSpan {
  java7 Spanned ( (imp 'android.text.Spanned'))
  es6 HTMLElement
}

systemclass ViewArgs {
  java7 Bundle ( (imp 'android.os.Bundle'))
}

; should / could the types be operators ? 
systemclass LayoutStorage {
    java7 LayoutInflater ( (imp "android.view.LayoutInflater") )
    es6 HTMLElement
}

systemclass ViewAnimation {
    java7 Animation ( (imp 'android.animation.Animator') (imp 'android.animation.AnimatorListenerAdapter') (imp 'android.view.animation.AnimationUtils') )
}

systemclass View {
  java7 View ( (imp 'android.view.View'))
  es6 HTMLElement
}

systemclass Button {
    java7 Button ( (imp 'android.widget.Button'))  
    es6 HTMLElement
}

systemclass Input {
    java7 EditText ( (imp 'android.widget.EditText'))
    es6 HTMLElement
}

systemclass ImageView {
    java7 ImageView  ( (imp 'android.widget.ImageView') )
    es6 HTMLElement
}

systemclass ImageBitmap {
    java7 Bitmap  ( (imp 'android.graphics.Bitmap') )
    es6 HTMLElement    
}

systemclass ViewSlider {
    java7 SeekBar ( (imp 'android.widget.SeekBar'))
    es6 HTMLElement
}

class UIContext {
    def view@(weak):ViewGroup
    def ctx@(weak):UIContextHandle
    def comps@(weak):LayoutStorage
    def args@(weak):ViewArgs
    def parent:UIContext

    static fn create:UIContext ( mainView:ViewGroup h:UIContextHandle c:LayoutStorage args:ViewArgs) {
        def o (new UIContext)
        o.ctx = h
        o.comps = c
        o.view = mainView
        o.args = args
        return o
    }
    fn fork:UIContext () {
        def newObj (new UIContext)
        newObj.parent = this
        return newObj
    }
    fn getRoot:UIContext () {
        if(!null? parent) {
            return (unwrap parent)
        }
        return this
    }
    fn getArgs:ViewArgs () {
        return (unwrap args)
    }
    fn getMain:ViewGroup () {
        return (unwrap ( (this.getRoot()).view) )   
    }
    fn getCtx:UIContextHandle () {
        return (unwrap ( (this.getRoot()).ctx) )   
    }
    fn viewFactory:LayoutStorage() {
        return (unwrap ( (this.getRoot()).comps) )   
    }
}


operators {
    setTextNotUsed _:void (btn:Button txt:string) {
        templates {
            ranger  ( "(setText " (e 1) " " (e 2) " )" )
        }
    }
}

;            case uictx c:UIContextHandle {
;                ui_thread c {
;                    setPageTitle sObj.name
;                }
;            }

;"

operator type:void all {

    fn task.ui:JinxProcess ( cb@(strong):(_:void (ctx:JinxProcessCtx)) ) {
       def t (new JinxUIThreadTask)
       t.callback = cb
       return t        
    }
}


operators {

  getActiveView _:ViewGroup () {
      templates {
          ranger ('(getActiveView )')
          es6 ( 'view' )
      }      
  }

  getArguments _:ViewArgs () {
      templates {
          ranger ('(getArguments)')
          java7 ('getArguments()')
      }
  }

  pageProcess _:JinxProcess () {
      templates {
          ranger ("(pageProcess )")
          * @macro(true) ("(cast (unwrap (get ctx.anyValues \"process\" )) to:JinxProcess)")
      }
  }

  pageView _:View () {
      templates {
          ranger ("(pageView )")
          * @macro(true) ("(cast (unwrap (get ctx.anyValues \"view\" )) to:View)")
      }
  }

  setViewProcess _:void ( process:JinxProcess ) {
      templates {
          ranger ("(setViewProcess " (e 1) ")")
          es6 ("")
          java7 ("mainProcess = " (e 1) ";" nl)
      }
  }

  ; ViewSpan

  
  getMainView _:ViewGroup () {
      templates {
          ranger ("(getMainView )")
          es6 ( "document.body" )
          java7 ("(ViewGroup)view" ) ; container?
      }      
  }

  getUIContext _:UIContextHandle () {
      templates {
          ranger ("(getUIContext )")
          es6 ( "window" )
          java7 ("getActivity()" (imp "android.content.Context") (imp "android.app.Activity"))
      }      
  }

  getLayoutStorage _:LayoutStorage () {
      templates {
          ranger ("(getLayoutStorage )")
          es6 ( "window" )
          java7 ("inflater" (imp "android.view.LayoutInflater") )
      }            
  }

  ui_thread _:void ( handle:UIContext code:block ) {
      templates {
          ranger ("(ui_thread " (e 1) " {" nl (block 2) nl "})")
          es6 ( (block 2) )
          java7 (
            (e 1) ".getCtx().runOnUiThread(new Runnable(){" nl I
                "@Override" nl
                "public void run() {" nl I                    
                    (block 2)
                nl i "}"
                nl i 
            "});"     

            (imp "android.app.Activity")         
          )
      }
  }

  fadeOut _:void (view:View ms:int) {
      templates {
          ranger ( '(fadeOut '(e 1)' ' (e 2) ')')
          java7 ( (e 1) `.animate().alpha(0f).setDuration(` (e 2) `)
.setListener(new AnimatorListenerAdapter() {
    @Override
    public void onAnimationEnd(Animator animation) {
        ` (e 1) `.setVisibility(View.GONE);
    }
});` 
          (imp 'android.animation.AnimatorListenerAdapter')
          (imp 'android.animation.Animator')
          )
      }
  }

  onDraw _void (view:ViewGroup cb:(_:void ()) ) {
      templates {
          ranger ('(onInsert ' (e 1)' ' (e 2)')')
          java7 ( (e 1) `.getViewTreeObserver().addOnPreDrawListener(new ViewTreeObserver.OnPreDrawListener() {` nl I
    '@Override' nl
    'public boolean onPreDraw () {' nl I (e 2) '.run();' nl
            'return true;' nl
             i '}' nl i '});'
             (imp 'android.view.ViewTreeObserver')
          )
      } 
  }


  fadeOut _:void (view:ViewGroup ms:int) {
      templates {
          ranger ( '(fadeOut '(e 1)' ' (e 2) ')')
          java7 ( (e 1) `.animate().alpha(0f).setDuration(` (e 2) `)
.setListener(new AnimatorListenerAdapter() {
    @Override
    public void onAnimationEnd(Animator animation) {
        ` (e 1) `.setVisibility(View.GONE);
    }
});` 
          (imp 'android.animation.AnimatorListenerAdapter')
          (imp 'android.animation.Animator')
          )
      }
  }

  fadeIn _:void (view:ViewGroup ms:int) {
      templates {
          ranger ( '(fadeOut '(e 1)' ' (e 2) ')')
          java7 ( (e 1) `.setVisibility(View.VISIBLE);` nl
                  (e 1) `.animate().alpha(1f).setDuration(` (e 2) `)
.setListener(new AnimatorListenerAdapter() {
    @Override
    public void onAnimationEnd(Animator animation) {
    }
});` 
          (imp 'android.animation.AnimatorListenerAdapter')
          (imp 'android.animation.Animator')
          )
      }
  }
  

  setPageTitle _:void (ui:UIContext txt:string) {
      templates {
          ranger ("(setPageTitle " (e 1) " " (e 2) ")")
          es6 ( "document.title = " (e 1) ";" )
          java7 ((e 1) ".getCtx().setTitle(" ( e 2 ) ");")
      }      
  }

  setPageTitle _:void (ui:UIContextHandle txt:string) {
      templates {
          ranger ("(setPageTitle " (e 1) " " (e 2) ")")
          es6 ( "document.title = " (e 1) ";" )
          java7 ((e 1) ".setTitle(" ( e 2 ) ");")
      }      
  }

  blur _:void ( view:Input ) {
      templates {
          ranger ('(blur ' (e 1) ')')
          java7 (  (e 1) '.clearFocus();')
          es6 ( (e 1) '.blur();' )
      }
  }
  

  removeView _:void ( view1:View ) {
      templates {
          ranger ('(removeView ' (e 1) ')')
          java7 ( '((ViewGroup)' (e 1) '.getParent()).removeView(' (e 1) ');')
          es6 ( (e 1) '.parentNode.removeChild(' (e 1) ');' )
      }
  }

  rotate _:void (view:View degrees:int) {
      templates {
          ranger ('(rotate ' (e 1) ' ' (e 2) ')')
          java7 ( (e 1) ".setRotation(" (e 2) ");")
      }
  }

  set _void (s:ViewSlider value:int) {
      ; setProgress
      templates {
          ranger ('(set ' (e 1) ' ' (e 2) ')')
          java7 ((e 1) '.setProgress(' (e 2) ');')
      }
  }

  onChange _:void ( s:ViewSlider cb:(_:void (value:int)) ) {
      templates {
          ranger ('(onChange ' (e 1) ' ' (e 2) ')')
          java7 (
        (imp 'android.widget.SeekBar')
(e 1)`.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {

    @Override
    public void onStopTrackingTouch(SeekBar seekBar) {

    }
    @Override
    public void onStartTrackingTouch(SeekBar seekBar) {
    }
    @Override
    public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
        `nl I (e 2) `.run(progress);` nl i  ` 
    }
});

`


          )
      }
  } 

  removeView _:void ( view1:ViewGroup view2:View) {
      templates {
          ranger ('(removeView ' (e 1) ' ' (e 2) ')')
          java7 ( '((ViewGroup)' (e 1) '.getParent()).removeView(' (e 2) ');')
          es6 ( (e 1) '.removeChild(' (e 2) ');' )
      }
  }

  removeView _:void ( view1:ViewGroup view2:ViewGroup) {
      templates {
          ranger ('(removeView ' (e 1) ' ' (e 2) ')')
          java7 ( '((ViewGroup)' (e 1) '.getParent()).removeView(' (e 2) ');')
          es6 ( (e 1) '.removeChild(' (e 2) ');' )
      }
  }

  createAnimation _:ViewAnimation ( ctx:UIContextHandle  str:string) {
      templates {
          java7 (`AnimationUtils.loadAnimation(` (e 1) `, R.anim.` (str 2) `)` (imp "android.view.animation.AnimationUtils"))
      }
  }

  start _:ViewAnimation ( view:View anim:ViewAnimation) {
      templates {
          java7 ( (e 1) `.startAnimation(` (e 2) `);` (imp "android.view.animation.AnimationUtils") )
      }
  }

  start _:ViewAnimation ( view:ViewGroup anim:ViewAnimation) {
      templates {
          java7 ( (e 1) `.startAnimation(` (e 2) `);` (imp "android.view.animation.AnimationUtils") )
      }
  }

  addView _:void ( view1:ViewGroup view2:View) {
      templates {
          ranger ("(addView " (e 1) " " (e 2) ")")
          java7 ( (e 1) ".addView(" (e 2) ");")
          es6 ( (e 1) ".appendChild(" (e 2) ");" )
      }
  }

  addView _:void ( view1:ViewGroup view2:ViewGroup) {
      templates {
          ranger ("(addView " (e 1) " " (e 2) ")")
          java7 ( (e 1) ".addView(" (e 2) ");")
          es6 ( (e 1) ".appendChild(" (e 2) ");" )
      }
  }  

  createView _:View (ui:UIContext name:string) {
      templates {
          ranger ('(createView ' (e 1) ' ' (e 2) ')')
          java7 ( (e 1) '.viewFactory().inflate(R.layout.activity_' (str 2) ', '(e 1)'.getMain(), false)')
          es6 ( `document.querySelectorAll('[x-id='+ ` (e 2) `+']')[0].cloneNode(true)` )
      }
  }

  createViewGroup _:ViewGroup (ui:UIContext name:string) {
      templates {
          ranger ('(createViewGroup ' (e 1) ' ' (e 2) ')')
          java7 ( '(ViewGroup)'(e 1) '.viewFactory().inflate(R.layout.activity_' (str 2) ', '(e 1)'.getMain(), false)')        
;           java7 ('inflater.inflate(R.layout.activity_' (str 1) ', container, false)')
          es6 ( `document.querySelectorAll('[x-id='+ ` (e 1) `+']')[0].cloneNode(true)` )
      }
  }

  scrollTo _:void (view:ViewGroup x:int y:int) {
      templates {
          java7 ('((ScrollView)'(e 1) ').smoothScrollTo(' (e 2) ', ' (e 3) ');' 
            (imp 'android.widget.ScrollView')
          )
      }
  }

  findSlider _:ViewSlider (view:ViewGroup name:string) {
      templates {
          ranger ("(findSlider " (e 1) " " (e 2) ")")
          es6 ( "view.querySelectorAll('[x-id=" (str 1) "]')[0]" )
          java7 ("( (SeekBar) " ( e 1 ) ".findViewById(R.id." (str 2) ") )")
      }
  }
  findImage _:ImageView (view:ViewGroup name:string) {
      templates {
          ranger ("(findImage " (e 1) " " (e 2) ")")
          es6 ( "view.querySelectorAll('[x-id=" (str 1) "]')[0]" )
          java7 ("((ImageView) (" ( e 1) ".findViewById(R.id." (str 2) ")))" (imp 'android.widget.ImageView') )
      }      
  }
  findInput _:Input (view:ViewGroup name:string) {
      templates {
          ranger ("(findInput " (e 1) " " (e 2) ")")
          es6 ( "view.querySelectorAll('[x-id=" (str 1) "]')[0]" )
          java7 ("((EditText) " ( e 1) ".findViewById(R.id." (str 2) "))")
      }
  }

  findInput _:Input (view:View name:string) {
      templates {
          ranger ("(findInput " (e 1) " " (e 2) ")")
          es6 ( "view.querySelectorAll('[x-id=" (str 1) "]')[0]" )
          java7 ("((EditText) " ( e 1) ".findViewById(R.id." (str 2) "))")
      }
  }
  findInput _:Input (name:string) {
      templates {
          ranger ("(findInput " (e 1) ")")
          es6 ( "view.querySelectorAll('[x-id=" (str 1) "]')[0]" )
          java7 ("((EditText)view.findViewById(R.id." (str 1) "))")
      }
  }

  findView _:View ( mainView:View name:string) {
      templates {
          ranger ("(findView " (e 1) " " (e 2) ")")
          es6 ( (e 1) ".querySelectorAll('[x-id=" (str 2) "]')[0]" )
          java7 ((e 1) ".findViewById(R.id." (str 2) ")")
      }
  }

  findView _:View ( mainView:ViewGroup name:string) {
      templates {
          ranger ("(findView " (e 1) " " (e 2) ")")
          es6 ( (e 1) ".querySelectorAll('[x-id=" (str 2) "]')[0]" )
          java7 ((e 1) ".findViewById(R.id." (str 2) ")")
      }
  }

  findView _:View ( ctx:UIContext name:string) {
      templates {
          * @macro(true) ( '(findView (' (e 1) '.getMain()) "' (str 2) '")')
      }
  }
  

  findView _:View (name:string) {
      templates {
          ranger ("(findView " (e 1) ")")
          es6 ( "view.querySelectorAll('[x-id=" (str 1) "]')[0]" )
          java7 ("view.findViewById(R.id." (str 1) ")")
      }
  }

  clear _:void (g:ViewGroup) {
      templates {
          ranger ('(clear ' (e 1) ' )')
          java7 ( (e 1) '.removeAllViews();' nl)
      }
  }


  findViewGroup _:ViewGroup ( name:string) {
      templates {
          ranger ("(findViewGroup " (e 1) " " (e 2) ")")
          es6 ( (e 1) ".querySelectorAll('[x-id=" (str 2) "]')[0]" )
          java7 ( "((ViewGroup) view.findViewById(R.id." (str 1) "))")
      }
  }

  findViewGroup _:ViewGroup ( mainView:View name:string) {
      templates {
          ranger ("(findViewGroup " (e 1) " " (e 2) ")")
          es6 ( (e 1) ".querySelectorAll('[x-id=" (str 2) "]')[0]" )
          java7 ( "((ViewGroup) " (e 1) ".findViewById(R.id." (str 2) "))")
      }
  }


  findViewGroup _:ViewGroup ( mainView:ViewGroup name:string) {
      templates {
          ranger ("(findViewGroup " (e 1) " " (e 2) ")")
          es6 ( (e 1) ".querySelectorAll('[x-id=" (str 2) "]')[0]" )
          java7 ( "((ViewGroup) " (e 1) ".findViewById(R.id." (str 2) "))")
      }
  }

  ; getWidth

  width _:int (view:View) {
      ; view.getLayoutParams().width
      templates {
          ranger ("(width " (e 1) " " (e 2) ")")
          java7 ( (e 1) ".getWidth()" (imp "android.view.View"))
          es6 ( (e 1) ".style.width = " (e 2) "px" )
      }
  }

  width _:int (view:ViewGroup) {
      ; view.getLayoutParams().width
      templates {
          ranger ("(width " (e 1) " " (e 2) ")")
          java7 ( (e 1) ".getWidth()" (imp "android.view.View"))
          es6 ( (e 1) ".style.width = " (e 2) "px" )
      }
  }

  width _:void (view:View width:int) {
      ; view.getLayoutParams().width
      templates {
          ranger ("(width " (e 1) " " (e 2) ")")
          java7 ( (e 1) ".getLayoutParams().width = " (e 2) ";" nl
                  (e 1) ".requestLayout();" nl
                    (imp "android.view.View"))
          es6 ( (e 1) ".style.width = " (e 2) "px" )
      }
  }
  

  setText _:void (btn:Button txt:string) {
      templates {
          ranger ("(setText " (e 1) " " (e 2) ")")
          java7 ( (e 1) ".setText(" (e 2) ");" (imp "android.widget.Button"))
          es6 ( (e 1) ".textContent = " (e 2) "" )
      }
  }
  setText _:void (view:View txt:string) {
      templates {
          ranger ("(setText " (e 1) " " (e 2) ")")
          java7 ( 
              "if( " (e 1) " instanceof Button) ((Button)" (e 1) ").setText(" (e 2) ");" nl
              "if( " (e 1) " instanceof TextView) ((TextView)" (e 1) ").setText(" (e 2) ");" nl
              "if( " (e 1) " instanceof EditText) ((EditText)" (e 1) ").setText(" (e 2) ");" nl
            (imp "android.widget.Button") (imp "android.widget.TextView") (imp "android.widget.EditText"))
          es6 ( (e 1) ".textContent = " (e 2) "" )
      }      
  }

  html_to_span _:ViewSpan (html:string) {
    templates {
      ranger ('(html_to_span ' (e 1) ' )')
      java7 ( '_getSpannedFromHTML(' (e 1)')'
(create_polyfill `
Spanned _getSpannedFromHTML ( String html ) {
 if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
      return (Html.fromHtml(html,Html.FROM_HTML_MODE_LEGACY));
 } else {
      return (Html.fromHtml(html));
 }
}
`)
            (imp "android.text.Html") (imp 'android.text.Spanned') )
      es6 ('/* todo: html_to_span */') 
    }
  }

  setText _:void (view:View txt:ViewSpan) {
      templates {
          ranger ("(setText " (e 1) " " (e 2) ")")
          java7 ( 
              "if( " (e 1) " instanceof TextView) ((TextView)" (e 1) ").setText(" (e 2) ");" nl
               (imp "android.widget.TextView") )
          es6 ( (e 1) ".appendChild( " (e 2) " )" )
      }      
  }

  onChange _:void (view:Input ev:(_:void (value:string))) {
      templates {
          ranger ("(onChange " (e 1) " " (e 2) " )")
          java7  (
                    (e 1) ".addTextChangedListener(new TextWatcher() {" nl
                    I 
                    "public void afterTextChanged(Editable s) {}" nl
                    "public void beforeTextChanged(CharSequence s, int start, int count, int after) {}" nl
                    "public void onTextChanged(CharSequence s, int start, int before, int count) {" nl 
                     I 
                        (e 2) ".run( s.toString() );" nl                        
                     i nl "}"
                      nl i
                    "});" nl

                    (imp "android.text.TextWatcher")
                    (imp "android.widget.EditText")
                    (imp "android.text.Editable")
                )
         es6 (
    (e 1) ".addEventListener('keyup', (event) => {" nl
      I "(" (e 2) "(event.target.value)" nl i 
     "});" nl
  )

      }
  }

  onClick _:void (view:View ev:(_:void ())) {
      templates {
          ranger ("(onClick " (e 1) " " (e 2) " )")
          java7  (
                    (e 1)'.setClickable(true);' nl
                    (e 1) ".setOnClickListener(new View.OnClickListener() {" nl
                    I 
                    "@Override" nl
                    "public void onClick(View __view) {" nl
                    I (e 2) ".run();" i
                    "}" nl i
                    "});" nl
                )
         es6 (
    (e 1) ".addEventListener('click', () => {" nl
      I "((" (e 2) ")())" nl i 
     "});" nl
  )

      }
  }

  popView _:void ( pageName:string ) {
      templates {
          ranger ("(popView " (e 1) ")")
          es6 ("/* popView */")
          java7 (
        "FragmentManager fm = getActivity()" nl I
                ".getSupportFragmentManager();" nl i
        "fm.popBackStack (" (e 1) ", FragmentManager.POP_BACK_STACK_INCLUSIVE);" nl            
          )
      }
  }

  getArg _:string ( ui:UIContext name:string) {
      templates {
          ranger ('(getArg ' (e 1) ' ' (e 2) ')' )
          java7 ( (e 1) '.getArgs().getString(' (e 2) ')' )
      }
  }

  getArg _@(optional):string ( ui:UIContext) {
      templates {
          ranger ('(getArg ' (e 1) ' ' (e 2) ')' )
          java7 ( (e 1) '.getArgs() != null ? ' (e 1) '.getArgs().getString("path") : null' )
      }
  }

  ; can you load view this way...
  pushView _:void ( pageName:string into:string args:string) {
      templates {
          ranger ("(pushView " (e 1) " " (e 2) ")")
          java7  (
                "Fragment fragment = new " (str 1) "();" nl
                'Bundle _args = new Bundle();' nl
                '_args.putString("path", ' (e 3) ' );' nl
                'fragment.setArguments(_args);' nl
                "FragmentManager fragmentManager = getActivity().getSupportFragmentManager();" nl
                "FragmentTransaction fragmentTransaction = fragmentManager.beginTransaction();" nl
                "fragmentTransaction.replace(R.id." (str 2) ", fragment);" nl
                "fragmentTransaction.addToBackStack(null);" nl
                "fragmentTransaction.commit();" nl
                (imp "android.support.v4.app.FragmentManager")
                (imp "android.support.v4.app.Fragment")
                (imp "android.support.v4.app.FragmentTransaction")
            )
          es6  (
        "() => {" nl
         I "var replaced = view.querySelectorAll('[x-id=" (str 2) "]')[0];" nl
           "var newChild = document.querySelectorAll('[x-id=" (str 1) "]')[0];" nl
           "replaced.parentNode.replaceChild(newChild, replaced);" nl
         i "}();" nl
  ) 
      }
  }

  setImageBitmap _:void ( view:ImageView  data:ImageBitmap ) {
      templates {
          java7 ( (e 1) '.setImageBitmap(' (e 2) ');')
      }
  }

  getScrollView _:ViewGroup ( ui:UIContext ) {
      templates {
          java7 ('(ViewGroup)container.getParent()')
      }
  }

  parent _:ViewGroup (viewGroup:ViewGroup) {
      templates {
          java7 ( '(ViewGroup)' (e 1) '.getParent()')
      }
  }
  

  getBitmapFromUrl _:void ( url:string callback:(_:void ( data:ImageBitmap ))) {
      templates {
          java7 ( '(new DownloadImageTask() { ' nl I
                        '@Override' nl
                        'protected void onPostExecute(Bitmap result) {' nl I
                            'try {' I
                                (e 2) '.run(result); ' nl i
                            '} catch( Exception e) {}' nl i
                        '}' nl i
                    '}).execute(' (e 1) ');' (imp 'android.widget.ImageView')

(java_class 'DownloadImageTask' `

import android.os.AsyncTask;
import android.graphics.Bitmap;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import android.widget.ImageView;
import java.io.InputStream;
import java.net.URL;
import android.graphics.BitmapFactory;
import android.util.Log;

class DownloadImageTask extends AsyncTask<String, Void, Bitmap> {
    public DownloadImageTask() {
    }
    protected Bitmap doInBackground(String... urls) {
        String urldisplay = urls[0];
        Bitmap mIcon11 = null;
        try {
        InputStream in = new java.net.URL(urldisplay).openStream();
        mIcon11 = BitmapFactory.decodeStream(in);
        } catch (Exception e) {
            Log.e("Error", e.getMessage());
            e.printStackTrace();
        }
        return mIcon11;
    }

    protected void onPostExecute(Bitmap result) {

    }
}

`)              
          )
      }
  }
  

  ; can you load view this way...
  pushView _:void ( pageName:string into:string ) {
      templates {
          ranger ("(pushView " (e 1) " " (e 2) ")")
          java7  (
                "Fragment fragment = new " (str 1) "();" nl
                "FragmentManager fragmentManager = getActivity().getSupportFragmentManager();" nl
                "FragmentTransaction fragmentTransaction = fragmentManager.beginTransaction();" nl
                "fragmentTransaction.replace(R.id." (str 2) ", fragment);" nl
                "fragmentTransaction.addToBackStack(null);" nl
                "fragmentTransaction.commit();" nl
                (imp "android.support.v4.app.FragmentManager")
                (imp "android.support.v4.app.Fragment")
                (imp "android.support.v4.app.FragmentTransaction")
            )
          es6  (
        "() => {" nl
         I "var replaced = view.querySelectorAll('[x-id=" (str 2) "]')[0];" nl
           "var newChild = document.querySelectorAll('[x-id=" (str 1) "]')[0];" nl
           "replaced.parentNode.replaceChild(newChild, replaced);" nl
         i "}();" nl
  ) 
      }
  }

  loadFragment _:void ( pageName:string into:string ) {
      templates {
          ranger ("(loadFragment " (e 1) " " (e 2) ")")
          java7  (
                "Fragment fragment = new " (str 1) "();" nl
                "FragmentManager fragmentManager = getActivity().getSupportFragmentManager();" nl
                "FragmentTransaction fragmentTransaction = fragmentManager.beginTransaction();" nl
                "fragmentTransaction.replace(R.id." (str 2) ", fragment);" nl
                "fragmentTransaction.addToBackStack(null);" nl
                "fragmentTransaction.commit();" nl
                (imp "android.support.v4.app.FragmentManager")
                (imp "android.support.v4.app.Fragment")
                (imp "android.support.v4.app.FragmentTransaction")
            )
          es6  (
        "() => {" nl
         I "var replaced = view.querySelectorAll('[x-id=" (str 2) "]')[0];" nl
           "var newChild = document.querySelectorAll('[x-id=" (str 1) "]')[0];" nl
           "replaced.parentNode.replaceChild(newChild, replaced);" nl
         i "}();" nl
  ) 
      }
  }
}

Import "DOMLib.clj"