import validator from "validator";
import xss from "xss";

export const nameMinLength = 1;
export const nameMaxLength = 30;

// isValidName() checks whether the given game
// or player name is valid
export function isValidName(input: string): boolean {
  const trimmed = input.trim();
  const l = trimmed.length;
  if (l > nameMaxLength || l < nameMinLength) {
    return false;
  }

  if (
    !validator.isAlphanumeric(input, "en-US", {
      ignore: " -",
    })
  ) {
    return false;
  }

  return true;
}

// isValidWord() checks if the given word is valid
export function isValidWord(input: string): boolean {
  const trimmed = input.trim();
  const l = trimmed.length;
  if (l > 15 || l < 2) {
    return false;
  }

  if (
    !validator.isAlpha(input, "en-US", {
      ignore: " -",
    })
  ) {
    return false;
  }

  return true;
}

// sanitize() sanitizes given input, specifically
// HTML tags
export function sanitize(input: any): typeof input {
  if (typeof input === "string") {
    return xss(input);
  }
  if (Array.isArray(input) || typeof input === "object") {
    return sanitizeObject(input);
  }
  return input;
}

function sanitizeObject(input: any): typeof input {
  const sanitized = input;
  Object.entries(input).forEach((entry) => {
    const [key, val] = entry;
    sanitized[key] = sanitize(val);
  });
  return sanitized;
}
