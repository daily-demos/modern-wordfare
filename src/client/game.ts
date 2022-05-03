import Phaser from "phaser";
import { Board } from "./scenes/board/board";
import Lobby from "./scenes/lobby";

export default class Game {
  private game: Phaser.Game;

  start() {
    console.log("constructing game");

    const config = {
      type: Phaser.AUTO,
      width: 1200,
      height: 900,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      parent: "game",
      backgroundColor: "#2b3f56",
      scene: [Lobby, Board],
      dom: {
        createContainer: true,
      },
    };
    this.game = new Phaser.Game(config);
  }

  destroy() {
    this.game.destroy(true);
  }
}
