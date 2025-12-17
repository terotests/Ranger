function render() {
  return (
    <View width="100%" height="100%" padding="40px">
      <span fontSize="32px" fontWeight="bold" color="#2c3e50">
        The Adventures of Little Fox
      </span>
      <span fontSize="14px" color="#7f8c8d" marginTop="8px">
        Chapter 1: A New Beginning
      </span>

      <View flexDirection="row" marginTop="30px">
        <View
          width="200px"
          height="150px"
          backgroundColor="#e0e0e0"
          borderWidth="1px"
          borderColor="#bdbdbd"
          padding="10px"
        >
          <span fontSize="12px" color="#757575">
            [Image: Little Fox in the forest]
          </span>
        </View>

        <View flex="1" marginLeft="20px">
          <span fontSize="18px" fontWeight="bold" color="#34495e">
            The Forest Awakens
          </span>
          <span
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            Once upon a time, in a magical forest far away, there lived a
            curious little fox named Rusty. Every morning, he would wake up to
            the sound of birds singing and the gentle rustling of leaves in the
            wind.
          </span>
          <span
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            Rusty loved to explore. His bright orange fur would shimmer in the
            dappled sunlight as he bounded through the undergrowth, always
            searching for new adventures and making friends along the way.
          </span>
        </View>
      </View>

      <View flexDirection="row" marginTop="30px">
        <View flex="1" marginRight="20px">
          <span fontSize="18px" fontWeight="bold" color="#34495e">
            A Mysterious Discovery
          </span>
          <span
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            One sunny afternoon, while chasing butterflies near the old oak
            tree, Rusty stumbled upon something extraordinary - a golden key
            half-buried in the soft earth beneath a mushroom.
          </span>
          <span
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            What could this key unlock? Rusty felt his heart race with
            excitement as he carefully picked it up with his paw. This was going
            to be his greatest adventure yet!
          </span>
        </View>

        <View
          width="200px"
          height="150px"
          backgroundColor="#fff3e0"
          borderWidth="1px"
          borderColor="#ffcc80"
          padding="10px"
        >
          <span fontSize="12px" color="#e65100">
            [Image: The golden key under mushroom]
          </span>
        </View>
      </View>

      <View marginTop="40px">
        <span fontSize="12px" color="#999999" textAlign="center">
          - Page 1 -
        </span>
      </View>
    </View>
  );
}
