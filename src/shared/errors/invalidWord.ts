export default class InvalidWord extends Error {
  name = "invalid-word";

  msg: string;

  constructor(word: string) {
    const msg = `word "${word}" is invalid`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, InvalidWord.prototype);
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
