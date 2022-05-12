import { DailyParticipant } from "@daily-co/daily-js";
import { io, Socket } from "socket.io-client";
import { Team, TeamResult } from "../../../shared/types";
import { Call } from "../../daily";
import "../../html/team.html";
import "../../html/observers.html";
import "../../html/callControls.html";
import "../../html/end.html";

import "../../assets/flare.png";
import "../../assets/audio/joined.wav";
import "../../assets/audio/start.ogg";

import {
  registerCamBtnListener,
  registerEndTurnBtnListener,
  registerInviteBtnListener,
  registerLeaveBtnListener,
  registerMicBtnListener,
} from "./nav";
import WordGrid from "./wordGrid";
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
} from "../../../shared/events";
import createWordSet from "../../util/word";
import { wordKindToTeam } from "../../../shared/util";
import { Word, WordKind } from "../../../shared/word";
import { Time } from "phaser";

export interface BoardData {
  roomURL: string;
  gameID: string;
  playerName: string;
  meetingToken?: string;
  wordSet: Word[];
}

export class Board extends Phaser.Scene {
  private wordGrid: WordGrid;

  call: Call;

  gameID: string;

  controlsDOM: Phaser.GameObjects.DOMElement;

  teamDOMs: { [key in Team]?: Phaser.GameObjects.DOMElement } = {
    none: null,
    team1: null,
    team2: null,
  };

  team = Team.None;

  socket: Socket;

  pendingTiles: { [key: string]: ReturnType<typeof setInterval> } = {};

  private particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager;

  private turnParticleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private isSpymaster: boolean;

  private boardData: BoardData;

  private joinedAt: number;

  constructor() {
    super("Board");
  }

  initialize() {
    Phaser.Scene.call(this, { key: "Board" });
  }

  private restart() {
    const newWordSet = createWordSet();
    this.socket.emit(restartGameEventName, <RestartGameData>{
      gameID: this.gameID,
      newWordSet,
    });
  }

  private clickWord(word: Word) {
    const data = <SelectedWordData>{
      gameID: this.gameID,
      wordValue: word.value,
      playerID: this.call.getPlayerId(),
    };
    this.socket.emit(wordSelectedEventName, data);
  }

