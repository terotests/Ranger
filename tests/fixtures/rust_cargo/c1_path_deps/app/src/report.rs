use shapes::Rect;

pub fn print_all(list: &Vec<Rect>) {
    let mut i = 0;
    while i < list.len() {
        println!("{} {:.2} {}", i, list[i].area(), shapes::describe(&list[i]));
        i += 1;
    }
}
