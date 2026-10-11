// `Type::f(&mut v, …)`: an associated function (or a method called by its
// path) with `&mut` parameters changes the caller's places, as a module
// function does.
struct Grid {
    cells: Vec<i64>,
}

impl Grid {
    fn fill(out: &mut Vec<i64>, v: i64) {
        for k in 0..out.len() {
            out[k] = v + k as i64;
        }
    }

    fn count(n: &mut i64) {
        *n += 1;
    }

    fn add_into(&self, out: &mut Vec<i64>) {
        for c in self.cells.iter() {
            out.push(*c);
        }
    }
}

fn main() {
    let mut row: Vec<i64> = vec![0; 4];
    Grid::fill(&mut row, 10);
    println!("{:?}", row);
    let mut n: i64 = 1;
    Grid::count(&mut n);
    Grid::count(&mut n);
    println!("{}", n);
    let g = Grid { cells: vec![7, 8] };
    Grid::add_into(&g, &mut row);
    println!("{:?}", row);
}
