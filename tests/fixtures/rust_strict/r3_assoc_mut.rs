// R3: `&mut Vec` parameters of associated functions. `Type::f(&mut v)` and
// `Type::m(&x, &mut v)` write through the borrow like a module-level fn does.
use std::cell::RefCell;
use std::rc::Rc;

struct Geom {}

impl Geom {
    fn push_pt(pts: &mut Vec<f64>, x: f64, y: f64) {
        pts.push(x);
        pts.push(y);
    }

    fn square() -> Vec<f64> {
        let mut pts: Vec<f64> = Vec::new();
        Geom::push_pt(&mut pts, 0.0, 0.0);
        Geom::push_pt(&mut pts, 1.0, 0.0);
        Self::push_pt(&mut pts, 1.0, 1.0);
        pts
    }
}

struct Iter {
    st: Vec<i64>,
    scale: i64,
}

impl Iter {
    fn fill(&self, out: &mut Vec<i64>, n: i64) {
        let mut i: i64 = 0;
        while i < n {
            out.push(i * self.scale);
            i += 1;
        }
    }

    fn read(it: &Rc<RefCell<Iter>>) {
        let mut tmp: Vec<i64> = Vec::new();
        Iter::fill(&it.borrow(), &mut tmp, 3);
        it.borrow_mut().st = tmp;
    }
}

fn main() {
    let sq = Geom::square();
    println!("{} {}", sq.len(), sq[4]);
    let it = Rc::new(RefCell::new(Iter { st: Vec::new(), scale: 5 }));
    Iter::read(&it);
    println!("{:?}", it.borrow().st);
}
