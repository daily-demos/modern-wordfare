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
  leaveGameEventName,
  endTurnEventName,
  EndTurnData,
  restartGameEventName,
  RestartGameData,
  gameRestartedEventName,
  GameRestartedData,
  playerLeftgameEventName,
  PlayerLeftData,
} from "../shared/events";
import {
  ICreateGameRequest,
  ICreateGameResponse,
  IJoinGameRequest,
  IJoinGameResponse,
  Team,
} from "../shared/types";
import GameOrchestrator from "./orchestrator";
import { PORT } from "./env";
import Memory from "./store/memory";

const app = express();
const orchestrator = new GameOrchestrator(new Memory());
const port = PORT || 3000;

function getClientPath(): string {
  const basePath = dirname(__dirname);
  return join(basePath, "client");
}

const clientPath = getClientPath();

app.use("/", express.static(clientPath));

app.use(express.json());

app.post("/join", async (req: Request, res: Response) => {
  const body = <IJoinGameRequest>req.body;
  const { gameID } = body;
  if (!gameID) {
    const err = "request must contain game ID";
    console.error(err);
    res.status(400).send(`{"error":"${err}}`);
    return;
  }
  const game = await orchestrator.getGame(gameID);
  if (!game) {
    const err = `game id ${gameID} not found`;
    console.error(err);
    res.status(404).send(`{"error":"${err}}`);
    return;
  }
  const data = <IJoinGameResponse>{
    roomURL: game.dailyRoomURL,
    gameName: game.name,
    wordSet: game.wordSet,
  };
  res.send(data);
});

app.post("/create", (req: Request, res: Response) => {
  const body = <ICreateGameRequest>req.body;
  const { wordSet } = body;
  if (!wordSet) {
    const err = "word set must be defined";
    res.status(400).send(`{"error":"${err}}`);
    return;
  }
  if (!body.gameName) {
    const err = "game name must be defined";
    res.status(400).send(`{"error":"${err}}`);
    return;
  }
  orchestrator
    .createGame(body.gameName, wordSet)
    .then((game) => {
      orchestrator
        .getMeetingToken(game.dailyRoomName)
        .then((token) => {
          const data = <ICreateGameResponse>{
            roomURL: game.dailyRoomURL,
            meetingToken: token,
            gameID: game.id,
            wordSet: game.wordSet,
          };
          res.send(data);
        })
        .catch((error) => {
          console.error("failed to get meeting token", error);
          res.sendStatus(500);
        });
    })
    .catch((error) => {
      console.error("failed to create room:", error);
      res.sendStatus(500);
    });
});

const server = createServer(app);

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on(joinGameEventName, (data: JoinGameData) => {
    socket.join(data.gameID);
    // Send game data back:
    orchestrator
      .getGame(data.gameID)
      .then((game) => {
        const gameDataDump = <GameData>{
          gameID: data.gameID,
          players: game.players,
          currentTurn: game.currentTurn,
          revealedWordVals: game.getRevealedWordVals(),
          scores: game.teamResults,
        };
        console.log("sending data dump", socket.id, gameDataDump);
        io.to(socket.id).emit(gameDataDumpEventName, gameDataDump);
      })
      .catch((e) => {
        console.error(e);
        io.to(socket.id).emit(errorEventName, e);
      });
  });

  socket.on("disconnect", async () => {
    console.log("user disconnected");
    try {
      const ejectedPlayerInfo = await orchestrator.ejectPlayer(socket.id);
      io.to(ejectedPlayerInfo.gameID).emit(playerLeftgameEventName, <
        PlayerLeftData
      >{
        playerID: ejectedPlayerInfo.playerID,
      });
    } catch (e) {
      console.error(e);
    }
  });

  socket.on(leaveGameEventName, async () => {
    try {
      const ejectedPlayerInfo = await orchestrator.ejectPlayer(socket.id);
      io.to(ejectedPlayerInfo.gameID).emit(playerLeftgameEventName, <
        PlayerLeftData
      >{
        playerID: ejectedPlayerInfo.playerID,
      });
    } catch (e) {
      console.error(e);
    }
  });

  socket.on(restartGameEventName, async (data: RestartGameData) => {
    await orchestrator.restartGame(socket.id, data.gameID, data.newWordSet);
    io.to(data.gameID).emit(gameRestartedEventName, <GameRestartedData>{
      newWordSet: data.newWordSet,
    });
  });

  socket.on(joinTeamEventName, (data: JoinTeamData) => {
    console.log("joining team", socket.id);
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

  socket.on(becomeSpymasterEventName, async (data: BecomeSpymasterData) => {
    orchestrator
      .setGameSpymaster(data.gameID, data.sessionID)
      .then((res) => {
        const spymasterData = <SpymasterData>{
          spymasterID: data.sessionID,
          teamID: res.spymaster.team,
        };
        io.to(data.gameID).emit(newSpymasterEventName, spymasterData);
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

  socket.on(wordSelectedEventName, async (data: SelectedWordData) => {
    orchestrator
      .selectGameWord(data.gameID, data.wordValue, data.playerID)
      .then((turnRes) => {
        io.to(data.gameID).emit(turnResultEventName, turnRes);
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
