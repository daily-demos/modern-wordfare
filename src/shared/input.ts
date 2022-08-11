import validator from "validator";
import xss from "xss";

export const nameMinLength = 1;
export const nameMaxLength = 30;

export function isValidName(input: string): boolean {
  if (
    !validator.isAlphanumeric(input, "en-US", {
      ignore: " -",
    })
  ) {
    return false;
  }
  if (input.length > nameMaxLength) {
    return false;
  }
  return true;
}

export function isValidWord(input: string): boolean {
  if (
    !validator.isAlpha(input, "en-US", {
      ignore: " -",
    })
  ) {
    return false;
  }
  if (input.length > nameMaxLength) {
    return false;
  }
  return true;
}

// sanitize() sanitizes given input
export function sanitize(input: any): typeof input {
  console.log("pre:", input);
  if (typeof input === "string") {
    console.log("thanks", xss(input));
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
