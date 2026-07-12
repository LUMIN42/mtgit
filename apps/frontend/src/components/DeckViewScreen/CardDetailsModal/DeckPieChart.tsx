import React from "react";
import {
  Box,
  Flex,
  Group,
  MantineColor,
  Paper,
  Text,
  useMantineTheme
} from "@mantine/core";

import {
  PieChart,
  Pie,
  Sector,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {useDeckDataContext} from "../../../context/DeckDataContext.tsx";
import {performGrouping} from "../../../utils/cardGrouping.ts";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";
import {MainCardType, mainTypes} from "@mtgit/shared";

type ChartData = {
  name: string;
  value: number;
  actualValue: number;
  color: MantineColor;
};


export function DeckPieChart() {
  const theme = useMantineTheme();

  const {filteredDeck} = useDeckDataContext();
  const {groupingMode, sortingMode} = useDeckUiContext();

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const grouping = performGrouping(
    filteredDeck,
    groupingMode,
    sortingMode
  );

  const main = grouping.find(section => section.name === "Main");

  function randomColorGenerator(hashKey: string): MantineColor {
    let hash = 0;

    for (let i = 0; i < hashKey.length; i++) {
      hash = hashKey.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }

    const hue = Math.abs(hash) % 360;

    return `hsl(${hue}, 70%, 55%)`;
  }

  function sectionId(groupName: string) {
    return `${groupingMode}-Main-${groupName}`; // todo make this not wet
  }

  function typeToColor(type: MainCardType): MantineColor {
    const dictionary: Record<MainCardType, MantineColor> = {
      Battle: "pink.8",
      Enchantment: "yellow.4",
      Artifact: "gray",
      Land: "green.9",
      Creature: "dark",
      Sorcery: "red.9",
      Instant: "orange.5",
      Planeswalker: "violet"
    };

    return dictionary[type] ?? "grape";
  }


  function getColor(groupHeading: string): MantineColor {
    if (groupingMode === "type") {
      return typeToColor(groupHeading as MainCardType);
    }

    return randomColorGenerator(groupHeading);
  }


  function createChartData(): ChartData[] {
    if (!main) {
      return [];
    }

    if (groupingMode === "type") {
      const weights: Partial<Record<MainCardType, number>> = {};
      const counts: Partial<Record<MainCardType, number>> = {};

      for (const card of Object.values(filteredDeck.Main)) {
        const types = mainTypes(card.type_line);

        for (const type of types) {
          weights[type] ??= 0;
          counts[type] ??= 0;

          weights[type]! += card.count / types.size;
          counts[type]! += card.count;
        }
      }

      return Object.entries(weights).map(([type, weight]) => ({
        name: type,
        value: weight!,
        actualValue: counts[type as MainCardType]!,
        color: getColor(type),
        anchorId: sectionId(type)
      }));
    }


    const weights: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const group of main.groups) {
      if (group.heading === "Untagged") {
        continue;
      }

      for (const card of group.cards) {
        weights[group.heading] ??= 0;
        counts[group.heading] ??= 0;

        weights[group.heading] += card.count / card.tags.length;
        counts[group.heading] += card.count;
      }
    }

    return Object.entries(weights).map(([name, weight]) => ({
      name,
      value: weight,
      actualValue: counts[name],
      color: getColor(name),
      anchorId: sectionId(name)
    }));
  }


  const chartData = createChartData();


  function resolveColor(color: MantineColor): string {
    if (color.startsWith("hsl")) {
      return color;
    }

    const [name, shade] = color.split(".");

    if (shade) {
      return theme.colors[name]?.[Number(shade)] ?? color;
    }

    return theme.colors[name]?.[6] ?? color;
  }


  return (
    <Group w="100%">
      <Flex w="100%" align="center">
        <Box style={{flex: "1 1 50%", minWidth: 0}}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Tooltip
                content={({active, payload}) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  const item = payload[0].payload as ChartData;

                  return (
                    <Paper p="xs" withBorder>
                      <Text fw={600}>
                        {item.name}
                      </Text>

                      <Text>
                        Cards: {item.actualValue}
                      </Text>
                    </Paper>
                  );
                }}
              />

              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"

                onClick={
                  item => {
                    document
                      .getElementById(item["anchorId"])
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                  }
                }

                cursor={"pointer"}

                outerRadius={90}
                shape={props => {
                  const entry = props.payload as ChartData;

                  return (
                    <Sector
                      {...props}
                      fill={resolveColor(entry.color)}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Box style={{flex: "1 1 50%", minWidth: 0}}>
          <div>
            {chartData.map(item => (
              <Group key={item.name} gap="xs">
                <div
                  style={{
                    width: 12,
                    height: 12,
                    background: resolveColor(item.color),
                    borderRadius: 2
                  }}
                />

                <Text>
                  {item.name}
                </Text>
              </Group>
            ))}
          </div>
        </Box>
      </Flex>
    </Group>
  );
}