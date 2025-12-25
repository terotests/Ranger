# TypeScript Evaluator Enhancement Plan

This document outlines the current capabilities of the TSX/TypeScript evaluator in the EVG Component Engine and the planned enhancements to support for loops, if statements, array mutations, and Map creation.

## Current Capabilities

### Supported Features

#### 1. Literals
- ✅ `NumericLiteral` - Numbers: `42`, `3.14`
- ✅ `StringLiteral` - Strings: `"hello"`, `'world'`
- ✅ `TemplateLiteral` - Template strings: `` `text` ``
- ✅ `BooleanLiteral` - `true`, `false`
- ✅ `NullLiteral` - `null`
- ✅ `ArrayExpression` - `[1, 2, 3]`
- ✅ `ObjectExpression` - `{ key: value }`

#### 2. Operators
- ✅ Binary operators: `+`, `-`, `*`, `/`, `%`
- ✅ Comparison: `<`, `>`, `<=`, `>=`, `==`, `===`, `!=`, `!==`
- ✅ Logical: `&&`, `||` (with short-circuit evaluation)
- ✅ Unary: `!`, `-`, `+`
- ✅ Ternary: `condition ? a : b`

#### 3. Expressions
- ✅ `Identifier` - Variable lookup from context
- ✅ `MemberExpression` - `obj.prop`, `arr[0]`
- ✅ `ParenthesizedExpression` - `(expr)`
- ✅ `JSXElement` as expression value

#### 4. Statements
- ✅ `VariableDeclaration` - `const x = 1`, `let y = 2`
- ✅ `ReturnStatement` - `return <JSX />`

#### 5. JSX Features
- ✅ JSX Elements with attributes
- ✅ JSX expression children: `{variable}`
- ✅ Array `.map()` iteration: `{items.map((item, i) => <View/>)}`
- ✅ Conditional rendering: `{condition && <Element/>}`
- ✅ Ternary in JSX: `{cond ? <A/> : <B/>}`
- ✅ Component expansion with props

### EvalValue Types
The `EvalValue` class supports:
- `null` (type 0)
- `number` (type 1)
- `string` (type 2)
- `boolean` (type 3)
- `array` (type 4) - with `arrayValue: [EvalValue]`
- `object` (type 5) - with `objectKeys` and `objectValues`
- `function` (type 6)
- `evgElement` (type 7) - for JSX elements as props

---

## What is Missing

### ❌ Control Flow Statements
| Feature | Status | Notes |
|---------|--------|-------|
| `if` / `else if` / `else` | ❌ Missing | Only ternary `?:` works in expressions |
| `for` loop | ❌ Missing | Parser supports it, evaluator doesn't |
| `for...of` loop | ❌ Missing | Parser supports it, evaluator doesn't |
| `for...in` loop | ❌ Missing | Parser supports it, evaluator doesn't |
| `while` loop | ❌ Missing | Not implemented |
| `do...while` loop | ❌ Missing | Not implemented |
| `switch` statement | ❌ Missing | Not implemented |
| `break` / `continue` | ❌ Missing | Loop control not implemented |
| `try` / `catch` / `finally` | ❌ Missing | Error handling not implemented |

### ❌ Array Methods
| Method | Status | Notes |
|--------|--------|-------|
| `.map()` | ✅ Works | Only in JSX context |
| `.push()` | ❌ Missing | Cannot mutate arrays |
| `.pop()` | ❌ Missing | Cannot mutate arrays |
| `.shift()` / `.unshift()` | ❌ Missing | Cannot mutate arrays |
| `.splice()` | ❌ Missing | Cannot mutate arrays |
| `.filter()` | ❌ Missing | Not implemented |
| `.find()` | ❌ Missing | Not implemented |
| `.findIndex()` | ❌ Missing | Not implemented |
| `.forEach()` | ❌ Missing | Not implemented |
| `.reduce()` | ❌ Missing | Not implemented |
| `.some()` / `.every()` | ❌ Missing | Not implemented |
| `.includes()` | ❌ Missing | Not implemented |
| `.indexOf()` | ❌ Missing | Not implemented |
| `.join()` | ❌ Missing | Not implemented |
| `.slice()` | ❌ Missing | Not implemented |
| `.concat()` | ❌ Missing | Not implemented |
| `.reverse()` | ❌ Missing | Not implemented |
| `.sort()` | ❌ Missing | Not implemented |
| `.flat()` / `.flatMap()` | ❌ Missing | Not implemented |

### ❌ Object Methods
| Method | Status | Notes |
|--------|--------|-------|
| `Object.keys()` | ❌ Missing | Not implemented |
| `Object.values()` | ❌ Missing | Not implemented |
| `Object.entries()` | ❌ Missing | Not implemented |
| `Object.assign()` | ❌ Missing | Not implemented |
| `Object.fromEntries()` | ❌ Missing | Not implemented |
| Spread operator `{ ...obj }` | ❌ Missing | Not implemented |

### ❌ String Methods
| Method | Status | Notes |
|--------|--------|-------|
| `.length` | ❌ Missing | Property access not handled |
| `.split()` | ❌ Missing | Not implemented |
| `.trim()` | ❌ Missing | Not implemented |
| `.toLowerCase()` / `.toUpperCase()` | ❌ Missing | Not implemented |
| `.substring()` / `.slice()` | ❌ Missing | Not implemented |
| `.replace()` | ❌ Missing | Not implemented |
| `.startsWith()` / `.endsWith()` | ❌ Missing | Not implemented |
| `.includes()` | ❌ Missing | Not implemented |
| `.padStart()` / `.padEnd()` | ❌ Missing | Not implemented |
| Template literal expressions | ❌ Missing | `${expr}` interpolation not working |

### ❌ Built-in Types & Constructors
| Feature | Status | Notes |
|---------|--------|-------|
| `new Map()` | ❌ Missing | Map type not supported |
| `new Set()` | ❌ Missing | Set type not supported |
| `new Date()` | ❌ Missing | Date type not supported |
| `new Array()` | ❌ Missing | Use literal `[]` instead |
| `Array.from()` | ❌ Missing | Not implemented |
| `Array.isArray()` | ❌ Missing | Not implemented |

### ❌ Assignment & Update
| Feature | Status | Notes |
|---------|--------|-------|
| `x = value` | ❌ Missing | Re-assignment not working |
| `x += value` | ❌ Missing | Compound assignment not working |
| `x++` / `++x` | ❌ Missing | Increment not working |
| `x--` / `--x` | ❌ Missing | Decrement not working |

### ❌ Function Features
| Feature | Status | Notes |
|---------|--------|-------|
| Function declarations | ✅ Works | For components |
| Arrow functions | ✅ Works | For `.map()` callbacks |
| Rest parameters `...args` | ❌ Missing | Not implemented |
| Spread in calls `fn(...arr)` | ❌ Missing | Not implemented |
| Default parameters | ✅ Works | In component props |
| Destructuring parameters | ✅ Works | In component props |

