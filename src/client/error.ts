export default function showError(msg: string) {
  const errorDiv = document.getElementById("error");
  errorDiv.innerText = msg;
}
