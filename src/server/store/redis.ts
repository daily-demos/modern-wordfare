import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { Game } from "../game";
import { PlayerInfo, StoreClient } from "./store";

// This is a stub, not currently utilized.
export default class Redis implements StoreClient {
  client: RedisClientType;

  constructor(url: string = null) {
    this.client = createClient({ url });
    this.client.on("error", (e) => {
      console.error("Redis client error: ", e);
    });
  }

  connect: () => void;

  storeGame: (game: Game) => void;

  getGame: (gameID: string) => Promise<Game>;

  storeSocketMapping: (socketID: string, playerInfo: PlayerInfo) => void;

  getSocketMapping: (socketID: string) => Promise<PlayerInfo>;

  deleteSocketMapping: (socketID: string) => void;
}
