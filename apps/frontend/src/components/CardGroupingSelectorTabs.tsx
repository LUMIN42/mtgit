import {ActionIcon, CloseButton, Group, Paper, Select, Stack, Tabs, Text} from '@mantine/core';
import {useState} from 'react';
import {IconPlus} from "@tabler/icons-react";

export function CardGroupingSelectorTabs() {
  const [tab, setTab] = useState<string>('edit');

  return (
    <Tabs value={tab} onChange={(str) => setTab(str ?? "")}>
      <Tabs.List>
        <Tabs.Tab value="edit">Edit</Tabs.Tab>
        <Tabs.Tab value="templates">presets</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="edit" pt="sm">
        <Stack align={"center"} gap={"xs"}>

          <ActionIcon variant="light" size="sm">
            <IconPlus size={16} />
          </ActionIcon>

          <Paper withBorder p={"xs"} radius={"md"}>
            <Group justify="space-between" align="center" wrap="nowrap" w="100%">
              <Group grow w="100%" gap="xs">
                <Select
                  data={["Order by", "Group by"]}
                  defaultValue="Order by"
                  size="xs"
                  flex={1}
                />

                <Select
                  data={["Name", "Mana Value", "Color", "Tags"]}
                  defaultValue="Name"
                  size="xs"
                  flex={1}
                />
              </Group>

              <CloseButton/>
            </Group>
          </Paper>


          <ActionIcon variant="light" size="sm">
            <IconPlus size={16} />
          </ActionIcon>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="presets" pt="sm">
        <Text>This is the presets view.</Text>
      </Tabs.Panel>
    </Tabs>
  );
}