// These imports are here to ensure they're bundled into
// the final distribution.
import "./env";
import "./html/index.html";
import "./html/style.css";
import "./assets/Jaldi-Regular.ttf";
import "./assets/Jaldi-Bold.ttf";
import "./assets/favicon.ico";
import "./assets/daily.svg";
import "./assets/github.png";
import "./assets/new-tab-icon.png";
import "./assets/camera-off.svg";
import "./assets/camera.svg";
import "./assets/microphone-off.svg";
import "./assets/microphone.svg";
import initJoinProcess from "./join";
import initCreateProcess from "./create";
import showError from "./error";

window.addEventListener("DOMContentLoaded", () => {
  // See if we have any query parameters indicating the user
  // is joining an existing game
  const usp = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(usp.entries());

  // If a game ID was specified in the URL parameters,
  // start the game join process. Otherwise, start
  // game creation process.
  try {
    if (params.gameID) {
      initJoinProcess(params);
      return;
    }
    initCreateProcess();
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to join or create game";
    showError(msg);
  }
});
