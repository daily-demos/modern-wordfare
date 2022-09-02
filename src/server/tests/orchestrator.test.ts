import GameNotFound from "../../shared/errors/gameNotFound";
import { Team } from "../../shared/types";
import { Word, WordKind } from "../../shared/word";
import { Game } from "../game";
import GameOrchestrator from "../orchestrator";
import Memory from "../store/memory";
import { PlayerInfo } from "../store/store";

describe("Orchestrator game join and leave tests", () => {
  test("Join a game that does not exist", async () => {
    const o = new GameOrchestrator(new Memory());

    await expect(
      o.joinGame("gameID", "playerID", Team.Team1, "socketID")
    ).rejects.toThrow(GameNotFound);
  });

  test("Successfully join and leave a game", async () => {
    const memstore = new Memory();

    const dailyRoomName = "uniqueRoomName";
    const game = new Game("game name", "testURL", dailyRoomName, [
      new Word("word-one", WordKind.Neutral),
      new Word("word-two", WordKind.Neutral),
    ]);
    memstore.storeGame(game);

    const o = new GameOrchestrator(memstore);

    const playerID = "my-player";
    const socketID = "my-socket";
    const wantPlayerInfo = <PlayerInfo>{
      playerID,
      gameID: game.id,
    };

    // Test
    const team = Team.Team1;
    const gotGame = await o.joinGame(game.id, playerID, team, socketID);

    // Find test player in game
    let foundPlayer = false;
    for (let i = 0; i < gotGame.players.length; i += 1) {
      const p = gotGame.players[i];
      if (p.id === playerID) {
        expect(p.team).toStrictEqual(team);
        foundPlayer = true;
        break;
      }
    }
    expect(foundPlayer).toBe(true);

    const gotEjectedPlayerInfo = await o.ejectPlayer(socketID);
    expect(gotEjectedPlayerInfo).toStrictEqual(wantPlayerInfo);
  });
});
