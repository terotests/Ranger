// Non-macOS stub: no native menu bar.
#include "dgfx_menu.h"

extern "C" void dgfx_install_menus(void) {}

extern "C" int dgfx_pop_menu_action(void) {
    return DGFX_MENU_NONE;
}
