
Import "JSON.clj"

class test_json @serialize(true) {
    def name "hello world"
    static fn main() {
        def o (new test_json)
        print (to_string (o.toDictionary()))
    }
}