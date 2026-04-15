import {InputLabel, Stack} from "@mantine/core";
import {BarChart} from "@mantine/charts";
import {useDeckContext} from "../context/DeckContext.tsx";
import {getGroupHeadingId} from "../utils/cardGrouping.ts";

export function ManaCurvePlot() {

  const {filteredDeck, groupingMode} = useDeckContext();

  const countsPerCMC: { [key: number]: number } = {};

  for (const card of filteredDeck.sections.Main) {
    if (card.type_line.toLowerCase().includes("land")) {
      continue;
    }

    const cmc = Math.min(Math.floor(card.cmc), 10); // Treat CMC > 10 as 10
    countsPerCMC[cmc] = (countsPerCMC[cmc] || 0) + 1;
  }

  const manaCurveData = Object.entries(countsPerCMC).map(([cmc, count]) => ({
    cmc: cmc === "10" ? "10+" : cmc, // Label 10 as "10+"
    cards: count,
  }));

  const handleChartClick = (data: {activeLabel?: string | number}) => {
    if (groupingMode !== "manaValue") {
      return;
    }

    const heading = data.activeLabel?.toString();
    if (!heading) {
      return;
    }

    const headingId = getGroupHeadingId("manaValue", heading);
    if (!headingId) {
      return;
    }

    document.getElementById(headingId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return <Stack gap={0}>
    <InputLabel size="xs">Mana Curve:</InputLabel>
    <BarChart
      h={170}
      data={manaCurveData}
      dataKey="cmc"
      series={[{name: "cards", color: "orange.6"}]}
      withLegend={false}
        barChartProps={{
          onClick: handleChartClick,
          style: {cursor: groupingMode === "manaValue" ? "pointer" : "default"},
        }}
      tooltipProps={{
        contentStyle: {fontSize: 11, padding: 0},
        itemStyle: {fontSize: 11, padding: 0},
        labelStyle: {fontSize: 10, marginBottom: 0},
      }}
    />
  </Stack>


}