import { setContainsDuplicateWords } from "../util";
import { Word, WordKind } from "../word";

describe("utility tests", () => {
  test("word set does not contain duplicates", () => {
    const words: Word[] = [
      new Word("valone", WordKind.Assassin),
      new Word("valtwo", WordKind.Neutral),
      new Word("val-thee", WordKind.Team1),
      new Word("val four", WordKind.Neutral),
    ];
    const hasDupes = setContainsDuplicateWords(words);
    expect(hasDupes).toBe(false);
  });
  test("word set contains duplicates", () => {
    const words: Word[] = [
      new Word("valone", WordKind.Assassin),
      new Word("val two", WordKind.Neutral),
      new Word("val-three", WordKind.Team1),
      new Word("valone", WordKind.Neutral),
    ];
    const hasDupes = setContainsDuplicateWords(words);
    expect(hasDupes).toBe(true);
  });
});
