import {
  default as DailyIframe,
  DailyCall,
  DailyEventObjectParticipant,
  DailyParticipant,
  DailyEventObjectTrack,
} from "@daily-co/daily-js";
import { Team } from "../shared/types";

export type joinHandler = (e: DailyParticipant) => void;
export type dataDumpHandler = (
  p: DailyParticipant,
  team: Team,
  team1Score: number,
  team2Score: number
) => void;

export type leaveHandler = (e: DailyEventObjectParticipant) => void;
export type trackStartedHandler = (e: DailyEventObjectTrack) => void;
export type trackStoppedHandler = (e: DailyEventObjectTrack) => void;
export type participantUpdatedHandler = (e: DailyParticipant) => void;
const playableState = "playable";

export class Call {
  private url: string;
  private userName: string;
  private callObject: DailyCall;
  private meetingToken: string;

  constructor(url: string, userName: string, meetingToken: string = null) {
    this.url = url;
    this.userName = userName;
    this.meetingToken = meetingToken;
    this.callObject = DailyIframe.createCallObject({
      subscribeToTracksAutomatically: true,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
        camSimulcastEncodings: [{ maxBitrate: 600000, maxFramerate: 30 }],
      },
    });
  }

  getPlayerId(): string {
    return this.callObject.participants().local.session_id;
  }
  getParticipant(sessionID: string): DailyParticipant {
    const participants = this.callObject.participants();
    if (participants.local.session_id === sessionID) {
      return participants.local;
    }
    return participants[sessionID];
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

  registerJoinedMeetingHandler(h: joinHandler) {
    this.callObject.on("joined-meeting", (e) => {
      console.log("joined meeting");
      h(e.participants.local);
    });
  }

  registerParticipantJoinedHandler(h: joinHandler) {
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

  registerParticipantUpdatedHandler(h: participantUpdatedHandler) {
    this.callObject.on("participant-updated", (e) => {
      h(e.participant);
    });
  }

  registerTrackStartedHandler(h: trackStartedHandler) {
    this.callObject.on("track-started", (e) => {
      h(e);
    });
  }

  registerTrackStoppedHandler(h: trackStoppedHandler) {
    this.callObject.on("track-stopped", (e) => {
      h(e);
    });
  }

  getParticipantTracks(p: DailyParticipant): MediaStreamTrack[] {
    console.log("tracks:", p?.tracks);
    const tracks = p?.tracks;
    if (!tracks) return null;

    const vt = tracks.video;
    const at = tracks.audio;

    let mediaTracks: MediaStreamTrack[] = [];
    if (vt?.state === playableState || vt?.state === "loading") {
      mediaTracks.push(vt.persistentTrack);
    }
    if (at?.state === playableState || at?.state === "loading") {
      mediaTracks.push(at.persistentTrack);
    }
    return mediaTracks;
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

  leave() {
    this.callObject.leave().then(() => {
      this.callObject.destroy();
    });
  }
}
