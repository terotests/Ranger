// SPDX-License-Identifier: AGPL-3.0-or-later
//
// uix1-prelude.js — UIX v1, emulated.
//
// The classic M-Files UI Extensibility Framework: the same shellUI / shellFrame
// shapes as v2, but SYNCHRONOUS and COM-flavoured —
//
//   shellUI.Events.Register(Event_NewNormalShellFrame, fn)   returns the handle
//   collections are 1-based: sel.ObjectVersions.Item(1), .Count
//   vault.ObjectPropertyOperations.GetProperties(objVer)      returns now
//   MFiles.CreateInstance("SearchCondition")                  builds COM objects
//   constants as globals: MFDatatypeText, MFConditionTypeEqual, Event_Started …
//
// Underneath it is the same gRPC Vault API as v2 (__mfVaultSync), so v1 and
// v2 applications see the same vault behave the same way — including the
// refusal to modify a checked-in object through SetProperty.
//
// Emulator limits:
//   - ShowMessage cannot block a single-threaded engine; it opens the dialog
//     and returns 1 at once
//   - ShowPopupDashboard(…, waitUntilClosed=true) does not wait either

var MFiles = { Event: {} };

function __v1Const(group, prefix, table) {
  MFiles[group] = MFiles[group] || {};
  Object.keys(table).forEach(function (k) {
    MFiles[group][k] = table[k];
    globalThis[prefix + k] = table[k];
  });
}

__v1Const("Event", "Event_", {
  Started: 2,
  Stop: 3,
  NewShellFrame: 7,
  NewNormalShellFrame: 8,
  NewRightPane: 14,
  NewShellListing: 15,
  NewCommands: 16,
  ActiveListingChanged: 17,
  TabSelected: 19,
  TabUnselected: 20,
  BuiltinCommand: 22,
  CustomCommand: 23,
  SelectionChanged: 24,
  SelectedItemsChanged: 25,
  ContentChanged: 26,
  ShowContextMenu: 27,
  ListingActivated: 29,
  ListingDeactivated: 30,
  CloseWindow: 33,
  ListItemAdded: 152,
  ListItemModified: 153,
  ListItemRemoved: 154,
  CrossApplicationNotification: 168,
  NewLeftPane: 170,
  ViewLocationChanged: 188,
  ViewLocationChangedAsync: 189,
});
__v1Const("CommandLocation", "CommandLocation_", { Undefined: 0, MainMenu: 1, ContextMenu: 2, All: 3, ActivityContextMenu: 6 });
__v1Const("CommandState", "CommandState_", { Undefined: 0, Active: 1, Inactive: 2, Hidden: 3 });
__v1Const("MenuLocation", "MenuLocation_", {
  TopPaneMenu: 47,
  TaskPane_Top: 48,
  TaskPane_Middle: 49,
  TaskPane_Bottom: 50,
  ContextMenu_Top: 51,
  ContextMenu_Open: 51,
  ContextMenu_Checkout: 52,
  ContextMenu_Share: 53,
  ContextMenu_ObjectOperations: 26,
  ContextMenu_DocumentConversions: 41,
  ContextMenu_WorkflowActions: 54,
  ContextMenu_Organize: 55,
  ContextMenu_VersionControl: 56,
  ContextMenu_Create: 57,
  ContextMenu_ViewOptions: 58,
  ContextMenu_Edit: 37,
  ContextMenu_Bottom: 43,
  ContextMenu_More: 99,
});
__v1Const("BuiltinCommand", "BuiltinCommand_", { MakeCopy: 9, CheckOut: 10, CheckIn: 11, UndoCheckOut: 13, Delete: 76, NewObject: 87 });
__v1Const("MFDatatype", "MFDatatype", {
  Uninitialized: 0,
  Text: 1,
  Integer: 2,
  Floating: 3,
  Date: 5,
  Time: 6,
  Timestamp: 7,
  Boolean: 8,
  Lookup: 9,
  MultiSelectLookup: 10,
  Integer64: 11,
  MultiLineText: 13,
});
__v1Const("MFConditionType", "MFConditionType", {
  Equal: 1,
  NotEqual: 2,
  GreaterThan: 3,
  LessThan: 4,
  GreaterThanOrEqual: 5,
  LessThanOrEqual: 6,
  Contains: 7,
  DoesNotContain: 8,
  StartsWith: 9,
  DoesNotStartWith: 10,
  MatchesWildcardPattern: 11,
  IsMissing: 13,
  IsNotMissing: 14,
});
__v1Const("MFStatusType", "MFStatusType", { CheckedOut: 0, CheckedOutTo: 1, ObjectID: 3, ObjectVersion: 4, Deleted: 5, ObjectTypeID: 6 });
__v1Const("MFBuiltInPropertyDef", "MFBuiltInPropertyDef", {
  NameOrTitle: 0,
  Created: 20,
  LastModified: 21,
  SingleFileObject: 22,
  LastModifiedBy: 23,
  CreatedBy: 25,
  Workflow: 38,
  State: 39,
  AssignedTo: 44,
  Class: 100,
});
__v1Const("MFBuiltInObjectType", "MFBuiltInObjectType", { Document: 0, Assignment: 10 });
__v1Const("MFBuiltInValueList", "MFBuiltInValueList", { Classes: 1, Users: 6, Workflows: 7, States: 8 });
__v1Const("MFMetadataStructureItem", "MFMetadataStructureItem", { ObjectType: 1, PropertyDef: 2, Class: 3, ValueList: 14 });
var MFSearchFlagNone = 0;
var MFNamedValueTypeUserDefinedValue = 4;
var MFNamedValueTypeSystemAdminConfiguration = 7;

