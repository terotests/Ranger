use evgr::EvgrTree;

fn main() {
    let mut t = EvgrTree::new();
    let root = t.add(-1, "display:flex;flex-direction:row;flex-wrap:nowrap;width:600px;height:100px;gap:20px");
    t.add(root, "flex-grow:1;height:40px");
    t.add(root, "flex-grow:2;height:40px");
    t.add(root, "flex-grow:1;height:40px");
    t.layout(1200.0, 900.0);
    for i in 0..t.count() {
        println!("n{} {} {} {} {}", i, t.x(i), t.y(i), t.w(i), t.h(i));
    }
}
