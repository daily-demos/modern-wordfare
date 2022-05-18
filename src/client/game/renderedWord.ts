import { Team } from "../../shared/types";
import { wordKindToTeam } from "../../shared/util";
import { Word, WordKind } from "../../shared/word";
import "../assets/audio/word-success.wav";
import "../assets/audio/word-failure.wav";

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

    const blob = new Blob([this.word.avatarSVG], { type: "image/svg+xml" });
  }

  colorize(ownTeam: Team, withAvatar: boolean = true) {
    console.log("colorizing word", this.word.value, withAvatar);
    const wordTeam = wordKindToTeam(this.word.kind);

    let tintShade;
    /* let bgColor;
    if (this.word.kind === WordKind.Assassin) {
      bgColor = this.assassinConfig.backgroundColor;
      tintShade = 0x666666;
    } else if (this.word.kind === WordKind.Neutral) {
      bgColor = this.neutralConfig.backgroundColor;
      tintShade = 0xd7d7d7;
    } else if (wordTeam === ownTeam) {
      bgColor = this.ownTeamConfig.backgroundColor;
      tintShade = 0x66ff00;
    } else {
      bgColor = this.otherTeamConfig.backgroundColor;
      tintShade = 0xff0000;
    } */
    this.object.classList.add(this.word.kind.toString());

    if (!withAvatar) return;

    this.playChime(ownTeam);
    this.revealAvatar(tintShade);
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
    if (wordTeam === ownTeam) {
      // play sound
      return;
    }
    // Play sound
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
