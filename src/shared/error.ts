import { Team } from "./types";

export class DuplicatePlayer extends Error {
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

export class PlayerNotFound extends Error {
  name = "player-not-found";
  msg: string;

  constructor(playerID: string) {
    const msg = `player ID ${playerID} not found`;
    super(msg);
    this.msg = msg;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, PlayerNotFound.prototype);
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

export class SpymasterExists extends Error {
  name = "spymaster-exists";
  msg: string;
  constructor(teamID: Team) {
    const msg = `spymaster for team ${teamID} already exists`;
    super(msg);
    this.msg = msg;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, SpymasterExists.prototype);
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
