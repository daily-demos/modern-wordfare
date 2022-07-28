import axios from "axios";
import claimsAreValid from "../shared/jwt";
import { DAILY_API_KEY, DAILY_STAGING } from "./env";

const isStaging = DAILY_STAGING === "true";

let dailyAPIDomain = "daily.co";
if (isStaging) {
  dailyAPIDomain = "staging.daily.co";
}

const dailyAPIURL = `https://api.${dailyAPIDomain}/v1`;

// The data we'll expect to get from Daily on room creation.
// Daily actually returns much more data, but these are the only
// properties we'll be using.
interface CreatedDailyRoomData {
  id: string;
  name: string;
  url: string;
}

export async function createRoom(): Promise<CreatedDailyRoomData> {
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

  const roomErrMsg = "failed to create room";

  const res = await axios.post(url, data, { headers }).catch((error) => {
    console.error(roomErrMsg, res);
    throw new Error(`${roomErrMsg}: ${error})`);
  });

  if (res.status !== 200 || !res.data) {
    console.error("unexpected room creation response:", res);
    throw new Error(roomErrMsg);
  }
  // Cast Daily's response to our room data interface.
  const roomData = <CreatedDailyRoomData>res.data;

  const roomURL = roomData.url;
  if (isStaging && !roomURL.includes("staging.daily.co")) {
    roomData.url = roomURL.replace("daily.co", "staging.daily.co");
  }

  return roomData;
}

// getMeetingToken() obtains a meeting token for a room from Daily
export async function getMeetingToken(roomName: string): Promise<string> {
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

  const errMsg = "failed to create meeting token";
  const res = await axios.post(url, data, { headers }).catch((error) => {
    throw new Error(`${errMsg}: ${error})`);
  });
  if (res.status !== 200) {
    throw new Error(`${errMsg}: got status ${res.status})`);
  }
  return res.data?.token;
}

export async function tokenIsValid(token: string): Promise<boolean> {
  if (!claimsAreValid(token)) return false;

  const url = `${dailyAPIURL}/meeting-tokens/${token}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const errMsg = "failed to check meeting token validity";
  const res = await axios.post(url, { headers }).catch((error) => {
    throw new Error(`${errMsg}: ${error})`);
  });
  if (res.status !== 200) {
    throw new Error(`${errMsg}: got status ${res.status})`);
  }
  return true;
}
