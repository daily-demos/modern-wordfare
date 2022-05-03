import { Team, WordKind } from "./types";

export default function wordKindToTeam(wk: WordKind): Team {
  if (wk === WordKind.Team1) {
    return Team.Team1;
  }
  if (wk === WordKind.Team2) {
    return Team.Team2;
  }
  return Team.None;
}
