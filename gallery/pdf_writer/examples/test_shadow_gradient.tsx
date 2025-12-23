import { View, Label, Image } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="30px" backgroundColor="#f5f5f5">
      <Label fontSize="28px" fontWeight="bold" color="#2c3e50">
        Shadow and Gradient Tests
      </Label>

      {/* Box Shadow Test */}
      <View marginTop="30px">
        <Label fontSize="18px" fontWeight="bold" color="#34495e">
          Box Shadow Examples
        </Label>
        
        <View flexDirection="row" marginTop="15px" gap="20px">
          {/* Simple shadow */}
          <View 
            width="120px" 
            height="80px" 
            backgroundColor="#ffffff"
            borderRadius="8px"
            shadowRadius="10px"
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowOffsetX="2px"
            shadowOffsetY="4px"
            padding="10px"
          >
            <Label fontSize="12px" color="#333">Simple Shadow</Label>
          </View>

          {/* Deeper shadow */}
          <View 
            width="120px" 
            height="80px" 
            backgroundColor="#ffffff"
            borderRadius="8px"
            shadowRadius="20px"
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowOffsetX="0px"
            shadowOffsetY="8px"
            padding="10px"
          >
            <Label fontSize="12px" color="#333">Deep Shadow</Label>
          </View>

          {/* Colored shadow */}
          <View 
            width="120px" 
            height="80px" 
            backgroundColor="#3498db"
            borderRadius="8px"
            shadowRadius="15px"
            shadowColor="rgba(52, 152, 219, 0.5)"
            shadowOffsetX="0px"
            shadowOffsetY="6px"
            padding="10px"
          >
            <Label fontSize="12px" color="#ffffff">Blue Shadow</Label>
          </View>
        </View>
      </View>

      {/* Text Shadow Test */}
      <View marginTop="40px">
        <Label fontSize="18px" fontWeight="bold" color="#34495e">
          Text Shadow Examples
        </Label>
        
        <View marginTop="15px">
          <Label 
            fontSize="24px" 
            fontWeight="bold" 
            color="#2c3e50"
            shadowRadius="2px"
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowOffsetX="2px"
            shadowOffsetY="2px"
          >
            Text with subtle shadow
          </Label>
          
          <Label 
            fontSize="24px" 
            fontWeight="bold" 
            color="#e74c3c"
            marginTop="15px"
            shadowRadius="4px"
            shadowColor="rgba(0, 0, 0, 0.5)"
            shadowOffsetX="3px"
            shadowOffsetY="3px"
          >
            Bold red with shadow
          </Label>
        </View>
      </View>

      {/* Gradient Test */}
      <View marginTop="40px">
        <Label fontSize="18px" fontWeight="bold" color="#34495e">
          Gradient Backgrounds
        </Label>
        
        <View flexDirection="row" marginTop="15px" gap="20px">
          {/* Linear gradient - horizontal */}
          <View 
            width="150px" 
            height="80px" 
            borderRadius="8px"
            background="linear-gradient(90deg, #3498db, #9b59b6)"
            padding="10px"
          >
            <Label fontSize="12px" color="#ffffff">Horizontal Gradient</Label>
          </View>

          {/* Linear gradient - vertical */}
          <View 
            width="150px" 
            height="80px" 
            borderRadius="8px"
            background="linear-gradient(180deg, #2ecc71, #27ae60)"
            padding="10px"
          >
            <Label fontSize="12px" color="#ffffff">Vertical Gradient</Label>
          </View>

          {/* Linear gradient - diagonal */}
          <View 
            width="150px" 
            height="80px" 
            borderRadius="8px"
            background="linear-gradient(45deg, #e74c3c, #f39c12)"
            padding="10px"
          >
            <Label fontSize="12px" color="#ffffff">Diagonal Gradient</Label>
          </View>
        </View>

        <View flexDirection="row" marginTop="20px" gap="20px">
          {/* Radial gradient */}
          <View 
            width="150px" 
            height="80px" 
            borderRadius="8px"
            background="radial-gradient(circle, #9b59b6, #2c3e50)"
            padding="10px"
          >
            <Label fontSize="12px" color="#ffffff">Radial Gradient</Label>
          </View>

          {/* Multi-color gradient */}
          <View 
            width="150px" 
            height="80px" 
            borderRadius="8px"
            background="linear-gradient(90deg, #e74c3c, #f39c12, #2ecc71, #3498db)"
            padding="10px"
          >
            <Label fontSize="12px" color="#ffffff">Rainbow Gradient</Label>
          </View>

          {/* Card with gradient and shadow */}
          <View 
            width="150px" 
            height="80px" 
            borderRadius="12px"
            background="linear-gradient(135deg, #667eea, #764ba2)"
            shadowRadius="15px"
            shadowColor="rgba(102, 126, 234, 0.4)"
            shadowOffsetX="0px"
            shadowOffsetY="8px"
            padding="10px"
          >
            <Label fontSize="12px" color="#ffffff" fontWeight="bold">
              Gradient + Shadow
            </Label>
          </View>
        </View>
      </View>
    </View>
  );
}
