import Phaser from "phaser";
import { Board, BoardData } from "./scenes/board/board";

export default class Game {
  private game: Phaser.Game;

  start(boardData: BoardData) {
    console.log("constructing game");

    const config = {
      type: Phaser.AUTO,
      width: 1500,
      height: 900,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      parent: "game",
      backgroundColor: "#fff",
      scene: [Board],
      dom: {
        createContainer: true,
      },
    };
    this.game = new Phaser.Game(config);
    console.log("board data:", boardData)
    this.game.scene.start('Board', boardData)
  }

  destroy() {
    this.game.destroy(true);
  }
}
