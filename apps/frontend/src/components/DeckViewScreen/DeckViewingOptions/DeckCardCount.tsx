import {Table} from "@mantine/core";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {DeckSectionName, expectedSectionCardCounts} from "@mtgit/shared";

export function DeckCardCountTable() {
  const {selectedBranchContent, repository} = useRepositoryContext();

  const expected = expectedSectionCardCounts(repository.format);

  const rows = Object.entries(expected)
    .map(([sectionName, expectedCount]: [DeckSectionName, number]) => {
      const actualCount = Object.values(selectedBranchContent[sectionName])
        .reduce(
          (cum, cur) => cum + cur,
          0
        );


      return (
        <Table.Tr key={sectionName}>
          <Table.Td>{sectionName}</Table.Td>
          <Table.Td>{actualCount} / {expectedCount}</Table.Td>
        </Table.Tr>
      );
    });

  return (
    <Table w={"fit-content"} ta={"center"} withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th colSpan={2}>Card Count</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
      </Table.Tbody>
    </Table>
  );
}