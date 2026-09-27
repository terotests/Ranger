// Option, Result and the `?` operator.
//
// Parse "key = value" lines into typed settings. Each step that can fail
// returns a Result, and `?` passes the first error up.

#[derive(Debug)]
struct Settings {
    width: i64,
    height: i64,
    title: String,
}

fn parse_line(line: &str) -> Result<(String, String), String> {
    let eq = line.find('=').ok_or(format!("no '=' in {:?}", line))?;
    let key = line[..eq].trim().to_string();
    let value = line[eq + 1..].trim().to_string();
    if key.is_empty() {
        return Err("empty key".to_string());
    }
    Ok((key, value))
}

fn parse_int(key: &str, value: &str) -> Result<i64, String> {
    value
        .parse::<i64>()
        .map_err(|_| format!("{} is not a number: {:?}", key, value))
}

fn parse_settings(text: &str) -> Result<Settings, String> {
    let mut width: Option<i64> = None;
    let mut height: Option<i64> = None;
    let mut title = String::from("untitled");
    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let (key, value) = parse_line(line)?;
        match key.as_str() {
            "width" => width = Some(parse_int(&key, &value)?),
            "height" => height = Some(parse_int(&key, &value)?),
            "title" => title = value,
            other => return Err(format!("unknown key {}", other)),
        }
    }
    Ok(Settings {
        width: width.ok_or("width is missing")?,
        height: height.unwrap_or(100),
        title,
    })
}

fn main() {
    let inputs = [
        "width = 640\nheight = 480\ntitle = Demo",
        "# only a width\nwidth = 320",
        "width = 12x",
        "height = 5",
        "width 5",
    ];
    for text in inputs.iter() {
        match parse_settings(text) {
            Ok(s) => println!("ok: {}x{} {:?}", s.width, s.height, s.title),
            Err(e) => println!("error: {}", e),
        }
    }
    let first_big = [3, 8, 12, 5].iter().position(|&n| n > 7);
    println!("first > 7 at {:?}", first_big);
    let halves: Vec<i64> = [4, 7, 10].iter().filter_map(|&n| if n % 2 == 0 { Some(n / 2) } else { None }).collect();
    println!("halves of the even ones {:?}", halves);
    let parsed: Vec<i64> = ["1", "two", "3"].iter().filter_map(|s| s.parse::<i64>().ok()).collect();
    println!("numbers {:?}", parsed);
    let label = parse_int("n", "42").map(|n| n * 2).map_or("none".to_string(), |n| format!("got {}", n));
    println!("{}", label);
}
