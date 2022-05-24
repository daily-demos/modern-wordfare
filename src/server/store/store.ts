import { Game } from "../game";

export interface PlayerInfo {
  playerID: string;
  gameID: string;
}

// StoreClient is an interface used by the GameOrchestrator class,
// to save and retrieve game state data.
export interface StoreClient {
  connect: () => void;
  storeGame: (game: Game) => void;
  getGame: (gameID: string) => Promise<Game>;
  storeSocketMapping: (socketID: string, playerInfo: PlayerInfo) => void;
  getSocketMapping: (socketID: string) => Promise<PlayerInfo>;
  deleteSocketMapping: (socketID: string) => void;
}
