import { GameError } from "./error";

export default class ErrGeneric extends Error implements GameError {
  name = "game-error";

  msg: string;

  unrecoverable = true;

  constructor(msg: string, unrecoverable = true) {
    super(msg);
    this.msg = msg;
    this.unrecoverable = unrecoverable;
    Object.setPrototypeOf(this, ErrGeneric.prototype);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.msg,
      },
    };
  }
}
