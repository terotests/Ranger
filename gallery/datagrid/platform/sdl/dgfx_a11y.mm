// macOS accessibility for the DataGrid SDL host: NSAccessibility elements over
// an OpenGL window.
//
// The window draws with the GPU, so it has no accessible children and VoiceOver
// finds an empty rectangle where a spreadsheet is. The app already publishes
// what the frame MEANS — `EVGA11yTree`, built in Ranger beside the display list
// and serialized by `GridApp.a11yJson()` — and this file turns each node into
// an `NSAccessibilityElement` hung off the window's content view. It is the
// same tree the browser page mirrors into DOM (`gallery/evg/gl/evg-a11y.js`);
// only the last step differs, which is the whole point of publishing a tree
// instead of teaching each host what a spreadsheet is.
//
// Elements are kept in a dictionary by node id and REUSED. That is what the
// stable ids in the tree are for: rebuilding the element VoiceOver is sitting
// on throws its cursor back to the top of the window, and on screen everything
// still looks perfectly correct.
//
// Memory: compiled without ARC (same as dgfx_menu.mm), so object members go
// through synthesized properties and the dictionary owns the elements.
//
// Coordinates: the tree is in window points with y running down from the top of
// the content area; NSAccessibility wants screen points with y running up from
// the bottom of the main screen. `screenRect` below is that conversion and is
// the thing most likely to need adjusting on a multi-display setup.

#import <Cocoa/Cocoa.h>
#include "dgfx_a11y.h"

#include <cstdlib>
#include <string>

// --- the press queue ---------------------------------------------------------
// A reader pressing something hands back a POINT, not a command: the host
// presses the app there and the app's own hit testing decides what that means.

static std::string g_pressOut;
static NSMutableArray<NSString*>* g_presses = nil;

static void queuePress(NSPoint p) {
    if (g_presses == nil) {
        g_presses = [[NSMutableArray alloc] init];
    }
    [g_presses addObject:[NSString stringWithFormat:@"%d,%d", (int)p.x, (int)p.y]];
}

// --- the element -------------------------------------------------------------

@interface DgfxA11yElement : NSAccessibilityElement
@property (nonatomic, copy) NSString* nodeId;
// The centre of this element in WINDOW POINTS, which is the space the app
// hit-tests in. Kept here so a press does not have to convert back from screen
// coordinates it was only ever given for VoiceOver's benefit.
@property (nonatomic) NSPoint appCentre;
@property (nonatomic) BOOL pressable;
@end

@implementation DgfxA11yElement
@synthesize nodeId = _nodeId;
@synthesize appCentre = _appCentre;
@synthesize pressable = _pressable;

- (BOOL)isAccessibilityElement {
    return YES;
}

- (BOOL)accessibilityPerformPress {
    if (!_pressable) {
        return NO;
    }
    queuePress(_appCentre);
    return YES;
}
@end

// --- state -------------------------------------------------------------------

static NSMutableDictionary<NSString*, DgfxA11yElement*>* g_els = nil;
static std::string g_lastJson;
static std::string g_lastFocus;

// --- helpers -----------------------------------------------------------------

static NSString* roleFor(NSString* aria) {
    if ([aria isEqualToString:@"button"])       return NSAccessibilityButtonRole;
    if ([aria isEqualToString:@"checkbox"])     return NSAccessibilityCheckBoxRole;
    // macOS has no separate tab role in this API; a tab really is a radio
    // button in a radio group, and VoiceOver announces it as one.
    if ([aria isEqualToString:@"radio"])        return NSAccessibilityRadioButtonRole;
    if ([aria isEqualToString:@"tab"])          return NSAccessibilityRadioButtonRole;
    if ([aria isEqualToString:@"textbox"])      return NSAccessibilityTextFieldRole;
    if ([aria isEqualToString:@"grid"])         return NSAccessibilityTableRole;
    if ([aria isEqualToString:@"row"])          return NSAccessibilityRowRole;
    if ([aria isEqualToString:@"gridcell"])     return NSAccessibilityCellRole;
    if ([aria isEqualToString:@"columnheader"]) return NSAccessibilityCellRole;
    if ([aria isEqualToString:@"rowheader"])    return NSAccessibilityCellRole;
    if ([aria isEqualToString:@"toolbar"])      return NSAccessibilityToolbarRole;
    if ([aria isEqualToString:@"img"])          return NSAccessibilityImageRole;
    if ([aria isEqualToString:@"link"])         return NSAccessibilityLinkRole;
    if ([aria isEqualToString:@"menuitem"])     return NSAccessibilityMenuItemRole;
    if ([aria isEqualToString:@"heading"])      return NSAccessibilityStaticTextRole;
    if ([aria isEqualToString:@"text"])         return NSAccessibilityStaticTextRole;
    if ([aria isEqualToString:@"status"])       return NSAccessibilityStaticTextRole;
    if ([aria isEqualToString:@"separator"])    return NSAccessibilitySplitterRole;
    // group, dialog, tablist, list — containers with no better word here.
    return NSAccessibilityGroupRole;
}

