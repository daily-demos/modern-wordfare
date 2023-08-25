import { DailyParticipant } from "@daily-co/daily-js";
import { Team, TeamResult } from "../../shared/types";
import { Call, Tracks } from "../daily";

import WordGrid from "./wordGrid";
import { GameData } from "../../shared/events";
import { getOtherTeam, wordKindToTeam } from "../../shared/util";
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
import startAudio from "../assets/audio/start.wav";
import { flyEmojis, Mood } from "../util/effects";
import ErrNoTeamDOM from "./errors/errNoTeamDOM";
import showGameError from "./errors/error";
import ErrGeneric from "./errors/errGeneric";
import ErrMediaAutoplay from "./errors/errMediaPlay";

export interface BoardData {
  roomURL: string;
  gameID: string;
  playerName: string;
  meetingToken?: string;
  wordSet: Word[];
}

// Callbacks which will be provided by Game class
export type OnClickWord = (wordVal: string) => void;
export type OnJoinTeam = (team: Team) => void;
export type OnBeSpymaster = (team: Team) => void;

// The board manages displaying the word grid, moving players
// between teams, keeping score, and toggling relevant team
// controls.
export class Board {
  private team = Team.None;

  private currentTurn: Team = Team.None;

  private spymasters: { [key in Team]?: string } = {
    team1: "",
    team2: "",
  };

  private readonly wordGrid: WordGrid;

  private readonly teamDIVs: { [key in Team]?: HTMLDivElement | null } = {
    none: null,
    team1: null,
    team2: null,
  };

  private readonly onJoinTeam: OnJoinTeam;

  private readonly onBeSpymaster: OnBeSpymaster;

  private readonly localPlayerID: string;

  constructor(
    boardData: BoardData,
    localPlayerID: string,
    onClickWord: OnClickWord,
    onJoinTeam: OnJoinTeam,
    onBeSpymaster: OnBeSpymaster,
  ) {
    this.localPlayerID = localPlayerID;

    // Create the word grid from the given word set
    this.wordGrid = new WordGrid(boardData.wordSet, (w: Word) => {
      onClickWord(w.value);
    });

    this.onJoinTeam = onJoinTeam;
    this.onBeSpymaster = onBeSpymaster;
    this.updateGameStatus();
  }

  // destroy() resets the DOM state modified by the Board
  // back to its defaults.
  destroy() {
    const board = document.getElementById("board");
    if (board) {
      board.innerHTML = "";
    }
    this.teamDIVs[Team.Team1]?.classList.remove("active");
    this.teamDIVs[Team.Team2]?.classList.remove("active");
    hideEndTurnButtons();
    showAllJoinBtns();
  }

  // processDataDump() takes an initial game data dump sent by
  // the server and updates the board state and relevant DOM
  // elements to reflect it.
  processDataDump(data: GameData) {
    // If the data dump indicates that the game has started,
    // toggle the turn.
    if (data.currentTurn && data.currentTurn !== Team.None) {
      this.toggleCurrentTurn(data.currentTurn);
    }

    // Reveal all words that have already been guessed
    for (let i = 0; i < data.revealedWordVals.length; i += 1) {
      const val = data.revealedWordVals[i];
      this.revealWord(val);
    }

    // Update score DOM for both teams
    this.setScores(data.scores.team1);
    this.setScores(data.scores.team2);
  }

  // setScores() sets the score in the given team DOM as given,
  // without any extra calculations.
  setScores(res: TeamResult) {
    const teamDIV = this.teamDIVs[res.team];
    if (!teamDIV) {
      console.warn(new ErrNoTeamDOM(res.team));
      return;
    }
    const score = teamDIV.getElementsByClassName("score")[0];
    score.innerHTML = res.wordsLeft.toString();
  }

