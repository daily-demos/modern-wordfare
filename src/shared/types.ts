export interface ICreateGameRequest {
  gameName: string;
  wordSet: Word[];
}

export interface ICreateGameResponse {
  roomUrl: string;
  meetingToken: string;
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
