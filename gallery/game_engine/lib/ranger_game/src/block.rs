//! Internal interior-mutable byte blocks for the shipped ABI mailboxes.
//!
//! The blocks are pattern-A shared memory (single host thread, synchronous
//! guest calls — `ABI_V1.md` API §1.2): nothing reads a word while the other
//! party writes it, so plain unsynchronized access is correct. All multi-byte
//! values are little-endian on the wire regardless of the build target.

use core::cell::UnsafeCell;

pub(crate) struct Block<const N: usize>(UnsafeCell<[u8; N]>);

// Guests are single-threaded (wasm32 without threads); host calls into the
// guest synchronously. `Sync` is required only so the block can live in a
// `static`.
unsafe impl<const N: usize> Sync for Block<N> {}

impl<const N: usize> Block<N> {
    pub const fn new() -> Self {
        Block(UnsafeCell::new([0u8; N]))
    }

    #[inline]
    pub fn as_mut_ptr(&self) -> *mut u8 {
        self.0.get() as *mut u8
    }

    #[inline]
    pub fn read_i32(&self, off: usize) -> i32 {
        debug_assert!(off + 4 <= N);
        let mut b = [0u8; 4];
        unsafe { core::ptr::copy_nonoverlapping(self.as_mut_ptr().add(off), b.as_mut_ptr(), 4) };
        i32::from_le_bytes(b)
    }

    #[inline]
    pub fn write_i32(&self, off: usize, v: i32) {
        debug_assert!(off + 4 <= N);
        let b = v.to_le_bytes();
        unsafe { core::ptr::copy_nonoverlapping(b.as_ptr(), self.as_mut_ptr().add(off), 4) };
    }

    #[inline]
    pub fn read_u32(&self, off: usize) -> u32 {
        self.read_i32(off) as u32
    }

    #[inline]
    pub fn write_u32(&self, off: usize, v: u32) {
        self.write_i32(off, v as i32)
    }

    #[inline]
    pub fn write_u16(&self, off: usize, v: u16) {
        debug_assert!(off + 2 <= N);
        let b = v.to_le_bytes();
        unsafe { core::ptr::copy_nonoverlapping(b.as_ptr(), self.as_mut_ptr().add(off), 2) };
    }

    #[inline]
    pub fn read_u16(&self, off: usize) -> u16 {
        debug_assert!(off + 2 <= N);
        let mut b = [0u8; 2];
        unsafe { core::ptr::copy_nonoverlapping(self.as_mut_ptr().add(off), b.as_mut_ptr(), 2) };
        u16::from_le_bytes(b)
    }

    #[inline]
    pub fn write_u8(&self, off: usize, v: u8) {
        debug_assert!(off < N);
        unsafe { *self.as_mut_ptr().add(off) = v };
    }

    #[inline]
    pub fn write_bytes(&self, off: usize, bytes: &[u8]) {
        debug_assert!(off + bytes.len() <= N);
        unsafe {
            core::ptr::copy_nonoverlapping(bytes.as_ptr(), self.as_mut_ptr().add(off), bytes.len())
        };
    }

    /// Zero a byte range (used by resets).
    #[inline]
    pub fn zero(&self, off: usize, len: usize) {
        debug_assert!(off + len <= N);
        unsafe { core::ptr::write_bytes(self.as_mut_ptr().add(off), 0, len) };
    }
}

/// A tiny interior-mutable scalar for guest-side bookkeeping statics
/// (previous input for edge detection, UI cursors, …).
pub(crate) struct Scalar<T>(UnsafeCell<T>);

unsafe impl<T> Sync for Scalar<T> {}

impl<T: Copy> Scalar<T> {
    pub const fn new(v: T) -> Self {
        Scalar(UnsafeCell::new(v))
    }

    #[inline]
    pub fn get(&self) -> T {
        unsafe { *self.0.get() }
    }

    #[inline]
    pub fn set(&self, v: T) {
        unsafe { *self.0.get() = v };
    }
}