  // updateScore() updates score information and detects if there
  // is a winner using the last revealed word.
  private updateScore(lastPlayedTeam: Team, lastRevealedWord: Word): Team {
    const lastWord = lastRevealedWord;
    // If the last played team revealed the Assassin word,
    // the other team wins.
    if (lastWord.kind === WordKind.Assassin) {
      const winningTeam = getOtherTeam(lastPlayedTeam);
      return winningTeam;
    }

    // If the last revealed word was a neutral word,
    // no scores are updated and there is no winner.
    const wordTeam = wordKindToTeam(lastWord.kind);
    if (wordTeam === Team.None) {
      return Team.None;
    }

    const teamDIV = this.teamDIVs[wordTeam];
    if (!teamDIV) {
      console.warn(new ErrNoTeamDOM(wordTeam));
      return Team.None;
    }
    const score = teamDIV.getElementsByClassName("score")[0];
    const wordsLeft: number = +score.innerHTML;

    // Subtract words left count from team whom the last
    // revealed word belongs to.
    const newScore = wordsLeft - 1;
    if (newScore === 0) {
      return wordTeam;
    }
    score.innerHTML = newScore.toString();
    return Team.None;
  }

  // moveToObservers() moves the given participants to the
  // observers div.
  moveToObservers(participants: DailyParticipant[]) {
    for (let i = 0; i < participants.length; i += 1) {
      const p = participants[i];
      this.moveToTeam(p, Team.None, true);
    }
  }

  // moveToTeam() moves the given participant to the given
  // team div.
  moveToTeam(p: DailyParticipant, team: Team, force = false) {
    if (p.session_id === this.localPlayerID) {
      this.team = team;
    }
    // Update join buttons to reflect new state
    this.updateJoinButtons();

    this.createTile(p, team, force);
    this.updateGameStatus();
    this.updateInteraction();
    toggleEndTurnButton(this.currentTurn, this.team);
  }

  eject(playerID: string) {
    removeTile(playerID);
    if (this.spymasters.team1 === playerID) {
      delete this.spymasters.team1;
      this.updateJoinButtons();
    } else if (this.spymasters.team2 === playerID) {
      delete this.spymasters.team2;
      this.updateJoinButtons();
    }
  }

  // revealWord() reveals the given word by value.
  revealWord(wordVal: string) {
    this.wordGrid.revealWord(wordVal, this.team);
  }

  // updateJoinButtons() updates the visibility of team join
  // buttons based on the player's current team state.
  private updateJoinButtons() {
    if (this.isOnTeam()) {
      const spymasterOfTeam = this.isSpymaster(this.localPlayerID);
      const otherTeam = this.getOtherTeam();
      // If player is spymaster on a team, disable player-join buttons:
      if (spymasterOfTeam !== Team.None) {
        hideAllJoinBtns();
      } else {
        // If player is on a team but is not a spymaster,
        // allow them to join the other team.
        hideJoinBtn(this.team);
        showJoinBtn(otherTeam);
      }
    }
    // If player is not on a team, show spymaster join buttons
    // for teams which have no spymaster.
    if (!this.spymasters[Team.Team1]) {
      showSpymasterBtn(Team.Team1);
    } else {
      hideSpymasterBtn(Team.Team1);
    }
    if (!this.spymasters[Team.Team2]) {
      showSpymasterBtn(Team.Team2);
    } else {
      hideSpymasterBtn(Team.Team2);
    }
  }

  // getOtherTeam() returns the opposing team
  // of the player.
  private getOtherTeam(): Team {
    return getOtherTeam(this.team);
  }

  // isOnTeam() returns true if the player is on a team
  private isOnTeam(): boolean {
    return this.team && this.team !== Team.None;
  }

