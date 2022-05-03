import axios from "axios";
import { DAILY_API_KEY } from "./env";
import { Game } from "./game";
import { Team, Word } from "../shared/types";
import SocketMappingNotFound from "../shared/errors/socketMappingNotFound";
import GameNotFound from "../shared/errors/gameNotFound";

const dailyAPIURL = "https://api.daily.co/v1";

interface ICreatedDailyRoomData {
  id: string;
  name: string;
  url: string;
}

interface PlayerInfo {
  playerID: string;
  gameID: string;
}

export default class GameOrchestrator {
  games: Map<string, Game> = new Map();

  private readonly dailyAPIKey: string = DAILY_API_KEY;

  private socketMappings: { [key: string]: PlayerInfo } = {};

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

    const game = new Game(name, roomData.url, roomData.name, wordSet);
    this.games.set(game.id, game);
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

  getGame(gameID: string): Game {
    return this.games.get(gameID);
  }

  // joinGame adds a player to a game, if the game for their
  // requested ID exists.
  joinGame(
    gameID: string,
    playerID: string,
    team: Team,
    socketID: string
  ): Game {
    const game = this.getGame(gameID);
    if (!game) {
      throw new GameNotFound(gameID);
    }
    game.addPlayer(playerID, team);
    this.socketMappings[socketID] = <PlayerInfo>{
      gameID,
      playerID,
    };
    return game;
  }

  // ejectPlayer removes the player associated with the given
  // socket ID from whatever game they are in.
  ejectPlayer(socketID: string) {
    console.log("ejecting player", socketID);
    const playerInfo = this.socketMappings[socketID];
    if (!playerInfo) {
      throw new SocketMappingNotFound(socketID);
    }
    const game = this.getGame(playerInfo.gameID);
    game.removePlayer(playerInfo.playerID);
    delete this.socketMappings[socketID];
  }
}
