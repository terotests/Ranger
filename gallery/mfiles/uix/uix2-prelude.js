// SPDX-License-Identifier: AGPL-3.0-or-later
//
// uix2-prelude.js — UIX v2, emulated.
//
// The object model of @m-filescorporation/uix-extensions (index.d.ts): IShellUI,
// IShellFrame, ICommands, IShellListing, IShellPaneContainer, IShellPaneTab,
// IDashboard, ICommonFunctions — every method async, every event registered
// through `Events.Register(Event.X, handler)`.
//
// `shellUI.Vault` is IVault: one object per operation group, one function per
// method, built from the list in uix-api.js. A method the emulator does not
// implement still exists and rejects with code 501 naming itself.
//
// The enums (Event, MenuLocation, Datatype, ConditionType …) are installed as
// globals, since an unbundled script has nowhere to import them from. A bundled
// application carries its own copies, which agree with these by construction.
//
// Emulator limits, stated where they bite:
//   - dashboards are not HTML pages; a tab or popup shows the dashboard id and
//     its data, and `data.emulatorView = { title, rows: [[label, value]], text }`
//     is drawn as a small card
//   - ShowNewObjectWindow / ShowEditObjectWindow open a placeholder that answers
//     Cancel

(function () {
  var names = Object.keys(__MF_ENUMS);
  for (var i = 0; i < names.length; i++) {
    globalThis[names[i]] = __MF_ENUMS[names[i]];
  }
})();

// The developer documentation's own samples spell every enum through an MFiles
// namespace — MFiles.MenuLocation.MenuLocation_ContextMenu_Bottom,
// MFiles.Event.CustomCommand — so both spellings work.
var MFiles = Object.assign({}, __MF_ENUMS);

function __mfShellItems(data) {
  var d = data || { objects: [], properties: [] };
  var objs = d.objects || [];
  return {
    Count: objs.length,
    ObjectVersions: objs,
    ObjectFiles: [],
    Folders: [],
    GetObjectVersionsCount: () => Promise.resolve(objs.length),
    GetFoldersCount: () => Promise.resolve(0),
    GetObjectVersionsAndProperties: () => Promise.resolve({ objects: objs, properties: d.properties || [] }),
  };
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
        return __mfShellItems(__mfOp("listing.selection"));
      case "items":
        return __mfShellItems(__mfOp("listing.items"));
    }
  }
  return a;
}

function __mfDialogObject(id, dashboardId, data, frame) {
  var dash = {
    Events: __mfEvents("dashboard:" + id),
    CustomData: data,
    ShellFrame: frame,
    IsPopupDashboard: true,
    Window: {
      Events: __mfEvents("window:" + id),
      SetDefaultSize: () => Promise.resolve(),
      ResizeToDefaultSize: () => Promise.resolve(),
      SetSize: () => Promise.resolve(),
      SetTitle: (title) => {
        __mfOp("popup.title", { id: id, title: String(title) });
        return Promise.resolve();
      },
      SetCloseIconVisibility: () => Promise.resolve(),
      Close: () => {
        __mfOp("dialog.close", { id: id });
        return Promise.resolve();
      },
    },
    UpdateCustomData: (customData) => {
      dash.CustomData = customData;
      __mfOpRaw("popup.data", { id: id, data: customData === undefined ? null : customData });
      return Promise.resolve();
    },
    WaitForClose: () => closed,
  };
  var closed = __mfAwait(id);
  __mfCommon(dash);
  return dash;
}

