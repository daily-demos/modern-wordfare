import { wordsPerTeam } from "../../client/config";
import InvalidTurn from "../../shared/errors/invalidTurn";
import SpymasterExists from "../../shared/errors/spymasterExists";
import Player from "../../shared/player";
import { Team } from "../../shared/types";
import { Word, WordKind } from "../../shared/word";
import { Game } from "../game";

describe("Spymaster tests", () => {
  test("Basic spymaster readiness", () => {
    const game = new Game("test game", "test url", "test room", []);

    expect(game.spymastersReady()).toBe(false);
    game.addPlayer("team1", Team.Team1);
    game.addPlayer("team2", Team.Team2);

    game.setSpymaster("team1", Team.Team1);
    expect(game.spymastersReady()).toBe(false);
    game.setSpymaster("team2", Team.Team2);
    expect(game.spymastersReady()).toBe(true);
  });

  test("Duplicate spymaster", () => {
    const game = new Game("test game", "test url", "test room", []);

    game.addPlayer("player1", Team.Team1);
    game.addPlayer("player2", Team.Team1);

    game.setSpymaster("player1", Team.Team1);
    expect(() => {
      game.setSpymaster("player2", Team.Team1);
    }).toThrowError(SpymasterExists);
  });

  test("Player switches to other team spymaster", () => {
    const game = new Game("test game", "test url", "test room", []);

    const pid = "player1";

    game.addPlayer(pid, Team.Team1);
    game.setSpymaster(pid, Team.Team2);

    let player: Player;
    for (let i = 0; i < game.players.length; i += 1) {
      const p = game.players[i];
      if (p.id === pid) {
        player = p;
      }
    }
    expect(player.isSpymaster).toBe(true);
    const spymasters = game["spymasters"]
    expect(spymasters.team2).toBe(pid);
    expect(spymasters.team1).toBeFalsy();
  });

  test("Spymaster becomes other team's spymaster", () => {
    const game = new Game("test game", "test url", "test room", []);

    const pid = "player1";

    game.setSpymaster(pid, Team.Team1);

    let spymasters = game["spymasters"]
    expect(spymasters.team1).toBe(pid);
    expect(spymasters.team2).toBeFalsy();

    game.setSpymaster(pid, Team.Team2);
    spymasters = game["spymasters"];
    expect(spymasters.team2).toBe(pid);
    expect(spymasters.team1).toBeFalsy();
  });

  test("Spymaster leaves the game", () => {
    const game = new Game("test game", "test url", "test room", []);
    const pid = "player1";
    game.addPlayer(pid, Team.Team1);
    game.setSpymaster(pid, Team.Team1);

    expect(game["spymasters"].team1).toBe(pid);
    game.removePlayer(pid);
    expect(game["spymasters"].team2).toBeNull();
  });
});

describe("Turn tests", () => {
  test("Select all words correctly", () => {
    const words = getTestWordSet();
    const game = new Game("test game", "test url", "test room", words);
    game.currentTurn = Team.Team1;
    // Add a couple of test players
    game.addPlayer("player1", Team.Team1);
    game.addPlayer("player2", Team.Team2);

    // You should be able to select all of a team's words without having to end the turn
    for (let i = 0; i < wordsPerTeam; i += 1) {
      const val = `${i}-team1`;
      game.selectWord(val, "player1");
      expect(game.currentTurn).toBe(Team.Team1);
    }
    expect(game.currentTurn).toBe(Team.Team1);
  });

  test("Turn toggled by selection", () => {
    const words = getTestWordSet();
    const game = new Game("test game", "test url", "test room", words);
    game.currentTurn = Team.Team1;
    // Add a couple of test players
    game.addPlayer("player1", Team.Team1);
    game.addPlayer("player2", Team.Team2);

    game.selectWord("1-team2", "player1");
    // Expect turn to toggle over
    expect(game.currentTurn).toBe(Team.Team2);
    game.selectWord("2-team2", "player2");
    expect(game.currentTurn).toBe(Team.Team2);
    game.selectWord("1-team1", "player2");
    expect(game.currentTurn).toBe(Team.Team1);
  });

  test("Invalid turn", () => {
    const words = getTestWordSet();
    const game = new Game("test game", "test url", "test room", words);
    game.currentTurn = Team.Team1;
    // Add a couple of test players
    game.addPlayer("player1", Team.Team1);
    game.addPlayer("player2", Team.Team2);

    expect(() => {
      game.selectWord("1-team2", "player2");
    }).toThrowError(InvalidTurn);
  });
});

function getTestWordSet(): Word[] {
  const words = [];

  // Team 1
  for (let i = 0; i < wordsPerTeam; i += 1) {
    const nw = new Word(`${i}-team1`, WordKind.Team1);
    words.push(nw);
  }
  // Team 2
  for (let i = 0; i < wordsPerTeam; i += 1) {
    const nw = new Word(`${i}-team2`, WordKind.Team2);
    words.push(nw);
  }
  // Assassin
  const aw = new Word("assassin", WordKind.Assassin);
  words.push(aw);

  // Neutral
  for (let i = 0; i < wordsPerTeam; i += 1) {
    const nw = new Word(`${i}-neutral`, WordKind.Neutral);
    words.push(nw);
  }
  return words;
}
