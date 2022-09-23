import { GameError } from "./error";

const msg = "Board not initialized";
export default class ErrNoBoard extends Error implements GameError {
  name = "no-board";

  unrecoverable: boolean = true;

  constructor() {
    super(msg);

    Object.setPrototypeOf(this, ErrNoBoard.prototype);
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
