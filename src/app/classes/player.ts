import { Color, Project, Group } from 'paper';
import { City, Building } from './building';
import { Unit, Engineer } from './unit';
import { GameComponent } from '../game/game.component';
import { Subject, BehaviorSubject } from 'rxjs';

export class Player {
    public game: GameComponent;
    public color: Color;
    public cities: City[];
    public units: Unit[];
    public buildings: Building[];
    private _currency: number;
    public get Currency() { return this._currency; }
    public set Currency(value) {
        const diff = value - this._currency;
        this.Score += diff;

        this._currency = value;
    }
    public upkeepCost: number;

    private _score: number; // Maybe this should be calculated by another component if score should be disable-able
    private get Score() { return this._score; }
    private set Score(value) {
        this._score = value;
        this.scoreSubject.next(this._score);
    }
    public scoreSubject: BehaviorSubject<number>;

    constructor(game: GameComponent) {
        this.game = game;
        this.cities = [];
        this.units = [];
        this.buildings = [];
        this._currency = 0;
        this.upkeepCost = 0;
        this._score = 0;

        this.scoreSubject = new BehaviorSubject<number>(0);
    }

    upkeep() {
        const unitsCopy = this.units.slice(0);
        unitsCopy.forEach(unit => {
            if (unit.upkeepCost > this.Currency) {
                unit.destroy();
            } else {
                this.Currency -= unit.upkeepCost;
            }
        });
        const buildingsCopy = this.buildings.slice(0);
        buildingsCopy.forEach(building => {
            if (building.upkeepCost > this.Currency) {
                building.destroy();
            } else {
                this.Currency -= building.upkeepCost;
            }
        });
    }

    createEngineer(): Engineer {
        const engineer = new Engineer(this.game.project, this.game.unitGroup);
        engineer.Owner = this;
        this.upkeepCost += engineer.upkeepCost;
        return engineer;
    }
}
