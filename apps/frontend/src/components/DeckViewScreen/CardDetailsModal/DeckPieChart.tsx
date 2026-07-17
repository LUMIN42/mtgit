import React from "react";
import {
  Box,
  Flex,
  Group,
  MantineColor,
  Paper, Stack,
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
import {COLOR_CODE_TO_NAMES, ColorCode, ColorName, MainCardType, mainTypes} from "@mtgit/shared";

type ChartData = {
  name: string;
  value: number;
  actualValue: number;
  color: MantineColor;
};

type DumbPieChartProps = {
  chartData: ChartData[];
};


function DumbPieChart({chartData}: DumbPieChartProps) {
  const theme = useMantineTheme();

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

  return <Group w="100%">
    <Flex w="100%" align="center">
      <Box style={{flex: "1 1 50%", minWidth: 0}}>
        <ResponsiveContainer width="100%" height={150}>
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

              isAnimationActive={false}

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

              outerRadius={"100%"}
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
  </Group>;
}


export function DeckPieChart() {
  const {filteredDeck} = useDeckDataContext();
  const {groupingMode, sortingMode} = useDeckUiContext();

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null); // todo

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

  const COLOR_CODE_TO_COLOR: Record<ColorCode | ColorName, MantineColor> = {
    Black: "dark",
    Blue: "blue",
    Green: "green",
    Red: "red",
    White: "yellow.1",
    "B": "dark",
    "W": "yellow.1",
    "U": "blue",
    "R": "red",
    "G": "green"
  };


  function getColor(groupHeading: string): MantineColor {
    if (groupingMode === "type") {
      return typeToColor(groupHeading as MainCardType);
    }
    else if (groupingMode === "color") {
      return COLOR_CODE_TO_COLOR[groupHeading as ColorCode];
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

      for (const card of Object.values(filteredDeck?.Main ?? {})) {
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

      if (groupingMode === "color" && group.heading.includes("Producer")) {
        continue;
      }

      for (const card of group.cards) {
        weights[group.heading] ??= 0;
        counts[group.heading] ??= 0;

        weights[group.heading] += groupingMode === "tags" ? card.count / card.tags.length : card.count;
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


  function productionChartData() {
    const counts: Partial<Record<ColorCode, number>> = {};

    for (const card of Object.values(filteredDeck.Main ?? {})) {
      for (const producedColor of card.produced_mana) {
        if (!chartData.some(datum => datum.name === COLOR_CODE_TO_NAMES[producedColor])) {
          continue;
        }

        counts[producedColor] ??= 0;
        counts[producedColor] += card.count;
      }
    }

    return Object.entries(counts).map(([name, weight]) => ({
      name: COLOR_CODE_TO_NAMES[name],
      value: weight,
      actualValue: counts[name],
      color: COLOR_CODE_TO_COLOR[name],
      anchorId: sectionId(`${COLOR_CODE_TO_NAMES[name]} Producer`)
    }));
  }

  const colorProductionData: ChartData[] = productionChartData();


  return <Stack>
    <Stack gap={0}>
      {groupingMode === "color" && <Text>Consumption:</Text>}
      <DumbPieChart chartData={chartData}/>
    </Stack>
    {
      groupingMode === "color" &&
      (<Stack gap={0}>
        <Text>Production:</Text>
        <DumbPieChart chartData={colorProductionData}/>
      </Stack>)

    }
  </Stack>;
}