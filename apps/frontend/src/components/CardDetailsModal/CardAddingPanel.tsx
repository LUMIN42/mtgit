import React from "react";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {DeckCard} from "@mtgit/shared";
import {ActionIcon, Group, Stack, Text} from "@mantine/core";
import {IconMinus, IconPlus} from "@tabler/icons-react";

type CardAddingPanelProps = {
  cardAmount: DeckCard;
};

function CardAddingPanel({cardAmount}: CardAddingPanelProps) {
  const {setCardAmount, repository} = useRepositoryContext();

  const {oracle_id, count} = cardAmount;


  return (
    <Stack>
      {
        Object.keys(repository.branches)
          .map(
            name =>
              <Group>
                {name}:
                <Group gap="xs">
                  <ActionIcon
                    variant="light"
                    onClick={() => setCardAmount(oracle_id, name, count - 1)}
                  >
                    <IconMinus size={16}/>
                  </ActionIcon>

                  <Text fw={500} w={40} ta="center">
                    {count}
                  </Text>

                  <ActionIcon
                    variant="light"
                    onClick={() => setCardAmount(oracle_id, name, count + 1)}
                  >
                    <IconPlus size={16}/>
                  </ActionIcon>
                </Group>
              </Group>
          )
      }
    </Stack>
  );
}

export default CardAddingPanel;