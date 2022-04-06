import { DAILY_API_KEY, DAILY_DOMAIN } from "./env";
import axios from "axios";

const dailyAPIURL = "https://api.daily.co/v1";

interface ICreatedDailyRoomData {
  id: string;
  name: string;
  url: string;
}

export class GameOrchestrator {
  games: Game[];

  constructor() {}

  async createGame(name: string): Promise<string> {
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
    console.log("RES:", res);

    if (res.status !== 200 || !res.data) {
      console.error("failed to create room2:", res);
      throw new Error("failed to create room");
    }
    const body = JSON.parse(JSON.stringify(res.data));
    const roomData = <ICreatedDailyRoomData>body;
    console.log("gamedata:", roomData);

    const game = new Game();
    game.name = name;
    game.dailyRoomUrl = roomData.url;
    game.state = GameState.Pending;
    this.games.push(game);
    return game.dailyRoomUrl;
  }

  async getMeetingToken(): Promise<string> {
    const api = DAILY_API_KEY;
    const req = {
      properties: {
        exp: Math.floor(Date.now() / 1000) + 3600,
        is_owner: true,
      },
    };

    const body = JSON.stringify(req);
    console.log("meeting token request body:", body, dailyAPIURL);
    let res = await axios
      .post(`${dailyAPIURL}/meeting-tokens`, {
        method: "POST",
        body: body,
        headers: {
          Authorization: `Bearer ${api}`,
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        throw new Error(`failed to get meeting token: ${error})`);
      });

    const data = res.data;
    return data.token;
  }
}
