import {Badge} from "@mantine/core";

interface DeckMainCountBadgeProps {
  count: number;
}

export function DeckMainCountBadge({count}: DeckMainCountBadgeProps) {
  return (
    <Badge mt="xs" variant="outline" radius="sm">
      {count} / 100 cards
    </Badge>
  );
}

