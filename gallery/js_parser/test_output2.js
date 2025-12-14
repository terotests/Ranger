// JavaScript ES6+ Test File
// Used to test the Ranger-based JS parser
// Variable declarations
var x = 1;
var name = 'hello';
var pi = 3.14159;
var isReady = true;
var nothing = null;
// ES6 let and const
let count = 0;
const MAX_VALUE = 100;
// Array literal
var numbers = [1, 2, 3, 4, 5];
// Object literal
var person = { name: 'John', age: 30, active: true };
// Shorthand properties
const firstName = 'Jane';
const lastName = 'Doe';
const user = { firstName, lastName, age: 25 };
/**
 * Sample comment.
 *
 * @param {*} a
 * @param {*} b
 * @returns
 */
function add(a, b) {
  return (a + b);
}
// Function expression
var multiply = function(a, b) {
  return (a * b);
};
// Arrow functions
const double = x => (x * 2);
const square = x => (x * x);
const greet = name => {
  return ('Hello, ' + name);
};
// If statement
if ((x > 0)) {
  x = (x - 1);
} else {
  x = 0;
}
// While loop
while ((x < 10)) {
  x = (x + 1);
}
// For loop
for (var i = 0; (i < 5); i++) {
  numbers[i] = (i * 2);
}
// For-in loop
for (var key in person) {
  console.log(key);
}
// For-of loop
for (const num of numbers) {
  console.log(num);
}
// Switch statement
switch (x) {
  case 0:
    console.log('zero');
    break;
  case 1:
    console.log('one');
    break;
  default:
    console.log('other');
}
// Try-catch-finally
try {
  var result = add(1, 2);
} catch (e) {
  console.log(e);
} finally {
  console.log('done');
}
// Expressions
var sum = (add(1, 2) + multiply(3, 4));
var check = (x > 0) ? 'positive' : 'non-positive';
var combined = (('Hello ' + name) + '!');
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
var both = (isReady && (x > 0));
var either = (isReady || (x < 0));
// Call with method
console.log('Result:', sum);
// ============================================
// ES6+ Advanced Features
// ============================================
// Template literals
const greeting = `Hello, ${name}!`;
const multiLine = `This is
a multi-line
string`;
const nested = `Sum: ${add(1, 2)}`;
// Classes
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return (this.name + ' makes a sound');
  }
  static create(name) {
    return new Animal(name);
  }
}
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  speak() {
    return (this.name + ' barks');
  }
  info() {
    return ((this.name + ' is a ') + this.breed);
  }
}
// Class instantiation
const dog = new Dog('Rex', 'German Shepherd');
const sound = dog.speak();
// Generator functions
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
}
function* rangeGenerator(start, end) {
  for (let i = start; (i < end); i++) {
    yield i;
  }
}
// Delegating generator
function* delegateGenerator() {
  yield* numberGenerator();
  yield 4;
}
// Async/await functions
async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
async function processItems(items) {
  for (const item of items) {
    await processItem(item);
  }
}
// Async arrow function
const asyncFetch = async url => {
  const result = await fetch(url);
  return result;
};
// Async generator
async function* asyncGenerator() {
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
}
// Spread operator - arrays
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];
const combined2 = [...arr1, ...arr2];
// Spread operator - objects
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };
const merged = { ...obj1, ...obj2, d: 4 };
// Spread in function call
console.log(...arr1);
// Rest parameters
function sumAll(...numbers) {
  return numbers.reduce((a, b) => (a + b), 0);
}
function firstAndRest(first, ...rest) {
  return { first, rest };
}
// Destructuring - arrays
const [a, b, c] = [1, 2, 3];
const [head, ...tail] = numbers;
let [p, q] = [q, p];
// Destructuring - objects
const { name: userName, age: userAge } = person;
const { active } = person;
// Nested destructuring
const data = { user: { profile: { email: 'test@example.com' } } };
const { user: { profile: { email } } } = data;
// New expression with arguments
const date = new Date();
const regex = new RegExp('test', 'gi');
const arr = new Array(5);
// Method chaining
const chainResult = [1, 2, 3].map(x => (x * 2)).filter(x => (x > 2)).reduce((a, b) => (a + b), 0);
// Computed property names
const propName = 'dynamic';
const computed = { [propName]: 'value', [('prop' + 2)]: 'value2' };
console.log('All tests completed!');
