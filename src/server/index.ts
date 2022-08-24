import express, { Request, Response } from "express";
import { createServer } from "http";

import { dirname, join } from "path";
import { Server } from "socket.io";

import {
  BecomeSpymasterData,
  becomeSpymasterEventName,
  GameData,
  gameDataDumpEventName,
  JoinedTeamData,
  joinedTeamEventName,
  JoinGameData,
  joinGameEventName,
  JoinTeamData,
  joinTeamEventName,
  newSpymasterEventName,
  TurnData,
  nextTurnEventName,
  SpymasterData,
  errorEventName,
  wordSelectedEventName,
  SelectedWordData,
  turnResultEventName,
  endTurnEventName,
  EndTurnData,
  restartGameEventName,
  RestartGameData,
  gameRestartedEventName,
  GameRestartedData,
  playerLeftGameEventName,
  PlayerLeftData,
} from "../shared/events";
import {
  CreateGameRequest,
  JoinGameRequest,
  JoinGameResponse,
  Team,
} from "../shared/types";
import GameOrchestrator from "./orchestrator";
import { DAILY_API_KEY, PORT } from "./env";
import Memory from "./store/memory";
import GameNotFound from "../shared/errors/gameNotFound";
import { getMeetingToken } from "./daily";
import { isValidName, isValidWord } from "../shared/input";
import InvalidName from "../shared/errors/invalidName";
import InvalidWord from "../shared/errors/invalidWord";
import {
  getGameHostCookie,
  getGameHostCookieName,
  isGameHostFromSignedCookies,
  setupCookieParser,
} from "./cookie";

// Fail early if the server is not appropriately configured.
if (!DAILY_API_KEY) {
  throw new Error(
    "failed to start server: Daily API key missing from configuration. Please check your .env file."
  );
}

startServer();

