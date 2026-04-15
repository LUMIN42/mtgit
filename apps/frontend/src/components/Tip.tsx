import {Badge, HoverCard, Text} from "@mantine/core";

export function Tip({children}: { children: React.ReactNode }) {
  return <HoverCard shadow="md" position={"top"}>
    <HoverCard.Target>
      <Badge
        variant="gradient"
        size={"xs"}
      >
        ?
      </Badge>
    </HoverCard.Target>

    <HoverCard.Dropdown>
      <Text>
        {children}
      </Text>
    </HoverCard.Dropdown>
  </HoverCard>
}