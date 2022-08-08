import jwtDecode from "jwt-decode";

interface DailyToken {
  exp: number;
  nbf: number;
  room_name: string;
}

// claimsAreValid checks if the claims in a JWT payload
// indicate that this token is still valid. This check
// should be run before an online signature validation
// to prevent redundant API requests.
export default function claimsAreValid(jwt: string): boolean {
  const decodedToken = jwtDecode<DailyToken>(jwt);
  const now = Date.now() / 1000;
  const { nbf, exp, room_name } = decodedToken;
  if (nbf && nbf > now) {
    return false;
  }

  // For our case, we won't allow tokens
  // which do not expire, or tokens
  // without a room name.
  if (!exp || exp <= now || !room_name) {
    return false;
  }

  // Token is within valid time frame and has a room name,
  // so return the claims as valid.
  return true;
}
