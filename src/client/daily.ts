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
  DailyEventObjectTrack,
} from "@daily-co/daily-js";

export type joinHandler = (e: DailyParticipant) => void;
export type leaveHandler = (e: DailyEventObjectParticipant) => void;
export type trackStartedHandler = (e: DailyEventObjectTrack) => void;
export type trackStoppedHandler = (e: DailyEventObjectTrack) => void;

const playableState = "playable";

export class Call {
  private url: string;
  private userName: string;
  private callObject: DailyCall;
  private meetingToken: string;

  constructor(url: string, userName: string, meetingToken: string = null) {
    console.log("daily loading", userName);
    this.url = url;
    this.userName = userName;
    this.meetingToken = meetingToken;
    this.callObject = DailyIframe.createCallObject({
      subscribeToTracksAutomatically: false,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
        camSimulcastEncodings: [{ maxBitrate: 600000, maxFramerate: 30 }],
      },
    });
  }

  toggleLocalVideo() {
    console.log("toggling local video");
    const current = this.callObject.participants().local.video;
    this.callObject.setLocalVideo(!current);
  }

  toggleLocalAudio() {
    console.log("toggling local audio");
    const current = this.callObject.participants().local.audio;
    this.callObject.setLocalAudio(!current);
  }

  registerJoinedMeetingHandlers(h: joinHandler) {
    this.callObject.on("joined-meeting", (e) => {
      h(e.participants.local);
    });
    this.callObject.on("participant-joined", (e) => {
      console.log("participant joined", e.participant);
      h(e.participant);
    });
  }

  registerParticipantLeftHandler(h: leaveHandler) {
    this.callObject.on("participant-left", (e) => {
      h(e);
    });
  }

  registerTrackStartedHandler(h: trackStartedHandler) {
    this.callObject.on("track-started", (e) => {
      console.log("track started", e);
      h(e);
    });
  }

  registerTrackStoppedHandler(h: trackStartedHandler) {
    this.callObject.on("track-stopped", (e) => {
      console.log("track stopped", e);
      h(e);
    });
  }

  getParticipantTracks(p: DailyParticipant): MediaStreamTrack[] {
    const tracks = p?.tracks;
    if (!tracks) return null;

    const vt = tracks.video;
    const at = tracks.audio;

    let mediaTracks: MediaStreamTrack[] = [];
    if (vt?.state === playableState) {
      mediaTracks.push(vt.persistentTrack);
    }
    if (at?.state === playableState) {
      mediaTracks.push(at.persistentTrack);
    }
    return mediaTracks;
  }

  join() {
    console.log("joining with username: ", this.userName);
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
