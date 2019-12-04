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

    constructor(game: GameComponent, owner: Player, tile: Tile) {
        super();
        this.game = game;
        this.owner = owner;
        this.tile = tile;
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