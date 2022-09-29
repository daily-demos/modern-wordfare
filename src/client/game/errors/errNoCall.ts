import { GameError } from "./error";

const msg = "Call not initialized";

export default class ErrNoCall extends Error implements GameError {
  name = "no-call";

  unrecoverable = true;

  constructor() {
    super(msg);

    Object.setPrototypeOf(this, ErrNoCall.prototype);
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
