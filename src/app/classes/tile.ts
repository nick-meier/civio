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
    const offsetAngle = -((2 * Math.PI) / 6);
    const initialAngle = 3 * offsetAngle;
    // Generating the initial point as the final point
    for (let i = 0; i <= 6; i++) {
      const point = new Point(
        radius * Math.sin(initialAngle + offsetAngle * i),
        radius * Math.cos(initialAngle + offsetAngle * i)
      );
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
    const outlines = [];
    for (let i = 0; i < 6; i++) {
      const outlinePoints = [
        this.canvasPoints[i],
        this.innerPoints[i],
        this.innerPoints[i + 1],
        this.canvasPoints[i + 1],
        this.canvasPoints[i]
      ];
      const outline = new Path(outlinePoints);
      outlines.push(outline);
      // outlineGroup.addChild(outline);
      outline.visible = false;
      // outline.fillColor = new Color(.7, .8, .9);
    }
    outlineGroup.addChildren(outlines);
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

    if (unit.icon) {
      unit.icon.position = this.group.position;
      unit.icon.visible = true;
    }
    unit.tile = this;
    this.unit = unit;
  }

  removeUnit(unit: Unit) {
    if (!this.unit) return;

    if (unit.icon) {
      unit.icon.visible = false;
    }
    unit.tile = null;
    this.unit = null;
  }

  hasUnit(): boolean {
    return Boolean(this.unit);
  }

  addBuilding(building: Building, roadInnerGroup: Group, roadOuterGroup) {
    if (this.building != null) return;

    if (this.road == null) {
      this.road = new Road(roadInnerGroup, roadOuterGroup, this);
    }


    this.building = building;
    this.updateOutlines();

    building.onAddToTile(this);
  }

  removeBuilding() {
    if (this.building === null) return;

    this.road = null;
    this.building = null;
    this.updateOutlines();
  }

  hasBuilding(): boolean {
    return Boolean(this.building);
  }

  updateOutlines() {
    if (!this.building) {
      this.outline.children.forEach(item => item.visible = false);
    } else {
      this.setOutlineColor(this.building.owner.color);
      for (let i = 0; i < 6; i++) {
        if (!this.neighbors[i]) continue;
        // draw outline if no building adjacent or 
        if (!this.neighbors[i].building || this.neighbors[i].building.owner !== this.building.owner) {
          this.outline.children[i].visible = true;
        } else {
          this.outline.children[i].visible = false;
          this.neighbors[i].outline.children[(i + 3) % 6].visible = false;
        }
      }
    }
  }

  owner(): Player {
    return this.building.owner;
  }
}
