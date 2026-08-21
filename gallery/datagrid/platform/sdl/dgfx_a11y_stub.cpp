// Non-macOS: no accessibility bridge yet.
//
// Windows would be UI Automation and Linux AT-SPI2 over D-Bus; both are real
// work, and the shortcut for both is AccessKit, whose node/tree/update model is
// what `EVGA11yTree` was shaped to match. Until then this says "nobody is
// listening", the host builds no tree, and nothing is paid for.
#include "dgfx_a11y.h"

extern "C" int dgfx_a11y_active(void) {
    return 0;
}

extern "C" void dgfx_a11y_publish(const char* json) {
    (void)json;
}

extern "C" const char* dgfx_a11y_take_press(void) {
    return "";
}

extern "C" void dgfx_a11y_reset(void) {}
