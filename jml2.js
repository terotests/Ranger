
;(function(_glob) {

    function create_ctx(parent, autoDefine) {
    	var parentCtxBase = function() {}
    	if(parent) {
    		parentCtxBase.prototype = parent;
    	}
    	var o = new parentCtxBase();
    
    	var values = {}
    	var events = {}
        var def_types = {}
    	var is_defined = {}
    
		o.__values = function() {
			return Object.keys(values);
		}

    	o.__param = function(n,ctx) {
    		var val = o[n]
    		if(val && val[0]=="@") {
    			val = val.substring(1)
    			return ctx[val]
    		}
    		return val
    	}

		o.__keys = function() {
			return Object.keys(is_defined)
		}

		o.__typeof = function(n) {
			if(!is_defined[n]) {
				if(parent && parent.__on) {
					return parent.__typeof(n,f)
				}
				return;
			}
            return def_types[n];
		}        
    
    	o.__def = function(n,t) {
    		var _value;
			
			if(is_defined[n]) return;

			is_defined[n] = true;
            def_types[n] = t;

    		Object.defineProperty(o,n,{
    			set : function(v) {
    
    				values[n] = v
    				if( events[n] ) {
    					var list = events[n]
    					for( var i=0; i<list.length; i++) {
    						list[i].call(o, v, o);
    					}
    				}
    			},
    			get : function() {
    				return values[n]
    			}			
    		})
    	}
    	o.__on = function(n, f) {

			if(!is_defined[n]) {
				if(parent && parent.__on) {
					parent.__on(n,f)
				}
				return;
			}

    		if( !events[n] ) events[n] = []
    		events[n].push(f)
    	}
    	o.__fork = function() {
    		return create_ctx(o)
    	}	
    
    	if(autoDefine) {
    		Object.keys(autoDefine).forEach((k)=>{
    			o.__def(k)
    			o[k] = autoDefine[k]
    		})
    	}
    	return o;
    }
    
    if(!_glob["Jinx"]) _glob["Jinx"] = {}
        
	_glob["Jinx"].CreateContext = create_ctx;

})(window);



