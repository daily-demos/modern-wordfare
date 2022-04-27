import { Word } from "../../../shared/types";

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

  renderWordObject(x: number, y: number) {
    const wordStyle = this.wordStyle;
    wordStyle.backgroundColor = this.neutralConfig.backgroundColor;
    if (this.word.word.length > 10) {
      wordStyle.fontSize = "20px";
    }
    let text = this.scene.add.text(x, y, this.word.word, wordStyle);
    text.setInteractive();
    text.on("pointerdown", () => {
      console.log("clicked on word: ", this.word.word);
    });
    this.object = text;
  }
}
