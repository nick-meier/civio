import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { PaperScope, Project, Path, Color, Point, Item } from 'paper';

class Player {
  color: Color;
}

class Tile {
  x: number;
  y: number;
  neighbors: Tile[];
  path: Path;

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

    const rows = 10;
    const columns = 8;
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

  getEmptyTile(): Tile {
    return this.allTiles.find((tile: Tile) => {
      if (tile.hasBuilding) return false;
      if (tile.neighbors.find((tile: Tile) => tile.hasBuilding)) return false;
      return true;
    });
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
  createHexagonGrid(tiles: Object[][]) {
    const columns = tiles[0].length;
    const rows = tiles.length;
    const hexSize = 50;
    const hexHeight = 2 * hexSize;
    const yOffset = 3 / 4 * hexHeight;
    const hexWidth = Math.sqrt(3) * hexSize;
    const xOffset = hexWidth;
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const hexagon = this.createHexagon(hexSize);
        this.tiles[j][i].path = hexagon;
        hexagon.position.x = xOffset * i;
        if (j % 2 == 0) {
          hexagon.position.x += xOffset / 2;
        }
        hexagon.position.y = yOffset * j;
        // hexagon.fillColor = new Color(Math.random(), Math.random(), Math.random())
        this.project.activeLayer.addChild(hexagon);
      }
    }
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
    this.project.importSVG('assets/svg/city-svgrepo-com.svg', (item: Item) => {
      item.scale(0.1);
      item.position = tile.path.position;
      tile.path.fillColor = player.color;
    });

  }

  // resizeCanvas() {
  //   this.canvasElement.nativeElement.width = imgWidth;
  //   this.canvasElement.nativeElement.height = this.imageElement.nativeElement.height;
  //   this.canvasElement.nativeElement.style = `transform: translate(${-imgWidth}px, 0)`;
  // }

}
