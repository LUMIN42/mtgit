import {
  ActionIcon,
  Box,
  Checkbox,
  Group,
  Input,
  Stack,
  Text,
  TextInput,
  useMantineTheme
} from "@mantine/core";
import {IconPlus} from "@tabler/icons-react";
import React, {useEffect, useMemo, useState} from "react";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";

interface CardDetailsTagsPanelProps {
  cardId: string | null;
  currentTags: string[];
  tagSearchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function CardDetailsTagsPanel({
  cardId,
  currentTags,
  tagSearchInputRef
}: CardDetailsTagsPanelProps) {
  const theme = useMantineTheme();

  const {repository, setTags} = useRepositoryContext();

  const tags = repository?.tags ?? {};

  const allTags = useMemo(
    () => Array.from(new Set(Object.values(tags).flat())).sort(),
    [tags]
  );

  const [tagSearch, setTagSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  useEffect(() => {
    if (tagSearch && filteredTags.length > 0) {
      setHighlightedIndex(0);
    }
    else {
      setHighlightedIndex(null);
    }
  }, [tagSearch, filteredTags.length]);

  const handleTagToggle = (tag: string) => {
    if (!cardId) {
      return;
    }

    const existing = tags[cardId] ?? [];

    const nextCardTags = existing.includes(tag)
      ? existing.filter(existingTag => existingTag !== tag)
      : [...existing, tag];

    const nextTags = {...tags};

    if (nextCardTags.length === 0) {
      delete nextTags[cardId];
    }
    else {
      nextTags[cardId] = nextCardTags;
    }

    setTags(nextTags);
  };

  const handleTagCheckboxChange = (
    tag: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleTagToggle(tag);

    // Prevent checkbox focus from stealing keyboard shortcuts.
    event.currentTarget.blur();
  };

  const createTag = () => {
    if (!cardId) {
      return;
    }

    const newTag = tagSearch.trim();

    if (!newTag) {
      return;
    }

    const existing = tags[cardId] ?? [];

    if (existing.includes(newTag)) {
      return;
    }

    setTags({
      ...tags,
      [cardId]: [...existing, newTag]
    });

    setTagSearch("");
  };

  const handleTagSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      if (
        filteredTags.length > 0 &&
        highlightedIndex !== null
      ) {
        handleTagToggle(filteredTags[highlightedIndex]);
      }
      else if (
        tagSearch.trim() &&
        filteredTags.length === 0 &&
        cardId
      ) {
        createTag();
      }
    }
    else if (
      e.key === "ArrowDown" &&
      filteredTags.length > 0
    ) {
      setHighlightedIndex(i =>
        i === null
          ? 0
          : Math.min(i + 1, filteredTags.length - 1)
      );
    }
    else if (
      e.key === "ArrowUp" &&
      filteredTags.length > 0
    ) {
      setHighlightedIndex(i =>
        i === null
          ? 0
          : Math.max(i - 1, 0)
      );
    }
  };

  return (
    <Stack gap={0}>
      <Group>
        <TextInput
          ref={tagSearchInputRef}
          value={tagSearch}
          placeholder="Search or add tag..."
          aria-label="Tag search"
          onChange={e => setTagSearch(e.currentTarget.value)}
          onKeyDown={handleTagSearchKeyDown}
          size="sm"
          style={{flex: 1}}
          rightSection={
            tagSearch !== ""
              ? (
                <Input.ClearButton
                  onClick={() => setTagSearch("")}
                />
              )
              : undefined
          }
        />

        <ActionIcon
          aria-label="Create new tag"
          onClick={createTag}
          disabled={!tagSearch.trim() || !cardId}
        >
          <IconPlus size={18}/>
        </ActionIcon>
      </Group>

      {filteredTags.length === 0 && tagSearch.trim() && (
        <Text c="dimmed" size="sm">
          Press Enter or click + to add "{tagSearch.trim()}" as a new tag
        </Text>
      )}

      {filteredTags.map((tag, idx) => (
        <Box
          key={tag}
          component="label"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() =>
            setHoveredIndex(current =>
              current === idx ? null : current
            )
          }
          style={{
            width: "100%",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            borderRadius: 4,
            padding: "0.3em",
            backgroundColor:
              highlightedIndex === idx ||
              hoveredIndex === idx
                ? theme.colors[theme.primaryColor][0]
                : undefined,
            transition: "background-color 0.1s"
          }}
        >
          <Checkbox
            checked={currentTags.includes(tag)}
            onChange={event =>
              handleTagCheckboxChange(tag, event)
            }
            disabled={!cardId}
            aria-label={tag}
            tabIndex={-1}
            style={{flexShrink: 0}}
          />

          <Text style={{flex: 1, cursor: "pointer"}}>
            {tag}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}