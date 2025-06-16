export enum Progress {
  Idle,
  Receiving,
  Sending,
}

export function clearProgress() {}

export function setProgress(progress: Progress) {
  const element = document.getElementById("progress")!;

  switch (progress) {
    case Progress.Idle:
      element.style.display = "none";
      break;

    case Progress.Receiving:
      console.log("Receiving ...");

      element.style.display = "block";
      break;

    case Progress.Sending:
      console.log("Sending ...");

      element.style.display = "block";
      break;
  }
}
