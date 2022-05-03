import express, { Request, Response } from "express";
import { createServer } from "http";

import { dirname, join } from "path";
import { Server } from "socket.io";
import GameNotFound from "../shared/errors/gameNotFound";
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
} from "../shared/events";
import {
  ICreateGameRequest,
  ICreateGameResponse,
  IJoinGameRequest,
  IJoinGameResponse,
} from "../shared/types";
import GameOrchestrator from "./orchestrator";

const app = express();
const port = 3000;
const orchestrator = new GameOrchestrator();

function getClientPath(): string {
  const basePath = dirname(__dirname);
  return join(basePath, "client");
}

const clientPath = getClientPath();

app.use("/", express.static(clientPath));

app.use(express.json());

app.post("/join", (req: Request, res: Response) => {
  const body = <IJoinGameRequest>req.body;
  const { gameID } = body;
  if (!gameID) {
    const err = "request must contain game ID";
    console.error(err);
    res.status(400).send(`{"error":"${err}}`);
    return;
  }
  const game = orchestrator.getGame(gameID);
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
  if (!body.wordSet) {
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
    .createGame(body.gameName, body.wordSet)
    .then((game) => {
      orchestrator
        .getMeetingToken(game.dailyRoomName)
        .then((token) => {
          const data = <ICreateGameResponse>{
            roomURL: game.dailyRoomURL,
            meetingToken: token,
            gameID: game.id,
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
    const game = orchestrator.getGame(data.gameID);
    const gameDataDump = <GameData>{
      gameID: data.gameID,
      players: game.players,
      currentTurn: game.currentTurn,
      revealedWordVals: game.getRevealedWordVals(),
      scores: game.teamResults,
    };
    console.log("sending data dump", socket.id, gameDataDump);
    io.to(socket.id).emit(gameDataDumpEventName, gameDataDump);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    try {
      orchestrator.ejectPlayer(socket.id);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on(leaveGameEventName, () => {
    try {
      orchestrator.ejectPlayer(socket.id);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on(joinTeamEventName, (data: JoinTeamData) => {
    console.log("joining team", socket.id);
    try {
      const game = orchestrator.joinGame(
        data.gameID,
        data.sessionID,
        data.teamID,
        socket.id
      );
      const joinedData = <JoinedTeamData>{
        sessionID: data.sessionID,
        teamID: data.teamID,
        currentTurn: game.currentTurn,
      };
      // using "io" here to emit to the whole room including the sender
      io.to(data.gameID).emit(joinedTeamEventName, joinedData);
    } catch (e) {
      console.error(e);
      socket.to(socket.id).emit(errorEventName, e);
    }
  });
  socket.on(becomeSpymasterEventName, (data: BecomeSpymasterData) => {
    const game = orchestrator.getGame(data.gameID);
    if (!game) {
      io.to(socket.id).emit(errorEventName, new GameNotFound(data.gameID));
      return;
    }
    try {
      const spymaster = game.setSpymaster(data.sessionID);
      const spymasterData = <SpymasterData>{
        spymasterID: data.sessionID,
        teamID: spymaster.team,
      };
      io.to(data.gameID).emit(newSpymasterEventName, spymasterData);
      if (game.spymastersReady()) {
        game.nextTurn();
        const turnData = <TurnData>{
          currentTurn: game.currentTurn,
        };
        io.to(data.gameID).emit(nextTurnEventName, turnData);
      }
    } catch (e) {
      io.to(socket.id).emit(errorEventName, <Error>e);
    }
  });

  socket.on(endTurnEventName, (data: EndTurnData) => {
    const game = orchestrator.getGame(data.gameID);
    if (!game) {
      io.to(socket.id).emit(errorEventName, new GameNotFound(data.gameID));
      return;
    }
    game.nextTurn();
    io.to(data.gameID).emit(nextTurnEventName, <TurnData>{
      currentTurn: game.currentTurn,
    });
  });

  socket.on(wordSelectedEventName, (data: SelectedWordData) => {
    // TODO: use socket ID to map request to a game and player
    // on second thought maybe not..socket ID will change in case
    // of connection interrupt and we don't want to rely on that.

    const game = orchestrator.getGame(data.gameID);
    if (!game) {
      io.to(socket.id).emit(errorEventName, new GameNotFound(data.gameID));
      return;
    }
    try {
      const oldTurn = game.currentTurn;
      const res = game.selectWord(data.wordValue, data.playerID);
      io.to(data.gameID).emit(turnResultEventName, res);

      const newTurn = game.currentTurn;
      if (oldTurn !== newTurn) {
        const turnData = <TurnData>{
          currentTurn: newTurn,
        };
        io.to(data.gameID).emit(nextTurnEventName, turnData);
      }
    } catch (e) {
      io.to(socket.id).emit(errorEventName, e);
    }
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
