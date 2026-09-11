# Four notations, one document

A markdown document should not care which notation a diagram was written in.
These four fences are read by RangerFlow's own readers and land on the page
as geometry — the same vector paths and text runs the prose is made of.

## PlantUML

```plantuml
@startuml
package "tilaukset" {
  abstract class Tilaus {
    +id: int
    #luotu: Date
    {abstract} +summa(): Raha
  }
  class Verkkotilaus
  class Rivi {
    +tuote: string
    +kpl: int
  }
}
package "laskutus" {
  interface Maksettava {
    +veloita(summa: Raha): Kuitti
  }
}
class Asiakas
Tilaus <|-- Verkkotilaus
Tilaus *-- "1..*" Rivi : sisältää
Asiakas "1" o-- "monta" Tilaus : tekee
Tilaus ..|> Maksettava
@enduml
```

## Graphviz

```dot
digraph tilaus {
  rankdir=LR;
  node [shape=box];
  saapuu -> tarkista;
  tarkista -> laskuta [label="ok"];
  tarkista -> hylkaa [label="ei"];
  laskuta -> arkistoi;
}
```

## Mermaid

```mermaid
flowchart LR
  A[Kirjoita] --> B{Renderöi?}
  B -->|kyllä| C[Tulosta]
  B -->|ei| A
```

## D2

```d2
direction: right
varasto: Varasto {
  hylly
  keraily
}
lahetys: Lähetys
varasto.keraily -> lahetys: paketti
lahetys -> asiakas: toimitus
```

The same document, four readers, one page.
