import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { createSecureServer } from "http2";

import { dirname, basename, join } from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import {
  GameData,
  gameDataDumpEventName,
  JoinedTeamData,
  joinedTeamEventName,
  JoinGameData,
  joinGameEventName,
  JoinTeamData,
  joinTeamEventName,
} from "../shared/events";
import {
  ICreateGameRequest,
  ICreateGameResponse,
  IJoinGameRequest,
  IJoinGameResponse,
} from "../shared/types";
import { GameOrchestrator } from "./orchestrator";

var app = express();
const port = 3000;
const orchestrator = new GameOrchestrator();

const clientPath = getClientPath();

app.use("/", express.static(clientPath));

app.use(express.json());

app.post("/join", function (req: Request, res: Response) {
  console.log("attempting game join", req.body);
  const body = <IJoinGameRequest>req.body;
  const gameID = body.gameID;
  console.log("game iD:", gameID);
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
  console.log("found game:", game);
  const data = <IJoinGameResponse>{
    roomURL: game.dailyRoomURL,
    gameName: game.name,
    wordSet: game.wordSet,
  };
  res.send(data);
});

app.post("/create", function (req: Request, res: Response) {
  console.log("/create");
  const body = <ICreateGameRequest>req.body;
  console.log("/create body:", body, req.body);
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
  console.log("a user connected");
  socket.on(joinGameEventName, function (data: JoinGameData) {
    console.log("socket joined room name: ", data.gameID);
    socket.join(data.gameID);
    // Send game data back:
    const game = orchestrator.getGame(data.gameID);
    const gameDataDump = <GameData>{
      gameID: data.gameID,
      players: game.players,
    };
    socket.to(data.socketID).emit(gameDataDumpEventName, gameDataDump);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on(joinTeamEventName, (data: JoinTeamData) => {
    console.log("joining team");
    const game = orchestrator.getGame(data.gameID);
    if (!game) {
      socket
        .to(data.socketID)
        .emit("error", new Error(`failed to find game by id ${data.gameID}`));
      return;
    }
    try {
      game.addPlayer(data.sessionID, data.teamID);
      const joinedData = <JoinedTeamData>{
        sessionID: data.sessionID,
        teamID: data.teamID,
      };
      console.log("emitting to room:", data.gameID);
      // using "io" here to emit to the whole room including the sender
      io.to(data.gameID).emit(joinedTeamEventName, joinedData);
    } catch (e) {
      console.error(e);
      socket.to(data.socketID).emit("error", e);
    }
  });
  socket.on("hello", () => {
    console.log("hi!");
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});

function getClientPath(): string {
  const basePath = dirname(__dirname);
  const clientPath = join(basePath, "client");
  return clientPath;
}
