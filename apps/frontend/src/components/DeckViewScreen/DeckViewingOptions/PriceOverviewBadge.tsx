import React from "react";
import {useDeckDataContext} from "../../../context/DeckDataContext.tsx";
import {Badge} from "@mantine/core";

function PriceOverviewBadge() {
  const {deck} = useDeckDataContext();

  const priceTotal = Math.round(
    Object.values(deck)
      .flatMap(section => Object.values(section))
      .reduce(
        (total, card) => total + (parseFloat(card?.prices?.usd ?? "0") * card.count || 0),
        0
      ) * 100
  ) / 100;

  return (
    <Badge variant={"outline"}>
      ${priceTotal}
    </Badge>
  );
}

export default PriceOverviewBadge;