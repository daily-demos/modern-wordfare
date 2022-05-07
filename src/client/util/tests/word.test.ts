import { WordKind } from "../../../shared/types";
import { wordCount, wordsPerTeam } from "../../config";
import createWordSet from "../word";

describe("Wordset generation tests", () => {
  test("Default dict", () => {
    const wordSet = createWordSet();
    expect(wordSet.length).toBe(wordCount);

    // Get all team 1 words
    let team1Count = 0;
    let team2Count = 0;
    let assassinCount = 0;

    for (let i = 0; i < wordSet.length; i += 1) {
      const word = wordSet[i];
      switch (word.kind) {
        case WordKind.Team1:
          team1Count += 1;
          break;
        case WordKind.Team2:
          team2Count += 1;
          break;
        case WordKind.Assassin:
          assassinCount += 1;
          break;
      }
    }

    expect(team1Count).toBe(wordsPerTeam);
    expect(team2Count).toBe(wordsPerTeam);
    expect(assassinCount).toBe(1);

    // Check for any word duplicatio
  });
});