function init_lisp_core() {
    // LISP core functions
    window.lisp_fns = {

        // loop n times
        "push" : function(list, ctx) {
            // get the ref to array
            var arr = lisp_eval( list[0], ctx );
            var value = lisp_eval( list[1], ctx );
            arr.push(value);
        },

        // loop n times
        "loop" : function(list, ctx) {

            var cnt = lisp_eval( list[0], ctx );
            var f_fn = list.slice(1)
            list = expand_sequence(list, ctx)

            var res = null;
            for(var i=0; i<cnt; i++) {
                res = run_lisp({
                        lisp : true,
                        children : f_fn }, ctx);
            }
            return res;
        },

        // set value
        "[]" : function(list, ctx) {

            list = expand_sequence(list, ctx)
            var o = [];
            for(var i=0; i<list.length; i++) {
                o.push(lisp_eval(list[i]));
            }
            return o;
        },

        // create array
        "set" : function(list, ctx) {

            var v_name = lisp_eval( list[0], ctx );
            var v_value = lisp_eval( list[1], ctx );

            ctx[v_name] = v_value;

        },

        // create array
        "length" : function(list, ctx) {

            var v = lisp_eval( list[0], ctx );
            return v.length;
        },       

        // create array
        "on" : function(list, ctx) {

            // .. 

            var v_name = lisp_eval( list[0], ctx );
            var f_fn = list[1];

            ctx.__on(v_name, function() {
                run_lisp( f_fn, ctx);
            })

        },           

        // create object
        "{}" : function(list, ctx) {

            list = expand_sequence(list, ctx)
            var o = {};
            for(var i=0; i<list.length; i+=2) {
                var n = lisp_eval(list[i]);
                var v = lisp_eval(list[i+1]);
                o[n] = v;
            }
            return o;
        },

        "typeof" : function(list, ctx) {

            var v = list[0];
            if(typeof(v)=="object") {
                if(v.vref) {
                    return ctx.__typeof(v.vref)
                }
            }

            var v = lisp_eval(list[0], ctx);
            if(typeof(v)=="object") {
                if(v.vref) {
                    return ctx.__typeof(v.vref)
                }
            }
            return typeof(v);
        },

        // (def foo "bar")
        "def" : function(list, ctx) {
            var var_list = list[0];

            if((typeof(var_list) == "object") && var_list.children) {
                var_list.children.forEach(function(vdef) {

                    var n = vdef.children[0];
                    if(n.vref) n = n.vref;

                    var v = lisp_eval( vdef.children[1], ctx );
                    ctx.__def(n, vdef.children[0].type);
                    ctx[n] = v;
                })
            } else {
                for(var i=0; i<list.length; i+=2) {
                    var n = list[i];
                    if(n.vref) n = n.vref;

                    var v = lisp_eval( list[i+1], ctx  )
                    ctx.__def(n, list[i].type);
                    ctx[n] = v;                   
                }
            }
        },     

        // how to call the function ?? 
        "defun": function(list, ctx) {
            
            var f_name = list[0]
            var params = list[1];
            var body   = list[2];

            ctx.__def(f_name, f_name.type);
            // ok, a bit trivial...
            ctx[f_name.vref] = {
                params : params,
                body : body,
                ctx : ctx  // lexical context
            }

        },
        "defn": function(list, ctx) {
            
            var f_name = list[0]
            var params = list[1];
            var body   = list[2];

            // return type ??
            ctx.__def(f_name, f_name.type);
            // ok, a bit trivial...
            ctx[f_name.vref] = {
                params : params,
                body : body,
                ctx : ctx  // lexical context
            }

        },    
        "let" : function(list, ctx) {
            var var_list = list[0];

            ctx = ctx.__fork();

            /*
            if(ctx.__fork) {   
                // special case if fork function exists 
                ctx.__fork();
            } else {
                var new_ctx_fn = function() {};
                new_ctx_fn.prototype = ctx;
                ctx = new new_ctx_fn(); 
            }*/

            if(var_list) {
                var_list.children.forEach(function(vdef) {

                    var n = vdef.children[0];
                    if(n.vref) n = n.vref;

                    var v = lisp_eval( vdef.children[1], ctx);
                    /*
                    if(typeof(v)=="object") {
                        if(v.lisp) {
                            v = run_lisp(v, ctx)
                        } else {
                            if(v.vref) {
                                v = ctx[v.vref]
                            } 
                        }

                    }
                    */
                    ctx.__def(n, vdef.children[0].type);
                    ctx[n] = v;
                })
            }
            var rest = list.slice(1);
            if(rest && rest.length) {
                return run_lisp( {
                                    lisp: true,
                                    children : rest }, ctx );
            }
        },    
        "%" : function(list, ctx) {
            list = expand_sequence(list,ctx);
            var a = list[0];
            var b = list[1];
            return lisp_eval(a,ctx) % lisp_eval(b,ctx)
        },   
        "!" : function(list, ctx) {
            return !lisp_eval(list[0],ctx);
        },              
        "*" : function(list, ctx) {
            return expand_sequence(list,ctx).reduce(function(a,b) {
                return lisp_eval(a,ctx) * lisp_eval(b,ctx);
            })
        },    
        "-" : function(list, ctx) {
            return expand_sequence(list,ctx).reduce(function(a,b) {
                return lisp_eval(a,ctx) - lisp_eval(b,ctx)
            })
        },    
        "+" : function(list, ctx) {
            return expand_sequence(list,ctx).reduce(function(a,b) {
                return lisp_eval(a,ctx) + lisp_eval(b,ctx);
            })
        },
        "concatenate" : function(list, ctx) {
            return expand_sequence(list,ctx).map(function(x) { return lisp_eval(x,ctx)}).join("");
        },

        // can you expand a list 
        "expand" : function(list, ctx) {
            /*
            var orig = lisp_eval(list,ctx);
            orig.children.forEach()
            // is it possible to expand list ? 

            var val = list.map(function(x) { return lisp_eval(x,ctx)}).join("");
            return val;
            */
        }, 

        "list" : function(list, ctx) {
            return list;

        },    

        "apply" : function(list, ctx) {

            return run_lisp( {
                                lisp : true,
                                children : expand_sequence(list, ctx)
                            }, ctx);

        },

        "uppercase" : function(list, ctx) {
            var str_value = lisp_eval(list[0],ctx);
            return str_value.toUpperCase();
        },    

        "==" : function(list, ctx) {
            return lisp_eval(list[0], ctx) == lisp_eval(list[1], ctx);
        },  

        ">" : function(list, ctx) {
            return lisp_eval(list[0], ctx) > lisp_eval(list[1], ctx);
        },     

        "<" : function(list, ctx) {
            return lisp_eval(list[0], ctx) < lisp_eval(list[1], ctx);
        },         

        "if" : function(list, ctx) {

            // is it possible to expand list ? 
            var condition = lisp_eval(list[0],ctx);
            if(condition === true) {
                return lisp_eval(list[1],ctx);
            } else {
                if(list[2]) return lisp_eval(list[2],ctx);
            }
        },        

        "." : function(list, ctx) {

            // is it possible to expand list ? 
            var the_obj = lisp_eval(list[0],ctx);
            var the_key = lisp_eval(list[1],ctx);
            return the_obj[the_key];
        },       

        "join_array" : function(list, ctx) {

            // is it possible to expand list ? 
            var the_list = lisp_eval(list[0],ctx);

            var val = expand_sequence(the_list,ctx).map(function(x) { return lisp_eval(x,ctx)}).join("");
            return val;
        },    

        "join" : function(list, ctx) {

            // is it possible to expand list ? 
            var the_list = list;

            if(list.length==1) {
                if( typeof( list[0]) == "object" ) {
                    the_list = lisp_eval(list[0],ctx);
                }
            }
            var val = expand_sequence(the_list,ctx).map(function(x) { return lisp_eval(x,ctx)}).join("");
            return val;
        },    

        "join_with" : function(list, ctx) {

            // is it possible to expand list ? 
            var the_list = list;

            if(list.length==2) {
                if( typeof( list[0]) == "object" ) {
                    the_list = lisp_eval(list[0],ctx);
                }
            }
            var comma = lisp_eval(list[1]);
    
            var val = expand_sequence(the_list,ctx).map(function(x) { return lisp_eval(x,ctx)}).join(comma);
            return val;
        },     
        "log" : function(list, ctx) {
            console.log("log", list.join());
        },
        "console" : function(list, ctx) {
            console.log("console", lisp_eval(list[0], ctx));
        },    
        "array" : function(list, ctx) {
            return expand_sequence(list,ctx).map(function(x) { return lisp_eval(x,ctx)})
        },    

        "smap" : function(list, ctx) {
            var op = list[0];    // lisp operator to apply to array

            if( list.length == 2 ) {
                if( (typeof(list[1]) == "object") )  {
                    var value_list = expand_sequence(lisp_eval(list[1], ctx), ctx);
                } else {
                    var value_list = expand_sequence(list.splice(1), ctx);
                }
            } else {
                var value_list = expand_sequence(list.splice(1), ctx); // run_lisp( list[1], ctx ); // evaluate
            }
            

            return value_list.map(function(item) {
                
                // create function call
                var new_fn = {
                    lisp : true,
                    children : [
                        op,
                        item
                    ] 
                }
                var res = run_lisp( new_fn, ctx); 
                return res;
            })
        },    
        "map" : function(list, ctx) {
            list = expand_sequence(list, ctx);
            var op = list[0];    // lisp operator to apply to array
            var value_list = lisp_eval( list[1], ctx ); // evaluate
            return value_list.map(function(item) {
                
                // create function call
                var new_fn = {
                    lisp : true,
                    children : [
                        op,
                        item
                    ] 
                }
                var res = run_lisp( new_fn, ctx); 
                return res;
            })
        },     
        "filter" : function(list, ctx) {
            list = expand_sequence(list, ctx);
            var op = list[0];    // lisp operator to apply to array
            var value_list = lisp_eval( list[1], ctx ); // evaluate
            return value_list.filter(function(item) {
                
                // create function call
                var new_fn = {
                    lisp : true,
                    children : [
                        op,
                        item
                    ] 
                }
                var res = run_lisp( new_fn, ctx); 
                return res;
            })
        },           
        "reduce" : function(list, ctx) {
            var op = list[0];    // lisp operator to apply to array
            var value_list = run_lisp( list[1], ctx ); // evaluate
            return value_list.reduce(function(a,b) {
                
                // create function call
                var new_fn = {
                    lisp : true,
                    children : [
                        op,
                        a,
                        b
                    ] 
                }
                var res = run_lisp( new_fn, ctx); 
                return res;
            })
        },        
        "add_to_dom" : function(list, ctx) {
            var id = list[0];
            var dom = document.getElementById(id);
            if(dom) {
                var t = dom.innerHTML;
                var elems = list.slice(1);
                dom.innerHTML = t + expand_sequence(elems,ctx).map(function(x) { return lisp_eval(x,ctx)}).join("");
            }
        }
    }
}

