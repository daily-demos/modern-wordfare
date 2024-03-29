import { Team } from "./types";
import { Word, WordKind } from "./word";

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

export function getOtherTeam(team: Team): Team {
  if (team === Team.Team1) {
    return Team.Team2;
  }
  if (team === Team.Team2) {
    return Team.Team1;
  }
  return Team.None;
}
