import React from "react";
import {useRepositoryContext} from "../../context/RepositoryContext.tsx";
import {DeckSectionName, maximumCardAmount, maximumCardAmountWithoutCard} from "@mtgit/shared";
import {useScryfallCache} from "../../context/ScryfallCacheContext.tsx";
import {ActionIcon, Checkbox, Group, Text} from "@mantine/core";
import {IconMinus, IconPlus} from "@tabler/icons-react";

type CardAmountEditorProps = {
  branchName: string;
  oracleId: string;
  deckSection: DeckSectionName;
  originalCardAmount?: number;
};

function CardAmountEditor({
  branchName,
  oracleId,
  deckSection = "Main",
  originalCardAmount = undefined
}: CardAmountEditorProps) {
  const {repository, setCardAmount, selectedBranchContent} = useRepositoryContext();
  const setAmountCurried = (newAmount: number) => setCardAmount(oracleId, branchName, newAmount, deckSection);

  const correspondingBranchContent = repository.branches?.[branchName] ?? {};

  const currentCount = correspondingBranchContent[deckSection]?.[oracleId] ?? 0;

  const totalCountInDeck = Object.values(correspondingBranchContent).reduce(
    (cum, cur) => cum + (cur[oracleId] ?? 0),
    0
  );


  const {tryGetCard} = useScryfallCache();

  const card = tryGetCard(oracleId);
  const maxCount = card ? maximumCardAmount(card, repository.format) : maximumCardAmountWithoutCard(repository.format);

  return (
    <>
      {maxCount === 1 && (
        <Checkbox
          checked={currentCount >= 1}
          onChange={event =>
            setAmountCurried(event.currentTarget.checked ? 1 : 0)
          }

          disabled={totalCountInDeck >= maxCount && currentCount < 1}
        />
        // todo make the disabling less of a fuck you thing to the user
      )}
      {maxCount > 1 && (
        <Group gap="xs" justify="flex-end" wrap={"nowrap"}>
          <ActionIcon
            variant="light"
            onClick={() =>
              setAmountCurried(currentCount - 1)
            }
            disabled={currentCount <= 0}
          >
            <IconMinus size={16}/>
          </ActionIcon>

          <Text fw={500} w={40} ta="center">
            {currentCount}

            {
              originalCardAmount && ` / ${originalCardAmount}`
            }
          </Text>

          <ActionIcon
            variant="light"
            onClick={() =>
              setAmountCurried(currentCount + 1)
            }
            disabled={totalCountInDeck >= maxCount}
          >
            <IconPlus size={16}/>
          </ActionIcon>
        </Group>
      )}
    </>
  );
}

export default CardAmountEditor;