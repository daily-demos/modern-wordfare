import { DuplicatePlayer } from "../shared/error";
import { Player, Team, Word } from "../shared/types";
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
  players: Player[] = [];

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

  addPlayer(id: string, team: Team) {
    // See if this player is already on one of the teams
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      if (p.id === id) {
        throw new DuplicatePlayer(p.id, p.team);
      }
    }
    const p = new Player(id, team);
    this.players.push(p);
  }
}
