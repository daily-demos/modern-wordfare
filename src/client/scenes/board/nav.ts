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
  const endTurnBtn = document.getElementById("end-turn");
  endTurnBtn.addEventListener("click", f);
}
