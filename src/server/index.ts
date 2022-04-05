import express, { Express, Request, Response } from "express";
import { Server } from "socket.io";

import { dirname, basename, join } from "path";
import { fileURLToPath } from "url";

var app = express();
const port = 3000;

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

enum GameState {
  Unknown = 0,
  Lobby,
  Playing,
  Ended,
}
class Game {
  name: string;
  dailyRoomUrl: string;
  hasStarted: GameState;
}

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>();

const clientPath = getClientPath();

app.use("/", express.static(clientPath));
//app.use("/assets", express.static(clientPath + "/assets"));

/* app.use("/js", express.static(clientPath + "/js"));
app.use("/assets", express.static(clientPath + "/assets"));

app.get("/", function (req: Request, res: Response) {
  console.log("clientpath", clientPath);
  res.sendFile(clientPath + "/index.html");
}); */

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

function getClientPath(): string {
  //  const __dirname = dirname(fileURLToPath(import.meta.url));
  const basePath = dirname(__dirname);
  const clientPath = join(basePath, "client");
  return clientPath;
}
