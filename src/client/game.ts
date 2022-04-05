import Phaser from "phaser";
import { Lobby } from "./scenes/lobby";

export class Game {
  private game: Phaser.Game;

  constructor() {
    console.log("constructing game");
    let config = {
      type: Phaser.AUTO,
      backgroundColor: 0x4488aa,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: "DailyCodewords",
        width: 750,
        height: 1334,
      },
      scene: Lobby,
    };
    this.game = new Phaser.Game(config);
  }
}
