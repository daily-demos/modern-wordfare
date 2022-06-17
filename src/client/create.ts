import { CreateGameRequest } from "../shared/types";
import { Word } from "../shared/word";
import createWordSet from "./util/word";

// initCreateProcess() sets up the game creation form
export default function initCreateProcess() {
  const lobbyDiv = document.getElementById("lobby");
  lobbyDiv.classList.remove("invisible");

  const createForm = <HTMLFormElement>(
    document.getElementById("create-game-form")
  );
  createForm.classList.remove("invisible");
  createForm.onsubmit = (e) => {
    e.preventDefault();
    lobbyDiv.classList.add("invisible");

    createForm.setAttribute("disabled", "true");
    const gameNameForm = <HTMLFormElement>document.getElementById("game-name");
    const inputGameName = gameNameForm?.value;

    const playerNameForm = <HTMLFormElement>(
      document.getElementById("create-player-name")
    );
    const inputPlayerName = playerNameForm?.value;

    const wordSet = createWordSet();

    createGame(inputGameName, inputPlayerName, wordSet).catch((error) => {
      console.error(error);
    });
  };
}

// createGame() makes a POST request to the /create
// endpoint to make a new game.
async function createGame(
  gameName: string,
  playerName: string,
  wordSet: Word[]
) {
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

  await fetch(url, req)
    .then((res) => {
      window.location.assign(res.url);
    })
    .catch((error) => {
      throw new Error(`failed to create game: ${error})`);
    });
}
