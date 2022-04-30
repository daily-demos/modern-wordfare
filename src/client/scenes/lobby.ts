import {
  ICreateGameRequest,
  ICreateGameResponse,
  IJoinGameRequest,
  IJoinGameResponse,
  Word,
} from "../../shared/types";
import "../html/lobby.html";
import axios from "axios";
import { BoardData } from "./board/board";
import { createWordSet } from "../word";

export class Lobby extends Phaser.Scene {
  initialize() {
    Phaser.Scene.call(this, { key: "Lobby" });
  }
  constructor() {
    super("Lobby");
  }

  preload() {
    this.load.html("lobby-dom", "../lobby.html");
  }

  create() {
    const lobbyDOM = this.add.dom(0, 0).createFromCache("lobby-dom");
    const x = this.cameras.main.worldView.x + this.cameras.main.width / 2;

    const y = this.cameras.main.worldView.y + this.cameras.main.height / 2;
    lobbyDOM.setPosition(x, y).setOrigin(0.5);
    // See if we have any query parameters indicating the user
    // is joining an existing game
    const usp = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(usp.entries());
    if (params.gameID) {
      const joinForm = lobbyDOM.getChildByID("join-game-form");
      joinForm.classList.remove("hidden");
    } else {
      const createForm = lobbyDOM.getChildByID("create-game-form");
      createForm.classList.remove("hidden");
    }

    lobbyDOM.addListener("click");

    lobbyDOM.on("click", function (event: any) {
      event.preventDefault();

      const lobbyScene = this.scene.scene;

      if (event.target.id === "join-game") {
        const inputPlayerName = this.getChildByID("join-player-name")?.value;
        console.log("input player name:", inputPlayerName);
        this.removeListener("click");

        // Make get request for game data
        joinGame(params.gameID)
          .then((gameData) => {
            lobbyScene.start("Board", <BoardData>{
              roomURL: gameData.roomURL,
              gameID: params.gameID,
              gameName: gameData.gameName,
              playerName: inputPlayerName,
              wordSet: gameData.wordSet,
            });
          })
          .catch((error) => {
            console.error("failed to create game", error);
            console.log(this.scene);
            lobbyScene.restart();
          });
        return;
      }

      if (event.target.id === "create-game") {
        var inputGameName = this.getChildByID("game-name")?.value;
        console.log("input game name:", inputGameName);
        const inputPlayerName = this.getChildByID("create-player-name")?.value;
        console.log("input player name:", inputPlayerName);
        this.removeListener("click");

        //  Tween the login form out
        this.scene.tweens.add({
          targets: lobbyDOM.rotate3d,
          x: 1,
          w: 90,
          duration: 3000,
          ease: "Power3",
        });

        this.scene.tweens.add({
          targets: lobbyDOM,
          scaleX: 2,
          scaleY: 2,
          y: 700,
          duration: 3000,
          ease: "Power3",
          onComplete: function () {
            lobbyDOM.setVisible(false);
          },
        });

        const wordSet = createWordSet();

        createGame(inputGameName, wordSet)
          .then((gameData) => {
            lobbyScene.start("Board", <BoardData>{
              roomURL: gameData.roomURL,
              gameName: inputGameName,
              gameID: gameData.gameID,
              playerName: inputPlayerName,
              meetingToken: gameData.meetingToken,
              wordSet: wordSet,
            });
          })
          .catch((error) => {
            console.error(error);
            lobbyScene.restart();
          });
      }
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
    throw new Error(`failed to create game: ${error})`);
  });

  const gameData = <ICreateGameResponse>res.data;
  return gameData;
}

async function joinGame(gameID: string): Promise<IJoinGameResponse> {
  const req = <IJoinGameRequest>{
    gameID: gameID,
  };

  const headers = {
    "Content-Type": "application/json",
  };
  const url = "/join";
  const data = JSON.stringify(req);
  console.log("join data: ", data);

  let res = await axios.post(url, data, { headers }).catch((error) => {
    throw new Error(`failed to join game: ${error})`);
  });

  const gameData = <IJoinGameResponse>res.data;
  return gameData;
}
