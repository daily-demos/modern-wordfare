import express, { Express, Request, Response } from "express";
import { Server } from "socket.io";

import { dirname, basename, join } from "path";
import { fileURLToPath } from "url";
import { ICreateGameRequest, ICreateGameResponse } from "../shared/types";
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

app.post("/create", function (req: Request, res: Response) {
  console.log("/create");
  const body = <ICreateGameRequest>req.body;
  console.log("/create body:", body, req.body);
  orchestrator
    .createGame(body.gameName)
    .then((url) => {
      console.log("/create got url:", url);
      const data = <ICreateGameResponse>{
        roomUrl: url,
      };
      console.log("sending back data:", data);
      res.send(data);
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
