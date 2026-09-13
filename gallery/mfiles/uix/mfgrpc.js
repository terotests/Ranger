// SPDX-License-Identifier: AGPL-3.0-or-later
//
// mfgrpc.js — the helper API of @m-filescorporation/uix-vault-messages, emulated.
//
// Implemented from the package's published declarations (helpers/static and
// helpers/dynamic): constructors that accept message data, PascalCase helper
// accessors over the snake_case wire fields, and the static builders
// (TypedValue.Text, PropertyValue.Bool, SearchCondition.Property …).
//
// Available as the global `MFGrpc` (and `getGRPCApi()` / `getMFiles()`), because
// an unbundled script cannot import it. Helper accessors never reach the wire:
// uix-core's serializer drops PascalCase keys.
//
// Not emulated: runtime validation beyond "is it an object" (ValidateObject
// always answers valid), and message types without helpers — pass plain
// objects for those, exactly as the real package allows.

// Class bodies in Ranger's ComponentEngine do not close over the function
// they are declared in, so everything a class method reaches — the helpers and
// the sibling classes — goes through this one global namespace.
var __mfg = {};

var MFGrpc = (function () {
  function copy(target, data) {
    if (data && typeof data === "object") {
      Object.keys(data).forEach(function (k) {
        target[k] = data[k];
      });
    }
    return target;
  }

  function toTimestamp(value) {
    var ms;
    if (value instanceof Date) ms = value.getTime();
    else if (typeof value === "number") ms = value;
    else ms = new Date(String(value)).getTime();
    return { seconds: Math.floor(ms / 1000), nanos: 0 };
  }

  function fromTimestamp(ts) {
    return ts ? new Date((ts.seconds || 0) * 1000) : null;
  }

  class ItemID {
    constructor(data) {
      __mfg.copy(this, data);
    }
    get ID() {
      return this.internal_id ?? 0;
    }
    set ID(v) {
      this.internal_id = v;
    }
    get ExternalID() {
      return this.external_repository_id ?? null;
    }
    get IsExternal() {
      return !!this.external_repository_id;
    }
    static Create(id) {
      return new __mfg.ItemID({ internal_id: id });
    }
  }

  class ObjID {
    constructor(data) {
      __mfg.copy(this, data);
      if (this.item_id === undefined) this.item_id = {};
    }
    get ID() {
      return this.item_id ? this.item_id.internal_id ?? null : null;
    }
    set ID(v) {
      this.item_id = this.item_id || {};
      this.item_id.internal_id = v;
    }
    get Type() {
      return this.type ?? 0;
    }
    set Type(v) {
      this.type = v;
    }
    get IsExternal() {
      return !!(this.item_id && this.item_id.external_repository_id);
    }
    static Create(id, type) {
      return new __mfg.ObjID({ type: type || 0, item_id: { internal_id: id } });
    }
  }

  class ObjVerVersion {
    constructor(data) {
      __mfg.copy(this, data);
    }
    get Version() {
      return this.internal_version ?? null;
    }
    set Version(v) {
      this.type = 4;
      this.internal_version = v;
    }
    static Create(version) {
      return new __mfg.ObjVerVersion({ type: 4, internal_version: version });
    }
  }

  class ObjVer {
    constructor(data) {
      __mfg.copy(this, data);
      if (typeof this.version === "number") this.version = { type: 4, internal_version: this.version };
      if (this.obj_id === undefined) this.obj_id = { item_id: {} };
      if (this.version === undefined) this.version = { type: 1 };
    }
    get ID() {
      return this.obj_id && this.obj_id.item_id ? this.obj_id.item_id.internal_id ?? null : null;
    }
    set ID(v) {
      this.obj_id = this.obj_id || {};
      this.obj_id.item_id = this.obj_id.item_id || {};
      this.obj_id.item_id.internal_id = v;
    }
    get Type() {
      return this.obj_id ? this.obj_id.type ?? null : null;
    }
    set Type(v) {
      this.obj_id = this.obj_id || {};
      this.obj_id.type = v;
    }
    get Version() {
      return this.version && this.version.type === 4 ? this.version.internal_version : null;
    }
    set Version(v) {
      this.version = v === undefined || v === null || v < 0 ? { type: 1 } : { type: 4, internal_version: v };
    }
    get ObjID() {
      return this.obj_id ? new __mfg.ObjID(this.obj_id) : null;
    }
    set ObjID(o) {
      this.obj_id = o ? { type: o.type, item_id: o.item_id } : undefined;
    }
    get IsExternal() {
      return !!(this.obj_id && this.obj_id.item_id && this.obj_id.item_id.external_repository_id);
    }
    static Create(type, internalId, version) {
      var v = new __mfg.ObjVer({ obj_id: { type: type, item_id: { internal_id: internalId } } });
      v.Version = version;
      return v;
    }
  }

  class Lookup {
    constructor(data) {
      __mfg.copy(this, data);
      if (this.value_list_item_info === undefined) this.value_list_item_info = { obj_id: { item_id: {} } };
    }
    get Item() {
      var o = this.value_list_item_info && this.value_list_item_info.obj_id;
      return o && o.item_id ? o.item_id.internal_id ?? null : null;
    }
    set Item(v) {
      var info = (this.value_list_item_info = this.value_list_item_info || {});
      info.obj_id = info.obj_id || {};
      info.obj_id.item_id = info.obj_id.item_id || {};
      info.obj_id.item_id.internal_id = v;
    }
    get ValueList() {
      var o = this.value_list_item_info && this.value_list_item_info.obj_id;
      return o ? o.type ?? null : null;
    }
    set ValueList(v) {
      var info = (this.value_list_item_info = this.value_list_item_info || {});
      info.obj_id = info.obj_id || {};
      info.obj_id.type = v;
    }
    get Title() {
      return this.value_list_item_info ? this.value_list_item_info.name ?? null : null;
    }
    set Title(v) {
      this.value_list_item_info = this.value_list_item_info || {};
      this.value_list_item_info.name = v;
    }
    get Version() {
      return this.version && this.version.type === 4 ? this.version.internal_version : null;
    }
    set Version(v) {
      this.version = v === undefined ? { type: 1 } : { type: 4, internal_version: v };
    }
    get Deleted() {
      return false;
    }
    ToString() {
      return this.Item === null ? null : String(this.Item);
    }
    static Create(item, valueList, title) {
      var l = new __mfg.Lookup();
      l.Item = item;
      if (valueList !== undefined) l.ValueList = valueList;
      if (title !== undefined) l.Title = title;
      l.version = { type: 1 };
      return l;
    }
  }

  function toLookup(v) {
    if (v instanceof __mfg.Lookup) return v;
    if (typeof v === "number") return __mfg.Lookup.Create(v);
    return new __mfg.Lookup(v);
  }

  class MultiSelectLookup {
    constructor(data) {
      __mfg.copy(this, data);
      this.values = (this.values || []).map((x) => __mfg.toLookup(x));
    }
    get Count() {
      return this.values.length;
    }
    Add(value) {
      this.values.push(__mfg.toLookup(value));
      return this;
    }
    ToArray() {
      return this.values.slice();
    }
    ToString() {
      return this.values.length ? this.values.map((l) => l.ToString()).join(";") : null;
    }
    static Create(values) {
      return new __mfg.MultiSelectLookup({ values: (values || []).map((x) => __mfg.toLookup(x)) });
    }
  }

  class TypedValue {
    constructor(data) {
      __mfg.copy(this, data);
      if (this.type === undefined) this.type = 0;
    }
    get IsNull() {
      return !!this.is_null_value || !this.data;
    }
    Set(type, value) {
      this.type = type;
      if (value === undefined || value === null) {
        this.is_null_value = true;
        delete this.data;
        return;
      }
      this.is_null_value = false;
      switch (type) {
        case 1:
          this.data = { text: String(value) };
          break;
        case 13:
          this.data = { multi_line_text: String(value) };
          break;
        case 2:
          this.data = { integer: Math.trunc(Number(value)) };
          break;
        case 11:
          this.data = { integer64: Math.trunc(Number(value)) };
          break;
        case 3:
          this.data = { real_number: Number(value) };
          break;
        case 4:
          this.data = { decimal_number: String(value) };
          break;
        case 8:
          this.data = { boolean: !!value };
          break;
        case 5:
          this.data = { date: __mfg.toTimestamp(value) };
          break;
        case 6:
          this.data = { time: __mfg.toTimestamp(value) };
          break;
        case 7:
          this.data = { timestamp: __mfg.toTimestamp(value) };
          break;
        case 9:
          this.data = { lookup: __mfg.toLookup(value) };
          break;
        case 10:
          this.data = { multi_select_lookup: __mfg.MultiSelectLookup.Create(Array.isArray(value) ? value : [value]) };
          break;
        default:
          throw new Error("TypedValue.Set: unsupported datatype " + type);
      }
    }
    AsBool() {
      return this.IsNull ? null : !!this.data.boolean;
    }
    AsNumber() {
      if (this.IsNull) return null;
      var d = this.data;
      if (d.integer !== undefined) return d.integer;
      if (d.integer64 !== undefined) return d.integer64;
      if (d.real_number !== undefined) return d.real_number;
      if (d.decimal_number !== undefined) return Number(d.decimal_number);
      return null;
    }
    AsDate() {
      if (this.IsNull) return null;
      return __mfg.fromTimestamp(this.data.date || this.data.timestamp || this.data.time);
    }
    AsText() {
      if (this.IsNull) return null;
      var d = this.data;
      if (d.text !== undefined) return d.text;
      if (d.multi_line_text !== undefined) return d.multi_line_text;
      if (d.lookup) return new __mfg.Lookup(d.lookup).Title;
      if (d.multi_select_lookup) return (d.multi_select_lookup.values || []).map((l) => new __mfg.Lookup(l).Title).join("; ");
      var n = this.AsNumber();
      if (n !== null) return String(n);
      if (d.boolean !== undefined) return d.boolean ? "Yes" : "No";
      var date = this.AsDate();
      return date ? date.toISOString() : null;
    }
    AsLookup() {
      if (this.IsNull) return null;
      if (this.data.lookup) return new __mfg.Lookup(this.data.lookup);
      var many = this.AsLookups();
      return many.length ? many[0] : null;
    }
    AsLookups() {
      if (this.IsNull) return [];
      if (this.data.multi_select_lookup) return (this.data.multi_select_lookup.values || []).map((l) => new __mfg.Lookup(l));
      return this.data.lookup ? [new __mfg.Lookup(this.data.lookup)] : [];
    }
    static Create(type, value) {
      var tv = new __mfg.TypedValue();
      tv.Set(type, value);
      return tv;
    }
    static Text(v) {
      return __mfg.TypedValue.Create(1, v);
    }
    static MultiText(v) {
      return __mfg.TypedValue.Create(13, v);
    }
    static Int(v) {
      return __mfg.TypedValue.Create(2, v);
    }
    static Float(v) {
      return __mfg.TypedValue.Create(3, v);
    }
    static Bool(v) {
      return __mfg.TypedValue.Create(8, v);
    }
    static Date(v) {
      return __mfg.TypedValue.Create(5, v);
    }
    static Time(v) {
      return __mfg.TypedValue.Create(6, v);
    }
    static Timestamp(v) {
      return __mfg.TypedValue.Create(7, v);
    }
    static Lookup(v) {
      return __mfg.TypedValue.Create(9, v);
    }
    static MultiLookup(v) {
      return __mfg.TypedValue.Create(10, v);
    }
  }

  class PropertyValue {
    constructor(data) {
      __mfg.copy(this, data);
      this.value = new __mfg.TypedValue(this.value);
    }
    SetText(v) {
      this.value.Set(1, v);
    }
    SetMultiText(v) {
      this.value.Set(13, v);
    }
    SetInt(v) {
      this.value.Set(2, v);
    }
    SetFloat(v) {
      this.value.Set(3, v);
    }
    SetBool(v) {
      this.value.Set(8, v);
    }
    SetDate(v) {
      this.value.Set(5, v);
    }
    SetTime(v) {
      this.value.Set(6, v);
    }
    SetTimestamp(v) {
      this.value.Set(7, v);
    }
    SetLookup(v) {
      this.value.Set(9, v);
    }
    SetMultiLookup(v) {
      this.value.Set(10, v);
    }
    static Create(propertyDef, type, value) {
      return new __mfg.PropertyValue({ property_def: propertyDef, value: __mfg.TypedValue.Create(type, value) });
    }
    static CreateWithTypedValue(propertyDef, value) {
      return new __mfg.PropertyValue({ property_def: propertyDef, value: value });
    }
    static Text(pd, v) {
      return __mfg.PropertyValue.Create(pd, 1, v);
    }
    static MultiText(pd, v) {
      return __mfg.PropertyValue.Create(pd, 13, v);
    }
    static Int(pd, v) {
      return __mfg.PropertyValue.Create(pd, 2, v);
    }
    static Float(pd, v) {
      return __mfg.PropertyValue.Create(pd, 3, v);
    }
    static Bool(pd, v) {
      return __mfg.PropertyValue.Create(pd, 8, v);
    }
    static Date(pd, v) {
      return __mfg.PropertyValue.Create(pd, 5, v);
    }
    static Time(pd, v) {
      return __mfg.PropertyValue.Create(pd, 6, v);
    }
    static Timestamp(pd, v) {
      return __mfg.PropertyValue.Create(pd, 7, v);
    }
    static Lookup(pd, v) {
      return __mfg.PropertyValue.Create(pd, 9, v);
    }
    static MultiLookup(pd, v) {
      return __mfg.PropertyValue.Create(pd, 10, v);
    }
  }

  class PropertyValueArray {
    constructor(data) {
      __mfg.copy(this, data);
      this.value = (this.value || []).map((p) => new __mfg.PropertyValue(p));
    }
    get Count() {
      return this.value.length;
    }
    Add(propertyDef, type, value) {
      this.value.push(__mfg.PropertyValue.Create(propertyDef, type, value));
      return this;
    }
    AddWithTypedValue(propertyDef, value) {
      this.value.push(__mfg.PropertyValue.CreateWithTypedValue(propertyDef, value));
      return this;
    }
    Get(propertyDef) {
      return this.value.find((p) => p.property_def === propertyDef) || null;
    }
    Set(propertyValue) {
      this.Remove(propertyValue.property_def);
      this.value.push(propertyValue);
      return this;
    }
    Remove(propertyDef) {
      this.value = this.value.filter((p) => p.property_def !== propertyDef);
      return this;
    }
  }

  var Expression = {
    Text: (options) => ({ type: 6, data: { any_field: { options: options } } }),
    Status: (type) => ({ type: 3, data: { status_value: { type: type } } }),
    Property: (propertyDef) => ({ type: 1, data: { property_value: { property_def: propertyDef } } }),
    AnyLookupProperty: (valueList) => ({ type: 5, data: { typed_value: { datatype: 9, value_list: valueList } } }),
  };

  var SearchCondition = {
    Text: (options, condition, value) => ({ expression: __mfg.Expression.Text(options), type: condition, value: __mfg.TypedValue.Text(value) }),
    Status: (type, condition, dataType, value) => ({ expression: __mfg.Expression.Status(type), type: condition, value: __mfg.TypedValue.Create(dataType, value) }),
    StatusWithTypedValue: (type, condition, value) => ({ expression: __mfg.Expression.Status(type), type: condition, value: value }),
    Property: (propertyDef, condition, dataType, value) => ({
      expression: __mfg.Expression.Property(propertyDef),
      type: condition,
      value: __mfg.TypedValue.Create(dataType, value),
    }),
    PropertyWithTypedValue: (propertyDef, condition, value) => ({ expression: __mfg.Expression.Property(propertyDef), type: condition, value: value }),
    AnyLookupProperty: (valueList, condition, value) => ({
      expression: __mfg.Expression.AnyLookupProperty(valueList),
      type: condition,
      value: Array.isArray(value) ? __mfg.TypedValue.MultiLookup(value) : __mfg.TypedValue.Lookup(value),
    }),
  };

  class SearchConditionArray {
    constructor(data) {
      __mfg.copy(this, data);
      this.value = this.value || [];
    }
    get Count() {
      return this.value.length;
    }
    Add(condition) {
      this.value.push(condition);
      return this;
    }
    Text(options, condition, value) {
      return this.Add(__mfg.SearchCondition.Text(options, condition, value));
    }
    Status(type, condition, dataType, value) {
      return this.Add(__mfg.SearchCondition.Status(type, condition, dataType, value));
    }
    StatusWithTypedValue(type, condition, value) {
      return this.Add(__mfg.SearchCondition.StatusWithTypedValue(type, condition, value));
    }
    Property(propertyDef, condition, dataType, value) {
      return this.Add(__mfg.SearchCondition.Property(propertyDef, condition, dataType, value));
    }
    PropertyWithTypedValue(propertyDef, condition, value) {
      return this.Add(__mfg.SearchCondition.PropertyWithTypedValue(propertyDef, condition, value));
    }
    AnyLookupProperty(valueList, condition, value) {
      return this.Add(__mfg.SearchCondition.AnyLookupProperty(valueList, condition, value));
    }
    AddPropertyCondition(propertyDef, condition, dataType, value) {
      return this.Property(propertyDef, condition, dataType, value);
    }
    AddObjectTypeCondition(objectType) {
      return this.Status(6, 1, 9, objectType);
    }
    AddDeletedCondition(deleted) {
      return this.Status(5, 1, 8, !!deleted);
    }
    static Create(conditions) {
      return new __mfg.SearchConditionArray({ value: conditions || [] });
    }
  }

  class FileVer {
    constructor(data) {
      __mfg.copy(this, data);
    }
    get ID() {
      return this.file_id ? this.file_id.internal_id ?? null : null;
    }
    set ID(v) {
      this.file_id = this.file_id || {};
      this.file_id.internal_id = v;
    }
    get Version() {
      return this.internal_version ?? 0;
    }
    set Version(v) {
      this.type = 4;
      this.internal_version = v;
    }
    static Create(id, version) {
      return new __mfg.FileVer({ file_id: { internal_id: id }, type: 4, internal_version: version });
    }
  }

  var sessionUser = null;
  function currentUserId() {
    if (sessionUser === null) {
      var s = __mfOp("session.info");
      sessionUser = s ? s.user_id : -1;
    }
    return sessionUser;
  }

  class ObjectVersionEx {
    constructor(data) {
      __mfg.copy(this, data);
      this.version_info = this.version_info || {};
      this.object_info = this.object_info || {};
    }
    get ObjID() {
      return this.object_info.obj_id ? new __mfg.ObjID(this.object_info.obj_id) : null;
    }
    get ID() {
      var o = this.object_info.obj_id;
      return o && o.item_id ? o.item_id.internal_id : 0;
    }
    get ExternalID() {
      return this.object_info.external_id ?? null;
    }
    get Type() {
      return this.object_info.obj_id ? this.object_info.obj_id.type : null;
    }
    get Version() {
      return this.version_info.version ? this.version_info.version.internal_version ?? null : null;
    }
    get Title() {
      return this.version_info.title ?? null;
    }
    get Class() {
      return this.version_info.class_id ?? null;
    }
    get GUID() {
      return this.object_info.guid ?? null;
    }
    get IsExternal() {
      return !!this.object_info.external_id;
    }
    get IsCheckedOut() {
      return !!this.object_info.checked_out_to_user_id;
    }
    get CheckedOutTo() {
      return this.object_info.checked_out_to_user_id ?? null;
    }
    get CheckedOutToUserName() {
      return this.object_info.checked_out_to_user_name ?? null;
    }
    get CheckedOutToHostName() {
      return this.object_info.checked_out_to_host_name ?? null;
    }
    get IsCheckedOutToThisUserOnAnyHost() {
      return this.IsCheckedOut && this.CheckedOutTo === __mfg.currentUserId();
    }
    get IsCheckedOutToThisUserOnThisHost() {
      return this.IsCheckedOutToThisUserOnAnyHost;
    }
    get IsCheckedOutToAnotherUser() {
      return this.IsCheckedOut && this.CheckedOutTo !== __mfg.currentUserId();
    }
    get IsLatestToThisUser() {
      return true;
    }
    get IsLatestAndEditableToThisUser() {
      return !this.IsCheckedOutToAnotherUser;
    }
    get IsSingleFileObject() {
      return !!this.version_info.is_single_file_object;
    }
    get IsMFDWithoutFiles() {
      return !this.IsSingleFileObject && (this.version_info.files || []).length === 0;
    }
    get IsDeleted() {
      return !!this.object_info.deleted;
    }
    get HasRelatedObjects() {
      return false;
    }
    get HasFileDuplicates() {
      return false;
    }
    get IsDocumentCollection() {
      return this.Type === 9;
    }
    get ObjectFileName() {
      var f = (this.version_info.files || [])[0];
      return f ? f.title + (f.extension ? "." + f.extension : "") : this.Title || "";
    }
    AsObjVer() {
      return __mfg.ObjVer.Create(this.Type, this.ID, this.Version);
    }
    GetFiles() {
      return (this.version_info.files || []).slice();
    }
    GetPrimaryFileIfAvailable() {
      var files = this.version_info.files || [];
      return files.length === 1 ? files[0] : null;
    }
  }

  var api = {
    ItemID: ItemID,
    ObjID: ObjID,
    ObjVer: ObjVer,
    ObjVerVersion: ObjVerVersion,
    Lookup: Lookup,
    MultiSelectLookup: MultiSelectLookup,
    TypedValue: TypedValue,
    PropertyValue: PropertyValue,
    PropertyValueArray: PropertyValueArray,
    Expression: Expression,
    SearchCondition: SearchCondition,
    SearchConditionArray: SearchConditionArray,
    FileVer: FileVer,
    ObjectVersionEx: ObjectVersionEx,
  };
  Object.assign(__mfg, api, { copy: copy, toTimestamp: toTimestamp, fromTimestamp: fromTimestamp, toLookup: toLookup, currentUserId: currentUserId });
  return api;
})();

var getGRPCApi = () => MFGrpc;
var getMFiles = () => MFGrpc;
function ValidateObject(className, value) {
  var ok = value !== null && typeof value === "object";
  return { isValid: ok, errors: ok ? [] : [{ field: className, message: "not an object" }] };
}