function __mfCommon(target) {
  target.CurrentApplicationPlatform = "web";
  target.AnonymousUser = false;
  target.ReportException = function (e) {
    __mfReport(e, "ReportException");
    return Promise.resolve(0);
  };
  target.WriteToWebStorage = (key, value) => {
    __mfOp("storage.write", { key: String(key), value: String(value) });
    return Promise.resolve(true);
  };
  target.ReadFromWebStorage = (key) => {
    var r = __mfOp("storage.read", { key: String(key) });
    return Promise.resolve(r && r.exists ? r.value : null);
  };
  target.DeleteFromWebStorage = (key) => {
    __mfOp("storage.delete", { key: String(key) });
    return Promise.resolve();
  };
  target.GetClientLanguage = () => Promise.resolve("en");
  target.GetClientLocale = () => Promise.resolve("en-US");
  target.GetVaultInfo = () => Promise.resolve(__mfOp("vault.info"));
  target.GetSessionInfo = () => Promise.resolve(__mfOp("session.info"));
  target.ShowToast = (title, message, type) => {
    __mfOp("toast.show", { title: String(title ?? ""), message: String(message ?? ""), type: type || 0 });
    return Promise.resolve();
  };
  target.GetWebLink = (objId) => Promise.resolve(__mfOp("weblink", { objId: objId }).url);
  target.OpenExternalWebLink = (url) => {
    __mf_log("info", "OpenExternalWebLink: " + url);
    return Promise.resolve();
  };
  target.GetAccentColor = () => Promise.resolve("#1d6fd8");
  target.GetUTCOffset = () => Promise.resolve(0);
  target.ShowMessage = function (message) {
    var p = typeof message === "string" ? { message: message } : message || {};
    var buttons = [p.button1_title, p.button2_title, p.button3_title].filter((b) => !!b);
    var r = __mfOp("message.show", {
      caption: String(p.caption || p.title || ""),
      message: String(p.message ?? ""),
      buttons: buttons,
    });
    return __mfAwait(r.id).then(function (v) {
      if (typeof p.onClose === "function") p.onClose(v);
      return v;
    });
  };
  target.ShowPopupDashboard = function (dashboardId, data, titleOrOptions) {
    var title = typeof titleOrOptions === "string" ? titleOrOptions : (titleOrOptions && titleOrOptions.title) || dashboardId;
    var r = __mfOpRaw("popup.show", { dashboard: String(dashboardId), data: data === undefined ? null : data, title: title });
    return Promise.resolve(__mfDialogObject(r.id, dashboardId, data, __mf.frame));
  };
  var objectWindow = (title) =>
    __mfAwait(__mfOp("object.window", { title: title }).id).then((v) => ({
      acl: {},
      object_version: null,
      properties: [],
      result_code: v && v.result_code !== undefined ? v.result_code : 1,
      visible: true,
    }));
  target.ShowNewObjectWindow = () => objectWindow("New object");
  target.ShowEditObjectWindow = () => objectWindow("Edit object");
  return target;
}

var shellUI = __mfCommon({
  Events: __mfEvents("shellui"),
  Vault: (function () {
    var vault = {};
    Object.keys(__MF_VAULT_API).forEach(function (group) {
      var g = {};
      __MF_VAULT_API[group].forEach(function (method) {
        g[method] = (request) => __mfVaultAsync(group + "." + method, request);
      });
      vault[group] = g;
    });
    return vault;
  })(),
  GetFileTypeIconURL: (fileName) => Promise.resolve("emulator://icons/file/" + String(fileName || "")),
  GetObjectTypeIconURL: (objType) => Promise.resolve("emulator://icons/objecttype/" + objType),
  NotifyApplication: (appGUID, msgID, data) => {
    __mfOpRaw("notify", { appGuid: appGUID, msgId: msgID, data: data === undefined ? null : data });
    return Promise.resolve();
  },
  BroadcastMessage: (msgID, data) => {
    __mfOpRaw("broadcast", { msgId: msgID, data: data === undefined ? null : data });
    return Promise.resolve();
  },
});

