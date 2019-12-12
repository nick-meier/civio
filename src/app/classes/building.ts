import { Tile } from './tile';
import { GameComponent } from '../game/game.component';
import { Player } from './player';
import { Engineer } from './unit';
import { Point, Path, Color, Group, Item } from 'paper';

export abstract class Building {
    protected tile: Tile;
    public owner: Player;

    constructor(owner: Player) {
        this.owner = owner;
    }

    onAddToTile(tile: Tile) {
        this.tile = tile;
    }
}

export class Road {
    private innerSpokes: Path[];
    private outerSpokes: Path[];

    constructor(roadGroup: Group, tile: Tile) {
        this.innerSpokes = [null, null, null, null, null, null];
        this.outerSpokes = [null, null, null, null, null, null];

        const hexRadius = 50;
        const topLeftPoint = new Point(0, 0);
        const spokeSize = new Point(hexRadius / 2 / 2, hexRadius * Math.sqrt(3) / 2);
        const innerSpokeSize = new Point(spokeSize.x * .9, spokeSize.y);
        this.outerSpokes[0] = new Path.Rectangle(topLeftPoint, spokeSize);
        this.innerSpokes[0] = new Path.Rectangle(topLeftPoint, innerSpokeSize);
        // const mapOffset = new Point(25 * Math.sqrt(3), 50);
        // this.outerSpokes[0].translate(mapOffset);
        // this.outerSpokes[0].translate(new Point(25 * Math.sqrt(3) - spokeSize.x / 2, 0));
        this.outerSpokes[0].fillColor = new Color(0, 0, 0);
        this.innerSpokes[0].fillColor = new Color(1, 1, 1);
        // this.outerSpokes[0].strokeColor = new Color(0, 0, 0);
        this.innerSpokes[0].visible = false;
        this.outerSpokes[0].visible = false;

        for (let i = 1; i < 6; i++) {
            this.outerSpokes[i] = (this.outerSpokes[0].clone() as Path);
            this.innerSpokes[i] = this.innerSpokes[0].clone() as Path;
        }

        const spokePosition = tile.group.bounds.center.subtract(new Point(0, - 50 * Math.sqrt(3) / 4));
        for (let i = 0; i < 6; i++) {
            const rotationAmount = (210 + 60 * i) % 360;
            this.outerSpokes[i].position = spokePosition;
            this.innerSpokes[i].position = spokePosition;
            this.outerSpokes[i].rotate(
                rotationAmount,
                this.outerSpokes[i].bounds.topCenter
            );
            this.innerSpokes[i].rotate(
                rotationAmount,
                this.innerSpokes[i].bounds.topCenter
            );
        }

        roadGroup.addChildren(this.outerSpokes);
        roadGroup.addChildren(this.innerSpokes);
    }

    public toggleSpoke(index: number, visible: boolean) {
        this.innerSpokes[index].visible = visible;
        this.outerSpokes[index].visible = visible;
    }
}

export class RoadHub extends Building {
    private hub: Path;


    constructor(owner: Player, position: Point, buildingGroup: Group) {
        super(owner);
        this.hub = new Path.Circle(position, 20);
        this.hub.fillColor = new Color(1, 1, 1);
        this.hub.strokeColor = new Color(0, 0, 0);
        buildingGroup.addChild(this.hub);
    }

    onAddToTile(tile: Tile) {
        super.onAddToTile(tile);

        for (let i = 0; i < 6; i++) {
            if (Boolean(tile.neighbors[i]) && tile.neighbors[i].hasBuilding() && tile.owner() === tile.neighbors[i].owner()) {
                tile.road.toggleSpoke(i, true);
                tile.neighbors[i].road.toggleSpoke((i + 3) % 6, true);
            }
        }
    }
}

export class City extends Building {
    public game: GameComponent;
    public productivity: number;
    public production: Production;

    constructor(owner: Player, game: GameComponent) {
        super(owner);
        this.game = game;
    }

    produce() {
        if (this.production) {
            this.production.produce(this.productivity);
        }
    }

    startProduction(production: Production) {
        if (this.production) return;
        this.production = production;
    }

    spawnEngineer(): Engineer {
        const emptyTile = (this.tile.hasUnit() ? this.tile.neighbors.find(tile => Boolean(tile) && !tile.hasUnit()) : this.tile);
        if (emptyTile) {
            const engineer = this.game.createEngineer(this.owner);
            engineer.move(emptyTile);
            return engineer;
        }
        return null;
    }
}

abstract class Production {
    forCity: City;
    workDone: number;
    workTotal: number;

    constructor(city: City) {
        this.forCity = city;
        this.workDone = 0;
    }

    produce(productivity: number) {
        this.workDone += productivity;
        if (this.workDone >= this.workTotal) {
            this.forCity.production = null;
            this.complete();
        }
    }

    abstract complete();
}

export class EngineerProduction extends Production {
    constructor(city: City) {
        super(city);
        this.workTotal = 10;
    }

    complete() {
        const engineer = this.forCity.spawnEngineer();
        if (engineer) {
            engineer.owner = this.forCity.owner;
            this.forCity.owner.engineers.push(engineer);
        }
    }
}
