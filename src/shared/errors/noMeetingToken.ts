export default class NoMeetingToken extends Error {
  name = "no-meeting-token";

  msg: string;

  constructor() {
    const msg = "no meeting token found";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, NoMeetingToken.prototype);
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
