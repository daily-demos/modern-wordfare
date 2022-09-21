export default class ErrNoCall extends Error {
  name = "no-call";

  msg: string;

  constructor() {
    const msg = "call not initialized";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, ErrNoCall.prototype);
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
