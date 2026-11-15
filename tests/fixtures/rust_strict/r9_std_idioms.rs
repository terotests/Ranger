use std::cell::RefCell;
use std::rc::Rc;

struct State {
    n: i64,
    log: Vec<String>,
}

struct Host {
    st: Rc<RefCell<State>>,
}

impl Host {
    fn bump(&mut self) {
        let mut s = self.st.borrow_mut();
        s.n += 1;
        let line = format!("bump {}", s.n);
        s.log.push(line);
    }
}

fn run(st: State) -> State {
    let shared = Rc::new(RefCell::new(st));
    for _ in 0..3 {
        let mut h = Host { st: shared.clone() };
        h.bump();
    }
    let out = match Rc::try_unwrap(shared) {
        Ok(cell) => cell.into_inner(),
        Err(_) => State { n: -1, log: vec![] },
    };
    out
}

fn push_utf8(out: &mut Vec<u8>, c: i64) {
    if c < 0x80 {
        out.push(c as u8);
    } else if c < 0x800 {
        out.push((0xC0 | (c >> 6)) as u8);
        out.push((0x80 | (c & 63)) as u8);
    } else {
        out.push((0xE0 | (c >> 12)) as u8);
        out.push((0x80 | ((c >> 6) & 63)) as u8);
        out.push((0x80 | (c & 63)) as u8);
    }
}

fn hex_byte(h: &str) -> i64 {
    match u8::from_str_radix(h, 16) {
        Ok(v) => v as i64,
        Err(_) => -1,
    }
}

fn main() {
    // trim_matches family
    let w = "\"*word*\"".trim_matches('"').trim_matches('*');
    println!("[{}]", w);
    println!("[{}]", "//a/b//".trim_end_matches('/'));
    println!("[{}]", "//a/b//".trim_start_matches('/'));
    println!("[{}]", "xxabcxx".trim_end_matches("x"));
    // splitn
    let parts: Vec<&str> = "a\tb\tc\td\te".splitn(3, "\t").collect();
    println!("{} {:?}", parts.len(), parts);
    let p2: Vec<&str> = "k:v:w".splitn(2, ':').collect();
    println!("{:?}", p2);
    let p3: Vec<&str> = "nocolon".splitn(2, ':').collect();
    println!("{:?}", p3);
    // byte length of a String
    let s = String::from("héllo");
    println!("{} {}", s.len(), s.chars().count());
    // Vec range slices
    let v: Vec<i64> = vec![1, 2, 3, 4, 5];
    let tail = v[2..].to_vec();
    let mid: Vec<i64> = v[1..3].to_vec();
    let mut sum = 0;
    for x in v[..2].iter() {
        sum += *x;
    }
    println!("{:?} {:?} {}", tail, mid, sum);
    // euclidean division
    let a: i64 = -7;
    println!("{} {} {} {}", a.div_euclid(3), a.rem_euclid(3), 7i64.div_euclid(-3), 7i64.rem_euclid(-3));
    // from_str_radix
    println!("{} {} {}", hex_byte("ff"), hex_byte("0A"), hex_byte("zz"));
    match i64::from_str_radix("-101", 2) {
        Ok(n) => println!("bin {}", n),
        Err(_) => println!("bin err"),
    }
    // sorting tuples
    let mut rows: Vec<(String, String)> = vec![
        ("b".to_string(), "2".to_string()),
        ("a".to_string(), "9".to_string()),
        ("b".to_string(), "1".to_string()),
    ];
    rows.sort();
    for (x, y) in rows.iter() {
        println!("{} {}", x, y);
    }
    let mut nums: Vec<(i64, i64)> = vec![(3, 1), (1, 2), (3, 0)];
    nums.sort();
    println!("{:?}", nums);
    // Rc<RefCell<_>> shared, then try_unwrap
    let st = run(State { n: 10, log: vec![] });
    println!("{} {:?}", st.n, st.log);
    // a growing &mut Vec<u8> parameter
    let mut buf: Vec<u8> = Vec::new();
    push_utf8(&mut buf, 65);
    push_utf8(&mut buf, 0xE9);
    push_utf8(&mut buf, 0x20AC);
    println!("{:?}", buf);
    println!("{}", String::from_utf8(buf).unwrap());
}
