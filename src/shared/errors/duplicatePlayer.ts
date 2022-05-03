import { Team } from "../types";

export default class DuplicatePlayer extends Error {
  name = "duplicate-player";

  msg: string;

  constructor(playerID: string, teamID: Team) {
    const msg = `player ID ${playerID} is already on team ${teamID}`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, DuplicatePlayer.prototype);
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
