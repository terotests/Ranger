//! Support types for the export-generating macros. Not public API — the
//! macros reference these through `$crate::__rt`.

use core::cell::UnsafeCell;

/// Holds the game's state object between host calls. Guests are
/// single-threaded and host calls are synchronous, so a plain interior-mutable
/// option is sound; `Sync` is only needed to place it in a `static`.
pub struct GameCell<T>(UnsafeCell<Option<T>>);

unsafe impl<T> Sync for GameCell<T> {}

impl<T> GameCell<T> {
    pub const fn new() -> Self {
        GameCell(UnsafeCell::new(None))
    }

    pub fn set(&self, v: T) {
        unsafe { *self.0.get() = Some(v) };
    }

    /// Run `f` on the state if `init` has been called. The closure must not
    /// re-enter the same cell (the host never re-enters the guest).
    pub fn with<R>(&self, f: impl FnOnce(&mut T) -> R) -> Option<R> {
        unsafe { (*self.0.get()).as_mut().map(f) }
    }
}
