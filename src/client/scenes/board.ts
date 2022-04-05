import { wordCount } from "../config";
import { Call } from "../daily";
import { rand } from "../util";
import defaultWordlist from "../dictionaries/default.json";

enum WordKind {
  Neutral = 0,
  Team1,
  Team2,
  Assassin,
}

type Word = {
  word: string;
  kind: WordKind;
};

class Board extends Phaser.Scene {
  words: Word[];
  call: Call;

  constructor() {
    super("Board");
  }
  preload() {}

  create() {
    this.createWordSet();
  }

  update() {}

  createWordSet() {
    // Pick 25 random words
    const words = chooseRandomWords(defaultWordlist.words, wordCount);

    // Divide the words into two teams
    const team1WordSet = this.buildWordSet(words, 8, WordKind.Team1);
    const team2WordSet = this.buildWordSet(words, 8, WordKind.Team2);
    const assassinWord = this.buildWordSet(words, 1, WordKind.Neutral);
    let neutralWordSet: Word[];
    // The rest of the words are neutral
    for (let w in words) {
      const word = {
        word: w,
        kind: WordKind.Neutral,
      };
      neutralWordSet.push(word);
    }

    this.words = team1WordSet
      .concat(team2WordSet)
      .concat(neutralWordSet)
      .concat(assassinWord);
  }

  buildWordSet(words: string[], count: Number, kind: WordKind): Word[] {
    const chosenWords = chooseRandomWords(words, count);
    let wordSet: Word[];
    for (const w in chosenWords) {
      const idx = words.indexOf(w);
      if (idx > -1) {
        throw new Error(`word "${w}" not in list of available words`);
      }
      words = words.splice(idx, 1);
      const word = {
        word: w,
        kind: kind,
      };
      wordSet.push(word);
    }
    return wordSet;
  }
}

function chooseRandomWords(allWords: string[], count: Number): string[] {
  const l = allWords.length;
  if (l < count) {
    throw new Error(
      `world list needs at least ${count}, but only contains ${l}`
    );
  }
  let chosenWords: string[];
  while (chosenWords.length < count) {
    const idx = rand(0, l - 1);
    const w = allWords[idx];
    if (chosenWords.includes(w)) {
      continue;
    }
    chosenWords.push(w);
  }
  return chosenWords;
}
