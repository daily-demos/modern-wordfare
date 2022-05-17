export default class ErrTileAlreadyExists extends Error {
  name = "duplicate-player";

  msg: string;

  constructor(playerID: string) {
    const msg = `tile already exists for player id: ${playerID}`;
    super(msg);
    this.msg = msg;

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
