import { nameMaxLength, nameMinLength, sanitize } from "../input";

export default class InvalidName extends Error {
  name = "invalid-name";

  msg: string;

  constructor(name: string) {
    const msg = `name "${sanitize(
      name,
    )}" is invalid; must contain only alphanumeric characters, spaces, or dashes, and be ${nameMinLength}-${nameMaxLength} characters long`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, InvalidName.prototype);
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
