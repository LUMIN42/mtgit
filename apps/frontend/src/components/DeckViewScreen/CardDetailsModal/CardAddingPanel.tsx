import React from "react";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {DeckCard} from "@mtgit/shared";
import {ActionIcon, Group, Table, Text} from "@mantine/core";
import {IconMinus, IconPlus} from "@tabler/icons-react";


type CardAddingPanelProps = {
  cardAmount: DeckCard;
};

function CardAddingPanel({cardAmount}: CardAddingPanelProps) {
  const {setCardAmount, repository} = useRepositoryContext();

  const {oracle_id} = cardAmount;


  return (

    <Table w={"fit-content"} style={{whiteSpace: "nowrap", textAlign:"center"}}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th ta={"center"}>Branch name</Table.Th>
          <Table.Th ta={"center"}>Card amount</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <colgroup>
        <col style={{width: "10%"}}/>
        <col style={{width: "10%"}}/>
      </colgroup>

      <Table.Tbody>
        {Object.keys(repository.branches).map(branchName => {
          const count =
            repository.branches[branchName].Main[oracle_id] ?? 0;

          return (
            <Table.Tr key={branchName}>
              <Table.Td ta={"center"}>{branchName}</Table.Td>

              <Table.Td ta={"center"}>
                <Group gap="xs" justify="flex-end" wrap={"nowrap"}>
                  <ActionIcon
                    variant="light"
                    onClick={() =>
                      setCardAmount(oracle_id, branchName, count - 1)
                    }
                  >
                    <IconMinus size={16}/>
                  </ActionIcon>

                  <Text fw={500} w={40} ta="center">
                    {count}
                  </Text>

                  <ActionIcon
                    variant="light"
                    onClick={() =>
                      setCardAmount(oracle_id, branchName, count + 1)
                    }
                  >
                    <IconPlus size={16}/>
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  )
    ;
}

export default CardAddingPanel;