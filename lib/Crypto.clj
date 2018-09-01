
Import "TypedArrays.clj"

systemclass RandomGenerator {
  java7 SecureRandom  ( (imp 'java.security.SecureRandom'))
  es6 RandomSource
}
systemclass KeyGenerator {
  java7 KeyGenerator  ( (imp 'javax.crypto.KeyGenerator'))
}
systemclass SecretKey {
  java7 SecretKeySpec ( (imp 'javax.crypto.spec.SecretKeySpec'))
}
systemclass Cipher {
  java7 Cipher  ( (imp 'javax.crypto.Cipher'))
}



operators {

  newRandomGenerator _:RandomGenerator () {
      templates {
          java7 ('SecureRandom.getInstance("SHA1PRNG")')
          es6 ( 'window.crypto' )
      }      
  }
  
  generate _:void ( generator:RandomGenerator buff:RUint32Array) {
    templates {
      es6 ( (e 1) '.getRandomValues(' (e 2) ')')
    }
  }

  setSeed _:void ( g:RandomGenerator str:string) {
      templates {
          java7 ((e 1) '.setSeed(' (e 2) '.getBytes());')
      }      
  }

  newKeyGenerator _:KeyGenerator () {
    templates {
      java7 ( 'KeyGenerator.getInstance("AES")')
    }
  }
  init _:void ( kg:KeyGenerator keylen:int rand:RandomGenerator) {
    templates {
      java7 ( (e 1 ) '.init(' (e 2) ', ' (e 3)');' )
    }
  }
  createAESKey _:SecretKey ( gen:KeyGenerator) {
    templates {
      java7 ('new SecretKeySpec(('(e 1)'.generateKey()).getEncoded(), "AES")')
    }
  }
  createAESKey _:SecretKey ( bytes:Bytes) {
    templates {
      java7 ('new SecretKeySpec('(e 1)', 0, 128 / 8 , "AES")')
    }
  }
  newAESCipher _:Cipher ( ) {
    templates {
      java7 ( 'Cipher.getInstance("AES")')
    }
  }
  init_decoder _:void ( c:Cipher key:SecretKey  ) {
    templates {
      java7 ( (e 1) '.init(Cipher.DECRYPT_MODE, ' (e 2) ');')
    }
  }
  init_encoder _:void ( c:Cipher key:SecretKey  ) {
    templates {
      java7 ( (e 1) '.init(Cipher.ENCRYPT_MODE, ' (e 2) ');')
    }
  }
  encode _@(throws):Bytes ( c:Cipher data:Bytes ) {
    templates {
      java7 ( (e 1) '.doFinal(' (e 2) ')')
    }
  }
  decode _@(throws):Bytes ( c:Cipher data:Bytes ) {
    templates {
      java7 ( (e 1) '.doFinal(' (e 2) ')')
    }
  }

}



