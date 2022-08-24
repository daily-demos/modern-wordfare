import cookieParser from "cookie-parser";
import { Application } from "express";
import { DAILY_API_KEY } from "./env";

type Cookies = { [key in string]?: string };

// setupMiddleware() has our application use the cookie parser
// with the Daily API key as our cookie signing secret.
export function setupCookieParser(app: Application) {
  app.use(cookieParser(DAILY_API_KEY));
}

export function getGameHostCookieName(gameID: string): string {
  return `gh-${gameID}`;
}

export function getGameHostCookie(cookies: string, gameID: string): number {
  const parts = cookies.split(`${getGameHostCookieName(gameID)}=`);
  if (parts.length !== 2) {
    return -1;
  }
  const val = parts.pop().split("; ").shift();
  const decodedCookie = decodeURIComponent(val);
  const parsed = cookieParser.signedCookie(decodedCookie, DAILY_API_KEY);
  if (!decodedCookie || decodedCookie === parsed) return -1;

  const createdAt = +parsed;
  if (typeof createdAt !== "number") return -1;
  return createdAt;
}

export function isGameHostValueValid(
  cookieCreatedAt: number,
  gameCreatedAt: number
): boolean {
  const sec = 1000;
  const earliest = gameCreatedAt;
  const latest = gameCreatedAt + 10 * sec;

  return cookieCreatedAt >= earliest && cookieCreatedAt <= latest;
}

export function isGameHostFromSignedCookies(
  cookies: Cookies,
  gameID: string,
  gameCreatedAt: number
): boolean {
  const c = cookies[getGameHostCookieName(gameID)];
  const parsed: number = +c;
  return isGameHostValueValid(parsed, gameCreatedAt);
}
