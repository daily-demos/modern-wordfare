import { Team } from "./types";

export class DuplicatePlayer extends Error {
  constructor(playerID: string, teamID: Team) {
    const msg = `player ID ${playerID} is already on team ${teamID}`;
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, DuplicatePlayer.prototype);
  }
}
