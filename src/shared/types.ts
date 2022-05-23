import { Word } from "./word";

export interface ICreateGameRequest {
  gameName: string;
  wordSet: Word[];
  playerName: string;
}

export interface ICreateGameResponse {
  roomURL: string;
  gameID: string;
  meetingToken: string;
  wordSet: Word[];
}

export interface IJoinGameRequest {
  gameID: string;
}

export interface IJoinGameResponse {
  gameName: string;
  roomURL: string;
  wordSet: Word[];
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
