use units::Meters;

fn main() {
    let m = Meters::new(2.5).add(&Meters::new(1.0));
    println!("{} = {} cm", units::label(&m), units::convert::to_cm(&m));
}
