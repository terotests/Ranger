import { Print, Section, Page, View, Label } from "./evg_types";

function render() {
  return (
    <Print title="Multi-page Test" author="EVG">
      <Section pageWidth="595" pageHeight="842" margin="40px">
        <Page>
          <View width="100%" height="100%" backgroundColor="#f0f0f0">
            <Label fontSize="24px" fontWeight="bold" color="#333333">
              Page 1 - Title
            </Label>
            <Label fontSize="14px" color="#666666" marginTop="20px">
              This is the first page of a multi-page document.
            </Label>
            <Label
              fontSize="14px"
              fontWeight="bold"
              color="#2c3e50"
              marginTop="20px"
            >
              Horizontal Row (30% each)
            </Label>
            <View
              marginTop="10px"
              flexDirection="row"
              width="100%"
              backgroundColor="#eeeeee"
            >
              <View width="30%" backgroundColor="#ff6666">
                <Label fontSize="12px" color="#ffffff">
                  Box 1 (30%)
                </Label>
              </View>
              <View width="30%" backgroundColor="#66ff66">
                <Label fontSize="12px" color="#000000">
                  Box 2 (30%)
                </Label>
              </View>
              <View width="30%" backgroundColor="#6666ff">
                <Label fontSize="12px" color="#ffffff">
                  Box 3 (30%)
                </Label>
              </View>
            </View>
            <Label
              fontSize="14px"
              fontWeight="bold"
              marginTop="20px"
              color="#2c3e50"
            >
              Flex items
            </Label>
            <View
              marginTop="10px"
              flexDirection="row"
              width="100%"
              backgroundColor="#dddddd"
            >
              <View flex="1" backgroundColor="#ffaa66">
                <Label fontSize="12px">Flex 1</Label>
              </View>
              <View flex="1" backgroundColor="#66aaff">
                <Label fontSize="12px">Flex 1</Label>
              </View>
            </View>
          </View>
        </Page>

        <Page>
          <View width="100%" height="100%" backgroundColor="#e0e0e0">
            <Label fontSize="24px" fontWeight="bold" color="#333333">
              Page 2 - Content
            </Label>
            <Label fontSize="14px" color="#666666" marginTop="20px">
              This is the second page with some content.
            </Label>
            <Label
              fontSize="14px"
              fontWeight="bold"
              color="#2c3e50"
              marginTop="20px"
            >
              Fixed + Flex
            </Label>
            <View
              marginTop="10px"
              flexDirection="row"
              width="100%"
              backgroundColor="#cccccc"
            >
              <View width="100px" backgroundColor="#aa66ff">
                <Label fontSize="12px" color="#ffffff">
                  100px
                </Label>
              </View>
              <View flex="1" backgroundColor="#66ffaa">
                <Label fontSize="12px">Flex 1 (remaining)</Label>
              </View>
            </View>
          </View>
        </Page>

        <Page>
          <View width="100%" height="100%" backgroundColor="#d0d0d0">
            <Label fontSize="24px" fontWeight="bold" color="#333333">
              Page 3 - Conclusion
            </Label>
            <Label fontSize="14px" color="#666666" marginTop="20px">
              This is the third and final page.
            </Label>
            <View
              marginTop="20px"
              flexDirection="row"
              width="100%"
              backgroundColor="#eeeeee"
            >
              <View width="30%" backgroundColor="#ff6666">
                <Label fontSize="12px" color="#ffffff">
                  Red
                </Label>
              </View>
              <View width="30%" backgroundColor="#66ff66">
                <Label fontSize="12px" color="#000000">
                  Green
                </Label>
              </View>
              <View width="30%" backgroundColor="#6666ff">
                <Label fontSize="12px" color="#ffffff">
                  Blue
                </Label>
              </View>
            </View>
          </View>
        </Page>
      </Section>
    </Print>
  );
}
