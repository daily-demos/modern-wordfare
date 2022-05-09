import { Team } from "../../../shared/types";
import { wordKindToTeam } from "../../../shared/util";
import { Word, WordKind } from "../../../shared/word";

export const textWidth = 125;
export const textHeight = 45;
const fontSize = "20px";
const align = "center";
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
  }

  colorize(ownTeam: Team) {
    const style = this.wordStyle;
    const wordTeam = wordKindToTeam(this.word.kind);
    console.log("wordKind:", this.word.kind, wordTeam);
    if (this.word.kind === WordKind.Assassin) {
      style.backgroundColor = this.assassinConfig.backgroundColor;
    } else if (this.word.kind === WordKind.Neutral) {
      style.backgroundColor = this.neutralConfig.backgroundColor;
    } else if (wordTeam === ownTeam) {
      style.backgroundColor = this.ownTeamConfig.backgroundColor;
    } else {
      style.backgroundColor = this.otherTeamConfig.backgroundColor;
    }
    this.object.setStyle(style);
  }

  renderWordObject(x: number, y: number) {
    const { wordStyle } = this;
    wordStyle.backgroundColor = this.neutralConfig.backgroundColor;
    if (this.word.value.length > 10) {
      wordStyle.fontSize = "20px";
    }
    const text = this.scene.add
      .text(x, y, this.word.value, wordStyle)
      .setOrigin(0.5, 0);
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
}
