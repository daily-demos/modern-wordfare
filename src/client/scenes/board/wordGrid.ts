import { Team, Word } from "../../../shared/types";
import { shuffle } from "../../util/math";
import { RenderedWord, textHeight, textWidth } from "./renderedWord";

export class WordGrid {
  private renderedWords: RenderedWord[] = [];

  constructor(scene: Phaser.Scene, words: Word[], onClick: (w: Word) => void) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      this.renderedWords.push(new RenderedWord(scene, word, onClick));
    }
  }

  drawGrid(startX: number, startY: number) {
    let x = startX;
    let y = startY;

    const wordsPerRow = Math.sqrt(this.renderedWords.length);
    const wordWidth = textWidth;
    const wordHeight = textHeight;

    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      word.renderWordObject(x, y);
      x += wordWidth;
      if (x >= wordWidth * wordsPerRow + startX) {
        y += wordHeight + 5;
        x = startX;
      } else {
        x += wordWidth;
      }
    }
  }

  revealAllWords(ownTeam: Team) {
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      word.colorize(ownTeam);
    }
  }

  enableInteraction() {
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      word.enableInteraction();
    }
  }

  disableInteraction() {
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      word.disableInteraction();
    }
  }
}
