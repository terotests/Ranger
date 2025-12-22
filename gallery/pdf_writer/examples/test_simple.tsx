import { View, Label, Image } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="30px">
      <Label fontSize="32px" fontWeight="bold" color="#2c3e50" fontFamily="Amatic SC Bold">
        The Adventures of Little Fox!!
      </Label>
      <Label fontSize="14px" color="#7f8c8d" marginTop="8px" fontFamily="Josefin Slab">
        Chapter 1: A New Beginning
      </Label>

      <View flexDirection="row" marginTop="30px">
        <Image
          src="../assets/images/Canon_40D_scaled.jpg"
          width="200px"
          height="150px"
          alt="Canon 40D test image"
        />

        <View flex="1" marginLeft="20px">
          <Label fontSize="18px" fontWeight="bold" color="#34495e" fontFamily="Gloria Hallelujah">
            The Forest Awakens
          </Label>
          <Label
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
            fontFamily="Alike Angular"
          >
            Once upon a time, in a magical forest far away, there lived a
            curious little fox named Rusty. Every morning, he would wake up to
            the sound of birds singing and the gentle rustling of leaves in the
            wind.
          </Label>
          <Label
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            Rusty loved to explore. His bright orange fur would shimmer in the
            dappled sunlight as he bounded through the undergrowth, always
            searching for new adventures and making friends along the way.
          </Label>
        </View>
      </View>

      <View flexDirection="row" marginTop="30px">
        <View flex="1" marginRight="20px">
          <Label fontSize="18px" fontWeight="bold" color="#34495e">
            A Mysterious Discovery
          </Label>

          <Label
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            One sunny afternoon, while chasing butterflies near the old oak
            tree, Rusty stumbled upon something extraordinary - a golden key
            half-buried in the soft earth beneath a mushroom.
          </Label>
          <Label
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            What could this key unlock? Rusty felt his heart race with
            excitement as he carefully picked it up with his paw. This was going
            to be his greatest adventure yet!
          </Label>
        </View>

        <View
          width="200px"
          height="150px"
          backgroundColor="#fff3e0"
          borderWidth="1px"
          borderColor="#ffcc80"
          padding="10px"
        >
          <Label fontSize="12px" color="#e65100">
            [Image: The golden key under mushroom]
          </Label>
        </View>
      </View>

      <View marginTop="40px">
        <Label fontSize="12px" color="#999999" textAlign="center">
          - Page 1 -
        </Label>
      </View>
    </View>
  );
}
