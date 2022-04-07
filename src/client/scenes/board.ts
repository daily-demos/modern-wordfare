import { Word } from "../../shared/types";
import { wordCount } from "../config";
import { Call } from "../daily";
import { rand } from "../util";
import { createWordSet } from "../word";

export interface BoardData {
  roomUrl: string;
  playerName: string;
  meetingToken: string;
  wordSet: Word[];
}

export class Board extends Phaser.Scene {
  wordSet: Word[];
  call: Call;

  constructor() {
    super("Board");
  }

  initialize() {
    Phaser.Scene.call(this, { key: "Board" });
  }

  init(data: BoardData) {
    this.call = new Call(data.roomUrl, data.playerName, data.meetingToken);
    this.wordSet = data.wordSet;
  }

  preload() {}

  create() {
    this.call.join();
  }

  update() {}
}
