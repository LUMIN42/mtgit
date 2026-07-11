import React from "react";
import {ChartLegend, PieChart, PieChartCell} from "@mantine/charts";
import {useDeckDataContext} from "../../../context/DeckDataContext.tsx";
import {performGrouping} from "../../../utils/cardGrouping.ts";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";
import {Group, MantineColor} from "@mantine/core";
import {MAIN_TYPE_SET, MainCardType, mainTypes} from "@mtgit/shared";

export function DeckPieChart() {
  const {filteredDeck} = useDeckDataContext();
  const {groupingMode, sortingMode} = useDeckUiContext();

  const grouping = performGrouping(filteredDeck, groupingMode, sortingMode);

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

  function typeToColor(type: MainCardType): MantineColor {
    const dictionary: Record<MainCardType, MantineColor> = {
      Battle: undefined,
      Enchantment: "yellow.4",
      Artifact: "gray",
      Land: "green.9",
      Creature: "dark",
      Sorcery: "red.9",
      Instant: "orange.5",
      Planeswalker: "violet"
    };

    if (type in dictionary) {
      return dictionary[type];
    }

    return "grape";
  }

  function getColor(groupHeading: string) {
    if (groupingMode === "type") {
      return typeToColor(groupHeading as MainCardType);
    }

    return randomColorGenerator(groupHeading);
  }

  let chartData: PieChartCell[];

  if (groupingMode === "type") {
    const weights: Partial<Record<MainCardType, number>> = {};

    for (const card of Object.values(filteredDeck.Main)) {
      const types: Set<MainCardType> = mainTypes(card.type_line);

      for (const type of types) {
        weights[type] ??= 0;

        weights[type] += card.count / types.size;
      }
    }

    chartData = Object.entries(weights)
      .map(([type, weight]) => {
        return {
          name: type,
          value: weight,
          color: getColor(type)
        };
      });
  }
  else {
    chartData = main.groups.filter(group => group.heading !== "Untagged").map(
      group => {
        return {
          "name": group.heading,
          "value": group.cards.reduce((cum, cur) => cum + cur.count, 0),
          "color": getColor(group.heading)
        };
      }
    );
  }

  return (
    <Group>
      <PieChart data={chartData}
        withTooltip
        tooltipDataSource="segment"
        mx="auto"
        w={"100%"}
        // labelsPosition="outside"
        // labelsType="name"
        // withLabels

        legendProps={{
          layout: "vertical",
          align: "right",
          verticalAlign: "middle",
          wrapperStyle: {
            maxWidth: "50%"
          }
        }}
        withLegend
      />
    </Group>

  );

}
