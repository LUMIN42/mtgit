import React, {useEffect, useState} from "react";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {DeckSectionName, maximumCardAmount, maximumCardAmountWithoutCard} from "@mtgit/shared";
import {useScryfallCache} from "../../context/ScryfallCacheContext.tsx";
import {ActionIcon, Checkbox, Group, Text} from "@mantine/core";
import {IconMinus, IconPlus} from "@tabler/icons-react";

type CardAmountEditorProps = {
  branchName: string;
  oracleId: string;
  deckSection: DeckSectionName;
};

function CardAmountEditor({branchName, oracleId, deckSection = "Main"}: CardAmountEditorProps) {
  const repositoryContext = useRepositoryContext();
  const repository = repositoryContext.repository;
  const setCardAmount = (newAmount: number) => repositoryContext
    .setCardAmount(oracleId, branchName, newAmount, deckSection);

  const currentCount = repository.branches?.[branchName]?.[deckSection]?.[oracleId] ?? 0;


  const {getCard} = useScryfallCache();

  const [maxCount, setMaxCount] = useState(maximumCardAmountWithoutCard(repository.format));

  useEffect(() => {
    const loadCard = async () => {
      const card = await getCard(oracleId);

      if (!card) {
        throw new Error("Card not found.");
      }

      setMaxCount(maximumCardAmount(card, repository.format));
    };

    loadCard();
  }, [oracleId, repository.format]);

  return (
    <>
      {maxCount === 1 && (
        <Checkbox
          checked={currentCount >= 1}
          onChange={event =>
            setCardAmount(event.currentTarget.checked ? 1 : 0)
          }
          disabled={currentCount > 1}
        />
      )}
      {maxCount > 1 && (
        <Group gap="xs" justify="flex-end" wrap={"nowrap"}>
          <ActionIcon
            variant="light"
            onClick={() =>
              setCardAmount(currentCount - 1)
            }
            disabled={currentCount <= 0}
          >
            <IconMinus size={16}/>
          </ActionIcon>

          <Text fw={500} w={40} ta="center">
            {currentCount}
          </Text>

          <ActionIcon
            variant="light"
            onClick={() =>
              setCardAmount(currentCount + 1)
            }
            disabled={currentCount >= maxCount}
          >
            <IconPlus size={16}/>
          </ActionIcon>
        </Group>
      )}
    </>
  );
}

export default CardAmountEditor;