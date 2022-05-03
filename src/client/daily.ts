import DailyIframe, {
  DailyCall,
  DailyEventObjectParticipant,
  DailyParticipant,
  DailyEventObjectTrack,
} from "@daily-co/daily-js";
import { Team } from "../shared/types";

export type JoinHandler = (e: DailyParticipant) => void;
export type DataDumpHandler = (
  p: DailyParticipant,
  team: Team,
  team1Score: number,
  team2Score: number
) => void;

export type LeaveHandler = (e: DailyEventObjectParticipant) => void;
export type TrackStartedHandler = (e: DailyEventObjectTrack) => void;
export type TrackStoppedHandler = (e: DailyEventObjectTrack) => void;
export type ParticipantUpdatedHandler = (e: DailyParticipant) => void;
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
    const current = this.callObject.participants().local.video;
    this.callObject.setLocalVideo(!current);
  }

  toggleLocalAudio() {
    const current = this.callObject.participants().local.audio;
    this.callObject.setLocalAudio(!current);
  }

  registerJoinedMeetingHandler(h: JoinHandler) {
    this.callObject.on("joined-meeting", (e) => {
      h(e.participants.local);
    });
  }

  registerParticipantJoinedHandler(h: JoinHandler) {
    this.callObject.on("participant-joined", (e) => {
      h(e.participant);
    });
  }

  registerParticipantLeftHandler(h: LeaveHandler) {
    this.callObject.on("participant-left", (e) => {
      h(e);
    });
  }

  registerParticipantUpdatedHandler(h: ParticipantUpdatedHandler) {
    this.callObject.on("participant-updated", (e) => {
      h(e.participant);
    });
  }

  registerTrackStartedHandler(h: TrackStartedHandler) {
    this.callObject.on("track-started", (e) => {
      h(e);
    });
  }

  registerTrackStoppedHandler(h: TrackStoppedHandler) {
    this.callObject.on("track-stopped", (e) => {
      h(e);
    });
  }

  static getParticipantTracks(p: DailyParticipant): MediaStreamTrack[] {
    const tracks = p?.tracks;
    if (!tracks) return null;

    const vt = tracks.video;
    const at = tracks.audio;

    const mediaTracks: MediaStreamTrack[] = [];
    const vs = vt?.state;
    if (vs === playableState || vs === "loading") {
      mediaTracks.push(vt.persistentTrack);
    }
    const as = at?.state;
    if (as === playableState || as === "loading") {
      mediaTracks.push(at.persistentTrack);
    }
    return mediaTracks;
  }

  join() {
    const params: { [k: string]: string } = {
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
