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
import { Data } from "phaser";
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

const playableState = "playable";

interface JoinTeamMessage {
  teamID: Team;
}

interface DataDumpMessage {
  teamID: Team;
  team1Score: number;
  team2Score: number;
}

interface AppMessageData {
  kind: "joined-team" | "data-dump" | "ack";
  data: JoinTeamMessage;
}

const messageKindJoinedteam = "joined-team";
const messageKindDataDump = "data-dump";

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

  registerTrackStartedHandler(h: trackStartedHandler) {
    this.callObject.on("participant-updated", (e) => {
      console.log("PARTICIPANT UPDATED!", e.participant.session_id);
    });
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
