import { getRemainingTime } from "./game-rules.js";

export function startTimer(endsAt, onTick, onComplete) {
  const update = () => {
    const remaining = getRemainingTime(endsAt);
    onTick(remaining);
    if (remaining <= 0) {
      window.clearInterval(intervalId);
      onComplete();
    }
  };
  const intervalId = window.setInterval(update, 250);
  update();
  return () => window.clearInterval(intervalId);
}

export function formatRemainingTime(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
