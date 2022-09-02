import InvalidName from "../shared/errors/invalidName";
import { isValidName } from "../shared/input";
import { CreateGameRequest } from "../shared/types";
import { Word } from "../shared/word";
import showError from "./error";
import createWordSet from "./util/word";

const lobbyDiv = document.getElementById("lobby");
const createForm = <HTMLFormElement>document.getElementById("create-game-form");

// initCreateProcess() sets up the game creation form
export default function initCreateProcess() {
  showCreation();
  createForm.onsubmit = (e) => {
    e.preventDefault();

    hideCreation();
    const gameNameForm = <HTMLFormElement>document.getElementById("game-name");
    const inputGameName = gameNameForm?.value;

    const playerNameForm = <HTMLFormElement>(
      document.getElementById("create-player-name")
    );
    const inputPlayerName = playerNameForm?.value;
    const wordSet = createWordSet();

    try {
      validateInput(inputPlayerName, inputGameName);
    } catch (error) {
      showCreation();
      showError(error.toString());
      return;
    }

    createGame(inputGameName, inputPlayerName, wordSet)
      .then((url: string) => {
        window.location.assign(url);
      })
      .catch((error) => {
        showCreation();
        showError(error.toString());
      });
  };
}

// createGame() makes a POST request to the /create
// endpoint to make a new game.
function createGame(
  gameName: string,
  playerName: string,
  wordSet: Word[]
): Promise<string> {
  const reqData = <CreateGameRequest>{
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
    method: "POST",
    body: data,
    redirect: "follow",
    headers,
  };

  return fetch(url, req).then((res) => {
    if (res.status === 200) {
      return res.url;
    }
    // We'll expect the body to contain an error
    // in JSON format.
    return res.text().then((json) => {
      throw new Error(json);
    });
  });
}

function hideCreation() {
  lobbyDiv.classList.add("invisible");
  createForm.setAttribute("disabled", "true");
}

function showCreation() {
  lobbyDiv.classList.remove("invisible");
  createForm.classList.remove("invisible");
  createForm.setAttribute("disabled", "false");
}

function validateInput(playerName: string, gameName: string) {
  if (!isValidName(playerName)) {
    throw new InvalidName(playerName);
  }
  if (!isValidName(gameName)) {
    throw new InvalidName(gameName);
  }
}