### ❌ Other Missing Features
| Feature | Status | Notes |
|---------|--------|-------|
| `typeof` operator | ❌ Missing | Not implemented |
| `instanceof` operator | ❌ Missing | Not implemented |
| `in` operator | ❌ Missing | Not implemented |
| Nullish coalescing `??` | ❌ Missing | Not implemented |
| Optional chaining `?.` | ❌ Missing | Not implemented |
| Destructuring assignment | ❌ Missing | Not implemented |
| `console.log()` | ❌ Missing | No debug output |

---

## Planned Enhancements

### Phase 1: If Statement Support

#### Goal
Support `if` / `else if` / `else` statements in function bodies.

```tsx
function getColor(status) {
  if (status === "success") {
    return "#00ff00";
  } else if (status === "warning") {
    return "#ffff00";
  } else {
    return "#ff0000";
  }
}
```

#### Implementation Tasks

1. **Add `evaluateIfStatement` method in ComponentEngine.rgr**
   - Handle `IfStatement` node type
   - Evaluate test condition
   - Execute consequent if true
   - Execute alternate (else/else if) if false

2. **Handle early returns from if blocks**
   - Need to track when return statement is hit
   - Propagate return value up the call stack

#### AST Structure (from ts_parser)
```
IfStatement:
  - left: Expression (test condition)
  - body: Statement (consequent - then block)
  - alternate: Statement (else block, may be another IfStatement for else-if)
```

#### Code Changes
```ranger
fn evaluateIfStatement:EvalValue (node:TSNode) {
    ; Evaluate condition
    if node.left {
        def condNode:TSNode (unwrap node.left)
        def condition:EvalValue (this.evaluateExpr(condNode))
        
        if (condition.toBool()) {
            ; Execute then-block
            if node.body {
                def thenBlock:TSNode (unwrap node.body)
                return (this.evaluateStatementBlock(thenBlock))
            }
        } {
            ; Execute else-block if present
            if node.alternate {
                def elseBlock:TSNode (unwrap node.alternate)
                ; Could be another IfStatement (else if) or BlockStatement (else)
                if (elseBlock.nodeType == "IfStatement") {
                    return (this.evaluateIfStatement(elseBlock))
                }
                return (this.evaluateStatementBlock(elseBlock))
            }
        }
    }
    return (EvalValue.null())
}
```

---

### Phase 2: For Loop Support

#### Goal
Support `for` loops in function bodies to build arrays programmatically.

```tsx
function generateItems() {
  const items = [];
  for (let i = 0; i < 5; i++) {
    items.push({ id: i, name: `Item ${i}` });
  }
  return items;
}
```

#### Implementation Tasks

1. **Add `evaluateForStatement` method in ComponentEngine.rgr**
   - Handle `ForStatement` node type
   - Support `for (init; test; update) body` structure
   - Create child scope for loop variable
   - Evaluate init, test condition, update expression
   - Execute body statements in loop

2. **Add `evaluateForOfStatement` method**
   - Handle `for (const x of array) body`
   - Iterate over array values
   - Bind loop variable in each iteration

3. **Add `evaluateForInStatement` method**
   - Handle `for (const key in object) body`
   - Iterate over object keys

4. **Modify `evaluateFunctionBody` to handle loop statements**
   ```ranger
   if (stmt.nodeType == "ForStatement") {
       this.evaluateForStatement(stmt)
   }
   if (stmt.nodeType == "ForOfStatement") {
       this.evaluateForOfStatement(stmt)
   }
   ```

#### AST Structure (from ts_parser)
```
ForStatement:
  - init: VariableDeclaration or Expression (let i = 0)
  - left: Expression (test condition: i < 5)
  - right: Expression (update: i++)
  - body: Statement (loop body)

ForOfStatement:
  - left: VariableDeclaration (const x)
  - right: Expression (array to iterate)
  - body: Statement
```

---

### Phase 3: Array Mutation (push)

#### Goal
Support `array.push(item)` to add items to arrays.

```tsx
const items = [];
items.push("first");
items.push("second");
```

#### Implementation Tasks

1. **Detect `CallExpression` with `push` method**
   - In `evaluateExpr`, handle `CallExpression` node type
   - Check if callee is `MemberExpression` with `.push`

2. **Implement `evaluateCallExpression` method**
   ```ranger
   fn evaluateCallExpression:EvalValue (node:TSNode) {
       if node.left {
           def calleeNode:TSNode (unwrap node.left)
           if (calleeNode.nodeType == "MemberExpression") {
               def methodName:string calleeNode.name
               if (methodName == "push") {
                   return (this.evaluateArrayPush(calleeNode node))
               }
           }
       }
       return (EvalValue.null())
   }
   ```

3. **Implement `evaluateArrayPush` method**
   - Get the array from context
   - Evaluate the argument(s)
   - Mutate the array by adding items
   - Return the new length

4. **Make EvalValue arrays mutable**
   - Add `pushItem(item: EvalValue)` method to EvalValue
   - Update context variable after mutation

#### Mutation Challenge
Since EvalValue is passed by value in some contexts, need to ensure mutations propagate:
- Option A: Return new array and update context
- Option B: Use reference semantics (arrays share underlying storage)

---

### Phase 4: Map Support

#### Goal
Support JavaScript `Map` for key-value collections.

```tsx
const map = new Map();
map.set("key1", "value1");
const val = map.get("key1");

// Or from array of pairs
const items = [["a", 1], ["b", 2]];
const map = new Map(items);
```

#### Implementation Tasks

1. **Add Map type to EvalValue**
   - New type constant: `8 = map`
   - Add `mapKeys: [EvalValue]` and `mapValues: [EvalValue]` fields
   - Add `EvalValue.map()` constructor

2. **Handle `new Map()` expression**
   - Detect `NewExpression` with `Map` callee
   - Handle optional array-of-pairs argument

3. **Implement Map methods**
   - `map.set(key, value)` - add/update entry
   - `map.get(key)` - retrieve value
   - `map.has(key)` - check existence
   - `map.delete(key)` - remove entry
   - `map.size` - property for count
   - `map.keys()` - iterator (return array)
   - `map.values()` - iterator (return array)
   - `map.entries()` - iterator (return array of pairs)

4. **Add `evaluateNewExpression` method**
   ```ranger
   fn evaluateNewExpression:EvalValue (node:TSNode) {
       def calleeName:string ""
       if node.left {
           def callee:TSNode (unwrap node.left)
           calleeName = callee.name
       }
       if (calleeName == "Map") {
           return (this.createMap(node))
       }
       return (EvalValue.null())
   }
   ```

---

### Phase 5: Additional Array Methods

#### Goal
Support common array methods beyond `.map()`.

#### Methods to Add

1. **`array.filter(callback)`**
   - Return array of items where callback returns true
   ```tsx
   const evens = numbers.filter(n => n % 2 === 0);
   ```

2. **`array.find(callback)`**
   - Return first item where callback returns true
   ```tsx
   const item = items.find(x => x.id === 5);
   ```

3. **`array.forEach(callback)`**
   - Execute callback for each item (no return value)
   ```tsx
   items.forEach(item => console.log(item));
   ```

4. **`array.reduce(callback, initial)`**
   - Accumulate value across array
   ```tsx
   const sum = numbers.reduce((acc, n) => acc + n, 0);
   ```

5. **`array.includes(item)`**
   - Check if array contains item
   ```tsx
   if (items.includes("hello")) { ... }
   ```

