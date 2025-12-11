# Ranger Code Examples

This file contains practical code examples demonstrating various Ranger language features.

---

## Example 1: Hello World

```clojure
class HelloWorld {
    sfn m@(main):void () {
        print "Hello, World!"
    }
}
```

---

## Example 2: Basic Class with Constructor

```clojure
class Person {
    def name:string ""
    def age:int 0

    Constructor (n:string a:int) {
        name = n
        age = a
    }

    fn greet:string () {
        return ("Hello, my name is " + name + " and I am " + age + " years old.")
    }

    fn haveBirthday:void () {
        age = age + 1
        print (name + " is now " + age + " years old!")
    }
}

class PersonDemo {
    sfn m@(main):void () {
        def person (new Person("Alice" 25))
        print (person.greet())
        person.haveBirthday()
    }
}
```

---

## Example 3: Array Operations

```clojure
class ArrayDemo {
    sfn m@(main):void () {
        ; Create an array
        def fruits:[string]

        ; Add items
        push fruits "Apple"
        push fruits "Banana"
        push fruits "Cherry"

        ; Get length
        def len (array_length fruits)
        print ("Array has " + len + " items")

        ; Iterate with index
        for fruits fruit:string i {
            print (i + ": " + fruit)
        }

        ; Get specific item
        def first (itemAt fruits 0)
        print ("First fruit: " + first)

        ; Modify item
        set fruits 1 "Blueberry"
        print ("Modified second fruit: " + (itemAt fruits 1))

        ; Check if contains (using indexOf)
        def idx (indexOf fruits "Cherry")
        if (idx >= 0) {
            print "Found Cherry!"
        }
    }
}
```

---

## Example 4: Hash Map Operations

```clojure
class HashMapDemo {
    sfn m@(main):void () {
        ; Create a hash map
        def scores:[string:int]

        ; Set values
        set scores "Alice" 95
        set scores "Bob" 87
        set scores "Charlie" 92

        ; Check if key exists
        if (has scores "Alice") {
            ; Get value (returns optional)
            def aliceScore (get scores "Alice")
            if (!null? aliceScore) {
                print ("Alice's score: " + (unwrap aliceScore))
            }
        }

        ; Get all keys and iterate
        def names (keys scores)
        for names name:string i {
            def score (unwrap (get scores name))
            print (name + ": " + score)
        }

        ; Remove a key
        remove scores "Bob"

        ; Check if Bob is still there
        if (has scores "Bob") {
            print "Bob still exists"
        } {
            print "Bob was removed"
        }
    }
}
```

---

## Example 5: Optional Handling

```clojure
class OptionalDemo {
    def cachedValue@(optional):string

    fn findUser@(optional):User (id:int) {
        if (id == 1) {
            def user (new User)
            user.name = "Alice"
            return user
        }
        ; Returns nothing (optional empty)
    }

    fn getCachedOrDefault:string (defaultVal:string) {
        ; Using elvis operator
        return (cachedValue ?? defaultVal)
    }

    fn processUser:void (id:int) {
        def user (this.findUser(id))

        ; Check if optional has value
        if (!null? user) {
            def u (unwrap user)
            print ("Found user: " + u.name)
        } {
            print "User not found"
        }
    }

    sfn m@(main):void () {
        def demo (new OptionalDemo)
        demo.processUser(1)
        demo.processUser(999)

        print (demo.getCachedOrDefault("default value"))
    }
}

class User {
    def name:string ""
}
```

---

## Example 6: Inheritance and Static Methods

```clojure
class Animal {
    def name:string ""

    fn speak:string () {
        return "..."
    }

    fn introduce:void () {
        print ("I am " + name + " and I say: " + (this.speak()))
    }
}

class Dog {
    Extends(Animal)

    fn speak:string () {
        return "Woof!"
    }

    ; Static factory method
    sfn createDog:Dog (dogName:string) {
        def dog (new Dog)
        dog.name = dogName
        return dog
    }
}

class Cat {
    Extends(Animal)

    fn speak:string () {
        return "Meow!"
    }
}

class AnimalDemo {
    sfn m@(main):void () {
        def dog (Dog.createDog("Buddy"))
        def cat (new Cat)
        cat.name = "Whiskers"

        dog.introduce()
        cat.introduce()
    }
}
```

---

## Example 7: Enums

```clojure
Enum Direction (
    North
    East
    South
    West
)

Enum LogLevel (
    Debug
    Info
    Warning
    Error
)

class Logger {
    def level:LogLevel LogLevel.Info

    fn setLevel:void (newLevel:LogLevel) {
        level = newLevel
    }

    fn log:void (lvl:LogLevel message:string) {
        if (lvl >= level) {
            switch lvl {
                case LogLevel.Debug {
                    print ("[DEBUG] " + message)
                }
                case LogLevel.Info {
                    print ("[INFO] " + message)
                }
                case LogLevel.Warning {
                    print ("[WARNING] " + message)
                }
                case LogLevel.Error {
                    print ("[ERROR] " + message)
                }
            }
        }
    }

    sfn m@(main):void () {
        def logger (new Logger)
        logger.setLevel(LogLevel.Debug)

        logger.log(LogLevel.Debug "This is debug")
        logger.log(LogLevel.Info "This is info")
        logger.log(LogLevel.Warning "This is warning")
        logger.log(LogLevel.Error "This is error")
    }
}
```

