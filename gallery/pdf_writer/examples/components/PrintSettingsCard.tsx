// PrintSettingsCard.tsx - Component that displays print settings using usePrintSettings hook
import { View, Label, usePrintSettings } from "../evg_types";

// Component that displays the current print settings
function PrintSettingsCard() {
  const settings = usePrintSettings();
  
  return (
    <View padding={16} backgroundColor="#f8fafc" borderRadius={8}>
      <Label fontSize={16} fontWeight="bold" marginBottom={12} color="#1e293b">
        Print Settings
      </Label>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Format</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{settings.format}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Dimensions</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{settings.width} × {settings.height}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Orientation</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{settings.orientation}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6}>
        <Label fontSize={11} color="#64748b">Page Count</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{settings.pageCount}</Label>
      </View>
    </View>
  );
}

export { PrintSettingsCard };