6. **`array.indexOf(item)`**
   - Return index of item or -1
   ```tsx
   const idx = items.indexOf("hello");
   ```

7. **`array.join(separator)`**
   - Join array to string
   ```tsx
   const csv = items.join(",");
   ```

---

### Phase 6: Object Methods

#### Goal
Support common object operations.

1. **`Object.keys(obj)`** - Return array of keys
2. **`Object.values(obj)`** - Return array of values  
3. **`Object.entries(obj)`** - Return array of [key, value] pairs
4. **`Object.assign(target, source)`** - Merge objects
5. **Spread operator** - `{ ...obj, newProp: value }`

---

## Implementation Priority

| Priority | Phase | Feature | Complexity | Impact |
|----------|-------|---------|------------|--------|
| 1 | 1 | If statement | Low | High - conditional logic in functions |
| 2 | 2 | For loop | Medium | High - enables programmatic generation |
| 3 | 3 | Array.push() | Low | High - needed for loops |
| 4 | 2 | For...of loop | Low | Medium - cleaner iteration |
| 5 | 5 | Array.filter() | Low | Medium - data transformation |
| 6 | 5 | Array.find() | Low | Medium - data lookup |
| 7 | 4 | Map type | Medium | Medium - key-value storage |
| 8 | 7 | Date formatting | Low | High - photo metadata display |
| 9 | 8 | GPS coordinate API | Medium | High - location-based layouts |
| 10 | 6 | Object methods | Low | Low - utility |

---

## Example Use Cases

### Use Case 1: Generate Grid Items
```tsx
function GridPage({ rows, cols }) {
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push(
        <View key={`${r}-${c}`} width="100px" height="100px">
          <Label>{`${r},${c}`}</Label>
        </View>
      );
    }
  }
  return <View flexDirection="row" flexWrap="wrap">{items}</View>;
}
```

### Use Case 2: Build Photo Index
```tsx
function PhotoIndex({ photos }) {
  const photoMap = new Map();
  for (const photo of photos) {
    const date = photo.date.split('-')[0]; // Year
    if (!photoMap.has(date)) {
      photoMap.set(date, []);
    }
    photoMap.get(date).push(photo);
  }
  
  return (
    <View>
      {Array.from(photoMap.entries()).map(([year, yearPhotos]) => (
        <View>
          <Label fontSize="24px">{year}</Label>
          {yearPhotos.map(p => <Image src={p.src} />)}
        </View>
      ))}
    </View>
  );
}
```

### Use Case 3: Filtered List
```tsx
function FilteredList({ items, category }) {
  const filtered = items.filter(item => item.category === category);
  return (
    <View>
      {filtered.map(item => (
        <Label>{item.name}</Label>
      ))}
    </View>
  );
}
```

---

## Files to Modify

1. **`gallery/pdf_writer/src/jsx/ComponentEngine.rgr`**
   - Add new evaluate* methods for statements
   - Handle CallExpression for method calls
   - Handle NewExpression for Map/Set

2. **`gallery/pdf_writer/src/jsx/EvalValue.rgr`**
   - Add Map type (type 8)
   - Add mutation methods for arrays
   - Add Map methods (get, set, has, etc.)

3. **`gallery/ts_parser/ts_parser_simple.rgr`**
   - Verify ForStatement parsing is complete
   - Ensure NewExpression is properly parsed

---

## Testing Strategy

1. **Unit tests for new evaluator methods**
   - Test for loop with various conditions
   - Test array.push mutations
   - Test Map operations

2. **Integration tests with TSX files**
   - Create test_for_loops.tsx
   - Create test_array_methods.tsx
   - Create test_map.tsx

3. **Edge cases**
   - Empty loops
   - Nested loops
   - Break/continue (Phase 2)
   - Infinite loop protection (max iterations)

---

## Phase 7: Date/Time Formatting API

### Goal
Provide utilities for formatting dates and times from image EXIF metadata for document display.

### Image Metadata Context
When images have EXIF data, the metadata might include:
- `DateTimeOriginal` - When photo was taken (e.g., "2024:12:25 14:30:00")
- `DateTimeDigitized` - When digitized
- `DateTime` - Last modified

### Proposed Date API

#### 1. Date Formatting Function
```tsx
// Format a date string or timestamp
formatDate(date: string | number, format: string): string

// Format patterns:
// dd   - Day with leading zero (01-31)
// d    - Day without leading zero (1-31)
// mm   - Month with leading zero (01-12)
// m    - Month without leading zero (1-12)
// MMM  - Month short name (Jan, Feb, ...)
// MMMM - Month full name (January, February, ...)
// yy   - Year 2 digits (24)
// yyyy - Year 4 digits (2024)
// YYYY - Same as yyyy
// HH   - Hours 24h with leading zero (00-23)
// H    - Hours 24h without leading zero (0-23)
// hh   - Hours 12h with leading zero (01-12)
// h    - Hours 12h without leading zero (1-12)
// MM   - Minutes with leading zero (00-59)  
// ss   - Seconds with leading zero (00-59)
// a    - am/pm
// A    - AM/PM

// Examples:
formatDate("2024:12:25 14:30:00", "dd.mm.yyyy")     // "25.12.2024"
formatDate("2024:12:25 14:30:00", "MMMM d, yyyy")   // "December 25, 2024"
formatDate("2024:12:25 14:30:00", "dd/mm/yy HH:MM") // "25/12/24 14:30"
formatDate(1735135800000, "yyyy-mm-dd")             // "2024-12-25"
```

#### 2. Date Parsing Function
```tsx
// Parse EXIF date format to timestamp
parseDate(dateString: string): number

// EXIF format: "YYYY:MM:DD HH:MM:SS"
parseDate("2024:12:25 14:30:00")  // Returns Unix timestamp
```

#### 3. Date Arithmetic
```tsx
// Get parts of a date
getYear(date: string | number): number
getMonth(date: string | number): number   // 1-12
getDay(date: string | number): number     // 1-31
getHour(date: string | number): number    // 0-23
getMinute(date: string | number): number  // 0-59

// Compare dates
dateDiff(date1, date2, unit: "days" | "hours" | "minutes" | "seconds"): number
```

### Example Usage in TSX
```tsx
function PhotoCard({ photo }) {
  const dateStr = formatDate(photo.exif.DateTimeOriginal, "dd.mm.yyyy");
  const timeStr = formatDate(photo.exif.DateTimeOriginal, "HH:MM");
  
  return (
    <View>
      <Image src={photo.src} width="300px" height="200px" />
      <View flexDirection="row" justifyContent="space-between">
        <Label fontSize="12px" color="#666">{dateStr}</Label>
        <Label fontSize="12px" color="#666">{timeStr}</Label>
      </View>
    </View>
  );
}
```

### Implementation Notes
- Date formatting can be implemented in Ranger as a built-in function
- Need to handle EXIF date format ("YYYY:MM:DD HH:MM:SS") specifically
- Consider locale support for month names (initially English only)

---

## Phase 8: GPS Coordinate API

### Goal
Transform GPS coordinates from image EXIF metadata into useful formats for document rendering, including mapping coordinates to page positions.

