import { Color, Project, Group } from 'paper';
import { City, Building } from './building';
import { Unit, Engineer } from './unit';
import { GameComponent } from '../game/game.component';

export class Player {
    public game: GameComponent;
    public color: Color;
    public cities: City[];
    public units: Unit[];
    public buildings: Building[];
    public currency: number;
    public upkeepCost: number;

    constructor(game: GameComponent) {
        this.game = game;
        this.cities = [];
        this.units = [];
        this.buildings = [];
        this.currency = 0;
        this.upkeepCost = 0;
    }

    upkeep() {
        const unitsCopy = this.units.slice(0);
        unitsCopy.forEach(unit => {
            if (unit.upkeepCost > this.currency) {
                unit.destroy();
            } else {
                this.currency -= unit.upkeepCost;
            }
        });
        const buildingsCopy = this.buildings.slice(0);
        buildingsCopy.forEach(building => {
            if (building.upkeepCost > this.currency) {
                building.destroy();
            } else {
                this.currency -= building.upkeepCost;
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
