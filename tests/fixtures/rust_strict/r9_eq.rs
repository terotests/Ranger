#[derive(Clone, Debug, PartialEq)]
struct S { items: Vec<i64>, names: Vec<String> }
fn main() {
    let a = vec![1, 2, 3];
    let b = vec![1, 2, 3];
    let c = vec![1, 2];
    println!("{} {} {}", a == b, a != c, a == c);
    let s1 = S { items: vec![1], names: vec!["x".to_string()] };
    let s2 = s1.clone();
    let mut s3 = s1.clone();
    s3.names.push("y".to_string());
    println!("{} {}", s1 == s2, s1 == s3);
    let vv = vec![vec![1, 2], vec![3]];
    println!("{}", vv == vec![vec![1, 2], vec![3]]);
    let ta: Vec<(i64, String)> = vec![(1, "a".to_string()), (2, "b".to_string())];
    let tb: Vec<(i64, String)> = vec![(1, "a".to_string()), (2, "b".to_string())];
    let tc: Vec<(i64, String)> = vec![(1, "a".to_string()), (2, "c".to_string())];
    println!("{} {}", ta == tb, ta == tc);
    let p = (1, vec![2, 3]);
    let q = (1, vec![2, 3]);
    println!("{}", p == q);
    let o: Vec<(i64, Option<i64>)> = vec![(1, None)];
    let o2: Vec<(i64, Option<i64>)> = vec![(1, Some(2))];
    println!("{}", o == o2);
    let o3: Vec<(i64, Option<i64>)> = vec![(1, None), (2, Some(3))];
    println!("{}", o3.len());
}
