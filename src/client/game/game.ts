import { io, Socket } from "socket.io-client";
import { DailyParticipant } from "@daily-co/daily-js";
import { Board, BoardData, updateMedia } from "./board";
import {
  BecomeSpymasterData,
  becomeSpymasterEventName,
  GameData,
  gameDataDumpEventName,
  JoinedTeamData,
  joinedTeamEventName,
  JoinGameData,
  joinGameEventName,
  JoinTeamData,
  joinTeamEventName,
  newSpymasterEventName,
  TurnData,
  nextTurnEventName,
  SpymasterData,
  errorEventName,
  turnResultEventName,
  wordSelectedEventName,
  SelectedWordData,
  TurnResultData,
  restartGameEventName,
  RestartGameData,
  gameRestartedEventName,
  GameRestartedData,
  endTurnEventName,
  EndTurnData,
  playerLeftGameEventName,
  PlayerLeftData,
} from "../../shared/events";
import { Call } from "../daily";
import {
  registerCamBtnListener,
  registerEndTurnBtnListener,
  registerInviteBtnListener,
  registerLeaveBtnListener,
  registerMicBtnListener,
  updateCamBtnState,
  updateMicBtnState,
} from "./nav";
import createWordSet from "../util/word";
import { Team } from "../../shared/types";
import ErrTileAlreadyExists from "./errors/errTileAlreadyExists";

import joinedAudio from "../assets/audio/joined.wav";

// Game (client-side) manages three main components of our application:
// * The play board/space
// * The Daily call
// * Interaction with the game server
export default class Game {
  socket: Socket;

  call: Call;

  private localPlayerID: string;

  private joinedAt: number;

  private board: Board;

  private data: BoardData;

  private pendingTiles: { [key: string]: ReturnType<typeof setInterval> } = {};

  // start() starts the game with the given board data
  start(boardData: BoardData) {
    const g = document.getElementById("game");
    g.classList.remove("invisible");

    const c = document.getElementById("container");
    c.classList.add("gradient-bg");
    this.data = boardData;
    this.setupCall(boardData);
    this.setupSocket();
  }

  // onClickWord() is invoked when a player in an active team
  // clicks on a word on the board.
  private onClickWord(wordVal: string) {
    const data = <SelectedWordData>{
      gameID: this.data.gameID,
      wordValue: wordVal,
      playerID: this.localPlayerID,
    };
    this.socket.emit(wordSelectedEventName, data);
  }

  // onJoinTeam() is invoked when a player clicks one of the
  // team join buttons.
  private onJoinTeam(team: Team) {
    const data = <JoinTeamData>{
      gameID: this.data.gameID,
      sessionID: this.localPlayerID,
      teamID: team,
    };
    this.socket.emit(joinTeamEventName, data);
  }

  // onBeSpymaster() is invoked when a player clicks a button
  // to join a team as a spymaster.
  private onBeSpymaster(team: Team) {
    const resData = <BecomeSpymasterData>{
      gameID: this.data.gameID,
      sessionID: this.localPlayerID,
      team,
    };
    this.socket.emit(becomeSpymasterEventName, resData);
  }

  // showGameOver() displays the game over div with
  // an option to restart the game.
  private showGameOver(winningTeam: Team) {
    const gameOverDiv = document.getElementById("gameOver");
    gameOverDiv.classList.remove("invisible");
    const teamName = <HTMLSpanElement>(
      gameOverDiv.getElementsByClassName("teamName")[0]
    );
    teamName.innerText = winningTeam;
    const btn = <HTMLButtonElement>(
      gameOverDiv.getElementsByTagName("button")[0]
    );
    btn.onclick = () => {
      this.restart();
    };
  }

  // setupCall() joins the game's Daily video call,
  // and creates an instance of the Board class
  private setupCall(bd: BoardData) {
    // Create Daily call
    this.call = new Call(bd.roomURL, bd.playerName, bd.meetingToken);

    // Start call event handler registration
    this.call.registerJoinedMeetingHandler((player: DailyParticipant) => {
      this.handleJoinedMeeting(player);
    });

    this.call.registerParticipantJoinedHandler((p) => {
      this.handleParticipantJoined(p);
    });

    this.call.registerParticipantLeftHandler((p) => {
      this.board.eject(p.participant.session_id);
    });

    this.call.registerParticipantUpdatedHandler((p) => {
      if (p.local) {
        updateCamBtnState(p.video);
        updateMicBtnState(p.audio);
      }
    });

    this.call.registerTrackStartedHandler((p) => {
      const tracks = Call.getParticipantTracks(p.participant);
      try {
        updateMedia(p.participant.session_id, tracks);
      } catch (e) {
        console.warn(e);
      }
    });

    this.call.registerTrackStoppedHandler((p) => {
      const tracks = Call.getParticipantTracks(p.participant);
      try {
        updateMedia(p.participant.session_id, tracks);
      } catch (e) {
        console.warn(e);
      }
    });
    // End call event handler registration

    // Join the call
    this.call.join();

    // Start call control setup
    registerCamBtnListener(() => {
      this.call.toggleLocalVideo();
    });

    registerMicBtnListener(() => {
      this.call.toggleLocalAudio();
    });

    registerInviteBtnListener(() => {
      navigator.clipboard.writeText(
        `${window.location.origin}?gameID=${bd.gameID}`
      );
    });

    registerLeaveBtnListener(() => {
      this.call.leave();
      document.location.href = "/";
    });
    // End call control setup
  }

