// ImageDataCard.tsx - Component that displays image metadata using useImage hook
import { View, Label, useImage } from "../evg_types";

interface ImageDataCardProps {
  src: string;
}

// Component that displays image metadata for a given source
function ImageDataCard(props: ImageDataCardProps) {
  const img = useImage(props.src);
  
  return (
    <View padding={16} backgroundColor="#fef3c7" borderRadius={8}>
      <Label fontSize={16} fontWeight="bold" marginBottom={12} color="#92400e">
        Image Metadata
      </Label>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Dimensions</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{`${img.width} × ${img.height}`}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Color Space</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.colorSpace}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Bits per Component</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{`${img.bitsPerComponent}`}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">EXIF Orientation</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{`${img.orientation}`}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Date Taken</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.createdAt || "N/A"}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6} marginBottom={6}>
        <Label fontSize={11} color="#64748b">Camera</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.camera || "N/A"}</Label>
      </View>
      
      <View padding={10} backgroundColor="#ffffff" borderRadius={6}>
        <Label fontSize={11} color="#64748b">GPS Location</Label>
        <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.gps ? img.gps.latitude + ", " + img.gps.longitude : "N/A"}</Label>
      </View>
    </View>
  );
}

export { ImageDataCard };
