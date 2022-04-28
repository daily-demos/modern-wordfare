import { Team, Word, WordKind } from "../../../shared/types";

export const textWidth = 145;
export const textHeight = 50;
const fontSize = "25px";
const align = "center";
const padding = 5;

export class RenderedWord {
  word: Word;
  object: Phaser.GameObjects.Text;
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
    fontSize: fontSize,
    fixedWidth: textWidth,
    fixedHeight: textHeight,
    color: "#000000",
    padding: padding,
    align: align,
  };

  constructor(scene: Phaser.Scene, word: Word) {
    this.word = word;
    this.scene = scene;
  }

  colorize(ownTeam: Team) {
    let style = this.wordStyle;
    console.log("word kind, own team:", this.word.kind, ownTeam);
    if (
      (this.word.kind === WordKind.Team1 && ownTeam === Team.Team1) ||
      (this.word.kind === WordKind.Team2 && ownTeam === Team.Team2)
    ) {
      style.backgroundColor = this.ownTeamConfig.backgroundColor;
    } else if (this.word.kind === WordKind.Assassin) {
      style.backgroundColor = this.assassinConfig.backgroundColor;
    } else if (this.word.kind === WordKind.Neutral) {
      style.backgroundColor = this.neutralConfig.backgroundColor;
    } else {
      style.backgroundColor = this.otherTeamConfig.backgroundColor;
    }
    this.object.setStyle(style);
  }

  renderWordObject(x: number, y: number) {
    const wordStyle = this.wordStyle;
    wordStyle.backgroundColor = this.neutralConfig.backgroundColor;
    if (this.word.word.length > 10) {
      wordStyle.fontSize = "20px";
    }
    let text = this.scene.add.text(x, y, this.word.word, wordStyle);
    this.object = text;
  }

  enableInteraction() {
    this.object.setInteractive();
    this.object.on("pointerdown", () => {
      console.log("clicked on word: ", this.word.word);
    });
  }

  disableInteraction() {
    this.object.disableInteractive();
  }
}