### Image GPS Metadata
EXIF GPS data typically includes:
- `GPSLatitude` - Latitude in degrees, minutes, seconds (e.g., [60, 10, 30.5])
- `GPSLatitudeRef` - "N" or "S"
- `GPSLongitude` - Longitude in degrees, minutes, seconds (e.g., [24, 56, 15.2])
- `GPSLongitudeRef` - "E" or "W"
- `GPSAltitude` - Altitude in meters

### Proposed GPS API

#### 1. Coordinate Conversion
```tsx
// Convert DMS (degrees, minutes, seconds) to decimal degrees
dmsToDecimal(degrees: number, minutes: number, seconds: number, ref: string): number

// Examples:
dmsToDecimal(60, 10, 30.5, "N")   // 60.175139 (positive for N/E)
dmsToDecimal(60, 10, 30.5, "S")   // -60.175139 (negative for S/W)

// Parse EXIF GPS array format
parseGPS(coords: number[], ref: string): number
parseGPS([60, 10, 30.5], "N")     // 60.175139
```

#### 2. Coordinate Formatting
```tsx
// Format decimal degrees to display string
formatGPS(lat: number, lon: number, format?: string): string

// Formats:
// "dms"     - 60°10'30.5"N 24°56'15.2"E
// "decimal" - 60.175139, 24.937556
// "dm"      - 60°10.508'N 24°56.253'E

formatGPS(60.175139, 24.937556, "dms")     // "60°10'30.5\"N 24°56'15.2\"E"
formatGPS(60.175139, 24.937556, "decimal") // "60.175139, 24.937556"
```

#### 3. Bounding Box & Coordinate Mapping
```tsx
// Define a GPS bounding box
interface GPSBounds {
  north: number;  // Top latitude (max)
  south: number;  // Bottom latitude (min)
  east: number;   // Right longitude (max)
  west: number;   // Left longitude (min)
}

// Map GPS coordinates to X,Y position within a box
// Returns normalized values 0-1 that can be multiplied by container size
gpsToXY(lat: number, lon: number, bounds: GPSBounds): { x: number, y: number }

// Example: Map Helsinki area photos to a page
const bounds = {
  north: 60.25,   // Top of map
  south: 60.10,   // Bottom of map
  east: 25.10,    // Right edge
  west: 24.80     // Left edge
};

const pos = gpsToXY(60.175, 24.94, bounds);
// Returns { x: 0.467, y: 0.5 }
// x: (24.94 - 24.80) / (25.10 - 24.80) = 0.467
// y: (60.25 - 60.175) / (60.25 - 60.10) = 0.5 (inverted for screen coords)
```

#### 4. Distance Calculation
```tsx
// Calculate distance between two GPS points (in meters)
gpsDistance(lat1: number, lon1: number, lat2: number, lon2: number): number

// Uses Haversine formula
gpsDistance(60.175, 24.94, 60.180, 24.95)  // ~580 meters
```

#### 5. Bounds Calculation
```tsx
// Calculate bounding box from array of coordinates
gpsBounds(coords: Array<{lat: number, lon: number}>): GPSBounds

// Auto-calculate bounds from a set of photos
const photos = [
  { lat: 60.17, lon: 24.94 },
  { lat: 60.19, lon: 24.91 },
  { lat: 60.16, lon: 24.98 }
];
const bounds = gpsBounds(photos);
// { north: 60.19, south: 60.16, east: 24.98, west: 24.91 }

// Add padding to bounds
gpsBoundsWithPadding(bounds: GPSBounds, paddingPercent: number): GPSBounds
```

### Example Usage: Photo Map Layout
```tsx
function PhotoMapPage({ photos, mapWidth, mapHeight }) {
  // Calculate bounds from all photo locations
  const coords = photos.map(p => ({ 
    lat: parseGPS(p.exif.GPSLatitude, p.exif.GPSLatitudeRef),
    lon: parseGPS(p.exif.GPSLongitude, p.exif.GPSLongitudeRef)
  }));
  const bounds = gpsBoundsWithPadding(gpsBounds(coords), 10);
  
  return (
    <View width={mapWidth} height={mapHeight} position="relative">
      {/* Background map image */}
      <Image src="map_background.png" width="100%" height="100%" />
      
      {/* Position photos based on GPS */}
      {photos.map((photo, i) => {
        const lat = parseGPS(photo.exif.GPSLatitude, photo.exif.GPSLatitudeRef);
        const lon = parseGPS(photo.exif.GPSLongitude, photo.exif.GPSLongitudeRef);
        const pos = gpsToXY(lat, lon, bounds);
        
        return (
          <View 
            position="absolute"
            left={`${pos.x * 100}%`}
            top={`${pos.y * 100}%`}
            transform="translate(-50%, -50%)"
          >
            <Image src={photo.thumbnail} width="40px" height="40px" borderRadius="20px" />
          </View>
        );
      })}
    </View>
  );
}
```

### Example: Photo Timeline with Location
```tsx
function PhotoTimeline({ photos }) {
  return (
    <View>
      {photos.map(photo => {
        const date = formatDate(photo.exif.DateTimeOriginal, "dd.mm.yyyy HH:MM");
        const location = formatGPS(
          parseGPS(photo.exif.GPSLatitude, photo.exif.GPSLatitudeRef),
          parseGPS(photo.exif.GPSLongitude, photo.exif.GPSLongitudeRef),
          "decimal"
        );
        
        return (
          <View flexDirection="row" marginBottom="10px">
            <Image src={photo.src} width="100px" height="75px" objectFit="cover" />
            <View marginLeft="10px">
              <Label fontSize="14px" fontWeight="bold">{photo.name}</Label>
              <Label fontSize="12px" color="#666">{date}</Label>
              <Label fontSize="10px" color="#999">{location}</Label>
            </View>
          </View>
        );
      })}
    </View>
  );
}
```

### Implementation Considerations

1. **GPS Data Availability**
   - Not all images have GPS data
   - Need graceful handling when GPS is missing
   - Consider `hasGPS(photo)` helper function

2. **Coordinate System**
   - Screen Y is inverted from latitude (north = higher lat, but lower Y on screen)
   - `gpsToXY` should handle this inversion

3. **Map Projection**
   - Simple linear mapping works for small areas
   - For larger areas, may need Mercator projection
   - Initial implementation: linear (good for city-scale)

4. **Performance**
   - Bounds calculation can be done once
   - Cache converted coordinates

### API Summary Table

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `formatDate` | date, format | string | Format date for display |
| `parseDate` | string | number | Parse EXIF date to timestamp |
| `getYear/Month/Day` | date | number | Extract date parts |
| `parseGPS` | coords[], ref | number | Convert EXIF GPS to decimal |
| `formatGPS` | lat, lon, format | string | Format GPS for display |
| `gpsToXY` | lat, lon, bounds | {x, y} | Map GPS to normalized coords |
| `gpsDistance` | lat1, lon1, lat2, lon2 | number | Distance in meters |
| `gpsBounds` | coords[] | GPSBounds | Calculate bounding box |
| `gpsBoundsWithPadding` | bounds, percent | GPSBounds | Add padding to bounds |

---

## Test Plan

### Existing Test Infrastructure

The project has existing test files in `gallery/pdf_writer/test/`:

