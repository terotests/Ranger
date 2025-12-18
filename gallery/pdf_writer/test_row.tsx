import { View, Label } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="30px">
      <Label fontSize="24px" fontWeight="bold" color="#2c3e50">
        Simple Row Test
      </Label>

      <View marginTop="20px" flexDirection="row" width="100%" backgroundColor="#eeeeee">
        <View width="30%" backgroundColor="#ff6666">
          <Label fontSize="14px" color="#ffffff">Box 1</Label>
        </View>
        <View width="30%" backgroundColor="#66ff66">
          <Label fontSize="14px" color="#000000">Box 2</Label>
        </View>
        <View width="30%" backgroundColor="#6666ff">
          <Label fontSize="14px" color="#ffffff">Box 3</Label>
        </View>
      </View>
    </View>
  );
}
