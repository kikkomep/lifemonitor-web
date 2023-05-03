export function formatDuration(duration: number): string {
  let hours: number = Math.floor(duration / 3600);
  let minutes: number = Math.floor((duration % 3600) / 60);
  let seconds: number = Math.floor((duration % 3600) % 60);
  let hoursStr: string = hours < 10 ? '0' + hours : hours.toString();
  let minutesStr: string = minutes < 10 ? '0' + minutes : minutes.toString();
  let secondsStr: string = seconds < 10 ? '0' + seconds : seconds.toString();
  return hoursStr + 'h ' + minutesStr + 'm ' + secondsStr + 's';
}