// --- COM building blocks -------------------------------------------------------

function __v1Coll(items) {
  var c = { _items: items || [] };
  Object.defineProperty(c, "Count", {
    get: function () {
      return c._items.length;
    },
  });
  c.Item = function (i) {
    if (i < 1 || i > c._items.length) throw new Error("Index out of range: " + i + " (collections are 1-based)");
    return c._items[i - 1];
  };
  c.Add = function (index, item) {
    if (index === -1 || index === undefined || index > c._items.length) c._items.push(item);
    else c._items.splice(index - 1, 0, item);
    return c._items.length;
  };
  c.Remove = function (i) {
    c._items.splice(i - 1, 1);
  };
  c.Clone = function () {
    return __v1Coll(c._items.slice());
  };
  c.forEach = function (fn) {
    c._items.forEach(fn);
  };
  return c;
}

function __v1ObjID(type, id) {
  var o = { Type: type || 0, ID: id || 0 };
  o.SetIDs = function (t, i) {
    o.Type = t;
    o.ID = i;
  };
  o.Clone = () => __v1ObjID(o.Type, o.ID);
  return o;
}

function __v1ObjVer(type, id, version) {
  var o = { Type: type || 0, ID: id || 0, Version: version === undefined ? -1 : version };
  Object.defineProperty(o, "ObjID", {
    get: function () {
      return __v1ObjID(o.Type, o.ID);
    },
  });
  o.SetIDs = function (t, i, v) {
    o.Type = t;
    o.ID = i;
    o.Version = v === undefined ? -1 : v;
  };
  o.SetObjIDAndVersion = function (objID, v) {
    o.Type = objID.Type;
    o.ID = objID.ID;
    o.Version = v === undefined ? -1 : v;
  };
  o.Clone = () => __v1ObjVer(o.Type, o.ID, o.Version);
  return o;
}

function __v1Lookup(item, display) {
  return { Item: item, DisplayValue: display || "", ObjectType: -1, Version: -1, Deleted: false };
}

function __v1TypedValue(dataType, value) {
  var tv = { DataType: dataType || 0, Value: null, DisplayValue: "", _lookups: [] };
  tv.SetValue = function (dt, v) {
    tv.DataType = dt;
    tv._lookups = [];
    if (v === null || v === undefined) {
      tv.Value = null;
      tv.DisplayValue = "";
      return;
    }
    if (dt === 9 || dt === 10) {
      var list = Array.isArray(v) ? v : v && v._items ? v._items : [v];
      tv._lookups = list.map((x) => (typeof x === "object" ? __v1Lookup(x.Item, x.DisplayValue) : __v1Lookup(Number(x), "")));
      tv.Value = dt === 9 ? (tv._lookups[0] ? tv._lookups[0].Item : null) : tv._lookups.map((l) => l.Item);
      tv.DisplayValue = tv._lookups.map((l) => l.DisplayValue || String(l.Item)).join("; ");
      return;
    }
    tv.Value = v;
    tv.DisplayValue = v instanceof Date ? v.toISOString() : dt === 8 ? (v ? "Yes" : "No") : String(v);
  };
  tv.SetValueToNULL = function (dt) {
    tv.SetValue(dt, null);
  };
  tv.IsNULL = () => tv.Value === null || tv.Value === undefined || tv.Value === "";
  tv.GetValueAsLookup = () => tv._lookups[0] || null;
  tv.GetValueAsLookups = () => __v1Coll(tv._lookups.slice());
  tv.GetValueAsLocalizedText = () => tv.DisplayValue;
  tv.GetValueAsUnlocalizedText = () => (tv.Value === null ? "" : String(tv.Value));
  tv.Clone = function () {
    var c = __v1TypedValue(tv.DataType);
    c.Value = tv.Value;
    c.DisplayValue = tv.DisplayValue;
    c._lookups = tv._lookups.slice();
    return c;
  };
  if (value !== undefined) tv.SetValue(dataType, value);
  return tv;
}

