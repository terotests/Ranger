//! Digital input bits shared by RGSP1 / RGW1 / RGIN, plus press/release edge
//! detection so games stop hand-rolling `PREV_IN` statics.
//!
//! The five base bits (`UP/DOWN/LEFT/RIGHT/ACTION` + `BACK`) have the same
//! values in every shipped block (`RG_SPR_IN_*`, RGW1 `input`, RGIN
//! `BUTTONS`), so one type serves them all.

use core::ops::{BitOr, BitOrAssign};

/// A set of digital input bits (a bitmask newtype).
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct Buttons(pub u32);

impl Buttons {
    pub const NONE: Buttons = Buttons(0);
    pub const UP: Buttons = Buttons(1);
    pub const DOWN: Buttons = Buttons(2);
    pub const LEFT: Buttons = Buttons(4);
    pub const RIGHT: Buttons = Buttons(8);
    pub const ACTION: Buttons = Buttons(16);
    /// Host feeds this in play mode (Q/Esc) so a guest can return to its own
    /// menu instead of quitting to the launcher.
    pub const BACK: Buttons = Buttons(32);

    /// True if ANY of the bits in `b` are set in `self`.
    #[inline]
    pub const fn contains(self, b: Buttons) -> bool {
        self.0 & b.0 != 0
    }

    #[inline]
    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }
}

impl BitOr for Buttons {
    type Output = Buttons;
    #[inline]
    fn bitor(self, rhs: Buttons) -> Buttons {
        Buttons(self.0 | rhs.0)
    }
}

impl BitOrAssign for Buttons {
    #[inline]
    fn bitor_assign(&mut self, rhs: Buttons) {
        self.0 |= rhs.0;
    }
}

/// One player's input for the current tick, with the previous tick remembered
/// so press/release edges are a method call instead of a `PREV_IN` static.
///
/// The frame builders in [`crate::sprite`] / [`crate::world`] construct this
/// automatically; `held` is "is down now", `pressed` is "went down this tick",
/// `released` is "went up this tick".
#[derive(Clone, Copy, Debug)]
pub struct Input {
    now: Buttons,
    prev: Buttons,
}

impl Input {
    #[inline]
    pub const fn new(now: u32, prev: u32) -> Input {
        Input {
            now: Buttons(now),
            prev: Buttons(prev),
        }
    }

    /// The raw current bitmask (escape hatch).
    #[inline]
    pub const fn raw(self) -> u32 {
        self.now.0
    }

    /// Any of the bits in `b` are down this tick.
    #[inline]
    pub const fn held(self, b: Buttons) -> bool {
        self.now.contains(b)
    }

    /// Any of the bits in `b` went down this tick (down now, up last tick).
    #[inline]
    pub const fn pressed(self, b: Buttons) -> bool {
        self.now.0 & !self.prev.0 & b.0 != 0
    }

    /// Any of the bits in `b` went up this tick (up now, down last tick).
    #[inline]
    pub const fn released(self, b: Buttons) -> bool {
        !self.now.0 & self.prev.0 & b.0 != 0
    }

    /// Nothing is held.
    #[inline]
    pub const fn idle(self) -> bool {
        self.now.is_empty()
    }
}
