import express, { Express, Request, Response } from "express";
import { Server } from "socket.io";

import { dirname, basename, join } from "path";
import { fileURLToPath } from "url";
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

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>();

const clientPath = getClientPath();

app.use("/", express.static(clientPath));

app.use(express.json());

app.post("/join", function (req: Request, res: Response) {
  console.log("attempting game join", req.body);
  const body = <IJoinGameRequest>req.body;
  const gameID = body.gameID
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
  console.log("found game:", game)
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

function getClientPath(): string {
  const basePath = dirname(__dirname);
  const clientPath = join(basePath, "client");
  return clientPath;
}
