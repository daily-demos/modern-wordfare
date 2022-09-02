import { Word } from "./word";

export interface CreateGameRequest {
  gameName: string;
  wordSet: Word[];
  playerName: string;
}

export interface CreateGameResponse {
  roomURL: string;
  gameID: string;
  wordSet: Word[];
}

export interface JoinGameRequest {
  gameID: string;
}

export interface JoinGameResponse {
  gameName: string;
  roomURL: string;
  wordSet: Word[];
  meetingToken: string;
}

export enum Team {
  None = "none",
  Team1 = "team1",
  Team2 = "team2",
}

export interface TeamResult {
  team: Team;
  wordsLeft: number;
  isAssassinated: boolean;
}
