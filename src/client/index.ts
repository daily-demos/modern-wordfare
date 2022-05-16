// These imports are here to ensure they're bundled into
// the final distribution.
import "./html/index.html";
import "./style.css";
import "./assets/favicon.ico";
import "./assets/daily.svg";
import "./assets/github.png";
import "./assets/camera-off.svg";
import "./assets/camera.svg";
import "./assets/microphone-off.svg";
import "./assets/microphone.svg";
import "./assets/screen-off.svg";
import "./assets/screen-on.svg";
import Game from "./game";
import createWordSet from "./util/word";
import { ICreateGameRequest, IJoinGameRequest, IJoinGameResponse } from "../shared/types";
import { Word } from "../shared/word";
import { BoardData } from "./scenes/board/board";


console.log("loading game!!")

function initGame(boardData: BoardData) {
  const game = new Game();
  game.start(boardData);
}

window.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOM content loaded")
  // See if we have any query parameters indicating the user
  // is joining an existing game
  const usp = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(usp.entries());
  if (params.gameID) {
    console.log("Joining!")
    // Player name param is included in the URL
    if (params.playerName) {
      joinGame(params.gameID) 
      .then((gameData) => {
        const boardData =  <BoardData>{
          roomURL: gameData.roomURL,
          gameID: params.gameID,
          gameName: gameData.gameName,
          playerName: params.playerName,
          wordSet: gameData.wordSet,
          // meetingToken: token,
        }
        initGame(boardData);
       
      })
      .catch((error) => {
        console.error("failed to create game", error);
      });
    } else {
      const joinForm = document.getElementById("join-game-form");
      joinForm.classList.remove("hidden");
      joinForm.onsubmit = (e) => {
        e.preventDefault();
        const playerNameInput = <HTMLFormElement>(
          document.getElementById("join-player-name")
        );
        const inputPlayerName = playerNameInput?.value
        
        joinGame(params.gameID)
        .then((gameData) => {
          const boardData =  <BoardData>{
            roomURL: gameData.roomURL,
            gameID: params.gameID,
            gameName: gameData.gameName,
            playerName: inputPlayerName,
            wordSet: gameData.wordSet,
          }
          initGame(boardData);
        }).catch((e) => {
          console.error(e);
        });
    }
  }

  } else {
    console.log("showing creat form")
    const createForm = <HTMLFormElement>document.getElementById("create-game-form");
    createForm.classList.remove("hidden");
    createForm.onsubmit = (e) => {
      e.preventDefault();
      createForm.setAttribute("disabled", "true");
      const gameNameForm = <HTMLFormElement>(
          document.getElementById("game-name")
        );
        const inputGameName = gameNameForm?.value;

        const playerNameForm = <HTMLFormElement>(
          document.getElementById("create-player-name")
        );
        const inputPlayerName = playerNameForm?.value;

        const wordSet = createWordSet();

        createGame(inputGameName, inputPlayerName, wordSet)
          .catch((error) => {
            console.error(error);
          });
      }
    }
  });



async function createGame(
  gameName: string,
  playerName: string,
  wordSet: Word[]
) {
  // Create the game here
  const reqData = <ICreateGameRequest>{
    gameName,
    playerName,
    wordSet,
  };

  const headers = {
    "Content-Type": "application/json",
  };

  const url = "/create";
  const data = JSON.stringify(reqData);

  const req = <RequestInit>{
    method: 'POST',
    body: data,
    redirect: "follow",
    headers: headers}

    console.log("req:", req);
  await fetch(url, req).then((res) => {
      console.log("response!", res)
      console.log(res.redirected)
      window.location.assign(res.url);

    }).catch((error) => {
      throw new Error(`failed to create game: ${error})`);
    });

}

async function joinGame(gameID: string): Promise<IJoinGameResponse> {
  console.log("joinGame()", gameID);
  const req = <IJoinGameRequest>{
    gameID,
  };

  const headers = {
    "Content-Type": "application/json",
  };
  const url = "/join";
  const data = JSON.stringify(req);

  const res = await fetch(url, {
    method: 'POST',
    body: data,
    headers: headers}).catch((error) => {
      throw new Error(`failed to create game: ${error})`);
    });

  const body = await res.json();
  const gameData = <IJoinGameResponse>body;
  const cookies = document.cookie;
  console.log("cookies:", cookies)
  console.log("RES HEADERS:", res.headers)
  return gameData;
}