static NSWindow* hostWindow(void) {
    NSWindow* w = [NSApp mainWindow];
    if (w == nil) {
        w = [NSApp keyWindow];
    }
    if (w == nil) {
        NSArray<NSWindow*>* all = [NSApp windows];
        if (all.count > 0) {
            w = all.firstObject;
        }
    }
    return w;
}

/** Window points with y down, as the app lays out, → screen points with y up,
 *  as the accessibility API reads. */
static NSRect screenRect(NSWindow* window, NSView* view, double x, double y,
                         double w, double h) {
    NSRect local = NSMakeRect(x, y, w, h);
    if (!view.isFlipped) {
        local.origin.y = view.bounds.size.height - y - h;
    }
    NSRect inWindow = [view convertRect:local toView:nil];
    return [window convertRectToScreen:inWindow];
}

static double numAt(NSArray* arr, NSUInteger i) {
    if (arr == nil || i >= arr.count) {
        return 0.0;
    }
    id v = arr[i];
    return [v respondsToSelector:@selector(doubleValue)] ? [v doubleValue] : 0.0;
}

static NSString* strFor(NSDictionary* node, NSString* key) {
    id v = node[key];
    return [v isKindOfClass:[NSString class]] ? (NSString*)v : nil;
}

static BOOL flagFor(NSDictionary* node, NSString* key) {
    id v = node[key];
    return [v respondsToSelector:@selector(boolValue)] ? [v boolValue] : NO;
}

// --- the public half ---------------------------------------------------------

extern "C" int dgfx_a11y_active(void) {
    // Building a tree costs something on every frame; nobody should pay it when
    // nobody is listening. DGFX_A11Y=1 forces it on, which is how you look at
    // the tree in Accessibility Inspector without turning VoiceOver on.
    const char* forced = getenv("DGFX_A11Y");
    if (forced != nullptr && forced[0] == '1') {
        return 1;
    }
    if (forced != nullptr && forced[0] == '0') {
        return 0;
    }
    @autoreleasepool {
        NSWorkspace* ws = [NSWorkspace sharedWorkspace];
        if ([ws respondsToSelector:@selector(isVoiceOverEnabled)]) {
            return [ws isVoiceOverEnabled] ? 1 : 0;
        }
    }
    return 0;
}

