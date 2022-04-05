import "../html/lobby.html";

export class Lobby extends Phaser.Scene {
  constructor() {
    super("Lobby");
  }

  preload() {
    this.load.html("create-game-form", "../html/lobby.html");
  }

  create() {
    var text = this.add.text(10, 10, "Start a new game", {
      color: "white",
      fontFamily: "Arial",
      fontSize: "32px ",
    });

    var createGameForm = this.add
      .dom(400, 600)
      .createFromCache("create-game-form");

    createGameForm.setPerspective(800);

    createGameForm.addListener("click");

    createGameForm.on("click", function (event: any) {
      console.log("event target:");
      console.log(event.target);
      if (event.target.id === "creategame") {
        var inputGameName = this.getChildByID("game-name");
        var inputPlayerName = this.getChildByID("player-name");

        this.removeListener("click");

        //  Tween the login form out
        this.scene.tweens.add({
          targets: createGameForm.rotate3d,
          x: 1,
          w: 90,
          duration: 3000,
          ease: "Power3",
        });

        this.scene.tweens.add({
          targets: createGameForm,
          scaleX: 2,
          scaleY: 2,
          y: 700,
          duration: 3000,
          ease: "Power3",
          onComplete: function () {
            createGameForm.setVisible(false);
          },
        });

        // Create the game here
      }
    });
  }

  update() {}
}
