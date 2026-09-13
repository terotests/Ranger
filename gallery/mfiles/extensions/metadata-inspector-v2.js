// SPDX-License-Identifier: AGPL-3.0-or-later
// @uix 2
// @name Metadata Inspector (UIX v2, gRPC)
// @guid {6F4D3A10-0002-4000-8000-00000000C0DE}
//
// A right-pane tab that follows the selection and shows every property of the
// selected object with its datatype, read through the gRPC Vault API:
//
//   PropertyDefsOperations.GetPropertyDefs            once, cached
//   ObjectOperations.GetObjectDataOfMultipleObjects   on every selection
//
// The tab's dashboard gets `emulatorView`, which the emulator draws as a card.
// In a real client the same data would go to an HTML dashboard.

const DATATYPE_NAMES = {
  1: "Text",
  2: "Integer",
  3: "Real",
  5: "Date",
  7: "Timestamp",
  8: "Boolean",
  9: "Lookup",
  10: "Multi-select lookup",
  13: "Multi-line text",
};

function display(value) {
  if (!value || value.is_null_value || !value.data) return "—";
  const d = value.data;
  if (d.text !== undefined) return d.text;
  if (d.multi_line_text !== undefined) return d.multi_line_text.split("\n")[0];
  if (d.integer !== undefined) return String(d.integer);
  if (d.real_number !== undefined) return String(d.real_number);
  if (d.boolean !== undefined) return d.boolean ? "Yes" : "No";
  if (d.lookup) return d.lookup.value_list_item_info.name;
  if (d.multi_select_lookup) return d.multi_select_lookup.values.map((l) => l.value_list_item_info.name).join("; ");
  const ts = d.date || d.timestamp;
  if (ts) return new Date(ts.seconds * 1000).toISOString().slice(0, d.date ? 10 : 16).replace("T", " ");
  return "?";
}

function OnNewShellUI(shellUI) {
  let propertyDefs = null;
  let calls = 0;

  async function defs() {
    if (!propertyDefs) {
      const res = await shellUI.Vault.PropertyDefsOperations.GetPropertyDefs({});
      propertyDefs = new Map(res.property_defs.map((p) => [p.id, p]));
    }
    return propertyDefs;
  }

  shellUI.Events.Register(Event.NewNormalShellFrame, (shellFrame) => {
    shellFrame.Events.Register(Event.Started, async () => {
      const tab = await shellFrame.RightPane.AddTab("inspector", "Inspector", "_preview");

      shellFrame.Listing.Events.Register(Event.SelectionChanged, async (items) => {
        if (items.ObjectVersions.length === 0) {
          await tab.ShowDashboard("inspector", { emulatorView: { title: "Inspector", text: "Select an object." } });
          return;
        }
        const ov = items.ObjectVersions[0];
        const res = await shellUI.Vault.ObjectOperations.GetObjectDataOfMultipleObjects({
          obj_vers: [{ obj_id: ov.object_info.obj_id, version: { type: ObjVerVersionType.OBJ_VER_VERSION_TYPE_LATEST } }],
          data_request: { required_data_flags: { properties: true } },
        });
        calls += 1;
        const map = await defs();
        const props = res.results[0].object_data.properties.value;
        const rows = props.map((p) => {
          const def = map.get(p.property_def);
          const kind = DATATYPE_NAMES[p.value.type] || "type " + p.value.type;
          return [(def ? def.name : "#" + p.property_def) + " · " + kind, display(p.value)];
        });
        await tab.ShowDashboard("inspector", {
          emulatorView: {
            title: ov.version_info.title,
            text: props.length + " properties, version " + ov.version_info.version.internal_version + " (vault call #" + calls + ")",
            rows: rows,
          },
        });
      });
    });
  });
}

window.OnNewShellUI = OnNewShellUI;
