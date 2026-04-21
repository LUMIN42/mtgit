import {ActionIcon, Box, Divider, Group, Modal, Stack, Tabs, Text, Image} from '@mantine/core';
import {IconChevronLeft, IconChevronRight} from '@tabler/icons-react';
import {getCardImageUrl, type ScryfallOracleCard} from '@mtgit/shared';
import {useEffect, useRef} from 'react';
import {useTagsContext} from "../context/useTagsContext.ts";
import {CardDetailsTagsPanel} from './CardDetailsTagsPanel';

interface CardDetailsModalProps {
  cards: ScryfallOracleCard[];
  index: number;
  opened: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function CardDetailsModal({cards, index, opened, onClose, onIndexChange}: CardDetailsModalProps) {
   const card = cards[index] ?? null;
   const cardImageUrl = card ? getCardImageUrl(card) : null;
   const hasPrevious = index > 0;
   const hasNext = index < cards.length - 1;
 
   const {tags} = useTagsContext();
   const cardId = card?.oracle_id ?? card?.id ?? null;
   const currentTags = cardId ? (tags[cardId] ?? []) : [];
   const tagSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard navigation: a = left, d = right
  useEffect(() => {
    if (!opened) return;
    const handler = (e: KeyboardEvent) => {
      // Disable A/D only when typing in the tags search input.
      if (document.activeElement === tagSearchInputRef.current) return;
      if (e.key === 'a' || e.key === 'A') {
        if (hasPrevious) {
          e.preventDefault();
          onIndexChange(index - 1);
        }
      } else if (e.key === 'd' || e.key === 'D') {
        if (hasNext) {
          e.preventDefault();
          onIndexChange(index + 1);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opened, hasPrevious, hasNext, index, onIndexChange]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={card?.name ?? 'Card details'}
      size={"100%"}
      styles={{
        content: {height: '95vh', maxHeight: '95vh', display: 'flex', flexDirection: 'column'},
        body: {overflowY: 'auto', flex: 1},
      }}
    >
      {card ? (
        <Group align="stretch" gap={0} wrap="nowrap" style={{height: '100%'}}>
          <ActionIcon
            variant="subtle"
            w={80}
            h="100%"
            style={{borderRadius: 0}}
            onClick={() => onIndexChange(index - 1)}
            disabled={!hasPrevious}
            aria-label="Previous card"
          >
            <IconChevronLeft size={18}/>
          </ActionIcon>
          {/*main central part (image + description)*/}
          <Group flex={1} px={"xs"} wrap={"nowrap"} gap={"xl"} align={"flex-start"}>
            {/*image*/}
            <Box style={{maxWidth: 420, width: '100%'}}>
              {cardImageUrl ? (
                <Image src={cardImageUrl} maw={"400px"} alt={card.name} style={{width: '100%', borderRadius: 8}}/>
              ) : (
                <Text c="dimmed">No card image available.</Text>
              )}
            </Box>
            <Divider orientation="vertical"/>
            <Tabs defaultValue="details" flex={1}
                  styles={{panel: {marginTop: "var(--mantine-spacing-xl)"}}}>
              <Tabs.List grow>
                <Tabs.Tab value="details" onMouseDown={(event) => event.preventDefault()}>Details</Tabs.Tab>
                <Tabs.Tab value="tags" onMouseDown={(event) => event.preventDefault()}>Tags</Tabs.Tab>
                <Tabs.Tab value="related" onMouseDown={(event) => event.preventDefault()}>Related</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details">
                <Stack gap="sm">
                  <Text fw={700}>{card.name}</Text>
                  <Text><strong>Type:</strong> {card.type_line}</Text>
                  <Text><strong>Tags:</strong> {currentTags.length ? currentTags.join(', ') : '-'}</Text>
                  <Text style={{whiteSpace: 'pre-wrap'}}>
                    <strong>OracleText:</strong><br/>
                    {card.oracle_text || '-'}
                  </Text>
                  <Text>
                    <strong>Price (USD):</strong> {card.prices?.usd ? `$${card.prices.usd}` : '-'}
                  </Text>
                </Stack>
              </Tabs.Panel>


              <Tabs.Panel value="tags">
                <CardDetailsTagsPanel
                  cardId={cardId}
                  currentTags={currentTags}
                  tagSearchInputRef={tagSearchInputRef}
                />
              </Tabs.Panel>


              <Tabs.Panel value="related">
                <Text>Related cards or information go here.</Text>
              </Tabs.Panel>
            </Tabs>
          </Group>
          <ActionIcon
            variant="subtle"
            w={80}
            h="100%"
            style={{borderRadius: 0}}
            onClick={() => onIndexChange(index + 1)}
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
