// R7: `#[ranger::serialize]` writes `to_json` and `from_json` for a struct.
// Every target writes the same text and reports the same errors.
use ranger::prelude::*;

#[ranger::serialize]
#[derive(Clone)]
struct Point {
    x: int,
    y: int,
}

#[ranger::serialize]
#[derive(Clone)]
struct Shape {
    name: String,
    ratio: double,
    visible: bool,
    corners: Vec<Point>,
    tags: Vec<String>,
    parent: Option<String>,
    origin: Point,
}

fn main() {
    let s = Shape {
        name: String::from("tri \"a\"\n"),
        ratio: 0.25,
        visible: true,
        corners: vec![Point { x: 0, y: 0 }, Point { x: 4, y: -3 }],
        tags: vec![String::from("x"), String::from("ä€")],
        parent: None,
        origin: Point { x: 1, y: 2 },
    };
    let text = s.to_json();
    println!("{}", text);
    match Shape::from_json(&text) {
        Ok(back) => {
            println!("{} corners, second at {},{}", back.corners.len(), back.corners[1].x, back.corners[1].y);
            println!("same text: {}", back.to_json() == text);
        }
        Err(e) => println!("error {}", e),
    }
    let spaced = "{ \"x\" : 7 ,\n \"y\": -1e0 }";
    match Point::from_json(spaced) {
        Ok(p) => println!("point {} {}", p.x, p.y),
        Err(e) => println!("error: {}", e),
    }
    let inputs = vec![
        "{\"x\": 1}",
        "{\"x\": 1, \"y\": 2.5}",
        "[1, 2]",
        "{\"x\": 1, \"y\": 2",
        "{\"x\": tru}",
        "{\"name\": \"n\", \"ratio\": 1, \"visible\": false, \"corners\": [{\"x\": 1, \"y\": \"2\"}], \"tags\": [], \"parent\": \"p\", \"origin\": {\"x\": 0, \"y\": 0}}",
        "{\"name\": \"\\u00e9\\ud83d\\ude00\", \"ratio\": -0.5e1, \"visible\": true, \"corners\": [], \"tags\": [\"t\"], \"parent\": \"p\", \"origin\": {\"x\": 0, \"y\": 0}}",
    ];
    for inp in &inputs {
        match Point::from_json(inp) {
            Ok(p) => println!("ok {} {}", p.x, p.y),
            Err(e) => println!("point: {}", e),
        }
        match Shape::from_json(inp) {
            Ok(sh) => println!("shape {} {} {}", sh.name, sh.ratio, sh.to_json()),
            Err(e) => println!("shape: {}", e),
        }
    }
}