  // setupSocket() sets up a socket connection
  // to the game server
  private setupSocket() {
    const socket: Socket = io();
    this.socket = socket;
    socket.connect();

    // Start server socket event handling
    socket.on(errorEventName, (err: Error) => {
      console.error("received error from socket: ", err);
    });

    socket.on(joinedTeamEventName, (data: JoinedTeamData) => {
      const p = this.call.getParticipant(data.sessionID);
      if (!p) {
        console.error(`failed to find participant with ID ${data.sessionID}`);
        return;
      }
      // Move participant to the team they just joined
      this.board.moveToTeam(p, data.teamID, true);

      // Set up end turn button listener
      registerEndTurnBtnListener(data.teamID, () => {
        this.socket.emit(endTurnEventName, <EndTurnData>{
          gameID: this.data.gameID,
          playerID: this.localPlayerID,
        });
      });
    });

    socket.on(gameDataDumpEventName, (data: GameData) => {
      this.processDataDump(data);
    });

    socket.on(newSpymasterEventName, (data: SpymasterData) => {
      const p = this.call.getParticipant(data.spymasterID);
      if (!p) {
        console.error(`failed to find participant with ID ${data.spymasterID}`);
        return;
      }
      // Move participant to relevant team and make them
      // a spymaster.
      this.board.moveToTeam(p, data.teamID, true);
      this.board.makeSpymaster(data.spymasterID, data.teamID);
    });

    socket.on(nextTurnEventName, (data: TurnData) => {
      this.board.toggleCurrentTurn(data.currentTurn);
    });

    socket.on(turnResultEventName, (data: TurnResultData) => {
      const winningTeam = this.board.processTurnResult(
        data.team,
        data.lastRevealedWord
      );
      // If there is a winning team, display
      // the game over UI
      if (winningTeam !== Team.None) {
        this.showGameOver(winningTeam);
      }
    });

    socket.on(gameRestartedEventName, (data: GameRestartedData) => {
      this.handleGameRestarted(data);
    });

    socket.on(playerLeftGameEventName, (data: PlayerLeftData) => {
      this.board.eject(data.playerID);
    });
    // End server socket event handling
  }

  private restart() {
    const newWordSet = createWordSet();
    this.socket.emit(restartGameEventName, <RestartGameData>{
      gameID: this.data.gameID,
      newWordSet,
    });
  }

  private clearPendingTile(sessionID: string) {
    clearInterval(this.pendingTiles[sessionID]);
    delete this.pendingTiles[sessionID];
  }

  // handleJoinedMeeting() handles the local player
  // once they have joined the Daily video call
  private handleJoinedMeeting(player: DailyParticipant) {
    this.joinedAt = Date.now();
    const audio = new Audio(joinedAudio);
    audio.play();

    this.localPlayerID = player.session_id;

    // Create a new game board
    this.board = new Board(
      this.data,
      this.localPlayerID,
      (val: string) => {
        this.onClickWord(val);
      },
      (team: Team) => {
        this.onJoinTeam(team);
      },
      (team: Team) => {
        this.onBeSpymaster(team);
      }
    );

    const data = <JoinGameData>{
      gameID: this.data.gameID,
    };

    // Ask game server to join the game, which
    // will result in a data dump being sent back
    this.socket.emit(joinGameEventName, data);
    this.board.showBoardElements();

    // Show call controls
    const controlsDOM = document.getElementById("controls");
    controlsDOM.classList.remove("hidden");
    const localID = this.localPlayerID;
    const p = this.call.getParticipant(localID);
    try {
      this.board.createTile(p, Team.None);
    } catch (e) {
      if (e instanceof ErrTileAlreadyExists) return;
      throw e;
    }
  }

  // handleParticipantJoined() handles a remote participant
  // joining the Daily call.
  private handleParticipantJoined(p: DailyParticipant) {
    // If the local participant joined more than 3 seconds ago,
    // play the participant joined chime. We have this check
    // to make sure that we don't play multiple chimes in close
    // succession when the local user is first joining the call.
    if (Date.now() - this.joinedAt > 3000) {
      const audio = new Audio(joinedAudio);
      audio.play();
    }
    try {
      this.board.createTile(p, Team.None);
    } catch (e) {
      if (e instanceof ErrTileAlreadyExists) return;
      throw e;
    }
  }

  // processDataDump() processes game data sent from
  // the game server once a user joins the game.
  private processDataDump(data: GameData) {
    this.board.processDataDump(data);

    // Iterate through all players who are registered
    // in the game.
    for (let i = 0; i < data.players.length; i += 1) {
      const player = data.players[i];

      // We do this in a setInterval in case the server gave us
      // all the players _before_ the Daily call made them available
      this.pendingTiles[player.id] = setInterval(() => {
        // Get Daily participant for this player ID
        const participant = this.call.getParticipant(player.id);
        if (!participant) {
          return;
        }
        // If participant is found, clear pendin interval
        // and create tile.
        this.clearPendingTile(player.id);
        this.board.createTile(participant, player.team);
        if (player.isSpymaster) {
          this.board.makeSpymaster(player.id, player.team);
        }
      }, 1000);
    }
  }

  // handleGameRestarted() restarts the game with
  // the given game data.
  private handleGameRestarted(data: GameRestartedData) {
    // Remove game over screen
    document.getElementById("gameOver").classList.add("invisible");

    // Move all participant tiles back to observers
    this.board.moveToObservers(this.call.getParticipants());

    this.data.wordSet = data.newWordSet;

    // Destroy current board and create a new one.
    Board.destroy();
    this.board = new Board(
      this.data,
      this.localPlayerID,
      (val: string) => {
        this.onClickWord(val);
      },
      (team: Team) => {
        this.onJoinTeam(team);
      },
      (team: Team) => {
        this.onBeSpymaster(team);
      }
    );
    this.board.showBoardElements();

    // Rejoin the game.
    const joinGameData = <JoinGameData>{
      gameID: this.data.gameID,
    };

    this.socket.emit(joinGameEventName, joinGameData);
  }
}
