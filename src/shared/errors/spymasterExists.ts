import { Team } from "../types";

export default class SpymasterExists extends Error {
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
