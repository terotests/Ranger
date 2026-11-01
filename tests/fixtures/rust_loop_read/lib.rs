pub struct MvTest {}
impl MvTest {
    pub fn pick(pts: &Vec<String>, n: i64) -> String {
        let last: String = pts[((pts.len() as i64) - 1) as usize].clone();
        let mut out: String = String::new();
        let mut k: i64 = 0;
        while k < 2 {
            let mut j: i64 = 0;
            while j < n {
                let mut owner: String = last.clone();
                if j < (pts.len() as i64) {
                    owner = pts[j as usize].clone();
                }
                out = format!("{}{}", out, owner);
                j += 1;
            }
            k += 1;
        }
        return out;
    }
}
