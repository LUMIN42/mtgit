import {Center, Group, Loader, Text} from "@mantine/core";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {DeckSectionName, expectedSectionCardCounts} from "@mtgit/shared";
import PriceOverviewBadge from "./PriceOverviewBadge.tsx";

export function DeckOverview() {
  const {selectedBranchContent, repository} = useRepositoryContext();

  const expected = expectedSectionCardCounts(repository.format);

  console.log("selected branch content:", selectedBranchContent);

  if (!selectedBranchContent) {
    return <Center><Loader/></Center>;
  }

  return (
    <Group
      gap="xl"
      // wrap="nowrap"
      justify={"space-evenly"}
    >
      {Object.entries(expected).map(([sectionName, expectedCount]: [DeckSectionName, number]) => {
        const actualCount = Object.values(selectedBranchContent[sectionName] ?? {})
          .reduce((sum, count) => sum + count, 0);

        return (
          <Group
            key={sectionName}
            gap="xs"
            wrap="nowrap"
          >
            <Text fw={600}>
              {sectionName}:
            </Text>
            <Text textWrap={"nowrap"}>
              {actualCount} / {expectedCount}
            </Text>
          </Group>
        );
      })}

      <PriceOverviewBadge/>

    </Group>
  );
}