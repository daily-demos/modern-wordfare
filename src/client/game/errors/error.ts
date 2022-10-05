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
  getButton?: (onclick: (btn: HTMLButtonElement) => void) => HTMLButtonElement;
}

export default function showGameError(error: GameError) {
  // Log the error first of all
  console.error(error);

  const errDiv = <HTMLDivElement>document.getElementById("gameError");
  if (!errDiv.classList.contains("invisible")) return;
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
  const defaultButton = <HTMLButtonElement>(
    errDiv.getElementsByTagName("button")[0]
  );

  const onClickShared = () => {
    subheadEle.innerText = "";
    msgEle.innerText = "";
    errDiv.classList.add("invisible");
  };
  // See if this error defines a custom button
  if (error.getButton) {
    // If there is a custom button, attach that to the DOM
    const container = <HTMLDivElement>(
      errDiv.getElementsByClassName("container")[0]
    );
    defaultButton.classList.add("invisible");

    // define additional onClick cleanup
    const oc = (button: HTMLButtonElement) => {
      onClickShared();
      container.removeChild(button);
    };
    const button = error.getButton(oc);
    container.appendChild(button);
  } else {
    // Set up default Close button
    defaultButton.classList.remove("invisible");
    defaultButton.onclick = () => {
      onClickShared();
    };
  }

  // Display the error DIV
  errDiv.classList.remove("invisible");
}
