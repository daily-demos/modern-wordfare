import axios from "axios";
import { DAILY_API_KEY, DAILY_STAGING } from "./env";
import { Game, GameState } from "./game";
import { Team } from "../shared/types";
import SocketMappingNotFound from "../shared/errors/socketMappingNotFound";
import GameNotFound from "../shared/errors/gameNotFound";
import { TurnResultData } from "../shared/events";
import { PlayerInfo, StoreClient } from "./store/store";
import { Word } from "../shared/word";
import Player from "../shared/player";

const isStaging = DAILY_STAGING === "true";

let dailyAPIDomain = "daily.co";
if (isStaging) {
  dailyAPIDomain = "staging.daily.co";
}

const dailyAPIURL = `https://api.${dailyAPIDomain}/v1`;

// The data we'll expect to get from Daily on room creation.
// Daily actually returns much more data, but these are the only
// properties we'll be using.
interface ICreatedDailyRoomData {
  id: string;
  name: string;
  url: string;
}

// GameOrchestrator serves as the entry point into
// all game actions. It also manages storage of
// game state in whatever cache we are using
// (basic in-memory cache by default)
export default class GameOrchestrator {
  private readonly dailyAPIKey: string = DAILY_API_KEY;

  // storeClient() is our storage implementation, by default
  // a basic memory cache
  private readonly storeClient: StoreClient;

  constructor(storeClient: StoreClient) {
    this.storeClient = storeClient;
  }

  // createGame() creates a new game using the given name and word set.
  // It does so by creating a Daily room and then an instance of Game.
  async createGame(name: string, wordSet: Word[]): Promise<Game> {
    const apiKey = DAILY_API_KEY;

    // Prepare our desired room properties. Participants will start with
    // mics and cams off, and the room will expire in 24 hours.
    const req = {
      properties: {
        exp: Math.floor(Date.now() / 1000) + 86400,
        start_audio_off: true,
        start_video_off: true,
      },
    };

    // Prepare our headers, containing our Daily API key
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const url = `${dailyAPIURL}/rooms/`;
    const data = JSON.stringify(req);
    const res = await axios.post(url, data, { headers }).catch((error) => {
      console.log("failed to create room:", res);
      throw new Error(`failed to create room: ${error})`);
    });

    if (res.status !== 200 || !res.data) {
      console.error("unexpected room creation response:", res);
      throw new Error("failed to create room");
    }
    const body = JSON.parse(JSON.stringify(res.data));

    // Cast Daily's response to our room data interface.
    const roomData = <ICreatedDailyRoomData>body;

    // Workaround for bug with incorrect room url return for staging.
    let roomURL = roomData.url;

    if (isStaging && !roomURL.includes("staging.daily.co")) {
      roomURL = roomURL.replace("daily.co", "staging.daily.co");
    }

    // Instantiate game with given room URL and name, and store
    // the newly created game.
    const game = new Game(name, roomURL, roomData.name, wordSet);
    await this.storeClient.storeGame(game);
    return game;
  }

  // getMeetingToken() obtains a meeting token for a room from Daily
  async getMeetingToken(roomName: string): Promise<string> {
    const api = this.dailyAPIKey;
    const req = {
      properties: {
        room_name: roomName,
        exp: Math.floor(Date.now() / 1000) + 86400,
        is_owner: true,
      },
    };

    const data = JSON.stringify(req);
    const headers = {
      Authorization: `Bearer ${api}`,
      "Content-Type": "application/json",
    };

    const url = `${dailyAPIURL}/meeting-tokens/`;
    const res = await axios.post(url, data, { headers }).catch((error) => {
      throw new Error(`failed to create meeting token: ${error})`);
    });

    return res.data?.token;
  }

  // getGame() retrieves a game from storage
  async getGame(gameID: string): Promise<Game> {
    const game = await this.storeClient.getGame(gameID);
    return game;
  }

  // joinGame adds a player to a game, if the game for their
  // requested ID exists.
  async joinGame(
    gameID: string,
    playerID: string,
    team: Team,
    socketID: string
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

    // Remove player from the game and delete socket mapping.
    game.removePlayer(playerInfo.playerID);
    this.storeClient.deleteSocketMapping(socketID);
    return playerInfo;
  }

  // restartGame() restarts the given game with the new word set
  async restartGame(socketID: string, gameID: string, newWordSet: Word[]) {
    // First, find the game itself
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }

    // Find the socket mapping associated with the user requesting this restart
    const playerInfo = await this.storeClient.getSocketMapping(socketID);
    if (!playerInfo) {
      throw new SocketMappingNotFound(socketID);
    }

    // Only allow a member of the game to restart the game.
    // (Maybe in the future only the meeting owner/game host should be
    // allowed to do this? TBD)
    if (playerInfo.gameID !== gameID) {
      throw new Error(
        `game ID mismatch between request (${gameID}) and socket mapping (${playerInfo.gameID})`
      );
    }
    game.restart(newWordSet);
    this.storeClient.storeGame(game);
  }

  // setGameSpymaster() sets the given player as the spymaster for the given team and game.
  async setGameSpymaster(
    gameID: string,
    playerID: string,
    team: Team
  ): Promise<{ spymaster: Player; currentTurn: Team }> {
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    const spymaster = game.setSpymaster(playerID, team);

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
    playerID: string
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
  async toggleGameTurn(gameID: string): Promise<Team> {
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    game.nextTurn();
    this.storeClient.storeGame(game);
    return game.currentTurn;
  }
}
