
Import "input.clj"

class day_four {  
  static fn is_valid_passphrase:boolean ( str:string ) {
    def word_index:[string:boolean]
    if( has str ) {
      def words (strsplit str " ")
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
      if( day_four.is_valid_passphrase( (trim item) )) {
        valid_cnt = valid_cnt + 1
      }
    })
    print "valid: " + valid_cnt
  }
}