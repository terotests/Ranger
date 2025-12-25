// Simple UTF-8 test with Scandinavian characters

import { View, Label } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="20px" backgroundColor="#ffffff">
      <Label fontSize="32px" color="#333333">Kivoja hetkiä</Label>
      <Label fontSize="24px" color="#666666" marginTop="20px">Äiti ja Isä</Label>
      <Label fontSize="24px" color="#666666" marginTop="10px">Löytöretki</Label>
      <Label fontSize="24px" color="#666666" marginTop="10px">Ylläs</Label>
      <Label fontSize="24px" color="#666666" marginTop="10px">Åland</Label>
    </View>
  );
}
