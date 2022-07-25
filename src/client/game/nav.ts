import { Team } from "../../shared/types";

const endTurnBtns: { [key in Team]?: HTMLButtonElement } = {
  team1: null,
  team2: null,
};

export function registerCamBtnListener(f: () => void) {
  const toggleCamBtn = document.getElementById("toggleCam");
  toggleCamBtn.onclick = () => {
    f();
  };
}

export function registerMicBtnListener(f: () => void) {
  const toggleMicBtn = document.getElementById("toggleMic");
  toggleMicBtn.onclick = () => {
    f();
  };
}

export function updateCamBtnState(isOn: boolean) {
  const btn = document.getElementById("toggleCam");
  if (isOn) {
    btn.classList.remove("cam-off");
    btn.classList.add("cam-on");
  } else {
    btn.classList.remove("cam-on");
    btn.classList.add("cam-off");
  }
}

export function updateMicBtnState(isOn: boolean) {
  const btn = document.getElementById("toggleMic");
  if (isOn) {
    btn.classList.remove("mic-off");
    btn.classList.add("mic-on");
  } else {
    btn.classList.remove("mic-on");
    btn.classList.add("mic-off");
  }
}

export function registerLeaveBtnListener(f: () => void) {
  const leaveBtn = document.getElementById("leave");
  leaveBtn.onclick = () => {
    f();
  };
}

export function registerInviteBtnListener(f: () => void) {
  const toggleMicBtn = document.getElementById("invite");
  toggleMicBtn.onclick = () => {
    f();
  };
}

export function registerEndTurnBtnListener(team: Team, f: () => void) {
  // If this is the first time we're doing this, we may
  // need to retrieve the buttons for the first time
  if (!endTurnBtns[team]) {
    setEndTurnBtn(team);
  }
  endTurnBtns[team].onclick = () => {
    f();
  };
}

export function registerJoinBtnListener(team: Team, f: () => void) {
  const teamDiv = document.getElementById(team);
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("join")[0];
  btn.onclick = () => {
    f();
  };
  showBtn(btn);
}

export function registerBeSpymasterBtnListener(team: Team, f: () => void) {
  const teamDiv = document.getElementById(team);
  const btn = <HTMLButtonElement>(
    teamDiv.getElementsByClassName("beSpymaster")[0]
  );
  btn.onclick = () => {
    f();
  };
  showBtn(btn);
}

export function hideAllJoinBtns() {
  hideJoinBtn(Team.Team1);
  hideJoinBtn(Team.Team2);
  hideAllSpymasterBtns();
}

export function showAllJoinBtns() {
  showJoinBtn(Team.Team1);
  showJoinBtn(Team.Team2);
  showSpymasterBtn(Team.Team1);
  showSpymasterBtn(Team.Team2);
}

export function hideAllSpymasterBtns() {
  hideSpymasterBtn(Team.Team1);
  hideSpymasterBtn(Team.Team2);
}

export function hideSpymasterBtn(team: Team) {
  const teamDiv = <HTMLDivElement>document.getElementById(team);
  const btn = <HTMLButtonElement>(
    teamDiv.getElementsByClassName("beSpymaster")[0]
  );
  btn.classList.add("invisible");
  btn.disabled = true;
}

export function showSpymasterBtn(team: Team) {
  if (team || team === Team.None) return;
  const teamDiv = <HTMLDivElement>document.getElementById(team);
  const btn = <HTMLButtonElement>(
    teamDiv.getElementsByClassName("beSpymaster")[0]
  );
  btn.classList.remove("invisible");
  btn.disabled = false;
}

export function hideJoinBtn(team: Team) {
  const teamDiv = <HTMLDivElement>document.getElementById(team);
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("join")[0];
  btn.classList.add("invisible");
  btn.disabled = true;
}

export function showJoinBtn(team: Team) {
  if (!team || team === Team.None) return;

  const teamDiv = <HTMLDivElement>document.getElementById(team);
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("join")[0];
  btn.classList.remove("invisible");
  btn.disabled = false;
}

function showBtn(btn: HTMLButtonElement) {
  const ele = btn;
  ele.classList.remove("invisible");
  ele.disabled = false;
}

export function hideEndTurnButtons() {
  endTurnBtns[Team.Team1]?.classList.add("invisible");
  endTurnBtns[Team.Team2]?.classList.add("invisible");
}

export function toggleEndTurnButton(activeTeam: Team, playerTeam: Team) {
  // No team to toggle to, erroneous call
  if (!activeTeam || activeTeam === Team.None) return;

  // If the player is an observer, nothing to do
  if (!playerTeam || playerTeam === Team.None) return;
  // If this is the first time we're doing this, we may
  // need to retrieve the buttons for the first time
  if (!endTurnBtns[Team.Team1]) setEndTurnBtn(Team.Team1);
  if (!endTurnBtns[Team.Team2]) setEndTurnBtn(Team.Team2);

  if (activeTeam === playerTeam) {
    endTurnBtns[activeTeam].classList.remove("invisible");
  } else {
    endTurnBtns[playerTeam].classList.add("invisible");
    endTurnBtns[activeTeam].classList.add("invisible");
  }
}

function setEndTurnBtn(team: Team) {
  const teamDiv = document.getElementById(team);
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("endTurn")[0];
  endTurnBtns[team] = btn;
}
