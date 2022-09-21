export default class ErrNoTeamDOM extends Error {
  name = "no-team-dom";

  msg: string;

  constructor(teamID: string) {
    const msg = `team DOM element not found; is '${teamID}' a valid team?'`;
    super(msg);
    this.msg = msg;

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
