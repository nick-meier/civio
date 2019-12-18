import { Tile } from './tile';
import { GameComponent } from '../game/game.component';
import { Player } from './player';
import { Engineer } from './unit';
import { Point, Path, Color, Group, Item } from 'paper';

export abstract class Building {
    protected tile: Tile;
    public owner: Player;
    public upkeepCost: number;

    constructor(owner: Player) {
        this.owner = owner;
        this.owner.buildings.push(this);
        this.upkeepCost = 0;
    }

    onAddToTile(tile: Tile) {
        this.tile = tile;
    }

    destroy() {
        console.log('DESTROY BUILD');
        if (this.tile) this.tile.removeBuilding();
        if (this.owner) {
            const index = this.owner.buildings.indexOf(this);
            this.owner.buildings.splice(index, 1);
        }
    }
}

export class Road {
    private innerSpokes: Path[];
    private outerSpokes: Path[];

    constructor(roadInnerGroup: Group, roadOuterGroup: Group, tile: Tile) {
        this.innerSpokes = [null, null, null, null, null, null];
        this.outerSpokes = [null, null, null, null, null, null];

        const hexRadius = 50;
        const topLeftPoint = new Point(0, 0);
        const spokeSize = new Point(hexRadius / 2 / 2, hexRadius * Math.sqrt(3) / 2);
        spokeSize.y *= 1.02; // Extend past tile to avoid pixel seams
        const innerSpokeSize = new Point(spokeSize.x * .75, spokeSize.y);
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

        roadOuterGroup.addChildren(this.outerSpokes);
        roadInnerGroup.addChildren(this.innerSpokes);
    }

    public toggleSpoke(index: number, visible: boolean) {
        this.innerSpokes[index].visible = visible;
        this.outerSpokes[index].visible = visible;
    }
}

export class RoadHub extends Building {
    private outer: Path;
    private inner: Path;

    constructor(owner: Player, position: Point, roadHubInnerGroup: Group, roadHubOuterGroup: Group) {
        super(owner);
        const size = 18;
        this.inner = new Path.Circle(position, .9 * size);
        this.inner.fillColor = new Color(1, 1, 1);
        this.outer = new Path.Circle(position, size);
        this.outer.fillColor = new Color(0, 0, 0);
        roadHubInnerGroup.addChild(this.inner);
        roadHubOuterGroup.addChild(this.outer);
        this.upkeepCost = 1;
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
    public productivity: number;
    public production: Production;

    constructor(owner: Player) {
        super(owner);
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
            const engineer = this.owner.createEngineer();
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
        this.forCity.spawnEngineer();
    }
}

export class CurrencyProduction extends Production {
    amount: number;

    constructor(city: City, amount: number) {
        super(city);
        this.workTotal = 5;
        this.amount = amount;
    }

    complete() {
        this.forCity.owner.Currency += this.amount;
        // console.log('Currency production complete: ', this.forCity.owner.Currency);
    }
}
