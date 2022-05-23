import { GameData } from "../shared/events";
import { IJoinGameRequest, IJoinGameResponse } from "../shared/types";
import { BoardData } from "./game/board";
import Game from "./game/game";

function initGame(boardData: BoardData) {
  const game = new Game();
  game.start(boardData);
}

export async function initJoinProcess(params: any) {
  console.log("Joining!");
  // Player name param is included in the URL
  if (params.playerName) {
    tryJoinGame(params.gameID, params.playerName);
    return;
  }
  console.log("no player name provided");
  const lobbyDiv = document.getElementById("lobby");
  lobbyDiv.classList.remove("invisible");

  const joinForm = document.getElementById("join-game-form");
  joinForm.classList.remove("invisible");
  joinForm.onsubmit = async (e) => {
    e.preventDefault();
    console.log("join form submitted");
    joinForm.classList.add("invisible");
    const playerNameInput = <HTMLFormElement>(
      document.getElementById("join-player-name")
    );
    const inputPlayerName = playerNameInput?.value;
    tryJoinGame(params.gameID, inputPlayerName);
    return;
  };
}

function tryJoinGame(gameID: string, playerName: string) {
  joinGame(gameID)
    .then((res: IJoinGameResponse) => {
      const lobbyDiv = document.getElementById("lobby");
      lobbyDiv.classList.add("invisible");
      const boardData = <BoardData>{
        roomURL: res.roomURL,
        gameID: gameID,
        gameName: res.gameName,
        playerName: playerName,
        wordSet: res.wordSet,
      };
      initGame(boardData);
    })
    .catch((e) => {
      console.error(e);
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
    method: "POST",
    body: data,
    headers: headers,
  }).catch((error) => {
    throw new Error(`failed to join game: ${error})`);
  });

  const body = await res.json();
  const gameData = <IJoinGameResponse>body;
  const cookies = document.cookie;
  console.log("cookies:", cookies);
  console.log("RES HEADERS:", res.headers);
  return gameData;
}
