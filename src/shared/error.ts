import { Team } from "./types";

export class DuplicatePlayer extends Error {
  name = "duplicate-player";
  msg: string;

  constructor(playerID: string, teamID: Team) {
    const msg = `player ID ${playerID} is already on team ${teamID}`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, DuplicatePlayer.prototype);
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

export class PlayerNotFound extends Error {
  name = "player-not-found";
  msg: string;

  constructor(playerID: string) {
    const msg = `player ID ${playerID} not found`;
    super(msg);
    this.msg = msg;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, PlayerNotFound.prototype);
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

export class SpymasterExists extends Error {
  name = "spymaster-exists";
  msg: string;
  constructor(teamID: Team) {
    const msg = `spymaster for team ${teamID} already exists`;
    super(msg);
    this.msg = msg;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, SpymasterExists.prototype);
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

export class InvalidTurn extends Error {
  name = "invalid-turn";
  msg: string;

  constructor() {
    const msg = "it is not your turn!";
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, InvalidTurn.prototype);
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

export class WordAlreadyRevealed extends Error {
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

export class InvalidWord extends Error {
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

export class GameNotFound extends Error {
  name = "game-not-found";
  msg: string;

  constructor(gameID: string) {
    const msg = `game "${gameID}" not found`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, GameNotFound.prototype);
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

export class SocketMappingNotFound extends Error {
  name = "socket-mapping-not-found";
  msg: string;

  constructor(socketID: string) {
    const msg = `mapping for socket ID "${socketID}" not found`;
    super(msg);
    this.msg = msg;

    Object.setPrototypeOf(this, GameNotFound.prototype);
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
