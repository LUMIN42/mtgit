import {useEffect, useState} from "react";
import {Badge, Button, Center, Group, Loader, Paper, Progress, SimpleGrid, Stack, Text, Title} from "@mantine/core";
import {IconChevronDown, IconChevronUp} from "@tabler/icons-react";
import {Card} from "./DeckViewScreen/Card.tsx";
import {useCardCache} from "../context/CardCacheContext.tsx";
import type {CardLocation} from "../types/addressedCards.ts";
import type {FilteredCardGroup} from "@mtgit/shared";

/** Cards shown for a group until the user expands it. */
const COLLAPSED_CARD_COUNT = 10;
/** Cards added by each "show more". */
const EXPAND_STEP = 30;

/** a group whose cards are the ones matching the query, strongest first */
type GroupActivation = FilteredCardGroup;

interface CommanderGroupsProps {
  groups: GroupActivation[];
  onCardSelect: (allLocations: CardLocation[], selected: CardLocation) => void;
}

/**
 * Card groups of the commander (neurons of its recommendation model or clusters of its decks),
 * each with its strongest cards, expandable to all of them.
 */
export function CommanderGroups({groups, onCardSelect}: CommanderGroupsProps) {
  /** group index -> number of its cards shown, {@link COLLAPSED_CARD_COUNT} if missing */
  const [shownCounts, setShownCounts] = useState<Record<number, number>>({});

  const {fetchMissingCards} = useCardCache();

  const visibleCards = (group: GroupActivation) =>
    group.cards.slice(0, shownCounts[group.index] ?? COLLAPSED_CARD_COUNT);

  // joined so the effect reruns only when the shown cards change, not on every render
  const visibleIdsKey = groups.flatMap(group => visibleCards(group).map(card => card.oracleId)).join(",");

  useEffect(() => {
    if (visibleIdsKey) {
      fetchMissingCards(visibleIdsKey.split(","));
    }
  }, [visibleIdsKey, fetchMissingCards]);

  function showMore(index: number) {
    setShownCounts(previous => ({
      ...previous,
      [index]: (previous[index] ?? COLLAPSED_CARD_COUNT) + EXPAND_STEP
    }));
  }

  function collapse(index: number) {
    setShownCounts(previous => ({...previous, [index]: COLLAPSED_CARD_COUNT}));
  }

  return (
    <Stack gap={"lg"}>
      {groups.map(group => (
        <GroupSection
          key={group.index}
          group={group}
          cards={visibleCards(group)}
          onShowMore={() => showMore(group.index)}
          onCollapse={() => collapse(group.index)}
          onCardSelect={onCardSelect}
        />
      ))}
    </Stack>
  );
}

interface GroupSectionProps {
  group: GroupActivation;
  cards: GroupActivation["cards"];
  onShowMore: () => void;
  onCollapse: () => void;
  onCardSelect: CommanderGroupsProps["onCardSelect"];
}

function GroupSection({group, cards, onShowMore, onCollapse, onCardSelect}: GroupSectionProps) {
  const {tryGetCard} = useCardCache();

  const maxActivation = group.cards[0]?.activation ?? 1;
  // the same card can activate several groups, the location tells them apart for the modal
  const location = {group: String(group.index)};
  const locations = cards.map(card => ({oracle_id: card.oracleId, location}));

  const loadedCards = cards.flatMap(card => {
    const details = tryGetCard(card.oracleId);
    return details ? [{...card, details}] : [];
  });

  const filtered = group.cards.length !== group.activeCards;

  return (
    <Paper withBorder p={"md"}>
      <Stack gap={"xs"}>
        <Group gap={"xs"} align={"baseline"}>
          <Title order={3}>
            {group.label ?? `Group ${group.index}`}
          </Title>
          {group.label && <Text c={"dimmed"} size={"sm"}>group {group.index}</Text>}
          {group.coherent === false && <Badge color={"gray"} variant={"light"}>incoherent</Badge>}
          <Text c={"dimmed"} size={"sm"} ml={"auto"}>
            {filtered
              ? `${group.cards.length} of ${group.activeCards} active cards match`
              : `${group.activeCards} active cards`}
          </Text>
        </Group>

        {group.explanation && <Text size={"sm"} c={"dimmed"}>{group.explanation}</Text>}

        <SimpleGrid cols={{base: 2, xs: 3, sm: 4, md: 5}} spacing={"xs"} verticalSpacing={"sm"}>
          {loadedCards.map(card => (
            <Stack key={card.oracleId} gap={4}>
              <Card
                card={card.details}
                displayMode={"Images"}
                quicklyAdjustable
                deckSection={"Main"}
                onSelect={() => onCardSelect(locations, {oracle_id: card.oracleId, location})}
              />
              <Progress value={card.activation / maxActivation * 100} size={"xs"} mx={"xs"}/>
              <Text size={"xs"} c={"dimmed"} ta={"center"}>
                activation {card.activation.toFixed(3)}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>

        {loadedCards.length !== cards.length && (
          <Center>
            <Loader size={"md"}/>
          </Center>
        )}

        <Group justify={"center"} gap={"xs"}>
          {cards.length < group.cards.length && (
            <Button variant={"subtle"} onClick={onShowMore} leftSection={<IconChevronDown size={16}/>}>
              {`Show ${Math.min(EXPAND_STEP, group.cards.length - cards.length)} more `
                + `(${cards.length} of ${group.cards.length} shown)`}
            </Button>
          )}
          {cards.length > COLLAPSED_CARD_COUNT && (
            <Button variant={"subtle"} color={"gray"} onClick={onCollapse} leftSection={<IconChevronUp size={16}/>}>
              Show fewer
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
