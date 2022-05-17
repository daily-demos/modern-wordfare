import { ICreateGameRequest } from "../shared/types";
import { Word } from "../shared/word";
import createWordSet from "./util/word";

export function initCreateProcess() {
  const lobbyDiv = document.getElementById("lobby");
  lobbyDiv.classList.remove("invisible");
  console.log("showing creat form");
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
    method: "POST",
    body: data,
    redirect: "follow",
    headers: headers,
  };

  console.log("req:", req);
  await fetch(url, req)
    .then((res) => {
      console.log("response!", res);
      console.log(res.redirected);
      window.location.assign(res.url);
    })
    .catch((error) => {
      throw new Error(`failed to create game: ${error})`);
    });
}