| File | Purpose |
|------|---------|
| `eval_value.test.js` | Tests EvalValue type system (constructors, conversions, operations) |
| `expression_evaluator.test.js` | Tests expression evaluation (literals, operators, member access) |
| `jsx_to_evg.test.js` | Tests JSX to EVG element conversion |

**Run tests with:** `npm run test:evalvalue` (from project root)

### New Test Files to Create

#### 1. `control_flow.test.js` - If Statement & Loop Tests

```javascript
/**
 * Control Flow Statement Tests
 * Tests if statements, for loops, for...of, and for...in
 */
import { describe, it, expect } from "vitest";

describe("If Statement Evaluation", () => {
  describe("Simple If", () => {
    it("executes then-block when condition is true", () => {
      const code = `
        function test(x) {
          if (x > 5) {
            return "big";
          }
          return "small";
        }
      `;
      // Test: test(10) should return "big"
    });

    it("skips then-block when condition is false", () => {
      // Test: test(3) should return "small"
    });

    it("handles truthy string condition", () => {
      const code = `if ("hello") { return true; } return false;`;
      // Should return true
    });

    it("handles falsy empty string", () => {
      const code = `if ("") { return true; } return false;`;
      // Should return false
    });

    it("handles falsy zero", () => {
      const code = `if (0) { return true; } return false;`;
      // Should return false
    });

    it("handles falsy null", () => {
      const code = `if (null) { return true; } return false;`;
      // Should return false
    });
  });

  describe("If-Else", () => {
    it("executes else-block when condition is false", () => {
      const code = `
        if (x < 0) {
          return "negative";
        } else {
          return "non-negative";
        }
      `;
      // With x=5, should return "non-negative"
    });
  });

  describe("If-Else If-Else", () => {
    it("handles multiple conditions", () => {
      const code = `
        function grade(score) {
          if (score >= 90) {
            return "A";
          } else if (score >= 80) {
            return "B";
          } else if (score >= 70) {
            return "C";
          } else {
            return "F";
          }
        }
      `;
      // grade(95) -> "A", grade(85) -> "B", grade(75) -> "C", grade(50) -> "F"
    });

    it("stops at first matching condition", () => {
      // Verify only first matching branch executes
    });
  });

  describe("Nested If", () => {
    it("handles nested if statements", () => {
      const code = `
        if (x > 0) {
          if (x > 10) {
            return "large positive";
          }
          return "small positive";
        }
        return "non-positive";
      `;
    });
  });

  describe("If with Complex Conditions", () => {
    it("handles && condition", () => {
      const code = `if (x > 0 && x < 10) { return "in range"; }`;
    });

    it("handles || condition", () => {
      const code = `if (x < 0 || x > 100) { return "out of range"; }`;
    });

    it("handles ! condition", () => {
      const code = `if (!isEmpty) { return "has items"; }`;
    });

    it("handles comparison operators", () => {
      // Test ==, ===, !=, !==, <, >, <=, >=
    });
  });
});

describe("For Loop Evaluation", () => {
  describe("Basic For Loop", () => {
    it("iterates correct number of times", () => {
      const code = `
        let sum = 0;
        for (let i = 0; i < 5; i++) {
          sum = sum + i;
        }
        return sum;
      `;
      // Should return 0+1+2+3+4 = 10
    });

    it("handles decrementing loop", () => {
      const code = `
        let result = "";
        for (let i = 3; i > 0; i--) {
          result = result + i;
        }
        return result;
      `;
      // Should return "321"
    });

    it("handles step increment", () => {
      const code = `
        let sum = 0;
        for (let i = 0; i < 10; i += 2) {
          sum = sum + i;
        }
        return sum;
      `;
      // Should return 0+2+4+6+8 = 20
    });

    it("handles zero iterations when condition false", () => {
      const code = `
        let count = 0;
        for (let i = 10; i < 5; i++) {
          count++;
        }
        return count;
      `;
      // Should return 0
    });
  });

  describe("For Loop with Arrays", () => {
    it("builds array with push", () => {
      const code = `
        const items = [];
        for (let i = 0; i < 3; i++) {
          items.push(i * 2);
        }
        return items;
      `;
      // Should return [0, 2, 4]
    });

    it("builds array of objects", () => {
      const code = `
        const items = [];
        for (let i = 0; i < 3; i++) {
          items.push({ id: i, value: i * 10 });
        }
        return items;
      `;
      // Should return [{id:0,value:0}, {id:1,value:10}, {id:2,value:20}]
    });
  });

  describe("Nested For Loops", () => {
    it("handles nested loops", () => {
      const code = `
        const grid = [];
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            grid.push({ row: r, col: c });
          }
        }
        return grid;
      `;
      // Should return 6 items
    });
  });

  describe("Loop Variable Scope", () => {
    it("loop variable not accessible after loop", () => {
      // let i = 0; for (let i = 0; i < 3; i++) {} return i;
      // Should return 0 (outer i), not 3
    });
  });
});

describe("For...Of Loop Evaluation", () => {
  describe("Array Iteration", () => {
    it("iterates over array values", () => {
      const code = `
        const items = [10, 20, 30];
        let sum = 0;
        for (const item of items) {
          sum = sum + item;
        }
        return sum;
      `;
      // Should return 60
    });

    it("builds new array from iteration", () => {
      const code = `
        const items = [1, 2, 3];
        const doubled = [];
        for (const item of items) {
          doubled.push(item * 2);
        }
        return doubled;
      `;
      // Should return [2, 4, 6]
    });

    it("handles empty array", () => {
      const code = `
        const items = [];
        let count = 0;
        for (const item of items) {
          count++;
        }
        return count;
      `;
      // Should return 0
    });
  });

  describe("Object Array Iteration", () => {
    it("accesses object properties", () => {
      const code = `
        const items = [{ name: "a" }, { name: "b" }];
        const names = [];
        for (const item of items) {
          names.push(item.name);
        }
        return names;
      `;
      // Should return ["a", "b"]
    });
  });
});

describe("For...In Loop Evaluation", () => {
  describe("Object Key Iteration", () => {
    it("iterates over object keys", () => {
      const code = `
        const obj = { a: 1, b: 2, c: 3 };
        const keys = [];
        for (const key in obj) {
          keys.push(key);
        }
        return keys;
      `;
      // Should return ["a", "b", "c"]
    });

    it("accesses values via key", () => {
      const code = `
        const obj = { x: 10, y: 20 };
        let sum = 0;
        for (const key in obj) {
          sum = sum + obj[key];
        }
        return sum;
      `;
      // Should return 30
    });
  });
});
```

#### 2. `array_methods.test.js` - Array Mutation & Method Tests

