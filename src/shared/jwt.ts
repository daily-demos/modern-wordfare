import jwtDecode from "jwt-decode";

interface DailyToken {
  exp: number;
  nbf: number;
  // r is going to be the claim
  // that matches our room name
  r: string;
}

// claimsAreValid checks if the claims in a JWT payload
// indicate that this token is still valid. This check
// should be run before an online signature validation
// to prevent redundant API requests.
export default function claimsAreValid(jwt: string, roomName: string): boolean {
  const decodedToken = jwtDecode<DailyToken>(jwt);
  const now = Date.now() / 1000;
  const { nbf, exp, r } = decodedToken;
  if (nbf && nbf > now) {
    return false;
  }

  // For our case, we won't allow tokens
  // which do not expire
  if (!exp || exp <= now) {
    return false;
  }

  // We'll also require the token to contain
  // a room name, and for the room name to match.
  if (!r || r !== roomName) {
    return false;
  }

  // Token is within valid time frame and has a room name,
  // so return the claims as valid.
  return true;
}
