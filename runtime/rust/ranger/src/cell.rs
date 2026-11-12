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
// `cell-audit` (implies `shared-cell`) keeps std's borrow bookkeeping
// without its panic: every overlapping borrow is let through as above, and
// each place that makes one is written once to the file RANGER_CELL_AUDIT
// names (else stderr) with the place holding the borrow it overlaps. One
// run then lists every overlap a std RefCell would panic at, where std
// stops at the first.
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
        #[cfg(feature = "cell-audit")]
        a: audit::State,
        v: UnsafeCell<T>,
    }

    pub struct Ref<'a, T: ?Sized> {
        p: *const T,
        #[cfg(feature = "cell-audit")]
        a: &'a audit::State,
        _l: PhantomData<&'a T>,
    }

    pub struct RefMut<'a, T: ?Sized> {
        p: *mut T,
        #[cfg(feature = "cell-audit")]
        a: &'a audit::State,
        _l: PhantomData<&'a mut T>,
    }

    impl<T> RefCell<T> {
        pub const fn new(v: T) -> RefCell<T> {
            RefCell {
                #[cfg(feature = "cell-audit")]
                a: audit::State::new(),
                v: UnsafeCell::new(v),
            }
        }
        pub fn replace(&self, v: T) -> T {
            std::mem::replace(unsafe { &mut *self.v.get() }, v)
        }
        pub fn into_inner(self) -> T {
            self.v.into_inner()
        }
    }

    impl<T: ?Sized> RefCell<T> {
        #[cfg_attr(feature = "cell-audit", track_caller)]
        pub fn borrow(&self) -> Ref<'_, T> {
            #[cfg(feature = "cell-audit")]
            self.a.read(std::panic::Location::caller());
            Ref {
                p: self.v.get(),
                #[cfg(feature = "cell-audit")]
                a: &self.a,
                _l: PhantomData,
            }
        }
        #[cfg_attr(feature = "cell-audit", track_caller)]
        pub fn borrow_mut(&self) -> RefMut<'_, T> {
            #[cfg(feature = "cell-audit")]
            self.a.write(std::panic::Location::caller());
            RefMut {
                p: self.v.get(),
                #[cfg(feature = "cell-audit")]
                a: &self.a,
                _l: PhantomData,
            }
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

    #[cfg(feature = "cell-audit")]
    impl<T: ?Sized> Drop for Ref<'_, T> {
        fn drop(&mut self) {
            self.a.release_read();
        }
    }

    #[cfg(feature = "cell-audit")]
    impl<T: ?Sized> Drop for RefMut<'_, T> {
        fn drop(&mut self) {
            self.a.release_write();
        }
    }

    #[cfg(feature = "cell-audit")]
    mod audit {
        use std::cell::{Cell, RefCell};
        use std::collections::HashSet;
        use std::io::Write;
        use std::panic::Location;

        type Loc = &'static Location<'static>;

        // readers > 0, a writer -1 (std's count); overlaps keep counting
        // so the release of each still balances
        pub struct State {
            readers: Cell<i32>,
            writers: Cell<i32>,
            held: Cell<Option<Loc>>,
        }

        thread_local! {
            static SEEN: RefCell<HashSet<(Loc, Option<Loc>)>> = RefCell::new(HashSet::new());
        }

        fn report(kind: &str, at: Loc, held: Option<Loc>) {
            let fresh = SEEN.with(|s| s.borrow_mut().insert((at, held)));
            if !fresh {
                return;
            }
            let line = match held {
                Some(h) => format!("{} at {}:{} while held at {}:{}\n", kind, at.file(), at.line(), h.file(), h.line()),
                None => format!("{} at {}:{}\n", kind, at.file(), at.line()),
            };
            match std::env::var("RANGER_CELL_AUDIT") {
                Ok(path) if !path.is_empty() => {
                    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(path) {
                        let _ = f.write_all(line.as_bytes());
                    }
                }
                _ => eprint!("cell-audit: {}", line),
            }
        }

        impl State {
            pub const fn new() -> State {
                State { readers: Cell::new(0), writers: Cell::new(0), held: Cell::new(None) }
            }
            pub fn read(&self, at: Loc) {
                if self.writers.get() > 0 {
                    report("borrow over borrow_mut", at, self.held.get());
                }
                if self.readers.get() == 0 && self.writers.get() == 0 {
                    self.held.set(Some(at));
                }
                self.readers.set(self.readers.get() + 1);
            }
            pub fn write(&self, at: Loc) {
                if self.writers.get() > 0 || self.readers.get() > 0 {
                    let kind = if self.writers.get() > 0 { "borrow_mut over borrow_mut" } else { "borrow_mut over borrow" };
                    report(kind, at, self.held.get());
                } else {
                    // the borrow that opened the current period is the one
                    // an overlap is reported against
                    self.held.set(Some(at));
                }
                self.writers.set(self.writers.get() + 1);
            }
            pub fn release_read(&self) {
                self.readers.set(self.readers.get() - 1);
            }
            pub fn release_write(&self) {
                self.writers.set(self.writers.get() - 1);
            }
        }
    }
}
