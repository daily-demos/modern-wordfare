import { DailyParticipant } from "@daily-co/daily-js";
import { Team, TeamResult } from "../../shared/types";
import { Call } from "../daily";

import "../assets/audio/joined.wav";
import "../assets/audio/start.wav";

import WordGrid from "./wordGrid";
import { GameData } from "../../shared/events";
import { wordKindToTeam } from "../../shared/util";
import { Word, WordKind } from "../../shared/word";
import ErrTileAlreadyExists from "./errors/errTileAlreadyExists";
import { hideSpymasterBtn, registerBeSpymasterBtnListener } from "./nav";

export interface BoardData {
  roomURL: string;
  gameID: string;
  playerName: string;
  meetingToken?: string;
  wordSet: Word[];
}

export type onClickWord = (wordVal: string) => void;
export type onJoinTeam = (team: Team) => void;

export class Board {
  private wordGrid: WordGrid;

  gameID: string;

  teamDIVs: { [key in Team]?: HTMLDivElement } = {
    none: null,
    team1: null,
    team2: null,
  };

  team = Team.None;

  private readonly onJoinTeam: onJoinTeam;
  private readonly onBeSpymaster: () => void;

  private isSpymaster: boolean;

  private localPlayerID: string;

  constructor(
    bd: BoardData,
    localPlayerID: string,
    onClickWord: onClickWord,
    onJoinTeam: onJoinTeam,
    onBeSpymaster: () => void
  ) {
    console.log("constructing board!!");

    this.wordGrid = new WordGrid(bd.wordSet, (w: Word) => {
      onClickWord(w.value);
    });
    this.onJoinTeam = onJoinTeam;
    this.onBeSpymaster = onBeSpymaster;

    this.gameID = bd.gameID;
    this.localPlayerID = localPlayerID;
    console.log("local player ID:", this.localPlayerID);
  }

  processDataDump(data: GameData) {
    if (data.currentTurn && data.currentTurn !== Team.None) {
      this.toggleCurrentTurn(data.currentTurn);
    }

    for (let i = 0; i < data.revealedWordVals.length; i += 1) {
      const val = data.revealedWordVals[i];
      this.revealWord(val);
    }

    this.setScores(data.scores.team1);
    this.setScores(data.scores.team2);
  }

  setScores(res: TeamResult) {
    const teamDIV = this.teamDIVs[res.team];
    console.log("teamDOM:", teamDIV);
    const score = teamDIV.getElementsByClassName("score")[0];
    score.innerHTML = res.wordsLeft.toString();
  }

  private updateScore(team: Team, lastRevealedWord: Word) {
    const lastWord = lastRevealedWord;
    if (lastWord.kind === WordKind.Assassin) {
      console.log("ASSASSINATED");
      let winningTeam: Team;
      if (team === Team.Team1) {
        winningTeam = Team.Team2;
      } else if (team) {
        winningTeam = Team.Team1;
      }
      this.showRestart(winningTeam); // TODO
      return;
    }

    const wordTeam = wordKindToTeam(lastWord.kind);
    if (wordTeam === Team.None) {
      return;
    }

    const teamDIV = this.teamDIVs[wordTeam];
    const score = teamDIV.getElementsByClassName("score")[0];
    const wordsLeft: number = +score.innerHTML;

    const newScore = wordsLeft - 1;
    if (newScore === 0) {
      this.showRestart(wordTeam);
      return;
    }
    score.innerHTML = newScore.toString();
  }

  moveToTeam(p: DailyParticipant, team: Team, currentTurn: Team) {
    console.log("session ID, local player ID:", p.session_id, this.localPlayerID)
    if (p.session_id === this.localPlayerID) {
      this.team = team;
    }

    console.log("creating tile in joinedTeamEventName", p.user_name, team);
    this.createTile(p, team);
    if (currentTurn && currentTurn !== Team.None) {
      this.toggleCurrentTurn(currentTurn);
    }
  }

  revealWord(wordVal: string) {
    this.wordGrid.revealWord(wordVal, this.team);
  }
  private showRestart(winner: Team) {
    /*  const endDOM = this.add.dom(0, 0).createFromCache("end-dom");
    const name = endDOM.getChildByID("teamName");
    name.innerHTML = winner.toString();
    const x = this.game.canvas.width / 2;
    const y = this.game.canvas.height / 2;
    endDOM.setPosition(x, y).setOrigin(0.5);

    const restartBtn = <HTMLButtonElement>endDOM.getChildByID("restart");
    restartBtn.onclick = () => {
      this.restart();
    }; */
  }

  toggleCurrentTurn(currentTurn: Team) {
    const teams = this.getTeamDivs(currentTurn);
    console.log("teamDivs", teams);
    teams.activeTeam.classList.add("active");
    teams.otherTeam.classList.remove("active");
    console.log("this team:", this.team, currentTurn)
    if (!this.team || this.isSpymaster) {
      return;
    }

    const endTurnBtn = document.getElementById("endTurn");

    if (currentTurn === this.team) {
      console.log("current team!", currentTurn, this.team)
      this.wordGrid.enableInteraction();
      endTurnBtn.classList.remove("invisible");
      return;
    }
    this.wordGrid.disableInteraction();
    endTurnBtn.classList.add("invisible");
  }

