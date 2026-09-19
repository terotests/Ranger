
Import "input.clj"

class day_four_part_two {  
  static fn is_valid_passphrase:boolean ( str:string ) {
    def word_index:[string:boolean]
    if( has str ) {
      def inp_words (strsplit str " ")
      
      def words (map inp_words {
        def letters (map (sort ( map (strsplit item "") {
          return (to_int (charcode item))
        } _:[int]) {
          return (left - right)
        }) {
          return (strfromcode item)
        } _:[string])
        return (join letters "")
      })

      def b_valid true
      words.forEach({
        if( has word_index item ) {
          b_valid = false
        }
        set word_index item true
      })
      return b_valid
    } 
    return false
  } 
  static fn main() {
    def data (new inputData)
    def lines (strsplit (data.get()) "\n")
    print "lines " + (size lines)
    def valid_cnt 0
    lines.forEach({
      if( day_four_part_two.is_valid_passphrase( (trim item) )) {
        valid_cnt = valid_cnt + 1
      }
    })
    print "valid: " + valid_cnt
  }
}