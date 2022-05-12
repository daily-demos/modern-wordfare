import { Team } from "../../../shared/types";
import { wordKindToTeam } from "../../../shared/util";
import { Word, WordKind } from "../../../shared/word";
import "../../assets/audio/word-success.wav";
import "../../assets/audio/word-failure.wav";

export const textWidth = 163;
export const textHeight = 65;
const fontSize = "24px";
const align = "left";
const padding = 5;

export class RenderedWord {
  word: Word;

  object: Phaser.GameObjects.Text;

  private onClick: (w: Word) => void;

  scene: Phaser.Scene;

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

  private wordStyle = <Phaser.Types.GameObjects.Text.TextStyle>{
    fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
    fontSize,
    fixedWidth: textWidth,
    fixedHeight: textHeight,
    color: "#000000",
    padding,
    align,
  };

  constructor(scene: Phaser.Scene, word: Word, onClick: (w: Word) => void) {
    this.word = word;
    this.scene = scene;
    this.onClick = onClick;

    const blob = new Blob([this.word.avatarSVG], { type: "image/svg+xml" });

    const url = URL.createObjectURL(blob);
    this.scene.load.svg(this.getAvatarID(), url);
    this.scene.load.audio("success", "../assets/audio/word-success.wav");
    this.scene.load.audio("failure", "../assets/audio/word-failure.wav");
  }

  colorize(ownTeam: Team, withAvatar: boolean = true) {
    console.log("colorizing word", this.word.value, withAvatar)
    const style = this.wordStyle;
    const wordTeam = wordKindToTeam(this.word.kind);

    let tintShade;
    if (this.word.kind === WordKind.Assassin) {
      style.backgroundColor = this.assassinConfig.backgroundColor;
      tintShade = 0x666666;
    } else if (this.word.kind === WordKind.Neutral) {
      style.backgroundColor = this.neutralConfig.backgroundColor;
      tintShade = 0xd7d7d7;
    } else if (wordTeam === ownTeam) {
      style.backgroundColor = this.ownTeamConfig.backgroundColor;
      tintShade = 0x66ff00;
    } else {
      style.backgroundColor = this.otherTeamConfig.backgroundColor;
      tintShade = 0xff0000;
    }
    this.object.setStyle(style);

    if (!withAvatar) return;

    this.playChime(ownTeam);
    this.revealAvatar(tintShade);
  }

  renderWordObject(x: number, y: number) {
    const { wordStyle } = this;
    wordStyle.backgroundColor = this.neutralConfig.backgroundColor;
    if (this.word.value.length > 10) {
      wordStyle.fontSize = "20px";
    }
    const text = this.scene.add
      .text(x, y, this.word.value, wordStyle)
      .setOrigin(0, 0);
    this.object = text;
    this.object.on("pointerdown", () => {
      console.log("clicked on word: ", this.word.value);
      this.onClick(this.word);
    });
  }

  enableInteraction() {
    this.object.setInteractive();
  }

  disableInteraction() {
    this.object.disableInteractive();
  }

  private getAvatarID(): string {
    return `avatar-${this.word.value}`;
  }

  private playChime(ownTeam: Team) {
    const wordTeam = wordKindToTeam(this.word.kind);
    if (wordTeam === ownTeam) {
      this.scene.sound.play("success", {
        name: "success",
        start: 0,
        duration: 1.0,
      });
      return;
    }
    this.scene.sound.play("failure");
  }

  private revealAvatar(tintShade: number) {
    const avatar = this.scene.add
      .image(
        this.object.x + textWidth - 32,
        this.object.y + 16,
        this.getAvatarID()
      )
      .setOrigin(0.5);
    console.log("revealing avatar:", avatar, this.object.x + textWidth - 32, this.object.y + 16);
    avatar.setTint(tintShade);
    avatar.alpha = 0;
    this.scene.tweens.add({
      targets: avatar,
      alpha: 1,
      duration: 1000,
      ease: "Power2",
    });
  }
}
