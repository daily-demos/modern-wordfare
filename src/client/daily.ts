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
export type joinTeamHandler = (p: DailyParticipant, team: Team) => void;
export type leaveHandler = (e: DailyEventObjectParticipant) => void;
export type trackStartedHandler = (e: DailyEventObjectTrack) => void;
export type trackStoppedHandler = (e: DailyEventObjectTrack) => void;

const playableState = "playable";

interface JoinTeamMessage {
  teamID: Team;
}

interface AppMessageData {
  kind: string;
  data: JoinTeamMessage;
}

const messageKindJoinedteam = "joined-team";

export class Call {
  private url: string;
  private userName: string;
  private callObject: DailyCall;
  private meetingToken: string;

  private onJoinTeam: joinTeamHandler;

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
    }).on("app-message", (e) => {
      this.handleAppMessage(e);
    });
  }

  private handleAppMessage(e: DailyEventObjectAppMessage) {
    const data = e.data;
    switch (data.kind) {
      case messageKindJoinedteam:
        console.log("onjointeam:", this.onJoinTeam);
        if (this.onJoinTeam) {
          const msg = <JoinTeamMessage>data.data;
          console.log("msg, data:", msg, data.data);
          const team: Team = msg.teamID;
          console.log("team equals:", team === Team.Team2);
          const p = this.callObject.participants()[e.fromId];
          this.onJoinTeam(p, team);
        }
        break;
      default:
        console.error("unrecognized app message received:", e);
    }
  }

  joinTeam(team: Team) {
    const data = <AppMessageData>{
      kind: messageKindJoinedteam,
      data: {
        teamID: team,
      },
    };
    console.log("sending join team data:", data);
    this.callObject.sendAppMessage(data, "*");
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

  registerJoinedTeamHandler(h: joinTeamHandler) {
    console.log("registering onjointeam handler");
    this.onJoinTeam = h;
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