function __v1PropertyValue(pd, tv) {
  return { PropertyDef: pd || 0, TypedValue: tv || __v1TypedValue(0) };
}

function __v1PropertyValues(list) {
  var c = __v1Coll(list || []);
  c.SearchForProperty = (pd) => c._items.find((p) => p.PropertyDef === pd) || null;
  c.IndexOf = function (pd) {
    var i = c._items.findIndex((p) => p.PropertyDef === pd);
    return i < 0 ? -1 : i + 1;
  };
  c.SearchForPropertyEx = (pd) => c.SearchForProperty(pd);
  return c;
}

function __v1Expression() {
  var ex = { _type: 0, _pd: 0, _status: 0, _vl: -1, _dt: 0, _options: 0 };
  Object.defineProperty(ex, "Type", {
    get: () => ex._type,
  });
  Object.defineProperty(ex, "DataPropertyValuePropertyDef", {
    get: () => ex._pd,
    set: (v) => {
      ex._type = 1;
      ex._pd = v;
    },
  });
  Object.defineProperty(ex, "DataStatusValueType", {
    get: () => ex._status,
    set: (v) => {
      ex._type = 3;
      ex._status = v;
    },
  });
  ex.SetPropertyValueExpression = function (pd) {
    ex._type = 1;
    ex._pd = pd;
  };
  ex.SetStatusValueExpression = function (statusType) {
    ex._type = 3;
    ex._status = statusType;
  };
  ex.SetAnyFieldExpression = function (flags) {
    ex._type = 6;
    ex._options = flags || 0;
  };
  ex.SetTypedValueExpression = function (dt, valueList) {
    ex._type = 5;
    ex._dt = dt;
    ex._vl = valueList;
  };
  return ex;
}

function __v1SearchCondition() {
  return { ConditionType: 1, Expression: __v1Expression(), TypedValue: __v1TypedValue(0) };
}

MFiles.CreateInstance = function (name) {
  switch (name) {
    case "ObjID":
      return __v1ObjID(0, 0);
    case "ObjVer":
      return __v1ObjVer(0, 0, -1);
    case "TypedValue":
      return __v1TypedValue(0);
    case "PropertyValue":
      return __v1PropertyValue(0);
    case "PropertyValues":
      return __v1PropertyValues([]);
    case "SearchCondition":
      return __v1SearchCondition();
    case "SearchConditions":
      return __v1Coll([]);
    case "Lookup":
      return __v1Lookup(0, "");
    case "Lookups":
      return __v1Coll([]);
    case "Strings":
    case "SourceObjectFiles":
    case "ObjIDs":
    case "ObjVers":
      return __v1Coll([]);
    case "AccessControlList":
      return {};
    case "NamedValues":
      return __v1NamedValues({});
  }
  throw new Error("MFiles.CreateInstance: '" + name + "' is not emulated");
};

function __v1NamedValues(map) {
  var nv = { _map: map };
  Object.defineProperty(nv, "Names", {
    get: () => __v1Coll(Object.keys(nv._map)),
  });
  nv.Value = function (name, value) {
    if (value !== undefined) nv._map[name] = value;
    return nv._map[name];
  };
  return nv;
}

// --- wire ↔ COM ----------------------------------------------------------------

function __v1WireObjID(o) {
  return { type: o.Type, item_id: { internal_id: o.ID } };
}

function __v1WireObjVer(o) {
  return {
    obj_id: __v1WireObjID(o),
    version: o.Version === undefined || o.Version === null || o.Version < 0 ? { type: 1 } : { type: 4, internal_version: o.Version },
  };
}

