import {CopyButton, Group, Paper, Stack, Text, UnstyledButton} from "@mantine/core";
import {IconCheck, IconCopy} from "@tabler/icons-react";

interface CardOracleTagsPanelProps {
  /** the card's scryfall oracle tags, see `otag:` */
  otags: string[];
}

/**
 * Read-only list of a card's scryfall oracle tags, clicking a tag copies its name.
 */
export function CardOracleTagsPanel({otags}: CardOracleTagsPanelProps) {
  if (otags.length === 0) {
    return <Text c="dimmed">This card has no oracle tags.</Text>;
  }

  return (
    <Stack gap={6}>
      {[...otags].sort().map(tag => (
        <CopyButton key={tag} value={tag} timeout={1500}>
          {({copied, copy}) => (
            <UnstyledButton onClick={copy} aria-label={`Copy tag ${tag}`} w="100%">
              <Paper withBorder px="sm" py={6} bg={copied ? "teal.0" : undefined}>
                <Group justify="space-between" wrap="nowrap">
                  <Text>{tag}</Text>
                  {copied
                    ? <IconCheck size={16} color="var(--mantine-color-teal-6)"/>
                    : <IconCopy size={16} color="var(--mantine-color-gray-6)"/>}
                </Group>
              </Paper>
            </UnstyledButton>
          )}
        </CopyButton>
      ))}
    </Stack>
  );
}
