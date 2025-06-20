export enum Progress {
  Idle,
  Receiving,
  Sending,
}

export function clearProgress() {}

export function setProgress(progress: Progress) {
  const element = document.getElementById("progress")!;
  const elementText = document.getElementById("progress__text")!;

  switch (progress) {
    case Progress.Idle:
      element.style.display = "none";
      break;

    case Progress.Receiving:
      element.style.display = "block";
      elementText.textContent = "Receiving ...";
      break;

    case Progress.Sending:
      element.style.display = "block";
      elementText.textContent = "Sending ...";
      break;
  }
}

export function setProgressUnlessIdle(progress: Progress) {
  const element = document.getElementById("progress")!;

  if (element.style.display == "block") {
    setProgress(progress);
  }
}