extern "C" void dgfx_a11y_publish(const char* json) {
    if (json == nullptr) {
        return;
    }
    // Identical frame: the tree on screen has not changed, and reapplying it
    // would be a lot of work to arrive back where we are.
    if (g_lastJson == json) {
        return;
    }
    g_lastJson = json;

    @autoreleasepool {
        NSWindow* window = hostWindow();
        NSView* view = window.contentView;
        if (window == nil || view == nil) {
            return;
        }

        NSData* data = [[NSString stringWithUTF8String:json]
            dataUsingEncoding:NSUTF8StringEncoding];
        NSError* err = nil;
        id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:&err];
        if (![parsed isKindOfClass:[NSDictionary class]]) {
            return;
        }
        NSDictionary* tree = (NSDictionary*)parsed;
        NSArray* nodes = tree[@"nodes"];
        if (![nodes isKindOfClass:[NSArray class]]) {
            return;
        }
        NSString* rootId = strFor(tree, @"root");
        NSString* focusId = strFor(tree, @"focus");

        if (g_els == nil) {
            g_els = [[NSMutableDictionary alloc] init];
        }

        // A modal dialog owns the screen: everything the user cannot currently
        // reach is left out entirely, rather than offered and then ignored.
        NSMutableSet<NSString*>* keepTop = [NSMutableSet set];
        NSMutableDictionary<NSString*, NSDictionary*>* byId = [NSMutableDictionary dictionary];
        NSString* modalId = nil;
        for (id raw in nodes) {
            if (![raw isKindOfClass:[NSDictionary class]]) continue;
            NSDictionary* n = (NSDictionary*)raw;
            NSString* nid = strFor(n, @"id");
            if (nid == nil) continue;
            byId[nid] = n;
            if (flagFor(n, @"modal")) {
                modalId = nid;
            }
        }
        if (modalId != nil) {
            NSString* at = modalId;
            while (at != nil) {
                [keepTop addObject:at];
                at = strFor(byId[at], @"p");
            }
        }

        NSMutableSet<NSString*>* seen = [NSMutableSet set];
        NSMutableDictionary<NSString*, NSMutableArray*>* kids = [NSMutableDictionary dictionary];
        DgfxA11yElement* rootEl = nil;
        DgfxA11yElement* focusEl = nil;

        for (id raw in nodes) {
            if (![raw isKindOfClass:[NSDictionary class]]) continue;
            NSDictionary* n = (NSDictionary*)raw;
            NSString* nid = strFor(n, @"id");
            if (nid == nil) continue;
            NSString* aria = strFor(n, @"role");
            if (aria == nil || [aria isEqualToString:@"none"]) continue;
            NSString* parentId = strFor(n, @"p");
            // While a modal is up, everything outside it is left out — and
            // "outside" means the whole subtree, not just the region's own
            // node, or the sheet's several hundred cells would still be built
            // and still be unreachable.
            if (modalId != nil && parentId != nil) {
                NSString* top = nid;
                NSString* up = parentId;
                while (up != nil && ![up isEqualToString:rootId]) {
                    top = up;
                    up = strFor(byId[up], @"p");
                }
                if (![keepTop containsObject:top]) {
                    continue;
                }
            }

            DgfxA11yElement* el = g_els[nid];
            if (el == nil) {
                el = [[DgfxA11yElement alloc] init];
                el.nodeId = nid;
                g_els[nid] = el;
                [el release];
            }
            [seen addObject:nid];

            NSString* name = strFor(n, @"name");
            NSString* value = strFor(n, @"value");
            NSString* desc = strFor(n, @"desc");
            [el setAccessibilityRole:roleFor(aria)];
            [el setAccessibilityLabel:(name != nil ? name : @"")];
            if (value != nil) {
                [el setAccessibilityValue:value];
            } else {
                [el setAccessibilityValue:nil];
            }
            if (desc != nil && desc.length > 0) {
                [el setAccessibilityHelp:desc];
            } else {
                [el setAccessibilityHelp:nil];
            }
            [el setAccessibilityEnabled:!flagFor(n, @"disabled")];
            [el setAccessibilitySelected:flagFor(n, @"selected")];
            // 2 = yes, 3 = mixed; anything else is not a checkable thing.
            id checked = n[@"checked"];
            if ([checked respondsToSelector:@selector(intValue)]) {
                int c = [checked intValue];
                if (c == 2 || c == 3) {
                    [el setAccessibilityValue:@(1)];
                } else if (c == 1) {
                    [el setAccessibilityValue:@(0)];
                }
            }
            // Where a cell sits in a sheet the tree does not fully contain.
            id row = n[@"row"];
            id col = n[@"col"];
            if ([row respondsToSelector:@selector(integerValue)]) {
                [el setAccessibilityIndex:[row integerValue] - 1];
            } else if ([col respondsToSelector:@selector(integerValue)]) {
                [el setAccessibilityIndex:[col integerValue] - 1];
            }

            NSArray* b = n[@"b"];
            double bx = numAt(b, 0), by = numAt(b, 1), bw = numAt(b, 2), bh = numAt(b, 3);
            [el setAccessibilityFrame:screenRect(window, view, bx, by, bw, bh)];
            el.appCentre = NSMakePoint(bx + bw / 2.0, by + bh / 2.0);
            el.pressable = flagFor(n, @"activate") || flagFor(n, @"focusable");

            if (parentId == nil || parentId.length == 0) {
                rootEl = el;
            } else {
                NSMutableArray* list = kids[parentId];
                if (list == nil) {
                    list = [NSMutableArray array];
                    kids[parentId] = list;
                }
                [list addObject:el];
            }
            if (focusId != nil && [nid isEqualToString:focusId]) {
                focusEl = el;
            }
        }

        // Nodes that went away — a scrolled-off row, a closed dialog.
        NSArray<NSString*>* known = g_els.allKeys;
        for (NSString* nid in known) {
            if (![seen containsObject:nid]) {
                [g_els removeObjectForKey:nid];
            }
        }

        for (NSString* nid in seen) {
            DgfxA11yElement* el = g_els[nid];
            NSArray* list = kids[nid];
            [el setAccessibilityChildren:(list != nil ? list : @[])];
            NSDictionary* n = byId[nid];
            NSString* parentId = strFor(n, @"p");
            if (parentId != nil && g_els[parentId] != nil) {
                [el setAccessibilityParent:g_els[parentId]];
            } else {
                [el setAccessibilityParent:view];
            }
        }

        if (rootEl != nil) {
            [view setAccessibilityChildren:@[rootEl]];
            [view setAccessibilityRole:NSAccessibilityGroupRole];
        }

        // Move VoiceOver's cursor only when the app's focus actually moved.
        // Posting it every frame would interrupt the reader mid-sentence, over
        // and over, which is the most common way this ends up unusable.
        if (focusEl != nil && focusId != nil && g_lastFocus != focusId.UTF8String) {
            g_lastFocus = focusId.UTF8String;
            NSAccessibilityPostNotification(focusEl,
                                            NSAccessibilityFocusedUIElementChangedNotification);
        }
    }
}

extern "C" const char* dgfx_a11y_take_press(void) {
    @autoreleasepool {
        if (g_presses == nil || g_presses.count == 0) {
            g_pressOut.clear();
            return "";
        }
        NSString* first = g_presses.firstObject;
        g_pressOut = first.UTF8String;
        [g_presses removeObjectAtIndex:0];
    }
    return g_pressOut.c_str();
}

extern "C" void dgfx_a11y_reset(void) {
    @autoreleasepool {
        NSWindow* window = hostWindow();
        if (window != nil && window.contentView != nil) {
            [window.contentView setAccessibilityChildren:@[]];
        }
        [g_els removeAllObjects];
    }
    g_lastJson.clear();
    g_lastFocus.clear();
}
