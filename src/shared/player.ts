import { Team } from "./types";

export default class Player {
  id: string;

  team: Team = Team.None;

  isSpymaster: boolean = false;

  constructor(id: string, team: Team) {
    this.id = id;
    this.team = team;
  }
}
