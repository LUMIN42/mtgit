/**
 * What comparisons in a parsed query mean, shared by all evaluators
 * (the API's mongo compiler and the frontend's in-memory filter), so they agree.
 */

import type {Comparison, Rarity} from "./ast.js";
import {RARITIES} from "./ast.js";

/**
 * @returns whether `value <comparison> target` holds.
 */
export function compareNumbers(value: number, comparison: Comparison, target: number): boolean {
  switch (comparison) {
    case "=":
      return value === target;
    case "!=":
      return value !== target;
    case ">":
      return value > target;
    case ">=":
      return value >= target;
    case "<":
      return value < target;
    case "<=":
      return value <= target;
  }
}

/**
 * @returns the rarities satisfying `rarity <comparison> target`, using the order of {@link RARITIES}.
 */
export function raritiesMatching(comparison: Comparison, target: Rarity): Rarity[] {
  const targetIndex = RARITIES.indexOf(target);

  return RARITIES.filter((_, index) => compareNumbers(index, comparison, targetIndex));
}
