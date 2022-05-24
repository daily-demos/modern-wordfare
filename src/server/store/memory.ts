import NodeCache from "node-cache";
import { Game } from "../game";
import { PlayerInfo, StoreClient } from "./store";

// TTL is by default 900 seconds. Any time
// a game is updated, its expiry is reset.
const gameTTLSeconds = 900;

// Memory is a basic in-memory cache for game data.
// It is cleared on each server restart and offers
// zero persistence.
export default class Memory implements StoreClient {
  client: NodeCache;

  constructor() {
    this.client = new NodeCache();
  }

  connect: () => void;

  storeGame(game: Game) {
    this.client.set(getGameKey(game.id), game, gameTTLSeconds);
  }

  async getGame(gameID: string): Promise<Game> {
    return this.client.get(getGameKey(gameID));
  }

  storeSocketMapping(socketID: string, playerInfo: PlayerInfo) {
    this.client.set(getSocketMappingKey(socketID), playerInfo);
  }

  async getSocketMapping(socketID: string): Promise<PlayerInfo> {
    return this.client.get(getSocketMappingKey(socketID));
  }

  deleteSocketMapping(socketID: string) {
    this.client.del(getSocketMappingKey(socketID));
  }
}

function getGameKey(gameID: string): string {
  return `GAME:${gameID}`;
}

function getSocketMappingKey(socketID: string): string {
  return `SOCKET:${socketID}`;
}
