export default class GameNotFound extends Error {
  name = "game-not-found";

  msg: string;

  constructor(gameID: string) {
    const msg = `game "${gameID}" not found`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, GameNotFound.prototype);
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
