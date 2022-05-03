export default class InvalidTurn extends Error {
  name = "invalid-turn";

  msg: string;

  constructor() {
    const msg = "it is not your turn!";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, InvalidTurn.prototype);
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
