
# Ranger kääntäjän dokumentaatio

Yleisesti huomioitavaa: 
- kääntäjä on vielä työn alla ja jotkut ominaisuudet eivät vielä toimi tai toimivat vain osin
- sama koskee myös dokumentaatiota, kaikkia osia ei ole dokumentoitu tai dokumentoitu vain osin

## Kääntäjän asentaminen

```
 npm install -g ranger-compiler
```

## Hello World

Create file `Hello.ran`
```
gitdoc "README.md" "
# The Hello World -project
"    
    
class Hello {
    fn hello:void () {
        print "Hello World"
    }
}

```
Then compile it using `ranger-compiler` using command line

```
ranger-compiler Hello.ran es5 projectdir/hello none
```

Then go to directory `projectdir/hello` and see the compiled result







# Parserin tukema syntaksi

Parseri parsii lisp -tyyppisiä S-expressioneita joillakin syntaksilaajennuksilla, joita ovat mm. tuki
annotaatioille sekä tyyppimäärityksille

## Tyyppimääritykset

Tokeneilla voi olla tyyppimäärityksiä, jotka tulevat referenssin AST puun ominaisuudeksi
Esimerkki yksittäisestä tokenista on vaikkapa variablen määritys `def` tai sen määrittelemä
variable `x`

```
(def x)
```
Jos halutaan määritellä variable tyyppiä `double` se voidaan tehdä laajennetun tyyppi -syntaksin avulla
```
(def x:double)
```
Syntaksi tukee myös Array ja Map tyyppisiä määrityksiä

```
(def arr:[double])         ; array of doubles
(def arr:[string:string])  ; map string -> string
(def objMap:[string:SomeClass]) ; map string -> object

```


## Annotaatiot

Annotaatiot ovat kääntäjälle tarkoitettua metatietoa, jota käytetään esimerkiksi paremetrien
vahvuuden (strong, weak) tai genericsien määrittelemiseen. Annotaatioiden perusidea on mahdollistaa
syntaksin laajentaminen tulevaisuudessa.

Ranger laajentaa Lispin syntaksiin kolme erityyppistä annotaatiota:
 - expression -annotaatiot
 - referenssi -annotaatiot
 - type -annotaatiot

Expression annotaatio sijoitetaan S-expressionin sisällä erillisenä elementtinä
```
(
    @todo("muista lisätä tuki Option tyyppisille arvoille") ; expression annotation
)
```

Referenssiin (tai tokeniin) liittyvä annotaatio kirjoitetaan suoraan kiinni tokeniin johon se liittyy
```
(CreateC)lass myClass@(T) ; <-- referenssi annotaatio
(PublicMethod foobar:void (myObj@(strong optional)) ; <-- referenssi annotaatio 
```

Tyyppi-annotaatio tulee osaksi Array tai Map tyyppiä.

```
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



## Strings - Merkkijonot

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



# Komentojen synktasi

## muuttujien määrittely

```
(def x:double)
(def len:int 10)
```

## heikot ja vahvat referenssit

Joskus referenssi olioon on määriteltävä heikoksi, jotta sitä ei vapauteta kun funktiosta poistutaan
tai kun kyseinen olio itsessään vapautetaan.

```
(def obj:myClass @weak(true))
```

## muuttujien sijoittaminen

```
(def x:double 20)
(def y:double 10)
(= x y )          ; x is now 10
(= x (+ x 5))     ; x is now 15
```

## komentojen lisp -tyyppinen syntaksi

Komennot noudattavat lisp -tyyppistä syntaksia:

```
(+ 10 5)     ; 15
(== 5 12)    ; false
(> 7 3)      ; true
(&& (== 4 4) true)  ; true
(&& (== 4 4) false) ; false

(call myObj hello ()) ; calls object myObj funtion hello
```




## Enumeraatiot

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



## Import

Lähdekoodin uudelleenkäyttäminen ja importointi, jossa haetaan tiedoston luokkamääritykset:

```
    (Import "sourcefile.ext")
``` 



## Luokan luominen

```
    (CreateClass myClass 
        (
            (PublicMethod hello:void ()
                (
                    (print "ello World!")
                )
            )
        )
    )
    (def obj:myClass (new myClass ()))
    (call obj hello ())
