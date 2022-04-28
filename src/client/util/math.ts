export function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Fisher-Yates shuffle
export function shuffle(arr: Array<any>) {
  for (let i = 0; i < arr.length; i++) {
    let n = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[n]] = [arr[n], arr[i]];
  }
}
