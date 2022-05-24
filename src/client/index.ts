// These imports are here to ensure they're bundled into
// the final distribution.
import "./html/index.html";
import "./html/style.css";
import "./assets/Jaldi-Regular.ttf";
import "./assets/favicon.ico";
import "./assets/daily.svg";
import "./assets/github.png";
import "./assets/camera-off.svg";
import "./assets/camera.svg";
import "./assets/microphone-off.svg";
import "./assets/microphone.svg";
import "./assets/screen-off.svg";
import "./assets/screen-on.svg";
import { default as initJoinProcess } from "./join";
import { default as initCreateProcess } from "./create";

console.log("loading game!!");

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content loaded");
  // See if we have any query parameters indicating the user
  // is joining an existing game
  const usp = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(usp.entries());

  if (params.gameID) {
    initJoinProcess(params);
    return;
  }
  initCreateProcess();
});
