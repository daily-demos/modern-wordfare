export default class ErrNoLobby extends Error {
  name = "no-lobby";

  msg: string;

  constructor() {
    const msg = "lobby DOM element not found";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, ErrNoLobby.prototype);
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
