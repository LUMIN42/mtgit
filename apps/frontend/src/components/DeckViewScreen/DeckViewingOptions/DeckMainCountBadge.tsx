import {Badge} from "@mantine/core";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";

interface DeckMainCountBadgeProps {
  count: number;
}

export function DeckMainCountBadge() {
  const {selectedBranchContent} = useRepositoryContext();

  const count = Object.values(selectedBranchContent.Main)
    .reduce(
      (cum, cur) => {
        return cum + cur;
      }
      ,0
    );

  return (
    <Badge mt="xs" variant="outline" radius="sm">
      {count} / 100 cards
    </Badge>
  );
}

