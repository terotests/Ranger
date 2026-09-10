# A document with diagrams in it

Mermaid is how a diagram travels through a README. Here it is drawn on the
page rather than described.

```mermaid
flowchart LR
  A[Write] --> B{Render?}
  B -->|yes| C[Print]
  B -->|no| D[Edit]
  D --> A
```

The same reader handles other dialects. A sequence diagram:

```mermaid
sequenceDiagram
  participant Reader
  participant MdBlock
  participant MdLayout
  Reader->>MdBlock: text
  MdBlock->>MdLayout: a tree
  MdLayout-->>Reader: boxes
```

And a class diagram, drawn in UML notation:

```mermaid
classDiagram
  class MdNode {
    +string kind
    +string literal
    +add(child)
  }
  class MdLayout {
    +layoutPaged(doc)
  }
  MdNode <|-- MdLayout
```

A fence that is not a diagram stays code:

```js
const x = 1;
```

That is the whole of it.