  init(boardData: BoardData) {
    this.call = new Call(
      boardData.roomURL,
      boardData.playerName,
      boardData.meetingToken
    );
    this.boardData = boardData;
    this.gameID = boardData.gameID;

    const socket: Socket = io();
    this.socket = socket;
    socket.connect();
    console.log("connecting", socket.id);

    socket.on(errorEventName, (err: Error) => {
      console.error("received error from socket: ", err);
    });

    socket.on(joinedTeamEventName, (data: JoinedTeamData) => {
      const p = this.call.getParticipant(data.sessionID);
      if (!p) {
        console.error(`failed to find participant with ID ${data.sessionID}`);
        return;
      }
      if (p.session_id === this.call.getPlayerId()) {
        this.team = data.teamID;
      }

      console.log(
        "creating tile in joinedTeamEventName",
        p.user_name,
        data.teamID
      );
      this.createTile(p, data.teamID);
      if (data.currentTurn && data.currentTurn !== Team.None) {
        this.toggleCurrentTurn(data.currentTurn);
      }
    });

    socket.on(gameDataDumpEventName, (data: GameData) => {
      if (data.currentTurn && data.currentTurn !== Team.None) {
        this.toggleCurrentTurn(data.currentTurn);
      }

      for (let i = 0; i < data.revealedWordVals.length; i += 1) {
        const val = data.revealedWordVals[i];
        this.wordGrid.revealWord(val, this.team);
      }
      this.setScores(data.scores.team1);
      this.setScores(data.scores.team2);

      for (let i = 0; i < data.players.length; i += 1) {
        const player = data.players[i];

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
          this.createTile(participant, player.team);
          if (player.isSpymaster) {
            this.makeSpymaster(player.id, player.team);
          }
        }, 1000);
      }
    });

    socket.on(newSpymasterEventName, (data: SpymasterData) => {
      this.makeSpymaster(data.spymasterID, data.teamID);
    });

    socket.on(nextTurnEventName, (data: TurnData) => {
      this.toggleCurrentTurn(data.currentTurn);
    });

    socket.on(turnResultEventName, (data: TurnResultData) => {
      this.updateScore(data);
      // Reveal the word;
      this.wordGrid.revealWord(data.lastRevealedWord.value, this.team);
    });

    socket.on(gameRestartedEventName, (data: GameRestartedData) => {
      console.log("restarting game");
      this.call.leave();
      this.socket.disconnect();
      this.boardData.wordSet = data.newWordSet;
      this.scene.restart(boardData);
    });

    socket.on(playerLeftgameEventName, (data: PlayerLeftData) => {
      console.log("removing player", data);
      removeTile(data.playerID);
    });
  }

  private setScores(res: TeamResult) {
    const teamDOM = this.teamDOMs[res.team];
    const score = teamDOM.getChildByID("score");
    score.innerHTML = res.wordsLeft.toString();
  }

  private updateScore(teamRes: TurnResultData) {
    const lastWord = teamRes.lastRevealedWord;
    if (lastWord.kind === WordKind.Assassin) {
      console.log("ASSASSINATED");
      let winningTeam: Team;
      if (teamRes.team === Team.Team1) {
        winningTeam = Team.Team2;
      } else if (teamRes.team) {
        winningTeam = Team.Team1;
      }
      this.showRestart(winningTeam); // TODO
      return;
    }

    const wordTeam = wordKindToTeam(lastWord.kind);
    if (wordTeam === Team.None) {
      return;
    }

    const teamDOM = this.teamDOMs[wordTeam];
    const score = teamDOM.getChildByID("score");
    const wordsLeft: number = +score.innerHTML;

    const newScore = wordsLeft - 1;
    if (newScore === 0) {
      this.showRestart(wordTeam);
      return;
    }
    score.innerHTML = newScore.toString();
  }

  private showRestart(winner: Team) {
    const endDOM = this.add.dom(0, 0).createFromCache("end-dom");
    const name = endDOM.getChildByID("teamName");
    name.innerHTML = winner.toString();
    const x = this.game.canvas.width / 2;
    const y = this.game.canvas.height / 2;
    endDOM.setPosition(x, y).setOrigin(0.5);

    const restartBtn = <HTMLButtonElement>endDOM.getChildByID("restart");
    restartBtn.onclick = () => {
      this.restart();
    };
  }

  private toggleCurrentTurn(currentTurn: Team) {
    const teams = this.getTeamDivs(currentTurn);
    teams.activeTeam.classList.add("active");
    teams.otherTeam.classList.remove("active");

    const teamDOM = this.teamDOMs[currentTurn];
    const tiles = <HTMLDivElement>teamDOM.getChildByID("teamName");
    const effectShape = new Phaser.Geom.Rectangle(
      this.cameras.main.x + teamDOM.x,
      this.cameras.main.y + teamDOM.y,
      tiles.clientWidth,
      tiles.clientHeight
    );

    if (!this.turnParticleEmitter) {
      this.turnParticleEmitter = this.particleManager.createEmitter({
        scale: { start: 0.25, end: 0 },
        blendMode: "ADD",
        emitZone: {
          type: "edge",
          source: effectShape,
          quantity: 48,
          yoyo: false,
        },
      });

      // If this is the first time we're creating the particle emitter,
      // it must be the game's first turn. Play game start sound.
      this.sound.play("start");
    } else {
      this.turnParticleEmitter.setEmitZone({
        type: "edge",
        source: effectShape,
        quantity: 48,
        yoyo: false,
      });
    }

    if (!this.team || this.isSpymaster) {
      return;
    }

    const endTurnBtn = this.controlsDOM.getChildByID("end-turn");

    if (currentTurn === this.team) {
      this.wordGrid.enableInteraction();
      endTurnBtn.classList.remove("hidden");
      return;
    }
    this.wordGrid.disableInteraction();
    endTurnBtn.classList.add("hidden");
  }

  private getTeamDivs(activeTeam: Team): {
    activeTeam: HTMLDivElement;
    otherTeam: HTMLDivElement;
  } {
    const t1 = <HTMLDivElement>this.teamDOMs[Team.Team1].getChildByID("team");
    const t2 = <HTMLDivElement>this.teamDOMs[Team.Team2].getChildByID("team");

    if (activeTeam === Team.Team1) {
      return {
        activeTeam: t1,
        otherTeam: t2,
      };
    }
    if (activeTeam === Team.Team2) {
      return {
        activeTeam: t2,
        otherTeam: t1,
      };
    }
    throw new Error(`invalid active team requested: ${activeTeam}`);
  }

  private clearPendingTile(sessionID: string) {
    clearInterval(this.pendingTiles[sessionID]);
    delete this.pendingTiles[sessionID];
  }

  preload() {
    this.load.html("team-dom", "../team.html");
    this.load.html("observers-dom", "../observers.html");
    this.load.html("call-controls-dom", "../callControls.html");
    this.load.html("end-dom", "../end.html");
    this.load.image("yellow", "../assets/flare.png");
    this.load.audio("joined", "../assets/audio/joined.wav");
    this.load.audio("start", "../assets/audio/start.ogg");
    this.wordGrid = new WordGrid(this, this.boardData.wordSet, (w: Word) => {
      this.clickWord(w);
    });
  }

  create() {
    this.cameras.main.setBackgroundColor("#2b3f56");
    const callControlsDom = this.add
      .dom(0, 0)
      .createFromCache("call-controls-dom");

    const x = this.game.canvas.width / 2;
    const y = this.game.canvas.height - 60;

    callControlsDom.setPosition(x, y).setOrigin(0.5, 1);
    this.controlsDOM = callControlsDom;

    this.particleManager = this.add.particles("yellow");
    this.call.registerJoinedMeetingHandler(() => {
      this.joinedAt = Date.now();
      const data = <JoinGameData>{
        gameID: this.gameID,
      };
      this.socket.emit(joinGameEventName, data);
      this.showTeams();

      const localID = this.call.getPlayerId();
      if (!this.getTileTeam(localID)) {
        const p = this.call.getParticipant(localID);
        console.log("creating tile in create()", p.user_name, Team.None);
        this.createTile(p, Team.None);
      }
    });

    this.call.registerParticipantJoinedHandler((p) => {
      if (this.getTileTeam(p.session_id)) return;
      console.log("creating tile participant joined", p.user_name, Team.None);
      if (Date.now() - this.joinedAt > 3000) {
        this.sound.play("joined");
      }
      this.createTile(p, Team.None);
    });

    this.call.registerParticipantLeftHandler((p) => {
      if (this.getTileTeam(p.participant.session_id) === Team.None) {
        removeTile(p.participant.session_id);
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
        `${window.location.host}?gameID=${this.gameID}`
      );
    });

    registerEndTurnBtnListener(() => {
      this.socket.emit(endTurnEventName, <EndTurnData>{
        gameID: this.gameID,
        playerID: this.call.getPlayerId(),
      });
    });

    registerLeaveBtnListener(() => {
      this.call.leave();
      this.socket.emit(leaveGameEventName);
      this.scene.start("Lobby");
    });
  }

  showTeams() {
    this.showTeam(Team.Team1);
    this.showTeam(Team.Team2);
    this.showObservers();

    const controls = document.getElementById("controls");
    controls.classList.remove("hidden");

    const t1 = this.teamDOMs[Team.Team1];
    const t2 = this.teamDOMs[Team.Team2];
    const rect = new Phaser.Geom.Rectangle(
      t1.x + t1.width,
      0,
      this.game.canvas.width - t2.width * 2,
      this.game.canvas.height
    );
    this.wordGrid.drawGrid(rect);
  }

  private showObservers() {
    const x = 0;
    const y = this.game.canvas.height - 300;
    const dom = this.add
      .dom(x, y)
      .createFromCache("observers-dom")
      .setOrigin(0);
    this.teamDOMs[Team.None] = dom;
  }

  private showTeam(team: Team) {
    const teamDOM = this.add.dom(0, 0).createFromCache("team-dom");
    let x = 0;
    let y = 0;
    const teamNameSpan = teamDOM.getChildByID("teamName");

    if (team === Team.Team1) {
      this.teamDOMs[Team.Team1] = teamDOM;
      teamNameSpan.innerHTML = "Team 1";
    } else if (team === Team.Team2) {
      this.teamDOMs[Team.Team2] = teamDOM;
      teamNameSpan.innerHTML = "Team 2";
      x = this.game.canvas.width - teamDOM.width;
    }

    teamDOM.setPosition(x, y).setOrigin(0);

    const teamDiv = <HTMLDivElement>teamDOM.getChildByID("team");
    teamDiv.classList.remove("hidden");

    const teamJoinBtn = <HTMLButtonElement>teamDOM.getChildByID("join");
    teamJoinBtn.classList.remove("hidden");
    teamJoinBtn.onclick = () => {
      const data = <JoinTeamData>{
        gameID: this.gameID,
        sessionID: this.call.getPlayerId(),
        teamID: team,
      };
      console.log("joining team", data.sessionID, data.teamID);

      this.socket.emit(joinTeamEventName, data);
      const joinButtons = document.getElementsByClassName("join");
      for (let i = 0; i < joinButtons.length; i += 1) {
        const btn = joinButtons[i];
        btn.classList.add("hidden");
      }

      const hasSpymaster = teamDOM.getChildByProperty("class", "spymaster");
      if (hasSpymaster) {
        // Team already has spymaster, don't set up the button
        return;
      }
      const beSpymasterButton = <HTMLButtonElement>(
        this.controlsDOM.getChildByID("be-spymaster")
      );
      beSpymasterButton.classList.remove("hidden");
      beSpymasterButton.onclick = () => {
        beSpymasterButton.classList.add("hidden");
        const resData = <BecomeSpymasterData>{
          gameID: this.gameID,
          sessionID: this.call.getPlayerId(),
        };
        this.socket.emit(becomeSpymasterEventName, resData);
        beSpymasterButton.classList.add("hidden");
      };
    };
  }

  private makeSpymaster(id: string, team: Team) {
    const participantTile = getTile(id);
    participantTile.classList.add("spymaster");

    if (this.team === team) {
      const spymasterBtn = this.controlsDOM.getChildByID("be-spymaster");
      spymasterBtn.classList.add("hidden");
    }

    if (id === this.call.getPlayerId()) {
      // Show word colors in grid
      this.wordGrid.revealAllWords(this.team);
      this.isSpymaster = true;
    }
  }

  private createTile(p: DailyParticipant, team: Team) {
    const name = p.user_name;
    const id = p.session_id;

    if (team !== Team.None && this.getTileTeam(id) === Team.None) {
      removeTile(id);
    }
    const dom = this.teamDOMs[team];

    console.log("creating tile", name, team);

    // See if there is already an existing tile by this ID, error out if so
    let participantTile = getTile(id);
    if (participantTile) {
      throw new Error(`tile for participant ID ${id} already exists`);
    }

    // Create participant tile with the video and name tags within
    const tiles = dom.getChildByID("tiles");

    participantTile = document.createElement("div");
    participantTile.id = getParticipantTileID(id);
    participantTile.className = "tile";

    const video = document.createElement("video");
    video.autoplay = true;
    participantTile.appendChild(video);

    const nameTag = document.createElement("div");
    nameTag.className = "name";
    nameTag.innerText = name;
    participantTile.appendChild(nameTag);
    tiles.appendChild(participantTile);

    const tracks = Call.getParticipantTracks(p);
    updateMedia(id, tracks);
  }

  private getTileTeam(playerID: string): Team {
    const tileID = getParticipantTileID(playerID);
    if (this.teamDOMs[Team.None].getChildByID(tileID)) {
      return Team.None;
    }
    if (this.teamDOMs[Team.Team1].getChildByID(tileID)) {
      return Team.Team1;
    }
    if (this.teamDOMs[Team.Team2].getChildByID(tileID)) {
      return Team.Team2;
    }
    return null;
  }
}

function removeTile(playerID: string) {
  const ele = document.getElementById(getParticipantTileID(playerID));
  ele?.remove();
}

function getParticipantTileID(sessionID: string): string {
  return `participant-${sessionID}`;
}

function getTile(participantID: string): HTMLDivElement {
  const participantTileID = getParticipantTileID(participantID);
  const participantTile = <HTMLDivElement>(
    document.getElementById(participantTileID)
  );
  return participantTile;
}

function updateMedia(participantID: string, tracks: MediaStreamTrack[]) {
  const participantTile = getTile(participantID);
  if (!participantTile) {
    throw new Error(`tile for participant ID ${participantID} does not exist`);
  }
  const videoTags = participantTile.getElementsByTagName("video");
  if (!videoTags || videoTags.length === 0) {
    throw new Error(
      `video tile for participant ID ${participantID} does not exist`
    );
  }
  const video = videoTags[0];
  const stream = new MediaStream(tracks);
  video.srcObject = stream;
}