  private getTeamDivs(activeTeam: Team): {
    activeTeam: HTMLDivElement;
    otherTeam: HTMLDivElement;
  } {
    const t1 = this.teamDIVs[Team.Team1];
    const t2 = this.teamDIVs[Team.Team2];

    if (activeTeam === Team.Team1) {
      return {
        activeTeam: t1,
        otherTeam: t2,
      };
    }
    if (activeTeam === Team.Team2) {
      return {
        activeTeam: t2,
        otherTeam: t1,
      };
    }
    throw new Error(`invalid active team requested: ${activeTeam}`);
  }

  processTurnResult(team: Team, lastRevealedWord: Word) {
    this.updateScore(team, lastRevealedWord);
    // Reveal the word;
    this.wordGrid.revealWord(lastRevealedWord.value, this.team);
  }

  showTeams() {
    this.showTeam(Team.Team1);
    this.showTeam(Team.Team2);
    this.showObservers();
    this.wordGrid.drawGrid();
  }

  private showObservers() {
    const observers = document.getElementById("observers");
    observers.classList.remove("hidden");
    this.teamDIVs[Team.None] = <HTMLDivElement>observers;
  }

  private showTeam(team: Team) {
    const teamDIV = <HTMLDivElement>document.getElementById(team.toString());
    this.teamDIVs[team] = teamDIV;

    teamDIV.classList.remove("hidden");

    const teamJoinBtn = <HTMLButtonElement>(
      teamDIV.getElementsByClassName("join")[0]
    );
    teamJoinBtn.classList.remove("hidden");
    teamJoinBtn.onclick = () => {
      if (this.onJoinTeam) {
        this.onJoinTeam(team);
      }

      const joinButtons = document.getElementsByClassName("join");
      for (let i = 0; i < joinButtons.length; i += 1) {
        const btn = joinButtons[i];
        btn.classList.add("hidden");
      }
      console.log("joinTeam() emitting joined team event name");

      const hasSpymaster = teamDIV.getElementsByClassName("spymaster");
      if (hasSpymaster && hasSpymaster.length > 0) {
        console.log("team already has spymaster");
        // Team already has spymaster, don't set up the button
        return;
      }

      registerBeSpymasterBtnListener(() => {
        hideSpymasterBtn();
        if (this.onBeSpymaster) {
          this.onBeSpymaster();
        }
      });
    };
  }

  makeSpymaster(id: string, team: Team) {
    const participantTile = getTile(id);
    participantTile.classList.add("spymaster");

    if (this.team === team) {
      hideSpymasterBtn();
    }

    if (id === this.localPlayerID) {
      // Show word colors in grid
      this.wordGrid.revealAllWords(this.team);
      this.isSpymaster = true;
    }
  }

  createTile(p: DailyParticipant, team: Team) {
    let name = p.user_name;
    if (p.local) {
      name = "You";
    }
    const id = p.session_id;

    const tileTeam = this.getTileTeam(id);
    console.log("tile team:", tileTeam);
    if (team !== Team.None && tileTeam === Team.None) {
      removeTile(id);
    }
    const div = this.teamDIVs[team];

    console.log("creating tile", name, team);

    // See if there is already an existing tile by this ID, error out if so
    let participantTile = getTile(id);
    if (participantTile) {
      throw new ErrTileAlreadyExists(id);
    }

    // Create participant tile with the video and name tags within
    const tiles = div.getElementsByClassName("tiles")[0];

    participantTile = document.createElement("div");
    participantTile.id = getParticipantTileID(id);
    participantTile.className = "tile";

    const video = document.createElement("video");
    video.autoplay = true;
    if (p.local) {
      video.muted = true;
    }
    participantTile.appendChild(video);

    const nameTag = document.createElement("div");
    nameTag.className = "name";
    nameTag.innerText = name;
    participantTile.appendChild(nameTag);
    tiles.appendChild(participantTile);

    const tracks = Call.getParticipantTracks(p);
    try {
      updateMedia(id, tracks);
    } catch (e) {
      console.warn(e);
    }
  }

  private getTileTeam(playerID: string): Team {
    const tileID = getParticipantTileID(playerID);
    const tile = document.getElementById(tileID);
    console.log("getTileTeam tile:", tile, tileID);
    if (!tile) return;

    if (this.teamDIVs[Team.None].contains(tile)) {
      return Team.None;
    }
    if (this.teamDIVs[Team.Team1].contains(tile)) {
      return Team.Team1;
    }
    if (this.teamDIVs[Team.Team2].contains(tile)) {
      return Team.Team2;
    }
    return null;
  }
}

export function removeTile(playerID: string) {
  const ele = document.getElementById(getParticipantTileID(playerID));
  ele?.remove();
}

function getParticipantTileID(sessionID: string): string {
  return `participant-${sessionID}`;
}

function getTile(participantID: string): HTMLDivElement {
  const participantTileID = getParticipantTileID(participantID);
  const participantTile = <HTMLDivElement>(
    document.getElementById(participantTileID)
  );
  return participantTile;
}

export function updateMedia(participantID: string, tracks: MediaStreamTrack[]) {
  const participantTile = getTile(participantID);
  if (!participantTile) {
    throw new Error(`tile for participant ID ${participantID} does not exist`);
  }
  const videoTags = participantTile.getElementsByTagName("video");
  if (!videoTags || videoTags.length === 0) {
    throw new Error(
      `video tile for participant ID ${participantID} does not exist`
    );
  }
  const video = videoTags[0];
  console.log("tracks:", tracks);
  if (!tracks || tracks.length === 0) {
    video.srcObject = null;
    return;
  }
  const stream = new MediaStream(tracks);
  video.srcObject = stream;
}