```javascript
/**
 * Array Methods Tests
 * Tests push, filter, find, forEach, reduce, includes, etc.
 */
import { describe, it, expect } from "vitest";

describe("Array.push()", () => {
  it("adds single item to empty array", () => {
    const code = `
      const arr = [];
      arr.push(1);
      return arr;
    `;
    // Should return [1]
  });

  it("adds item to existing array", () => {
    const code = `
      const arr = [1, 2];
      arr.push(3);
      return arr;
    `;
    // Should return [1, 2, 3]
  });

  it("returns new length", () => {
    const code = `
      const arr = [1, 2];
      const len = arr.push(3);
      return len;
    `;
    // Should return 3
  });

  it("pushes object", () => {
    const code = `
      const arr = [];
      arr.push({ id: 1 });
      return arr[0].id;
    `;
    // Should return 1
  });

  it("pushes multiple items sequentially", () => {
    const code = `
      const arr = [];
      arr.push(1);
      arr.push(2);
      arr.push(3);
      return arr;
    `;
    // Should return [1, 2, 3]
  });
});

describe("Array.filter()", () => {
  it("filters numbers", () => {
    const code = `
      const nums = [1, 2, 3, 4, 5];
      const evens = nums.filter(n => n % 2 === 0);
      return evens;
    `;
    // Should return [2, 4]
  });

  it("returns empty array when nothing matches", () => {
    const code = `
      const nums = [1, 3, 5];
      const evens = nums.filter(n => n % 2 === 0);
      return evens;
    `;
    // Should return []
  });

  it("filters objects by property", () => {
    const code = `
      const items = [
        { name: "a", active: true },
        { name: "b", active: false },
        { name: "c", active: true }
      ];
      const active = items.filter(item => item.active);
      return active;
    `;
    // Should return 2 items
  });

  it("provides index to callback", () => {
    const code = `
      const items = ["a", "b", "c", "d"];
      const result = items.filter((item, i) => i > 1);
      return result;
    `;
    // Should return ["c", "d"]
  });
});

describe("Array.find()", () => {
  it("finds first matching item", () => {
    const code = `
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const found = items.find(item => item.id === 2);
      return found;
    `;
    // Should return { id: 2 }
  });

  it("returns undefined when not found", () => {
    const code = `
      const items = [1, 2, 3];
      const found = items.find(x => x > 10);
      return found;
    `;
    // Should return undefined/null
  });

  it("stops at first match", () => {
    const code = `
      const items = [{ id: 1 }, { id: 2 }, { id: 2 }];
      const found = items.find(item => item.id === 2);
      return found === items[1];
    `;
    // Should return true (same reference)
  });
});

describe("Array.findIndex()", () => {
  it("returns index of first match", () => {
    const code = `
      const items = ["a", "b", "c"];
      const idx = items.findIndex(x => x === "b");
      return idx;
    `;
    // Should return 1
  });

  it("returns -1 when not found", () => {
    const code = `
      const items = [1, 2, 3];
      const idx = items.findIndex(x => x > 10);
      return idx;
    `;
    // Should return -1
  });
});

describe("Array.includes()", () => {
  it("returns true for existing item", () => {
    const code = `
      const items = [1, 2, 3];
      return items.includes(2);
    `;
    // Should return true
  });

  it("returns false for missing item", () => {
    const code = `
      const items = [1, 2, 3];
      return items.includes(5);
    `;
    // Should return false
  });

  it("works with strings", () => {
    const code = `
      const items = ["a", "b", "c"];
      return items.includes("b");
    `;
    // Should return true
  });
});

describe("Array.indexOf()", () => {
  it("returns index of item", () => {
    const code = `
      const items = ["a", "b", "c"];
      return items.indexOf("b");
    `;
    // Should return 1
  });

  it("returns -1 for missing item", () => {
    const code = `
      const items = [1, 2, 3];
      return items.indexOf(5);
    `;
    // Should return -1
  });
});

describe("Array.join()", () => {
  it("joins with separator", () => {
    const code = `
      const items = ["a", "b", "c"];
      return items.join("-");
    `;
    // Should return "a-b-c"
  });

  it("joins with default comma", () => {
    const code = `
      const items = [1, 2, 3];
      return items.join();
    `;
    // Should return "1,2,3"
  });

  it("joins with empty string", () => {
    const code = `
      const items = ["a", "b", "c"];
      return items.join("");
    `;
    // Should return "abc"
  });
});

describe("Array.forEach()", () => {
  it("executes callback for each item", () => {
    const code = `
      const items = [1, 2, 3];
      let sum = 0;
      items.forEach(x => { sum = sum + x; });
      return sum;
    `;
    // Should return 6
  });

  it("provides index to callback", () => {
    const code = `
      const items = ["a", "b"];
      const result = [];
      items.forEach((item, i) => { result.push(i); });
      return result;
    `;
    // Should return [0, 1]
  });
});

describe("Array.reduce()", () => {
  it("sums numbers", () => {
    const code = `
      const nums = [1, 2, 3, 4];
      const sum = nums.reduce((acc, n) => acc + n, 0);
      return sum;
    `;
    // Should return 10
  });

  it("builds object from array", () => {
    const code = `
      const items = [["a", 1], ["b", 2]];
      const obj = items.reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});
      return obj;
    `;
    // Should return { a: 1, b: 2 }
  });

  it("flattens nested arrays", () => {
    const code = `
      const nested = [[1, 2], [3, 4]];
      const flat = nested.reduce((acc, arr) => acc.concat(arr), []);
      return flat;
    `;
    // Should return [1, 2, 3, 4]
  });
});

describe("Array.map() in statement context", () => {
  it("transforms array", () => {
    const code = `
      const nums = [1, 2, 3];
      const doubled = nums.map(n => n * 2);
      return doubled;
    `;
    // Should return [2, 4, 6]
  });
});

describe("Array.length", () => {
  it("returns array length", () => {
    const code = `
      const items = [1, 2, 3, 4, 5];
      return items.length;
    `;
    // Should return 5
  });

  it("returns 0 for empty array", () => {
    const code = `
      const items = [];
      return items.length;
    `;
    // Should return 0
  });
});
```

#### 3. `map_type.test.js` - Map Type Tests

