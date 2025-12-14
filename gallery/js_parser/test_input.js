// JavaScript ES5 Test File
// Used to test the Ranger-based JS parser

// Variable declarations
var x = 1;
var name = "hello";
var pi = 3.14159;
var isReady = true;
var nothing = null;

// Array literal
var numbers = [1, 2, 3, 4, 5];

// Object literal
var person = {
  name: "John",
  age: 30,
  active: true,
};

// Function declaration
function add(a, b) {
  return a + b;
}

// Function expression
var multiply = function (a, b) {
  return a * b;
};

// If statement
if (x > 0) {
  x = x - 1;
} else {
  x = 0;
}

// While loop
while (x < 10) {
  x = x + 1;
}

// For loop
for (var i = 0; i < 5; i++) {
  numbers[i] = i * 2;
}

// For-in loop
for (var key in person) {
  console.log(key);
}

// Switch statement
switch (x) {
  case 0:
    console.log("zero");
    break;
  case 1:
    console.log("one");
    break;
  default:
    console.log("other");
}

// Try-catch-finally
try {
  var result = add(1, 2);
} catch (e) {
  console.log(e);
} finally {
  console.log("done");
}

// Expressions
var sum = add(1, 2) + multiply(3, 4);
var check = x > 0 ? "positive" : "non-positive";
var combined = "Hello " + name + "!";

// Member expressions
var len = name.length;
var first = numbers[0];
var fullName = person.name;

// Unary expressions
var neg = -x;
var not = !isReady;
var type = typeof name;

// Update expressions
x++;
--x;

// Logical expressions
var both = isReady && x > 0;
var either = isReady || x < 0;

// Call with method
console.log("Result:", sum);
