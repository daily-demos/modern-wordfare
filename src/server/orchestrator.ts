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

interface ICreatedDailyRoomData {
  id: string;
  name: string;
  url: string;
}

export default class GameOrchestrator {
  // games: Map<string, Game> = new Map();

  private readonly dailyAPIKey: string = DAILY_API_KEY;

  private readonly storeClient: StoreClient;

  readonly updateStoreFunc: (game: Game) => void;

  constructor(storeClient: StoreClient) {
    this.storeClient = storeClient;
    this.updateStoreFunc = (game: Game) => {
      this.storeClient.storeGame(game);
    };
  }

  async createGame(name: string, wordSet: Word[]): Promise<Game> {
    const apiKey = DAILY_API_KEY;

    const req = {
      properties: {
        exp: Math.floor(Date.now() / 1000) + 500,
        start_audio_off: true,
        start_video_off: true,
      },
    };

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const url = `${dailyAPIURL}/rooms/`;
    console.log("DAILY STAGING", isStaging, dailyAPIURL);
    const data = JSON.stringify(req);
    const res = await axios.post(url, data, { headers }).catch((error) => {
      throw new Error(`failed to create room: ${error})`);
    });

    if (res.status !== 200 || !res.data) {
      console.error("failed to create room2:", res);
      throw new Error("failed to create room");
    }
    const body = JSON.parse(JSON.stringify(res.data));
    const roomData = <ICreatedDailyRoomData>body;
    // Workaround for bug with incorrect room url return for staging
    let roomURL = roomData.url;

    if (isStaging) {
      roomURL = roomURL.replace("daily.co", "staging.daily.co");
    }
    console.log("room url:", roomData.url, body);

    const game = new Game(name, roomURL, roomData.name, wordSet);
    await this.storeClient.storeGame(game);
    return game;
  }

  async getMeetingToken(roomName: string): Promise<string> {
    const api = this.dailyAPIKey;
    const req = {
      properties: {
        room_name: roomName,
        exp: Math.floor(Date.now() / 1000) + 3600,
        is_owner: true,
      },
    };

    const data = JSON.stringify(req);
    const headers = {
      Authorization: `Bearer ${api}`,
      "Content-Type": "application/json",
    };

    const url = `${dailyAPIURL}/meeting-tokens/`;
    console.log("headers:", url, headers, data);
    const res = await axios.post(url, data, { headers }).catch((error) => {
      throw new Error(`failed to create meeting token: ${error})`);
    });

    return res.data?.token;
  }

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
    const playerInfo = await this.storeClient.getSocketMapping(socketID);
    if (!playerInfo) {
      throw new SocketMappingNotFound(socketID);
    }
    const game = await this.getGame(playerInfo.gameID);
    game.removePlayer(playerInfo.playerID);
    this.storeClient.deleteSocketMapping(socketID);
    return playerInfo;
  }

  async restartGame(socketID: string, gameID: string, newWordSet: Word[]) {
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    const playerInfo = await this.storeClient.getSocketMapping(socketID);
    if (!playerInfo) {
      throw new SocketMappingNotFound(socketID);
    }
    if (playerInfo.gameID !== gameID) {
      throw new Error(
        `game ID mismatch between request (${gameID}) and socket mapping (${playerInfo.gameID})`
      );
    }
    game.restart(newWordSet);
    this.storeClient.storeGame(game);
  }

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
    if (game.spymastersReady() && game.state === GameState.Pending) {
      game.nextTurn();
    }
    this.storeClient.storeGame(game);
    return {
      spymaster,
      currentTurn: game.currentTurn,
    };
  }

  async selectGameWord(
    gameID: string,
    wordVal: string,
    playerID: string
  ): Promise<TurnResultData> {
    const game = await this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    const turnRes = game.selectWord(wordVal, playerID);
    if (
      turnRes.lastRevealedWord.value === wordVal ||
      turnRes.newCurrentTurn !== Team.None
    ) {
      this.storeClient.storeGame(game);
    }
    return turnRes;
  }

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
