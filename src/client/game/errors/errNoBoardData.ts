import { GameError } from "./error";

const msg = "Board data not initialized.";

export default class ErrNoBoardData extends Error implements GameError {
  name = "no-board-data";

  unrecoverable = true;

  constructor() {
    super(msg);

    Object.setPrototypeOf(this, ErrNoBoardData.prototype);
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
