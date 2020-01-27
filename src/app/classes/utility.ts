import { Vector3 } from 'three';

// Fisher-Yates shuffle
export function shuffleArray<T>(array: Array<T>) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.round(Math.random() * i);
        const item = array[i];
        array[i] = array[j];
        array[j] = item;
    }
}

export function* range(start: number, end: number): IterableIterator<number> {
    for (let i = start; i <= end; i++) {
        yield i;
    }
}

export function setEquals<T>(a: Array<T>, b: Set<T>) {
    if (a.length !== b.size) return false;
    // TODO: Check hashed values if they exist
    a.forEach(value => {
        if (!b.has(value)) return false;
    });

    return true;
}

export function distance(a: Vector3, b: Vector3) {
    return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2) +
        Math.pow(a.z - b.z, 2)
    );
}
