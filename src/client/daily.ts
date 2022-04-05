import {
  default as DailyIframe,
  DailyCall,
  DailyEventObjectAppMessage,
  DailyEventObjectParticipant,
  DailyParticipant,
  DailyEventObjectFatalError,
  DailyEventObjectCameraError,
  DailyEventObjectParticipants,
  DailyEventObjectNetworkConnectionEvent,
  DailyRoomInfo,
} from "@daily-co/daily-js";

const playableState = "playable";

export class Call {
  url: string;
  userName: string;
  isGlobal: boolean;
  callObject: DailyCall;
  pendingAcks: { [key: string]: ReturnType<typeof setInterval> } = {};

  constructor(url: string, userName: string, isGlobal = false) {
    console.log("daily loading");
    this.url = url;
    this.userName = userName;
    this.isGlobal = isGlobal;
    this.callObject = DailyIframe.createCallObject({
      subscribeToTracksAutomatically: false,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
        camSimulcastEncodings: [{ maxBitrate: 600000, maxFramerate: 30 }],
      },
    }).on("joined-meeting", (e) => {
      console.log("hellooo");
    });
  }
}
