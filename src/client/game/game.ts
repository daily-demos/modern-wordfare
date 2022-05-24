import { io, Socket } from "socket.io-client";
import { DailyParticipant } from "@daily-co/daily-js";
import { Board, BoardData, removeTile, updateMedia } from "./board";
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
  leaveGameEventName,
  restartGameEventName,
  RestartGameData,
  gameRestartedEventName,
  GameRestartedData,
  endTurnEventName,
  EndTurnData,
  playerLeftgameEventName,
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

  start(boardData: BoardData) {
    const g = document.getElementById("game");
    g.classList.remove("invisible");
    this.data = boardData;
    this.setupCall(boardData);
    this.setupSocket();
  }

  private onClickWord(wordVal: string) {
    const data = <SelectedWordData>{
      gameID: this.data.gameID,
      wordValue: wordVal,
      playerID: this.localPlayerID,
    };
    console.log("selecting word", data.wordValue);
    this.socket.emit(wordSelectedEventName, data);
  }

  private onJoinTeam(team: Team) {
    console.log("this, board", this, this.board);
    const data = <JoinTeamData>{
      gameID: this.data.gameID,
      sessionID: this.localPlayerID,
      teamID: team,
    };
    console.log("joining team", data.sessionID, data.teamID);
    this.socket.emit(joinTeamEventName, data);
  }

  private onBeSpymaster(team: Team) {
    const resData = <BecomeSpymasterData>{
      gameID: this.data.gameID,
      sessionID: this.localPlayerID,
      team,
    };
    this.socket.emit(becomeSpymasterEventName, resData);
  }

  private showGameOver(winningTeam: Team) {
    console.log("showing game over!");
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

  private setupCall(bd: BoardData) {
    this.call = new Call(bd.roomURL, bd.playerName, bd.meetingToken);

    const controlsDOM = document.getElementById("controls");

    this.call.registerJoinedMeetingHandler((player: DailyParticipant) => {
      this.joinedAt = Date.now();

      this.localPlayerID = player.session_id;

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
        gameID: bd.gameID,
      };

      this.socket.emit(joinGameEventName, data);
      this.board.showBoardElements();
      controlsDOM.classList.remove("hidden");
      const localID = this.localPlayerID;
      const p = this.call.getParticipant(localID);
      try {
        this.board.createTile(p, Team.None);
      } catch (e) {
        if (e instanceof ErrTileAlreadyExists) return;
        throw e;
      }
    });

    this.call.registerParticipantJoinedHandler((p) => {
      console.log("creating tile participant joined", p.user_name, Team.None);
      if (Date.now() - this.joinedAt > 3000) {
        console.log("joinedAudio", joinedAudio);
        const audio = new Audio(joinedAudio);
        audio.play();

        // this.sound.play("joined");
      }
      try {
        this.board.createTile(p, Team.None);
      } catch (e) {
        if (e instanceof ErrTileAlreadyExists) return;
        throw e;
      }
    });

    this.call.registerParticipantLeftHandler((p) => {
      removeTile(p.participant.session_id);
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

    this.call.join();

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
      this.socket.emit(leaveGameEventName);
    });
  }

  private setupSocket() {
    const socket: Socket = io();
    this.socket = socket;
    socket.connect();

    socket.on(errorEventName, (err: Error) => {
      console.error("received error from socket: ", err);
    });

    socket.on(joinedTeamEventName, (data: JoinedTeamData) => {
      const p = this.call.getParticipant(data.sessionID);
      if (!p) {
        console.error(`failed to find participant with ID ${data.sessionID}`);
        return;
      }

      this.board.moveToTeam(p, data.teamID, true);
      registerEndTurnBtnListener(data.teamID, () => {
        this.socket.emit(endTurnEventName, <EndTurnData>{
          gameID: this.data.gameID,
          playerID: this.localPlayerID,
        });
      });
    });

    socket.on(gameDataDumpEventName, (data: GameData) => {
      this.board.processDataDump(data);
      for (let i = 0; i < data.players.length; i += 1) {
        const player = data.players[i];

        // We do this in a setInterval in case the server gave us
        // all the players before the Daily call made them available
        this.pendingTiles[player.id] = setInterval(() => {
          const participant = this.call.getParticipant(player.id);
          if (!participant) {
            return;
          }
          this.clearPendingTile(player.id);
          console.log(
            "creating tile in data dump",
            participant.user_name,
            player.team
          );
          this.board.createTile(participant, player.team);
          console.log("creating tile for player: ", player);
          if (player.isSpymaster) {
            this.board.makeSpymaster(player.id, player.team);
          }
        }, 1000);
      }
    });

    socket.on(newSpymasterEventName, (data: SpymasterData) => {
      const p = this.call.getParticipant(data.spymasterID);
      if (!p) {
        console.error(`failed to find participant with ID ${data.spymasterID}`);
        return;
      }

      this.board.moveToTeam(p, data.teamID, true);
      this.board.makeSpymaster(data.spymasterID, data.teamID);
    });

    socket.on(nextTurnEventName, (data: TurnData) => {
      console.log("next turn event received", data.currentTurn);
      this.board.toggleCurrentTurn(data.currentTurn);
    });

    socket.on(turnResultEventName, (data: TurnResultData) => {
      const winningTeam = this.board.processTurnResult(
        data.team,
        data.lastRevealedWord
      );
      if (winningTeam !== Team.None) {
        this.showGameOver(winningTeam);
      }
    });

    socket.on(gameRestartedEventName, (data: GameRestartedData) => {
      console.log("restarting game");

      // Remove game over screen
      document.getElementById("gameOver").classList.add("invisible");

      // Move all participant tiles back to observers
      console.log("moving all participants to observers");
      this.board.moveToObservers(this.call.getParticipants());

      console.log("new wordset:", data.newWordSet);
      this.data.wordSet = data.newWordSet;

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

      const joinGameData = <JoinGameData>{
        gameID: this.data.gameID,
      };

      this.socket.emit(joinGameEventName, joinGameData);
    });

    socket.on(playerLeftgameEventName, (data: PlayerLeftData) => {
      console.log("removing player", data);
      removeTile(data.playerID);
    });
  }

  private restart() {
    console.log("restarting");
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
}
