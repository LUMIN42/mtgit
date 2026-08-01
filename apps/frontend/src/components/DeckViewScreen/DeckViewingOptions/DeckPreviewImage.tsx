import {AspectRatio, Center, Paper, Text} from "@mantine/core";

interface DeckPreviewImageProps {
  visible: boolean;
  imageUrl: string | null;
}

export function DeckPreviewImage({visible, imageUrl}: DeckPreviewImageProps) {
  if (!visible) {
    return null;
  }

  return (
    <AspectRatio ratio={63 / 88} w={"70%"} mx={"auto"}>
      {
        imageUrl ?
          <img src={imageUrl} alt="card preview" style={{objectFit: "cover"}}/> :
          <Paper withBorder w={"100%"} h={"100%"}>
            <Center h={"100%"}>
              <Text>
                Hover a Card for Preview
              </Text>
            </Center>
          </Paper>
      }

    </AspectRatio>
  );
}

