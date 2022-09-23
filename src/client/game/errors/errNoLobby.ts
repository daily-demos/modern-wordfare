import { GameError } from "./error";

const msg = "Lobby DOM element not found";

export default class ErrNoLobby extends Error implements GameError {
  name = "no-lobby";

  unrecoverable = true;

  constructor() {
    super(msg);

    Object.setPrototypeOf(this, ErrNoLobby.prototype);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: msg,
      },
    };
  }
}