function __v1FromTs(ts) {
  return ts ? new Date((ts.seconds || 0) * 1000) : null;
}

function __v1ToTs(v) {
  var d = v instanceof Date ? v : new Date(String(v));
  return { seconds: Math.floor(d.getTime() / 1000), nanos: 0 };
}

function __v1TypedValueFromWire(w) {
  var tv = __v1TypedValue(w ? w.type : 0);
  if (!w || w.is_null_value || !w.data) return tv;
  var d = w.data;
  var t = w.type;
  if (d.lookup || d.multi_select_lookup) {
    var ls = d.lookup ? [d.lookup] : d.multi_select_lookup.values || [];
    tv.SetValue(
      t,
      ls.map((l) => ({ Item: l.value_list_item_info.obj_id.item_id.internal_id, DisplayValue: l.value_list_item_info.name || "" }))
    );
    return tv;
  }
  if (d.date || d.timestamp || d.time) {
    tv.SetValue(t, __v1FromTs(d.date || d.timestamp || d.time));
    if (d.date) tv.DisplayValue = tv.Value.toISOString().slice(0, 10);
    return tv;
  }
  var raw =
    d.text !== undefined
      ? d.text
      : d.multi_line_text !== undefined
      ? d.multi_line_text
      : d.integer !== undefined
      ? d.integer
      : d.integer64 !== undefined
      ? d.integer64
      : d.real_number !== undefined
      ? d.real_number
      : d.boolean;
  tv.SetValue(t, raw);
  return tv;
}

function __v1TypedValueToWire(tv) {
  var t = tv.DataType;
  if (tv.IsNULL()) return { type: t, is_null_value: true };
  var data = {};
  switch (t) {
    case 1:
      data.text = String(tv.Value);
      break;
    case 13:
      data.multi_line_text = String(tv.Value);
      break;
    case 2:
      data.integer = Math.trunc(Number(tv.Value));
      break;
    case 11:
      data.integer64 = Math.trunc(Number(tv.Value));
      break;
    case 3:
      data.real_number = Number(tv.Value);
      break;
    case 8:
      data.boolean = !!tv.Value;
      break;
    case 5:
      data.date = __v1ToTs(tv.Value);
      break;
    case 7:
      data.timestamp = __v1ToTs(tv.Value);
      break;
    case 9:
    case 10:
      var lookups = tv._lookups.map((l) => ({ value_list_item_info: { obj_id: { item_id: { internal_id: l.Item } } }, version: { type: 1 } }));
      if (t === 9) data.lookup = lookups[0];
      else data.multi_select_lookup = { values: lookups };
      break;
  }
  return { type: t, is_null_value: false, data: data };
}

function __v1PropsFromWire(list) {
  return __v1PropertyValues((list || []).map((p) => __v1PropertyValue(p.property_def, __v1TypedValueFromWire(p.value))));
}

function __v1PropsToWire(pvs) {
  var items = pvs && pvs._items ? pvs._items : Array.isArray(pvs) ? pvs : [pvs];
  return items.map((p) => ({ property_def: p.PropertyDef, value: __v1TypedValueToWire(p.TypedValue) }));
}

function __v1ObjectVersion(ex) {
  var vi = ex.version_info || {};
  var oi = ex.object_info || {};
  var id = oi.obj_id || { type: 0, item_id: {} };
  return {
    ObjVer: __v1ObjVer(id.type, id.item_id.internal_id, vi.version ? vi.version.internal_version : -1),
    Title: vi.title || "",
    Class: vi.class_id,
    SingleFile: !!vi.is_single_file_object,
    ObjectCheckedOut: !!oi.checked_out_to_user_id,
    CheckedOutTo: oi.checked_out_to_user_id || 0,
    CheckedOutToUserName: oi.checked_out_to_user_name || "",
    Deleted: !!oi.deleted,
    LastModifiedUtc: __v1FromTs(vi.last_modified_at_utc),
    CreatedUtc: __v1FromTs(oi.created_at_utc),
    ObjectGUID: oi.guid || "",
    Files: __v1Coll(
      (vi.files || []).map((f) => ({
        ID: f.file_ver && f.file_ver.file_id ? f.file_ver.file_id.internal_id : 0,
        Version: f.file_ver ? f.file_ver.internal_version : 1,
        Title: f.title,
        Extension: f.extension,
        LogicalSize: f.size,
      }))
    ),
    get FilesCount() {
      return (vi.files || []).length;
    },
  };
}

