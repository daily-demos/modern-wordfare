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
  team: Team.None;

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
  }

  preload() {
    this.load.html("board-dom", "../board.html");
  }

  create() {
    this.call.registerJoinedMeetingHandlers((p) => {
      this.createTile(p);
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

    this.wordGrid.drawGrid(175, 100);
  }

  createTile(p: DailyParticipant) {
    const name = p.user_name;
    const id = p.session_id;
    // See if there is already an existing tile by this ID, error out if so
    let participantTile = this.getTile(id);
    if (participantTile) {
      throw new Error(`tile for participant ID ${id} already exists`);
    }

    // Create participant tile with the video and name tags within
    const tiles = this.boardDOM.getChildByID("tiles");
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
