import { Word } from "../shared/types";
import { DAILY_DOMAIN } from "./env";

export enum GameState {
  Unknown = 0,
  Pending,
  Playing,
  Ended,
}

export class Game {
  readonly id: string;
  readonly name: string;
  readonly dailyRoomURL: string;
  readonly dailyRoomName: string;
  state: GameState;
  readonly wordSet: Word[];

  constructor(
    name: string,
    roomURL: string,
    roomName: string,
    wordSet: Word[]
  ) {
    this.state = GameState.Pending;
    this.name = name;
    this.dailyRoomURL = roomURL;
    this.wordSet = wordSet;
    this.dailyRoomName = roomName;
    this.id = `${DAILY_DOMAIN}-${roomName}`;
  }
}
