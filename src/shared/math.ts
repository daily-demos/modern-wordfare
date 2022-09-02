export function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Fisher-Yates shuffle
export function shuffle(arr: Array<any>): Array<any> {
  const a = arr;
  for (let i = 0; i < a.length; i += 1) {
    const n = Math.floor(Math.random() * (i + 1));
    [a[i], a[n]] = [a[n], a[i]];
  }
  return a;
}
