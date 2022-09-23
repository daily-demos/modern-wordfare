import { GameError } from "./error";

export default class ErrTileAlreadyExists extends Error implements GameError {
  name = "duplicate-player-tile";

  unrecoverable = true;

  msg: string;

  constructor(playerID: string) {
    super(getMsg(playerID));
    this.msg = getMsg(playerID);

    Object.setPrototypeOf(this, ErrTileAlreadyExists.prototype);
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

function getMsg(playerID: string): string {
  return `Tile already exists for player id: ${playerID}`;
}
