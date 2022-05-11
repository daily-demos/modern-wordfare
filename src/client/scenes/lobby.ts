import axios from "axios";
import {
  ICreateGameRequest,
  ICreateGameResponse,
  IJoinGameRequest,
  IJoinGameResponse,
} from "../../shared/types";
import "../html/lobby.html";
import { BoardData } from "./board/board";
import createWordSet from "../util/word";
import { Word } from "../../shared/word";

export default class Lobby extends Phaser.Scene {
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

    const x: number = this.game.canvas.width / 2;
    const y: number = this.game.canvas.height / 2;

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

    lobbyDOM.on("click", (event: any) => {
      event.preventDefault();
      const lobbyScene = this.scene;

      if (event.target.id === "join-game") {
        const playerNameForm = <HTMLFormElement>(
          lobbyDOM.getChildByID("join-player-name")
        );
        const inputPlayerName = playerNameForm?.value;
        lobbyDOM.removeListener("click");

        this.tweens.add({
          targets: lobbyDOM,
          alpha: 0,
          duration: 3000,
          ease: "Power2",
          onComplete: () => {
            lobbyDOM.setVisible(false);
          },
        });

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
            lobbyScene.restart();
          });
        return;
      }

      if (event.target.id === "create-game") {
        const gameNameForm = <HTMLFormElement>(
          lobbyDOM.getChildByID("game-name")
        );
        const inputGameName = gameNameForm?.value;

        const playerNameForm = <HTMLFormElement>(
          lobbyDOM.getChildByID("create-player-name")
        );
        const inputPlayerName = playerNameForm?.value;
        lobbyDOM.removeListener("click");

        this.tweens.add({
          targets: lobbyDOM,
          alpha: 0,
          duration: 2000,
          ease: "Power2",
          onComplete: () => {
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
              wordSet: gameData.wordSet,
            });
          })
          .catch((error) => {
            console.error(error);
            lobbyScene.restart();
          });
      }
    });
  }

  static update() {}
}

async function createGame(
  gameName: string,
  wordSet: Word[]
): Promise<ICreateGameResponse> {
  // Create the game here
  const req = <ICreateGameRequest>{
    gameName,
    wordSet,
  };

  const headers = {
    "Content-Type": "application/json",
  };

  const url = "/create";
  const data = JSON.stringify(req);

  const res = await axios.post(url, data, { headers }).catch((error) => {
    throw new Error(`failed to create game: ${error})`);
  });

  const gameData = <ICreateGameResponse>res.data;
  return gameData;
}

async function joinGame(gameID: string): Promise<IJoinGameResponse> {
  const req = <IJoinGameRequest>{
    gameID,
  };

  const headers = {
    "Content-Type": "application/json",
  };
  const url = "/join";
  const data = JSON.stringify(req);

  const res = await axios.post(url, data, { headers }).catch((error) => {
    throw new Error(`failed to join game: ${error})`);
  });

  const gameData = <IJoinGameResponse>res.data;
  return gameData;
}
