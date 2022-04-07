import Phaser from "phaser";
import { Board } from "./scenes/board";
import { Lobby } from "./scenes/lobby";

export class Game {
  private game: Phaser.Game;

  constructor() {
    console.log("constructing game");
    const zoom = 1;

    let config = {
      type: Phaser.AUTO,
      mode: Phaser.Scale.NONE,
      width: document.body.clientWidth / zoom,
      height: document.body.clientHeight / zoom,
      zoom: zoom,
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
        this.game.scale.resize(
          document.body.clientWidth / zoom,
          document.body.clientHeight / zoom
        );
      },
      false
    );
  }
}
