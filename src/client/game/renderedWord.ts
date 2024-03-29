import { Team } from "../../shared/types";
import { wordKindToTeam } from "../../shared/util";
import { Word } from "../../shared/word";
import successAudio from "../assets/audio/word-success.wav";
import failureAudio from "../assets/audio/word-failure.wav";

export default class RenderedWord {
  word: Word;

  private button: HTMLButtonElement | undefined;

  private onClick: (w: Word) => void;

  constructor(word: Word, onClick: (w: Word) => void) {
    this.word = word;
    this.onClick = onClick;
  }

  colorize(selectingTeam = Team.None, withChime: boolean = false) {
    if (!this.button) return;

    this.button.classList.add(this.word.kind.toString());
    if (!withChime) return;

    this.playChime(selectingTeam);
    this.button.classList.add("revealed");
  }

  renderWordObject(): HTMLButtonElement {
    const word = document.createElement("button");
    word.innerText = this.word.value;
    word.disabled = true;
    this.button = word;
    this.button.onclick = () => {
      this.onClick(this.word);
    };
    return this.button;
  }

  enableInteraction() {
    if (!this.button) return;
    this.button.disabled = false;
  }

  disableInteraction() {
    if (!this.button) return;
    this.button.disabled = true;
  }

  private playChime(selectingTeam: Team) {
    const wordTeam = wordKindToTeam(this.word.kind);
    const audio = new Audio();
    if (wordTeam === selectingTeam) {
      audio.src = successAudio;
      audio.play();
      return;
    }
    audio.src = failureAudio;
    audio.play();
  }
}
