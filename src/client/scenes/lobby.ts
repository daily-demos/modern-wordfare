import {
  ICreateGameRequest,
  ICreateGameResponse,
  Word,
} from "../../shared/types";
import "../html/lobby.html";
import axios from "axios";
import { BoardData } from "./board";
import { createWordSet } from "../word";

export class Lobby extends Phaser.Scene {
  initialize() {
    Phaser.Scene.call(this, { key: "Lobby" });
  }
  constructor() {
    super("Lobby");
  }

  preload() {
    this.load.html("create-game-dom", "../lobby.html");
  }

  create() {
    console.log("this:", this);
    const text = this.add.text(10, 10, "Start a new game", {
      color: "white",
      fontFamily: "Arial",
      fontSize: "32px ",
    });

    let createGameDOM = this.add
      .dom(400, 100)
      .createFromCache("create-game-dom");

    // createGameDOM.setPerspective(100);

    createGameDOM.addListener("click");

    const lobbyScene = this.scene;
    createGameDOM.on("click", function (event: any) {
      event.preventDefault();
      if (event.target.id !== "create-game") return;
      var inputGameName = this.getChildByID("game-name")?.value;
      var inputPlayerName = this.getChildByID("player-name")?.value;
      this.removeListener("click");

      //  Tween the login form out
      this.scene.tweens.add({
        targets: createGameDOM.rotate3d,
        x: 1,
        w: 90,
        duration: 3000,
        ease: "Power3",
      });

      this.scene.tweens.add({
        targets: createGameDOM,
        scaleX: 2,
        scaleY: 2,
        y: 700,
        duration: 3000,
        ease: "Power3",
        onComplete: function () {
          createGameDOM.setVisible(false);
        },
      });
      console.log("scene:", lobbyScene);

      const wordSet = createWordSet();

      createGame(inputGameName, wordSet)
        .then((gameData) => {
          console.log("game created!");
          console.log(this.scene);
          lobbyScene.start("Board", <BoardData>{
            roomUrl: gameData.roomUrl,
            gameName: inputGameName,
            playerName: inputPlayerName,
            meetingToken: gameData.meetingToken,
            wordSet: wordSet,
          });
        })
        .catch((error) => {
          console.error("failed to create game", error);
          console.log(this.scene);
          lobbyScene.restart();
        });
    });
  }

  update() {}
}

async function createGame(
  gameName: string,
  wordSet: Word[]
): Promise<ICreateGameResponse> {
  // Create the game here
  const req = <ICreateGameRequest>{
    gameName: gameName,
    wordSet: wordSet,
  };

  const headers = {
    "Content-Type": "application/json",
  };

  const url = "/create";
  const data = JSON.stringify(req);

  let res = await axios.post(url, data, { headers }).catch((error) => {
    throw new Error(`failed to create room: ${error})`);
  });

  const gameData = <ICreateGameResponse>res.data;
  return gameData;
}
