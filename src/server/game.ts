import DuplicatePlayer from "../shared/errors/duplicatePlayer";
import InvalidWord from "../shared/errors/invalidWord";
import WordAlreadyRevealed from "../shared/errors/wordAlreadyRevealed";
import InvalidTurn from "../shared/errors/invalidTurn";
import SpymasterExists from "../shared/errors/spymasterExists";
import PlayerNotFound from "../shared/errors/playerNotFound";
import { TurnResultData } from "../shared/events";
import { Team, TeamResult } from "../shared/types";
import { getOtherTeam, wordKindToTeam } from "../shared/util";
import { Word, WordKind } from "../shared/word";
import Player from "../shared/player";
import { rand } from "../client/util/math";

export enum GameState {
  Unknown = 0,
  Pending,
  Playing,
  Ended,
}

// Game (server-side) manages all game state,
// including toggling turns, keeping score,
// validating player actions, etc.
export class Game {
  readonly id: string;

  readonly name: string;

  readonly dailyRoomURL: string;

  readonly dailyRoomName: string;

  state: GameState;

  wordSet: Word[];

  players: Player[] = [];

  private spymasters: { [key in Team]?: string } = {
    team1: null,
    team2: null,
  };

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
    this.id = roomName;

    // Count how many words each team has to guess
    for (let i = 0; i < wordSet.length; i += 1) {
      const w = wordSet[i];
      const team = wordKindToTeam(w.kind);
      if (team !== Team.None) {
        this.teamResults[team].wordsLeft += 1;
      }
    }
  }

  // addPlayer() adds player to the given team
  addPlayer(playerID: string, team: Team): Player {
    // See if this player is already on one of the teams
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === playerID) {
        if (p.team === team) {
          throw new DuplicatePlayer(p.id, p.team);
        }
        // Move player to new team
        p.team = team;
        return p;
      }
    }
    // If player does not exist yet, create it
    const p = new Player(playerID, team);
    this.players.push(p);
    return p;
  }

  // removePlayer() removes a player from he game by ID
  removePlayer(playerID: string) {
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === playerID) {
        this.players.splice(i, 1);
        if (p.isSpymaster) {
          this.spymasters[p.team] = null;
        }
        return;
      }
    }
    throw new PlayerNotFound(playerID);
  }

  // setSpymaster() sets the given player as spymaster for
  // the given team.
  setSpymaster(playerID: string, team: Team): Player {
    // If the given team already has a spymaster,
    // throw an error
    if (this.spymasters[team]) {
      throw new SpymasterExists(team);
    }

    let player: Player;

    // Check if player is already a member of a team
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === playerID) {
        player = p;

        // If player is already a spymaster for the
        // other team, remove them.
        const otherTeam = getOtherTeam(team);

        if (
          p.isSpymaster &&
          p.team === otherTeam &&
          this.spymasters[otherTeam] === player.id
        ) {
          this.spymasters[otherTeam] = null;
        }

        // If player is already a member of the team
        // being requested to join, just set them as
        // spymaster.
        if (p.team === team) {
          break;
        }

        // Move player to requested team
        p.team = team;
        player.isSpymaster = true;
        break;
      }
    }

    // If player doesn't already exist, create one
    if (!player) {
      player = this.addPlayer(playerID, team);
    }

    this.spymasters[team] = player.id;
    player.isSpymaster = true;
    return player;
  }

  // spymastersReady() returns true if both teams have a spymaster
  spymastersReady(): boolean {
    return !!(this.spymasters[Team.Team1] && this.spymasters[Team.Team2]);
  }

  // nextTurn() toggles the next turn of the round
  nextTurn() {
    // Update game state if play has not already started
    if (this.state !== GameState.Playing) {
      this.state = GameState.Playing;
    }
    // If no team has yet gotten its turn, pick a first turn
    // at random.
    if (!this.currentTurn || this.currentTurn === Team.None) {
      const r = rand(0, 1);
      if (r === 0) {
        this.currentTurn = Team.Team1;
        return;
      }
      this.currentTurn = Team.Team2;
      return;
    }

    // Toggle turn to other team
    const otherTeam = getOtherTeam(this.currentTurn);
    this.currentTurn = otherTeam;
  }

  // selectWord() attempts to select the given word by the given player ID
  selectWord(wordVal: string, playerID: string): TurnResultData {
    let word: Word;

    // Iterate through all words in the game and try to find the one
    // the player is trying to select.
    for (let i = 0; i < this.wordSet.length; i += 1) {
      const w = this.wordSet[i];
      const val = w.value;
      // If the value matches the word being selected and has already
      // been revealed, throw an error. Otherwise, set our word and
      // break out of the loop.
      if (val === wordVal) {
        if (w.isRevealed) {
          throw new WordAlreadyRevealed(val);
        }
        word = w;
        break;
      }
    }

    // If word was not found, throw an error
    if (!word) {
      throw new InvalidWord(wordVal);
    }

    // Find the player ID which is selecting the word
    let player: Player;
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.id === playerID) {
        player = p;
        break;
      }
    }

    // If player was not found, throw an error
    if (!player) {
      throw new PlayerNotFound(playerID);
    }

    // Check if it is the player's turn to make a selection.
    // If not, throw an error.
    if (player.team !== this.currentTurn) {
      throw new InvalidTurn();
    }

    word.isRevealed = true;

    // Update the team results based o the selection
    const teamRes = this.teamResults[player.team];

    const wordTeam = wordKindToTeam(word.kind);
    if (wordTeam !== Team.None) {
      this.teamResults[wordTeam].wordsLeft -= 1;
    } else if (word.kind === WordKind.Assassin) {
      teamRes.isAssassinated = true;
    }

    // If no new turn is toggled, newCurrentTurn is set to no team
    let newCurrentTurn = Team.None;
    if (wordTeam !== player.team) {
      this.nextTurn();
      newCurrentTurn = this.currentTurn;
    }

    return <TurnResultData>{
      team: player.team,
      lastRevealedWord: word,
      newCurrentTurn,
    };
  }

  // getRevealedWordVals() returns an array of all word values
  // which have already been revealed
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

  // restart() resets the game's state
  restart(newWordSet: Word[]) {
    this.players = [];
    this.spymasters[Team.Team1] = null;
    this.spymasters[Team.Team2] = null;
    this.wordSet = newWordSet;
    this.currentTurn = Team.None;
    this.teamResults = {
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

    for (let i = 0; i < newWordSet.length; i += 1) {
      const w = newWordSet[i];
      const team = wordKindToTeam(w.kind);
      if (team !== Team.None) {
        this.teamResults[team].wordsLeft += 1;
      }
    }
    this.state = GameState.Pending;
  }
}
