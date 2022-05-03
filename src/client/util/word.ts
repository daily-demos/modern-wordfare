import defaultWordlist from "../dictionaries/default.json";
import { wordCount, wordsPerTeam } from "../config";
import { rand, shuffle } from "./math";
import { Word, WordKind } from "../../shared/types";

export default function createWordSet(): Word[] {
  // Pick 25 random words
  const words = chooseRandomWords(defaultWordlist.words, wordCount);
  // Divide the words into two teams
  const team1WordSet = buildWordSet(words, wordsPerTeam, WordKind.Team1);
  const team2WordSet = buildWordSet(words, wordsPerTeam, WordKind.Team2);

  const assassinWord = buildWordSet(words, 1, WordKind.Assassin);

  const neutralWordSet: Word[] = [];
  // The rest of the words are neutral
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    const word = {
      word: w,
      kind: WordKind.Neutral,
      isRevealed: false,
    };
    neutralWordSet.push(word);
  }

  let wordSet = team1WordSet
    .concat(team2WordSet)
    .concat(neutralWordSet)
    .concat(assassinWord);

  wordSet = shuffle(wordSet);
  return wordSet;
}

function buildWordSet(words: string[], count: Number, kind: WordKind): Word[] {
  const chosenWords = chooseRandomWords(words, count);
  const wordSet: Word[] = [];
  for (let i = 0; i < chosenWords.length; i += 1) {
    const w = chosenWords[i];
    words.splice(i, 1);
    const word = {
      word: w,
      kind,
      isRevealed: false,
    };
    wordSet.push(word);
  }
  return wordSet;
}

function chooseRandomWords(allWords: string[], count: Number): string[] {
  const l = allWords.length;
  if (l < count) {
    throw new Error(
      `world list needs at least ${count}, but only contains ${l}`
    );
  }
  const chosenWords: string[] = [];
  while (chosenWords.length < count) {
    const idx = rand(0, l - 1);
    const w = allWords[idx];
    if (!chosenWords.includes(w)) {
      chosenWords.push(w);
    }
  }
  return chosenWords;
}
