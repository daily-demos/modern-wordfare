export default class OperationForbidden extends Error {
  name = "operation-forbidden";

  msg: string;

  constructor() {
    const msg = "insufficient privileges to perform this operation";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, OperationForbidden.prototype);
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
