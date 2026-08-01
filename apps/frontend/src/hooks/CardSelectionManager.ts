import {useState} from "react";
import {CardLocation} from "../types/addressedCards.ts";

function equalRecords(
  a: Record<string, string | null>,
  b: Record<string, string | null>
): boolean {
  for (const key in a) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Handles the card switching logic for {@link CardDetailsModal}
 */
export function useCardSelectionManager() {
  const [locations, setLocations] = useState<CardLocation[]>([]);

  const [index, setIndex] = useState<number | null>(null);

  const hasNextLeft = index === null ? false : index > 0;
  const hasNextRight = index === null ? false : index < locations.length - 1;

  const oracleId = index != null ? locations[index]?.oracle_id : null;

  function findIndexInArray(location: CardLocation, locations: CardLocation[]) {
    const foundIndex = locations.findIndex(
      card => card.oracle_id === location.oracle_id
        &&
        equalRecords(card.location, location.location)
    );

    if (foundIndex === -1) {
      throw new Error(`Could not find location ${location}`);
    }

    return foundIndex;
  }

  function openModal(
    allLocations: CardLocation[],
    selectedLocation: CardLocation
  ) {
    setLocations(allLocations);
    setIndex(
      findIndexInArray(selectedLocation, allLocations)
    );
  }

  function closeModal() {
    setIndex(null);
  }

  function moveLeft() {
    setIndex(index! - 1);
  }

  function moveRight() {
    setIndex(index! + 1);
  }

  return {
    oracleId,
    openModal,
    closeModal,
    moveLeft,
    moveRight,
    hasNextLeft,
    hasNextRight
  };
}