---

## Example 8: Lambda Functions

```clojure
class LambdaDemo {
    sfn m@(main):void () {
        def numbers:[int]
        push numbers 1
        push numbers 2
        push numbers 3
        push numbers 4
        push numbers 5

        ; Simple lambda
        def doubler (fn:int (x:int) {
            return (x * 2)
        })

        ; Using the lambda
        for numbers n:int i {
            def doubled (doubler(n))
            print (n + " doubled = " + doubled)
        }

        ; Filtering lambda
        def isEven (fn:boolean (x:int) {
            return ((x % 2) == 0)
        })

        print "Even numbers:"
        for numbers n:int i {
            if (isEven(n)) {
                print n
            }
        }
    }
}
```

---

## Example 9: Error Handling

```clojure
class ErrorDemo {
    fn riskyOperation:int (value:int) {
        if (value < 0) {
            throw "Value cannot be negative"
        }
        return (value * 2)
    }

    fn safeOperation:int (value:int) {
        try {
            def result (this.riskyOperation(value))
            return result
        } {
            print ("Error occurred: " + (error_msg))
            return 0
        }
    }

    sfn m@(main):void () {
        def demo (new ErrorDemo)

        def result1 (demo.safeOperation(10))
        print ("Result 1: " + result1)

        def result2 (demo.safeOperation(-5))
        print ("Result 2: " + result2)
    }
}
```

---

## Example 10: String Processing

```clojure
class StringDemo {
    sfn m@(main):void () {
        def text "  Hello, World!  "

        ; Trim whitespace
        def trimmed (trim text)
        print ("Trimmed: '" + trimmed + "'")

        ; String length
        def len (strlen trimmed)
        print ("Length: " + len)

        ; Get substring
        def sub (substring trimmed 0 5)
        print ("First 5 chars: " + sub)

        ; Get character at position
        def ch (charAt trimmed 0)
        print ("First char code: " + ch)

        ; Split string
        def words (strsplit trimmed " ")
        print "Words:"
        for words word:string i {
            print ("  " + i + ": " + word)
        }

        ; Build string with concatenation
        def builder ""
        def i 0
        while (i < 5) {
            builder = builder + i + ","
            i = i + 1
        }
        print ("Built string: " + builder)
    }
}
```

---

## Example 11: Math Operations

```clojure
class MathDemo {
    sfn m@(main):void () {
        ; Basic arithmetic
        def a 10
        def b 3
        print ("Addition: " + (a + b))
        print ("Subtraction: " + (a - b))
        print ("Multiplication: " + (a * b))
        print ("Division: " + (a / b))
        print ("Modulo: " + (a % b))

        ; Math functions
        def angle:double 0.5
        print ("sin(" + angle + ") = " + (sin angle))
        print ("cos(" + angle + ") = " + (cos angle))
        print ("sqrt(16) = " + (sqrt 16.0))
        print ("PI = " + (M_PI))

        ; Type conversion
        def d:double 3.7
        def i (to_int d)
        print ("to_int(3.7) = " + i)

        ; Ternary operator
        def max (? (a > b) a b)
        print ("Max of " + a + " and " + b + " is " + max)
    }
}
```

---

## Example 12: File I/O

```clojure
class FileDemo {
    sfn m@(main):void () {
        def path "."
        def filename "test.txt"

        ; Write file
        write_file path filename "Hello from Ranger!"
        print "File written."

        ; Check if file exists
        if (file_exists path filename) {
            print "File exists!"

            ; Read file
            def content (read_file path filename)
            if (!null? content) {
                print ("File content: " + (unwrap content))
            }
        }

        ; Check/create directory
        def newDir "output"
        if! (dir_exists newDir) {
            create_dir newDir
            print "Directory created."
        }
    }
}
```

---

## Example 13: Custom Operators