```javascript
/**
 * Map Type Tests
 * Tests Map creation, get, set, has, delete, size, keys, values, entries
 */
import { describe, it, expect } from "vitest";

describe("Map Creation", () => {
  it("creates empty Map", () => {
    const code = `
      const map = new Map();
      return map.size;
    `;
    // Should return 0
  });

  it("creates Map from array of pairs", () => {
    const code = `
      const pairs = [["a", 1], ["b", 2]];
      const map = new Map(pairs);
      return map.size;
    `;
    // Should return 2
  });
});

describe("Map.set() and Map.get()", () => {
  it("sets and gets string key", () => {
    const code = `
      const map = new Map();
      map.set("key", "value");
      return map.get("key");
    `;
    // Should return "value"
  });

  it("sets and gets number key", () => {
    const code = `
      const map = new Map();
      map.set(42, "answer");
      return map.get(42);
    `;
    // Should return "answer"
  });

  it("overwrites existing key", () => {
    const code = `
      const map = new Map();
      map.set("key", "first");
      map.set("key", "second");
      return map.get("key");
    `;
    // Should return "second"
  });

  it("returns undefined for missing key", () => {
    const code = `
      const map = new Map();
      return map.get("missing");
    `;
    // Should return undefined/null
  });

  it("chains set calls", () => {
    const code = `
      const map = new Map();
      map.set("a", 1).set("b", 2).set("c", 3);
      return map.size;
    `;
    // Should return 3
  });
});

describe("Map.has()", () => {
  it("returns true for existing key", () => {
    const code = `
      const map = new Map();
      map.set("key", "value");
      return map.has("key");
    `;
    // Should return true
  });

  it("returns false for missing key", () => {
    const code = `
      const map = new Map();
      return map.has("missing");
    `;
    // Should return false
  });
});

describe("Map.delete()", () => {
  it("removes key from map", () => {
    const code = `
      const map = new Map();
      map.set("key", "value");
      map.delete("key");
      return map.has("key");
    `;
    // Should return false
  });

  it("returns true when key existed", () => {
    const code = `
      const map = new Map();
      map.set("key", "value");
      return map.delete("key");
    `;
    // Should return true
  });

  it("returns false when key missing", () => {
    const code = `
      const map = new Map();
      return map.delete("missing");
    `;
    // Should return false
  });
});

describe("Map.size", () => {
  it("tracks size correctly", () => {
    const code = `
      const map = new Map();
      map.set("a", 1);
      map.set("b", 2);
      map.set("c", 3);
      return map.size;
    `;
    // Should return 3
  });

  it("updates after delete", () => {
    const code = `
      const map = new Map();
      map.set("a", 1);
      map.set("b", 2);
      map.delete("a");
      return map.size;
    `;
    // Should return 1
  });
});

describe("Map.keys()", () => {
  it("returns array of keys", () => {
    const code = `
      const map = new Map();
      map.set("a", 1);
      map.set("b", 2);
      const keys = Array.from(map.keys());
      return keys;
    `;
    // Should return ["a", "b"]
  });
});

describe("Map.values()", () => {
  it("returns array of values", () => {
    const code = `
      const map = new Map();
      map.set("a", 1);
      map.set("b", 2);
      const values = Array.from(map.values());
      return values;
    `;
    // Should return [1, 2]
  });
});

describe("Map.entries()", () => {
  it("returns array of key-value pairs", () => {
    const code = `
      const map = new Map();
      map.set("a", 1);
      map.set("b", 2);
      const entries = Array.from(map.entries());
      return entries;
    `;
    // Should return [["a", 1], ["b", 2]]
  });
});

describe("Map iteration", () => {
  it("iterates with for...of", () => {
    const code = `
      const map = new Map();
      map.set("a", 1);
      map.set("b", 2);
      const result = [];
      for (const [k, v] of map) {
        result.push(k + "=" + v);
      }
      return result;
    `;
    // Should return ["a=1", "b=2"]
  });
});
```

#### 4. `date_time.test.js` - Date/Time API Tests

```javascript
/**
 * Date/Time Formatting Tests
 * Tests formatDate, parseDate, and date extraction functions
 */
import { describe, it, expect } from "vitest";

describe("formatDate()", () => {
  const exifDate = "2024:12:25 14:30:45";
  
  describe("Date patterns", () => {
    it("formats dd.mm.yyyy", () => {
      expect(formatDate(exifDate, "dd.mm.yyyy")).toBe("25.12.2024");
    });

    it("formats mm/dd/yyyy", () => {
      expect(formatDate(exifDate, "mm/dd/yyyy")).toBe("12/25/2024");
    });

    it("formats yyyy-mm-dd", () => {
      expect(formatDate(exifDate, "yyyy-mm-dd")).toBe("2024-12-25");
    });

    it("formats d.m.yy", () => {
      expect(formatDate(exifDate, "d.m.yy")).toBe("25.12.24");
    });
  });

  describe("Time patterns", () => {
    it("formats HH:MM:ss", () => {
      expect(formatDate(exifDate, "HH:MM:ss")).toBe("14:30:45");
    });

    it("formats hh:MM a (12-hour)", () => {
      expect(formatDate(exifDate, "hh:MM a")).toBe("02:30 pm");
    });

    it("formats H:MM (no leading zero)", () => {
      expect(formatDate("2024:12:25 09:05:00", "H:MM")).toBe("9:05");
    });
  });

  describe("Month names", () => {
    it("formats MMM (short month)", () => {
      expect(formatDate(exifDate, "MMM d, yyyy")).toBe("Dec 25, 2024");
    });

    it("formats MMMM (full month)", () => {
      expect(formatDate(exifDate, "MMMM d, yyyy")).toBe("December 25, 2024");
    });
  });

  describe("Combined patterns", () => {
    it("formats full date and time", () => {
      expect(formatDate(exifDate, "dd.mm.yyyy HH:MM")).toBe("25.12.2024 14:30");
    });
  });

  describe("Edge cases", () => {
    it("handles single digit day", () => {
      expect(formatDate("2024:01:05 10:00:00", "dd.mm.yyyy")).toBe("05.01.2024");
      expect(formatDate("2024:01:05 10:00:00", "d.m.yyyy")).toBe("5.1.2024");
    });

    it("handles timestamp input", () => {
      const ts = 1735135800000; // Some Unix timestamp
      expect(formatDate(ts, "yyyy")).toBe("2024");
    });
  });
});

describe("parseDate()", () => {
  it("parses EXIF format", () => {
    const ts = parseDate("2024:12:25 14:30:00");
    expect(typeof ts).toBe("number");
    expect(ts).toBeGreaterThan(0);
  });

  it("returns same value for equivalent dates", () => {
    const ts1 = parseDate("2024:12:25 00:00:00");
    const ts2 = parseDate("2024:12:25 00:00:00");
    expect(ts1).toBe(ts2);
  });
});

describe("Date extraction functions", () => {
  const exifDate = "2024:12:25 14:30:45";

  it("getYear returns year", () => {
    expect(getYear(exifDate)).toBe(2024);
  });

  it("getMonth returns month (1-12)", () => {
    expect(getMonth(exifDate)).toBe(12);
  });

  it("getDay returns day", () => {
    expect(getDay(exifDate)).toBe(25);
  });

  it("getHour returns hour (0-23)", () => {
    expect(getHour(exifDate)).toBe(14);
  });

  it("getMinute returns minute", () => {
    expect(getMinute(exifDate)).toBe(30);
  });
});

describe("dateDiff()", () => {
  it("calculates days between dates", () => {
    const date1 = "2024:12:25 00:00:00";
    const date2 = "2024:12:20 00:00:00";
    expect(dateDiff(date1, date2, "days")).toBe(5);
  });

  it("calculates hours between dates", () => {
    const date1 = "2024:12:25 14:00:00";
    const date2 = "2024:12:25 10:00:00";
    expect(dateDiff(date1, date2, "hours")).toBe(4);
  });
});
```

#### 5. `gps_coordinates.test.js` - GPS API Tests