function lisp_eval(o,ctx) {
    if(typeof(o)=="object"  && (o.lisp)) {

        if(o.children[0].vref == "lambda" || (o.children[0].vref == "=>")) {
            var fn_data = {
                params : o.children[1],
                body   : {
                        lisp : true,
                        children : o.children.slice(2)
                },
                ctx : ctx
            }
            return fn_data;
        }        
        return lisp_eval( run_lisp(o, ctx), ctx );
        // if(typeof(ref) == "object" )
    } else {
        if(typeof(o)=="object"  && (o.vref)) {
            return ctx[o.vref];
        } else {
            return o;
        }     
    }    
}

// function parameters as list [] can contain "&" reference which expands the list
// to contain rest of the arguments for the function
function expand_sequence(list, ctx) {
    
   for( var i=0; i < list.length; i++ ) {   
        if(typeof(list[i])=="object") {
            if(list[i].vref =="&") {
                // then create new list...
                var begin_list = list.slice(0,i);
                var end_list = list.slice(i+1); // list.slice(0,list.length-1);
                var new_list = begin_list;
                var other_list = ctx["&"];
                if(other_list && other_list.length) {
                    new_list = new_list.concat( other_list );
                }
                new_list = new_list.concat(end_list);
                return new_list;
            }
        }
   }
   return list;
}



