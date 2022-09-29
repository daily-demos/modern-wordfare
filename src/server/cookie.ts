import cookieParser from "cookie-parser";
import { Application } from "express";
import crypto from "crypto";
import { COOKIE_SIGNING_SECRET } from "./env";

type Cookies = { [key in string]?: string };

let signingSecret: string = COOKIE_SIGNING_SECRET || "";

// setupCookieParser() has our application use the cookie parser
// middleware. This will allow us to sign cookies.
export function setupCookieParser(app: Application) {
  // This can be provided in the `COOKIE_SIGNING_SECRET`
  // environment variable. But if not, we'll just generate
  // a secret at runtime.
  if (signingSecret === "") {
    const buf = crypto.randomBytes(32);
    signingSecret = buf.toString();
  }
  app.use(cookieParser(signingSecret));
}

// getGameHostCookieName() returns the intended name of the
// game host cookie.
export function getGameHostCookieName(gameID: string): string {
  return `gh-${gameID}`;
}

// getGameHostCookie() takes all available cookies and a game ID, and returns
// the value of the game host cookie, if found. The value will be the creation
// time of the cookie.
export function getGameHostCookie(cookies: string, gameID: string): number {
  const parts = cookies.split(`${getGameHostCookieName(gameID)}=`);
  if (parts.length !== 2) {
    return -1;
  }
  const val = parts.pop()?.split("; ").shift();
  const decodedCookie = val ? decodeURIComponent(val) : "";

  // We expect the cookie to be signed. If cookie parser returns
  // false or an identical value to what was passed in, something
  // went wrong and we don't have a valid game host cookie.
  const parsed = cookieParser.signedCookie(decodedCookie, signingSecret);
  if (!parsed || decodedCookie === parsed) return -1;

  // Get numeric representation of cookie value.
  // If the result is not a number, something went wrong,
  // meaning we do not have a valid game host cookie.
  const createdAt = +parsed;
  if (Number.isNaN(createdAt)) return -1;
  return createdAt;
}

// isGameHostValueValid() takes a cookie creation time
// and a game creation time, and verifies that the game host
// cookie was created at maximum 10 seconds after the game.
// (In reality the creation diff should be much shorter, we're
// just being extra permissive here).
export function isGameHostValueValid(
  cookieCreatedAt: number,
  gameCreatedAt: number
): boolean {
  const sec = 1000;
  const earliest = gameCreatedAt;
  const latest = gameCreatedAt + 10 * sec;

  return cookieCreatedAt >= earliest && cookieCreatedAt <= latest;
}

// isGameHostFromSignedCookie() takes an object of Cookies,
// a game ID, and a game creation time. It retrieves the game
// host cookie (if any) and validates its value.
export function isGameHostFromSignedCookies(
  cookies: Cookies,
  gameID: string,
  gameCreatedAt: number
): boolean {
  const c = cookies[getGameHostCookieName(gameID)];
  const parsed: number = c ? +c : -1;
  return isGameHostValueValid(parsed, gameCreatedAt);
}