function startServer() {
  const app = express();
  const orchestrator = new GameOrchestrator(new Memory());
  const port = PORT || 3001;

  function getClientPath(): string {
    const basePath = dirname(__dirname);
    return join(basePath, "client");
  }

  const clientPath = getClientPath();

  setupCookieParser(app);
  app.use(express.static(clientPath));
  app.use("/client", express.static(clientPath));

  app.use(express.json());

  // /join endpoint handles joining the game
  app.post("/join", (req: Request, res: Response) => {
    const body = <JoinGameRequest>req.body;
    const { gameID } = body;
    if (!gameID) {
      const err = "request must contain game ID";
      console.error(err);
      res.status(400).send(`{"error":"${err}}`);
      return;
    }
    orchestrator.getGame(gameID).then((game) => {
      if (!game) {
        const err = new GameNotFound(gameID);
        console.error(err);
        res.status(404).send(`{"error":"${err}}`);
        return;
      }
      const isHost = isGameHostFromSignedCookies(
        req.signedCookies,
        game.id,
        game.createdAt
      );
      if (!isHost) {
        const data = <JoinGameResponse>{
          roomURL: game.dailyRoomURL,
          gameName: game.name,
          wordSet: game.wordSet,
        };
        res.send(data);
        return;
      }
      getMeetingToken(game.dailyRoomName)
        .then((token) => {
          const data = <JoinGameResponse>{
            roomURL: game.dailyRoomURL,
            gameName: game.name,
            wordSet: game.wordSet,
            meetingToken: token,
          };
          res.send(data);
        })
        .catch((error) => {
          console.error("failed to get meeting token", error);
          res.sendStatus(500);
        });
    });
  });

  // /create endpoint handles creating a game
  app.post("/create", (req: Request, res: Response) => {
    const body = <CreateGameRequest>req.body;
    const { wordSet, gameName, playerName } = body;
    if (!wordSet) {
      const err = "word set must be defined";
      res.status(400).send(`{"error":"${err}"}`);
      return;
    }
    for (let i = 0; i < wordSet.length; i += 1) {
      const word = wordSet[i];
      const val = word.value;
      if (!isValidWord(val)) {
        const err = new InvalidWord(val);
        res.status(400).send(`{"error":"${err}"}`);
        return;
      }
    }
    if (!gameName || !isValidName(gameName)) {
      const err = new InvalidName(gameName);
      res.status(400).send(`{"error":"${err}"}`);
      return;
    }
    if (!playerName || !isValidName(playerName)) {
      const err = new InvalidName(playerName);
      res.status(400).send(`{"error":"${err}"}`);
      return;
    }

    orchestrator
      .createGame(gameName, wordSet)
      .then((game) => {
        // Set meeting token for this game as a session cookie
        res.cookie(getGameHostCookieName(game.id), Date.now(), {
          secure: true,
          sameSite: "strict",
          httpOnly: true,
          signed: true,
        });
        res.redirect(`/?gameID=${game.id}&playerName=${playerName}`);
      })
      .catch((error) => {
        console.error("failed to create room:", error);
        res.sendStatus(500);
      });
  });

  const server = createServer(app);

  const io = new Server(server);

  // Listen for new connections
  io.on("connection", (socket) => {
    console.log("user connected", socket.id);

    // Handle socket asking to join a game
    socket.on(joinGameEventName, (data: JoinGameData) => {
      socket.join(data.gameID);
      // Send game data dump back to the socket
      orchestrator
        .getGame(data.gameID)
        .then((game) => {
          const gameDataDump = <GameData>{
            gameID: game.id,
            players: game.players,
            currentTurn: game.currentTurn,
            revealedWordVals: game.getRevealedWordVals(),
            scores: game.teamResults,
          };
          io.to(socket.id).emit(gameDataDumpEventName, gameDataDump);
        })
        .catch((e) => {
          console.error(e);
          io.to(socket.id).emit(errorEventName, e);
        });
    });

    // Handle client disconnecting
    socket.on("disconnect", async () => {
      console.log("user disconnected", socket.id);
      try {
        // Attempt to eject player from any game they
        // are currently in.
        const ejectedPlayerInfo = await orchestrator.ejectPlayer(socket.id);
        io.to(ejectedPlayerInfo.gameID).emit(playerLeftGameEventName, <
          PlayerLeftData
        >{
          playerID: ejectedPlayerInfo.playerID,
        });
      } catch (e) {
        // No point sending an error event back as the
        // client is gone, so we just log the error.
        console.error(e);
      }
    });

    // Handle player asking to restart game
    socket.on(restartGameEventName, (data: RestartGameData) => {
      console.log(`Got restart request for game ID ${data.gameID}`);
      const cookies = socket.handshake.headers.cookie;
      const gameHostCookie = getGameHostCookie(cookies, data.gameID);
      orchestrator
        .restartGame(socket.id, data.gameID, data.newWordSet, gameHostCookie)
        .then(() => {
          io.to(data.gameID).emit(gameRestartedEventName, <GameRestartedData>{
            newWordSet: data.newWordSet,
          });
        })
        .catch((e) => {
          console.error(
            `failed to restart game ${data.gameID}: ${e.toString()}`
          );
          socket.to(socket.id).emit(errorEventName, e);
        });
    });

    // Handle player asking to join a team
    socket.on(joinTeamEventName, (data: JoinTeamData) => {
      orchestrator
        .joinGame(data.gameID, data.sessionID, data.teamID, socket.id)
        .then((game) => {
          const joinedData = <JoinedTeamData>{
            sessionID: data.sessionID,
            teamID: data.teamID,
            currentTurn: game.currentTurn,
          };
          // using "io" here to emit to the whole room including the sender
          io.to(data.gameID).emit(joinedTeamEventName, joinedData);
        })
        .catch((e) => {
          console.error(e);
          socket.to(socket.id).emit(errorEventName, e);
        });
    });

    // Handle player asking to become spymaster
    socket.on(becomeSpymasterEventName, async (data: BecomeSpymasterData) => {
      orchestrator
        .setGameSpymaster(data.gameID, data.sessionID, data.team, socket.id)
        .then((res) => {
          // Send spymaster data back to the whole game
          const spymasterData = <SpymasterData>{
            spymasterID: data.sessionID,
            teamID: res.spymaster.team,
          };
          io.to(data.gameID).emit(newSpymasterEventName, spymasterData);
          // If a turn has started, send next turn event to whole game
          if (res.currentTurn !== Team.None) {
            const turnData = <TurnData>{
              currentTurn: res.currentTurn,
            };
            io.to(data.gameID).emit(nextTurnEventName, turnData);
          }
        })
        .catch((e) => {
          io.to(socket.id).emit(errorEventName, e);
        });
    });

    // Handle player asking to end their turn
    socket.on(endTurnEventName, async (data: EndTurnData) => {
      orchestrator
        .toggleGameTurn(data.gameID)
        .then((currentTurn) => {
          io.to(data.gameID).emit(nextTurnEventName, <TurnData>{
            currentTurn,
          });
        })
        .catch((e) => {
          io.to(socket.id).emit(errorEventName, e);
        });
    });

    // Handle player trying to select a word
    socket.on(wordSelectedEventName, async (data: SelectedWordData) => {
      orchestrator
        .selectGameWord(data.gameID, data.wordValue, data.playerID)
        .then((turnRes) => {
          // Send turn result back to everyone in the game
          io.to(data.gameID).emit(turnResultEventName, turnRes);
          // If the turn has toggled to the next team, send
          // a next turn event to everyone in the game.
          if (turnRes.newCurrentTurn !== Team.None) {
            const turnData = <TurnData>{
              currentTurn: turnRes.newCurrentTurn,
            };
            io.to(data.gameID).emit(nextTurnEventName, turnData);
          }
        })
        .catch((e) => {
          io.to(socket.id).emit(errorEventName, e);
        });
    });
  });

  server.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}