// --- the vault -------------------------------------------------------------------

var __v1Vault = (function () {
  var call = __mfVaultSync;
  var session = null;
  function info() {
    if (!session) session = __mfOp("vault.info") || {};
    return session;
  }
  function data(objVer) {
    var r = call("ObjectOperations.GetObjectDataOfMultipleObjects", { obj_vers: [__v1WireObjVer(objVer)] }).results[0];
    if (!r || !r.object_data) throw new Error("Object not found (" + objVer.Type + "-" + objVer.ID + ")");
    return r.object_data;
  }
  function ovap(d) {
    var ov = __v1ObjectVersion(d.object_version);
    return { ObjVer: ov.ObjVer, VersionData: ov, Properties: __v1PropsFromWire(d.properties ? d.properties.value : []), Vault: vault };
  }
  function latestOvap(objID) {
    return ovap(data(__v1ObjVer(objID.Type, objID.ID, -1)));
  }
  function conditionsToWire(conds) {
    var items = conds && conds._items ? conds._items : conds || [];
    return items.map(function (sc) {
      var ex = sc.Expression;
      var expression;
      if (ex._type === 1) expression = { type: 1, data: { property_value: { property_def: ex._pd } } };
      else if (ex._type === 3) expression = { type: 3, data: { status_value: { type: ex._status } } };
      else if (ex._type === 5) expression = { type: 5, data: { typed_value: { datatype: ex._dt, value_list: ex._vl } } };
      else expression = { type: 6, data: { any_field: { options: ex._options } } };
      return { expression: expression, type: sc.ConditionType, value: __v1TypedValueToWire(sc.TypedValue) };
    });
  }
  function search(conds, limit) {
    var res = call("SearchOperations.SearchObjects", { conditions: [{ value: conditionsToWire(conds) }], limit: limit || 0 });
    return __v1Coll((res.results || []).map((r) => __v1ObjectVersion(r.object)));
  }
  function setProps(objVer, pvs, fullSet, allowCheckedIn, remove) {
    var params = { obj_ver: __v1WireObjVer(objVer), set_properties: pvs ? __v1PropsToWire(pvs) : [], is_full_set: !!fullSet };
    if (allowCheckedIn) params.allow_modifying_checked_in_object = true;
    if (remove) params.remove_properties = remove;
    var res = call("ObjectOperations.SetPropertiesMultiple", { properties: [params] });
    var lv = res.results[0].latest_version;
    return { ObjVer: __v1ObjectVersion(lv.object_version).ObjVer, VersionData: __v1ObjectVersion(lv.object_version), Properties: __v1PropsFromWire(lv.properties), Vault: vault };
  }
  function alias(itemType, name) {
    try {
      return call("VaultOperations.GetMetadataStructureItemIdByAlias", { item_type: itemType, alias: name }).id;
    } catch (e) {
      return -1;
    }
  }
  function propertyDefs() {
    return call("PropertyDefsOperations.GetPropertyDefs", {}).property_defs || [];
  }
  function toPropertyDef(p) {
    return { ID: p.id, Name: p.name, DataType: p.data_type, ValueList: p.value_list === undefined ? -1 : p.value_list, BasedOnValueList: !!p.is_based_on_value_list, Predefined: !!p.is_predefined };
  }
  function classes() {
    return call("PropertyDefsOperations.GetObjectClassesAndGroups", {}).classes || [];
  }
  function toClass(c) {
    return {
      ID: c.base_info.item_info.obj_id.item_id.internal_id,
      Name: c.base_info.item_info.name,
      ObjectType: c.object_type,
      NamePropertyDef: c.name_property_def,
      AssociatedPropertyDefs: __v1Coll((c.associated_property_defs || []).map((a) => ({ PropertyDef: a.property_def, Required: !!a.is_required }))),
    };
  }
  function toObjectType(t) {
    return { ID: t.id, NameSingular: t.name_singular, NamePlural: t.name_plural, RealObjectType: !!t.is_real_object_type };
  }
  var vault = {
    get Name() {
      return info().Name;
    },
    get CurrentLoggedInUserID() {
      return info().LoggedInUserId;
    },
    GetGUID: () => info().GUID,
    ObjectOperations: {
      GetObjectInfo: (objVer, latest) => __v1ObjectVersion(data(latest ? __v1ObjVer(objVer.Type, objVer.ID, -1) : objVer).object_version),
      GetLatestObjVer: (objID) => __v1ObjectVersion(data(__v1ObjVer(objID.Type, objID.ID, -1)).object_version).ObjVer,
      GetLatestObjectVersionAndProperties: (objID) => latestOvap(objID),
      GetObjectVersionAndProperties: (objVer) => ovap(data(objVer)),
      IsObjectCheckedOut: (objID) => __v1ObjectVersion(data(__v1ObjVer(objID.Type, objID.ID, -1)).object_version).ObjectCheckedOut,
      CheckOut: (objID) => __v1ObjectVersion(call("ObjectOperations.CheckOutMultiple", { obj_ids: [__v1WireObjID(objID)] }).checked_out_versions[0].object_version),
      CheckIn: (objVer) => __v1ObjectVersion(call("ObjectOperations.CheckInMultiple", { obj_vers: [__v1WireObjVer(objVer)] }).results[0].latest_version.object_version),
      UndoCheckout: (objVer) => {
        var r = call("ObjectOperations.UndoCheckoutMultiple", { obj_vers: [__v1WireObjVer(objVer)] }).results[0];
        return r ? __v1ObjectVersion(r.latest_version.object_version) : null;
      },
      CreateNewObjectEx: (type, pvs, files, sfd, checkIn) => {
        var r = call("ObjectOperations.AddObjectWithFiles", { object_type_id: type, properties: __v1PropsToWire(pvs), check_in: checkIn !== false });
        var wp = r.created_object;
        return { ObjVer: __v1ObjectVersion(wp.object_version).ObjVer, VersionData: __v1ObjectVersion(wp.object_version), Properties: __v1PropsFromWire(wp.properties), Vault: vault };
      },
      CreateNewObject: (type, pvs) => vault.ObjectOperations.CreateNewObjectEx(type, pvs, null, false, false),
      CreateNewObjectExQuick: (type, pvs, files, sfd, checkIn) => vault.ObjectOperations.CreateNewObjectEx(type, pvs, files, sfd, checkIn).ObjVer.ID,
      RemoveObject: (objID) => {
        call("ObjectOperations.RemoveObjects", { obj_ids: [__v1WireObjID(objID)] });
      },
      DestroyObject: (objID) => {
        call("ObjectOperations.DestroyObjects", { obj_ids: [__v1WireObjID(objID)] });
      },
    },
    ObjectPropertyOperations: {
      GetProperties: (objVer) => __v1PropsFromWire(data(objVer).properties.value),
      GetPropertiesForDisplay: (objVer) => {
        var defs = propertyDefs();
        var props = data(objVer).properties.value || [];
        return __v1Coll(
          props.map(function (p) {
            var tv = __v1TypedValueFromWire(p.value);
            var d = defs.find((x) => x.id === p.property_def);
            return { PropertyDef: p.property_def, PropertyDefName: d ? d.name : "", DisplayValue: tv.DisplayValue, TypedValue: tv };
          })
        );
      },
      GetProperty: (objVer, pd) => {
        var p = __v1PropsFromWire(data(objVer).properties.value).SearchForProperty(pd);
        if (!p) throw new Error("The object has no property " + pd);
        return p;
      },
      SetProperty: (objVer, pv) => setProps(objVer, [pv], false, false),
      SetProperties: (objVer, pvs) => setProps(objVer, pvs, false, false),
      SetAllProperties: (objVer, allowModifyingCheckedInObject, pvs) => setProps(objVer, pvs, true, allowModifyingCheckedInObject),
      RemoveProperty: (objVer, pd) => setProps(objVer, null, false, false, [pd]),
    },
    SearchOperations: {
      SearchForObjectsByConditions: (conds) => search(conds, 0),
      SearchForObjectsByConditionsEx: (conds, flags, sort, maxResults) => search(conds, maxResults || 0),
      SearchForObjectsByString: (text) => {
        var sc = __v1SearchCondition();
        sc.Expression.SetAnyFieldExpression(0);
        sc.ConditionType = 7;
        sc.TypedValue.SetValue(1, text);
        return search([sc], 0);
      },
    },
    PropertyDefOperations: {
      GetPropertyDef: (id) => {
        var p = propertyDefs().find((x) => x.id === id);
        if (!p) throw new Error("No property definition " + id);
        return toPropertyDef(p);
      },
      GetPropertyDefs: () => __v1Coll(propertyDefs().map(toPropertyDef)),
      GetPropertyDefIDByAlias: (a) => alias(2, a),
    },
    ClassOperations: {
      GetObjectClass: (id) => {
        var c = classes().find((x) => x.base_info.item_info.obj_id.item_id.internal_id === id);
        if (!c) throw new Error("No class " + id);
        return toClass(c);
      },
      GetAllObjectClasses: () => __v1Coll(classes().map(toClass)),
      GetObjectClassIDByAlias: (a) => alias(3, a),
    },
    ObjectTypeOperations: {
      GetObjectType: (id) => {
        var t = (call("ObjectTypesOperations.GetObjectTypes", {}).object_types || []).find((x) => x.id === id);
        if (!t) throw new Error("No object type " + id);
        return toObjectType(t);
      },
      GetObjectTypes: () => __v1Coll((call("ObjectTypesOperations.GetObjectTypes", {}).object_types || []).map(toObjectType)),
      GetObjectTypeIDByAlias: (a) => alias(1, a),
    },
    ValueListItemOperations: {
      GetValueListItems: (vl) =>
        __v1Coll(
          (call("ValueListsOperations.GetValueListItemsWithPermissions", { value_list: vl }).items || []).map((it) => ({
            ID: it.item_info.obj_id.item_id.internal_id,
            Name: it.item_info.name,
            ValueListID: vl,
            Deleted: false,
          }))
        ),
    },
    NamedValueStorageOperations: {
      GetNamedValues: (storageType, ns) => {
        var map = {};
        (call("NamedValueStorageOperations.GetNamedValues", { storage_type: storageType, namespace_name: ns }).values || []).forEach(
          (v) => (map[v.key] = v.value && v.value.data ? v.value.data.text : "")
        );
        return __v1NamedValues(map);
      },
      SetNamedValues: (storageType, ns, nv) => {
        var values = Object.keys(nv._map).map((k) => ({ key: k, value: { type: 1, data: { text: String(nv._map[k]) } } }));
        call("NamedValueStorageOperations.SetNamedValues", { storage_type: storageType, namespace_name: ns, values: values });
      },
      RemoveNamedValues: (storageType, ns, names) => {
        call("NamedValueStorageOperations.RemoveNamedValues", { storage_type: storageType, namespace_name: ns, keys: names._items || names });
      },
    },
    ExtensionMethodOperations: {
      ExecuteVaultExtensionMethod: (name, input) => call("VaultExtensionMethodsOperations.RunExtensionMethod", { method_name: name, input: String(input ?? "") }).output,
      DoesActiveVaultExtensionMethodExist: (name) => !!call("VaultExtensionMethodsOperations.IsExtensionMethodAvailable", { method_identifier: name }).is_active,
    },
  };
  return vault;
})();

