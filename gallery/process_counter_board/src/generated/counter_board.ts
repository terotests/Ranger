type union_Any = RangerProcessBase|ProcessIdRegistry|ProcessNameRegistry|ProcessUiHost|ProcessRuntime|RangerFieldDescriptor|RangerClassDescriptor|ProcessTreeView|CounterRowProcess|CounterBoardPage|CounterRowProcess__Registry|CounterBoardPage__Registry|number|string|boolean|number;
export class RangerProcessBase  {
  __rangerId!: number;
  __rangerParentId!: number;
  __rangerTypeId!: number;
  __rangerClassName!: string;
  __rangerPath!: string;
  __rangerStateGeneration!: number;
  __rangerParent?: RangerProcessBase;
  __rangerChildren!: Array<RangerProcessBase>;
  constructor() {
    this.__rangerId = 0;
    this.__rangerParentId = 0;
    this.__rangerTypeId = 0;
    this.__rangerClassName = "";
    this.__rangerPath = "";
    this.__rangerStateGeneration = 0;
    this.__rangerChildren = [];
  }
  bumpStateGeneration () : void  {
    this.__rangerStateGeneration = this.__rangerStateGeneration + 1;
  };
  markStateDirty () : void  {
    this.__rangerStateGeneration = this.__rangerStateGeneration + 1;
    this.flushUiNotify();
  };
  flushUiNotify () : void  {
    const uiHost : ProcessUiHost  = ProcessUiHost.__singleton();
    if ( uiHost.isUiNotifySuppressed() ) {
      return;
    }
    uiHost.notifyPathDeliveredCount = uiHost.notifyPathDeliveredCount + 1;
    if ( (this.__rangerPath.length) > 0 ) {
      uiHost.notifyPath(this.__rangerPath);
    }
    if ( this.__rangerId != 0 ) {
      uiHost.notifyId(this.__rangerId);
    }
  };
  __rangerOnDescendantUiChanged (child : RangerProcessBase, hint : string) : void  {
    this.markStateDirty();
    const parent : RangerProcessBase | undefined  = this.__rangerParent;
    if ( (typeof(parent) === "undefined") == false ) {
      const p : RangerProcessBase  = parent;
      if ( p.__rangerId != 0 ) {
        p.__rangerOnDescendantUiChanged(child, hint);
      }
    }
  };
  __rangerTrackChild (child : RangerProcessBase) : void  {
    this.__rangerChildren.push(child);
  };
  __rangerClearChildren () : void  {
    let empty : Array<RangerProcessBase> | undefined  = [];
    this.__rangerChildren = empty;
  };
  __rangerFindRoot () : RangerProcessBase  {
    let cur : RangerProcessBase  = this;
    let parent : RangerProcessBase | undefined  = cur.__rangerParent;
    while ((typeof(parent) === "undefined") == false) {
      cur = parent;
      parent = cur.__rangerParent;
    };
    return cur;
  };
  __rangerSyncChildren () : void  {
  };
  __rangerInvokeStart () : void  {
  };
  __rangerInvokeStop () : void  {
  };
  __rangerInvokeHibernate () : string  {
    return "";
  };
  __rangerInvokeWakeup (state : string) : void  {
  };
  __rangerStopSubtree () : void  {
  };
  receiveMessage (name : string, value : string) : void  {
  };
}
export class ProcessIdRegistry  {
  next!: number;
  constructor() {
    if (ProcessIdRegistry.__singleton_instance != null) {
      return ProcessIdRegistry.__singleton_instance;
    }
    this.next = 1;
    ProcessIdRegistry.__singleton_instance = this;
  }
  allocate () : number  {
    const id : number  = this.next;
    this.next = id + 1;
    return id;
  };
  static __singleton_instance : ProcessIdRegistry | null = null;
  static __singleton() : ProcessIdRegistry {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new ProcessIdRegistry();
    }
    return this.__singleton_instance;
  };
}
export class ProcessNameRegistry  {
  byPath!: {[key:string]:RangerProcessBase};
  constructor() {
    if (ProcessNameRegistry.__singleton_instance != null) {
      return ProcessNameRegistry.__singleton_instance;
    }
    this.byPath = {};
    ProcessNameRegistry.__singleton_instance = this;
  }
  register (path : string, proc : RangerProcessBase) : void  {
    if ( (path.length) == 0 ) {
      return;
    }
    if ( proc.__rangerId == 0 ) {
      return;
    }
    const existing : RangerProcessBase | undefined  = ( this.byPath.hasOwnProperty(path) ? this.byPath[path] : undefined );
    if ( (typeof(existing) === "undefined") == false ) {
      const old : RangerProcessBase  = existing;
      if ( (old.__rangerId != 0) && (old.__rangerId != proc.__rangerId) ) {
        console.log("ERROR: duplicate live @name process path: " + path);
        return;
      }
    }
    this.byPath[path] = proc;
  };
  unregister (path : string) : void  {
  };
  findByPath (path : string) : RangerProcessBase | undefined  {
    return ( this.byPath.hasOwnProperty(path) ? this.byPath[path] : undefined );
  };
  hasLive (path : string) : boolean  {
    const found : RangerProcessBase | undefined  = ( this.byPath.hasOwnProperty(path) ? this.byPath[path] : undefined );
    if ( typeof(found) === "undefined" ) {
      return false;
    }
    const inst : RangerProcessBase  = found;
    if ( inst.__rangerId == 0 ) {
      return false;
    }
    return true;
  };
  unbindIfConfigured (proc : RangerProcessBase) : void  {
    if ( (proc.__rangerPath.length) > 0 ) {
      this.unregister(proc.__rangerPath);
      proc.__rangerPath = "";
    }
  };
  bindIfConfigured (proc : RangerProcessBase) : void  {
    if ( proc.__rangerId == 0 ) {
      return;
    }
    if ( proc.__rangerTypeId == 2 ) {
      proc.__rangerPath = "app.counterBoard";
      this.register("app.counterBoard", proc);
      return;
    }
  };
  findProcess (path : string) : RangerProcessBase | undefined  {
    if ( this.hasLive(path) ) {
      return this.findByPath(path);
    }
    return ( this.byPath.hasOwnProperty("__rgr_no_such_process__") ? this.byPath["__rgr_no_such_process__"] : undefined );
  };
  static __singleton_instance : ProcessNameRegistry | null = null;
  static __singleton() : ProcessNameRegistry {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new ProcessNameRegistry();
    }
    return this.__singleton_instance;
  };
}
export class ProcessUiHost  {
  __uiNotifySuppressDepth!: number;
  notifyPathDeliveredCount!: number;
  constructor() {
    if (ProcessUiHost.__singleton_instance != null) {
      return ProcessUiHost.__singleton_instance;
    }
    this.__uiNotifySuppressDepth = 0;
    this.notifyPathDeliveredCount = 0;
    ProcessUiHost.__singleton_instance = this;
  }
  isUiNotifySuppressed () : boolean  {
    return this.__uiNotifySuppressDepth > 0;
  };
  resetNotifyDeliveryCount () : void  {
    this.notifyPathDeliveredCount = 0;
  };
  beginSuppressUiNotify () : void  {
    this.__uiNotifySuppressDepth = this.__uiNotifySuppressDepth + 1;
  };
  endSuppressUiNotify () : void  {
    if ( this.__uiNotifySuppressDepth > 0 ) {
      this.__uiNotifySuppressDepth = this.__uiNotifySuppressDepth - 1;
    }
  };
  notifyPath (path : string) : void  {
  };
  notifyId (processId : number) : void  {
  };
  static __singleton_instance : ProcessUiHost | null = null;
  static __singleton() : ProcessUiHost {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new ProcessUiHost();
    }
    return this.__singleton_instance;
  };
}
export class ProcessRuntime  {
  __dispatchTurnDepth!: number;
  constructor() {
    if (ProcessRuntime.__singleton_instance != null) {
      return ProcessRuntime.__singleton_instance;
    }
    this.__dispatchTurnDepth = 0;
    ProcessRuntime.__singleton_instance = this;
  }
  static beginDispatchTurn (root : RangerProcessBase) : void  {
    const rt : ProcessRuntime  = ProcessRuntime.__singleton();
    if ( rt.__dispatchTurnDepth == 0 ) {
      const uiHost : ProcessUiHost  = ProcessUiHost.__singleton();
      uiHost.beginSuppressUiNotify();
    }
    rt.__dispatchTurnDepth = rt.__dispatchTurnDepth + 1;
  };
  static endDispatchTurn (root : RangerProcessBase) : void  {
    const rt : ProcessRuntime  = ProcessRuntime.__singleton();
    if ( rt.__dispatchTurnDepth == 0 ) {
      return;
    }
    rt.__dispatchTurnDepth = rt.__dispatchTurnDepth - 1;
    if ( rt.__dispatchTurnDepth > 0 ) {
      return;
    }
    root.__rangerSyncChildren();
    const uiHost : ProcessUiHost  = ProcessUiHost.__singleton();
    uiHost.endSuppressUiNotify();
    root.flushUiNotify();
  };
  static stopInstance (proc : RangerProcessBase) : void  {
    (ProcessNameRegistry.__singleton()).unbindIfConfigured(proc);
    proc.__rangerStopSubtree();
  };
  static startInstance (proc : RangerProcessBase) : void  {
    (ProcessNameRegistry.__singleton()).bindIfConfigured(proc);
    proc.__rangerInvokeStart();
  };
  static hibernateInstance (proc : RangerProcessBase) : string  {
    const res : string  = proc.__rangerInvokeHibernate();
    return res;
  };
  static wakeupInstance (proc : RangerProcessBase, state : string) : void  {
    proc.__rangerInvokeWakeup(state);
  };
  static collectAllLiveRoots () : Array<RangerProcessBase>  {
    let roots : Array<RangerProcessBase> | undefined  = [];
    const __rgr_CounterRowProcess_all : Array<CounterRowProcess>  = CounterRowProcess.allInstances();
    for ( let i = 0; i < __rgr_CounterRowProcess_all.length; i++) {
      var __rgrRoot = __rgr_CounterRowProcess_all[i];
      if ( (__rgrRoot.__rangerId != 0) && (__rgrRoot.__rangerParentId == 0) ) {
        roots.push(__rgrRoot);
      }
    };
    const __rgr_CounterBoardPage_all : Array<CounterBoardPage>  = CounterBoardPage.allInstances();
    for ( let i_1 = 0; i_1 < __rgr_CounterBoardPage_all.length; i_1++) {
      var __rgrRoot_1 = __rgr_CounterBoardPage_all[i_1];
      if ( (__rgrRoot_1.__rangerId != 0) && (__rgrRoot_1.__rangerParentId == 0) ) {
        roots.push(__rgrRoot_1);
      }
    };
    return roots;
  };
  static printProcessTree () : void  {
    const __rgrTreeView : ProcessTreeView  = new ProcessTreeView();
    const __rgrRoots : Array<RangerProcessBase>  = ProcessRuntime.collectAllLiveRoots();
    const __rgrTitle : string  = "";
    __rgrTreeView.renderRoots(__rgrRoots, __rgrTitle);
  };
  static printProcessTreeTitled (title : string) : void  {
    const __rgrTreeView : ProcessTreeView  = new ProcessTreeView();
    const __rgrRoots : Array<RangerProcessBase>  = ProcessRuntime.collectAllLiveRoots();
    __rgrTreeView.renderRoots(__rgrRoots, title);
  };
  static stopByProcessId (processId : number) : void  {
    if ( CounterRowProcess.tryStopByProcessId(processId) ) {
      return;
    }
    if ( CounterBoardPage.tryStopByProcessId(processId) ) {
      return;
    }
  };
  static stopByClassName (name : string) : void  {
    if ( name == "CounterRowProcess" ) {
      CounterRowProcess.stopAllLive();
      return;
    }
    if ( name == "CounterBoardPage" ) {
      CounterBoardPage.stopAllLive();
      return;
    }
  };
  static __singleton_instance : ProcessRuntime | null = null;
  static __singleton() : ProcessRuntime {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new ProcessRuntime();
    }
    return this.__singleton_instance;
  };
}
export class RangerFieldDescriptor  {
  name!: string;
  typeName!: string;
  isOptional!: boolean;
  constructor() {
    this.name = "";     /** note: unused */
    this.typeName = "";     /** note: unused */
    this.isOptional = false;     /** note: unused */
  }
}
export class RangerClassDescriptor  {
  className!: string;
  fields!: Array<RangerFieldDescriptor>;
  constructor() {
    this.className = "";     /** note: unused */
    this.fields = [];     /** note: unused */
  }
}
export class ProcessTreeView  {
  showParentId!: boolean;
  constructor() {
    this.showParentId = true;
  }
  isLive (proc : RangerProcessBase) : boolean  {
    if ( proc.__rangerId == 0 ) {
      return false;
    }
    return true;
  };
  nodeLabel (proc : RangerProcessBase) : string  {
    let label : string  = "";
    label = proc.__rangerClassName;
    label = label + " #";
    label = label + ((proc.__rangerId.toString()));
    if ( this.showParentId ) {
      label = label + " parent=";
      label = label + ((proc.__rangerParentId.toString()));
    }
    return label;
  };
  countLiveChildren (proc : RangerProcessBase) : number  {
    let n : number  = 0;
    for ( let i = 0; i < proc.__rangerChildren.length; i++) {
      var ch = proc.__rangerChildren[i];
      if ( this.isLive(ch) ) {
        n = n + 1;
      }
    };
    return n;
  };
  renderSubtree (proc : RangerProcessBase, indent : string) : void  {
    let liveIdx : number  = 0;
    const total : number  = this.countLiveChildren(proc);
    for ( let i = 0; i < proc.__rangerChildren.length; i++) {
      var ch = proc.__rangerChildren[i];
      if ( this.isLive(ch) == false ) {
        continue;
      }
      let branch : string  = "|-> ";
      const childIndent : string  = "    ";
      if ( liveIdx == (total - 1) ) {
        branch = "L-> ";
      }
      let line : string  = "";
      line = indent + branch;
      const nodeText : string  = this.nodeLabel(ch);
      line = line + nodeText;
      console.log(line);
      let nextIndent : string  = "";
      nextIndent = indent + childIndent;
      this.renderSubtree(ch, nextIndent);
      liveIdx = liveIdx + 1;
    };
  };
  countLiveRoots (roots : Array<RangerProcessBase>) : number  {
    let c : number  = 0;
    for ( let i = 0; i < roots.length; i++) {
      var r = roots[i];
      if ( this.isLive(r) ) {
        c = c + 1;
      }
    };
    return c;
  };
  renderRoots (roots : Array<RangerProcessBase>, title : string) : void  {
    console.log("");
    if ( title != "" ) {
      console.log(title);
    } else {
      console.log("Process tree");
    }
    const n : number  = roots.length;
    if ( n == 0 ) {
      console.log("  (no live root processes)");
      return;
    }
    const liveTotal : number  = this.countLiveRoots(roots);
    if ( liveTotal == 0 ) {
      console.log("  (no live root processes)");
      return;
    }
    let shown : number  = 0;
    let i : number  = 0;
    while (i < n) {
      const root : RangerProcessBase  = roots[i];
      if ( this.isLive(root) ) {
        let branch : string  = "|-> ";
        const childIndent : string  = "    ";
        if ( shown == (liveTotal - 1) ) {
          branch = "L-> ";
        }
        let line : string  = "";
        line = "  " + branch;
        const rootText : string  = this.nodeLabel(root);
        line = line + rootText;
        console.log(line);
        this.renderSubtree(root, childIndent);
        shown = shown + 1;
      }
      i = i + 1;
    };
  };
}
export class CounterRowProcess  extends RangerProcessBase {
  board?: CounterBoardPage;
  label!: string;
  value!: number;
  running!: boolean;
  tickCount!: number;
  constructor() {
    super()
    this.label = "";
    this.value = 0;
    this.running = false;
    this.tickCount = 0;
  }
  start () : void  {
  };
  addRep () : void  {
    this.value = this.value + 1;
    if ( (typeof(this.board) === "undefined") == false ) {
      const pg : CounterBoardPage  = this.board;
      pg.markStateDirty();
    }
  };
  toggleRun () : void  {
    if ( this.running ) {
      this.running = false;
    } else {
      this.running = true;
    }
    if ( (typeof(this.board) === "undefined") == false ) {
      const pg : CounterBoardPage  = this.board;
      pg.markStateDirty();
    }
  };
  pulse () : void  {
    if ( this.running == false ) {
      return;
    }
    this.tickCount = this.tickCount + 1;
  };
  stop () : void  {
    this.running = false;
  };
  __rangerRegisterRoot () : void  {
    this.__rangerClassName = "CounterRowProcess";
    this.__rangerTypeId = 1;
    const __rgrIdReg : ProcessIdRegistry  = ProcessIdRegistry.__singleton();
    const __rgrNewId : number  = __rgrIdReg.allocate();
    this.__rangerId = __rgrNewId;
    (CounterRowProcess__Registry.__singleton()).track(this);
  };
  __rangerRegisterChild (parent : RangerProcessBase) : void  {
    this.__rangerClassName = "CounterRowProcess";
    this.__rangerTypeId = 1;
    this.__rangerParent = parent;
    this.__rangerParentId = parent.__rangerId;
    const __rgrIdReg : ProcessIdRegistry  = ProcessIdRegistry.__singleton();
    const __rgrNewId : number  = __rgrIdReg.allocate();
    this.__rangerId = __rgrNewId;
    parent.__rangerTrackChild(this);
    (CounterRowProcess__Registry.__singleton()).track(this);
  };
  __rangerUnregister () : void  {
    this.__rangerId = 0;
    this.__rangerParentId = 0;
  };
  __rangerInvokeStart () : void  {
    (this).start();
  };
  __rangerInvokeStop () : void  {
    (this).stop();
  };
  __rangerStopSubtree () : void  {
    if ( this.__rangerId == 0 ) {
      return;
    }
    let __rgrIdx : number  = 0;
    while (__rgrIdx < (this.__rangerChildren.length)) {
      const __rgrChild : RangerProcessBase  = this.__rangerChildren[__rgrIdx];
      __rgrChild.__rangerStopSubtree();
      __rgrIdx = __rgrIdx + 1;
    };
    this.__rangerInvokeStop();
    (CounterRowProcess__Registry.__singleton()).untrack(this);
    this.__rangerUnregister();
    this.__rangerClearChildren();
  };
  static allInstances () : Array<CounterRowProcess>  {
    const __rgrReg : CounterRowProcess__Registry  = CounterRowProcess__Registry.__singleton();
    return __rgrReg.items;
  };
  static tryStopByProcessId (processId : number) : boolean  {
    const __rgrReg : CounterRowProcess__Registry  = CounterRowProcess__Registry.__singleton();
    for ( let i = 0; i < __rgrReg.items.length; i++) {
      var inst = __rgrReg.items[i];
      if ( inst.__rangerId == processId ) {
        if ( inst.__rangerId != 0 ) {
          inst.__rangerStopSubtree();
          return true;
        }
      }
    };
    return false;
  };
  static parentIdOf (child : RangerProcessBase) : number  {
    let cur : RangerProcessBase | undefined  = child.__rangerParent;
    while ((typeof(cur) === "undefined") == false) {
      const node : RangerProcessBase  = cur;
      const __rgrExpectType : number  = 1;
      if ( node.__rangerTypeId != __rgrExpectType ) {
        cur = node.__rangerParent;
      } else {
        return node.__rangerId;
      }
    };
    return 0;
  };
  static stopAllLive () : void  {
    const __rgrReg : CounterRowProcess__Registry  = CounterRowProcess__Registry.__singleton();
    __rgrReg.stopAllInstances();
  };
}
export class CounterBoardPage  extends RangerProcessBase {
  title!: string;
  rows!: Array<CounterRowProcess>;
  selectedIndex!: number;
  nextLabelNum!: number;
  constructor() {
    super()
    this.title = "Counters";     /** note: unused */
    this.rows = [];
    this.selectedIndex = 0;
    this.nextLabelNum = 1;
  }
  start () : void  {
    this.addRow();
  };
  addRow () : CounterRowProcess  {
    const r : CounterRowProcess  = (() => { const __rgr_proc = new CounterRowProcess(); if (typeof this !== 'undefined' && this.__rangerId) { __rgr_proc.__rangerRegisterChild(this) } else { __rgr_proc.__rangerRegisterRoot() }; return __rgr_proc; })();
    r.board = this;
    r.label = "Set " + ((this.nextLabelNum.toString()));
    this.nextLabelNum = this.nextLabelNum + 1;
    this.rows.push(r);
    ProcessRuntime.startInstance(r);
    this.selectedIndex = (this.rows.length) - 1;
    this.markStateDirty();
    return r;
  };
  removeSelected () : void  {
    const n : number  = this.rows.length;
    if ( n == 0 ) {
      return;
    }
    if ( this.selectedIndex < 0 ) {
      this.selectedIndex = 0;
    }
    if ( this.selectedIndex >= n ) {
      this.selectedIndex = n - 1;
    }
    const victim : CounterRowProcess  = this.rows[this.selectedIndex];
    ProcessRuntime.stopInstance(victim);
    let kept : Array<CounterRowProcess> | undefined  = [];
    let i : number  = 0;
    while (i < n) {
      if ( i != this.selectedIndex ) {
        kept.push(this.rows[i]);
      }
      i = i + 1;
    };
    this.rows = kept;
    const n2 : number  = this.rows.length;
    if ( n2 == 0 ) {
      this.selectedIndex = 0;
    } else {
      if ( this.selectedIndex >= n2 ) {
        this.selectedIndex = n2 - 1;
      }
    }
    this.markStateDirty();
  };
  moveSelection (delta : number) : number  {
    const n : number  = this.rows.length;
    if ( n == 0 ) {
      return 0;
    }
    this.selectedIndex = this.selectedIndex + delta;
    if ( this.selectedIndex < 0 ) {
      this.selectedIndex = 0;
    }
    if ( this.selectedIndex >= n ) {
      this.selectedIndex = n - 1;
    }
    this.markStateDirty();
    return this.selectedIndex;
  };
  addRepToSelected () : void  {
    const n : number  = this.rows.length;
    if ( n == 0 ) {
      return;
    }
    const r : CounterRowProcess  = this.rows[this.selectedIndex];
    r.addRep();
  };
  toggleSelectedRun () : void  {
    const n : number  = this.rows.length;
    if ( n == 0 ) {
      return;
    }
    const r : CounterRowProcess  = this.rows[this.selectedIndex];
    r.toggleRun();
  };
  pulseAll () : void  {
    for ( let i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      r.pulse();
    };
    this.markStateDirty();
  };
  rowCount () : number  {
    return this.rows.length;
  };
  sumValues () : number  {
    let total : number  = 0;
    for ( let i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      total = total + r.value;
    };
    return total;
  };
  stopAllRows () : void  {
    for ( let i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      ProcessRuntime.stopInstance(r);
    };
    let empty : Array<CounterRowProcess> | undefined  = [];
    this.rows = empty;
  };
  stop () : void  {
    this.stopAllRows();
  };
  __rangerRegisterRoot () : void  {
    this.__rangerClassName = "CounterBoardPage";
    this.__rangerTypeId = 2;
    const __rgrIdReg : ProcessIdRegistry  = ProcessIdRegistry.__singleton();
    const __rgrNewId : number  = __rgrIdReg.allocate();
    this.__rangerId = __rgrNewId;
    (CounterBoardPage__Registry.__singleton()).track(this);
  };
  __rangerRegisterChild (parent : RangerProcessBase) : void  {
    this.__rangerClassName = "CounterBoardPage";
    this.__rangerTypeId = 2;
    this.__rangerParent = parent;
    this.__rangerParentId = parent.__rangerId;
    const __rgrIdReg : ProcessIdRegistry  = ProcessIdRegistry.__singleton();
    const __rgrNewId : number  = __rgrIdReg.allocate();
    this.__rangerId = __rgrNewId;
    parent.__rangerTrackChild(this);
    (CounterBoardPage__Registry.__singleton()).track(this);
  };
  __rangerUnregister () : void  {
    this.__rangerId = 0;
    this.__rangerParentId = 0;
  };
  __rangerInvokeStart () : void  {
    (this).start();
  };
  __rangerInvokeStop () : void  {
    (this).stop();
  };
  __rangerStopSubtree () : void  {
    if ( this.__rangerId == 0 ) {
      return;
    }
    let __rgrIdx : number  = 0;
    while (__rgrIdx < (this.__rangerChildren.length)) {
      const __rgrChild : RangerProcessBase  = this.__rangerChildren[__rgrIdx];
      __rgrChild.__rangerStopSubtree();
      __rgrIdx = __rgrIdx + 1;
    };
    this.__rangerInvokeStop();
    (CounterBoardPage__Registry.__singleton()).untrack(this);
    this.__rangerUnregister();
    this.__rangerClearChildren();
  };
  static allInstances () : Array<CounterBoardPage>  {
    const __rgrReg : CounterBoardPage__Registry  = CounterBoardPage__Registry.__singleton();
    return __rgrReg.items;
  };
  static tryStopByProcessId (processId : number) : boolean  {
    const __rgrReg : CounterBoardPage__Registry  = CounterBoardPage__Registry.__singleton();
    for ( let i = 0; i < __rgrReg.items.length; i++) {
      var inst = __rgrReg.items[i];
      if ( inst.__rangerId == processId ) {
        if ( inst.__rangerId != 0 ) {
          inst.__rangerStopSubtree();
          return true;
        }
      }
    };
    return false;
  };
  static parentIdOf (child : RangerProcessBase) : number  {
    let cur : RangerProcessBase | undefined  = child.__rangerParent;
    while ((typeof(cur) === "undefined") == false) {
      const node : RangerProcessBase  = cur;
      const __rgrExpectType : number  = 2;
      if ( node.__rangerTypeId != __rgrExpectType ) {
        cur = node.__rangerParent;
      } else {
        return node.__rangerId;
      }
    };
    return 0;
  };
  static processPath () : string  {
    return "app.counterBoard";
  };
  static stopAllLive () : void  {
    const __rgrReg : CounterBoardPage__Registry  = CounterBoardPage__Registry.__singleton();
    __rgrReg.stopAllInstances();
  };
}
export class CounterRowProcess__Registry  {
  items!: Array<CounterRowProcess>;
  constructor() {
    if (CounterRowProcess__Registry.__singleton_instance != null) {
      return CounterRowProcess__Registry.__singleton_instance;
    }
    this.items = [];
    CounterRowProcess__Registry.__singleton_instance = this;
  }
  track (inst : CounterRowProcess) : void  {
    this.items.push(inst);
  };
  untrack (inst : CounterRowProcess) : void  {
    let kept : Array<CounterRowProcess> | undefined  = [];
    for ( let i = 0; i < this.items.length; i++) {
      var x = this.items[i];
      if ( x.__rangerId != inst.__rangerId ) {
        kept.push(x);
      }
    };
    this.items = kept;
  };
  all () : Array<CounterRowProcess>  {
    return this.items;
  };
  stopAllInstances () : void  {
    const n : number  = this.items.length;
    let i : number  = n - 1;
    while (i >= 0) {
      const inst : CounterRowProcess  = this.items[i];
      if ( inst.__rangerId != 0 ) {
        inst.__rangerStopSubtree();
      }
      i = i - 1;
    };
  };
  static __singleton_instance : CounterRowProcess__Registry | null = null;
  static __singleton() : CounterRowProcess__Registry {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new CounterRowProcess__Registry();
    }
    return this.__singleton_instance;
  };
}
export class CounterBoardPage__Registry  {
  items!: Array<CounterBoardPage>;
  constructor() {
    if (CounterBoardPage__Registry.__singleton_instance != null) {
      return CounterBoardPage__Registry.__singleton_instance;
    }
    this.items = [];
    CounterBoardPage__Registry.__singleton_instance = this;
  }
  track (inst : CounterBoardPage) : void  {
    this.items.push(inst);
  };
  untrack (inst : CounterBoardPage) : void  {
    let kept : Array<CounterBoardPage> | undefined  = [];
    for ( let i = 0; i < this.items.length; i++) {
      var x = this.items[i];
      if ( x.__rangerId != inst.__rangerId ) {
        kept.push(x);
      }
    };
    this.items = kept;
  };
  all () : Array<CounterBoardPage>  {
    return this.items;
  };
  stopAllInstances () : void  {
    const n : number  = this.items.length;
    let i : number  = n - 1;
    while (i >= 0) {
      const inst : CounterBoardPage  = this.items[i];
      if ( inst.__rangerId != 0 ) {
        inst.__rangerStopSubtree();
      }
      i = i - 1;
    };
  };
  static __singleton_instance : CounterBoardPage__Registry | null = null;
  static __singleton() : CounterBoardPage__Registry {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new CounterBoardPage__Registry();
    }
    return this.__singleton_instance;
  };
}

// @process named-path helpers (generated)
export type ProcessPath = "app.counterBoard";
export interface ProcessNameRegistry {
  findProcess(path: "app.counterBoard"): CounterBoardPage | undefined;
  findProcess(path: string): RangerProcessBase | undefined;
}
