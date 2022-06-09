export enum WordKind {
  Neutral = "neutral",
  Team1 = "team1",
  Team2 = "team2",
  Assassin = "assassin",
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
