import { rand } from "../../../shared/math";

const oopsMessages = [
  "Something went wrong!",
  "Well... this is awkward.",
  "Uh oh!",
  "Oops!",
  "This is a little embarrassing...",
];

export interface GameError extends Error {
  unrecoverable: boolean;
}

export default function showGameError(error: GameError) {
  // Log the error first of all
  console.error(error);

  const errDiv = <HTMLDivElement>document.getElementById("gameError");

  // Set subheading
  const subheadEle = <HTMLHeadingElement>errDiv.getElementsByTagName("h4")[0];
  const idx = rand(0, oopsMessages.length - 1);
  const subheading = oopsMessages[idx];
  subheadEle.innerText = subheading;

  // Set error message
  const msgEle = <HTMLParagraphElement>errDiv.getElementsByTagName("p")[0];
  let msg = `${error.message} (${error.name})`;
  if (error.unrecoverable) {
    msg = `Please try re-joining the game. (Error details: ${msg})`;
  }
  msgEle.innerText = msg;

  // Set up Close button
  const button = <HTMLButtonElement>errDiv.getElementsByTagName("button")[0];
  button.onclick = () => {
    subheadEle.innerText = "";
    msgEle.innerText = "";
    errDiv.classList.add("invisible");
  };

  // Display the error DIV
  errDiv.classList.remove("invisible");
}
