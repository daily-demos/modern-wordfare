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
      mode: Phaser.Scale.NONE,
      width: this.getWidth(),
      height: this.getHeight(),
      zoom: this.zoom,
      parent: "game",
      backgroundColor: "#2b3f56",
      scene: [Lobby, Board],
      dom: {
        createContainer: true,
      },
    };
    this.game = new Phaser.Game(config);

    window.addEventListener(
      "resize",
      () => {
        this.game.scale.resize(this.getWidth(), this.getHeight());
      },
      false
    );
  }

  getWidth(): number {
    console.log(
      "getWidth: ",
      document.body.clientWidth,
      this.zoom,
      document.body.clientWidth / this.zoom
    );

    return document.body.clientWidth / this.zoom;
  }

  getHeight(): number {
    console.log(
      "getHeight: ",
      document.body.clientHeight,
      this.zoom,
      (document.body.clientWidth - 52) / this.zoom
    );
    return (document.body.clientHeight - 52) / this.zoom;
  }
}
