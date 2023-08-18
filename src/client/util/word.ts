import defaultWordlist from "../dictionaries/default.json";
import { wordCount, wordsPerTeam } from "../config";
import { rand, shuffle } from "../../shared/math";
import { setContainsDuplicateWords } from "../../shared/util";
import { Word, WordKind } from "../../shared/word";

export default function createWordSet(): Word[] {
  // Pick 25 random words
  let words = chooseRandomWords(defaultWordlist.words, wordCount);

  words = shuffle(words);

  // Divide the words into two teams
  const team1WordSet = buildWordSet(words, wordsPerTeam, WordKind.Team1);
  const team2WordSet = buildWordSet(words, wordsPerTeam, WordKind.Team2);

  const assassinWord = buildWordSet(words, 1, WordKind.Assassin);

  const neutralWordSet: Word[] = [];

  // The rest of the words are neutral
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    const word = new Word(w, WordKind.Neutral);
    neutralWordSet.push(word);
  }

  let wordSet = team1WordSet
    .concat(team2WordSet)
    .concat(neutralWordSet)
    .concat(assassinWord);

  wordSet = shuffle(wordSet);
  if (setContainsDuplicateWords(wordSet)) {
    throw new Error("wordset contains duplicate elements");
  }
  return wordSet;
}

function buildWordSet(
  allWords: string[],
  count: number,
  kind: WordKind,
): Word[] {
  const chosenWords: Word[] = [];
  for (let i = 0; i < count; i += 1) {
    const w = allWords[i];
    const word = new Word(w, kind);
    chosenWords.push(word);
    allWords.splice(i, 1);
  }
  return chosenWords;
}

function chooseRandomWords(allWords: string[], count: number): string[] {
  const l = allWords.length;
  if (l < count) {
    throw new Error(
      `world list needs at least ${count}, but only contains ${l}`,
    );
  }
  const chosenWords: string[] = [];
  while (chosenWords.length < count) {
    const idx = rand(0, l - 1);
    const w = allWords[idx];
    // Do not include duplicate words
    if (!chosenWords.includes(w)) {
      chosenWords.push(w);
    }
  }
  return chosenWords;
}
