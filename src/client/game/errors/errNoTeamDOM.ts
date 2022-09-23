import { GameError } from "./error";

export default class ErrNoTeamDOM extends Error implements GameError {
  name = "no-team-dom";

  msg: string;

  unrecoverable = true;

  constructor(teamID: string) {
    // We call `getMsg()` twice here to avoid an error
    // related to `super()` needing to be the first call
    // in the constructor.
    super(getMsg(teamID));
    this.msg = getMsg(teamID);

    Object.setPrototypeOf(this, ErrNoTeamDOM.prototype);
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

function getMsg(teamID: string): string {
  return `Team DOM element not found; is '${teamID}' a valid team?`;
}
