export class Perlin {
  private readonly size: number;
  private readonly mask: number;
  private permutation: number[];
  private gradients_x: number[];
  private gradients_y: number[];

  constructor(size: number) {
    this.size = size;
    this.mask = size - 1;
    this.permutation = new Array<number>(size);
    this.gradients_x = new Array<number>(size);
    this.gradients_y = new Array<number>(size);

    for (let i = 0; i < size; i++) {
      const other = Math.round(Math.random() * i); // random number between 0 and index inclusive
      if (i > other) {
        this.permutation[i] = this.permutation[other];
      }
      this.permutation[other] = i;
      this.gradients_x[i] = Math.cos(2 * Math.PI * i / size);
      this.gradients_y[i] = Math.sin(2 * Math.PI * i / size);
    }
  }

  /*
  float f(float t) {
    t = fabsf(t);
    return t >= 1.0f ? 0.0f: 1.0f -
      (3.0f - 2.0f * t ) * t * t;
  }
  float surflet(float x, float y, float grad_x, float grad_y) {
    return f(x) * f(y) * (grad_x * x + grad_y * y);
  }
  float noise( float x, float y ) {
      float result = 0.0f;
      int cell_x = floorf( x );
      int cell_y = floorf( y );
      for ( int grid_y = cell_y; grid_y <= cell_y + 1; ++grid_y )
          for ( int grid_x = cell_x; grid_x <= cell_x + 1; ++grid_x ) {
              int hash = perm[ ( perm[ grid_x & mask ] + grid_y ) & mask ];
              result += surflet( x - grid_x, y - grid_y,
                                 grads_x[ hash ], grads_y[ hash ] );
          }
      return result;
  }
  */
  f(t: number): number {
    t = Math.abs(t);
    return t >= 1 ? 0 : 1 - (3 - 2 * t) * t * t;
  }

  surflet(x: number, y: number, grad_x: number, grad_y: number): number {
    return this.f(x) * this.f(y) * (grad_x * x + grad_y * y);
  }

  noise(x: number, y: number): number {
    let result = 0;
    const cell_x = Math.floor(x);
    const cell_y = Math.floor(y);
    for (let grid_y = cell_y; grid_y <= cell_y + 1; grid_y++) {
      for (let grid_x = cell_x; grid_x <= cell_x + 1; grid_x++) {
        const hash = this.permutation[(this.permutation[grid_x & this.mask] + grid_y) & this.mask];
        result += this.surflet(x - grid_x, y - grid_y, this.gradients_x[hash], this.gradients_y[hash]);
      }
    }
    return result;
  }
}
