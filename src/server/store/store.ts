import { Game } from "../game";

export interface PlayerInfo {
  playerID: string;
  gameID: string;
}

export interface StoreClient {
  connect: () => void;
  storeGame: (game: Game) => void;
  getGame: (gameID: string) => Promise<Game>;
  storeSocketMapping: (socketID: string, playerInfo: PlayerInfo) => void;
  getSocketMapping: (socketID: string) => Promise<PlayerInfo>;
  deleteSocketMapping: (socketID: string) => void;
}
