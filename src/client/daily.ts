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

export type joinHandler = (e: DailyEventObjectParticipants) => void
export type leaveHandler = (e: DailyEventObjectParticipant) => void


export class Call {
  private url: string;
  private userName: string;
  private callObject: DailyCall;
  private meetingToken: string;

  constructor(url: string, userName: string, meetingToken: string = null) {
    console.log("daily loading");
    this.url = url;
    this.userName = userName;
    this.meetingToken = meetingToken;
    this.callObject = DailyIframe.createCallObject({
      subscribeToTracksAutomatically: false,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
        camSimulcastEncodings: [{ maxBitrate: 600000, maxFramerate: 30 }],
      },
    })
  }

  registerJoinedMeetingHandler(h: joinHandler) {
    this.callObject.on("joined-meeting", (e) => {
      h(e);
    });
  }

  registerParticipantLeftHandler(h: leaveHandler) {
    this.callObject.on("participant-left", (e) => {
      h(e);
    });
  }
  

  join() {
    let params: { [k: string]: string } = {
      url: this.url,
      userName: this.userName,
    };
    if (this.meetingToken) {
      params.token = this.meetingToken;
    }
    this.callObject.join(params);
  }
}
