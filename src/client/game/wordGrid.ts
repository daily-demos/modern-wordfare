import { Team } from "../../shared/types";
import { Word } from "../../shared/word";
import RenderedWord from "./renderedWord";

export default class WordGrid {
  private renderedWords: RenderedWord[] = [];

  private board: HTMLDivElement;

  constructor(words: Word[], onClick: (w: Word) => void) {
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      this.renderedWords.push(new RenderedWord(word, onClick));
    }
  }

  drawGrid() {
    this.board = <HTMLDivElement>document.getElementById("board");
    this.board.classList.remove("hidden");
    for (let i = 0; i < this.renderedWords.length; i += 1) {
      const rw = this.renderedWords[i];
      const obj = rw.renderWordObject();
      this.board.appendChild(obj);
      if ((i + 1) % 5 === 0) {
        const sep = <HTMLDivElement>document.createElement("div");
        sep.classList.add("separator");
        this.board.appendChild(sep);
      }
    }
  }

  revealAllWords(ownTeam: Team) {
    for (let i = 0; i < this.renderedWords.length; i += 1) {
      const word = this.renderedWords[i];
      word.colorize(ownTeam, false);
    }
  }

  revealWord(wordVal: string, ownTeam: Team) {
    let ot = ownTeam;
    if (!ot || ot === Team.None) {
      ot = Team.Team1;
    }
    for (let i = 0; i < this.renderedWords.length; i += 1) {
      const rw = this.renderedWords[i];
      if (rw.word.value === wordVal) {
        rw.colorize(ot);
        rw.disableInteraction();
        return;
      }
    }
    throw new Error(`word "${wordVal}" not found in grid`);
  }

  enableInteraction() {
    for (let i = 0; i < this.renderedWords.length; i += 1) {
      const word = this.renderedWords[i];
      if (!word.word.isRevealed) {
        word.enableInteraction();
      }
    }
  }

  disableInteraction() {
    for (let i = 0; i < this.renderedWords.length; i += 1) {
      const word = this.renderedWords[i];
      word.disableInteraction();
    }
  }
}
