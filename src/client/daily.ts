import DailyIframe, {
  DailyCall,
  DailyEventObjectParticipant,
  DailyParticipant,
  DailyEventObjectTrack,
} from "@daily-co/daily-js";
import { MeetingToken } from "../shared/jwt";
import { videoTileSize } from "./config";

// Define handler types that the game class will use to specify
// custom behavior based on call events
export type JoinHandler = (e: DailyParticipant) => void;
export type LeaveHandler = (e: DailyEventObjectParticipant) => void;
export type TrackStartedHandler = (e: DailyEventObjectTrack) => void;
export type TrackStoppedHandler = (e: DailyEventObjectTrack) => void;
export type ParticipantUpdatedHandler = (e: DailyParticipant) => void;

const playableState = "playable";
const loadingState = "loading";

export class Call {
  private readonly callObject: DailyCall;

  private readonly meetingToken: MeetingToken;

  constructor(
    url: string,
    userName: string,
    meetingToken: MeetingToken = null
  ) {
    this.meetingToken = meetingToken;
    this.callObject = DailyIframe.createCallObject({
      url,
      subscribeToTracksAutomatically: true,
      userName,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
        camSimulcastEncodings: [{ maxBitrate: 600000, maxFramerate: 30 }],
        // Our tiles will always be 100px x 100px, so set the track
        // constraints to match
        userMediaVideoConstraints: {
          width: videoTileSize,
          height: videoTileSize,
        },
        avoidEval: true,
      },
    });
  }

  // getParticipant() returns a single participant by
  // session ID
  getParticipant(sessionID: string): DailyParticipant {
    const participants = this.callObject.participants();
    if (participants.local.session_id === sessionID) {
      return participants.local;
    }
    return participants[sessionID];
  }

  // getParticipants() returns all call participants
  getParticipants(): DailyParticipant[] {
    const participants = this.callObject.participants();
    const vals = Object.values(participants);
    return vals;
  }

  // toggleLocalVideo() turns local video on or off
  toggleLocalVideo() {
    const current = this.callObject.participants().local.video;
    this.callObject.setLocalVideo(!current);
  }

  // Mute all participants except yourself. Only participants
  // with a meeting owner token can do this
  muteAll() {
    const updateList: { [key: string]: { [k: string]: boolean } } = {};
    const participants = this.getParticipants();
    for (let i = 0; i < participants.length; i += 1) {
      const p = participants[i];
      if (p.local) continue;

      updateList[p.session_id] = { setAudio: false };
    }
    this.callObject.updateParticipants(updateList);
  }

  // toggleLocalAudio() turns local audio on or off
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

  // getParticipantTracks() retrieves video and audio tracks
  // for the given participant, if they are usable.
  static getParticipantTracks(p: DailyParticipant): MediaStreamTrack[] {
    const tracks = p?.tracks;
    if (!tracks) return null;

    const vt = tracks.video;
    const at = tracks.audio;

    const mediaTracks: MediaStreamTrack[] = [];
    const vs = vt?.state;
    if (vt.persistentTrack && (vs === playableState || vs === loadingState)) {
      mediaTracks.push(vt.persistentTrack);
    }
    const as = at?.state;
    if (at.persistentTrack && (as === playableState || as === loadingState)) {
      mediaTracks.push(at.persistentTrack);
    }
    return mediaTracks;
  }

  // join() joins a Daily video call
  join() {
    const params: { [k: string]: string } = {};
    if (this.meetingToken) {
      params.token = this.meetingToken;
    }
    this.callObject.join(params);
  }

  // leave() leaves a Daily video call
  leave() {
    this.callObject.leave().then(() => {
      this.callObject.destroy();
    });
  }
}
