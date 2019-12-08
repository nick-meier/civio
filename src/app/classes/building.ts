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
    private spoke0: Path;
    private spoke1: Path;
    private spoke2: Path;
    private spoke3: Path;
    private spoke4: Path;
    private spoke5: Path;

    constructor(position: Point, buildingGroup: Group) {
        super();
        this.hub = new Path.Circle(position, 20);
        this.hub.fillColor = new Color(1, 1, 1);
        this.hub.strokeColor = new Color(0, 0, 0);
        buildingGroup.addChild(this.hub);


        const hexRadius = 50;
        const topLeftPoint = new Point(0, 0);
        const spokeSize = new Point(hexRadius / 2, hexRadius * Math.sqrt(3) / 2);
        this.spoke0 = new Path.Rectangle(topLeftPoint, spokeSize);
        const mapOffset = new Point(25 * Math.sqrt(3), 50);
        // this.spoke0.translate(mapOffset);
        // this.spoke0.translate(new Point(25 * Math.sqrt(3) - spokeSize.x / 2, 0));
        this.spoke0.fillColor = new Color(1, 1, 1);
        this.spoke0.strokeColor = new Color(0, 0, 0);
        this.spoke0.visible = false;

        this.spoke1 = this.spoke0.clone() as Path;
        this.spoke2 = this.spoke0.clone() as Path;
        this.spoke3 = this.spoke0.clone() as Path;
        this.spoke4 = this.spoke0.clone() as Path;
        this.spoke5 = this.spoke0.clone() as Path;

        this.spoke0.rotate(210, this.spoke0.bounds.topCenter);
        this.spoke1.rotate(270, this.spoke1.bounds.topCenter);
        this.spoke2.rotate(330, this.spoke2.bounds.topCenter);
        this.spoke3.rotate(30, this.spoke3.bounds.topCenter);
        this.spoke4.rotate(90, this.spoke4.bounds.topCenter);
        this.spoke5.rotate(150, this.spoke5.bounds.topCenter);

        buildingGroup.addChild(this.spoke0);
        buildingGroup.addChild(this.spoke1);
        buildingGroup.addChild(this.spoke2);
        buildingGroup.addChild(this.spoke3);
        buildingGroup.addChild(this.spoke4);
        buildingGroup.addChild(this.spoke5);
    }

    onAddToTile(tile: Tile) {
        super.onAddToTile(tile);

        this.spoke0.rotate(-210, this.spoke0.bounds.topCenter);
        this.spoke1.rotate(-270, this.spoke1.bounds.topCenter);
        this.spoke2.rotate(-330, this.spoke2.bounds.topCenter);
        this.spoke3.rotate(-30, this.spoke3.bounds.topCenter);
        this.spoke4.rotate(-90, this.spoke4.bounds.topCenter);
        this.spoke5.rotate(-150, this.spoke5.bounds.topCenter);

        const newPosition = tile.group.bounds.center.subtract(new Point(0, - 50 * Math.sqrt(3) / 4));
        this.spoke0.position = newPosition;
        this.spoke1.position = newPosition;
        this.spoke2.position = newPosition;
        this.spoke3.position = newPosition;
        this.spoke4.position = newPosition;
        this.spoke5.position = newPosition;

        this.spoke0.rotate(210, this.spoke0.bounds.topCenter);
        this.spoke1.rotate(270, this.spoke1.bounds.topCenter);
        this.spoke2.rotate(330, this.spoke2.bounds.topCenter);
        this.spoke3.rotate(30, this.spoke3.bounds.topCenter);
        this.spoke4.rotate(90, this.spoke4.bounds.topCenter);
        this.spoke5.rotate(150, this.spoke5.bounds.topCenter);

        if (Boolean(tile.neighbors[0]) && tile.neighbors[0].hasBuilding()) this.spoke0.visible = true;
        if (Boolean(tile.neighbors[1]) && tile.neighbors[1].hasBuilding()) this.spoke1.visible = true;
        if (Boolean(tile.neighbors[2]) && tile.neighbors[2].hasBuilding()) this.spoke2.visible = true;
        if (Boolean(tile.neighbors[3]) && tile.neighbors[3].hasBuilding()) this.spoke3.visible = true;
        if (Boolean(tile.neighbors[4]) && tile.neighbors[4].hasBuilding()) this.spoke4.visible = true;
        if (Boolean(tile.neighbors[5]) && tile.neighbors[5].hasBuilding()) this.spoke5.visible = true;
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