// --- the shell -------------------------------------------------------------------

function __v1Selection(d) {
  var objs = (d && d.objects) || [];
  var props = (d && d.properties) || [];
  var versions = objs.map(__v1ObjectVersion);
  return {
    Count: objs.length,
    ObjectVersions: __v1Coll(versions),
    ObjectVersionsAndProperties: __v1Coll(
      versions.map((v, i) => ({ ObjVer: v.ObjVer, VersionData: v, Properties: __v1PropsFromWire(props[i] ? props[i].value : []), Vault: __v1Vault }))
    ),
    Folders: __v1Coll([]),
    ObjectFiles: __v1Coll([]),
  };
}

function __v1ShowMessage(message) {
  __mfOp("message.show", { caption: "", message: String(message), buttons: ["OK"] });
  return 1;
}

function __v1Tab(tabId) {
  var st = () => __mfOp("tab.get", { tabId: tabId }) || {};
  return {
    Events: __mfEvents("tab:" + tabId, true),
    TabId: tabId,
    get Title() {
      return st().title;
    },
    get Visible() {
      return !!st().visible;
    },
    get Selected() {
      return !!st().selected;
    },
    Select: () => void __mfOp("tab.select", { tabId: tabId }),
    Unselect: () => void __mfOp("tab.unselect", { tabId: tabId }),
    Remove: () => void __mfOp("tab.remove", { tabId: tabId }),
    ShowDashboard: (dashboardId, data) => void __mfOpRaw("tab.dashboard", { tabId: tabId, dashboard: String(dashboardId), data: data === undefined ? null : data }),
    ShowEmptyContent: () => void __mfOp("tab.empty", { tabId: tabId }),
  };
}

