import { Word, WordKind } from "../../../shared/word";
import { Game } from "../../game";
import Memory from "../memory";
import { PlayerInfo } from "../store";

describe("Memory storage tests", () => {
  test("store game", async () => {
    const m = new Memory();
    const simpleGame = new Game("game-name", "room-url", "room-name", []);
    await m.storeGame(simpleGame);

    // Retrieve game
    const gotGame = await m.getGame(simpleGame.id);
    expect(gotGame.id).toBe(simpleGame.id);
    expect(gotGame.currentTurn).toBe(simpleGame.currentTurn);
    expect(gotGame.dailyRoomName).toBe(simpleGame.dailyRoomName);
    expect(gotGame.wordSet).toEqual(simpleGame.wordSet);
  });

  test("store, retrieve, and update game", async () => {
    const m = new Memory();
    const simpleGame = new Game("game-name", "room-url", "room-name", []);
    await m.storeGame(simpleGame);

    // Retrieve game
    const gotGame = await m.getGame(simpleGame.id);

    gotGame.wordSet.push(new Word("some-word", WordKind.Neutral));

    // Retrieving again should not contain the new word
    let gotGameAgain = await m.getGame(simpleGame.id);
    expect(gotGameAgain.wordSet.length).toBe(0);

    // Now, store the update:
    m.storeGame(gotGame);

    // And retrieve again
    gotGameAgain = await m.getGame(simpleGame.id);
    expect(gotGameAgain.wordSet).toEqual(gotGame.wordSet);
  });

  test("store, retrieve, remove player", async () => {
    const m = new Memory();
    const socketID = "test-socket";

    const pi = <PlayerInfo>{
      playerID: "test-player",
      gameID: "test-game",
    };
    m.storeSocketMapping(socketID, pi);

    let gotPlayerInfo = await m.getSocketMapping(socketID);
    expect(gotPlayerInfo).toStrictEqual(pi);

    m.deleteSocketMapping(socketID);

    gotPlayerInfo = await m.getSocketMapping(socketID);
    expect(gotPlayerInfo).toBeFalsy();
  });
});
