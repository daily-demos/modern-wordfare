import NoMeetingToken from "./errors/noMeetingToken";
import { MeetingToken, Team } from "./types";
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

export function getMeetingTokenCookieName(gameID: string): string {
  return `mt-${gameID}`;
}

export function tryGetMeetingToken(
  cookies: string,
  gameID: string
): MeetingToken {
  const parts = cookies.split(`${getMeetingTokenCookieName(gameID)}=`);
  if (parts.length !== 2) {
    throw new NoMeetingToken();
  }
  const val = parts.pop().split("; ").shift();
  return val;
}
