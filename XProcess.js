var X = {
  flatten_array:function(arr,result) {
    if(!result){
      result = [];
    }
    for(let i = 0,
        length = arr.length; i < length; i++) {
      const value = arr[i];
      if(Array.isArray(value)) {
        for(let i = 0,
            length = value.length; i < length; i++) {
          const value2 = value[i];
          if(Array.isArray(value2)) {
            flatten(value2, result);
          } else  {
            result.push(value2);
          }
        }
      } else  {
        result.push(value);
      }
    }
    return result;
  },
  process:function process (o) {
    var index = 0;
    var value = null;
    var cancelled = false;
    var done = false;
    var running = false;
    var dalayed = false;
    var pending_cnt = 0;
    var finished = [];
    var delay_interval = null;
    var max_interval = null;
    this.parent = null;
    this._lastStartMs = 0;
    this._lastEndMs = 0;
    this.context = {};
    o.loop = (o.loop) || (o.looping);
    var backgroundProcesses = [];
    this._cleanupProcesses = [];
    if(o.background){
      this.runsAtBackground = true;
    }
    if(o.cleanup){
      this.isCleanupProcess = true;
    }
    if((typeof (o.item)) != "undefined"){
      (this.context).item = o.item;
    }
    if((typeof (o.index)) != "undefined"){
      (this.context).index = o.index;
    }
    o.children = (X.flatten_array(o.children)).filter(function(ch) {
      return ((typeof ch) == "object") && (ch.run);
    }.bind(this));
    this.init = function(parent) {
      this.parent = parent;
    };
    this.evalCondition = function(c) {
      if((typeof c) == "function") {
        return c.call(this, this.parent, this);
      }
      return c;
    };
    this.start = this.run = function(set_value,start_after_delay) {
      if(running) {
        console.log("--- WARNING:::: had earlier version running");
        console.log(this, o);
        return ;
      }
      this._lastStartMs = ( new Date()).getTime();
      if(o.condition) {
        var r = this.evalCondition(o.condition);
        if(!r) {
          (this.parent).step();
          return ;
        }
      }
      if((typeof set_value) != undefined){
        value = set_value;
      }
      if((o.delay) && (!delay_interval)) {
        dalayed = true;
        cancelled = false;
        delay_interval = setTimeout(function() {
          if(!cancelled){
            this.run(value, true);
          }
        }.bind(this), (o.delay) * 1000);
        return ;
      } else  {
        if(o.delay) {
          if(!start_after_delay){
            return ;}
          clearTimeout(delay_interval);
          delay_interval = null;
        }
      }
      if((o.maxTime) && (!max_interval)) {
        max_interval = setTimeout(function() {
          this.cancel(true);
          (this.parent).step();
        }.bind(this), (o.maxTime) * 1000);
      }
      cancelled = false;
      done = false;
      running = true;
      (this._cleanupProcesses).length = 0;
      (o.children).forEach(function(c) {
        if(c.runsAtBackground) {
          backgroundProcesses.push(c);
          c.parent = this;
          c.run(value);
        }
        if(c.isCleanupProcess) {
          (this._cleanupProcesses).push(c);
        }
      }.bind(this));
      if(o.parallel) {
        value =  new Array((o.children).length);
        pending_cnt = (((o.children).length) - (backgroundProcesses.length)) - ((this._cleanupProcesses).length);
        finished =  new Array((o.children).length);
        (o.children).forEach(function(c) {
          if((c.runsAtBackground) || (c.isCleanupProcess)){
            return ;}
          c.parent = this;
          c.run(value);
        }.bind(this));
        return ;
      }
      index = - 1;
      this.step();
    };
    this.step = function() {
      if(((cancelled || (!running)) || done) || (o.parallel)){
        return ;}
      index++;
      var ch = (o.children)[index];
      if(ch && ((ch.runsAtBackground) || (ch.isCleanupProcess))) {
        this.step();
        return ;
      }
      if(ch) {
        ch.parent = this;
        ch.run(value);
      } else  {
        backgroundProcesses.forEach(function(p) {
          if(p.cancel){
            p.cancel(true);
          }
        }.bind(this));
        this.runCleanup();
        if(delay_interval){
          clearTimeout(delay_interval);
        }
        delay_interval = null;
        running = false;
        done = true;
        if(o.loop) {
          if(!(isNaN(o.loop))) {
            o.loop--;
            if((o.loop) >= 1) {
              if(o.onLoop){
                o.onLoop(value, this);
              }
              this.run(value);
              return ;
            }
          } else  {
            if(o.onLoop){
              o.onLoop(value, this);
            }
            this.run(value);
            return ;
          }
        }
        if(max_interval){
          clearTimeout(max_interval);
        }
        max_interval = null;
        if(o.onComplete){
          o.onComplete(value, this);
        }
        if((this.parent) && ((this.parent).result)){
          (this.parent).result(this, value);
        }
      }
    };
    this.result = function(child,next_value) {
      if((cancelled || (!running)) || done){
        return ;}
      if(o.parallel) {
        pending_cnt--;
        var idx = (o.children).indexOf(child);
        finished[idx] = true;
        value[idx] = next_value;
        if(pending_cnt == 0) {
          backgroundProcesses.forEach(function(p) {
            if(p.cancel){
              p.cancel(true);
            }
          }.bind(this));
          this.runCleanup();
          running = false;
          done = true;
          if(delay_interval){
            clearTimeout(delay_interval);
          }
          delay_interval = null;
          if(max_interval){
            clearTimeout(max_interval);
          }
          max_interval = null;
          if(o.onComplete){
            o.onComplete(value, this);
          }
          if(this.parent){
            (this.parent).result(this, value);
          }
        }
        return ;
      }
      if((typeof next_value) != undefined){
        value = next_value;
      }
      this.step();
    };
    this.resume = function() {
      if(!cancelled){
        return ;}
      cancelled = false;
      running = true;
      if(o.parallel) {
        (o.children).forEach(function(c) {
          if(c.resume){
            c.resume();
          }
        }.bind(this));
        if(this.parent){
          (this.parent).resume();
        }
        return ;
      }
      var ch = (o.children)[index];
      if(ch) {
        if(c.resume){
          ch.resume();
        }
      }
      if(this.parent){
        (this.parent).resume();
      }
    };
    this.runCleanup = function() {
      (o.children).forEach(function(c) {
        if(c.isCleanupProcess) {
          if((c._lastStartMs) <= (this._lastStartMs)) {
            c.parent = null;
            c.start(value);
          }
        }
      }.bind(this));
    };
    this.cancel = function(no_upstream) {
      if(delay_interval) {
        console.log("has interval on cancel ", delay_interval, this);
      }
      if(cancelled) {
        return ;
      }
      cancelled = true;
      running = false;
      clearTimeout(delay_interval);
      delay_interval = null;
      clearTimeout(max_interval);
      max_interval = null;
      this.runCleanup();
      (o.children).forEach(function(c) {
        if(c.isCleanupProcess) {
        } else  {
          if(c.cancel){
            c.cancel(true);
          }
        }
      }.bind(this));
      if((this.parent) && (!no_upstream)){
        (this.parent).cancel();
      }
      if(o.onCancel){
        o.onCancel(value, this);
      }
    };
    if(o.autostart) {
      setTimeout(function() {
        this.run(value);
      }.bind(this));
    }
    return this;
  },
  fork:function(o) {
    this.parent = null;
    this.init = function(parent) {
      this.parent = parent;
    };
    this.run = function(value) {
      (this.parent).result(this, null);
      ((function() { 
        var e;
        var self = function(){};
        self.prototype = this;
        var _0={};
        _0.children = [
          o.children
        ];
        e = X.process.apply(new self(),[_0]);
        return e;
      }).call(this)
      ).run(value);
    };
    this.cancel = function() {
    };
    this.resume = function() {
    };
    return this;
  },
  audio:function(o) {
    this.parent = null;
    this.init = function(parent) {
      this.parent = parent;
    };
    this.run = function() {
      console.log("Starting ", o.src);
      var did_end = false;
      var id1;
      var sound =  new Howl({
        src:[o.src],
        volume:0,
        onend:function() {
          if(did_end){
            return ;}
          did_end = true;
          (this.parent).result(this, sound);
        }.bind(this)});
      this.sound = sound;
      if(o.seconds) {
        setTimeout(function() {
          did_end = true;
          sound.fade(1, 0, 400, id1);
          (this.parent).result(this, sound);
        }.bind(this), (o.seconds) * 1000);
      }
      id1 = sound.play();
      this.track = id1;
      if(o.seek) {
        sound.seek(o.seek, id1);
      }
      sound.fade(0, 1, 2000, id1);
    };
    this.cancel = function() {
      (this.sound).fade(1, 0, 400, this.track);
    };
    return this;
  },
  velocity:function(o) {
    this.parent = null;
    this.init = function(parent) {
      this.parent = parent;
    };
    this.run = function() {
      Velocity(o.elem, o.params, {
        duration:((o.time) * 1000) || 1000,
        complete:function() {
          (this.parent).result(this, null);
        }.bind(this)});
    };
    this.cancel = function() {
    };
    this.resume = function() {
    };
    return this;
  },
  animate_obj:function(o) {
    this.parent = null;
    this.init = function(parent) {
      this.parent = parent;
    };
    this.run = function() {
      var tween = ((((( new TWEEN.Tween(o.obj)).to(o.to, ((o.time) * 1000) || 3000)).easing(((TWEEN.Easing).Quadratic).InOut)).interpolation((TWEEN.Interpolation).CatmullRom)).onComplete(function() {
        (this.parent).result(this, tween);
      }.bind(this))).start();
      this.tween = tween;
    };
    this.cancel = function() {
      if(this.tween){
        (this.tween).stop();
      }
    };
    this.resume = function() {
      if(this.tween){
        (this.tween).start();
      }
    };
    return this;
  },
  animate:function(o) {
    this.parent = null;
    this.init = function(parent) {
      this.parent = parent;
    };
    this.run = function() {
      var coords = {
        x:o.sx,
        y:o.sy};
      var tween = (((( new TWEEN.Tween(coords)).to({
        x:o.ex,
        y:o.ey}, 1000)).onUpdate(function() {
        if(o.elem) {
          ((o.elem).style).left = (this.x) + "px";
          ((o.elem).style).top = (this.y) + "px";
        }
      })).onComplete(function() {
        (this.parent).result(this, tween);
      }.bind(this))).start();
      this.tween = tween;
    };
    this.cancel = function() {
      (this.tween).stop();
    };
    this.resume = function() {
      (this.tween).start();
    };
    return this;
  },
  load_image:function(o) {
    this.parent = null;
    this.init = function(parent) {
      this.parent = parent;
    };
    this.run = function() {
      var img =  new Image();
      this.img = img;
      img.onload = function() {
        (this.parent).result(this, img);
      }.bind(this);
      img.src = o.src;
    };
    this.cancel = function() {
      clearTimeout(this.wait);
    };
    return this;
  },
  task:function(o) {
    this.parent = null;
    this.init = function(parent) {
      this.parent = parent;
    };
    this.run = function() {
      this.wait = setTimeout(function() {
        (this.parent).result(this, "task completed " + (( new Date()).toString()));
      }.bind(this), (o.timeout) || 100);
    };
    this.cancel = function() {
      clearTimeout(this.wait);
    };
    return this;
  },
  generator_task:function(o) {
    this.parent = null;
    this.init = function(parent) {
      console.log("Parent inited tas with", parent);
      this.parent = parent;
    };
    this.run = function() {
      setTimeout(function() {
        (this.parent).result(this, "task completed " + (( new Date()).toString()));
      }.bind(this), (o.timeout) || 100);
    };
    this.cancel = function() {
    };
    return this;
  },
  rungenerator:function(o) {
    console.log("run generator called ");
    var g = o.gen;
    console.log("-->next called");
    var gen_value = g.next();
    var current_value = gen_value.value;
    while (!(gen_value.done)) {
      current_value = gen_value.value;
      console.log("-->next called");
      gen_value = g.next();
    }
    console.log(current_value);
    return current_value;
  },
  hello:function(o) {
    console.log(o);
  },
  vfade:function(o) {
    return (function() { 
      var e;
      var self = function(){};
      self.prototype = this;
      var _0={};
      _0["use:namespace"]="X";
      _0.children = [
        "\n						"
        ,(function() { 
          var e;
          var self = function(){};
          self.prototype = this;
          var _0={};
          _0["elem"]=o.elem;
          _0["params"]={
            "opacity":0.5,
            "width":"10px"};
          _0.children = [];
          e = X.velocity.apply(new self(),[_0]);
          return e;}).call(this)
        ,"\n						"
        ,(function() { 
          var e;
          var self = function(){};
          self.prototype = this;
          var _0={};
          _0["elem"]=o.elem;
          _0["params"]={
            "opacity":0,
            "width":"1000px"};
          _0.children = [];
          e = X.velocity.apply(new self(),[_0]);
          return e;}).call(this)
        ,"\n			   "

      ];
      e = X.process.apply(new self(),[_0]);
      return e;
    }).call(this)
    ;
  }};