function __mfTab(tabId) {
  var state = () => __mfOp("tab.get", { tabId: tabId }) || {};
  return {
    Events: __mfEvents("tab:" + tabId),
    TabId: tabId,
    get Title() {
      return state().title;
    },
    get Visible() {
      return !!state().visible;
    },
    get Selected() {
      return !!state().selected;
    },
    get IsBuiltIn() {
      return !!state().builtIn;
    },
    tabPosition: "",
    icon: "",
    Select: () => {
      __mfOp("tab.select", { tabId: tabId });
      return Promise.resolve();
    },
    Unselect: () => {
      __mfOp("tab.unselect", { tabId: tabId });
      return Promise.resolve(true);
    },
    Remove: () => {
      __mfOp("tab.remove", { tabId: tabId });
      return Promise.resolve();
    },
    SetVisible: (visible) => {
      __mfOp("tab.visible", { tabId: tabId, visible: visible !== false });
      return Promise.resolve();
    },
    ShowDashboard: (dashboardId, data) => {
      __mfOpRaw("tab.dashboard", { tabId: tabId, dashboard: String(dashboardId), data: data === undefined ? null : data });
      return Promise.resolve({ CustomData: data, IsPopupDashboard: false });
    },
    ShowEmptyContent: () => {
      __mfOp("tab.empty", { tabId: tabId });
      return Promise.resolve();
    },
  };
}

function __mfPane(name) {
  return {
    Events: __mfEvents(name === "right" ? "rightpane" : "leftpane"),
    Visible: true,
    Minimized: false,
    Size: 360,
    Available: true,
    get ShellFrame() {
      return __mfFrame();
    },
    AddTab: (tabId, title, insertBeforeTabId) => {
      __mfOp("pane.addTab", { pane: name, tabId: String(tabId), title: String(title), before: String(insertBeforeTabId || "") });
      return Promise.resolve(__mfTab(String(tabId)));
    },
    GetTab: (tabId) => {
      var t = __mfOp("tab.get", { tabId: String(tabId) });
      return Promise.resolve(t && !t.missing ? __mfTab(String(tabId)) : null);
    },
    GetSelectedTabs: () => {
      var r = __mfOp("pane.selectedTabs", { pane: name });
      return Promise.resolve(r.tabs.map((t) => __mfTab(t.tabId)));
    },
  };
}

