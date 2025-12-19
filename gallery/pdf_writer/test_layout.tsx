import { View, Label } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="30px">
      <Label fontSize="24px" fontWeight="bold" color="#2c3e50">
        Layout Test - Horizontal Row
      </Label>

      {/* Test 1: Simple row with percentage widths */}
      <View
        marginTop="20px"
        flexDirection="row"
        width="100%"
        backgroundColor="#eeeeee"
      >
        <View width="30%" backgroundColor="#ff6666">
          <Label fontSize="14px" color="#ffffff">
            Box 1 (30%)
          </Label>
        </View>
        <View width="30%" backgroundColor="#66ff66">
          <Label fontSize="14px" color="#000000">
            Box 2 (30%)
          </Label>
        </View>
        <View width="30%" backgroundColor="#6666ff">
          <Label fontSize="14px" color="#ffffff">
            Box 3 (30%)
          </Label>
        </View>
      </View>

      {/* Test 2: Row with flex */}
      <Label fontSize="18px" fontWeight="bold" marginTop="30px" color="#2c3e50">
        Test 2: Flex items
      </Label>
      <View
        marginTop="10px"
        flexDirection="row"
        width="100%"
        backgroundColor="#dddddd"
      >
        <View flex="1" backgroundColor="#ffaa66">
          <Label fontSize="14px">Flex 1</Label>
        </View>
        <View flex="1" backgroundColor="#66aaff">
          <Label fontSize="14px">Flex 1</Label>
        </View>
      </View>

      {/* Test 3: Fixed width + flex */}
      <Label fontSize="18px" fontWeight="bold" marginTop="30px" color="#2c3e50">
        Test 3: Fixed + Flex
      </Label>
      <View
        marginTop="10px"
        flexDirection="row"
        width="100%"
        backgroundColor="#cccccc"
      >
        <View width="100px" backgroundColor="#aa66ff">
          <Label fontSize="14px" color="#ffffff">
            100px
          </Label>
        </View>
        <View flex="1" backgroundColor="#66ffaa">
          <Label fontSize="14px">Flex 1 (remaining)</Label>
        </View>
      </View>
    </View>
  );
}
