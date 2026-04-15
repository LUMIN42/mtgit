import {AspectRatio} from "@mantine/core";

interface DeckPreviewImageProps {
  visible: boolean;
  imageUrl: string | null;
}

export function DeckPreviewImage({visible, imageUrl}: DeckPreviewImageProps) {
  if (!visible) {
    return null;
  }

  return (
    <AspectRatio ratio={63 / 88} w={"60%"} mx={"auto"}>
      <img src={imageUrl ?? "1.jpg"} alt="card preview" style={{objectFit: "cover"}}/>
    </AspectRatio>
  );
}

