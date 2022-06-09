export default class PlayerNotFound extends Error {
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
