// SPDX-License-Identifier: MIT
//
// The cell Ranger's Rust modules keep their shared objects in:
// `use ranger::cell::RefCell;` in place of `std::cell::RefCell`.
//
// By default it is std's RefCell. With the `shared-cell` feature it is a
// cell without the run-time borrow check. Ranger's programs share mutable
// objects as Go and JavaScript do: a method may change an object while a
// caller up the stack reads a field of it, and the generated code does that
// often in one shape, `f(o, o.borrow().x)`, where the argument's borrow lives
// to the end of the statement while f changes o. std's RefCell panics there;
// here a borrow is a raw pointer that becomes a reference only where it is
// used, so these overlaps go through as they do in the Go and JavaScript
// builds. Single-threaded programs only (neither cell is Sync).
//
// A program turns the feature on once (`ranger = { features =
// ["shared-cell"] }`): cargo unifies features, so every crate of the build
// that names ranger::cell::RefCell gets the same cell, and an
// `Rc<RefCell<T>>` passes between them as one type.

#[cfg(not(feature = "shared-cell"))]
pub use std::cell::{Ref, RefCell, RefMut};

#[cfg(feature = "shared-cell")]
pub use shared::{Ref, RefCell, RefMut};

#[cfg(feature = "shared-cell")]
mod shared {
    use std::cell::UnsafeCell;
    use std::marker::PhantomData;
    use std::ops::{Deref, DerefMut};

    pub struct RefCell<T: ?Sized> {
        v: UnsafeCell<T>,
    }

    pub struct Ref<'a, T: ?Sized> {
        p: *const T,
        _l: PhantomData<&'a T>,
    }

    pub struct RefMut<'a, T: ?Sized> {
        p: *mut T,
        _l: PhantomData<&'a mut T>,
    }

    impl<T> RefCell<T> {
        pub const fn new(v: T) -> RefCell<T> {
            RefCell { v: UnsafeCell::new(v) }
        }
        pub fn replace(&self, v: T) -> T {
            std::mem::replace(unsafe { &mut *self.v.get() }, v)
        }
        pub fn into_inner(self) -> T {
            self.v.into_inner()
        }
    }

    impl<T: ?Sized> RefCell<T> {
        pub fn borrow(&self) -> Ref<'_, T> {
            Ref { p: self.v.get(), _l: PhantomData }
        }
        pub fn borrow_mut(&self) -> RefMut<'_, T> {
            RefMut { p: self.v.get(), _l: PhantomData }
        }
        pub fn as_ptr(&self) -> *mut T {
            self.v.get()
        }
    }

    impl<T: Clone> Clone for RefCell<T> {
        fn clone(&self) -> RefCell<T> {
            RefCell::new(unsafe { (*self.v.get()).clone() })
        }
    }

    impl<T: Default> Default for RefCell<T> {
        fn default() -> RefCell<T> {
            RefCell::new(T::default())
        }
    }

    impl<T: ?Sized> Deref for Ref<'_, T> {
        type Target = T;
        fn deref(&self) -> &T {
            unsafe { &*self.p }
        }
    }

    impl<T: ?Sized> Deref for RefMut<'_, T> {
        type Target = T;
        fn deref(&self) -> &T {
            unsafe { &*self.p }
        }
    }

    impl<T: ?Sized> DerefMut for RefMut<'_, T> {
        fn deref_mut(&mut self) -> &mut T {
            unsafe { &mut *self.p }
        }
    }

    impl<T: ?Sized + std::fmt::Debug> std::fmt::Debug for RefCell<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            unsafe { (*self.v.get()).fmt(f) }
        }
    }

    impl<T: ?Sized + PartialEq> PartialEq for RefCell<T> {
        fn eq(&self, other: &RefCell<T>) -> bool {
            unsafe { *self.v.get() == *other.v.get() }
        }
    }
}
