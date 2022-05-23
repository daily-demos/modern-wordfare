import { Team } from "../../shared/types";

let endTurnBtn: HTMLButtonElement = null;

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
    btn.classList.remove("cam-off")
    btn.classList.add("cam-on");
  } else {
    btn.classList.remove("cam-on");
    btn.classList.add("cam-off");
  }
}

export function updateMicBtnState(isOn: boolean) {
  const btn = document.getElementById("toggleMic");
  if (isOn) {
    btn.classList.remove("mic-off")
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
  if (!endTurnBtn) {
    setEndTurnBtn(team);
  }
  endTurnBtn.onclick = () => {
    f();
  };
}

export function registerJoinBtnListener(team: Team, f: () => void) {
  console.log("registering join btn listener");
  const teamDiv = document.getElementById(team);
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("join")[0];
  btn.onclick = () => {
    f();
  };
  showBtn(btn);
}

export function registerBeSpymasterBtnListener(team: Team, f: () => void) {
  console.log("registering spymaster btn listener");

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
  console.log("hiding spymaster btn", team);
  const teamDiv = <HTMLDivElement>document.getElementById(team);
  const btn = <HTMLButtonElement>(
    teamDiv.getElementsByClassName("beSpymaster")[0]
  );
  btn.classList.add("invisible");
  btn.disabled = true;
}

export function showSpymasterBtn(team: Team) {
  if (team || team === Team.None) return;
  console.log("showing spymaster btn");
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
  btn.classList.remove("invisible");
  btn.disabled = false;
}

export function hideEndTurnButtons() {
  if (endTurnBtn) {
    endTurnBtn.classList.add("invisible");
  }
}

export function toggleEndTurnButton(activeTeam: Team, playerTeam: Team) {
  // No team to toggle to, erroneous call
  if (activeTeam || activeTeam === Team.None) return;
  console.log("toggling end turn button", activeTeam, playerTeam);

  // If the player is an observer, nothing to do
  if (!playerTeam || playerTeam === Team.None) return;
  // If this is the first time we're doing this, we may
  // need to retrieve the buttons for the first time
  if (!endTurnBtn) {
    setEndTurnBtn(playerTeam);
  }
  if (activeTeam === playerTeam) {
    endTurnBtn.classList.remove("invisible");
    return;
  }
  endTurnBtn.classList.add("invisible");
}

function setEndTurnBtn(team: Team) {
  const teamDiv = document.getElementById(team);
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("endTurn")[0];
  endTurnBtn = btn;
}
