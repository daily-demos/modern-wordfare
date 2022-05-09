import { Player } from "../../shared/types";
import { Game } from "../game";
import { PlayerInfo } from "../orchestrator";
import { StoreClient } from "./store";
import NodeCache from "node-cache";

const gameTTL = 300;
const errNotImplemented = new Error("not implemented");

export class Memory implements StoreClient {
  client: NodeCache;

  constructor() {
    this.client = new NodeCache();
  }
  connect: () => void;

  storeGame(game: Game) {
    this.client.set(this.getGameKey(game.id), game, gameTTL);
  }

  async getGame(gameID: string): Promise<Game> {
    return this.client.get(this.getGameKey(gameID));
  }

  storePlayer(gameID: string, player: Player) {
    throw errNotImplemented;
  }

  async getPlayer(gameID: string, playerID: string): Promise<Player> {
    throw errNotImplemented;
  }

  storeSocketMapping(socketID: string, playerInfo: PlayerInfo) {
    this.client.set(this.getSocketMappingKey(socketID), playerInfo);
  }

  async getSocketMapping(socketID: string): Promise<PlayerInfo> {
    return await this.client.get(this.getSocketMappingKey(socketID));
  }

  deleteSocketMapping(socketID: string) {
    this.client.del(this.getSocketMappingKey(socketID));
  }

  private getGameKey(gameID: string): string {
    return `GAME:${gameID}`;
  }

  private getPlayerKey(playerID: string, gameID: string): string {
    return `PLAYER:${playerID}:${gameID}`;
  }

  private getSocketMappingKey(socketID: string): string {
    return `SOCKET:${socketID}`;
  }
}
