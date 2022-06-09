export default class WordAlreadyRevealed extends Error {
  name = "word-already-reveled";

  msg: string;

  constructor(word: string) {
    const msg = `word "${word}" already revealed`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, WordAlreadyRevealed.prototype);
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
