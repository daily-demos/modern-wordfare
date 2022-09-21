export default class ErrNoSocket extends Error {
  name = "no-websocket";

  msg: string;

  constructor() {
    const msg = "websocket not initialized";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, ErrNoSocket.prototype);
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
