import { Game, GameState } from "./game";
import { Team } from "../shared/types";
import SocketMappingNotFound from "../shared/errors/socketMappingNotFound";
import GameNotFound from "../shared/errors/gameNotFound";
import { TurnResultData } from "../shared/events";
import { PlayerInfo, StoreClient } from "./store/store";
import { Word } from "../shared/word";
import Player from "../shared/player";
import { createRoom } from "./daily";
import OperationForbidden from "../shared/errors/operationForbidden";
import { isGameHostValueValid } from "./cookie";

// GameOrchestrator serves as the entry point into
// all game actions. It also manages storage of
// game state in whatever cache we are using
// (basic in-memory cache by default)
export default class GameOrchestrator {
  // storeClient() is our storage implementation, by default
  // a basic memory cache
  private readonly storeClient: StoreClient;

  constructor(storeClient: StoreClient) {
    this.storeClient = storeClient;
  }

  // createGame() creates a new game using the given name and word set.
  // It does so by creating a Daily room and then an instance of Game.
  async createGame(name: string, wordSet: Word[]): Promise<Game> {
    const roomData = await createRoom();

    // Instantiate game with given room URL and name, and store
    // the newly created game.
    const game = new Game(name, roomData.url, roomData.name, wordSet);
    this.storeClient.storeGame(game);
    return game;
  }

  // getGame() retrieves a game from storage
  async getGame(gameID: string): Promise<Game | undefined> {
    return this.storeClient.getGame(gameID);
  }

  // joinGame adds a player to a game, if the game for their
  // requested ID exists.
  async joinGame(
    gameID: string,
    playerID: string,
    team: Team,
    socketID: string,
  ): Promise<Game> {
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    game.addPlayer(playerID, team);
    this.storeClient.storeSocketMapping(socketID, <PlayerInfo>{
      gameID,
      playerID,
    });
    this.storeClient.storeGame(game);
    return game;
  }

  // ejectPlayer removes the player associated with the given
  // socket ID from whatever game they are in.
  async ejectPlayer(socketID: string): Promise<PlayerInfo> {
    console.log("ejecting player", socketID);

    // Find the relevant socket mapping in storage
    const playerInfo = await this.storeClient.getSocketMapping(socketID);
    if (!playerInfo) {
      throw new SocketMappingNotFound(socketID);
    }

    // Find matching game using socket mapping info
    const game = await this.getGame(playerInfo.gameID);
    if (!game) {
      throw new GameNotFound(playerInfo.gameID);
    }

    // Remove player from the game and delete socket mapping.
    game.removePlayer(playerInfo.playerID);
    this.storeClient.deleteSocketMapping(socketID);
    this.storeClient.storeGame(game);
    return playerInfo;
  }

  // restartGame() restarts the given game with the new word set
  async restartGame(
    socketID: string,
    gameID: string,
    newWordSet: Word[],
    gameHostCookieVal: number,
  ) {
    // First, find the game itself
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }

    const isGameHost = isGameHostValueValid(gameHostCookieVal, game.createdAt);
    // Game host can restart the game any time
    const playerRestartAllowed = await this.isRestartAllowed(game, socketID);
    if (isGameHost || playerRestartAllowed) {
      game.restart(newWordSet);
      this.storeClient.storeGame(game);
      return;
    }

    throw new OperationForbidden();
  }

  // setGameSpymaster() sets the given player as the spymaster for the given team and game.
  async setGameSpymaster(
    gameID: string,
    playerID: string,
    team: Team,
    socketID: string,
  ): Promise<{ spymaster: Player; currentTurn: Team }> {
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    const spymaster = game.setSpymaster(playerID, team);
    this.storeClient.storeSocketMapping(socketID, <PlayerInfo>{
      gameID,
      playerID,
    });
    // If both teams now have a spymaster, trigger the first turn!
    if (game.spymastersReady() && game.state === GameState.Pending) {
      game.nextTurn();
    }
    this.storeClient.storeGame(game);
    return {
      spymaster,
      currentTurn: game.currentTurn,
    };
  }

  // selectGameWord registers a word selection for a game
  async selectGameWord(
    gameID: string,
    wordVal: string,
    playerID: string,
  ): Promise<TurnResultData> {
    // Retrieve the requested game
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    // Attempt to select the word
    const turnRes = game.selectWord(wordVal, playerID);

    // If the word was successfully revealed, store new
    // game state in the cache.
    if (
      turnRes.lastRevealedWord.value === wordVal ||
      turnRes.newCurrentTurn !== Team.None
    ) {
      this.storeClient.storeGame(game);
    }
    return turnRes;
  }

  // toggleGameTurn() toggles the turn to the next team.
  // Possible improvement: only allow a player on team
  // which is active to end their turn.
  async toggleGameTurn(gameID: string): Promise<Team> {
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    game.nextTurn();
    this.storeClient.storeGame(game);
    return game.currentTurn;
  }

  // isRestartAllowed() verifies that the given non-host
  // player is allowed to restart a game
  async isRestartAllowed(game: Game, socketID: string): Promise<boolean> {
    // If user is not the game host and the game is in session,
    // restarting is forbidden.
    if (game.state === GameState.Playing) {
      return false;
    }

    // Find the socket mapping associated with the user requesting this restart
    const playerInfo = await this.storeClient.getSocketMapping(socketID);
    if (!playerInfo) {
      return false;
    }

    // Only allow a member of the game to restart the game.
    if (playerInfo.gameID !== game.id) {
      return false;
    }
    return true;
  }
}
