import { Team } from "../../shared/types";
import { wordKindToTeam } from "../../shared/util";
import { Word } from "../../shared/word";
import successAudio from "../assets/audio/word-success.wav";
import failureAudio from "../assets/audio/word-failure.wav";

export class RenderedWord {
  word: Word;

  private button: HTMLButtonElement;

  private onClick: (w: Word) => void;

  constructor(word: Word, onClick: (w: Word) => void) {
    this.word = word;
    this.onClick = onClick;
  }

  colorize(ownTeam: Team, withChime: boolean = true) {
    this.button.classList.add(this.word.kind.toString());

    if (!withChime) return;

    this.playChime(ownTeam);
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
    this.button.disabled = false;
  }

  disableInteraction() {
    this.button.disabled = true;
  }

  private playChime(ownTeam: Team) {
    const wordTeam = wordKindToTeam(this.word.kind);
    const audio = new Audio();
    if (wordTeam === ownTeam) {
      audio.src = successAudio;
      audio.play();
      return;
    }
    audio.src = failureAudio;
    audio.play();
  }
}