function __v1Pane(name) {
  return {
    Events: __mfEvents(name === "right" ? "rightpane" : "leftpane", true),
    Available: true,
    Visible: true,
    AddTab: (tabId, title, before) => {
      __mfOp("pane.addTab", { pane: name, tabId: String(tabId), title: String(title), before: String(before || "") });
      return __v1Tab(String(tabId));
    },
    GetTab: (tabId) => {
      var t = __mfOp("tab.get", { tabId: String(tabId) });
      return t && !t.missing ? __v1Tab(String(tabId)) : null;
    },
  };
}

var shellUI = {
  Events: __mfEvents("shellui", true),
  Vault: __v1Vault,
  ShowMessage: __v1ShowMessage,
  ShowPopupDashboard: (dashboardId, waitUntilClosed, data) => {
    __mfOpRaw("popup.show", { dashboard: String(dashboardId), data: data === undefined ? null : data, title: String(dashboardId) });
  },
  NotifyApplication: (appGUID, msgID, data) => void __mfOpRaw("notify", { appGuid: appGUID, msgId: msgID, data: data === undefined ? null : data }),
};

function __mfFrame() {
  if (__mf.frame) return __mf.frame;
  var commands = {
    Events: __mfEvents("commands", true),
    CreateCustomCommand: (name) => __mfOp("command.create", { name: String(name) }).id,
    DeleteCustomCommand: (id) => void __mfOp("command.delete", { id: id }),
    SetCommandState: (id, location, state) => void __mfOp("command.setState", { id: id, location: location, state: state }),
    GetCommandState: (id) => (__mfOp("command.getState", { id: id }) || {}).state,
    GetCommandName: (id) => (__mfOp("command.name", { id: id }) || {}).name || "",
    AddCustomCommandToMenu: (id, location, orderPriority) => __mfOp("menu.add", { command: id, location: location, priority: orderPriority || 0 }).id,
    RemoveCustomCommandFromMenu: (id, location) => void __mfOp("menu.remove", { command: id, location: location }),
    ExecuteCommand: (id, args) => void __mfOpRaw("command.execute", { id: id, args: args === undefined ? null : args }),
  };
  var listing = {
    Events: __mfEvents("listing", true),
    get CurrentSelection() {
      return __v1Selection(__mfOp("listing.selection"));
    },
    get Items() {
      return __v1Selection(__mfOp("listing.items"));
    },
    get CurrentPath() {
      return __mfOp("frame.state").path;
    },
    SelectObjectVersion: (objVer) => void __mfOp("listing.select", { obj_vers: [__v1WireObjVer(objVer)], select: true, clear: true }),
    UnselectAll: () => void __mfOp("listing.unselectAll"),
    RefreshListing: () => void __mfOp("listing.refresh"),
    RefreshObject: () => void __mfOp("listing.refresh"),
  };
  var frame = {
    Events: __mfEvents("frame", true),
    ShellUI: shellUI,
    Commands: commands,
    Listing: listing,
    ActiveListing: listing,
    RightPane: __v1Pane("right"),
    LeftPane: __v1Pane("left"),
    get CurrentPath() {
      return __mfOp("frame.state").path;
    },
    ShowMessage: __v1ShowMessage,
    ShowPopupDashboard: shellUI.ShowPopupDashboard,
    ShowDashboard: (dashboardId, data) => void __mfOpRaw("frame.dashboard", { dashboard: String(dashboardId), data: data === undefined ? null : data }),
    ShowDefaultContent: () => void __mfOp("frame.defaultContent"),
    NavigateToParent: () => void __mfOp("frame.parent"),
    NavigateToObject: (objVer) => void __mfOp("frame.navigateObject", __v1WireObjVer(objVer)),
  };
  __mf.frame = frame;
  return frame;
}

function __mfResolveRef(a) {
  if (a && typeof a === "object" && typeof a.$ref === "string") {
    var frame = __mfFrame();
    switch (a.$ref) {
      case "shellUI":
        return shellUI;
      case "shellFrame":
        return frame;
      case "listing":
        return frame.Listing;
      case "commands":
        return frame.Commands;
      case "rightPane":
        return frame.RightPane;
      case "leftPane":
        return frame.LeftPane;
      case "selection":
        return __v1Selection(__mfOp("listing.selection"));
      case "items":
        return __v1Selection(__mfOp("listing.items"));
    }
  }
  return a;
}
