import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { Player } from "../../shared/types";
import { Game } from "../game";
import { PlayerInfo } from "../orchestrator";
import { Redis } from "./redis";

export interface StoreClient {
  connect: () => void;
  storeGame: (game: Game) => void;
  getGame: (gameID: string) => Promise<Game>;
  storePlayer: (gameID: string, palyer: Player) => void;
  getPlayer: (gameID: string, playerID: string) => Promise<Player>;
  storeSocketMapping: (socketID: string, playerInfo: PlayerInfo) => void;
  getSocketMapping: (socketID: string) => Promise<PlayerInfo>;
  deleteSocketMapping: (socketID: string) => void;
}