```clojure
class Vec2 {
    def x:double 0.0
    def y:double 0.0

    fn add:Vec2 (other:Vec2) {
        def result (new Vec2)
        result.x = x + other.x
        result.y = y + other.y
        return result
    }

    fn scale:Vec2 (factor:double) {
        def result (new Vec2)
        result.x = x * factor
        result.y = y * factor
        return result
    }

    fn length:double () {
        return (sqrt ((x * x) + (y * y)))
    }

    fn toString:string () {
        return ("(" + x + ", " + y + ")")
    }

    sfn create:Vec2 (px:double py:double) {
        def v (new Vec2)
        v.x = px
        v.y = py
        return v
    }
}

; Custom operators for Vec2
operators {
    ; Vector addition
    + _:Vec2 (a:Vec2 b:Vec2) {
        templates {
            * @macro(true) ("(" (e 1) ".add(" (e 2) "))")
        }
    }

    ; Vector-scalar multiplication
    * _:Vec2 (v:Vec2 s:double) {
        templates {
            * @macro(true) ("(" (e 1) ".scale(" (e 2) "))")
        }
    }
}

class VectorDemo {
    sfn m@(main):void () {
        def v1 (Vec2.create(3.0 4.0))
        def v2 (Vec2.create(1.0 2.0))

        ; Using custom operators
        def v3 (v1 + v2)
        def v4 (v1 * 2.0)

        print ("v1 = " + (v1.toString()))
        print ("v2 = " + (v2.toString()))
        print ("v1 + v2 = " + (v3.toString()))
        print ("v1 * 2 = " + (v4.toString()))
        print ("length of v1 = " + (v1.length()))
    }
}
```

---

## Example 14: Class Extension

```clojure
class BaseClass {
    def value:int 0

    fn getValue:int () {
        return value
    }
}

; Add new functionality to BaseClass
extension BaseClass {
    def extraData:string ""

    fn doubleValue:int () {
        return (value * 2)
    }

    fn setExtraData:void (data:string) {
        extraData = data
    }

    fn getFullInfo:string () {
        return ("Value: " + value + ", Extra: " + extraData)
    }
}

class ExtensionDemo {
    sfn m@(main):void () {
        def obj (new BaseClass)
        obj.value = 42
        obj.setExtraData("Hello")

        print (obj.getFullInfo())
        print ("Doubled value: " + (obj.doubleValue()))
    }
}
```

---

## Example 15: Platform-Specific Code

```clojure
class PlatformDemo {
    fn getPlatformInfo:string () {
        def info "Running on: "

        if_javascript {
            info = info + "JavaScript"
        }

        if_java {
            info = info + "Java"
        }

        if_go {
            info = info + "Go"
        }

        if_swift {
            info = info + "Swift"
        }

        if_php {
            info = info + "PHP"
        }

        if_cpp {
            info = info + "C++"
        }

        return info
    }

    sfn m@(main):void () {
        def demo (new PlatformDemo)
        print (demo.getPlatformInfo())
    }
}
```

---

## Example 16: Working with JSON-like Structures

```clojure
class JsonDemo {
    sfn m@(main):void () {
        ; Creating a nested structure
        def config:[string:string]
        set config "host" "localhost"
        set config "port" "8080"
        set config "debug" "true"

        ; Nested hash map
        def users:[string:[string:string]]

        def user1:[string:string]
        set user1 "name" "Alice"
        set user1 "email" "alice@example.com"
        set users "user1" user1

        def user2:[string:string]
        set user2 "name" "Bob"
        set user2 "email" "bob@example.com"
        set users "user2" user2

        ; Access nested data
        def userKeys (keys users)
        for userKeys key:string i {
            def user (unwrap (get users key))
            def name (unwrap (get user "name"))
            def email (unwrap (get user "email"))
            print (key + ": " + name + " <" + email + ">")
        }
    }
}
```

---

## Example 17: Simple State Machine

```clojure
Enum State (
    Idle
    Running
    Paused
    Stopped
)

class StateMachine {
    def currentState:State State.Idle
    def stateHistory:[State]

    fn transition:void (newState:State) {
        push stateHistory currentState
        currentState = newState
        print ("Transitioned from " + (this.stateName((itemAt stateHistory ((array_length stateHistory) - 1)))) +
               " to " + (this.stateName(currentState)))
    }

    fn stateName:string (state:State) {
        switch state {
            case State.Idle {
                return "Idle"
            }
            case State.Running {
                return "Running"
            }
            case State.Paused {
                return "Paused"
            }
            case State.Stopped {
                return "Stopped"
            }
        }
        return "Unknown"
    }

    fn start:void () {
        if (currentState == State.Idle) {
            this.transition(State.Running)
        }
    }

    fn pause:void () {
        if (currentState == State.Running) {
            this.transition(State.Paused)
        }
    }

    fn resume:void () {
        if (currentState == State.Paused) {
            this.transition(State.Running)
        }
    }

    fn stop:void () {
        if ((currentState == State.Running) || (currentState == State.Paused)) {
            this.transition(State.Stopped)
        }
    }

    sfn m@(main):void () {
        def machine (new StateMachine)
        machine.start()
        machine.pause()
        machine.resume()
        machine.stop()
    }
}
```

---

## Example 18: Command-Line Arguments

```clojure
class CliDemo {
    sfn m@(main):void () {
        def argCount (shell_arg_cnt)
        print ("Number of arguments: " + argCount)

        if (argCount > 0) {
            def i 0
            while (i < argCount) {
                def arg (shell_arg i)
                print ("Arg " + i + ": " + arg)
                i = i + 1
            }
        } {
            print "No arguments provided"
            print "Usage: program <arg1> <arg2> ..."
        }
    }
}
```
