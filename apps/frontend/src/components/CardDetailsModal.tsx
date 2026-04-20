import {ActionIcon, Box, Divider, Group, Modal, Stack, Tabs, Text, Image, Checkbox, TextInput, Input, useMantineTheme} from '@mantine/core';
import {IconChevronLeft, IconChevronRight, IconPlus} from '@tabler/icons-react';
import {getCardImageUrl, type ScryfallOracleCard} from '@mtgit/shared';
import {useEffect, useState} from 'react';
import {useTagsContext} from "../context/TagsContext.tsx";

interface CardDetailsModalProps {
  cards: ScryfallOracleCard[];
  index: number;
  opened: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function CardDetailsModal({cards, index, opened, onClose, onIndexChange}: CardDetailsModalProps) {
  const theme = useMantineTheme();
  const card = cards[index] ?? null;
  const cardImageUrl = card ? getCardImageUrl(card) : null;
  const hasPrevious = index > 0;
  const hasNext = index < cards.length - 1;

  const {tags, setTags, allTags} = useTagsContext();
  const cardId = card?.oracle_id ?? card?.id ?? null;
  const currentTags = cardId ? (tags[cardId] ?? []) : [];

  // Tag search state
  const [tagSearch, setTagSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filtered tags
  const filteredTags = allTags.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()));

  // Update highlighted index when search or filteredTags changes
  useEffect(() => {
    // Avoid setting state if already correct
    if (tagSearch && filteredTags.length > 0) {
      setHighlightedIndex(prev => prev === 0 ? prev : 0);
    } else if (highlightedIndex !== null) {
      setHighlightedIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagSearch, filteredTags.length]);

  const handleTagToggle = (tag: string) => {
    if (!cardId) {
      return;
    }

    setTags((previousTags) => {
      const existing = previousTags[cardId] ?? [];
      const nextCardTags = existing.includes(tag)
        ? existing.filter((existingTag) => existingTag !== tag)
        : [...existing, tag];

      if (nextCardTags.length === 0) {
        const nextTags = {...previousTags};
        delete nextTags[cardId];
        return nextTags;
      }

      return {
        ...previousTags,
        [cardId]: nextCardTags,
      };
    });
  };

  // Add new tag if enter is pressed and no tags are visible
  const handleTagSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredTags.length > 0 && highlightedIndex !== null) {
        handleTagToggle(filteredTags[highlightedIndex]);
      } else if (tagSearch.trim() && filteredTags.length === 0 && cardId) {
        createTag();
      }
    } else if (e.key === 'ArrowDown' && filteredTags.length > 0) {
      setHighlightedIndex(i => i === null ? 0 : Math.min(i + 1, filteredTags.length - 1));
    } else if (e.key === 'ArrowUp' && filteredTags.length > 0) {
      setHighlightedIndex(i => i === null ? 0 : Math.max(i - 1, 0));
    }
  };

  // Explicit create tag handler
  const createTag = () => {
    if (!cardId || !tagSearch.trim()) return;
    setTags((previousTags) => {
      const existing = previousTags[cardId] ?? [];
      if (existing.includes(tagSearch.trim())) return previousTags;
      return {
        ...previousTags,
        [cardId]: [...existing, tagSearch.trim()],
      };
    });
    setTagSearch('');
  };

  // Keyboard navigation: a = left, d = right
  useEffect(() => {
    if (!opened) return;
    const handler = (e: KeyboardEvent) => {
      // Ignore if focus is in input/textarea or contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;
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
                <Tabs.Tab value="details">Details</Tabs.Tab>
                <Tabs.Tab value="tags">Tags</Tabs.Tab>
                <Tabs.Tab value="related">Related</Tabs.Tab>
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


              <Tabs.Panel value="tags" pt="xl">
                <Stack gap={0}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <TextInput
                      value={tagSearch}
                      placeholder="Search or add tag..."
                      aria-label="Tag search"
                      onChange={e => setTagSearch(e.currentTarget.value)}
                      onKeyDown={handleTagSearchKeyDown}
                      size="sm"
                      style={{flex: 1}}
                      rightSection={tagSearch !== '' ? (
                        <Input.ClearButton onClick={() => setTagSearch('')} />
                      ) : undefined}
                    />
                    <ActionIcon
                      aria-label="Create new tag"
                      onClick={createTag}
                      disabled={!tagSearch.trim() || !cardId}
                    >
                      <IconPlus size={18}/>
                    </ActionIcon>
                  </div>
                  {filteredTags.length === 0 && tagSearch.trim() && (
                    <Text c="dimmed" size="sm">Press Enter or click + to add "{tagSearch.trim()}" as a new tag</Text>
                  )}
                  {filteredTags.map((tag, idx) => (
                    <Box
                      key={tag}
                      component="label"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex((current) => (current === idx ? null : current))}
                      style={{
                        width: '100%',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        borderRadius: 4,
                        padding: '0.3em',
                        backgroundColor: highlightedIndex === idx || hoveredIndex === idx ? theme.colors[theme.primaryColor][0] : undefined,
                        transition: 'background-color 0.1s',
                      }}
                    >
                      <Checkbox
                        checked={currentTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        disabled={!cardId}
                        aria-label={tag}
                        style={{flexShrink: 0}}
                      />
                      <Text style={{flex: 1, cursor: 'pointer'}}>{tag}</Text>
                    </Box>
                  ))}
                </Stack>
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
