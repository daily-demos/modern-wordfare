import { Word } from "../../../shared/types";
import { RenderedWord, textHeight, textWidth } from "./renderedWord";

export class WordGrid {
  private renderedWords: RenderedWord[] = [];

  constructor(scene: Phaser.Scene, words: Word[]) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      this.renderedWords.push(new RenderedWord(scene, word));
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
}
