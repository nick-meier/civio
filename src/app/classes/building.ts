import { Tile } from './tile';
import { GameComponent } from '../game/game.component';
import { Player } from './player';
import { Engineer } from './unit';
import { Point, Path, Color, Group, Item } from 'paper';

export abstract class Building {
    protected tile: Tile;
    public owner: Player;

    onAddToTile(tile: Tile) {
        this.tile = tile;
    }
}

export class Road extends Building {
    private hub: Path;
    private innerSpokes: Path[];
    private outerSpokes: Path[];

    constructor(position: Point, buildingGroup: Group) {
        super();
        this.hub = new Path.Circle(position, 20);
        this.hub.fillColor = new Color(1, 1, 1);
        this.hub.strokeColor = new Color(0, 0, 0);
        buildingGroup.addChild(this.hub);

        this.innerSpokes = [null, null, null, null, null, null];
        this.outerSpokes = [null, null, null, null, null, null];

        const hexRadius = 50;
        const topLeftPoint = new Point(0, 0);
        const spokeSize = new Point(hexRadius / 2, hexRadius * Math.sqrt(3) / 2);
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

        for (let i = 0; i < 6; i++) {
            const rotationAmount = (210 + 60 * i) % 360;
            this.outerSpokes[i].rotate(
                rotationAmount,
                this.outerSpokes[i].bounds.topCenter
            );
            this.innerSpokes[i].rotate(
                rotationAmount,
                this.innerSpokes[i].bounds.topCenter
            );
        }

        buildingGroup.addChildren(this.outerSpokes);
        buildingGroup.addChildren(this.innerSpokes);
    }

    onAddToTile(tile: Tile) {
        super.onAddToTile(tile);

        const newPosition = tile.group.bounds.center.subtract(new Point(0, - 50 * Math.sqrt(3) / 4));
        for (let i = 0; i < 6; i++) {
            const rotationAmount = (-210 - 60 * i) % 360;
            this.outerSpokes[i].rotate(rotationAmount, this.outerSpokes[i].bounds.topCenter);
            this.innerSpokes[i].rotate(rotationAmount, this.innerSpokes[i].bounds.topCenter);
            this.outerSpokes[i].position = newPosition;
            this.innerSpokes[i].position = newPosition;
            this.outerSpokes[i].rotate((210 + 60 * i) % 360, this.outerSpokes[i].bounds.topCenter);
            this.innerSpokes[i].rotate(-rotationAmount, this.innerSpokes[i].bounds.topCenter);
            if (Boolean(tile.neighbors[i]) && tile.neighbors[i].hasBuilding()) {
                this.outerSpokes[i].visible = true;
                this.innerSpokes[i].visible = true;
            }
        }
    }
}

export class City extends Building {
    public game: GameComponent;
    public productivity: number;
    public production: Production;

    constructor(game: GameComponent, owner: Player) {
        super();
        this.game = game;
        this.owner = owner;
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
            emptyTile.addUnit(engineer);
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
