
class myData @serialize(true) {
    def n ""
}

; Create a custom operator function
defn ForEach (g f) {
  def cnt (size g)
  def i 0
  while(i < cnt) {
    f (at g i) 
    i = i + 1
  }
}  


class foo {
 static fn main() {
   ; The main function
   ForEach ([] 1 2 3 4 5) (# print '' + _)
   ; this is the normal non-inlined version:
   ; forEach ([] 1 2 3 4 5) (# println '' + _)
 }
}

