import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import Player from "../../shared/player";
import { Game } from "../game";
import { PlayerInfo, StoreClient } from "./store";

const setNamePlayers = "players";
const setNameSocketMappings = "sockets";
const setNameGame = "games";

// This is very WIP, not currently utilized or complete
export default class Redis implements StoreClient {
  client: RedisClientType;

  constructor(url: string = null) {
    this.client = createClient({ url });
    this.client.on("error", (e) => {
      console.error("Redis client error: ", e);
    });
  }

  async connect() {
    await this.client.connect();
  }

  async storeGame(game: Game) {
    const gameID = game.id;
    const { players } = game;
    // First, store all players
    for (let i = 0; i < players.length; i += 1) {
      const p = players[i];
      this.storePlayer(gameID, p);
    }

    const clonedGame: Game = JSON.parse(JSON.stringify(game));
    clonedGame.players = null; // Players are stored separately
    const data = JSON.stringify(clonedGame);

    console.log("game to store:", data);
    await this.client.HSET(setNameGame, game.id, data);
  }

  async getGame(gameID: string): Promise<Game> {
    const data = await this.client.HGET(setNameGame, gameID);
    console.log("GOT GAME DATA:", data);
    const game: Game = JSON.parse(data);
    return game;
  }

  async storeSocketMapping(socketID: string, playerInfo: PlayerInfo) {
    const data = JSON.stringify(playerInfo);
    console.log("socket data to store:", data);
    await this.client.HSET(setNameSocketMappings, socketID, data);
  }

  async getSocketMapping(socketID: string): Promise<PlayerInfo> {
    const data = await this.client.HGET(setNameSocketMappings, socketID);
    const pi: PlayerInfo = JSON.parse(data);
    return pi;
  }

  async deleteSocketMapping(socketID: string) {
    await this.client.HDEL(setNameSocketMappings, socketID);
  }

  private async storePlayer(gameID: string, player: Player) {
    const key = getPlayerKey(gameID, player.id);
    const data = JSON.stringify(player);
    await this.client.HSET(setNamePlayers, key, data);
  }

  private async getPlayer(gameID: string, playerID: string): Promise<Player> {
    const key = getPlayerKey(gameID, playerID);
    const data = await this.client.HGET(setNamePlayers, key);
    const player: Player = JSON.parse(data);
    return player;
  }
}

function getPlayerKey(gameID: string, playerID: string): string {
  return `${gameID}:${playerID}`;
}
