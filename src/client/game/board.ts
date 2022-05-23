import { DailyParticipant } from "@daily-co/daily-js";
import { Team, TeamResult } from "../../shared/types";
import { Call } from "../daily";

import WordGrid from "./wordGrid";
import { GameData } from "../../shared/events";
import { wordKindToTeam } from "../../shared/util";
import { Word, WordKind } from "../../shared/word";
import ErrTileAlreadyExists from "./errors/errTileAlreadyExists";
import {
  hideAllJoinBtns,
  hideEndTurnButtons,
  hideJoinBtn,
  hideSpymasterBtn,
  registerBeSpymasterBtnListener,
  registerJoinBtnListener,
  showAllJoinBtns,
  showJoinBtn,
  showSpymasterBtn,
  toggleEndTurnButton,
} from "./nav";
import {startAudio} from  "../assets/audio/start.wav";

export interface BoardData {
  roomURL: string;
  gameID: string;
  playerName: string;
  meetingToken?: string;
  wordSet: Word[];
}

export type onClickWord = (wordVal: string) => void;
export type onJoinTeam = (team: Team) => void;
export type onBeSpymaster = (team: Team) => void;

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
  private readonly onBeSpymaster: onBeSpymaster;

  private localPlayerID: string;

  private currentTurn: Team = Team.None;

  private spymasters: { [key in Team]?: string } = {
    team1: null,
    team2: null,
  };

  constructor(
    bd: BoardData,
    localPlayerID: string,
    onClickWord: onClickWord,
    onJoinTeam: onJoinTeam,
    onBeSpymaster: onBeSpymaster
  ) {
    this.wordGrid = new WordGrid(bd.wordSet, (w: Word) => {
      onClickWord(w.value);
    });
    this.onJoinTeam = onJoinTeam;
    this.onBeSpymaster = onBeSpymaster;

    this.gameID = bd.gameID;
    this.localPlayerID = localPlayerID;

    // Reset controls
    hideEndTurnButtons();
    showAllJoinBtns();
  }

  destroy() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    /*  const team1 = document.getElementById("team1");
    const team2 = document.getElementById("team2"); */
  }

  processDataDump(data: GameData) {
    console.log("processing data dump", data.scores);
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
    const score = teamDIV.getElementsByClassName("score")[0];
    score.innerHTML = res.wordsLeft.toString();
  }

  private updateScore(team: Team, lastRevealedWord: Word): Team {
    const lastWord = lastRevealedWord;
    if (lastWord.kind === WordKind.Assassin) {
      console.log("ASSASSINATED");
      let winningTeam: Team;
      if (team === Team.Team1) {
        winningTeam = Team.Team2;
      } else if (team) {
        winningTeam = Team.Team1;
      }
      return winningTeam;
    }

    const wordTeam = wordKindToTeam(lastWord.kind);
    if (wordTeam === Team.None) {
      return Team.None;
    }

    const teamDIV = this.teamDIVs[wordTeam];
    const score = teamDIV.getElementsByClassName("score")[0];
    const wordsLeft: number = +score.innerHTML;

    const newScore = wordsLeft - 1;
    if (newScore === 0) {
      return wordTeam;
    }
    score.innerHTML = newScore.toString();
    return Team.None;
  }

  moveToObservers(participants: DailyParticipant[]) {
    for (let i = 0; i < participants.length; i += 1) {
      const p = participants[i];
      this.moveToTeam(p, Team.None, true);
    }
  }

  moveToTeam(p: DailyParticipant, team: Team, force = false) {
    console.log(
      "moving to team:",
      team,
      this.currentTurn,
      p.session_id,
      this.localPlayerID
    );
    if (p.session_id === this.localPlayerID) {
      this.team = team;
    }

    this.createTile(p, team, force);
    this.updateGameStatus();
    this.updateInteraction();
    toggleEndTurnButton(this.currentTurn, this.team);
  }

  private updateJoinButtons() {
    console.log("updating join buttons", this.spymasters);
    const spymasterOfTeam = this.isSpymaster();

    if (this.isOnTeam()) {
      const otherTeam = this.getOtherTeam();
      console.log("other team:", this.team, otherTeam, spymasterOfTeam);
      // If player is spymaster on a team, disable player-join buttons:
      if (spymasterOfTeam !== Team.None) {
        hideAllJoinBtns();
      } else {
        console.log("showing join btn for other team:", otherTeam);
        hideJoinBtn(this.team);
        showJoinBtn(otherTeam);
      }
    }
    if (!this.spymasters[Team.Team1]) {
      showSpymasterBtn(Team.Team1);
    } else {
      hideSpymasterBtn(Team.Team1);
    }
    if (!this.spymasters[Team.Team2]) {
      showSpymasterBtn(Team.Team1);
    } else {
      hideSpymasterBtn(Team.Team2);
    }
  }

  private getOtherTeam(): Team {
    if (this.team === Team.Team1) {
      return Team.Team2;
    }
    if (this.team === Team.Team2) {
      return Team.Team1;
    }
    return Team.None;
  }

  private isOnTeam(): boolean {
    return this.team && this.team !== Team.None;
  }

  revealWord(wordVal: string) {
    this.wordGrid.revealWord(wordVal, this.team);
  }

  private updateGameStatus() {
    let heading: string;
    let subheading: string;

    const ct = this.currentTurn;
    if (ct === Team.None) {
      return;
    }

    if (ct === this.team) {
      heading = "Your turn!";
      if (this.isSpymaster() !== Team.None) {
        subheading =
          "Give a one-word clue and the number of words your teammates should guess";
      } else {
        subheading = "Select words based on your spymaster's clues";
      }
    } else if (this.team !== Team.None) {
      heading = "Other team's turn!";
      subheading = "Wait for the other team to make their guesses";
    } else {
      heading = `${ct}'s turn`;
      subheading = "";
    }
    const gameStatus = document.getElementById("gameStatus");
    gameStatus.innerHTML = `<h2>${heading}</h2><h3>${subheading}</h3>`;
  }

  toggleCurrentTurn(currentTurn: Team) {
    if (this.currentTurn === Team.None) {
      console.log("start audio", startAudio);
      let audio = new Audio(startAudio);
      audio.play();
    }
    console.log("toggling turn", currentTurn);
    this.currentTurn = currentTurn;
    const teams = this.getTeamDivs(currentTurn);
    teams.activeTeam.classList.add("active");
    teams.otherTeam.classList.remove("active");

    this.updateGameStatus();
    toggleEndTurnButton(currentTurn, this.team);
    this.updateInteraction();
  }

  private updateInteraction() {
    if (!this.team || this.isSpymaster() !== Team.None) {
      return;
    }
    if (this.currentTurn === this.team) {
      this.wordGrid.enableInteraction();
      return;
    }
    this.wordGrid.disableInteraction();
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

  processTurnResult(team: Team, lastRevealedWord: Word): Team {
    const winningTeam = this.updateScore(team, lastRevealedWord);
    // Reveal the word;
    if (winningTeam === Team.None) {
      this.wordGrid.revealWord(lastRevealedWord.value, this.team);
    } else {
      this.wordGrid.revealAllWords(this.team);
    }
    return winningTeam;
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

    if (this.onJoinTeam) {
      registerJoinBtnListener(team, () => {
        console.log("join btn clicked", team);
        this.onJoinTeam(team);
      });
    }

    if (this.onBeSpymaster) {
      registerBeSpymasterBtnListener(team, () => {
        console.log("spymater btn clicked", team);
        this.onBeSpymaster(team);
      });
    }
  }

  makeSpymaster(id: string, team: Team) {
    const participantTile = getTile(id);
    participantTile.classList.add("spymaster");

    const isSpymaster = this.isSpymaster();
    if (isSpymaster !== Team.None) {
      this.spymasters[isSpymaster] = null;
    }
    console.log("making spymaster", id, team);
    this.spymasters[team] = id;

    if (id === this.localPlayerID) {
      // Show word colors in grid
      this.wordGrid.revealAllWords(this.team);
    }
    this.updateJoinButtons();
  }

  private isSpymaster(): Team {
    if (this.spymasters[Team.Team1] === this.localPlayerID) {
      return Team.Team1;
    }
    if (this.spymasters[Team.Team2] === this.localPlayerID) {
      return Team.Team2;
    }
    return Team.None;
  }

  createTile(p: DailyParticipant, team: Team, force = false) {
    this.updateJoinButtons();
    console.log("creating tile:", team, force);
    let name = p.user_name;
    if (p.local) {
      name = "You";
    }
    const id = p.session_id;

    const tileTeam = this.getTileTeam(id);
    if (
      (team !== Team.None && tileTeam === Team.None) ||
      (tileTeam !== null && force)
    ) {
      removeTile(id);
    }
    const div = this.teamDIVs[team];

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
  if (!tracks || tracks.length === 0) {
    video.srcObject = null;
    return;
  }
  const stream = new MediaStream(tracks);
  video.srcObject = stream;
}
