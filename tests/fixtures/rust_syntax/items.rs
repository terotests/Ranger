//! Crate docs.
#![allow(dead_code)]

use std::collections::{HashMap, hash_map::Entry as E, *};
use ::core::fmt;
pub(crate) mod inner;
mod nested {
    pub fn f() {}
}
extern crate alloc as a;

/// A point.
#[derive(Clone, Copy, Default)]
pub struct Point {
    pub x: i64,
    #[ranger::weak]
    y: i64,
}

struct Pair<T>(pub T, T) where T: Clone;
struct Unit;

enum Shape<'a, T: fmt::Debug + ?Sized = ()> {
    Circle { r: f64 },
    Rect(f64, f64),
    Named(&'a T),
    Empty = 3,
}

pub trait Area: fmt::Debug {
    const SIDES: usize;
    type Out: Copy + 'static;
    fn area(&self) -> f64;
    fn scaled(&mut self, k: f64) -> f64 { k }
}

impl<T> Area for Pair<T> where T: Clone + fmt::Debug {
    const SIDES: usize = 2;
    type Out = u8;
    fn area(&self) -> f64 { 0.0 }
}

impl<'a> Point {
    pub const fn new(x: i64, y: i64) -> Self { Point { x, y } }
    fn by_value(self, other: &'a mut Point) -> impl Iterator<Item = i64> + 'a { std::iter::empty() }
}

unsafe impl Send for Unit {}
impl !Sync for Unit {}

type Map<K, V> = HashMap<K, V>;
const MAX: usize = 1 << 10;
static mut COUNT: u32 = 0;

async fn fetch<const N: usize>(buf: [u8; N]) -> Result<(), Box<dyn std::error::Error + Send>> { Ok(()) }

extern "C" {
    fn abs(x: i32) -> i32;
}

macro_rules! twice {
    ($e:expr) => { $e + $e };
}

thread_local! {
    static X: u8 = 1;
}

fn main() {}
