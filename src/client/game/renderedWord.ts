import { Team } from "../../shared/types";
import { wordKindToTeam } from "../../shared/util";
import { Word, WordKind } from "../../shared/word";
import successAudio from "../assets/audio/word-success.wav";
import failureAudio from "../assets/audio/word-failure.wav";

export const textWidth = 163;
export const textHeight = 65;
const fontSize = "24px";
const align = "left";
const padding = 5;

export class RenderedWord {
  word: Word;

  object: HTMLButtonElement;

  private onClick: (w: Word) => void;

  neutralConfig = {
    backgroundColor: "#cccccc",
  };

  ownTeamConfig = {
    backgroundColor: "#00ff00",
  };

  otherTeamConfig = {
    backgroundColor: "#ff0000",
  };

  assassinConfig = {
    backgroundColor: "#818589",
  };

  constructor(word: Word, onClick: (w: Word) => void) {
    this.word = word;
    this.onClick = onClick;

   /* const blob = new Blob([this.word.avatarSVG], { type: "image/svg+xml" }); */
  }

  colorize(ownTeam: Team, withChime: boolean = true) {
    this.object.classList.add(this.word.kind.toString());

    if (!withChime) return;

    this.playChime(ownTeam);
  }

  renderWordObject(): HTMLButtonElement {
    const word = document.createElement("button");
    word.innerText = this.word.value;
    word.disabled = true;
    this.object = word;
    this.object.onclick = () => {
      console.log("clicked on word: ", this.word.value);
      this.onClick(this.word);
    };
    return this.object;
  }

  enableInteraction() {
    this.object.disabled = false;
  }

  disableInteraction() {
    this.object.disabled = true;
  }

  private getAvatarID(): string {
    return `avatar-${this.word.value}`;
  }

  private playChime(ownTeam: Team) {
    const wordTeam = wordKindToTeam(this.word.kind);
    let audio = new Audio();
    if (wordTeam === ownTeam) {
      audio.src = successAudio;
      audio.play();
      return;
    }
    audio.src = failureAudio;
    audio.play();
  }

  private revealAvatar(tintShade: number) {
    console.log("avatar being revealed");
    /*  const avatar = this.scene.add
      .image(
        this.object.x + textWidth - 32,
        this.object.y + 16,
        this.getAvatarID()
      )
      .setOrigin(0.5);

      avatar.setTint(tintShade);
    avatar.alpha = 0;
    this.scene.tweens.add({
      targets: avatar,
      alpha: 1,
      duration: 1000,
      ease: "Power2",
    }); */
  }
}
