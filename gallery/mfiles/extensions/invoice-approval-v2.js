// SPDX-License-Identifier: AGPL-3.0-or-later
// @uix 2
// @name Invoice Approval (UIX v2, uix-vault-messages)
// @guid {6F4D3A10-0003-4000-8000-00000000C0DE}
//
// Written against @m-filescorporation/uix-vault-messages (MFGrpc):
//
//   - resolves its metadata by ALIAS (PD.Approved, CL.Invoice) instead of ids
//   - "Approve invoice" appears in the context menu only when the selection is
//     an invoice that is not approved yet (SetCommandState on SelectionChanged)
//   - approving is SetPropertiesMultiple with MFGrpc.PropertyValue.Bool
//   - "Find unapproved invoices" in the task pane is a SearchObjects built with
//     MFGrpc.SearchConditionArray
//   - deleting an approved invoice is VETOED from the BuiltinCommand event

// The class property. The v2 MFBuiltInPropertyDef enum names only NameOrTitle,
// Created, LastModified and SingleFileObject, so Class is spelled out.
const PD_CLASS = 100;

function OnNewShellUI(shellUI) {
  const vault = shellUI.Vault;
  const ids = {};

  async function alias(itemType, name) {
    const res = await vault.VaultOperations.GetMetadataStructureItemIdByAlias({ item_type: itemType, alias: name });
    return res.id;
  }

  function isUnapprovedInvoice(ov, props) {
    if (!ov || ov.version_info.class_id !== ids.invoice) return false;
    const approved = (props || []).find((p) => p.property_def === ids.approved);
    return !approved || !new MFGrpc.TypedValue(approved.value).AsBool();
  }

  shellUI.Events.Register(Event.NewNormalShellFrame, (shellFrame) => {
    shellFrame.Events.Register(Event.Started, async () => {
      ids.approved = await alias(MetadataStructureItem.METADATA_STRUCTURE_ITEM_PROPERTY_DEF, "PD.Approved");
      ids.invoice = await alias(MetadataStructureItem.METADATA_STRUCTURE_ITEM_OBJECT_CLASS, "CL.Invoice");

      const commands = shellFrame.Commands;
      const approve = await commands.CreateCustomCommand("Approve invoice");
      await commands.AddCustomCommandToMenu(approve, MenuLocation.MenuLocation_ContextMenu_Top || MenuLocation.MenuLocation_ContextMenu_Open, 1);
      await commands.SetCommandState(approve, CommandLocation.ContextMenu, CommandState.CommandState_Hidden);

      const find = await commands.CreateCustomCommand("Find unapproved invoices");
      await commands.AddCustomCommandToMenu(find, MenuLocation.MenuLocation_TopPaneMenu, 20);

      shellFrame.Listing.Events.Register(Event.SelectionChanged, async (items) => {
        const all = await items.GetObjectVersionsAndProperties();
        const show = all.objects.length === 1 && isUnapprovedInvoice(all.objects[0], all.properties[0].value);
        await commands.SetCommandState(approve, CommandLocation.ContextMenu, show ? CommandState.CommandState_Active : CommandState.CommandState_Hidden);
      });

      commands.Events.Register(Event.CustomCommand, async (commandId) => {
        if (commandId === approve) {
          const ov = new MFGrpc.ObjectVersionEx(shellFrame.Listing.CurrentSelection.ObjectVersions[0]);
          const params = {
            obj_ver: MFGrpc.ObjVer.Create(ov.Type, ov.ID, ov.Version),
            allow_modifying_checked_in_object: true,
            set_properties: [MFGrpc.PropertyValue.Bool(ids.approved, true)],
          };
          try {
            await vault.ObjectOperations.SetPropertiesMultiple({ properties: [params] });
            await shellFrame.ShowToast("Invoice approved", ov.Title, ToastType.ToastType_Success);
            await commands.SetCommandState(approve, CommandLocation.ContextMenu, CommandState.CommandState_Hidden);
            await shellFrame.Listing.RefreshListing();
          } catch (e) {
            await shellFrame.ShowToast("Approval failed", e.message, ToastType.ToastType_Error);
          }
        }
        if (commandId === find) {
          const conditions = new MFGrpc.SearchConditionArray()
            .Property(PD_CLASS, ConditionType.CONDITION_TYPE_EQUAL, Datatype.DATATYPE_LOOKUP, ids.invoice)
            .Property(ids.approved, ConditionType.CONDITION_TYPE_NOT_EQUAL, Datatype.DATATYPE_BOOLEAN, true);
          conditions.AddDeletedCondition(false);
          const res = await vault.SearchOperations.SearchObjects({ conditions: [conditions], limit: 100 });
          const titles = res.results.map((r) => new MFGrpc.ObjectVersionEx(r.object).Title);
          await shellFrame.ShowMessage({
            caption: "Unapproved invoices",
            message: titles.length + " invoice(s) waiting:\n" + titles.join("\n"),
          });
        }
      });

      commands.Events.Register(Event.BuiltinCommand, async (commandId) => {
        if (commandId !== BuiltinCommand.Delete) return true;
        const all = await shellFrame.Listing.CurrentSelection.GetObjectVersionsAndProperties();
        const approved = all.objects.some((ov, i) => ov.version_info.class_id === ids.invoice && !isUnapprovedInvoice(ov, all.properties[i].value));
        if (approved) {
          // Not awaited: the veto must be answered now, and the message stays
          // open until the user closes it.
          shellFrame.ShowMessage("Approved invoices cannot be deleted.");
          return false;
        }
        return true;
      });
    });
  });
}

window.OnNewShellUI = OnNewShellUI;
