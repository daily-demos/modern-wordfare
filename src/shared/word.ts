export enum WordKind {
  Neutral = 0,
  Team1,
  Team2,
  Assassin,
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
