
class One( ) 
 {
  
  init {
  }
  companion object {
    @JvmField var instance_count : Int?  = null     /** note: unused */;
    private var __singleton_instance : One? = null
    fun __singleton() : One {
      if (__singleton_instance == null) {
        __singleton_instance = One()
      }
      return __singleton_instance!!
    }
  }
}

class App 
 {
  companion object {
    
  }
}

fun main(args : Array<String>) {
  /** unused:  val a : One  =  One.__singleton()   **/ ;
  /** unused:  val b : One  =  One.__singleton()   **/ ;
}
