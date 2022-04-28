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

export enum Team {
  None = 0,
  Team1,
  Team2,
}

export type Word = {
  word: string;
  kind: WordKind;
};

export class Player {
  id: string;
  team: Team = Team.None;

  constructor(id: string, team: Team) {
    this.id = id;
    this.team = team;
  }
}
