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
  None = "none",
  Team1 = "team1",
  Team2 = "team2",
}

export class Player {
  id: string;

  team: Team = Team.None;

  isSpymaster: boolean;

  constructor(id: string, team: Team) {
    this.id = id;
    this.team = team;
  }
}

export class Word {
  readonly value: string;
  readonly kind: WordKind;
  isRevealed: boolean;

  constructor(val: string, kind: WordKind) {
    this.value = val;
    this.kind = kind;
  }
}

export interface TeamResult {
  team: Team;
  wordsLeft: number;
  isAssassinated: boolean;
}
