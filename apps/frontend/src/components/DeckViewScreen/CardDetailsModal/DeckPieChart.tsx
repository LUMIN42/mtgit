import React from "react";
import {PieChart, PieChartCell} from "@mantine/charts";
import {useDeckDataContext} from "../../../context/DeckDataContext.tsx";
import {performGrouping} from "../../../utils/cardGrouping.ts";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";
import {MantineColor} from "@mantine/core";
import {MainCardType} from "@mtgit/shared";

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

  const chartData: PieChartCell[] = main.groups.map(
    group => {
      return {
        "name": group.heading,
        "value": group.cards.reduce((cum, cur) => cum + cur.count, 0),
        "color": getColor(group.heading)
      };
    }
  );

  return (
    <PieChart data={chartData}
      withTooltip
      tooltipDataSource="segment"
      mx="auto"
      // labelsPosition="outside"
      // labelsType="name"
      // withLabels
      withLegend
    />
  );

}
