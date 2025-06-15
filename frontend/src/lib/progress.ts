export function toggleProgress(display: boolean) {
  const element = document.getElementById("progress");

  element!.style.display = display ? "block" : "none";
}
