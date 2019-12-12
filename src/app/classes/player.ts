import { Color } from 'paper';
import { City } from './building';
import { Unit } from './unit';

export class Player {
    public color: Color;
    public cities: City[];
    public units: Unit[];
    public productivity: number;

    constructor() {
        this.cities = [];
        this.units = [];
        this.productivity = 0;
    }

    upkeep() {
        this.units.forEach(unit => {
            if (unit.upkeepCost > this.productivity) {
                unit.destroy();
            } else {
                this.productivity -= unit.upkeepCost;
            }
        });
    }
}
