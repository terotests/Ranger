
Idea of a context builder comes from creating a context with grammar rules for specified context.

The basic premise and problem is as follow: in real world application generators it is not enough just to write code and classes - typically you will create some kind of running context for some
kind of code with some custom initialization and instrumentation, which will repeat in your
codebase.

For Example consider this C# example code:
```C#
// Class creates a context for methods
[Produces("application/json")]
[Route("api/[controller]")]
public class PetsController : ControllerBase
{   
  [HttpGet]
  public async Task<ActionResult<List<Pet>>> GetAllAsync()
  { 
    // Example of a running context inside another
    // Code here has a specific execution context with certain rules 
  }
}
```
Current version of Ranger supports only `class` keyword which is treated as a special case and or custom operators inside them, but those operators are not aware of the context they are running

The generic version actually does exist, but syntax does not support it.

For example, class could be understood as some kind of special context which allows some operators to exist inside the definition of the class

```
class X extends Y {
  <context of the class>
}
```

This definition would create a class inside the context.

The operators should be able to be extended using customized code. Encountering a class keyword is obviously something that will create definitions inside the context. The question is should these be generalized ? 

Breath -first scanning would be default: first scan all classes, then all properties and methods, then enter method body and perhaps scan all top level statements (operators)

Also, there could be parameters inside the definition. How could it look like then ? 

```clojure
('produces' (def produces:string))
('route' (def route:string))
'class' (def className:string) (
    def extends:[string] ('extends' string)
  ) '{'
'}'
```

Or, lets try this again, what if we define first the AST we want to create

```typescript

// extends someName
class InheritedClass {
  begin:string = 'extends'
  name:string
}

class Tag {
  // Match [Produces("application/json")]
  begin:string = '['
  name?:string
  startParen:string = '('
  value?:string
  endParen:string = ')'
  constructor(tagName?:string) {
    this.name = tagName
  }
}

// generic list head
class headItem<T> {
  value:T
}
// generic list tail
class tailItem<T> {
  separator = ' , '
  value:T
}
// generic list presentation
class List<T> {
  head?:headItem<T>
  tail?:tailItem<T>[]
}
// generic parenthezised list presentation
class ParenList<T> {
  parenStart = '('
  params:List<T>
  parenEnd = ')'
}
class SimpleTypeSpecifier {
  start = ':'
  typeName:string
}
class VariableDef<T> {
  name:string
  typeSpeficier:SimpleTypeSpecifier
}
class FunctionSpec {
  begin:string = ' function '
  name:string
  params:ParenList<VariableDef>
  // and then body definition comes around here...
}

// extends someName
class InheritedClass {
  begin:string = ' extends '
  name:string
}

class Class {
  // Match [Produces("application/json")]
  begin:string = ' class '
  name?:string
  inherited?:InheritedClass[] 
  value?:string
  beginBody:string = ' { '
    // whatever can come inside class here...
  endBody:string = ' } '
}

class ASTNodeClass {
  // can match for example [Produces("application/json")]
  produces = new Tag('Produces')
  classTag = new Class()
}
```
Operator precedence again...

Expression may be intepreted `(1 + 4) * 5` or `1 + (4 * 5)`

Tree creates -> expression X
Tree creates -> expression Y

Expressions are hard in a way.

```typescript
// Will be also expression after evaluated ? 
class Expression {

}
class PlusExpression extends Expression {
  left: Expression
  sign = '+'
  right: Expression
}
class MulExpression extends Expression {
  left: Expression
  sign = '+'
  right: Expression
}
```

OK, so you can start with some rule like `Reference`

```typescript

type Reference = TokenReference | GetProperty

class TokenReference {
  spaceBefore = ' '
  value: string
  spaceAfter = ' '
}
```

```typescript
class GetProperty {
  obj:Reference
  getter = '.'
  refProperty:Reference
}
```

Then you may have a call
```typescript
type Expression = RightAssocPlus | CallExpression
class CallExpression {
  ref:Reference
  parenStart = ' ( '
  parenEnd = ' ) '
}
```

So, first we have `foo.bar()`

First it will be `foo` -> `TokenReference` and `Reference` 
```typescript
  let expr = new TokenReference()
  expr.value = 'foo'
```

1. If we encounter something which does have left hand side something we can use, we can continue evaluating it
2. Otherwise stop here


How about right association ??
```typescript
class RightAssocPlus extends Expression {
  parenStart = ' ++'
  ref:Reference
}
```

```typescript
type ObjectInstance = NewOperator | Reference
class NewOperator {
  start = ' new '
  ref:Reference
}
```
Example
`new Foo.bar()`

Assigment
```typescript
type Expression = Expression & AssignOperator
// Can also be expression...
class AssignOperator {
  ref:Reference
  start = ' = '
  value:Expression
}
```
If it is the top level, than it can be assign operator ? 








