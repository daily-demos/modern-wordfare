export default class ErrNoBoardData extends Error {
  name = "no-board-data";

  msg: string;

  constructor() {
    const msg = "board data not initialized";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, ErrNoBoardData.prototype);
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
