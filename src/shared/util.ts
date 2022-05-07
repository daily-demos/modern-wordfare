import { arrayBuffer } from "stream/consumers";
import { Team, Word, WordKind } from "./types";

export function wordKindToTeam(wk: WordKind): Team {
  if (wk === WordKind.Team1) {
    return Team.Team1;
  }
  if (wk === WordKind.Team2) {
    return Team.Team2;
  }
  return Team.None;
}

export function setContainsDuplicateWords(arr: Word[]): boolean {
  const set = new Set(arr.map((w) => w.value));
  return set.size !== arr.length;
}
