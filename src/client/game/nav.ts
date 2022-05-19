import { Team } from "../../shared/types";

export function registerCamBtnListener(f: () => void) {
  const toggleCamBtn = document.getElementById("toggleCam");
  toggleCamBtn.addEventListener("click", f);
}

export function registerMicBtnListener(f: () => void) {
  const toggleMicBtn = document.getElementById("toggleMic");
  toggleMicBtn.addEventListener("click", f);
}

export function registerLeaveBtnListener(f: () => void) {
  const leaveBtn = document.getElementById("leave");
  leaveBtn.addEventListener("click", f);
}

export function registerInviteBtnListener(f: () => void) {
  const toggleMicBtn = document.getElementById("invite");
  toggleMicBtn.addEventListener("click", f);
}

export function registerEndTurnBtnListener(f: () => void) {
  const endTurnBtn = document.getElementById("endTurn");
  endTurnBtn.addEventListener("click", f);
}

export function registerBeSpymasterBtnListener(f: () => void) {
  const btn = <HTMLButtonElement>document.getElementById("beSpymaster");
  btn.addEventListener("click", f);
  showBtn(btn);
}

export function hideAllJoinBtns() {
  hideJoinBtn(Team.Team1);
  hideJoinBtn(Team.Team2);
}
export function hideAllSpymasterBtns() {
  hideSpymasterBtn(Team.Team1);
  hideSpymasterBtn(Team.Team2);
}


export function hideSpymasterBtn(team: Team) {
  const teamDiv = <HTMLDivElement>document.getElementById(team.toString());
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("beSpymaster")[0];
  btn.classList.add("invisible");
  btn.disabled = true;
 
}

function hideJoinBtn(team: Team) {
  const teamDiv = <HTMLDivElement>document.getElementById(team.toString());
  const btn = <HTMLButtonElement>teamDiv.getElementsByClassName("join")[0];
  btn.classList.add("invisible");
  btn.disabled = true;
}

function showBtn(btn: HTMLButtonElement) {
  btn.classList.remove("invisible");
}
