export default class ErrNoBoard extends Error {
  name = "no-board";

  msg: string;

  constructor() {
    const msg = "board not initialized";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, ErrNoBoard.prototype);
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