```javascript
/**
 * GPS Coordinate API Tests
 * Tests GPS parsing, formatting, coordinate mapping
 */
import { describe, it, expect } from "vitest";

describe("dmsToDecimal()", () => {
  it("converts North latitude", () => {
    const result = dmsToDecimal(60, 10, 30, "N");
    expect(result).toBeCloseTo(60.175, 3);
  });

  it("converts South latitude (negative)", () => {
    const result = dmsToDecimal(60, 10, 30, "S");
    expect(result).toBeCloseTo(-60.175, 3);
  });

  it("converts East longitude", () => {
    const result = dmsToDecimal(24, 56, 15, "E");
    expect(result).toBeCloseTo(24.9375, 3);
  });

  it("converts West longitude (negative)", () => {
    const result = dmsToDecimal(24, 56, 15, "W");
    expect(result).toBeCloseTo(-24.9375, 3);
  });
});

describe("parseGPS()", () => {
  it("parses EXIF GPS array format", () => {
    const coords = [60, 10, 30.5];
    const result = parseGPS(coords, "N");
    expect(result).toBeCloseTo(60.175139, 4);
  });

  it("handles fractional minutes/seconds", () => {
    const coords = [60, 10.5, 0];
    const result = parseGPS(coords, "N");
    expect(result).toBeCloseTo(60.175, 3);
  });
});

describe("formatGPS()", () => {
  const lat = 60.175139;
  const lon = 24.937556;

  it("formats as decimal", () => {
    const result = formatGPS(lat, lon, "decimal");
    expect(result).toContain("60.175");
    expect(result).toContain("24.937");
  });

  it("formats as DMS", () => {
    const result = formatGPS(lat, lon, "dms");
    expect(result).toContain("60°");
    expect(result).toContain("N");
    expect(result).toContain("E");
  });

  it("handles negative coordinates", () => {
    const result = formatGPS(-33.8688, 151.2093, "dms");
    expect(result).toContain("S");
    expect(result).toContain("E");
  });
});

describe("gpsBounds()", () => {
  const coords = [
    { lat: 60.17, lon: 24.94 },
    { lat: 60.19, lon: 24.91 },
    { lat: 60.16, lon: 24.98 }
  ];

  it("calculates bounding box", () => {
    const bounds = gpsBounds(coords);
    expect(bounds.north).toBe(60.19);
    expect(bounds.south).toBe(60.16);
    expect(bounds.east).toBe(24.98);
    expect(bounds.west).toBe(24.91);
  });

  it("handles single coordinate", () => {
    const bounds = gpsBounds([{ lat: 60.17, lon: 24.94 }]);
    expect(bounds.north).toBe(60.17);
    expect(bounds.south).toBe(60.17);
  });
});

describe("gpsBoundsWithPadding()", () => {
  const bounds = { north: 60.2, south: 60.1, east: 25.0, west: 24.9 };

  it("adds padding", () => {
    const padded = gpsBoundsWithPadding(bounds, 10);
    expect(padded.north).toBeGreaterThan(60.2);
    expect(padded.south).toBeLessThan(60.1);
    expect(padded.east).toBeGreaterThan(25.0);
    expect(padded.west).toBeLessThan(24.9);
  });
});

describe("gpsToXY()", () => {
  const bounds = {
    north: 60.20,
    south: 60.10,
    east: 25.00,
    west: 24.90
  };

  it("maps center to (0.5, 0.5)", () => {
    const result = gpsToXY(60.15, 24.95, bounds);
    expect(result.x).toBeCloseTo(0.5, 2);
    expect(result.y).toBeCloseTo(0.5, 2);
  });

  it("maps north-west corner to (0, 0)", () => {
    const result = gpsToXY(60.20, 24.90, bounds);
    expect(result.x).toBeCloseTo(0, 2);
    expect(result.y).toBeCloseTo(0, 2);
  });

  it("maps south-east corner to (1, 1)", () => {
    const result = gpsToXY(60.10, 25.00, bounds);
    expect(result.x).toBeCloseTo(1, 2);
    expect(result.y).toBeCloseTo(1, 2);
  });

  it("handles coordinates outside bounds", () => {
    const result = gpsToXY(60.25, 25.10, bounds);
    expect(result.x).toBeGreaterThan(1);
    expect(result.y).toBeLessThan(0);
  });
});

describe("gpsDistance()", () => {
  it("calculates distance between two points", () => {
    // Helsinki to nearby point (~1km)
    const dist = gpsDistance(60.1699, 24.9384, 60.1789, 24.9384);
    expect(dist).toBeCloseTo(1000, -2); // ~1000m with 100m tolerance
  });

  it("returns 0 for same point", () => {
    const dist = gpsDistance(60.17, 24.94, 60.17, 24.94);
    expect(dist).toBe(0);
  });

  it("calculates long distances", () => {
    // Helsinki to Stockholm (~400km)
    const dist = gpsDistance(60.1699, 24.9384, 59.3293, 18.0686);
    expect(dist).toBeGreaterThan(350000);
    expect(dist).toBeLessThan(450000);
  });
});

describe("hasGPS()", () => {
  it("returns true when GPS data present", () => {
    const photo = {
      exif: {
        GPSLatitude: [60, 10, 30],
        GPSLatitudeRef: "N",
        GPSLongitude: [24, 56, 15],
        GPSLongitudeRef: "E"
      }
    };
    expect(hasGPS(photo)).toBe(true);
  });

  it("returns false when GPS data missing", () => {
    const photo = { exif: {} };
    expect(hasGPS(photo)).toBe(false);
  });

  it("returns false when partial GPS data", () => {
    const photo = {
      exif: {
        GPSLatitude: [60, 10, 30]
        // Missing other fields
      }
    };
    expect(hasGPS(photo)).toBe(false);
  });
});
```

### Test Coverage Matrix

| Feature | Unit Tests | Integration Tests | Edge Cases |
|---------|------------|-------------------|------------|
| **If Statement** | | | |
| - Simple if | ✓ | | |
| - If-else | ✓ | | |
| - If-else if-else | ✓ | | |
| - Nested if | ✓ | | |
| - Complex conditions | ✓ | | ✓ Truthy/falsy |
| **For Loop** | | | |
| - Basic for | ✓ | | |
| - Decrement | ✓ | | |
| - Step increment | ✓ | | |
| - Zero iterations | ✓ | | ✓ |
| - Nested loops | ✓ | | |
| - With array.push | ✓ | ✓ | |
| **For...of** | | | |
| - Array iteration | ✓ | | |
| - Object array | ✓ | | |
| - Empty array | ✓ | | ✓ |
| **For...in** | | | |
| - Object keys | ✓ | | |
| - Value access | ✓ | | |
| **Array.push** | | | |
| - Empty array | ✓ | | |
| - Existing array | ✓ | | |
| - Return length | ✓ | | |
| - Object items | ✓ | | |
| **Array.filter** | | | |
| - Numbers | ✓ | | |
| - Objects | ✓ | | |
| - Empty result | ✓ | | ✓ |
| **Array.find** | | | |
| - Found | ✓ | | |
| - Not found | ✓ | | ✓ |
| **Map** | | | |
| - Creation | ✓ | | |
| - set/get | ✓ | | |
| - has/delete | ✓ | | |
| - size | ✓ | | |
| - Iteration | ✓ | | |
| **Date API** | | | |
| - formatDate patterns | ✓ | | |
| - parseDate | ✓ | | |
| - Date extraction | ✓ | | |
| **GPS API** | | | |
| - Coordinate conversion | ✓ | | |
| - Formatting | ✓ | | |
| - Bounds calculation | ✓ | | |
| - gpsToXY mapping | ✓ | | ✓ Outside bounds |
| - Distance | ✓ | | |

### Running Tests

```bash
# From project root
npm run test:evalvalue

# Run specific test file
npx vitest run gallery/pdf_writer/test/control_flow.test.js

# Run with watch mode
npx vitest gallery/pdf_writer/test/

# Run with coverage
npx vitest run --coverage
```
