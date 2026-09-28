// R7: `ranger::native!` writes target code. rustc takes the `rust` arm;
// Ranger writes the arm of the target it compiles for, `{x}` standing for
// the local `x`. Each arm here does the same thing in its own language.
use ranger::prelude::*;

fn larger(a: int, b: int) -> int {
    let m: int = ranger::native!(
        rust: { a.max(b) },
        es6: "Math.max({a}, {b})",
        python: "max({a}, {b})",
        go: "max({a}, {b})",
        cpp: "({a} > {b} ? {a} : {b})",
        java7: "Math.max({a}, {b})",
        kotlin: "maxOf({a}, {b})",
        csharp: "System.Math.Max({a}, {b})",
        dart: "({a} > {b} ? {a} : {b})",
        scala: "math.max({a}, {b})",
        php: "max({a}, {b})",
        swift6: "max({a}, {b})",
    );
    m
}

fn exclaim(text: &str) -> String {
    let s: String = ranger::native!(
        rust: { format!("{}!", text) },
        es6: "{text} + \"!\"",
        python: "{text} + \"!\"",
        go: "{text} + \"!\"",
        cpp: "{text} + \"!\"",
        java7: "{text} + \"!\"",
        kotlin: "{text} + \"!\"",
        csharp: "{text} + \"!\"",
        dart: "{text} + \"!\"",
        scala: "{text} + \"!\"",
        php: "{text} . \"!\"",
        swift6: "{text} + \"!\"",
    );
    s
}

fn announce(msg: &str) {
    ranger::native!(
        rust: { println!("{}", msg) },
        es6: "console.log({msg});",
        python: "print({msg})",
        go: "fmt.Println({msg})",
        cpp: "std::cout << {msg} << std::endl;",
        java7: "System.out.println({msg});",
        kotlin: "println({msg})",
        csharp: "System.Console.WriteLine({msg});",
        dart: "print({msg});",
        scala: "println({msg})",
        php: "echo {msg} . \"\\n\";",
        swift6: "print({msg})",
    );
}

fn main() {
    println!("larger {} {}", larger(3, 9), larger(-2, -7));
    println!("{}", exclaim("hello"));
    announce("from native code");
    println!("done");
}
