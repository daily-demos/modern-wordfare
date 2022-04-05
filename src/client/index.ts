import { Call } from "./daily";

// These imports are here to ensure they're bundled into
// the final distribution.
import "./html/index.html";
import "./style.css";
import "./assets/favicon.ico";
import "./assets/daily.svg";
import "./assets/github.png";
import "./assets/camera-off.svg";
import "./assets/camera.svg";
import "./assets/microphone-off.svg";
import "./assets/microphone.svg";
import "./assets/screen-off.svg";
import "./assets/screen-on.svg";
import { Game } from "./game";

export function initGame() {
  const game = new Game();
}

initGame();
