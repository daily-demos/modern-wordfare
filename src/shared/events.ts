import { Player, Team } from "./types";

export const joinTeamEventName = "join-team";
export interface JoinTeamData {
  socketID: string;
  gameID: string;
  sessionID: string;
  teamID: Team;
}

export const joinedTeamEventName = "joined-team";
export interface JoinedTeamData {
  sessionID: string;
  teamID: Team;
}

export const gameDataDumpEventName = "game-data-dump";
export interface GameData {
  gameID: string;
  players: Player[];
}

export const joinGameEventName = "join-game";
export interface JoinGameData {
  socketID: string;
  gameID: string;
}

export const becomeSpymasterEventName = "become-spymaster";
export interface BecomeSpymasterData {
  socketID: string;
  gameID: string;
  sessionID: string;
}

export const newSpymasterEventName = "new-spymaster";
export interface SpymasterData {
  spymasterID: string;
  teamID: Team;
}

export const nextTurnEventName = "next-turn";
export interface TurnData {
  currentTurn: Team;
}

export const errorEventName = "srv-error";
