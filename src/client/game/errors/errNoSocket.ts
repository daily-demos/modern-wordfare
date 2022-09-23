import { GameError } from "./error";

const msg = "WebSocket not initialized";

export default class ErrNoSocket extends Error implements GameError {
  name = "no-websocket";

  unrecoverable = true;

  constructor() {
    super(msg);

    Object.setPrototypeOf(this, ErrNoSocket.prototype);
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
