// R2: closures, iterator adaptors, sorting with a key.
fn apply<F: Fn(i64) -> i64>(f: F, v: i64) -> i64 {
    f(v)
}

#[derive(Debug, Clone)]
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let double = |x: i64| x * 2;
    let offset = 10;
    let add_offset = move |x: i64| x + offset;
    println!("{} {}", apply(double, 21), apply(add_offset, 5));
    let both = |x: i64| add_offset(double(x));
    println!("{}", both(3));

    let v: Vec<i64> = vec![5, 3, 8, 1, 9, 2];
    let squares: Vec<i64> = v.iter().map(|x| x * x).collect();
    println!("{:?}", squares);
    let evens: Vec<i64> = v.iter().filter(|x| *x % 2 == 0).cloned().collect();
    println!("{:?}", evens);
    let total: i64 = v.iter().sum();
    println!("sum {} max {:?} min {:?}", total, v.iter().max(), v.iter().min());
    println!("any>8 {} all>0 {}", v.iter().any(|&x| x > 8), v.iter().all(|&x| x > 0));
    println!("count>4 {}", v.iter().filter(|&&x| x > 4).count());
    let pos = v.iter().position(|&x| x == 8);
    println!("pos {:?}", pos);
    let prod = v.iter().fold(1, |acc, x| acc * x);
    println!("prod {}", prod);
    let labels: Vec<String> = v.iter().enumerate().map(|(i, x)| format!("{}:{}", i, x)).collect();
    println!("{}", labels.join(","));

    let mut sorted = v.clone();
    sorted.sort();
    println!("{:?}", sorted);
    sorted.sort_by(|a, b| b.cmp(a));
    println!("{:?}", sorted);

    let mut people = vec![
        Person { name: String::from("ann"), age: 31 },
        Person { name: String::from("bob"), age: 25 },
        Person { name: String::from("cid"), age: 40 },
    ];
    people.sort_by_key(|p| p.age);
    let names: Vec<String> = people.iter().map(|p| p.name.clone()).collect();
    println!("{:?}", names);
    let oldest = people.iter().max_by_key(|p| p.age).unwrap();
    println!("oldest {}", oldest.name);

    let mut counter = 0;
    let mut bump = |n: i32| counter += n;
    bump(2);
    bump(3);
    println!("counter {}", counter);

    let words = "the quick brown fox";
    let lens: Vec<usize> = words.split(' ').map(|w| w.chars().count()).collect();
    println!("{:?}", lens);
    let caps: String = words.chars().filter(|c| *c != ' ').map(|c| c.to_ascii_uppercase()).collect();
    println!("{}", caps);
    let r: Vec<i64> = (1..=5).rev().collect();
    println!("{:?}", r);
    let firsts: Vec<i64> = (0..10).skip(2).take(3).collect();
    println!("{:?}", firsts);
}
