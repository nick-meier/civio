import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { PaperScope, Project, Path, Color, Point, Item, Group, Raster, Size } from 'paper';

class Player {
  color: Color;
}

class Tile {
  x: number;
  y: number;
  neighbors: Tile[];
  group: Group;
  // path: Path;

  hasBuilding: boolean;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements AfterViewInit {
  @ViewChild("paperCanvas", { static: false }) canvasElement: ElementRef;

  private scope: PaperScope;
  private project: Project;

  private allTiles: Tile[];
  private tiles: Tile[][];
  private players: Player[];

  constructor() { }

  ngAfterViewInit() {
    this.scope = new PaperScope();
    this.project = new Project(this.canvasElement.nativeElement);

    const rows = 18;
    const columns = 23;
    this.createTiles(rows, columns);
    this.createHexagonGrid(this.tiles);

    const colors: Color[] = []
    for (let i = 0; i < 360; i += 10) {
      const color = new Color(255, 255, 255);
      color.hue = i;
      color.saturation = 1;
      color.brightness = 1;
      colors.push(color);
    }
    for (let i = 0; i < 20; i++) {
      const player = new Player();
      // const randomColorIndex = Math.floor(Math.random() * colors.length);
      // const randomColor = colors[randomColorIndex];
      // colors.splice(randomColorIndex, 1);
      const randomColor = colors.pop();

      player.color = randomColor;
      const emptyTile = this.getEmptyTile();
      this.createCity(player, this.getEmptyTile());
    }

  }

  *range(start: number, end: number): IterableIterator<number> {
    for (let i = start; i <= end; i++) {
      yield i;
    }
  }

  getEmptyTile(): Tile {
    const indexList = [...this.range(0, this.allTiles.length - 1)];
    this.shuffleArray(indexList);
    for (let i = 0; i < indexList.length; i++) {
      const tile = this.allTiles[indexList[i]];
      if (tile.hasBuilding) continue;
      if (tile.neighbors.find((tile) => tile.hasBuilding)) continue;
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
    this.tiles = [];
    this.allTiles = [];
    for (let i = 0; i < rows; i++) {
      this.tiles[i] = [];
      for (let j = 0; j < columns; j++) {
        const tile = new Tile();
        tile.x = j;
        tile.y = i;
        tile.hasBuilding = false;
        tile.neighbors = [];
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
          if (j + rowOffset - 1 >= 0) this.tiles[i][j].neighbors.push(this.tiles[i - 1][j + rowOffset - 1]);
          if (j + rowOffset < columns) this.tiles[i][j].neighbors.push(this.tiles[i - 1][j + rowOffset]);
        }
        if (i + 1 < rows) {
          if (j + rowOffset - 1 >= 0) this.tiles[i][j].neighbors.push(this.tiles[i + 1][j + rowOffset - 1]);
          if (j + rowOffset < columns) this.tiles[i][j].neighbors.push(this.tiles[i + 1][j + rowOffset]);
        }

        // Horizontal neighbors
        if (j - 1 >= 0) {
          this.tiles[i][j].neighbors.push(this.tiles[i][j - 1]);
        }
        if (j + 1 < columns) {
          this.tiles[i][j].neighbors.push(this.tiles[i][j + 1]);
        }
        // if (i + 1 < rows) {
        //   this.tiles[i][j].neighbors.push(this.tiles[i + 1][j]);
        // }
      }
    }
    console.log(this.tiles);
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
      'assets/images/unlicensed/m11-247-forest.png',
      'assets/images/unlicensed/ddg-44-forest.png'
    ]
    const mapGroup = new Group();
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const forestImagePath = forestImages[Math.floor(Math.random() * forestImages.length)];
        const hexagon = this.createTexturedHexagon(forestImagePath, hexSize);
        // const hexagon = this.createHexagon(hexSize);
        this.tiles[j][i].group = hexagon;
        const offset = new Point(
          xOffset * i + ((j % 2 == 0) ? xOffset / 2 : 0),
          yOffset * j
        )
        hexagon.translate(offset);
        // hexagon.position.x = xOffset * i;
        // if (j % 2 == 0) {
        //   hexagon.position.x += xOffset / 2;
        // }
        // hexagon.position.y = yOffset * j;
        // hexagon.fillColor = new Color(Math.random(), Math.random(), Math.random())
        mapGroup.addChild(hexagon);
      }
    }
    mapGroup.translate(new Point(25 * Math.sqrt(3), 50));
    this.project.activeLayer.addChild(mapGroup);
  }

  createTexturedHexagon(imgPath: string, hexSize: number): Group {
    const clippingGroup = new Group();
    clippingGroup.clipped = true;
    const hexagon = this.createHexagon(hexSize);
    hexagon.clipMask = true;
    clippingGroup.addChild(hexagon);
    const raster = new Raster(imgPath);
    clippingGroup.addChild(raster);

    const pathBounds = hexagon.bounds;
    const rasterBounds = raster.bounds;
    const widthRatio = rasterBounds.x / pathBounds.x;
    const heightRatio = rasterBounds.y / pathBounds.y;
    const scaleFactor = 1 / Math.min(widthRatio, heightRatio);
    raster.scale(scaleFactor);

    return clippingGroup;
  }

  createHexagon(radius: number): Path {
    const hexagon = new Path();
    hexagon.strokeColor = new Color(0, 0, 0);
    const angle = ((2 * Math.PI) / 6);
    for (let i = 0; i <= 6; i++) {
      hexagon.add(new Point(radius * Math.sin(angle * i), radius * Math.cos(angle * i)))
    }
    return hexagon;
  }

  createCity(player: Player, tile: Tile) {
    tile.hasBuilding = true;
    // (tile.group.children[1] as Raster).visible = false;
    this.project.importSVG('assets/svg/city-svgrepo-com-filled.svg', (item: Item) => {
      item.scale(0.1);
      item.position = tile.group.position;
      const tilePath = tile.group.children[0];
      tilePath.fillColor = player.color;

      // item.fillColor = new Color(1, 1, 1);
      // item.strokeColor = new Color(0, 0, 0);
      // item.strokeWidth = .2;
    });

  }

  // Fisher-Yates shuffle
  shuffleArray<T>(array: Array<T>) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.round(Math.random() * i);
      const item = array[i];
      array[i] = array[j];
      array[j] = item;
    }
  }

  canvasScroll(event) {
    event.preventDefault();
    console.log('test', event);
  }

  // resizeCanvas() {
  //   this.canvasElement.nativeElement.width = imgWidth;
  //   this.canvasElement.nativeElement.height = this.imageElement.nativeElement.height;
  //   this.canvasElement.nativeElement.style = `transform: translate(${-imgWidth}px, 0)`;
  // }

}
