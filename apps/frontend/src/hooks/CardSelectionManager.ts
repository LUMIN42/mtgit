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


  //
  //
  // const [selectedId, setSelectedId] = useState<string | null>(null);
  // const [leftLocation, setLeftLocation] = useState<CardLocation | null>(null);
  // const [rightLocation, setRightLocation] = useState<CardLocation | null>(null);
  //

  //
  // function setIndex(idx: number) {
  //   setLeftLocation(
  //     cards[idx - 1] ?? null
  //   );
  //   setRightLocation(
  //     cards[idx + 1] ?? null
  //   );
  //
  //   setSelectedId(
  //     cards[idx].oracle_id
  //   );
  // }
  //
  // function navigateLeft() {
  //   setSelectedLocation(leftLocation);
  // }
  //
  // function navigateRight() {
  //   setSelectedLocation(rightLocation);
  // }
  //
  // function setSelectedLocation(location: CardLocation) {
  //   setIndex(index(location));
  // }
  //
  // const hasNextLeft = leftLocation !== null;
  // const hasNextRight = rightLocation !== null;
  //
  // return {
  //   selectedId,
  //   setSelectedLocation,
  //   hasNextLeft,
  //   hasNextRight,
  //   navigateLeft,
  //   navigateRight,
  //   setSelectedId
  // };
}