``` 

## Metodin määrittely luominen

```
    (PublicMethod hello:string (arg1:int arg2:string)
``` 

```
    (StaticMethod hello:string (arg1:int arg2:string)
``` 


```
    (CreateClass myClass 
        (
            (PublicMethod hello:string (arg1:int arg2:string)
                (
                )
            )
        )
    )
``` 


## Periyttäminen

Periyttäminen voidaan tehdä `Extends` komennolla luokan bodyn sisällä.

```
    (CreateClass childClass 
        (
            (Extends (myClass))
        )
    )

    ; usage:
    (def obj:childClass (new childClass ()))
    (call obj hello ())
    
``` 

## Heikot ja vanhvat paluuarvot

Tällä hetkellä pohdinnassa syntaksi:
```
    (PublicMethod hello:myClass @strong(true) (arg1:int arg2:string)
``` 

Toinen vaihtoehto:
```
    (PublicMethod hello@(weak):myClass  (arg1:int arg2:string)
``` 

## Heikot ja vanhvat argumentit

Tällä hetkellä pohdinnassa syntaksi:
```
    (PublicMethod hello:myClass (arg1@(strong):someClass)
``` 
Missä `arg1` on vahva argumentti ja siirtää variable omistuksen funktioon, minkä jälkeen
kutsuja käsittelee annettua parametria weak -referenssinä ja funktio joka vastaanotti
parametrin käsittelee argumenttia vahvana referenssinä.



## Luokan rakentaja

```
    (CreateClass myClass 
        (
            (Constructor (str:string)
                (
                    (print (+ "Hello !" str))
                )
            )
        )
    )
``` 

Käyttö: `(new myClass ("World"))`



## new -operaattori

```
    (def obj:myClass (new myClass ("World")))
``` 



## Luokan funktioiden kutsuminen

Oliota, johon on olemassa referenssi voidaan kutsua `call` operaattorilla

```
  (call obj hello ())
```

Luokan metodit voivat kutsua oman luokan metodeja joko

```
  ; käyttäen suoraan this referenssiä
  (call this say ("Hello World")) 

  ; tai suoraan funktion nimellä
  (say "Hello World")

```

Esimerkki:

```
    (CreateClass myClass 
        (
            (PublicMethod hello:void ()
                (
                    ; call function say
                    (say "Hello World!")
                )
            )
            (PublicMethod say:void (msg:string)
                (
                    (print msg)
                )
            )

        )
    )
``` 



## join

Joins array of strings into a single string
```
  (def list:[string] (strsplit "list,of,items"))
  (def str:string (join list ":")) ; list:of:items
```



## strsplit

Spits string into array of strings
```
  (def list:[string] (strsplit "list,of,items"))
  (def str:string (join list ":")) ; list:of:items
```



## trim

Remove whitespace around the string
```
  (def str:string (trim "  abba   ")) ; "abba"
```



## strlen

Return length of a  string
```
  (def len:int (strlen "abcdef")) ; 6
```



## substring

Return copy of the string 
```
  (def s:string (substring "abcdef" 2 5)) ; "cde"
```



## charcode

Return ASCII code of a character
```
  (def code:int (charcode "A")) ; <ASCII code of A>
```



## strfromcode

```
  (def str:string (strfromcode 65)) ; A
```



## charAt
Get ASCII code of character at position
```
  (def code:int (charAt "DAA" 1)) ; 65
```



## str2int
Convert string value to integer
```
  (def value:int (str2int "456" )) ; 456
```



## str2double
Convert string value to double
```
  (def value:double (str2double "3.14" )) ; 3.14
```



## double2str
Convert double value to string
```
  (def value:string (double2str 3.14 )) ; "3.14"
```



## array_length
Return the length of array as integer
```
  (def value:int (array_length someArray )) ; length of the someArray
```



## print
Prints some output to the console
```
  (print "This is fine.")
```



## Tuki ( gitdoc *file* *text* ) -komennolle

Ohjelmakoodin sisällä voidaan luoda git-dokumentaatioon lisää entryjä komennolla

```
   (gitdoc "README.md" "# Hello Git!")
```

Tämä dokumentaatio on luotu käyttäen tätä synktaksia.


## continue
for, while loop continue statement
```
  (continue _)
```



## break
for, while loop break statement
```
  (break _)
```



## throw

Throws exception
```
  (throw "Something went wrong")
```

Virheiden käsittelijä on vielä työn alla. Koska tavoite on pystyä kääntämään myös Golang kielelle
missä ei ole normaalia try... catch... käsittelijää ainakin toistaiseksi virhekäsittelijä on 
funktiokohtainen annotaatio `@onError()` jonka sisällä oleva expression sisältää komennot jotka
ajetaan virheen tapahtumisen jälkeen.

```
@onError(
    (print "Got exception.")
)
```

Virhekäsittelijästä puuttuu vielä kyky lähettää eri tyyppisiä virheilmoituksia esimerkiksi 
enumeroituina Exceptioneina tai erillistettyinä Exception -luokkina. Lisäksi on pohdittava
miten virhekäsittelijä suhtautuu paikallisiin variableihin, onko niiden käyttäminen 
sallittua ja missä määrin.




## return

Return from function with or without value
```
  (return _)           ; <- nothing to return
  (return value)       ; <- has return value
```



## remove_index

Removes item from array without returning it
```
  (remove_index someArray 10)     
```



## indexOf

Get index of item in array or -1 if not found
```
  (def idx:index (indexOf someArray item))     
```



## array_extract

Gets and removes item from array at some index 
```
  (def item:ItemType (array_extract someArray 0))     
```



## removeLast 

Removes the last element from the array without returning it
```
  (removeLast someArray )     
```



## push 

Append item as last element of array
```
  (push someArray item)     
```



## itemAt 

Returns item from array without removing it
```
  (def item:itemType (itemAt someArray 3)) ; get item from index 3     
```



## has 

Returns true if map has a key
```
  (has someMap someKey) ; returns true if map has defined key "someKey"
```



## set 

Set a map key to some value
```
  (def someMap:[string:string])
  (set someMap "foo" "bar") ; map has now key-value pair foo:bar
```



## get 

Get a value associated to a key 
```
  (def someMap:[string:string])
  (set someMap "foo" "bar") ; map has now key-value pair foo:bar

  (def value:string (get someMap "foo")) ; "bar"
```



## null? 

Returns true if value is null
```
  (null? value)
```



## !null? 

Returns true if value is not null
```
  (!null? value)
```



## Math library functions

Following standard math library functions are defined from double values
```
  (sin value)
  (cos value)
  (tan value)
  (atan value)
  (log value)
  (abs value)
  (acos value)
  (asin value)
  (floor value)
  (round value)
  (sqrt value)
```



## Boolean comparision operators

Following standard boolean operators are defined
```
  (== value1 value2)  ; equal values
  (< value1 value2)   ; less than
  (> value1 value2)   ; greater than
  (!= value1 value2)  ; not equal
  (>= value1 value2)  ; greater or equal
  (<= value1 value2)  ; less or equal
```
The result value of comparision operator is boolean



## Boolean logic operators

Following standard boolean operators are defined for boolean values
```
  (&& value1 value2 value3 ...)   ; logical AND
  (|| value1 value2 value3 ...)   ; logical OR
```
The result value of comparision operator is boolean



## + add operator

Addition is defined for numbers and strings. If the first parameter is string then
numbers are atomatically converted to string. If first parameter is numeric then
rest of the parameters are assumed to be numeric too.

```
(def age:int 26)
(= x (+ x 1))
(print (+ "Your age is now " age))
```

HUOM! Tyyppitarkastukset numeroille eivät vielä noudata tätä speksiä. Tarkastettava että ei
tule JS tyyppisiä outouksia konversiosta.



## Mathematical operators

```
(* 10 20) ; 200
(/ 9 2)   ; 4.5
(- 50 10) ; 40
(% 5 2)   ; 1
```



## if

```
(if condition
    (
        ; then statements
    )
    (
        ; else statements
    )
)
```



## for

```
(for someArray item:itemType i
    (
        ; loop expressions
    )
)
```



## while

```
(while condition
    (
        ; loop expressions
    )
)
```



## switch case

Switch-case statement can multiple case statements having one or more matching arguments.

```
(switch condition
    (case value
        (
            ; case expressions
        )
    )
    (case (value1 value2 value2) ; multiple values
        (

        )
    )
    (default (
        ; default expressions
    ))
)
```



# IO operators


## file_read

TODO: pohdittava pitäisikö olla verbi `read_file`

```
(def contents:string (file_read pathName fileName))
```



## file_write

TODO: pohdittava pitäisikö olla verbi `write_file`

```
(file_write pathName fileName contentStr)
```



## dir_exists

```
(if (dir_exists pathName)
    (
        ; do something
    )
)
```



## file_exists

```
(if (file_exists pathName fileName)
    (
        ; do something
    )
)
```



## dir_create

```
(dir_create pathName)
```



# Environment functions

## shell_arg
```
(def value:string (shell_arg 0)) ; first shell argument as string
```




## shell_arg_cnt
```
(def cnt:int (shell_arg_cnt _)) ; number of given shell arguments
```


