import { Word } from "../../shared/types";
import { wordCount } from "../config";
import { Call } from "../daily";
import { rand } from "../util";
import { createWordSet } from "../word";
import "../html/board.html";
import { DailyEventObjectParticipants } from "@daily-co/daily-js";

export interface BoardData {
  roomURL: string;
  gameID: string;
  playerName: string;
  meetingToken?: string;
  wordSet: Word[];
}

export class Board extends Phaser.Scene {
  wordSet: Word[];
  call: Call;
  gameID: string;

  constructor() {
    super("Board");
  }

  initialize() {
    Phaser.Scene.call(this, { key: "Board" });
  }

  init(data: BoardData) {
    this.call = new Call(data.roomURL, data.playerName, data.meetingToken);
    this.gameID = data.gameID;
    this.wordSet = data.wordSet;
  }

  preload() {
    this.load.html("board-dom", "../board.html");
  }

  create() {
    this.call.registerJoinedMeetingHandler(this.createTile)
    this.call.join();
    const boardDOM = this.add.dom(400, 100).createFromCache("board-dom");
    const inviteURL = <HTMLSpanElement>boardDOM.getChildByID("invite-url");
    console.log("inviteURL:", boardDOM, inviteURL)
    inviteURL.innerText = `${window.location.host}?gameID=${this.gameID}`
  }

  createTile(e: DailyEventObjectParticipants) {
    const lp = e.participants.local;
    const name = lp.user_name;
    const id = lp.session_id;
    

  }

  updateMedia(tracks: MediaStreamTrack[]) {

  }

  getTile(participantID: string): HTMLDivElement {
    return null;
  }

  update() {}
}
