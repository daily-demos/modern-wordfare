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

  drawGrid(space: Phaser.Geom.Rectangle) {
    const wordsPerRow = Math.sqrt(this.renderedWords.length);

    const wordWidth = textWidth;
    const wordHeight = textHeight;
    const wordBuffer = 10;

    const totalWidth = (wordWidth + wordBuffer) * wordsPerRow;

    const startX = space.x + (space.width - totalWidth) / 2;
    const startY = space.y + 50;

    let x = startX;
    let y = startY;
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      word.renderWordObject(x, y);
      x += wordWidth + wordBuffer;
      if (x >= wordWidth * wordsPerRow + startX) {
        y += wordHeight + wordBuffer;
        x = startX;
      }
    }
  }

  revealAllWords(ownTeam: Team) {
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      word.colorize(ownTeam);
    }
  }

  revealWord(wordVal: string, ownTeam: Team) {
    if (!ownTeam || ownTeam === Team.None) {
      ownTeam = Team.Team1;
    }
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      if (word.word.word === wordVal) {
        word.colorize(ownTeam);
        return;
      }
    }
    throw new Error(`word "${wordVal}" not found in grid`);
  }

  enableInteraction() {
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      if (!word.word.isRevealed) {
        word.enableInteraction();
      }
    }
  }

  disableInteraction() {
    for (let i = 0; i < this.renderedWords.length; i++) {
      const word = this.renderedWords[i];
      word.disableInteraction();
    }
  }
}
