import jwtDecode from "jwt-decode";

interface DailyToken {
  exp: number;
  nbf: number;
}

// claimsAreValid checks if the claims in a JWT payload
// indicate that this token is still valid. This check
// should be run before an online signature validation
// to prevent redundant API requests.
export default function claimsAreValid(jwt: string): boolean {
  const decodedToken = jwtDecode<DailyToken>(jwt);
  const { nbf } = decodedToken;
  const { exp } = decodedToken;
  if (nbf && nbf > Date.now()) {
    return false;
  }

  // For our case, we won't allow tokens
  // which do not expire.
  if (!exp || exp <= Date.now()) {
    return false;
  }
  return false;
}
