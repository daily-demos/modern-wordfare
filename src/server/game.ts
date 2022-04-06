enum GameState {
  Unknown = 0,
  Pending,
  Playing,
  Ended,
}

class Game {
  name: string;
  dailyRoomUrl: string;
  state: GameState;
}
