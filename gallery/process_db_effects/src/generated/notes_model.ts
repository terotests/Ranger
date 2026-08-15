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
    const existing : RangerProcessBase | undefined  = ( Object.prototype.hasOwnProperty.call(this.byPath, path) ? this.byPath[path] : undefined );
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
    return ( Object.prototype.hasOwnProperty.call(this.byPath, path) ? this.byPath[path] : undefined );
  };
  hasLive (path : string) : boolean  {
    const found : RangerProcessBase | undefined  = ( Object.prototype.hasOwnProperty.call(this.byPath, path) ? this.byPath[path] : undefined );
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
    if ( proc.__rangerTypeId == 1 ) {
      proc.__rangerPath = "app.notes";
      this.register("app.notes", proc);
      return;
    }
  };
  findProcess (path : string) : RangerProcessBase | undefined  {
    if ( this.hasLive(path) ) {
      return this.findByPath(path);
    }
    return ( Object.prototype.hasOwnProperty.call(this.byPath, "__rgr_no_such_process__") ? this.byPath["__rgr_no_such_process__"] : undefined );
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
    const __rgr_NotesPage_all : Array<NotesPage>  = NotesPage.allInstances();
    for ( let i = 0; i < __rgr_NotesPage_all.length; i++) {
      var __rgrRoot = __rgr_NotesPage_all[i];
      if ( (__rgrRoot.__rangerId != 0) && (__rgrRoot.__rangerParentId == 0) ) {
        roots.push(__rgrRoot);
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
    if ( NotesPage.tryStopByProcessId(processId) ) {
      return;
    }
  };
  static stopByClassName (name : string) : void  {
    if ( name == "NotesPage" ) {
      NotesPage.stopAllLive();
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
export class EffectCapability  {
  constructor() {
  }
  static db () : string  {
    return "db";
  };
  static clock () : string  {
    return "clock";
  };
  static random () : string  {
    return "random";
  };
}
export class EffectOp  {
  constructor() {
  }
  static dbQuery () : string  {
    return "query";
  };
  static dbExec () : string  {
    return "exec";
  };
  static dbStream () : string  {
    return "stream";
  };
  static clockDelay () : string  {
    return "delay";
  };
}
export class EffectErrorKind  {
  constructor() {
  }
  static none () : string  {
    return "";
  };
  static capabilityDenied () : string  {
    return "capability_denied";
  };
  static cancelled () : string  {
    return "cancelled";
  };
  static timeout () : string  {
    return "timeout";
  };
  static io () : string  {
    return "io";
  };
  static unsupported () : string  {
    return "unsupported";
  };
}
export class EffectRequest  {
  id!: number;
  capability!: string;
  op!: string;
  ownerPath!: string;
  sql!: string;
  args!: Array<string>;
  delayMs!: number;
  chunkSize!: number;
  epoch!: number;
  label!: string;
  timeoutMs!: number;
  constructor() {
    this.id = 0;
    this.capability = "";
    this.op = "";
    this.ownerPath = "";
    this.sql = "";
    this.args = [];
    this.delayMs = 0;
    this.chunkSize = 0;
    this.epoch = 0;
    this.label = "";
    this.timeoutMs = 0;     /** note: unused */
  }
}
export class EffectResult  {
  requestId!: number;
  ok!: boolean;
  more!: boolean;
  capability!: string;
  op!: string;
  label!: string;
  epoch!: number;
  payload!: string;
  rowCount!: number;
  chunkIndex!: number;
  errorKind!: string;
  errorMessage!: string;
  elapsedMs!: number;
  constructor() {
    this.requestId = 0;     /** note: unused */
    this.ok = false;
    this.more = false;
    this.capability = "";
    this.op = "";     /** note: unused */
    this.label = "";
    this.epoch = 0;
    this.payload = "";
    this.rowCount = 0;     /** note: unused */
    this.chunkIndex = 0;     /** note: unused */
    this.errorKind = "";
    this.errorMessage = "";
    this.elapsedMs = 0;
  }
  isCancelled () : boolean  {
    return this.errorKind == "cancelled";
  };
  isDenied () : boolean  {
    return this.errorKind == "capability_denied";
  };
  isStale (currentEpoch : number) : boolean  {
    return this.epoch < currentEpoch;
  };
}
export class CapabilityManifest  {
  names!: Array<string>;
  constructor() {
    this.names = [];
  }
  require (name : string) : void  {
    if ( (this).has(name) ) {
      return;
    }
    this.names.push(name);
  };
  has (name : string) : boolean  {
    for ( let i = 0; i < this.names.length; i++) {
      var n = this.names[i];
      if ( n == name ) {
        return true;
      }
    };
    return false;
  };
  count () : number  {
    return this.names.length;
  };
}
export class EffectRequests  {
  constructor() {
  }
  static query (owner : string, sql : string, args : Array<string>, epoch : number, label : string) : EffectRequest  {
    const r : EffectRequest  = new EffectRequest();
    r.capability = "db";
    r.op = "query";
    r.ownerPath = owner;
    r.sql = sql;
    r.args = args;
    r.epoch = epoch;
    r.label = label;
    return r;
  };
  static exec (owner : string, sql : string, args : Array<string>, epoch : number, label : string) : EffectRequest  {
    const r : EffectRequest  = new EffectRequest();
    r.capability = "db";
    r.op = "exec";
    r.ownerPath = owner;
    r.sql = sql;
    r.args = args;
    r.epoch = epoch;
    r.label = label;
    return r;
  };
  static stream (owner : string, sql : string, chunkSize : number, epoch : number, label : string) : EffectRequest  {
    const r : EffectRequest  = new EffectRequest();
    let noArgs : Array<string> | undefined  = [];
    r.capability = "db";
    r.op = "stream";
    r.ownerPath = owner;
    r.sql = sql;
    r.args = noArgs;
    r.chunkSize = chunkSize;
    r.epoch = epoch;
    r.label = label;
    return r;
  };
  static delay (owner : string, ms : number, epoch : number, label : string) : EffectRequest  {
    const r : EffectRequest  = new EffectRequest();
    let noArgs : Array<string> | undefined  = [];
    r.capability = "clock";
    r.op = "delay";
    r.ownerPath = owner;
    r.args = noArgs;
    r.delayMs = ms;
    r.epoch = epoch;
    r.label = label;
    return r;
  };
}
export class EffectQueue  {
  nextId!: number;
  pending!: Array<EffectRequest>;
  submittedCount!: number;
  drainedCount!: number;
  constructor() {
    if (EffectQueue.__singleton_instance != null) {
      return EffectQueue.__singleton_instance;
    }
    this.nextId = 1;
    this.pending = [];
    this.submittedCount = 0;
    this.drainedCount = 0;
    EffectQueue.__singleton_instance = this;
  }
  submit (req : EffectRequest) : number  {
    const id : number  = this.nextId;
    this.nextId = this.nextId + 1;
    req.id = id;
    this.pending.push(req);
    this.submittedCount = this.submittedCount + 1;
    return id;
  };
  drain () : Array<EffectRequest>  {
    const out : Array<EffectRequest>  = this.pending;
    let fresh : Array<EffectRequest> | undefined  = [];
    this.pending = fresh;
    this.drainedCount = this.drainedCount + (out.length);
    return out;
  };
  depth () : number  {
    return this.pending.length;
  };
  reset () : void  {
    let fresh : Array<EffectRequest> | undefined  = [];
    this.pending = fresh;
    this.nextId = 1;
    this.submittedCount = 0;
    this.drainedCount = 0;
  };
  query (owner : string, sql : string, args : Array<string>, epoch : number, label : string) : number  {
    const r : EffectRequest  = new EffectRequest();
    r.capability = "db";
    r.op = "query";
    r.ownerPath = owner;
    r.sql = sql;
    r.args = args;
    r.epoch = epoch;
    r.label = label;
    return this.submit(r);
  };
  exec (owner : string, sql : string, args : Array<string>, epoch : number, label : string) : number  {
    const r : EffectRequest  = new EffectRequest();
    r.capability = "db";
    r.op = "exec";
    r.ownerPath = owner;
    r.sql = sql;
    r.args = args;
    r.epoch = epoch;
    r.label = label;
    return this.submit(r);
  };
  stream (owner : string, sql : string, chunkSize : number, epoch : number, label : string) : number  {
    const r : EffectRequest  = new EffectRequest();
    let noArgs : Array<string> | undefined  = [];
    r.capability = "db";
    r.op = "stream";
    r.ownerPath = owner;
    r.sql = sql;
    r.args = noArgs;
    r.chunkSize = chunkSize;
    r.epoch = epoch;
    r.label = label;
    return this.submit(r);
  };
  delay (owner : string, ms : number, epoch : number, label : string) : number  {
    const r : EffectRequest  = new EffectRequest();
    let noArgs : Array<string> | undefined  = [];
    r.capability = "clock";
    r.op = "delay";
    r.ownerPath = owner;
    r.args = noArgs;
    r.delayMs = ms;
    r.epoch = epoch;
    r.label = label;
    return this.submit(r);
  };
  static __singleton_instance : EffectQueue | null = null;
  static __singleton() : EffectQueue {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new EffectQueue();
    }
    return this.__singleton_instance;
  };
}
export class EffectRow  {
  keys!: Array<string>;
  values!: Array<string>;
  constructor() {
    this.keys = [];
    this.values = [];
  }
  get (key : string) : string  {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        return this.values[i];
      }
    };
    return "";
  };
  getInt (key : string) : number  {
    const s : string  = (this).get(key);
    if ( (s.length) == 0 ) {
      return 0;
    }
    const parsed : number | undefined  = isNaN( parseInt(s) ) ? undefined : parseInt(s);
    return ((typeof(parsed) !== "undefined" && parsed != null ) ) ? (parsed) : 0;
  };
  has (key : string) : boolean  {
    for ( let i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if ( k == key ) {
        return true;
      }
    };
    return false;
  };
  put (key : string, value : string) : void  {
    this.keys.push(key);
    this.values.push(value);
  };
}
export class EffectPayload  {
  constructor() {
  }
  static parseRows (json : string) : Array<EffectRow>  {
    let rows : Array<EffectRow> | undefined  = [];
    const n : number  = json.length;
    let i : number  = 0;
    let cur : EffectRow  = new EffectRow();
    let inRow : boolean  = false;
    let key : string  = "";
    let buf : string  = "";
    let inString : boolean  = false;
    let escaped : boolean  = false;
    let expectKey : boolean  = true;
    while (i < n) {
      const c : string  = json.substring(i, (i + 1) );
      if ( inString ) {
        if ( escaped ) {
          if ( c == "n" ) {
            buf = buf + "\n";
          } else {
            if ( c == "t" ) {
              buf = buf + "\t";
            } else {
              buf = buf + c;
            }
          }
          escaped = false;
        } else {
          if ( c == "\\" ) {
            escaped = true;
          } else {
            if ( c == "\"" ) {
              inString = false;
            } else {
              buf = buf + c;
            }
          }
        }
        i = i + 1;
        continue;
      }
      if ( c == "\"" ) {
        inString = true;
        i = i + 1;
        continue;
      }
      if ( c == "{" ) {
        cur = new EffectRow();
        inRow = true;
        buf = "";
        expectKey = true;
        i = i + 1;
        continue;
      }
      if ( c == ":" ) {
        key = buf.trim();
        buf = "";
        expectKey = false;
        i = i + 1;
        continue;
      }
      if ( (c == ",") || (c == "}") ) {
        if ( inRow ) {
          if ( expectKey == false ) {
            cur.put(key, buf.trim());
          }
        }
        buf = "";
        key = "";
        expectKey = true;
        if ( c == "}" ) {
          if ( inRow ) {
            rows.push(cur);
          }
          inRow = false;
        }
        i = i + 1;
        continue;
      }
      buf = buf + c;
      i = i + 1;
    };
    return rows;
  };
  static escape (s : string) : string  {
    let out : string  = "";
    const n : number  = s.length;
    let i : number  = 0;
    while (i < n) {
      const c : string  = s.substring(i, (i + 1) );
      if ( c == "\"" ) {
        out = out + "\\\"";
      } else {
        if ( c == "\\" ) {
          out = out + "\\\\";
        } else {
          if ( c == "\n" ) {
            out = out + "\\n";
          } else {
            out = out + c;
          }
        }
      }
      i = i + 1;
    };
    return out;
  };
}
export class Note  {
  id!: number;
  title!: string;
  body!: string;
  tag!: string;
  constructor() {
    this.id = 0;
    this.title = "";
    this.body = "";
    this.tag = "";
  }
}
export class NotesState  {
  phase!: string;
  searchText!: string;
  notes!: Array<Note>;
  total!: number;
  shortest!: number;
  longest!: number;
  errorText!: string;
  epoch!: number;
  staleDropped!: number;
  inFlight!: number;
  deniedCount!: number;
  cancelledCount!: number;
  statsPending!: number;
  streamChunks!: number;
  streamRows!: number;
  lastElapsedMs!: number;
  constructor() {
    this.phase = "idle";
    this.searchText = "";
    this.notes = [];
    this.total = 0;
    this.shortest = 0;
    this.longest = 0;
    this.errorText = "";
    this.epoch = 0;
    this.staleDropped = 0;
    this.inFlight = 0;
    this.deniedCount = 0;
    this.cancelledCount = 0;
    this.statsPending = 0;
    this.streamChunks = 0;
    this.streamRows = 0;
    this.lastElapsedMs = 0;
  }
  __CopySelf () : NotesState  {
    const res : NotesState  = new NotesState();
    res.phase = this.phase;
    res.searchText = this.searchText;
    res.notes = this.notes;
    res.total = this.total;
    res.shortest = this.shortest;
    res.longest = this.longest;
    res.errorText = this.errorText;
    res.epoch = this.epoch;
    res.staleDropped = this.staleDropped;
    res.inFlight = this.inFlight;
    res.deniedCount = this.deniedCount;
    res.cancelledCount = this.cancelledCount;
    res.statsPending = this.statsPending;
    res.streamChunks = this.streamChunks;
    res.streamRows = this.streamRows;
    res.lastElapsedMs = this.lastElapsedMs;
    return res;
  };
  set_phase (new_value_of_phase : string) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.phase = new_value_of_phase;
    return res;
  };
  set_searchText (new_value_of_searchText : string) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.searchText = new_value_of_searchText;
    return res;
  };
  set_notes (new_value_of_notes : Array<Note>) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.notes = new_value_of_notes;
    return res;
  };
  set_total (new_value_of_total : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.total = new_value_of_total;
    return res;
  };
  set_shortest (new_value_of_shortest : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.shortest = new_value_of_shortest;
    return res;
  };
  set_longest (new_value_of_longest : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.longest = new_value_of_longest;
    return res;
  };
  set_errorText (new_value_of_errorText : string) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.errorText = new_value_of_errorText;
    return res;
  };
  set_epoch (new_value_of_epoch : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.epoch = new_value_of_epoch;
    return res;
  };
  set_staleDropped (new_value_of_staleDropped : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.staleDropped = new_value_of_staleDropped;
    return res;
  };
  set_inFlight (new_value_of_inFlight : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.inFlight = new_value_of_inFlight;
    return res;
  };
  set_deniedCount (new_value_of_deniedCount : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.deniedCount = new_value_of_deniedCount;
    return res;
  };
  set_cancelledCount (new_value_of_cancelledCount : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.cancelledCount = new_value_of_cancelledCount;
    return res;
  };
  set_statsPending (new_value_of_statsPending : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.statsPending = new_value_of_statsPending;
    return res;
  };
  set_streamChunks (new_value_of_streamChunks : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.streamChunks = new_value_of_streamChunks;
    return res;
  };
  set_streamRows (new_value_of_streamRows : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.streamRows = new_value_of_streamRows;
    return res;
  };
  set_lastElapsedMs (new_value_of_lastElapsedMs : number) : NotesState  {
    const res : NotesState  = this.__CopySelf();
    res.lastElapsedMs = new_value_of_lastElapsedMs;
    return res;
  };
}
export class NotesUpdate  {
  state!: NotesState;
  effects!: Array<EffectRequest>;
  constructor() {
    this.state = new NotesState();
    this.effects = [];
  }
  __CopySelf () : NotesUpdate  {
    const res : NotesUpdate  = new NotesUpdate();
    res.state = this.state;
    res.effects = this.effects;
    return res;
  };
  set_state (new_value_of_state : NotesState) : NotesUpdate  {
    const res : NotesUpdate  = this.__CopySelf();
    res.state = new_value_of_state;
    return res;
  };
  set_effects (new_value_of_effects : Array<EffectRequest>) : NotesUpdate  {
    const res : NotesUpdate  = this.__CopySelf();
    res.effects = new_value_of_effects;
    return res;
  };
}
export class NotesReducer  {
  constructor() {
  }
  static noEffects (s : NotesState) : NotesUpdate  {
    const u : NotesUpdate  = new NotesUpdate();
    let none : Array<EffectRequest> | undefined  = [];
    return (u.set_state(s)).set_effects(none);
  };
  static oneEffect (s : NotesState, e : EffectRequest) : NotesUpdate  {
    const u : NotesUpdate  = new NotesUpdate();
    let list : Array<EffectRequest> | undefined  = [];
    list.push(e);
    return (u.set_state(s)).set_effects(list);
  };
  static open (s : NotesState, owner : string) : NotesUpdate  {
    const sql : string  = "CREATE TABLE IF NOT EXISTS notes (id INTEGER, title VARCHAR, body VARCHAR, tag VARCHAR)";
    let noArgs : Array<string> | undefined  = [];
    const next : NotesState  = ((s.set_phase("schema")).set_errorText("")).set_inFlight((s.inFlight + 1));
    const eff : EffectRequest  = EffectRequests.exec(owner, sql, noArgs, s.epoch, "schema");
    return NotesReducer.oneEffect(next, eff);
  };
  static seed (s : NotesState, owner : string) : NotesUpdate  {
    const sql : string  = "INSERT INTO notes VALUES (1,'Effects','I/O is described, not performed','core'), (2,'Scopes','Every task has a lifecycle owner','core'), (3,'Capabilities','No grant, no socket','security'), (4,'Streams','Zero to n values over time','core'), (5,'Staleness','Newer questions win','ui')";
    let noArgs : Array<string> | undefined  = [];
    const next : NotesState  = (s.set_phase("seeding")).set_inFlight((s.inFlight + 1));
    const eff : EffectRequest  = EffectRequests.exec(owner, sql, noArgs, s.epoch, "seed");
    return NotesReducer.oneEffect(next, eff);
  };
  static search (s : NotesState, owner : string, text : string) : NotesUpdate  {
    const nextEpoch : number  = s.epoch + 1;
    const next : NotesState  = (((s.set_searchText(text)).set_phase("loading")).set_epoch(nextEpoch)).set_inFlight((s.inFlight + 1));
    let args : Array<string> | undefined  = [];
    const pattern : string  = ("%" + text) + "%";
    args.push(pattern);
    args.push(pattern);
    const sql : string  = "SELECT id, title, body, tag FROM notes WHERE title ILIKE ? OR body ILIKE ? ORDER BY id";
    const eff : EffectRequest  = EffectRequests.query(owner, sql, args, nextEpoch, "search");
    return NotesReducer.oneEffect(next, eff);
  };
  static listAll (s : NotesState, owner : string) : NotesUpdate  {
    const nextEpoch : number  = s.epoch + 1;
    const next : NotesState  = ((s.set_phase("loading")).set_epoch(nextEpoch)).set_inFlight((s.inFlight + 1));
    let noArgs : Array<string> | undefined  = [];
    const sql : string  = "SELECT id, title, body, tag FROM notes ORDER BY id";
    const eff : EffectRequest  = EffectRequests.query(owner, sql, noArgs, nextEpoch, "search");
    return NotesReducer.oneEffect(next, eff);
  };
  static loadStats (s : NotesState, owner : string) : NotesUpdate  {
    const next : NotesState  = (s.set_statsPending(3)).set_inFlight((s.inFlight + 3));
    let noArgs : Array<string> | undefined  = [];
    let list : Array<EffectRequest> | undefined  = [];
    list.push(EffectRequests.query(owner, "SELECT count(*) AS n FROM notes", noArgs, s.epoch, "stat.count"));
    list.push(EffectRequests.query(owner, "SELECT min(length(body)) AS n FROM notes", noArgs, s.epoch, "stat.min"));
    list.push(EffectRequests.query(owner, "SELECT max(length(body)) AS n FROM notes", noArgs, s.epoch, "stat.max"));
    const u : NotesUpdate  = new NotesUpdate();
    return (u.set_state(next)).set_effects(list);
  };
  static streamAll (s : NotesState, owner : string, chunk : number) : NotesUpdate  {
    const next : NotesState  = ((s.set_streamChunks(0)).set_streamRows(0)).set_inFlight((s.inFlight + 1));
    const sql : string  = "SELECT id, title, body, tag FROM notes ORDER BY id";
    const eff : EffectRequest  = EffectRequests.stream(owner, sql, chunk, s.epoch, "stream");
    return NotesReducer.oneEffect(next, eff);
  };
  static tryForbidden (s : NotesState, owner : string) : NotesUpdate  {
    const next : NotesState  = s.set_inFlight((s.inFlight + 1));
    const r : EffectRequest  = new EffectRequest();
    let noArgs : Array<string> | undefined  = [];
    r.capability = "filesystem";
    r.op = "read";
    r.ownerPath = owner;
    r.sql = "/etc/passwd";
    r.args = noArgs;
    r.epoch = s.epoch;
    r.label = "forbidden";
    return NotesReducer.oneEffect(next, r);
  };
  static result (s : NotesState, owner : string, r : EffectResult) : NotesUpdate  {
    let base : NotesState  = s;
    if ( r.more == false ) {
      base = s.set_inFlight((s.inFlight - 1));
    }
    if ( r.isCancelled() ) {
      const cancelled : NotesState  = base.set_cancelledCount((base.cancelledCount + 1));
      return NotesReducer.noEffects(cancelled);
    }
    if ( r.isDenied() ) {
      const deniedText : string  = "capability denied: " + r.capability;
      const denied : NotesState  = (base.set_deniedCount((base.deniedCount + 1))).set_errorText(deniedText);
      return NotesReducer.noEffects(denied);
    }
    if ( r.isStale(base.epoch) ) {
      const stale : NotesState  = base.set_staleDropped((base.staleDropped + 1));
      return NotesReducer.noEffects(stale);
    }
    if ( r.ok == false ) {
      const failed : NotesState  = (base.set_phase("failed")).set_errorText(r.errorMessage);
      return NotesReducer.noEffects(failed);
    }
    const timed : NotesState  = base.set_lastElapsedMs(r.elapsedMs);
    if ( r.label == "schema" ) {
      return NotesReducer.seed(timed, owner);
    }
    if ( r.label == "seed" ) {
      return NotesReducer.listAll(timed, owner);
    }
    if ( r.label == "search" ) {
      const rows : Array<Note>  = NotesReducer.parseNotes(r.payload);
      const listed : NotesState  = ((timed.set_notes(rows)).set_total((rows.length))).set_phase("ready");
      return NotesReducer.noEffects(listed);
    }
    if ( r.label == "stream" ) {
      return NotesReducer.applyStreamChunk(timed, r);
    }
    if ( r.label == "stat.count" ) {
      const counted : NotesState  = timed.set_total(NotesReducer.firstNumber(r.payload));
      return NotesReducer.settleStat(counted);
    }
    if ( r.label == "stat.min" ) {
      const shortestS : NotesState  = timed.set_shortest(NotesReducer.firstNumber(r.payload));
      return NotesReducer.settleStat(shortestS);
    }
    if ( r.label == "stat.max" ) {
      const longestS : NotesState  = timed.set_longest(NotesReducer.firstNumber(r.payload));
      return NotesReducer.settleStat(longestS);
    }
    return NotesReducer.noEffects(timed);
  };
  static settleStat (s : NotesState) : NotesUpdate  {
    const left : number  = s.statsPending - 1;
    if ( left <= 0 ) {
      const done : NotesState  = (s.set_statsPending(0)).set_phase("ready");
      return NotesReducer.noEffects(done);
    }
    const pending : NotesState  = s.set_statsPending(left);
    return NotesReducer.noEffects(pending);
  };
  static applyStreamChunk (s : NotesState, r : EffectResult) : NotesUpdate  {
    const chunkRows : Array<EffectRow>  = EffectPayload.parseRows(r.payload);
    const chunks : number  = s.streamChunks + 1;
    const rows : number  = s.streamRows + (chunkRows.length);
    if ( r.more == false ) {
      const finished : NotesState  = ((s.set_streamChunks(chunks)).set_streamRows(rows)).set_phase("ready");
      return NotesReducer.noEffects(finished);
    }
    const more : NotesState  = (s.set_streamChunks(chunks)).set_streamRows(rows);
    return NotesReducer.noEffects(more);
  };
  static parseNotes (payload : string) : Array<Note>  {
    const parsed : Array<EffectRow>  = EffectPayload.parseRows(payload);
    let fresh : Array<Note> | undefined  = [];
    for ( let i = 0; i < parsed.length; i++) {
      var row = parsed[i];
      const n : Note  = new Note();
      n.id = (row).getInt("id");
      n.title = (row).get("title");
      n.body = (row).get("body");
      n.tag = (row).get("tag");
      fresh.push(n);
    };
    return fresh;
  };
  static firstNumber (payload : string) : number  {
    const parsed : Array<EffectRow>  = EffectPayload.parseRows(payload);
    if ( (parsed.length) == 0 ) {
      return 0;
    }
    const row : EffectRow  = parsed[0];
    return (row).getInt("n");
  };
}
export class NotesPage  extends RangerProcessBase {
  state!: NotesState;
  previous!: NotesState;
  constructor() {
    super()
    this.state = new NotesState();
    this.previous = new NotesState();
  }
  start () : void  {
  };
  stop () : void  {
  };
  capabilities () : CapabilityManifest  {
    const m : CapabilityManifest  = new CapabilityManifest();
    m.require("db");
    m.require("clock");
    return m;
  };
  owner () : string  {
    return this.__rangerPath;
  };
  applyUpdate (u : NotesUpdate) : void  {
    this.previous = this.state;
    this.state = u.state;
    const q : EffectQueue  = EffectQueue.__singleton();
    for ( let i = 0; i < u.effects.length; i++) {
      var e = u.effects[i];
      q.submit(e);
    };
    this.markStateDirty();
  };
  onOpen () : void  {
    const own : string  = this.owner();
    const u : NotesUpdate  = NotesReducer.open(this.state, own);
    this.applyUpdate(u);
  };
  onSearch (text : string) : void  {
    const own : string  = this.owner();
    const u : NotesUpdate  = NotesReducer.search(this.state, own, text);
    this.applyUpdate(u);
  };
  onListAll () : void  {
    const own : string  = this.owner();
    const u : NotesUpdate  = NotesReducer.listAll(this.state, own);
    this.applyUpdate(u);
  };
  onLoadStats () : void  {
    const own : string  = this.owner();
    const u : NotesUpdate  = NotesReducer.loadStats(this.state, own);
    this.applyUpdate(u);
  };
  onStreamAll (chunk : number) : void  {
    const own : string  = this.owner();
    const u : NotesUpdate  = NotesReducer.streamAll(this.state, own, chunk);
    this.applyUpdate(u);
  };
  onTryForbidden () : void  {
    const own : string  = this.owner();
    const u : NotesUpdate  = NotesReducer.tryForbidden(this.state, own);
    this.applyUpdate(u);
  };
  onEffectResult (r : EffectResult) : void  {
    const own : string  = this.owner();
    const u : NotesUpdate  = NotesReducer.result(this.state, own, r);
    this.applyUpdate(u);
  };
  __rangerRegisterRoot () : void  {
    this.__rangerClassName = "NotesPage";
    this.__rangerTypeId = 1;
    const __rgrIdReg : ProcessIdRegistry  = ProcessIdRegistry.__singleton();
    const __rgrNewId : number  = __rgrIdReg.allocate();
    this.__rangerId = __rgrNewId;
    (NotesPage__Registry.__singleton()).track(this);
  };
  __rangerRegisterChild (parent : RangerProcessBase) : void  {
    this.__rangerClassName = "NotesPage";
    this.__rangerTypeId = 1;
    this.__rangerParent = parent;
    this.__rangerParentId = parent.__rangerId;
    const __rgrIdReg : ProcessIdRegistry  = ProcessIdRegistry.__singleton();
    const __rgrNewId : number  = __rgrIdReg.allocate();
    this.__rangerId = __rgrNewId;
    parent.__rangerTrackChild(this);
    (NotesPage__Registry.__singleton()).track(this);
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
    (NotesPage__Registry.__singleton()).untrack(this);
    this.__rangerUnregister();
    this.__rangerClearChildren();
  };
  static allInstances () : Array<NotesPage>  {
    const __rgrReg : NotesPage__Registry  = NotesPage__Registry.__singleton();
    return __rgrReg.items;
  };
  static tryStopByProcessId (processId : number) : boolean  {
    const __rgrReg : NotesPage__Registry  = NotesPage__Registry.__singleton();
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
  static processPath () : string  {
    return "app.notes";
  };
  static stopAllLive () : void  {
    const __rgrReg : NotesPage__Registry  = NotesPage__Registry.__singleton();
    __rgrReg.stopAllInstances();
  };
}
export class NoteRowView  {
  id!: number;
  title!: string;
  subtitle!: string;
  badge!: string;
  constructor() {
    this.id = 0;
    this.title = "";
    this.subtitle = "";
    this.badge = "";
  }
}
export class NotesViewModel  {
  title!: string;
  statusLine!: string;
  showSpinner!: boolean;
  showEmpty!: boolean;
  errorText!: string;
  rows!: Array<NoteRowView>;
  footer!: string;
  constructor() {
    this.title = "";
    this.statusLine = "";
    this.showSpinner = false;
    this.showEmpty = false;
    this.errorText = "";
    this.rows = [];
    this.footer = "";
  }
}
export class NotesViewModelBuilder  {
  constructor() {
  }
  static fromState (m : NotesState) : NotesViewModel  {
    const vm : NotesViewModel  = new NotesViewModel();
    vm.title = "Notes";
    if ( (m.searchText.length) > 0 ) {
      vm.title = ("Notes matching \"" + m.searchText) + "\"";
    }
    vm.showSpinner = m.inFlight > 0;
    vm.errorText = m.errorText;
    let rows : Array<NoteRowView> | undefined  = [];
    for ( let i = 0; i < m.notes.length; i++) {
      var n = m.notes[i];
      const rv : NoteRowView  = new NoteRowView();
      rv.id = n.id;
      rv.title = n.title;
      rv.subtitle = n.body;
      rv.badge = n.tag;
      rows.push(rv);
    };
    vm.rows = rows;
    vm.showEmpty = ((rows.length) == 0) && (m.phase == "ready");
    if ( m.phase == "failed" ) {
      vm.statusLine = "Failed: " + m.errorText;
    } else {
      if ( m.inFlight > 0 ) {
        vm.statusLine = ("Working (" + ((m.inFlight.toString()))) + " in flight)";
      } else {
        vm.statusLine = (((((rows.length).toString())) + " of ") + ((m.total.toString()))) + " notes";
      }
    }
    vm.footer = (((("epoch " + ((m.epoch.toString()))) + " · stale dropped ") + ((m.staleDropped.toString()))) + " · cancelled ") + ((m.cancelledCount.toString()));
    return vm;
  };
  static build (p : NotesPage) : NotesViewModel  {
    return NotesViewModelBuilder.fromState(p.state);
  };
  static renderText (vm : NotesViewModel) : string  {
    let out : string  = "";
    out = (out + vm.title) + "\n";
    out = (out + vm.statusLine) + "\n";
    if ( vm.showSpinner ) {
      out = out + "  ... working\n";
    }
    if ( vm.showEmpty ) {
      out = out + "  (no notes)\n";
    }
    for ( let i = 0; i < vm.rows.length; i++) {
      var r = vm.rows[i];
      out = ((((((out + "  [") + ((r.id.toString()))) + "] ") + r.title) + " (") + r.badge) + ")\n";
      out = ((out + "      ") + r.subtitle) + "\n";
    };
    out = (out + vm.footer) + "\n";
    return out;
  };
}
export class NotesPage__Registry  {
  items!: Array<NotesPage>;
  constructor() {
    if (NotesPage__Registry.__singleton_instance != null) {
      return NotesPage__Registry.__singleton_instance;
    }
    this.items = [];
    NotesPage__Registry.__singleton_instance = this;
  }
  track (inst : NotesPage) : void  {
    this.items.push(inst);
  };
  untrack (inst : NotesPage) : void  {
    let kept : Array<NotesPage> | undefined  = [];
    for ( let i = 0; i < this.items.length; i++) {
      var x = this.items[i];
      if ( x.__rangerId != inst.__rangerId ) {
        kept.push(x);
      }
    };
    this.items = kept;
  };
  all () : Array<NotesPage>  {
    return this.items;
  };
  stopAllInstances () : void  {
    const n : number  = this.items.length;
    let i : number  = n - 1;
    while (i >= 0) {
      const inst : NotesPage  = this.items[i];
      if ( inst.__rangerId != 0 ) {
        inst.__rangerStopSubtree();
      }
      i = i - 1;
    };
  };
  static __singleton_instance : NotesPage__Registry | null = null;
  static __singleton() : NotesPage__Registry {
    if (this.__singleton_instance == null) {
      this.__singleton_instance = new NotesPage__Registry();
    }
    return this.__singleton_instance;
  };
}

// @process named-path helpers (generated)
export type ProcessPath = "app.notes";
export interface ProcessNameRegistry {
  findProcess(path: "app.notes"): NotesPage | undefined;
  findProcess(path: string): RangerProcessBase | undefined;
}
