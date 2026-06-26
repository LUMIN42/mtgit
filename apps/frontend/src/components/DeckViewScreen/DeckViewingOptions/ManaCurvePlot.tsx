import {InputLabel, Stack} from "@mantine/core";
import {BarChart} from "@mantine/charts";
import {useCallback, useMemo} from "react";
import {getGroupHeadingId} from "../../../utils/cardGrouping.ts";
import {useDeckDataContext} from "../../../context/DeckDataContext.tsx";
import {useDeckUiContext} from "../../../context/DeckUiContext.tsx";

export function ManaCurvePlot() {
  const {filteredDeck} = useDeckDataContext();
  const {groupingMode} = useDeckUiContext();

  /**
   * Build mana curve data (stable + memoized)
   */
  const manaCurveData = useMemo(() => {
    const countsPerCMC: Record<number, number> = {};

    for (const card of filteredDeck.sections.Main) {
      if (card.type_line.toLowerCase().includes("land")) {
        continue;
      }

      const cmc = Math.min(Math.floor(card.cmc), 10);
      countsPerCMC[cmc] = (countsPerCMC[cmc] || 0) + 1;
    }

    return Object.entries(countsPerCMC).map(([cmc, count]) => ({
      cmc: cmc === "10" ? "10+" : cmc,
      cards: count
    }));
  }, [filteredDeck.sections.Main]);

  /**
   * Stable click handler
   */
  const handleChartClick = useCallback(
    (data: {activeLabel?: string | number}) => {
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
        block: "start"
      });
    },
    [groupingMode]
  );

  /**
   * Stable tooltip props (prevents WDYR noise)
   */
  const tooltipProps = useMemo(
    () => ({
      contentStyle: {
        fontSize: 11,
        padding: 0
      },
      itemStyle: {
        fontSize: 11,
        padding: 0
      },
      labelStyle: {
        fontSize: 10,
        marginBottom: 0
      }
    }),
    []
  );

  /**
   * Stable chart props
   */
  const barChartProps = useMemo(
    () => ({
      onClick: handleChartClick,
      style: {
        cursor: groupingMode === "manaValue" ? "pointer" : "default"
      }
    }),
    [handleChartClick, groupingMode]
  );

  return (
    <Stack gap={0}>
      <InputLabel size="xs">Mana Curve:</InputLabel>

      <BarChart
        h={170}
        data={manaCurveData}
        dataKey="cmc"
        series={[
          {
            name: "cards",
            color: "orange.3"
          }
        ]}
        withLegend={false}
        barChartProps={barChartProps}
        tooltipProps={tooltipProps}
      />
    </Stack>
  );
}