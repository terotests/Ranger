
ColorConsolen dependencynä on chalk eli kääntäjä ei oo ihan standalone.
require('chalk')

--> tämä on poistettu nyt

class CLIConsole  on aika geneerinen, se voisi olla ihan oma Ranger kirjastonsa, jota ei käytetä suoraan kääntäjän "ytimestä" tai siitä voisi erottaa oman CLI
kirjastonsa.


-- alla olevat ei pidä paikkaansa, esim. tää koodi kääntyy ihan hyvin

class HelloWorld {
    fn contains:string () {
       return "Hello World my friend"
    }

    sfn main() {
      def c (new HelloWorld())
      print c.contains()
    }
}


Why does the compiler say that a class does not have a method that I wrote?
The compiler resolves some method names in another place. A class can define one of these names, and the class compiles. Each call to that method then fails with Class X does not have method ….

Do not use as a method name	A name that works
contains	hasSub
startsWith	beginsWith
endsWith	finishesWith
trim	trimWs
first	lowest
last	highest
remove	removeNode
insert	insertNode



--- luokkiin tulee tarpeettomia metodeja, esim. konstructori vaikka se on tyhjä

class HelloWorld {
    fn contains:string () {
       return "Hello World my friend"
    }
}

class HelloWorld  {
  constructor() {
  }
  contains () {
    return "Hello World my friend";
  };
}

--- havainto, dokumentointi enginestä ei ole paljoa...


    fn whole:VlDataRow (field:string value:int) {
        obj.setMember(field (VlJson.intValue(value)))
        return this
    } doc {
        public
        category "Data"
        description "Puts a whole number in one column of this row.

A count is an integer and prints as one: 12, not 12.0. Use this rather than
`num` wherever the value counts things, or the axis labels will say so."
        param field "The column name."
        param value "The value."
        returns "This row, so columns chain."
        see num
    }

