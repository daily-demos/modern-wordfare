import {
  DuplicatePlayer,
  PlayerNotFound,
  SpymasterExists,
} from "../shared/error";
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
  private team1SpymasterID: string;
  private team2SpymasterID: string;
  currentTurn: Team;

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

  setSpymaster(id: string): Player {
    let player: Player = null;
    // First, find this player in our player list
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      if (p.id === id) {
        player = p;
        break;
      }
    }
    if (!player) {
      throw new PlayerNotFound(id);
    }
    const team = player.team;
    if (team === Team.Team1) {
      if (!this.team1SpymasterID) {
        this.team1SpymasterID = id;
        player.isSpymaster = true;
        return player;
      }
      throw new SpymasterExists(player.team);
    }

    if (team === Team.Team2) {
      if (!this.team2SpymasterID) {
        this.team2SpymasterID = id;
        player.isSpymaster = true;
        return player;
      }
      throw new SpymasterExists(player.team);
    }

    throw new Error(`player team unrecognized: ${player.team}`);
  }

  spymastersReady(): boolean {
    return !!(this.team1SpymasterID && this.team2SpymasterID);
  }

  nextTurn() {
    if (!this.currentTurn || this.currentTurn === Team.Team2) {
      this.currentTurn = Team.Team1;
      return;
    }
    this.currentTurn = Team.Team2;
  }
}
