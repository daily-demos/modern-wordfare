import { Team, Word } from "../../../shared/types";
import { Call } from "../../daily";
import "../../html/board.html";
import { DailyParticipant } from "@daily-co/daily-js";
import {
  registerCamBtnListener,
  registerInviteBtnListener,
  registerMicBtnListener,
} from "../../util/nav";
import { WordGrid } from "./wordGrid";
import { io, Socket } from "socket.io-client";
import { DuplicatePlayer } from "../../../shared/error";
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
} from "../../../shared/events";

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
  boardDOM: Phaser.GameObjects.DOMElement;
  team = Team.None;
  socket: Socket;
  pendingTiles: { [key: string]: ReturnType<typeof setInterval> } = {};

  constructor() {
    super("Board");
  }

  initialize() {
    Phaser.Scene.call(this, { key: "Board" });
  }

  init(data: BoardData) {
    this.call = new Call(data.roomURL, data.playerName, data.meetingToken);
    this.gameID = data.gameID;
    this.wordGrid = new WordGrid(this, data.wordSet);
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
    });

    socket.on(gameDataDumpEventName, (data: GameData) => {
      for (let i = 0; i < data.players.length; i++) {
        const player = data.players[i];
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
      const teams = this.getTeamDivs(data.currentTurn);
      teams.activeTeam.classList.add("active");
      teams.otherTeam.classList.remove("active");

      if (!this.team) {
        return;
      }

      if (data.currentTurn === this.team) {
        this.wordGrid.enableInteraction();
        return;
      }
      this.wordGrid.disableInteraction();
    });
  }

  private getTeamDivs(activeTeam: Team): {
    activeTeam: HTMLDivElement;
    otherTeam: HTMLDivElement;
  } {
    const t1 = <HTMLDivElement>this.boardDOM.getChildByID("team1");
    const t2 = <HTMLDivElement>this.boardDOM.getChildByID("team2");

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
    let teamDivID = null;
    if (team === Team.Team1) {
      teamDivID = "team1";
    }
    if (team === Team.Team2) {
      teamDivID = "team2";
    }
    const div = this.boardDOM.getChildByID(teamDivID);
    return <HTMLDivElement>div;
  }

  private clearPendingTile(sessionID: string) {
    clearInterval(this.pendingTiles[sessionID]);
    delete this.pendingTiles[sessionID];
  }

  preload() {
    this.load.html("board-dom", "../board.html");
  }

  create() {
    this.boardDOM = this.add.dom(500, 450).createFromCache("board-dom");

    this.call.registerJoinedMeetingHandler((p) => {
      const data = <JoinGameData>{
        socketID: this.socket.id,
        gameID: this.gameID,
      };
      console.log("joining game", data);
      this.socket.emit(joinGameEventName, data);
      this.showTeams();
    });

    this.call.registerTrackStartedHandler((e) => {
      const p = e.participant;
      const tracks = this.call.getParticipantTracks(p);
      console.log(
        "trackStarted session ID and participant:",
        p.session_id,
        tracks
      );
      this.updateMedia(p.session_id, tracks);
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

    this.wordGrid.drawGrid(175, 75);
  }

  showTeams() {
    this.showTeam(Team.Team1);
    this.showTeam(Team.Team2);

    const controls = this.boardDOM.getChildByID("controls");
    controls.classList.remove("hidden");
  }

  private showTeam(team: Team) {
    let teamDivID: string = null;
    if (team === Team.Team1) {
      teamDivID = "team1";
    } else if (team === Team.Team2) {
      teamDivID = "team2";
    }
    console.log("showing team ", teamDivID, team);

    const teamDiv = <HTMLDivElement>this.boardDOM.getChildByID(teamDivID);
    teamDiv.classList.remove("hidden");

    const teamJoinBtn = document.getElementById(`join-${teamDivID}`);
    teamJoinBtn.onclick = () => {
      const data = <JoinTeamData>{
        socketID: this.socket.id,
        gameID: this.gameID,
        sessionID: this.call.getPlayerId(),
        teamID: team,
      };

      this.socket.emit(joinTeamEventName, data);
      const joinButtons = document.getElementsByClassName("join");
      for (let i = 0; i < joinButtons.length; i++) {
        const btn = joinButtons[i];
        btn.classList.add("hidden");
      }

      const beSpymasterButton = document.getElementById(
        `join-spymaster-${teamDivID}`
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
    // See if there is already an existing tile by this ID, error out if so
    let participantTile = this.getTile(id);
    if (participantTile) {
      throw new Error(`tile for participant ID ${id} already exists`);
    }

    let teamDivID = null;
    if (team === Team.Team1) {
      teamDivID = "team1";
    } else if (team === Team.Team2) {
      teamDivID = "team2";
    }

    const teamDiv = <HTMLDivElement>this.boardDOM.getChildByID(teamDivID);

    // Create participant tile with the video and name tags within
    const tiles = teamDiv.getElementsByClassName("tiles")[0];
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
      this.boardDOM.getChildByID(participantTileID)
    );
    return participantTile;
  }
}
