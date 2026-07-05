import {useState} from "react";
import {CardLocation} from "../types/addressedCards.ts";

function equalRecords(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  for (const key in a) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function useCardSelectionManager(
  cards: CardLocation[]
) {
  const [selectedId, setSelectedId] = useState<string | null>();
  const [leftLocation, setLeftLocation] = useState<CardLocation | null>(null);
  const [rightLocation, setRightLocation] = useState<CardLocation | null>(null);

  function index(location: CardLocation): number {
    const foundIndex = cards.findIndex(
      card => card.oracle_id === location.oracle_id
        &&
        equalRecords(card.location, location.location)
    );

    if (foundIndex === -1) {
      throw new Error(`Could not find location ${location}`);
    }

    return foundIndex;
  }

  function setIndex(idx: number) {
    setLeftLocation(
      cards[idx - 1] ?? null
    );
    setRightLocation(
      cards[idx + 1] ?? null
    );

    setSelectedId(
      cards[idx].oracle_id
    );
  }

  function navigateLeft() {
    setIndex(index(leftLocation));
  }

  function navigateRight() {
    setIndex(index(rightLocation));
  }

  const hasNextLeft = leftLocation === null;
  const hasNextRight = rightLocation === null;

  return {
    selectedId,
    setSelectedId,
    hasNextLeft,
    hasNextRight,
    navigateLeft,
    navigateRight
  };
}