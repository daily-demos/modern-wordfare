import { isValidName, isValidWord, sanitize } from "../input";

describe("validation tests", () => {
  test("valid names", () => {
    let input = "My Name";
    expect(isValidName(input)).toBe(true);

    input = "Number 1 Game";
    expect(isValidName(input)).toBe(true);

    input = "Dashing-Game";
    expect(isValidName(input)).toBe(true);

    input = "A";
    expect(isValidName(input)).toBe(true);

    input = "1";
    expect(isValidName(input)).toBe(true);
  });

  test("invalid names", () => {
    let input = " ";
    expect(isValidName(input)).toBe(false);

    input = "Punctuation?";
    expect(isValidName(input)).toBe(false);

    input = "           ";
    expect(isValidName(input)).toBe(false);

    input =
      "This name contains all the right character but is WAY too long to pass validation";
    expect(isValidName(input)).toBe(false);

    input = "alert('what are we doing here?')";
    expect(isValidName(input)).toBe(false);

    input = "";
    expect(isValidName(input)).toBe(false);
  });

  test("valid words", () => {
    let input = "Acceptable word";
    expect(isValidWord(input)).toBe(true);

    input = "Dashed-word";
    expect(isValidWord(input)).toBe(true);

    input = "Cat";
    expect(isValidWord(input)).toBe(true);
  });

  test("invalid words", () => {
    let input = "Overly long word that we don't support";
    expect(isValidWord(input)).toBe(false);

    input = "Punctuation? Why?";
    expect(isValidWord(input)).toBe(false);

    input = "";
    expect(isValidWord(input)).toBe(false);

    input = " ";
    expect(isValidWord(input)).toBe(false);
  });
});

describe("sanitization tests", () => {
  test("sanitize normal string", () => {
    const input = "My Name???";

    const got = sanitize(input);
    const want = "My Name???";

    expect(got).toBe(want);
  });

  test("sanitize script tag", () => {
    const input = "<script>alert('not suspicious')</script>";
    const got = sanitize(input);
    const want = "&lt;script&gt;alert('not suspicious')&lt;/script&gt;";
    expect(got).toBe(want);
  });
});
