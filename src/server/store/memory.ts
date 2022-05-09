import NodeCache from "node-cache";
import { Game } from "../game";
import { PlayerInfo, StoreClient } from "./store";

const gameTTL = 300;

export default class Memory implements StoreClient {
  client: NodeCache;

  constructor() {
    this.client = new NodeCache();
  }

  connect: () => void;

  storeGame(game: Game) {
    this.client.set(getGameKey(game.id), game, gameTTL);
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
