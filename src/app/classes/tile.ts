import { Group, Point, Raster, Path, Color } from 'paper';
import { Unit } from './unit';
import { Building, Road } from './building';
import { Player } from './player';

export class Tile {
  x: number;
  y: number;
  neighbors: Tile[];
  group: Group;
  // path: Path;

  biome: string;

  outline: Group;

  canvasPoints: Point[];
  innerPoints: Point[];

  private unit: Unit;
  private building: Building;
  public road: Road;

  constructor(biome: string) {
    this.biome = biome;
    this.neighbors = new Array<Tile>(6);
  }

  createVisuals(radius: number, position: Point, texturePath: string, outlineGroup: Group, tileGroup: Group) {
    this.canvasPoints = [];
    this.innerPoints = [];
    const angle = ((2 * Math.PI) / 6);
    // Generating the initial point as the final point
    for (let i = 0; i <= 6; i++) {
      const point = new Point(radius * Math.sin(angle * i), radius * Math.cos(angle * i));
      const innerPoint = point.multiply(.9);
      this.canvasPoints.push(point);
      this.innerPoints.push(innerPoint);
    }
    const hexagon = this.createTexturedHexagon(texturePath);
    tileGroup.addChild(hexagon);
    this.createOutlines(outlineGroup, position);
  }

  createTexturedHexagon(imgPath: string): Group {
    const clippingGroup = new Group();
    clippingGroup.name = 'Texture Clip';
    clippingGroup.clipped = true;
    const hexagon = this.createHexagon();
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

    this.group = clippingGroup;

    return clippingGroup;
  }

  createHexagon(): Path {
    const hexagon = new Path();
    hexagon.strokeColor = new Color(0, 0, 0);
    this.canvasPoints.forEach(point => {
      hexagon.add(point);
    });
    return hexagon;
  }

  createOutlines(outlinesGroup: Group, position: Point) {
    const outlineGroup = new Group();
    outlineGroup.name = 'Outline';
    outlinesGroup.addChild(outlineGroup);
    for (let i = 0; i < 6; i++) {
      const outlinePoints = [
        this.canvasPoints[i],
        this.innerPoints[i],
        this.innerPoints[i + 1],
        this.canvasPoints[i + 1],
        this.canvasPoints[i]
      ];
      const outline = new Path(outlinePoints);
      outlineGroup.addChild(outline);
      outline.visible = false;
      // outline.fillColor = new Color(.7, .8, .9);
    }
    outlineGroup.position = position;
    this.outline = outlineGroup;
  }

  setOutlineColor(color: Color) {
    this.outline.children.forEach((child) => {
      child.visible = true;
      child.fillColor = color;
    });
  }

  addUnit(unit: Unit) {
    if (this.unit != null) return;

    unit.tile = this;
    this.unit = unit;
  }

  hasUnit(): boolean {
    return Boolean(this.unit);
  }

  addBuilding(building: Building, roadGroup: Group) {
    if (this.building != null) return;

    if (this.road == null) {
      this.road = new Road(roadGroup, this);
    }

    this.building = building;
    building.onAddToTile(this);
  }

  hasBuilding(): boolean {
    return Boolean(this.building);
  }

  owner(): Player {
    return this.building.owner;
  }
}
