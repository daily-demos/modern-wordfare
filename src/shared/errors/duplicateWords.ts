export default class DuplicatePlayer extends Error {
  name = "duplicate-words";

  msg: string;

  constructor() {
    const msg = "wordset contains duplicate words";
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