  // updateGameStatus() updates the header label
  // with the current status of the round.
  private updateGameStatus() {
    let heading: string;
    let subheading: string;

    const ct = this.currentTurn;

    if (ct === Team.None) {
      heading = "Team selection in progress";
      subheading = "(Game needs two spymasters to start!)";
    } else if (ct === this.team) {
      heading = "Your turn!";
      if (this.isSpymaster(this.localPlayerID) !== Team.None) {
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
    if (!gameStatus) {
      showGameError(new ErrGeneric("Game status DOM element not found"));
      return;
    }
    gameStatus.innerHTML = `<h2>${heading}</h2><h3>${subheading}</h3>`;
  }

  // toggleCurrentTurn() sets the current turn to the given team
  toggleCurrentTurn(currentTurn: Team) {
    // If this is the first turn of the game, play
    // game start audio.
    if (this.currentTurn === Team.None) {
      const audio = new Audio(startAudio);
      audio.play();
    }
    this.currentTurn = currentTurn;
    const otherTeam = getOtherTeam(currentTurn);

    this.teamDIVs[currentTurn]?.classList.add("active");
    this.teamDIVs[otherTeam]?.classList.remove("active");

    this.updateGameStatus();
    this.updateInteraction();
    toggleEndTurnButton(currentTurn, this.team);
  }

  // updateInteraction() enables or disabled word grid interaction
  // as needed based on whose turn it is to play.
  private updateInteraction() {
    if (!this.team || this.isSpymaster(this.localPlayerID) !== Team.None) {
      return;
    }
    if (this.currentTurn === this.team) {
      this.wordGrid.enableInteraction();
      return;
    }
    this.wordGrid.disableInteraction();
  }

  // processTurnResult() processes the result of a turn, which is
  // provided by the server.
  processTurnResult(team: Team, lastRevealedWord: Word): Team {
    // Update score
    const winningTeam = this.updateScore(team, lastRevealedWord);

    // If nobody has won yet, reveal the single selected word which was
    // selected last. If there is a winner, reveal ALL words.
    if (winningTeam === Team.None) {
      this.wordGrid.revealWord(lastRevealedWord.value, team);
    } else {
      this.wordGrid.revealAllWords();
    }
    this.maybeToast(winningTeam);
    return winningTeam;
  }

  private maybeToast(winningTeam: Team) {
    if (winningTeam === Team.None) return;
    if (this.team && winningTeam !== this.team) {
      // Losing team gets sad emoji
      flyEmojis(Mood.Sad);
      return;
    }
    // Winning team and observers can get happy emoji
    flyEmojis(Mood.Happy);
  }

  // showBoardElements() shows the following DOM elements:
  // * Both teams
  // * Observers
  // * Word grid
  showBoardElements() {
    this.showTeam(Team.Team1);
    this.showTeam(Team.Team2);
    this.showObservers();
    this.wordGrid.drawGrid();
  }

  // showObservers() shows the observers DOM element. It contains
  // participants who have not yet joined a team.
  private showObservers() {
    const observers = document.getElementById("observers");
    if (!observers) {
      showGameError(new ErrGeneric("Observers DOM element not found"));
      return;
    }
    observers.classList.remove("hidden");
    this.teamDIVs[Team.None] = <HTMLDivElement>observers;
  }

  // showTeam() shows the DOM element of the given team.
  // While doing so, it also sets up relevant
  // team join button listeners.
  private showTeam(team: Team) {
    const teamDIV = <HTMLDivElement>document.getElementById(team.toString());
    this.teamDIVs[team] = teamDIV;

    teamDIV.classList.remove("hidden");

    if (this.onJoinTeam) {
      registerJoinBtnListener(team, () => {
        this.onJoinTeam(team);
      });
    }

    if (this.onBeSpymaster) {
      registerBeSpymasterBtnListener(team, () => {
        this.onBeSpymaster(team);
      });
    }
  }

  // makeSpymaster() sets the given player ID as a spymaster
  // for the given team.
  makeSpymaster(playerID: string, team: Team) {
    const participantTile = getTile(playerID);
    participantTile.classList.add("spymaster");

    // If given player is already a spymaster and is just
    // switching teams, update the spymaster var
    const isSpymaster = this.isSpymaster(playerID);
    if (isSpymaster !== Team.None) {
      delete this.spymasters[isSpymaster];
    }
    this.spymasters[team] = playerID;

    // If the player ID is the local player,
    // reveal all words.
    if (playerID === this.localPlayerID) {
      // Show word colors in grid
      this.wordGrid.revealAllWords();
    }

    // Update join buttons to reflect new state
    this.updateJoinButtons();
  }

  private isSpymaster(playerID: string): Team {
    if (this.spymasters[Team.Team1] === playerID) {
      return Team.Team1;
    }
    if (this.spymasters[Team.Team2] === playerID) {
      return Team.Team2;
    }
    return Team.None;
  }

  // createTile() creates a new player tile for the given
  // DailyParticipant. If "force" is true, it silently
  // removes the player from any existing team if one exists.
  // Otherwise, it throws an error if the given
  // player is already on a team.
  createTile(p: DailyParticipant, team: Team, force = false) {
    let name = p.user_name;
    if (p.local) {
      name = "You";
    }
    const id = p.session_id;

    const tileTeam = this.getTileTeam(id);
    // If player is an observer OR on another team with
    // "force" set to true, remove them from the
    // observers div or other team.
    if (
      (team !== Team.None && tileTeam === Team.None) ||
      (tileTeam !== null && force)
    ) {
      removeTile(id);
    }
    const div = this.teamDIVs[team];
    if (!div) {
      showGameError(new ErrNoTeamDOM(team));
      return;
    }

    // By the time the above is done, there should be no tile for this
    // player. If one exists, error out (the player is probably on a team
    // already)
    if (getTile(id)) {
      showGameError(new ErrTileAlreadyExists(id));
      return;
    }

    // Create participant tile with the video and name tags within
    const tiles = div.getElementsByClassName("tiles")[0];

    const participantTile = document.createElement("div");
    participantTile.id = getParticipantTileID(id);
    participantTile.className = "tile";

    const video = document.createElement("video");
    if (p.local) {
      video.muted = true;
    }
    participantTile.appendChild(video);

    const audioIndicator = document.createElement("div");
    audioIndicator.className = "audio-indicator";
    participantTile.appendChild(audioIndicator);

    const nameTag = document.createElement("div");
    nameTag.className = "name";
    nameTag.innerText = name;
    participantTile.appendChild(nameTag);
    tiles.appendChild(participantTile);

    const tracks = Call.getParticipantTracks(p);
    try {
      updateMedia(id, tracks);
    } catch (e) {
      console.warn(e, tracks);
    }
  }

  // getTileTeam() returns the team to which
  // a player tile already belongs.
  private getTileTeam(playerID: string): Team | null {
    const tileID = getParticipantTileID(playerID);
    const tile = document.getElementById(tileID);
    if (!tile) return null;

    if (this.teamDIVs[Team.None]?.contains(tile)) {
      return Team.None;
    }
    if (this.teamDIVs[Team.Team1]?.contains(tile)) {
      return Team.Team1;
    }
    if (this.teamDIVs[Team.Team2]?.contains(tile)) {
      return Team.Team2;
    }
    return null;
  }
}

// removeTile() removes a play tile, if any.
export function removeTile(playerID: string) {
  const ele = document.getElementById(getParticipantTileID(playerID));
  if (!ele) return;

  const videoTags = ele.getElementsByTagName("video");

  // Set all src objects to null to prevent detached streams
  // There should only ever be ONE element per participant div,
  // but iterate over all just in case.
  for (let i = 0; i < videoTags.length; i += 1) {
    const vt = videoTags[i];
    vt.srcObject = null;
  }

  ele.remove();
}

// getParticipantTileID() returns an ID for the participant
// tile div.
function getParticipantTileID(sessionID: string): string {
  return `participant-${sessionID}`;
}

// getTile() returns a tile div for the given player.
function getTile(participantID: string): HTMLDivElement {
  const participantTileID = getParticipantTileID(participantID);
  const participantTile = <HTMLDivElement>(
    document.getElementById(participantTileID)
  );
  return participantTile;
}

export function updateAudioLevel(participantID: string, audioLevel: number) {
  const participantTile = getTile(participantID);
  if (!participantTile) {
    showGameError(
      new ErrGeneric(`tile for participant ID ${participantID} does not exist`),
    );
    return;
  }

  // Set opacity to visually reasonable value based on audio level
  let opacity = audioLevel / 0.08;
  // Clamp opacity to always be between 0 and 1
  opacity = Math.min(Math.max(opacity, 0), 1);

  const audioIndicator = <HTMLDivElement>(
    participantTile.getElementsByClassName("audio-indicator")[0]
  );

  // Update the inner glow shown within the participant tile.
  audioIndicator.style.setProperty(
    "box-shadow",
    `inset 0 0 1px 3px rgba(227, 196, 33, ${opacity})`,
  );
}

// updateMedia() updates the video and audio tracks for
// the given participant.
export function updateMedia(participantID: string, newTracks: Tracks) {
  // Get player's current tile.
  const participantTile = getTile(participantID);
  if (!participantTile) {
    showGameError(
      new ErrGeneric(`tile for participant ID ${participantID} does not exist`),
    );
    return;
  }

  // Get video tag from player's tile.
  const videoTags = participantTile.getElementsByTagName("video");
  if (!videoTags || videoTags.length === 0) {
    showGameError(
      new ErrGeneric(
        `video tile for participant ID ${participantID} does not exist`,
      ),
    );
    return;
  }
  const video = videoTags[0];

  // Get existing MediaStream from the video tag source object.
  const existingStream = <MediaStream>video.srcObject;

  const newVideo = newTracks.videoTrack;
  const newAudio = newTracks.audioTrack;

  // If there is no existing stream or it contains no tracks,
  // Just create a new media stream using our new tracks.
  // This will happen if this is the first time we're
  // setting the tracks.
  if (!existingStream || existingStream.getTracks().length === 0) {
    const tracks: MediaStreamTrack[] = [];
    if (newVideo) tracks.push(newVideo);
    if (newAudio) tracks.push(newAudio);
    const newStream = new MediaStream(tracks);
    video.srcObject = newStream;
    playMedia(video);
    return;
  }

  // This boolean will define whether we play the video element again
  // This should be `true` if any of the tracks have changed.
  let needsPlay = false;
  needsPlay = refreshAudioTrack(existingStream, newAudio);

  // We have an extra if check here compared to the audio track
  // handling above, because the video track also dictates
  // whether we should hide the video DOM element.
  if (newVideo) {
    if (refreshVideoTrack(existingStream, newVideo) && !needsPlay) {
      needsPlay = true;
    }

    video.classList.remove("hidden");
  } else {
    // If there's no video to be played, hide the element.
    video.classList.add("hidden");
  }
  if (needsPlay) {
    playMedia(video);
  }
}

// playMedia() tries to call play() on the video
// element if it is not already playing.
function playMedia(video: HTMLVideoElement) {
  const isPlaying =
    !video.paused &&
    !video.ended &&
    video.currentTime > 0 &&
    video.readyState > video.HAVE_CURRENT_DATA;

  if (isPlaying) return;

  video.play().catch((e) => {
    if (e instanceof Error && e.name === "NotAllowedError") {
      showGameError(new ErrMediaAutoplay());
      return;
    }

    console.warn("Failed to play media.", e);
  });
}

// refreshAudioTrack() refreshes a participant's audio track in the DOM.
function refreshAudioTrack(
  existingStream: MediaStream,
  newAudioTrack: MediaStreamTrack | null,
): boolean {
  // If there is no new track, just early out
  // and keep the old track on the stream as-is.
  if (!newAudioTrack) return false;
  const existingTracks = existingStream.getAudioTracks();
  return refreshTrack(existingStream, existingTracks, newAudioTrack);
}

// refreshVideoTrack() refreshes a participant's video track in the DOM.
function refreshVideoTrack(
  existingStream: MediaStream,
  newVideoTrack: MediaStreamTrack | null,
): boolean {
  // If there is no new track, just early out
  // and keep the old track on the stream as-is.
  if (!newVideoTrack) return false;
  const existingTracks = existingStream.getVideoTracks();
  return refreshTrack(existingStream, existingTracks, newVideoTrack);
}

// refreshTrack() compares the old tracks in a stream with new tracks
// and replaces them if their ID has changed.
function refreshTrack(
  existingStream: MediaStream,
  oldTracks: MediaStreamTrack[],
  newTrack: MediaStreamTrack,
): boolean {
  const trackCount = oldTracks.length;
  // If there is no matching old track,
  // just add the new track.
  if (trackCount === 0) {
    existingStream.addTrack(newTrack);
    return true;
  }
  if (trackCount > 1) {
    console.warn(
      `expected up to 1 media track, but got ${trackCount}. Only using the first one.`,
    );
  }
  const oldTrack = oldTracks[0];
  // If the IDs of the old and new track don't match,
  // replace the old track with the new one.
  if (oldTrack.id !== newTrack.id) {
    existingStream.removeTrack(oldTrack);
    existingStream.addTrack(newTrack);
    return true;
  }
  return false;
}
