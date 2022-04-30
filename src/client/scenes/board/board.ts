import { Team, Word } from "../../../shared/types";
import { Call } from "../../daily";
import "../../html/board.html";
import "../../html/callControls.html";
import { DailyParticipant } from "@daily-co/daily-js";
import {
  registerCamBtnListener,
  registerInviteBtnListener,
  registerMicBtnListener,
} from "../../util/nav";
import { WordGrid } from "./wordGrid";
import { io, Socket } from "socket.io-client";
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
  resultEventName,
  TeamResultData,
  wordSelectedEventName,
  SelectedWordData,
} from "../../../shared/events";
import { timeStamp } from "console";
import { join } from "path";

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
  // boardDOM: Phaser.GameObjects.DOMElement;
  teamDOMs: { [key in Team]?: Phaser.GameObjects.DOMElement } = {
    team1: null,
    team2: null,
  };
  /* team1DOM: Phaser.GameObjects.DOMElement;
  team2DOM: Phaser.GameObjects.DOMElement; */
  team = Team.None;
  socket: Socket;
  pendingTiles: { [key: string]: ReturnType<typeof setInterval> } = {};

  constructor() {
    super("Board");
  }

  initialize() {
    Phaser.Scene.call(this, { key: "Board" });
  }

  private clickWord(word: Word) {
    console.log("clicked word, emitting");
    const data = <SelectedWordData>{
      socketID: this.socket.id,
      gameID: this.gameID,
      wordValue: word.word,
      playerID: this.call.getPlayerId(),
    };
    this.socket.emit(wordSelectedEventName, data);
  }

  init(data: BoardData) {
    this.call = new Call(data.roomURL, data.playerName, data.meetingToken);
    this.gameID = data.gameID;
    this.wordGrid = new WordGrid(this, data.wordSet, (w: Word) => {
      this.clickWord(w);
    });
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
      if (p.session_id === this.call.getPlayerId()) {
        this.team = data.teamID;
      }
      this.createTile(p, data.teamID);
      if (data.currentTurn && data.currentTurn !== Team.None) {
        this.toggleCurrentTurn(data.currentTurn);
      }
    });

    socket.on(gameDataDumpEventName, (data: GameData) => {
      for (let i = 0; i < data.players.length; i++) {
        const player = data.players[i];
        if (data.currentTurn && data.currentTurn !== Team.None) {
          this.toggleCurrentTurn(data.currentTurn);
        }
        this.pendingTiles[player.id] = setInterval(() => {
          const participant = this.call.getParticipant(player.id);
          if (!participant) {
            console.log("participant does not yet exist");
            return;
          }
          this.clearPendingTile(player.id);
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

    socket.on(resultEventName, (data: TeamResultData) => {
      const team = this.getTeamDiv(data.team);
      const score = this.teamDOMs[data.team].getChildByID("score");
      score.innerHTML = data.score.toString();
    });
  }

  private toggleCurrentTurn(currentTurn: Team) {
    const teams = this.getTeamDivs(currentTurn);
    teams.activeTeam.classList.add("active");
    teams.otherTeam.classList.remove("active");

    if (!this.team) {
      return;
    }

    if (currentTurn === this.team) {
      this.wordGrid.enableInteraction();
      return;
    }
    this.wordGrid.disableInteraction();
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

  private getTeamDiv(team: Team): HTMLDivElement {
    let dom: Phaser.GameObjects.DOMElement;
    if (team === Team.Team1) {
      dom = this.teamDOMs[Team.Team1];
    }
    if (team === Team.Team2) {
      dom = this.teamDOMs[Team.Team2];
    }
    const div = dom.getChildByID("team");
    return <HTMLDivElement>div;
  }

  private clearPendingTile(sessionID: string) {
    clearInterval(this.pendingTiles[sessionID]);
    delete this.pendingTiles[sessionID];
  }

  preload() {
    this.load.html("team-dom", "../board.html");
    this.load.html("call-controls-dom", "../callControls.html");
  }

  create() {
    /* this.boardDOM = this.add.dom(0, 0).createFromCache("board-dom");
    let x = window.innerWidth / 2 - this.boardDOM.width / 2
    let y = window.innerHeight / 2 - this.boardDOM.height / 2
    console.log("old pos:", this.boardDOM.x, this.boardDOM.y)

    this.boardDOM.setPosition(x, y);
    console.log("new pos:", this.boardDOM.x, this.boardDOM.y) */

    const callControlsDom = this.add
      .dom(0, 0)
      .createFromCache("call-controls-dom");

    const x = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const y = this.cameras.main.worldView.y + this.cameras.main.height - 100;

    callControlsDom.setPosition(x, y).setOrigin(0.5, 1);

    this.call.registerJoinedMeetingHandler((p) => {
      const data = <JoinGameData>{
        socketID: this.socket.id,
        gameID: this.gameID,
      };
      console.log("joining game", data);
      this.socket.emit(joinGameEventName, data);
      this.showTeams();
    });

    this.call.registerTrackStartedHandler((p) => {
      const tracks = this.call.getParticipantTracks(p.participant);
      try {
        this.updateMedia(p.participant.session_id, tracks);
      } catch (e) {
        console.warn(e);
      }
    });

    this.call.registerTrackStoppedHandler((p) => {
      const tracks = this.call.getParticipantTracks(p.participant);
      try {
        this.updateMedia(p.participant.session_id, tracks);
      } catch (e) {
        console.warn(e);
      }
    });
    /*
    this.call.registerParticipantUpdatedHandler((p) => {
      const tracks = this.call.getParticipantTracks(p);
      console.log(
        "partiicipant updated session ID and participant:",
        p.session_id,
        tracks
      );
      try {
        this.updateMedia(p.session_id, tracks);
      } catch (e) {
        console.warn(e);
      }
    }); */

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
    this.wordGrid.drawGrid(this.cameras.main.worldView);
  }

  showTeams() {
    this.showTeam(Team.Team1);
    this.showTeam(Team.Team2);

    const controls = document.getElementById("controls");
    controls.classList.remove("hidden");
  }

  private showTeam(team: Team) {
    console.log("showing team", team);
    const teamDOM = this.add.dom(0, 0).createFromCache("team-dom", null);

    let x = this.cameras.main.worldView.x;
    const y = this.cameras.main.worldView.y + 50;

    const teamNameSpan = teamDOM.getChildByID("teamName");

    if (team === Team.Team1) {
      this.teamDOMs[Team.Team1] = teamDOM;
      teamNameSpan.innerHTML = "Team 1";
    } else if (team === Team.Team2) {
      this.teamDOMs[Team.Team2] = teamDOM;
      teamNameSpan.innerHTML = "Team 2";

      x =
        this.cameras.main.worldView.x + this.cameras.main.width - teamDOM.width;
    }

    teamDOM.setPosition(x, y).setOrigin(0);

    const teamDiv = <HTMLDivElement>teamDOM.getChildByID("team");
    teamDiv.classList.remove("hidden");

    const teamJoinBtn = <HTMLButtonElement>teamDOM.getChildByID("join");
    teamJoinBtn.onclick = () => {
      const data = <JoinTeamData>{
        socketID: this.socket.id,
        gameID: this.gameID,
        sessionID: this.call.getPlayerId(),
        teamID: team,
      };

      this.socket.emit(joinTeamEventName, data);
      const joinButtons = document.getElementsByClassName("join");
      console.log("all join buttons:", joinButtons.length);
      for (let i = 0; i < joinButtons.length; i++) {
        const btn = joinButtons[i];
        btn.classList.add("hidden");
      }

      const beSpymasterButton = <HTMLButtonElement>(
        teamDOM.getChildByID("join-spymaster")
      );
      beSpymasterButton.classList.remove("hidden");
      beSpymasterButton.onclick = () => {
        console.log("becoming spymaster!");
        beSpymasterButton.classList.add("hidden");
        const data = <BecomeSpymasterData>{
          socketID: this.socket.id,
          gameID: this.gameID,
          sessionID: this.call.getPlayerId(),
        };
        this.socket.emit(becomeSpymasterEventName, data);
        beSpymasterButton.classList.add("hidden");
      };
    };
  }

  private makeSpymaster(id: string, team: Team) {
    const participantTile = this.getTile(id);
    participantTile.classList.add("spymaster");

    if (this.team === team) {
      const teamDiv = this.getTeamDiv(this.team);
      const btns = teamDiv.getElementsByTagName("button");
      for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        btn.classList.add("hidden");
      }
    }

    if (id === this.call.getPlayerId()) {
      // Show word colors in grid
      this.wordGrid.revealAllWords(this.team);
    }
  }

  createTile(p: DailyParticipant, team: Team) {
    const name = p.user_name;
    const id = p.session_id;
    const dom = this.teamDOMs[team];

    // See if there is already an existing tile by this ID, error out if so
    let participantTile = this.getTile(id);
    if (participantTile) {
      throw new Error(`tile for participant ID ${id} already exists`);
    }

    const teamDiv = this.getTeamDiv(team);
    console.log("teamDIV:", teamDiv);
    // Create participant tile with the video and name tags within
    const tiles = dom.getChildByID("tiles");

    participantTile = document.createElement("div");
    participantTile.id = this.getParticipantTileID(id);
    participantTile.className = "tile";

    const video = document.createElement("video");
    video.autoplay = true;
    participantTile.appendChild(video);

    const nameTag = document.createElement("div");
    nameTag.className = "name";
    nameTag.innerText = name;
    participantTile.appendChild(nameTag);
    tiles.appendChild(participantTile);

    const tracks = this.call.getParticipantTracks(p);
    this.updateMedia(id, tracks);
  }

  update() {}

  private getParticipantTileID(sessionID: string): string {
    return `participant-${sessionID}`;
  }

  private updateMedia(participantID: string, tracks: MediaStreamTrack[]) {
    const participantTile = this.getTile(participantID);
    if (!participantTile) {
      throw new Error(
        `tile for participant ID ${participantID} does not exist`
      );
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
    console.log("updateMedia() video, tracks, stream:", video, tracks, stream);
  }

  private getTile(participantID: string): HTMLDivElement {
    const participantTileID = this.getParticipantTileID(participantID);
    const participantTile = <HTMLDivElement>(
      document.getElementById(participantTileID)
    );
    console.log("participant tile:", participantTileID, participantTile);
    return participantTile;
  }
}
