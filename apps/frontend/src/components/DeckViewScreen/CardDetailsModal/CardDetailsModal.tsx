import {ActionIcon, Divider, Group, Modal, Text, Stack, Tabs} from "@mantine/core";
import {IconChevronLeft, IconChevronRight} from "@tabler/icons-react";
import {DeckSectionName, type OracleCard} from "@mtgit/shared";
import {useEffect, useRef, useState} from "react";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {CardDetailsTagsPanel} from "./CardDetailsTagsPanel.tsx";
import {CardOracleTagsPanel} from "./CardOracleTagsPanel.tsx";
import CardAddingPanel from "./CardAddingPanel.tsx";
import {useCardCache} from "../../../context/CardCacheContext.tsx";
import {Card} from "../Card.tsx";

type TagsTab = "deck" | "oracle";

interface CardDetailsModalProps {
  onClose: () => void;

  oracle_id: string;
  onPrev: () => void;
  onNext: () => void;

  hasPrevious: boolean;
  hasNext: boolean;

  deckSectionName?: DeckSectionName | undefined;
}

/**
 * Use in conjunction with {@link useCardSelectionManager}
 */
export function CardDetailsModal({
  oracle_id,
  onClose,
  onPrev,
  onNext,
  hasPrevious,
  hasNext
}: CardDetailsModalProps) {

  const cache = useCardCache();

  const card: OracleCard | undefined = cache.tryGetCard(oracle_id);

  const {repository} = useRepositoryContext();

  const tagSearchInputRef = useRef<HTMLInputElement>(null);

  // kept while switching between cards
  const [tagsTab, setTagsTab] = useState<TagsTab>("deck");

  const currentTags = repository.tags[oracle_id] ?? [];

  const isOpened = oracle_id !== null;


  // Keyboard navigation: a = left, d = right
  useEffect(() => {
    if (!isOpened) {
      return;
    }
    const handler = (e: KeyboardEvent) => {
      // Disable A/D only when typing in the tags search input.
      if (document.activeElement === tagSearchInputRef.current) {
        return;
      }
      if (e.key === "a" || e.key === "A") {
        if (hasPrevious) {
          e.preventDefault();
          onPrev();
        }
      }
      else if (e.key === "d" || e.key === "D") {
        if (hasNext) {
          e.preventDefault();
          onNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <Modal
      opened={isOpened}
      onClose={onClose}
      centered
      title={card?.name ?? "Card details"}
      size={1000}
      styles={{
        content: {height: "65vh", display: "flex", flexDirection: "column"},
        // body doesn't scroll itself, only the active tab panel does
        body: {flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column"}
      }}
    >
      {card ? (
        <Group align="stretch" gap={0} wrap="nowrap" style={{flex: 1, minHeight: 0}}>
          <ActionIcon
            variant="subtle"
            w={80}
            h="100%"
            style={{borderRadius: 0}}
            onClick={() => onPrev()}
            disabled={!hasPrevious}
            aria-label="Previous card"
          >
            <IconChevronLeft size={18}/>
          </ActionIcon>
          {/*main central part (image + description)*/}
          <Group flex={1} px={"xs"} wrap={"nowrap"} gap={"xl"} align={"stretch"} style={{minHeight: 0}}>
            {/*image*/}
            <Stack style={{maxWidth: 420}} h={"100%"} align={"center"} gap={"xl"}>

              <Stack h={"60%"} align={"center"} w={"100%"} gap={0}>
                {card ? (
                  <Card card={card}
                    shellStyle={{
                      height: "90%",
                      borderRadius: 8,
                      objectFit: "contain"
                    }}
                    imageStyle={{
                      height: "100%",
                      width: "auto"
                    }}
                  />
                ) : (
                  <Text c="dimmed">No card image available.</Text>
                )}

                <Text>
                  {card?.prices?.usd && `${card?.prices?.usd} $`}
                </Text>
              </Stack>


              <CardAddingPanel oracle_id={oracle_id}/>

            </Stack>
            <Divider orientation="vertical"/>
            <Tabs
              value={tagsTab}
              onChange={value => value && setTagsTab(value as TagsTab)}
              flex={1}
              style={{display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0}}
              styles={{
                panel: {
                  marginTop: "var(--mantine-spacing-md)",
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto"
                }
              }}
            >
              <Tabs.List grow>
                {/* keeps focus out of the tab, so A/D keep switching cards */}
                <Tabs.Tab value="deck" onMouseDown={event => event.preventDefault()}>
                  Deck tags ({currentTags.length})
                </Tabs.Tab>
                <Tabs.Tab value="oracle" onMouseDown={event => event.preventDefault()}>
                  Oracle tags ({card.otags.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="deck">
                <CardDetailsTagsPanel
                  cardId={oracle_id}
                  currentTags={currentTags}
                  tagSearchInputRef={tagSearchInputRef}
                />
              </Tabs.Panel>

              <Tabs.Panel value="oracle">
                <CardOracleTagsPanel otags={card.otags}/>
              </Tabs.Panel>
            </Tabs>
          </Group>
          <ActionIcon
            variant="subtle"
            w={80}
            h="100%"
            style={{borderRadius: 0}}
            onClick={() => onNext()}
            disabled={!hasNext}
            aria-label="Next card"
          >
            <IconChevronRight size={18}/>
          </ActionIcon>
        </Group>
      ) : null}
    </Modal>
  );
}
