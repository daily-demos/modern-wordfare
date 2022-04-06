import Phaser from "phaser";
import { Board } from "./scenes/board";
import { Lobby } from "./scenes/lobby";

export class Game {
  private game: Phaser.Game;

  constructor() {
    console.log("constructing game");
    let config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: "game",
      scene: [Lobby, Board],
      dom: {
        createContainer: true,
      },
    };
    this.game = new Phaser.Game(config);
  }
}
