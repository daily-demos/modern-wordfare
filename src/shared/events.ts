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
