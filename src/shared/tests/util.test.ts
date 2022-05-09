import { setContainsDuplicateWords } from "../util";
import { Word, WordKind } from "../word";

describe("utility tests", () => {
  test("word set does not contain duplicates", () => {
    const words: Word[] = [
      new Word("val1", WordKind.Assassin),
      new Word("val2", WordKind.Neutral),
      new Word("val3", WordKind.Team1),
      new Word("val4", WordKind.Neutral),
    ];
    const hasDupes = setContainsDuplicateWords(words);
    expect(hasDupes).toBe(false);
  });
  test("word set contains duplicates", () => {
    const words: Word[] = [
      new Word("val1", WordKind.Assassin),
      new Word("val2", WordKind.Neutral),
      new Word("val3", WordKind.Team1),
      new Word("val1", WordKind.Neutral),
    ];
    const hasDupes = setContainsDuplicateWords(words);
    expect(hasDupes).toBe(true);
  });
});
