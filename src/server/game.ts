import DuplicatePlayer from "../shared/errors/duplicatePlayer";
import InvalidWord from "../shared/errors/invalidWord";
import WordAlreadyRevealed from "../shared/errors/wordAlreadyRevealed";
import InvalidTurn from "../shared/errors/invalidTurn";
import SpymasterExists from "../shared/errors/spymasterExists";
import PlayerNotFound from "../shared/errors/playerNotFound";
import { TurnResultData } from "../shared/events";
import { Team, TeamResult } from "../shared/types";
import { DAILY_DOMAIN } from "./env";
import { wordKindToTeam } from "../shared/util";
import { Word, WordKind } from "../shared/word";
import Player from "../shared/player";

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

  wordSet: Word[];

  players: Player[] = [];

  private team1SpymasterID: string;

  private team2SpymasterID: string;

  currentTurn = Team.None;

  teamResults: { [key in Team]?: TeamResult } = {
    team1: {
      team: Team.Team1,
      wordsLeft: 0,
      isAssassinated: false,
    },
    team2: {
      team: Team.Team2,
      wordsLeft: 0,
      isAssassinated: false,
    },
  };

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

    for (let i = 0; i < wordSet.length; i += 1) {
      const w = wordSet[i];
      const team = wordKindToTeam(w.kind);
      if (team !== Team.None) {
        this.teamResults[team].wordsLeft += 1;
      }
    }
    console.log("team results:", this.teamResults);
  }

  addPlayer(playerID: string, team: Team) {
    // See if this player is already on one of the teams
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === playerID) {
        throw new DuplicatePlayer(p.id, p.team);
      }
    }
    const p = new Player(playerID, team);
    this.players.push(p);
  }

  removePlayer(playerID: string) {
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === playerID) {
        this.players.splice(i, 1);
        return;
      }
    }
    throw new PlayerNotFound(playerID);
  }

  setSpymaster(id: string): Player {
    let player: Player = null;
    // First, find this player in our player list
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === id) {
        player = p;
        break;
      }
    }
    if (!player) {
      throw new PlayerNotFound(id);
    }
    const { team } = player;
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
    if (this.state !== GameState.Playing) {
      this.state = GameState.Playing;
    }
    if (!this.currentTurn || this.currentTurn === Team.Team2) {
      this.currentTurn = Team.Team1;
    } else {
      this.currentTurn = Team.Team2;
    }
  }

  selectWord(wordVal: string, playerID: string): TurnResultData {
    let word: Word;

    // First, confirm that this is actually a valid word in our game
    for (let i = 0; i < this.wordSet.length; i += 1) {
      const w = this.wordSet[i];
      const val = w.value;
      if (val === wordVal) {
        if (w.isRevealed) {
          throw new WordAlreadyRevealed(val);
        }
        word = w;
      }
    }

    if (!word) {
      throw new InvalidWord(wordVal);
    }

    // Find the given player:
    let player: Player;
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === playerID) {
        player = p;
        break;
      }
    }
    if (!player) {
      throw new PlayerNotFound(playerID);
    }

    // Check if this player is allowed to even select a word
    if (player.team !== this.currentTurn) {
      throw new InvalidTurn();
    }
    word.isRevealed = true;

    const teamRes = this.teamResults[player.team];

    const wordTeam = wordKindToTeam(word.kind);
    if (wordTeam !== Team.None) {
      this.teamResults[wordTeam].wordsLeft -= 1;
    } else if (word.kind === WordKind.Assassin) {
      teamRes.isAssassinated = true;
    }

    // If no turn is toggled, newCurrentTurn is set to no team
    let newCurrentTurn = Team.None;
    if (wordTeam !== player.team) {
      console.log("wordTeam, playerTeam", wordVal, word, wordTeam, player.team);
      this.nextTurn();
      newCurrentTurn = this.currentTurn;
    }

    return <TurnResultData>{
      team: player.team,
      lastRevealedWord: word,
      newCurrentTurn,
    };
  }

  getRevealedWordVals(): string[] {
    const revealed: string[] = [];
    for (let i = 0; i < this.wordSet.length; i += 1) {
      const w = this.wordSet[i];
      if (w.isRevealed) {
        revealed.push(w.value);
      }
    }

    return revealed;
  }

  restart(newWordSet: Word[]) {
    this.players = [];
    this.team1SpymasterID = null;
    this.team2SpymasterID = null;
    this.wordSet = newWordSet;
    this.currentTurn = Team.None;
  }
}
