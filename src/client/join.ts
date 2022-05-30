import NoMeetingToken from "../shared/errors/noMeetingToken";
import { IJoinGameRequest, IJoinGameResponse } from "../shared/types";
import { tryGetMeetingToken } from "../shared/util";
import { BoardData } from "./game/board";
import Game from "./game/game";

// initGame() starts a game using the given
// board data
function initGame(boardData: BoardData) {
  const game = new Game();
  game.start(boardData);
}

// initJoinProcess() checks if the given parameters contain
// a player name. If so, it joins the given game. If not,
// it shows a form for the user to input their player name.
export default async function initJoinProcess(params: any) {
  // Player name param is included in the URL
  if (params.playerName) {
    tryJoinGame(params.gameID, params.playerName);
    return;
  }
  // No player name was provided, show join form
  const lobbyDiv = document.getElementById("lobby");
  lobbyDiv.classList.remove("invisible");

  const joinForm = document.getElementById("join-game-form");
  joinForm.classList.remove("invisible");
  joinForm.onsubmit = async (e) => {
    e.preventDefault();
    joinForm.classList.add("invisible");
    const playerNameInput = <HTMLFormElement>(
      document.getElementById("join-player-name")
    );
    const inputPlayerName = playerNameInput?.value;
    tryJoinGame(params.gameID, inputPlayerName);
  };
}

// tryJoinGame() tries to join a game using the given
// game ID and player name.
function tryJoinGame(gameID: string, playerName: string) {
  joinGame(gameID)
    .then((res: IJoinGameResponse) => {
      // See if we have a cookie with the token
      // for this game ID
      const cookies = document.cookie;
      let token: string;
      try {
        const mt = tryGetMeetingToken(cookies);
        if (mt.gameID === gameID) {
          token = mt.token;
        }
      } catch (e) {
        if (!(e instanceof NoMeetingToken)) {
          throw e;
        }
      }

      // Hide the lobby UI and set up the board data
      const lobbyDiv = document.getElementById("lobby");
      lobbyDiv.classList.add("invisible");
      const boardData = <BoardData>{
        roomURL: res.roomURL,
        gameID,
        gameName: res.gameName,
        playerName,
        wordSet: res.wordSet,
        meetingToken: token,
      };
      initGame(boardData);
    })
    .catch((e) => {
      console.error(e);
    });
}

// joinGame() makes a POST request to the /join endpoint, attempting
// to join the requested game.
async function joinGame(gameID: string): Promise<IJoinGameResponse> {
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
    headers,
  }).catch((error) => {
    throw new Error(`failed to join game: ${error})`);
  });

  const body = await res.json();
  const gameData = <IJoinGameResponse>body;
  return gameData;
}
