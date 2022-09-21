export default function showError(msg: string) {
  const errorDiv = document.getElementById("error");
  if (!errorDiv) return;
  errorDiv.innerText = msg;
}
