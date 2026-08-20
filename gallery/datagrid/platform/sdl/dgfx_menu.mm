// macOS File menu for the DataGrid SDL host.
// Extends SDL's default menu bar with Open / Save / Save As / Quit.

#import <Cocoa/Cocoa.h>
#include "dgfx_menu.h"

#include <mutex>
#include <vector>

namespace {
std::mutex g_mu;
std::vector<int> g_actions;

void pushAction(int a) {
    std::lock_guard<std::mutex> lock(g_mu);
    g_actions.push_back(a);
}
} // namespace

@interface DgfxMenuTarget : NSObject
- (void)onOpen:(id)sender;
- (void)onSave:(id)sender;
- (void)onSaveAs:(id)sender;
- (void)onQuit:(id)sender;
@end

@implementation DgfxMenuTarget
- (void)onOpen:(id)sender { (void)sender; pushAction(DGFX_MENU_OPEN); }
- (void)onSave:(id)sender { (void)sender; pushAction(DGFX_MENU_SAVE); }
- (void)onSaveAs:(id)sender { (void)sender; pushAction(DGFX_MENU_SAVE_AS); }
- (void)onQuit:(id)sender { (void)sender; pushAction(DGFX_MENU_QUIT); }
@end

static DgfxMenuTarget* g_target = nil;

static NSMenuItem* addItem(NSMenu* menu, NSString* title, SEL sel, NSString* key,
                           NSEventModifierFlags mods) {
    NSMenuItem* item = [[NSMenuItem alloc] initWithTitle:title
                                                  action:sel
                                           keyEquivalent:key];
    item.target = g_target;
    if (mods != 0) {
        item.keyEquivalentModifierMask = mods;
    }
    [menu addItem:item];
    return item;
}

extern "C" void dgfx_install_menus(void) {
    @autoreleasepool {
        if (NSApp == nil) {
            return;
        }
        if (g_target == nil) {
            g_target = [[DgfxMenuTarget alloc] init];
        }

        NSMenu* mainMenu = [NSApp mainMenu];
        if (mainMenu == nil) {
            mainMenu = [[NSMenu alloc] init];
            [NSApp setMainMenu:mainMenu];
        }

        for (NSInteger i = (NSInteger)mainMenu.numberOfItems - 1; i >= 0; --i) {
            NSMenuItem* it = [mainMenu itemAtIndex:i];
            if ([it.submenu.title isEqualToString:@"File"]) {
                [mainMenu removeItemAtIndex:i];
            }
        }

        NSMenuItem* fileRoot = [[NSMenuItem alloc] init];
        NSMenu* fileMenu = [[NSMenu alloc] initWithTitle:@"File"];
        fileRoot.submenu = fileMenu;

        addItem(fileMenu, @"Open…", @selector(onOpen:), @"o", NSEventModifierFlagCommand);
        [fileMenu addItem:[NSMenuItem separatorItem]];
        addItem(fileMenu, @"Save", @selector(onSave:), @"s", NSEventModifierFlagCommand);
        addItem(fileMenu, @"Save As…", @selector(onSaveAs:), @"s",
                NSEventModifierFlagCommand | NSEventModifierFlagShift);
        [fileMenu addItem:[NSMenuItem separatorItem]];
        addItem(fileMenu, @"Quit", @selector(onQuit:), @"q", NSEventModifierFlagCommand);

        if (mainMenu.numberOfItems > 0) {
            [mainMenu insertItem:fileRoot atIndex:1];
        } else {
            [mainMenu addItem:fileRoot];
        }
    }
}

extern "C" int dgfx_pop_menu_action(void) {
    std::lock_guard<std::mutex> lock(g_mu);
    if (g_actions.empty()) {
        return DGFX_MENU_NONE;
    }
    int a = g_actions.front();
    g_actions.erase(g_actions.begin());
    return a;
}
