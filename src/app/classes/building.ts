import { Tile } from './tile';
import { GameComponent } from '../game/game.component';
import { Player } from './player';

export class Building {

}

export class City extends Building {
    public game: GameComponent;
    public tile: Tile;
    public owner: Player;
    public productivity: number;
    public production: Production;

    constructor(owner: Player) {
        super();
        this.owner = owner;
    }

    produce() {
        if (this.production) {
            this.production.produce(this.productivity);
        }
    }

    spawnEngineer() {
        const emptyTile = (this.tile.hasUnit() ? this.tile.neighbors.find(tile => !tile.hasUnit()) : this.tile);
        if (emptyTile) {
            const engineer = this.game.createEngineer(this.owner);
            emptyTile.addUnit(engineer);
        }
    }
}

abstract class Production {
    forCity: City;
    workDone: number;
    workTotal: number;

    constructor(city: City) {
        this.forCity = city;
    }

    produce(productivity: number) {
        this.workDone += productivity;
        if (this.workDone >= this.workTotal) {
            this.complete();
        }
    }

    abstract complete();
}

class EngineerProduction extends Production {
    complete() {
        this.forCity.spawnEngineer();
    }
}