// running list of commands...
function run_lisp(node, ctx) {

    if( typeof(node)=="object" && node.vref ) {
        return ctx[node.vref];
    }

    var fn_name = node.children[0];
    var fn;

    // information for the debugger;
    if(ctx) ctx.__lisp_cmd = {
        node : node,
        ctx : ctx
    }

    if(typeof(fn_name)=="object" && fn_name.lisp) {

        // check if this is lambda!
        if(fn_name.children[0].vref == "lambda" || (fn_name.children[0].vref == "=>")) {

            var fn_data = {
                params : fn_name.children[1],
                body   : {
                        lisp : true,
                        children : fn_name.children.slice(2)
                }
            }

            ctx = ctx.__fork();
            /*
            var new_ctx_fn = function() {};
            new_ctx_fn.prototype = ctx;
            ctx = new new_ctx_fn();         
            */

            for( var ii=0; ii < fn_data.params.children.length; ii++ ) {
                var p = fn_data.params.children[ii];
                var v = node.children[ii+1];

                if(p.vref == "&") {
                        // then pick all the rest into &
                    ctx[p.vref] = node.children.slice(ii+1);
                    break;
                }             
                if(v.vref) {
                    ctx[p.vref] = ctx[v.vref]
                } else {
                    ctx[p.vref] = v
                }
            }
            fn_data.ctx = ctx;

            return run_lisp( fn_data.body, ctx);            
        }
        
        var res = null;
        node.children.map(function(n) {
            res = run_lisp(n, ctx)
        });
        return res;
    }

    if(typeof(fn_name)=="object" && fn_name.vref) {
        var fn_name = fn_name.vref;
    } 

    if(fn = lisp_fns[fn_name]) {
        return fn(node.children.slice(1), ctx);
    }

    // can you then evaluate
    // ( + 1 & ) --> so that you are going to walk all the elements....

    // assume a funtion then...
    if(ctx[fn_name]) {

        if(node.children.length == 1) {
            return ctx[fn_name];
        }
        
        var fn_data = ctx[fn_name];

        if(fn_data.children) {
            if(fn_data.children[0].vref == "lambda" || (fn_data.children[0].vref == "=>")) {
                fn_data = {
                    params : fn_data.children[1],
                    body   : {
                            lisp : true,
                            children : fn_data.children.slice(2)
                    },
                    ctx : fn_data.ctx
                }
            }
        }


        var runtime_ctx = ctx;

        ctx = ctx.__fork();

        //var new_ctx_fn = function() {};
        //new_ctx_fn.prototype = fn_data.ctx;
        //ctx = new new_ctx_fn();         

        for( var ii=0; ii < fn_data.params.children.length; ii++ ) {
            var p = fn_data.params.children[ii];
            var v = node.children[ii+1];

            if(p.vref == "&") {
                // then pick all the rest into &
                // note: must be evaluated in local context because the caller can not
                // evaluate the references correctly in their own context
                ctx[p.vref] = node.children.slice(ii+1).map(function(p) {
                    return lisp_eval( p, runtime_ctx )
                })
                break;
            }             
            if(v.vref) {
                ctx[p.vref] = runtime_ctx[v.vref]
            } else {
                // eval params et runtime context
                ctx[p.vref] = lisp_eval( v, runtime_ctx )
            }
        }
        return run_lisp( fn_data.body, ctx);

    }

    throw "ERROR could not find "+fn_name;

}


// ********************************************************
// The parser code below
// ********************************************************