function __mfFrame() {
  if (__mf.frame) return __mf.frame;
  var done = () => Promise.resolve();
  var commands = {
    Events: __mfEvents("commands"),
    GetCommandName: (id) => Promise.resolve((__mfOp("command.name", { id: id }) || {}).name || ""),
    SetCommandState: (id, location, state) => {
      __mfOp("command.setState", { id: id, location: location, state: state });
      return done();
    },
    GetCommandState: (id) => Promise.resolve((__mfOp("command.getState", { id: id }) || {}).state),
    CreateCustomCommand: (name) => Promise.resolve(__mfOp("command.create", { name: String(name) }).id),
    DeleteCustomCommand: (id) => {
      __mfOp("command.delete", { id: id });
      return done();
    },
    SetMenuItemState: (menuItemId, state) => {
      __mfOp("menu.state", { id: menuItemId, state: state });
      return done();
    },
    CreateSubMenuItem: (parentMenuItemId, customCommand, orderPriority) =>
      Promise.resolve(__mfOp("menu.sub", { parent: parentMenuItemId, command: customCommand, priority: orderPriority || 0 }).id),
    RemoveMenuItem: (menuItemId) => {
      __mfOp("menu.removeItem", { id: menuItemId });
      return done();
    },
    AddCustomCommandToMenu: (customCommand, location, orderPriority) =>
      Promise.resolve(__mfOp("menu.add", { command: customCommand, location: location, priority: orderPriority || 0 }).id),
    RemoveCustomCommandFromMenu: (customCommand, location) => {
      __mfOp("menu.remove", { command: customCommand, location: location });
      return done();
    },
    ExecuteCommand: (commandId, args) => {
      __mfOpRaw("command.execute", { id: commandId, args: args === undefined ? null : args });
      return done();
    },
    GetMenuIdOfBuiltInCommand: (commandId) => Promise.resolve(commandId),
    // Icons are accepted and not drawn: the emulator's menus are text.
    SetIcon: () => done(),
  };
  var select = (objVers, on, clear) => {
    __mfOp("listing.select", { obj_vers: objVers, select: on, clear: clear });
    return done();
  };
  var listing = {
    Events: __mfEvents("listing"),
    get Items() {
      return __mfShellItems(__mfOp("listing.items"));
    },
    get CurrentSelection() {
      return __mfShellItems(__mfOp("listing.selection"));
    },
    get CurrentPath() {
      return __mfOp("frame.state").path;
    },
    IsActive: true,
    UnselectAll: () => {
      __mfOp("listing.unselectAll");
      return done();
    },
    ReplaceFile: () => Promise.reject(new Error("Files are not emulated")),
    AddObjectFile: () => Promise.reject(new Error("Files are not emulated")),
    SelectObjectVersion: (objVer) => select([objVer], true, true),
    SelectObjectFile: (objVer) => select([objVer], true, true),
    SelectObjectOrObjectFileVersion: (p) => select([p.obj_ver], true, true),
    SelectFolder: done,
    SetObjectVersionSelectionStates: (objVers, on) => select(objVers, on !== false, false),
    SetObjectOrObjectFileVersionSelectionStates: (list, on) => select(list.map((p) => p.obj_ver), on !== false, false),
    SetFolderSelectionStates: done,
    SetFolderOrObjectVersionSelectionStates: (folders, objVers, files, on) => select(objVers || [], on !== false, false),
    SetVirtualSelection: (list) => select(list.map((p) => p.obj_ver), true, true),
    ActivateSelected: done,
    SelectNextObject: () => {
      __mfOp("listing.step", { delta: 1 });
      return done();
    },
    SelectPrevObject: () => {
      __mfOp("listing.step", { delta: -1 });
      return done();
    },
    SelectNextObjectFile: done,
    SelectPrevObjectFile: done,
    SelectNextFolder: done,
    SelectPrevFolder: done,
    ActivateListing: done,
    RefreshListing: () => {
      __mfOp("listing.refresh");
      return done();
    },
    RefreshObject: () => {
      __mfOp("listing.refresh");
      return done();
    },
    AddListingItem: () => {
      __mfOp("listing.refresh");
      return done();
    },
    UpdateListingItem: () => {
      __mfOp("listing.refresh");
      return Promise.resolve(true);
    },
    RemoveListingItem: () => {
      __mfOp("listing.refresh");
      return done();
    },
  };
  var state = () => __mfOp("frame.state") || {};
  var frame = __mfCommon({
    Events: __mfEvents("frame"),
    get CurrentPath() {
      return state().path;
    },
    get CurrentUrl() {
      return state().url;
    },
    CurrentFolder: [],
    ParentFolder: [],
    ActiveListing: listing,
    Listing: listing,
    RightPane: __mfPane("right"),
    LeftPane: __mfPane("left"),
    SearchPane: {
      Events: __mfEvents("searchpane"),
      Available: true,
      SearchWithinViewOptionVisible: false,
      UseRadioButtonsForFTSScope: false,
      SetOptionState: done,
      GetOptions: () => Promise.resolve([]),
      IsSearchView: () => Promise.resolve(!!state().isSearch),
      GetSearchCriteria: () => Promise.resolve({ conditions: [] }),
    },
    Commands: commands,
    ShellUI: shellUI,
    IsObjectLocation: () => Promise.resolve(!!state().isObjectLocation),
    IsFolderLocation: () => Promise.resolve(!!state().isFolderLocation),
    NavigateToParent: () => {
      __mfOp("frame.parent");
      return done();
    },
    ShowDefaultContent: () => {
      __mfOp("frame.defaultContent");
      return done();
    },
    ShowDashboard: (dashboardId, data) => {
      __mfOpRaw("frame.dashboard", { dashboard: String(dashboardId), data: data === undefined ? null : data });
      return done();
    },
    NavigateToObject: (objId) => {
      __mfOp("frame.navigateObject", objId || {});
      return done();
    },
    NavigateToFolder: (folders) => {
      var list = (folders && folders.folders) || [];
      var view = list.find((f) => f && f.data && f.data.view_folder);
      if (view) __mfOp("frame.navigateView", { id: view.data.view_folder.id });
      return done();
    },
    GetViewsById: () => {
      var r = __mfOp("frame.views") || { views: [] };
      var map = new Map();
      (r.views || []).forEach((v) => map.set(v.id, v));
      return Promise.resolve(map);
    },
  });
  __mf.frame = frame;
  return frame;
}
