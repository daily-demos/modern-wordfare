import NoMeetingToken from "./errors/noMeetingToken";
import { MeetingToken, Team } from "./types";
import { Word, WordKind } from "./word";

export const meetingTokenCookieName = "meetingToken";

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

export function tryGetMeetingToken(cookies: string): MeetingToken {
  const parts = cookies.split(`${meetingTokenCookieName}=`);
  if (parts.length !== 2) {
    throw new NoMeetingToken();
  }
  const val = parts.pop().split("; ").shift();
  return parseCookie(val);
}

export function getCookieVal(token: string, gameID: string): string {
  return `${token}-gameID-${gameID}`;
}

function parseCookie(cookie: string): MeetingToken {
  const parts = cookie.split("-gameID-");
  const l = parts.length;
  if (l !== 2) {
    throw new Error(`cookie format invalid. Expected 2 parts, got ${l}`);
  }
  return <MeetingToken>{
    token: parts[0],
    gameID: parts[1],
  };
}
