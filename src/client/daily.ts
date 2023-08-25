import DailyIframe, {
  DailyCall,
  DailyParticipant,
  DailyEventObjectTrack,
  DailyEventObjectRemoteParticipantsAudioLevel,
} from "@daily-co/daily-js";
import { videoTileSize } from "./config";

// Define handler types that the game class will use to specify
// custom behavior based on call events
export type JoinHandler = (e: DailyParticipant) => void;
export type LeaveHandler = (e: DailyParticipant) => void;
export type TrackStartedHandler = (e: DailyEventObjectTrack) => void;
export type TrackStoppedHandler = (e: DailyEventObjectTrack) => void;
export type ParticipantUpdatedHandler = (e: DailyParticipant) => void;
export type RemoteAudioLevelHandler = (
  e: DailyEventObjectRemoteParticipantsAudioLevel,
) => void;

export type Tracks = {
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
};

const playableState = "playable";
const loadingState = "loading";

export class Call {
  private readonly callObject: DailyCall;

  private meetingToken: string | undefined;

  constructor(url: string, userName: string, meetingToken: string = "") {
    this.meetingToken = meetingToken;
    this.callObject = DailyIframe.createCallObject({
      url,
      subscribeToTracksAutomatically: true,
      userName,
      sendSettings: {
        video: {
          encodings: {
            low: {
              maxBitrate: 150000,
              maxFramerate: 30,
              scaleResolutionDownBy: 1,
            },
          },
        },
      },
      dailyConfig: {
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
      const p = e?.participants.local;
      if (!p) return;
      h(p);
    });
  }

  registerParticipantJoinedHandler(h: JoinHandler) {
    this.callObject.on("participant-joined", (e) => {
      const p = e?.participant;
      if (!p) return;
      h(p);
    });
  }

  registerParticipantLeftHandler(h: LeaveHandler) {
    this.callObject.on("participant-left", (e) => {
      if (!e) return;
      h(e.participant);
    });
  }

  registerParticipantUpdatedHandler(h: ParticipantUpdatedHandler) {
    this.callObject.on("participant-updated", (e) => {
      const p = e?.participant;
      if (!p) return;
      h(p);
    });
  }

  registerTrackStartedHandler(h: TrackStartedHandler) {
    this.callObject.on("track-started", (e) => {
      if (!e) return;
      h(e);
    });
  }

  registerTrackStoppedHandler(h: TrackStoppedHandler) {
    this.callObject.on("track-stopped", (e) => {
      if (!e) return;
      h(e);
    });
  }

  registerRemoteParticipantsAudioLevelHandler(h: RemoteAudioLevelHandler) {
    // Start audio level observer only once game explicitly asks for it
    this.callObject.startRemoteParticipantsAudioLevelObserver(200);
    this.callObject.on("remote-participants-audio-level", (e) => {
      if (!e) return;
      h(e);
    });
  }

  // getParticipantTracks() retrieves video and audio tracks
  // for the given participant, if they are usable.
  static getParticipantTracks(p: DailyParticipant): Tracks {
    const mediaTracks: Tracks = {
      videoTrack: null,
      audioTrack: null,
    };

    const tracks = p?.tracks;
    if (!tracks) return mediaTracks;

    const vt = tracks.video;
    const vs = vt?.state;
    if (vt.persistentTrack && (vs === playableState || vs === loadingState)) {
      mediaTracks.videoTrack = vt.persistentTrack;
    }

    // Only get audio track if this is a remote participant
    if (!p.local) {
      const at = tracks.audio;
      const as = at?.state;
      if (at.persistentTrack && (as === playableState || as === loadingState)) {
        mediaTracks.audioTrack = at.persistentTrack;
      }
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
    // We no longer need the meeting token for anything
    // after passing it to Daily.
    delete this.meetingToken;
  }

  // leave() leaves a Daily video call
  leave() {
    this.callObject.leave().then(() => {
      this.callObject.destroy();
    });
  }
}