function JMLParser(s, obj) {

	var l = s.length;
	var len = l;
	var rootNode = null;
	var active_node = null;
	var parents = [];
	var tag_list = [];

	var start_index = 0;

	var tag_depth = 0;
    var brace_cnt = 0;
    var parenth_cnt = 0;

    var rootNode = null;
    var curr_node = null;

	for(var i=start_index; i<l; i++) {
	    tag_expression_parser();
	}

	if( (tag_depth!=0) || (brace_cnt != 0) || (parenth_cnt!=0)) {
	     throw "Invalid code";
	}

    rootNode._code = s;

	return rootNode;


    // then walk the attributes...
	function tag_attr_parser() {

        while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 

        if(s.charCodeAt(i)==40) {
            parenth_cnt++;
            i++;
            // remove space
            var last_i;
            var do_break = false;
            var attr_name;

            // while( !do_break && (i < len ))  {
            while( i < len )  {
                last_i = i;
                while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 
                // parse name of the attribute
                var sp = i;
                var ep = i;
                var c;
                while( (i < len ) && ( (c = s.charCodeAt(i)) >= 65) && (c <=122)) i++;             
                ep = i;

                if( i < len && (ep > sp) ) {
                    
                    // attr_name = s.substr(sp, ep-sp);

                    var an_sp = sp;
                    var an_ep = ep;
                    // attr_name = s.substring(sp, ep);

                    // then find the : 
                    while( (i < len ) && ( ( c  = s.charCodeAt(i) ) != 58 ) ) i++; 
                    // skip :
                    if( c == 58 ) i++;

                    // test if the value is in parenthesis...
                    // -- remove spaces...
                    while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 

                    var fc = s.charCodeAt(i);
                    // "
                    if(fc==34) {
                        i++;
                        var sp = i;
                        var ep = i;
                        var c;
                        while( (i < len ) && ( s.charCodeAt(i)!=34) ) i++;  
                        ep = i;
                        if( i < len && (ep > sp) ) {
                            curr_node.attrs[s.substring(an_sp, an_ep)] = s.substring(sp, ep);
                        }                        
                    } else {

                        // if lisp expression into attribute...
                        if(fc==40) {
                            tag_depth++;
                            
                            var c_node = curr_node;

                            var attr_node =  { lisp:true, children : []};
                            curr_node = attr_node;

                            parents.push(curr_node);              
                            i++;
                            parse_lisp_expression();

                            // ... and then place the lisp node into attr_name
                            curr_node.attrs[s.substring(an_sp, an_ep)] = attr_node;

                            tag_depth--;
                        } else {

                            // then read the value of attribute
                            var sp = i;
                            var ep = i;
                            var c;
                            while( (i < len ) &&
                                    ( (( (c = s.charCodeAt(i)) >= 65) && (c <=90)) 
                                        || ( (c >= 48) && (c<=57) )
                                        || ( (c == 95)  )
                                        || ( (c == 46)  )
                                        || ( (c == 64)  )
                                        || ( (c >= 97) && (c<=122) )
                                    ) ) i++;  
                            ep = i;
                            if( i < len && (ep > sp) ) {
                                curr_node.attrs[s.substring(an_sp, an_ep)] = s.substring(sp, ep);
                            }
                        }
                    }
                }

                if(s.charCodeAt(i)==41) {
                    // do_break = true;
                    i++;
                    parenth_cnt--;
                    break;
                    // parenth_cnt--;
                    // console.log("attributes end");
                }
                if(i==last_i) i++;
            }

        }
	}

	function tag_body_parser() {

        // console.log("body parser close to ", s.substr(i-5,10));

	    var c;
	    while( (i < len ) 
	           && (
	                ( (c = s.charCodeAt(i) ) <= 32 ) ) 
	           ) i++;

        // --==(
        if( (s.charCodeAt(i) == 45) && (s.charCodeAt(i+1) == 45) && (s.charCodeAt(i+2) == 61) && (s.charCodeAt(i+3) == 61) && (s.charCodeAt(i+4) == 40) ) {

            i += 5;
            // read text content
            var sp = i;
            var ep = i;

            while( (i < len) && !((s.charCodeAt(i) != 40) && (s.charCodeAt(i+1) == 61) && (s.charCodeAt(i+2) == 61) && (s.charCodeAt(i+3) == 45) && (s.charCodeAt(i+4) == 45))  ) i++;

            ep = i;

            if( i < len && (ep > sp) ) {
                curr_node.text = s.substring(sp, ep);
            }  
            i += 5;
        }
        
	    if( s.charCodeAt(i) != 123 ) {
            return;
	    }
	    i++;
        brace_cnt++;
	    // then parse expressions from the body
	    tag_expression_parser()
	}

    function parse_lisp_expression() {

        parenth_cnt++;

        while( i < len )  {

            last_i = i;
            
            // skip empty space
            while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 

            var c = s.charCodeAt(i);

	    	// read comment... 
	    	if( (s.charCodeAt(i) == 59)  ) {
                // read until end of line...
                while( (i < len ) && ( s.charCodeAt(i) > 31 ) ) i++; 
                var c = s.charCodeAt(i);
	    	}            

            // check for character values
            // " or ` or '  
            if( (c==34) || (c==96) || (c==36) ) {
                var end_d = c;
                i++;
                var sp = i;
                var ep = i;                
                while( (i < len ) && ( s.charCodeAt(i) != end_d ) ) i++; 
                ep = i;
                if( i < len ) {
                    // string ... 
                    curr_node.children.push(s.substring(sp,ep));
                }
                i++;
                continue;
            }

            // TODO: add possible numeric values here...

            // ( means a new list starts inside list...
	    	if( (s.charCodeAt(i) == 40) ) {

	            tag_depth++;

                if(!curr_node) {
                    // lisp AST syntax
                    // ( code a b c d )
                    curr_node = { lisp:true, children : [], __sp : i  };
                    rootNode = curr_node;
                    parents.push(curr_node);
                } else {

                    var new_node = { lisp:true, children : [], __sp : i  };
                    curr_node.children.push(new_node);
                    curr_node = new_node;
                    parents.push(curr_node);
                }                
                i++;
                parse_lisp_expression();
                tag_depth--;
                continue;
	    	}           

            // then look for legal variable name characters or numbers...
            var sp = i;
            var ep = i;
            var c;
            var fc = c = s.charCodeAt(i);

            var idx = curr_node.children.length;
            // (fc==45) || 
            // simple number detection, does not yet take into account all different number formats

            if( ((fc==45) && ((s.charCodeAt(i+1) >=46) && (s.charCodeAt(i+1) <=57) )) || ((fc >= 48) && (fc<=57)  ) ) {
                // spaces, ) ( are not allowed
                while( (i < len ) && (( (c=s.charCodeAt(i)) > 32 ) && (c!=40) && (c!=41)) ) i++; 
                ep = i;
                if( i < len && (ep > sp) ) {
                    curr_node.children.push(parseFloat(s.substring(sp,ep)))
                }

            } else {

                // check for constants true and false
                if( (s.charCodeAt(i) == 116) && (s.charCodeAt(i+1) == 114) && (s.charCodeAt(i+2) == 117) && (s.charCodeAt(i+3) == 101))  {
                    i+=4;
                    curr_node.children.push(true);
                    continue;
                }
                if( (s.charCodeAt(i) == 102) && (s.charCodeAt(i+1) == 97) && (s.charCodeAt(i+2) == 108) && (s.charCodeAt(i+3) == 115) && (s.charCodeAt(i+4) == 101))  {
                    i+=5;
                    curr_node.children.push(false);
                    continue;
                }                

                // now the special case: there could be XML 
                // < + alphanumeric character a-zA-Z
                if( (s.charCodeAt(i) == 60) )  {
                    var second = s.charCodeAt(i+1);
                    if( ((second >=65) && (second<=90)) ||
                        ((second >=97) && (second<=122)) ) {
                        // possibly XML, so parse it...
                        xml_tag_expression_parser();
                        continue;
                    }
                    //continue;
                }    


                // read variable definition...
                // spaces, ) ( are not allowed
                while( (i < len ) && (( (c=s.charCodeAt(i)) > 32 ) && (c!=58) && (c!=40) && (c!=41)) ) i++; 
                ep = i;


                // skip empty space
                while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++;                 

                // if : then type definition is available
                if(c == 58) {
                    i++;
                    // skip empty space
                    while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++;   
                    // read variable type spaces, ) ( are not allowed
                    var vt_sp = i;
                    var vt_ep = i;
                    while( (i < len ) && (( (c=s.charCodeAt(i)) > 32 ) && (c!=58) && (c!=40) && (c!=41)) ) i++; 
                    vt_ep = i;
                    var type_name = s.substring(vt_sp,vt_ep);

                    curr_node.children.push({
                            vref : s.substring(sp,ep),
                            type : type_name
                        });                    

                } else {
                    if( i < len && (ep > sp) ) {
                        // console.log("Variable ref: "+s.substring(sp,ep))
                        curr_node.children.push({
                                vref : s.substring(sp,ep)
                            });
                    }
                }


            }



            // this expression ends...
            if(s.charCodeAt(i)==41) {
                // do_break = true;
                i++;
                parenth_cnt--;
                // tag_depth--;
                parents.pop();
                if(curr_node) {
                    curr_node.__ep = i;
                }
                if(parents.length) {
                    curr_node = parents[parents.length-1];
                } else {
                    curr_node = rootNode;
                }                

                // exit expression parsing for now...
                if(curr_node.xml) return;

                break;
                // parenth_cnt--;
                // console.log("attributes end");
            }
            if(i==last_i) i++;
        }        

    }

	function tag_expression_parser() {

	    var do_break = false;		
	    var tag;
	    while( (i < len)  ) {
	        
            var last_i = i;
            var pipe_operator = false;
            var macro_operator = false;

	    	while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 

	    	// } ends tag body
	    	if( s.charCodeAt(i) == 125 ) {
                // do_break = true;
                brace_cnt--;
                i++;
                break;
	    	}

            // detect XML expression
            // xml_tag_expression_parser();
	    	if( (s.charCodeAt(i) == 60) ) {
                xml_tag_expression_parser();
	    	}

	    	// LISP expressions coming...
	    	if( (s.charCodeAt(i) == 40) ) {

	            tag_depth++;

                if(!curr_node) {
                    // lisp AST syntax
                    // ( code a b c d )
                    curr_node = { lisp:true, children : [] };
                    rootNode = curr_node;
                    parents.push(curr_node);
                } else {
                    var new_node = { lisp:true, children : [] };
                    curr_node.children.push(new_node);
                    curr_node = new_node;
                    parents.push(curr_node);
                }                
                i++;
                parse_lisp_expression();

                tag_depth--;
	    	}
            

	    	// read comment... 
	    	if( (s.charCodeAt(i) == 47) && (s.charCodeAt(i+1) == 47) ) {
                // read until end of line...
                while( (i < len ) && ( s.charCodeAt(i) > 31 ) ) i++; 
	    	}

            // |> pipe operator
	    	if( (s.charCodeAt(i) == 124 ) && (s.charCodeAt(i+1) == 62) ) {
                pipe_operator = true;
                i+=2;
                while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 
	    	}
            // ! macro operator
	    	if( (s.charCodeAt(i) == 33 ) ) {
                macro_operator = true;
                i++;
                while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 
	    	}
	    	
	    	var sp = i;
	    	var ep = i;
	    	var c = s.charCodeAt(i);
            // while( (i < len ) && ( ( ( (c = s.charCodeAt(i)) >= 65) && (c <=122)) || (c >= 48) && (c<=57) )  ) i++;
            // while( (i < len ) && ( ( (c>= 65) && (c<=122) ) || (c >= 48) && (c<=57) )  ) { 
	    	while( (i < len ) && ( ( (c>= 65) && (c<=122) ) || (c >= 48) && (c<=57) )  ) {
                i++;
                c = s.charCodeAt(i);
            } 
	        ep = i;
	        
	        if( i < len && (ep > sp) ) {

	            tag_depth++;

                if(!curr_node) {
                    curr_node = { name : s.substring(sp, ep), children : [], attrs :{}, macro:macro_operator, pipe:pipe_operator };
                    rootNode = curr_node;
                    parents.push(curr_node);
                } else {
                    var new_node = { name : s.substring(sp, ep), children : [], attrs :{}, macro:macro_operator, pipe:pipe_operator };
                    curr_node.children.push(new_node);
                    curr_node = new_node;
                    parents.push(curr_node);
                }
	            
	            tag_attr_parser();
	            tag_body_parser();

                tag_depth--;

                var p = parents.pop();
                if(parents.length) {
                    curr_node = parents[parents.length-1];
                } else {
                    curr_node = rootNode;
                }

	        }
            if(last_i == i) i++;
	    }      
	}

    // then walk the attributes...
	function xml_tag_attr_parser() {

        // remove space
        var last_i;
        var do_break = false;
        var attr_name;

        // while( !do_break && (i < len ))  {
        while( i < len )  {
            last_i = i;

            // remove spaces...
            while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 
            
            var cc1 = s.charCodeAt(i);
            var cc2 = s.charCodeAt(i+1);

            // ">"
            if( cc1 == 62 ) {
                break;
            }

            // "/>"
            if( (cc1 == 47) && (cc2 == 62) ) {
                i=i+2;
                do_break = true;
                tag_list.pop();
                break;
            }

            // attribute name start position here, look for the end of the attr name
            var sp = i;
            var ep = i;
            var c;
            // approximately legal name chars
            while( (i < len ) && ( (((c = s.charCodeAt(i)) >= 65) && (c <=122)) || (c==45) )) i++;             
            ep = i;

            if( i < len && (ep > sp) ) {
                
                // attr_name = s.substr(sp, ep-sp);

                var an_sp = sp;
                var an_ep = ep;
                // attr_name = s.substring(sp, ep);

                // then find the = 
                while( (i < len ) && ( ( c  = s.charCodeAt(i) ) != 61 ) ) i++; 
                // skip :
                if( c == 61 ) i++;

                // -- remove spaces...
                while( (i < len ) && ( s.charCodeAt(i) <= 32 ) ) i++; 

    
                // then, if there is ( first treate it as LISP expression
                if(s.charCodeAt(i)==40) {

                    // parse the lisp expression into the attribute of XML node...
                    tag_depth++;
                    var c_node = curr_node;
                    var attr_node =  { lisp:true, children : []};
                    curr_node = attr_node;
                    parents.push(curr_node);              
                    i++;
                    parse_lisp_expression();
                    curr_node.attrs[s.substring(an_sp, an_ep)] = attr_node;
                    tag_depth--;              
                    continue;
                }

                // find starting "
                if(s.charCodeAt(i)==34) {
                    i++;
                    var sp = i;
                    var ep = i;
                    var c;
                    // find ending "
                    while( (i < len ) && ( s.charCodeAt(i)!=34) ) i++;  
                    ep = i;
                    if( i < len && (ep > sp) ) {
                        curr_node.attrs[s.substring(an_sp, an_ep)] = s.substring(sp, ep);
                    }                        
                    i++;
                } 
            }
            if(i==last_i) i++;
        }

        return do_break;

	}

	function xml_tag_expression_parser() {

	    var do_break = false;		
	    var tag;
	    while( (i < len)  ) {
	        
            var last_i = i;

            var cc1 = s.charCodeAt(i);
            var cc2 = s.charCodeAt(i+1);

            // ">"
            if( cc1 == 62 ) {
                i++; // skip
                cc1 = s.charCodeAt(i);
                cc2 = s.charCodeAt(i+1);                
            }

            // console.log(s.charAt(i));
            // "/>"
            if( (cc1 == 47) && (cc2 == 62) ) {
                // tag ends...
                tag_depth--;

                var p = parents.pop();
                if(parents.length) {
                    curr_node = parents[parents.length-1];
                } else {
                    curr_node = rootNode;
                }

                tag_list.pop();

                if(tag_depth < 0) throw "Invalid XML";
                if(tag_list.length == 0) return;
                if(curr_node.lisp) return;
            }       

            // "</"
            if( (cc1 == 60) && (cc2 == 47) ) {

                // console.log("got ending...");

                i+=2;

                var sp = i;
                var ep = i;
                var c;
                // approximately legal name chars
                while( (i < len ) &&
                        ( (( (c = s.charCodeAt(i)) >= 65) && (c <=90)) // upper case alpha
                            || ( (c >= 48) && (c<=57) ) // numbers
                            || ( (c == 95)  )  // _
                            || ( (c == 46)  )  // .
                            || ( (c == 64)  )  // @
                            || ( (c >= 97) && (c<=122) ) // lower case alpha
                        ) ) i++;  

                ep = i;

                var end_tag_name = s.substring(sp,ep);

                // console.log("tag ends : ", end_tag_name);

                if(curr_node.xml && (curr_node.name != end_tag_name)) {
                    throw "tag end mismatch, expected "+curr_node.name+" got "+end_tag_name;
                }
                
                // tag ends...
                tag_depth--;

                var p = parents.pop();
                if(parents.length) {
                    curr_node = parents[parents.length-1];
                } else {
                    curr_node = rootNode;
                }
                tag_list.pop();
                i++;
                if(tag_depth < 0) throw "Invalid XML, depth < 0 ";
                if(tag_list.length == 0) return;
                if(curr_node.lisp) {
                    
                    return;
                }
            }                   

	    	// skip comment... <!--
	    	if( (cc1 == 60) && (cc2==33) && (s.charCodeAt(i+2)==45) && (s.charCodeAt(i+3)==45)  ) {
                // console.log("<!-- comment");
                i+=3;
                // read until end of comment -->
                while( (i < len ) && !( ( s.charCodeAt(i) ==45 ) && (s.charCodeAt(i+1) ==45 ) && (s.charCodeAt(i+2) ==62 )) ) i++; 
	    	}            


            // <![CDATA[
            if( (s.charCodeAt(i) == 60) && (s.charCodeAt(i+1) == 33) && (s.charCodeAt(i+2) == 91) && (s.charCodeAt(i+3) == 67) && (s.charCodeAt(i+4) == 68) && (s.charCodeAt(i+5) == 65) && (s.charCodeAt(i+6) == 84) && (s.charCodeAt(i+7) == 65) && (s.charCodeAt(i+8) == 91)    ) {
                i += 9;
                // read text content
                var sp = i;
                var ep = i;

                // "]]>"
                while( (i < len) && !((s.charCodeAt(i) == 93) && (s.charCodeAt(i+1) == 93) && (s.charCodeAt(i+2) == 62))  ) i++;

                ep = i;

                if( i < len && (ep > sp) ) {
                    if(!curr_node.text) curr_node.text = "";
                    curr_node.text += s.substring(sp, ep);
                } else {
                }
                i += 3;
                continue;
            }   

            // if lisp expression
            if(s.charCodeAt(i)==40) {

                tag_depth++;
                var c_node = curr_node;
                var t_node =  { lisp:true, children : []};
                curr_node = t_node;
                parents.push(curr_node);              
                i++;
                parse_lisp_expression();
                curr_node.children.push( t_node );
                tag_depth--;   
                continue;
            }                

	    	// new tag is about to begin....
	    	if( s.charCodeAt(i) == 60 ) {
                // get the name of the tag...
                i++;
                var sp = i;
                var ep = i;
                var c;
                // approximately legal name chars
                while( (i < len ) &&
                        ( (( (c = s.charCodeAt(i)) >= 65) && (c <=90)) // upper case alpha
                            || ( (c >= 48) && (c<=57) ) // numbers
                            || ( (c == 95)  )  // _
                            || ( (c == 46)  )  // .
                            || ( (c == 64)  )  // @
                            || ( (c >= 97) && (c<=122) ) // lower case alpha
                        ) ) i++;  

                ep = i;
                if( i < len && (ep > sp) ) {

                    var tag_name = s.substring(sp, ep);
                    tag_depth++;
                    
                    // console.log("Tag starts ", tag_name);

                    if(!curr_node) {
                        curr_node = { name : tag_name, attrs :{}, children : [], xml:true};
                        rootNode = curr_node;
                        parents.push(curr_node);
                    } else {
                        var new_node = { name : tag_name, attrs :{}, children : [], xml:true};
                        curr_node.children.push(new_node);
                        curr_node = new_node;
                        parents.push(curr_node);
                    }               

                    tag_list.push(tag_name);

                    if(xml_tag_attr_parser()) {

                        // attr parser ended because the tag ended
                        tag_depth--;

                        var p = parents.pop();
                        if(parents.length) {
                            curr_node = parents[parents.length-1];
                        } else {
                            curr_node = rootNode;
                        }

                        if(tag_depth < 0) throw "Invalid XML, depth < 0 ";

                    }
                }

	    	} else {
                // do not read in the tag character data at the moment...

                var sp = i;
                var ep = i;
                // read text content...
                while( (i < len) && (s.charCodeAt(i) != 60) && (s.charCodeAt(i) != 40)  ) i++;
                ep = i;

                // then push a text node to XML...
                curr_node.children.push({cdata : s.substring(sp,ep)});


                //if(!curr_node.text) curr_node.text="";
                //curr_node.text += s.substring(sp,ep);

                /*
                if(s.charCodeAt(i)==40) {

                    // parse the lisp expression into the attribute of XML node...
                    tag_depth++;
                    var c_node = curr_node;
                    var attr_node =  { lisp:true, children : []};
                    curr_node = attr_node;
                    parents.push(curr_node);              
                    i++;
                    parse_lisp_expression();
                    curr_node.attrs[s.substring(an_sp, an_ep)] = attr_node;
                    tag_depth--;              
                    continue;
                }                
                */

            }
            if(last_i == i) i++;
	    }      
	}

}
