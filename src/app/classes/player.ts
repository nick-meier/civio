import { Color, Project, Group } from 'paper';
import { City } from './building';
import { Unit, Engineer } from './unit';

export class Player {
    public color: Color;
    public cities: City[];
    public units: Unit[];
    public currency: number;
    public upkeepCost: number;

    constructor() {
        this.cities = [];
        this.units = [];
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
    }

    createEngineer(project: Project, unitGroup: Group): Engineer {
        const engineer = new Engineer(project, unitGroup);
        engineer.owner = this;
        this.upkeepCost += engineer.upkeepCost;
        return engineer;
    }
}
