
# Ranger kääntäjän dokumentaatiot


## Syntaksin laajennus Generics supportille

Ongelma: joissain tapauksissa variablet tarvitsevat itseensä kohdistettua metatietoa, esimerkiksi
generics  esitettään tyypillisesti muodossa
```
class myClass<T,V> { ... }
```
Samoin `new` operaattori useissa kielissä käyttää samantyyppistä meta-informaatiota kun luokka määritellään jaluodaan
```
var obj:myClass = new myClass<T,V>(...-)
```

Lisp parseri ei anna tukea yksittäisten alkoiden meta-informaatiolle itsenään, joten Rangerin
annotaatio -syntaksio on laajennetu siten, että se tukee annotaatioita referensseillä kahdessa muodossa:
- myClass@(...)
- obj:[myClass@(...)]

Ensimmäinen on referenssi-annottaatio `<CodeNode>.vref_annotation` ja jälkimmäinen `<CodeNode>.type_annotation`.

Tämän jälkeen voidaan määritellä generics luokka esimerkiksi seuraavasti:
```
(CreateClass myClass@(T V)
...
)
(def obj:myClass@(T V) (new myClass@(T V) ()))
```

Arrayn tai Mapin sisällä oleva template voidaan määritellä seuraavasti:
```
(def myArray:[myClass@(T V)])
(def myMap:[string:myClass@(T V)])
```



## Annotaatio -tuki

Ranger laajentaa Lispin syntaksiin kolme erityyppistä annotaatiota:
- expression -annotaatiot
- referenssi -annotaatiot
- type -annotaatiot

Esimerkkejä:

```
(CreateClass myClass@(T) ; <-- referenssi annotaatio
@todo("muista lisätä tuki Option tyyppisille arvoille") ; expression annotation

(PublicMethod foobar:void (myObj@(strong)) ; <-- referenssi annotaatio
(
(def classList:myClass@(T)) ; <-- @(T) on type annotaatio referenssille classList
)
)
)

```

Jokainen annotaatio on uusi S-expression tyyppiä `CodeNode` ja sijoitetaan luokan CodeNode propertyksi.

Luokassa CodeNode referenssiannotaatio sijoitetaan propertyyn `vref_annotation` tyyppiannotaatio
sijoitetaan `type_annotation` propertyyn ja expressionin annotaatiot sijoitetaan niiden avaimen
mukaisesti `props` -propertyyn.

```
(def has_vref_annotation:boolean false)
(def vref_annotation:CodeNode)

(def has_type_annotation:boolean false)
(def type_annotation:CodeNode)

; annotations or properties
(def props:[string:CodeNode])
(def prop_keys:[string])
```



## Tuki ( gitdoc *file* *text* ) -komennolle

Ohjelmakoodin sisällä voidaan luoda git-dokumentaatioon lisää entryjä komennolla

```
(gitdoc "README.md" "# Hello Git!")
```

Tämä dokumentaatio on luotu käyttäen tätä synktaksia.


