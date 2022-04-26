import { DAILY_API_KEY } from "./env";
import axios from "axios";
import { Game, GameState } from "./game";
import { Word } from "../shared/types";

const dailyAPIURL = "https://api.daily.co/v1";

interface ICreatedDailyRoomData {
  id: string;
  name: string;
  url: string;
}

export class GameOrchestrator {
  games: Map<string, Game> = new Map();

  constructor() {}

  async createGame(name: string, wordSet: Word[]): Promise<Game> {
    console.log("createGame()", name);
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
    console.log("headers:", url, headers, data);
    let res = await axios.post(url, data, { headers }).catch((error) => {
      throw new Error(`failed to create room: ${error})`);
    });
    
    if (res.status !== 200 || !res.data) {
      console.error("failed to create room2:", res);
      throw new Error("failed to create room");
    }
    const body = JSON.parse(JSON.stringify(res.data));
    const roomData = <ICreatedDailyRoomData>body;
    console.log("gamedata:", roomData);

    const game = new Game(name, roomData.url, roomData.name, wordSet);
    this.games.set(game.id, game);
    return game;
  }

  async getMeetingToken(roomName: string): Promise<string> {
    const api = DAILY_API_KEY;
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
    let res = await axios.post(url, data, { headers }).catch((error) => {
      throw new Error(`failed to create meeting token: ${error})`);
    });

    return res.data?.token;
  }

  getGame(gameID: string): Game {
    return this.games.get(gameID);
  }
}
