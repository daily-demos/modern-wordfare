export interface ICreateGameRequest {
  gameName: string;
  wordSet: Word[];
}

export interface ICreateGameResponse {
  roomURL: string;
  gameID: string;
  meetingToken: string;
}

export interface IJoinGameRequest {
  gameID: string;
}

export interface IJoinGameResponse {
  gameName: string;
  roomURL: string;
  wordSet: Word[];
}

export enum WordKind {
  Neutral = 0,
  Team1,
  Team2,
  Assassin,
}

export type Word = {
  word: string;
  kind: WordKind;
};
