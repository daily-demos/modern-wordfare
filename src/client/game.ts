import Phaser from "phaser";
import { Board } from "./scenes/board/board";
import { Lobby } from "./scenes/lobby";

export class Game {
  private game: Phaser.Game;
  private zoom: number = 1;

  constructor() {
    console.log("constructing game");

    let config = {
      type: Phaser.AUTO,
      width: 1200,
      height: 900,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      // zoom: this.zoom,
      parent: "game",
      backgroundColor: "#2b3f56",
      scene: [Lobby, Board],
      dom: {
        createContainer: true,
      },
    };
    this.game = new Phaser.Game(config);
  }
}
