import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { Game } from "../game";
import { PlayerInfo, StoreClient } from "./store";

const errNotImplemented = new Error("Not implemented");

// This is a stub, not currently utilized.
export default class Redis implements StoreClient {
  client: RedisClientType;

  constructor(url: string = "") {
    this.client = createClient({ url });
    this.client.on("error", (e) => {
      console.error("Redis client error: ", e);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  connect() {
    throw errNotImplemented;
  }

  // eslint-disable-next-line class-methods-use-this
  storeGame(_game: Game) {
    throw errNotImplemented;
  }

  // eslint-disable-next-line class-methods-use-this
  async getGame(_gameID: string): Promise<Game | undefined> {
    throw errNotImplemented;
  }

  // eslint-disable-next-line class-methods-use-this
  storeSocketMapping(_socketID: string, _playerInfo: PlayerInfo): void {
    throw errNotImplemented;
  }

  // eslint-disable-next-line class-methods-use-this
  async getSocketMapping(_socketID: string): Promise<PlayerInfo | undefined> {
    throw errNotImplemented;
  }

  // eslint-disable-next-line class-methods-use-this
  deleteSocketMapping(_socketID: string) {
    throw errNotImplemented;
  }
}
