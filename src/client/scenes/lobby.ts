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

import "../assets/avatars/av1.svg";
import "../assets/avatars/av2.svg";
import "../assets/avatars/av3.svg";
import "../assets/avatars/av4.svg";
import "../assets/avatars/av5.svg";
import "../assets/avatars/av6.svg";
import "../assets/avatars/av7.svg";
import "../assets/audio/word-success.wav";

import { rand } from "../util/math";

export default class Lobby extends Phaser.Scene {
  private avatars: { rotation: number; img: Phaser.GameObjects.Image }[] = [];

  initialize() {
    Phaser.Scene.call(this, { key: "Lobby" });
  }

  constructor() {
    super("Lobby");
  }

  preload() {
    this.load.html("lobby-dom", "../lobby.html");
    this.load.svg("av1", "../assets/avatars/av1.svg");
    this.load.svg("av2", "../assets/avatars/av2.svg");
    this.load.svg("av3", "../assets/avatars/av3.svg");
    this.load.svg("av4", "../assets/avatars/av4.svg");
    this.load.svg("av5", "../assets/avatars/av5.svg");
    this.load.svg("av6", "../assets/avatars/av6.svg");
    this.load.svg("av7", "../assets/avatars/av7.svg");
    this.load.audio("chime", "../assets/audio/word-success.wav");
  }

  private placeAvatar(num: number) {
    const width = this.game.canvas.width;
    const height = this.game.canvas.height;

    let avX = rand(50, width - 50);
    let avY = rand(50, height - 50);

    const img = this.add.image(avX, avY, `av${num}`);
    const rot = rand(0, 100);
    img.setRotation(rot / 100);

    const tint = rand(0, 1);
    if (tint === 0) {
      img.setTint(0xff0000);
    } else {
      img.setTint(0x00ff00);
    }

    const angleIncrement = rand(-25, 25) / 100;

    this.avatars.push({ rotation: angleIncrement, img: img });
  }

  create() {
    for (let i = 1; i < 7; i += 1) {
      this.placeAvatar(i);
    }

    const style = <Phaser.Types.GameObjects.Text.TextStyle>{
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "70px",
      color: "#00c9df",
      align: "center",
    };

    this.add
      .text(
        this.game.canvas.width / 2,
        100,
        "Codewords or Deducement (or something!)",
        style
      )
      .setOrigin(0.5);

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

      const targetID = event.target.id;

      if (targetID !== "join-game" && targetID !== "create-game") return;

      this.sound.play("chime", { name: "chime", start: 0, duration: 1.0 });

      if (targetID === "join-game") {
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

      if (targetID === "create-game") {
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

  update() {
    for (let i = 0; i < this.avatars.length; i += 1) {
      const a = this.avatars[i];
      a.img.angle += a.rotation;
    }
  }
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
