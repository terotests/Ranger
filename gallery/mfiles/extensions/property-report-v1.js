// SPDX-License-Identifier: AGPL-3.0-or-later
// @uix 1
// @name Property Report (UIX v1)
// @guid {6F4D3A10-0004-4000-8000-00000000C0DE}
//
// A classic UIX v1 application: synchronous, COM-style collections, MFiles
// constants as globals. It adds a context-menu command that lists the selected
// object's properties, and a "Mark reviewed" command that writes a keyword the
// v1 way — check out, SetProperty, check in.
//
// Run the emulator in UIX v1 mode to load it.

function OnNewShellUI(shellUI) {
  shellUI.Events.Register(Event_NewNormalShellFrame, function (shellFrame) {
    shellFrame.Events.Register(Event_Started, function () {
      var vault = shellFrame.ShellUI.Vault;
      var report = shellFrame.Commands.CreateCustomCommand("Property report (v1)");
      var reviewed = shellFrame.Commands.CreateCustomCommand("Mark reviewed (v1)");
      shellFrame.Commands.AddCustomCommandToMenu(report, MenuLocation_ContextMenu_Bottom, 1);
      shellFrame.Commands.AddCustomCommandToMenu(reviewed, MenuLocation_ContextMenu_Bottom, 2);

      shellFrame.Commands.Events.Register(Event_CustomCommand, function (commandId) {
        var selection = shellFrame.Listing.CurrentSelection;
        if (selection.ObjectVersionsAndProperties.Count === 0) {
          shellFrame.ShowMessage("Select an object first.");
          return;
        }
        var ovap = selection.ObjectVersionsAndProperties.Item(1);

        if (commandId === report) {
          var props = vault.ObjectPropertyOperations.GetProperties(ovap.ObjVer, false);
          var lines = [];
          for (var i = 1; i <= props.Count; i++) {
            var pv = props.Item(i);
            var def = vault.PropertyDefOperations.GetPropertyDef(pv.PropertyDef);
            lines.push(def.Name + ": " + pv.TypedValue.DisplayValue);
          }
          shellFrame.ShowMessage(ovap.VersionData.Title + "\n\n" + lines.join("\n"));
        }

        if (commandId === reviewed) {
          var keywords = vault.PropertyDefOperations.GetPropertyDefIDByAlias("PD.Keywords");
          if (keywords < 0) keywords = 1010;
          var checkedOut = vault.ObjectOperations.CheckOut(ovap.ObjVer.ObjID);
          var pv2 = MFiles.CreateInstance("PropertyValue");
          pv2.PropertyDef = keywords;
          pv2.TypedValue.SetValue(MFDatatypeText, "reviewed");
          vault.ObjectPropertyOperations.SetProperty(checkedOut.ObjVer, pv2);
          var result = vault.ObjectOperations.CheckIn(checkedOut.ObjVer);
          console.log("marked reviewed, now version " + result.ObjVer.Version);
          shellFrame.Listing.RefreshListing();
        }
      });
    });
  });
}
