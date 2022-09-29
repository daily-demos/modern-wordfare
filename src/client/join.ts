import InvalidName from "../shared/errors/invalidName";
import { isValidName } from "../shared/input";
import { JoinGameRequest, JoinGameResponse } from "../shared/types";
import showError from "./error";
import { BoardData } from "./game/board";
import ErrNoLobby from "./game/errors/errNoLobby";
import Game from "./game/game";

const lobbyDiv = document.getElementById("lobby");
const joinForm = document.getElementById("join-game-form");

const msgNoJoinForm = "Join form DOM element not found";

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
    hideJoin();
    tryJoinGame(params.gameID, params.playerName);
    return;
  }
  // No player name was provided, show join form
  showJoin();
  if (!joinForm) {
    throw new Error(msgNoJoinForm);
  }
  joinForm.onsubmit = async (e) => {
    e.preventDefault();
    hideJoin();
    const playerNameInput = <HTMLFormElement>(
      document.getElementById("join-player-name")
    );
    const inputPlayerName = playerNameInput?.value;
    try {
      validateInput(inputPlayerName);
      tryJoinGame(params.gameID, inputPlayerName);
    } catch (error) {
      showJoin();
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to validate input and join game";
      showError(msg);
    }
  };
}

// tryJoinGame() tries to join a game using the given
// game ID and player name.
function tryJoinGame(gameID: string, playerName: string) {
  joinGame(gameID)
    .then((res: JoinGameResponse) => {
      const boardData = <BoardData>{
        roomURL: res.roomURL,
        gameID,
        gameName: res.gameName,
        playerName,
        wordSet: res.wordSet,
        meetingToken: res.meetingToken,
      };
      initGame(boardData);
    })
    .catch((e) => {
      console.error(e);
    });
}

// joinGame() makes a POST request to the /join endpoint, attempting
// to join the requested game.
async function joinGame(gameID: string): Promise<JoinGameResponse> {
  const req = <JoinGameRequest>{
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
  const gameData = <JoinGameResponse>body;
  return gameData;
}

function hideJoin() {
  lobbyDiv?.classList.add("invisible");
  joinForm?.setAttribute("disabled", "true");
}

function showJoin() {
  if (!joinForm) {
    throw new Error(msgNoJoinForm);
  }
  if (!lobbyDiv) {
    throw new ErrNoLobby();
  }
  lobbyDiv.classList.remove("invisible");
  joinForm.classList.remove("invisible");
  joinForm.setAttribute("disabled", "false");
}

function validateInput(playerName: string) {
  if (!isValidName(playerName)) {
    throw new InvalidName(playerName);
  }
}
