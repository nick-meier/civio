import { Vector3 } from 'three';

export class Tile2 {
  public center: Vector3;
  public neighbors: Tile2[];
  public index: number;

  constructor(index: number) {
    this.index = index;

    this.neighbors = [];
  }
}
