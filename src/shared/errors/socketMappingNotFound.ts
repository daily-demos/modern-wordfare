export default class SocketMappingNotFound extends Error {
  name = "socket-mapping-not-found";

  msg: string;

  constructor(socketID: string) {
    const msg = `mapping for socket ID "${socketID}" not found`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, SocketMappingNotFound.prototype);
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
