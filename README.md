
# Ranger kääntäjän dokumentaatiot

Yleisesti huomioitavaa: 
- kääntäjä on vielä työn alla ja jotkut ominaisuudet eivät vielä toimi tai toimivat vain osin
- sama koskee myös dokumentaatiota, kaikkia osia ei ole dokumentoitu tai dokumentoitu vain osin



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

(def classList:myClass@(T)) ; <-- @(T) on type annotaatio referenssille classList

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



## Kommentit

Tällä hetkelä tuettuna on vain yhden rivin kommentit. Kommentit merkitään seuraavasti:

```
  ; this is a comment
```

Jatkossa pitäisi lisätä tuki myös usean rivin kommenteille.



## Numeroarvot

```
(def i:int 0)
(def x:double 0.0)  ; <- piste vaaditaan

```

Tuettuna kahta erilaista numeroarvoa:
- int
- double

Double -literaalin tulee sisältää piste tai muu liukuluvun tunniste, jotta se tunnistetaan.

Tuettuna ovat double sekä int -arvoille negatiiviset arvot sekä double -arvoille pyritään
tunnistamaan myös exponenttimuoto. Parseri ei yritä tunnistaa virheitä double arvoissa toistaiseksi,
joten lukuarvot joissa on esimerkiksi useampia desimaalierottimia tai e -arvoja menevät läpi.



# Strings - Merkkijonot

```
(def hello:string "Hello World")
(def str:string "
  multiline string
")
```
Merkkijono alkaa " -merkillä ja päättyy samaaan merkkiin. Välissä voi olla newline ja linefeed
merkkejä. Escape charit ovat sama kuin JSON string koodauksessa, mutta newlineja ei tarvitse 
escapeta.


## Boolean

```
(def x:boolean true)
(def y:boolean false)
```
Sallittuja literaaleja ovat `true` ja `false`



## Referenssit

```
(= x 10) ; x = referenssi
user.info.firstName ; referenssi, jossa on property accessor
```
Rererenssiksi tunnistetaan mikä tahansa yhtenäinen merkkijono mikä ei ole numero, string,
S-expression, boolean tai annotaatio. 

Referenssillä voi olla N namespacea, jotka käsitetään olion property accessoreiksi, esimerkiksi `obj.name`.



## Array

```
(def myIntArray:[int]) 
(def myStringArray:[string])
(def myObjArray:[myClass]) 
```

## Map / Hash

```
(def mapFromInToInt:[int:int]) 
(def example2:[int:string])
(def myObjMap:[string:myClass]) 
(def genericsHash:[string:List@(myClass)])  ; <-- using generics

```



## Tyyppimääritys - olio, string etc

```
(def myIntArray:<typename>)

; esim 
(def str:string)
(def i:int)
(def myHash:[string:myClass])
(def myArray:[myClass])
```




## Alaviite parseriin: Syntaksin laajennus Generics supportille

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



# Peruskirjasto



# Enumeraatiot

Enumeraatiot ovat tyyppiä int
```
    (Enum Fruits:int
        (
            Banana
            Orange
            Apple
            Pineapple
        )
    )
``` 

Huom! Tällä hetkellä tyyppitarkastukset enumeroiduista tyypeistä eivät osaa tarkastaa virhellisiä
enumeroituja tyyppejä vaan konvertoivat kaikki tyyppiin `int`. Tällöin on mahdollista sijoittaa
muuttujaan jossa on tyyppiä



# Import

```
    (Import "sourcefile.ext")
``` 



## Luokan luominen

```
    (CreateClass myClass 
        (

        )
    )
``` 

## Periyttäminen

## Luokan luominen

```
    (CreateClass childClass 
        (
            (Extends (myClass))

        )
    )
``` 



## Tuki ( gitdoc *file* *text* ) -komennolle

Ohjelmakoodin sisällä voidaan luoda git-dokumentaatioon lisää entryjä komennolla

```
   (gitdoc "README.md" "# Hello Git!")
```

Tämä dokumentaatio on luotu käyttäen tätä synktaksia.


