
// Fisher-Yates shuffle
export function shuffleArray<T>(array: Array<T>) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.round(Math.random() * i);
        const item = array[i];
        array[i] = array[j];
        array[j] = item;
    }
}

export function *range(start: number, end: number): IterableIterator<number> {
    for (let i = start; i <= end; i++) {
      yield i;
    }
}
