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

export function hideSpymasterBtn() {
  const btn = document.getElementById("beSpymaster");
  btn.classList.add("invisible");
}

function showBtn(btn: HTMLButtonElement) {
  btn.classList.remove("invisible");
}
