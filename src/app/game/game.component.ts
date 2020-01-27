import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { shuffleArray, range, distance } from '../classes/utility';
import { Player } from '../classes/player';
import { Tile } from '../classes/tile';
import { City } from '../classes/building';
import { AI } from '../classes/ai';
import { PlayerService } from '../player.service';
import { Perlin } from '../perlin';
import { Scene, Camera, OrthographicCamera, WebGLRenderer, Color, Mesh, MeshBasicMaterial, BoxBufferGeometry, DirectionalLight, MeshLambertMaterial, PerspectiveCamera, BoxGeometry, Geometry, Vector3, Face3, Vector2, TextureLoader } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Group, Layer, Point } from 'paper';
import { HexagonGeometry, PentagonGeometry } from '../classes/hexagonGeometry';
import { Tile2 } from '../classes/pentagonTile';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements AfterViewInit {
  @ViewChild('threeContainer', { static: false }) threeContainer: ElementRef<HTMLDivElement>;

  // Three JS
  private scene: Scene;
  private camera: Camera;
  private renderer: WebGLRenderer;
  private objects: Mesh[];

  private mapLayer: Layer;
  private tileGroup: Group;
  private outlineGroup: Group;
  public roadHubOuterGroup: Group;
  public roadOuterGroup: Group;
  public roadHubInnerGroup;
  public roadInnerGroup: Group;
  public buildingGroup: Group;
  public unitGroup: Group;

  private allTiles: Tile[];
  private tiles: Tile[][];
  private players: Player[];
  private ais: AI[];

  private cities: City[];

  private playerService: PlayerService;

  constructor(score: PlayerService) {
    this.playerService = score;
    this.objects = [];
  }

  ngAfterViewInit() {
    this.scene = new Scene();
    this.camera = new OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
    // this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // this.camera.position.x = 10;
    // this.camera.position.y = 10;
    // this.camera.position.z = 10;
    this.renderer = new WebGLRenderer();
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.threeContainer.nativeElement.clientWidth, this.threeContainer.nativeElement.clientHeight);
    this.threeContainer.nativeElement.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'three-canvas';
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    const rows = 32;
    const columns = 32;
    this.createTiles(rows, columns);
    // this.createHexagonGrid(this.tiles);
    const geo = new BoxGeometry(1, 1, 1);
    const mat = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geo, mat);
    this.scene.add(cube);
    this.camera.position.z = -10;


    /*
    const hexagonGeometry = new HexagonGeometry(5, 0);
    const hexagonMesh = new Mesh(hexagonGeometry, new MeshBasicMaterial({ color: 0xffffff }));

    // hexagonMesh.rotation.y = 90;
    this.scene.add(hexagonMesh);
    this.objects.push(hexagonMesh);
    console.log(hexagonMesh);
    */


    // this.camera.lookAt(hexagonMesh.position);

    // const geometry = new HexagonGeometry(3, 1);
    // for (let i = 0; i < 2000; i++) {
    //   const object = new Mesh(geometry, new MeshBasicMaterial({ color: Math.random() * 0xffffff }));
    //   object.position.x = Math.random() * 10 - 5;
    //   object.position.y = Math.random() * 10 - 5;
    //   object.position.z = Math.random() * 10 - 5;
    //   object.rotation.x = Math.random() * 2 * Math.PI;
    //   object.rotation.y = Math.random() * 2 * Math.PI;
    //   object.rotation.z = Math.random() * 2 * Math.PI;
    //   object.scale.x = Math.random() + 0.5;
    //   object.scale.y = Math.random() + 0.5;
    //   object.scale.z = Math.random() + 0.5;
    //   this.scene.add(object);
    // }

    this.createIcosahedron();

    this.players = [];
    this.ais = [];
    this.cities = [];

    const colors: Color[] = [];
    for (let i = 0; i < 360; i += 10) {
      const color = new Color();
      color.setHSL(i, 1, 1);
      colors.push(color);
    }
    for (let i = 0; i < 20; i++) {
      const player = new Player(this);
      const ai = new AI(player);
      this.ais.push(ai);
      // const randomColorIndex = Math.floor(Math.random() * colors.length);
      // const randomColor = colors[randomColorIndex];
      // colors.splice(randomColorIndex, 1);
      const randomColor = colors.pop();

      player.color = randomColor;
      // this.createCity(player, this.getEmptyTile());
      this.players.push(player);
      this.playerService.registerPlayer(player);
    }
    setInterval(this.gameLoop.bind(this), 1000);
    setInterval(this.upkeepLoop.bind(this), 10000);
    this.renderLoop();
  }

  renderLoop() {
    requestAnimationFrame(this.renderLoop.bind(this));
    // this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  }

  getEmptyTile(): Tile {
    const indexList = [...range(0, this.allTiles.length - 1)];
    shuffleArray(indexList);

    for (let i = 0; i < indexList.length; i++) {
      const tile = this.allTiles[indexList[i]];
      if (tile.hasBuilding() || tile.biome === 'Ocean') continue;
      if (tile.neighbors.find((neighbor) => Boolean(neighbor) && neighbor.hasBuilding())) continue;
      return tile;
    }
    return null;

    // return this.allTiles.find((tile: Tile) => {
    //   if (tile.hasBuilding) return false;
    //   if (tile.neighbors.find((tile: Tile) => tile.hasBuilding)) return false;
    //   return true;
    // });
  }

  createTiles(rows: number, columns: number) {
    const perlin = new Perlin(4);

    this.tiles = [];
    this.allTiles = [];
    for (let i = 0; i < rows; i++) {
      this.tiles[i] = [];
      for (let j = 0; j < columns; j++) {
        let biome: string;
        const r = Math.random();
        if (r < 0.7) biome = 'Forest';
        else if (r < 0.9) biome = 'Grass';
        else if (r < 0.98) biome = 'Desert';
        else biome = 'Mountain';
        const elevation = 20 * perlin.noise(i / rows * 4, j / columns * 4);
        // console.log('elevation', elevation);
        const tile = new Tile(biome, elevation);
        tile.x = j;
        tile.y = i;
        this.tiles[i][j] = tile;
        this.allTiles.push(tile);
      }
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        // if (i - 1 > 0) {
        //   this.tiles[i][j].neighbors.push(this.tiles[i - 1][j]);
        // }
        // if (i - 1 > 0) {
        //   const offset = (i - 1) % 2;
        //   if ()
        // }
        // Vertical neighbors
        const rowOffset = (i % 2 === 0) ? 1 : 0;
        if (i - 1 >= 0) {
          if (j + rowOffset - 1 >= 0) this.tiles[i][j].neighbors[5] = this.tiles[i - 1][j + rowOffset - 1];
          if (j + rowOffset < columns) this.tiles[i][j].neighbors[0] = this.tiles[i - 1][j + rowOffset];
        }
        if (i + 1 < rows) {
          if (j + rowOffset - 1 >= 0) this.tiles[i][j].neighbors[3] = this.tiles[i + 1][j + rowOffset - 1];
          if (j + rowOffset < columns) this.tiles[i][j].neighbors[2] = this.tiles[i + 1][j + rowOffset];
        }

        // Horizontal neighbors
        if (j - 1 >= 0) {
          this.tiles[i][j].neighbors[4] = this.tiles[i][j - 1];
        }
        if (j + 1 < columns) {
          this.tiles[i][j].neighbors[1] = this.tiles[i][j + 1];
        }
        // if (i + 1 < rows) {
        //   this.tiles[i][j].neighbors.push(this.tiles[i + 1][j]);
        // }
      }
    }

    // Simulate rainfall
    const rainTiles = this.allTiles.slice();
    rainTiles.forEach(rainTile => rainTile.water = 1);
    const maxIterations = 100;
    let iterations = 0;
    while (rainTiles.length > 0 && iterations++ < maxIterations) {
      // console.log('rain loop - length', rainTiles.length);
      for (let i = rainTiles.length - 1; i >= 0; i--) {
        const rainTile = rainTiles[i];
        const rainTileWaterLevel = rainTile.elevation + rainTile.water;
        const waterLevelDiffs = new Array<number>(6);
        let totalDiff = 0;
        for (let j = 0; j < 6; j++) {
          const neighbor = rainTile.neighbors[j];
          if (!neighbor) {
            waterLevelDiffs[j] = 0;
            continue;
          }
          const neighborWaterLevel = neighbor.elevation + neighbor.water;
          if (rainTileWaterLevel > neighborWaterLevel) {
            const waterLevelDiff = rainTileWaterLevel - neighborWaterLevel;
            waterLevelDiffs[j] = waterLevelDiff;
            totalDiff += waterLevelDiff;
          } else {
            waterLevelDiffs[j] = 0;
          }
        }
        if (totalDiff > 0) {
          for (let j = 0; j < 6; j++) {
            if (waterLevelDiffs[j] === 0) continue;
            const transferPercent = waterLevelDiffs[j] / totalDiff;
            rainTile.neighbors[j].water += rainTile.water * transferPercent * .5;
          }
          rainTile.water /= 2;
        } else {
          rainTiles.splice(i, 1);
        }
      }
    }

    // Create oceans
    this.allTiles.forEach(tile => {
      if (tile.water > 1.5) {
        if (tile.biome === 'Mountain') tile.biome = 'Island';
        else tile.biome = 'Ocean';
      }
    });
  }

  // create grid give then tile data map????
  createHexagonGrid(tiles: Tile[][]) {
    const columns = tiles[0].length;
    const rows = tiles.length;
    const hexSize = 50;
    const hexHeight = 2 * hexSize;
    const yOffset = 3 / 4 * hexHeight;
    const hexWidth = Math.sqrt(3) * hexSize;
    const xOffset = hexWidth;
    const forestImages = [
      'assets/images/unlicensed/biomes/forest/m11-247-forest.png',
      'assets/images/unlicensed/biomes/forest/ddg-44-forest.png'
    ];
    const grassImages = [
      'assets/images/unlicensed/biomes/grass/grass0.jpg',
      'assets/images/unlicensed/biomes/grass/grass1.jpg',
      'assets/images/unlicensed/biomes/grass/grass2.jpg'
    ];
    const desertImages = [
      'assets/images/unlicensed/biomes/desert/desert0.png',
      'assets/images/unlicensed/biomes/desert/desert1.jpg',
      'assets/images/unlicensed/biomes/desert/Sea_of_Sand.jpg'
    ];
    const mountainImages = [
      'assets/images/unlicensed/biomes/mountain/mountain0.jpg',
      'assets/images/unlicensed/biomes/mountain/mountain1.jpg'
    ];
    const oceanImages = [
      'assets/images/unlicensed/biomes/ocean/0.png'
    ];
    const islandImages = [
      // 'assets/images/unlicensed/biomes/island/0.jpg',
      'assets/images/unlicensed/biomes/island/1.jpg'
    ];
    const mapOffset = new Point(25 * Math.sqrt(3), 50);

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const tile = this.tiles[j][i];
        let imageList;
        if (tile.biome === 'Forest') imageList = forestImages;
        else if (tile.biome === 'Grass') imageList = grassImages;
        else if (tile.biome === 'Desert') imageList = desertImages;
        else if (tile.biome === 'Mountain') imageList = mountainImages;
        else if (tile.biome === 'Ocean') imageList = oceanImages;
        else if (tile.biome === 'Island') imageList = islandImages;
        const imagePath = imageList[Math.floor(Math.random() * imageList.length)];
        // const hexagon = tile.createTexturedHexagon(forestImagePath);
        // const hexagon = this.createHexagon(hexSize);
        const offset = new Point(
          xOffset * i + ((j % 2 === 0) ? xOffset / 2 : 0),
          yOffset * j
        );
        tile.createVisuals(hexSize, mapOffset.add(offset), imagePath, this.outlineGroup, this.tileGroup);
        const hexagon = tile.group;
        hexagon.translate(offset.add(mapOffset));
        // hexagon.position.x = xOffset * i;
        // if (j % 2 == 0) {
        //   hexagon.position.x += xOffset / 2;
        // }
        // hexagon.position.y = yOffset * j;
        // hexagon.fillColor = new Color(Math.random(), Math.random(), Math.random())
        this.tileGroup.addChild(hexagon);
      }
    }
  }

  createCity(player: Player, tile: Tile) {
    const city = new City(player);
    player.cities.push(city);
    this.cities.push(city);
    city.productivity = 5;

    tile.addBuilding(city, this.roadInnerGroup, this.roadOuterGroup);
    tile.setOutlineColor(player.color);
    // (tile.group.children[1] as Raster).visible = false;
    console.error('Not implemented.');
    /*
    this.project.importSVG('assets/svg/city-svgrepo-com-filled.svg', (item: Item) => {
      item.scale(0.1);
      item.position = tile.group.position;
      const tilePath = tile.group.children[0];
      tilePath.fillColor = player.color;

      // item.fillColor = new Color(1, 1, 1);
      // item.strokeColor = new Color(0, 0, 0);
      // item.strokeWidth = .2;
      this.buildingGroup.addChild(item);
    });
    */
  }

  canvasScroll(event: WheelEvent) {
    event.preventDefault();
    console.error('Not implemented.');
    /*
    this.project.view.translate(new Point(-event.deltaX, -event.deltaY));
    */
  }

  // resizeCanvas() {
  //   this.canvasElement.nativeElement.width = imgWidth;
  //   this.canvasElement.nativeElement.height = this.imageElement.nativeElement.height;
  //   this.canvasElement.nativeElement.style = `transform: translate(${-imgWidth}px, 0)`;
  // }

  gameLoop() {
    this.cities.forEach(city => {
      city.produce();
    });

    this.ais.forEach(ai => {
      ai.think(this);
    });
  }

  upkeepLoop() {
    this.players.forEach(player => {
      player.upkeep();
    });
  }

  createTruncatedIcosahedron() {
    const phi = (1 + Math.sqrt(5)) / 2;

  }

  createIcosahedron() {
    // const geometry = new Geometry();

    // Generate vertices for icosahedron with r = 2
    const phi = (1 + Math.sqrt(5)) / 2;
    const icosahedronVertices: Array<Vector3> = [
      new Vector3(0, 1, phi),
      new Vector3(0, 1, -phi),
      new Vector3(0, -1, phi),
      new Vector3(0, -1, -phi),
      new Vector3(phi, 0, 1),
      new Vector3(-phi, 0, 1),
      new Vector3(phi, 0, -1),
      new Vector3(-phi, 0, -1),
      new Vector3(1, phi, 0),
      new Vector3(-1, phi, 0),
      new Vector3(1, -phi, 0),
      new Vector3(-1, -phi, 0)
    ];
    // Get distanceToCenter to normalize future generated points
    const distanceToCenter = Math.sqrt(
      Math.pow(icosahedronVertices[0].x, 2) +
      Math.pow(icosahedronVertices[0].y, 2) +
      Math.pow(icosahedronVertices[0].z, 2)
    );
    // Get faces
    //  1. Get edges for each vertex
    const icosahedronVertexEdges = new Array<Array<number>>();
    for (let i = 0; i < 12; i++) {
      icosahedronVertexEdges[i] = [];
      const vertexOne = icosahedronVertices[i];
      for (let j = 0; j < 12; j++) {
        const vertexTwo = icosahedronVertices[j];
        if (distance(vertexOne, vertexTwo) === 2) icosahedronVertexEdges[i].push(j);
      }
    }
    console.log('t', icosahedronVertexEdges);
    // 2. Get faces from edges
    // foreach edge, for each v1 neighbor (*5), for each v2 neighbor (*5), if v1 neighbor === v2 neighbor

    // could leverage fact that neighbor can be checked in constant time using distance.

    function faceEquals(a: Array<number>, b: Array<number>): boolean {
      if (a[0] === b[0]) {
        if (a[1] === b[1]) {
          if (a[2] === b[2]) return true;
        } else if (a[1] === b[2]) {
          if (a[2] === b[1]) return true;
        }
      } else if (a[0] === b[1]) {
        if (a[1] === b[0]) {
          if (a[2] === b[2]) return true;
        } else if (a[1] === b[2]) {
          if (a[2] === b[0]) return true;
        }
      } else if (a[0] === b[2]) {
        if (a[1] === b[0]) {
          if (a[2] === b[1]) return true;
        } else if (a[1] === b[1]) {
          if (a[2] === b[0]) return true;
        }
      }
      return false;
    }

    // for each vertex, for each neighbor (*5), for neighbors neighbor (*5), if nn in verex neighbors (* 5)
    const icosahedronFaces = new Array<Array<number>>();
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 5; j++) {
        const connectedVertexOneIndex = icosahedronVertexEdges[i][j];
        for (let k = 0; k < 5; k++) {
          const connectedVertexTwoIndex = icosahedronVertexEdges[connectedVertexOneIndex][k];
          if (icosahedronVertexEdges[i].includes(connectedVertexTwoIndex)) {
            const face = [i, connectedVertexOneIndex, connectedVertexTwoIndex];
            if (!icosahedronFaces.find(existingFace => faceEquals(existingFace, face))) {
              icosahedronFaces.push(face);
            }
          }
        }
      }
    }

    const pentagonVertices = icosahedronVertices;
    const hexagonVertices = new Array<Vector3>();
    for (let i = 0; i < 20; i++) {
      const vertexOne = icosahedronVertices[icosahedronFaces[i][0]];
      const vertexTwo = icosahedronVertices[icosahedronFaces[i][1]];
      const vertexThree = icosahedronVertices[icosahedronFaces[i][2]];
      const center = new Vector3(
        (vertexOne.x + vertexTwo.x + vertexThree.x) / 3,
        (vertexOne.y + vertexTwo.y + vertexThree.y) / 3,
        (vertexOne.z + vertexTwo.z + vertexThree.z) / 3
      );
      hexagonVertices.push(center.normalize().multiplyScalar(distanceToCenter));
    }

    console.log(icosahedronFaces);
    console.log(hexagonVertices);

    // Need to create two vertices between each pentagon center. These will be the vertices of the actual face
    // Should this step be done last??????

    // Turn the faces of the icosahedron in hexagons
    // neighbors for pentagons should be updated to be hexagons

    let newMinDistLow = Number.POSITIVE_INFINITY;
    let newMinDistHigh = Number.NEGATIVE_INFINITY;
    let allVertices = new Array().concat(pentagonVertices).concat(hexagonVertices);
    for (let i = 0; i < allVertices.length; i++) {
      let localMin = Number.POSITIVE_INFINITY;
      for (let j = 0; j < allVertices.length; j++) {
        if (i === j) continue;
        const vertexDistance = distance(allVertices[i], allVertices[j]);
        if (vertexDistance === 0) {
          console.log('wuh', i, j, allVertices[i], allVertices[j]);
        }
        if (vertexDistance < localMin) {
          localMin = vertexDistance;
        }
      }
      if (localMin > newMinDistHigh) {
        newMinDistHigh = localMin;
      }
      if (localMin < newMinDistLow) {
        newMinDistLow = localMin;
      }
    }
    console.log('new numbers', newMinDistLow, newMinDistHigh);

    let minDistLow = Number.POSITIVE_INFINITY;
    let minDistHigh = Number.POSITIVE_INFINITY;
    const referenceVertex = hexagonVertices[0];
    for (let i = 0; i < pentagonVertices.length; i++) {
      const tileDistance = distance(referenceVertex, pentagonVertices[i]);
      if (tileDistance < minDistLow) {
        minDistLow = tileDistance;
      }
    }
    for (let i = 1; i < hexagonVertices.length; i++) {
      const tileDistance = distance(referenceVertex, hexagonVertices[i]);
      if (tileDistance < minDistHigh) {
        minDistHigh = tileDistance;
      }
    }
    const averageMinDist = (minDistLow + minDistHigh) / 2;
    const hexagonVertexEdges: Array<Array<number>> = [];
    const pentagonVertexEdges: Array<Array<number>> = [];
    console.log(allVertices);
    for (let i = 0; i < pentagonVertices.length; i++) {
      pentagonVertexEdges[i] = [];
      for (let j = 0; j < allVertices.length; j++) {
        if (Math.abs(distance(pentagonVertices[i], allVertices[j]) - averageMinDist) < .1 * averageMinDist) {
          pentagonVertexEdges[i].push(j);
        }
      }
    }
    for (let i = 0; i < hexagonVertices.length; i++) {
      hexagonVertexEdges[i] = [];
      for (let j = 0; j < allVertices.length; j++) {
        if (Math.abs(distance(hexagonVertices[i], allVertices[j]) - averageMinDist) < .1 * averageMinDist) {
          hexagonVertexEdges[i].push(j);
        }
      }
    }
    let allVertexEdges = new Array<Array<number>>().concat(pentagonVertexEdges).concat(hexagonVertexEdges);
    console.log(pentagonVertexEdges, hexagonVertexEdges);
    console.log('nother test', 'high', minDistHigh, 'low', minDistLow);

    function subdividePlanet(vertices: Array<Vector3>, vertexEdges, planetRadius: number) {
      // Get all tile intersections
      const newFaces = new Array<Array<number>>();
      for (let i = 0; i < vertices.length; i++) {
        const vertexOneNeighbors = vertexEdges[i];
        for (let j = 0; j < vertexOneNeighbors.length; j++) {
          const vertexTwoIndex = vertexOneNeighbors[j];
          const vertexTwoNeighbors = vertexEdges[vertexTwoIndex];
          for (let k = 0; k < vertexTwoNeighbors.length; k++) {
            const vertexThreeIndex = vertexTwoNeighbors[k];
            const vertexThreeNeighbors = vertexEdges[vertexThreeIndex];
            if (vertexThreeNeighbors.includes(i)) {
              const face = [
                i,
                vertexTwoIndex,
                vertexThreeIndex
              ];
              if (!newFaces.find(seenFace => faceEquals(seenFace, face))) {
                newFaces.push(face);
              }
            }
          }
        }
      }

      const newVertices: Vector3[] = [].concat(vertices);
      // Get new face centers from intersections
      for (let i = 0; i < newFaces.length; i++) {
        const vertexOne = vertices[newFaces[i][0]];
        const vertexTwo = vertices[newFaces[i][1]];
        const vertexThree = vertices[newFaces[i][2]];
        const newHexagonFaceCenter = new Vector3(
          (vertexOne.x + vertexTwo.x + vertexThree.x) / 3,
          (vertexOne.y + vertexTwo.y + vertexThree.y) / 3,
          (vertexOne.z + vertexTwo.z + vertexThree.z) / 3
        ).normalize().multiplyScalar(planetRadius);
        newVertices.push(newHexagonFaceCenter);
      }

      // Get connected tiles for new vertices
      const newVertexEdges: Array<Array<number>> = [];
      let minDist = Number.POSITIVE_INFINITY;
      const referenceVert = newVertices[0];
      for (let i = 1; i < newVertices.length; i++) {
        const dist = distance(referenceVert, newVertices[i]);
        if (dist < minDist) {
          minDist = dist;
        }
      }

      for (let i = 0; i < newVertices.length; i++) {
        newVertexEdges[i] = [];
        for (let j = 0; j < newVertices.length; j++) {
          if (Math.abs(distance(newVertices[i], newVertices[j]) - minDist) < .75 * minDist) {
            newVertexEdges[i].push(j);
          }
        }
      }

      return {
        vertices: newVertices,
        vertexEdges: newVertexEdges
      };
    }

    function generatePlanetMesh(vertices: Array<Vector3>, vertexEdges: Array<Array<number>>) {
      const geometryVertices = [];
      for (let i = 0; i < vertexEdges[0].length; i++) {
        geometryVertices.push(distance(vertices[0], vertices[vertexEdges[0][i]]));
      }
      // console.log('afsdf', geometryVertices);
      const t2 = [];
      for (let i = 0; i < vertexEdges[12].length; i++) {
        t2.push(distance(vertices[12], vertices[vertexEdges[12][i]]));
      }
      // console.log('t2', t2);

      // Scale up to r = 20;
      for (let i = 0; i < vertices.length; i++) {
        vertices[i].normalize().multiplyScalar(30);
      }

      function assignUVs(geometry) {

        geometry.faceVertexUvs[0] = [];

        geometry.faces.forEach((face) => {

          const components = ['x', 'y', 'z'].sort((a, b) => {
            return (Math.abs(face.normal[a]) > Math.abs(face.normal[b])) ? 1 : -1;
          });

          const v1 = geometry.vertices[face.a];
          const v2 = geometry.vertices[face.b];
          const v3 = geometry.vertices[face.c];

          geometry.faceVertexUvs[0].push([
            new Vector2(v1[components[0]], v1[components[1]]),
            new Vector2(v2[components[0]], v2[components[1]]),
            new Vector2(v3[components[0]], v3[components[1]])
          ]);

        });

        geometry.uvsNeedUpdate = true;
      }

      // up vector can be determined by normalizing the distance of any edge vertex to the (center with height component removed);
      // to orient north, choose the vertex that points northmost. might need a version for each of the 5 or 6 rotations to handle texture properly
      // const heightOffset = 0.03;
      const heightOffset = 0;
      for (let i = 0; i < 12; i++) {
        // const geometry = new PentagonGeometry(11.4, 0);
        const geometry = new PentagonGeometry(0.7, 0);
        const mesh = new Mesh(geometry, new MeshBasicMaterial({ color: Math.random() * 0xfffff }));
        // const mesh = new Mesh(geometry, new MeshBasicMaterial({ color: 0x000000 }));
        const position = vertices[i].multiplyScalar(1 + heightOffset).clone();
        // const direction = vertices[i].clone().normalize();
        mesh.position.set(position.x, position.y, position.z);

        let faceTriad;
        for (let j = 0; j < vertexEdges[i].length; j++) {
          const neighborFaceIndex = vertexEdges[i][j];
          const neighborFaceVertexEdges = vertexEdges[neighborFaceIndex];
          for (let k = 0; k < neighborFaceVertexEdges.length; k++) {
            const neighborTwoFaceIndex = neighborFaceVertexEdges[k];
            const neighborTwoFaceVertexEdges = vertexEdges[neighborTwoFaceIndex];
            if (neighborTwoFaceVertexEdges.includes(i)) {
              faceTriad = [i, neighborFaceIndex, neighborTwoFaceIndex];
              break;
            }
          }
          if (faceTriad) break;
        }
        // console.log('did I find a face????', faceTriad);
        const vertexOne = vertices[faceTriad[0]];
        const vertexTwo = vertices[faceTriad[1]];
        const vertexThree = vertices[faceTriad[2]];
        const faceTriadIntersection = new Vector3(
          (vertexOne.x + vertexTwo.x + vertexThree.x) / 3,
          (vertexOne.y + vertexTwo.y + vertexThree.y) / 3,
          (vertexOne.z + vertexTwo.z + vertexThree.z) / 3
        ).normalize().multiplyScalar(distanceToCenter);
        // console.log(
        //   'uno',
        //   faceTriadIntersection,
        //   faceTriadIntersection.normalize().multiplyScalar(distanceToCenter),
        //   distance(faceTriadIntersection, new Vector3(0, 0, 0)),
        //   distanceToCenter,
        //   distance(vertices[i], new Vector3(0, 0, 0))
        // );
        // Ignoring the height when setting this!!!!!!!!!!
        // Doesn't seem to be the issue - just floating point errors??
        mesh.lookAt(faceTriadIntersection);

        const up = faceTriadIntersection.sub(position).normalize();
        // console.log('is this normalized???', up.length());
        mesh.up.set(up.x, up.y, up.z);

        mesh.lookAt(new Vector3(0, 0, 0));
        this.scene.add(mesh);
        // up for pentagon  
      }
      const textureLoader = new TextureLoader();
      // const textureMaterial = new MeshBasicMaterial({
      //   map: textureLoader.load('assets/images/unlicensed/biomes/ocean/0.png')
      // });
      const otherTextureMaterial = new MeshBasicMaterial({
        map: textureLoader.load('assets/images/unlicensed/biomes/island/1.jpg')
      });

      const oceanTextureMaterials = [];
      for (let i = 0; i < 10; i++) {
        const hue = Math.random() / 20 + .54;
        oceanTextureMaterials.push(new MeshBasicMaterial({
          map: textureLoader.load('assets/images/utility/white.png'),
          // color: 0x4dbbb5 * (Math.random() / 100 + 0.99)
          color: new Color(1, 1, 1).setHSL(hue, .8, .6)
        }));
      }

      for (let i = 12; i < vertices.length; i++) {
        // const geometry = new HexagonGeometry(13.4, 0);
        const geometry = new HexagonGeometry();
        // assignUVs(geometry);
        // const mesh = new Mesh(geometry, new MeshBasicMaterial({ color: Math.random() * 0xfffff }));
        // const customColor = new Color(`hsl(${hue}, 80%, 60%)`);
        const deepOceanMaterial = oceanTextureMaterials[Math.floor(Math.random() * oceanTextureMaterials.length)];
        const mat = (Math.random() >= 0.05) ? deepOceanMaterial : otherTextureMaterial;
        const mesh = new Mesh(geometry, mat);

        // const mesh = new Mesh(geometry, new MeshBasicMaterial({ color: 0xffffff }));
        const position = vertices[i].clone();
        const direction = vertices[i].clone().normalize();
        mesh.position.set(position.x, position.y, position.z);
        // direction.reflect(new Vector3(0, 0, 1));
        // mesh.up.set(direction.x, direction.y, direction.z);

        // find neighbor triad
        // could get other neighbors and use those to balance out the intersection position?
        let faceTriad;
        for (let j = 0; j < vertexEdges[i].length; j++) {
          const neighborFaceIndex = vertexEdges[i][j];
          const neighborFaceVertexEdges = vertexEdges[neighborFaceIndex];
          for (let k = 0; k < neighborFaceVertexEdges.length; k++) {
            const neighborTwoFaceIndex = neighborFaceVertexEdges[k];
            const neighborTwoFaceVertexEdges = vertexEdges[neighborTwoFaceIndex];
            if (neighborTwoFaceVertexEdges.includes(i)) {
              faceTriad = [i, neighborFaceIndex, neighborTwoFaceIndex];
              break;
            }
          }
          if (faceTriad) break;
        }
        // console.log('did I find a face????', faceTriad);
        const vertexOne = vertices[faceTriad[0]];
        const vertexTwo = vertices[faceTriad[1]];
        const vertexThree = vertices[faceTriad[2]];
        const faceTriadIntersection = new Vector3(
          (vertexOne.x + vertexTwo.x + vertexThree.x) / 3,
          (vertexOne.y + vertexTwo.y + vertexThree.y) / 3,
          (vertexOne.z + vertexTwo.z + vertexThree.z) / 3
        ).normalize().multiplyScalar(distanceToCenter);
        // console.log(
        //   'uno',
        //   faceTriadIntersection,
        //   faceTriadIntersection.normalize().multiplyScalar(distanceToCenter),
        //   distance(faceTriadIntersection, new Vector3(0, 0, 0)),
        //   distanceToCenter,
        //   distance(vertices[i], new Vector3(0, 0, 0))
        // );
        // Ignoring the height when setting this!!!!!!!!!!
        // Doesn't seem to be the issue - just floating point errors??
        mesh.lookAt(faceTriadIntersection);

        const up = faceTriadIntersection.sub(position).normalize();
        // console.log('is this normalized???', up.length());
        mesh.up.set(up.x, up.y, up.z);
        // console.log('intersection centahhhhhh', faceTriadIntersection);

        // console.log('curr up', mesh.up);
        mesh.lookAt(new Vector3(0, 0, 0));

        // up for hexagon can be center (with height removed) to any vertex
        this.scene.add(mesh);
      }
    }

    for (let i = 0; i < 5; i++) {
      const newPlanet = subdividePlanet(allVertices, allVertexEdges, distanceToCenter);
      allVertices = newPlanet.vertices;
      allVertexEdges = newPlanet.vertexEdges;
    }

    generatePlanetMesh.bind(this)(allVertices, allVertexEdges);
    console.log('aaaaa', allVertices, allVertexEdges);

    // Get neighbors with distances


    // Compare all pairs of 3 vertices??????
    // N / 4 time

    // console.log('test neighbors', tiles);

    // Scale icosahedron
    /*
    geometry.vertices.forEach(vertex => {
      vertex.x = vertex.x * 10;
      vertex.y = vertex.y * 10;
      vertex.z = vertex.z * 10;
    });
    */

    // make faces
    // geometry.faces.push(new Face3(0, 3, 6));
    // geometry.faces.push(new Face3())

    // const icomesh = new Mesh(geometry, new MeshBasicMaterial({ color: 0xffff00 }));
    // this.scene.add(icomesh);
    // console.log(icomesh);
  }
}
