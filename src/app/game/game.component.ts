import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { PaperScope, Project, Path, Color, Point, Item, Group, Raster, Layer } from 'paper';
import { shuffleArray, range } from '../classes/utility';
import { Player } from '../classes/player';
import { Tile } from '../classes/tile';
import { City } from '../classes/building';
import { AI } from '../classes/ai';
import { PlayerService } from '../player.service';
import { Perlin } from '../perlin';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements AfterViewInit {
  @ViewChild('paperCanvas', { static: false }) canvasElement: ElementRef;

  private scope: PaperScope;
  public project: Project;
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
  }

  ngAfterViewInit() {
    this.scope = new PaperScope();
    this.project = new Project(this.canvasElement.nativeElement);
    this.mapLayer = new Layer();
    this.project.addLayer(this.mapLayer);
    const background = new Path.Rectangle(
      new Point(0, 0),
      new Point(this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height)
    );
    background.fillColor = new Color(.1, .1, .1);
    this.mapLayer.addChild(background);
    this.tileGroup = new Group();
    this.tileGroup.name = 'Tiles';
    this.outlineGroup = new Group();
    this.outlineGroup.name = 'Outlines';
    this.roadHubOuterGroup = new Group();
    this.roadHubOuterGroup.name = 'Road Hub Outer';
    this.roadOuterGroup = new Group();
    this.roadOuterGroup.name = 'Road Outer';
    this.roadHubInnerGroup = new Group();
    this.roadHubInnerGroup.name = 'Road Hub Inner';
    this.roadInnerGroup = new Group();
    this.roadInnerGroup.name = 'Road Inner';
    this.buildingGroup = new Group();
    this.buildingGroup.name = 'Buildings';
    this.unitGroup = new Group();
    this.unitGroup.name = 'Units';

    const rows = 18;
    const columns = 23;
    this.createTiles(rows, columns);
    this.createHexagonGrid(this.tiles);

    this.players = [];
    this.ais = [];
    this.cities = [];

    const colors: Color[] = [];
    for (let i = 0; i < 360; i += 10) {
      const color = new Color(255, 255, 255);
      color.hue = i;
      color.saturation = 1;
      color.brightness = 1;
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
      this.createCity(player, this.getEmptyTile());
      this.players.push(player);
      this.playerService.registerPlayer(player);
    }
    setInterval(this.gameLoop.bind(this), 1000);
    setInterval(this.upkeepLoop.bind(this), 10000);
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
        else if (r < 0.99) biome = 'Desert';
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
      if (tile.water > 1.5) tile.biome = 'Ocean';
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
  }

  canvasScroll(event) {
    // event.preventDefault();
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
}
