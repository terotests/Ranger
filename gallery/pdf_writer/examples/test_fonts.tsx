import { View, Label } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="40px">
      {/* Title in Cinzel - elegant serif font */}
      <Label fontSize="36px" fontFamily="Cinzel" color="#1a1a2e">
        Font Showcase
      </Label>
      <Label
        fontSize="14px"
        fontFamily="Open Sans"
        color="#666666"
        marginTop="8px"
      >
        Demonstrating different TrueType fonts embedded in PDF
      </Label>

      {/* Divider */}
      <View marginTop="30px" height="2px" backgroundColor="#e0e0e0" />

      {/* Open Sans section */}
      <View marginTop="30px">
        <Label
          fontSize="20px"
          fontFamily="Open Sans"
          fontWeight="bold"
          color="#2c3e50"
        >
          Open Sans (Default)
        </Label>
        <Label
          fontSize="14px"
          fontFamily="Open Sans"
          color="#444444"
          marginTop="10px"
          lineHeight="1.6"
        >
          Open Sans is a humanist sans-serif typeface designed by Steve
          Matteson. It features open forms and a neutral, yet friendly
          appearance. The quick brown fox jumps over the lazy dog.
        </Label>
      </View>

      {/* Cinzel section */}
      <View marginTop="25px">
        <Label fontSize="20px" fontFamily="Cinzel" color="#2c3e50">
          Cinzel
        </Label>
        <Label
          fontSize="14px"
          fontFamily="Cinzel"
          color="#444444"
          marginTop="10px"
          lineHeight="1.6"
        >
          Cinzel is a typeface inspired by first century Roman inscriptions. An
          elegant display font with classical proportions. The quick brown fox
          jumps over the lazy dog.
        </Label>
      </View>

      {/* Josefin Sans section */}
      <View marginTop="25px">
        <Label
          fontSize="20px"
          fontFamily="Josefin Sans"
          fontWeight="bold"
          color="#2c3e50"
        >
          Josefin Sans
        </Label>
        <Label
          fontSize="14px"
          fontFamily="Josefin Sans"
          color="#444444"
          marginTop="10px"
          lineHeight="1.6"
        >
          Josefin Sans is an elegant, geometric, vintage typeface. It has a
          distinctive look with balanced, rounded letterforms. The quick brown
          fox jumps over the lazy dog.
        </Label>
      </View>

      {/* Great Vibes section */}
      <View marginTop="25px">
        <Label fontSize="24px" fontFamily="Great Vibes" color="#2c3e50">
          Great Vibes
        </Label>
        <Label
          fontSize="18px"
          fontFamily="Great Vibes"
          color="#444444"
          marginTop="10px"
          lineHeight="1.8"
        >
          Great Vibes is a beautifully flowing script font. Perfect for elegant
          invitations and decorative text. The quick brown fox jumps over the
          lazy dog.
        </Label>
      </View>

      {/* Noto Sans section */}
      <View marginTop="25px">
        <Label
          fontSize="20px"
          fontFamily="Noto Sans"
          fontWeight="bold"
          color="#2c3e50"
        >
          Noto Sans
        </Label>
        <Label
          fontSize="14px"
          fontFamily="Noto Sans"
          color="#444444"
          marginTop="10px"
          lineHeight="1.6"
        >
          Noto Sans aims to support all languages with a harmonious look. Clean
          and highly legible across different sizes. The quick brown fox jumps
          over the lazy dog.
        </Label>
      </View>

      {/* Helvetica section */}
      <View marginTop="25px">
        <Label fontSize="20px" fontFamily="Helvetica" color="#2c3e50">
          Helvetica
        </Label>
        <Label
          fontSize="14px"
          fontFamily="Helvetica"
          color="#444444"
          marginTop="10px"
          lineHeight="1.6"
        >
          Helvetica is one of the most widely used sans-serif typefaces. Known
          for its clarity and neutral design. The quick brown fox jumps over the
          lazy dog.
        </Label>
      </View>

      {/* Mixed fonts example */}
      <View
        marginTop="30px"
        padding="20px"
        backgroundColor="#f5f5f5"
        borderWidth="1px"
        borderColor="#ddd"
      >
        <Label fontSize="18px" fontFamily="Cinzel" color="#1a1a2e">
          Mixed Font Example
        </Label>
        <Label
          fontSize="14px"
          fontFamily="Open Sans"
          color="#555555"
          marginTop="12px"
        >
          This paragraph uses Open Sans for body text, while the heading above
          uses Cinzel. Mixing fonts creates visual hierarchy and interest in
          your documents.
        </Label>
      </View>

      {/* Footer */}
      <View marginTop="40px">
        <Label
          fontSize="12px"
          fontFamily="Open Sans"
          color="#999999"
          textAlign="center"
        >
          Generated with EVG PDF Tool - TrueType Font Embedding Demo
        </Label>
      </View>
    </View>
  );
}
