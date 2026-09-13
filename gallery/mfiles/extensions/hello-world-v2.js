// SPDX-License-Identifier: AGPL-3.0-or-later
// @uix 2
// @name Hello World (UIX v2)
// @guid {6F4D3A10-0001-4000-8000-00000000C0DE}
//
// The smallest useful UIX v2 application: a command in the context menu and
// the task pane that greets the selected objects, and a toast when the frame
// starts. Everything is async — note the awaits on command creation.

function OnNewShellUI(shellUI) {
  shellUI.Events.Register(Event.NewNormalShellFrame, (shellFrame) => {
    shellFrame.Events.Register(Event.Started, async () => {
      const commands = shellFrame.Commands;
      const hello = await commands.CreateCustomCommand("Say hello");
      await commands.AddCustomCommandToMenu(hello, MenuLocation.MenuLocation_ContextMenu_Bottom, 10);
      await commands.AddCustomCommandToMenu(hello, MenuLocation.MenuLocation_TopPaneMenu, 10);

      commands.Events.Register(Event.CustomCommand, async (commandId) => {
        if (commandId !== hello) return;
        const selection = shellFrame.Listing.CurrentSelection;
        const titles = selection.ObjectVersions.map((ov) => ov.version_info.title);
        const text = titles.length ? "Hello, " + titles.join(" and ") + "!" : "Hello! Select an object and try again.";
        const answer = await shellFrame.ShowMessage({
          caption: "Hello World",
          message: text,
          button1_title: "Nice",
          button2_title: "Close",
        });
        console.log("the user pressed button", answer.selectedButton);
      });

      await shellFrame.ShowToast("Hello World", "UIX v2 application started", ToastType.ToastType_Info);
    });
  });
}

window.OnNewShellUI = OnNewShellUI;
