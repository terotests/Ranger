#pragma once

// Native OS menu bridge for the DataGrid SDL host.
// On macOS: installs a File menu (New / Open / Save / Save As / Quit).
// Elsewhere: no-ops; pop returns DGFX_MENU_NONE.

#ifdef __cplusplus
extern "C" {
#endif

enum {
    DGFX_MENU_NONE = 0,
    DGFX_MENU_OPEN = 1,
    DGFX_MENU_SAVE = 2,
    DGFX_MENU_SAVE_AS = 3,
    DGFX_MENU_QUIT = 4,
    DGFX_MENU_NEW = 5
};

// Call once after the SDL window exists (macOS needs NSApp).
void dgfx_install_menus(void);

// Drain one queued menu action per call (0 when empty).
int dgfx_pop_menu_action(void);

#ifdef __cplusplus
}
#endif
