import { Team, Word, WordKind } from "../../../shared/types";
import { Call } from "../../daily";
import "../../html/board.html";
import {
  DailyEventObjectParticipants,
  DailyParticipant,
} from "@daily-co/daily-js";
import {
  registerCamBtnListener,
  registerInviteBtnListener,
  registerMicBtnListener,
} from "../../util/nav";
import { wordCount } from "../../config";
import { RenderedWord } from "./renderedWord";
import { WordGrid } from "./wordGrid";
import { io, Socket } from "socket.io-client";
import { DuplicatePlayer } from "../../../shared/error";
import {
  GameData,
  gameDataDumpEventName,
  JoinedTeamData,
  joinedTeamEventName,
  JoinTeamData,
  joinTeamEventName,
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

  constructor() {
    super("Board");
  }

  initialize() {
    Phaser.Scene.call(this, { key: "Board" });
  }

  init(data: BoardData) {
    console.log("init with board data:", data);
    this.call = new Call(data.roomURL, data.playerName, data.meetingToken);
    this.gameID = data.gameID;
    this.wordGrid = new WordGrid(this, data.wordSet);
    const socket: Socket = io();
    this.socket = socket;
    socket.connect();
    socket.emit("hello");

    socket.on("error", (err: Error) => {
      console.error("received error from socket: ", err);
      if (err instanceof DuplicatePlayer) {
        console.log("dupe player!");
      }
    });

    socket.on(joinedTeamEventName, (data: JoinedTeamData) => {
      console.log("joined team!", data);
      const p = this.call.getParticipant(data.sessionID);
      if (!p) {
        console.error(`failed to find participant with ID ${data.sessionID}`);
        return;
      }
      this.createTile(p, data.teamID);
    });

    socket.on(gameDataDumpEventName, (data: GameData) => {
      console.log("got data dump", data);
      for (let i = 0; i < data.players.length; i++) {
        const player = data.players[i];
        const participant = this.call.getParticipant(player.id);
        this.createTile(participant, player.team);
      }
    });
  }

  preload() {
    this.load.html("board-dom", "../board.html");
  }

  create() {
    this.call.registerParticipantJoinedHandler((p) => {
      // this.createTile(p);
    });

    this.call.registerJoinedMeetingHandler((p) => {
      this.socket.emit("room", { room_name: this.gameID });
      this.showTeams(p);
    });

    this.call.registerJoinedTeamHandler((p: DailyParticipant, team: Team) => {
      console.log("joined team!");
      this.createTile(p, team);
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
    this.boardDOM = this.add.dom(500, 450).createFromCache("board-dom");

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

  showTeams(p: DailyParticipant) {
    const team1 = <HTMLDivElement>this.boardDOM.getChildByID("team1");
    team1.classList.remove("hidden");

    const team1JoinBtn = team1.getElementsByTagName("button")[0];
    team1JoinBtn.onclick = () => {
      const data = <JoinTeamData>{
        socketID: this.socket.id,
        gameID: this.gameID,
        sessionID: this.call.getPlayerId(),
        teamID: Team.Team1,
      };

      this.socket.emit(joinTeamEventName, data);
      /* this.team = Team.Team1;
      this.call.joinTeam(Team.Team1);
      this.createTile(p, Team.Team1); */
      team1JoinBtn.classList.add("hidden");
    };

    const team2 = this.boardDOM.getChildByID("team2");
    team2.classList.remove("hidden");

    const team2JoinBtn = team2.getElementsByTagName("button")[0];
    team2JoinBtn.onclick = () => {
      const data = <JoinTeamData>{
        gameID: this.gameID,
        sessionID: this.call.getPlayerId(),
        teamID: Team.Team2,
      };
      this.socket.emit(joinTeamEventName, data);

      /* this.team = Team.Team2;
      this.call.joinTeam(Team.Team2);
      this.createTile(p, Team.Team2);  */
      team2JoinBtn.classList.add("hidden");
    };

    const controls = this.boardDOM.getChildByID("controls");
    controls.classList.remove("hidden");
  }

  createTile(p: DailyParticipant, team: Team) {
    console.log("CREATING TILE:", p.session_id, team);
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
