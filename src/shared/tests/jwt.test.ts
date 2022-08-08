import * as jwt from "jsonwebtoken";
import claimsAreValid from "../jwt";

describe("jwt tests", () => {
  test("basic valid claims", () => {
    const now = Date.now();
    const exp = Math.floor(now / 1000) + 86400;
    const nbf = Math.ceil(now / 1000) - 100;

    const payload = {
      exp,
      nbf,
      room_name: "my_test_room",
    };
    const token = jwt.sign(payload, "test_secret");
    const gotValid = claimsAreValid(token, "my_test_room");
    expect(gotValid).toBe(true);
  });
  test("token has expired valid claims", () => {
    const exp = Math.floor(Date.now() / 1000) - 100;
    const payload = {
      exp,
      room_name: "my_test_room",
    };
    const token = jwt.sign(payload, "test_secret");
    const gotValid = claimsAreValid(token, "my_test_room");
    expect(gotValid).toBe(false);
  });

  test("token has no expiry claim", () => {
    const payload = {
      room_name: "my_test_room",
    };
    const token = jwt.sign(payload, "test_secret");
    const gotValid = claimsAreValid(token, "my_test_room");
    expect(gotValid).toBe(false);
  });
  test("token has no room claim", () => {
    const exp = Math.floor(Date.now() / 1000) + 86400;
    const payload = {
      exp,
    };
    const token = jwt.sign(payload, "test_secret");
    const gotValid = claimsAreValid(token, "my_test_room");
    expect(gotValid).toBe(false);
  });
  test("token has invalid room claim", () => {
    const exp = Math.floor(Date.now() / 1000) + 86400;
    const payload = {
      exp,
      room_name: "my_test_room",
    };
    const token = jwt.sign(payload, "test_secret");
    const gotValid = claimsAreValid(token, "my_other_room");
    expect(gotValid).toBe(false);
  });
});
