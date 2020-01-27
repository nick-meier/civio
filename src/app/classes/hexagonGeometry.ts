import { Geometry, Vector3, Face3, BufferGeometry, BufferAttribute } from 'three';

export class HexagonGeometry extends BufferGeometry {
  static positions: BufferAttribute;
  static normals: BufferAttribute;
  static uvs: BufferAttribute;
  static faceIndexes: number[];

  static initialize() {
    // const radius = .82;
    const radius = .2;
    const height = 0;

    const angle = 1.7320508075688767;
    const triangleHeight = angle * 0.5;

    const vertices = [];
    vertices.push(new Vector3(0, 0, 1));
    vertices.push(new Vector3(0, 1, 1));
    vertices.push(new Vector3(-triangleHeight, 0.5, 1));
    vertices.push(new Vector3(-triangleHeight, -0.5, 1));
    vertices.push(new Vector3(0, -1, 1));
    vertices.push(new Vector3(triangleHeight, -0.5, 1));
    vertices.push(new Vector3(triangleHeight, 0.5, 1));
    vertices.map((vertex: Vector3) => vertex.multiply(new Vector3(radius, radius, radius * height)));
    const positions = [];
    for (let i = 0; i < 7; i++) {
      positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
    }
    this.positions = new BufferAttribute(new Float32Array(positions), 3);


    // const faces = [];
    // faces.push(new Face3(0, 1, 2));
    // faces.push(new Face3(0, 2, 3));
    // faces.push(new Face3(0, 3, 4));
    // faces.push(new Face3(0, 4, 5));
    // faces.push(new Face3(0, 5, 6));
    // faces.push(new Face3(0, 6, 1));
    this.faceIndexes = [
      0, 1, 2,
      0, 2, 3,
      0, 3, 4,
      0, 4, 5,
      0, 5, 6,
      0, 6, 1
    ];

    const normals = [
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1
    ];
    this.normals = new BufferAttribute(new Float32Array(normals), 3);


    const uvs = [
      0.5, 0.5,
      0.5, 1,
      1, 0.7,
      1, 0.3,
      0.5, 0,
      0, 0.3,
      0, 0.7
    ];
    this.uvs = new BufferAttribute(new Float32Array(uvs), 2);
  }

  /**
   * @param radius — Radius of the hexagon. Distance between vertices.
   * @param height — Height of the hexagon. Distance between edges and center.
   */
  constructor() {
    super();
    // console.log('static var test', HexagonGeometry.positions, HexagonGeometry.normals, HexagonGeometry.uvs, HexagonGeometry.faceIndexes);
    // this.setAttribute('position', new BufferAttribute(new Float32Array(HexagonGeometry.positions), 3));
    this.setAttribute('position', HexagonGeometry.positions);
    // this.setAttribute('normal', new BufferAttribute(new Float32Array(HexagonGeometry.normals), 3));
    this.setAttribute('normal', HexagonGeometry.normals);

    this.setAttribute('uv', HexagonGeometry.uvs);
    this.setIndex(HexagonGeometry.faceIndexes);
    // this.uvsNeedUpdate = true;
  }
}
HexagonGeometry.initialize();

export class PentagonGeometry extends Geometry {

  /**
   * @param radius — Radius of the hexagon. Distance between vertices.
   * @param height — Height of the hexagon. Distance between edges and center.
   */
  constructor(radius?: number, height?: number) {
    super();

    const angle = 2 * Math.PI / 5;

    this.vertices.push(new Vector3(0, 0, 1));
    this.vertices.push(new Vector3(0, 1, 1).applyAxisAngle(new Vector3(0, 0, 1), 0));
    this.vertices.push(new Vector3(0, 1, 1).applyAxisAngle(new Vector3(0, 0, 1), angle));
    this.vertices.push(new Vector3(0, 1, 1).applyAxisAngle(new Vector3(0, 0, 1), 2 * angle));
    this.vertices.push(new Vector3(0, 1, 1).applyAxisAngle(new Vector3(0, 0, 1), 3 * angle));
    this.vertices.push(new Vector3(0, 1, 1).applyAxisAngle(new Vector3(0, 0, 1), 4 * angle));
    this.vertices.map((vertex: Vector3) => vertex.multiply(new Vector3(radius, radius, radius * height)));

    this.faces.push(new Face3(0, 1, 2));
    this.faces.push(new Face3(0, 2, 3));
    this.faces.push(new Face3(0, 3, 4));
    this.faces.push(new Face3(0, 4, 5));
    this.faces.push(new Face3(0, 5, 1));
  }

  parameters: {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments: number;
    heightSegments: number;
    openEnded: boolean;
    thetaStart: number;
    thetaLength: number;
  };

}
