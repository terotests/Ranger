import { View, Label } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" backgroundColor="#eeeeee" padding="20px">
      <Label fontSize="24px" color="#333333">Hello World</Label>
      <View width="100px" height="50px" backgroundColor="#ff0000" marginTop="20px">
        <Label fontSize="14px" color="#ffffff">Red Box</Label>
      </View>
    </View>
  );
}
